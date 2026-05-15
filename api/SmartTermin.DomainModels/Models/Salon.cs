namespace SmartTermin.DomainModels.Models
{
    public class Salon
    {
        public Guid Id { get; set; } = Guid.NewGuid();
        public string Name { get; set; } = string.Empty;
        public Guid OwnerUserId { get; set; }
        public User Owner { get; set; }
        public string Address { get; set; } = string.Empty;
        public string City { get; set; } = string.Empty;
        public string Country { get; set; } = string.Empty;
        public string? Phone { get; set; }
        public string? Email { get; set; }
        public string? BannerImageUrl { get; set; }
        public string? ProfileImageUrl { get; set; }
        public string? About { get; set; }
        public string? CustomBookingLink { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

        public ICollection<SalonMembership> Memberships { get; set; } = new List<SalonMembership>();
        public ICollection<SalonInvitation> Invitations { get; set; } = new List<SalonInvitation>();
        public SalonSubscription? Subscription { get; set; }
        public ICollection<SalonHoliday> Holidays { get; set; }
        public ICollection<PortfolioImage> PortfolioImages { get; set; } = new List<PortfolioImage>();
    }
}
