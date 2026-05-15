namespace SmartTermin.DTOs
{
    public class SalonMembersResponseDto
    {
        public List<SalonMemberDto> Members { get; set; } = new();
        public List<SalonInvitationDto> PendingInvitations { get; set; } = new();
    }
}
