import { apiRequest } from './apiClient';

export interface Break {
  start: string;
  end: string;
}

export interface WorkingHoursDay {
  start: string;
  end: string;
  closed: boolean;
  breaks?: Break[];
}

export interface WorkingHoursResponse {
  monday: WorkingHoursDay;
  tuesday: WorkingHoursDay;
  wednesday: WorkingHoursDay;
  thursday: WorkingHoursDay;
  friday: WorkingHoursDay;
  saturday: WorkingHoursDay;
  sunday: WorkingHoursDay;
}

export async function getWorkingHours() {
  return apiRequest<WorkingHoursResponse>('/settings/working-hours');
}

export async function updateWorkingHours(payload: WorkingHoursResponse) {
  return apiRequest<{ success: boolean; workingHours: WorkingHoursResponse }>(
    '/settings/working-hours',
    {
      method: 'PUT',
      body: payload,
    }
  );
}

export interface Holiday {
  id: string;
  holidayDate: string;
  description?: string;
  existingBookingsCount?: number;
}

export interface HolidaysResponse {
  holidays: Holiday[];
}

export interface CreateHolidayRequest {
  holidayDate: string;
  description?: string;
}

export async function getHolidays() {
  return apiRequest<HolidaysResponse>('/settings/holidays');
}

export async function createHoliday(payload: CreateHolidayRequest) {
  return apiRequest<Holiday>('/settings/holidays', {
    method: 'POST',
    body: payload,
  });
}

export async function deleteHoliday(holidayId: string) {
  return apiRequest<{ message: string }>(`/settings/holidays/${holidayId}`, {
    method: 'DELETE',
  });
}

export interface SalonHoliday {
  id: string;
  holidayDate: string;
  description?: string;
  existingBookingsCount?: number;
}

export interface SalonHolidaysResponse {
  holidays: SalonHoliday[];
}

export interface CreateSalonHolidayRequest {
  holidayDate: string;
  description?: string;
}

export async function getSalonHolidays() {
  return apiRequest<SalonHolidaysResponse>('/settings/salon-holidays');
}

export async function createSalonHoliday(payload: CreateSalonHolidayRequest) {
  return apiRequest<SalonHoliday>('/settings/salon-holidays', {
    method: 'POST',
    body: payload,
  });
}

export async function deleteSalonHoliday(holidayId: string) {
  return apiRequest<{ message: string }>(`/settings/salon-holidays/${holidayId}`, {
    method: 'DELETE',
  });
}

export interface ArtistWorkingHours {
  artistId: string;
  artistName: string;
  profileImageUrl?: string | null;
  workingHours: WorkingHoursResponse;
}

export interface SalonArtistsWorkingHoursResponse {
  artists: ArtistWorkingHours[];
}

export async function getSalonArtistsWorkingHours() {
  return apiRequest<SalonArtistsWorkingHoursResponse>('/settings/salon-artists-working-hours');
}
