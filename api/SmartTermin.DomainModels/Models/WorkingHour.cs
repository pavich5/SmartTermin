namespace SmartTermin.DomainModels.Models
{
    public class WorkingHour
    {
        public Guid Id { get; set; } = Guid.NewGuid();
        public Guid ArtistId { get; set; }
        public Artist Artist { get; set; }
        public int DayOfWeek { get; set; }
        public TimeSpan StartTime { get; set; }
        public TimeSpan EndTime { get; set; }
        public bool IsAvailable { get; set; } = true;
        public string? BreaksJson { get; set; } // JSON array of breaks: [{"start":"12:00","end":"13:00"}]
    }
}
