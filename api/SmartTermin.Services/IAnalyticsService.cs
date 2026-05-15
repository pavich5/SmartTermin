using SmartTermin.DTOs;

namespace SmartTermin.Services
{
    public interface IAnalyticsService
    {
        Task<DashboardStatsDto> GetDashboardStatsAsync(Guid artistUserId, string period);
        Task<PopularServicesResponseDto> GetPopularServicesAsync(Guid artistUserId);
    }
}

