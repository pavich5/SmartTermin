import React from 'react';
import { CalendarClock, Clock } from 'lucide-react';
import { useTranslation } from '../../../hooks/useTranslation';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { Label } from '../../ui/label';
import { Textarea } from '../../ui/textarea';
import { Modal } from './Modal';
import { format } from 'date-fns';
import { getDateLocale } from '../../../utils/dateLocale';

interface Booking {
  client: string;
  service: string;
  date: Date;
  time: string;
}

interface ProposeRescheduleModalProps {
  show: boolean;
  onClose: () => void;
  booking: Booking | null;
  rescheduleDate: Date | null;
  rescheduleTime: string;
  rescheduleMessage: string;
  timeSlots: Array<{
    time: string;
    available: boolean;
    nextAvailableTime?: string | null;
    isBreak?: boolean;
  }>;
  onDateChange: (date: Date | null) => void;
  onTimeChange: (time: string) => void;
  onMessageChange: (message: string) => void;
  onConfirm: () => void;
  isLoading?: boolean;
}

export function ProposeRescheduleModal({
  show,
  onClose,
  booking,
  rescheduleDate,
  rescheduleTime,
  rescheduleMessage,
  timeSlots,
  onDateChange,
  onTimeChange,
  onMessageChange,
  onConfirm,
  isLoading = false,
}: ProposeRescheduleModalProps) {
  const { t, language } = useTranslation();
  const dateLocale = getDateLocale(language);

  return (
    <Modal show={show} onClose={onClose} title={t('modals.proposeReschedule.title')}>
      <div className="space-y-4">
        <p className="text-gray-600">{t('modals.proposeReschedule.description')}</p>

        {booking && (
          <div className="p-4 bg-blue-50 rounded-xl">
            <div className="mb-3">
              <div className="text-xs text-gray-600 mb-1">
                {t('modals.proposeReschedule.currentAppointment')}
              </div>
              <div className="font-semibold">{booking.client}</div>
              <div className="text-sm text-gray-600 mb-2">{booking.service}</div>
              <div className="flex items-center gap-4 text-sm">
                <span className="flex items-center gap-1 text-gray-600">
                  <Clock size={14} />
                  {format(booking.date, 'MMM d, yyyy', { locale: dateLocale })}{' '}
                  {t('modals.proposeReschedule.at')} {booking.time}
                </span>
              </div>
            </div>
          </div>
        )}

        <div>
          <Label>{t('modals.proposeReschedule.newDate')}</Label>
          <Input
            type="date"
            className="mt-2 h-12 rounded-xl"
            value={rescheduleDate ? format(rescheduleDate, 'yyyy-MM-dd') : ''}
            onChange={(e) => {
              if (e.target.value) {
                onDateChange(new Date(e.target.value));
              }
            }}
            min={format(new Date(), 'yyyy-MM-dd')}
          />
        </div>

        {rescheduleDate && (
          <div>
            <Label>{t('modals.proposeReschedule.newTime')}</Label>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 mt-2 max-h-48 overflow-y-auto overflow-x-hidden p-2 bg-gray-50 rounded-xl w-full">
              {timeSlots.map((slot) => {
                const isDisabled = !slot.available;
                const isBreak = slot.isBreak ?? false;
                const isSelected = rescheduleTime === slot.time && slot.available;

                return (
                  <button
                    key={slot.time}
                    onClick={() => {
                      if (!isDisabled) {
                        onTimeChange(slot.time);
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
                    className={`p-2 rounded-lg text-xs sm:text-sm transition-all whitespace-nowrap font-medium relative ${
                      isSelected
                        ? 'bg-sky-500 border-2 border-blue-600 text-white'
                        : isBreak
                          ? 'border-orange-200 bg-orange-50 text-orange-600 cursor-not-allowed opacity-75'
                          : isDisabled
                            ? 'border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed opacity-60'
                            : 'bg-white border border-gray-200 hover:border-blue-300 text-gray-700'
                    }`}
                  >
                    {slot.time}
                    {isBreak && <span className="absolute top-0.5 right-0.5 text-[10px]">☕</span>}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <div>
          <Label>{t('modals.proposeReschedule.message')}</Label>
          <Textarea
            placeholder={t('modals.proposeReschedule.messagePlaceholder')}
            className="mt-2 min-h-24 rounded-xl"
            value={rescheduleMessage}
            onChange={(e) => onMessageChange(e.target.value)}
          />
        </div>

        <div className="flex gap-3 pt-4">
          <Button onClick={onClose} variant="outline" className="flex-1 rounded-full">
            {t('modals.common.cancel')}
          </Button>
          <Button
            onClick={onConfirm}
            disabled={!rescheduleDate || !rescheduleTime || isLoading}
            className="flex-1 bg-sky-500 hover:bg-sky-600 text-white rounded-full disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <CalendarClock size={18} className="mr-2" />
            {isLoading ? t('modals.common.processing') || 'Processing...' : t('modals.proposeReschedule.sendProposal')}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
