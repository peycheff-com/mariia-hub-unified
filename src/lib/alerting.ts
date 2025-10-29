/**
 * Alerting System for Mariia Hub
 * Handles custom alerting rules and notifications for critical business metrics
 */

import { createClient } from '@supabase/supabase-js';

import { monitoringService } from '../services/monitoringService';

import { healthCheckService } from './health-check';
import { reportError, reportMessage } from './sentry';
import { getEnvVar } from '@/lib/runtime-env';

export interface AlertRule {
  id: string;
  name: string;
  description: string;
  type: AlertType;
  severity: AlertSeverity;
  condition: AlertCondition;
  threshold: number;
  timeWindow: number; // minutes
  enabled: boolean;
  cooldown: number; // minutes between alerts
  notifications: NotificationChannel[];
  customMessage?: string;
  tags?: Record<string, string>;
}

export interface Alert {
  id: string;
  ruleId: string;
  type: AlertType;
  severity: AlertSeverity;
  title: string;
  message: string;
  details: Record<string, any>;
  status: AlertStatus;
  triggeredAt: Date;
  acknowledgedAt?: Date;
  resolvedAt?: Date;
  acknowledgedBy?: string;
  resolvedBy?: string;
  url?: string;
  tags?: Record<string, string>;
}

export type AlertType =
  | 'error_rate'
  | 'performance_degradation'
  | 'booking_flow_failure'
  | 'payment_failure'
  | 'system_health'
  | 'conversion_rate_drop'
  | 'user_engagement_drop'
  | 'api_response_time'
  | 'resource_usage'
  | 'business_metric';

export type AlertSeverity = 'info' | 'warning' | 'critical';
export type AlertStatus = 'open' | 'acknowledged' | 'resolved' | 'suppressed';
export type NotificationChannel = 'email' | 'slack' | 'webhook' | 'sentry' | 'dashboard';

export interface AlertCondition {
  metric: string;
  operator: 'gt' | 'lt' | 'eq' | 'gte' | 'lte' | 'ne';
  aggregation: 'avg' | 'sum' | 'count' | 'max' | 'min';
  evaluationWindow: number; // minutes
}

export interface AlertContext {
  currentValue: number;
  threshold: number;
  previousValue?: number;
  trend?: 'increasing' | 'decreasing' | 'stable';
  affectedUsers?: number;
  businessImpact?: string;
  recommendedActions?: string[];
}

class AlertingService {
  private static instance: AlertingService;
  private supabase: any;
  private rules: Map<string, AlertRule> = new Map();
  private activeAlerts: Map<string, Alert> = new Map();
  private lastEvaluations: Map<string, Date> = new Map();
  private isRunning = false;
  private evaluationInterval?: NodeJS.Timeout;

  constructor() {
    this.supabase = createClient(
      import.meta.env.VITE_SUPABASE_URL!,
      import.meta.env.VITE_SUPABASE_ANON_KEY!
    );
    this.initializeDefaultRules();
  }

  static getInstance(): AlertingService {
    if (!AlertingService.instance) {
      AlertingService.instance = new AlertingService();
    }
    return AlertingService.instance;
  }

