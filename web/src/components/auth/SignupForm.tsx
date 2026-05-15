import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Lock, Phone, Mail } from 'lucide-react';
import { useTranslation } from '../../hooks/useTranslation';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { formatPhoneNumberDisplay } from '../../utils/phoneNumber';

interface SignupFormProps {
  signupName: string;
  signupPhone: string;
  signupEmail: string;
  signupPassword: string;
  signupConfirmPassword: string;
  signupDateOfBirth?: string;
  userType: 'artist' | 'client';
  agreedToTerms: boolean;
  isLoading: boolean;
  error: string | null;
  userTypeLocked?: boolean;
  onNameChange: (value: string) => void;
  onPhoneChange: (value: string) => void;
  onEmailChange: (value: string) => void;
  onPasswordChange: (value: string) => void;
  onConfirmPasswordChange: (value: string) => void;
  onDateOfBirthChange: (value: string) => void;
  onUserTypeChange: (type: 'artist' | 'client') => void;
  onAgreedToTermsChange: (value: boolean) => void;
  onSubmit: (e: React.FormEvent) => void;
  onSwitchToLogin: () => void;
}

export function SignupForm({
  signupName,
  signupPhone,
  signupEmail,
  signupPassword,
  signupConfirmPassword,
  signupDateOfBirth,
  userType,
  agreedToTerms,
  isLoading,
  error,
  userTypeLocked = false,
  onNameChange,
  onPhoneChange,
  onEmailChange,
  onPasswordChange,
  onConfirmPasswordChange,
  onDateOfBirthChange,
  onUserTypeChange,
  onAgreedToTermsChange,
  onSubmit,
  onSwitchToLogin,
}: SignupFormProps) {
  const { t } = useTranslation();
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [confirmPasswordError, setConfirmPasswordError] = useState<string | null>(null);

  useEffect(() => {
    if (signupPassword.length > 0) {
      if (signupPassword.length < 6) {
        setPasswordError(t('auth.errors.passwordTooShort'));
      } else {
        setPasswordError(null);
      }
    } else {
      setPasswordError(null);
    }
  }, [signupPassword, t]);

  useEffect(() => {
    if (signupConfirmPassword.length > 0) {
      if (signupPassword.length > 0 && signupPassword !== signupConfirmPassword) {
        setConfirmPasswordError(t('auth.errors.passwordsDontMatch'));
      } else {
        setConfirmPasswordError(null);
      }
    } else {
      setConfirmPasswordError(null);
    }
  }, [signupPassword, signupConfirmPassword, t]);

  const passwordErrorKeys = [
    t('auth.errors.passwordTooShort'),
    t('auth.errors.passwordsDontMatch'),
  ];
  const displayError =
    error && !passwordErrorKeys.some((key) => error.includes(key)) ? error : null;

  return (
    <div>
      <h2 className="text-3xl mb-2">{t('auth.signup.title')}</h2>
      <p className="text-gray-600 mb-8">{t('auth.signup.subtitle')}</p>
      {displayError && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
          {displayError}
        </div>
      )}
      <form onSubmit={onSubmit} className="space-y-6">
        <div>
          <Label htmlFor="signup-name">{t('auth.signup.fullName')}</Label>
          <Input
            id="signup-name"
            type="text"
            placeholder={t('auth.signup.fullNamePlaceholder')}
            className="mt-2 h-12 rounded-xl"
            value={signupName}
            onChange={(e) => onNameChange(e.target.value)}
            maxLength={50}
            required
          />
        </div>
        <div>
          <Label htmlFor="signup-phone">{t('auth.signup.phoneNumber')}</Label>
          <div className="relative mt-2">
            <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <Input
              id="signup-phone"
              type="tel"
              placeholder="+389 70 123 456"
              className="pl-12 h-12 rounded-xl"
              value={formatPhoneNumberDisplay(signupPhone)}
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
          <Label htmlFor="signup-email">{t('auth.signup.email')}</Label>
          <div className="relative mt-2">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <Input
              id="signup-email"
              type="email"
              placeholder={t('auth.signup.emailPlaceholder')}
              className="pl-12 h-12 rounded-xl"
              value={signupEmail}
              onChange={(e) => onEmailChange(e.target.value)}
              required
            />
          </div>
        </div>
        <div>
          <Label>{t('auth.signup.iAmA')}</Label>
          <div className="grid grid-cols-2 gap-4 mt-2">
            <button
              type="button"
              onClick={() => !userTypeLocked && onUserTypeChange('client')}
              disabled={userTypeLocked}
              className={`p-4 border-2 rounded-xl transition-all ${
                userType === 'client'
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-blue-200 hover:border-blue-500 hover:bg-blue-50'
              } ${userTypeLocked ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
            >
              {t('auth.signup.client')}
            </button>
            <button
              type="button"
              onClick={() => !userTypeLocked && onUserTypeChange('artist')}
              disabled={userTypeLocked}
              className={`p-4 border-2 rounded-xl transition-all ${
                userType === 'artist'
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-blue-200 hover:border-blue-500 hover:bg-blue-50'
              } ${userTypeLocked ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
            >
              {t('auth.signup.beautyArtist')}
            </button>
          </div>
        </div>
        {userType === 'client' && (
          <div>
            <Label htmlFor="signup-dateofbirth">{t('auth.signup.dateOfBirth')}</Label>
            <Input
              id="signup-dateofbirth"
              type="date"
              className="mt-2 h-12 rounded-xl"
              value={signupDateOfBirth || ''}
              onChange={(e) => onDateOfBirthChange(e.target.value)}
              max={new Date().toISOString().split('T')[0]}
            />
            <p className="mt-1 text-xs text-gray-500">{t('auth.signup.dateOfBirthOptional')}</p>
          </div>
        )}
        <div>
          <Label htmlFor="signup-password">{t('auth.signup.password')}</Label>
          <div className="relative mt-2">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <Input
              id="signup-password"
              type="password"
              placeholder="••••••••"
              className={`pl-12 h-12 rounded-xl ${
                passwordError ? 'border-red-500 focus-visible:border-red-500' : ''
              }`}
              value={signupPassword}
              onChange={(e) => onPasswordChange(e.target.value)}
              required
              minLength={6}
            />
          </div>
          {passwordError && <p className="mt-1 text-sm text-red-600">{passwordError}</p>}
        </div>
        <div>
          <Label htmlFor="signup-confirm">{t('auth.signup.confirmPassword')}</Label>
          <div className="relative mt-2">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <Input
              id="signup-confirm"
              type="password"
              placeholder="••••••••"
              className={`pl-12 h-12 rounded-xl ${
                confirmPasswordError ? 'border-red-500 focus-visible:border-red-500' : ''
              }`}
              value={signupConfirmPassword}
              onChange={(e) => onConfirmPasswordChange(e.target.value)}
              required
              minLength={6}
            />
          </div>
          {confirmPasswordError && (
            <p className="mt-1 text-sm text-red-600">{confirmPasswordError}</p>
          )}
        </div>
        <div className="flex items-start gap-2">
          <input
            type="checkbox"
            className="w-4 h-4 rounded border-gray-300 mt-1"
            checked={agreedToTerms}
            onChange={(e) => onAgreedToTermsChange(e.target.checked)}
            required
          />
          <div className="text-sm">
            {(() => {
              const fullText = t('auth.signup.agreeToTerms');
              const termsTitle = t('legal.terms.title');
              const privacyTitle = t('legal.privacy.title');
              
              // Try to find terms in the text (works for both English and Macedonian)
              const englishTermsIndex = fullText.indexOf('Terms of Service');
              const englishPrivacyIndex = fullText.indexOf('Privacy Policy');
              const macedonianTermsIndex = fullText.indexOf('Условите за услуга');
              const macedonianPrivacyIndex = fullText.indexOf('Политиката за приватност');
              
              if (englishTermsIndex !== -1 && englishPrivacyIndex !== -1) {
                // English version
                return (
                  <>
                    <span className="text-gray-600">{fullText.substring(0, englishTermsIndex)}</span>
                    <Link 
                      to="/terms" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="underline font-medium"
                      style={{ color: '#2563eb' }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      {termsTitle}
                    </Link>
                    <span className="text-gray-600">{fullText.substring(englishTermsIndex + 'Terms of Service'.length, englishPrivacyIndex)}</span>
                    <Link 
                      to="/privacy" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="underline font-medium"
                      style={{ color: '#2563eb' }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      {privacyTitle}
                    </Link>
                    <span className="text-gray-600">{fullText.substring(englishPrivacyIndex + 'Privacy Policy'.length)}</span>
                  </>
                );
              } else if (macedonianTermsIndex !== -1 && macedonianPrivacyIndex !== -1) {
                // Macedonian version
                return (
                  <>
                    <span className="text-gray-600">{fullText.substring(0, macedonianTermsIndex)}</span>
                    <Link 
                      to="/terms" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="underline font-medium"
                      style={{ color: '#2563eb' }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      {termsTitle}
                    </Link>
                    <span className="text-gray-600">{fullText.substring(macedonianTermsIndex + 'Условите за услуга'.length, macedonianPrivacyIndex)}</span>
                    <Link 
                      to="/privacy" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="underline font-medium"
                      style={{ color: '#2563eb' }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      {privacyTitle}
                    </Link>
                    <span className="text-gray-600">{fullText.substring(macedonianPrivacyIndex + 'Политиката за приватност'.length)}</span>
                  </>
                );
              }
              
              // Fallback: return text as-is if pattern doesn't match
              return <span className="text-gray-600">{fullText}</span>;
            })()}
          </div>
        </div>
        <Button
          type="submit"
          disabled={isLoading}
          className="w-full bg-sky-500 hover:bg-sky-600 text-white h-12 rounded-xl disabled:opacity-50"
        >
          {isLoading ? t('auth.signup.creatingAccount') : t('auth.signup.createAccount')}
        </Button>
      </form>
      <div className="mt-6 text-center">
        <span className="text-gray-600">{t('auth.signup.haveAccount')} </span>
        <button onClick={onSwitchToLogin} className="text-blue-600 hover:text-sky-600">
          {t('auth.signup.signIn')}
        </button>
      </div>
    </div>
  );
}
