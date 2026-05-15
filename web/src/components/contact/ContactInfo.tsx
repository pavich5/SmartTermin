import React from 'react';
import { Mail, Phone } from 'lucide-react';
import { useTranslation } from '../../hooks/useTranslation';

export function ContactInfo() {
  const { t } = useTranslation();

  return (
    <div>
      <h2 className="text-3xl font-bold text-gray-900 mb-6">{t('contact.info.title')}</h2>
      <p className="text-lg text-gray-600 mb-8">{t('contact.info.subtitle')}</p>

      <div className="space-y-6">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-sky-100 rounded-lg flex items-center justify-center flex-shrink-0">
            <Mail className="w-6 h-6 text-sky-600" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 mb-1">{t('contact.info.email')}</h3>
            <a href="mailto:support@smartermin.com" className="text-sky-600 hover:text-sky-700">
              support@smartermin.com
            </a>
            <p className="text-sm text-gray-500 mt-1">{t('contact.info.emailResponse')}</p>
          </div>
        </div>

        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
            <Phone className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 mb-1">{t('contact.info.phone')}</h3>
            <a href="tel:+38970123456" className="text-blue-600 hover:text-sky-600">
              +389 70 123 456
            </a>
            <p className="text-sm text-gray-500 mt-1">{t('contact.info.phoneHours')}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
