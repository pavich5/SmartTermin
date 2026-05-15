using SmartTermin.DTOs;
using SmartTermin.Services;
using Microsoft.AspNetCore.Mvc;
using System.Text;
using System.Text.Json;

namespace SmartTermin.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class WebhooksController : ControllerBase
    {
        private readonly IPaddleWebhookService _paddleWebhookService;
        private readonly ILogger<WebhooksController> _logger;

        public WebhooksController(IPaddleWebhookService paddleWebhookService, ILogger<WebhooksController> logger)
        {
            _paddleWebhookService = paddleWebhookService;
            _logger = logger;
        }

        [HttpPost("paddle")]
        public async Task<ActionResult<PaddleWebhookResponseDto>> HandlePaddleWebhook()
        {
            try
            {
                // Read raw request body
                using var reader = new StreamReader(Request.Body, Encoding.UTF8);
                var requestBody = await reader.ReadToEndAsync();

                if (string.IsNullOrEmpty(requestBody))
                {
                    _logger.LogWarning("Received empty Paddle webhook request");
                    return BadRequest(new { message = "Empty request body" });
                }

                // Parse JSON payload
                Dictionary<string, object>? webhookData;
                try
                {
                    webhookData = JsonSerializer.Deserialize<Dictionary<string, object>>(requestBody, new JsonSerializerOptions
                    {
                        PropertyNameCaseInsensitive = true
                    });
                }
                catch (JsonException ex)
                {
                    _logger.LogError(ex, "Failed to parse Paddle webhook JSON");
                    return BadRequest(new { message = "Invalid JSON payload" });
                }

                if (webhookData == null)
                {
                    return BadRequest(new { message = "Invalid webhook data" });
                }

                // Extract event type
                var eventType = webhookData.TryGetValue("event_type", out var eventTypeValue)
                    ? eventTypeValue?.ToString()
                    : webhookData.TryGetValue("alert_name", out var alertNameValue)
                        ? alertNameValue?.ToString()
                        : null;

                if (string.IsNullOrEmpty(eventType))
                {
                    _logger.LogWarning("Paddle webhook missing event_type or alert_name");
                    return BadRequest(new { message = "Missing event type" });
                }

                // Extract data payload (Paddle webhooks may have data nested in a "data" field)
                Dictionary<string, object>? eventData = webhookData;
                if (webhookData.TryGetValue("data", out var dataValue) && dataValue is JsonElement jsonElement)
                {
                    eventData = JsonSerializer.Deserialize<Dictionary<string, object>>(jsonElement.GetRawText());
                }

                if (eventData == null)
                {
                    eventData = webhookData;
                }

                _logger.LogInformation("Processing Paddle webhook event: {EventType}", eventType);

                var response = await _paddleWebhookService.ProcessWebhookAsync(eventType, eventData);

                return Ok(response);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error processing Paddle webhook");
                return StatusCode(500, new { message = "An error occurred while processing the webhook" });
            }
        }
    }
}

