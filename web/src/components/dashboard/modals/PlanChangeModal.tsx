import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { useTranslation } from '../../../hooks/useTranslation';
import { Button } from '../../ui/button';
import { Modal } from './Modal';

type PlanType = 'free' | 'pro' | 'enterprise';
type ChangeType = 'upgrade' | 'downgrade';

interface PlanChangeModalProps {
  show: boolean;
  onClose: () => void;
  changeType: ChangeType;
  fromPlan: PlanType;
  toPlan: PlanType;
  onConfirm: () => void;
  isLoading?: boolean;
}

export function PlanChangeModal({
  show,
  onClose,
  changeType,
  fromPlan,
  toPlan,
  onConfirm,
  isLoading = false,
}: PlanChangeModalProps) {
  const { t } = useTranslation();

  const getTitle = () => {
    return changeType === 'upgrade' 
      ? t('pricing.modals.upgrade.title') || 'Upgrade Plan'
      : t('pricing.modals.downgrade.title') || 'Downgrade Plan';
  };

  const getMessage = () => {
    if (changeType === 'upgrade') {
      if (toPlan === 'pro') {
        return t('pricing.modals.upgrade.toPro') || 'Are you sure you want to upgrade to Pro? You\'ll gain access to unlimited services, portfolio images, bookings, and advanced analytics.';
      } else if (toPlan === 'enterprise') {
        return t('pricing.modals.upgrade.toEnterprise') || 'Are you sure you want to upgrade to Enterprise? You\'ll gain access to team management, salon analytics, and combined calendars.';
      }
    } else {
      if (toPlan === 'free') {
        if (fromPlan === 'enterprise') {
          return t('pricing.modals.downgrade.enterpriseToFree') || 'Are you sure you want to downgrade to Free? Some Enterprise features will be removed.';
        } else {
          return t('pricing.modals.downgrade.proToFree') || 'Are you sure you want to downgrade? You\'ll move to the Free plan and lose Pro features.';
        }
      } else if (toPlan === 'pro') {
        return t('pricing.modals.downgrade.enterpriseToPro') || 'Are you sure you want to downgrade to Pro? Enterprise-level features will be removed.';
      }
    }
    return '';
  };

  const getPlanName = (plan: PlanType) => {
    switch (plan) {
      case 'free':
        return t('pricing.free.name') || 'Free';
      case 'pro':
        return t('pricing.proPlan') || 'Pro';
      case 'enterprise':
        return t('pricing.enterprise.name') || 'Enterprise';
    }
  };

  return (
    <Modal show={show} onClose={onClose} title={getTitle()}>
      <div className="space-y-4">
        <div className="flex items-start gap-3 p-4 bg-yellow-50 border border-yellow-200 rounded-xl">
          <AlertTriangle className="text-yellow-600 flex-shrink-0 mt-0.5" size={24} />
          <div className="flex-1">
            <p className="text-sm text-yellow-800">{getMessage()}</p>
          </div>
        </div>

        <div className="p-4 bg-gray-50 rounded-xl">
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-600">{t('pricing.modals.currentPlan') || 'Current Plan:'}</span>
              <span className="font-medium">{getPlanName(fromPlan)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">{t('pricing.modals.newPlan') || 'New Plan:'}</span>
              <span className="font-medium">{getPlanName(toPlan)}</span>
            </div>
          </div>
        </div>

        <div className="flex gap-3 pt-4">
          <Button onClick={onClose} variant="outline" className="flex-1 rounded-full" disabled={isLoading}>
            {t('pricing.modals.cancel') || 'Cancel'}
          </Button>
          <Button
            onClick={onConfirm}
            className={`flex-1 rounded-full ${
              changeType === 'upgrade'
                ? 'bg-sky-500 hover:bg-sky-600 text-white'
                : 'bg-red-600 hover:bg-red-700 text-white'
            }`}
            disabled={isLoading}
          >
            {isLoading
              ? t('pricing.modals.processing') || 'Processing...'
              : changeType === 'upgrade'
              ? t('pricing.modals.confirmUpgrade') || 'Confirm Upgrade'
              : t('pricing.modals.confirmDowngrade') || 'Confirm Downgrade'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}







