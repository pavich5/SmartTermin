import React from 'react';
import { Briefcase, Building, MapPin } from 'lucide-react';
import { useTranslation } from '../../hooks/useTranslation';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { PROFESSIONS } from '../../constants/options';

interface BasicInfoStepProps {
  basicInfo: {
    profession: string;
    businessName: string;
    address: string;
    city: string;
    about: string;
    customBookingLink?: string;
  };
  onBasicInfoChange: (field: string, value: string) => void;
  hideBusinessName?: boolean;
  hideCustomBookingLink?: boolean;
}

export function BasicInfoStep({ basicInfo, onBasicInfoChange, hideBusinessName = false, hideCustomBookingLink = false }: BasicInfoStepProps) {
  const { t } = useTranslation();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold mb-2 text-sky-700">
          {t('onboarding.basicInfo.title')}
        </h2>
        <p className="text-gray-600">{t('onboarding.basicInfo.subtitle')}</p>
      </div>

      <div className="space-y-4">
        <div>
          <Label htmlFor="profession" className="flex items-center gap-2 mb-2">
            <Briefcase size={16} className="text-gray-400" />
            {t('onboarding.basicInfo.profession')} *
          </Label>
          <select
            id="profession"
            value={basicInfo.profession}
            onChange={(e) => onBasicInfoChange('profession', e.target.value)}
            className="h-12 rounded-xl border border-gray-200 px-4 bg-white w-full"
            required
          >
            <option value="">{t('onboarding.basicInfo.selectProfession')}</option>
            {PROFESSIONS.map((profession) => (
              <option key={profession} value={profession}>
                {t(`onboarding.basicInfo.professions.${profession}` as any)}
              </option>
            ))}
          </select>
        </div>

        {!hideBusinessName && (
          <div>
            <Label htmlFor="businessName" className="flex items-center gap-2 mb-2">
              <Building size={16} className="text-gray-400" />
              {t('onboarding.basicInfo.businessName')} *
            </Label>
            <Input
              id="businessName"
              type="text"
              placeholder={t('onboarding.basicInfo.businessPlaceholder')}
              className="h-12 rounded-xl"
              value={basicInfo.businessName}
              onChange={(e) => onBasicInfoChange('businessName', e.target.value)}
              required
            />
          </div>
        )}

        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="address" className="flex items-center gap-2 mb-2">
              <MapPin size={16} className="text-gray-400" />
              {t('onboarding.basicInfo.address')} *
            </Label>
            <Input
              id="address"
              type="text"
              placeholder={t('onboarding.basicInfo.addressPlaceholder')}
              className="h-12 rounded-xl"
              value={basicInfo.address}
              onChange={(e) => onBasicInfoChange('address', e.target.value)}
              required
            />
          </div>

          <div>
            <Label htmlFor="city" className="flex items-center gap-2 mb-2">
              <MapPin size={16} className="text-gray-400" />
              {t('onboarding.basicInfo.city')} *
            </Label>
            <Input
              id="city"
              type="text"
              placeholder={t('onboarding.basicInfo.cityPlaceholder')}
              className="h-12 rounded-xl"
              value={basicInfo.city}
              onChange={(e) => onBasicInfoChange('city', e.target.value)}
              required
            />
          </div>
        </div>

        <div>
          <Label htmlFor="about" className="mb-2">
            {t('onboarding.basicInfo.about')}
          </Label>
          <Textarea
            id="about"
            placeholder={t('onboarding.basicInfo.aboutPlaceholder')}
            className="min-h-32 rounded-xl"
            value={basicInfo.about}
            onChange={(e) => onBasicInfoChange('about', e.target.value)}
          />
        </div>

        {!hideCustomBookingLink && (
          <div>
            <Label htmlFor="customBookingLink" className="flex items-center gap-2 mb-2">
              <Briefcase size={16} className="text-gray-400" />
              {t('onboarding.basicInfo.customBookingLink') || 'Custom Booking Link'}
            </Label>
            <div className="flex items-center gap-2">
              <span className="text-gray-500 text-sm">smartermin.com/</span>
              <Input
                id="customBookingLink"
                type="text"
                placeholder={t('onboarding.basicInfo.customBookingLinkPlaceholder') || 'your-custom-link'}
                className="h-12 rounded-xl flex-1"
                value={basicInfo.customBookingLink || ''}
                onChange={(e) => {
                  // Only allow lowercase letters, numbers, and hyphens
                  const value = e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '');
                  onBasicInfoChange('customBookingLink', value);
                }}
              />
            </div>
            <p className="text-sm text-gray-500 mt-1">
              {t('onboarding.basicInfo.customBookingLinkHint') || 'Create a unique URL for your booking page'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
