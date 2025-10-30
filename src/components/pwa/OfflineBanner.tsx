import React, { useState, useEffect } from 'react';
import { AlertTriangle, Wifi, RefreshCw, X, Info } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast aria-live="polite" aria-atomic="true"';

interface OfflineBannerProps {
  className?: string;
}

export function OfflineBanner({ className = '' }: OfflineBannerProps) {
  const { t } = useTranslation();
  const { toast aria-live="polite" aria-atomic="true" } = useToast();
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showBanner, setShowBanner] = useState(false);
  const [connectionType, setConnectionType] = useState<string>('');
  const [offlineDuration, setOfflineDuration] = useState(0);
  const [offlineStartTime, setOfflineStartTime] = useState<Date | null>(null);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    const updateConnectionStatus = () => {
      const wasOffline = !isOnline;
      const nowOnline = navigator.onLine;

      setIsOnline(nowOnline);

      if (nowOnline && wasOffline) {
        // Just came back online
        setShowBanner(true);
        setTimeout(() => setShowBanner(false), 5000);

        // Calculate offline duration
        if (offlineStartTime) {
          const duration = Math.floor((Date.now() - offlineStartTime.getTime()) / 1000);
          setOfflineDuration(duration);

          toast aria-live="polite" aria-atomic="true"({
            title: t('pwa.backOnline'),
            description: t('pwa.offlineDuration', {
              minutes: Math.floor(duration / 60),
              seconds: duration % 60
            }),
          });
        }

        setOfflineStartTime(null);

        // Trigger sync
        handleSync();
      } else if (!nowOnline && wasOnline) {
        // Just went offline
        setShowBanner(true);
        setOfflineStartTime(new Date());

        toast aria-live="polite" aria-atomic="true"({
          title: t('pwa.nowOffline'),
          description: t('pwa.offlineMessage'),
          variant: 'destructive',
        });
      }
    };

    const updateConnectionType = () => {
      const connection = (navigator as any).connection ||
                        (navigator as any).mozConnection ||
                        (navigator as any).webkitConnection;

      if (connection) {
        setConnectionType(connection.effectiveType || connection.type || 'unknown');

        connection.addEventListener('change', updateConnectionType);
        return () => connection.removeEventListener('change', updateConnectionType);
      }
    };

    window.addEventListener('online', updateConnectionStatus);
    window.addEventListener('offline', updateConnectionStatus);
    const cleanupConnectionType = updateConnectionType();

    return () => {
      window.removeEventListener('online', updateConnectionStatus);
      window.removeEventListener('offline', updateConnectionStatus);
      cleanupConnectionType?.();
    };
  }, [isOnline, offlineStartTime, toast aria-live="polite" aria-atomic="true", t]);

  const handleSync = async () => {
    if (!isOnline || syncing) return;

    setSyncing(true);

    try {
      // Trigger service worker sync
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.ready;

        // Try background sync first
        if ('sync' in window.ServiceWorkerRegistration.prototype) {
          await registration.sync.register('background-sync');
        } else {
          // Fallback: send message to service worker
          registration.active?.postMessage({ type: 'TRIGGER_SYNC' });
        }
      }

      // Additional manual sync for critical data
      await fetch('/api/sync-offline', { method: 'POST' });

      toast aria-live="polite" aria-atomic="true"({
        title: t('pwa.syncComplete'),
        description: t('pwa.syncCompleteDesc'),
      });
    } catch (error) {
      console.error('Sync failed:', error);
      toast aria-live="polite" aria-atomic="true"({
        title: t('pwa.syncFailed'),
        description: t('pwa.syncFailedDesc'),
        variant: 'destructive',
      });
    } finally {
      setSyncing(false);
    }
  };

  const getConnectionColor = () => {
    if (!isOnline) return 'bg-red-500';

    switch (connectionType) {
      case '4g':
        return 'bg-green-500';
      case '3g':
        return 'bg-yellow-500';
      case '2g':
        return 'bg-orange-500';
      case 'slow-2g':
        return 'bg-red-500';
      default:
        return 'bg-blue-500';
    }
  };

  const getConnectionText = () => {
    if (!isOnline) return t('pwa.offline');

    switch (connectionType) {
      case '4g':
        return t('pwa.connection4g');
      case '3g':
        return t('pwa.connection3g');
      case '2g':
        return t('pwa.connection2g');
      case 'slow-2g':
        return t('pwa.connectionSlow');
      default:
        return t('pwa.connectionUnknown');
    }
  };

  // Don't show banner if online and stable
  if (isOnline && !showBanner && connectionType !== 'slow-2g' && connectionType !== '2g') {
    return null;
  }

  return (
    <Alert
      className={`fixed top-0 left-0 right-0 z-50 rounded-none border-l-0 border-r-0 border-t-0 ${
        isOnline ? 'border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-900/20' :
                   'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20'
      } ${className}`}
    >
      <div className="flex items-center justify-between py-2 px-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${getConnectionColor()} animate-pulse`} />
            {isOnline ? (
              <Wifi className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
            ) : (
              <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400" />
            )}
          </div>

          <AlertDescription className="text-sm">
            {isOnline ? (
              <span className="text-yellow-800 dark:text-yellow-200">
                {t('pwa.slowConnection', { connection: getConnectionText() })}
              </span>
            ) : (
              <span className="text-red-800 dark:text-red-200">
                {t('pwa.noConnection')} - {t('pwa.offlineMode')}
              </span>
            )}
          </AlertDescription>

          {offlineDuration > 0 && (
            <Badge variant="outline" className="text-xs">
              {t('pwa.offlineFor', {
                minutes: Math.floor(offlineDuration / 60),
                seconds: offlineDuration % 60
              })}
            </Badge>
          )}
        </div>

        <div className="flex items-center gap-2">
          {isOnline && offlineStartTime === null && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleSync}
              disabled={syncing}
              className="h-7 px-3 text-xs"
            >
              {syncing ? (
                <>
                  <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                  {t('pwa.syncing')}
                </>
              ) : (
                <>
                  <RefreshCw className="h-3 w-3 mr-1" />
                  {t('pwa.syncNow')}
                </>
              )}
            </Button>
          )}

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowBanner(false)}
            className="h-7 w-7 p-0"
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      </div>

      {/* Additional info when offline */}
      {!isOnline && (
        <div className="border-t border-red-200 dark:border-red-800 px-4 py-2 bg-red-100/50 dark:bg-red-900/10">
          <div className="flex items-start gap-2">
            <Info className="h-3 w-3 text-red-600 dark:text-red-400 mt-0.5" />
            <p className="text-xs text-red-700 dark:text-red-300">
              {t('pwa.offlineInfo')}
            </p>
          </div>
        </div>
      )}
    </Alert>
  );
}