import React, { useState } from 'react';
import { format, isSameDay, isWithinInterval, startOfDay, endOfDay } from 'date-fns';
import { DateRange } from 'react-day-picker';
import { useTranslation } from '../hooks/useTranslation';
import { getDateLocale } from '../utils/dateLocale';
import { toast } from 'sonner';
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
import { AddServiceModal } from '../components/dashboard/modals/AddServiceModal';
import { EditServiceModal } from '../components/dashboard/modals/EditServiceModal';
import { DeleteServiceModal } from '../components/dashboard/modals/DeleteServiceModal';
import { WalkInModal } from '../components/dashboard/modals/WalkInModal';
import { CancelBookingModal } from '../components/dashboard/modals/CancelBookingModal';
import { RebookModal } from '../components/dashboard/modals/RebookModal';
import { ProposeRescheduleModal } from '../components/dashboard/modals/ProposeRescheduleModal';
import { AddPortfolioModal } from '../components/dashboard/modals/AddPortfolioModal';
import { CancelSubscriptionModal } from '../components/dashboard/modals/CancelSubscriptionModal';
import { WorkingHoursResponse } from '../services/settingsService';
import { DashboardAnalytics, PopularService } from '../services/analyticsService';
import { ServiceItem } from '../services/serviceService';
import { ClientItem } from '../services/clientService';
import { PortfolioImage } from '../services/portfolioService';
import { PageContainer } from '../components/ui/PageContainer';
import { Holiday } from '../services/settingsService';

const mockUser = {
  id: 'demo-user',
  email: 'demo@smarttermin.com',
  fullName: 'Демо уметник',
  phone: '+389 70 123 456',
  userType: 'artist' as const,
  onboardingCompleted: true,
  isFreeTrialActive: false,
};

const mockBookings = [
  {
    id: '1',
    client: 'Сара Јовановска',
    service: 'Фризура и стилизирање',
    time: '10:00',
    status: 'confirmed',
    duration: '60 min',
    price: '600 ден.',
    date: new Date(),
  },
  {
    id: '2',
    client: 'Марија Петрова',
    service: 'Боја на коса',
    time: '14:00',
    status: 'confirmed',
    duration: '120 min',
    price: '2000 ден.',
    date: new Date(),
  },
  {
    id: '3',
    client: 'Ема Стојановска',
    service: 'Фризура',
    time: '16:00',
    status: 'pending',
    duration: '45 min',
    price: '400 ден.',
    date: new Date(Date.now() + 86400000),
  },
  {
    id: '4',
    client: 'Оливија Трајковска',
    service: 'Фризура и стилизирање',
    time: '11:00',
    status: 'completed',
    duration: '60 min',
    price: '600 ден.',
    date: new Date(Date.now() - 86400000),
  },
];

const mockServices: ServiceItem[] = [
  {
    id: '1',
    name: 'Фризура',
    duration: 45,
    price: 400,
    description: 'Професионална фризура со стилизирање',
    bookings: 24,
    revenue: '9,600 ден.',
  },
  {
    id: '2',
    name: 'Фризура и стилизирање',
    duration: 60,
    price: 600,
    description: 'Фризура со професионално стилизирање',
    bookings: 18,
    revenue: '10,800 ден.',
  },
  {
    id: '3',
    name: 'Боја на коса',
    duration: 120,
    price: 2000,
    description: 'Комплетна услуга за боење на коса',
    bookings: 8,
    revenue: '16,000 ден.',
  },
  {
    id: '4',
    name: 'Мелаж',
    duration: 90,
    price: 2500,
    description: 'Професионален мелаж на коса',
    bookings: 12,
    revenue: '30,000 ден.',
  },
];

const mockClients: ClientItem[] = [
  {
    id: '1',
    name: 'Сара Јовановска',
    email: 'sara@example.com',
    phone: '+389 70 111 222',
    bookings: 5,
  },
  {
    id: '2',
    name: 'Марија Петрова',
    email: 'maria@example.com',
    phone: '+389 70 222 333',
    bookings: 3,
  },
  {
    id: '3',
    name: 'Ема Стојановска',
    email: 'ema@example.com',
    phone: '+389 70 333 444',
    bookings: 2,
  },
  {
    id: '4',
    name: 'Оливија Трајковска',
    email: 'olivija@example.com',
    phone: '+389 70 444 555',
    bookings: 4,
  },
];

