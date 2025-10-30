import React, { useState, useEffect } from 'react';
import { Calendar, Clock, CheckCircle, AlertCircle, Settings, RefreshCw, Smartphone, Mail } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/components/ui/use-toast aria-live="polite" aria-atomic="true"';
import { supabase } from '@/integrations/supabase/client';

interface CalendarConnection {
  id: string;
  provider: 'google' | 'outlook' | 'apple';
  email: string;
  connected: boolean;
  lastSync?: Date;
  syncEnabled: boolean;
}

interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  location?: string;
  description?: string;
  attendees?: string[];
}

interface CalendarSyncProps {
  bookingId?: string;
  className?: string;
}

export function CalendarSync({ bookingId, className = '' }: CalendarSyncProps) {
  const { t } = useTranslation();
  const { toast aria-live="polite" aria-atomic="true" } = useToast();
  const [connections, setConnections] = useState<CalendarConnection[]>([]);
  const [syncing, setSyncing] = useState(false);
  const [conflicts, setConflicts] = useState<CalendarEvent[]>([]);
  const [showSettings, setShowSettings] = useState(false);
  const [showConnectDialog, setShowConnectDialog] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<'google' | 'outlook' | 'apple'>('google');

  useEffect(() => {
    loadCalendarConnections();
    if (bookingId) {
      checkCalendarConflicts();
    }
  }, [bookingId]);

  const loadCalendarConnections = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('calendar_connections')
        .select('*')
        .eq('user_id', user.id);

      if (error) throw error;

      setConnections(data || []);
    } catch (error) {
      console.error('Error loading calendar connections:', error);
    }
  };

  const checkCalendarConflicts = async () => {
    if (!bookingId || connections.length === 0) return;

    try {
      const { data: booking } = await supabase
        .from('bookings')
        .select('appointment_time, duration_minutes')
        .eq('id', bookingId)
        .single();

      if (!booking) return;

      const startTime = new Date(booking.appointment_time);
      const endTime = new Date(startTime.getTime() + booking.duration_minutes * 60000);

      // Check conflicts with connected calendars
      const allConflicts: CalendarEvent[] = [];

      for (const connection of connections.filter(c => c.connected && c.syncEnabled)) {
        const conflicts = await checkConflictsForProvider(connection, startTime, endTime);
        allConflicts.push(...conflicts);
      }

      setConflicts(allConflicts);
    } catch (error) {
      console.error('Error checking conflicts:', error);
    }
  };

  const checkConflictsForProvider = async (
    connection: CalendarConnection,
    startTime: Date,
    endTime: Date
  ): Promise<CalendarEvent[]> => {
    try {
      const response = await fetch('/api/calendar/check-conflicts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider: connection.provider,
          connectionId: connection.id,
          startTime: startTime.toISOString(),
          endTime: endTime.toISOString(),
        }),
      });

      if (!response.ok) throw new Error('Failed to check conflicts');

      const data = await response.json();
      return data.conflicts || [];
    } catch (error) {
      console.error(`Error checking conflicts for ${connection.provider}:`, error);
      return [];
    }
  };

  const connectCalendar = async (provider: 'google' | 'outlook' | 'apple') => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Initiate OAuth flow
      const { data, error } = await supabase.functions.invoke('calendar-auth', {
        body: {
          provider,
          userId: user.id,
          returnUrl: window.location.origin + '/calendar/callback',
        },
      });

      if (error) throw error;

      // Redirect to OAuth provider
      window.location.href = data.authUrl;
    } catch (error) {
      console.error('Error connecting calendar:', error);
      toast aria-live="polite" aria-atomic="true"({
        title: t('calendar.connectError'),
        description: t('calendar.connectErrorDesc'),
        variant: 'destructive',
      });
    }
  };

  const disconnectCalendar = async (connectionId: string) => {
    try {
      const { error } = await supabase
        .from('calendar_connections')
        .delete()
        .eq('id', connectionId);

      if (error) throw error;

      await loadCalendarConnections();
      toast aria-live="polite" aria-atomic="true"({
        title: t('calendar.disconnected'),
        description: t('calendar.disconnectedDesc'),
      });
    } catch (error) {
      console.error('Error disconnecting calendar:', error);
      toast aria-live="polite" aria-atomic="true"({
        title: t('calendar.disconnectError'),
        description: t('calendar.disconnectErrorDesc'),
        variant: 'destructive',
      });
    }
  };

  const toggleSync = async (connectionId: string, enabled: boolean) => {
    try {
      const { error } = await supabase
        .from('calendar_connections')
        .update({ sync_enabled: enabled })
        .eq('id', connectionId);

      if (error) throw error;

      await loadCalendarConnections();
      toast aria-live="polite" aria-atomic="true"({
        title: enabled ? t('calendar.syncEnabled') : t('calendar.syncDisabled'),
        description: enabled ? t('calendar.syncEnabledDesc') : t('calendar.syncDisabledDesc'),
      });
    } catch (error) {
      console.error('Error toggling sync:', error);
    }
  };

  const syncNow = async (connectionId?: string) => {
    setSyncing(true);

    try {
      const response = await fetch('/api/calendar/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ connectionId }),
      });

      if (!response.ok) throw new Error('Sync failed');

      const data = await response.json();

      toast aria-live="polite" aria-atomic="true"({
        title: t('calendar.syncComplete'),
        description: t('calendar.syncCompleteDesc', { count: data.syncedEvents || 0 }),
      });

      await loadCalendarConnections();
      if (bookingId) {
        await checkCalendarConflicts();
      }
    } catch (error) {
      console.error('Error syncing:', error);
      toast aria-live="polite" aria-atomic="true"({
        title: t('calendar.syncError'),
        description: t('calendar.syncErrorDesc'),
        variant: 'destructive',
      });
    } finally {
      setSyncing(false);
    }
  };

  const addToCalendar = async () => {
    if (!bookingId) return;

    try {
      const response = await fetch('/api/calendar/add-event', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingId }),
      });

      if (!response.ok) throw new Error('Failed to add event');

      toast aria-live="polite" aria-atomic="true"({
        title: t('calendar.eventAdded'),
        description: t('calendar.eventAddedDesc'),
      });
    } catch (error) {
      console.error('Error adding event:', error);
      toast aria-live="polite" aria-atomic="true"({
        title: t('calendar.addEventError'),
        description: t('calendar.addEventErrorDesc'),
        variant: 'destructive',
      });
    }
  };

  const getProviderIcon = (provider: string) => {
    switch (provider) {
      case 'google':
        return <Mail className="h-4 w-4" />;
      case 'outlook':
        return <Mail className="h-4 w-4" />;
      case 'apple':
        return <Smartphone className="h-4 w-4" />;
      default:
        return <Calendar className="h-4 w-4" />;
    }
  };

  const getProviderColor = (provider: string) => {
    switch (provider) {
      case 'google':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400';
      case 'outlook':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400';
      case 'apple':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
    }
  };

  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          {t('calendar.title')}
        </CardTitle>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => syncNow()}
            disabled={syncing || connections.length === 0}
          >
            {syncing ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
          </Button>
          <Dialog open={showSettings} onOpenChange={setShowSettings}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Settings className="h-4 w-4" />
              </Button>
            </DialogTrigger>

            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>{t('calendar.settings')}</DialogTitle>
              </DialogHeader>

              <div className="space-y-4">
                {connections.length === 0 ? (
                  <div className="text-center py-4">
                    <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground">
                      {t('calendar.noConnections')}
                    </p>
                  </div>
                ) : (
                  connections.map((connection) => (
                    <div key={connection.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${getProviderColor(connection.provider)}`}>
                          {getProviderIcon(connection.provider)}
                        </div>
                        <div>
                          <p className="font-medium">{connection.email}</p>
                          <p className="text-xs text-muted-foreground capitalize">
                            {connection.provider}
                          </p>
                          {connection.lastSync && (
                            <p className="text-xs text-muted-foreground">
                              {t('calendar.lastSync', {
                                time: new Date(connection.lastSync).toLocaleString()
                              })}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={connection.syncEnabled}
                          onCheckedChange={(enabled) => toggleSync(connection.id, enabled)}
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => disconnectCalendar(connection.id)}
                        >
                          {t('common.disconnect')}
                        </Button>
                      </div>
                    </div>
                  ))
                )}

                <Separator />

                <Dialog open={showConnectDialog} onOpenChange={setShowConnectDialog}>
                  <DialogTrigger asChild>
                    <Button className="w-full">
                      {t('calendar.connectNew')}
                    </Button>
                  </DialogTrigger>

                  <DialogContent className="sm:max-w-sm">
                    <DialogHeader>
                      <DialogTitle>{t('calendar.selectProvider')}</DialogTitle>
                    </DialogHeader>

                    <div className="space-y-2">
                      {(['google', 'outlook', 'apple'] as const).map((provider) => (
                        <Button
                          key={provider}
                          variant="outline"
                          className="w-full justify-start"
                          onClick={() => {
                            setSelectedProvider(provider);
                            connectCalendar(provider);
                          }}
                        >
                          <div className={`p-2 rounded-lg mr-3 ${getProviderColor(provider)}`}>
                            {getProviderIcon(provider)}
                          </div>
                          <div className="text-left">
                            <p className="font-medium capitalize">{provider}</p>
                            <p className="text-xs text-muted-foreground">
                              {t(`calendar.${provider}Desc`)}
                            </p>
                          </div>
                        </Button>
                      ))}
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {conflicts.length > 0 && (
          <Alert className="border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-900/20">
            <AlertCircle className="h-4 w-4 text-orange-600" />
            <AlertDescription className="text-orange-800 dark:text-orange-200">
              {t('calendar.conflictsFound', { count: conflicts.length })}
            </AlertDescription>
          </Alert>
        )}

        {bookingId && (
          <Button onClick={addToCalendar} className="w-full">
            <Calendar className="h-4 w-4 mr-2" />
            {t('calendar.addToCalendar')}
          </Button>
        )}

        {connections.filter(c => c.connected).length > 0 ? (
          <div className="space-y-2">
            <p className="text-sm font-medium">{t('calendar.connectedCalendars')}</p>
            {connections
              .filter(c => c.connected)
              .map((connection) => (
                <div key={connection.id} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div className={`p-1 rounded ${getProviderColor(connection.provider)}`}>
                      {getProviderIcon(connection.provider)}
                    </div>
                    <span>{connection.email}</span>
                  </div>
                  <Badge variant={connection.syncEnabled ? 'default' : 'secondary'}>
                    {connection.syncEnabled ? t('calendar.syncing') : t('calendar.paused')}
                  </Badge>
                </div>
              ))}
          </div>
        ) : (
          <Alert>
            <Calendar className="h-4 w-4" />
            <AlertDescription>
              {t('calendar.connectPrompt')}
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}