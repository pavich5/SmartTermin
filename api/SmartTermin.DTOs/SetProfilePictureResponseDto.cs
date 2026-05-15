namespace SmartTermin.DTOs
{
    public class SetProfilePictureResponseDto
    {
        public bool Success { get; set; }
        public PortfolioImageDto Image { get; set; } = new PortfolioImageDto();
    }
}

