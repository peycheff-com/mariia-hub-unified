/**
 * Performance Monitoring API Endpoints
 * Server-side API for collecting, storing, and analyzing performance data
 */

import { createClient } from '@supabase/supabase-js';

import { logger } from '@/services/logger.service';

// Initialize Supabase client
const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL!,
  import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY!
);

// Performance metrics interfaces
export interface PerformanceMetricsAPI {
  // Web Vitals collection
  collectWebVitals: (data: WebVitalsData) => Promise<{ success: boolean; id?: string }>;

  // API performance tracking
  recordAPIMetrics: (data: APIMetricsData) => Promise<{ success: boolean; id?: string }>;

  // Error tracking
  reportError: (data: ErrorData) => Promise<{ success: boolean; id?: string }>;

  // User behavior tracking
  trackUserEvent: (data: UserEventData) => Promise<{ success: boolean; id?: string }>;

  // Resource monitoring
  monitorResource: (data: ResourceData) => Promise<{ success: boolean; id?: string }>;

  // Health checks
  performHealthCheck: () => Promise<HealthCheckResult>;

  // Analytics and reporting
  getPerformanceReport: (params: ReportParams) => Promise<PerformanceReport>;

  // Alert management
  createAlert: (data: AlertData) => Promise<{ success: boolean; id?: string }>;
  updateAlert: (id: string, data: Partial<AlertData>) => Promise<{ success: boolean }>;
  getAlerts: (params: AlertQueryParams) => Promise<AlertResponse>;
}

export interface WebVitalsData {
  sessionId: string;
  userId?: string;
  url: string;
  userAgent: string;
  timestamp: number;
  vitals: {
    lcp?: number;
    fid?: number;
    cls?: number;
    fcp?: number;
    ttfb?: number;
    inp?: number;
  };
  navigation: {
    type: string;
    redirectCount: number;
    transferSize: number;
    domContentLoaded: number;
    loadComplete: number;
  };
  device: {
    type: string;
    memory?: number;
    cores: number;
    connection: string;
  };
  geo?: {
    country?: string;
    city?: string;
    timezone: string;
  };
}

export interface APIMetricsData {
  sessionId: string;
  userId?: string;
  endpoint: string;
  method: string;
  statusCode: number;
  responseTime: number;
  requestSize: number;
  responseSize: number;
  cacheHit: boolean;
  retries: number;
  error?: string;
  timestamp: number;
  userAgent: string;
}

export interface ErrorData {
  sessionId: string;
  userId?: string;
  type: 'javascript' | 'network' | 'api' | 'resource';
  message: string;
  stack?: string;
  filename?: string;
  line?: number;
  column?: number;
  url: string;
  userAgent: string;
  timestamp: number;
  context?: Record<string, unknown>;
  businessContext?: {
    userImpact: 'low' | 'medium' | 'high' | 'critical';
    feature?: string;
    action?: string;
  };
}

export interface UserEventData {
  sessionId: string;
  userId?: string;
  type: string;
  data: Record<string, unknown>;
  url: string;
  referrer?: string;
  userAgent: string;
  timestamp: number;
  duration?: number;
}

export interface ResourceData {
  sessionId: string;
  name: string;
  type: string;
  size: number;
  duration: number;
  cached: boolean;
  timestamp: number;
  url: string;
}

export interface HealthCheckResult {
  status: 'healthy' | 'degraded' | 'unhealthy';
  score: number;
  checks: Array<{
    name: string;
    status: 'pass' | 'warn' | 'fail';
    message: string;
    duration: number;
    details?: Record<string, unknown>;
  }>;
  timestamp: string;
}

export interface ReportParams {
  startDate: string;
  endDate: string;
  metrics?: string[];
  filters?: {
    url?: string;
    deviceType?: string;
    country?: string;
    userId?: string;
  };
  granularity?: 'minute' | 'hour' | 'day';
  format?: 'json' | 'csv';
}

