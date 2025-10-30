// COMPREHENSIVE PERFORMANCE MONITORING SYSTEM
// Real-time performance tracking, alerting, and optimization insights for luxury beauty/fitness platform

import { supabaseOptimized } from '@/integrations/supabase/client-optimized';
import { SEOAnalytics } from '@/lib/seo/analytics';
import { conversionOptimizer } from '@/lib/optimization/ab-testing';

interface PerformanceMetrics {
  // Database performance
  queryTime: number;
  queryType: string;
  resultCount: number;
  cacheHit: boolean;

  // API performance
  endpoint: string;
  responseTime: number;
  statusCode: number;
  payloadSize: number;

  // User experience metrics
  pageLoadTime: number;
  timeToInteractive: number;
  firstContentfulPaint: number;
  largestContentfulPaint: number;

  // System resources
  memoryUsage: number;
  cpuUsage: number;
  networkLatency: number;
}

interface AlertThresholds {
  slowQueryTime: number;
  slowApiResponse: number;
  highMemoryUsage: number;
  highCpuUsage: number;
  poorUserExperience: number;
}

interface PerformanceAlert {
  id: string;
  type: 'query' | 'api' | 'ux' | 'system';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  metric: string;
  value: number;
  threshold: number;
  timestamp: Date;
  context?: Record<string, any>;
}

interface PerformanceReport {
  timestamp: Date;
  period: string;
  database: {
    avgQueryTime: number;
    slowQueries: number;
    cacheHitRate: number;
    totalQueries: number;
  };
  api: {
    avgResponseTime: number;
    errorRate: number;
    totalRequests: number;
    slowEndpoints: string[];
  };
  userExperience: {
    avgPageLoadTime: number;
    bounceRate: number;
    conversionRate: number;
    coreWebVitals: {
      lcp: number; // Largest Contentful Paint
      fid: number; // First Input Delay
      cls: number; // Cumulative Layout Shift
    };
  };
  system: {
    avgMemoryUsage: number;
    avgCpuUsage: number;
    networkLatency: number;
  };
  alerts: PerformanceAlert[];
  recommendations: string[];
}

class PerformanceMonitoringSystem {
  private static instance: PerformanceMonitoringSystem;
  private metrics: PerformanceMetrics[] = [];
  private alerts: PerformanceAlert[] = [];
  private thresholds: AlertThresholds;
  private isMonitoring = false;
  private monitoringInterval?: NodeJS.Timeout;
  private reportInterval?: NodeJS.Timeout;
  private observers: PerformanceObserver[] = [];

  private constructor() {
    this.thresholds = {
      slowQueryTime: 100, // ms
      slowApiResponse: 500, // ms
      highMemoryUsage: 80, // percentage
      highCpuUsage: 70, // percentage
      poorUserExperience: 3000 // ms for page load
    };

    this.initializeObservers();
  }

  static getInstance(): PerformanceMonitoringSystem {
    if (!PerformanceMonitoringSystem.instance) {
      PerformanceMonitoringSystem.instance = new PerformanceMonitoringSystem();
    }
    return PerformanceMonitoringSystem.instance;
  }

  // Start monitoring system
  startMonitoring(options: {
    monitoringInterval?: number;
    reportInterval?: number;
    enableWebVitals?: boolean;
    enableResourceTiming?: boolean;
  } = {}) {
    if (this.isMonitoring) return;

    const {
      monitoringInterval = 30000, // 30 seconds
      reportInterval = 300000, // 5 minutes
      enableWebVitals = true,
      enableResourceTiming = true
    } = options;

    this.isMonitoring = true;

    // Start periodic monitoring
    this.monitoringInterval = setInterval(() => {
      this.collectSystemMetrics();
      this.checkThresholds();
    }, monitoringInterval);

    // Start periodic reporting
    this.reportInterval = setInterval(() => {
      this.generateAndSendReport();
    }, reportInterval);

    // Enable browser performance monitoring
    if (enableWebVitals) {
      this.enableWebVitalsMonitoring();
    }

    if (enableResourceTiming) {
      this.enableResourceTimingMonitoring();
    }

    console.log('[PERFORMANCE] Monitoring system started');
  }

  // Stop monitoring system
  stopMonitoring() {
    this.isMonitoring = false;

    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
    }

