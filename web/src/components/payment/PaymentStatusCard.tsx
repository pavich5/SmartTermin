import React from 'react';
import { LucideIcon } from 'lucide-react';
import { useTranslation } from '../../hooks/useTranslation';
import { Button } from '../ui/button';

interface PaymentStatusCardProps {
  icon: LucideIcon;
  iconColor: string;
  title: string;
  description: string;
  showContent: boolean;
  errorMessage?: string | null;
  primaryButtonText: string;
  secondaryButtonText: string;
  onPrimaryAction: () => void;
  onSecondaryAction: () => void;
  children?: React.ReactNode;
}

export function PaymentStatusCard({
  icon: Icon,
  iconColor,
  title,
  description,
  showContent,
  errorMessage,
  primaryButtonText,
  secondaryButtonText,
  onPrimaryAction,
  onSecondaryAction,
  children,
}: PaymentStatusCardProps) {
  const { t } = useTranslation();
  const isError = iconColor.includes('red');

  return (
    <div className="min-h-screen bg-blue-50 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        <div className="bg-white rounded-3xl shadow-2xl p-8 md:p-12 text-center">
          <div className="mb-8">
            <div className="relative inline-block">
              <div
                className={`absolute inset-0 ${iconColor} rounded-full animate-ping ${showContent ? 'opacity-75' : 'opacity-0'}`}
              ></div>
              <div
                className={`relative ${iconColor} rounded-full p-4 transform transition-all duration-500 ${showContent ? 'scale-100' : 'scale-0'}`}
              >
                <Icon size={64} className="text-white" />
              </div>
            </div>
          </div>

          <div
            className={`space-y-4 transition-all duration-500 ${showContent ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
          >
            <h1
              className={`text-4xl md:text-5xl font-bold ${iconColor.includes('red') ? 'text-red-600' : 'text-sky-700'}`}
            >
              {title}
            </h1>

            <p className="text-xl text-gray-600 mt-4">{description}</p>

            {children}

            {errorMessage && (
              <div
                className={`flex items-start justify-center gap-3 mt-8 p-4 ${iconColor.includes('red') ? 'bg-red-50' : 'bg-blue-50'} rounded-2xl`}
              >
                <div className="text-left">
                  <p
                    className={`font-semibold ${iconColor.includes('red') ? 'text-red-900' : 'text-blue-900'}`}
                  >
                    {isError ? t('payment.failure.detailTitle') : t('payment.success.emailSent')}
                  </p>
                  <p
                    className={`text-sm ${iconColor.includes('red') ? 'text-red-700' : 'text-sky-600'}`}
                  >
                    {errorMessage}
                  </p>
                </div>
              </div>
            )}

            <div className="mt-8 space-y-4">
              {!errorMessage && (
                <p className="text-gray-600">
                  {isError ? t('payment.failure.helper') : t('payment.success.helper')}
                </p>
              )}

              <div className="flex flex-col sm:flex-row gap-4 justify-center mt-8">
                <Button
                  onClick={onPrimaryAction}
                  className={`bg-sky-500 hover:bg-sky-600 text-white px-8 py-6 rounded-full ${iconColor.includes('red') ? 'flex items-center gap-2' : ''}`}
                >
                  {primaryButtonText}
                </Button>
                <Button
                  onClick={onSecondaryAction}
                  variant="outline"
                  className="px-8 py-6 rounded-full"
                >
                  {secondaryButtonText}
                </Button>
              </div>

              {isError && (
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <p className="text-sm text-gray-500">{t('payment.failure.support')}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
