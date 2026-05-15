import { apiRequest } from './apiClient';

export interface StartTrialResponse {
  message: string;
  hasUsedProTrial?: boolean;
  hasUsedEnterpriseTrial?: boolean;
}

export interface UpdateProcessingFlagResponse {
  message: string;
  isProcessingPlanChange: boolean;
}

export interface SubscriptionLimits {
  planType: 'free' | 'pro';
  isPro: boolean;
  isFreeTrial: boolean;
  maxServices: number;
  currentServices: number;
  maxPortfolioImages: number;
  currentPortfolioImages: number;
  maxBookingsPerMonth: number;
  currentBookingsThisMonth: number;
  maxWalkInBookingsPerMonth: number;
  currentWalkInBookingsThisMonth: number;
  maxEmailsPerMonth: number;
  currentEmailsThisMonth: number;
}

export async function getSubscriptionLimits(): Promise<SubscriptionLimits> {
  return apiRequest<SubscriptionLimits>('/subscription/limits', {
    method: 'GET',
  });
}

export async function startProTrial(): Promise<StartTrialResponse> {
  return apiRequest<StartTrialResponse>('/subscriptions/start-pro-trial', {
    method: 'POST',
  });
}

export async function startEnterpriseTrial(): Promise<StartTrialResponse> {
  return apiRequest<StartTrialResponse>('/subscriptions/start-enterprise-trial', {
    method: 'POST',
  });
}

export async function updateProcessingFlag(isProcessing: boolean): Promise<UpdateProcessingFlagResponse> {
  return apiRequest<UpdateProcessingFlagResponse>('/subscriptions/update-processing-flag', {
    method: 'POST',
    body: { isProcessing },
  });
}
