using SmartTermin.DataAccess.DataContext;
using SmartTermin.DomainModels.Models;
using Microsoft.EntityFrameworkCore;

namespace SmartTermin.DataAccess.Repositories
{
    public class PortfolioRepository : IPortfolioRepository
    {
        private readonly SmartTerminDbContext _context;

        public PortfolioRepository(SmartTerminDbContext context)
        {
            _context = context;
        }

        public async Task<IList<PortfolioImage>> GetPortfolioImagesForArtistAsync(Guid artistId)
        {
            return await _context.PortfolioImages
                .Where(p => p.ArtistId.HasValue && p.ArtistId.Value == artistId)
                .OrderBy(p => p.DisplayOrder)
                .ToListAsync();
        }

        public async Task<IList<PortfolioImage>> GetPortfolioImagesForSalonAsync(Guid salonId)
        {
            return await _context.PortfolioImages
                .Where(p => p.SalonId == salonId)
                .OrderBy(p => p.DisplayOrder)
                .ToListAsync();
        }

        public async Task<PortfolioImage?> GetPortfolioImageByIdAsync(Guid imageId)
        {
            return await _context.PortfolioImages
                .Include(p => p.Artist)
                .Include(p => p.Salon)
                .FirstOrDefaultAsync(p => p.Id == imageId);
        }

        public async Task<PortfolioImage> CreatePortfolioImageAsync(PortfolioImage portfolioImage)
        {
            _context.PortfolioImages.Add(portfolioImage);
            await _context.SaveChangesAsync();
            return portfolioImage;
        }

        public async Task DeletePortfolioImageAsync(PortfolioImage portfolioImage)
        {
            _context.PortfolioImages.Remove(portfolioImage);
            await _context.SaveChangesAsync();
        }

        public async Task UpdatePortfolioImagesAsync(IList<PortfolioImage> portfolioImages)
        {
            _context.PortfolioImages.UpdateRange(portfolioImages);
            await _context.SaveChangesAsync();
        }

        public async Task UpdatePortfolioImageAsync(PortfolioImage portfolioImage)
        {
            _context.PortfolioImages.Update(portfolioImage);
            await _context.SaveChangesAsync();
        }

        public async Task<Artist?> GetArtistByIdAsync(Guid artistId)
        {
            return await _context.Artists
                .Include(a => a.User)
                .FirstOrDefaultAsync(a => a.Id == artistId);
        }

        public async Task UpdateArtistAsync(Artist artist)
        {
            _context.Artists.Update(artist);
            await _context.SaveChangesAsync();
        }

        public async Task<Salon?> GetSalonByIdAsync(Guid salonId)
        {
            return await _context.Salons
                .FirstOrDefaultAsync(s => s.Id == salonId);
        }

        public async Task UpdateSalonAsync(Salon salon)
        {
            _context.Salons.Update(salon);
            await _context.SaveChangesAsync();
        }
    }
}

