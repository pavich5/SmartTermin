namespace SmartTermin.DTOs
{
    public class CreateSalonRequestDto
    {
        public string Name { get; set; } = string.Empty;
        public string Address { get; set; } = string.Empty;
        public string City { get; set; } = string.Empty;
        public string Country { get; set; } = string.Empty;
        public string? Phone { get; set; }
        public string? Email { get; set; }
        public string? BannerImageUrl { get; set; }
        public string? ProfileImageUrl { get; set; }
        public string? About { get; set; }
        public string? CustomBookingLink { get; set; }
        public int? ArtistCount { get; set; }
        public string? BillingCycle { get; set; }
        public bool? StartWithTrial { get; set; }
    }
}
