import { useState, useEffect, useCallback } from 'react';

import { useBookingStore } from '@/stores/bookingStore';
import { logger } from '@/lib/logger';

// Types for offline sync
export interface OfflineBooking {
  id: string;
  timestamp: Date;
  action: 'create' | 'update' | 'cancel' | 'reschedule';
  data: any;
  status: 'pending' | 'syncing' | 'synced' | 'error';
  retryCount: number;
  lastRetry?: Date;
  errorMessage?: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
}

export interface SyncQueue {
  items: OfflineBooking[];
  isProcessing: boolean;
  lastSyncAttempt?: Date;
  totalItems: number;
  pendingItems: number;
  errorItems: number;
  syncedItems: number;
}

export interface OfflineConfig {
  maxRetries: number;
  retryDelay: number;
  batchSize: number;
  enableBackgroundSync: boolean;
  storageQuota: number; // MB
  compressData: boolean;
}

export interface OfflineStats {
  totalBookings: number;
  pendingBookings: number;
  syncedBookings: number;
  errorBookings: number;
  lastSyncTime?: Date;
  storageUsed: number;
  storageQuota: number;
}

const DEFAULT_CONFIG: OfflineConfig = {
  maxRetries: 5,
  retryDelay: 5000, // 5 seconds
  batchSize: 5,
  enableBackgroundSync: true,
  storageQuota: 50, // 50MB
  compressData: true,
};

const STORAGE_KEYS = {
  QUEUE: 'offline-booking-queue',
  CONFIG: 'offline-config',
  STATS: 'offline-stats',
  CACHE: 'offline-cache',
};

