import React from 'react';
import { Shield, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { useTranslation } from '../../hooks/useTranslation';
import { getDateLocale } from '../../utils/dateLocale';

interface AccountInfoSectionProps {
  userType: string;
}

export function AccountInfoSection({ userType }: AccountInfoSectionProps) {
  const { t, language } = useTranslation();
  const userTypeLabel = userType === 'artist' ? t('profile.artistLabel') : t('profile.clientLabel');
  const memberSince = format(new Date(), 'MMMM yyyy', { locale: getDateLocale(language) });

  return (
    <div className="border-t border-gray-200 pt-6">
      <h3 className="text-xl font-semibold mb-4 text-gray-800">{t('profile.accountInfo')}</h3>
      <div className="space-y-3">
        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
          <div className="flex items-center gap-3">
            <Shield size={20} className="text-gray-400" />
            <div>
              <div className="font-medium text-gray-800">{t('profile.accountType')}</div>
              <div className="text-sm text-gray-600 capitalize">{userTypeLabel}</div>
            </div>
          </div>
        </div>
        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
          <div className="flex items-center gap-3">
            <Calendar size={20} className="text-gray-400" />
            <div>
              <div className="font-medium text-gray-800">{t('profile.memberSince')}</div>
              <div className="text-sm text-gray-600">{memberSince}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