export interface PerformanceReport {
  summary: {
    totalPageViews: number;
    uniqueUsers: number;
    avgResponseTime: number;
    errorRate: number;
    availability: number;
  };
  webVitals: {
    lcp: { avg: number; p50: number; p75: number; p90: number; p95: number; p99: number };
    fid: { avg: number; p50: number; p75: number; p90: number; p95: number; p99: number };
    cls: { avg: number; p50: number; p75: number; p90: number; p95: number; p99: number };
    fcp: { avg: number; p50: number; p75: number; p90: number; p95: number; p99: number };
    ttfb: { avg: number; p50: number; p75: number; p90: number; p95: number; p99: number };
  };
  apiPerformance: {
    avgResponseTime: number;
    errorRate: number;
    throughput: number;
    slowEndpoints: Array<{ endpoint: string; avgResponseTime: number; requests: number }>;
  };
  errors: {
    total: number;
    byType: Record<string, number>;
    topErrors: Array<{ message: string; count: number; url: string }>;
  };
  geography: Array<{
    country: string;
    users: number;
    avgResponseTime: number;
    errorRate: number;
  }>;
  devices: Array<{
    type: string;
    users: number;
    avgResponseTime: number;
    errorRate: number;
  }>;
}

export interface AlertData {
  type: 'performance' | 'availability' | 'error' | 'resource' | 'sla';
  severity: 'info' | 'warning' | 'critical';
  title: string;
  message: string;
  details: Record<string, unknown>;
  businessImpact: 'low' | 'medium' | 'high' | 'critical';
  url?: string;
  userId?: string;
  sessionId?: string;
}

export interface AlertQueryParams {
  status?: 'open' | 'acknowledged' | 'resolved';
  severity?: 'info' | 'warning' | 'critical';
  type?: string;
  limit?: number;
  offset?: number;
  startDate?: string;
  endDate?: string;
}

export interface AlertResponse {
  alerts: AlertData[];
  total: number;
  hasMore: boolean;
}

class PerformanceAPI implements PerformanceMetricsAPI {
  async collectWebVitals(data: WebVitalsData): Promise<{ success: boolean; id?: string }> {
    try {
      const { data: result, error } = await supabase
        .from('monitoring_performance')
        .insert({
          page_url: data.url,
          fcp_ms: data.vitals.fcp,
          lcp_ms: data.vitals.lcp,
          fid_ms: data.vitals.fid,
          cls_score: data.vitals.cls,
          ttfb_ms: data.vitals.ttfb,
          inp_ms: data.vitals.inp,
          dom_interactive_ms: data.navigation.domContentLoaded,
          load_complete_ms: data.navigation.loadComplete,
          navigation_type: data.navigation.type,
          device_type: data.device.type,
          connection_type: data.device.connection,
          session_id: data.sessionId,
          user_id: data.userId,
          timestamp: new Date(data.timestamp).toISOString(),
          user_agent: data.userAgent,
          metadata: {
            device_memory: data.device.memory,
            device_cores: data.device.cores,
            redirect_count: data.navigation.redirectCount,
            transfer_size: data.navigation.transferSize,
            geo: data.geo
          }
        })
        .select('id')
        .single();

      if (error) {
        logger.error('Failed to collect web vitals', error);
        return { success: false };
      }

      // Track in business metrics
      await this.trackBusinessMetric('web_vital_collected', {
        metric_type: 'performance',
        metric_name: 'web_vital_collection',
        value: 1,
        properties: {
          url: data.url,
          sessionId: data.sessionId,
          userId: data.userId
        },
        timestamp: data.timestamp,
        session_id: data.sessionId,
        user_id: data.userId
      });

      logger.info('Web vitals collected successfully', { id: result.id, url: data.url });
      return { success: true, id: result.id };
    } catch (error) {
      logger.error('Error collecting web vitals', error);
      return { success: false };
    }
  }

