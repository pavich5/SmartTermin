import React from 'react';
import { useTranslation } from '../../hooks/useTranslation';

interface Step {
  num: string;
  title: string;
  desc: string;
}

interface HowItWorksSectionProps {
  steps: Step[];
}

export function HowItWorksSection({ steps }: HowItWorksSectionProps) {
  const { t } = useTranslation();

  return (
    <section className="py-20 bg-blue-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-center text-4xl mb-4">{t('landing.howItWorks.title')}</h2>
        <p className="text-center text-gray-600 text-lg mb-12">
          {t('landing.howItWorks.subtitle')}
        </p>
        <div className="grid md:grid-cols-3 gap-8">
          {steps.map((step) => (
            <div
              key={step.num}
              className="relative p-8 bg-white rounded-2xl shadow-lg hover:shadow-xl transition-shadow"
            >
              <div className="absolute -top-4 -left-4 w-12 h-12 bg-sky-500 rounded-2xl flex items-center justify-center text-white shadow-lg font-semibold">
                {step.num}
              </div>
              <h3 className="text-xl mb-3 mt-4">{step.title}</h3>
              <p className="text-gray-600">{step.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
