namespace SmartTermin.DomainModels.Models
{
    public class WalkInClient
    {
        public Guid Id { get; set; } = Guid.NewGuid();
        
        public Guid ArtistId { get; set; }
        public Artist Artist { get; set; }
        
        public string ClientName { get; set; } = string.Empty;
        public string? ClientEmail { get; set; }
        public string? ClientPhone { get; set; }
        
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}

