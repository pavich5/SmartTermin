using SmartTermin.DataAccess.DataContext;
using SmartTermin.DomainModels.Models;
using Microsoft.EntityFrameworkCore;
using System.Linq;

namespace SmartTermin.DataAccess.Repositories
{
    public class SalonRepository : ISalonRepository
    {
        private readonly SmartTerminDbContext _context;

        public SalonRepository(SmartTerminDbContext context)
        {
            _context = context;
        }

        public async Task<Salon> CreateSalonAsync(Salon salon)
        {
            _context.Salons.Add(salon);
            await _context.SaveChangesAsync();
            return salon;
        }

        public async Task<Salon?> GetSalonByIdAsync(Guid salonId)
        {
            return await _context.Salons.AsNoTracking().FirstOrDefaultAsync(s => s.Id == salonId);
        }

        public async Task<Salon?> GetSalonWithDetailsAsync(Guid salonId)
        {
            return await _context.Salons
                .Include(s => s.Subscription)
                .Include(s => s.Invitations)
                .Include(s => s.Owner)
                    .ThenInclude(u => u.ArtistProfile)
                        .ThenInclude(a => a.PortfolioImages)
                .Include(s => s.Memberships.Where(m => m.Status == "active"))
                    .ThenInclude(m => m.Artist)
                        .ThenInclude(a => a.User)
                .Include(s => s.Memberships.Where(m => m.Status == "active"))
                    .ThenInclude(m => m.Artist)
                        .ThenInclude(a => a.PortfolioImages)
                .FirstOrDefaultAsync(s => s.Id == salonId);
        }

        public async Task<Salon> UpdateSalonAsync(Salon salon)
        {
            // Check if the salon is already being tracked
            var trackedSalon = await _context.Salons.FindAsync(salon.Id);
            if (trackedSalon != null)
            {
                // Update the tracked entity
                _context.Entry(trackedSalon).CurrentValues.SetValues(salon);
                await _context.SaveChangesAsync();
                return trackedSalon;
            }
            else
            {
                // Entity is not tracked, use Update
                _context.Salons.Update(salon);
                await _context.SaveChangesAsync();
                return salon;
            }
        }

