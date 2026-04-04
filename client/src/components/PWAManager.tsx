import { useEffect, useState } from 'react';
import { Bell, BellOff, Download, X } from 'lucide-react';

interface PWAManagerProps {
  onNotificationPermissionChange?: (granted: boolean) => void;
}

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export default function PWAManager({ onNotificationPermissionChange }: PWAManagerProps) {
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>('default');
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [swRegistration, setSwRegistration] = useState<ServiceWorkerRegistration | null>(null);

  useEffect(() => {
    registerServiceWorker();
    checkInstallStatus();
    setupInstallPrompt();
    checkNotificationPermission();
    handleNotificationActions();
  }, []);

  const registerServiceWorker = async () => {
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js');
        setSwRegistration(registration);
        console.log('[PWA] Service Worker registered successfully');
        
        // Handle service worker updates
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                // New version available
                showUpdateNotification();
              }
            });
          }
        });
      } catch (error) {
        console.error('[PWA] Service Worker registration failed:', error);
      }
    }
  };

  const checkInstallStatus = () => {
    // Check if app is already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
    }
  };

  const setupInstallPrompt = () => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      const beforeInstallPrompt = e as BeforeInstallPromptEvent;
      setDeferredPrompt(beforeInstallPrompt);
      setIsInstallable(true);
      
      // Show install prompt after a delay if not shown before
      setTimeout(() => {
        const hasShownPrompt = localStorage.getItem('trai-install-prompt-shown');
        if (!hasShownPrompt && !isInstalled) {
          setShowInstallPrompt(true);
        }
      }, 10000); // Show after 10 seconds
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  };

  const checkNotificationPermission = () => {
    if ('Notification' in window) {
      setNotificationPermission(Notification.permission);
      onNotificationPermissionChange?.(Notification.permission === 'granted');
    }
  };

  const handleNotificationActions = () => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data?.type === 'notification_action') {
          handleNotificationAction(event.data.action, event.data.url);
        }
      });
    }
  };

  const handleNotificationAction = (action: string, url: string) => {
    // Handle different notification actions
    const urlParams = new URLSearchParams(url.split('?')[1] || '');
    const actionType = urlParams.get('action');
    
    if (actionType === 'mood') {
      // Trigger mood check-in
      triggerMoodCheckin();
    } else if (actionType === 'journal') {
      // Trigger voice journal
      triggerVoiceJournal();
    } else if (actionType === 'affirmation') {
      // Show daily affirmation
      showDailyAffirmation();
    }
  };

  const triggerMoodCheckin = () => {
    // Dispatch custom event to open mood tracking
    window.dispatchEvent(new CustomEvent('openMoodTracking', { 
      detail: { source: 'notification' } 
    }));
  };

  const triggerVoiceJournal = () => {
    // Dispatch custom event to open voice journal
    window.dispatchEvent(new CustomEvent('openVoiceJournal', { 
      detail: { source: 'notification', duration: 30 } 
    }));
  };

  const showDailyAffirmation = () => {
    // Dispatch custom event to show affirmation
    window.dispatchEvent(new CustomEvent('showDailyAffirmation', { 
      detail: { source: 'notification' } 
    }));
  };

  const requestNotificationPermission = async () => {
    if ('Notification' in window && swRegistration) {
      try {
        const permission = await Notification.requestPermission();
        setNotificationPermission(permission);
        onNotificationPermissionChange?.(permission === 'granted');
        
        if (permission === 'granted') {
          await subscribeToNotifications();
          await scheduleWellnessReminders();
        }
      } catch (error) {
        console.error('[PWA] Notification permission request failed:', error);
      }
    }
  };

  const subscribeToNotifications = async () => {
    if (!swRegistration) return;
    
    try {
      // Generate VAPID keys for push notifications
      const subscription = await swRegistration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(getVAPIDPublicKey())
      });
      
      // Send subscription to server
      await fetch('/api/notifications/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(subscription)
      });
      
      console.log('[PWA] Push notification subscription successful');
    } catch (error) {
      console.error('[PWA] Push notification subscription failed:', error);
    }
  };

  const scheduleWellnessReminders = async () => {
    try {
      await fetch('/api/notifications/schedule-wellness-reminders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          affirmationTime: '09:00',
          moodCheckTime: '18:00',
          journalTime: '20:00'
        })
      });
      
      console.log('[PWA] Wellness reminders scheduled');
    } catch (error) {
      console.error('[PWA] Failed to schedule wellness reminders:', error);
    }
  };

  const installApp = async () => {
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const choiceResult = await deferredPrompt.userChoice;
      
      if (choiceResult.outcome === 'accepted') {
        setIsInstalled(true);
        setIsInstallable(false);
        localStorage.setItem('trai-app-installed', 'true');
      }
      
      setDeferredPrompt(null);
      setShowInstallPrompt(false);
      localStorage.setItem('trai-install-prompt-shown', 'true');
    }
  };

  const dismissInstallPrompt = () => {
    setShowInstallPrompt(false);
    localStorage.setItem('trai-install-prompt-shown', 'true');
  };

  const showUpdateNotification = () => {
    // Show update available notification
    if (swRegistration?.waiting) {
      const updateConfirm = confirm(
        'A new version of Chakrai is available. Update now for the latest features and improvements?'
      );
      
      if (updateConfirm) {
        swRegistration.waiting.postMessage({ type: 'SKIP_WAITING' });
        window.location.reload();
      }
    }
  };

  // Helper function to convert VAPID key
  const urlBase64ToUint8Array = (base64String: string) => {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/');
    
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    
    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  };

  // Get VAPID public key (you'll need to generate these)
  const getVAPIDPublicKey = () => {
    return 'BEl62iUYgUivxIkv69yViEuiBIa40HI80NM9VE2BAkk_T1_7XSWaD8K8jDSU8P-8VZsyZvkH8a';
  };

  return (
    <>
      {/* Install App Prompt */}
      {showInstallPrompt && isInstallable && !isInstalled && (
        <div className="fixed top-4 left-4 right-4 z-50 theme-card text-white rounded-lg p-4 shadow-lg border border-silver hover:border-2 hover:animate-shimmer">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-3">
              <Download className="w-6 h-6 text-white" />
              <div>
                <h3 className="font-semibold text-sm">Install TraI App</h3>
                <p className="text-xs text-white/80 mt-1">
                  Get quick access to your mental wellness companion with push notifications and offline support.
                </p>
              </div>
            </div>
            <button 
              onClick={dismissInstallPrompt}
              className="text-white/60 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="flex space-x-2 mt-3">
            <button
              onClick={installApp}
              className="bg-white text-[#3f51b5] px-4 py-2 rounded-lg text-sm font-medium hover:bg-white/90 transition-colors"
            >
              Install
            </button>
            <button
              onClick={dismissInstallPrompt}
              className="text-white/80 px-4 py-2 rounded-lg text-sm hover:text-white transition-colors"
            >
              Maybe Later
            </button>
          </div>
        </div>
      )}

      {/* Notification Permission Button */}
      {notificationPermission !== 'granted' && (
        <button
          onClick={requestNotificationPermission}
          className="fixed bottom-20 right-4 theme-card hover:theme-primary text-white p-3 rounded-full shadow-lg transition-all duration-200 hover:scale-105 z-40"
          title="Enable Notifications"
        >
          {notificationPermission === 'denied' ? (
            <BellOff className="w-5 h-5" />
          ) : (
            <Bell className="w-5 h-5" />
          )}
        </button>
      )}
    </>
  );
}

// Utility function to check if app can be installed
export const canInstallPWA = () => {
  return 'serviceWorker' in navigator && 
         'PushManager' in window && 
         'Notification' in window;
};

// Utility function to check if app is installed
export const isPWAInstalled = () => {
  return window.matchMedia('(display-mode: standalone)').matches ||
         localStorage.getItem('trai-app-installed') === 'true';
};
