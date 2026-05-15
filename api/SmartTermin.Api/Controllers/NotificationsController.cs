using System;
using System.Collections.Generic;
using System.Security.Claims;
using SmartTermin.DTOs;
using SmartTermin.Services;
using SmartTermin.DataAccess.Repositories;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace SmartTermin.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class NotificationsController : ControllerBase
    {
        private readonly IFirebaseNotificationService _firebaseNotificationService;
        private readonly IUserRepository _userRepository;
        private readonly ILogger<NotificationsController> _logger;

        public NotificationsController(
            IFirebaseNotificationService firebaseNotificationService,
            IUserRepository userRepository,
            ILogger<NotificationsController> logger)
        {
            _firebaseNotificationService = firebaseNotificationService;
            _userRepository = userRepository;
            _logger = logger;
        }

        private Guid GetUserId()
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value
                ?? User.FindFirst("sub")?.Value;

            if (string.IsNullOrEmpty(userIdClaim) || !Guid.TryParse(userIdClaim, out var userId))
            {
                throw new UnauthorizedAccessException("Invalid user ID in token.");
            }
            return userId;
        }

        [HttpPost("register-token")]
        public async Task<ActionResult> RegisterFcmToken([FromBody] RegisterFcmTokenRequestDto request)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            try
            {
                var userId = GetUserId();
                await _userRepository.UpdateUserFcmTokenAsync(userId, request.FcmToken);
                
                _logger.LogInformation($"FCM token registered for user {userId}");
                return Ok(new { message = "FCM token registered successfully" });
            }
            catch (UnauthorizedAccessException ex)
            {
                return Unauthorized(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error registering FCM token");
                return StatusCode(500, new { message = "An error occurred while registering the FCM token" });
            }
        }

        [HttpDelete("unregister-token")]
        public async Task<ActionResult> UnregisterFcmToken()
        {
            try
            {
                var userId = GetUserId();
                await _userRepository.UpdateUserFcmTokenAsync(userId, null);
                
                _logger.LogInformation($"FCM token unregistered for user {userId}");
                return Ok(new { message = "FCM token unregistered successfully" });
            }
            catch (UnauthorizedAccessException ex)
            {
                return Unauthorized(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error unregistering FCM token");
                return StatusCode(500, new { message = "An error occurred while unregistering the FCM token" });
            }
        }

        [HttpGet("test-connection")]
        public ActionResult TestFirebaseConnection()
        {
            try
            {
                // Use reflection to call TestFirebaseConnection if it exists
                var serviceType = _firebaseNotificationService.GetType();
                var method = serviceType.GetMethod("TestFirebaseConnection");
                
                if (method != null)
                {
                    var result = method.Invoke(_firebaseNotificationService, null);
                    if (result is bool success && success)
                    {
                        return Ok(new { message = "Firebase connection is working", connected = true });
                    }
                }
                
                return BadRequest(new { message = "Firebase connection test failed or method not available", connected = false });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error testing Firebase connection");
                return StatusCode(500, new { message = $"Error testing connection: {ex.Message}" });
            }
        }

        [HttpPost("test")]
        public async Task<ActionResult> SendTestNotification()
        {
            try
            {
                var userId = GetUserId();
                
                // Check if user has FCM token registered
                var user = await _userRepository.GetUserByIdIncludingInactiveAsync(userId);
                if (user == null)
                {
                    return BadRequest(new { message = "User not found." });
                }
                
                if (!user.IsActive)
                {
                    return BadRequest(new { message = "User account is not active." });
                }
                
                if (string.IsNullOrWhiteSpace(user.FcmToken))
                {
                    return BadRequest(new { 
                        message = "No FCM token registered. Please allow notifications in your browser and refresh the page.",
                        requiresTokenRegistration = true
                    });
                }
                
                try
                {
                    _logger.LogInformation($"Sending test notification to user {userId}");
                    
                    var success = await _firebaseNotificationService.SendNotificationToUserAsync(
                        userId,
                        "Test Notification",
                        "This is a test notification from SmartTermin! 🎉",
                        new Dictionary<string, string> 
                        { 
                            { "type", "test" },
                            { "timestamp", DateTime.UtcNow.ToString("O") }
                        }
                    );

                    if (success)
                    {
                        _logger.LogInformation($"✅ Test notification sent successfully to user {userId}");
                        return Ok(new { message = "Test notification sent successfully" });
                    }
                    else
                    {
                        _logger.LogWarning($"❌ Notification send returned false for user {userId}. Token may be invalid.");
                        // Don't clean up token here - let the exception handler do it
                        return BadRequest(new { 
                            message = "Failed to send test notification. Check backend logs for details.",
                            tokenInvalid = true
                        });
                    }
                }
                catch (FirebaseAdmin.Messaging.FirebaseMessagingException firebaseEx)
                {
                    _logger.LogError(firebaseEx, $"Firebase exception while sending test notification for user {userId}. ErrorCode: {firebaseEx.ErrorCode}, MessagingErrorCode: {firebaseEx.MessagingErrorCode}");
                    
                    // Clean up invalid token
                    _logger.LogWarning($"Cleaning up invalid FCM token for user {userId}");
                    await _userRepository.UpdateUserFcmTokenAsync(userId, null);
                    
                    var errorMessage = firebaseEx.MessagingErrorCode?.ToString() == "Unregistered" 
                        ? "The FCM token is unregistered (doesn't belong to this Firebase project). Token has been removed. Please refresh the page to register a new token."
                        : $"Firebase error: {firebaseEx.MessagingErrorCode}. Token has been removed. Please refresh the page to register a new token.";
                    
                    return BadRequest(new { 
                        message = errorMessage,
                        tokenInvalid = true,
                        tokenUnregistered = firebaseEx.MessagingErrorCode?.ToString() == "Unregistered",
                        errorCode = firebaseEx.ErrorCode.ToString(),
                        messagingErrorCode = firebaseEx.MessagingErrorCode?.ToString()
                    });
                }
                catch (Exception sendEx)
                {
                    _logger.LogError(sendEx, $"Exception while sending test notification for user {userId}. Type: {sendEx.GetType().Name}");
                    
                    // If it's a Firebase exception indicating invalid/unregistered token, clean it up
                    var isTokenError = sendEx.Message.Contains("not found", StringComparison.OrdinalIgnoreCase) ||
                                      sendEx.Message.Contains("Requested entity was not found", StringComparison.OrdinalIgnoreCase) ||
                                      sendEx.Message.Contains("Unregistered", StringComparison.OrdinalIgnoreCase);
                    
                    if (isTokenError)
                    {
                        _logger.LogWarning($"Invalid/Unregistered FCM token detected for user {userId}. Cleaning up. Error: {sendEx.Message}");
                        await _userRepository.UpdateUserFcmTokenAsync(userId, null);
                        
                        return BadRequest(new { 
                            message = "The FCM token is invalid or unregistered and has been removed. Please refresh the page to register a new token.",
                            tokenInvalid = true,
                            tokenUnregistered = true
                        });
                    }
                    
                    return StatusCode(500, new { 
                        message = $"An error occurred while sending the test notification: {sendEx.Message}",
                        errorType = sendEx.GetType().Name
                    });
                }
            }
            catch (UnauthorizedAccessException ex)
            {
                return Unauthorized(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error sending test notification");
                return StatusCode(500, new { message = "An error occurred while sending the test notification" });
            }
        }
    }
}

