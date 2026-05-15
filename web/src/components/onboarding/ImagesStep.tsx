import React, { useRef } from 'react';
import { Upload, X, Edit2 } from 'lucide-react';
import { Label } from '../ui/label';
import { ImageWithFallback } from '../figma/ImageWithFallback';
import { useTranslation } from '../../hooks/useTranslation';

interface ImagesStepProps {
  bannerPreview: string | null;
  profilePreview: string | null;
  onBannerUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onProfileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemoveBanner: () => void;
  onRemoveProfile: () => void;
}

export function ImagesStep({
  bannerPreview,
  profilePreview,
  onBannerUpload,
  onProfileUpload,
  onRemoveBanner,
  onRemoveProfile,
}: ImagesStepProps) {
  const { t } = useTranslation();
  const bannerInputRef = useRef<HTMLInputElement>(null);
  const profileInputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold mb-2 text-sky-700">
          {t('onboarding.images.title')}
        </h2>
        <p className="text-gray-600">{t('onboarding.images.subtitle')}</p>
      </div>

      <div className="space-y-6">
        <div>
          <Label className="mb-2">{t('onboarding.images.bannerLabel')}</Label>
          <div className="mt-2">
            {bannerPreview ? (
              <div className="relative w-full">
                <div
                  className="banner-image-container w-full h-48 rounded-xl overflow-hidden border-2 border-gray-200 flex-shrink-0 cursor-pointer hover:border-blue-500 transition-all relative"
                  style={{ maxWidth: '100%', height: '192px' }}
                  onClick={() => bannerInputRef.current?.click()}
                  onMouseEnter={(e) => {
                    const img = e.currentTarget.querySelector('img');
                    const overlay = e.currentTarget.querySelector('.overlay');
                    const text = e.currentTarget.querySelector('.overlay-text');
                    if (img) {
                      img.style.opacity = '0.9';
                      img.style.filter = 'blur(4px)';
                    }
                    if (overlay) overlay.style.opacity = '0.5';
                    if (text) text.style.opacity = '1';
                  }}
                  onMouseLeave={(e) => {
                    const img = e.currentTarget.querySelector('img');
                    const overlay = e.currentTarget.querySelector('.overlay');
                    const text = e.currentTarget.querySelector('.overlay-text');
                    if (img) {
                      img.style.opacity = '1';
                      img.style.filter = 'blur(0px)';
                    }
                    if (overlay) overlay.style.opacity = '0';
                    if (text) text.style.opacity = '0';
                  }}
                >
                  <ImageWithFallback
                    src={bannerPreview}
                    alt={t('onboarding.images.bannerAlt')}
                    className="w-full h-full object-cover transition-all duration-300"
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      display: 'block',
                      opacity: 1,
                      filter: 'blur(0px)',
                    }}
                  />
                  <div
                    className="overlay absolute inset-0 bg-black transition-opacity duration-300 flex items-center justify-center pointer-events-none"
                    style={{ opacity: 0 }}
                  >
                    <div
                      className="overlay-text transition-opacity duration-300 flex items-center gap-2"
                      style={{ opacity: 0, color: '#fbbf24' }}
                    >
                      <Edit2 size={20} style={{ color: 'white' }} />
                      <span className="text-sm font-medium" style={{ color: 'white' }}>
                        Click to replace
                      </span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemoveBanner();
                  }}
                  className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-2 hover:bg-red-600 transition-colors z-10"
                  title={t('common.removeImage')}
                >
                  <X size={16} />
                </button>
                <input
                  ref={bannerInputRef}
                  type="file"
                  className="hidden"
                  accept="image/jpeg,image/png"
                  onChange={onBannerUpload}
                />
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-blue-500 transition-colors">
                <div className="flex flex-col items-center justify-center p-4">
                  <Upload size={32} className="mb-3 text-gray-400" />
                  <p className="mb-2 text-sm text-gray-500">
                    {t('onboarding.images.bannerUploadCta')}
                  </p>
                  <p className="text-xs text-gray-500">{t('onboarding.images.bannerUploadHint')}</p>
                </div>
                <input
                  type="file"
                  className="hidden"
                  accept="image/jpeg,image/png"
                  onChange={onBannerUpload}
                />
              </label>
            )}
          </div>
        </div>

        <div>
          <Label className="mb-2">{t('onboarding.images.profileLabel')}</Label>
          <div className="mt-2">
            {profilePreview ? (
              <div className="relative inline-block">
                <div
                  className="profile-image-container w-32 h-32 rounded-full overflow-hidden border-4 border-blue-200 flex-shrink-0 cursor-pointer hover:border-blue-400 transition-all relative"
                  style={{ width: '128px', height: '128px' }}
                  onClick={() => profileInputRef.current?.click()}
                  onMouseEnter={(e) => {
                    const img = e.currentTarget.querySelector('img');
                    const overlay = e.currentTarget.querySelector('.overlay');
                    const text = e.currentTarget.querySelector('.overlay-text');
                    if (img) {
                      img.style.opacity = '0.6';
                      img.style.filter = 'blur(4px)';
                    }
                    if (overlay) overlay.style.opacity = '0.5';
                    if (text) text.style.opacity = '1';
                  }}
                  onMouseLeave={(e) => {
                    const img = e.currentTarget.querySelector('img');
                    const overlay = e.currentTarget.querySelector('.overlay');
                    const text = e.currentTarget.querySelector('.overlay-text');
                    if (img) {
                      img.style.opacity = '1';
                      img.style.filter = 'blur(0px)';
                    }
                    if (overlay) overlay.style.opacity = '0';
                    if (text) text.style.opacity = '0';
                  }}
                >
                  <ImageWithFallback
                    src={profilePreview}
                    alt={t('onboarding.images.profileAlt')}
                    className="w-full h-full object-cover rounded-full transition-all duration-300"
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      display: 'block',
                      opacity: 1,
                      filter: 'blur(0px)',
                    }}
                  />
                  <div
                    className="overlay absolute inset-0 bg-black transition-opacity duration-300 rounded-full flex items-center justify-center pointer-events-none"
                    style={{ opacity: 0 }}
                  >
                    <div
                      className="overlay-text transition-opacity duration-300"
                      style={{ opacity: 0.9 }}
                    >
                      <Edit2 size={18} style={{ color: 'white' }} />
                    </div>
                  </div>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemoveProfile();
                  }}
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-2 hover:bg-red-600 transition-colors z-10"
                  title={t('common.removeImage')}
                >
                  <X size={16} />
                </button>
                <input
                  ref={profileInputRef}
                  type="file"
                  className="hidden"
                  accept="image/jpeg,image/png"
                  onChange={onProfileUpload}
                />
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center w-32 h-32 border-2 border-dashed border-gray-300 rounded-full cursor-pointer hover:border-blue-500 transition-colors">
                <div className="flex flex-col items-center justify-center">
                  <Upload size={24} className="mb-2 text-gray-400" />
                  <p className="text-xs text-gray-500 text-center px-2">
                    {t('onboarding.images.uploadCta')}
                  </p>
                </div>
                <input
                  type="file"
                  className="hidden"
                  accept="image/jpeg,image/png"
                  onChange={onProfileUpload}
                />
              </label>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
