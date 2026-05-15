using System.Collections.Generic;

namespace SmartTermin.DTOs
{
    public class ArtistDetailDto
    {
        public string Id { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public string Profession { get; set; } = string.Empty;
        public string BannerImage { get; set; } = string.Empty;
        public string ProfileImage { get; set; } = string.Empty;
        public decimal Rating { get; set; }
        public int ReviewsTotal { get; set; }
        public string Location { get; set; } = string.Empty;
        public string Phone { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string About { get; set; } = string.Empty;
        public IList<ArtistServiceItemDto> Services { get; set; } = new List<ArtistServiceItemDto>();
        public IList<string> Portfolio { get; set; } = new List<string>();
        public IDictionary<string, string> WorkingHours { get; set; } = new Dictionary<string, string>();
        public string? SalonId { get; set; }
    }
}