  async recordAPIMetrics(data: APIMetricsData): Promise<{ success: boolean; id?: string }> {
    try {
      const { data: result, error } = await supabase
        .from('monitoring_api_performance')
        .insert({
          endpoint: data.endpoint,
          method: data.method,
          status_code: data.statusCode,
          response_time_ms: Math.round(data.responseTime),
          request_size_bytes: data.requestSize,
          response_size_bytes: data.responseSize,
          cache_hit: data.cacheHit,
          retries: data.retries,
          error_message: data.error,
          session_id: data.sessionId,
          user_id: data.userId,
          timestamp: new Date(data.timestamp).toISOString(),
          user_agent: data.userAgent
        })
        .select('id')
        .single();

      if (error) {
        logger.error('Failed to record API metrics', error);
        return { success: false };
      }

      // Check for performance threshold violations
      await this.checkAPIThresholds(data);

      logger.info('API metrics recorded successfully', {
        id: result.id,
        endpoint: data.endpoint,
        responseTime: data.responseTime
      });
      return { success: true, id: result.id };
    } catch (error) {
      logger.error('Error recording API metrics', error);
      return { success: false };
    }
  }

  private async checkAPIThresholds(data: APIMetricsData): Promise<void> {
    const thresholds = {
      responseTime: {
        warning: 1000,
        critical: 3000
      },
      errorRate: {
        warning: 1.0,
        critical: 5.0
      }
    };

    // Check response time threshold
    if (data.responseTime > thresholds.responseTime.critical) {
      await this.createAutomaticAlert({
        type: 'performance',
        severity: 'critical',
        title: 'Critical API Response Time',
        message: `API endpoint ${data.endpoint} took ${Math.round(data.responseTime)}ms to respond`,
        details: {
          endpoint: data.endpoint,
          method: data.method,
          responseTime: data.responseTime,
          threshold: thresholds.responseTime.critical,
          sessionId: data.sessionId,
          userId: data.userId
        },
        businessImpact: 'high',
        url: data.endpoint
      });
    } else if (data.responseTime > thresholds.responseTime.warning) {
      await this.createAutomaticAlert({
        type: 'performance',
        severity: 'warning',
        title: 'Slow API Response Time',
        message: `API endpoint ${data.endpoint} took ${Math.round(data.responseTime)}ms to respond`,
        details: {
          endpoint: data.endpoint,
          method: data.method,
          responseTime: data.responseTime,
          threshold: thresholds.responseTime.warning,
          sessionId: data.sessionId,
          userId: data.userId
        },
        businessImpact: 'medium',
        url: data.endpoint
      });
    }

    // Check for server errors
    if (data.statusCode >= 500) {
      await this.createAutomaticAlert({
        type: 'error',
        severity: 'critical',
        title: 'Server Error',
        message: `API endpoint ${data.endpoint} returned ${data.statusCode}`,
        details: {
          endpoint: data.endpoint,
          method: data.method,
          statusCode: data.statusCode,
          error: data.error,
          sessionId: data.sessionId,
          userId: data.userId
        },
        businessImpact: 'critical',
        url: data.endpoint
      });
    }
  }

  async reportError(data: ErrorData): Promise<{ success: boolean; id?: string }> {
    try {
      const { data: result, error } = await supabase
        .from('monitoring_errors')
        .insert({
          error_message: data.message,
          error_stack: data.stack,
          error_type: data.type,
          error_context: data.context,
          user_impact: data.businessContext?.userImpact || 'medium',
          business_context: data.businessContext,
          page_url: data.url,
          user_agent: data.userAgent,
          timestamp: new Date(data.timestamp).toISOString(),
          session_id: data.sessionId,
          user_id: data.userId,
          filename: data.filename,
          line_number: data.line,
          column_number: data.column
        })
        .select('id')
        .single();

      if (error) {
        logger.error('Failed to report error', error);
        return { success: false };
      }

      // Check for critical errors
      if (data.businessContext?.userImpact === 'critical') {
        await this.createAutomaticAlert({
          type: 'error',
          severity: 'critical',
          title: 'Critical User Error',
          message: `Critical error affecting user experience: ${data.message}`,
          details: {
            errorType: data.type,
            errorMessage: data.message,
            url: data.url,
            sessionId: data.sessionId,
            userId: data.userId,
            businessContext: data.businessContext
          },
          businessImpact: 'critical',
          url: data.url
        });
      }

      logger.info('Error reported successfully', { id: result.id, type: data.type });
      return { success: true, id: result.id };
    } catch (error) {
      logger.error('Error reporting error', error);
      return { success: false };
    }
  }