    if (this.reportInterval) {
      clearInterval(this.reportInterval);
    }

    // Disconnect all performance observers
    this.observers.forEach(observer => observer.disconnect());
    this.observers = [];

    console.log('[PERFORMANCE] Monitoring system stopped');
  }

  // Record database query performance
  recordQueryPerformance(
    queryType: string,
    queryTime: number,
    resultCount: number,
    cacheHit: boolean = false
  ) {
    const metric: PerformanceMetrics = {
      queryTime,
      queryType,
      resultCount,
      cacheHit,
      // Default values for other metrics
      endpoint: '',
      responseTime: 0,
      statusCode: 200,
      payloadSize: 0,
      pageLoadTime: 0,
      timeToInteractive: 0,
      firstContentfulPaint: 0,
      largestContentfulPaint: 0,
      memoryUsage: 0,
      cpuUsage: 0,
      networkLatency: 0
    };

    this.metrics.push(metric);

    // Check for slow query alert
    if (queryTime > this.thresholds.slowQueryTime) {
      this.createAlert({
        type: 'query',
        severity: queryTime > 500 ? 'high' : 'medium',
        message: `Slow query detected: ${queryType}`,
        metric: 'queryTime',
        value: queryTime,
        threshold: this.thresholds.slowQueryTime,
        context: { queryType, resultCount, cacheHit }
      });
    }

    // Keep only recent metrics (last 1000)
    if (this.metrics.length > 1000) {
      this.metrics = this.metrics.slice(-1000);
    }
  }

  // Record API performance
  recordApiPerformance(
    endpoint: string,
    responseTime: number,
    statusCode: number,
    payloadSize: number = 0
  ) {
    const metric: PerformanceMetrics = {
      queryTime: 0,
      queryType: '',
      resultCount: 0,
      cacheHit: false,
      endpoint,
      responseTime,
      statusCode,
      payloadSize,
      pageLoadTime: 0,
      timeToInteractive: 0,
      firstContentfulPaint: 0,
      largestContentfulPaint: 0,
      memoryUsage: 0,
      cpuUsage: 0,
      networkLatency: 0
    };

    this.metrics.push(metric);

    // Check for slow API alert
    if (responseTime > this.thresholds.slowApiResponse) {
      this.createAlert({
        type: 'api',
        severity: responseTime > 2000 ? 'high' : 'medium',
        message: `Slow API response: ${endpoint}`,
        metric: 'responseTime',
        value: responseTime,
        threshold: this.thresholds.slowApiResponse,
        context: { endpoint, statusCode, payloadSize }
      });
    }

    // Check for error responses
    if (statusCode >= 400) {
      this.createAlert({
        type: 'api',
        severity: statusCode >= 500 ? 'high' : 'medium',
        message: `API error response: ${endpoint} - ${statusCode}`,
        metric: 'statusCode',
        value: statusCode,
        threshold: 400,
        context: { endpoint, responseTime }
      });
    }
  }

  // Initialize performance observers
  private initializeObservers() {
    // Observer for navigation timing
    if ('PerformanceObserver' in window) {
      const navigationObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === 'navigation') {
            const navEntry = entry as PerformanceNavigationTiming;
            this.recordUserExperienceMetrics(navEntry);
          }
        }
      });

      navigationObserver.observe({ entryTypes: ['navigation'] });
      this.observers.push(navigationObserver);
    }
  }

  // Record user experience metrics from navigation timing
  private recordUserExperienceMetrics(navEntry: PerformanceNavigationTiming) {
    const metric: PerformanceMetrics = {
      queryTime: 0,
      queryType: '',
      resultCount: 0,
      cacheHit: false,
      endpoint: '',
      responseTime: 0,
      statusCode: 200,
      payloadSize: 0,
      pageLoadTime: navEntry.loadEventEnd - navEntry.loadEventStart,
      timeToInteractive: navEntry.domInteractive - navEntry.navigationStart,
      firstContentfulPaint: 0,
      largestContentfulPaint: 0,
      memoryUsage: 0,
      cpuUsage: 0,
      networkLatency: navEntry.responseStart - navEntry.requestStart
    };

    this.metrics.push(metric);

    // Check for poor user experience
    if (metric.pageLoadTime > this.thresholds.poorUserExperience) {
      this.createAlert({
        type: 'ux',
        severity: metric.pageLoadTime > 5000 ? 'high' : 'medium',
        message: `Poor page load performance detected`,
        metric: 'pageLoadTime',
        value: metric.pageLoadTime,
        threshold: this.thresholds.poorUserExperience,
        context: { url: window.location.href }
      });
    }
  }

  // Enable Web Vitals monitoring
  private enableWebVitalsMonitoring() {
    // Largest Contentful Paint (LCP)
    if ('PerformanceObserver' in window) {
      const lcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1];
        const lcp = lastEntry.startTime;

        if (lcp > 2500) {
          this.createAlert({
            type: 'ux',
            severity: lcp > 4000 ? 'high' : 'medium',
            message: `Poor LCP detected: ${Math.round(lcp)}ms`,
            metric: 'lcp',
            value: lcp,
            threshold: 2500
          });
        }
      });

      lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
      this.observers.push(lcpObserver);
    }

    // First Input Delay (FID)
    if ('PerformanceObserver' in window) {
      const fidObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          const fid = (entry as any).processingStart - entry.startTime;

          if (fid > 100) {
            this.createAlert({
              type: 'ux',
              severity: fid > 300 ? 'high' : 'medium',
              message: `Poor FID detected: ${Math.round(fid)}ms`,
              metric: 'fid',
              value: fid,
              threshold: 100
            });
          }
        }
      });

      fidObserver.observe({ entryTypes: ['first-input'] });
      this.observers.push(fidObserver);
    }

    // Cumulative Layout Shift (CLS)
    if ('PerformanceObserver' in window) {
      let clsValue = 0;
      const clsObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (!(entry as any).hadRecentInput) {
            clsValue += (entry as any).value;
          }
        }

        if (clsValue > 0.1) {
          this.createAlert({
            type: 'ux',
            severity: clsValue > 0.25 ? 'high' : 'medium',
            message: `Poor CLS detected: ${clsValue.toFixed(3)}`,
            metric: 'cls',
            value: clsValue,
            threshold: 0.1
          });
        }
      });

      clsObserver.observe({ entryTypes: ['layout-shift'] });
      this.observers.push(clsObserver);
    }
  }

  // Enable resource timing monitoring
  private enableResourceTimingMonitoring() {
    if ('PerformanceObserver' in window) {
      const resourceObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          const resource = entry as PerformanceResourceTiming;

          if (resource.duration > 1000) { // Slow resources
            this.createAlert({
              type: 'api',
              severity: resource.duration > 3000 ? 'medium' : 'low',
              message: `Slow resource detected: ${resource.name}`,
              metric: 'resourceLoadTime',
              value: resource.duration,
              threshold: 1000,
              context: { resourceType: resource.initiatorType, size: resource.transferSize }
            });
          }
        }
      });

      resourceObserver.observe({ entryTypes: ['resource'] });
      this.observers.push(resourceObserver);
    }
  }

  // Collect system metrics
  private collectSystemMetrics() {
    // Memory usage
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      const memoryUsage = (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100;

      if (memoryUsage > this.thresholds.highMemoryUsage) {
        this.createAlert({
          type: 'system',
          severity: memoryUsage > 90 ? 'critical' : 'high',
          message: `High memory usage detected: ${Math.round(memoryUsage)}%`,
          metric: 'memoryUsage',
          value: memoryUsage,
          threshold: this.thresholds.highMemoryUsage
        });
      }
    }

    // Network latency check
    this.checkNetworkLatency();
  }

  // Check network latency
  private async checkNetworkLatency() {
    try {
      const startTime = performance.now();
      await supabaseOptimized.healthCheck();
      const latency = performance.now() - startTime;

      if (latency > 1000) {
        this.createAlert({
          type: 'system',
          severity: latency > 3000 ? 'high' : 'medium',
          message: `High network latency detected: ${Math.round(latency)}ms`,
          metric: 'networkLatency',
          value: latency,
          threshold: 1000
        });
      }
    } catch (error) {
      this.createAlert({
        type: 'system',
        severity: 'critical',
        message: `Network connectivity issue detected`,
        metric: 'networkConnectivity',
        value: 0,
        threshold: 1,
        context: { error: error instanceof Error ? error.message : 'Unknown error' }
      });
    }
  }

  // Create performance alert
  private createAlert(alert: Omit<PerformanceAlert, 'id' | 'timestamp'>) {
    const fullAlert: PerformanceAlert = {
      ...alert,
      id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date()
    };

    this.alerts.push(fullAlert);

    // Keep only recent alerts (last 100)
    if (this.alerts.length > 100) {
      this.alerts = this.alerts.slice(-100);
    }

    // Send critical alerts immediately
    if (alert.severity === 'critical') {
      this.sendAlertNotification(fullAlert);
    }

    console.warn(`[PERFORMANCE ALERT] ${alert.message}`, alert);
  }

  // Send alert notification
  private async sendAlertNotification(alert: PerformanceAlert) {
    try {
      await fetch('/api/performance/alert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(alert)
      });
    } catch (error) {
      console.error('[PERFORMANCE] Failed to send alert notification:', error);
    }
  }

  // Check thresholds and create alerts
  private checkThresholds() {
    // This method can be expanded to check aggregated thresholds
    // For example, average query time over a period, error rates, etc.
  }

  // Generate and send performance report
  private async generateAndSendReport() {
    const report = this.generatePerformanceReport();

    try {
      await fetch('/api/performance/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(report)
      });

      console.log('[PERFORMANCE] Report generated and sent', report);
    } catch (error) {
      console.error('[PERFORMANCE] Failed to send report:', error);
    }
  }

  // Generate comprehensive performance report
  generatePerformanceReport(): PerformanceReport {
    const now = new Date();
    const recentMetrics = this.metrics.filter(m =>
      now.getTime() - new Date(m.timestamp as any).getTime() < 300000 // Last 5 minutes
    );

    const queryMetrics = recentMetrics.filter(m => m.queryTime > 0);
    const apiMetrics = recentMetrics.filter(m => m.endpoint);
    const uxMetrics = recentMetrics.filter(m => m.pageLoadTime > 0);

    const database = {
      avgQueryTime: queryMetrics.length > 0
        ? queryMetrics.reduce((sum, m) => sum + m.queryTime, 0) / queryMetrics.length
        : 0,
      slowQueries: queryMetrics.filter(m => m.queryTime > this.thresholds.slowQueryTime).length,
      cacheHitRate: queryMetrics.length > 0
        ? queryMetrics.filter(m => m.cacheHit).length / queryMetrics.length
        : 0,
      totalQueries: queryMetrics.length
    };

    const api = {
      avgResponseTime: apiMetrics.length > 0
        ? apiMetrics.reduce((sum, m) => sum + m.responseTime, 0) / apiMetrics.length
        : 0,
      errorRate: apiMetrics.length > 0
        ? apiMetrics.filter(m => m.statusCode >= 400).length / apiMetrics.length
        : 0,
      totalRequests: apiMetrics.length,
      slowEndpoints: this.getSlowEndpoints(apiMetrics)
    };

    const userExperience = {
      avgPageLoadTime: uxMetrics.length > 0
        ? uxMetrics.reduce((sum, m) => sum + m.pageLoadTime, 0) / uxMetrics.length
        : 0,
      bounceRate: 0, // Would be calculated from actual user behavior data
      conversionRate: 0, // Would be calculated from actual conversion data
      coreWebVitals: this.getCoreWebVitals()
    };

    const system = {
      avgMemoryUsage: this.calculateAverageMemoryUsage(),
      avgCpuUsage: 0, // CPU usage not available in browser
      networkLatency: this.calculateAverageNetworkLatency(recentMetrics)
    };

    const recentAlerts = this.alerts.filter(a =>
      now.getTime() - a.timestamp.getTime() < 300000 // Last 5 minutes
    );

    const recommendations = this.generateRecommendations(database, api, userExperience, system);

    return {
      timestamp: now,
      period: '5 minutes',
      database,
      api,
      userExperience,
      system,
      alerts: recentAlerts,
      recommendations
    };
  }

  private getSlowEndpoints(apiMetrics: PerformanceMetrics[]): string[] {
    const endpointTimes = apiMetrics.reduce((acc, metric) => {
      if (!acc[metric.endpoint]) {
        acc[metric.endpoint] = { total: 0, count: 0 };
      }
      acc[metric.endpoint].total += metric.responseTime;
      acc[metric.endpoint].count += 1;
      return acc;
    }, {} as Record<string, { total: number; count: number }>);

    return Object.entries(endpointTimes)
      .map(([endpoint, data]) => ({
        endpoint,
        avgTime: data.total / data.count
      }))
      .filter(item => item.avgTime > this.thresholds.slowApiResponse)
      .sort((a, b) => b.avgTime - a.avgTime)
      .map(item => item.endpoint)
      .slice(0, 5);
  }

  private getCoreWebVitals() {
    // Extract Web Vitals from metrics or calculate from PerformanceObserver data
    return {
      lcp: 0, // Would be calculated from LCP entries
      fid: 0, // Would be calculated from FID entries
      cls: 0  // Would be calculated from CLS entries
    };
  }

  private calculateAverageMemoryUsage(): number {
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      return (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100;
    }
    return 0;
  }

  private calculateAverageNetworkLatency(metrics: PerformanceMetrics[]): number {
    const networkMetrics = metrics.filter(m => m.networkLatency > 0);
    if (networkMetrics.length === 0) return 0;

    return networkMetrics.reduce((sum, m) => sum + m.networkLatency, 0) / networkMetrics.length;
  }

  private generateRecommendations(
    database: any,
    api: any,
    ux: any,
    system: any
  ): string[] {
    const recommendations: string[] = [];

    if (database.avgQueryTime > 50) {
      recommendations.push('Consider optimizing database queries and adding indexes');
    }

    if (database.cacheHitRate < 0.8) {
      recommendations.push('Implement better caching strategies to improve cache hit rate');
    }

    if (api.avgResponseTime > 300) {
      recommendations.push('Optimize API endpoints and implement response caching');
    }

    if (ux.avgPageLoadTime > 2000) {
      recommendations.push('Optimize frontend assets and implement lazy loading');
    }

    if (system.avgMemoryUsage > 70) {
      recommendations.push('Memory usage is high, consider optimizing memory allocation');
    }

    if (recommendations.length === 0) {
      recommendations.push('Performance is within acceptable ranges');
    }

    return recommendations;
  }

  // Public API methods
  getMetrics(): PerformanceMetrics[] {
    return [...this.metrics];
  }

  getAlerts(): PerformanceAlert[] {
    return [...this.alerts];
  }

  getAlertsBySeverity(severity: PerformanceAlert['severity']): PerformanceAlert[] {
    return this.alerts.filter(alert => alert.severity === severity);
  }

  getAlertsByType(type: PerformanceAlert['type']): PerformanceAlert[] {
    return this.alerts.filter(alert => alert.type === type);
  }

  clearAlerts() {
    this.alerts = [];
  }

  updateThresholds(newThresholds: Partial<AlertThresholds>) {
    this.thresholds = { ...this.thresholds, ...newThresholds };
  }

  getCurrentReport(): PerformanceReport {
    return this.generatePerformanceReport();
  }
}

