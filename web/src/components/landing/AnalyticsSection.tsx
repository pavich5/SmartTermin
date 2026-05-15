import React from 'react';
import { TrendingUp, LucideIcon } from 'lucide-react';
import { useTranslation } from '../../hooks/useTranslation';

interface AnalyticsItem {
  icon: LucideIcon;
  label: string;
}

interface AnalyticsSectionProps {
  items: AnalyticsItem[];
}

export function AnalyticsSection({ items }: AnalyticsSectionProps) {
  const { t } = useTranslation();

  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-4xl mb-4">{t('landing.analytics.title')}</h2>
            <p className="text-gray-600 text-lg mb-8">{t('landing.analytics.subtitle')}</p>
            <div className="space-y-4">
              {items.map((item, idx) => {
                const Icon = item.icon;
                return (
                  <div
                    key={idx}
                    className="flex items-center gap-4 p-4 bg-blue-50 rounded-xl"
                  >
                    <div className="w-10 h-10 rounded-lg bg-sky-500 flex items-center justify-center">
                      <Icon className="text-white" size={20} />
                    </div>
                    <span className="text-gray-700">{item.label}</span>
                  </div>
                );
              })}
            </div>
          </div>
          <div className="bg-blue-100 rounded-2xl p-8 shadow-xl">
            <div className="bg-white rounded-xl p-6 shadow-lg">
              <div className="flex items-center justify-between mb-6">
                <h3>{t('landing.analytics.dashboard')}</h3>
              </div>
              <div className="space-y-4">
                <div className="h-40 bg-blue-50 rounded-xl flex items-center justify-center">
                  <TrendingUp size={48} className="text-blue-300" />
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-blue-50 rounded-lg p-3 text-center">
                    <div className="text-blue-600">+32%</div>
                    <div className="text-xs text-gray-600 mt-1">
                      {t('landing.analytics.revenue')}
                    </div>
                  </div>
                  <div className="bg-blue-50 rounded-lg p-3 text-center">
                    <div className="text-blue-600">156</div>
                    <div className="text-xs text-gray-600 mt-1">
                      {t('landing.analytics.clients')}
                    </div>
                  </div>
                  <div className="bg-blue-50 rounded-lg p-3 text-center">
                    <div className="text-blue-600">4.8</div>
                    <div className="text-xs text-gray-600 mt-1">
                      {t('landing.analytics.rating')}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
