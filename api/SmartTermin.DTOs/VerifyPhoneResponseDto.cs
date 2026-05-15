namespace SmartTermin.DTOs
{
    public class VerifyPhoneResponseDto
    {
        public bool Verified { get; set; }
        public string Jwt { get; set; } = string.Empty;
        public UserDto User { get; set; } = new UserDto();
    }
}



