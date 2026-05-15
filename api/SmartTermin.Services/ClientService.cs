using System;
using System.Linq;
using System.Threading.Tasks;
using SmartTermin.DataAccess.Repositories;
using SmartTermin.DTOs;

namespace SmartTermin.Services
{
    public class ClientService : IClientService
    {
        private readonly IBookingRepository _bookingRepository;
        private readonly IUserRepository _userRepository;

        public ClientService(IBookingRepository bookingRepository, IUserRepository userRepository)
        {
            _bookingRepository = bookingRepository;
            _userRepository = userRepository;
        }

        public async Task<ArtistClientsResponseDto> GetArtistClientsAsync(Guid artistUserId, int? limit)
        {
            var artist = await _userRepository.GetArtistByUserIdAsync(artistUserId)
                ?? throw new InvalidOperationException("Artist profile not found");

            // Use optimized database-level grouping instead of loading all bookings
            var clientStats = await _bookingRepository.GetClientStatisticsForArtistAsync(artist.Id, limit);

            var response = new ArtistClientsResponseDto();

            foreach (var (clientId, name, email, phone, bookingCount) in clientStats)
            {
                response.Clients.Add(new ArtistClientDto
                {
                    ClientId = clientId.ToString(),
                    Name = name,
                    Email = email,
                    Phone = phone,
                    Bookings = bookingCount
                });
            }

            return response;
        }
    }
}

