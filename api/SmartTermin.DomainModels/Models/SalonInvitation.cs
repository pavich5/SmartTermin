namespace SmartTermin.DomainModels.Models
{
    public class SalonInvitation
    {
        public Guid Id { get; set; } = Guid.NewGuid();
        public Guid SalonId { get; set; }
        public Salon Salon { get; set; }
        public string? Email { get; set; }
        public string? Phone { get; set; }
        public Guid InvitedBy { get; set; }
        public User InvitedByUser { get; set; }
        public string Token { get; set; } = string.Empty;
        public DateTime ExpiresAt { get; set; }
        public string Status { get; set; } = "pending"; // pending | accepted | expired | cancelled
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
