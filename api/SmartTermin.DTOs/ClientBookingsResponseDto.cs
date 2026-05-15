using System.Collections.Generic;

namespace SmartTermin.DTOs
{
    public class ClientBookingsResponseDto
    {
        public IList<ClientBookingDto> Bookings { get; set; } = new List<ClientBookingDto>();
    }
}

