using FirebaseAdmin;
using FirebaseAdmin.Messaging;
using Google.Apis.Auth.OAuth2;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Threading.Tasks;
using SmartTermin.DataAccess.Repositories;

namespace SmartTermin.Services
{
    /// <summary>
    /// Improved Firebase Notification Service with better error handling and validation
    /// </summary>
    public class FirebaseNotificationService : IFirebaseNotificationService
    {
        private readonly ILogger<FirebaseNotificationService> _logger;
        private readonly FirebaseSettings _firebaseSettings;
        private readonly IUserRepository _userRepository;
        private bool _initialized = false;
        private string? _firebaseProjectId = null;

        // Track notifications sent to prevent duplicates (userId + notification key + timestamp)
        private static readonly Dictionary<string, DateTime> _sentNotifications = new Dictionary<string, DateTime>();
        private static readonly object _notificationLock = new object();
        private static readonly TimeSpan _deduplicationWindow = TimeSpan.FromSeconds(10); // Prevent duplicates within 10 seconds

        public FirebaseNotificationService(
            ILogger<FirebaseNotificationService> logger,
            IOptions<FirebaseSettings> firebaseSettings,
            IUserRepository userRepository)
        {
            _logger = logger;
            _firebaseSettings = firebaseSettings.Value;
            _userRepository = userRepository;
            InitializeFirebase();
        }

