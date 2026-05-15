using System;
using System.Collections.Concurrent;
using System.Collections.Generic;
using System.Globalization;
using System.Linq;
using System.Security.Cryptography;
using System.Text.Json;
using System.Threading;
using SmartTermin.DataAccess.Repositories;
using SmartTermin.DTOs;
using Microsoft.Extensions.Logging;
using DomainBooking = SmartTermin.DomainModels.Models.Booking;
using DomainBookingService = SmartTermin.DomainModels.Models.BookingService;
using DomainService = SmartTermin.DomainModels.Models.Service;
using DomainUser = SmartTermin.DomainModels.Models.User;

namespace SmartTermin.Services
{
    public class BookingService : IBookingService
    {
        private readonly IBookingRepository _bookingRepository;
        private readonly IUserRepository _userRepository;
        private readonly IHolidayRepository _holidayRepository;
        private readonly ISalonHolidayRepository _salonHolidayRepository;
        private readonly IBlockedClientService _blockedClientService;
        private readonly IWalkInClientService _walkInClientService;
        private readonly IFirebaseNotificationService _notificationService;
        private readonly IEmailService _emailService;
        private readonly Microsoft.Extensions.Logging.ILogger<BookingService> _logger;

        // Use semaphores per booking ID to ensure only one notification is sent per booking
        // This prevents race conditions where multiple threads try to send notifications for the same booking
        private static readonly ConcurrentDictionary<Guid, SemaphoreSlim> _bookingSemaphores = new ConcurrentDictionary<Guid, SemaphoreSlim>();
        private static readonly HashSet<Guid> _notifiedBookingIds = new HashSet<Guid>();
        private static readonly object _notifiedLock = new object();

        public BookingService(
            IBookingRepository bookingRepository, 
            IUserRepository userRepository, 
            IHolidayRepository holidayRepository, 
            ISalonHolidayRepository salonHolidayRepository,
            IBlockedClientService blockedClientService,
            IWalkInClientService walkInClientService,
            IFirebaseNotificationService notificationService,
            IEmailService emailService,
            Microsoft.Extensions.Logging.ILogger<BookingService> logger)
        {
            _bookingRepository = bookingRepository;
            _userRepository = userRepository;
            _holidayRepository = holidayRepository;
            _salonHolidayRepository = salonHolidayRepository;
            _blockedClientService = blockedClientService;
            _walkInClientService = walkInClientService;
            _notificationService = notificationService;
            _emailService = emailService;
            _logger = logger;
        }

        public async Task<BookingResponseDto> CreateBookingAsync(Guid clientId, CreateBookingRequestDto request)
        {
            if (request.ServiceIds == null || request.ServiceIds.Count == 0)
            {
                throw new InvalidOperationException("At least one service must be selected");
            }

            // Validate all services exist and belong to the artist
            var services = new List<DomainService>();
            foreach (var serviceId in request.ServiceIds)
            {
                var service = await _bookingRepository.GetServiceByIdAsync(serviceId)
                    ?? throw new KeyNotFoundException($"Service {serviceId} not found");

                if (service.ArtistId != request.ArtistId)
                {
                    throw new InvalidOperationException($"Service {serviceId} does not belong to the specified artist");
                }

                services.Add(service);
            }

            var bookingDate = ParseDate(request.Date);
            var bookingTime = ParseTime(request.Time);

            // Check if booking is for today and time has passed
            var now = DateTime.UtcNow;
            if (bookingDate.Date == now.Date)
            {
                var currentTime = now.TimeOfDay;
                if (bookingTime < currentTime)
                {
                    throw new InvalidOperationException("Cannot book a time slot that has already passed for today");
                }
            }

            // Check if the date is a holiday (artist or salon)
            var artist = await _bookingRepository.GetArtistByIdAsync(request.ArtistId)
                ?? throw new KeyNotFoundException("Artist not found");
            
            // Check if client is blocked by artist or salon
            var isBlocked = await _blockedClientService.IsClientBlockedAsync(request.ArtistId, artist.SalonId, clientId);
            if (isBlocked)
            {
                throw new InvalidOperationException("You are blocked from booking with this artist or salon");
            }
            
            var isArtistHoliday = await _holidayRepository.IsHolidayAsync(request.ArtistId, bookingDate);
            if (isArtistHoliday)
            {
                throw new InvalidOperationException("Artist is not available on the selected day (holiday)");
            }

            // Check salon holiday if artist belongs to a salon
            if (artist.SalonId.HasValue)
            {
                var isSalonHoliday = await _salonHolidayRepository.IsHolidayAsync(artist.SalonId.Value, bookingDate);
                if (isSalonHoliday)
                {
                    throw new InvalidOperationException("Salon is closed on the selected day (holiday)");
                }
            }

            var workingHour = await _bookingRepository.GetWorkingHourForDayAsync(request.ArtistId, (int)bookingDate.DayOfWeek);
            if (workingHour == null || !workingHour.IsAvailable)
            {
                throw new InvalidOperationException("Artist is not available on the selected day");
            }

            // Calculate total duration for all services
            var totalDurationMinutes = services.Sum(s => s.DurationMinutes);
            var serviceDuration = TimeSpan.FromMinutes(totalDurationMinutes);
            var slotStart = bookingTime;
            var slotEnd = bookingTime + serviceDuration;

            if (slotStart < workingHour.StartTime || slotEnd > workingHour.EndTime)
            {
                throw new InvalidOperationException("Requested time is outside of working hours");
            }

            // Check if client already has a booking with this artist for any of the SAME SERVICES on this date
            var existingClientBookings = await _bookingRepository.GetBookingsForArtistOnDateAsync(request.ArtistId, bookingDate);
            var serviceIdsSet = request.ServiceIds.ToHashSet();
            var clientHasSameServiceBooking = existingClientBookings
                .Where(b => b.ClientId == clientId && 
                           !string.Equals(b.Status, "cancelled", StringComparison.OrdinalIgnoreCase))
                .Any(b => b.BookingServices != null && 
                         b.BookingServices.Any(bs => serviceIdsSet.Contains(bs.ServiceId)));
            
            if (clientHasSameServiceBooking)
            {
                var conflictingServiceNames = services
                    .Where(s => existingClientBookings
                        .Where(b => b.ClientId == clientId && 
                                   !string.Equals(b.Status, "cancelled", StringComparison.OrdinalIgnoreCase))
                        .Any(b => b.BookingServices != null && 
                                 b.BookingServices.Any(bs => bs.ServiceId == s.Id)))
                    .Select(s => s.Name)
                    .ToList();
                
                throw new InvalidOperationException($"You already have a booking for {string.Join(", ", conflictingServiceNames)} with this artist on this date. You can only book the same service once per day.");
            }

            var bookings = existingClientBookings;
            
            // Use artist-specific buffer time
            var sortedBookings = bookings
                .Where(b => !string.Equals(b.Status, "cancelled", StringComparison.OrdinalIgnoreCase))
                .OrderBy(b => b.BookingTime)
                .ToList();

            // Get break times from working hour
            var breakTimes = ParseBreaksFromWorkingHour(workingHour);
            
            if (!IsSlotAvailable(slotStart, totalDurationMinutes, artist.BufferMinutes, sortedBookings, workingHour.EndTime, breakTimes))
            {
                throw new InvalidOperationException("Requested time slot is not available");
            }

            // Calculate total price
            var totalPrice = services.Sum(s => s.Price);

            var booking = new DomainBooking
            {
                ArtistId = request.ArtistId,
                ClientId = clientId,
                BookingDate = bookingDate,
                BookingTime = bookingTime,
                Status = "confirmed",
                TotalDurationMinutes = totalDurationMinutes,
                TotalPrice = totalPrice,
                Notes = request.Notes ?? string.Empty,
                CustomerName = request.CustomerName,
                CustomerEmail = request.CustomerEmail,
                CustomerPhone = request.CustomerPhone,
                CancellationReason = string.Empty, // Required by database, set to empty string for new bookings
                BookingServices = services.Select(s => new DomainBookingService
                {
                    ServiceId = s.Id,
                    Price = s.Price,
                    DurationMinutes = s.DurationMinutes
                }).ToList()
            };

            booking = await _bookingRepository.CreateBookingAsync(booking);

            // Reload booking with Artist and User navigation properties for notification
            var bookingWithArtist = await _bookingRepository.GetBookingByIdAsync(booking.Id);
            if (bookingWithArtist == null)
            {
                _logger.LogWarning($"Could not reload booking {booking.Id} after creation");
            }

            // Send notification to artist about new booking
            await SendNewBookingNotificationToArtistAsync(bookingWithArtist ?? booking);

            // Send confirmation email to client
            await SendBookingConfirmationEmailToClientAsync(booking, artist, services);

            // Return the first service ID for backward compatibility (or we could update the DTO to return all service IDs)
            return new BookingResponseDto
            {
                Id = booking.Id.ToString(),
                ArtistId = booking.ArtistId.ToString(),
                ServiceId = services.First().Id.ToString(),
                Date = booking.BookingDate.ToString("yyyy-MM-dd"),
                Time = booking.BookingTime.ToString(@"hh\:mm"),
                Status = booking.Status,
                Duration = booking.TotalDurationMinutes,
                Price = booking.TotalPrice ?? 0,
                CustomerName = booking.CustomerName,
                CustomerEmail = booking.CustomerEmail,
                CustomerPhone = booking.CustomerPhone,
                Notes = booking.Notes
            };
        }

