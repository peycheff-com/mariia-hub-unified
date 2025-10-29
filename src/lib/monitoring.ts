/**
 * Production Monitoring and Observability
 * Implements comprehensive monitoring for production
 */

import { createClient } from '@supabase/supabase-js';

export interface MonitoringMetrics {
  performance: {
    FCP: number; // First Contentful Paint
    LCP: number; // Largest Contentful Paint
    FID: number; // First Input Delay
    CLS: number; // Cumulative Layout Shift
    TTFB: number; // Time to First Byte
  };
  errors: {
    count: number;
    types: Record<string, number>;
    recent: Array<{
      message: string;
      stack: string;
      timestamp: number;
      url: string;
      userAgent: string;
    }>;
  };
  usage: {
    pageViews: number;
    uniqueVisitors: number;
    bookingsCount: number;
    conversionRate: number;
    bounceRate: number;
  };
  resources: {
    apiLatency: Record<string, number[]>;
    dbConnections: number;
    cacheHitRate: number;
    bandwidthUsage: number;
  };
}

export class ProductionMonitor {
  private static instance: ProductionMonitor;
  private supabase: any;
  private metrics: MonitoringMetrics;
  private reportingInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.supabase = createClient(
      import.meta.env.VITE_SUPABASE_URL!,
      import.meta.env.VITE_SUPABASE_ANON_KEY!
    );

