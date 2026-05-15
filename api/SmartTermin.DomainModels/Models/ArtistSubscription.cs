namespace SmartTermin.DomainModels.Models
{
    public class ArtistSubscription
    {
        public Guid Id { get; set; } = Guid.NewGuid();
        public Guid ArtistId { get; set; }
        public Artist Artist { get; set; }
        public Guid PlanId { get; set; }
        public string? PaddleSubscriptionId { get; set; }
        public string? PaddleCustomerId { get; set; }
        public string BillingCycle { get; set; } 
        public string Status { get; set; } = "active";
        public DateTime CurrentPeriodStart { get; set; }
        public DateTime CurrentPeriodEnd { get; set; }
        public DateTime? TrialEndsAt { get; set; }
        public DateTime? CancelledAt { get; set; }
        public decimal? MonthlyCost { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    }
}
