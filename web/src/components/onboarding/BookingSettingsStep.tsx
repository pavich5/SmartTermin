import React from 'react';
import { Info } from 'lucide-react';
import { useTranslation } from '../../hooks/useTranslation';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Tooltip, TooltipContent, TooltipTrigger } from '../ui/tooltip';

interface BookingSettingsStepProps {
  maxCancellationHours: number;
  onMaxCancellationHoursChange: (value: number) => void;
}

export function BookingSettingsStep({
  maxCancellationHours,
  onMaxCancellationHoursChange,
}: BookingSettingsStepProps) {
  const { t } = useTranslation();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold mb-2 text-sky-700">
          {t('onboarding.bookingSettings.title')}
        </h2>
        <p className="text-gray-600">{t('onboarding.bookingSettings.subtitle')}</p>
      </div>

      <div className="space-y-6">
        <div className="flex items-start gap-2 mb-4">
          <h3 className="text-xl font-semibold text-gray-800">
            {t('onboarding.bookingSettings.cancellationPolicy')}
          </h3>
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
              <p className="mb-2 font-semibold text-white">
                {t('onboarding.bookingSettings.cancellationPolicy')}
              </p>
              <p className="mb-2 text-gray-100">
                {t('onboarding.bookingSettings.cancellationPolicyDesc')}
              </p>
              <p className="text-gray-300">
                {t('onboarding.bookingSettings.cancellationPolicyExample')}
              </p>
            </TooltipContent>
          </Tooltip>
        </div>
        <div>
          <Label htmlFor="maxCancellationHours" className="mb-2 block">
            {t('onboarding.bookingSettings.maxCancellationTime')}
          </Label>
          <p className="text-sm text-gray-600 mb-3">
            {t('onboarding.bookingSettings.maxCancellationTimeDesc')}
          </p>
          <div className="flex items-center gap-3">
            <Input
              id="maxCancellationHours"
              type="number"
              min="0"
              max="168"
              value={maxCancellationHours}
              onChange={(e) => {
                const value = parseInt(e.target.value) || 0;
                onMaxCancellationHoursChange(Math.max(0, Math.min(168, value)));
              }}
              className="h-12 rounded-xl max-w-xs mb-2"
              placeholder="24"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
