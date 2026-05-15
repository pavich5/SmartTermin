import React, { useState } from 'react';
import { useTranslation } from '../../../hooks/useTranslation';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { Label } from '../../ui/label';
import { Modal } from './Modal';
import { Switch } from '../../ui/switch';
import { toast } from 'sonner';

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

export interface Break {
  start: string;
  end: string;
}

interface AddBreakModalProps {
  show: boolean;
  onClose: () => void;
  onSave: (breakData: { start: string; end: string; applyToAllOpenDays: boolean }) => void;
  isLoading?: boolean;
}

export function AddBreakModal({ show, onClose, onSave, isLoading = false }: AddBreakModalProps) {
  const { t } = useTranslation();
  const [start, setStart] = useState('12:00');
  const [end, setEnd] = useState('13:00');
  const [applyToAllOpenDays, setApplyToAllOpenDays] = useState(false);

  const handleSave = () => {
    if (!start || !end) {
      toast.error(t('toast.validationError') || 'Please fill in both start and end times');
      return;
    }

    if (start >= end) {
      toast.error(t('toast.validationError') || 'End time must be after start time');
      return;
    }

    onSave({ start, end, applyToAllOpenDays });
    setStart('12:00');
    setEnd('13:00');
    setApplyToAllOpenDays(false);
    onClose();
  };

  const handleClose = () => {
    setStart('12:00');
    setEnd('13:00');
    setApplyToAllOpenDays(false);
    onClose();
  };

  return (
    <>
      <style>{toggleSwitchStyle}</style>
      <Modal show={show} onClose={handleClose} title={t('settings.workingHours.addBreak') || 'Add Break'}>
        <div className="space-y-4">
        <div>
          <Label>{t('common.start') || 'Start Time'}</Label>
          <Input
            type="time"
            className="mt-2 h-12 rounded-xl"
            value={start}
            onChange={(e) => setStart(e.target.value)}
            required
          />
        </div>
        <div>
          <Label>{t('common.end') || 'End Time'}</Label>
          <Input
            type="time"
            className="mt-2 h-12 rounded-xl"
            value={end}
            onChange={(e) => setEnd(e.target.value)}
            required
          />
        </div>
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
        <div className="flex gap-3 pt-4">
          <Button onClick={handleClose} variant="outline" className="flex-1 rounded-full">
            {t('modals.common.cancel') || 'Cancel'}
          </Button>
          <Button
            onClick={handleSave}
            disabled={isLoading}
            className="flex-1 bg-sky-500 hover:bg-sky-600 text-white rounded-full disabled:opacity-50"
          >
            {isLoading ? t('modals.common.saving') || 'Saving...' : t('modals.common.save') || 'Save'}
          </Button>
        </div>
      </div>
      </Modal>
    </>
  );
}