import React, { useState } from 'react';
import { useTranslation } from '../../../hooks/useTranslation';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { Label } from '../../ui/label';
import { Modal } from './Modal';
import { Switch } from '../../ui/switch';
import { Plus, X } from 'lucide-react';
import { toast } from 'sonner';

export interface Break {
  start: string;
  end: string;
}

interface ManageBreaksModalProps {
  show: boolean;
  onClose: () => void;
  dayName: string;
  breaks: Break[];
  onBreaksChange: (breaks: Break[]) => void;
  onBreakAddToAll?: (breakData: { start: string; end: string }) => void;
}

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
`;

export function ManageBreaksModal({
  show,
  onClose,
  dayName,
  breaks,
  onBreaksChange,
  onBreakAddToAll,
}: ManageBreaksModalProps) {
  const { t } = useTranslation();
  const [localBreaks, setLocalBreaks] = useState<Break[]>(breaks);
  const [newBreakStart, setNewBreakStart] = useState('12:00');
  const [newBreakEnd, setNewBreakEnd] = useState('13:00');
  const [applyToAllOpenDays, setApplyToAllOpenDays] = useState(false);

  React.useEffect(() => {
    setLocalBreaks(breaks);
  }, [breaks]);

  const handleAddBreak = () => {
    if (!newBreakStart || !newBreakEnd) {
      toast.error(t('toast.validationError') || 'Please fill in both start and end times');
      return;
    }

    if (newBreakStart >= newBreakEnd) {
      toast.error(t('toast.validationError') || 'End time must be after start time');
      return;
    }

    const newBreak: Break = { start: newBreakStart, end: newBreakEnd };
    
    if (applyToAllOpenDays && onBreakAddToAll) {
      onBreakAddToAll(newBreak);
      setNewBreakStart('12:00');
      setNewBreakEnd('13:00');
      setApplyToAllOpenDays(false);
    } else {
      const updatedBreaks = [...localBreaks, newBreak];
      setLocalBreaks(updatedBreaks);
      setNewBreakStart('12:00');
      setNewBreakEnd('13:00');
    }
  };

  const handleRemoveBreak = (index: number) => {
    const updatedBreaks = localBreaks.filter((_, i) => i !== index);
    setLocalBreaks(updatedBreaks);
  };

  const handleBreakChange = (index: number, field: 'start' | 'end', value: string) => {
    const updatedBreaks = [...localBreaks];
    updatedBreaks[index] = {
      ...updatedBreaks[index],
      [field]: value,
    };
    setLocalBreaks(updatedBreaks);
  };

  const handleSave = () => {
    onBreaksChange(localBreaks);
    onClose();
  };

  const handleClose = () => {
    setLocalBreaks(breaks);
    setNewBreakStart('12:00');
    setNewBreakEnd('13:00');
    setApplyToAllOpenDays(false);
    onClose();
  };

  return (
    <>
      <style>{toggleSwitchStyle}</style>
      <Modal show={show} onClose={handleClose} title={`${t('settings.workingHours.breaks') || 'Breaks'} - ${dayName}`}>
        <div className="space-y-4">
          {/* Existing Breaks */}
          <div>
            <Label className="mb-3 block">{t('settings.workingHours.breaks') || 'Breaks'}</Label>
            {localBreaks.length === 0 ? (
              <p className="text-sm text-gray-400 italic py-2">
                {t('settings.workingHours.noBreaks') || 'No breaks scheduled'}
              </p>
            ) : (
              <div className="space-y-3">
                {localBreaks.map((breakItem, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200"
                  >
                    <div className="flex-1 flex items-center gap-2">
                      <div className="flex-1">
                        <Label className="text-xs text-gray-600 mb-1 block">
                          {t('common.start') || 'Start'}
                        </Label>
                        <Input
                          type="time"
                          value={breakItem.start}
                          onChange={(e) => handleBreakChange(index, 'start', e.target.value)}
                          className="h-10"
                        />
                      </div>
                      <span className="text-sm font-medium text-gray-700 mt-6">
                        {t('settings.workingHours.to') || 'TO'}
                      </span>
                      <div className="flex-1">
                        <Label className="text-xs text-gray-600 mb-1 block">
                          {t('common.end') || 'End'}
                        </Label>
                        <Input
                          type="time"
                          value={breakItem.end}
                          onChange={(e) => handleBreakChange(index, 'end', e.target.value)}
                          className="h-10"
                        />
                      </div>
                    </div>
                    <Button
                      type="button"
                      onClick={() => handleRemoveBreak(index)}
                      variant="ghost"
                      size="sm"
                      className="h-10 w-10 p-0 text-red-500 hover:text-red-600 hover:bg-red-50 flex-shrink-0 mt-6"
                    >
                      <X size={16} />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Add New Break */}
          <div className="border-t pt-4">
            <Label className="mb-3 block">{t('settings.workingHours.addBreak') || 'Add Break'}</Label>
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="flex-1">
                  <Label className="text-xs text-gray-600 mb-1 block">
                    {t('common.start') || 'Start'}
                  </Label>
                  <Input
                    type="time"
                    className="h-10"
                    value={newBreakStart}
                    onChange={(e) => setNewBreakStart(e.target.value)}
                    required
                  />
                </div>
                <span className="text-sm font-medium text-gray-700 mt-6">
                  {t('settings.workingHours.to') || 'TO'}
                </span>
                <div className="flex-1">
                  <Label className="text-xs text-gray-600 mb-1 block">
                    {t('common.end') || 'End'}
                  </Label>
                  <Input
                    type="time"
                    className="h-10"
                    value={newBreakEnd}
                    onChange={(e) => setNewBreakEnd(e.target.value)}
                    required
                  />
                </div>
              </div>
              {onBreakAddToAll && (
                <div className="flex items-center justify-between pt-2">
                  <Label htmlFor="apply-to-all" className="text-sm font-medium text-gray-700">
                    {t('settings.workingHours.applyToAllOpenDays') || 'Apply to all open working days'}
                  </Label>
                  <Switch
                    id="apply-to-all"
                    checked={applyToAllOpenDays}
                    onCheckedChange={setApplyToAllOpenDays}
                  />
                </div>
              )}
              <Button
                onClick={handleAddBreak}
                className="w-full bg-sky-500 hover:bg-sky-600 text-white rounded-full"
              >
                <Plus size={16} className="mr-2" />
                {t('settings.workingHours.addBreak') || 'Add Break'}
              </Button>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4 border-t">
            <Button onClick={handleClose} variant="outline" className="flex-1 rounded-full">
              {t('modals.common.cancel') || 'Cancel'}
            </Button>
            <Button
              onClick={handleSave}
              className="flex-1 bg-sky-500 hover:bg-sky-600 text-white rounded-full"
            >
              {t('modals.common.save') || 'Save'}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}