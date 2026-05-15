using SmartTermin.DomainModels.Models;

namespace SmartTermin.DataAccess.Repositories
{
    public interface IBlockedClientRepository
    {
        Task<BlockedClient?> GetBlockedClientAsync(Guid? artistId, Guid? salonId, Guid clientId);
        Task<bool> IsClientBlockedAsync(Guid? artistId, Guid? salonId, Guid clientId);
        Task<IList<BlockedClient>> GetBlockedClientsForArtistAsync(Guid artistId);
        Task<IList<BlockedClient>> GetBlockedClientsForSalonAsync(Guid salonId);
        Task<BlockedClient> BlockClientAsync(BlockedClient blockedClient);
        Task UnblockClientAsync(Guid blockedClientId);
        Task<BlockedClient?> GetBlockedClientByIdAsync(Guid blockedClientId);
    }
}











