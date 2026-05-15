using SmartTermin.DTOs;
using SmartTermin.Services;
using SmartTermin.DataAccess.Repositories;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace SmartTermin.Api.Controllers
{
    [ApiController]
    [Route("api/subscriptions")]
    public class SubscriptionsController : ControllerBase
    {
        private readonly IArtistService _artistService;
        private readonly ISalonService _salonService;
        private readonly IUserRepository _userRepository;
        private readonly ILogger<SubscriptionsController> _logger;

        public SubscriptionsController(
            IArtistService artistService,
            ISalonService salonService,
            IUserRepository userRepository,
            ILogger<SubscriptionsController> logger)
        {
            _artistService = artistService;
            _salonService = salonService;
            _userRepository = userRepository;
            _logger = logger;
        }

        private Guid GetUserId()
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userIdClaim) || !Guid.TryParse(userIdClaim, out var userId))
            {
                return Guid.Empty;
            }
            return userId;
        }

        [HttpPost("start-pro-trial")]
        [Authorize]
        public async Task<ActionResult> StartProTrial()
        {
            var userId = GetUserId();
            if (userId == Guid.Empty)
            {
                return Unauthorized(new { message = "Invalid token" });
            }

            try
            {
                var user = await _userRepository.GetUserByIdWithArtistProfileAsync(userId);
                if (user == null || user.UserType != "artist")
                {
                    return BadRequest(new { message = "Only artists can start Pro trial" });
                }

                // Check trial eligibility
                if (user.HasUsedProTrial || user.HasCreatedSalon)
                {
                    return BadRequest(new { message = "You are not eligible for a free trial" });
                }

                // Check if user already has an active subscription
                if (user.ArtistProfile != null)
                {
                    var activeSubscription = await _userRepository.GetActiveSubscriptionByArtistIdAsync(user.ArtistProfile.Id);
                    if (activeSubscription != null && activeSubscription.Status == "active")
                    {
                        return BadRequest(new { message = "You already have an active subscription" });
                    }
                }

                // Mark trial as used
                user.HasUsedProTrial = true;
                user.IsProcessingPlanChange = true;
                await _userRepository.UpdateUserAsync(user);

                // Create trial subscription (this should be handled by the existing subscription creation logic)
                // For now, we'll return success and let the frontend handle the actual subscription creation
                return Ok(new { message = "Trial eligibility confirmed", HasUsedProTrial = true });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to start Pro trial for user {UserId}", userId);
                return StatusCode(500, new { message = "Failed to start trial" });
            }
        }

        [HttpPost("start-enterprise-trial")]
        [Authorize]
        public async Task<ActionResult> StartEnterpriseTrial()
        {
            var userId = GetUserId();
            if (userId == Guid.Empty)
            {
                return Unauthorized(new { message = "Invalid token" });
            }

            try
            {
                var user = await _userRepository.GetUserByIdWithArtistProfileAsync(userId);
                if (user == null || user.UserType != "artist")
                {
                    return BadRequest(new { message = "Only artists can start Enterprise trial" });
                }

                // Check trial eligibility
                if (user.HasUsedEnterpriseTrial || user.HasCreatedSalon)
                {
                    return BadRequest(new { message = "You are not eligible for a free trial" });
                }

                // Mark that the user is in the middle of the upgrade flow but don't burn their trial yet
                user.IsProcessingPlanChange = true;
                await _userRepository.UpdateUserAsync(user);

                return Ok(new { message = "Trial eligibility confirmed", HasUsedEnterpriseTrial = user.HasUsedEnterpriseTrial });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to start Enterprise trial for user {UserId}", userId);
                return StatusCode(500, new { message = "Failed to start trial" });
            }
        }

        [HttpPost("update-processing-flag")]
        [Authorize]
        public async Task<ActionResult> UpdateProcessingFlag([FromBody] UpdateProcessingFlagRequest request)
        {
            var userId = GetUserId();
            if (userId == Guid.Empty)
            {
                return Unauthorized(new { message = "Invalid token" });
            }

            try
            {
                var user = await _userRepository.GetUserByIdWithArtistProfileAsync(userId);
                if (user == null)
                {
                    return NotFound(new { message = "User not found" });
                }

                user.IsProcessingPlanChange = request.IsProcessing;
                await _userRepository.UpdateUserAsync(user);

                return Ok(new { message = "Processing flag updated", IsProcessingPlanChange = request.IsProcessing });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to update processing flag for user {UserId}", userId);
                return StatusCode(500, new { message = "Failed to update processing flag" });
            }
        }
    }

    public class UpdateProcessingFlagRequest
    {
        public bool IsProcessing { get; set; }
    }
}
