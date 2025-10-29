import { useRef, useCallback, useEffect } from 'react';
import { AxiosRequestConfig } from 'axios';

// Cancel token interface
export interface CancelToken {
  cancel: () => void;
  isCancelled: boolean;
}

// Request controller wrapper
export class RequestController {
  private abortController: AbortController | null = null;
  private cancelToken: CancelToken;

  constructor() {
    this.cancelToken = {
      cancel: () => this.cancel(),
      isCancelled: false,
    };
  }

  // Create new request with cancellation
  public createRequest() {
    this.abortController = new AbortController();
    this.cancelToken.isCancelled = false;

    const newCancelToken: CancelToken = {
      cancel: () => this.cancel(),
      isCancelled: false,
    };

    return {
      signal: this.abortController.signal,
      cancelToken: newCancelToken,
      controller: this.abortController,
    };
  }

  // Cancel the request
  public cancel(): void {
    if (this.abortController) {
      this.cancelToken.isCancelled = true;
      this.abortController.abort();
    }
  }

  // Check if request was cancelled
  public isCancelled(): boolean {
    return this.cancelToken.isCancelled;
  }

  // Get cancel token
  public getCancelToken(): CancelToken {
    return this.cancelToken;
  }
}

// Hook for managing multiple requests
export function useRequestController() {
  const controllersRef = useRef<Map<string, RequestController>>(new Map());

  const createController = useCallback((key?: string) => {
    const controller = new RequestController();
    if (key) {
      // Cancel previous request with same key
      const previousController = controllersRef.current.get(key);
      if (previousController) {
        previousController.cancel();
      }
      controllersRef.current.set(key, controller);
    }
    return controller;
  }, []);

  const cancelRequest = useCallback((key?: string) => {
    if (key) {
      const controller = controllersRef.current.get(key);
      if (controller) {
        controller.cancel();
        controllersRef.current.delete(key);
      }
    }
  }, []);

  const cancelAllRequests = useCallback(() => {
    controllersRef.current.forEach(controller => controller.cancel());
    controllersRef.current.clear();
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cancelAllRequests();
    };
  }, [cancelAllRequests]);

  return {
    createController,
    cancelRequest,
    cancelAllRequests,
    isRequestCancelled: (controller?: RequestController) => {
      return controller?.isCancelled() || false;
    },
  };
}

// Hook for cancelable fetch requests
export function useCancelableFetch() {
  const controllersRef = useRef<Map<string, AbortController>>(new Map());

  const fetchWithCancel = useCallback(async (
    url: string,
    options: RequestInit & { key?: string; controller?: AbortController } = {},
    deps: any[] = []
  ) => {
    const key = options.key;

    // Cancel previous request if it exists
    if (key) {
      const prevController = controllersRef.current.get(key);
      if (prevController) {
        prevController.abort();
      }
    }

    // Create new controller
    const controller = new AbortController();
    if (key) {
      controllersRef.current.set(key, controller);
    }

    try {
      const response = await fetch(url, {
        ...options,
        signal: options.controller?.signal || controller.signal,
      });

      if (key) {
        controllersRef.current.delete(key);
      }

      return response;
    } catch (error) {
      if (key) {
        controllersRef.current.delete(key);
      }

      // Re-throw if not an abort error
      if (error.name !== 'AbortError') {
        throw error;
      }

      throw new Error('Request cancelled');
    }
  }, []);

  // Cleanup function
  const cleanup = useCallback(() => {
    controllersRef.current.forEach(controller => controller.abort());
    controllersRef.current.clear();
  }, []);

  return {
    fetchWithCancel,
    cleanup,
  };
}

