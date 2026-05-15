namespace SmartTermin.DTOs
{
    public class UpdateSalonRequestDto
    {
        public string? Name { get; set; }
        public string? Address { get; set; }
        public string? City { get; set; }
        public string? Country { get; set; }
        public string? Phone { get; set; }
        public string? Email { get; set; }
        public string? BannerImageUrl { get; set; }
        public string? About { get; set; }
        public string? CustomBookingLink { get; set; }
    }
}
