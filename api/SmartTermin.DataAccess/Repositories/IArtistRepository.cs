using SmartTermin.DomainModels.Models;

namespace SmartTermin.DataAccess.Repositories
{
    public interface IArtistRepository
    {
        Task<(IList<Artist> Artists, int TotalCount)> GetArtistsAsync(string? search, string? service, int page, int limit);
        Task<(IList<ArtistListItemData> Artists, int TotalCount)> GetArtistsListAsync(string? search, string? service, int page, int limit);
        Task<Artist?> GetArtistByIdAsync(Guid artistId);
        Task<Artist?> GetArtistByCustomBookingLinkAsync(string customBookingLink);
    }
}

