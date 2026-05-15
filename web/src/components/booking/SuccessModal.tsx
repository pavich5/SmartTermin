import React from 'react';
import { Check } from 'lucide-react';
import { useTranslation } from '../../hooks/useTranslation';
import { Button } from '../ui/button';

interface SuccessModalProps {
  show: boolean;
  onClose: () => void;
}

export function SuccessModal({ show, onClose }: SuccessModalProps) {
  const { t } = useTranslation();

  if (!show) return null;

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6"
        style={{ maxWidth: '500px' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Check className="text-blue-600" size={32} />
        </div>
        <h2 className="text-center text-xl font-bold text-gray-900 mb-2">
          {t('booking.success.title')}
        </h2>
        <p className="text-center text-gray-600 mb-6">{t('booking.success.message')}</p>
        <Button
          onClick={onClose}
          className="w-full bg-sky-500 hover:bg-sky-600 text-white"
        >
          {t('booking.success.close')}
        </Button>
      </div>
    </div>
  );
}
