import React from 'react';
import { Save, Info } from 'lucide-react';
import { useTranslation } from '../../../hooks/useTranslation';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { Label } from '../../ui/label';
import { Tooltip, TooltipContent, TooltipTrigger } from '../../ui/tooltip';

interface BookingSettingsProps {
  maxCancellationHours: number | null;
  onMaxCancellationHoursChange: (value: number | null) => void;
  onSave: () => void;
  isLoading?: boolean;
}

export function BookingSettings({
  maxCancellationHours,
  onMaxCancellationHoursChange,
  onSave,
  isLoading = false,
}: BookingSettingsProps) {
  const { t } = useTranslation();

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6 w-full overflow-hidden">
      <div className="flex items-start gap-2 mb-6">
        <h2 className="text-xl sm:text-2xl">{t('settings.booking.title')}</h2>
        <Tooltip>
          <TooltipTrigger asChild>
            <button type="button" className="mt-1">
              <Info
                size={18}
                className="text-gray-400 cursor-help hover:text-gray-600 transition-colors"
              />
            </button>
          </TooltipTrigger>
          <TooltipContent
            side="right"
            align="start"
            sideOffset={8}
            className="max-w-xs !bg-gray-900 !text-white text-xs p-3 z-[100] shadow-lg border-0"
          >
            <p className="mb-2 font-semibold text-white">{t('settings.booking.tooltip.title')}</p>
            <p className="mb-2 text-gray-100">{t('settings.booking.tooltip.description')}</p>
            <p className="text-gray-300">{t('settings.booking.tooltip.example')}</p>
          </TooltipContent>
        </Tooltip>
      </div>
      <div className="space-y-6">
        <div>
          <Label htmlFor="maxCancellationHours" className="mb-2 block">
            {t('settings.booking.maxCancellationTime')}
          </Label>
          <p className="text-sm text-gray-600 mb-3">
            {t('settings.booking.maxCancellationTimeDesc')}
          </p>
          <div className="flex items-center gap-3">
            <Input
              id="maxCancellationHours"
              type="number"
              min="1"
              max="168"
              value={maxCancellationHours === null ? '' : maxCancellationHours}
              onChange={(e) => {
                const inputValue = e.target.value;
                if (inputValue === '') {
                  onMaxCancellationHoursChange(null);
                } else {
                  const value = parseInt(inputValue);
                  if (!isNaN(value) && value > 0) {
                    onMaxCancellationHoursChange(Math.min(168, value));
                  }
                }
              }}
              className="h-12 rounded-xl max-w-xs"
              placeholder="24"
            />
          </div>
          {maxCancellationHours === null || maxCancellationHours === 0 ? (
            <p className="text-sm text-red-600 mt-2">
              {t('settings.booking.cancellationTimeRequired')}
            </p>
          ) : null}
        </div>
      </div>
      <Button
        onClick={onSave}
        disabled={maxCancellationHours === null || maxCancellationHours === 0 || isLoading}
        className="mt-6 bg-sky-500 hover:bg-sky-600 text-white rounded-full px-8 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <Save size={18} className="mr-2" />
        {isLoading ? t('settings.common.saving') || 'Saving...' : t('settings.common.saveChanges')}
      </Button>
    </div>
  );
}
