// Performance monitoring utilities
export class PerformanceMonitor {
  private metrics: any[] = [];
  private observers: PerformanceObserver[] = [];

  constructor() {
    // Initialize only basic metrics to avoid runtime issues
    this.initBasicMetrics();
  }

  // Initialize basic performance metrics
  private initBasicMetrics() {
    try {
      // Initialize with empty array
      this.metrics = [];

      // Log that monitoring is initialized
      if (import.meta.env.DEV) {
        console.log('Performance monitoring initialized');
      }
    } catch (error) {
      console.warn('Performance monitoring initialization failed:', error);
    }
  }

  // Initialize custom performance metrics
  private initCustomMetrics() {
    // Monitor long tasks
    if ('PerformanceObserver' in window) {
      const longTaskObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.duration > 50) { // Long task threshold
            this.reportCustomMetric('long-task', {
              duration: entry.duration,
              startTime: entry.startTime,
              name: entry.name,
            });
          }
        }
      });

      longTaskObserver.observe({ entryTypes: ['longtask'] });
      this.observers.push(longTaskObserver);
    }

    // Monitor resource loading
    if ('PerformanceObserver' in window) {
      const resourceObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          const resource = entry as PerformanceResourceTiming;
          if (resource.transferSize > 0) {
            this.reportCustomMetric('resource-load', {
              name: resource.name,
              size: resource.transferSize,
              duration: resource.duration,
              type: this.getResourceType(resource.name),
            });
          }
        }
      });

      resourceObserver.observe({ entryTypes: ['resource'] });
      this.observers.push(resourceObserver);
    }

    // Monitor route changes (single page apps)
    this.monitorRouteChanges();
  }

  // Monitor route changes for SPA
  private monitorRouteChanges() {
    let lastNavigation = performance.now();

    // Override pushState and replaceState to detect route changes
    const originalPushState = history.pushState;
    const originalReplaceState = history.replaceState;

    history.pushState = function(...args) {
      const navigationTime = performance.now();
      const routeChangeTime = navigationTime - lastNavigation;
      lastNavigation = navigationTime;

      this.reportCustomMetric('route-change', {
        type: 'pushState',
        duration: routeChangeTime,
        to: args[2],
      });

      return originalPushState.apply(this, args);
    }.bind(this);

    history.replaceState = function(...args) {
      const navigationTime = performance.now();
      const routeChangeTime = navigationTime - lastNavigation;
      lastNavigation = navigationTime;

      this.reportCustomMetric('route-change', {
        type: 'replaceState',
        duration: routeChangeTime,
        to: args[2],
      });

      return originalReplaceState.apply(this, args);
    }.bind(this);

    // Monitor popstate events (back/forward buttons)
    window.addEventListener('popstate', () => {
      const navigationTime = performance.now();
      const routeChangeTime = navigationTime - lastNavigation;
      lastNavigation = navigationTime;

      this.reportCustomMetric('route-change', {
        type: 'popstate',
        duration: routeChangeTime,
      });
    });
  }

  // Get resource type from URL
  private getResourceType(url: string): string {
    if (url.includes('.js')) return 'script';
    if (url.includes('.css')) return 'stylesheet';
    if (url.match(/\.(png|jpg|jpeg|gif|webp|svg)$/i)) return 'image';
    if (url.match(/\.(woff|woff2|ttf|eot)$/i)) return 'font';
    if (url.includes('/api/')) return 'api';
    return 'other';
  }

  // Report metric to monitoring service
  private reportMetric(metric: any) {
    // Send to analytics service
    if (import.meta.env.PROD) {
      // Send to Google Analytics or other service
      if ('gtag' in window) {
        (window as any).gtag('event', metric.name, {
          event_category: 'Web Vitals',
          event_label: metric.id,
          value: Math.round(metric.name === 'CLS' ? metric.value * 1000 : metric.value),
          non_interaction: true,
        });
      }

      // Send to Sentry
      import('./sentry').then(({ reportMessage }) => {
        reportMessage(`Performance: ${metric.name}`, 'info', {
          value: metric.value,
          rating: metric.rating,
          id: metric.id,
        });
      }).catch(() => {
        // Silently ignore errors
      });
    } else {
      // In development, log to console
      console.log(`[Performance] ${metric.name}:`, metric.value, metric.rating);
    }
  }

  // Report custom metric
  private reportCustomMetric(name: string, data: any) {
    const metric: any = {
      name,
      value: data.duration || 1,
      rating: this.getRating(name, data.duration),
      id: `${name}-${Date.now()}`,
      delta: data.duration || 1,
      entries: [],
      navigationType: 'navigate',
    };

    this.metrics.push(metric);
    this.reportMetric(metric);
  }

  // Get performance rating
  private getRating(name: string, value: number): 'good' | 'needs-improvement' | 'poor' {
    const thresholds: Record<string, { good: number; poor: number }> = {
      'CLS': { good: 0.1, poor: 0.25 },
      'FID': { good: 100, poor: 300 },
      'FCP': { good: 1.8, poor: 3 },
      'LCP': { good: 2.5, poor: 4 },
      'TTFB': { good: 800, poor: 1800 },
      'long-task': { good: 50, poor: 100 },
      'route-change': { good: 100, poor: 300 },
    };

    const threshold = thresholds[name];
    if (!threshold) return 'good';

    if (value <= threshold.good) return 'good';
    if (value <= threshold.poor) return 'needs-improvement';
    return 'poor';
  }

  // Get all collected metrics
  getMetrics(): any[] {
    return [...this.metrics];
  }

  // Get metrics by name
  getMetricsByName(name: string): any[] {
    return this.metrics.filter(m => m.name === name);
  }

  // Clear all metrics
  clearMetrics(): void {
    this.metrics = [];
  }

  // Disconnect all observers
  disconnect(): void {
    this.observers.forEach(observer => observer.disconnect());
    this.observers = [];
  }

  // Get performance summary
  getSummary(): Record<string, { value: number; rating: string; count: number }> {
    const summary: Record<string, { value: number; rating: string; count: number }> = {};

    for (const metric of this.metrics) {
      if (!summary[metric.name]) {
        summary[metric.name] = {
          value: 0,
          rating: metric.rating,
          count: 0,
        };
      }

      summary[metric.name].value += metric.value;
      summary[metric.name].count++;
    }

    // Calculate averages
    for (const key in summary) {
      if (summary[key].count > 0) {
        summary[key].value = summary[key].value / summary[key].count;
      }
    }

    return summary;
  }
}

// Create and export singleton instance
export const performanceMonitor = new PerformanceMonitor();

// Export convenient functions
export const getPerformanceSummary = () => performanceMonitor.getSummary();
export const getPerformanceMetrics = () => performanceMonitor.getMetrics();
export const clearPerformanceMetrics = () => performanceMonitor.clearMetrics();