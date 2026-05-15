import { ApiError } from '../services/apiClient';

export function getErrorMessageKey(error: unknown): string {
  if (error && typeof error === 'object' && 'status' in error) {
    const apiError = error as ApiError;
    const status = apiError.status;

    switch (status) {
      case 401:
        return 'errors.unauthorized';
      case 403:
        return 'errors.forbidden';
      case 404:
        return 'errors.notFound';
      case 400:
        return 'errors.badRequest';
      case 500:
        return 'errors.serverError';
      case 502:
      case 503:
      case 504:
        return 'errors.serviceUnavailable';
      default:
        return 'errors.generic';
    }
  }

  if (error instanceof Error && error.message) {
    if (error.message.startsWith('Request failed with status')) {
      const statusMatch = error.message.match(/status (\d+)/);
      if (statusMatch) {
        const status = parseInt(statusMatch[1], 10);
        switch (status) {
          case 401:
            return 'errors.unauthorized';
          case 403:
            return 'errors.forbidden';
          case 404:
            return 'errors.notFound';
          case 400:
            return 'errors.badRequest';
          case 500:
            return 'errors.serverError';
          default:
            return 'errors.generic';
        }
      }
    }
  }

  return 'errors.generic';
}






