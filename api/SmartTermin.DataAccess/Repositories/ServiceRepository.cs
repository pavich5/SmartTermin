using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using SmartTermin.DataAccess.DataContext;
using SmartTermin.DomainModels.Models;
using Microsoft.EntityFrameworkCore;

namespace SmartTermin.DataAccess.Repositories
{
    public class ServiceRepository : IServiceRepository
    {
        private readonly SmartTerminDbContext _context;

        public ServiceRepository(SmartTerminDbContext context)
        {
            _context = context;
        }

        public async Task<IList<Service>> GetServicesForArtistAsync(Guid artistId)
        {
            return await _context.Services
                .Include(s => s.BookingServices)
                .Where(s => s.ArtistId == artistId && s.IsActive)
                .ToListAsync();
        }

        public async Task<Service> CreateServiceAsync(Service service)
        {
            _context.Services.Add(service);
            await _context.SaveChangesAsync();
            return service;
        }

        public async Task<Service?> GetServiceByIdAsync(Guid serviceId)
        {
            return await _context.Services
                .FirstOrDefaultAsync(s => s.Id == serviceId && s.IsActive);
        }

        public async Task UpdateServiceAsync(Service service)
        {
            _context.Services.Update(service);
            await _context.SaveChangesAsync();
        }
    }
}

