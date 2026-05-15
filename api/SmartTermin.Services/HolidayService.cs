using SmartTermin.DataAccess.Repositories;
using SmartTermin.DTOs;

namespace SmartTermin.Services
{
    public class HolidayService : IHolidayService
    {
        private readonly IHolidayRepository _holidayRepository;
        private readonly IUserRepository _userRepository;
        private readonly IBookingRepository _bookingRepository;

        public HolidayService(IHolidayRepository holidayRepository, IUserRepository userRepository, IBookingRepository bookingRepository)
        {
            _holidayRepository = holidayRepository;
            _userRepository = userRepository;
            _bookingRepository = bookingRepository;
        }

        public async Task<HolidaysResponseDto> GetHolidaysAsync(Guid artistUserId)
        {
            var artist = await _userRepository.GetArtistByUserIdAsync(artistUserId)
                ?? throw new InvalidOperationException("Artist profile not found");

            var holidays = await _holidayRepository.GetHolidaysForArtistAsync(artist.Id);
            
            var holidayDtos = holidays.Select(h => new HolidayDto
            {
                Id = h.Id,
                HolidayDate = h.HolidayDate.ToString("yyyy-MM-dd"),
                Description = h.Description
            }).ToList();

            return new HolidaysResponseDto
            {
                Holidays = holidayDtos
            };
        }

        public async Task<HolidayResponseDto> CreateHolidayAsync(Guid artistUserId, CreateHolidayRequestDto request)
        {
            var artist = await _userRepository.GetArtistByUserIdAsync(artistUserId)
                ?? throw new InvalidOperationException("Artist profile not found");

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
            var existingHoliday = await _holidayRepository.IsHolidayAsync(artist.Id, holidayDate);
            if (existingHoliday)
            {
                throw new InvalidOperationException("A holiday already exists for this date");
            }

            // Check for existing bookings on this date
            var existingBookings = await _bookingRepository.GetBookingsForArtistOnDateAsync(artist.Id, holidayDate);
            var activeBookingsCount = existingBookings
                .Count(b => !string.Equals(b.Status, "cancelled", StringComparison.OrdinalIgnoreCase));

            var holiday = new DomainModels.Models.Holiday
            {
                ArtistId = artist.Id,
                HolidayDate = holidayDate.Date,
                Description = request.Description
            };

            var createdHoliday = await _holidayRepository.CreateHolidayAsync(holiday);

            return new HolidayResponseDto
            {
                Id = createdHoliday.Id,
                HolidayDate = createdHoliday.HolidayDate.ToString("yyyy-MM-dd"),
                Description = createdHoliday.Description,
                ExistingBookingsCount = activeBookingsCount
            };
        }

        public async Task DeleteHolidayAsync(Guid artistUserId, Guid holidayId)
        {
            var artist = await _userRepository.GetArtistByUserIdAsync(artistUserId)
                ?? throw new InvalidOperationException("Artist profile not found");

            var holiday = await _holidayRepository.GetHolidayByIdAsync(holidayId);
            if (holiday == null)
            {
                throw new KeyNotFoundException("Holiday not found");
            }

            if (holiday.ArtistId != artist.Id)
            {
                throw new UnauthorizedAccessException("You can only delete your own holidays");
            }

            await _holidayRepository.DeleteHolidayAsync(holidayId);
        }
    }
}

