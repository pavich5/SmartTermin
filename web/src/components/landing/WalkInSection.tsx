import React from 'react';
import { useTranslation } from '../../hooks/useTranslation';

interface WalkInSectionProps {
  steps: string[];
}

export function WalkInSection({ steps }: WalkInSectionProps) {
  const { t } = useTranslation();

  return (
    <section className="py-20 bg-blue-50 mb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-center text-4xl mb-4">{t('landing.walkIn.title')}</h2>
        <p className="text-center text-gray-600 text-lg mb-12">{t('landing.walkIn.subtitle')}</p>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {steps.map((step, idx) => (
            <div key={idx} className="bg-white p-6 rounded-2xl shadow-lg text-center">
              <div className="w-12 h-12 rounded-full bg-sky-500 flex items-center justify-center text-white mx-auto mb-4 shadow-md font-semibold">
                {idx + 1}
              </div>
              <p className="text-gray-700">{step}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

