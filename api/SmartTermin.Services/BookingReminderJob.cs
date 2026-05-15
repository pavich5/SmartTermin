using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using SmartTermin.DataAccess.Repositories;
using System.Linq;

namespace SmartTermin.Services
{
    public class BookingReminderJob : BackgroundService
    {
        private readonly IServiceProvider _serviceProvider;
        private readonly ILogger<BookingReminderJob> _logger;

        public BookingReminderJob(IServiceProvider serviceProvider, ILogger<BookingReminderJob> logger)
        {
            _serviceProvider = serviceProvider;
            _logger = logger;
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            // Wait a bit on startup to let the app fully initialize
            await Task.Delay(TimeSpan.FromMinutes(1), stoppingToken);

            while (!stoppingToken.IsCancellationRequested)
            {
                try
                {
                    using var scope = _serviceProvider.CreateScope();
                    var bookingRepository = scope.ServiceProvider.GetRequiredService<IBookingRepository>();
                    var notificationService = scope.ServiceProvider.GetRequiredService<IFirebaseNotificationService>();

                    var currentTime = DateTime.UtcNow;
                    _logger.LogInformation($"Checking for booking reminders at {currentTime:yyyy-MM-dd HH:mm:ss} UTC");

                    // Check for 24-hour reminders
                    await SendRemindersAsync(bookingRepository, notificationService, currentTime, TimeSpan.FromHours(24), true);

                    // Check for 1-hour reminders
                    await SendRemindersAsync(bookingRepository, notificationService, currentTime, TimeSpan.FromHours(1), false);

                    _logger.LogInformation("Booking reminder check completed");
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Error checking booking reminders");
                }

                // Run every 15 minutes to catch bookings that need reminders
                await Task.Delay(TimeSpan.FromMinutes(15), stoppingToken);
            }
        }

        private async Task SendRemindersAsync(
            IBookingRepository bookingRepository,
            IFirebaseNotificationService notificationService,
            DateTime currentTime,
            TimeSpan reminderOffset,
            bool is24hReminder)
        {
            try
            {
                var bookings = await bookingRepository.GetBookingsNeedingRemindersAsync(currentTime, reminderOffset, is24hReminder);

                if (!bookings.Any())
                {
                    _logger.LogDebug($"No bookings found needing {(is24hReminder ? "24h" : "1h")} reminder");
                    return;
                }

                _logger.LogInformation($"Found {bookings.Count} booking(s) needing {(is24hReminder ? "24h" : "1h")} reminder");

                foreach (var booking in bookings)
                {
                    try
                    {
                        // Skip if client doesn't have FCM token
                        if (string.IsNullOrWhiteSpace(booking.Client?.FcmToken))
                        {
                            _logger.LogWarning($"Booking {booking.Id} - Client {booking.ClientId} has no FCM token. Skipping reminder.");
                            continue;
                        }

                        // Skip if booking is cancelled or completed
                        if (booking.Status != "confirmed")
                        {
                            _logger.LogWarning($"Booking {booking.Id} is not confirmed (status: {booking.Status}). Skipping reminder.");
                            continue;
                        }

                        // Format booking date and time
                        var bookingDateTime = booking.BookingDate.Add(booking.BookingTime);
                        var bookingDateTimeLocal = bookingDateTime; // You might want to convert to local time here
                        var timeString = bookingDateTimeLocal.ToString("MMM dd, yyyy 'at' HH:mm");

                        // Get artist name
                        var artistName = booking.Artist?.User?.FullName ?? "your artist";
                        
                        // Get service names
                        var serviceNames = string.Join(", ", booking.BookingServices.Select(bs => bs.Service?.Name ?? "Service"));
                        if (string.IsNullOrWhiteSpace(serviceNames))
                        {
                            serviceNames = "your appointment";
                        }

                        // Create notification message
                        var reminderType = is24hReminder ? "24 hours" : "1 hour";
                        var title = $"Appointment Reminder - {reminderType}";
                        var body = is24hReminder
                            ? $"You have an appointment with {artistName} tomorrow at {timeString}. Service: {serviceNames}"
                            : $"Your appointment with {artistName} is in 1 hour at {timeString}. Service: {serviceNames}";

                        // Send notification
                        var success = await notificationService.SendNotificationToUserAsync(
                            booking.ClientId,
                            title,
                            body,
                            new Dictionary<string, string>
                            {
                                { "type", "booking_reminder" },
                                { "bookingId", booking.Id.ToString() },
                                { "reminderType", is24hReminder ? "24h" : "1h" },
                                { "bookingDate", booking.BookingDate.ToString("yyyy-MM-dd") },
                                { "bookingTime", booking.BookingTime.ToString(@"hh\:mm") }
                            }
                        );

                        if (success)
                        {
                            // Mark reminder as sent
                            if (is24hReminder)
                            {
                                booking.Reminder24hSent = true;
                            }
                            else
                            {
                                booking.Reminder1hSent = true;
                            }

                            await bookingRepository.UpdateBookingAsync(booking);
                            _logger.LogInformation($"✅ Sent {(is24hReminder ? "24h" : "1h")} reminder for booking {booking.Id} to client {booking.ClientId}");
                        }
                        else
                        {
                            _logger.LogWarning($"Failed to send {(is24hReminder ? "24h" : "1h")} reminder for booking {booking.Id}");
                        }
                    }
                    catch (Exception ex)
                    {
                        _logger.LogError(ex, $"Error sending {(is24hReminder ? "24h" : "1h")} reminder for booking {booking.Id}");
                    }
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error in SendRemindersAsync for {(is24hReminder ? "24h" : "1h")} reminders");
            }
        }
    }
}

