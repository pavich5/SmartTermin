using SmartTermin.DataAccess.Repositories;
using SmartTermin.DomainModels.Models;
using SmartTermin.DTOs;
using Microsoft.Extensions.Logging;

namespace SmartTermin.Services
{
    public class WalkInClientService : IWalkInClientService
    {
        private readonly IWalkInClientRepository _walkInClientRepository;
        private readonly IUserRepository _userRepository;
        private readonly ILogger<WalkInClientService> _logger;

        public WalkInClientService(
            IWalkInClientRepository walkInClientRepository,
            IUserRepository userRepository,
            ILogger<WalkInClientService> logger)
        {
            _walkInClientRepository = walkInClientRepository;
            _userRepository = userRepository;
            _logger = logger;
        }

        public async Task<CreateWalkInClientResponseDto> CreateWalkInClientAsync(Guid artistId, CreateWalkInClientRequestDto request)
        {
            if (string.IsNullOrWhiteSpace(request.ClientName))
            {
                return new CreateWalkInClientResponseDto
                {
                    Success = false,
                    Message = "Client name is required"
                };
            }

            var walkInClient = new WalkInClient
            {
                ArtistId = artistId,
                ClientName = request.ClientName,
                ClientEmail = request.ClientEmail,
                ClientPhone = request.ClientPhone,
                CreatedAt = DateTime.UtcNow
            };

            var created = await _walkInClientRepository.CreateWalkInClientAsync(walkInClient);

            return new CreateWalkInClientResponseDto
            {
                Success = true,
                Message = "Walk-in client created successfully",
                WalkInClient = MapToDto(created)
            };
        }

        public async Task<WalkInClientsResponseDto> GetWalkInClientsForArtistAsync(Guid artistUserId)
        {
            var artist = await _userRepository.GetArtistByUserIdAsync(artistUserId);
            if (artist == null)
            {
                return new WalkInClientsResponseDto();
            }

            var walkInClients = await _walkInClientRepository.GetWalkInClientsForArtistAsync(artist.Id);
            
            var result = new WalkInClientsResponseDto();
            foreach (var walkInClient in walkInClients)
            {
                result.WalkInClients.Add(MapToDto(walkInClient));
            }

            return result;
        }

        private static WalkInClientDto MapToDto(WalkInClient walkInClient)
        {
            return new WalkInClientDto
            {
                Id = walkInClient.Id.ToString(),
                ArtistId = walkInClient.ArtistId.ToString(),
                ClientName = walkInClient.ClientName,
                ClientEmail = walkInClient.ClientEmail,
                ClientPhone = walkInClient.ClientPhone,
                CreatedAt = walkInClient.CreatedAt
            };
        }
    }
}

