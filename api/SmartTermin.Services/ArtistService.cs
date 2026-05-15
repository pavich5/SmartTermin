using System;
using SmartTermin.DataAccess.Repositories;
using SmartTermin.DTOs;
using System.Collections.Generic;
using System.Globalization;
using System.Linq;
using System.Text;
using System.Text.Json;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using System.Net.Http;
using Microsoft.EntityFrameworkCore;
using SmartTermin.DataAccess.DataContext;
using DomainBooking = SmartTermin.DomainModels.Models.Booking;

namespace SmartTermin.Services
{
    public class ArtistService : IArtistService
    {
        private readonly IArtistRepository _artistRepository;
        private readonly IUserRepository _userRepository;
        private readonly IBookingRepository _bookingRepository;
        private readonly IFirebaseNotificationService _notificationService;
        private readonly IHttpClientFactory _httpClientFactory;
        private readonly IConfiguration _configuration;
        private readonly ILogger<ArtistService> _logger;
        private readonly SmartTerminDbContext _context;

        public ArtistService(
            IArtistRepository artistRepository, 
            IUserRepository userRepository,
            IBookingRepository bookingRepository,
            IFirebaseNotificationService notificationService,
            IHttpClientFactory httpClientFactory,
            IConfiguration configuration,
            ILogger<ArtistService> logger,
            SmartTerminDbContext context)
        {
            _artistRepository = artistRepository;
            _userRepository = userRepository;
            _bookingRepository = bookingRepository;
            _notificationService = notificationService;
            _httpClientFactory = httpClientFactory;
            _configuration = configuration;
            _logger = logger;
            _context = context;
        }

        public async Task<GetArtistsResponseDto> GetArtistsAsync(string? search, string? service, int page, int limit)
        {
            if (page < 1) page = 1;
            if (limit < 1) limit = 20;

            var (artistsData, total) = await _artistRepository.GetArtistsListAsync(search, service, page, limit);

            var dto = new GetArtistsResponseDto
            {
                Page = page,
                Limit = limit,
                Total = total
            };

            dto.Artists = artistsData.Select(a => new ArtistListItemDto
            {
                Id = a.Id.ToString(),
                Name = a.Name,
                Profession = a.Profession,
                Image = a.Image,
                Services = a.Services,
                Price = a.MinPrice.HasValue
                    ? a.MinPrice.Value.ToString("C0", CultureInfo.InvariantCulture)
                    : string.Empty,
                Location = a.Location,
                Rating = a.Rating,
                SalonId = a.SalonId,
                CustomBookingLink = a.CustomBookingLink
            }).ToList();

            return dto;
        }

        public async Task<ArtistDetailDto?> GetArtistByIdAsync(Guid artistId)
        {
            var artist = await _artistRepository.GetArtistByIdAsync(artistId);

            if (artist == null)
            {
                return null;
            }

            // Include both active and inactive services (IsActive = 0 or 1)
            var services = artist.Services?
                .Select(s => new ArtistServiceItemDto
                {
                    Id = s.Id.ToString(),
                    Name = s.Name ?? string.Empty,
                    Duration = s.DurationMinutes,
                    Price = s.Price
                })
                .ToList() ?? new List<ArtistServiceItemDto>();

            var portfolio = artist.PortfolioImages?
                .Where(p => !p.IsBannerImage && !p.IsProfilePicture)
                .Select(p => p.ImageUrl)
                .Where(url => !string.IsNullOrWhiteSpace(url))
                .ToList() ?? new List<string>();

            // Get banner and profile images from portfolio images
            var bannerImage = artist.PortfolioImages?
                .FirstOrDefault(p => p.IsBannerImage)?.ImageUrl ?? string.Empty;
            var profileImage = artist.PortfolioImages?
                .FirstOrDefault(p => p.IsProfilePicture)?.ImageUrl ?? string.Empty;

            // Get salon ID from SalonId field or from active SalonMemberships
            string? salonId = null;
            if (artist.SalonId.HasValue)
            {
                salonId = artist.SalonId.Value.ToString();
            }
            else if (artist.SalonMemberships != null && artist.SalonMemberships.Any(m => m.Status == "active"))
            {
                var activeMembership = artist.SalonMemberships.FirstOrDefault(m => m.Status == "active");
                if (activeMembership != null)
                {
                    salonId = activeMembership.SalonId.ToString();
                }
            }

            var detail = new ArtistDetailDto
            {
                Id = artist.Id.ToString(),
                Name = !string.IsNullOrWhiteSpace(artist.BusinessName)
                    ? artist.BusinessName
                    : artist.User?.FullName ?? string.Empty,
                Profession = artist.Profession ?? string.Empty,
                BannerImage = bannerImage,
                ProfileImage = profileImage,
                Rating = artist.Rating ?? 0,
                ReviewsTotal = artist.TotalReviews ?? 0,
                Location = BuildLocation(artist.Address, artist.City),
                Phone = artist.User?.Phone ?? string.Empty,
                Email = artist.User?.Email ?? string.Empty,
                About = artist.About ?? string.Empty,
                Services = services,
                Portfolio = portfolio,
                WorkingHours = BuildWorkingHours(artist.WorkingHours),
                SalonId = salonId
            };

            return detail;
        }

        public async Task<ArtistDetailDto?> GetArtistByCustomBookingLinkAsync(string customBookingLink)
        {
            var artist = await _artistRepository.GetArtistByCustomBookingLinkAsync(customBookingLink);

            if (artist == null)
            {
                return null;
            }

            // Reuse the same mapping logic as GetArtistByIdAsync
            var services = artist.Services?
                .Select(s => new ArtistServiceItemDto
                {
                    Id = s.Id.ToString(),
                    Name = s.Name ?? string.Empty,
                    Duration = s.DurationMinutes,
                    Price = s.Price
                })
                .ToList() ?? new List<ArtistServiceItemDto>();

            var portfolio = artist.PortfolioImages?
                .Where(p => !p.IsBannerImage && !p.IsProfilePicture)
                .Select(p => p.ImageUrl)
                .Where(url => !string.IsNullOrWhiteSpace(url))
                .ToList() ?? new List<string>();

            var bannerImage = artist.PortfolioImages?
                .FirstOrDefault(p => p.IsBannerImage)?.ImageUrl ?? string.Empty;
            var profileImage = artist.PortfolioImages?
                .FirstOrDefault(p => p.IsProfilePicture)?.ImageUrl ?? string.Empty;

            string? salonId = null;
            if (artist.SalonId.HasValue)
            {
                salonId = artist.SalonId.Value.ToString();
            }
            else if (artist.SalonMemberships != null && artist.SalonMemberships.Any(m => m.Status == "active"))
            {
                var activeMembership = artist.SalonMemberships.FirstOrDefault(m => m.Status == "active");
                if (activeMembership != null)
                {
                    salonId = activeMembership.SalonId.ToString();
                }
            }

            var detail = new ArtistDetailDto
            {
                Id = artist.Id.ToString(),
                Name = !string.IsNullOrWhiteSpace(artist.BusinessName)
                    ? artist.BusinessName
                    : artist.User?.FullName ?? string.Empty,
                Profession = artist.Profession ?? string.Empty,
                BannerImage = bannerImage,
                ProfileImage = profileImage,
                Rating = artist.Rating ?? 0,
                ReviewsTotal = artist.TotalReviews ?? 0,
                Location = BuildLocation(artist.Address, artist.City),
                Phone = artist.User?.Phone ?? string.Empty,
                Email = artist.User?.Email ?? string.Empty,
                About = artist.About ?? string.Empty,
                Services = services,
                Portfolio = portfolio,
                WorkingHours = BuildWorkingHours(artist.WorkingHours),
                SalonId = salonId
            };

            return detail;
        }

