namespace SmartTermin.Services
{
    public interface ISmsService
    {
        Task<bool> SendVerificationCodeAsync(string phoneNumber, string verificationCode);
        Task<bool> SendMessageAsync(string phoneNumber, string message);
    }
}