        public async Task<AvailableSlotsResponseDto> GetAvailableSlotsAsync(Guid artistId, List<Guid> serviceIds, DateTime date)
        {
            if (serviceIds == null || serviceIds.Count == 0)
            {
                throw new InvalidOperationException("At least one service must be specified");
            }

            // Validate all services exist and belong to the artist - fetch all at once to avoid N+1 queries
            var services = await _bookingRepository.GetServicesByIdsAsync(serviceIds);
            if (services.Count != serviceIds.Count)
            {
                var foundIds = services.Select(s => s.Id).ToHashSet();
                var missingIds = serviceIds.Where(id => !foundIds.Contains(id)).ToList();
                throw new KeyNotFoundException($"Services not found: {string.Join(", ", missingIds)}");
            }

            // Verify all services belong to the artist
            var invalidServices = services.Where(s => s.ArtistId != artistId).ToList();
            if (invalidServices.Any())
            {
                throw new InvalidOperationException($"Services do not belong to the specified artist: {string.Join(", ", invalidServices.Select(s => s.Id))}");
            }

            var artist = await _bookingRepository.GetArtistByIdAsync(artistId)
                ?? throw new KeyNotFoundException("Artist not found");

            // Check if the date is a holiday (artist or salon)
            var holiday = await _holidayRepository.GetHolidayForDateAsync(artistId, date);
            if (holiday != null)
            {
                return new AvailableSlotsResponseDto
                {
                    SlotIntervalMinutes = artist.SlotIntervalMinutes,
                    BufferMinutes = artist.BufferMinutes,
                    IsHoliday = true,
                    HolidayDescription = holiday.Description
                };
            }

            // Check salon holiday if artist belongs to a salon
            if (artist.SalonId.HasValue)
            {
                var salonHoliday = await _salonHolidayRepository.GetHolidayForDateAsync(artist.SalonId.Value, date);
                if (salonHoliday != null)
                {
                    return new AvailableSlotsResponseDto
                    {
                        SlotIntervalMinutes = artist.SlotIntervalMinutes,
                        BufferMinutes = artist.BufferMinutes,
                        IsHoliday = true,
                        HolidayDescription = salonHoliday.Description ?? "Salon holiday"
                    };
                }
            }

            var workingHour = await _bookingRepository.GetWorkingHourForDayAsync(artistId, (int)date.DayOfWeek);
            if (workingHour == null || !workingHour.IsAvailable)
            {
                return new AvailableSlotsResponseDto
                {
                    SlotIntervalMinutes = artist.SlotIntervalMinutes,
                    BufferMinutes = artist.BufferMinutes
                };
            }

            // Use artist-specific configuration
            var slotIntervalMinutes = artist.SlotIntervalMinutes;
            var bufferMinutes = artist.BufferMinutes;
            // Calculate total duration for all selected services
            var serviceDurationMinutes = services.Sum(s => s.DurationMinutes);
            
            // When SlotIntervalMinutes = 0, BufferMinutes is used as spacing between slots
            // When SlotIntervalMinutes > 0, BufferMinutes is still the buffer after bookings
            bool useBufferAsSpacing = slotIntervalMinutes <= 0;

            var bookings = await _bookingRepository.GetBookingsForArtistOnDateAsync(artistId, date);
            
            // Sort bookings by time for easier processing
            var sortedBookings = bookings
                .Where(b => !string.Equals(b.Status, "cancelled", StringComparison.OrdinalIgnoreCase))
                .OrderBy(b => b.BookingTime)
                .ToList();

            // Get break times from working hour
            var breakTimes = ParseBreaksFromWorkingHour(workingHour);

            var slots = new List<AvailableSlotDto>();
            
            var currentSlot = workingHour.StartTime;
            var endTime = workingHour.EndTime;
            var lastPossibleStart = endTime - TimeSpan.FromMinutes(serviceDurationMinutes);
            string? nextAvailableSlot = null;

            // Get current time for comparison (only relevant if booking for today)
            var now = DateTime.UtcNow;
            var isToday = date.Date == now.Date;
            var currentTime = now.TimeOfDay;

            // When SlotIntervalMinutes = 0: Generate slots every BufferMinutes
            // - Show ALL slots (including taken ones) spaced by BufferMinutes
            // - Example: If BufferMinutes=5, show 09:00, 09:05, 09:10, 09:15, 09:20...
            // - If booking is 09:00-09:20, show 09:00, 09:05, 09:10, 09:15 as taken, 09:20 as available
            // When SlotIntervalMinutes > 0: Generate slots at fixed intervals (e.g., 15 min = 09:00, 09:15, 09:30...)
            
            bool useFixedIntervals = slotIntervalMinutes > 0;
            TimeSpan slotSpacing;
            if (!useFixedIntervals)
            {
                // SlotIntervalMinutes = 0: Generate slots every BufferMinutes (show all slots, mark taken as unavailable)
                slotSpacing = TimeSpan.FromMinutes(Math.Max(1, bufferMinutes)); // At least 1 min to avoid infinite loop
            }
            else
            {
                // SlotIntervalMinutes > 0: Generate slots at fixed intervals
                slotSpacing = TimeSpan.FromMinutes(slotIntervalMinutes);
            }

            // Generate slots
            while (currentSlot <= lastPossibleStart)
            {
                var slotEnd = currentSlot + TimeSpan.FromMinutes(serviceDurationMinutes);
                
                // Check if this slot fits within working hours
                if (slotEnd > endTime)
                {
                    break;
                }

                // Check if this slot is available (no overlap with existing bookings + buffer + break times)
                // When SlotIntervalMinutes = 0, BufferMinutes is spacing, so don't apply buffer after bookings
                var effectiveBuffer = useBufferAsSpacing ? 0 : bufferMinutes;
                var isAvailable = IsSlotAvailable(currentSlot, serviceDurationMinutes, effectiveBuffer, sortedBookings, endTime, breakTimes);
                
                // If booking for today, check if the slot time has already passed
                if (isToday && currentSlot < currentTime)
                {
                    // Mark past slots as unavailable
                    isAvailable = false;
                }
                
                // Check if this slot is unavailable due to a break
                var isBreak = false;
                if (!isAvailable)
                {
                    foreach (var (breakStart, breakEnd) in breakTimes)
                    {
                        if (currentSlot < breakEnd && slotEnd > breakStart)
                        {
                            isBreak = true;
                            break;
                        }
                    }
                }
                
                var slotDto = new AvailableSlotDto
                {
                    Time = FormatTime(currentSlot),
                    Available = isAvailable,
                    IsBreak = isBreak
                };

                if (isAvailable && nextAvailableSlot == null)
                {
                    // This is the first available slot
                    nextAvailableSlot = FormatTime(currentSlot);
                }

                slots.Add(slotDto);
                
                // Move to next slot position
                // When SlotIntervalMinutes = 0: Generate ALL slots every BufferMinutes (don't skip taken slots)
                // When SlotIntervalMinutes > 0: Generate slots at fixed intervals
                currentSlot += slotSpacing;
            }

            return new AvailableSlotsResponseDto 
            { 
                Slots = slots,
                NextAvailableSlot = nextAvailableSlot,
                SlotIntervalMinutes = artist.SlotIntervalMinutes,
                BufferMinutes = artist.BufferMinutes
            };
        }