  /**
   * Initialize default alerting rules
   */
  private initializeDefaultRules() {
    const defaultRules: AlertRule[] = [
      {
        id: 'error-rate-high',
        name: 'High Error Rate',
        description: 'Alert when error rate exceeds threshold',
        type: 'error_rate',
        severity: 'critical',
        condition: {
          metric: 'error_count',
          operator: 'gt',
          aggregation: 'count',
          evaluationWindow: 5,
        },
        threshold: 10,
        timeWindow: 5,
        enabled: true,
        cooldown: 15,
        notifications: ['email', 'slack', 'sentry'],
        tags: { team: 'engineering', category: 'stability' },
      },
      {
        id: 'performance-degradation',
        name: 'Performance Degradation',
        description: 'Alert when page load times are poor',
        type: 'performance_degradation',
        severity: 'warning',
        condition: {
          metric: 'lcp_ms',
          operator: 'gt',
          aggregation: 'avg',
          evaluationWindow: 10,
        },
        threshold: 3000,
        timeWindow: 10,
        enabled: true,
        cooldown: 30,
        notifications: ['email', 'slack'],
        tags: { team: 'engineering', category: 'performance' },
      },
      {
        id: 'booking-flow-failure',
        name: 'Booking Flow Failure',
        description: 'Alert when booking conversion rate drops',
        type: 'booking_flow_failure',
        severity: 'critical',
        condition: {
          metric: 'booking_conversion_rate',
          operator: 'lt',
          aggregation: 'avg',
          evaluationWindow: 30,
        },
        threshold: 0.5, // 50% conversion rate
        timeWindow: 30,
        enabled: true,
        cooldown: 60,
        notifications: ['email', 'slack', 'webhook'],
        tags: { team: 'business', category: 'revenue' },
        customMessage: 'Booking conversion rate has dropped below 50%. This may indicate issues with the booking flow or payment processing.',
      },
      {
        id: 'payment-failure-rate',
        name: 'High Payment Failure Rate',
        description: 'Alert when payment failure rate is high',
        type: 'payment_failure',
        severity: 'critical',
        condition: {
          metric: 'payment_failure_rate',
          operator: 'gt',
          aggregation: 'avg',
          evaluationWindow: 15,
        },
        threshold: 0.15, // 15% failure rate
        timeWindow: 15,
        enabled: true,
        cooldown: 30,
        notifications: ['email', 'slack', 'webhook'],
        tags: { team: 'business', category: 'revenue' },
      },
      {
        id: 'system-health-low',
        name: 'Low System Health Score',
        description: 'Alert when overall system health is poor',
        type: 'system_health',
        severity: 'warning',
        condition: {
          metric: 'health_score',
          operator: 'lt',
          aggregation: 'avg',
          evaluationWindow: 5,
        },
        threshold: 70,
        timeWindow: 5,
        enabled: true,
        cooldown: 20,
        notifications: ['email', 'dashboard'],
        tags: { team: 'engineering', category: 'stability' },
      },
      {
        id: 'api-response-time',
        name: 'Slow API Response Times',
        description: 'Alert when API response times are slow',
        type: 'api_response_time',
        severity: 'warning',
        condition: {
          metric: 'api_response_time_ms',
          operator: 'gt',
          aggregation: 'avg',
          evaluationWindow: 10,
        },
        threshold: 2000,
        timeWindow: 10,
        enabled: true,
        cooldown: 15,
        notifications: ['slack', 'dashboard'],
        tags: { team: 'engineering', category: 'performance' },
      },
      {
        id: 'conversion-rate-drop',
        name: 'Conversion Rate Drop',
        description: 'Alert when overall conversion rate drops',
        type: 'conversion_rate_drop',
        severity: 'warning',
        condition: {
          metric: 'conversion_rate',
          operator: 'lt',
          aggregation: 'avg',
          evaluationWindow: 60,
        },
        threshold: 0.02, // 2% conversion rate
        timeWindow: 60,
        enabled: true,
        cooldown: 120,
        notifications: ['email', 'slack'],
        tags: { team: 'business', category: 'growth' },
      },
      {
        id: 'user-engagement-drop',
        name: 'User Engagement Drop',
        description: 'Alert when user engagement metrics drop',
        type: 'user_engagement_drop',
        severity: 'info',
        condition: {
          metric: 'session_duration_avg',
          operator: 'lt',
          aggregation: 'avg',
          evaluationWindow: 60,
        },
        threshold: 120, // 2 minutes average session
        timeWindow: 60,
        enabled: true,
        cooldown: 180,
        notifications: ['dashboard'],
        tags: { team: 'product', category: 'engagement' },
      },
    ];

    defaultRules.forEach(rule => {
      this.rules.set(rule.id, rule);
    });
  }

  /**
   * Start alerting service
   */
  start() {
    if (this.isRunning) return;
    this.isRunning = true;

    // Evaluate rules every minute
    this.evaluationInterval = setInterval(() => {
      this.evaluateAllRules();
    }, 60000);

    console.log('Alerting service started');
  }

