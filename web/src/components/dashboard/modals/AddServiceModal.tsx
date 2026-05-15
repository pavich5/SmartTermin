import React from 'react';
import { useTranslation } from '../../../hooks/useTranslation';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { Label } from '../../ui/label';
import { Modal } from './Modal';
import { toast } from 'sonner';

interface AddServiceModalProps {
  show: boolean;
  onClose: () => void;
  onSave: (service: { name: string; duration: string; price: string; description: string }) => void;
  isLoading?: boolean;
}

export function AddServiceModal({ show, onClose, onSave, isLoading = false }: AddServiceModalProps) {
  const { t } = useTranslation();
  const [name, setName] = React.useState('');
  const [duration, setDuration] = React.useState('');
  const [price, setPrice] = React.useState('');
  const [description, setDescription] = React.useState('');
  const [errors, setErrors] = React.useState<{
    name?: string;
    duration?: string;
    price?: string;
    description?: string;
  }>({});

  const validate = (): boolean => {
    const newErrors: { name?: string; duration?: string; price?: string; description?: string } =
      {};

    if (!name.trim()) {
      newErrors.name = t('toast.onboarding.serviceNameRequired');
      toast.error(t('toast.onboarding.serviceNameRequired'));
    }

    if (!duration || parseInt(duration, 10) <= 0 || isNaN(parseInt(duration, 10))) {
      newErrors.duration = t('toast.onboarding.durationRequired');
      if (!newErrors.name) {
        toast.error(t('toast.onboarding.durationRequired'));
      }
    }

    if (!price || parseFloat(price) <= 0 || isNaN(parseFloat(price))) {
      newErrors.price = t('toast.onboarding.priceRequired');
      if (!newErrors.name && !newErrors.duration) {
        toast.error(t('toast.onboarding.priceRequired'));
      }
    }

    if (!description.trim()) {
      newErrors.description = 'Description is required';
      if (!newErrors.name && !newErrors.duration && !newErrors.price) {
        toast.error(newErrors.description);
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (!validate()) {
      return;
    }

    onSave({ name, duration, price, description });
    setName('');
    setDuration('');
    setPrice('');
    setDescription('');
    setErrors({});
    onClose();
  };

  const handleClose = () => {
    setName('');
    setDuration('');
    setPrice('');
    setDescription('');
    setErrors({});
    onClose();
  };

  return (
    <Modal show={show} onClose={handleClose} title={t('modals.addService.title')}>
      <div className="space-y-4">
        <div>
          <Label>{t('modals.addService.serviceName')} *</Label>
          <Input
            type="text"
            placeholder={t('modals.addService.serviceNamePlaceholder')}
            className={`mt-2 h-12 rounded-xl ${errors.name ? 'border-red-500 focus:border-red-500' : ''}`}
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              if (errors.name) {
                setErrors((prev) => ({ ...prev, name: undefined }));
              }
            }}
            maxLength={50}
            required
          />
          {errors.name && (
            <p className="text-red-500 text-sm mt-1" style={{ color: '#ef4444' }}>
              {errors.name}
            </p>
          )}
        </div>
        <div>
          <Label>{t('modals.addService.duration')} *</Label>
          <Input
            type="number"
            placeholder={t('modals.addService.durationPlaceholder')}
            className={`mt-2 h-12 rounded-xl ${errors.duration ? 'border-red-500 focus:border-red-500' : ''}`}
            value={duration}
            onChange={(e) => {
              const value = e.target.value;

              if (value === '' || (value.length <= 3 && /^\d+$/.test(value))) {
                setDuration(value);
              }
              if (errors.duration) {
                setErrors((prev) => ({ ...prev, duration: undefined }));
              }
            }}
            min="1"
            max="999"
            maxLength={3}
            required
          />
          {errors.duration && (
            <p className="text-red-500 text-sm mt-1" style={{ color: '#ef4444' }}>
              {errors.duration}
            </p>
          )}
        </div>
        <div>
          <Label>{t('modals.addService.price')} *</Label>
          <Input
            type="number"
            placeholder={t('modals.addService.pricePlaceholder')}
            className={`mt-2 h-12 rounded-xl ${errors.price ? 'border-red-500 focus:border-red-500' : ''}`}
            value={price}
            onChange={(e) => {
              const value = e.target.value;

              const digitsOnly = value.replace(/\./g, '');
              if (
                value === '' ||
                (digitsOnly.length <= 4 &&
                  /^\d*\.?\d*$/.test(value) &&
                  (value.match(/\./g) || []).length <= 1)
              ) {
                setPrice(value);
              }
              if (errors.price) {
                setErrors((prev) => ({ ...prev, price: undefined }));
              }
            }}
            min="0.01"
            step="0.01"
            max="9999"
            maxLength={6}
            required
          />
          {errors.price && (
            <p className="text-red-500 text-sm mt-1" style={{ color: '#ef4444' }}>
              {errors.price}
            </p>
          )}
        </div>
        <div>
          <Label>{t('modals.addService.description')} *</Label>
          <textarea
            className={`w-full mt-2 p-4 rounded-xl border resize-none ${errors.description ? 'border-red-500 focus:border-red-500' : 'border-gray-200'}`}
            rows={3}
            placeholder={t('modals.addService.descriptionPlaceholder')}
            value={description}
            onChange={(e) => {
              setDescription(e.target.value);
              if (errors.description) {
                setErrors((prev) => ({ ...prev, description: undefined }));
              }
            }}
            maxLength={1000}
            required
          />
          {errors.description && (
            <p className="text-red-500 text-sm mt-1" style={{ color: '#ef4444' }}>
              {errors.description}
            </p>
          )}
        </div>
        <div className="flex gap-3 pt-4">
          <Button onClick={handleClose} variant="outline" className="flex-1 rounded-full">
            {t('modals.common.cancel')}
          </Button>
          <Button
            onClick={handleSave}
            disabled={isLoading}
            className="flex-1 bg-sky-500 hover:bg-sky-600 text-white rounded-full disabled:opacity-50"
          >
            {isLoading ? t('modals.common.saving') || 'Saving...' : t('modals.common.save')}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
