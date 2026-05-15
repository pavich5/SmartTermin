namespace SmartTermin.DTOs
{
    public class LoginResponseDto
    {
        public string Token { get; set; } = string.Empty;
        public UserDto User { get; set; } = new UserDto();
        public bool IsAccountDeactivated { get; set; } = false;
        public string? UserId { get; set; }
    }
}
