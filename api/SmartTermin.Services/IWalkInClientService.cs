using SmartTermin.DTOs;

namespace SmartTermin.Services
{
    public interface IWalkInClientService
    {
        Task<CreateWalkInClientResponseDto> CreateWalkInClientAsync(Guid artistId, CreateWalkInClientRequestDto request);
        Task<WalkInClientsResponseDto> GetWalkInClientsForArtistAsync(Guid artistUserId);
    }
}

