namespace SmartTermin.DomainModels.Models
{
    public class Artist
    {
        public Guid Id { get; set; } = Guid.NewGuid();
        public Guid UserId { get; set; }
        public User User { get; set; }
        public string? Profession { get; set; }
        public string? BusinessName { get; set; }
        public string? Address { get; set; }
        public string? City { get; set; }
        public string? Country { get; set; }
        public string? About { get; set; }
        public Guid? SalonId { get; set; }
        public Salon? Salon { get; set; }
        public decimal? Latitude { get; set; }
        public decimal? Longitude { get; set; }
        public bool? IsVerified { get; set; } = false;
        public decimal? Rating { get; set; } = 0m;
        public int? TotalReviews { get; set; } = 0;
        public string? CustomBookingLink { get; set; }
        public string? BannerImageUrl { get; set; }
        public string? ProfileImageUrl { get; set; }
        public int SlotIntervalMinutes { get; set; } = 5; // Default: 5 minutes between slots
        public int BufferMinutes { get; set; } = 0; // Default: 0 minutes buffer between appointments
        public int? MaximumCancellationHours { get; set; }
        public ICollection<Service> Services { get; set; }
        public ICollection<WorkingHour> WorkingHours { get; set; }
        public ICollection<PortfolioImage> PortfolioImages { get; set; }
        public ICollection<Booking> Bookings { get; set; }
        public ICollection<Review> Reviews { get; set; }
        public ICollection<ArtistSubscription> ArtistSubscriptions { get; set; }
        public ICollection<SalonMembership> SalonMemberships { get; set; } = new List<SalonMembership>();
        public ICollection<Holiday> Holidays { get; set; }
    }
}
