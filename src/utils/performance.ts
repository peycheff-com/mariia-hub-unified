import { logger } from '@/services/logger.service';

// Core Web Vitals types
export interface WebVitals {
  lcp: number; // Largest Contentful Paint
  fid: number; // First Input Delay
  cls: number; // Cumulative Layout Shift
  fcp: number; // First Contentful Paint
  ttfb: number; // Time to First Byte
}

// Performance metrics
export interface PerformanceMetrics {
  navigation: PerformanceNavigationTiming;
  resources: PerformanceResourceTiming[];
  vitals: Partial<WebVitals>;
  memory?: PerformanceMemory;
  paint: PerformancePaintTiming[];
}

// Performance monitoring class
export class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private metrics: Partial<WebVitals> = {};
  private observers: PerformanceObserver[] = [];
  private isSupported = true;

  private constructor() {
    this.checkSupport();
    if (this.isSupported) {
      this.initializeObservers();
    }
  }

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  private checkSupport(): void {
    this.isSupported = !!(typeof window !== 'undefined' &&
      window.performance &&
      window.PerformanceObserver);
  }

  private initializeObservers(): void {
    // Largest Contentful Paint (LCP)
    this.observeMetric('largest-contentful-paint', (entries) => {
      const lastEntry = entries[entries.length - 1];
      this.metrics.lcp = lastEntry.startTime;

      logger.debug('LCP measured', {
        lcp: this.metrics.lcp,
        element: (lastEntry as any).element?.tagName,
        url: (lastEntry as any).url,
      });

      // Good: < 2.5s, Needs Improvement: 2.5s - 4s, Poor: > 4s
      this.evaluateMetric('LCP', this.metrics.lcp, 2500, 4000);
    });

    // First Input Delay (FID) / First Input (FID)
    this.observeMetric('first-input', (entries) => {
      const firstEntry = entries[0];
      this.metrics.fid = (firstEntry as any).processingStart - firstEntry.startTime;

      logger.debug('FID measured', { fid: this.metrics.fid });

      // Good: < 100ms, Needs Improvement: 100-300ms, Poor: > 300ms
      this.evaluateMetric('FID', this.metrics.fid, 100, 300);
    });

    // Cumulative Layout Shift (CLS)
    let clsValue = 0;
    this.observeMetric('layout-shift', (entries) => {
      for (const entry of entries) {
        if (!(entry as any).hadRecentInput) {
          clsValue += (entry as any).value;
        }
      }
      this.metrics.cls = clsValue;

      // Only log CLS when it changes significantly
      if (clsValue > 0.1) {
        logger.debug('CLS measured', { cls: clsValue });
      }
    });

    // First Contentful Paint (FCP)
    this.observeMetric('paint', (entries) => {
      const fcpEntry = entries.find(entry => entry.name === 'first-contentful-paint');
      if (fcpEntry) {
        this.metrics.fcp = fcpEntry.startTime;

        logger.debug('FCP measured', { fcp: this.metrics.fcp });

        // Good: < 1.8s, Needs Improvement: 1.8s - 3s, Poor: > 3s
        this.evaluateMetric('FCP', this.metrics.fcp, 1800, 3000);
      }
    });

    // Time to First Byte (TTFB)
    this.observeNavigation();
  }

  private observeMetric(type: string, callback: (entries: any[]) => void): void {
    try {
      const observer = new PerformanceObserver((list) => {
        callback(list.getEntries());
      });

      observer.observe({ type, buffered: true });
      this.observers.push(observer);
    } catch (error) {
      logger.warn(`Performance observer for ${type} not supported`, { error });
    }
  }

  private observeNavigation(): void {
    if (!window.performance || !window.performance.getEntriesByType) {
      return;
    }

    const navigationEntries = window.performance.getEntriesByType('navigation') as PerformanceNavigationTiming[];
    if (navigationEntries.length > 0) {
      const navEntry = navigationEntries[0];
      this.metrics.ttfb = navEntry.responseStart - navEntry.requestStart;

      logger.debug('TTFB measured', { ttfb: this.metrics.ttfb });

      // Good: < 800ms, Needs Improvement: 800-1800ms, Poor: > 1800ms
      this.evaluateMetric('TTFB', this.metrics.ttfb, 800, 1800);
    }
  }

  private evaluateMetric(name: string, value: number, good: number, poor: number): void {
    let rating: 'good' | 'needs-improvement' | 'poor';

    if (value <= good) {
      rating = 'good';
    } else if (value <= poor) {
      rating = 'needs-improvement';
    } else {
      rating = 'poor';
    }

    if (rating !== 'good') {
      logger.warn(`Core Web Vital ${name} needs improvement`, {
        metric: name,
        value,
        rating,
        good,
        poor,
      });
    }

    // Track in analytics
    this.trackWebVital(name, value, rating);
  }

  private trackWebVital(name: string, value: number, rating: string): void {
    // Send to analytics service
    if (typeof gtag !== 'undefined') {
      gtag('event', 'web_vital', {
        event_category: 'Web Vitals',
        event_label: name,
        value: Math.round(value),
        custom_parameter_1: rating,
        non_interaction: true,
      });
    }

    // Send to custom analytics
    logger.business('web_vital_measured', {
      metric: name,
      value,
      rating,
      url: window.location.href,
      userAgent: navigator.userAgent,
    });
  }

  // Measure custom performance metrics
  measure<T>(
    name: string,
    fn: () => T | Promise<T>,
    options?: {
      logResults?: boolean;
      threshold?: number;
    }
  ): T | Promise<T> {
    const start = performance.now();
    const logResults = options?.logResults !== false;

    const measureAndLog = (result: T): T => {
      const duration = performance.now() - start;

      if (logResults) {
        logger.performance(name, duration, {
          result: typeof result === 'object' ? 'object' : result,
        });

        if (options?.threshold && duration > options.threshold) {
          logger.warn(`Performance threshold exceeded for ${name}`, {
            duration,
            threshold: options.threshold,
          });
        }
      }

      // Mark performance entry
      if (window.performance && window.performance.mark) {
        window.performance.mark(`${name}-end`);
        window.performance.measure(name, `${name}-start`, `${name}-end`);
      }

      return result;
    };

    if (window.performance && window.performance.mark) {
      window.performance.mark(`${name}-start`);
    }

    const result = fn();

    if (result instanceof Promise) {
      return result.then(measureAndLog);
    }

    return measureAndLog(result);
  }

  // Get current metrics
  getMetrics(): Partial<WebVitals> {
    return { ...this.metrics };
  }

  // Get full performance report
  getFullReport(): PerformanceMetrics {
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
    const paint = performance.getEntriesByType('paint') as PerformancePaintTiming[];
    const memory = (performance as any).memory;

    return {
      navigation,
      resources,
      vitals: this.metrics,
      memory,
      paint,
    };
  }

  // Log performance report
  logReport(): void {
    const report = this.getFullReport();

    logger.info('Performance Report', {
      vitals: this.metrics,
      navigation: {
        domContentLoaded: report.navigation.domContentLoadedEventEnd - report.navigation.navigationStart,
        loadComplete: report.navigation.loadEventEnd - report.navigation.navigationStart,
        domReady: report.navigation.domContentLoadedEventEnd - report.navigation.responseEnd,
      },
      resources: {
        total: report.resources.length,
        totalSize: report.resources.reduce((sum, resource) => {
          return sum + (resource.transferSize || 0);
        }, 0),
        slowResources: report.resources.filter(r =>
          (r.responseEnd - r.requestStart) > 1000
        ).length,
      },
      memory: report.memory ? {
        used: report.memory.usedJSHeapSize,
        total: report.memory.totalJSHeapSize,
        limit: report.memory.jsHeapSizeLimit,
      } : undefined,
    });
  }

  // Monitor resource loading
  monitorResourceTiming(): void {
    if (!window.performance || !window.PerformanceObserver) {
      return;
    }

    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries() as PerformanceResourceTiming[];

      entries.forEach(entry => {
        const loadTime = entry.responseEnd - entry.requestStart;

        // Log slow resources
        if (loadTime > 2000) {
          logger.warn('Slow resource detected', {
            name: entry.name,
            loadTime,
            size: entry.transferSize,
            type: this.getResourceType(entry.name),
          });
        }
      });
    });

    observer.observe({ type: 'resource', buffered: true });
    this.observers.push(observer);
  }

  private getResourceType(url: string): string {
    if (url.includes('.js')) return 'script';
    if (url.includes('.css')) return 'stylesheet';
    if (url.match(/\.(jpg|jpeg|png|gif|webp|avif|svg)$/i)) return 'image';
    if (url.match(/\.(woff|woff2|ttf|eot)$/i)) return 'font';
    return 'other';
  }

  // Disconnect all observers
  disconnect(): void {
    this.observers.forEach(observer => observer.disconnect());
    this.observers = [];
  }

  // Reset metrics
  reset(): void {
    this.metrics = {};
  }
}

