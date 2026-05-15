import React from 'react';
import { TrendingUp } from 'lucide-react';
import { useTranslation } from '../../hooks/useTranslation';

interface Stat {
  label: string;
  value: string;
  change: string;
  color: string;
}

interface DashboardStatsProps {
  stats: Stat[];
}

export function DashboardStats({ stats }: DashboardStatsProps) {
  const { t } = useTranslation();

  const getChangeColor = (change: string) => {
    const trimmed = change.trim();
    if (!trimmed) return 'text-gray-600';

    // Extract numeric part (handles "+100%", "100%", "-25", etc.)
    const numericMatch = trimmed.match(/-?\+?\d+(\.\d+)?/);
    const value = numericMatch ? Number(numericMatch[0].replace('+', '')) : 0;

    if (value > 0) return 'text-emerald-600';
    if (value < 0) return 'text-red-600';

    return 'text-gray-600';
  };

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full">
      {stats.map((stat, idx) => (
        <div
          key={idx}
          className="bg-white rounded-2xl shadow-lg p-4 sm:p-6 w-full overflow-hidden"
        >
          <div className="text-gray-600 text-xs sm:text-sm mb-2 truncate">{stat.label}</div>
          <div className="text-xl sm:text-2xl md:text-3xl mb-2 truncate">{stat.value}</div>
          {stat.change && (
            <div
              className={`inline-flex items-center text-xs sm:text-sm whitespace-nowrap ${getChangeColor(
                stat.change
              )}`}
            >
              <TrendingUp size={14} className="mr-1 flex-shrink-0" />
              {stat.change} {t('dashboard.stats.thisMonth')}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
