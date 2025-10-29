/**
 * Enterprise Performance Alerting System
 * Intelligent alerting, escalation, and notification management
 * for Mariia Hub platform performance issues
 */

import { createClient } from '@supabase/supabase-js';

import { logger } from '@/services/logger.service';

// Alert interfaces
export interface PerformanceAlert {
  id: string;
  type: 'performance' | 'availability' | 'error' | 'resource' | 'sla' | 'security';
  severity: 'info' | 'warning' | 'critical';
  title: string;
  message: string;
  description: string;
  metric: string;
  value: number;
  threshold: number;
  unit: string;
  url?: string;
  endpoint?: string;
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
  tags: string[];
  source: 'automated' | 'manual';
  correlationId?: string;
  suppressionRule?: string;
  escalationLevel: number;
  lastEscalatedAt?: number;
}

export interface AlertRule {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  metric: string;
  condition: 'gt' | 'lt' | 'eq' | 'gte' | 'lte' | 'ne';
  threshold: number;
  duration: number; // ms - how long condition must persist
  severity: 'info' | 'warning' | 'critical';
  businessImpact: 'low' | 'medium' | 'high' | 'critical';
  tags: string[];
  filters: Record<string, any>;
  actions: AlertAction[];
  cooldown: number; // ms
  suppressionWindow: number; // ms
  escalationPolicy: EscalationPolicy;
  notificationChannels: NotificationChannel[];
  schedule?: AlertSchedule;
  createdBy: string;
  createdAt: number;
  updatedAt: number;
}

export interface AlertAction {
  type: 'notification' | 'webhook' | 'script' | 'escalation' | 'suppression';
  config: Record<string, any>;
  delay: number; // ms
  conditions?: Record<string, any>;
}

export interface EscalationPolicy {
  enabled: boolean;
  levels: EscalationLevel[];
}

export interface EscalationLevel {
  level: number;
  delay: number; // ms
  severity: 'warning' | 'critical';
  actions: AlertAction[];
  conditions?: Record<string, any>;
}

export interface NotificationChannel {
  id: string;
  type: 'email' | 'slack' | 'webhook' | 'sms' | 'push' | 'teams';
  name: string;
  enabled: boolean;
  config: Record<string, any>;
  filters: Record<string, any>;
  rateLimit?: {
    maxPerHour: number;
    currentCount: number;
    resetTime: number;
  };
}

export interface AlertSchedule {
  timezone: string;
  activeHours: {
    start: string; // HH:mm
    end: string;   // HH:mm
  };
  activeDays: number[]; // 0-6, Sunday = 0
  holidays: string[]; // ISO dates
}

export interface AlertSuppressionRule {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  conditions: Record<string, any>;
  duration: number; // ms
  createdBy: string;
  createdAt: number;
  expiresAt?: number;
}

export interface AlertStatistics {
  total: number;
  bySeverity: Record<string, number>;
  byType: Record<string, number>;
  byStatus: Record<string, number>;
  avgResolutionTime: number;
  mttr: number; // Mean Time To Resolution
  mttf: number; // Mean Time To Failure
  falsePositiveRate: number;
  escalations: number;
  suppressed: number;
}

class PerformanceAlertingService {
  private static instance: PerformanceAlertingService;
  private supabase: any;
  private alertRules: Map<string, AlertRule> = new Map();
  private activeAlerts: Map<string, PerformanceAlert> = new Map();
  private notificationChannels: Map<string, NotificationChannel> = new Map();
  private suppressionRules: Map<string, AlertSuppressionRule> = new Map();
  private alertHistory: PerformanceAlert[] = [];
  private isInitialized = false;
  private monitoringInterval?: NodeJS.Timeout;
  private escalationInterval?: NodeJS.Timeout;

  constructor() {
    this.supabase = createClient(
      import.meta.env.VITE_SUPABASE_URL!,
      import.meta.env.VITE_SUPABASE_ANON_KEY!
    );
  }

