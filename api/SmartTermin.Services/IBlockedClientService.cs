using SmartTermin.DTOs;

namespace SmartTermin.Services
{
    public interface IBlockedClientService
    {
        Task<BlockClientResponseDto> BlockClientAsync(Guid blockedByUserId, Guid? artistId, Guid? salonId, BlockClientRequestDto request);
        Task<UnblockClientResponseDto> UnblockClientAsync(Guid requesterUserId, Guid blockedClientId);
        Task<bool> IsClientBlockedAsync(Guid? artistId, Guid? salonId, Guid clientId);
        Task<BlockedClientsResponseDto> GetBlockedClientsForArtistAsync(Guid artistUserId);
        Task<BlockedClientsResponseDto> GetBlockedClientsForSalonAsync(Guid salonOwnerUserId);
    }
}











