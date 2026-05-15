namespace SmartTermin.DomainModels.Models
{
    public class Review
    {
        public Guid Id { get; set; } = Guid.NewGuid();
        public Guid ArtistId { get; set; }
        public Artist Artist { get; set; }
        public Guid ClientId { get; set; }
        public User Client { get; set; }
        public Guid ServiceId { get; set; }
        public Service Service { get; set; }
        public Guid? BookingId { get; set; } 
        public Booking Booking { get; set; }
        public int Rating { get; set; }  
        public string ReviewText { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? UpdatedAt { get; set; }
    }
}