  async trackUserEvent(data: UserEventData): Promise<{ success: boolean; id?: string }> {
    try {
      const { data: result, error } = await supabase
        .from('monitoring_events')
        .insert({
          type: data.type,
          event_data: data.data,
          page_url: data.url,
          referrer: data.referrer,
          user_agent: data.userAgent,
          timestamp: new Date(data.timestamp).toISOString(),
          session_id: data.sessionId,
          user_id: data.userId,
          duration: data.duration
        })
        .select('id')
        .single();

      if (error) {
        logger.error('Failed to track user event', error);
        return { success: false };
      }

      // Track business metrics for important events
      if (['conversion', 'booking', 'payment', 'signup'].includes(data.type)) {
        await this.trackBusinessMetric('user_conversion', {
          metric_type: 'conversion',
          metric_name: data.type,
          value: 1,
          properties: {
            event_data: data.data,
            url: data.url,
            sessionId: data.sessionId,
            userId: data.userId
          },
          timestamp: data.timestamp,
          session_id: data.sessionId,
          user_id: data.userId
        });
      }

      logger.info('User event tracked successfully', { id: result.id, type: data.type });
      return { success: true, id: result.id };
    } catch (error) {
      logger.error('Error tracking user event', error);
      return { success: false };
    }
  }

  async monitorResource(data: ResourceData): Promise<{ success: boolean; id?: string }> {
    try {
      const { data: result, error } = await supabase
        .from('monitoring_resources')
        .insert({
          resource_name: data.name,
          resource_type: data.type,
          resource_size: data.size,
          load_duration: data.duration,
          cached: data.cached,
          url: data.url,
          timestamp: new Date(data.timestamp).toISOString(),
          session_id: data.sessionId
        })
        .select('id')
        .single();

      if (error) {
        logger.error('Failed to monitor resource', error);
        return { success: false };
      }

      // Check for resource performance issues
      if (data.duration > 5000) { // 5 seconds
        await this.createAutomaticAlert({
          type: 'resource',
          severity: 'warning',
          title: 'Slow Resource Loading',
          message: `Resource ${data.name} took ${data.duration}ms to load`,
          details: {
            resourceName: data.name,
            resourceType: data.type,
            duration: data.duration,
            size: data.size,
            cached: data.cached,
            sessionId: data.sessionId
          },
          businessImpact: 'medium',
          url: data.url
        });
      }

      if (data.size > 5 * 1024 * 1024) { // 5MB
        await this.createAutomaticAlert({
          type: 'resource',
          severity: 'warning',
          title: 'Large Resource',
          message: `Resource ${data.name} is ${Math.round(data.size / 1024 / 1024)}MB`,
          details: {
            resourceName: data.name,
            resourceType: data.type,
            size: data.size,
            duration: data.duration,
            cached: data.cached,
            sessionId: data.sessionId
          },
          businessImpact: 'medium',
          url: data.url
        });
      }

      logger.info('Resource monitored successfully', { id: result.id, name: data.name });
      return { success: true, id: result.id };
    } catch (error) {
      logger.error('Error monitoring resource', error);
      return { success: false };
    }
  }

