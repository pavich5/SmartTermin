using System;
using System.Collections.Generic;
using System.Globalization;
using System.Linq;
using SmartTermin.DataAccess.Repositories;
using SmartTermin.DTOs;

namespace SmartTermin.Services
{
    public class AnalyticsService : IAnalyticsService
    {
        private readonly IBookingRepository _bookingRepository;
        private readonly IServiceRepository _serviceRepository;
        private readonly IUserRepository _userRepository;

        public AnalyticsService(
            IBookingRepository bookingRepository,
            IServiceRepository serviceRepository,
            IUserRepository userRepository)
        {
            _bookingRepository = bookingRepository;
            _serviceRepository = serviceRepository;
            _userRepository = userRepository;
        }

        public async Task<DashboardStatsDto> GetDashboardStatsAsync(Guid artistUserId, string period)
        {
            var artist = await _userRepository.GetArtistByUserIdAsync(artistUserId)
                ?? throw new InvalidOperationException("Artist profile not found");

            var (currentStart, currentEnd, previousStart, previousEnd) = GetDateRange(period);

            var currentBookings = await _bookingRepository.GetBookingsForArtistInDateRangeAsync(artist.Id, currentStart, currentEnd);
            var previousBookings = await _bookingRepository.GetBookingsForArtistInDateRangeAsync(artist.Id, previousStart, previousEnd);

            var completedCurrent = currentBookings.Where(b => b.Status == "completed" || b.Status == "confirmed").ToList();
            var completedPrevious = previousBookings.Where(b => b.Status == "completed" || b.Status == "confirmed").ToList();

            var currentRevenue = completedCurrent.Sum(b => b.TotalPrice ?? 0);
            var previousRevenue = completedPrevious.Sum(b => b.TotalPrice ?? 0);
            var revenueChange = CalculatePercentageChange(previousRevenue, currentRevenue);

            var currentBookingsCount = completedCurrent.Count;
            var previousBookingsCount = completedPrevious.Count;
            var bookingsChange = CalculatePercentageChange(previousBookingsCount, currentBookingsCount);

            var currentClients = completedCurrent.Select(b => b.ClientId).Distinct().ToList();
            var previousClients = completedPrevious.Select(b => b.ClientId).Distinct().ToList();
            var newClientsCount = currentClients.Count(c => !previousClients.Contains(c));
            
            var previousNewClientsList = new List<Guid>();
            foreach (var clientId in previousClients)
            {
                if (!await HasPreviousBookings(clientId, previousStart))
                {
                    previousNewClientsList.Add(clientId);
                }
            }
            var previousNewClientsCount = previousNewClientsList.Count;
            var newClientsChange = CalculatePercentageChange(previousNewClientsCount, newClientsCount);

            var returningClientsCount = currentClients.Count(c => previousClients.Contains(c));
            var returningPercentage = currentClients.Any() ? (decimal)returningClientsCount / currentClients.Count * 100 : 0;
            
            var previousReturningList = new List<Guid>();
            foreach (var clientId in previousClients)
            {
                if (await HasPreviousBookings(clientId, previousStart))
                {
                    previousReturningList.Add(clientId);
                }
            }
            var previousReturningCount = previousReturningList.Count;
            var previousReturningPercentage = previousClients.Any() ? (decimal)previousReturningCount / previousClients.Count * 100 : 0;
            var returningChange = CalculatePercentageChange(previousReturningPercentage, returningPercentage);

            var avgBookingValue = completedCurrent.Any() ? completedCurrent.Average(b => b.TotalPrice ?? 0) : 0;

            var activeServices = await _serviceRepository.GetServicesForArtistAsync(artist.Id);
            var activeServicesCount = activeServices.Count;

            return new DashboardStatsDto
            {
                Revenue = new RevenueDto
                {
                    Total = currentRevenue,
                    Change = revenueChange
                },
                TotalBookings = new TotalBookingsDto
                {
                    Count = currentBookingsCount,
                    Change = bookingsChange
                },
                NewClients = new NewClientsDto
                {
                    Count = newClientsCount,
                    Change = newClientsChange
                },
                ReturningClients = new ReturningClientsDto
                {
                    Percentage = Math.Round(returningPercentage, 2),
                    Change = returningChange
                },
                AvgBookingValue = new AvgBookingValueDto
                {
                    Amount = Math.Round(avgBookingValue, 2),
                    Currency = "MKD"
                },
                ActiveServices = new ActiveServicesDto
                {
                    Count = activeServicesCount
                }
            };
        }

