namespace SmartTermin.Services
{
    public class FirebaseSettings
    {
        public string ProjectId { get; set; } = string.Empty;
        public string? ServiceAccountKeyPath { get; set; } // Path to service account JSON file
        public string? ServiceAccountKeyJson { get; set; } // Service account JSON as string (alternative to file path)
    }
}

