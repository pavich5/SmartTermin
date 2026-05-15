using SmartTermin.DataAccess.Repositories;
using SmartTermin.DTOs;
using SmartTermin.Mappers;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Logging;
using System.Linq;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;

namespace SmartTermin.Services
{
    // Temporary signup data stored in cache before verification
    internal class SignupCacheData
    {
        public string Phone { get; set; } = string.Empty;
        public string Password { get; set; } = string.Empty;
        public string FullName { get; set; } = string.Empty;
        public string UserType { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public DateTime? DateOfBirth { get; set; }
        public string VerificationCode { get; set; } = string.Empty;
        public DateTime ExpiresAt { get; set; }
    }

    public class AuthService : IAuthService
    {
        private readonly IUserRepository _userRepository;
        private readonly IConfiguration _configuration;
        private readonly ISmsService _smsService;
        private readonly IEmailService _emailService;
        private readonly IMemoryCache _memoryCache;
        private readonly ILogger<AuthService> _logger;

        public AuthService(IUserRepository userRepository, IConfiguration configuration, ISmsService smsService, IEmailService emailService, IMemoryCache memoryCache, ILogger<AuthService> logger)
        {
            _userRepository = userRepository;
            _configuration = configuration;
            _smsService = smsService;
            _emailService = emailService;
            _memoryCache = memoryCache;
            _logger = logger;
        }

        public async Task<LoginResponseDto?> LoginAsync(LoginRequestDto request, string? userAgent = null)
        {
            // First check if user exists (including inactive)
            var userIncludingInactive = await _userRepository.GetUserByPhoneIncludingInactiveAsync(request.Phone);

            if (userIncludingInactive == null)
            {
                return null;
            }

            // Verify password first
            if (!VerifyPassword(request.Password, userIncludingInactive.PasswordHash))
            {
                return null;
            }

            // Check if account is deactivated
            if (!userIncludingInactive.IsActive)
            {
                return new LoginResponseDto
                {
                    IsAccountDeactivated = true,
                    UserId = userIncludingInactive.Id.ToString()
                };
            }

            // Get user with artist profile for free trial check (only active users)
            var user = await _userRepository.GetUserWithArtistProfileAsync(request.Phone);

            if (user == null)
            {
                return null;
            }

            // Update last login
            await _userRepository.UpdateUserLastLoginAsync(user.Id);

            // Check if user is on Safari mobile and has no FCM token
            if (IsSafariMobile(userAgent) && string.IsNullOrWhiteSpace(user.FcmToken) && !string.IsNullOrWhiteSpace(user.Email))
            {
                _ = Task.Run(async () =>
                {
                    try
                    {
                        await SendSafariMobileNotificationEmailAsync(user.Email, user.FullName);
                    }
                    catch (Exception ex)
                    {
                        _logger.LogError(ex, $"Failed to send Safari mobile notification email to {user.Email}");
                    }
                });
            }

            // Generate JWT token
            var token = GenerateJwtToken(user);

            // Map user to DTO
            var userDto = UserMapper.ToDto(user);

            // Set IsOnboardingCompleted based on MaximumCancellationHours
            // If MaximumCancellationHours is null or artist profile doesn't exist, onboarding is not completed
            if (user.UserType == "artist" && user.ArtistProfile != null)
            {
                // Check if MaximumCancellationHours has been set (not null)
                userDto.IsOnboardingCompleted = user.ArtistProfile.MaximumCancellationHours.HasValue;
                // Set ArtistId for artists
                userDto.ArtistId = user.ArtistProfile.Id.ToString();
            }
            else if (user.UserType == "artist")
            {
                userDto.IsOnboardingCompleted = false;
            }

            return new LoginResponseDto
            {
                Token = token,
                User = userDto
            };
        }

        private bool VerifyPassword(string password, string passwordHash)
        {
            // Split the hash to get salt and hash
            var parts = passwordHash.Split(':');
            if (parts.Length != 2)
            {
                return false;
            }

            var salt = Convert.FromBase64String(parts[0]);
            var hash = Convert.FromBase64String(parts[1]);

            // Hash the provided password with the same salt
            using (var pbkdf2 = new Rfc2898DeriveBytes(password, salt, 10000, HashAlgorithmName.SHA256))
            {
                var computedHash = pbkdf2.GetBytes(32);
                return computedHash.SequenceEqual(hash);
            }
        }

        private string GenerateJwtToken(SmartTermin.DomainModels.Models.User user)
        {
            var jwtSettings = _configuration.GetSection("JwtSettings");
            var secretKey = jwtSettings["SecretKey"] ?? "YourSuperSecretKeyThatShouldBeAtLeast32CharactersLong";
            var issuer = jwtSettings["Issuer"] ?? "SmartTermin";
            var audience = jwtSettings["Audience"] ?? "SmartTerminUsers";

            // Create header
            var header = new
            {
                alg = "HS256",
                typ = "JWT"
            };

            // Create payload (no expiration - tokens never expire)
            var now = DateTimeOffset.UtcNow.ToUnixTimeSeconds();
            var payload = new
            {
                sub = user.Id.ToString(),
                name = user.Phone,
                UserType = user.UserType,
                jti = Guid.NewGuid().ToString(),
                iss = issuer,
                aud = audience,
                iat = now
                // exp claim removed - token never expires
            };

            // Encode header and payload
            var headerJson = JsonSerializer.Serialize(header);
            var payloadJson = JsonSerializer.Serialize(payload);
            var headerBase64 = Base64UrlEncode(Encoding.UTF8.GetBytes(headerJson));
            var payloadBase64 = Base64UrlEncode(Encoding.UTF8.GetBytes(payloadJson));

            // Create signature
            var signatureInput = $"{headerBase64}.{payloadBase64}";
            var signature = CreateHmacSignature(signatureInput, secretKey);
            var signatureBase64 = Base64UrlEncode(signature);

            // Combine to create JWT
            return $"{headerBase64}.{payloadBase64}.{signatureBase64}";
        }

