import React from 'react';
import { useTranslation } from '../../hooks/useTranslation';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';

interface ServiceStepProps {
  service: {
    name: string;
    duration: string;
    price: string;
    description: string;
  };
  onServiceChange: (field: string, value: string) => void;
}

export function ServiceStep({ service, onServiceChange }: ServiceStepProps) {
  const { t } = useTranslation();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold mb-2 text-sky-700">
          {t('onboarding.service.title')}
        </h2>
        <p className="text-gray-600">{t('onboarding.service.subtitle')}</p>
      </div>

      <div className="space-y-4">
        <div>
          <Label htmlFor="serviceName">{t('onboarding.service.name')} *</Label>
          <Input
            id="serviceName"
            type="text"
            maxLength={50}
            placeholder={t('onboarding.service.namePlaceholder')}
            className="mt-2 h-12 rounded-xl"
            value={service.name}
            onChange={(e) => onServiceChange('name', e.target.value)}
            required
          />
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="duration">{t('onboarding.service.duration')} *</Label>
            <Input
              id="duration"
              type="number"
              placeholder="60"
              max={1000}
              min={1}
              className="mt-2 h-12 rounded-xl"
              value={service.duration}
              onChange={(e) => onServiceChange('duration', e.target.value)}
              required
            />
          </div>

          <div>
            <Label htmlFor="price">{t('onboarding.service.price')} *</Label>
            <Input
              id="price"
              type="number"
              placeholder="500"
              className="mt-2 h-12 rounded-xl"
              value={service.price}
              onChange={(e) => onServiceChange('price', e.target.value)}
              min={1}
              max={1000000}
              step="0.01"
              required
            />
          </div>
        </div>

        <div>
          <Label htmlFor="description">{t('onboarding.service.description')}</Label>
          <Textarea
            id="description"
            placeholder={t('onboarding.service.descriptionPlaceholder')}
            className="mt-2 min-h-32 rounded-xl"
            value={service.description}
            maxLength={1000}
            onChange={(e) => onServiceChange('description', e.target.value)}
            required
          />
        </div>
      </div>
    </div>
  );
}
