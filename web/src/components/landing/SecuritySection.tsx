import React from 'react';
import { LucideIcon } from 'lucide-react';
import { useTranslation } from '../../hooks/useTranslation';

interface SecurityItem {
  icon: LucideIcon;
  label: string;
}

interface SecuritySectionProps {
  items: SecurityItem[];
}

export function SecuritySection({ items }: SecuritySectionProps) {
  const { t } = useTranslation();

  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-center text-4xl mb-12">{t('landing.security.title')}</h2>
        <div className="grid md:grid-cols-4 gap-6">
          {items.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div
                key={idx}
                className="flex flex-col items-center p-6 bg-gradient-to-br from-gray-50 to-white rounded-2xl border border-gray-100"
              >
                <div className="w-14 h-14 rounded-2xl bg-sky-500 flex items-center justify-center mb-4 shadow-md">
                  <Icon className="text-white" size={28} />
                </div>
                <span className="text-center text-gray-700">{item.label}</span>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
