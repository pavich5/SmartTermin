using SmartTermin.DTOs;
using SmartTermin.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using Microsoft.Extensions.Configuration;

namespace SmartTermin.Api.Controllers
{
    public class ToggleOwnerAsArtistRequest
    {
        public bool isArtist { get; set; }
    }

    [ApiController]
    [Route("api/salons")]
    public class SalonsController : ControllerBase
    {
        private readonly ISalonService _salonService;
        private readonly ILogger<SalonsController> _logger;
        private readonly IConfiguration _configuration;
        private readonly IHttpClientFactory _httpClientFactory;

        public SalonsController(
            ISalonService salonService, 
            ILogger<SalonsController> logger,
            IConfiguration configuration,
            IHttpClientFactory httpClientFactory)
        {
            _salonService = salonService;
            _logger = logger;
            _configuration = configuration;
            _httpClientFactory = httpClientFactory;
        }

        [HttpPost]
        [Authorize]
        public async Task<ActionResult<SalonDto>> CreateSalon([FromBody] CreateSalonRequestDto request)
        {
            var userId = GetUserId();
            if (userId == Guid.Empty)
            {
                return Unauthorized(new { message = "Invalid token" });
            }

            try
            {
                var salon = await _salonService.CreateSalonAsync(userId, request);
                return CreatedAtAction(nameof(GetSalon), new { id = salon.Id }, salon);
            }
            catch (UnauthorizedAccessException ex)
            {
                _logger.LogWarning(ex, "Unauthorized attempt to create salon by user {UserId}", userId);
                return StatusCode(403, new { message = ex.Message });
            }
            catch (InvalidOperationException ex)
            {
                _logger.LogWarning(ex, "Invalid operation when creating salon for user {UserId}: {Message}", userId, ex.Message);
                return StatusCode(400, new { message = ex.Message });
            }
            catch (KeyNotFoundException ex)
            {
                _logger.LogWarning(ex, "Resource not found when creating salon for user {UserId}: {Message}", userId, ex.Message);
                return StatusCode(404, new { message = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to create salon for user {UserId}. Error: {Message}. StackTrace: {StackTrace}", 
                    userId, ex.Message, ex.StackTrace);
                return StatusCode(500, new { message = $"Failed to create salon: {ex.Message}" });
            }
        }

        [HttpGet]
        [AllowAnonymous]
        public async Task<ActionResult<object>> GetAllSalons([FromQuery] int page = 1, [FromQuery] int limit = 10)
        {
            try
            {
                var result = await _salonService.GetAllSalonsAsync(page, limit);
                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to retrieve salons");
                return StatusCode(500, new { message = "An error occurred while retrieving salons" });
            }
        }

        [HttpGet("{id}")]
        [AllowAnonymous]
        public async Task<ActionResult<SalonDto>> GetSalon(string id)
        {
            // Try to parse as GUID first, if fails, treat as custom booking link
            if (Guid.TryParse(id, out var salonId))
            {
                var salon = await _salonService.GetSalonAsync(salonId);
                if (salon == null) return NotFound(new { message = "Salon not found" });
                return Ok(salon);
            }
            else
            {
                // Try as custom booking link
                var salon = await _salonService.GetSalonByCustomBookingLinkAsync(id);
                if (salon == null) return NotFound(new { message = "Salon not found" });
                return Ok(salon);
            }
        }

        [HttpPut("{id}")]
        [Authorize]
        public async Task<ActionResult<SalonDto>> UpdateSalon(string id, [FromBody] UpdateSalonRequestDto request)
        {
            if (!Guid.TryParse(id, out var salonId))
            {
                return BadRequest(new { message = "Invalid salon id" });
            }

            var userId = GetUserId();
            if (userId == Guid.Empty)
            {
                return Unauthorized(new { message = "Invalid token" });
            }

            try
            {
                var updated = await _salonService.UpdateSalonAsync(salonId, userId, request);
                return Ok(updated);
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new { message = ex.Message });
            }
            catch (UnauthorizedAccessException ex)
            {
                return Forbid(ex.Message);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to update salon {SalonId}", salonId);
                return StatusCode(500, new { message = "Failed to update salon" });
            }
        }

