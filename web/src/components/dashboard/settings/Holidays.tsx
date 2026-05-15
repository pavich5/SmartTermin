import React, { useState, useEffect } from 'react';
import { Calendar, Plus, X, Trash2 } from 'lucide-react';
import { useTranslation } from '../../../hooks/useTranslation';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { getHolidays, createHoliday, deleteHoliday, Holiday } from '../../../services/settingsService';
import { toast } from 'sonner';

interface HolidaysProps {
  onHolidaysChange?: () => void;
  mockHolidays?: Holiday[]; // For demo mode
  isDemoMode?: boolean; // Flag to disable API calls in demo mode
}

export function Holidays({ onHolidaysChange, mockHolidays, isDemoMode = false }: HolidaysProps) {
  const { t, language } = useTranslation();
  const [holidays, setHolidays] = useState<Holiday[]>(mockHolidays || []);
  const [isLoading, setIsLoading] = useState(!isDemoMode);
  const [isAdding, setIsAdding] = useState(false);
  const [newHolidayDate, setNewHolidayDate] = useState('');
  const [newHolidayDescription, setNewHolidayDescription] = useState('');

  useEffect(() => {
    if (!isDemoMode) {
      loadHolidays();
    } else {
      setIsLoading(false);
    }
  }, [isDemoMode]);

  const loadHolidays = async () => {
    if (isDemoMode) return; // Don't fetch in demo mode
    
    try {
      setIsLoading(true);
      const response = await getHolidays();
      setHolidays(response.holidays || []);
    } catch (error) {
      console.error('Failed to load holidays:', error);
      toast.error(t('settings.holidays.failedToLoad'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddHoliday = async () => {
    if (isDemoMode) {
      // In demo mode, just add to local state
      const newHoliday: Holiday = {
        id: `demo-${Date.now()}`,
        holidayDate: newHolidayDate,
        description: newHolidayDescription || undefined,
      };
      setHolidays([...holidays, newHoliday]);
      setNewHolidayDate('');
      setNewHolidayDescription('');
      setIsAdding(false);
      toast.success(t('settings.holidays.addedSuccessfullyDemo'));
      return;
    }

    if (!newHolidayDate) {
      toast.error(t('settings.holidays.pleaseSelectDate'));
      return;
    }

    // Check if date is in the future (at least today)
    const selectedDate = new Date(newHolidayDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (selectedDate < today) {
      toast.error(t('settings.holidays.dateMustBeFuture'));
      return;
    }

    // Check if holiday already exists for this date
    const existingHoliday = holidays.find(
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
      
      setHolidays([...holidays, response]);
      setNewHolidayDate('');
      setNewHolidayDescription('');
      setIsAdding(false);
      
      // Show warning if there are existing bookings
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
      
      onHolidaysChange?.();
    } catch (error: any) {
      console.error('Failed to add holiday:', error);
      toast.error(error?.message || t('settings.holidays.failedToAdd'));
    }
  };

  const handleDeleteHoliday = async (holidayId: string) => {
    if (isDemoMode) {
      // In demo mode, just remove from local state
      setHolidays(holidays.filter((h) => h.id !== holidayId));
      toast.success(t('settings.holidays.deletedSuccessfullyDemo'));
      return;
    }

    try {
      await deleteHoliday(holidayId);
      setHolidays(holidays.filter((h) => h.id !== holidayId));
      toast.success(t('settings.holidays.deletedSuccessfully'));
      onHolidaysChange?.();
    } catch (error: any) {
      console.error('Failed to delete holiday:', error);
      toast.error(error?.message || t('settings.holidays.failedToDelete'));
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
        <h2 className="text-xl sm:text-2xl">{t('settings.holidays.title')}</h2>
        {!isAdding && (
          <Button
            type="button"
            onClick={() => setIsAdding(true)}
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
          >
            <Plus size={16} />
            {t('settings.holidays.addHoliday')}
          </Button>
        )}
      </div>

      {isAdding && (
        <div className="mb-6 p-4 border border-gray-200 rounded-xl bg-gray-50">
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('settings.holidays.date')}
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
                {t('settings.holidays.descriptionPlaceholder')}
              </label>
              <Input
                type="text"
                value={newHolidayDescription}
                onChange={(e) => setNewHolidayDescription(e.target.value)}
                placeholder={t('settings.holidays.descriptionExample')}
                className="w-full"
              />
            </div>
            <div className="flex gap-2">
              <Button
                type="button"
                onClick={handleAddHoliday}
                className="bg-sky-500 hover:bg-sky-600 text-white"
              >
                {t('settings.holidays.add')}
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
                {t('settings.holidays.cancel')}
              </Button>
            </div>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="text-center py-8 text-gray-500">{t('settings.holidays.loading')}</div>
      ) : futureHolidays.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <Calendar className="mx-auto mb-2 text-gray-400" size={48} />
          <p>{t('settings.holidays.noHolidays')}</p>
          <p className="text-sm mt-1">
            {t('settings.holidays.noHolidaysDesc')}
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

