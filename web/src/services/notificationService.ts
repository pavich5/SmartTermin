import { apiRequest } from './apiClient';
import { getFcmToken, onMessageListener } from '../config/firebase';

export interface NotificationPayload {
  title: string;
  body: string;
  data?: Record<string, string>;
}

/**
 * Register the FCM token with the backend
 */
export async function registerFcmToken(token: string): Promise<void> {
  try {
    if (!token || token.trim().length === 0) {
      throw new Error('FCM token is empty');
    }
    
    
    try {
      await apiRequest('/notifications/register-token', {
        method: 'POST',
        body: { fcmToken: token },
      });
    } catch (apiError: any) {
      console.error('❌ API error registering FCM token:', apiError);
      console.error('Error details:', {
        status: apiError?.status,
        message: apiError?.message,
        details: apiError?.details,
      });
      
      // Provide more specific error messages
      if (apiError?.status === 401) {
        throw new Error('Authentication required. Please log in again.');
      } else if (apiError?.status === 400) {
        throw new Error(apiError?.message || 'Invalid request. Please check your token.');
      } else if (apiError?.status === 500) {
        throw new Error('Server error. Please try again later.');
      } else {
        throw new Error(apiError?.message || 'Failed to register notification token.');
      }
    }
  } catch (error) {
    console.error('❌ Failed to register FCM token:', error);
    throw error;
  }
}

/**
 * Unregister the FCM token from the backend
 */
export async function unregisterFcmToken(): Promise<void> {
  try {
    await apiRequest('/notifications/unregister-token', {
      method: 'DELETE',
    });
  } catch (error) {
    console.error('Failed to unregister FCM token:', error);
    throw error;
  }
}

/**
 * Initialize notifications and register token
 * This should only be called during login/signup
 * Returns null if permission is not granted (this is expected and not an error)
 */
export async function initializeNotifications(): Promise<string | null> {
  try {
    
    // Check if Firebase is configured
    const firebaseConfig = {
      apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
      projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
      vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY,
    };
    
  
    
    if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
      console.error('❌ Firebase configuration is incomplete. Cannot initialize notifications.');
      console.error('Missing:', {
        apiKey: !firebaseConfig.apiKey,
        projectId: !firebaseConfig.projectId,
      });
      return null;
    }
    
    if (!firebaseConfig.vapidKey) {
      console.error('❌ VAPID key is missing. Cannot generate FCM token.');
      console.error('Please set VITE_FIREBASE_VAPID_KEY in your .env file');
      return null;
    }
    
    const token = await getFcmToken();
    
    if (token) {
      await registerFcmToken(token);
      return token;
    } else {
      console.warn('⚠️ No FCM token obtained. This might be because:');
      console.warn('  - Notification permission not granted');
      console.warn('  - Firebase Messaging not supported');
      console.warn('  - Service worker not registered');
      // Permission not granted - this is normal, not an error
      return null;
    }
  } catch (error: any) {
    console.error('❌ Failed to initialize notifications:', error);
    console.error('Error details:', {
      message: error?.message,
      code: error?.code,
      status: error?.status,
      details: error?.details,
      stack: error?.stack,
    });
    
    // Re-throw the error so the caller can handle it properly
    // This allows the modal to show the actual error message
    throw error;
  }
}

/**
 * Set up message listener for foreground notifications
 */
export function setupNotificationListener(
  onNotification: (payload: NotificationPayload) => void
): void {
  onMessageListener()
    .then((payload: any) => {
      if (payload?.notification) {
        onNotification({
          title: payload.notification.title || '',
          body: payload.notification.body || '',
          data: payload.data,
        });
      }
    })
    .catch((error) => {
      console.error('Error in notification listener:', error);
    });
}

/**
 * Send a test notification to the current user
 */
export async function sendTestNotification(): Promise<void> {
  try {
    await apiRequest('/notifications/test', {
      method: 'POST',
    });
  } catch (error) {
    console.error('Failed to send test notification:', error);
    throw error;
  }
}

