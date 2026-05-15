using SmartTermin.DTOs;
using SmartTermin.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace SmartTermin.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ServicesController : ControllerBase
    {
        private readonly IServiceManagementService _serviceService;
        private readonly ISubscriptionService _subscriptionService;
        private readonly ILogger<ServicesController> _logger;

        public ServicesController(IServiceManagementService serviceService, ISubscriptionService subscriptionService, ILogger<ServicesController> logger)
        {
            _serviceService = serviceService;
            _subscriptionService = subscriptionService;
            _logger = logger;
        }

        [HttpGet("artist")]
        [Authorize]
        public async Task<ActionResult<ServiceListResponseDto>> GetArtistServices()
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

            try
            {
                var response = await _serviceService.GetServicesForArtistAsync(artistUserId);
                return Ok(response);
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to get services for artist {UserId}", artistUserId);
                return StatusCode(500, new { message = "An error occurred while retrieving services" });
            }
        }

        [HttpPost]
        [Authorize]
        public async Task<ActionResult<ServiceDetailsDto>> CreateService([FromBody] CreateServiceRequestDto request)
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

            var userIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value
                ?? User.FindFirst("sub")?.Value;

            if (string.IsNullOrEmpty(userIdClaim) || !Guid.TryParse(userIdClaim, out var artistUserId))
            {
                return Unauthorized(new { message = "Invalid token" });
            }

            try
            {
                // Check if user can create more services
                var canCreate = await _subscriptionService.CanCreateServiceAsync(artistUserId);
                if (!canCreate)
                {
                    var limits = await _subscriptionService.GetUserLimitsAsync(artistUserId);
                    return BadRequest(new { 
                        message = $"Service limit reached. Free plan allows {limits.MaxServices} services. You currently have {limits.CurrentServices} services. Upgrade to Pro for unlimited services.",
                        code = "SERVICE_LIMIT_REACHED",
                        currentCount = limits.CurrentServices,
                        maxCount = limits.MaxServices
                    });
                }

                var service = await _serviceService.CreateServiceAsync(artistUserId, request);
                return Ok(service);
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to create service for artist {UserId}", artistUserId);
                return StatusCode(500, new { message = "An error occurred while creating the service" });
            }
        }

        [HttpPut("{id}")]
        [Authorize]
        public async Task<ActionResult<ServiceDetailsDto>> UpdateService(string id, [FromBody] UpdateServiceRequestDto request)
        {
            if (!Guid.TryParse(id, out var serviceId))
            {
                return BadRequest(new { message = "Invalid service id" });
            }

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

            try
            {
                var service = await _serviceService.UpdateServiceAsync(artistUserId, serviceId, request);
                return Ok(service);
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
                _logger.LogError(ex, "Failed to update service {ServiceId}", serviceId);
                return StatusCode(500, new { message = "An error occurred while updating the service" });
            }
        }

        [HttpDelete("{id}")]
        [Authorize]
        public async Task<IActionResult> DeleteService(string id)
        {
            if (!Guid.TryParse(id, out var serviceId))
            {
                return BadRequest(new { message = "Invalid service id" });
            }

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

            try
            {
                var success = await _serviceService.DeleteServiceAsync(artistUserId, serviceId);
                return Ok(new { success, message = success ? "Service deleted" : "Service not deleted" });
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
                _logger.LogError(ex, "Failed to delete service {ServiceId}", serviceId);
                return StatusCode(500, new { message = "An error occurred while deleting the service" });
            }
        }
    }
}