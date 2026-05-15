using System.ComponentModel.DataAnnotations;

namespace SmartTermin.DTOs
{
    public class RebookBookingRequestDto
    {
        [Required]
        [RegularExpression(@"^\d{4}-\d{2}-\d{2}$", ErrorMessage = "Date must be in YYYY-MM-DD format")]
        public string Date { get; set; } = string.Empty;

        [Required]
        [RegularExpression(@"^\d{2}:\d{2}$", ErrorMessage = "Time must be in HH:mm format")]
        public string Time { get; set; } = string.Empty;
    }
}

