import React from 'react';
import { useTranslation } from '../../hooks/useTranslation';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';

interface CodeStepFormProps {
  phone: string;
  verificationCode: string;
  isLoading: boolean;
  error: string | null;
  onCodeChange: (value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  onBack: () => void;
  title?: string;
  subtitle?: string;
  verifyText?: string;
  verifyingText?: string;
  resendText?: string;
}

export function CodeStepForm({
  phone,
  verificationCode,
  isLoading,
  error,
  onCodeChange,
  onSubmit,
  onBack,
  title,
  subtitle,
  verifyText,
  verifyingText,
  resendText,
}: CodeStepFormProps) {
  const { t } = useTranslation();

  return (
    <div>
      <h2 className="text-3xl mb-2">{title || t('forgotPassword.code.title')}</h2>
      <p className="text-gray-600 mb-2">{subtitle || t('forgotPassword.code.subtitle')}</p>
      <p className="text-blue-600 mb-8">{phone || t('forgotPassword.code.yourPhone')}</p>
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
          {error}
        </div>
      )}
      <form onSubmit={onSubmit} className="space-y-6">
        <div>
          <Label htmlFor="code">{t('forgotPassword.code.code')}</Label>
          <Input
            id="code"
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            placeholder="000000"
            className="mt-2 h-12 rounded-xl text-center text-2xl tracking-widest"
            maxLength={6}
            value={verificationCode}
            onChange={(e) => onCodeChange(e.target.value.replace(/\D/g, ''))}
            required
          />
        </div>
        <Button
          type="submit"
          disabled={isLoading}
          className="w-full bg-sky-500 hover:bg-sky-600 text-white h-12 rounded-xl disabled:opacity-50"
        >
          {isLoading
            ? verifyingText || t('forgotPassword.code.verifying')
            : verifyText || t('forgotPassword.code.verify')}
        </Button>
        <button
          type="button"
          onClick={onBack}
          className="w-full text-sm text-blue-600 hover:text-sky-600"
        >
          {resendText || t('forgotPassword.code.resend')}
        </button>
      </form>
    </div>
  );
}
