/**
 * Booksy Integration Monitoring Service
 *
 * Comprehensive monitoring, error handling, and alerting for Booksy integration
 * Provides health checks, performance metrics, and automated recovery
 */

import { booksyClient } from './booksy-api-client';
import { booksySyncEngine } from './booksy-sync-engine';
import { booksyAvailabilitySync } from './booksy-availability-sync';
import { booksyConsentManager } from './booksy-consent-manager';
import { supabase } from '@/integrations/supabase/client';
import { BaseService } from './api/base.service';

export interface HealthCheck {
  component: string;
  status: 'healthy' | 'warning' | 'error' | 'unknown';
  message: string;
  lastChecked: Date;
  responseTime?: number;
  details?: Record<string, any>;
}

export interface SyncMetrics {
  timestamp: Date;
  totalOperations: number;
  successfulOperations: number;
  failedOperations: number;
  averageResponseTime: number;
  conflictCount: number;
  queueSize: number;
  errorTypes: Record<string, number>;
}

export interface AlertRule {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  severity: 'info' | 'warning' | 'error' | 'critical';
  condition: {
    metric: string;
    operator: '>' | '<' | '=' | '>=' | '<=' | '!=';
    threshold: number;
    duration: number; // minutes
  };
  actions: {
    email?: string[];
    webhook?: string;
    slack?: string;
    autoResolve?: boolean;
  };
}

export interface Alert {
  id: string;
  ruleId: string;
  severity: 'info' | 'warning' | 'error' | 'critical';
  message: string;
  details: Record<string, any>;
  status: 'active' | 'acknowledged' | 'resolved';
  createdAt: Date;
  acknowledgedAt?: Date;
  resolvedAt?: Date;
  acknowledgedBy?: string;
}

export interface PerformanceMetrics {
  apiCallLatency: number[];
  syncOperationDuration: number[];
  conflictResolutionTime: number[];
  dataThroughput: number;
  errorRate: number;
  uptime: number;
}

export class BooksyMonitoringService extends BaseService {
  private static instance: BooksyMonitoringService;
  private healthChecks: Map<string, HealthCheck> = new Map();
  private metrics: SyncMetrics[] = [];
  private alerts: Map<string, Alert> = new Map();
  private alertRules: Map<string, AlertRule> = new Map();
  private isMonitoring: boolean = false;
  private monitoringInterval: NodeJS.Timeout | null = null;
  private performanceMetrics: PerformanceMetrics = {
    apiCallLatency: [],
    syncOperationDuration: [],
    conflictResolutionTime: [],
    dataThroughput: 0,
    errorRate: 0,
    uptime: 0
  };

  static getInstance(): BooksyMonitoringService {
    if (!BooksyMonitoringService.instance) {
      BooksyMonitoringService.instance = new BooksyMonitoringService();
    }
    return BooksyMonitoringService.instance;
  }

  constructor() {
    super();
    this.initializeDefaultAlertRules();
  }

  /**
   * Start the monitoring service
   */
  async startMonitoring(): Promise<void> {
    if (this.isMonitoring) {
      console.warn('Monitoring service is already running');
      return;
    }

    try {
      this.isMonitoring = true;
      this.performanceMetrics.uptime = Date.now();

      // Load alert rules from database
      await this.loadAlertRules();

      // Load active alerts
      await this.loadActiveAlerts();

      // Start periodic health checks
      this.startHealthChecks();

      // Start periodic alert evaluation
      this.startAlertEvaluation();

      // Start metrics collection
      this.startMetricsCollection();

      console.log('Booksy monitoring service started successfully');
    } catch (error) {
      console.error('Failed to start monitoring service:', error);
      this.isMonitoring = false;
      throw error;
    }
  }

  /**
   * Stop the monitoring service
   */
  stopMonitoring(): void {
    if (!this.isMonitoring) {
      return;
    }

    this.isMonitoring = false;

    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }

