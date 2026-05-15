using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using SmartTermin.DomainModels.Models;

namespace SmartTermin.DataAccess.Repositories
{
    public interface IServiceRepository
    {
        Task<IList<Service>> GetServicesForArtistAsync(Guid artistId);
        Task<Service> CreateServiceAsync(Service service);
        Task<Service?> GetServiceByIdAsync(Guid serviceId);
        Task UpdateServiceAsync(Service service);
    }
}

