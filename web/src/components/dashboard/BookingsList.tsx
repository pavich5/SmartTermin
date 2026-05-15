import React from 'react';
import {
  Plus,
  XCircle,
  RotateCcw,
  MessageSquare,
  Clock,
  AlertCircle,
  Calendar,
} from 'lucide-react';
import { useTranslation } from '../../hooks/useTranslation';
import { Button } from '../ui/button';
import { format } from 'date-fns';
import { DateRange } from 'react-day-picker';
import { DateRangePicker } from './DateRangePicker';

interface Booking {
  id: string;
  client: string;
  service: string;
  time: string;
  status: string;
  duration: string;
  price: string;
  date: Date;
}

interface BookingsListProps {
  bookings: Booking[];
  selectedBooking: string | null;
  dateHeader: string;
  dateRange?: DateRange | undefined;
  onDateRangeChange?: (range: DateRange | undefined) => void;
  canCancelBooking: (booking: Booking) => {
    allowed: boolean;
    message?: string;
    hoursUntilDeadline?: number;
    hoursUntilAppointment?: number;
  };
  onBookingSelect: (id: string) => void;
  onCancelBooking: (id: string) => void;
  onRebookBooking: (booking: Booking) => void;
  onProposeReschedule: (booking: Booking) => void;
  onAddWalkIn: () => void;
}

