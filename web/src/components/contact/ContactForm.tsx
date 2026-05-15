import React from 'react';
import { Send } from 'lucide-react';
import { useTranslation } from '../../hooks/useTranslation';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';

interface ContactFormProps {
  formData: {
    name: string;
    email: string;
    phone: string;
    subject: string;
    message: string;
  };
  isSubmitting: boolean;
  onFieldChange: (field: string, value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
}

export function ContactForm({ formData, isSubmitting, onFieldChange, onSubmit }: ContactFormProps) {
  const { t } = useTranslation();

  return (
    <div className="bg-gray-50 rounded-2xl p-8">
      <div className="flex items-center gap-3 mb-6">
        <Send className="w-6 h-6 text-sky-600" />
        <h2 className="text-2xl font-bold text-gray-900">{t('contact.form.title')}</h2>
      </div>

      <form onSubmit={onSubmit} className="space-y-6">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
            {t('contact.form.fullName')} *
          </label>
          <Input
            id="name"
            name="name"
            type="text"
            required
            value={formData.name}
            onChange={(e) => onFieldChange('name', e.target.value)}
            placeholder={t('contact.form.placeholder.name')}
            className="w-full"
          />
        </div>

        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
            {t('contact.form.email')} *
          </label>
          <Input
            id="email"
            name="email"
            type="email"
            required
            value={formData.email}
            onChange={(e) => onFieldChange('email', e.target.value)}
            placeholder={t('contact.form.placeholder.email')}
            className="w-full"
          />
        </div>

        <div>
          <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-2">
            {t('contact.form.subject')} *
          </label>
          <Input
            id="subject"
            name="subject"
            type="text"
            required
            value={formData.subject}
            onChange={(e) => onFieldChange('subject', e.target.value)}
            placeholder={t('contact.form.placeholder.subject')}
            className="w-full"
          />
        </div>

        <div>
          <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
            {t('contact.form.message')} *
          </label>
          <Textarea
            id="message"
            name="message"
            required
            value={formData.message}
            onChange={(e) => onFieldChange('message', e.target.value)}
            placeholder={t('contact.form.placeholder.message')}
            rows={6}
            className="w-full"
          />
        </div>

        <Button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-sky-500 hover:bg-sky-600 text-white"
        >
          {isSubmitting ? (
            t('contact.form.sending')
          ) : (
            <>
              <Send className="w-4 h-4 mr-2" />
              {t('contact.form.sendMessage')}
            </>
          )}
        </Button>
      </form>
    </div>
  );
}
