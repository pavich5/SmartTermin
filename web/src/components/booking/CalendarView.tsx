import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import {
  format,
  isSameDay,
  isBefore,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addMonths,
  subMonths,
  eachDayOfInterval,
} from 'date-fns';
import { useTranslation } from '../../hooks/useTranslation';
import { getDateLocale } from '../../utils/dateLocale';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';

interface CalendarViewProps {
  currentMonth: Date;
  selectedDate: Date | undefined;
  workingDays: number[];
  onMonthChange: (month: Date) => void;
  onDateSelect: (date: Date) => void;
}

export function CalendarView({
  currentMonth,
  selectedDate,
  workingDays,
  onMonthChange,
  onDateSelect,
}: CalendarViewProps) {
  const disabledDates = (date: Date) => {
    const dayOfWeek = date.getDay();
    const dayNumber = dayOfWeek === 0 ? 7 : dayOfWeek;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return !workingDays.includes(dayNumber) || isBefore(date, today);
  };

  const getCalendarDays = () => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
    const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });

    return eachDayOfInterval({ start: calendarStart, end: calendarEnd });
  };

  const calendarDays = getCalendarDays();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const { t, language } = useTranslation();
  const dateLocale = getDateLocale(language);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">{t('booking.calendar.selectDate')}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              className="rounded-full"
              onClick={() => onMonthChange(subMonths(currentMonth, 1))}
            >
              <ChevronLeft size={20} />
            </Button>
            <span className="font-semibold">
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
        <div className="grid grid-cols-7 gap-2">
          {['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'].map((day) => (
            <div key={day} className="text-center text-gray-600 text-sm p-2">
              {t(`calendar.weekdays.short.${day}` as const)}
            </div>
          ))}
          {calendarDays.map((date, idx) => {
            const day = date.getDate();
            const isCurrentMonth = date.getMonth() === currentMonth.getMonth();
            const isToday = isSameDay(date, today);
            const isSelected = selectedDate && isSameDay(date, selectedDate);
            const isDisabled = disabledDates(date);
            const dayOfWeek = date.getDay();
            const dayNumber = dayOfWeek === 0 ? 7 : dayOfWeek;
            const hasAvailableSlots = workingDays.includes(dayNumber) && !isDisabled;

            return (
              <button
                key={idx}
                onClick={() => {
                  if (!isDisabled && isCurrentMonth) {
                    onDateSelect(date);
                  }
                }}
                disabled={isDisabled || !isCurrentMonth}
                className={`aspect-square p-2 rounded-xl text-center relative transition-all ${
                  !isCurrentMonth
                    ? 'text-gray-300 cursor-not-allowed'
                    : isSelected
                      ? 'bg-sky-500 text-white shadow-md'
                      : isToday
                        ? 'bg-blue-100 text-blue-600 font-semibold hover:bg-blue-200'
                        : isDisabled
                          ? 'text-gray-300 cursor-not-allowed'
                          : hasAvailableSlots
                            ? 'bg-blue-50 text-blue-600 hover:bg-blue-100 cursor-pointer'
                            : 'hover:bg-gray-50 cursor-pointer'
                }`}
              >
                <div className="text-sm">{day}</div>
                {hasAvailableSlots && !isSelected && (
                  <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-blue-500 rounded-full" />
                )}
              </button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
