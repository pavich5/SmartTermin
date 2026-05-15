using SmartTermin.DataAccess.DataContext;
using SmartTermin.DataAccess.Repositories;
using SmartTermin.DomainModels.Models;
using SmartTermin.DTOs;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace SmartTermin.Services
{
    public class BlockedClientService : IBlockedClientService
    {
        private readonly IBlockedClientRepository _blockedClientRepository;
        private readonly IUserRepository _userRepository;
        private readonly ISalonRepository _salonRepository;
        private readonly SmartTerminDbContext _context;
        private readonly ILogger<BlockedClientService> _logger;

        public BlockedClientService(
            IBlockedClientRepository blockedClientRepository,
            IUserRepository userRepository,
            ISalonRepository salonRepository,
            SmartTerminDbContext context,
            ILogger<BlockedClientService> logger)
        {
            _blockedClientRepository = blockedClientRepository;
            _userRepository = userRepository;
            _salonRepository = salonRepository;
            _context = context;
            _logger = logger;
        }

        public async Task<BlockClientResponseDto> BlockClientAsync(Guid blockedByUserId, Guid? artistId, Guid? salonId, BlockClientRequestDto request)
        {
            if (!Guid.TryParse(request.ClientId, out var clientId))
            {
                return new BlockClientResponseDto
                {
                    Success = false,
                    Message = "Invalid client ID"
                };
            }

            // Validate that the requester has permission
            var blockedByUser = await _userRepository.GetUserByIdIncludingInactiveAsync(blockedByUserId);
            if (blockedByUser == null)
            {
                return new BlockClientResponseDto
                {
                    Success = false,
                    Message = "User not found"
                };
            }

            // Validate client exists
            var client = await _userRepository.GetUserByIdIncludingInactiveAsync(clientId);
            if (client == null)
            {
                return new BlockClientResponseDto
                {
                    Success = false,
                    Message = "Client not found"
                };
            }

            // Validate artist or salon
            if (artistId.HasValue)
            {
                var artist = await _userRepository.GetArtistByUserIdAsync(blockedByUserId);
                if (artist == null || artist.Id != artistId.Value)
                {
                    return new BlockClientResponseDto
                    {
                        Success = false,
                        Message = "You don't have permission to block clients for this artist"
                    };
                }
            }
            else if (salonId.HasValue)
            {
                var salon = await _salonRepository.GetSalonByIdAsync(salonId.Value);
                if (salon == null || salon.OwnerUserId != blockedByUserId)
                {
                    return new BlockClientResponseDto
                    {
                        Success = false,
                        Message = "You don't have permission to block clients for this salon"
                    };
                }
            }
            else
            {
                return new BlockClientResponseDto
                {
                    Success = false,
                    Message = "Either artistId or salonId must be provided"
                };
            }

            // Check if already blocked
            var existingBlock = await _blockedClientRepository.GetBlockedClientAsync(artistId, salonId, clientId);
            if (existingBlock != null)
            {
                return new BlockClientResponseDto
                {
                    Success = false,
                    Message = "Client is already blocked"
                };
            }

            // Create block
            var blockedClient = new BlockedClient
            {
                ClientId = clientId,
                ArtistId = artistId,
                SalonId = salonId,
                Reason = request.Reason,
                BlockedByUserId = blockedByUserId,
                BlockedAt = DateTime.UtcNow
            };

            var created = await _blockedClientRepository.BlockClientAsync(blockedClient);

            return new BlockClientResponseDto
            {
                Success = true,
                Message = "Client blocked successfully",
                BlockedClient = MapToDto(created, client, blockedByUser)
            };
        }

        public async Task<UnblockClientResponseDto> UnblockClientAsync(Guid requesterUserId, Guid blockedClientId)
        {
            var blockedClient = await _blockedClientRepository.GetBlockedClientByIdAsync(blockedClientId);
            if (blockedClient == null)
            {
                return new UnblockClientResponseDto
                {
                    Success = false,
                    Message = "Blocked client record not found"
                };
            }

            // Validate permission
            if (blockedClient.ArtistId.HasValue)
            {
                var artist = await _userRepository.GetArtistByUserIdAsync(requesterUserId);
                if (artist == null || artist.Id != blockedClient.ArtistId.Value)
                {
                    return new UnblockClientResponseDto
                    {
                        Success = false,
                        Message = "You don't have permission to unblock this client"
                    };
                }
            }
            else if (blockedClient.SalonId.HasValue)
            {
                var salon = await _salonRepository.GetSalonByIdAsync(blockedClient.SalonId.Value);
                if (salon == null || salon.OwnerUserId != requesterUserId)
                {
                    return new UnblockClientResponseDto
                    {
                        Success = false,
                        Message = "You don't have permission to unblock this client"
                    };
                }
            }

            await _blockedClientRepository.UnblockClientAsync(blockedClientId);

            return new UnblockClientResponseDto
            {
                Success = true,
                Message = "Client unblocked successfully"
            };
        }

        public async Task<bool> IsClientBlockedAsync(Guid? artistId, Guid? salonId, Guid clientId)
        {
            return await _blockedClientRepository.IsClientBlockedAsync(artistId, salonId, clientId);
        }

        public async Task<BlockedClientsResponseDto> GetBlockedClientsForArtistAsync(Guid artistUserId)
        {
            var artist = await _userRepository.GetArtistByUserIdAsync(artistUserId);
            if (artist == null)
            {
                return new BlockedClientsResponseDto();
            }

            var blockedClients = await _blockedClientRepository.GetBlockedClientsForArtistAsync(artist.Id);
            
            var result = new BlockedClientsResponseDto();
            foreach (var blockedClient in blockedClients)
            {
                var client = await _userRepository.GetUserByIdIncludingInactiveAsync(blockedClient.ClientId);
                var blockedBy = await _userRepository.GetUserByIdIncludingInactiveAsync(blockedClient.BlockedByUserId);
                if (client != null && blockedBy != null)
                {
                    result.BlockedClients.Add(MapToDto(blockedClient, client, blockedBy));
                }
            }

            return result;
        }

        public async Task<BlockedClientsResponseDto> GetBlockedClientsForSalonAsync(Guid salonOwnerUserId)
        {
            // Get salon by owner user ID
            var salon = await _context.Salons
                .FirstOrDefaultAsync(s => s.OwnerUserId == salonOwnerUserId);
            
            if (salon == null)
            {
                return new BlockedClientsResponseDto();
            }

            var blockedClients = await _blockedClientRepository.GetBlockedClientsForSalonAsync(salon.Id);
            
            var result = new BlockedClientsResponseDto();
            foreach (var blockedClient in blockedClients)
            {
                var client = await _userRepository.GetUserByIdIncludingInactiveAsync(blockedClient.ClientId);
                var blockedBy = await _userRepository.GetUserByIdIncludingInactiveAsync(blockedClient.BlockedByUserId);
                if (client != null && blockedBy != null)
                {
                    result.BlockedClients.Add(MapToDto(blockedClient, client, blockedBy));
                }
            }

            return result;
        }

        private static BlockedClientDto MapToDto(BlockedClient blockedClient, User client, User blockedByUser)
        {
            return new BlockedClientDto
            {
                Id = blockedClient.Id.ToString(),
                ClientId = blockedClient.ClientId.ToString(),
                ClientName = client.FullName,
                ClientEmail = client.Email,
                ClientPhone = client.Phone,
                ArtistId = blockedClient.ArtistId?.ToString(),
                SalonId = blockedClient.SalonId?.ToString(),
                Reason = blockedClient.Reason,
                BlockedAt = blockedClient.BlockedAt,
                BlockedByUserName = blockedByUser.FullName
            };
        }
    }
}











