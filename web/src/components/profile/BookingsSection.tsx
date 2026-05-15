import React from 'react';
import { Calendar, Scissors, Clock, XCircle, AlertCircle, Check, X } from 'lucide-react';
import { useTranslation } from '../../hooks/useTranslation';
import { Button } from '../ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '../ui/tooltip';
import { format, isToday } from 'date-fns';
import { getDateLocale } from '../../utils/dateLocale';

interface Booking {
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
}

interface BookingsSectionProps {
  upcomingBookings: Booking[];
  pastBookings: Booking[];
  canCancelBooking: (booking: Booking) => {
    allowed: boolean;
    message?: string;
    hoursUntilDeadline?: number;
    hoursUntilAppointment?: number;
  };
  onCancelBooking: (bookingId: string) => void;
  onAcceptReschedule?: (bookingId: string) => void;
  onDeclineReschedule?: (bookingId: string) => void;
  onViewArtist: (artistId: string) => void;
  onBrowseArtists: () => void;
  acceptingRescheduleId?: string | null;
  decliningRescheduleId?: string | null;
}

export const BookingsSection: React.FC<BookingsSectionProps> = ({
  upcomingBookings,
  pastBookings,
  canCancelBooking,
  onCancelBooking,
  onAcceptReschedule,
  onDeclineReschedule,
  onViewArtist,
  onBrowseArtists,
  acceptingRescheduleId = null,
  decliningRescheduleId = null,
}) => {
  const { t, language } = useTranslation();
  const dateLocale = getDateLocale(language);
  const statusColors = {
    confirmed: 'bg-blue-100 text-sky-600 border-blue-200',
    pending: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    pending_reschedule: 'bg-orange-100 text-orange-700 border-orange-200',
    completed: 'bg-green-100 text-green-700 border-green-200',
    cancelled: 'bg-gray-100 text-gray-700 border-gray-200',
  };
  const statusLabels: Record<string, string> = {
    confirmed: t('dashboard.bookings.status.confirmed'),
    pending: t('dashboard.bookings.status.pending') || 'Pending',
    completed: t('dashboard.bookings.status.completed'),
    cancelled: t('dashboard.bookings.status.cancelled'),
    pending_reschedule: t('dashboard.bookings.status.pendingReschedule'),
    pendingReschedule: t('dashboard.bookings.status.pendingReschedule'),
  };

  return (
    <div className="mt-12 bg-white rounded-3xl shadow-xl overflow-hidden">
      <div className="bg-sky-500 p-6">
        <div className="flex items-center gap-3">
          <Calendar className="text-white" size={24} />
          <h2 className="text-2xl font-bold text-white">{t('profile.myBookings')}</h2>
        </div>
      </div>

      <div className="p-8">
        {upcomingBookings.length > 0 && (
          <div className="mb-8">
            <h3 className="text-xl font-semibold mb-4 text-gray-800">
              {t('profile.upcomingAppointments')}
            </h3>
            <div className="space-y-4">
              {upcomingBookings.map((booking) => (
                <div
                  key={booking.id}
                  className="p-6 border-2 border-gray-100 rounded-xl hover:border-blue-200 transition-all"
                >
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h4 className="text-lg font-semibold">{booking.artistName}</h4>
                        <span
                          className={`px-3 py-1 rounded-full text-xs border ${
                            statusColors[booking.status as keyof typeof statusColors]
                          }`}
                        >
                          {statusLabels[booking.status] || booking.status}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 mb-2">
                        <div className="flex items-center gap-2">
                          <Scissors size={16} />
                          <span>{booking.service}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar size={16} />
                          <span>
                            {isToday(booking.date)
                              ? t('profile.today')
                              : format(booking.date, 'MMM d, yyyy', { locale: dateLocale })}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock size={16} />
                          <span>{booking.time}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span>{booking.duration}</span>
                        </div>
                        {booking.status === 'confirmed' &&
                          (() => {
                            const cancellationCheck = canCancelBooking(booking);
                            if (
                              !cancellationCheck.allowed &&
                              cancellationCheck.hoursUntilAppointment !== undefined
                            ) {
                              return (
                                <div className="flex items-center gap-1 text-orange-600">
                                  <AlertCircle size={14} />
                                  <span className="text-xs">{t('profile.cantCancel')}</span>
                                </div>
                              );
                            } else if (
                              cancellationCheck.allowed &&
                              cancellationCheck.hoursUntilDeadline !== undefined
                            ) {
                              const hoursLeft = cancellationCheck.hoursUntilDeadline;
                              if (hoursLeft <= 2) {
                                return (
                                  <div className="flex items-center gap-1 text-orange-600">
                                    <AlertCircle size={14} />
                                    <span className="text-xs">
                                      {hoursLeft}h {t('profile.leftToCancel')}
                                    </span>
                                  </div>
                                );
                              } else if (hoursLeft <= 12) {
                                return (
                                  <div className="flex items-center gap-1 text-yellow-600">
                                    <Clock size={14} />
                                    <span className="text-xs">
                                      {hoursLeft}h {t('profile.leftToCancel')}
                                    </span>
                                  </div>
                                );
                              }
                            }
                            return null;
                          })()}
                      </div>
                      <div className="text-blue-600 font-semibold">{booking.price}</div>
                    </div>
                    <div className="flex gap-2">
                      {booking.status === 'pending_reschedule' && onAcceptReschedule && onDeclineReschedule ? (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={acceptingRescheduleId === booking.id || decliningRescheduleId === booking.id}
                            className="rounded-full text-green-600 border-green-200 hover:bg-green-50 disabled:opacity-50"
                            onClick={() => onAcceptReschedule?.(booking.id)}
                          >
                            <Check size={16} className="mr-1" />
                            {acceptingRescheduleId === booking.id ? (t('profile.accepting') || 'Accepting...') : (t('profile.acceptReschedule') || 'Accept')}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={acceptingRescheduleId === booking.id || decliningRescheduleId === booking.id}
                            className="rounded-full text-red-600 border-red-200 hover:bg-red-50 disabled:opacity-50"
                            onClick={() => onDeclineReschedule?.(booking.id)}
                          >
                            <X size={16} className="mr-1" />
                            {decliningRescheduleId === booking.id ? (t('profile.declining') || 'Declining...') : (t('profile.declineReschedule') || 'Decline')}
                          </Button>
                        </>
                      ) : (
                        <>
                      {(() => {
                        const cancellationCheck = canCancelBooking(booking);
                        const maxCancellationHours = booking.maximumCancellationHours ?? 24;
                        const tooltipMessage = !cancellationCheck.allowed
                          ? cancellationCheck.message ||
                            t('profile.cancellationDeadlinePassed', {
                              hours: maxCancellationHours,
                              hoursUntil: cancellationCheck.hoursUntilAppointment || 0,
                            }) ||
                            `Cannot cancel. The cancellation deadline (${maxCancellationHours} hours before appointment) has passed.`
                          : undefined;

                        const button = (
                          <Button
                            variant="outline"
                            size="sm"
                            className={`rounded-full ${
                              cancellationCheck.allowed
                                ? 'text-red-600 border-red-200 hover:bg-red-50'
                                : 'text-gray-400 border-gray-200 cursor-not-allowed opacity-60'
                            }`}
                            onClick={() => {
                              if (cancellationCheck.allowed) {
                                onCancelBooking(booking.id);
                              }
                            }}
                            disabled={!cancellationCheck.allowed}
                          >
                            <XCircle size={16} className="mr-1" />
                            {t('profile.cancelBooking')}
                          </Button>
                        );

                        if (!cancellationCheck.allowed && tooltipMessage) {
                          return (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <span className="inline-block">{button}</span>
                              </TooltipTrigger>
                              <TooltipContent
                                side="top"
                                sideOffset={5}
                                className="max-w-xs !bg-gray-900 !text-white text-xs p-3 z-[100] shadow-xl border-0 [&>svg]:!bg-gray-900"
                              >
                                {tooltipMessage}
                              </TooltipContent>
                            </Tooltip>
                          );
                        }

                        return button;
                      })()}
                      <Button
                        variant="outline"
                        size="sm"
                        className="hidden md:inline-flex rounded-full"
                        onClick={() => onViewArtist(booking.artistId)}
                      >
                        {t('profile.viewArtist')}
                      </Button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {pastBookings.length > 0 && (
          <div>
            <h3 className="text-xl font-semibold mb-4 text-gray-800">
              {t('profile.pastAppointments')}
            </h3>
            <div className="space-y-4">
              {pastBookings.map((booking) => (
                <div
                  key={booking.id}
                  className="p-6 border-2 border-gray-100 rounded-xl opacity-75"
                >
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h4 className="text-lg font-semibold">{booking.artistName}</h4>
                        <span
                          className={`px-3 py-1 rounded-full text-xs border ${
                            statusColors[booking.status as keyof typeof statusColors]
                          }`}
                        >
                          {statusLabels[booking.status] || booking.status}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 mb-2">
                        <div className="flex items-center gap-2">
                          <Scissors size={16} />
                          <span>{booking.service}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar size={16} />
                          <span>{format(booking.date, 'MMM d, yyyy', { locale: dateLocale })}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock size={16} />
                          <span>{booking.time}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span>{booking.duration}</span>
                        </div>
                      </div>
                      <div className="text-blue-600 font-semibold">{booking.price}</div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="hidden md:inline-flex rounded-full"
                        onClick={() => onViewArtist(booking.artistId)}
                      >
                        {t('profile.viewArtist')}
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {upcomingBookings.length === 0 && pastBookings.length === 0 && (
          <div className="text-center py-12">
            <Calendar size={48} className="mx-auto mb-4 text-gray-300" />
            <p className="text-gray-600 mb-2">{t('profile.noBookings')}</p>
            <p className="text-sm text-gray-500 mb-6">{t('profile.noBookingsDesc')}</p>
            <Button
              onClick={onBrowseArtists}
              className="bg-sky-500 hover:bg-sky-600 text-white rounded-full px-6"
            >
              {t('profile.browseArtists')}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};
