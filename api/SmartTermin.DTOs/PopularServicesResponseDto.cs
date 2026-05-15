using System.Collections.Generic;

namespace SmartTermin.DTOs
{
    public class PopularServicesResponseDto
    {
        public IList<PopularServiceDto> Services { get; set; } = new List<PopularServiceDto>();
    }
}

