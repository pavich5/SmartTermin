using SmartTermin.DomainModels.Models;

namespace SmartTermin.DataAccess.Repositories
{
    public interface IWalkInClientRepository
    {
        Task<WalkInClient> CreateWalkInClientAsync(WalkInClient walkInClient);
        Task<IList<WalkInClient>> GetWalkInClientsForArtistAsync(Guid artistId);
        Task<WalkInClient?> GetWalkInClientByIdAsync(Guid walkInClientId);
    }
}

