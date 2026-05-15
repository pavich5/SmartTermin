using SmartTermin.DataAccess.Repositories;
using SmartTermin.DTOs;

namespace SmartTermin.Services
{
    public class SalonHolidayService : ISalonHolidayService
    {
        private readonly ISalonHolidayRepository _salonHolidayRepository;
        private readonly ISalonRepository _salonRepository;
        private readonly IBookingRepository _bookingRepository;

        public SalonHolidayService(ISalonHolidayRepository salonHolidayRepository, ISalonRepository salonRepository, IBookingRepository bookingRepository)
        {
            _salonHolidayRepository = salonHolidayRepository;
            _salonRepository = salonRepository;
            _bookingRepository = bookingRepository;
        }

        public async Task<SalonHolidaysResponseDto> GetHolidaysAsync(Guid salonId)
        {
            var salon = await _salonRepository.GetSalonByIdAsync(salonId)
                ?? throw new InvalidOperationException("Salon not found");

            var holidays = await _salonHolidayRepository.GetHolidaysForSalonAsync(salonId);
            
            var holidayDtos = holidays.Select(h => new SalonHolidayDto
            {
                Id = h.Id,
                HolidayDate = h.HolidayDate.ToString("yyyy-MM-dd"),
                Description = h.Description
            }).ToList();

            return new SalonHolidaysResponseDto
            {
                Holidays = holidayDtos
            };
        }

        public async Task<SalonHolidayResponseDto> CreateHolidayAsync(Guid salonId, CreateSalonHolidayRequestDto request)
        {
            var salon = await _salonRepository.GetSalonByIdAsync(salonId)
                ?? throw new InvalidOperationException("Salon not found");

            if (!DateTime.TryParse(request.HolidayDate, out var holidayDate))
            {
                throw new InvalidOperationException("Invalid date format");
            }

            // Only allow future dates (at least today)
            if (holidayDate.Date < DateTime.UtcNow.Date)
            {
                throw new InvalidOperationException("Holiday date must be today or in the future");
            }

            // Check if holiday already exists for this date
            var existingHoliday = await _salonHolidayRepository.IsHolidayAsync(salonId, holidayDate);
            if (existingHoliday)
            {
                throw new InvalidOperationException("A holiday already exists for this date");
            }

            // Check for existing bookings on this date for all salon members
            var salonBookings = await _salonRepository.GetBookingsForSalonAsync(salonId, holidayDate.Date, holidayDate.Date);
            var activeBookingsCount = salonBookings
                .Count(b => !string.Equals(b.Status, "cancelled", StringComparison.OrdinalIgnoreCase));

            var holiday = new DomainModels.Models.SalonHoliday
            {
                SalonId = salonId,
                HolidayDate = holidayDate.Date,
                Description = request.Description
            };

            var createdHoliday = await _salonHolidayRepository.CreateHolidayAsync(holiday);

            return new SalonHolidayResponseDto
            {
                Id = createdHoliday.Id,
                HolidayDate = createdHoliday.HolidayDate.ToString("yyyy-MM-dd"),
                Description = createdHoliday.Description,
                ExistingBookingsCount = activeBookingsCount
            };
        }

        public async Task DeleteHolidayAsync(Guid salonId, Guid holidayId)
        {
            var salon = await _salonRepository.GetSalonByIdAsync(salonId)
                ?? throw new InvalidOperationException("Salon not found");

            var holiday = await _salonHolidayRepository.GetHolidayByIdAsync(holidayId);
            if (holiday == null)
            {
                throw new KeyNotFoundException("Holiday not found");
            }

            if (holiday.SalonId != salonId)
            {
                throw new UnauthorizedAccessException("You can only delete holidays for your own salon");
            }

            await _salonHolidayRepository.DeleteHolidayAsync(holidayId);
        }
    }
}

