export interface SalonMember {
  artistId: string;
  userId: string;
  fullName: string;
  role: 'owner' | 'artist';
  profileImageUrl?: string | null;
  profession?: string | null;
  bookings: number;
  revenue: number;
}

export interface SalonInvitation {
  id: string;
  salonId: string;
  email?: string | null;
  phone?: string | null;
  invitedBy: string;
  token: string;
  invitationUrl?: string | null;
  expiresAt: string;
  status: 'pending' | 'accepted' | 'expired' | 'cancelled';
  createdAt: string;
}

export interface SalonSubscription {
  id?: string;
  planType: 'enterprise';
  artistCount: number;
  monthlyCost: number;
  billingCycle: 'monthly' | 'yearly';
  status: 'active' | 'cancelled' | 'expired' | 'trial';
  paddleSubscriptionId?: string | null;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  nextPaymentDate?: string | null;
  paymentMethodMasked?: string | null;
  trialEndsAt?: string | null;
}

export interface Salon {
  id: string;
  name: string;
  ownerId: string;
  ownerArtistId?: string | null;
  address: string;
  city: string;
  country: string;
  phone?: string | null;
  email?: string | null;
  bannerImageUrl?: string | null;
  profileImageUrl?: string | null;
  about?: string | null;
  memberCount: number;
  members: SalonMember[];
  pendingInvitations: SalonInvitation[];
  subscription?: SalonSubscription;
  combinedServices?: string[];
  minPrice?: string | null;
  customBookingLink?: string | null;
}

export interface SalonAnalyticsPoint {
  label: string;
  value: number;
}

export interface SalonArtistPerformance {
  artistId: string;
  artistName: string;
  bookings: number;
  revenue: number;
  clients: number;
}

export interface SalonServicePerformance {
  serviceName: string;
  artistName: string;
  bookings: number;
  revenue: number;
}

export interface SalonAnalytics {
  totalRevenue: number;
  revenueChange: string;
  totalBookings: number;
  bookingsChange: string;
  activeArtists: number;
  newClients: number;
  revenueTrend: SalonAnalyticsPoint[];
  bookingsTrend: SalonAnalyticsPoint[];
  artistPerformance: SalonArtistPerformance[];
  services: SalonServicePerformance[];
}

export interface SalonCalendarBooking {
  id: string;
  artistId: string;
  artistName: string;
  clientName: string;
  service: string;
  date: string;
  time: string;
  duration: number;
  price?: number | null;
  status: string;
}

export interface SalonCalendarResponse {
  bookings: SalonCalendarBooking[];
  totalCount: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface AvailableSalonSlot {
  artistId: string;
  artistName: string;
  time: string;
  available: boolean;
}