const mockAnalytics: DashboardAnalytics = {
  revenue: { total: 66400, change: '+12.5%' },
  totalBookings: { count: 62, change: '+8.3%' },
  newClients: { count: 15, change: '+25%' },
  returningClients: { percentage: 68, change: '+5%' },
  avgBookingValue: { amount: 1070.97, currency: 'MKD' },
  activeServices: { count: 4 },
};

const mockPopularServices: PopularService[] = [
  { id: '1', name: 'Фризура и стилизирање', bookings: 18, revenue: '10,800 ден.' },
  { id: '2', name: 'Фризура', bookings: 24, revenue: '9,600 ден.' },
  { id: '3', name: 'Мелаж', bookings: 12, revenue: '30,000 ден.' },
  { id: '4', name: 'Боја на коса', bookings: 8, revenue: '16,000 ден.' },
];

const mockPortfolioImages: PortfolioImage[] = [
  {
    id: '1',
    url: 'https://images.unsplash.com/photo-1562322140-8baeececf3df?w=800&q=80',
    isBannerImage: true,
    isProfilePicture: false,
  },
  {
    id: '2',
    url: 'https://images.unsplash.com/photo-1562322140-8baeececf3df?w=800&q=80',
    isBannerImage: false,
    isProfilePicture: true,
  },
  {
    id: '3',
    url: 'https://images.unsplash.com/photo-1562322140-8baeececf3df?w=800&q=80',
    isBannerImage: false,
    isProfilePicture: false,
  },
  {
    id: '4',
    url: 'https://images.unsplash.com/photo-1562322140-8baeececf3df?w=800&q=80',
    isBannerImage: false,
    isProfilePicture: false,
  },
];

const mockWorkingHours: WorkingHoursResponse = {
  monday: {
    start: '09:00',
    end: '18:00',
    closed: false,
    breaks: [{ start: '12:00', end: '13:00' }],
  },
  tuesday: {
    start: '09:00',
    end: '18:00',
    closed: false,
    breaks: [{ start: '12:00', end: '13:00' }],
  },
  wednesday: {
    start: '09:00',
    end: '18:00',
    closed: false,
    breaks: [{ start: '12:00', end: '13:00' }],
  },
  thursday: {
    start: '09:00',
    end: '20:00',
    closed: false,
    breaks: [{ start: '12:00', end: '13:00' }],
  },
  friday: {
    start: '09:00',
    end: '20:00',
    closed: false,
    breaks: [{ start: '12:00', end: '13:00' }],
  },
  saturday: { start: '10:00', end: '17:00', closed: false, breaks: [] },
  sunday: { start: '09:00', end: '18:00', closed: true, breaks: [] },
};

const mockHolidays: Holiday[] = [
  {
    id: 'demo-holiday-1',
    holidayDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 7 days from now
    description: 'Demo Holiday - Day Off',
  },
  {
    id: 'demo-holiday-2',
    holidayDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 14 days from now
    description: 'Demo Holiday - Special Event',
  },
];