  /**
   * Stop alerting service
   */
  stop() {
    if (this.evaluationInterval) {
      clearInterval(this.evaluationInterval);
      this.evaluationInterval = undefined;
    }
    this.isRunning = false;
    console.log('Alerting service stopped');
  }

  /**
   * Evaluate all enabled alerting rules
   */
  private async evaluateAllRules() {
    for (const rule of this.rules.values()) {
      if (!rule.enabled) continue;

      try {
        await this.evaluateRule(rule);
      } catch (error) {
        console.error(`Failed to evaluate rule ${rule.id}:`, error);
      }
    }
  }

  /**
   * Evaluate a single alerting rule
   */
  private async evaluateRule(rule: AlertRule) {
    const now = new Date();
    const lastEvaluation = this.lastEvaluations.get(rule.id);

    // Check cooldown period
    if (lastEvaluation &&
        (now.getTime() - lastEvaluation.getTime()) < (rule.cooldown * 60 * 1000)) {
      return;
    }

    // Get metric value
    const value = await this.getMetricValue(rule);
    if (value === null) return;

    // Check if threshold is breached
    const isTriggered = this.evaluateCondition(value, rule.condition.operator, rule.threshold);

    if (isTriggered) {
      // Check if there's already an active alert for this rule
      const existingAlert = this.activeAlerts.get(rule.id);

      if (!existingAlert || existingAlert.status === 'resolved') {
        // Create new alert
        await this.triggerAlert(rule, value);
      }
    } else {
      // Resolve existing alert if condition is no longer met
      const existingAlert = this.activeAlerts.get(rule.id);
      if (existingAlert && existingAlert.status === 'open') {
        await this.resolveAlert(existingAlert.id);
      }
    }

    this.lastEvaluations.set(rule.id, now);
  }

  /**
   * Get metric value for evaluation
   */
  private async getMetricValue(rule: AlertRule): Promise<number | null> {
    try {
      switch (rule.type) {
        case 'error_rate':
          return await this.getErrorRate(rule.condition.evaluationWindow);

        case 'performance_degradation':
          return await this.getPerformanceMetric('lcp_ms', rule.condition.evaluationWindow);

        case 'booking_flow_failure':
          return await this.getBookingConversionRate(rule.condition.evaluationWindow);

        case 'payment_failure':
          return await this.getPaymentFailureRate(rule.condition.evaluationWindow);

        case 'system_health':
          return await this.getSystemHealthScore(rule.condition.evaluationWindow);

        case 'api_response_time':
          return await this.getApiResponseTime(rule.condition.evaluationWindow);

        case 'conversion_rate_drop':
          return await this.getConversionRate(rule.condition.evaluationWindow);

        case 'user_engagement_drop':
          return await this.getUserEngagementMetric(rule.condition.evaluationWindow);

        default:
          console.warn(`Unknown alert type: ${rule.type}`);
          return null;
      }
    } catch (error) {
      console.error(`Failed to get metric value for rule ${rule.id}:`, error);
      return null;
    }
  }

  /**
   * Evaluate condition
   */
  private evaluateCondition(value: number, operator: string, threshold: number): boolean {
    switch (operator) {
      case 'gt': return value > threshold;
      case 'gte': return value >= threshold;
      case 'lt': return value < threshold;
      case 'lte': return value <= threshold;
      case 'eq': return value === threshold;
      case 'ne': return value !== threshold;
      default: return false;
    }
  }

  /**
   * Trigger an alert
   */
  private async triggerAlert(rule: AlertRule, currentValue: number) {
    const alert: Alert = {
      id: crypto.randomUUID(),
      ruleId: rule.id,
      type: rule.type,
      severity: rule.severity,
      title: rule.name,
      message: rule.customMessage || this.generateAlertMessage(rule, currentValue),
      details: {
        ruleId: rule.id,
        currentValue,
        threshold: rule.threshold,
        operator: rule.condition.operator,
        evaluationWindow: rule.condition.evaluationWindow,
        timestamp: new Date().toISOString(),
      },
      status: 'open',
      triggeredAt: new Date(),
      tags: rule.tags,
    };

    // Store alert
    this.activeAlerts.set(rule.id, alert);

    // Save to database
    await this.saveAlert(alert);

    // Send notifications
    await this.sendNotifications(alert, rule.notifications);

    // Report to Sentry
    if (rule.severity === 'critical') {
      reportError(new Error(`Critical Alert: ${rule.name}`), {
        alertId: alert.id,
        currentValue,
        threshold: rule.threshold,
        details: alert.details,
      });
    } else {
      reportMessage(`Alert triggered: ${rule.name}`, 'warning', {
        alertId: alert.id,
        currentValue,
        threshold: rule.threshold,
      });
    }

    // Track alert metrics
    monitoringService.trackMetric('alert_triggered', 1, {
      alertType: rule.type,
      severity: rule.severity,
      ruleId: rule.id,
    });

    console.warn(`Alert triggered: ${rule.name} - ${alert.message}`);
  }

