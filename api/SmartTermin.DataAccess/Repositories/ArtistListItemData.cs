namespace SmartTermin.DataAccess.Repositories
{
    public class ArtistListItemData
    {
        public Guid Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Profession { get; set; } = string.Empty;
        public string Image { get; set; } = string.Empty;
        public List<string> Services { get; set; } = new();
        public decimal? MinPrice { get; set; }
        public string Location { get; set; } = string.Empty;
        public decimal Rating { get; set; }
        public string? SalonId { get; set; }
        public string? CustomBookingLink { get; set; }
    }
}
