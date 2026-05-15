import { apiRequest } from './apiClient';

export interface DashboardAnalytics {
  revenue: { total: number; change: string };
  totalBookings: { count: number; change: string };
  newClients: { count: number; change: string };
  returningClients: { percentage: number; change: string };
  avgBookingValue: { amount: number; currency: string };
  activeServices: { count: number };
}

export interface PopularService {
  id: string;
  name: string;
  bookings: number;
  revenue: string;
}

export async function getDashboardAnalytics(period?: string) {
  const query = period ? `?period=${encodeURIComponent(period)}` : '';
  return apiRequest<DashboardAnalytics>(`/analytics/dashboard${query}`);
}

export async function getPopularServices() {
  return apiRequest<{ services: PopularService[] }>('/analytics/popular-services');
}