        private byte[] CreateHmacSignature(string input, string secretKey)
        {
            using (var hmac = new HMACSHA256(Encoding.UTF8.GetBytes(secretKey)))
            {
                return hmac.ComputeHash(Encoding.UTF8.GetBytes(input));
            }
        }

        private string Base64UrlEncode(byte[] input)
        {
            return Convert.ToBase64String(input)
                .TrimEnd('=')
                .Replace('+', '-')
                .Replace('/', '_');
        }

        public async Task<SignupResponseDto> SignupAsync(SignupRequestDto request)
        {
            // Normalize phone number (trim whitespace)
            var normalizedPhone = request.Phone?.Trim() ?? string.Empty;
            
            _logger.LogInformation($"SignupAsync: Starting signup for phone {normalizedPhone}, UserType: {request.UserType}");
            
            // Check if user already exists - IMPORTANT: Do NOT create user here!
            var existingUser = await _userRepository.GetUserByPhoneAsync(normalizedPhone);
            if (existingUser != null)
            {
                _logger.LogWarning($"SignupAsync: User already exists for phone {normalizedPhone}. User ID: {existingUser.Id}");
                // Return false to indicate signup failed (user exists)
                return new SignupResponseDto { VerificationCodeSent = false };
            }

            // Validate user type
            if (request.UserType != "artist" && request.UserType != "client")
            {
                _logger.LogWarning($"SignupAsync: Invalid user type: {request.UserType}");
                return new SignupResponseDto { VerificationCodeSent = false };
            }

            // Generate verification code
            var verificationCode = GenerateVerificationCode();
            var verificationExpiresAt = DateTime.UtcNow.AddMinutes(10); // Code expires in 10 minutes

            _logger.LogInformation($"SignupAsync: Generated verification code for phone {normalizedPhone}. Code: {verificationCode}, Expires at: {verificationExpiresAt}");

            // Store signup data in memory cache (will be used after verification)
            // Use normalized phone for cache key to ensure consistency
            // IMPORTANT: User is NOT created in database here - only stored in cache!
            var cacheKey = $"signup_{normalizedPhone}";
            var signupData = new SignupCacheData
            {
                Phone = normalizedPhone,
                Password = request.Password, // Store plain password to hash later
                FullName = request.FullName,
                UserType = request.UserType,
                Email = request.Email ?? string.Empty,
                DateOfBirth = request.DateOfBirth,
                VerificationCode = verificationCode,
                ExpiresAt = verificationExpiresAt
            };

            // Store in cache with expiration matching code expiration
            var cacheOptions = new MemoryCacheEntryOptions
            {
                AbsoluteExpirationRelativeToNow = TimeSpan.FromMinutes(10)
            };
            _memoryCache.Set(cacheKey, signupData, cacheOptions);
            _logger.LogInformation($"SignupAsync: Stored signup data in cache with key: {cacheKey}");

            // Send verification code via SMS
            _logger.LogInformation($"SignupAsync: Attempting to send SMS to {normalizedPhone}");
            var smsSent = await _smsService.SendVerificationCodeAsync(normalizedPhone, verificationCode);
            _logger.LogInformation($"SignupAsync: SMS send result: {smsSent} for phone {normalizedPhone}");

            // IMPORTANT: User is NOT created here - only after successful verification in VerifyPhoneAsync
            return new SignupResponseDto
            {
                VerificationCodeSent = smsSent
            };
        }

        private string HashPassword(string password)
        {
            // Generate a random salt
            byte[] salt = new byte[16];
            using (var rng = RandomNumberGenerator.Create())
            {
                rng.GetBytes(salt);
            }

            // Hash the password with the salt
            using (var pbkdf2 = new Rfc2898DeriveBytes(password, salt, 10000, HashAlgorithmName.SHA256))
            {
                byte[] hash = pbkdf2.GetBytes(32);
                
                // Combine salt and hash as base64 strings separated by colon
                string saltBase64 = Convert.ToBase64String(salt);
                string hashBase64 = Convert.ToBase64String(hash);
                
                return $"{saltBase64}:{hashBase64}";
            }
        }

        private string GenerateVerificationCode()
        {
            // Generate a 6-digit verification code
            var random = new Random();
            return random.Next(100000, 999999).ToString();
        }

