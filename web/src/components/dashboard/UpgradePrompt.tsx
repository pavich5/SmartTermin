import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, ArrowRight } from 'lucide-react';
import { useTranslation } from '../../hooks/useTranslation';
import { Button } from '../ui/button';

interface UpgradePromptProps {
  title: string;
  message: string;
  feature?: string;
  className?: string;
}

export function UpgradePrompt({ title, message, feature, className = '' }: UpgradePromptProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <div
      className={`bg-sky-500 rounded-2xl p-8 text-white ${className}`}
    >
      <div className="flex items-start gap-4">
        <div className="bg-white/20 rounded-full p-3">
          <Sparkles size={24} />
        </div>
        <div className="flex-1">
          <h3 className="text-xl font-bold mb-2">{title}</h3>
          <p className="text-sky-100 mb-4">{message}</p>
          {feature && (
            <div className="bg-white/10 rounded-lg p-3 mb-4">
              <p className="text-sm">
                <span className="font-semibold">{t('common.proFeature')}</span> {feature}
              </p>
            </div>
          )}
          <Button
            onClick={() => navigate('/pricing')}
            className="bg-white text-sky-600 hover:bg-gray-100 font-semibold"
          >
            {t('common.upgradeToPro')}
            <ArrowRight size={18} className="ml-2" />
          </Button>
        </div>
      </div>
    </div>
  );
}
