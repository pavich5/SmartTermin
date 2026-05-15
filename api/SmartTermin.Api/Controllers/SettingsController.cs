using SmartTermin.DTOs;
using SmartTermin.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using System.Linq;
using SmartTermin.DataAccess.Repositories;

namespace SmartTermin.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class SettingsController : ControllerBase
    {
        private readonly IWorkingHoursService _workingHoursService;
        private readonly IHolidayService _holidayService;
        private readonly ISalonHolidayService _salonHolidayService;
        private readonly IUserRepository _userRepository;
        private readonly ILogger<SettingsController> _logger;

        public SettingsController(IWorkingHoursService workingHoursService, IHolidayService holidayService, ISalonHolidayService salonHolidayService, IUserRepository userRepository, ILogger<SettingsController> logger)
        {
            _workingHoursService = workingHoursService;
            _holidayService = holidayService;
            _salonHolidayService = salonHolidayService;
            _userRepository = userRepository;
            _logger = logger;
        }

        [HttpGet("working-hours")]
        [Authorize]
        public async Task<ActionResult<WorkingHoursResponseDto>> GetWorkingHours()
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
                var response = await _workingHoursService.GetWorkingHoursAsync(artistUserId);
                return Ok(response);
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to get working hours for artist {UserId}", artistUserId);
                return StatusCode(500, new { message = "An error occurred while retrieving working hours" });
            }
        }

        [HttpPut("working-hours")]
        [Authorize]
        public async Task<ActionResult<UpdateWorkingHoursResponseDto>> UpdateWorkingHours([FromBody] UpdateWorkingHoursRequestDto request)
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

            if (string.IsNullOrEmpty(userIdClaim) || !Guid.TryParse(userIdClaim, out var artistUserId))
            {
                return Unauthorized(new { message = "Invalid token" });
            }

            try
            {
                var response = await _workingHoursService.UpdateWorkingHoursAsync(artistUserId, request);
                return Ok(response);
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to update working hours for artist {UserId}", artistUserId);
                return StatusCode(500, new { message = "An error occurred while updating working hours" });
            }
        }

        [HttpGet("holidays")]
        [Authorize]
        public async Task<ActionResult<HolidaysResponseDto>> GetHolidays()
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
                var response = await _holidayService.GetHolidaysAsync(artistUserId);
                return Ok(response);
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to get holidays for artist {UserId}", artistUserId);
                return StatusCode(500, new { message = "An error occurred while retrieving holidays" });
            }
        }

        [HttpPost("holidays")]
        [Authorize]
        public async Task<ActionResult<HolidayResponseDto>> CreateHoliday([FromBody] CreateHolidayRequestDto request)
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

            if (string.IsNullOrEmpty(userIdClaim) || !Guid.TryParse(userIdClaim, out var artistUserId))
            {
                return Unauthorized(new { message = "Invalid token" });
            }

            try
            {
                var response = await _holidayService.CreateHolidayAsync(artistUserId, request);
                return Ok(response);
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to create holiday for artist {UserId}", artistUserId);
                return StatusCode(500, new { message = "An error occurred while creating holiday" });
            }
        }

        [HttpDelete("holidays/{holidayId}")]
        [Authorize]
        public async Task<ActionResult> DeleteHoliday(Guid holidayId)
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
                await _holidayService.DeleteHolidayAsync(artistUserId, holidayId);
                return Ok(new { message = "Holiday deleted successfully" });
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new { message = ex.Message });
            }
            catch (UnauthorizedAccessException ex)
            {
                return Forbid();
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to delete holiday {HolidayId} for artist {UserId}", holidayId, artistUserId);
                return StatusCode(500, new { message = "An error occurred while deleting holiday" });
            }
        }

        [HttpGet("salon-holidays")]
        [Authorize]
        public async Task<ActionResult<SalonHolidaysResponseDto>> GetSalonHolidays()
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value
                ?? User.FindFirst("sub")?.Value;

            if (string.IsNullOrEmpty(userIdClaim) || !Guid.TryParse(userIdClaim, out var userId))
            {
                return Unauthorized(new { message = "Invalid token" });
            }

            try
            {
                var user = await _userRepository.GetUserByIdWithArtistProfileAsync(userId);
                if (user == null)
                {
                    return Unauthorized(new { message = "User not found" });
                }

                // Get salon from OwnedSalons (for salon owners) or from SalonMemberships (for salon members)
                Guid? salonId = null;
                
                // First check if user is a salon owner
                if (user.OwnedSalons != null && user.OwnedSalons.Any())
                {
                    salonId = user.OwnedSalons.First().Id;
                }
                // If not owner, check if user is a salon member
                else if (user.ArtistProfile?.SalonMemberships != null && user.ArtistProfile.SalonMemberships.Any(m => m.Status == "active"))
                {
                    salonId = user.ArtistProfile.SalonMemberships.First(m => m.Status == "active").SalonId;
                }

                if (salonId == null)
                {
                    return StatusCode(403, new { 
                        message = "You must be a salon owner or member to access salon holidays",
                        code = "SALON_ACCESS_REQUIRED"
                    });
                }

                var response = await _salonHolidayService.GetHolidaysAsync(salonId.Value);
                return Ok(response);
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to get salon holidays for user {UserId}", userId);
                return StatusCode(500, new { message = "An error occurred while retrieving salon holidays" });
            }
        }

        [HttpPost("salon-holidays")]
        [Authorize]
        public async Task<ActionResult<SalonHolidayResponseDto>> CreateSalonHoliday([FromBody] CreateSalonHolidayRequestDto request)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value
                ?? User.FindFirst("sub")?.Value;

            if (string.IsNullOrEmpty(userIdClaim) || !Guid.TryParse(userIdClaim, out var userId))
            {
                return Unauthorized(new { message = "Invalid token" });
            }

            try
            {
                var user = await _userRepository.GetUserByIdWithArtistProfileAsync(userId);
                if (user == null)
                {
                    return Unauthorized(new { message = "User not found" });
                }

                // Get salon from OwnedSalons (for salon owners) or from SalonMemberships (for salon members)
                Guid? salonId = null;
                
                // First check if user is a salon owner
                if (user.OwnedSalons != null && user.OwnedSalons.Any())
                {
                    salonId = user.OwnedSalons.First().Id;
                }
                // If not owner, check if user is a salon member
                else if (user.ArtistProfile?.SalonMemberships != null && user.ArtistProfile.SalonMemberships.Any(m => m.Status == "active"))
                {
                    salonId = user.ArtistProfile.SalonMemberships.First(m => m.Status == "active").SalonId;
                }

                if (salonId == null)
                {
                    return StatusCode(403, new { 
                        message = "You must be a salon owner or member to create salon holidays",
                        code = "SALON_ACCESS_REQUIRED"
                    });
                }

                var response = await _salonHolidayService.CreateHolidayAsync(salonId.Value, request);
                return Ok(response);
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to create salon holiday for user {UserId}", userId);
                return StatusCode(500, new { message = "An error occurred while creating salon holiday" });
            }
        }

        [HttpGet("salon-artists-working-hours")]
        [Authorize]
        public async Task<ActionResult<SalonArtistsWorkingHoursResponseDto>> GetSalonArtistsWorkingHours()
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value
                ?? User.FindFirst("sub")?.Value;

            if (string.IsNullOrEmpty(userIdClaim) || !Guid.TryParse(userIdClaim, out var userId))
            {
                return Unauthorized(new { message = "Invalid token" });
            }

            try
            {
                var user = await _userRepository.GetUserByIdWithArtistProfileAsync(userId);
                if (user == null)
                {
                    return Unauthorized(new { message = "User not found" });
                }

                // Get salon from OwnedSalons (for salon owners) or from SalonMemberships (for salon members)
                Guid? salonId = null;
                
                // First check if user is a salon owner
                if (user.OwnedSalons != null && user.OwnedSalons.Any())
                {
                    salonId = user.OwnedSalons.First().Id;
                }
                // If not owner, check if user is a salon member
                else if (user.ArtistProfile?.SalonMemberships != null && user.ArtistProfile.SalonMemberships.Any(m => m.Status == "active"))
                {
                    salonId = user.ArtistProfile.SalonMemberships.First(m => m.Status == "active").SalonId;
                }

                if (salonId == null)
                {
                    return StatusCode(403, new { 
                        message = "You must be a salon owner or member to access salon artists working hours",
                        code = "SALON_ACCESS_REQUIRED"
                    });
                }

                var response = await _workingHoursService.GetSalonArtistsWorkingHoursAsync(salonId.Value);
                return Ok(response);
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to get salon artists working hours for user {UserId}", userId);
                return StatusCode(500, new { message = "An error occurred while retrieving salon artists working hours" });
            }
        }

        [HttpDelete("salon-holidays/{holidayId}")]
        [Authorize]
        public async Task<ActionResult> DeleteSalonHoliday(Guid holidayId)
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value
                ?? User.FindFirst("sub")?.Value;

            if (string.IsNullOrEmpty(userIdClaim) || !Guid.TryParse(userIdClaim, out var userId))
            {
                return Unauthorized(new { message = "Invalid token" });
            }

            try
            {
                var user = await _userRepository.GetUserByIdWithArtistProfileAsync(userId);
                if (user == null)
                {
                    return Unauthorized(new { message = "User not found" });
                }

                // Get salon from OwnedSalons (for salon owners) or from SalonMemberships (for salon members)
                Guid? salonId = null;
                
                // First check if user is a salon owner
                if (user.OwnedSalons != null && user.OwnedSalons.Any())
                {
                    salonId = user.OwnedSalons.First().Id;
                }
                // If not owner, check if user is a salon member
                else if (user.ArtistProfile?.SalonMemberships != null && user.ArtistProfile.SalonMemberships.Any(m => m.Status == "active"))
                {
                    salonId = user.ArtistProfile.SalonMemberships.First(m => m.Status == "active").SalonId;
                }

                if (salonId == null)
                {
                    return StatusCode(403, new { 
                        message = "You must be a salon owner or member to delete salon holidays",
                        code = "SALON_ACCESS_REQUIRED"
                    });
                }

                await _salonHolidayService.DeleteHolidayAsync(salonId.Value, holidayId);
                return Ok(new { message = "Salon holiday deleted successfully" });
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new { message = ex.Message });
            }
            catch (UnauthorizedAccessException ex)
            {
                return Forbid();
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to delete salon holiday {HolidayId} for user {UserId}", holidayId, userId);
                return StatusCode(500, new { message = "An error occurred while deleting salon holiday" });
            }
        }
    }
}