        /// <summary>
        /// Parses breaks from WorkingHour's BreaksJson
        /// </summary>
        private static IList<(TimeSpan Start, TimeSpan End)> ParseBreaksFromWorkingHour(DomainModels.Models.WorkingHour? workingHour)
        {
            var breaks = new List<(TimeSpan Start, TimeSpan End)>();
            
            if (workingHour == null || string.IsNullOrWhiteSpace(workingHour.BreaksJson))
            {
                return breaks;
            }

            try
            {
                var breakDtos = JsonSerializer.Deserialize<List<BreakDto>>(workingHour.BreaksJson);
                if (breakDtos != null)
                {
                    foreach (var breakDto in breakDtos)
                    {
                        if (TimeSpan.TryParseExact(breakDto.Start, @"hh\:mm", CultureInfo.InvariantCulture, out var startTime) &&
                            TimeSpan.TryParseExact(breakDto.End, @"hh\:mm", CultureInfo.InvariantCulture, out var endTime))
                        {
                            breaks.Add((startTime, endTime));
                        }
                    }
                }
            }
            catch
            {
                // If JSON parsing fails, return empty list
            }

            return breaks;
        }

        /// <summary>
        /// Checks if a time slot is available considering existing bookings, buffer time, and break times
        /// </summary>
        private static bool IsSlotAvailable(
            TimeSpan slotStart, 
            int serviceDurationMinutes, 
            int bufferMinutes,
            IList<DomainBooking> sortedBookings, 
            TimeSpan workingEndTime,
            IList<(TimeSpan Start, TimeSpan End)> breakTimes)
        {
            var slotEnd = slotStart + TimeSpan.FromMinutes(serviceDurationMinutes);
            
            // Check if slot fits within working hours
            if (slotEnd > workingEndTime)
            {
                return false;
            }

            // Check for overlaps with break times
            foreach (var (breakStart, breakEnd) in breakTimes)
            {
                if (slotStart < breakEnd && slotEnd > breakStart)
                {
                    return false;
                }
            }

            // Check for overlaps with existing bookings
            // Only check bookings that could potentially overlap with this slot (optimization)
            foreach (var booking in sortedBookings)
            {
                var bookingStart = booking.BookingTime;
                var bookingEnd = booking.BookingTime + TimeSpan.FromMinutes(booking.TotalDurationMinutes);

                // Skip bookings that end before or at this slot starts - they can't overlap
                // Use <= to allow slots starting exactly when booking ends (e.g., booking ends 16:20, slot starts 16:20)
                if (bookingEnd <= slotStart)
                {
                    continue; // This booking is too early, skip it
                }

                // Skip bookings that start after or at this slot ends - they can't overlap
                // Use >= to allow slots ending exactly when booking starts (e.g., slot ends 15:50, booking starts 15:50)
                if (bookingStart >= slotEnd)
                {
                    break; // All remaining bookings are later, no need to check further
                }

                // Check for actual overlap: 
                // A slot overlaps with a booking if the slot's time period intersects with the booking's time period.
                // Two intervals [A, B) and [C, D) overlap if: A < D && B > C
                // But we need strict overlap - slots that end exactly when booking starts, or start exactly when booking ends, should NOT overlap
                // Slot overlaps if: slot starts BEFORE booking ends AND slot ends AFTER booking starts
                // BUT we exclude the exact boundary cases:
                // - If slot ends exactly when booking starts: NO overlap (slot can end at 12:00, booking can start at 12:00)
                // - If slot starts exactly when booking ends: NO overlap (slot can start at 12:30, booking ends at 12:30)
                if (slotStart < bookingEnd && slotEnd > bookingStart)
                {
                    // However, we need to exclude exact boundary matches
                    // If slot ends exactly when booking starts, it's available
                    if (slotEnd == bookingStart)
                    {
                        continue; // Slot ends exactly when booking starts, no overlap
                    }
                    // If slot starts exactly when booking ends, it's available (but we already skip this in the check above)
                    return false; // Slot overlaps with booking, mark as unavailable
                }
            }

            return true;
        }

        /// <summary>
        /// Finds the next available slot after the given slot time
        /// Calculates based on: booking end time + buffer minutes, then rounds to slot interval
        /// </summary>
        private static TimeSpan? FindNextAvailableSlot(
            TimeSpan currentSlot,
            int serviceDurationMinutes,
            int bufferMinutes,
            IList<DomainBooking> sortedBookings,
            TimeSpan workingEndTime,
            TimeSpan slotInterval,
            IList<(TimeSpan Start, TimeSpan End)> breakTimes)
        {
            // Find the booking that ends latest and blocks this slot
            // Buffer time is only applied AFTER bookings, not before
            var blockingBookings = sortedBookings.Where(b =>
            {
                var bookingStart = b.BookingTime;
                var bookingEnd = b.BookingTime + TimeSpan.FromMinutes(b.TotalDurationMinutes);
                var bookingEndWithBuffer = bookingEnd + TimeSpan.FromMinutes(bufferMinutes);
                
                return currentSlot < bookingEndWithBuffer && 
                       (currentSlot + TimeSpan.FromMinutes(serviceDurationMinutes)) > bookingStart;
            }).ToList();

            // Find break times that block this slot
            var blockingBreaks = breakTimes.Where(bt =>
            {
                return currentSlot < bt.End && 
                       (currentSlot + TimeSpan.FromMinutes(serviceDurationMinutes)) > bt.Start;
            }).ToList();

            // Find the latest end time from all blocking bookings
            TimeSpan? latestBlockingEnd = null;
            if (blockingBookings.Any())
            {
                latestBlockingEnd = blockingBookings.Max(b => 
                    b.BookingTime + TimeSpan.FromMinutes(b.TotalDurationMinutes) + TimeSpan.FromMinutes(bufferMinutes));
            }

            // Find the latest break end time
            TimeSpan? latestBreakEnd = null;
            if (blockingBreaks.Any())
            {
                latestBreakEnd = blockingBreaks.Max(bt => bt.End);
            }

            // The next available time is the later of: latest booking end + buffer, or latest break end
            TimeSpan? nextAvailable = null;
            if (latestBlockingEnd.HasValue && latestBreakEnd.HasValue)
            {
                nextAvailable = latestBlockingEnd.Value > latestBreakEnd.Value ? latestBlockingEnd.Value : latestBreakEnd.Value;
            }
            else if (latestBlockingEnd.HasValue)
            {
                nextAvailable = latestBlockingEnd.Value;
            }
            else if (latestBreakEnd.HasValue)
            {
                nextAvailable = latestBreakEnd.Value;
            }
            else
            {
                return null;
            }

            // Round up to the nearest slot interval
            var slotIntervalMinutes = (int)slotInterval.TotalMinutes;
            var roundedMinutes = (int)Math.Ceiling(nextAvailable.Value.TotalMinutes / slotIntervalMinutes) * slotIntervalMinutes;
            var roundedTime = TimeSpan.FromMinutes(roundedMinutes);

            // Check if it fits within working hours
            if (roundedTime + TimeSpan.FromMinutes(serviceDurationMinutes) > workingEndTime)
            {
                return null;
            }

            // Verify this slot is actually available (doesn't conflict with other bookings or breaks)
            if (!IsSlotAvailable(roundedTime, serviceDurationMinutes, bufferMinutes, sortedBookings, workingEndTime, breakTimes))
            {
                // If the rounded time is not available, try the next slot interval
                var nextSlot = roundedTime + slotInterval;
                if (nextSlot + TimeSpan.FromMinutes(serviceDurationMinutes) <= workingEndTime)
                {
                    // Recursively find the next available after this slot
                    return FindNextAvailableSlot(nextSlot, serviceDurationMinutes, bufferMinutes, sortedBookings, workingEndTime, slotInterval, breakTimes);
                }
                return null;
            }

            return roundedTime;
        }

