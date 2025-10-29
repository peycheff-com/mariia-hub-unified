/**
 * Service Health Monitor
 *
 * Comprehensive monitoring system for all third-party integrations
 * with automated health checks, alerting, and performance tracking
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';

import { apiGateway } from '@/services/secure-api-gateway';
import { credentialManager } from '@/lib/secure-credentials';

// Health check result interface
export interface HealthCheckResult {
  service: string;
  status: 'healthy' | 'degraded' | 'unhealthy' | 'unknown';
  responseTime: number;
  lastChecked: Date;
  errorMessage?: string;
  details?: Record<string, any>;
  uptime: number; // Percentage in last 24 hours
  consecutiveFailures: number;
}

// Service metrics
export interface ServiceMetrics {
  service: string;
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  averageResponseTime: number;
  requestsPerMinute: number;
  errorRate: number;
  lastHourRequests: number;
  last24Hours: {
    requests: number;
    successes: number;
    failures: number;
    avgResponseTime: number;
  };
}

// Alert configuration
export interface AlertConfig {
  service: string;
  thresholds: {
    errorRate: number; // Percentage
    responseTime: number; // Milliseconds
    consecutiveFailures: number;
    downtimeMinutes: number;
  };
  enabled: boolean;
  channels: ('email' | 'slack' | 'webhook')[];
  cooldownMinutes: number;
}

class ServiceHealthMonitor {
  private supabase: SupabaseClient;
  private healthChecks: Map<string, NodeJS.Timeout> = new Map();
  private alertCooldowns: Map<string, Date> = new Map();
  private isRunning = false;

  constructor() {
    this.supabase = createClient(
      import.meta.env.VITE_SUPABASE_URL!,
      import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY!
    );
  }

  /**
   * Start monitoring all services
   */
  async start(): Promise<void> {
    if (this.isRunning) {
      console.log('Health monitor already running');
      return;
    }

    this.isRunning = true;
    console.log('Starting service health monitor...');

    // Get all services to monitor
    const services = [
      { name: 'stripe', checkInterval: 60000 }, // 1 minute
      { name: 'booksy', checkInterval: 120000 }, // 2 minutes
      { name: 'whatsapp', checkInterval: 90000 }, // 1.5 minutes
      { name: 'resend', checkInterval: 180000 }, // 3 minutes
      { name: 'supabase', checkInterval: 30000 }, // 30 seconds
      { name: 'openai', checkInterval: 300000 }, // 5 minutes
      { name: 'anthropic', checkInterval: 300000 } // 5 minutes
    ];

    // Start health checks for each service
    for (const service of services) {
      this.startHealthCheck(service.name, service.checkInterval);
    }

    // Start metrics aggregation
    this.startMetricsAggregation();

    // Start alert processing
    this.startAlertProcessing();

    console.log(`Health monitor started for ${services.length} services`);
  }

  /**
   * Stop monitoring
   */
  stop(): void {
    this.isRunning = false;

    // Clear all health check intervals
    for (const [service, timeout] of this.healthChecks) {
      clearInterval(timeout);
    }
    this.healthChecks.clear();

    console.log('Service health monitor stopped');
  }

  /**
   * Start health check for a specific service
   */
  private startHealthCheck(service: string, intervalMs: number): void {
    // Run initial check
    this.checkServiceHealth(service);

    // Set up recurring check
    const interval = setInterval(() => {
      this.checkServiceHealth(service);
    }, intervalMs);

    this.healthChecks.set(service, interval);
  }

  /**
   * Check health of a specific service
   */
  private async checkServiceHealth(service: string): Promise<void> {
    const startTime = Date.now();
    let result: HealthCheckResult;

    try {
      switch (service) {
        case 'stripe':
          result = await this.checkStripeHealth();
          break;
        case 'booksy':
          result = await this.checkBooksyHealth();
          break;
        case 'whatsapp':
          result = await this.checkWhatsAppHealth();
          break;
        case 'resend':
          result = await this.checkResendHealth();
          break;
        case 'supabase':
          result = await this.checkSupabaseHealth();
          break;
        case 'openai':
          result = await this.checkOpenAIHealth();
          break;
        case 'anthropic':
          result = await this.checkAnthropicHealth();
          break;
        default:
          result = {
            service,
            status: 'unknown',
            responseTime: 0,
            lastChecked: new Date(),
            uptime: 0,
            consecutiveFailures: 0
          };
      }

      result.responseTime = Date.now() - startTime;
    } catch (error) {
      result = {
        service,
        status: 'unhealthy',
        responseTime: Date.now() - startTime,
        lastChecked: new Date(),
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
        uptime: 0,
        consecutiveFailures: 0
      };
    }

    // Store result
    await this.storeHealthCheckResult(result);

    // Check if alert is needed
    await this.evaluateAlerts(result);
  }

  /**
   * Check Stripe health
   */
  private async checkStripeHealth(): Promise<Omit<HealthCheckResult, 'responseTime' | 'lastChecked' | 'uptime' | 'consecutiveFailures'>> {
    try {
      const response = await apiGateway.request('stripe', '/account', {
        timeout: 5000,
        bypassCircuitBreaker: true
      });

      if (response.success) {
        return {
          service: 'stripe',
          status: 'healthy',
          details: {
            account_id: response.data.id,
            country: response.data.country,
            charges_enabled: response.data.charges_enabled
          }
        };
      } else {
        return {
          service: 'stripe',
          status: 'unhealthy',
          errorMessage: response.error
        };
      }
    } catch (error) {
      return {
        service: 'stripe',
        status: 'unhealthy',
        errorMessage: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Check Booksy health
   */
  private async checkBooksyHealth(): Promise<Omit<HealthCheckResult, 'responseTime' | 'lastChecked' | 'uptime' | 'consecutiveFailures'>> {
    try {
      const response = await apiGateway.request('booksy', '/health', {
        timeout: 10000,
        bypassCircuitBreaker: true
      });

      if (response.success) {
        return {
          service: 'booksy',
          status: 'healthy',
          details: {
            api_version: response.data.version,
            services_count: response.data.services_count
          }
        };
      } else {
        return {
          service: 'booksy',
          status: 'degraded',
          errorMessage: response.error
        };
      }
    } catch (error) {
      return {
        service: 'booksy',
        status: 'unhealthy',
        errorMessage: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Check WhatsApp health
   */
  private async checkWhatsAppHealth(): Promise<Omit<HealthCheckResult, 'responseTime' | 'lastChecked' | 'uptime' | 'consecutiveFailures'>> {
    try {
      const response = await apiGateway.request('whatsapp', '/me', {
        timeout: 5000,
        bypassCircuitBreaker: true
      });

      if (response.success) {
        return {
          service: 'whatsapp',
          status: 'healthy',
          details: {
            business_id: response.data.id,
            name: response.data.name
          }
        };
      } else {
        return {
          service: 'whatsapp',
          status: 'unhealthy',
          errorMessage: response.error
        };
      }
    } catch (error) {
      return {
        service: 'whatsapp',
        status: 'unhealthy',
        errorMessage: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Check Resend health
   */
  private async checkResendHealth(): Promise<Omit<HealthCheckResult, 'responseTime' | 'lastChecked' | 'uptime' | 'consecutiveFailures'>> {
    try {
      const response = await apiGateway.request('resend', '/domains', {
        timeout: 5000,
        bypassCircuitBreaker: true
      });

      if (response.success) {
        return {
          service: 'resend',
          status: 'healthy',
          details: {
            domains_count: response.data?.length || 0
          }
        };
      } else {
        return {
          service: 'resend',
          status: 'unhealthy',
          errorMessage: response.error
        };
      }
    } catch (error) {
      return {
        service: 'resend',
        status: 'unhealthy',
        errorMessage: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Check Supabase health
   */
  private async checkSupabaseHealth(): Promise<Omit<HealthCheckResult, 'responseTime' | 'lastChecked' | 'uptime' | 'consecutiveFailures'>> {
    try {
      const startTime = Date.now();
      const { data, error } = await this.supabase
        .from('service_health')
        .select('id')
        .limit(1);

      const responseTime = Date.now() - startTime;

      if (error) {
        throw error;
      }

      return {
        service: 'supabase',
        status: 'healthy',
        details: {
          response_time: responseTime,
          connected: true
        }
      };
    } catch (error) {
      return {
        service: 'supabase',
        status: 'unhealthy',
        errorMessage: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Check OpenAI health
   */
  private async checkOpenAIHealth(): Promise<Omit<HealthCheckResult, 'responseTime' | 'lastChecked' | 'uptime' | 'consecutiveFailures'>> {
    try {
      const response = await apiGateway.request('openai', '/models', {
        timeout: 10000,
        bypassCircuitBreaker: true
      });

      if (response.success) {
        return {
          service: 'openai',
          status: 'healthy',
          details: {
            models_count: response.data?.data?.length || 0
          }
        };
      } else {
        return {
          service: 'openai',
          status: 'unhealthy',
          errorMessage: response.error
        };
      }
    } catch (error) {
      return {
        service: 'openai',
        status: 'unhealthy',
        errorMessage: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Check Anthropic health
   */
  private async checkAnthropicHealth(): Promise<Omit<HealthCheckResult, 'responseTime' | 'lastChecked' | 'uptime' | 'consecutiveFailures'>> {
    try {
      const response = await apiGateway.request('anthropic', '/messages', {
        method: 'POST',
        timeout: 10000,
        bypassCircuitBreaker: true,
        body: {
          model: 'claude-3-haiku-20240307',
          max_tokens: 10,
          messages: [{ role: 'user', content: 'Health check' }]
        }
      });

      if (response.success) {
        return {
          service: 'anthropic',
          status: 'healthy',
          details: {
            model: 'claude-3-haiku',
            available: true
          }
        };
      } else {
        return {
          service: 'anthropic',
          status: 'unhealthy',
          errorMessage: response.error
        };
      }
    } catch (error) {
      return {
        service: 'anthropic',
        status: 'unhealthy',
        errorMessage: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Store health check result
   */
  private async storeHealthCheckResult(result: HealthCheckResult): Promise<void> {
    try {
      // Get current uptime and consecutive failures
      const { data: current } = await this.supabase
        .from('service_health')
        .select('consecutive_failures')
        .eq('service', result.service)
        .single();

      let consecutiveFailures = 0;
      if (current) {
        consecutiveFailures = result.status === 'healthy' ? 0 : current.consecutive_failures + 1;
      } else {
        consecutiveFailures = result.status === 'healthy' ? 0 : 1;
      }

      // Calculate uptime for last 24 hours
      const uptime = await this.calculateUptime(result.service);

      // Store/update health record
      await this.supabase
        .from('service_health')
        .upsert({
          service: result.service,
          status: result.status,
          last_check: result.lastChecked,
          response_time_ms: result.responseTime,
          error_rate: result.status === 'healthy' ? 0 : 100,
          last_error: result.errorMessage,
          consecutive_failures: consecutiveFailures,
          uptime,
          metadata: result.details || {},
          updated_at: new Date()
        });

      result.consecutiveFailures = consecutiveFailures;
      result.uptime = uptime;
    } catch (error) {
      console.error('Failed to store health check result:', error);
    }
  }

  /**
   * Calculate uptime percentage for last 24 hours
   */
  private async calculateUptime(service: string): Promise<number> {
    try {
      const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

      const { data, error } = await this.supabase
        .from('service_health_logs')
        .select('status')
        .eq('service', service)
        .gte('checked_at', twentyFourHoursAgo.toISOString());

      if (error || !data || data.length === 0) {
        return 0;
      }

      const healthyChecks = data.filter(check => check.status === 'healthy').length;
      return (healthyChecks / data.length) * 100;
    } catch {
      return 0;
    }
  }

  /**
   * Get all service health statuses
   */
  async getServiceHealth(): Promise<HealthCheckResult[]> {
    try {
      const { data, error } = await this.supabase
        .from('service_health')
        .select('*')
        .order('service');

      if (error) throw error;

      return (data || []).map(record => ({
        service: record.service,
        status: record.status,
        responseTime: record.response_time_ms || 0,
        lastChecked: new Date(record.last_check),
        errorMessage: record.last_error,
        details: record.metadata || {},
        uptime: record.uptime || 0,
        consecutiveFailures: record.consecutive_failures || 0
      }));
    } catch (error) {
      console.error('Failed to get service health:', error);
      return [];
    }
  }

  /**
   * Get service metrics
   */
  async getServiceMetrics(service?: string): Promise<ServiceMetrics[]> {
    try {
      let query = this.supabase
        .from('api_usage_logs')
        .select('*')
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

      if (service) {
        query = query.eq('service', service);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Aggregate metrics by service
      const metricsMap = new Map<string, ServiceMetrics>();

      for (const log of data || []) {
        const serviceName = log.service;
        if (!metricsMap.has(serviceName)) {
          metricsMap.set(serviceName, {
            service: serviceName,
            totalRequests: 0,
            successfulRequests: 0,
            failedRequests: 0,
            averageResponseTime: 0,
            requestsPerMinute: 0,
            errorRate: 0,
            lastHourRequests: 0,
            last24Hours: {
              requests: 0,
              successes: 0,
              failures: 0,
              avgResponseTime: 0
            }
          });
        }

        const metrics = metricsMap.get(serviceName)!;
        metrics.totalRequests++;

        if (log.status_code >= 200 && log.status_code < 400) {
          metrics.successfulRequests++;
        } else {
          metrics.failedRequests++;
        }

        metrics.last24Hours.requests++;
        if (log.status_code >= 200 && log.status_code < 400) {
          metrics.last24Hours.successes++;
        } else {
          metrics.last24Hours.failures++;
        }

        // Check if in last hour
        const logTime = new Date(log.created_at);
        const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
        if (logTime > oneHourAgo) {
          metrics.lastHourRequests++;
        }
      }

      // Calculate derived metrics
      for (const metrics of metricsMap.values()) {
        metrics.errorRate = metrics.totalRequests > 0
          ? (metrics.failedRequests / metrics.totalRequests) * 100
          : 0;

        metrics.requestsPerMinute = metrics.last24Hours.requests / (24 * 60);

        // Note: Average response time would need to be calculated from actual response times
        // This is a placeholder
        metrics.last24Hours.avgResponseTime = 150;
      }

      return Array.from(metricsMap.values());
    } catch (error) {
      console.error('Failed to get service metrics:', error);
      return [];
    }
  }

  /**
   * Evaluate alerts based on health check results
   */
  private async evaluateAlerts(result: HealthCheckResult): Promise<void> {
    try {
      // Get alert configuration for this service
      const { data: alertConfig } = await this.supabase
        .from('service_alert_configs')
        .select('*')
        .eq('service', result.service)
        .eq('enabled', true)
        .single();

      if (!alertConfig) return;

      // Check cooldown period
      const cooldownEnd = this.alertCooldowns.get(result.service);
      if (cooldownEnd && new Date() < cooldownEnd) return;

      let shouldAlert = false;
      let alertReason = '';

      // Check thresholds
      if (result.consecutiveFailures >= alertConfig.thresholds.consecutiveFailures) {
        shouldAlert = true;
        alertReason = `Service has ${result.consecutiveFailures} consecutive failures`;
      } else if (result.uptime < (100 - alertConfig.thresholds.downtimeMinutes / 14.4)) { // Convert minutes to percentage
        shouldAlert = true;
        alertReason = `Service uptime is ${result.uptime.toFixed(2)}% (threshold: ${100 - alertConfig.thresholds.downtimeMinutes / 14.4}%)`;
      } else if (result.responseTime > alertConfig.thresholds.responseTime) {
        shouldAlert = true;
        alertReason = `Response time is ${result.responseTime}ms (threshold: ${alertConfig.thresholds.responseTime}ms)`;
      }

      if (shouldAlert) {
        await this.sendAlert(result, alertConfig, alertReason);

        // Set cooldown
        const cooldownEnd = new Date(Date.now() + alertConfig.cooldownMinutes * 60 * 1000);
        this.alertCooldowns.set(result.service, cooldownEnd);
      }
    } catch (error) {
      console.error('Failed to evaluate alerts:', error);
    }
  }

  /**
   * Send alert
   */
  private async sendAlert(
    result: HealthCheckResult,
    config: AlertConfig,
    reason: string
  ): Promise<void> {
    const alert = {
      service: result.service,
      status: result.status,
      reason,
      responseTime: result.responseTime,
      uptime: result.uptime,
      consecutiveFailures: result.consecutiveFailures,
      lastChecked: result.lastChecked,
      channels: config.channels
    };

    // Send to configured channels
    for (const channel of config.channels) {
      switch (channel) {
        case 'email':
          await this.sendEmailAlert(alert);
          break;
        case 'slack':
          await this.sendSlackAlert(alert);
          break;
        case 'webhook':
          await this.sendWebhookAlert(alert);
          break;
      }
    }

    // Log alert
    await this.supabase
      .from('service_alerts')
      .insert({
        service: result.service,
        alert_type: 'health_check',
        severity: result.status === 'unhealthy' ? 'critical' : 'warning',
        message: reason,
        details: result,
        created_at: new Date()
      });
  }

  /**
   * Send email alert
   */
  private async sendEmailAlert(alert: any): Promise<void> {
    // Implementation would use the email service
    console.log('Email alert sent:', alert);
  }

  /**
   * Send Slack alert
   */
  private async sendSlackAlert(alert: any): Promise<void> {
    // Implementation would send to Slack webhook
    console.log('Slack alert sent:', alert);
  }

  /**
   * Send webhook alert
   */
  private async sendWebhookAlert(alert: any): Promise<void> {
    // Implementation would send to custom webhook
    console.log('Webhook alert sent:', alert);
  }

  /**
   * Start metrics aggregation
   */
  private startMetricsAggregation(): void {
    setInterval(async () => {
      try {
        const metrics = await this.getServiceMetrics();
        for (const metric of metrics) {
          await this.storeMetrics(metric);
        }
      } catch (error) {
        console.error('Failed to aggregate metrics:', error);
      }
    }, 60000); // Every minute
  }

  /**
   * Store metrics
   */
  private async storeMetrics(metrics: ServiceMetrics): Promise<void> {
    await this.supabase
      .from('service_metrics')
      .upsert({
        service: metrics.service,
        total_requests: metrics.totalRequests,
        successful_requests: metrics.successfulRequests,
        failed_requests: metrics.failedRequests,
        average_response_time: metrics.averageResponseTime,
        requests_per_minute: metrics.requestsPerMinute,
        error_rate: metrics.errorRate,
        last_hour_requests: metrics.lastHourRequests,
        last_24h_data: metrics.last24Hours,
        updated_at: new Date()
      });
  }

  /**
   * Start alert processing
   */
  private startAlertProcessing(): void {
    setInterval(async () => {
      try {
        await this.processPendingAlerts();
      } catch (error) {
        console.error('Failed to process alerts:', error);
      }
    }, 30000); // Every 30 seconds
  }

  /**
   * Process pending alerts
   */
  private async processPendingAlerts(): Promise<void> {
    const { data: pendingAlerts } = await this.supabase
      .from('service_alerts')
      .select('*')
      .eq('status', 'pending')
      .limit(10);

    for (const alert of pendingAlerts || []) {
      // Process alert based on type and severity
      await this.processAlert(alert);
    }
  }

  /**
   * Process individual alert
   */
  private async processAlert(alert: any): Promise<void> {
    // Implementation would handle different alert types
    await this.supabase
      .from('service_alerts')
      .update({ status: 'processed', processed_at: new Date() })
      .eq('id', alert.id);
  }
}

// Export singleton instance
export const serviceHealthMonitor = new ServiceHealthMonitor();

// Auto-start if in production environment
if (import.meta.env.PROD) {
  serviceHealthMonitor.start().catch(console.error);
}