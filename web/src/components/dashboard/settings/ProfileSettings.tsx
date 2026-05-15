import React, { useState } from 'react';
import { Save, Lock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '../../../hooks/useTranslation';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { Label } from '../../ui/label';
import { Textarea } from '../../ui/textarea';
import { toast } from 'sonner';
import { useAuth } from '../../../contexts/AuthContext';

interface ProfileSettingsProps {
  fullName: string;
  email: string;
  phone: string;
  businessName: string;
  bio: string;
  onFullNameChange: (value: string) => void;
  onEmailChange: (value: string) => void;
  onPhoneChange: (value: string) => void;
  onBusinessNameChange: (value: string) => void;
  onBioChange: (value: string) => void;
  onSave: () => void;
  isLoading?: boolean;
}

export function ProfileSettings({
  fullName,
  email,
  phone,
  businessName,
  bio,
  onFullNameChange,
  onEmailChange,
  onPhoneChange,
  onBusinessNameChange,
  onBioChange,
  onSave,
  isLoading = false,
}: ProfileSettingsProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isSalonOwner = user?.salonRole === 'owner';
  const isSalonMember = user?.salonId && user?.salonRole === 'artist';
  const [errors, setErrors] = useState<{
    fullName?: string;
    email?: string;
  }>({});

  const validateEmail = (email: string): boolean => {
    if (!email) return true;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSave = () => {
    const newErrors: { fullName?: string; email?: string } = {};

    if (!fullName.trim()) {
      newErrors.fullName = t('settings.profile.fullNameRequired') || 'Full name is required';
      toast.error(t('settings.profile.fullNameRequired') || 'Full name is required');
    } else if (fullName.length > 50) {
      newErrors.fullName =
        t('settings.profile.fullNameTooLong') || 'Full name must be 50 characters or less';
      toast.error(
        t('settings.profile.fullNameTooLong') || 'Full name must be 50 characters or less'
      );
    }

    if (email && !validateEmail(email)) {
      newErrors.email = t('settings.profile.invalidEmail') || 'Please enter a valid email address';
      if (!newErrors.fullName) {
        toast.error(t('settings.profile.invalidEmail') || 'Please enter a valid email address');
      }
    }

    setErrors(newErrors);

    if (Object.keys(newErrors).length === 0) {
      onSave();
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6 w-full overflow-hidden">
      <h2 className="text-xl sm:text-2xl mb-6">{t('settings.profile.title')}</h2>
      <div className="grid md:grid-cols-2 gap-6">
        <div>
          <Label htmlFor="fullName">{t('settings.profile.fullName')}</Label>
          <Input
            id="fullName"
            type="text"
            value={fullName}
            onChange={(e) => {
              const value = e.target.value;
              if (value.length <= 50) {
                onFullNameChange(value);
                if (errors.fullName) {
                  setErrors((prev) => ({ ...prev, fullName: undefined }));
                }
              }
            }}
            className={`mt-2 h-12 rounded-xl ${errors.fullName ? 'border-red-500 focus:border-red-500' : ''}`}
            maxLength={50}
            required
          />
          {errors.fullName && (
            <p className="text-red-500 text-sm mt-1" style={{ color: '#ef4444' }}>
              {errors.fullName}
            </p>
          )}
        </div>
        <div>
          <Label htmlFor="email">{t('settings.profile.email')}</Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => {
              onEmailChange(e.target.value);
              if (errors.email) {
                setErrors((prev) => ({ ...prev, email: undefined }));
              }
            }}
            className={`mt-2 h-12 rounded-xl ${errors.email ? 'border-red-500 focus:border-red-500' : ''}`}
          />
          {errors.email && (
            <p className="text-red-500 text-sm mt-1" style={{ color: '#ef4444' }}>
              {errors.email}
            </p>
          )}
        </div>
        <div>
          <Label htmlFor="phone">{t('settings.profile.phone')}</Label>
          <div className="relative mt-2">
            <Input
              id="phone"
              type="tel"
              value={phone}
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
        {}
        {!isSalonMember && (
          <div>
            <Label htmlFor="businessName">{t('settings.profile.businessName')}</Label>
            <Input
              id="businessName"
              type="text"
              value={businessName}
              onChange={(e) => onBusinessNameChange(e.target.value)}
              className="mt-2 h-12 rounded-xl"
            />
          </div>
        )}
        <div className="md:col-span-2">
          <Label htmlFor="bio">{t('profile.about') || 'Bio'}</Label>
          <Textarea
            id="bio"
            value={bio}
            onChange={(e) => onBioChange(e.target.value)}
            className="mt-2 rounded-xl min-h-32"
            placeholder={t('profile.aboutPlaceholder')}
          />
        </div>
      </div>
      <Button
        onClick={handleSave}
        disabled={isLoading}
        className="mt-6 bg-sky-500 hover:bg-sky-600 text-white rounded-full px-8 disabled:opacity-50"
      >
        <Save size={18} className="mr-2" />
        {isLoading ? t('settings.common.saving') || 'Saving...' : t('settings.common.saveChanges')}
      </Button>
    </div>
  );
}