        public async Task<VerifyPhoneResponseDto> VerifyPhoneAsync(VerifyPhoneRequestDto request)
        {
            // Normalize phone number (trim whitespace) to match signup
            var normalizedPhone = request.Phone?.Trim() ?? string.Empty;
            var normalizedCode = request.Code?.Trim() ?? string.Empty;
            
            _logger.LogInformation($"VerifyPhoneAsync: Starting verification for phone {normalizedPhone}, code length: {normalizedCode.Length}");
            
            // Validate code format first
            if (string.IsNullOrEmpty(normalizedCode) || normalizedCode.Length != 6 || !normalizedCode.All(char.IsDigit))
            {
                _logger.LogWarning($"VerifyPhoneAsync: Invalid code format for phone {normalizedPhone}. Code: {normalizedCode}");
                return new VerifyPhoneResponseDto
                {
                    Verified = false,
                    Jwt = string.Empty,
                    User = new UserDto()
                };
            }
            
            // Get signup data from cache using normalized phone
            var cacheKey = $"signup_{normalizedPhone}";
            if (!_memoryCache.TryGetValue(cacheKey, out SignupCacheData? signupData) || signupData == null)
            {
                // Cache miss - code might have expired or phone number doesn't match
                _logger.LogWarning($"VerifyPhoneAsync: No signup data found in cache for phone {normalizedPhone}. Cache key: {cacheKey}");
                
                // Check if user already exists (might have been created somehow)
                var existingUserCheck = await _userRepository.GetUserByPhoneAsync(normalizedPhone);
                if (existingUserCheck != null)
                {
                    _logger.LogWarning($"VerifyPhoneAsync: User already exists for phone {normalizedPhone} but no cache data found. User ID: {existingUserCheck.Id}");
                    return new VerifyPhoneResponseDto
                    {
                        Verified = false,
                        Jwt = string.Empty,
                        User = new UserDto()
                    };
                }
                
                return new VerifyPhoneResponseDto
                {
                    Verified = false,
                    Jwt = string.Empty,
                    User = new UserDto()
                };
            }

            // Check if verification code has expired FIRST (before code comparison)
            if (signupData.ExpiresAt < DateTime.UtcNow)
            {
                // Remove expired data from cache
                _memoryCache.Remove(cacheKey);
                _logger.LogWarning($"VerifyPhoneAsync: Code expired for phone {normalizedPhone}. Expired at: {signupData.ExpiresAt}, Current time: {DateTime.UtcNow}");
                return new VerifyPhoneResponseDto
                {
                    Verified = false,
                    Jwt = string.Empty,
                    User = new UserDto()
                };
            }

            // Check if verification code matches (trim and compare, ensure both are 6 digits)
            var storedCode = signupData.VerificationCode?.Trim() ?? string.Empty;
            _logger.LogInformation($"VerifyPhoneAsync: Comparing codes for phone {normalizedPhone}. Stored: {storedCode}, Received: {normalizedCode}");
            
            if (string.IsNullOrEmpty(storedCode) || storedCode.Length != 6 || normalizedCode != storedCode)
            {
                // Code doesn't match - return error
                _logger.LogWarning($"VerifyPhoneAsync: Code mismatch for phone {normalizedPhone}. Expected: '{storedCode}' (length: {storedCode.Length}), Received: '{normalizedCode}' (length: {normalizedCode.Length})");
                return new VerifyPhoneResponseDto
                {
                    Verified = false,
                    Jwt = string.Empty,
                    User = new UserDto()
                };
            }

            // Check if user already exists (race condition check) - BEFORE creating user
            var existingUser = await _userRepository.GetUserByPhoneAsync(normalizedPhone);
            if (existingUser != null)
            {
                // Remove from cache and return error
                _memoryCache.Remove(cacheKey);
                _logger.LogWarning($"VerifyPhoneAsync: User already exists for phone {normalizedPhone}. User ID: {existingUser.Id}. This should not happen - user should only be created after verification.");
                return new VerifyPhoneResponseDto
                {
                    Verified = false,
                    Jwt = string.Empty,
                    User = new UserDto()
                };
            }
            
            _logger.LogInformation($"VerifyPhoneAsync: Code verified successfully for phone {normalizedPhone}. Creating user...");

            // Hash password
            var passwordHash = HashPassword(signupData.Password);

            // Double-check user doesn't exist (race condition protection)
            existingUser = await _userRepository.GetUserByPhoneAsync(normalizedPhone);
            if (existingUser != null)
            {
                _memoryCache.Remove(cacheKey);
                _logger.LogError($"VerifyPhoneAsync: User was created between checks! Phone: {normalizedPhone}, User ID: {existingUser.Id}");
                return new VerifyPhoneResponseDto
                {
                    Verified = false,
                    Jwt = string.Empty,
                    User = new UserDto()
                };
            }

            // Create user in database - ONLY after successful verification
            // Note: PhoneVerificationCode and PhoneVerificationExpiresAt are not needed
            // since verification happens before user creation (stored in cache, not in DB)
            var user = new SmartTermin.DomainModels.Models.User
            {
                Phone = signupData.Phone,
                PasswordHash = passwordHash,
                FullName = signupData.FullName,
                UserType = signupData.UserType,
                Email = signupData.Email ?? string.Empty,
                DateOfBirth = signupData.DateOfBirth,
                PhoneVerified = true, // Set to true since we verified the code before creating user
                PhoneVerificationCode = string.Empty, // Empty string since verification already happened (code was in cache)
                // Note: Once you create a migration to make PhoneVerificationCode nullable in DB, change this to null
                PhoneVerificationExpiresAt = null, // Nullable field, can be null
                IsActive = true
            };

            _logger.LogInformation($"VerifyPhoneAsync: Creating user for phone {normalizedPhone}, UserType: {signupData.UserType}");
            user = await _userRepository.CreateUserAsync(user);
            _logger.LogInformation($"VerifyPhoneAsync: User created successfully. User ID: {user.Id}, Phone: {user.Phone}");
            
            // Remove signup data from cache after successful user creation
            _memoryCache.Remove(cacheKey);

            // If artist, create artist profile and free trial subscription
            if (signupData.UserType == "artist")
            {
                var artist = new SmartTermin.DomainModels.Models.Artist
                {
                    UserId = user.Id,
                    Profession = string.Empty, // Required in DB, set to empty string
                    BusinessName = string.Empty, // Required in DB, set to empty string
                    Address = string.Empty, // Required in DB, set to empty string
                    City = string.Empty, // Required in DB, set to empty string
                    Country = string.Empty, // Required in DB, set to empty string
                    About = string.Empty, // Set to empty string
                    Latitude = 0m, // Required in DB, set to default
                    Longitude = 0m, // Required in DB, set to default
                    MaximumCancellationHours = null, // Will be set during onboarding - column should allow NULL
                    CustomBookingLink = null, // Nullable, set to null to avoid unique constraint violation with empty strings
                    Rating = 0m,
                    TotalReviews = 0,
                    IsVerified = false,
                    SlotIntervalMinutes = 0, // Hardcoded: 0 minutes between slots
                    BufferMinutes = 5 // Hardcoded: 5 minutes buffer between appointments
                };

                artist = await _userRepository.CreateArtistAsync(artist);

                // Verify artist was created successfully
                if (artist == null || artist.Id == Guid.Empty)
                {
                    // Remove from cache
                    _memoryCache.Remove(cacheKey);
                    throw new InvalidOperationException("Failed to create artist profile");
                }

                // Create free trial subscription
                var subscription = new SmartTermin.DomainModels.Models.ArtistSubscription
                {
                    ArtistId = artist.Id,
                    PlanId = Guid.Empty, // Default plan ID - adjust as needed
                    BillingCycle = "trial",
                    Status = "active",
                    CurrentPeriodStart = DateTime.UtcNow,
                    CurrentPeriodEnd = DateTime.UtcNow.AddDays(30), // 30-day free trial
                    TrialEndsAt = DateTime.UtcNow.AddDays(30),
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                    // Id will be auto-generated
                    // PaddleSubscriptionId, PaddleCustomerId, and CancelledAt are nullable and will default to null
                };

                await _userRepository.CreateArtistSubscriptionAsync(subscription);
                
                // Mark user as having used Pro trial
                user.HasUsedProTrial = true;
                await _userRepository.UpdateUserAsync(user);
            }

            // Remove signup data from cache after successful creation
            _memoryCache.Remove(cacheKey);

            // Reload user with artist profile for JWT generation and response
            user = await _userRepository.GetUserWithArtistProfileAsync(normalizedPhone);
            if (user == null)
            {
                return new VerifyPhoneResponseDto
                {
                    Verified = false,
                    Jwt = string.Empty,
                    User = new UserDto()
                };
            }

            // Generate JWT token
            var token = GenerateJwtToken(user);

            // Map user to DTO using the mapper (includes isFreeTrialActive and isOnboardingCompleted for artists)
            var userDto = UserMapper.ToDto(user);

            // Set IsOnboardingCompleted based on MaximumCancellationHours
            // If MaximumCancellationHours is null or artist profile doesn't exist, onboarding is not completed
            if (user.UserType == "artist" && user.ArtistProfile != null)
            {
                // Check if MaximumCancellationHours has been set (not null)
                userDto.IsOnboardingCompleted = user.ArtistProfile.MaximumCancellationHours.HasValue;
                // Set ArtistId for artists
                userDto.ArtistId = user.ArtistProfile.Id.ToString();
            }
            else if (user.UserType == "artist")
            {
                userDto.IsOnboardingCompleted = false;
            }

            return new VerifyPhoneResponseDto
            {
                Verified = true,
                Jwt = token,
                User = userDto
            };
        }

