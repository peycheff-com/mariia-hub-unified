// Monitoring and Metrics Service
// Tracks performance, user behavior, and business metrics

import { webSocketService } from './websocketService';

interface MetricEvent {
  name: string;
  value?: number;
  labels?: Record<string, string>;
  timestamp: Date;
}

interface PerformanceMetric {
  name: string;
  value: number;
  unit: string;
  timestamp: Date;
}

interface UserBehaviorEvent {
  type: 'click' | 'view' | 'scroll' | 'form_submit' | 'booking_start' | 'booking_complete';
  element?: string;
  page?: string;
  properties?: Record<string, any>;
  timestamp: Date;
}

interface BusinessMetric {
  type: 'booking_created' | 'payment_completed' | 'service_viewed' | 'search_performed';
  value?: number;
  properties?: Record<string, any>;
  timestamp: Date;
}

class MonitoringService {
  private static instance: MonitoringService;
  private metricsQueue: (MetricEvent | PerformanceMetric | UserBehaviorEvent | BusinessMetric)[] = [];
  private flushInterval = 30000; // 30 seconds
  private maxQueueSize = 1000;
  private isDevelopment = import.meta.env.DEV;
  private sessionStartTime = Date.now();
  private pageViewCount = 0;
  private performanceObserver?: PerformanceObserver;

  static getInstance(): MonitoringService {
    if (!MonitoringService.instance) {
      MonitoringService.instance = new MonitoringService();
      MonitoringService.instance.initialize();
    }
    return MonitoringService.instance;
  }

  private initialize(): void {
    // Start performance monitoring
    this.initializePerformanceMonitoring();

    // Set up periodic flushing
    setInterval(() => {
      this.flushMetrics();
    }, this.flushInterval);

    // Track page visibility changes
    document.addEventListener('visibilitychange', this.handleVisibilityChange);

    // Track page unload
    window.addEventListener('beforeunload', this.handlePageUnload);

    // Track initial page load
    this.trackPageLoad();
  }

