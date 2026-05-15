import React from 'react';
import { Lock } from 'lucide-react';
import { useTranslation } from '../../hooks/useTranslation';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';

interface ResetPasswordFormProps {
  newPassword: string;
  confirmPassword: string;
  isLoading: boolean;
  error: string | null;
  onNewPasswordChange: (value: string) => void;
  onConfirmPasswordChange: (value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
}

export function ResetPasswordForm({
  newPassword,
  confirmPassword,
  isLoading,
  error,
  onNewPasswordChange,
  onConfirmPasswordChange,
  onSubmit,
}: ResetPasswordFormProps) {
  const { t } = useTranslation();

  return (
    <div>
      <h2 className="text-3xl mb-2">{t('forgotPassword.reset.title')}</h2>
      <p className="text-gray-600 mb-8">{t('forgotPassword.reset.subtitle')}</p>
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
          {error}
        </div>
      )}
      <form onSubmit={onSubmit} className="space-y-6">
        <div>
          <Label htmlFor="new-password">{t('forgotPassword.reset.newPassword')}</Label>
          <div className="relative mt-2">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <Input
              id="new-password"
              type="password"
              placeholder="••••••••"
              className="pl-12 h-12 rounded-xl"
              value={newPassword}
              onChange={(e) => onNewPasswordChange(e.target.value)}
              required
              minLength={6}
            />
          </div>
        </div>
        <div>
          <Label htmlFor="confirm-password">{t('forgotPassword.reset.confirmPassword')}</Label>
          <div className="relative mt-2">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <Input
              id="confirm-password"
              type="password"
              placeholder="••••••••"
              className="pl-12 h-12 rounded-xl"
              value={confirmPassword}
              onChange={(e) => onConfirmPasswordChange(e.target.value)}
              required
              minLength={6}
            />
          </div>
        </div>
        <Button
          type="submit"
          disabled={isLoading}
          className="w-full bg-sky-500 hover:bg-sky-600 text-white h-12 rounded-xl disabled:opacity-50"
        >
          {isLoading ? t('forgotPassword.reset.resetting') : t('forgotPassword.reset.reset')}
        </Button>
      </form>
    </div>
  );
}