        public async Task<UserDto?> GetCurrentUserAsync(Guid userId)
        {
            var user = await _userRepository.GetUserByIdWithArtistProfileAsync(userId);
            
            if (user == null)
            {
                return null;
            }

            // Map user to DTO using the mapper (includes isFreeTrialActive for artists)
            var userDto = UserMapper.ToDto(user);
            
            // Set IsOnboardingCompleted based on MaximumCancellationHours
            // If MaximumCancellationHours is null or artist profile doesn't exist, onboarding is not completed
            if (user.UserType == "artist" && user.ArtistProfile != null)
            {
                // Check if MaximumCancellationHours has been set (not null)
                userDto.IsOnboardingCompleted = user.ArtistProfile.MaximumCancellationHours.HasValue;
                // Set ArtistId for artists
                userDto.ArtistId = user.ArtistProfile.Id.ToString();
            }
            else if (user.UserType == "artist")
            {
                userDto.IsOnboardingCompleted = false;
            }

            return userDto;
        }

        public async Task<DomainModels.Models.User?> GetUserByEmailAsync(string email)
        {
            return await _userRepository.GetUserByEmailAsync(email);
        }

        public async Task<DomainModels.Models.User?> GetUserByPhoneAsync(string phone)
        {
            return await _userRepository.GetUserByPhoneAsync(phone);
        }

        public async Task<UserDto?> UpdateProfileAsync(Guid userId, UpdateProfileRequestDto request)
        {
            var user = await _userRepository.GetUserByIdWithArtistProfileAsync(userId);
            
            if (user == null)
            {
                return null;
            }

            // Update only provided fields (partial update)
            if (request.FullName != null)
            {
                user.FullName = request.FullName;
            }

            if (request.Phone != null)
            {
                user.Phone = request.Phone;
            }

            if (request.Email != null)
            {
                user.Email = request.Email;
            }

            // If the user is an artist, allow updating artist profile fields (business name, bio)
            if (user.UserType == "artist" && user.ArtistProfile != null)
            {
                if (request.BusinessName != null)
                {
                    user.ArtistProfile.BusinessName = request.BusinessName;
                }

                if (request.About != null)
                {
                    user.ArtistProfile.About = request.About;
                }
            }

            // Save changes
            user = await _userRepository.UpdateUserAsync(user);

            // Map to response DTO
            var userDto = UserMapper.ToDto(user);
            
            // Set IsOnboardingCompleted based on MaximumCancellationHours
            if (user.UserType == "artist" && user.ArtistProfile != null)
            {
                userDto.IsOnboardingCompleted = user.ArtistProfile.MaximumCancellationHours.HasValue;
                userDto.ArtistId = user.ArtistProfile.Id.ToString();
            }
            else if (user.UserType == "artist")
            {
                userDto.IsOnboardingCompleted = false;
            }

            return userDto;
        }

