import React from 'react';
import { XCircle, Clock, Calendar } from 'lucide-react';
import { Button } from '../ui/button';
import { Modal } from '../dashboard/modals/Modal';
import { format, isToday } from 'date-fns';
import { useTranslation } from '../../hooks/useTranslation';
import { getDateLocale } from '../../utils/dateLocale';

interface Booking {
  id: number;
  artistName: string;
  service: string;
  date: Date;
  time: string;
  duration: string;
  price: string;
}

interface CancelBookingModalProps {
  show: boolean;
  onClose: () => void;
  booking: Booking | null;
  cancellationCheck: { allowed: boolean; message?: string };
  onConfirm: () => void;
  isLoading?: boolean;
}

export function CancelBookingModal({
  show,
  onClose,
  booking,
  cancellationCheck,
  onConfirm,
  isLoading = false,
}: CancelBookingModalProps) {
  const { t, language } = useTranslation();
  const dateLocale = getDateLocale(language);

  if (!booking) return null;

  return (
    <Modal show={show} onClose={onClose} title={t('modals.cancelBooking.title')}>
      <div className="space-y-4">
        {!cancellationCheck.allowed ? (
          <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
            <p className="text-red-800 font-semibold mb-2">
              {t('modals.cancelBooking.notAllowed')}
            </p>
            <p className="text-sm text-red-700">{cancellationCheck.message}</p>
          </div>
        ) : (
          <>
            <p className="text-gray-600">{t('modals.cancelBooking.confirmMessage')}</p>
            <p className="text-sm text-gray-500">{t('modals.cancelBooking.warning')}</p>
          </>
        )}
        <div className="p-4 bg-gray-50 rounded-xl">
          <div className="mb-3">
            <div className="text-xs text-gray-600 mb-1">{t('profile.artistLabel')}</div>
            <div className="font-semibold">{booking.artistName}</div>
          </div>
          <div className="mb-3">
            <div className="text-xs text-gray-600 mb-1">{t('profile.serviceLabel')}</div>
            <div className="font-semibold">{booking.service}</div>
          </div>
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-2 text-gray-600">
              <Calendar size={16} />
              <span>
                {isToday(booking.date)
                  ? t('profile.today')
                  : format(booking.date, 'MMM d, yyyy', { locale: dateLocale })}
              </span>
            </div>
            <div className="flex items-center gap-2 text-gray-600">
              <Clock size={16} />
              <span>{booking.time}</span>
            </div>
            <div className="text-blue-600 font-semibold">{booking.price}</div>
          </div>
        </div>
        <div className="flex gap-3 pt-4">
          <Button onClick={onClose} variant="outline" className="flex-1 rounded-full">
            {cancellationCheck.allowed ? t('modals.common.cancel') : t('modals.common.close')}
          </Button>
          {cancellationCheck.allowed && (
            <Button
              onClick={onConfirm}
              disabled={isLoading}
              className="flex-1 bg-red-600 hover:bg-red-700 text-white rounded-full disabled:opacity-50"
            >
              <XCircle size={18} className="mr-2" />
              {isLoading ? t('modals.cancelBooking.canceling') || 'Canceling...' : t('modals.cancelBooking.confirmButton')}
            </Button>
          )}
        </div>
      </div>
    </Modal>
  );
}
