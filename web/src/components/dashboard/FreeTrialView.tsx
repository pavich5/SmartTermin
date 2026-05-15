import React from 'react';
import { Calendar, Sparkles, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '../../hooks/useTranslation';
import { Button } from '../ui/button';
import { format } from 'date-fns';
import { getDateLocale } from '../../utils/dateLocale';

interface FreeTrialViewProps {
  trialEndDate: Date;
  daysRemaining: number;
  onUpgrade?: () => void;
}

export function FreeTrialView({ trialEndDate, daysRemaining, onUpgrade }: FreeTrialViewProps) {
  const { t, language } = useTranslation();
  const navigate = useNavigate();
  const dateLocale = getDateLocale(language);

  const handleUpgrade = () => {
    if (onUpgrade) {
      onUpgrade();
    }
    navigate('/pricing');
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg p-8 w-full">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-blue-100 rounded-full mb-4">
          <Sparkles className="text-sky-600" size={40} />
        </div>
        <h2 className="text-3xl font-bold text-sky-700 mb-2">
          {t('dashboard.freeTrial.title')}
        </h2>
        <p className="text-gray-600 text-lg">{t('dashboard.freeTrial.subtitle')}</p>
      </div>

      <div className="bg-blue-50 rounded-xl p-8 mb-6 border-2 border-blue-200 shadow-sm">
        <div className="flex flex-col items-center justify-center">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 bg-sky-500 rounded-full flex items-center justify-center shadow-lg">
              <Calendar className="text-white" size={28} />
            </div>
            <div className="text-center">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                {t('dashboard.freeTrial.endsIn')}
              </p>
              <div className="flex items-baseline justify-center gap-2">
                <p className="text-5xl font-bold text-sky-700">
                  {daysRemaining}
                </p>
                <p className="text-lg font-semibold text-gray-700">
                  {daysRemaining !== 1
                    ? t('dashboard.freeTrial.daysPlural')
                    : t('dashboard.freeTrial.days')}
                </p>
              </div>
            </div>
          </div>
          <div className="w-full h-px bg-gradient-to-r from-transparent via-sky-200 to-transparent mb-4"></div>
          <p className="text-center text-sm text-gray-600">
            <span className="font-medium text-gray-700">
              {t('dashboard.freeTrial.trialEndsOn')}
            </span>{' '}
            <span className="text-sky-600 font-semibold">
              {format(trialEndDate, 'MMMM d, yyyy', { locale: dateLocale })}
            </span>
          </p>
        </div>
      </div>

      <div className="space-y-4 mb-8">
        <h3 className="text-xl font-semibold text-gray-900 mb-4">
          {t('dashboard.freeTrial.whatYouGet')}
        </h3>
        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-green-600 text-sm">✓</span>
            </div>
            <div>
              <p className="font-medium text-gray-900">
                {t('dashboard.freeTrial.unlimitedBookings')}
              </p>
              <p className="text-sm text-gray-600">
                {t('dashboard.freeTrial.unlimitedBookingsDesc')}
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-green-600 text-sm">✓</span>
            </div>
            <div>
              <p className="font-medium text-gray-900">
                {t('dashboard.freeTrial.advancedAnalytics')}
              </p>
              <p className="text-sm text-gray-600">
                {t('dashboard.freeTrial.advancedAnalyticsDesc')}
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-green-600 text-sm">✓</span>
            </div>
            <div>
              <p className="font-medium text-gray-900">
                {t('dashboard.freeTrial.portfolioManagement')}
              </p>
              <p className="text-sm text-gray-600">
                {t('dashboard.freeTrial.portfolioManagementDesc')}
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-green-600 text-sm">✓</span>
            </div>
            <div>
              <p className="font-medium text-gray-900">
                {t('dashboard.freeTrial.clientManagement')}
              </p>
              <p className="text-sm text-gray-600">
                {t('dashboard.freeTrial.clientManagementDesc')}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <Button
          onClick={handleUpgrade}
          className="flex-1 bg-sky-500 hover:bg-sky-600 text-white rounded-full"
        >
          {t('dashboard.freeTrial.upgrade')}
          <ArrowRight size={18} className="ml-2" />
        </Button>
      </div>
    </div>
  );
}
