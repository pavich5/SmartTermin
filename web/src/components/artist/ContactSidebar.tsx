import React from 'react';
import { MapPin, Phone, Mail } from 'lucide-react';
import { Calendar } from 'lucide-react';
import { useTranslation } from '../../hooks/useTranslation';
import { Button } from '../ui/button';

interface ContactSidebarProps {
  phone: string;
  email: string;
  location: string;
  workingHours: {
    [key: string]: string;
  };
  onOpenMap: () => void;
  onBookNow: () => void;
  showBookNow?: boolean;
}

export function ContactSidebar({
  phone,
  email,
  location,
  workingHours,
  onOpenMap,
  onBookNow,
  showBookNow = true,
}: ContactSidebarProps) {
  const { t } = useTranslation();

  const dayNames: { [key: string]: string } = {
    monday: t('artistProfile.days.monday'),
    tuesday: t('artistProfile.days.tuesday'),
    wednesday: t('artistProfile.days.wednesday'),
    thursday: t('artistProfile.days.thursday'),
    friday: t('artistProfile.days.friday'),
    saturday: t('artistProfile.days.saturday'),
    sunday: t('artistProfile.days.sunday'),
  };

  return (
    <div className="space-y-8">
      <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sticky top-24">
        <h2 className="text-xl mb-4">{t('artistProfile.contactInfo')}</h2>
        <div className="space-y-4">
          <a
            href={`tel:${phone.replace(/\s/g, '')}`}
            className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors cursor-pointer"
          >
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Phone className="text-blue-600" size={18} />
            </div>
            <div>
              <div className="text-xs text-gray-600">{t('artistProfile.phone')}</div>
              <div className="text-sm text-blue-600 hover:text-sky-600">{phone}</div>
            </div>
          </a>
          <a
            href={`mailto:${email}`}
            className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors cursor-pointer"
          >
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Mail className="text-blue-600" size={18} />
            </div>
            <div>
              <div className="text-xs text-gray-600">{t('artistProfile.email')}</div>
              <div className="text-sm text-blue-600 hover:text-sky-600 break-all">{email}</div>
            </div>
          </a>
          <div
            onClick={onOpenMap}
            className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors cursor-pointer"
          >
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <MapPin className="text-blue-600" size={18} />
            </div>
            <div>
              <div className="text-xs text-gray-600">{t('artistProfile.location')}</div>
              <div className="text-sm text-blue-600 hover:text-sky-600">{location}</div>
            </div>
          </div>
        </div>

        <div className="mt-6 pt-6 border-t border-gray-100">
          <h3 className="mb-4">{t('artistProfile.workingHours')}</h3>
          <div className="space-y-2">
            {Object.entries(workingHours).map(([day, hours]) => (
              <div key={day} className="flex justify-between text-sm">
                <span className="text-gray-600 capitalize">{dayNames[day] || day}</span>
                <span
                  className={
                    hours === t('artistProfile.closed') ? 'text-gray-400' : 'text-gray-900'
                  }
                >
                  {hours === 'Closed' ? t('artistProfile.closed') : hours}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
