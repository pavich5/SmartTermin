import React from 'react';
import { Button } from '../ui/button';
import { useTranslation } from '../../hooks/useTranslation';

interface CTASectionProps {
  onStartFreeTrial: () => void;
}

export function CTASection({ onStartFreeTrial }: CTASectionProps) {
  const { t } = useTranslation();

  return (
    <section className="py-20 bg-sky-500 text-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="text-4xl lg:text-5xl mb-4">{t('landing.cta.title')}</h2>
        <p className="text-xl mb-8 text-sky-100">{t('landing.cta.subtitle')}</p>
        <div className="flex justify-center">
          <Button
            onClick={onStartFreeTrial}
            className="bg-white text-sky-600 hover:bg-gray-100 px-8 py-6 rounded-full shadow-xl"
          >
            {t('landing.cta.button')}
          </Button>
        </div>
      </div>
    </section>
  );
}
