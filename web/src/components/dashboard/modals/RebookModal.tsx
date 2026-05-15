import React from 'react';
import { RotateCcw, Clock } from 'lucide-react';
import { useTranslation } from '../../../hooks/useTranslation';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { Label } from '../../ui/label';
import { Modal } from './Modal';
import { format } from 'date-fns';

interface Booking {
  client: string;
  service: string;
  duration: string;
  price: string;
}

interface RebookModalProps {
  show: boolean;
  onClose: () => void;
  booking: Booking | null;
  rebookDate: Date | null;
  rebookTime: string;
  timeSlots: Array<{
    time: string;
    available: boolean;
    nextAvailableTime?: string | null;
    isBreak?: boolean;
  }>;
  onDateChange: (date: Date | null) => void;
  onTimeChange: (time: string) => void;
  onConfirm: () => void;
  isLoading?: boolean;
}

export function RebookModal({
  show,
  onClose,
  booking,
  rebookDate,
  rebookTime,
  timeSlots,
  onDateChange,
  onTimeChange,
  onConfirm,
  isLoading = false,
}: RebookModalProps) {
  const { t } = useTranslation();

  return (
    <Modal show={show} onClose={onClose} title={t('modals.rebook.title')}>
      <div className="space-y-4">
        <p className="text-gray-600">{t('modals.rebook.description')}</p>

        {booking && (
          <div className="p-4 bg-blue-50 rounded-xl">
            <div className="mb-3">
              <div className="text-xs text-gray-600 mb-1">{t('modals.rebook.clientName')}</div>
              <div className="font-semibold">{booking.client}</div>
            </div>
            <div className="mb-3">
              <div className="text-xs text-gray-600 mb-1">{t('modals.rebook.service')}</div>
              <div className="font-semibold">{booking.service}</div>
            </div>
            <div className="flex items-center gap-4 text-sm">
              <span className="text-gray-600">{booking.duration}</span>
              <span className="text-blue-600 font-semibold">{booking.price}</span>
            </div>
          </div>
        )}

        <div>
          <Label>{t('modals.rebook.selectNewDate')}</Label>
          <Input
            type="date"
            className="mt-2 h-12 rounded-xl"
            value={rebookDate ? format(rebookDate, 'yyyy-MM-dd') : ''}
            onChange={(e) => {
              if (e.target.value) {
                onDateChange(new Date(e.target.value));
              }
            }}
            min={format(new Date(), 'yyyy-MM-dd')}
          />
        </div>

        {rebookDate && (
          <div>
            <Label>{t('modals.rebook.selectNewTime')}</Label>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 mt-2 max-h-48 overflow-y-auto overflow-x-hidden p-2 bg-gray-50 rounded-xl w-full">
              {timeSlots.map((slot) => {
                const isDisabled = !slot.available;
                const isBreak = slot.isBreak ?? false;
                const isSelected = rebookTime === slot.time && slot.available;

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
                        ? 'bg-blue-600 border-2 border-sky-500 text-white'
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

        <div className="flex gap-3 pt-4">
          <Button onClick={onClose} variant="outline" className="flex-1 rounded-full">
            {t('modals.common.cancel')}
          </Button>
          <Button
            onClick={onConfirm}
            disabled={!rebookDate || !rebookTime || isLoading}
            className="flex-1 bg-sky-500 hover:bg-sky-600 text-white rounded-full disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RotateCcw size={18} className="mr-2" />
            {isLoading ? t('modals.common.processing') || 'Processing...' : t('modals.rebook.confirmButton')}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