        private void InitializeFirebase()
        {
            try
            {
                if (FirebaseApp.DefaultInstance == null)
                {
                    AppOptions options;

                    // Try to initialize from JSON string first (for production/cloud deployments)
                    if (!string.IsNullOrWhiteSpace(_firebaseSettings.ServiceAccountKeyJson))
                    {
                        var credential = GoogleCredential.FromJson(_firebaseSettings.ServiceAccountKeyJson);
                        options = new AppOptions()
                        {
                            Credential = credential
                        };
                        // Extract project ID from JSON
                        var jsonObj = System.Text.Json.JsonSerializer.Deserialize<Dictionary<string, object>>(_firebaseSettings.ServiceAccountKeyJson);
                        if (jsonObj != null && jsonObj.ContainsKey("project_id"))
                        {
                            _firebaseProjectId = jsonObj["project_id"]?.ToString();
                        }
                    }
                    // Try to initialize from file path (for local development)
                    else if (!string.IsNullOrWhiteSpace(_firebaseSettings.ServiceAccountKeyPath) && File.Exists(_firebaseSettings.ServiceAccountKeyPath))
                    {
                        var credential = GoogleCredential.FromFile(_firebaseSettings.ServiceAccountKeyPath);
                        options = new AppOptions()
                        {
                            Credential = credential
                        };
                        // Extract project ID from file
                        var jsonContent = File.ReadAllText(_firebaseSettings.ServiceAccountKeyPath);
                        var jsonObj = System.Text.Json.JsonSerializer.Deserialize<Dictionary<string, object>>(jsonContent);
                        if (jsonObj != null && jsonObj.ContainsKey("project_id"))
                        {
                            _firebaseProjectId = jsonObj["project_id"]?.ToString();
                        }
                    }
                    else
                    {
                        _logger.LogWarning("Firebase credentials not configured. Push notifications will not work.");
                        return;
                    }

                    FirebaseApp.Create(options);
                    _initialized = true;
                    _firebaseProjectId = _firebaseProjectId ?? _firebaseSettings.ProjectId;
                    _logger.LogInformation($"Firebase initialized successfully. Project ID: {_firebaseProjectId}");
                }
                else
                {
                    _initialized = true;
                    _firebaseProjectId = FirebaseApp.DefaultInstance.Options.ProjectId ?? _firebaseSettings.ProjectId;
                    _logger.LogInformation($"Firebase already initialized. Project ID: {_firebaseProjectId}");
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to initialize Firebase");
                _initialized = false;
            }
        }

        /// <summary>
        /// Validates FCM token format
        /// </summary>
        private bool IsValidTokenFormat(string token)
        {
            if (string.IsNullOrWhiteSpace(token))
                return false;

            // FCM tokens are typically 140-160 characters long
            if (token.Length < 50 || token.Length > 200)
                return false;

            // FCM tokens usually contain colons and base64-like characters
            if (!token.Contains(":") || !token.Contains("APA91"))
                return false;

            return true;
        }

        public async Task<bool> SendNotificationAsync(string fcmToken, string title, string body, Dictionary<string, string>? data = null)
        {
            if (!_initialized)
            {
                _logger.LogError("Firebase is not initialized. Cannot send notification.");
                return false;
            }

            if (string.IsNullOrWhiteSpace(fcmToken))
            {
                _logger.LogWarning("FCM token is empty");
                return false;
            }

            // Validate token format
            if (!IsValidTokenFormat(fcmToken))
            {
                _logger.LogWarning($"FCM token format appears invalid. Length: {fcmToken.Length}, Token: {fcmToken.Substring(0, Math.Min(30, fcmToken.Length))}...");
                return false;
            }

            try
            {
                _logger.LogInformation($"Preparing to send notification. Project: {_firebaseProjectId}, Token prefix: {fcmToken.Substring(0, Math.Min(20, fcmToken.Length))}...");

                // Create data dictionary for background notifications
                var dataDict = new Dictionary<string, string>
                {
                    { "title", title ?? "Notification" },
                    { "body", body ?? "" }
                };

                // Merge additional data if provided
                if (data != null && data.Any())
                {
                    foreach (var item in data)
                    {
                        dataDict[item.Key] = item.Value;
                    }
                }

                // Create message with ONLY data payload (no notification object)
                // Sending both notification and data causes duplicate notifications on some platforms
                // The client app will handle displaying the notification from the data payload
                var message = new Message
                {
                    Token = fcmToken.Trim(), // Ensure no whitespace
                    // DO NOT include Notification object - causes duplicates
                    // Only send data payload, let client app handle notification display
                    Data = dataDict
                };
                
                // Add web push specific configuration (without notification object to avoid duplicates)
                message.Webpush = new WebpushConfig
                {
                    Headers = new Dictionary<string, string>
                    {
                        { "Urgency", "normal" }
                    }
                };

                // Send with retry logic
                string messageId = null;
                int maxRetries = 2;
                for (int attempt = 1; attempt <= maxRetries; attempt++)
                {
                    try
                    {
                        _logger.LogInformation($"Sending notification (attempt {attempt}/{maxRetries})...");
                        messageId = await FirebaseMessaging.DefaultInstance.SendAsync(message);
                        _logger.LogInformation($"✅ Successfully sent notification. Message ID: {messageId}");
                        return true;
                    }
                    catch (FirebaseMessagingException ex) when (attempt < maxRetries && ex.MessagingErrorCode == MessagingErrorCode.Unavailable)
                    {
                        _logger.LogWarning($"Firebase unavailable on attempt {attempt}, retrying...");
                        await Task.Delay(1000 * attempt); // Exponential backoff
                        continue;
                    }
                }

                // Should not reach here, but just in case
                if (string.IsNullOrEmpty(messageId))
                {
                    _logger.LogError("Failed to send notification after all retries");
                    return false;
                }

                return true;
            }
            catch (FirebaseMessagingException ex)
            {
                var messagingErrorCode = ex.MessagingErrorCode?.ToString() ?? "Unknown";
                _logger.LogError(ex, $"❌ FirebaseMessagingException: ErrorCode={ex.ErrorCode}, MessagingErrorCode={messagingErrorCode}, Message={ex.Message}");
                
                // Log detailed error information
                _logger.LogError($"Token: {fcmToken.Substring(0, Math.Min(30, fcmToken.Length))}..., Project: {_firebaseProjectId}");
                
                // Re-throw so controller can handle cleanup
                throw;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"❌ Unexpected error: {ex.GetType().Name} - {ex.Message}");
                throw;
            }
        }