        public async Task<ArtistBookingsResponseDto> GetArtistBookingsAsync(Guid artistUserId, DateTime? dateFilter, DateTime? startDate = null, DateTime? endDate = null)
        {
            var artist = await _userRepository.GetArtistByUserIdAsync(artistUserId)
                ?? throw new InvalidOperationException("Artist profile not found");

            IList<DomainBooking> bookings;
            if (startDate.HasValue && endDate.HasValue)
            {
                bookings = await _bookingRepository.GetBookingsForArtistInDateRangeAsync(artist.Id, startDate.Value, endDate.Value);
            }
            else
            {
                bookings = await _bookingRepository.GetBookingsForArtistAsync(artist.Id, dateFilter);
            }

            var response = new ArtistBookingsResponseDto();

            foreach (var booking in bookings)
            {
                var serviceNames = booking.BookingServices?
                    .Where(bs => bs.Service != null)
                    .Select(bs => bs.Service!.Name)
                    .ToList() ?? new List<string>();
                
                var serviceName = serviceNames.Count > 0 
                    ? string.Join(" + ", serviceNames)
                    : "Service";
                
                response.Bookings.Add(new ArtistBookingDto
                {
                    Id = booking.Id.ToString(),
                    Client = booking.CustomerName,
                    Service = serviceName,
                    Time = booking.BookingTime.ToString(@"hh\:mm"),
                    Date = booking.BookingDate.ToString("yyyy-MM-dd"),
                    Status = booking.Status,
                    Duration = $"{booking.TotalDurationMinutes} min",
                    Price = FormatPrice(booking.TotalPrice ?? 0)
                });
            }

            return response;
        }

        public async Task<ClientBookingsResponseDto> GetClientBookingsAsync(Guid clientId, DateTime? dateFilter)
        {
            var bookings = await _bookingRepository.GetBookingsForClientAsync(clientId, dateFilter);
            var response = new ClientBookingsResponseDto();

            foreach (var booking in bookings)
            {
                var serviceNames = booking.BookingServices?
                    .Where(bs => bs.Service != null)
                    .Select(bs => bs.Service!.Name)
                    .ToList() ?? new List<string>();
                
                var serviceName = serviceNames.Count > 0 
                    ? string.Join(" + ", serviceNames)
                    : "Service";
                
                response.Bookings.Add(new ClientBookingDto
                {
                    Id = booking.Id.ToString(),
                    ArtistId = booking.ArtistId.ToString(),
                    ArtistName = booking.Artist?.BusinessName ?? booking.Artist?.User?.FullName ?? string.Empty,
                    Service = serviceName,
                    Status = booking.Status,
                    Date = booking.BookingDate.ToString("yyyy-MM-dd"),
                    Time = booking.BookingTime.ToString(@"hh\:mm"),
                    Duration = $"{booking.TotalDurationMinutes} min",
                    Price = FormatPrice(booking.TotalPrice ?? 0),
                    MaximumCancellationHours = booking.Artist?.MaximumCancellationHours
                });
            }

            return response;
        }

        public async Task<CancelBookingResponseDto> CancelBookingAsync(Guid bookingId, Guid requesterId)
        {
            var booking = await _bookingRepository.GetBookingByIdAsync(bookingId)
                ?? throw new KeyNotFoundException("Booking not found");

            if (!UserCanModifyBooking(booking, requesterId))
            {
                throw new UnauthorizedAccessException("Not authorized to cancel this booking");
            }

            if (string.Equals(booking.Status, "cancelled", StringComparison.OrdinalIgnoreCase))
            {
                return new CancelBookingResponseDto
                {
                    Success = false,
                    Booking = new CancelledBookingDto
                    {
                        Id = booking.Id.ToString(),
                        Status = booking.Status
                    }
                };
            }

            // Check cancellation deadline based on artist's MaximumCancellationHours
            var artist = booking.Artist;
            if (artist != null && artist.MaximumCancellationHours.HasValue)
            {
                var appointmentDateTime = booking.BookingDate.Date.Add(booking.BookingTime);
                var cancellationDeadline = appointmentDateTime.AddHours(-artist.MaximumCancellationHours.Value);
                var now = DateTime.UtcNow;

                if (now > cancellationDeadline)
                {
                    var hoursUntilAppointment = (appointmentDateTime - now).TotalHours;
                    throw new InvalidOperationException(
                        $"Cannot cancel booking. The cancellation deadline ({artist.MaximumCancellationHours.Value} hours before the appointment) has passed. " +
                        $"The appointment is in {Math.Ceiling(hoursUntilAppointment)} hours.");
                }
            }

            booking.Status = "cancelled";
            booking.CancelledAt = DateTime.UtcNow;
            booking.CancellationReason = "Cancelled";

            await _bookingRepository.UpdateBookingAsync(booking);

            // Send notification to artist about cancelled booking
            await SendCancelledBookingNotificationToArtistAsync(booking);

            return new CancelBookingResponseDto
            {
                Success = true,
                Booking = new CancelledBookingDto
                {
                    Id = booking.Id.ToString(),
                    Status = booking.Status
                }
            };
        }

        public async Task<BookingResponseDto> RebookAppointmentAsync(Guid bookingId, Guid requesterId, RebookBookingRequestDto request)
        {
            var booking = await _bookingRepository.GetBookingByIdAsync(bookingId)
                ?? throw new KeyNotFoundException("Booking not found");

            if (!UserCanModifyBooking(booking, requesterId))
            {
                throw new UnauthorizedAccessException("Not authorized to modify this booking");
            }

            var bookingDate = ParseDate(request.Date);
            var bookingTime = ParseTime(request.Time);

            // Check if booking is for today and time has passed
            var now = DateTime.UtcNow;
            if (bookingDate.Date == now.Date)
            {
                var currentTime = now.TimeOfDay;
                if (bookingTime < currentTime)
                {
                    throw new InvalidOperationException("Cannot book a time slot that has already passed for today");
                }
            }

            // Check if the date is a holiday (artist or salon)
            var artist = await _bookingRepository.GetArtistByIdAsync(booking.ArtistId)
                ?? throw new KeyNotFoundException("Artist not found");
            
            // Check if client is blocked by artist or salon
            var isBlocked = await _blockedClientService.IsClientBlockedAsync(booking.ArtistId, artist.SalonId, requesterId);
            if (isBlocked)
            {
                throw new InvalidOperationException("You are blocked from booking with this artist or salon");
            }
            
            var isArtistHoliday = await _holidayRepository.IsHolidayAsync(booking.ArtistId, bookingDate);
            if (isArtistHoliday)
            {
                throw new InvalidOperationException("Artist is not available on the selected day (holiday)");
            }

            // Check salon holiday if artist belongs to a salon
            if (artist.SalonId.HasValue)
            {
                var isSalonHoliday = await _salonHolidayRepository.IsHolidayAsync(artist.SalonId.Value, bookingDate);
                if (isSalonHoliday)
                {
                    throw new InvalidOperationException("Salon is closed on the selected day (holiday)");
                }
            }

            var workingHour = await _bookingRepository.GetWorkingHourForDayAsync(booking.ArtistId, (int)bookingDate.DayOfWeek);
            if (workingHour == null || !workingHour.IsAvailable)
            {
                throw new InvalidOperationException("Artist is not available on the selected day");
            }

            var duration = booking.TotalDurationMinutes;
            var slotStart = bookingTime;
            var slotEnd = bookingTime + TimeSpan.FromMinutes(duration);

            if (slotStart < workingHour.StartTime || slotEnd > workingHour.EndTime)
            {
                throw new InvalidOperationException("Requested time is outside of working hours");
            }

            var bookings = await _bookingRepository.GetBookingsForArtistOnDateAsync(booking.ArtistId, bookingDate);
            
            // Use artist-specific buffer time
            var sortedBookings = bookings
                .Where(b => !string.Equals(b.Status, "cancelled", StringComparison.OrdinalIgnoreCase) && b.Id != booking.Id)
                .OrderBy(b => b.BookingTime)
                .ToList();

            // Get break times from working hour
            var breakTimes = ParseBreaksFromWorkingHour(workingHour);
            
            if (!IsSlotAvailable(slotStart, duration, artist.BufferMinutes, sortedBookings, workingHour.EndTime, breakTimes))
            {
                throw new InvalidOperationException("Requested time slot is not available");
            }

            booking.BookingDate = bookingDate;
            booking.BookingTime = bookingTime;
            booking.Status = "confirmed";
            booking.CancelledAt = null;
            // Note: Once you create a migration to make CancellationReason nullable in DB, change this to null
            booking.CancellationReason = string.Empty; // Empty string since booking is being rebooked (not cancelled)
            booking.ConfirmedAt = DateTime.UtcNow;

            await _bookingRepository.UpdateBookingAsync(booking);

            var firstService = booking.BookingServices?.FirstOrDefault();
            if (firstService == null)
            {
                throw new InvalidOperationException("Booking has no associated services");
            }

            return new BookingResponseDto
            {
                Id = booking.Id.ToString(),
                ArtistId = booking.ArtistId.ToString(),
                ServiceId = firstService.ServiceId.ToString(),
                Date = booking.BookingDate.ToString("yyyy-MM-dd"),
                Time = booking.BookingTime.ToString(@"hh\:mm"),
                Status = booking.Status,
                Duration = booking.TotalDurationMinutes,
                Price = booking.TotalPrice ?? 0,
                CustomerName = booking.CustomerName,
                CustomerEmail = booking.CustomerEmail,
                CustomerPhone = booking.CustomerPhone,
                Notes = booking.Notes
            };
        }

