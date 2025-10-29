import React, {
  useState,
  useRef,
  useEffect,
  useMemo,
  useCallback,
  ReactNode,
  CSSProperties,
} from 'react';

import { cn } from '@/lib/utils';

interface VirtualListProps<T> {
  items: T[];
  itemHeight: number | ((index: number, item: T) => number);
  containerHeight: number;
  overscan?: number;
  renderItem: (item: T, index: number, style: CSSProperties) => ReactNode;
  className?: string;
  itemClassName?: string;
  onScroll?: (scrollTop: number, visibleRange: { start: number; end: number }) => void;
  estimatedItemHeight?: number;
  scrollToIndex?: number;
  id?: string;
}

interface VirtualItem {
  index: number;
  item: any;
  height: number;
  offsetTop: number;
}

export function VirtualList<T>({
  items,
  itemHeight,
  containerHeight,
  overscan = 5,
  renderItem,
  className,
  itemClassName,
  onScroll,
  estimatedItemHeight = 50,
  scrollToIndex,
  id,
}: VirtualListProps<T>) {
  const [scrollTop, setScrollTop] = useState(0);
  const [containerSize, setContainerSize] = useState({ width: 0, height: containerHeight });
  const containerRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const itemsRef = useRef<Map<number, VirtualItem>>(new Map());

  // Calculate item heights cache
  const itemHeights = useMemo(() => {
    const heights = new Map<number, number>();
    items.forEach((item, index) => {
      if (typeof itemHeight === 'function') {
        heights.set(index, itemHeight(index, item));
      } else {
        heights.set(index, itemHeight);
      }
    });
    return heights;
  }, [items, itemHeight]);

  // Calculate offset top for each item
  const getOffsetTop = useCallback((index: number): number => {
    let offset = 0;
    for (let i = 0; i < index; i++) {
      offset += itemHeights.get(i) || estimatedItemHeight;
    }
    return offset;
  }, [itemHeights, estimatedItemHeight]);

  // Calculate total height
  const totalHeight = useMemo(() => {
    let height = 0;
    items.forEach((_, index) => {
      height += itemHeights.get(index) || estimatedItemHeight;
    });
    return height;
  }, [items, itemHeights, estimatedItemHeight]);

  // Calculate visible range
  const visibleRange = useMemo(() => {
    let start = 0;
    let end = 0;
    let accumulatedHeight = 0;

    // Find start index
    for (let i = 0; i < items.length; i++) {
      const itemHeight = itemHeights.get(i) || estimatedItemHeight;
      if (accumulatedHeight + itemHeight > scrollTop) {
        start = Math.max(0, i - overscan);
        break;
      }
      accumulatedHeight += itemHeight;
    }

    // Find end index
    accumulatedHeight = 0;
    for (let i = start; i < items.length; i++) {
      const itemHeight = itemHeights.get(i) || estimatedItemHeight;
      accumulatedHeight += itemHeight;
      if (accumulatedHeight > containerSize.height + overscan * estimatedItemHeight) {
        end = Math.min(items.length - 1, i + overscan);
        break;
      }
      end = i;
    }

    if (end === 0) end = Math.min(items.length - 1, start + 20);

    return { start, end };
  }, [scrollTop, items, itemHeights, estimatedItemHeight, overscan, containerSize.height]);

  // Scroll handler
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const newScrollTop = e.currentTarget.scrollTop;
    setScrollTop(newScrollTop);
    onScroll?.(newScrollTop, visibleRange);
  }, [onScroll, visibleRange]);

  // Scroll to index
  useEffect(() => {
    if (scrollToIndex !== undefined && containerRef.current) {
      const offsetTop = getOffsetTop(scrollToIndex);
      containerRef.current.scrollTop = offsetTop;
      setScrollTop(offsetTop);
    }
  }, [scrollToIndex, getOffsetTop]);

  // Resize observer for container
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        setContainerSize({ width, height });
      }
    });

    resizeObserver.observe(container);

    return () => {
      resizeObserver.disconnect();
    };
  }, []);

  // Render visible items
  const visibleItems = useMemo(() => {
    const items = [];
    for (let i = visibleRange.start; i <= visibleRange.end; i++) {
      if (i >= 0 && i < this.props.items.length) {
        const height = itemHeights.get(i) || estimatedItemHeight;
        const offsetTop = getOffsetTop(i);

        items.push({
          index: i,
          item: this.props.items[i],
          height,
          offsetTop,
        });
      }
    }
    return items;
  }, [visibleRange, items, itemHeights, estimatedItemHeight, getOffsetTop]);

  // Apply transform for visible items
  const getStyle = useCallback((index: number): CSSProperties => {
    const offsetTop = getOffsetTop(index);
    return {
      position: 'absolute',
      top: offsetTop,
      left: 0,
      right: 0,
      width: '100%',
    };
  }, [getOffsetTop]);

  // Intersection Observer for dynamic item heights
  useEffect(() => {
    const container = containerRef.current;
    if (!container || typeof itemHeight === 'number') return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const element = entry.target as HTMLElement;
          const index = parseInt(element.dataset.index || '0', 10);

          if (entry.isIntersecting) {
            const measuredHeight = element.getBoundingClientRect().height;
            const currentHeight = itemHeights.get(index);

            if (!currentHeight || Math.abs(measuredHeight - currentHeight) > 1) {
              itemHeights.set(index, measuredHeight);
              // Force re-render
              setScrollTop((prev) => prev + 0.001);
            }
          }
        });
      },
      { threshold: 1.0 }
    );

    // Observe visible items
    const elements = container.querySelectorAll('[data-index]');
    elements.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, [itemHeight, itemHeights, visibleRange]);

  return (
    <div
      ref={containerRef}
      className={cn(
        'relative overflow-auto',
        className
      )}
      style={{ height: containerHeight }}
      onScroll={handleScroll}
      id={id}
    >
      <div
        ref={innerRef}
        className="relative"
        style={{ height: totalHeight }}
      >
        {visibleItems.map(({ index, item }) => (
          <div
            key={index}
            data-index={index}
            className={itemClassName}
            style={getStyle(index)}
          >
            {renderItem(item, index, getStyle(index))}
          </div>
        ))}
      </div>
    </div>
  );
}