        public async Task<bool> DeleteSalonAsync(Guid salonId)
        {
            var salon = await _context.Salons.FindAsync(salonId);
            if (salon == null)
            {
                return false;
            }

            // Delete all related data explicitly to ensure hard delete
            // Note: Some of these may cascade automatically, but we delete explicitly to be sure
            
            // Delete salon subscriptions
            var subscriptions = await _context.SalonSubscriptions
                .Where(s => s.SalonId == salonId)
                .ToListAsync();
            _context.SalonSubscriptions.RemoveRange(subscriptions);

            // Delete salon memberships
            var memberships = await _context.SalonMemberships
                .Where(m => m.SalonId == salonId)
                .ToListAsync();
            _context.SalonMemberships.RemoveRange(memberships);

            // Delete salon invitations
            var invitations = await _context.SalonInvitations
                .Where(i => i.SalonId == salonId)
                .ToListAsync();
            _context.SalonInvitations.RemoveRange(invitations);

            // Delete salon holidays
            var holidays = await _context.SalonHolidays
                .Where(h => h.SalonId == salonId)
                .ToListAsync();
            _context.SalonHolidays.RemoveRange(holidays);

            // Delete salon portfolio images
            var portfolioImages = await _context.PortfolioImages
                .Where(p => p.SalonId == salonId)
                .ToListAsync();
            _context.PortfolioImages.RemoveRange(portfolioImages);

            // Delete blocked clients for this salon
            var blockedClients = await _context.BlockedClients
                .Where(bc => bc.SalonId == salonId)
                .ToListAsync();
            _context.BlockedClients.RemoveRange(blockedClients);

            // Finally, delete the salon itself
            _context.Salons.Remove(salon);
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<IList<SalonMembership>> GetMembersAsync(Guid salonId)
        {
            return await _context.SalonMemberships
                .AsNoTracking()
                .Include(m => m.Artist)
                    .ThenInclude(a => a.User)
                .Include(m => m.Artist)
                    .ThenInclude(a => a.PortfolioImages)
                .Include(m => m.Artist)
                    .ThenInclude(a => a.Services.Where(s => s.IsActive))
                .Where(m => m.SalonId == salonId)
                .ToListAsync();
        }

        public async Task<SalonMembership> AddMembershipAsync(SalonMembership membership)
        {
            _context.SalonMemberships.Add(membership);
            await _context.SaveChangesAsync();
            return membership;
        }

        public async Task<bool> RemoveMembershipAsync(Guid salonId, Guid artistId)
        {
            var membership = await _context.SalonMemberships
                .FirstOrDefaultAsync(m => m.SalonId == salonId && m.ArtistId == artistId);

            if (membership == null)
            {
                return false;
            }

            _context.SalonMemberships.Remove(membership);
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<IList<SalonInvitation>> GetInvitationsForSalonAsync(Guid salonId)
        {
            return await _context.SalonInvitations
                .Where(i => i.SalonId == salonId)
                .ToListAsync();
        }

        public async Task<SalonInvitation> CreateInvitationAsync(SalonInvitation invitation)
        {
            _context.SalonInvitations.Add(invitation);
            await _context.SaveChangesAsync();
            return invitation;
        }

        public async Task<SalonInvitation?> GetInvitationByTokenAsync(string token)
        {
            return await _context.SalonInvitations
                .Include(i => i.Salon)
                .Include(i => i.InvitedByUser)
                .FirstOrDefaultAsync(i => i.Token == token);
        }

        public async Task<SalonInvitation?> GetInvitationByIdAsync(Guid invitationId)
        {
            return await _context.SalonInvitations
                .Include(i => i.Salon)
                .Include(i => i.InvitedByUser)
                .FirstOrDefaultAsync(i => i.Id == invitationId);
        }

        public async Task UpdateInvitationAsync(SalonInvitation invitation)
        {
            _context.SalonInvitations.Update(invitation);
            await _context.SaveChangesAsync();
        }

        public async Task<bool> DeleteInvitationAsync(Guid invitationId)
        {
            var invitation = await _context.SalonInvitations.FindAsync(invitationId);
            if (invitation == null) return false;
            
            _context.SalonInvitations.Remove(invitation);
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<SalonInvitation?> GetPendingInvitationByEmailOrPhoneAsync(Guid salonId, string? email, string? phone)
        {
            var query = _context.SalonInvitations
                .Where(i => i.SalonId == salonId && 
                           i.Status == "pending" && 
                           i.ExpiresAt > DateTime.UtcNow);

            if (!string.IsNullOrWhiteSpace(email))
            {
                query = query.Where(i => i.Email != null && i.Email.ToLower() == email.ToLower());
            }
            else if (!string.IsNullOrWhiteSpace(phone))
            {
                query = query.Where(i => i.Phone != null && i.Phone == phone);
            }
            else
            {
                return null;
            }

            return await query.FirstOrDefaultAsync();
        }

        public async Task<SalonSubscription?> GetSubscriptionAsync(Guid salonId)
        {
            return await _context.SalonSubscriptions
                .AsNoTracking()
                .FirstOrDefaultAsync(s => s.SalonId == salonId);
        }

        public async Task<SalonSubscription?> GetSubscriptionByPaddleSubscriptionIdAsync(string paddleSubscriptionId)
        {
            return await _context.SalonSubscriptions
                .AsNoTracking()
                .FirstOrDefaultAsync(s => s.PaddleSubscriptionId == paddleSubscriptionId);
        }

        public async Task<Dictionary<Guid, SalonSubscription?>> GetSubscriptionsBySalonIdsAsync(IEnumerable<Guid> salonIds)
        {
            var salonIdsList = salonIds.ToList();
            if (!salonIdsList.Any())
            {
                return new Dictionary<Guid, SalonSubscription?>();
            }

            var subscriptions = await _context.SalonSubscriptions
                .AsNoTracking()
                .Where(s => salonIdsList.Contains(s.SalonId))
                .ToListAsync();

            var result = salonIdsList.ToDictionary(
                id => id,
                id => subscriptions.FirstOrDefault(s => s.SalonId == id)
            );

            return result;
        }

        public async Task<SalonSubscription> UpsertSubscriptionAsync(SalonSubscription subscription)
        {
            var existing = await _context.SalonSubscriptions
                .FirstOrDefaultAsync(s => s.SalonId == subscription.SalonId);

            if (existing == null)
            {
                _context.SalonSubscriptions.Add(subscription);
                await _context.SaveChangesAsync();
                return subscription;
            }

            existing.ArtistCount = subscription.ArtistCount;
            existing.MonthlyCost = subscription.MonthlyCost;
            existing.BillingCycle = subscription.BillingCycle;
            existing.Status = subscription.Status;
            // Only update PaddleSubscriptionId if a new value is provided (not null/empty)
            // This preserves the existing PaddleSubscriptionId when updating other fields
            if (!string.IsNullOrEmpty(subscription.PaddleSubscriptionId))
            {
                existing.PaddleSubscriptionId = subscription.PaddleSubscriptionId;
            }
            existing.CurrentPeriodStart = subscription.CurrentPeriodStart;
            existing.CurrentPeriodEnd = subscription.CurrentPeriodEnd;
            existing.NextPaymentDate = subscription.NextPaymentDate;
            existing.TrialEndsAt = subscription.TrialEndsAt;
            existing.UpdatedAt = DateTime.UtcNow;

            _context.SalonSubscriptions.Update(existing);
            await _context.SaveChangesAsync();
            return existing;
        }

        public async Task<List<SalonSubscription>> GetAllSubscriptionsAsync()
        {
            return await _context.SalonSubscriptions.ToListAsync();
        }

        public async Task<IList<Booking>> GetBookingsForSalonAsync(Guid salonId, DateTime? startDate, DateTime? endDate)
        {
            var artistIds = _context.SalonMemberships
                .Where(m => m.SalonId == salonId && m.Status == "active")
                .Select(m => m.ArtistId);

            var query = _context.Bookings
                .Include(b => b.BookingServices)
                    .ThenInclude(bs => bs.Service)
                .Include(b => b.Artist)
                    .ThenInclude(a => a.User)
                .Where(b => artistIds.Contains(b.ArtistId));

            if (startDate.HasValue)
            {
                query = query.Where(b => b.BookingDate >= startDate.Value.Date);
            }

            if (endDate.HasValue)
            {
                query = query.Where(b => b.BookingDate <= endDate.Value.Date);
            }

            return await query
                .OrderBy(b => b.BookingDate)
                .ThenBy(b => b.BookingTime)
                .ToListAsync();
        }

        public async Task<List<(Guid ArtistId, int Count, decimal Revenue)>> GetBookingStatsForArtistsAsync(IEnumerable<Guid> artistIds)
        {
            var artistIdsList = artistIds.ToList();
            if (!artistIdsList.Any())
            {
                return new List<(Guid, int, decimal)>();
            }

            // Use aggregation query - only get stats, not full booking entities
            var stats = await _context.Bookings
                .AsNoTracking()
                .Where(b => artistIdsList.Contains(b.ArtistId))
                .GroupBy(b => b.ArtistId)
                .Select(g => new
                {
                    ArtistId = g.Key,
                    Count = g.Count(),
                    Revenue = g.Sum(b => b.TotalPrice ?? 0)
                })
                .ToListAsync();

            return stats.Select(s => (s.ArtistId, s.Count, s.Revenue)).ToList();
        }

        public async Task<Dictionary<Guid, IList<Booking>>> GetBookingsBySalonIdsAsync(IEnumerable<Guid> salonIds)
        {
            var salonIdsList = salonIds.ToList();
            if (!salonIdsList.Any())
            {
                return new Dictionary<Guid, IList<Booking>>();
            }

            // Get all memberships for all salons in one query
            var memberships = await _context.SalonMemberships
                .AsNoTracking()
                .Where(m => salonIdsList.Contains(m.SalonId) && m.Status == "active")
                .ToListAsync();

            // Group memberships by salon ID in memory
            var salonArtistMap = memberships
                .GroupBy(m => m.SalonId)
                .ToDictionary(g => g.Key, g => g.Select(m => m.ArtistId).ToList());

            var allArtistIds = salonArtistMap.Values.SelectMany(ids => ids).Distinct().ToList();
            
            if (!allArtistIds.Any())
            {
                return salonIdsList.ToDictionary(id => id, id => (IList<Booking>)new List<Booking>());
            }

            // Get all bookings for all artists in one query
            var allBookings = await _context.Bookings
                .AsNoTracking()
                .Include(b => b.BookingServices)
                    .ThenInclude(bs => bs.Service)
                .Include(b => b.Artist)
                    .ThenInclude(a => a.User)
                .Where(b => allArtistIds.Contains(b.ArtistId))
                .ToListAsync();

            // Group bookings by salon ID
            var result = new Dictionary<Guid, IList<Booking>>();
            foreach (var kvp in salonArtistMap)
            {
                var salonBookings = allBookings
                    .Where(b => kvp.Value.Contains(b.ArtistId))
                    .OrderBy(b => b.BookingDate)
                    .ThenBy(b => b.BookingTime)
                    .ToList();
                result[kvp.Key] = salonBookings;
            }

            // Ensure all salon IDs are in the dictionary (even if they have no bookings or memberships)
            foreach (var salonId in salonIdsList)
            {
                if (!result.ContainsKey(salonId))
                {
                    result[salonId] = new List<Booking>();
                }
            }

            return result;
        }

        public async Task<IList<Artist>> GetArtistsForSalonAsync(Guid salonId)
        {
            var artistIds = await _context.SalonMemberships
                .Where(m => m.SalonId == salonId && m.Status == "active")
                .Select(m => m.ArtistId)
                .ToListAsync();

            return await _context.Artists
                .Include(a => a.User)
                .Where(a => artistIds.Contains(a.Id))
                .ToListAsync();
        }

        public Task SaveChangesAsync()
        {
            return _context.SaveChangesAsync();
        }

        public async Task<IList<Salon>> GetAllSalonsAsync()
        {
            return await _context.Salons
                .AsNoTracking()
                .Include(s => s.Memberships.Where(m => m.Status == "active"))
                    .ThenInclude(m => m.Artist)
                        .ThenInclude(a => a.User)
                .Include(s => s.Memberships.Where(m => m.Status == "active"))
                    .ThenInclude(m => m.Artist)
                        .ThenInclude(a => a.PortfolioImages)
                .Include(s => s.Memberships.Where(m => m.Status == "active"))
                    .ThenInclude(m => m.Artist)
                        .ThenInclude(a => a.Services.Where(s => s.IsActive))
                .Include(s => s.Owner)
                    .ThenInclude(o => o.ArtistProfile)
                        .ThenInclude(ap => ap.PortfolioImages)
                .ToListAsync();
        }

        public async Task<(IList<Salon> Salons, int TotalCount)> GetAllSalonsAsync(int page, int limit)
        {
            var query = _context.Salons
                .AsNoTracking()
                .Include(s => s.Memberships.Where(m => m.Status == "active"))
                    .ThenInclude(m => m.Artist)
                        .ThenInclude(a => a.User)
                .Include(s => s.Memberships.Where(m => m.Status == "active"))
                    .ThenInclude(m => m.Artist)
                        .ThenInclude(a => a.PortfolioImages)
                .Include(s => s.Memberships.Where(m => m.Status == "active"))
                    .ThenInclude(m => m.Artist)
                        .ThenInclude(a => a.Services.Where(s => s.IsActive))
                .Include(s => s.Owner)
                    .ThenInclude(o => o.ArtistProfile)
                        .ThenInclude(ap => ap.PortfolioImages);

            var totalCount = await query.CountAsync();
            
            var salons = await query
                .Skip((page - 1) * limit)
                .Take(limit)
                .ToListAsync();

            return (salons, totalCount);
        }

        public async Task<Salon?> GetSalonByCustomBookingLinkAsync(string customBookingLink)
        {
            var normalizedLink = customBookingLink.Trim().ToLowerInvariant();
            return await _context.Salons
                .Include(s => s.Memberships.Where(m => m.Status == "active"))
                    .ThenInclude(m => m.Artist)
                        .ThenInclude(a => a.User)
                .Include(s => s.Memberships.Where(m => m.Status == "active"))
                    .ThenInclude(m => m.Artist)
                        .ThenInclude(a => a.PortfolioImages)
                .Include(s => s.Memberships.Where(m => m.Status == "active"))
                    .ThenInclude(m => m.Artist)
                        .ThenInclude(a => a.Services.Where(s => s.IsActive))
                .Include(s => s.Owner)
                    .ThenInclude(o => o.ArtistProfile)
                        .ThenInclude(ap => ap.PortfolioImages)
                .FirstOrDefaultAsync(s => s.CustomBookingLink != null && s.CustomBookingLink.ToLower() == normalizedLink);
        }

        public async Task<(IList<SalonListItemData> Salons, int TotalCount)> GetSalonsListAsync(int page, int limit)
        {
            // Filter at DB level - exclude salons with cancelled/expired subscriptions
            var cancelledOrExpiredSalonIds = await _context.SalonSubscriptions
                .AsNoTracking()
                .Where(s => s.Status == "cancelled" || s.Status == "expired")
                .Select(s => s.SalonId)
                .ToListAsync();

            var cancelledIdsHashSet = cancelledOrExpiredSalonIds.ToHashSet();

            // Base query for salons - exclude salons with cancelled/expired subscriptions
            var baseQuery = _context.Salons
                .AsNoTracking()
                .Where(s => !cancelledIdsHashSet.Contains(s.Id));

            var totalCount = await baseQuery.CountAsync();

            // Get paginated salon IDs
            var salonIds = await baseQuery
                .OrderBy(s => s.Name)
                .Skip((page - 1) * limit)
                .Take(limit)
                .Select(s => s.Id)
                .ToListAsync();

            if (!salonIds.Any())
            {
                return (new List<SalonListItemData>(), totalCount);
            }

            // Get salon basic info
            var salonsData = await _context.Salons
                .AsNoTracking()
                .Where(s => salonIds.Contains(s.Id))
                .Select(s => new
                {
                    s.Id,
                    s.Name,
                    s.OwnerUserId,
                    s.Address,
                    s.City,
                    s.Country,
                    s.Phone,
                    s.Email,
                    s.BannerImageUrl,
                    s.ProfileImageUrl,
                    s.About,
                    s.CustomBookingLink
                })
                .ToListAsync();

            // Get owner info - separate queries to avoid cartesian explosion
            var ownerUserIds = salonsData.Select(s => s.OwnerUserId).Distinct().ToList();
            var owners = await _context.Users
                .AsNoTracking()
                .Where(u => ownerUserIds.Contains(u.Id))
                .Select(u => new { u.Id, u.FullName })
                .ToListAsync();

            var ownerArtistIds = await _context.Artists
                .AsNoTracking()
                .Where(a => ownerUserIds.Contains(a.UserId))
                .Select(a => new { a.UserId, a.Id, a.SalonId })
                .ToListAsync();

            var ownerArtistProfileIds = ownerArtistIds.Select(a => a.Id).ToList();
            var ownerProfileImages = await _context.PortfolioImages
                .AsNoTracking()
                .Where(p => p.ArtistId.HasValue && ownerArtistProfileIds.Contains(p.ArtistId.Value) && p.IsProfilePicture)
                .Select(p => new { p.ArtistId, p.ImageUrl })
                .ToListAsync();

            // Get memberships first
            var memberships = await _context.SalonMemberships
                .AsNoTracking()
                .Where(m => salonIds.Contains(m.SalonId) && m.Status == "active")
                .Select(m => new { m.SalonId, m.ArtistId, m.Role })
                .ToListAsync();

            var membershipArtistIds = memberships.Select(m => m.ArtistId).Distinct().ToList();

            // Get artist and user data in separate queries to avoid cartesian explosion
            var artists = await _context.Artists
                .AsNoTracking()
                .Where(a => membershipArtistIds.Contains(a.Id))
                .Select(a => new
                {
                    a.Id,
                    a.UserId,
                    a.Profession,
                    a.SalonId
                })
                .ToListAsync();

            var artistUserIds = artists.Select(a => a.UserId).Distinct().ToList();
            var users = await _context.Users
                .AsNoTracking()
                .Where(u => artistUserIds.Contains(u.Id))
                .Select(u => new { u.Id, u.FullName })
                .ToListAsync();

            var portfolioImages = await _context.PortfolioImages
                .AsNoTracking()
                .Where(p => p.ArtistId.HasValue && membershipArtistIds.Contains(p.ArtistId.Value) && p.IsProfilePicture)
                .Select(p => new { p.ArtistId, p.ImageUrl })
                .ToListAsync();

            // Get artist IDs for booking aggregation
            var artistIds = membershipArtistIds;

            // Skip booking stats for list view - not needed and very expensive
            // Booking stats are only needed in detailed views
            var bookingStatsDict = new Dictionary<Guid, (int Count, decimal Revenue)>();

            // Get services for all artists in one query
            var artistServices = await _context.Services
                .AsNoTracking()
                .Where(s => artistIds.Contains(s.ArtistId) && s.IsActive && s.Price > 0)
                .Select(s => new { s.ArtistId, s.Name, s.Price })
                .ToListAsync();

            // Build owner lookup dictionaries
            var ownersDict = owners.ToDictionary(o => o.Id);
            var ownerArtistDict = ownerArtistIds.ToDictionary(a => a.UserId);
            var ownerProfileImageDict = ownerProfileImages
                .Where(p => p.ArtistId.HasValue)
                .ToDictionary(p => p.ArtistId!.Value, p => p.ImageUrl);

            // Build result
            var result = new List<SalonListItemData>();
            foreach (var salon in salonsData)
            {
                var owner = ownersDict.GetValueOrDefault(salon.OwnerUserId);
                var ownerArtist = owner != null ? ownerArtistDict.GetValueOrDefault(owner.Id) : null;
                var ownerProfileImageUrl = ownerArtist != null && ownerArtist.SalonId == salon.Id
                    ? ownerProfileImageDict.GetValueOrDefault(ownerArtist.Id)
                    : null;
                var ownerArtistId = ownerArtist != null && ownerArtist.SalonId == salon.Id
                    ? ownerArtist.Id
                    : (Guid?)null;
                var salonMemberships = memberships.Where(m => m.SalonId == salon.Id).ToList();
                
                // Build members
                var memberList = salonMemberships
                    .Where(m =>
                    {
                        var artist = artists.FirstOrDefault(a => a.Id == m.ArtistId);
                        return artist != null && (m.Role != "owner" || (m.Role == "owner" && artist.SalonId == salon.Id));
                    })
                    .Select(m =>
                    {
                        var artist = artists.FirstOrDefault(a => a.Id == m.ArtistId);
                        if (artist == null) return null;
                        
                        var user = users.FirstOrDefault(u => u.Id == artist.UserId);
                        var profileImage = portfolioImages.FirstOrDefault(p => p.ArtistId == m.ArtistId);
                        return new SalonMemberListItemData
                        {
                            ArtistId = m.ArtistId,
                            UserId = artist.UserId,
                            FullName = user?.FullName ?? "Artist",
                            Role = m.Role,
                            ProfileImageUrl = profileImage?.ImageUrl,
                            Profession = artist.Profession,
                            BookingCount = 0,  // Not needed for list view
                            Revenue = 0m       // Not needed for list view
                        };
                    })
                    .Where(m => m != null)
                    .Cast<SalonMemberListItemData>()
                    .ToList();

                // Get services for salon members
                var memberArtistIds = memberList.Select(m => m.ArtistId).ToList();
                var services = artistServices
                    .Where(s => memberArtistIds.Contains(s.ArtistId))
                    .Select(s => s.Name)
                    .Distinct()
                    .ToList();

                var minPrice = artistServices
                    .Where(s => memberArtistIds.Contains(s.ArtistId))
                    .Select(s => s.Price)
                    .OrderBy(p => p)
                    .FirstOrDefault();

                result.Add(new SalonListItemData
                {
                    Id = salon.Id,
                    Name = salon.Name,
                    OwnerUserId = salon.OwnerUserId,
                    OwnerFullName = owner?.FullName,
                    OwnerArtistId = ownerArtistId,
                    OwnerProfileImageUrl = ownerProfileImageUrl,
                    Address = salon.Address,
                    City = salon.City,
                    Country = salon.Country,
                    Phone = salon.Phone,
                    Email = salon.Email,
                    BannerImageUrl = salon.BannerImageUrl,
                    ProfileImageUrl = salon.ProfileImageUrl,
                    About = salon.About,
                    CustomBookingLink = salon.CustomBookingLink,
                    Members = memberList,
                    CombinedServices = services,
                    MinServicePrice = minPrice > 0 ? minPrice : null
                });
            }

            // Sort by original salon IDs order
            var orderedResult = salonIds
                .Select(id => result.FirstOrDefault(r => r.Id == id))
                .Where(r => r != null)
                .ToList()!;

            return (orderedResult, totalCount);
        }

        public async Task<SalonDetailData?> GetSalonDetailDataAsync(Guid salonId)
        {
            // Check if salon exists
            var salonExists = await _context.Salons
                .AsNoTracking()
                .AnyAsync(s => s.Id == salonId);
            
            if (!salonExists)
                return null;

            // Get memberships basic info
            var memberships = await _context.SalonMemberships
                .AsNoTracking()
                .Where(m => m.SalonId == salonId && m.Status == "active")
                .Select(m => new SalonMembershipBasic
                {
                    SalonId = m.SalonId,
                    ArtistId = m.ArtistId,
                    Role = m.Role
                })
                .ToListAsync();

            var memberArtistIds = memberships.Select(m => m.ArtistId).Distinct().ToList();

            if (!memberArtistIds.Any())
            {
                return new SalonDetailData
                {
                    Memberships = memberships
                };
            }

            // Load all data sequentially (DbContext is not thread-safe, so we can't run queries in parallel)
            var artists = await _context.Artists
                .AsNoTracking()
                .Where(a => memberArtistIds.Contains(a.Id))
                .Select(a => new ArtistBasic
                {
                    Id = a.Id,
                    UserId = a.UserId,
                    Profession = a.Profession,
                    SalonId = a.SalonId
                })
                .ToListAsync();

            var services = await _context.Services
                .AsNoTracking()
                .Where(s => memberArtistIds.Contains(s.ArtistId) && s.IsActive)
                .Select(s => new ServiceBasic
                {
                    ArtistId = s.ArtistId,
                    Name = s.Name,
                    Price = s.Price
                })
                .ToListAsync();

            var profileImages = await _context.PortfolioImages
                .AsNoTracking()
                .Where(p => p.ArtistId.HasValue && memberArtistIds.Contains(p.ArtistId.Value) && p.IsProfilePicture)
                .Select(p => new { p.ArtistId, p.ImageUrl })
                .ToListAsync();

            var artistUserIds = artists.Select(a => a.UserId).Distinct().ToList();
            var users = await _context.Users
                .AsNoTracking()
                .Where(u => artistUserIds.Contains(u.Id))
                .Select(u => new UserBasic
                {
                    Id = u.Id,
                    FullName = u.FullName
                })
                .ToListAsync();

            return new SalonDetailData
                {
                    Memberships = memberships,
                    MemberArtistIds = memberArtistIds,
                    ArtistsDict = artists.ToDictionary(a => a.Id),
                    UsersDict = users.ToDictionary(u => u.Id),
                    ProfileImageDict = profileImages
                        .Where(p => p.ArtistId.HasValue)
                        .ToDictionary(p => p.ArtistId!.Value, p => p.ImageUrl),
                    Services = services
                };
        }

        public async Task<int> GetActiveArtistCountAsync(Guid salonId)
        {
            return await _context.SalonMemberships
                .AsNoTracking()
                .CountAsync(m => m.SalonId == salonId && m.Status == "active");
        }

        public async Task<List<(Guid ArtistId, string ServiceName)>> GetAllServicesForArtistsAsync(List<Guid> artistIds)
        {
            if (!artistIds.Any())
            {
                return new List<(Guid ArtistId, string ServiceName)>();
            }

            var services = await _context.Services
                .AsNoTracking()
                .Where(s => artistIds.Contains(s.ArtistId) && s.IsActive)
                .Select(s => new { s.ArtistId, s.Name })
                .ToListAsync();

            return services
                .Select(s => (s.ArtistId, ServiceName: s.Name ?? "Service"))
                .ToList();
        }

        public async Task<SalonAnalyticsData> GetAnalyticsDataAsync(Guid salonId)
        {
            // Get active artist IDs for this salon
            var artistIds = await _context.SalonMemberships
                .AsNoTracking()
                .Where(m => m.SalonId == salonId && m.Status == "active")
                .Select(m => m.ArtistId)
                .ToListAsync();

            if (!artistIds.Any())
            {
                return new SalonAnalyticsData();
            }

            // Get bookings with basic info (no deep includes to avoid cartesian explosion)
            var bookings = await _context.Bookings
                .AsNoTracking()
                .Where(b => artistIds.Contains(b.ArtistId) && (b.Status == "completed" || b.Status == "confirmed"))
                .Select(b => new BookingAnalyticsBasic
                {
                    Id = b.Id,
                    ArtistId = b.ArtistId,
                    ClientId = b.ClientId,
                    BookingDate = b.BookingDate,
                    TotalPrice = b.TotalPrice,
                    Status = b.Status
                })
                .ToListAsync();

            // Get service IDs and prices separately (more efficient)
            var bookingIds = bookings.Select(b => b.Id).ToList();
            var bookingServices = await _context.BookingServices
                .AsNoTracking()
                .Where(bs => bookingIds.Contains(bs.BookingId))
                .Select(bs => new { bs.BookingId, bs.ServiceId, bs.Price })
                .ToListAsync();

            // Group services by booking ID
            var servicesByBooking = bookingServices
                .GroupBy(bs => bs.BookingId)
                .ToDictionary(
                    g => g.Key,
                    g => (ServiceIds: g.Select(x => x.ServiceId).ToList(), Prices: g.Select(x => x.Price).ToList())
                );

            // Attach service data to bookings
            foreach (var booking in bookings)
            {
                if (servicesByBooking.TryGetValue(booking.Id, out var serviceData))
                {
                    booking.ServiceIds = serviceData.ServiceIds;
                    booking.ServicePrices = serviceData.Prices;
                }
            }

            // Get artist names
            var artistUserIds = await _context.Artists
                .AsNoTracking()
                .Where(a => artistIds.Contains(a.Id))
                .Select(a => new { a.Id, a.UserId })
                .ToListAsync();

            var userIds = artistUserIds.Select(a => a.UserId).Distinct().ToList();
            var users = await _context.Users
                .AsNoTracking()
                .Where(u => userIds.Contains(u.Id))
                .Select(u => new { u.Id, u.FullName })
                .ToListAsync();

            var artistNamesDict = artistUserIds
                .Join(users, a => a.UserId, u => u.Id, (a, u) => new { a.Id, u.FullName })
                .ToDictionary(x => x.Id, x => x.FullName ?? "Artist");

            // Get service names
            var serviceIds = bookingServices.Select(bs => bs.ServiceId).Distinct().ToList();
            var services = await _context.Services
                .AsNoTracking()
                .Where(s => serviceIds.Contains(s.Id))
                .Select(s => new { s.Id, s.Name })
                .ToListAsync();

            var serviceNamesDict = services.ToDictionary(s => s.Id, s => s.Name ?? "Service");

            return new SalonAnalyticsData
            {
                Bookings = bookings,
                ArtistNamesDict = artistNamesDict,
                ServiceNamesDict = serviceNamesDict
            };
        }

        public async Task<(List<SalonCalendarBookingData> Bookings, Dictionary<Guid, string> ArtistNames, Dictionary<Guid, string> ServiceNames, int TotalCount)> GetCalendarDataAsync(Guid salonId, DateTime? startDate, DateTime? endDate, int page, int limit)
        {
            // Get active artist IDs for this salon
            var artistIds = await _context.SalonMemberships
                .AsNoTracking()
                .Where(m => m.SalonId == salonId && m.Status == "active")
                .Select(m => m.ArtistId)
                .ToListAsync();

            if (!artistIds.Any())
            {
                return (new List<SalonCalendarBookingData>(), new Dictionary<Guid, string>(), new Dictionary<Guid, string>(), 0);
            }

            // Build query with date filters
            var baseQuery = _context.Bookings
                .AsNoTracking()
                .Where(b => artistIds.Contains(b.ArtistId));

            if (startDate.HasValue)
            {
                baseQuery = baseQuery.Where(b => b.BookingDate >= startDate.Value.Date);
            }

            if (endDate.HasValue)
            {
                baseQuery = baseQuery.Where(b => b.BookingDate <= endDate.Value.Date);
            }

            // Get total count
            var totalCount = await baseQuery.CountAsync();

            // Apply pagination
            var bookings = await baseQuery
                .Select(b => new SalonCalendarBookingData
                {
                    Id = b.Id,
                    ArtistId = b.ArtistId,
                    ClientId = b.ClientId,
                    CustomerName = b.CustomerName,
                    BookingDate = b.BookingDate,
                    BookingTime = b.BookingTime,
                    TotalDurationMinutes = b.TotalDurationMinutes,
                    TotalPrice = b.TotalPrice,
                    Status = b.Status
                })
                .OrderBy(b => b.BookingDate)
                .ThenBy(b => b.BookingTime)
                .Skip((page - 1) * limit)
                .Take(limit)
                .ToListAsync();

            // Get first service ID for each booking
            var bookingIds = bookings.Select(b => b.Id).ToList();
            var firstServicesRaw = await _context.BookingServices
                .AsNoTracking()
                .Where(bs => bookingIds.Contains(bs.BookingId))
                .Select(bs => new { bs.BookingId, bs.ServiceId })
                .ToListAsync();

            var firstServices = firstServicesRaw
                .GroupBy(bs => bs.BookingId)
                .Select(g => new { BookingId = g.Key, ServiceId = g.First().ServiceId })
                .ToList();

            var firstServiceDict = firstServices.ToDictionary(s => s.BookingId, s => s.ServiceId);
            foreach (var booking in bookings)
            {
                if (firstServiceDict.TryGetValue(booking.Id, out var serviceId))
                {
                    booking.FirstServiceId = serviceId;
                }
            }

            // Get artist names
            var artistUserIds = await _context.Artists
                .AsNoTracking()
                .Where(a => artistIds.Contains(a.Id))
                .Select(a => new { a.Id, a.UserId })
                .ToListAsync();

            var userIds = artistUserIds.Select(a => a.UserId).Distinct().ToList();
            var users = await _context.Users
                .AsNoTracking()
                .Where(u => userIds.Contains(u.Id))
                .Select(u => new { u.Id, u.FullName })
                .ToListAsync();

            var artistNamesDict = artistUserIds
                .Join(users, a => a.UserId, u => u.Id, (a, u) => new { a.Id, u.FullName })
                .ToDictionary(x => x.Id, x => x.FullName ?? "Artist");

            // Get service names
            var serviceIds = firstServices.Select(s => s.ServiceId).Distinct().ToList();
            var services = await _context.Services
                .AsNoTracking()
                .Where(s => serviceIds.Contains(s.Id))
                .Select(s => new { s.Id, s.Name })
                .ToListAsync();

            var serviceNamesDict = services.ToDictionary(s => s.Id, s => s.Name ?? "Service");

            return (bookings, artistNamesDict, serviceNamesDict, totalCount);
        }
    }
}
