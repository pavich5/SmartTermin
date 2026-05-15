using System.Collections.Generic;

namespace SmartTermin.DTOs
{
    public class AvailableSlotsResponseDto
    {
        public IList<AvailableSlotDto> Slots { get; set; } = new List<AvailableSlotDto>();
        public string? NextAvailableSlot { get; set; } // The earliest available slot time
        public int SlotIntervalMinutes { get; set; } = 15; // Interval between slots (e.g., 15 min)
        public int BufferMinutes { get; set; } = 15; // Buffer time between appointments
        public bool IsHoliday { get; set; } = false; // Indicates if the selected date is a holiday
        public string? HolidayDescription { get; set; } // Optional description of the holiday
    }
}

