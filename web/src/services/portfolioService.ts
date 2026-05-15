import { apiRequest } from './apiClient';

export interface PortfolioImage {
  id: string;
  url: string;
  isBannerImage: boolean;
  isProfilePicture: boolean;
  uploadedAt?: string;
  isUploading?: boolean;
}

export async function getPortfolioImages() {
  return apiRequest<{ images: PortfolioImage[] }>('/portfolio/artist');
}

export async function getSalonPortfolioImages(salonId: string) {
  return apiRequest<{ images: PortfolioImage[] }>(`/portfolio/salon/${salonId}`);
}

export async function uploadPortfolioImage(
  file: File,
  isBannerImage?: boolean,
  isProfilePicture?: boolean
) {
  const formData = new FormData();
  formData.append('image', file);
  if (isBannerImage !== undefined) {
    formData.append('isBannerImage', isBannerImage.toString());
  }
  if (isProfilePicture !== undefined) {
    formData.append('isProfilePicture', isProfilePicture.toString());
  }

  return apiRequest<PortfolioImage>('/portfolio/upload', {
    method: 'POST',
    body: formData,
  });
}

export async function uploadSalonPortfolioImage(salonId: string, file: File) {
  const formData = new FormData();
  formData.append('image', file);

  return apiRequest<PortfolioImage>(`/portfolio/salon/${salonId}/upload`, {
    method: 'POST',
    body: formData,
  });
}

export async function deletePortfolioImage(imageId: string) {
  return apiRequest(`/portfolio/${imageId}`, {
    method: 'DELETE',
  });
}

export async function setBannerImage(imageId: string) {
  return apiRequest<{ success: boolean; image: PortfolioImage }>(
    `/portfolio/${imageId}/set-banner`,
    {
      method: 'PUT',
    }
  );
}

export async function setProfilePicture(imageId: string) {
  return apiRequest<{ success: boolean; image: PortfolioImage }>(
    `/portfolio/${imageId}/set-profile-picture`,
    {
      method: 'PUT',
    }
  );
}
