namespace SmartTermin.DTOs
{
    public class VerifyResetCodeRequestDto
    {
        public string Phone { get; set; } = string.Empty;
        public string Code { get; set; } = string.Empty; // 6 digits
    }
}



