/**
 * Log Aggregation and Analysis Service
 * Centralizes log collection, processing, and analysis for the mariiaborysevych platform
 * Provides real-time log monitoring, alerting, and forensic analysis capabilities
 */

import { createClient } from '@supabase/supabase-js';
import { logger } from '@/services/logger.service';
import { realTimeMonitoringService } from './real-time-monitoring';

// Log aggregation interfaces
export interface LogEntry {
  id: string;
  timestamp: number;
  level: LogLevel;
  message: string;
  category: LogCategory;
  source: LogSource;
  metadata: Record<string, any>;
  userId?: string;
  sessionId?: string;
  requestId?: string;
  traceId?: string;
  ipAddress?: string;
  userAgent?: string;
  tags: string[];
  stackTrace?: string;
  context?: Record<string, any>;
  environment: string;
  version: string;
}

export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'fatal';

export type LogCategory =
  | 'application'
  | 'auth'
  | 'booking'
  | 'payment'
  | 'api'
  | 'database'
  | 'security'
  | 'performance'
  | 'system'
  | 'network'
  | 'third_party'
  | 'user_action'
  | 'error';

export type LogSource =
  | 'client'
  | 'server'
  | 'edge_function'
  | 'database'
  | 'external_api'
  | 'background_job'
  | 'webhook'
  | 'cron_job';

export interface LogAggregationMetrics {
  totalLogs: number;
  logsByLevel: Record<LogLevel, number>;
  logsByCategory: Record<LogCategory, number>;
  logsBySource: Record<LogSource, number>;
  errorRate: number;
  warningRate: number;
  uniqueErrors: number;
  topErrors: Array<{
    message: string;
    count: number;
    level: LogLevel;
    lastOccurrence: number;
  }>;
  timeToResolve: {
    average: number;
    median: number;
    p95: number;
  };
  loggingPerformance: {
    ingestionLatency: number;
    processingLatency: number;
    storageLatency: number;
    indexingLatency: number;
  };
  timestamp: number;
}

export interface LogAnalysisReport {
  period: string;
  totalLogs: number;
  errorSummary: {
    totalErrors: number;
    criticalErrors: number;
    errorTrends: Array<{
      timestamp: number;
      count: number;
    }>;
    topErrorCategories: Array<{
      category: string;
      count: number;
      percentage: number;
    }>;
  };
  performanceInsights: {
    slowQueries: Array<{
      query: string;
      avgDuration: number;
      count: number;
    }>;
    slowEndpoints: Array<{
      endpoint: string;
      avgResponseTime: number;
      count: number;
    }>;
    resourceBottlenecks: Array<{
      resource: string;
      utilization: number;
      impact: string;
    }>;
  };
  securityEvents: {
    suspiciousActivities: number;
    blockedRequests: number;
    authenticationFailures: number;
    dataAccessViolations: number;
  };
  businessEvents: {
    bookingsCreated: number;
    paymentsCompleted: number;
    userRegistrations: number;
    conversionEvents: number;
  };
  recommendations: Array<{
    priority: 'low' | 'medium' | 'high' | 'critical';
    category: string;
    description: string;
    impact: string;
    action: string;
  }>;
  generatedAt: number;
}

export interface LogAlertRule {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  conditions: Array<{
    field: string;
    operator: 'equals' | 'contains' | 'regex' | 'gt' | 'lt' | 'in';
    value: any;
    caseSensitive?: boolean;
  }>;
  timeWindow: number; // minutes
  threshold: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  cooldownPeriod: number; // minutes
  actions: Array<{
    type: 'alert' | 'webhook' | 'email' | 'slack';
    destination: string;
    template?: string;
  }>;
  lastTriggered?: number;
  triggerCount: number;
}

export interface LogRetentionPolicy {
  category: LogCategory;
  level: LogLevel;
  retentionDays: number;
  compressionEnabled: boolean;
  archiveAfterDays: number;
  deleteAfterArchiveDays: number;
  indexEnabled: boolean;
}

class LogAggregationService {
  private static instance: LogAggregationService;
  private supabase: any;
  private logs: LogEntry[] = [];
  private metrics: LogAggregationMetrics | null = null;
  private alertRules: Map<string, LogAlertRule> = new Map();
  private retentionPolicies: Map<string, LogRetentionPolicy> = new Map();
  private aggregationInterval?: NodeJS.Timeout;
  private cleanupInterval?: NodeJS.Timeout;
  private isInitialized = false;
  private batchSize = 100;
  private maxLogSize = 10000;

  constructor() {
    this.supabase = createClient(
      import.meta.env.VITE_SUPABASE_URL!,
      import.meta.env.VITE_SUPABASE_ANON_KEY!
    );
  }

