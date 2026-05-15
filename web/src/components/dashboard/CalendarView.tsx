import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '../ui/button';
import {
  format,
  isSameDay,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  addMonths,
  subMonths,
} from 'date-fns';
import { useTranslation } from '../../hooks/useTranslation';
import { getDateLocale } from '../../utils/dateLocale';

interface CalendarViewProps {
  currentMonth: Date;
  selectedDate: Date | null;
  today: Date;
  hasBookings: (date: Date) => boolean;
  onMonthChange: (month: Date) => void;
  onDateSelect: (date: Date) => void;
}

export function CalendarView({
  currentMonth,
  selectedDate,
  today,
  hasBookings,
  onMonthChange,
  onDateSelect,
}: CalendarViewProps) {
  const { t, language } = useTranslation();
  const dateLocale = getDateLocale(language);

  const getCalendarDays = () => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
    const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });

    return eachDayOfInterval({ start: calendarStart, end: calendarEnd });
  };

  const calendarDays = getCalendarDays();

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6 w-full overflow-hidden">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-2">
        <h2 className="text-2xl">{t('dashboard.calendar.title')}</h2>
        <div className="flex items-center gap-2 sm:gap-4 flex-shrink-0">
          <Button
            variant="outline"
            className="rounded-full"
            onClick={() => onMonthChange(subMonths(currentMonth, 1))}
          >
            <ChevronLeft size={20} />
          </Button>
          <span className="text-sm sm:text-base whitespace-nowrap">
            {format(currentMonth, 'MMMM yyyy', { locale: dateLocale })}
          </span>
          <Button
            variant="outline"
            className="rounded-full"
            onClick={() => onMonthChange(addMonths(currentMonth, 1))}
          >
            <ChevronRight size={20} />
          </Button>
        </div>
      </div>
      <div className="grid grid-cols-7 gap-1 sm:gap-2 w-full">
        {['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'].map((day) => (
          <div
            key={day}
            className="text-center text-gray-600 text-xs sm:text-sm p-1 sm:p-2 truncate"
          >
            {t(`calendar.weekdays.short.${day}` as const)}
          </div>
        ))}
        {calendarDays.map((date, idx) => {
          const day = date.getDate();
          const isCurrentMonth = date.getMonth() === currentMonth.getMonth();
          const isTodayDate = isSameDay(date, today);
          const isSelected = selectedDate && isSameDay(date, selectedDate);
          const hasBooking = hasBookings(date);

          return (
            <button
              key={idx}
              onClick={() => {
                if (isCurrentMonth) {
                  onDateSelect(date);
                }
              }}
              className={`aspect-square p-1 sm:p-2 rounded-xl text-center relative transition-all min-w-0 w-full ${
                !isCurrentMonth
                  ? 'text-gray-300 cursor-not-allowed'
                  : isSelected
                    ? 'bg-sky-500 text-white shadow-md'
                    : isTodayDate
                      ? 'bg-blue-100 text-blue-600 font-semibold hover:bg-blue-200'
                      : hasBooking
                        ? 'bg-blue-50 text-blue-600 hover:bg-blue-100 cursor-pointer'
                        : 'hover:bg-gray-50 cursor-pointer'
              }`}
              disabled={!isCurrentMonth}
            >
              {isCurrentMonth && (
                <>
                  <div className="text-xs sm:text-sm truncate">{day}</div>
                  {hasBooking && !isSelected && (
                    <div className="absolute bottom-0.5 sm:bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-blue-500 rounded-full" />
                  )}
                </>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
