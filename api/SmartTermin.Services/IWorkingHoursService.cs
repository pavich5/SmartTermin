using SmartTermin.DTOs;

namespace SmartTermin.Services
{
    public interface IWorkingHoursService
    {
        Task<WorkingHoursResponseDto> GetWorkingHoursAsync(Guid artistUserId);
        Task<UpdateWorkingHoursResponseDto> UpdateWorkingHoursAsync(Guid artistUserId, UpdateWorkingHoursRequestDto request);
        Task<SalonArtistsWorkingHoursResponseDto> GetSalonArtistsWorkingHoursAsync(Guid salonId);
    }
}

