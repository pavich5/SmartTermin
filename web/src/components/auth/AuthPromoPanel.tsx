import React from 'react';
import { Mail, Phone, Shield } from 'lucide-react';
import { useTranslation } from '../../hooks/useTranslation';

interface AuthPromoPanelProps {
  mode: 'login' | 'signup';
}

export function AuthPromoPanel({ mode }: AuthPromoPanelProps) {
  const { t } = useTranslation();

  return (
    <div className="hidden lg:block">
      <div className="bg-sky-500 rounded-3xl p-12 text-white shadow-2xl">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
            <span className="text-2xl">{t('brand.initial')}</span>
          </div>
          <span className="text-2xl">{t('brand.name')}</span>
        </div>
        <h2 className="text-4xl mb-4">
          {mode === 'login' ? t('auth.login.title') : t('auth.signup.title')}
        </h2>
        <p className="text-sky-100 text-lg mb-8">
          {mode === 'login' ? t('auth.login.subtitle') : t('auth.signup.subtitle')}
        </p>
        <div className="space-y-4">
          {[
            { icon: Shield, text: t('auth.promo.secure') },
            { icon: Phone, text: t('auth.promo.phoneVerify') },
            { icon: Mail, text: t('auth.promo.emailNotifications') },
          ].map((item, idx) => (
            <div
              key={idx}
              className="flex items-center gap-3 bg-white/10 backdrop-blur-sm rounded-xl p-4"
            >
              <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                <item.icon size={20} />
              </div>
              <span>{item.text}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
