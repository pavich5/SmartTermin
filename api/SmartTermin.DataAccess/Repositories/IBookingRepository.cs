using System;
using System.Collections.Generic;
using SmartTermin.DomainModels.Models;

namespace SmartTermin.DataAccess.Repositories
{
    public interface IBookingRepository
    {
        Task<Service?> GetServiceByIdAsync(Guid serviceId);
        Task<IList<Service>> GetServicesByIdsAsync(List<Guid> serviceIds);
        Task<WorkingHour?> GetWorkingHourForDayAsync(Guid artistId, int dayOfWeek);
        Task<IList<Booking>> GetBookingsForArtistOnDateAsync(Guid artistId, DateTime date);
        Task<Booking> CreateBookingAsync(Booking booking);
        Task<Booking?> GetBookingByIdAsync(Guid bookingId);
        Task UpdateBookingAsync(Booking booking);
        Task<IList<Booking>> GetBookingsForArtistAsync(Guid artistId, DateTime? dateFilter);
        Task<IList<Booking>> GetBookingsForClientAsync(Guid clientId, DateTime? dateFilter);
        Task<IList<Booking>> GetBookingsForArtistInDateRangeAsync(Guid artistId, DateTime startDate, DateTime endDate);
        Task<Artist?> GetArtistByIdAsync(Guid artistId);
        Task<IList<Booking>> GetBookingsNeedingRemindersAsync(DateTime currentTime, TimeSpan reminderOffset, bool reminder24h);
        Task<IList<(Guid ClientId, string Name, string Email, string Phone, int BookingCount)>> GetClientStatisticsForArtistAsync(Guid artistId, int? limit);
    }
}