// Export singleton instance
export const performanceMonitor = PerformanceMonitoringSystem.getInstance();

// Convenience exports
export const startPerformanceMonitoring = (options?: any) =>
  performanceMonitor.startMonitoring(options);

export const stopPerformanceMonitoring = () =>
  performanceMonitor.stopMonitoring();

export const recordQueryPerformance = (queryType: string, queryTime: number, resultCount: number, cacheHit?: boolean) =>
  performanceMonitor.recordQueryPerformance(queryType, queryTime, resultCount, cacheHit);

export const recordApiPerformance = (endpoint: string, responseTime: number, statusCode: number, payloadSize?: number) =>
  performanceMonitor.recordApiPerformance(endpoint, responseTime, statusCode, payloadSize);

export const getPerformanceReport = () => performanceMonitor.getCurrentReport();

// Development debugging
if (import.meta.env.DEV) {
  (window as any).performanceDebug = {
    startMonitoring: startPerformanceMonitoring,
    stopMonitoring: stopPerformanceMonitoring,
    getReport: getPerformanceReport,
    getMetrics: () => performanceMonitor.getMetrics(),
    getAlerts: () => performanceMonitor.getAlerts(),
    clearAlerts: () => performanceMonitor.clearAlerts()
  };

  // Auto-start monitoring in development
  startPerformanceMonitoring();
}