        private static string BuildLocation(string? address, string? city)
        {
            if (!string.IsNullOrWhiteSpace(address) && !string.IsNullOrWhiteSpace(city))
            {
                return $"{address}, {city}";
            }

            if (!string.IsNullOrWhiteSpace(address))
            {
                return address;
            }

            if (!string.IsNullOrWhiteSpace(city))
            {
                return city;
            }

            return string.Empty;
        }

        private static IDictionary<string, string> BuildWorkingHours(ICollection<DomainModels.Models.WorkingHour>? workingHours)
        {
            // Days in order: Monday first, Sunday last
            var dayKeys = new[] { "monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday" };
            var result = new Dictionary<string, string>();
            
            // Initialize all days as "Closed" in the correct order
            foreach (var day in dayKeys)
            {
                result[day] = "Closed";
            }

            if (workingHours == null)
            {
                return result;
            }

            foreach (var entry in workingHours)
            {
                var key = ResolveDayKey(dayKeys, entry.DayOfWeek);

                if (string.IsNullOrEmpty(key))
                {
                    continue;
                }

                if (entry.IsAvailable == false)
                {
                    result[key] = "Closed";
                    continue;
                }

                var start = FormatTime(entry.StartTime);
                var end = FormatTime(entry.EndTime);
                result[key] = $"{start} - {end}";
            }

            // Return dictionary in the correct order (Monday first)
            var orderedResult = new Dictionary<string, string>();
            foreach (var day in dayKeys)
            {
                orderedResult[day] = result[day];
            }

            return orderedResult;
        }

        private static string ResolveDayKey(IReadOnlyList<string> dayKeys, int dayOfWeek)
        {
            // Map .NET DayOfWeek enum (Sunday=0, Monday=1, ..., Saturday=6) 
            // to our dayKeys array (Monday=0, Tuesday=1, ..., Sunday=6)
            int index;
            if (dayOfWeek == 0) // Sunday
            {
                index = 6; // Sunday is last in our array
            }
            else if (dayOfWeek >= 1 && dayOfWeek <= 6) // Monday to Saturday
            {
                index = dayOfWeek - 1; // Monday (1) -> 0, Tuesday (2) -> 1, etc.
            }
            else
            {
                // Fallback: try to get enum name
                try
                {
                    var enumName = Enum.GetName(typeof(DayOfWeek), dayOfWeek);
                    var lowerName = enumName?.ToLowerInvariant() ?? string.Empty;
                    // Find the index in dayKeys array
                    for (int i = 0; i < dayKeys.Count; i++)
                    {
                        if (dayKeys[i] == lowerName)
                        {
                            return dayKeys[i];
                        }
                    }
                    return string.Empty;
                }
                catch
                {
                    return string.Empty;
                }
            }

            if (index >= 0 && index < dayKeys.Count)
            {
                return dayKeys[index];
            }

            return string.Empty;
        }

        private static string FormatTime(TimeSpan time)
        {
            var dateTime = DateTime.Today.Add(time);
            return dateTime.ToString("h:mm tt", CultureInfo.InvariantCulture);
        }

        public async Task<ArtistSubscriptionDto?> GetArtistSubscriptionAsync(Guid artistId)
        {
            var artist = await _artistRepository.GetArtistByIdAsync(artistId);
            if (artist == null)
            {
                return null;
            }

            // First try to get active subscription
            var subscription = await _userRepository.GetActiveSubscriptionByArtistIdAsync(artistId);
            
            // If no active subscription, get the latest subscription (including canceled ones)
            if (subscription == null)
            {
                subscription = artist.ArtistSubscriptions?
                    .OrderByDescending(s => s.CreatedAt)
                    .FirstOrDefault();
            }
            
            if (subscription == null)
            {
                return null;
            }

            return new ArtistSubscriptionDto
            {
                Id = subscription.Id.ToString(),
                PlanType = "pro",
                BillingCycle = subscription.BillingCycle ?? "monthly",
                Status = subscription.Status ?? "active",
                PaddleSubscriptionId = subscription.PaddleSubscriptionId,
                CurrentPeriodStart = subscription.CurrentPeriodStart,
                CurrentPeriodEnd = subscription.CurrentPeriodEnd,
                NextPaymentDate = subscription.CurrentPeriodEnd,
                TrialEndsAt = subscription.TrialEndsAt,
                MonthlyCost = subscription.MonthlyCost ?? 20.00m // Default to 20 EUR if not set
            };
        }

