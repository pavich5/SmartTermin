import React from 'react';
import { XCircle, Clock } from 'lucide-react';
import { useTranslation } from '../../../hooks/useTranslation';
import { Button } from '../../ui/button';
import { Modal } from './Modal';
import { format } from 'date-fns';

interface Booking {
  id: number;
  client: string;
  service: string;
  time: string;
  duration: string;
  price: string;
}

interface CancelAllBookingsModalProps {
  show: boolean;
  onClose: () => void;
  bookings: Booking[];
  targetDate: Date | null;
  onConfirm: () => void;
}

export function CancelAllBookingsModal({
  show,
  onClose,
  bookings,
  targetDate,
  onConfirm,
}: CancelAllBookingsModalProps) {
  const { t } = useTranslation();

  return (
    <Modal show={show} onClose={onClose} title={t('modals.cancelAllBookings.title')}>
      <div className="space-y-4">
        <p className="text-gray-600">{t('modals.cancelAllBookings.confirmMessage')}</p>
        <p className="text-sm text-gray-500">{t('modals.cancelAllBookings.warning')}</p>
        {bookings.length > 0 && (
          <div className="p-4 bg-gray-50 rounded-xl max-h-64 overflow-y-auto">
            <div className="text-sm text-gray-600 mb-2 font-semibold">
              {t('modals.cancelAllBookings.bookingsWillBeCancelled', { count: bookings.length })}
            </div>
            <div className="space-y-2">
              {bookings.map((booking) => (
                <div key={booking.id} className="p-3 bg-white rounded-lg border border-gray-200">
                  <div className="mb-1 font-semibold">{booking.client}</div>
                  <div className="text-sm text-gray-600 mb-1">{booking.service}</div>
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <span className="flex items-center gap-1">
                      <Clock size={14} />
                      {booking.time}
                    </span>
                    <span>{booking.duration}</span>
                    <span className="text-blue-600">{booking.price}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        <div className="flex gap-3 pt-4">
          <Button onClick={onClose} variant="outline" className="flex-1 rounded-full">
            {t('modals.common.cancel')}
          </Button>
          <Button
            onClick={onConfirm}
            className="flex-1 bg-red-600 hover:bg-red-700 text-white rounded-full"
          >
            <XCircle size={18} className="mr-2" />
            {t('modals.cancelAllBookings.confirmButton')}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
