// Real-Time Feedback Monitoring and Alert System
// For luxury beauty/fitness platform instant feedback processing

import { supabase } from '@/integrations/supabase/client';
import type {
  SatisfactionAlert,
  AlertSeverity,
  AlertType,
  AlertStatus,
  AlertRecipient,
  SatisfactionMetric,
  SentimentAnalysis,
  ServiceRecoveryCase,
  NPSMeasurement,
  ClientSatisfactionPrediction
} from '@/types/feedback';

export interface MonitoringConfig {
  alertThresholds: {
    lowScoreThreshold: number;
    negativeSentimentThreshold: number;
    multipleComplaintsThreshold: number;
    trendDeclineThreshold: number;
    staffPerformanceThreshold: number;
  };
  monitoringIntervals: {
    realTimeChecks: number; // seconds
    batchProcessing: number; // minutes
    dailyReport: string; // time of day
  };
  notificationChannels: {
    email: boolean;
    sms: boolean;
    inApp: boolean;
    push: boolean;
    webhook: boolean;
  };
  escalationRules: {
    criticalAlertEscalation: number; // minutes
    unassignedAlertTimeout: number; // minutes
    executiveAlertThreshold: number; // severity level
  };
}

export interface AlertRule {
  id: string;
  name: string;
  description: string;
  type: AlertType;
  severity: AlertSeverity;
  conditions: AlertCondition[];
  actions: AlertAction[];
  isActive: boolean;
  cooldownPeriod: number; // minutes
  lastTriggered?: string;
}

export interface AlertCondition {
  metric: string;
  operator: 'greater_than' | 'less_than' | 'equals' | 'not_equals' | 'contains' | 'trend_decline' | 'spike_detected';
  value: any;
  timeWindow?: number; // minutes
  aggregation?: 'avg' | 'sum' | 'count' | 'min' | 'max';
}

export interface AlertAction {
  type: 'create_alert' | 'send_notification' | 'trigger_workflow' | 'escalate' | 'auto_resolve';
  config: Record<string, any>;
  delay?: number; // minutes
}

export interface RealTimeMetrics {
  timestamp: string;
  currentSatisfactionScore: number;
  todaySubmissions: number;
  activeAlerts: number;
  pendingRecoveryCases: number;
  averageResponseTime: number;
  currentTrend: 'improving' | 'stable' | 'declining';
  volumeRate: number; // submissions per hour
  sentimentRatio: {
    positive: number;
    negative: number;
    neutral: number;
  };
}

export interface AlertContext {
  clientInfo?: {
    id: string;
    name: string;
    vipStatus: boolean;
    lifetimeValue: number;
    recentBookings: number;
  };
  serviceInfo?: {
    id: string;
    name: string;
    type: string;
    price: number;
    popularity: number;
  };
  staffInfo?: {
    id: string;
    name: string;
    role: string;
    performance: number;
    recentFeedback: number;
  };
  historicalContext?: {
    previousScores: number[];
    trendDirection: 'up' | 'down' | 'stable';
    seasonality: string;
  };
}

export class RealTimeFeedbackMonitoring {
  private config: MonitoringConfig;
  private alertRules: Map<string, AlertRule> = new Map();
  private isMonitoring: boolean = false;
  private monitoringInterval?: NodeJS.Timeout;
  private batchProcessingInterval?: NodeJS.Timeout;
  private alertCooldowns: Map<string, number> = new Map();

  constructor(config?: Partial<MonitoringConfig>) {
    this.config = {
      alertThresholds: {
        lowScoreThreshold: 2.5,
        negativeSentimentThreshold: -0.5,
        multipleComplaintsThreshold: 3,
        trendDeclineThreshold: 10, // percentage
        staffPerformanceThreshold: 3.0
      },
      monitoringIntervals: {
        realTimeChecks: 30, // seconds
        batchProcessing: 5, // minutes
        dailyReport: '09:00'
      },
      notificationChannels: {
        email: true,
        sms: false,
        inApp: true,
        push: true,
        webhook: true
      },
      escalationRules: {
        criticalAlertEscalation: 15, // minutes
        unassignedAlertTimeout: 30, // minutes
        executiveAlertThreshold: 3 // critical and emergency
      },
      ...config
    };

    this.initializeDefaultAlertRules();
  }

  // ========================================
  // MONITORING CONTROL
  // ========================================

  /**
   * Start real-time monitoring
   */
  async startMonitoring(): Promise<void> {
    if (this.isMonitoring) {
      console.log('Monitoring is already active');
      return;
    }

    console.log('Starting real-time feedback monitoring...');
    this.isMonitoring = true;

    // Start real-time checks
    this.monitoringInterval = setInterval(() => {
      this.performRealTimeChecks();
    }, this.config.monitoringIntervals.realTimeChecks * 1000);

    // Start batch processing
    this.batchProcessingInterval = setInterval(() => {
      this.performBatchProcessing();
    }, this.config.monitoringIntervals.batchProcessing * 60 * 1000);

    // Set up database listeners for real-time updates
    this.setupDatabaseListeners();

    // Initial processing
    await this.performRealTimeChecks();
    await this.performBatchProcessing();

    console.log('Real-time feedback monitoring started successfully');
  }

