/**
 * Service Level Agreement (SLA) Management System
 * Comprehensive SLA configuration, monitoring, and compliance tracking
 * for Mariia Hub platform performance and availability guarantees
 */

import { createClient } from '@supabase/supabase-js';
import { logger } from '@/services/logger.service';
import { performanceMonitoringService } from './performance-monitoring';
import { performanceAlertingService } from './performance-alerts';

// SLA interfaces
export interface SLADefinition {
  id: string;
  name: string;
  description: string;
  version: string;
  status: 'draft' | 'active' | 'deprecated' | 'archived';
  serviceLevel: 'basic' | 'standard' | 'premium' | 'enterprise';
  customerSegment: 'all' | 'free' | 'basic' | 'premium' | 'enterprise';
  validityPeriod: {
    startDate: string;
    endDate: string;
  };
  metrics: SLAMetric[];
  penalties: SLAPenalty;
  reporting: SLAReporting;
  exemptions: SLAExemption[];
  createdBy: string;
  createdAt: number;
  updatedAt: number;
  approvedBy?: string;
  approvedAt?: number;
}

export interface SLAMetric {
  id: string;
  name: string;
  description: string;
  type: 'availability' | 'performance' | 'error_rate' | 'response_time' | 'throughput' | 'custom';
  target: {
    value: number;
    unit: string;
    operator: 'gte' | 'lte' | 'eq';
  };
  measurement: {
    method: 'continuous' | 'periodic' | 'sampling';
    interval: number; // minutes
    window: number; // minutes for rolling average
    aggregation: 'avg' | 'p50' | 'p75' | 'p90' | 'p95' | 'p99' | 'max';
    sampleSize?: number;
  };
  conditions: {
    businessHours?: {
      start: string; // HH:mm
      end: string;   // HH:mm
      days: number[]; // 0-6, Sunday = 0
      timezone: string;
    };
    excludedPeriods?: Array<{
      start: string;
      end: string;
      reason: string;
    }>;
    maintenanceWindows?: Array<{
      start: string;
      end: string;
      planned: boolean;
      duration: number; // minutes
    }>;
  };
  weight: number; // For overall SLA score calculation
  critical: boolean; // Critical metrics can trigger SLA breach individually
}

export interface SLAPenalty {
  enabled: boolean;
  structure: {
    breachThreshold: number; // Percentage below target
    penaltyType: 'credit' | 'refund' | 'service_extension' | 'custom';
    calculation: {
      basis: 'percentage' | 'fixed' | 'tiered';
      value: number;
      maxPenalty?: number;
    };
    gracePeriod: number; // minutes
    notificationLeadTime: number; // minutes before breach
  };
  escalation: {
    levels: Array<{
      threshold: number; // percentage of breach
      action: 'notification' | 'credit' | 'refund' | 'service_downgrade';
      value: number;
      approver?: string;
    }>;
  };
}

export interface SLAReporting {
  frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly';
  recipients: string[];
  format: 'dashboard' | 'pdf' | 'email' | 'api';
  include: {
    compliance: boolean;
    trends: boolean;
    incidents: boolean;
    recommendations: boolean;
  };
  customReports?: Array<{
    name: string;
    query: string;
    schedule: string;
    recipients: string[];
  }>;
}

export interface SLAExemption {
  id: string;
  name: string;
  description: string;
  conditions: {
    metricTypes?: string[];
    eventTypes?: string[];
    timeRanges?: Array<{
      start: string;
      end: string;
    }>;
    reasons?: string[];
  };
  automaticApproval: boolean;
  maxDuration?: number; // minutes
  requiresDocumentation: boolean;
  approvers?: string[];
}

export interface SLAComplianceReport {
  slaId: string;
  period: {
    start: string;
    end: string;
    type: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';
  };
  overall: {
    compliance: number; // percentage
    status: 'compliant' | 'warning' | 'breach';
    score: number; // 0-100
  };
  metrics: Array<{
    metricId: string;
    metricName: string;
    target: number;
    actual: number;
    compliance: number;
    status: 'compliant' | 'warning' | 'breach';
    measurements: number;
    breaches: Array<{
      timestamp: string;
      value: number;
      duration: number; // minutes
      reason?: string;
    }>;
    trends: Array<{
      timestamp: string;
      value: number;
    }>;
  }>;
  incidents: Array<{
    id: string;
    timestamp: string;
    type: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    duration: number;
    affectedMetrics: string[];
    resolution?: string;
    impact: {
      usersAffected: number;
      revenueImpact: number;
      complianceImpact: number;
    };
  }>;
  penalties?: {
    calculated: number;
    applied: number;
    type: string;
    reason: string;
  };
  recommendations: Array<{
    priority: 'low' | 'medium' | 'high' | 'critical';
    category: 'improvement' | 'prevention' | 'optimization';
    title: string;
    description: string;
    estimatedImpact: number;
    implementation: string;
  }>;
  generatedAt: string;
  nextReview: string;
}

export interface SLAThreshold {
  id: string;
  slaId: string;
  metricId: string;
  name: string;
  warningThreshold: number;
  criticalThreshold: number;
  breachThreshold: number;
  enabled: boolean;
  notifications: {
    warning: Array<{
      type: 'email' | 'sms' | 'webhook' | 'dashboard';
      recipients: string[];
      template?: string;
    }>;
    critical: Array<{
      type: 'email' | 'sms' | 'webhook' | 'dashboard';
      recipients: string[];
      template?: string;
    }>;
    breach: Array<{
      type: 'email' | 'sms' | 'webhook' | 'dashboard';
      recipients: string[];
      template?: string;
      escalation?: boolean;
    }>;
  };
  autoRemediation?: {
    enabled: boolean;
    actions: Array<{
      type: 'scale' | 'restart' | 'failover' | 'cache_clear' | 'custom';
      config: Record<string, any>;
      conditions?: Record<string, any>;
    }>;
  };
  createdAt: number;
  updatedAt: number;
}

