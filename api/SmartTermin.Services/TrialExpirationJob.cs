using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace SmartTermin.Services
{
    public class TrialExpirationJob : BackgroundService
    {
        private readonly IServiceProvider _serviceProvider;
        private readonly ILogger<TrialExpirationJob> _logger;

        public TrialExpirationJob(IServiceProvider serviceProvider, ILogger<TrialExpirationJob> logger)
        {
            _serviceProvider = serviceProvider;
            _logger = logger;
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            while (!stoppingToken.IsCancellationRequested)
            {
                try
                {
                    using var scope = _serviceProvider.CreateScope();
                    var salonService = scope.ServiceProvider.GetRequiredService<ISalonService>();
                    await salonService.CheckAndExpireTrialsAsync();
                    _logger.LogInformation("Trial expiration check completed at {time}", DateTime.UtcNow);
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Error checking trial expirations");
                }

                await Task.Delay(TimeSpan.FromHours(24), stoppingToken);
            }
        }
    }
}
