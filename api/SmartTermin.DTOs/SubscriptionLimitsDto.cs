namespace SmartTermin.DTOs
{
    public class SubscriptionLimitsDto
    {
        public string PlanType { get; set; } = "free"; // "free" or "pro"
        public bool IsPro { get; set; }
        public bool IsFreeTrial { get; set; }
        public int MaxServices { get; set; }
        public int CurrentServices { get; set; }
        public int MaxPortfolioImages { get; set; }
        public int CurrentPortfolioImages { get; set; }
        public int MaxBookingsPerMonth { get; set; }
        public int CurrentBookingsThisMonth { get; set; }
        public int MaxWalkInBookingsPerMonth { get; set; }
        public int CurrentWalkInBookingsThisMonth { get; set; }
        public int MaxEmailsPerMonth { get; set; }
        public int CurrentEmailsThisMonth { get; set; }
    }
}

