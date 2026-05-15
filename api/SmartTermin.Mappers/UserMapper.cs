using SmartTermin.DomainModels.Models;
using SmartTermin.DTOs;

namespace SmartTermin.Mappers
{
    public static class UserMapper
    {
        public static UserDto ToDto(User user)
        {
            var userDto = new UserDto
            {
                Id = user.Id.ToString(),
                Phone = user.Phone,
                FullName = user.FullName,
                UserType = user.UserType,
                Email = user.Email
            };

            // Set ArtistId for artists
            if (user.UserType == "artist" && user.ArtistProfile != null)
            {
                userDto.ArtistId = user.ArtistProfile.Id.ToString();
            }

            // Set IsFreeTrialActive and SubscriptionPlan only for artists
            if (user.UserType == "artist" && user.ArtistProfile != null && user.ArtistProfile.ArtistSubscriptions != null)
            {
                // Check if there's an active subscription with a trial that hasn't ended
                var activeSubscription = user.ArtistProfile.ArtistSubscriptions
                    .FirstOrDefault(s => s.Status == "active");

                if (activeSubscription != null)
                {
                    // Check if on free trial
                    var isFreeTrial = activeSubscription.TrialEndsAt.HasValue && activeSubscription.TrialEndsAt.Value > DateTime.UtcNow;
                    userDto.IsFreeTrialActive = isFreeTrial;

                    // Determine plan type: Pro if has PaddleSubscriptionId (paid) or on trial, otherwise Free
                    if (isFreeTrial || (!string.IsNullOrEmpty(activeSubscription.PaddleSubscriptionId) && activeSubscription.Status == "active"))
                    {
                        userDto.SubscriptionPlan = "pro";
                    }
                    else
                    {
                        userDto.SubscriptionPlan = "free";
                    }
                }
                else
                {
                    // No active subscription = free plan
                    userDto.SubscriptionPlan = "free";
                    userDto.IsFreeTrialActive = false;
                }
            }
            else
            {
                userDto.SubscriptionPlan = "free";
            }

            // Check if user is a salon owner first (from OwnedSalons)
            if (user.OwnedSalons != null && user.OwnedSalons.Any())
            {
                var ownedSalon = user.OwnedSalons.First();
                userDto.SalonId = ownedSalon.Id.ToString();
                userDto.SalonRole = "owner";
                // Check if owner is also acting as artist (ArtistProfile.SalonId matches owned salon)
                userDto.IsArtistInSalon = user.ArtistProfile?.SalonId == ownedSalon.Id;
            }
            // Otherwise, check if user is an artist member of a salon
            else if (user.ArtistProfile?.SalonId != null)
            {
                userDto.SalonId = user.ArtistProfile.SalonId.Value.ToString();
                var membershipRole = user.ArtistProfile.SalonMemberships?
                    .FirstOrDefault(m => m.SalonId == user.ArtistProfile.SalonId)?.Role;
                if (!string.IsNullOrEmpty(membershipRole))
                {
                    userDto.SalonRole = membershipRole;
                }
                userDto.IsArtistInSalon = true;
            }
            else
            {
                userDto.IsArtistInSalon = false;
            }

            var hasUsedEnterpriseTrial = user.HasUsedEnterpriseTrial;
            // If the flag was set without an actual salon ever being created, treat it as unused
            if (hasUsedEnterpriseTrial && !user.HasCreatedSalon && (user.OwnedSalons == null || !user.OwnedSalons.Any()))
            {
                hasUsedEnterpriseTrial = false;
            }

            // Map trial and abuse prevention flags
            userDto.HasUsedProTrial = user.HasUsedProTrial;
            userDto.HasUsedEnterpriseTrial = hasUsedEnterpriseTrial;
            userDto.HasCreatedSalon = user.HasCreatedSalon;
            userDto.IsProcessingPlanChange = user.IsProcessingPlanChange;

            return userDto;
        }
    }
}
