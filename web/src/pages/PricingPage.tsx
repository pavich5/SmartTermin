import React from 'react';
import { Check } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useTranslation } from '../hooks/useTranslation';
import SnowFall from 'react-snowfall';
import { plans } from '../constants/paddle';
import {
  openPaddleCheckout,
  getPricePreview,
  isPaddleLoaded,
  isPaddleInitialized,
} from '../utils/paddle';
import { useAuth } from '../contexts/AuthContext';
import { useSalon } from '../contexts/SalonContext';
import type { BillingCycle } from '../constants/paddle';
import { isCurrentUserEnterpriseAllowed, ENTERPRISE_CONTACT_INSTAGRAM } from '../constants/enterprise';
import { Button } from '../components/ui/button';
import { PageContainer } from '../components/ui/PageContainer';
import { PageHeader } from '../components/ui/PageHeader';
import { PlanChangeModal } from '../components/dashboard/modals/PlanChangeModal';
import { TrialStartModal } from '../components/dashboard/modals/TrialStartModal';
import { UpgradeNoTrialModal } from '../components/dashboard/modals/UpgradeNoTrialModal';
import { EnterpriseToProModal } from '../components/dashboard/modals/EnterpriseToProModal';
import { cancelArtistSubscription } from '../services/artistService';
import { cancelSalonSubscription } from '../services/salonService';
import { startProTrial, startEnterpriseTrial, updateProcessingFlag } from '../services/subscriptionService';

const fallbackPrice = { month: 20, year: 192 }; // Prices in EUR