        public async Task<BookingResponseDto> AddWalkInAsync(Guid artistUserId, WalkInBookingRequestDto request)
        {
            var artist = await _userRepository.GetArtistByUserIdAsync(artistUserId)
                ?? throw new InvalidOperationException("Artist profile not found");

            if (artist.Id != request.ArtistId)
            {
                throw new InvalidOperationException("Artist ID mismatch");
            }

            var service = await _bookingRepository.GetServiceByIdAsync(request.ServiceId)
                ?? throw new KeyNotFoundException("Service not found");

            if (service.ArtistId != artist.Id)
            {
                throw new InvalidOperationException("Service does not belong to this artist");
            }

            var bookingDate = string.IsNullOrWhiteSpace(request.Date)
                ? DateTime.UtcNow.Date
                : ParseDate(request.Date);

            var bookingTime = string.IsNullOrWhiteSpace(request.Time)
                ? RoundToNearestSlot(DateTime.UtcNow.TimeOfDay, service.DurationMinutes)
                : ParseTime(request.Time);

            // Check if booking is for today and time has passed
            var now = DateTime.UtcNow;
            if (bookingDate.Date == now.Date)
            {
                var currentTime = now.TimeOfDay;
                if (bookingTime < currentTime)
                {
                    throw new InvalidOperationException("Cannot book a time slot that has already passed for today");
                }
            }

            // Check if the date is a holiday (artist or salon)
            var isArtistHoliday = await _holidayRepository.IsHolidayAsync(artist.Id, bookingDate);
            if (isArtistHoliday)
            {
                throw new InvalidOperationException("Artist is not available on the selected day (holiday)");
            }

            // Check salon holiday if artist belongs to a salon
            if (artist.SalonId.HasValue)
            {
                var isSalonHoliday = await _salonHolidayRepository.IsHolidayAsync(artist.SalonId.Value, bookingDate);
                if (isSalonHoliday)
                {
                    throw new InvalidOperationException("Salon is closed on the selected day (holiday)");
                }
            }

            var workingHour = await _bookingRepository.GetWorkingHourForDayAsync(artist.Id, (int)bookingDate.DayOfWeek);
            if (workingHour == null || !workingHour.IsAvailable)
            {
                throw new InvalidOperationException("Artist is not available on the selected day");
            }

            var slotStart = bookingTime;
            var slotEnd = slotStart + TimeSpan.FromMinutes(service.DurationMinutes);

            if (slotStart < workingHour.StartTime || slotEnd > workingHour.EndTime)
            {
                slotStart = workingHour.StartTime;
            }

            var bookings = await _bookingRepository.GetBookingsForArtistOnDateAsync(artist.Id, bookingDate);
            
            // Use artist-specific buffer time
            var sortedBookings = bookings
                .Where(b => !string.Equals(b.Status, "cancelled", StringComparison.OrdinalIgnoreCase))
                .OrderBy(b => b.BookingTime)
                .ToList();

            // Get break times from working hour
            var breakTimes = ParseBreaksFromWorkingHour(workingHour);
            
            if (!IsSlotAvailable(slotStart, service.DurationMinutes, artist.BufferMinutes, sortedBookings, workingHour.EndTime, breakTimes))
            {
                throw new InvalidOperationException("Requested time slot is not available");
            }

            // Resolve client ID for walk-in (may create new user if doesn't exist)
            var clientId = await ResolveWalkInClientIdAsync(request);
            
            // Check if client is blocked by artist or salon (after resolving client ID)
            var isBlocked = await _blockedClientService.IsClientBlockedAsync(artist.Id, artist.SalonId, clientId);
            if (isBlocked)
            {
                throw new InvalidOperationException("This client is blocked from booking with this artist or salon");
            }

            var booking = new DomainBooking
            {
                ArtistId = artist.Id,
                ClientId = clientId,
                BookingDate = bookingDate,
                BookingTime = slotStart,
                Status = "confirmed",
                TotalDurationMinutes = service.DurationMinutes,
                TotalPrice = service.Price,
                Notes = request.Notes ?? string.Empty,
                CustomerName = request.ClientName,
                CustomerEmail = request.ClientEmail ?? string.Empty,
                CustomerPhone = request.ClientPhone ?? string.Empty,
                IsWalkIn = true,
                CancellationReason = string.Empty, // Required by database, set to empty string for new bookings
                BookingServices = new List<DomainBookingService>
                {
                    new DomainBookingService
                    {
                        ServiceId = service.Id,
                        Price = service.Price,
                        DurationMinutes = service.DurationMinutes
                    }
                }
            };

            booking = await _bookingRepository.CreateBookingAsync(booking);

            // Save walk-in client to WalkInClients table
            try
            {
                var createWalkInClientRequest = new CreateWalkInClientRequestDto
                {
                    ClientName = request.ClientName,
                    ClientEmail = request.ClientEmail,
                    ClientPhone = request.ClientPhone
                };
                await _walkInClientService.CreateWalkInClientAsync(artist.Id, createWalkInClientRequest);
            }
            catch (Exception ex)
            {
                // Log error but don't fail the booking creation
                _logger.LogError(ex, "Failed to save walk-in client to WalkInClients table for artist {ArtistId}", artist.Id);
            }

            // Reload booking with Artist and User navigation properties for notification
            var bookingWithArtist = await _bookingRepository.GetBookingByIdAsync(booking.Id);
            if (bookingWithArtist == null)
            {
                _logger.LogWarning($"Could not reload booking {booking.Id} after creation");
            }

            // Send notification to artist about new walk-in booking
            await SendNewBookingNotificationToArtistAsync(bookingWithArtist ?? booking);

            return new BookingResponseDto
            {
                Id = booking.Id.ToString(),
                ArtistId = booking.ArtistId.ToString(),
                ServiceId = service.Id.ToString(),
                Date = booking.BookingDate.ToString("yyyy-MM-dd"),
                Time = booking.BookingTime.ToString(@"hh\:mm"),
                Status = booking.Status,
                Duration = booking.TotalDurationMinutes,
                Price = booking.TotalPrice ?? 0,
                CustomerName = booking.CustomerName,
                CustomerEmail = booking.CustomerEmail,
                CustomerPhone = booking.CustomerPhone,
                Notes = booking.Notes
            };
        }

