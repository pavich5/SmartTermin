using System;
using System.Collections.Generic;
using System.Linq;
using SmartTermin.DataAccess.Repositories;
using SmartTermin.DTOs;

namespace SmartTermin.Services
{
    public class PortfolioService : IPortfolioService
    {
        private readonly IPortfolioRepository _portfolioRepository;
        private readonly IUserRepository _userRepository;
        private readonly ISalonRepository _salonRepository;

        public PortfolioService(IPortfolioRepository portfolioRepository, IUserRepository userRepository, ISalonRepository salonRepository)
        {
            _portfolioRepository = portfolioRepository;
            _userRepository = userRepository;
            _salonRepository = salonRepository;
        }

        public async Task<PortfolioImagesResponseDto> GetPortfolioImagesForArtistAsync(Guid artistUserId)
        {
            var artist = await _userRepository.GetArtistByUserIdAsync(artistUserId)
                ?? throw new InvalidOperationException("Artist profile not found");

            var portfolioImages = await _portfolioRepository.GetPortfolioImagesForArtistAsync(artist.Id);
            var response = new PortfolioImagesResponseDto();

            foreach (var image in portfolioImages)
            {
                response.Images.Add(new PortfolioImageDto
                {
                    Id = image.Id.ToString(),
                    Url = image.ImageUrl,
                    IsBannerImage = image.IsBannerImage,
                    IsProfilePicture = image.IsProfilePicture
                });
            }

            return response;
        }

        public async Task<UploadPortfolioImageResponseDto> UploadPortfolioImageAsync(Guid artistUserId, string imageUrl, bool isBannerImage = false, bool isProfilePicture = false)
        {
            var artist = await _userRepository.GetArtistByUserIdAsync(artistUserId)
                ?? throw new InvalidOperationException("Artist profile not found");

            var existingImages = await _portfolioRepository.GetPortfolioImagesForArtistAsync(artist.Id);
            var maxDisplayOrder = existingImages.Any() ? existingImages.Max(p => p.DisplayOrder) : -1;

            // If setting as banner image, unset any existing banner images
            if (isBannerImage)
            {
                var existingBannerImages = existingImages.Where(img => img.IsBannerImage).ToList();
                foreach (var img in existingBannerImages)
                {
                    img.IsBannerImage = false;
                }
                if (existingBannerImages.Any())
                {
                    await _portfolioRepository.UpdatePortfolioImagesAsync(existingBannerImages);
                }
            }

            // If setting as profile picture, unset any existing profile pictures and set display order to 0
            if (isProfilePicture)
            {
                var existingProfilePictures = existingImages.Where(img => img.IsProfilePicture).ToList();
                foreach (var img in existingProfilePictures)
                {
                    img.IsProfilePicture = false;
                    if (img.DisplayOrder == 0)
                    {
                        img.DisplayOrder = maxDisplayOrder + 1;
                    }
                }
                if (existingProfilePictures.Any())
                {
                    await _portfolioRepository.UpdatePortfolioImagesAsync(existingProfilePictures);
                }
                maxDisplayOrder = existingImages.Any() ? existingImages.Max(p => p.DisplayOrder) : -1;
            }

            var portfolioImage = new DomainModels.Models.PortfolioImage
            {
                ArtistId = artist.Id,
                ImageUrl = imageUrl,
                DisplayOrder = isProfilePicture ? 0 : maxDisplayOrder + 1,
                IsBannerImage = isBannerImage,
                IsProfilePicture = isProfilePicture
            };

            portfolioImage = await _portfolioRepository.CreatePortfolioImageAsync(portfolioImage);

            return new UploadPortfolioImageResponseDto
            {
                Id = portfolioImage.Id.ToString(),
                Url = portfolioImage.ImageUrl,
                UploadedAt = DateTime.UtcNow.ToString("yyyy-MM-ddTHH:mm:ssZ"),
                IsBannerImage = portfolioImage.IsBannerImage,
                IsProfilePicture = portfolioImage.IsProfilePicture
            };
        }

