using SmartTermin.DomainModels.Models;
using SmartTermin.DTOs;

namespace SmartTermin.Services
{
    public interface IAuthService
    {
        Task<LoginResponseDto?> LoginAsync(LoginRequestDto request, string? userAgent = null);
        Task<SignupResponseDto> SignupAsync(SignupRequestDto request);
        Task<VerifyPhoneResponseDto> VerifyPhoneAsync(VerifyPhoneRequestDto request);
        Task<UserDto?> GetCurrentUserAsync(Guid userId);
        Task<UserDto?> UpdateProfileAsync(Guid userId, UpdateProfileRequestDto request);
        Task<UpdateArtistProfileResponseDto?> UpdateArtistProfileAsync(Guid userId, UpdateArtistProfileRequestDto request);
        Task<LogoutResponseDto> LogoutAsync(Guid userId);
        Task<ForgotPasswordResponseDto> RequestPasswordResetAsync(ForgotPasswordRequestDto request);
        Task<VerifyResetCodeResponseDto> VerifyResetCodeAsync(VerifyResetCodeRequestDto request);
        Task<ResetPasswordResponseDto> ResetPasswordAsync(ResetPasswordRequestDto request);
        Task<ForgotPasswordResponseDto> RequestPhoneChangeAsync(Guid userId, RequestPhoneChangeRequestDto request);
        Task<UserDto> VerifyPhoneChangeAsync(Guid userId, VerifyPhoneChangeRequestDto request);
        Task<bool> DeactivateAccountAsync(Guid userId);
        Task<LoginResponseDto> ReactivateAccountAsync(string userId);
        Task<bool> DeleteAccountPermanentlyAsync(string userId);
        Task<User?> GetUserByEmailAsync(string email);
        Task<User?> GetUserByPhoneAsync(string phone);
    }
}

