using SmartTermin.DataAccess.DataContext;
using SmartTermin.DomainModels.Models;
using Microsoft.EntityFrameworkCore;

namespace SmartTermin.DataAccess.Repositories
{
    public class SalonHolidayRepository : ISalonHolidayRepository
    {
        private readonly SmartTerminDbContext _context;

        public SalonHolidayRepository(SmartTerminDbContext context)
        {
            _context = context;
        }

        public async Task<IList<SalonHoliday>> GetHolidaysForSalonAsync(Guid salonId)
        {
            return await _context.SalonHolidays
                .Where(h => h.SalonId == salonId)
                .OrderBy(h => h.HolidayDate)
                .ToListAsync();
        }

        public async Task<SalonHoliday?> GetHolidayByIdAsync(Guid holidayId)
        {
            return await _context.SalonHolidays
                .FirstOrDefaultAsync(h => h.Id == holidayId);
        }

        public async Task<SalonHoliday> CreateHolidayAsync(SalonHoliday holiday)
        {
            _context.SalonHolidays.Add(holiday);
            await _context.SaveChangesAsync();
            return holiday;
        }

        public async Task DeleteHolidayAsync(Guid holidayId)
        {
            var holiday = await _context.SalonHolidays.FindAsync(holidayId);
            if (holiday != null)
            {
                _context.SalonHolidays.Remove(holiday);
                await _context.SaveChangesAsync();
            }
        }

        public async Task<bool> IsHolidayAsync(Guid salonId, DateTime date)
        {
            return await _context.SalonHolidays
                .AnyAsync(h => h.SalonId == salonId && h.HolidayDate.Date == date.Date);
        }

        public async Task<SalonHoliday?> GetHolidayForDateAsync(Guid salonId, DateTime date)
        {
            return await _context.SalonHolidays
                .FirstOrDefaultAsync(h => h.SalonId == salonId && h.HolidayDate.Date == date.Date);
        }
    }
}

