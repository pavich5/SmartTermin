import React from 'react';
import { Link } from 'react-router-dom';
import { Lock, Phone } from 'lucide-react';
import { useTranslation } from '../../hooks/useTranslation';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { formatPhoneNumberDisplay } from '../../utils/phoneNumber';

interface LoginFormProps {
  loginPhone: string;
  loginPassword: string;
  isLoading: boolean;
  error: string | null;
  onPhoneChange: (value: string) => void;
  onPasswordChange: (value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  onSwitchToSignup: () => void;
}

export function LoginForm({
  loginPhone,
  loginPassword,
  isLoading,
  error,
  onPhoneChange,
  onPasswordChange,
  onSubmit,
  onSwitchToSignup,
}: LoginFormProps) {
  const { t } = useTranslation();

  return (
    <div>
      <h2 className="text-3xl mb-2">{t('auth.login.title')}</h2>
      <p className="text-gray-600 mb-8">{t('auth.login.subtitle')}</p>
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
          {error}
        </div>
      )}
      <form onSubmit={onSubmit} className="space-y-6">
        <div>
          <Label htmlFor="login-phone">{t('auth.login.phoneNumber')}</Label>
          <div className="relative mt-2">
            <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <Input
              id="login-phone"
              type="tel"
              placeholder="+389 70 123 456"
              className="pl-12 h-12 rounded-xl"
              value={formatPhoneNumberDisplay(loginPhone)}
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
        <div>
          <Label htmlFor="login-password">{t('auth.login.password')}</Label>
          <div className="relative mt-2">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <Input
              id="login-password"
              type="password"
              placeholder="••••••••"
              className="pl-12 h-12 rounded-xl"
              value={loginPassword}
              onChange={(e) => onPasswordChange(e.target.value)}
              required
            />
          </div>
        </div>
        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2">
            <input type="checkbox" className="w-4 h-4 rounded border-gray-300" />
            <span className="text-sm text-gray-600">{t('auth.login.rememberMe')}</span>
          </label>
          <Link to="/forgot-password" className="text-sm text-blue-600 hover:text-sky-600">
            {t('auth.login.forgotPassword')}
          </Link>
        </div>
        <Button
          type="submit"
          disabled={isLoading}
          className="w-full bg-sky-500 hover:bg-sky-600 text-white h-12 rounded-xl disabled:opacity-50"
        >
          {isLoading ? t('auth.login.signingIn') : t('auth.login.signIn')}
        </Button>
      </form>
      <div className="mt-6 text-center">
        <span className="text-gray-600">{t('auth.login.noAccount')} </span>
        <button onClick={onSwitchToSignup} className="text-blue-600 hover:text-sky-600">
          {t('auth.login.createAccount')}
        </button>
      </div>
    </div>
  );
}
