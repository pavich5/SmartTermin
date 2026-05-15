using SmartTermin.DataAccess.DataContext;
using SmartTermin.DomainModels.Models;
using Microsoft.EntityFrameworkCore;

namespace SmartTermin.DataAccess.Repositories
{
    public class UserRepository : IUserRepository
    {
        private readonly SmartTerminDbContext _context;

        public UserRepository(SmartTerminDbContext context)
        {
            _context = context;
        }

        public async Task<User?> GetUserByPhoneAsync(string phone)
        {
            // Normalize phone number (trim whitespace) to match signup/verification logic
            var normalizedPhone = phone?.Trim() ?? string.Empty;
            
            var user = await _context.Users
                .FirstOrDefaultAsync(u => u.Phone == normalizedPhone && u.IsActive);

            return user;
        }

        public async Task<User?> GetUserWithArtistProfileAsync(string phone)
        {
            return await _context.Users
                .Include(u => u.ArtistProfile)
                .ThenInclude(a => a.ArtistSubscriptions)
                .Include(u => u.ArtistProfile)
                    .ThenInclude(a => a.SalonMemberships)
                .FirstOrDefaultAsync(u => u.Phone == phone && u.IsActive);
        }

        public async Task UpdateUserLastLoginAsync(Guid userId)
        {
            var user = await _context.Users.FindAsync(userId);
            if (user != null)
            {
                user.LastLoginAt = DateTime.UtcNow;
                await _context.SaveChangesAsync();
            }
        }

        public async Task<User> CreateUserAsync(User user)
        {
            _context.Users.Add(user);
            await _context.SaveChangesAsync();
            return user;
        }

        public async Task<Artist> CreateArtistAsync(Artist artist)
        {
            _context.Artists.Add(artist);
            await _context.SaveChangesAsync();
            return artist;
        }

        public async Task<ArtistSubscription> CreateArtistSubscriptionAsync(ArtistSubscription subscription)
        {
            // Verify the Artist exists before creating subscription
            var artistExists = await _context.Artists.AnyAsync(a => a.Id == subscription.ArtistId);
            if (!artistExists)
            {
                throw new InvalidOperationException($"Artist with Id {subscription.ArtistId} does not exist.");
            }

            try
            {
                _context.ArtistSubscriptions.Add(subscription);
                await _context.SaveChangesAsync();
                return subscription;
            }
            catch (DbUpdateException ex)
            {
                // Log the inner exception for debugging
                throw new InvalidOperationException($"Failed to create subscription: {ex.InnerException?.Message ?? ex.Message}", ex);
            }
        }

        public async Task<ArtistSubscription?> GetSubscriptionByPaddleSubscriptionIdAsync(string paddleSubscriptionId)
        {
            return await _context.ArtistSubscriptions
                .Include(s => s.Artist)
                    .ThenInclude(a => a.User)
                .FirstOrDefaultAsync(s => s.PaddleSubscriptionId == paddleSubscriptionId);
        }

        public async Task<ArtistSubscription?> GetActiveSubscriptionByArtistIdAsync(Guid artistId)
        {
            return await _context.ArtistSubscriptions
                .Include(s => s.Artist)
                    .ThenInclude(a => a.User)
                .Where(s => s.ArtistId == artistId && s.Status == "active")
                .OrderByDescending(s => s.CreatedAt)
                .FirstOrDefaultAsync();
        }

        public async Task<ArtistSubscription?> GetSubscriptionByArtistIdAsync(Guid artistId, string? status = null)
        {
            var query = _context.ArtistSubscriptions
                .Include(s => s.Artist)
                    .ThenInclude(a => a.User)
                .Where(s => s.ArtistId == artistId);
            
            if (!string.IsNullOrEmpty(status))
            {
                query = query.Where(s => s.Status == status);
            }
            else
            {
                // If no status specified, get active or trial subscriptions
                query = query.Where(s => s.Status == "active" || s.Status == "trial");
            }
            
            return await query
                .OrderByDescending(s => s.CreatedAt)
                .FirstOrDefaultAsync();
        }

        public async Task<ArtistSubscription> UpdateSubscriptionAsync(ArtistSubscription subscription)
        {
            _context.ArtistSubscriptions.Update(subscription);
            await _context.SaveChangesAsync();
            return subscription;
        }

        public async Task<User?> GetUserByEmailAsync(string email)
        {
            return await _context.Users
                .Include(u => u.ArtistProfile)
                    .ThenInclude(a => a.ArtistSubscriptions)
                .Include(u => u.ArtistProfile)
                    .ThenInclude(a => a.SalonMemberships)
                .FirstOrDefaultAsync(u => u.Email == email && u.IsActive);
        }

        public async Task<User?> GetUserByPhoneForVerificationAsync(string phone)
        {
            // Get user for verification (including inactive users during signup)
            return await _context.Users
                .FirstOrDefaultAsync(u => u.Phone == phone);
        }

