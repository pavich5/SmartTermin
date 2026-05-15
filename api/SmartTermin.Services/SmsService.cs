using Twilio;
using Twilio.Rest.Api.V2010.Account;
using Twilio.Types;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace SmartTermin.Services
{
    public class SmsService : ISmsService
    {
        private readonly ILogger<SmsService> _logger;
        private readonly TwilioSettings _twilioSettings;

        public SmsService(
            ILogger<SmsService> logger,
            IOptions<TwilioSettings> twilioSettings)
        {
            _logger = logger;
            _twilioSettings = twilioSettings.Value;

            // Initialize Twilio with your Account SID and Auth Token
            if (!string.IsNullOrEmpty(_twilioSettings?.AccountSID) && 
                !string.IsNullOrEmpty(_twilioSettings?.AuthToken))
            {
                TwilioClient.Init(_twilioSettings.AccountSID, _twilioSettings.AuthToken);
                _logger.LogInformation("Twilio client initialized");
            }
            else
            {
                _logger.LogWarning("Twilio credentials not configured - client not initialized");
            }
        }

        public async Task<bool> SendVerificationCodeAsync(string phoneNumber, string verificationCode)
        {
            // Declare variables outside try block so they're accessible in catch
            string cleanPhoneNumber = string.Empty;
            string cleanTwilioPhone = string.Empty;
            
            try
            {
                // Check if Twilio is configured
                if (string.IsNullOrEmpty(_twilioSettings?.AccountSID) || 
                    string.IsNullOrEmpty(_twilioSettings?.AuthToken) ||
                    string.IsNullOrEmpty(_twilioSettings?.PhoneNumber))
                {
                    // Fallback: Log the code for development/testing
                    _logger.LogWarning($"SMS Verification Code for {phoneNumber}: {verificationCode} (Twilio not configured - logging only)");
                    _logger.LogWarning("Twilio credentials are missing. SMS will not be sent. Please configure Twilio settings in appsettings.json");
                    await Task.Delay(100); // Simulate async operation
                    return true;
                }

                // Validate phone number is not empty
                if (string.IsNullOrWhiteSpace(phoneNumber))
                {
                    _logger.LogError("Phone number is empty or null");
                    return false;
                }

                // Clean phone number to E.164 format for Twilio (must be + followed by digits only)
                // Remove all characters except digits and +
                cleanPhoneNumber = System.Text.RegularExpressions.Regex.Replace(phoneNumber, @"[^\d+]", "");
                // Ensure it starts with +
                if (!cleanPhoneNumber.StartsWith("+"))
                {
                    cleanPhoneNumber = "+" + cleanPhoneNumber;
                }
                // Remove any duplicate + signs
                cleanPhoneNumber = cleanPhoneNumber.Replace("+", "+").Replace("++", "+");
                
                // Clean Twilio phone number too
                cleanTwilioPhone = System.Text.RegularExpressions.Regex.Replace(_twilioSettings.PhoneNumber, @"[^\d+]", "");
                if (!cleanTwilioPhone.StartsWith("+"))
                {
                    cleanTwilioPhone = "+" + cleanTwilioPhone;
                }
                cleanTwilioPhone = cleanTwilioPhone.Replace("+", "+").Replace("++", "+");

                _logger.LogInformation($"Sending SMS to phone number: {cleanPhoneNumber} (original: {phoneNumber})");

                // Determine sender: Use alphanumeric sender ID for Macedonia if configured, otherwise use phone number
                bool useAlphanumericSender = !string.IsNullOrWhiteSpace(_twilioSettings.AlphanumericSenderId) && 
                                             cleanPhoneNumber.StartsWith("+389");
                
                string senderId;
                if (useAlphanumericSender)
                {
                    senderId = _twilioSettings.AlphanumericSenderId!;
                    _logger.LogInformation($"Using Alphanumeric Sender ID: {senderId} (recommended for Macedonia)");
                }
                else
                {
                    senderId = cleanTwilioPhone;
                    _logger.LogInformation($"Using Twilio phone number: {senderId}");
                }

                // Create SMS message
                var messageBody = $"Your SmartTermin verification code is: {verificationCode}. This code expires in 10 minutes. Never share this code with anyone.";

                // Send SMS via Twilio using CreateMessageOptions
                _logger.LogInformation($"Attempting to send SMS via Twilio to {cleanPhoneNumber}");
                
                var messageOptions = new CreateMessageOptions(new PhoneNumber(cleanPhoneNumber))
                {
                    From = useAlphanumericSender ? new PhoneNumber(senderId) : new PhoneNumber(senderId),
                    Body = messageBody
                };

                var messageResource = await MessageResource.CreateAsync(messageOptions);

                _logger.LogInformation($"Twilio Response - Status: {messageResource.Status}, SID: {messageResource.Sid}, ErrorCode: {messageResource.ErrorCode}, ErrorMessage: {messageResource.ErrorMessage}");
                _logger.LogInformation($"Message Details - Price: {messageResource.Price}, PriceUnit: {messageResource.PriceUnit}, NumSegments: {messageResource.NumSegments}");
                _logger.LogInformation($"View message details: https://console.twilio.com/us1/monitor/logs/sms/logs/{messageResource.Sid}");

                // Check for failed status
                if (messageResource.Status == MessageResource.StatusEnum.Failed || 
                    messageResource.Status == MessageResource.StatusEnum.Undelivered)
                {
                    _logger.LogError($"SMS FAILED to send to {phoneNumber}. Status: {messageResource.Status}, ErrorCode: {messageResource.ErrorCode}, ErrorMessage: {messageResource.ErrorMessage}");
                    _logger.LogError($"Check message logs: https://console.twilio.com/us1/monitor/logs/sms/logs/{messageResource.Sid}");
                    return false;
                }

                if (messageResource.Status == MessageResource.StatusEnum.Queued || 
                    messageResource.Status == MessageResource.StatusEnum.Sending ||
                    messageResource.Status == MessageResource.StatusEnum.Sent ||
                    messageResource.Status == MessageResource.StatusEnum.Delivered)
                {
                    _logger.LogInformation($"SMS sent successfully to {phoneNumber}. Message SID: {messageResource.Sid}, Status: {messageResource.Status}");
                    
                    // Important note about Macedonia and international long codes
                    if (cleanPhoneNumber.StartsWith("+389"))
                    {
                        _logger.LogWarning($"⚠️ IMPORTANT: Macedonia carriers do NOT support international long codes well.");
                        _logger.LogWarning($"Messages from US number {cleanTwilioPhone} may be blocked or filtered by Macedonian carriers.");
                        _logger.LogWarning($"Consider using a Macedonian phone number or alphanumeric sender ID. Check message status: https://console.twilio.com/us1/monitor/logs/sms/logs/{messageResource.Sid}");
                    }
                    
                    return true;
                }
                else
                {
                    _logger.LogWarning($"SMS send returned unexpected status: {messageResource.Status} for {phoneNumber}");
                    return false;
                }
            }
            catch (Twilio.Exceptions.ApiException twilioEx)
            {
                _logger.LogError(twilioEx, $"Twilio API error when sending verification code to {phoneNumber}. Code: {twilioEx.Code}, Message: {twilioEx.Message}, MoreInfo: {twilioEx.MoreInfo}");
                
                // Check if error is due to trial account restrictions
                if (twilioEx.Code == 21608 || twilioEx.Code == 21610 || 
                    twilioEx.Message?.Contains("trial", StringComparison.OrdinalIgnoreCase) == true ||
                    twilioEx.Message?.Contains("verified", StringComparison.OrdinalIgnoreCase) == true)
                {
                    _logger.LogError($"⚠️ TRIAL ACCOUNT RESTRICTION DETECTED! Error Code: {twilioEx.Code}");
                    _logger.LogError($"Trial accounts can only send SMS to verified phone numbers. Please verify {cleanPhoneNumber} in your Twilio Console: https://console.twilio.com/us1/develop/phone-numbers/manage/verified");
                }
                
                return false;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Failed to send verification code to {phoneNumber}. Error Type: {ex.GetType().Name}, Message: {ex.Message}");
                _logger.LogError($"Full exception details: {ex}");
                return false;
            }
        }

        public async Task<bool> SendMessageAsync(string phoneNumber, string message)
        {
            // Declare variables outside try block so they're accessible in catch
            string cleanPhoneNumber = string.Empty;
            string cleanTwilioPhone = string.Empty;
            
            try
            {
                // Check if Twilio is configured
                if (string.IsNullOrEmpty(_twilioSettings?.AccountSID) || 
                    string.IsNullOrEmpty(_twilioSettings?.AuthToken) ||
                    string.IsNullOrEmpty(_twilioSettings?.PhoneNumber))
                {
                    // Fallback: Log the message for development/testing
                    _logger.LogWarning($"SMS Message for {phoneNumber}: {message} (Twilio not configured - logging only)");
                    await Task.Delay(100); // Simulate async operation
                    return true;
                }

                // Validate phone number is not empty
                if (string.IsNullOrWhiteSpace(phoneNumber))
                {
                    _logger.LogError("Phone number is empty or null");
                    return false;
                }

                // Clean phone number to E.164 format for Twilio (must be + followed by digits only)
                // Remove all characters except digits and +
                cleanPhoneNumber = System.Text.RegularExpressions.Regex.Replace(phoneNumber, @"[^\d+]", "");
                // Ensure it starts with +
                if (!cleanPhoneNumber.StartsWith("+"))
                {
                    cleanPhoneNumber = "+" + cleanPhoneNumber;
                }
                // Remove any duplicate + signs
                cleanPhoneNumber = cleanPhoneNumber.Replace("+", "+").Replace("++", "+");
                
                // Clean Twilio phone number too
                cleanTwilioPhone = System.Text.RegularExpressions.Regex.Replace(_twilioSettings.PhoneNumber, @"[^\d+]", "");
                if (!cleanTwilioPhone.StartsWith("+"))
                {
                    cleanTwilioPhone = "+" + cleanTwilioPhone;
                }
                cleanTwilioPhone = cleanTwilioPhone.Replace("+", "+").Replace("++", "+");

                _logger.LogInformation($"Sending SMS to phone number: {cleanPhoneNumber} (original: {phoneNumber})");

                // Determine sender: Use alphanumeric sender ID for Macedonia if configured, otherwise use phone number
                bool useAlphanumericSender = !string.IsNullOrWhiteSpace(_twilioSettings.AlphanumericSenderId) && 
                                             cleanPhoneNumber.StartsWith("+389");
                
                string senderId;
                if (useAlphanumericSender)
                {
                    senderId = _twilioSettings.AlphanumericSenderId!;
                    _logger.LogInformation($"Using Alphanumeric Sender ID: {senderId} (recommended for Macedonia)");
                }
                else
                {
                    senderId = cleanTwilioPhone;
                    _logger.LogInformation($"Using Twilio phone number: {senderId}");
                }

                _logger.LogInformation($"SMS Request Details - Phone: {cleanPhoneNumber}, Message Length: {message.Length}");

                // Send SMS via Twilio using CreateMessageOptions
                var messageOptions = new CreateMessageOptions(new PhoneNumber(cleanPhoneNumber))
                {
                    From = useAlphanumericSender ? new PhoneNumber(senderId) : new PhoneNumber(senderId),
                    Body = message
                };

                var messageResource = await MessageResource.CreateAsync(messageOptions);

                _logger.LogInformation($"Twilio Response - Status: {messageResource.Status}, SID: {messageResource.Sid}, ErrorCode: {messageResource.ErrorCode}, ErrorMessage: {messageResource.ErrorMessage}");
                _logger.LogInformation($"Message Details - Price: {messageResource.Price}, PriceUnit: {messageResource.PriceUnit}, NumSegments: {messageResource.NumSegments}");
                _logger.LogInformation($"View message details: https://console.twilio.com/us1/monitor/logs/sms/logs/{messageResource.Sid}");

                // Check for failed status
                if (messageResource.Status == MessageResource.StatusEnum.Failed || 
                    messageResource.Status == MessageResource.StatusEnum.Undelivered)
                {
                    _logger.LogError($"SMS FAILED to send to {phoneNumber}. Status: {messageResource.Status}, ErrorCode: {messageResource.ErrorCode}, ErrorMessage: {messageResource.ErrorMessage}");
                    _logger.LogError($"Check message logs: https://console.twilio.com/us1/monitor/logs/sms/logs/{messageResource.Sid}");
                    return false;
                }

                if (messageResource.Status == MessageResource.StatusEnum.Queued || 
                    messageResource.Status == MessageResource.StatusEnum.Sending ||
                    messageResource.Status == MessageResource.StatusEnum.Sent ||
                    messageResource.Status == MessageResource.StatusEnum.Delivered)
                {
                    _logger.LogInformation($"SMS sent successfully to {phoneNumber}. Message SID: {messageResource.Sid}, Status: {messageResource.Status}");
                    
                    // Important note about Macedonia and international long codes
                    if (cleanPhoneNumber.StartsWith("+389"))
                    {
                        _logger.LogWarning($"⚠️ IMPORTANT: Macedonia carriers do NOT support international long codes well.");
                        _logger.LogWarning($"Messages from US number {cleanTwilioPhone} may be blocked or filtered by Macedonian carriers.");
                        _logger.LogWarning($"Consider using a Macedonian phone number or alphanumeric sender ID. Check message status: https://console.twilio.com/us1/monitor/logs/sms/logs/{messageResource.Sid}");
                    }
                    
                    return true;
                }
                else
                {
                    _logger.LogWarning($"SMS send returned unexpected status: {messageResource.Status} for {phoneNumber}");
                    return false;
                }
            }
            catch (Twilio.Exceptions.ApiException twilioEx)
            {
                _logger.LogError(twilioEx, $"Twilio API error when sending SMS to {phoneNumber}. Code: {twilioEx.Code}, Message: {twilioEx.Message}, MoreInfo: {twilioEx.MoreInfo}");
                
                // Check if error is due to trial account restrictions
                if (twilioEx.Code == 21608 || twilioEx.Code == 21610 || 
                    twilioEx.Message?.Contains("trial", StringComparison.OrdinalIgnoreCase) == true ||
                    twilioEx.Message?.Contains("verified", StringComparison.OrdinalIgnoreCase) == true)
                {
                    _logger.LogError($"⚠️ TRIAL ACCOUNT RESTRICTION DETECTED! Error Code: {twilioEx.Code}");
                    _logger.LogError($"Trial accounts can only send SMS to verified phone numbers. Please verify {cleanPhoneNumber} in your Twilio Console: https://console.twilio.com/us1/develop/phone-numbers/manage/verified");
                }
                
                return false;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Failed to send SMS to {phoneNumber}. Error: {ex.Message}");
                return false;
            }
        }
    }
}