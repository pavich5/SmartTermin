using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.Json;
using SmartTermin.DataAccess.Repositories;
using SmartTermin.DTOs;
using Microsoft.Extensions.Logging;

namespace SmartTermin.Services
{
    public class PaddleWebhookService : IPaddleWebhookService
    {
        private readonly IUserRepository _userRepository;
        private readonly ISalonRepository _salonRepository;
        private readonly ILogger<PaddleWebhookService> _logger;

        public PaddleWebhookService(
            IUserRepository userRepository, 
            ISalonRepository salonRepository,
            ILogger<PaddleWebhookService> logger)
        {
            _userRepository = userRepository;
            _salonRepository = salonRepository;
            _logger = logger;
        }

        public async Task<PaddleWebhookResponseDto> ProcessWebhookAsync(string eventType, Dictionary<string, object> webhookData)
        {
            try
            {
                _logger.LogInformation("=== Processing Paddle Webhook ===");
                _logger.LogInformation("Event Type: {EventType}", eventType);
                _logger.LogInformation("Webhook Data: {WebhookData}", JsonSerializer.Serialize(webhookData));

                switch (eventType.ToLowerInvariant())
                {
                    case "subscription.created":
                        await HandleSubscriptionCreatedAsync(webhookData);
                        break;
                    case "subscription.updated":
                        await HandleSubscriptionUpdatedAsync(webhookData);
                        break;
                    case "subscription.cancelled":
                        await HandleSubscriptionCancelledAsync(webhookData);
                        break;
                    case "transaction.completed":
                        await HandleTransactionCompletedAsync(webhookData);
                        break;
                    case "transaction.payment_failed":
                        await HandleTransactionPaymentFailedAsync(webhookData);
                        break;
                    case "checkout.completed":
                        await HandleCheckoutCompletedAsync(webhookData);
                        break;
                    default:
                        _logger.LogWarning("Unhandled Paddle webhook event type: {EventType}", eventType);
                        break;
                }

                _logger.LogInformation("=== Webhook Processing Complete ===");
                return new PaddleWebhookResponseDto { Success = true };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error processing Paddle webhook event {EventType}", eventType);
                throw;
            }
        }

