import React from 'react';
import { Clock } from 'lucide-react';
import { useTranslation } from '../../hooks/useTranslation';

interface Service {
  name: string;
  duration: string;
  price: string;
}

interface ServicesSectionProps {
  services: Service[];
}

export function ServicesSection({ services }: ServicesSectionProps) {
  const { t } = useTranslation();

  return (
    <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
      <h2 className="text-2xl mb-6">{t('artistProfile.services')}</h2>
      <div className="space-y-4">
        {services.map((service, idx) => (
          <div
            key={idx}
            className="flex items-center justify-between p-4 bg-blue-50 rounded-xl hover:shadow-md transition-shadow"
          >
            <div>
              <h3 className="mb-1">{service.name}</h3>
              <div className="flex items-center gap-2 text-gray-600 text-sm">
                <Clock size={16} />
                <span>{service.duration}</span>
              </div>
            </div>
            <div className="text-blue-600 text-xl">{service.price}</div>
          </div>
        ))}
      </div>
    </section>
  );
}
