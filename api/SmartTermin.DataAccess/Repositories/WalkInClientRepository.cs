using SmartTermin.DataAccess.DataContext;
using SmartTermin.DomainModels.Models;
using Microsoft.EntityFrameworkCore;

namespace SmartTermin.DataAccess.Repositories
{
    public class WalkInClientRepository : IWalkInClientRepository
    {
        private readonly SmartTerminDbContext _context;

        public WalkInClientRepository(SmartTerminDbContext context)
        {
            _context = context;
        }

        public async Task<WalkInClient> CreateWalkInClientAsync(WalkInClient walkInClient)
        {
            _context.WalkInClients.Add(walkInClient);
            await _context.SaveChangesAsync();
            return walkInClient;
        }

        public async Task<IList<WalkInClient>> GetWalkInClientsForArtistAsync(Guid artistId)
        {
            return await _context.WalkInClients
                .Include(wic => wic.Artist)
                .Where(wic => wic.ArtistId == artistId)
                .OrderByDescending(wic => wic.CreatedAt)
                .ToListAsync();
        }

        public async Task<WalkInClient?> GetWalkInClientByIdAsync(Guid walkInClientId)
        {
            return await _context.WalkInClients
                .Include(wic => wic.Artist)
                .FirstOrDefaultAsync(wic => wic.Id == walkInClientId);
        }
    }
}

