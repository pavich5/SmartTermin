namespace SmartTermin.DTOs
{
    public class ResetPasswordRequestDto
    {
        public string Phone { get; set; } = string.Empty;
        public string ResetToken { get; set; } = string.Empty;
        public string NewPassword { get; set; } = string.Empty;
    }
}



