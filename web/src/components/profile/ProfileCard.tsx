import React from 'react';
import { User, Shield } from 'lucide-react';
import { useTranslation } from '../../hooks/useTranslation';

interface ProfileCardProps {
  user: {
    fullName: string;
    userType: string;
  };
}

export function ProfileCard({ user }: ProfileCardProps) {
  const { t } = useTranslation();
  const userTypeLabel =
    user.userType === 'artist' ? t('profile.artistLabel') : t('profile.clientLabel');

  return (
    <div className="bg-white rounded-3xl shadow-xl overflow-hidden">
      <div className="bg-sky-500 p-8">
        <div className="flex items-center gap-6">
          <div className="w-24 h-24 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center border-4 border-white/30">
            <User size={48} className="text-white" />
          </div>
          <div className="text-white">
            <h2 className="text-2xl font-bold mb-1">{user.fullName}</h2>
            <div className="flex items-center gap-2 text-sky-100">
              <Shield size={16} />
              <span className="capitalize">{userTypeLabel}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