        public async Task<BookingResponseDto> ProposeRescheduleAsync(Guid bookingId, Guid artistId, ProposeRescheduleRequestDto request)
        {
            var booking = await _bookingRepository.GetBookingByIdAsync(bookingId)
                ?? throw new KeyNotFoundException("Booking not found");

            // Verify the artist owns this booking
            var artist = await _userRepository.GetArtistByUserIdAsync(artistId)
                ?? throw new UnauthorizedAccessException("Artist not found");

            if (booking.ArtistId != artist.Id)
            {
                throw new UnauthorizedAccessException("You can only propose reschedule for your own bookings");
            }

            if (booking.Status != "confirmed")
            {
                throw new InvalidOperationException("Can only propose reschedule for confirmed bookings");
            }

            var proposedDate = ParseDate(request.NewDate);
            var proposedTime = ParseTime(request.NewTime);

            // Validate the proposed time slot is available
            var artistEntity = await _bookingRepository.GetArtistByIdAsync(booking.ArtistId)
                ?? throw new KeyNotFoundException("Artist not found");

            var isArtistHoliday = await _holidayRepository.IsHolidayAsync(booking.ArtistId, proposedDate);
            if (isArtistHoliday)
            {
                throw new InvalidOperationException("Artist is not available on the selected day (holiday)");
            }

            if (artistEntity.SalonId.HasValue)
            {
                var isSalonHoliday = await _salonHolidayRepository.IsHolidayAsync(artistEntity.SalonId.Value, proposedDate);
                if (isSalonHoliday)
                {
                    throw new InvalidOperationException("Salon is closed on the selected day (holiday)");
                }
            }

            var workingHour = await _bookingRepository.GetWorkingHourForDayAsync(booking.ArtistId, (int)proposedDate.DayOfWeek);
            if (workingHour == null || !workingHour.IsAvailable)
            {
                throw new InvalidOperationException("Artist is not available on the selected day");
            }

            var duration = booking.TotalDurationMinutes;
            var slotStart = proposedTime;
            var slotEnd = proposedTime + TimeSpan.FromMinutes(duration);

            if (slotStart < workingHour.StartTime || slotEnd > workingHour.EndTime)
            {
                throw new InvalidOperationException("Requested time is outside of working hours");
            }

            var bookings = await _bookingRepository.GetBookingsForArtistOnDateAsync(booking.ArtistId, proposedDate);
            var sortedBookings = bookings
                .Where(b => !string.Equals(b.Status, "cancelled", StringComparison.OrdinalIgnoreCase) && b.Id != booking.Id)
                .OrderBy(b => b.BookingTime)
                .ToList();

            var breakTimes = ParseBreaksFromWorkingHour(workingHour);
            if (!IsSlotAvailable(slotStart, duration, artistEntity.BufferMinutes, sortedBookings, workingHour.EndTime, breakTimes))
            {
                throw new InvalidOperationException("Requested time slot is not available");
            }

            // Update booking with reschedule proposal
            booking.ProposedRescheduleDate = proposedDate;
            booking.ProposedRescheduleTime = proposedTime;
            booking.RescheduleMessage = request.Message ?? string.Empty;
            booking.Status = "pending_reschedule";

            await _bookingRepository.UpdateBookingAsync(booking);

            // Send notification to client
            _ = SendRescheduleProposalNotificationToClientAsync(booking, artistEntity);

            var firstService = booking.BookingServices?.FirstOrDefault();
            return new BookingResponseDto
            {
                Id = booking.Id.ToString(),
                ArtistId = booking.ArtistId.ToString(),
                ServiceId = firstService?.ServiceId.ToString() ?? string.Empty,
                Date = booking.BookingDate.ToString("yyyy-MM-dd"),
                Time = booking.BookingTime.ToString(@"hh\:mm"),
                Status = booking.Status,
                Duration = booking.TotalDurationMinutes,
                Price = booking.TotalPrice ?? 0,
                CustomerName = booking.CustomerName,
                CustomerEmail = booking.CustomerEmail,
                CustomerPhone = booking.CustomerPhone,
                Notes = booking.Notes
            };
        }

        public async Task<BookingResponseDto> AcceptRescheduleAsync(Guid bookingId, Guid clientId)
        {
            var booking = await _bookingRepository.GetBookingByIdAsync(bookingId)
                ?? throw new KeyNotFoundException("Booking not found");

            if (booking.ClientId != clientId)
            {
                throw new UnauthorizedAccessException("You can only accept reschedule for your own bookings");
            }

            if (booking.Status != "pending_reschedule")
            {
                throw new InvalidOperationException("Booking is not pending reschedule");
            }

            if (!booking.ProposedRescheduleDate.HasValue || !booking.ProposedRescheduleTime.HasValue)
            {
                throw new InvalidOperationException("No reschedule proposal found");
            }

            // Update booking to new date/time
            booking.BookingDate = booking.ProposedRescheduleDate.Value;
            booking.BookingTime = booking.ProposedRescheduleTime.Value;
            booking.Status = "confirmed";
            booking.ProposedRescheduleDate = null;
            booking.ProposedRescheduleTime = null;
            booking.RescheduleMessage = string.Empty;
            booking.ConfirmedAt = DateTime.UtcNow;

            await _bookingRepository.UpdateBookingAsync(booking);

            var firstService = booking.BookingServices?.FirstOrDefault();
            return new BookingResponseDto
            {
                Id = booking.Id.ToString(),
                ArtistId = booking.ArtistId.ToString(),
                ServiceId = firstService?.ServiceId.ToString() ?? string.Empty,
                Date = booking.BookingDate.ToString("yyyy-MM-dd"),
                Time = booking.BookingTime.ToString(@"hh\:mm"),
                Status = booking.Status,
                Duration = booking.TotalDurationMinutes,
                Price = booking.TotalPrice ?? 0,
                CustomerName = booking.CustomerName,
                CustomerEmail = booking.CustomerEmail,
                CustomerPhone = booking.CustomerPhone,
                Notes = booking.Notes
            };
        }

        public async Task<CancelBookingResponseDto> DeclineRescheduleAsync(Guid bookingId, Guid clientId)
        {
            var booking = await _bookingRepository.GetBookingByIdAsync(bookingId)
                ?? throw new KeyNotFoundException("Booking not found");

            if (booking.ClientId != clientId)
            {
                throw new UnauthorizedAccessException("You can only decline reschedule for your own bookings");
            }

            if (booking.Status != "pending_reschedule")
            {
                throw new InvalidOperationException("Booking is not pending reschedule");
            }

            // Cancel the booking and clear reschedule proposal
            booking.Status = "cancelled";
            booking.CancelledAt = DateTime.UtcNow;
            booking.CancellationReason = "Client declined reschedule proposal";
            booking.ProposedRescheduleDate = null;
            booking.ProposedRescheduleTime = null;
            booking.RescheduleMessage = string.Empty;

            await _bookingRepository.UpdateBookingAsync(booking);

            // Send notification to artist about cancellation
            _ = SendCancelledBookingNotificationToArtistAsync(booking);

            return new CancelBookingResponseDto
            {
                Success = true,
                Booking = new CancelledBookingDto
                {
                    Id = booking.Id.ToString(),
                    Status = booking.Status
                }
            };
        }

        private static DateTime ParseDate(string input)
        {
            if (!DateTime.TryParseExact(input, "yyyy-MM-dd", CultureInfo.InvariantCulture, DateTimeStyles.None, out var date))
            {
                throw new InvalidOperationException("Invalid date format");
            }
            return date;
        }

        private static TimeSpan ParseTime(string input)
        {
            if (!TimeSpan.TryParseExact(input, @"hh\:mm", CultureInfo.InvariantCulture, out var time))
            {
                throw new InvalidOperationException("Invalid time format");
            }
            return time;
        }

        private static bool HasOverlap(IEnumerable<DomainBooking> bookings, TimeSpan slotStart, int slotDurationMinutes, Guid? ignoreBookingId = null)
        {
            var slotEnd = slotStart + TimeSpan.FromMinutes(slotDurationMinutes);

            foreach (var booking in bookings)
            {
                if (ignoreBookingId.HasValue && booking.Id == ignoreBookingId.Value)
                {
                    continue;
                }

                if (string.Equals(booking.Status, "cancelled", StringComparison.OrdinalIgnoreCase))
                {
                    continue;
                }

                var bookingStart = booking.BookingTime;
                var bookingEnd = booking.BookingTime + TimeSpan.FromMinutes(booking.TotalDurationMinutes);

                if (bookingStart < slotEnd && slotStart < bookingEnd)
                {
                    return true;
                }
            }

            return false;
        }

        private static string FormatTime(TimeSpan time)
        {
            return DateTime.Today.Add(time).ToString("h:mm tt", CultureInfo.InvariantCulture);
        }

