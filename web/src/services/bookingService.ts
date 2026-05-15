import { apiRequest } from './apiClient';

export interface Booking {
  id: string;
  client?: string;
  clientName?: string;
  artistId?: string;
  artistName?: string;
  service: string;
  serviceId?: string;
  time: string;
  status: 'pending' | 'confirmed' | 'pending_reschedule' | 'completed' | 'cancelled';
  duration: string;
  price: string | number;
  date: string;
  notes?: string;
}

export interface AvailableSlot {
  time: string;
  available: boolean;
  nextAvailableTime?: string | null;
  isBreak?: boolean;
}

export async function createBooking(payload: {
  artistId: string;
  serviceIds: string[];
  date: string;
  time: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  notes?: string;
}) {
  return apiRequest<Booking>('/bookings', {
    method: 'POST',
    body: {
      ...payload,
      serviceIds: payload.serviceIds,
    },
  });
}

export async function getAvailableSlots(params: {
  artistId: string;
  serviceIds: string;
  date: string;
}) {
  const query = new URLSearchParams({
    artistId: params.artistId,
    serviceIds: params.serviceIds,
    date: params.date,
  });
  return apiRequest<{ 
    slots: AvailableSlot[];
    isHoliday?: boolean;
    holidayDescription?: string;
  }>(`/bookings/available-slots?${query.toString()}`, {
    method: 'GET',
    auth: false,
  });
}

export async function getArtistBookings(date?: string, startDate?: string, endDate?: string) {
  const params = new URLSearchParams();
  if (date) {
    params.append('date', date);
  }
  if (startDate) {
    params.append('startDate', startDate);
  }
  if (endDate) {
    params.append('endDate', endDate);
  }
  const query = params.toString();
  return apiRequest<{ bookings: Booking[] }>(`/bookings/artist${query ? `?${query}` : ''}`);
}

export async function getClientBookings(date?: string) {
  const params = new URLSearchParams();
  if (date) {
    params.append('date', date);
  }
  const query = params.toString();
  return apiRequest<{ bookings: Booking[] }>(`/bookings/client${query ? `?${query}` : ''}`);
}

export async function cancelBooking(bookingId: string) {
  return apiRequest<{ success: boolean; booking: { id: string; status: string } }>(
    `/bookings/${bookingId}/cancel`,
    {
      method: 'PUT',
    }
  );
}

export async function rebookAppointment(
  bookingId: string,
  payload: { date: string; time: string }
) {
  return apiRequest(`/bookings/${bookingId}/rebook`, {
    method: 'POST',
    body: { date: payload.date, time: payload.time },
  });
}

export async function proposeReschedule(
  bookingId: string,
  payload: { newDate: string; newTime: string; message?: string }
) {
  return apiRequest(`/bookings/${bookingId}/propose-reschedule`, {
    method: 'POST',
    body: payload,
  });
}

export interface WalkInClient {
  id: string;
  artistId: string;
  clientName: string;
  clientEmail?: string;
  clientPhone?: string;
  createdAt: string;
}

export interface WalkInClientsResponse {
  walkInClients: WalkInClient[];
}

export async function getWalkInClients() {
  return apiRequest<WalkInClientsResponse>('/WalkInClients');
}

export async function addWalkIn(payload: {
  clientName: string;
  clientEmail?: string;
  clientPhone?: string;
  serviceId: string;
  artistId: string;
  date?: string;
  time?: string;
}) {
  return apiRequest('/bookings/walk-in', {
    method: 'POST',
    body: payload,
  });
}

export async function getPendingRescheduleProposals(role?: 'artist' | 'client') {
  const query = role ? `?role=${role}` : '';
  return apiRequest(`/bookings/reschedule-proposals/pending${query ? query : ''}`);
}

export async function acceptRescheduleProposal(bookingId: string) {
  return apiRequest<Booking>(`/bookings/${bookingId}/accept-reschedule`, {
    method: 'POST',
  });
}

export async function declineRescheduleProposal(bookingId: string) {
  return apiRequest<{ success: boolean; booking: { id: string; status: string } }>(
    `/bookings/${bookingId}/decline-reschedule`,
    {
      method: 'POST',
    }
  );
}
