/**
 * Enterprise-Grade Performance Monitoring System
 * Real-time performance metrics collection, alerting, and SLA monitoring
 * for Mariia Hub platform
 */

import { createClient } from '@supabase/supabase-js';

import { logger } from '@/services/logger.service';

// Core Web Vitals interfaces
export interface CoreWebVitals {
  lcp: number; // Largest Contentful Paint (ms)
  fid: number; // First Input Delay (ms)
  cls: number; // Cumulative Layout Shift
  fcp: number; // First Contentful Paint (ms)
  ttfb: number; // Time to First Byte (ms)
  inp?: number; // Interaction to Next Paint (ms)
  tbt?: number; // Total Blocking Time (ms)
  clsDelta?: number; // CLS delta for layout shift tracking
}

// Performance metrics interfaces
export interface PagePerformanceMetrics {
  url: string;
  timestamp: number;
  vitals: CoreWebVitals;
  navigation: {
    type: NavigationType;
    redirectCount: number;
    transferSize: number;
    encodedBodySize: number;
    decodedBodySize: number;
    domContentLoaded: number;
    loadComplete: number;
    firstPaint: number;
    firstContentfulPaint: number;
  };
  resources: {
    count: number;
    totalSize: number;
    compressedSize: number;
    slowResources: Array<{
      name: string;
      duration: number;
      size: number;
      type: string;
    }>;
    largeResources: Array<{
      name: string;
      size: number;
      type: string;
    }>;
  };
  memory?: {
    used: number;
    total: number;
    limit: number;
    percentage: number;
  };
  connectivity: {
    effectiveType: string;
    downlink: number;
    rtt: number;
    saveData: boolean;
  };
  device: {
    userAgent: string;
    screenResolution: string;
    viewportSize: string;
    deviceMemory?: number;
    hardwareConcurrency: number;
  };
  geo: {
    country?: string;
    city?: string;
    timezone: string;
  };
  customMetrics: Record<string, number>;
}

// API Performance interfaces
export interface APIPerformanceMetrics {
  endpoint: string;
  method: string;
  statusCode: number;
  responseTime: number;
  requestSize: number;
  responseSize: number;
  cacheHit: boolean;
  retries: number;
  error?: string;
  stackTrace?: string;
  timestamp: number;
  userAgent: string;
  sessionId: string;
  userId?: string;
}

// Performance thresholds and SLAs
export interface PerformanceThresholds {
  lcp: { good: number; needsImprovement: number; poor: number };
  fid: { good: number; needsImprovement: number; poor: number };
  cls: { good: number; needsImprovement: number; poor: number };
  fcp: { good: number; needsImprovement: number; poor: number };
  ttfb: { good: number; needsImprovement: number; poor: number };
  apiResponseTime: { good: number; needsImprovement: number; poor: number };
  errorRate: { good: number; needsImprovement: number; poor: number };
  availability: { good: number; needsImprovement: number; poor: number };
}

// Performance alerts interface
export interface PerformanceAlert {
  id: string;
  type: 'performance' | 'availability' | 'error' | 'resource' | 'sla';
  severity: 'info' | 'warning' | 'critical';
  title: string;
  message: string;
  metric: string;
  value: number;
  threshold: number;
  url?: string;
  timestamp: number;
  resolved: boolean;
  resolvedAt?: number;
  resolvedBy?: string;
  acknowledged: boolean;
  acknowledgedAt?: number;
  acknowledgedBy?: string;
  details: Record<string, any>;
  businessImpact: 'low' | 'medium' | 'high' | 'critical';
  affectedUsers?: number;
  estimatedRevenue?: number;
}

// SLA tracking interface
export interface SLAMetrics {
  period: 'hourly' | 'daily' | 'weekly' | 'monthly';
  startTime: number;
  endTime: number;
  availability: {
    target: number;
    actual: number;
    downtime: number;
    incidents: number;
  };
  performance: {
    lcpTarget: number;
    lcpActual: number;
    responseTimeTarget: number;
    responseTimeActual: number;
    errorRateTarget: number;
    errorRateActual: number;
  };
  business: {
    totalRequests: number;
    successfulRequests: number;
    failedRequests: number;
    affectedUsers: number;
    revenueImpact: number;
  };
  compliance: {
    met: boolean;
    violations: number;
    penalties: number;
    credits: number;
  };
}

