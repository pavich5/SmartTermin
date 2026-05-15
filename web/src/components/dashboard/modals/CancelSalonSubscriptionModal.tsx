import React from 'react';
import { AlertTriangle, Users, Trash2 } from 'lucide-react';
import { useTranslation } from '../../../hooks/useTranslation';
import { Button } from '../../ui/button';
import { Modal } from './Modal';
import { SalonSubscription } from '../../../types/salon';

interface CancelSalonSubscriptionModalProps {
  show: boolean;
  onClose: () => void;
  subscription: SalonSubscription | null;
  onConfirm: () => void;
  isLoading?: boolean;
}

export function CancelSalonSubscriptionModal({
  show,
  onClose,
  subscription,
  onConfirm,
  isLoading = false,
}: CancelSalonSubscriptionModalProps) {
  const { t } = useTranslation();

  return (
    <Modal show={show} onClose={onClose} title={t('modals.cancelSalonSubscription.title') || 'Cancel Salon Subscription'}>
      <div className="space-y-4">
        <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-xl">
          <AlertTriangle className="text-red-600 flex-shrink-0 mt-0.5" size={24} />
          <div className="flex-1">
            <p className="text-sm font-semibold text-red-900 mb-2">
              {t('modals.cancelSalonSubscription.warning') || 'Are you sure you want to cancel?'}
            </p>
            <p className="text-sm text-red-800">
              {t('modals.cancelSalonSubscription.warningDesc') ||
                'This action cannot be undone. Your salon will be permanently removed.'}
            </p>
          </div>
        </div>

        <div className="space-y-3 p-4 bg-gray-50 rounded-xl">
          <div className="flex items-start gap-3">
            <Trash2 className="text-red-600 flex-shrink-0 mt-0.5" size={20} />
            <div>
              <p className="text-sm font-semibold text-gray-900 mb-1">
                {t('modals.cancelSalonSubscription.salonRemoved') || 'Salon will be removed'}
              </p>
              <p className="text-sm text-gray-600">
                {t('modals.cancelSalonSubscription.salonRemovedDesc') ||
                  'Your salon workspace will be permanently deleted and cannot be recovered.'}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <Users className="text-blue-600 flex-shrink-0 mt-0.5" size={20} />
            <div>
              <p className="text-sm font-semibold text-gray-900 mb-1">
                {t('modals.cancelSalonSubscription.artistsTransferred') ||
                  'All artists will be transferred to Free plan'}
              </p>
              <p className="text-sm text-gray-600">
                {t('modals.cancelSalonSubscription.artistsTransferredDesc') ||
                  'All artists in your salon will be moved to individual Free plans. They will lose access to salon features but can continue using their personal accounts.'}
              </p>
            </div>
          </div>

          {subscription && (
            <div className="pt-3 border-t border-gray-200">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">
                  {t('modals.cancelSalonSubscription.currentArtists') || 'Current artists:'}
                </span>
                <span className="font-semibold text-gray-900">{subscription.artistCount || 0}</span>
              </div>
            </div>
          )}
        </div>

        <div className="flex gap-3 pt-4">
          <Button onClick={onClose} variant="outline" className="flex-1 rounded-full" disabled={isLoading}>
            {t('modals.cancelSalonSubscription.keepSubscription') || 'Keep Subscription'}
          </Button>
          <Button
            onClick={onConfirm}
            className="flex-1 bg-red-600 hover:bg-red-700 text-white rounded-full"
            disabled={isLoading}
          >
            {isLoading
              ? t('modals.cancelSalonSubscription.cancelling') || 'Cancelling...'
              : t('modals.cancelSalonSubscription.cancelButton') || 'Cancel Subscription'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}