// Simplified version for fixed height items
export function SimpleVirtualList<T>({
  items,
  itemHeight,
  containerHeight,
  overscan = 5,
  renderItem,
  className,
  itemClassName,
  onScroll,
  scrollToIndex,
  id,
}: VirtualListProps<T>) {
  const [scrollTop, setScrollTop] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const visibleRange = useMemo(() => {
    const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
    const endIndex = Math.min(
      items.length - 1,
      Math.ceil((scrollTop + containerHeight) / itemHeight) + overscan
    );
    return { start: startIndex, end: endIndex };
  }, [scrollTop, items, itemHeight, containerHeight, overscan]);

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const newScrollTop = e.currentTarget.scrollTop;
    setScrollTop(newScrollTop);
    onScroll?.(newScrollTop, visibleRange);
  }, [onScroll, visibleRange]);

  useEffect(() => {
    if (scrollToIndex !== undefined && containerRef.current) {
      containerRef.current.scrollTop = scrollToIndex * itemHeight;
    }
  }, [scrollToIndex, itemHeight]);

  return (
    <div
      ref={containerRef}
      className={cn('relative overflow-auto', className)}
      style={{ height: containerHeight }}
      onScroll={handleScroll}
      id={id}
    >
      <div style={{ height: items.length * itemHeight }}>
        {items.slice(visibleRange.start, visibleRange.end + 1).map((item, index) => {
          const actualIndex = visibleRange.start + index;
          const style: CSSProperties = {
            position: 'absolute',
            top: actualIndex * itemHeight,
            left: 0,
            right: 0,
            width: '100%',
            height: itemHeight,
          };

          return (
            <div
              key={actualIndex}
              className={itemClassName}
              style={style}
            >
              {renderItem(item, actualIndex, style)}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Hook for using virtual list
export function useVirtualList<T>(
  items: T[],
  options: {
    itemHeight: number;
    containerHeight: number;
    overscan?: number;
  }
) {
  const [scrollTop, setScrollTop] = useState(0);

  const visibleRange = useMemo(() => {
    const { itemHeight, containerHeight, overscan = 5 } = options;
    const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
    const endIndex = Math.min(
      items.length - 1,
      Math.ceil((scrollTop + containerHeight) / itemHeight) + overscan
    );
    return { start: startIndex, end: endIndex };
  }, [scrollTop, items, options]);

  const totalHeight = items.length * options.itemHeight;

  return {
    visibleItems: items.slice(visibleRange.start, visibleRange.end + 1),
    totalHeight,
    visibleRange,
    scrollTop,
    setScrollTop,
  };
}

// Grid virtual list (2D)
interface VirtualGridProps<T> {
  items: T[];
  itemHeight: number;
  itemWidth: number;
  containerHeight: number;
  containerWidth: number;
  gap?: number;
  overscan?: number;
  renderItem: (item: T, index: number, style: CSSProperties) => ReactNode;
  className?: string;
  itemClassName?: string;
}

export function VirtualGrid<T>({
  items,
  itemHeight,
  itemWidth,
  containerHeight,
  containerWidth,
  gap = 16,
  overscan = 2,
  renderItem,
  className,
  itemClassName,
}: VirtualGridProps<T>) {
  const [scrollTop, setScrollTop] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);

  const columns = Math.floor(containerWidth / (itemWidth + gap));
  const rows = Math.ceil(items.length / columns);

  const visibleRange = useMemo(() => {
    const startRow = Math.max(0, Math.floor(scrollTop / (itemHeight + gap)) - overscan);
    const endRow = Math.min(
      rows - 1,
      Math.ceil((scrollTop + containerHeight) / (itemHeight + gap)) + overscan
    );
    return { startRow, endRow };
  }, [scrollTop, rows, itemHeight, gap, overscan, containerHeight]);

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
    setScrollLeft(e.currentTarget.scrollLeft);
  }, []);

  return (
    <div
      className={cn('relative overflow-auto', className)}
      style={{ height: containerHeight }}
      onScroll={handleScroll}
    >
      <div
        style={{
          height: rows * (itemHeight + gap),
          width: columns * (itemWidth + gap),
          position: 'relative',
        }}
      >
        {items.map((item, index) => {
          const row = Math.floor(index / columns);
          const col = index % columns;

          if (row < visibleRange.startRow || row > visibleRange.endRow) {
            return (
              <div
                key={index}
                className={itemClassName}
                style={{
                  position: 'absolute',
                  top: row * (itemHeight + gap),
                  left: col * (itemWidth + gap),
                  width: itemWidth,
                  height: itemHeight,
                }}
              />
            );
          }

          const style: CSSProperties = {
            position: 'absolute',
            top: row * (itemHeight + gap),
            left: col * (itemWidth + gap),
            width: itemWidth,
            height: itemHeight,
          };

          return (
            <div
              key={index}
              className={itemClassName}
              style={style}
            >
              {renderItem(item, index, style)}
            </div>
          );
        })}
      </div>
    </div>
  );
}