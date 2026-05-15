using System.ComponentModel.DataAnnotations;

namespace SmartTermin.DTOs
{
    public class CreateReviewRequestDto
    {
        [Required]
        public string ArtistId { get; set; } = string.Empty;

        [Required]
        public string ServiceId { get; set; } = string.Empty;

        [Required]
        [Range(1, 5, ErrorMessage = "Rating must be between 1 and 5")]
        public int Rating { get; set; }

        [StringLength(1000, ErrorMessage = "Review text cannot exceed 1000 characters")]
        public string? ReviewText { get; set; }

        public string? BookingId { get; set; }
    }
}