        public async Task<UpdateArtistProfileResponseDto?> UpdateArtistProfileAsync(Guid userId, UpdateArtistProfileRequestDto request)
        {
            // Get artist by user ID
            var artist = await _userRepository.GetArtistByUserIdAsync(userId);

            if (artist == null)
            {
                return null;
            }

            // Update only provided fields (partial update)
            if (request.Profession != null)
            {
                artist.Profession = request.Profession;
            }

            if (request.BusinessName != null)
            {
                artist.BusinessName = request.BusinessName;
            }

            if (request.Address != null)
            {
                artist.Address = request.Address;
            }

            if (request.City != null)
            {
                artist.City = request.City;
            }

            if (request.Country != null)
            {
                artist.Country = request.Country;
            }

            if (request.About != null)
            {
                artist.About = request.About;
            }

            if (request.MaximumCancellationHours.HasValue)
            {
                artist.MaximumCancellationHours = request.MaximumCancellationHours.Value;
            }

            if (request.CustomBookingLink != null)
            {
                // Validate uniqueness if not empty
                if (!string.IsNullOrWhiteSpace(request.CustomBookingLink))
                {
                    var normalizedLink = request.CustomBookingLink.Trim().ToLowerInvariant();
                    var existingArtist = await _userRepository.GetArtistByCustomBookingLinkAsync(normalizedLink);
                    if (existingArtist != null && existingArtist.Id != artist.Id)
                    {
                        throw new InvalidOperationException("Custom booking link is already taken");
                    }
                    artist.CustomBookingLink = normalizedLink;
                }
                else
                {
                    artist.CustomBookingLink = null;
                }
            }

            // Save changes
            artist = await _userRepository.UpdateArtistProfileAsync(artist);

            // Map to response DTO
            return new UpdateArtistProfileResponseDto
            {
                Id = artist.Id.ToString(),
                Profession = artist.Profession ?? string.Empty,
                BusinessName = artist.BusinessName ?? string.Empty,
                Address = artist.Address ?? string.Empty,
                City = artist.City ?? string.Empty,
                Country = artist.Country ?? string.Empty,
                About = artist.About ?? string.Empty,
                MaximumCancellationHours = artist.MaximumCancellationHours
            };
        }

        public async Task<LogoutResponseDto> LogoutAsync(Guid userId)
        {
            // JWT tokens are stateless, so logout is primarily handled client-side
            // by removing the token. This endpoint validates the token and returns success.
            // Optionally, you could track logout time or blacklist tokens here.
            
            // Verify user exists (token validation already done by [Authorize])
            var user = await _userRepository.GetUserByIdWithArtistProfileAsync(userId);
            
            if (user == null)
            {
                return new LogoutResponseDto { Success = false };
            }

            // Return success - client should remove token from storage
            return new LogoutResponseDto { Success = true };
        }

        public async Task<ForgotPasswordResponseDto> RequestPasswordResetAsync(ForgotPasswordRequestDto request)
        {
            // Get user by phone
            var user = await _userRepository.GetUserByPhoneAsync(request.Phone);

            // For security, don't reveal if user exists or not
            // Always return success message to prevent user enumeration
            if (user == null)
            {
                return new ForgotPasswordResponseDto
                {
                    CodeSent = false,
                    Message = "If an account exists with this phone number, a password reset code has been sent."
                };
            }

            // Generate password reset code
            var resetCode = GenerateVerificationCode();
            var resetExpiresAt = DateTime.UtcNow.AddMinutes(15); // Code expires in 15 minutes

            // Update user with reset code
            await _userRepository.UpdateUserPasswordResetCodeAsync(user.Id, resetCode, resetExpiresAt);

            // Send reset code via SMS
            var smsSent = await _smsService.SendVerificationCodeAsync(request.Phone, resetCode);

            if (smsSent)
            {
                return new ForgotPasswordResponseDto
                {
                    CodeSent = true,
                    Message = "Password reset code has been sent to your phone number."
                };
            }
            else
            {
                return new ForgotPasswordResponseDto
                {
                    CodeSent = false,
                    Message = "Failed to send password reset code. Please try again later."
                };
            }
        }

        public async Task<VerifyResetCodeResponseDto> VerifyResetCodeAsync(VerifyResetCodeRequestDto request)
        {
            // Get user by phone
            var user = await _userRepository.GetUserByPhoneAsync(request.Phone);

            if (user == null)
            {
                return new VerifyResetCodeResponseDto
                {
                    Verified = false,
                    ResetToken = string.Empty
                };
            }

            // Normalize and check if reset code matches
            var storedResetCode = user.PasswordResetCode?.Trim() ?? string.Empty;
            var enteredResetCode = request.Code?.Trim() ?? string.Empty;
            
            if (string.IsNullOrEmpty(storedResetCode) || string.IsNullOrEmpty(enteredResetCode) || storedResetCode != enteredResetCode)
            {
                _logger.LogWarning($"Password reset verification failed: Code mismatch for phone {request.Phone}. Expected: {storedResetCode}, Received: {enteredResetCode}");
                return new VerifyResetCodeResponseDto
                {
                    Verified = false,
                    ResetToken = string.Empty
                };
            }

            // Check if reset code has expired
            if (user.PasswordResetExpiresAt == null || user.PasswordResetExpiresAt < DateTime.UtcNow)
            {
                return new VerifyResetCodeResponseDto
                {
                    Verified = false,
                    ResetToken = string.Empty
                };
            }

            // Generate reset token (short-lived JWT for password reset)
            var resetToken = GeneratePasswordResetToken(user);

            // Clear the reset code after successful verification
            await _userRepository.ClearUserPasswordResetCodeAsync(user.Id);

            return new VerifyResetCodeResponseDto
            {
                Verified = true,
                ResetToken = resetToken
            };
        }

        private string GeneratePasswordResetToken(SmartTermin.DomainModels.Models.User user)
        {
            var jwtSettings = _configuration.GetSection("JwtSettings");
            var secretKey = jwtSettings["SecretKey"] ?? "YourSuperSecretKeyThatShouldBeAtLeast32CharactersLongForSecurity";
            var issuer = jwtSettings["Issuer"] ?? "SmartTermin";
            var audience = jwtSettings["Audience"] ?? "SmartTerminUsers";
            var expirationMinutes = 30; // Reset token expires in 30 minutes

            // Create header
            var header = new
            {
                alg = "HS256",
                typ = "JWT"
            };

            // Create payload with user ID and purpose claim
            var now = DateTimeOffset.UtcNow.ToUnixTimeSeconds();
            var payload = new
            {
                sub = user.Id.ToString(),
                name = user.Phone,
                purpose = "password_reset", // Indicates this is a password reset token
                jti = Guid.NewGuid().ToString(),
                iss = issuer,
                aud = audience,
                iat = now,
                exp = now + (expirationMinutes * 60)
            };

            // Encode header and payload
            var headerJson = JsonSerializer.Serialize(header);
            var payloadJson = JsonSerializer.Serialize(payload);
            var headerBase64 = Base64UrlEncode(Encoding.UTF8.GetBytes(headerJson));
            var payloadBase64 = Base64UrlEncode(Encoding.UTF8.GetBytes(payloadJson));

            // Create signature
            var signatureInput = $"{headerBase64}.{payloadBase64}";
            var signature = CreateHmacSignature(signatureInput, secretKey);
            var signatureBase64 = Base64UrlEncode(signature);

            // Combine to create JWT
            return $"{headerBase64}.{payloadBase64}.{signatureBase64}";
        }

