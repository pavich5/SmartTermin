/// <reference types="vite/client" />
import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getMessaging, getToken, onMessage, Messaging, isSupported } from 'firebase/messaging';

// Firebase configuration - Replace with your actual Firebase config
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || '',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || '',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || '',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '',
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || '',
};

// VAPID key for web push notifications
const vapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY || '';

// Validate Firebase configuration
const isFirebaseConfigValid = () => {
  const isValid = !!(
    firebaseConfig.apiKey &&
    firebaseConfig.authDomain &&
    firebaseConfig.projectId &&
    firebaseConfig.storageBucket &&
    firebaseConfig.messagingSenderId &&
    firebaseConfig.appId
  );
  
  if (!isValid) {
    console.error('❌ Firebase configuration is invalid. Missing:', {
      apiKey: !firebaseConfig.apiKey,
      authDomain: !firebaseConfig.authDomain,
      projectId: !firebaseConfig.projectId,
      storageBucket: !firebaseConfig.storageBucket,
      messagingSenderId: !firebaseConfig.messagingSenderId,
      appId: !firebaseConfig.appId,
    });
  }
  
  return isValid;
};

// Initialize Firebase
let app: FirebaseApp;
if (getApps().length === 0) {
  if (!isFirebaseConfigValid()) {
    console.error('Firebase configuration is incomplete. Missing required fields:', {
      apiKey: !!firebaseConfig.apiKey,
      authDomain: !!firebaseConfig.authDomain,
      projectId: !!firebaseConfig.projectId,
      storageBucket: !!firebaseConfig.storageBucket,
      messagingSenderId: !!firebaseConfig.messagingSenderId,
      appId: !!firebaseConfig.appId,
    });
  }
  app = initializeApp(firebaseConfig);
} else {
  app = getApps()[0];
}

// Initialize Firebase Cloud Messaging and get a reference to the service
let messaging: Messaging | null = null;

export const initMessaging = async (): Promise<Messaging | null> => {
  if (typeof window === 'undefined') {
    return null; // Server-side rendering
  }

  const supported = await isSupported();
  if (!supported) {
    console.warn('Firebase Messaging is not supported in this browser');
    return null;
  }

  if (!messaging) {
    try {
      messaging = getMessaging(app);
    } catch (error) {
      console.error('Error initializing Firebase Messaging:', error);
      return null;
    }
  }

  return messaging;
};

export const requestNotificationPermission = async (): Promise<NotificationPermission> => {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'denied';
  }

  if (Notification.permission === 'granted') {
    return 'granted';
  }

  if (Notification.permission === 'denied') {
    return 'denied';
  }

  const permission = await Notification.requestPermission();
  return permission;
};

// Register service worker for Firebase messaging
const registerServiceWorker = async (): Promise<ServiceWorkerRegistration | null> => {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return null;
  }

  try {
    // Check if service worker is already registered
    const existingRegistration = await navigator.serviceWorker.getRegistration('/firebase-messaging-sw.js');
    if (existingRegistration && existingRegistration.active) {
      return existingRegistration;
    }

    // Register the service worker
    const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js', {
      scope: '/',
    });

    // Wait for the service worker to be ready
    await navigator.serviceWorker.ready;

    return registration;
  } catch (error: any) {
    console.error('❌ Failed to register service worker:', error);
    return null;
  }
};

export const getFcmToken = async (): Promise<string | null> => {
  try {
    // Validate configuration first
    if (!isFirebaseConfigValid()) {
      console.error('Cannot get FCM token: Firebase configuration is incomplete');
      return null;
    }
    
    if (!vapidKey) {
      console.error('Cannot get FCM token: VAPID key is missing. Check your .env file.');
      return null;
    }

    // Register service worker first
    const serviceWorkerRegistration = await registerServiceWorker();
    if (!serviceWorkerRegistration || !serviceWorkerRegistration.active) {
      console.error('Cannot get FCM token: Service worker not registered or not active');
      return null;
    }
    
    const messagingInstance = await initMessaging();
    if (!messagingInstance) {
      console.error('Cannot get FCM token: Messaging instance not initialized');
      return null;
    }

    const permission = await requestNotificationPermission();
    if (permission !== 'granted') {
      // Silently fail - permission might be denied or not yet requested
      // User can enable notifications later through browser settings
      if (permission === 'denied') {
        console.info('Notification permission denied. Enable it in browser settings to receive push notifications.');
      } else {
        console.info('Notification permission not granted. You can enable it when prompted.');
      }
      return null;
    }

    // Use the service worker registration for getToken
    const token = await getToken(messagingInstance, { 
      vapidKey,
      serviceWorkerRegistration: serviceWorkerRegistration
    });
    
    if (token) {
      return token;
    } else {
      console.warn('No FCM token available');
      return null;
    }
  } catch (error: any) {
    // Handle service worker registration errors gracefully
    if (error?.code === 'messaging/failed-service-worker-registration') {
      console.warn('Service worker registration failed. Make sure firebase-messaging-sw.js exists in the public folder.');
    } else if (error?.message?.includes('no active Service Worker')) {
      console.error('❌ Service worker is not active. Please refresh the page and try again.');
    } else {
      console.error('Error getting FCM token:', error);
    }
    return null;
  }
};

export const onMessageListener = (): Promise<any> => {
  return new Promise((resolve) => {
    initMessaging().then((messagingInstance) => {
      if (messagingInstance) {
        onMessage(messagingInstance, (payload) => {
          resolve(payload);
        });
      }
    });
  });
};

export { app, messaging };

