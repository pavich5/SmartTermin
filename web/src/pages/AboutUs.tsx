import React from 'react';
import { Calendar, Users, TrendingUp, Sparkles } from 'lucide-react';
import { useTranslation } from '../hooks/useTranslation';
import { MissionSection } from '../components/about/MissionSection';
import { WhatWeDoSection } from '../components/about/WhatWeDoSection';
import { CTASection } from '../components/about/CTASection';
import { PageSection } from '../components/ui/PageSection';
import { PageContainer } from '../components/ui/PageContainer';
import { PageHeader } from '../components/ui/PageHeader';

export function AboutUs() {
  const { t } = useTranslation();

  const services = [
    {
      icon: Calendar,
      title: t('about.services.smartBooking.title'),
      description: t('about.services.smartBooking.desc'),
      iconBg: 'bg-sky-100',
      iconColor: 'text-sky-600',
    },
    {
      icon: Users,
      title: t('about.services.clientManagement.title'),
      description: t('about.services.clientManagement.desc'),
      iconBg: 'bg-blue-100',
      iconColor: 'text-blue-600',
    },
    {
      icon: TrendingUp,
      title: t('about.services.analytics.title'),
      description: t('about.services.analytics.desc'),
      iconBg: 'bg-blue-100',
      iconColor: 'text-blue-600',
    },
    {
      icon: Sparkles,
      title: t('about.services.portfolio.title'),
      description: t('about.services.portfolio.desc'),
      iconBg: 'bg-green-100',
      iconColor: 'text-green-600',
    },
  ];


  return (
    <div className="min-h-screen bg-white">
      <PageSection background="gradient" className="py-20">
        <PageContainer>
          <PageHeader title={t('about.title')} subtitle={t('about.subtitle')} />
        </PageContainer>
      </PageSection>

      <MissionSection />
      <WhatWeDoSection services={services} />
      <CTASection />
    </div>
  );
}
