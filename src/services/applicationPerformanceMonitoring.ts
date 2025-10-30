/**
 * Application Performance Monitoring (APM)
 * Comprehensive monitoring for frontend performance, API response times, and resource utilization
 */

import { createClient } from '@supabase/supabase-js';

interface APMMetrics {
  sessionId: string;
  timestamp: number;
  metrics: {
    frontend?: FrontendMetrics;
    api?: APIMetrics;
    database?: DatabaseMetrics;
    resources?: ResourceMetrics;
    thirdParty?: ThirdPartyMetrics;
  };
  context: PerformanceContext;
}

interface FrontendMetrics {
  renderTime: number;
  componentMountTime: number;
  stateUpdateTime: number;
  memoryUsage: number;
  frameRate: number;
  interactionResponseTime: number;
  bundleLoadTime: number;
  cssLoadTime: number;
}

interface APIMetrics {
  requests: APIRequestMetric[];
  averageResponseTime: number;
  errorRate: number;
  timeoutRate: number;
  retryRate: number;
  slowRequests: number;
}

interface APIRequestMetric {
  endpoint: string;
  method: string;
  duration: number;
  status: number;
  size: number;
  cacheHit: boolean;
  retryCount: number;
  timestamp: number;
}

interface DatabaseMetrics {
  queryTime: number;
  connectionTime: number;
  slowQueries: number;
  failedQueries: number;
  connectionPoolUsage: number;
  cacheHitRate: number;
}

interface ResourceMetrics {
  totalRequests: number;
  totalSize: number;
  cachedResources: number;
  slowResources: number;
  failedResources: number;
  criticalResources: ResourceMetric[];
}

interface ResourceMetric {
  name: string;
  type: string;
  size: number;
  duration: number;
  priority: string;
  cached: boolean;
}

interface ThirdPartyMetrics {
  scripts: ThirdPartyScriptMetric[];
  totalLoadTime: number;
  blockingTime: number;
  errors: number;
}

interface ThirdPartyScriptMetric {
  name: string;
  loadTime: number;
  executionTime: number;
  size: number;
  blocking: boolean;
}

interface PerformanceContext {
  deviceInfo: DeviceInfo;
  networkInfo: NetworkInfo;
  geoData: GeoData;
  userAgent: string;
  url: string;
  referrer: string;
  screenResolution: string;
  viewport: string;
}

interface DeviceInfo {
  type: 'desktop' | 'mobile' | 'tablet';
  cores: number;
  memory: number;
  hardwareConcurrency: number;
}

interface NetworkInfo {
  effectiveType: string;
  downlink: number;
  rtt: number;
  saveData: boolean;
}

interface GeoData {
  country: string;
  region: string;
  city: string;
  timezone: string;
}

const APM_CONFIG = {
  // Performance thresholds
  thresholds: {
    renderTime: 16, // 60fps = 16.67ms per frame
    componentMountTime: 100,
    stateUpdateTime: 50,
    memoryUsage: 50 * 1024 * 1024, // 50MB
    frameRate: 55, // minimum 55fps
    interactionResponseTime: 100,
    bundleLoadTime: 3000,
    cssLoadTime: 1000,
    apiResponseTime: 2000,
    apiErrorRate: 0.01, // 1%
    databaseQueryTime: 1000,
    resourceLoadTime: 5000,
    thirdPartyLoadTime: 2000,
  },

  // Monitoring intervals
  intervals: {
    metrics: 30000, // 30 seconds
    performance: 1000, // 1 second
    memory: 5000, // 5 seconds
    frameRate: 100, // 100ms
  },

  // Sampling rates
  sampling: {
    frontend: 100, // Monitor all frontend performance
    api: 25, // 25% of API calls
    database: 10, // 10% of database queries
    resources: 15, // 15% of resource loading
    thirdParty: 20, // 20% of third-party scripts
  },

  // Maximum metrics to store locally
  maxStoredMetrics: 1000,

  // Retry configuration
  retry: {
    maxAttempts: 3,
    backoffMultiplier: 2,
    initialDelay: 1000,
  },
};

