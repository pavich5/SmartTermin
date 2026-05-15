import React from 'react';
import { Phone } from 'lucide-react';
import { useTranslation } from '../../hooks/useTranslation';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { formatPhoneNumberDisplay } from '../../utils/phoneNumber';

interface PhoneStepFormProps {
  phone: string;
  isLoading: boolean;
  error: string | null;
  onPhoneChange: (value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  title?: string;
  subtitle?: string;
  buttonText?: string;
  sendingText?: string;
}

export function PhoneStepForm({
  phone,
  isLoading,
  error,
  onPhoneChange,
  onSubmit,
  title,
  subtitle,
  buttonText,
  sendingText,
}: PhoneStepFormProps) {
  const { t } = useTranslation();

  return (
    <div>
      <h2 className="text-3xl mb-2">{title || t('forgotPassword.phone.title')}</h2>
      <p className="text-gray-600 mb-8">{subtitle || t('forgotPassword.phone.subtitle')}</p>
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
          {error}
        </div>
      )}
      <form onSubmit={onSubmit} className="space-y-6">
        <div>
          <Label htmlFor="phone">{t('forgotPassword.phone.phoneNumber')}</Label>
          <div className="relative mt-2">
            <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <Input
              id="phone"
              type="tel"
              placeholder="+389 70 123 456"
              className="pl-12 h-12 rounded-xl"
              value={formatPhoneNumberDisplay(phone)}
              onChange={(e) => onPhoneChange(e.target.value)}
              onKeyDown={(e) => {
                const input = e.currentTarget;
                const cursorPosition = input.selectionStart || 0;
                const selectionEnd = input.selectionEnd || 0;

                if (e.key === 'Backspace' && cursorPosition > 0 && cursorPosition <= 5) {
                  if (selectionEnd <= 5) {
                    e.preventDefault();
                  }
                } else if (e.key === 'Delete' && cursorPosition < 5) {
                  e.preventDefault();
                }
              }}
              required
            />
          </div>
        </div>
        <Button
          type="submit"
          disabled={isLoading || !phone}
          className="w-full bg-sky-500 hover:bg-sky-600 text-white h-12 rounded-xl disabled:opacity-50"
        >
          {isLoading
            ? sendingText || t('forgotPassword.phone.sending')
            : buttonText || t('forgotPassword.phone.sendCode')}
        </Button>
      </form>
    </div>
  );
}
