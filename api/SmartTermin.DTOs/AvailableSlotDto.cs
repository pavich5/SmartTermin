namespace SmartTermin.DTOs
{
    public class AvailableSlotDto
    {
        public string Time { get; set; } = string.Empty;
        public bool Available { get; set; }
        public string? NextAvailableTime { get; set; } // If not available, when is the next slot?
        public bool IsBreak { get; set; } // Indicates if this slot is unavailable due to a break
    }
}

