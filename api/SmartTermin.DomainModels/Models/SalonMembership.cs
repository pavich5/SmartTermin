namespace SmartTermin.DomainModels.Models
{
    public class SalonMembership
    {
        public Guid Id { get; set; } = Guid.NewGuid();
        public Guid SalonId { get; set; }
        public Salon Salon { get; set; }
        public Guid ArtistId { get; set; }
        public Artist Artist { get; set; }
        public string Role { get; set; } = "artist"; // owner | artist
        public DateTime JoinedAt { get; set; } = DateTime.UtcNow;
        public string Status { get; set; } = "active"; // active | inactive
    }
}
