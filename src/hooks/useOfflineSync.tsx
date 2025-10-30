import { useState, useEffect, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { toast aria-live="polite" aria-atomic="true" } from 'sonner';

import { offlineManager } from '@/lib/offline-manager';

import { Booking, Service, AvailabilitySlot } from '@/types';

interface OfflineSyncOptions {
  autoCache?: boolean;
  syncInterval?: number;
  showToast?: boolean;
}

export const useOfflineSync = (options: OfflineSyncOptions = {}) => {
  const {
    autoCache = true,
    syncInterval = 60000, // 1 minute
    showToast = true,
  } = options;

  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [queueLength, setQueueLength] = useState(0);
  const [lastSync, setLastSync] = useState<number | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const queryClient = useQueryClient();

  // Update connection status
  useEffect(() => {
    const updateStatus = () => {
      const online = offlineManager.getConnectionStatus();
      setIsOnline(online);

      if (online && queueLength > 0) {
        syncWhenOnline();
      }
    };

    window.addEventListener('online', updateStatus);
    window.addEventListener('offline', updateStatus);

    return () => {
      window.removeEventListener('online', updateStatus);
      window.removeEventListener('offline', updateStatus);
    };
  }, [queueLength]);

  // Update queue length periodically
  useEffect(() => {
    const updateQueueLength = async () => {
      const length = await offlineManager.getQueueLength();
      setQueueLength(length);
    };

    updateQueueLength();
    const interval = setInterval(updateQueueLength, 5000);

    return () => clearInterval(interval);
  }, []);

  // Auto-sync when online
  const syncWhenOnline = useCallback(async () => {
    if (!isOnline || isSyncing) return;

    setIsSyncing(true);

    try {
      await offlineManager.syncWhenOnline();
      setLastSync(Date.now());

      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      queryClient.invalidateQueries({ queryKey: ['services'] });
      queryClient.invalidateQueries({ queryKey: ['availability'] });

      if (showToast) {
        toast aria-live="polite" aria-atomic="true".success('Data synced successfully');
      }
    } catch (error) {
      console.error('Sync failed:', error);
      if (showToast) {
        toast aria-live="polite" aria-atomic="true".error('Failed to sync data');
      }
    } finally {
      setIsSyncing(false);
    }
  }, [isOnline, isSyncing, queryClient, showToast]);

  // Cache data for offline use
  const cacheBookings = useCallback(async (bookings: Booking[]) => {
    try {
      await offlineManager.cacheBookings(bookings);
    } catch (error) {
      console.error('Failed to cache bookings:', error);
    }
  }, []);

  const cacheServices = useCallback(async (services: Service[]) => {
    try {
      await offlineManager.cacheServices(services);
    } catch (error) {
      console.error('Failed to cache services:', error);
    }
  }, []);

  const cacheAvailability = useCallback(async (slots: AvailabilitySlot[]) => {
    try {
      await offlineManager.cacheAvailability(slots);
    } catch (error) {
      console.error('Failed to cache availability:', error);
    }
  }, []);

  // Get cached data
  const getCachedBookings = useCallback(async (userId?: string) => {
    try {
      return await offlineManager.getCachedBookings(userId);
    } catch (error) {
      console.error('Failed to get cached bookings:', error);
      return [];
    }
  }, []);

  const getCachedServices = useCallback(async (category?: string) => {
    try {
      return await offlineManager.getCachedServices(category);
    } catch (error) {
      console.error('Failed to get cached services:', error);
      return [];
    }
  }, []);

  const getCachedAvailability = useCallback(async (
    serviceId?: string,
    date?: string
  ) => {
    try {
      return await offlineManager.getCachedAvailability(serviceId, date);
    } catch (error) {
      console.error('Failed to get cached availability:', error);
      return [];
    }
  }, []);

  // Queue actions for offline
  const queueBookingAction = useCallback(async (
    type: 'create' | 'update' | 'cancel',
    endpoint: string,
    payload: any
  ) => {
    try {
      await offlineManager.queueAction({ type, endpoint, payload });

      if (!isOnline) {
        if (showToast) {
          toast aria-live="polite" aria-atomic="true".info('Action queued. Will sync when online.');
        }
      }
    } catch (error) {
      console.error('Failed to queue action:', error);
      if (showToast) {
        toast aria-live="polite" aria-atomic="true".error('Failed to queue action');
      }
    }
  }, [isOnline, showToast]);

  // Clear cache
  const clearCache = useCallback(async () => {
    try {
      await offlineManager.clearCache();
      if (showToast) {
        toast aria-live="polite" aria-atomic="true".success('Offline cache cleared');
      }
    } catch (error) {
      console.error('Failed to clear cache:', error);
      if (showToast) {
        toast aria-live="polite" aria-atomic="true".error('Failed to clear cache');
      }
    }
  }, [showToast]);

  return {
    isOnline,
    queueLength,
    lastSync,
    isSyncing,
    syncWhenOnline,
    cacheBookings,
    cacheServices,
    cacheAvailability,
    getCachedBookings,
    getCachedServices,
    getCachedAvailability,
    queueBookingAction,
    clearCache,
  };
};

export default useOfflineSync;