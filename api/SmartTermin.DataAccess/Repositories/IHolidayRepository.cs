using SmartTermin.DomainModels.Models;

namespace SmartTermin.DataAccess.Repositories
{
    public interface IHolidayRepository
    {
        Task<IList<Holiday>> GetHolidaysForArtistAsync(Guid artistId);
        Task<IList<Holiday>> GetHolidaysForArtistInDateRangeAsync(Guid artistId, DateTime startDate, DateTime endDate);
        Task<Holiday?> GetHolidayByIdAsync(Guid holidayId);
        Task<Holiday> CreateHolidayAsync(Holiday holiday);
        Task DeleteHolidayAsync(Guid holidayId);
        Task<bool> IsHolidayAsync(Guid artistId, DateTime date);
        Task<Holiday?> GetHolidayForDateAsync(Guid artistId, DateTime date);
    }
}

