using System.Collections.Generic;

namespace SmartTermin.DTOs
{
    public class ArtistClientsResponseDto
    {
        public IList<ArtistClientDto> Clients { get; set; } = new List<ArtistClientDto>();
    }
}

