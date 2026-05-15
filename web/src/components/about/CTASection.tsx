import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from '../../hooks/useTranslation';

export function CTASection() {
  const { t } = useTranslation();

  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto text-center">
        <h2 className="text-4xl font-bold text-gray-900 mb-4">{t('about.cta.title')}</h2>
        <p className="text-xl text-gray-600 mb-8">{t('about.cta.subtitle')}</p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            to="/pricing"
            className="inline-flex items-center justify-center px-8 h-12 text-lg bg-sky-500 text-white rounded-lg font-semibold hover:bg-sky-600 transition-all shadow-lg hover:shadow-xl"
          >
            {t('about.cta.viewPricing')}
          </Link>
          <Link
            to="/auth"
            className="inline-flex items-center justify-center px-8 h-12 text-lg bg-white text-sky-600 rounded-lg font-semibold hover:bg-blue-50 transition-all border-2 border-sky-500"
          >
            {t('about.cta.startFreeTrial')}
          </Link>
        </div>
      </div>
    </section>
  );
}
