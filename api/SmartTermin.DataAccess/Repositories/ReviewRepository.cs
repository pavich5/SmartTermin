using SmartTermin.DataAccess.DataContext;
using SmartTermin.DomainModels.Models;
using Microsoft.EntityFrameworkCore;

namespace SmartTermin.DataAccess.Repositories
{
    public class ReviewRepository : IReviewRepository
    {
        private readonly SmartTerminDbContext _context;

        public ReviewRepository(SmartTerminDbContext context)
        {
            _context = context;
        }

        public async Task<Review?> GetReviewByIdAsync(Guid reviewId)
        {
            return await _context.Reviews
                .Include(r => r.Client)
                .Include(r => r.Service)
                .Include(r => r.Artist)
                .FirstOrDefaultAsync(r => r.Id == reviewId);
        }

        public async Task<Review?> GetReviewByClientServiceAsync(Guid clientId, Guid artistId, Guid serviceId)
        {
            return await _context.Reviews
                .Include(r => r.Client)
                .Include(r => r.Service)
                .Include(r => r.Artist)
                .FirstOrDefaultAsync(r => 
                    r.ClientId == clientId && 
                    r.ArtistId == artistId && 
                    r.ServiceId == serviceId);
        }

        public async Task<IList<Review>> GetReviewsForArtistAsync(Guid artistId)
        {
            return await _context.Reviews
                .Include(r => r.Client)
                .Include(r => r.Service)
                .Where(r => r.ArtistId == artistId)
                .OrderByDescending(r => r.CreatedAt)
                .ToListAsync();
        }

        public async Task<IList<Review>> GetReviewsForServiceAsync(Guid serviceId)
        {
            return await _context.Reviews
                .Include(r => r.Client)
                .Include(r => r.Service)
                .Where(r => r.ServiceId == serviceId)
                .OrderByDescending(r => r.CreatedAt)
                .ToListAsync();
        }

        public async Task<Review> CreateReviewAsync(Review review)
        {
            _context.Reviews.Add(review);
            await _context.SaveChangesAsync();
            return review;
        }

        public async Task UpdateReviewAsync(Review review)
        {
            _context.Reviews.Update(review);
            await _context.SaveChangesAsync();
        }

        public async Task DeleteReviewAsync(Guid reviewId)
        {
            var review = await _context.Reviews.FindAsync(reviewId);
            if (review != null)
            {
                _context.Reviews.Remove(review);
                await _context.SaveChangesAsync();
            }
        }

        public async Task<bool> HasClientReviewedServiceAsync(Guid clientId, Guid artistId, Guid serviceId)
        {
            return await _context.Reviews
                .AnyAsync(r => 
                    r.ClientId == clientId && 
                    r.ArtistId == artistId && 
                    r.ServiceId == serviceId);
        }
    }
}