        private async Task HandleSubscriptionCreatedAsync(Dictionary<string, object> data)
        {
            var subscriptionId = GetStringValue(data, "id") ?? GetStringValue(data, "subscription_id");
            var customerId = GetStringValue(data, "customer_id");
            
            // Try to get email from multiple possible locations
            var email = GetStringValue(data, "email") 
                ?? GetStringValue(data, "customer.email")
                ?? GetStringValue(data, "customer_email");
            
            var status = GetStringValue(data, "status") ?? "active";
            
            // Extract billing cycle - can be a string or an object with interval
            var billingCycleStr = GetStringValue(data, "billing_cycle");
            var billingCycleInterval = GetStringValue(data, "billing_cycle.interval");
            var billingCycle = !string.IsNullOrEmpty(billingCycleStr) 
                ? billingCycleStr 
                : (!string.IsNullOrEmpty(billingCycleInterval) 
                    ? billingCycleInterval 
                    : "monthly");
            var currentPeriodStart = GetDateTimeValue(data, "current_billing_period.start") ?? DateTime.UtcNow;
            var currentPeriodEnd = GetDateTimeValue(data, "current_billing_period.end") ?? DateTime.UtcNow.AddMonths(1);
            var trialEndsAt = GetDateTimeValue(data, "trial_dates.end");
            
            // Extract monthly cost from webhook
            var monthlyCost = GetMonthlyCostFromWebhook(data);
            
            _logger.LogInformation("Processing subscription.created: SubscriptionId={SubscriptionId}, CustomerId={CustomerId}, Email={Email}, Status={Status}, MonthlyCost={MonthlyCost}", 
                subscriptionId, customerId, email, status, monthlyCost);

            if (string.IsNullOrEmpty(subscriptionId))
            {
                _logger.LogWarning("Missing subscription ID in subscription.created webhook");
                return;
            }

            // Check if this is a salon subscription by looking at custom_data
            var customData = GetCustomData(data);
            var salonId = GetSalonIdFromCustomData(customData);
            var requestedArtistCount = GetArtistCountFromCustomData(customData);

            if (!string.IsNullOrEmpty(salonId) && Guid.TryParse(salonId, out var salonGuid))
            {
                // This is a salon subscription
                await HandleSalonSubscriptionCreatedAsync(
                    salonGuid,
                    subscriptionId,
                    customerId,
                    status,
                    billingCycle,
                    currentPeriodStart,
                    currentPeriodEnd,
                    trialEndsAt,
                    requestedArtistCount);
                return;
            }

            // Handle as artist subscription
            // Try to get user from custom_data first (more reliable)
            DomainModels.Models.User? user = null;
            if (customData != null)
            {
                _logger.LogInformation("Custom data found: {CustomData}", JsonSerializer.Serialize(customData));
                
                // Try userId first (most reliable)
                if (customData.TryGetValue("userId", out var userIdValue))
                {
                    var userIdStr = userIdValue?.ToString();
                    _logger.LogInformation("Attempting to parse userId from custom_data: {UserIdStr}", userIdStr);
                    
                    if (Guid.TryParse(userIdStr, out var userId))
                    {
                        user = await _userRepository.GetUserByIdWithArtistProfileAsync(userId);
                        _logger.LogInformation("Found user from custom_data userId: {UserId}, User found: {UserFound}", 
                            userId, user != null ? "Yes" : "No");
                    }
                    else
                    {
                        _logger.LogWarning("Failed to parse userId from custom_data: {UserIdStr}", userIdStr);
                    }
                }
            }

            // Fallback to email if custom_data didn't work
            if (user == null && !string.IsNullOrEmpty(email))
            {
                user = await _userRepository.GetUserByEmailAsync(email);
                _logger.LogInformation("Found user from email: {Email}, User found: {UserFound}", email, user != null ? "Yes" : "No");
            }

            if (user == null)
            {
                _logger.LogError("User not found for subscription.created webhook. Email: {Email}, CustomData: {CustomData}, SubscriptionId: {SubscriptionId}", 
                    email, customData != null ? JsonSerializer.Serialize(customData) : "null", subscriptionId);
                return;
            }

            if (user.UserType != "artist" || user.ArtistProfile == null)
            {
                _logger.LogWarning("User {UserId} is not an artist or missing artist profile. UserType: {UserType}, HasArtistProfile: {HasProfile}", 
                    user.Id, user.UserType, user.ArtistProfile != null);
                return;
            }

            var artist = user.ArtistProfile;
            
            // First check if subscription with this Paddle ID already exists
            var existingSubscriptionByPaddleId = await _userRepository.GetSubscriptionByPaddleSubscriptionIdAsync(subscriptionId);
            if (existingSubscriptionByPaddleId != null)
            {
                _logger.LogInformation("Subscription with Paddle ID {SubscriptionId} already exists for artist {ArtistId}", subscriptionId, artist.Id);
                return;
            }

            // Check if artist already has an active subscription (e.g., from trial)
            var existingSubscription = await _userRepository.GetActiveSubscriptionByArtistIdAsync(artist.Id);

            if (existingSubscription != null)
            {
                // Update existing subscription with Paddle IDs
                existingSubscription.PaddleSubscriptionId = subscriptionId;
                existingSubscription.PaddleCustomerId = customerId;
                existingSubscription.Status = status;
                existingSubscription.BillingCycle = billingCycle;
                existingSubscription.CurrentPeriodStart = currentPeriodStart;
                existingSubscription.CurrentPeriodEnd = currentPeriodEnd;
                // Update monthly cost if available
                if (monthlyCost.HasValue)
                {
                    existingSubscription.MonthlyCost = monthlyCost.Value;
                }
                // Clear trial end date when subscription becomes paid (has Paddle ID)
                existingSubscription.TrialEndsAt = null;
                existingSubscription.UpdatedAt = DateTime.UtcNow;

                await _userRepository.UpdateSubscriptionAsync(existingSubscription);
                _logger.LogInformation("Updated existing subscription for artist {ArtistId} with Paddle subscription {SubscriptionId}. MonthlyCost={MonthlyCost}. Cleared trial end date.", 
                    artist.Id, subscriptionId, monthlyCost);
            }
            else
            {
                // Create new subscription
                var subscription = new DomainModels.Models.ArtistSubscription
                {
                    ArtistId = artist.Id,
                    PaddleSubscriptionId = subscriptionId,
                    PaddleCustomerId = customerId,
                    PlanId = Guid.Empty, // Map from Paddle plan ID if needed
                    BillingCycle = billingCycle,
                    Status = status,
                    CurrentPeriodStart = currentPeriodStart,
                    CurrentPeriodEnd = currentPeriodEnd,
                    MonthlyCost = monthlyCost,
                    TrialEndsAt = trialEndsAt,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                };

                await _userRepository.CreateArtistSubscriptionAsync(subscription);
                _logger.LogInformation("Created new subscription for artist {ArtistId} with Paddle subscription {SubscriptionId}. MonthlyCost={MonthlyCost}", 
                    artist.Id, subscriptionId, monthlyCost);
            }
        }

