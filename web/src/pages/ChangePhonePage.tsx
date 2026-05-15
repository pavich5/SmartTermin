import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { useTranslation } from '../hooks/useTranslation';
import { PhoneStepForm } from '../components/forgot-password/PhoneStepForm';
import { CodeStepForm } from '../components/forgot-password/CodeStepForm';
import { handlePhoneNumberChange, isValidMacedonianPhoneNumber } from '../utils/phoneNumber';
import { requestPhoneChange, verifyPhoneChange } from '../services/authService';
import { useAuth } from '../contexts/AuthContext';
import { PageContainer } from '../components/ui/PageContainer';

export function ChangePhonePage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { refreshUser } = useAuth();
  const [step, setStep] = useState<'phone' | 'code'>('phone');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [phone, setPhone] = useState('+389');
  const [verificationCode, setVerificationCode] = useState('');

  const handlePhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!phone) {
      setError(t('forgotPassword.errors.phoneRequired'));
      return;
    }

    if (!isValidMacedonianPhoneNumber(phone)) {
      setError(t('auth.errors.invalidPhoneNumber'));
      return;
    }

    setIsLoading(true);
    try {
      await requestPhoneChange(phone);
      toast.success(t('toast.verificationCodeSent'), {
        description: t('toast.verificationCodeSentDesc'),
        duration: 3000,
      });
      setStep('code');
    } catch (err) {
      const message =
        err instanceof Error ? err.message : t('forgotPassword.errors.sendCodeFailed');
      setError(message || t('forgotPassword.errors.sendCodeFailed'));
      console.error('Error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!verificationCode || verificationCode.length !== 6) {
      setError(t('auth.errors.codeRequired'));
      return;
    }

    setIsLoading(true);
    try {
      await verifyPhoneChange(phone, verificationCode);
      await refreshUser();
      toast.success(t('settings.profile.phoneUpdated') || 'Phone number updated successfully', {
        description:
          t('settings.profile.phoneUpdatedDesc') || 'Your phone number has been updated.',
        duration: 3000,
      });
      navigate('/dashboard');
    } catch (err) {
      let message = t('auth.errors.invalidCode');

      if (err instanceof Error) {
        const errorMsg = err.message.toLowerCase();

        if (errorMsg.includes('invalid verification code') || errorMsg.includes('invalid code')) {
          message = t('auth.errors.invalidCode');
        } else if (errorMsg.includes('expired')) {
          message =
            t('auth.errors.codeExpired') ||
            'Verification code has expired. Please request a new one.';
        } else if (errorMsg.includes('not found')) {
          message = t('auth.errors.userNotFound') || 'User not found';
        } else if (errorMsg.includes('already in use')) {
          message = err.message;
        } else if (!errorMsg.includes('request failed with status')) {
          message = err.message;
        }
      }

      setError(message);
      console.error('Error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendCode = async () => {
    setError(null);
    setVerificationCode('');
    if (!phone) return;
    try {
      await requestPhoneChange(phone);
      toast.success(t('toast.verificationCodeSent'), {
        description: t('toast.verificationCodeSentDesc'),
        duration: 3000,
      });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : t('forgotPassword.errors.sendCodeFailed');
      setError(message || t('forgotPassword.errors.sendCodeFailed'));
    }
  };

  return (
    <div className="min-h-screen bg-blue-50 py-12">
      <PageContainer maxWidth="2xl">
        <div className="bg-white rounded-3xl shadow-2xl p-8 md:p-12">
          <button
            onClick={() => navigate('/dashboard')}
            className="inline-flex items-center gap-2 text-gray-600 hover:text-blue-600 mb-6 transition-colors"
          >
            <ArrowLeft size={18} />
            <span>{t('settings.profile.backToSettings') || 'Back to Settings'}</span>
          </button>

          {step === 'phone' && (
            <PhoneStepForm
              phone={phone}
              isLoading={isLoading}
              error={error}
              onPhoneChange={(value) => handlePhoneNumberChange(phone, value, setPhone)}
              onSubmit={handlePhoneSubmit}
              title={t('settings.profile.changePhone.title')}
              subtitle={t('settings.profile.changePhone.subtitle')}
              buttonText={t('settings.profile.changePhone.sendCode')}
              sendingText={t('settings.profile.changePhone.sending')}
            />
          )}

          {step === 'code' && (
            <CodeStepForm
              phone={phone}
              verificationCode={verificationCode}
              isLoading={isLoading}
              error={error}
              onCodeChange={setVerificationCode}
              onSubmit={handleCodeSubmit}
              onBack={handleResendCode}
              title={t('settings.profile.changePhone.codeTitle')}
              subtitle={t('settings.profile.changePhone.codeSubtitle')}
              verifyText={t('settings.profile.changePhone.verify')}
              verifyingText={t('settings.profile.changePhone.verifying')}
              resendText={t('settings.profile.changePhone.resend')}
            />
          )}
        </div>
      </PageContainer>
    </div>
  );
}
