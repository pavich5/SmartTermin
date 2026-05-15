import React from 'react';
import { Sparkles } from 'lucide-react';
import { useTranslation } from '../../../hooks/useTranslation';
import { Button } from '../../ui/button';
import { Modal } from './Modal';

type PlanType = 'pro' | 'enterprise';

interface TrialStartModalProps {
  show: boolean;
  onClose: () => void;
  plan: PlanType;
  onConfirm: () => void;
  isLoading?: boolean;
}

export function TrialStartModal({
  show,
  onClose,
  plan,
  onConfirm,
  isLoading = false,
}: TrialStartModalProps) {
  const { t } = useTranslation();

  const getPlanName = () => {
    return plan === 'pro'
      ? t('pricing.proPlan') || 'Pro'
      : t('pricing.enterprise.name') || 'Enterprise';
  };

  return (
    <Modal show={show} onClose={onClose} title={t('pricing.modals.trialStart.title') || 'Start Free Trial'}>
      <div className="space-y-4">
        <div className="flex items-start gap-3 p-4 bg-blue-50 border border-sky-200 rounded-xl">
          <Sparkles className="text-sky-600 flex-shrink-0 mt-0.5" size={24} />
          <div className="flex-1">
            <p className="text-sm font-semibold text-sky-900 mb-2">
              {t('pricing.modals.trialStart.welcome')?.replace('{plan}', getPlanName()) || `You're about to start your free trial of the ${getPlanName()} plan.`}
            </p>
            <p className="text-sm text-sky-800">
              {t('pricing.modals.trialStart.description') ||
                'Your trial includes all features and will not charge you now. After the trial ends, you may continue with a paid subscription.'}
            </p>
          </div>
        </div>

        <div className="p-4 bg-gray-50 rounded-xl">
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-600">{t('pricing.modals.trialStart.plan') || 'Plan:'}</span>
              <span className="font-medium">{getPlanName()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">{t('pricing.modals.trialStart.duration') || 'Trial Duration:'}</span>
              <span className="font-medium">{t('pricing.modals.trialStart.durationValue') || '1 month'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">{t('pricing.modals.trialStart.cost') || 'Cost:'}</span>
              <span className="font-medium text-green-600">{t('pricing.modals.trialStart.free') || 'Free'}</span>
            </div>
          </div>
        </div>

        <div className="flex gap-3 pt-4">
          <Button onClick={onClose} variant="outline" className="flex-1 rounded-full" disabled={isLoading}>
            {t('pricing.modals.cancel') || 'Cancel'}
          </Button>
          <Button
            onClick={onConfirm}
            className="flex-1 bg-sky-500 hover:bg-sky-600 text-white rounded-full"
            disabled={isLoading}
          >
            {isLoading
              ? t('pricing.modals.processing') || 'Processing...'
              : t('pricing.modals.trialStart.startTrial') || 'Start Trial'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

