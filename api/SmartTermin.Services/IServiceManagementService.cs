using System;
using System.Threading.Tasks;
using SmartTermin.DTOs;

namespace SmartTermin.Services
{
    public interface IServiceManagementService
    {
        Task<ServiceListResponseDto> GetServicesForArtistAsync(Guid artistUserId);
        Task<ServiceDetailsDto> CreateServiceAsync(Guid artistUserId, CreateServiceRequestDto request);
        Task<ServiceDetailsDto> UpdateServiceAsync(Guid artistUserId, Guid serviceId, UpdateServiceRequestDto request);
        Task<bool> DeleteServiceAsync(Guid artistUserId, Guid serviceId);
    }
}