  private initializePerformanceMonitoring(): void {
    // Core Web Vitals
    if ('PerformanceObserver' in window) {
      // Largest Contentful Paint (LCP)
      this.performanceObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry) => {
          if (entry.name === 'largest-contentful-paint') {
            this.trackPerformanceMetric('lcp', entry.startTime, 'ms');
          }
        });
      });
      this.performanceObserver.observe({ entryTypes: ['largest-contentful-paint'] });

      // First Input Delay (FID)
      const fidObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry) => {
          if (entry.name === 'first-input') {
            this.trackPerformanceMetric('fid', entry.processingStart - entry.startTime, 'ms');
          }
        });
      });
      fidObserver.observe({ entryTypes: ['first-input'] });

      // Cumulative Layout Shift (CLS)
      let clsValue = 0;
      const clsObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry) => {
          if (!(entry as any).hadRecentInput) {
            clsValue += (entry as any).value;
            this.trackPerformanceMetric('cls', clsValue, 'score');
          }
        });
      });
      clsObserver.observe({ entryTypes: ['layout-shift'] });
    }
  }

  // Performance tracking
  trackPerformanceMetric(name: string, value: number, unit: string): void {
    const metric: PerformanceMetric = {
      name,
      value,
      unit,
      timestamp: new Date(),
    };

    this.queueMetric(metric);

    // Log in development
    if (this.isDevelopment) {
      console.log(`[Performance] ${name}: ${value}${unit}`);
    }
  }

  trackPageLoad(): void {
    if ('performance' in window && 'timing' in performance) {
      const timing = performance.timing;
      const navigation = performance.navigation;

      // Page load time
      const pageLoadTime = timing.loadEventEnd - timing.navigationStart;
      this.trackPerformanceMetric('page_load_time', pageLoadTime, 'ms');

      // DNS lookup time
      const dnsTime = timing.domainLookupEnd - timing.domainLookupStart;
      this.trackPerformanceMetric('dns_lookup_time', dnsTime, 'ms');

      // Time to first byte
      const ttfb = timing.responseStart - timing.requestStart;
      this.trackPerformanceMetric('time_to_first_byte', ttfb, 'ms');

      // DOM interactive time
      const domInteractive = timing.domInteractive - timing.navigationStart;
      this.trackPerformanceMetric('dom_interactive_time', domInteractive, 'ms');
    }
  }

  trackApiCall(endpoint: string, duration: number, success: boolean, statusCode?: number): void {
    this.trackMetric('api_call_duration', duration, {
      endpoint,
      success: success.toString(),
      status_code: statusCode?.toString() || '',
    });

    if (!success) {
      this.trackMetric('api_error_count', 1, {
        endpoint,
        status_code: statusCode?.toString() || 'unknown',
      });
    }
  }

  // User behavior tracking
  trackUserEvent(event: UserBehaviorEvent): void {
    // Add page information
    event.page = window.location.pathname;
    event.timestamp = new Date();

    this.queueMetric(event);

    // Special handling for booking events
    if (event.type === 'booking_start') {
      this.trackMetric('booking_funnel', 1, { step: 'start' });
    } else if (event.type === 'booking_complete') {
      this.trackMetric('booking_funnel', 1, { step: 'complete' });
    }
  }

  trackClick(element: string, properties?: Record<string, any>): void {
    this.trackUserEvent({
      type: 'click',
      element,
      properties,
      timestamp: new Date(),
    });
  }

  trackView(element: string, properties?: Record<string, any>): void {
    this.trackUserEvent({
      type: 'view',
      element,
      properties,
      timestamp: new Date(),
    });
  }

  trackFormSubmit(formName: string, success: boolean, properties?: Record<string, any>): void {
    this.trackUserEvent({
      type: 'form_submit',
      element: formName,
      properties: { ...properties, success },
      timestamp: new Date(),
    });
  }

  // Business metrics tracking
  trackBusinessEvent(event: BusinessMetric): void {
    event.timestamp = new Date();
    this.queueMetric(event);

    // Send real-time notifications for important events
    if (event.type === 'booking_created' || event.type === 'payment_completed') {
      if (webSocketService.isConnected()) {
        webSocketService.send('business:metric', event);
      }
    }
  }

  trackBookingCreated(bookingId: string, serviceId: string, amount: number): void {
    this.trackBusinessEvent({
      type: 'booking_created',
      value: amount,
      properties: {
        booking_id: bookingId,
        service_id: serviceId,
      },
      timestamp: new Date(),
    });

    // Track conversion
    this.trackMetric('booking_conversion', 1, {
      service_id: serviceId,
      value_range: this.getValueRange(amount),
    });
  }

  trackPaymentCompleted(bookingId: string, amount: number, method: string): void {
    this.trackBusinessEvent({
      type: 'payment_completed',
      value: amount,
      properties: {
        booking_id: bookingId,
        payment_method: method,
      },
      timestamp: new Date(),
    });

    // Track revenue
    this.trackMetric('revenue', amount, {
      payment_method: method,
    });
  }

  trackServiceViewed(serviceId: string, serviceType: string): void {
    this.trackBusinessEvent({
      type: 'service_viewed',
      properties: {
        service_id: serviceId,
        service_type: serviceType,
      },
      timestamp: new Date(),
    });
  }

  trackSearchPerformed(query: string, resultsCount: number): void {
    this.trackBusinessEvent({
      type: 'search_performed',
      properties: {
        query,
        results_count: resultsCount,
      },
      timestamp: new Date(),
    });
  }

  // Generic metric tracking
  trackMetric(name: string, value?: number, labels?: Record<string, string>): void {
    const metric: MetricEvent = {
      name,
      value,
      labels,
      timestamp: new Date(),
    };

    this.queueMetric(metric);
  }

  // Counter metric
  incrementCounter(name: string, value: number = 1, labels?: Record<string, string>): void {
    this.trackMetric(`${name}_total`, value, labels);
  }

  // Histogram metric
  recordHistogram(name: string, value: number, labels?: Record<string, string>): void {
    this.trackMetric(`${name}_bucket`, value, labels);
  }

  // Queue management
  private queueMetric(metric: any): void {
    this.metricsQueue.push(metric);

    // Prevent queue from growing too large
    if (this.metricsQueue.length > this.maxQueueSize) {
      this.metricsQueue.shift();
    }
  }

  private async flushMetrics(): Promise<void> {
    if (this.metricsQueue.length === 0) return;

    const metrics = [...this.metricsQueue];
    this.metricsQueue = [];

    try {
      // Send to monitoring service
      await this.sendMetrics(metrics);
    } catch (error) {
      console.error('Failed to send metrics:', error);
      // Re-queue metrics on failure
      this.metricsQueue.unshift(...metrics);
    }
  }

  private async sendMetrics(metrics: any[]): Promise<void> {
    // In development, just log metrics
    if (this.isDevelopment) {
      console.log('[Metrics]', metrics);
      return;
    }

    // Send to your monitoring service
    const response = await fetch('/api/metrics', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        metrics,
        session_info: {
          session_id: this.getSessionId(),
          page_views: this.pageViewCount,
          session_duration: Date.now() - this.sessionStartTime,
          user_agent: navigator.userAgent,
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to send metrics: ${response.statusText}`);
    }
  }

  // Utility methods
  private getSessionId(): string {
    let sessionId = sessionStorage.getItem('metrics_session_id');
    if (!sessionId) {
      sessionId = crypto.randomUUID();
      sessionStorage.setItem('metrics_session_id', sessionId);
    }
    return sessionId;
  }

  private getValueRange(value: number): string {
    if (value < 100) return '0-100';
    if (value < 300) return '100-300';
    if (value < 500) return '300-500';
    return '500+';
  }

  private handleVisibilityChange = (): void => {
    if (document.visibilityState === 'visible') {
      this.trackMetric('page_visible', 1);
    } else {
      this.trackMetric('page_hidden', 1);
    }
  };

  private handlePageUnload = (): void => {
    // Flush any pending metrics
    if (navigator.sendBeacon) {
      const data = JSON.stringify({
        metrics: this.metricsQueue,
        session_info: {
          session_id: this.getSessionId(),
          page_views: this.pageViewCount,
          session_duration: Date.now() - this.sessionStartTime,
        },
      });

      navigator.sendBeacon('/api/metrics', data);
    }
  };

  // Public API for dashboard and analytics
  getRealTimeMetrics(): {
    activeUsers: number;
    recentBookings: number;
    todayRevenue: number;
    avgResponseTime: number;
  } {
    // This would typically come from your backend
    return {
      activeUsers: 0,
      recentBookings: 0,
      todayRevenue: 0,
      avgResponseTime: 0,
    };
  }

  // Health check
  getHealthStatus(): {
    isHealthy: boolean;
    queueSize: number;
    lastFlush: Date | null;
    sessionDuration: number;
  } {
    return {
      isHealthy: this.metricsQueue.length < this.maxQueueSize * 0.8,
      queueSize: this.metricsQueue.length,
      lastFlush: null, // Would track last flush time
      sessionDuration: Date.now() - this.sessionStartTime,
    };
  }
}

// Export singleton instance
export const monitoringService = MonitoringService.getInstance();

// Convenience exports
export const trackPageLoad = () => monitoringService.trackPageLoad();
export const trackApiCall = (endpoint: string, duration: number, success: boolean, statusCode?: number) =>
  monitoringService.trackApiCall(endpoint, duration, success, statusCode);
export const trackClick = (element: string, properties?: Record<string, any>) =>
  monitoringService.trackClick(element, properties);
export const trackView = (element: string, properties?: Record<string, any>) =>
  monitoringService.trackView(element, properties);
export const trackBookingCreated = (bookingId: string, serviceId: string, amount: number) =>
  monitoringService.trackBookingCreated(bookingId, serviceId, amount);
export const trackPaymentCompleted = (bookingId: string, amount: number, method: string) =>
  monitoringService.trackPaymentCompleted(bookingId, amount, method);
export const trackServiceViewed = (serviceId: string, serviceType: string) =>
  monitoringService.trackServiceViewed(serviceId, serviceType);
export const trackSearchPerformed = (query: string, resultsCount: number) =>
  monitoringService.trackSearchPerformed(query, resultsCount);

// React hook for monitoring
import { useEffect, useRef } from 'react';

export function useMonitoring(componentName?: string) {
  const startTime = useRef<number>(Date.now());

  useEffect(() => {
    // Track component mount
    monitoringService.trackView(componentName || 'component', {
      mount_time: Date.now(),
    });

    return () => {
      // Track component unmount
      const duration = Date.now() - startTime.current;
      monitoringService.trackMetric('component_lifetime', duration, {
        component: componentName || 'component',
      });
    };
  }, [componentName]);

  return {
    trackInteraction: (action: string, properties?: Record<string, any>) => {
      monitoringService.trackClick(`${componentName}:${action}`, properties);
    },
    trackPerformance: (name: string, duration: number) => {
      monitoringService.trackPerformanceMetric(name, duration, 'ms');
    },
    trackError: (error: Error, context?: Record<string, any>) => {
      monitoringService.trackMetric('component_error', 1, {
        component: componentName || 'component',
        error_type: error.name,
        ...context,
      });
    },
  };
}

// Initialize monitoring
if (typeof window !== 'undefined') {
  // Track route changes
  let lastPath = window.location.pathname;
  const checkRouteChange = () => {
    const currentPath = window.location.pathname;
    if (currentPath !== lastPath) {
      monitoringService.trackMetric('page_view', 1, {
        path: currentPath,
        referrer: lastPath,
      });
      lastPath = currentPath;
    }
  };

  // Override pushState and replaceState to catch SPA navigation
  const originalPushState = history.pushState;
  const originalReplaceState = history.replaceState;

  history.pushState = function(state: any, title: string, url?: string | URL | null) {
    originalPushState.call(this, state, title, url);
    setTimeout(checkRouteChange, 0);
  };

  history.replaceState = function(state: any, title: string, url?: string | URL | null) {
    originalReplaceState.call(this, state, title, url);
    setTimeout(checkRouteChange, 0);
  };

  window.addEventListener('popstate', checkRouteChange);

  // Track initial page view
  monitoringService.trackMetric('page_view', 1, {
    path: window.location.pathname,
    referrer: document.referrer,
  });
}
