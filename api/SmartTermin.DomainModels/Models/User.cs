namespace SmartTermin.DomainModels.Models
{
    public class User
    {
        public Guid Id { get; set; } = Guid.NewGuid();
        public string Email { get; set; }
        public string PasswordHash { get; set; }
        public string FullName { get; set; }
        public string Phone { get; set; }
        public bool PhoneVerified { get; set; } = false;
        public string? PhoneVerificationCode { get; set; }
        public DateTime? PhoneVerificationExpiresAt { get; set; }
        public string? PasswordResetCode { get; set; }
        public DateTime? PasswordResetExpiresAt { get; set; }
        public string UserType { get; set; } // "artist" or "client"
        public DateTime? DateOfBirth { get; set; }
        public DateTime? LastLoginAt { get; set; }
        public bool IsActive { get; set; } = true;
        public string? FcmToken { get; set; } // Firebase Cloud Messaging token for push notifications
        
        // Trial and abuse prevention flags
        public bool HasUsedProTrial { get; set; } = false;
        public bool HasUsedEnterpriseTrial { get; set; } = false;
        public bool HasCreatedSalon { get; set; } = false;
        public bool IsProcessingPlanChange { get; set; } = false;
        
        public Artist ArtistProfile { get; set; }
        public ICollection<Booking> ClientBookings { get; set; }
        public ICollection<Review> ClientReviews { get; set; }
        public ICollection<Salon> OwnedSalons { get; set; } = new List<Salon>();
        public ICollection<SalonInvitation> SentSalonInvitations { get; set; } = new List<SalonInvitation>();
    }
}
