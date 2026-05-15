import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { useTranslation } from '../../../hooks/useTranslation';
import { Button } from '../../ui/button';
import { Modal } from './Modal';

interface EnterpriseToProModalProps {
  show: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isLoading?: boolean;
}

export function EnterpriseToProModal({
  show,
  onClose,
  onConfirm,
  isLoading = false,
}: EnterpriseToProModalProps) {
  const { t } = useTranslation();

  return (
    <Modal show={show} onClose={onClose} title={t('pricing.modals.enterpriseToPro.title') || 'Switch to Pro'}>
      <div className="space-y-4">
        <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-xl">
          <AlertTriangle className="text-red-600 flex-shrink-0 mt-0.5" size={24} />
          <div className="flex-1">
            <p className="text-sm font-semibold text-red-900 mb-2">
              {t('pricing.modals.enterpriseToPro.warning') || 'Your current Enterprise subscription will be cancelled.'}
            </p>
            <p className="text-sm text-red-800">
              {t('pricing.modals.enterpriseToPro.description') ||
                'To use Pro, you will need to create a new subscription. Enterprise-level features and data will no longer be available.'}
            </p>
          </div>
        </div>

        <div className="p-4 bg-gray-50 rounded-xl">
          <div className="space-y-3">
            <div className="flex items-start gap-2">
              <AlertTriangle className="text-red-600 flex-shrink-0 mt-0.5" size={18} />
              <div>
                <p className="text-sm font-semibold text-gray-900">
                  {t('pricing.modals.enterpriseToPro.salonRemoved') || 'Salon will be removed'}
                </p>
                <p className="text-sm text-gray-600">
                  {t('pricing.modals.enterpriseToPro.salonRemovedDesc') ||
                    'Your salon workspace will be permanently deleted.'}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <AlertTriangle className="text-red-600 flex-shrink-0 mt-0.5" size={18} />
              <div>
                <p className="text-sm font-semibold text-gray-900">
                  {t('pricing.modals.enterpriseToPro.newSubscription') || 'New subscription required'}
                </p>
                <p className="text-sm text-gray-600">
                  {t('pricing.modals.enterpriseToPro.newSubscriptionDesc') ||
                    'You will need to create a new Pro subscription after cancellation.'}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex gap-3 pt-4">
          <Button onClick={onClose} variant="outline" className="flex-1 rounded-full" disabled={isLoading}>
            {t('pricing.modals.cancel') || 'Cancel'}
          </Button>
          <Button
            onClick={onConfirm}
            className="flex-1 bg-red-600 hover:bg-red-700 text-white rounded-full"
            disabled={isLoading}
          >
            {isLoading
              ? t('pricing.modals.processing') || 'Processing...'
              : t('pricing.modals.enterpriseToPro.continue') || 'Continue to Pro'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}