        public async Task<PopularServicesResponseDto> GetPopularServicesAsync(Guid artistUserId)
        {
            var artist = await _userRepository.GetArtistByUserIdAsync(artistUserId)
                ?? throw new InvalidOperationException("Artist profile not found");

            var services = await _serviceRepository.GetServicesForArtistAsync(artist.Id);
            var allBookings = await _bookingRepository.GetBookingsForArtistAsync(artist.Id, null);
            var completedBookings = allBookings.Where(b => b.Status == "completed" || b.Status == "confirmed").ToList();

            var response = new PopularServicesResponseDto();

            foreach (var service in services)
            {
                var serviceBookings = completedBookings
                    .Where(b => b.BookingServices.Any(bs => bs.ServiceId == service.Id))
                    .ToList();

                var bookingsCount = serviceBookings.Count;
                var revenue = serviceBookings.Sum(b => b.BookingServices
                    .Where(bs => bs.ServiceId == service.Id)
                    .Sum(bs => bs.Price));

                response.Services.Add(new PopularServiceDto
                {
                    Id = service.Id.ToString(),
                    Name = service.Name,
                    Bookings = bookingsCount,
                    Revenue = revenue.ToString("C0", CultureInfo.InvariantCulture)
                });
            }

            response.Services = response.Services
                .OrderByDescending(s => s.Bookings)
                .ToList();

            return response;
        }

        private (DateTime currentStart, DateTime currentEnd, DateTime previousStart, DateTime previousEnd) GetDateRange(string period)
        {
            var now = DateTime.UtcNow;
            DateTime currentStart, currentEnd, previousStart, previousEnd;

            switch (period?.ToLowerInvariant())
            {
                case "week":
                    currentStart = now.AddDays(-(int)now.DayOfWeek).Date;
                    currentEnd = currentStart.AddDays(6).Date.AddDays(1).AddTicks(-1);
                    previousStart = currentStart.AddDays(-7);
                    previousEnd = currentStart.AddTicks(-1);
                    break;
                case "year":
                    currentStart = new DateTime(now.Year, 1, 1);
                    currentEnd = new DateTime(now.Year, 12, 31, 23, 59, 59);
                    previousStart = new DateTime(now.Year - 1, 1, 1);
                    previousEnd = new DateTime(now.Year - 1, 12, 31, 23, 59, 59);
                    break;
                case "month":
                default:
                    currentStart = new DateTime(now.Year, now.Month, 1);
                    currentEnd = currentStart.AddMonths(1).AddTicks(-1);
                    previousStart = currentStart.AddMonths(-1);
                    previousEnd = currentStart.AddTicks(-1);
                    break;
            }

            return (currentStart, currentEnd, previousStart, previousEnd);
        }

        private string CalculatePercentageChange(decimal previous, decimal current)
        {
            if (previous == 0)
            {
                return current > 0 ? "+100%" : "0%";
            }

            var change = ((current - previous) / previous) * 100;
            var sign = change >= 0 ? "+" : "";
            return $"{sign}{change:F0}%";
        }

        private string CalculatePercentageChange(int previous, int current)
        {
            return CalculatePercentageChange((decimal)previous, (decimal)current);
        }

        private async Task<bool> HasPreviousBookings(Guid clientId, DateTime beforeDate)
        {
            var bookings = await _bookingRepository.GetBookingsForClientAsync(clientId, null);
            return bookings.Any(b => b.BookingDate < beforeDate && (b.Status == "completed" || b.Status == "confirmed"));
        }
    }
}