export function BookingsList({
  bookings,
  selectedBooking,
  dateHeader,
  dateRange,
  onDateRangeChange,
  canCancelBooking,
  onBookingSelect,
  onCancelBooking,
  onProposeReschedule,
  onRebookBooking,
  onAddWalkIn,
}: BookingsListProps) {
  const { t } = useTranslation();
  const statusColors = {
    confirmed: 'bg-blue-100 text-sky-600 border-blue-200',
    pending_reschedule: 'bg-blue-100 text-sky-600 border-blue-200',
    completed: 'bg-blue-100 text-sky-600 border-blue-200',
    cancelled: 'bg-gray-100 text-gray-700 border-gray-200',
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6 w-full overflow-hidden">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <h2 className="text-xl sm:text-2xl break-words min-w-0 flex-1">{dateHeader}</h2>
        <div className="flex flex-row sm:flex-col items-center gap-2 sm:gap-3 flex-shrink-0 flex-wrap">
          {onDateRangeChange && (
            <DateRangePicker dateRange={dateRange} onDateRangeChange={onDateRangeChange} />
          )}
          <Button
            onClick={onAddWalkIn}
            className="bg-sky-500 hover:bg-sky-600 text-white rounded-full"
          >
            <Plus size={20} className="mr-2" />
            {t('dashboard.bookings.addWalkIn')}
          </Button>
        </div>
      </div>
      <div className="space-y-4 w-full">
        {bookings.length > 0 ? (
          bookings.map((booking) => (
            <div
              key={booking.id}
              className={`p-4 rounded-xl border-2 transition-all w-full overflow-hidden ${
                booking.status === 'cancelled'
                  ? 'opacity-60 border-gray-200 bg-gray-50'
                  : booking.status === 'pending_reschedule'
                    ? selectedBooking === booking.id
                      ? 'border-blue-500 bg-blue-50 cursor-pointer'
                      : 'border-blue-200 bg-blue-50/30 hover:border-blue-300 cursor-pointer'
                    : selectedBooking === booking.id
                      ? 'border-blue-500 bg-blue-50 cursor-pointer'
                      : 'border-gray-100 hover:border-blue-200 cursor-pointer'
              }`}
              onClick={() => booking.status !== 'cancelled' && onBookingSelect(booking.id)}
            >
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="flex-1 min-w-0 w-full">
                  <div className="flex items-center gap-2 sm:gap-3 mb-2 flex-wrap">
                    <h3
                      className={`text-base sm:text-lg ${booking.status === 'cancelled' ? 'line-through text-gray-400' : ''}`}
                    >
                      {booking.client}
                    </h3>
                    <span
                      className={`px-2 sm:px-3 py-1 rounded-full text-xs border whitespace-nowrap flex-shrink-0 ${
                        statusColors[booking.status as keyof typeof statusColors]
                      }`}
                    >
                      {booking.status === 'confirmed'
                        ? t('dashboard.bookings.status.confirmed')
                        : booking.status === 'pending_reschedule'
                          ? t('dashboard.bookings.status.pendingReschedule')
                          : booking.status === 'completed'
                            ? t('dashboard.bookings.status.completed')
                            : booking.status === 'cancelled'
                              ? t('dashboard.bookings.status.cancelled')
                              : booking.status}
                    </span>
                  </div>
                  <div
                    className={`text-sm mb-2 ${booking.status === 'cancelled' ? 'text-gray-400' : 'text-gray-600'}`}
                  >
                    {booking.service}
                  </div>
                  <div className="flex items-center gap-2 sm:gap-4 text-xs sm:text-sm text-gray-500 flex-wrap">
                    <span className="flex items-center gap-1 whitespace-nowrap">
                      <Clock size={14} />
                      {booking.time}
                    </span>
                    <span className="whitespace-nowrap">{booking.duration}</span>
                    <span className="text-blue-600 font-semibold whitespace-nowrap">
                      {booking.price}
                    </span>
                    {booking.status === 'confirmed' &&
                      (() => {
                        const cancellationCheck = canCancelBooking(booking);
                        if (
                          !cancellationCheck.allowed &&
                          cancellationCheck.hoursUntilAppointment !== undefined
                        ) {
                          return (
                            <span className="flex items-center gap-1 text-orange-600 whitespace-nowrap">
                              <AlertCircle size={12} />
                              <span>{t('dashboard.bookings.cantCancel')}</span>
                            </span>
                          );
                        } else if (
                          cancellationCheck.allowed &&
                          cancellationCheck.hoursUntilDeadline !== undefined
                        ) {
                          const hoursLeft = cancellationCheck.hoursUntilDeadline;
                          if (hoursLeft <= 2) {
                            return (
                              <span className="flex items-center gap-1 text-orange-600 whitespace-nowrap">
                                <AlertCircle size={12} />
                                <span>
                                  {hoursLeft}h {t('dashboard.bookings.leftToCancel')}
                                </span>
                              </span>
                            );
                          } else if (hoursLeft <= 12) {
                            return (
                              <span className="flex items-center gap-1 text-yellow-600 whitespace-nowrap">
                                <Clock size={12} />
                                <span>
                                  {hoursLeft}h {t('dashboard.bookings.leftToCancel')}
                                </span>
                              </span>
                            );
                          }
                        }
                        return null;
                      })()}
                  </div>
                </div>
                <div className="flex gap-2 flex-shrink-0 w-full sm:w-auto">
                  {(booking.status === 'cancelled' || booking.status === 'completed') && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        onRebookBooking(booking);
                      }}
                      className="text-blue-600 border-blue-200 hover:bg-blue-50 hover:border-blue-300 rounded-full flex-1 sm:flex-initial"
                    >
                      <RotateCcw size={16} className="mr-1 sm:mr-2" />
                      <span className="hidden sm:inline">{t('dashboard.bookings.rebook')}</span>
                      <span className="sm:hidden">{t('dashboard.bookings.rebook')}</span>
                    </Button>
                  )}
                  {booking.status === 'pending_reschedule' && (
                    <div className="text-xs sm:text-sm text-blue-600 flex items-center gap-1 px-2">
                      <Clock size={14} />
                      <span className="whitespace-nowrap">
                        {t('dashboard.bookings.awaitingResponse')}
                      </span>
                    </div>
                  )}
                  {booking.status === 'confirmed' && (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          onProposeReschedule(booking);
                        }}
                        className="text-blue-600 border-blue-200 hover:bg-blue-50 hover:border-blue-300 rounded-full flex-1 sm:flex-initial"
                      >
                        <MessageSquare size={16} className="mr-1 sm:mr-2" />
                        <span className="hidden sm:inline">
                          {t('dashboard.bookings.proposeReschedule')}
                        </span>
                        <span className="sm:hidden">{t('dashboard.bookings.reschedule')}</span>
                      </Button>
                      {(() => {
                        const cancellationCheck = canCancelBooking(booking);
                        return (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (cancellationCheck.allowed) {
                                onCancelBooking(booking.id);
                              }
                            }}
                            className={`rounded-full flex-1 sm:flex-initial ${
                              cancellationCheck.allowed
                                ? 'text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300'
                                : 'text-gray-400 border-gray-200 cursor-not-allowed opacity-60'
                            }`}
                            disabled={!cancellationCheck.allowed}
                            title={
                              !cancellationCheck.allowed ? cancellationCheck.message : undefined
                            }
                          >
                            <XCircle size={16} className="mr-1 sm:mr-2" />
                            <span className="hidden sm:inline">
                              {t('dashboard.bookings.cancel')}
                            </span>
                            <span className="sm:hidden">{t('dashboard.bookings.cancel')}</span>
                          </Button>
                        );
                      })()}
                    </>
                  )}
                  {booking.status !== 'cancelled' &&
                    booking.status !== 'completed' &&
                    booking.status !== 'confirmed' &&
                    booking.status !== 'pending_reschedule' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          onCancelBooking(booking.id);
                        }}
                        className="text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300 rounded-full flex-1 sm:flex-initial"
                      >
                        <XCircle size={16} className="mr-1 sm:mr-2" />
                        <span className="hidden sm:inline">
                          {t('dashboard.bookings.cancelBooking')}
                        </span>
                        <span className="sm:hidden">{t('dashboard.bookings.cancel')}</span>
                      </Button>
                    )}
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
            <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mb-4">
              <Calendar size={40} />
            </div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">
              {t('dashboard.bookings.emptyTitle')}
            </h3>
            <p className="text-sm text-gray-600 max-w-md mb-4">
              {t('dashboard.bookings.emptyDescription')}
            </p>
            <Button
              onClick={onAddWalkIn}
              className="bg-sky-500 hover:bg-sky-600 text-white rounded-full"
            >
              <Plus size={18} className="mr-2" />
              {t('dashboard.bookings.addWalkIn')}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