export function PricingPage() {
  const { t } = useTranslation();
  const { isAuthenticated, user, refreshUser } = useAuth();
  const { subscription: salonSubscription } = useSalon();
  const navigate = useNavigate();
  const [billingCycle, setBillingCycle] = useState<BillingCycle>('month');
  const [localizedPrice, setLocalizedPrice] = useState<string | null>(null);
  const [isLoadingPrice, setIsLoadingPrice] = useState(false);
  const [planChangeModal, setPlanChangeModal] = useState<{
    show: boolean;
    changeType: 'upgrade' | 'downgrade';
    fromPlan: 'free' | 'pro' | 'enterprise';
    toPlan: 'free' | 'pro' | 'enterprise';
  }>({
    show: false,
    changeType: 'upgrade',
    fromPlan: 'free',
    toPlan: 'pro',
  });
  const [trialStartModal, setTrialStartModal] = useState<{
    show: boolean;
    plan: 'pro' | 'enterprise';
  }>({
    show: false,
    plan: 'pro',
  });
  const [upgradeNoTrialModal, setUpgradeNoTrialModal] = useState<{
    show: boolean;
    plan: 'pro' | 'enterprise';
  }>({
    show: false,
    plan: 'pro',
  });
  const [enterpriseToProModal, setEnterpriseToProModal] = useState(false);
  const [isProcessingPlanChange, setIsProcessingPlanChange] = useState(false);

  useEffect(() => {
    const fetchPrice = async () => {
      let retries = 0;
      const maxRetries = 50;

      const waitForPaddle = (): Promise<boolean> => {
        return new Promise((resolve) => {
          const check = () => {
            if (isPaddleLoaded() && isPaddleInitialized()) {
              resolve(true);
            } else if (retries < maxRetries) {
              retries++;
              setTimeout(check, 100);
            } else {
              resolve(false);
            }
          };
          check();
        });
      };

      const isReady = await waitForPaddle();

      if (!isReady) {
        setIsLoadingPrice(false);
        return;
      }

      setIsLoadingPrice(true);
      try {
        const cycle = billingCycle;
        const plan = plans[0];
        const items = [{ quantity: 1, priceId: plan.priceId[cycle] }];

        const result = await getPricePreview(items);

        const lineItems = result?.data?.details?.lineItems;

        if (!lineItems || !Array.isArray(lineItems) || lineItems.length === 0) {
          console.warn('Paddle PricePreview returned unexpected structure:', result);
          setIsLoadingPrice(false);
          return;
        }

        const planPriceId = plan.priceId[cycle];

        type LineItem = {
          price: { id: string };
          formattedTotals: { subtotal: string };
        };

        const planPrice = lineItems.find((item: LineItem) => item.price?.id === planPriceId);

        setLocalizedPrice(planPrice?.formattedTotals?.subtotal || null);
      } catch (error) {
        console.error('Failed to fetch localized price:', error);
      } finally {
        setIsLoadingPrice(false);
      }
    };

    fetchPrice();
  }, [billingCycle]);

  const getDisplayPrice = (cycle: BillingCycle) => {
    if (localizedPrice) {
      // Return the Euro price from Paddle as-is (format: "€20.00" or "20.00 €" or similar)
      // If it doesn't have Euro symbol, add it
      if (localizedPrice.includes('€')) {
        return localizedPrice;
      }
      // Extract numeric value and format with Euro symbol
      const numericValue = localizedPrice.replace(/[^\d.]/g, '');
      const priceNumber = parseFloat(numericValue);
      if (!isNaN(priceNumber)) {
        // Format with 2 decimals and Euro symbol
        const formatted = priceNumber % 1 === 0 
          ? priceNumber.toString() 
          : priceNumber.toFixed(2);
        return `€${formatted}`;
      }
      return localizedPrice;
    }
    // Fallback: prices are already in EUR
    const price = fallbackPrice[cycle];
    const formatted = price % 1 === 0 ? price.toString() : price.toFixed(2);
    return `€${formatted}`;
  };

  const proPrice = getDisplayPrice(billingCycle);
  const priceUnit =
    billingCycle === 'year' ? t('pricing.perYear') || '/year' : t('pricing.perMonth');

  const isOnEnterpriseTrial =
    isAuthenticated && user?.salonId && salonSubscription?.status === 'trial';
  const hasEnterpriseSubscription =
    isAuthenticated &&
    user?.salonId &&
    salonSubscription &&
    salonSubscription.status !== 'cancelled' &&
    salonSubscription.status !== 'expired';
  const hasEnterprise = isOnEnterpriseTrial || hasEnterpriseSubscription;

  const isOnFreeTrial = isAuthenticated && user?.isFreeTrialActive === true && !hasEnterprise;
  const hasPaidProSubscription =
    isAuthenticated &&
    user?.subscriptionPlan === 'pro' &&
    !user?.isFreeTrialActive &&
    !hasEnterprise;

  const getCurrentPlan = (): 'free' | 'pro' | 'enterprise' => {
    if (hasEnterprise) return 'enterprise';
    if (hasPaidProSubscription || isOnFreeTrial) return 'pro';
    return 'free';
  };

  const currentPlan = getCurrentPlan();

  // Trial eligibility checks
  const canStartProTrial =
    isAuthenticated && user?.hasUsedProTrial !== true && user?.hasCreatedSalon !== true;

  const canStartEnterpriseTrial =
    isAuthenticated && user?.hasUsedEnterpriseTrial !== true && user?.hasCreatedSalon !== true;

  // Check if processing flag is set (abuse prevention)
  const isProcessing = user?.isProcessingPlanChange === true || isProcessingPlanChange;

  const handleFreePlanClick = () => {
    if (isProcessing) return; // Abuse prevention

    if (!isAuthenticated) {
      navigate('/auth?returnTo=/pricing');
      return;
    }

    if (user?.userType !== 'artist') {
      toast.error(t('toast.artistAccountRequired'), {
        description: t('toast.artistAccountRequiredDesc'),
        duration: 4000,
      });
      return;
    }

    if (currentPlan === 'free') {
      return; // Already on free plan
    }

    // Downgrade to free - show modal
    setPlanChangeModal({
      show: true,
      changeType: 'downgrade',
      fromPlan: currentPlan,
      toPlan: 'free',
    });
  };

  const handleProPlanClick = () => {
    if (isProcessing) return; // Abuse prevention

    if (!isAuthenticated) {
      toast.info(t('pricing.signupForPro'), {
        description: t('pricing.signupForProDesc'),
        duration: 5000,
      });
      navigate('/auth?returnTo=/pricing&signup=true');
      return;
    }

    if (user?.userType !== 'artist') {
      toast.error(t('toast.artistAccountRequired'), {
        description: t('toast.artistAccountRequiredDesc'),
        duration: 4000,
      });
      return;
    }

    if (currentPlan === 'pro') {
      return; // Already on pro plan
    }

    if (currentPlan === 'free') {
      // Upgrade to Pro
      if (canStartProTrial) {
        // Show trial start modal
        setTrialStartModal({ show: true, plan: 'pro' });
      } else {
        // Show upgrade without trial modal
        setUpgradeNoTrialModal({ show: true, plan: 'pro' });
      }
    } else if (currentPlan === 'enterprise') {
      // Downgrade from Enterprise to Pro - special modal
      setEnterpriseToProModal(true);
    }
  };

  const handleProCheckout = async (
    onCheckoutComplete?: () => Promise<void>,
    successUrlOverride?: string
  ) => {
    const plan = plans[0];

    if (!plan) {
      console.error('Plan not found');
      return;
    }

    const priceId = plan.priceId[billingCycle];
    if (!priceId || !priceId.startsWith('pri_')) {
      console.error('Invalid price ID format:', priceId);
      toast.error(t('pricing.errors.invalidPriceConfig'));
      return;
    }

    try {
      if (!user?.email) {
        toast.error(t('toast.validationError'), {
          description: 'Please ensure your email is set in your profile.',
        });
        return;
      }

      toast.warning(t('toast.importantUseEmail'), {
        description: t('toast.importantUseEmailDesc', { email: user.email }),
        duration: 6000,
      });

      await openPaddleCheckout(
        priceId,
        1,
        user.email,
        {
          userId: user.id,
          userType: 'artist',
          artistId: user.artistId,
          userName: user.fullName, 
        },
        onCheckoutComplete,
        successUrlOverride
      );
    } catch (error) {
      console.error('Failed to open checkout:', error);
      toast.error(t('pricing.errors.checkoutFailed'));
    }
  };

  const handleEnterprisePlanClick = () => {
    if (isProcessing) return; // Abuse prevention

    // Check if user's artist ID is allowed for Enterprise
    const isAllowed = isCurrentUserEnterpriseAllowed(user?.artistId);

    if (!isAllowed) {
      // Redirect to Instagram for contact
      window.open(ENTERPRISE_CONTACT_INSTAGRAM, '_blank');
      return;
    }

    // User is allowed - navigate to create salon
    if (!isAuthenticated) {
      toast.info(t('pricing.signupForEnterprise'), {
        description: t('pricing.signupForEnterpriseDesc'),
        duration: 5000,
      });
      navigate('/auth?returnTo=/onboarding&signup=true&createEnterprise=true');
      return;
    }

    if (user?.userType !== 'artist') {
      toast.error(t('toast.artistAccountRequired'), {
        description: t('toast.artistAccountRequiredDesc'),
        duration: 4000,
      });
      return;
    }

    if (currentPlan === 'enterprise') {
      return; // Already on enterprise plan
    }

    // Navigate to create salon page (free creation, no payment)
    navigate('/enterprise/create');
  };

  const handleTrialStartConfirm = async () => {
    if (isProcessing) return;
    
    setIsProcessingPlanChange(true);
    try {
      await updateProcessingFlag(true);
      
      if (trialStartModal.plan === 'pro') {
        await startProTrial();
        // After trial is confirmed, open checkout (trial is handled by backend)
        setTrialStartModal({ show: false, plan: 'pro' });
        await handleProCheckout();
      } else if (trialStartModal.plan === 'enterprise') {
        await startEnterpriseTrial();
        setTrialStartModal({ show: false, plan: 'enterprise' });
        navigate('/enterprise/create');
      }
      
      await refreshUser();
    } catch (error: any) {
      console.error('Failed to start trial:', error);
      toast.error(error?.message || 'Failed to start trial. Please try again.');
    } finally {
      await updateProcessingFlag(false);
      setIsProcessingPlanChange(false);
    }
  };

  const handleUpgradeNoTrialConfirm = async () => {
    if (isProcessing) return;
    
    setIsProcessingPlanChange(true);
    try {
      await updateProcessingFlag(true);
      
      if (upgradeNoTrialModal.plan === 'pro') {
        setUpgradeNoTrialModal({ show: false, plan: 'pro' });
        await handleProCheckout();
      } else if (upgradeNoTrialModal.plan === 'enterprise') {
        setUpgradeNoTrialModal({ show: false, plan: 'enterprise' });
        navigate('/enterprise/create');
      }
    } catch (error) {
      console.error('Failed to upgrade:', error);
      toast.error(t('toast.failedToUpgrade'));
    } finally {
      await updateProcessingFlag(false);
      setIsProcessingPlanChange(false);
    }
  };

  const handleEnterpriseToProConfirm = async () => {
    if (isProcessing) return;
    
    setIsProcessingPlanChange(true);
    try {
      await updateProcessingFlag(true);
      const salonId = user?.salonId;

      if (!salonId) {
        throw new Error('Salon not found');
      }

      setEnterpriseToProModal(false);

      const successUrlOverride = `${window.location.origin}/dashboard?downgrade=enterprise_to_pro&salonId=${salonId}`;

      // Run checkout first; only cancel Enterprise and refresh after successful payment
      await handleProCheckout(
        async () => {
          try {
            await cancelSalonSubscription(salonId, true);
            await refreshUser();
            toast.success(t('toast.switchedToPro'));
            navigate('/dashboard', { replace: true });
          } catch (callbackError) {
            console.error('Payment succeeded but failed to finalize switch to Pro:', callbackError);
            toast.error(t('toast.paymentSucceededButFailed'));
          }
        },
        successUrlOverride
      );
    } catch (error) {
      console.error('Failed to switch to Pro:', error);
      toast.error(t('toast.failedToSwitch'));
    } finally {
      await updateProcessingFlag(false);
      setIsProcessingPlanChange(false);
    }
  };

  const handlePlanChangeConfirm = async () => {
    if (isProcessing) return;
    
    setIsProcessingPlanChange(true);
    try {
      await updateProcessingFlag(true);
      
      const { fromPlan, toPlan } = planChangeModal;

      if (toPlan === 'free') {
        // Downgrade to free - cancel subscription
        if (fromPlan === 'pro' && user?.artistId) {
          await cancelArtistSubscription(user.artistId);
          toast.success(t('toast.successfullyDowngraded'));
          await refreshUser();
          window.location.reload();
        } else if (fromPlan === 'enterprise' && user?.salonId) {
          await cancelSalonSubscription(user.salonId);
          toast.success(t('toast.successfullyDowngraded'));
          await refreshUser();
          window.location.reload();
        }
      } else if (toPlan === 'enterprise') {
        // Upgrade to enterprise - navigate to enterprise page
        setPlanChangeModal({ ...planChangeModal, show: false });
        navigate('/enterprise/create');
      }
    } catch (error) {
      console.error('Failed to change plan:', error);
      toast.error(t('toast.failedToChangePlan'));
    } finally {
      await updateProcessingFlag(false);
      setIsProcessingPlanChange(false);
      setPlanChangeModal({ ...planChangeModal, show: false });
    }
  };

  const freeFeatures = [
    t('pricing.features.calendar'),
    t('pricing.features.onlineBooking'),
    t('pricing.features.servicesMax'),
    t('pricing.features.portfolioImagesMax'),
    t('pricing.features.emailsPerMonth'),
    t('pricing.features.bookingsPerMonth'),
    t('pricing.features.walkInBookingsPerMonth'),
    t('pricing.features.customBookingLink'),
    t('pricing.features.clientList'),
    t('pricing.features.phoneVerification'),
    t('pricing.features.locationSettings'),
  ];

  const proFeatures = [
    t('pricing.features.calendar'),
    t('pricing.features.onlineBooking'),
    t('pricing.features.unlimitedServices'),
    t('pricing.features.unlimitedPortfolioImages'),
    t('pricing.features.unlimitedEmails'),
    t('pricing.features.unlimitedBookings'),
    t('pricing.features.unlimitedWalkInBookings'),
    t('pricing.features.customBookingLink'),
    t('pricing.features.clientListWithNotes'),
    t('pricing.features.phoneVerification'),
    t('pricing.features.locationSettings'),
    t('pricing.features.revenueAnalytics'),
    t('pricing.features.popularServices'),
    t('pricing.features.returningClients'),
    t('pricing.features.bookingReports'),
    t('pricing.features.dataExport'),
    t('pricing.features.prioritySupport'),
    t('pricing.features.listingPriority'),
  ];

  const enterpriseFeatures = [
    t('pricing.features.teamManagement'),
    t('pricing.features.combinedCalendar'),
    t('pricing.features.salonAnalytics'),
    t('pricing.features.inviteManageArtists'),
  ];

  const faqs = [
    { q: t('pricing.faq.switchPlans.q'), a: t('pricing.faq.switchPlans.a') },
    { q: t('pricing.faq.paymentMethods.q'), a: t('pricing.faq.paymentMethods.a') },
    { q: t('pricing.faq.contract.q'), a: t('pricing.faq.contract.a') },
    { q: t('pricing.faq.refunds.q'), a: t('pricing.faq.refunds.a') },
  ];

  return (
    <div className="min-h-screen bg-blue-50 py-12">
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
        <PageHeader title={t('pricing.title')} subtitle={t('pricing.subtitle')} className="mb-4" />

        <div className="flex justify-center mb-12">
          <div className="inline-flex items-center gap-3 bg-white rounded-full p-2 shadow-md">
            <button
              onClick={() => setBillingCycle('month')}
              className={`px-6 py-2 rounded-full transition-all ${
                billingCycle === 'month'
                  ? 'bg-sky-500 text-white shadow-md'
                  : 'text-gray-600'
              }`}
            >
              {t('pricing.monthly')}
            </button>
            <button
              onClick={() => setBillingCycle('year')}
              className={`px-6 py-2 rounded-full transition-all relative ${
                billingCycle === 'year'
                  ? 'bg-sky-500 text-white shadow-md'
                  : 'text-gray-600'
              }`}
            >
              {t('pricing.yearly')}
              <span className="absolute -top-2 -right-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full" style={{ right: '-30px' }}>
                {t('pricing.save20')}
              </span>
            </button>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-7xl mx-auto mb-20">
          <div className="bg-white rounded-3xl shadow-xl overflow-hidden border-2 border-gray-100 hover:border-blue-200 transition-colors">
            <div className="p-8">
              <h2 className="text-2xl mb-6">{t('pricing.free.name')}</h2>
              <div className="mb-6">
                <div className="flex items-baseline gap-2">
                  <span className="text-5xl">{t('pricing.free.price')}</span>
                </div>
              </div>
              <Button
                onClick={handleFreePlanClick}
                disabled={isAuthenticated && currentPlan === 'free'}
                className={`w-full py-6 rounded-full mb-6 ${
                  isAuthenticated && currentPlan === 'free'
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-sky-500 hover:bg-sky-600 text-white'
                }`}
              >
                {!isAuthenticated
                  ? t('pricing.startFreeShort') || 'Start Free'
                  : currentPlan === 'free'
                  ? t('pricing.currentPlan') || 'Current plan'
                  : currentPlan === 'pro'
                  ? t('pricing.downgradeToFree') || 'Downgrade to Free'
                  : currentPlan === 'enterprise'
                  ? t('pricing.downgradeToFree') || 'Downgrade to Free'
                  : t('pricing.free.cta')}
              </Button>
              <div className="space-y-4">
                {freeFeatures.map((feature, idx) => (
                  <div key={idx} className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Check size={14} className="text-green-600" />
                    </div>
                    <span className="text-gray-700">{feature}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="bg-sky-500 rounded-3xl shadow-2xl overflow-hidden relative transform md:scale-105">
            <div className="absolute top-6 right-6 bg-white text-sky-600 px-4 py-2 rounded-full text-sm font-medium">
              {t('pricing.pro.badge')}
            </div>
            <div className="p-8 text-white">
              <h2 className="text-2xl mb-2">{t('pricing.proPlan')}</h2>
              <p className="text-sky-100 mb-6">{t('pricing.pro.description')}</p>
              <div className="mb-6">
                <div className="flex items-baseline gap-2">
                  <span className="text-5xl">{isLoadingPrice ? '...' : proPrice}</span>
                  <span className="text-sky-100">{priceUnit}</span>
                </div>
                <div className="text-green-300 mt-2 font-medium text-sm">
                  {t('pricing.pro.trial') || '1 month free trial'}
                </div>
              </div>
              <Button
                onClick={handleProPlanClick}
                disabled={currentPlan === 'pro' || isProcessing}
                className={`w-full py-6 rounded-full mb-6 ${
                  currentPlan === 'pro' || isProcessing
                    ? 'bg-white text-sky-600 cursor-not-allowed font-semibold opacity-50'
                    : 'bg-white text-sky-600 hover:bg-gray-100'
                }`}
              >
                {!isAuthenticated
                  ? t('pricing.startPro') || 'Start Pro'
                  : currentPlan === 'pro'
                  ? t('pricing.currentPlan') || 'Current plan'
                  : currentPlan === 'free' && canStartProTrial
                  ? t('pricing.modals.trialStart.startTrial') || 'Start Free Trial'
                  : currentPlan === 'free'
                  ? t('pricing.upgradeToPro') || 'Upgrade to Pro'
                  : currentPlan === 'enterprise'
                  ? t('pricing.downgradeToPro') || 'Downgrade to Pro'
                  : t('pricing.subscribeNow')}
              </Button>
              {isAuthenticated && user?.email && !hasPaidProSubscription && (
                <p className="text-xs text-sky-100 text-center mb-2">
                  Your email will be prefilled. Please do not change it.
                </p>
              )}
              <div className="space-y-4">
                {proFeatures.map((feature, idx) => (
                  <div key={idx} className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Check size={14} className="text-white" />
                    </div>
                    <span>{feature}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-3xl shadow-xl overflow-hidden border-2 border-yellow-200 hover:border-yellow-300 transition-colors relative flex flex-col">
            <div className="absolute top-6 right-6 bg-yellow-500 text-white px-4 py-2 rounded-full text-sm font-medium z-10">
              {t('pricing.enterprise.badge')}
            </div>
            <div className="p-8 flex flex-col flex-1">
              <h2 className="text-2xl mb-2">{t('pricing.enterprise.name')}</h2>
              <p className="text-gray-600 mb-6">{t('pricing.enterprise.description')}</p>
              <Button
                onClick={handleEnterprisePlanClick}
                disabled={currentPlan === 'enterprise' || isProcessing}
                className={`w-full py-6 rounded-full mb-6 ${
                  currentPlan === 'enterprise' || isProcessing
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed opacity-50'
                    : 'bg-sky-500 hover:bg-sky-600 text-white'
                }`}
              >
                {currentPlan === 'enterprise'
                  ? t('pricing.currentPlan') || 'Current plan'
                  : isCurrentUserEnterpriseAllowed(user?.artistId)
                  ? t('pricing.enterprise.createSalon') || 'Create Salon'
                  : t('pricing.enterprise.contactUs') || 'Contact Us'}
              </Button>
              <div className="space-y-4 flex-1 overflow-y-auto">
                <p className="text-gray-600 font-medium mb-2 text-sm">{t('pricing.enterprise.includesPro')}</p>
                {enterpriseFeatures.map((feature, idx) => (
                  <div key={idx} className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full bg-yellow-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Check size={14} className="text-yellow-600" />
                    </div>
                    <span className="text-gray-700 text-sm">{feature}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-3xl mx-auto bg-white rounded-3xl shadow-xl p-8 md:p-12">
          <h2 className="text-3xl text-center mb-8">{t('pricing.faq.title')}</h2>
          <div className="space-y-6">
            {faqs.map((faq, idx) => (
              <div key={idx} className="border-b border-gray-100 pb-6 last:border-0">
                <h3 className="text-lg mb-2">{faq.q}</h3>
                <p className="text-gray-600">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </PageContainer>

      <PlanChangeModal
        show={planChangeModal.show}
        onClose={() => setPlanChangeModal({ ...planChangeModal, show: false })}
        changeType={planChangeModal.changeType}
        fromPlan={planChangeModal.fromPlan}
        toPlan={planChangeModal.toPlan}
        onConfirm={handlePlanChangeConfirm}
        isLoading={isProcessingPlanChange}
      />

      <TrialStartModal
        show={trialStartModal.show}
        onClose={() => setTrialStartModal({ show: false, plan: 'pro' })}
        plan={trialStartModal.plan}
        onConfirm={handleTrialStartConfirm}
        isLoading={isProcessingPlanChange}
      />

      <UpgradeNoTrialModal
        show={upgradeNoTrialModal.show}
        onClose={() => setUpgradeNoTrialModal({ show: false, plan: 'pro' })}
        plan={upgradeNoTrialModal.plan}
        onConfirm={handleUpgradeNoTrialConfirm}
        isLoading={isProcessingPlanChange}
      />

      <EnterpriseToProModal
        show={enterpriseToProModal}
        onClose={() => setEnterpriseToProModal(false)}
        onConfirm={handleEnterpriseToProConfirm}
        isLoading={isProcessingPlanChange}
      />
    </div>
  );
}
