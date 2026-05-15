using SmartTermin.DTOs;

namespace SmartTermin.Services
{
    public interface IPaddleWebhookService
    {
        Task<PaddleWebhookResponseDto> ProcessWebhookAsync(string eventType, Dictionary<string, object> webhookData);
    }
}

