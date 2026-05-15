namespace SmartTermin.DomainModels.Models
{
    public class PortfolioImage
    {
        public Guid Id { get; set; } = Guid.NewGuid();
        public Guid? ArtistId { get; set; }
        public Artist? Artist { get; set; }
        public Guid? SalonId { get; set; }
        public Salon? Salon { get; set; }
        public string ImageUrl { get; set; }
        public int DisplayOrder { get; set; } = 0;
        public bool IsBannerImage { get; set; } = false;
        public bool IsProfilePicture { get; set; } = false;
    }
}