  /**
   * Resolve an alert
   */
  private async resolveAlert(alertId: string) {
    const alert = Array.from(this.activeAlerts.values()).find(a => a.id === alertId);
    if (!alert) return;

    alert.status = 'resolved';
    alert.resolvedAt = new Date();

    // Update in database
    await this.updateAlert(alert);

    // Send resolution notifications
    await this.sendResolutionNotification(alert);

    // Track resolution metrics
    monitoringService.trackMetric('alert_resolved', 1, {
      alertType: alert.type,
      severity: alert.severity,
      duration: alert.resolvedAt.getTime() - alert.triggeredAt.getTime(),
    });

    console.log(`Alert resolved: ${alert.title}`);
  }

  /**
   * Generate alert message
   */
  private generateAlertMessage(rule: AlertRule, currentValue: number): string {
    const operatorText = {
      'gt': 'exceeded',
      'lt': 'fell below',
      'eq': 'matched',
      'gte': 'reached or exceeded',
      'lte': 'fell below or matched',
      'ne': 'differed from',
    }[rule.condition.operator];

    return `${rule.name}: ${rule.condition.metric} ${operatorText} threshold (${currentValue} ${operatorText} ${rule.threshold})`;
  }

  /**
   * Send notifications for alert
   */
  private async sendNotifications(alert: Alert, channels: NotificationChannel[]) {
    for (const channel of channels) {
      try {
        switch (channel) {
          case 'email':
            await this.sendEmailNotification(alert);
            break;
          case 'slack':
            await this.sendSlackNotification(alert);
            break;
          case 'webhook':
            await this.sendWebhookNotification(alert);
            break;
          case 'sentry':
            // Already handled in triggerAlert
            break;
          case 'dashboard':
            // Dashboard updates happen automatically via real-time subscriptions
            break;
        }
      } catch (error) {
        console.error(`Failed to send ${channel} notification for alert ${alert.id}:`, error);
      }
    }
  }

