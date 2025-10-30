import React, { createContext, useContext, useState, useCallback, useRef, ReactNode } from 'react';
import { crossPlatformSyncService } from '@/services/cross-platform-sync.service';

interface OptimisticUpdate {
  id: string;
  type: 'create' | 'update' | 'delete';
  entityType: string;
  entityId: string;
  data: any;
  timestamp: number;
  isPending: boolean;
  error?: string;
}

interface OptimisticUpdateContextType {
  // Add optimistic update
  addOptimisticUpdate: (
    type: 'create' | 'update' | 'delete',
    entityType: string,
    entityId: string,
    data: any
  ) => void;

  // Get optimistic update for entity
  getOptimisticUpdate: (entityId: string) => OptimisticUpdate | null;

  // Remove optimistic update
  removeOptimisticUpdate: (entityId: string) => void;

  // Get all pending updates
  getPendingUpdates: () => OptimisticUpdate[];

  // Retry failed update
  retryUpdate: (entityId: string) => void;

  // Clear all updates
  clearAllUpdates: () => void;
}

const OptimisticUpdateContext = createContext<OptimisticUpdateContextType | null>(null);

interface OptimisticUpdateProviderProps {
  children: ReactNode;
}

export const OptimisticUpdateProvider: React.FC<OptimisticUpdateProviderProps> = ({
  children
}) => {
  const [updates, setUpdates] = useState<Map<string, OptimisticUpdate>>(new Map());
  const retryTimeouts = useRef<Map<string, NodeJS.Timeout>>(new Map());

  const addOptimisticUpdate = useCallback((
    type: 'create' | 'update' | 'delete',
    entityType: string,
    entityId: string,
    data: any
  ) => {
    const update: OptimisticUpdate = {
      id: `${entityType}_${entityId}_${Date.now()}`,
      type,
      entityType,
      entityId,
      data,
      timestamp: Date.now(),
      isPending: true
    };

    setUpdates(prev => new Map(prev).set(entityId, update));

    // Start sync process
    crossPlatformSyncService.syncData(entityType, entityId, data, type)
      .then(() => {
        // Mark as completed
        setUpdates(prev => {
          const newMap = new Map(prev);
          const existing = newMap.get(entityId);
          if (existing) {
            newMap.set(entityId, { ...existing, isPending: false });
          }
          return newMap;
        });

        // Remove after a delay to show success state
        setTimeout(() => {
          removeOptimisticUpdate(entityId);
        }, 2000);
      })
      .catch((error) => {
        // Mark as failed
        setUpdates(prev => {
          const newMap = new Map(prev);
          const existing = newMap.get(entityId);
          if (existing) {
            newMap.set(entityId, {
              ...existing,
              isPending: false,
              error: error.message || 'Sync failed'
            });
          }
          return newMap;
        });

        // Schedule retry after exponential backoff
        const retryDelay = Math.min(1000 * Math.pow(2, 1), 30000); // Max 30 seconds
        const timeout = setTimeout(() => {
          retryUpdate(entityId);
        }, retryDelay);

        retryTimeouts.current.set(entityId, timeout);
      });
  }, []);

  const getOptimisticUpdate = useCallback((entityId: string): OptimisticUpdate | null => {
    return updates.get(entityId) || null;
  }, [updates]);

  const removeOptimisticUpdate = useCallback((entityId: string) => {
    setUpdates(prev => {
      const newMap = new Map(prev);
      newMap.delete(entityId);
      return newMap;
    });

    // Clear any retry timeout
    const timeout = retryTimeouts.current.get(entityId);
    if (timeout) {
      clearTimeout(timeout);
      retryTimeouts.current.delete(entityId);
    }
  }, []);

  const getPendingUpdates = useCallback((): OptimisticUpdate[] => {
    return Array.from(updates.values()).filter(update => update.isPending);
  }, [updates]);

  const retryUpdate = useCallback((entityId: string) => {
    const update = updates.get(entityId);
    if (!update) return;

    // Clear existing timeout
    const timeout = retryTimeouts.current.get(entityId);
    if (timeout) {
      clearTimeout(timeout);
      retryTimeouts.current.delete(entityId);
    }

    // Reset error and mark as pending
    setUpdates(prev => {
      const newMap = new Map(prev);
      newMap.set(entityId, {
        ...update,
        isPending: true,
        error: undefined
      });
      return newMap;
    });

    // Retry sync
    crossPlatformSyncService.syncData(update.entityType, update.entityId, update.data, update.type)
      .then(() => {
        setUpdates(prev => {
          const newMap = new Map(prev);
          const existing = newMap.get(entityId);
          if (existing) {
            newMap.set(entityId, { ...existing, isPending: false });
          }
          return newMap;
        });

        setTimeout(() => {
          removeOptimisticUpdate(entityId);
        }, 2000);
      })
      .catch((error) => {
        setUpdates(prev => {
          const newMap = new Map(prev);
          const existing = newMap.get(entityId);
          if (existing) {
            newMap.set(entityId, {
              ...existing,
              isPending: false,
              error: error.message || 'Sync failed'
            });
          }
          return newMap;
        });

        // Schedule next retry with longer delay
        const retryDelay = Math.min(1000 * Math.pow(2, 2), 30000);
        const timeout = setTimeout(() => {
          retryUpdate(entityId);
        }, retryDelay);

        retryTimeouts.current.set(entityId, timeout);
      });
  }, [updates, removeOptimisticUpdate]);

  const clearAllUpdates = useCallback(() => {
    setUpdates(new Map());

    // Clear all timeouts
    retryTimeouts.current.forEach(timeout => clearTimeout(timeout));
    retryTimeouts.current.clear();
  }, []);

  // Cleanup on unmount
  React.useEffect(() => {
    return () => {
      retryTimeouts.current.forEach(timeout => clearTimeout(timeout));
    };
  }, []);

  const value: OptimisticUpdateContextType = {
    addOptimisticUpdate,
    getOptimisticUpdate,
    removeOptimisticUpdate,
    getPendingUpdates,
    retryUpdate,
    clearAllUpdates
  };

  return (
    <OptimisticUpdateContext.Provider value={value}>
      {children}
    </OptimisticUpdateContext.Provider>
  );
};

