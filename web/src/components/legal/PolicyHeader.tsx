import React from 'react';
import { LucideIcon } from 'lucide-react';
import { useTranslation } from '../../hooks/useTranslation';

interface PolicyHeaderProps {
  icon: LucideIcon;
  title: string;
  iconBg: string;
  iconColor: string;
}

export function PolicyHeader({ icon: Icon, title, iconBg, iconColor }: PolicyHeaderProps) {
  const { t, language } = useTranslation();
  const formattedDate = new Intl.DateTimeFormat(language === 'mk' ? 'mk-MK' : 'en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date());

  return (
    <section className="relative bg-blue-50 py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <div className="flex justify-center mb-6">
            <div className={`w-16 h-16 ${iconBg} rounded-2xl flex items-center justify-center`}>
              <Icon className={`w-8 h-8 ${iconColor}`} />
            </div>
          </div>
          <h1 className="text-5xl lg:text-6xl tracking-tight mb-6 text-sky-700">
            {title}
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            {t('legal.lastUpdated', { date: formattedDate })}
          </p>
        </div>
      </div>
    </section>
  );
}
