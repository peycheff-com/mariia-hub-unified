import { useState, useEffect, useCallback, useRef } from 'react';

import { toast } from '@/components/ui/use-toast';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

interface PWAInstallResult {
  canInstall: boolean;
  isInstalled: boolean;
  isStandalone: boolean;
  platform: string;
  install: () => Promise<boolean>;
  dismiss: () => void;
}

interface NetworkState {
  isOnline: boolean;
  connectionType: string;
  effectiveType: string;
  downlink: number;
  rtt: number;
  saveData: boolean;
}

interface PWANotificationOptions {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  tag?: string;
  data?: any;
  actions?: NotificationAction[];
}

interface UsePWAReturn {
  // Install
  install: PWAInstallResult;

  // Network
  network: NetworkState;

  // Service Worker
  swVersion: string | null;
  updateAvailable: boolean;
  skipWaiting: () => void;

  // Notifications
  notificationPermission: NotificationPermission;
  requestNotificationPermission: () => Promise<boolean>;
  showNotification: (options: PWANotificationOptions) => Promise<void>;
  subscribeToPush: () => Promise<PushSubscription | null>;
  unsubscribeFromPush: () => Promise<boolean>;

  // Badging
  setBadge: (count: number) => void;
  clearBadge: () => void;

  // Screen Wake Lock
  requestWakeLock: () => Promise<WakeLockSentinel | null>;
  releaseWakeLock: (wakeLock: WakeLockSentinel) => Promise<void>;

  // Sharing
  share: (data: ShareData) => Promise<boolean>;
  canShare: boolean;

  // Fullscreen
  toggleFullscreen: () => Promise<void>;
  isFullscreen: boolean;
}

