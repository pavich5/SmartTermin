import React from 'react';
import { Mail, Phone, UserPlus, Crown } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { useTranslation } from '../../hooks/useTranslation';

interface InviteFormProps {
  method: 'email' | 'phone';
  contact: string;
  role: 'owner' | 'artist';
  message: string;
  loading: boolean;
  onMethodChange: (method: 'email' | 'phone') => void;
  onContactChange: (contact: string) => void;
  onRoleChange: (role: 'owner' | 'artist') => void;
  onMessageChange: (message: string) => void;
  onSubmit: () => void;
  formatPhoneNumberDisplay?: (phone: string) => string;
  formatPhoneNumber?: (phone: string) => string;
}

export function InviteForm({
  method,
  contact,
  role,
  message,
  loading,
  onMethodChange,
  onContactChange,
  onRoleChange,
  onMessageChange,
  onSubmit,
  formatPhoneNumberDisplay,
  formatPhoneNumber,
}: InviteFormProps) {
  const { t } = useTranslation();
  return (
    <div className="bg-white border border-gray-100 rounded-2xl shadow-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900">{t('enterprise.team.inviteNewMember')}</h2>
      </div>
      <div className="grid md:grid-cols-5 gap-4">
        <div className="md:col-span-2">
          <Label className="mb-2 block text-sm text-gray-700">{t('enterprise.team.contactMethod')}</Label>
          <div className="flex gap-2">
            <Button
              onClick={() => onMethodChange('email')}
              size="sm"
              variant="outline"
              className={`flex-1 rounded-lg ${
                method === 'email'
                  ? 'border-blue-500 text-blue-600 bg-blue-50'
                  : 'border-gray-200 text-gray-700'
              }`}
            >
              <Mail size={16} className="mr-2" />
              {t('enterprise.team.email')}
            </Button>
            <Button
              onClick={() => onMethodChange('phone')}
              size="sm"
              variant="outline"
              className={`flex-1 rounded-lg ${
                method === 'phone'
                  ? 'border-blue-500 text-blue-600 bg-blue-50'
                  : 'border-gray-200 text-gray-700'
              }`}
            >
              <Phone size={16} className="mr-2" />
              {t('enterprise.team.phone')}
            </Button>
          </div>
        </div>
        <div className="md:col-span-2">
          <Label className="mb-2 block text-sm text-gray-700">
            {method === 'email' ? t('enterprise.team.emailAddress') : t('enterprise.team.phoneNumber')}
          </Label>
          {method === 'phone' && formatPhoneNumberDisplay && formatPhoneNumber ? (
            <Input
              value={formatPhoneNumberDisplay(contact)}
              onChange={(e) => {
                const cleaned = e.target.value.replace(/\s/g, '');
                if (cleaned.length < 5) {
                  onContactChange('+389');
                  return;
                }
                const formatted = formatPhoneNumber(cleaned);
                onContactChange(formatted);
              }}
              onKeyDown={(e) => {
                const input = e.currentTarget;
                const cursorPosition = input.selectionStart || 0;
                const selectionEnd = input.selectionEnd || 0;

                if (e.key === 'Backspace' && cursorPosition > 0 && cursorPosition <= 5) {
                  if (selectionEnd <= 5) {
                    e.preventDefault();
                  }
                } else if (e.key === 'Delete' && cursorPosition < 5) {
                  e.preventDefault();
                }
              }}
              placeholder="+389 70 123 456"
              className="text-gray-900 placeholder:text-gray-400"
            />
          ) : (
            <Input
              value={contact}
              onChange={(e) => onContactChange(e.target.value)}
              placeholder={method === 'email' ? 'name@email.com' : '+389 70 123 456'}
              className="text-gray-900 placeholder:text-gray-400"
            />
          )}
        </div>
        <div className="md:col-span-1">
          <Label className="mb-2 block text-sm text-gray-700">{t('enterprise.team.role')}</Label>
          <div className="flex gap-2">
            <Button
              onClick={() => onRoleChange('artist')}
              size="sm"
              variant="outline"
              className={`flex-1 rounded-lg ${
                role === 'artist'
                  ? 'bg-sky-500 text-white border-sky-500'
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
              }`}
            >
              {t('enterprise.team.artist')}
            </Button>
            <Button
              onClick={() => onRoleChange('owner')}
              size="sm"
              variant="outline"
              className={`flex-1 rounded-lg ${
                role === 'owner'
                  ? 'bg-sky-500 text-white border-sky-500'
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
              }`}
            >
              <Crown size={14} className="mr-1" />
              {t('enterprise.team.owner')}
            </Button>
          </div>
        </div>
      </div>
      <div className="mt-4 flex gap-3">
        <Input
          value={message}
          onChange={(e) => onMessageChange(e.target.value)}
          placeholder={t('enterprise.team.customMessage')}
          className="flex-1 text-gray-900 placeholder:text-gray-400"
        />
        <Button
          disabled={loading || !contact}
          onClick={onSubmit}
          className="px-6 py-2 rounded-lg font-semibold shadow-lg hover:shadow-xl whitespace-nowrap bg-sky-500 hover:bg-sky-600 text-white border-none"
        >
          <UserPlus size={18} className="mr-2" />
          {t('enterprise.team.sendInvite')}
        </Button>
      </div>
    </div>
  );
}
