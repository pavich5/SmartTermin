import React, { useState } from 'react';
import { AlertTriangle, Calendar, Trash2 } from 'lucide-react';
import { ProfileSettings } from './settings/ProfileSettings';
import { BusinessSettings } from './settings/BusinessSettings';
import { BookingSettings } from './settings/BookingSettings';
import { WorkingHours } from './settings/WorkingHours';
import { HolidaysModal } from './modals/HolidaysModal';
import { SalonHolidaysModal } from './modals/SalonHolidaysModal';
import { HolidaysSection } from './settings/HolidaysSection';
import { SalonHolidaysSection } from './settings/SalonHolidaysSection';
import { DeleteAccountModal } from './modals/DeleteAccountModal';
import { useAuth } from '../../contexts/AuthContext';
import { useTranslation } from '../../hooks/useTranslation';
import { Holiday } from '../../services/settingsService';
import { toast } from 'sonner';
import { Button } from '../ui/button';

export interface Break {
  start: string;
  end: string;
}

interface DayHours {
  start: string;
  end: string;
  closed: boolean;
  breaks?: Break[];
}

interface SettingsViewProps {
  profileFullName: string;
  profileEmail: string;
  profilePhone: string;
  profileBusinessName: string;
  profileBio: string;
  onProfileFullNameChange: (value: string) => void;
  onProfileEmailChange: (value: string) => void;
  onProfilePhoneChange: (value: string) => void;
  onProfileBusinessNameChange: (value: string) => void;
  onProfileBioChange: (value: string) => void;
  onProfileSave: () => void;
  isSavingProfile?: boolean;
  businessAddress: string;
  businessCity: string;
  businessCountry: string;
  onBusinessAddressChange: (value: string) => void;
  onBusinessCityChange: (value: string) => void;
  onBusinessCountryChange: (value: string) => void;
  onBusinessSave: () => void;
  isSavingBusiness?: boolean;
  salonName?: string;
  salonBio?: string;
  onSalonNameChange?: (value: string) => void;
  onSalonBioChange?: (value: string) => void;
  onSalonNameSave?: () => void;
  isSavingSalonName?: boolean;
  customBookingLink?: string;
  onCustomBookingLinkChange?: (value: string) => void;
  onCustomBookingLinkSave?: () => void;
  isSavingCustomBookingLink?: boolean;
  maxCancellationHours: number;
  onMaxCancellationHoursChange: (value: number | null) => void;
  onCancellationTimeSave: () => void;
  isSavingCancellationTime?: boolean;
  workingHours: {
    monday: DayHours;
    tuesday: DayHours;
    wednesday: DayHours;
    thursday: DayHours;
    friday: DayHours;
    saturday: DayHours;
    sunday: DayHours;
  };
  onWorkingHoursChange: (day: string, field: keyof DayHours, value: string | boolean) => void;
  onBreakAdd: (day: string, breakData: { start: string; end: string }) => void;
  onBreakAddToAll: (breakData: { start: string; end: string }) => void;
  onBreakRemove: (day: string, breakIndex: number) => void;
  onBreakChange: (day: string, breakIndex: number, field: 'start' | 'end', value: string) => void;
  onWorkingHoursSave: () => void;
  isSavingWorkingHours?: boolean;
  isOwnerAlsoArtist?: boolean;
  onOwnerAlsoArtistChange?: (value: boolean) => void;
  salonMembers?: Array<{ role: 'owner' | 'artist' }>; // Salon members to check if owner is the only artist
  hideBusinessSettings?: boolean;
  mockHolidays?: Holiday[]; // For demo mode
  isDemoMode?: boolean; // Flag to disable API calls in demo mode
  onDeleteAccount?: () => void; // Handler for account deletion
  artistId?: string; // Artist ID for account deletion
}

