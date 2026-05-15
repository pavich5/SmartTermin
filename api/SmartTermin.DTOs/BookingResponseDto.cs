using System;

namespace SmartTermin.DTOs
{
    public class BookingResponseDto
    {
        public string Id { get; set; } = string.Empty;
        public string ArtistId { get; set; } = string.Empty;
        public string ServiceId { get; set; } = string.Empty;
        public string Date { get; set; } = string.Empty;
        public string Time { get; set; } = string.Empty;
        public string Status { get; set; } = string.Empty;
        public int Duration { get; set; }
        public decimal Price { get; set; }
        public string CustomerName { get; set; } = string.Empty;
        public string CustomerEmail { get; set; } = string.Empty;
        public string CustomerPhone { get; set; } = string.Empty;
        public string? Notes { get; set; }
    }
}

