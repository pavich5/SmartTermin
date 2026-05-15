import { apiRequest } from './apiClient';
import {
  AvailableSalonSlot,
  Salon,
  SalonAnalytics,
  SalonCalendarResponse,
  SalonInvitation,
  SalonMember,
  SalonSubscription,
} from '../types/salon';

export interface CreateSalonPayload {
  name: string;
  address: string;
  city: string;
  country: string;
  phone?: string;
  email?: string;
  bannerImageUrl?: string;
  profileImageUrl?: string;
  about?: string;
  customBookingLink?: string;
  artistCount?: number;
  billingCycle?: 'monthly' | 'yearly';
  startWithTrial?: boolean;
}

export interface UpdateSalonPayload {
  name?: string;
  address?: string;
  city?: string;
  country?: string;
  phone?: string;
  email?: string;
  bannerImageUrl?: string;
  about?: string;
  customBookingLink?: string;
}

export interface InviteArtistPayload {
  email?: string;
  phone?: string;
  role?: 'owner' | 'artist';
  message?: string;
}

export interface UpdateSubscriptionPayload {
  artistCount: number;
  billingCycle?: 'monthly' | 'yearly';
  status?: 'active' | 'cancelled' | 'expired';
}

export interface SalonMembersResponse {
  members: SalonMember[];
  pendingInvitations: SalonInvitation[];
}

export async function createSalon(payload: CreateSalonPayload) {
  return apiRequest<Salon>('/salons', { method: 'POST', body: payload });
}

export async function getAllSalons(page?: number, limit?: number) {
  const query = new URLSearchParams();
  if (page) query.append('page', page.toString());
  if (limit) query.append('limit', limit.toString());
  
  const qs = query.toString();
  const path = qs ? `/salons?${qs}` : '/salons';
  
  return apiRequest<{ salons: Salon[]; total: number; page: number; limit: number } | Salon[]>(
    path,
    { method: 'GET', auth: false }
  );
}

export async function getSalon(id: string) {
  return apiRequest<Salon>(`/salons/${id}`, { method: 'GET', auth: false });
}

export async function updateSalon(id: string, payload: UpdateSalonPayload) {
  return apiRequest<Salon>(`/salons/${id}`, { method: 'PUT', body: payload });
}

export async function deleteSalon(id: string) {
  return apiRequest<void>(`/salons/${id}`, { method: 'DELETE' });
}

export async function getSalonMembers(id: string) {
  return apiRequest<SalonMembersResponse>(`/salons/${id}/members`, { method: 'GET' });
}

export async function inviteArtist(id: string, payload: InviteArtistPayload) {
  return apiRequest<SalonInvitation>(`/salons/${id}/invite`, { method: 'POST', body: payload });
}

export async function removeMember(id: string, artistId: string) {
  return apiRequest<void>(`/salons/${id}/members/${artistId}`, { method: 'DELETE' });
}

export async function cancelInvitation(salonId: string, invitationId: string) {
  return apiRequest<void>(`/salons/${salonId}/invitations/${invitationId}`, { method: 'DELETE' });
}

export async function getInvitationByToken(token: string) {
  return apiRequest<SalonInvitation>(`/salons/invitations/${token}`, {
    method: 'GET',
    auth: false,
  });
}

export async function acceptSalonInvitation(token: string) {
  return apiRequest<Salon>(`/salons/invitations/${token}/accept`, { method: 'POST' });
}

export async function leaveSalon(id: string) {
  return apiRequest<void>(`/salons/${id}/leave`, { method: 'POST' });
}

export async function toggleOwnerAsArtist(salonId: string, isArtist: boolean) {
  return apiRequest<{ success: boolean }>(`/salons/${salonId}/toggle-owner-artist`, {
    method: 'POST',
    body: { isArtist },
  });
}

export async function getSalonSubscription(id: string) {
  return apiRequest<SalonSubscription>(`/salons/${id}/subscription`, { method: 'GET' });
}

export async function upsertSalonSubscription(id: string, payload: UpdateSubscriptionPayload) {
  return apiRequest<SalonSubscription>(`/salons/${id}/subscription`, {
    method: 'POST',
    body: payload,
  });
}

export async function cancelSalonSubscription(id: string, keepOwnerSubscription?: boolean) {
  const query = keepOwnerSubscription ? '?keepOwnerSubscription=true' : '';
  return apiRequest<SalonSubscription>(`/salons/${id}/subscription${query}`, {
    method: 'DELETE',
  });
}

export async function getSalonInvoiceUrl(id: string): Promise<string> {
  const response = await apiRequest<{ invoiceUrl: string }>(
    `/salons/${id}/subscription/invoice-url`,
    {
      method: 'GET',
    }
  );
  return response.invoiceUrl;
}

export async function getSalonAnalytics(id: string) {
  return apiRequest<SalonAnalytics>(`/salons/${id}/analytics`, { method: 'GET' });
}

export async function getSalonCalendar(id: string, start?: string, end?: string, page: number = 1, limit: number = 10) {
  const params = new URLSearchParams();
  if (start) params.append('start', start);
  if (end) params.append('end', end);
  params.append('page', page.toString());
  params.append('limit', limit.toString());
  const query = `?${params.toString()}`;
  return apiRequest<SalonCalendarResponse>(`/salons/${id}/calendar${query}`, { method: 'GET' });
}

export async function getAvailableSalonSlots(id: string, date: string) {
  return apiRequest<AvailableSalonSlot[]>(
    `/salons/${id}/available-slots?date=${encodeURIComponent(date)}`,
    {
      method: 'GET',
      auth: false,
    }
  );
}
