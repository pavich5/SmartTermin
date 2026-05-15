import React, { useEffect, useMemo, useState, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Crown,
  Users,
  CalendarRange,
  Activity,
  Plus,
  Mail,
  Clock3,
  Image,
  TrendingUp,
  Settings,
} from 'lucide-react';
import { useSalon } from '../contexts/SalonContext';
import { useSalonTrial } from '../hooks/useSalonTrial';
import {
  getSalonAnalytics,
  getSalonCalendar,
  getSalonSubscription,
  upsertSalonSubscription,
  createSalon,
  deleteSalon,
  toggleOwnerAsArtist,
  updateSalon,
} from '../services/salonService';
import { SalonAnalytics, SalonCalendarBooking, SalonMember } from '../types/salon';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { useTranslation } from '../hooks/useTranslation';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { updateArtistProfile } from '../services/authService';
import type { UpdateArtistProfileResponse } from '../services/authService';
import { PortfolioGrid } from '../components/dashboard/PortfolioGrid';
import { AnalyticsView } from '../components/dashboard/AnalyticsView';
import { SettingsView } from '../components/dashboard/SettingsView';
import { EnterpriseCalendar } from '../components/dashboard/EnterpriseCalendar';
import {
  getPortfolioImages,
  getSalonPortfolioImages,
  uploadPortfolioImage,
  uploadSalonPortfolioImage,
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
import { updateProfile as updateProfileRequest } from '../services/authService';
import { AddPortfolioModal } from '../components/dashboard/modals/AddPortfolioModal';
import { ImageWithFallback } from '../components/figma/ImageWithFallback';
import { CancelSalonSubscriptionModal } from '../components/dashboard/modals/CancelSalonSubscriptionModal';
import { cancelSalonSubscription } from '../services/salonService';
import { formatPriceInMKDInt } from '../utils/priceFormat';

export function EnterpriseDashboard() {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();
  const { salon, isOwner, members, subscription, loading, refresh, setSubscription } = useSalon();
  const { refreshUser, updateUser, user, isAuthenticated } = useAuth();
  const [analytics, setAnalytics] = useState<SalonAnalytics | null>(null);
  const [calendar, setCalendar] = useState<SalonCalendarBooking[]>([]);
  const [calendarFilter, setCalendarFilter] = useState<string>('all');
  const [calendarPage, setCalendarPage] = useState<number>(1);
  const [calendarTotalPages, setCalendarTotalPages] = useState<number>(1);
  const [calendarTotalCount, setCalendarTotalCount] = useState<number>(0);
  const calendarLimit = 10;
  const [activeTab, setActiveTab] = useState<string>('overview');
  const tabScrollRef = useRef<HTMLDivElement>(null);

  const [portfolioImages, setPortfolioImages] = useState<PortfolioImage[]>([]);
  const [selectedImageForAction, setSelectedImageForAction] = useState<string | null>(null);
  const [showAddPortfolioModal, setShowAddPortfolioModal] = useState(false);
  const [isUploadingPortfolioImage, setIsUploadingPortfolioImage] = useState(false);
  const [settingBannerId, setSettingBannerId] = useState<string | null>(null);
  const [settingProfileId, setSettingProfileId] = useState<string | null>(null);
  const [deletingImageId, setDeletingImageId] = useState<string | null>(null);
  const [isSavingSalonName, setIsSavingSalonName] = useState(false);
  const [isSavingCustomBookingLink, setIsSavingCustomBookingLink] = useState(false);
  const [isSavingWorkingHours, setIsSavingWorkingHours] = useState(false);
  const [isSavingCancellationTime, setIsSavingCancellationTime] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isSavingBusiness, setIsSavingBusiness] = useState(false);
  
  // Store initial values for change detection
  const initialProfileValues = useRef<{
    fullName: string;
    email: string;
    phone: string;
    businessName: string;
  } | null>(null);
  const initialBusinessValues = useRef<{
    address: string;
    city: string;
    country: string;
    salonName?: string;
    salonBio?: string;
  } | null>(null);
  const initialSalonName = useRef<string | null>(null);
  const initialCustomBookingLink = useRef<string | null>(null);
  const initialCancellationHours = useRef<number | null>(null);
  const initialWorkingHours = useRef<WorkingHoursResponse | null>(null);

  const [dashboardAnalytics, setDashboardAnalytics] = useState<DashboardAnalytics | null>(null);
  const [popularServices, setPopularServices] = useState<PopularService[]>([]);

  const [showCancelSalonModal, setShowCancelSalonModal] = useState(false);
  const [isCancellingSalon, setIsCancellingSalon] = useState(false);

  const [businessAddress, setBusinessAddress] = useState(salon?.address || '');
  const [businessCity, setBusinessCity] = useState(salon?.city || '');
  const [businessCountry, setBusinessCountry] = useState(salon?.country || '');
  const [salonBio, setSalonBio] = useState(salon?.about || '');

  const [profileFullName, setProfileFullName] = useState(user?.fullName || '');
  const [profileEmail, setProfileEmail] = useState(user?.email || '');
  const [profilePhone, setProfilePhone] = useState(user?.phone || '');
  const [profileBusinessName, setProfileBusinessName] = useState('');
  const [profileBio, setProfileBio] = useState('');
  const [maxCancellationHours, setMaxCancellationHours] = useState<number | null>(24);

  const [isOwnerAlsoArtist, setIsOwnerAlsoArtist] = useState<boolean>(
    user?.isArtistInSalon ?? false
  );
  const [workingHours, setWorkingHours] = useState<WorkingHoursResponse>({
    monday: { start: '09:00', end: '18:00', closed: false },
    tuesday: { start: '09:00', end: '18:00', closed: false },
    wednesday: { start: '09:00', end: '18:00', closed: false },
    thursday: { start: '09:00', end: '20:00', closed: false },
    friday: { start: '09:00', end: '20:00', closed: false },
    saturday: { start: '10:00', end: '17:00', closed: false },
    sunday: { start: '09:00', end: '18:00', closed: true },
  });
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [about, setAbout] = useState('');
  const [customBookingLink, setCustomBookingLink] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [justCreatedSalon, setJustCreatedSalon] = useState(false);
  const [errors, setErrors] = useState<{
    name?: string;
    address?: string;
    city?: string;
  }>({});
  useSalonTrial();

  useEffect(() => {
    // Don't redirect if we just created a salon (wait for it to load)
    if (justCreatedSalon) {
      return;
    }
    
    // Only redirect if:
    // 1. Salon was cancelled/expired (downgrade scenario)
    // 2. User has salonId but salon doesn't exist (cleanup scenario)
    // Don't redirect if user is upgrading and needs to create salon
    if (!loading) {
      const isCancelled = subscription && (subscription.status === 'cancelled' || subscription.status === 'expired');
      
      // If subscription is cancelled/expired, redirect (downgrade scenario)
      if (isCancelled) {
        if (user?.salonId) {
          updateUser({ salonId: null, salonRole: null });
          refreshUser();
        }
        navigate('/dashboard', { replace: true });
        return;
      }
      
      // If user has salonId but salon doesn't exist (salon was deleted), clear it and redirect
      if (user?.salonId && !salon && !justCreatedSalon) {
        updateUser({ salonId: null, salonRole: null });
        refreshUser();
        navigate('/dashboard', { replace: true });
        return;
      }
      
      // If no salon and no salonId, redirect to the dedicated creation page
      // But only if user is authenticated (don't redirect after logout)
      if (!salon && !user?.salonId && isAuthenticated) {
        navigate('/enterprise/create', { replace: true });
        return;
      }
      
      // If user is not authenticated, redirect to home
      if (!isAuthenticated) {
        navigate('/', { replace: true });
        return;
      }
    }
  }, [loading, salon, subscription, navigate, user?.salonId, updateUser, refreshUser, justCreatedSalon]);

  useEffect(() => {
    const prefillFormData = async () => {
      if (!salon && user?.userType === 'artist') {
        try {
          const artistProfile: UpdateArtistProfileResponse | null = await updateArtistProfile(
            {}
          ).catch(() => null);

          if (artistProfile) {
            if (!name && artistProfile.businessName) {
              setName(artistProfile.businessName);
            }
            if (!address && artistProfile.address) {
              setAddress(artistProfile.address);
            }
            if (!city && artistProfile.city) {
              setCity(artistProfile.city);
            }
            if (!about && artistProfile.about) {
              setAbout(artistProfile.about);
            }
          }

          if (user) {
            if (!name && !artistProfile?.businessName && user.fullName) {
              setName(user.fullName);
            }
            if (!phone && user.phone) {
              setPhone(user.phone);
            }
            if (!email && user.email) {
              setEmail(user.email);
            }
          }
        } catch (error) {
          console.error('Failed to load artist profile for prefilling', error);

          if (user) {
            if (!name && user.fullName) {
              setName(user.fullName);
            }
            if (!phone && user.phone) {
              setPhone(user.phone);
            }
            if (!email && user.email) {
              setEmail(user.email);
            }
          }
        }
      } else if (!salon && user) {
        if (!name && user.fullName) {
          setName(user.fullName);
        }
        if (!phone && user.phone) {
          setPhone(user.phone);
        }
        if (!email && user.email) {
          setEmail(user.email);
        }
      }
    };

    prefillFormData();
  }, [salon, user]);

  const loadAnalytics = async (salonId: string) => {
    try {
      const data = await getSalonAnalytics(salonId);
      setAnalytics(data);
    } catch (error) {
      console.error('Failed to load salon analytics', error);
    }
  };

  const loadCalendar = async (salonId: string, page: number = 1) => {
    try {
      const data = await getSalonCalendar(salonId, undefined, undefined, page, calendarLimit);
      setCalendar(data.bookings || []);
      setCalendarTotalCount(data.totalCount || 0);
      setCalendarTotalPages(data.totalPages || 1);
      setCalendarPage(page);
    } catch (error) {
      console.error('Failed to load salon calendar', error);
    }
  };

  const loadSubscription = async (salonId: string) => {
    try {
      const sub = await getSalonSubscription(salonId);
      setSubscription(sub);
    } catch (error) {
      console.error('Failed to refresh subscription', error);
    }
  };

  useEffect(() => {
    if (salon?.id) {
      loadAnalytics(salon.id);
      loadCalendar(salon.id, 1);
      loadSubscription(salon.id);
    }
  }, [salon?.id]);

  // Reset calendar page when filter changes
  useEffect(() => {
    if (salon?.id && calendarFilter) {
      setCalendarPage(1);
      loadCalendar(salon.id, 1);
    }
  }, [calendarFilter]);

  useEffect(() => {
    const loadOwnerData = async () => {
      if (!user || !isOwner) return;

      try {
        const [
          portfolioResponse,
          analyticsResponse,
          popularServicesResponse,
          workingHoursResponse,
          artistProfileResponse,
        ] = await Promise.all([
          salon?.id ? getSalonPortfolioImages(salon.id).catch(() => ({ images: [] })) : Promise.resolve({ images: [] }),
          getDashboardAnalytics().catch(() => null),
          getPopularServices().catch(() => ({ services: [] })),
          getWorkingHours().catch(() => workingHours),
          updateArtistProfile({}).catch(() => null),
        ]);

        // Combine portfolio images with salon profile/banner if they exist but aren't in portfolio
        let allPortfolioImages = portfolioResponse.images || [];
        
        if (salon) {
          // Check if profile image exists in portfolio, if not add it
          const hasProfileInPortfolio = allPortfolioImages.some(img => img.isProfilePicture);
          if (salon.profileImageUrl && !hasProfileInPortfolio) {
            allPortfolioImages.push({
              id: `salon-profile-${salon.id}`,
              url: salon.profileImageUrl,
              isBannerImage: false,
              isProfilePicture: true,
            });
          }
          
          // Check if banner exists in portfolio, if not add it
          const hasBannerInPortfolio = allPortfolioImages.some(img => img.isBannerImage);
          if (salon.bannerImageUrl && !hasBannerInPortfolio) {
            allPortfolioImages.push({
              id: `salon-banner-${salon.id}`,
              url: salon.bannerImageUrl,
              isBannerImage: true,
              isProfilePicture: false,
            });
          }
        }
        
        setPortfolioImages(allPortfolioImages);
        setDashboardAnalytics(analyticsResponse);
        setPopularServices(popularServicesResponse.services || []);
        setWorkingHours(workingHoursResponse || workingHours);

        if (salon) {
          setBusinessAddress(salon.address || '');
          setBusinessCity(salon.city || '');
          setBusinessCountry(salon.country || '');
          setSalonBio(salon.about || '');
        }

        if (artistProfileResponse) {
          setProfileBusinessName(artistProfileResponse.businessName || '');
          if (
            artistProfileResponse.maximumCancellationHours !== null &&
            artistProfileResponse.maximumCancellationHours !== undefined
          ) {
            setMaxCancellationHours(artistProfileResponse.maximumCancellationHours);
          }
        }

        if (user) {
          setProfileFullName(user.fullName || '');
          setProfileEmail(user.email || '');
          setProfilePhone(user.phone || '');

          setIsOwnerAlsoArtist(user.isArtistInSalon ?? false);
        }

        // Store initial values for change detection
        if (user) {
          initialProfileValues.current = {
            fullName: user.fullName || '',
            email: user.email || '',
            phone: user.phone || '',
            businessName: artistProfileResponse?.businessName || '',
          };
        }
        if (artistProfileResponse) {
          initialBusinessValues.current = {
            address: salon?.address || '',
            city: salon?.city || '',
            country: salon?.country || '',
            salonName: salon?.name || '',
            salonBio: salon?.about || '',
          };
          initialCancellationHours.current = artistProfileResponse.maximumCancellationHours ?? 24;
        }
        if (salon) {
          initialSalonName.current = salon.name || '';
          initialCustomBookingLink.current = salon.customBookingLink || '';
        }
        initialWorkingHours.current = workingHoursResponse || workingHours;
      } catch (error) {
        console.error('Failed to load owner data', error);
      }
    };

    if (isOwner && salon) {
      loadOwnerData();

      setName(salon.name || '');
      setBusinessAddress(salon.address || '');
      setBusinessCity(salon.city || '');
      setBusinessCountry(salon.country || '');
      setSalonBio(salon.about || '');
      setCustomBookingLink(salon.customBookingLink || '');
    }
  }, [
    user?.id,
    user?.isArtistInSalon,
    isOwner,
    salon?.id,
    salon?.address,
    salon?.city,
    salon?.country,
    salon?.about,
  ]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tab = params.get('tab');
    const validTabs = ['overview', 'calendar', 'portfolio', 'analytics', 'settings'];

    if (tab && validTabs.includes(tab)) {
      setActiveTab(tab);
      return;
    }

    if (location.pathname === '/enterprise') {
      setActiveTab('overview');
    }
  }, [location.pathname, location.search]);

  const handleCancelSalon = async () => {
    if (!salon?.id) return;

    setIsCancellingSalon(true);
    try {
      const hasSubscriptionId = !!subscription?.paddleSubscriptionId;

      // Try to cancel subscription first when a subscription id exists
      if (hasSubscriptionId) {
        try {
          await cancelSalonSubscription(salon.id);
        } catch (error: any) {
          // If cancellation fails because subscription is missing, fall back to deleting the salon
          const message = (error?.message || '').toString().toLowerCase();
          const isMissingSubscription =
            message.includes('subscription') || message.includes('not found');

          if (!isMissingSubscription) {
            throw error;
          }
        }
      }

      // Ensure salon is removed even when no subscription exists
      try {
        await deleteSalon(salon.id);
      } catch {
        // If deletion fails because salon was already removed, ignore
      }

      setSubscription(null);
      setShowCancelSalonModal(false);
      toast.success(t('enterprise.billing.subscriptionCancelled'));
      await refreshUser();
      await refresh();

      // Redirect to dashboard after cancellation
      setTimeout(() => {
        navigate('/dashboard', { replace: true });
      }, 500);
    } catch (error) {
      console.error('Failed to cancel salon:', error);
      toast.error(t('enterprise.billing.cancelFailed'));
    } finally {
      setIsCancellingSalon(false);
    }
  };

  const filteredBookings = useMemo(() => {
    if (calendarFilter === 'all') return calendar;
    return calendar.filter((b) => b.artistId === calendarFilter);
  }, [calendar, calendarFilter]);

  const stats = useMemo(() => {
    if (!analytics) {
      return [
        { label: t('enterprise.dashboard.totalRevenue'), value: '0 ден.', change: '+0%' },
        { label: t('enterprise.dashboard.bookingsThisMonth'), value: '0', change: '+0%' },
        {
          label: t('enterprise.dashboard.activeArtists'),
          value: members.length.toString(),
          change: '',
        },
        { label: t('enterprise.dashboard.newClients'), value: '0', change: '+0%' },
      ];
    }

    return [
      {
        label: t('enterprise.dashboard.totalRevenue'),
        value: `${analytics.totalRevenue.toLocaleString()} ден.`,
        change: analytics.revenueChange,
      },
      {
        label: t('enterprise.dashboard.bookingsThisMonth'),
        value: analytics.totalBookings.toString(),
        change: analytics.bookingsChange,
      },
      {
        label: t('enterprise.dashboard.activeArtists'),
        value: analytics.activeArtists.toString(),
        change: '',
      },
      {
        label: t('enterprise.dashboard.newClients'),
        value: analytics.newClients.toString(),
        change: '+ new',
      },
    ];
  }, [analytics, members.length, t]);

  const activityFeed = useMemo(() => {
    return filteredBookings.slice(0, 6).map((booking) => ({
      id: booking.id,
      message: `${booking.artistName} • ${booking.clientName}`,
      detail: `${booking.service} • ${booking.time}`,
      date: format(new Date(booking.date), 'MMM d'),
    }));
  }, [filteredBookings]);


  const subscriptionSeatHint = subscription
    ? `${subscription.artistCount} artists • €${subscription.monthlyCost.toFixed(2)}/month`
    : 'Enterprise • €15 per artist (min 3)';

  const isTrial = subscription?.status === 'trial';
  const trialEndsAt = subscription?.trialEndsAt ? new Date(subscription.trialEndsAt) : null;
  const daysRemaining =
    trialEndsAt != null
      ? Math.ceil((trialEndsAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
      : null;

  const renderMemberCard = (member: SalonMember) => {
    return (
      <div
        key={member.artistId}
        className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm flex flex-col gap-2 hover:shadow-md transition"
      >
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full overflow-hidden flex items-center justify-center text-lg font-semibold shadow-md bg-sky-500 text-white flex-shrink-0">
            {member.profileImageUrl ? (
              <ImageWithFallback
                src={member.profileImageUrl}
                alt={member.fullName}
                className="w-full h-full object-cover"
              />
            ) : (
              <span>{member.fullName.slice(0, 1)}</span>
            )}
          </div>
          <div className="flex-1">
            <div className="font-semibold text-gray-900">{member.fullName}</div>
            <div className="text-sm text-gray-500 capitalize">
              {member.role === 'owner'
                ? t('enterprise.dashboard.role.owner')
                : t('enterprise.dashboard.role.artist')}
            </div>
          </div>
          <div className="text-xs px-3 py-1 rounded-full bg-blue-50 text-sky-600">
            {member.bookings === 0
              ? t('enterprise.dashboard.zeroBookings')
              : t('enterprise.dashboard.bookingsCount', { count: member.bookings })}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2 text-sm text-gray-600">
          <div>{t('enterprise.dashboard.revenue')}</div>
          <div className="text-right font-semibold text-gray-900">
            {member.revenue === 0
              ? t('enterprise.dashboard.zeroRevenue')
              : `${member.revenue.toLocaleString()} ден.`}
          </div>
          <div>{t('enterprise.dashboard.bookings')}</div>
          <div className="text-right font-semibold text-gray-900">{member.bookings}</div>
        </div>
      </div>
    );
  };

  if (loading && !salon) {
    return <div className="min-h-screen bg-blue-50" />;
  }

  const validate = (): boolean => {
    const newErrors: { name?: string; address?: string; city?: string } = {};

    if (!name.trim()) {
      newErrors.name = t('enterprise.createSalon.nameRequired') || 'Salon name is required';
    }

    if (!address.trim()) {
      newErrors.address = t('enterprise.createSalon.addressRequired') || 'Address is required';
    }

    if (!city.trim()) {
      newErrors.city = t('enterprise.createSalon.cityRequired') || 'City is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleCreateSalon = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    setIsSubmitting(true);
    try {
      const createdSalon = await createSalon({
        name: name.trim(),
        address: address.trim(),
        city: city.trim(),
        country: 'Macedonia',
        phone: phone.trim() || undefined,
        email: email.trim() || undefined,
        about: about.trim() || undefined,
      });

      toast.success(t('enterprise.createSalon.success') || 'Salon created successfully!');

      if (createdSalon?.id) {
        updateUser({ salonId: createdSalon.id, salonRole: 'owner' });
      }

      // Set flag to prevent redirect during salon loading
      setJustCreatedSalon(true);

      await refreshUser();

      await refresh();

      // Wait a bit for salon context to fully load, then clear the flag
      setTimeout(() => {
        setJustCreatedSalon(false);
      }, 1000);

      setName('');
      setAddress('');
      setCity('');
      setPhone('');
      setEmail('');
      setAbout('');
      setErrors({});
    } catch (error: any) {
      console.error('Failed to create salon', error);
      const errorMessage =
        error?.message ||
        t('enterprise.createSalon.error') ||
        'Failed to create salon. Please try again.';
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!salon) {
    return (
      <div className="min-h-screen bg-blue-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white border border-gray-100 rounded-3xl p-6 sm:p-8 lg:p-10 shadow-xl">
            <div className="text-center mb-8">
              <div className="mx-auto w-16 h-16 rounded-full bg-sky-500 flex items-center justify-center mb-4 shadow-lg">
                <Crown className="text-black" size={28} strokeWidth={2} />
              </div>
              <h1 className="text-2xl font-bold mb-2 text-gray-900">
                {t('enterprise.createSalon.title') || 'Create your salon workspace'}
              </h1>
              <p className="text-gray-600 mb-8">
                {t('enterprise.createSalon.description') ||
                  'Spin up an enterprise salon to manage artists, bookings, and billing.'}
              </p>
            </div>

            <form onSubmit={handleCreateSalon} className="space-y-4">
              <div>
                <Label htmlFor="name" className="mb-2 block text-gray-700">
                  {t('enterprise.createSalon.name') || 'Salon Name'} *
                </Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={t('enterprise.createSalon.namePlaceholder') || 'Enter salon name'}
                  className={`text-gray-900 ${errors.name ? 'border-red-500' : ''}`}
                />
                {errors.name && <p className="text-sm text-red-500 mt-1">{errors.name}</p>}
              </div>

              <div>
                <Label htmlFor="address" className="mb-2 block text-gray-700">
                  {t('enterprise.createSalon.address') || 'Address'} *
                </Label>
                <Input
                  id="address"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder={t('enterprise.createSalon.addressPlaceholder') || 'Enter address'}
                  className={`text-gray-900 ${errors.address ? 'border-red-500' : ''}`}
                />
                {errors.address && <p className="text-sm text-red-500 mt-1">{errors.address}</p>}
              </div>

              <div>
                <Label htmlFor="city" className="mb-2 block text-gray-700">
                  {t('enterprise.createSalon.city') || 'City'} *
                </Label>
                <Input
                  id="city"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder={t('enterprise.createSalon.cityPlaceholder') || 'Enter city'}
                  className={`text-gray-900 ${errors.city ? 'border-red-500' : ''}`}
                />
                {errors.city && <p className="text-sm text-red-500 mt-1">{errors.city}</p>}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="phone" className="mb-2 block text-gray-700">
                    {t('enterprise.createSalon.phone') || 'Phone'}
                  </Label>
                  <Input
                    id="phone"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder={
                      t('enterprise.createSalon.phonePlaceholder') || 'Enter phone number'
                    }
                    className="text-gray-900"
                  />
                </div>

                <div>
                  <Label htmlFor="email" className="mb-2 block text-gray-700">
                    {t('enterprise.createSalon.email') || 'Email'}
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={t('enterprise.createSalon.emailPlaceholder') || 'Enter email'}
                    className="text-gray-900"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="about" className="mb-2 block text-gray-700">
                  {t('enterprise.createSalon.about') || 'About'}
                </Label>
                <textarea
                  id="about"
                  value={about}
                  onChange={(e) => setAbout(e.target.value)}
                  placeholder={
                    t('enterprise.createSalon.aboutPlaceholder') || 'Tell us about your salon...'
                  }
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent resize-none text-gray-900 placeholder:text-gray-400"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 bg-sky-500 hover:bg-sky-600 text-white"
                >
                  {isSubmitting
                    ? t('enterprise.createSalon.creating') || 'Creating...'
                    : t('enterprise.createSalon.create') || 'Create Salon'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-blue-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {isTrial && (
          <div className="rounded-xl shadow-lg p-6 sm:p-8 bg-sky-500 text-white">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h3 className="font-bold text-xl mb-2" style={{ color: '#ffffff' }}>
                  {t('enterprise.trial.active') || 'Free Trial Active'}
                </h3>
                <p className="text-base" style={{ color: '#ffffff', opacity: 0.95 }}>
                  {daysRemaining !== null
                    ? t('enterprise.trial.daysRemainingInTrial', { days: daysRemaining }) || `${daysRemaining} days remaining in your trial`
                    : t('enterprise.trial.trialActive') || 'Your trial is active'}
                </p>
              </div>
              <Button
                onClick={() => setActiveTab('settings')}
                className="px-6 py-3 rounded-full font-semibold shadow-lg hover:shadow-xl transition-all whitespace-nowrap bg-white text-sky-600 border-none hover:bg-gray-100"
              >
                {t('enterprise.billing.subscribeNow') || 'Subscribe Now'}
              </Button>
            </div>
          </div>
        )}

        <div className="bg-white border border-gray-100 rounded-3xl shadow-xl p-6 sm:p-8 lg:p-10">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 sm:gap-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl overflow-hidden bg-blue-100 flex-shrink-0 flex items-center justify-center shadow-lg">
                {salon.profileImageUrl && typeof salon.profileImageUrl === 'string' && salon.profileImageUrl.trim() !== '' ? (
                  <ImageWithFallback
                    src={salon.profileImageUrl}
                    alt={salon.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-xl font-bold text-white bg-sky-500">
                    {salon.name.slice(0, 2).toUpperCase()}
                  </div>
                )}
              </div>
              <div>
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Crown size={16} className="text-blue-600" />
                  {t('enterprise.dashboard.enterprisePlan')}
                </div>
                <h1 className="text-2xl font-bold text-gray-900">{salon.name}</h1>
                <p className="text-sm text-gray-600">
                  {salon.city}, {salon.country} • {subscriptionSeatHint}
                </p>
              </div>
            </div>
          </div>
        </div>

        {}
        <div className="bg-white border border-gray-100 rounded-2xl shadow-lg p-2 -mx-4 sm:mx-0">
          <div
            ref={tabScrollRef}
            className="flex items-center gap-2 tab-scroll"
            style={{
              overflowX: 'auto',
              overflowY: 'hidden',
              scrollbarWidth: 'none',
              msOverflowStyle: 'none',
              WebkitOverflowScrolling: 'touch',
              scrollBehavior: 'smooth',
            }}
          >
            <style>{`
              .tab-scroll {
                -webkit-overflow-scrolling: touch;
              }
              .tab-scroll::-webkit-scrollbar {
                display: none;
                width: 0;
                height: 0;
                background: transparent;
              }
            `}</style>
            {[
              { id: 'overview', label: t('enterprise.dashboard.overview'), icon: Activity },
              { id: 'calendar', label: t('enterprise.dashboard.calendar') || 'Calendar', icon: CalendarRange },
              { id: 'portfolio', label: t('enterprise.dashboard.portfolio') || 'Portfolio', icon: Image },
              { id: 'analytics', label: t('enterprise.dashboard.analytics'), icon: TrendingUp },
              { id: 'settings', label: t('dashboard.settings'), icon: Settings },
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all whitespace-nowrap flex-shrink-0 ${
                    activeTab === tab.id
                      ? 'bg-sky-500 text-white shadow-md'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <Icon size={18} className="flex-shrink-0" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {}
        {activeTab === 'overview' && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-5">
              {stats.map((stat) => (
                <div
                  key={stat.label}
                  className="bg-white border border-gray-100 rounded-2xl p-6 shadow-lg hover:shadow-xl transition"
                >
                  <div className="text-sm text-gray-500 mb-2">{stat.label}</div>
                  <div className="text-2xl font-semibold text-gray-900 mb-1">{stat.value}</div>
                  {stat.change && <div className="text-xs text-green-600 mt-2">{stat.change}</div>}
                </div>
              ))}
            </div>

            <div className="grid lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                <div className="bg-white border border-gray-100 rounded-3xl shadow-xl p-6 lg:p-8">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <Users className="text-blue-600" size={20} />
                      <h2 className="text-lg font-semibold text-gray-900">
                        {t('enterprise.team.teamMembers')}
                      </h2>
                    </div>
                    {isOwner && (
                      <Button
                        onClick={() => navigate('/enterprise/team')}
                        variant="ghost"
                        size="sm"
                        className="text-sm px-3 py-2 rounded-full bg-blue-50 text-sky-600 hover:bg-blue-100"
                      >
                        {t('enterprise.team.manage')}
                      </Button>
                    )}
                  </div>
                  <div className="grid md:grid-cols-2 gap-4">
                    {members.slice(0, 4).map(renderMemberCard)}
                    {members.length === 0 && (
                      <div className="text-sm text-gray-500">
                        {t('enterprise.team.noArtistsYet')}
                      </div>
                    )}
                  </div>
                </div>

                <div className="bg-white border border-gray-100 rounded-3xl shadow-xl p-6 lg:p-8">
                  <div className="flex items-center justify-between mb-4 gap-4">
                    <div className="flex items-center gap-3">
                      <CalendarRange className="text-blue-600" size={20} />
                      <h2 className="text-lg font-semibold text-gray-900">
                        {t('enterprise.dashboard.calendar')}
                      </h2>
                    </div>
                    <div className="flex-shrink-0 relative">
                      <select
                        value={calendarFilter}
                        onChange={(e) => setCalendarFilter(e.target.value)}
                        className="h-8 rounded-xl border border-gray-200 pl-4 pr-7 bg-white text-sm min-w-[140px] cursor-pointer"
                        style={{
                          appearance: 'none',
                          WebkitAppearance: 'none',
                          MozAppearance: 'none',
                          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23374151' d='M6 9L1 4h10z'/%3E%3C/svg%3E")`,
                          backgroundRepeat: 'no-repeat',
                          backgroundPosition: 'right 0.5rem center',
                          backgroundSize: '12px',
                        }}
                      >
                        <option value="all">All Artists</option>
                        {members.map((m) => (
                          <option key={m.artistId} value={m.artistId}>
                            {m.fullName}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="space-y-3 max-h-[420px] overflow-y-auto pr-2">
                    {filteredBookings.length === 0 && (
                      <div className="text-sm text-gray-500 py-4">
                        {t('enterprise.dashboard.noBookings')}
                      </div>
                    )}
                    {filteredBookings.map((booking) => (
                      <div
                        key={booking.id}
                        className="border border-gray-100 rounded-2xl p-4 flex items-center justify-between hover:border-blue-200 hover:shadow-sm transition"
                      >
                        <div>
                          <div className="text-sm text-gray-500">
                            {format(new Date(booking.date), 'EEE, MMM d')} • {booking.time}
                          </div>
                          <div className="font-semibold text-gray-900">
                            {booking.service}
                            {calendarFilter === 'all' && (
                              <span className="ml-2 text-sm font-normal text-blue-600">
                                • {booking.artistName}
                              </span>
                            )}
                          </div>
                          <div className="text-sm text-gray-500">
                            {booking.clientName}
                          </div>
                        </div>
                        <div className="text-right text-sm">
                          <div className="font-semibold text-gray-900">
                            {booking.price ? formatPriceInMKDInt(booking.price) : '0 ден.'}
                          </div>
                          <div className="text-gray-500 capitalize">{booking.status}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                  {calendarTotalPages > 1 && (
                    <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                      <div className="text-sm text-gray-500">
                        Showing {((calendarPage - 1) * calendarLimit) + 1} to {Math.min(calendarPage * calendarLimit, calendarTotalCount)} of {calendarTotalCount} bookings
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          onClick={() => salon && loadCalendar(salon.id, calendarPage - 1)}
                          disabled={calendarPage === 1}
                          variant="outline"
                          size="sm"
                        >
                          Previous
                        </Button>
                        <div className="flex items-center gap-1">
                          {Array.from({ length: Math.min(5, calendarTotalPages) }, (_, i) => {
                            let pageNum;
                            if (calendarTotalPages <= 5) {
                              pageNum = i + 1;
                            } else if (calendarPage <= 3) {
                              pageNum = i + 1;
                            } else if (calendarPage >= calendarTotalPages - 2) {
                              pageNum = calendarTotalPages - 4 + i;
                            } else {
                              pageNum = calendarPage - 2 + i;
                            }
                            return (
                              <Button
                                key={pageNum}
                                onClick={() => salon && loadCalendar(salon.id, pageNum)}
                                variant={calendarPage === pageNum ? "default" : "outline"}
                                size="sm"
                                className={calendarPage === pageNum ? "bg-blue-600 text-white" : ""}
                              >
                                {pageNum}
                              </Button>
                            );
                          })}
                        </div>
                        <Button
                          onClick={() => salon && loadCalendar(salon.id, calendarPage + 1)}
                          disabled={calendarPage >= calendarTotalPages}
                          variant="outline"
                          size="sm"
                        >
                          Next
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-6">
                <div className="bg-white border border-gray-100 rounded-3xl shadow-xl p-6 lg:p-8 space-y-4">
                  <div className="flex items-center gap-3">
                    <Activity className="text-blue-600" size={20} />
                    <h2 className="text-lg font-semibold text-gray-900">
                      {t('enterprise.dashboard.recentActivity')}
                    </h2>
                  </div>
                  <div className="space-y-3">
                    {activityFeed.length === 0 && (
                      <div className="text-sm text-gray-500">
                        {t('enterprise.dashboard.noActivity')}
                      </div>
                    )}
                    {activityFeed.map((item) => (
                      <div key={item.id} className="flex items-start gap-3">
                        <div className="w-2 h-2 rounded-full bg-sky-500 mt-2" />
                        <div className="flex-1">
                          <div className="font-semibold text-gray-900 text-sm">{item.message}</div>
                          <div className="text-xs text-gray-500">{item.detail}</div>
                        </div>
                        <div className="text-xs text-gray-400">{item.date}</div>
                      </div>
                    ))}
                  </div>
                </div>
                {salon.pendingInvitations.length > 0 && (
                  <div className="bg-white border border-gray-100 rounded-3xl shadow-xl p-6 lg:p-8 space-y-4">
                    <div className="flex items-center gap-3">
                      <Mail className="text-blue-600" size={20} />
                      <h2 className="text-lg font-semibold text-gray-900">Pending Invitations</h2>
                    </div>
                    <div className="space-y-2">
                      {salon.pendingInvitations.map((inv) => (
                        <div
                          key={inv.id}
                          className="border border-gray-100 rounded-xl p-3 text-sm text-gray-700"
                        >
                          <div className="flex items-center justify-between">
                            <div>{inv.email || inv.phone}</div>
                            <div className="text-xs text-gray-500">
                              Expires {format(new Date(inv.expiresAt), 'MMM d')}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </>
        )}

        {activeTab === 'calendar' && <EnterpriseCalendar />}

        {activeTab === 'portfolio' && (
          <PortfolioGrid
            images={portfolioImages}
            selectedImageForAction={selectedImageForAction}
            onAddImage={() => setShowAddPortfolioModal(true)}
            onImageClick={setSelectedImageForAction}
            onCloseImageOptions={() => setSelectedImageForAction(null)}
            onSetBanner={async (imageId) => {
              if (settingBannerId) return;
              setSettingBannerId(imageId);
              try {
                const response = await setBannerImage(imageId);
                setPortfolioImages((prev) =>
                  prev.map((img) => ({
                    ...img,
                    isBannerImage: img.id === response.image.id,
                  }))
                );
                toast.success(t('toast.bannerUpdated'));
              } catch (error) {
                toast.error(t('toast.failedToSetBanner'));
              } finally {
                setSettingBannerId(null);
              }
            }}
            onSetProfilePicture={async (imageId) => {
              if (settingProfileId) return;
              setSettingProfileId(imageId);
              try {
                const response = await setProfilePicture(imageId);
                setPortfolioImages((prev) =>
                  prev.map((img) => ({
                    ...img,
                    isProfilePicture: img.id === response.image.id,
                  }))
                );
                toast.success(t('toast.profilePictureUpdated'));
              } catch (error) {
                toast.error(t('toast.failedToSetProfile'));
              } finally {
                setSettingProfileId(null);
              }
            }}
            onDeleteImage={async (imageId) => {
              if (deletingImageId) return;
              setDeletingImageId(imageId);
              try {
                await deletePortfolioImage(imageId);
                setPortfolioImages((prev) => prev.filter((img) => img.id !== imageId));
                toast.success(t('toast.imageDeleted'));
              } catch (error) {
                toast.error(t('toast.failedToDeleteImage'));
              } finally {
                setDeletingImageId(null);
              }
            }}
            settingBannerId={settingBannerId}
            settingProfileId={settingProfileId}
            deletingImageId={deletingImageId}
          />
        )}

        {activeTab === 'analytics' && dashboardAnalytics && (
          <AnalyticsView
            services={
              analytics?.services && analytics.services.length > 0
                ? analytics.services.map((s) => ({
                    id: `${s.serviceName}-${s.artistName}`,
                    name: `${s.serviceName} - ${s.artistName}`,
                    bookings: s.bookings,
                    revenue: formatPriceInMKDInt(s.revenue),
                  }))
                : []
            }
            totalRevenue={
              dashboardAnalytics.revenue?.total
                ? formatPriceInMKDInt(dashboardAnalytics.revenue.total)
                : '0 ден.'
            }
            totalBookings={dashboardAnalytics.totalBookings?.count || 0}
            activeServices={dashboardAnalytics.activeServices?.count || 0}
            avgBookingValue={
              dashboardAnalytics.avgBookingValue?.amount
                ? formatPriceInMKDInt(dashboardAnalytics.avgBookingValue.amount)
                : '0 ден.'
            }
          />
        )}

        {activeTab === 'settings' && (
          <>
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
            onProfileSave={async () => {
              if (isSavingProfile) return;
              
              // Check if values have changed
              const initial = initialProfileValues.current;
              if (initial) {
                const hasChanges =
                  initial.fullName !== profileFullName ||
                  initial.email !== (profileEmail || '') ||
                  initial.phone !== profilePhone ||
                  initial.businessName !== profileBusinessName;
                
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
                });
                await updateArtistProfile({
                  businessName: profileBusinessName,
                });
                await refreshUser();
                
                // Update initial values after successful save
                if (initialProfileValues.current) {
                  initialProfileValues.current = {
                    fullName: profileFullName,
                    email: profileEmail || '',
                    phone: profilePhone,
                    businessName: profileBusinessName,
                  };
                }
                
                toast.success(t('toast.profileUpdatedSuccessfully'));
              } catch (error) {
                toast.error(t('toast.failedToUpdateProfile'));
              } finally {
                setIsSavingProfile(false);
              }
            }}
            isSavingProfile={isSavingProfile}
            businessAddress={businessAddress}
            businessCity={businessCity}
            businessCountry={businessCountry}
            onBusinessAddressChange={setBusinessAddress}
            onBusinessCityChange={setBusinessCity}
            onBusinessCountryChange={setBusinessCountry}
            onBusinessSave={async () => {
              if (isSavingBusiness) return;
              
              // Check if values have changed
              const initial = initialBusinessValues.current;
              if (initial) {
                const hasChanges =
                  initial.address !== businessAddress ||
                  initial.city !== businessCity ||
                  initial.country !== businessCountry ||
                  (initial.salonName !== undefined && initial.salonName !== name) ||
                  (initial.salonBio !== undefined && initial.salonBio !== salonBio);
                
                if (!hasChanges) {
                  toast.info(t('toast.noChangesToSave'));
                  return;
                }
              }
              
              setIsSavingBusiness(true);
              try {
                if (!salon) {
                  toast.error(t('toast.salonNotFound'));
                  return;
                }

                await updateSalon(salon.id, {
                  name: name,
                  address: businessAddress,
                  city: businessCity,
                  country: businessCountry,
                  about: salonBio,
                });
                await refresh();
                
                // Update initial values after successful save
                if (initialBusinessValues.current) {
                  initialBusinessValues.current = {
                    address: businessAddress,
                    city: businessCity,
                    country: businessCountry,
                    salonName: name,
                    salonBio: salonBio,
                  };
                }
                initialSalonName.current = name;
                
                toast.success(t('toast.businessInformationUpdated'));
              } catch (error) {
                toast.error(t('toast.failedToUpdateBusiness'));
              } finally {
                setIsSavingBusiness(false);
              }
            }}
            isSavingBusiness={isSavingBusiness}
            salonName={name}
            salonBio={salonBio}
            onSalonNameChange={setName}
            onSalonBioChange={setSalonBio}
            customBookingLink={customBookingLink}
            onCustomBookingLinkChange={setCustomBookingLink}
            onCustomBookingLinkSave={async () => {
              if (isSavingCustomBookingLink) return;
              
              // Check if value has changed
              const trimmedLink = customBookingLink.trim() || '';
              if (initialCustomBookingLink.current !== null && initialCustomBookingLink.current === trimmedLink) {
                toast.info(t('toast.noChangesToSave'));
                return;
              }
              
              setIsSavingCustomBookingLink(true);
              try {
                if (!salon) {
                  toast.error(t('toast.salonNotFound'));
                  return;
                }

                await updateSalon(salon.id, {
                  customBookingLink: trimmedLink || undefined,
                });
                await refresh();
                
                // Update initial value after successful save
                initialCustomBookingLink.current = trimmedLink;
                
                toast.success(t('toast.customBookingLinkUpdated'));
              } catch (error: any) {
                toast.error(error?.message || 'Failed to update custom booking link');
              } finally {
                setIsSavingCustomBookingLink(false);
              }
            }}
            isSavingCustomBookingLink={isSavingCustomBookingLink}
            maxCancellationHours={maxCancellationHours}
            onMaxCancellationHoursChange={setMaxCancellationHours}
            onCancellationTimeSave={async () => {
              if (isSavingCancellationTime) return;
              setIsSavingCancellationTime(true);
              try {
                await updateArtistProfile({
                  maximumCancellationHours: maxCancellationHours,
                });
                toast.success(t('toast.cancellationSettingsUpdated'));
              } catch (error) {
                toast.error(t('toast.failedToUpdateCancellation'));
              } finally {
                setIsSavingCancellationTime(false);
              }
            }}
            isSavingCancellationTime={isSavingCancellationTime}
            workingHours={workingHours}
            onWorkingHoursChange={(day, field, value) => {
              setWorkingHours((prev) => ({
                ...prev,
                [day]: {
                  ...prev[day as keyof typeof prev],
                  [field]: value,
                },
              }));
            }}
            onBreakAdd={(day, breakData) => {
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
            }}
            onBreakAddToAll={(breakData) => {
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
            }}
            onBreakRemove={(day, breakIndex) => {
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
            }}
            onBreakChange={(day, breakIndex, field, value) => {
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
            }}
            onWorkingHoursSave={async () => {
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
                
                toast.success(t('toast.workingHoursUpdated'));
              } catch (error) {
                toast.error(t('toast.failedToUpdateWorkingHours'));
              } finally {
                setIsSavingWorkingHours(false);
              }
            }}
            isSavingWorkingHours={isSavingWorkingHours}
            isOwnerAlsoArtist={isOwnerAlsoArtist}
            salonMembers={members}
            onOwnerAlsoArtistChange={async (value: boolean) => {
              try {
                if (!salon) {
                  toast.error(t('toast.salonNotFound'));
                  return;
                }

                setIsOwnerAlsoArtist(value);

                await toggleOwnerAsArtist(salon.id, value);
                await refreshUser();

                if (value) {
                  toast.success(t('toast.nowAlsoArtist'));
                } else {
                  toast.success(t('toast.nowOnlyOwner'));
                }
              } catch (error: any) {
                console.error('Failed to update owner artist status', error);
                toast.error(error?.message || 'Failed to update artist status');

                await refreshUser();
              }
            }}
          />
          {isOwner && salon && (
            <div className="mt-8 bg-red-50 border-2 border-red-300 rounded-3xl shadow-xl p-6 lg:p-8">
              <div className="flex items-center gap-3 mb-4">
                <Settings className="text-red-600" size={20} />
                <h2 className="text-lg font-semibold text-red-700">
                  {t('enterprise.dashboard.dangerZone') || 'Danger Zone'}
                </h2>
              </div>
              <p className="text-sm text-red-600 mb-4">
                {t('enterprise.dashboard.cancelSalonDesc') ||
                  'Canceling your salon subscription will permanently delete your salon and move all artists to the Free plan. This action cannot be undone.'}
              </p>
              <Button
                onClick={() => setShowCancelSalonModal(true)}
                variant="outline"
                className="px-4 py-3 rounded-full border-2 border-red-400 text-red-600 font-semibold hover:bg-red-100 hover:border-red-500 bg-white"
              >
                {t('enterprise.dashboard.cancelSalon') || 'Cancel Salon'}
              </Button>
            </div>
          )}
          </>
        )}

        {showAddPortfolioModal && (
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
                
                const uploaded = salon?.id 
                  ? await uploadSalonPortfolioImage(salon.id, data.file)
                  : await uploadPortfolioImage(data.file);
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

                toast.success(t('toast.portfolioImageAddedEnterprise'));
                setShowAddPortfolioModal(false);
              } catch (error: any) {
                toast.error(error?.message || 'Failed to upload image');
                // Remove placeholder on error
                setPortfolioImages((prev) => prev.filter((img) => img.id !== placeholderId));
              } finally {
                setIsUploadingPortfolioImage(false);
              }
            }}
          />
        )}

        {salon && (
          <CancelSalonSubscriptionModal
            show={showCancelSalonModal}
            onClose={() => setShowCancelSalonModal(false)}
            subscription={subscription || null}
            onConfirm={handleCancelSalon}
            isLoading={isCancellingSalon}
          />
        )}
      </div>
    </div>
  );
}