  async performHealthCheck(): Promise<HealthCheckResult> {
    const checks = [];
    let totalScore = 0;

    // Database health check
    try {
      const start = Date.now();
      const { error } = await supabase
        .from('monitoring_health_checks')
        .select('id')
        .limit(1);
      const duration = Date.now() - start;

      if (error) {
        checks.push({
          name: 'Database',
          status: 'fail' as const,
          message: `Database connection failed: ${error.message}`,
          duration,
          details: { error: error.message }
        });
      } else {
        checks.push({
          name: 'Database',
          status: duration < 100 ? 'pass' as const : 'warn' as const,
          message: `Database connection successful (${duration}ms)`,
          duration,
          details: { responseTime: duration }
        });
        totalScore += duration < 100 ? 100 : duration < 500 ? 80 : 60;
      }
    } catch (error) {
      checks.push({
        name: 'Database',
        status: 'fail' as const,
        message: `Database check failed: ${(error as Error).message}`,
        duration: 0,
        details: { error: (error as Error).message }
      });
    }

    // API health check
    try {
      const start = Date.now();
      const response = await fetch('/api/health', {
        method: 'GET',
        signal: AbortSignal.timeout(5000)
      });
      const duration = Date.now() - start;

      if (response.ok) {
        checks.push({
          name: 'API',
          status: duration < 200 ? 'pass' as const : 'warn' as const,
          message: `API health check successful (${duration}ms)`,
          duration,
          details: { responseTime: duration, status: response.status }
        });
        totalScore += duration < 200 ? 100 : duration < 1000 ? 80 : 60;
      } else {
        checks.push({
          name: 'API',
          status: 'fail' as const,
          message: `API returned ${response.status}`,
          duration,
          details: { status: response.status, responseTime: duration }
        });
      }
    } catch (error) {
      checks.push({
        name: 'API',
        status: 'fail' as const,
        message: `API health check failed: ${(error as Error).message}`,
        duration: 0,
        details: { error: (error as Error).message }
      });
    }

    // Performance metrics health check
    try {
      const start = Date.now();
      const { error } = await supabase
        .from('monitoring_performance')
        .select('lcp_ms, fcp_ms, cls_score')
        .gte('timestamp', new Date(Date.now() - 300000).toISOString()) // Last 5 minutes
        .limit(10);
      const duration = Date.now() - start;

      if (error) {
        checks.push({
          name: 'Performance Metrics',
          status: 'fail' as const,
          message: `Failed to fetch performance metrics: ${error.message}`,
          duration,
          details: { error: error.message }
        });
      } else if (!data || data.length === 0) {
        checks.push({
          name: 'Performance Metrics',
          status: 'warn' as const,
          message: 'No recent performance metrics available',
          duration,
          details: { metricsCount: 0 }
        });
        totalScore += 70;
      } else {
        const avgLCP = data.reduce((sum, m) => sum + (m.lcp_ms || 0), 0) / data.length;
        const avgCLS = data.reduce((sum, m) => sum + (m.cls_score || 0), 0) / data.length;

        const status = avgLCP < 4000 && avgCLS < 0.25 ? 'pass' as const : 'warn' as const;
        checks.push({
          name: 'Performance Metrics',
          status,
          message: `Performance metrics healthy (avg LCP: ${Math.round(avgLCP)}ms, avg CLS: ${avgCLS.toFixed(3)})`,
          duration,
          details: { avgLCP, avgCLS, metricsCount: data.length }
        });
        totalScore += status === 'pass' ? 90 : 70;
      }
    } catch (error) {
      checks.push({
        name: 'Performance Metrics',
        status: 'fail' as const,
        message: `Performance metrics check failed: ${(error as Error).message}`,
        duration: 0,
        details: { error: (error as Error).message }
      });
    }

    // Calculate overall score and status
    const overallScore = checks.length > 0 ? Math.round(totalScore / checks.length) : 0;
    const overallStatus = overallScore >= 90 ? 'healthy' : overallScore >= 70 ? 'degraded' : 'unhealthy';

    // Store health check result
    try {
      await supabase.from('monitoring_health_checks').insert({
        check_name: 'system_health',
        status: overallStatus === 'healthy' ? 'pass' : overallStatus === 'degraded' ? 'warn' : 'fail',
        score: overallScore,
        message: `System health: ${overallStatus}`,
        details: { checks, overallScore, overallStatus },
        duration: checks.reduce((sum, check) => sum + check.duration, 0),
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      logger.error('Failed to store health check result', error);
    }

    return {
      status: overallStatus,
      score: overallScore,
      checks,
      timestamp: new Date().toISOString()
    };
  }

  async getPerformanceReport(params: ReportParams): Promise<PerformanceReport> {
    try {
      const startDate = new Date(params.startDate);
      const endDate = new Date(params.endDate);

      // Get summary statistics
      const { data: pageViews } = await supabase
        .from('monitoring_events')
        .select('session_id, user_id')
        .eq('type', 'pageView')
        .gte('timestamp', startDate.toISOString())
        .lte('timestamp', endDate.toISOString());

      const { data: errors } = await supabase
        .from('monitoring_errors')
        .select('id')
        .gte('timestamp', startDate.toISOString())
        .lte('timestamp', endDate.toISOString());

      const { data: apiMetrics } = await supabase
        .from('monitoring_api_performance')
        .select('response_time_ms, status_code')
        .gte('timestamp', startDate.toISOString())
        .lte('timestamp', endDate.toISOString());

      // Get web vitals data
      const { data: webVitalsData } = await supabase
        .from('monitoring_performance')
        .select('lcp_ms, fid_ms, cls_score, fcp_ms, ttfb_ms')
        .gte('timestamp', startDate.toISOString())
        .lte('timestamp', endDate.toISOString());

      // Calculate percentiles
      const calculatePercentiles = (values: number[]) => {
        if (values.length === 0) return { avg: 0, p50: 0, p75: 0, p90: 0, p95: 0, p99: 0 };

        const sorted = [...values].sort((a, b) => a - b);
        const len = sorted.length;

        return {
          avg: values.reduce((sum, v) => sum + v, 0) / values.length,
          p50: sorted[Math.floor(len * 0.5)] || 0,
          p75: sorted[Math.floor(len * 0.75)] || 0,
          p90: sorted[Math.floor(len * 0.9)] || 0,
          p95: sorted[Math.floor(len * 0.95)] || 0,
          p99: sorted[Math.floor(len * 0.99)] || 0
        };
      };

      const lcpValues = (webVitalsData || []).map(v => v.lcp_ms).filter(v => v !== null && v !== undefined);
      const fidValues = (webVitalsData || []).map(v => v.fid_ms).filter(v => v !== null && v !== undefined);
      const clsValues = (webVitalsData || []).map(v => v.cls_score).filter(v => v !== null && v !== undefined);
      const fcpValues = (webVitalsData || []).map(v => v.fcp_ms).filter(v => v !== null && v !== undefined);
      const ttfbValues = (webVitalsData || []).map(v => v.ttfb_ms).filter(v => v !== null && v !== undefined);

      const responseTimes = (apiMetrics || []).map(m => m.response_time_ms);
      const errorCount = (apiMetrics || []).filter(m => m.status_code >= 400).length;

      return {
        summary: {
          totalPageViews: pageViews?.length || 0,
          uniqueUsers: new Set(pageViews?.map(pv => pv.user_id).filter(Boolean)).size,
          avgResponseTime: responseTimes.length > 0 ? responseTimes.reduce((sum, rt) => sum + rt, 0) / responseTimes.length : 0,
          errorRate: apiMetrics?.length ? (errorCount / apiMetrics.length) * 100 : 0,
          availability: 100 - ((errorCount / (apiMetrics?.length || 1)) * 100)
        },
        webVitals: {
          lcp: calculatePercentiles(lcpValues),
          fid: calculatePercentiles(fidValues),
          cls: calculatePercentiles(clsValues),
          fcp: calculatePercentiles(fcpValues),
          ttfb: calculatePercentiles(ttfbValues)
        },
        apiPerformance: {
          avgResponseTime: responseTimes.length > 0 ? responseTimes.reduce((sum, rt) => sum + rt, 0) / responseTimes.length : 0,
          errorRate: apiMetrics?.length ? (errorCount / apiMetrics.length) * 100 : 0,
          throughput: apiMetrics?.length || 0,
          slowEndpoints: [] // Would need aggregation query
        },
        errors: {
          total: errors?.length || 0,
          byType: {},
          topErrors: []
        },
        geography: [],
        devices: []
      };
    } catch (error) {
      logger.error('Failed to generate performance report', error);
      throw error;
    }
  }

  async createAlert(data: AlertData): Promise<{ success: boolean; id?: string }> {
    try {
      const { data: result, error } = await supabase
        .from('monitoring_alerts')
        .insert({
          alert_type: data.type,
          severity: data.severity,
          title: data.title,
          description: data.message,
          details: data.details,
          status: 'open',
          triggered_at: new Date().toISOString(),
          url: data.url,
          environment: import.meta.env.MODE
        })
        .select('id')
        .single();

      if (error) {
        logger.error('Failed to create alert', error);
        return { success: false };
      }

      logger.info('Alert created successfully', { id: result.id, type: data.type });
      return { success: true, id: result.id };
    } catch (error) {
      logger.error('Error creating alert', error);
      return { success: false };
    }
  }

  private async createAutomaticAlert(data: AlertData): Promise<{ success: boolean; id?: string }> {
    // Check if similar alert already exists and is not resolved
    const { data: existingAlerts } = await supabase
      .from('monitoring_alerts')
      .select('id')
      .eq('alert_type', data.type)
      .eq('severity', data.severity)
      .eq('title', data.title)
      .eq('status', 'open')
      .gte('triggered_at', new Date(Date.now() - 300000).toISOString()); // Last 5 minutes

    if (existingAlerts && existingAlerts.length > 0) {
      return { success: true, id: existingAlerts[0].id }; // Return existing alert
    }

    return await this.createAlert(data);
  }

  async updateAlert(id: string, data: Partial<AlertData>): Promise<{ success: boolean }> {
    try {
      const updateData: Record<string, unknown> = {
        updated_at: new Date().toISOString()
      };

      if (data.details) updateData.details = data.details;
      if (data.title) updateData.title = data.title;
      if (data.message) updateData.description = data.message;

      const { error } = await supabase
        .from('monitoring_alerts')
        .update(updateData)
        .eq('id', id);

      if (error) {
        logger.error('Failed to update alert', error);
        return { success: false };
      }

      logger.info('Alert updated successfully', { id });
      return { success: true };
    } catch (error) {
      logger.error('Error updating alert', error);
      return { success: false };
    }
  }

  async getAlerts(params: AlertQueryParams): Promise<AlertResponse> {
    try {
      let query = supabase
        .from('monitoring_alerts')
        .select('*', { count: 'exact' })
        .order('triggered_at', { ascending: false });

      // Apply filters
      if (params.status) {
        query = query.eq('status', params.status);
      }
      if (params.severity) {
        query = query.eq('severity', params.severity);
      }
      if (params.type) {
        query = query.eq('alert_type', params.type);
      }
      if (params.startDate) {
        query = query.gte('triggered_at', params.startDate);
      }
      if (params.endDate) {
        query = query.lte('triggered_at', params.endDate);
      }

      // Apply pagination
      if (params.limit) {
        query = query.limit(params.limit);
      }
      if (params.offset) {
        query = query.range(params.offset, params.offset + (params.limit || 50) - 1);
      }

      const { data, error, count } = await query;

      if (error) {
        logger.error('Failed to get alerts', error);
        return { alerts: [], total: 0, hasMore: false };
      }

      const alerts = (data || []).map(alert => ({
        id: alert.id,
        type: alert.alert_type,
        severity: alert.severity,
        title: alert.title,
        message: alert.description,
        details: alert.details,
        businessImpact: alert.details?.businessImpact || 'medium',
        url: alert.url
      }));

      return {
        alerts,
        total: count || 0,
        hasMore: (params.offset || 0) + (data?.length || 0) < (count || 0)
      };
    } catch (error) {
      logger.error('Error getting alerts', error);
      return { alerts: [], total: 0, hasMore: false };
    }
  }

  private async trackBusinessMetric(metricName: string, data: Record<string, unknown>): Promise<void> {
    try {
      await supabase.from('monitoring_business_metrics').insert(data);
    } catch (error) {
      logger.error('Failed to track business metric', error);
    }
  }
}

// API Request/Response types
interface APIRequest {
  body: unknown;
  params?: Record<string, string>;
  query?: Record<string, string>;
}

interface APIResponse {
  json: (data: unknown) => void;
  status: (code: number) => APIResponse;
}

// Export singleton instance
export const performanceAPI = new PerformanceAPI();

// API endpoint handlers for Next.js/Express integration
export const performanceAPIEndpoints = {
  'POST /api/performance/web-vitals': async (req: APIRequest, res: APIResponse) => {
    try {
      const result = await performanceAPI.collectWebVitals(req.body);
      res.json(result);
    } catch (error) {
      res.status(500).json({ success: false, error: (error as Error).message });
    }
  },

  'POST /api/performance/api-metrics': async (req: APIRequest, res: APIResponse) => {
    try {
      const result = await performanceAPI.recordAPIMetrics(req.body);
      res.json(result);
    } catch (error) {
      res.status(500).json({ success: false, error: (error as Error).message });
    }
  },

  'POST /api/performance/error': async (req: APIRequest, res: APIResponse) => {
    try {
      const result = await performanceAPI.reportError(req.body);
      res.json(result);
    } catch (error) {
      res.status(500).json({ success: false, error: (error as Error).message });
    }
  },

  'POST /api/performance/event': async (req: APIRequest, res: APIResponse) => {
    try {
      const result = await performanceAPI.trackUserEvent(req.body);
      res.json(result);
    } catch (error) {
      res.status(500).json({ success: false, error: (error as Error).message });
    }
  },

  'POST /api/performance/resource': async (req: APIRequest, res: APIResponse) => {
    try {
      const result = await performanceAPI.monitorResource(req.body);
      res.json(result);
    } catch (error) {
      res.status(500).json({ success: false, error: (error as Error).message });
    }
  },

  'GET /api/performance/health': async (req: APIRequest, res: APIResponse) => {
    try {
      const result = await performanceAPI.performHealthCheck();
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  },

  'GET /api/performance/report': async (req: APIRequest, res: APIResponse) => {
    try {
      const result = await performanceAPI.getPerformanceReport(req.query);
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  },

  'POST /api/performance/alerts': async (req: APIRequest, res: APIResponse) => {
    try {
      const result = await performanceAPI.createAlert(req.body);
      res.json(result);
    } catch (error) {
      res.status(500).json({ success: false, error: (error as Error).message });
    }
  },

  'GET /api/performance/alerts': async (req: APIRequest, res: APIResponse) => {
    try {
      const result = await performanceAPI.getAlerts(req.query);
      res.json(result);
    } catch (error) {
      res.status(500).json({ alerts: [], total: 0, hasMore: false, error: (error as Error).message });
    }
  },

  'PUT /api/performance/alerts/:id': async (req: APIRequest, res: APIResponse) => {
    try {
      const result = await performanceAPI.updateAlert(req.params.id, req.body);
      res.json(result);
    } catch (error) {
      res.status(500).json({ success: false, error: (error as Error).message });
    }
  }
};

export default performanceAPI;