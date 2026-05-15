using SmartTermin.DomainModels.Models;

namespace SmartTermin.DataAccess.Repositories
{
    public interface ISalonHolidayRepository
    {
        Task<IList<SalonHoliday>> GetHolidaysForSalonAsync(Guid salonId);
        Task<SalonHoliday?> GetHolidayByIdAsync(Guid holidayId);
        Task<SalonHoliday> CreateHolidayAsync(SalonHoliday holiday);
        Task DeleteHolidayAsync(Guid holidayId);
        Task<bool> IsHolidayAsync(Guid salonId, DateTime date);
        Task<SalonHoliday?> GetHolidayForDateAsync(Guid salonId, DateTime date);
    }
}