  static getInstance(): PerformanceAlertingService {
    if (!PerformanceAlertingService.instance) {
      PerformanceAlertingService.instance = new PerformanceAlertingService();
    }
    return PerformanceAlertingService.instance;
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // Load alert rules
      await this.loadAlertRules();

      // Load notification channels
      await this.loadNotificationChannels();

      // Load suppression rules
      await this.loadSuppressionRules();

      // Load active alerts
      await this.loadActiveAlerts();

      // Start monitoring
      this.startMonitoring();

      // Start escalation management
      this.startEscalationManagement();

      this.isInitialized = true;
      logger.info('Performance alerting system initialized', {
        rulesCount: this.alertRules.size,
        channelsCount: this.notificationChannels.size,
        activeAlerts: this.activeAlerts.size
      });

    } catch (error) {
      logger.error('Failed to initialize performance alerting', error);
      throw error;
    }
  }

  private async loadAlertRules(): Promise<void> {
    try {
      const { data, error } = await this.supabase
        .from('alert_rules')
        .select('*')
        .eq('enabled', true);

      if (error) throw error;

      if (data) {
        data.forEach(rule => {
          this.alertRules.set(rule.id, {
            id: rule.id,
            name: rule.name,
            description: rule.description || '',
            enabled: rule.enabled,
            metric: rule.metric,
            condition: rule.condition,
            threshold: rule.threshold,
            duration: rule.duration || 300000, // 5 minutes default
            severity: rule.severity,
            businessImpact: rule.business_impact || 'medium',
            tags: rule.tags || [],
            filters: rule.filters || {},
            actions: rule.actions || [],
            cooldown: rule.cooldown || 900000, // 15 minutes default
            suppressionWindow: rule.suppression_window || 3600000, // 1 hour default
            escalationPolicy: rule.escalation_policy || { enabled: false, levels: [] },
            notificationChannels: rule.notification_channels || [],
            schedule: rule.schedule,
            createdBy: rule.created_by,
            createdAt: rule.created_at,
            updatedAt: rule.updated_at
          });
        });
      }
    } catch (error) {
      logger.warn('Failed to load alert rules, using defaults', error);
      this.createDefaultAlertRules();
    }
  }

  private async loadNotificationChannels(): Promise<void> {
    try {
      const { data, error } = await this.supabase
        .from('notification_channels')
        .select('*')
        .eq('enabled', true);

      if (error) throw error;

      if (data) {
        data.forEach(channel => {
          this.notificationChannels.set(channel.id, {
            id: channel.id,
            type: channel.type,
            name: channel.name,
            enabled: channel.enabled,
            config: channel.config || {},
            filters: channel.filters || {},
            rateLimit: channel.rate_limit
          });
        });
      }
    } catch (error) {
      logger.warn('Failed to load notification channels', error);
      this.createDefaultNotificationChannels();
    }
  }

  private async loadSuppressionRules(): Promise<void> {
    try {
      const { data, error } = await this.supabase
        .from('alert_suppression_rules')
        .select('*')
        .eq('enabled', true);

      if (error) throw error;

      if (data) {
        data.forEach(rule => {
          this.suppressionRules.set(rule.id, {
            id: rule.id,
            name: rule.name,
            description: rule.description || '',
            enabled: rule.enabled,
            conditions: rule.conditions || {},
            duration: rule.duration,
            createdBy: rule.created_by,
            createdAt: rule.created_at,
            expiresAt: rule.expires_at
          });
        });
      }
    } catch (error) {
      logger.warn('Failed to load suppression rules', error);
    }
  }

  private async loadActiveAlerts(): Promise<void> {
    try {
      const { data, error } = await this.supabase
        .from('monitoring_alerts')
        .select('*')
        .eq('status', 'open')
        .order('triggered_at', { ascending: false });

      if (error) throw error;

      if (data) {
        data.forEach(alert => {
          this.activeAlerts.set(alert.id, {
            id: alert.id,
            type: alert.alert_type,
            severity: alert.severity,
            title: alert.title,
            message: alert.description || '',
            description: alert.description || '',
            metric: alert.details?.metric || '',
            value: alert.details?.value || 0,
            threshold: alert.details?.threshold || 0,
            unit: alert.details?.unit || '',
            url: alert.details?.url,
            endpoint: alert.details?.endpoint,
            timestamp: new Date(alert.triggered_at).getTime(),
            resolved: alert.status === 'resolved',
            resolvedAt: alert.resolved_at ? new Date(alert.resolved_at).getTime() : undefined,
            resolvedBy: alert.resolved_by,
            acknowledged: alert.status === 'acknowledged',
            acknowledgedAt: alert.acknowledged_at ? new Date(alert.acknowledged_at).getTime() : undefined,
            acknowledgedBy: alert.acknowledged_by,
            details: alert.details || {},
            businessImpact: alert.details?.businessImpact || 'medium',
            affectedUsers: alert.details?.affectedUsers,
            estimatedRevenue: alert.details?.estimatedRevenue,
            tags: alert.details?.tags || [],
            source: alert.details?.source || 'automated',
            correlationId: alert.details?.correlationId,
            suppressionRule: alert.details?.suppressionRule,
            escalationLevel: alert.details?.escalationLevel || 0,
            lastEscalatedAt: alert.details?.lastEscalatedAt
          });
        });
      }
    } catch (error) {
      logger.warn('Failed to load active alerts', error);
    }
  }

  private createDefaultAlertRules(): void {
    const defaultRules: Omit<AlertRule, 'id' | 'createdBy' | 'createdAt' | 'updatedAt'>[] = [
      {
        name: 'High LCP',
        description: 'Alert when Largest Contentful Paint is poor',
        enabled: true,
        metric: 'lcp',
        condition: 'gt',
        threshold: 4000,
        duration: 300000, // 5 minutes
        severity: 'warning',
        businessImpact: 'high',
        tags: ['performance', 'web-vitals'],
        filters: {},
        actions: [
          {
            type: 'notification',
            config: { channels: ['email', 'slack'] },
            delay: 0
          }
        ],
        cooldown: 900000, // 15 minutes
        suppressionWindow: 3600000, // 1 hour
        escalationPolicy: {
          enabled: true,
          levels: [
            {
              level: 1,
              delay: 600000, // 10 minutes
              severity: 'critical',
              actions: [
                {
                  type: 'notification',
                  config: { channels: ['sms', 'webhook'] },
                  delay: 0
                }
              ]
            }
          ]
        },
        notificationChannels: []
      },
      {
        name: 'High Error Rate',
        description: 'Alert when error rate exceeds threshold',
        enabled: true,
        metric: 'errorRate',
        condition: 'gt',
        threshold: 5.0,
        duration: 180000, // 3 minutes
        severity: 'critical',
        businessImpact: 'critical',
        tags: ['performance', 'errors'],
        filters: {},
        actions: [
          {
            type: 'notification',
            config: { channels: ['email', 'slack', 'sms'] },
            delay: 0
          }
        ],
        cooldown: 300000, // 5 minutes
        suppressionWindow: 1800000, // 30 minutes
        escalationPolicy: {
          enabled: true,
          levels: []
        },
        notificationChannels: []
      },
      {
        name: 'Slow API Response',
        description: 'Alert when API response time is poor',
        enabled: true,
        metric: 'apiResponseTime',
        condition: 'gt',
        threshold: 3000,
        duration: 300000, // 5 minutes
        severity: 'warning',
        businessImpact: 'medium',
        tags: ['performance', 'api'],
        filters: {},
        actions: [
          {
            type: 'notification',
            config: { channels: ['email'] },
            delay: 0
          }
        ],
        cooldown: 900000, // 15 minutes
        suppressionWindow: 3600000, // 1 hour
        escalationPolicy: {
          enabled: false,
          levels: []
        },
        notificationChannels: []
      }
    ];

    defaultRules.forEach(rule => {
      const id = crypto.randomUUID();
      this.alertRules.set(id, {
        ...rule,
        id,
        createdBy: 'system',
        createdAt: Date.now(),
        updatedAt: Date.now()
      });
    });
  }

  private createDefaultNotificationChannels(): void {
    const defaultChannels: Omit<NotificationChannel, 'id'>[] = [
      {
        type: 'email',
        name: 'Dev Team Email',
        enabled: true,
        config: {
          recipients: ['dev-team@mariia.com'],
          template: 'performance-alert'
        },
        filters: { severity: ['warning', 'critical'] }
      },
      {
        type: 'webhook',
        name: 'Slack Webhook',
        enabled: true,
        config: {
          url: import.meta.env.VITE_SLACK_WEBHOOK_URL,
          channel: '#alerts'
        },
        filters: { severity: ['critical'] }
      }
    ];

    defaultChannels.forEach(channel => {
      const id = crypto.randomUUID();
      this.notificationChannels.set(id, { ...channel, id });
    });
  }

  private startMonitoring(): void {
    this.monitoringInterval = setInterval(() => {
      this.checkAlertRules();
    }, 30000); // Check every 30 seconds
  }

  private startEscalationManagement(): void {
    this.escalationInterval = setInterval(() => {
      this.processEscalations();
    }, 60000); // Check escalations every minute
  }

  private async checkAlertRules(): Promise<void> {
    for (const rule of this.alertRules.values()) {
      if (!rule.enabled) continue;

      try {
        const shouldAlert = await this.evaluateRule(rule);
        if (shouldAlert) {
          await this.triggerAlert(rule);
        }
      } catch (error) {
        logger.error(`Failed to evaluate alert rule ${rule.name}`, error);
      }
    }
  }

  private async evaluateRule(rule: AlertRule): Promise<boolean> {
    // Check if alert is suppressed
    if (this.isAlertSuppressed(rule)) {
      return false;
    }

    // Check schedule
    if (!this.isWithinSchedule(rule.schedule)) {
      return false;
    }

    // Check cooldown
    if (this.isInCooldown(rule)) {
      return false;
    }

    // Get current metric value
    const currentValue = await this.getMetricValue(rule.metric);
    if (currentValue === null) return false;

    // Evaluate condition
    const conditionMet = this.evaluateCondition(currentValue, rule.condition, rule.threshold);
    if (!conditionMet) return false;

    // Check duration requirement
    if (rule.duration > 0) {
      const hasPersisted = await this.checkConditionDuration(rule, currentValue);
      if (!hasPersisted) return false;
    }

    return true;
  }

  private isAlertSuppressed(rule: AlertRule): boolean {
    for (const suppressionRule of this.suppressionRules.values()) {
      if (!suppressionRule.enabled) continue;

      if (suppressionRule.expiresAt && Date.now() > suppressionRule.expiresAt) {
        this.suppressionRules.delete(suppressionRule.id);
        continue;
      }

      if (this.matchesSuppressionRule(rule, suppressionRule)) {
        return true;
      }
    }
    return false;
  }

  private matchesSuppressionRule(rule: AlertRule, suppressionRule: AlertSuppressionRule): boolean {
    // Simple matching logic - can be enhanced
    if (suppressionRule.conditions.metric && suppressionRule.conditions.metric !== rule.metric) {
      return false;
    }
    if (suppressionRule.conditions.severity && suppressionRule.conditions.severity !== rule.severity) {
      return false;
    }
    if (suppressionRule.conditions.tags && suppressionRule.conditions.tags.length > 0) {
      const hasMatchingTag = suppressionRule.conditions.tags.some((tag: string) =>
        rule.tags.includes(tag)
      );
      if (!hasMatchingTag) return false;
    }
    return true;
  }

  private isWithinSchedule(schedule?: AlertSchedule): boolean {
    if (!schedule) return true;

    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes();
    const dayOfWeek = now.getDay();

    // Check day of week
    if (!schedule.activeDays.includes(dayOfWeek)) {
      return false;
    }

    // Check holidays
    if (schedule.holidays.includes(now.toISOString().split('T')[0])) {
      return false;
    }

    // Check time range
    const [startHour, startMin] = schedule.activeHours.start.split(':').map(Number);
    const [endHour, endMin] = schedule.activeHours.end.split(':').map(Number);
    const startTime = startHour * 60 + startMin;
    const endTime = endHour * 60 + endMin;

    return currentTime >= startTime && currentTime <= endTime;
  }

  private isInCooldown(rule: AlertRule): boolean {
    const recentAlerts = Array.from(this.activeAlerts.values()).filter(alert =>
      alert.metric === rule.metric &&
      alert.timestamp > Date.now() - rule.cooldown
    );

    return recentAlerts.length > 0;
  }

  private async getMetricValue(metric: string): Promise<number | null> {
    try {
      switch (metric) {
        case 'lcp':
        case 'fid':
        case 'cls':
        case 'fcp':
        case 'ttfb':
          return await this.getWebVitalMetric(metric);
        case 'apiResponseTime':
          return await this.getApiResponseTimeMetric();
        case 'errorRate':
          return await this.getErrorRateMetric();
        case 'availability':
          return await this.getAvailabilityMetric();
        default:
          logger.warn(`Unknown metric: ${metric}`);
          return null;
      }
    } catch (error) {
      logger.error(`Failed to get metric value for ${metric}`, error);
      return null;
    }
  }

  private async getWebVitalMetric(metric: string): Promise<number | null> {
    try {
      const { data, error } = await this.supabase
        .from('monitoring_performance')
        .select(metric === 'lcp' ? 'lcp_ms' :
               metric === 'fid' ? 'fid_ms' :
               metric === 'cls' ? 'cls_score' :
               metric === 'fcp' ? 'fcp_ms' :
               metric === 'ttfb' ? 'ttfb_ms' : 'lcp_ms')
        .gte('timestamp', new Date(Date.now() - 300000).toISOString()) // Last 5 minutes
        .order('timestamp', { ascending: false })
        .limit(10);

      if (error) throw error;

      if (!data || data.length === 0) return null;

      const values = data.map(row =>
        row[metric === 'lcp' ? 'lcp_ms' :
           metric === 'fid' ? 'fid_ms' :
           metric === 'cls' ? 'cls_score' :
           metric === 'fcp' ? 'fcp_ms' :
           metric === 'ttfb' ? 'ttfb_ms' : 'lcp_ms']
      ).filter(v => v !== null);

      return values.length > 0 ? values.reduce((sum, val) => sum + val, 0) / values.length : null;
    } catch (error) {
      logger.error(`Failed to get ${metric} metric`, error);
      return null;
    }
  }

  private async getApiResponseTimeMetric(): Promise<number | null> {
    try {
      const { data, error } = await this.supabase
        .from('monitoring_api_performance')
        .select('response_time_ms')
        .gte('timestamp', new Date(Date.now() - 300000).toISOString())
        .order('timestamp', { ascending: false })
        .limit(50);

      if (error) throw error;

      if (!data || data.length === 0) return null;

      const responseTimes = data.map(row => row.response_time_ms);
      return responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length;
    } catch (error) {
      logger.error('Failed to get API response time metric', error);
      return null;
    }
  }

  private async getErrorRateMetric(): Promise<number | null> {
    try {
      const { data, error } = await this.supabase
        .from('monitoring_api_performance')
        .select('status_code')
        .gte('timestamp', new Date(Date.now() - 300000).toISOString());

      if (error) throw error;

      if (!data || data.length === 0) return null;

      const errorCount = data.filter(row => row.status_code >= 400).length;
      return (errorCount / data.length) * 100;
    } catch (error) {
      logger.error('Failed to get error rate metric', error);
      return null;
    }
  }

  private async getAvailabilityMetric(): Promise<number | null> {
    try {
      const { data, error } = await this.supabase
        .from('monitoring_health_checks')
        .select('score')
        .gte('timestamp', new Date(Date.now() - 300000).toISOString())
        .order('timestamp', { ascending: false })
        .limit(10);

      if (error) throw error;

      if (!data || data.length === 0) return null;

      const passingChecks = data.filter(row => row.score >= 80).length;
      return (passingChecks / data.length) * 100;
    } catch (error) {
      logger.error('Failed to get availability metric', error);
      return null;
    }
  }

  private evaluateCondition(value: number, condition: string, threshold: number): boolean {
    switch (condition) {
      case 'gt': return value > threshold;
      case 'gte': return value >= threshold;
      case 'lt': return value < threshold;
      case 'lte': return value <= threshold;
      case 'eq': return value === threshold;
      case 'ne': return value !== threshold;
      default: return false;
    }
  }

  private async checkConditionDuration(rule: AlertRule, currentValue: number): Promise<boolean> {
    // Check if condition has persisted for the required duration
    const startTime = Date.now() - rule.duration;

    // This would require historical data - simplified implementation
    // In production, you'd query time-series data for the duration period
    return true; // Simplified for now
  }

  private async triggerAlert(rule: AlertRule): Promise<void> {
    const alert: PerformanceAlert = {
      id: crypto.randomUUID(),
      type: 'performance',
      severity: rule.severity,
      title: rule.name,
      message: `${rule.metric} has exceeded threshold`,
      description: rule.description,
      metric: rule.metric,
      value: await this.getMetricValue(rule.metric) || 0,
      threshold: rule.threshold,
      unit: this.getMetricUnit(rule.metric),
      url: window.location.href,
      timestamp: Date.now(),
      resolved: false,
      acknowledged: false,
      details: {
        ruleId: rule.id,
        condition: rule.condition,
        duration: rule.duration,
        businessImpact: rule.businessImpact
      },
      businessImpact: rule.businessImpact,
      tags: rule.tags,
      source: 'automated',
      escalationLevel: 0
    };

    this.activeAlerts.set(alert.id, alert);
    this.alertHistory.push(alert);

    // Store in database
    await this.storeAlert(alert);

    // Execute immediate actions
    for (const action of rule.actions.filter(a => a.delay === 0)) {
      await this.executeAlertAction(alert, action);
    }

    // Schedule delayed actions
    for (const action of rule.actions.filter(a => a.delay > 0)) {
      setTimeout(() => {
        this.executeAlertAction(alert, action);
      }, action.delay);
    }

    logger.warn('Performance alert triggered', alert);
  }

  private async storeAlert(alert: PerformanceAlert): Promise<void> {
    try {
      await this.supabase.from('monitoring_alerts').insert({
        id: alert.id,
        alert_type: alert.type,
        severity: alert.severity,
        title: alert.title,
        description: alert.message,
        details: alert.details,
        status: 'open',
        triggered_at: new Date(alert.timestamp).toISOString(),
        environment: import.meta.env.MODE
      });
    } catch (error) {
      logger.error('Failed to store alert', error);
    }
  }

  private async executeAlertAction(alert: PerformanceAlert, action: AlertAction): Promise<void> {
    try {
      switch (action.type) {
        case 'notification':
          await this.sendNotification(alert, action.config);
          break;
        case 'webhook':
          await this.sendWebhook(alert, action.config);
          break;
        case 'escalation':
          await this.escalateAlert(alert, action.config);
          break;
        case 'suppression':
          await this.createSuppressionRule(alert, action.config);
          break;
        default:
          logger.warn(`Unknown alert action type: ${action.type}`);
      }
    } catch (error) {
      logger.error(`Failed to execute alert action ${action.type}`, error);
    }
  }

  private async sendNotification(alert: PerformanceAlert, config: Record<string, any>): Promise<void> {
    const channels = config.channels || [];

    for (const channelName of channels) {
      const channel = Array.from(this.notificationChannels.values())
        .find(c => c.name === channelName || c.type === channelName);

      if (!channel || !channel.enabled) continue;

      // Check rate limiting
      if (this.isRateLimited(channel)) {
        logger.warn(`Notification channel ${channel.name} is rate limited`);
        continue;
      }

      switch (channel.type) {
        case 'email':
          await this.sendEmailNotification(alert, channel);
          break;
        case 'slack':
          await this.sendSlackNotification(alert, channel);
          break;
        case 'webhook':
          await this.sendWebhook(alert, channel.config);
          break;
        case 'sms':
          await this.sendSMSNotification(alert, channel);
          break;
        default:
          logger.warn(`Unknown notification channel type: ${channel.type}`);
      }

      // Update rate limit
      this.updateRateLimit(channel);
    }
  }

  private async sendEmailNotification(alert: PerformanceAlert, channel: NotificationChannel): Promise<void> {
    // Implementation would depend on email service provider
    logger.info('Email notification sent', { alertId: alert.id, channel: channel.name });
  }

  private async sendSlackNotification(alert: PerformanceAlert, channel: NotificationChannel): Promise<void> {
    const payload = {
      text: `🚨 Performance Alert: ${alert.title}`,
      attachments: [
        {
          color: alert.severity === 'critical' ? 'danger' : alert.severity === 'warning' ? 'warning' : 'good',
          fields: [
            { title: 'Metric', value: alert.metric, short: true },
            { title: 'Value', value: `${alert.value}${alert.unit}`, short: true },
            { title: 'Threshold', value: `${alert.threshold}${alert.unit}`, short: true },
            { title: 'Business Impact', value: alert.businessImpact, short: true }
          ],
          footer: 'Performance Monitoring System',
          ts: Math.floor(alert.timestamp / 1000)
        }
      ]
    };

    try {
      await fetch(channel.config.url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      logger.info('Slack notification sent', { alertId: alert.id });
    } catch (error) {
      logger.error('Failed to send Slack notification', error);
    }
  }

  private async sendWebhook(alert: PerformanceAlert, config: Record<string, any>): Promise<void> {
    try {
      await fetch(config.url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          alert,
          timestamp: Date.now(),
          service: 'performance-monitoring'
        })
      });
      logger.info('Webhook notification sent', { alertId: alert.id, url: config.url });
    } catch (error) {
      logger.error('Failed to send webhook notification', error);
    }
  }

  private async sendSMSNotification(alert: PerformanceAlert, channel: NotificationChannel): Promise<void> {
    // Implementation would depend on SMS service provider
    logger.info('SMS notification sent', { alertId: alert.id, channel: channel.name });
  }

  private isRateLimited(channel: NotificationChannel): boolean {
    if (!channel.rateLimit) return false;

    const now = Date.now();
    if (now > channel.rateLimit.resetTime) {
      // Reset rate limit
      channel.rateLimit.currentCount = 0;
      channel.rateLimit.resetTime = now + 3600000; // 1 hour
    }

    return channel.rateLimit.currentCount >= channel.rateLimit.maxPerHour;
  }

  private updateRateLimit(channel: NotificationChannel): void {
    if (channel.rateLimit) {
      channel.rateLimit.currentCount++;
    }
  }

  private async processEscalations(): Promise<void> {
    const now = Date.now();

    for (const alert of this.activeAlerts.values()) {
      if (alert.resolved || alert.acknowledged) continue;

      const rule = Array.from(this.alertRules.values()).find(r => r.id === alert.details.ruleId);
      if (!rule || !rule.escalationPolicy.enabled) continue;

      const currentLevel = alert.escalationLevel;
      const nextLevel = rule.escalationPolicy.levels.find(l => l.level === currentLevel + 1);

      if (!nextLevel) continue;

      const shouldEscalate = !alert.lastEscalatedAt ||
        now - alert.lastEscalatedAt > nextLevel.delay;

      if (shouldEscalate) {
        await this.escalateAlert(alert, { level: nextLevel.level });
      }
    }
  }

  private async escalateAlert(alert: PerformanceAlert, config: Record<string, any>): Promise<void> {
    const rule = Array.from(this.alertRules.values()).find(r => r.id === alert.details.ruleId);
    if (!rule) return;

    const escalationLevel = rule.escalationPolicy.levels.find(l => l.level === config.level);
    if (!escalationLevel) return;

    // Update alert
    alert.escalationLevel = escalationLevel.level;
    alert.severity = escalationLevel.severity;
    alert.lastEscalatedAt = Date.now();

    // Execute escalation actions
    for (const action of escalationLevel.actions) {
      await this.executeAlertAction(alert, action);
    }

    // Update in database
    await this.updateAlert(alert);

    logger.warn('Alert escalated', {
      alertId: alert.id,
      fromLevel: escalationLevel.level - 1,
      toLevel: escalationLevel.level,
      severity: escalationLevel.severity
    });
  }

  private async createSuppressionRule(alert: PerformanceAlert, config: Record<string, any>): Promise<void> {
    const suppressionRule: AlertSuppressionRule = {
      id: crypto.randomUUID(),
      name: `Auto-suppression for ${alert.title}`,
      description: 'Automatically created suppression rule',
      enabled: true,
      conditions: {
        metric: alert.metric,
        severity: alert.severity,
        tags: alert.tags
      },
      duration: config.duration || 3600000, // 1 hour default
      createdBy: 'system',
      createdAt: Date.now(),
      expiresAt: Date.now() + (config.duration || 3600000)
    };

    this.suppressionRules.set(suppressionRule.id, suppressionRule);

    logger.info('Suppression rule created', {
      ruleId: suppressionRule.id,
      metric: alert.metric,
      duration: suppressionRule.duration
    });
  }

  private async updateAlert(alert: PerformanceAlert): Promise<void> {
    try {
      await this.supabase
        .from('monitoring_alerts')
        .update({
          severity: alert.severity,
          details: alert.details,
          updated_at: new Date().toISOString()
        })
        .eq('id', alert.id);
    } catch (error) {
      logger.error('Failed to update alert', error);
    }
  }

  private getMetricUnit(metric: string): string {
    const units: Record<string, string> = {
      lcp: 'ms',
      fid: 'ms',
      cls: '',
      fcp: 'ms',
      ttfb: 'ms',
      apiResponseTime: 'ms',
      errorRate: '%',
      availability: '%'
    };
    return units[metric] || '';
  }

  // Public API methods

  public async createAlert(alert: Omit<PerformanceAlert, 'id' | 'timestamp'>): Promise<string> {
    const fullAlert: PerformanceAlert = {
      ...alert,
      id: crypto.randomUUID(),
      timestamp: Date.now()
    };

    this.activeAlerts.set(fullAlert.id, fullAlert);
    this.alertHistory.push(fullAlert);

    await this.storeAlert(fullAlert);

    logger.info('Manual alert created', { alertId: fullAlert.id });
    return fullAlert.id;
  }

  public async acknowledgeAlert(alertId: string, userId: string): Promise<boolean> {
    const alert = this.activeAlerts.get(alertId);
    if (!alert) return false;

    alert.acknowledged = true;
    alert.acknowledgedAt = Date.now();
    alert.acknowledgedBy = userId;

    try {
      await this.supabase
        .from('monitoring_alerts')
        .update({
          status: 'acknowledged',
          acknowledged_at: new Date(alert.acknowledgedAt!).toISOString(),
          acknowledged_by: userId
        })
        .eq('id', alertId);

      logger.info('Alert acknowledged', { alertId, userId });
      return true;
    } catch (error) {
      logger.error('Failed to acknowledge alert', error);
      return false;
    }
  }

  public async resolveAlert(alertId: string, userId: string): Promise<boolean> {
    const alert = this.activeAlerts.get(alertId);
    if (!alert) return false;

    alert.resolved = true;
    alert.resolvedAt = Date.now();
    alert.resolvedBy = userId;

    this.activeAlerts.delete(alertId);

    try {
      await this.supabase
        .from('monitoring_alerts')
        .update({
          status: 'resolved',
          resolved_at: new Date(alert.resolvedAt!).toISOString(),
          resolved_by: userId
        })
        .eq('id', alertId);

      logger.info('Alert resolved', { alertId, userId });
      return true;
    } catch (error) {
      logger.error('Failed to resolve alert', error);
      return false;
    }
  }

  public getActiveAlerts(): PerformanceAlert[] {
    return Array.from(this.activeAlerts.values());
  }

  public getAlertHistory(limit = 1000): PerformanceAlert[] {
    return this.alertHistory.slice(-limit);
  }

  public async getAlertStatistics(period: 'hour' | 'day' | 'week' | 'month' = 'day'): Promise<AlertStatistics> {
    try {
      const startTime = new Date();
      switch (period) {
        case 'hour':
          startTime.setHours(startTime.getHours() - 1);
          break;
        case 'day':
          startTime.setDate(startTime.getDate() - 1);
          break;
        case 'week':
          startTime.setDate(startTime.getDate() - 7);
          break;
        case 'month':
          startTime.setMonth(startTime.getMonth() - 1);
          break;
      }

      const { data, error } = await this.supabase
        .from('monitoring_alerts')
        .select('*')
        .gte('triggered_at', startTime.toISOString());

      if (error) throw error;

      const alerts = data || [];
      const resolvedAlerts = alerts.filter(a => a.status === 'resolved');
      const openAlerts = alerts.filter(a => a.status === 'open');

      // Calculate statistics
      const bySeverity = alerts.reduce((acc, alert) => {
        acc[alert.severity] = (acc[alert.severity] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const byType = alerts.reduce((acc, alert) => {
        acc[alert.alert_type] = (acc[alert.alert_type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const byStatus = alerts.reduce((acc, alert) => {
        acc[alert.status] = (acc[alert.status] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const avgResolutionTime = resolvedAlerts.length > 0
        ? resolvedAlerts.reduce((sum, alert) => {
            const created = new Date(alert.triggered_at).getTime();
            const resolved = new Date(alert.resolved_at!).getTime();
            return sum + (resolved - created);
          }, 0) / resolvedAlerts.length
        : 0;

      return {
        total: alerts.length,
        bySeverity,
        byType,
        byStatus,
        avgResolutionTime,
        mttr: avgResolutionTime, // Mean Time To Resolution
        mttf: 0, // Mean Time To Failure - would need more complex calculation
        falsePositiveRate: 0, // Would need user feedback tracking
        escalations: alerts.filter(a => a.details?.escalationLevel > 0).length,
        suppressed: alerts.filter(a => a.details?.suppressionRule).length
      };
    } catch (error) {
      logger.error('Failed to get alert statistics', error);
      return {
        total: 0,
        bySeverity: {},
        byType: {},
        byStatus: {},
        avgResolutionTime: 0,
        mttr: 0,
        mttf: 0,
        falsePositiveRate: 0,
        escalations: 0,
        suppressed: 0
      };
    }
  }

  public async addAlertRule(rule: Omit<AlertRule, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const fullRule: AlertRule = {
      ...rule,
      id: crypto.randomUUID(),
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    this.alertRules.set(fullRule.id, fullRule);

    try {
      await this.supabase.from('alert_rules').insert({
        id: fullRule.id,
        name: fullRule.name,
        description: fullRule.description,
        enabled: fullRule.enabled,
        metric: fullRule.metric,
        condition: fullRule.condition,
        threshold: fullRule.threshold,
        duration: fullRule.duration,
        severity: fullRule.severity,
        business_impact: fullRule.businessImpact,
        tags: fullRule.tags,
        filters: fullRule.filters,
        actions: fullRule.actions,
        cooldown: fullRule.cooldown,
        suppression_window: fullRule.suppressionWindow,
        escalation_policy: fullRule.escalationPolicy,
        notification_channels: fullRule.notificationChannels,
        schedule: fullRule.schedule,
        created_by: fullRule.createdBy,
        created_at: new Date(fullRule.createdAt).toISOString(),
        updated_at: new Date(fullRule.updatedAt).toISOString()
      });

      logger.info('Alert rule added', { ruleId: fullRule.id, name: fullRule.name });
      return fullRule.id;
    } catch (error) {
      logger.error('Failed to add alert rule', error);
      throw error;
    }
  }

  public async addNotificationChannel(channel: Omit<NotificationChannel, 'id'>): Promise<string> {
    const fullChannel: NotificationChannel = {
      ...channel,
      id: crypto.randomUUID()
    };

    this.notificationChannels.set(fullChannel.id, fullChannel);

    try {
      await this.supabase.from('notification_channels').insert({
        id: fullChannel.id,
        type: fullChannel.type,
        name: fullChannel.name,
        enabled: fullChannel.enabled,
        config: fullChannel.config,
        filters: fullChannel.filters,
        rate_limit: fullChannel.rateLimit
      });

      logger.info('Notification channel added', { channelId: fullChannel.id, name: fullChannel.name });
      return fullChannel.id;
    } catch (error) {
      logger.error('Failed to add notification channel', error);
      throw error;
    }
  }

  public destroy(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
    }
    if (this.escalationInterval) {
      clearInterval(this.escalationInterval);
    }
    this.isInitialized = false;
  }
}

// Export singleton instance
export const performanceAlertingService = PerformanceAlertingService.getInstance();

// Export convenient functions
export const initializePerformanceAlerting = () => performanceAlertingService.initialize();
export const createPerformanceAlert = (alert: Omit<PerformanceAlert, 'id' | 'timestamp'>) =>
  performanceAlertingService.createAlert(alert);
export const acknowledgePerformanceAlert = (alertId: string, userId: string) =>
  performanceAlertingService.acknowledgeAlert(alertId, userId);
export const resolvePerformanceAlert = (alertId: string, userId: string) =>
  performanceAlertingService.resolveAlert(alertId, userId);
export const getActivePerformanceAlerts = () => performanceAlertingService.getActiveAlerts();
export const getPerformanceAlertStatistics = (period?: 'hour' | 'day' | 'week' | 'month') =>
  performanceAlertingService.getAlertStatistics(period);

// Auto-initialize in production
if (import.meta.env.PROD) {
  initializePerformanceAlerting().catch(console.error);
}