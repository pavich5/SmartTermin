import React from 'react';
import { Save } from 'lucide-react';
import { useTranslation } from '../../../hooks/useTranslation';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { Label } from '../../ui/label';
import { Textarea } from '../../ui/textarea';

interface BusinessSettingsProps {
  address: string;
  city: string;
  country: string;
  onAddressChange: (value: string) => void;
  onCityChange: (value: string) => void;
  onCountryChange: (value: string) => void;
  onSave: () => void;
  isLoading?: boolean;
  // Salon-specific fields (optional, only for salon owners)
  salonName?: string;
  salonBio?: string;
  onSalonNameChange?: (value: string) => void;
  onSalonBioChange?: (value: string) => void;
}

export function BusinessSettings({
  address,
  city,
  country,
  onAddressChange,
  onCityChange,
  onCountryChange,
  onSave,
  isLoading = false,
  salonName,
  salonBio,
  onSalonNameChange,
  onSalonBioChange,
}: BusinessSettingsProps) {
  const { t } = useTranslation();
  const isSalonSettings = salonName !== undefined && onSalonNameChange !== undefined;

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6 w-full overflow-hidden">
      <h2 className="text-xl sm:text-2xl mb-6">
        {isSalonSettings 
          ? t('enterprise.dashboard.salonName') || 'Salon Information'
          : t('settings.business.title')}
      </h2>
      <div className="grid md:grid-cols-2 gap-6">
        {isSalonSettings && (
          <div>
            <Label htmlFor="salonName">{t('enterprise.dashboard.salonNameLabel') || 'Salon Name'}</Label>
            <Input
              id="salonName"
              type="text"
              value={salonName}
              onChange={(e) => onSalonNameChange?.(e.target.value)}
              className="mt-2 h-12 rounded-xl"
              placeholder={t('enterprise.dashboard.salonNamePlaceholder') || 'Enter salon name'}
            />
          </div>
        )}
        <div>
          <Label htmlFor="address">{t('settings.business.address')}</Label>
          <Input
            id="address"
            type="text"
            value={address}
            onChange={(e) => onAddressChange(e.target.value)}
            className="mt-2 h-12 rounded-xl"
            maxLength={50}
          />
        </div>
        <div>
          <Label htmlFor="city">{t('settings.business.city')}</Label>
          <Input
            id="city"
            type="text"
            value={city}
            onChange={(e) => onCityChange(e.target.value)}
            className="mt-2 h-12 rounded-xl"
            maxLength={50}
          />
        </div>
        <div>
          <Label htmlFor="country">{t('settings.business.country')}</Label>
          <Input
            id="country"
            type="text"
            value={country}
            onChange={(e) => onCountryChange(e.target.value)}
            className="mt-2 h-12 rounded-xl"
            readOnly
          />
        </div>
        {isSalonSettings && (
          <div className="md:col-span-2">
            <Label htmlFor="salonBio">{t('profile.about') || 'Bio'}</Label>
            <Textarea
              id="salonBio"
              value={salonBio || ''}
              onChange={(e) => onSalonBioChange?.(e.target.value)}
              className="mt-2 rounded-xl min-h-32"
              placeholder={t('profile.aboutPlaceholder')}
            />
          </div>
        )}
      </div>
      <Button
        onClick={onSave}
        disabled={isLoading}
        className="mt-6 bg-sky-500 hover:bg-sky-600 text-white rounded-full px-8 disabled:opacity-50"
      >
        <Save size={18} className="mr-2" />
        {isLoading ? t('settings.common.saving') || 'Saving...' : t('settings.common.saveChanges')}
      </Button>
    </div>
  );
}