// Export singleton instance
export const performanceMonitor = PerformanceMonitor.getInstance();

// Performance hooks for React
export const usePerformanceMonitor = () => {
  const measure = React.useCallback(<T>(
    name: string,
    fn: () => T | Promise<T>,
    options?: { logResults?: boolean; threshold?: number }
  ) => {
    return performanceMonitor.measure(name, fn, options);
  }, []);

  const getMetrics = React.useCallback(() => {
    return performanceMonitor.getMetrics();
  }, []);

  const logReport = React.useCallback(() => {
    performanceMonitor.logReport();
  }, []);

  return {
    measure,
    getMetrics,
    logReport,
  };
};

// Performance decorator for functions
export function measurePerformance<T extends (...args: any[]) => any>(
  name: string,
  options?: { logResults?: boolean; threshold?: number }
) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;

    descriptor.value = function (...args: any[]) {
      return performanceMonitor.measure(
        `${name}.${propertyKey}`,
        () => originalMethod.apply(this, args),
        options
      );
    };

    return descriptor;
  };
}

// Initialize performance monitoring
if (typeof window !== 'undefined') {
  // Log initial page load metrics after a short delay
  setTimeout(() => {
    performanceMonitor.logReport();
    performanceMonitor.monitorResourceTiming();
  }, 3000);

  // Log metrics when page is hidden
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
      performanceMonitor.logReport();
    }
  });

  // Log metrics before page unload
  window.addEventListener('beforeunload', () => {
    performanceMonitor.logReport();
  });
}