namespace SmartTermin.DTOs
{
    public class SalonAnalyticsDto
    {
        public decimal TotalRevenue { get; set; }
        public string RevenueChange { get; set; } = "0%";
        public int TotalBookings { get; set; }
        public string BookingsChange { get; set; } = "0%";
        public int ActiveArtists { get; set; }
        public int NewClients { get; set; }
        public List<SalonMetricPointDto> RevenueTrend { get; set; } = new();
        public List<SalonMetricPointDto> BookingsTrend { get; set; } = new();
        public List<SalonArtistPerformanceDto> ArtistPerformance { get; set; } = new();
        public List<SalonServicePerformanceDto> Services { get; set; } = new();
    }

    public class SalonMetricPointDto
    {
        public string Label { get; set; } = string.Empty;
        public decimal Value { get; set; }
    }

    public class SalonArtistPerformanceDto
    {
        public string ArtistId { get; set; } = string.Empty;
        public string ArtistName { get; set; } = string.Empty;
        public int Bookings { get; set; }
        public decimal Revenue { get; set; }
        public int Clients { get; set; }
    }

    public class SalonServicePerformanceDto
    {
        public string ServiceName { get; set; } = string.Empty;
        public string ArtistName { get; set; } = string.Empty;
        public int Bookings { get; set; }
        public decimal Revenue { get; set; }
    }
}
