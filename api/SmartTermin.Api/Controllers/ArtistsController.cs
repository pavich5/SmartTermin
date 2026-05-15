using System;
using System.Net.Http;
using SmartTermin.DTOs;
using SmartTermin.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;

namespace SmartTermin.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ArtistsController : ControllerBase
    {
        private readonly IArtistService _artistService;
        private readonly ILogger<ArtistsController> _logger;

        public ArtistsController(IArtistService artistService, ILogger<ArtistsController> logger)
        {
            _artistService = artistService;
            _logger = logger;
        }

        [HttpGet]
        public async Task<ActionResult<GetArtistsResponseDto>> GetArtists([FromQuery] string? search, [FromQuery] string? service, [FromQuery] int page = 1, [FromQuery] int limit = 20)
        {
            if (limit <= 0)
            {
                limit = 20;
            }

            try
            {
                var response = await _artistService.GetArtistsAsync(search, service, page, limit);
                return Ok(response);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to retrieve artists");
                return StatusCode(500, new { message = "An error occurred while retrieving artists" });
            }
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<ArtistDetailDto>> GetArtistById(string id)
        {
            // Try to parse as GUID first, if fails, treat as custom booking link
            if (Guid.TryParse(id, out var artistId))
            {
                try
                {
                    var artist = await _artistService.GetArtistByIdAsync(artistId);

                    if (artist == null)
                    {
                        return NotFound(new { message = "Artist not found" });
                    }

                    return Ok(artist);
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Failed to retrieve artist {ArtistId}", id);
                    return StatusCode(500, new { message = "An error occurred while retrieving the artist" });
                }
            }
            else
            {
                // Try as custom booking link
                try
                {
                    var artist = await _artistService.GetArtistByCustomBookingLinkAsync(id);

                    if (artist == null)
                    {
                        return NotFound(new { message = "Artist not found" });
                    }

                    return Ok(artist);
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Failed to retrieve artist by custom booking link {CustomLink}", id);
                    return StatusCode(500, new { message = "An error occurred while retrieving the artist" });
                }
            }
        }

        [HttpGet("{id}/subscription/payments")]
        [Authorize]
        public async Task<ActionResult<List<PaymentTransactionDto>>> GetPaymentTransactions(string id)
        {
            if (!Guid.TryParse(id, out var artistId))
            {
                return BadRequest(new { message = "Invalid artist id" });
            }

            try
            {
                var transactions = await _artistService.GetPaymentTransactionsAsync(artistId);
                return Ok(transactions);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to retrieve payment transactions for artist {ArtistId}", id);
                return StatusCode(500, new { message = "An error occurred while retrieving payment transactions" });
            }
        }

        [HttpGet("{id}/subscription")]
        [Authorize]
        public async Task<ActionResult<ArtistSubscriptionDto>> GetArtistSubscription(string id)
        {
            if (!Guid.TryParse(id, out var artistId))
            {
                return BadRequest(new { message = "Invalid artist id" });
            }

            try
            {
                var subscription = await _artistService.GetArtistSubscriptionAsync(artistId);
                if (subscription == null)
                {
                    return NotFound(new { message = "Subscription not found" });
                }

                return Ok(subscription);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to retrieve subscription for artist {ArtistId}", id);
                return StatusCode(500, new { message = "An error occurred while retrieving the subscription" });
            }
        }

        [HttpGet("{id}/subscription/cancel-link")]
        [Authorize]
        public async Task<ActionResult> GetCancelSubscriptionLink(string id)
        {
            if (!Guid.TryParse(id, out var artistId))
            {
                return BadRequest(new { message = "Invalid artist id" });
            }

            try
            {
                var cancelLink = await _artistService.GetCancelSubscriptionLinkAsync(artistId);
                if (cancelLink == null)
                {
                    return NotFound(new { message = "Subscription not found" });
                }

                return Ok(new { cancelLink });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to get cancel subscription link for artist {ArtistId}", id);
                return StatusCode(500, new { message = "An error occurred while getting the cancel subscription link" });
            }
        }

        [HttpDelete("{id}/subscription")]
        [Authorize]
        public async Task<ActionResult> CancelArtistSubscription(string id)
        {
            if (!Guid.TryParse(id, out var artistId))
            {
                return BadRequest(new { message = "Invalid artist id" });
            }

            try
            {
                // Cancel the subscription via Paddle API
                var success = await _artistService.CancelArtistSubscriptionAsync(artistId);
                if (!success)
                {
                    return NotFound(new { message = "Subscription not found or could not be cancelled" });
                }

                return Ok(new { message = "Subscription cancelled successfully" });
            }
            catch (InvalidOperationException ex)
            {
                _logger.LogError(ex, "Configuration error while cancelling subscription for artist {ArtistId}", id);
                return StatusCode(500, new { message = "Subscription cancellation is not properly configured" });
            }
            catch (HttpRequestException ex)
            {
                _logger.LogError(ex, "Paddle API error while cancelling subscription for artist {ArtistId}", id);
                return StatusCode(502, new { message = "Failed to cancel subscription in payment provider. Please try again later." });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to cancel subscription for artist {ArtistId}", id);
                return StatusCode(500, new { message = "An error occurred while cancelling the subscription" });
            }
        }

        [HttpPost("{id}/subscription/reactivate")]
        [Authorize]
        public async Task<ActionResult> ReactivateArtistSubscription(string id)
        {
            if (!Guid.TryParse(id, out var artistId))
            {
                return BadRequest(new { message = "Invalid artist id" });
            }

            try
            {
                // Reactivate the subscription by creating a new one via Paddle checkout
                var checkoutUrl = await _artistService.ReactivateArtistSubscriptionAsync(artistId);
                if (string.IsNullOrEmpty(checkoutUrl))
                {
                    return NotFound(new { message = "Subscription not found or cannot be reactivated" });
                }

                return Ok(new { checkoutUrl, message = "Please complete reactivation in checkout" });
            }
            catch (InvalidOperationException ex)
            {
                _logger.LogError(ex, "Configuration error while reactivating subscription for artist {ArtistId}", id);
                return StatusCode(500, new { message = ex.Message });
            }
            catch (HttpRequestException ex)
            {
                _logger.LogError(ex, "Paddle API error while reactivating subscription for artist {ArtistId}", id);
                return StatusCode(502, new { message = "Failed to reactivate subscription in payment provider. Please try again later." });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to reactivate subscription for artist {ArtistId}", id);
                return StatusCode(500, new { message = "An error occurred while reactivating the subscription" });
            }
        }

        [HttpDelete("{id}/account")]
        [Authorize]
        public async Task<ActionResult> DeleteAccount(string id)
        {
            if (!Guid.TryParse(id, out var artistId))
            {
                return BadRequest(new { message = "Invalid artist id" });
            }

            try
            {
                var success = await _artistService.DeleteAccountPermanentlyAsync(artistId);
                if (!success)
                {
                    return NotFound(new { message = "Artist not found or could not be deleted" });
                }

                return Ok(new { message = "Account deleted successfully" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to delete artist account {ArtistId}", id);
                return StatusCode(500, new { message = "An error occurred while deleting the account" });
            }
        }
    }
}

