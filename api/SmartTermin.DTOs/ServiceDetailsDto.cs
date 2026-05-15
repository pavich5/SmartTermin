namespace SmartTermin.DTOs
{
    public class ServiceDetailsDto
    {
        public string Id { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public int Duration { get; set; }
        public decimal Price { get; set; }
        public string Description { get; set; } = string.Empty;
    }
}

