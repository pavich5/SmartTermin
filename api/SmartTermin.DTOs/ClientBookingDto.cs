namespace SmartTermin.DTOs
{
    public class ClientBookingDto
    {
        public string Id { get; set; } = string.Empty;
        public string ArtistId { get; set; } = string.Empty;
        public string ArtistName { get; set; } = string.Empty;
        public string Service { get; set; } = string.Empty;
        public string Status { get; set; } = string.Empty;
        public string Date { get; set; } = string.Empty;
        public string Time { get; set; } = string.Empty;
        public string Duration { get; set; } = string.Empty;
        public string Price { get; set; } = string.Empty;
        public int? MaximumCancellationHours { get; set; }
    }
}