        public async Task<ResetPasswordResponseDto> ResetPasswordAsync(ResetPasswordRequestDto request)
        {
            // Validate reset token
            var tokenValidation = ValidatePasswordResetToken(request.ResetToken, request.Phone);
            if (!tokenValidation.IsValid)
            {
                return new ResetPasswordResponseDto
                {
                    Success = false,
                    Message = tokenValidation.ErrorMessage ?? "Invalid or expired reset token"
                };
            }

            // Get user by phone
            var user = await _userRepository.GetUserByPhoneAsync(request.Phone);
            if (user == null)
            {
                return new ResetPasswordResponseDto
                {
                    Success = false,
                    Message = "User not found"
                };
            }

            // Verify token user ID matches the user
            if (tokenValidation.UserId != user.Id)
            {
                return new ResetPasswordResponseDto
                {
                    Success = false,
                    Message = "Invalid reset token"
                };
            }

            // Hash the new password
            var newPasswordHash = HashPassword(request.NewPassword);

            // Update password
            await _userRepository.UpdateUserPasswordAsync(user.Id, newPasswordHash);

            return new ResetPasswordResponseDto
            {
                Success = true,
                Message = "Password has been reset successfully"
            };
        }

        public async Task<ForgotPasswordResponseDto> RequestPhoneChangeAsync(Guid userId, RequestPhoneChangeRequestDto request)
        {
            // Normalize phone number (trim whitespace) - same as SignupAsync
            var normalizedPhone = request.Phone?.Trim() ?? string.Empty;
            
            // Validate phone number is not empty
            if (string.IsNullOrEmpty(normalizedPhone))
            {
                _logger.LogWarning("RequestPhoneChangeAsync: Phone number is empty");
                return new ForgotPasswordResponseDto
                {
                    CodeSent = false,
                    Message = "Phone number is required"
                };
            }
            
            // Get current user
            var user = await _userRepository.GetUserByIdWithArtistProfileAsync(userId);
            if (user == null)
            {
                _logger.LogWarning($"RequestPhoneChangeAsync: User not found for userId {userId}");
                return new ForgotPasswordResponseDto
                {
                    CodeSent = false,
                    Message = "User not found"
                };
            }

            // Check if new phone is already in use by another user
            var existingUser = await _userRepository.GetUserByPhoneAsync(normalizedPhone);
            if (existingUser != null && existingUser.Id != userId)
            {
                _logger.LogWarning($"RequestPhoneChangeAsync: Phone {normalizedPhone} already in use by user {existingUser.Id}");
                return new ForgotPasswordResponseDto
                {
                    CodeSent = false,
                    Message = "This phone number is already in use by another account."
                };
            }

            // Generate verification code - same as SignupAsync
            var verificationCode = GenerateVerificationCode();
            var expiresAt = DateTime.UtcNow.AddMinutes(15); // Code expires in 15 minutes

            _logger.LogInformation($"RequestPhoneChangeAsync: Generated verification code for phone {normalizedPhone}, userId {userId}");

            // Store verification code in user's verification fields
            user.PhoneVerificationCode = verificationCode;
            user.PhoneVerificationExpiresAt = expiresAt;
            await _userRepository.UpdateUserAsync(user);

            _logger.LogInformation($"RequestPhoneChangeAsync: Stored verification code in database for userId {userId}");

            // Send verification code via SMS - EXACTLY like SignupAsync
            _logger.LogInformation($"RequestPhoneChangeAsync: Attempting to send SMS to {normalizedPhone} with code {verificationCode}");
            var smsSent = await _smsService.SendVerificationCodeAsync(normalizedPhone, verificationCode);
            
            _logger.LogInformation($"RequestPhoneChangeAsync: SMS send result: {smsSent} for phone {normalizedPhone}");

            // Return response - same pattern as SignupAsync
            return new ForgotPasswordResponseDto
            {
                CodeSent = smsSent,
                Message = smsSent 
                    ? "Verification code has been sent to your new phone number."
                    : "Failed to send verification code. Please try again later."
            };
        }

        public async Task<UserDto> VerifyPhoneChangeAsync(Guid userId, VerifyPhoneChangeRequestDto request)
        {
            // Normalize phone number (trim whitespace) - same as SignupAsync
            var normalizedPhone = request.Phone?.Trim() ?? string.Empty;
            
            // Get current user
            var user = await _userRepository.GetUserByIdWithArtistProfileAsync(userId);
            if (user == null)
            {
                throw new Exception("User not found");
            }

            // Normalize and check if verification code matches
            var storedCode = user.PhoneVerificationCode?.Trim() ?? string.Empty;
            var enteredCode = request.Code?.Trim() ?? string.Empty;
            
            if (string.IsNullOrEmpty(storedCode) || string.IsNullOrEmpty(enteredCode) || storedCode != enteredCode)
            {
                _logger.LogWarning($"Phone change verification failed: Code mismatch for user {userId}. Expected: {storedCode}, Received: {enteredCode}");
                throw new Exception("Invalid verification code");
            }

            // Check if verification code has expired
            if (user.PhoneVerificationExpiresAt == null || user.PhoneVerificationExpiresAt < DateTime.UtcNow)
            {
                throw new Exception("Verification code has expired");
            }

            // Check if new phone is already in use by another user - use normalized phone
            var existingUser = await _userRepository.GetUserByPhoneAsync(normalizedPhone);
            if (existingUser != null && existingUser.Id != userId)
            {
                throw new Exception("This phone number is already in use by another account.");
            }

            // Update phone number - use normalized phone
            user.Phone = normalizedPhone;
            user.PhoneVerified = true;
            // Note: Once you create a migration to make PhoneVerificationCode nullable in DB, change this to null
            user.PhoneVerificationCode = string.Empty;
            user.PhoneVerificationExpiresAt = null;

            // Save changes
            user = await _userRepository.UpdateUserAsync(user);

            // Map to response DTO
            var userDto = UserMapper.ToDto(user);
            
            // Set IsOnboardingCompleted based on MaximumCancellationHours
            if (user.UserType == "artist" && user.ArtistProfile != null)
            {
                userDto.IsOnboardingCompleted = user.ArtistProfile.MaximumCancellationHours.HasValue;
                userDto.ArtistId = user.ArtistProfile.Id.ToString();
            }
            else if (user.UserType == "artist")
            {
                userDto.IsOnboardingCompleted = false;
            }

            return userDto;
        }

