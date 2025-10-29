import { useState, useCallback, useRef, useEffect } from 'react';
import { toast } from 'sonner';

// Optimistic update types
export interface OptimisticConfig {
  showDelay?: boolean; // Delay showing optimistic updates
  autoRollback?: boolean; // Auto rollback on error
  rollbackDelay?: number; // Delay before rollback
  retryCount?: number; // Number of retries before failure
}

export interface OptimisticState<T> {
  data: T[];
  status: 'pending' | 'success' | 'error' | 'rolled_back';
  error?: string;
  retryCount?: number;
}

// State update types
export interface StateUpdate<T> {
  id: string;
  update: Partial<T>;
  tempId?: string; // Temporary ID while pending
}

// Base hook for optimistic updates
export function useOptimisticUpdates<T extends { id: string | number }>(
  fetchData: () => Promise<T[]>,
  config: OptimisticConfig = {}
) {
  const [state, setState] = useState<OptimisticState<T>>({
    data: [],
    status: 'success',
    retryCount: 0,
  });

  const pendingUpdatesRef = useRef<Map<string, { resolve: (data: T) => void; reject: (error: string) => void }>>(new Map());
  const rollbackTimeoutRef = useRef<Map<string, NodeJS.Timeout>>(new Map());

  // Generate temporary ID for new items
  const generateTempId = useCallback(() => {
    return `temp_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }, []);

  // Add optimistic update
  const addOptimisticUpdate = useCallback((
    id: string | number,
    update: Partial<T>,
    tempId?: string
  ) => {
    const currentData = state.data.find(item => item.id === id);
    if (!currentData) return;

    const tempIdToUse = tempId || generateTempId();
    const updatedItem = { ...currentData, ...update, id, tempId: tempIdToUse };

    setState(prev => ({
      ...prev,
      data: prev.data.map(item =>
        item.id === id ? updatedItem : item
      ),
      status: 'pending',
    }));

    // Store resolve/reject functions
    pendingUpdatesRef.current.set(tempIdToUse, {
      resolve: (data: T) => {
        pendingUpdatesRef.current.delete(tempIdToUse);

        // Clear rollback timeout
        const timeout = rollbackTimeoutRef.current.get(tempIdToUse);
        if (timeout) {
          clearTimeout(timeout);
          rollbackTimeoutRef.current.delete(tempIdToUse);
        }

        // Resolve with real server data
        setState(prev => {
          const index = prev.data.findIndex(item => item.id === id);
          if (index !== -1) {
            const newData = [...prev.data];
            newData[index] = { ...newData[index], ...data, id, tempId: undefined };
            return {
              ...prev,
              data: newData,
              status: 'success',
            };
          }
        });
      },
      reject: (error: string) => {
        pendingUpdatesRef.current.delete(tempIdToUse);

        // Set up rollback
        if (config.autoRollback) {
          const timeout = setTimeout(() => {
            setState(prev => {
              const index = prev.data.findIndex(item => item.id === id && item.tempId === tempIdToUse);
              if (index !== -1) {
                const originalItem = state.data.find(item => item.id === id);
                const newData = [...prev.data];
                // Restore original state
                newData[index] = { ...originalItem, id, tempId: undefined };
                return {
                  ...prev,
                  data: newData,
                  status: 'rolled_back',
                  error,
                };
              }
            });
          }, config.rollbackDelay || 2000);

          rollbackTimeoutRef.current.set(tempIdToUse, timeout);
        }

        setState(prev => ({
          ...prev,
          status: 'error',
          error,
        }));
      },
    });

    // Set up auto rollback if configured
    if (config.autoRollback) {
      const timeout = setTimeout(() => {
        const item = state.data.find(item => item.id === id);
        if (item && item.tempId === tempIdToUse) {
          setState(prev => {
            const index = prev.data.findIndex(item => item.id === id);
            if (index !== -1) {
              const newData = [...prev.data];
              // Restore to original state (remove tempId)
              const originalItem = state.data.find(item => item.id === id && !item.tempId);
              if (originalItem) {
                newData[index] = { ...originalItem, id };
              } else {
                newData.splice(index, 1);
              }
              return {
                ...prev,
                data: newData,
                status: 'rolled_back',
              };
            }
          });
        }
      }, config.rollbackDelay || 5000);

      rollbackTimeoutRef.current.set(tempIdToUse, timeout);
    }
  }, [state.data, config.autoRollback, config.rollbackDelay, generateTempId]);

  // Commit optimistic updates with server data
  const commitUpdates = useCallback((serverData: T[]) => {
    setState(prev => {
      const newData = prev.data.map(item => {
        const serverItem = serverData.find(s => s.id === item.id);
        const optimisticItem = prev.data.find(o => o.id === item.id);

        if (optimisticItem?.tempId && serverItem) {
          // Replace optimistic item with server data
          return {
            ...serverItem,
            id: optimisticItem.id,
            tempId: undefined, // Clear tempId
          };
        }
        return item;
      });

      return {
        ...prev,
        data: newData,
        status: 'success',
      };
    });
  }, [state.data]);

  // Reject optimistic updates
  const rejectUpdates = useCallback((error: string) => {
    setState(prev => {
      const newData = prev.data.map(item => {
        if (item.tempId) {
          const originalItem = state.data.find(o => o.id === item.id && !o.tempId);
          if (originalItem) {
            return { ...originalItem };
          } else {
            return item; // Keep optimistic update
          }
        }
        return item;
      });

      return {
        ...prev,
        status: 'error',
        error,
      };
    });
  }, [state.data]);

  // Retry failed updates
  const retryUpdates = useCallback((id: string | number, update: Partial<T>) => {
    const retryCount = state.retryCount + 1;
    const maxRetries = config.retryCount || 3;

    if (retryCount < maxRetries) {
      setState(prev => ({
        ...prev,
        retryCount,
        status: 'pending',
      }));

      // Add update with retry count
      setTimeout(() => {
        addOptimisticUpdate(id, update);
      }, 1000);
    } else {
      // Show error toast
      toast.error('Failed to update. Please try again later.', {
        description: `Retry attempt ${retryCount} of ${maxRetries} failed.`,
      });

      // Reset to server data
      setTimeout(() => {
        setState(prev => ({
          ...prev,
          data: state.data,
          status: 'success',
          retryCount: 0,
        }));
      }, 2000);
    }
  }, [state.retryCount, addOptimisticUpdate, state.data]);

  // Reset optimistic state
  const resetOptimisticState = useCallback(() => {
    setState({
      data: [],
      status: 'success',
      retryCount: 0,
    });
  }, []);

  // Cleanup function
  const cleanup = useCallback(() => {
    pendingUpdatesRef.current.forEach(({ resolve, reject }) => {
      resolve(undefined);
      reject('Component unmounted');
    });
    pendingUpdatesRef.current.clear();

    rollbackTimeoutRef.current.forEach(timeout => {
      clearTimeout(timeout);
    });
    rollbackTimeoutRef.current.clear();
  }, []);

  return {
    data: state.data,
    status: state.status,
    error: state.error,
    retryCount: state.retryCount,
    isPending: state.status === 'pending',
    isSuccess: state.status === 'success',
    isError: state.status === 'error',
    isRolledBack: state.status === 'rolled_back',
    addOptimisticUpdate,
    commitUpdates,
    rejectUpdates,
    retryUpdates,
    resetOptimisticState,
    cleanup,
  };
}

// Hook for database optimistic updates
export function useDatabaseOptimism<T>(
  table: string,
  fetchData: () => Promise<T[]>
) {
  const [state, setState] = useState<OptimisticState<T>>({
    data: [],
    status: 'success',
  });

  // Create optimistic update
  const createOptimisticItem = useCallback((item: Partial<T>) => {
    const id = Math.random().toString(36).substring(2, 9);
    return { ...item, id, tempId: id };
  }, []);

  // Add item optimistically
  const addOptimisticItem = useCallback((item: Partial<T>) => {
    const optimisticItem = createOptimisticItem(item);

    setState(prev => ({
      ...prev,
      data: [...prev.data, optimisticItem],
      status: 'pending',
    }));
  }, [createOptimisticItem]);

  // Update existing item optimistically
  const updateOptimisticItem = useCallback((
    id: string | number,
    update: Partial<T>
  ) => {
    setState(prev => ({
      ...prev,
      data: prev.data.map(item =>
        item.id === id ? { ...item, ...update, tempId: 'updating' } : item
      ),
      status: 'pending',
    }));
  }, []);

  // Remove item optimistically
  const removeOptimisticItem = useCallback((id: string | number) => {
    setState(prev => ({
      ...prev,
      data: prev.data.filter(item => item.id !== id),
    }));
  }, []);

  // Sync with database
  const syncWithDatabase = useCallback(async () => {
    try {
      const serverData = await fetchData();

      setState(prev => {
        const mergedData = serverData.map(serverItem => {
          const optimisticItem = prev.data.find(o => o.id === serverItem.id);

          // Merge optimistic changes with server data
          if (optimisticItem?.tempId) {
            const { tempId, ...optimisticItem } = optimisticItem;
            return { ...serverItem, ...optimisticItem };
          }

          return serverItem;
        });

      return {
        ...prev,
        data: mergedData,
        status: 'success',
      };
    } catch (error) {
      setState(prev => ({
        ...prev,
        status: 'error',
        error: error.message,
      }));
    }
  }, [fetchData, state.data]);

  return {
    data: state.data,
    status: state.status,
    error: state.error,
    addOptimisticItem,
    updateOptimisticItem,
    removeOptimisticItem,
    syncWithDatabase,
  };
}

// Utility function for creating optimistic operations
export function createOptimisticOperation<T>(
  initialData: T,
  optimisticUpdate: (data: T) => Promise<void>,
  rollback: (error: Error) => void,
  options: OptimisticConfig = {}
) {
  let hasStarted = false;
  let retries = 0;
  const maxRetries = options.retryCount || 3;

  return {
    execute: async () => {
      if (hasStarted) return;

      hasStarted = true;

      const executeWithRetry = async (): Promise<void> => {
        try {
          await optimisticUpdate(data);
          hasStarted = false;
          retries = 0;
        } catch (error) {
          if (retries < maxRetries) {
            retries++;
            console.warn(`Optimistic operation failed, retrying (${retries}/${maxRetries})...`);
            setTimeout(() => executeWithRetry(), 1000 * retries);
          } else {
            console.error('Optimistic operation failed after all retries:', error);
            hasStarted = false;
            if (options.autoRollback) {
              rollback(error);
            }
          }
        }
      };

      return executeWithRetry();
    },
    rollback: (error?: Error) => {
      if (options.autoRollback || error) {
        console.error('Rolling back optimistic update:', error?.message);
        // Reset to initial state
        hasStarted = false;
        retries = 0;
      }
    },
  };
}

// React component for optimistic list updates
export function OptimisticList({
  items,
  renderItem,
  optimistic = true,
  className,
}: {
  items: any[];
  renderItem: (item: any, isOptimistic: boolean) => React.ReactNode;
  optimistic?: boolean;
  className?: string;
}) {
  const { data, addOptimisticUpdate, updateOptimisticItem, removeOptimisticItem } = useDatabaseOptimism(
    items.map(item => ({ ...item, id: item.id })),
    () => () => []
  );

  return (
    <div className={className}>
      {data.map((item, index) => {
        const isTemp = 'tempId' in item;

        return (
          <div
            key={item.id}
            className={cn(
              'transition-all duration-300',
              isTemp && 'opacity-60',
              optimistic && !isTemp && 'hover:bg-gray-50',
              'mb-4'
            )}
          >
            {renderItem(item, isTemp)}
          </div>
        );
      })}
    </div>
  );
}

// Hook for working with offline-first caches
export function useOfflineCache<T>(
  key: string,
  fetchFn: () => Promise<T>,
  staleTime = 30000 // 30 seconds
) {
  const [cache, setCache] = useState<{
    data: T | null;
    timestamp: number;
    isStale: boolean;
  }>({
    data: null,
    timestamp: 0,
    isStale: true,
  });

  const loadData = useCallback(async () => {
    try {
      const data = await fetchFn();
      setCache({
        data,
        timestamp: Date.now(),
        isStale: false,
      });
    } catch (error) {
      console.error('Failed to load data:', error);
    }
  }, [fetchFn]);

  const updateCache = useCallback((update: (prev: T) => (current: T) => {
    setCache(prev => ({
      ...prev,
      data: current,
    }));
  }, []);

  return {
    data: cache.data,
    isLoading: cache.data === null,
    isStale: cache.isStale,
    refetch: loadData,
    update: updateCache,
  };
}