// Performance monitoring configuration
export interface PerformanceMonitoringConfig {
  enabled: boolean;
  sampleRate: number; // 0.0 to 1.0
  thresholds: PerformanceThresholds;
  slaTargets: {
    availability: number; // 99.9, 99.99, etc.
    responseTime: number; // ms
    errorRate: number; // percentage
    lcp: number; // ms
  };
  alerting: {
    enabled: boolean;
    channels: ('email' | 'slack' | 'webhook' | 'sms')[];
    thresholds: PerformanceThresholds;
    cooldownPeriod: number; // ms
    escalationPolicy: {
      warningDelay: number; // ms
      criticalDelay: number; // ms
    };
  };
  reporting: {
    enabled: boolean;
    interval: number; // ms
    retention: number; // days
    exportFormats: ('json' | 'csv' | 'pdf')[];
  };
  integrations: {
    sentry: boolean;
    newRelic: boolean;
    dataDog: boolean;
    googleAnalytics: boolean;
    customWebhook: boolean;
  };
}

class PerformanceMonitoringService {
  private static instance: PerformanceMonitoringService;
  private supabase: any;
  private config: PerformanceMonitoringConfig;
  private isInitialized = false;
  private observers: PerformanceObserver[] = [];
  private metrics: PagePerformanceMetrics[] = [];
  private apiMetrics: APIPerformanceMetrics[] = [];
  private alerts: PerformanceAlert[] = [];
  private sessionId: string;
  private userId?: string;
  private reportingInterval?: NodeJS.Timeout;
  private cleanupInterval?: NodeJS.Timeout;

  constructor() {
    this.supabase = createClient(
      import.meta.env.VITE_SUPABASE_URL!,
      import.meta.env.VITE_SUPABASE_ANON_KEY!
    );

    this.config = this.getDefaultConfig();
    this.sessionId = this.generateSessionId();
  }

  static getInstance(): PerformanceMonitoringService {
    if (!PerformanceMonitoringService.instance) {
      PerformanceMonitoringService.instance = new PerformanceMonitoringService();
    }
    return PerformanceMonitoringService.instance;
  }

  private getDefaultConfig(): PerformanceMonitoringConfig {
    return {
      enabled: import.meta.env.PROD,
      sampleRate: 1.0, // 100% sampling for comprehensive monitoring
      thresholds: {
        lcp: { good: 2500, needsImprovement: 4000, poor: 6000 },
        fid: { good: 100, needsImprovement: 300, poor: 500 },
        cls: { good: 0.1, needsImprovement: 0.25, poor: 0.5 },
        fcp: { good: 1800, needsImprovement: 3000, poor: 4000 },
        ttfb: { good: 800, needsImprovement: 1800, poor: 3000 },
        apiResponseTime: { good: 500, needsImprovement: 1500, poor: 3000 },
        errorRate: { good: 0.1, needsImprovement: 1.0, poor: 5.0 },
        availability: { good: 99.9, needsImprovement: 99.0, poor: 95.0 }
      },
      slaTargets: {
        availability: 99.9,
        responseTime: 1000,
        errorRate: 0.5,
        lcp: 2500
      },
      alerting: {
        enabled: true,
        channels: ['webhook', 'email'],
        thresholds: {
          lcp: { good: 2500, needsImprovement: 4000, poor: 6000 },
          fid: { good: 100, needsImprovement: 300, poor: 500 },
          cls: { good: 0.1, needsImprovement: 0.25, poor: 0.5 },
          fcp: { good: 1800, needsImprovement: 3000, poor: 4000 },
          ttfb: { good: 800, needsImprovement: 1800, poor: 3000 },
          apiResponseTime: { good: 500, needsImprovement: 1500, poor: 3000 },
          errorRate: { good: 0.1, needsImprovement: 1.0, poor: 5.0 },
          availability: { good: 99.9, needsImprovement: 99.0, poor: 95.0 }
        },
        cooldownPeriod: 300000, // 5 minutes
        escalationPolicy: {
          warningDelay: 600000, // 10 minutes
          criticalDelay: 300000  // 5 minutes
        }
      },
      reporting: {
        enabled: true,
        interval: 60000, // 1 minute
        retention: 90, // 90 days
        exportFormats: ['json', 'csv']
      },
      integrations: {
        sentry: true,
        newRelic: false,
        dataDog: false,
        googleAnalytics: true,
        customWebhook: true
      }
    };
  }