  static getInstance(): LogAggregationService {
    if (!LogAggregationService.instance) {
      LogAggregationService.instance = new LogAggregationService();
    }
    return LogAggregationService.instance;
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // Load alert rules
      await this.loadAlertRules();

      // Load retention policies
      await this.loadRetentionPolicies();

      // Initialize log capture
      this.initializeLogCapture();

      // Start periodic aggregation
      this.startPeriodicAggregation();

      // Start cleanup process
      this.startCleanupProcess();

      this.isInitialized = true;
      logger.info('Log aggregation service initialized');

    } catch (error) {
      logger.error('Failed to initialize log aggregation service', error);
      throw error;
    }
  }

  private async loadAlertRules(): Promise<void> {
    try {
      // Default alert rules
      const defaultRules: LogAlertRule[] = [
        {
          id: 'high_error_rate',
          name: 'High Error Rate',
          description: 'Alert when error rate exceeds threshold',
          enabled: true,
          conditions: [
            { field: 'level', operator: 'in', value: ['error', 'fatal'] }
          ],
          timeWindow: 5,
          threshold: 10,
          severity: 'high',
          cooldownPeriod: 15,
          actions: [
            { type: 'alert', destination: 'monitoring' },
            { type: 'slack', destination: 'alerts' }
          ],
          triggerCount: 0
        },
        {
          id: 'auth_failure_spike',
          name: 'Authentication Failure Spike',
          description: 'Alert on unusual authentication failures',
          enabled: true,
          conditions: [
            { field: 'category', operator: 'equals', value: 'auth' },
            { field: 'level', operator: 'in', value: ['error', 'fatal'] }
          ],
          timeWindow: 5,
          threshold: 5,
          severity: 'critical',
          cooldownPeriod: 10,
          actions: [
            { type: 'alert', destination: 'security' },
            { type: 'webhook', destination: 'security-alerts' }
          ],
          triggerCount: 0
        },
        {
          id: 'payment_errors',
          name: 'Payment Processing Errors',
          description: 'Alert on payment processing failures',
          enabled: true,
          conditions: [
            { field: 'category', operator: 'equals', value: 'payment' },
            { field: 'level', operator: 'in', value: ['error', 'fatal'] }
          ],
          timeWindow: 2,
          threshold: 3,
          severity: 'high',
          cooldownPeriod: 5,
          actions: [
            { type: 'alert', destination: 'business' },
            { type: 'email', destination: 'finance' }
          ],
          triggerCount: 0
        },
        {
          id: 'database_connection_issues',
          name: 'Database Connection Issues',
          description: 'Alert on database connectivity problems',
          enabled: true,
          conditions: [
            { field: 'category', operator: 'equals', value: 'database' },
            { field: 'level', operator: 'in', value: ['error', 'fatal'] }
          ],
          timeWindow: 3,
          threshold: 2,
          severity: 'critical',
          cooldownPeriod: 10,
          actions: [
            { type: 'alert', destination: 'infrastructure' },
            { type: 'webhook', destination: 'on-call' }
          ],
          triggerCount: 0
        }
      ];

      defaultRules.forEach(rule => {
        this.alertRules.set(rule.id, rule);
      });

      // Load custom rules from database
      const { data: customRules } = await this.supabase
        .from('log_alert_rules')
        .select('*')
        .eq('enabled', true);

      if (customRules) {
        customRules.forEach(rule => {
          this.alertRules.set(rule.id, {
            ...rule,
            conditions: rule.conditions || [],
            actions: rule.actions || [],
            triggerCount: rule.trigger_count || 0
          });
        });
      }

    } catch (error) {
      logger.error('Failed to load alert rules', error);
    }
  }

  private async loadRetentionPolicies(): Promise<void> {
    try {
      // Default retention policies
      const defaultPolicies: LogRetentionPolicy[] = [
        {
          category: 'error',
          level: 'fatal',
          retentionDays: 365,
          compressionEnabled: true,
          archiveAfterDays: 90,
          deleteAfterArchiveDays: 730,
          indexEnabled: true
        },
        {
          category: 'error',
          level: 'error',
          retentionDays: 180,
          compressionEnabled: true,
          archiveAfterDays: 60,
          deleteAfterArchiveDays: 365,
          indexEnabled: true
        },
        {
          category: 'security',
          level: 'warn',
          retentionDays: 365,
          compressionEnabled: true,
          archiveAfterDays: 90,
          deleteAfterArchiveDays: 1825,
          indexEnabled: true
        },
        {
          category: 'application',
          level: 'info',
          retentionDays: 30,
          compressionEnabled: true,
          archiveAfterDays: 7,
          deleteAfterArchiveDays: 90,
          indexEnabled: false
        },
        {
          category: 'application',
          level: 'debug',
          retentionDays: 7,
          compressionEnabled: false,
          archiveAfterDays: 0,
          deleteAfterArchiveDays: 30,
          indexEnabled: false
        }
      ];

      defaultPolicies.forEach(policy => {
        const key = `${policy.category}_${policy.level}`;
        this.retentionPolicies.set(key, policy);
      });

      // Load custom policies from database
      const { data: customPolicies } = await this.supabase
        .from('log_retention_policies')
        .select('*');

      if (customPolicies) {
        customPolicies.forEach(policy => {
          const key = `${policy.category}_${policy.level}`;
          this.retentionPolicies.set(key, policy);
        });
      }

    } catch (error) {
      logger.error('Failed to load retention policies', error);
    }
  }

  private initializeLogCapture(): void {
    // Override console methods to capture logs
    const originalConsole = {
      log: console.log,
      info: console.info,
      warn: console.warn,
      error: console.error
    };

    console.log = (...args: any[]) => {
      this.captureLog('info', args.join(' '), 'application', 'client');
      originalConsole.log.apply(console, args);
    };

    console.info = (...args: any[]) => {
      this.captureLog('info', args.join(' '), 'application', 'client');
      originalConsole.info.apply(console, args);
    };

    console.warn = (...args: any[]) => {
      this.captureLog('warn', args.join(' '), 'application', 'client');
      originalConsole.warn.apply(console, args);
    };

    console.error = (...args: any[]) => {
      this.captureLog('error', args.join(' '), 'application', 'client');
      originalConsole.error.apply(console, args);
    };

    // Capture unhandled errors
    window.addEventListener('error', (event) => {
      this.captureLog('error', event.message, 'application', 'client', {
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        stackTrace: event.error?.stack
      });
    });

    // Capture unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.captureLog('error', `Unhandled Promise Rejection: ${event.reason}`, 'application', 'client', {
        reason: event.reason,
        stack: event.reason?.stack
      });
    });
  }

  private captureLog(
    level: LogLevel,
    message: string,
    category: LogCategory,
    source: LogSource,
    metadata: Record<string, any> = {}
  ): void {
    const logEntry: LogEntry = {
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      level,
      message,
      category,
      source,
      metadata,
      userId: this.getUserId(),
      sessionId: this.getSessionId(),
      requestId: this.generateRequestId(),
      traceId: this.generateTraceId(),
      ipAddress: this.getClientIP(),
      userAgent: navigator.userAgent,
      tags: this.extractTags(message, metadata),
      stackTrace: metadata.stackTrace,
      context: this.getContextInfo(),
      environment: import.meta.env.MODE,
      version: import.meta.env.VITE_APP_VERSION || '1.0.0'
    };

    this.logs.push(logEntry);

    // Check alert rules
    this.checkAlertRules(logEntry);

    // Report to real-time monitoring
    realTimeMonitoringService.reportMetric({
      type: 'system',
      name: 'log_entry',
      value: 1,
      metadata: {
        level,
        category,
        source,
        message: message.substring(0, 100)
      }
    });

    // Maintain log buffer size
    if (this.logs.length > this.maxLogSize) {
      this.logs = this.logs.slice(-this.maxLogSize);
    }
  }

  private getUserId(): string | undefined {
    return localStorage.getItem('user_id') || undefined;
  }

  private getSessionId(): string {
    let sessionId = sessionStorage.getItem('log_session_id');
    if (!sessionId) {
      sessionId = crypto.randomUUID();
      sessionStorage.setItem('log_session_id', sessionId);
    }
    return sessionId;
  }

  private generateRequestId(): string {
    return crypto.randomUUID();
  }

  private generateTraceId(): string {
    return crypto.randomUUID();
  }

  private getClientIP(): string {
    // In a real implementation, this would get the client IP from headers or API call
    return 'unknown';
  }

  private extractTags(message: string, metadata: Record<string, any>): string[] {
    const tags: string[] = [];

    // Extract tags from message
    const tagPatterns = [
      /#(\w+)/g,  // #tag format
      /\[(\w+)\]/g,  // [tag] format
    ];

    tagPatterns.forEach(pattern => {
      const matches = message.match(pattern);
      if (matches) {
        tags.push(...matches.map(match => match.replace(/[#\[|\]]/g, '')));
      }
    });

    // Extract tags from metadata
    if (metadata.tags && Array.isArray(metadata.tags)) {
      tags.push(...metadata.tags);
    }

    return [...new Set(tags)]; // Remove duplicates
  }

  private getContextInfo(): Record<string, any> {
    return {
      url: window.location.href,
      path: window.location.pathname,
      search: window.location.search,
      hash: window.location.hash,
      referrer: document.referrer,
      viewport: `${window.innerWidth}x${window.innerHeight}`,
      screen: `${screen.width}x${screen.height}`,
      language: navigator.language,
      platform: navigator.platform,
      cookieEnabled: navigator.cookieEnabled,
      online: navigator.onLine
    };
  }

  private checkAlertRules(logEntry: LogEntry): void {
    const now = Date.now();

    this.alertRules.forEach(rule => {
      if (!rule.enabled) return;

      // Check cooldown period
      if (rule.lastTriggered && (now - rule.lastTriggered) < rule.cooldownPeriod * 60 * 1000) {
        return;
      }

      // Check if log matches rule conditions
      const matches = rule.conditions.every(condition => {
        return this.evaluateCondition(logEntry, condition);
      });

      if (matches) {
        this.triggerAlert(rule, logEntry);
      }
    });
  }

  private evaluateCondition(logEntry: LogEntry, condition: any): boolean {
    const { field, operator, value, caseSensitive = false } = condition;
    let logValue = this.getFieldValue(logEntry, field);

    if (logValue === undefined) return false;

    // Convert to string for text operations
    const strValue = String(logValue);
    const strConditionValue = String(value);

    if (!caseSensitive) {
      logValue = strValue.toLowerCase();
      value = strConditionValue.toLowerCase();
    }

    switch (operator) {
      case 'equals':
        return logValue === value;
      case 'contains':
        return String(logValue).includes(String(value));
      case 'regex':
        return new RegExp(value, caseSensitive ? '' : 'i').test(String(logValue));
      case 'gt':
        return Number(logValue) > Number(value);
      case 'lt':
        return Number(logValue) < Number(value);
      case 'in':
        return Array.isArray(value) && value.includes(logValue);
      default:
        return false;
    }
  }

  private getFieldValue(logEntry: LogEntry, field: string): any {
    const fieldParts = field.split('.');
    let value: any = logEntry;

    for (const part of fieldParts) {
      if (value && typeof value === 'object') {
        value = value[part];
      } else {
        return undefined;
      }
    }

    return value;
  }

  private async triggerAlert(rule: LogAlertRule, logEntry: LogEntry): Promise<void> {
    const now = Date.now();
    rule.lastTriggered = now;
    rule.triggerCount++;

    // Create alert
    const alert = {
      id: crypto.randomUUID(),
      ruleId: rule.id,
      ruleName: rule.name,
      severity: rule.severity,
      message: `Alert triggered: ${rule.name}`,
      logEntry,
      timestamp: now,
      acknowledged: false,
      resolved: false
    };

    // Execute alert actions
    for (const action of rule.actions) {
      await this.executeAlertAction(action, alert);
    }

    // Store alert
    await this.storeAlert(alert);
  }

  private async executeAlertAction(action: any, alert: any): Promise<void> {
    try {
      switch (action.type) {
        case 'alert':
          realTimeMonitoringService.triggerAlert({
            type: 'system',
            severity: alert.severity,
            title: alert.ruleName,
            message: alert.message,
            metadata: alert
          });
          break;

        case 'webhook':
          if (action.destination) {
            await fetch(action.destination, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(alert)
            });
          }
          break;

        case 'email':
          if (action.destination) {
            await fetch('/api/alerts/email', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                to: action.destination,
                subject: `[${alert.severity.toUpperCase()}] ${alert.ruleName}`,
                html: this.generateEmailAlert(alert)
              })
            });
          }
          break;

        case 'slack':
          if (action.destination) {
            await this.sendSlackAlert(action.destination, alert);
          }
          break;
      }
    } catch (error) {
      logger.error('Failed to execute alert action', error);
    }
  }

  private generateEmailAlert(alert: any): string {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #ff4444; color: white; padding: 20px; text-align: center;">
          <h1>${alert.ruleName}</h1>
          <p style="margin: 0; font-size: 18px;">Severity: ${alert.severity.toUpperCase()}</p>
        </div>

        <div style="padding: 20px; background: #f9f9f9;">
          <h2>Alert Details</h2>
          <p><strong>Message:</strong> ${alert.message}</p>
          <p><strong>Timestamp:</strong> ${new Date(alert.timestamp).toLocaleString()}</p>

          <h3>Log Entry</h3>
          <table style="width: 100%; border-collapse: collapse;">
            <tr style="background: #e0e0e0;">
              <th style="padding: 8px; text-align: left;">Property</th>
              <th style="padding: 8px; text-align: left;">Value</th>
            </tr>
            <tr>
              <td style="padding: 8px; border-bottom: 1px solid #ddd;">Level</td>
              <td style="padding: 8px; border-bottom: 1px solid #ddd;">${alert.logEntry.level}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border-bottom: 1px solid #ddd;">Category</td>
              <td style="padding: 8px; border-bottom: 1px solid #ddd;">${alert.logEntry.category}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border-bottom: 1px solid #ddd;">Message</td>
              <td style="padding: 8px; border-bottom: 1px solid #ddd;">${alert.logEntry.message}</td>
            </tr>
          </table>
        </div>

        <div style="padding: 20px; background: #f0f0f0; text-align: center;">
          <p style="margin: 0; color: #666;">
            This alert was generated by mariiaborysevych Log Monitoring
          </p>
        </div>
      </div>
    `;
  }

  private async sendSlackAlert(webhookUrl: string, alert: any): Promise<void> {
    const color = {
      'low': '#36a64f',
      'medium': '#ff9500',
      'high': '#ff6b00',
      'critical': '#ff0000'
    }[alert.severity] || '#ff9500';

    const payload = {
      attachments: [{
        color,
        title: alert.ruleName,
        text: alert.message,
        fields: [
          { title: 'Severity', value: alert.severity, short: true },
          { title: 'Level', value: alert.logEntry.level, short: true },
          { title: 'Category', value: alert.logEntry.category, short: true },
          { title: 'Source', value: alert.logEntry.source, short: true },
          { title: 'Time', value: new Date(alert.timestamp).toLocaleString(), short: true }
        ],
        footer: 'mariiaborysevych Log Monitoring',
        ts: Math.floor(alert.timestamp / 1000)
      }]
    };

    await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
  }

  private async storeAlert(alert: any): Promise<void> {
    try {
      await this.supabase.from('log_alerts').insert({
        rule_id: alert.ruleId,
        rule_name: alert.ruleName,
        severity: alert.severity,
        message: alert.message,
        log_entry: alert.logEntry,
        timestamp: new Date(alert.timestamp).toISOString(),
        acknowledged: alert.acknowledged,
        resolved: alert.resolved
      });
    } catch (error) {
      logger.error('Failed to store alert', error);
    }
  }

  private startPeriodicAggregation(): void {
    // Aggregate metrics every minute
    this.aggregationInterval = setInterval(() => {
      this.aggregateMetrics().catch(error => {
        logger.error('Failed to aggregate metrics', error);
      });
    }, 60 * 1000);
  }

  private async aggregateMetrics(): Promise<void> {
    try {
      const now = Date.now();
      const oneHourAgo = now - 60 * 60 * 1000;

      // Filter logs for the last hour
      const recentLogs = this.logs.filter(log => log.timestamp > oneHourAgo);

      if (recentLogs.length === 0) {
        this.metrics = this.getDefaultMetrics();
        return;
      }

      // Calculate metrics
      const logsByLevel = recentLogs.reduce((acc, log) => {
        acc[log.level] = (acc[log.level] || 0) + 1;
        return acc;
      }, {} as Record<LogLevel, number>);

      const logsByCategory = recentLogs.reduce((acc, log) => {
        acc[log.category] = (acc[log.category] || 0) + 1;
        return acc;
      }, {} as Record<LogCategory, number>);

      const logsBySource = recentLogs.reduce((acc, log) => {
        acc[log.source] = (acc[log.source] || 0) + 1;
        return acc;
      }, {} as Record<LogSource, number>);

      const totalLogs = recentLogs.length;
      const errorLogs = (logsByLevel.error || 0) + (logsByLevel.fatal || 0);
      const warningLogs = logsByLevel.warn || 0;
      const errorRate = totalLogs > 0 ? (errorLogs / totalLogs) * 100 : 0;
      const warningRate = totalLogs > 0 ? (warningLogs / totalLogs) * 100 : 0;

      // Find top errors
      const errorMessages = recentLogs
        .filter(log => log.level === 'error' || log.level === 'fatal')
        .reduce((acc, log) => {
          const key = log.message.substring(0, 100); // Truncate for grouping
          if (!acc[key]) {
            acc[key] = { count: 0, level: log.level, lastOccurrence: 0 };
          }
          acc[key].count++;
          acc[key].lastOccurrence = Math.max(acc[key].lastOccurrence, log.timestamp);
          return acc;
        }, {} as Record<string, any>);

      const topErrors = Object.entries(errorMessages)
        .map(([message, data]) => ({ message, ...data }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

      const uniqueErrors = Object.keys(errorMessages).length;

      // Calculate time to resolve (mock data for now)
      const timeToResolve = {
        average: 15, // minutes
        median: 10,
        p95: 30
      };

      // Calculate logging performance (mock data)
      const loggingPerformance = {
        ingestionLatency: 50, // ms
        processingLatency: 100, // ms
        storageLatency: 200, // ms
        indexingLatency: 150 // ms
      };

      this.metrics = {
        totalLogs,
        logsByLevel,
        logsByCategory,
        logsBySource,
        errorRate,
        warningRate,
        uniqueErrors,
        topErrors,
        timeToResolve,
        loggingPerformance,
        timestamp: now
      };

      // Store metrics
      await this.storeMetrics();

      // Report to monitoring
      realTimeMonitoringService.reportMetric({
        type: 'system',
        name: 'log_metrics',
        value: 'updated',
        metadata: this.metrics
      });

    } catch (error) {
      logger.error('Failed to aggregate metrics', error);
    }
  }

  private async storeMetrics(): Promise<void> {
    if (!this.metrics) return;

    try {
      await this.supabase.from('log_metrics').insert({
        total_logs: this.metrics.totalLogs,
        logs_by_level: this.metrics.logsByLevel,
        logs_by_category: this.metrics.logsByCategory,
        logs_by_source: this.metrics.logsBySource,
        error_rate: this.metrics.errorRate,
        warning_rate: this.metrics.warningRate,
        unique_errors: this.metrics.uniqueErrors,
        top_errors: this.metrics.topErrors,
        time_to_resolve: this.metrics.timeToResolve,
        logging_performance: this.metrics.loggingPerformance,
        timestamp: new Date(this.metrics.timestamp).toISOString()
      });
    } catch (error) {
      logger.error('Failed to store metrics', error);
    }
  }

  private startCleanupProcess(): void {
    // Run cleanup every hour
    this.cleanupInterval = setInterval(() => {
      this.cleanupOldLogs().catch(error => {
        logger.error('Failed to cleanup old logs', error);
      });
    }, 60 * 60 * 1000);
  }

  private async cleanupOldLogs(): Promise<void> {
    try {
      const now = Date.now();
      const logsToRemove: LogEntry[] = [];

      // Check each log against retention policies
      this.logs.forEach(log => {
        const policy = this.retentionPolicies.get(`${log.category}_${log.level}`);
        if (policy) {
          const retentionMs = policy.retentionDays * 24 * 60 * 60 * 1000;
          if (now - log.timestamp > retentionMs) {
            logsToRemove.push(log);
          }
        }
      });

      // Remove old logs from memory
      if (logsToRemove.length > 0) {
        this.logs = this.logs.filter(log => !logsToRemove.includes(log));

        // Archive logs if needed
        await this.archiveLogs(logsToRemove);
      }

      // Clean up old metrics from memory
      if (this.metrics && now - this.metrics.timestamp > 24 * 60 * 60 * 1000) {
        this.metrics = null;
      }

    } catch (error) {
      logger.error('Failed to cleanup old logs', error);
    }
  }

  private async archiveLogs(logs: LogEntry[]): Promise<void> {
    try {
      // Group logs by retention policy
      const logsByPolicy = new Map<string, LogEntry[]>();

      logs.forEach(log => {
        const policy = this.retentionPolicies.get(`${log.category}_${log.level}`);
        if (policy && policy.archiveAfterDays > 0) {
          const key = `${log.category}_${log.level}`;
          if (!logsByPolicy.has(key)) {
            logsByPolicy.set(key, []);
          }
          logsByPolicy.get(key)!.push(log);
        }
      });

      // Archive logs to database
      for (const [policyKey, policyLogs] of logsByPolicy) {
        const [category, level] = policyKey.split('_');
        const policy = this.retentionPolicies.get(policyKey);

        if (policy && policy.archiveAfterDays > 0) {
          await this.supabase.from('log_archive').insert({
            category,
            level,
            logs: policyLogs,
            archived_at: new Date().toISOString(),
            retention_days: policy.deleteAfterArchiveDays
          });
        }
      }

    } catch (error) {
      logger.error('Failed to archive logs', error);
    }
  }

  private getDefaultMetrics(): LogAggregationMetrics {
    return {
      totalLogs: 0,
      logsByLevel: {
        debug: 0,
        info: 0,
        warn: 0,
        error: 0,
        fatal: 0
      },
      logsByCategory: {},
      logsBySource: {},
      errorRate: 0,
      warningRate: 0,
      uniqueErrors: 0,
      topErrors: [],
      timeToResolve: {
        average: 0,
        median: 0,
        p95: 0
      },
      loggingPerformance: {
        ingestionLatency: 0,
        processingLatency: 0,
        storageLatency: 0,
        indexingLatency: 0
      },
      timestamp: Date.now()
    };
  }

  // Public API methods
  public getMetrics(): LogAggregationMetrics | null {
    return this.metrics;
  }

  public getRecentLogs(limit = 100, level?: LogLevel, category?: LogCategory): LogEntry[] {
    let logs = [...this.logs].sort((a, b) => b.timestamp - a.timestamp);

    if (level) {
      logs = logs.filter(log => log.level === level);
    }

    if (category) {
      logs = logs.filter(log => log.category === category);
    }

    return logs.slice(0, limit);
  }

  public searchLogs(query: string, options: {
    level?: LogLevel;
    category?: LogCategory;
    source?: LogSource;
    startTime?: Date;
    endTime?: Date;
    limit?: number;
  } = {}): LogEntry[] {
    let logs = [...this.logs];

    // Apply filters
    if (options.level) {
      logs = logs.filter(log => log.level === options.level);
    }

    if (options.category) {
      logs = logs.filter(log => log.category === options.category);
    }

    if (options.source) {
      logs = logs.filter(log => log.source === options.source);
    }

    if (options.startTime) {
      logs = logs.filter(log => log.timestamp >= options.startTime!.getTime());
    }

    if (options.endTime) {
      logs = logs.filter(log => log.timestamp <= options.endTime!.getTime());
    }

    // Search in message and metadata
    if (query) {
      const lowerQuery = query.toLowerCase();
      logs = logs.filter(log =>
        log.message.toLowerCase().includes(lowerQuery) ||
        JSON.stringify(log.metadata).toLowerCase().includes(lowerQuery) ||
        log.tags.some(tag => tag.toLowerCase().includes(lowerQuery))
      );
    }

    // Sort by timestamp (newest first) and limit
    logs.sort((a, b) => b.timestamp - a.timestamp);
    return logs.slice(0, options.limit || 100);
  }

  public async generateAnalysisReport(period: 'hour' | 'day' | 'week' | 'month' = 'day'): Promise<LogAnalysisReport> {
    try {
      const now = Date.now();
      let startTime: number;

      switch (period) {
        case 'hour':
          startTime = now - 60 * 60 * 1000;
          break;
        case 'day':
          startTime = now - 24 * 60 * 60 * 1000;
          break;
        case 'week':
          startTime = now - 7 * 24 * 60 * 60 * 1000;
          break;
        case 'month':
          startTime = now - 30 * 24 * 60 * 60 * 1000;
          break;
      }

      const periodLogs = this.logs.filter(log => log.timestamp >= startTime);

      // Generate report
      const report: LogAnalysisReport = {
        period,
        totalLogs: periodLogs.length,
        errorSummary: this.generateErrorSummary(periodLogs),
        performanceInsights: this.generatePerformanceInsights(periodLogs),
        securityEvents: this.generateSecurityEventsSummary(periodLogs),
        businessEvents: this.generateBusinessEventsSummary(periodLogs),
        recommendations: this.generateRecommendations(periodLogs),
        generatedAt: now
      };

      // Store report
      await this.storeAnalysisReport(report);

      return report;

    } catch (error) {
      logger.error('Failed to generate analysis report', error);
      throw error;
    }
  }

  private generateErrorSummary(logs: LogEntry[]): LogAnalysisReport['errorSummary'] {
    const errorLogs = logs.filter(log => log.level === 'error' || log.level === 'fatal');
    const totalErrors = errorLogs.length;

    // Group errors by hour
    const errorTrends = new Map<number, number>();
    errorLogs.forEach(log => {
      const hour = Math.floor(log.timestamp / (60 * 60 * 1000));
      errorTrends.set(hour, (errorTrends.get(hour) || 0) + 1);
    });

    const trendArray = Array.from(errorTrends.entries()).map(([timestamp, count]) => ({
      timestamp: timestamp * 60 * 60 * 1000,
      count
    })).sort((a, b) => a.timestamp - b.timestamp);

    // Group errors by category
    const errorCategories = new Map<string, number>();
    errorLogs.forEach(log => {
      errorCategories.set(log.category, (errorCategories.get(log.category) || 0) + 1);
    });

    const topErrorCategories = Array.from(errorCategories.entries())
      .map(([category, count]) => ({
        category,
        count,
        percentage: totalErrors > 0 ? (count / totalErrors) * 100 : 0
      }))
      .sort((a, b) => b.count - a.count);

    return {
      totalErrors,
      criticalErrors: errorLogs.filter(log => log.level === 'fatal').length,
      errorTrends: trendArray,
      topErrorCategories
    };
  }

  private generatePerformanceInsights(logs: LogEntry[]): LogAnalysisReport['performanceInsights'] {
    // Mock performance insights - would need real performance data
    return {
      slowQueries: [
        {
          query: 'SELECT * FROM bookings WHERE created_at > NOW() - INTERVAL 1 HOUR',
          avgDuration: 2500,
          count: 15
        }
      ],
      slowEndpoints: [
        {
          endpoint: '/api/services/search',
          avgResponseTime: 1500,
          count: 25
        }
      ],
      resourceBottlenecks: [
        {
          resource: 'database_connections',
          utilization: 85,
          impact: 'High query latency'
        }
      ]
    };
  }

  private generateSecurityEventsSummary(logs: LogEntry[]): LogAnalysisReport['securityEvents'] {
    const securityLogs = logs.filter(log => log.category === 'security');

    return {
      suspiciousActivities: securityLogs.filter(log => log.message.includes('suspicious')).length,
      blockedRequests: securityLogs.filter(log => log.message.includes('blocked')).length,
      authenticationFailures: logs.filter(log => log.category === 'auth' && log.level === 'error').length,
      dataAccessViolations: securityLogs.filter(log => log.message.includes('violation')).length
    };
  }

  private generateBusinessEventsSummary(logs: LogEntry[]): LogAnalysisReport['businessEvents'] {
    return {
      bookingsCreated: logs.filter(log => log.message.includes('booking_created')).length,
      paymentsCompleted: logs.filter(log => log.message.includes('payment_completed')).length,
      userRegistrations: logs.filter(log => log.message.includes('user_registered')).length,
      conversionEvents: logs.filter(log => log.tags.includes('conversion')).length
    };
  }

  private generateRecommendations(logs: LogEntry[]): LogAnalysisReport['recommendations'] {
    const recommendations: LogAnalysisReport['recommendations'] = [];
    const errorLogs = logs.filter(log => log.level === 'error' || log.level === 'fatal');
    const errorRate = logs.length > 0 ? (errorLogs.length / logs.length) * 100 : 0;

    if (errorRate > 5) {
      recommendations.push({
        priority: 'critical',
        category: 'stability',
        description: 'High error rate detected',
        impact: 'User experience and system reliability',
        action: 'Investigate and fix root causes of errors'
      });
    }

    if (errorLogs.filter(log => log.category === 'database').length > 10) {
      recommendations.push({
        priority: 'high',
        category: 'database',
        description: 'Frequent database errors',
        impact: 'Data integrity and application performance',
        action: 'Review database queries and optimize slow queries'
      });
    }

    if (errorLogs.filter(log => log.category === 'auth').length > 5) {
      recommendations.push({
        priority: 'medium',
        category: 'security',
        description: 'Authentication issues detected',
        impact: 'User access and security',
        action: 'Review authentication flow and implement better error handling'
      });
    }

    return recommendations;
  }

  private async storeAnalysisReport(report: LogAnalysisReport): Promise<void> {
    try {
      await this.supabase.from('log_analysis_reports').insert({
        period: report.period,
        total_logs: report.totalLogs,
        error_summary: report.errorSummary,
        performance_insights: report.performanceInsights,
        security_events: report.securityEvents,
        business_events: report.businessEvents,
        recommendations: report.recommendations,
        generated_at: new Date(report.generatedAt).toISOString()
      });
    } catch (error) {
      logger.error('Failed to store analysis report', error);
    }
  }

  public addCustomLog(log: Omit<LogEntry, 'id' | 'timestamp'>): void {
    const fullLog: LogEntry = {
      ...log,
      id: crypto.randomUUID(),
      timestamp: Date.now()
    };

    this.logs.push(fullLog);
    this.checkAlertRules(fullLog);
  }

  public async refreshMetrics(): Promise<void> {
    await this.aggregateMetrics();
  }

  public destroy(): void {
    if (this.aggregationInterval) {
      clearInterval(this.aggregationInterval);
    }
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    this.isInitialized = false;
  }
}

// Export singleton instance
export const logAggregationService = LogAggregationService.getInstance();

// Export convenience functions
export const initializeLogAggregation = () => logAggregationService.initialize();
export const getLogMetrics = () => logAggregationService.getMetrics();
export const getRecentLogs = (limit?: number, level?: LogLevel, category?: LogCategory) =>
  logAggregationService.getRecentLogs(limit, level, category);
export const searchLogs = (query: string, options?: any) =>
  logAggregationService.searchLogs(query, options);
export const generateLogReport = (period?: 'hour' | 'day' | 'week' | 'month') =>
  logAggregationService.generateAnalysisReport(period);

// Auto-initialize in production
if (import.meta.env.PROD) {
  initializeLogAggregation().catch(console.error);
}