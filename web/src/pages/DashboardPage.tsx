import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useSalon } from '../contexts/SalonContext';
import { useTranslation } from '../hooks/useTranslation';
import { toast } from 'sonner';
import { format, isSameDay, isWithinInterval, startOfDay, endOfDay } from 'date-fns';
import { DateRange } from 'react-day-picker';
import { DashboardSidebar } from '../components/dashboard/DashboardSidebar';
import { DashboardStats } from '../components/dashboard/DashboardStats';
import { CalendarView } from '../components/dashboard/CalendarView';
import { BookingsList } from '../components/dashboard/BookingsList';
import { ClientsList } from '../components/dashboard/ClientsList';
import { ServicesList } from '../components/dashboard/ServicesList';
import { PortfolioGrid } from '../components/dashboard/PortfolioGrid';
import { AnalyticsView } from '../components/dashboard/AnalyticsView';
import { SettingsView } from '../components/dashboard/SettingsView';
import { PaymentsView } from '../components/dashboard/PaymentsView';
import { FreeTrialView } from '../components/dashboard/FreeTrialView';
import { UpgradePrompt } from '../components/dashboard/UpgradePrompt';
import { useSubscriptionLimits } from '../hooks/useSubscriptionLimits';
import { AddServiceModal } from '../components/dashboard/modals/AddServiceModal';
import { EditServiceModal } from '../components/dashboard/modals/EditServiceModal';
import { DeleteServiceModal } from '../components/dashboard/modals/DeleteServiceModal';
import { WalkInModal } from '../components/dashboard/modals/WalkInModal';
import { CancelBookingModal } from '../components/dashboard/modals/CancelBookingModal';
import { RebookModal } from '../components/dashboard/modals/RebookModal';
import { ProposeRescheduleModal } from '../components/dashboard/modals/ProposeRescheduleModal';
import { AddPortfolioModal } from '../components/dashboard/modals/AddPortfolioModal';
import { CancelSubscriptionModal } from '../components/dashboard/modals/CancelSubscriptionModal';
import { ReactivateSubscriptionModal } from '../components/dashboard/modals/ReactivateSubscriptionModal';
import { Button } from '../components/ui/button';
import { getDateLocale } from '../utils/dateLocale';
import { LoadingState } from '../components/ui/LoadingState';
import { PageContainer } from '../components/ui/PageContainer';
import {
  getArtistBookings,
  cancelBooking as cancelBookingRequest,
  rebookAppointment,
  proposeReschedule,
  addWalkIn,
  getAvailableSlots,
} from '../services/bookingService';
import {
  getArtistSubscription,
  cancelArtistSubscription,
  reactivateArtistSubscription,
  getArtistPaymentTransactions,
  deleteAccountPermanently,
  ArtistSubscription,
  PaymentTransaction,
} from '../services/artistService';
import { openPaddleCheckout, openPaddleCheckoutWithTransaction } from '../utils/paddle';
import { plans } from '../constants/paddle';
import {
  getArtistServices,
  createService as createServiceRequest,
  updateService as updateServiceRequest,
  deleteService as deleteServiceRequest,
  ServiceItem,
} from '../services/serviceService';
import { getArtistClients, ClientItem } from '../services/clientService';
import {
  getPortfolioImages,
  uploadPortfolioImage,
  setBannerImage,
  setProfilePicture,
  deletePortfolioImage,
  PortfolioImage,
} from '../services/portfolioService';
import {
  getDashboardAnalytics,
  getPopularServices,
  DashboardAnalytics,
  PopularService,
} from '../services/analyticsService';
import {
  getWorkingHours,
  updateWorkingHours,
  WorkingHoursResponse,
} from '../services/settingsService';
import {
  updateProfile as updateProfileRequest,
  updateArtistProfile,
  UpdateArtistProfileResponse,
} from '../services/authService';
import { cancelSalonSubscription } from '../services/salonService';
import { Booking } from '../services/bookingService';
import { getOnboardingCompleted, clearStoredAuth, clearOnboardingCompleted } from '../services/apiClient';
import { formatPriceInMKDInt, formatPriceInMKD } from '../utils/priceFormat';

