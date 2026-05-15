// Firebase Cloud Messaging Service Worker
// This file must be in the public folder to be accessible at the root URL

importScripts('https://www.gstatic.com/firebasejs/10.13.2/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.13.2/firebase-messaging-compat.js');

// Firebase configuration - replace these placeholder values for your deployment
const firebaseConfig = {
  apiKey: 'REPLACE_WITH_FIREBASE_API_KEY',
  authDomain: 'your-project.firebaseapp.com',
  projectId: 'REPLACE_WITH_FIREBASE_PROJECT_ID',
  storageBucket: 'your-project.appspot.com',
  messagingSenderId: 'REPLACE_WITH_FIREBASE_MESSAGING_SENDER_ID',
  appId: 'REPLACE_WITH_FIREBASE_APP_ID',
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Retrieve an instance of Firebase Messaging
const messaging = firebase.messaging();

// Handle background messages
messaging.onBackgroundMessage((payload) => {
  
  // Extract notification data
  const notificationTitle = payload.notification?.title || payload.data?.title || 'SmartTermin';
  const notificationBody = payload.notification?.body || payload.data?.body || '';
  
  const notificationOptions = {
    body: notificationBody,
    icon: '/icon-192x192.png', // App icon
    badge: '/badge-72x72.png', // Badge icon
    data: payload.data || {},
    tag: payload.data?.tag || 'smarttermin-notification',
    requireInteraction: false,
    // iOS Safari specific options
    silent: false,
    vibrate: [200, 100, 200],
    timestamp: Date.now(),
    // Add actions for better iOS support
    actions: [
      {
        action: 'open',
        title: 'Open App'
      }
    ]
  };

  
  return self.registration.showNotification(notificationTitle, notificationOptions);
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  
  event.notification.close();

  // Handle the click action
  if (event.notification.data && event.notification.data.url) {
    event.waitUntil(
      clients.openWindow(event.notification.data.url)
    );
  } else {
    // Default: open the app
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});
