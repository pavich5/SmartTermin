namespace SmartTermin.DTOs
{
    public class UpdateProfileRequestDto
    {
        public string? FullName { get; set; }
        public string? Phone { get; set; }
        public string? Email { get; set; }
        
        // Artist-specific fields (optional, ignored for non-artist users)
        public string? BusinessName { get; set; }
        public string? About { get; set; }
    }
}









