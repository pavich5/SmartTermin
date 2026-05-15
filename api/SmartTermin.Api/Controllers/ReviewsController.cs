using System;
using System.Globalization;
using System.Security.Claims;
using SmartTermin.DTOs;
using SmartTermin.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace SmartTermin.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ReviewsController : ControllerBase
    {
        private readonly ReviewService _reviewService;
        private readonly ILogger<ReviewsController> _logger;

        public ReviewsController(ReviewService reviewService, ILogger<ReviewsController> logger)
        {
            _reviewService = reviewService;
            _logger = logger;
        }

        [HttpPost]
        [Authorize]
        public async Task<ActionResult<ReviewResponseDto>> CreateReview([FromBody] CreateReviewRequestDto request)
        {
            if (!ModelState.IsValid)
            {
                var errors = ModelState
                    .Where(x => x.Value?.Errors.Count > 0)
                    .SelectMany(x => x.Value!.Errors.Select(e => e.ErrorMessage))
                    .ToList();
                return BadRequest(new { message = string.Join(", ", errors) });
            }

            if (request == null)
            {
                return BadRequest(new { message = "Request body is required" });
            }

            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value
                ?? User.FindFirst("sub")?.Value;

            if (string.IsNullOrEmpty(userIdClaim) || !Guid.TryParse(userIdClaim, out var clientId))
            {
                return Unauthorized(new { message = "Invalid token" });
            }

            try
            {
                var review = await _reviewService.CreateReviewAsync(request, clientId);
                return Ok(review);
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
                _logger.LogError(ex, "Error creating review");
                return StatusCode(500, new { message = "An error occurred while creating the review" });
            }
        }

        [HttpPut("{reviewId}")]
        [Authorize]
        public async Task<ActionResult<ReviewResponseDto>> UpdateReview(
            [FromRoute] string reviewId,
            [FromBody] UpdateReviewRequestDto request)
        {
            if (!ModelState.IsValid)
            {
                var errors = ModelState
                    .Where(x => x.Value?.Errors.Count > 0)
                    .SelectMany(x => x.Value!.Errors.Select(e => e.ErrorMessage))
                    .ToList();
                return BadRequest(new { message = string.Join(", ", errors) });
            }

            if (request == null)
            {
                return BadRequest(new { message = "Request body is required" });
            }

            if (!Guid.TryParse(reviewId, out var reviewGuid))
            {
                return BadRequest(new { message = "Invalid review ID" });
            }

            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value
                ?? User.FindFirst("sub")?.Value;

            if (string.IsNullOrEmpty(userIdClaim) || !Guid.TryParse(userIdClaim, out var clientId))
            {
                return Unauthorized(new { message = "Invalid token" });
            }

            try
            {
                var review = await _reviewService.UpdateReviewAsync(reviewGuid, request, clientId);
                return Ok(review);
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new { message = ex.Message });
            }
            catch (UnauthorizedAccessException ex)
            {
                return Forbid(ex.Message);
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating review");
                return StatusCode(500, new { message = "An error occurred while updating the review" });
            }
        }

        [HttpGet("artist/{artistId}")]
        public async Task<ActionResult<ReviewsResponseDto>> GetReviewsForArtist([FromRoute] string artistId)
        {
            if (!Guid.TryParse(artistId, out var artistGuid))
            {
                return BadRequest(new { message = "Invalid artist ID" });
            }

            Guid? clientId = null;
            if (User.Identity?.IsAuthenticated == true)
            {
                var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value
                    ?? User.FindFirst("sub")?.Value;
                if (!string.IsNullOrEmpty(userIdClaim) && Guid.TryParse(userIdClaim, out var parsedClientId))
                {
                    clientId = parsedClientId;
                }
            }

            try
            {
                var reviews = await _reviewService.GetReviewsForArtistAsync(artistGuid, clientId);
                return Ok(reviews);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting reviews for artist");
                return StatusCode(500, new { message = "An error occurred while fetching reviews" });
            }
        }

        [HttpGet("can-review")]
        [Authorize]
        public async Task<ActionResult<object>> CanReviewService(
            [FromQuery] string artistId,
            [FromQuery] string serviceId)
        {
            if (!Guid.TryParse(artistId, out var artistGuid) || !Guid.TryParse(serviceId, out var serviceGuid))
            {
                return BadRequest(new { message = "Invalid artist or service ID" });
            }

            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value
                ?? User.FindFirst("sub")?.Value;

            if (string.IsNullOrEmpty(userIdClaim) || !Guid.TryParse(userIdClaim, out var clientId))
            {
                return Unauthorized(new { message = "Invalid token" });
            }

            try
            {
                var canReview = await _reviewService.CanClientReviewServiceAsync(clientId, artistGuid, serviceGuid);
                return Ok(new { canReview });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error checking if client can review");
                return StatusCode(500, new { message = "An error occurred while checking review eligibility" });
            }
        }
    }
}


