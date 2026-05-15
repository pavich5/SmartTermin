using System;
using SmartTermin.DataAccess.DataContext;
using SmartTermin.DomainModels.Models;
using Microsoft.EntityFrameworkCore;
using System.Collections.Generic;
using System.Linq;

namespace SmartTermin.DataAccess.Repositories
{
    public class ArtistRepository : IArtistRepository
    {
        private readonly SmartTerminDbContext _context;

        public ArtistRepository(SmartTerminDbContext context)
        {
            _context = context;
        }

        public async Task<(IList<Artist> Artists, int TotalCount)> GetArtistsAsync(string? search, string? service, int page, int limit)
        {
            if (page < 1)
            {
                page = 1;
            }

            if (limit < 1)
            {
                limit = 20;
            }

            var query = _context.Artists
                .Include(a => a.Services)
                .Include(a => a.PortfolioImages)
                .Include(a => a.User)
                .Where(a => a.User.IsActive)
                .AsQueryable();

            if (!string.IsNullOrWhiteSpace(search))
            {
                var like = $"%{search.Trim()}%";
                query = query.Where(a =>
                    (a.BusinessName != null && EF.Functions.Like(a.BusinessName, like)) ||
                    (a.Profession != null && EF.Functions.Like(a.Profession, like)) ||
                    (a.Services.Any(s => s.IsActive && EF.Functions.Like(s.Name, like))) ||
                    (a.User.FullName != null && EF.Functions.Like(a.User.FullName, like)));
            }

            if (!string.IsNullOrWhiteSpace(service))
            {
                var serviceLike = $"%{service.Trim()}%";
                query = query.Where(a => 
                    (a.Profession != null && EF.Functions.Like(a.Profession, serviceLike)) ||
                    (a.Services.Any(s => s.IsActive && EF.Functions.Like(s.Name, serviceLike))));
            }

            var total = await query.CountAsync();
            var artists = await query
                .OrderByDescending(a => a.Rating ?? 0)
                .ThenBy(a => a.BusinessName)
                .Skip((page - 1) * limit)
                .Take(limit)
                .ToListAsync();

            return (artists, total);
        }

