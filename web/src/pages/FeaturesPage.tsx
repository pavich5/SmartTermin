import React from 'react';
import {
  Calendar,
  Users,
  UserCheck,
  TrendingUp,
  Shield,
  Database,
  Phone,
  Mail,
} from 'lucide-react';
import { useTranslation } from '../hooks/useTranslation';
import SnowFall from 'react-snowfall';
import { FeatureItem } from '../components/features/FeatureItem';
import {
  SeamlessBookingIllustration,
  WalkInIllustration,
  ProfessionalToolsIllustration,
  AnalyticsIllustration,
  SecureAccountsIllustration,
  SecurityIllustration,
  PhoneVerifyIllustration,
  EmailNotificationsIllustration,
} from '../components/features/FeatureIllustrations';
import { useMediaQuery } from '../components/ui/use-mobile';
import { PageContainer } from '../components/ui/PageContainer';
import { PageHeader } from '../components/ui/PageHeader';

export function FeaturesPage() {
  const { t } = useTranslation();
  const isMobile = useMediaQuery('(max-width: 768px)');
  const features = [
    {
      icon: Calendar,
      title: t('features.seamlessBooking.title'),
      description: t('features.seamlessBooking.desc'),
      features: [
        t('features.seamlessBooking.24/7'),
        t('features.seamlessBooking.realTime'),
        t('features.seamlessBooking.instant'),
        t('features.seamlessBooking.mobile'),
      ],
      color: 'bg-sky-500',
      image: SeamlessBookingIllustration,
    },
    {
      icon: UserCheck,
      title: t('features.walkIn.title'),
      description: t('features.walkIn.desc'),
      features: [
        t('features.walkIn.quickEntry'),
        t('features.walkIn.autoAdd'),
        t('features.walkIn.marked'),
        t('features.walkIn.analytics'),
      ],
      color: 'bg-blue-200',
      image: WalkInIllustration,
    },
    {
      icon: Users,
      title: t('features.professionalTools.title'),
      description: t('features.professionalTools.desc'),
      features: [
        t('features.professionalTools.calendar'),
        t('features.professionalTools.serviceCustom'),
        t('features.professionalTools.portfolio'),
        t('features.professionalTools.clientDb'),
      ],
      color: 'bg-sky-500',
      image: ProfessionalToolsIllustration,
    },
    {
      icon: TrendingUp,
      title: t('features.analytics.title'),
      description: t('features.analytics.desc'),
      features: [
        t('features.analytics.revenue'),
        t('features.analytics.popular'),
        t('features.analytics.returning'),
        t('features.analytics.trends'),
      ],
      color: 'bg-blue-200',
      image: AnalyticsIllustration,
    },
    {
      icon: Shield,
      title: t('features.secureAccounts.title'),
      description: t('features.secureAccounts.desc'),
      features: [
        t('features.secureAccounts.emailVerify'),
        t('features.secureAccounts.phoneVerify'),
        t('features.secureAccounts.history'),
        t('features.secureAccounts.management'),
      ],
      color: 'bg-sky-500',
      image: SecureAccountsIllustration,
    },
    {
      icon: Database,
      title: t('features.security.title'),
      description: t('features.security.desc'),
      features: [
        t('features.security.gdpr'),
        t('features.security.encrypted'),
        t('features.security.backups'),
        t('features.security.hosting'),
      ],
      color: 'bg-blue-200',
      image: SecurityIllustration,
    },
    {
      icon: Phone,
      title: t('features.phoneVerify.title'),
      description: t('features.phoneVerify.desc'),
      features: [
        t('features.phoneVerify.sms'),
        t('features.phoneVerify.global'),
        t('features.phoneVerify.reduce'),
        t('features.phoneVerify.instant'),
      ],
      color: 'bg-sky-500',
      image: PhoneVerifyIllustration,
    },
    {
      icon: Mail,
      title: t('features.emailNotifications.title'),
      description: t('features.emailNotifications.desc'),
      features: [
        t('features.emailNotifications.confirmations'),
        t('features.emailNotifications.reminders'),
        t('features.emailNotifications.cancellations'),
        t('features.emailNotifications.templates'),
      ],
      color: 'bg-blue-200',
      image: EmailNotificationsIllustration,
    },
  ];

  return (
    <div className={`min-h-screen bg-white ${isMobile ? 'py-6' : 'py-12'} shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)]`}>
      <SnowFall 
        color="white" 
        snowflakeCount={200}
        style={{
          position: 'fixed',
          width: '100%',
          height: '100%',
          pointerEvents: 'none',
          zIndex: 1,
        }}
      />
      <PageContainer>
        {!isMobile && (
          <PageHeader title={t('features.title')} subtitle={t('features.subtitle')} className="mb-12" />
        )}

        <div className="space-y-24">
          {features.map((feature, idx) => (
            <FeatureItem
              key={feature.title}
              icon={feature.icon}
              title={feature.title}
              description={feature.description}
              features={feature.features}
              color={feature.color}
              image={feature.image as React.ComponentType<{ isMobile?: boolean }>}
              isReversed={idx % 2 === 1}
            />
          ))}
        </div>
      </PageContainer>
    </div>
  );
}