    this.metrics = this.initializeMetrics();
  }

  static getInstance(): ProductionMonitor {
    if (!ProductionMonitor.instance) {
      ProductionMonitor.instance = new ProductionMonitor();
    }
    return ProductionMonitor.instance;
  }

  private initializeMetrics(): MonitoringMetrics {
    return {
      performance: { FCP: 0, LCP: 0, FID: 0, CLS: 0, TTFB: 0 },
      errors: { count: 0, types: {}, recent: [] },
      usage: { pageViews: 0, uniqueVisitors: 0, bookingsCount: 0, conversionRate: 0, bounceRate: 0 },
      resources: { apiLatency: {}, dbConnections: 0, cacheHitRate: 0, bandwidthUsage: 0 }
    };
  }

  /**
   * Initialize monitoring
   */
  initialize() {
    // Performance monitoring
    this.initializePerformanceMonitoring();

    // Error tracking
    this.initializeErrorTracking();

    // User behavior tracking
    this.initializeUserTracking();

    // Resource monitoring
    this.initializeResourceMonitoring();

    // Start periodic reporting
    this.startReporting();

    console.log('Production monitoring initialized');
  }

  /**
   * Performance monitoring with Web Vitals
   */
  private initializePerformanceMonitoring() {
    // Import Web Vitals library dynamically
    import('web-vitals').then(({ onFCP, onLCP, onFID, onCLS, onTTFB }) => {
      onFCP(metric => {
        this.metrics.performance.FCP = metric.value;
        this.reportMetric('FCP', metric.value);
      });

      onLCP(metric => {
        this.metrics.performance.LCP = metric.value;
        this.reportMetric('LCP', metric.value);
      });

      onFID(metric => {
        this.metrics.performance.FID = metric.value;
        this.reportMetric('FID', metric.value);
      });

      onCLS(metric => {
        this.metrics.performance.CLS = metric.value;
        this.reportMetric('CLS', metric.value);
      });

      onTTFB(metric => {
        this.metrics.performance.TTFB = metric.value;
        this.reportMetric('TTFB', metric.value);
      });
    }).catch(err => {
      console.warn('Web Vitals not loaded:', err);
    });

    // Monitor page load time
    window.addEventListener('load', () => {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      const loadTime = navigation.loadEventEnd - navigation.loadEventStart;
      this.reportMetric('pageLoadTime', loadTime);
    });
  }

  /**
   * Error tracking and reporting
   */
  private initializeErrorTracking() {
    // Global error handler
    window.addEventListener('error', (event) => {
      this.trackError({
        message: event.message,
        stack: event.error?.stack || '',
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        timestamp: Date.now()
      });
    });

    // Unhandled promise rejection handler
    window.addEventListener('unhandledrejection', (event) => {
      this.trackError({
        message: 'Unhandled Promise Rejection',
        stack: event.reason?.stack || String(event.reason),
        timestamp: Date.now()
      });
    });

    // React error boundary support
    window.addEventListener('react-error', (event: any) => {
      this.trackError({
        message: event.detail.error.message,
        stack: event.detail.error.stack,
        componentStack: event.detail.error.componentStack,
        timestamp: Date.now()
      });
    });
  }

  /**
   * User behavior tracking
   */
  private initializeUserTracking() {
    // Track page views
    this.trackPageView();

    // Track booking funnel events
    this.initializeFunnelTracking();

    // Track user engagement
    this.initializeEngagementTracking();
  }

  /**
   * Resource and API monitoring
   */
  private initializeResourceMonitoring() {
    // Monitor API calls
    this.interceptFetch();

    // Monitor resource loading
    this.monitorResourceLoading();

    // Monitor cache performance
    this.monitorCachePerformance();
  }

  /**
   * Track page view
   */
  private trackPageView() {
    this.metrics.usage.pageViews++;

    const pageData = {
      url: window.location.pathname,
      referrer: document.referrer,
      userAgent: navigator.userAgent,
      timestamp: Date.now(),
      sessionId: this.getSessionId(),
      userId: this.getUserId()
    };

    this.reportEvent('pageView', pageData);
  }

  /**
   * Initialize funnel tracking for booking flow
   */
  private initializeFunnelTracking() {
    // Track booking steps
    const bookingSteps = ['service-selection', 'time-selection', 'details', 'payment'];

    bookingSteps.forEach(step => {
      const observer = new MutationObserver(() => {
        if (document.querySelector(`[data-booking-step="${step}"]`)) {
          this.reportEvent('bookingStep', { step, timestamp: Date.now() });
        }
      });

      observer.observe(document.body, { childList: true, subtree: true });
    });

    // Track conversion events
    this.trackConversions();
  }

  /**
   * Track conversion events
   */
  private trackConversions() {
    // Listen for successful bookings
    window.addEventListener('booking:success', () => {
      this.metrics.usage.bookingsCount++;
      this.reportEvent('conversion', { type: 'booking', timestamp: Date.now() });
    });

    // Track newsletter signups
    window.addEventListener('newsletter:signup', () => {
      this.reportEvent('conversion', { type: 'newsletter', timestamp: Date.now() });
    });
  }

  /**
   * Track user engagement
   */
  private initializeEngagementTracking() {
    const startTime = Date.now();
    let isActive = true;

    // Track time on page
    const trackTimeOnPage = () => {
      const timeSpent = Date.now() - startTime;
      this.reportEvent('engagement', { type: 'timeOnPage', duration: timeSpent });
    };

    window.addEventListener('beforeunload', trackTimeOnPage);

    // Track user activity
    ['mousedown', 'keydown', 'scroll', 'touchstart'].forEach(event => {
      document.addEventListener(event, () => {
        if (!isActive) {
          isActive = true;
          this.reportEvent('engagement', { type: 'return' });
        }
      }, { passive: true });
    });

    // Track inactivity
    setInterval(() => {
      if (isActive) {
        isActive = false;
        this.reportEvent('engagement', { type: 'inactivity' });
      }
    }, 30000); // 30 seconds
  }

  /**
   * Intercept fetch for API monitoring
   */
  private interceptFetch() {
    const originalFetch = window.fetch;

    window.fetch = async (...args) => {
      const startTime = performance.now();
      const url = args[0] as string;

      try {
        const response = await originalFetch(...args);
        const duration = performance.now() - startTime;

        this.recordApiLatency(url, duration);

        if (!response.ok) {
          this.trackError({
            message: `HTTP Error: ${response.status}`,
            url,
            status: response.status,
            timestamp: Date.now()
          });
        }

        return response;
      } catch (error) {
        const duration = performance.now() - startTime;

        this.trackError({
          message: 'Network Error',
          url,
          error: String(error),
          timestamp: Date.now()
        });

        throw error;
      }
    };
  }

  /**
   * Monitor resource loading performance
   */
  private monitorResourceLoading() {
    const observer = new PerformanceObserver((list) => {
      list.getEntries().forEach((entry) => {
        if (entry.entryType === 'resource') {
          const resource = entry as PerformanceResourceTiming;

          if (resource.decodedBodySize > 1024 * 1024) { // > 1MB
            this.reportMetric('largeResource', {
              name: resource.name,
              size: resource.decodedBodySize,
              duration: resource.duration
            });
          }

          if (resource.duration > 3000) { // > 3s
            this.reportMetric('slowResource', {
              name: resource.name,
              duration: resource.duration
            });
          }
        }
      });
    });

    observer.observe({ entryTypes: ['resource'] });
  }

  /**
   * Monitor cache performance
   */
  private monitorCachePerformance() {
    if ('caches' in window) {
      setInterval(async () => {
        try {
          const cache = await caches.open('mariia-hub-v1');
          const keys = await cache.keys();

          // Report cache size
          this.reportMetric('cacheSize', keys.length);

          // Test cache hit rate
          const testUrl = window.location.origin + '/api/health';
          const cached = await cache.match(testUrl);
          this.metrics.resources.cacheHitRate = cached ? 1 : 0;

        } catch (error) {
          console.warn('Cache monitoring error:', error);
        }
      }, 60000); // Every minute
    }
  }

  /**
   * Record API latency
   */
  private recordApiLatency(url: string, duration: number) {
    const endpoint = new URL(url).pathname;

    if (!this.metrics.resources.apiLatency[endpoint]) {
      this.metrics.resources.apiLatency[endpoint] = [];
    }

    this.metrics.resources.apiLatency[endpoint].push(duration);

    // Keep only last 100 measurements
    if (this.metrics.resources.apiLatency[endpoint].length > 100) {
      this.metrics.resources.apiLatency[endpoint].shift();
    }

    // Alert on slow API calls
    if (duration > 2000) {
      this.reportAlert('slowAPI', { endpoint, duration });
    }
  }

  /**
   * Track errors
   */
  private trackError(error: any) {
    this.metrics.errors.count++;

    const errorType = error.message.includes('Network') ? 'network' :
                     error.message.includes('HTTP') ? 'http' :
                     error.message.includes('React') ? 'react' : 'javascript';

    this.metrics.errors.types[errorType] = (this.metrics.errors.types[errorType] || 0) + 1;

    this.metrics.errors.recent.unshift({
      message: error.message,
      stack: error.stack || '',
      timestamp: error.timestamp,
      url: window.location.href,
      userAgent: navigator.userAgent
    });

    // Keep only last 50 errors
    if (this.metrics.errors.recent.length > 50) {
      this.metrics.errors.recent.pop();
    }

    // Report to monitoring service
    this.reportError(error);

    // Alert on high error rate
    if (this.metrics.errors.count > 10) {
      this.reportAlert('highErrorRate', { count: this.metrics.errors.count });
    }
  }

  /**
   * Report metric to backend
   */
  private async reportMetric(name: string, value: any) {
    if (!import.meta.env.PROD) return;

    try {
      await this.supabase.from('monitoring_metrics').insert({
        name,
        value: typeof value === 'object' ? JSON.stringify(value) : value,
        timestamp: new Date().toISOString(),
        session_id: this.getSessionId(),
        user_id: this.getUserId()
      });
    } catch (error) {
      console.error('Failed to report metric:', error);
    }
  }

  /**
   * Report event to backend
   */
  private async reportEvent(type: string, data: any) {
    if (!import.meta.env.PROD) return;

    try {
      await this.supabase.from('monitoring_events').insert({
        type,
        data,
        timestamp: new Date().toISOString(),
        session_id: this.getSessionId(),
        user_id: this.getUserId()
      });
    } catch (error) {
      console.error('Failed to report event:', error);
    }
  }

  /**
   * Report error to backend
   */
  private async reportError(error: any) {
    if (!import.meta.env.PROD) return;

    try {
      await this.supabase.from('monitoring_errors').insert({
        message: error.message,
        stack: error.stack,
        url: window.location.href,
        user_agent: navigator.userAgent,
        timestamp: new Date().toISOString(),
        session_id: this.getSessionId(),
        user_id: this.getUserId()
      });
    } catch (error) {
      console.error('Failed to report error:', error);
    }
  }

  /**
   * Send alert for critical issues
   */
  private async reportAlert(type: string, data: any) {
    if (!import.meta.env.PROD) return;

    try {
      // Send to webhook/Slack/email
      await fetch('/api/alerts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type,
          data,
          severity: type === 'highErrorRate' ? 'critical' : 'warning',
          timestamp: new Date().toISOString(),
          url: window.location.href
        })
      });
    } catch (error) {
      console.error('Failed to send alert:', error);
    }
  }

  /**
   * Start periodic reporting
   */
  private startReporting() {
    this.reportingInterval = setInterval(async () => {
      await this.sendMetricsReport();
    }, 60000); // Every minute
  }

  /**
   * Send aggregated metrics report
   */
  private async sendMetricsReport() {
    if (!import.meta.env.PROD) return;

    try {
      const report = {
        timestamp: new Date().toISOString(),
        metrics: this.metrics,
        uptime: performance.now(),
        memory: (performance as any).memory ? {
          used: (performance as any).memory.usedJSHeapSize,
          total: (performance as any).memory.totalJSHeapSize,
          limit: (performance as any).memory.jsHeapSizeLimit
        } : null
      };

      await this.supabase.from('monitoring_reports').insert(report);
    } catch (error) {
      console.error('Failed to send metrics report:', error);
    }
  }

  /**
   * Get session ID
   */
  private getSessionId(): string {
    const key = 'session_id';
    let sessionId = sessionStorage.getItem(key);
    if (!sessionId) {
      sessionId = crypto.randomUUID();
      sessionStorage.setItem(key, sessionId);
    }
    return sessionId;
  }

  /**
   * Get user ID if authenticated
   */
  private getUserId(): string | null {
    return localStorage.getItem('user_id') || null;
  }

  /**
   * Get current metrics
   */
  getMetrics(): MonitoringMetrics {
    return { ...this.metrics };
  }

  /**
   * Stop monitoring
   */
  stop() {
    if (this.reportingInterval) {
      clearInterval(this.reportingInterval);
      this.reportingInterval = null;
    }
  }
}

export const productionMonitor = ProductionMonitor.getInstance();

/**
 * Initialize production monitoring
 */
export function initializeMonitoring() {
  if (import.meta.env.PROD) {
    productionMonitor.initialize();
  }
}