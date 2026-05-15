namespace SmartTermin.DTOs
{
    public class WorkingHoursResponseDto
    {
        public DayWorkingHoursDto Monday { get; set; } = new DayWorkingHoursDto();
        public DayWorkingHoursDto Tuesday { get; set; } = new DayWorkingHoursDto();
        public DayWorkingHoursDto Wednesday { get; set; } = new DayWorkingHoursDto();
        public DayWorkingHoursDto Thursday { get; set; } = new DayWorkingHoursDto();
        public DayWorkingHoursDto Friday { get; set; } = new DayWorkingHoursDto();
        public DayWorkingHoursDto Saturday { get; set; } = new DayWorkingHoursDto();
        public DayWorkingHoursDto Sunday { get; set; } = new DayWorkingHoursDto();
    }
}

