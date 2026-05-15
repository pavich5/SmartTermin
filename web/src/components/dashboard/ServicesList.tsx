import React from 'react';
import { Plus, Edit, Trash2, AlertCircle } from 'lucide-react';
import { useTranslation } from '../../hooks/useTranslation';
import { useSubscriptionLimits } from '../../hooks/useSubscriptionLimits';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Button } from '../ui/button';
import { formatPriceInMKDInt } from '../../utils/priceFormat';

interface Service {
  id: string | number;
  name: string;
  duration: number;
  price: number;
  description: string;
  bookings: number;
  revenue: string;
}

interface ServicesListProps {
  services: Service[];
  timeInterval: number;
  onAddService: () => void;
  onEditService: (service: Service) => void;
  onDeleteService: (service: Service) => void;
}

export function ServicesList({
  services,
  timeInterval,
  onAddService,
  onEditService,
  onDeleteService,
}: ServicesListProps) {
  const { t } = useTranslation();
  const { limits, canCreateService, isPro } = useSubscriptionLimits();
  const navigate = useNavigate();

  const handleAddService = () => {
    if (!canCreateService && limits) {
      toast.error(t('toast.serviceLimitReached'), {
        description: t('toast.serviceLimitReachedDesc', { max: limits.maxServices, current: limits.currentServices }),
        action: {
          label: t('toast.upgrade'),
          onClick: () => navigate('/pricing'),
        },
      });
      return;
    }
    onAddService();
  };

  const serviceUsage = limits
    ? `${limits.currentServices}/${limits.maxServices === Number.MAX_SAFE_INTEGER ? '∞' : limits.maxServices} services`
    : '';

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6 w-full overflow-hidden">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div className="min-w-0 flex-1">
          <h2 className="text-xl sm:text-2xl mb-1">{t('dashboard.services.title')}</h2>
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-gray-600 text-xs sm:text-sm">
              {t('dashboard.services.timeIntervals', { minutes: timeInterval })}
            </p>
            {!isPro && limits && (
              <span className="text-xs px-2 py-1 bg-orange-100 text-orange-700 rounded-full">
                {serviceUsage}
              </span>
            )}
          </div>
        </div>
        <Button
          onClick={handleAddService}
          disabled={!canCreateService && !isPro}
          className="bg-sky-500 hover:bg-sky-600 text-white rounded-full flex-shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Plus size={20} className="mr-2" />
          <span className="hidden sm:inline">{t('dashboard.services.addService')}</span>
          <span className="sm:hidden">{t('dashboard.services.add')}</span>
        </Button>
      </div>
      {!canCreateService && !isPro && limits && (
        <div className="mb-4">
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 flex items-start gap-3">
            <AlertCircle className="text-orange-600 flex-shrink-0 mt-0.5" size={20} />
            <div className="flex-1">
              <p className="text-sm font-medium text-orange-900">
                {t('common.serviceLimitReached', { current: limits.currentServices, max: limits.maxServices })}
              </p>
              <p className="text-xs text-orange-700 mt-1">{t('common.upgradeToProForUnlimited')}</p>
            </div>
            <Button
              onClick={() => navigate('/pricing')}
              size="sm"
              className="bg-orange-600 hover:bg-orange-700 text-white text-xs"
            >
              {t('toast.upgrade')}
            </Button>
          </div>
        </div>
      )}
      <div className="space-y-4 w-full">
        {services.map((service) => (
          <div
            key={service.id}
            className="p-4 rounded-xl border-2 border-gray-100 hover:border-blue-200 transition-all w-full overflow-hidden"
          >
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
              <div className="flex-1 min-w-0 w-full">
                <div className="flex items-center gap-2 sm:gap-3 mb-2 flex-wrap">
                  <h3 className="text-base sm:text-lg truncate">{service.name}</h3>
                  <span className="bg-sky-100 text-sky-600 px-2 sm:px-3 py-1 rounded-full text-xs whitespace-nowrap flex-shrink-0">
                    {service.duration} {t('booking.service.duration')}
                  </span>
                  <span className="bg-blue-100 text-blue-600 px-2 sm:px-3 py-1 rounded-full text-xs whitespace-nowrap flex-shrink-0">
                    {formatPriceInMKDInt(service.price)}
                  </span>
                </div>
                <p className="text-gray-600 text-xs sm:text-sm mb-3 break-words">
                  {service.description}
                </p>
                <div className="flex items-center gap-2 sm:gap-4 text-xs sm:text-sm text-gray-500 flex-wrap">
                  <span className="whitespace-nowrap">
                    {service.bookings} {t('dashboard.services.bookings')}
                  </span>
                  <span>•</span>
                  <span className="whitespace-nowrap">
                    {formatPriceInMKDInt(service.revenue || '0')} {t('dashboard.services.revenue')}
                  </span>
                </div>
              </div>
              <div className="flex gap-2 flex-shrink-0 w-full sm:w-auto">
                <Button
                  onClick={() => onEditService(service)}
                  variant="outline"
                  size="sm"
                  className="rounded-full flex-1 sm:flex-initial"
                >
                  <Edit size={16} className="mr-1 sm:mr-2" />
                  <span className="hidden sm:inline">{t('dashboard.services.editService')}</span>
                  <span className="sm:hidden">{t('dashboard.services.edit')}</span>
                </Button>
                <Button
                  onClick={() => onDeleteService(service)}
                  variant="outline"
                  size="sm"
                  disabled={services.length === 1}
                  className="rounded-full text-blue-600 border-blue-600 hover:bg-blue-50 flex-1 sm:flex-initial disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Trash2 size={16} className="sm:mr-2" />
                  <span className="hidden sm:inline">{t('dashboard.services.delete')}</span>
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
