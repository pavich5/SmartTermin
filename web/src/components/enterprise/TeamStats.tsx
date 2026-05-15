import React from 'react';
import { Users, Calendar, DollarSign } from 'lucide-react';
import { useTranslation } from '../../hooks/useTranslation';

interface TeamStatsProps {
  memberCount: number;
  totalBookings: number;
  totalRevenue: number;
}

export function TeamStats({ memberCount, totalBookings, totalRevenue }: TeamStatsProps) {
  const { t } = useTranslation();
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
        <div className="flex items-center gap-3 mb-2">
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center"
          >
            <Users size={20} />
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">{memberCount}</p>
            <p className="text-sm text-gray-600">{t('enterprise.team.teamMembers')}</p>
          </div>
        </div>
      </div>
      <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
        <div className="flex items-center gap-3 mb-2">
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center"
          >
            <Calendar size={20} />
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">{totalBookings}</p>
            <p className="text-sm text-gray-600">{t('enterprise.team.totalBookings')}</p>
          </div>
        </div>
      </div>
      <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
        <div className="flex items-center gap-3 mb-2">
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center"
          >
            <DollarSign size={20} />
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">{totalRevenue.toLocaleString()} ден.</p>
            <p className="text-sm text-gray-600">{t('enterprise.team.totalRevenue')}</p>
          </div>
        </div>
      </div>
    </div>
  );
}


