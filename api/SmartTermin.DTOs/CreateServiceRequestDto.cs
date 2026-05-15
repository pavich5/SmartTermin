using System.ComponentModel.DataAnnotations;

namespace SmartTermin.DTOs
{
    public class CreateServiceRequestDto
    {
        [Required]
        public string Name { get; set; } = string.Empty;

        [Required]
        [Range(1, int.MaxValue)]
        public int Duration { get; set; }

        [Required]
        [Range(0.0, double.MaxValue)]
        public decimal Price { get; set; }

        [Required]
        [MaxLength(1000)]
        public string Description { get; set; } = string.Empty;
    }
}

