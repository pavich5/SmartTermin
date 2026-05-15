import React, { useState, useEffect } from 'react';
import { Bell } from 'lucide-react';
import { Modal } from '../dashboard/modals/Modal';
import { Button } from '../ui/button';
import { requestNotificationPermission } from '../../config/firebase';
import { initializeNotifications } from '../../services/notificationService';
import { getAuthToken } from '../../services/apiClient';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'sonner';

interface NotificationPermissionModalProps {
  show: boolean;
  onClose: () => void;
  onComplete: () => void;
}

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

export function NotificationPermissionModal({
  show,
  onClose,
  onComplete,
}: NotificationPermissionModalProps) {
  const { isAuthenticated } = useAuth();
  const [isRequesting, setIsRequesting] = useState(false);
  const [isSafari, setIsSafari] = useState(false);
  const [isStandaloneMode, setIsStandaloneMode] = useState(false);

  useEffect(() => {
    setIsSafari(isSafariIOS());
    setIsStandaloneMode(isStandalone());
  }, []);

  const handleEnableNotifications = async () => {
    setIsRequesting(true);
    
    try {
      // Request permission directly in the click handler (user interaction)
      // This is required for mobile browsers (Safari, Chrome)
      const permission = await requestNotificationPermission();
      
      if (permission === 'granted') {
        // Wait a brief moment to ensure auth token is available (in case modal shows immediately after login)
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Check if user is authenticated before trying to register token
        const authToken = getAuthToken();
        if (!authToken || !isAuthenticated) {
          console.error('User not authenticated when trying to register FCM token', {
            hasToken: !!authToken,
            isAuthenticated,
          });
          toast.error('Authentication required', {
            description: 'Please wait a moment and try again, or enable notifications from settings after logging in.',
          });
          onComplete();
          return;
        }

        // Permission granted, now initialize notifications and register token
        try {
         
          const token = await initializeNotifications();
          
          if (token) {
            toast.success('Notifications enabled!', {
              description: 'You will now receive push notifications for bookings and updates.',
            });
            onComplete();
          } else {
            // Check console for detailed error - initializeNotifications logs errors
            toast.error('Failed to enable notifications', {
              description: 'Could not register notification token. Please check the browser console for details.',
            });
            // Still close the modal even if token registration failed
            onComplete();
          }
        } catch (error: any) {
          // Catch and show the actual error from initializeNotifications
          console.error('Error initializing notifications:', error);
          const errorMessage = error?.message || 'Unknown error occurred';
          const statusCode = error?.status;
          
          let userFriendlyMessage = errorMessage;
          if (statusCode === 401) {
            userFriendlyMessage = 'Authentication expired. Please log in again.';
          } else if (statusCode === 400) {
            userFriendlyMessage = 'Invalid request. Please try again.';
          } else if (statusCode === 500) {
            userFriendlyMessage = 'Server error. Please try again later.';
          }
          
          toast.error('Failed to enable notifications', {
            description: userFriendlyMessage,
          });
          onComplete();
        }
      } else if (permission === 'denied') {
        toast.info('Notification permission denied', {
          description: 'You can enable notifications later in your browser settings.',
        });
        onComplete();
      } else {
        // Permission is 'default' - user dismissed the browser prompt
        onComplete();
      }
    } catch (error: any) {
      console.error('Error requesting notification permission:', error);
      const errorMessage = error?.message || 'Unknown error occurred';
      toast.error('Failed to enable notifications', {
        description: errorMessage || 'Please try again or check your browser settings.',
      });
      onComplete();
    } finally {
      setIsRequesting(false);
    }
  };

  const handleSkip = () => {
    onComplete();
  };

  return (
    <Modal show={show} onClose={handleSkip} title="Enable Notifications">
      <div className="space-y-4">
        <div className="flex items-center justify-center mb-4">
          <div className="bg-primary/10 rounded-full p-4">
            <Bell className="h-12 w-12 text-primary" />
          </div>
        </div>

        <div className="text-center space-y-2">
          <h3 className="text-lg font-semibold">Stay Updated</h3>
          {isSafari && !isStandaloneMode ? (
            <div className="space-y-3">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                To enable notifications on Safari, please add this website to your home screen first.
              </p>
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 text-left">
                <p className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-2">
                  How to add to home screen:
                </p>
                <ol className="text-xs text-blue-800 dark:text-blue-200 space-y-1 list-decimal list-inside">
                  <li>Tap the Share button <span className="font-mono">□↗</span> at the bottom</li>
                  <li>Scroll down and tap "Add to Home Screen"</li>
                  <li>Tap "Add" in the top right</li>
                  <li>Open the app from your home screen</li>
                  <li>Then enable notifications when prompted</li>
                </ol>
              </div>
            </div>
          ) : (
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Get notified about new bookings, cancellations, reschedules, and important updates.
            </p>
          )}
        </div>

        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 space-y-2">
          <div className="flex items-start gap-2">
            <span className="text-primary">•</span>
            <span className="text-sm text-gray-700 dark:text-gray-300">
              Instant booking confirmations
            </span>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-primary">•</span>
            <span className="text-sm text-gray-700 dark:text-gray-300">
              Cancellation and reschedule alerts
            </span>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-primary">•</span>
            <span className="text-sm text-gray-700 dark:text-gray-300">
              Important business updates
            </span>
          </div>
        </div>

        <div className="flex gap-3 pt-4">
          <Button
            onClick={handleSkip}
            variant="outline"
            className="flex-1"
            disabled={isRequesting}
          >
            Skip
          </Button>
          {!(isSafari && !isStandaloneMode) && (
            <Button
              onClick={handleEnableNotifications}
              className="flex-1"
              disabled={isRequesting}
            >
              {isRequesting ? 'Enabling...' : 'Enable Notifications'}
            </Button>
          )}
        </div>

        <p className="text-xs text-center text-gray-500 dark:text-gray-400">
          You can change this later in your browser settings
        </p>
      </div>
    </Modal>
  );
}

