using SmartTermin.DTOs;

namespace SmartTermin.Services
{
    public interface ISubscriptionService
    {
        Task<string> GetUserPlanTypeAsync(Guid userId);
        Task<bool> IsProUserAsync(Guid userId);
        Task<SubscriptionLimitsDto> GetUserLimitsAsync(Guid userId);
        Task<bool> CanCreateServiceAsync(Guid userId);
        Task<bool> CanUploadPortfolioImageAsync(Guid userId);
        Task<bool> CanCreateBookingAsync(Guid userId);
        Task<bool> CanCreateWalkInBookingAsync(Guid userId);
        Task<bool> CanSendEmailAsync(Guid userId);
        Task<int> GetServiceCountAsync(Guid userId);
        Task<int> GetPortfolioImageCountAsync(Guid userId);
        Task<int> GetMonthlyBookingCountAsync(Guid userId);
        Task<int> GetMonthlyWalkInCountAsync(Guid userId);
        Task<int> GetMonthlyEmailCountAsync(Guid userId);
    }
}

