using System.Text.Json;

namespace SmartTermin.DomainModels.Models
{
    public class AnalyticsEvent
    {
        public Guid Id { get; set; } = Guid.NewGuid();
        public Guid ArtistId { get; set; }
        public Artist Artist { get; set; }
        public string EventType { get; set; }
        public string EventData { get; set; }
        public decimal? Revenue { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
