import React, { useMemo } from 'react';
import { format } from 'date-fns';
import { useTranslation } from '../../hooks/useTranslation';
import { getDateLocale } from '../../utils/dateLocale';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { formatPriceInMKDInt } from '../../utils/priceFormat';

interface Service {
  id: string | number;
  name: string;
  duration: number;
  price: number;
}

interface BookingSummaryProps {
  selectedServices: Service[];
  selectedDate: Date | undefined;
  selectedTime: Date | null;
}

export function BookingSummary({
  selectedServices,
  selectedDate,
  selectedTime,
}: BookingSummaryProps) {
  const { t, language } = useTranslation();
  const dateLocale = getDateLocale(language);

  const totalDuration = useMemo(() => {
    return selectedServices.reduce((sum, service) => sum + service.duration, 0);
  }, [selectedServices]);

  const totalPrice = useMemo(() => {
    return selectedServices.reduce((sum, service) => sum + service.price, 0);
  }, [selectedServices]);

  return (
    <Card className="sticky top-24">
      <CardHeader>
        <CardTitle>{t('booking.summary.title')}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {selectedServices.length > 0 && (
          <div>
            <div className="text-sm text-gray-600 mb-2">{t('booking.summary.service')}</div>
            <div className="space-y-2">
              {selectedServices.map((service) => (
                <div key={service.id} className="pb-2 border-b border-gray-100 last:border-0">
                  <div className="font-semibold">{service.name}</div>
                  <div className="text-sm text-gray-600">
                    {service.duration} {t('booking.service.duration')} • {formatPriceInMKDInt(service.price)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        {selectedDate && (
          <div>
            <div className="text-sm text-gray-600 mb-1">{t('booking.summary.date')}</div>
            <div className="font-semibold">
              {format(selectedDate, 'EEEE, MMMM d, yyyy', { locale: dateLocale })}
            </div>
          </div>
        )}
        {selectedTime && (
          <div>
            <div className="text-sm text-gray-600 mb-1">{t('booking.summary.time')}</div>
            <div className="font-semibold">{format(selectedTime, 'HH:mm')}</div>
          </div>
        )}
        {selectedServices.length > 0 && (
          <div className="pt-4 border-t mb-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-gray-600">{t('booking.summary.totalDuration')}</span>
              <span className="text-sm font-semibold">{totalDuration} {t('booking.service.duration')}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-lg font-semibold">{t('booking.summary.total')}</span>
              <span className="text-2xl font-bold text-blue-600">
                {formatPriceInMKDInt(totalPrice)}
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
