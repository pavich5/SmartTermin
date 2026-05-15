export type UserType = 'artist' | 'client';
export type SubscriptionPlan = 'free' | 'pro';

export interface User {
  id: string;
  phone: string;
  fullName: string;
  userType: UserType;
  email?: string;
  isFreeTrialActive?: boolean;
  onboardingCompleted?: boolean;
  isOnboardingCompleted?: boolean;
  artistId?: string;
  subscriptionPlan?: SubscriptionPlan;
  salonId?: string | null;
  salonRole?: 'owner' | 'artist';
  isArtistInSalon?: boolean;
  // Trial and abuse prevention flags
  hasUsedProTrial?: boolean;
  hasUsedEnterpriseTrial?: boolean;
  hasCreatedSalon?: boolean;
  isProcessingPlanChange?: boolean;
}
