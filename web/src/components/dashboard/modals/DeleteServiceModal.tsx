import React from 'react';
import { useTranslation } from '../../../hooks/useTranslation';
import { Button } from '../../ui/button';
import { Modal } from './Modal';

interface Service {
  id: number;
  name: string;
  duration: number;
  price: number;
}

interface DeleteServiceModalProps {
  show: boolean;
  onClose: () => void;
  service: Service | null;
  onConfirm: () => void;
  isLoading?: boolean;
}

export function DeleteServiceModal({ show, onClose, service, onConfirm, isLoading = false }: DeleteServiceModalProps) {
  const { t } = useTranslation();

  return (
    <Modal show={show} onClose={onClose} title={t('modals.deleteService.title')}>
      <div className="space-y-4">
        <p className="text-gray-600">{t('modals.deleteService.confirmMessage')}</p>
        {service && (
          <div className="p-4 bg-gray-50 rounded-xl">
            <div className="mb-1">{service.name}</div>
            <div className="text-sm text-gray-600">
              {service.duration} {t('booking.service.duration')} • {service.price} ден.
            </div>
          </div>
        )}
        <div className="flex gap-3 pt-4 w-full">
          <Button onClick={onClose} variant="outline" className="flex-1 rounded-full">
            {t('modals.common.cancel')}
          </Button>
          <Button
            onClick={onConfirm}
            disabled={isLoading}
            className="flex-1 bg-red-600 hover:bg-red-700 text-white rounded-full font-medium min-w-0 disabled:opacity-50"
            style={{ color: 'white' }}
          >
            <span className="text-white">{isLoading ? t('modals.common.processing') || 'Processing...' : t('modals.deleteService.delete')}</span>
          </Button>
        </div>
      </div>
    </Modal>
  );
}
