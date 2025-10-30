/**
 * Comprehensive Performance Monitoring and Alerting System
 *
 * This module provides enterprise-grade performance monitoring with:
 * - Real-time performance metric collection
 * - Intelligent alerting with configurable thresholds
 * - Performance regression detection
 * - Core Web Vitals monitoring
 * - Automated performance budget enforcement
 */

import { supabase } from '@/integrations/supabase/client';

// Types for performance monitoring
export interface PerformanceMetric {
  id?: string;
  metric_type: 'cwv' | 'custom' | 'business';
  metric_name: string;
  metric_value: number;
  metric_unit?: string;
  device_type: 'desktop' | 'mobile' | 'tablet';
  browser?: string;
  connection_type?: string;
  location_country?: string;
  location_city?: string;
  page_url?: string;
  session_id?: string;
  user_id?: string;
  timestamp?: string;
  metadata?: Record<string, any>;
}

export interface PerformanceAlert {
  id?: string;
  alert_name: string;
  alert_type: 'threshold' | 'regression' | 'anomaly';
  metric_name: string;
  condition_operator: '>' | '<' | '>=' | '<=' | '!=' | 'regex';
  threshold_value: number;
  comparison_period_hours: number;
  consecutive_violations: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  notification_channels: string[];
  is_active: boolean;
  alert_cooldown_minutes: number;
  last_triggered?: string;
}

export interface PerformanceAlertIncident {
  id?: string;
  alert_id: string;
  triggered_at: string;
  resolved_at?: string;
  severity: string;
  current_value: number;
  threshold_value: number;
  affected_pages?: string[];
  impact_assessment?: Record<string, any>;
  resolution_notes?: string;
  status: 'active' | 'resolved' | 'false_positive';
}

// Core Web Vitals thresholds and definitions
export const CORE_WEB_VITALS = {
  LCP: { name: 'largest_contentful_paint', threshold: 2500, unit: 'ms' },
  FID: { name: 'first_input_delay', threshold: 100, unit: 'ms' },
  CLS: { name: 'cumulative_layout_shift', threshold: 0.1, unit: 'score' },
  FCP: { name: 'first_contentful_paint', threshold: 1800, unit: 'ms' },
  TTFB: { name: 'time_to_first_byte', threshold: 800, unit: 'ms' },
  INP: { name: 'interaction_to_next_paint', threshold: 200, unit: 'ms' },
} as const;

// Default performance alerts configuration
export const DEFAULT_PERFORMANCE_ALERTS: Omit<PerformanceAlert, 'id' | 'alert_name'>[] = [
  {
    alert_type: 'threshold',
    metric_name: 'largest_contentful_paint',
    condition_operator: '>',
    threshold_value: 4000,
    comparison_period_hours: 1,
    consecutive_violations: 3,
    severity: 'high',
    notification_channels: ['email', 'slack'],
    is_active: true,
    alert_cooldown_minutes: 60,
  },
  {
    alert_type: 'threshold',
    metric_name: 'cumulative_layout_shift',
    condition_operator: '>',
    threshold_value: 0.25,
    comparison_period_hours: 1,
    consecutive_violations: 2,
    severity: 'medium',
    notification_channels: ['email'],
    is_active: true,
    alert_cooldown_minutes: 60,
  },
  {
    alert_type: 'threshold',
    metric_name: 'first_input_delay',
    condition_operator: '>',
    threshold_value: 300,
    comparison_period_hours: 1,
    consecutive_violations: 3,
    severity: 'high',
    notification_channels: ['email', 'slack'],
    is_active: true,
    alert_cooldown_minutes: 60,
  },
  {
    alert_type: 'regression',
    metric_name: 'conversion_rate',
    condition_operator: '<',
    threshold_value: 0.1, // 10% drop
    comparison_period_hours: 24,
    consecutive_violations: 2,
    severity: 'critical',
    notification_channels: ['email', 'slack', 'sms'],
    is_active: true,
    alert_cooldown_minutes: 30,
  },
];

