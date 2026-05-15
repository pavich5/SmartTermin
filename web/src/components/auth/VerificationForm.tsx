import React from 'react';
import { Phone } from 'lucide-react';
import { useTranslation } from '../../hooks/useTranslation';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';

interface VerificationFormProps {
  phoneNumber: string;
  verificationCode: string;
  isLoading: boolean;
  error: string | null;
  onCodeChange: (value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  onResendCode: () => void;
}

export function VerificationForm({
  phoneNumber,
  verificationCode,
  isLoading,
  error,
  onCodeChange,
  onSubmit,
  onResendCode,
}: VerificationFormProps) {
  const { t } = useTranslation();

  return (
    <div className="text-center">
      <div className="w-16 h-16 bg-sky-500 rounded-full flex items-center justify-center mx-auto mb-6">
        <Phone className="text-white" size={32} />
      </div>
      <h2 className="text-3xl mb-2">{t('auth.verification.title')}</h2>
      <p className="text-gray-600 mb-2">{t('auth.verification.subtitle')}</p>
      <p className="text-blue-600 mb-8">{phoneNumber || '+389 70 123 456'}</p>
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
          {error}
        </div>
      )}
      <form onSubmit={onSubmit} className="space-y-6">
        <div>
          <Label htmlFor="code">{t('auth.verification.code')}</Label>
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
          {isLoading ? t('auth.verification.verifying') : t('auth.verification.verify')}
        </Button>
        <button
          type="button"
          onClick={onResendCode}
          className="text-sm text-blue-600 hover:text-sky-600"
        >
          {t('auth.verification.resendCode')}
        </button>
      </form>
    </div>
  );
}
