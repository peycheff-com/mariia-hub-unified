import { supabase } from '@/integrations/supabase/client';

export interface PushNotificationData {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  tag?: string;
  data?: any;
  actions?: NotificationAction[];
}

export interface NotificationTemplate {
  name: string;
  type: 'push' | 'email' | 'sms';
  language: string;
  titleTemplate: string;
  bodyTemplate: string;
  dataTemplate?: any;
}

export class PushNotificationManager {
  private static instance: PushNotificationManager;
  private subscription: PushSubscription | null = null;
  private registration: ServiceWorkerRegistration | null = null;

  private constructor() {}

  static getInstance(): PushNotificationManager {
    if (!PushNotificationManager.instance) {
      PushNotificationManager.instance = new PushNotificationManager();
    }
    return PushNotificationManager.instance;
  }

  async initialize(): Promise<void> {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      console.warn('Push notifications are not supported');
      return;
    }

    try {
      this.registration = await navigator.serviceWorker.ready;
      this.subscription = await this.registration.pushManager.getSubscription();
    } catch (error) {
      console.error('Error initializing push notifications:', error);
    }
  }

  async subscribeToPush(): Promise<PushSubscription | null> {
    if (!this.registration) {
      await this.initialize();
    }

    if (!this.registration) {
      throw new Error('Service worker not available');
    }

    try {
      // Check existing subscription
      const existingSubscription = await this.registration.pushManager.getSubscription();
      if (existingSubscription) {
        await this.saveSubscription(existingSubscription);
        return existingSubscription;
      }

      // Create new subscription
      const vapidPublicKey = import.meta.env.VITE_VAPID_PUBLIC_KEY;
      if (!vapidPublicKey) {
        throw new Error('VAPID public key not configured');
      }

      const subscription = await this.registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: this.urlBase64ToUint8Array(vapidPublicKey),
      });

      await this.saveSubscription(subscription);
      this.subscription = subscription;

      return subscription;
    } catch (error) {
      console.error('Error subscribing to push notifications:', error);
      throw error;
    }
  }

  async unsubscribeFromPush(): Promise<boolean> {
    if (!this.subscription) {
      return true;
    }

    try {
      await this.removeSubscription(this.subscription);
      await this.subscription.unsubscribe();
      this.subscription = null;
      return true;
    } catch (error) {
      console.error('Error unsubscribing from push notifications:', error);
      return false;
    }
  }

  private async saveSubscription(subscription: PushSubscription): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const subscriptionData = {
        user_id: user.id,
        endpoint: subscription.endpoint,
        p256dh_key: subscription.getKey('p256dh')
          ? btoa(String.fromCharCode(...new Uint8Array(subscription.getKey('p256dh')!)))
          : '',
        auth_key: subscription.getKey('auth')
          ? btoa(String.fromCharCode(...new Uint8Array(subscription.getKey('auth')!)))
          : '',
        device_type: this.getDeviceType(),
        user_agent: navigator.userAgent,
      };

      const { error } = await supabase
        .from('push_subscriptions')
        .upsert(subscriptionData, {
          onConflict: 'user_id,endpoint',
        });

      if (error) throw error;
    } catch (error) {
      console.error('Error saving subscription:', error);
      throw error;
    }
  }

  private async removeSubscription(subscription: PushSubscription): Promise<void> {
    try {
      const { error } = await supabase
        .from('push_subscriptions')
        .delete()
        .eq('endpoint', subscription.endpoint);

      if (error) throw error;
    } catch (error) {
      console.error('Error removing subscription:', error);
      throw error;
    }
  }

  async sendNotification(
    userId: string,
    template: string,
    data: Record<string, any>,
    language: string = 'en'
  ): Promise<boolean> {
    try {
      const response = await fetch('/api/push/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          template,
          data,
          language,
        }),
      });

      if (!response.ok) throw new Error('Failed to send notification');

      const result = await response.json();
      return result.success;
    } catch (error) {
      console.error('Error sending notification:', error);
      return false;
    }
  }

  async sendDirectNotification(
    userId: string,
    notification: PushNotificationData
  ): Promise<boolean> {
    try {
      const response = await fetch('/api/push/send-direct', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          notification,
        }),
      });

      if (!response.ok) throw new Error('Failed to send notification');

      const result = await response.json();
      return result.success;
    } catch (error) {
      console.error('Error sending direct notification:', error);
      return false;
    }
  }

  async requestPermission(): Promise<boolean> {
    if (!('Notification' in window)) {
      return false;
    }

    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }

  getPermissionStatus(): NotificationPermission {
    return Notification.permission;
  }

  isSubscribed(): boolean {
    return !!this.subscription;
  }

  async getSubscription(): Promise<PushSubscription | null> {
    if (!this.subscription && this.registration) {
      this.subscription = await this.registration.pushManager.getSubscription();
    }
    return this.subscription;
  }

  private getDeviceType(): string {
    const userAgent = navigator.userAgent.toLowerCase();
    if (/iphone|ipad|ipod/.test(userAgent)) return 'ios';
    if (/android/.test(userAgent)) return 'android';
    if (/win/.test(userAgent)) return 'windows';
    if (/mac/.test(userAgent)) return 'macos';
    return 'web';
  }

  private urlBase64ToUint8Array(base64String: string): Uint8Array {
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
  }

  // Notification templates
  async getTemplate(name: string, language: string = 'en'): Promise<NotificationTemplate | null> {
    try {
      const { data, error } = await supabase
        .from('notification_templates')
        .select('*')
        .eq('name', name)
        .eq('language', language)
        .eq('is_active', true)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error getting template:', error);
      return null;
    }
  }

  async renderTemplate(
    template: NotificationTemplate,
    data: Record<string, any>
  ): Promise<PushNotificationData> {
    const renderText = (template: string, data: Record<string, any>): string => {
      return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
        return data[key] || match;
      });
    };

    return {
      title: renderText(template.titleTemplate, data),
      body: renderText(template.bodyTemplate, data),
      icon: '/logo.png',
      badge: '/badge.png',
      data: template.dataTemplate ? { ...template.dataTemplate, ...data } : data,
    };
  }

  // Schedule notifications
  async scheduleNotification(
    userId: string,
    template: string,
    data: Record<string, any>,
    scheduledFor: Date,
    language: string = 'en'
  ): Promise<string | null> {
    try {
      const response = await fetch('/api/push/schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          template,
          data,
          scheduledFor: scheduledFor.toISOString(),
          language,
        }),
      });

      if (!response.ok) throw new Error('Failed to schedule notification');

      const result = await response.json();
      return result.scheduleId;
    } catch (error) {
      console.error('Error scheduling notification:', error);
      return null;
    }
  }

  // Cancel scheduled notification
  async cancelScheduledNotification(scheduleId: string): Promise<boolean> {
    try {
      const response = await fetch('/api/push/unschedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scheduleId }),
      });

      if (!response.ok) throw new Error('Failed to cancel notification');

      return true;
    } catch (error) {
      console.error('Error canceling scheduled notification:', error);
      return false;
    }
  }

  // Local notification (when service worker is not available)
  showLocalNotification(notification: PushNotificationData): void {
    if (this.getPermissionStatus() === 'granted') {
      const n = new Notification(notification.title, {
        body: notification.body,
        icon: notification.icon,
        badge: notification.badge,
        tag: notification.tag,
        data: notification.data,
        actions: notification.actions,
      });

      if (notification.data?.url) {
        n.onclick = () => {
          window.open(notification.data.url, '_blank');
          n.close();
        };
      }

      // Auto-close after 5 seconds
      setTimeout(() => n.close(), 5000);
    }
  }
}

// Export singleton instance
export const pushNotificationManager = PushNotificationManager.getInstance();

// Convenience functions
export const initializePushNotifications = () => pushNotificationManager.initialize();
export const subscribeToPush = () => pushNotificationManager.subscribeToPush();
export const unsubscribeFromPush = () => pushNotificationManager.unsubscribeFromPush();
export const sendNotification = (userId: string, template: string, data: Record<string, any>, language?: string) =>
  pushNotificationManager.sendNotification(userId, template, data, language);
export const requestNotificationPermission = () => pushNotificationManager.requestPermission();
export const showLocalNotification = (notification: PushNotificationData) =>
  pushNotificationManager.showLocalNotification(notification);