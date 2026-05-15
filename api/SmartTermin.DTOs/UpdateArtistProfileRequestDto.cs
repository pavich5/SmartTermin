namespace SmartTermin.DTOs
{
    public class UpdateArtistProfileRequestDto
    {
        public string? Profession { get; set; }
        public string? BusinessName { get; set; }
        public string? Address { get; set; }
        public string? City { get; set; }
        public string? Country { get; set; }
        public string? About { get; set; }
        public int? MaximumCancellationHours { get; set; }
        public string? CustomBookingLink { get; set; }
    }
}