export function DashboardPage() {
  const { user, isAuthenticated, isLoading: authLoading, updateUser, refreshUser } = useAuth();
  const { salon, isMember, isOwner } = useSalon();
  const { t, language } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const dateLocale = getDateLocale(language);
  const numberLocale = language === 'mk' ? 'mk-MK' : 'en-US';
  const { isPro } = useSubscriptionLimits();
  const [isProcessingEnterpriseDowngrade, setIsProcessingEnterpriseDowngrade] = useState(false);
  const [enterpriseDowngradeHandled, setEnterpriseDowngradeHandled] = useState(false);
  const [activeTab, setActiveTab] = useState('calendar');
  const [selectedBooking, setSelectedBooking] = useState<string | null>(null);
  const [showAddServiceModal, setShowAddServiceModal] = useState(false);
  const [showEditServiceModal, setShowEditServiceModal] = useState(false);
  const [showDeleteServiceModal, setShowDeleteServiceModal] = useState(false);
  const [showWalkInModal, setShowWalkInModal] = useState(false);
  const [isSavingService, setIsSavingService] = useState(false);
  const [isAddingWalkIn, setIsAddingWalkIn] = useState(false);
  const [isCancelingBooking, setIsCancelingBooking] = useState(false);
  const [isOpeningCheckout, setIsOpeningCheckout] = useState(false);
  const [isSavingWorkingHours, setIsSavingWorkingHours] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isSavingBusiness, setIsSavingBusiness] = useState(false);
  const [isSavingCancellationTime, setIsSavingCancellationTime] = useState(false);
  const [isDeletingService, setIsDeletingService] = useState(false);
  const [isRebooking, setIsRebooking] = useState(false);
  const [isProposingReschedule, setIsProposingReschedule] = useState(false);
  const [settingBannerId, setSettingBannerId] = useState<string | null>(null);
  const [settingProfileId, setSettingProfileId] = useState<string | null>(null);
  const [deletingImageId, setDeletingImageId] = useState<string | null>(null);
  const [editingService, setEditingService] = useState<any>(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
  const [bookings, setBookings] = useState<
    Array<{
      id: string;
      client: string;
      service: string;
      serviceId?: string;
      time: string;
      status: string;
      duration: string;
      price: string;
      date: Date;
    }>
  >([]);
  const [showCancelBookingModal, setShowCancelBookingModal] = useState(false);
  const [bookingToCancel, setBookingToCancel] = useState<string | null>(null);
  const [showRebookModal, setShowRebookModal] = useState(false);
  const [bookingToRebook, setBookingToRebook] = useState<any>(null);
  const [rebookDate, setRebookDate] = useState<Date | null>(null);
  const [rebookTime, setRebookTime] = useState<string>('');
  const [rebookTimeSlots, setRebookTimeSlots] = useState<
    Array<{ time: string; available: boolean; nextAvailableTime?: string | null }>
  >([]);
  const [isLoadingRebookSlots, setIsLoadingRebookSlots] = useState(false);
  const [showAllClients, setShowAllClients] = useState(false);
  const [showAddPortfolioModal, setShowAddPortfolioModal] = useState(false);
  const [isUploadingPortfolioImage, setIsUploadingPortfolioImage] = useState(false);
  const [selectedImageForAction, setSelectedImageForAction] = useState<string | null>(null);
  const [showProposeRescheduleModal, setShowProposeRescheduleModal] = useState(false);
  const [bookingToReschedule, setBookingToReschedule] = useState<any>(null);
  const [rescheduleDate, setRescheduleDate] = useState<Date | null>(null);
  const [rescheduleTime, setRescheduleTime] = useState<string>('');
  const [rescheduleMessage, setRescheduleMessage] = useState<string>('');
  const [rescheduleTimeSlots, setRescheduleTimeSlots] = useState<
    Array<{ time: string; available: boolean; nextAvailableTime?: string | null }>
  >([]);
  const [isLoadingRescheduleSlots, setIsLoadingRescheduleSlots] = useState(false);
  const [maxCancellationHours, setMaxCancellationHours] = useState<number | null>(24);
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  const [payments, setPayments] = useState<any[]>([]);
  const [subscription, setSubscription] = useState<ArtistSubscription | null>(null);
  const [freeTrial, setFreeTrial] = useState<{
    isOnTrial: boolean;
    trialEndDate?: Date;
    daysRemaining?: number;
  } | null>(null);
  const [showCancelSubscriptionModal, setShowCancelSubscriptionModal] = useState(false);
  const [showReactivateSubscriptionModal, setShowReactivateSubscriptionModal] = useState(false);
  const [clients, setClients] = useState<ClientItem[]>([]);
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [popularServices, setPopularServices] = useState<PopularService[]>([]);
  const [analytics, setAnalytics] = useState<DashboardAnalytics | null>(null);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [servicesLoaded, setServicesLoaded] = useState(false);

  const [portfolioImages, setPortfolioImages] = useState<PortfolioImage[]>([]);

  const [profileFullName, setProfileFullName] = useState(user?.fullName || '');
  const [profileEmail, setProfileEmail] = useState(user?.email || '');
  const [profilePhone, setProfilePhone] = useState(user?.phone || '');
  const [profileBusinessName, setProfileBusinessName] = useState('');
  const [profileBio, setProfileBio] = useState('');
  const [businessAddress, setBusinessAddress] = useState('');
  const [businessCity, setBusinessCity] = useState('');
  const [businessCountry, setBusinessCountry] = useState('');
  
  // Store initial values for change detection
  const initialProfileValues = useRef<{
    fullName: string;
    email: string;
    phone: string;
    businessName: string;
    bio: string;
  } | null>(null);
  const initialBusinessValues = useRef<{
    address: string;
    city: string;
    country: string;
  } | null>(null);
  const initialCancellationHours = useRef<number | null>(null);
  const initialWorkingHours = useRef<WorkingHoursResponse | null>(null);
  
  const [workingHours, setWorkingHours] = useState<WorkingHoursResponse>({
    monday: { start: '09:00', end: '18:00', closed: false },
    tuesday: { start: '09:00', end: '18:00', closed: false },
    wednesday: { start: '09:00', end: '18:00', closed: false },
    thursday: { start: '09:00', end: '20:00', closed: false },
    friday: { start: '09:00', end: '20:00', closed: false },
    saturday: { start: '10:00', end: '17:00', closed: false },
    sunday: { start: '09:00', end: '18:00', closed: true },
  });

  useEffect(() => {
    if (authLoading) return;

    const params = new URLSearchParams(location.search);
    const isEnterpriseToProDowngrade = params.get('downgrade') === 'enterprise_to_pro';

    // Skip redirects while processing enterprise -> pro downgrade finalization
    if (isEnterpriseToProDowngrade || isProcessingEnterpriseDowngrade) {
      return;
    }

    if (!isAuthenticated) {
      navigate(`/auth?returnTo=${encodeURIComponent(location.pathname)}`);
      return;
    }

    if (user?.userType !== 'artist') {
      navigate('/profile');
      return;
    }

    const localStorageCompleted = getOnboardingCompleted();
    const userCompleted = user.isOnboardingCompleted ?? user.onboardingCompleted;

    const onboardingCompleted = localStorageCompleted || userCompleted;

    if (!onboardingCompleted) {
      navigate('/onboarding');
      return;
    }

    // Handle salon members (owners and artists)
    if (user?.salonId) {
      // If user has salonId but salon context is null (salon was deleted), clear it
      if (!salon && user?.salonId) {
        updateUser({ salonId: null, salonRole: null });
        refreshUser();
        // Stay on dashboard, don't redirect
        return;
      }
      
      // If user is a salon member (artist role, not owner) and has artistId, redirect to their dashboard
      if (user?.salonRole === 'artist' && user?.artistId) {
        navigate(`/dashboard/${user.artistId}`);
        return;
      }
      
      // If user is salon owner
      if (user?.salonRole === 'owner') {
        // Only redirect if salon actually exists
        if (salon) {
          // Owners should go to enterprise dashboard, not artist dashboard
          // Only redirect if they're not already on enterprise page
          if (!location.pathname.startsWith('/enterprise')) {
            navigate('/enterprise');
            return;
          }
        }
      }
    }

    if (!isPro) {
    }
  }, [isAuthenticated, authLoading, user, navigate, location.pathname, isPro, isProcessingEnterpriseDowngrade, location.search]);

  useEffect(() => {
    if (authLoading || enterpriseDowngradeHandled) return;

    const params = new URLSearchParams(location.search);
    const isEnterpriseToProDowngrade = params.get('downgrade') === 'enterprise_to_pro';
    const salonIdFromParams = params.get('salonId');

    if (!isEnterpriseToProDowngrade) return;

    const targetSalonId = salonIdFromParams || user?.salonId;
    if (!targetSalonId) {
      setEnterpriseDowngradeHandled(true);
      toast.error(t('toast.downgradeFailed'));
      return;
    }

    const finalizeDowngrade = async () => {
      try {
        setIsProcessingEnterpriseDowngrade(true);
        await cancelSalonSubscription(targetSalonId, true);
        await refreshUser();
        toast.success(t('toast.switchedToPro'));
      } catch (error) {
        console.error('Failed to finalize enterprise to pro downgrade', error);
        toast.error(t('toast.paymentSucceededButFailed'));
      } finally {
        setIsProcessingEnterpriseDowngrade(false);
        setEnterpriseDowngradeHandled(true);

        // Clean up query params to avoid reprocessing
        const cleaned = new URLSearchParams(location.search);
        cleaned.delete('downgrade');
        cleaned.delete('salonId');
        navigate(
          {
            pathname: location.pathname,
            search: cleaned.toString() ? `?${cleaned.toString()}` : '',
          },
          { replace: true }
        );
      }
    };

    finalizeDowngrade();
  }, [authLoading, enterpriseDowngradeHandled, location.pathname, location.search, navigate, refreshUser, user?.salonId]);

  useEffect(() => {
    if (user) {
      setProfileFullName(user.fullName || '');
      setProfileEmail(user.email || '');
      setProfilePhone(user.phone || '');
    }
  }, [user?.fullName, user?.email, user?.phone]);

  const mapBookings = (list: Booking[]) =>
    list.map((booking) => {
      let formattedPrice: string;
      if (typeof booking.price === 'number') {
        // Price is in MKD
        formattedPrice = formatPriceInMKDInt(booking.price);
      } else {
        // Parse and format as MKD
        formattedPrice = formatPriceInMKDInt(booking.price);
      }
      return {
        id: String(booking.id),
        client: booking.client || booking.clientName || '',
        service: booking.service,
        serviceId: booking.serviceId,
        time: booking.time,
        status: booking.status,
        duration:
          typeof booking.duration === 'number' ? `${booking.duration} min` : booking.duration,
        price: formattedPrice,
        date: new Date(booking.date),
      };
    });

  const refreshBookings = async (startDate?: string, endDate?: string) => {
    const bookingsResponse = await getArtistBookings(undefined, startDate, endDate);
    setBookings(mapBookings(bookingsResponse.bookings));
  };

  const refreshClients = async () => {
    try {
      const clientsResponse = await getArtistClients('all');
      setClients(
        (clientsResponse.clients || []).map((client) => ({
          ...client,
          clientId: client.clientId || client.id,
          bookings: client.bookings ?? 0,
        }))
      );
    } catch (error) {
      console.error('Failed to refresh clients:', error);
    }
  };

  useEffect(() => {
    const loadDashboardData = async () => {
      if (!user || user.userType !== 'artist') return;
      setIsLoadingData(true);
      try {
        const [
          bookingsResponse,
          clientsResponse,
          analyticsResponse,
          popularServicesResponse,
          portfolioResponse,
          workingHoursResponse,
          artistProfileResponse,
          servicesResponse,
        ] = await Promise.all([
          getArtistBookings(),
          getArtistClients('all'),
          getDashboardAnalytics().catch((error) => {
            // Handle 403 gracefully - user doesn't have Pro plan
            if (error?.status === 403 || error?.code === 'ANALYTICS_PRO_ONLY') {
              return null;
            }
            throw error;
          }),
          getPopularServices().catch((error) => {
            // Handle 403 gracefully - user doesn't have Pro plan
            if (error?.status === 403 || error?.code === 'ANALYTICS_PRO_ONLY') {
              return { services: [] };
            }
            throw error;
          }),
          getPortfolioImages(),
          getWorkingHours(),
          updateArtistProfile({}).catch(() => null as UpdateArtistProfileResponse | null),
          getArtistServices(),
        ]);

        setBookings(mapBookings(bookingsResponse.bookings));
        setClients(
          (clientsResponse.clients || []).map((client) => ({
            ...client,
            bookings: client.bookings ?? 0,
          }))
        );
        setAnalytics(analyticsResponse || null);
        setPopularServices(popularServicesResponse.services || []);
        setPortfolioImages(portfolioResponse.images || []);
        setWorkingHours(workingHoursResponse);
        setServices(
          (servicesResponse.services || []).map((service) => ({
            ...service,
            bookings: service.bookings ?? 0,
            revenue: service.revenue ? formatPriceInMKDInt(service.revenue) : '0 ден.',
          }))
        );
        setServicesLoaded(true);

        if (artistProfileResponse) {
          setProfileBusinessName(artistProfileResponse.businessName || '');
          setBusinessAddress(artistProfileResponse.address || '');
          setBusinessCity(artistProfileResponse.city || '');
          setBusinessCountry(artistProfileResponse.country || '');
          setProfileBio(artistProfileResponse.about || '');
          if (
            artistProfileResponse.maximumCancellationHours !== null &&
            artistProfileResponse.maximumCancellationHours !== undefined
          ) {
            setMaxCancellationHours(artistProfileResponse.maximumCancellationHours);
          }
        }

        // Store initial values for change detection
        if (user) {
          initialProfileValues.current = {
            fullName: user.fullName || '',
            email: user.email || '',
            phone: user.phone || '',
            businessName: artistProfileResponse?.businessName || '',
            bio: artistProfileResponse?.about || '',
          };
        }
        if (artistProfileResponse) {
          initialBusinessValues.current = {
            address: artistProfileResponse.address || '',
            city: artistProfileResponse.city || '',
            country: artistProfileResponse.country || '',
          };
          initialCancellationHours.current = artistProfileResponse.maximumCancellationHours ?? 24;
        }
        initialWorkingHours.current = workingHoursResponse;

        if (user?.artistId) {
          try {
            const [subscriptionData, paymentTransactions] = await Promise.all([
              getArtistSubscription(user.artistId).catch(() => null),
              getArtistPaymentTransactions(user.artistId).catch(() => []),
            ]);

            if (subscriptionData) {
              setSubscription(subscriptionData);

              if (subscriptionData.trialEndsAt && !subscriptionData.paddleSubscriptionId) {
                const trialEndDate = new Date(subscriptionData.trialEndsAt);
                const now = new Date();
                const daysRemaining = Math.ceil(
                  (trialEndDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
                );

                if (daysRemaining > 0 && subscriptionData.status === 'active') {
                  setFreeTrial({
                    isOnTrial: true,
                    trialEndDate,
                    daysRemaining,
                  });
                } else {
                  setFreeTrial(null);
                }
              } else {
                setFreeTrial(null);
              }
            } else {
              setSubscription(null);
              setFreeTrial(null);
            }

            const mappedPayments = paymentTransactions.map(
              (tx, index) =>
                ({
                  id: index + 1,
                  transactionId: tx.transactionId || tx.id,
                  amount: tx.amount,
                  currency: tx.currency || 'ден.',
                  status: tx.status,
                  date: new Date(tx.date),
                  subscriptionType: tx.subscriptionType,
                  paymentMethod: tx.paymentMethod || 'card',
                  description: tx.description || `Pro ${tx.subscriptionType} subscription`,
                  receiptUrl: tx.receiptUrl,
                }) as any
            );
            setPayments(mappedPayments);
          } catch (error) {
            console.error('Failed to load subscription data', error);
            setSubscription(null);
            setFreeTrial(null);
            setPayments([]);
          }
        } else {
          setFreeTrial(null);
          setPayments([]);
        }
      } catch (error: any) {
        console.error('Failed to load dashboard data', error);
        // Don't show error toast for 403 analytics errors (expected when not on Pro plan)
        if (error?.status !== 403 && error?.code !== 'ANALYTICS_PRO_ONLY') {
          toast.error(t('toast.profileSaveFailed'), {
            description: t('toast.profileSaveFailedDesc'),
          });
        }
      } finally {
        setIsLoadingData(false);
      }
    };

    loadDashboardData();
  }, [user?.id, user?.userType, user?.artistId, isAuthenticated]);

  useEffect(() => {
    if (activeTab === 'bookings' && dateRange?.from && dateRange?.to && user) {
      const startDate = format(dateRange.from, 'yyyy-MM-dd');
      const endDate = format(dateRange.to, 'yyyy-MM-dd');
      refreshBookings(startDate, endDate);
    } else if (activeTab === 'bookings' && !dateRange && user) {
      refreshBookings();
    }
  }, [dateRange, activeTab, user?.id]);

  useEffect(() => {
    const fetchRebookSlots = async () => {
      if (!rebookDate || !bookingToRebook || !user?.artistId) {
        setRebookTimeSlots([]);
        return;
      }

      const service = services.find((s) => s.name === bookingToRebook.service);
      if (!service || !service.id) {
        setRebookTimeSlots(
          generateTimeSlots(rebookDate).map((time) => ({ time, available: true }))
        );
        return;
      }

      setIsLoadingRebookSlots(true);
      try {
        const dateStr = format(rebookDate, 'yyyy-MM-dd');
        const response = await getAvailableSlots({
          artistId: user.artistId,
          serviceIds: String(service.id),
          date: dateStr,
        });

        const slots = response.slots
          .map((slot) => {
            const timeStr = slot.time.trim();
            const timeMatch = timeStr.match(/(\d+):(\d+)\s*(AM|PM)?/i);
            let formattedTime = timeStr;

            if (timeMatch) {
              let hours = parseInt(timeMatch[1], 10);
              const minutes = parseInt(timeMatch[2], 10);
              const period = timeMatch[3]?.toUpperCase();

              if (period === 'PM' && hours !== 12) {
                hours += 12;
              } else if (period === 'AM' && hours === 12) {
                hours = 0;
              }

              formattedTime = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
            }

            return {
              time: formattedTime,
              available: slot.available,
              nextAvailableTime: slot.nextAvailableTime,
              isBreak: slot.isBreak ?? false,
            };
          })
          .filter((slot) => {
            if (!slot.time) return false;

            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const rebookDateOnly = rebookDate ? new Date(rebookDate) : null;
            if (rebookDateOnly) {
              rebookDateOnly.setHours(0, 0, 0, 0);
              const isToday = rebookDateOnly.getTime() === today.getTime();

              if (isToday) {
                const [hours, minutes] = slot.time.split(':').map(Number);
                const slotTime = new Date();
                slotTime.setHours(hours, minutes, 0, 0);
                const now = new Date();

                if (slotTime < now) {
                  return false;
                }
              }
            }

            return true;
          })
          .map((slot) => {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const rebookDateOnly = rebookDate ? new Date(rebookDate) : null;
            if (rebookDateOnly) {
              rebookDateOnly.setHours(0, 0, 0, 0);
              const isToday = rebookDateOnly.getTime() === today.getTime();

              let isAvailable = slot.available;
              if (isToday && slot.time) {
                const [hours, minutes] = slot.time.split(':').map(Number);
                const slotTime = new Date();
                slotTime.setHours(hours, minutes, 0, 0);
                const now = new Date();

                if (slotTime < now) {
                  isAvailable = false;
                }
              }

              return {
                ...slot,
                available: isAvailable,
              };
            }

            return slot;
          })
          .sort((a, b) => a.time.localeCompare(b.time));

        setRebookTimeSlots(slots);
      } catch (error) {
        console.error('Failed to fetch available slots for rebooking', error);

        setRebookTimeSlots(
          generateTimeSlots(rebookDate).map((time) => ({ time, available: true }))
        );
      } finally {
        setIsLoadingRebookSlots(false);
      }
    };

    fetchRebookSlots();
  }, [rebookDate, bookingToRebook, services, user?.artistId]);

  useEffect(() => {
    const fetchRescheduleSlots = async () => {
      if (!rescheduleDate || !bookingToReschedule || !user?.artistId) {
        setRescheduleTimeSlots([]);
        return;
      }

      const service = services.find((s) => s.name === bookingToReschedule.service);
      if (!service || !service.id) {
        setRescheduleTimeSlots(
          generateTimeSlots(rescheduleDate).map((time) => ({ time, available: true }))
        );
        return;
      }

      setIsLoadingRescheduleSlots(true);
      try {
        const dateStr = format(rescheduleDate, 'yyyy-MM-dd');
        const response = await getAvailableSlots({
          artistId: user.artistId,
          serviceIds: String(service.id),
          date: dateStr,
        });

        const slots = response.slots
          .map((slot) => {
            const timeStr = slot.time.trim();
            const timeMatch = timeStr.match(/(\d+):(\d+)\s*(AM|PM)?/i);
            let formattedTime = timeStr;

            if (timeMatch) {
              let hours = parseInt(timeMatch[1], 10);
              const minutes = parseInt(timeMatch[2], 10);
              const period = timeMatch[3]?.toUpperCase();

              if (period === 'PM' && hours !== 12) {
                hours += 12;
              } else if (period === 'AM' && hours === 12) {
                hours = 0;
              }

              formattedTime = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
            }

            return {
              time: formattedTime,
              available: slot.available,
              nextAvailableTime: slot.nextAvailableTime,
              isBreak: slot.isBreak ?? false,
            };
          })
          .filter((slot) => {
            if (!slot.time) return false;

            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const rescheduleDateOnly = rescheduleDate ? new Date(rescheduleDate) : null;
            if (rescheduleDateOnly) {
              rescheduleDateOnly.setHours(0, 0, 0, 0);
              const isToday = rescheduleDateOnly.getTime() === today.getTime();

              if (isToday) {
                const [hours, minutes] = slot.time.split(':').map(Number);
                const slotTime = new Date();
                slotTime.setHours(hours, minutes, 0, 0);
                const now = new Date();

                if (slotTime < now) {
                  return false;
                }
              }
            }

            return true;
          })
          .map((slot) => {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const rescheduleDateOnly = rescheduleDate ? new Date(rescheduleDate) : null;
            if (rescheduleDateOnly) {
              rescheduleDateOnly.setHours(0, 0, 0, 0);
              const isToday = rescheduleDateOnly.getTime() === today.getTime();

              let isAvailable = slot.available;
              if (isToday && slot.time) {
                const [hours, minutes] = slot.time.split(':').map(Number);
                const slotTime = new Date();
                slotTime.setHours(hours, minutes, 0, 0);
                const now = new Date();

                if (slotTime < now) {
                  isAvailable = false;
                }
              }

              return {
                ...slot,
                available: isAvailable,
              };
            }

            return slot;
          })
          .sort((a, b) => a.time.localeCompare(b.time));

        setRescheduleTimeSlots(slots);
      } catch (error) {
        console.error('Failed to fetch available slots for reschedule', error);

        setRescheduleTimeSlots(
          generateTimeSlots(rescheduleDate).map((time) => ({ time, available: true }))
        );
      } finally {
        setIsLoadingRescheduleSlots(false);
      }
    };

    fetchRescheduleSlots();
  }, [rescheduleDate, bookingToReschedule, services, user?.artistId]);

  const handleDeleteAccount = async () => {
    if (!user?.artistId) {
      toast.error(t('toast.artistNotFound'));
      return;
    }

    try {
      await deleteAccountPermanently(user.artistId);
      
      // Clear all local storage immediately (don't call logout API since user is already deleted)
      // This prevents the app from trying to refresh user data
      clearStoredAuth();
      clearOnboardingCompleted();
      
      // Show success message
      toast.success(t('settings.deleteAccount.success') || 'Account deleted successfully');
      
      // Immediately redirect to home page with full page reload
      // This ensures AuthContext detects no stored auth and clears all state
      window.location.href = '/';
    } catch (error: any) {
      console.error('Failed to delete account', error);
      toast.error(
        error?.message || 
        t('settings.deleteAccount.error') || 
        'Failed to delete account. Please try again.'
      );
    }
  };

  const handleSetBanner = async (imageId: string) => {
    if (settingBannerId) return;
    setSettingBannerId(imageId);
    try {
      const response = await setBannerImage(imageId);
      const isCurrentlyBanner = portfolioImages.find((img) => img.id === imageId)?.isBannerImage;

      setPortfolioImages((prevImages) =>
        prevImages.map((img) => ({
          ...img,
          isBannerImage: img.id === imageId ? !!response.image.isBannerImage : false,
          isProfilePicture: img.isProfilePicture,
        }))
      );

      toast.success(isCurrentlyBanner ? t('toast.bannerRemoved') : t('toast.bannerUpdated'), {
        description: isCurrentlyBanner
          ? t('toast.bannerRemovedDesc')
          : t('toast.bannerUpdatedDesc'),
      });
    } catch (error) {
      toast.error(t('toast.uploadFailed'), {
        description: t('toast.uploadFailedDesc'),
      });
    } finally {
      setSettingBannerId(null);
    }
  };

  const handleSetProfilePicture = async (imageId: string) => {
    if (settingProfileId) return;
    setSettingProfileId(imageId);
    try {
      const response = await setProfilePicture(imageId);
      const isCurrentlyProfile = portfolioImages.find(
        (img) => img.id === imageId
      )?.isProfilePicture;

      setPortfolioImages((prevImages) =>
        prevImages.map((img) => ({
          ...img,
          isBannerImage: img.isBannerImage,
          isProfilePicture: img.id === imageId ? !!response.image.isProfilePicture : false,
        }))
      );

      toast.success(
        isCurrentlyProfile ? t('toast.profilePictureRemoved') : t('toast.profilePictureUpdated'),
        {
          description: isCurrentlyProfile
            ? t('toast.profilePictureRemovedDesc')
            : t('toast.profilePictureUpdatedDesc'),
        }
      );
    } catch (error) {
      toast.error(t('toast.uploadFailed'), {
        description: t('toast.uploadFailedDesc'),
      });
    } finally {
      setSettingProfileId(null);
    }
  };

  const handleDeleteImage = async (imageId: string) => {
    if (deletingImageId) return;
    setDeletingImageId(imageId);
    try {
      const imageToDelete = portfolioImages.find((img) => img.id === imageId);
      if (!imageToDelete) {
        setDeletingImageId(null);
        return;
      }

      const totalImages = portfolioImages.length;
      const bannerImages = portfolioImages.filter((img) => img.isBannerImage);
      const profilePictures = portfolioImages.filter((img) => img.isProfilePicture);

      if (totalImages <= 2) {
        toast.error(t('toast.cannotDeleteImage'), {
          description: t('toast.portfolioMinImages'),
        });
        setDeletingImageId(null);
        return;
      }

      if (imageToDelete.isBannerImage && bannerImages.length === 1) {
        toast.error(t('toast.cannotDeleteImage'), {
          description: t('toast.cannotDeleteOnlyBanner'),
        });
        setDeletingImageId(null);
        return;
      }

      if (imageToDelete.isProfilePicture && profilePictures.length === 1) {
        toast.error(t('toast.cannotDeleteImage'), {
          description: t('toast.cannotDeleteOnlyProfile'),
        });
        setDeletingImageId(null);
        return;
      }

      await deletePortfolioImage(imageId);
      setPortfolioImages((prevImages) => prevImages.filter((img) => img.id !== imageId));
      setSelectedImageForAction(null);

      toast.success(t('toast.imageDeleted'), {
        description: t('toast.imageDeletedDesc'),
      });
    } catch (error: any) {
      const errorMessage = error?.details?.message || error?.message || 'Failed to delete image';
      toast.error(t('toast.failedToDeleteImage'), {
        description: errorMessage,
      });
    } finally {
      setDeletingImageId(null);
    }
  };

  if (authLoading) {
    return <LoadingState message="Loading..." />;
  }

  if (!isAuthenticated || user?.userType !== 'artist') {
    return null;
  }

  const smallestDuration = services.length > 0 ? Math.min(...services.map((s) => s.duration)) : 30;
  const timeInterval =
    smallestDuration >= 60 ? 60 : smallestDuration >= 30 ? 30 : smallestDuration >= 15 ? 15 : 5;

  const generateTimeSlots = (forDate?: Date) => {
    const slots: string[] = [];
    const dateToUse = forDate || new Date();
    const dayKeys: Array<keyof WorkingHoursResponse> = [
      'sunday',
      'monday',
      'tuesday',
      'wednesday',
      'thursday',
      'friday',
      'saturday',
    ];
    const dayKey = dayKeys[dateToUse.getDay()];
    const hoursForDay = workingHours[dayKey];

    if (hoursForDay?.closed) {
      return [];
    }

    const [startHourString, startMinuteString] = (hoursForDay?.start || '09:00').split(':');
    const [endHourString, endMinuteString] = (hoursForDay?.end || '18:00').split(':');
    const startHour = parseInt(startHourString, 10);
    const endHour = parseInt(endHourString, 10);
    const endMinutes = parseInt(endMinuteString || '0', 10);

    for (let hour = startHour; hour < endHour; hour++) {
      for (let minute = 0; minute < 60; minute += timeInterval) {
        const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        slots.push(timeString);
      }
    }

    if (endMinutes > 0) {
      slots.push(`${endHourString.padStart(2, '0')}:${endMinuteString.padStart(2, '0')}`);
    }
    return slots;
  };

  const getBookingsForDate = (date: Date | null) => {
    if (!date) return [];
    return bookings.filter((booking) => isSameDay(booking.date, date));
  };

  const getBookingsForDateRange = (range: DateRange | undefined) => {
    if (!range || !range.from) return [];
    const from = startOfDay(range.from);
    const to = range.to ? endOfDay(range.to) : endOfDay(range.from);

    return bookings.filter((booking) => {
      const bookingDate = startOfDay(booking.date);
      return isWithinInterval(bookingDate, { start: from, end: to });
    });
  };

  const hasBookings = (date: Date) => {
    return bookings.some((booking) => isSameDay(booking.date, date));
  };

  const canCancelBooking = (
    booking: any
  ): {
    allowed: boolean;
    message?: string;
    hoursUntilDeadline?: number;
    hoursUntilAppointment?: number;
  } => {
    if (!booking || !booking.date || !booking.time) {
      return { allowed: false, message: t('dashboard.bookings.invalidBooking') };
    }

    const bookingDate = new Date(booking.date);
    const [hours, minutes] = booking.time.split(':').map(Number);
    const appointmentDateTime = new Date(bookingDate);
    appointmentDateTime.setHours(hours, minutes, 0, 0);

    const cancellationDeadline = new Date(appointmentDateTime);
    cancellationDeadline.setHours(cancellationDeadline.getHours() - maxCancellationHours);

    const now = new Date();
    const hoursUntilAppointment = Math.ceil(
      (appointmentDateTime.getTime() - now.getTime()) / (1000 * 60 * 60)
    );
    const hoursUntilDeadline = Math.ceil(
      (cancellationDeadline.getTime() - now.getTime()) / (1000 * 60 * 60)
    );

    if (now > cancellationDeadline) {
      return {
        allowed: false,
        message: t('dashboard.bookings.cancellationNotAllowed', {
          hours: maxCancellationHours,
          hoursUntil: hoursUntilAppointment,
          hourText:
            hoursUntilAppointment !== 1
              ? t('dashboard.bookings.hours')
              : t('dashboard.bookings.hour'),
        }),
        hoursUntilAppointment,
      };
    }

    return {
      allowed: true,
      hoursUntilDeadline: Math.max(0, hoursUntilDeadline),
      hoursUntilAppointment,
    };
  };

  const handleCancelBooking = (bookingId: string) => {
    setBookingToCancel(bookingId);
    setShowCancelBookingModal(true);
  };

  const confirmCancelBooking = async () => {
    if (bookingToCancel) {
      const booking = bookings.find((b) => b.id === bookingToCancel);
      if (!booking) {
        toast.error(t('toast.bookingNotFound'));
        return;
      }

      const cancellationCheck = canCancelBooking(booking);
      if (!cancellationCheck.allowed) {
        toast.error(t('toast.cannotCancelBooking'), {
          description: cancellationCheck.message || t('toast.cannotCancelBookingDesc'),
        });
        return;
      }

      if (isCancelingBooking) return;
      setIsCancelingBooking(true);
      try {
        await cancelBookingRequest(bookingToCancel);
        setBookings((prevBookings) =>
          prevBookings.map((booking) =>
            booking.id === bookingToCancel ? { ...booking, status: 'cancelled' as const } : booking
          )
        );
        setShowCancelBookingModal(false);
        setBookingToCancel(null);
        setSelectedBooking(null);
        toast.success(t('toast.bookingCancelled'), {
          description: t('toast.bookingCancelledDesc'),
        });
      } catch (error) {
        console.error('Failed to cancel booking', error);
        toast.error(t('toast.cannotCancelBooking'), {
          description: t('toast.cannotCancelBookingDesc'),
        });
      } finally {
        setIsCancelingBooking(false);
      }
    }
  };

  const handleRebookBooking = (booking: any) => {
    setBookingToRebook(booking);
    setRebookDate(new Date());
    setRebookTime('');
    setRebookTimeSlots([]);
    setShowRebookModal(true);
  };

  const confirmRebookBooking = async () => {
    if (bookingToRebook && rebookDate && rebookTime) {
      if (isRebooking) return;
      setIsRebooking(true);
      try {
        await rebookAppointment(bookingToRebook.id, {
          date: format(rebookDate, 'yyyy-MM-dd'),
          time: rebookTime,
        });
        await refreshBookings();
        setShowRebookModal(false);
        setBookingToRebook(null);
        setRebookDate(null);
        setRebookTime('');
        setSelectedDate(rebookDate);
        toast.success(t('toast.bookingRebooked'), {
          description: t('toast.bookingRebookedDesc'),
        });
      } catch (error) {
        console.error('Failed to rebook booking', error);
        toast.error(t('toast.rescheduleProposalFailed'), {
          description: t('toast.rescheduleProposalFailedDesc'),
        });
      } finally {
        setIsRebooking(false);
      }
    }
  };

  const handleProposeReschedule = (booking: any) => {
    setBookingToReschedule(booking);
    setRescheduleDate(new Date());
    setRescheduleTime('');
    setRescheduleMessage('');
    setRescheduleTimeSlots([]);
    setShowProposeRescheduleModal(true);
  };

  const confirmProposeReschedule = async () => {
    if (bookingToReschedule && rescheduleDate && rescheduleTime) {
      if (isProposingReschedule) return;
      setIsProposingReschedule(true);
      try {
        await proposeReschedule(bookingToReschedule.id, {
          newDate: format(rescheduleDate, 'yyyy-MM-dd'),
          newTime: rescheduleTime,
          message: rescheduleMessage || undefined,
        });
        await refreshBookings();

        setShowProposeRescheduleModal(false);
        setBookingToReschedule(null);
        setRescheduleDate(null);
        setRescheduleTime('');
        setRescheduleMessage('');

        toast.success(t('toast.rescheduleProposalSent'), {
          description: t('toast.rescheduleProposalSentDesc'),
        });
      } catch (error) {
        toast.error(t('toast.rescheduleProposalFailed'), {
          description: t('toast.rescheduleProposalFailedDesc'),
        });
      } finally {
        setIsProposingReschedule(false);
      }
    }
  };

  const today = new Date();
  const filteredBookings =
    activeTab === 'bookings' && dateRange && dateRange.from
      ? getBookingsForDateRange(dateRange)
      : activeTab === 'bookings'
        ? getBookingsForDate(today)
        : selectedDate
          ? getBookingsForDate(selectedDate)
          : [];

  const getDateHeader = () => {
    if (activeTab === 'bookings' && dateRange?.from) {
      if (dateRange.to) {
        if (isSameDay(dateRange.from, dateRange.to)) {
          return t('dashboard.bookings.forDate', {
            date: format(dateRange.from, 'MMMM d, yyyy', { locale: dateLocale }),
          });
        }
        return t('dashboard.bookings.fromTo', {
          from: format(dateRange.from, 'MMM d', { locale: dateLocale }),
          to: format(dateRange.to, 'MMM d, yyyy', { locale: dateLocale }),
        });
      }
      return t('dashboard.bookings.fromDate', {
        date: format(dateRange.from, 'MMMM d, yyyy', { locale: dateLocale }),
      });
    }
    if (activeTab === 'bookings') return t('dashboard.bookings.today');
    if (!selectedDate) return t('dashboard.bookings.today');
    if (isSameDay(selectedDate, today)) return t('dashboard.bookings.today');
    return t('dashboard.bookings.forDate', {
      date: format(selectedDate, 'MMMM d, yyyy', { locale: dateLocale }),
    });
  };

  const totalRevenueValue = analytics?.revenue.total ?? 0;
  // Convert from MKD to EUR if needed
  const totalRevenue = formatPriceInMKDInt(totalRevenueValue);
  const totalBookings = analytics?.totalBookings.count ?? 0;
  const activeServices = analytics?.activeServices.count ?? services.length;
  const avgBookingValue = totalBookings
    ? formatPriceInMKDInt(analytics?.avgBookingValue?.amount ?? totalRevenueValue / totalBookings)
    : '0 ден.';

  const stats = [
    {
      label: t('dashboard.stats.revenue'),
      value: totalRevenue,
      change: analytics?.revenue.change || '',
      color: 'bg-sky-500',
    },
    {
      label: t('dashboard.stats.totalBookings'),
      value: String(totalBookings),
      change: analytics?.totalBookings.change || '',
      color: 'bg-sky-500',
    },
    {
      label: t('dashboard.stats.newClients'),
      value: String(analytics?.newClients.count ?? 0),
      change: analytics?.newClients.change || '',
      color: 'bg-sky-500',
    },
    {
      label: t('dashboard.stats.returningClients'),
      value: `${analytics?.returningClients.percentage ?? 0}%`,
      change: analytics?.returningClients.change || '',
      color: 'bg-sky-500',
    },
  ];

  const handleAddService = async (service: {
    name: string;
    duration: string;
    price: string;
    description: string;
  }) => {
    if (isSavingService) return;
    setIsSavingService(true);
    try {
      const created = await createServiceRequest({
        name: service.name.trim(),
        duration: parseInt(service.duration, 10),
        price: parseFloat(service.price),
        description: service.description.trim() || '',
      });
      setServices((prev) => [
        ...prev,
        {
          ...created,
          bookings: 0,
          revenue: '0 ден.',
        },
      ]);
      setShowAddServiceModal(false);
      toast.success(t('toast.serviceAdded'), {
        description: t('toast.serviceAddedDesc'),
      });
    } catch (error: any) {
      console.error('Failed to add service', error);

      if (
        error?.code === 'SERVICE_LIMIT_REACHED' ||
        error?.message?.includes('Service limit reached')
      ) {
        toast.error(t('toast.serviceLimitReached'), {
          description:
            error.message || t('toast.serviceLimitReachedDesc', { max: 3, current: limits?.currentServices || 0 }),
          action: {
            label: t('toast.upgrade'),
            onClick: () => navigate('/pricing'),
          },
        });
      } else {
        toast.error(t('toast.profileSaveFailed'), {
          description: t('toast.profileSaveFailedDesc'),
        });
      }
    } finally {
      setIsSavingService(false);
    }
  };

  const handleEditService = async (service: {
    id?: string;
    name: string;
    duration: string;
    price: string;
    description: string;
  }) => {
    if (!editingService?.id || isSavingService) return;
    setIsSavingService(true);
    try {
      const updated = await updateServiceRequest(String(editingService.id), {
        name: service.name,
        duration: parseInt(service.duration, 10),
        price: parseFloat(service.price),
        description: service.description,
      });
      setServices((prev) =>
        prev.map((item) => (String(item.id) === String(updated.id) ? updated : item))
      );
      setShowEditServiceModal(false);
      toast.success(t('toast.serviceUpdated'), {
        description: t('toast.serviceUpdatedDesc'),
      });
    } catch (error) {
      console.error('Failed to update service', error);
      toast.error(t('toast.profileSaveFailed'), {
        description: t('toast.profileSaveFailedDesc'),
      });
    } finally {
      setIsSavingService(false);
    }
  };

  const handleDeleteService = async () => {
    if (!editingService?.id) return;
    if (isDeletingService) return;

    if (services.length === 1) {
      toast.error(t('toast.profileSaveFailed'), {
        description: t('toast.profileSaveFailedDesc'),
      });
      setShowDeleteServiceModal(false);
      return;
    }

    setIsDeletingService(true);
    try {
      await deleteServiceRequest(String(editingService.id));
      setServices((prev) =>
        prev.filter((service) => String(service.id) !== String(editingService.id))
      );
      toast.success(t('toast.serviceDeleted'), {
        description: t('toast.serviceDeletedDesc'),
      });
      setShowDeleteServiceModal(false);
    } catch (error) {
      console.error('Failed to delete service', error);
      toast.error(t('toast.profileSaveFailed'), {
        description: t('toast.profileSaveFailedDesc'),
      });
    } finally {
      setIsDeletingService(false);
    }
  };

  const handleWalkIn = async (data: {
    clientName: string;
    clientEmail: string;
    clientPhone: string;
    serviceId: string;
    date: string;
    time: string;
  }) => {
    if (!data.clientName || !data.serviceId) {
      toast.error(t('toast.fillRequiredFields'), {
        description: t('toast.fillRequiredFieldsDesc'),
      });
      return;
    }
    if (isAddingWalkIn) return;
    const artistId = user?.artistId;
    if (!artistId) {
      toast.error(t('toast.profileSaveFailed'), {
        description: 'Unable to determine artist ID. Please try logging in again.',
      });
      return;
    }

    setIsAddingWalkIn(true);
    try {
      await addWalkIn({
        clientName: data.clientName,
        clientEmail: data.clientEmail,
        clientPhone: data.clientPhone,
        serviceId: data.serviceId,
        artistId: artistId,
        date: data.date,
        time: data.time,
      });
      toast.success(t('toast.walkInAdded'), {
        description: t('toast.walkInAddedDesc'),
      });
      setShowWalkInModal(false);
      refreshBookings();
      refreshClients();
    } catch (error) {
      console.error('Failed to add walk-in', error);
      toast.error(t('toast.profileSaveFailed'), {
        description: t('toast.profileSaveFailedDesc'),
      });
    } finally {
      setIsAddingWalkIn(false);
    }
  };

  const handleAddPortfolioImage = async (data: {
    file: File;
    setAsBanner: boolean;
    setAsProfile: boolean;
  }) => {
    // Create a temporary placeholder image with loading state
    const placeholderId = `uploading-${Date.now()}`;
    const placeholderImage: PortfolioImage = {
      id: placeholderId,
      url: '',
      isBannerImage: false,
      isProfilePicture: false,
      isUploading: true,
    };

    try {
      setIsUploadingPortfolioImage(true);
      // Add placeholder to show loader in grid
      setPortfolioImages((prev) => [...prev, placeholderImage]);
      
      const uploaded = await uploadPortfolioImage(data.file);
      // Replace placeholder with actual uploaded image
      setPortfolioImages((prev) => 
        prev.map((img) => img.id === placeholderId ? uploaded : img)
      );

      if (data.setAsBanner) {
        const response = await setBannerImage(uploaded.id);
        setPortfolioImages((prev) =>
          prev.map((img) => ({
            ...img,
            isBannerImage: img.id === response.image.id,
          }))
        );
      }

      if (data.setAsProfile) {
        const response = await setProfilePicture(uploaded.id);
        setPortfolioImages((prev) =>
          prev.map((img) => ({
            ...img,
            isProfilePicture: img.id === response.image.id,
          }))
        );
      }

      toast.success(t('toast.portfolioImageAdded'), {
        description: data.setAsBanner
          ? t('toast.portfolioImageBannerDesc')
          : data.setAsProfile
            ? t('toast.portfolioImageProfileDesc')
            : t('toast.portfolioImageAddedDesc'),
      });
      setShowAddPortfolioModal(false);
    } catch (error: any) {
      if (
        error?.code === 'PORTFOLIO_LIMIT_REACHED' ||
        error?.message?.includes('Portfolio limit reached')
      ) {
        toast.error(t('toast.portfolioLimitReached'), {
          description:
            error.message ||
            t('toast.portfolioLimitReachedDesc', { max: 5, current: limits?.currentPortfolioImages || 0 }),
          action: {
            label: t('toast.upgrade'),
            onClick: () => navigate('/pricing'),
          },
        });
      } else {
        toast.error(t('toast.uploadFailed'), {
          description: t('toast.uploadFailedDesc'),
        });
      }
      // Remove placeholder on error
      setPortfolioImages((prev) => prev.filter((img) => img.id !== placeholderId));
    } finally {
      setIsUploadingPortfolioImage(false);
    }
  };

  const handleWorkingHoursChange = (
    day: string,
    field: 'start' | 'end' | 'closed' | 'breaks',
    value: string | boolean
  ) => {
    setWorkingHours((prev) => ({
      ...prev,
      [day]: {
        ...prev[day as keyof typeof prev],
        [field]: value,
      },
    }));
  };

  const handleBreakAdd = (day: string, breakData: { start: string; end: string }) => {
    setWorkingHours((prev) => ({
      ...prev,
      [day]: {
        ...prev[day as keyof typeof prev],
        breaks: [
          ...(prev[day as keyof typeof prev].breaks || []),
          { start: breakData.start, end: breakData.end },
        ],
      },
    }));
  };

  const handleBreakAddToAll = (breakData: { start: string; end: string }) => {
    setWorkingHours((prev) => {
      const updated = { ...prev };
      const dayKeys = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] as const;
      
      dayKeys.forEach((dayKey) => {
        const dayHours = updated[dayKey];
        if (!dayHours.closed) {
          updated[dayKey] = {
            ...dayHours,
            breaks: [
              ...(dayHours.breaks || []),
              { start: breakData.start, end: breakData.end },
            ],
          };
        }
      });
      
      return updated;
    });
  };

  const handleBreakRemove = (day: string, breakIndex: number) => {
    setWorkingHours((prev) => {
      const dayData = prev[day as keyof typeof prev];
      const breaks = dayData.breaks || [];
      return {
        ...prev,
        [day]: {
          ...dayData,
          breaks: breaks.filter((_, index) => index !== breakIndex),
        },
      };
    });
  };

  const handleBreakChange = (
    day: string,
    breakIndex: number,
    field: 'start' | 'end',
    value: string
  ) => {
    setWorkingHours((prev) => {
      const dayData = prev[day as keyof typeof prev];
      const breaks = [...(dayData.breaks || [])];
      breaks[breakIndex] = {
        ...breaks[breakIndex],
        [field]: value,
      };
      return {
        ...prev,
        [day]: {
          ...dayData,
          breaks,
        },
      };
    });
  };

  const handleWorkingHoursSave = async () => {
    if (isSavingWorkingHours) return;
    
    // Check if working hours have changed
    const initial = initialWorkingHours.current;
    if (initial) {
      const hasChanges = JSON.stringify(initial) !== JSON.stringify(workingHours);
      if (!hasChanges) {
        toast.info(t('toast.noChangesToSave'));
        return;
      }
    }
    
    setIsSavingWorkingHours(true);
    try {
      const response = await updateWorkingHours(workingHours);
      setWorkingHours(response.workingHours);
      
      // Update initial values after successful save
      initialWorkingHours.current = response.workingHours;
      
      toast.success(t('toast.workingHoursSaved'), {
        description: t('toast.workingHoursSavedDesc'),
      });
    } catch (error) {
      console.error('Failed to update working hours', error);
      toast.error(t('toast.profileSaveFailed'), {
        description: t('toast.profileSaveFailedDesc'),
      });
    } finally {
      setIsSavingWorkingHours(false);
    }
  };

  const handleProfileSave = async () => {
    if (isSavingProfile) return;
    
    // Check if values have changed
    const initial = initialProfileValues.current;
    if (initial) {
      const hasChanges =
        initial.fullName !== profileFullName ||
        initial.email !== (profileEmail || '') ||
        initial.phone !== profilePhone ||
        initial.businessName !== profileBusinessName ||
        initial.bio !== profileBio;
      
      if (!hasChanges) {
        toast.info(t('toast.noChangesToSave'));
        return;
      }
    }
    
    setIsSavingProfile(true);
    try {
      await updateProfileRequest({
        fullName: profileFullName,
        email: profileEmail || undefined,
        phone: profilePhone,
        businessName: profileBusinessName,
        about: profileBio,
      });

      await refreshUser();

      // Update initial values after successful save
      if (initialProfileValues.current) {
        initialProfileValues.current = {
          fullName: profileFullName,
          email: profileEmail || '',
          phone: profilePhone,
          businessName: profileBusinessName,
          bio: profileBio,
        };
      }

      toast.success(t('toast.profileSettingsSaved'), {
        description: t('toast.profileSettingsSavedDesc'),
      });
    } catch (error) {
      console.error('Failed to update profile', error);
      toast.error(t('toast.profileSaveFailed'), {
        description: t('toast.profileSaveFailedDesc'),
      });
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleBusinessSave = async () => {
    if (isSavingBusiness) return;
    
    // Check if values have changed
    const initial = initialBusinessValues.current;
    if (initial) {
      const hasChanges =
        initial.address !== businessAddress ||
        initial.city !== businessCity ||
        initial.country !== businessCountry;
      
      if (!hasChanges) {
        toast.info(t('toast.noChangesToSave'));
        return;
      }
    }
    
    setIsSavingBusiness(true);
    try {
      await updateArtistProfile({
        businessName: profileBusinessName,
        address: businessAddress,
        city: businessCity,
        country: businessCountry,
      });
      
      // Update initial values after successful save
      if (initialBusinessValues.current) {
        initialBusinessValues.current = {
          address: businessAddress,
          city: businessCity,
          country: businessCountry,
        };
      }
      
      toast.success(t('toast.businessSettingsSaved'), {
        description: t('toast.businessSettingsSavedDesc'),
      });
    } catch (error) {
      console.error('Failed to update business info', error);
      toast.error(t('toast.profileSaveFailed'), {
        description: t('toast.profileSaveFailedDesc'),
      });
    } finally {
      setIsSavingBusiness(false);
    }
  };

  const handleCancellationTimeSave = async () => {
    if (maxCancellationHours === null || maxCancellationHours === 0) {
      toast.error(t('toast.validationError'), {
        description: t('settings.booking.cancellationTimeRequired'),
      });
      return;
    }
    if (isSavingCancellationTime) return;

    // Check if value has changed
    if (initialCancellationHours.current !== null && initialCancellationHours.current === maxCancellationHours) {
                  toast.info(t('toast.noChangesToSave'));
      return;
    }

    setIsSavingCancellationTime(true);
    try {
      await updateArtistProfile({
        maximumCancellationHours: maxCancellationHours,
      });
      
      // Update initial value after successful save
      initialCancellationHours.current = maxCancellationHours;
      
      toast.success(t('toast.bookingSettingsSaved'), {
        description: t('toast.bookingSettingsSavedDesc', { hours: maxCancellationHours }),
      });
    } catch (error) {
      console.error('Failed to update cancellation time', error);
      toast.error(t('toast.profileSaveFailed'), {
        description: t('toast.profileSaveFailedDesc'),
      });
    } finally {
      setIsSavingCancellationTime(false);
    }
  };

  const bookingToCancelData = bookingToCancel
    ? bookings.find((b) => b.id === bookingToCancel)
    : null;
  const cancellationCheck = bookingToCancelData
    ? canCancelBooking(bookingToCancelData)
    : { allowed: false, message: '' };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-12 overflow-x-hidden">
      <PageContainer>
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-sky-700 mb-2">
            {t('dashboard.title')}
          </h1>
          <p className="text-gray-600">{t('dashboard.subtitle')}</p>
          {isLoadingData && <p className="text-sm text-gray-500 mt-2">Loading latest data...</p>}
        </div>

        {freeTrial && freeTrial.isOnTrial && (
          <div className="bg-sky-500 rounded-2xl shadow-lg p-6 text-white mb-6 lg:hidden">
            <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
              <div className="flex items-center gap-4">
                <div>
                  <p className="text-lg font-semibold">
                    {t('dashboard.freeTrial.endsIn')} {freeTrial.daysRemaining}{' '}
                    {freeTrial.daysRemaining !== 1
                      ? t('dashboard.freeTrial.daysPlural')
                      : t('dashboard.freeTrial.days')}
                  </p>
                  <p className="text-sm text-white/90">
                    {t('dashboard.freeTrial.trialEndsOn')}{' '}
                    {format(freeTrial.trialEndDate!, 'MMMM d, yyyy', { locale: dateLocale })}
                  </p>
                </div>
              </div>
              <Button
                onClick={async () => {
                  if (!user?.email) {
                    toast.error(t('toast.validationError'), {
                      description: 'Please ensure your email is set in your profile.',
                    });
                    return;
                  }
                  if (isOpeningCheckout) return;

                  setIsOpeningCheckout(true);
                  try {
                    const monthlyPriceId = plans[0].priceId.month;
                    await openPaddleCheckout(monthlyPriceId, 1, user.email, {
                      userId: user.id,
                      userType: 'artist',
                      artistId: user.artistId,
                    });
                  } catch (error) {
                    console.error('Failed to open Paddle checkout:', error);
                    toast.error(t('pricing.errors.checkoutFailed'));
                  } finally {
                    setIsOpeningCheckout(false);
                  }
                }}
                disabled={isOpeningCheckout}
                className="bg-white text-sky-600 hover:bg-gray-100 rounded-full font-semibold disabled:opacity-50"
              >
                {isOpeningCheckout ? t('dashboard.freeTrial.openingCheckout') || 'Opening checkout...' : t('dashboard.freeTrial.subscribeNow')}
              </Button>
            </div>
          </div>
        )}

        <div className="grid lg:grid-cols-4 gap-6 w-full">
          <div className="lg:col-span-1 w-full">
            <DashboardSidebar
              user={user!}
              activeTab={activeTab}
              onTabChange={setActiveTab}
              profilePictureUrl={portfolioImages.find((img) => img.isProfilePicture)?.url || null}
              isSalonMember={false}
            />
          </div>

          <div className="lg:col-span-3 space-y-6 w-full min-w-0">
            {}
            {freeTrial && freeTrial.isOnTrial && (
              <div className="bg-sky-500 rounded-2xl shadow-lg p-6 text-white hidden lg:block">
                <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div>
                      <p className="text-lg font-semibold">
                        {t('dashboard.freeTrial.endsIn')} {freeTrial.daysRemaining}{' '}
                        {freeTrial.daysRemaining !== 1
                          ? t('dashboard.freeTrial.daysPlural')
                          : t('dashboard.freeTrial.days')}
                      </p>
                      <p className="text-sm text-white/90">
                        {t('dashboard.freeTrial.trialEndsOn')}{' '}
                        {format(freeTrial.trialEndDate!, 'MMMM d, yyyy', { locale: dateLocale })}
                      </p>
                    </div>
                  </div>
                  <Button
                    onClick={async () => {
                      if (!user?.email) {
                        toast.error(t('toast.validationError'), {
                          description: 'Please ensure your email is set in your profile.',
                        });
                        return;
                      }
                      if (isOpeningCheckout) return;

                      setIsOpeningCheckout(true);
                      try {
                        const monthlyPriceId = plans[0].priceId.month;
                        await openPaddleCheckout(monthlyPriceId, 1, user.email, {
                          userId: user.id,
                          userType: 'artist',
                          artistId: user.artistId,
                        });
                      } catch (error) {
                        console.error('Failed to open Paddle checkout:', error);
                        toast.error(t('pricing.errors.checkoutFailed'));
                      } finally {
                        setIsOpeningCheckout(false);
                      }
                    }}
                    disabled={isOpeningCheckout}
                    className="bg-white text-sky-600 hover:bg-gray-100 rounded-full font-semibold disabled:opacity-50"
                  >
                    {isOpeningCheckout ? t('dashboard.freeTrial.openingCheckout') || 'Opening checkout...' : t('dashboard.freeTrial.subscribeNow')}
                  </Button>
                </div>
              </div>
            )}
            {subscription && (subscription.status === 'cancelled' || subscription.status === 'canceled') && (
              <div className="bg-sky-500 rounded-2xl shadow-lg p-6 text-white">
                <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div>
                      <p className="text-lg font-semibold">
                        {t('dashboard.subscriptionCanceled.title')}
                      </p>
                      <p className="text-sm text-white/90">
                        {t('dashboard.subscriptionCanceled.description')}
                      </p>
                    </div>
                  </div>
                  <Button
                    onClick={() => setShowReactivateSubscriptionModal(true)}
                    className="bg-white text-sky-600 hover:bg-gray-100 rounded-full font-semibold"
                  >
                    {t('dashboard.subscriptionCanceled.reactivateNow')}
                  </Button>
                </div>
              </div>
            )}

            <DashboardStats stats={stats} />

            {activeTab === 'calendar' && (
              <CalendarView
                currentMonth={currentMonth}
                selectedDate={selectedDate}
                today={today}
                hasBookings={hasBookings}
                onMonthChange={setCurrentMonth}
                onDateSelect={setSelectedDate}
              />
            )}

            {(activeTab === 'calendar' || activeTab === 'bookings') && (
              <BookingsList
                bookings={filteredBookings}
                selectedBooking={selectedBooking}
                dateHeader={getDateHeader()}
                dateRange={activeTab === 'bookings' ? dateRange : undefined}
                onDateRangeChange={activeTab === 'bookings' ? setDateRange : undefined}
                canCancelBooking={canCancelBooking}
                onBookingSelect={setSelectedBooking}
                onCancelBooking={handleCancelBooking}
                onRebookBooking={handleRebookBooking}
                onProposeReschedule={handleProposeReschedule}
                onAddWalkIn={() => setShowWalkInModal(true)}
              />
            )}

            {activeTab === 'clients' && (
              <ClientsList
                clients={clients}
                showAllClients={showAllClients}
                onToggleShowAll={() => setShowAllClients(!showAllClients)}
                artistId={user?.artistId}
                salonId={user?.salonId || undefined}
                userType={user?.salonRole === 'owner' ? 'salon' : 'artist'}
                onClientBlocked={refreshClients}
              />
            )}

            {activeTab === 'analytics' && (
              <>
                {isPro ? (
                  <AnalyticsView
                    services={popularServices.length ? popularServices : services}
                    totalRevenue={totalRevenue}
                    totalBookings={totalBookings}
                    activeServices={activeServices}
                    avgBookingValue={avgBookingValue}
                  />
                ) : (
                  <UpgradePrompt
                    title={t('common.unlockAnalyticsDashboard')}
                    message={t('common.analyticsProMessage')}
                    feature={t('common.analyticsProFeatures')}
                  />
                )}
              </>
            )}

            {activeTab === 'payments' && (
              <>
                {freeTrial && freeTrial.isOnTrial ? (
                  <FreeTrialView
                    trialEndDate={freeTrial.trialEndDate}
                    daysRemaining={freeTrial.daysRemaining}
                    onUpgrade={() => {
                      toast.info(t('toast.redirectingToPricing'), {
                        description: t('toast.redirectingToPricingDesc'),
                      });
                    }}
                  />
                ) : (
                  <PaymentsView
                    payments={payments}
                    subscription={
                      subscription
                        ? {
                            isActive: subscription.status === 'active',
                            type: subscription.billingCycle === 'yearly' ? 'yearly' : 'monthly',
                            startDate: new Date(subscription.currentPeriodStart),
                            nextBillingDate: subscription.nextPaymentDate
                              ? new Date(subscription.nextPaymentDate)
                              : new Date(subscription.currentPeriodEnd),

                            amount:
                              subscription.monthlyCost ??
                              (payments.length > 0 ? payments[0].amount : 20.0),
                            currency: 'ден.',
                          }
                        : null
                    }
                    onCancelSubscription={() => setShowCancelSubscriptionModal(true)}
                    onReactivateSubscription={() => setShowReactivateSubscriptionModal(true)}
                    onViewInvoice={async (paymentId) => {
                      const payment = payments.find((p) => p.id === paymentId);
                      if (payment && 'receiptUrl' in payment && payment.receiptUrl) {
                        window.open(payment.receiptUrl, '_blank');
                      } else {
                        toast.info(t('payments.invoiceNotAvailable') || 'Invoice not available', {
                          description: 'Invoice URL not available.',
                        });
                      }
                    }}
                  />
                )}
              </>
            )}

            {activeTab === 'portfolio' && (
              <PortfolioGrid
                images={portfolioImages}
                selectedImageForAction={selectedImageForAction}
                onAddImage={() => setShowAddPortfolioModal(true)}
                onImageClick={setSelectedImageForAction}
                onCloseImageOptions={() => setSelectedImageForAction(null)}
                onSetBanner={handleSetBanner}
                onSetProfilePicture={handleSetProfilePicture}
                onDeleteImage={handleDeleteImage}
                settingBannerId={settingBannerId}
                settingProfileId={settingProfileId}
                deletingImageId={deletingImageId}
              />
            )}

            {activeTab === 'services' && (
              <ServicesList
                services={services}
                timeInterval={timeInterval}
                onAddService={() => setShowAddServiceModal(true)}
                onEditService={(service) => {
                  setEditingService(service);
                  setShowEditServiceModal(true);
                }}
                onDeleteService={(service) => {
                  setEditingService(service);
                  setShowDeleteServiceModal(true);
                }}
              />
            )}

            {activeTab === 'settings' && (
              <SettingsView
                profileFullName={profileFullName}
                profileEmail={profileEmail}
                profilePhone={profilePhone}
                profileBusinessName={profileBusinessName}
                profileBio={profileBio}
                onProfileFullNameChange={setProfileFullName}
                onProfileEmailChange={setProfileEmail}
                onProfilePhoneChange={setProfilePhone}
                onProfileBusinessNameChange={setProfileBusinessName}
                onProfileBioChange={setProfileBio}
                onProfileSave={handleProfileSave}
                businessAddress={businessAddress}
                businessCity={businessCity}
                businessCountry={businessCountry}
                onBusinessAddressChange={setBusinessAddress}
                onBusinessCityChange={setBusinessCity}
                onBusinessCountryChange={setBusinessCountry}
                onBusinessSave={handleBusinessSave}
                maxCancellationHours={maxCancellationHours}
                onMaxCancellationHoursChange={setMaxCancellationHours}
                onCancellationTimeSave={handleCancellationTimeSave}
                workingHours={workingHours}
                onWorkingHoursChange={handleWorkingHoursChange}
                onBreakAdd={handleBreakAdd}
                onBreakAddToAll={handleBreakAddToAll}
                onBreakRemove={handleBreakRemove}
                onBreakChange={handleBreakChange}
                onWorkingHoursSave={handleWorkingHoursSave}
                onDeleteAccount={handleDeleteAccount}
                artistId={user?.artistId}
              />
            )}
          </div>
        </div>
      </PageContainer>

      <AddServiceModal
        show={showAddServiceModal}
        onClose={() => setShowAddServiceModal(false)}
        onSave={handleAddService}
        isLoading={isSavingService}
      />

      <EditServiceModal
        show={showEditServiceModal}
        onClose={() => setShowEditServiceModal(false)}
        service={editingService}
        onSave={handleEditService}
        isLoading={isSavingService}
      />

      <DeleteServiceModal
        show={showDeleteServiceModal}
        onClose={() => setShowDeleteServiceModal(false)}
        service={editingService}
        onConfirm={handleDeleteService}
        isLoading={isDeletingService}
      />

      <WalkInModal
        show={showWalkInModal}
        onClose={() => setShowWalkInModal(false)}
        services={services}
        artistId={user?.artistId || ''}
        onSave={handleWalkIn}
        isLoading={isAddingWalkIn}
      />

      <CancelBookingModal
        show={showCancelBookingModal}
        onClose={() => {
          setShowCancelBookingModal(false);
          setBookingToCancel(null);
        }}
        booking={bookingToCancelData}
        cancellationCheck={cancellationCheck}
        onConfirm={confirmCancelBooking}
        isLoading={isCancelingBooking}
      />

      <RebookModal
        show={showRebookModal}
        onClose={() => {
          setShowRebookModal(false);
          setBookingToRebook(null);
          setRebookDate(null);
          setRebookTime('');
        }}
        booking={bookingToRebook}
        rebookDate={rebookDate}
        rebookTime={rebookTime}
        timeSlots={
          rebookTimeSlots.length > 0
            ? rebookTimeSlots
            : generateTimeSlots(rebookDate || bookingToRebook?.date || new Date()).map((time) => ({
                time,
                available: true,
              }))
        }
        onDateChange={(date) => {
          setRebookDate(date);
          setRebookTime('');
        }}
        onTimeChange={setRebookTime}
        onConfirm={confirmRebookBooking}
        isLoading={isRebooking}
      />

      <ProposeRescheduleModal
        show={showProposeRescheduleModal}
        onClose={() => {
          setShowProposeRescheduleModal(false);
          setBookingToReschedule(null);
          setRescheduleDate(null);
          setRescheduleTime('');
          setRescheduleMessage('');
        }}
        booking={bookingToReschedule}
        rescheduleDate={rescheduleDate}
        rescheduleTime={rescheduleTime}
        rescheduleMessage={rescheduleMessage}
        timeSlots={
          rescheduleTimeSlots.length > 0
            ? rescheduleTimeSlots
            : generateTimeSlots(rescheduleDate || bookingToReschedule?.date || new Date()).map(
                (time) => ({ time, available: true })
              )
        }
        onDateChange={(date) => {
          setRescheduleDate(date);
          setRescheduleTime('');
        }}
        onTimeChange={setRescheduleTime}
        onMessageChange={setRescheduleMessage}
        onConfirm={confirmProposeReschedule}
      />

      <AddPortfolioModal
        show={showAddPortfolioModal}
        onClose={() => {
          if (!isUploadingPortfolioImage) {
            setShowAddPortfolioModal(false);
          }
        }}
        isLoading={isUploadingPortfolioImage}
        onSave={handleAddPortfolioImage}
      />

      <CancelSubscriptionModal
        show={showCancelSubscriptionModal}
        onClose={() => setShowCancelSubscriptionModal(false)}
        subscription={
          subscription
            ? {
                isActive: subscription.status === 'active',
                type: subscription.billingCycle === 'yearly' ? 'yearly' : 'monthly',
                startDate: new Date(subscription.currentPeriodStart),
                nextBillingDate: subscription.nextPaymentDate
                  ? new Date(subscription.nextPaymentDate)
                  : new Date(subscription.currentPeriodEnd),
                amount: subscription.monthlyCost || 0,
                currency: 'ден.',
              }
            : null
        }
        onConfirm={async () => {
          if (!user?.artistId || !subscription) return;

          try {
            await cancelArtistSubscription(user.artistId);
            setShowCancelSubscriptionModal(false);

            toast.success(t('toast.subscriptionCancelled'), {
              description: t('toast.subscriptionCancelledDesc'),
            });
            
            // Refresh subscription data
            if (user.artistId) {
              const updatedSubscription = await getArtistSubscription(user.artistId);
              setSubscription(updatedSubscription);
            }
          } catch (error) {
            console.error('Failed to cancel subscription', error);
            toast.error(t('toast.subscriptionCancelFailed'), {
              description: t('toast.subscriptionCancelFailedDesc'),
            });
          }
        }}
      />

      <ReactivateSubscriptionModal
        show={showReactivateSubscriptionModal}
        onClose={() => setShowReactivateSubscriptionModal(false)}
        subscription={
          subscription
            ? {
                isActive: subscription.status === 'active',
                type: subscription.billingCycle === 'yearly' ? 'yearly' : 'monthly',
                startDate: new Date(subscription.currentPeriodStart),
                nextBillingDate: subscription.nextPaymentDate
                  ? new Date(subscription.nextPaymentDate)
                  : new Date(subscription.currentPeriodEnd),
                amount:
                  subscription.monthlyCost ??
                  (payments.length > 0 ? payments[0].amount : 20.0),
                currency: 'ден.',
              }
            : null
        }
        onConfirm={async () => {
          if (!user?.artistId || !subscription) return;

          try {
            const { checkoutUrl, transactionId } = await reactivateArtistSubscription(user.artistId);
            setShowReactivateSubscriptionModal(false);

            if (checkoutUrl) {
              // Extract transaction ID from URL if not provided directly
              let txId = transactionId;
              if (!txId && checkoutUrl.includes('_ptxn=')) {
                try {
                  const url = new URL(checkoutUrl);
                  txId = url.searchParams.get('_ptxn') || undefined;
                } catch {
                  // If URL parsing fails, use the full URL
                }
              }

              if (txId) {
                // Open Paddle checkout as overlay in current page
                await openPaddleCheckoutWithTransaction(txId);
                toast.success(t('toast.subscriptionReactivating'), {
                  description: t('toast.subscriptionReactivatingDesc'),
                });
              } else {
                // Fallback: open in new window if we can't extract transaction ID
                window.open(checkoutUrl, '_blank', 'noopener,noreferrer');
                toast.success(t('toast.subscriptionReactivating'), {
                  description: t('toast.subscriptionReactivatingDesc'),
                });
              }
            }
          } catch (error) {
            console.error('Failed to reactivate subscription', error);
            toast.error(t('toast.subscriptionReactivateFailed'), {
              description: t('toast.subscriptionReactivateFailedDesc'),
            });
          }
        }}
      />
    </div>
  );
}
