import React, { useState } from 'react';
import { useTranslation } from '../../../hooks/useTranslation';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { createSalonHoliday, SalonHoliday } from '../../../services/settingsService';
import { toast } from 'sonner';
import { Modal } from './Modal';

interface SalonHolidaysModalProps {
  show: boolean;
  onClose: () => void;
  onHolidayAdded?: (holiday: SalonHoliday) => void;
  existingHolidays?: SalonHoliday[];
}

export function SalonHolidaysModal({ show, onClose, onHolidayAdded, existingHolidays = [] }: SalonHolidaysModalProps) {
  const { t } = useTranslation();
  const [newHolidayDate, setNewHolidayDate] = useState('');
  const [newHolidayDescription, setNewHolidayDescription] = useState('');

  const handleAddHoliday = async () => {
    if (!newHolidayDate) {
      toast.error(t('toast.pleaseSelectDate'));
      return;
    }

    const selectedDate = new Date(newHolidayDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (selectedDate < today) {
      toast.error(t('toast.holidayDateMustBeFuture'));
      return;
    }

    const existingHoliday = existingHolidays.find(
      (h) => h.holidayDate === newHolidayDate
    );
    if (existingHoliday) {
      toast.error(t('toast.holidayAlreadyExists'));
      return;
    }

    try {
      const response = await createSalonHoliday({
        holidayDate: newHolidayDate,
        description: newHolidayDescription || undefined,
      });
      
      setNewHolidayDate('');
      setNewHolidayDescription('');
      
      if (response.existingBookingsCount && response.existingBookingsCount > 0) {
        toast.warning(
          `Salon holiday added successfully. Note: There ${response.existingBookingsCount === 1 ? 'is' : 'are'} ${response.existingBookingsCount} existing ${response.existingBookingsCount === 1 ? 'booking' : 'bookings'} on this date across all salon members. These bookings will remain active, but no new bookings can be made.`,
          { duration: 6000 }
        );
      } else {
        toast.success(t('toast.salonHolidayAdded'));
      }
      
      onHolidayAdded?.(response);
      onClose();
    } catch (error: any) {
      console.error('Failed to add salon holiday:', error);
      toast.error(error?.message || 'Failed to add salon holiday');
    }
  };

  const today = new Date().toISOString().split('T')[0];

  return (
    <Modal show={show} onClose={onClose} title={t('settings.salonHolidays.addHoliday')}>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t('settings.salonHolidays.date')}
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
            {t('settings.salonHolidays.descriptionPlaceholder')}
          </label>
          <Input
            type="text"
            value={newHolidayDescription}
            onChange={(e) => setNewHolidayDescription(e.target.value)}
            placeholder={t('settings.salonHolidays.descriptionExample')}
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
            {t('settings.salonHolidays.cancel')}
          </Button>
          <Button
            type="button"
            onClick={handleAddHoliday}
            className="flex-1 bg-sky-500 hover:bg-sky-600 text-white rounded-full"
          >
            {t('settings.salonHolidays.add')}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
