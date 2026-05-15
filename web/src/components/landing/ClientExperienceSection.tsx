import React from 'react';
import { FeatureCard } from './FeatureCard';
import { LucideIcon } from 'lucide-react';
import { useTranslation } from '../../hooks/useTranslation';

interface Feature {
  icon: LucideIcon;
  title: string;
  desc: string;
  color: string;
}

interface ClientExperienceSectionProps {
  features: Feature[];
}

export function ClientExperienceSection({ features }: ClientExperienceSectionProps) {
  const { t } = useTranslation();

  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-center text-4xl mb-4">{t('landing.clientExperience.title')}</h2>
        <p className="text-center text-gray-600 text-lg mb-12">
          {t('landing.clientExperience.subtitle')}
        </p>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, idx) => (
            <FeatureCard key={idx} {...feature} />
          ))}
        </div>
      </div>
    </section>
  );
}