        public async Task<string?> GetCancelSubscriptionLinkAsync(Guid artistId)
        {
            var subscription = await _userRepository.GetActiveSubscriptionByArtistIdAsync(artistId);
            if (subscription == null || string.IsNullOrEmpty(subscription.PaddleSubscriptionId))
            {
                return null;
            }

            var paddleApiKey = Environment.GetEnvironmentVariable("PADDLE_API_KEY") 
                ?? _configuration["PaddleSettings:ApiKey"];
            var paddleEnvironment = Environment.GetEnvironmentVariable("PADDLE_ENVIRONMENT") 
                ?? _configuration["PaddleSettings:Environment"] 
                ?? "sandbox";

            var baseUrl = paddleEnvironment == "production" 
                ? "https://api.paddle.com" 
                : "https://sandbox-api.paddle.com";

            var httpClient = _httpClientFactory.CreateClient();
            httpClient.DefaultRequestHeaders.Add("Authorization", $"Bearer {paddleApiKey}");

            try
            {
                // Get subscription details to find customer portal links
                var getUrl = $"{baseUrl}/subscriptions/{subscription.PaddleSubscriptionId}";
                var response = await httpClient.GetAsync(getUrl);
                
                if (response.IsSuccessStatusCode)
                {
                    var subscriptionJson = await response.Content.ReadAsStringAsync();
                    var subscriptionDoc = JsonDocument.Parse(subscriptionJson);
                    var subscriptionData = subscriptionDoc.RootElement;

                    // Paddle returns customer_portal_urls in the subscription object
                    if (subscriptionData.TryGetProperty("customer_portal_urls", out var portalUrls))
                    {
                        if (portalUrls.TryGetProperty("cancel", out var cancelUrlElement))
                        {
                            var cancelUrl = cancelUrlElement.GetString();
                            if (!string.IsNullOrEmpty(cancelUrl))
                            {
                                _logger.LogInformation("Found customer portal cancel link for subscription {SubscriptionId}", subscription.PaddleSubscriptionId);
                                return cancelUrl;
                            }
                        }
                    }
                }
                else
                {
                    _logger.LogWarning("Failed to get subscription details from Paddle: {StatusCode}", response.StatusCode);
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching customer portal cancel link for subscription {SubscriptionId}", subscription.PaddleSubscriptionId);
            }

            // Fallback: construct customer portal URL manually
            var customerPortalBase = paddleEnvironment == "production"
                ? "https://my.paddle.com"
                : "https://sandbox-my.paddle.com";
            
            _logger.LogInformation("Using fallback customer portal URL for subscription {SubscriptionId}", subscription.PaddleSubscriptionId);
            return $"{customerPortalBase}/subscriptions/{subscription.PaddleSubscriptionId}";
        }

        public async Task<bool> CancelArtistSubscriptionAsync(Guid artistId)
        {
            var subscription = await _userRepository.GetActiveSubscriptionByArtistIdAsync(artistId);
            if (subscription == null)
            {
                _logger.LogWarning("No active subscription found for artist {ArtistId}", artistId);
                return false;
            }

            if (string.IsNullOrEmpty(subscription.PaddleSubscriptionId))
            {
                // Trial or manual subscription without Paddle ID - mark as cancelled in DB only
                _logger.LogInformation("Subscription for artist {ArtistId} has no PaddleSubscriptionId. Marking as cancelled locally.", artistId);
                subscription.Status = "cancelled";
                subscription.CancelledAt = DateTime.UtcNow;
                subscription.UpdatedAt = DateTime.UtcNow;
                await _userRepository.UpdateSubscriptionAsync(subscription);
                return true;
            }

            var paddleApiKey = Environment.GetEnvironmentVariable("PADDLE_API_KEY") 
                ?? _configuration["PaddleSettings:ApiKey"];
            var paddleEnvironment = Environment.GetEnvironmentVariable("PADDLE_ENVIRONMENT") 
                ?? _configuration["PaddleSettings:Environment"] 
                ?? "sandbox";

            // Log configuration source for debugging
            var hasEnvVar = !string.IsNullOrEmpty(Environment.GetEnvironmentVariable("PADDLE_API_KEY"));
            var hasConfig = !string.IsNullOrEmpty(_configuration["PaddleSettings:ApiKey"]);
            _logger.LogInformation("Paddle API key check - Environment variable: {HasEnvVar}, Config: {HasConfig}, Key length: {KeyLength}", 
                hasEnvVar, hasConfig, paddleApiKey?.Length ?? 0);

            if (string.IsNullOrEmpty(paddleApiKey))
            {
                _logger.LogError("Paddle API key not configured. Cannot cancel subscription for artist {ArtistId}. " +
                    "Please set PADDLE_API_KEY environment variable or configure PaddleSettings:ApiKey in appsettings.json", artistId);
                throw new InvalidOperationException("Paddle API key not configured. Please set PADDLE_API_KEY environment variable or configure PaddleSettings:ApiKey in appsettings.json");
            }

            var baseUrl = paddleEnvironment == "production" 
                ? "https://api.paddle.com" 
                : "https://sandbox-api.paddle.com";

            var httpClient = _httpClientFactory.CreateClient();
            httpClient.DefaultRequestHeaders.Add("Authorization", $"Bearer {paddleApiKey}");

            try
            {
                // Cancel subscription via Paddle API
                var cancelUrl = $"{baseUrl}/subscriptions/{subscription.PaddleSubscriptionId}/cancel";
                
                // Request body: cancel immediately
                var requestBody = new
                {
                    effective_from = "immediately"
                };

                var jsonContent = JsonSerializer.Serialize(requestBody);
                var content = new StringContent(jsonContent, Encoding.UTF8, "application/json");
                
                _logger.LogInformation("Cancelling Paddle subscription {SubscriptionId} for artist {ArtistId}", 
                    subscription.PaddleSubscriptionId, artistId);
                
                var response = await httpClient.PostAsync(cancelUrl, content);
                
                if (!response.IsSuccessStatusCode)
                {
                    var errorContent = await response.Content.ReadAsStringAsync();
                    _logger.LogError("Failed to cancel Paddle subscription {SubscriptionId} for artist {ArtistId}. Status: {StatusCode}, Error: {Error}", 
                        subscription.PaddleSubscriptionId, artistId, response.StatusCode, errorContent);
                    throw new HttpRequestException($"Failed to cancel subscription in Paddle: {response.StatusCode} - {errorContent}");
                }

                var responseContent = await response.Content.ReadAsStringAsync();
                _logger.LogInformation("Successfully cancelled Paddle subscription {SubscriptionId} for artist {ArtistId}. Response: {Response}", 
                    subscription.PaddleSubscriptionId, artistId, responseContent);

                // Update database after successful cancellation
            subscription.Status = "cancelled";
            subscription.CancelledAt = DateTime.UtcNow;
            subscription.UpdatedAt = DateTime.UtcNow;
            await _userRepository.UpdateSubscriptionAsync(subscription);
            
                _logger.LogInformation("Successfully cancelled subscription for artist {ArtistId} in both Paddle and database", artistId);
            return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error cancelling subscription for artist {ArtistId}", artistId);
                throw;
            }
        }

        public async Task<List<PaymentTransactionDto>> GetPaymentTransactionsAsync(Guid artistId)
        {
            // Get all subscriptions for the artist (including canceled ones)
            var artist = await _artistRepository.GetArtistByIdAsync(artistId);
            if (artist == null)
            {
                return new List<PaymentTransactionDto>();
            }

            // Get all subscriptions that have a PaddleSubscriptionId
            var subscriptions = artist.ArtistSubscriptions?
                .Where(s => !string.IsNullOrEmpty(s.PaddleSubscriptionId))
                .OrderByDescending(s => s.CreatedAt)
                .ToList() ?? new List<DomainModels.Models.ArtistSubscription>();
            
            if (subscriptions.Count == 0)
            {
                return new List<PaymentTransactionDto>();
            }

            var paddleApiKey = Environment.GetEnvironmentVariable("PADDLE_API_KEY") 
                ?? _configuration["PaddleSettings:ApiKey"];
            var paddleEnvironment = Environment.GetEnvironmentVariable("PADDLE_ENVIRONMENT") 
                ?? _configuration["PaddleSettings:Environment"] 
                ?? "sandbox";

            if (string.IsNullOrEmpty(paddleApiKey))
            {
                _logger.LogWarning("Paddle API key not configured. Creating fallback payment entries from subscription data.");
                // Create fallback payment entries even without API key
                var fallbackTransactions = new List<PaymentTransactionDto>();
                foreach (var subscription in subscriptions.Where(s => s.Status == "active" && !string.IsNullOrEmpty(s.PaddleSubscriptionId)))
                {
                    var subscriptionType = subscription.BillingCycle?.Contains("year", StringComparison.OrdinalIgnoreCase) == true ? "yearly" : "monthly";
                    var amount = subscription.MonthlyCost ?? 20.00m;
                    fallbackTransactions.Add(new PaymentTransactionDto
                    {
                        Id = subscription.PaddleSubscriptionId,
                        TransactionId = subscription.PaddleSubscriptionId,
                        Amount = amount,
                        Currency = "EUR",
                        Status = "success",
                        Date = subscription.CurrentPeriodStart,
                        SubscriptionType = subscriptionType,
                        PaymentMethod = "card",
                        Description = $"Pro {subscriptionType} subscription",
                        ReceiptUrl = null
                    });
                }
                return fallbackTransactions.OrderByDescending(t => t.Date).ToList();
            }

            var baseUrl = paddleEnvironment == "production" 
                ? "https://api.paddle.com" 
                : "https://sandbox-api.paddle.com";

            var httpClient = _httpClientFactory.CreateClient();
            httpClient.DefaultRequestHeaders.Add("Authorization", $"Bearer {paddleApiKey}");

            var allTransactions = new List<PaymentTransactionDto>();
            var processedTransactionIds = new HashSet<string>();

            // Fetch transactions for each subscription
            foreach (var subscription in subscriptions)
            {
                try
                {
                    var subscriptionTransactions = await FetchTransactionsForSubscriptionAsync(
                        subscription, 
                        httpClient, 
                        baseUrl, 
                        artistId);
                    
                    // Add transactions, avoiding duplicates by transactionId
                    foreach (var transaction in subscriptionTransactions)
                    {
                        if (!string.IsNullOrEmpty(transaction.TransactionId) && 
                            !processedTransactionIds.Contains(transaction.TransactionId))
                        {
                            allTransactions.Add(transaction);
                            processedTransactionIds.Add(transaction.TransactionId);
                        }
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(ex, "Failed to fetch transactions for subscription {SubscriptionId} for artist {ArtistId}", 
                        subscription.PaddleSubscriptionId, artistId);
                    // Continue with other subscriptions
                }
            }

            // Sort by date descending (most recent first)
            var orderedTransactions = allTransactions.OrderByDescending(t => t.Date).ToList();
            
            _logger.LogInformation("Returning {Count} payment transactions for artist {ArtistId} from {SubscriptionCount} subscriptions", 
                orderedTransactions.Count, artistId, subscriptions.Count);
            
            return orderedTransactions;
        }

        private async Task<List<PaymentTransactionDto>> FetchTransactionsForSubscriptionAsync(
            DomainModels.Models.ArtistSubscription subscription,
            HttpClient httpClient,
            string baseUrl,
            Guid artistId)
        {
            var transactions = new List<PaymentTransactionDto>();
            
            // Initialize with fallback values
            decimal subscriptionAmount = subscription.MonthlyCost ?? 20.00m;
            string currency = "EUR";

            try
            {
                // Step 1: Get subscription details to extract price information
                var subscriptionUrl = $"{baseUrl}/subscriptions/{subscription.PaddleSubscriptionId}";
                _logger.LogInformation("Fetching subscription details from Paddle: {Url}", subscriptionUrl);
                var subscriptionResponse = await httpClient.GetAsync(subscriptionUrl);
                
                if (subscriptionResponse.IsSuccessStatusCode)
                {
                    var subscriptionJson = await subscriptionResponse.Content.ReadAsStringAsync();
                    var subscriptionDoc = JsonDocument.Parse(subscriptionJson);
                    var subscriptionData = subscriptionDoc.RootElement;
                    
                    // Extract amount from subscription items
                    if (subscriptionData.TryGetProperty("items", out var subscriptionItems))
                    {
                        if (subscriptionItems.ValueKind == JsonValueKind.Array && subscriptionItems.GetArrayLength() > 0)
                        {
                            var firstItem = subscriptionItems[0];
                            if (firstItem.TryGetProperty("price", out var priceElement))
                            {
                                if (priceElement.TryGetProperty("unit_price", out var unitPriceElement))
                                {
                                    if (unitPriceElement.TryGetProperty("amount", out var amountElement))
                                    {
                                        if (amountElement.ValueKind == JsonValueKind.String)
                                        {
                                            var amountStr = amountElement.GetString();
                                            if (!string.IsNullOrEmpty(amountStr) && decimal.TryParse(amountStr, out var amountValue))
                                            {
                                                subscriptionAmount = amountValue / 100; // Convert from cents
                                            }
                                        }
                                        else if (amountElement.ValueKind == JsonValueKind.Number)
                                        {
                                            subscriptionAmount = amountElement.GetDecimal() / 100;
                                        }
                                    }
                                }
                            }
                        }
                    }
                    
                    // Get currency from subscription
                    if (subscriptionData.TryGetProperty("currency_code", out var currencyElement))
                    {
                        currency = currencyElement.GetString() ?? "EUR";
                    }
                }
                
                // Step 2: Get transactions for this subscription
                var transactionsUrl = $"{baseUrl}/transactions?subscription_id={subscription.PaddleSubscriptionId}";
                _logger.LogInformation("Fetching transactions from Paddle: {Url}", transactionsUrl);
                var response = await httpClient.GetAsync(transactionsUrl);
                
                if (response.IsSuccessStatusCode)
                {
                    var transactionsJson = await response.Content.ReadAsStringAsync();
                    var transactionsDoc = JsonDocument.Parse(transactionsJson);
                    var transactionsData = transactionsDoc.RootElement;

                    // Paddle returns transactions in a "data" array
                    if (transactionsData.TryGetProperty("data", out var dataArray))
                    {
                        _logger.LogInformation("Found {Count} transactions in Paddle response for subscription {SubscriptionId}", 
                            dataArray.GetArrayLength(), subscription.PaddleSubscriptionId);
                        
                        foreach (var transaction in dataArray.EnumerateArray())
                        {
                            var transactionId = transaction.TryGetProperty("id", out var idElement) ? idElement.GetString() : null;
                            var status = transaction.TryGetProperty("status", out var statusElement) ? statusElement.GetString() : "completed";
                            var createdAt = transaction.TryGetProperty("created_at", out var createdAtElement) 
                                ? DateTime.Parse(createdAtElement.GetString() ?? DateTime.UtcNow.ToString()) 
                                : DateTime.UtcNow;
                            
                            // Get amount - Paddle amounts can be in different formats
                            decimal amount = 0;
                            string transactionCurrency = currency;
                            
                            // Try totals.total first (most common)
                            if (transaction.TryGetProperty("totals", out var totals))
                            {
                                if (totals.TryGetProperty("total", out var totalElement))
                                {
                                    if (totalElement.ValueKind == JsonValueKind.String)
                                    {
                                        var totalStr = totalElement.GetString();
                                        if (!string.IsNullOrEmpty(totalStr) && decimal.TryParse(totalStr, out var totalValue))
                                        {
                                            amount = totalValue / 100;
                                        }
                                    }
                                    else if (totalElement.ValueKind == JsonValueKind.Number)
                                    {
                                        amount = totalElement.GetDecimal() / 100;
                                    }
                                }
                                
                                // Also try totals.grand_total as fallback
                                if (amount == 0 && totals.TryGetProperty("grand_total", out var grandTotalElement))
                                {
                                    if (grandTotalElement.ValueKind == JsonValueKind.String)
                                    {
                                        var grandTotalStr = grandTotalElement.GetString();
                                        if (!string.IsNullOrEmpty(grandTotalStr) && decimal.TryParse(grandTotalStr, out var grandTotalValue))
                                        {
                                            amount = grandTotalValue / 100;
                                        }
                                    }
                                    else if (grandTotalElement.ValueKind == JsonValueKind.Number)
                                    {
                                        amount = grandTotalElement.GetDecimal() / 100;
                                    }
                                }
                                
                                if (totals.TryGetProperty("currency_code", out var currencyElement))
                                {
                                    transactionCurrency = currencyElement.GetString() ?? currency;
                                }
                            }
                            
                            // Fallback: try to get amount from items if totals didn't work
                            if (amount == 0 && transaction.TryGetProperty("items", out var items))
                            {
                                if (items.ValueKind == JsonValueKind.Array && items.GetArrayLength() > 0)
                                {
                                    var firstItem = items[0];
                                    if (firstItem.TryGetProperty("price", out var price))
                                    {
                                        if (price.TryGetProperty("unit_price", out var unitPrice))
                                        {
                                            if (unitPrice.TryGetProperty("amount", out var amountElement))
                                            {
                                                if (amountElement.ValueKind == JsonValueKind.String)
                                                {
                                                    var amountStr = amountElement.GetString();
                                                    if (!string.IsNullOrEmpty(amountStr) && decimal.TryParse(amountStr, out var amountValue))
                                                    {
                                                        amount = amountValue / 100;
                                                    }
                                                }
                                                else if (amountElement.ValueKind == JsonValueKind.Number)
                                                {
                                                    amount = amountElement.GetDecimal() / 100;
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                            
                            // Final fallback: use subscription amount
                            if (amount == 0)
                            {
                                amount = subscriptionAmount;
                            }
                            
                            if (string.IsNullOrEmpty(transactionCurrency))
                            {
                                transactionCurrency = currency;
                            }

                            // Get payment method
                            string? paymentMethod = null;
                            if (transaction.TryGetProperty("payment_method", out var paymentMethodElement))
                            {
                                if (paymentMethodElement.TryGetProperty("type", out var typeElement))
                                {
                                    paymentMethod = typeElement.GetString();
                                }
                            }

                            // Get receipt URL
                            string? receiptUrl = null;
                            if (transaction.TryGetProperty("receipt_url", out var receiptUrlElement))
                            {
                                receiptUrl = receiptUrlElement.GetString();
                            }

                            // Determine subscription type from billing cycle
                            var subscriptionType = subscription.BillingCycle?.Contains("year", StringComparison.OrdinalIgnoreCase) == true ? "yearly" : "monthly";

                            transactions.Add(new PaymentTransactionDto
                            {
                                Id = transactionId ?? Guid.NewGuid().ToString(),
                                TransactionId = transactionId ?? "",
                                Amount = amount,
                                Currency = transactionCurrency,
                                Status = status == "completed" ? "success" : "failed",
                                Date = createdAt,
                                SubscriptionType = subscriptionType,
                                PaymentMethod = paymentMethod ?? "card",
                                Description = $"Pro {subscriptionType} subscription",
                                ReceiptUrl = receiptUrl
                            });
                        }
                    }
                }
                else
                {
                    var errorContent = await response.Content.ReadAsStringAsync();
                    _logger.LogWarning("Failed to get Paddle transactions for subscription {SubscriptionId}: {StatusCode} - {Error}", 
                        subscription.PaddleSubscriptionId, response.StatusCode, errorContent);
                }
                
                // If no transactions found from Paddle and subscription is active, create one from subscription data
                if (transactions.Count == 0 && subscription.Status == "active" && !string.IsNullOrEmpty(subscription.PaddleSubscriptionId))
                {
                    _logger.LogInformation("No Paddle transactions found, creating payment entry from subscription data for subscription {SubscriptionId}", 
                        subscription.PaddleSubscriptionId);
                    
                    var subscriptionType = subscription.BillingCycle?.Contains("year", StringComparison.OrdinalIgnoreCase) == true ? "yearly" : "monthly";
                    
                    transactions.Add(new PaymentTransactionDto
                    {
                        Id = subscription.PaddleSubscriptionId,
                        TransactionId = subscription.PaddleSubscriptionId,
                        Amount = subscriptionAmount,
                        Currency = currency,
                        Status = "success",
                        Date = subscription.CurrentPeriodStart,
                        SubscriptionType = subscriptionType,
                        PaymentMethod = "card",
                        Description = $"Pro {subscriptionType} subscription",
                        ReceiptUrl = null
                    });
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching transactions for subscription {SubscriptionId}", subscription.PaddleSubscriptionId);
                
                // Fallback: create payment entry from subscription if active
                if (subscription.Status == "active" && !string.IsNullOrEmpty(subscription.PaddleSubscriptionId))
                {
                    var subscriptionType = subscription.BillingCycle?.Contains("year", StringComparison.OrdinalIgnoreCase) == true ? "yearly" : "monthly";
                    
                    transactions.Add(new PaymentTransactionDto
                    {
                        Id = subscription.PaddleSubscriptionId,
                        TransactionId = subscription.PaddleSubscriptionId,
                        Amount = subscription.MonthlyCost ?? 20.00m,
                        Currency = "EUR",
                        Status = "success",
                        Date = subscription.CurrentPeriodStart,
                        SubscriptionType = subscriptionType,
                        PaymentMethod = "card",
                        Description = $"Pro {subscriptionType} subscription",
                        ReceiptUrl = null
                    });
                }
            }
            
            return transactions;
        }

        public async Task<string?> ReactivateArtistSubscriptionAsync(Guid artistId)
        {
            // First try to get active subscription (shouldn't be active if we're reactivating)
            var subscription = await _userRepository.GetActiveSubscriptionByArtistIdAsync(artistId);
            
            // If no active subscription, try to get the latest subscription (including canceled ones)
            if (subscription == null)
            {
                var artist = await _artistRepository.GetArtistByIdAsync(artistId);
                if (artist == null)
                {
                    _logger.LogWarning("Artist not found for artist {ArtistId}", artistId);
                    return null;
                }

                // Get the latest subscription regardless of status
                subscription = artist.ArtistSubscriptions?
                    .OrderByDescending(s => s.CreatedAt)
                    .FirstOrDefault();
            }

            if (subscription == null || string.IsNullOrEmpty(subscription.PaddleSubscriptionId))
            {
                _logger.LogWarning("No subscription found for artist {ArtistId}", artistId);
                return null;
            }

            // Check if subscription is canceled
            if (subscription.Status != "cancelled" && subscription.Status != "canceled")
            {
                _logger.LogWarning("Subscription for artist {ArtistId} is not cancelled. Status: {Status}", artistId, subscription.Status);
                return null;
            }

            var paddleApiKey = Environment.GetEnvironmentVariable("PADDLE_API_KEY") 
                ?? _configuration["PaddleSettings:ApiKey"];
            var paddleEnvironment = Environment.GetEnvironmentVariable("PADDLE_ENVIRONMENT") 
                ?? _configuration["PaddleSettings:Environment"] 
                ?? "sandbox";

            if (string.IsNullOrEmpty(paddleApiKey))
            {
                _logger.LogError("Paddle API key not configured. Cannot reactivate subscription for artist {ArtistId}", artistId);
                throw new InvalidOperationException("Paddle API key not configured");
            }

            var baseUrl = paddleEnvironment == "production" 
                ? "https://api.paddle.com" 
                : "https://sandbox-api.paddle.com";

            var httpClient = _httpClientFactory.CreateClient();
            httpClient.DefaultRequestHeaders.Add("Authorization", $"Bearer {paddleApiKey}");

            try
            {
                // Step 1: Get the canceled subscription details from Paddle
                var subscriptionUrl = $"{baseUrl}/subscriptions/{subscription.PaddleSubscriptionId}";
                _logger.LogInformation("Fetching canceled subscription details from Paddle: {Url}", subscriptionUrl);
                var subscriptionResponse = await httpClient.GetAsync(subscriptionUrl);
                
                if (!subscriptionResponse.IsSuccessStatusCode)
                {
                    var errorContent = await subscriptionResponse.Content.ReadAsStringAsync();
                    _logger.LogError("Failed to get canceled subscription from Paddle: {StatusCode} - {Error}", 
                        subscriptionResponse.StatusCode, errorContent);
                    throw new HttpRequestException($"Failed to get subscription from Paddle: {subscriptionResponse.StatusCode}");
                }

                var subscriptionJson = await subscriptionResponse.Content.ReadAsStringAsync();
                _logger.LogInformation("Paddle subscription API response: {Response}", subscriptionJson);
                var subscriptionDoc = JsonDocument.Parse(subscriptionJson);
                var subscriptionData = subscriptionDoc.RootElement;

                // Step 2: Extract necessary data from canceled subscription
                var customerId = subscriptionData.TryGetProperty("customer_id", out var customerIdElement) 
                    ? customerIdElement.GetString() 
                    : subscription.PaddleCustomerId;
                
                if (string.IsNullOrEmpty(customerId))
                {
                    _logger.LogError("Customer ID not found in canceled subscription for artist {ArtistId}", artistId);
                    throw new InvalidOperationException("Customer ID not found in subscription");
                }

                // Extract items (price IDs and quantities)
                var items = new List<object>();
                if (subscriptionData.TryGetProperty("items", out var itemsElement))
                {
                    _logger.LogInformation("Found items property in subscription response. Type: {ValueKind}", itemsElement.ValueKind);
                    
                    if (itemsElement.ValueKind == JsonValueKind.Array)
                    {
                        var itemsArray = itemsElement.EnumerateArray().ToList();
                        _logger.LogInformation("Items array has {Count} elements", itemsArray.Count);
                        
                        foreach (var item in itemsArray)
                        {
                            _logger.LogInformation("Processing item: {ItemJson}", item.GetRawText());
                            
                            if (item.TryGetProperty("price", out var priceElement))
                            {
                                _logger.LogInformation("Found price property in item");
                                
                                if (priceElement.TryGetProperty("id", out var priceIdElement))
                                {
                                    var priceId = priceIdElement.GetString();
                                    var quantity = item.TryGetProperty("quantity", out var quantityElement) 
                                        ? quantityElement.GetInt32() 
                                        : 1;
                                    
                                    _logger.LogInformation("Extracted price ID: {PriceId}, quantity: {Quantity}", priceId, quantity);
                                    
                                    if (!string.IsNullOrEmpty(priceId))
                                    {
                                        items.Add(new
                                        {
                                            price_id = priceId,
                                            quantity = quantity
                                        });
                                    }
                                }
                                else
                                {
                                    _logger.LogWarning("Price ID not found in price element");
                                }
                            }
                            else
                            {
                                _logger.LogWarning("Price property not found in item");
                            }
                        }
                    }
                    else
                    {
                        _logger.LogWarning("Items element is not an array. Type: {ValueKind}", itemsElement.ValueKind);
                    }
                }
                else
                {
                    _logger.LogWarning("Items property not found in subscription response. Available properties: {Properties}", 
                        string.Join(", ", subscriptionData.EnumerateObject().Select(p => p.Name)));
                }

                // Fallback: If no items found, try to get price ID from the subscription's current items or use a default
                if (items.Count == 0)
                {
                    _logger.LogWarning("No items found in canceled subscription. Attempting fallback methods.");
                    
                    // Try to get price ID from data.items[0].price.id path directly
                    if (subscriptionData.TryGetProperty("data", out var subscriptionDataElement))
                    {
                        if (subscriptionDataElement.TryGetProperty("items", out var dataItemsElement))
                        {
                            if (dataItemsElement.ValueKind == JsonValueKind.Array && dataItemsElement.GetArrayLength() > 0)
                            {
                                var firstItem = dataItemsElement[0];
                                if (firstItem.TryGetProperty("price", out var fallbackPriceElement))
                                {
                                    if (fallbackPriceElement.TryGetProperty("id", out var fallbackPriceIdElement))
                                    {
                                        var fallbackPriceId = fallbackPriceIdElement.GetString();
                                        if (!string.IsNullOrEmpty(fallbackPriceId))
                                        {
                                            _logger.LogInformation("Using fallback price ID from data.items: {PriceId}", fallbackPriceId);
                                            items.Add(new
                                            {
                                                price_id = fallbackPriceId,
                                                quantity = 1
                                            });
                                        }
                                    }
                                }
                            }
                        }
                    }
                    
                    // If still no items, try to determine price ID from billing cycle
                    if (items.Count == 0)
                    {
                        _logger.LogWarning("Still no items found. Attempting to determine price ID from billing cycle.");
                        
                        // Get billing cycle from subscription - it might be JSON or a string
                        var billingCycleStr = subscription.BillingCycle ?? "monthly";
                        bool isYearly = false;
                        
                        // Parse billing cycle - it might be JSON like {"interval":"month","frequency":1}
                        if (billingCycleStr.StartsWith("{") && billingCycleStr.Contains("interval"))
                        {
                            try
                            {
                                var billingCycleDoc = JsonDocument.Parse(billingCycleStr);
                                if (billingCycleDoc.RootElement.TryGetProperty("interval", out var intervalElement))
                                {
                                    var interval = intervalElement.GetString();
                                    isYearly = interval?.Contains("year", StringComparison.OrdinalIgnoreCase) == true;
                                }
                            }
                            catch
                            {
                                // If parsing fails, check if string contains "year"
                                isYearly = billingCycleStr.Contains("year", StringComparison.OrdinalIgnoreCase);
                            }
                        }
                        else
                        {
                            isYearly = billingCycleStr.Contains("year", StringComparison.OrdinalIgnoreCase);
                        }
                        
                        // Also check billing cycle from Paddle API response
                        if (!isYearly && subscriptionData.TryGetProperty("billing_cycle", out var billingCycleElement))
                        {
                            if (billingCycleElement.ValueKind == JsonValueKind.Object)
                            {
                                if (billingCycleElement.TryGetProperty("interval", out var intervalElement))
                                {
                                    var interval = intervalElement.GetString();
                                    isYearly = interval?.Contains("year", StringComparison.OrdinalIgnoreCase) == true;
                                }
                            }
                            else if (billingCycleElement.ValueKind == JsonValueKind.String)
                            {
                                var interval = billingCycleElement.GetString();
                                isYearly = interval?.Contains("year", StringComparison.OrdinalIgnoreCase) == true;
                            }
                        }
                        
                        // Try to get price IDs from configuration
                        var monthlyPriceId = _configuration["PaddleSettings:ProMonthlyPriceId"];
                        var yearlyPriceId = _configuration["PaddleSettings:ProYearlyPriceId"];
                        
                        // Fallback to hardcoded price IDs if not in config (sandbox)
                        if (string.IsNullOrEmpty(monthlyPriceId))
                        {
                            monthlyPriceId = "pri_01kaxzdn2h47y0j4ej9e00mx8z"; // Pro Monthly
                        }
                        if (string.IsNullOrEmpty(yearlyPriceId))
                        {
                            yearlyPriceId = "pri_01kaxzfde9hzpeq0dtssmsp4ck"; // Pro Yearly
                        }
                        
                        var priceIdToUse = isYearly ? yearlyPriceId : monthlyPriceId;
                        
                        if (!string.IsNullOrEmpty(priceIdToUse))
                        {
                            _logger.LogInformation("Using price ID from billing cycle: {PriceId} (billing cycle: {BillingCycle}, isYearly: {IsYearly})", 
                                priceIdToUse, billingCycleStr, isYearly);
                            items.Add(new
                            {
                                price_id = priceIdToUse,
                                quantity = 1
                            });
                        }
                        else
                        {
                            _logger.LogError("No price ID available for billing cycle: {BillingCycle}", billingCycleStr);
                            throw new InvalidOperationException("No items found in canceled subscription and unable to determine price ID. Please contact support to reactivate your subscription.");
                        }
                    }
                }

                // Extract other details
                var currencyCode = subscriptionData.TryGetProperty("currency_code", out var currencyElement) 
                    ? currencyElement.GetString() 
                    : "EUR";
                
                var addressId = subscriptionData.TryGetProperty("address_id", out var addressIdElement) 
                    ? addressIdElement.GetString() 
                    : null;
                
                var businessId = subscriptionData.TryGetProperty("business_id", out var businessIdElement) 
                    ? businessIdElement.GetString() 
                    : null;

                // Get user details for custom data
                var artist = await _artistRepository.GetArtistByIdAsync(artistId);
                if (artist == null || artist.User == null)
                {
                    _logger.LogError("Artist or user not found for artist {ArtistId}", artistId);
                    throw new InvalidOperationException("Artist or user not found");
                }

                // Step 3: Create a new transaction
                var transactionRequest = new
                {
                    items = items,
                    customer_id = customerId,
                    currency_code = currencyCode,
                    address_id = addressId,
                    business_id = businessId,
                    custom_data = new
                    {
                        userId = artist.User.Id.ToString(),
                        artistId = artistId.ToString(),
                        userType = "artist"
                    }
                };

                var transactionRequestJson = JsonSerializer.Serialize(transactionRequest);
                var transactionContent = new StringContent(transactionRequestJson, Encoding.UTF8, "application/json");
                
                _logger.LogInformation("Creating new transaction for reactivation. Request: {Request}", transactionRequestJson);
                
                var transactionUrl = $"{baseUrl}/transactions";
                var transactionResponse = await httpClient.PostAsync(transactionUrl, transactionContent);
                
                if (!transactionResponse.IsSuccessStatusCode)
                {
                    var errorContent = await transactionResponse.Content.ReadAsStringAsync();
                    _logger.LogError("Failed to create transaction for reactivation: {StatusCode} - {Error}", 
                        transactionResponse.StatusCode, errorContent);
                    throw new HttpRequestException($"Failed to create transaction: {transactionResponse.StatusCode} - {errorContent}");
                }

                var transactionJson = await transactionResponse.Content.ReadAsStringAsync();
                _logger.LogInformation("Transaction created successfully: {Response}", transactionJson);
                var transactionDoc = JsonDocument.Parse(transactionJson);
                var transactionData = transactionDoc.RootElement;
                
                // Log all available properties for debugging
                var rootProperties = transactionDoc.RootElement.EnumerateObject().Select(p => p.Name).ToList();
                _logger.LogInformation("Root level properties in transaction response: {Properties}", string.Join(", ", rootProperties));

                // Step 4: Get checkout URL from transaction
                // Paddle API responses can have different structures, so we try multiple paths
                string? checkoutUrl = null;
                string? transactionId = null;
                JsonElement actualTransactionData = transactionData;

                // Try to get transaction ID first (needed for fallback URL construction)
                // Check if response is wrapped in "data"
                if (transactionData.TryGetProperty("data", out var dataElement))
                {
                    actualTransactionData = dataElement;
                    if (dataElement.TryGetProperty("id", out var dataIdElement))
                    {
                        transactionId = dataIdElement.GetString();
                    }
                }
                
                // Also check root level for ID
                if (string.IsNullOrEmpty(transactionId) && transactionData.TryGetProperty("id", out var idElement))
                {
                    transactionId = idElement.GetString();
                }
                
                // Also check actualTransactionData for ID
                if (string.IsNullOrEmpty(transactionId) && actualTransactionData.TryGetProperty("id", out var actualIdElement))
                {
                    transactionId = actualIdElement.GetString();
                }

                // Try multiple paths for checkout URL
                // Path 1: checkout.url (direct from root)
                if (transactionDoc.RootElement.TryGetProperty("checkout", out var rootCheckoutElement))
                {
                    if (rootCheckoutElement.TryGetProperty("url", out var rootCheckoutUrlElement))
                    {
                        checkoutUrl = rootCheckoutUrlElement.GetString();
                        _logger.LogInformation("Found checkout URL at root checkout.url: {CheckoutUrl}", checkoutUrl);
                    }
                }

                // Path 2: checkout.url (from actualTransactionData)
                if (string.IsNullOrEmpty(checkoutUrl) && actualTransactionData.TryGetProperty("checkout", out var checkoutElement))
                {
                    if (checkoutElement.TryGetProperty("url", out var checkoutUrlElement))
                    {
                        checkoutUrl = checkoutUrlElement.GetString();
                        _logger.LogInformation("Found checkout URL at transactionData.checkout.url: {CheckoutUrl}", checkoutUrl);
                    }
                }

                // Path 3: checkout_url (snake_case from root)
                if (string.IsNullOrEmpty(checkoutUrl) && transactionDoc.RootElement.TryGetProperty("checkout_url", out var rootCheckoutUrlDirectElement))
                {
                    checkoutUrl = rootCheckoutUrlDirectElement.GetString();
                    _logger.LogInformation("Found checkout URL at root checkout_url: {CheckoutUrl}", checkoutUrl);
                }

                // Path 4: checkout_url (snake_case from actualTransactionData)
                if (string.IsNullOrEmpty(checkoutUrl) && actualTransactionData.TryGetProperty("checkout_url", out var checkoutUrlDirectElement))
                {
                    checkoutUrl = checkoutUrlDirectElement.GetString();
                    _logger.LogInformation("Found checkout URL at transactionData.checkout_url: {CheckoutUrl}", checkoutUrl);
                }

                // Path 5: data.checkout.url (nested in data)
                if (string.IsNullOrEmpty(checkoutUrl) && transactionDoc.RootElement.TryGetProperty("data", out var rootDataElement))
                {
                    if (rootDataElement.TryGetProperty("checkout", out var nestedCheckoutElement))
                    {
                        if (nestedCheckoutElement.TryGetProperty("url", out var nestedCheckoutUrlElement))
                        {
                            checkoutUrl = nestedCheckoutUrlElement.GetString();
                            _logger.LogInformation("Found checkout URL at data.checkout.url: {CheckoutUrl}", checkoutUrl);
                        }
                    }
                }

                // Fallback: construct checkout URL manually using transaction ID
                if (string.IsNullOrEmpty(checkoutUrl) && !string.IsNullOrEmpty(transactionId))
                {
                    _logger.LogWarning("No checkout URL found in transaction response. Constructing from transaction ID: {TransactionId}", transactionId);
                    // Paddle checkout URLs are typically in the format: https://pay.paddle.com/checkout/{transaction_id}
                    var checkoutBase = paddleEnvironment == "production" 
                        ? "https://pay.paddle.com" 
                        : "https://sandbox-checkout.paddle.com";
                    checkoutUrl = $"{checkoutBase}/checkout/{transactionId}";
                    _logger.LogInformation("Constructed checkout URL: {CheckoutUrl}", checkoutUrl);
                }

                if (string.IsNullOrEmpty(checkoutUrl))
                {
                    // Log all properties at each level for debugging
                    _logger.LogError("Could not determine checkout URL for reactivation. Transaction ID: {TransactionId}", transactionId ?? "null");
                    _logger.LogError("Transaction response structure: {Response}", transactionJson);
                    
                    // Try to log nested structure
                    if (transactionDoc.RootElement.TryGetProperty("data", out var debugDataElement))
                    {
                        var dataProperties = debugDataElement.EnumerateObject().Select(p => p.Name).ToList();
                        _logger.LogError("Data level properties: {Properties}", string.Join(", ", dataProperties));
                    }
                    
                    throw new InvalidOperationException("Could not determine checkout URL");
                }

                _logger.LogInformation("Successfully created reactivation checkout URL for artist {ArtistId}: {CheckoutUrl}", 
                    artistId, checkoutUrl);
                
                return checkoutUrl;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error reactivating subscription for artist {ArtistId}", artistId);
                throw;
            }
        }

        public async Task<bool> DeleteAccountPermanentlyAsync(Guid artistId)
        {
            try
            {
                // Get the artist with user
                var artist = await _artistRepository.GetArtistByIdAsync(artistId);
                if (artist == null || artist.UserId == null)
                {
                    _logger.LogWarning($"Artist {artistId} not found for account deletion");
                    return false;
                }

                var userId = artist.UserId;
                var today = DateTime.UtcNow.Date;

                // Get all upcoming confirmed bookings
                // First get all bookings to identify upcoming ones
                var allBookings = await _bookingRepository.GetBookingsForArtistAsync(artistId, null);
                var upcomingBookings = allBookings
                    .Where(b => b.Status == "confirmed" && 
                                (b.BookingDate > today || 
                                 (b.BookingDate == today && b.BookingTime >= DateTime.UtcNow.TimeOfDay)))
                    .ToList();
                
                // Reload bookings with tracking for updates
                var bookingsToCancel = new List<DomainBooking>();
                foreach (var booking in upcomingBookings)
                {
                    var bookingWithTracking = await _bookingRepository.GetBookingByIdAsync(booking.Id);
                    if (bookingWithTracking != null)
                    {
                        bookingsToCancel.Add(bookingWithTracking);
                    }
                }

                _logger.LogInformation($"Found {upcomingBookings.Count} upcoming bookings for artist {artistId}");

                // Cancel all upcoming bookings and send notifications
                var clientIds = new HashSet<Guid>();
                foreach (var booking in bookingsToCancel)
                {
                    booking.Status = "cancelled";
                    booking.CancelledAt = DateTime.UtcNow;
                    booking.CancellationReason = "Artist account deleted";
                    await _bookingRepository.UpdateBookingAsync(booking);

                    // Collect unique client IDs for notifications
                    if (booking.ClientId != Guid.Empty)
                    {
                        clientIds.Add(booking.ClientId);
                    }
                }

                // Send push notifications to all affected clients
                if (clientIds.Any())
                {
                    var clientIdList = clientIds.ToList();
                    var artistName = !string.IsNullOrWhiteSpace(artist.BusinessName) 
                        ? artist.BusinessName 
                        : artist.User?.FullName ?? "The artist";

                    var title = "Appointment Cancelled";
                    var body = $"Your appointment with {artistName} has been cancelled as the artist's account has been deleted.";

                    try
                    {
                        await _notificationService.SendNotificationToMultipleUsersAsync(
                            clientIdList,
                            title,
                            body,
                            new Dictionary<string, string>
                            {
                                { "type", "booking_cancelled" },
                                { "artistId", artistId.ToString() }
                            }
                        );
                        _logger.LogInformation($"Sent cancellation notifications to {clientIdList.Count} clients");
                    }
                    catch (Exception ex)
                    {
                        _logger.LogError(ex, $"Failed to send notifications to clients, but continuing with account deletion");
                    }
                }

                // Manually delete all related records before deleting the artist
                // This avoids cascade delete issues
                
                // 1. Delete ArtistSubscriptions
                var subscriptions = await _context.ArtistSubscriptions
                    .Where(s => s.ArtistId == artistId)
                    .ToListAsync();
                if (subscriptions.Any())
                {
                    _context.ArtistSubscriptions.RemoveRange(subscriptions);
                    _logger.LogInformation($"Deleting {subscriptions.Count} artist subscriptions");
                }

                // 2. Delete SalonMemberships
                var memberships = await _context.SalonMemberships
                    .Where(m => m.ArtistId == artistId)
                    .ToListAsync();
                if (memberships.Any())
                {
                    _context.SalonMemberships.RemoveRange(memberships);
                    _logger.LogInformation($"Deleting {memberships.Count} salon memberships");
                }

                // 3. Delete Services
                var services = await _context.Services
                    .Where(s => s.ArtistId == artistId)
                    .ToListAsync();
                if (services.Any())
                {
                    _context.Services.RemoveRange(services);
                    _logger.LogInformation($"Deleting {services.Count} services");
                }

                // 4. Delete PortfolioImages
                var portfolioImages = await _context.PortfolioImages
                    .Where(p => p.ArtistId == artistId)
                    .ToListAsync();
                if (portfolioImages.Any())
                {
                    _context.PortfolioImages.RemoveRange(portfolioImages);
                    _logger.LogInformation($"Deleting {portfolioImages.Count} portfolio images");
                }

                // 5. Delete WorkingHours
                var workingHours = await _context.WorkingHours
                    .Where(w => w.ArtistId == artistId)
                    .ToListAsync();
                if (workingHours.Any())
                {
                    _context.WorkingHours.RemoveRange(workingHours);
                    _logger.LogInformation($"Deleting {workingHours.Count} working hours");
                }

                // 6. Delete Reviews
                var reviews = await _context.Reviews
                    .Where(r => r.ArtistId == artistId)
                    .ToListAsync();
                if (reviews.Any())
                {
                    _context.Reviews.RemoveRange(reviews);
                    _logger.LogInformation($"Deleting {reviews.Count} reviews");
                }

                // 7. Delete Holidays
                var holidays = await _context.Holidays
                    .Where(h => h.ArtistId == artistId)
                    .ToListAsync();
                if (holidays.Any())
                {
                    _context.Holidays.RemoveRange(holidays);
                    _logger.LogInformation($"Deleting {holidays.Count} holidays");
                }

                // 8. Delete BlockedClients
                var blockedClients = await _context.BlockedClients
                    .Where(b => b.ArtistId == artistId)
                    .ToListAsync();
                if (blockedClients.Any())
                {
                    _context.BlockedClients.RemoveRange(blockedClients);
                    _logger.LogInformation($"Deleting {blockedClients.Count} blocked clients");
                }

                // 9. Delete AnalyticsEvents
                var analyticsEvents = await _context.AnalyticsEvents
                    .Where(a => a.ArtistId == artistId)
                    .ToListAsync();
                if (analyticsEvents.Any())
                {
                    _context.AnalyticsEvents.RemoveRange(analyticsEvents);
                    _logger.LogInformation($"Deleting {analyticsEvents.Count} analytics events");
                }

                // 10. Delete all Bookings (not just upcoming ones)
                var allBookingsToDelete = await _context.Bookings
                    .Where(b => b.ArtistId == artistId)
                    .ToListAsync();
                if (allBookingsToDelete.Any())
                {
                    // Delete BookingServices first (many-to-many relationship)
                    var bookingIds = allBookingsToDelete.Select(b => b.Id).ToList();
                    var bookingServices = await _context.BookingServices
                        .Where(bs => bookingIds.Contains(bs.BookingId))
                        .ToListAsync();
                    if (bookingServices.Any())
                    {
                        _context.BookingServices.RemoveRange(bookingServices);
                        _logger.LogInformation($"Deleting {bookingServices.Count} booking services");
                    }

                    _context.Bookings.RemoveRange(allBookingsToDelete);
                    _logger.LogInformation($"Deleting {allBookingsToDelete.Count} bookings");
                }

                // Save all deletions
                await _context.SaveChangesAsync();
                _logger.LogInformation("All related records deleted successfully");

                // 11. Now delete the Artist
                var artistToDelete = await _context.Artists.FindAsync(artistId);
                if (artistToDelete != null)
                {
                    _context.Artists.Remove(artistToDelete);
                    await _context.SaveChangesAsync();
                    _logger.LogInformation($"Deleted artist {artistId}");
                }

                // 12. Finally delete the User
                var userToDelete = await _context.Users.FindAsync(userId);
                if (userToDelete != null)
                {
                    _context.Users.Remove(userToDelete);
                    await _context.SaveChangesAsync();
                    _logger.LogInformation($"Deleted user {userId}");
                }

                _logger.LogInformation($"Successfully deleted artist account {artistId} and user {userId}");
                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error deleting artist account {artistId}");
                throw;
            }
        }
    }
}
