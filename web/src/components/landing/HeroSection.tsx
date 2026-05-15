import React from 'react';
import { Button } from '../ui/button';
import { useTranslation } from '../../hooks/useTranslation';
import { useMediaQuery } from '../ui/use-mobile';

interface HeroSectionProps {
  onStartFreeTrial: () => void;
  onViewDemo: () => void;
}

export function HeroSection({ onStartFreeTrial, onViewDemo }: HeroSectionProps) {
  const { t } = useTranslation();
  const isMobile = useMediaQuery('(max-width: 1023px)');

  return (
    <section
      className="relative bg-blue-50 py-0 lg:py-20"
      style={!isMobile ? { minHeight: '90vh', display: 'flex', alignItems: 'center' } : undefined}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div
          className="flex items-center"
          style={{
            flexDirection: isMobile ? 'column' : 'row',
            display: 'flex',
            gap: isMobile ? '0' : '3rem',
            alignItems: isMobile ? 'flex-start' : 'center',
          }}
        >
          <div className={`flex-1 ${isMobile ? 'w-full' : ''}`} style={isMobile ? { order: 2, marginTop: 0 } : undefined}>
          <h1 className="text-4xl lg:text-6xl tracking-tight mb-2 lg:mb-6 text-sky-700">              {t('landing.hero.title')}
            </h1>
            <p className="text-lg text-gray-600 mb-4 lg:mb-8">{t('landing.hero.subtitle')}</p>
            <div className="flex flex-wrap gap-4 mb-12 lg:mb-0">
              <Button
                onClick={onStartFreeTrial}
                className="bg-sky-500 hover:bg-sky-600 text-white px-8 py-6 rounded-xl shadow-lg"
              >
                {t('landing.hero.cta')}
              </Button>
              <Button
                onClick={onViewDemo}
                variant="outline"
                className="px-8 py-6 rounded-xl border-2"
              >
                {t('landing.hero.viewDemo')}
              </Button>
            </div>
          </div>
          <div
            className={`relative flex-1 lg:mb-12 lg:mt-12 ${isMobile ? 'w-full' : ''}`}
            style={isMobile ? { order: 1, marginTop: 4, marginBottom: 8 } : undefined}
          >
            <div className="hidden lg:block rounded-2xl overflow-hidden shadow-2xl shadow-blue-500/20 bg-transparent">
              <div className="max-w-4xl mx-auto bg-transparent">
                <img
                  src="/banner-image.jpg"
                  alt={t('landing.hero.dashboardAlt')}
                  className="w-full max-h-[650px] h-auto rounded-2xl"
                  style={{ maxWidth: '100%', maxHeight: '600px', minHeight: '550px', objectFit: 'cover' }}
                />
              </div>
            </div>
            <div className="lg:hidden w-full">
              <img
                src="/banner-image.jpg"
                alt="SmartTermin - Beauty professionals and barbers booking platform"
                className="w-full h-auto rounded-xl"
                style={{ maxWidth: '100%', minHeight: '350px', objectFit: 'cover' }}
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
