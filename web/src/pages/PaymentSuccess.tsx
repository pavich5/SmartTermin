import React, { useEffect, useState } from 'react';
import { CheckCircle, Mail } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '../hooks/useTranslation';
import { PaymentStatusCard } from '../components/payment/PaymentStatusCard';

export function PaymentSuccess() {
  const { t } = useTranslation();
  const [showContent, setShowContent] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const error = urlParams.get('error');
    const status = urlParams.get('status');

    if (error || status === 'failed') {
      navigate('/payment/failure', { replace: true });
      return;
    }

    const timer = setTimeout(() => {
      setShowContent(true);
    }, 300);
    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <PaymentStatusCard
      icon={CheckCircle}
      iconColor="bg-green-500"
      title={t('payment.success.title')}
      description={t('payment.success.desc')}
      showContent={showContent}
      primaryButtonText={t('payment.success.goToDashboard')}
      secondaryButtonText={t('payment.success.backToHome')}
      onPrimaryAction={() => navigate('/dashboard')}
      onSecondaryAction={() => navigate('/')}
    >
      <div className="flex items-center justify-center gap-3 mt-8 p-4 bg-blue-50 rounded-2xl">
        <Mail className="text-blue-600" size={24} />
        <div className="text-left">
          <p className="font-semibold text-blue-900">{t('payment.success.emailSent')}</p>
          <p className="text-sm text-sky-600">{t('payment.success.emailDesc')}</p>
        </div>
      </div>
    </PaymentStatusCard>
  );
}
