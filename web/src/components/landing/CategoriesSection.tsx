import React from 'react';
import { useTranslation } from '../../hooks/useTranslation';

interface Category {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  label: string;
  color: string;
}

interface CategoriesSectionProps {
  categories: Category[];
}

export function CategoriesSection({ categories }: CategoriesSectionProps) {
  const { t } = useTranslation();
  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-center text-4xl mb-4">{t('landing.categories.title')}</h2>
        <div className="flex flex-col md:flex-row md:flex-wrap md:justify-center gap-6 mt-12">
          {categories.map((category, idx) => {
            const Icon = category.icon;
            return (
              <div
                key={idx}
                className="flex flex-col items-center p-6 rounded-2xl bg-gradient-to-br from-gray-50 to-white border border-gray-100 hover:shadow-lg transition-shadow w-full md:w-auto md:min-w-[180px]"
              >
                <div
                  className={`w-16 h-16 rounded-2xl ${category.color} flex items-center justify-center mb-4 shadow-md`}
                >
                  <Icon className="text-white" size={32} />
                </div>
                <span className="text-center text-gray-700">{category.label}</span>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
