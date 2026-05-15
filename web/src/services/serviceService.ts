import { apiRequest } from './apiClient';

export interface ServiceItem {
  id: string;
  name: string;
  duration: number;
  price: number;
  description: string;
  bookings?: number;
  revenue?: string;
}

export async function getArtistServices() {
  return apiRequest<{ services: ServiceItem[] }>('/services/artist');
}

export async function createService(payload: {
  name: string;
  duration: number;
  price: number;
  description: string;
}) {
  return apiRequest<ServiceItem>('/services', {
    method: 'POST',
    body: payload,
  });
}

export async function updateService(serviceId: string, payload: Partial<Omit<ServiceItem, 'id'>>) {
  return apiRequest<ServiceItem>(`/services/${serviceId}`, {
    method: 'PUT',
    body: payload,
  });
}

export async function deleteService(serviceId: string) {
  return apiRequest(`/services/${serviceId}`, {
    method: 'DELETE',
  });
}
