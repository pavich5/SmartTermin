namespace SmartTermin.DataAccess.Repositories
{
    public class SalonAnalyticsData
    {
        public List<BookingAnalyticsBasic> Bookings { get; set; } = new();
        public Dictionary<Guid, string> ArtistNamesDict { get; set; } = new();
        public Dictionary<Guid, string> ServiceNamesDict { get; set; } = new();
    }

    public class BookingAnalyticsBasic
    {
        public Guid Id { get; set; }
        public Guid ArtistId { get; set; }
        public Guid ClientId { get; set; }
        public DateTime BookingDate { get; set; }
        public decimal? TotalPrice { get; set; }
        public string Status { get; set; } = string.Empty;
        public List<Guid> ServiceIds { get; set; } = new();
        public List<decimal> ServicePrices { get; set; } = new();
    }

    public class SalonCalendarBookingData
    {
        public Guid Id { get; set; }
        public Guid ArtistId { get; set; }
        public Guid? ClientId { get; set; }
        public string? CustomerName { get; set; }
        public DateTime BookingDate { get; set; }
        public TimeSpan BookingTime { get; set; }
        public int TotalDurationMinutes { get; set; }
        public decimal? TotalPrice { get; set; }
        public string Status { get; set; } = string.Empty;
        public Guid? FirstServiceId { get; set; }
    }
}