        public async Task<(IList<ArtistListItemData> Artists, int TotalCount)> GetArtistsListAsync(string? search, string? service, int page, int limit)
        {
            if (page < 1) page = 1;
            if (limit < 1) limit = 20;

            // First, get active user IDs and their full names to filter artists efficiently
            var activeUsers = await _context.Users
                .AsNoTracking()
                .Where(u => u.IsActive)
                .Select(u => new { u.Id, u.FullName })
                .ToListAsync();

            var activeUserIds = activeUsers.Select(u => u.Id).ToList();
            var userFullNameDict = activeUsers.ToDictionary(u => u.Id, u => u.FullName);

            // Base query - filter by active user IDs first (much faster than join)
            // Also filter to only show artists who have completed onboarding (MaximumCancellationHours is not null)
            var baseQuery = _context.Artists
                .AsNoTracking()
                .Where(a => activeUserIds.Contains(a.UserId) && a.MaximumCancellationHours.HasValue);

            // Apply filters - if searching, we need to filter by user full names too
            if (!string.IsNullOrWhiteSpace(search))
            {
                var like = $"%{search.Trim()}%";
                var searchLower = search.Trim().ToLower();
                
                // Get user IDs that match the search by full name
                var matchingUserIds = activeUsers
                    .Where(u => u.FullName != null && u.FullName.ToLower().Contains(searchLower))
                    .Select(u => u.Id)
                    .ToList();

                // Filter artists by fields we can search directly OR by matching user IDs
                baseQuery = baseQuery.Where(a =>
                    (a.BusinessName != null && EF.Functions.Like(a.BusinessName, like)) ||
                    (a.Profession != null && EF.Functions.Like(a.Profession, like)) ||
                    matchingUserIds.Contains(a.UserId));
            }

            if (!string.IsNullOrWhiteSpace(service))
            {
                var serviceLike = $"%{service.Trim()}%";
                baseQuery = baseQuery.Where(a =>
                    (a.Profession != null && EF.Functions.Like(a.Profession, serviceLike)));
            }

            // Get total count (simpler now without join)
            var total = await baseQuery.CountAsync();

            // Get paginated artist IDs only
            var artistIds = await baseQuery
                .OrderByDescending(a => a.Rating ?? 0)
                .ThenBy(a => a.BusinessName)
                .Skip((page - 1) * limit)
                .Take(limit)
                .Select(a => a.Id)
                .ToListAsync();

            if (!artistIds.Any())
            {
                return (new List<ArtistListItemData>(), total);
            }

            // Get artist basic info (no join needed - we have user names in dictionary)
            var artists = await _context.Artists
                .AsNoTracking()
                .Where(a => artistIds.Contains(a.Id))
                .Select(a => new
                {
                    a.Id,
                    a.UserId,
                    a.BusinessName,
                    a.Profession,
                    a.Address,
                    a.City,
                    a.Rating,
                    a.SalonId,
                    a.CustomBookingLink
                })
                .ToListAsync();

            // Get services for all artists
            var services = await _context.Services
                .AsNoTracking()
                .Where(s => artistIds.Contains(s.ArtistId) && s.IsActive)
                .Select(s => new { s.ArtistId, s.Name, s.Price })
                .ToListAsync();

            // Get profile images
            var profileImages = await _context.PortfolioImages
                .AsNoTracking()
                .Where(p => p.ArtistId.HasValue && artistIds.Contains(p.ArtistId.Value) && p.IsProfilePicture)
                .Select(p => new { p.ArtistId, p.ImageUrl })
                .ToListAsync();

            // Get salon IDs from memberships for artists without direct SalonId
            var artistIdsWithoutSalon = artists.Where(a => !a.SalonId.HasValue).Select(a => a.Id).ToList();
            var salonMemberships = new List<(Guid ArtistId, Guid SalonId)>();
            if (artistIdsWithoutSalon.Any())
            {
                var salonMembershipsQuery = await _context.SalonMemberships
                    .AsNoTracking()
                    .Where(m => artistIdsWithoutSalon.Contains(m.ArtistId) && m.Status == "active")
                    .Select(m => new { m.ArtistId, m.SalonId })
                    .ToListAsync();

                salonMemberships = salonMembershipsQuery
                    .Select(x => (x.ArtistId, x.SalonId))
                    .ToList();
            }

            // Group services by artist in memory
            var servicesByArtist = services.GroupBy(s => s.ArtistId).ToDictionary(
                g => g.Key,
                g => new { Names = g.Select(s => s.Name).Distinct().ToList(), MinPrice = g.Min(s => s.Price) }
            );

            // Build lookup dictionaries for faster access
            var artistsDict = artists.ToDictionary(a => a.Id);
            var salonMembershipDict = salonMemberships.ToDictionary(m => m.ArtistId, m => m.SalonId);
            var profileImageDict = profileImages.ToDictionary(p => p.ArtistId, p => p.ImageUrl);

            // Build result in original order using dictionaries (O(1) lookup)
            var result = artistIds
                .Select(id =>
                {
                    if (!artistsDict.TryGetValue(id, out var artist))
                        return null;

                    var artistServices = servicesByArtist.GetValueOrDefault(id);
                    var profileImage = profileImageDict.GetValueOrDefault(id);
                    var salonId = artist.SalonId ?? (salonMembershipDict.ContainsKey(id) ? salonMembershipDict[id] : (Guid?)null);

                    var userFullName = userFullNameDict.GetValueOrDefault(artist.UserId);
                    var displayName = !string.IsNullOrWhiteSpace(artist.BusinessName) ? artist.BusinessName : userFullName ?? string.Empty;

                    return new ArtistListItemData
                    {
                        Id = artist.Id,
                        Name = displayName,
                        Profession = artist.Profession ?? string.Empty,
                        Image = profileImage ?? string.Empty,
                        Services = artistServices?.Names ?? new List<string>(),
                        MinPrice = artistServices?.MinPrice > 0 ? artistServices.MinPrice : null,
                        Location = BuildLocation(artist.Address, artist.City),
                        Rating = artist.Rating ?? 0,
                        SalonId = salonId?.ToString(),
                        CustomBookingLink = artist.CustomBookingLink
                    };
                })
                .Where(a => a != null)
                .Cast<ArtistListItemData>()
                .ToList();

            return (result, total);
        }

        private string BuildLocation(string? address, string? city)
        {
            if (string.IsNullOrWhiteSpace(address) && string.IsNullOrWhiteSpace(city))
                return string.Empty;
            
            if (string.IsNullOrWhiteSpace(address))
                return city ?? string.Empty;
            
            if (string.IsNullOrWhiteSpace(city))
                return address;
            
            return $"{address}, {city}";
        }

        public async Task<Artist?> GetArtistByIdAsync(Guid artistId)
        {
            return await _context.Artists
                .Include(a => a.Services.Where(s => s.IsActive)) // Only include active services (IsActive = 1)
                .Include(a => a.WorkingHours)
                .Include(a => a.PortfolioImages)
                .Include(a => a.User)
                .Include(a => a.SalonMemberships.Where(m => m.Status == "active"))
                .Include(a => a.ArtistSubscriptions) // Include all subscriptions (active and canceled)
                .FirstOrDefaultAsync(a => a.Id == artistId && a.User.IsActive);
        }

        public async Task<Artist?> GetArtistByCustomBookingLinkAsync(string customBookingLink)
        {
            var normalizedLink = customBookingLink.Trim().ToLowerInvariant();
            return await _context.Artists
                .Include(a => a.Services.Where(s => s.IsActive))
                .Include(a => a.WorkingHours)
                .Include(a => a.PortfolioImages)
                .Include(a => a.User)
                .Include(a => a.SalonMemberships.Where(m => m.Status == "active"))
                .FirstOrDefaultAsync(a => a.CustomBookingLink != null && a.CustomBookingLink.ToLower() == normalizedLink && a.User.IsActive);
        }
    }
}