        private static string FormatPrice(decimal price)
        {
            return $"{price:F0} ден.";
        }

        private static bool UserCanModifyBooking(DomainBooking booking, Guid userId)
        {
            if (booking.ClientId == userId)
            {
                return true;
            }

            var artistUserId = booking.Artist?.UserId;
            return artistUserId.HasValue && artistUserId.Value == userId;
        }

        private static TimeSpan RoundToNearestSlot(TimeSpan time, int slotMinutes)
        {
            if (slotMinutes <= 0)
            {
                return time;
            }

            var minutes = (int)Math.Ceiling(time.TotalMinutes / slotMinutes) * slotMinutes;
            minutes = Math.Min(minutes, (24 * 60) - slotMinutes);

            return TimeSpan.FromMinutes(minutes);
        }

        private async Task<Guid> ResolveWalkInClientIdAsync(WalkInBookingRequestDto request)
        {
            if (!string.IsNullOrWhiteSpace(request.ClientPhone))
            {
                var existing = await _userRepository.GetUserByPhoneAsync(request.ClientPhone);
                if (existing != null)
                {
                    return existing.Id;
                }
            }

            var newUser = new DomainUser
            {
                Phone = request.ClientPhone ?? string.Empty,
                FullName = request.ClientName,
                Email = request.ClientEmail ?? string.Empty,
                PasswordHash = GenerateRandomPasswordHash(),
                PhoneVerified = true,
                PhoneVerificationCode = "000000",
                PhoneVerificationExpiresAt = null,
                UserType = "client",
                IsActive = true,
                LastLoginAt = null
            };

            var createdUser = await _userRepository.CreateUserAsync(newUser);
            return createdUser.Id;
        }

        private static string GenerateRandomPasswordHash()
        {
            byte[] salt = new byte[16];
            byte[] hash = new byte[32];

            using (var rng = RandomNumberGenerator.Create())
            {
                rng.GetBytes(salt);
                rng.GetBytes(hash);
            }

            return $"{Convert.ToBase64String(salt)}:{Convert.ToBase64String(hash)}";
        }

