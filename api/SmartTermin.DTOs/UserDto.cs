namespace SmartTermin.DTOs
{
    public class UserDto
    {
        public string Id { get; set; } = string.Empty;
        public string Phone { get; set; } = string.Empty;
        public string FullName { get; set; } = string.Empty;
        public string UserType { get; set; } = string.Empty;
        public string? Email { get; set; }
        public bool? IsFreeTrialActive { get; set; }
        public bool? IsOnboardingCompleted { get; set; }
        public string? ArtistId { get; set; }
        public string? SubscriptionPlan { get; set; } // "free" or "pro"
        public string? SalonId { get; set; }
        public string? SalonRole { get; set; }
        public bool? IsArtistInSalon { get; set; } // True if ArtistProfile.SalonId is set (owner acting as artist)
        
        // Trial and abuse prevention flags
        public bool HasUsedProTrial { get; set; } = false;
        public bool HasUsedEnterpriseTrial { get; set; } = false;
        public bool HasCreatedSalon { get; set; } = false;
        public bool IsProcessingPlanChange { get; set; } = false;
    }
}


