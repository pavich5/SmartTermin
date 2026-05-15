namespace SmartTermin.DomainModels.Models
{
    public class BookingService
    {
        public Guid Id { get; set; } = Guid.NewGuid();
        public Guid BookingId { get; set; }
        public Booking Booking { get; set; }
        public Guid ServiceId { get; set; }
        public Service Service { get; set; }
        public decimal Price { get; set; }          
        public int DurationMinutes { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