class ApplicationPerformanceMonitoring {
  private supabase: any;
  private sessionId: string;
  private metrics: APMMetrics[] = [];
  private context: PerformanceContext;
  private observers: Map<string, any> = new Map();
  private timers: Map<string, any> = new Map();
  private counters: Map<string, number> = new Map();
  private isMonitoring = false;

  constructor() {
    this.supabase = createClient(
      import.meta.env.VITE_SUPABASE_URL,
      import.meta.env.VITE_SUPABASE_ANON_KEY
    );
    this.sessionId = this.generateSessionId();
    this.context = this.initializeContext();

    this.init();
  }

  private init() {
    if (this.isMonitoring) return;
    this.isMonitoring = true;

    // Initialize performance observers
    this.initializePerformanceObservers();

    // Start metrics collection
    this.startMetricsCollection();

    // Set up global error tracking
    this.setupErrorTracking();

    // Set up API request monitoring
    this.setupAPIMonitoring();

    // Initialize third-party monitoring
    this.initializeThirdPartyMonitoring();

    // Start periodic reporting
    this.startPeriodicReporting();
  }

  private generateSessionId(): string {
    return `apm_session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private initializeContext(): PerformanceContext {
    const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;

    return {
      deviceInfo: {
        type: this.getDeviceType(),
        cores: navigator.hardwareConcurrency || 1,
        memory: (navigator as any).deviceMemory || 4,
        hardwareConcurrency: navigator.hardwareConcurrency || 1,
      },
      networkInfo: {
        effectiveType: connection?.effectiveType || 'unknown',
        downlink: connection?.downlink || 0,
        rtt: connection?.rtt || 0,
        saveData: connection?.saveData || false,
      },
      geoData: {
        country: 'unknown',
        region: 'unknown',
        city: 'unknown',
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      },
      userAgent: navigator.userAgent,
      url: window.location.href,
      referrer: document.referrer,
      screenResolution: `${window.screen.width}x${window.screen.height}`,
      viewport: `${window.innerWidth}x${window.innerHeight}`,
    };
  }

  private getDeviceType(): 'desktop' | 'mobile' | 'tablet' {
    const width = window.innerWidth;
    const isTouch = 'ontouchstart' in window;

    if (isTouch && width < 768) return 'mobile';
    if (isTouch && width >= 768 && width < 1024) return 'tablet';
    return 'desktop';
  }

  private initializePerformanceObservers() {
    // Observer for render performance
    if ('PerformanceObserver' in window) {
      try {
        const renderObserver = new PerformanceObserver((list) => {
          list.getEntries().forEach((entry) => {
            if (entry.entryType === 'measure' && entry.name.includes('render')) {
              this.recordRenderMetric(entry.name, entry.duration);
            }
          });
        });
        renderObserver.observe({ entryTypes: ['measure'] });
        this.observers.set('render', renderObserver);
      } catch (error) {
        console.warn('Render performance observer not supported:', error);
      }

      // Observer for navigation timing
      try {
        const navigationObserver = new PerformanceObserver((list) => {
          list.getEntries().forEach((entry) => {
            if (entry.entryType === 'navigation') {
              this.recordNavigationMetrics(entry as PerformanceNavigationTiming);
            }
          });
        });
        navigationObserver.observe({ entryTypes: ['navigation'] });
        this.observers.set('navigation', navigationObserver);
      } catch (error) {
        console.warn('Navigation performance observer not supported:', error);
      }

      // Observer for resource timing
      try {
        const resourceObserver = new PerformanceObserver((list) => {
          list.getEntries().forEach((entry) => {
            if (entry.entryType === 'resource') {
              this.recordResourceMetric(entry as PerformanceResourceTiming);
            }
          });
        });
        resourceObserver.observe({ entryTypes: ['resource'] });
        this.observers.set('resource', resourceObserver);
      } catch (error) {
        console.warn('Resource performance observer not supported:', error);
      }
    }
  }

  private startMetricsCollection() {
    // Collect frontend metrics periodically
    this.timers.set('frontend', setInterval(() => {
      this.collectFrontendMetrics();
    }, APM_CONFIG.intervals.metrics));

    // Monitor memory usage
    if ('memory' in performance) {
      this.timers.set('memory', setInterval(() => {
        this.collectMemoryMetrics();
      }, APM_CONFIG.intervals.memory));
    }

    // Monitor frame rate
    this.monitorFrameRate();

    // Monitor interaction response times
    this.monitorInteractions();
  }

  private collectFrontendMetrics() {
    if (Math.random() * 100 > APM_CONFIG.sampling.frontend) return;

    const metrics: FrontendMetrics = {
      renderTime: this.getAverageRenderTime(),
      componentMountTime: this.getAverageComponentMountTime(),
      stateUpdateTime: this.getAverageStateUpdateTime(),
      memoryUsage: this.getMemoryUsage(),
      frameRate: this.getCurrentFrameRate(),
      interactionResponseTime: this.getAverageInteractionTime(),
      bundleLoadTime: this.getBundleLoadTime(),
      cssLoadTime: this.getCSSLoadTime(),
    };

    this.recordMetrics('frontend', metrics);
  }

  private collectMemoryMetrics() {
    if (Math.random() * 100 > APM_CONFIG.sampling.frontend) return;

    const memory = (performance as any).memory;
    if (memory) {
      this.recordMetric('memoryUsage', {
        used: memory.usedJSHeapSize,
        total: memory.totalJSHeapSize,
        limit: memory.jsHeapSizeLimit,
        timestamp: Date.now(),
      });
    }
  }

  private monitorFrameRate() {
    let lastTime = performance.now();
    let frameCount = 0;
    let fps = 60;

    const measureFPS = (currentTime: number) => {
      frameCount++;

      if (currentTime - lastTime >= 1000) {
        fps = Math.round((frameCount * 1000) / (currentTime - lastTime));
        frameCount = 0;
        lastTime = currentTime;

        this.recordMetric('frameRate', {
          value: fps,
          timestamp: currentTime,
        });

        // Alert if frame rate is low
        if (fps < APM_CONFIG.thresholds.frameRate) {
          this.recordPerformanceIssue('lowFrameRate', {
            actualFPS: fps,
            thresholdFPS: APM_CONFIG.thresholds.frameRate,
            timestamp: currentTime,
          });
        }
      }

      if (this.isMonitoring) {
        requestAnimationFrame(measureFPS);
      }
    };

    requestAnimationFrame(measureFPS);
  }

  private monitorInteractions() {
    const interactions: Map<string, number> = new Map();

    document.addEventListener('mousedown', (event) => {
      const target = event.target as Element;
      const interactionId = `interaction_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
      interactions.set(interactionId, performance.now());

      // Listen for the response (e.g., UI update)
      const observer = new MutationObserver(() => {
        const startTime = interactions.get(interactionId);
        if (startTime) {
          const responseTime = performance.now() - startTime;
          this.recordMetric('interactionResponse', {
            duration: responseTime,
            element: target.tagName,
            timestamp: startTime,
          });

          if (responseTime > APM_CONFIG.thresholds.interactionResponseTime) {
            this.recordPerformanceIssue('slowInteraction', {
              duration: responseTime,
              element: target.tagName,
              threshold: APM_CONFIG.thresholds.interactionResponseTime,
            });
          }

          interactions.delete(interactionId);
          observer.disconnect();
        }
      });

      observer.observe(document.body, {
        childList: true,
        subtree: true,
        attributes: true,
      });

      // Timeout after 5 seconds
      setTimeout(() => {
        if (interactions.has(interactionId)) {
          interactions.delete(interactionId);
          observer.disconnect();
        }
      }, 5000);
    });
  }

  private setupErrorTracking() {
    // JavaScript errors
    window.addEventListener('error', (event) => {
      this.recordError('javascript', {
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        stack: event.error?.stack,
        timestamp: Date.now(),
      });
    });

    // Unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.recordError('promise', {
        reason: event.reason?.message || event.reason,
        stack: event.reason?.stack,
        timestamp: Date.now(),
      });
    });

    // Resource loading errors
    window.addEventListener('error', (event) => {
      if (event.target !== window) {
        const target = event.target as HTMLElement;
        this.recordError('resource', {
          element: target.tagName,
          source: target.getAttribute('src') || target.getAttribute('href'),
          timestamp: Date.now(),
        });
      }
    }, true);
  }

  private setupAPIMonitoring() {
    if (Math.random() * 100 > APM_CONFIG.sampling.api) return;

    // Intercept fetch requests
    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
      const startTime = performance.now();
      const [url, options] = args;

      try {
        const response = await originalFetch(...args);
        const duration = performance.now() - startTime;

        this.recordAPIRequest({
          endpoint: url.toString(),
          method: options?.method || 'GET',
          duration,
          status: response.status,
          size: parseInt(response.headers.get('content-length') || '0'),
          cacheHit: response.headers.get('x-cache') === 'HIT',
          retryCount: 0,
          timestamp: startTime,
        });

        // Check for slow responses
        if (duration > APM_CONFIG.thresholds.apiResponseTime) {
          this.recordPerformanceIssue('slowAPI', {
            endpoint: url.toString(),
            duration,
            threshold: APM_CONFIG.thresholds.apiResponseTime,
            status: response.status,
          });
        }

        return response;
      } catch (error) {
        const duration = performance.now() - startTime;

        this.recordAPIRequest({
          endpoint: url.toString(),
          method: options?.method || 'GET',
          duration,
          status: 0,
          size: 0,
          cacheHit: false,
          retryCount: 0,
          timestamp: startTime,
          error: error.message,
        });

        throw error;
      }
    };

    // Monitor Supabase queries if available
    if (this.supabase) {
      this.monitorSupabaseQueries();
    }
  }

  private monitorSupabaseQueries() {
    if (Math.random() * 100 > APM_CONFIG.sampling.database) return;

    // This is a simplified version - in practice, you'd want to use
    // Supabase's real-time monitoring or custom middleware
    const originalRpc = this.supabase.rpc;
    this.supabase.rpc = async (...args) => {
      const startTime = performance.now();
      const [fnName, params] = args;

      try {
        const result = await originalRpc.apply(this.supabase, args);
        const duration = performance.now() - startTime;

        this.recordDatabaseQuery({
          type: 'rpc',
          function: fnName,
          duration,
          success: true,
          timestamp: startTime,
        });

        return result;
      } catch (error) {
        const duration = performance.now() - startTime;

        this.recordDatabaseQuery({
          type: 'rpc',
          function: fnName,
          duration,
          success: false,
          error: error.message,
          timestamp: startTime,
        });

        throw error;
      }
    };
  }

  private initializeThirdPartyMonitoring() {
    if (Math.random() * 100 > APM_CONFIG.sampling.thirdParty) return;

    // Monitor script loading
    const scripts = document.querySelectorAll('script[src]');
    scripts.forEach(script => {
      const startTime = performance.now();
      script.addEventListener('load', () => {
        const loadTime = performance.now() - startTime;
        const size = this.getResourceSize(script.src);

        this.recordThirdPartyScript({
          name: script.src.split('/').pop() || 'unknown',
          loadTime,
          executionTime: 0, // Would need more sophisticated tracking
          size,
          blocking: !script.async && !script.defer,
        });

        if (loadTime > APM_CONFIG.thresholds.thirdPartyLoadTime) {
          this.recordPerformanceIssue('slowThirdParty', {
            script: script.src,
            loadTime,
            threshold: APM_CONFIG.thresholds.thirdPartyLoadTime,
          });
        }
      });

      script.addEventListener('error', () => {
        this.recordThirdPartyError({
          script: script.src,
          error: 'Failed to load',
          timestamp: startTime,
        });
      });
    });
  }

  private recordRenderMetric(name: string, duration: number) {
    this.recordMetric('render', {
      name,
      duration,
      timestamp: performance.now(),
    });

    if (duration > APM_CONFIG.thresholds.renderTime) {
      this.recordPerformanceIssue('slowRender', {
        name,
        duration,
        threshold: APM_CONFIG.thresholds.renderTime,
      });
    }
  }

  private recordNavigationMetrics(entry: PerformanceNavigationTiming) {
    const metrics = {
      domContentLoaded: entry.domContentLoadedEventEnd - entry.fetchStart,
      loadComplete: entry.loadEventEnd - entry.fetchStart,
      firstPaint: 0,
      firstContentfulPaint: 0,
    };

    // Get paint metrics
    const paintEntries = performance.getEntriesByType('paint');
    paintEntries.forEach((paint) => {
      if (paint.name === 'first-paint') {
        metrics.firstPaint = paint.startTime;
      } else if (paint.name === 'first-contentful-paint') {
        metrics.firstContentfulPaint = paint.startTime;
      }
    });

    this.recordMetric('navigation', metrics);
  }

  private recordResourceMetric(entry: PerformanceResourceTiming) {
    if (Math.random() * 100 > APM_CONFIG.sampling.resources) return;

    const resource: ResourceMetric = {
      name: entry.name,
      type: this.getResourceType(entry.name),
      size: entry.transferSize || 0,
      duration: entry.duration,
      priority: (entry as any).priority || 'unknown',
      cached: entry.transferSize === 0,
    };

    this.recordMetric('resource', resource);

    if (entry.duration > APM_CONFIG.thresholds.resourceLoadTime) {
      this.recordPerformanceIssue('slowResource', {
        resource: entry.name,
        duration: entry.duration,
        threshold: APM_CONFIG.thresholds.resourceLoadTime,
      });
    }
  }

  private recordAPIRequest(request: APIRequestMetric) {
    this.recordMetric('api', request);
  }

  private recordDatabaseQuery(query: any) {
    this.recordMetric('database', query);
  }

  private recordThirdPartyScript(script: ThirdPartyScriptMetric) {
    this.recordMetric('thirdParty', script);
  }

  private recordThirdPartyScriptError(error: any) {
    this.recordMetric('thirdPartyError', error);
  }

  private recordError(type: string, error: any) {
    this.recordMetric('error', {
      type,
      ...error,
      sessionId: this.sessionId,
    });
  }

  private recordPerformanceIssue(type: string, details: any) {
    this.recordMetric('performanceIssue', {
      type,
      details,
      timestamp: Date.now(),
      sessionId: this.sessionId,
    });
  }

  private recordMetric(type: string, data: any) {
    const metric = {
      type,
      timestamp: Date.now(),
      sessionId: this.sessionId,
      data,
    };

    // Store metric locally
    if (this.metrics.length >= APM_CONFIG.maxStoredMetrics) {
      this.metrics.shift(); // Remove oldest metric
    }

    this.metrics.push(metric);

    // Send critical metrics immediately
    if (['error', 'performanceIssue'].includes(type)) {
      this.sendMetrics([metric]);
    }
  }

  private recordMetrics(category: string, metrics: any) {
    this.recordMetric(category, metrics);
  }

  private startPeriodicReporting() {
    // Send metrics every 30 seconds
    setInterval(() => {
      if (this.metrics.length > 0) {
        this.sendMetrics([...this.metrics]);
        this.metrics = []; // Clear sent metrics
      }
    }, APM_CONFIG.intervals.metrics);

    // Send remaining metrics on page unload
    window.addEventListener('beforeunload', () => {
      if (this.metrics.length > 0) {
        navigator.sendBeacon(
          '/api/analytics/apm-metrics',
          JSON.stringify(this.metrics)
        );
      }
    });
  }

  private async sendMetrics(metrics: any[]) {
    try {
      await fetch('/api/analytics/apm-metrics', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionId: this.sessionId,
          context: this.context,
          metrics,
        }),
      });
    } catch (error) {
      console.warn('Failed to send APM metrics:', error);
      // Store locally for retry
      this.storeFailedMetrics(metrics);
    }
  }

  private storeFailedMetrics(metrics: any[]) {
    try {
      const failedMetrics = JSON.parse(
        localStorage.getItem('apm_failed_metrics') || '[]'
      );
      failedMetrics.push(...metrics);

      // Keep only last 100 failed metrics
      if (failedMetrics.length > 100) {
        failedMetrics.splice(0, failedMetrics.length - 100);
      }

      localStorage.setItem('apm_failed_metrics', JSON.stringify(failedMetrics));
    } catch (error) {
      console.warn('Failed to store metrics for retry:', error);
    }
  }

  // Helper methods
  private getAverageRenderTime(): number {
    const renderMetrics = this.metrics.filter(m => m.type === 'render');
    if (renderMetrics.length === 0) return 0;

    const totalTime = renderMetrics.reduce((sum, m) => sum + m.data.duration, 0);
    return totalTime / renderMetrics.length;
  }

  private getAverageComponentMountTime(): number {
    // This would need to be implemented with React DevTools or custom instrumentation
    return 50; // Placeholder
  }

  private getAverageStateUpdateTime(): number {
    // This would need to be implemented with state management instrumentation
    return 25; // Placeholder
  }

  private getMemoryUsage(): number {
    return (performance as any).memory?.usedJSHeapSize || 0;
  }

  private getCurrentFrameRate(): number {
    return this.counters.get('currentFPS') || 60;
  }

  private getAverageInteractionTime(): number {
    const interactions = this.metrics.filter(m => m.type === 'interactionResponse');
    if (interactions.length === 0) return 0;

    const totalTime = interactions.reduce((sum, m) => sum + m.data.duration, 0);
    return totalTime / interactions.length;
  }

  private getBundleLoadTime(): number {
    const scripts = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
    const bundleScripts = scripts.filter(s => s.name.includes('.js') && !s.name.includes('node_modules'));

    if (bundleScripts.length === 0) return 0;
    return Math.max(...bundleScripts.map(s => s.responseEnd - s.requestStart));
  }

  private getCSSLoadTime(): number {
    const styles = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
    const cssFiles = styles.filter(s => s.name.includes('.css'));

    if (cssFiles.length === 0) return 0;
    return Math.max(...cssFiles.map(s => s.responseEnd - s.requestStart));
  }

  private getResourceType(url: string): string {
    if (url.includes('.js')) return 'script';
    if (url.includes('.css')) return 'stylesheet';
    if (/\.(jpg|jpeg|png|gif|webp|avif|svg)$/i.test(url)) return 'image';
    if (/\.(woff|woff2|ttf|eot)$/i.test(url)) return 'font';
    if (url.includes('/api/')) return 'api';
    return 'other';
  }

  private getResourceSize(url: string): number {
    const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
    const resource = resources.find(r => r.name === url);
    return resource?.transferSize || 0;
  }

  // Public methods
  public startComponentTiming(componentName: string) {
    const timingId = `component_${componentName}_${Date.now()}`;
    performance.mark(`component-start-${timingId}`);
    return timingId;
  }

  public endComponentTiming(timingId: string, componentName: string) {
    try {
      performance.mark(`component-end-${timingId}`);
      performance.measure(
        `component-mount-${componentName}`,
        `component-start-${timingId}`,
        `component-end-${timingId}`
      );
    } catch (error) {
      console.warn('Failed to measure component timing:', error);
    }
  }

  public startOperationTiming(operationName: string) {
    const timingId = `operation_${operationName}_${Date.now()}`;
    performance.mark(`operation-start-${timingId}`);
    return timingId;
  }

  public endOperationTiming(timingId: string, operationName: string) {
    try {
      performance.mark(`operation-end-${timingId}`);
      performance.measure(
        `operation-${operationName}`,
        `operation-start-${timingId}`,
        `operation-end-${timingId}`
      );
    } catch (error) {
      console.warn('Failed to measure operation timing:', error);
    }
  }

  public destroy() {
    this.isMonitoring = false;

    // Clear all timers
    this.timers.forEach(timer => clearInterval(timer));
    this.timers.clear();

    // Disconnect all observers
    this.observers.forEach(observer => observer.disconnect());
    this.observers.clear();

    // Send remaining metrics
    if (this.metrics.length > 0) {
      this.sendMetrics(this.metrics);
    }
  }
}

// Initialize APM
let apmInstance: ApplicationPerformanceMonitoring | null = null;

export const initializeAPM = () => {
  if (!apmInstance && typeof window !== 'undefined') {
    apmInstance = new ApplicationPerformanceMonitoring();
  }
  return apmInstance;
};

export const getAPM = () => apmInstance;

export { ApplicationPerformanceMonitoring };
export default ApplicationPerformanceMonitoring;