import React from 'react';
import { X, AlertTriangle } from 'lucide-react';
import { useTranslation } from '../../../hooks/useTranslation';
import { Button } from '../../ui/button';

interface Payment {
  id: number;
  transactionId: string;
  amount: number;
  currency: string;
  status: 'success' | 'failed';
  date: Date;
  service: string;
  client: string;
  paymentMethod: string;
  description: string;
}

interface CancelPaymentModalProps {
  show: boolean;
  onClose: () => void;
  payment: Payment | null;
  onConfirm: () => void;
}

export function CancelPaymentModal({ show, onClose, payment, onConfirm }: CancelPaymentModalProps) {
  const { t } = useTranslation();
  if (!show || !payment) return null;

  const formatAmount = (amount: number, currency: string) => {
    return `${currency}${amount.toFixed(2)}`;
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-semibold">{t('modals.cancelPayment.title')}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={24} />
          </button>
        </div>

        <div className="mb-6">
          <div className="flex items-center gap-3 p-4 bg-yellow-50 border border-yellow-200 rounded-xl mb-4">
            <AlertTriangle className="text-yellow-600 flex-shrink-0" size={24} />
            <p className="text-sm text-yellow-800">{t('modals.cancelPayment.warning')}</p>
          </div>

          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">{t('modals.cancelPayment.transactionId')}</span>
              <span className="font-medium">{payment.transactionId}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">{t('modals.cancelPayment.amount')}</span>
              <span className="font-medium">{formatAmount(payment.amount, payment.currency)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">{t('modals.cancelPayment.service')}</span>
              <span className="font-medium">{payment.service}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">{t('modals.cancelPayment.client')}</span>
              <span className="font-medium">{payment.client}</span>
            </div>
          </div>
        </div>

        <div className="flex gap-3">
          <Button onClick={onClose} variant="outline" className="flex-1 border-gray-300">
            {t('modals.cancelPayment.keepPayment')}
          </Button>
          <Button
            onClick={onConfirm}
            className="flex-1 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white"
          >
            {t('modals.cancelPayment.cancelButton')}
          </Button>
        </div>
      </div>
    </div>
  );
}
