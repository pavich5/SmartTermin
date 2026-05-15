using SmartTermin.DTOs;
using SmartTermin.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using System;

namespace SmartTermin.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class BlockedClientsController : ControllerBase
    {
        private readonly IBlockedClientService _blockedClientService;
        private readonly ILogger<BlockedClientsController> _logger;

        public BlockedClientsController(
            IBlockedClientService blockedClientService,
            ILogger<BlockedClientsController> logger)
        {
            _blockedClientService = blockedClientService;
            _logger = logger;
        }

        [HttpPost("artist/{artistId}")]
        public async Task<ActionResult<BlockClientResponseDto>> BlockClientForArtist(string artistId, [FromBody] BlockClientRequestDto request)
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value
                ?? User.FindFirst("sub")?.Value;

            if (string.IsNullOrEmpty(userIdClaim) || !Guid.TryParse(userIdClaim, out var userId))
            {
                return Unauthorized(new { message = "Invalid token" });
            }

            if (!Guid.TryParse(artistId, out var artistIdGuid))
            {
                return BadRequest(new { message = "Invalid artist ID" });
            }

            try
            {
                var response = await _blockedClientService.BlockClientAsync(userId, artistIdGuid, null, request);
                if (!response.Success)
                {
                    return BadRequest(response);
                }
                return Ok(response);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to block client for artist {ArtistId}", artistId);
                return StatusCode(500, new { message = "An error occurred while blocking the client" });
            }
        }

        [HttpPost("salon/{salonId}")]
        public async Task<ActionResult<BlockClientResponseDto>> BlockClientForSalon(string salonId, [FromBody] BlockClientRequestDto request)
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value
                ?? User.FindFirst("sub")?.Value;

            if (string.IsNullOrEmpty(userIdClaim) || !Guid.TryParse(userIdClaim, out var userId))
            {
                return Unauthorized(new { message = "Invalid token" });
            }

            if (!Guid.TryParse(salonId, out var salonIdGuid))
            {
                return BadRequest(new { message = "Invalid salon ID" });
            }

            try
            {
                var response = await _blockedClientService.BlockClientAsync(userId, null, salonIdGuid, request);
                if (!response.Success)
                {
                    return BadRequest(response);
                }
                return Ok(response);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to block client for salon {SalonId}", salonId);
                return StatusCode(500, new { message = "An error occurred while blocking the client" });
            }
        }

        [HttpDelete("{blockedClientId}")]
        public async Task<ActionResult<UnblockClientResponseDto>> UnblockClient(string blockedClientId)
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value
                ?? User.FindFirst("sub")?.Value;

            if (string.IsNullOrEmpty(userIdClaim) || !Guid.TryParse(userIdClaim, out var userId))
            {
                return Unauthorized(new { message = "Invalid token" });
            }

            if (!Guid.TryParse(blockedClientId, out var blockedClientIdGuid))
            {
                return BadRequest(new { message = "Invalid blocked client ID" });
            }

            try
            {
                var response = await _blockedClientService.UnblockClientAsync(userId, blockedClientIdGuid);
                if (!response.Success)
                {
                    return BadRequest(response);
                }
                return Ok(response);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to unblock client {BlockedClientId}", blockedClientId);
                return StatusCode(500, new { message = "An error occurred while unblocking the client" });
            }
        }

        [HttpGet("artist")]
        public async Task<ActionResult<BlockedClientsResponseDto>> GetBlockedClientsForArtist()
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value
                ?? User.FindFirst("sub")?.Value;

            if (string.IsNullOrEmpty(userIdClaim) || !Guid.TryParse(userIdClaim, out var userId))
            {
                return Unauthorized(new { message = "Invalid token" });
            }

            var userType = User.FindFirst("UserType")?.Value;
            if (!string.Equals(userType, "artist", StringComparison.OrdinalIgnoreCase))
            {
                return Forbid();
            }

            try
            {
                var response = await _blockedClientService.GetBlockedClientsForArtistAsync(userId);
                return Ok(response);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to get blocked clients for artist {UserId}", userId);
                return StatusCode(500, new { message = "An error occurred while retrieving blocked clients" });
            }
        }

        [HttpGet("salon")]
        public async Task<ActionResult<BlockedClientsResponseDto>> GetBlockedClientsForSalon()
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value
                ?? User.FindFirst("sub")?.Value;

            if (string.IsNullOrEmpty(userIdClaim) || !Guid.TryParse(userIdClaim, out var userId))
            {
                return Unauthorized(new { message = "Invalid token" });
            }

            try
            {
                var response = await _blockedClientService.GetBlockedClientsForSalonAsync(userId);
                return Ok(response);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to get blocked clients for salon owner {UserId}", userId);
                return StatusCode(500, new { message = "An error occurred while retrieving blocked clients" });
            }
        }
    }
}