        [HttpDelete("{id}")]
        [Authorize]
        public async Task<IActionResult> DeleteSalon(string id)
        {
            if (!Guid.TryParse(id, out var salonId))
            {
                return BadRequest(new { message = "Invalid salon id" });
            }

            var userId = GetUserId();
            if (userId == Guid.Empty)
            {
                return Unauthorized(new { message = "Invalid token" });
            }

            try
            {
                var deleted = await _salonService.DeleteSalonAsync(salonId, userId);
                if (!deleted) return NotFound(new { message = "Salon not found" });
                return NoContent();
            }
            catch (UnauthorizedAccessException ex)
            {
                return Forbid(ex.Message);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to delete salon {SalonId}", salonId);
                return StatusCode(500, new { message = "Failed to delete salon" });
            }
        }

        [HttpGet("{id}/members")]
        [Authorize]
        public async Task<ActionResult<SalonMembersResponseDto>> GetMembers(string id)
        {
            if (!Guid.TryParse(id, out var salonId))
            {
                return BadRequest(new { message = "Invalid salon id" });
            }

            try
            {
                var members = await _salonService.GetMembersAsync(salonId);
                return Ok(members);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to load members for salon {SalonId}", salonId);
                return StatusCode(500, new { message = "Failed to load members" });
            }
        }

        [HttpPost("{id}/invite")]
        [Authorize]
        public async Task<ActionResult<SalonInvitationDto>> InviteArtist(string id, [FromBody] InviteArtistRequestDto request)
        {
            if (!Guid.TryParse(id, out var salonId))
            {
                return BadRequest(new { message = "Invalid salon id" });
            }

            var userId = GetUserId();
            if (userId == Guid.Empty)
            {
                return Unauthorized(new { message = "Invalid token" });
            }

            try
            {
                var invitation = await _salonService.InviteArtistAsync(salonId, userId, request);
                return Ok(invitation);
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new { message = ex.Message });
            }
            catch (UnauthorizedAccessException ex)
            {
                return Forbid(ex.Message);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to invite artist to salon {SalonId}", salonId);
                return StatusCode(500, new { message = "Failed to invite artist" });
            }
        }

        [HttpDelete("{id}/members/{artistId}")]
        [Authorize]
        public async Task<IActionResult> RemoveArtist(string id, string artistId)
        {
            if (!Guid.TryParse(id, out var salonId) || !Guid.TryParse(artistId, out var parsedArtistId))
            {
                return BadRequest(new { message = "Invalid salon or artist id" });
            }

            var userId = GetUserId();
            if (userId == Guid.Empty)
            {
                return Unauthorized(new { message = "Invalid token" });
            }

            try
            {
                var removed = await _salonService.RemoveArtistAsync(salonId, parsedArtistId, userId);
                if (!removed) return NotFound(new { message = "Artist not found in this salon" });
                return NoContent();
            }
            catch (UnauthorizedAccessException ex)
            {
                return Forbid(ex.Message);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to remove artist {ArtistId} from salon {SalonId}", artistId, salonId);
                return StatusCode(500, new { message = "Failed to remove artist" });
            }
        }

        [HttpDelete("{id}/invitations/{invitationId}")]
        [Authorize]
        public async Task<IActionResult> CancelInvitation(string id, string invitationId)
        {
            if (!Guid.TryParse(id, out var salonId) || !Guid.TryParse(invitationId, out var parsedInvitationId))
            {
                return BadRequest(new { message = "Invalid salon or invitation id" });
            }

            var userId = GetUserId();
            if (userId == Guid.Empty)
            {
                return Unauthorized(new { message = "Invalid token" });
            }

            try
            {
                var cancelled = await _salonService.CancelInvitationAsync(salonId, parsedInvitationId, userId);
                if (!cancelled) return NotFound(new { message = "Invitation not found or already processed" });
                return NoContent();
            }
            catch (UnauthorizedAccessException ex)
            {
                return Forbid(ex.Message);
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to cancel invitation {InvitationId} for salon {SalonId}", invitationId, salonId);
                return StatusCode(500, new { message = "Failed to cancel invitation" });
            }
        }

