namespace SmartTermin.DTOs
{
    public class ArtistSubscriptionDto
    {
        public string Id { get; set; } = string.Empty;
        public string PlanType { get; set; } = "pro";
        public string BillingCycle { get; set; } = "monthly";
        public string Status { get; set; } = "active";
        public string? PaddleSubscriptionId { get; set; }
        public DateTime CurrentPeriodStart { get; set; }
        public DateTime CurrentPeriodEnd { get; set; }
        public DateTime? NextPaymentDate { get; set; }
        public string? PaymentMethodMasked { get; set; }
        public DateTime? TrialEndsAt { get; set; }
        public decimal? MonthlyCost { get; set; }
    }
}







