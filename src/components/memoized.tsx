import React, { memo, useMemo, useCallback } from 'react';
import { StandardServiceCard } from './StandardServiceCard';
import { ServiceCard } from './ServiceCard';

// Memoized version of StandardServiceCard
export const MemoizedStandardServiceCard = memo(StandardServiceCard, (prevProps, nextProps) => {
  // Custom comparison for props
  return (
    prevProps.service?.id === nextProps.service?.id &&
    prevProps.service?.updated_at === nextProps.service?.updated_at &&
    prevProps.showQuickBook === nextProps.showQuickBook &&
    prevProps.className === nextProps.className
  );
});

MemoizedStandardServiceCard.displayName = 'MemoizedStandardServiceCard';

// Memoized version of ServiceCard
export const MemoizedServiceCard = memo(ServiceCard, (prevProps, nextProps) => {
  return (
    prevProps.id === nextProps.id &&
    prevProps.updated_at === nextProps.updated_at &&
    prevProps.className === nextProps.className
  );
});

MemoizedServiceCard.displayName = 'MemoizedServiceCard';

// Higher-order component for memoizing components with custom comparison
export const memoWithPropsCompare = <P extends object>(
  Component: React.ComponentType<P>,
  areEqual: (prevProps: Readonly<P>, nextProps: Readonly<P>) => boolean
) => {
  const MemoizedComponent = memo(Component, areEqual);
  MemoizedComponent.displayName = `memoWithPropsCompare(${Component.displayName || Component.name})`;
  return MemoizedComponent;
};

// Utility for creating stable callbacks
export const useStableCallback = <T extends (...args: any[]) => any>(
  callback: T,
  deps: React.DependencyList
): T => {
  return useCallback(callback, deps);
};

// Utility for memoizing expensive calculations
export const useStableMemo = <T>(
  factory: () => T,
  deps: React.DependencyList
): T => {
  return useMemo(factory, deps);
};

export default {
  MemoizedStandardServiceCard,
  MemoizedServiceCard,
  memoWithPropsCompare,
  useStableCallback,
  useStableMemo,
};