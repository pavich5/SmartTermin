import React from 'react';
import { Target, Heart, Zap, Shield } from 'lucide-react';
import { useTranslation } from '../../hooks/useTranslation';

export function MissionSection() {
  const { t } = useTranslation();

  return (
    <section className="py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <div className="flex items-center gap-3 mb-6">
              <Target className="w-8 h-8 text-sky-600" />
              <h2 className="text-3xl font-bold text-gray-900">{t('about.mission.title')}</h2>
            </div>
            <p className="text-lg text-gray-600 mb-4">{t('about.mission.para1')}</p>
            <p className="text-lg text-gray-600">{t('about.mission.para2')}</p>
          </div>
          <div className="bg-blue-50 rounded-2xl p-8">
            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <Heart className="w-6 h-6 text-sky-600 mt-1 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">
                    {t('about.mission.clientFirst.title')}
                  </h3>
                  <p className="text-gray-600">{t('about.mission.clientFirst.desc')}</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <Zap className="w-6 h-6 text-blue-600 mt-1 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">
                    {t('about.mission.simple.title')}
                  </h3>
                  <p className="text-gray-600">{t('about.mission.simple.desc')}</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <Shield className="w-6 h-6 text-blue-600 mt-1 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">
                    {t('about.mission.secure.title')}
                  </h3>
                  <p className="text-gray-600">{t('about.mission.secure.desc')}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
