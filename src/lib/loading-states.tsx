import React, { createContext, useContext, useState, useCallback, useRef } from 'react';

import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

// Loading state types
export type LoadingState = 'idle' | 'pending' | 'success' | 'error' | 'timeout';

export interface LoadingOptions {
  showDelay?: number; // Minimum time to show loading state
  minDuration?: number; // Minimum duration to show loading state
  timeout?: number; // Request timeout
  retryCount?: number; // Number of retries attempted
  timeoutMessage?: string; // Custom timeout message
  errorMessage?: string; // Custom error message
  successMessage?: string; // Custom success message
  className?: string; // Custom CSS classes
}

export interface LoadingContextType {
  state: LoadingState;
  message?: string;
  progress?: number; // 0-100
  retryCount?: number;
  timeout?: number;
  startLoading: (message?: string, timeout?: number) => void;
  stopLoading: (success?: boolean, message?: string) => void;
  reset: () => void;
}

const LoadingContext = createContext<LoadingContextType | null>(null);

// Provider component for loading state
export function LoadingProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<LoadingState>('idle');
  const [message, setMessage] = useState<string>();
  const [progress, setProgress] = useState<number>(0);
  const [retryCount, setRetryCount] = useState(0);
  const [timeout, setTimeout] = useState<number | null>(null);
  const startTimeRef = useRef<number>(0);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const startLoading = useCallback((message?: string, timeout?: number) => {
    startTimeRef.current = Date.now();
    setState('pending');
    setMessage(message || 'Loading...');
    setProgress(0);
    setRetryCount(0);

    if (timeout) {
      setTimeout.current = setTimeout(() => {
        setState('timeout');
        setMessage('Request timed out. Please try again.');
        setTimeout.current = timeout;
      }, timeout);
    }
  }, []);

  const stopLoading = useCallback((success = true, message?: string) => {
    const duration = Date.now() - startTimeRef.current;

    // Ensure minimum duration
    if (duration < 300 && state !== 'idle') {
      setTimeout(() => {
        setState(success ? 'success' : 'error');
        setMessage(message || (success ? 'Operation completed successfully.' : 'Operation failed.'));
      }, 300 - duration);
    } else {
      setState(success ? 'success' : 'error');
      setMessage(message || (success ? 'Operation completed successfully.' : 'Operation failed.'));
    }

    // Clear timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
      setTimeout.current = null;
    }

    setProgress(100);
  }, []);

  const reset = useCallback(() => {
    setState('idle');
    setMessage(undefined);
    setProgress(0);
    setRetryCount(0);
    setTimeout.current = 0;

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
      setTimeout.current = null;
    }
  }, []);

  const value = React.useMemo(() => ({
    state,
    message,
    progress,
    retryCount,
    timeout,
    startLoading,
    stopLoading,
    reset,
    isLoading: state === 'pending',
    isSuccess: state === 'success',
    isError: state === 'error',
    isTimeout: state === 'timeout',
  }), [state, message, progress, retryCount, timeout, startLoading, stopLoading, reset]);

  return (
    <LoadingContext.Provider value={value}>
      {children}
    </LoadingContext.Provider>
  );
}

// Hook for consuming loading context
export function useLoadingState() {
  const context = useContext(LoadingContext);
  if (!context) {
    throw new Error('useLoadingState must be used within LoadingProvider');
  }
  return context;
}

// Loading spinner component
export function LoadingSpinner({
  size = 'md',
  className,
}: {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8',
  };

  return (
    <div className={cn('animate-spin', sizeClasses[size], className)}>
      <svg
        className="h-full w-full"
        fill="none"
        viewBox="0 0 24 24"
      >
        <circle
          className="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="4"
        />
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8 0 4-4 0 0 008.417 8.329 13.171-5.915-11.657-3.515-5.670-4.417 1.657-2.829 5.915 13.171 8.329z"
        />
      </svg>
    </div>
  );
}

// Loading button component
export function LoadingButton({
  children,
  loading = false,
  disabled = false,
  className,
  ...props
}: {
  children: React.ReactNode;
  loading?: boolean;
  disabled?: boolean;
  className?: string;
  [key: string]: any;
}) {
  return (
    <button
      {...props}
      disabled={disabled || loading}
      className={cn(
        'relative inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed',
        className
      )}
    >
      {loading ? (
        <>
          <LoadingSpinner size="sm" className="mr-2" />
          Processing...
        </>
      ) : (
        children
      )}
    </button>
  );
}