  async initialize(): Promise<void> {
    if (this.isInitialized || !this.config.enabled) return;

    try {
      // Initialize Core Web Vitals monitoring
      await this.initializeWebVitalsMonitoring();

      // Initialize API monitoring
      this.initializeAPIMonitoring();

      // Initialize resource monitoring
      this.initializeResourceMonitoring();

      // Initialize user interaction monitoring
      this.initializeInteractionMonitoring();

      // Initialize real-time reporting
      this.initializeReporting();

      // Initialize cleanup
      this.initializeCleanup();

      // Set up error boundaries
      this.initializeErrorTracking();

      this.isInitialized = true;
      logger.info('Performance monitoring initialized', {
        sessionId: this.sessionId,
        config: this.config
      });

    } catch (error) {
      logger.error('Failed to initialize performance monitoring', error);
      throw error;
    }
  }

  private async initializeWebVitalsMonitoring(): Promise<void> {
    try {
      // Dynamically import web-vitals library
      const { onCLS, onFID, onFCP, onLCP, onTTFB, onINP } = await import('web-vitals');

      // Monitor Cumulative Layout Shift
      onCLS((metric) => {
        this.recordWebVital('cls', metric.value, {
          rating: metric.rating,
          delta: metric.delta,
          entries: metric.entries
        });
      });

      // Monitor First Input Delay
      onFID((metric) => {
        this.recordWebVital('fid', metric.value, {
          rating: metric.rating,
          delta: metric.delta,
          entries: metric.entries
        });
      });

      // Monitor First Contentful Paint
      onFCP((metric) => {
        this.recordWebVital('fcp', metric.value, {
          rating: metric.rating,
          delta: metric.delta,
          entries: metric.entries
        });
      });

      // Monitor Largest Contentful Paint
      onLCP((metric) => {
        this.recordWebVital('lcp', metric.value, {
          rating: metric.rating,
          delta: metric.delta,
          entries: metric.entries,
          element: (metric as any).element?.tagName,
          url: (metric as any).url
        });
      });

      // Monitor Time to First Byte
      onTTFB((metric) => {
        this.recordWebVital('ttfb', metric.value, {
          rating: metric.rating,
          delta: metric.delta,
          entries: metric.entries
        });
      });

      // Monitor Interaction to Next Paint (if supported)
      if (onINP) {
        onINP((metric) => {
          this.recordWebVital('inp', metric.value, {
            rating: metric.rating,
            delta: metric.delta,
            entries: metric.entries,
            target: (metric as any).target?.tagName
          });
        });
      }

    } catch (error) {
      logger.warn('Web Vitals monitoring initialization failed', error);
    }
  }

