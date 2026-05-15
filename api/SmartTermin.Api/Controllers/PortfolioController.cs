using System;
using System.Security.Claims;
using SmartTermin.DTOs;
using SmartTermin.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace SmartTermin.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class PortfolioController : ControllerBase
    {
        private readonly IPortfolioService _portfolioService;
        private readonly IImageStorageService _imageStorageService;
        private readonly ISubscriptionService _subscriptionService;
        private readonly ISalonService _salonService;
        private readonly ILogger<PortfolioController> _logger;

        public PortfolioController(
            IPortfolioService portfolioService,
            IImageStorageService imageStorageService,
            ISubscriptionService subscriptionService,
            ISalonService salonService,
            ILogger<PortfolioController> logger)
        {
            _portfolioService = portfolioService;
            _imageStorageService = imageStorageService;
            _subscriptionService = subscriptionService;
            _salonService = salonService;
            _logger = logger;
        }

        [HttpGet("artist")]
        [Authorize]
        public async Task<ActionResult<PortfolioImagesResponseDto>> GetPortfolioImages()
        {
            var userType = User.FindFirst("UserType")?.Value;
            if (!string.Equals(userType, "artist", StringComparison.OrdinalIgnoreCase))
            {
                return Forbid();
            }

            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value
                ?? User.FindFirst("sub")?.Value;

            if (string.IsNullOrEmpty(userIdClaim) || !Guid.TryParse(userIdClaim, out var artistUserId))
            {
                return Unauthorized(new { message = "Invalid token" });
            }

            try
            {
                var response = await _portfolioService.GetPortfolioImagesForArtistAsync(artistUserId);
                return Ok(response);
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to get portfolio images for artist {UserId}", artistUserId);
                return StatusCode(500, new { message = "An error occurred while retrieving portfolio images" });
            }
        }

        [HttpGet("salon/{salonId}")]
        [Authorize]
        public async Task<ActionResult<PortfolioImagesResponseDto>> GetSalonPortfolioImages(string salonId)
        {
            if (!Guid.TryParse(salonId, out var salonGuid))
            {
                return BadRequest(new { message = "Invalid salon id" });
            }

            var userType = User.FindFirst("UserType")?.Value;
            if (!string.Equals(userType, "artist", StringComparison.OrdinalIgnoreCase))
            {
                return Forbid();
            }

            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value
                ?? User.FindFirst("sub")?.Value;

            if (string.IsNullOrEmpty(userIdClaim) || !Guid.TryParse(userIdClaim, out var ownerUserId))
            {
                return Unauthorized(new { message = "Invalid token" });
            }

            try
            {
                var response = await _portfolioService.GetPortfolioImagesForSalonAsync(salonGuid, ownerUserId);
                return Ok(response);
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
            catch (UnauthorizedAccessException)
            {
                return Forbid();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to get portfolio images for salon {SalonId}", salonGuid);
                return StatusCode(500, new { message = "An error occurred while retrieving portfolio images" });
            }
        }

        [HttpPost("upload")]
        public async Task<ActionResult<UploadPortfolioImageResponseDto>> UploadPortfolioImage(
            IFormFile image,
            [FromForm] bool? isBannerImage = null,
            [FromForm] bool? isProfilePicture = null)
        {
            var userType = User.FindFirst("UserType")?.Value;
            if (!string.Equals(userType, "artist", StringComparison.OrdinalIgnoreCase))
            {
                return Forbid();
            }

            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value
                ?? User.FindFirst("sub")?.Value;

            if (string.IsNullOrEmpty(userIdClaim) || !Guid.TryParse(userIdClaim, out var artistUserId))
            {
                return Unauthorized(new { message = "Invalid token" });
            }

            if (image == null || image.Length == 0)
            {
                return BadRequest(new { message = "Image file is required" });
            }

            if (image.Length > 10 * 1024 * 1024)
            {
                return BadRequest(new { message = "Image size cannot exceed 10MB" });
            }

            var allowedExtensions = new[] { ".jpg", ".jpeg", ".png", ".gif", ".webp" };
            var fileExtension = System.IO.Path.GetExtension(image.FileName).ToLowerInvariant();
            if (!allowedExtensions.Contains(fileExtension))
            {
                return BadRequest(new { message = "Invalid file type. Allowed types: jpg, jpeg, png, gif, webp" });
            }

            try
            {
                // Check if user can upload more portfolio images
                var canUpload = await _subscriptionService.CanUploadPortfolioImageAsync(artistUserId);
                if (!canUpload)
                {
                    var limits = await _subscriptionService.GetUserLimitsAsync(artistUserId);
                    return BadRequest(new { 
                        message = $"Portfolio limit reached. Free plan allows {limits.MaxPortfolioImages} images. You currently have {limits.CurrentPortfolioImages} images. Upgrade to Pro for unlimited portfolio images.",
                        code = "PORTFOLIO_LIMIT_REACHED",
                        currentCount = limits.CurrentPortfolioImages,
                        maxCount = limits.MaxPortfolioImages
                    });
                }

                string imageUrl;
                using (var stream = image.OpenReadStream())
                {
                    var fileName = $"{Guid.NewGuid()}{fileExtension}";
                    imageUrl = await _imageStorageService.UploadImageAsync(stream, fileName);
                }

                var response = await _portfolioService.UploadPortfolioImageAsync(
                    artistUserId, 
                    imageUrl, 
                    isBannerImage ?? false, 
                    isProfilePicture ?? false);
                
                return Ok(response);
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to upload portfolio image for artist {UserId}");
                return StatusCode(500, new { message = "An error occurred while uploading the image" });
            }
        }

        [HttpPost("salon/{salonId}/upload")]
        [Authorize]
        public async Task<ActionResult<UploadPortfolioImageResponseDto>> UploadSalonPortfolioImage(
            string salonId,
            IFormFile image)
        {
            if (!Guid.TryParse(salonId, out var salonGuid))
            {
                return BadRequest(new { message = "Invalid salon id" });
            }

            var userType = User.FindFirst("UserType")?.Value;
            if (!string.Equals(userType, "artist", StringComparison.OrdinalIgnoreCase))
            {
                return Forbid();
            }

            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value
                ?? User.FindFirst("sub")?.Value;

            if (string.IsNullOrEmpty(userIdClaim) || !Guid.TryParse(userIdClaim, out var ownerUserId))
            {
                return Unauthorized(new { message = "Invalid token" });
            }

            if (image == null || image.Length == 0)
            {
                return BadRequest(new { message = "Image file is required" });
            }

            if (image.Length > 10 * 1024 * 1024)
            {
                return BadRequest(new { message = "Image size cannot exceed 10MB" });
            }

            var allowedExtensions = new[] { ".jpg", ".jpeg", ".png", ".gif", ".webp" };
            var fileExtension = System.IO.Path.GetExtension(image.FileName).ToLowerInvariant();
            if (!allowedExtensions.Contains(fileExtension))
            {
                return BadRequest(new { message = "Invalid file type. Allowed types: JPG, JPEG, PNG, GIF, WEBP" });
            }

            try
            {
                string imageUrl;
                using (var stream = image.OpenReadStream())
                {
                    var fileName = $"{Guid.NewGuid()}{fileExtension}";
                    imageUrl = await _imageStorageService.UploadImageAsync(stream, fileName);
                }

                var response = await _portfolioService.UploadPortfolioImageForSalonAsync(salonGuid, ownerUserId, imageUrl);
                return Ok(response);
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
            catch (UnauthorizedAccessException)
            {
                return Forbid();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to upload portfolio image for salon {SalonId}", salonGuid);
                return StatusCode(500, new { message = "An error occurred while uploading portfolio image" });
            }
        }

        [HttpDelete("{id}")]
        [Authorize]
        public async Task<ActionResult<DeletePortfolioImageResponseDto>> DeletePortfolioImage(string id)
        {
            if (!Guid.TryParse(id, out var imageId))
            {
                return BadRequest(new { message = "Invalid image id" });
            }

            var userType = User.FindFirst("UserType")?.Value;
            if (!string.Equals(userType, "artist", StringComparison.OrdinalIgnoreCase))
            {
                return Forbid();
            }

            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value
                ?? User.FindFirst("sub")?.Value;

            if (string.IsNullOrEmpty(userIdClaim) || !Guid.TryParse(userIdClaim, out var artistUserId))
            {
                return Unauthorized(new { message = "Invalid token" });
            }

            try
            {
                var response = await _portfolioService.DeletePortfolioImageAsync(artistUserId, imageId);
                return Ok(response);
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new { message = ex.Message });
            }
            catch (UnauthorizedAccessException)
            {
                return Forbid();
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to delete portfolio image {ImageId}", imageId);
                return StatusCode(500, new { message = "An error occurred while deleting the image" });
            }
        }

        [HttpPut("{id}/set-banner")]
        [Authorize]
        public async Task<ActionResult<SetBannerImageResponseDto>> SetBannerImage(string id)
        {
            if (!Guid.TryParse(id, out var imageId))
            {
                return BadRequest(new { message = "Invalid image id" });
            }

            var userType = User.FindFirst("UserType")?.Value;
            if (!string.Equals(userType, "artist", StringComparison.OrdinalIgnoreCase))
            {
                return Forbid();
            }

            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value
                ?? User.FindFirst("sub")?.Value;

            if (string.IsNullOrEmpty(userIdClaim) || !Guid.TryParse(userIdClaim, out var artistUserId))
            {
                return Unauthorized(new { message = "Invalid token" });
            }

            try
            {
                // Check if this is a salon image or artist image
                var portfolioImage = await _portfolioService.GetPortfolioImageByIdAsync(imageId);
                if (portfolioImage == null)
                {
                    return NotFound(new { message = "Portfolio image not found" });
                }

                // If image belongs to a salon, use salon-specific method
                if (portfolioImage.SalonId.HasValue)
                {
                    // Get salon to verify ownership
                    var salon = await _salonService.GetSalonAsync(portfolioImage.SalonId.Value);
                    if (salon == null)
                    {
                        return NotFound(new { message = "Salon not found" });
                    }

                    if (salon.OwnerUserId != artistUserId.ToString())
                    {
                        return Forbid();
                    }

                    var response = await _portfolioService.SetBannerImageForSalonAsync(portfolioImage.SalonId.Value, artistUserId, imageId);
                    return Ok(response);
                }
                else
                {
                    // Artist image - use existing method
                    var response = await _portfolioService.SetBannerImageAsync(artistUserId, imageId);
                    return Ok(response);
                }
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new { message = ex.Message });
            }
            catch (UnauthorizedAccessException)
            {
                return Forbid();
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to set banner image {ImageId}", imageId);
                return StatusCode(500, new { message = "An error occurred while setting banner image" });
            }
        }

        [HttpPut("{id}/set-profile-picture")]
        [Authorize]
        public async Task<ActionResult<SetProfilePictureResponseDto>> SetProfilePicture(string id)
        {
            if (!Guid.TryParse(id, out var imageId))
            {
                return BadRequest(new { message = "Invalid image id" });
            }

            var userType = User.FindFirst("UserType")?.Value;
            if (!string.Equals(userType, "artist", StringComparison.OrdinalIgnoreCase))
            {
                return Forbid();
            }

            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value
                ?? User.FindFirst("sub")?.Value;

            if (string.IsNullOrEmpty(userIdClaim) || !Guid.TryParse(userIdClaim, out var artistUserId))
            {
                return Unauthorized(new { message = "Invalid token" });
            }

            try
            {
                // Check if this is a salon image or artist image
                var portfolioImage = await _portfolioService.GetPortfolioImageByIdAsync(imageId);
                if (portfolioImage == null)
                {
                    return NotFound(new { message = "Portfolio image not found" });
                }

                // If image belongs to a salon, use salon-specific method
                if (portfolioImage.SalonId.HasValue)
                {
                    // Get salon to verify ownership
                    var salon = await _salonService.GetSalonAsync(portfolioImage.SalonId.Value);
                    if (salon == null)
                    {
                        return NotFound(new { message = "Salon not found" });
                    }

                    if (salon.OwnerUserId != artistUserId.ToString())
                    {
                        return Forbid();
                    }

                    var response = await _portfolioService.SetProfilePictureForSalonAsync(portfolioImage.SalonId.Value, artistUserId, imageId);
                    return Ok(response);
                }
                else
                {
                    // Artist image - use existing method
                    var response = await _portfolioService.SetProfilePictureAsync(artistUserId, imageId);
                    return Ok(response);
                }
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new { message = ex.Message });
            }
            catch (UnauthorizedAccessException)
            {
                return Forbid();
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to set profile picture {ImageId}", imageId);
                return StatusCode(500, new { message = "An error occurred while setting profile picture" });
            }
        }
    }
}

