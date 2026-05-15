import React, { useState } from 'react';
import { useTranslation } from '../../../hooks/useTranslation';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { createHoliday, Holiday } from '../../../services/settingsService';
import { toast } from 'sonner';
import { Modal } from './Modal';

interface HolidaysModalProps {
  show: boolean;
  onClose: () => void;
  onHolidayAdded?: (holiday: Holiday) => void;
  existingHolidays?: Holiday[];
  isDemoMode?: boolean;
}

export function HolidaysModal({ show, onClose, onHolidayAdded, existingHolidays = [], isDemoMode = false }: HolidaysModalProps) {
  const { t, language } = useTranslation();
  const [newHolidayDate, setNewHolidayDate] = useState('');
  const [newHolidayDescription, setNewHolidayDescription] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  const handleAddHoliday = async () => {
    if (isDemoMode) {
      const newHoliday: Holiday = {
        id: `demo-${Date.now()}`,
        holidayDate: newHolidayDate,
        description: newHolidayDescription || undefined,
      };
      setNewHolidayDate('');
      setNewHolidayDescription('');
      setIsAdding(false);
      toast.success(t('settings.holidays.addedSuccessfullyDemo'));
      onHolidayAdded?.(newHoliday);
      onClose();
      return;
    }

    if (!newHolidayDate) {
      toast.error(t('settings.holidays.pleaseSelectDate'));
      return;
    }

    const selectedDate = new Date(newHolidayDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (selectedDate < today) {
      toast.error(t('settings.holidays.dateMustBeFuture'));
      return;
    }

    const existingHoliday = existingHolidays.find(
      (h) => h.holidayDate === newHolidayDate
    );
    if (existingHoliday) {
      toast.error(t('settings.holidays.alreadyExists'));
      return;
    }

    try {
      const response = await createHoliday({
        holidayDate: newHolidayDate,
        description: newHolidayDescription || undefined,
      });
      
      setNewHolidayDate('');
      setNewHolidayDescription('');
      setIsAdding(false);
      
      if (response.existingBookingsCount && response.existingBookingsCount > 0) {
        const count = response.existingBookingsCount;
        const isAre = count === 1 ? 'is' : 'are';
        const bookingBookings = language === 'mk' 
          ? (count === 1 ? 'резервација' : 'резервации')
          : (count === 1 ? 'booking' : 'bookings');
        
        toast.warning(
          t('settings.holidays.existingBookingsWarning', { count, isAre, bookingBookings }),
          { duration: 6000 }
        );
      } else {
        toast.success(t('settings.holidays.addedSuccessfully'));
      }
      
      onHolidayAdded?.(response);
      onClose();
    } catch (error: any) {
      console.error('Failed to add holiday:', error);
      toast.error(error?.message || t('settings.holidays.failedToAdd'));
    }
  };

  const today = new Date().toISOString().split('T')[0];

  return (
    <Modal show={show} onClose={onClose} title={t('settings.holidays.addHoliday')}>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t('settings.holidays.date')}
          </label>
          <Input
            type="date"
            value={newHolidayDate}
            onChange={(e) => setNewHolidayDate(e.target.value)}
            min={today}
            className="w-full h-12 rounded-xl"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t('settings.holidays.descriptionPlaceholder')}
          </label>
          <Input
            type="text"
            value={newHolidayDescription}
            onChange={(e) => setNewHolidayDescription(e.target.value)}
            placeholder={t('settings.holidays.descriptionExample')}
            className="w-full h-12 rounded-xl"
          />
        </div>
        <div className="flex gap-3 pt-4">
          <Button
            type="button"
            onClick={onClose}
            variant="outline"
            className="flex-1 rounded-full"
          >
            {t('settings.holidays.cancel')}
          </Button>
          <Button
            type="button"
            onClick={handleAddHoliday}
            className="flex-1 bg-sky-500 hover:bg-sky-600 text-white rounded-full"
          >
            {t('settings.holidays.add')}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
