namespace SmartTermin.DTOs
{
    public class ProposeRescheduleRequestDto
    {
        public string NewDate { get; set; } = string.Empty;  // Format: yyyy-MM-dd
        public string NewTime { get; set; } = string.Empty;  // Format: HH:mm
        public string? Message { get; set; }  // Optional message from artist
    }
}