        public async Task<DeletePortfolioImageResponseDto> DeletePortfolioImageAsync(Guid artistUserId, Guid imageId)
        {
            var artist = await _userRepository.GetArtistByUserIdAsync(artistUserId)
                ?? throw new InvalidOperationException("Artist profile not found");

            var portfolioImage = await _portfolioRepository.GetPortfolioImageByIdAsync(imageId)
                ?? throw new KeyNotFoundException("Portfolio image not found");

            if (!portfolioImage.ArtistId.HasValue || portfolioImage.ArtistId.Value != artist.Id)
            {
                throw new UnauthorizedAccessException("Not authorized to delete this image");
            }

            var allImages = await _portfolioRepository.GetPortfolioImagesForArtistAsync(artist.Id);
            
            if (allImages.Count <= 2)
            {
                throw new InvalidOperationException("Cannot delete image. Portfolio must have at least 2 images (one banner and one profile picture).");
            }

            var bannerImages = allImages.Where(img => img.IsBannerImage).ToList();
            var profilePictures = allImages.Where(img => img.IsProfilePicture).ToList();

            if (portfolioImage.IsBannerImage && bannerImages.Count == 1)
            {
                throw new InvalidOperationException("Cannot delete the only banner image. Portfolio must have at least one banner image.");
            }

            if (portfolioImage.IsProfilePicture && profilePictures.Count == 1)
            {
                throw new InvalidOperationException("Cannot delete the only profile picture. Portfolio must have at least one profile picture.");
            }

            await _portfolioRepository.DeletePortfolioImageAsync(portfolioImage);

            return new DeletePortfolioImageResponseDto
            {
                Success = true
            };
        }

        public async Task<SetBannerImageResponseDto> SetBannerImageAsync(Guid artistUserId, Guid imageId)
        {
            var artist = await _userRepository.GetArtistByUserIdAsync(artistUserId)
                ?? throw new InvalidOperationException("Artist profile not found");

            var portfolioImage = await _portfolioRepository.GetPortfolioImageByIdAsync(imageId)
                ?? throw new KeyNotFoundException("Portfolio image not found");

            if (!portfolioImage.ArtistId.HasValue || portfolioImage.ArtistId.Value != artist.Id)
            {
                throw new UnauthorizedAccessException("Not authorized to modify this image");
            }

            // Get all existing images for this artist
            var existingImages = await _portfolioRepository.GetPortfolioImagesForArtistAsync(artist.Id);
            
            // Unset any existing banner images
            var existingBannerImages = existingImages.Where(img => img.IsBannerImage && img.Id != imageId).ToList();
            foreach (var img in existingBannerImages)
            {
                img.IsBannerImage = false;
            }
            if (existingBannerImages.Any())
            {
                await _portfolioRepository.UpdatePortfolioImagesAsync(existingBannerImages);
            }

            // Set this image as banner (toggle if already set)
            var isCurrentlyBanner = portfolioImage.IsBannerImage;
            portfolioImage.IsBannerImage = !isCurrentlyBanner;
            await _portfolioRepository.UpdatePortfolioImageAsync(portfolioImage);

            // Update Artist table with banner image URL (only if setting as banner, not removing)
            if (portfolioImage.IsBannerImage)
            {
                artist.BannerImageUrl = portfolioImage.ImageUrl;
            }
            else
            {
                // If removing banner, clear the artist's banner URL
                artist.BannerImageUrl = null;
            }
            await _portfolioRepository.UpdateArtistAsync(artist);

            return new SetBannerImageResponseDto
            {
                Success = true,
                Image = new PortfolioImageDto
                {
                    Id = portfolioImage.Id.ToString(),
                    Url = portfolioImage.ImageUrl,
                    IsBannerImage = portfolioImage.IsBannerImage,
                    IsProfilePicture = portfolioImage.IsProfilePicture
                }
            };
        }