export const useOptimisticUpdate = () => {
  const context = useContext(OptimisticUpdateContext);
  if (!context) {
    throw new Error('useOptimisticUpdate must be used within an OptimisticUpdateProvider');
  }
  return context;
};

/**
 * Hook to manage optimistic updates for specific entities
 */
export const useEntityOptimisticUpdate = <T>(
  entityType: string,
  entityId: string,
  initialData: T
) => {
  const { addOptimisticUpdate, getOptimisticUpdate, removeOptimisticUpdate, retryUpdate } = useOptimisticUpdate();
  const [data, setData] = useState<T>(initialData);
  const optimisticUpdate = getOptimisticUpdate(entityId);

  // Update local data when optimistic update changes
  React.useEffect(() => {
    if (optimisticUpdate) {
      switch (optimisticUpdate.type) {
        case 'create':
        case 'update':
          setData(optimisticUpdate.data);
          break;
        case 'delete':
          // Handle deletion based on your app's logic
          break;
      }
    }
  }, [optimisticUpdate]);

  const updateData = useCallback((newData: T) => {
    setData(newData);
    addOptimisticUpdate('update', entityType, entityId, newData);
  }, [entityType, entityId, addOptimisticUpdate]);

  const createData = useCallback((newData: T) => {
    const newId = entityId || `temp_${Date.now()}`;
    setData(newData);
    addOptimisticUpdate('create', entityType, newId, newData);
  }, [entityType, addOptimisticUpdate]);

  const deleteData = useCallback(() => {
    addOptimisticUpdate('delete', entityType, entityId, data);
  }, [entityType, entityId, data, addOptimisticUpdate]);

  const retryFailedUpdate = useCallback(() => {
    if (optimisticUpdate?.error) {
      retryUpdate(entityId);
    }
  }, [optimisticUpdate, entityId, retryUpdate]);

  return {
    data,
    setData: updateData,
    createData,
    deleteData,
    optimisticUpdate,
    isPending: optimisticUpdate?.isPending || false,
    hasError: !!optimisticUpdate?.error,
    error: optimisticUpdate?.error,
    retry: retryFailedUpdate
  };
};

export default OptimisticUpdateProvider;