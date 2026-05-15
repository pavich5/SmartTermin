import { apiRequest, clearStoredAuth, setStoredAuth, getStoredAuth, StoredAuth } from './apiClient';
import { User, UserType } from '../types/user';

export interface LoginResponse {
  token: string;
  user: User;
  isAccountDeactivated?: boolean;
  userId?: string;
}

export interface SignupResponse {
  verificationCodeSent: boolean;
}

export interface VerifyPhoneResponse {
  verified: boolean;
  jwt: string;
  Jwt?: string;
  user: User;
}

export interface UpdateArtistProfileResponse {
  id: string;
  profession: string;
  businessName: string;
  address: string;
  city: string;
  country: string;
  about: string;
  maximumCancellationHours?: number | null;
}

export async function login(phone: string, password: string) {
  const data = await apiRequest<LoginResponse>('/auth/login', {
    method: 'POST',
    body: { phone, password },
    auth: false,
  });

  if (!data.isAccountDeactivated) {
    persistAuth(data);
  }
  return data;
}

export async function signup(
  phone: string,
  password: string,
  fullName: string,
  userType: UserType,
  email?: string,
  dateOfBirth?: string
) {
  return apiRequest<SignupResponse>('/auth/signup', {
    method: 'POST',
    body: { phone, password, fullName, userType, email, dateOfBirth },
    auth: false,
  });
}

export async function verifyPhone(phone: string, code: string) {
  const data = await apiRequest<VerifyPhoneResponse>('/auth/verify-phone', {
    method: 'POST',
    body: { phone, code },
    auth: false,
  });

  const token = data.jwt || data.Jwt;
  if (data.verified && token) {
    persistAuth({ token, user: data.user });
  } else {
    console.error('Verification failed or no JWT token:', {
      verified: data.verified,
      hasJwt: !!token,
    });
  }
  return data;
}

export async function getCurrentUser() {
  return apiRequest<User>('/auth/user_id');
}

export async function updateProfile(updates: Partial<Pick<User, 'fullName' | 'phone' | 'email'>>) {
  return apiRequest<User>('/auth/profile', {
    method: 'PUT',
    // Also supports optional artist fields: businessName, about (bio)
    body: updates as any,
  });
}

export async function requestPhoneChange(newPhone: string) {
  return apiRequest<{ codeSent: boolean; message: string }>('/auth/request-phone-change', {
    method: 'POST',
    body: { phone: newPhone },
  });
}

export async function verifyPhoneChange(newPhone: string, code: string) {
  return apiRequest<User>('/auth/verify-phone-change', {
    method: 'POST',
    body: { phone: newPhone, code },
  });
}

export async function updateArtistProfile(updates: {
  profession?: string;
  businessName?: string;
  address?: string;
  city?: string;
  country?: string;
  about?: string;
  maximumCancellationHours?: number;
  customBookingLink?: string;
}) {
  return apiRequest<UpdateArtistProfileResponse>('/auth/artist-profile', {
    method: 'PUT',
    body: updates,
  });
}

export async function logout() {
  try {
    await apiRequest('/auth/logout', { method: 'POST' });
  } catch (error) {
    console.warn('Logout request failed', error);
  } finally {
    clearStoredAuth();
  }
}

export async function requestPasswordReset(phone: string) {
  return apiRequest('/auth/forgot-password', {
    method: 'POST',
    body: { phone },
    auth: false,
  });
}

export async function verifyResetCode(phone: string, code: string) {
  return apiRequest<{ verified: boolean; resetToken: string }>('/auth/verify-reset-code', {
    method: 'POST',
    body: { phone, code },
    auth: false,
  });
}

export async function resetPassword(phone: string, resetToken: string, newPassword: string) {
  return apiRequest('/auth/reset-password', {
    method: 'POST',
    body: { phone, resetToken, newPassword },
    auth: false,
  });
}

export async function deactivateAccount() {
  return apiRequest<{ message: string }>('/auth/deactivate-account', {
    method: 'POST',
  });
}

export async function reactivateAccount(userId: string) {
  return apiRequest<LoginResponse>('/auth/reactivate-account', {
    method: 'POST',
    body: { userId },
    auth: false,
  });
}

export async function deleteAccountPermanently(userId: string) {
  return apiRequest<{ message: string }>('/auth/delete-account-permanently', {
    method: 'POST',
    body: { userId },
    auth: false,
  });
}

function persistAuth(data: StoredAuth) {
  setStoredAuth(data);
}
