using SmartTermin.DataAccess.DataContext;
using SmartTermin.DomainModels.Models;
using Microsoft.EntityFrameworkCore;

namespace SmartTermin.DataAccess.Repositories
{
    public class HolidayRepository : IHolidayRepository
    {
        private readonly SmartTerminDbContext _context;

        public HolidayRepository(SmartTerminDbContext context)
        {
            _context = context;
        }

        public async Task<IList<Holiday>> GetHolidaysForArtistAsync(Guid artistId)
        {
            return await _context.Holidays
                .Where(h => h.ArtistId == artistId)
                .OrderBy(h => h.HolidayDate)
                .ToListAsync();
        }

        public async Task<IList<Holiday>> GetHolidaysForArtistInDateRangeAsync(Guid artistId, DateTime startDate, DateTime endDate)
        {
            return await _context.Holidays
                .Where(h => h.ArtistId == artistId && 
                           h.HolidayDate.Date >= startDate.Date && 
                           h.HolidayDate.Date <= endDate.Date)
                .OrderBy(h => h.HolidayDate)
                .ToListAsync();
        }

        public async Task<Holiday?> GetHolidayByIdAsync(Guid holidayId)
        {
            return await _context.Holidays
                .FirstOrDefaultAsync(h => h.Id == holidayId);
        }

        public async Task<Holiday> CreateHolidayAsync(Holiday holiday)
        {
            _context.Holidays.Add(holiday);
            await _context.SaveChangesAsync();
            return holiday;
        }

        public async Task DeleteHolidayAsync(Guid holidayId)
        {
            var holiday = await _context.Holidays.FindAsync(holidayId);
            if (holiday != null)
            {
                _context.Holidays.Remove(holiday);
                await _context.SaveChangesAsync();
            }
        }

        public async Task<bool> IsHolidayAsync(Guid artistId, DateTime date)
        {
            return await _context.Holidays
                .AnyAsync(h => h.ArtistId == artistId && h.HolidayDate.Date == date.Date);
        }

        public async Task<Holiday?> GetHolidayForDateAsync(Guid artistId, DateTime date)
        {
            return await _context.Holidays
                .FirstOrDefaultAsync(h => h.ArtistId == artistId && h.HolidayDate.Date == date.Date);
        }
    }
}

