/**
 * Performance KPI Tracking and Alerting System
 *
 * Real-time monitoring of key performance indicators with:
 * - Automated threshold monitoring
 * - Anomaly detection and alerting
 * - Performance trend analysis
 * - Automated report generation
 * - Multi-level alerting (warning, critical)
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';

export interface KPIDefinition {
  id: string;
  name: string;
  description: string;
  category: 'financial' | 'operational' | 'customer' | 'marketing' | 'quality';
  unit: 'number' | 'percentage' | 'currency' | 'duration';
  formula?: string;
  dataSource: string;
  frequency: 'real_time' | 'hourly' | 'daily' | 'weekly' | 'monthly';
  targets: {
    warning: number;
    critical: number;
    target: number;
    stretch: number;
  };
  isActive: boolean;
  owner?: string;
  tags: string[];
}

export interface KPIData {
  id: string;
  kpiId: string;
  value: number;
  timestamp: Date;
  dimensions?: Record<string, any>;
  metadata?: Record<string, any>;
}

export interface KPIAlert {
  id: string;
  kpiId: string;
  kpiName: string;
  alertType: 'threshold_breach' | 'trend_anomaly' | 'target_missed' | 'target_exceeded' | 'data_quality';
  severity: 'low' | 'medium' | 'high' | 'critical';
  currentValue: number;
  thresholdValue: number;
  message: string;
  description: string;
  dimensions?: Record<string, any>;
  timestamp: Date;
  isResolved: boolean;
  resolvedAt?: Date;
  resolvedBy?: string;
  assignedTo?: string;
  actions: Array<{
    id: string;
    description: string;
    assignee?: string;
    dueDate?: Date;
    completed: boolean;
    completedAt?: Date;
  }>;
}

export interface KPIReport {
  id: string;
  name: string;
  description: string;
  period: 'daily' | 'weekly' | 'monthly' | 'quarterly';
  generatedAt: Date;
  data: {
    overview: {
      totalKPIs: number;
      alertsCount: number;
      achievementsCount: number;
      performanceScore: number;
    };
    kpis: Array<{
      kpiId: string;
      name: string;
      currentValue: number;
      target: number;
      achievement: number;
      trend: 'improving' | 'stable' | 'declining';
      change: number;
      changePeriod: string;
    }>;
    alerts: Array<{
      type: string;
      count: number;
      severity: string;
      topAlerts: KPIAlert[];
    }>;
    insights: Array<{
      title: string;
      description: string;
      type: 'opportunity' | 'risk' | 'achievement' | 'recommendation';
      priority: 'high' | 'medium' | 'low';
      relatedKPIs: string[];
    }>;
  };
}

export interface KPIMonitoringConfig {
  anomalyDetection: {
    enabled: boolean;
    sensitivity: number; // 0-1
    windowSize: number; // Number of data points to analyze
    methods: ('statistical' | 'ml' | 'seasonal')[];
  };
  alerting: {
    enabled: boolean;
    channels: ('email' | 'slack' | 'sms' | 'webhook')[];
    escalation: {
      thresholds: {
        medium: { delay: number; recipients: string[] };
        high: { delay: number; recipients: string[] };
        critical: { delay: number; recipients: string[] };
      };
    };
  };
  reporting: {
    enabled: boolean;
    schedules: {
      daily: { enabled: boolean; time: string; recipients: string[] };
      weekly: { enabled: boolean; day: number; time: string; recipients: string[] };
      monthly: { enabled: boolean; day: number; time: string; recipients: string[] };
    };
  };
}

class KPITracking {
  private supabase: SupabaseClient;
  private kpiDefinitions: Map<string, KPIDefinition> = new Map();
  private monitoringConfig: KPIMonitoringConfig;
  private activeAlerts: Map<string, KPIAlert> = new Map();
  private monitoringInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.supabase = createClient(
      import.meta.env.VITE_SUPABASE_URL!,
      import.meta.env.VITE_SUPABASE_ANON_KEY!
    );

    this.monitoringConfig = {
      anomalyDetection: {
        enabled: true,
        sensitivity: 0.8,
        windowSize: 24,
        methods: ['statistical', 'seasonal']
      },
      alerting: {
        enabled: true,
        channels: ['email', 'slack'],
        escalation: {
          thresholds: {
            medium: { delay: 300000, recipients: ['manager@example.com'] }, // 5 minutes
            high: { delay: 60000, recipients: ['manager@example.com', 'director@example.com'] }, // 1 minute
            critical: { delay: 10000, recipients: ['manager@example.com', 'director@example.com', 'ceo@example.com'] } // 10 seconds
          }
        }
      },
      reporting: {
        enabled: true,
        schedules: {
          daily: { enabled: true, time: '09:00', recipients: ['manager@example.com'] },
          weekly: { enabled: true, day: 1, time: '10:00', recipients: ['leadership@example.com'] },
          monthly: { enabled: true, day: 1, time: '09:00', recipients: ['executives@example.com'] }
        }
      }
    };

    this.initializeKPIDefinitions();
    this.startMonitoring();
  }

  private initializeKPIDefinitions(): void {
    // Financial KPIs
    const financialKPIs: KPIDefinition[] = [
      {
        id: 'daily_revenue',
        name: 'Daily Revenue',
        description: 'Total revenue generated per day',
        category: 'financial',
        unit: 'currency',
        dataSource: 'bookings',
        frequency: 'daily',
        targets: {
          warning: 3000,
          critical: 2000,
          target: 5000,
          stretch: 7000
        },
        isActive: true,
        tags: ['revenue', 'daily', 'financial']
      },
      {
        id: 'monthly_revenue',
        name: 'Monthly Revenue',
        description: 'Total revenue generated per month',
        category: 'financial',
        unit: 'currency',
        dataSource: 'bookings',
        frequency: 'daily',
        targets: {
          warning: 80000,
          critical: 60000,
          target: 120000,
          stretch: 150000
        },
        isActive: true,
        tags: ['revenue', 'monthly', 'financial']
      },
      {
        id: 'average_order_value',
        name: 'Average Order Value',
        description: 'Average revenue per booking',
        category: 'financial',
        unit: 'currency',
        dataSource: 'bookings',
        frequency: 'daily',
        targets: {
          warning: 350,
          critical: 300,
          target: 450,
          stretch: 550
        },
        isActive: true,
        tags: ['aov', 'revenue', 'financial']
      },
      {
        id: 'customer_acquisition_cost',
        name: 'Customer Acquisition Cost',
        description: 'Average cost to acquire a new customer',
        category: 'financial',
        unit: 'currency',
        dataSource: 'marketing',
        frequency: 'weekly',
        targets: {
          warning: 200,
          critical: 300,
          target: 150,
          stretch: 100
        },
        isActive: true,
        tags: ['cac', 'marketing', 'financial']
      }
    ];

    // Operational KPIs
    const operationalKPIs: KPIDefinition[] = [
      {
        id: 'booking_conversion_rate',
        name: 'Booking Conversion Rate',
        description: 'Percentage of visitors who complete a booking',
        category: 'operational',
        unit: 'percentage',
        dataSource: 'analytics_events',
        frequency: 'daily',
        targets: {
          warning: 15,
          critical: 10,
          target: 25,
          stretch: 35
        },
        isActive: true,
        tags: ['conversion', 'bookings', 'operational']
      },
      {
        id: 'staff_utilization',
        name: 'Staff Utilization Rate',
        description: 'Percentage of staff time that is booked',
        category: 'operational',
        unit: 'percentage',
        dataSource: 'schedules',
        frequency: 'daily',
        targets: {
          warning: 70,
          critical: 60,
          target: 85,
          stretch: 95
        },
        isActive: true,
        tags: ['staff', 'utilization', 'operational']
      },
      {
        id: 'service_completion_rate',
        name: 'Service Completion Rate',
        description: 'Percentage of services completed as scheduled',
        category: 'operational',
        unit: 'percentage',
        dataSource: 'bookings',
        frequency: 'daily',
        targets: {
          warning: 90,
          critical: 85,
          target: 95,
          stretch: 98
        },
        isActive: true,
        tags: ['completion', 'services', 'operational']
      },
      {
        id: 'no_show_rate',
        name: 'No-Show Rate',
        description: 'Percentage of booked appointments that are missed',
        category: 'operational',
        unit: 'percentage',
        dataSource: 'bookings',
        frequency: 'daily',
        targets: {
          warning: 10,
          critical: 15,
          target: 5,
          stretch: 2
        },
        isActive: true,
        tags: ['no-show', 'bookings', 'operational']
      }
    ];

    // Customer KPIs
    const customerKPIs: KPIDefinition[] = [
      {
        id: 'customer_satisfaction',
        name: 'Customer Satisfaction Score',
        description: 'Average customer rating across all services',
        category: 'customer',
        unit: 'number',
        dataSource: 'reviews',
        frequency: 'daily',
        targets: {
          warning: 4.2,
          critical: 4.0,
          target: 4.7,
          stretch: 4.9
        },
        isActive: true,
        tags: ['satisfaction', 'customers', 'quality']
      },
      {
        id: 'net_promoter_score',
        name: 'Net Promoter Score',
        description: 'Net Promoter Score from customer feedback',
        category: 'customer',
        unit: 'number',
        dataSource: 'surveys',
        frequency: 'weekly',
        targets: {
          warning: 50,
          critical: 30,
          target: 70,
          stretch: 85
        },
        isActive: true,
        tags: ['nps', 'customers', 'loyalty']
      },
      {
        id: 'customer_retention_rate',
        name: 'Customer Retention Rate',
        description: 'Percentage of customers who return for additional services',
        category: 'customer',
        unit: 'percentage',
        dataSource: 'bookings',
        frequency: 'monthly',
        targets: {
          warning: 60,
          critical: 50,
          target: 75,
          stretch: 85
        },
        isActive: true,
        tags: ['retention', 'customers', 'loyalty']
      },
      {
        id: 'customer_lifetime_value',
        name: 'Customer Lifetime Value',
        description: 'Average revenue generated per customer over their lifetime',
        category: 'customer',
        unit: 'currency',
        dataSource: 'analytics',
        frequency: 'monthly',
        targets: {
          warning: 2000,
          critical: 1500,
          target: 3000,
          stretch: 5000
        },
        isActive: true,
        tags: ['clv', 'customers', 'value']
      }
    ];

    // Marketing KPIs
    const marketingKPIs: KPIDefinition[] = [
      {
        id: 'marketing_roi',
        name: 'Marketing ROI',
        description: 'Return on investment for marketing campaigns',
        category: 'marketing',
        unit: 'number',
        dataSource: 'campaign_analytics',
        frequency: 'monthly',
        targets: {
          warning: 2.0,
          critical: 1.5,
          target: 3.0,
          stretch: 5.0
        },
        isActive: true,
        tags: ['roi', 'marketing', 'performance']
      },
      {
        id: 'cost_per_acquisition',
        name: 'Cost Per Acquisition',
        description: 'Marketing cost per new customer acquired',
        category: 'marketing',
        unit: 'currency',
        dataSource: 'campaign_analytics',
        frequency: 'weekly',
        targets: {
          warning: 200,
          critical: 300,
          target: 150,
          stretch: 100
        },
        isActive: true,
        tags: ['cpa', 'marketing', 'acquisition']
      }
    ];

    // Quality KPIs
    const qualityKPIs: KPIDefinition[] = [
      {
        id: 'service_quality_score',
        name: 'Service Quality Score',
        description: 'Combined score for service quality metrics',
        category: 'quality',
        unit: 'number',
        dataSource: 'reviews',
        frequency: 'daily',
        targets: {
          warning: 4.0,
          critical: 3.5,
          target: 4.5,
          stretch: 4.8
        },
        isActive: true,
        tags: ['quality', 'services', 'excellence']
      },
      {
        id: 'complaint_rate',
        name: 'Customer Complaint Rate',
        description: 'Percentage of customers who file complaints',
        category: 'quality',
        unit: 'percentage',
        dataSource: 'support',
        frequency: 'monthly',
        targets: {
          warning: 5,
          critical: 10,
          target: 2,
          stretch: 1
        },
        isActive: true,
        tags: ['complaints', 'quality', 'support']
      }
    ];

    // Register all KPIs
    [...financialKPIs, ...operationalKPIs, ...customerKPIs, ...marketingKPIs, ...qualityKPIs].forEach(kpi => {
      this.kpiDefinitions.set(kpi.id, kpi);
    });
  }

  private startMonitoring(): void {
    // Start monitoring based on KPI frequencies
    this.monitoringInterval = setInterval(() => {
      this.checkKPIs();
    }, 60000); // Check every minute

    // Check for scheduled reports
    setInterval(() => {
      this.checkScheduledReports();
    }, 60000); // Check every minute
  }

  public async recordKPIValue(
    kpiId: string,
    value: number,
    dimensions?: Record<string, any>,
    metadata?: Record<string, any>
  ): Promise<void> {
    const kpi = this.kpiDefinitions.get(kpiId);
    if (!kpi || !kpi.isActive) {
      return;
    }

    const kpiData: KPIData = {
      id: crypto.randomUUID(),
      kpiId,
      value,
      timestamp: new Date(),
      dimensions,
      metadata
    };

    // Store in database
    await this.supabase
      .from('performance_kpis')
      .insert({
        kpi_name: kpi.name,
        kpi_value: value,
        target_value: kpi.targets.target,
        threshold_min: kpi.targets.warning,
        threshold_max: kpi.targets.stretch,
        measurement_date: new Date().toISOString().split('T')[0],
        dimension1: dimensions?.category,
        dimension2: dimensions?.location,
        dimension3: dimensions?.channel,
        metadata
      });

    // Check for alerts
    await this.checkKPIForAlerts(kpi, kpiData);
  }

  private async checkKPIs(): Promise<void> {
    const now = new Date();
    const currentHour = now.getHours();

    for (const kpi of this.kpiDefinitions.values()) {
      if (!kpi.isActive) continue;

      // Check if it's time to monitor this KPI
      if (this.shouldMonitorKPI(kpi, currentHour)) {
        await this.collectAndCheckKPI(kpi);
      }
    }
  }

  private shouldMonitorKPI(kpi: KPIDefinition, currentHour: number): boolean {
    switch (kpi.frequency) {
      case 'real_time':
        return true;
      case 'hourly':
        return now.getMinutes() === 0; // At the top of the hour
      case 'daily':
        return currentHour === 9 && now.getMinutes() === 0; // 9:00 AM
      case 'weekly':
        return now.getDay() === 1 && currentHour === 10 && now.getMinutes() === 0; // Monday 10:00 AM
      case 'monthly':
        return now.getDate() === 1 && currentHour === 9 && now.getMinutes() === 0; // 1st of month 9:00 AM
      default:
        return false;
    }
  }

  private async collectAndCheckKPI(kpi: KPIDefinition): Promise<void> {
    try {
      const value = await this.calculateKPIValue(kpi);
      await this.recordKPIValue(kpi.id, value);
    } catch (error) {
      console.error(`Failed to collect KPI value for ${kpi.name}:`, error);
    }
  }

  private async calculateKPIValue(kpi: KPIDefinition): Promise<number> {
    // In a real implementation, this would query the appropriate data source
    // For now, return mock values
    switch (kpi.id) {
      case 'daily_revenue':
        return Math.floor(Math.random() * 3000) + 3000;
      case 'monthly_revenue':
        return Math.floor(Math.random() * 50000) + 80000;
      case 'average_order_value':
        return Math.floor(Math.random() * 200) + 300;
      case 'booking_conversion_rate':
        return Math.random() * 15 + 15;
      case 'customer_satisfaction':
        return Math.random() * 0.5 + 4.3;
      case 'net_promoter_score':
        return Math.floor(Math.random() * 30) + 50;
      case 'staff_utilization':
        return Math.random() * 20 + 70;
      case 'marketing_roi':
        return Math.random() * 2 + 2;
      default:
        return Math.random() * 100;
    }
  }

  private async checkKPIForAlerts(kpi: KPIDefinition, data: KPIData): Promise<void> {
    const alerts: Array<{ type: KPIAlert['alertType']; severity: KPIAlert['severity']; message: string }> = [];

    // Check threshold breaches
    if (data.value <= kpi.targets.critical) {
      alerts.push({
        type: 'threshold_breach',
        severity: 'critical',
        message: `${kpi.name} has reached critical level: ${this.formatValue(data.value, kpi.unit)}`
      });
    } else if (data.value <= kpi.targets.warning) {
      alerts.push({
        type: 'threshold_breach',
        severity: 'medium',
        message: `${kpi.name} is below warning threshold: ${this.formatValue(data.value, kpi.unit)}`
      });
    }

    // Check for target achievements
    if (data.value >= kpi.targets.stretch) {
      alerts.push({
        type: 'target_exceeded',
        severity: 'low',
        message: `${kpi.name} has exceeded stretch target: ${this.formatValue(data.value, kpi.unit)}`
      });
    } else if (data.value >= kpi.targets.target) {
      alerts.push({
        type: 'target_exceeded',
        severity: 'low',
        message: `${kpi.name} has met target: ${this.formatValue(data.value, kpi.unit)}`
      });
    }

    // Check for anomalies if enabled
    if (this.monitoringConfig.anomalyDetection.enabled) {
      const isAnomaly = await this.detectAnomaly(kpi, data);
      if (isAnomaly) {
        alerts.push({
          type: 'trend_anomaly',
          severity: 'medium',
          message: `Unusual pattern detected in ${kpi.name}: ${this.formatValue(data.value, kpi.unit)}`
        });
      }
    }

    // Create alerts for each issue found
    for (const alert of alerts) {
      await this.createAlert(kpi, data, alert);
    }
  }

  private async detectAnomaly(kpi: KPIDefinition, currentData: KPIData): Promise<boolean> {
    try {
      // Get historical data for comparison
      const { data: historicalData } = await this.supabase
        .from('performance_kpis')
        .select('kpi_value')
        .eq('kpi_name', kpi.name)
        .gte('measurement_date', new Date(Date.now() - this.monitoringConfig.anomalyDetection.windowSize * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
        .order('measurement_date', { ascending: false })
        .limit(this.monitoringConfig.anomalyDetection.windowSize);

      if (!historicalData || historicalData.length < 5) {
        return false; // Not enough data for anomaly detection
      }

      const values = historicalData.map(d => d.kpi_value);
      const mean = values.reduce((sum, v) => sum + v, 0) / values.length;
      const stdDev = Math.sqrt(values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length);

      // Detect if current value is significantly different from historical mean
      const zScore = Math.abs((currentData.value - mean) / stdDev);
      const threshold = 2 + (1 - this.monitoringConfig.anomalyDetection.sensitivity); // Higher sensitivity = lower threshold

      return zScore > threshold;

    } catch (error) {
      console.error(`Failed to detect anomaly for ${kpi.name}:`, error);
      return false;
    }
  }

  private async createAlert(
    kpi: KPIDefinition,
    data: KPIData,
    alert: { type: KPIAlert['alertType']; severity: KPIAlert['severity']; message: string }
  ): Promise<void> {
    const kpiAlert: KPIAlert = {
      id: crypto.randomUUID(),
      kpiId: kpi.id,
      kpiName: kpi.name,
      alertType: alert.type,
      severity: alert.severity,
      currentValue: data.value,
      thresholdValue: alert.severity === 'critical' ? kpi.targets.critical : kpi.targets.warning,
      message: alert.message,
      description: this.generateAlertDescription(kpi, data, alert),
      dimensions: data.dimensions,
      timestamp: new Date(),
      isResolved: false,
      actions: []
    };

    // Store alert in database
    await this.supabase
      .from('kpi_alerts')
      .insert({
        kpi_name: kpi.name,
        alert_type: alert.type,
        severity: alert.severity,
        current_value: data.value,
        threshold_value: kpiAlert.thresholdValue,
        message: alert.message,
        is_resolved: false
      });

    // Store in memory for quick access
    this.activeAlerts.set(kpiAlert.id, kpiAlert);

    // Send notifications
    if (this.monitoringConfig.alerting.enabled) {
      await this.sendAlertNotification(kpiAlert);
    }

    // Schedule escalation if needed
    if (alert.severity === 'high' || alert.severity === 'critical') {
      this.scheduleAlertEscalation(kpiAlert);
    }
  }

  private generateAlertDescription(
    kpi: KPIDefinition,
    data: KPIData,
    alert: { type: KPIAlert['alertType']; severity: KPIAlert['severity']; message: string }
  ): string {
    const description = [];

    description.push(`KPI: ${kpi.name}`);
    description.push(`Current Value: ${this.formatValue(data.value, kpi.unit)}`);
    description.push(`Threshold: ${this.formatValue(alert.severity === 'critical' ? kpi.targets.critical : kpi.targets.warning, kpi.unit)}`);

    if (data.dimensions) {
      description.push(`Context: ${JSON.stringify(data.dimensions)}`);
    }

    return description.join('\n');
  }

  private async sendAlertNotification(alert: KPIAlert): Promise<void> {
    // In a real implementation, this would send notifications through various channels
    console.log(`ALERT [${alert.severity.toUpperCase()}]: ${alert.message}`);

    // Send email notification
    if (this.monitoringConfig.alerting.channels.includes('email')) {
      await this.sendEmailAlert(alert);
    }

    // Send Slack notification
    if (this.monitoringConfig.alerting.channels.includes('slack')) {
      await this.sendSlackAlert(alert);
    }
  }

  private async sendEmailAlert(alert: KPIAlert): Promise<void> {
    // Mock email sending - would integrate with email service
    console.log(`Email alert sent: ${alert.message}`);
  }

  private async sendSlackAlert(alert: KPIAlert): Promise<void> {
    // Mock Slack sending - would integrate with Slack API
    console.log(`Slack alert sent: ${alert.message}`);
  }

  private scheduleAlertEscalation(alert: KPIAlert): Promise<void> {
    const escalationConfig = this.monitoringConfig.alerting.escalation.thresholds[alert.severity];
    if (!escalationConfig) return;

    setTimeout(async () => {
      // Check if alert is still unresolved
      const currentAlert = this.activeAlerts.get(alert.id);
      if (currentAlert && !currentAlert.isResolved) {
        await this.escalateAlert(alert);
      }
    }, escalationConfig.delay);
  }

  private async escalateAlert(alert: KPIAlert): Promise<void> {
    const escalationConfig = this.monitoringConfig.alerting.escalation.thresholds[alert.severity];
    if (!escalationConfig) return;

    // Create escalated alert
    const escalatedAlert: KPIAlert = {
      ...alert,
      severity: alert.severity === 'high' ? 'critical' : 'high',
      message: `ESCALATED: ${alert.message}`,
      description: `${alert.description}\n\nThis alert has been escalated due to lack of resolution.`
    };

    // Send escalation notifications
    for (const recipient of escalationConfig.recipients) {
      console.log(`Escalation sent to ${recipient}: ${escalatedAlert.message}`);
    }
  }

  public async resolveAlert(alertId: string, resolvedBy: string, resolutionNotes?: string): Promise<void> {
    const alert = this.activeAlerts.get(alertId);
    if (!alert) {
      throw new Error(`Alert ${alertId} not found`);
    }

    // Update alert
    alert.isResolved = true;
    alert.resolvedAt = new Date();
    alert.resolvedBy = resolvedBy;

    // Update in database
    await this.supabase
      .from('kpi_alerts')
      .update({
        is_resolved: true,
        resolved_at: new Date().toISOString(),
        resolved_by: resolvedBy
      })
      .eq('id', alertId);

    // Remove from active alerts
    this.activeAlerts.delete(alertId);

    console.log(`Alert resolved: ${alert.message}`);
  }

  public async generateReport(
    period: 'daily' | 'weekly' | 'monthly' | 'quarterly',
    customDateRange?: { start: Date; end: Date }
  ): Promise<KPIReport> {
    const reportData = await this.collectReportData(period, customDateRange);

    const report: KPIReport = {
      id: crypto.randomUUID(),
      name: `${period.charAt(0).toUpperCase() + period.slice(1)} KPI Report`,
      description: `Comprehensive KPI report for ${period}`,
      period,
      generatedAt: new Date(),
      data: reportData
    };

    // Store report in database
    await this.supabase
      .from('kpi_reports')
      .insert({
        id: report.id,
        name: report.name,
        description: report.description,
        period,
        generated_at: report.generatedAt.toISOString(),
        data: report.data
      });

    return report;
  }

  private async collectReportData(
    period: 'daily' | 'weekly' | 'monthly' | 'quarterly',
    customDateRange?: { start: Date; end: Date }
  ): Promise<KPIReport['data']> {
    // Get date range for the report
    const endDate = customDateRange?.end || new Date();
    const startDate = customDateRange?.start || this.getReportStartDate(period, endDate);

    // Collect KPI data for the period
    const kpiData: KPIReport['data']['kpis'] = [];

    for (const kpi of this.kpiDefinitions.values()) {
      if (!kpi.isActive) continue;

      const { data: historicalData } = await this.supabase
        .from('performance_kpis')
        .select('kpi_value, measurement_date')
        .eq('kpi_name', kpi.name)
        .gte('measurement_date', startDate.toISOString().split('T')[0])
        .lte('measurement_date', endDate.toISOString().split('T')[0])
        .order('measurement_date', { ascending: false });

      if (historicalData && historicalData.length > 0) {
        const currentValue = historicalData[0].kpi_value;
        const previousValue = historicalData[1]?.kpi_value || currentValue;
        const change = currentValue - previousValue;
        const achievement = (currentValue / kpi.targets.target) * 100;
        const trend = change > 0 ? 'improving' : change < 0 ? 'declining' : 'stable';

        kpiData.push({
          kpiId: kpi.id,
          name: kpi.name,
          currentValue,
          target: kpi.targets.target,
          achievement,
          trend,
          change,
          changePeriod: this.getChangePeriod(period)
        });
      }
    }

    // Get alerts for the period
    const alerts = await this.collectAlertsForPeriod(startDate, endDate);

    // Generate insights
    const insights = this.generateReportInsights(kpiData, alerts);

    return {
      overview: {
        totalKPIs: kpiData.length,
        alertsCount: alerts.total,
        achievementsCount: kpiData.filter(k => k.achievement >= 100).length,
        performanceScore: this.calculateOverallPerformanceScore(kpiData)
      },
      kpis: kpiData,
      alerts,
      insights
    };
  }

  private getReportStartDate(period: string, endDate: Date): Date {
    const startDate = new Date(endDate);

    switch (period) {
      case 'daily':
        startDate.setDate(startDate.getDate() - 1);
        break;
      case 'weekly':
        startDate.setDate(startDate.getDate() - 7);
        break;
      case 'monthly':
        startDate.setMonth(startDate.getMonth() - 1);
        break;
      case 'quarterly':
        startDate.setMonth(startDate.getMonth() - 3);
        break;
    }

    return startDate;
  }

  private getChangePeriod(period: string): string {
    switch (period) {
      case 'daily':
        return 'vs yesterday';
      case 'weekly':
        return 'vs last week';
      case 'monthly':
        return 'vs last month';
      case 'quarterly':
        return 'vs last quarter';
      default:
        return 'vs previous period';
    }
  }

  private async collectAlertsForPeriod(startDate: Date, endDate: Date): Promise<KPIReport['data']['alerts']> {
    const { data: alerts } = await this.supabase
      .from('kpi_alerts')
      .select('*')
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString())
      .order('created_at', { ascending: false });

    if (!alerts) {
      return {
        type: 'No alerts',
        count: 0,
        severity: 'none',
        topAlerts: []
      };
    }

    const severityCount = alerts.reduce((acc, alert) => {
      acc[alert.severity] = (acc[alert.severity] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const topSeverity = Object.entries(severityCount)
      .sort(([, a], [, b]) => b - a)[0];

    return {
      type: 'Multiple alerts',
      count: alerts.length,
      severity: topSeverity?.[0] || 'none',
      topAlerts: alerts.slice(0, 5).map(alert => ({
        id: alert.id,
        kpiName: alert.kpi_name,
        alertType: alert.alert_type,
        severity: alert.severity,
        message: alert.message,
        currentValue: alert.current_value,
        thresholdValue: alert.threshold_value,
        timestamp: new Date(alert.created_at),
        isResolved: alert.is_resolved
      }))
    };
  }

  private generateReportInsights(
    kpiData: KPIReport['data']['kpis'],
    alerts: KPIReport['data']['alerts']
  ): KPIReport['data']['insights'] {
    const insights: KPIReport['data']['insights'] = [];

    // Achievement insights
    const topPerformers = kpiData
      .filter(k => k.achievement >= 120)
      .sort((a, b) => b.achievement - a.achievement)
      .slice(0, 3);

    for (const performer of topPerformers) {
      insights.push({
        title: `Outstanding Performance: ${performer.name}`,
        description: `${performer.name} exceeded target by ${performer.achievement - 100}%`,
        type: 'achievement',
        priority: 'high',
        relatedKPIs: [performer.kpiId]
      });
    }

    // Risk insights
    const underPerformers = kpiData
      .filter(k => k.achievement < 80)
      .sort((a, b) => a.achievement - b.achievement)
      .slice(0, 3);

    for (const performer of underPerformers) {
      insights.push({
        title: `Performance Concern: ${performer.name}`,
        description: `${performer.name} is performing at ${performer.achievement}% of target`,
        type: 'risk',
        priority: performer.achievement < 50 ? 'high' : 'medium',
        relatedKPIs: [performer.kpiId]
      });
    }

    // Alert-based insights
    if (alerts.count > 0) {
      insights.push({
        title: `Active Alerts: ${alerts.count} alerts in period`,
        description: `Multiple ${alerts.severity} severity alerts require attention`,
        type: 'risk',
        priority: alerts.severity === 'critical' ? 'high' : 'medium',
        relatedKPIs: alerts.topAlerts.map(a => a.kpiName)
      });
    }

    // Trend insights
    const improvingKPIs = kpiData.filter(k => k.trend === 'improving').length;
    const decliningKPIs = kpiData.filter(k => k.trend === 'declining').length;

    if (improvingKPIs > decliningKPIs) {
      insights.push({
        title: 'Positive Trend Detected',
        description: `${improvingKPIs} KPIs are showing improvement over the period`,
        type: 'opportunity',
        priority: 'medium',
        relatedKPIs: []
      });
    } else if (decliningKPIs > 0) {
      insights.push({
        title: 'Declining Performance Trend',
        description: `${decliningKPIs} KPIs are showing decline over the period`,
        type: 'risk',
        priority: 'high',
        relatedKPIs: []
      });
    }

    return insights;
  }

  private calculateOverallPerformanceScore(kpiData: KPIReport['data']['kpis']): number {
    if (kpiData.length === 0) return 0;

    const totalAchievement = kpiData.reduce((sum, k) => sum + k.achievement, 0);
    return totalAchievement / kpiData.length;
  }

  private async checkScheduledReports(): Promise<void> {
    const now = new Date();
    const currentHour = now.getHours();
    const currentDay = now.getDay();
    const currentDate = now.getDate();

    // Check daily report
    if (this.monitoringConfig.reporting.schedules.daily.enabled &&
        currentHour === 9 && now.getMinutes() === 0) {
      await this.generateAndSendReport('daily');
    }

    // Check weekly report (Monday 10:00)
    if (this.monitoringConfig.reporting.schedules.weekly.enabled &&
        currentDay === 1 && currentHour === 10 && now.getMinutes() === 0) {
      await this.generateAndSendReport('weekly');
    }

    // Check monthly report (1st 9:00)
    if (this.monitoringConfig.reporting.schedules.monthly.enabled &&
        currentDate === 1 && currentHour === 9 && now.getMinutes() === 0) {
      await this.generateAndSendReport('monthly');
    }
  }

  private async generateAndSendReport(period: 'daily' | 'weekly' | 'monthly'): Promise<void> {
    try {
      const report = await this.generateReport(period);

      // Get recipients for this report type
      const recipients = this.monitoringConfig.reporting.schedules[period].recipients;

      // Send report to recipients
      for (const recipient of recipients) {
        console.log(`Report sent to ${recipient}: ${report.name}`);
        // In a real implementation, would send email with report attachment
      }

    } catch (error) {
      console.error(`Failed to generate ${period} report:`, error);
    }
  }

  private formatValue(value: number, unit: KPIDefinition['unit']): string {
    switch (unit) {
      case 'currency':
        return new Intl.NumberFormat('pl-PL', {
          style: 'currency',
          currency: 'PLN'
        }).format(value);
      case 'percentage':
        return `${value.toFixed(1)}%`;
      case 'duration':
        return `${value} minutes`;
      default:
        return value.toLocaleString();
    }
  }

  public getKPIDefinitions(): KPIDefinition[] {
    return Array.from(this.kpiDefinitions.values());
  }

  public getActiveAlerts(): KPIAlert[] {
    return Array.from(this.activeAlerts.values()).filter(alert => !alert.isResolved);
  }

  public getKPIData(kpiId: string, daysBack?: number): Promise<KPIData[]> {
    const startDate = daysBack
      ? new Date(Date.now() - daysBack * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    return this.supabase
      .from('performance_kpis')
      .select('*')
      .eq('kpi_name', this.kpiDefinitions.get(kpiId)?.name || '')
      .gte('measurement_date', startDate)
      .order('measurement_date', { ascending: false })
      .then(({ data }) => (data || []).map(record => ({
        id: record.id,
        kpiId,
        value: record.kpi_value,
        timestamp: new Date(record.created_at),
        dimensions: {
          dimension1: record.dimension1,
          dimension2: record.dimension2,
          dimension3: record.dimension3
        },
        metadata: record.metadata
      })));
  }

  public stopMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
  }
}

// Create singleton instance
export const kpiTracking = new KPITracking();

// Export convenience functions
export const recordKPI = (
  kpiId: string,
  value: number,
  dimensions?: Record<string, any>,
  metadata?: Record<string, any>
) => kpiTracking.recordKPIValue(kpiId, value, dimensions, metadata);

export const generateKPIReport = (
  period: 'daily' | 'weekly' | 'monthly' | 'quarterly',
  customDateRange?: { start: Date; end: Date }
) => kpiTracking.generateReport(period, customDateRange);

export const resolveAlert = (alertId: string, resolvedBy: string, resolutionNotes?: string) =>
  kpiTracking.resolveAlert(alertId, resolvedBy, resolutionNotes);

export default kpiTracking;