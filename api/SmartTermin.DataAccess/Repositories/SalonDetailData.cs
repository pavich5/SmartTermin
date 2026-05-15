namespace SmartTermin.DataAccess.Repositories
{
    public class SalonDetailData
    {
        public List<SalonMembershipBasic> Memberships { get; set; } = new();
        public List<Guid> MemberArtistIds { get; set; } = new();
        public Dictionary<Guid, ArtistBasic> ArtistsDict { get; set; } = new();
        public Dictionary<Guid, UserBasic> UsersDict { get; set; } = new();
        public Dictionary<Guid, string> ProfileImageDict { get; set; } = new();
        public List<ServiceBasic> Services { get; set; } = new();
    }

    public class SalonMembershipBasic
    {
        public Guid SalonId { get; set; }
        public Guid ArtistId { get; set; }
        public string Role { get; set; } = string.Empty;
    }

    public class ArtistBasic
    {
        public Guid Id { get; set; }
        public Guid UserId { get; set; }
        public string? Profession { get; set; }
        public Guid? SalonId { get; set; }
    }

    public class UserBasic
    {
        public Guid Id { get; set; }
        public string? FullName { get; set; }
    }

    public class ServiceBasic
    {
        public Guid ArtistId { get; set; }
        public string Name { get; set; } = string.Empty;
        public decimal Price { get; set; }
    }
}









