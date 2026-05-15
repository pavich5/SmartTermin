using SmartTermin.DTOs;

namespace SmartTermin.Services
{
    public interface ISalonService
    {
        Task<SalonDto> CreateSalonAsync(Guid ownerUserId, CreateSalonRequestDto request);
        Task<SalonDto?> GetSalonAsync(Guid salonId);
        Task<SalonDto> UpdateSalonAsync(Guid salonId, Guid ownerUserId, UpdateSalonRequestDto request);
        Task<bool> DeleteSalonAsync(Guid salonId, Guid ownerUserId);
        Task<SalonMembersResponseDto> GetMembersAsync(Guid salonId);
        Task<SalonInvitationDto> InviteArtistAsync(Guid salonId, Guid ownerUserId, InviteArtistRequestDto request);
        Task<bool> CancelInvitationAsync(Guid salonId, Guid invitationId, Guid ownerUserId);
        Task<SalonInvitationDto?> GetInvitationByTokenAsync(string token);
        Task<SalonDto> AcceptInvitationAsync(string token, Guid artistUserId);
        Task<bool> RemoveArtistAsync(Guid salonId, Guid artistId, Guid ownerUserId);
        Task<bool> LeaveSalonAsync(Guid salonId, Guid artistUserId);
        Task<bool> ToggleOwnerAsArtistAsync(Guid salonId, Guid ownerUserId, bool isArtist);
        Task<SalonSubscriptionDto> GetSubscriptionAsync(Guid salonId);
        Task<SalonSubscriptionDto> UpdateSubscriptionAsync(Guid salonId, Guid ownerUserId, UpdateSalonSubscriptionRequestDto request);
        Task CheckAndExpireTrialsAsync();
        Task ConvertTrialToPaidAsync(Guid salonId, string paddleSubscriptionId);
        Task<string?> GetInvoiceUrlAsync(Guid salonId);
        Task<SalonAnalyticsDto> GetAnalyticsAsync(Guid salonId);
        Task<SalonCalendarResponseDto> GetCalendarAsync(Guid salonId, DateTime? startDate, DateTime? endDate, int page = 1, int limit = 10);
        Task<IList<AvailableSalonSlotDto>> GetAvailableSlotsAsync(Guid salonId, DateTime date);
        Task<IList<SalonDto>> GetAllSalonsAsync();
        Task<object> GetAllSalonsAsync(int page, int limit);
        Task<SalonDto?> GetSalonByCustomBookingLinkAsync(string customBookingLink);
    }
}