        private (bool IsValid, Guid? UserId, string? ErrorMessage) ValidatePasswordResetToken(string token, string phone)
        {
            try
            {
                var jwtSettings = _configuration.GetSection("JwtSettings");
                var secretKey = jwtSettings["SecretKey"] ?? "YourSuperSecretKeyThatShouldBeAtLeast32CharactersLongForSecurity";
                var issuer = jwtSettings["Issuer"] ?? "SmartTermin";
                var audience = jwtSettings["Audience"] ?? "SmartTerminUsers";

                // Split token into parts
                var parts = token.Split('.');
                if (parts.Length != 3)
                {
                    return (false, null, "Invalid token format");
                }

                var headerBase64 = parts[0];
                var payloadBase64 = parts[1];
                var signatureBase64 = parts[2];

                // Verify signature
                var signatureInput = $"{headerBase64}.{payloadBase64}";
                var expectedSignature = CreateHmacSignature(signatureInput, secretKey);
                var expectedSignatureBase64 = Base64UrlEncode(expectedSignature);

                if (signatureBase64 != expectedSignatureBase64)
                {
                    return (false, null, "Invalid token signature");
                }

                // Decode payload
                var payloadBytes = Base64UrlDecode(payloadBase64);
                var payloadJson = Encoding.UTF8.GetString(payloadBytes);
                var payload = JsonSerializer.Deserialize<JsonElement>(payloadJson);

                // Verify issuer
                if (payload.TryGetProperty("iss", out var iss) && iss.GetString() != issuer)
                {
                    return (false, null, "Invalid token issuer");
                }

                // Verify audience
                if (payload.TryGetProperty("aud", out var aud) && aud.GetString() != audience)
                {
                    return (false, null, "Invalid token audience");
                }

                // Verify purpose
                if (!payload.TryGetProperty("purpose", out var purpose) || purpose.GetString() != "password_reset")
                {
                    return (false, null, "Invalid token purpose");
                }

                // Verify expiration
                if (payload.TryGetProperty("exp", out var exp))
                {
                    var expirationTime = DateTimeOffset.FromUnixTimeSeconds(exp.GetInt64()).UtcDateTime;
                    if (expirationTime < DateTime.UtcNow)
                    {
                        return (false, null, "Token has expired");
                    }
                }

                // Verify phone matches
                if (payload.TryGetProperty("name", out var name) && name.GetString() != phone)
                {
                    return (false, null, "Token phone mismatch");
                }

                // Get user ID
                if (!payload.TryGetProperty("sub", out var sub) || !Guid.TryParse(sub.GetString(), out Guid userId))
                {
                    return (false, null, "Invalid token user ID");
                }

                return (true, userId, null);
            }
            catch (Exception)
            {
                return (false, null, "Token validation failed");
            }
        }

        private byte[] Base64UrlDecode(string input)
        {
            var base64 = input.Replace('-', '+').Replace('_', '/');
            switch (base64.Length % 4)
            {
                case 2: base64 += "=="; break;
                case 3: base64 += "="; break;
            }
            return Convert.FromBase64String(base64);
        }

        public async Task<bool> DeactivateAccountAsync(Guid userId)
        {
            var user = await _userRepository.GetUserByIdWithArtistProfileAsync(userId);
            
            if (user == null)
            {
                return false;
            }

            // Toggle IsActive to false (soft delete)
            user.IsActive = false;
            await _userRepository.UpdateUserAsync(user);

            return true;
        }

        public async Task<LoginResponseDto> ReactivateAccountAsync(string userId)
        {
            if (!Guid.TryParse(userId, out var userGuid))
            {
                throw new ArgumentException("Invalid user ID");
            }

            var user = await _userRepository.GetUserByIdIncludingInactiveAsync(userGuid);

            if (user == null)
            {
                throw new KeyNotFoundException("User not found");
            }

            // Reactivate account
            user.IsActive = true;
            await _userRepository.UpdateUserAsync(user);

            // Update last login
            await _userRepository.UpdateUserLastLoginAsync(user.Id);

            // Generate JWT token
            var token = GenerateJwtToken(user);

            // Map user to DTO
            var userDto = UserMapper.ToDto(user);

            // Set IsOnboardingCompleted based on MaximumCancellationHours
            if (user.UserType == "artist" && user.ArtistProfile != null)
            {
                userDto.IsOnboardingCompleted = user.ArtistProfile.MaximumCancellationHours.HasValue;
                userDto.ArtistId = user.ArtistProfile.Id.ToString();
            }
            else if (user.UserType == "artist")
            {
                userDto.IsOnboardingCompleted = false;
            }

            return new LoginResponseDto
            {
                Token = token,
                User = userDto,
                IsAccountDeactivated = false
            };
        }

        public async Task<bool> DeleteAccountPermanentlyAsync(string userId)
        {
            if (!Guid.TryParse(userId, out var userGuid))
            {
                return false;
            }

            return await _userRepository.DeleteUserPermanentlyAsync(userGuid);
        }

