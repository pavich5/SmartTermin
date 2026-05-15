namespace SmartTermin.DomainModels.Models
{
    public class BlockedClient
    {
        public Guid Id { get; set; } = Guid.NewGuid();
        
        public Guid ClientId { get; set; }
        public User Client { get; set; }
        
        // Either ArtistId or SalonId should be set, but not both
        public Guid? ArtistId { get; set; }
        public Artist? Artist { get; set; }
        
        public Guid? SalonId { get; set; }
        public Salon? Salon { get; set; }
        
        public string? Reason { get; set; }
        public DateTime BlockedAt { get; set; } = DateTime.UtcNow;
        public Guid BlockedByUserId { get; set; } // User who blocked the client (artist or salon owner)
        public User BlockedByUser { get; set; }
    }
}











