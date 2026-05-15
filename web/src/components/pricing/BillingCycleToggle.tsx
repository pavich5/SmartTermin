import React from 'react';
import { useTranslation } from '../../hooks/useTranslation';
import type { BillingCycle } from '../../constants/paddle';

interface BillingCycleToggleProps {
  billingCycle: BillingCycle;
  onBillingCycleChange: (cycle: BillingCycle) => void;
}

export function BillingCycleToggle({
  billingCycle,
  onBillingCycleChange,
}: BillingCycleToggleProps) {
  const { t } = useTranslation();

  return (
    <div className="inline-flex items-center gap-1 bg-white rounded-full p-1 shadow-lg border border-gray-100">
      <button
        onClick={() => onBillingCycleChange('month')}
        className={`px-6 md:px-8 py-2 md:py-2.5 rounded-full transition-all font-medium text-sm md:text-base ${
          billingCycle === 'month'
            ? 'bg-sky-500 text-white shadow-md'
            : 'text-gray-600 hover:text-gray-900'
        }`}
      >
        {t('pricing.monthly')}
      </button>
      <button
        onClick={() => onBillingCycleChange('year')}
        className={`px-6 md:px-8 py-2 md:py-2.5 rounded-full transition-all relative font-medium text-sm md:text-base ${
          billingCycle === 'year'
            ? 'bg-sky-500 text-white shadow-md'
            : 'text-gray-600 hover:text-gray-900'
        }`}
      >
        {t('pricing.yearly')}
        <span className="absolute w-full -top-2 -right-1 bg-blue-500 text-white text-xs px-2 py-1 rounded-full">
          {t('pricing.save20')}
        </span>
      </button>
    </div>
  );
}
