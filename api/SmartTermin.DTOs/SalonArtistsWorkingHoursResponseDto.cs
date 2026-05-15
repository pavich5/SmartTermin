namespace SmartTermin.DTOs
{
    public class SalonArtistsWorkingHoursResponseDto
    {
        public List<ArtistWorkingHoursDto> Artists { get; set; } = new List<ArtistWorkingHoursDto>();
    }

    public class ArtistWorkingHoursDto
    {
        public string ArtistId { get; set; } = string.Empty;
        public string ArtistName { get; set; } = string.Empty;
        public string? ProfileImageUrl { get; set; }
        public WorkingHoursResponseDto WorkingHours { get; set; } = new WorkingHoursResponseDto();
    }
}
