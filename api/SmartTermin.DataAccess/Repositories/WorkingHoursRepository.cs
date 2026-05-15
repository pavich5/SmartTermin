using SmartTermin.DataAccess.DataContext;
using SmartTermin.DomainModels.Models;
using Microsoft.EntityFrameworkCore;

namespace SmartTermin.DataAccess.Repositories
{
    public class WorkingHoursRepository : IWorkingHoursRepository
    {
        private readonly SmartTerminDbContext _context;

        public WorkingHoursRepository(SmartTerminDbContext context)
        {
            _context = context;
        }

        public async Task<IList<WorkingHour>> GetWorkingHoursForArtistAsync(Guid artistId)
        {
            return await _context.WorkingHours
                .Where(wh => wh.ArtistId == artistId)
                .OrderBy(wh => wh.DayOfWeek)
                .ToListAsync();
        }

        public async Task<Dictionary<Guid, IList<WorkingHour>>> GetWorkingHoursForArtistsAsync(IEnumerable<Guid> artistIds)
        {
            var artistIdsList = artistIds.ToList();
            if (!artistIdsList.Any())
            {
                return new Dictionary<Guid, IList<WorkingHour>>();
            }

            var workingHours = await _context.WorkingHours
                .Where(wh => artistIdsList.Contains(wh.ArtistId))
                .OrderBy(wh => wh.ArtistId)
                .ThenBy(wh => wh.DayOfWeek)
                .ToListAsync();

            return workingHours
                .GroupBy(wh => wh.ArtistId)
                .ToDictionary(g => g.Key, g => (IList<WorkingHour>)g.ToList());
        }

        public async Task<WorkingHour?> GetWorkingHourForDayAsync(Guid artistId, int dayOfWeek)
        {
            return await _context.WorkingHours
                .FirstOrDefaultAsync(wh => wh.ArtistId == artistId && wh.DayOfWeek == dayOfWeek);
        }

        public async Task<WorkingHour> CreateOrUpdateWorkingHourAsync(WorkingHour workingHour)
        {
            var existing = await _context.WorkingHours
                .FirstOrDefaultAsync(wh => wh.ArtistId == workingHour.ArtistId && wh.DayOfWeek == workingHour.DayOfWeek);

            if (existing != null)
            {
                existing.StartTime = workingHour.StartTime;
                existing.EndTime = workingHour.EndTime;
                existing.IsAvailable = workingHour.IsAvailable;
                existing.BreaksJson = workingHour.BreaksJson;
                _context.WorkingHours.Update(existing);
                await _context.SaveChangesAsync();
                return existing;
            }
            else
            {
                _context.WorkingHours.Add(workingHour);
                await _context.SaveChangesAsync();
                return workingHour;
            }
        }

        public async Task DeleteWorkingHourAsync(WorkingHour workingHour)
        {
            _context.WorkingHours.Remove(workingHour);
            await _context.SaveChangesAsync();
        }
    }
}

