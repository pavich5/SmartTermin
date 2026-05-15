using System.ComponentModel.DataAnnotations;

namespace SmartTermin.DTOs
{
    public class RegisterFcmTokenRequestDto
    {
        [Required]
        public string FcmToken { get; set; } = string.Empty;
    }
}

