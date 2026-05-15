using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace SmartTermin.DTOs
{
    public class CreateBookingRequestDto
    {
        [Required]
        public Guid ArtistId { get; set; }

        [Required]
        public List<Guid> ServiceIds { get; set; } = new List<Guid>();

        [Required]
        [RegularExpression(@"^\d{4}-\d{2}-\d{2}$", ErrorMessage = "Date must be in YYYY-MM-DD format")]
        public string Date { get; set; } = string.Empty;

        [Required]
        [RegularExpression(@"^\d{2}:\d{2}$", ErrorMessage = "Time must be in HH:mm format")]
        public string Time { get; set; } = string.Empty;

        [Required]
        [MaxLength(200)]
        public string CustomerName { get; set; } = string.Empty;

        [Required]
        [EmailAddress]
        public string CustomerEmail { get; set; } = string.Empty;

        [Required]
        [Phone]
        public string CustomerPhone { get; set; } = string.Empty;

        [MaxLength(500)]
        public string? Notes { get; set; }
    }
}

