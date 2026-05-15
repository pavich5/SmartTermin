using SmartTermin.DomainModels.Models;

namespace SmartTermin.DataAccess.Repositories
{
    public interface IUserRepository
    {
        Task<User?> GetUserByPhoneAsync(string phone);
        Task UpdateUserLastLoginAsync(Guid userId);
        Task<User?> GetUserWithArtistProfileAsync(string phone);
        Task<User> CreateUserAsync(User user);
        Task<Artist> CreateArtistAsync(Artist artist);
        Task<ArtistSubscription> CreateArtistSubscriptionAsync(ArtistSubscription subscription);
        Task<ArtistSubscription?> GetSubscriptionByPaddleSubscriptionIdAsync(string paddleSubscriptionId);
        Task<ArtistSubscription?> GetActiveSubscriptionByArtistIdAsync(Guid artistId);
        Task<ArtistSubscription?> GetSubscriptionByArtistIdAsync(Guid artistId, string? status = null);
        Task<ArtistSubscription> UpdateSubscriptionAsync(ArtistSubscription subscription);
        Task<User?> GetUserByEmailAsync(string email);
        Task<User?> GetUserByPhoneForVerificationAsync(string phone);
        Task UpdateUserPhoneVerifiedAsync(Guid userId);
        Task<User?> GetUserByIdWithArtistProfileAsync(Guid userId);
        Task<Artist?> GetArtistByUserIdAsync(Guid userId);
        Task<Artist> UpdateArtistProfileAsync(Artist artist);
        Task UpdateUserPasswordResetCodeAsync(Guid userId, string resetCode, DateTime expiresAt);
        Task ClearUserPasswordResetCodeAsync(Guid userId);
        Task UpdateUserPasswordAsync(Guid userId, string passwordHash);
        Task<User> UpdateUserAsync(User user);
        Task<User?> GetUserByPhoneIncludingInactiveAsync(string phone);
        Task<User?> GetUserByIdIncludingInactiveAsync(Guid userId);
        Task<bool> DeleteUserPermanentlyAsync(Guid userId);
        Task<List<User>> GetUsersByIdsAsync(List<Guid> userIds);
        Task UpdateUserFcmTokenAsync(Guid userId, string? fcmToken);
        Task<Artist?> GetArtistByCustomBookingLinkAsync(string customBookingLink);
    }
}