  private initializeAPIMonitoring(): void {
    // Intercept fetch calls for API monitoring
    const originalFetch = window.fetch;

    window.fetch = async (...args) => {
      const startTime = performance.now();
      const url = args[0] as string;
      const options = args[1] || {};

      // Only monitor API calls
      if (!url.includes('/api/') && !url.includes(import.meta.env.VITE_SUPABASE_URL)) {
        return originalFetch(...args);
      }

      let response: Response;
      let error: Error | undefined;
      let retries = 0;

      // Retry logic for failed requests
      const maxRetries = 2;
      while (retries <= maxRetries) {
        try {
          response = await originalFetch(...args);
          break;
        } catch (err) {
          error = err as Error;
          retries++;
          if (retries > maxRetries) throw err;
          // Exponential backoff
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, retries) * 100));
        }
      }

      const duration = performance.now() - startTime;
      const endpoint = new URL(url).pathname;

      const apiMetric: APIPerformanceMetrics = {
        endpoint,
        method: options.method || 'GET',
        statusCode: response?.status || 500,
        responseTime: duration,
        requestSize: JSON.stringify(options.body || {}).length,
        responseSize: 0, // Would need to clone response to get size
        cacheHit: response?.headers.get('x-cache') === 'HIT',
        retries,
        error: error?.message,
        stackTrace: error?.stack,
        timestamp: Date.now(),
        userAgent: navigator.userAgent,
        sessionId: this.sessionId,
        userId: this.userId
      };

      this.recordAPIMetric(apiMetric);

      // Check for performance issues
      if (duration > this.config.thresholds.apiResponseTime.poor) {
        this.createPerformanceAlert({
          type: 'performance',
          severity: 'critical',
          title: 'Slow API Response',
          message: `API endpoint ${endpoint} took ${Math.round(duration)}ms to respond`,
          metric: 'apiResponseTime',
          value: duration,
          threshold: this.config.thresholds.apiResponseTime.poor,
          url: endpoint,
          timestamp: Date.now(),
          resolved: false,
          acknowledged: false,
          details: { method: options.method || 'GET', retries, statusCode: response?.status },
          businessImpact: duration > 5000 ? 'high' : 'medium'
        });
      }

      return response!;
    };
  }

  private initializeResourceMonitoring(): void {
    // Monitor resource loading performance
    if ('PerformanceObserver' in window) {
      const resourceObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries() as PerformanceResourceTiming[];

        entries.forEach(entry => {
          const loadTime = entry.responseEnd - entry.requestStart;
          const size = entry.transferSize || 0;
          const resourceType = this.getResourceType(entry.name);

          // Track slow resources
          if (loadTime > 2000) {
            this.recordSlowResource({
              name: entry.name,
              duration: loadTime,
              size,
              type: resourceType
            });
          }

          // Track large resources
          if (size > 1024 * 1024) { // > 1MB
            this.recordLargeResource({
              name: entry.name,
              size,
              type: resourceType
            });
          }
        });
      });

      resourceObserver.observe({ type: 'resource', buffered: true });
      this.observers.push(resourceObserver);
    }
  }

  private initializeInteractionMonitoring(): void {
    // Monitor user interactions and page transitions
    let lastInteractionTime = performance.now();

    // Track interaction latency
    ['click', 'touchstart', 'keydown'].forEach(eventType => {
      document.addEventListener(eventType, (event) => {
        const now = performance.now();
        const latency = now - lastInteractionTime;

        if (latency > 100) { // Only track interactions with noticeable delay
          this.recordInteractionLatency(eventType, latency);
        }

        lastInteractionTime = now;
      }, { passive: true });
    });

    // Monitor page visibility changes
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') {
        this.flushMetrics(); // Flush metrics when user leaves page
      }
    });

    // Monitor page unload
    window.addEventListener('beforeunload', () => {
      this.flushMetrics();
    });
  }

  private initializeErrorTracking(): void {
    // Track JavaScript errors
    window.addEventListener('error', (event) => {
      this.recordError({
        type: 'javascript',
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        stack: event.error?.stack,
        timestamp: Date.now()
      });
    });

    // Track unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.recordError({
        type: 'promise',
        message: event.reason?.message || String(event.reason),
        stack: event.reason?.stack,
        timestamp: Date.now()
      });
    });
  }

  private initializeReporting(): void {
    if (this.config.reporting.enabled) {
      this.reportingInterval = setInterval(() => {
        this.reportMetrics();
      }, this.config.reporting.interval);
    }
  }

  private initializeCleanup(): void {
    // Clean up old metrics periodically
    this.cleanupInterval = setInterval(() => {
      this.cleanupOldMetrics();
    }, 60 * 60 * 1000); // Every hour
  }

  private recordWebVital(name: string, value: number, metadata: any): void {
    const threshold = this.config.thresholds[name as keyof PerformanceThresholds];
    if (!threshold) return;

    const rating = this.getRating(value, threshold);

    // Store metric
    if (!this.metrics.length) {
      this.metrics.push(this.createBaseMetrics());
    }

    const currentMetrics = this.metrics[this.metrics.length - 1];
    (currentMetrics.vitals as any)[name] = value;

    // Log to analytics
    logger.performance(`web_vital_${name}`, value, {
      rating,
      sessionId: this.sessionId,
      userId: this.userId,
      ...metadata
    });

    // Send to Google Analytics
    if (this.config.integrations.googleAnalytics && typeof gtag !== 'undefined') {
      gtag('event', 'web_vital', {
        event_category: 'Web Vitals',
        event_label: name,
        value: Math.round(name === 'cls' ? value * 1000 : value),
        custom_parameter_1: rating,
        non_interaction: true
      });
    }

    // Check for alerts
    if (rating === 'poor') {
      this.createPerformanceAlert({
        type: 'performance',
        severity: 'warning',
        title: `Poor ${name.toUpperCase()} Performance`,
        message: `${name.toUpperCase()} is ${value} (rating: ${rating})`,
        metric: name,
        value,
        threshold: threshold.poor,
        url: window.location.href,
        timestamp: Date.now(),
        resolved: false,
        acknowledged: false,
        details: { rating, ...metadata },
        businessImpact: this.getBusinessImpact(name, value)
      });
    }
  }

  private recordAPIMetric(metric: APIPerformanceMetrics): void {
    this.apiMetrics.push(metric);

    // Keep only last 1000 API metrics
    if (this.apiMetrics.length > 1000) {
      this.apiMetrics = this.apiMetrics.slice(-1000);
    }

    // Store in database (batch operation)
    this.storeAPIMetric(metric);
  }

  private recordSlowResource(resource: { name: string; duration: number; size: number; type: string }): void {
    if (this.metrics.length) {
      const currentMetrics = this.metrics[this.metrics.length - 1];
      currentMetrics.resources.slowResources.push(resource);
    }

    logger.warn('Slow resource detected', resource);
  }

  private recordLargeResource(resource: { name: string; size: number; type: string }): void {
    if (this.metrics.length) {
      const currentMetrics = this.metrics[this.metrics.length - 1];
      currentMetrics.resources.largeResources.push(resource);
    }

    logger.warn('Large resource detected', resource);
  }

  private recordInteractionLatency(eventType: string, latency: number): void {
    logger.debug('Interaction latency', { eventType, latency });
  }

  private recordError(error: any): void {
    logger.error('JavaScript error', error);

    // Send to Sentry if enabled
    if (this.config.integrations.sentry) {
      import('./sentry').then(({ reportError }) => {
        reportError(error.message, error.type || 'javascript', {
          stack: error.stack,
          sessionId: this.sessionId,
          userId: this.userId
        });
      }).catch(() => {
        // Silently ignore Sentry errors
      });
    }
  }

  private createBaseMetrics(): PagePerformanceMetrics {
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    const memory = (performance as any).memory;
    const connection = (navigator as any).connection;

    return {
      url: window.location.href,
      timestamp: Date.now(),
      vitals: {},
      navigation: {
        type: navigation.type,
        redirectCount: navigation.redirectCount,
        transferSize: navigation.transferSize,
        encodedBodySize: navigation.encodedBodySize,
        decodedBodySize: navigation.decodedBodySize,
        domContentLoaded: navigation.domContentLoadedEventEnd - navigation.navigationStart,
        loadComplete: navigation.loadEventEnd - navigation.navigationStart,
        firstPaint: 0,
        firstContentfulPaint: 0
      },
      resources: {
        count: 0,
        totalSize: 0,
        compressedSize: 0,
        slowResources: [],
        largeResources: []
      },
      memory: memory ? {
        used: memory.usedJSHeapSize,
        total: memory.totalJSHeapSize,
        limit: memory.jsHeapSizeLimit,
        percentage: (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100
      } : undefined,
      connectivity: {
        effectiveType: connection?.effectiveType || 'unknown',
        downlink: connection?.downlink || 0,
        rtt: connection?.rtt || 0,
        saveData: connection?.saveData || false
      },
      device: {
        userAgent: navigator.userAgent,
        screenResolution: `${screen.width}x${screen.height}`,
        viewportSize: `${window.innerWidth}x${window.innerHeight}`,
        deviceMemory: (navigator as any).deviceMemory,
        hardwareConcurrency: navigator.hardwareConcurrency
      },
      geo: {
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
      },
      customMetrics: {}
    };
  }

  private getRating(value: number, threshold: { good: number; needsImprovement: number; poor: number }): 'good' | 'needs-improvement' | 'poor' {
    if (value <= threshold.good) return 'good';
    if (value <= threshold.needsImprovement) return 'needs-improvement';
    return 'poor';
  }

  private getBusinessImpact(metric: string, value: number): 'low' | 'medium' | 'high' | 'critical' {
    // Business impact assessment based on metric severity
    switch (metric) {
      case 'lcp':
        if (value > 6000) return 'critical';
        if (value > 4000) return 'high';
        if (value > 2500) return 'medium';
        return 'low';
      case 'fid':
        if (value > 500) return 'high';
        if (value > 300) return 'medium';
        return 'low';
      case 'cls':
        if (value > 0.5) return 'critical';
        if (value > 0.25) return 'high';
        if (value > 0.1) return 'medium';
        return 'low';
      default:
        return 'medium';
    }
  }

  private getResourceType(url: string): string {
    if (url.includes('.js')) return 'script';
    if (url.includes('.css')) return 'stylesheet';
    if (url.match(/\.(png|jpg|jpeg|gif|webp|avif|svg)$/i)) return 'image';
    if (url.match(/\.(woff|woff2|ttf|eot)$/i)) return 'font';
    if (url.includes('/api/')) return 'api';
    return 'other';
  }

  private generateSessionId(): string {
    const key = 'performance_session_id';
    let sessionId = sessionStorage.getItem(key);
    if (!sessionId) {
      sessionId = crypto.randomUUID();
      sessionStorage.setItem(key, sessionId);
    }
    return sessionId;
  }

  private async createPerformanceAlert(alert: Omit<PerformanceAlert, 'id'>): Promise<void> {
    const fullAlert: PerformanceAlert = {
      ...alert,
      id: crypto.randomUUID()
    };

    this.alerts.push(fullAlert);

    // Store in database
    await this.storeAlert(fullAlert);

    // Send alert notifications
    await this.sendAlertNotification(fullAlert);

    logger.warn('Performance alert created', fullAlert);
  }

  private async storeAPIMetric(metric: APIPerformanceMetrics): Promise<void> {
    try {
      await this.supabase.from('monitoring_api_performance').insert({
        endpoint: metric.endpoint,
        method: metric.method,
        status_code: metric.statusCode,
        response_time_ms: Math.round(metric.responseTime),
        request_size_bytes: metric.requestSize,
        response_size_bytes: metric.responseSize,
        cache_hit: metric.cacheHit,
        error_message: metric.error,
        session_id: metric.sessionId,
        user_id: metric.userId,
        timestamp: new Date(metric.timestamp).toISOString()
      });
    } catch (error) {
      logger.error('Failed to store API metric', error);
    }
  }

  private async storeAlert(alert: PerformanceAlert): Promise<void> {
    try {
      await this.supabase.from('monitoring_alerts').insert({
        alert_type: alert.type,
        severity: alert.severity,
        title: alert.title,
        description: alert.message,
        details: alert.details,
        status: alert.resolved ? 'resolved' : alert.acknowledged ? 'acknowledged' : 'open',
        triggered_at: new Date(alert.timestamp).toISOString(),
        environment: import.meta.env.MODE
      });
    } catch (error) {
      logger.error('Failed to store alert', error);
    }
  }

  private async sendAlertNotification(alert: PerformanceAlert): Promise<void> {
    if (!this.config.alerting.enabled) return;

    try {
      // Send webhook notification
      if (this.config.alerting.channels.includes('webhook')) {
        await fetch('/api/alerts/performance', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(alert)
        });
      }

      // Could integrate with other notification channels here
      // Slack, email, SMS, etc.

    } catch (error) {
      logger.error('Failed to send alert notification', error);
    }
  }

  private async reportMetrics(): Promise<void> {
    if (this.metrics.length === 0) return;

    try {
      const latestMetrics = this.metrics[this.metrics.length - 1];

      // Store performance metrics in database
      await this.supabase.from('monitoring_performance').insert({
        page_url: latestMetrics.url,
        fcp_ms: Math.round(latestMetrics.vitals.fcp || 0),
        lcp_ms: Math.round(latestMetrics.vitals.lcp || 0),
        fid_ms: Math.round(latestMetrics.vitals.fid || 0),
        cls_score: latestMetrics.vitals.cls || 0,
        ttfb_ms: Math.round(latestMetrics.vitals.ttfb || 0),
        dom_interactive_ms: Math.round(latestMetrics.navigation.domContentLoaded),
        load_complete_ms: Math.round(latestMetrics.navigation.loadComplete),
        navigation_type: latestMetrics.navigation.type,
        device_type: this.getDeviceType(),
        connection_type: latestMetrics.connectivity.effectiveType,
        timestamp: new Date(latestMetrics.timestamp).toISOString(),
        session_id: this.sessionId,
        user_id: this.userId
      });

      // Store business metrics
      await this.reportBusinessMetrics();

    } catch (error) {
      logger.error('Failed to report metrics', error);
    }
  }

  private async reportBusinessMetrics(): Promise<void> {
    try {
      const now = Date.now();
      const hourAgo = now - 60 * 60 * 1000;

      // Calculate error rate
      const recentErrors = this.apiMetrics.filter(m =>
        m.timestamp > hourAgo && m.statusCode >= 400
      ).length;
      const recentRequests = this.apiMetrics.filter(m => m.timestamp > hourAgo).length;
      const errorRate = recentRequests > 0 ? (recentErrors / recentRequests) * 100 : 0;

      // Calculate average response time
      const responseTimes = this.apiMetrics
        .filter(m => m.timestamp > hourAgo)
        .map(m => m.responseTime);
      const avgResponseTime = responseTimes.length > 0
        ? responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length
        : 0;

      // Store business metrics
      await this.supabase.from('monitoring_business_metrics').insert({
        metric_type: 'user_engagement',
        metric_name: 'performance_summary',
        value: JSON.stringify({
          errorRate,
          avgResponseTime,
          totalRequests: recentRequests,
          uniqueUsers: new Set(this.apiMetrics.map(m => m.userId).filter(Boolean)).size
        }),
        timestamp: new Date().toISOString(),
        session_id: this.sessionId,
        user_id: this.userId
      });

    } catch (error) {
      logger.error('Failed to report business metrics', error);
    }
  }

  private cleanupOldMetrics(): void {
    const cutoffTime = Date.now() - (this.config.reporting.retention * 24 * 60 * 60 * 1000);

    // Clean up in-memory metrics
    this.metrics = this.metrics.filter(m => m.timestamp > cutoffTime);
    this.apiMetrics = this.apiMetrics.filter(m => m.timestamp > cutoffTime);
    this.alerts = this.alerts.filter(a => a.timestamp > cutoffTime && !a.resolved);
  }

  private getDeviceType(): string {
    const userAgent = navigator.userAgent;
    if (/tablet|ipad/i.test(userAgent)) return 'tablet';
    if (/mobile|phone/i.test(userAgent)) return 'mobile';
    return 'desktop';
  }

  private async flushMetrics(): Promise<void> {
    await this.reportMetrics();
  }

  // Public API methods

  public updateConfig(config: Partial<PerformanceMonitoringConfig>): void {
    this.config = { ...this.config, ...config };
  }

  public setUserId(userId: string): void {
    this.userId = userId;
  }

  public getCurrentMetrics(): PagePerformanceMetrics | null {
    return this.metrics.length > 0 ? this.metrics[this.metrics.length - 1] : null;
  }

  public getMetricsHistory(limit = 100): PagePerformanceMetrics[] {
    return this.metrics.slice(-limit);
  }

  public getAPIMetrics(limit = 1000): APIPerformanceMetrics[] {
    return this.apiMetrics.slice(-limit);
  }

  public getActiveAlerts(): PerformanceAlert[] {
    return this.alerts.filter(alert => !alert.resolved);
  }

  public async getSLAMetrics(period: 'hourly' | 'daily' | 'weekly' | 'monthly' = 'daily'): Promise<SLAMetrics[]> {
    try {
      const { data, error } = await this.supabase.rpc('calculate_sla_metrics', {
        p_period: period,
        p_start_time: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        p_end_time: new Date().toISOString()
      });

      if (error) throw error;
      return data || [];
    } catch (error) {
      logger.error('Failed to get SLA metrics', error);
      return [];
    }
  }

  public async acknowledgeAlert(alertId: string, userId: string): Promise<boolean> {
    try {
      const alert = this.alerts.find(a => a.id === alertId);
      if (alert) {
        alert.acknowledged = true;
        alert.acknowledgedAt = Date.now();
        alert.acknowledgedBy = userId;
      }

      const { error } = await this.supabase
        .from('monitoring_alerts')
        .update({
          status: 'acknowledged',
          acknowledged_at: new Date().toISOString(),
          acknowledged_by: userId
        })
        .eq('id', alertId);

      return !error;
    } catch (error) {
      logger.error('Failed to acknowledge alert', error);
      return false;
    }
  }

  public async resolveAlert(alertId: string, userId: string): Promise<boolean> {
    try {
      const alert = this.alerts.find(a => a.id === alertId);
      if (alert) {
        alert.resolved = true;
        alert.resolvedAt = Date.now();
        alert.resolvedBy = userId;
      }

      const { error } = await this.supabase
        .from('monitoring_alerts')
        .update({
          status: 'resolved',
          resolved_at: new Date().toISOString(),
          resolved_by: userId
        })
        .eq('id', alertId);

      return !error;
    } catch (error) {
      logger.error('Failed to resolve alert', error);
      return false;
    }
  }

  public async exportMetrics(format: 'json' | 'csv' = 'json', startDate?: Date, endDate?: Date): Promise<string> {
    try {
      const { data, error } = await this.supabase
        .from('monitoring_performance')
        .select('*')
        .gte('timestamp', startDate?.toISOString() || new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
        .lte('timestamp', endDate?.toISOString() || new Date().toISOString())
        .order('timestamp', { ascending: true });

      if (error) throw error;

      if (format === 'csv') {
        return this.convertToCSV(data || []);
      }

      return JSON.stringify(data, null, 2);
    } catch (error) {
      logger.error('Failed to export metrics', error);
      return '';
    }
  }

  private convertToCSV(data: any[]): string {
    if (!data.length) return '';

    const headers = Object.keys(data[0]);
    const csvRows = [headers.join(',')];

    for (const row of data) {
      const values = headers.map(header => {
        const value = row[header];
        return typeof value === 'string' && value.includes(',')
          ? `"${value.replace(/"/g, '""')}"`
          : value;
      });
      csvRows.push(values.join(','));
    }

    return csvRows.join('\n');
  }

  public destroy(): void {
    // Clean up intervals
    if (this.reportingInterval) {
      clearInterval(this.reportingInterval);
    }
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }

    // Disconnect observers
    this.observers.forEach(observer => observer.disconnect());
    this.observers = [];

    // Flush remaining metrics
    this.flushMetrics();

    this.isInitialized = false;
  }
}

// Export singleton instance
export const performanceMonitoringService = PerformanceMonitoringService.getInstance();

// Export convenient functions
export const initializePerformanceMonitoring = () => performanceMonitoringService.initialize();
export const recordCustomMetric = (name: string, value: number, metadata?: any) => {
  logger.performance(name, value, metadata);
};
export const getPerformanceMetrics = () => performanceMonitoringService.getCurrentMetrics();
export const acknowledgePerformanceAlert = (alertId: string, userId: string) =>
  performanceMonitoringService.acknowledgeAlert(alertId, userId);
export const resolvePerformanceAlert = (alertId: string, userId: string) =>
  performanceMonitoringService.resolveAlert(alertId, userId);

// Auto-initialize in production
if (import.meta.env.PROD) {
  initializePerformanceMonitoring().catch(console.error);
}