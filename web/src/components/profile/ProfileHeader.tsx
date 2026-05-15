import React from 'react';
import { User, Shield, Edit2, Save, X, Check } from 'lucide-react';
import { useTranslation } from '../../hooks/useTranslation';
import { Button } from '../ui/button';

interface ProfileHeaderProps {
  user: {
    fullName: string;
    userType: string;
  };
  isEditing: boolean;
  isSaving: boolean;
  onEdit: () => void;
  onCancel: () => void;
  onSave: () => void;
}

export function ProfileHeader({
  user,
  isEditing,
  isSaving,
  onEdit,
  onCancel,
  onSave,
}: ProfileHeaderProps) {
  const { t } = useTranslation();

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-4xl font-bold text-sky-700">
          {t('profile.title')}
        </h1>
        {!isEditing ? (
          <Button
            onClick={onEdit}
            className="bg-sky-500 hover:bg-sky-600 text-white rounded-full p-3"
          >
            <Edit2 size={18} />
          </Button>
        ) : (
          <div className="flex gap-3">
            <Button
              onClick={onCancel}
              variant="outline"
              className="rounded-full p-3 md:px-6"
              disabled={isSaving}
            >
              <X size={18} className="md:mr-2" />
              <span className="hidden md:inline">{t('profile.cancel')}</span>
            </Button>
            <Button
              onClick={onSave}
              className="bg-sky-500 hover:bg-sky-600 text-white rounded-full p-3 md:px-6"
              disabled={isSaving}
            >
              <Check size={18} className="md:mr-2" />
              <span className="hidden md:inline">
                {isSaving ? t('profile.saving') : t('profile.save')}
              </span>
            </Button>
          </div>
        )}
      </div>
      <p className="text-gray-600">{t('profile.subtitle')}</p>
    </div>
  );
}
