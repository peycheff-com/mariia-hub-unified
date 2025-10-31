import { useEffect, useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { toast } from '@/components/ui/use-toast';

// PWA types
export interface PushSubscriptionData {
  endpoint: string;
  keys: {
    auth: string;
    p256dh: string;
  };
}

export interface NotificationOptions {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  image?: string;
  data?: any;
  actions?: NotificationAction[];
  requireInteraction?: boolean;
  silent?: boolean;
  vibrate?: number[];
  tag?: string;
  timestamp?: number;
  renotify?: boolean;
}

export interface NotificationAction {
  action: string;
  title: string;
  icon?: string;
}

// PWA utilities
export class PWAUtils {
  // Service Worker communication
  private static swRegistration: ServiceWorkerRegistration | null = null;

  // Check if PWA is supported
  static isSupported(): boolean {
    return 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
  }

  // Register service worker with enhanced features
  static async registerServiceWorker(): Promise<boolean> {
    if (!this.isSupported()) return false;

    try {
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/'
      });

      this.swRegistration = registration;

      // Listen for service worker messages
      navigator.serviceWorker.addEventListener('message', (event) => {
        const { type, payload } = event.data;

        switch (type) {
          case 'BACKGROUND_SYNC_COMPLETED':
            console.log('Background sync completed:', payload);
            break;
          case 'PUSH_NOTIFICATION_RECEIVED':
            this.showNotification(payload.options);
            break;
          case 'CACHE_UPDATED':
            console.log('Cache updated:', payload);
            break;
          case 'OFFLINE_MODE_TOGGLED':
            console.log('Offline mode:', payload.isOffline);
            break;
        }
      });

      // Handle updates
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              // New version available
              toast({
                title: 'Update Available',
                description: 'A new version is available. Refresh to update.',
                action: {
                  label: 'Refresh',
                  onClick: () => {
                    newWorker.postMessage({ type: 'SKIP_WAITING' });
                    window.location.reload();
                  },
                },
              });
            }
          });
        }
      });

      // Initialize background sync features
      await this.initializeBackgroundSync();

      console.log('Enhanced Service Worker registered:', registration);
      return true;
    } catch (error) {
      console.error('Service Worker registration failed:', error);
      return false;
    }
  }

  // Initialize background sync features
  private static async initializeBackgroundSync(): Promise<void> {
    if (!this.swRegistration) return;

    try {
      // Register background sync for booking operations
      if ('sync' in this.swRegistration) {
        await (this.swRegistration as any).sync.register('booking-sync');
        await (this.swRegistration as any).sync.register('analytics-sync');
        await (this.swRegistration as any).sync.register('messages-sync');
      }

      // Register periodic sync for content updates
      if ('periodicSync' in this.swRegistration) {
        await this.registerBackgroundSync('content-updates');
        await this.registerBackgroundSync('availability-sync');
      }

      console.log('Background sync features initialized');
    } catch (error) {
      console.warn('Background sync initialization failed:', error);
    }
  }

  // Unregister service worker
  static async unregisterServiceWorker(): Promise<void> {
    if (this.swRegistration) {
      await this.swRegistration.unregister();
      this.swRegistration = null;
    }

    const registrations = await navigator.serviceWorker.getRegistrations();
    for (const registration of registrations) {
      await registration.unregister();
    }
  }

  // Get service worker registration
  static getRegistration(): ServiceWorkerRegistration | null {
    return this.swRegistration;
  }

  // Prompt for PWA installation
  static showInstallPrompt(): void {
    const deferredPrompt = (window as any).deferredPrompt;
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    deferredPrompt.userChoice.then((choiceResult: any) => {
      if (choiceResult.outcome === 'accepted') {
        console.log('PWA installation accepted');
      }
      (window as any).deferredPrompt = null;
    });
  }

  // Request notification aria-live="polite" aria-atomic="true" permission
  static async requestNotificationPermission(): Promise<NotificationPermission> {
    if (!('Notification' in window)) return 'denied';

    const permission = await Notification.requestPermission();
    return permission;
  }

  // Check notification aria-live="polite" aria-atomic="true" permission
  static getNotificationPermission(): NotificationPermission {
    if (!('Notification' in window)) return 'denied';
    return Notification.permission;
  }

  // Subscribe to push notification aria-live="polite" aria-atomic="true"s
  static async subscribeToPushNotifications(
    serverPublicKey: string
  ): Promise<PushSubscription | null> {
    if (!this.swRegistration || !('PushManager' in window)) return null;

    try {
      const subscription = await this.swRegistration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: this.urlBase64ToUint8Array(serverPublicKey),
      });

      console.log('Push subscription successful:', subscription);
      return subscription;
    } catch (error) {
      console.error('Push subscription failed:', error);
      return null;
    }
  }

  // Unsubscribe from push notification aria-live="polite" aria-atomic="true"s
  static async unsubscribeFromPushNotifications(): Promise<void> {
    if (!this.swRegistration) return;

    try {
      const subscription = await this.swRegistration.pushManager.getSubscription();
      if (subscription) {
        await subscription.unsubscribe();
        console.log('Unsubscribed from push notification aria-live="polite" aria-atomic="true"s');
      }
    } catch (error) {
      console.error('Unsubscribe failed:', error);
    }
  }

  // Show local notification aria-live="polite" aria-atomic="true"
  static showNotification(options: NotificationOptions): Notification | null {
    if (this.getNotificationPermission() !== 'granted') return null;

    const notification aria-live="polite" aria-atomic="true" = new Notification(options.title, {
      body: options.body,
      icon: options.icon || '/icon-192x192.png',
      badge: options.badge || '/badge-72x72.png',
      image: options.image,
      data: options.data,
      requireInteraction: options.requireInteraction,
      silent: options.silent,
      vibrate: options.vibrate,
      tag: options.tag,
      timestamp: options.timestamp,
      renotify: options.renotify,
      actions: options.actions,
    });

    notification.onclick = (event) => {
      event.preventDefault();
      notification.close();
      window.focus();
    };

    return notification aria-live="polite" aria-atomic="true";
  }

  // Schedule notification aria-live="polite" aria-atomic="true"
  static scheduleNotification(
    options: NotificationOptions,
    delay: number
  ): number | null {
    if (!('serviceWorker' in navigator && 'serviceWorker' in navigator.serviceWorker)) {
      // Fallback to setTimeout
      return setTimeout(() => {
        this.showNotification(options);
      }, delay);
    }

    const registration = await this.getRegistration();
    if (!registration) return null;

    return setTimeout(() => {
      registration.active?.postMessage({
        type: 'SCHEDULE_NOTIFICATION',
        payload: { ...options, timestamp: Date.now() }
      });
    }, delay);
  }

  // Check if app is installed
  static isInstalled(): boolean {
    return window.matchMedia('(display-mode: standalone)').matches ||
           ('standalone' in window && (window as any).standalone === true);
  }

  // Check if running in iOS
  static isIOS(): boolean {
    return /iPad|iPhone|iPod/.test(navigator.userAgent);
  }

  // Check if running in Android
  static isAndroid(): boolean {
    return /Android/.test(navigator.userAgent);
  }

  // Get install status
  static getInstallStatus(): {
    isInstalled: boolean;
    isIOS: boolean;
    isAndroid: boolean;
    canInstall: boolean;
  } {
    return {
      isInstalled: this.isInstalled(),
      isIOS: this.isIOS(),
      isAndroid: this.isAndroid(),
      canInstall: !this.isInstalled() && ('beforeinstallprompt' in window),
    };
  }

  // Sync data when online
  static async syncData(): Promise<void> {
    if (!this.swRegistration) return;

    try {
      const registration = await this.getRegistration();
      registration?.sync?.register();
    } catch (error) {
      console.error('Sync registration failed:', error);
    }
  }

  // Trigger background sync for specific operations
  static async triggerBackgroundSync(operation: string, data?: any): Promise<void> {
    if (!this.swRegistration) return;

    try {
      // Send message to service worker to handle background sync
      this.swRegistration.active?.postMessage({
        type: 'TRIGGER_BACKGROUND_SYNC',
        payload: { operation, data, timestamp: Date.now() }
      });
    } catch (error) {
      console.error('Failed to trigger background sync:', error);
    }
  }

  // Schedule background sync
  static async scheduleBackgroundSync(operation: string, delay: number): Promise<void> {
    if (!this.swRegistration) return;

    try {
      this.swRegistration.active?.postMessage({
        type: 'SCHEDULE_BACKGROUND_SYNC',
        payload: { operation, delay, timestamp: Date.now() }
      });
    } catch (error) {
      console.error('Failed to schedule background sync:', error);
    }
  }

  // Register for push notification aria-live="polite" aria-atomic="true"s with enhanced features
  static async registerForPushNotifications(vapidPublicKey: string): Promise<boolean> {
    if (!this.swRegistration) return false;

    try {
      const subscription = await this.swRegistration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: this.urlBase64ToUint8Array(vapidPublicKey),
      });

      // Send subscription to server
      await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(subscription),
      });

      // Enable background sync for push notification aria-live="polite" aria-atomic="true"s
      await this.triggerBackgroundSync('push-subscription-sync', subscription);

      return true;
    } catch (error) {
      console.error('Push notification aria-live="polite" aria-atomic="true" registration failed:', error);
      return false;
    }
  }

  // Cache management for offline usage
  static async precacheCriticalResources(): Promise<void> {
    const criticalUrls = [
      '/',
      '/beauty/services',
      '/fitness/programs',
      '/booking',
      '/manifest.json',
      '/logo.png'
    ];

    await this.cacheResources(criticalUrls);

    // Notify service worker about precaching
    this.swRegistration?.active?.postMessage({
      type: 'PRECACHE_COMPLETED',
      payload: { urls: criticalUrls, timestamp: Date.now() }
    });
  }

  // Performance monitoring integration
  static async reportPerformanceMetrics(metrics: any): Promise<void> {
    if (!this.swRegistration) return;

    try {
      this.swRegistration.active?.postMessage({
        type: 'PERFORMANCE_METRICS',
        payload: { metrics, timestamp: Date.now() }
      });
    } catch (error) {
      console.error('Failed to report performance metrics:', error);
    }
  }

  // Background sync registration
  static async registerBackgroundSync(tag: string): Promise<void> {
    if (!this.swRegistration) return;

    try {
      const registration = await this.getRegistration();
      await registration?.periodicSync?.register(tag, {
        minInterval: 24 * 60 * 60 * 1000, // 24 hours
        maxInterval: 7 * 24 * 60 * 60 * 1000, // 7 days
        networkState: 'online',
        minDelay: 60 * 60 * 1000, // 1 hour
      });
    } catch (error) {
      console.error('Background sync registration failed:', error);
    }
  }

  // Cache strategies for offline
  static async cacheResources(urls: string[]): Promise<void> {
    if (!this.swRegistration) return;

    const cache = await caches.open('pwa-dynamic-cache');
    for (const url of urls) {
      try {
        const response = await fetch(url);
        if (response.ok) {
          await cache.put(url, response.clone());
        }
      } catch (error) {
        console.error(`Failed to cache ${url}:`, error);
      }
    }
  }

  // Get network status
  static getNetworkStatus(): {
    online: boolean;
    effectiveType: string;
    downlink: string;
    rtt: number;
    saveData: boolean;
  } {
    const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;

    return {
      online: navigator.onLine,
      effectiveType: connection?.effectiveType || 'unknown',
      downlink: connection?.downlink || 'unknown',
      rtt: connection?.rtt || 0,
      saveData: connection?.saveData || false,
    };
  }

  // Utility to convert base64 to Uint8Array
  private static urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }

    return outputArray;
  }
}