export function DashboardPreview() {
  const { t, language } = useTranslation();
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
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  const [showAllClients, setShowAllClients] = useState(false);
  const [showCancelBookingModal, setShowCancelBookingModal] = useState(false);
  const [bookingToCancel, setBookingToCancel] = useState<string | null>(null);
  const [showRebookModal, setShowRebookModal] = useState(false);
  const [bookingToRebook, setBookingToRebook] = useState<any>(null);
  const [rebookDate, setRebookDate] = useState<Date | null>(null);
  const [rebookTime, setRebookTime] = useState<string>('');
  const [showProposeRescheduleModal, setShowProposeRescheduleModal] = useState(false);
  const [bookingToReschedule, setBookingToReschedule] = useState<any>(null);
  const [rescheduleDate, setRescheduleDate] = useState<Date | null>(null);
  const [rescheduleTime, setRescheduleTime] = useState<string>('');
  const [rescheduleMessage, setRescheduleMessage] = useState<string>('');
  const [showAddPortfolioModal, setShowAddPortfolioModal] = useState(false);
  const [selectedImageForAction, setSelectedImageForAction] = useState<string | null>(null);
  const [showCancelSubscriptionModal, setShowCancelSubscriptionModal] = useState(false);
  const [maxCancellationHours, setMaxCancellationHours] = useState<number>(24);
  const [workingHours, setWorkingHours] = useState<WorkingHoursResponse>(mockWorkingHours);
  const [profileFullName, setProfileFullName] = useState(mockUser.fullName);
  const [profileEmail, setProfileEmail] = useState(mockUser.email);
  const [profilePhone, setProfilePhone] = useState(mockUser.phone);
  const [profileBusinessName, setProfileBusinessName] = useState('Демо студио за убавина');
  const [businessAddress, setBusinessAddress] = useState('ул. Македонија бр. 123');
  const [businessCity, setBusinessCity] = useState('Скопје');
  const [businessCountry, setBusinessCountry] = useState('Македонија');

  const bookings = mockBookings;
  const services = mockServices;
  const clients = mockClients;
  const analytics = mockAnalytics;
  const popularServices = mockPopularServices;
  const portfolioImages = mockPortfolioImages;

  const smallestDuration = services.length > 0 ? Math.min(...services.map((s) => s.duration)) : 30;
  const timeInterval =
    smallestDuration >= 60 ? 60 : smallestDuration >= 30 ? 30 : smallestDuration >= 15 ? 15 : 5;

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
    return { allowed: true, hoursUntilDeadline: 24, hoursUntilAppointment: 24 };
  };

  const today = new Date();
  const filteredBookings =
    dateRange && dateRange.from
      ? getBookingsForDateRange(dateRange)
      : activeTab === 'bookings'
        ? getBookingsForDate(today)
        : selectedDate
          ? getBookingsForDate(selectedDate)
          : [];

  const getDateHeader = () => {
    if (dateRange?.from) {
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
  const totalRevenue = totalRevenueValue.toLocaleString(numberLocale, {
    style: 'currency',
    currency: analytics?.avgBookingValue?.currency || 'MKD',
    maximumFractionDigits: 0,
  });
  const totalBookings = analytics?.totalBookings.count ?? 0;
  const activeServices = analytics?.activeServices.count ?? services.length;
  const avgBookingValue = totalBookings
    ? (analytics?.avgBookingValue?.amount ?? totalRevenueValue / totalBookings).toLocaleString(
        numberLocale,
        {
          style: 'currency',
          currency: analytics?.avgBookingValue?.currency || 'MKD',
          maximumFractionDigits: 0,
        }
      )
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

  const generateTimeSlots = (date: Date) => {
    const slots: string[] = [];
    const startHour = 9;
    const endHour = 20;
    for (let hour = startHour; hour < endHour; hour++) {
      for (let minute = 0; minute < 60; minute += timeInterval) {
        const timeString = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
        slots.push(timeString);
      }
    }
    return slots;
  };

  const handleAddService = (service: {
    name: string;
    duration: string;
    price: string;
    description: string;
  }) => {
    toast.success(t('toast.serviceAdded'), {
      description: t('toast.serviceAddedDesc'),
    });
  };

  const handleEditService = (service: {
    id?: string;
    name: string;
    duration: string;
    price: string;
    description: string;
  }) => {
    toast.success(t('toast.serviceUpdated'), {
      description: t('toast.serviceUpdatedDesc'),
    });
  };

  const handleDeleteService = () => {
    toast.success(t('toast.serviceDeleted'), {
      description: t('toast.serviceDeletedDesc'),
    });
  };

  const handleWalkIn = (data: {
    clientName: string;
    clientEmail: string;
    clientPhone: string;
    serviceId: string;
    date: string;
    time: string;
  }) => {
    toast.success(t('toast.walkInAdded'), {
      description: t('toast.walkInAddedDesc'),
    });
  };

  const handleCancelBooking = (bookingId: string) => {
    setBookingToCancel(bookingId);
    setShowCancelBookingModal(true);
  };

  const confirmCancelBooking = () => {
    toast.success(t('toast.bookingCancelled'), {
      description: t('toast.bookingCancelledDesc'),
    });
    setShowCancelBookingModal(false);
    setBookingToCancel(null);
  };

  const handleRebookBooking = (booking: any) => {
    setBookingToRebook(booking);
    setRebookDate(new Date());
    setRebookTime('');
    setShowRebookModal(true);
  };

  const confirmRebookBooking = () => {
    toast.success(t('toast.bookingRebooked'), {
      description: t('toast.bookingRebookedDesc'),
    });
    setShowRebookModal(false);
    setBookingToRebook(null);
    setRebookDate(null);
    setRebookTime('');
  };

  const handleProposeReschedule = (booking: any) => {
    setBookingToReschedule(booking);
    setRescheduleDate(booking.date);
    setRescheduleTime('');
    setRescheduleMessage('');
    setShowProposeRescheduleModal(true);
  };

  const confirmProposeReschedule = () => {
    toast.success(t('toast.rescheduleProposalSent'), {
      description: t('toast.rescheduleProposalSentDesc'),
    });
    setShowProposeRescheduleModal(false);
    setBookingToReschedule(null);
    setRescheduleDate(null);
    setRescheduleTime('');
    setRescheduleMessage('');
  };

  const handleAddPortfolioImage = (data: {
    file: File;
    setAsBanner: boolean;
    setAsProfile: boolean;
  }) => {
    toast.success(t('toast.portfolioImageAdded'), {
      description: t('toast.portfolioImageAddedDesc'),
    });
  };

  const bookingToCancelData = bookingToCancel
    ? bookings.find((b) => b.id === bookingToCancel)
    : null;
  const cancellationCheck = bookingToCancelData
    ? canCancelBooking(bookingToCancelData)
    : { allowed: true };

  const bookingForModal = bookingToCancelData
    ? {
        id: bookingToCancelData.id,
        client: bookingToCancelData.client,
        service: bookingToCancelData.service,
        time: bookingToCancelData.time,
        duration: bookingToCancelData.duration,
        price: bookingToCancelData.price,
      }
    : null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-12 overflow-x-hidden">
      <PageContainer>
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-sky-700 mb-2">
            {t('dashboard.title')}
          </h1>
          <p className="text-gray-600">{t('dashboard.subtitle')}</p>
          <p className="text-sm text-gray-500 mt-2">{t('dashboard.demoMode')}</p>
        </div>

        <div className="grid lg:grid-cols-4 gap-6 w-full">
          <div className="lg:col-span-1 w-full">
            <DashboardSidebar
              user={mockUser}
              activeTab={activeTab}
              onTabChange={setActiveTab}
              profilePictureUrl={portfolioImages.find((img) => img.isProfilePicture)?.url || null}
              isSalonMember={false}
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
              />
            )}

            {activeTab === 'analytics' && (
              <AnalyticsView
                services={
                  popularServices.length
                    ? popularServices.map((s) => ({
                        name: s.name,
                        bookings: s.bookings,
                        revenue: s.revenue,
                      }))
                    : services.map((s) => ({
                        name: s.name,
                        bookings: s.bookings ?? 0,
                        revenue: s.revenue ?? '0 ден.',
                      }))
                }
                totalRevenue={totalRevenue}
                totalBookings={totalBookings}
                activeServices={activeServices}
                avgBookingValue={avgBookingValue}
              />
            )}

            {activeTab === 'payments' && (
              <PaymentsView
                payments={[]}
                subscription={null}
                onCancelSubscription={() => setShowCancelSubscriptionModal(true)}
                onViewInvoice={(paymentId) => {
                  toast.info(t('toast.invoiceView'), {
                    description: t('toast.invoiceViewDesc'),
                  });
                }}
              />
            )}

            {activeTab === 'portfolio' && (
              <PortfolioGrid
                images={portfolioImages}
                selectedImageForAction={selectedImageForAction}
                onAddImage={() => setShowAddPortfolioModal(true)}
                onImageClick={setSelectedImageForAction}
                onCloseImageOptions={() => setSelectedImageForAction(null)}
                onSetBanner={() => {
                  toast.success(t('toast.portfolioImageAdded'), {
                    description: t('toast.portfolioImageAddedDesc'),
                  });
                  setSelectedImageForAction(null);
                }}
                onSetProfilePicture={() => {
                  toast.success(t('toast.portfolioImageAdded'), {
                    description: t('toast.portfolioImageAddedDesc'),
                  });
                  setSelectedImageForAction(null);
                }}
                onDeleteImage={(imageId) => {
                  toast.success(t('toast.imageDeleted'), {
                    description: t('toast.imageDeletedDesc'),
                  });
                  setSelectedImageForAction(null);
                }}
              />
            )}

            {activeTab === 'services' && (
              <ServicesList
                services={services.map((s) => ({
                  ...s,
                  bookings: s.bookings ?? 0,
                  revenue: s.revenue ?? '0 ден.',
                }))}
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
                onProfileFullNameChange={setProfileFullName}
                onProfileEmailChange={setProfileEmail}
                onProfilePhoneChange={setProfilePhone}
                onProfileBusinessNameChange={setProfileBusinessName}
                onProfileSave={() => {
                  toast.success(t('toast.profileSettingsSaved'), {
                    description: t('toast.profileSettingsSavedDesc'),
                  });
                }}
                businessAddress={businessAddress}
                businessCity={businessCity}
                businessCountry={businessCountry}
                onBusinessAddressChange={setBusinessAddress}
                onBusinessCityChange={setBusinessCity}
                onBusinessCountryChange={setBusinessCountry}
                onBusinessSave={() => {
                  toast.success(t('toast.businessSettingsSaved'), {
                    description: t('toast.businessSettingsSavedDesc'),
                  });
                }}
                maxCancellationHours={maxCancellationHours}
                onMaxCancellationHoursChange={setMaxCancellationHours}
                onCancellationTimeSave={() => {
                  toast.success(t('toast.bookingSettingsSaved'), {
                    description: t('toast.bookingSettingsSavedDesc', {
                      hours: maxCancellationHours,
                    }),
                  });
                }}
                workingHours={workingHours}
                onWorkingHoursChange={handleWorkingHoursChange}
                onBreakAdd={handleBreakAdd}
                onBreakAddToAll={handleBreakAddToAll}
                onBreakRemove={handleBreakRemove}
                onBreakChange={handleBreakChange}
                onWorkingHoursSave={() => {
                  toast.success(t('toast.workingHoursSaved'), {
                    description: t('toast.workingHoursSavedDesc'),
                  });
                }}
                mockHolidays={mockHolidays}
                isDemoMode={true}
              />
            )}
          </div>
        </div>
      </PageContainer>

      <AddServiceModal
        show={showAddServiceModal}
        onClose={() => setShowAddServiceModal(false)}
        onSave={(service) => {
          handleAddService(service);
          setShowAddServiceModal(false);
        }}
      />

      <EditServiceModal
        show={showEditServiceModal}
        onClose={() => {
          setShowEditServiceModal(false);
          setEditingService(null);
        }}
        service={editingService}
        onSave={(service) => {
          handleEditService(service);
          setShowEditServiceModal(false);
          setEditingService(null);
        }}
      />

      <DeleteServiceModal
        show={showDeleteServiceModal}
        onClose={() => {
          setShowDeleteServiceModal(false);
          setEditingService(null);
        }}
        service={editingService}
        onConfirm={() => {
          handleDeleteService();
          setShowDeleteServiceModal(false);
          setEditingService(null);
        }}
      />

      <WalkInModal
        show={showWalkInModal}
        onClose={() => setShowWalkInModal(false)}
        services={services}
        artistId="demo-artist-id"
        onSave={(data) => {
          handleWalkIn(data);
          setShowWalkInModal(false);
        }}
      />

      <CancelBookingModal
        show={showCancelBookingModal}
        onClose={() => {
          setShowCancelBookingModal(false);
          setBookingToCancel(null);
        }}
        booking={bookingForModal}
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
        timeSlots={generateTimeSlots(rebookDate || bookingToRebook?.date || new Date()).map(
          (time) => ({ time, available: true })
        )}
        onDateChange={setRebookDate}
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
        timeSlots={generateTimeSlots(rescheduleDate || bookingToReschedule?.date || new Date()).map(
          (time) => ({ time, available: true })
        )}
        onDateChange={setRescheduleDate}
        onTimeChange={setRescheduleTime}
        onMessageChange={setRescheduleMessage}
        onConfirm={confirmProposeReschedule}
      />

      <AddPortfolioModal
        show={showAddPortfolioModal}
        onClose={() => setShowAddPortfolioModal(false)}
        onSave={(data) => {
          handleAddPortfolioImage(data);
          setShowAddPortfolioModal(false);
        }}
      />

      <CancelSubscriptionModal
        show={showCancelSubscriptionModal}
        onClose={() => setShowCancelSubscriptionModal(false)}
        subscription={null}
        onConfirm={() => {
          setShowCancelSubscriptionModal(false);
          toast.success(t('toast.subscriptionCancelled'), {
            description: t('toast.subscriptionCancelledDesc'),
          });
        }}
      />
    </div>
  );
}
