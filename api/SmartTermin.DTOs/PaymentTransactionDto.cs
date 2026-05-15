namespace SmartTermin.DTOs
{
    public class PaymentTransactionDto
    {
        public string Id { get; set; } = string.Empty;
        public string TransactionId { get; set; } = string.Empty;
        public decimal Amount { get; set; }
        public string Currency { get; set; } = "EUR";
        public string Status { get; set; } = "success";
        public DateTime Date { get; set; }
        public string SubscriptionType { get; set; } = "monthly";
        public string? PaymentMethod { get; set; }
        public string? Description { get; set; }
        public string? ReceiptUrl { get; set; }
    }
}







