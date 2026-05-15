namespace SmartTermin.DTOs
{
    public class PortfolioImageDto
    {
        public string Id { get; set; } = string.Empty;
        public string Url { get; set; } = string.Empty;
        public bool IsBannerImage { get; set; }
        public bool IsProfilePicture { get; set; }
    }
}

