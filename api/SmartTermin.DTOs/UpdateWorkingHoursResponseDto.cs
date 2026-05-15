namespace SmartTermin.DTOs
{
    public class UpdateWorkingHoursResponseDto
    {
        public bool Success { get; set; }
        public WorkingHoursResponseDto WorkingHours { get; set; } = new WorkingHoursResponseDto();
    }
}

