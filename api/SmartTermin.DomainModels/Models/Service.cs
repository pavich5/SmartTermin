namespace SmartTermin.DomainModels.Models
{
    public class Service
    {
        public Guid Id { get; set; } = Guid.NewGuid();

        public Guid ArtistId { get; set; }
        public Artist Artist { get; set; }
        public string Name { get; set; }
        public string Description { get; set; }
        public int DurationMinutes { get; set; }   
        public decimal Price { get; set; }
        public bool IsActive { get; set; } = true;
        public ICollection<BookingService> BookingServices { get; set; }
    }
}