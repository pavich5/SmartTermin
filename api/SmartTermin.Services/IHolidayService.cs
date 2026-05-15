using SmartTermin.DTOs;

namespace SmartTermin.Services
{
    public interface IHolidayService
    {
        Task<HolidaysResponseDto> GetHolidaysAsync(Guid artistUserId);
        Task<HolidayResponseDto> CreateHolidayAsync(Guid artistUserId, CreateHolidayRequestDto request);
        Task DeleteHolidayAsync(Guid artistUserId, Guid holidayId);
    }
}

