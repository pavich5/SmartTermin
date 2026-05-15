using SmartTermin.DomainModels.Models;

namespace SmartTermin.DataAccess.Repositories
{
    public interface IWorkingHoursRepository
    {
        Task<IList<WorkingHour>> GetWorkingHoursForArtistAsync(Guid artistId);
        Task<Dictionary<Guid, IList<WorkingHour>>> GetWorkingHoursForArtistsAsync(IEnumerable<Guid> artistIds);
        Task<WorkingHour?> GetWorkingHourForDayAsync(Guid artistId, int dayOfWeek);
        Task<WorkingHour> CreateOrUpdateWorkingHourAsync(WorkingHour workingHour);
        Task DeleteWorkingHourAsync(WorkingHour workingHour);
    }
}

