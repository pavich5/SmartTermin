import React, { useState } from 'react';
import { Sparkles, Check, ChevronDown, ChevronUp } from 'lucide-react';
import { useTranslation } from '../../hooks/useTranslation';
import { Button } from '../ui/button';

interface PricingCardProps {
  price: string;
  priceUnit: string;
  monthlyEquivalent: number | null;
  isLoadingPrice: boolean;
  isAuthenticated: boolean;
  features: string[];
  onCheckout: () => void;
}

export function PricingCard({
  price,
  priceUnit,
  monthlyEquivalent,
  isLoadingPrice,
  isAuthenticated,
  features,
  onCheckout,
}: PricingCardProps) {
  const { t } = useTranslation();
  const [showAllFeatures, setShowAllFeatures] = useState(false);
  const initialFeaturesCount = 6;
  const displayFeatures = showAllFeatures ? features : features.slice(0, initialFeaturesCount);
  const hasMoreFeatures = features.length > initialFeaturesCount;

  
  return (
    <div className="max-w-5xl mx-auto mb-12 md:mb-16">
      <div className="bg-white rounded-2xl md:rounded-3xl shadow-2xl overflow-hidden border border-gray-100">
        <div className="grid lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-gray-200">
          <div className="bg-sky-500 p-8 md:p-10 lg:p-12 text-white flex flex-col justify-between min-h-[400px] lg:min-h-[500px]">
            <div>
              <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm px-3 py-1.5 rounded-full text-xs md:text-sm font-medium mb-6">
                <Sparkles size={14} className="md:w-4 md:h-4" />
                <span>{t('pricing.proPlan')}</span>
              </div>
              <div className="mb-6">
                <div className="flex items-baseline gap-2 mb-3">
                  <span className="text-5xl md:text-6xl lg:text-7xl font-bold">
                    {isLoadingPrice ? '...' : price}
                  </span>
                  <span className="text-sky-100 text-lg md:text-xl lg:text-2xl">{priceUnit}</span>
                </div>
                {monthlyEquivalent && (
                  <div className="text-sky-100 text-sm md:text-base opacity-90 mb-4">
                    €{monthlyEquivalent.toFixed(2)}/{t('pricing.monthly').toLowerCase()}{' '}
                    {t('pricing.billedAnnually')}
                  </div>
                )}
                <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm px-3 py-1.5 rounded-full text-xs md:text-sm font-medium">
                  <span>🎁</span>
                  <span>{t('pricing.freeForFirstMonth')}</span>
                </div>
              </div>
            </div>
            <Button
              type="button"
              onClick={onCheckout}
              className="w-full bg-white text-sky-600 hover:bg-gray-100 py-5 md:py-6 rounded-xl text-base md:text-lg font-semibold shadow-lg hover:shadow-xl transition-all mt-6"
            >
              {isAuthenticated ? t('pricing.subscribeNow') : t('pricing.startFreeTrial')}
            </Button>
          </div>

          <div className="p-8 md:p-10 lg:p-12">
            <h3 className="text-xl md:text-2xl font-semibold mb-6 md:mb-8 text-gray-800">
              {t('pricing.everythingIncluded')}
            </h3>
            <div className="space-y-4 mb-6">
              {displayFeatures.map((feature, idx) => (
                <div key={idx} className="flex items-start gap-4">
                  <div className="w-5 h-5 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Check size={12} className="text-white" />
                  </div>
                  <span className="text-sm md:text-base text-gray-700 leading-relaxed">
                    {feature}
                  </span>
                </div>
              ))}
            </div>

            {hasMoreFeatures && (
              <button
                onClick={() => setShowAllFeatures(!showAllFeatures)}
                className="w-full flex items-center justify-center gap-2 text-blue-600 hover:text-sky-600 font-semibold text-sm md:text-base py-3 transition-colors mb-6"
              >
                {showAllFeatures ? (
                  <>
                    <span>Show Less</span>
                    <ChevronUp size={18} />
                  </>
                ) : (
                  <>
                    <span>Read More ({features.length - initialFeaturesCount} more)</span>
                    <ChevronDown size={18} />
                  </>
                )}
              </button>
            )}

            <div className="pt-6 border-t border-gray-100">
              <p className="text-center text-gray-500 text-xs md:text-sm">
                {t('pricing.noCreditCardRequired')}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
