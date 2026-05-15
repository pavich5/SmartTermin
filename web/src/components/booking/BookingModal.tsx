import React, { useMemo } from 'react';
import { X as XIcon } from 'lucide-react';
import { format } from 'date-fns';
import { useTranslation } from '../../hooks/useTranslation';
import { getDateLocale } from '../../utils/dateLocale';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../ui/button';
import { Label } from '../ui/label';

interface Service {
  id: string | number;
  name: string;
  duration: number;
  price: number;
}

interface CustomerInfo {
  notes: string;
}

interface BookingModalProps {
  show: boolean;
  selectedServices: Service[];
  selectedDate: Date | undefined;
  selectedTime: Date | null;
  customerInfo: CustomerInfo;
  onClose: () => void;
  onFieldChange: (field: keyof CustomerInfo, value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  isLoading?: boolean;
}

export function BookingModal({
  show,
  selectedServices,
  selectedDate,
  selectedTime,
  customerInfo,
  onClose,
  onFieldChange,
  onSubmit,
  isLoading = false,
}: BookingModalProps) {
  const { t, language } = useTranslation();
  const { user } = useAuth();
  const dateLocale = getDateLocale(language);

  const totalDuration = useMemo(() => {
    return selectedServices.reduce((sum, service) => sum + service.duration, 0);
  }, [selectedServices]);

  const totalPrice = useMemo(() => {
    return selectedServices.reduce((sum, service) => sum + service.price, 0);
  }, [selectedServices]);

  if (!show) return null;

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        style={{ maxWidth: '600px' }}
        className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 border-b border-gray-200 flex items-center justify-between sticky top-0 bg-white rounded-t-2xl">
          <h2 className="text-xl font-bold text-gray-900">{t('booking.summary.title')}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <XIcon size={24} />
          </button>
        </div>
        <div className="p-6">
          {selectedServices.length > 0 && selectedDate && selectedTime && (
            <div className="space-y-3 mb-6 p-4 bg-gray-50 rounded-lg">
              <div className="text-gray-700">
                <strong className="text-gray-900">{t('booking.summary.service')}:</strong>
                <div className="mt-2 space-y-1">
                  {selectedServices.map((service) => (
                    <div key={service.id} className="text-sm pl-4">
                      • {service.name} ({service.duration} {t('booking.service.duration')}, {service.price} ден.)
                    </div>
                  ))}
                </div>
              </div>
              <div className="text-gray-700">
                <strong className="text-gray-900">{t('booking.summary.date')}:</strong>{' '}
                {format(selectedDate, 'EEEE, MMMM d, yyyy', { locale: dateLocale })}
              </div>
              <div className="text-gray-700">
                <strong className="text-gray-900">{t('booking.summary.time')}:</strong>{' '}
                {format(selectedTime, 'HH:mm')}
              </div>
              <div className="text-gray-700 pt-2 border-t border-gray-200">
                <div className="flex justify-between items-center mb-1">
                  <strong className="text-gray-900">{t('booking.summary.totalDuration')}:</strong>
                  <span>{totalDuration} {t('booking.service.duration')}</span>
                </div>
                <div className="flex justify-between items-center">
                  <strong className="text-gray-900">{t('booking.summary.total')}:</strong>
                  <span className="text-lg font-bold text-blue-600">{totalPrice} ден.</span>
                </div>
              </div>
            </div>
          )}
          {user && (
            <div className="mb-6 p-4 bg-blue-50 rounded-lg space-y-2">
              <div className="text-gray-700">
                <strong className="text-gray-900">{t('booking.form.fullName')}:</strong>{' '}
                {user.fullName}
              </div>
              {user.email && (
                <div className="text-gray-700">
                  <strong className="text-gray-900">{t('booking.form.email')}:</strong> {user.email}
                </div>
              )}
              <div className="text-gray-700">
                <strong className="text-gray-900">{t('booking.form.phone')}:</strong> {user.phone}
              </div>
            </div>
          )}
          <form onSubmit={onSubmit} className="space-y-4">
            <div>
              <Label htmlFor="booking-notes">{t('booking.form.specialRequests')}</Label>
              <textarea
                id="booking-notes"
                className="mt-2 w-full min-h-[100px] p-3 border border-gray-300 rounded-lg resize-none"
                placeholder={t('booking.form.specialRequestsPlaceholder')}
                value={customerInfo.notes}
                onChange={(e) => onFieldChange('notes', e.target.value)}
              />
            </div>
            <Button
              type="submit"
              disabled={isLoading}
              className="w-full bg-sky-500 hover:bg-sky-600 text-white disabled:opacity-50"
            >
              {isLoading ? t('booking.form.submitting') || 'Submitting...' : t('booking.form.submit')}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
