namespace SmartTermin.DomainModels.Models
{
    public class Holiday
    {
        public Guid Id { get; set; } = Guid.NewGuid();
        public Guid ArtistId { get; set; }
        public Artist Artist { get; set; }
        public DateTime HolidayDate { get; set; }
        public string? Description { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}

