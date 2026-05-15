import { useEffect, useState } from 'react';
import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';
import { isPast } from 'date-fns';
import { useTranslation } from '../hooks/useTranslation';
import { ProfileHeader } from '../components/profile/ProfileHeader';
import { ProfileCard } from '../components/profile/ProfileCard';
import { BasicInfoSection } from '../components/profile/BasicInfoSection';
import { LocationSection } from '../components/profile/LocationSection';
import { AboutSection } from '../components/profile/AboutSection';
import { AccountInfoSection } from '../components/profile/AccountInfoSection';
import { BookingsSection } from '../components/profile/BookingsSection';
import { CancelBookingModal } from '../components/profile/CancelBookingModal';
import { DeleteAccountSection } from '../components/profile/DeleteAccountSection';
import {
  getClientBookings,
  cancelBooking as cancelBookingRequest,
  acceptRescheduleProposal,
  declineRescheduleProposal,
} from '../services/bookingService';
import {
  updateProfile as updateProfileRequest,
  updateArtistProfile,
} from '../services/authService';
import { LoadingState } from '../components/ui/LoadingState';
import { PageContainer } from '../components/ui/PageContainer';
import { formatPriceInMKDInt } from '../utils/priceFormat';

export function ProfilePage() {
  type ClientBooking = {
    id: string;
    artistName: string;
    service: string;
    date: Date;
    time: string;
    status: string;
    duration: string;
    price: string;
    artistId: string;
    maximumCancellationHours?: number | null;
  };
  const { user, isAuthenticated, isLoading: authLoading, updateUser, refreshUser } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [bookings, setBookings] = useState<ClientBooking[]>([]);
  const [showCancelBookingModal, setShowCancelBookingModal] = useState(false);
  const [bookingToCancel, setBookingToCancel] = useState<string | null>(null);
  const [isCancelingBooking, setIsCancelingBooking] = useState(false);
  const [acceptingRescheduleId, setAcceptingRescheduleId] = useState<string | null>(null);
  const [decliningRescheduleId, setDecliningRescheduleId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    fullName: user?.fullName || '',
    phone: user?.phone || '',
    email: user?.email || '',
    profession: '',
    businessName: '',
    address: '',
    city: '',
    country: '',
    about: '',
  });

  useEffect(() => {
    if (authLoading) return;

    if (!isAuthenticated) {
      navigate(`/auth?returnTo=${encodeURIComponent(location.pathname)}`);
    }
  }, [isAuthenticated, authLoading, navigate, location.pathname]);

  useEffect(() => {
    if (user) {
      setFormData({
        fullName: user.fullName || '',
        phone: user.phone || '',
        email: user.email || '',
        profession: '',
        businessName: '',
        address: '',
        city: '',
        country: '',
        about: '',
      });
    }
  }, [user]);

  const loadBookings = async () => {
    if (!isAuthenticated || !user) return;

    try {
      const response = await getClientBookings();

      if (!response || !response.bookings) {
        console.warn('No bookings in response:', response);
        setBookings([]);
        return;
      }

      const mapped: ClientBooking[] = response.bookings.map((booking: any) => {
        // Format price in MKD
        const formattedPrice = formatPriceInMKDInt(booking.price);

        return {
          ...booking,
          id: String(booking.id || booking.Id),
          artistId:
            booking.artistId || booking.ArtistId
              ? String(booking.artistId || booking.ArtistId)
              : '',
          artistName: booking.artistName || booking.ArtistName || booking.artist || '',
          service: booking.service || booking.Service || '',
          date: new Date(booking.date || booking.Date),
          time: booking.time || booking.Time || '',
          status: booking.status || booking.Status || 'confirmed',
          duration:
            typeof booking.duration === 'number'
              ? `${booking.duration} min`
              : booking.duration || booking.Duration || '',
          price: formattedPrice,
          maximumCancellationHours:
            booking.maximumCancellationHours || booking.MaximumCancellationHours || null,
        };
      });

      setBookings(mapped);
    } catch (error) {
      console.error('Failed to load bookings', error);
      toast.error(t('toast.genericError'), {
        description: t('toast.genericErrorDesc'),
      });
    }
  };

  useEffect(() => {
    loadBookings();
  }, [isAuthenticated, user]);

  if (authLoading) {
    return <LoadingState message="Loading..." />;
  }

  if (!isAuthenticated || !user) {
    return null;
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSave = async () => {
    if (!formData.fullName.trim()) {
      toast.error(t('settings.profile.fullNameRequired') || 'Full name is required');
      return;
    }
    if (formData.fullName.length > 50) {
      toast.error(
        t('settings.profile.fullNameTooLong') || 'Full name must be 50 characters or less'
      );
      return;
    }
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      toast.error(t('settings.profile.invalidEmail') || 'Please enter a valid email address');
      return;
    }

    setIsSaving(true);
    try {
      const updatedUser = await updateProfileRequest({
        fullName: formData.fullName.trim(),
        email: formData.email || undefined,
      });

      if (user?.userType === 'artist') {
        await updateArtistProfile({
          profession: formData.profession || undefined,
          businessName: formData.businessName || undefined,
          address: formData.address || undefined,
          city: formData.city || undefined,
          country: formData.country || undefined,
          about: formData.about || undefined,
        });
      }

      await refreshUser();
      updateUser(updatedUser);
      setIsEditing(false);
      toast.success(t('toast.profileSettingsSaved'), {
        description: t('toast.profileSettingsSavedDesc'),
      });
    } catch (error) {
      console.error('Failed to save profile:', error);
      toast.error(t('toast.profileSaveFailed'), {
        description: t('toast.profileSaveFailedDesc'),
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    if (user) {
      setFormData({
        fullName: user.fullName || '',
        phone: user.phone || '',
        email: user.email || '',
        profession: '',
        businessName: '',
        address: '',
        city: '',
        country: '',
        about: '',
      });
    }
    setIsEditing(false);
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
      return { allowed: false, message: t('toast.bookingNotFound') };
    }

    const maxCancellationHours = booking.maximumCancellationHours ?? 24;

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

  const handleAcceptReschedule = async (bookingId: string) => {
    if (acceptingRescheduleId) return;
    setAcceptingRescheduleId(bookingId);
    try {
      await acceptRescheduleProposal(bookingId);
      await loadBookings();
      toast.success(t('toast.rescheduleAccepted'), {
        description: t('toast.rescheduleAcceptedDesc'),
      });
    } catch (error: any) {
      console.error('Failed to accept reschedule:', error);
      toast.error(t('toast.rescheduleAcceptFailed'), {
        description: error?.message || t('toast.rescheduleAcceptFailedDesc'),
      });
    } finally {
      setAcceptingRescheduleId(null);
    }
  };

  const handleDeclineReschedule = async (bookingId: string) => {
    if (decliningRescheduleId) return;
    setDecliningRescheduleId(bookingId);
    try {
      await declineRescheduleProposal(bookingId);
      await loadBookings();
      toast.success(t('toast.rescheduleDeclined'), {
        description: t('toast.rescheduleDeclinedDesc'),
      });
    } catch (error: any) {
      console.error('Failed to decline reschedule:', error);
      toast.error(t('toast.rescheduleDeclineFailed'), {
        description: error?.message || t('toast.rescheduleDeclineFailedDesc'),
      });
    } finally {
      setDecliningRescheduleId(null);
    }
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

  const isArtist = user.userType === 'artist';

  const upcomingBookings = bookings.filter(
    (booking) =>
      (booking.status === 'confirmed' ||
        booking.status === 'pending' ||
        booking.status === 'pending_reschedule') &&
      !isPast(booking.date)
  );
  const pastBookings = bookings.filter(
    (booking) =>
      booking.status === 'completed' ||
      booking.status === 'cancelled' ||
      (isPast(booking.date) &&
        booking.status !== 'pending' &&
        booking.status !== 'pending_reschedule')
  );

  const bookingToCancelData = bookingToCancel
    ? bookings.find((b) => b.id === bookingToCancel)
    : null;
  const cancellationCheck = bookingToCancelData
    ? canCancelBooking(bookingToCancelData)
    : { allowed: false, message: '' };

  return (
    <div className="min-h-screen bg-blue-50 py-12">
      <PageContainer maxWidth="4xl">
        <ProfileHeader
          user={user}
          isEditing={isEditing}
          isSaving={isSaving}
          onEdit={() => setIsEditing(true)}
          onCancel={handleCancel}
          onSave={handleSave}
        />

        <ProfileCard user={user} />

        <div className="bg-white rounded-3xl shadow-xl overflow-hidden mt-6">
          <div className="p-8">
            <div className="space-y-6">
              <BasicInfoSection
                isEditing={isEditing}
                isArtist={isArtist}
                formData={formData}
                user={user}
                onInputChange={handleInputChange}
              />

              {isArtist && (
                <LocationSection
                  isEditing={isEditing}
                  formData={formData}
                  onInputChange={handleInputChange}
                />
              )}

              {isArtist && (
                <AboutSection
                  isEditing={isEditing}
                  about={formData.about}
                  onAboutChange={(value) => handleInputChange('about', value)}
                />
              )}

              <AccountInfoSection userType={user.userType} />

              <DeleteAccountSection />
            </div>
          </div>
        </div>

        <BookingsSection
          upcomingBookings={upcomingBookings}
          pastBookings={pastBookings}
          canCancelBooking={canCancelBooking}
          onCancelBooking={handleCancelBooking}
          onAcceptReschedule={handleAcceptReschedule}
          onDeclineReschedule={handleDeclineReschedule}
          onViewArtist={(artistId) => navigate(`/${artistId}`)}
          onBrowseArtists={() => navigate('/directory')}
          acceptingRescheduleId={acceptingRescheduleId}
          decliningRescheduleId={decliningRescheduleId}
        />
      </PageContainer>

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
    </div>
  );
}
