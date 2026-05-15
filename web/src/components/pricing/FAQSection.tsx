import React from 'react';
import { useTranslation } from '../../hooks/useTranslation';

interface FAQ {
  q: string;
  a: string;
}

interface FAQSectionProps {
  faqs: FAQ[];
}

export function FAQSection({ faqs }: FAQSectionProps) {
  const { t } = useTranslation();

  return (
    <div className="max-w-5xl mx-auto bg-white rounded-2xl md:rounded-3xl shadow-xl p-6 md:p-8 lg:p-12">
      <h2 className="text-2xl md:text-3xl text-center mb-6 md:mb-8 font-semibold">
        {t('pricing.faq.title')}
      </h2>
      <div className="space-y-0">
        {faqs.map((faq, idx) => (
          <div
            key={idx}
            className={`pb-8 md:pb-10 ${idx > 0 ? 'pt-8 md:pt-10 border-t border-gray-100' : ''}`}
          >
            <h3 className="text-base md:text-lg mb-1.5 font-medium text-gray-900">{faq.q}</h3>
            <p className="text-sm md:text-base text-gray-600 leading-relaxed">{faq.a}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