        public async Task<SetProfilePictureResponseDto> SetProfilePictureAsync(Guid artistUserId, Guid imageId)
        {
            var artist = await _userRepository.GetArtistByUserIdAsync(artistUserId)
                ?? throw new InvalidOperationException("Artist profile not found");

            var portfolioImage = await _portfolioRepository.GetPortfolioImageByIdAsync(imageId)
                ?? throw new KeyNotFoundException("Portfolio image not found");

            if (!portfolioImage.ArtistId.HasValue || portfolioImage.ArtistId.Value != artist.Id)
            {
                throw new UnauthorizedAccessException("Not authorized to modify this image");
            }

            // Get all existing images for this artist
            var existingImages = await _portfolioRepository.GetPortfolioImagesForArtistAsync(artist.Id);
            var maxDisplayOrder = existingImages.Any() ? existingImages.Max(p => p.DisplayOrder) : -1;
            
            // Unset any existing profile pictures
            var existingProfilePictures = existingImages.Where(img => img.IsProfilePicture && img.Id != imageId).ToList();
            foreach (var img in existingProfilePictures)
            {
                img.IsProfilePicture = false;
                if (img.DisplayOrder == 0)
                {
                    img.DisplayOrder = maxDisplayOrder + 1;
                }
            }
            if (existingProfilePictures.Any())
            {
                await _portfolioRepository.UpdatePortfolioImagesAsync(existingProfilePictures);
            }

            // Set this image as profile picture (toggle if already set)
            var isCurrentlyProfile = portfolioImage.IsProfilePicture;
            portfolioImage.IsProfilePicture = !isCurrentlyProfile;
            
            // Set display order to 0 if setting as profile, otherwise restore it
            if (portfolioImage.IsProfilePicture)
            {
                portfolioImage.DisplayOrder = 0;
            }
            else if (portfolioImage.DisplayOrder == 0)
            {
                portfolioImage.DisplayOrder = maxDisplayOrder + 1;
            }
            
            await _portfolioRepository.UpdatePortfolioImageAsync(portfolioImage);

            // Update Artist table with profile image URL (only if setting as profile, not removing)
            if (portfolioImage.IsProfilePicture)
            {
                artist.ProfileImageUrl = portfolioImage.ImageUrl;
            }
            else
            {
                // If removing profile picture, clear the artist's profile URL
                artist.ProfileImageUrl = null;
            }
            await _portfolioRepository.UpdateArtistAsync(artist);

            return new SetProfilePictureResponseDto
            {
                Success = true,
                Image = new PortfolioImageDto
                {
                    Id = portfolioImage.Id.ToString(),
                    Url = portfolioImage.ImageUrl,
                    IsBannerImage = portfolioImage.IsBannerImage,
                    IsProfilePicture = portfolioImage.IsProfilePicture
                }
            };
        }

        // Salon portfolio methods
        public async Task<PortfolioImagesResponseDto> GetPortfolioImagesForSalonAsync(Guid salonId, Guid ownerUserId)
        {
            var salon = await _salonRepository.GetSalonByIdAsync(salonId);
            if (salon == null)
                throw new InvalidOperationException("Salon not found");

            if (salon.OwnerUserId != ownerUserId)
                throw new UnauthorizedAccessException("Only salon owner can access salon portfolio");

            var portfolioImages = await _portfolioRepository.GetPortfolioImagesForSalonAsync(salonId);
            var response = new PortfolioImagesResponseDto();

            foreach (var image in portfolioImages)
            {
                response.Images.Add(new PortfolioImageDto
                {
                    Id = image.Id.ToString(),
                    Url = image.ImageUrl,
                    IsBannerImage = image.IsBannerImage,
                    IsProfilePicture = image.IsProfilePicture
                });
            }

            return response;
        }

        public async Task<UploadPortfolioImageResponseDto> UploadPortfolioImageForSalonAsync(Guid salonId, Guid ownerUserId, string imageUrl)
        {
            var salon = await _salonRepository.GetSalonByIdAsync(salonId);
            if (salon == null)
                throw new InvalidOperationException("Salon not found");

            if (salon.OwnerUserId != ownerUserId)
                throw new UnauthorizedAccessException("Only salon owner can upload salon portfolio images");

            var existingImages = await _portfolioRepository.GetPortfolioImagesForSalonAsync(salonId);
            var maxDisplayOrder = existingImages.Any() ? existingImages.Max(p => p.DisplayOrder) : -1;

            var portfolioImage = new DomainModels.Models.PortfolioImage
            {
                SalonId = salonId,
                ImageUrl = imageUrl,
                DisplayOrder = maxDisplayOrder + 1,
                IsBannerImage = false,
                IsProfilePicture = false
            };

            portfolioImage = await _portfolioRepository.CreatePortfolioImageAsync(portfolioImage);

            return new UploadPortfolioImageResponseDto
            {
                Id = portfolioImage.Id.ToString(),
                Url = portfolioImage.ImageUrl,
                UploadedAt = DateTime.UtcNow.ToString("yyyy-MM-ddTHH:mm:ssZ"),
                IsBannerImage = false,
                IsProfilePicture = false
            };
        }

