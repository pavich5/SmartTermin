import React from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Phone, Mail, Briefcase, Lock } from 'lucide-react';
import { useTranslation } from '../../hooks/useTranslation';
import { Input } from '../ui/input';
import { Label } from '../ui/label';

interface BasicInfoSectionProps {
  isEditing: boolean;
  isArtist: boolean;
  formData: {
    fullName: string;
    phone: string;
    email: string;
    profession: string;
    businessName: string;
  };
  user: {
    fullName: string;
    phone: string;
    email: string;
  };
  onInputChange: (field: string, value: string) => void;
}

export function BasicInfoSection({
  isEditing,
  isArtist,
  formData,
  user,
  onInputChange,
}: BasicInfoSectionProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <div>
      <h3 className="text-xl font-semibold mb-4 text-gray-800">{t('profile.basicInfo')}</h3>
      <div className="grid md:grid-cols-2 gap-6">
        <div>
          <Label htmlFor="fullName" className="flex items-center gap-2 mb-2">
            <User size={16} className="text-gray-400" />
            {t('profile.fullName')}
          </Label>
          {isEditing ? (
            <Input
              id="fullName"
              type="text"
              value={formData.fullName}
              onChange={(e) => {
                const value = e.target.value;
                if (value.length <= 50) {
                  onInputChange('fullName', value);
                }
              }}
              className="h-12 rounded-xl"
              placeholder={t('profile.fullNamePlaceholder')}
              maxLength={50}
              required
            />
          ) : (
            <div className="p-3 bg-gray-50 rounded-xl text-gray-700">
              {user.fullName || t('profile.notSet')}
            </div>
          )}
        </div>

        <div>
          <Label htmlFor="phone" className="flex items-center gap-2 mb-2">
            <Phone size={16} className="text-gray-400" />
            {t('profile.phone')}
          </Label>
          {isEditing ? (
            <div>
              <div className="relative">
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  readOnly
                  className="h-12 rounded-xl bg-gray-50 cursor-not-allowed pr-10"
                  style={{ paddingLeft: '30px' }}
                />
                <Lock
                  size={16}
                  style={{ left: '10px' }}
                  className="absolute top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                />
              </div>
              <button
                type="button"
                onClick={() => navigate('/dashboard/settings/change-phone')}
                className="text-sm text-blue-600 hover:text-sky-600 mt-2 underline block cursor-pointer"
              >
                {t('settings.profile.changePhoneNumber') || 'Change phone number'}
              </button>
            </div>
          ) : (
            <div className="p-3 bg-gray-50 rounded-xl text-gray-700">
              {user.phone || t('profile.notSet')}
            </div>
          )}
        </div>

        <div>
          <Label htmlFor="email" className="flex items-center gap-2 mb-2">
            <Mail size={16} className="text-gray-400" />
            {t('profile.email')}
          </Label>
          {isEditing ? (
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => onInputChange('email', e.target.value)}
              className="h-12 rounded-xl"
              placeholder={t('profile.emailPlaceholder')}
            />
          ) : (
            <div className="p-3 bg-gray-50 rounded-xl text-gray-700">
              {user.email || t('profile.notSet')}
            </div>
          )}
        </div>

        {isArtist && (
          <>
            <div>
              <Label htmlFor="profession" className="flex items-center gap-2 mb-2">
                <Briefcase size={16} className="text-gray-400" />
                {t('profile.profession')}
              </Label>
              {isEditing ? (
                <Input
                  id="profession"
                  type="text"
                  value={formData.profession}
                  onChange={(e) => onInputChange('profession', e.target.value)}
                  className="h-12 rounded-xl"
                  placeholder={t('profile.professionPlaceholder')}
                />
              ) : (
                <div className="p-3 bg-gray-50 rounded-xl text-gray-700">
                  {formData.profession || t('profile.notSet')}
                </div>
              )}
            </div>

            <div>
              <Label htmlFor="businessName" className="flex items-center gap-2 mb-2">
                <Briefcase size={16} className="text-gray-400" />
                {t('profile.businessName')}
              </Label>
              {isEditing ? (
                <Input
                  id="businessName"
                  type="text"
                  value={formData.businessName}
                  onChange={(e) => onInputChange('businessName', e.target.value)}
                  className="h-12 rounded-xl"
                  placeholder={t('profile.businessNamePlaceholder')}
                />
              ) : (
                <div className="p-3 bg-gray-50 rounded-xl text-gray-700">
                  {formData.businessName || t('profile.notSet')}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
