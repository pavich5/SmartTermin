using System;
using SmartTermin.DTOs;

namespace SmartTermin.Services
{
    public interface IArtistService
    {
        Task<GetArtistsResponseDto> GetArtistsAsync(string? search, string? service, int page, int limit);
        Task<ArtistDetailDto?> GetArtistByIdAsync(Guid artistId);
        Task<ArtistDetailDto?> GetArtistByCustomBookingLinkAsync(string customBookingLink);
        Task<ArtistSubscriptionDto?> GetArtistSubscriptionAsync(Guid artistId);
        Task<bool> CancelArtistSubscriptionAsync(Guid artistId);
        Task<string?> GetCancelSubscriptionLinkAsync(Guid artistId);
        Task<List<PaymentTransactionDto>> GetPaymentTransactionsAsync(Guid artistId);
        Task<string?> ReactivateArtistSubscriptionAsync(Guid artistId);
        Task<bool> DeleteAccountPermanentlyAsync(Guid artistId);
    }
}