export function usePWA(): UsePWAReturn {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [swVersion, setSwVersion] = useState<string | null>(null);
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>('default');
  const [network, setNetwork] = useState<NetworkState>({
    isOnline: navigator.onLine,
    connectionType: 'unknown',
    effectiveType: 'unknown',
    downlink: 0,
    rtt: 0,
    saveData: false,
  });
  const [isFullscreen, setIsFullscreen] = useState(false);
  const wakeLockRef = useRef<WakeLockSentinel | null>(null);
  const registrationRef = useRef<ServiceWorkerRegistration | null>(null);

  // Initialize PWA features
  useEffect(() => {
    const initPWA = async () => {
      // Check installation status
      checkInstallationStatus();

      // Setup network monitoring
      setupNetworkMonitoring();

      // Setup service worker
      await setupServiceWorker();

      // Check notification permission
      setNotificationPermission(Notification.permission);

      // Setup fullscreen monitoring
      setupFullscreenMonitoring();

      // Setup wake lock release on visibility change
      document.addEventListener('visibilitychange', handleVisibilityChange);

      return () => {
        document.removeEventListener('visibilitychange', handleVisibilityChange);
      };
    };

    initPWA();
  }, []);

  const checkInstallationStatus = () => {
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    const isInWebAppiOS = (window.navigator as any).standalone === true;
    const isFromPWA = sessionStorage.getItem('pwa-installed') === 'true';

    setIsInstalled(isStandalone || isInWebAppiOS || isFromPWA);
  };

  const setupNetworkMonitoring = () => {
    const updateNetworkState = () => {
      const connection = (navigator as any).connection ||
                        (navigator as any).mozConnection ||
                        (navigator as any).webkitConnection;

      setNetwork({
        isOnline: navigator.onLine,
        connectionType: connection?.type || 'unknown',
        effectiveType: connection?.effectiveType || 'unknown',
        downlink: connection?.downlink || 0,
        rtt: connection?.rtt || 0,
        saveData: connection?.saveData || false,
      });
    };

    updateNetworkState();

    window.addEventListener('online', updateNetworkState);
    window.addEventListener('offline', updateNetworkState);

    if (connection) {
      connection.addEventListener('change', updateNetworkState);
    }

    return () => {
      window.removeEventListener('online', updateNetworkState);
      window.removeEventListener('offline', updateNetworkState);
      if (connection) {
        connection.removeEventListener('change', updateNetworkState);
      }
    };
  };

  const setupServiceWorker = async () => {
    if (!('serviceWorker' in navigator)) return;

    try {
      const registration = await navigator.serviceWorker.ready;
      registrationRef.current = registration;

      // Get SW version
      if (registration.active) {
        registration.active.postMessage({ type: 'GET_VERSION' });

        const messageChannel = new MessageChannel();
        messageChannel.port1.onmessage = (event) => {
          if (event.data.version) {
            setSwVersion(event.data.version);
          }
        };

        registration.active.postMessage({ type: 'GET_VERSION' }, [messageChannel.port2]);
      }

      // Listen for updates
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              setUpdateAvailable(true);
              toast({
                title: 'Update Available',
                description: 'A new version of the app is available. Click to update.',
                action: {
                  label: 'Update',
                  onClick: () => skipWaiting(),
                },
              });
            }
          });
        }
      });

      // Listen for install prompt
      window.addEventListener('beforeinstallprompt', (e: Event) => {
        e.preventDefault();
        setDeferredPrompt(e as BeforeInstallPromptEvent);
      });

      // Listen for app installed
      window.addEventListener('appinstalled', () => {
        setIsInstalled(true);
        sessionStorage.setItem('pwa-installed', 'true');
        toast({
          title: 'App Installed!',
          description: 'The app has been successfully installed.',
        });
      });

      // Listen for messages from SW
      navigator.serviceWorker.addEventListener('message', (event) => {
        const { type, payload } = event.data;

        switch (type) {
          case 'PERFORMANCE_SLOW_REQUEST':
            toast({
              title: 'Slow Connection Detected',
              description: `Request to ${payload.url} took ${payload.duration}ms`,
              variant: 'destructive',
            });
            break;
        }
      });
    } catch (error) {
      console.error('Service Worker setup failed:', error);
    }
  };

  const setupFullscreenMonitoring = () => {
    const updateFullscreenState = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', updateFullscreenState);
    document.addEventListener('webkitfullscreenchange', updateFullscreenState);
    document.addEventListener('mozfullscreenchange', updateFullscreenState);
    document.addEventListener('MSFullscreenChange', updateFullscreenState);

    return () => {
      document.removeEventListener('fullscreenchange', updateFullscreenState);
      document.removeEventListener('webkitfullscreenchange', updateFullscreenState);
      document.removeEventListener('mozfullscreenchange', updateFullscreenState);
      document.removeEventListener('MSFullscreenChange', updateFullscreenState);
    };
  };

  const handleVisibilityChange = () => {
    if (document.visibilityState === 'visible' && wakeLockRef.current) {
      // Re-request wake lock when page becomes visible
      requestWakeLock();
    }
  };

  const install = useCallback(async (): Promise<boolean> => {
    if (!deferredPrompt) return false;

    try {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;

      setDeferredPrompt(null);

      return outcome === 'accepted';
    } catch (error) {
      console.error('Install failed:', error);
      return false;
    }
  }, [deferredPrompt]);

  const dismiss = useCallback(() => {
    setDeferredPrompt(null);
  }, []);

  const skipWaiting = useCallback(() => {
    if (registrationRef.current?.waiting) {
      registrationRef.current.waiting.postMessage({ type: 'SKIP_WAITING' });
      setUpdateAvailable(false);
      window.location.reload();
    }
  }, []);

  const requestNotificationPermission = useCallback(async (): Promise<boolean> => {
    if (!('Notification' in window)) {
      toast({
        title: 'Notifications Not Supported',
        description: 'Your browser does not support push notifications.',
        variant: 'destructive',
      });
      return false;
    }

    try {
      const permission = await Notification.requestPermission();
      setNotificationPermission(permission);

      if (permission === 'granted') {
        toast({
          title: 'Notifications Enabled',
          description: 'You will receive notifications about your appointments.',
        });
        return true;
      } else {
        toast({
          title: 'Notifications Blocked',
          description: 'You have blocked notifications. You can enable them in your browser settings.',
          variant: 'destructive',
        });
        return false;
      }
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return false;
    }
  }, []);

  const showNotification = useCallback(async (options: PWANotificationOptions) => {
    if (notificationPermission !== 'granted') {
      await requestNotificationPermission();
    }

    if (Notification.permission === 'granted') {
      try {
        const notification = new Notification(options.title, {
          body: options.body,
          icon: options.icon || '/logo.png',
          badge: options.badge || '/badge.png',
          tag: options.tag,
          data: options.data,
          actions: options.actions,
        });

        if (options.data?.url) {
          notification.onclick = () => {
            window.open(options.data.url, '_blank');
          };
        }

        // Auto-close after 5 seconds
        setTimeout(() => notification.close(), 5000);
      } catch (error) {
        console.error('Error showing notification:', error);
      }
    }
  }, [notificationPermission, requestNotificationPermission]);

  const subscribeToPush = useCallback(async (): Promise<PushSubscription | null> => {
    if (!registrationRef.current) return null;

    try {
      const subscription = await registrationRef.current.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: import.meta.env.VITE_VAPID_PUBLIC_KEY,
      });

      // Send subscription to server
      await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(subscription),
      });

      toast({
        title: 'Push Notifications Enabled',
        description: 'You will receive notifications even when the app is closed.',
      });

      return subscription;
    } catch (error) {
      console.error('Error subscribing to push:', error);
      return null;
    }
  }, []);

  const unsubscribeFromPush = useCallback(async (): Promise<boolean> => {
    if (!registrationRef.current) return false;

    try {
      const subscription = await registrationRef.current.pushManager.getSubscription();
      if (subscription) {
        await subscription.unsubscribe();

        // Remove from server
        await fetch('/api/push/unsubscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ endpoint: subscription.endpoint }),
        });

        toast({
          title: 'Push Notifications Disabled',
          description: 'You will no longer receive push notifications.',
        });

        return true;
      }
      return false;
    } catch (error) {
      console.error('Error unsubscribing from push:', error);
      return false;
    }
  }, []);

  const setBadge = useCallback((count: number) => {
    if ('setAppBadge' in navigator) {
      (navigator as any).setAppBadge(count);
    } else if ('setExperimentalAppBadge' in navigator) {
      (navigator as any).setExperimentalAppBadge(count);
    }
  }, []);

  const clearBadge = useCallback(() => {
    if ('clearAppBadge' in navigator) {
      (navigator as any).clearAppBadge();
    } else if ('clearExperimentalAppBadge' in navigator) {
      (navigator as any).clearExperimentalAppBadge();
    }
  }, []);

  const requestWakeLock = useCallback(async (): Promise<WakeLockSentinel | null> => {
    try {
      if ('wakeLock' in navigator) {
        const wakeLock = await (navigator as any).wakeLock.request('screen');
        wakeLockRef.current = wakeLock;

        wakeLock.addEventListener('release', () => {
          wakeLockRef.current = null;
        });

        return wakeLock;
      }
      return null;
    } catch (error) {
      console.error('Error requesting wake lock:', error);
      return null;
    }
  }, []);

  const releaseWakeLock = useCallback(async (wakeLock: WakeLockSentinel) => {
    try {
      await wakeLock.release();
      wakeLockRef.current = null;
    } catch (error) {
      console.error('Error releasing wake lock:', error);
    }
  }, []);

  const share = useCallback(async (data: ShareData): Promise<boolean> => {
    if (!navigator.share) {
      // Fallback: copy to clipboard
      try {
        await navigator.clipboard.writeText(data.text || data.url || '');
        toast({
          title: 'Link Copied',
          description: 'The link has been copied to your clipboard.',
        });
        return true;
      } catch (error) {
        console.error('Error copying to clipboard:', error);
        return false;
      }
    }

    try {
      await navigator.share(data);
      return true;
    } catch (error) {
      if ((error as Error).name !== 'AbortError') {
        console.error('Error sharing:', error);
      }
      return false;
    }
  }, []);

  const toggleFullscreen = useCallback(async () => {
    if (!document.fullscreenElement) {
      await document.documentElement.requestFullscreen();
    } else {
      await document.exitFullscreen();
    }
  }, []);

  const getPlatform = () => {
    const userAgent = navigator.userAgent.toLowerCase();
    if (/iphone|ipad|ipod/.test(userAgent)) return 'ios';
    if (/android/.test(userAgent)) return 'android';
    if (/win/.test(userAgent)) return 'windows';
    if (/mac/.test(userAgent)) return 'macos';
    return 'web';
  };

  return {
    install: {
      canInstall: !!deferredPrompt,
      isInstalled,
      isStandalone: window.matchMedia('(display-mode: standalone)').matches,
      platform: getPlatform(),
      install,
      dismiss,
    },
    network,
    swVersion,
    updateAvailable,
    skipWaiting,
    notificationPermission,
    requestNotificationPermission,
    showNotification,
    subscribeToPush,
    unsubscribeFromPush,
    setBadge,
    clearBadge,
    requestWakeLock,
    releaseWakeLock,
    share,
    canShare: !!navigator.share,
    toggleFullscreen,
    isFullscreen,
  };
}