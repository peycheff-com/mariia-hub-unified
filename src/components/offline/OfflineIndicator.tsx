import React, { useState, useEffect } from 'react';
import { Wifi, WifiOff, RefreshCw, AlertCircle } from 'lucide-react';
import { toast aria-live="polite" aria-atomic="true" } from 'sonner';

import { offlineManager } from '@/lib/offline-manager';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';


interface OfflineIndicatorProps {
  className?: string;
}

export const OfflineIndicator: React.FC<OfflineIndicatorProps> = ({ className = '' }) => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [queueLength, setQueueLength] = useState(0);
  const [syncing, setSyncing] = useState(false);
  const [showSyncStatus, setShowSyncStatus] = useState(false);

  useEffect(() => {
    const updateStatus = () => setIsOnline(offlineManager.getConnectionStatus());
    updateStatus();

    window.addEventListener('online', updateStatus);
    window.addEventListener('offline', updateStatus);

    return () => {
      window.removeEventListener('online', updateStatus);
      window.removeEventListener('offline', updateStatus);
    };
  }, []);

  useEffect(() => {
    const updateQueueLength = async () => {
      const length = await offlineManager.getQueueLength();
      setQueueLength(length);
    };

    updateQueueLength();
    const interval = setInterval(updateQueueLength, 5000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleSyncComplete = (event: CustomEvent) => {
      const { successful, failed } = event.detail;
      setSyncing(false);

      if (successful > 0) {
        toast aria-live="polite" aria-atomic="true".success(`Synced ${successful} item${successful > 1 ? 's' : ''}`);
      }

      if (failed > 0) {
        toast aria-live="polite" aria-atomic="true".error(`${failed} item${failed > 1 ? 's' : ''} failed to sync`);
      }

      setTimeout(() => setShowSyncStatus(false), 3000);
    };

    window.addEventListener('offline-sync-complete', handleSyncComplete as EventListener);

    return () => {
      window.removeEventListener('offline-sync-complete', handleSyncComplete as EventListener);
    };
  }, []);

  const handleManualSync = async () => {
    if (!isOnline) return;

    setSyncing(true);
    setShowSyncStatus(true);

    try {
      await offlineManager.syncWhenOnline();
    } catch (error) {
      toast aria-live="polite" aria-atomic="true".error('Sync failed. Please try again.');
      setSyncing(false);
    }
  };

  if (isOnline && queueLength === 0 && !showSyncStatus) {
    return null;
  }

  return (
    <TooltipProvider>
      <div className={`fixed bottom-4 right-4 z-50 flex flex-col gap-2 ${className}`}>
        {!isOnline && (
          <div className="flex items-center gap-2 bg-orange-500 text-white px-3 py-2 rounded-lg shadow-lg animate-pulse">
            <WifiOff className="w-4 h-4" />
            <span className="text-sm font-medium">You're offline</span>
            <AlertCircle className="w-4 h-4" />
          </div>
        )}

        {isOnline && queueLength > 0 && (
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center gap-2 bg-blue-500 text-white px-3 py-2 rounded-lg shadow-lg">
                <Wifi className="w-4 h-4" />
                <span className="text-sm font-medium">
                  {queueLength} pending{queueLength > 1 ? ' items' : ' item'}
                </span>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={handleManualSync}
                  disabled={syncing}
                  className="h-6 px-2 text-xs"
                >
                  {syncing ? (
                    <RefreshCw className="w-3 h-3 animate-spin" />
                  ) : (
                    'Sync'
                  )}
                </Button>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p>Changes will sync when connection is stable</p>
            </TooltipContent>
          </Tooltip>
        )}

        {showSyncStatus && (
          <div className="flex items-center gap-2 bg-green-500 text-white px-3 py-2 rounded-lg shadow-lg">
            <Badge variant="secondary" className="text-xs">
              Syncing...
            </Badge>
          </div>
        )}
      </div>
    </TooltipProvider>
  );
};

export default OfflineIndicator;