namespace SmartTermin.DomainModels.Models
{
    public class Booking
    {
        public Guid Id { get; set; } = Guid.NewGuid();

        public Guid ArtistId { get; set; }
        public Artist Artist { get; set; }

        public Guid ClientId { get; set; }
        public User Client { get; set; }
        public DateTime BookingDate { get; set; }   // Date only
        public TimeSpan BookingTime { get; set; }   // Time only
        public string Status { get; set; } = "confirmed";
        // confirmed, completed, cancelled, declined
        public int TotalDurationMinutes { get; set; }
        public decimal? TotalPrice { get; set; }
        public string? Notes { get; set; } = string.Empty;
        public string? CustomerName { get; set; } = string.Empty;
        public string? CustomerEmail { get; set; } = string.Empty;
        public string? CustomerPhone { get; set; } = string.Empty;
        public bool IsWalkIn { get; set; } = false;
        public DateTime? ConfirmedAt { get; set; }
        public DateTime? CompletedAt { get; set; }
        public DateTime? CancelledAt { get; set; }
        public string? CancellationReason { get; set; } = string.Empty;
        public bool Reminder24hSent { get; set; } = false;
        public bool Reminder1hSent { get; set; } = false;
        public DateTime? ProposedRescheduleDate { get; set; }  // Proposed new date
        public TimeSpan? ProposedRescheduleTime { get; set; }  // Proposed new time
        public string? RescheduleMessage { get; set; } = string.Empty;  // Message from artist
        public ICollection<BookingService> BookingServices { get; set; }
            = new List<BookingService>();

    }
}
