namespace SmartTermin.DTOs
{
    public class SalonSubscriptionDto
    {
        public string Id { get; set; } = string.Empty;
        public string PlanType { get; set; } = "enterprise";
        public int ArtistCount { get; set; }
        public decimal MonthlyCost { get; set; }
        public string BillingCycle { get; set; } = "monthly";
        public string Status { get; set; } = "active";
        public string? PaddleSubscriptionId { get; set; }
        public DateTime CurrentPeriodStart { get; set; }
        public DateTime CurrentPeriodEnd { get; set; }
        public DateTime? NextPaymentDate { get; set; }
        public string? PaymentMethodMasked { get; set; }
        public DateTime? TrialEndsAt { get; set; }
    }

    public class UpdateSalonSubscriptionRequestDto
    {
        public int ArtistCount { get; set; }
        public string BillingCycle { get; set; } = "monthly";
        public string? Status { get; set; }
        public bool KeepOwnerSubscription { get; set; } = false;
    }
}
