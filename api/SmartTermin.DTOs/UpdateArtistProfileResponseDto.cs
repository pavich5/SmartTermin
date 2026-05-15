namespace SmartTermin.DTOs
{
    public class UpdateArtistProfileResponseDto
    {
        public string Id { get; set; } = string.Empty;
        public string Profession { get; set; } = string.Empty;
        public string BusinessName { get; set; } = string.Empty;
        public string Address { get; set; } = string.Empty;
        public string City { get; set; } = string.Empty;
        public string Country { get; set; } = string.Empty;
        public string About { get; set; } = string.Empty;
        public int? MaximumCancellationHours { get; set; }
    }
}



