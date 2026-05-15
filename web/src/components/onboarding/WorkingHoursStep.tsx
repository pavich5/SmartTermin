import React, { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { Switch } from '../ui/switch';
import { useTranslation } from '../../hooks/useTranslation';
import { ManageBreaksModal } from '../dashboard/modals/ManageBreaksModal';

// Custom style for blue toggle switch
const toggleSwitchStyle = `
  [data-slot="switch"][data-state="checked"] {
    background-color: rgb(186 230 253) !important; /* sky-200 - lighter blue */
  }
  [data-slot="switch"][data-state="checked"] > [data-slot="switch-thumb"] {
    background-color: rgb(14 165 233) !important; /* sky-500 - blue circle */
    transform: translateX(calc(100% - 2px)) !important;
  }
  [data-slot="switch"][data-state="unchecked"] > [data-slot="switch-thumb"] {
    transform: translateX(0) !important;
    background-color: rgb(14 165 233) !important;
  }
  .breaks-text-mobile {
    display: none !important;
  }
  @media (min-width: 768px) {
    .breaks-text-mobile {
      display: inline-block !important;
    }
  }
`;

type Break = {
  start: string;
  end: string;
};

type WorkingHours = {
  start: string;
  end: string;
  closed: boolean;
  breaks?: Break[];
};

type WorkingHoursData = {
  monday: WorkingHours;
  tuesday: WorkingHours;
  wednesday: WorkingHours;
  thursday: WorkingHours;
  friday: WorkingHours;
  saturday: WorkingHours;
  sunday: WorkingHours;
};

interface WorkingHoursStepProps {
  workingHours: WorkingHoursData;
  onWorkingHoursChange: (
    day: keyof WorkingHoursData,
    field: keyof WorkingHours,
    value: string | boolean
  ) => void;
  onBreakAdd: (day: keyof WorkingHoursData, breakData: { start: string; end: string }) => void;
  onBreakAddToAll: (breakData: { start: string; end: string }) => void;
  onBreakRemove: (day: keyof WorkingHoursData, breakIndex: number) => void;
  onBreakChange: (
    day: keyof WorkingHoursData,
    breakIndex: number,
    field: 'start' | 'end',
    value: string
  ) => void;
}

export function WorkingHoursStep({
  workingHours,
  onWorkingHoursChange,
  onBreakAdd,
  onBreakAddToAll,
  onBreakRemove,
  onBreakChange,
}: WorkingHoursStepProps) {
  const { t } = useTranslation();
  const [isDesktop, setIsDesktop] = useState(false);
  const [showManageBreaksModal, setShowManageBreaksModal] = useState(false);
  const [selectedDay, setSelectedDay] = useState<keyof WorkingHoursData | null>(null);

  useEffect(() => {
    const checkScreenSize = () => {
      setIsDesktop(window.matchMedia('(min-width: 768px)').matches);
    };
    
    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  const days = [
    { day: t('settings.workingHours.monday'), dayKey: 'monday' },
    { day: t('settings.workingHours.tuesday'), dayKey: 'tuesday' },
    { day: t('settings.workingHours.wednesday'), dayKey: 'wednesday' },
    { day: t('settings.workingHours.thursday'), dayKey: 'thursday' },
    { day: t('settings.workingHours.friday'), dayKey: 'friday' },
    { day: t('settings.workingHours.saturday'), dayKey: 'saturday' },
    { day: t('settings.workingHours.sunday'), dayKey: 'sunday' },
  ] as Array<{ day: string; dayKey: keyof WorkingHoursData }>;

  return (
    <>
      <style>{toggleSwitchStyle}</style>
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-2">
              {t('settings.workingHours.setStandardHours') || t('onboarding.workingHours.title') || 'Set Standard Hours'}
            </h2>
            <p className="text-xs md:text-sm text-gray-600">
              {t('settings.workingHours.configureDescription') || t('onboarding.workingHours.subtitle') || 'Configure the standard hours of operation for this location.'}
            </p>
          </div>
        </div>

        {/* Days List */}
        <div className="space-y-0 mb-6">
          {days.map(({ day, dayKey }) => {
            const dayHours = workingHours[dayKey];
            const isOpen = !dayHours.closed;
            const breaks = dayHours.breaks || [];

            return (
              <div
                key={dayKey}
                className="flex flex-col md:flex-row items-start md:items-center py-3 border-b border-gray-100 last:border-b-0 gap-2 md:gap-0"
              >
                {/* Day Name - responsive width: full on mobile, 12% on desktop */}
                <div 
                  className="flex-shrink-0 pr-0 md:pr-4"
                  style={isDesktop ? { width: '12%' } : {}}
                >
                  <span className="text-base font-medium text-gray-900">{day}</span>
                </div>

                {/* Toggle + Status - responsive: full on mobile, 18% on desktop */}
                <div className="flex-shrink-0 flex items-center gap-3 pr-0 md:pr-4" style={isDesktop ? { width: '18%' } : {}}>
                  <Switch
                    checked={isOpen}
                    onCheckedChange={(checked) => onWorkingHoursChange(dayKey, 'closed', !checked)}
                  />
                  <span className="text-sm font-medium text-gray-900 whitespace-nowrap">
                    {isOpen 
                      ? (t('settings.workingHours.open') || 'Open')
                      : (t('settings.workingHours.closed') || 'Closed')
                    }
                  </span>
                </div>

                {/* Time Inputs - responsive: full on mobile, 35% on desktop */}
                <div className="flex-shrink-0 flex items-center gap-2 pr-0 md:pr-4" style={isDesktop ? { width: '35%' } : {}}>
                  {isOpen ? (
                    <>
                      <div className="relative flex-1 min-w-[120px]">
                        <Input
                          type="time"
                          value={dayHours.start}
                          onChange={(e) => onWorkingHoursChange(dayKey, 'start', e.target.value)}
                          className="w-full h-10 px-3 py-1 md:py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                        />
                      </div>
                      <span className="text-sm font-medium text-gray-700 whitespace-nowrap flex-shrink-0">
                        {t('settings.workingHours.to') || 'TO'}
                      </span>
                      <div className="relative flex-1 min-w-[120px]">
                        <Input
                          type="time"
                          value={dayHours.end}
                          onChange={(e) => onWorkingHoursChange(dayKey, 'end', e.target.value)}
                          className="w-full h-10 px-3 py-1 md:py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                        />
                      </div>
                      {/* Breaks Button */}
                      <Button
                        type="button"
                        onClick={() => {
                          setSelectedDay(dayKey);
                          setShowManageBreaksModal(true);
                        }}
                        variant="outline"
                        size="sm"
                        className="h-10 px-4 text-sm border border-sky-200 bg-gradient-to-r from-sky-50 to-blue-50 text-sky-700 hover:from-sky-100 hover:to-blue-100 hover:border-sky-300 hover:shadow-md transition-all duration-200 flex-shrink-0 font-medium"
                      >
                        <Clock size={14} className="mr-1.5" />
                        <span className="breaks-text-mobile">{t('settings.workingHours.breaks') || 'Breaks'}</span>
                        {breaks.length > 0 && (
                          <span className="ml-1 md:ml-2 px-2 py-0.5 bg-sky-500 text-white text-xs rounded-full font-semibold shadow-sm">
                            {breaks.length}
                          </span>
                        )}
                      </Button>
                    </>
                  ) : (
                    <span className="text-sm text-gray-400"></span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

      {/* Manage Breaks Modal */}
      {selectedDay && (
        <ManageBreaksModal
          show={showManageBreaksModal}
          onClose={() => {
            setShowManageBreaksModal(false);
            setSelectedDay(null);
          }}
          dayName={days.find(d => d.dayKey === selectedDay)?.day || selectedDay}
          breaks={workingHours[selectedDay]?.breaks || []}
          onBreaksChange={(updatedBreaks) => {
            // Update breaks for the selected day
            const dayHours = workingHours[selectedDay];
            const currentBreaks = dayHours.breaks || [];
            
            // Remove all existing breaks (from end to start to avoid index shifting)
            for (let i = currentBreaks.length - 1; i >= 0; i--) {
              onBreakRemove(selectedDay, i);
            }
            
            // Add all new breaks
            updatedBreaks.forEach((breakItem) => {
              onBreakAdd(selectedDay, breakItem);
            });
          }}
          onBreakAddToAll={onBreakAddToAll}
        />
      )}
    </>
  );
}
