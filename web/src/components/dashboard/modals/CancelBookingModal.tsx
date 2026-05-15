import React from 'react';
import { XCircle, Clock } from 'lucide-react';
import { useTranslation } from '../../../hooks/useTranslation';
import { Button } from '../../ui/button';
import { Modal } from './Modal';

interface Booking {
  id: string;
  client: string;
  service: string;
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
  const { t } = useTranslation();
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
          <div className="mb-1 font-semibold">{booking.client}</div>
          <div className="text-sm text-gray-600 mb-2">{booking.service}</div>
          <div className="flex items-center gap-4 text-sm text-gray-500">
            <span className="flex items-center gap-1">
              <Clock size={14} />
              {booking.time}
            </span>
            <span>{booking.duration}</span>
            <span className="text-blue-600">{booking.price}</span>
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