export function useOfflineSync(config: Partial<OfflineConfig> = {}) {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [syncQueue, setSyncQueue] = useState<SyncQueue>({
    items: [],
    isProcessing: false,
    totalItems: 0,
    pendingItems: 0,
    errorItems: 0,
    syncedItems: 0,
  });
  const [offlineStats, setOfflineStats] = useState<OfflineStats>({
    totalBookings: 0,
    pendingBookings: 0,
    syncedBookings: 0,
    errorBookings: 0,
    storageUsed: 0,
    storageQuota: config.storageQuota || DEFAULT_CONFIG.storageQuota,
  });

  const finalConfig = { ...DEFAULT_CONFIG, ...config };
  const bookingStore = useBookingStore();

  // Initialize offline support
  useEffect(() => {
    initializeOfflineSupport();

    // Set up event listeners
    const handleOnline = () => {
      setIsOnline(true);
      logger.info('Connection restored - syncing offline data');
      processSyncQueue();
    };

    const handleOffline = () => {
      setIsOnline(false);
      logger.info('Connection lost - enabling offline mode');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Set up periodic sync if enabled
    let syncInterval: NodeJS.Timeout;
    if (finalConfig.enableBackgroundSync) {
      syncInterval = setInterval(() => {
        if (navigator.onLine && syncQueue.pendingItems > 0) {
          processSyncQueue();
        }
      }, 30000); // Check every 30 seconds
    }

    // Set up storage quota monitoring
    monitorStorageUsage();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      if (syncInterval) clearInterval(syncInterval);
    };
  }, []);

  // Initialize offline support
  const initializeOfflineSupport = useCallback(async () => {
    try {
      // Load existing queue from localStorage
      const storedQueue = localStorage.getItem(STORAGE_KEYS.QUEUE);
      if (storedQueue) {
        const queue = JSON.parse(storedQueue);
        setSyncQueue(prev => ({
          ...prev,
          items: queue.items || [],
          totalItems: queue.items?.length || 0,
          pendingItems: queue.items?.filter((item: OfflineBooking) => item.status === 'pending').length || 0,
          errorItems: queue.items?.filter((item: OfflineBooking) => item.status === 'error').length || 0,
        }));
      }

      // Load config
      const storedConfig = localStorage.getItem(STORAGE_KEYS.CONFIG);
      if (storedConfig) {
        Object.assign(finalConfig, JSON.parse(storedConfig));
      }

      // Load stats
      const storedStats = localStorage.getItem(STORAGE_KEYS.STATS);
      if (storedStats) {
        setOfflineStats(JSON.parse(storedStats));
      }

      // Process queue if online
      if (navigator.onLine) {
        await processSyncQueue();
      }
    } catch (error) {
      logger.error('Failed to initialize offline support:', error);
    }
  }, []);

  // Add booking to offline queue
  const addOfflineBooking = useCallback(async (
    action: OfflineBooking['action'],
    data: any,
    priority: OfflineBooking['priority'] = 'medium'
  ): Promise<string> => {
    const booking: OfflineBooking = {
      id: crypto.randomUUID(),
      timestamp: new Date(),
      action,
      data: finalConfig.compressData ? compressData(data) : data,
      status: 'pending',
      retryCount: 0,
      priority,
    };

    try {
      // Add to queue
      const updatedItems = [...syncQueue.items, booking]
        .sort((a, b) => {
          // Sort by priority first, then by timestamp
          const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
          const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
          if (priorityDiff !== 0) return priorityDiff;
          return new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
        });

      setSyncQueue(prev => ({
        ...prev,
        items: updatedItems,
        totalItems: updatedItems.length,
        pendingItems: updatedItems.filter(item => item.status === 'pending').length,
      }));

      // Save to localStorage
      await saveQueueToStorage(updatedItems);

      // Update stats
      updateOfflineStats({
        totalBookings: offlineStats.totalBookings + 1,
        pendingBookings: offlineStats.pendingBookings + 1,
      });

      // Try to sync immediately if online
      if (navigator.onLine) {
        processSyncQueue();
      }

      logger.info(`Added offline booking: ${action} (${booking.id})`);
      return booking.id;
    } catch (error) {
      logger.error('Failed to add offline booking:', error);
      throw error;
    }
  }, [syncQueue.items, finalConfig.compressData, offlineStats]);

  // Process sync queue
  const processSyncQueue = useCallback(async () => {
    if (syncQueue.isProcessing || !navigator.onLine) return;

    setSyncQueue(prev => ({ ...prev, isProcessing: true }));

    try {
      const pendingItems = syncQueue.items.filter(item => item.status === 'pending');
      const batchToProcess = pendingItems.slice(0, finalConfig.batchSize);

      logger.info(`Processing sync batch: ${batchToProcess.length} items`);

      for (const item of batchToProcess) {
        await processBookingSync(item);
      }

      // Clean up successfully synced items older than 24 hours
      await cleanupSyncedItems();
    } catch (error) {
      logger.error('Failed to process sync queue:', error);
    } finally {
      setSyncQueue(prev => ({ ...prev, isProcessing: false }));
    }
  }, [syncQueue.isProcessing, syncQueue.items, finalConfig.batchSize]);

  // Process individual booking sync
  const processBookingSync = useCallback(async (booking: OfflineBooking) => {
    const updatedBooking = { ...booking, status: 'syncing' as const };

    // Update status in queue
    setSyncQueue(prev => ({
      ...prev,
      items: prev.items.map(item => item.id === booking.id ? updatedBooking : item),
    }));

    try {
      let result;

      switch (booking.action) {
        case 'create':
          result = await bookingStore.createBooking();
          break;
        case 'update':
          result = await bookingStore.updateBookingStatus(booking.data.status);
          break;
        case 'cancel':
          result = await bookingStore.cancelBooking(booking.data.reason, booking.data.specialCondition);
          break;
        case 'reschedule':
          result = await bookingStore.rescheduleBooking(booking.data.newDate, booking.data.newTime);
          break;
        default:
          throw new Error(`Unknown action: ${booking.action}`);
      }

      // Mark as synced
      const syncedBooking = { ...updatedBooking, status: 'synced' as const };
      updateBookingInQueue(syncedBooking);

      // Update stats
      setOfflineStats(prev => ({
        ...prev,
        pendingBookings: Math.max(0, prev.pendingBookings - 1),
        syncedBookings: prev.syncedBookings + 1,
      }));

      logger.info(`Successfully synced booking: ${booking.id}`);
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const retryCount = booking.retryCount + 1;
      const shouldRetry = retryCount < finalConfig.maxRetries;

      const errorBooking = {
        ...updatedBooking,
        status: shouldRetry ? 'pending' : 'error' as const,
        retryCount,
        lastRetry: new Date(),
        errorMessage,
      };

      updateBookingInQueue(errorBooking);

      // Update stats
      setOfflineStats(prev => ({
        ...prev,
        errorBookings: shouldRetry ? prev.errorBookings : prev.errorBookings + 1,
      }));

      if (!shouldRetry) {
        logger.error(`Failed to sync booking after ${finalConfig.maxRetries} attempts: ${booking.id}`, error);
      } else {
        logger.warn(`Sync failed for booking ${booking.id}, retry ${retryCount}/${finalConfig.maxRetries}: ${errorMessage}`);
      }

      throw error;
    }
  }, [bookingStore, finalConfig.maxRetries]);

  // Update booking in queue
  const updateBookingInQueue = useCallback((updatedBooking: OfflineBooking) => {
    setSyncQueue(prev => {
      const updatedItems = prev.items.map(item =>
        item.id === updatedBooking.id ? updatedBooking : item
      );

      return {
        ...prev,
        items: updatedItems,
        pendingItems: updatedItems.filter(item => item.status === 'pending').length,
        errorItems: updatedItems.filter(item => item.status === 'error').length,
      };
    });

    // Save to storage
    saveQueueToStorage(syncQueue.items.map(item =>
      item.id === updatedBooking.id ? updatedBooking : item
    ));
  }, [syncQueue.items]);

  // Save queue to localStorage
  const saveQueueToStorage = useCallback(async (items: OfflineBooking[]) => {
    try {
      const queueData = {
        items,
        totalItems: items.length,
        pendingItems: items.filter(item => item.status === 'pending').length,
        errorItems: items.filter(item => item.status === 'error').length,
        lastSyncAttempt: new Date().toISOString(),
      };

      localStorage.setItem(STORAGE_KEYS.QUEUE, JSON.stringify(queueData));
    } catch (error) {
      logger.error('Failed to save queue to storage:', error);
    }
  }, []);

  // Clean up old synced items
  const cleanupSyncedItems = useCallback(async () => {
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    setSyncQueue(prev => {
      const filteredItems = prev.items.filter(item =>
        item.status !== 'synced' || new Date(item.timestamp) > twentyFourHoursAgo
      );

      if (filteredItems.length !== prev.items.length) {
        saveQueueToStorage(filteredItems);
      }

      return {
        ...prev,
        items: filteredItems,
        totalItems: filteredItems.length,
      };
    });
  }, [saveQueueToStorage]);

  // Update offline statistics
  const updateOfflineStats = useCallback((updates: Partial<OfflineStats>) => {
    setOfflineStats(prev => {
      const newStats = { ...prev, ...updates, lastSyncTime: new Date() };
      localStorage.setItem(STORAGE_KEYS.STATS, JSON.stringify(newStats));
      return newStats;
    });
  }, []);

  // Monitor storage usage
  const monitorStorageUsage = useCallback(() => {
    try {
      if ('storage' in navigator && 'estimate' in navigator.storage) {
        navigator.storage.estimate().then(estimate => {
          const usageInMB = (estimate.usage || 0) / (1024 * 1024);
          const quotaInMB = (estimate.quota || 0) / (1024 * 1024);

          setOfflineStats(prev => ({
            ...prev,
            storageUsed: usageInMB,
            storageQuota: quotaInMB,
          }));
        });
      }
    } catch (error) {
      logger.warn('Failed to monitor storage usage:', error);
    }
  }, []);

  // Data compression utility
  const compressData = useCallback((data: any): any => {
    // Simple compression for demonstration
    // In production, you'd use a proper compression library
    if (typeof data === 'object' && data !== null) {
      const compressed: any = {};
      for (const [key, value] of Object.entries(data)) {
        if (value !== null && value !== undefined) {
          compressed[key] = value;
        }
      }
      return compressed;
    }
    return data;
  }, []);

  // Retry failed bookings
  const retryFailedBookings = useCallback(async () => {
    const failedBookings = syncQueue.items.filter(item =>
      item.status === 'error' && item.retryCount < finalConfig.maxRetries
    );

    for (const booking of failedBookings) {
      const resetBooking = { ...booking, status: 'pending', retryCount: 0 };
      updateBookingInQueue(resetBooking);
    }

    if (navigator.onLine) {
      await processSyncQueue();
    }
  }, [syncQueue.items, finalConfig.maxRetries, updateBookingInQueue, processSyncQueue]);

  // Clear all offline data
  const clearOfflineData = useCallback(async () => {
    try {
      localStorage.removeItem(STORAGE_KEYS.QUEUE);
      localStorage.removeItem(STORAGE_KEYS.CONFIG);
      localStorage.removeItem(STORAGE_KEYS.STATS);
      localStorage.removeItem(STORAGE_KEYS.CACHE);

      setSyncQueue({
        items: [],
        isProcessing: false,
        totalItems: 0,
        pendingItems: 0,
        errorItems: 0,
        syncedItems: 0,
      });

      setOfflineStats({
        totalBookings: 0,
        pendingBookings: 0,
        syncedBookings: 0,
        errorBookings: 0,
        storageUsed: 0,
        storageQuota: finalConfig.storageQuota,
      });

      logger.info('Cleared all offline data');
    } catch (error) {
      logger.error('Failed to clear offline data:', error);
      throw error;
    }
  }, [finalConfig.storageQuota]);

  // Get offline bookings for a specific service
  const getOfflineBookingsForService = useCallback((serviceId: string) => {
    return syncQueue.items.filter(item =>
      item.data.serviceId === serviceId ||
      item.data.service_id === serviceId
    );
  }, [syncQueue.items]);

  // Export offline data for backup
  const exportOfflineData = useCallback(() => {
    const exportData = {
      queue: syncQueue.items,
      stats: offlineStats,
      config: finalConfig,
      exportDate: new Date().toISOString(),
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `offline-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [syncQueue.items, offlineStats, finalConfig]);

  return {
    // State
    isOnline,
    syncQueue,
    offlineStats,

    // Actions
    addOfflineBooking,
    processSyncQueue,
    retryFailedBookings,
    clearOfflineData,
    getOfflineBookingsForService,
    exportOfflineData,

    // Computed
    hasOfflineBookings: syncQueue.totalItems > 0,
    hasFailedBookings: syncQueue.errorItems > 0,
    isStorageFull: offlineStats.storageUsed >= offlineStats.storageQuota * 0.9,
    syncProgress: syncQueue.totalItems > 0 ? (syncQueue.syncedItems / syncQueue.totalItems) * 100 : 100,
  };
}