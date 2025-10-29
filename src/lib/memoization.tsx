import React, { memo, useMemo, useCallback, ComponentType, ReactNode } from 'react';
import { isEqual } from 'lodash-es';

// Enhanced memo with custom comparison
export function smartMemo<P extends object>(
  Component: ComponentType<P>,
  areEqual?: (prevProps: P, nextProps: P) => boolean
) {
  return memo(Component, areEqual || isEqual);
}

// Memo with shallow comparison for simple props
export function shallowMemo<P extends object>(Component: ComponentType<P>) {
  return memo(Component, (prevProps, nextProps) => {
    const prevKeys = Object.keys(prevProps);
    const nextKeys = Object.keys(nextProps);

    // Different number of props
    if (prevKeys.length !== nextKeys.length) {
      return false;
    }

    // Compare each prop
    for (const key of prevKeys) {
      const prevValue = prevProps[key as keyof P];
      const nextValue = nextProps[key as keyof P];

      // For arrays, check length and items
      if (Array.isArray(prevValue) && Array.isArray(nextValue)) {
        if (prevValue.length !== nextValue.length) {
          return false;
        }
        // Simple shallow compare for arrays
        for (let i = 0; i < prevValue.length; i++) {
          if (prevValue[i] !== nextValue[i]) {
            return false;
          }
        }
      }
      // For objects, shallow compare
      else if (typeof prevValue === 'object' && prevValue !== null) {
        if (prevValue !== nextValue) {
          return false;
        }
      }
      // For primitives, direct compare
      else if (prevValue !== nextValue) {
        return false;
      }
    }

    return true;
  });
}

// Memo with deep comparison for complex props
export function deepMemo<P extends object>(Component: ComponentType<P>) {
  return memo(Component, isEqual);
}

// HOC for memoizing list items
export function memoizeListItem<T extends { id: string | number }>(
  Component: ComponentType<T & { index?: number }>
) {
  return memo(Component, (prevProps, nextProps) => {
    // Compare by ID if available
    if ('id' in prevProps && 'id' in nextProps) {
      return prevProps.id === nextProps.id;
    }

    // Fallback to full comparison
    return isEqual(prevProps, nextProps);
  });
}

// HOC for memoizing components with expensive calculations
export function memoizeWithCalculation<P extends object, R>(
  Component: ComponentType<P & { result?: R }>,
  calculate: (props: P) => R,
  deps?: Array<keyof P>
) {
  return memo((props: P) => {
    const result = useMemo(() => calculate(props), deps ? deps.map(dep => props[dep]) : [props]);
    return <Component {...props} result={result} />;
  }, isEqual);
}

// Hook for memoized callbacks
export function useStableCallback<T extends (...args: any[]) => any>(
  callback: T,
  deps: React.DependencyList
): T {
  return useCallback(callback, deps);
}

// Hook for memoized values with custom comparison
export function useStableMemo<T>(
  factory: () => T,
  deps: React.DependencyList,
  isEqual?: (a: T, b: T) => boolean
): T {
  const memoizedValue = useMemo(factory, deps);

  const previousRef = React.useRef<T>(memoizedValue);
  const previousValue = previousRef.current;

  if (isEqual ? !isEqual(memoizedValue, previousValue) : !isEqual(memoizedValue, previousValue)) {
    previousRef.current = memoizedValue;
  }

  return previousRef.current;
}

// Hook for memoizing expensive calculations
export function useExpensiveMemo<T, P extends any[]>(
  calculate: (...args: P) => T,
  args: P
): T {
  return useMemo(() => calculate(...args), args);
}

// Performance monitoring HOC
export function withPerformanceMonitoring<P extends object>(
  Component: ComponentType<P>,
  componentName?: string
) {
  const WrappedComponent = memo((props: P) => {
    const startTime = React.useRef<number>();
    const renderCount = React.useRef(0);

    React.useLayoutEffect(() => {
      startTime.current = performance.now();
      renderCount.current++;

      return () => {
        const endTime = performance.now();
        const renderTime = endTime - (startTime.current || 0);

        if (renderTime > 16) { // More than one frame
          console.warn(
            `Slow render detected: ${componentName || Component.name} took ${renderTime.toFixed(2)}ms`,
            { renderCount: renderCount.current, props }
          );
        }
      };
    });

    return <Component {...props} />;
  });

  WrappedComponent.displayName = `withPerformanceMonitoring(${componentName || Component.name})`;

  return WrappedComponent;
}

// Debounced props HOC
export function withDebouncedProps<P extends object>(
  Component: ComponentType<P>,
  delay: number = 300
) {
  return memo((props: P) => {
    const [debouncedProps, setDebouncedProps] = React.useState(props);
    const timeoutRef = React.useRef<NodeJS.Timeout>();

    React.useEffect(() => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = setTimeout(() => {
        setDebouncedProps(props);
      }, delay);

      return () => {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
      };
    }, [props, delay]);

    return <Component {...debouncedProps} />;
  }, isEqual);
}

// Virtual scrolling helper
export function useVirtualScrolling<T>(
  items: T[],
  itemHeight: number,
  containerHeight: number,
  overscan: number = 5
) {
  return useMemo(() => {
    const scrollTop = 0; // This would be managed by scroll event handler

    const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
    const endIndex = Math.min(
      items.length - 1,
      Math.ceil((scrollTop + containerHeight) / itemHeight) + overscan
    );

    const visibleItems = items.slice(startIndex, endIndex + 1);
    const offsetY = startIndex * itemHeight;
    const totalHeight = items.length * itemHeight;

    return {
      visibleItems,
      offsetY,
      totalHeight,
      startIndex,
      endIndex,
    };
  }, [items, itemHeight, containerHeight, overscan]);
}

// Memoized event handlers
export function useEventHandlers<T extends Record<string, Function>>(
  handlers: T
): T {
  return useMemo(() => {
    const memoizedHandlers = {} as T;

    for (const key in handlers) {
      memoizedHandlers[key] = (...args: any[]) => {
        return handlers[key](...args);
      };
    }

    return memoizedHandlers;
  }, []);
}

// Component comparison utilities
export const propComparators = {
  // For components with only children
  childrenOnly: <P extends { children?: ReactNode }>(prevProps: P, nextProps: P) =>
    prevProps.children === nextProps.children,

  // For components with only ID
  idOnly: <P extends { id?: string | number }>(prevProps: P, nextProps: P) =>
    prevProps.id === nextProps.id,

  // For components with only data array
  dataOnly: <P extends { data?: any[] }>(prevProps: P, nextProps: P) => {
    const prevData = prevProps.data || [];
    const nextData = nextProps.data || [];
    return prevData.length === nextData.length && prevData.every((item, index) => item === nextData[index]);
  },

  // For service-like components
  serviceLike: <P extends { service?: { id: string } }>(prevProps: P, nextProps: P) =>
    prevProps.service?.id === nextProps.service?.id,

  // For booking-like components
  bookingLike: <P extends { booking?: { id: string } }>(prevProps: P, nextProps: P) =>
    prevProps.booking?.id === nextProps.booking?.id,
};

// Export commonly used memoized components
export { memo as defaultMemo, useMemo as defaultUseMemo };