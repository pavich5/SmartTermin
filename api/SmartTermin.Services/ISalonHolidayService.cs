using SmartTermin.DTOs;

namespace SmartTermin.Services
{
    public interface ISalonHolidayService
    {
        Task<SalonHolidaysResponseDto> GetHolidaysAsync(Guid salonId);
        Task<SalonHolidayResponseDto> CreateHolidayAsync(Guid salonId, CreateSalonHolidayRequestDto request);
        Task DeleteHolidayAsync(Guid salonId, Guid holidayId);
    }
}

