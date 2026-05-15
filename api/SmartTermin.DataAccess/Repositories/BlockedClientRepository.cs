using SmartTermin.DataAccess.DataContext;
using SmartTermin.DomainModels.Models;
using Microsoft.EntityFrameworkCore;

namespace SmartTermin.DataAccess.Repositories
{
    public class BlockedClientRepository : IBlockedClientRepository
    {
        private readonly SmartTerminDbContext _context;

        public BlockedClientRepository(SmartTerminDbContext context)
        {
            _context = context;
        }

        public async Task<BlockedClient?> GetBlockedClientAsync(Guid? artistId, Guid? salonId, Guid clientId)
        {
            var query = _context.BlockedClients
                .Include(bc => bc.Client)
                .Include(bc => bc.Artist)
                .Include(bc => bc.Salon)
                .Include(bc => bc.BlockedByUser)
                .AsQueryable();

            if (artistId.HasValue)
            {
                query = query.Where(bc => bc.ArtistId == artistId.Value && bc.ClientId == clientId);
            }
            else if (salonId.HasValue)
            {
                query = query.Where(bc => bc.SalonId == salonId.Value && bc.ClientId == clientId);
            }
            else
            {
                return null;
            }

            return await query.FirstOrDefaultAsync();
        }

        public async Task<bool> IsClientBlockedAsync(Guid? artistId, Guid? salonId, Guid clientId)
        {
            if (artistId.HasValue)
            {
                return await _context.BlockedClients
                    .AnyAsync(bc => bc.ArtistId == artistId.Value && bc.ClientId == clientId);
            }
            
            if (salonId.HasValue)
            {
                return await _context.BlockedClients
                    .AnyAsync(bc => bc.SalonId == salonId.Value && bc.ClientId == clientId);
            }

            return false;
        }

        public async Task<IList<BlockedClient>> GetBlockedClientsForArtistAsync(Guid artistId)
        {
            return await _context.BlockedClients
                .Include(bc => bc.Client)
                .Include(bc => bc.BlockedByUser)
                .Where(bc => bc.ArtistId == artistId)
                .OrderByDescending(bc => bc.BlockedAt)
                .ToListAsync();
        }

        public async Task<IList<BlockedClient>> GetBlockedClientsForSalonAsync(Guid salonId)
        {
            return await _context.BlockedClients
                .Include(bc => bc.Client)
                .Include(bc => bc.BlockedByUser)
                .Where(bc => bc.SalonId == salonId)
                .OrderByDescending(bc => bc.BlockedAt)
                .ToListAsync();
        }

        public async Task<BlockedClient> BlockClientAsync(BlockedClient blockedClient)
        {
            _context.BlockedClients.Add(blockedClient);
            await _context.SaveChangesAsync();
            return blockedClient;
        }

        public async Task UnblockClientAsync(Guid blockedClientId)
        {
            var blockedClient = await _context.BlockedClients.FindAsync(blockedClientId);
            if (blockedClient != null)
            {
                _context.BlockedClients.Remove(blockedClient);
                await _context.SaveChangesAsync();
            }
        }

        public async Task<BlockedClient?> GetBlockedClientByIdAsync(Guid blockedClientId)
        {
            return await _context.BlockedClients
                .Include(bc => bc.Client)
                .Include(bc => bc.Artist)
                .Include(bc => bc.Salon)
                .Include(bc => bc.BlockedByUser)
                .FirstOrDefaultAsync(bc => bc.Id == blockedClientId);
        }
    }
}











