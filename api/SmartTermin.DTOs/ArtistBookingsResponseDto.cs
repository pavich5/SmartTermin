using System.Collections.Generic;

namespace SmartTermin.DTOs
{
    public class ArtistBookingsResponseDto
    {
        public IList<ArtistBookingDto> Bookings { get; set; } = new List<ArtistBookingDto>();
    }
}

