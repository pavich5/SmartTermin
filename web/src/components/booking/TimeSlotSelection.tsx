import React from 'react';
import { format, isSameDay } from 'date-fns';
import { useTranslation } from '../../hooks/useTranslation';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';

interface SlotInfo {
  time: Date;
  available: boolean;
  nextAvailableTime?: string | null;
  isBreak?: boolean;
}

interface TimeSlotSelectionProps {
  allSlots: SlotInfo[];
  selectedTime: Date | null;
  onTimeSelect: (slot: Date) => void;
  isHoliday?: boolean;
  holidayDescription?: string;
}

export function TimeSlotSelection({
  allSlots,
  selectedTime,
  onTimeSelect,
  isHoliday = false,
  holidayDescription,
}: TimeSlotSelectionProps) {
  const { t } = useTranslation();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">{t('booking.time.selectTime')}</CardTitle>
      </CardHeader>
      <CardContent>
        {allSlots.length > 0 ? (
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3 mb-6">
            {allSlots
              .filter((slot) => slot.time instanceof Date && !isNaN(slot.time.getTime()))
              .map((slot, idx) => {
                const isSelected =
                  selectedTime &&
                  isSameDay(selectedTime, slot.time) &&
                  selectedTime.getHours() === slot.time.getHours() &&
                  selectedTime.getMinutes() === slot.time.getMinutes();

                const isBreak = slot.isBreak ?? false;
                const isDisabled = !slot.available || isBreak;

                return (
                  <button
                    key={idx}
                    onClick={() => {
                      if (!isDisabled) {
                        onTimeSelect(slot.time);
                      }
                    }}
                    disabled={isDisabled}
                    title={
                      isBreak
                        ? 'Break time'
                        : isDisabled && slot.nextAvailableTime
                          ? `Next available: ${slot.nextAvailableTime}`
                          : undefined
                    }
                    className={`p-3 rounded-lg border-2 text-sm font-medium transition-all relative ${
                      isSelected
                        ? 'border-blue-500 bg-blue-500 text-white'
                        : isDisabled
                          ? 'border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed opacity-60'
                          : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50'
                    }`}
                  >
                    <span className="relative inline-flex items-center gap-1">
                      {format(slot.time, 'HH:mm')}
                      {isBreak && <span className="text-xs">☕</span>}
                    </span>
                  </button>
                );
              })}
          </div>
        ) : isHoliday ? (
          <div className="text-center py-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-orange-100 mb-4">
              <svg
                className="w-8 h-8 text-orange-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
            </div>
            <p className="text-lg font-semibold text-gray-900 mb-2">
              {t('booking.time.holiday')}
            </p>
            {holidayDescription && (
              <p className="text-sm text-gray-600 mb-2">{holidayDescription}</p>
            )}
            <p className="text-sm text-gray-500">
              {t('booking.time.holidayMessage')}
            </p>
          </div>
        ) : (
          <p className="text-center text-gray-500 py-8">{t('booking.time.noSlots')}</p>
        )}
      </CardContent>
    </Card>
  );
}
