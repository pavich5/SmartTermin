import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
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
import { SettingsView } from '../components/dashboard/SettingsView';
import { AddServiceModal } from '../components/dashboard/modals/AddServiceModal';
import { EditServiceModal } from '../components/dashboard/modals/EditServiceModal';
import { DeleteServiceModal } from '../components/dashboard/modals/DeleteServiceModal';
import { WalkInModal } from '../components/dashboard/modals/WalkInModal';
import { CancelBookingModal } from '../components/dashboard/modals/CancelBookingModal';
import { RebookModal } from '../components/dashboard/modals/RebookModal';
import { ProposeRescheduleModal } from '../components/dashboard/modals/ProposeRescheduleModal';
import { getDateLocale } from '../utils/dateLocale';
import {
  getArtistBookings,
  cancelBooking as cancelBookingRequest,
  rebookAppointment,
  proposeReschedule,
  addWalkIn,
  getAvailableSlots,
} from '../services/bookingService';
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
  getWorkingHours,
  updateWorkingHours,
  WorkingHoursResponse,
} from '../services/settingsService';
import {
  updateProfile as updateProfileRequest,
  updateArtistProfile,
  UpdateArtistProfileResponse,
} from '../services/authService';
import { Booking } from '../services/bookingService';
import { getOnboardingCompleted } from '../services/apiClient';
import { PortfolioGrid } from '../components/dashboard/PortfolioGrid';
import { AddPortfolioModal } from '../components/dashboard/modals/AddPortfolioModal';
import { LoadingState } from '../components/ui/LoadingState';
import { PageContainer } from '../components/ui/PageContainer';
import { formatPriceInMKDInt, formatPriceInMKD } from '../utils/priceFormat';

