using SmartTermin.DomainModels.Models;

namespace SmartTermin.DataAccess.Repositories
{
    public interface IReviewRepository
    {
        Task<Review?> GetReviewByIdAsync(Guid reviewId);
        Task<Review?> GetReviewByClientServiceAsync(Guid clientId, Guid artistId, Guid serviceId);
        Task<IList<Review>> GetReviewsForArtistAsync(Guid artistId);
        Task<IList<Review>> GetReviewsForServiceAsync(Guid serviceId);
        Task<Review> CreateReviewAsync(Review review);
        Task UpdateReviewAsync(Review review);
        Task DeleteReviewAsync(Guid reviewId);
        Task<bool> HasClientReviewedServiceAsync(Guid clientId, Guid artistId, Guid serviceId);
    }
}