        public async Task<bool> SendNotificationToUserAsync(Guid userId, string title, string body, Dictionary<string, string>? data = null)
        {
            try
            {
                if (!_initialized)
                {
                    _logger.LogError("Firebase is not initialized. Cannot send notification.");
                    return false;
                }

                var user = await _userRepository.GetUserByIdIncludingInactiveAsync(userId);
                if (user == null)
                {
                    _logger.LogWarning($"User {userId} not found");
                    return false;
                }

                if (!user.IsActive)
                {
                    _logger.LogWarning($"User {userId} is not active");
                    return false;
                }

                if (string.IsNullOrWhiteSpace(user.FcmToken))
                {
                    _logger.LogWarning($"User {userId} has no FCM token registered");
                    return false;
                }

                // Create a unique key for this notification to prevent duplicates
                // For booking notifications, use just userId + bookingId + type for more reliable deduplication
                // For other notifications, use userId + title + body
                string notificationKey;
                if (data != null && data.ContainsKey("bookingId") && data.ContainsKey("type"))
                {
                    // Use a simpler key for booking notifications to ensure reliable deduplication
                    notificationKey = $"{userId}_{data["type"]}_{data["bookingId"]}";
                }
                else if (data != null && data.ContainsKey("bookingId"))
                {
                    notificationKey = $"{userId}_booking_{data["bookingId"]}";
                }
                else
                {
                    notificationKey = $"{userId}_{title}_{body}";
                }

                // Check if this exact notification was sent recently
                lock (_notificationLock)
                {
                    // Clean up old entries (older than deduplication window)
                    var cutoffTime = DateTime.UtcNow - _deduplicationWindow;
                    var keysToRemove = _sentNotifications.Where(kvp => kvp.Value < cutoffTime).Select(kvp => kvp.Key).ToList();
                    foreach (var key in keysToRemove)
                    {
                        _sentNotifications.Remove(key);
                    }

                    // Check if this notification was already sent
                    if (_sentNotifications.ContainsKey(notificationKey))
                    {
                        var lastSent = _sentNotifications[notificationKey];
                        var timeSinceLastSent = DateTime.UtcNow - lastSent;
                        if (timeSinceLastSent < _deduplicationWindow)
                        {
                            _logger.LogInformation($"Duplicate notification detected for key '{notificationKey}'. Last sent {timeSinceLastSent.TotalSeconds:F1} seconds ago. Skipping.");
                            return true; // Return true to indicate "success" (we're just preventing duplicate)
                        }
                    }

                    // Mark this notification as sent
                    _sentNotifications[notificationKey] = DateTime.UtcNow;
                }

                _logger.LogInformation($"Sending notification to user {userId}. Token length: {user.FcmToken.Length}");

                return await SendNotificationAsync(user.FcmToken, title, body, data);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error in SendNotificationToUserAsync for user {userId}: {ex.Message}");
                throw;
            }
        }

        public async Task<bool> SendNotificationToMultipleUsersAsync(List<Guid> userIds, string title, string body, Dictionary<string, string>? data = null)
        {
            if (userIds == null || !userIds.Any())
            {
                return false;
            }

            if (!_initialized)
            {
                _logger.LogError("Firebase is not initialized. Cannot send notifications.");
                return false;
            }

            var users = await _userRepository.GetUsersByIdsAsync(userIds);
            var validTokens = users
                .Where(u => u.IsActive && !string.IsNullOrWhiteSpace(u.FcmToken) && IsValidTokenFormat(u.FcmToken))
                .Select(u => u.FcmToken!)
                .ToList();

            if (!validTokens.Any())
            {
                _logger.LogWarning("No valid FCM tokens found for the provided user IDs");
                return false;
            }

            try
            {
                // Create data dictionary with title and body included
                var dataDict = new Dictionary<string, string>
                {
                    { "title", title ?? "Notification" },
                    { "body", body ?? "" }
                };
                
                // Merge additional data if provided
                if (data != null && data.Any())
                {
                    foreach (var item in data)
                    {
                        dataDict[item.Key] = item.Value;
                    }
                }

                // Create messages with ONLY data payload (no notification object to avoid duplicates)
                var messages = validTokens.Select(token => new Message
                {
                    Token = token.Trim(),
                    // DO NOT include Notification object - causes duplicates
                    // Only send data payload, let client app handle notification display
                    Data = dataDict
                }).ToList();

                var response = await FirebaseMessaging.DefaultInstance.SendAllAsync(messages);
                
                _logger.LogInformation($"Sent {response.SuccessCount} notifications. {response.FailureCount} failed.");
                
                // Log failed tokens for cleanup
                if (response.FailureCount > 0)
                {
                    for (int i = 0; i < messages.Count; i++)
                    {
                        if (!response.Responses[i].IsSuccess)
                        {
                            var error = response.Responses[i].Exception;
                            _logger.LogWarning($"Failed to send to token {messages[i].Token.Substring(0, Math.Min(20, messages[i].Token.Length))}... Error: {error?.Message}");
                        }
                    }
                }

                return response.SuccessCount > 0;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Unexpected error sending batch Firebase notifications");
                return false;
            }
        }

        /// <summary>
        /// Test Firebase connection and configuration
        /// </summary>
        public bool TestFirebaseConnection()
        {
            if (!_initialized)
            {
                _logger.LogWarning("Firebase is not initialized");
                return false;
            }

            try
            {
                var app = FirebaseApp.DefaultInstance;
                if (app == null)
                {
                    _logger.LogWarning("Firebase app instance is null");
                    return false;
                }

                _logger.LogInformation($"Firebase connection test successful. Project ID: {_firebaseProjectId}");
                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Firebase connection test failed");
                return false;
            }
        }
    }
}