    console.log('Booksy monitoring service stopped');
  }

  /**
   * Perform comprehensive health check
   */
  async performHealthCheck(): Promise<HealthCheck[]> {
    const healthChecks: HealthCheck[] = [];

    // Check Booksy API client
    healthChecks.push(await this.checkBooksyApiClient());

    // Check sync engine
    healthChecks.push(await this.checkSyncEngine());

    // Check availability sync
    healthChecks.push(await this.checkAvailabilitySync());

    // Check database connectivity
    healthChecks.push(await this.checkDatabaseConnectivity());

    // Check queue health
    healthChecks.push(await this.checkQueueHealth());

    // Store health checks
    healthChecks.forEach(check => {
      this.healthChecks.set(check.component, check);
    });

    return healthChecks;
  }

  /**
   * Check Booksy API client health
   */
  private async checkBooksyApiClient(): Promise<HealthCheck> {
    const startTime = Date.now();

    try {
      // Test Booksy API connectivity
      const isAuthenticated = await booksyClient.initialize();
      const responseTime = Date.now() - startTime;

      if (isAuthenticated) {
        return {
          component: 'booksy_api_client',
          status: 'healthy',
          message: 'Booksy API client is connected and authenticated',
          lastChecked: new Date(),
          responseTime,
          details: {
            authenticated: true,
            version: '1.0.0'
          }
        };
      } else {
        return {
          component: 'booksy_api_client',
          status: 'error',
          message: 'Failed to authenticate with Booksy API',
          lastChecked: new Date(),
          responseTime,
          details: {
            authenticated: false,
            error: 'Authentication failed'
          }
        };
      }
    } catch (error) {
      return {
        component: 'booksy_api_client',
        status: 'error',
        message: `Booksy API client error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        lastChecked: new Date(),
        responseTime: Date.now() - startTime,
        details: {
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      };
    }
  }

  /**
   * Check sync engine health
   */
  private async checkSyncEngine(): Promise<HealthCheck> {
    const startTime = Date.now();

    try {
      const syncStatus = await booksySyncEngine.getSyncStatus();
      const responseTime = Date.now() - startTime;

      const isHealthy = syncStatus !== null && !syncStatus.isProcessing;

      return {
        component: 'sync_engine',
        status: isHealthy ? 'healthy' : 'warning',
        message: isHealthy ? 'Sync engine is operating normally' : 'Sync engine is busy',
        lastChecked: new Date(),
        responseTime,
        details: {
          isProcessing: syncStatus?.isProcessing || false,
          lastSync: syncStatus?.lastSync,
          conflicts: syncStatus?.conflicts || 0
        }
      };
    } catch (error) {
      return {
        component: 'sync_engine',
        status: 'error',
        message: `Sync engine error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        lastChecked: new Date(),
        responseTime: Date.now() - startTime,
        details: {
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      };
    }
  }

  /**
   * Check availability sync health
   */
  private async checkAvailabilitySync(): Promise<HealthCheck> {
    const startTime = Date.now();

    try {
      const syncStatus = await booksyAvailabilitySync.getSyncStatus();
      const responseTime = Date.now() - startTime;

      const isHealthy = syncStatus !== null && syncStatus.pendingConflicts < 10;

      return {
        component: 'availability_sync',
        status: isHealthy ? 'healthy' : 'warning',
        message: isHealthy ? 'Availability sync is operating normally' : 'High number of pending conflicts',
        lastChecked: new Date(),
        responseTime,
        details: {
          totalSlots: syncStatus?.totalSlots || 0,
          syncedSlots: syncStatus?.syncedSlots || 0,
          pendingConflicts: syncStatus?.pendingConflicts || 0,
          lastFullSync: syncStatus?.lastFullSync
        }
      };
    } catch (error) {
      return {
        component: 'availability_sync',
        status: 'error',
        message: `Availability sync error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        lastChecked: new Date(),
        responseTime: Date.now() - startTime,
        details: {
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      };
    }
  }

  /**
   * Check database connectivity
   */
  private async checkDatabaseConnectivity(): Promise<HealthCheck> {
    const startTime = Date.now();

    try {
      const { data, error } = await supabase
        .from('integration_sync_status')
        .select('source, status')
        .limit(1);

      const responseTime = Date.now() - startTime;

      if (error) {
        throw error;
      }

      return {
        component: 'database',
        status: 'healthy',
        message: 'Database connection is working',
        lastChecked: new Date(),
        responseTime,
        details: {
          querySuccess: true,
          recordCount: data?.length || 0
        }
      };
    } catch (error) {
      return {
        component: 'database',
        status: 'error',
        message: `Database connection error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        lastChecked: new Date(),
        responseTime: Date.now() - startTime,
        details: {
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      };
    }
  }

  /**
   * Check queue health
   */
  private async checkQueueHealth(): Promise<HealthCheck> {
    const startTime = Date.now();

    try {
      const { data: queueData, error } = await supabase
        .from('booksy_sync_queue')
        .select('status')
        .group('status');

      const responseTime = Date.now() - startTime;

      if (error) {
        throw error;
      }

      const queueStats = (queueData || []).reduce((acc, item) => {
        acc[item.status] = (acc[item.status] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const totalQueueSize = Object.values(queueStats).reduce((sum, count) => sum + count, 0);
      const failedCount = queueStats.failed || 0;

      let status: 'healthy' | 'warning' | 'error' = 'healthy';
      if (totalQueueSize > 1000) status = 'warning';
      if (failedCount > 50) status = 'error';

      return {
        component: 'sync_queue',
        status,
        message: `Queue contains ${totalQueueSize} items (${failedCount} failed)`,
        lastChecked: new Date(),
        responseTime,
        details: queueStats
      };
    } catch (error) {
      return {
        component: 'sync_queue',
        status: 'error',
        message: `Queue check error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        lastChecked: new Date(),
        responseTime: Date.now() - startTime,
        details: {
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      };
    }
  }

  /**
   * Record sync metrics
   */
  async recordSyncMetrics(metrics: Partial<SyncMetrics>): Promise<void> {
    try {
      const fullMetrics: SyncMetrics = {
        timestamp: new Date(),
        totalOperations: metrics.totalOperations || 0,
        successfulOperations: metrics.successfulOperations || 0,
        failedOperations: metrics.failedOperations || 0,
        averageResponseTime: metrics.averageResponseTime || 0,
        conflictCount: metrics.conflictCount || 0,
        queueSize: metrics.queueSize || 0,
        errorTypes: metrics.errorTypes || {}
      };

      // Store in memory
      this.metrics.push(fullMetrics);

      // Keep only last 1000 metrics
      if (this.metrics.length > 1000) {
        this.metrics = this.metrics.slice(-1000);
      }

      // Store in database
      await supabase
        .from('booksy_sync_metrics')
        .insert({
          ...fullMetrics,
          timestamp: fullMetrics.timestamp.toISOString()
        });

      // Update performance metrics
      this.updatePerformanceMetrics(fullMetrics);

      // Check for alert conditions
      await this.evaluateAlerts(fullMetrics);
    } catch (error) {
      console.error('Failed to record sync metrics:', error);
    }
  }

  /**
   * Update performance metrics
   */
  private updatePerformanceMetrics(metrics: SyncMetrics): void {
    // Update API call latency
    this.performanceMetrics.apiCallLatency.push(metrics.averageResponseTime);
    if (this.performanceMetrics.apiCallLatency.length > 100) {
      this.performanceMetrics.apiCallLatency = this.performanceMetrics.apiCallLatency.slice(-100);
    }

    // Update error rate
    if (metrics.totalOperations > 0) {
      this.performanceMetrics.errorRate = metrics.failedOperations / metrics.totalOperations;
    }

    // Update data throughput
    this.performanceMetrics.dataThroughput = metrics.successfulOperations;
  }

  /**
   * Evaluate alert rules
   */
  private async evaluateAlerts(metrics: SyncMetrics): Promise<void> {
    for (const [ruleId, rule] of this.alertRules.entries()) {
      if (!rule.enabled) continue;

      try {
        const shouldAlert = await this.evaluateAlertRule(rule, metrics);

        if (shouldAlert) {
          await this.triggerAlert(rule, metrics);
        }
      } catch (error) {
        console.error(`Failed to evaluate alert rule ${ruleId}:`, error);
      }
    }
  }

  /**
   * Evaluate individual alert rule
   */
  private async evaluateAlertRule(rule: AlertRule, metrics: SyncMetrics): Promise<boolean> {
    const metricValue = this.getMetricValue(rule.condition.metric, metrics);
    if (metricValue === null) return false;

    const { operator, threshold } = rule.condition;

    switch (operator) {
      case '>':
        return metricValue > threshold;
      case '<':
        return metricValue < threshold;
      case '>=':
        return metricValue >= threshold;
      case '<=':
        return metricValue <= threshold;
      case '=':
        return metricValue === threshold;
      case '!=':
        return metricValue !== threshold;
      default:
        return false;
    }
  }

  /**
   * Get metric value by name
   */
  private getMetricValue(metricName: string, metrics: SyncMetrics): number | null {
    switch (metricName) {
      case 'error_rate':
        return metrics.totalOperations > 0 ? metrics.failedOperations / metrics.totalOperations : 0;
      case 'conflict_count':
        return metrics.conflictCount;
      case 'queue_size':
        return metrics.queueSize;
      case 'response_time':
        return metrics.averageResponseTime;
      case 'failed_operations':
        return metrics.failedOperations;
      case 'success_rate':
        return metrics.totalOperations > 0 ? metrics.successfulOperations / metrics.totalOperations : 1;
      default:
        return null;
    }
  }

  /**
   * Trigger an alert
   */
  private async triggerAlert(rule: AlertRule, metrics: SyncMetrics): Promise<void> {
    try {
      // Check if alert is already active
      const existingAlert = Array.from(this.alerts.values()).find(
        alert => alert.ruleId === rule.id && alert.status === 'active'
      );

      if (existingAlert) {
        return; // Alert already active
      }

      const alertId = crypto.randomUUID();
      const alert: Alert = {
        id: alertId,
        ruleId: rule.id,
        severity: rule.severity,
        message: `Alert: ${rule.name}`,
        details: {
          rule: rule.name,
          condition: rule.condition,
          currentMetrics: metrics,
          triggeredAt: new Date().toISOString()
        },
        status: 'active',
        createdAt: new Date()
      };

      // Store alert
      this.alerts.set(alertId, alert);

      // Store in database
      await supabase
        .from('booksy_alerts')
        .insert({
          id: alertId,
          rule_id: rule.id,
          severity: rule.severity,
          message: alert.message,
          details: alert.details,
          status: 'active',
          created_at: alert.createdAt.toISOString()
        });

      // Execute alert actions
      await this.executeAlertActions(rule, alert);

      console.log(`Alert triggered: ${rule.name}`);
    } catch (error) {
      console.error('Failed to trigger alert:', error);
    }
  }

  /**
   * Execute alert actions
   */
  private async executeAlertActions(rule: AlertRule, alert: Alert): Promise<void> {
    const actions = rule.actions;

    // Send email notifications
    if (actions.email && actions.email.length > 0) {
      await this.sendEmailAlert(actions.email, alert);
    }

    // Send webhook notifications
    if (actions.webhook) {
      await this.sendWebhookAlert(actions.webhook, alert);
    }

    // Send Slack notifications
    if (actions.slack) {
      await this.sendSlackAlert(actions.slack, alert);
    }

    // Auto-resolve if enabled
    if (actions.autoResolve && alert.severity !== 'critical') {
      await this.autoResolveAlert(alert.id);
    }
  }

  /**
   * Send email alert
   */
  private async sendEmailAlert(emails: string[], alert: Alert): Promise<void> {
    // Implementation would depend on email service
    console.log(`Email alert sent to ${emails.join(', ')}: ${alert.message}`);
  }

  /**
   * Send webhook alert
   */
  private async sendWebhookAlert(webhookUrl: string, alert: Alert): Promise<void> {
    try {
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          alert,
          timestamp: new Date().toISOString()
        })
      });

      if (!response.ok) {
        throw new Error(`Webhook failed: ${response.statusText}`);
      }

      console.log(`Webhook alert sent: ${alert.message}`);
    } catch (error) {
      console.error('Failed to send webhook alert:', error);
    }
  }

  /**
   * Send Slack alert
   */
  private async sendSlackAlert(slackUrl: string, alert: Alert): Promise<void> {
    try {
      const payload = {
        text: `Booksy Integration Alert: ${alert.message}`,
        attachments: [
          {
            color: alert.severity === 'critical' ? 'danger' :
                  alert.severity === 'error' ? 'danger' :
                  alert.severity === 'warning' ? 'warning' : 'good',
            fields: [
              {
                title: 'Severity',
                value: alert.severity,
                short: true
              },
              {
                title: 'Time',
                value: alert.createdAt.toISOString(),
                short: true
              },
              {
                title: 'Details',
                value: JSON.stringify(alert.details, null, 2),
                short: false
              }
            ]
          }
        ]
      };

      const response = await fetch(slackUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(`Slack webhook failed: ${response.statusText}`);
      }

      console.log(`Slack alert sent: ${alert.message}`);
    } catch (error) {
      console.error('Failed to send Slack alert:', error);
    }
  }

  /**
   * Auto-resolve alert
   */
  private async autoResolveAlert(alertId: string): Promise<void> {
    try {
      const alert = this.alerts.get(alertId);
      if (!alert) return;

      alert.status = 'resolved';
      alert.resolvedAt = new Date();

      // Update in database
      await supabase
        .from('booksy_alerts')
        .update({
          status: 'resolved',
          resolved_at: alert.resolvedAt.toISOString()
        })
        .eq('id', alertId);

      console.log(`Alert auto-resolved: ${alert.message}`);
    } catch (error) {
      console.error('Failed to auto-resolve alert:', error);
    }
  }

  /**
   * Get overall system health
   */
  async getSystemHealth(): Promise<{
    status: 'healthy' | 'warning' | 'error';
    components: HealthCheck[];
    metrics: PerformanceMetrics;
    activeAlerts: number;
    uptime: number;
  }> {
    const components = await this.performHealthCheck();
    const activeAlerts = Array.from(this.alerts.values()).filter(alert => alert.status === 'active').length;
    const uptime = Date.now() - this.performanceMetrics.uptime;

    // Determine overall status
    const errorCount = components.filter(c => c.status === 'error').length;
    const warningCount = components.filter(c => c.status === 'warning').length;

    let status: 'healthy' | 'warning' | 'error' = 'healthy';
    if (errorCount > 0) status = 'error';
    else if (warningCount > 0 || activeAlerts > 0) status = 'warning';

    return {
      status,
      components,
      metrics: this.performanceMetrics,
      activeAlerts,
      uptime
    };
  }

  /**
   * Get recent metrics
   */
  getRecentMetrics(hours: number = 24): SyncMetrics[] {
    const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000);
    return this.metrics.filter(metric => metric.timestamp >= cutoff);
  }

  /**
   * Get active alerts
   */
  getActiveAlerts(): Alert[] {
    return Array.from(this.alerts.values()).filter(alert => alert.status === 'active');
  }

  /**
   * Acknowledge alert
   */
  async acknowledgeAlert(alertId: string, userId: string): Promise<void> {
    try {
      const alert = this.alerts.get(alertId);
      if (!alert || alert.status !== 'active') {
        throw new Error('Alert not found or not active');
      }

      alert.status = 'acknowledged';
      alert.acknowledgedAt = new Date();
      alert.acknowledgedBy = userId;

      // Update in database
      await supabase
        .from('booksy_alerts')
        .update({
          status: 'acknowledged',
          acknowledged_at: alert.acknowledgedAt.toISOString(),
          acknowledged_by: userId
        })
        .eq('id', alertId);

      console.log(`Alert acknowledged: ${alert.message}`);
    } catch (error) {
      console.error('Failed to acknowledge alert:', error);
      throw error;
    }
  }

  /**
   * Initialize default alert rules
   */
  private initializeDefaultAlertRules(): void {
    const defaultRules: AlertRule[] = [
      {
        id: 'high_error_rate',
        name: 'High Error Rate',
        description: 'Alert when error rate exceeds 10%',
        enabled: true,
        severity: 'warning',
        condition: {
          metric: 'error_rate',
          operator: '>',
          threshold: 0.1,
          duration: 5
        },
        actions: {
          email: ['admin@mariaborysevych.com'],
          autoResolve: false
        }
      },
      {
        id: 'sync_queue_backlog',
        name: 'Sync Queue Backlog',
        description: 'Alert when sync queue has more than 100 items',
        enabled: true,
        severity: 'warning',
        condition: {
          metric: 'queue_size',
          operator: '>',
          threshold: 100,
          duration: 10
        },
        actions: {
          email: ['admin@mariaborysevych.com'],
          autoResolve: false
        }
      },
      {
        id: 'high_conflict_count',
        name: 'High Conflict Count',
        description: 'Alert when conflict count exceeds 20',
        enabled: true,
        severity: 'error',
        condition: {
          metric: 'conflict_count',
          operator: '>',
          threshold: 20,
          duration: 15
        },
        actions: {
          email: ['admin@mariaborysevych.com'],
          autoResolve: false
        }
      },
      {
        id: 'critical_sync_failure',
        name: 'Critical Sync Failure',
        description: 'Alert when sync engine is completely down',
        enabled: true,
        severity: 'critical',
        condition: {
          metric: 'success_rate',
          operator: '<',
          threshold: 0.5,
          duration: 2
        },
        actions: {
          email: ['admin@mariaborysevych.com'],
          webhook: process.env.CRITICAL_WEBHOOK_URL,
          autoResolve: false
        }
      }
    ];

    defaultRules.forEach(rule => {
      this.alertRules.set(rule.id, rule);
    });
  }

  /**
   * Load alert rules from database
   */
  private async loadAlertRules(): Promise<void> {
    try {
      const { data, error } = await supabase
        .from('booksy_alert_rules')
        .select('*')
        .eq('enabled', true);

      if (error) {
        throw error;
      }

      (data || []).forEach(rule => {
        this.alertRules.set(rule.id, rule);
      });
    } catch (error) {
      console.error('Failed to load alert rules:', error);
    }
  }

  /**
   * Load active alerts from database
   */
  private async loadActiveAlerts(): Promise<void> {
    try {
      const { data, error } = await supabase
        .from('booksy_alerts')
        .select('*')
        .eq('status', 'active');

      if (error) {
        throw error;
      }

      (data || []).forEach(alert => {
        this.alerts.set(alert.id, {
          ...alert,
          createdAt: new Date(alert.created_at),
          acknowledgedAt: alert.acknowledged_at ? new Date(alert.acknowledged_at) : undefined,
          resolvedAt: alert.resolved_at ? new Date(alert.resolved_at) : undefined
        });
      });
    } catch (error) {
      console.error('Failed to load active alerts:', error);
    }
  }

  /**
   * Start periodic health checks
   */
  private startHealthChecks(): void {
    setInterval(async () => {
      if (this.isMonitoring) {
        await this.performHealthCheck();
      }
    }, 60000); // Every minute
  }

  /**
   * Start periodic alert evaluation
   */
  private startAlertEvaluation(): void {
    setInterval(async () => {
      if (this.isMonitoring && this.metrics.length > 0) {
        const latestMetrics = this.metrics[this.metrics.length - 1];
        await this.evaluateAlerts(latestMetrics);
      }
    }, 30000); // Every 30 seconds
  }

  /**
   * Start metrics collection
   */
  private startMetricsCollection(): void {
    setInterval(async () => {
      if (this.isMonitoring) {
        // Collect current metrics from various components
        const syncStatus = await booksySyncEngine.getSyncStatus().catch(() => null);
        const availabilityStatus = await booksyAvailabilitySync.getSyncStatus().catch(() => null);

        if (syncStatus || availabilityStatus) {
          await this.recordSyncMetrics({
            totalOperations: syncStatus?.queue?.reduce((sum, q) => sum + q.count, 0) || 0,
            successfulOperations: syncStatus?.queue?.filter(q => q.status === 'completed').reduce((sum, q) => sum + q.count, 0) || 0,
            failedOperations: syncStatus?.queue?.filter(q => q.status === 'failed').reduce((sum, q) => sum + q.count, 0) || 0,
            conflictCount: (syncStatus?.conflicts || 0) + (availabilityStatus?.pendingConflicts || 0),
            queueSize: syncStatus?.queue?.reduce((sum, q) => sum + q.count, 0) || 0
          });
        }
      }
    }, 60000); // Every minute
  }
}

// Export singleton instance
export const booksyMonitoring = BooksyMonitoringService.getInstance();