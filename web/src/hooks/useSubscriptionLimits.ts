import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getSubscriptionLimits, SubscriptionLimits } from '../services/subscriptionService';

export function useSubscriptionLimits() {
  const { user, isAuthenticated } = useAuth();
  const [limits, setLimits] = useState<SubscriptionLimits | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated || user?.userType !== 'artist') {
      setLoading(false);
      return;
    }

    const fetchLimits = async () => {
      try {
        const data = await getSubscriptionLimits();
        setLimits(data);
      } catch (error) {
        console.error('Failed to fetch subscription limits:', error);

        setLimits({
          planType: 'free',
          isPro: false,
          isFreeTrial: false,
          maxServices: 3,
          currentServices: 0,
          maxPortfolioImages: 5,
          currentPortfolioImages: 0,
          maxBookingsPerMonth: 20,
          currentBookingsThisMonth: 0,
          maxWalkInBookingsPerMonth: 5,
          currentWalkInBookingsThisMonth: 0,
          maxEmailsPerMonth: 50,
          currentEmailsThisMonth: 0,
        });
      } finally {
        setLoading(false);
      }
    };

    fetchLimits();
  }, [isAuthenticated, user]);

  const isPro = (limits?.isPro ?? false) || (limits?.isFreeTrial ?? false);
  const isFree = !isPro;

  return {
    limits,
    loading,
    isPro,
    isFree,
    canCreateService: limits ? limits.currentServices < limits.maxServices : false,
    canUploadPortfolio: limits ? limits.currentPortfolioImages < limits.maxPortfolioImages : false,
    canCreateBooking: limits ? limits.currentBookingsThisMonth < limits.maxBookingsPerMonth : false,
    canCreateWalkIn: limits
      ? limits.currentWalkInBookingsThisMonth < limits.maxWalkInBookingsPerMonth
      : false,
  };
}
