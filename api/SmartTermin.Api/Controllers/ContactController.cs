using SmartTermin.DTOs;
using SmartTermin.Services;
using Microsoft.AspNetCore.Mvc;
using System.Net;

namespace SmartTermin.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ContactController : ControllerBase
    {
        private readonly IEmailService _emailService;
        private readonly ILogger<ContactController> _logger;

        public ContactController(IEmailService emailService, ILogger<ContactController> logger)
        {
            _emailService = emailService;
            _logger = logger;
        }

        [HttpPost]
        public async Task<IActionResult> SendContactMessage([FromBody] ContactRequestDto request)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            if (request == null)
            {
                return BadRequest(new { message = "Request body is required" });
            }

            try
            {
                // Validate required fields
                if (string.IsNullOrWhiteSpace(request.Name) ||
                    string.IsNullOrWhiteSpace(request.Email) ||
                    string.IsNullOrWhiteSpace(request.Subject) ||
                    string.IsNullOrWhiteSpace(request.Message))
                {
                    return BadRequest(new { message = "Name, Email, Subject, and Message are required fields" });
                }

                // Create HTML email body
                var emailBody = $@"
<!DOCTYPE html>
<html>
<head>
    <style>
        body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
        .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
        .header {{ background: linear-gradient(135deg, #ec4899 0%, #a855f7 100%); color: white; padding: 20px; border-radius: 8px 8px 0 0; }}
        .content {{ background: #f9fafb; padding: 20px; border-radius: 0 0 8px 8px; }}
        .field {{ margin-bottom: 15px; }}
        .label {{ font-weight: bold; color: #6b7280; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; }}
        .value {{ color: #111827; font-size: 14px; margin-top: 5px; }}
        .message-box {{ background: white; padding: 15px; border-left: 4px solid #ec4899; border-radius: 4px; margin-top: 10px; }}
    </style>
</head>
<body>
    <div class=""container"">
        <div class=""header"">
            <h2 style=""margin: 0;"">New Contact Form Submission</h2>
        </div>
        <div class=""content"">
            <div class=""field"">
                <div class=""label"">Name</div>
                <div class=""value"">{WebUtility.HtmlEncode(request.Name)}</div>
            </div>
            <div class=""field"">
                <div class=""label"">Email</div>
                <div class=""value"">{WebUtility.HtmlEncode(request.Email)}</div>
            </div>
            {(string.IsNullOrWhiteSpace(request.Phone) ? "" : $@"
            <div class=""field"">
                <div class=""label"">Phone</div>
                <div class=""value"">{WebUtility.HtmlEncode(request.Phone)}</div>
            </div>")}
            <div class=""field"">
                <div class=""label"">Subject</div>
                <div class=""value"">{WebUtility.HtmlEncode(request.Subject)}</div>
            </div>
            <div class=""field"">
                <div class=""label"">Message</div>
                <div class=""message-box"">
                    <div class=""value"">{WebUtility.HtmlEncode(request.Message).Replace("\n", "<br />")}</div>
                </div>
            </div>
        </div>
    </div>
</body>
</html>";

                // Send email to support@smartermin.com
                var subject = $"Contact Form: {request.Subject}";
                var success = await _emailService.SendEmailAsync(
                    "support@smartermin.com",
                    subject,
                    emailBody,
                    isHtml: true
                );

                if (!success)
                {
                    _logger.LogError("Failed to send contact email from {Email}", request.Email);
                    return StatusCode(500, new { message = "Failed to send email. Please try again later." });
                }

                _logger.LogInformation("Contact form submitted successfully from {Email}", request.Email);
                return Ok(new { message = "Your message has been sent successfully. We'll get back to you soon!" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error processing contact form submission from {Email}", request.Email);
                return StatusCode(500, new { message = "An error occurred while processing your request. Please try again later." });
            }
        }
    }
}

