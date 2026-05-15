import React, { useState } from 'react';
import { useTranslation } from '../../../hooks/useTranslation';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { Label } from '../../ui/label';
import { Modal } from './Modal';
import { toast } from 'sonner';
import { createSalon } from '../../../services/salonService';
import { useAuth } from '../../../contexts/AuthContext';

interface CreateSalonModalProps {
  show: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function CreateSalonModal({ show, onClose, onSuccess }: CreateSalonModalProps) {
  const { t } = useTranslation();
  const { refreshUser } = useAuth();
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [country, setCountry] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [about, setAbout] = useState('');
  const [customBookingLink, setCustomBookingLink] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<{
    name?: string;
    address?: string;
    city?: string;
    country?: string;
  }>({});

  const validate = (): boolean => {
    const newErrors: { name?: string; address?: string; city?: string; country?: string } = {};

    if (!name.trim()) {
      newErrors.name = t('enterprise.createSalon.nameRequired') || 'Salon name is required';
    }

    if (!address.trim()) {
      newErrors.address = t('enterprise.createSalon.addressRequired') || 'Address is required';
    }

    if (!city.trim()) {
      newErrors.city = t('enterprise.createSalon.cityRequired') || 'City is required';
    }

    if (!country.trim()) {
      newErrors.country = t('enterprise.createSalon.countryRequired') || 'Country is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    setIsSubmitting(true);
    try {
      await createSalon({
        name: name.trim(),
        address: address.trim(),
        city: city.trim(),
        country: country.trim(),
        phone: phone.trim() || undefined,
        email: email.trim() || undefined,
        about: about.trim() || undefined,
        customBookingLink: customBookingLink.trim() || undefined,
      });

      toast.success(t('enterprise.createSalon.success') || 'Salon created successfully!');
      await refreshUser();
      onSuccess();
      handleClose();
    } catch (error: any) {
      console.error('Failed to create salon', error);
      const errorMessage =
        error?.message ||
        t('enterprise.createSalon.error') ||
        'Failed to create salon. Please try again.';
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setName('');
    setAddress('');
    setCity('');
    setCountry('');
    setPhone('');
    setEmail('');
    setAbout('');
    setCustomBookingLink('');
    setErrors({});
    onClose();
  };

  return (
    <Modal
      show={show}
      onClose={handleClose}
      title={t('enterprise.createSalon.title') || 'Create Salon'}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label htmlFor="name">{t('enterprise.createSalon.name') || 'Salon Name'} *</Label>
          <Input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t('enterprise.createSalon.namePlaceholder') || 'Enter salon name'}
            className={errors.name ? 'border-red-500' : ''}
          />
          {errors.name && <p className="text-sm text-red-500 mt-1">{errors.name}</p>}
        </div>

        <div>
          <Label htmlFor="address">{t('enterprise.createSalon.address') || 'Address'} *</Label>
          <Input
            id="address"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder={t('enterprise.createSalon.addressPlaceholder') || 'Enter address'}
            className={errors.address ? 'border-red-500' : ''}
          />
          {errors.address && <p className="text-sm text-red-500 mt-1">{errors.address}</p>}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="city">{t('enterprise.createSalon.city') || 'City'} *</Label>
            <Input
              id="city"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder={t('enterprise.createSalon.cityPlaceholder') || 'Enter city'}
              className={errors.city ? 'border-red-500' : ''}
            />
            {errors.city && <p className="text-sm text-red-500 mt-1">{errors.city}</p>}
          </div>

          <div>
            <Label htmlFor="country">{t('enterprise.createSalon.country') || 'Country'} *</Label>
            <Input
              id="country"
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              placeholder={t('enterprise.createSalon.countryPlaceholder') || 'Enter country'}
              className={errors.country ? 'border-red-500' : ''}
            />
            {errors.country && <p className="text-sm text-red-500 mt-1">{errors.country}</p>}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="phone">{t('enterprise.createSalon.phone') || 'Phone'}</Label>
            <Input
              id="phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder={t('enterprise.createSalon.phonePlaceholder') || 'Enter phone number'}
            />
          </div>

          <div>
            <Label htmlFor="email">{t('enterprise.createSalon.email') || 'Email'}</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t('enterprise.createSalon.emailPlaceholder') || 'Enter email'}
            />
          </div>
        </div>

        <div>
          <Label htmlFor="about">{t('enterprise.createSalon.about') || 'About'}</Label>
          <textarea
            id="about"
            value={about}
            onChange={(e) => setAbout(e.target.value)}
            placeholder={
              t('enterprise.createSalon.aboutPlaceholder') || 'Tell us about your salon...'
            }
            rows={4}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent resize-none"
          />
        </div>

        <div>
          <Label htmlFor="customBookingLink">
            {t('enterprise.createSalon.customBookingLink') || 'Custom Booking Link'}
          </Label>
          <div className="flex items-center gap-2">
            <span className="text-gray-500 text-sm">smartermin.com/</span>
            <Input
              id="customBookingLink"
              type="text"
              value={customBookingLink}
              onChange={(e) => {
                // Only allow lowercase letters, numbers, and hyphens
                const value = e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '');
                setCustomBookingLink(value);
              }}
              placeholder={t('enterprise.createSalon.customBookingLinkPlaceholder') || 'your-custom-link'}
              className="flex-1"
            />
          </div>
          <p className="text-sm text-gray-500 mt-1">
            {t('enterprise.createSalon.customBookingLinkHint') ||
              'Create a unique URL for your booking page'}
          </p>
        </div>

        <div className="flex gap-3 pt-4">
          <Button
            type="submit"
            disabled={isSubmitting}
            className="flex-1 bg-sky-500 hover:bg-sky-600"
          >
            {isSubmitting
              ? t('enterprise.createSalon.creating') || 'Creating...'
              : t('enterprise.createSalon.create') || 'Create Salon'}
          </Button>
          <Button type="button" onClick={handleClose} variant="outline" className="flex-1">
            {t('modals.common.cancel') || 'Cancel'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
