import { apiRequest } from './apiClient';

export interface ArtistListItem {
  id: string;
  name: string;
  profession: string;
  image: string;
  services: string[];
  price: string;
  location: string;
  rating: number;
  salonId?: string;
  customBookingLink?: string;
}

export interface ArtistProfileResponse {
  id: string;
  name: string;
  profession: string;
  bannerImage: string;
  profileImage: string;
  rating: number;
  reviews_total: number;
  location: string;
  phone: string;
  email: string;
  about: string;
  services: Array<{
    id: string;
    name: string;
    duration: number;
    price: number;
    description?: string;
  }>;
  portfolio: string[];
  workingHours: Record<string, string>;
  salonId?: string;
}

interface GetArtistsParams {
  search?: string;
  service?: string;
  page?: number;
  limit?: number;
}

export async function getArtists(params: GetArtistsParams = {}) {
  const query = new URLSearchParams();
  if (params.search) query.append('search', params.search);
  if (params.service && params.service !== 'all') query.append('service', params.service);
  if (params.page) query.append('page', params.page.toString());
  if (params.limit) query.append('limit', params.limit.toString());

  const qs = query.toString();
  const path = qs ? `/artists?${qs}` : '/artists';

  return apiRequest<{ artists: ArtistListItem[]; total: number; page: number; limit: number }>(
    path,
    { auth: false }
  );
}

export async function getArtistById(id: string) {
  return apiRequest<ArtistProfileResponse>(`/artists/${id}`, { auth: false });
}

export interface CreateArtistPayload {
  profession: string;
  businessName: string;
  address: string;
  city: string;
  country: string;
  about?: string;
  bannerImage: File;
  profileImage: File;
  serviceName: string;
  serviceDuration: number;
  servicePrice: number;
  serviceDescription?: string;
  workingHours: Record<string, { start: string; end: string; closed: boolean }>;
}

export async function createArtist(payload: CreateArtistPayload) {
  const formData = new FormData();
  formData.append('profession', payload.profession);
  formData.append('businessName', payload.businessName);
  formData.append('address', payload.address);
  formData.append('city', payload.city);
  formData.append('country', payload.country);
  if (payload.about) formData.append('about', payload.about);
  formData.append('bannerImage', payload.bannerImage);
  formData.append('profileImage', payload.profileImage);
  formData.append('serviceName', payload.serviceName);
  formData.append('serviceDuration', payload.serviceDuration.toString());
  formData.append('servicePrice', payload.servicePrice.toString());
  if (payload.serviceDescription) formData.append('serviceDescription', payload.serviceDescription);
  formData.append('workingHours', JSON.stringify(payload.workingHours));

  return apiRequest('/artists/create', {
    method: 'POST',
    body: formData,
  });
}

export interface ArtistSubscription {
  id: string;
  planType: string;
  billingCycle: string;
  status: string;
  paddleSubscriptionId?: string;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  nextPaymentDate?: string;
  paymentMethodMasked?: string;
  trialEndsAt?: string;
  monthlyCost?: number;
}

export async function getArtistSubscription(artistId: string): Promise<ArtistSubscription | null> {
  try {
    return await apiRequest<ArtistSubscription>(`/artists/${artistId}/subscription`);
  } catch (error: any) {
    if (error?.status === 404) {
      return null;
    }
    throw error;
  }
}

export async function cancelArtistSubscription(artistId: string): Promise<void> {
  await apiRequest<{ message: string }>(`/artists/${artistId}/subscription`, {
    method: 'DELETE',
  });
}

export async function reactivateArtistSubscription(artistId: string): Promise<{ checkoutUrl: string; transactionId?: string }> {
  const response = await apiRequest<{ checkoutUrl: string; message: string; transactionId?: string }>(
    `/artists/${artistId}/subscription/reactivate`,
    {
      method: 'POST',
    }
  );
  return { checkoutUrl: response.checkoutUrl, transactionId: response.transactionId };
}

export async function deleteAccountPermanently(artistId: string): Promise<void> {
  await apiRequest<{ message: string }>(`/artists/${artistId}/account`, {
    method: 'DELETE',
  });
}

export interface PaymentTransaction {
  id: string;
  transactionId: string;
  amount: number;
  currency: string;
  status: 'success' | 'failed';
  date: string;
  subscriptionType: 'monthly' | 'yearly';
  paymentMethod?: string;
  description?: string;
  receiptUrl?: string;
}

export async function getArtistPaymentTransactions(
  artistId: string
): Promise<PaymentTransaction[]> {
  try {
    return await apiRequest<PaymentTransaction[]>(`/artists/${artistId}/subscription/payments`);
  } catch (error: any) {
    if (error?.status === 404) {
      return [];
    }
    throw error;
  }
}
