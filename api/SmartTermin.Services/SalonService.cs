using SmartTermin.DataAccess.Repositories;
using SmartTermin.DomainModels.Models;
using SmartTermin.DTOs;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using System.Text;
using System.Text.Json;

namespace SmartTermin.Services
{
    public class SalonService : ISalonService
    {
        private readonly ISalonRepository _salonRepository;
        private readonly IUserRepository _userRepository;
        private readonly ISmsService _smsService;
        private readonly IEmailService _emailService;
        private readonly ILogger<SalonService> _logger;
        private readonly IHttpClientFactory _httpClientFactory;
        private readonly IConfiguration _configuration;
        private const decimal ArtistSeatPrice = 15m;

        public SalonService(
            ISalonRepository salonRepository,
            IUserRepository userRepository,
            ISmsService smsService,
            IEmailService emailService,
            ILogger<SalonService> logger,
            IHttpClientFactory httpClientFactory,
            IConfiguration configuration)
        {
            _salonRepository = salonRepository;
            _userRepository = userRepository;
            _smsService = smsService;
            _emailService = emailService;
            _logger = logger;
            _httpClientFactory = httpClientFactory;
            _configuration = configuration;
        }

        public async Task<SalonDto> CreateSalonAsync(Guid ownerUserId, CreateSalonRequestDto request)
        {
            // Validate required fields
            if (string.IsNullOrWhiteSpace(request.Name))
            {
                throw new InvalidOperationException("Salon name is required");
            }
            if (string.IsNullOrWhiteSpace(request.Address))
            {
                throw new InvalidOperationException("Address is required");
            }
            if (string.IsNullOrWhiteSpace(request.City))
            {
                throw new InvalidOperationException("City is required");
            }
            if (string.IsNullOrWhiteSpace(request.Country))
            {
                throw new InvalidOperationException("Country is required");
            }

            var owner = await _userRepository.GetUserByIdWithArtistProfileAsync(ownerUserId)
                ?? throw new InvalidOperationException("User not found");

            if (!string.Equals(owner.UserType, "artist", StringComparison.OrdinalIgnoreCase))
            {
                throw new UnauthorizedAccessException("Only artists can create salons");
            }

            if (owner.ArtistProfile == null)
            {
                throw new InvalidOperationException("Artist profile is required to create a salon");
            }

            // Validate CustomBookingLink uniqueness if provided
            if (!string.IsNullOrWhiteSpace(request.CustomBookingLink))
            {
                var normalizedLink = request.CustomBookingLink.Trim().ToLowerInvariant();
                var existingArtist = await _userRepository.GetArtistByCustomBookingLinkAsync(normalizedLink);
                var existingSalon = await _salonRepository.GetSalonByCustomBookingLinkAsync(normalizedLink);
                if (existingArtist != null || existingSalon != null)
                {
                    throw new InvalidOperationException("Custom booking link is already taken");
                }
            }

            var salon = new Salon
            {
                Name = request.Name,
                OwnerUserId = ownerUserId,
                Address = request.Address,
                City = request.City,
                Country = request.Country,
                Phone = request.Phone,
                Email = request.Email,
                BannerImageUrl = request.BannerImageUrl,
                ProfileImageUrl = request.ProfileImageUrl,
                About = request.About,
                CustomBookingLink = !string.IsNullOrWhiteSpace(request.CustomBookingLink) 
                    ? request.CustomBookingLink.Trim().ToLowerInvariant() 
                    : null,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            await _salonRepository.CreateSalonAsync(salon);

            if (owner.ArtistProfile != null)
            {
                // Update SalonId on the artist profile
                owner.ArtistProfile.SalonId = salon.Id;
                await _userRepository.UpdateArtistProfileAsync(owner.ArtistProfile);

                // Add membership for the owner
                await _salonRepository.AddMembershipAsync(new SalonMembership
                {
                    SalonId = salon.Id,
                    ArtistId = owner.ArtistProfile.Id,
                    Role = "owner",
                    JoinedAt = DateTime.UtcNow,
                    Status = "active"
                });
            }

            var now = DateTime.UtcNow;

            // Determine seat count (respect requested seats but never below current members or minimum seats)
            var requestedSeatCount = request.ArtistCount ?? 3;
            var currentMemberCount = await _salonRepository.GetActiveArtistCountAsync(salon.Id);
            var seatCount = Math.Max(Math.Max(3, requestedSeatCount), currentMemberCount);

            // Decide whether we should start with a free trial
            var canUseTrial = !owner.HasUsedEnterpriseTrial && !owner.HasCreatedSalon;
            var startWithTrial = (request.StartWithTrial ?? canUseTrial) && canUseTrial;
            var billingCycle = string.IsNullOrWhiteSpace(request.BillingCycle) ? "monthly" : request.BillingCycle;

            // For Enterprise, if StartWithTrial is explicitly false and billingCycle is null/empty,
            // it means this is a free Enterprise creation (offline billing)
            var isFreeEnterprise = !startWithTrial && string.IsNullOrWhiteSpace(billingCycle);
            
            var subscription = new SalonSubscription
            {
                SalonId = salon.Id,
                PlanType = "enterprise",
                ArtistCount = seatCount,
                MonthlyCost = isFreeEnterprise ? 0 : (seatCount * ArtistSeatPrice), // Free for Enterprise with offline billing
                BillingCycle = isFreeEnterprise ? null : billingCycle, // No billing cycle for free Enterprise
                Status = isFreeEnterprise ? "active" : (startWithTrial ? "trial" : "active"), // Always active for free Enterprise
                CurrentPeriodStart = now,
                CurrentPeriodEnd = isFreeEnterprise ? DateTime.MaxValue : now.AddMonths(1), // Use MaxValue for free Enterprise to indicate no end period
                TrialEndsAt = isFreeEnterprise ? null : (startWithTrial ? now.AddMonths(1) : null),
                NextPaymentDate = isFreeEnterprise ? null : (startWithTrial ? now.AddMonths(1) : null), // No payment date for free Enterprise
                CreatedAt = now,
                UpdatedAt = now
            };

            await _salonRepository.UpsertSubscriptionAsync(subscription);

            // Mark user as having created a salon (permanently disables future trials)
            owner.HasCreatedSalon = true;
            // Only burn the Enterprise trial flag when a trial is actually started
            owner.HasUsedEnterpriseTrial = owner.HasUsedEnterpriseTrial || startWithTrial;
            await _userRepository.UpdateUserAsync(owner);

            return await BuildSalonDtoAsync(salon.Id);
        }

        public async Task<SalonDto?> GetSalonAsync(Guid salonId)
        {
            // Check if salon exists first (lightweight query)
            var salon = await _salonRepository.GetSalonByIdAsync(salonId);
            if (salon == null) return null;

            return await BuildSalonDtoAsync(salonId);
        }

        public async Task<SalonDto> UpdateSalonAsync(Guid salonId, Guid ownerUserId, UpdateSalonRequestDto request)
        {
            var salon = await _salonRepository.GetSalonByIdAsync(salonId)
                ?? throw new KeyNotFoundException("Salon not found");

            if (salon.OwnerUserId != ownerUserId)
            {
                throw new UnauthorizedAccessException("Only the salon owner can update salon details");
            }

            // Validate CustomBookingLink uniqueness if provided and different from current
            if (!string.IsNullOrWhiteSpace(request.CustomBookingLink))
            {
                var normalizedLink = request.CustomBookingLink.Trim().ToLowerInvariant();
                var currentLink = salon.CustomBookingLink?.Trim().ToLowerInvariant();
                
                // Only check uniqueness if the link is changing
                if (normalizedLink != currentLink)
                {
                    var existingArtist = await _userRepository.GetArtistByCustomBookingLinkAsync(normalizedLink);
                    var existingSalon = await _salonRepository.GetSalonByCustomBookingLinkAsync(normalizedLink);
                    if (existingArtist != null || (existingSalon != null && existingSalon.Id != salonId))
                    {
                        throw new InvalidOperationException("Custom booking link is already taken");
                    }
                }
            }

            salon.Name = request.Name ?? salon.Name;
            salon.Address = request.Address ?? salon.Address;
            salon.City = request.City ?? salon.City;
            salon.Country = request.Country ?? salon.Country;
            salon.Phone = request.Phone ?? salon.Phone;
            salon.Email = request.Email ?? salon.Email;
            salon.BannerImageUrl = request.BannerImageUrl ?? salon.BannerImageUrl;
            salon.About = request.About ?? salon.About;
            salon.CustomBookingLink = !string.IsNullOrWhiteSpace(request.CustomBookingLink)
                ? request.CustomBookingLink.Trim().ToLowerInvariant()
                : request.CustomBookingLink == string.Empty ? null : salon.CustomBookingLink;
            salon.UpdatedAt = DateTime.UtcNow;

            await _salonRepository.UpdateSalonAsync(salon);
            return await BuildSalonDtoAsync(salon.Id);
        }

        public async Task<bool> DeleteSalonAsync(Guid salonId, Guid ownerUserId)
        {
            var salon = await _salonRepository.GetSalonByIdAsync(salonId);
            if (salon == null) return false;
            if (salon.OwnerUserId != ownerUserId)
            {
                throw new UnauthorizedAccessException("Only the salon owner can delete the salon");
            }

            return await _salonRepository.DeleteSalonAsync(salonId);
        }

        public async Task<SalonMembersResponseDto> GetMembersAsync(Guid salonId)
        {
            var members = await _salonRepository.GetMembersAsync(salonId);
            var invitations = await _salonRepository.GetInvitationsForSalonAsync(salonId);
            var bookings = await _salonRepository.GetBookingsForSalonAsync(salonId, null, null);

            var response = new SalonMembersResponseDto
            {
                Members = members
                    // Filter out owner if they are not also an artist (SalonId is null or doesn't match this salon)
                    .Where(m => m.Role != "owner" || (m.Role == "owner" && m.Artist.SalonId == salonId))
                    .Select(m => new SalonMemberDto
                    {
                        ArtistId = m.ArtistId.ToString(),
                        UserId = m.Artist.UserId.ToString(),
                        FullName = m.Artist.User?.FullName ?? "Artist",
                        Role = m.Role,
                        ProfileImageUrl = m.Artist.PortfolioImages?.FirstOrDefault(p => p.IsProfilePicture)?.ImageUrl,
                        Profession = m.Artist.Profession,
                        Bookings = bookings.Count(b => b.ArtistId == m.ArtistId),
                        Revenue = bookings.Where(b => b.ArtistId == m.ArtistId).Sum(b => b.TotalPrice ?? 0)
                    }).ToList(),
                PendingInvitations = invitations
                    .Where(i => i.Status == "pending")
                    .Select(MapInvitation)
                    .ToList()
            };

            return response;
        }

        public async Task<SalonInvitationDto> InviteArtistAsync(Guid salonId, Guid ownerUserId, InviteArtistRequestDto request)
        {
            var salon = await _salonRepository.GetSalonByIdAsync(salonId)
                ?? throw new KeyNotFoundException("Salon not found");

            if (salon.OwnerUserId != ownerUserId)
            {
                throw new UnauthorizedAccessException("Only the salon owner can invite artists");
            }

            var subscription = await _salonRepository.GetSubscriptionAsync(salonId);
            if (subscription != null && subscription.Status == "trial")
            {
                var currentMemberCount = await _salonRepository.GetActiveArtistCountAsync(salonId);
                var trialSeatLimit = subscription.ArtistCount > 0 ? subscription.ArtistCount : 3;
                if (currentMemberCount >= trialSeatLimit)
                {
                    throw new InvalidOperationException($"Trial allows maximum {trialSeatLimit} artists. Subscribe to add more artists.");
                }
            }

            // Check if there's already a pending invitation for this email or phone
            var existingInvitation = await _salonRepository.GetPendingInvitationByEmailOrPhoneAsync(
                salonId, 
                request.Email, 
                request.Phone
            );

            if (existingInvitation != null)
            {
                var contactInfo = !string.IsNullOrWhiteSpace(request.Email) ? request.Email : request.Phone;
                throw new InvalidOperationException(
                    $"A pending invitation already exists for {contactInfo}. Please wait for the current invitation to expire or be accepted before sending a new one."
                );
            }

            var token = Guid.NewGuid().ToString("N");
            var invitation = new SalonInvitation
            {
                SalonId = salonId,
                Email = request.Email,
                Phone = request.Phone,
                InvitedBy = ownerUserId,
                Token = token,
                ExpiresAt = DateTime.UtcNow.AddDays(7),
                Status = "pending",
                CreatedAt = DateTime.UtcNow
            };

            await _salonRepository.CreateInvitationAsync(invitation);

            // Build invitation URL (always, not just for SMS) - use FrontendUrl, not BaseUrl
            var frontendUrl = _configuration["AppSettings:FrontendUrl"] ?? "http://localhost:3000";
            var invitationUrl = $"{frontendUrl}/accept-invitation?token={token}";
            
            // Log invitation URL for development/testing
            _logger.LogInformation($"=== INVITATION URL (for testing) ===\n{invitationUrl}\nToken: {token}\nSalon: {salon.Name}\n=====================================");

            // Send email if email is provided
            if (!string.IsNullOrWhiteSpace(request.Email))
            {
                try
                {
                    var owner = await _userRepository.GetUserByIdWithArtistProfileAsync(ownerUserId);
                    var ownerName = owner?.FullName ?? "Salon Owner";
                    
                    var emailSubject = $"Invitation to join {salon.Name} on SmartTermin";
                    var emailBody = BuildInvitationEmailBody(salon.Name, ownerName, invitationUrl, request.Message);
                    
                    var emailSent = await _emailService.SendEmailAsync(request.Email, emailSubject, emailBody);
                    if (emailSent)
                    {
                        _logger.LogInformation($"Email invitation sent to {request.Email}");
                    }
                    else
                    {
                        _logger.LogWarning($"Email invitation failed to send to {request.Email}");
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, $"Failed to send email invitation to {request.Email}. Error: {ex.Message}");
                    // Don't fail the invitation creation if email fails
                }
            }

            // Send SMS if phone is provided
            if (!string.IsNullOrWhiteSpace(request.Phone))
            {
                try
                {
                    // Normalize phone number using the same logic as frontend (formatPhoneNumber)
                    var phoneNumber = request.Phone.Trim();
                    var cleaned = phoneNumber.Replace(" ", "").Replace("-", "");
                    
                    // Remove all non-digit characters except +
                    cleaned = System.Text.RegularExpressions.Regex.Replace(cleaned, @"[^\d+]", "");
                    
                    const string PHONE_PREFIX = "+389";
                    
                    if (!cleaned.StartsWith(PHONE_PREFIX))
                    {
                        if (cleaned.StartsWith("+"))
                        {
                            // If it starts with + but not +389, extract digits and add +389
                            var digits = System.Text.RegularExpressions.Regex.Replace(cleaned.Substring(1), @"\D", "");
                            var limitedDigits = digits.Length > 8 ? digits.Substring(0, 8) : digits;
                            phoneNumber = PHONE_PREFIX + limitedDigits;
                        }
                        else
                        {
                            // Extract only digits and limit to 8, then add +389
                            var digitsOnly = System.Text.RegularExpressions.Regex.Replace(cleaned, @"\D", "");
                            var limitedDigits = digitsOnly.Length > 8 ? digitsOnly.Substring(0, 8) : digitsOnly;
                            phoneNumber = PHONE_PREFIX + limitedDigits;
                        }
                    }
                    else
                    {
                        // Already has +389, just clean the rest
                        var afterPrefix = cleaned.Substring(PHONE_PREFIX.Length);
                        var digitsOnly = System.Text.RegularExpressions.Regex.Replace(afterPrefix, @"\D", "");
                        var limitedDigits = digitsOnly.Length > 8 ? digitsOnly.Substring(0, 8) : digitsOnly;
                        phoneNumber = PHONE_PREFIX + limitedDigits;
                    }

                    var defaultMessage = $"You've been invited to join {salon.Name} on SmartTermin. Accept here: {invitationUrl}";
                    var smsMessage = !string.IsNullOrWhiteSpace(request.Message) 
                        ? $"{request.Message}\n\nAccept invitation: {invitationUrl}"
                        : defaultMessage;
                    
                    var smsSent = await _smsService.SendMessageAsync(phoneNumber, smsMessage);
                    if (smsSent)
                    {
                        _logger.LogInformation($"SMS invitation sent to {phoneNumber}");
                    }
                    else
                    {
                        _logger.LogWarning($"SMS invitation failed to send to {phoneNumber}");
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, $"Failed to send SMS invitation to {request.Phone}. Error: {ex.Message}");
                    // Don't fail the invitation creation if SMS fails
                }
            }

            var invitationDto = MapInvitation(invitation);
            invitationDto.InvitationUrl = invitationUrl;
            return invitationDto;
        }

        private string BuildInvitationEmailBody(string salonName, string ownerName, string invitationUrl, string? customMessage)
        {
            var message = !string.IsNullOrWhiteSpace(customMessage) 
                ? customMessage 
                : $"You've been invited to join {salonName} on SmartTermin.";

            return $@"
<!DOCTYPE html>
<html>
<head>
    <meta charset=""utf-8"">
    <style>
        body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
        .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
        .header {{ background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }}
        .content {{ background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }}
        .button {{ display: inline-block; padding: 15px 30px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; font-weight: bold; }}
        .footer {{ text-align: center; margin-top: 30px; color: #666; font-size: 12px; }}
    </style>
</head>
<body>
    <div class=""container"">
        <div class=""header"">
            <h1>🎨 Salon Invitation</h1>
        </div>
        <div class=""content"">
            <p>Hello,</p>
            <p>{message}</p>
            <p><strong>{ownerName}</strong> has invited you to join <strong>{salonName}</strong> as a team member.</p>
            <p>Click the button below to accept the invitation:</p>
            <div style=""text-align: center;"">
                <a href=""{invitationUrl}"" class=""button"" style=""color: white !important; text-decoration: none;"">Accept Invitation</a>
            </div>
            <p style=""margin-top: 30px; font-size: 12px; color: #666;"">
                Or copy and paste this link into your browser:<br>
                <a href=""{invitationUrl}"" style=""color: #667eea; word-break: break-all;"">{invitationUrl}</a>
            </p>
            <p style=""margin-top: 20px; font-size: 12px; color: #999;"">
                This invitation will expire in 7 days.
            </p>
        </div>
        <div class=""footer"">
            <p>This email was sent by SmartTermin</p>
            <p>If you didn't expect this invitation, you can safely ignore this email.</p>
        </div>
    </div>
</body>
</html>";
        }

        public async Task<bool> CancelInvitationAsync(Guid salonId, Guid invitationId, Guid ownerUserId)
        {
            var salon = await _salonRepository.GetSalonByIdAsync(salonId)
                ?? throw new KeyNotFoundException("Salon not found");

            if (salon.OwnerUserId != ownerUserId)
            {
                throw new UnauthorizedAccessException("Only the salon owner can cancel invitations");
            }

            var invitation = await _salonRepository.GetInvitationByIdAsync(invitationId);
            if (invitation == null || invitation.SalonId != salonId)
            {
                return false;
            }

            if (!string.Equals(invitation.Status, "pending", StringComparison.OrdinalIgnoreCase))
            {
                return false; // Already cancelled or accepted
            }

            return await _salonRepository.DeleteInvitationAsync(invitationId);
        }

        public async Task<SalonInvitationDto?> GetInvitationByTokenAsync(string token)
        {
            var invitation = await _salonRepository.GetInvitationByTokenAsync(token);
            if (invitation == null) return null;
            return MapInvitation(invitation);
        }

        public async Task<SalonDto> AcceptInvitationAsync(string token, Guid artistUserId)
        {
            var invitation = await _salonRepository.GetInvitationByTokenAsync(token)
                ?? throw new KeyNotFoundException("Invitation not found");

            if (!string.Equals(invitation.Status, "pending", StringComparison.OrdinalIgnoreCase))
            {
                throw new InvalidOperationException("Invitation is no longer valid");
            }

            if (invitation.ExpiresAt < DateTime.UtcNow)
            {
                invitation.Status = "expired";
                await _salonRepository.UpdateInvitationAsync(invitation);
                throw new InvalidOperationException("Invitation has expired");
            }

            var subscription = await _salonRepository.GetSubscriptionAsync(invitation.SalonId);
            if (subscription != null && subscription.Status == "trial")
            {
                var currentMemberCount = await _salonRepository.GetActiveArtistCountAsync(invitation.SalonId);
                var trialSeatLimit = subscription.ArtistCount > 0 ? subscription.ArtistCount : 3;
                if (currentMemberCount >= trialSeatLimit)
                {
                    throw new InvalidOperationException($"Trial allows maximum {trialSeatLimit} artists. Subscribe to add more artists.");
                }
            }

            var user = await _userRepository.GetUserByIdWithArtistProfileAsync(artistUserId)
                ?? throw new InvalidOperationException("Artist profile not found");

            if (user.ArtistProfile == null)
            {
                throw new InvalidOperationException("Artist profile missing for this user");
            }

            // Update artist salon and add membership
            user.ArtistProfile.SalonId = invitation.SalonId;
            await _userRepository.UpdateArtistProfileAsync(user.ArtistProfile);

            var existingMemberships = await _salonRepository.GetMembersAsync(invitation.SalonId);
            var alreadyMember = existingMemberships.Any(m => m.ArtistId == user.ArtistProfile.Id);
            if (!alreadyMember)
            {
                await _salonRepository.AddMembershipAsync(new SalonMembership
                {
                    SalonId = invitation.SalonId,
                    ArtistId = user.ArtistProfile.Id,
                    Role = "artist",
                    Status = "active",
                    JoinedAt = DateTime.UtcNow
                });
            }

            // Update subscription if needed
            subscription = await _salonRepository.GetSubscriptionAsync(invitation.SalonId);
            if (subscription != null)
            {
                var memberCount = await _salonRepository.GetActiveArtistCountAsync(invitation.SalonId);
                var updatedArtistCount = Math.Max(subscription.ArtistCount, memberCount);
                if (subscription.ArtistCount != updatedArtistCount)
                {
                    subscription.ArtistCount = updatedArtistCount;
                    subscription.MonthlyCost = updatedArtistCount * ArtistSeatPrice;
                    subscription.Status = subscription.Status == "trial" ? "trial" : "active";
                    await _salonRepository.UpsertSubscriptionAsync(subscription);
                }
            }

            invitation.Status = "accepted";
            await _salonRepository.UpdateInvitationAsync(invitation);

            return await BuildSalonDtoAsync(invitation.SalonId);
        }

        public async Task<bool> RemoveArtistAsync(Guid salonId, Guid artistId, Guid ownerUserId)
        {
            var salon = await _salonRepository.GetSalonByIdAsync(salonId)
                ?? throw new KeyNotFoundException("Salon not found");

            if (salon.OwnerUserId != ownerUserId)
            {
                throw new UnauthorizedAccessException("Only the salon owner can remove artists");
            }

            var members = await _salonRepository.GetMembersAsync(salonId);
            var targetMember = members.FirstOrDefault(m => m.ArtistId == artistId);
            if (targetMember == null)
            {
                return false;
            }

            var removed = await _salonRepository.RemoveMembershipAsync(salonId, artistId);
            if (!removed)
            {
                return false;
            }

            // Clear salon assignment on artist profile
            if (targetMember.Artist != null)
            {
                targetMember.Artist.SalonId = null;
                await _userRepository.UpdateArtistProfileAsync(targetMember.Artist);
            }

            var subscription = await _salonRepository.GetSubscriptionAsync(salonId);
            if (subscription != null)
            {
                var memberCount = await _salonRepository.GetActiveArtistCountAsync(salonId);
                var updatedArtistCount = Math.Max(subscription.ArtistCount, Math.Max(3, memberCount));
                subscription.ArtistCount = updatedArtistCount;
                subscription.MonthlyCost = updatedArtistCount * ArtistSeatPrice;
                subscription.Status = subscription.Status == "cancelled" ? subscription.Status : "active";
                await _salonRepository.UpsertSubscriptionAsync(subscription);
            }

            return true;
        }

        public async Task<bool> LeaveSalonAsync(Guid salonId, Guid artistUserId)
        {
            var user = await _userRepository.GetUserByIdWithArtistProfileAsync(artistUserId)
                ?? throw new InvalidOperationException("User not found");

            if (user.ArtistProfile == null)
            {
                throw new InvalidOperationException("Artist profile not found");
            }

            var removed = await _salonRepository.RemoveMembershipAsync(salonId, user.ArtistProfile.Id);
            if (removed)
            {
                user.ArtistProfile.SalonId = null;
                await _userRepository.UpdateArtistProfileAsync(user.ArtistProfile);
            }

            return removed;
        }

        public async Task<bool> ToggleOwnerAsArtistAsync(Guid salonId, Guid ownerUserId, bool isArtist)
        {
            var salon = await _salonRepository.GetSalonByIdAsync(salonId)
                ?? throw new KeyNotFoundException("Salon not found");

            if (salon.OwnerUserId != ownerUserId)
            {
                throw new UnauthorizedAccessException("Only the salon owner can toggle their artist status");
            }

            var owner = await _userRepository.GetUserByIdWithArtistProfileAsync(ownerUserId)
                ?? throw new InvalidOperationException("Owner not found");

            if (owner.ArtistProfile == null)
            {
                throw new InvalidOperationException("Owner artist profile not found");
            }

            if (isArtist)
            {
                // Add owner as artist - ensure SalonId is set
                if (owner.ArtistProfile.SalonId != salonId)
                {
                    owner.ArtistProfile.SalonId = salonId;
                    await _userRepository.UpdateArtistProfileAsync(owner.ArtistProfile);
                }

                // Ensure membership exists (it should already exist with role "owner")
                var members = await _salonRepository.GetMembersAsync(salonId);
                var ownerMembership = members.FirstOrDefault(m => m.ArtistId == owner.ArtistProfile.Id);
                if (ownerMembership == null)
                {
                    await _salonRepository.AddMembershipAsync(new SalonMembership
                    {
                        SalonId = salonId,
                        ArtistId = owner.ArtistProfile.Id,
                        Role = "owner",
                        JoinedAt = DateTime.UtcNow,
                        Status = "active"
                    });
                }
            }
            else
            {
                // Remove owner as artist - clear SalonId but keep membership with role "owner"
                // This prevents them from accessing /dashboard/:artistId but keeps them as owner
                owner.ArtistProfile.SalonId = null;
                await _userRepository.UpdateArtistProfileAsync(owner.ArtistProfile);
            }

            return true;
        }

        public async Task<SalonSubscriptionDto> GetSubscriptionAsync(Guid salonId)
        {
            var subscription = await _salonRepository.GetSubscriptionAsync(salonId);
            if (subscription == null)
            {
                var memberCount = Math.Max(3, await _salonRepository.GetActiveArtistCountAsync(salonId));
                subscription = new SalonSubscription
                {
                    SalonId = salonId,
                    ArtistCount = memberCount,
                    MonthlyCost = memberCount * ArtistSeatPrice,
                    BillingCycle = "monthly",
                    Status = "active",
                    CurrentPeriodStart = DateTime.UtcNow,
                    CurrentPeriodEnd = DateTime.UtcNow.AddMonths(1),
                    NextPaymentDate = DateTime.UtcNow.AddMonths(1)
                };
            }

            return MapSubscription(subscription);
        }

        public async Task<SalonSubscriptionDto> UpdateSubscriptionAsync(Guid salonId, Guid ownerUserId, UpdateSalonSubscriptionRequestDto request)
        {
            var salon = await _salonRepository.GetSalonByIdAsync(salonId)
                ?? throw new KeyNotFoundException("Salon not found");

            if (salon.OwnerUserId != ownerUserId)
            {
                throw new UnauthorizedAccessException("Only the salon owner can manage subscription");
            }

            // Get existing subscription to preserve PaddleSubscriptionId
            var existingSubscription = await _salonRepository.GetSubscriptionAsync(salonId);
            
            // Reject artist count updates - users must contact support to change artist count
            if (request.ArtistCount > 0 && existingSubscription != null && request.ArtistCount != existingSubscription.ArtistCount)
            {
                throw new InvalidOperationException("To change the number of artists, please contact support directly. Artist count changes are not available through the self-service portal.");
            }
            
            // Use existing artist count if no change is requested, or if it's a new subscription
            var artistCount = existingSubscription != null 
                ? existingSubscription.ArtistCount 
                : Math.Max(3, request.ArtistCount);
            var status = string.IsNullOrWhiteSpace(request.Status) ? "active" : request.Status;
            var keepOwnerSubscription = request.KeepOwnerSubscription;
            var subscription = new SalonSubscription
            {
                SalonId = salonId,
                ArtistCount = artistCount,
                MonthlyCost = artistCount * ArtistSeatPrice,
                BillingCycle = request.BillingCycle ?? existingSubscription?.BillingCycle ?? "monthly",
                Status = status ?? "active",
                CurrentPeriodStart = existingSubscription?.CurrentPeriodStart ?? DateTime.UtcNow,
                CurrentPeriodEnd = existingSubscription?.CurrentPeriodEnd ?? DateTime.UtcNow.AddMonths(1),
                NextPaymentDate = existingSubscription?.NextPaymentDate ?? DateTime.UtcNow.AddMonths(1),
                TrialEndsAt = status == "trial" ? DateTime.UtcNow.AddMonths(1) : existingSubscription?.TrialEndsAt,
                PaddleSubscriptionId = existingSubscription?.PaddleSubscriptionId, // Preserve Paddle subscription ID
                UpdatedAt = DateTime.UtcNow
            };

            // If cancelling subscription (downgrading from Enterprise), cancel Paddle subscription, remove all members, clear salon associations, and hard delete the salon
            if (status == "cancelled")
            {
                // Cancel Paddle subscription if it exists
                if (existingSubscription != null && !string.IsNullOrEmpty(existingSubscription.PaddleSubscriptionId))
                {
                    try
                    {
                        await CancelPaddleSubscriptionAsync(existingSubscription.PaddleSubscriptionId);
                        _logger.LogInformation("Cancelled Paddle subscription {SubscriptionId} for salon {SalonId}", 
                            existingSubscription.PaddleSubscriptionId, salonId);
                    }
                    catch (Exception ex)
                    {
                        _logger.LogError(ex, "Failed to cancel Paddle subscription {SubscriptionId} for salon {SalonId}. Continuing with salon deletion.", 
                            existingSubscription.PaddleSubscriptionId, salonId);
                        // Continue with salon deletion even if Paddle cancellation fails
                    }
                }
                
                var members = await _salonRepository.GetMembersAsync(salonId);
                
                // Clear SalonId for all artists in the salon and handle trial subscriptions
                foreach (var member in members)
                {
                    if (member.Artist != null && member.Artist.SalonId == salonId)
                    {
                        // Get the user to check trial eligibility
                        var memberUser = await _userRepository.GetUserByIdWithArtistProfileAsync(member.Artist.UserId);
                        
                        // Clear salon association
                        member.Artist.SalonId = null;
                        await _userRepository.UpdateArtistProfileAsync(member.Artist);
                        
                        // Option C (strict): Give free trial only if they haven't used one
                        if (memberUser != null && !memberUser.HasUsedProTrial)
                        {
                            // Create 30-day free trial subscription
                            var trialSubscription = new ArtistSubscription
                            {
                                ArtistId = member.Artist.Id,
                                PlanId = Guid.Empty,
                                BillingCycle = "trial",
                                Status = "active",
                                CurrentPeriodStart = DateTime.UtcNow,
                                CurrentPeriodEnd = DateTime.UtcNow.AddDays(30),
                                TrialEndsAt = DateTime.UtcNow.AddDays(30),
                                CreatedAt = DateTime.UtcNow,
                                UpdatedAt = DateTime.UtcNow
                            };
                            
                            await _userRepository.CreateArtistSubscriptionAsync(trialSubscription);
                            
                            // Mark user as having used Pro trial
                            memberUser.HasUsedProTrial = true;
                            await _userRepository.UpdateUserAsync(memberUser);
                            
                            _logger.LogInformation("Cleared salon association for artist {ArtistId} - created 30-day free trial subscription", member.ArtistId);
                        }
                        else
                        {
                            _logger.LogInformation("Cleared salon association for artist {ArtistId} - moved to Free plan (trial already used or user not found)", member.ArtistId);
                        }
                    }
                    
                    // Remove membership
                    await _salonRepository.RemoveMembershipAsync(salonId, member.ArtistId);
                }
                
                // Clear owner's salonId and cancel their individual Pro subscription if they have one
                var owner = await _userRepository.GetUserByIdWithArtistProfileAsync(ownerUserId);
                if (owner?.ArtistProfile != null)
                {
                    if (!keepOwnerSubscription)
                    {
                        // Cancel owner's individual Pro subscription if they have one (including trial subscriptions)
                        // Use GetSubscriptionByArtistIdAsync which gets active or trial subscriptions
                        var ownerSubscription = await _userRepository.GetSubscriptionByArtistIdAsync(owner.ArtistProfile.Id, null);
                        
                        if (ownerSubscription == null)
                        {
                            _logger.LogInformation("No active or trial subscription found for owner {OwnerId}. Owner will be moved to Free plan.", ownerUserId);
                        }
                        
                        if (ownerSubscription != null)
                        {
                            try
                            {
                                _logger.LogInformation("Found owner subscription (ID: {SubscriptionId}, Status: {Status}, Paddle: {PaddleId}) - cancelling now", 
                                    ownerSubscription.Id, ownerSubscription.Status, ownerSubscription.PaddleSubscriptionId ?? "none");
                                
                                // Cancel Paddle subscription if it exists
                                if (!string.IsNullOrEmpty(ownerSubscription.PaddleSubscriptionId))
                                {
                                    var paddleApiKey = Environment.GetEnvironmentVariable("PADDLE_API_KEY") 
                                        ?? _configuration["PaddleSettings:ApiKey"];
                                    var paddleEnvironment = Environment.GetEnvironmentVariable("PADDLE_ENVIRONMENT") 
                                        ?? _configuration["PaddleSettings:Environment"] 
                                        ?? "sandbox";
                                    
                                    if (!string.IsNullOrEmpty(paddleApiKey))
                                    {
                                        var baseUrl = paddleEnvironment == "production" 
                                            ? "https://api.paddle.com" 
                                            : "https://sandbox-api.paddle.com";

                                        var httpClient = _httpClientFactory.CreateClient();
                                        httpClient.DefaultRequestHeaders.Add("Authorization", $"Bearer {paddleApiKey}");

                                        var cancelUrl = $"{baseUrl}/subscriptions/{ownerSubscription.PaddleSubscriptionId}/cancel";
                                        var requestBody = new { effective_from = "immediately" };
                                        var jsonContent = JsonSerializer.Serialize(requestBody);
                                        var content = new StringContent(jsonContent, Encoding.UTF8, "application/json");
                                        
                                        var response = await httpClient.PostAsync(cancelUrl, content);
                                        if (response.IsSuccessStatusCode)
                                        {
                                            _logger.LogInformation("Cancelled owner's Paddle subscription {SubscriptionId}", ownerSubscription.PaddleSubscriptionId);
                                        }
                                        else
                                        {
                                            var errorContent = await response.Content.ReadAsStringAsync();
                                            _logger.LogWarning("Failed to cancel owner's Paddle subscription {SubscriptionId}. Status: {StatusCode}, Error: {Error}. Will still cancel in database.", 
                                                ownerSubscription.PaddleSubscriptionId, response.StatusCode, errorContent);
                                        }
                                    }
                                }
                                else
                                {
                                    _logger.LogInformation("Owner subscription has no PaddleSubscriptionId (likely trial) - will cancel in database only");
                                }
                                
                                // Always update database to cancelled status, regardless of Paddle cancellation result
                                // This ensures the owner is moved to Free plan even if Paddle cancellation fails
                                ownerSubscription.Status = "cancelled";
                                ownerSubscription.CancelledAt = DateTime.UtcNow;
                                ownerSubscription.UpdatedAt = DateTime.UtcNow;
                                await _userRepository.UpdateSubscriptionAsync(ownerSubscription);
                                _logger.LogInformation("Successfully cancelled owner's Pro subscription (ID: {SubscriptionId}, Paddle: {PaddleId}) - owner moved to Free plan", 
                                    ownerSubscription.Id, ownerSubscription.PaddleSubscriptionId ?? "none");
                            }
                            catch (Exception ex)
                            {
                                _logger.LogError(ex, "Failed to cancel owner's Pro subscription. Continuing with salon deletion.");
                                // Try to at least update the status in database
                                try
                                {
                                    // ownerSubscription is not null here
                                    ownerSubscription.Status = "cancelled";
                                    ownerSubscription.CancelledAt = DateTime.UtcNow;
                                    ownerSubscription.UpdatedAt = DateTime.UtcNow;
                                    await _userRepository.UpdateSubscriptionAsync(ownerSubscription);
                                    _logger.LogInformation("Updated owner's subscription status to cancelled in database despite Paddle cancellation failure");
                                }
                                catch (Exception dbEx)
                                {
                                    _logger.LogError(dbEx, "Failed to update owner's subscription status in database");
                                }
                            }
                        }
                        else
                        {
                            _logger.LogInformation("Owner {OwnerId} has no active or trial Pro subscription to cancel", ownerUserId);
                        }
                    }
                    else
                    {
                        _logger.LogInformation("Preserving owner subscription while cancelling salon {SalonId} (KeepOwnerSubscription = true)", salonId);
                    }
                    
                    // Clear salon association
                    if (owner.ArtistProfile.SalonId == salonId)
                    {
                        owner.ArtistProfile.SalonId = null;
                        await _userRepository.UpdateArtistProfileAsync(owner.ArtistProfile);
                        _logger.LogInformation("Cleared salon association for owner {OwnerId} - moved to Free plan", ownerUserId);
                    }
                }
                
                // Hard delete the salon
                await _salonRepository.DeleteSalonAsync(salonId);
                
                _logger.LogInformation("Cancelled salon subscription for salon {SalonId}. Removed {MemberCount} members, cleared salon associations, cancelled Paddle subscription, and deleted salon. All artists moved to Free plan.", 
                    salonId, members.Count);
                
                // Return a cancelled subscription DTO since salon is deleted
                return new SalonSubscriptionDto
                {
                    PlanType = "enterprise",
                    ArtistCount = 0,
                    MonthlyCost = 0,
                    BillingCycle = "monthly",
                    Status = "cancelled",
                    CurrentPeriodStart = existingSubscription?.CurrentPeriodStart ?? DateTime.UtcNow,
                    CurrentPeriodEnd = existingSubscription?.CurrentPeriodEnd ?? DateTime.UtcNow,
                    NextPaymentDate = existingSubscription?.NextPaymentDate ?? DateTime.UtcNow,
                    TrialEndsAt = null
                };
            }
            
            // Note: Artist count updates via Paddle are disabled - users must contact support
            // The UpdatePaddleSubscriptionQuantityAsync method is kept for potential future use by support/admin tools
            // but is no longer called from this endpoint since artist count changes are blocked

            var updated = await _salonRepository.UpsertSubscriptionAsync(subscription);
            return MapSubscription(updated);
        }

        private async Task CancelPaddleSubscriptionAsync(string paddleSubscriptionId)
        {
            var paddleEnvironment = Environment.GetEnvironmentVariable("PADDLE_ENVIRONMENT") 
                ?? _configuration["PaddleSettings:Environment"] 
                ?? "sandbox";
            var paddleApiKey = Environment.GetEnvironmentVariable("PADDLE_API_KEY") 
                ?? _configuration["PaddleSettings:ApiKey"];
            
            if (string.IsNullOrEmpty(paddleApiKey))
            {
                _logger.LogWarning("Paddle API key not configured. Skipping Paddle subscription cancellation. Set PADDLE_API_KEY environment variable or configure in appsettings.json");
                return;
            }
            
            var baseUrl = paddleEnvironment == "production" 
                ? "https://api.paddle.com" 
                : "https://sandbox-api.paddle.com";

            var httpClient = _httpClientFactory.CreateClient();
            httpClient.DefaultRequestHeaders.Add("Authorization", $"Bearer {paddleApiKey}");

            try
            {
                var cancelUrl = $"{baseUrl}/subscriptions/{paddleSubscriptionId}/cancel";
                
                // Request body: cancel immediately
                var requestBody = new
                {
                    effective_from = "immediately"
                };

                var jsonContent = JsonSerializer.Serialize(requestBody);
                var content = new StringContent(jsonContent, Encoding.UTF8, "application/json");
                
                _logger.LogInformation("Cancelling Paddle subscription {SubscriptionId}", paddleSubscriptionId);
                
                var response = await httpClient.PostAsync(cancelUrl, content);
                
                if (!response.IsSuccessStatusCode)
                {
                    var errorContent = await response.Content.ReadAsStringAsync();
                    _logger.LogError("Failed to cancel Paddle subscription {SubscriptionId}. Status: {StatusCode}, Error: {Error}", 
                        paddleSubscriptionId, response.StatusCode, errorContent);
                    throw new HttpRequestException($"Failed to cancel subscription in Paddle: {response.StatusCode} - {errorContent}");
                }

                var responseContent = await response.Content.ReadAsStringAsync();
                _logger.LogInformation("Successfully cancelled Paddle subscription {SubscriptionId}. Response: {Response}", 
                    paddleSubscriptionId, responseContent);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error cancelling Paddle subscription {SubscriptionId}", paddleSubscriptionId);
                throw;
            }
        }

        private async Task UpdatePaddleSubscriptionQuantityAsync(string paddleSubscriptionId, int quantity, string? billingCycle = null)
        {
            // Check environment variables first, then fall back to appsettings
            var paddleEnvironment = Environment.GetEnvironmentVariable("PADDLE_ENVIRONMENT") 
                ?? _configuration["PaddleSettings:Environment"] 
                ?? "sandbox";
            var paddleApiKey = Environment.GetEnvironmentVariable("PADDLE_API_KEY") 
                ?? _configuration["PaddleSettings:ApiKey"];
            
            if (string.IsNullOrEmpty(paddleApiKey))
            {
                _logger.LogWarning("Paddle API key not configured. Skipping Paddle subscription update. Set PADDLE_API_KEY environment variable or configure in appsettings.json");
                return;
            }
            
            _logger.LogInformation("Updating Paddle subscription {SubscriptionId} quantity to {Quantity} using API key: {ApiKeyPrefix}...", 
                paddleSubscriptionId, quantity, paddleApiKey.Substring(0, Math.Min(10, paddleApiKey.Length)));

            var baseUrl = paddleEnvironment == "production" 
                ? "https://api.paddle.com" 
                : "https://sandbox-api.paddle.com";

            var httpClient = _httpClientFactory.CreateClient();
            httpClient.DefaultRequestHeaders.Add("Authorization", $"Bearer {paddleApiKey}");

            try
            {
                // Step 1: Get the current subscription to extract the price ID
                var getUrl = $"{baseUrl}/subscriptions/{paddleSubscriptionId}";
                var getResponse = await httpClient.GetAsync(getUrl);
                
                if (!getResponse.IsSuccessStatusCode)
                {
                    var errorContent = await getResponse.Content.ReadAsStringAsync();
                    _logger.LogError("Failed to get Paddle subscription: {StatusCode} - {Error}", getResponse.StatusCode, errorContent);
                    throw new Exception($"Failed to get Paddle subscription: {getResponse.StatusCode}");
                }

                var subscriptionJson = await getResponse.Content.ReadAsStringAsync();
            _logger.LogInformation("=== PADDLE SUBSCRIPTION GET RESPONSE ===");
            _logger.LogInformation("Subscription ID: {SubscriptionId}", paddleSubscriptionId);
            _logger.LogInformation("Full JSON Response: {Response}", subscriptionJson);
            
                var subscriptionDoc = JsonDocument.Parse(subscriptionJson);
                var subscriptionData = subscriptionDoc.RootElement;

            // Log all top-level properties for debugging
            var rootProperties = subscriptionData.EnumerateObject().Select(p => p.Name).ToList();
            _logger.LogInformation("Top-level properties in Paddle subscription response: {Properties}", string.Join(", ", rootProperties));

            // Check for scheduled changes (must be null to make updates)
                if (subscriptionData.TryGetProperty("scheduled_change", out var scheduledChange) && scheduledChange.ValueKind != JsonValueKind.Null)
                {
                    _logger.LogWarning("Cannot update subscription {SubscriptionId} - there is a pending scheduled change. Scheduled change: {ScheduledChange}", 
                        paddleSubscriptionId, scheduledChange.GetRawText());
                    throw new InvalidOperationException("Cannot update subscription: there is a pending scheduled change. Please wait for it to complete.");
                }

                // Check subscription status (must not be past_due)
                if (subscriptionData.TryGetProperty("status", out var statusElement))
                {
                    var status = statusElement.GetString();
                    if (status == "past_due")
                    {
                        _logger.LogWarning("Cannot update subscription {SubscriptionId} - subscription is past_due", paddleSubscriptionId);
                        throw new InvalidOperationException("Cannot update subscription: subscription is past_due. Please resolve payment issues first.");
                    }
                }

                // Check next_billed_at (must be more than 30 minutes away)
                if (subscriptionData.TryGetProperty("next_billed_at", out var nextBilledAtElement))
                {
                    if (nextBilledAtElement.ValueKind == JsonValueKind.String && DateTime.TryParse(nextBilledAtElement.GetString(), out var nextBilledAt))
                    {
                        var timeUntilBilling = nextBilledAt - DateTime.UtcNow;
                        if (timeUntilBilling.TotalMinutes < 30)
                        {
                            _logger.LogWarning("Cannot update subscription {SubscriptionId} - next billing is within 30 minutes ({Minutes} minutes away)", 
                                paddleSubscriptionId, timeUntilBilling.TotalMinutes);
                            throw new InvalidOperationException($"Cannot update subscription: next billing is within 30 minutes. Please wait until after the next billing cycle.");
                        }
                    }
                }

                // Extract ALL items from subscription - we must include all of them in the update
                // Paddle API v2 might return items in a "data" wrapper or directly
                JsonElement items;
                bool hasItems = false;
                
                // Try to get items from root level first
                if (subscriptionData.TryGetProperty("items", out items) && items.ValueKind == JsonValueKind.Array && items.GetArrayLength() > 0)
                {
                    hasItems = true;
                    _logger.LogInformation("Found {Count} items in subscription {SubscriptionId} at root level", items.GetArrayLength(), paddleSubscriptionId);
                }
                // If not found, try data.items (some Paddle responses are wrapped)
                else if (subscriptionData.TryGetProperty("data", out var dataElement))
                {
                    if (dataElement.TryGetProperty("items", out items) && items.ValueKind == JsonValueKind.Array && items.GetArrayLength() > 0)
                    {
                        hasItems = true;
                        _logger.LogInformation("Found {Count} items in subscription {SubscriptionId} at data.items", items.GetArrayLength(), paddleSubscriptionId);
                    }
                }
                
                if (!hasItems)
                {
                    _logger.LogError("No items found in Paddle subscription {SubscriptionId}. Response structure: {Response}. Available properties: {Properties}", 
                        paddleSubscriptionId, subscriptionJson, string.Join(", ", subscriptionData.EnumerateObject().Select(p => p.Name)));
                    throw new InvalidOperationException($"No items found in Paddle subscription. Cannot update quantity. Please check the subscription in Paddle dashboard.");
                }

                // Find the main subscription item (the one we want to update)
                // For enterprise subscriptions, this should be the price_id we're using
                // IMPORTANT: We need to consolidate items with the same price_id to avoid duplicates
                string? targetPriceId = null;
                string? targetSubscriptionItemId = null;
                var priceIdToItemMap = new Dictionary<string, (string? itemId, int totalQuantity)>();
                var allItems = new List<Dictionary<string, object>>();

                // Log the raw items array first
                _logger.LogInformation("=== ANALYZING PADDLE SUBSCRIPTION ITEMS ===");
                _logger.LogInformation("Total items found in subscription: {ItemCount}", items.GetArrayLength());
                
                // First pass: Consolidate all items by price_id
                int itemIndex = 0;
                foreach (var item in items.EnumerateArray())
                {
                    itemIndex++;
                    string? priceId = null;
                    string? subscriptionItemId = null;
                    
                    // Log the raw item JSON for debugging
                    var itemJson = item.GetRawText();
                    _logger.LogInformation("--- Item #{ItemIndex} Raw JSON: {ItemJson}", itemIndex, itemJson);
                    
                    // Get subscription item ID (required to update existing item, not create new one)
                    if (item.TryGetProperty("id", out var itemIdElement))
                    {
                        subscriptionItemId = itemIdElement.GetString();
                        _logger.LogInformation("Item #{ItemIndex} - Subscription Item ID: {ItemId}", itemIndex, subscriptionItemId);
                    }
                    else
                    {
                        _logger.LogWarning("Item #{ItemIndex} - NO subscription item ID found!", itemIndex);
                    }
                    
                    // Try to get price_id from the item's price property
                    if (item.TryGetProperty("price", out var priceElement))
                    {
                        if (priceElement.TryGetProperty("id", out var priceIdElement))
                        {
                            priceId = priceIdElement.GetString();
                            _logger.LogInformation("Item #{ItemIndex} - Price ID from price.id: {PriceId}", itemIndex, priceId);
                        }
                    }

                    // Fallback: try to get price_id directly from item
                    if (string.IsNullOrEmpty(priceId) && item.TryGetProperty("price_id", out var priceIdDirectElement))
                    {
                        priceId = priceIdDirectElement.GetString();
                        _logger.LogInformation("Item #{ItemIndex} - Price ID from price_id: {PriceId}", itemIndex, priceId);
                    }

                    if (string.IsNullOrEmpty(priceId))
                    {
                        _logger.LogWarning("Item #{ItemIndex} - Skipping item without price_id in subscription {SubscriptionId}", itemIndex, paddleSubscriptionId);
                        continue;
                    }

                    // Get current quantity from this item
                    var currentQuantity = item.TryGetProperty("quantity", out var quantityElement) 
                        ? quantityElement.GetInt32() 
                        : 1;
                    
                    _logger.LogInformation("Item #{ItemIndex} - Price ID: {PriceId}, Quantity: {Quantity}, Item ID: {ItemId}", 
                        itemIndex, priceId, currentQuantity, subscriptionItemId ?? "NONE");

                    // Consolidate items with the same price_id (sum their quantities)
                    if (priceIdToItemMap.ContainsKey(priceId))
                    {
                        var existing = priceIdToItemMap[priceId];
                        var oldTotal = existing.totalQuantity;
                        priceIdToItemMap[priceId] = (existing.itemId ?? subscriptionItemId, existing.totalQuantity + currentQuantity);
                        _logger.LogWarning("⚠️ DUPLICATE DETECTED! Item #{ItemIndex} has same price_id {PriceId}. " +
                            "Consolidating: existing qty {ExistingQty} + new qty {NewQty} = {TotalQty}. " +
                            "Using Item ID: {ItemId}",
                            itemIndex, priceId, existing.totalQuantity, currentQuantity, existing.totalQuantity + currentQuantity,
                            existing.itemId ?? subscriptionItemId ?? "NONE");
                    }
                    else
                    {
                        priceIdToItemMap[priceId] = (subscriptionItemId, currentQuantity);
                        _logger.LogInformation("Item #{ItemIndex} - Added to map. Price ID: {PriceId}, Quantity: {Quantity}, Item ID: {ItemId}",
                            itemIndex, priceId, currentQuantity, subscriptionItemId ?? "NONE");
                    }
                }
                
                _logger.LogInformation("=== CONSOLIDATION SUMMARY ===");
                _logger.LogInformation("Unique price_ids found: {Count}", priceIdToItemMap.Count);
                foreach (var kvp in priceIdToItemMap)
                {
                    _logger.LogInformation("  Price ID: {PriceId}, Total Quantity: {Quantity}, Item ID: {ItemId}",
                        kvp.Key, kvp.Value.totalQuantity, kvp.Value.itemId ?? "NONE");
                }

                // Identify target price_id
                if (!string.IsNullOrEmpty(billingCycle))
                {
                    var monthlyPriceId = _configuration["PaddleSettings:EnterpriseMonthlyPriceId"] ?? "pri_01kbz5qtn9a999pkw9frn4zkpr";
                    var yearlyPriceId = _configuration["PaddleSettings:EnterpriseYearlyPriceId"] ?? "pri_01kbz5s51g3m4fham5q2c5k9ap";
                    var expectedPriceId = billingCycle.ToLower() == "yearly" ? yearlyPriceId : monthlyPriceId;
                    if (priceIdToItemMap.ContainsKey(expectedPriceId))
                    {
                        targetPriceId = expectedPriceId;
                        targetSubscriptionItemId = priceIdToItemMap[expectedPriceId].itemId;
                    }
                }
                
                // If we haven't found the target yet, use the first item with the highest quantity
                if (targetPriceId == null && priceIdToItemMap.Count > 0)
                {
                    var maxEntry = priceIdToItemMap.OrderByDescending(kvp => kvp.Value.totalQuantity).First();
                    targetPriceId = maxEntry.Key;
                    targetSubscriptionItemId = maxEntry.Value.itemId;
                }

                // Second pass: Build the items array with consolidated quantities
                // IMPORTANT: According to Paddle API docs, we should NOT include the subscription item 'id' field
                // Paddle identifies items by price_id and will update existing items with matching price_id
                // Items NOT in the array will be removed (this removes duplicates)
                foreach (var kvp in priceIdToItemMap)
                {
                    var priceId = kvp.Key;
                    var (itemId, currentQuantity) = kvp.Value;

                    // Build item dict - only include price_id and quantity (NOT id)
                    // Paddle will automatically update the existing item with matching price_id
                    var itemDict = new Dictionary<string, object>();
                    
                    // Always include price_id
                    itemDict["price_id"] = priceId;

                    // Update quantity only for the target price_id, keep others as-is
                    if (priceId == targetPriceId)
                    {
                        itemDict["quantity"] = quantity;
                        _logger.LogInformation("Updating quantity for price {PriceId} from {OldQuantity} to {NewQuantity}. " +
                            "Paddle will update existing item(s) with this price_id and remove any duplicates.", 
                            priceId, currentQuantity, quantity);
                    }
                    else
                    {
                        // Keep existing consolidated quantity for other items
                        itemDict["quantity"] = currentQuantity;
                        _logger.LogInformation("Keeping existing quantity {Quantity} for price {PriceId}", 
                            currentQuantity, priceId);
                    }

                    allItems.Add(itemDict);
                }
                
                _logger.LogInformation("Consolidated {OriginalItemCount} items into {ConsolidatedItemCount} items (one per price_id). " +
                    "Target price_id {TargetPriceId} will be updated to quantity {Quantity}.",
                    items.GetArrayLength(), allItems.Count, targetPriceId ?? "none", quantity);

                if (string.IsNullOrEmpty(targetPriceId))
                {
                    _logger.LogWarning("No valid price ID found in Paddle subscription {SubscriptionId} items", paddleSubscriptionId);
                    return;
                }

                if (allItems.Count == 0)
                {
                    _logger.LogWarning("No valid items to update in subscription {SubscriptionId}", paddleSubscriptionId);
                    return;
                }

                _logger.LogInformation("Prepared update for subscription {SubscriptionId} with {ItemCount} items. Target price: {PriceId}, New quantity: {Quantity}", 
                    paddleSubscriptionId, allItems.Count, targetPriceId, quantity);
                
                // Log each item being sent to verify quantities
                foreach (var item in allItems)
                {
                    _logger.LogInformation("Item in update request: PriceId={PriceId}, Quantity={Quantity}", 
                        item.ContainsKey("price_id") ? item["price_id"] : "unknown",
                        item.ContainsKey("quantity") ? item["quantity"] : "unknown");
                }

                // Step 2: Update the subscription using the new API approach
                // Paddle API v2 endpoint: PATCH /subscriptions/{subscription_id}
                var updateUrl = $"{baseUrl}/subscriptions/{paddleSubscriptionId}";
                
                // Build request body with ALL items and proration_billing_mode
                // According to Paddle docs, we MUST send the complete list of items
                // Using "do_not_bill" to avoid proration credits/charges - changes take effect on next billing date
                // This ensures the next payment is exactly (new_quantity × price) without proration adjustments
                var requestBody = new Dictionary<string, object>
                {
                    { "proration_billing_mode", "do_not_bill" },
                    { "items", allItems }
                };

                var json = JsonSerializer.Serialize(requestBody);
                _logger.LogInformation("=== PADDLE UPDATE REQUEST ===");
                _logger.LogInformation("URL: {Url}", updateUrl);
                _logger.LogInformation("Request Body JSON: {Json}", json);
                
                // Log each item in the request in detail
                _logger.LogInformation("Items being sent to Paddle:");
                for (int i = 0; i < allItems.Count; i++)
                {
                    var item = allItems[i];
                    var itemJson = JsonSerializer.Serialize(item);
                    _logger.LogInformation("  Item #{Index}: {ItemJson}", i + 1, itemJson);
                }
                
                var content = new StringContent(json, Encoding.UTF8, "application/json");
                content.Headers.ContentType = new System.Net.Http.Headers.MediaTypeHeaderValue("application/json");

                _logger.LogInformation("Sending PATCH request to Paddle...");
                var updateResponse = await httpClient.PatchAsync(updateUrl, content);
                
                var responseContent = await updateResponse.Content.ReadAsStringAsync();
                _logger.LogInformation("=== PADDLE UPDATE RESPONSE ===");
                _logger.LogInformation("Status Code: {StatusCode}", updateResponse.StatusCode);
                _logger.LogInformation("Response Body: {Response}", responseContent);
                
                if (!updateResponse.IsSuccessStatusCode)
                {
                    _logger.LogError("❌ PADDLE API ERROR: {StatusCode} - {Error}. Request URL: {Url}, Request Body: {RequestBody}, Response: {Response}", 
                        updateResponse.StatusCode, responseContent, updateUrl, json, responseContent);
                    throw new Exception($"Failed to update Paddle subscription: {updateResponse.StatusCode} - {responseContent}");
                }

                // Verify the update actually worked by checking the response
                try
                {
                    _logger.LogInformation("=== VERIFYING PADDLE UPDATE RESPONSE ===");
                    var responseDoc = JsonDocument.Parse(responseContent);
                    var responseData = responseDoc.RootElement;
                    
                    // Check if items array in response shows the updated quantity
                    JsonElement responseItems;
                    if (responseData.TryGetProperty("data", out var responseDataElement))
                    {
                        if (responseDataElement.TryGetProperty("items", out responseItems))
                        {
                            _logger.LogInformation("Found items in response.data.items");
                        }
                        else
                        {
                            _logger.LogWarning("No items found in response.data.items");
                            responseItems = default;
                        }
                    }
                    else if (responseData.TryGetProperty("items", out responseItems))
                    {
                        _logger.LogInformation("Found items in response.items");
                    }
                    else
                    {
                        _logger.LogWarning("No items property found in response");
                        responseItems = default;
                    }
                    
                    if (responseItems.ValueKind == JsonValueKind.Array && responseItems.GetArrayLength() > 0)
                    {
                        _logger.LogInformation("Response contains {ItemCount} items", responseItems.GetArrayLength());
                        
                        int responseItemIndex = 0;
                        foreach (var responseItem in responseItems.EnumerateArray())
                        {
                            responseItemIndex++;
                            var responseItemJson = responseItem.GetRawText();
                            _logger.LogInformation("Response Item #{Index} JSON: {ItemJson}", responseItemIndex, responseItemJson);
                            
                            string? itemPriceId = null;
                            if (responseItem.TryGetProperty("price", out var respPriceElement) && respPriceElement.TryGetProperty("id", out var respPriceIdElement))
                            {
                                itemPriceId = respPriceIdElement.GetString();
                            }
                            else if (responseItem.TryGetProperty("price_id", out var respPriceIdDirect))
                            {
                                itemPriceId = respPriceIdDirect.GetString();
                            }
                            
                            if (responseItem.TryGetProperty("quantity", out var respQuantityElement))
                            {
                                var respQuantity = respQuantityElement.GetInt32();
                                _logger.LogInformation("Response Item #{Index} - Price ID: {PriceId}, Quantity: {Quantity}",
                                    responseItemIndex, itemPriceId ?? "unknown", respQuantity);
                                
                                if (itemPriceId == targetPriceId)
                                {
                                    if (respQuantity == quantity)
                                    {
                                        _logger.LogInformation("✅ SUCCESS! Target item quantity verified: {Quantity}", quantity);
                                    }
                                    else
                                    {
                                        _logger.LogWarning("⚠️ WARNING: Target item quantity mismatch. Expected: {Expected}, Got: {Got}",
                                            quantity, respQuantity);
                                    }
                                }
                            }
                        }
                    }
                    else
                    {
                        _logger.LogWarning("Could not find items array in response to verify update");
                    }
                }
                catch (Exception verifyEx)
                {
                    _logger.LogWarning(verifyEx, "Could not verify update in response, but API returned success. Response: {Response}", responseContent);
                }

                _logger.LogInformation("Paddle API returned success for subscription {SubscriptionId}. Response: {Response}", 
                    paddleSubscriptionId, responseContent);

                // Step 3: Call preview endpoint to see what Paddle will charge next
                try
                {
                    _logger.LogInformation("=== CHECKING PADDLE PREVIEW FOR NEXT PAYMENT ===");
                    var previewUrl = $"{baseUrl}/subscriptions/{paddleSubscriptionId}/preview";
                    var previewRequestBody = new Dictionary<string, object>
                    {
                        { "proration_billing_mode", "do_not_bill" },
                        { "items", allItems }
                    };
                    var previewJson = JsonSerializer.Serialize(previewRequestBody);
                    var previewContent = new StringContent(previewJson, Encoding.UTF8, "application/json");
                    previewContent.Headers.ContentType = new System.Net.Http.Headers.MediaTypeHeaderValue("application/json");
                    
                    _logger.LogInformation("Calling Paddle preview endpoint: {Url}", previewUrl);
                    _logger.LogInformation("Preview request body: {Json}", previewJson);
                    
                    var previewResponse = await httpClient.PatchAsync(previewUrl, previewContent);
                    var previewResponseContent = await previewResponse.Content.ReadAsStringAsync();
                    
                    if (previewResponse.IsSuccessStatusCode)
                    {
                        _logger.LogInformation("=== PADDLE PREVIEW RESPONSE ===");
                        _logger.LogInformation("Preview Response: {Response}", previewResponseContent);
                        
                        try
                        {
                            var previewDoc = JsonDocument.Parse(previewResponseContent);
                            var previewData = previewDoc.RootElement;
                            
                            // Try to extract next_transaction details
                            if (previewData.TryGetProperty("data", out var previewDataElement))
                            {
                                previewData = previewDataElement;
                            }
                            
                            if (previewData.TryGetProperty("next_transaction", out var nextTransaction))
                            {
                                _logger.LogInformation("=== NEXT TRANSACTION DETAILS ===");
                                
                                // Log line items
                                if (nextTransaction.TryGetProperty("details", out var details) && details.ValueKind == JsonValueKind.Array)
                                {
                                    var detailsArray = details.EnumerateArray().ToList();
                                    _logger.LogInformation("Next transaction has {ItemCount} line items", detailsArray.Count);
                                    decimal totalAmount = 0;
                                    int detailIndex = 0;
                                    int prorationCount = 0;
                                    
                                    foreach (var detail in detailsArray)
                                    {
                                        detailIndex++;
                                        string? detailDescription = null;
                                        decimal? detailAmount = null;
                                        bool hasProration = false;
                                        int? detailQuantity = null;
                                        
                                        if (detail.TryGetProperty("description", out var descElement))
                                        {
                                            detailDescription = descElement.GetString();
                                        }
                                        
                                        if (detail.TryGetProperty("quantity", out var qtyElement))
                                        {
                                            detailQuantity = qtyElement.GetInt32();
                                        }
                                        
                                        if (detail.TryGetProperty("proration", out var prorationElement) && prorationElement.ValueKind != JsonValueKind.Null)
                                        {
                                            hasProration = true;
                                            prorationCount++;
                                            
                                            // Log proration details
                                            if (prorationElement.TryGetProperty("rate", out var rateElement))
                                            {
                                                var rate = rateElement.GetString();
                                                _logger.LogInformation("  Line Item #{Index} - Proration rate: {Rate}", detailIndex, rate);
                                            }
                                        }
                                        
                                        if (detail.TryGetProperty("totals", out var totals))
                                        {
                                            if (totals.TryGetProperty("total", out var total) && total.TryGetProperty("amount", out var amount))
                                            {
                                                var amountStr = amount.GetString();
                                                if (decimal.TryParse(amountStr, out var amountValue))
                                                {
                                                    detailAmount = amountValue / 100; // Convert from cents
                                                    totalAmount += detailAmount.Value;
                                                }
                                            }
                                        }
                                        
                                        var prorationLabel = hasProration ? " [PRORATION]" : "";
                                        var quantityLabel = detailQuantity.HasValue ? $" (Qty: {detailQuantity.Value})" : "";
                                        var amountSign = detailAmount.HasValue && detailAmount.Value < 0 ? "CREDIT" : "";
                                        _logger.LogInformation("  Line Item #{Index}: {Description}{Quantity} = €{Amount}{Proration}{Credit}", 
                                            detailIndex, detailDescription ?? "Unknown", quantityLabel, 
                                            detailAmount?.ToString("F2") ?? "0.00", prorationLabel, amountSign);
                                    }
                                    
                                    _logger.LogInformation("=== PREVIEW LINE ITEMS TOTAL: €{Total} ===", totalAmount.ToString("F2"));
                                    
                                    // Warn if there are multiple prorations (indicates multiple updates)
                                    if (prorationCount > 1)
                                    {
                                        _logger.LogWarning("⚠️ WARNING: Found {ProrationCount} proration adjustments in next payment. " +
                                            "This indicates multiple quantity updates were made. Each update creates a proration adjustment. " +
                                            "To avoid this, make a single update to the final desired quantity instead of multiple incremental updates.",
                                            prorationCount);
                                    }
                                }
                                
                                // Log total
                                if (nextTransaction.TryGetProperty("totals", out var nextTotals))
                                {
                                    if (nextTotals.TryGetProperty("total", out var nextTotal) && nextTotal.TryGetProperty("amount", out var nextAmount))
                                    {
                                        var nextAmountStr = nextAmount.GetString();
                                        if (decimal.TryParse(nextAmountStr, out var nextAmountValue))
                                        {
                                            var previewTotal = nextAmountValue / 100;
                                            _logger.LogInformation("=== PREVIEW NEXT PAYMENT TOTAL: €{Total} ===", previewTotal.ToString("F2"));
                                            
                                            // Calculate expected base amount (without prorations)
                                            var expectedBaseAmount = quantity * 15; // €15 per artist
                                            
                                            if (Math.Abs(previewTotal - expectedBaseAmount) > 0.01m)
                                            {
                                                var difference = previewTotal - expectedBaseAmount;
                                                var isCredit = difference < 0;
                                                var differenceLabel = isCredit ? "CREDIT" : "CHARGE";
                                                
                                                _logger.LogWarning("⚠️ AMOUNT DIFFERENCE: Base subscription (€{Base}) {Sign} Prorations (€{Prorations}) = €{Total}. " +
                                                    "The difference (€{Difference}) is a {Type} from proration adjustments. " +
                                                    "When REDUCING quantity, Paddle creates a CREDIT (reduces next payment). " +
                                                    "When INCREASING quantity, Paddle creates a CHARGE (increases next payment). " +
                                                    "This is expected Paddle behavior with prorated_next_billing_period.",
                                                    expectedBaseAmount, isCredit ? "-" : "+", Math.Abs(difference).ToString("F2"), 
                                                    previewTotal.ToString("F2"), Math.Abs(difference).ToString("F2"), differenceLabel);
                                            }
                                            else
                                            {
                                                _logger.LogInformation("✅ Amount matches expected base: €{Amount}", expectedBaseAmount);
                                            }
                                        }
                                    }
                                }
                            }
                            else
                            {
                                _logger.LogWarning("No next_transaction found in preview response");
                            }
                        }
                        catch (Exception previewEx)
                        {
                            _logger.LogWarning(previewEx, "Could not parse preview response, but preview call succeeded");
                        }
                    }
                    else
                    {
                        _logger.LogWarning("Preview endpoint returned {StatusCode}: {Response}", previewResponse.StatusCode, previewResponseContent);
                    }
                }
                catch (Exception previewEx)
                {
                    _logger.LogWarning(previewEx, "Could not call preview endpoint, but update succeeded");
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating Paddle subscription {SubscriptionId}", paddleSubscriptionId);
                throw;
            }
        }

        public async Task CheckAndExpireTrialsAsync()
        {
            var allSubscriptions = await _salonRepository.GetAllSubscriptionsAsync();
            var expiredTrials = allSubscriptions
                .Where(s => s.Status == "trial" && s.TrialEndsAt.HasValue && s.TrialEndsAt.Value <= DateTime.UtcNow)
                .ToList();

            foreach (var subscription in expiredTrials)
            {
                subscription.Status = "expired";
                subscription.UpdatedAt = DateTime.UtcNow;
                await _salonRepository.UpsertSubscriptionAsync(subscription);
            }
        }

        public async Task ConvertTrialToPaidAsync(Guid salonId, string paddleSubscriptionId)
        {
            var subscription = await _salonRepository.GetSubscriptionAsync(salonId)
                ?? throw new KeyNotFoundException("Subscription not found");

            if (subscription.Status != "trial")
            {
                throw new InvalidOperationException("Subscription is not in trial status");
            }

            subscription.Status = "active";
            subscription.PaddleSubscriptionId = paddleSubscriptionId;
            subscription.TrialEndsAt = null;
            subscription.CurrentPeriodStart = DateTime.UtcNow;
            subscription.CurrentPeriodEnd = DateTime.UtcNow.AddMonths(1);
            subscription.NextPaymentDate = DateTime.UtcNow.AddMonths(1);
            subscription.UpdatedAt = DateTime.UtcNow;

            await _salonRepository.UpsertSubscriptionAsync(subscription);
        }

        public async Task<SalonAnalyticsDto> GetAnalyticsAsync(Guid salonId)
        {
            // Get optimized analytics data (no cartesian explosion)
            var analyticsData = await _salonRepository.GetAnalyticsDataAsync(salonId);
            var bookings = analyticsData.Bookings;
            var artistNames = analyticsData.ArtistNamesDict;
            var serviceNames = analyticsData.ServiceNamesDict;

            var revenue = bookings.Sum(b => b.TotalPrice ?? 0);
            var now = DateTime.UtcNow;
            var startOfMonth = new DateTime(now.Year, now.Month, 1);
            var lastMonthStart = startOfMonth.AddMonths(-1);
            var lastMonthEnd = startOfMonth.AddTicks(-1);

            var currentMonthBookings = bookings.Where(b => b.BookingDate >= startOfMonth).ToList();
            var previousMonthBookings = bookings.Where(b => b.BookingDate >= lastMonthStart && b.BookingDate <= lastMonthEnd).ToList();

            var bookingsChange = CalculateChange(previousMonthBookings.Count, currentMonthBookings.Count);
            var revenueChange = CalculateChange(previousMonthBookings.Sum(b => b.TotalPrice ?? 0), currentMonthBookings.Sum(b => b.TotalPrice ?? 0));

            var activeArtists = await _salonRepository.GetActiveArtistCountAsync(salonId);

            var response = new SalonAnalyticsDto
            {
                TotalRevenue = revenue,
                RevenueChange = revenueChange,
                TotalBookings = bookings.Count,
                BookingsChange = bookingsChange,
                ActiveArtists = activeArtists,
                NewClients = currentMonthBookings.Select(b => b.ClientId).Distinct().Count()
            };

            response.RevenueTrend = bookings
                .GroupBy(b => new { b.BookingDate.Year, b.BookingDate.Month })
                .OrderBy(g => g.Key.Year).ThenBy(g => g.Key.Month)
                .Select(g => new SalonMetricPointDto
                {
                    Label = $"{g.Key.Year}-{g.Key.Month:00}",
                    Value = g.Sum(b => b.TotalPrice ?? 0)
                }).ToList();

            response.BookingsTrend = bookings
                .GroupBy(b => b.BookingDate.Date)
                .OrderBy(g => g.Key)
                .Select(g => new SalonMetricPointDto
                {
                    Label = g.Key.ToString("yyyy-MM-dd"),
                    Value = g.Count()
                }).ToList();

            response.ArtistPerformance = bookings
                .GroupBy(b => b.ArtistId)
                .Select(g => new SalonArtistPerformanceDto
                {
                    ArtistId = g.Key.ToString(),
                    ArtistName = artistNames.GetValueOrDefault(g.Key, "Artist"),
                    Bookings = g.Count(),
                    Revenue = g.Sum(b => b.TotalPrice ?? 0),
                    Clients = g.Select(b => b.ClientId).Distinct().Count()
                }).ToList();

            // Get all services from all salon members (not just from bookings)
            var artistIds = artistNames.Keys.ToList();
            
            // Get all active services for all artists in the salon
            var allServicesData = await _salonRepository.GetAllServicesForArtistsAsync(artistIds);
            
            // Service performance - combine services from bookings and all services
            var servicePerformanceDict = new Dictionary<(string ServiceName, string ArtistName), SalonServicePerformanceDto>();
            
            // First, add services from bookings (with booking data)
            foreach (var booking in bookings)
            {
                for (int i = 0; i < booking.ServiceIds.Count; i++)
                {
                    var serviceId = booking.ServiceIds[i];
                    var servicePrice = i < booking.ServicePrices.Count ? booking.ServicePrices[i] : 0m;
                    var serviceName = serviceNames.GetValueOrDefault(serviceId, "Service");
                    var artistName = artistNames.GetValueOrDefault(booking.ArtistId, "Artist");
                    var key = (serviceName, artistName);

                    if (!servicePerformanceDict.ContainsKey(key))
                    {
                        servicePerformanceDict[key] = new SalonServicePerformanceDto
                        {
                            ServiceName = serviceName,
                            ArtistName = artistName,
                            Bookings = 0,
                            Revenue = 0
                        };
                    }

                    servicePerformanceDict[key].Bookings += 1;
                    servicePerformanceDict[key].Revenue += servicePrice;
                }
            }

            // Then, add all services from all artists (even if they have no bookings)
            foreach (var service in allServicesData)
            {
                var artistName = artistNames.GetValueOrDefault(service.ArtistId, "Artist");
                var key = (service.ServiceName, artistName);

                if (!servicePerformanceDict.ContainsKey(key))
                {
                    servicePerformanceDict[key] = new SalonServicePerformanceDto
                    {
                        ServiceName = service.ServiceName,
                        ArtistName = artistName,
                        Bookings = 0,
                        Revenue = 0
                    };
                }
            }

            response.Services = servicePerformanceDict.Values
                .OrderByDescending(s => s.Bookings)
                .ThenBy(s => s.ServiceName)
                .ToList();

            return response;
        }

        public async Task<SalonCalendarResponseDto> GetCalendarAsync(Guid salonId, DateTime? startDate, DateTime? endDate, int page = 1, int limit = 10)
        {
            // Get optimized calendar data (no cartesian explosion)
            var (bookings, artistNames, serviceNames, totalCount) = await _salonRepository.GetCalendarDataAsync(salonId, startDate, endDate, page, limit);

            // Get client names
            var clientIds = bookings.Where(b => b.ClientId.HasValue).Select(b => b.ClientId!.Value).Distinct().ToList();
            var clientNames = new Dictionary<Guid, string>();
            if (clientIds.Any())
            {
                var clients = await _userRepository.GetUsersByIdsAsync(clientIds);
                clientNames = clients.ToDictionary(c => c.Id, c => c.FullName ?? "Client");
            }

            var response = new SalonCalendarResponseDto
            {
                Bookings = bookings.Select(b => new SalonCalendarBookingDto
                {
                    Id = b.Id.ToString(),
                    ArtistId = b.ArtistId.ToString(),
                    ArtistName = artistNames.GetValueOrDefault(b.ArtistId, "Artist"),
                    ClientName = b.CustomerName ?? (b.ClientId.HasValue ? clientNames.GetValueOrDefault(b.ClientId.Value, "Client") : "Client"),
                    Service = b.FirstServiceId.HasValue ? serviceNames.GetValueOrDefault(b.FirstServiceId.Value, "Service") : "Service",
                    Date = b.BookingDate,
                    Time = b.BookingTime.ToString(@"hh\:mm"),
                    Duration = b.TotalDurationMinutes,
                    Price = b.TotalPrice,
                    Status = b.Status
                }).ToList(),
                TotalCount = totalCount,
                Page = page,
                Limit = limit
            };

            return response;
        }

        public async Task<IList<AvailableSalonSlotDto>> GetAvailableSlotsAsync(Guid salonId, DateTime date)
        {
            // For now, return an empty list; slot calculation per artist is planned in a follow-up.
            _logger.LogInformation("Salon-wide slot calculation is not yet implemented. Returning an empty list.");
            return new List<AvailableSalonSlotDto>();
        }

        private async Task<SalonDto> BuildSalonDtoAsync(Guid salonId)
        {
            // Load salon basic info only (no includes)
            var salon = await _salonRepository.GetSalonByIdAsync(salonId);
            if (salon == null)
                throw new KeyNotFoundException("Salon not found");

            // Load all data sequentially (DbContext is not thread-safe, so we can't run queries in parallel)
            var subscription = await _salonRepository.GetSubscriptionAsync(salonId);
            var invitations = await _salonRepository.GetInvitationsForSalonAsync(salonId);
            var owner = await _userRepository.GetUserByIdWithArtistProfileAsync(salon.OwnerUserId);

            // Get memberships data using optimized method (avoids cartesian explosion)
            var salonDetailData = await _salonRepository.GetSalonDetailDataAsync(salonId);
            if (salonDetailData == null)
                throw new KeyNotFoundException("Salon not found");

            // Owner info
            var ownerArtist = owner?.ArtistProfile;
            var ownerArtistId = ownerArtist?.SalonId == salonId ? ownerArtist?.Id : null;
            // Use salon's ProfileImageUrl first, fall back to owner's profile image
            var profileImageUrl = salon.ProfileImageUrl ?? ownerArtist?.PortfolioImages?.FirstOrDefault(p => p.IsProfilePicture)?.ImageUrl;
            var ownerName = owner?.FullName ?? "Unknown";

            // Get booking statistics using aggregation query (much faster - only stats, not full bookings)
            var bookingStatsDict = new Dictionary<Guid, (int Count, decimal Revenue)>();
            if (salonDetailData.MemberArtistIds.Any())
            {
                var bookingStats = await _salonRepository.GetBookingStatsForArtistsAsync(salonDetailData.MemberArtistIds);
                bookingStatsDict = bookingStats.ToDictionary(x => x.ArtistId, x => (Count: x.Count, Revenue: x.Revenue));
            }

            // Build member DTOs using optimized data
            var memberDtos = salonDetailData.Memberships
                .Where(m =>
                {
                    var artist = salonDetailData.ArtistsDict.GetValueOrDefault(m.ArtistId);
                    return artist != null && (m.Role != "owner" || (m.Role == "owner" && artist.SalonId == salonId));
                })
                .Select(m =>
                {
                    var artist = salonDetailData.ArtistsDict[m.ArtistId];
                    var user = salonDetailData.UsersDict.GetValueOrDefault(artist.UserId);
                    var profileImage = salonDetailData.ProfileImageDict.GetValueOrDefault(m.ArtistId);
                    var stats = bookingStatsDict.GetValueOrDefault(m.ArtistId, (Count: 0, Revenue: 0m));

                    return new SalonMemberDto
                    {
                        ArtistId = m.ArtistId.ToString(),
                        UserId = artist.UserId.ToString(),
                        FullName = user?.FullName ?? "Artist",
                        Role = m.Role,
                        ProfileImageUrl = profileImage,
                        Profession = artist.Profession,
                        Bookings = stats.Count,
                        Revenue = stats.Revenue
                    };
                })
                .ToList();

            // Get combined services from optimized data
            var allServices = salonDetailData.Services;

            var combinedServices = allServices
                .Select(s => s.Name)
                .Where(name => !string.IsNullOrWhiteSpace(name))
                .Distinct()
                .ToList();

            var minPrice = allServices
                .Where(s => s.Price > 0)
                .OrderBy(s => s.Price)
                .FirstOrDefault()?.Price;

            var invitationDtos = invitations.Select(MapInvitation).ToList();

            var dto = new SalonDto
            {
                Id = salon.Id.ToString(),
                Name = salon.Name,
                OwnerId = salon.OwnerUserId.ToString(),
                OwnerUserId = salon.OwnerUserId.ToString(),
                OwnerName = ownerName,
                OwnerArtistId = ownerArtistId?.ToString(),
                Address = salon.Address ?? string.Empty,
                City = salon.City ?? string.Empty,
                Country = salon.Country ?? string.Empty,
                Phone = salon.Phone,
                Email = salon.Email,
                BannerImageUrl = salon.BannerImageUrl,
                ProfileImageUrl = profileImageUrl,
                About = salon.About,
                MemberCount = memberDtos.Count,
                Members = memberDtos,
                PendingInvitations = invitationDtos.Where(i => i.Status == "pending").ToList(),
                CombinedServices = combinedServices,
                MinPrice = minPrice.HasValue
                    ? minPrice.Value.ToString("C0", System.Globalization.CultureInfo.InvariantCulture)
                    : null,
                CustomBookingLink = salon.CustomBookingLink
            };

            if (subscription != null)
            {
                dto.Subscription = MapSubscription(subscription);
            }
            else
            {
                var memberCount = Math.Max(3, memberDtos.Count);
                dto.Subscription = new SalonSubscriptionDto
                {
                    PlanType = "enterprise",
                    ArtistCount = memberCount,
                    MonthlyCost = memberCount * ArtistSeatPrice,
                    BillingCycle = "monthly",
                    Status = "active",
                    CurrentPeriodStart = DateTime.UtcNow,
                    CurrentPeriodEnd = DateTime.UtcNow.AddMonths(1),
                    NextPaymentDate = DateTime.UtcNow.AddMonths(1),
                    TrialEndsAt = null
                };
            }

            return dto;
        }

        private SalonInvitationDto MapInvitation(SalonInvitation invitation)
        {
            // Build invitation URL if token exists - use FrontendUrl, not hardcoded localhost
            var frontendUrl = _configuration["AppSettings:FrontendUrl"] ?? "http://localhost:3000";
            var invitationUrl = !string.IsNullOrEmpty(invitation.Token)
                ? $"{frontendUrl}/accept-invitation?token={invitation.Token}"
                : null;
            
            return new SalonInvitationDto
            {
                Id = invitation.Id.ToString(),
                SalonId = invitation.SalonId.ToString(),
                Email = invitation.Email,
                Phone = invitation.Phone,
                InvitedBy = invitation.InvitedBy.ToString(),
                Token = invitation.Token,
                InvitationUrl = invitationUrl,
                ExpiresAt = invitation.ExpiresAt,
                Status = invitation.Status,
                CreatedAt = invitation.CreatedAt
            };
        }

        public async Task<string?> GetInvoiceUrlAsync(Guid salonId)
        {
            var subscription = await _salonRepository.GetSubscriptionAsync(salonId);
            if (subscription == null || string.IsNullOrEmpty(subscription.PaddleSubscriptionId))
            {
                _logger.LogWarning("Subscription not found or missing PaddleSubscriptionId for salon {SalonId}", salonId);
                return null;
            }

            // Check environment variables first, then fall back to appsettings
            var paddleEnvironment = Environment.GetEnvironmentVariable("PADDLE_ENVIRONMENT") 
                ?? _configuration["PaddleSettings:Environment"] 
                ?? "sandbox";
            var paddleApiKey = Environment.GetEnvironmentVariable("PADDLE_API_KEY") 
                ?? _configuration["PaddleSettings:ApiKey"];
            
            // Always return customer portal URL as fallback, even if API key is not configured
            var customerPortalBase = paddleEnvironment == "production"
                ? "https://my.paddle.com"
                : "https://sandbox-my.paddle.com";
            
            var fallbackUrl = $"{customerPortalBase}/subscriptions/{subscription.PaddleSubscriptionId}";
            
            if (string.IsNullOrEmpty(paddleApiKey))
            {
                _logger.LogWarning("Paddle API key not configured. Returning customer portal URL as fallback.");
                return fallbackUrl;
            }

            var baseUrl = paddleEnvironment == "production" 
                ? "https://api.paddle.com" 
                : "https://sandbox-api.paddle.com";

            var httpClient = _httpClientFactory.CreateClient();
            httpClient.DefaultRequestHeaders.Add("Authorization", $"Bearer {paddleApiKey}");

            try
            {
                // Get subscription details
                var subscriptionUrl = $"{baseUrl}/subscriptions/{subscription.PaddleSubscriptionId}";
                var subscriptionResponse = await httpClient.GetAsync(subscriptionUrl);
                
                if (!subscriptionResponse.IsSuccessStatusCode)
                {
                    var errorContent = await subscriptionResponse.Content.ReadAsStringAsync();
                    _logger.LogWarning("Failed to get Paddle subscription for invoice URL: {StatusCode} - {Error}. Returning fallback URL.", 
                        subscriptionResponse.StatusCode, errorContent);
                    return fallbackUrl;
                }

                var subscriptionJson = await subscriptionResponse.Content.ReadAsStringAsync();
                var subscriptionDoc = JsonDocument.Parse(subscriptionJson);
                var subscriptionData = subscriptionDoc.RootElement;

                // Try to get the latest transaction ID
                string? transactionId = null;
                if (subscriptionData.TryGetProperty("latest_transaction", out var latestTransaction))
                {
                    if (latestTransaction.TryGetProperty("id", out var transactionIdElement))
                    {
                        transactionId = transactionIdElement.GetString();
                    }
                }

                // If we have a transaction ID, get the receipt URL
                if (!string.IsNullOrEmpty(transactionId))
                {
                    var transactionUrl = $"{baseUrl}/transactions/{transactionId}";
                    var transactionResponse = await httpClient.GetAsync(transactionUrl);
                    
                    if (transactionResponse.IsSuccessStatusCode)
                    {
                        var transactionJson = await transactionResponse.Content.ReadAsStringAsync();
                        var transactionDoc = JsonDocument.Parse(transactionJson);
                        var transactionData = transactionDoc.RootElement;

                        // Try to get receipt URL
                        if (transactionData.TryGetProperty("receipt_url", out var receiptUrlElement))
                        {
                            var receiptUrl = receiptUrlElement.GetString();
                            if (!string.IsNullOrEmpty(receiptUrl))
                            {
                                _logger.LogInformation("Found receipt URL for subscription {SubscriptionId}", subscription.PaddleSubscriptionId);
                                return receiptUrl;
                            }
                        }
                    }
                    else
                    {
                        _logger.LogWarning("Failed to get transaction {TransactionId} for invoice URL. Returning fallback.", transactionId);
                    }
                }
                else
                {
                    _logger.LogWarning("No transaction ID found in subscription {SubscriptionId}. Returning fallback URL.", subscription.PaddleSubscriptionId);
                }

                // Return customer portal URL as fallback
                _logger.LogInformation("Returning customer portal URL as fallback for subscription {SubscriptionId}", subscription.PaddleSubscriptionId);
                return fallbackUrl;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching invoice URL for salon {SalonId}. Returning fallback URL.", salonId);
                return fallbackUrl;
            }
        }

        private static SalonSubscriptionDto MapSubscription(SalonSubscription subscription)
        {
            return new SalonSubscriptionDto
            {
                Id = subscription.Id.ToString(),
                PlanType = subscription.PlanType,
                ArtistCount = subscription.ArtistCount,
                MonthlyCost = subscription.MonthlyCost,
                BillingCycle = subscription.BillingCycle,
                Status = subscription.Status,
                PaddleSubscriptionId = subscription.PaddleSubscriptionId,
                CurrentPeriodStart = subscription.CurrentPeriodStart,
                CurrentPeriodEnd = subscription.CurrentPeriodEnd,
                NextPaymentDate = subscription.NextPaymentDate,
                TrialEndsAt = subscription.TrialEndsAt
            };
        }


        private static string CalculateChange(decimal previous, decimal current)
        {
            if (previous == 0) return current > 0 ? "+100%" : "0%";
            var change = ((current - previous) / previous) * 100;
            var sign = change >= 0 ? "+" : string.Empty;
            return $"{sign}{change:F0}%";
        }

        private static string CalculateChange(int previous, int current)
        {
            return CalculateChange((decimal)previous, (decimal)current);
        }

        public async Task<IList<SalonDto>> GetAllSalonsAsync()
        {
            var salons = await _salonRepository.GetAllSalonsAsync();
            var salonDtos = new List<SalonDto>();
            
            // Filter out salons with cancelled subscriptions
            var activeSalons = new List<Salon>();
            foreach (var salon in salons)
            {
                var subscription = await _salonRepository.GetSubscriptionAsync(salon.Id);
                // Only include salons with active or trial subscriptions (not cancelled)
                if (subscription == null || (subscription.Status != "cancelled" && subscription.Status != "expired"))
                {
                    activeSalons.Add(salon);
                }
            }

            foreach (var salon in activeSalons)
            {
                var bookings = await _salonRepository.GetBookingsForSalonAsync(salon.Id, null, null);
                
                var memberDtos = salon.Memberships
                    .Where(m => m.Status == "active" && m.Artist != null)
                    // Filter out owner if they are not also an artist (SalonId is null or doesn't match this salon)
                    .Where(m => m.Role != "owner" || (m.Role == "owner" && m.Artist != null && m.Artist.SalonId == salon.Id))
                    .Select(m =>
                    {
                        var memberBookings = bookings.Where(b => b.ArtistId == m.ArtistId).ToList();
                        return new SalonMemberDto
                        {
                            ArtistId = m.ArtistId.ToString(),
                            UserId = m.Artist?.UserId.ToString() ?? Guid.Empty.ToString(),
                            FullName = m.Artist?.User?.FullName ?? "Artist",
                            Role = m.Role,
                            ProfileImageUrl = m.Artist?.PortfolioImages?.FirstOrDefault(p => p.IsProfilePicture)?.ImageUrl,
                            Profession = m.Artist?.Profession ?? string.Empty,
                            Bookings = memberBookings.Count,
                            Revenue = memberBookings.Sum(b => b.TotalPrice ?? 0)
                        };
                    }).ToList();

                var profileImageUrl = salon.Owner?.ArtistProfile?.PortfolioImages?
                    .FirstOrDefault(p => p.IsProfilePicture)?.ImageUrl;

                // Get owner's artist ID only if they are also an artist (SalonId is not null)
                var ownerArtistId = salon.Owner?.ArtistProfile?.SalonId == salon.Id
                    ? salon.Owner?.ArtistProfile?.Id.ToString()
                    : null;

                // Combine all services from all salon members
                var allServices = salon.Memberships
                    .Where(m => m.Status == "active" && m.Artist != null && m.Artist.Services != null)
                    .SelectMany(m => m.Artist!.Services.Where(s => s.IsActive))
                    .ToList();

                var combinedServices = allServices
                    .Select(s => s.Name)
                    .Where(name => !string.IsNullOrWhiteSpace(name))
                    .Distinct()
                    .ToList();

                // Get minimum price from all services
                var minPrice = allServices
                    .Where(s => s.Price > 0)
                    .OrderBy(s => s.Price)
                    .FirstOrDefault()?.Price;

                var minPriceString = minPrice.HasValue
                    ? minPrice.Value.ToString("C0", System.Globalization.CultureInfo.InvariantCulture)
                    : null;

                salonDtos.Add(new SalonDto
                {
                    Id = salon.Id.ToString(),
                    Name = salon.Name,
                    OwnerId = salon.OwnerUserId.ToString(),
                    OwnerUserId = salon.OwnerUserId.ToString(),
                    OwnerName = salon.Owner?.FullName ?? "Unknown",
                    OwnerArtistId = ownerArtistId,
                    Address = salon.Address,
                    City = salon.City,
                    Country = salon.Country,
                    Phone = salon.Phone,
                    Email = salon.Email,
                    BannerImageUrl = salon.BannerImageUrl,
                    About = salon.About,
                    ProfileImageUrl = profileImageUrl,
                    Members = memberDtos,
                    CombinedServices = combinedServices,
                    MinPrice = minPriceString,
                    CustomBookingLink = salon.CustomBookingLink
                });
            }

            return salonDtos;
        }

        public async Task<object> GetAllSalonsAsync(int page, int limit)
        {
            var (salonsData, totalCount) = await _salonRepository.GetSalonsListAsync(page, limit);
            
            var salonDtos = salonsData.Select(s => new SalonDto
            {
                Id = s.Id.ToString(),
                Name = s.Name,
                OwnerId = s.OwnerUserId.ToString(),
                OwnerUserId = s.OwnerUserId.ToString(),
                OwnerName = s.OwnerFullName ?? "Unknown",
                OwnerArtistId = s.OwnerArtistId?.ToString(),
                Address = s.Address ?? string.Empty,
                City = s.City ?? string.Empty,
                Country = s.Country ?? string.Empty,
                Phone = s.Phone,
                Email = s.Email,
                BannerImageUrl = s.BannerImageUrl,
                About = s.About,
                ProfileImageUrl = s.ProfileImageUrl ?? s.OwnerProfileImageUrl,
                Members = s.Members.Select(m => new SalonMemberDto
                {
                    ArtistId = m.ArtistId.ToString(),
                    UserId = m.UserId.ToString(),
                    FullName = m.FullName,
                    Role = m.Role,
                    ProfileImageUrl = m.ProfileImageUrl,
                    Profession = m.Profession,
                    Bookings = m.BookingCount,
                    Revenue = m.Revenue
                }).ToList(),
                CombinedServices = s.CombinedServices,
                MinPrice = s.MinServicePrice.HasValue
                    ? s.MinServicePrice.Value.ToString("C0", System.Globalization.CultureInfo.InvariantCulture)
                    : null,
                CustomBookingLink = s.CustomBookingLink
            }).ToList();

            return new
            {
                salons = salonDtos,
                total = totalCount,
                page = page,
                limit = limit
            };
        }

        public async Task<SalonDto?> GetSalonByCustomBookingLinkAsync(string customBookingLink)
        {
            var salon = await _salonRepository.GetSalonByCustomBookingLinkAsync(customBookingLink);
            if (salon == null)
            {
                return null;
            }

            return await BuildSalonDtoAsync(salon.Id);
        }
    }
}
