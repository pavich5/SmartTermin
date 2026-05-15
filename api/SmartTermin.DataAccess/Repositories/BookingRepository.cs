using System;
using System.Collections.Generic;
using System.Linq;
using SmartTermin.DataAccess.DataContext;
using SmartTermin.DomainModels.Models;
using Microsoft.EntityFrameworkCore;

namespace SmartTermin.DataAccess.Repositories
{
    public class BookingRepository : IBookingRepository
    {
        private readonly SmartTerminDbContext _context;

        public BookingRepository(SmartTerminDbContext context)
        {
            _context = context;
        }

        public async Task<Service?> GetServiceByIdAsync(Guid serviceId)
        {
            return await _context.Services
                .AsNoTracking()
                .FirstOrDefaultAsync(s => s.Id == serviceId && s.IsActive);
        }

        public async Task<IList<Service>> GetServicesByIdsAsync(List<Guid> serviceIds)
        {
            return await _context.Services
                .AsNoTracking()
                .Where(s => serviceIds.Contains(s.Id) && s.IsActive)
                .ToListAsync();
        }

        public async Task<WorkingHour?> GetWorkingHourForDayAsync(Guid artistId, int dayOfWeek)
        {
            return await _context.WorkingHours
                .AsNoTracking()
                .FirstOrDefaultAsync(wh => wh.ArtistId == artistId && wh.DayOfWeek == dayOfWeek);
        }

        public async Task<IList<Booking>> GetBookingsForArtistOnDateAsync(Guid artistId, DateTime date)
        {
            // For slot calculation, we only need BookingTime, TotalDurationMinutes, and Status
            // No need to include BookingServices and Service - this significantly improves performance
            // Using AsNoTracking() and removing Includes reduces data transfer and improves speed
            return await _context.Bookings
                .AsNoTracking()
                .Where(b => b.ArtistId == artistId && b.BookingDate == date.Date)
                .ToListAsync();
        }

        public async Task<Booking> CreateBookingAsync(Booking booking)
        {
            _context.Bookings.Add(booking);
            await _context.SaveChangesAsync();
            return booking;
        }

        public async Task<Booking?> GetBookingByIdAsync(Guid bookingId)
        {
            return await _context.Bookings
                .Include(b => b.BookingServices)
                    .ThenInclude(bs => bs.Service)
                .Include(b => b.Artist)
                    .ThenInclude(a => a.User)
                .Include(b => b.Client)
                .FirstOrDefaultAsync(b => b.Id == bookingId);
        }

        public async Task UpdateBookingAsync(Booking booking)
        {
            _context.Bookings.Update(booking);
            await _context.SaveChangesAsync();
        }

        public async Task<IList<Booking>> GetBookingsForArtistAsync(Guid artistId, DateTime? dateFilter)
        {
            var query = _context.Bookings
                .AsNoTracking()
                .Include(b => b.BookingServices)
                    .ThenInclude(bs => bs.Service)
                .Include(b => b.Client)
                .Where(b => b.ArtistId == artistId);

            if (dateFilter.HasValue)
            {
                var date = dateFilter.Value.Date;
                query = query.Where(b => b.BookingDate == date);
            }

            return await query
                .OrderBy(b => b.BookingDate)
                .ThenBy(b => b.BookingTime)
                .ToListAsync();
        }

        public async Task<IList<Booking>> GetBookingsForClientAsync(Guid clientId, DateTime? dateFilter)
        {
            var query = _context.Bookings
                .AsNoTracking()
                .Include(b => b.BookingServices)
                    .ThenInclude(bs => bs.Service)
                .Include(b => b.Artist)
                    .ThenInclude(a => a.User)
                .Where(b => b.ClientId == clientId);

            if (dateFilter.HasValue)
            {
                var date = dateFilter.Value.Date;
                query = query.Where(b => b.BookingDate == date);
            }

            return await query
                .OrderByDescending(b => b.BookingDate)
                .ThenByDescending(b => b.BookingTime)
                .ToListAsync();
        }

        public async Task<IList<Booking>> GetBookingsForArtistInDateRangeAsync(Guid artistId, DateTime startDate, DateTime endDate)
        {
            return await _context.Bookings
                .AsNoTracking()
                .Include(b => b.BookingServices)
                    .ThenInclude(bs => bs.Service)
                .Include(b => b.Client)
                .Where(b => b.ArtistId == artistId && 
                           b.BookingDate >= startDate.Date && 
                           b.BookingDate <= endDate.Date)
                .OrderBy(b => b.BookingDate)
                .ThenBy(b => b.BookingTime)
                .ToListAsync();
        }

        public async Task<Artist?> GetArtistByIdAsync(Guid artistId)
        {
            return await _context.Artists
                .AsNoTracking()
                .FirstOrDefaultAsync(a => a.Id == artistId);
        }

        public async Task<IList<Booking>> GetBookingsNeedingRemindersAsync(DateTime currentTime, TimeSpan reminderOffset, bool reminder24h)
        {
            // Calculate the target booking time (current time + reminder offset)
            var targetBookingTime = currentTime.Add(reminderOffset);
            var targetDate = targetBookingTime.Date;
            var targetTime = targetBookingTime.TimeOfDay;
            
            // Allow a 5-minute window to account for timing differences
            var timeWindow = TimeSpan.FromMinutes(5);
            var minTime = targetTime >= timeWindow 
                ? targetTime.Subtract(timeWindow) 
                : TimeSpan.Zero;
            var maxTime = targetTime.Add(timeWindow);

            return await _context.Bookings
                .AsNoTracking()
                .Include(b => b.Client)
                .Include(b => b.Artist)
                    .ThenInclude(a => a.User)
                .Include(b => b.BookingServices)
                    .ThenInclude(bs => bs.Service)
                .Where(b => 
                    b.Status == "confirmed" && // Only confirmed bookings
                    b.BookingDate == targetDate &&
                    b.BookingTime >= minTime &&
                    b.BookingTime <= maxTime &&
                    (reminder24h ? !b.Reminder24hSent : !b.Reminder1hSent)) // Check which reminder hasn't been sent
                .ToListAsync();
        }

        public async Task<IList<(Guid ClientId, string Name, string Email, string Phone, int BookingCount)>> GetClientStatisticsForArtistAsync(Guid artistId, int? limit)
        {
            // Optimized query that groups in the database instead of loading all bookings
            // Group by ClientId first, then join with Users to get client details
            var groupedQuery = _context.Bookings
                .AsNoTracking()
                .Where(b => b.ArtistId == artistId && b.ClientId != null)
                .GroupBy(b => b.ClientId)
                .Select(g => new
                {
                    ClientId = g.Key,
                    BookingCount = g.Count()
                });

            var baseQuery = groupedQuery
                .Join(
                    _context.Users,
                    bookingGroup => bookingGroup.ClientId,
                    user => user.Id,
                    (bookingGroup, user) => new
                    {
                        ClientId = bookingGroup.ClientId,
                        Name = user.FullName ?? string.Empty,
                        Email = user.Email ?? string.Empty,
                        Phone = user.Phone ?? string.Empty,
                        BookingCount = bookingGroup.BookingCount
                    })
                .OrderByDescending(x => x.BookingCount);

            var query = limit.HasValue && limit.Value > 0
                ? baseQuery.Take(limit.Value)
                : baseQuery;

            var results = await query.ToListAsync();
            
            return results.Select(r => (
                r.ClientId,
                r.Name,
                r.Email,
                r.Phone,
                r.BookingCount
            )).ToList();
        }
    }
}

