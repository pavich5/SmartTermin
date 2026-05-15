import React, { useState, useEffect } from 'react';
import { Bell, Send, RefreshCw, AlertCircle } from 'lucide-react';
import { Button } from '../../ui/button';
import { toast } from 'sonner';
import { sendTestNotification } from '../../../services/notificationService';
import { getFcmToken } from '../../../config/firebase';
import { apiRequest } from '../../../services/apiClient';
import { useTranslation } from '../../../hooks/useTranslation';

export function NotificationSettings() {
  const { t } = useTranslation();
  const [isSending, setIsSending] = useState(false);
  const [tokenStatus, setTokenStatus] = useState<'checking' | 'valid' | 'invalid' | 'missing'>('checking');
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    checkTokenStatus();
  }, []);

  const checkTokenStatus = async () => {
    try {
      const token = await getFcmToken();
      if (token) {
        setTokenStatus('valid');
      } else {
        setTokenStatus('missing');
      }
    } catch (error) {
      console.error('Error checking token:', error);
      setTokenStatus('invalid');
    }
  };

  const handleRefreshToken = async () => {
    setIsRefreshing(true);
    try {
      
      // Check Firebase config
      const hasApiKey = !!import.meta.env.VITE_FIREBASE_API_KEY;
      const hasProjectId = !!import.meta.env.VITE_FIREBASE_PROJECT_ID;
      const hasVapidKey = !!import.meta.env.VITE_FIREBASE_VAPID_KEY;
      
      
      if (!hasApiKey || !hasProjectId || !hasVapidKey) {
        // Silently fail - don't show technical errors to users
        console.error('Firebase configuration missing');
        setTokenStatus('missing');
        return;
      }
      
      // Clear any existing token
      localStorage.removeItem('fcm_token_cache');
      
      // Get a new token
      const token = await getFcmToken();
      
      if (token) {
        // Register the new token manually (this is a manual refresh, not automatic)
        try {
          const data = await apiRequest<{ message: string }>('/notifications/register-token', {
            method: 'POST',
            body: { fcmToken: token },
          });
          toast.success(t('toast.tokenRefreshed'));
          setTokenStatus('valid');
          await checkTokenStatus(); // Refresh status
        } catch (error: any) {
          console.error('❌ Registration failed:', error);
          // Show generic error instead of technical details
          toast.error(t('toast.genericError'), {
            description: t('toast.genericErrorDesc'),
            duration: 5000,
          });
          setTokenStatus('invalid');
        }
      } else {
        console.error('❌ Failed to get FCM token');
        // Show generic error instead of technical details
        toast.error(t('toast.genericError'), {
          description: t('toast.genericErrorDesc'),
          duration: 5000,
        });
        setTokenStatus('missing');
      }
    } catch (error: any) {
      console.error('❌ Error refreshing token:', error);
      // Show generic error instead of technical details
      toast.error(t('toast.genericError'), {
        description: t('toast.genericErrorDesc'),
        duration: 5000,
      });
      setTokenStatus('invalid');
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleTestNotification = async () => {
    setIsSending(true);
    try {
      const data = await apiRequest<{ 
        message: string; 
        requiresTokenRegistration?: boolean;
        tokenInvalid?: boolean;
        tokenUnregistered?: boolean;
      }>('/notifications/test', {
        method: 'POST',
      });

      toast.success(t('toast.testNotificationSent'), {
        description: t('toast.testNotificationSentDesc'),
        duration: 5000,
      });
    } catch (error: any) {
      console.error('Failed to send test notification:', error);
      
      // Try to extract error details from the error object
      const errorDetails = error?.details || {};
      
      // Show generic error instead of technical details
      toast.error(t('toast.genericError'), {
        description: t('toast.genericErrorDesc'),
        duration: 5000,
      });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="space-y-4 p-6 border rounded-lg bg-card">
      <div className="flex items-center gap-2">
        <Bell className="h-5 w-5 text-primary" />
        <h3 className="text-lg font-semibold">Push Notifications</h3>
      </div>
      
      <div className="space-y-3">
        {/* Token Status */}
        <div className="flex items-center gap-2 p-3 rounded-md bg-muted">
          {tokenStatus === 'checking' && (
            <>
              <RefreshCw className="h-4 w-4 animate-spin text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Checking token status...</span>
            </>
          )}
          {tokenStatus === 'valid' && (
            <>
              <Bell className="h-4 w-4 text-green-500" />
              <span className="text-sm text-green-600 dark:text-green-400">FCM token is registered</span>
            </>
          )}
          {tokenStatus === 'invalid' && (
            <>
              <AlertCircle className="h-4 w-4 text-yellow-500" />
              <span className="text-sm text-yellow-600 dark:text-yellow-400">FCM token is invalid</span>
            </>
          )}
          {tokenStatus === 'missing' && (
            <>
              <AlertCircle className="h-4 w-4 text-red-500" />
              <span className="text-sm text-red-600 dark:text-red-400">No FCM token registered</span>
            </>
          )}
        </div>

        <p className="text-sm text-muted-foreground">
          Test your push notification setup. After clicking the button, close or minimize the app to receive the notification.
        </p>
        
        <div className="flex gap-2 flex-wrap">
          <Button
            onClick={handleTestNotification}
            disabled={isSending || tokenStatus === 'missing'}
            variant="default"
          >
            <Send className="h-4 w-4 mr-2" />
            {isSending ? 'Sending...' : 'Send Test Notification'}
          </Button>
          
          {(tokenStatus === 'invalid' || tokenStatus === 'missing') && (
            <Button
              onClick={handleRefreshToken}
              disabled={isRefreshing}
              variant="outline"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
              {isRefreshing ? 'Refreshing...' : 'Refresh Token'}
            </Button>
          )}
        </div>
        
        <div className="text-xs text-muted-foreground space-y-1">
          <p>• Make sure notification permissions are enabled in your browser</p>
          <p>• After clicking, immediately minimize or close the app</p>
          <p>• The notification will appear as a system notification</p>
          {tokenStatus === 'invalid' && (
            <p className="text-yellow-600 dark:text-yellow-400">• Your token is invalid. Click "Refresh Token" to generate a new one.</p>
          )}
        </div>
      </div>
    </div>
  );
}

