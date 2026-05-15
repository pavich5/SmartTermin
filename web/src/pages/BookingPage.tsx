import React, { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { useAuth } from '../contexts/AuthContext';
import { ArtistHeader } from '../components/booking/ArtistHeader';
import { ServiceSelection } from '../components/booking/ServiceSelection';
import { CalendarView } from '../components/booking/CalendarView';
import { TimeSlotSelection } from '../components/booking/TimeSlotSelection';
import { BookingSummary } from '../components/booking/BookingSummary';
import { BookingModal } from '../components/booking/BookingModal';
import { SuccessModal } from '../components/booking/SuccessModal';
import { ArtistProfileResponse, getArtistById } from '../services/artistService';
import { createBooking, getAvailableSlots, getClientBookings } from '../services/bookingService';
import { toast } from 'sonner';
import { useTranslation } from '../hooks/useTranslation';
import { LoadingState } from '../components/ui/LoadingState';
import { ErrorState } from '../components/ui/ErrorState';
import { PageContainer } from '../components/ui/PageContainer';

export function BookingPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const { t } = useTranslation();

  const [artist, setArtist] = useState<ArtistProfileResponse | null>(null);
  const [isLoadingArtist, setIsLoadingArtist] = useState(false);
  const [selectedServices, setSelectedServices] = useState<ArtistProfileResponse['services']>([]);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedTime, setSelectedTime] = useState<Date | null>(null);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [customerInfo, setCustomerInfo] = useState({
    notes: '',
  });

  const [availableSlots, setAvailableSlots] = useState<Date[]>([]);
  const [allSlots, setAllSlots] = useState<
    Array<{ time: Date; available: boolean; nextAvailableTime?: string | null; isBreak?: boolean }>
  >([]);
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);
  const [clientBookings, setClientBookings] = useState<any[]>([]);
  const [isHoliday, setIsHoliday] = useState(false);
  const [holidayDescription, setHolidayDescription] = useState<string | undefined>(undefined);
  const [isSubmittingBooking, setIsSubmittingBooking] = useState(false);

  useEffect(() => {
    const loadClientBookings = async () => {
      if (!user || !isAuthenticated) {
        setClientBookings([]);
        return;
      }

      try {
        const response = await getClientBookings();
        setClientBookings(response.bookings || []);
      } catch (error) {
        console.error('Failed to load client bookings', error);
        setClientBookings([]);
      }
    };

    loadClientBookings();
  }, [user, isAuthenticated]);

  useEffect(() => {
    const loadArtist = async () => {
      if (!id) return;
      setIsLoadingArtist(true);
      try {
        const response = await getArtistById(id);
        setArtist(response);
      } catch (error) {
        console.error('Failed to load artist', error);
        toast.error(t('toast.unableToLoadArtist'));
      } finally {
        setIsLoadingArtist(false);
      }
    };

    loadArtist();
  }, [id]);

  useEffect(() => {
    if (artist && artist.services && artist.services.length > 0 && selectedServices.length === 0) {
      setSelectedServices([artist.services[0]]);
    }
  }, [artist, selectedServices.length]);

  const workingDays = useMemo(() => {
    if (!artist?.workingHours) return [1, 2, 3, 4, 5, 6, 7];
    const mapDayToNumber: Record<string, number> = {
      monday: 1,
      tuesday: 2,
      wednesday: 3,
      thursday: 4,
      friday: 5,
      saturday: 6,
      sunday: 7,
    };

    return Object.entries(artist.workingHours)
      .filter(([, value]) => typeof value === 'string' && !/closed/i.test(value))
      .map(([day]) => mapDayToNumber[day.toLowerCase()])
      .filter(Boolean) as number[];
  }, [artist?.workingHours]);

  useEffect(() => {
    const loadSlots = async () => {
      if (!artist || !artist.id || selectedServices.length === 0 || !selectedDate) {
        setAvailableSlots([]);
        setAllSlots([]);
        return;
      }
      setIsLoadingSlots(true);
      try {
        const dateStr = format(selectedDate, 'yyyy-MM-dd');
        const serviceIds = selectedServices.map((s) => String(s.id)).join(',');
        const response = await getAvailableSlots({
          artistId: artist.id,
          serviceIds: serviceIds,
          date: dateStr,
        });
        
        // Store holiday information
        setIsHoliday(response.isHoliday ?? false);
        setHolidayDescription(response.holidayDescription);
        
        const parseTimeSlot = (timeStr: string): Date | null => {
          try {
            const trimmed = timeStr.trim();
            const timeMatch = trimmed.match(/(\d+):(\d+)\s*(AM|PM)/i);

            if (!timeMatch) {
              console.warn('Invalid time format:', timeStr);
              return null;
            }

            let hours = parseInt(timeMatch[1], 10);
            const minutes = parseInt(timeMatch[2], 10);
            const period = timeMatch[3].toUpperCase();

            if (period === 'PM' && hours !== 12) {
              hours += 12;
            } else if (period === 'AM' && hours === 12) {
              hours = 0;
            }

            if (
              isNaN(hours) ||
              isNaN(minutes) ||
              hours < 0 ||
              hours > 23 ||
              minutes < 0 ||
              minutes > 59
            ) {
              console.warn('Invalid hours or minutes:', hours, minutes);
              return null;
            }

            const slotDate = new Date(selectedDate);
            if (isNaN(slotDate.getTime())) {
              console.warn('Invalid selectedDate:', selectedDate);
              return null;
            }
            slotDate.setHours(hours, minutes, 0, 0);

            if (isNaN(slotDate.getTime())) {
              console.warn('Invalid slotDate after setHours:', slotDate);
              return null;
            }

            return slotDate;
          } catch (error) {
            console.error('Error creating slot date:', error, timeStr);
            return null;
          }
        };

        const processedSlots: Array<{
          time: Date;
          available: boolean;
          nextAvailableTime?: string | null;
          isBreak?: boolean;
        }> = [];

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const selectedDateOnly = new Date(selectedDate);
        selectedDateOnly.setHours(0, 0, 0, 0);
        const isToday = selectedDateOnly.getTime() === today.getTime();
        const now = new Date();

        for (const slot of response.slots) {
          if (!slot.time) continue;
          const slotDate = parseTimeSlot(slot.time);
          if (!slotDate) continue;

          let isAvailable = slot.available;
          if (isToday && slotDate < now) {
            isAvailable = false;
          }

          processedSlots.push({
            time: slotDate,
            available: isAvailable,
            nextAvailableTime: slot.nextAvailableTime,
            isBreak: slot.isBreak ?? false,
          });
        }

        setAllSlots(processedSlots);

        const availableOnly = processedSlots
          .filter((slot) => slot.available)
          .map((slot) => slot.time);
        setAvailableSlots(availableOnly);
      } catch (error) {
        console.error('Failed to load available slots', error);
        toast.error(t('toast.unableToLoadSlots'));
        setAvailableSlots([]);
        setAllSlots([]);
        setIsHoliday(false);
        setHolidayDescription(undefined);
      } finally {
        setIsLoadingSlots(false);
      }
    };

    loadSlots();
  }, [artist, selectedServices, selectedDate]);

  const handleTimeSlotClick = async (slot: Date) => {
    if (!artist || !artist.id || !selectedDate || selectedServices.length === 0) {
      return;
    }

    if (!user) {
      setSelectedTime(slot);
      setShowBookingModal(true);
      return;
    }

    const dateStr = format(selectedDate, 'yyyy-MM-dd');
    const selectedServiceIds = selectedServices.map((s) => String(s.id));

    const existingBooking = clientBookings.find((booking: any) => {
      const sameArtist = booking.artistId === artist.id || booking.ArtistId === artist.id;
      const sameDate = format(new Date(booking.date || booking.Date), 'yyyy-MM-dd') === dateStr;
      const notCancelled = booking.status !== 'cancelled' && booking.Status !== 'cancelled';

      if (!sameArtist || !sameDate || !notCancelled) return false;

      const bookingServiceId =
        booking.serviceId ||
        booking.ServiceId ||
        (booking.service && booking.service.id) ||
        (booking.Service && booking.Service.id);

      return bookingServiceId && selectedServiceIds.includes(String(bookingServiceId));
    });

    if (existingBooking) {
      const conflictingService = selectedServices.find((s) => {
        const serviceId = String(s.id);
        const bookingServiceId =
          existingBooking.serviceId ||
          existingBooking.ServiceId ||
          (existingBooking.service && existingBooking.service.id) ||
          (existingBooking.Service && existingBooking.Service.id);
        return String(bookingServiceId) === serviceId;
      });

      toast.error(t('booking.errors.sameServicePerDay'), {
        description:
          t('booking.errors.sameServicePerDayDesc') ||
          `You already have a booking for "${conflictingService?.name || 'a service'}" with this artist on this date. You can only book the same service once per day.`,
        duration: 5000,
      });
      return;
    }

    setSelectedTime(slot);
    setShowBookingModal(true);
  };

  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedServices.length === 0 || !selectedDate || !selectedTime || !artist || !artist.id || !user) return;
    if (isSubmittingBooking) return;

    setIsSubmittingBooking(true);
    try {
      await createBooking({
        artistId: artist.id,
        serviceIds: selectedServices.map((s) => String(s.id)),
        date: format(selectedDate, 'yyyy-MM-dd'),
        time: format(selectedTime, 'HH:mm'),
        customerName: user.fullName,
        customerEmail: user.email || '',
        customerPhone: user.phone,
        notes: customerInfo.notes,
      });

      setShowBookingModal(false);
      setShowSuccess(true);
    } catch (error) {
      console.error('Failed to create booking', error);
      let errorMessage = 'Unable to create booking right now';

      if (error instanceof Error) {
        const errorMsg = error.message.toLowerCase();
        if (errorMsg.includes('already have a booking') || errorMsg.includes('same service')) {
          errorMessage =
            t('booking.errors.sameServicePerDay') ||
            error.message ||
            'You already have a booking for this service with this artist on this date. You can only book the same service once per day.';
        } else if (errorMsg.includes('not available') || errorMsg.includes('slot')) {
          errorMessage = error.message;
        } else if (!errorMsg.includes('request failed with status')) {
          errorMessage = error.message;
        }
      }

      toast.error(errorMessage);
    } finally {
      setIsSubmittingBooking(false);
    }
  };

  const handleServiceToggle = (service: {
    id: string | number;
    name: string;
    duration: number;
    price: number;
  }) => {
    const serviceTyped = service as ArtistProfileResponse['services'][0];
    setSelectedServices((prev) => {
      const isSelected = prev.some((s) => s.id === service.id);
      if (isSelected) {
        const newServices = prev.filter((s) => s.id !== service.id);
        if (newServices.length === 0) {
          setSelectedDate(undefined);
          setSelectedTime(null);
        }
        return newServices;
      } else {
        return [...prev, serviceTyped];
      }
    });
  };

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
    setSelectedTime(null);
  };

  const handleFieldChange = (field: keyof typeof customerInfo, value: string) => {
    setCustomerInfo({ ...customerInfo, [field]: value });
  };

  if (isLoadingArtist) {
    return <LoadingState message="Loading artist..." />;
  }

  if (!artist) {
    return <ErrorState message="Artist not found." />;
  }

  return (
    <div className="min-h-screen bg-blue-50 pb-24">
      <PageContainer maxWidth="6xl" className="py-8">
        <ArtistHeader
          artistId={id}
          profileImage={artist.profileImage}
          name={artist.name}
          profession={artist.profession}
          onBack={() => navigate(`/${id}`)}
        />

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <ServiceSelection
              services={artist.services}
              selectedServices={selectedServices}
              onServiceToggle={handleServiceToggle}
            />

            {selectedServices.length > 0 && (
              <CalendarView
                currentMonth={currentMonth}
                selectedDate={selectedDate}
                workingDays={workingDays}
                onMonthChange={setCurrentMonth}
                onDateSelect={handleDateSelect}
              />
            )}

            {selectedDate &&
              selectedServices.length > 0 &&
              (isLoadingSlots ? (
                <div className="bg-white rounded-xl shadow p-6 text-center text-gray-500">
                  Loading available time slots...
                </div>
              ) : (
                <TimeSlotSelection
                  allSlots={allSlots}
                  selectedTime={selectedTime}
                  onTimeSelect={handleTimeSlotClick}
                  isHoliday={isHoliday}
                  holidayDescription={holidayDescription}
                />
              ))}
          </div>

          <BookingSummary
            selectedServices={selectedServices}
            selectedDate={selectedDate}
            selectedTime={selectedTime}
          />
        </div>
      </PageContainer>

      <BookingModal
        show={showBookingModal}
        selectedServices={selectedServices}
        selectedDate={selectedDate}
        selectedTime={selectedTime}
        customerInfo={customerInfo}
        onClose={() => setShowBookingModal(false)}
        onFieldChange={handleFieldChange}
        onSubmit={handleBookingSubmit}
        isLoading={isSubmittingBooking}
      />

      <SuccessModal
        show={showSuccess}
        onClose={() => {
          setShowSuccess(false);
          if (id) {
            navigate(`/${id}`);
          } else {
            navigate('/');
          }
        }}
      />
    </div>
  );
}
