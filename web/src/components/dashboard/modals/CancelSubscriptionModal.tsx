import React from 'react';
import { AlertTriangle, Clock } from 'lucide-react';
import { useTranslation } from '../../../hooks/useTranslation';
import { Button } from '../../ui/button';
import { Modal } from './Modal';
import { format } from 'date-fns';
import { getDateLocale } from '../../../utils/dateLocale';

interface Subscription {
  isActive: boolean;
  type: 'monthly' | 'yearly';
  startDate: Date;
  nextBillingDate: Date;
  amount: number;
  currency: string;
}

interface CancelSubscriptionModalProps {
  show: boolean;
  onClose: () => void;
  subscription: Subscription | null;
  onConfirm: () => void;
}

export function CancelSubscriptionModal({
  show,
  onClose,
  subscription,
  onConfirm,
}: CancelSubscriptionModalProps) {
  const { t, language } = useTranslation();
  const dateLocale = getDateLocale(language);
  if (!subscription) return null;

  const formatAmount = (amount: number | undefined | null, currency: string) => {
    if (amount === undefined || amount === null) {
      return `${currency}0.00`;
    }
    return `${currency}${amount.toFixed(2)}`;
  };

  return (
    <Modal
      children={undefined}
      show={show}
      onClose={onClose}
      title={t('modals.cancelSubscription.title')}
    >
      <div className="space-y-4">
        <div className="flex items-start gap-3 p-4 bg-yellow-50 border border-yellow-200 rounded-xl">
          <AlertTriangle className="text-yellow-600 flex-shrink-0 mt-0.5" size={24} />
          <div className="flex-1">
            <p className="text-sm font-semibold text-yellow-900 mb-2">
              {t('modals.cancelSubscription.warning')}
            </p>
            <p className="text-sm text-yellow-800">{t('modals.cancelSubscription.warningDesc')}</p>
          </div>
        </div>

        <div className="p-4 bg-gray-50 rounded-xl">
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">{t('modals.cancelSubscription.plan')}</span>
              <span className="font-medium">
                {subscription.type === 'yearly'
                  ? t('modals.cancelSubscription.yearly')
                  : t('modals.cancelSubscription.monthly')}{' '}
                {t('modals.cancelSubscription.planText')}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">{t('modals.cancelSubscription.amount')}</span>
              <span className="font-medium">
                {formatAmount(subscription.amount, subscription.currency)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">{t('modals.cancelSubscription.nextBilling')}</span>
              <span className="font-medium">
                {format(subscription.nextBillingDate, 'MMM d, yyyy', { locale: dateLocale })}
              </span>
            </div>
            <div className="flex items-center gap-1 text-sm text-gray-500">
              <Clock size={14} />
              <span>
                {t('modals.cancelSubscription.accessUntil')}{' '}
                {format(subscription.nextBillingDate, 'MMM d, yyyy', { locale: dateLocale })}
              </span>
            </div>
          </div>
        </div>

        <div className="flex gap-3 pt-4">
          <Button onClick={onClose} variant="outline" className="flex-1 rounded-full">
            {t('modals.cancelSubscription.keepSubscription')}
          </Button>
          <Button
            onClick={onConfirm}
            className="flex-1 bg-red-600 hover:bg-red-700 text-white rounded-full"
          >
            {t('modals.cancelSubscription.cancelButton')}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