        private async Task HandleSalonSubscriptionCreatedAsync(
            Guid salonId,
            string subscriptionId,
            string? customerId,
            string status,
            string billingCycle,
            DateTime currentPeriodStart,
            DateTime currentPeriodEnd,
            DateTime? trialEndsAt,
            int? requestedArtistCount = null)
        {
            try
            {
                var salon = await _salonRepository.GetSalonByIdAsync(salonId);
                if (salon == null)
                {
                    _logger.LogWarning("Salon not found for ID: {SalonId} in subscription.created webhook", salonId);
                    return;
                }

                var existingSubscription = await _salonRepository.GetSubscriptionAsync(salonId);
                var members = await _salonRepository.GetMembersAsync(salonId);
                var memberCount = members.Count;
                var normalizedRequestedCount = requestedArtistCount.HasValue && requestedArtistCount > 0
                    ? requestedArtistCount.Value
                    : (existingSubscription?.ArtistCount ?? memberCount);
                var artistCount = Math.Max(Math.Max(3, memberCount), normalizedRequestedCount);
                
                if (existingSubscription != null)
                {
                    const decimal ArtistSeatPrice = 15m;
                    
                    // Update existing subscription with Paddle subscription ID
                    existingSubscription.PaddleSubscriptionId = subscriptionId;
                    existingSubscription.Status = status;
                    existingSubscription.BillingCycle = billingCycle;
                    existingSubscription.ArtistCount = artistCount;
                    existingSubscription.MonthlyCost = artistCount * ArtistSeatPrice;
                    existingSubscription.CurrentPeriodStart = currentPeriodStart;
                    existingSubscription.CurrentPeriodEnd = currentPeriodEnd;
                    existingSubscription.TrialEndsAt = trialEndsAt;
                    existingSubscription.NextPaymentDate = currentPeriodEnd;
                    existingSubscription.UpdatedAt = DateTime.UtcNow;

                    await _salonRepository.UpsertSubscriptionAsync(existingSubscription);
                    _logger.LogInformation("Updated salon subscription for salon {SalonId} with Paddle subscription {SubscriptionId}", salonId, subscriptionId);
                }
                else
                {
                    const decimal ArtistSeatPrice = 15m;
                    
                    // Create new subscription
                    var subscription = new DomainModels.Models.SalonSubscription
                    {
                        SalonId = salonId,
                        PlanType = "enterprise",
                        ArtistCount = artistCount,
                        MonthlyCost = artistCount * ArtistSeatPrice,
                        BillingCycle = billingCycle,
                        Status = status,
                        PaddleSubscriptionId = subscriptionId,
                        CurrentPeriodStart = currentPeriodStart,
                        CurrentPeriodEnd = currentPeriodEnd,
                        NextPaymentDate = currentPeriodEnd,
                        TrialEndsAt = trialEndsAt,
                        CreatedAt = DateTime.UtcNow,
                        UpdatedAt = DateTime.UtcNow
                    };

                    await _salonRepository.UpsertSubscriptionAsync(subscription);
                    _logger.LogInformation("Created salon subscription for salon {SalonId} with Paddle subscription {SubscriptionId}", salonId, subscriptionId);
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error handling salon subscription created for salon {SalonId}", salonId);
                throw;
            }
        }

        private async Task HandleCheckoutCompletedAsync(Dictionary<string, object> data)
        {
            // Checkout.completed might fire before subscription.created
            // Extract subscription ID from items or subscription_id field
            var subscriptionId = GetStringValue(data, "subscription_id") ?? GetStringValue(data, "id");
            
            if (string.IsNullOrEmpty(subscriptionId))
            {
                // Try to get from items array
                if (data.TryGetValue("items", out var itemsValue))
                {
                    // Items might contain subscription information
                    _logger.LogInformation("Checkout completed but no subscription ID found in root, checking items");
                }
                return;
            }

            // Check if this is a salon subscription
            var customData = GetCustomData(data);
            var salonId = GetSalonIdFromCustomData(customData);
            var requestedArtistCount = GetArtistCountFromCustomData(customData);

            // If salonId is in custom_data, use it directly
            if (!string.IsNullOrEmpty(salonId) && Guid.TryParse(salonId, out var salonGuid))
            {
                // Update salon subscription with Paddle subscription ID
                var salon = await _salonRepository.GetSalonByIdAsync(salonGuid);
                if (salon == null)
                {
                    _logger.LogWarning("Salon not found for ID: {SalonId} in checkout.completed webhook", salonGuid);
                    return;
                }

                var existingSubscription = await _salonRepository.GetSubscriptionAsync(salonGuid);
                if (existingSubscription != null)
                {
                    var members = await _salonRepository.GetMembersAsync(salonGuid);
                    var memberCount = members.Count;
                    var normalizedRequestedCount = requestedArtistCount.HasValue && requestedArtistCount > 0
                        ? requestedArtistCount.Value
                        : existingSubscription.ArtistCount;
                    var artistCount = Math.Max(Math.Max(3, memberCount), normalizedRequestedCount);
                    const decimal ArtistSeatPrice = 15m;
                    
                    existingSubscription.PaddleSubscriptionId = subscriptionId;
                    existingSubscription.Status = "active";
                    existingSubscription.ArtistCount = artistCount;
                    existingSubscription.MonthlyCost = artistCount * ArtistSeatPrice;
                    existingSubscription.UpdatedAt = DateTime.UtcNow;
                    await _salonRepository.UpsertSubscriptionAsync(existingSubscription);
                    _logger.LogInformation("Updated salon subscription for salon {SalonId} with Paddle subscription {SubscriptionId} from checkout.completed", salonGuid, subscriptionId);
                }
                else
                {
                    _logger.LogWarning("Subscription not found for salon {SalonId} in checkout.completed webhook", salonGuid);
                }
            }
            // Fallback: If no salonId but we have userId and subscriptionType is enterprise, find the user's salon
            else if (customData != null && customData.TryGetValue("subscriptionType", out var subscriptionTypeValue) 
                && subscriptionTypeValue?.ToString() == "enterprise")
            {
                DomainModels.Models.User? user = null;
                
                // Try to get userId from custom_data
                if (customData.TryGetValue("userId", out var userIdValue))
                {
                    var userIdStr = userIdValue?.ToString();
                    if (Guid.TryParse(userIdStr, out var userId))
                    {
                        user = await _userRepository.GetUserByIdWithArtistProfileAsync(userId);
                    }
                }
                
                // Fallback to email
                if (user == null)
                {
                    var email = GetStringValue(data, "email") ?? GetStringValue(data, "customer.email");
                    if (!string.IsNullOrEmpty(email))
                    {
                        user = await _userRepository.GetUserByEmailAsync(email);
                    }
                }
                
                if (user != null && user.ArtistProfile != null && user.ArtistProfile.SalonId.HasValue)
                {
                    var userSalonId = user.ArtistProfile.SalonId.Value;
                    var existingSubscription = await _salonRepository.GetSubscriptionAsync(userSalonId);
                    if (existingSubscription != null && string.IsNullOrEmpty(existingSubscription.PaddleSubscriptionId))
                    {
                        var members = await _salonRepository.GetMembersAsync(userSalonId);
                        var memberCount = members.Count;
                        var normalizedRequestedCount = requestedArtistCount.HasValue && requestedArtistCount > 0
                            ? requestedArtistCount.Value
                            : existingSubscription.ArtistCount;
                        var artistCount = Math.Max(Math.Max(3, memberCount), normalizedRequestedCount);
                        const decimal ArtistSeatPrice = 15m;
                        
                        existingSubscription.PaddleSubscriptionId = subscriptionId;
                        existingSubscription.Status = "active";
                        existingSubscription.ArtistCount = artistCount;
                        existingSubscription.MonthlyCost = artistCount * ArtistSeatPrice;
                        existingSubscription.UpdatedAt = DateTime.UtcNow;
                        await _salonRepository.UpsertSubscriptionAsync(existingSubscription);
                        _logger.LogInformation("Updated salon subscription for salon {SalonId} (found via userId {UserId}) with Paddle subscription {SubscriptionId} from checkout.completed", 
                            userSalonId, user.Id, subscriptionId);
                    }
                }
            }
        }

        private async Task HandleSubscriptionUpdatedAsync(Dictionary<string, object> data)
        {
            var subscriptionId = GetStringValue(data, "id") ?? GetStringValue(data, "subscription_id");
            var status = GetStringValue(data, "status");
            var billingCycle = GetStringValue(data, "billing_cycle");
            var currentPeriodStart = GetDateTimeValue(data, "current_billing_period.start");
            var currentPeriodEnd = GetDateTimeValue(data, "current_billing_period.end");
            var trialEndsAt = GetDateTimeValue(data, "trial_dates.end");
            
            // Extract quantity from items if available
            int? quantity = null;
            if (data.TryGetValue("items", out var itemsValue))
            {
                if (itemsValue is JsonElement itemsElement && itemsElement.ValueKind == JsonValueKind.Array)
                {
                    var itemsArray = itemsElement.EnumerateArray().ToList();
                    if (itemsArray.Count > 0)
                    {
                        var firstItem = itemsArray[0];
                        if (firstItem.TryGetProperty("quantity", out var quantityElement))
                        {
                            quantity = quantityElement.GetInt32();
                        }
                    }
                }
            }

            if (string.IsNullOrEmpty(subscriptionId))
            {
                _logger.LogWarning("Missing subscription ID in subscription.updated webhook");
                return;
            }

            // First, try to find as salon subscription
            var salonSubscription = await _salonRepository.GetSubscriptionByPaddleSubscriptionIdAsync(subscriptionId);
            if (salonSubscription != null)
            {
                _logger.LogInformation("Found salon subscription for Paddle subscription ID: {SubscriptionId}, SalonId: {SalonId}", 
                    subscriptionId, salonSubscription.SalonId);

                if (!string.IsNullOrEmpty(status))
                {
                    salonSubscription.Status = status;
                }

                if (!string.IsNullOrEmpty(billingCycle))
                {
                    salonSubscription.BillingCycle = billingCycle;
                }

                if (currentPeriodStart.HasValue)
                {
                    salonSubscription.CurrentPeriodStart = currentPeriodStart.Value;
                }

                if (currentPeriodEnd.HasValue)
                {
                    salonSubscription.CurrentPeriodEnd = currentPeriodEnd.Value;
                }

                if (trialEndsAt.HasValue)
                {
                    salonSubscription.TrialEndsAt = trialEndsAt;
                }

                // Update quantity if provided in webhook
                if (quantity.HasValue && quantity.Value > 0)
                {
                    salonSubscription.ArtistCount = quantity.Value;
                    salonSubscription.MonthlyCost = quantity.Value * 15m; // ArtistSeatPrice
                }

                salonSubscription.UpdatedAt = DateTime.UtcNow;
                await _salonRepository.UpsertSubscriptionAsync(salonSubscription);

                _logger.LogInformation("Updated salon subscription {SubscriptionId} for salon {SalonId}. Quantity: {Quantity}, Status: {Status}", 
                    subscriptionId, salonSubscription.SalonId, quantity ?? salonSubscription.ArtistCount, status ?? salonSubscription.Status);
                return;
            }

            // Fallback: try to find as artist subscription
            var artistSubscription = await _userRepository.GetSubscriptionByPaddleSubscriptionIdAsync(subscriptionId);
            if (artistSubscription == null)
            {
                _logger.LogWarning("Subscription not found for Paddle subscription ID: {SubscriptionId} (checked both salon and artist subscriptions)", subscriptionId);
                return;
            }

            if (!string.IsNullOrEmpty(status))
            {
                artistSubscription.Status = status;
            }

            if (!string.IsNullOrEmpty(billingCycle))
            {
                artistSubscription.BillingCycle = billingCycle;
            }

            if (currentPeriodStart.HasValue)
            {
                artistSubscription.CurrentPeriodStart = currentPeriodStart.Value;
            }

            if (currentPeriodEnd.HasValue)
            {
                artistSubscription.CurrentPeriodEnd = currentPeriodEnd.Value;
            }

            if (trialEndsAt.HasValue)
            {
                artistSubscription.TrialEndsAt = trialEndsAt;
            }

            artistSubscription.UpdatedAt = DateTime.UtcNow;
            await _userRepository.UpdateSubscriptionAsync(artistSubscription);

            _logger.LogInformation("Updated artist subscription {SubscriptionId} for artist {ArtistId}", subscriptionId, artistSubscription.ArtistId);
        }

        private async Task HandleSubscriptionCancelledAsync(Dictionary<string, object> data)
        {
            var subscriptionId = GetStringValue(data, "id") ?? GetStringValue(data, "subscription_id");
            var cancelledAt = GetDateTimeValue(data, "cancelled_at") ?? DateTime.UtcNow;

            if (string.IsNullOrEmpty(subscriptionId))
            {
                _logger.LogWarning("Missing subscription ID in subscription.cancelled webhook");
                return;
            }

            var subscription = await _userRepository.GetSubscriptionByPaddleSubscriptionIdAsync(subscriptionId);
            if (subscription == null)
            {
                _logger.LogWarning("Subscription not found for Paddle subscription ID: {SubscriptionId}", subscriptionId);
                return;
            }

            subscription.Status = "cancelled";
            subscription.CancelledAt = cancelledAt;
            subscription.UpdatedAt = DateTime.UtcNow;
            await _userRepository.UpdateSubscriptionAsync(subscription);

            _logger.LogInformation("Cancelled subscription {SubscriptionId} for artist {ArtistId}", subscriptionId, subscription.ArtistId);
        }

        private async Task HandleTransactionCompletedAsync(Dictionary<string, object> data)
        {
            var subscriptionId = GetStringValue(data, "subscription_id");
            var status = GetStringValue(data, "status");

            if (string.IsNullOrEmpty(subscriptionId))
            {
                _logger.LogWarning("Missing subscription ID in transaction.completed webhook");
                return;
            }

            var subscription = await _userRepository.GetSubscriptionByPaddleSubscriptionIdAsync(subscriptionId);
            if (subscription == null)
            {
                _logger.LogWarning("Subscription not found for Paddle subscription ID: {SubscriptionId}", subscriptionId);
                return;
            }

            if (subscription.Status == "cancelled" || subscription.Status == "past_due")
            {
                subscription.Status = "active";
                subscription.UpdatedAt = DateTime.UtcNow;
                await _userRepository.UpdateSubscriptionAsync(subscription);
                _logger.LogInformation("Reactivated subscription {SubscriptionId} for artist {ArtistId}", subscriptionId, subscription.ArtistId);
            }
        }

        private async Task HandleTransactionPaymentFailedAsync(Dictionary<string, object> data)
        {
            var subscriptionId = GetStringValue(data, "subscription_id");

            if (string.IsNullOrEmpty(subscriptionId))
            {
                _logger.LogWarning("Missing subscription ID in transaction.payment_failed webhook");
                return;
            }

            var subscription = await _userRepository.GetSubscriptionByPaddleSubscriptionIdAsync(subscriptionId);
            if (subscription == null)
            {
                _logger.LogWarning("Subscription not found for Paddle subscription ID: {SubscriptionId}", subscriptionId);
                return;
            }

            subscription.Status = "past_due";
            subscription.UpdatedAt = DateTime.UtcNow;
            await _userRepository.UpdateSubscriptionAsync(subscription);

            _logger.LogInformation("Marked subscription {SubscriptionId} as past_due for artist {ArtistId}", subscriptionId, subscription.ArtistId);
        }

        private string? GetStringValue(Dictionary<string, object> data, string key)
        {
            // Handle nested keys like "customer.email"
            if (key.Contains('.'))
            {
                var parts = key.Split('.');
                object? current = data;
                
                foreach (var part in parts)
                {
                    if (current is Dictionary<string, object> dict)
                    {
                        if (dict.TryGetValue(part, out var nestedValue))
                        {
                            current = nestedValue;
                        }
                        else
                        {
                            return null;
                        }
                    }
                    else
                    {
                        return null;
                    }
                }
                
                return current?.ToString();
            }
            
            // Handle simple keys
            if (data.TryGetValue(key, out var value))
            {
                return value?.ToString();
            }
            return null;
        }

        private DateTime? GetDateTimeValue(Dictionary<string, object> data, string key)
        {
            var value = GetStringValue(data, key);
            if (string.IsNullOrEmpty(value))
            {
                return null;
            }

            if (DateTime.TryParse(value, out var dateTime))
            {
                return dateTime;
            }

            if (long.TryParse(value, out var unixTimestamp))
            {
                return DateTimeOffset.FromUnixTimeSeconds(unixTimestamp).DateTime;
            }

            return null;
        }

        private Dictionary<string, object>? GetCustomData(Dictionary<string, object> data)
        {
            if (data.TryGetValue("custom_data", out var customDataValue))
            {
                if (customDataValue is JsonElement jsonElement)
                {
                    try
                    {
                        var customDataDict = JsonSerializer.Deserialize<Dictionary<string, object>>(jsonElement.GetRawText());
                        return customDataDict;
                    }
                    catch
                    {
                        // Try as string
                        var customDataString = customDataValue.ToString();
                        if (!string.IsNullOrEmpty(customDataString))
                        {
                            try
                            {
                                return JsonSerializer.Deserialize<Dictionary<string, object>>(customDataString);
                            }
                            catch
                            {
                                // If it's already a dictionary, return it
                                if (customDataValue is Dictionary<string, object> dict)
                                {
                                    return dict;
                                }
                            }
                        }
                    }
                }
                else if (customDataValue is Dictionary<string, object> dict)
                {
                    return dict;
                }
            }
            return null;
        }

        private string? GetSalonIdFromCustomData(Dictionary<string, object>? customData)
        {
            if (customData == null) return null;

            // Try different possible keys
            if (customData.TryGetValue("salonId", out var salonIdValue))
            {
                return salonIdValue?.ToString();
            }
            if (customData.TryGetValue("salon_id", out var salonIdValue2))
            {
                return salonIdValue2?.ToString();
            }
            if (customData.TryGetValue("SalonId", out var salonIdValue3))
            {
                return salonIdValue3?.ToString();
            }

            return null;
        }

        private int? GetArtistCountFromCustomData(Dictionary<string, object>? customData)
        {
            if (customData == null) return null;

            var possibleKeys = new[] { "artistCount", "artist_count", "quantity", "seats" };
            foreach (var key in possibleKeys)
            {
                if (customData.TryGetValue(key, out var value) && value != null)
                {
                    if (int.TryParse(value.ToString(), out var parsed) && parsed > 0)
                    {
                        return parsed;
                    }
                }
            }

            return null;
        }

        private decimal? GetMonthlyCostFromWebhook(Dictionary<string, object> data)
        {
            try
            {
                // Try to get price from items[0].price.unit_price.amount
                if (data.TryGetValue("items", out var itemsValue))
                {
                    if (itemsValue is JsonElement itemsElement && itemsElement.ValueKind == JsonValueKind.Array)
                    {
                        if (itemsElement.GetArrayLength() > 0)
                        {
                            var firstItem = itemsElement[0];
                            if (firstItem.TryGetProperty("price", out var priceElement))
                            {
                                if (priceElement.TryGetProperty("unit_price", out var unitPriceElement))
                                {
                                    if (unitPriceElement.TryGetProperty("amount", out var amountElement))
                                    {
                                        var amountStr = amountElement.GetString();
                                        if (!string.IsNullOrEmpty(amountStr) && decimal.TryParse(amountStr, out var amountInCents))
                                        {
                                            // Convert from cents to dollars/euros
                                            return amountInCents / 100m;
                                        }
                                    }
                                }
                            }
                        }
                    }
                    else if (itemsValue is System.Collections.IList itemsList && itemsList.Count > 0)
                    {
                        // Handle as list of dictionaries
                        if (itemsList[0] is Dictionary<string, object> firstItem)
                        {
                            if (firstItem.TryGetValue("price", out var priceValue))
                            {
                                if (priceValue is Dictionary<string, object> priceDict)
                                {
                                    if (priceDict.TryGetValue("unit_price", out var unitPriceValue))
                                    {
                                        if (unitPriceValue is Dictionary<string, object> unitPriceDict)
                                        {
                                            if (unitPriceDict.TryGetValue("amount", out var amountValue))
                                            {
                                                var amountStr = amountValue?.ToString();
                                                if (!string.IsNullOrEmpty(amountStr) && decimal.TryParse(amountStr, out var amountInCents))
                                                {
                                                    return amountInCents / 100m;
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to extract monthly cost from webhook data");
            }
            
            return null;
        }
    }
}