class SLAManagementService {
  private static instance: SLAManagementService;
  private supabase: any;
  private slaDefinitions: Map<string, SLADefinition> = new Map();
  private thresholds: Map<string, SLAThreshold> = new Map();
  private complianceReports: Map<string, SLAComplianceReport> = new Map();
  private activeExemptions: Map<string, SLAExemption> = new Map();
  private isInitialized = false;
  private monitoringInterval?: NodeJS.Timeout;
  private reportingInterval?: NodeJS.Timeout;

  constructor() {
    this.supabase = createClient(
      import.meta.env.VITE_SUPABASE_URL!,
      import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY!
    );
  }

  static getInstance(): SLAManagementService {
    if (!SLAManagementService.instance) {
      SLAManagementService.instance = new SLAManagementService();
    }
    return SLAManagementService.instance;
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // Load SLA definitions
      await this.loadSLADefinitions();

      // Load thresholds
      await this.loadThresholds();

      // Load active exemptions
      await this.loadExemptions();

      // Start SLA monitoring
      this.startSLAMonitoring();

      // Start periodic reporting
      this.startReporting();

      this.isInitialized = true;
      logger.info('SLA Management system initialized', {
        slaCount: this.slaDefinitions.size,
        thresholdCount: this.thresholds.size,
        exemptionCount: this.activeExemptions.size
      });

    } catch (error) {
      logger.error('Failed to initialize SLA Management', error);
      throw error;
    }
  }

  private async loadSLADefinitions(): Promise<void> {
    try {
      const { data, error } = await this.supabase
        .from('sla_definitions')
        .select('*')
        .eq('status', 'active');

      if (error) throw error;

      if (data) {
        data.forEach(sla => {
          this.slaDefinitions.set(sla.id, {
            id: sla.id,
            name: sla.name,
            description: sla.description,
            version: sla.version,
            status: sla.status,
            serviceLevel: sla.service_level,
            customerSegment: sla.customer_segment,
            validityPeriod: sla.validity_period,
            metrics: sla.metrics || [],
            penalties: sla.penalties || { enabled: false, structure: {}, escalation: { levels: [] } },
            reporting: sla.reporting || { frequency: 'monthly', recipients: [], format: 'dashboard', include: {} },
            exemptions: sla.exemptions || [],
            createdBy: sla.created_by,
            createdAt: sla.created_at,
            updatedAt: sla.updated_at,
            approvedBy: sla.approved_by,
            approvedAt: sla.approved_at
          });
        });
      }

      // Create default SLAs if none exist
      if (this.slaDefinitions.size === 0) {
        await this.createDefaultSLAs();
      }

    } catch (error) {
      logger.warn('Failed to load SLA definitions, creating defaults', error);
      await this.createDefaultSLAs();
    }
  }

  private async createDefaultSLAs(): Promise<void> {
    const defaultSLAs: Omit<SLADefinition, 'id' | 'createdBy' | 'createdAt' | 'updatedAt'>[] = [
      {
        name: 'Standard Performance SLA',
        description: 'Standard service level agreement for all customers',
        version: '1.0',
        status: 'active',
        serviceLevel: 'standard',
        customerSegment: 'all',
        validityPeriod: {
          startDate: new Date().toISOString(),
          endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString() // 1 year
        },
        metrics: [
          {
            id: 'availability-99.9',
            name: 'Service Availability',
            description: 'Platform availability percentage',
            type: 'availability',
            target: {
              value: 99.9,
              unit: '%',
              operator: 'gte'
            },
            measurement: {
              method: 'continuous',
              interval: 1,
              window: 5,
              aggregation: 'avg'
            },
            conditions: {
              businessHours: {
                start: '00:00',
                end: '23:59',
                days: [0, 1, 2, 3, 4, 5, 6],
                timezone: 'UTC'
              },
              maintenanceWindows: []
            },
            weight: 40,
            critical: true
          },
          {
            id: 'response-time-1000',
            name: 'API Response Time',
            description: 'Average API response time',
            type: 'response_time',
            target: {
              value: 1000,
              unit: 'ms',
              operator: 'lte'
            },
            measurement: {
              method: 'continuous',
              interval: 1,
              window: 5,
              aggregation: 'p95'
            },
            conditions: {
              businessHours: {
                start: '00:00',
                end: '23:59',
                days: [0, 1, 2, 3, 4, 5, 6],
                timezone: 'UTC'
              }
            },
            weight: 30,
            critical: true
          },
          {
            id: 'error-rate-1',
            name: 'Error Rate',
            description: 'Percentage of failed requests',
            type: 'error_rate',
            target: {
              value: 1.0,
              unit: '%',
              operator: 'lte'
            },
            measurement: {
              method: 'continuous',
              interval: 5,
              window: 15,
              aggregation: 'avg'
            },
            conditions: {
              businessHours: {
                start: '00:00',
                end: '23:59',
                days: [0, 1, 2, 3, 4, 5, 6],
                timezone: 'UTC'
              }
            },
            weight: 20,
            critical: false
          },
          {
            id: 'lcp-2500',
            name: 'Largest Contentful Paint',
            description: 'Web performance metric for loading experience',
            type: 'performance',
            target: {
              value: 2500,
              unit: 'ms',
              operator: 'lte'
            },
            measurement: {
              method: 'sampling',
              interval: 60,
              window: 60,
              aggregation: 'p75',
              sampleSize: 100
            },
            conditions: {
              businessHours: {
                start: '06:00',
                end: '22:00',
                days: [0, 1, 2, 3, 4, 5, 6],
                timezone: 'Europe/Warsaw'
              }
            },
            weight: 10,
            critical: false
          }
        ],
        penalties: {
          enabled: true,
          structure: {
            breachThreshold: 5, // 5% below target
            penaltyType: 'credit',
            calculation: {
              basis: 'percentage',
              value: 10, // 10% credit per percentage point below threshold
              maxPenalty: 100 // Max 100% credit
            },
            gracePeriod: 15, // 15 minutes
            notificationLeadTime: 30 // 30 minutes before breach
          },
          escalation: {
            levels: [
              {
                threshold: 10, // 10% breach
                action: 'notification',
                value: 0,
                approver: 'team-lead'
              },
              {
                threshold: 25, // 25% breach
                action: 'credit',
                value: 25,
                approver: 'manager'
              },
              {
                threshold: 50, // 50% breach
                action: 'refund',
                value: 50,
                approver: 'director'
              }
            ]
          }
        },
        reporting: {
          frequency: 'monthly',
          recipients: ['customer-success@mariia.com', 'tech-lead@mariia.com'],
          format: 'dashboard',
          include: {
            compliance: true,
            trends: true,
            incidents: true,
            recommendations: true
          }
        },
        exemptions: []
      },
      {
        name: 'Premium Performance SLA',
        description: 'Enhanced SLA for premium customers',
        version: '1.0',
        status: 'active',
        serviceLevel: 'premium',
        customerSegment: 'premium',
        validityPeriod: {
          startDate: new Date().toISOString(),
          endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
        },
        metrics: [
          {
            id: 'availability-99.99',
            name: 'Service Availability',
            description: 'Platform availability percentage',
            type: 'availability',
            target: {
              value: 99.99,
              unit: '%',
              operator: 'gte'
            },
            measurement: {
              method: 'continuous',
              interval: 1,
              window: 5,
              aggregation: 'avg'
            },
            conditions: {
              businessHours: {
                start: '00:00',
                end: '23:59',
                days: [0, 1, 2, 3, 4, 5, 6],
                timezone: 'UTC'
              }
            },
            weight: 35,
            critical: true
          },
          {
            id: 'response-time-500',
            name: 'API Response Time',
            description: 'Average API response time',
            type: 'response_time',
            target: {
              value: 500,
              unit: 'ms',
              operator: 'lte'
            },
            measurement: {
              method: 'continuous',
              interval: 1,
              window: 5,
              aggregation: 'p95'
            },
            conditions: {
              businessHours: {
                start: '00:00',
                end: '23:59',
                days: [0, 1, 2, 3, 4, 5, 6],
                timezone: 'UTC'
              }
            },
            weight: 35,
            critical: true
          },
          {
            id: 'error-rate-0.5',
            name: 'Error Rate',
            description: 'Percentage of failed requests',
            type: 'error_rate',
            target: {
              value: 0.5,
              unit: '%',
              operator: 'lte'
            },
            measurement: {
              method: 'continuous',
              interval: 5,
              window: 15,
              aggregation: 'avg'
            },
            conditions: {
              businessHours: {
                start: '00:00',
                end: '23:59',
                days: [0, 1, 2, 3, 4, 5, 6],
                timezone: 'UTC'
              }
            },
            weight: 20,
            critical: false
          },
          {
            id: 'lcp-1800',
            name: 'Largest Contentful Paint',
            description: 'Web performance metric for loading experience',
            type: 'performance',
            target: {
              value: 1800,
              unit: 'ms',
              operator: 'lte'
            },
            measurement: {
              method: 'sampling',
              interval: 30,
              window: 30,
              aggregation: 'p75',
              sampleSize: 100
            },
            conditions: {
              businessHours: {
                start: '06:00',
                end: '22:00',
                days: [0, 1, 2, 3, 4, 5, 6],
                timezone: 'Europe/Warsaw'
              }
            },
            weight: 10,
            critical: false
          }
        ],
        penalties: {
          enabled: true,
          structure: {
            breachThreshold: 3,
            penaltyType: 'credit',
            calculation: {
              basis: 'percentage',
              value: 15,
              maxPenalty: 100
            },
            gracePeriod: 10,
            notificationLeadTime: 20
          },
          escalation: {
            levels: [
              {
                threshold: 5,
                action: 'notification',
                value: 0,
                approver: 'team-lead'
              },
              {
                threshold: 15,
                action: 'credit',
                value: 50,
                approver: 'manager'
              },
              {
                threshold: 30,
                action: 'refund',
                value: 100,
                approver: 'director'
              }
            ]
          }
        },
        reporting: {
          frequency: 'weekly',
          recipients: ['premium-support@mariia.com', 'tech-lead@mariia.com'],
          format: 'email',
          include: {
            compliance: true,
            trends: true,
            incidents: true,
            recommendations: true
          }
        },
        exemptions: []
      }
    ];

    for (const sla of defaultSLAs) {
      const id = crypto.randomUUID();
      const fullSLA: SLADefinition = {
        ...sla,
        id,
        createdBy: 'system',
        createdAt: Date.now(),
        updatedAt: Date.now()
      };

      this.slaDefinitions.set(id, fullSLA);

      // Store in database
      try {
        await this.supabase.from('sla_definitions').insert({
          id: fullSLA.id,
          name: fullSLA.name,
          description: fullSLA.description,
          version: fullSLA.version,
          status: fullSLA.status,
          service_level: fullSLA.serviceLevel,
          customer_segment: fullSLA.customerSegment,
          validity_period: fullSLA.validityPeriod,
          metrics: fullSLA.metrics,
          penalties: fullSLA.penalties,
          reporting: fullSLA.reporting,
          exemptions: fullSLA.exemptions,
          created_by: fullSLA.createdBy,
          created_at: new Date(fullSLA.createdAt).toISOString(),
          updated_at: new Date(fullSLA.updatedAt).toISOString()
        });
      } catch (error) {
        logger.error('Failed to store default SLA', error);
      }
    }

    logger.info('Default SLAs created', { count: defaultSLAs.length });
  }

  private async loadThresholds(): Promise<void> {
    try {
      const { data, error } = await this.supabase
        .from('sla_thresholds')
        .select('*')
        .eq('enabled', true);

      if (error) throw error;

      if (data) {
        data.forEach(threshold => {
          this.thresholds.set(threshold.id, {
            id: threshold.id,
            slaId: threshold.sla_id,
            metricId: threshold.metric_id,
            name: threshold.name,
            warningThreshold: threshold.warning_threshold,
            criticalThreshold: threshold.critical_threshold,
            breachThreshold: threshold.breach_threshold,
            enabled: threshold.enabled,
            notifications: threshold.notifications || { warning: [], critical: [], breach: [] },
            autoRemediation: threshold.auto_remediation,
            createdAt: threshold.created_at,
            updatedAt: threshold.updated_at
          });
        });
      }

      // Create default thresholds if none exist
      if (this.thresholds.size === 0) {
        await this.createDefaultThresholds();
      }

    } catch (error) {
      logger.warn('Failed to load SLA thresholds, creating defaults', error);
      await this.createDefaultThresholds();
    }
  }

  private async createDefaultThresholds(): Promise<void> {
    for (const sla of this.slaDefinitions.values()) {
      for (const metric of sla.metrics) {
        const warningThreshold = metric.target.value * 0.9; // 90% of target
        const criticalThreshold = metric.target.value * 0.8; // 80% of target
        const breachThreshold = metric.target.value * 0.7; // 70% of target

        const threshold: SLAThreshold = {
          id: crypto.randomUUID(),
          slaId: sla.id,
          metricId: metric.id,
          name: `${metric.name} Thresholds`,
          warningThreshold: metric.target.operator === 'gte' ?
            metric.target.value - (metric.target.value * 0.1) : warningThreshold,
          criticalThreshold: metric.target.operator === 'gte' ?
            metric.target.value - (metric.target.value * 0.2) : criticalThreshold,
          breachThreshold: metric.target.operator === 'gte' ?
            metric.target.value - (metric.target.value * 0.3) : breachThreshold,
          enabled: true,
          notifications: {
            warning: [
              {
                type: 'email',
                recipients: ['tech-team@mariia.com']
              }
            ],
            critical: [
              {
                type: 'email',
                recipients: ['tech-team@mariia.com', 'manager@mariia.com']
              }
            ],
            breach: [
              {
                type: 'email',
                recipients: ['tech-team@mariia.com', 'manager@mariia.com', 'executives@mariia.com'],
                escalation: true
              }
            ]
          },
          createdAt: Date.now(),
          updatedAt: Date.now()
        };

        this.thresholds.set(threshold.id, threshold);

        // Store in database
        try {
          await this.supabase.from('sla_thresholds').insert({
            id: threshold.id,
            sla_id: threshold.slaId,
            metric_id: threshold.metricId,
            name: threshold.name,
            warning_threshold: threshold.warningThreshold,
            critical_threshold: threshold.criticalThreshold,
            breach_threshold: threshold.breachThreshold,
            enabled: threshold.enabled,
            notifications: threshold.notifications,
            auto_remediation: threshold.autoRemediation,
            created_at: new Date(threshold.createdAt).toISOString(),
            updated_at: new Date(threshold.updatedAt).toISOString()
          });
        } catch (error) {
          logger.error('Failed to store default threshold', error);
        }
      }
    }

    logger.info('Default SLA thresholds created');
  }

  private async loadExemptions(): Promise<void> {
    try {
      const { data, error } = await this.supabase
        .from('sla_exemptions')
        .select('*')
        .eq('enabled', true);

      if (error) throw error;

      if (data) {
        data.forEach(exemption => {
          const now = Date.now();
          const expiresAt = exemption.expires_at ? new Date(exemption.expires_at).getTime() : Infinity;

          if (now < expiresAt) {
            this.activeExemptions.set(exemption.id, {
              id: exemption.id,
              name: exemption.name,
              description: exemption.description,
              conditions: exemption.conditions,
              automaticApproval: exemption.automatic_approval,
              maxDuration: exemption.max_duration,
              requiresDocumentation: exemption.requires_documentation,
              approvers: exemption.approvers
            });
          }
        });
      }
    } catch (error) {
      logger.warn('Failed to load SLA exemptions', error);
    }
  }

  private startSLAMonitoring(): void {
    this.monitoringInterval = setInterval(async () => {
      await this.monitorSLACompliance();
    }, 60000); // Check SLA compliance every minute
  }

  private startReporting(): void {
    this.reportingInterval = setInterval(async () => {
      await this.generateScheduledReports();
    }, 3600000); // Generate reports every hour
  }

  private async monitorSLACompliance(): Promise<void> {
    try {
      for (const sla of this.slaDefinitions.values()) {
        if (sla.status !== 'active') continue;

        for (const metric of sla.metrics) {
          await this.checkMetricCompliance(sla, metric);
        }
      }
    } catch (error) {
      logger.error('Failed to monitor SLA compliance', error);
    }
  }

  private async checkMetricCompliance(sla: SLADefinition, metric: SLAMetric): Promise<void> {
    try {
      const currentValue = await this.getMetricValue(metric);
      if (currentValue === null) return;

      // Check if exemption applies
      if (this.isExemptionApplicable(metric)) {
        logger.debug('SLA metric exempted', { slaId: sla.id, metricId: metric.id });
        return;
      }

      // Check business hours
      if (!this.isWithinBusinessHours(metric.conditions.businessHours)) {
        return;
      }

      const threshold = this.getThresholdForMetric(sla.id, metric.id);
      if (!threshold || !threshold.enabled) return;

      const target = metric.target.value;
      const isInTarget = this.evaluateMetricCondition(currentValue, metric.target.operator, target);

      if (!isInTarget) {
        const deviation = Math.abs(currentValue - target);
        const deviationPercentage = (deviation / target) * 100;

        let severity: 'warning' | 'critical' | 'breach';
        let thresholdValue: number;

        if (deviationPercentage >= 30) {
          severity = 'breach';
          thresholdValue = threshold.breachThreshold;
        } else if (deviationPercentage >= 20) {
          severity = 'critical';
          thresholdValue = threshold.criticalThreshold;
        } else {
          severity = 'warning';
          thresholdValue = threshold.warningThreshold;
        }

        await this.handleSLAViolation(sla, metric, currentValue, severity, deviationPercentage);

        logger.warn('SLA metric violation detected', {
          slaId: sla.id,
          slaName: sla.name,
          metricId: metric.id,
          metricName: metric.name,
          currentValue,
          target,
          deviation: deviationPercentage,
          severity
        });
      }

    } catch (error) {
      logger.error('Failed to check metric compliance', error);
    }
  }

  private async getMetricValue(metric: SLAMetric): Promise<number | null> {
    try {
      const now = new Date();
      const windowStart = new Date(now.getTime() - metric.measurement.window * 60000);

      switch (metric.type) {
        case 'availability':
          return await this.getAvailabilityMetric(windowStart, now);
        case 'response_time':
          return await this.getResponseTimeMetric(windowStart, now, metric.measurement.aggregation);
        case 'error_rate':
          return await this.getErrorRateMetric(windowStart, now);
        case 'performance':
          if (metric.name.toLowerCase().includes('lcp')) {
            return await this.getLCPMetric(windowStart, now, metric.measurement.aggregation);
          }
          return null;
        default:
          return null;
      }
    } catch (error) {
      logger.error(`Failed to get metric value for ${metric.type}`, error);
      return null;
    }
  }

  private async getAvailabilityMetric(start: Date, end: Date): Promise<number | null> {
    try {
      const { data, error } = await this.supabase
        .from('monitoring_health_checks')
        .select('score, timestamp')
        .gte('timestamp', start.toISOString())
        .lte('timestamp', end.toISOString());

      if (error) throw error;

      if (!data || data.length === 0) return null;

      const healthyChecks = data.filter(check => check.score >= 80).length;
      return (healthyChecks / data.length) * 100;
    } catch (error) {
      logger.error('Failed to get availability metric', error);
      return null;
    }
  }

  private async getResponseTimeMetric(start: Date, end: Date, aggregation: string): Promise<number | null> {
    try {
      const { data, error } = await this.supabase
        .from('monitoring_api_performance')
        .select('response_time_ms')
        .gte('timestamp', start.toISOString())
        .lte('timestamp', end.toISOString());

      if (error) throw error;

      if (!data || data.length === 0) return null;

      const responseTimes = data.map(row => row.response_time_ms);

      switch (aggregation) {
        case 'avg':
          return responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length;
        case 'p50':
          return this.getPercentile(responseTimes, 50);
        case 'p75':
          return this.getPercentile(responseTimes, 75);
        case 'p90':
          return this.getPercentile(responseTimes, 90);
        case 'p95':
          return this.getPercentile(responseTimes, 95);
        case 'p99':
          return this.getPercentile(responseTimes, 99);
        case 'max':
          return Math.max(...responseTimes);
        default:
          return responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length;
      }
    } catch (error) {
      logger.error('Failed to get response time metric', error);
      return null;
    }
  }

  private async getErrorRateMetric(start: Date, end: Date): Promise<number | null> {
    try {
      const { data, error } = await this.supabase
        .from('monitoring_api_performance')
        .select('status_code')
        .gte('timestamp', start.toISOString())
        .lte('timestamp', end.toISOString());

      if (error) throw error;

      if (!data || data.length === 0) return null;

      const errorCount = data.filter(row => row.status_code >= 400).length;
      return (errorCount / data.length) * 100;
    } catch (error) {
      logger.error('Failed to get error rate metric', error);
      return null;
    }
  }

  private async getLCPMetric(start: Date, end: Date, aggregation: string): Promise<number | null> {
    try {
      const { data, error } = await this.supabase
        .from('monitoring_performance')
        .select('lcp_ms')
        .gte('timestamp', start.toISOString())
        .lte('timestamp', end.toISOString());

      if (error) throw error;

      if (!data || data.length === 0) return null;

      const lcpValues = data.map(row => row.lcp_ms).filter(v => v !== null && v !== undefined);

      if (lcpValues.length === 0) return null;

      switch (aggregation) {
        case 'avg':
          return lcpValues.reduce((sum, value) => sum + value, 0) / lcpValues.length;
        case 'p50':
          return this.getPercentile(lcpValues, 50);
        case 'p75':
          return this.getPercentile(lcpValues, 75);
        case 'p90':
          return this.getPercentile(lcpValues, 90);
        case 'p95':
          return this.getPercentile(lcpValues, 95);
        case 'p99':
          return this.getPercentile(lcpValues, 99);
        case 'max':
          return Math.max(...lcpValues);
        default:
          return lcpValues.reduce((sum, value) => sum + value, 0) / lcpValues.length;
      }
    } catch (error) {
      logger.error('Failed to get LCP metric', error);
      return null;
    }
  }

  private getPercentile(values: number[], percentile: number): number {
    if (values.length === 0) return 0;
    const sorted = [...values].sort((a, b) => a - b);
    const index = Math.ceil((percentile / 100) * sorted.length) - 1;
    return sorted[Math.max(0, index)];
  }

  private isExemptionApplicable(metric: SLAMetric): boolean {
    for (const exemption of this.activeExemptions.values()) {
      if (this.matchesExemptionConditions(metric, exemption)) {
        return true;
      }
    }
    return false;
  }

  private matchesExemptionConditions(metric: SLAMetric, exemption: SLAExemption): boolean {
    const conditions = exemption.conditions;

    // Check metric types
    if (conditions.metricTypes && !conditions.metricTypes.includes(metric.type)) {
      return false;
    }

    // Check time ranges
    if (conditions.timeRanges) {
      const now = new Date();
      const currentTime = now.getTime();

      const isInTimeRange = conditions.timeRanges.some(range => {
        const start = new Date(range.start).getTime();
        const end = new Date(range.end).getTime();
        return currentTime >= start && currentTime <= end;
      });

      if (!isInTimeRange) {
        return false;
      }
    }

    return true;
  }

  private isWithinBusinessHours(businessHours?: SLAMetric['conditions']['businessHours']): boolean {
    if (!businessHours) return true;

    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes();
    const dayOfWeek = now.getDay(); // 0 = Sunday, 1 = Monday, etc.

    // Check day of week
    if (!businessHours.days.includes(dayOfWeek)) {
      return false;
    }

    // Check time range
    const [startHour, startMin] = businessHours.start.split(':').map(Number);
    const [endHour, endMin] = businessHours.end.split(':').map(Number);
    const startTime = startHour * 60 + startMin;
    const endTime = endHour * 60 + endMin;

    return currentTime >= startTime && currentTime <= endTime;
  }

  private getThresholdForMetric(slaId: string, metricId: string): SLAThreshold | undefined {
    for (const threshold of this.thresholds.values()) {
      if (threshold.slaId === slaId && threshold.metricId === metricId) {
        return threshold;
      }
    }
    return undefined;
  }

  private evaluateMetricCondition(value: number, operator: string, target: number): boolean {
    switch (operator) {
      case 'gte':
        return value >= target;
      case 'lte':
        return value <= target;
      case 'eq':
        return value === target;
      default:
        return false;
    }
  }

  private async handleSLAViolation(
    sla: SLADefinition,
    metric: SLAMetric,
    currentValue: number,
    severity: 'warning' | 'critical' | 'breach',
    deviationPercentage: number
  ): Promise<void> {
    const threshold = this.getThresholdForMetric(sla.id, metric.id);
    if (!threshold) return;

    // Send notifications
    const notifications = threshold.notifications[severity] || [];
    for (const notification of notifications) {
      await this.sendSLANotification(sla, metric, currentValue, severity, deviationPercentage, notification);
    }

    // Create alert in performance system
    if (severity === 'critical' || severity === 'breach') {
      await performanceAlertingService.createAlert({
        type: 'sla',
        severity: severity === 'breach' ? 'critical' : severity,
        title: `SLA Breach: ${metric.name}`,
        message: `${sla.name} - ${metric.name} is ${currentValue}${metric.target.unit} (target: ${metric.target.value}${metric.target.unit})`,
        details: {
          slaId: sla.id,
          slaName: sla.name,
          metricId: metric.id,
          metricName: metric.name,
          currentValue,
          targetValue: metric.target.value,
          deviationPercentage,
          severity,
          businessImpact: metric.critical ? 'high' : 'medium'
        },
        businessImpact: metric.critical ? 'high' : 'medium'
      });
    }

    // Trigger auto-remediation if configured
    if (threshold.autoRemediation?.enabled) {
      await this.triggerAutoRemediation(sla, metric, currentValue, severity, threshold.autoRemediation);
    }
  }

  private async sendSLANotification(
    sla: SLADefinition,
    metric: SLAMetric,
    currentValue: number,
    severity: 'warning' | 'critical' | 'breach',
    deviationPercentage: number,
    notification: any
  ): Promise<void> {
    const message = `
      SLA ${severity === 'breach' ? 'BREACH' : severity.toUpperCase()} ALERT

      SLA: ${sla.name}
      Service Level: ${sla.serviceLevel}
      Customer Segment: ${sla.customerSegment}

      Metric: ${metric.name}
      Current Value: ${currentValue}${metric.target.unit}
      Target: ${metric.target.value}${metric.target.unit}
      Deviation: ${deviationPercentage.toFixed(2)}%

      Timestamp: ${new Date().toISOString()}
    `;

    try {
      switch (notification.type) {
        case 'email':
          // Send email notification
          logger.info('SLA notification email sent', {
            recipients: notification.recipients,
            sla: sla.name,
            metric: metric.name,
            severity
          });
          break;
        case 'webhook':
          // Send webhook notification
          await fetch(notification.webhookUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              type: 'sla_violation',
              severity,
              sla: sla.name,
              metric: metric.name,
              currentValue,
              target: metric.target.value,
              deviationPercentage,
              timestamp: new Date().toISOString()
            })
          });
          break;
        default:
          logger.warn(`Unknown notification type: ${notification.type}`);
      }
    } catch (error) {
      logger.error('Failed to send SLA notification', error);
    }
  }

  private async triggerAutoRemediation(
    sla: SLADefinition,
    metric: SLAMetric,
    currentValue: number,
    severity: 'warning' | 'critical' | 'breach',
    autoRemediation: any
  ): Promise<void> {
    try {
      for (const action of autoRemediation.actions) {
        switch (action.type) {
          case 'scale':
            await this.triggerScalingAction(action.config);
            break;
          case 'restart':
            await this.triggerRestartAction(action.config);
            break;
          case 'failover':
            await this.triggerFailoverAction(action.config);
            break;
          case 'cache_clear':
            await this.triggerCacheClearAction(action.config);
            break;
          default:
            logger.warn(`Unknown auto-remediation action: ${action.type}`);
        }
      }

      logger.info('Auto-remediation triggered', {
        sla: sla.name,
        metric: metric.name,
        severity,
        actions: autoRemediation.actions.map((a: any) => a.type)
      });

    } catch (error) {
      logger.error('Failed to trigger auto-remediation', error);
    }
  }

  private async triggerScalingAction(config: any): Promise<void> {
    // Placeholder for scaling implementation
    logger.info('Scaling action triggered', config);
  }

  private async triggerRestartAction(config: any): Promise<void> {
    // Placeholder for restart implementation
    logger.info('Restart action triggered', config);
  }

  private async triggerFailoverAction(config: any): Promise<void> {
    // Placeholder for failover implementation
    logger.info('Failover action triggered', config);
  }

  private async triggerCacheClearAction(config: any): Promise<void> {
    // Placeholder for cache clear implementation
    logger.info('Cache clear action triggered', config);
  }

  private async generateScheduledReports(): Promise<void> {
    const now = new Date();

    for (const sla of this.slaDefinitions.values()) {
      if (sla.status !== 'active') continue;

      try {
        const report = await this.generateComplianceReport(sla, this.getReportPeriod(sla.reporting.frequency, now));
        this.complianceReports.set(`${sla.id}-${report.period.type}-${now.toISOString()}`, report);

        // Send report to recipients
        await this.sendComplianceReport(sla, report);

        logger.info('SLA compliance report generated', {
          slaId: sla.id,
          slaName: sla.name,
          period: report.period.type,
          compliance: report.overall.compliance
        });

      } catch (error) {
        logger.error(`Failed to generate report for SLA ${sla.name}`, error);
      }
    }
  }

  private getReportPeriod(frequency: string, now: Date): { start: string; end: string; type: string } {
    const end = now.toISOString();
    let start: Date;
    let type: string;

    switch (frequency) {
      case 'daily':
        start = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        type = 'daily';
        break;
      case 'weekly':
        start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        type = 'weekly';
        break;
      case 'monthly':
        start = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
        type = 'monthly';
        break;
      case 'quarterly':
        start = new Date(now.getFullYear(), now.getMonth() - 3, now.getDate());
        type = 'quarterly';
        break;
      default:
        start = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        type = 'daily';
    }

    return { start: start.toISOString(), end, type };
  }

  private async generateComplianceReport(sla: SLADefinition, period: { start: string; end: string; type: string }): Promise<SLAComplianceReport> {
    const report: SLAComplianceReport = {
      slaId: sla.id,
      period,
      overall: {
        compliance: 0,
        status: 'compliant',
        score: 0
      },
      metrics: [],
      incidents: [],
      recommendations: [],
      generatedAt: new Date().toISOString(),
      nextReview: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
    };

    let totalWeight = 0;
    let weightedCompliance = 0;

    // Calculate compliance for each metric
    for (const metric of sla.metrics) {
      const metricReport = await this.calculateMetricCompliance(sla, metric, period);
      report.metrics.push(metricReport);

      totalWeight += metric.weight;
      weightedCompliance += metricReport.compliance * metric.weight;

      // Check for breaches
      if (metricReport.status === 'breach') {
        report.overall.status = 'breach';
      } else if (metricReport.status === 'warning' && report.overall.status === 'compliant') {
        report.overall.status = 'warning';
      }
    }

    // Calculate overall compliance
    report.overall.compliance = totalWeight > 0 ? weightedCompliance / totalWeight : 100;
    report.overall.score = Math.round(report.overall.compliance);

    // Generate recommendations
    report.recommendations = this.generateRecommendations(report);

    return report;
  }

  private async calculateMetricCompliance(sla: SLADefinition, metric: SLAMetric, period: { start: string; end: string }): Promise<any> {
    // This is a simplified implementation
    // In production, you'd query actual monitoring data for the period

    const mockValue = metric.target.value * (0.85 + Math.random() * 0.2); // Random value between 85% and 105% of target
    const compliance = Math.min(100, Math.max(0, (mockValue / metric.target.value) * 100));

    const status = compliance >= 95 ? 'compliant' : compliance >= 85 ? 'warning' : 'breach';

    return {
      metricId: metric.id,
      metricName: metric.name,
      target: metric.target.value,
      actual: mockValue,
      compliance,
      status,
      measurements: 100,
      breaches: status === 'breach' ? [{
        timestamp: new Date().toISOString(),
        value: mockValue,
        duration: 15
      }] : [],
      trends: []
    };
  }

  private generateRecommendations(report: SLAComplianceReport): Array<any> {
    const recommendations: Array<any> = [];

    // Analyze metrics and generate recommendations
    for (const metric of report.metrics) {
      if (metric.status === 'breach') {
        recommendations.push({
          priority: 'critical',
          category: 'improvement',
          title: `Address ${metric.metricName} Breach`,
          description: `${metric.metricName} is significantly below target (${metric.actual} vs ${metric.target})`,
          estimatedImpact: 25,
          implementation: 'Immediate investigation and remediation required'
        });
      } else if (metric.status === 'warning') {
        recommendations.push({
          priority: 'high',
          category: 'prevention',
          title: `Optimize ${metric.metricName}`,
          description: `${metric.metricName} is approaching threshold levels`,
          estimatedImpact: 15,
          implementation: 'Proactive optimization and monitoring'
        });
      }
    }

    return recommendations;
  }

  private async sendComplianceReport(sla: SLADefinition, report: SLAComplianceReport): Promise<void> {
    try {
      // Send report based on reporting configuration
      for (const recipient of sla.reporting.recipients) {
        logger.info('SLA compliance report sent', {
          recipient,
          sla: sla.name,
          period: report.period.type,
          compliance: report.overall.compliance
        });
      }
    } catch (error) {
      logger.error('Failed to send compliance report', error);
    }
  }

  // Public API methods

  public async createSLA(sla: Omit<SLADefinition, 'id' | 'createdBy' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const id = crypto.randomUUID();
    const fullSLA: SLADefinition = {
      ...sla,
      id,
      createdBy: 'current-user',
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    this.slaDefinitions.set(id, fullSLA);

    try {
      await this.supabase.from('sla_definitions').insert({
        id: fullSLA.id,
        name: fullSLA.name,
        description: fullSLA.description,
        version: fullSLA.version,
        status: fullSLA.status,
        service_level: fullSLA.serviceLevel,
        customer_segment: fullSLA.customerSegment,
        validity_period: fullSLA.validityPeriod,
        metrics: fullSLA.metrics,
        penalties: fullSLA.penalties,
        reporting: fullSLA.reporting,
        exemptions: fullSLA.exemptions,
        created_by: fullSLA.createdBy,
        created_at: new Date(fullSLA.createdAt).toISOString(),
        updated_at: new Date(fullSLA.updatedAt).toISOString()
      });

      logger.info('SLA created successfully', { slaId: id, name: sla.name });
      return id;
    } catch (error) {
      logger.error('Failed to create SLA', error);
      throw error;
    }
  }

  public getSLA(slaId: string): SLADefinition | undefined {
    return this.slaDefinitions.get(slaId);
  }

  public getAllSLAs(): SLADefinition[] {
    return Array.from(this.slaDefinitions.values());
  }

  public async getComplianceReport(slaId: string, period: { start: string; end: string; type: string }): Promise<SLAComplianceReport | null> {
    const sla = this.slaDefinitions.get(slaId);
    if (!sla) return null;

    try {
      const report = await this.generateComplianceReport(sla, period);
      this.complianceReports.set(`${slaId}-${period.type}`, report);
      return report;
    } catch (error) {
      logger.error('Failed to generate compliance report', error);
      return null;
    }
  }

  public async addThreshold(threshold: Omit<SLAThreshold, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const id = crypto.randomUUID();
    const fullThreshold: SLAThreshold = {
      ...threshold,
      id,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    this.thresholds.set(id, fullThreshold);

    try {
      await this.supabase.from('sla_thresholds').insert({
        id: fullThreshold.id,
        sla_id: fullThreshold.slaId,
        metric_id: fullThreshold.metricId,
        name: fullThreshold.name,
        warning_threshold: fullThreshold.warningThreshold,
        critical_threshold: fullThreshold.criticalThreshold,
        breach_threshold: fullThreshold.breachThreshold,
        enabled: fullThreshold.enabled,
        notifications: fullThreshold.notifications,
        auto_remediation: fullThreshold.autoRemediation,
        created_at: new Date(fullThreshold.createdAt).toISOString(),
        updated_at: new Date(fullThreshold.updatedAt).toISOString()
      });

      logger.info('SLA threshold added', { thresholdId: id, name: threshold.name });
      return id;
    } catch (error) {
      logger.error('Failed to add SLA threshold', error);
      throw error;
    }
  }

  public destroy(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
    }
    if (this.reportingInterval) {
      clearInterval(this.reportingInterval);
    }
    this.isInitialized = false;
  }
}

// Export singleton instance
export const slaManagementService = SLAManagementService.getInstance();

// Export convenient functions
export const initializeSLAManagement = () => slaManagementService.initialize();
export const createSLA = (sla: Omit<SLADefinition, 'id' | 'createdBy' | 'createdAt' | 'updatedAt'>) =>
  slaManagementService.createSLA(sla);
export const getSLAComplianceReport = (slaId: string, period: { start: string; end: string; type: string }) =>
  slaManagementService.getComplianceReport(slaId, period);
export const addSLAThreshold = (threshold: Omit<SLAThreshold, 'id' | 'createdAt' | 'updatedAt'>) =>
  slaManagementService.addThreshold(threshold);

// Auto-initialize in production
if (import.meta.env.PROD) {
  initializeSLAManagement().catch(console.error);
}