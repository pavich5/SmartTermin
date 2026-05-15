import React, { useState } from 'react';
import { Trash2, AlertTriangle } from 'lucide-react';
import { useTranslation } from '../../hooks/useTranslation';
import { Button } from '../ui/button';
import { Modal } from '../dashboard/modals/Modal';
import { deactivateAccount } from '../../services/authService';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

export function DeleteAccountSection() {
  const { t } = useTranslation();
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [isDeactivating, setIsDeactivating] = useState(false);

  const handleDeactivate = async () => {
    setIsDeactivating(true);
    try {
      await deactivateAccount();
      toast.success(t('profile.accountDeactivated'), {
        description: t('profile.accountDeactivatedDesc'),
      });

      await logout();
      navigate('/auth');
    } catch (error) {
      console.error('Failed to deactivate account:', error);
      toast.error(t('profile.accountDeactivationFailed'), {
        description: t('profile.accountDeactivationFailedDesc'),
      });
    } finally {
      setIsDeactivating(false);
      setShowConfirmModal(false);
    }
  };

  return (
    <>
      <div className="border-t border-gray-200 pt-6 mt-6">
        <h3 className="text-xl font-semibold mb-4 text-red-600">{t('profile.deleteAccount')}</h3>
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
          <div className="flex items-start gap-3 mb-4">
            <AlertTriangle size={20} className="text-red-600 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm text-red-800 mb-2">{t('profile.deleteAccountWarning')}</p>
              <p className="text-xs text-red-700">{t('profile.deleteAccountWarningDesc')}</p>
            </div>
          </div>
          <Button
            variant="outline"
            onClick={() => setShowConfirmModal(true)}
            className="border-red-300 text-red-600 hover:bg-red-100 rounded-full"
          >
            <Trash2 size={18} className="mr-2" />
            {t('profile.deleteAccountButton')}
          </Button>
        </div>
      </div>

      <Modal
        show={showConfirmModal}
        onClose={() => !isDeactivating && setShowConfirmModal(false)}
        title={t('profile.deleteAccountConfirmTitle')}
      >
        <div className="p-4">
          <div className="flex items-start gap-3 mb-6">
            <AlertTriangle size={24} className="text-red-600 mt-0.5" />
            <div>
              <p className="text-gray-800 mb-2">{t('profile.deleteAccountConfirmMessage')}</p>
              <p className="text-sm text-gray-600">{t('profile.deleteAccountConfirmDesc')}</p>
            </div>
          </div>
          <div className="flex gap-3 justify-end">
            <Button
              variant="outline"
              onClick={() => setShowConfirmModal(false)}
              disabled={isDeactivating}
              className="rounded-full"
            >
              {t('modals.common.cancel')}
            </Button>
            <Button
              onClick={handleDeactivate}
              disabled={isDeactivating}
              className="bg-red-600 hover:bg-red-700 text-white rounded-full"
            >
              {isDeactivating ? t('profile.deactivating') : t('profile.confirmDelete')}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