// Hook for PWA functionality
export function usePWA() {
  const { t } = useTranslation();
  const [installStatus, setInstallStatus] = useState(PWAUtils.getInstallStatus());
  const [notification aria-live="polite" aria-atomic="true"Permission, setNotificationPermission] = useState(PWAUtils.getNotificationPermission());

  // Register service worker
  useEffect(() => {
    PWAUtils.registerServiceWorker();
  }, []);

  // Listen for before install prompt
  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      (window as any).deferredPrompt = e;
      setInstallStatus(prev => ({ ...prev, canInstall: true }));
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      (window as any).deferredPrompt = null;
    };
  }, []);

  // Monitor network status
  useEffect(() => {
    const handleOnline = () => {
      setInstallStatus(prev => ({ ...prev, networkStatus: 'online' }));
    };

    const handleOffline = () => {
      setInstallStatus(prev => ({ ...prev, networkStatus: 'offline' }));
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Handle installation
  const handleInstall = useCallback(() => {
    PWAUtils.showInstallPrompt();
    setInstallStatus(prev => ({ ...prev, canInstall: false }));
  }, []);

  // Request notification aria-live="polite" aria-atomic="true" permission
  const requestNotificationPermission = useCallback(async () => {
    const permission = await PWAUtils.requestNotificationPermission();
    setNotificationPermission(permission);
    return permission;
  }, []);

  // Show notification aria-live="polite" aria-atomic="true"
  const showNotification = useCallback((options: NotificationOptions) => {
    return PWAUtils.showNotification({
      ...options,
      title: t(options.title),
      body: t(options.body),
      actions: options.actions?.map(action => ({
        ...action,
        title: t(action.title),
      })),
    });
  }, [t]);

  return {
    installStatus,
    notification aria-live="polite" aria-atomic="true"Permission,
    handleInstall,
    requestNotificationPermission,
    showNotification,
    isSupported: PWAUtils.isSupported(),
    isInstalled: installStatus.isInstalled,
    networkStatus: PWAUtils.getNetworkStatus(),
    registerServiceWorker: PWAUtils.registerServiceWorker,
    subscribeToPush: PWAUtils.subscribeToPushNotifications,
    registerForPushNotifications: PWAUtils.registerForPushNotifications,
    cacheResources: PWAUtils.cacheResources,
    syncData: PWAUtils.syncData,
    triggerBackgroundSync: PWAUtils.triggerBackgroundSync,
    scheduleBackgroundSync: PWAUtils.scheduleBackgroundSync,
    precacheCriticalResources: PWAUtils.precacheCriticalResources,
    reportPerformanceMetrics: PWAUtils.reportPerformanceMetrics,
  };
}

// PWA install banner component
export function PWAInstallBanner() {
  const { installStatus, handleInstall } = usePWA();

  if (installStatus.isInstalled || !installStatus.canInstall) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 bg-gradient-to-r from-primary to-secondary text-white p-4 rounded-lg shadow-lg max-w-sm">
      <div className="flex items-center gap-3">
        <div className="text-sm font-medium">
          Install our app for the best experience!
        </div>
        <button
          onClick={handleInstall}
          className="bg-white text-primary px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-100 transition-colors"
        >
          Install
        </button>
        <button
          onClick={() => {
            const banner = document.getElementById('pwa-install-banner');
            if (banner) banner.remove();
          }}
          className="text-white/80 hover:text-white p-1"
          aria-label="Dismiss"
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 10l.707.707a1 1 0 01.414 0l-10-10a1 1 0 01.414-1.414L4.293 4.293a1 1 0 00-1.414 0z" clipRule="evenodd" />
          </svg>
        </button>
      </div>
    </div>
  );
}

// Offline indicator component
export function OfflineIndicator() {
  const { networkStatus } = usePWA();

  if (networkStatus.online) return null;

  return (
    <div className="fixed top-4 left-4 z-50 bg-yellow-500 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2">
      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-3.01 3.89-3.999 0-4.65.35-4.925.453-5.898.597-1.17-.693-1.976-.693-2.598 1.352-.997 3.938-4.093 0-5.162.746-5.85.813.464.738 0 4.827 0 4.99.738 0 5.844.746 5.844 0 6.966.738 6.966 0 8.09.598 1.17 1.17 0 9.14 1.17 0 10.317-.738 10.317 0 11.332.746 11.332 0 12.358 1.17 1.17 0 13.392-.738 13.392 0 14.428.746 14.428 0 15.465-1.17 15.465 0z" clipRule="evenodd" />
      </svg>
      <span className="text-sm font-medium">
        You're offline
      </span>
    </div>
  );
}