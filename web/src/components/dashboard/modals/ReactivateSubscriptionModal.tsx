import React from 'react';
import { CheckCircle2, Sparkles } from 'lucide-react';
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

interface ReactivateSubscriptionModalProps {
  show: boolean;
  onClose: () => void;
  subscription: Subscription | null;
  onConfirm: () => void;
}

export function ReactivateSubscriptionModal({
  show,
  onClose,
  subscription,
  onConfirm,
}: ReactivateSubscriptionModalProps) {
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
      title={t('modals.reactivateSubscription.title')}
    >
      <div className="space-y-4">
        <div className="flex items-start gap-3 p-4 bg-green-50 border border-green-200 rounded-xl">
          <CheckCircle2 className="text-green-600 flex-shrink-0 mt-0.5" size={24} />
          <div className="flex-1">
            <p className="text-sm font-semibold text-green-900 mb-2">
              {t('modals.reactivateSubscription.welcome')}
            </p>
            <p className="text-sm text-green-800">{t('modals.reactivateSubscription.description')}</p>
          </div>
        </div>

        <div className="p-4 bg-gray-50 rounded-xl">
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">{t('modals.reactivateSubscription.plan')}</span>
              <span className="font-medium">
                {subscription.type === 'yearly'
                  ? t('modals.reactivateSubscription.yearly')
                  : t('modals.reactivateSubscription.monthly')}{' '}
                {t('modals.reactivateSubscription.planText')}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">{t('modals.reactivateSubscription.amount')}</span>
              <span className="font-medium">
                {formatAmount(subscription.amount, subscription.currency)}
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Sparkles size={14} className="text-blue-500" />
              <span>{t('modals.reactivateSubscription.features')}</span>
            </div>
          </div>
        </div>

        <div className="flex gap-3 pt-4">
          <Button onClick={onClose} variant="outline" className="flex-1 rounded-full">
            {t('modals.common.cancel')}
          </Button>
          <Button
            onClick={onConfirm}
            className="flex-1 bg-sky-500 hover:bg-sky-600 text-white rounded-full"
          >
            {t('modals.reactivateSubscription.reactivateButton')}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

