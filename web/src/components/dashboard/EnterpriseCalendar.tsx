import React, { useState, useEffect } from 'react';
import { Calendar, ChevronLeft, ChevronRight, Users, Clock } from 'lucide-react';
import { useTranslation } from '../../hooks/useTranslation';
import { getSalonArtistsWorkingHours, ArtistWorkingHours } from '../../services/settingsService';
import { getSalonCalendar } from '../../services/salonService';
import { SalonCalendarBooking } from '../../types/salon';
import { useSalon } from '../../contexts/SalonContext';
import { Button } from '../ui/button';
import { LoadingState } from '../ui/LoadingState';
import { format, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay, addWeeks, subWeeks, parseISO, startOfDay } from 'date-fns';
import { getDateLocale } from '../../utils/dateLocale';
import { ImageWithFallback } from '../figma/ImageWithFallback';
import { toast } from 'sonner';
import { Modal } from './modals/Modal';
import { formatPriceInMKDInt } from '../../utils/priceFormat';
import { Skeleton } from '../ui/skeleton';

export function EnterpriseCalendar() {
  const { t, language } = useTranslation();
  const dateLocale = getDateLocale(language);
  const { salon } = useSalon();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [artists, setArtists] = useState<ArtistWorkingHours[]>([]);
  const [bookings, setBookings] = useState<SalonCalendarBooking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDayBookings, setSelectedDayBookings] = useState<{
    artistId: string;
    artistName: string;
    date: Date;
    bookings: SalonCalendarBooking[];
  } | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const getDateRange = () => {
    return { start: startOfWeek(currentDate, { weekStartsOn: 1 }), end: endOfWeek(currentDate, { weekStartsOn: 1 }) };
  };

  useEffect(() => {
    const loadData = async () => {
      if (!salon?.id) return;
      
      setIsLoading(true);
      try {
        const [workingHoursResponse, { start, end }] = await Promise.all([
          getSalonArtistsWorkingHours(),
          Promise.resolve(getDateRange())
        ]);
        
        setArtists(workingHoursResponse.artists || []);

        // Fetch bookings for the current week
        const startDateStr = format(start, 'yyyy-MM-dd');
        const endDateStr = format(end, 'yyyy-MM-dd');
        const calendarResponse = await getSalonCalendar(salon.id, startDateStr, endDateStr, 1, 1000);
        setBookings(calendarResponse.bookings || []);
      } catch (error) {
        console.error('Failed to load salon calendar data', error);
        toast.error(t('toast.genericError'), {
          description: t('toast.genericErrorDesc'),
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [salon?.id, currentDate]);

  const getDayName = (dayKey: string) => {
    const dayNames: Record<string, string> = {
      monday: t('settings.workingHours.monday'),
      tuesday: t('settings.workingHours.tuesday'),
      wednesday: t('settings.workingHours.wednesday'),
      thursday: t('settings.workingHours.thursday'),
      friday: t('settings.workingHours.friday'),
      saturday: t('settings.workingHours.saturday'),
      sunday: t('settings.workingHours.sunday'),
    };
    return dayNames[dayKey] || dayKey;
  };

  const getDayKeyFromDate = (date: Date): keyof typeof artists[0]['workingHours'] | null => {
    const dayOfWeek = date.getDay();
    const dayMap: Record<number, keyof typeof artists[0]['workingHours']> = {
      0: 'sunday',
      1: 'monday',
      2: 'tuesday',
      3: 'wednesday',
      4: 'thursday',
      5: 'friday',
      6: 'saturday',
    };
    return dayMap[dayOfWeek] || null;
  };

  const navigateDate = (direction: 'prev' | 'next') => {
    setCurrentDate(direction === 'next' ? addWeeks(currentDate, 1) : subWeeks(currentDate, 1));
  };

  // Get bookings for a specific artist and day
  const getBookingsForArtistAndDay = (artistId: string, date: Date) => {
    const dayStart = startOfDay(date);
    return bookings.filter((booking) => {
      if (booking.artistId !== artistId) return false;
      const bookingDate = parseISO(booking.date);
      return isSameDay(bookingDate, dayStart);
    });
  };

  // Get badge color based on booking status
  const getBadgeVariant = (status: string): 'default' | 'secondary' | 'destructive' | 'outline' => {
    switch (status.toLowerCase()) {
      case 'confirmed':
      case 'active':
        return 'default';
      case 'pending':
        return 'secondary';
      case 'cancelled':
      case 'rejected':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  // Get badge color class for custom styling
  const getBadgeColorClass = (status: string): string => {
    switch (status.toLowerCase()) {
      case 'confirmed':
      case 'active':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'cancelled':
      case 'rejected':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getDateHeader = () => {
    const { start, end } = getDateRange();
    if (isSameDay(start, end)) {
      return format(start, 'MMMM d, yyyy', { locale: dateLocale });
    }
    return `${format(start, 'MMM d', { locale: dateLocale })} - ${format(end, 'MMM d, yyyy', { locale: dateLocale })}`;
  };

  // Color palette for artists (15 colors)
  const artistColors = [
    { bg: 'bg-sky-50', border: 'border-sky-200' },      // Sky blue
    { bg: 'bg-purple-50', border: 'border-purple-200' }, // Purple
    { bg: 'bg-pink-50', border: 'border-pink-200' },     // Pink
    { bg: 'bg-emerald-50', border: 'border-emerald-200' }, // Emerald
    { bg: 'bg-amber-50', border: 'border-amber-200' },   // Amber
    { bg: 'bg-indigo-50', border: 'border-indigo-200' },  // Indigo
    { bg: 'bg-rose-50', border: 'border-rose-200' },      // Rose
    { bg: 'bg-teal-50', border: 'border-teal-200' },     // Teal
    { bg: 'bg-violet-50', border: 'border-violet-200' },  // Violet
    { bg: 'bg-cyan-50', border: 'border-cyan-200' },     // Cyan
    { bg: 'bg-lime-50', border: 'border-lime-200' },      // Lime
    { bg: 'bg-orange-50', border: 'border-orange-200' },  // Orange
    { bg: 'bg-fuchsia-50', border: 'border-fuchsia-200' }, // Fuchsia
    { bg: 'bg-blue-50', border: 'border-blue-200' },      // Blue
    { bg: 'bg-green-50', border: 'border-green-200' },    // Green
  ];

  // Get color for an artist based on their index
  const getArtistColor = (artistId: string) => {
    const artistIndex = artists.findIndex(a => a.artistId === artistId);
    if (artistIndex === -1) return artistColors[0];
    return artistColors[artistIndex % artistColors.length];
  };

  const renderWeekView = () => {
    const { start, end } = getDateRange();
    const weekDays = eachDayOfInterval({ start, end });

    return (
      <div className="space-y-4">
        {artists.map((artist) => {
          const artistColor = getArtistColor(artist.artistId);
          return (
            <div key={artist.artistId} className="bg-white rounded-xl border border-gray-200 p-4 md:p-6 shadow-sm">
            <div className="flex items-center gap-4 mb-4 pb-4 border-b border-gray-200">
              {artist.profileImageUrl ? (
                <ImageWithFallback
                  src={artist.profileImageUrl}
                  alt={artist.artistName}
                  className="w-12 h-12 rounded-full object-cover"
                  width={48}
                  height={48}
                />
              ) : (
                <div className="w-12 h-12 rounded-full bg-sky-500 flex items-center justify-center text-white font-semibold text-lg">
                  {artist.artistName.charAt(0).toUpperCase()}
                </div>
              )}
              <div>
                <h3 className="font-semibold text-gray-900 text-lg">{artist.artistName}</h3>
              </div>
            </div>
            {/* Desktop: 7 columns grid - hidden on mobile, grid on desktop */}
            <div style={{ display: isMobile ? 'none' : 'block' }}>
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(7, minmax(0, 1fr))', 
                gap: '0.75rem',
                width: '100%'
              }}>
                {weekDays.map((day) => {
                  const dayKey = getDayKeyFromDate(day);
                  if (!dayKey) return null;
                  
                  const dayHours = artist.workingHours[dayKey];
                  const dayBookings = getBookingsForArtistAndDay(artist.artistId, day);
                  
                  return (
                    <div key={day.toISOString()} className="flex flex-col min-h-[140px]">
                      <div className="text-xs font-medium text-gray-500 mb-2 text-center">
                        {getDayName(dayKey as string).slice(0, 3)}
                      </div>
                      {dayHours.closed ? (
                        <div className="flex-1 bg-gray-50 rounded-lg p-3 border border-gray-200 flex items-center justify-center min-h-[120px]">
                          <div className="text-center">
                            <div className="text-gray-400 text-xs font-medium mb-1">
                              {t('settings.workingHours.closed') || 'Closed'}
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className={`flex-1 ${artistColor.bg} rounded-lg p-3 ${artistColor.border} border flex flex-col min-h-[120px]`}>
                          <div className="text-center mb-2">
                            <div className="text-gray-700 font-medium text-xs">
                              {dayHours.start} - {dayHours.end}
                            </div>
                          </div>
                          {dayBookings.length > 0 ? (
                            <div className="flex-1 flex flex-col items-center justify-center mt-2">
                              <div className="text-gray-700 font-semibold text-xs mb-1">
                                {dayBookings.length} {dayBookings.length === 1 ? t('enterprise.calendar.booking') : t('enterprise.calendar.bookings')}
                              </div>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setSelectedDayBookings({
                                  artistId: artist.artistId,
                                  artistName: artist.artistName,
                                  date: day,
                                  bookings: dayBookings
                                })}
                                className="text-xs px-2 py-1 h-auto text-sky-600 border-sky-300 hover:bg-sky-100"
                              >
                                See bookings
                              </Button>
                            </div>
                          ) : (
                            <div className="flex-1 flex items-center justify-center">
                              <div className="text-gray-400 text-[9px] text-center" style={{ fontSize: '12px' }}>{t('enterprise.calendar.noBookings')}</div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
            {/* Mobile: Column layout - visible on mobile, hidden on desktop */}
            <div style={{ display: isMobile ? 'block' : 'none' }} className="space-y-3">
              {weekDays.map((day) => {
                const dayKey = getDayKeyFromDate(day);
                if (!dayKey) return null;
                
                const dayHours = artist.workingHours[dayKey];
                const dayBookings = getBookingsForArtistAndDay(artist.artistId, day);
                
                return (
                  <div key={day.toISOString()} className="border border-gray-200 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-3">
                      <div className="text-sm font-semibold text-gray-900">
                        {getDayName(dayKey as string)}
                      </div>
                      <div className="text-xs text-gray-500">
                        {format(day, 'MMM d', { locale: dateLocale })}
                      </div>
                    </div>
                    {dayHours.closed ? (
                      <div className="bg-gray-50 rounded-lg p-3 border border-gray-200 text-center min-h-[80px] flex items-center justify-center">
                        <div className="text-gray-400 text-sm font-medium">
                          {t('settings.workingHours.closed') || 'Closed'}
                        </div>
                      </div>
                    ) : (
                      <div className={`${artistColor.bg} rounded-lg p-3 ${artistColor.border} border min-h-[80px]`}>
                        <div className="flex items-center justify-between mb-3">
                          <div className="text-sm text-gray-700">
                            <span className="font-medium">{dayHours.start}</span>
                            <span className="text-gray-500 mx-1">-</span>
                            <span className="text-gray-500">{dayHours.end}</span>
                          </div>
                        </div>
                        {dayBookings.length > 0 ? (
                          <div className="flex items-center justify-between">
                            <div className="text-sm text-gray-700 font-medium">
                              {dayBookings.length} {dayBookings.length === 1 ? t('enterprise.calendar.booking') : t('enterprise.calendar.bookings')}
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setSelectedDayBookings({
                                artistId: artist.artistId,
                                artistName: artist.artistName,
                                date: day,
                                bookings: dayBookings
                              })}
                              className="text-xs px-3 py-1.5 h-auto text-sky-600 border-sky-300 hover:bg-sky-100"
                            >
                              See bookings
                            </Button>
                          </div>
                        ) : (
                          <div className="text-center text-gray-400" style={{ fontSize: '11px' }}>
                            {t('enterprise.calendar.noBookings')}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            </div>
          );
        })}
      </div>
    );
  };

  const renderSkeleton = () => {
    const { start, end } = getDateRange();
    const weekDays = eachDayOfInterval({ start, end });

    return (
      <div className="space-y-4">
        {[1, 2].map((i) => (
          <div key={i} className="bg-white rounded-xl border border-gray-200 p-4 md:p-6 shadow-sm">
            <div className="flex items-center gap-4 mb-4 pb-4 border-b border-gray-200">
              <div className="w-12 h-12 rounded-full bg-gray-200 animate-pulse" />
              <div className="h-6 w-32 bg-gray-200 animate-pulse rounded" />
            </div>
            {/* Desktop skeleton */}
            <div style={{ display: isMobile ? 'none' : 'block' }}>
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(7, minmax(0, 1fr))', 
                gap: '0.75rem',
                width: '100%'
              }}>
                {weekDays.map((day) => (
                  <div key={day.toISOString()} className="flex flex-col min-h-[140px]">
                    <div className="h-4 w-8 mx-auto mb-2 bg-gray-200 animate-pulse rounded" />
                    <div className="flex-1 rounded-lg bg-gray-200 animate-pulse min-h-[120px]" />
                  </div>
                ))}
              </div>
            </div>
            {/* Mobile skeleton */}
            <div style={{ display: isMobile ? 'block' : 'none' }} className="space-y-3">
              {weekDays.map((day) => (
                <div key={day.toISOString()} className="border border-gray-200 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-3">
                    <div className="h-4 w-20 bg-gray-200 animate-pulse rounded" />
                    <div className="h-3 w-12 bg-gray-200 animate-pulse rounded" />
                  </div>
                  <div className="h-20 rounded-lg bg-gray-200 animate-pulse min-h-[80px]" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  };

  if (artists.length === 0 && !isLoading) {
    return (
      <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
        <Users className="mx-auto text-gray-400 mb-4" size={48} />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          {t('enterprise.calendar.noArtists') || 'No Artists Found'}
        </h3>
        <p className="text-gray-600">
          {t('enterprise.calendar.noArtistsDesc') || 'Add artists to your salon to view their working schedules.'}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <Calendar className="text-sky-500" size={24} />
            <h2 className="text-xl font-semibold text-gray-900">
              {t('enterprise.calendar.title') || 'Artists Working Hours'}
            </h2>
          </div>
        </div>

        <div className="flex items-center justify-between mb-6">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigateDate('prev')}
            className="rounded-full"
          >
            <ChevronLeft size={16} />
          </Button>
          <h3 className="text-lg font-semibold text-gray-900">{getDateHeader()}</h3>
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigateDate('next')}
            className="rounded-full"
          >
            <ChevronRight size={16} />
          </Button>
        </div>

        <div className="mt-6">
          {isLoading ? renderSkeleton() : renderWeekView()}
        </div>
      </div>

      {/* Bookings Modal */}
      {selectedDayBookings && (
        <Modal
          show={!!selectedDayBookings}
          onClose={() => setSelectedDayBookings(null)}
          title={`${format(selectedDayBookings.date, 'EEEE, MMMM d, yyyy', { locale: dateLocale })} - ${selectedDayBookings.artistName}`}
        >
          <div className="space-y-2 md:space-y-3">
            {selectedDayBookings.bookings.length === 0 ? (
              <div className="text-center py-6 md:py-8 text-gray-500">
                <p className="text-sm">{t('enterprise.calendar.noBookingsForDay')}</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-[50vh] md:max-h-[60vh] overflow-y-auto -mx-1 px-1">
                {selectedDayBookings.bookings
                  .sort((a, b) => a.time.localeCompare(b.time))
                  .map((booking) => {
                    const status = booking.status.charAt(0).toUpperCase() + booking.status.slice(1).toLowerCase();
                    return (
                      <div
                        key={booking.id}
                        className={`p-2 md:p-3 rounded-lg border ${getBadgeColorClass(booking.status)}`}
                      >
                        <div className="flex items-center justify-between mb-1.5 md:mb-2">
                          <div className="flex items-center gap-1.5">
                            <Clock size={10} className="text-gray-600 flex-shrink-0" />
                            <span className="font-semibold text-gray-900" style={{ fontSize: '12px' }}>{booking.time}</span>
                          </div>
                          <span className={`px-1.5 md:px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${
                            booking.status.toLowerCase() === 'confirmed' || booking.status.toLowerCase() === 'active'
                              ? 'bg-green-200 text-green-800'
                              : booking.status.toLowerCase() === 'pending'
                              ? 'bg-yellow-200 text-yellow-800'
                              : booking.status.toLowerCase() === 'cancelled' || booking.status.toLowerCase() === 'rejected'
                              ? 'bg-red-200 text-red-800'
                              : 'bg-gray-200 text-gray-800'
                          }`} style={{ fontSize: '11px' }}>
                            {status}
                          </span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-1 md:gap-2 text-gray-700" style={{ fontSize: '12px' }}>
                          <div className="truncate">
                            <span className="font-medium">Client:</span> <span className="truncate">{booking.clientName}</span>
                          </div>
                          <div className="truncate">
                            <span className="font-medium">Service:</span> <span className="truncate">{booking.service}</span>
                          </div>
                          {booking.duration && (
                            <div>
                              <span className="font-medium">Duration:</span> {booking.duration} min
                            </div>
                          )}
                          {booking.price && (
                            <div>
                              <span className="font-medium">Price:</span> {formatPriceInMKDInt(booking.price)}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
}