  /**
   * Stop monitoring
   */
  stopMonitoring(): void {
    if (!this.isMonitoring) {
      console.log('Monitoring is not active');
      return;
    }

    console.log('Stopping real-time feedback monitoring...');
    this.isMonitoring = false;

    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = undefined;
    }

    if (this.batchProcessingInterval) {
      clearInterval(this.batchProcessingInterval);
      this.batchProcessingInterval = undefined;
    }

    console.log('Real-time feedback monitoring stopped');
  }

  /**
   * Set up database listeners for real-time updates
   */
  private setupDatabaseListeners(): void {
    // Listen for new feedback submissions
    supabase
      .channel('feedback_submissions')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'feedback_submissions',
          filter: 'is_complete=eq.true'
        },
        (payload) => {
          this.handleNewSubmission(payload.new);
        }
      )
      .subscribe();

    // Listen for new sentiment analysis
    supabase
      .channel('sentiment_analysis')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'sentiment_analysis'
        },
        (payload) => {
          this.handleNewSentimentAnalysis(payload.new);
        }
      )
      .subscribe();

    // Listen for low satisfaction metrics
    supabase
      .channel('satisfaction_metrics')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'satisfaction_metrics'
        },
        (payload) => {
          this.handleNewSatisfactionMetric(payload.new);
        }
      )
      .subscribe();
  }

  // ========================================
  // REAL-TIME CHECKS
  // ========================================

  /**
   * Perform real-time checks on new data
   */
  private async performRealTimeChecks(): Promise<void> {
    try {
      // Check for recent low scores
      await this.checkRecentLowScores();

      // Check for negative sentiment spikes
      await this.checkNegativeSentimentSpikes();

      // Check for unassigned critical alerts
      await this.checkUnassignedCriticalAlerts();

      // Update real-time metrics
      await this.updateRealTimeMetrics();
    } catch (error) {
      console.error('Error in real-time checks:', error);
    }
  }

  /**
   * Check for recent low satisfaction scores
   */
  private async checkRecentLowScores(): Promise<void> {
    try {
      const { data: recentMetrics, error } = await supabase
        .from('satisfaction_metrics')
        .select('*')
        .gte('measurement_date', new Date(Date.now() - 5 * 60 * 1000).toISOString()) // Last 5 minutes
        .lte('score', this.config.alertThresholds.lowScoreThreshold);

      if (error || !recentMetrics || recentMetrics.length === 0) return;

      for (const metric of recentMetrics) {
        const ruleKey = `low_score_${metric.client_id}_${metric.service_id}`;

        if (!this.isInCooldown(ruleKey)) {
          await this.triggerLowScoreAlert(metric);
          this.setCooldown(ruleKey, 15); // 15 minutes cooldown
        }
      }
    } catch (error) {
      console.error('Error checking recent low scores:', error);
    }
  }

  /**
   * Check for negative sentiment spikes
   */
  private async checkNegativeSentimentSpikes(): Promise<void> {
    try {
      const { data: recentSentiments, error } = await supabase
        .from('sentiment_analysis')
        .select('*')
        .gte('processed_at', new Date(Date.now() - 10 * 60 * 1000).toISOString()) // Last 10 minutes
        .lte('sentiment_score', this.config.alertThresholds.negativeSentimentThreshold);

      if (error || !recentSentiments || recentSentiments.length === 0) return;

      // Group by client to detect multiple negative sentiments
      const clientSentiments: Record<string, typeof recentSentiments> = {};
      recentSentiments.forEach(sentiment => {
        const clientId = this.extractClientIdFromSource(sentiment);
        if (clientId) {
          if (!clientSentiments[clientId]) {
            clientSentiments[clientId] = [];
          }
          clientSentiments[clientId].push(sentiment);
        }
      });

      for (const [clientId, sentiments] of Object.entries(clientSentiments)) {
        if (sentiments.length >= 2) {
          const ruleKey = `negative_sentiment_spike_${clientId}`;

          if (!this.isInCooldown(ruleKey)) {
            await this.triggerNegativeSentimentAlert(clientId, sentiments);
            this.setCooldown(ruleKey, 30); // 30 minutes cooldown
          }
        }
      }
    } catch (error) {
      console.error('Error checking negative sentiment spikes:', error);
    }
  }

  /**
   * Check for unassigned critical alerts
   */
  private async checkUnassignedCriticalAlerts(): Promise<void> {
    try {
      const { data: unassignedAlerts, error } = await supabase
        .from('satisfaction_alerts')
        .select('*')
        .eq('alert_status', 'active')
        .in('severity', ['critical', 'emergency'])
        .is('assigned_to', null)
        .gte('created_at', new Date(Date.now() - this.config.escalationRules.unassignedAlertTimeout * 60 * 1000).toISOString());

      if (error || !unassignedAlerts || unassignedAlerts.length === 0) return;

      for (const alert of unassignedAlerts) {
        await this.escalateUnassignedAlert(alert);
      }
    } catch (error) {
      console.error('Error checking unassigned critical alerts:', error);
    }
  }

  // ========================================
  // BATCH PROCESSING
  // ========================================

  /**
   * Perform batch processing for analytics and trends
   */
  private async performBatchProcessing(): Promise<void> {
    try {
      // Analyze satisfaction trends
      await this.analyzeSatisfactionTrends();

      // Check for multiple complaints from same client
      await this.checkMultipleComplaints();

      // Check staff performance issues
      await this.checkStaffPerformanceIssues();

      // Generate and send daily summary if needed
      await this.checkDailySummary();

      // Clean up old resolved alerts
      await this.cleanupOldAlerts();
    } catch (error) {
      console.error('Error in batch processing:', error);
    }
  }

  /**
   * Analyze satisfaction trends
   */
  private async analyzeSatisfactionTrends(): Promise<void> {
    try {
      const { data: recentData, error } = await supabase
        .from('satisfaction_metrics')
        .select('measurement_date, score')
        .gte('measurement_date', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()) // Last 24 hours
        .order('measurement_date', { ascending: true });

      if (error || !recentData || recentData.length < 10) return;

      // Calculate hourly averages
      const hourlyData: Record<string, number[]> = {};
      recentData.forEach(metric => {
        const hour = new Date(metric.measurement_date).getHours();
        if (!hourlyData[hour]) hourlyData[hour] = [];
        hourlyData[hour].push(metric.score);
      });

      const hours = Object.keys(hourlyData).sort();
      if (hours.length < 4) return; // Need at least 4 hours of data

      // Calculate trend
      const recentHours = hours.slice(-4);
      const scores = recentHours.map(hour =>
        hourlyData[hour].reduce((sum, score) => sum + score, 0) / hourlyData[hour].length
      );

      const trend = this.calculateTrend(scores);

      if (trend.percentage <= -this.config.alertThresholds.trendDeclineThreshold) {
        await this.triggerTrendDeclineAlert(trend);
      }
    } catch (error) {
      console.error('Error analyzing satisfaction trends:', error);
    }
  }

  /**
   * Check for multiple complaints from same client
   */
  private async checkMultipleComplaints(): Promise<void> {
    try {
      const { data: recentSubmissions, error } = await supabase
        .from('feedback_submissions')
        .select('*')
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()) // Last 24 hours
        .eq('is_complete', true);

      if (error || !recentSubmissions) return;

      // Count submissions per client
      const clientSubmissions: Record<string, number> = {};
      recentSubmissions.forEach(submission => {
        clientSubmissions[submission.client_id] = (clientSubmissions[submission.client_id] || 0) + 1;
      });

      // Check for clients with multiple submissions
      for (const [clientId, count] of Object.entries(clientSubmissions)) {
        if (count >= this.config.alertThresholds.multipleComplaintsThreshold) {
          const ruleKey = `multiple_complaints_${clientId}`;

          if (!this.isInCooldown(ruleKey)) {
            await this.triggerMultipleComplaintsAlert(clientId, count);
            this.setCooldown(ruleKey, 60); // 1 hour cooldown
          }
        }
      }
    } catch (error) {
      console.error('Error checking multiple complaints:', error);
    }
  }

  /**
   * Check staff performance issues
   */
  private async checkStaffPerformanceIssues(): Promise<void> {
    try {
      const { data: staffMetrics, error } = await supabase
        .from('satisfaction_metrics')
        .select('staff_id, score')
        .gte('measurement_date', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()) // Last 24 hours
        .not('staff_id', 'is', null);

      if (error || !staffMetrics) return;

      // Calculate average scores per staff member
      const staffScores: Record<string, number[]> = {};
      staffMetrics.forEach(metric => {
        if (metric.staff_id) {
          if (!staffScores[metric.staff_id]) {
            staffScores[metric.staff_id] = [];
          }
          staffScores[metric.staff_id].push(metric.score);
        }
      });

      // Check for staff with low performance
      for (const [staffId, scores] of Object.entries(staffScores)) {
        if (scores.length >= 3) { // At least 3 feedback entries
          const averageScore = scores.reduce((sum, score) => sum + score, 0) / scores.length;

          if (averageScore <= this.config.alertThresholds.staffPerformanceThreshold) {
            const ruleKey = `staff_performance_${staffId}`;

            if (!this.isInCooldown(ruleKey)) {
              await this.triggerStaffPerformanceAlert(staffId, averageScore, scores.length);
              this.setCooldown(ruleKey, 120); // 2 hours cooldown
            }
          }
        }
      }
    } catch (error) {
      console.error('Error checking staff performance issues:', error);
    }
  }

  // ========================================
  // ALERT TRIGGERING
  // ========================================

  /**
   * Trigger low score alert
   */
  private async triggerLowScoreAlert(metric: SatisfactionMetric): Promise<void> {
    try {
      const context = await this.buildAlertContext(metric);
      const severity = metric.score <= 1.5 ? 'critical' : metric.score <= 2.0 ? 'warning' : 'info';

      const alert = await this.createAlert({
        type: 'low_score',
        severity,
        title: `Low Satisfaction Score Detected`,
        description: `Client satisfaction score of ${metric.score} recorded for ${metric.metric_type}`,
        triggerData: {
          metric,
          threshold: this.config.alertThresholds.lowScoreThreshold,
          context
        },
        sourceFeedbackId: this.extractFeedbackIdFromMetric(metric),
        clientId: metric.client_id,
        serviceId: metric.service_id,
        staffId: metric.staff_id
      });

      await this.executeAlertActions(alert, context);
    } catch (error) {
      console.error('Error triggering low score alert:', error);
    }
  }

  /**
   * Trigger negative sentiment alert
   */
  private async triggerNegativeSentimentAlert(clientId: string, sentiments: SentimentAnalysis[]): Promise<void> {
    try {
      const avgSentiment = sentiments.reduce((sum, s) => sum + s.sentiment_score, 0) / sentiments.length;
      const context = await this.buildAlertContext({ client_id: clientId });

      const alert = await this.createAlert({
        type: 'negative_sentiment',
        severity: avgSentiment <= -0.7 ? 'critical' : 'warning',
        title: `Negative Sentiment Spike Detected`,
        description: `${sentiments.length} negative feedback entries detected for client`,
        triggerData: {
          sentiments,
          averageSentiment: avgSentiment,
          threshold: this.config.alertThresholds.negativeSentimentThreshold,
          context
        },
        clientId
      });

      await this.executeAlertActions(alert, context);
    } catch (error) {
      console.error('Error triggering negative sentiment alert:', error);
    }
  }

  /**
   * Trigger trend decline alert
   */
  private async triggerTrendDeclineAlert(trend: { direction: string; percentage: number }): Promise<void> {
    try {
      const alert = await this.createAlert({
        type: 'trend_decline',
        severity: trend.percentage <= -20 ? 'critical' : 'warning',
        title: `Satisfaction Trend Decline`,
        description: `Satisfaction has declined by ${Math.abs(trend.percentage)}% recently`,
        triggerData: {
          trend,
          threshold: this.config.alertThresholds.trendDeclineThreshold
        }
      });

      await this.executeAlertActions(alert);
    } catch (error) {
      console.error('Error triggering trend decline alert:', error);
    }
  }

  /**
   * Trigger multiple complaints alert
   */
  private async triggerMultipleComplaintsAlert(clientId: string, complaintCount: number): Promise<void> {
    try {
      const context = await this.buildAlertContext({ client_id: clientId });

      const alert = await this.createAlert({
        type: 'multiple_complaints',
        severity: complaintCount >= 5 ? 'critical' : 'warning',
        title: `Multiple Complaints from Client`,
        description: `Client has submitted ${complaintCount} feedback entries in the last 24 hours`,
        triggerData: {
          complaintCount,
          threshold: this.config.alertThresholds.multipleComplaintsThreshold,
          context
        },
        clientId
      });

      await this.executeAlertActions(alert, context);
    } catch (error) {
      console.error('Error triggering multiple complaints alert:', error);
    }
  }

  /**
   * Trigger staff performance alert
   */
  private async triggerStaffPerformanceAlert(staffId: string, averageScore: number, feedbackCount: number): Promise<void> {
    try {
      const context = await this.buildAlertContext({ staff_id: staffId });

      const alert = await this.createAlert({
        type: 'staff_performance',
        severity: averageScore <= 2.0 ? 'critical' : 'warning',
        title: `Staff Performance Issue`,
        description: `Staff member average satisfaction score is ${averageScore} from ${feedbackCount} feedback entries`,
        triggerData: {
          staffId,
          averageScore,
          feedbackCount,
          threshold: this.config.alertThresholds.staffPerformanceThreshold,
          context
        },
        staffId
      });

      await this.executeAlertActions(alert, context);
    } catch (error) {
      console.error('Error triggering staff performance alert:', error);
    }
  }

  // ========================================
  // ALERT MANAGEMENT
  // ========================================

  /**
   * Create alert in database
   */
  private async createAlert(alertData: {
    type: AlertType;
    severity: AlertSeverity;
    title: string;
    description: string;
    triggerData: any;
    sourceFeedbackId?: string;
    clientId?: string;
    serviceId?: string;
    staffId?: string;
  }): Promise<SatisfactionAlert> {
    try {
      const { data, error } = await supabase
        .from('satisfaction_alerts')
        .insert({
          alert_type: alertData.type,
          severity: alertData.severity,
          alert_title: alertData.title,
          alert_description: alertData.description,
          trigger_data: alertData.triggerData,
          source_feedback_id: alertData.sourceFeedbackId,
          client_id: alertData.clientId,
          service_id: alertData.serviceId,
          staff_id: alertData.staffId,
          alert_status: 'active',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating alert:', error);
      throw error;
    }
  }

  /**
   * Execute alert actions
   */
  private async executeAlertActions(alert: SatisfactionAlert, context?: AlertContext): Promise<void> {
    try {
      // Send notifications
      await this.sendAlertNotifications(alert, context);

      // Create service recovery case if needed
      if (alert.severity === 'critical' || alert.severity === 'emergency') {
        await this.createServiceRecoveryCase(alert, context);
      }

      // Trigger escalation if needed
      if (alert.severity === 'emergency') {
        await this.escalateAlert(alert);
      }
    } catch (error) {
      console.error('Error executing alert actions:', error);
    }
  }

  /**
   * Send alert notifications
   */
  private async sendAlertNotifications(alert: SatisfactionAlert, context?: AlertContext): Promise<void> {
    try {
      // Get alert recipients
      const { data: recipients, error } = await supabase
        .from('alert_recipients')
        .select('user_id, notification_methods, notification_preferences')
        .eq('is_active', true)
        .contains('alert_types', [alert.alert_type])
        .contains('severity_levels', [alert.severity]);

      if (error || !recipients) return;

      for (const recipient of recipients) {
        // Send in-app notifications
        if (recipient.notification_methods.includes('in_app')) {
          await this.sendInAppNotification(recipient.user_id, alert, context);
        }

        // Send email notifications
        if (recipient.notification_methods.includes('email')) {
          await this.sendEmailNotification(recipient.user_id, alert, context);
        }

        // Send push notifications
        if (recipient.notification_methods.includes('push')) {
          await this.sendPushNotification(recipient.user_id, alert, context);
        }
      }
    } catch (error) {
      console.error('Error sending alert notifications:', error);
    }
  }

  /**
   * Send in-app notification
   */
  private async sendInAppNotification(userId: string, alert: SatisfactionAlert, context?: AlertContext): Promise<void> {
    try {
      const notification = {
        user_id: userId,
        title: alert.alert_title,
        message: alert.alert_description || '',
        type: 'alert',
        severity: alert.severity,
        data: {
          alertId: alert.id,
          alertType: alert.alert_type,
          context
        },
        created_at: new Date().toISOString()
      };

      await supabase
        .from('notifications')
        .insert(notification);
    } catch (error) {
      console.error('Error sending in-app notification:', error);
    }
  }

  /**
   * Send email notification
   */
  private async sendEmailNotification(userId: string, alert: SatisfactionAlert, context?: AlertContext): Promise<void> {
    try {
      const { data: user } = await supabase
        .from('profiles')
        .select('email')
        .eq('id', userId)
        .single();

      if (!user?.email) return;

      // In a real implementation, this would send an actual email
      console.log(`Email notification sent to ${user.email} for alert ${alert.id}`);
    } catch (error) {
      console.error('Error sending email notification:', error);
    }
  }

  /**
   * Send push notification
   */
  private async sendPushNotification(userId: string, alert: SatisfactionAlert, context?: AlertContext): Promise<void> {
    try {
      // In a real implementation, this would send an actual push notification
      console.log(`Push notification sent to user ${userId} for alert ${alert.id}`);
    } catch (error) {
      console.error('Error sending push notification:', error);
    }
  }

  // ========================================
  // UTILITY METHODS
  // ========================================

  /**
   * Initialize default alert rules
   */
  private initializeDefaultAlertRules(): void {
    const defaultRules: AlertRule[] = [
      {
        id: 'low_score_immediate',
        name: 'Immediate Low Score Alert',
        description: 'Alert when satisfaction score falls below threshold',
        type: 'low_score',
        severity: 'warning',
        conditions: [
          {
            metric: 'satisfaction_score',
            operator: 'less_than',
            value: this.config.alertThresholds.lowScoreThreshold,
            timeWindow: 5,
            aggregation: 'avg'
          }
        ],
        actions: [
          {
            type: 'create_alert',
            config: { immediate: true }
          },
          {
            type: 'send_notification',
            config: { channels: ['in_app', 'email'] }
          }
        ],
        isActive: true,
        cooldownPeriod: 15
      },
      {
        id: 'negative_sentiment_spike',
        name: 'Negative Sentiment Spike',
        description: 'Alert when multiple negative sentiments detected',
        type: 'negative_sentiment',
        severity: 'warning',
        conditions: [
          {
            metric: 'negative_sentiment_count',
            operator: 'greater_than',
            value: 2,
            timeWindow: 10,
            aggregation: 'count'
          }
        ],
        actions: [
          {
            type: 'create_alert',
            config: { priority: 'high' }
          },
          {
            type: 'trigger_workflow',
            config: { workflow: 'client_outreach' }
          }
        ],
        isActive: true,
        cooldownPeriod: 30
      }
    ];

    defaultRules.forEach(rule => {
      this.alertRules.set(rule.id, rule);
    });
  }

  /**
   * Calculate trend from array of values
   */
  private calculateTrend(values: number[]): { direction: 'up' | 'down' | 'stable'; percentage: number } {
    if (values.length < 2) return { direction: 'stable', percentage: 0 };

    const first = values[0];
    const last = values[values.length - 1];
    const change = ((last - first) / first) * 100;

    return {
      direction: change > 2 ? 'up' : change < -2 ? 'down' : 'stable',
      percentage: Math.abs(change)
    };
  }

  /**
   * Build alert context
   */
  private async buildAlertContext(triggerData: any): Promise<AlertContext> {
    const context: AlertContext = {};

    try {
      // Add client info if available
      if (triggerData.client_id) {
        const { data: client } = await supabase
          .from('profiles')
          .select('display_name, vip_status')
          .eq('id', triggerData.client_id)
          .single();

        if (client) {
          context.clientInfo = {
            id: triggerData.client_id,
            name: client.display_name || 'Unknown',
            vipStatus: client.vip_status || false,
            lifetimeValue: 0, // Would calculate from actual data
            recentBookings: 0 // Would calculate from actual data
          };
        }
      }

      // Add service info if available
      if (triggerData.service_id) {
        const { data: service } = await supabase
          .from('services')
          .select('name, type, price')
          .eq('id', triggerData.service_id)
          .single();

        if (service) {
          context.serviceInfo = {
            id: triggerData.service_id,
            name: service.name,
            type: service.type,
            price: service.price,
            popularity: 0 // Would calculate from actual data
          };
        }
      }

      // Add staff info if available
      if (triggerData.staff_id) {
        const { data: staff } = await supabase
          .from('profiles')
          .select('display_name')
          .eq('id', triggerData.staff_id)
          .single();

        if (staff) {
          context.staffInfo = {
            id: triggerData.staff_id,
            name: staff.display_name || 'Unknown',
            role: 'Staff', // Would get from actual data
            performance: 0, // Would calculate from actual data
            recentFeedback: 0 // Would calculate from actual data
          };
        }
      }
    } catch (error) {
      console.error('Error building alert context:', error);
    }

    return context;
  }

  /**
   * Check if alert is in cooldown period
   */
  private isInCooldown(ruleKey: string): boolean {
    const cooldownEnd = this.alertCooldowns.get(ruleKey);
    if (!cooldownEnd) return false;
    return Date.now() < cooldownEnd;
  }

  /**
   * Set cooldown for alert rule
   */
  private setCooldown(ruleKey: string, minutes: number): void {
    this.alertCooldowns.set(ruleKey, Date.now() + minutes * 60 * 1000);
  }

  /**
   * Extract client ID from sentiment analysis source
   */
  private extractClientIdFromSource(sentiment: SentimentAnalysis): string | null {
    // This would need to be implemented based on your source data structure
    return null;
  }

  /**
   * Extract feedback ID from metric
   */
  private extractFeedbackIdFromMetric(metric: SatisfactionMetric): string | null {
    // This would need to be implemented based on your metric data structure
    return null;
  }

  /**
   * Create service recovery case
   */
  private async createServiceRecoveryCase(alert: SatisfactionAlert, context?: AlertContext): Promise<void> {
    try {
      await supabase
        .from('service_recovery_cases')
        .insert({
          client_id: alert.client_id,
          trigger_feedback_id: alert.source_feedback_id,
          service_id: alert.service_id,
          staff_id: alert.staff_id,
          recovery_priority: alert.severity === 'emergency' ? 'critical' : 'high',
          recovery_status: 'new',
          case_notes: `Auto-generated from alert: ${alert.alert_title}`,
          created_at: new Date().toISOString()
        });
    } catch (error) {
      console.error('Error creating service recovery case:', error);
    }
  }

  /**
   * Escalate alert
   */
  private async escalateAlert(alert: SatisfactionAlert): Promise<void> {
    try {
      await supabase
        .from('satisfaction_alerts')
        .update({
          alert_status: 'acknowledged',
          updated_at: new Date().toISOString()
        })
        .eq('id', alert.id);

      // Notify executives
      await this.notifyExecutives(alert);
    } catch (error) {
      console.error('Error escalating alert:', error);
    }
  }

  /**
   * Escalate unassigned alert
   */
  private async escalateUnassignedAlert(alert: SatisfactionAlert): Promise<void> {
    try {
      await supabase
        .from('satisfaction_alerts')
        .update({
          alert_status: 'acknowledged',
          updated_at: new Date().toISOString()
        })
        .eq('id', alert.id);

      console.log(`Alert ${alert.id} escalated due to being unassigned for too long`);
    } catch (error) {
      console.error('Error escalating unassigned alert:', error);
    }
  }

  /**
   * Notify executives
   */
  private async notifyExecutives(alert: SatisfactionAlert): Promise<void> {
    try {
      const { data: executives } = await supabase
        .from('profiles')
        .select('id')
        .eq('role', 'executive');

      if (executives) {
        for (const executive of executives) {
          await this.sendInAppNotification(executive.id, alert);
          await this.sendEmailNotification(executive.id, alert);
        }
      }
    } catch (error) {
      console.error('Error notifying executives:', error);
    }
  }

  /**
   * Update real-time metrics
   */
  private async updateRealTimeMetrics(): Promise<void> {
    try {
      const now = new Date();
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();

      // Get today's submissions
      const { count: todaySubmissions } = await supabase
        .from('feedback_submissions')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', todayStart)
        .eq('is_complete', true);

      // Get active alerts
      const { count: activeAlerts } = await supabase
        .from('satisfaction_alerts')
        .select('*', { count: 'exact', head: true })
        .eq('alert_status', 'active');

      // Get current satisfaction score
      const { data: recentMetrics } = await supabase
        .from('satisfaction_metrics')
        .select('score')
        .gte('measurement_date', new Date(Date.now() - 60 * 60 * 1000).toISOString()) // Last hour
        .order('measurement_date', { ascending: false })
        .limit(10);

      const currentSatisfactionScore = recentMetrics && recentMetrics.length > 0
        ? recentMetrics.reduce((sum, m) => sum + m.score, 0) / recentMetrics.length
        : 0;

      // Store real-time metrics
      const realTimeMetrics: RealTimeMetrics = {
        timestamp: now.toISOString(),
        currentSatisfactionScore,
        todaySubmissions: todaySubmissions || 0,
        activeAlerts: activeAlerts || 0,
        pendingRecoveryCases: 0, // Would calculate from actual data
        averageResponseTime: 0, // Would calculate from actual data
        currentTrend: 'stable', // Would calculate from actual data
        volumeRate: (todaySubmissions || 0) / now.getHours(), // Submissions per hour
        sentimentRatio: { // Would calculate from actual data
          positive: 60,
          negative: 20,
          neutral: 20
        }
      };

      // Store in cache or broadcast to connected clients
      this.broadcastRealTimeMetrics(realTimeMetrics);
    } catch (error) {
      console.error('Error updating real-time metrics:', error);
    }
  }

  /**
   * Broadcast real-time metrics to connected clients
   */
  private broadcastRealTimeMetrics(metrics: RealTimeMetrics): void {
    // In a real implementation, this would use WebSockets or Server-Sent Events
    console.log('Broadcasting real-time metrics:', metrics);
  }

  /**
   * Check if daily summary should be sent
   */
  private async checkDailySummary(): Promise<void> {
    const now = new Date();
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

    if (currentTime === this.config.monitoringIntervals.dailyReport) {
      await this.sendDailySummary();
    }
  }

  /**
   * Send daily summary
   */
  private async sendDailySummary(): Promise<void> {
    try {
      console.log('Sending daily feedback summary...');
      // Implementation would generate and send daily summary report
    } catch (error) {
      console.error('Error sending daily summary:', error);
    }
  }

  /**
   * Clean up old resolved alerts
   */
  private async cleanupOldAlerts(): Promise<void> {
    try {
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

      await supabase
        .from('satisfaction_alerts')
        .delete()
        .eq('alert_status', 'resolved')
        .lt('updated_at', thirtyDaysAgo);
    } catch (error) {
      console.error('Error cleaning up old alerts:', error);
    }
  }

  // ========================================
  // EVENT HANDLERS
  // ========================================

  /**
   * Handle new feedback submission
   */
  private async handleNewSubmission(submission: any): Promise<void> {
    try {
      console.log('New feedback submission detected:', submission.id);

      // Check if immediate action is needed
      if (submission.completion_rate === 100) {
        // Process the completed submission
        await this.processCompletedSubmission(submission);
      }
    } catch (error) {
      console.error('Error handling new submission:', error);
    }
  }

  /**
   * Handle new sentiment analysis
   */
  private async handleNewSentimentAnalysis(sentiment: SentimentAnalysis): Promise<void> {
    try {
      console.log('New sentiment analysis detected:', sentiment.id);

      // Check for critical negative sentiment
      if (sentiment.sentiment_score <= -0.8) {
        const ruleKey = `critical_negative_${sentiment.source_id}`;

        if (!this.isInCooldown(ruleKey)) {
          await this.triggerCriticalSentimentAlert(sentiment);
          this.setCooldown(ruleKey, 10); // 10 minutes cooldown
        }
      }
    } catch (error) {
      console.error('Error handling new sentiment analysis:', error);
    }
  }

  /**
   * Handle new satisfaction metric
   */
  private async handleNewSatisfactionMetric(metric: SatisfactionMetric): Promise<void> {
    try {
      console.log('New satisfaction metric detected:', metric.id);

      // Check for critically low scores
      if (metric.score <= 1.0) {
        const ruleKey = `critical_low_score_${metric.client_id}_${metric.service_id}`;

        if (!this.isInCooldown(ruleKey)) {
          await this.triggerCriticalLowScoreAlert(metric);
          this.setCooldown(ruleKey, 5); // 5 minutes cooldown
        }
      }
    } catch (error) {
      console.error('Error handling new satisfaction metric:', error);
    }
  }

  /**
   * Process completed submission
   */
  private async processCompletedSubmission(submission: any): Promise<void> {
    try {
      // This would contain logic to process the completed submission
      // and trigger appropriate alerts based on the responses
      console.log('Processing completed submission:', submission.id);
    } catch (error) {
      console.error('Error processing completed submission:', error);
    }
  }

  /**
   * Trigger critical sentiment alert
   */
  private async triggerCriticalSentimentAlert(sentiment: SentimentAnalysis): Promise<void> {
    try {
      const context = await this.buildAlertContext({ source_id: sentiment.source_id });

      const alert = await this.createAlert({
        type: 'negative_sentiment',
        severity: 'emergency',
        title: `Critical Negative Sentiment Detected`,
        description: `Very negative sentiment (${sentiment.sentiment_score}) detected in feedback`,
        triggerData: {
          sentiment,
          threshold: -0.8,
          context
        },
        sourceFeedbackId: sentiment.source_id
      });

      await this.executeAlertActions(alert, context);
    } catch (error) {
      console.error('Error triggering critical sentiment alert:', error);
    }
  }

  /**
   * Trigger critical low score alert
   */
  private async triggerCriticalLowScoreAlert(metric: SatisfactionMetric): Promise<void> {
    try {
      const context = await this.buildAlertContext(metric);

      const alert = await this.createAlert({
        type: 'low_score',
        severity: 'emergency',
        title: `Critical Low Satisfaction Score`,
        description: `Critical satisfaction score of ${metric.score} detected`,
        triggerData: {
          metric,
          threshold: 1.0,
          context
        },
        sourceFeedbackId: this.extractFeedbackIdFromMetric(metric),
        clientId: metric.client_id,
        serviceId: metric.service_id,
        staffId: metric.staff_id
      });

      await this.executeAlertActions(alert, context);
    } catch (error) {
      console.error('Error triggering critical low score alert:', error);
    }
  }

  // ========================================
  // PUBLIC API METHODS
  // ========================================

  /**
   * Get current real-time metrics
   */
  async getRealTimeMetrics(): Promise<RealTimeMetrics | null> {
    try {
      // This would return the most recent real-time metrics
      // For now, calculate and return current metrics
      await this.updateRealTimeMetrics();

      return {
        timestamp: new Date().toISOString(),
        currentSatisfactionScore: 4.2, // Placeholder
        todaySubmissions: 15, // Placeholder
        activeAlerts: 3, // Placeholder
        pendingRecoveryCases: 2, // Placeholder
        averageResponseTime: 45, // Placeholder
        currentTrend: 'stable', // Placeholder
        volumeRate: 1.5, // Placeholder
        sentimentRatio: { // Placeholder
          positive: 65,
          negative: 20,
          neutral: 15
        }
      };
    } catch (error) {
      console.error('Error getting real-time metrics:', error);
      return null;
    }
  }

  /**
   * Get active alerts
   */
  async getActiveAlerts(): Promise<SatisfactionAlert[]> {
    try {
      const { data, error } = await supabase
        .from('satisfaction_alerts')
        .select('*')
        .eq('alert_status', 'active')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error getting active alerts:', error);
      return [];
    }
  }

  /**
   * Update monitoring configuration
   */
  updateConfig(newConfig: Partial<MonitoringConfig>): void {
    this.config = { ...this.config, ...newConfig };

    // Restart monitoring with new configuration if it's currently running
    if (this.isMonitoring) {
      this.stopMonitoring();
      setTimeout(() => this.startMonitoring(), 1000);
    }
  }

  /**
   * Get monitoring status
   */
  getStatus(): {
    isMonitoring: boolean;
    config: MonitoringConfig;
    activeRules: number;
    activeCooldowns: number;
  } {
    return {
      isMonitoring: this.isMonitoring,
      config: this.config,
      activeRules: Array.from(this.alertRules.values()).filter(rule => rule.isActive).length,
      activeCooldowns: this.alertCooldowns.size
    };
  }
}

// Export singleton instance
export const realTimeFeedbackMonitoring = new RealTimeFeedbackMonitoring();