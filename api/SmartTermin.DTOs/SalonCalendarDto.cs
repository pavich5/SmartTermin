namespace SmartTermin.DTOs
{
    public class SalonCalendarResponseDto
    {
        public IList<SalonCalendarBookingDto> Bookings { get; set; } = new List<SalonCalendarBookingDto>();
        public int TotalCount { get; set; }
        public int Page { get; set; }
        public int Limit { get; set; }
        public int TotalPages => Limit > 0 ? (int)Math.Ceiling((double)TotalCount / Limit) : 0;
    }

    public class SalonCalendarBookingDto
    {
        public string Id { get; set; } = string.Empty;
        public string ArtistId { get; set; } = string.Empty;
        public string ArtistName { get; set; } = string.Empty;
        public string ClientName { get; set; } = string.Empty;
        public string Service { get; set; } = string.Empty;
        public DateTime Date { get; set; }
        public string Time { get; set; } = string.Empty;
        public int Duration { get; set; }
        public decimal? Price { get; set; }
        public string Status { get; set; } = "confirmed";
    }

    public class AvailableSalonSlotDto
    {
        public string ArtistId { get; set; } = string.Empty;
        public string ArtistName { get; set; } = string.Empty;
        public string Time { get; set; } = string.Empty;
        public bool Available { get; set; }
    }
}
