import React from 'react';
import { format } from 'date-fns';
import { useTranslation } from '../../hooks/useTranslation';
import {
  CheckCircle2,
  XCircle,
  CreditCard,
  X,
  Calendar,
  CreditCard as CardIcon,
  FileText,
} from 'lucide-react';
import { Button } from '../ui/button';
import { getDateLocale } from '../../utils/dateLocale';

interface Payment {
  id: number;
  transactionId: string;
  amount: number;
  currency: string;
  status: 'success' | 'failed';
  date: Date;
  subscriptionType: 'monthly' | 'yearly';
  paymentMethod: string;
  description: string;
}

interface Subscription {
  isActive: boolean;
  type: 'monthly' | 'yearly';
  startDate: Date;
  nextBillingDate: Date;
  amount: number;
  currency: string;
}

interface PaymentsViewProps {
  payments: Payment[];
  subscription: Subscription | null;
  onCancelSubscription: () => void;
  onReactivateSubscription?: () => void;
  onViewInvoice?: (paymentId: number) => void;
  isLoading?: boolean;
}

export function PaymentsView({
  payments,
  subscription,
  onCancelSubscription,
  onReactivateSubscription,
  onViewInvoice,
  isLoading = false,
}: PaymentsViewProps) {
  const { t, language } = useTranslation();
  const dateLocale = getDateLocale(language);

  const formatAmount = (amount: number, currency: string) => {
    return `${currency}${amount.toFixed(2)}`;
  };

  const getStatusBadge = (status: 'success' | 'failed') => {
    if (status === 'success') {
      return (
        <span className="inline-flex items-center px-2 sm:px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-200">
          <CheckCircle2 size={12} className="mr-1" />
          {t('payments.status.success')}
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2 sm:px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 border border-red-200">
        <XCircle size={12} className="mr-1" />
        {t('payments.status.failed')}
      </span>
    );
  };

  if (payments.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
        <CreditCard size={48} className="mx-auto text-gray-400 mb-4" />
        <h3 className="text-xl font-semibold text-gray-900 mb-2">{t('payments.noPayments')}</h3>
        <p className="text-gray-600">{t('payments.noPaymentsDesc')}</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6 w-full">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <h2 className="text-xl sm:text-2xl">{t('payments.title')}</h2>
        {subscription && subscription.isActive && (
          <Button
            onClick={onCancelSubscription}
            disabled={isLoading}
            variant="destructive"
            className="cursor-pointer hover:bg-red-600 hover:text-white disabled:opacity-50"
          >
            <X size={20} />
            <span className="hidden sm:inline">
              {isLoading ? t('payments.canceling') || 'Canceling...' : t('payments.cancelSubscription')}
            </span>
            <span className="sm:hidden">{isLoading ? t('payments.canceling') || 'Canceling...' : t('modals.common.cancel')}</span>
          </Button>
        )}
        {subscription && !subscription.isActive && onReactivateSubscription && (
          <Button
            onClick={onReactivateSubscription}
            variant="default"
            className="cursor-pointer bg-green-600 hover:bg-green-700 text-white"
          >
            <CheckCircle2 size={20} />
            <span className="hidden sm:inline">{t('payments.reactivateSubscription')}</span>
            <span className="sm:hidden">{t('payments.reactivate')}</span>
          </Button>
        )}
      </div>

      {subscription && subscription.isActive && (
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-4 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">{t('payments.activeSubscription')}</p>
              <p className="text-lg font-semibold text-gray-900">
                {subscription.type === 'yearly' ? t('payments.yearly') : t('payments.monthly')}{' '}
                {t('payments.plan')} - {formatAmount(subscription.amount, subscription.currency)}
              </p>
              <p className="text-sm text-gray-600 mt-1">
                {t('payments.nextBilling')}{' '}
                {format(subscription.nextBillingDate, 'MMM d, yyyy', { locale: dateLocale })}
              </p>
            </div>
            <CheckCircle2 className="text-green-600" size={32} />
          </div>
        </div>
      )}

      {subscription && !subscription.isActive && (
        <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-xl p-4 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">{t('payments.canceledSubscription')}</p>
              <p className="text-lg font-semibold text-gray-900">
                {subscription.type === 'yearly' ? t('payments.yearly') : t('payments.monthly')}{' '}
                {t('payments.plan')} - {formatAmount(subscription.amount, subscription.currency)}
              </p>
              <p className="text-sm text-gray-600 mt-1">
                {t('payments.canceledSubscriptionDesc')}
              </p>
            </div>
            <XCircle className="text-yellow-600" size={32} />
          </div>
        </div>
      )}

      <div className="space-y-3">
        {payments.map((payment) => (
          <div
            key={payment.id}
            className={`p-3 rounded-xl border-2 transition-all w-full overflow-hidden ${
              payment.status === 'failed'
                ? 'border-red-200 bg-red-50/30 hover:border-red-300'
                : 'border-gray-100 hover:border-blue-200 bg-white'
            }`}
          >
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="flex-1 min-w-0 w-full">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
                      payment.status === 'success'
                        ? 'bg-gradient-to-br from-green-100 to-emerald-100'
                        : 'bg-gradient-to-br from-red-100 to-red-200'
                    }`}
                  >
                    <CreditCard
                      className={payment.status === 'success' ? 'text-green-600' : 'text-red-600'}
                      size={24}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 sm:gap-3 mb-2 flex-wrap">
                      <h3
                        className={`text-base sm:text-lg font-semibold ${
                          payment.status === 'failed' ? 'text-gray-500' : 'text-gray-900'
                        }`}
                      >
                        {formatAmount(payment.amount, payment.currency)}
                      </h3>
                      {getStatusBadge(payment.status)}
                    </div>

                    <div className="flex items-center gap-4 text-xs sm:text-sm text-gray-600 flex-wrap">
                      <div className="flex items-center gap-1.5">
                        <Calendar size={14} className="text-blue-500 flex-shrink-0" />
                        <span>{format(payment.date, 'MMM d, yyyy', { locale: dateLocale })}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <CardIcon size={14} className="text-blue-500 flex-shrink-0" />
                        <span>{payment.paymentMethod}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex sm:flex-col gap-2 sm:items-end flex-shrink-0">
                <Button
                  onClick={() => onViewInvoice?.(payment.id)}
                  variant="outline"
                  size="sm"
                  className="text-blue-600 border-blue-200 hover:bg-blue-50 hover:border-blue-300 rounded-full"
                >
                  <FileText size={16} className="mr-2" />
                  {t('payments.viewInvoice')}
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
