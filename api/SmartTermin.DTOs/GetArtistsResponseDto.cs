using System.Collections.Generic;

namespace SmartTermin.DTOs
{
    public class GetArtistsResponseDto
    {
        public IList<ArtistListItemDto> Artists { get; set; } = new List<ArtistListItemDto>();
        public int Total { get; set; }
        public int Page { get; set; }
        public int Limit { get; set; }
    }
}

