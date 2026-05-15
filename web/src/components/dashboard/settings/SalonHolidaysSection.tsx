import React, { useState, useEffect } from 'react';
import { Calendar, Trash2 } from 'lucide-react';
import { useTranslation } from '../../../hooks/useTranslation';
import { Button } from '../../ui/button';
import { getSalonHolidays, deleteSalonHoliday, SalonHoliday } from '../../../services/settingsService';
import { toast } from 'sonner';

interface SalonHolidaysSectionProps {
  onHolidayDeleted?: () => void;
  onAddClick?: () => void;
}

export function SalonHolidaysSection({ onHolidayDeleted, onAddClick }: SalonHolidaysSectionProps) {
  const { t } = useTranslation();
  const [holidays, setHolidays] = useState<SalonHoliday[]>([]);
  const [isLoading, setIsLoading] = useState(true);

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

  const handleDeleteHoliday = async (holidayId: string) => {
    try {
      await deleteSalonHoliday(holidayId);
      setHolidays(holidays.filter((h) => h.id !== holidayId));
      toast.success(t('toast.salonHolidayDeleted'));
      onHolidayDeleted?.();
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

  const futureHolidays = holidays
    .filter((h) => {
      const holidayDate = new Date(h.holidayDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return holidayDate >= today;
    })
    .sort((a, b) => new Date(a.holidayDate).getTime() - new Date(b.holidayDate).getTime());

  if (isLoading) {
    return (
      <div className="bg-white rounded-2xl shadow-lg p-6 w-full">
        <div className="text-center py-8 text-gray-500">{t('settings.salonHolidays.loading')}</div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6 w-full">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl sm:text-2xl">{t('settings.salonHolidays.title')}</h2>
        {onAddClick && (
          <Button
            type="button"
            onClick={onAddClick}
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
          >
            <Calendar size={16} />
            {t('settings.salonHolidays.addHoliday')}
          </Button>
        )}
      </div>
      
      {futureHolidays.length === 0 ? (
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

