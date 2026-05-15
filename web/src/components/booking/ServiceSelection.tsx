import React from 'react';
import { Clock, Check } from 'lucide-react';
import { useTranslation } from '../../hooks/useTranslation';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';

interface Service {
  id: string | number;
  name: string;
  duration: number;
  price: number;
}

interface ServiceSelectionProps {
  services: Service[];
  selectedServices: Service[];
  onServiceToggle: (service: Service) => void;
}

export function ServiceSelection({
  services,
  selectedServices,
  onServiceToggle,
}: ServiceSelectionProps) {
  const { t } = useTranslation();

  const isSelected = (service: Service) => {
    return selectedServices.some(s => s.id === service.id);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">{t('booking.service.select')}</CardTitle>
        {selectedServices.length > 0 && (
          <p className="text-sm text-gray-600 mt-1">
            {selectedServices.length} {selectedServices.length === 1 ? t('booking.service.selected.singular') : t('booking.service.selected.plural')}
          </p>
        )}
      </CardHeader>
      <CardContent>
        <div className="grid gap-3 mb-6">
          {services.map((service) => {
            const selected = isSelected(service);
            return (
              <button
                key={service.id}
                onClick={() => onServiceToggle(service)}
                className={`p-4 rounded-xl border-2 text-left transition-all relative ${
                  selected
                    ? 'border-blue-500 bg-blue-50 shadow-md'
                    : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50/50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold">{service.name}</h3>
                      {selected && (
                        <div className="hidden md:flex w-5 h-5 bg-blue-500 rounded-full items-center justify-center">
                          <Check size={12} className="text-white" />
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <span className="flex items-center gap-1">
                        <Clock size={16} />
                        {service.duration} {t('booking.service.duration')}
                      </span>
                    </div>
                  </div>
                  <div className="text-xl font-bold text-blue-600">{service.price} ден.</div>
                </div>
              </button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
