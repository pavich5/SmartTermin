import React, { useState, useEffect } from 'react';
import { Calendar, Plus, Trash2 } from 'lucide-react';
import { useTranslation } from '../../../hooks/useTranslation';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { getSalonHolidays, createSalonHoliday, deleteSalonHoliday, SalonHoliday } from '../../../services/settingsService';
import { toast } from 'sonner';

interface SalonHolidaysProps {
  onHolidaysChange?: () => void;
}

export function SalonHolidays({ onHolidaysChange }: SalonHolidaysProps) {
  const { t } = useTranslation();
  const [holidays, setHolidays] = useState<SalonHoliday[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [newHolidayDate, setNewHolidayDate] = useState('');
  const [newHolidayDescription, setNewHolidayDescription] = useState('');

  useEffect(() => {
    loadHolidays();
  }, []);

  const loadHolidays = async () => {
    try {
      setIsLoading(true);
      const response = await getSalonHolidays();
      setHolidays(response.holidays || []);
    } catch (error) {
      console.error('Failed to load salon holidays:', error);
      toast.error(t('toast.failedToLoadSalonHolidays'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddHoliday = async () => {
    if (!newHolidayDate) {
      toast.error(t('toast.pleaseSelectDate'));
      return;
    }

    // Check if date is in the future (at least today)
    const selectedDate = new Date(newHolidayDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (selectedDate < today) {
      toast.error(t('toast.holidayDateMustBeFuture'));
      return;
    }

    // Check if holiday already exists for this date
    const existingHoliday = holidays.find(
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
      
      setHolidays([...holidays, response]);
      setNewHolidayDate('');
      setNewHolidayDescription('');
      setIsAdding(false);
      
      // Show warning if there are existing bookings
      if (response.existingBookingsCount && response.existingBookingsCount > 0) {
        toast.warning(
          `Salon holiday added successfully. Note: There ${response.existingBookingsCount === 1 ? 'is' : 'are'} ${response.existingBookingsCount} existing ${response.existingBookingsCount === 1 ? 'booking' : 'bookings'} on this date across all salon members. These bookings will remain active, but no new bookings can be made.`,
          { duration: 6000 }
        );
      } else {
        toast.success(t('toast.salonHolidayAdded'));
      }
      
      onHolidaysChange?.();
    } catch (error: any) {
      console.error('Failed to add salon holiday:', error);
      toast.error(error?.message || 'Failed to add salon holiday');
    }
  };

  const handleDeleteHoliday = async (holidayId: string) => {
    try {
      await deleteSalonHoliday(holidayId);
      setHolidays(holidays.filter((h) => h.id !== holidayId));
      toast.success(t('toast.salonHolidayDeleted'));
      onHolidaysChange?.();
    } catch (error: any) {
      console.error('Failed to delete salon holiday:', error);
      toast.error(error?.message || 'Failed to delete salon holiday');
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  // Get minimum date (today)
  const today = new Date().toISOString().split('T')[0];

  // Filter holidays to show only future ones (or today)
  const futureHolidays = holidays
    .filter((h) => {
      const holidayDate = new Date(h.holidayDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return holidayDate >= today;
    })
    .sort((a, b) => new Date(a.holidayDate).getTime() - new Date(b.holidayDate).getTime());

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6 w-full overflow-hidden">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl sm:text-2xl">{t('settings.salonHolidays.title')}</h2>
          <p className="text-sm text-gray-600 mt-1">
            {t('settings.salonHolidays.description')}
          </p>
        </div>
        {!isAdding && (
          <Button
            type="button"
            onClick={() => setIsAdding(true)}
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
          >
            <Plus size={16} />
            {t('settings.salonHolidays.addHoliday')}
          </Button>
        )}
      </div>

      {isAdding && (
        <div className="mb-6 p-4 border border-gray-200 rounded-xl bg-gray-50">
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('settings.salonHolidays.date')}
              </label>
              <Input
                type="date"
                value={newHolidayDate}
                onChange={(e) => setNewHolidayDate(e.target.value)}
                min={today}
                className="w-full"
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
                className="w-full"
              />
            </div>
            <div className="flex gap-2">
              <Button
                type="button"
                onClick={handleAddHoliday}
                className="bg-sky-500 hover:bg-sky-600 text-white"
              >
                {t('settings.salonHolidays.add')}
              </Button>
              <Button
                type="button"
                onClick={() => {
                  setIsAdding(false);
                  setNewHolidayDate('');
                  setNewHolidayDescription('');
                }}
                variant="outline"
              >
                {t('settings.salonHolidays.cancel')}
              </Button>
            </div>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="text-center py-8 text-gray-500">{t('settings.salonHolidays.loading')}</div>
      ) : futureHolidays.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <Calendar className="mx-auto mb-2 text-gray-400" size={48} />
          <p>{t('settings.salonHolidays.noHolidays')}</p>
          <p className="text-sm mt-1">
            {t('settings.salonHolidays.noHolidaysDesc')}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {futureHolidays.map((holiday) => (
            <div
              key={holiday.id}
              className="flex items-center justify-between p-4 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
            >
              <div className="flex-1">
                <div className="font-medium text-gray-900">
                  {formatDate(holiday.holidayDate)}
                </div>
                {holiday.description && (
                  <div className="text-sm text-gray-600 mt-1">
                    {holiday.description}
                  </div>
                )}
              </div>
              <Button
                type="button"
                onClick={() => handleDeleteHoliday(holiday.id)}
                variant="ghost"
                size="sm"
                className="text-red-500 hover:text-red-600 hover:bg-red-50"
              >
                <Trash2 size={18} />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

