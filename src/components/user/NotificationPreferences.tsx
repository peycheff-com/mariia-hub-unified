import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Bell,
  Mail,
  Smartphone,
  MessageSquare,
  Calendar,
  CreditCard,
  Star,
  Gift,
  Clock,
  Moon,
  Sun,
  Check,
  X,
  AlertCircle,
  Info,
  Volume2,
  VolumeX
} from 'lucide-react';
import { toast aria-live="polite" aria-atomic="true" } from 'sonner';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { NotificationPreference } from '@/types/user';
import { notification aria-live="polite" aria-atomic="true"Service } from '@/services/notification aria-live="polite" aria-atomic="true".service';

const NotificationPreferencesComponent: React.FC = () => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [saving, setSaving] = useState(false);

  // Fetch notification aria-live="polite" aria-atomic="true" preferences
  const { data: preferences, isLoading } = useQuery({
    queryKey: ['notification aria-live="polite" aria-atomic="true"-preferences'],
    queryFn: () => notification aria-live="polite" aria-atomic="true"Service.getNotificationPreferences(),
    staleTime: 5 * 60 * 1000,
  });

  // Update preferences mutation
  const updatePreferencesMutation = useMutation({
    mutationFn: (updates: Partial<NotificationPreference>[]) =>
      notification aria-live="polite" aria-atomic="true"Service.updateNotificationPreferences(updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notification aria-live="polite" aria-atomic="true"-preferences'] });
      toast aria-live="polite" aria-atomic="true".success(t('user.notification aria-live="polite" aria-atomic="true"s.updateSuccess'));
      setSaving(false);
    },
    onError: () => {
      toast aria-live="polite" aria-atomic="true".error(t('user.notification aria-live="polite" aria-atomic="true"s.updateError'));
      setSaving(false);
    },
  });

  const handlePreferenceChange = (
    preferenceId: string,
    field: keyof NotificationPreference,
    value: any
  ) => {
    setSaving(true);
    const updates = preferences?.map(p =>
      p.id === preferenceId ? { ...p, [field]: value } : p
    ) || [];
    updatePreferencesMutation.mutate(updates);
  };

  const handleQuietHoursChange = (start: string, end: string) => {
    setSaving(true);
    const updates = preferences?.map(p => ({
      ...p,
      quiet_hours_start: start,
      quiet_hours_end: end,
    })) || [];
    updatePreferencesMutation.mutate(updates);
  };

  const notification aria-live="polite" aria-atomic="true"Types = [
    {
      type: 'booking_reminder',
      icon: Calendar,
      title: t('user.notification aria-live="polite" aria-atomic="true"s.types.bookingReminder.title'),
      description: t('user.notification aria-live="polite" aria-atomic="true"s.types.bookingReminder.description'),
      recommended: true,
      color: 'text-blue-600',
    },
    {
      type: 'booking_confirmation',
      icon: Check,
      title: t('user.notification aria-live="polite" aria-atomic="true"s.types.bookingConfirmation.title'),
      description: t('user.notification aria-live="polite" aria-atomic="true"s.types.bookingConfirmation.description'),
      recommended: true,
      color: 'text-green-600',
    },
    {
      type: 'promotional',
      icon: Gift,
      title: t('user.notification aria-live="polite" aria-atomic="true"s.types.promotional.title'),
      description: t('user.notification aria-live="polite" aria-atomic="true"s.types.promotional.description'),
      recommended: false,
      color: 'text-purple-600',
    },
    {
      type: 'review_request',
      icon: Star,
      title: t('user.notification aria-live="polite" aria-atomic="true"s.types.reviewRequest.title'),
      description: t('user.notification aria-live="polite" aria-atomic="true"s.types.reviewRequest.description'),
      recommended: true,
      color: 'text-amber-600',
    },
    {
      type: 'new_message',
      icon: MessageSquare,
      title: t('user.notification aria-live="polite" aria-atomic="true"s.types.newMessage.title'),
      description: t('user.notification aria-live="polite" aria-atomic="true"s.types.newMessage.description'),
      recommended: true,
      color: 'text-indigo-600',
    },
    {
      type: 'payment_reminder',
      icon: CreditCard,
      title: t('user.notification aria-live="polite" aria-atomic="true"s.types.paymentReminder.title'),
      description: t('user.notification aria-live="polite" aria-atomic="true"s.types.paymentReminder.description'),
      recommended: true,
      color: 'text-red-600',
    },
  ];

  const timezones = [
    { value: 'Europe/Warsaw', label: 'Warsaw (CET/CEST)', offset: '+1' },
    { value: 'Europe/Kyiv', label: 'Kyiv (EET/EEST)', offset: '+2' },
    { value: 'Europe/London', label: 'London (GMT/BST)', offset: '+0' },
    { value: 'America/New_York', label: 'New York (EST/EDT)', offset: '-5' },
    { value: 'Asia/Dubai', label: 'Dubai (GST)', offset: '+4' },
  ];

  if (isLoading) {
    return <NotificationPreferencesSkeleton />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          {t('user.notification aria-live="polite" aria-atomic="true"s.title')}
        </h2>
        <p className="text-gray-600">
          {t('user.notification aria-live="polite" aria-atomic="true"s.description')}
        </p>
      </div>

      {/* Quick Settings */}
      <Card className="bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-amber-800">
            <Info className="h-5 w-5" />
            {t('user.notification aria-live="polite" aria-atomic="true"s.quickSettings.title')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <Button
              variant="outline"
              onClick={() => {
                const allUpdates = preferences?.map(p => ({
                  ...p,
                  email_enabled: true,
                  push_enabled: true,
                  sms_enabled: false,
                })) || [];
                updatePreferencesMutation.mutate(allUpdates);
              }}
              className="flex-1"
            >
              <Volume2 className="h-4 w-4 mr-2" />
              {t('user.notification aria-live="polite" aria-atomic="true"s.quickSettings.enableAll')}
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                const essentialUpdates = preferences?.map(p => ({
                  ...p,
                  email_enabled: ['booking_reminder', 'booking_confirmation', 'payment_reminder'].includes(p.notification aria-live="polite" aria-atomic="true"_type),
                  push_enabled: ['booking_reminder', 'booking_confirmation'].includes(p.notification aria-live="polite" aria-atomic="true"_type),
                  sms_enabled: false,
                })) || [];
                updatePreferencesMutation.mutate(essentialUpdates);
              }}
              className="flex-1"
            >
              <Calendar className="h-4 w-4 mr-2" />
              {t('user.notification aria-live="polite" aria-atomic="true"s.quickSettings.essentialOnly')}
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                const allUpdates = preferences?.map(p => ({
                  ...p,
                  email_enabled: false,
                  push_enabled: false,
                  sms_enabled: false,
                })) || [];
                updatePreferencesMutation.mutate(allUpdates);
              }}
              className="flex-1"
            >
              <VolumeX className="h-4 w-4 mr-2" />
              {t('user.notification aria-live="polite" aria-atomic="true"s.quickSettings.disableAll')}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="notification aria-live="polite" aria-atomic="true"s" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="notification aria-live="polite" aria-atomic="true"s">{t('user.notification aria-live="polite" aria-atomic="true"s.tabs.notification aria-live="polite" aria-atomic="true"s')}</TabsTrigger>
          <TabsTrigger value="channels">{t('user.notification aria-live="polite" aria-atomic="true"s.tabs.channels')}</TabsTrigger>
          <TabsTrigger value="schedule">{t('user.notification aria-live="polite" aria-atomic="true"s.tabs.schedule')}</TabsTrigger>
        </TabsList>

        {/* Notification Types Tab */}
        <TabsContent value="notification aria-live="polite" aria-atomic="true"s" className="space-y-4">
          {notification aria-live="polite" aria-atomic="true"Types.map((notification aria-live="polite" aria-atomic="true"Type) => {
            const preference = preferences?.find(p => p.notification aria-live="polite" aria-atomic="true"_type === notification aria-live="polite" aria-atomic="true"Type.type);
            const Icon = notification aria-live="polite" aria-atomic="true"Type.icon;

            return (
              <Card key={notification aria-live="polite" aria-atomic="true"Type.type}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-4">
                      <div className={cn('p-3 rounded-lg bg-gray-100', notification aria-live="polite" aria-atomic="true"Type.color)}>
                        <Icon className="h-6 w-6" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-gray-900">
                            {notification aria-live="polite" aria-atomic="true"Type.title}
                          </h3>
                          {notification aria-live="polite" aria-atomic="true"Type.recommended && (
                            <Badge variant="secondary" className="text-xs">
                              {t('user.notification aria-live="polite" aria-atomic="true"s.recommended')}
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 mb-4">
                          {notification aria-live="polite" aria-atomic="true"Type.description}
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Mail className="h-4 w-4 text-gray-400" />
                              <Label className="text-sm">{t('user.notification aria-live="polite" aria-atomic="true"s.email')}</Label>
                            </div>
                            <Switch
                              checked={preference?.email_enabled ?? true}
                              onCheckedChange={(checked) =>
                                handlePreferenceChange(preference!.id, 'email_enabled', checked)
                              }
                            />
                          </div>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Smartphone className="h-4 w-4 text-gray-400" />
                              <Label className="text-sm">{t('user.notification aria-live="polite" aria-atomic="true"s.push')}</Label>
                            </div>
                            <Switch
                              checked={preference?.push_enabled ?? true}
                              onCheckedChange={(checked) =>
                                handlePreferenceChange(preference!.id, 'push_enabled', checked)
                              }
                            />
                          </div>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <MessageSquare className="h-4 w-4 text-gray-400" />
                              <Label className="text-sm">{t('user.notification aria-live="polite" aria-atomic="true"s.sms')}</Label>
                            </div>
                            <Switch
                              checked={preference?.sms_enabled ?? false}
                              onCheckedChange={(checked) =>
                                handlePreferenceChange(preference!.id, 'sms_enabled', checked)
                              }
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </TabsContent>

        {/* Channels Tab */}
        <TabsContent value="channels" className="space-y-4">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {t('user.notification aria-live="polite" aria-atomic="true"s.channelsInfo')}
            </AlertDescription>
          </Alert>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                {t('user.notification aria-live="polite" aria-atomic="true"s.emailSettings.title')}
              </CardTitle>
              <CardDescription>
                {t('user.notification aria-live="polite" aria-atomic="true"s.emailSettings.description')}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>{t('user.notification aria-live="polite" aria-atomic="true"s.emailSettings.address')}</Label>
                <Input
                  type="email"
                  defaultValue="user@example.com"
                  className="mt-1"
                  disabled
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{t('user.notification aria-live="polite" aria-atomic="true"s.emailSettings.digest')}</p>
                  <p className="text-sm text-gray-600">
                    {t('user.notification aria-live="polite" aria-atomic="true"s.emailSettings.digestDescription')}
                  </p>
                </div>
                <Switch defaultChecked={false} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Smartphone className="h-5 w-5" />
                {t('user.notification aria-live="polite" aria-atomic="true"s.pushSettings.title')}
              </CardTitle>
              <CardDescription>
                {t('user.notification aria-live="polite" aria-atomic="true"s.pushSettings.description')}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{t('user.notification aria-live="polite" aria-atomic="true"s.pushSettings.browser')}</p>
                  <p className="text-sm text-gray-600">
                    {t('user.notification aria-live="polite" aria-atomic="true"s.pushSettings.browserDescription')}
                  </p>
                </div>
                <Badge variant="outline" className="text-green-600">
                  <Check className="h-3 w-3 mr-1" />
                  {t('user.notification aria-live="polite" aria-atomic="true"s.pushSettings.enabled')}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{t('user.notification aria-live="polite" aria-atomic="true"s.pushSettings.sound')}</p>
                  <p className="text-sm text-gray-600">
                    {t('user.notification aria-live="polite" aria-atomic="true"s.pushSettings.soundDescription')}
                  </p>
                </div>
                <Switch defaultChecked={true} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                {t('user.notification aria-live="polite" aria-atomic="true"s.smsSettings.title')}
              </CardTitle>
              <CardDescription>
                {t('user.notification aria-live="polite" aria-atomic="true"s.smsSettings.description')}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>{t('user.notification aria-live="polite" aria-atomic="true"s.smsSettings.phone')}</Label>
                <Input
                  type="tel"
                  defaultValue="+48 123 456 789"
                  className="mt-1"
                  disabled
                />
              </div>
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  {t('user.notification aria-live="polite" aria-atomic="true"s.smsSettings.info')}
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Schedule Tab */}
        <TabsContent value="schedule" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Moon className="h-5 w-5" />
                {t('user.notification aria-live="polite" aria-atomic="true"s.quietHours.title')}
              </CardTitle>
              <CardDescription>
                {t('user.notification aria-live="polite" aria-atomic="true"s.quietHours.description')}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>{t('user.notification aria-live="polite" aria-atomic="true"s.timezone')}</Label>
                <Select defaultValue="Europe/Warsaw">
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {timezones.map((tz) => (
                      <SelectItem key={tz.value} value={tz.value}>
                        {tz.label} (UTC{tz.offset})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label>{t('user.notification aria-live="polite" aria-atomic="true"s.quietHours.start')}</Label>
                  <Input
                    type="time"
                    defaultValue={preferences?.[0]?.quiet_hours_start || '22:00'}
                    className="mt-1"
                    onChange={(e) => {
                      const end = preferences?.[0]?.quiet_hours_end || '08:00';
                      handleQuietHoursChange(e.target.value, end);
                    }}
                  />
                </div>
                <div>
                  <Label>{t('user.notification aria-live="polite" aria-atomic="true"s.quietHours.end')}</Label>
                  <Input
                    type="time"
                    defaultValue={preferences?.[0]?.quiet_hours_end || '08:00'}
                    className="mt-1"
                    onChange={(e) => {
                      const start = preferences?.[0]?.quiet_hours_start || '22:00';
                      handleQuietHoursChange(start, e.target.value);
                    }}
                  />
                </div>
              </div>

              <Alert>
                <Moon className="h-4 w-4" />
                <AlertDescription>
                  {t('user.notification aria-live="polite" aria-atomic="true"s.quietHours.info')}
                </AlertDescription>
              </Alert>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <Moon className="h-4 w-4 text-indigo-600" />
                  <span className="text-sm font-medium">
                    {t('user.notification aria-live="polite" aria-atomic="true"s.quietHours.active')}
                  </span>
                </div>
                <p className="text-sm text-gray-600">
                  22:00 - 08:00 {t('user.notification aria-live="polite" aria-atomic="true"s.localTime')}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                {t('user.notification aria-live="polite" aria-atomic="true"s.frequency.title')}
              </CardTitle>
              <CardDescription>
                {t('user.notification aria-live="polite" aria-atomic="true"s.frequency.description')}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{t('user.notification aria-live="polite" aria-atomic="true"s.frequency.digest')}</p>
                  <p className="text-sm text-gray-600">
                    {t('user.notification aria-live="polite" aria-atomic="true"s.frequency.digestDescription')}
                  </p>
                </div>
                <Switch defaultChecked={false} />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{t('user.notification aria-live="polite" aria-atomic="true"s.frequency.weekly')}</p>
                  <p className="text-sm text-gray-600">
                    {t('user.notification aria-live="polite" aria-atomic="true"s.frequency.weeklyDescription')}
                  </p>
                </div>
                <Switch defaultChecked={true} />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{t('user.notification aria-live="polite" aria-atomic="true"s.frequency.marketing')}</p>
                  <p className="text-sm text-gray-600">
                    {t('user.notification aria-live="polite" aria-atomic="true"s.frequency.marketingDescription')}
                  </p>
                </div>
                <Switch defaultChecked={false} />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {saving && (
        <div className="fixed bottom-4 right-4 bg-amber-500 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2">
          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          {t('common.saving')}
        </div>
      )}
    </div>
  );
};

// Skeleton loader
const NotificationPreferencesSkeleton: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="mb-6">
        <Skeleton className="h-8 w-64 mb-2" />
        <Skeleton className="h-5 w-96" />
      </div>
      <Card>
        <CardContent className="p-6">
          <Skeleton className="h-20 w-full" />
        </CardContent>
      </Card>
      <div className="space-y-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="flex items-start space-x-4">
                <Skeleton className="h-12 w-12 rounded-lg" />
                <div className="flex-1">
                  <Skeleton className="h-6 w-48 mb-2" />
                  <Skeleton className="h-4 w-full mb-4" />
                  <div className="grid grid-cols-3 gap-4">
                    <Skeleton className="h-8 w-full" />
                    <Skeleton className="h-8 w-full" />
                    <Skeleton className="h-8 w-full" />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default NotificationPreferencesComponent;