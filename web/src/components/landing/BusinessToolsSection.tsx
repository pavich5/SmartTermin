import React from 'react';
import { LucideIcon } from 'lucide-react';
import { useTranslation } from '../../hooks/useTranslation';

interface Tool {
  icon: LucideIcon;
  label: string;
}

interface BusinessToolsSectionProps {
  tools: Tool[];
}

export function BusinessToolsSection({ tools }: BusinessToolsSectionProps) {
  const { t } = useTranslation();

  return (
    <section className="py-20 bg-blue-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-center text-4xl mb-4">{t('landing.businessTools.title')}</h2>
        <p className="text-center text-gray-600 text-lg mb-12">
          {t('landing.businessTools.subtitle')}
        </p>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          {tools.map((tool, idx) => {
            const Icon = tool.icon;
            return (
              <div
                key={idx}
                className="p-6 bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow flex items-center gap-4"
              >
                <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                  <Icon className="text-blue-600" size={20} />
                </div>
                <span className="text-gray-700">{tool.label}</span>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
