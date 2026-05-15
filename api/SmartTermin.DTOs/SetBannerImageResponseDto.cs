namespace SmartTermin.DTOs
{
    public class SetBannerImageResponseDto
    {
        public bool Success { get; set; }
        public PortfolioImageDto Image { get; set; } = new PortfolioImageDto();
    }
}

