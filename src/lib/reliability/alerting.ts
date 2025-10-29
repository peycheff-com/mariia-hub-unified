import { supabase } from '@/integrations/supabase/client';
import { getEnvVar } from '@/lib/runtime-env';

import { AlertRule, Alert, EscalationPolicy, EscalationRule , HealthScore, HealthCheckResult } from './types';

interface AlertContext {
  healthScore?: HealthScore;
  healthCheck?: HealthCheckResult;
  metrics?: Record<string, number>;
  timestamp: string;
}

interface NotificationChannel {
  id: string;
  name: string;
  type: 'email' | 'slack' | 'webhook' | 'sms';
  config: Record<string, any>;
  enabled: boolean;
}

export class AlertingSystem {
  private supabase = createClient();
  private rules: Map<string, AlertRule> = new Map();
  private activeAlerts: Map<string, Alert> = new Map();
  private escalationPolicies: Map<string, EscalationPolicy> = new Map();
  private notificationChannels: Map<string, NotificationChannel> = new Map();
  private evaluationInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.initializeDefaultRules();
    this.initializeEscalationPolicies();
    this.initializeNotificationChannels();
  }

  private initializeDefaultRules() {
    // Overall health score alerts
    this.addRule({
      id: 'health-score-low',
      name: 'Overall Health Score Low',
      condition: 'healthScore.overall < 70',
      threshold: 70,
      severity: 'high',
      enabled: true,
      tags: ['health', 'critical']
    });

    // Critical service down
    this.addRule({
      id: 'critical-service-down',
      name: 'Critical Service Down',
      condition: 'healthCheck.status === "unhealthy"',
      threshold: 0,
      severity: 'critical',
      enabled: true,
      tags: ['health', 'critical', 'service']
    });

    // Database connection issues
    this.addRule({
      id: 'database-unavailable',
      name: 'Database Connection Lost',
      condition: 'database.status === "fail"',
      threshold: 1,
      severity: 'critical',
      enabled: true,
      tags: ['database', 'critical']
    });

    // Memory usage high
    this.addRule({
      id: 'memory-usage-high',
      name: 'Memory Usage Too High',
      condition: 'memory.details.usagePercent > 90',
      threshold: 90,
      severity: 'medium',
      enabled: true,
      tags: ['memory', 'performance']
    });

    // Response time alerts
    this.addRule({
      id: 'response-time-high',
      name: 'High Response Time',
      condition: 'averageResponseTime > 2000',
      threshold: 2000,
      severity: 'medium',
      enabled: true,
      tags: ['performance', 'latency']
    });

    // Error rate alerts
    this.addRule({
      id: 'error-rate-high',
      name: 'High Error Rate',
      condition: 'errorRate > 5',
      threshold: 5,
      severity: 'high',
      enabled: true,
      tags: ['errors', 'critical']
    });

    // Dependency unavailable
    this.addRule({
      id: 'dependency-down',
      name: 'External Dependency Unavailable',
      condition: 'dependency.status === "unhealthy" && dependency.critical',
      threshold: 1,
      severity: 'high',
      enabled: true,
      tags: ['dependencies', 'external']
    });

    // Recovery action failed
    this.addRule({
      id: 'recovery-failed',
      name: 'Automated Recovery Failed',
      condition: 'recoveryAttempts.failed >= 3',
      threshold: 3,
      severity: 'medium',
      enabled: true,
      tags: ['recovery', 'automation']
    });

    // SLO breach warning
    this.addRule({
      id: 'slo-breach-warning',
      name: 'SLO At Risk of Breach',
      condition: 'errorBudget.remaining < 20',
      threshold: 20,
      severity: 'high',
      enabled: true,
      tags: ['slo', 'error-budget']
    });
  }

  private initializeEscalationPolicies() {
    // Critical severity escalation
    this.addEscalationPolicy({
      id: 'critical-escalation',
      name: 'Critical Alert Escalation',
      rules: [
        {
          delay: 0,
          action: 'notify',
          target: 'oncall-critical',
          conditions: {}
        },
        {
          delay: 5,
          action: 'notify',
          target: 'team-lead',
          conditions: {}
        },
        {
          delay: 15,
          action: 'escalate',
          target: 'engineering-manager',
          conditions: {}
        },
        {
          delay: 30,
          action: 'suppress',
          target: 'auto-resolve',
          conditions: { maxDuration: 60 }
        }
      ]
    });

    // High severity escalation
    this.addEscalationPolicy({
      id: 'high-escalation',
      name: 'High Severity Escalation',
      rules: [
        {
          delay: 0,
          action: 'notify',
          target: 'oncall-high',
          conditions: {}
        },
        {
          delay: 15,
          action: 'notify',
          target: 'team-lead',
          conditions: {}
        },
        {
          delay: 45,
          action: 'escalate',
          target: 'engineering-manager',
          conditions: {}
        }
      ]
    });

    // Medium severity escalation
    this.addEscalationPolicy({
      id: 'medium-escalation',
      name: 'Medium Severity Escalation',
      rules: [
        {
          delay: 0,
          action: 'notify',
          target: 'slack-alerts',
          conditions: {}
        },
        {
          delay: 30,
          action: 'notify',
          target: 'team-lead',
          conditions: {}
        }
      ]
    });

    // Low severity escalation
    this.addEscalationPolicy({
      id: 'low-escalation',
      name: 'Low Severity Escalation',
      rules: [
        {
          delay: 0,
          action: 'notify',
          target: 'email-digest',
          conditions: {}
        }
      ]
    });
  }

  private initializeNotificationChannels() {
    // Email channel
    this.addNotificationChannel({
      id: 'email-alerts',
      name: 'Email Alerts',
      type: 'email',
      config: {
        recipients: ['alerts@example.com'],
        template: 'alert'
      },
      enabled: true
    });

    // Slack channel
    this.addNotificationChannel({
      id: 'slack-alerts',
      name: 'Slack Alerts',
      type: 'slack',
      config: {
        webhook: getEnvVar('SLACK_WEBHOOK_URL', ['VITE_SLACK_WEBHOOK_URL']),
        channel: '#alerts'
      },
      enabled: true
    });

    // PagerDuty channel
    this.addNotificationChannel({
      id: 'pagerduty',
      name: 'PagerDuty',
      type: 'webhook',
      config: {
        webhook: getEnvVar('PAGERDUTY_WEBHOOK_URL', ['VITE_PAGERDUTY_WEBHOOK_URL']),
        serviceKey: getEnvVar('PAGERDUTY_SERVICE_KEY', ['VITE_PAGERDUTY_SERVICE_KEY'])
      },
      enabled: true
    });

    // SMS channel for critical
    this.addNotificationChannel({
      id: 'sms-critical',
      name: 'SMS Critical',
      type: 'sms',
      config: {
        recipients: ['+1234567890'],
        provider: 'twilio'
      },
      enabled: true
    });
  }

  addRule(rule: AlertRule) {
    this.rules.set(rule.id, rule);
  }

  addEscalationPolicy(policy: EscalationPolicy) {
    this.escalationPolicies.set(policy.id, policy);
  }

  addNotificationChannel(channel: NotificationChannel) {
    this.notificationChannels.set(channel.id, channel);
  }

  async evaluateRules(context: AlertContext): Promise<Alert[]> {
    const newAlerts: Alert[] = [];

    for (const [ruleId, rule] of this.rules) {
      if (!rule.enabled) continue;

      // Check if alert already exists for this rule
      if (this.activeAlerts.has(ruleId)) continue;

      // Evaluate condition
      if (this.evaluateCondition(rule.condition, context)) {
        const alert = await this.createAlert(rule, context);
        newAlerts.push(alert);
        this.activeAlerts.set(ruleId, alert);
      }
    }

    // Check for resolved alerts
    await this.checkResolvedAlerts(context);

    return newAlerts;
  }

  private evaluateCondition(condition: string, context: AlertContext): boolean {
    try {
      // Simplified condition evaluation
      // In production, use a proper expression parser

      if (condition.includes('healthScore.overall <')) {
        const threshold = parseInt(condition.match(/< (\d+)/)?.[1] || '0');
        return context.healthScore?.overall ? context.healthScore.overall < threshold : false;
      }

      if (condition.includes('healthCheck.status === "unhealthy"')) {
        return context.healthCheck?.status === 'unhealthy';
      }

      if (condition.includes('database.status === "fail"')) {
        const dbCheck = context.healthCheck?.checks?.find(c => c.name === 'database');
        return dbCheck?.status === 'fail';
      }

      if (condition.includes('memory.details.usagePercent >')) {
        const threshold = parseInt(condition.match(/> (\d+)/)?.[1] || '0');
        const memCheck = context.healthCheck?.checks?.find(c => c.name === 'memory');
        return memCheck?.details?.usagePercent ? memCheck.details.usagePercent > threshold : false;
      }

      if (condition.includes('errorRate >')) {
        const threshold = parseInt(condition.match(/> (\d+)/)?.[1] || '0');
        return context.metrics?.errorRate ? context.metrics.errorRate > threshold : false;
      }

      return false;
    } catch {
      return false;
    }
  }

  private async createAlert(rule: AlertRule, context: AlertContext): Promise<Alert> {
    const alert: Alert = {
      id: `alert-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      ruleId: rule.id,
      severity: rule.severity,
      status: 'open',
      message: this.generateAlertMessage(rule, context),
      timestamp: context.timestamp,
      enrichment: this.enrichAlert(rule, context)
    };

    // Store in database
    await this.storeAlert(alert);

    // Trigger notifications
    await this.triggerNotifications(alert);

    // Start escalation
    this.startEscalation(alert, rule);

    return alert;
  }

  private generateAlertMessage(rule: AlertRule, context: AlertContext): string {
    switch (rule.id) {
      case 'health-score-low':
        return `Overall health score is ${context.healthScore?.overall} (threshold: ${rule.threshold})`;
      case 'database-unavailable':
        return 'Database connection is failing';
      case 'memory-usage-high':
        return `Memory usage is critically high`;
      case 'critical-service-down':
        return 'A critical service is down';
      default:
        return `Alert triggered: ${rule.name}`;
    }
  }

  private enrichAlert(rule: AlertRule, context: AlertContext): Record<string, any> {
    return {
      ruleName: rule.name,
      tags: rule.tags,
      healthScore: context.healthScore?.overall,
      healthStatus: context.healthCheck?.status,
      affectedComponents: this.getAffectedComponents(context),
      metrics: context.metrics,
      timestamp: context.timestamp,
      incidentUrl: `/incidents/${rule.id}`
    };
  }

  private getAffectedComponents(context: AlertContext): string[] {
    const components: string[] = [];

    if (context.healthCheck?.checks) {
      context.healthCheck.checks
        .filter(check => check.status !== 'pass')
        .forEach(check => components.push(check.name));
    }

    return components;
  }

  private async storeAlert(alert: Alert) {
    try {
      await this.supabase
        .from('alerts')
        .insert({
          id: alert.id,
          rule_id: alert.ruleId,
          severity: alert.severity,
          status: alert.status,
          message: alert.message,
          enrichment: alert.enrichment,
          timestamp: alert.timestamp
        });
    } catch (error) {
      console.error('Failed to store alert:', error);
    }
  }

  private async triggerNotifications(alert: Alert) {
    const policy = this.getEscalationPolicy(alert.severity);
    if (!policy) return;

    const firstRule = policy.rules[0];
    if (firstRule.action === 'notify') {
      await this.sendNotification(alert, firstRule.target);
    }
  }

  private startEscalation(alert: Alert, rule: AlertRule) {
    const policy = this.getEscalationPolicy(alert.severity);
    if (!policy) return;

    policy.rules.forEach(escalationRule => {
      if (escalationRule.delay > 0) {
        setTimeout(async () => {
          const currentAlert = this.activeAlerts.get(rule.id);
          if (currentAlert && currentAlert.status === 'open') {
            await this.escalateAlert(currentAlert, escalationRule);
          }
        }, escalationRule.delay * 60 * 1000); // Convert minutes to milliseconds
      }
    });
  }

  private async escalateAlert(alert: Alert, rule: EscalationRule) {
    switch (rule.action) {
      case 'notify':
        await this.sendNotification(alert, rule.target);
        break;
      case 'escalate':
        await this.sendEscalation(alert, rule.target);
        break;
      case 'suppress':
        await this.suppressAlert(alert, rule.conditions.maxDuration);
        break;
    }
  }

  private async sendNotification(alert: Alert, target: string) {
    const channel = this.notificationChannels.get(target);
    if (!channel || !channel.enabled) return;

    try {
      switch (channel.type) {
        case 'email':
          await this.sendEmailNotification(alert, channel);
          break;
        case 'slack':
          await this.sendSlackNotification(alert, channel);
          break;
        case 'webhook':
          await this.sendWebhookNotification(alert, channel);
          break;
        case 'sms':
          await this.sendSMSNotification(alert, channel);
          break;
      }
    } catch (error) {
      console.error(`Failed to send ${channel.type} notification:`, error);
    }
  }

  private async sendEmailNotification(alert: Alert, channel: NotificationChannel) {
    // Implement email notification
    console.log(`Email notification for alert ${alert.id}: ${alert.message}`);
  }

  private async sendSlackNotification(alert: Alert, channel: NotificationChannel) {
    // Implement Slack notification
    const webhook = channel.config.webhook;
    const payload = {
      text: `🚨 ${alert.severity.toUpperCase()} Alert`,
      attachments: [{
        color: this.getAlertColor(alert.severity),
        fields: [
          { title: 'Message', value: alert.message, short: false },
          { title: 'Severity', value: alert.severity, short: true },
          { title: 'Time', value: new Date(alert.timestamp).toLocaleString(), short: true }
        ],
        actions: [{
          type: 'button',
          text: 'Acknowledge',
          url: `/alerts/${alert.id}/acknowledge`
        }, {
          type: 'button',
          text: 'View Details',
          url: `/alerts/${alert.id}`
        }]
      }]
    };

    await fetch(webhook, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
  }

  private async sendWebhookNotification(alert: Alert, channel: NotificationChannel) {
    // Implement webhook notification
    await fetch(channel.config.webhook, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        alert,
        channel: channel.id
      })
    });
  }

  private async sendSMSNotification(alert: Alert, channel: NotificationChannel) {
    // Implement SMS notification
    console.log(`SMS notification for critical alert ${alert.id}: ${alert.message}`);
  }

  private async sendEscalation(alert: Alert, target: string) {
    // Implement escalation logic
    console.log(`Escalating alert ${alert.id} to ${target}`);
  }

  private async suppressAlert(alert: Alert, maxDuration: number) {
    // Implement alert suppression
    console.log(`Suppressing alert ${alert.id} for ${maxDuration} minutes`);
  }

  private getAlertColor(severity: string): string {
    switch (severity) {
      case 'critical': return 'danger';
      case 'high': return 'warning';
      case 'medium': return 'warning';
      case 'low': return 'good';
      default: return 'warning';
    }
  }

  private getEscalationPolicy(severity: string): EscalationPolicy | undefined {
    switch (severity) {
      case 'critical': return this.escalationPolicies.get('critical-escalation');
      case 'high': return this.escalationPolicies.get('high-escalation');
      case 'medium': return this.escalationPolicies.get('medium-escalation');
      case 'low': return this.escalationPolicies.get('low-escalation');
      default: return undefined;
    }
  }

  private async checkResolvedAlerts(context: AlertContext) {
    const resolvedAlerts: string[] = [];

    for (const [ruleId, alert] of this.activeAlerts) {
      const rule = this.rules.get(ruleId);
      if (!rule) continue;

      // Check if condition is still true
      if (!this.evaluateCondition(rule.condition, context)) {
        alert.status = 'resolved';
        alert.resolvedAt = new Date().toISOString();
        resolvedAlerts.push(ruleId);

        // Update in database
        await this.updateAlert(alert);

        // Send resolution notification
        await this.sendResolutionNotification(alert);
      }
    }

    // Remove resolved alerts from active
    resolvedAlerts.forEach(ruleId => {
      this.activeAlerts.delete(ruleId);
    });
  }

  private async updateAlert(alert: Alert) {
    try {
      await this.supabase
        .from('alerts')
        .update({
          status: alert.status,
          resolved_at: alert.resolvedAt
        })
        .eq('id', alert.id);
    } catch (error) {
      console.error('Failed to update alert:', error);
    }
  }

  private async sendResolutionNotification(alert: Alert) {
    // Send notification that alert has been resolved
    console.log(`Alert ${alert.id} has been resolved`);
  }

  async acknowledgeAlert(alertId: string, userId: string) {
    const alert = Array.from(this.activeAlerts.values())
      .find(a => a.id === alertId);

    if (alert) {
      alert.status = 'acknowledged';
      alert.acknowledgedBy = userId;
      await this.updateAlert(alert);
    }
  }

  getActiveAlerts(): Alert[] {
    return Array.from(this.activeAlerts.values());
  }

  startEvaluation() {
    if (this.evaluationInterval) return;

    this.evaluationInterval = setInterval(async () => {
      // This would be called with actual health data
      // For now, just a placeholder
      console.log('Evaluating alert rules...');
    }, 60000); // Evaluate every minute
  }

  stopEvaluation() {
    if (this.evaluationInterval) {
      clearInterval(this.evaluationInterval);
      this.evaluationInterval = null;
    }
  }

  async getAlertStats(hours: number = 24): Promise<{
    total: number;
    bySeverity: Record<string, number>;
    resolutionTime: number;
    mtta: number; // Mean time to acknowledge
    mttr: number; // Mean time to resolve
  }> {
    try {
      const since = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();

      const { data, error } = await this.supabase
        .from('alerts')
        .select('*')
        .gte('timestamp', since);

      if (error) throw error;

      const alerts = data || [];
      const total = alerts.length;
      const bySeverity = alerts.reduce((acc, alert) => {
        acc[alert.severity] = (acc[alert.severity] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      // Calculate metrics
      const resolvedAlerts = alerts.filter(a => a.status === 'resolved');
      const resolutionTimes = resolvedAlerts.map(a => {
        if (a.resolved_at) {
          return new Date(a.resolved_at).getTime() - new Date(a.timestamp).getTime();
        }
        return 0;
      }).filter(t => t > 0);

      const avgResolutionTime = resolutionTimes.length > 0
        ? resolutionTimes.reduce((a, b) => a + b, 0) / resolutionTimes.length / 60000 // minutes
        : 0;

      return {
        total,
        bySeverity,
        resolutionTime: avgResolutionTime,
        mtta: avgResolutionTime * 0.1, // Simplified
        mttr: avgResolutionTime
      };
    } catch (error) {
      console.error('Failed to get alert stats:', error);
      return {
        total: 0,
        bySeverity: {},
        resolutionTime: 0,
        mtta: 0,
        mttr: 0
      };
    }
  }
}

export const alertingSystem = new AlertingSystem();
