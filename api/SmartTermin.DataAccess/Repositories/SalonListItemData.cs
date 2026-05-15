namespace SmartTermin.DataAccess.Repositories
{
    public class SalonListItemData
    {
        public Guid Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public Guid OwnerUserId { get; set; }
        public string? OwnerFullName { get; set; }
        public Guid? OwnerArtistId { get; set; }
        public string? OwnerProfileImageUrl { get; set; }
        public string? Address { get; set; }
        public string? City { get; set; }
        public string? Country { get; set; }
        public string? Phone { get; set; }
        public string? Email { get; set; }
        public string? BannerImageUrl { get; set; }
        public string? ProfileImageUrl { get; set; }
        public string? About { get; set; }
        public string? CustomBookingLink { get; set; }
        public List<SalonMemberListItemData> Members { get; set; } = new();
        public List<string> CombinedServices { get; set; } = new();
        public decimal? MinServicePrice { get; set; }
    }

    public class SalonMemberListItemData
    {
        public Guid ArtistId { get; set; }
        public Guid UserId { get; set; }
        public string FullName { get; set; } = string.Empty;
        public string Role { get; set; } = "artist";
        public string? ProfileImageUrl { get; set; }
        public string? Profession { get; set; }
        public int BookingCount { get; set; }
        public decimal Revenue { get; set; }
    }
}
