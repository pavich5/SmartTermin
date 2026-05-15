using SmartTermin.DTOs;
using SmartTermin.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Linq;
using System.Security.Claims;

namespace SmartTermin.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly IAuthService _authService;
        private readonly ILogger<AuthController> _logger;

        public AuthController(IAuthService authService, ILogger<AuthController> logger)
        {
            _authService = authService;
            _logger = logger;
        }

        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginRequestDto request)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            try
            {
                // Get user agent from request headers
                var userAgent = Request.Headers["User-Agent"].ToString();
                
                var response = await _authService.LoginAsync(request, userAgent);

                if (response == null)
                {
                    return Unauthorized(new { message = "Invalid phone number or password" });
                }

                return Ok(response);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error during login");
                return StatusCode(500, new { message = "An error occurred during login" });
            }
        }

        [HttpPost("signup")]
        public async Task<IActionResult> Signup([FromBody] SignupRequestDto request)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            // Validate userType
            if (request.UserType != "artist" && request.UserType != "client")
            {
                return BadRequest(new { message = "UserType must be either 'artist' or 'client'" });
            }

            try
            {
                var response = await _authService.SignupAsync(request);

                if (!response.VerificationCodeSent)
                {
                    return BadRequest(new { message = "Failed to create account. Phone number may already be registered." });
                }

                return Ok(response);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error during signup");
                return StatusCode(500, new { message = "An error occurred during signup" });
            }
        }

        [HttpPost("verify-phone")]
        public async Task<IActionResult> VerifyPhone([FromBody] VerifyPhoneRequestDto request)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            // Validate code is 6 digits
            if (string.IsNullOrWhiteSpace(request.Code) || request.Code.Length != 6 || !request.Code.All(char.IsDigit))
            {
                return BadRequest(new { message = "Verification code must be 6 digits" });
            }

            try
            {
                var response = await _authService.VerifyPhoneAsync(request);

                if (!response.Verified)
                {
                    return BadRequest(new { message = "Invalid verification code or code has expired" });
                }

                return Ok(response);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error during phone verification");
                return StatusCode(500, new { message = "An error occurred during phone verification" });
            }
        }

        [HttpGet("check-exists")]
        [AllowAnonymous]
        public async Task<IActionResult> CheckUserExists([FromQuery] string? email, [FromQuery] string? phone)
        {
            try
            {
                bool exists = false;
                if (!string.IsNullOrWhiteSpace(email))
                {
                    var user = await _authService.GetUserByEmailAsync(email);
                    exists = user != null;
                }
                else if (!string.IsNullOrWhiteSpace(phone))
                {
                    var user = await _authService.GetUserByPhoneAsync(phone);
                    exists = user != null;
                }
                else
                {
                    return BadRequest(new { message = "Either email or phone must be provided" });
                }

                return Ok(new { exists });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error checking if user exists");
                return StatusCode(500, new { message = "An error occurred while checking user existence" });
            }
        }

        [HttpGet("me")]
        [HttpGet("user_id")]
        [Authorize]
        public async Task<IActionResult> GetCurrentUser()
        {
            try
            {
                // Get user ID from JWT token claims
                var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value 
                    ?? User.FindFirst("sub")?.Value;

                if (string.IsNullOrEmpty(userIdClaim) || !Guid.TryParse(userIdClaim, out Guid userId))
                {
                    return Unauthorized(new { message = "Invalid token" });
                }

                var user = await _authService.GetCurrentUserAsync(userId);

                if (user == null)
                {
                    return NotFound(new { message = "User not found" });
                }

                return Ok(user);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting current user");
                return StatusCode(500, new { message = "An error occurred while retrieving user information" });
            }
        }

        [HttpPut("profile")]
        [Authorize]
        public async Task<IActionResult> UpdateProfile([FromBody] UpdateProfileRequestDto request)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            try
            {
                // Get user ID from JWT token claims
                var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value 
                    ?? User.FindFirst("sub")?.Value;

                if (string.IsNullOrEmpty(userIdClaim) || !Guid.TryParse(userIdClaim, out Guid userId))
                {
                    return Unauthorized(new { message = "Invalid token" });
                }

                // Update user profile
                var response = await _authService.UpdateProfileAsync(userId, request);

                if (response == null)
                {
                    return NotFound(new { message = "User not found" });
                }

                return Ok(response);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating user profile");
                return StatusCode(500, new { message = "An error occurred while updating user profile" });
            }
        }

        [HttpPut("artist-profile")]
        [Authorize]
        public async Task<IActionResult> UpdateArtistProfile([FromBody] UpdateArtistProfileRequestDto request)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            try
            {
                // Get user ID from JWT token claims
                var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value 
                    ?? User.FindFirst("sub")?.Value;

                if (string.IsNullOrEmpty(userIdClaim) || !Guid.TryParse(userIdClaim, out Guid userId))
                {
                    return Unauthorized(new { message = "Invalid token" });
                }

                // Check if user is an artist
                var user = await _authService.GetCurrentUserAsync(userId);
                if (user == null)
                {
                    return NotFound(new { message = "User not found" });
                }

                if (user.UserType != "artist")
                {
                    return StatusCode(403, new { message = "This endpoint is only accessible to users with userType: 'artist'" });
                }

                // Update artist profile
                var response = await _authService.UpdateArtistProfileAsync(userId, request);

                if (response == null)
                {
                    return NotFound(new { message = "Artist profile not found" });
                }

                return Ok(response);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating artist profile");
                return StatusCode(500, new { message = "An error occurred while updating artist profile" });
            }
        }

        [HttpPost("reactivate-account")]
        public async Task<IActionResult> ReactivateAccount([FromBody] ReactivateAccountRequestDto request)
        {
            if (request == null || string.IsNullOrEmpty(request.UserId))
            {
                return BadRequest(new { message = "User ID is required" });
            }

            try
            {
                var response = await _authService.ReactivateAccountAsync(request.UserId);
                return Ok(response);
            }
            catch (ArgumentException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error reactivating account");
                return StatusCode(500, new { message = "An error occurred while reactivating account" });
            }
        }

        [HttpPost("delete-account-permanently")]
        public async Task<IActionResult> DeleteAccountPermanently([FromBody] DeleteAccountRequestDto request)
        {
            if (request == null || string.IsNullOrEmpty(request.UserId))
            {
                return BadRequest(new { message = "User ID is required" });
            }

            try
            {
                var success = await _authService.DeleteAccountPermanentlyAsync(request.UserId);
                if (!success)
                {
                    return NotFound(new { message = "User not found" });
                }
                return Ok(new { message = "Account deleted successfully" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting account");
                return StatusCode(500, new { message = "An error occurred while deleting account" });
            }
        }

        [HttpPost("deactivate-account")]
        [Authorize]
        public async Task<IActionResult> DeactivateAccount()
        {
            try
            {
                // Get user ID from JWT token claims
                var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value 
                    ?? User.FindFirst("sub")?.Value;

                if (string.IsNullOrEmpty(userIdClaim) || !Guid.TryParse(userIdClaim, out Guid userId))
                {
                    return Unauthorized(new { message = "Invalid token" });
                }

                // Deactivate account
                var success = await _authService.DeactivateAccountAsync(userId);

                if (!success)
                {
                    return NotFound(new { message = "User not found" });
                }

                return Ok(new { message = "Account deactivated successfully" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deactivating account");
                return StatusCode(500, new { message = "An error occurred while deactivating account" });
            }
        }

        [HttpPost("logout")]
        [Authorize]
        public async Task<IActionResult> Logout()
        {
            try
            {
                // Get user ID from JWT token claims
                var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value 
                    ?? User.FindFirst("sub")?.Value;

                if (string.IsNullOrEmpty(userIdClaim) || !Guid.TryParse(userIdClaim, out Guid userId))
                {
                    return Unauthorized(new { message = "Invalid token" });
                }

                // Perform logout
                var response = await _authService.LogoutAsync(userId);

                if (!response.Success)
                {
                    return BadRequest(new { message = "Logout failed" });
                }

                return Ok(response);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error during logout");
                return StatusCode(500, new { message = "An error occurred during logout" });
            }
        }

        [HttpPost("forgot-password")]
        public async Task<IActionResult> ForgotPassword([FromBody] ForgotPasswordRequestDto request)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            if (string.IsNullOrWhiteSpace(request.Phone))
            {
                return BadRequest(new { message = "Phone number is required" });
            }

            try
            {
                var response = await _authService.RequestPasswordResetAsync(request);
                return Ok(response);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error during password reset request");
                return StatusCode(500, new { message = "An error occurred during password reset request" });
            }
        }

        [HttpPost("verify-reset-code")]
        public async Task<IActionResult> VerifyResetCode([FromBody] VerifyResetCodeRequestDto request)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            // Validate code is 6 digits
            if (string.IsNullOrWhiteSpace(request.Code) || request.Code.Length != 6 || !request.Code.All(char.IsDigit))
            {
                return BadRequest(new { message = "Reset code must be 6 digits" });
            }

            try
            {
                var response = await _authService.VerifyResetCodeAsync(request);

                if (!response.Verified)
                {
                    return BadRequest(new { message = "Invalid reset code or code has expired" });
                }

                return Ok(response);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error during reset code verification");
                return StatusCode(500, new { message = "An error occurred during reset code verification" });
            }
        }

        [HttpPost("reset-password")]
        public async Task<IActionResult> ResetPassword([FromBody] ResetPasswordRequestDto request)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            if (string.IsNullOrWhiteSpace(request.NewPassword))
            {
                return BadRequest(new { message = "New password is required" });
            }

            if (request.NewPassword.Length < 6)
            {
                return BadRequest(new { message = "Password must be at least 6 characters long" });
            }

            try
            {
                var response = await _authService.ResetPasswordAsync(request);

                if (!response.Success)
                {
                    return BadRequest(response);
                }

                return Ok(response);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error during password reset");
                return StatusCode(500, new { message = "An error occurred during password reset" });
            }
        }

        [HttpPost("request-phone-change")]
        [Authorize]
        public async Task<IActionResult> RequestPhoneChange([FromBody] RequestPhoneChangeRequestDto request)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            if (string.IsNullOrWhiteSpace(request.Phone))
            {
                return BadRequest(new { message = "Phone number is required" });
            }

            try
            {
                // Get user ID from JWT token claims
                var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value 
                    ?? User.FindFirst("sub")?.Value;

                if (string.IsNullOrEmpty(userIdClaim) || !Guid.TryParse(userIdClaim, out Guid userId))
                {
                    return Unauthorized(new { message = "Invalid token" });
                }

                var response = await _authService.RequestPhoneChangeAsync(userId, request);
                return Ok(response);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error during phone change request");
                return StatusCode(500, new { message = "An error occurred during phone change request" });
            }
        }
       
        [HttpPost("verify-phone-change")]
        [Authorize]
        public async Task<IActionResult> VerifyPhoneChange([FromBody] VerifyPhoneChangeRequestDto request)
        {
            // Validate request is not null
            if (request == null)
            {
                return BadRequest(new { message = "Request body is required" });
            }

            // Check ModelState and return user-friendly errors
            if (!ModelState.IsValid)
            {
                var errors = ModelState
                    .Where(x => x.Value?.Errors.Count > 0)
                    .SelectMany(x => x.Value!.Errors.Select(e => e.ErrorMessage))
                    .ToList();
                
                var errorMessage = errors.Any() 
                    ? string.Join("; ", errors) 
                    : "Invalid request data";
                
                return BadRequest(new { message = errorMessage });
            }

            // Validate phone number
            if (string.IsNullOrWhiteSpace(request.Phone))
            {
                return BadRequest(new { message = "Phone number is required" });
            }

            // Validate code is 6 digits
            if (string.IsNullOrWhiteSpace(request.Code) || request.Code.Length != 6 || !request.Code.All(char.IsDigit))
            {
                return BadRequest(new { message = "Verification code must be 6 digits" });
            }

            try
            {
                // Get user ID from JWT token claims
                var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value 
                    ?? User.FindFirst("sub")?.Value;

                if (string.IsNullOrEmpty(userIdClaim) || !Guid.TryParse(userIdClaim, out Guid userId))
                {
                    return Unauthorized(new { message = "Invalid token" });
                }

                var response = await _authService.VerifyPhoneChangeAsync(userId, request);
                return Ok(response);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error during phone change verification: {Message}", ex.Message);
                var errorMessage = ex.Message.Contains("not found") 
                    ? "User not found" 
                    : ex.Message.Contains("Invalid") || ex.Message.Contains("expired")
                    ? ex.Message
                    : "An error occurred during phone change verification";
                return BadRequest(new { message = errorMessage });
            }
        }
    }
}

