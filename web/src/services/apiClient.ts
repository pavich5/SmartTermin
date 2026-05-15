import { User } from '../types/user';
import { decryptResponseIfNeeded } from './decryptionService';

const API_BASE_URL =
  (import.meta.env.VITE_API_BASE_URL as string | undefined)?.replace(/\/$/, '') || '/api';
const STORAGE_KEY = 'smarttermin_auth';

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE';

export interface StoredAuth {
  token: string;
  user: User;
}

export interface ApiError extends Error {
  status?: number;
  details?: unknown;
}

interface RequestOptions {
  method?: HttpMethod;
  body?: any;
  headers?: Record<string, string>;
  auth?: boolean;
  signal?: AbortSignal;
}

export function getStoredAuth(): StoredAuth | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as StoredAuth;
  } catch (error) {
    console.error('Failed to parse stored auth', error);
    return null;
  }
}

export function setStoredAuth(auth: StoredAuth) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(auth));
}

export function clearStoredAuth() {
  localStorage.removeItem(STORAGE_KEY);
}

const ONBOARDING_KEY = 'smarttermin_onboarding_completed';

export function getOnboardingCompleted(): boolean {
  try {
    const value = localStorage.getItem(ONBOARDING_KEY);
    return value === 'true';
  } catch (error) {
    console.error('Failed to get onboarding status from localStorage', error);
    return false;
  }
}

export function setOnboardingCompleted(completed: boolean) {
  try {
    localStorage.setItem(ONBOARDING_KEY, String(completed));
  } catch (error) {
    console.error('Failed to set onboarding status in localStorage', error);
  }
}

export function clearOnboardingCompleted() {
  try {
    localStorage.removeItem(ONBOARDING_KEY);
  } catch (error) {
    console.error('Failed to clear onboarding status from localStorage', error);
  }
}

export function getAuthToken() {
  return getStoredAuth()?.token || null;
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, headers, auth = true, signal } = options;
  const url = `${API_BASE_URL}${path.startsWith('/') ? path : `/${path}`}`;

  const requestHeaders: Record<string, string> = headers ? { ...headers } : {};
  const init: RequestInit = { method, headers: requestHeaders, signal };

  const isFormData = typeof FormData !== 'undefined' && body instanceof FormData;

  if (auth) {
    const token = getAuthToken();
    if (!token) {
      console.error('No authentication token available for request to:', path);
      throw new Error('No authentication token available. Please log in again.');
    }
    requestHeaders.Authorization = `Bearer ${token}`;
  }

  if (body !== undefined && body !== null) {
    if (isFormData) {
      init.body = body;
    } else {
      requestHeaders['Content-Type'] = 'application/json';
      init.body = JSON.stringify(body);
    }
  }

  const response = await fetch(url, init);
  const contentType = response.headers.get('content-type');
  const isJson = contentType && contentType.includes('application/json');

  if (!response.ok) {
    let errorMessage = `Request failed with status ${response.status}`;
    let details: unknown;

    if (isJson) {
      try {
        const errorBody = await response.json();
        
        // Decrypt if error response is encrypted (production mode)
        const decryptedErrorBody = await decryptResponseIfNeeded(errorBody);

        errorMessage = decryptedErrorBody.error || decryptedErrorBody.message || errorMessage;
        details = decryptedErrorBody.details;

        const error = new Error(errorMessage) as ApiError & { code?: string };
        error.status = response.status;
        error.details = details;
        error.code = decryptedErrorBody.code;
        throw error;
      } catch (e) {
        if (e instanceof Error) {
          throw e;
        }
      }
    }

    const error = new Error(errorMessage) as ApiError;
    error.status = response.status;
    error.details = details;
    throw error;
  }

  if (response.status === 204) {
    return null as T;
  }

  if (isJson) {
    const jsonData = await response.json();
    // Decrypt if response is encrypted (production mode)
    return await decryptResponseIfNeeded<T>(jsonData);
  }

  return (await response.text()) as unknown as T;
}
