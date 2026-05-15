import React from 'react';
import {
  Calendar,
  Users,
  Clock,
  Shield,
  TrendingUp,
  Bell,
  MapPin,
  Image,
  Scissors,
  Sparkles,
  Eye,
  Wand2,
  Check,
} from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'sonner';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from '../hooks/useTranslation';
import { HeroSection } from '../components/landing/HeroSection';
import { CategoriesSection } from '../components/landing/CategoriesSection';
import { HowItWorksSection } from '../components/landing/HowItWorksSection';
import { ClientExperienceSection } from '../components/landing/ClientExperienceSection';
import { BusinessToolsSection } from '../components/landing/BusinessToolsSection';
import { AnalyticsSection } from '../components/landing/AnalyticsSection';
import { WalkInSection } from '../components/landing/WalkInSection';
import { CTASection } from '../components/landing/CTASection';
import  SnowFall  from 'react-snowfall';

export function LandingPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, user } = useAuth();
  const { t } = useTranslation();

  const handleStartFreeTrial = () => {
    if (isAuthenticated && user?.userType === 'artist' && user?.isFreeTrialActive) {
      toast.info(t('toast.freeTrialActive'), {
        description: t('toast.freeTrialActiveDesc'),
        duration: 4000,
      });
      return;
    }

    if (isAuthenticated && user?.userType !== 'artist') {
      toast.info(t('toast.createArtistAccount'), {
        description: t('toast.createArtistAccountDesc'),
        duration: 4000,
      });
      return;
    }
    toast.info(t('toast.createArtistAccount'), {
      description: t('toast.createArtistAccountDesc'),
      duration: 4000,
    });
    navigate(`/auth?returnTo=${encodeURIComponent(location.pathname)}`);
  };

  const categories = [
    { icon: Scissors, label: t('landing.categories.barbers'), color: 'bg-sky-500' },
    {
      icon: Sparkles,
      label: t('landing.categories.nailTechnicians'),
      color: 'bg-sky-500',
    },
    {
      icon: Eye,
      label: t('landing.categories.lashArtists'),
      color: 'bg-sky-500',
    },
    {
      icon: Wand2,
      label: t('landing.categories.makeupArtists'),
      color: 'bg-sky-500',
    },
  ];

  const steps = [
    {
      num: '01',
      title: t('landing.howItWorks.step1.title'),
      desc: t('landing.howItWorks.step1.desc'),
    },
    {
      num: '02',
      title: t('landing.howItWorks.step2.title'),
      desc: t('landing.howItWorks.step2.desc'),
    },
    {
      num: '03',
      title: t('landing.howItWorks.step3.title'),
      desc: t('landing.howItWorks.step3.desc'),
    },
  ];

  const clientFeatures = [
    {
      icon: Shield,
      title: t('landing.clientExperience.secureAccount'),
      desc: t('landing.clientExperience.secureAccountDesc'),
      color: 'bg-sky-500',
    },
    {
      icon: Clock,
      title: t('landing.clientExperience.realTimeAvailability'),
      desc: t('landing.clientExperience.realTimeAvailabilityDesc'),
      color: 'bg-sky-500',
    },
    {
      icon: Bell,
      title: t('landing.clientExperience.emailConfirmations'),
      desc: t('landing.clientExperience.emailConfirmationsDesc'),
      color: 'bg-sky-500',
    },
    {
      icon: Calendar,
      title: t('landing.clientExperience.easyManagement'),
      desc: t('landing.clientExperience.easyManagementDesc'),
      color: 'bg-sky-500',
    },
  ];

  const tools = [
    { icon: Calendar, label: t('landing.businessTools.calendar') },
    { icon: Scissors, label: t('landing.businessTools.serviceManagement') },
    { icon: Image, label: t('landing.businessTools.portfolioUpload') },
    { icon: Clock, label: t('landing.businessTools.workingHours') },
    { icon: Users, label: t('landing.businessTools.clientList') },
    { icon: Check, label: t('landing.businessTools.acceptDecline') },
    { icon: Bell, label: t('landing.businessTools.emailNotifications') },
    { icon: MapPin, label: t('landing.businessTools.locationSettings') },
  ];

  const analyticsItems = [
    { icon: TrendingUp, label: t('landing.analytics.revenueTracking') },
    { icon: Users, label: t('landing.analytics.returningClients') },
    { icon: Sparkles, label: t('landing.analytics.popularServices') },
    { icon: Calendar, label: t('landing.analytics.monthlyInsights') },
  ];

  const walkInSteps = [
    t('landing.walkIn.step1'),
    t('landing.walkIn.step2'),
    t('landing.walkIn.step3'),
    t('landing.walkIn.step4'),
  ];

  return (
    <div className="overflow-x-hidden">
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
      <HeroSection onStartFreeTrial={handleStartFreeTrial} onViewDemo={() => navigate('/demo')} />
      <CategoriesSection categories={categories} />
      <HowItWorksSection steps={steps} />
      <ClientExperienceSection features={clientFeatures} />
      <BusinessToolsSection tools={tools} />
      <AnalyticsSection items={analyticsItems} />
      <WalkInSection steps={walkInSteps} />
    </div>
  );
}
