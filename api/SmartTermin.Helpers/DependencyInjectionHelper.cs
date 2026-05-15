using SmartTermin.DataAccess.DataContext;
using SmartTermin.DataAccess.Repositories;
using SmartTermin.Services;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Caching.Memory;
using Pomelo.EntityFrameworkCore.MySql.Infrastructure;

namespace SmartTermin.Helpers
{
    public static class DependencyInjectionHelper
    {
        public static void InjectDbContext(this IServiceCollection services, string connectionString)
        {
            services.AddDbContext<SmartTerminDbContext>(options => 
            {
                options.UseMySql(connectionString, 
                    new MySqlServerVersion(new Version(8, 0, 21)),
                    mySqlOptions =>
                    {
                        // Configure retry logic for connection failures
                        mySqlOptions.EnableRetryOnFailure(
                            maxRetryCount: 3,
                            maxRetryDelay: TimeSpan.FromSeconds(30),
                            errorNumbersToAdd: null);
                    });
                // Enable connection resiliency and retry logic
                options.EnableSensitiveDataLogging(false);
                options.EnableServiceProviderCaching();
            });
        }

        public static void InjectRepositories(this IServiceCollection services)
        {
            services.AddScoped<IUserRepository, UserRepository>();
            services.AddScoped<IArtistRepository, ArtistRepository>();
            services.AddScoped<IBookingRepository, BookingRepository>();
            services.AddScoped<IServiceRepository, ServiceRepository>();
            services.AddScoped<IPortfolioRepository, PortfolioRepository>();
            services.AddScoped<IWorkingHoursRepository, WorkingHoursRepository>();
            services.AddScoped<IHolidayRepository, HolidayRepository>();
            services.AddScoped<ISalonHolidayRepository, SalonHolidayRepository>();
            services.AddScoped<IReviewRepository, ReviewRepository>();
            services.AddScoped<ISalonRepository, SalonRepository>();
            services.AddScoped<IBlockedClientRepository, BlockedClientRepository>();
            services.AddScoped<IWalkInClientRepository, WalkInClientRepository>();
        }

        public static void InjectServices(this IServiceCollection services, IConfiguration configuration)
        {
            // Add memory cache for temporary signup data
            services.AddMemoryCache();
            
            // Configure Twilio
            services.Configure<SmartTermin.Services.TwilioSettings>(configuration.GetSection("Twilio"));
            
            // Configure Firebase
            services.Configure<SmartTermin.Services.FirebaseSettings>(configuration.GetSection("FirebaseSettings"));
            
            // Configure Email Settings
            services.Configure<SmartTermin.Services.EmailSettings>(configuration.GetSection("EmailSettings"));

            services.AddScoped<IAuthService, AuthService>();
            services.AddScoped<IArtistService, ArtistService>();
            services.AddScoped<IBookingService, BookingService>();
            services.AddScoped<IServiceManagementService, ServiceManagementService>();
            services.AddScoped<IClientService, ClientService>();
            services.AddScoped<IPortfolioService, PortfolioService>();
            services.AddScoped<IAnalyticsService, AnalyticsService>();
            services.AddScoped<IWorkingHoursService, WorkingHoursService>();
            services.AddScoped<IHolidayService, HolidayService>();
            services.AddScoped<ISalonHolidayService, SalonHolidayService>();
            services.AddScoped<IPaddleWebhookService, PaddleWebhookService>();
            services.AddScoped<IImageStorageService, CloudinaryImageStorageService>();
            services.AddScoped<ISmsService, SmsService>();
            services.AddScoped<IEmailService, EmailService>();
            services.AddScoped<ISubscriptionService, SubscriptionService>();
            services.AddScoped<ISalonService, SalonService>();
            services.AddScoped<IBlockedClientService, BlockedClientService>();
            services.AddScoped<IWalkInClientService, WalkInClientService>();
            services.AddScoped<ReviewService>();
            services.AddScoped<IFirebaseNotificationService, FirebaseNotificationService>();
            services.AddSingleton<IEncryptionService, EncryptionService>();

            // Background jobs
            services.AddHostedService<TrialExpirationJob>();
            services.AddHostedService<BookingReminderJob>();
        }
    }
}
