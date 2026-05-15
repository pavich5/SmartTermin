using System.ComponentModel.DataAnnotations;

namespace SmartTermin.DTOs
{
    public class VerifyPhoneChangeRequestDto
    {
        [Required(ErrorMessage = "Phone number is required")]
        public string Phone { get; set; } = string.Empty;
        
        [Required(ErrorMessage = "Verification code is required")]
        [StringLength(6, MinimumLength = 6, ErrorMessage = "Verification code must be 6 digits")]
        public string Code { get; set; } = string.Empty;
    }
}









