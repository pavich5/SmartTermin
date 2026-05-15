namespace SmartTermin.DTOs
{
    public class VerifyResetCodeResponseDto
    {
        public bool Verified { get; set; }
        public string ResetToken { get; set; } = string.Empty; // Temporary token for password reset
    }
}



