using SmartTermin.DTOs;

namespace SmartTermin.Services
{
    public interface IPortfolioService
    {
        Task<PortfolioImagesResponseDto> GetPortfolioImagesForArtistAsync(Guid artistUserId);
        Task<PortfolioImagesResponseDto> GetPortfolioImagesForSalonAsync(Guid salonId, Guid ownerUserId);
        Task<UploadPortfolioImageResponseDto> UploadPortfolioImageAsync(Guid artistUserId, string imageUrl, bool isBannerImage = false, bool isProfilePicture = false);
        Task<UploadPortfolioImageResponseDto> UploadPortfolioImageForSalonAsync(Guid salonId, Guid ownerUserId, string imageUrl);
        Task<DeletePortfolioImageResponseDto> DeletePortfolioImageAsync(Guid artistUserId, Guid imageId);
        Task<DeletePortfolioImageResponseDto> DeletePortfolioImageForSalonAsync(Guid salonId, Guid ownerUserId, Guid imageId);
        Task<SetBannerImageResponseDto> SetBannerImageAsync(Guid artistUserId, Guid imageId);
        Task<SetBannerImageResponseDto> SetBannerImageForSalonAsync(Guid salonId, Guid ownerUserId, Guid imageId);
        Task<SetProfilePictureResponseDto> SetProfilePictureAsync(Guid artistUserId, Guid imageId);
        Task<SetProfilePictureResponseDto> SetProfilePictureForSalonAsync(Guid salonId, Guid ownerUserId, Guid imageId);
        Task<DomainModels.Models.PortfolioImage?> GetPortfolioImageByIdAsync(Guid imageId);
    }
}

