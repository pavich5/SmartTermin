namespace SmartTermin.DTOs
{
    public class SignupRequestDto
    {
        public string Phone { get; set; } = string.Empty;
        public string Password { get; set; } = string.Empty;
        public string FullName { get; set; } = string.Empty;
        public string UserType { get; set; } = string.Empty; // "artist" or "client"
        public string? Email { get; set; } // Optional email
        public DateTime? DateOfBirth { get; set; } // Optional date of birth for clients
    }
}

