namespace SmartTermin.DTOs
{
    public class SalonDto
    {
        public string Id { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public string OwnerId { get; set; } = string.Empty;
        public string OwnerUserId { get; set; } = string.Empty;
        public string OwnerName { get; set; } = string.Empty;
        public string Address { get; set; } = string.Empty;
        public string City { get; set; } = string.Empty;
        public string Country { get; set; } = string.Empty;
        public string? Phone { get; set; }
        public string? Email { get; set; }
        public string? BannerImageUrl { get; set; }
        public string? ProfileImageUrl { get; set; }
        public string? About { get; set; }
        public int MemberCount { get; set; }
        public SalonSubscriptionDto? Subscription { get; set; }
        public List<SalonMemberDto> Members { get; set; } = new();
        public List<SalonInvitationDto> PendingInvitations { get; set; } = new();
        public string? OwnerArtistId { get; set; }
        public List<string> CombinedServices { get; set; } = new();
        public string? MinPrice { get; set; }
        public string? CustomBookingLink { get; set; }
    }

    public class SalonMemberDto
    {
        public string ArtistId { get; set; } = string.Empty;
        public string UserId { get; set; } = string.Empty;
        public string FullName { get; set; } = string.Empty;
        public string Role { get; set; } = "artist";
        public string? ProfileImageUrl { get; set; }
        public string? Profession { get; set; }
        public int Bookings { get; set; }
        public decimal Revenue { get; set; }
    }
}
