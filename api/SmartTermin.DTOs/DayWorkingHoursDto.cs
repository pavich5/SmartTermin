namespace SmartTermin.DTOs
{
    public class BreakDto
    {
        public string Start { get; set; } = string.Empty;
        public string End { get; set; } = string.Empty;
    }

    public class DayWorkingHoursDto
    {
        public string Start { get; set; } = string.Empty;
        public string End { get; set; } = string.Empty;
        public bool Closed { get; set; }
        public List<BreakDto>? Breaks { get; set; }
    }
}

