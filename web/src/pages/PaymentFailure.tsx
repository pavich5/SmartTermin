import React, { useEffect, useState } from 'react';
import { XCircle, RefreshCw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '../hooks/useTranslation';
import { PaymentStatusCard } from '../components/payment/PaymentStatusCard';

export function PaymentFailure() {
  const { t } = useTranslation();
  const [showContent, setShowContent] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const error = urlParams.get('error');
    const errorDetail = urlParams.get('error_detail');

    if (error) {
      setErrorMessage(error);
    } else if (errorDetail) {
      setErrorMessage(errorDetail);
    } else {
      setErrorMessage(t('payment.failure.defaultError'));
    }

    const timer = setTimeout(() => {
      setShowContent(true);
    }, 300);
    return () => clearTimeout(timer);
  }, []);

  return (
    <PaymentStatusCard
      icon={XCircle}
      iconColor="bg-red-500"
      title={t('payment.failure.title')}
      description={t('payment.failure.desc')}
      showContent={showContent}
      errorMessage={errorMessage}
      primaryButtonText={
        <>
          <RefreshCw size={20} />
          {t('payment.failure.tryAgain')}
        </>
      }
      secondaryButtonText={t('payment.failure.backToHome')}
      onPrimaryAction={() => navigate('/pricing')}
      onSecondaryAction={() => navigate('/')}
    />
  );
}
