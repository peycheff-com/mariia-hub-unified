import React, { useState, useEffect, useCallback } from 'react';
import {
  Bell,
  BellRing,
  BellOff,
  Calendar,
  Clock,
  MapPin,
  Star,
  Gift,
  Tag,
  Settings,
  CheckCircle,
  X,
  Info,
  ChevronRight,
  Sparkles
} from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/components/ui/use-toast';

interface PushNotificationManagerProps {
  className?: string;
}

interface NotificationPreferences {
  enabled: boolean;
  appointmentReminders: boolean;
  appointmentConfirmations: boolean;
  availabilityAlerts: boolean;
  promotions: boolean;
  seasonalOffers: boolean;
  personalizedOffers: boolean;
  locationBasedOffers: boolean;
  loyaltyRewards: boolean;
  newServices: boolean;
  quietHours: {
    enabled: boolean;
    start: string;
    end: string;
  };
}

interface ScheduledNotification {
  id: string;
  type: string;
  title: string;
  body: string;
  scheduledTime: Date;
  data?: any;
  recurring?: boolean;
}

export function PushNotificationManager({ className = '' }: PushNotificationManagerProps) {
  const { t } = useTranslation();
  const { toast } = useToast();

  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [subscription, setSubscription] = useState<PushSubscription | null>(null);
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    enabled: false,
    appointmentReminders: true,
    appointmentConfirmations: true,
    availabilityAlerts: true,
    promotions: false,
    seasonalOffers: true,
    personalizedOffers: false,
    locationBasedOffers: false,
    loyaltyRewards: true,
    newServices: true,
    quietHours: {
      enabled: false,
      start: '22:00',
      end: '08:00',
    },
  });

  const [scheduledNotifications, setScheduledNotifications] = useState<ScheduledNotification[]>([]);
  const [showSettingsDialog, setShowSettingsDialog] = useState(false);
  const [showTestDialog, setShowTestDialog] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);

  useEffect(() => {
    // Check initial notification aria-live="polite" aria-atomic="true" permission
    if ('Notification' in window) {
      setPermission(Notification.permission);
    }

    // Load saved preferences
    loadNotificationPreferences();

    // Load scheduled notification aria-live="polite" aria-atomic="true"s
    loadScheduledNotifications();

    // Check for existing push subscription
    checkPushSubscription();
  }, []);

  const loadNotificationPreferences = () => {
    try {
      const stored = localStorage.getItem('notification aria-live="polite" aria-atomic="true"-preferences');
      if (stored) {
        const savedPrefs = JSON.parse(stored);
        setPreferences({ ...preferences, ...savedPrefs });
      }
    } catch (error) {
      console.error('Failed to load notification aria-live="polite" aria-atomic="true" preferences:', error);
    }
  };

  const loadScheduledNotifications = () => {
    try {
      const stored = localStorage.getItem('scheduled-notification aria-live="polite" aria-atomic="true"s');
      if (stored) {
        const notification aria-live="polite" aria-atomic="true"s = JSON.parse(stored);
        setScheduledNotifications(notifications.map((n: any) => ({
          ...n,
          scheduledTime: new Date(n.scheduledTime)
        })));
      }
    } catch (error) {
      console.error('Failed to load scheduled notifications:', error);
    }
  };

  const checkPushSubscription = async () => {
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      try {
        const registration = await navigator.serviceWorker.ready;
        const existingSubscription = await registration.pushManager.getSubscription();
        setSubscription(existingSubscription);
      } catch (error) {
        console.error('Failed to check push subscription:', error);
      }
    }
  };

  const requestNotificationPermission = async () => {
    if (!('Notification' in window)) {
      toast({
        title: t('pushNotifications.notSupported'),
        description: t('pushNotifications.notSupportedDesc'),
        variant: 'destructive',
      });
      return false;
    }

    setIsRegistering(true);

    try {
      const permission = await Notification.requestPermission();
      setPermission(permission);

      if (permission === 'granted') {
        // Subscribe to push notification aria-live="polite" aria-atomic="true"s
        const pushSubscription = await subscribeToPushNotifications();
        if (pushSubscription) {
          setSubscription(pushSubscription);

          // Update preferences
          const updatedPrefs = { ...preferences, enabled: true };
          setPreferences(updatedPrefs);
          saveNotificationPreferences(updatedPrefs);

          toast({
            title: t('pushNotifications.enabled'),
            description: t('pushNotifications.enabledDesc'),
          });

          // Send welcome notification aria-live="polite" aria-atomic="true"
          await sendWelcomeNotification();
          return true;
        }
      } else if (permission === 'denied') {
        toast({
          title: t('pushNotifications.denied'),
          description: t('pushNotifications.deniedDesc'),
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Failed to request notification aria-live="polite" aria-atomic="true" permission:', error);
      toast({
        title: t('pushNotifications.error'),
        description: t('pushNotifications.errorDesc'),
        variant: 'destructive',
      });
    } finally {
      setIsRegistering(false);
    }

    return false;
  };

  const subscribeToPushNotifications = async (): Promise<PushSubscription | null> => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      return null;
    }

    try {
      const registration = await navigator.serviceWorker.ready;

      // This would normally use your VAPID public key
      const applicationServerKey = urlB64ToUint8Array(
        'BMZFTlG4qKlHc2x9h2y1r2e3g4h5i6j7k8l9m0n1o2p3q4r5s6t7u8v9w0x1y2z3'
      );

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: applicationServerKey,
      });

      // Send subscription to server
      await fetch('/api/notification aria-live="polite" aria-atomic="true"s/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(subscription),
      });

      return subscription;
    } catch (error) {
      console.error('Failed to subscribe to push notifications:', error);
      return null;
    }
  };

  const urlB64ToUint8Array = (base64String: string): Uint8Array => {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }

    return outputArray;
  };

  const sendWelcomeNotification = async () => {
    if (!subscription) return;

    try {
      await fetch('/api/notification aria-live="polite" aria-atomic="true"s/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subscription,
          notification: {
            title: t('pushNotifications.welcomeTitle'),
            body: t('pushNotifications.welcomeBody'),
            icon: '/icon-192x192.png',
            badge: '/badge-72x72.png',
            tag: 'welcome',
            data: {
              type: 'welcome',
              url: '/dashboard',
            },
          },
        }),
      });
    } catch (error) {
      console.error('Failed to send welcome notification:', error);
    }
  };

  const scheduleAppointmentReminder = async (appointmentData: {
    id: string;
    serviceName: string;
    dateTime: Date;
  }) => {
    const reminderTime = new Date(appointmentData.dateTime.getTime() - 24 * 60 * 60 * 1000); // 24 hours before

    if (reminderTime <= new Date()) return;

    const notification: ScheduledNotification = {
      id: `reminder-${appointmentData.id}`,
      type: 'appointment-reminder',
      title: t('pushNotifications.appointmentReminderTitle'),
      body: t('pushNotifications.appointmentReminderBody', {
        service: appointmentData.serviceName,
        time: appointmentData.dateTime.toLocaleString(),
      }),
      scheduledTime: reminderTime,
      data: {
        appointmentId: appointmentData.id,
        type: 'appointment-reminder',
      },
    };

    const updated = [...scheduledNotifications, notification aria-live="polite" aria-atomic="true"];
    setScheduledNotifications(updated);
    localStorage.setItem('scheduled-notification aria-live="polite" aria-atomic="true"s', JSON.stringify(updated));

    // Schedule with service worker
    if ('serviceWorker' in navigator) {
      const registration = await navigator.serviceWorker.ready;
      registration.active?.postMessage({
        type: 'SCHEDULE_NOTIFICATION',
        payload: notification aria-live="polite" aria-atomic="true",
      });
    }
  };

  const schedulePromotionalNotification = async (promotionData: {
    title: string;
    body: string;
    scheduledTime: Date;
    type: string;
  }) => {
    const notification: ScheduledNotification = {
      id: `promo-${Date.now()}`,
      type: promotionData.type,
      title: promotionData.title,
      body: promotionData.body,
      scheduledTime: promotionData.scheduledTime,
      data: {
        type: promotionData.type,
        url: '/promotions',
      },
    };

    const updated = [...scheduledNotifications, notification aria-live="polite" aria-atomic="true"];
    setScheduledNotifications(updated);
    localStorage.setItem('scheduled-notification aria-live="polite" aria-atomic="true"s', JSON.stringify(updated));
  };

  const testNotification = async (type: string) => {
    if (!subscription || permission !== 'granted') {
      toast({
        title: t('pushNotifications.notEnabled'),
        description: t('pushNotifications.enableFirst'),
        variant: 'destructive',
      });
      return;
    }

    let notification aria-live="polite" aria-atomic="true"Data;

    switch (type) {
      case 'appointment-reminder':
        notification aria-live="polite" aria-atomic="true"Data = {
          title: t('pushNotifications.testAppointmentTitle'),
          body: t('pushNotifications.testAppointmentBody'),
          icon: '/icon-192x192.png',
          badge: '/badge-72x72.png',
          tag: 'test-appointment',
          data: { type: 'test-appointment' },
        };
        break;

      case 'promotion':
        notification aria-live="polite" aria-atomic="true"Data = {
          title: t('pushNotifications.testPromotionTitle'),
          body: t('pushNotifications.testPromotionBody'),
          icon: '/icon-192x192.png',
          badge: '/badge-72x72.png',
          tag: 'test-promotion',
          data: { type: 'test-promotion', url: '/promotions' },
          actions: [
            { action: 'view', title: t('pushNotifications.viewOffer') },
            { action: 'dismiss', title: t('pushNotifications.dismiss') },
          ],
        };
        break;

      case 'location-based':
        notification aria-live="polite" aria-atomic="true"Data = {
          title: t('pushNotifications.testLocationTitle'),
          body: t('pushNotifications.testLocationBody'),
          icon: '/icon-192x192.png',
          badge: '/badge-72x72.png',
          tag: 'test-location',
          data: { type: 'test-location', url: '/beauty' },
        };
        break;

      default:
        return;
    }

    try {
      await fetch('/api/notification aria-live="polite" aria-atomic="true"s/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subscription,
          notification: notification aria-live="polite" aria-atomic="true"Data,
        }),
      });

      toast({
        title: t('pushNotifications.testSent'),
        description: t('pushNotifications.testSentDesc'),
      });
    } catch (error) {
      console.error('Failed to send test notification:', error);
      toast({
        title: t('pushNotifications.testFailed'),
        description: t('pushNotifications.testFailedDesc'),
        variant: 'destructive',
      });
    }
  };

  const updatePreferences = async (newPreferences: Partial<NotificationPreferences>) => {
    const updated = { ...preferences, ...newPreferences };
    setPreferences(updated);
    saveNotificationPreferences(updated);

    // Send updated preferences to server
    if (subscription) {
      try {
        await fetch('/api/notification aria-live="polite" aria-atomic="true"s/preferences', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            subscription,
            preferences: updated,
          }),
        });
      } catch (error) {
        console.error('Failed to update notification aria-live="polite" aria-atomic="true" preferences:', error);
      }
    }
  };

  const saveNotificationPreferences = (prefs: NotificationPreferences) => {
    try {
      localStorage.setItem('notification aria-live="polite" aria-atomic="true"-preferences', JSON.stringify(prefs));
    } catch (error) {
      console.error('Failed to save notification aria-live="polite" aria-atomic="true" preferences:', error);
    }
  };

  const unsubscribeFromNotifications = async () => {
    if (subscription) {
      try {
        await subscription.unsubscribe();
        await fetch('/api/notification aria-live="polite" aria-atomic="true"s/unsubscribe', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ subscription }),
        });
      } catch (error) {
        console.error('Failed to unsubscribe from notifications:', error);
      }
    }

    setSubscription(null);
    setPermission('denied');
    updatePreferences({ enabled: false });

    toast({
      title: t('pushNotifications.disabled'),
      description: t('pushNotifications.disabledDesc'),
    });
  };

  const isInQuietHours = () => {
    if (!preferences.quietHours.enabled) return false;

    const now = new Date();
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

    return currentTime >= preferences.quietHours.start || currentTime <= preferences.quietHours.end;
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Permission Status */}
      <Card className="border-l-4 border-l-primary">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {permission === 'granted' ? (
                <BellRing className="h-6 w-6 text-green-600" />
              ) : permission === 'denied' ? (
                <BellOff className="h-6 w-6 text-red-600" />
              ) : (
                <Bell className="h-6 w-6 text-yellow-600" />
              )}
              <div>
                <CardTitle className="text-lg">
                  {permission === 'granted'
                    ? t('pushNotifications.enabled')
                    : permission === 'denied'
                      ? t('pushNotifications.disabled')
                      : t('pushNotifications.notEnabled')
                  }
                </CardTitle>
                <CardDescription>
                  {permission === 'granted'
                    ? t('pushNotifications.enabledDesc')
                    : permission === 'denied'
                      ? t('pushNotifications.disabledDesc')
                      : t('pushNotifications.notEnabledDesc')
                  }
                </CardDescription>
              </div>
            </div>

            {permission === 'default' && (
              <Button
                onClick={requestNotificationPermission}
                disabled={isRegistering}
              >
                {isRegistering ? (
                  <>
                    <div className="h-4 w-4 mr-2 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    {t('pushNotifications.enabling')}
                  </>
                ) : (
                  <>
                    <Bell className="h-4 w-4 mr-2" />
                    {t('pushNotifications.enable')}
                  </>
                )}
              </Button>
            )}

            {permission === 'granted' && (
              <div className="flex gap-2">
                <Dialog open={showSettingsDialog} onOpenChange={setShowSettingsDialog}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm">
                      <Settings className="h-4 w-4 mr-2" />
                      {t('pushNotifications.settings')}
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>{t('pushNotifications.notification aria-live="polite" aria-atomic="true"Settings')}</DialogTitle>
                      <DialogDescription>
                        {t('pushNotifications.notification aria-live="polite" aria-atomic="true"SettingsDesc')}
                      </DialogDescription>
                    </DialogHeader>
                    <Tabs defaultValue="preferences" className="w-full">
                      <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="preferences">{t('pushNotifications.preferences')}</TabsTrigger>
                        <TabsTrigger value="schedule">{t('pushNotifications.schedule')}</TabsTrigger>
                        <TabsTrigger value="test">{t('pushNotifications.test')}</TabsTrigger>
                      </TabsList>

                      <TabsContent value="preferences" className="space-y-4">
                        <div className="space-y-4">
                          {[
                            { key: 'appointmentReminders', icon: Calendar, label: t('pushNotifications.appointmentReminders'), desc: t('pushNotifications.appointmentRemindersDesc') },
                            { key: 'appointmentConfirmations', icon: CheckCircle, label: t('pushNotifications.appointmentConfirmations'), desc: t('pushNotifications.appointmentConfirmationsDesc') },
                            { key: 'availabilityAlerts', icon: Clock, label: t('pushNotifications.availabilityAlerts'), desc: t('pushNotifications.availabilityAlertsDesc') },
                            { key: 'promotions', icon: Tag, label: t('pushNotifications.promotions'), desc: t('pushNotifications.promotionsDesc') },
                            { key: 'seasonalOffers', icon: Gift, label: t('pushNotifications.seasonalOffers'), desc: t('pushNotifications.seasonalOffersDesc') },
                            { key: 'personalizedOffers', icon: Star, label: t('pushNotifications.personalizedOffers'), desc: t('pushNotifications.personalizedOffersDesc') },
                            { key: 'locationBasedOffers', icon: MapPin, label: t('pushNotifications.locationBasedOffers'), desc: t('pushNotifications.locationBasedOffersDesc') },
                            { key: 'loyaltyRewards', icon: Sparkles, label: t('pushNotifications.loyaltyRewards'), desc: t('pushNotifications.loyaltyRewardsDesc') },
                            { key: 'newServices', icon: Bell, label: t('pushNotifications.newServices'), desc: t('pushNotifications.newServicesDesc') },
                          ].map(({ key, icon: Icon, label, desc }) => (
                            <div key={key} className="flex items-center justify-between space-x-2">
                              <div className="flex items-center space-x-3 flex-1">
                                <Icon className="h-4 w-4 text-muted-foreground" />
                                <div>
                                  <div className="font-medium">{label}</div>
                                  <div className="text-sm text-muted-foreground">{desc}</div>
                                </div>
                              </div>
                              <Switch
                                checked={preferences[key as keyof NotificationPreferences] as boolean}
                                onCheckedChange={(checked) =>
                                  updatePreferences({ [key]: checked })
                                }
                              />
                            </div>
                          ))}

                          {/* Quiet Hours */}
                          <div className="border-t pt-4">
                            <div className="flex items-center justify-between space-x-2 mb-3">
                              <div>
                                <div className="font-medium">{t('pushNotifications.quietHours')}</div>
                                <div className="text-sm text-muted-foreground">
                                  {t('pushNotifications.quietHoursDesc')}
                                </div>
                              </div>
                              <Switch
                                checked={preferences.quietHours.enabled}
                                onCheckedChange={(checked) =>
                                  updatePreferences({
                                    quietHours: { ...preferences.quietHours, enabled: checked }
                                  })
                                }
                              />
                            </div>
                            {preferences.quietHours.enabled && (
                              <div className="grid grid-cols-2 gap-2">
                                <div>
                                  <label className="text-sm font-medium" htmlFor="t-pushnotification aria-live="polite" aria-atomic="true"s-start">{t('pushNotifications.start')}</label>
                                  <input
                                    type="time"
                                    value={preferences.quietHours.start}
                                    onChange={(e) =>
                                      updatePreferences({
                                        quietHours: { ...preferences.quietHours, start: e.target.value }
                                      })
                                    }
                                    className="w-full p-2 border rounded"
                                  />
                                </div>
                                <div>
                                  <label className="text-sm font-medium" htmlFor="t-pushnotification aria-live="polite" aria-atomic="true"s-end">{t('pushNotifications.end')}</label>
                                  <input
                                    type="time"
                                    value={preferences.quietHours.end}
                                    onChange={(e) =>
                                      updatePreferences({
                                        quietHours: { ...preferences.quietHours, end: e.target.value }
                                      })
                                    }
                                    className="w-full p-2 border rounded"
                                  />
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </TabsContent>

                      <TabsContent value="schedule" className="space-y-4">
                        <div className="space-y-4">
                          <h3 className="font-medium">{t('pushNotifications.scheduledNotifications')}</h3>
                          {scheduledNotifications.length > 0 ? (
                            scheduledNotifications.map(notification aria-live="polite" aria-atomic="true" => (
                              <div key={notification.id} className="p-3 border rounded-lg">
                                <div className="flex justify-between items-start">
                                  <div>
                                    <div className="font-medium">{notification.title}</div>
                                    <div className="text-sm text-muted-foreground">{notification.body}</div>
                                    <div className="text-xs text-muted-foreground mt-1">
                                      {notification.scheduledTime.toLocaleString()}
                                    </div>
                                  </div>
                                  <Badge variant="outline">{notification.type}</Badge>
                                </div>
                              </div>
                            ))
                          ) : (
                            <p className="text-muted-foreground">{t('pushNotifications.noScheduledNotifications')}</p>
                          )}
                        </div>
                      </TabsContent>

                      <TabsContent value="test" className="space-y-4">
                        <div className="space-y-4">
                          <h3 className="font-medium">{t('pushNotifications.testNotifications')}</h3>
                          <div className="grid grid-cols-1 gap-2">
                            <Button
                              variant="outline"
                              onClick={() => testNotification('appointment-reminder')}
                              className="justify-start"
                            >
                              <Calendar className="h-4 w-4 mr-2" />
                              {t('pushNotifications.testAppointmentReminder')}
                            </Button>
                            <Button
                              variant="outline"
                              onClick={() => testNotification('promotion')}
                              className="justify-start"
                            >
                              <Tag className="h-4 w-4 mr-2" />
                              {t('pushNotifications.testPromotion')}
                            </Button>
                            <Button
                              variant="outline"
                              onClick={() => testNotification('location-based')}
                              className="justify-start"
                            >
                              <MapPin className="h-4 w-4 mr-2" />
                              {t('pushNotifications.testLocationBased')}
                            </Button>
                          </div>
                        </div>
                      </TabsContent>
                    </Tabs>

                    <div className="flex justify-between pt-4 border-t">
                      <Button variant="outline" onClick={unsubscribeFromNotifications}>
                        <BellOff className="h-4 w-4 mr-2" />
                        {t('pushNotifications.unsubscribe')}
                      </Button>
                      <Button onClick={() => setShowSettingsDialog(false)}>
                        {t('pushNotifications.save')}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            )}
          </div>
        </CardHeader>
      </Card>

      {/* Quiet Hours Alert */}
      {isInQuietHours() && (
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            {t('pushNotifications.quietHoursActive', {
              start: preferences.quietHours.start,
              end: preferences.quietHours.end,
            })}
          </AlertDescription>
        </Alert>
      )}

      {/* Notification Categories */}
      {permission === 'granted' && (
        <Card>
          <CardHeader>
            <CardTitle>{t('pushNotifications.notification aria-live="polite" aria-atomic="true"Types')}</CardTitle>
            <CardDescription>
              {t('pushNotifications.notification aria-live="polite" aria-atomic="true"TypesDesc')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="p-4 border rounded-lg">
                <div className="flex items-center gap-3 mb-2">
                  <Calendar className="h-5 w-5 text-blue-600" />
                  <div className="font-medium">{t('pushNotifications.appointments')}</div>
                </div>
                <p className="text-sm text-muted-foreground mb-3">
                  {t('pushNotifications.appointmentsDesc')}
                </p>
                <div className="space-y-2">
                  <Badge variant={preferences.appointmentReminders ? 'default' : 'secondary'}>
                    {t('pushNotifications.reminders')}
                  </Badge>
                  <Badge variant={preferences.appointmentConfirmations ? 'default' : 'secondary'}>
                    {t('pushNotifications.confirmations')}
                  </Badge>
                </div>
              </div>

              <div className="p-4 border rounded-lg">
                <div className="flex items-center gap-3 mb-2">
                  <Tag className="h-5 w-5 text-green-600" />
                  <div className="font-medium">{t('pushNotifications.promotions')}</div>
                </div>
                <p className="text-sm text-muted-foreground mb-3">
                  {t('pushNotifications.promotionsDesc')}
                </p>
                <div className="space-y-2">
                  <Badge variant={preferences.promotions ? 'default' : 'secondary'}>
                    {t('pushNotifications.general')}
                  </Badge>
                  <Badge variant={preferences.seasonalOffers ? 'default' : 'secondary'}>
                    {t('pushNotifications.seasonal')}
                  </Badge>
                </div>
              </div>

              <div className="p-4 border rounded-lg">
                <div className="flex items-center gap-3 mb-2">
                  <MapPin className="h-5 w-5 text-purple-600" />
                  <div className="font-medium">{t('pushNotifications.locationBased')}</div>
                </div>
                <p className="text-sm text-muted-foreground mb-3">
                  {t('pushNotifications.locationBasedDesc')}
                </p>
                <div className="space-y-2">
                  <Badge variant={preferences.locationBasedOffers ? 'default' : 'secondary'}>
                    {t('pushNotifications.nearby')}
                  </Badge>
                  <Badge variant={preferences.availabilityAlerts ? 'default' : 'secondary'}>
                    {t('pushNotifications.availability')}
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Feature Information */}
      {permission !== 'granted' && (
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            {t('pushNotifications.enableInfo')}
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}