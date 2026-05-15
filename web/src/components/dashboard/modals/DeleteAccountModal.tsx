import React from 'react';
import { AlertTriangle, Trash2 } from 'lucide-react';
import { useTranslation } from '../../../hooks/useTranslation';
import { Button } from '../../ui/button';
import { Modal } from './Modal';

interface DeleteAccountModalProps {
  show: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export function DeleteAccountModal({
  show,
  onClose,
  onConfirm,
}: DeleteAccountModalProps) {
  const { t } = useTranslation();

  return (
    <Modal
      children={undefined}
      show={show}
      onClose={onClose}
      title={t('modals.deleteAccount.title') || 'Delete Account'}
    >
      <div className="space-y-4">
        <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-xl">
          <AlertTriangle className="text-red-600 flex-shrink-0 mt-0.5" size={24} />
          <div className="flex-1">
            <p className="text-sm font-semibold text-red-900 mb-2">
              {t('modals.deleteAccount.warning') || 'This action cannot be undone'}
            </p>
            <p className="text-sm text-red-800">
              {t('modals.deleteAccount.warningDesc') || 
                'Once you delete your account, there is no going back. All your data, bookings, and services will be permanently deleted. Upcoming appointments will be cancelled and clients will be notified.'}
            </p>
          </div>
        </div>

        <div className="p-4 bg-gray-50 rounded-xl">
          <p className="text-sm text-gray-700">
            {t('modals.deleteAccount.confirmMessage') || 
              'Are you sure you want to delete your account? This action will permanently delete all your data.'}
          </p>
        </div>

        <div className="flex gap-3 pt-4">
          <Button onClick={onClose} variant="outline" className="flex-1 rounded-full">
            {t('modals.deleteAccount.cancel') || 'Cancel'}
          </Button>
          <Button
            onClick={onConfirm}
            className="flex-1 bg-red-600 hover:bg-red-700 text-white rounded-full"
          >
            <Trash2 size={18} className="mr-2" />
            {t('modals.deleteAccount.confirm') || 'Yes, Delete My Account'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

