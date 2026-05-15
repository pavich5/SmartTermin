using System;
using System.Threading.Tasks;
using SmartTermin.DTOs;

namespace SmartTermin.Services
{
    public interface IClientService
    {
        Task<ArtistClientsResponseDto> GetArtistClientsAsync(Guid artistUserId, int? limit);
    }
}