// Hook for cancelable Axios requests
export function useCancelableAxios() {
  const controllersRef = useRef<Map<string, AbortController>>(new Map());

  const executeWithCancel = useCallback(async (
    requestFn: () => Promise<any>,
    config: AxiosRequestConfig & { key?: string; cancelToken?: CancelToken } = {},
    deps: any[] = []
  ) => {
    const key = config.key;

    // Cancel previous request if it exists
    if (key) {
      const prevController = controllersRef.current.get(key);
      if (prevController) {
        prevController.abort();
      }
    }

    // Create new controller
    const controller = new AbortController();
    if (key) {
      controllersRef.current.set(key, controller);
    }

    // Add cancellation check
    if (config.cancelToken) {
      const checkCancel = () => {
        if (config.cancelToken?.isCancelled()) {
          controller.abort();
        }
      };

      // Check before request
      const interval = setInterval(checkCancel, 100);
      const originalRequestFn = requestFn;

      // Wrap request function
      requestFn = async () => {
        try {
          const result = await originalRequestFn();
          clearInterval(interval);
          return result;
        } catch (error) {
          clearInterval(interval);
          throw error;
        }
      };

      // Check immediately
      checkCancel();
    }

    try {
      const result = await requestFn();

      if (key) {
        controllersRef.current.delete(key);
      }

      return result;
    } catch (error) {
      if (key) {
        controllersRef.current.delete(key);
      }

      if (error.name !== 'AbortError') {
        throw error;
      }

      throw new Error('Request cancelled');
    }
  }, []);

  // Cleanup function
  const cleanup = useCallback(() => {
    controllersRef.current.forEach(controller => controller.abort());
    controllersRef.current.clear();
  }, []);

  return {
    executeWithCancel,
    cleanup,
  };
}

// Debounced request cancellation
export function useDebouncedRequest(
  requestFn: (...args: any[]) => Promise<any>,
  delay: number = 300
) {
  const controllerRef = useRef<RequestController | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const executeRequest = useCallback(
    async (...args: any[]) => {
      // Cancel previous request
      if (controllerRef.current) {
        controllerRef.current.cancel();
      }

      // Create new controller
      const controller = new RequestController();
      const { cancelToken } = controller.createRequest();
      controllerRef.current = controller;

      // Set up timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      timeoutRef.current = setTimeout(() => {
        controller.cancel();
      }, delay);

      try {
        return await requestFn(cancelToken);
      } catch (error) {
        if (error.name !== 'AbortError') {
          throw error;
        }
        throw new Error('Request timeout');
      }
    },
    [requestFn, delay]
  );

  // Cleanup function
  const cleanup = useCallback(() => {
    if (controllerRef.current) {
      controllerRef.current.cancel();
    }
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
  }, []);

  return { executeRequest, cleanup };
}

// React component for pending requests
export interface PendingRequestsProviderProps {
  children: React.ReactNode;
}

interface PendingRequestsContextType {
  pendingRequests: Set<string>;
  addPendingRequest: (key: string) => void;
  removePendingRequest: (key: string) => void;
  clearPendingRequests: () => void;
}

const PendingRequestsContext = React.createContext<PendingRequestsContextType | null>(null);

export function PendingRequestsProvider({ children }: PendingRequestsProviderProps) {
  const [pendingRequests, setPendingRequests] = React.useState(new Set<string>());

  const addPendingRequest = React.useCallback((key: string) => {
    setPendingRequests(prev => new Set([...prev, key]));
  }, []);

  const removePendingRequest = React.useCallback((key: string) => {
    setPendingRequests(prev => {
      const newSet = new Set(prev);
      newSet.delete(key);
      return newSet;
    });
  }, []);

  const clearPendingRequests = React.useCallback(() => {
    setPendingRequests(new Set());
  }, []);

  const value = React.useMemo(() => ({
    pendingRequests,
    addPendingRequest,
    removePendingRequest,
    clearPendingRequests,
  }), [pendingRequests]);

  return (
    <PendingRequestsContext.Provider value={value}>
      {children}
    </PendingRequestsContext.Provider>
  );
}

export function usePendingRequests() {
  const context = React.useContext(PendingRequestsContext);
  if (!context) {
    throw new Error('usePendingRequests must be used within PendingRequestsProvider');
  }
  return context;
}

// Global request cancellation for page navigation
const globalControllers: Map<string, RequestController> = new Map();

export const globalRequestController = {
  // Cancel all requests when navigating away
  cancelAll: () => {
    globalControllers.forEach(controller => controller.cancel());
    globalControllers.clear();
  },

  // Create a new controller with global tracking
  createController: (key?: string) => {
    // Cancel existing request with same key globally
    if (key && globalControllers.has(key)) {
      globalControllers.get(key)?.cancel();
    }

    const controller = new RequestController();
    if (key) {
      globalControllers.set(key, controller);
    }

    return controller;
  },

  // Cancel specific request
  cancel: (key?: string) => {
    if (key && globalControllers.has(key)) {
      globalControllers.get(key)?.cancel();
      globalControllers.delete(key);
    }
  },

  // Clean up completed requests
  cleanup: (controller: RequestController) => {
    if (controller) {
      for (const [key, ctrl] of globalControllers.entries()) {
        if (ctrl === controller) {
          globalControllers.delete(key);
        }
      }
    }
  },
};