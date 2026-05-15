namespace SmartTermin.DomainModels.Models
{
    public class SalonHoliday
    {
        public Guid Id { get; set; } = Guid.NewGuid();
        public Guid SalonId { get; set; }
        public Salon Salon { get; set; }
        public DateTime HolidayDate { get; set; }
        public string? Description { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}

