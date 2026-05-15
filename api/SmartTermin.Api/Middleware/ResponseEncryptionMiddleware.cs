using System.Text;
using System.Text.Json;
using SmartTermin.Services;

namespace SmartTermin.Api.Middleware
{
    /// <summary>
    /// Middleware to encrypt API responses in production
    /// </summary>
    public class ResponseEncryptionMiddleware
    {
        private readonly RequestDelegate _next;
        private readonly IEncryptionService _encryptionService;
        private readonly ILogger<ResponseEncryptionMiddleware> _logger;

        public ResponseEncryptionMiddleware(
            RequestDelegate next,
            IEncryptionService encryptionService,
            ILogger<ResponseEncryptionMiddleware> logger)
        {
            _next = next;
            _encryptionService = encryptionService;
            _logger = logger;
        }

        public async Task InvokeAsync(HttpContext context)
        {
            // Only encrypt in production
            if (!_encryptionService.IsEncryptionEnabled())
            {
                await _next(context);
                return;
            }

            // Skip encryption for certain paths (Swagger, health checks, etc.)
            var path = context.Request.Path.Value?.ToLower() ?? "";
            if (path.StartsWith("/swagger") || 
                path.StartsWith("/health") ||
                path.StartsWith("/api/webhooks") || // Webhooks might need plain text
                path.Contains("favicon"))
            {
                await _next(context);
                return;
            }

            // Capture the original response stream
            var originalBodyStream = context.Response.Body;

            try
            {
                // Create a new memory stream for the response
                using var responseBody = new MemoryStream();
                context.Response.Body = responseBody;

                // Continue with the request pipeline
                await _next(context);

                // Check if response is JSON (encrypt both success and error responses)
                var contentType = context.Response.ContentType?.ToLower() ?? "";
                if (contentType.Contains("application/json"))
                {
                    // Read the response body
                    responseBody.Seek(0, SeekOrigin.Begin);
                    var responseBodyText = await new StreamReader(responseBody).ReadToEndAsync();

                    if (!string.IsNullOrWhiteSpace(responseBodyText))
                    {
                        try
                        {
                            // Try to parse as JSON to ensure it's valid
                            var jsonDoc = JsonDocument.Parse(responseBodyText);
                            
                            // Encrypt the JSON string
                            var encryptedData = _encryptionService.Encrypt(responseBodyText);

                            // Create encrypted response wrapper
                            var encryptedResponse = new
                            {
                                encrypted = true,
                                data = encryptedData
                            };

                            // Convert to JSON
                            var encryptedJson = JsonSerializer.Serialize(encryptedResponse);

                            // Write encrypted response
                            var encryptedBytes = Encoding.UTF8.GetBytes(encryptedJson);
                            context.Response.ContentLength = encryptedBytes.Length;
                            context.Response.Headers.Remove("Content-Length");
                            context.Response.ContentLength = encryptedBytes.Length;

                            // Reset the response body stream
                            responseBody.Seek(0, SeekOrigin.Begin);
                            responseBody.SetLength(0);

                            // Write encrypted data
                            await responseBody.WriteAsync(encryptedBytes, 0, encryptedBytes.Length);
                        }
                        catch (JsonException)
                        {
                            // If it's not valid JSON, don't encrypt (might be error response or other format)
                            _logger.LogWarning($"Response is not valid JSON, skipping encryption for path: {path}");
                        }
                        catch (Exception ex)
                        {
                            _logger.LogError(ex, $"Error encrypting response for path: {path}");
                            // On error, don't encrypt - return original response
                        }
                    }
                }

                // Copy the response body to the original stream
                responseBody.Seek(0, SeekOrigin.Begin);
                await responseBody.CopyToAsync(originalBodyStream);
            }
            finally
            {
                context.Response.Body = originalBodyStream;
            }
        }
    }
}
