import React, { useState } from 'react';
import { AlertTriangle, RotateCcw, UserPlus } from 'lucide-react';
import { Modal } from '../dashboard/modals/Modal';
import { Button } from '../ui/button';
import { useTranslation } from '../../hooks/useTranslation';

interface DeactivatedAccountModalProps {
  show: boolean;
  userId: string;
  onReactivate: () => void;
  onCreateNew: () => void;
  isProcessing: boolean;
}

export function DeactivatedAccountModal({
  show,
  userId,
  onReactivate,
  onCreateNew,
  isProcessing,
}: DeactivatedAccountModalProps) {
  const { t } = useTranslation();

  return (
    <Modal show={show} onClose={() => {}} title={t('auth.deactivatedAccount.title')}>
      <div className="p-6">
        <div className="flex items-start gap-3 mb-6">
          <AlertTriangle size={24} className="text-orange-600 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-gray-800 mb-2 font-medium">{t('auth.deactivatedAccount.message')}</p>
            <p className="text-sm text-gray-600">{t('auth.deactivatedAccount.description')}</p>
          </div>
        </div>

        <div className="space-y-3 mt-6">
          <Button
            onClick={onReactivate}
            disabled={isProcessing}
            className="w-full !bg-sky-500 hover:!bg-sky-600 !text-white rounded-full py-3 text-base font-medium flex items-center justify-center"
          >
            <RotateCcw size={18} className="mr-2" />
            {t('auth.deactivatedAccount.reactivate')}
          </Button>

          <Button
            onClick={onCreateNew}
            disabled={isProcessing}
            variant="outline"
            className="w-full rounded-full py-3 text-base font-medium !border-2 flex items-center justify-center"
          >
            <UserPlus size={18} className="mr-2" />
            {t('auth.deactivatedAccount.createNew')}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
