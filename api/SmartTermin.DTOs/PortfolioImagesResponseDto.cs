using System.Collections.Generic;

namespace SmartTermin.DTOs
{
    public class PortfolioImagesResponseDto
    {
        public IList<PortfolioImageDto> Images { get; set; } = new List<PortfolioImageDto>();
    }
}

