using System.ComponentModel.DataAnnotations;

namespace SmartTermin.DTOs
{
    public class UpdateServiceRequestDto
    {
        [MaxLength(200)]
        public string? Name { get; set; }

        [Range(1, int.MaxValue)]
        public int? Duration { get; set; }

        [Range(0.0, double.MaxValue)]
        public decimal? Price { get; set; }

        [MaxLength(1000)]
        public string? Description { get; set; }
    }
}