export function SalonMemberDashboardPage() {
  const { user, isAuthenticated, isLoading: authLoading, refreshUser } = useAuth();
  const { salon } = useSalon();
  const { t, language } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { artistId: routeArtistId } = useParams<{ artistId?: string }>();
  const dateLocale = getDateLocale(language);
  const numberLocale = language === 'mk' ? 'mk-MK' : 'en-US';

  const [activeTab, setActiveTab] = useState('calendar');
  const [selectedBooking, setSelectedBooking] = useState<string | null>(null);
  const [showAddServiceModal, setShowAddServiceModal] = useState(false);
  const [showEditServiceModal, setShowEditServiceModal] = useState(false);
  const [showDeleteServiceModal, setShowDeleteServiceModal] = useState(false);
  const [showWalkInModal, setShowWalkInModal] = useState(false);
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
  const [clients, setClients] = useState<ClientItem[]>([]);
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [servicesLoaded, setServicesLoaded] = useState(false);

  const [portfolioImages, setPortfolioImages] = useState<PortfolioImage[]>([]);
  const [selectedImageForAction, setSelectedImageForAction] = useState<string | null>(null);
  const [showAddPortfolioModal, setShowAddPortfolioModal] = useState(false);
  const [isUploadingPortfolioImage, setIsUploadingPortfolioImage] = useState(false);

  const [profileFullName, setProfileFullName] = useState(user?.fullName || '');
  const [profileEmail, setProfileEmail] = useState(user?.email || '');
  const [profilePhone, setProfilePhone] = useState(user?.phone || '');
  const [profileBusinessName, setProfileBusinessName] = useState('');
  const [profileBio, setProfileBio] = useState('');
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

    if (!user?.salonId) {
      navigate('/dashboard');
      return;
    }

    if (user?.salonRole === 'owner' && !user?.isArtistInSalon) {
      navigate('/enterprise');
      return;
    }

    if (!user?.artistId) {
      navigate('/enterprise');
      return;
    }

    if (routeArtistId && routeArtistId !== user.artistId) {
      navigate(`/dashboard/${user.artistId}`);
      return;
    }

    if (!routeArtistId && user.artistId) {
      navigate(`/dashboard/${user.artistId}`);
      return;
    }
  }, [isAuthenticated, authLoading, user, navigate, location.pathname, routeArtistId]);

  useEffect(() => {
    if (user) {
      setProfileFullName(user.fullName || '');
      setProfileEmail(user.email || '');
      setProfilePhone(user.phone || '');
    }
  }, [user?.fullName, user?.email, user?.phone]);

  const mapBookings = (list: Booking[]) =>
    list.map((booking) => {
      // Format price in MKD
      const formattedPrice = formatPriceInMKDInt(booking.price);
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
          workingHoursResponse,
          artistProfileResponse,
          servicesResponse,
          portfolioResponse,
        ] = await Promise.all([
          getArtistBookings(),
          getArtistClients('all'),
          getWorkingHours(),
          updateArtistProfile({}).catch(() => null as UpdateArtistProfileResponse | null),
          getArtistServices(),
          getPortfolioImages().catch(() => ({ images: [] })),
        ]);

        setBookings(mapBookings(bookingsResponse.bookings));
        setClients(
          (clientsResponse.clients || []).map((client) => ({
            ...client,
            bookings: client.bookings ?? 0,
          }))
        );
        setWorkingHours(workingHoursResponse);
        setServices(
          (servicesResponse.services || []).map((service) => ({
            ...service,
            bookings: service.bookings ?? 0,
            revenue: service.revenue ? formatPriceInMKDInt(service.revenue) : '0 ден.',
          }))
        );
        setServicesLoaded(true);
        setPortfolioImages(portfolioResponse.images || []);

        if (artistProfileResponse) {
          setProfileBusinessName(artistProfileResponse.businessName || '');
          setProfileBio(artistProfileResponse.about || '');
          if (
            artistProfileResponse.maximumCancellationHours !== null &&
            artistProfileResponse.maximumCancellationHours !== undefined
          ) {
            setMaxCancellationHours(artistProfileResponse.maximumCancellationHours);
          }
        }
      } catch (error) {
        console.error('Failed to load dashboard data', error);
        toast.error(t('toast.profileSaveFailed'), {
          description: t('toast.profileSaveFailedDesc'),
        });
      } finally {
        setIsLoadingData(false);
      }
    };

    loadDashboardData();
  }, [user?.id, user?.userType, isAuthenticated]);

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
          serviceId: String(service.id),
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
          serviceId: String(service.id),
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
    cancellationDeadline.setHours(cancellationDeadline.getHours() - (maxCancellationHours || 24));

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

  const handleAddService = async (service: {
    name: string;
    duration: string;
    price: string;
    description: string;
  }) => {
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
      toast.success(t('toast.serviceAdded'), {
        description: t('toast.serviceAddedDesc'),
      });
    } catch (error: any) {
      console.error('Failed to add service', error);
      toast.error(t('toast.profileSaveFailed'), {
        description: t('toast.profileSaveFailedDesc'),
      });
    }
  };

  const handleEditService = async (service: {
    id?: string;
    name: string;
    duration: string;
    price: string;
    description: string;
  }) => {
    if (!editingService?.id) return;
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
      toast.success(t('toast.serviceUpdated'), {
        description: t('toast.serviceUpdatedDesc'),
      });
    } catch (error) {
      console.error('Failed to update service', error);
      toast.error(t('toast.profileSaveFailed'), {
        description: t('toast.profileSaveFailedDesc'),
      });
    }
  };

  const handleDeleteService = async () => {
    if (!editingService?.id) return;

    if (services.length === 1) {
      toast.error(t('toast.profileSaveFailed'), {
        description: t('toast.profileSaveFailedDesc'),
      });
      setShowDeleteServiceModal(false);
      return;
    }

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
    }
  };

  const handleWalkIn = (data: {
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
    const artistId = user?.artistId;
    if (!artistId) {
      toast.error(t('toast.profileSaveFailed'), {
        description: 'Unable to determine artist ID. Please try logging in again.',
      });
      return;
    }

    addWalkIn({
      clientName: data.clientName,
      clientEmail: data.clientEmail,
      clientPhone: data.clientPhone,
      serviceId: data.serviceId,
      artistId: artistId,
      date: data.date,
      time: data.time,
    })
      .then(() => {
        toast.success(t('toast.walkInAdded'), {
          description: t('toast.walkInAddedDesc'),
        });
        refreshBookings();
        refreshClients();
      })
      .catch((error) => {
        console.error('Failed to add walk-in', error);
        toast.error(t('toast.profileSaveFailed'), {
          description: t('toast.profileSaveFailedDesc'),
        });
      });
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
    try {
      const response = await updateWorkingHours(workingHours);
      setWorkingHours(response.workingHours);
      toast.success(t('toast.workingHoursSaved'), {
        description: t('toast.workingHoursSavedDesc'),
      });
    } catch (error) {
      console.error('Failed to update working hours', error);
      toast.error(t('toast.profileSaveFailed'), {
        description: t('toast.profileSaveFailedDesc'),
      });
    }
  };

  const handleProfileSave = async () => {
    try {
      await updateProfileRequest({
        fullName: profileFullName,
        email: profileEmail || undefined,
        phone: profilePhone,
        businessName: profileBusinessName,
        about: profileBio,
      });

      await refreshUser();

      toast.success(t('toast.profileSettingsSaved'), {
        description: t('toast.profileSettingsSavedDesc'),
      });
    } catch (error) {
      console.error('Failed to update profile', error);
      toast.error(t('toast.profileSaveFailed'), {
        description: t('toast.profileSaveFailedDesc'),
      });
    }
  };

  const handleCancellationTimeSave = async () => {
    if (maxCancellationHours === null || maxCancellationHours === 0) {
      toast.error(t('toast.validationError'), {
        description: t('settings.booking.cancellationTimeRequired'),
      });
      return;
    }

    try {
      await updateArtistProfile({
        maximumCancellationHours: maxCancellationHours,
      });
      toast.success(t('toast.bookingSettingsSaved'), {
        description: t('toast.bookingSettingsSavedDesc', { hours: maxCancellationHours }),
      });
    } catch (error) {
      console.error('Failed to update cancellation time', error);
      toast.error(t('toast.profileSaveFailed'), {
        description: t('toast.profileSaveFailedDesc'),
      });
    }
  };

  const bookingToCancelData = bookingToCancel
    ? bookings.find((b) => b.id === bookingToCancel)
    : null;
  const cancellationCheck = bookingToCancelData
    ? canCancelBooking(bookingToCancelData)
    : { allowed: false, message: '' };

  const stats = [
    {
      label: t('dashboard.stats.totalBookings'),
      value: String(bookings.length),
      change: '',
      color: 'bg-sky-500',
    },
    {
      label: t('dashboard.stats.newClients'),
      value: String(clients.filter((c) => c.bookings === 1).length),
      change: '',
      color: 'bg-sky-500',
    },
    {
      label: 'Active Services',
      value: String(services.length),
      change: '',
      color: 'bg-sky-500',
    },
    {
      label: 'Total Clients',
      value: String(clients.length),
      change: '',
      color: 'bg-sky-500',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-12 overflow-x-hidden">
      <PageContainer>
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-sky-700 mb-2">
            {t('dashboard.title')}
          </h1>
          <p className="text-gray-600">{t('dashboard.subtitle')}</p>
          {salon && (
            <p className="text-sm text-gray-500 mt-1">
              {t('dashboard.sidebar.enterprise')}: {salon.name}
            </p>
          )}
          {isLoadingData && <p className="text-sm text-gray-500 mt-2">Loading latest data...</p>}
        </div>

        <div className="grid lg:grid-cols-4 gap-6 w-full">
          <div className="lg:col-span-1 w-full">
            <DashboardSidebar
              user={user!}
              activeTab={activeTab}
              onTabChange={setActiveTab}
              profilePictureUrl={portfolioImages.find((img) => img.isProfilePicture)?.url || null}
              isSalonMember={true}
            />
          </div>

          <div className="lg:col-span-3 space-y-6 w-full min-w-0">
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
                salonId={user?.salonId}
                userType={user?.salonRole === 'owner' ? 'salon' : 'artist'}
                onClientBlocked={refreshClients}
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

            {activeTab === 'portfolio' && (
              <PortfolioGrid
                images={portfolioImages}
                selectedImageForAction={selectedImageForAction}
                onAddImage={() => setShowAddPortfolioModal(true)}
                onImageClick={(imageId) => setSelectedImageForAction(imageId)}
                onCloseImageOptions={() => setSelectedImageForAction(null)}
                onSetBanner={async (imageId) => {
                  try {
                    const response = await setBannerImage(imageId);
                    const isCurrentlyBanner = portfolioImages.find(
                      (img) => img.id === imageId
                    )?.isBannerImage;
                    const updated = await getPortfolioImages();
                    setPortfolioImages(updated.images || []);
                    setSelectedImageForAction(null);
                    toast.success(
                      isCurrentlyBanner ? t('toast.bannerRemoved') : t('toast.bannerUpdated'),
                      {
                        description: isCurrentlyBanner
                          ? t('toast.bannerRemovedDesc')
                          : t('toast.bannerUpdatedDesc'),
                      }
                    );
                  } catch (error) {
                    console.error('Failed to set banner image', error);
                    toast.error(t('toast.uploadFailed'), {
                      description: t('toast.uploadFailedDesc'),
                    });
                  }
                }}
                onSetProfilePicture={async (imageId) => {
                  try {
                    const response = await setProfilePicture(imageId);
                    const isCurrentlyProfile = portfolioImages.find(
                      (img) => img.id === imageId
                    )?.isProfilePicture;
                    const updated = await getPortfolioImages();
                    setPortfolioImages(updated.images || []);
                    setSelectedImageForAction(null);
                    toast.success(
                      isCurrentlyProfile
                        ? t('toast.profilePictureRemoved')
                        : t('toast.profilePictureUpdated'),
                      {
                        description: isCurrentlyProfile
                          ? t('toast.profilePictureRemovedDesc')
                          : t('toast.profilePictureUpdatedDesc'),
                      }
                    );
                  } catch (error) {
                    console.error('Failed to set profile picture', error);
                    toast.error(t('toast.uploadFailed'), {
                      description: t('toast.uploadFailedDesc'),
                    });
                  }
                }}
                onDeleteImage={async (imageId) => {
                  try {
                    await deletePortfolioImage(imageId);
                    const updated = await getPortfolioImages();
                    setPortfolioImages(updated.images || []);
                    setSelectedImageForAction(null);
                    toast.success(t('toast.imageDeleted'), {
                      description: t('toast.imageDeletedDesc'),
                    });
                  } catch (error: any) {
                    console.error('Failed to delete image', error);
                    const errorMessage =
                      error?.details?.message || error?.message || t('toast.genericErrorDesc');
                    toast.error(t('toast.genericError'), {
                      description: errorMessage,
                    });
                  }
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
                businessAddress=""
                businessCity=""
                businessCountry=""
                onBusinessAddressChange={() => {}}
                onBusinessCityChange={() => {}}
                onBusinessCountryChange={() => {}}
                onBusinessSave={async () => {}}
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
                hideBusinessSettings={true}
              />
            )}
          </div>
        </div>
      </PageContainer>

      <AddServiceModal
        show={showAddServiceModal}
        onClose={() => setShowAddServiceModal(false)}
        onSave={handleAddService}
      />

      <EditServiceModal
        show={showEditServiceModal}
        onClose={() => setShowEditServiceModal(false)}
        service={editingService}
        onSave={handleEditService}
      />

      <DeleteServiceModal
        show={showDeleteServiceModal}
        onClose={() => setShowDeleteServiceModal(false)}
        service={editingService}
        onConfirm={handleDeleteService}
      />

      <WalkInModal
        show={showWalkInModal}
        onClose={() => setShowWalkInModal(false)}
        services={services}
        artistId={user?.artistId || ''}
        onSave={handleWalkIn}
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
        onSave={async (data) => {
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

            setShowAddPortfolioModal(false);
            toast.success(t('toast.portfolioImageAdded'), {
              description: data.setAsBanner
                ? t('toast.portfolioImageBannerDesc')
                : data.setAsProfile
                  ? t('toast.portfolioImageProfileDesc')
                  : t('toast.portfolioImageAddedDesc'),
            });
          } catch (error: any) {
            console.error('Failed to upload image', error);
            // Remove placeholder on error
            setPortfolioImages((prev) => prev.filter((img) => img.id !== placeholderId));
            
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
          } finally {
            setIsUploadingPortfolioImage(false);
          }
        }}
      />
    </div>
  );
}