export function SettingsView({
  profileFullName,
  profileEmail,
  profilePhone,
  profileBusinessName,
  profileBio,
  onProfileFullNameChange,
  onProfileEmailChange,
  onProfilePhoneChange,
  onProfileBusinessNameChange,
  onProfileBioChange,
  onProfileSave,
  isSavingProfile = false,
  businessAddress,
  businessCity,
  businessCountry,
  onBusinessAddressChange,
  onBusinessCityChange,
  onBusinessCountryChange,
  onBusinessSave,
  isSavingBusiness = false,
  salonName,
  salonBio,
  onSalonNameChange,
  onSalonBioChange,
  onSalonNameSave,
  isSavingSalonName = false,
  customBookingLink,
  onCustomBookingLinkChange,
  onCustomBookingLinkSave,
  isSavingCustomBookingLink = false,
  maxCancellationHours,
  onMaxCancellationHoursChange,
  onCancellationTimeSave,
  isSavingCancellationTime = false,
  workingHours,
  onWorkingHoursChange,
  onBreakAdd,
  onBreakAddToAll,
  onBreakRemove,
  onBreakChange,
  onWorkingHoursSave,
  isSavingWorkingHours = false,
  isOwnerAlsoArtist,
  onOwnerAlsoArtistChange,
  salonMembers = [],
  hideBusinessSettings = false,
  mockHolidays,
  isDemoMode = false,
  onDeleteAccount,
  artistId,
}: SettingsViewProps) {
  const { user } = useAuth();
  const { t } = useTranslation();
  const isSalonOwner = user?.salonRole === 'owner';
  const isSalonMember = user?.salonId && user?.salonRole === 'artist';
  const [showHolidaysModal, setShowHolidaysModal] = useState(false);
  const [showSalonHolidaysModal, setShowSalonHolidaysModal] = useState(false);
  const [showDeleteAccountModal, setShowDeleteAccountModal] = useState(false);
  const [holidaysRefreshKey, setHolidaysRefreshKey] = useState(0);
  const [salonHolidaysRefreshKey, setSalonHolidaysRefreshKey] = useState(0);

  const otherArtistsCount = salonMembers.filter(m => m.role === 'artist').length;
  const isOwnerOnlyArtist = isOwnerAlsoArtist === true && otherArtistsCount === 0;

  return (
    <div className="space-y-6 w-full">
      {isSalonOwner && customBookingLink !== undefined && onCustomBookingLinkChange && onCustomBookingLinkSave && (
        <div className="bg-white rounded-2xl shadow-lg p-6 w-full">
          <h2 className="text-xl sm:text-2xl mb-6">{t('enterprise.dashboard.customBookingLink') || 'Custom Booking Link'}</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('enterprise.dashboard.customBookingLinkLabel') || 'Custom Booking Link'}
              </label>
              <input
                type="text"
                value={customBookingLink}
                onChange={(e) => onCustomBookingLinkChange(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                placeholder={t('enterprise.dashboard.customBookingLinkPlaceholder') || 'your-custom-link'}
              />
              <p className="text-sm text-gray-500 mt-2">
                {t('enterprise.dashboard.customBookingLinkHint') || 'Create a unique URL for your booking page (smartermin.com/your-custom-link)'}
              </p>
            </div>
            <button
              onClick={onCustomBookingLinkSave}
              disabled={isSavingCustomBookingLink}
              className="px-6 py-2 bg-sky-500 text-white rounded-lg hover:bg-sky-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSavingCustomBookingLink ? t('modals.common.processing') || 'Processing...' : t('enterprise.dashboard.save') || 'Save'}
            </button>
          </div>
        </div>
      )}
      {!isSalonOwner && (
        <ProfileSettings
          fullName={profileFullName}
          email={profileEmail}
          phone={profilePhone}
          businessName={profileBusinessName}
          bio={profileBio}
          onFullNameChange={onProfileFullNameChange}
          onEmailChange={onProfileEmailChange}
          onPhoneChange={onProfilePhoneChange}
          onBusinessNameChange={onProfileBusinessNameChange}
          onBioChange={onProfileBioChange}
          onSave={onProfileSave}
          isLoading={isSavingProfile}
        />
      )}
      {}
      {!hideBusinessSettings && !isSalonMember && (
        <BusinessSettings
          address={businessAddress}
          city={businessCity}
          country={businessCountry}
          onAddressChange={onBusinessAddressChange}
          onCityChange={onBusinessCityChange}
          onCountryChange={onBusinessCountryChange}
          onSave={onBusinessSave}
          isLoading={isSavingBusiness}
          salonName={isSalonOwner ? salonName : undefined}
          salonBio={isSalonOwner ? salonBio : undefined}
          onSalonNameChange={isSalonOwner ? onSalonNameChange : undefined}
          onSalonBioChange={isSalonOwner ? onSalonBioChange : undefined}
        />
      )}
      <WorkingHours
        workingHours={workingHours}
        onWorkingHoursChange={onWorkingHoursChange}
        onBreakAdd={onBreakAdd}
        onBreakAddToAll={onBreakAddToAll}
        onBreakRemove={onBreakRemove}
        onBreakChange={onBreakChange}
        onSave={onWorkingHoursSave}
        isLoading={isSavingWorkingHours}
        enterpriseStyle={isSalonOwner}
      />
      {!isSalonOwner && (
        <HolidaysSection
          key={holidaysRefreshKey}
          mockHolidays={mockHolidays}
          isDemoMode={isDemoMode}
          onHolidayDeleted={() => {
            setHolidaysRefreshKey((prev) => prev + 1);
          }}
          onAddClick={() => setShowHolidaysModal(true)}
        />
      )}
      {isSalonOwner && (
        <SalonHolidaysSection
          key={salonHolidaysRefreshKey}
          onHolidayDeleted={() => {
            setSalonHolidaysRefreshKey((prev) => prev + 1);
          }}
          onAddClick={() => setShowSalonHolidaysModal(true)}
        />
      )}
      {!isSalonOwner && (
        <BookingSettings
          maxCancellationHours={maxCancellationHours}
          onMaxCancellationHoursChange={onMaxCancellationHoursChange}
          onSave={onCancellationTimeSave}
          isLoading={isSavingCancellationTime}
        />
      )}
      {isSalonOwner && onOwnerAlsoArtistChange !== undefined && (
        <div className="bg-white rounded-2xl shadow-lg p-6 w-full">
          <h2 className="text-xl sm:text-2xl mb-6">{t('settings.salonRole.title')}</h2>
          <div className="flex items-center justify-between p-4 border border-gray-200 rounded-xl">
            <div>
              <div className="font-semibold text-gray-900 mb-1">
                {t('settings.salonRole.alsoArtist')}
              </div>
              <div className="text-sm text-gray-600">
                {isOwnerAlsoArtist === true
                  ? t('settings.salonRole.alsoArtistDesc')
                  : t('settings.salonRole.onlyOwnerDesc')}
              </div>
            </div>
            <label 
              className={`relative inline-flex items-center ${isOwnerOnlyArtist ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}
              onClick={(e) => {
                if (isOwnerOnlyArtist) {
                  e.preventDefault();
                  toast.error(
                    t('enterprise.dashboard.cannotDisableOwnerArtist') || 
                    'You are the only artist in this salon. You cannot disable this feature as it would leave the salon with no artists.'
                  );
                }
              }}
            >
              <input
                type="checkbox"
                checked={Boolean(isOwnerAlsoArtist)}
                onChange={(e) => {
                  if (!isOwnerOnlyArtist) {
                    onOwnerAlsoArtistChange(e.target.checked);
                  } else {
                    e.preventDefault();
                    toast.error(
                      t('enterprise.dashboard.cannotDisableOwnerArtist') || 
                      'You are the only artist in this salon. You cannot disable this feature as it would leave the salon with no artists.'
                    );
                  }
                }}
                disabled={isOwnerOnlyArtist}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-sky-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-sky-500 peer-disabled:opacity-60"></div>
            </label>
          </div>
        </div>
      )}
      
      {!isSalonOwner && (
        <HolidaysModal
          show={showHolidaysModal}
          onClose={() => setShowHolidaysModal(false)}
          onHolidayAdded={() => {
            setHolidaysRefreshKey((prev) => prev + 1);
          }}
          existingHolidays={mockHolidays || []}
          isDemoMode={isDemoMode}
        />
      )}
      
      {isSalonOwner && (
        <SalonHolidaysModal
          show={showSalonHolidaysModal}
          onClose={() => setShowSalonHolidaysModal(false)}
          onHolidayAdded={() => {
            setSalonHolidaysRefreshKey((prev) => prev + 1);
          }}
          existingHolidays={[]}
        />
      )}

      {/* Delete Account Modal */}
      {!isSalonOwner && onDeleteAccount && (
        <DeleteAccountModal
          show={showDeleteAccountModal}
          onClose={() => setShowDeleteAccountModal(false)}
          onConfirm={() => {
            setShowDeleteAccountModal(false);
            onDeleteAccount();
          }}
        />
      )}

      {/* Delete Account Section - Only for artists (not salon owners) */}
      {!isSalonOwner && onDeleteAccount && artistId && (
        <div className="bg-white rounded-2xl shadow-lg p-6 w-full border-2 border-red-100">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                <Trash2 className="w-6 h-6 text-red-600" />
              </div>
            </div>
            <div className="flex-1">
              <h2 className="text-xl sm:text-2xl mb-2 text-red-900 font-bold">
                {t('settings.deleteAccount.title') || 'Delete Account'}
              </h2>
              <p className="text-sm text-gray-600 mb-4">
                {t('settings.deleteAccount.description') || 'Once you delete your account, there is no going back. All your data, bookings, and services will be permanently deleted. Upcoming appointments will be cancelled and clients will be notified.'}
              </p>
              <Button
                type="button"
                onClick={() => setShowDeleteAccountModal(true)}
                variant="destructive"
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                <Trash2 size={18} className="mr-2" />
                {t('settings.deleteAccount.button') || 'Delete My Account'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
