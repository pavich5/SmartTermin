using System;
using System.ComponentModel.DataAnnotations;

namespace SmartTermin.DTOs
{
    public class WalkInBookingRequestDto
    {
        [Required]
        public string ClientName { get; set; } = string.Empty;

        public string? ClientEmail { get; set; }

        public string? ClientPhone { get; set; }

        [Required]
        public Guid ArtistId { get; set; }

        [Required]
        public Guid ServiceId { get; set; }

        [RegularExpression(@"^\d{4}-\d{2}-\d{2}$", ErrorMessage = "Date must be in YYYY-MM-DD format")]
        public string? Date { get; set; }

        [RegularExpression(@"^\d{2}:\d{2}$", ErrorMessage = "Time must be in HH:mm format")]
        public string? Time { get; set; }

        [MaxLength(500)]
        public string? Notes { get; set; }
    }
}