        public async Task<DeletePortfolioImageResponseDto> DeletePortfolioImageForSalonAsync(Guid salonId, Guid ownerUserId, Guid imageId)
        {
            var salon = await _salonRepository.GetSalonByIdAsync(salonId);
            if (salon == null)
                throw new InvalidOperationException("Salon not found");

            if (salon.OwnerUserId != ownerUserId)
                throw new UnauthorizedAccessException("Only salon owner can delete salon portfolio images");

            var portfolioImage = await _portfolioRepository.GetPortfolioImageByIdAsync(imageId)
                ?? throw new KeyNotFoundException("Portfolio image not found");

            if (portfolioImage.SalonId != salonId)
            {
                throw new UnauthorizedAccessException("Not authorized to delete this image");
            }

            await _portfolioRepository.DeletePortfolioImageAsync(portfolioImage);

            return new DeletePortfolioImageResponseDto
            {
                Success = true
            };
        }

        public async Task<SetBannerImageResponseDto> SetBannerImageForSalonAsync(Guid salonId, Guid ownerUserId, Guid imageId)
        {
            var portfolioImage = await _portfolioRepository.GetPortfolioImageByIdAsync(imageId)
                ?? throw new KeyNotFoundException("Portfolio image not found");

            if (portfolioImage.SalonId != salonId)
            {
                throw new UnauthorizedAccessException("Not authorized to modify this image");
            }

            // Use the salon from the portfolio image if already loaded, otherwise get it
            var salon = portfolioImage.Salon;
            if (salon == null)
            {
                salon = await _salonRepository.GetSalonByIdAsync(salonId);
                if (salon == null)
                    throw new InvalidOperationException("Salon not found");
            }

            // Load user and verify they are either the salon owner or an active salon member
            var user = await _userRepository.GetUserByIdWithArtistProfileAsync(ownerUserId);
            if (user == null)
                throw new UnauthorizedAccessException("User not found");

            var isOwner = salon.OwnerUserId == ownerUserId;
            var isMember = user.ArtistProfile?.SalonMemberships != null &&
                           user.ArtistProfile.SalonMemberships.Any(m => m.SalonId == salonId && m.Status == "active");

            if (!isOwner && !isMember)
                throw new UnauthorizedAccessException("Only salon owner or members can set salon banner image");

            // Get all existing images for this salon
            var existingImages = await _portfolioRepository.GetPortfolioImagesForSalonAsync(salonId);
            
            // Unset any existing banner images
            var existingBannerImages = existingImages.Where(img => img.IsBannerImage && img.Id != imageId).ToList();
            foreach (var img in existingBannerImages)
            {
                img.IsBannerImage = false;
            }
            if (existingBannerImages.Any())
            {
                await _portfolioRepository.UpdatePortfolioImagesAsync(existingBannerImages);
            }

            // Set this image as banner (toggle if already set)
            var isCurrentlyBanner = portfolioImage.IsBannerImage;
            portfolioImage.IsBannerImage = !isCurrentlyBanner;
            await _portfolioRepository.UpdatePortfolioImageAsync(portfolioImage);

            // Update Salon table with banner image URL (only if setting as banner, not removing)
            if (portfolioImage.IsBannerImage)
            {
                salon.BannerImageUrl = portfolioImage.ImageUrl;
            }
            else
            {
                // If removing banner, clear the salon's banner URL
                salon.BannerImageUrl = null;
            }
            await _salonRepository.UpdateSalonAsync(salon);

            return new SetBannerImageResponseDto
            {
                Success = true,
                Image = new PortfolioImageDto
                {
                    Id = portfolioImage.Id.ToString(),
                    Url = portfolioImage.ImageUrl,
                    IsBannerImage = portfolioImage.IsBannerImage,
                    IsProfilePicture = portfolioImage.IsProfilePicture
                }
            };
        }

