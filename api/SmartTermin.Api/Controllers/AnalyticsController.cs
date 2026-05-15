using SmartTermin.DTOs;
using SmartTermin.Services;
using SmartTermin.DataAccess.Repositories;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace SmartTermin.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AnalyticsController : ControllerBase
    {
        private readonly IAnalyticsService _analyticsService;
        private readonly ISubscriptionService _subscriptionService;
        private readonly IUserRepository _userRepository;
        private readonly ILogger<AnalyticsController> _logger;

        public AnalyticsController(IAnalyticsService analyticsService, ISubscriptionService subscriptionService, IUserRepository userRepository, ILogger<AnalyticsController> logger)
        {
            _analyticsService = analyticsService;
            _subscriptionService = subscriptionService;
            _userRepository = userRepository;
            _logger = logger;
        }

        [HttpGet("dashboard")]
        [Authorize]
        public async Task<ActionResult<DashboardStatsDto>> GetDashboardStats([FromQuery] string? period = "month")
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value
                ?? User.FindFirst("sub")?.Value;

            if (string.IsNullOrEmpty(userIdClaim) || !Guid.TryParse(userIdClaim, out var artistUserId))
            {
                return Unauthorized(new { message = "Invalid token" });
            }

            if (period != null && !new[] { "week", "month", "year" }.Contains(period.ToLowerInvariant()))
            {
                return BadRequest(new { message = "period must be 'week', 'month', or 'year'" });
            }

            try
            {
                var user = await _userRepository.GetUserByIdWithArtistProfileAsync(artistUserId);
                if (user == null)
                {
                    return Unauthorized(new { message = "User not found" });
                }

                // Check if user is on Pro plan OR is a salon owner (has enterprise subscription)
                var isPro = await _subscriptionService.IsProUserAsync(artistUserId);
                var isSalonOwner = user.OwnedSalons != null && user.OwnedSalons.Any();
                
                // Allow if user is artist (with Pro) OR salon owner
                if (user.UserType != "artist" && !isSalonOwner)
                {
                    return Forbid();
                }
                
                if (!isPro && !isSalonOwner)
                {
                    return StatusCode(403, new { 
                        message = "Analytics dashboard is only available for Pro plan users or salon owners. Upgrade to Pro to unlock analytics.",
                        code = "ANALYTICS_PRO_ONLY"
                    });
                }

                var response = await _analyticsService.GetDashboardStatsAsync(artistUserId, period ?? "month");
                return Ok(response);
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to get dashboard stats for artist {UserId}", artistUserId);
                return StatusCode(500, new { message = "An error occurred while retrieving dashboard stats" });
            }
        }

        [HttpGet("popular-services")]
        [Authorize]
        public async Task<ActionResult<PopularServicesResponseDto>> GetPopularServices()
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value
                ?? User.FindFirst("sub")?.Value;

            if (string.IsNullOrEmpty(userIdClaim) || !Guid.TryParse(userIdClaim, out var artistUserId))
            {
                return Unauthorized(new { message = "Invalid token" });
            }

            try
            {
                var user = await _userRepository.GetUserByIdWithArtistProfileAsync(artistUserId);
                if (user == null)
                {
                    return Unauthorized(new { message = "User not found" });
                }

                // Check if user is on Pro plan OR is a salon owner (has enterprise subscription)
                var isPro = await _subscriptionService.IsProUserAsync(artistUserId);
                var isSalonOwner = user.OwnedSalons != null && user.OwnedSalons.Any();
                
                // Allow if user is artist (with Pro) OR salon owner
                if (user.UserType != "artist" && !isSalonOwner)
                {
                    return Forbid();
                }
                
                if (!isPro && !isSalonOwner)
                {
                    return StatusCode(403, new { 
                        message = "Popular services analytics is only available for Pro plan users or salon owners. Upgrade to Pro to unlock analytics.",
                        code = "ANALYTICS_PRO_ONLY"
                    });
                }

                var response = await _analyticsService.GetPopularServicesAsync(artistUserId);
                return Ok(response);
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to get popular services for artist {UserId}", artistUserId);
                return StatusCode(500, new { message = "An error occurred while retrieving popular services" });
            }
        }
    }
}

