using System.Collections.Generic;

namespace SmartTermin.DTOs
{
    public class ServiceListResponseDto
    {
        public IList<ServiceSummaryDto> Services { get; set; } = new List<ServiceSummaryDto>();
    }
}

