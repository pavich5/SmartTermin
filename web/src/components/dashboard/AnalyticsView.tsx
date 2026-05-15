import React from 'react';
import { useTranslation } from '../../hooks/useTranslation';

interface Service {
  name: string;
  bookings: number;
  revenue: string;
}

interface AnalyticsViewProps {
  services: Service[];
  totalRevenue: string;
  totalBookings: number;
  activeServices: number;
  avgBookingValue: string;
}

export function AnalyticsView({
  services,
  totalRevenue,
  totalBookings,
  activeServices,
  avgBookingValue,
}: AnalyticsViewProps) {
  const { t } = useTranslation();

  return (
    <div className="space-y-6 w-full">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="text-sm text-gray-600 mb-2">{t('dashboard.analytics.totalRevenue')}</div>
          <div className="text-2xl font-bold text-blue-600">{totalRevenue}</div>
        </div>
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="text-sm text-gray-600 mb-2">{t('dashboard.analytics.totalBookings')}</div>
          <div className="text-2xl font-bold text-sky-600">{totalBookings}</div>
        </div>
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="text-sm text-gray-600 mb-2">
            {t('dashboard.analytics.activeServices')}
          </div>
          <div className="text-2xl font-bold text-blue-600">{activeServices}</div>
        </div>
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="text-sm text-gray-600 mb-2">
            {t('dashboard.analytics.avgBookingValue')}
          </div>
          <div className="text-2xl font-bold text-teal-600">{avgBookingValue}</div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-lg p-6 w-full">
        <h2 className="text-xl sm:text-2xl mb-6">{t('dashboard.analytics.popularServices')}</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {services
            .sort((a, b) => b.bookings - a.bookings)
            .map((service, idx) => (
              <div
                key={idx}
                className="p-4 rounded-xl bg-blue-50 border border-blue-100"
              >
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-base sm:text-lg font-semibold text-gray-900">
                    {service.name}
                  </h3>
                  <span className="text-xs px-2 py-1 bg-blue-100 text-sky-600 rounded-full font-medium">
                    #{idx + 1}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-4 mt-4">
                  <div>
                    <div className="text-xs text-gray-600 mb-1">
                      {t('dashboard.analytics.bookings')}
                    </div>
                    <div className="text-lg font-bold text-sky-600">{service.bookings}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-600 mb-1">
                      {t('dashboard.analytics.revenue')}
                    </div>
                    <div className="text-lg font-bold text-teal-600">
                      {(service.revenue || '0')
                        .replace(/[¤€$£¥₹]|\s*[A-Z]{3}\s*/g, '')
                        .replace(/\s*ден\.?\s*/gi, '')
                        .trim() || '0'}{' '}
                      ден.
                    </div>
                  </div>
                </div>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}