        [HttpGet("invitations/{token}")]
        [AllowAnonymous]
        public async Task<ActionResult<SalonInvitationDto>> GetInvitation(string token)
        {
            try
            {
                var invitation = await _salonService.GetInvitationByTokenAsync(token);
                if (invitation == null) return NotFound(new { message = "Invitation not found" });
                return Ok(invitation);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to get invitation with token {Token}", token);
                return StatusCode(500, new { message = "Failed to get invitation" });
            }
        }

        [HttpPost("invitations/{token}/accept")]
        [Authorize]
        public async Task<ActionResult<SalonDto>> AcceptInvitation(string token)
        {
            var userId = GetUserId();
            if (userId == Guid.Empty)
            {
                return Unauthorized(new { message = "Invalid token" });
            }

            try
            {
                var salon = await _salonService.AcceptInvitationAsync(token, userId);
                return Ok(salon);
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new { message = ex.Message });
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to accept invitation with token {Token}", token);
                return StatusCode(500, new { message = "Failed to accept invitation" });
            }
        }

        [HttpPost("{id}/toggle-owner-artist")]
        [Authorize]
        public async Task<IActionResult> ToggleOwnerAsArtist(string id, [FromBody] ToggleOwnerAsArtistRequest request)
        {
            if (!Guid.TryParse(id, out var salonId))
            {
                return BadRequest(new { message = "Invalid salon id" });
            }

            var userId = GetUserId();
            if (userId == Guid.Empty)
            {
                return Unauthorized(new { message = "Invalid token" });
            }

            try
            {
                var success = await _salonService.ToggleOwnerAsArtistAsync(salonId, userId, request.isArtist);
                if (!success) return BadRequest(new { message = "Failed to toggle owner artist status" });
                return Ok(new { success = true });
            }
            catch (UnauthorizedAccessException ex)
            {
                return Forbid(ex.Message);
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to toggle owner artist status for salon {SalonId}", salonId);
                return StatusCode(500, new { message = "Failed to toggle owner artist status" });
            }
        }

        [HttpPost("{id}/leave")]
        [Authorize]
        public async Task<IActionResult> LeaveSalon(string id)
        {
            if (!Guid.TryParse(id, out var salonId))
            {
                return BadRequest(new { message = "Invalid salon id" });
            }

            var userId = GetUserId();
            if (userId == Guid.Empty)
            {
                return Unauthorized(new { message = "Invalid token" });
            }

            try
            {
                var removed = await _salonService.LeaveSalonAsync(salonId, userId);
                if (!removed) return NotFound(new { message = "Membership not found" });
                return NoContent();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to leave salon {SalonId}", salonId);
                return StatusCode(500, new { message = "Failed to leave salon" });
            }
        }

        [HttpPost("{id}/subscription/test-update")]
        [Authorize]
        public async Task<ActionResult<object>> TestPaddleUpdate(string id, [FromBody] UpdateSalonSubscriptionRequestDto request)
        {
            if (!Guid.TryParse(id, out var salonId))
            {
                return BadRequest(new { message = "Invalid salon id" });
            }

            var userId = GetUserId();
            if (userId == Guid.Empty)
            {
                return Unauthorized(new { message = "Invalid token" });
            }

            try
            {
                var subscription = await _salonService.GetSubscriptionAsync(salonId);
                if (subscription == null || string.IsNullOrEmpty(subscription.PaddleSubscriptionId))
                {
                    return BadRequest(new { message = "No active Paddle subscription found" });
                }

                // Test updating the subscription
                var updated = await _salonService.UpdateSubscriptionAsync(salonId, userId, request);
                
                return Ok(new 
                { 
                    success = true,
                    message = "Subscription update attempted. Check backend logs for Paddle API details.",
                    subscription = updated
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error testing Paddle update for salon {SalonId}", salonId);
                return StatusCode(500, new { 
                    success = false,
                    message = ex.Message,
                    error = ex.ToString()
                });
            }
        }

        [HttpGet("{id}/subscription/test-paddle")]
        [Authorize]
        public async Task<ActionResult<object>> TestPaddleConnection(string id)
        {
            if (!Guid.TryParse(id, out var salonId))
            {
                return BadRequest(new { message = "Invalid salon id" });
            }

            try
            {
                var subscription = await _salonService.GetSubscriptionAsync(salonId);
                if (subscription == null || string.IsNullOrEmpty(subscription.PaddleSubscriptionId))
                {
                    return BadRequest(new { message = "No active Paddle subscription found" });
                }

                // Test getting the subscription from Paddle
                var paddleApiKey = Environment.GetEnvironmentVariable("PADDLE_API_KEY") 
                    ?? _configuration["PaddleSettings:ApiKey"];
                var paddleEnvironment = Environment.GetEnvironmentVariable("PADDLE_ENVIRONMENT") 
                    ?? _configuration["PaddleSettings:Environment"] 
                    ?? "sandbox";

                if (string.IsNullOrEmpty(paddleApiKey))
                {
                    return BadRequest(new { message = "Paddle API key not configured" });
                }

                var baseUrl = paddleEnvironment == "production" 
                    ? "https://api.paddle.com" 
                    : "https://sandbox-api.paddle.com";

                var httpClient = _httpClientFactory.CreateClient();
                httpClient.DefaultRequestHeaders.Add("Authorization", $"Bearer {paddleApiKey}");

                var getUrl = $"{baseUrl}/subscriptions/{subscription.PaddleSubscriptionId}";
                var response = await httpClient.GetAsync(getUrl);
                var content = await response.Content.ReadAsStringAsync();

                return Ok(new 
                { 
                    success = response.IsSuccessStatusCode,
                    statusCode = (int)response.StatusCode,
                    response = content,
                    subscriptionId = subscription.PaddleSubscriptionId
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error testing Paddle connection for salon {SalonId}", salonId);
                return StatusCode(500, new { message = "Error testing Paddle connection", error = ex.Message });
            }
        }

        [HttpGet("{id}/subscription/invoice-url")]
        [Authorize]
        public async Task<ActionResult<object>> GetInvoiceUrl(string id)
        {
            if (!Guid.TryParse(id, out var salonId))
            {
                return BadRequest(new { message = "Invalid salon id" });
            }

            try
            {
                var invoiceUrl = await _salonService.GetInvoiceUrlAsync(salonId);
                if (string.IsNullOrEmpty(invoiceUrl))
                {
                    return NotFound(new { message = "Invoice URL not available" });
                }
                return Ok(new { invoiceUrl });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to get invoice URL for salon {SalonId}", salonId);
                return StatusCode(500, new { message = "Failed to get invoice URL" });
            }
        }

        [HttpGet("{id}/subscription")]
        [Authorize]
        public async Task<ActionResult<SalonSubscriptionDto>> GetSubscription(string id)
        {
            if (!Guid.TryParse(id, out var salonId))
            {
                return BadRequest(new { message = "Invalid salon id" });
            }

            try
            {
                var subscription = await _salonService.GetSubscriptionAsync(salonId);
                return Ok(subscription);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to load subscription for salon {SalonId}", salonId);
                return StatusCode(500, new { message = "Failed to load subscription" });
            }
        }

        [HttpPost("{id}/subscription")]
        [Authorize]
        public async Task<ActionResult<SalonSubscriptionDto>> UpsertSubscription(string id, [FromBody] UpdateSalonSubscriptionRequestDto request)
        {
            if (!Guid.TryParse(id, out var salonId))
            {
                return BadRequest(new { message = "Invalid salon id" });
            }

            var userId = GetUserId();
            if (userId == Guid.Empty)
            {
                return Unauthorized(new { message = "Invalid token" });
            }

            try
            {
                var subscription = await _salonService.UpdateSubscriptionAsync(salonId, userId, request);
                return Ok(subscription);
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new { message = ex.Message });
            }
            catch (UnauthorizedAccessException ex)
            {
                return StatusCode(403, new { message = ex.Message });
            }
            catch (InvalidOperationException ex)
            {
                // This might be a Paddle validation error
                _logger.LogWarning(ex, "Validation error updating subscription for salon {SalonId}: {Message}", salonId, ex.Message);
                return StatusCode(400, new { message = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to update subscription for salon {SalonId}. Error: {Error}", salonId, ex.Message);
                return StatusCode(500, new { message = $"Failed to update subscription: {ex.Message}" });
            }
        }

        [HttpPut("{id}/subscription/artists")]
        [Authorize]
        public async Task<ActionResult<SalonSubscriptionDto>> UpdateSeats(string id, [FromBody] UpdateSalonSubscriptionRequestDto request)
        {
            return await UpsertSubscription(id, request);
        }

        [HttpDelete("{id}/subscription")]
        [Authorize]
        public async Task<ActionResult<SalonSubscriptionDto>> CancelSubscription(string id)
        {
            if (!Guid.TryParse(id, out var salonId))
            {
                return BadRequest(new { message = "Invalid salon id" });
            }

            var userId = GetUserId();
            if (userId == Guid.Empty)
            {
                return Unauthorized(new { message = "Invalid token" });
            }

            try
            {
                var keepOwnerSubscription = HttpContext.Request.Query["keepOwnerSubscription"] == "true";

                var cancelRequest = new UpdateSalonSubscriptionRequestDto
                {
                    ArtistCount = 3,
                    BillingCycle = "monthly",
                    Status = "cancelled",
                    KeepOwnerSubscription = keepOwnerSubscription
                };

                var subscription = await _salonService.UpdateSubscriptionAsync(salonId, userId, cancelRequest);
                return Ok(subscription);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to cancel subscription for salon {SalonId}", salonId);
                return StatusCode(500, new { message = "Failed to cancel subscription" });
            }
        }

        [HttpGet("{id}/analytics")]
        [Authorize]
        public async Task<ActionResult<SalonAnalyticsDto>> GetAnalytics(string id)
        {
            if (!Guid.TryParse(id, out var salonId))
            {
                return BadRequest(new { message = "Invalid salon id" });
            }

            try
            {
                var analytics = await _salonService.GetAnalyticsAsync(salonId);
                return Ok(analytics);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to load analytics for salon {SalonId}", salonId);
                return StatusCode(500, new { message = "Failed to load analytics" });
            }
        }

        [HttpGet("{id}/calendar")]
        [Authorize]
        public async Task<ActionResult<SalonCalendarResponseDto>> GetCalendar(string id, [FromQuery] DateTime? start, [FromQuery] DateTime? end, [FromQuery] int page = 1, [FromQuery] int limit = 10)
        {
            if (!Guid.TryParse(id, out var salonId))
            {
                return BadRequest(new { message = "Invalid salon id" });
            }

            if (page < 1) page = 1;
            if (limit < 1 || limit > 100) limit = 10;

            try
            {
                var calendar = await _salonService.GetCalendarAsync(salonId, start, end, page, limit);
                return Ok(calendar);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to load calendar for salon {SalonId}", salonId);
                return StatusCode(500, new { message = "Failed to load calendar" });
            }
        }

        [HttpGet("{id}/available-slots")]
        [AllowAnonymous]
        public async Task<ActionResult<IList<AvailableSalonSlotDto>>> GetAvailableSlots(string id, [FromQuery] DateTime date)
        {
            if (!Guid.TryParse(id, out var salonId))
            {
                return BadRequest(new { message = "Invalid salon id" });
            }

            try
            {
                var slots = await _salonService.GetAvailableSlotsAsync(salonId, date);
                return Ok(slots);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to load available slots for salon {SalonId}", salonId);
                return StatusCode(500, new { message = "Failed to load available slots" });
            }
        }

        private Guid GetUserId()
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value
                ?? User.FindFirst("sub")?.Value;

            return Guid.TryParse(userIdClaim, out var userId) ? userId : Guid.Empty;
        }
    }
}
