using System.Collections.Generic;

namespace SmartTermin.DTOs
{
    public class ArtistListItemDto
    {
        public string Id { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public string Profession { get; set; } = string.Empty;
        public string Image { get; set; } = string.Empty;
        public IList<string> Services { get; set; } = new List<string>();
        public string Price { get; set; } = string.Empty;
        public string Location { get; set; } = string.Empty;
        public decimal Rating { get; set; }
        public string? SalonId { get; set; }
        public string? CustomBookingLink { get; set; }
    }
}

