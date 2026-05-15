namespace SmartTermin.DTOs
{
    public class CancelBookingResponseDto
    {
        public bool Success { get; set; }
        public CancelledBookingDto Booking { get; set; } = new CancelledBookingDto();
    }

    public class CancelledBookingDto
    {
        public string Id { get; set; } = string.Empty;
        public string Status { get; set; } = string.Empty;
    }
}

