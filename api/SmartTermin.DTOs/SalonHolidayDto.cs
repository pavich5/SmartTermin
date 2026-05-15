namespace SmartTermin.DTOs
{
    public class SalonHolidayDto
    {
        public Guid Id { get; set; }
        public string HolidayDate { get; set; } = string.Empty;
        public string? Description { get; set; }
    }

    public class SalonHolidaysResponseDto
    {
        public List<SalonHolidayDto> Holidays { get; set; } = new List<SalonHolidayDto>();
    }

    public class CreateSalonHolidayRequestDto
    {
        public string HolidayDate { get; set; } = string.Empty;
        public string? Description { get; set; }
    }

    public class SalonHolidayResponseDto
    {
        public Guid Id { get; set; }
        public string HolidayDate { get; set; } = string.Empty;
        public string? Description { get; set; }
        public int ExistingBookingsCount { get; set; } = 0;
    }
}

