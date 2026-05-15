import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Plus,
  Image,
  ImageIcon,
  User,
  ChevronDown,
  ChevronUp,
  Trash2,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { useTranslation } from '../../hooks/useTranslation';
import { useSubscriptionLimits } from '../../hooks/useSubscriptionLimits';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Button } from '../ui/button';
import { Modal } from './modals/Modal';

interface PortfolioImage {
  id: string;
  url: string;
  isBannerImage: boolean;
  isProfilePicture: boolean;
  isUploading?: boolean;
}

interface PortfolioGridProps {
  images: PortfolioImage[];
  selectedImageForAction: string | null;
  onAddImage: () => void;
  onImageClick: (imageId: string) => void;
  onCloseImageOptions: () => void;
  onSetBanner: (imageId: string) => void;
  onSetProfilePicture: (imageId: string) => void;
  onDeleteImage: (imageId: string) => void;
  settingBannerId?: string | null;
  settingProfileId?: string | null;
  deletingImageId?: string | null;
}

export function PortfolioGrid({
  images,
  selectedImageForAction,
  onAddImage,
  onImageClick,
  onCloseImageOptions,
  onSetBanner,
  onSetProfilePicture,
  onDeleteImage,
  settingBannerId = null,
  settingProfileId = null,
  deletingImageId = null,
}: PortfolioGridProps) {
  const { t } = useTranslation();
  const { limits, canUploadPortfolio, isPro } = useSubscriptionLimits();
  const navigate = useNavigate();
  const [showAll, setShowAll] = useState(false);
  const selectedImg = images.find((img) => img.id === selectedImageForAction);
  const displayCount = 6;
  
  // Sort images: profile picture first, banner second, then others
  const sortedImages = [...images].sort((a, b) => {
    // Profile picture always first
    if (a.isProfilePicture && !b.isProfilePicture) return -1;
    if (!a.isProfilePicture && b.isProfilePicture) return 1;
    
    // Banner second (only if not profile picture)
    if (a.isBannerImage && !b.isBannerImage && !a.isProfilePicture) return -1;
    if (!a.isBannerImage && b.isBannerImage && !b.isProfilePicture) return 1;
    
    // Keep original order for others
    return 0;
  });
  
  const hasMore = sortedImages.length > displayCount;
  const imagesToShow = showAll ? sortedImages : sortedImages.slice(0, displayCount);

  const handleAddImage = () => {
    if (!canUploadPortfolio && !isPro && limits) {
      toast.error(t('toast.portfolioLimitReached'), {
        description: t('toast.portfolioLimitReachedDesc', { max: limits.maxPortfolioImages, current: limits.currentPortfolioImages }),
        action: {
          label: t('toast.upgrade'),
          onClick: () => navigate('/pricing'),
        },
      });
      return;
    }
    onAddImage();
  };

  const portfolioUsage = limits
    ? `${limits.currentPortfolioImages}/${limits.maxPortfolioImages === Number.MAX_SAFE_INTEGER ? '∞' : limits.maxPortfolioImages} images`
    : '';

  const canDeleteImage = (
    image: PortfolioImage | undefined
  ): { allowed: boolean; reason?: string } => {
    if (!image) return { allowed: false, reason: 'No image selected' };
    const totalImages = images.length;
    const bannerImages = images.filter((img) => img.isBannerImage);
    const profilePictures = images.filter((img) => img.isProfilePicture);

    if (totalImages <= 2) {
      return {
        allowed: false,
        reason: 'Portfolio must have at least 2 images (one banner and one profile picture)',
      };
    }
    if (image.isBannerImage && bannerImages.length === 1) {
      return { allowed: false, reason: 'Cannot delete the only banner image' };
    }
    if (image.isProfilePicture && profilePictures.length === 1) {
      return { allowed: false, reason: 'Cannot delete the only profile picture' };
    }

    return { allowed: true };
  };

  return (
    <>
      <div className="bg-white rounded-2xl shadow-lg p-6 w-full overflow-hidden">
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <div className="flex-1">
            <h2 className="text-xl sm:text-2xl mb-1">{t('dashboard.portfolio.title')}</h2>
            {!isPro && limits && (
              <span className="text-xs px-2 py-1 bg-orange-100 text-orange-700 rounded-full">
                {portfolioUsage}
              </span>
            )}
          </div>
          <Button
            onClick={handleAddImage}
            disabled={!canUploadPortfolio && !isPro}
            className="bg-sky-500 hover:bg-sky-600 text-white rounded-full flex-shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Plus size={20} className="mr-2" />
            <span className="hidden sm:inline">{t('dashboard.portfolio.addImage')}</span>
            <span className="sm:hidden">{t('dashboard.portfolio.add')}</span>
          </Button>
        </div>
        {!canUploadPortfolio && !isPro && limits && (
          <div className="mb-4">
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 flex items-start gap-3">
              <AlertCircle className="text-orange-600 flex-shrink-0 mt-0.5" size={20} />
              <div className="flex-1">
                <p className="text-sm font-medium text-orange-900">
                  {t('common.portfolioLimitReached', { current: limits.currentPortfolioImages, max: limits.maxPortfolioImages })}
                </p>
                <p className="text-xs text-orange-700 mt-1">
                  {t('common.upgradeToProForUnlimitedPortfolio')}
                </p>
              </div>
              <Button
                onClick={() => navigate('/pricing')}
                size="sm"
                className="bg-orange-600 hover:bg-orange-700 text-white text-xs"
              >
                {t('toast.upgrade')}
              </Button>
            </div>
          </div>
        )}
        <div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 w-full">
            {imagesToShow.map((img) => (
              <div
                key={img.id}
                className={`aspect-square bg-blue-100 rounded-xl relative group w-full transition-shadow hover:shadow-lg ${
                  img.isUploading ? 'cursor-wait' : 'cursor-pointer'
                }`}
                onClick={() => !img.isUploading && onImageClick(img.id)}
              >
                <div className="w-full h-full overflow-hidden rounded-xl absolute inset-0">
                  {img.isUploading ? (
                    <div className="w-full h-full flex items-center justify-center bg-gray-100">
                      <div className="flex flex-col items-center gap-3">
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{
                            duration: 1,
                            repeat: Infinity,
                            ease: 'linear',
                          }}
                        >
                          <Loader2 className="text-blue-500 w-8 h-8" />
                        </motion.div>
                        <span className="text-sm text-gray-600">{t('dashboard.portfolio.uploading')}</span>
                      </div>
                    </div>
                  ) : img.url ? (
                    <img
                      src={img.url}
                      alt={t('portfolio.imageAlt')}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Image size={48} className="text-blue-300" />
                    </div>
                  )}
                </div>

                {img.isBannerImage && (
                  <div className="absolute top-1 left-1 z-[100] pointer-events-none">
                    <span
                      className="inline-flex items-center px-2 py-1 rounded-full shadow-lg text-white font-medium"
                      style={{ fontSize: '9px', backgroundColor: '#9333ea' }}
                    >
                      <span className="whitespace-nowrap">{t('dashboard.portfolio.banner')}</span>
                    </span>
                  </div>
                )}
                {img.isProfilePicture && (
                  <div className="absolute top-1 left-1 z-[100] pointer-events-none">
                    <span
                      className="inline-flex items-center px-2 py-1 rounded-full shadow-lg text-white font-medium"
                      style={{ fontSize: '9px', backgroundColor: '#db2777' }}
                    >
                      <span className="whitespace-nowrap">{t('dashboard.portfolio.profile')}</span>
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
        {hasMore && (
          <div className="mt-6 flex justify-center">
            <Button
              onClick={() => setShowAll(!showAll)}
              variant="outline"
              className="border-blue-500 text-blue-600 hover:bg-blue-50"
            >
              {showAll ? (
                <>
                  <ChevronUp size={18} className="mr-2" />
                  {t('dashboard.portfolio.showLess')}
                </>
              ) : (
                <>
                  <ChevronDown size={18} className="mr-2" />
                  {t('dashboard.portfolio.showMore', { count: images.length - displayCount })}
                </>
              )}
            </Button>
          </div>
        )}
      </div>

      <Modal
        children={undefined}
        show={!!selectedImageForAction && !!selectedImg}
        onClose={onCloseImageOptions}
        title={t('dashboard.portfolio.imageOptions')}
      >
        <div className="space-y-4">
          {selectedImg?.url && (
            <div className="rounded-xl overflow-hidden bg-gray-100 relative mx-auto">
              <img
                src={selectedImg.url}
                alt={t('portfolio.selectedAlt')}
                className="block mx-auto"
                style={{ maxWidth: '480px', maxHeight: '200px', width: '100%', height: 'auto', objectFit: 'contain' }}
              />
              <div className="absolute top-1 left-1 flex flex-col gap-1.5 z-10">
                {selectedImg.isBannerImage && (
                  <span
                    className="inline-flex items-center px-2 py-1 rounded-full shadow-lg text-white font-medium"
                    style={{ fontSize: '9px', backgroundColor: '#9333ea' }}
                  >
                    <span className="whitespace-nowrap">{t('dashboard.portfolio.banner')}</span>
                  </span>
                )}
                {selectedImg.isProfilePicture && (
                  <span
                    className="inline-flex items-center px-1.5 py-0.5 rounded-full shadow-lg text-white font-medium"
                    style={{ fontSize: '9px', backgroundColor: '#db2777' }}
                  >
                    <span className="whitespace-nowrap">{t('dashboard.portfolio.profile')}</span>
                  </span>
                )}
              </div>
            </div>
          )}
          <div className="space-y-3">
            {!selectedImg?.isBannerImage && (
              <Button
                onClick={() => {
                  if (selectedImg) {
                    onSetBanner(selectedImg.id);
                    onCloseImageOptions();
                  }
                }}
                disabled={settingBannerId === selectedImg?.id || settingProfileId === selectedImg?.id || deletingImageId === selectedImg?.id}
                variant="default"
                className="w-full bg-sky-500 hover:bg-sky-600 text-white disabled:opacity-50"
              >
                <ImageIcon size={18} className="mr-2" />
                {settingBannerId === selectedImg?.id ? t('modals.common.processing') || 'Processing...' : t('dashboard.portfolio.setBanner')}
              </Button>
            )}
            {!selectedImg?.isProfilePicture && (
              <Button
                onClick={() => {
                  if (selectedImg) {
                    onSetProfilePicture(selectedImg.id);
                    onCloseImageOptions();
                  }
                }}
                disabled={settingBannerId === selectedImg?.id || settingProfileId === selectedImg?.id || deletingImageId === selectedImg?.id}
                variant="default"
                className="w-full bg-sky-500 hover:bg-sky-600 text-white disabled:opacity-50"
              >
                <User size={18} className="mr-2" />
                {settingProfileId === selectedImg?.id ? t('modals.common.processing') || 'Processing...' : t('dashboard.portfolio.setProfile')}
              </Button>
            )}
            <Button
              onClick={() => {
                if (selectedImg) {
                  const deleteCheck = canDeleteImage(selectedImg);
                  if (deleteCheck.allowed) {
                    onDeleteImage(selectedImg.id);
                  }
                }
              }}
              variant="destructive"
              style={{ backgroundColor: 'red', borderRadius: '12px' }}
              disabled={!selectedImg || !canDeleteImage(selectedImg).allowed || settingBannerId === selectedImg?.id || settingProfileId === selectedImg?.id || deletingImageId === selectedImg?.id}
              className="w-full bg-red-500 hover:bg-red-600 text-white disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:bg-red-500 cursor-pointer"
              title={selectedImg ? canDeleteImage(selectedImg).reason : undefined}
            >
              <Trash2 size={18} className="mr-2" />
              {deletingImageId === selectedImg?.id ? t('modals.common.processing') || 'Processing...' : t('dashboard.portfolio.deleteImage')}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
