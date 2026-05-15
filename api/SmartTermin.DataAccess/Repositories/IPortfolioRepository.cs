using SmartTermin.DomainModels.Models;

namespace SmartTermin.DataAccess.Repositories
{
    public interface IPortfolioRepository
    {
        Task<IList<PortfolioImage>> GetPortfolioImagesForArtistAsync(Guid artistId);
        Task<IList<PortfolioImage>> GetPortfolioImagesForSalonAsync(Guid salonId);
        Task<PortfolioImage?> GetPortfolioImageByIdAsync(Guid imageId);
        Task<PortfolioImage> CreatePortfolioImageAsync(PortfolioImage portfolioImage);
        Task DeletePortfolioImageAsync(PortfolioImage portfolioImage);
        Task UpdatePortfolioImagesAsync(IList<PortfolioImage> portfolioImages);
        Task UpdatePortfolioImageAsync(PortfolioImage portfolioImage);
        Task<Artist?> GetArtistByIdAsync(Guid artistId);
        Task UpdateArtistAsync(Artist artist);
        Task<Salon?> GetSalonByIdAsync(Guid salonId);
        Task UpdateSalonAsync(Salon salon);
    }
}

