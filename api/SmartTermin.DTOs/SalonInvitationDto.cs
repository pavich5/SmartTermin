namespace SmartTermin.DTOs
{
    public class SalonInvitationDto
    {
        public string Id { get; set; } = string.Empty;
        public string SalonId { get; set; } = string.Empty;
        public string? Email { get; set; }
        public string? Phone { get; set; }
        public string InvitedBy { get; set; } = string.Empty;
        public string Token { get; set; } = string.Empty;
        public string? InvitationUrl { get; set; }
        public DateTime ExpiresAt { get; set; }
        public string Status { get; set; } = "pending";
        public DateTime CreatedAt { get; set; }
    }

    public class InviteArtistRequestDto
    {
        public string? Email { get; set; }
        public string? Phone { get; set; }
        public string Role { get; set; } = "artist";
        public string? Message { get; set; }
    }

    public class AcceptSalonInvitationRequestDto
    {
        public string Token { get; set; } = string.Empty;
    }
}