        public async Task<SetProfilePictureResponseDto> SetProfilePictureForSalonAsync(Guid salonId, Guid ownerUserId, Guid imageId)
        {
            var portfolioImage = await _portfolioRepository.GetPortfolioImageByIdAsync(imageId)
                ?? throw new KeyNotFoundException("Portfolio image not found");

            if (portfolioImage.SalonId != salonId)
            {
                throw new UnauthorizedAccessException("Not authorized to modify this image");
            }

            // Use the salon from the portfolio image if already loaded, otherwise get it
            var salon = portfolioImage.Salon;
            if (salon == null)
            {
                salon = await _salonRepository.GetSalonByIdAsync(salonId);
                if (salon == null)
                    throw new InvalidOperationException("Salon not found");
            }

            // Load user and verify they are either the salon owner or an active salon member
            var user = await _userRepository.GetUserByIdWithArtistProfileAsync(ownerUserId);
            if (user == null)
                throw new UnauthorizedAccessException("User not found");

            var isOwner = salon.OwnerUserId == ownerUserId;
            var isMember = user.ArtistProfile?.SalonMemberships != null &&
                           user.ArtistProfile.SalonMemberships.Any(m => m.SalonId == salonId && m.Status == "active");

            if (!isOwner && !isMember)
                throw new UnauthorizedAccessException("Only salon owner or members can set salon profile picture");

            // Get all existing images for this salon
            var existingImages = await _portfolioRepository.GetPortfolioImagesForSalonAsync(salonId);
            var maxDisplayOrder = existingImages.Any() ? existingImages.Max(p => p.DisplayOrder) : -1;
            
            // Unset any existing profile pictures
            var existingProfilePictures = existingImages.Where(img => img.IsProfilePicture && img.Id != imageId).ToList();
            foreach (var img in existingProfilePictures)
            {
                img.IsProfilePicture = false;
                if (img.DisplayOrder == 0)
                {
                    img.DisplayOrder = maxDisplayOrder + 1;
                }
            }
            if (existingProfilePictures.Any())
            {
                await _portfolioRepository.UpdatePortfolioImagesAsync(existingProfilePictures);
            }

            // Set this image as profile picture (toggle if already set)
            var isCurrentlyProfile = portfolioImage.IsProfilePicture;
            portfolioImage.IsProfilePicture = !isCurrentlyProfile;
            
            // Set display order to 0 if setting as profile, otherwise restore it
            if (portfolioImage.IsProfilePicture)
            {
                portfolioImage.DisplayOrder = 0;
            }
            else if (portfolioImage.DisplayOrder == 0)
            {
                portfolioImage.DisplayOrder = maxDisplayOrder + 1;
            }
            
            await _portfolioRepository.UpdatePortfolioImageAsync(portfolioImage);

            // Update Salon table with profile image URL (only if setting as profile, not removing)
            if (portfolioImage.IsProfilePicture)
            {
                salon.ProfileImageUrl = portfolioImage.ImageUrl;
            }
            else
            {
                // If removing profile picture, clear the salon's profile URL
                salon.ProfileImageUrl = null;
            }
            await _salonRepository.UpdateSalonAsync(salon);

            return new SetProfilePictureResponseDto
            {
                Success = true,
                Image = new PortfolioImageDto
                {
                    Id = portfolioImage.Id.ToString(),
                    Url = portfolioImage.ImageUrl,
                    IsBannerImage = portfolioImage.IsBannerImage,
                    IsProfilePicture = portfolioImage.IsProfilePicture
                }
            };
        }

        public async Task<DomainModels.Models.PortfolioImage?> GetPortfolioImageByIdAsync(Guid imageId)
        {
            return await _portfolioRepository.GetPortfolioImageByIdAsync(imageId);
        }
    }
}

