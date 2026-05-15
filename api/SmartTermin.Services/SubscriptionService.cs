using SmartTermin.DataAccess.Repositories;
using SmartTermin.DTOs;

namespace SmartTermin.Services
{
    public class SubscriptionService : ISubscriptionService
    {
        private readonly IUserRepository _userRepository;
        private readonly IServiceRepository _serviceRepository;
        private readonly IPortfolioRepository _portfolioRepository;
        private readonly IBookingRepository _bookingRepository;
        private readonly ISalonRepository _salonRepository;

        public SubscriptionService(
            IUserRepository userRepository,
            IServiceRepository serviceRepository,
            IPortfolioRepository portfolioRepository,
            IBookingRepository bookingRepository,
            ISalonRepository salonRepository)
        {
            _userRepository = userRepository;
            _serviceRepository = serviceRepository;
            _portfolioRepository = portfolioRepository;
            _bookingRepository = bookingRepository;
            _salonRepository = salonRepository;
        }

        public async Task<string> GetUserPlanTypeAsync(Guid userId)
        {
            var user = await _userRepository.GetUserByIdWithArtistProfileAsync(userId);
            if (user?.UserType != "artist" || user.ArtistProfile == null)
            {
                return "free";
            }

            // Check salon enterprise subscription (trial or paid)
            if (user.ArtistProfile.SalonId.HasValue)
            {
                var salonSubscription = await _salonRepository.GetSubscriptionAsync(user.ArtistProfile.SalonId.Value);
                if (salonSubscription != null)
                {
                    if (salonSubscription.Status == "trial" &&
                        salonSubscription.TrialEndsAt.HasValue &&
                        salonSubscription.TrialEndsAt.Value > DateTime.UtcNow)
                    {
                        return "pro";
                    }

                    if (salonSubscription.Status == "active" &&
                        !string.IsNullOrEmpty(salonSubscription.PaddleSubscriptionId))
                    {
                        return "pro";
                    }
                }
            }

            var activeSubscription = await _userRepository.GetActiveSubscriptionByArtistIdAsync(user.ArtistProfile.Id);
            
            // Check if user is on free trial
            if (activeSubscription != null && activeSubscription.TrialEndsAt.HasValue && activeSubscription.TrialEndsAt.Value > DateTime.UtcNow)
            {
                return "pro"; // Trial users get Pro features
            }

            // Check if user has active Pro subscription (has PaddleSubscriptionId and status is active)
            if (activeSubscription != null && !string.IsNullOrEmpty(activeSubscription.PaddleSubscriptionId) && activeSubscription.Status == "active")
            {
                return "pro";
            }

            return "free";
        }

        public async Task<bool> IsProUserAsync(Guid userId)
        {
            var planType = await GetUserPlanTypeAsync(userId);
            return planType == "pro";
        }

        public async Task<SubscriptionLimitsDto> GetUserLimitsAsync(Guid userId)
        {
            var planType = await GetUserPlanTypeAsync(userId);
            var isPro = planType == "pro";
            
            var user = await _userRepository.GetUserByIdWithArtistProfileAsync(userId);
            var isFreeTrial = false;
            
            if (user?.UserType == "artist" && user.ArtistProfile != null)
            {
                var activeSubscription = await _userRepository.GetActiveSubscriptionByArtistIdAsync(user.ArtistProfile.Id);
                isFreeTrial = activeSubscription != null && activeSubscription.TrialEndsAt.HasValue && activeSubscription.TrialEndsAt.Value > DateTime.UtcNow;
            }

            var limits = new SubscriptionLimitsDto
            {
                PlanType = planType,
                IsPro = isPro,
                IsFreeTrial = isFreeTrial,
                MaxServices = isPro ? int.MaxValue : 3,
                MaxPortfolioImages = isPro ? int.MaxValue : 5,
                MaxBookingsPerMonth = isPro ? int.MaxValue : 20,
                MaxWalkInBookingsPerMonth = isPro ? int.MaxValue : 5,
                MaxEmailsPerMonth = isPro ? int.MaxValue : 50
            };

            // Get current counts
            if (user?.UserType == "artist" && user.ArtistProfile != null)
            {
                var artistId = user.ArtistProfile.Id;
                limits.CurrentServices = await GetServiceCountAsync(userId);
                limits.CurrentPortfolioImages = await GetPortfolioImageCountAsync(userId);
                limits.CurrentBookingsThisMonth = await GetMonthlyBookingCountAsync(userId);
                limits.CurrentWalkInBookingsThisMonth = await GetMonthlyWalkInCountAsync(userId);
                limits.CurrentEmailsThisMonth = await GetMonthlyEmailCountAsync(userId);
            }

            return limits;
        }

