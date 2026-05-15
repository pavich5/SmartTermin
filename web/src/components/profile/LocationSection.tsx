import React from 'react';
import { MapPin } from 'lucide-react';
import { useTranslation } from '../../hooks/useTranslation';
import { Input } from '../ui/input';
import { Label } from '../ui/label';

interface LocationSectionProps {
  isEditing: boolean;
  formData: {
    address: string;
    city: string;
    country: string;
  };
  onInputChange: (field: string, value: string) => void;
}

export function LocationSection({ isEditing, formData, onInputChange }: LocationSectionProps) {
  const { t } = useTranslation();

  return (
    <div>
      <h3 className="text-xl font-semibold mb-4 text-gray-800">{t('profile.location')}</h3>
      <div className="grid md:grid-cols-2 gap-6">
        <div>
          <Label htmlFor="address" className="flex items-center gap-2 mb-2">
            <MapPin size={16} className="text-gray-400" />
            {t('profile.address')}
          </Label>
          {isEditing ? (
            <Input
              id="address"
              type="text"
              value={formData.address}
              onChange={(e) => onInputChange('address', e.target.value)}
              className="h-12 rounded-xl"
              placeholder={t('profile.addressPlaceholder')}
            />
          ) : (
            <div className="p-3 bg-gray-50 rounded-xl text-gray-700">
              {formData.address || t('profile.notSet')}
            </div>
          )}
        </div>

        <div>
          <Label htmlFor="city" className="flex items-center gap-2 mb-2">
            <MapPin size={16} className="text-gray-400" />
            {t('profile.city')}
          </Label>
          {isEditing ? (
            <Input
              id="city"
              type="text"
              value={formData.city}
              onChange={(e) => onInputChange('city', e.target.value)}
              className="h-12 rounded-xl"
              placeholder={t('profile.cityPlaceholder')}
            />
          ) : (
            <div className="p-3 bg-gray-50 rounded-xl text-gray-700">
              {formData.city || t('profile.notSet')}
            </div>
          )}
        </div>

        <div>
          <Label htmlFor="country" className="flex items-center gap-2 mb-2">
            <MapPin size={16} className="text-gray-400" />
            {t('profile.country')}
          </Label>
          {isEditing ? (
            <Input
              id="country"
              type="text"
              value={formData.country}
              onChange={(e) => onInputChange('country', e.target.value)}
              className="h-12 rounded-xl"
              placeholder={t('profile.countryPlaceholder')}
            />
          ) : (
            <div className="p-3 bg-gray-50 rounded-xl text-gray-700">
              {formData.country || t('profile.notSet')}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