        private async Task SendNewBookingNotificationToArtistAsync(DomainBooking booking)
        {
            if (booking == null)
            {
                _logger.LogWarning($"Cannot send new booking notification: Booking is null");
                return;
            }

            // Validate booking data
            if (booking.Artist == null || booking.Artist.UserId == Guid.Empty)
            {
                _logger.LogWarning($"Cannot send new booking notification: Artist or UserId is null for booking {booking.Id}");
                return;
            }

            if (booking.Artist.User == null)
            {
                _logger.LogWarning($"Cannot send new booking notification: Artist User not found for booking {booking.Id}");
                return;
            }

            // Get or create a semaphore for this specific booking ID
            // This ensures only one thread can process notifications for this booking at a time
            var semaphore = _bookingSemaphores.GetOrAdd(booking.Id, _ => new SemaphoreSlim(1, 1));

            _logger.LogInformation($"Attempting to send notification for booking {booking.Id}. Waiting for semaphore...");
            
            // Wait to acquire the semaphore (only one thread per booking ID can proceed)
            await semaphore.WaitAsync();
            
            _logger.LogInformation($"Acquired semaphore for booking {booking.Id}. Checking if already notified...");

            try
            {
                // Double-check pattern: Check if notification was already sent
                // This check happens inside the semaphore to prevent race conditions
                bool alreadyNotified = false;
                lock (_notifiedLock)
                {
                    if (_notifiedBookingIds.Contains(booking.Id))
                    {
                        alreadyNotified = true;
                    }
                    else
                    {
                        // Mark as notified immediately to prevent any other thread from sending
                        _notifiedBookingIds.Add(booking.Id);
                    }
                }

                if (alreadyNotified)
                {
                    _logger.LogInformation($"⚠️ DUPLICATE PREVENTED: Notification already sent for booking {booking.Id}, skipping duplicate");
                    return;
                }

                _logger.LogInformation($"Proceeding to send notification for booking {booking.Id}...");

                var artistUserId = booking.Artist.UserId;
                var bookingDateTime = booking.BookingDate.Add(booking.BookingTime);
                var timeString = bookingDateTime.ToString("MMM dd, yyyy 'at' HH:mm");

                // Get service names
                var serviceNames = string.Join(", ", booking.BookingServices.Select(bs => bs.Service?.Name ?? "Service"));
                if (string.IsNullOrWhiteSpace(serviceNames))
                {
                    serviceNames = "appointment";
                }

                var customerName = !string.IsNullOrWhiteSpace(booking.CustomerName) 
                    ? booking.CustomerName 
                    : booking.Client?.FullName ?? "A client";

                var title = booking.IsWalkIn ? "New Walk-In Booking" : "New Booking";
                var body = booking.IsWalkIn
                    ? $"{customerName} has a walk-in appointment on {timeString}. Service: {serviceNames}"
                    : $"{customerName} booked an appointment on {timeString}. Service: {serviceNames}";

                var success = await _notificationService.SendNotificationToUserAsync(
                    artistUserId,
                    title,
                    body,
                    new Dictionary<string, string>
                    {
                        { "type", "new_booking" },
                        { "bookingId", booking.Id.ToString() },
                        { "isWalkIn", booking.IsWalkIn.ToString().ToLower() },
                        { "bookingDate", booking.BookingDate.ToString("yyyy-MM-dd") },
                        { "bookingTime", booking.BookingTime.ToString(@"hh\:mm") }
                    }
                );

                if (success)
                {
                    _logger.LogInformation($"✅ Sent new booking notification to artist {artistUserId} for booking {booking.Id}");
                }
                else
                {
                    _logger.LogWarning($"Failed to send new booking notification to artist {artistUserId} for booking {booking.Id}");
                    // Remove from set if sending failed so it can be retried
                    lock (_notifiedLock)
                    {
                        _notifiedBookingIds.Remove(booking.Id);
                    }
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error sending new booking notification to artist for booking {booking.Id}");
                // Remove from set on error so it can be retried
                lock (_notifiedLock)
                {
                    _notifiedBookingIds.Remove(booking.Id);
                }
            }
            finally
            {
                // Always release the semaphore
                semaphore.Release();
            }
        }

        private async Task SendCancelledBookingNotificationToArtistAsync(DomainBooking booking)
        {
            try
            {
                if (booking.Artist == null || booking.Artist.UserId == Guid.Empty)
                {
                    _logger.LogWarning($"Cannot send cancellation notification: Artist or UserId is null for booking {booking.Id}");
                    return;
                }

                // Reload booking with artist and user data if needed
                var fullBooking = await _bookingRepository.GetBookingByIdAsync(booking.Id);
                if (fullBooking?.Artist?.User == null)
                {
                    _logger.LogWarning($"Cannot send cancellation notification: Artist or User not found for booking {booking.Id}");
                    return;
                }

                var artistUserId = fullBooking.Artist.UserId;
                var bookingDateTime = fullBooking.BookingDate.Add(fullBooking.BookingTime);
                var timeString = bookingDateTime.ToString("MMM dd, yyyy 'at' HH:mm");

                // Get service names
                var serviceNames = string.Join(", ", fullBooking.BookingServices.Select(bs => bs.Service?.Name ?? "Service"));
                if (string.IsNullOrWhiteSpace(serviceNames))
                {
                    serviceNames = "appointment";
                }

                var customerName = !string.IsNullOrWhiteSpace(fullBooking.CustomerName) 
                    ? fullBooking.CustomerName 
                    : fullBooking.Client?.FullName ?? "A client";

                var title = "Booking Cancelled";
                var body = $"{customerName} cancelled their appointment on {timeString}. Service: {serviceNames}";

                var success = await _notificationService.SendNotificationToUserAsync(
                    artistUserId,
                    title,
                    body,
                    new Dictionary<string, string>
                    {
                        { "type", "booking_cancelled" },
                        { "bookingId", booking.Id.ToString() },
                        { "bookingDate", booking.BookingDate.ToString("yyyy-MM-dd") },
                        { "bookingTime", booking.BookingTime.ToString(@"hh\:mm") }
                    }
                );

                if (success)
                {
                    _logger.LogInformation($"✅ Sent cancellation notification to artist {artistUserId} for booking {booking.Id}");
                }
                else
                {
                    _logger.LogWarning($"Failed to send cancellation notification to artist {artistUserId} for booking {booking.Id}");
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error sending cancellation notification to artist for booking {booking.Id}");
            }
        }

        private async Task SendRescheduleProposalNotificationToClientAsync(DomainBooking booking, DomainModels.Models.Artist artist)
        {
            try
            {
                if (booking.Client == null || string.IsNullOrWhiteSpace(booking.Client.FcmToken))
                {
                    _logger.LogWarning($"Client {booking.ClientId} for booking {booking.Id} has no FCM token or user not found. Skipping reschedule proposal notification.");
                    return;
                }

                var artistUser = await _userRepository.GetUserByIdIncludingInactiveAsync(artist.UserId);
                if (artistUser == null)
                {
                    _logger.LogWarning($"Artist user {artist.UserId} for booking {booking.Id} not found. Skipping reschedule proposal notification.");
                    return;
                }

                var currentAppointmentDateTime = booking.BookingDate.Date.Add(booking.BookingTime);
                var proposedAppointmentDateTime = booking.ProposedRescheduleDate!.Value.Date.Add(booking.ProposedRescheduleTime!.Value);
                var servicesList = string.Join(", ", booking.BookingServices.Select(bs => bs.Service?.Name ?? "Service"));

                var title = "Reschedule Proposal";
                var body = $"{artistUser.FullName} wants to reschedule your appointment from {currentAppointmentDateTime:MMM dd, yyyy 'at' hh:mm tt} to {proposedAppointmentDateTime:MMM dd, yyyy 'at' hh:mm tt}. Service: {servicesList}";

                var data = new Dictionary<string, string>
                {
                    { "type", "reschedule_proposal" },
                    { "bookingId", booking.Id.ToString() },
                    { "artistId", booking.ArtistId.ToString() },
                    { "clientId", booking.ClientId.ToString() },
                    { "currentDateTime", currentAppointmentDateTime.ToString("O") },
                    { "proposedDateTime", proposedAppointmentDateTime.ToString("O") }
                };

                if (!string.IsNullOrWhiteSpace(booking.RescheduleMessage))
                {
                    data["message"] = booking.RescheduleMessage;
                }

                var notificationSent = await _notificationService.SendNotificationToUserAsync(
                    booking.ClientId,
                    title,
                    body,
                    data
                );

                if (notificationSent)
                {
                    _logger.LogInformation($"Reschedule proposal notification sent to client {booking.ClientId} for booking {booking.Id}.");
                }
                else
                {
                    _logger.LogWarning($"Failed to send reschedule proposal notification for booking {booking.Id} to client {booking.ClientId}.");
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error sending reschedule proposal notification for booking {booking.Id}.");
            }
        }

        private async Task SendBookingConfirmationEmailToClientAsync(DomainBooking booking, DomainModels.Models.Artist artist, List<DomainService> services)
        {
            try
            {
                // Get client email - prefer CustomerEmail from booking, fallback to Client entity email
                string? clientEmail = null;
                
                if (!string.IsNullOrWhiteSpace(booking.CustomerEmail))
                {
                    clientEmail = booking.CustomerEmail;
                }
                else if (booking.ClientId != Guid.Empty)
                {
                    var client = await _userRepository.GetUserByIdIncludingInactiveAsync(booking.ClientId);
                    if (client != null && !string.IsNullOrWhiteSpace(client.Email))
                    {
                        clientEmail = client.Email;
                    }
                }

                if (string.IsNullOrWhiteSpace(clientEmail))
                {
                    _logger.LogWarning($"Cannot send booking confirmation email: No email found for booking {booking.Id}");
                    return;
                }

                // Reload booking with full details if needed
                var fullBooking = await _bookingRepository.GetBookingByIdAsync(booking.Id);
                if (fullBooking == null)
                {
                    _logger.LogWarning($"Cannot send booking confirmation email: Booking {booking.Id} not found");
                    return;
                }

                // Get artist name
                var artistName = fullBooking.Artist?.BusinessName ?? 
                                fullBooking.Artist?.User?.FullName ?? 
                                "the artist";

                // Format booking date and time
                var bookingDateTime = fullBooking.BookingDate.Add(fullBooking.BookingTime);
                var dateString = bookingDateTime.ToString("MMMM dd, yyyy", CultureInfo.InvariantCulture);
                var timeString = bookingDateTime.ToString("hh:mm tt", CultureInfo.InvariantCulture);

                // Get service names
                var serviceNames = string.Join(", ", services.Select(s => s.Name));
                if (string.IsNullOrWhiteSpace(serviceNames))
                {
                    serviceNames = "appointment";
                }

                // Get customer name
                var customerName = !string.IsNullOrWhiteSpace(fullBooking.CustomerName) 
                    ? fullBooking.CustomerName 
                    : fullBooking.Client?.FullName ?? "Valued Client";

                // Format duration
                var durationHours = fullBooking.TotalDurationMinutes / 60;
                var durationMinutes = fullBooking.TotalDurationMinutes % 60;
                var durationString = durationHours > 0 
                    ? $"{durationHours} hour{(durationHours > 1 ? "s" : "")} {(durationMinutes > 0 ? $"{durationMinutes} minute{(durationMinutes > 1 ? "s" : "")}" : "")}"
                    : $"{durationMinutes} minute{(durationMinutes > 1 ? "s" : "")}";

                // Format price
                var priceString = fullBooking.TotalPrice.HasValue 
                    ? $"{fullBooking.TotalPrice.Value:F0} ден."
                    : "N/A";

                // Create email subject and body
                var subject = "Booking Confirmation - Your Appointment is Confirmed";
                var body = $@"
<!DOCTYPE html>
<html>
<head>
    <style>
        body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
        .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
        .header {{ background-color: #0ea5e9; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }}
        .content {{ background-color: #f9fafb; padding: 30px; border-radius: 0 0 5px 5px; }}
        .info-box {{ background-color: white; padding: 20px; margin: 20px 0; border-radius: 5px; border-left: 4px solid #0ea5e9; }}
        .info-row {{ margin: 10px 0; }}
        .label {{ font-weight: bold; color: #666; }}
        .value {{ color: #333; }}
        .footer {{ text-align: center; margin-top: 30px; color: #666; font-size: 12px; }}
    </style>
</head>
<body>
    <div class=""container"">
        <div class=""header"">
            <h1>Booking Confirmed!</h1>
        </div>
        <div class=""content"">
            <p>Dear {customerName},</p>
            <p>Your appointment has been successfully confirmed. We look forward to seeing you!</p>
            
            <div class=""info-box"">
                <div class=""info-row"">
                    <span class=""label"">Artist:</span>
                    <span class=""value"">{artistName}</span>
                </div>
                <div class=""info-row"">
                    <span class=""label"">Service:</span>
                    <span class=""value"">{serviceNames}</span>
                </div>
                <div class=""info-row"">
                    <span class=""label"">Date:</span>
                    <span class=""value"">{dateString}</span>
                </div>
                <div class=""info-row"">
                    <span class=""label"">Time:</span>
                    <span class=""value"">{timeString}</span>
                </div>
                <div class=""info-row"">
                    <span class=""label"">Duration:</span>
                    <span class=""value"">{durationString}</span>
                </div>
                <div class=""info-row"">
                    <span class=""label"">Price:</span>
                    <span class=""value"">{priceString}</span>
                </div>
            </div>

            <p>If you need to cancel or reschedule your appointment, please contact us as soon as possible.</p>
            
            <p>Thank you for choosing us!</p>
        </div>
        <div class=""footer"">
            <p>This is an automated confirmation email. Please do not reply to this message.</p>
        </div>
    </div>
</body>
</html>";

                var success = await _emailService.SendEmailAsync(clientEmail, subject, body, isHtml: true);

                if (success)
                {
                    _logger.LogInformation($"✅ Sent booking confirmation email to {clientEmail} for booking {booking.Id}");
                }
                else
                {
                    _logger.LogWarning($"Failed to send booking confirmation email to {clientEmail} for booking {booking.Id}");
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error sending booking confirmation email for booking {booking.Id}");
            }
        }
    }
}


