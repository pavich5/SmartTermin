import React from 'react';
import { useTranslation } from '../../hooks/useTranslation';
import { Textarea } from '../ui/textarea';

interface AboutSectionProps {
  isEditing: boolean;
  about: string;
  onAboutChange: (value: string) => void;
}

export function AboutSection({ isEditing, about, onAboutChange }: AboutSectionProps) {
  const { t } = useTranslation();

  return (
    <div>
      <h3 className="text-xl font-semibold mb-4 text-gray-800">{t('profile.about')}</h3>
      {isEditing ? (
        <Textarea
          id="about"
          value={about}
          onChange={(e) => onAboutChange(e.target.value)}
          className="min-h-32 rounded-xl"
          placeholder={t('profile.aboutPlaceholder')}
        />
      ) : (
        <div className="p-4 bg-gray-50 rounded-xl text-gray-700 whitespace-pre-wrap">
          {about || t('profile.noDescription')}
        </div>
      )}
    </div>
  );
}
