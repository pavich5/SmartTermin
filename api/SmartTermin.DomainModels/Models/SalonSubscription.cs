namespace SmartTermin.DomainModels.Models
{
    public class SalonSubscription
    {
        public Guid Id { get; set; } = Guid.NewGuid();
        public Guid SalonId { get; set; }
        public Salon Salon { get; set; }
        public string PlanType { get; set; } = "enterprise";
        public int ArtistCount { get; set; }
        public decimal MonthlyCost { get; set; }
        public string BillingCycle { get; set; } = "monthly";
        public string Status { get; set; } = "active"; // active | cancelled | expired | trial
        public string? PaddleSubscriptionId { get; set; }
        public DateTime CurrentPeriodStart { get; set; } = DateTime.UtcNow;
        public DateTime CurrentPeriodEnd { get; set; } = DateTime.UtcNow.AddMonths(1);
        public DateTime? NextPaymentDate { get; set; }
        public DateTime? TrialEndsAt { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    }
}
