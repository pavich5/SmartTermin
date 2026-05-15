using SmartTermin.DTOs;
using SmartTermin.Services;
using SmartTermin.DataAccess.Repositories;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using System;

namespace SmartTermin.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class WalkInClientsController : ControllerBase
    {
        private readonly IWalkInClientService _walkInClientService;
        private readonly IUserRepository _userRepository;
        private readonly ILogger<WalkInClientsController> _logger;

        public WalkInClientsController(
            IWalkInClientService walkInClientService,
            IUserRepository userRepository,
            ILogger<WalkInClientsController> logger)
        {
            _walkInClientService = walkInClientService;
            _userRepository = userRepository;
            _logger = logger;
        }

        [HttpPost]
        public async Task<ActionResult<CreateWalkInClientResponseDto>> CreateWalkInClient([FromBody] CreateWalkInClientRequestDto request)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var userType = User.FindFirst("UserType")?.Value;
            if (!string.Equals(userType, "artist", StringComparison.OrdinalIgnoreCase))
            {
                return Forbid();
            }

            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value
                ?? User.FindFirst("sub")?.Value;

            if (string.IsNullOrEmpty(userIdClaim) || !Guid.TryParse(userIdClaim, out var userId))
            {
                return Unauthorized(new { message = "Invalid token" });
            }

            try
            {
                // Get artist ID from user ID
                var artist = await _userRepository.GetArtistByUserIdAsync(userId);
                if (artist == null)
                {
                    return BadRequest(new { message = "Artist not found" });
                }

                var response = await _walkInClientService.CreateWalkInClientAsync(artist.Id, request);
                if (!response.Success)
                {
                    return BadRequest(response);
                }
                return Ok(response);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to create walk-in client");
                return StatusCode(500, new { message = "An error occurred while creating the walk-in client" });
            }
        }

        [HttpGet]
        public async Task<ActionResult<WalkInClientsResponseDto>> GetWalkInClients()
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
                var response = await _walkInClientService.GetWalkInClientsForArtistAsync(userId);
                return Ok(response);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to get walk-in clients for artist {UserId}", userId);
                return StatusCode(500, new { message = "An error occurred while retrieving walk-in clients" });
            }
        }
    }
}