// Loading card component
export function LoadingCard({
  children,
  state = 'pending',
  className,
}: {
  children: React.ReactNode;
  state?: LoadingState;
  className?: string;
}) {
  const stateConfig = {
    idle: {
      title: 'Ready',
      icon: 'check-circle',
      color: 'text-green-600',
    },
    pending: {
      title: 'Loading...',
      icon: 'loader',
      color: 'text-blue-600',
    },
    success: {
      title: 'Completed',
      icon: 'check-circle',
      color: 'text-green-600',
    },
    error: {
      title: 'Error',
      icon: 'x-circle',
      color: 'text-red-600',
    },
    timeout: {
      title: 'Timeout',
      icon: 'clock',
      color: 'text-orange-600',
    },
  };

  const config = stateConfig[state];

  return (
    <Card className={cn('w-full max-w-md', className)}>
      <CardContent className="p-6">
        <div className="flex items-center space-x-3">
          <div
            className={cn(
              'h-12 w-12 rounded-full flex items-center justify-center',
              config.color,
              state === 'pending' && 'animate-spin'
            )}
          >
            {state === 'pending' ? (
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24">
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
              </svg>
            ) : (
              <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 20 20">
                {config.icon === 'check-circle' && (
                  <path d="M10 18a8 8 0 100-16 0l-8-8 0-8 8 0-16 0v1.414l-8-8 0 0 16 0z" />
                )}
                {config.icon === 'x-circle' && (
                  <path d="M10 10a8 8 0 100-16 0l-8-8 0-8 8 0-16 0z" />
                )}
                {config.icon === 'clock' && (
                  <path d="M10 12a8 8 0 100-16 0l-8-8 0-8 8 0-16 0v1.414l-8-8 0-8 8 0-16 0z" />
                )}
              </svg>
            )}
          </div>
          <div>
            <h3 className={cn('font-semibold', config.color)}>
              {config.title}
            </h3>
            {children && (
              <div className="mt-2 text-sm text-gray-600">
                {children}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Progress bar component
export function ProgressBar({
  progress = 0,
  className,
}: {
  progress?: number; // 0-100
  className?: string;
}) {
  return (
    <div className={cn('w-full bg-gray-200 rounded-full h-2', className)}>
      <div
        className="h-full bg-primary rounded-full transition-all duration-300 ease-out"
        style={{ width: `${progress}%` }}
      />
    </div>
  );
}

// Skeleton loading component
export function SkeletonLoader({
  lines = 3,
  className,
}: {
  lines?: number;
  className?: string;
}) {
  return (
    <div className={cn('space-y-2', className)}>
      {Array.from({ length: lines }).map((_, index) => (
        <div
          key={index}
          className="h-4 bg-gray-200 rounded animate-pulse"
          style={{
            width: `${Math.random() * 40 + 60}%`,
            animationDelay: `${index * 0.1}s`,
            animationDuration: '1s',
          }}
        />
      ))}
    </div>
  );
}

// HOC for adding loading state to components
export function withLoadingState<P extends object>(
  Component: React.ComponentType<P>,
  options: LoadingOptions = {}
) {
  return function WrappedComponent(props: P) {
    const { state, message, startLoading, stopLoading, isLoading, isError } = useLoadingState();

    React.useEffect(() => {
      if (options.showDelay && isLoading && !isError) {
        const delay = setTimeout(() => {
          if (state !== 'pending') {
            startLoading(options.errorMessage);
          }
        }, options.showDelay);

        return () => clearTimeout(delay);
      }
    }, [options.showDelay, state, startLoading, isLoading, isError]);

    return (
      <div className={cn('relative', options.className)}>
        {isLoading && (
          <div className="absolute inset-0 bg-white/50 flex items-center justify-center z-10">
            <LoadingSpinner />
          </div>
        )}

        {isError && (
          <div className="absolute inset-0 bg-red-50 flex items-center justify-center z-10">
            <div className="text-red-600">
              {message || 'Something went wrong'}
            </div>
          </div>
        )}

        <Component {...props} />
      </div>
    );
  };
}

// Utility function for creating async wrapper
export function createAsyncWrapper<T>(
  asyncFn: () => Promise<T>,
  options: LoadingOptions = {}
) {
  return async (...args: any[]): Promise<T> => {
    // Set up loading state management
    const loadingController = { controller: { abort: () => {} } };

    try {
      // Start loading
      loadingController.startLoading(options.errorMessage);

      // Execute async function with cancellation
      const result = await new Promise<T>((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Request timeout'));
        }, options.timeout || 30000);

        asyncFn(loadingController.getCancelToken())
          .then(resolve)
          .catch((error) => {
            clearTimeout(timeout);
            reject(error);
          });
      });

      // Stop loading
      if (loadingController.isCancelled()) {
        throw new Error('Request cancelled');
      }

      return result;
    } catch (error) {
      // Stop loading with error
      loadingController.stopLoading(false, error.message);
      throw error;
    }
  };
}