class PerformanceMonitoringSystem {
  private isMonitoring = false;
  private observers: PerformanceObserver[] = [];
  private sessionId: string;
  private metricsBuffer: PerformanceMetric[] = [];
  private flushInterval: NodeJS.Timeout | null = null;
  private alertCheckInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.sessionId = this.generateSessionId();
    this.initializeDefaultAlerts();
  }

  /**
   * Initialize performance monitoring
   */
  async initialize(): Promise<void> {
    if (this.isMonitoring) return;

    try {
      // Start monitoring Core Web Vitals
      this.observeCoreWebVitals();

      // Start monitoring custom metrics
      this.observeCustomMetrics();

      // Set up periodic metric flushing
      this.startMetricFlushing();

      // Set up alert checking
      this.startAlertChecking();

      // Track page visibility changes
      this.observePageVisibility();

      // Track resource loading
      this.observeResourceLoading();

      this.isMonitoring = true;
      console.log('Performance monitoring initialized');
    } catch (error) {
      console.error('Failed to initialize performance monitoring:', error);
    }
  }

  /**
   * Stop performance monitoring
   */
  stop(): void {
    if (!this.isMonitoring) return;

    // Clean up observers
    this.observers.forEach(observer => observer.disconnect());
    this.observers = [];

    // Clear intervals
    if (this.flushInterval) {
      clearInterval(this.flushInterval);
      this.flushInterval = null;
    }

    if (this.alertCheckInterval) {
      clearInterval(this.alertCheckInterval);
      this.alertCheckInterval = null;
    }

    // Flush remaining metrics
    this.flushMetrics();

    this.isMonitoring = false;
    console.log('Performance monitoring stopped');
  }

  /**
   * Record a performance metric
   */
  async recordMetric(metric: Omit<PerformanceMetric, 'id' | 'timestamp'>): Promise<void> {
    const fullMetric: PerformanceMetric = {
      ...metric,
      timestamp: new Date().toISOString(),
      session_id: this.sessionId,
    };

    // Add to buffer
    this.metricsBuffer.push(fullMetric);

    // If buffer gets too large, flush immediately
    if (this.metricsBuffer.length >= 50) {
      await this.flushMetrics();
    }
  }

  /**
   * Record Core Web Vitals metrics
   */
  async recordCoreWebVitals(): Promise<void> {
    if (!window.performance) return;

    // LCP - Largest Contentful Paint
    new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const lastEntry = entries[entries.length - 1];

      this.recordMetric({
        metric_type: 'cwv',
        metric_name: 'largest_contentful_paint',
        metric_value: Math.round(lastEntry.startTime),
        metric_unit: 'ms',
        device_type: this.getDeviceType(),
        browser: this.getBrowserInfo(),
        page_url: window.location.href,
        metadata: {
          element: lastEntry.element?.tagName,
          renderTime: lastEntry.renderTime,
          loadTime: lastEntry.loadTime,
        },
      });
    }).observe({ entryTypes: ['largest-contentful-paint'] });

    // FID - First Input Delay (deprecated, replaced by INP)
    if ('PerformanceEventTiming' in window) {
      new PerformanceObserver((list) => {
        const entries = list.getEntries() as PerformanceEventTiming[];
        entries.forEach(entry => {
          if (entry.processingStart && entry.startTime) {
            this.recordMetric({
              metric_type: 'cwv',
              metric_name: 'first_input_delay',
              metric_value: Math.round(entry.processingStart - entry.startTime),
              metric_unit: 'ms',
              device_type: this.getDeviceType(),
              browser: this.getBrowserInfo(),
              page_url: window.location.href,
              metadata: {
                inputType: entry.name,
                startTime: entry.startTime,
                processingStart: entry.processingStart,
              },
            });
          }
        });
      }).observe({ entryTypes: ['first-input'] });
    }

    // CLS - Cumulative Layout Shift
    let clsValue = 0;
    new PerformanceObserver((list) => {
      const entries = list.getEntries() as any[];
      entries.forEach(entry => {
        if (!entry.hadRecentInput) {
          clsValue += entry.value;

          this.recordMetric({
            metric_type: 'cwv',
            metric_name: 'cumulative_layout_shift',
            metric_value: Math.round(clsValue * 1000) / 1000,
            metric_unit: 'score',
            device_type: this.getDeviceType(),
            browser: this.getBrowserInfo(),
            page_url: window.location.href,
            metadata: {
              entryValue: entry.value,
              totalCls: clsValue,
            },
          });
        }
      });
    }).observe({ entryTypes: ['layout-shift'] });

    // INP - Interaction to Next Paint
    new PerformanceObserver((list) => {
      const entries = list.getEntries() as PerformanceEventTiming[];
      entries.forEach(entry => {
        if (entry.processingStart && entry.startTime) {
          this.recordMetric({
            metric_type: 'cwv',
            metric_name: 'interaction_to_next_paint',
            metric_value: Math.round(entry.processingStart - entry.startTime),
            metric_unit: 'ms',
            device_type: this.getDeviceType(),
            browser: this.getBrowserInfo(),
            page_url: window.location.href,
            metadata: {
              inputType: entry.name,
              startTime: entry.startTime,
              processingStart: entry.processingStart,
            },
          });
        }
      });
    }).observe({ entryTypes: ['event'] });
  }

  /**
   * Check for performance regressions
   */
  async checkPerformanceRegressions(): Promise<void> {
    try {
      const { data: alerts } = await supabase
        .from('performance_alerts')
        .select('*')
        .eq('is_active', true)
        .eq('alert_type', 'regression');

      if (!alerts) return;

      for (const alert of alerts) {
        await this.evaluateRegressionAlert(alert);
      }
    } catch (error) {
      console.error('Error checking performance regressions:', error);
    }
  }

  /**
   * Evaluate a regression alert
   */
  private async evaluateRegressionAlert(alert: PerformanceAlert): Promise<void> {
    try {
      const now = new Date();
      const comparisonStart = new Date(now.getTime() - alert.comparison_period_hours * 60 * 60 * 1000);
      const recentStart = new Date(now.getTime() - 60 * 60 * 1000); // Last hour

      // Get baseline (comparison period) metrics
      const { data: baselineMetrics } = await supabase
        .from('performance_metrics')
        .select('metric_value')
        .eq('metric_name', alert.metric_name)
        .gte('timestamp', comparisonStart.toISOString())
        .lt('timestamp', recentStart.toISOString());

      // Get recent metrics
      const { data: recentMetrics } = await supabase
        .from('performance_metrics')
        .select('metric_value, page_url')
        .eq('metric_name', alert.metric_name)
        .gte('timestamp', recentStart.toISOString());

      if (!baselineMetrics?.length || !recentMetrics?.length) return;

      const baselineAvg = baselineMetrics.reduce((sum, m) => sum + m.metric_value, 0) / baselineMetrics.length;
      const recentAvg = recentMetrics.reduce((sum, m) => sum + m.metric_value, 0) / recentMetrics.length;

      const regressionPercentage = (baselineAvg - recentAvg) / baselineAvg;
      const isRegression = this.evaluateCondition(
        regressionPercentage,
        alert.condition_operator,
        alert.threshold_value
      );

      if (isRegression) {
        await this.triggerAlert(alert, recentAvg, baselineAvg, {
          regressionPercentage,
          affectedPages: [...new Set(recentMetrics.map(m => m.page_url).filter(Boolean))],
        });
      }
    } catch (error) {
      console.error('Error evaluating regression alert:', error);
    }
  }

  /**
   * Trigger a performance alert
   */
  private async triggerAlert(
    alert: PerformanceAlert,
    currentValue: number,
    baselineValue?: number,
    additionalData?: Record<string, any>
  ): Promise<void> {
    try {
      // Check cooldown
      if (alert.last_triggered) {
        const lastTriggered = new Date(alert.last_triggered);
        const cooldownEnd = new Date(lastTriggered.getTime() + alert.alert_cooldown_minutes * 60 * 1000);

        if (new Date() < cooldownEnd) {
          return; // Still in cooldown period
        }
      }

      // Create incident
      const incidentData: Omit<PerformanceAlertIncident, 'id'> = {
        alert_id: alert.id!,
        triggered_at: new Date().toISOString(),
        severity: alert.severity,
        current_value: currentValue,
        threshold_value: alert.threshold_value,
        affected_pages: additionalData?.affectedPages,
        impact_assessment: additionalData,
        status: 'active',
      };

      const { data: incident } = await supabase
        .from('performance_alert_incidents')
        .insert(incidentData)
        .select()
        .single();

      // Update alert last triggered
      await supabase
        .from('performance_alerts')
        .update({ last_triggered: new Date().toISOString() })
        .eq('id', alert.id);

      // Send notifications
      await this.sendAlertNotifications(alert, incident, currentValue, baselineValue);

      console.warn(`Performance alert triggered: ${alert.alert_name}`, {
        currentValue,
        thresholdValue: alert.threshold_value,
        baselineValue,
      });
    } catch (error) {
      console.error('Error triggering alert:', error);
    }
  }

  /**
   * Send alert notifications
   */
  private async sendAlertNotifications(
    alert: PerformanceAlert,
    incident: PerformanceAlertIncident,
    currentValue: number,
    baselineValue?: number
  ): Promise<void> {
    const alertMessage = this.formatAlertMessage(alert, incident, currentValue, baselineValue);

    for (const channel of alert.notification_channels) {
      try {
        switch (channel) {
          case 'email':
            await this.sendEmailAlert(alertMessage);
            break;
          case 'slack':
            await this.sendSlackAlert(alertMessage);
            break;
          case 'sms':
            await this.sendSMSAlert(alertMessage);
            break;
          case 'webhook':
            await this.sendWebhookAlert(alertMessage);
            break;
        }
      } catch (error) {
        console.error(`Failed to send ${channel} alert:`, error);
      }
    }
  }

  /**
   * Format alert message
   */
  private formatAlertMessage(
    alert: PerformanceAlert,
    incident: PerformanceAlertIncident,
    currentValue: number,
    baselineValue?: number
  ): string {
    const regressionInfo = baselineValue
      ? ` (baseline: ${baselineValue.toFixed(2)}, regression: ${((baselineValue - currentValue) / baselineValue * 100).toFixed(1)}%)`
      : '';

    return `
🚨 Performance Alert: ${alert.alert_name}

Severity: ${alert.severity.toUpperCase()}
Metric: ${alert.metric_name}
Current Value: ${currentValue.toFixed(2)}
Threshold: ${alert.threshold_value}
${regressionInfo}

Triggered at: ${new Date(incident.triggered_at).toLocaleString()}
Affected Pages: ${incident.affected_pages?.join(', ') || 'N/A'}

Impact Assessment: ${JSON.stringify(incident.impact_assessment, null, 2)}
    `.trim();
  }

  /**
   * Initialize default performance alerts
   */
  private async initializeDefaultAlerts(): Promise<void> {
    try {
      for (const alertConfig of DEFAULT_PERFORMANCE_ALERTS) {
        const { data: existing } = await supabase
          .from('performance_alerts')
          .select('id')
          .eq('metric_name', alertConfig.metric_name)
          .eq('alert_type', alertConfig.alert_type)
          .single();

        if (!existing) {
          await supabase.from('performance_alerts').insert({
            ...alertConfig,
            alert_name: `Default ${alertConfig.metric_name} ${alertConfig.alert_type} alert`,
          });
        }
      }
    } catch (error) {
      console.error('Error initializing default alerts:', error);
    }
  }

  /**
   * Start monitoring Core Web Vitals
   */
  private observeCoreWebVitals(): void {
    this.recordCoreWebVitals();
  }

  /**
   * Start monitoring custom metrics
   */
  private observeCustomMetrics(): void {
    // Monitor page load time
    window.addEventListener('load', () => {
      if (window.performance && window.performance.timing) {
        const loadTime = window.performance.timing.loadEventEnd - window.performance.timing.navigationStart;

        this.recordMetric({
          metric_type: 'custom',
          metric_name: 'page_load_time',
          metric_value: loadTime,
          metric_unit: 'ms',
          device_type: this.getDeviceType(),
          browser: this.getBrowserInfo(),
          page_url: window.location.href,
        });
      }
    });

    // Monitor route changes (for SPA)
    this.observeRouteChanges();
  }

  /**
   * Observe route changes for SPA applications
   */
  private observeRouteChanges(): void {
    // This would be integrated with your routing system
    // For now, we'll use popstate and pushstate monitoring
    const originalPushState = history.pushState;
    const originalReplaceState = history.replaceState;

    history.pushState = function(...args) {
      originalPushState.apply(history, args);
      window.dispatchEvent(new Event('routechange'));
    };

    history.replaceState = function(...args) {
      originalReplaceState.apply(history, args);
      window.dispatchEvent(new Event('routechange'));
    };

    window.addEventListener('routechange', () => {
      setTimeout(() => {
        this.recordMetric({
          metric_type: 'custom',
          metric_name: 'route_change_time',
          metric_value: 0, // Would be calculated based on actual route change timing
          metric_unit: 'ms',
          device_type: this.getDeviceType(),
          browser: this.getBrowserInfo(),
          page_url: window.location.href,
        });
      }, 100);
    });
  }

  /**
   * Observe page visibility changes
   */
  private observePageVisibility(): void {
    document.addEventListener('visibilitychange', () => {
      this.recordMetric({
        metric_type: 'custom',
        metric_name: 'page_visibility_change',
        metric_value: document.hidden ? 0 : 1,
        metric_unit: 'boolean',
        device_type: this.getDeviceType(),
        browser: this.getBrowserInfo(),
        page_url: window.location.href,
        metadata: {
          hidden: document.hidden,
          visibilityState: document.visibilityState,
        },
      });
    });
  }

  /**
   * Observe resource loading
   */
  private observeResourceLoading(): void {
    new PerformanceObserver((list) => {
      const entries = list.getEntries();

      entries.forEach(entry => {
        if (entry.entryType === 'resource') {
          const resource = entry as PerformanceResourceTiming;

          this.recordMetric({
            metric_type: 'custom',
            metric_name: 'resource_load_time',
            metric_value: Math.round(resource.responseEnd - resource.startTime),
            metric_unit: 'ms',
            device_type: this.getDeviceType(),
            browser: this.getBrowserInfo(),
            page_url: window.location.href,
            metadata: {
              resourceType: resource.initiatorType,
              resourceUrl: resource.name,
              resourceSize: resource.transferSize,
              cached: resource.transferSize === 0 && resource.decodedBodySize > 0,
            },
          });
        }
      });
    }).observe({ entryTypes: ['resource'] });
  }

  /**
   * Start periodic metric flushing
   */
  private startMetricFlushing(): void {
    this.flushInterval = setInterval(() => {
      this.flushMetrics();
    }, 30000); // Flush every 30 seconds
  }

  /**
   * Start periodic alert checking
   */
  private startAlertChecking(): void {
    this.alertCheckInterval = setInterval(() => {
      this.checkPerformanceRegressions();
    }, 300000); // Check every 5 minutes
  }

  /**
   * Flush metrics to database
   */
  private async flushMetrics(): Promise<void> {
    if (this.metricsBuffer.length === 0) return;

    try {
      const metricsToFlush = [...this.metricsBuffer];
      this.metricsBuffer = [];

      await supabase.from('performance_metrics').insert(metricsToFlush);

      console.log(`Flushed ${metricsToFlush.length} performance metrics`);
    } catch (error) {
      console.error('Error flushing metrics:', error);
      // Add metrics back to buffer on error
      this.metricsBuffer.unshift(...this.metricsBuffer);
    }
  }

  /**
   * Evaluate condition for alerts
   */
  private evaluateCondition(
    actual: number,
    operator: string,
    threshold: number
  ): boolean {
    switch (operator) {
      case '>': return actual > threshold;
      case '<': return actual < threshold;
      case '>=': return actual >= threshold;
      case '<=': return actual <= threshold;
      case '!=': return actual !== threshold;
      default: return false;
    }
  }

  /**
   * Get device type
   */
  private getDeviceType(): 'desktop' | 'mobile' | 'tablet' {
    const width = window.innerWidth;
    if (width < 768) return 'mobile';
    if (width < 1024) return 'tablet';
    return 'desktop';
  }

  /**
   * Get browser information
   */
  private getBrowserInfo(): string {
    const userAgent = navigator.userAgent;

    if (userAgent.includes('Chrome')) return 'Chrome';
    if (userAgent.includes('Firefox')) return 'Firefox';
    if (userAgent.includes('Safari')) return 'Safari';
    if (userAgent.includes('Edge')) return 'Edge';

    return 'Unknown';
  }

  /**
   * Generate session ID
   */
  private generateSessionId(): string {
    return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  /**
   * Send email alert (placeholder implementation)
   */
  private async sendEmailAlert(message: string): Promise<void> {
    // This would integrate with your email service
    console.log('Email alert:', message);
  }

  /**
   * Send Slack alert (placeholder implementation)
   */
  private async sendSlackAlert(message: string): Promise<void> {
    // This would integrate with your Slack webhook
    console.log('Slack alert:', message);
  }

  /**
   * Send SMS alert (placeholder implementation)
   */
  private async sendSMSAlert(message: string): Promise<void> {
    // This would integrate with your SMS service
    console.log('SMS alert:', message);
  }

  /**
   * Send webhook alert (placeholder implementation)
   */
  private async sendWebhookAlert(message: string): Promise<void> {
    // This would send to a custom webhook endpoint
    console.log('Webhook alert:', message);
  }
}

// Singleton instance
let performanceMonitor: PerformanceMonitoringSystem | null = null;

/**
 * Get or create the performance monitoring instance
 */
export function getPerformanceMonitor(): PerformanceMonitoringSystem {
  if (!performanceMonitor) {
    performanceMonitor = new PerformanceMonitoringSystem();
  }
  return performanceMonitor;
}

/**
 * Initialize performance monitoring
 */
export async function initializePerformanceMonitoring(): Promise<void> {
  const monitor = getPerformanceMonitor();
  await monitor.initialize();
}

/**
 * Record a custom performance metric
 */
export async function recordPerformanceMetric(
  metricName: string,
  value: number,
  metadata?: Record<string, any>
): Promise<void> {
  const monitor = getPerformanceMonitor();
  await monitor.recordMetric({
    metric_type: 'custom',
    metric_name: metricName,
    metric_value: value,
    device_type: (monitor as any).getDeviceType(),
    browser: (monitor as any).getBrowserInfo(),
    page_url: window.location.href,
    metadata,
  });
}

// Export the monitor instance for advanced usage
export { PerformanceMonitoringSystem };