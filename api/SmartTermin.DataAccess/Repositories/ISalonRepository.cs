using SmartTermin.DomainModels.Models;

namespace SmartTermin.DataAccess.Repositories
{
    public interface ISalonRepository
    {
        Task<Salon> CreateSalonAsync(Salon salon);
        Task<Salon?> GetSalonByIdAsync(Guid salonId);
        Task<Salon?> GetSalonWithDetailsAsync(Guid salonId);
        Task<Salon> UpdateSalonAsync(Salon salon);
        Task<bool> DeleteSalonAsync(Guid salonId);
        Task<IList<SalonMembership>> GetMembersAsync(Guid salonId);
        Task<SalonMembership> AddMembershipAsync(SalonMembership membership);
        Task<bool> RemoveMembershipAsync(Guid salonId, Guid artistId);
        Task<IList<SalonInvitation>> GetInvitationsForSalonAsync(Guid salonId);
        Task<SalonInvitation> CreateInvitationAsync(SalonInvitation invitation);
        Task<SalonInvitation?> GetInvitationByTokenAsync(string token);
        Task<SalonInvitation?> GetInvitationByIdAsync(Guid invitationId);
        Task UpdateInvitationAsync(SalonInvitation invitation);
        Task<bool> DeleteInvitationAsync(Guid invitationId);
        Task<SalonInvitation?> GetPendingInvitationByEmailOrPhoneAsync(Guid salonId, string? email, string? phone);
        Task<SalonSubscription?> GetSubscriptionAsync(Guid salonId);
        Task<SalonSubscription?> GetSubscriptionByPaddleSubscriptionIdAsync(string paddleSubscriptionId);
        Task<Dictionary<Guid, SalonSubscription?>> GetSubscriptionsBySalonIdsAsync(IEnumerable<Guid> salonIds);
        Task<SalonSubscription> UpsertSubscriptionAsync(SalonSubscription subscription);
        Task<IList<Booking>> GetBookingsForSalonAsync(Guid salonId, DateTime? startDate, DateTime? endDate);
        Task<Dictionary<Guid, IList<Booking>>> GetBookingsBySalonIdsAsync(IEnumerable<Guid> salonIds);
        Task<List<(Guid ArtistId, int Count, decimal Revenue)>> GetBookingStatsForArtistsAsync(IEnumerable<Guid> artistIds);
        Task<IList<Artist>> GetArtistsForSalonAsync(Guid salonId);
        Task SaveChangesAsync();
        Task<List<SalonSubscription>> GetAllSubscriptionsAsync();
        Task<IList<Salon>> GetAllSalonsAsync();
        Task<(IList<Salon> Salons, int TotalCount)> GetAllSalonsAsync(int page, int limit);
        Task<Salon?> GetSalonByCustomBookingLinkAsync(string customBookingLink);
        Task<(IList<SalonListItemData> Salons, int TotalCount)> GetSalonsListAsync(int page, int limit);
        Task<SalonDetailData?> GetSalonDetailDataAsync(Guid salonId);
        Task<SalonAnalyticsData> GetAnalyticsDataAsync(Guid salonId);
        Task<(List<SalonCalendarBookingData> Bookings, Dictionary<Guid, string> ArtistNames, Dictionary<Guid, string> ServiceNames, int TotalCount)> GetCalendarDataAsync(Guid salonId, DateTime? startDate, DateTime? endDate, int page, int limit);
        Task<int> GetActiveArtistCountAsync(Guid salonId);
        Task<List<(Guid ArtistId, string ServiceName)>> GetAllServicesForArtistsAsync(List<Guid> artistIds);
    }
}
