namespace SmartTermin.DTOs
{
    public class HolidayDto
    {
        public Guid Id { get; set; }
        public string HolidayDate { get; set; } = string.Empty;
        public string? Description { get; set; }
    }

    public class HolidaysResponseDto
    {
        public List<HolidayDto> Holidays { get; set; } = new List<HolidayDto>();
    }

    public class CreateHolidayRequestDto
    {
        public string HolidayDate { get; set; } = string.Empty;
        public string? Description { get; set; }
    }

    public class HolidayResponseDto
    {
        public Guid Id { get; set; }
        public string HolidayDate { get; set; } = string.Empty;
        public string? Description { get; set; }
        public int ExistingBookingsCount { get; set; } = 0;
    }
}

