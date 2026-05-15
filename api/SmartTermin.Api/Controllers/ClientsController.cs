using System;
using SmartTermin.DTOs;
using SmartTermin.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace SmartTermin.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ClientsController : ControllerBase
    {
        private readonly IClientService _clientService;
        private readonly ILogger<ClientsController> _logger;

        public ClientsController(IClientService clientService, ILogger<ClientsController> logger)
        {
            _clientService = clientService;
            _logger = logger;
        }

        [HttpGet("artist")]
        [Authorize]
        public async Task<ActionResult<ArtistClientsResponseDto>> GetArtistClients([FromQuery] string? limit = null)
        {
            var userType = User.FindFirst("UserType")?.Value;
            if (!string.Equals(userType, "artist", StringComparison.OrdinalIgnoreCase))
            {
                return Forbid();
            }

            var userIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value
                ?? User.FindFirst("sub")?.Value;

            if (string.IsNullOrEmpty(userIdClaim) || !Guid.TryParse(userIdClaim, out var artistUserId))
            {
                return Unauthorized(new { message = "Invalid token" });
            }

            int? parsedLimit = null;
            if (!string.IsNullOrWhiteSpace(limit) && !string.Equals(limit, "all", StringComparison.OrdinalIgnoreCase))
            {
                if (!int.TryParse(limit, out var l) || l <= 0)
                {
                    return BadRequest(new { message = "limit must be a positive integer or 'all'" });
                }
                parsedLimit = l;
            }

            try
            {
                var response = await _clientService.GetArtistClientsAsync(artistUserId, parsedLimit);
                return Ok(response);
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to get clients for artist {UserId}", artistUserId);
                return StatusCode(500, new { message = "An error occurred while retrieving clients" });
            }
        }
    }
}

