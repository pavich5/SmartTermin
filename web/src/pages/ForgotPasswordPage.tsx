import React from 'react';
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { useTranslation } from '../hooks/useTranslation';
import { ForgotPasswordPromoPanel } from '../components/forgot-password/ForgotPasswordPromoPanel';
import { PhoneStepForm } from '../components/forgot-password/PhoneStepForm';
import { CodeStepForm } from '../components/forgot-password/CodeStepForm';
import { ResetPasswordForm } from '../components/forgot-password/ResetPasswordForm';
import { requestPasswordReset, verifyResetCode, resetPassword } from '../services/authService';
import { handlePhoneNumberChange, isValidMacedonianPhoneNumber } from '../utils/phoneNumber';
import { PageContainer } from '../components/ui/PageContainer';

export function ForgotPasswordPage() {
  const { t } = useTranslation();
  const [step, setStep] = useState<'phone' | 'code' | 'reset'>('phone');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const [phone, setPhone] = useState('+389');
  const [verificationCode, setVerificationCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [resetToken, setResetToken] = useState('');

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
      await requestPasswordReset(phone);
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
      const res = await verifyResetCode(phone, verificationCode);
      setResetToken(res.resetToken);
      setStep('reset');
    } catch (err) {
      const message = err instanceof Error ? err.message : t('auth.errors.invalidCode');
      setError(message || t('auth.errors.invalidCode'));
      console.error('Error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!newPassword || !confirmPassword) {
      setError(t('auth.errors.fillAllFields'));
      return;
    }

    if (newPassword !== confirmPassword) {
      setError(t('auth.errors.passwordsDontMatch'));
      return;
    }

    if (newPassword.length < 6) {
      setError(t('auth.errors.passwordTooShort'));
      return;
    }

    setIsLoading(true);
    try {
      await resetPassword(phone, resetToken, newPassword);
      toast.success(t('toast.passwordResetSuccess'), {
        description: t('toast.passwordResetSuccessDesc'),
        duration: 3000,
      });
      navigate('/auth');
    } catch (err) {
      const message = err instanceof Error ? err.message : t('forgotPassword.errors.resetFailed');
      setError(message || t('forgotPassword.errors.resetFailed'));
      console.error('Error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-blue-50 py-12 flex items-center">
      <PageContainer maxWidth="6xl" className="w-full">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <ForgotPasswordPromoPanel step={step} />

          <div className="bg-white rounded-3xl shadow-2xl p-8 md:p-12">
            <Link
              to="/auth"
              className="inline-flex items-center gap-2 text-gray-600 hover:text-blue-600 mb-6 transition-colors"
            >
              <ArrowLeft size={18} />
              <span>{t('forgotPassword.backToLogin')}</span>
            </Link>

            {step === 'phone' && (
              <PhoneStepForm
                phone={phone}
                isLoading={isLoading}
                error={error}
                onPhoneChange={(value) => handlePhoneNumberChange(phone, value, setPhone)}
                onSubmit={handlePhoneSubmit}
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
                onBack={() => setStep('phone')}
              />
            )}

            {step === 'reset' && (
              <ResetPasswordForm
                newPassword={newPassword}
                confirmPassword={confirmPassword}
                isLoading={isLoading}
                error={error}
                onNewPasswordChange={setNewPassword}
                onConfirmPasswordChange={setConfirmPassword}
                onSubmit={handleResetPassword}
              />
            )}
          </div>
        </div>
      </PageContainer>
    </div>
  );
}
