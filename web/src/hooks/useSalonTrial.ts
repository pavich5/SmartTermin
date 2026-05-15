import { useEffect } from 'react';
import { toast } from 'sonner';
import { useSalon } from '../contexts/SalonContext';
import { useTranslation } from './useTranslation';

export function useSalonTrial() {
  const { salon } = useSalon();
  const { t } = useTranslation();
  const subscription = salon?.subscription;

  useEffect(() => {
    if (!subscription || subscription.status !== 'trial') return;
    if (!subscription.trialEndsAt) return;

    const trialEndsAt = new Date(subscription.trialEndsAt);
    const now = new Date();
    const daysRemaining = Math.ceil(
      (trialEndsAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (daysRemaining === 7 || daysRemaining === 3 || daysRemaining === 1) {
      toast.warning(t('toast.trialEndingSoon'), {
        description: t('toast.trialEndingSoonDesc', { days: daysRemaining }),
        duration: 10000,
        action: {
          label: t('dashboard.freeTrial.subscribeNow'),
          onClick: () => (window.location.href = '/enterprise'),
        },
      });
    }

    if (daysRemaining === 0) {
      toast.error(t('toast.trialEndsToday'), {
        description: t('toast.trialEndsTodayDesc'),
        duration: 15000,
        action: {
          label: t('dashboard.freeTrial.subscribeNow'),
          onClick: () => (window.location.href = '/enterprise'),
        },
      });
    }
  }, [subscription]);
}
