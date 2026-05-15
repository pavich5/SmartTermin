import React from 'react';
import { useTranslation } from '../../hooks/useTranslation';

interface AboutSectionProps {
  about: string;
}

export function AboutSection({ about }: AboutSectionProps) {
  const { t } = useTranslation();

  return (
    <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
      <h2 className="text-2xl mb-4">{t('artistProfile.about')}</h2>
      <p className="text-gray-600 leading-relaxed">{about}</p>
    </section>
  );
}