  /**
   * Send email notification
   */
  private async sendEmailNotification(alert: Alert) {
    // This would integrate with your email service (Resend, SendGrid, etc.)
    const emailData = {
      to: getEnvVar('VITE_ADMIN_EMAIL', ['ADMIN_EMAIL']) || 'admin@mariia-hub.com',
      subject: `[${alert.severity.toUpperCase()}] ${alert.title}`,
      html: this.generateEmailTemplate(alert),
    };

    // Send via your email service
    await fetch('/api/alerts/email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(emailData),
    });
  }

  /**
   * Send Slack notification
   */
  private async sendSlackNotification(alert: Alert) {
    const slackWebhook = getEnvVar('VITE_SLACK_ALERTS_WEBHOOK', ['SLACK_ALERTS_WEBHOOK']);
    if (!slackWebhook) return;

    const color = {
      'info': '#36a64f',
      'warning': '#ff9500',
      'critical': '#ff0000',
    }[alert.severity];

    const payload = {
      attachments: [{
        color,
        title: alert.title,
        text: alert.message,
        fields: [
          { title: 'Severity', value: alert.severity, short: true },
          { title: 'Type', value: alert.type, short: true },
          { title: 'Triggered', value: alert.triggeredAt.toLocaleString(), short: true },
        ],
        footer: 'Mariia Hub Alerts',
        ts: Math.floor(alert.triggeredAt.getTime() / 1000),
      }],
    };

    await fetch(slackWebhook, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  }

  /**
   * Send webhook notification
   */
  private async sendWebhookNotification(alert: Alert) {
    const webhookUrl = getEnvVar('VITE_ALERTS_WEBHOOK_URL', ['ALERTS_WEBHOOK_URL']);
    if (!webhookUrl) return;

    await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(alert),
    });
  }

  /**
   * Send resolution notification
   */
  private async sendResolutionNotification(alert: Alert) {
    const message = `✅ Resolved: ${alert.title}`;

    // Send to Slack if webhook is configured
    await this.sendSlackNotification({
      ...alert,
      title: message,
      message: `Alert "${alert.title}" has been resolved`,
    });
  }

  /**
   * Generate email template
   */
  private generateEmailTemplate(alert: Alert): string {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: ${alert.severity === 'critical' ? '#ff4444' : alert.severity === 'warning' ? '#ffaa00' : '#44aa44'}; color: white; padding: 20px; text-align: center;">
          <h1>${alert.title}</h1>
          <p style="margin: 0; font-size: 18px;">Severity: ${alert.severity.toUpperCase()}</p>
        </div>

        <div style="padding: 20px; background: #f9f9f9;">
          <h2>Alert Details</h2>
          <p><strong>Message:</strong> ${alert.message}</p>
          <p><strong>Triggered:</strong> ${alert.triggeredAt.toLocaleString()}</p>
          <p><strong>Type:</strong> ${alert.type}</p>

          <h3>Metrics</h3>
          <table style="width: 100%; border-collapse: collapse;">
            <tr style="background: #e0e0e0;">
              <th style="padding: 8px; text-align: left;">Metric</th>
              <th style="padding: 8px; text-align: left;">Value</th>
            </tr>
            ${Object.entries(alert.details).map(([key, value]) => `
              <tr>
                <td style="padding: 8px; border-bottom: 1px solid #ddd;">${key}</td>
                <td style="padding: 8px; border-bottom: 1px solid #ddd;">${value}</td>
              </tr>
            `).join('')}
          </table>
        </div>

        <div style="padding: 20px; background: #f0f0f0; text-align: center;">
          <p style="margin: 0; color: #666;">
            This alert was generated by Mariia Hub Monitoring System
          </p>
        </div>
      </div>
    `;
  }

  // Metric collection methods
  private async getErrorRate(windowMinutes: number): Promise<number> {
    const { data } = await this.supabase
      .from('monitoring_errors')
      .select('id')
      .gte('timestamp', new Date(Date.now() - windowMinutes * 60 * 1000).toISOString());

    return data?.length || 0;
  }

  private async getPerformanceMetric(metric: string, windowMinutes: number): Promise<number> {
    const { data } = await this.supabase
      .from('monitoring_performance')
      .select(metric)
      .gte('timestamp', new Date(Date.now() - windowMinutes * 60 * 1000).toISOString());

    if (!data || data.length === 0) return 0;

    const values = data.map(d => d[metric]).filter(v => v != null);
    return values.reduce((sum, val) => sum + val, 0) / values.length;
  }

  private async getBookingConversionRate(windowMinutes: number): Promise<number> {
    const { data: sessions } = await this.supabase
      .from('monitoring_sessions')
      .select('conversion_events')
      .gte('start_time', new Date(Date.now() - windowMinutes * 60 * 1000).toISOString());

    if (!sessions || sessions.length === 0) return 0;

    const totalEvents = sessions.reduce((sum, s) => sum + (s.conversion_events || 0), 0);
    return totalEvents / sessions.length;
  }

  private async getPaymentFailureRate(windowMinutes: number): Promise<number> {
    const { data: payments } = await this.supabase
      .from('bookings')
      .select('payment_status')
      .gte('created_at', new Date(Date.now() - windowMinutes * 60 * 1000).toISOString());

    if (!payments || payments.length === 0) return 0;

    const failed = payments.filter(p => p.payment_status === 'failed').length;
    return failed / payments.length;
  }

  private async getSystemHealthScore(windowMinutes: number): Promise<number> {
    const { data } = await this.supabase
      .from('monitoring_health_checks')
      .select('score')
      .gte('timestamp', new Date(Date.now() - windowMinutes * 60 * 1000).toISOString());

    if (!data || data.length === 0) return 100;

    return data.reduce((sum, d) => sum + d.score, 0) / data.length;
  }

  private async getApiResponseTime(windowMinutes: number): Promise<number> {
    const { data } = await this.supabase
      .from('monitoring_api_performance')
      .select('response_time_ms')
      .gte('timestamp', new Date(Date.now() - windowMinutes * 60 * 1000).toISOString());

    if (!data || data.length === 0) return 0;

    return data.reduce((sum, d) => sum + d.response_time_ms, 0) / data.length;
  }

  private async getConversionRate(windowMinutes: number): Promise<number> {
    const { data: sessions } = await this.supabase
      .from('monitoring_sessions')
      .select('conversion_events, events_count')
      .gte('start_time', new Date(Date.now() - windowMinutes * 60 * 1000).toISOString());

    if (!sessions || sessions.length === 0) return 0;

    const totalConversions = sessions.reduce((sum, s) => sum + (s.conversion_events || 0), 0);
    const totalEvents = sessions.reduce((sum, s) => sum + (s.events_count || 0), 0);

    return totalEvents > 0 ? totalConversions / totalEvents : 0;
  }

  private async getUserEngagementMetric(windowMinutes: number): Promise<number> {
    const { data } = await this.supabase
      .from('monitoring_sessions')
      .select('duration_seconds')
      .gte('start_time', new Date(Date.now() - windowMinutes * 60 * 1000).toISOString());

    if (!data || data.length === 0) return 0;

    return data.reduce((sum, d) => sum + (d.duration_seconds || 0), 0) / data.length;
  }

  /**
   * Save alert to database
   */
  private async saveAlert(alert: Alert) {
    await this.supabase.from('monitoring_alerts').insert({
      alert_type: alert.type,
      severity: alert.severity,
      title: alert.title,
      description: alert.message,
      details: alert.details,
      status: alert.status,
      triggered_at: alert.triggeredAt.toISOString(),
      environment: import.meta.env.MODE,
    });
  }

  /**
   * Update alert in database
   */
  private async updateAlert(alert: Alert) {
    await this.supabase
      .from('monitoring_alerts')
      .update({
        status: alert.status,
        resolved_at: alert.resolvedAt?.toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('title', alert.title) // Using title as a temporary identifier
      .eq('triggered_at', alert.triggeredAt.toISOString());
  }

  /**
   * Get active alerts
   */
  getActiveAlerts(): Alert[] {
    return Array.from(this.activeAlerts.values()).filter(alert => alert.status === 'open');
  }

  /**
   * Get alert rule
   */
  getRule(ruleId: string): AlertRule | undefined {
    return this.rules.get(ruleId);
  }

  /**
   * Update alert rule
   */
  updateRule(rule: AlertRule) {
    this.rules.set(rule.id, rule);
  }

  /**
   * Acknowledge alert
   */
  async acknowledgeAlert(alertId: string, userId: string) {
    const alert = Array.from(this.activeAlerts.values()).find(a => a.id === alertId);
    if (!alert) return;

    alert.status = 'acknowledged';
    alert.acknowledgedAt = new Date();
    alert.acknowledgedBy = userId;

    await this.updateAlert(alert);
    monitoringService.trackMetric('alert_acknowledged', 1, {
      alertType: alert.type,
      severity: alert.severity,
    });
  }

  /**
   * Manual alert trigger for testing
   */
  async triggerManualAlert(ruleId: string) {
    const rule = this.rules.get(ruleId);
    if (!rule) throw new Error(`Rule ${ruleId} not found`);

    await this.triggerAlert(rule, rule.threshold + 1);
  }
}

// Export singleton instance
export const alertingService = AlertingService.getInstance();

// Export convenience functions
export const startAlerting = () => alertingService.start();
export const stopAlerting = () => alertingService.stop();
export const getActiveAlerts = () => alertingService.getActiveAlerts();
export const acknowledgeAlert = (alertId: string, userId: string) => alertingService.acknowledgeAlert(alertId, userId);