        public async Task UpdateUserPhoneVerifiedAsync(Guid userId)
        {
            var user = await _context.Users.FindAsync(userId);
            if (user != null)
            {
                user.PhoneVerified = true;
                user.PhoneVerificationCode = null;
                user.PhoneVerificationExpiresAt = null;
                await _context.SaveChangesAsync();
            }
        }

        public async Task<User?> GetUserByIdWithArtistProfileAsync(Guid userId)
        {
            // Use AsNoTracking to ensure we get fresh data from the database
            // This prevents issues with cached entities that might not have updated navigation properties
            return await _context.Users
                .AsNoTracking()
                .Include(u => u.ArtistProfile)
                .ThenInclude(a => a.ArtistSubscriptions)
                .Include(u => u.ArtistProfile)
                    .ThenInclude(a => a.SalonMemberships)
                .Include(u => u.OwnedSalons)
                .FirstOrDefaultAsync(u => u.Id == userId && u.IsActive);
        }

        public async Task<Artist?> GetArtistByUserIdAsync(Guid userId)
        {
            return await _context.Artists
                .FirstOrDefaultAsync(a => a.UserId == userId);
        }

        public async Task<Artist> UpdateArtistProfileAsync(Artist artist)
        {
            _context.Artists.Update(artist);
            await _context.SaveChangesAsync();
            return artist;
        }

        public async Task UpdateUserPasswordResetCodeAsync(Guid userId, string resetCode, DateTime expiresAt)
        {
            var user = await _context.Users.FindAsync(userId);
            if (user != null)
            {
                user.PasswordResetCode = resetCode;
                user.PasswordResetExpiresAt = expiresAt;
                await _context.SaveChangesAsync();
            }
        }

        public async Task ClearUserPasswordResetCodeAsync(Guid userId)
        {
            var user = await _context.Users.FindAsync(userId);
            if (user != null)
            {
                user.PasswordResetCode = null;
                user.PasswordResetExpiresAt = null;
                await _context.SaveChangesAsync();
            }
        }

        public async Task UpdateUserPasswordAsync(Guid userId, string passwordHash)
        {
            var user = await _context.Users.FindAsync(userId);
            if (user != null)
            {
                user.PasswordHash = passwordHash;
                await _context.SaveChangesAsync();
            }
        }

        public async Task<User> UpdateUserAsync(User user)
        {
            _context.Users.Update(user);
            await _context.SaveChangesAsync();
            return user;
        }

        public async Task<User?> GetUserByPhoneIncludingInactiveAsync(string phone)
        {
            return await _context.Users
                .Include(u => u.ArtistProfile)
                .ThenInclude(a => a.ArtistSubscriptions)
                .Include(u => u.ArtistProfile)
                    .ThenInclude(a => a.SalonMemberships)
                .FirstOrDefaultAsync(u => u.Phone == phone);
        }

        public async Task<User?> GetUserByIdIncludingInactiveAsync(Guid userId)
        {
            return await _context.Users
                .Include(u => u.ArtistProfile)
                .ThenInclude(a => a.ArtistSubscriptions)
                .Include(u => u.ArtistProfile)
                    .ThenInclude(a => a.SalonMemberships)
                .FirstOrDefaultAsync(u => u.Id == userId);
        }

        public async Task<bool> DeleteUserPermanentlyAsync(Guid userId)
        {
            var user = await _context.Users
                .Include(u => u.ArtistProfile)
                .FirstOrDefaultAsync(u => u.Id == userId);

            if (user == null)
            {
                return false;
            }

            // Delete artist profile if exists
            if (user.ArtistProfile != null)
            {
                _context.Artists.Remove(user.ArtistProfile);
            }

            // Delete user
            _context.Users.Remove(user);
            await _context.SaveChangesAsync();

            return true;
        }

        public async Task<List<User>> GetUsersByIdsAsync(List<Guid> userIds)
        {
            return await _context.Users
                .Where(u => userIds.Contains(u.Id) && u.IsActive)
                .ToListAsync();
        }

        public async Task UpdateUserFcmTokenAsync(Guid userId, string? fcmToken)
        {
            var user = await _context.Users.FindAsync(userId);
            if (user != null)
            {
                user.FcmToken = fcmToken;
                await _context.SaveChangesAsync();
            }
        }

        public async Task<Artist?> GetArtistByCustomBookingLinkAsync(string customBookingLink)
        {
            var normalizedLink = customBookingLink.Trim().ToLowerInvariant();
            return await _context.Artists
                .Include(a => a.User)
                .FirstOrDefaultAsync(a => a.CustomBookingLink != null && a.CustomBookingLink.ToLower() == normalizedLink && a.User.IsActive);
        }
    }
}
