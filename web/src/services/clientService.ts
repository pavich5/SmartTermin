import { apiRequest } from './apiClient';

export interface ClientItem {
  id?: string;
  clientId?: string;
  name: string;
  email: string;
  phone: string;
  bookings: number;
}

export async function getArtistClients(limit?: number | 'all') {
  const query = limit ? `?limit=${limit}` : '';
  return apiRequest<{ clients: ClientItem[] }>(`/clients/artist${query}`);
}
