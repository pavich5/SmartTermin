namespace SmartTermin.DTOs
{
    public class DashboardStatsDto
    {
        public RevenueDto Revenue { get; set; } = new RevenueDto();
        public TotalBookingsDto TotalBookings { get; set; } = new TotalBookingsDto();
        public NewClientsDto NewClients { get; set; } = new NewClientsDto();
        public ReturningClientsDto ReturningClients { get; set; } = new ReturningClientsDto();
        public AvgBookingValueDto AvgBookingValue { get; set; } = new AvgBookingValueDto();
        public ActiveServicesDto ActiveServices { get; set; } = new ActiveServicesDto();
    }

    public class RevenueDto
    {
        public decimal Total { get; set; }
        public string Change { get; set; } = string.Empty;
    }

    public class TotalBookingsDto
    {
        public int Count { get; set; }
        public string Change { get; set; } = string.Empty;
    }

    public class NewClientsDto
    {
        public int Count { get; set; }
        public string Change { get; set; } = string.Empty;
    }

    public class ReturningClientsDto
    {
        public decimal Percentage { get; set; }
        public string Change { get; set; } = string.Empty;
    }

    public class AvgBookingValueDto
    {
        public decimal Amount { get; set; }
        public string Currency { get; set; } = "MKD";
    }

    public class ActiveServicesDto
    {
        public int Count { get; set; }
    }
}