        private bool IsSafariMobile(string? userAgent)
        {
            if (string.IsNullOrWhiteSpace(userAgent))
                return false;

            var ua = userAgent.ToLowerInvariant();
            
            // Check for Safari on iOS mobile
            // Safari on iOS has "safari" but not "chrome" or "crios" (Chrome iOS)
            // Must contain "iphone" or "ipad" or "ipod"
            // Should not contain "crios" (Chrome iOS) or "fxios" (Firefox iOS) or other non-Safari browsers
            var isIOS = ua.Contains("iphone") || ua.Contains("ipad") || ua.Contains("ipod");
            var isSafari = ua.Contains("safari") && !ua.Contains("crios") && !ua.Contains("fxios") && !ua.Contains("opios");
            var isMobile = ua.Contains("mobile");

            return isIOS && isSafari && isMobile;
        }

        private async Task SendSafariMobileNotificationEmailAsync(string email, string fullName)
        {
            try
            {
                var subject = "Enable Notifications for Smart Termin - Add to Home Screen";
                var body = BuildSafariMobileNotificationEmailBody(fullName);
                
                var emailSent = await _emailService.SendEmailAsync(email, subject, body, isHtml: true);
                if (emailSent)
                {
                    _logger.LogInformation($"Safari mobile notification email sent to {email}");
                }
                else
                {
                    _logger.LogWarning($"Failed to send Safari mobile notification email to {email}");
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error sending Safari mobile notification email to {email}");
                throw;
            }
        }

        private string BuildSafariMobileNotificationEmailBody(string fullName)
        {
            return $@"
<!DOCTYPE html>
<html>
<head>
    <meta charset=""utf-8"">
    <meta name=""viewport"" content=""width=device-width, initial-scale=1.0"">
    <style>
        body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f4f4f4; }}
        .container {{ max-width: 600px; margin: 20px auto; background-color: #ffffff; }}
        .header {{ background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; }}
        .content {{ padding: 30px; }}
        .step {{ margin-bottom: 25px; padding: 20px; background-color: #f9f9f9; border-left: 4px solid #667eea; border-radius: 5px; }}
        .step-number {{ font-size: 24px; font-weight: bold; color: #667eea; margin-right: 10px; }}
        .step-title {{ font-size: 18px; font-weight: bold; margin-bottom: 10px; color: #333; }}
        .step-description {{ color: #666; margin-top: 10px; }}
        .icon {{ font-size: 28px; margin-right: 10px; }}
        .footer {{ text-align: center; padding: 20px; background-color: #f9f9f9; color: #666; font-size: 12px; }}
        .highlight {{ background-color: #fff3cd; padding: 2px 5px; border-radius: 3px; font-weight: bold; }}
    </style>
</head>
<body>
    <div class=""container"">
        <div class=""header"">
            <h1>📱 Enable Notifications for Smart Termin</h1>
        </div>
        <div class=""content"">
            <p>Hello {fullName},</p>
            
            <p>We noticed you're using Smart Termin on Safari (mobile browser). To receive important notifications about your appointments and reminders, you'll need to add Smart Termin to your home screen.</p>
            
            <p class=""highlight"">Adding Smart Termin to your home screen enables push notifications so you won't miss appointment reminders!</p>

            <h2 style=""color: #667eea; margin-top: 30px;"">How to Add Smart Termin to Home Screen:</h2>

            <div class=""step"">
                <div style=""display: flex; align-items: center; margin-bottom: 10px;"">
                    <span class=""step-number"">1</span>
                    <span class=""step-title"">Tap the Share Button</span>
                </div>
                <div class=""step-description"">
                    Look for the <strong>Share icon</strong> (square with arrow pointing up) at the bottom of your Safari browser.
                </div>
            </div>

            <div class=""step"">
                <div style=""display: flex; align-items: center; margin-bottom: 10px;"">
                    <span class=""step-number"">2</span>
                    <span class=""step-title"">Select ""Add to Home Screen""</span>
                </div>
                <div class=""step-description"">
                    Scroll down in the share menu and tap <strong>""Add to Home Screen""</strong> (it may appear as a plus icon or ""Add to Home Screen"" option).
                </div>
            </div>

            <div class=""step"">
                <div style=""display: flex; align-items: center; margin-bottom: 10px;"">
                    <span class=""step-number"">3</span>
                    <span class=""step-title"">Confirm and Add</span>
                </div>
                <div class=""step-description"">
                    Review the app name and icon, then tap <strong>""Add""</strong> in the top right corner.
                </div>
            </div>

            <div class=""step"">
                <div style=""display: flex; align-items: center; margin-bottom: 10px;"">
                    <span class=""step-number"">4</span>
                    <span class=""step-title"">Open from Home Screen</span>
                </div>
                <div class=""step-description"">
                    Tap the Smart Termin icon on your home screen and allow notifications when prompted. This will enable you to receive appointment reminders 24 hours and 1 hour before your appointments!
                </div>
            </div>

            <div style=""background-color: #e7f3ff; padding: 20px; border-radius: 5px; margin-top: 30px; border-left: 4px solid #2196F3;"">
                <strong>💡 Why is this important?</strong>
                <p style=""margin-top: 10px; margin-bottom: 0;"">When you add Smart Termin to your home screen, it works like a native app and can send you push notifications. This means you'll never miss:</p>
                <ul style=""margin-top: 10px;"">
                    <li>Appointment reminders 24 hours before</li>
                    <li>Appointment reminders 1 hour before</li>
                    <li>Booking confirmations</li>
                    <li>Schedule updates</li>
                </ul>
            </div>

            <p style=""margin-top: 30px;"">If you have any questions or need assistance, please don't hesitate to contact our support team.</p>

            <p>Best regards,<br><strong>The Smart Termin Team</strong></p>
        </div>
        <div class=""footer"">
            <p>This is an automated email. Please do not reply directly to this message.</p>
            <p>&copy; {DateTime.UtcNow.Year} Smart Termin. All rights reserved.</p>
        </div>
    </div>
</body>
</html>";
        }
    }
}

