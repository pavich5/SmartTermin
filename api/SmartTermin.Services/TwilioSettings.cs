namespace SmartTermin.Services
{
    public class TwilioSettings
    {
        public string AccountSID { get; set; } = string.Empty;
        public string AuthToken { get; set; } = string.Empty;
        public string PhoneNumber { get; set; } = string.Empty;
        /// <summary>
        /// Alphanumeric Sender ID (e.g., "SmartTermin"). Use this for countries that don't support international long codes well (like Macedonia).
        /// Must be registered with Twilio. Leave empty to use PhoneNumber instead.
        /// </summary>
        public string? AlphanumericSenderId { get; set; }
    }
}