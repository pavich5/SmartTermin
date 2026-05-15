import React, { useState, useEffect } from 'react';
import { Bell, X } from 'lucide-react';
import { Button } from './ui/button';
import { useAuth } from '../contexts/AuthContext';
import { requestNotificationPermission } from '../config/firebase';
import { initializeNotifications } from '../services/notificationService';
import { toast } from 'sonner';

const DISMISSED_KEY = 'notification_permission_dismissed';

// Detect Safari on iOS
const isSafariIOS = () => {
  if (typeof window === 'undefined') return false;
  const ua = window.navigator.userAgent;
  const isIOS = /iPad|iPhone|iPod/.test(ua);
  const isSafari = /Safari/.test(ua) && !/Chrome|CriOS|FxiOS/.test(ua);
  return isIOS && isSafari;
};

// Check if app is running in standalone mode (added to home screen)
const isStandalone = () => {
  if (typeof window === 'undefined') return false;
  return (window.navigator as any).standalone === true || 
         window.matchMedia('(display-mode: standalone)').matches;
};

export function NotificationPermissionPrompt() {
  const { isAuthenticated } = useAuth();
  const [show, setShow] = useState(false);
  const [isRequesting, setIsRequesting] = useState(false);
  const [isSafari, setIsSafari] = useState(false);
  const [isStandaloneMode, setIsStandaloneMode] = useState(false);

  useEffect(() => {
    const safari = isSafariIOS();
    const standalone = isStandalone();
    setIsSafari(safari);
    setIsStandaloneMode(standalone);

    // Only show if user is authenticated
    if (!isAuthenticated) {
      setShow(false);
      return;
    }

    // On Safari iOS, only show if app is in standalone mode (added to home screen)
    if (safari && !standalone) {
      setShow(false);
      return;
    }

    // Check notification permission status
    if (typeof window !== 'undefined' && 'Notification' in window) {
      const permission = Notification.permission;
      
      // If permission is already granted, try to initialize notifications
      // (in case token wasn't registered before)
      if (permission === 'granted') {
        // Silently try to initialize - don't show prompt
        initializeNotifications().catch((error) => {
          console.error('Failed to initialize notifications with granted permission:', error);
        });
        setShow(false);
        return;
      }

      // Check if user has already dismissed this prompt
      const dismissed = localStorage.getItem(DISMISSED_KEY);
      if (dismissed === 'true') {
        setShow(false);
        return;
      }
      
      // Only show if permission is 'default' (not yet requested)
      // Don't show if 'denied' (user explicitly denied)
      if (permission === 'default') {
        setShow(true);
      } else {
        setShow(false);
      }
    } else {
      // Notifications not supported
      setShow(false);
    }
  }, [isAuthenticated]);

  const handleEnableNotifications = async () => {
    setIsRequesting(true);
    
    try {
      // Request permission directly in the click handler (user interaction)
      // This is required for mobile browsers
      const permission = await requestNotificationPermission();
      
      if (permission === 'granted') {
        // Permission granted, now initialize notifications and register token
        const token = await initializeNotifications();
        
        if (token) {
          toast.success('Notifications enabled!', {
            description: 'You will now receive push notifications for bookings and updates.',
          });
          setShow(false);
        } else {
          toast.error('Failed to enable notifications', {
            description: 'Please try again or check your browser settings.',
          });
        }
      } else if (permission === 'denied') {
        toast.info('Notification permission denied', {
          description: 'You can enable notifications later in your browser settings.',
        });
        setShow(false);
        // Mark as dismissed so we don't keep asking
        localStorage.setItem(DISMISSED_KEY, 'true');
      } else {
        // Permission is 'default' - user dismissed the browser prompt
        setShow(false);
      }
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      toast.error('Failed to enable notifications', {
        description: 'Please try again or check your browser settings.',
      });
    } finally {
      setIsRequesting(false);
    }
  };

  const handleDismiss = () => {
    setShow(false);
    // Remember that user dismissed the prompt
    localStorage.setItem(DISMISSED_KEY, 'true');
  };

  if (!show) {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:max-w-md z-50 animate-in slide-in-from-bottom-2">
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-4 flex items-start gap-3">
        <div className="flex-shrink-0 mt-0.5">
          <Bell className="h-5 w-5 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-1">
            Enable Notifications
          </h3>
          {isSafari && !isStandaloneMode ? (
            <p className="text-xs text-gray-600 dark:text-gray-400 mb-3">
              Add this app to your home screen to enable notifications on Safari.
            </p>
          ) : (
            <p className="text-xs text-gray-600 dark:text-gray-400 mb-3">
              Get notified about new bookings, cancellations, and important updates.
            </p>
          )}
          <div className="flex gap-2">
            <Button
              onClick={handleEnableNotifications}
              disabled={isRequesting}
              size="sm"
              className="text-xs h-8"
            >
              {isRequesting ? 'Enabling...' : 'Enable'}
            </Button>
            <Button
              onClick={handleDismiss}
              variant="ghost"
              size="sm"
              className="text-xs h-8"
              disabled={isRequesting}
            >
              Not now
            </Button>
          </div>
        </div>
        <button
          onClick={handleDismiss}
          className="flex-shrink-0 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          disabled={isRequesting}
          aria-label="Dismiss"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