        public async Task<bool> CanCreateServiceAsync(Guid userId)
        {
            var limits = await GetUserLimitsAsync(userId);
            return limits.CurrentServices < limits.MaxServices;
        }

        public async Task<bool> CanUploadPortfolioImageAsync(Guid userId)
        {
            var limits = await GetUserLimitsAsync(userId);
            return limits.CurrentPortfolioImages < limits.MaxPortfolioImages;
        }

        public async Task<bool> CanCreateBookingAsync(Guid userId)
        {
            var limits = await GetUserLimitsAsync(userId);
            return limits.CurrentBookingsThisMonth < limits.MaxBookingsPerMonth;
        }

        public async Task<bool> CanCreateWalkInBookingAsync(Guid userId)
        {
            var limits = await GetUserLimitsAsync(userId);
            return limits.CurrentWalkInBookingsThisMonth < limits.MaxWalkInBookingsPerMonth;
        }

        public async Task<bool> CanSendEmailAsync(Guid userId)
        {
            var limits = await GetUserLimitsAsync(userId);
            return limits.CurrentEmailsThisMonth < limits.MaxEmailsPerMonth;
        }

        public async Task<int> GetServiceCountAsync(Guid userId)
        {
            var user = await _userRepository.GetUserByIdWithArtistProfileAsync(userId);
            if (user?.UserType != "artist" || user.ArtistProfile == null)
            {
                return 0;
            }

            var services = await _serviceRepository.GetServicesForArtistAsync(user.ArtistProfile.Id);
            return services.Count;
        }

        public async Task<int> GetPortfolioImageCountAsync(Guid userId)
        {
            var user = await _userRepository.GetUserByIdWithArtistProfileAsync(userId);
            if (user?.UserType != "artist" || user.ArtistProfile == null)
            {
                return 0;
            }

            var images = await _portfolioRepository.GetPortfolioImagesForArtistAsync(user.ArtistProfile.Id);
            return images.Count;
        }

        public async Task<int> GetMonthlyBookingCountAsync(Guid userId)
        {
            var user = await _userRepository.GetUserByIdWithArtistProfileAsync(userId);
            if (user?.UserType != "artist" || user.ArtistProfile == null)
            {
                return 0;
            }

            var startOfMonth = new DateTime(DateTime.UtcNow.Year, DateTime.UtcNow.Month, 1);
            var endOfMonth = startOfMonth.AddMonths(1);

            var bookings = await _bookingRepository.GetBookingsForArtistAsync(user.ArtistProfile.Id, null);
            return bookings.Count(b => b.BookingDate >= startOfMonth && b.BookingDate < endOfMonth && !b.IsWalkIn);
        }

        public async Task<int> GetMonthlyWalkInCountAsync(Guid userId)
        {
            var user = await _userRepository.GetUserByIdWithArtistProfileAsync(userId);
            if (user?.UserType != "artist" || user.ArtistProfile == null)
            {
                return 0;
            }

            var startOfMonth = new DateTime(DateTime.UtcNow.Year, DateTime.UtcNow.Month, 1);
            var endOfMonth = startOfMonth.AddMonths(1);

            var bookings = await _bookingRepository.GetBookingsForArtistAsync(user.ArtistProfile.Id, null);
            return bookings.Count(b => b.BookingDate >= startOfMonth && b.BookingDate < endOfMonth && b.IsWalkIn);
        }

        public async Task<int> GetMonthlyEmailCountAsync(Guid userId)
        {
            // TODO: Implement email tracking when email service is added
            // For now, return 0 to allow emails
            return 0;
        }
    }
}
