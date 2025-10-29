/**
 * Security-Performance Integration Module
 * Bridges performance monitoring with existing security infrastructure
 * Provides unified observability for security and performance events
 */

import { performanceMonitoringService } from './performance-monitoring';
import { performanceAlertingService } from './performance-alerts';
import { logger } from '@/services/logger.service';

// Security-Performance correlation interfaces
export interface SecurityPerformanceEvent {
  id: string;
  timestamp: number;
  type: 'security' | 'performance' | 'hybrid';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  source: string;
  details: {
    securityEvent?: SecurityEventDetails;
    performanceEvent?: PerformanceEventDetails;
    correlation?: CorrelationDetails;
    impact: ImpactAnalysis;
  };
  sessionId?: string;
  userId?: string;
  ipAddress?: string;
  userAgent?: string;
  resolved: boolean;
  acknowledged: boolean;
  tags: string[];
}

export interface SecurityEventDetails {
  eventType: string;
  threatLevel: 'low' | 'medium' | 'high' | 'critical';
  category: 'authentication' | 'authorization' | 'data_breach' | 'injection' | 'xss' | 'csrf' | 'ddos' | 'malware';
  source: string;
  target: string;
  blocked: boolean;
  mitigation?: string;
  forensicData?: Record<string, any>;
}

export interface PerformanceEventDetails {
  metric: string;
  value: number;
  threshold: number;
  baseline?: number;
  deviation?: number;
  affectedComponents?: string[];
  businessImpact: 'low' | 'medium' | 'high' | 'critical';
}

export interface CorrelationDetails {
  correlationScore: number; // 0-100 confidence score
  correlationType: 'causal' | 'coincidental' | 'related';
  timeWindow: number; // ms
  relatedEvents: string[]; // Event IDs
  hypotheses: string[];
  investigationRequired: boolean;
}

export interface ImpactAnalysis {
  performanceImpact: {
    responseTimeIncrease?: number;
    throughputDecrease?: number;
    errorRateIncrease?: number;
    availabilityDecrease?: number;
  };
  securityImpact: {
    riskScoreIncrease?: number;
    vulnerabilitiesExposed?: number;
    dataCompromised?: boolean;
    unauthorizedAccess?: boolean;
  };
  businessImpact: {
    revenueImpact?: number;
    userImpact?: number;
    brandImpact?: number;
    complianceRisk?: 'low' | 'medium' | 'high' | 'critical';
  };
  affectedUsers?: number;
  affectedSystems?: string[];
}

export interface SecurityPerformanceRule {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  triggerConditions: {
    securityConditions: SecurityCondition[];
    performanceConditions: PerformanceCondition[];
    correlationLogic: 'AND' | 'OR' | 'CUSTOM';
    timeWindow: number; // ms
    correlationThreshold: number; // 0-100
  };
  actions: SecurityPerformanceAction[];
  severity: 'low' | 'medium' | 'high' | 'critical';
  createdBy: string;
  createdAt: number;
  updatedAt: number;
}

export interface SecurityCondition {
  field: string;
  operator: 'eq' | 'ne' | 'gt' | 'gte' | 'lt' | 'lte' | 'in' | 'contains';
  value: any;
  weight?: number; // For scoring
}

export interface PerformanceCondition {
  metric: string;
  operator: 'gt' | 'gte' | 'lt' | 'lte' | 'delta' | 'anomaly';
  value: number;
  duration?: number; // ms
  weight?: number;
}

export interface SecurityPerformanceAction {
  type: 'alert' | 'block' | 'isolate' | 'investigate' | 'report' | 'mitigate';
  config: Record<string, any>;
  delay?: number; // ms
  conditions?: Record<string, any>;
}

export interface UnifiedDashboard {
  overview: {
    securityScore: number;
    performanceScore: number;
    overallRisk: number;
    activeThreats: number;
    activeAlerts: number;
    recentIncidents: number;
  };
  correlatedEvents: SecurityPerformanceEvent[];
  riskTrends: Array<{
    timestamp: number;
    securityRisk: number;
    performanceRisk: number;
    combinedRisk: number;
  }>;
  topVulnerabilities: Array<{
    name: string;
    severity: string;
    count: number;
    performanceImpact: number;
  }>;
  recommendations: Array<{
    type: 'security' | 'performance' | 'hybrid';
    priority: 'low' | 'medium' | 'high' | 'critical';
    title: string;
    description: string;
    estimatedImpact: string;
    implementation: string;
  }>;
}

class SecurityPerformanceIntegration {
  private static instance: SecurityPerformanceIntegration;
  private correlationRules: Map<string, SecurityPerformanceRule> = new Map();
  private eventHistory: SecurityPerformanceEvent[] = [];
  private activeCorrelations: Map<string, CorrelationDetails> = new Map();
  private isInitialized = false;
  private monitoringInterval?: NodeJS.Timeout;
  private analysisInterval?: NodeJS.Timeout;

  constructor() {
    this.initializeDefaultRules();
  }

  static getInstance(): SecurityPerformanceIntegration {
    if (!SecurityPerformanceIntegration.instance) {
      SecurityPerformanceIntegration.instance = new SecurityPerformanceIntegration();
    }
    return SecurityPerformanceIntegration.instance;
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // Load correlation rules from database
      await this.loadCorrelationRules();

      // Load recent events for correlation context
      await this.loadRecentEvents();

      // Start continuous monitoring
      this.startMonitoring();

      // Start periodic analysis
      this.startAnalysis();

      // Set up event listeners
      this.setupEventListeners();

      this.isInitialized = true;
      logger.info('Security-Performance integration initialized', {
        rulesCount: this.correlationRules.size,
        eventsCount: this.eventHistory.length
      });

    } catch (error) {
      logger.error('Failed to initialize security-performance integration', error);
      throw error;
    }
  }

  private initializeDefaultRules(): void {
    const defaultRules: Omit<SecurityPerformanceRule, 'id' | 'createdBy' | 'createdAt' | 'updatedAt'>[] = [
      {
        name: 'High Security Risk with Performance Degradation',
        description: 'Correlate high-severity security events with significant performance degradation',
        enabled: true,
        triggerConditions: {
          securityConditions: [
            { field: 'threatLevel', operator: 'in', value: ['high', 'critical'], weight: 3 },
            { field: 'blocked', operator: 'eq', value: false, weight: 2 }
          ],
          performanceConditions: [
            { metric: 'responseTime', operator: 'gt', value: 2000, duration: 300000, weight: 2 },
            { metric: 'errorRate', operator: 'gt', value: 5, weight: 1 }
          ],
          correlationLogic: 'AND',
          timeWindow: 300000, // 5 minutes
          correlationThreshold: 70
        },
        actions: [
          {
            type: 'alert',
            config: { severity: 'critical', channels: ['security', 'performance', 'executive'] },
            delay: 0
          },
          {
            type: 'investigate',
            config: { priority: 'high', autoAssign: true },
            delay: 60000 // 1 minute
          }
        ],
        severity: 'critical'
      },
      {
        name: 'DDoS Attack Detection via Performance Metrics',
        description: 'Detect potential DDoS attacks through performance degradation patterns',
        enabled: true,
        triggerConditions: {
          securityConditions: [
            { field: 'eventType', operator: 'in', value: ['ddos', 'brute_force', 'flood'] }
          ],
          performanceConditions: [
            { metric: 'throughput', operator: 'lt', value: 50, duration: 120000, weight: 3 },
            { metric: 'responseTime', operator: 'gt', value: 5000, duration: 120000, weight: 2 },
            { metric: 'errorRate', operator: 'gt', value: 20, weight: 2 }
          ],
          correlationLogic: 'OR',
          timeWindow: 180000, // 3 minutes
          correlationThreshold: 80
        },
        actions: [
          {
            type: 'alert',
            config: { severity: 'critical', channels: ['security', 'infrastructure'] },
            delay: 0
          },
          {
            type: 'mitigate',
            config: { activateDDoSMitigation: true, rateLimiting: true },
            delay: 30000 // 30 seconds
          }
        ],
        severity: 'critical'
      },
      {
        name: 'Authentication Performance Anomaly',
        description: 'Detect performance anomalies in authentication that may indicate attacks',
        enabled: true,
        triggerConditions: {
          securityConditions: [
            { field: 'category', operator: 'eq', value: 'authentication' },
            { field: 'eventType', operator: 'in', value: ['failed_login', 'suspicious_activity'] }
          ],
          performanceConditions: [
            { metric: 'authResponseTime', operator: 'anomaly', value: 3, weight: 3 },
            { metric: 'authErrorRate', operator: 'delta', value: 200, weight: 2 }
          ],
          correlationLogic: 'AND',
          timeWindow: 60000, // 1 minute
          correlationThreshold: 75
        },
        actions: [
          {
            type: 'alert',
            config: { severity: 'warning', channels: ['security'] },
            delay: 0
          },
          {
            type: 'block',
            config: { temporaryBlock: true, duration: 900000 }, // 15 minutes
            delay: 60000 // 1 minute
          }
        ],
        severity: 'high'
      },
      {
        name: 'Database Performance and Security Correlation',
        description: 'Correlate database performance issues with potential security threats',
        enabled: true,
        triggerConditions: {
          securityConditions: [
            { field: 'category', operator: 'eq', value: 'data_breach' },
            { field: 'eventType', operator: 'in', value: ['sql_injection', 'unauthorized_access'] }
          ],
          performanceConditions: [
            { metric: 'dbQueryTime', operator: 'gt', value: 5000, duration: 180000, weight: 3 },
            { metric: 'dbConnectionCount', operator: 'gt', value: 100, weight: 2 },
            { metric: 'dbSlowQueries', operator: 'gt', value: 10, weight: 2 }
          ],
          correlationLogic: 'AND',
          timeWindow: 300000, // 5 minutes
          correlationThreshold: 85
        },
        actions: [
          {
            type: 'alert',
            config: { severity: 'critical', channels: ['security', 'database'] },
            delay: 0
          },
          {
            type: 'isolate',
            config: { isolateDatabase: true, preserveData: true },
            delay: 30000 // 30 seconds
          }
        ],
        severity: 'critical'
      }
    ];

    defaultRules.forEach(rule => {
      const id = crypto.randomUUID();
      this.correlationRules.set(id, {
        ...rule,
        id,
        createdBy: 'system',
        createdAt: Date.now(),
        updatedAt: Date.now()
      });
    });
  }

  private async loadCorrelationRules(): Promise<void> {
    try {
      // Load from database - placeholder for actual implementation
      logger.debug('Loading correlation rules from database');
    } catch (error) {
      logger.warn('Failed to load correlation rules, using defaults', error);
    }
  }

  private async loadRecentEvents(): Promise<void> {
    try {
      // Load recent security and performance events - placeholder for actual implementation
      logger.debug('Loading recent events for correlation context');
    } catch (error) {
      logger.warn('Failed to load recent events', error);
    }
  }

  private startMonitoring(): void {
    this.monitoringInterval = setInterval(() => {
      this.processCorrelations();
    }, 30000); // Check correlations every 30 seconds
  }

  private startAnalysis(): void {
    this.analysisInterval = setInterval(() => {
      this.performTrendAnalysis();
      this.generateRecommendations();
    }, 300000); // Analyze trends every 5 minutes
  }

  private setupEventListeners(): void {
    // Listen to security events
    if (typeof window !== 'undefined') {
      window.addEventListener('security-event', (event: any) => {
        this.handleSecurityEvent(event.detail);
      });

      // Listen to performance events
      window.addEventListener('performance-alert', (event: any) => {
        this.handlePerformanceEvent(event.detail);
      });

      // Listen to page visibility changes for security context
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'hidden') {
          this.analyzeUserSession();
        }
      });
    }
  }

  private async handleSecurityEvent(securityEvent: SecurityEventDetails): Promise<void> {
    try {
      const event: SecurityPerformanceEvent = {
        id: crypto.randomUUID(),
        timestamp: Date.now(),
        type: 'security',
        severity: securityEvent.threatLevel,
        title: `Security Event: ${securityEvent.eventType}`,
        description: `${securityEvent.category} - ${securityEvent.eventType}`,
        source: 'security-monitoring',
        details: {
          securityEvent,
          impact: {
            performanceImpact: {},
            securityImpact: {
              riskScoreIncrease: this.calculateRiskIncrease(securityEvent),
              vulnerabilitiesExposed: this.estimateVulnerabilities(securityEvent),
              dataCompromised: securityEvent.category === 'data_breach',
              unauthorizedAccess: securityEvent.category === 'authorization'
            },
            businessImpact: this.calculateBusinessImpact(securityEvent)
          }
        },
        resolved: false,
        acknowledged: false,
        tags: ['security', securityEvent.category, securityEvent.eventType]
      };

      this.eventHistory.push(event);
      await this.checkCorrelations(event);

      logger.info('Security event processed', {
        eventId: event.id,
        type: securityEvent.eventType,
        threatLevel: securityEvent.threatLevel
      });

    } catch (error) {
      logger.error('Failed to handle security event', error);
    }
  }

  private async handlePerformanceEvent(performanceEvent: any): Promise<void> {
    try {
      const event: SecurityPerformanceEvent = {
        id: crypto.randomUUID(),
        timestamp: Date.now(),
        type: 'performance',
        severity: this.mapPerformanceSeverity(performanceEvent.severity),
        title: `Performance Issue: ${performanceEvent.title}`,
        description: performanceEvent.message,
        source: 'performance-monitoring',
        details: {
          performanceEvent: {
            metric: performanceEvent.metric,
            value: performanceEvent.value,
            threshold: performanceEvent.threshold,
            affectedComponents: performanceEvent.details?.affectedComponents,
            businessImpact: performanceEvent.businessImpact
          },
          impact: {
            performanceImpact: this.calculatePerformanceImpact(performanceEvent),
            securityImpact: {},
            businessImpact: this.calculateBusinessImpact(performanceEvent)
          }
        },
        resolved: false,
        acknowledged: false,
        tags: ['performance', performanceEvent.metric, performanceEvent.type]
      };

      this.eventHistory.push(event);
      await this.checkCorrelations(event);

      logger.info('Performance event processed', {
        eventId: event.id,
        metric: performanceEvent.metric,
        value: performanceEvent.value
      });

    } catch (error) {
      logger.error('Failed to handle performance event', error);
    }
  }

  private async checkCorrelations(newEvent: SecurityPerformanceEvent): Promise<void> {
    const timeWindow = 300000; // 5 minutes
    const recentEvents = this.eventHistory.filter(event =>
      Math.abs(event.timestamp - newEvent.timestamp) <= timeWindow &&
      event.id !== newEvent.id
    );

    for (const rule of this.correlationRules.values()) {
      if (!rule.enabled) continue;

      const correlation = await this.evaluateCorrelationRule(rule, newEvent, recentEvents);
      if (correlation && correlation.correlationScore >= rule.triggerConditions.correlationThreshold) {
        await this.createCorrelatedEvent(newEvent, recentEvents, rule, correlation);
      }
    }
  }

  private async evaluateCorrelationRule(
    rule: SecurityPerformanceRule,
    newEvent: SecurityPerformanceEvent,
    recentEvents: SecurityPerformanceEvent[]
  ): Promise<CorrelationDetails | null> {
    try {
      const timeWindow = rule.triggerConditions.timeWindow;
      const relevantEvents = recentEvents.filter(event =>
        Math.abs(event.timestamp - newEvent.timestamp) <= timeWindow
      );

      // Evaluate security conditions
      const securityScore = this.evaluateSecurityConditions(
        rule.triggerConditions.securityConditions,
        newEvent,
        relevantEvents.filter(e => e.type === 'security')
      );

      // Evaluate performance conditions
      const performanceScore = this.evaluatePerformanceConditions(
        rule.triggerConditions.performanceConditions,
        newEvent,
        relevantEvents.filter(e => e.type === 'performance')
      );

      // Apply correlation logic
      let correlationScore = 0;
      switch (rule.triggerConditions.correlationLogic) {
        case 'AND':
          correlationScore = Math.min(securityScore, performanceScore);
          break;
        case 'OR':
          correlationScore = Math.max(securityScore, performanceScore);
          break;
        case 'CUSTOM':
          correlationScore = (securityScore + performanceScore) / 2;
          break;
      }

      if (correlationScore < rule.triggerConditions.correlationThreshold) {
        return null;
      }

      return {
        correlationScore,
        correlationType: this.determineCorrelationType(newEvent, relevantEvents),
        timeWindow,
        relatedEvents: relevantEvents.map(e => e.id),
        hypotheses: this.generateCorrelationHypotheses(newEvent, relevantEvents),
        investigationRequired: correlationScore >= 80
      };

    } catch (error) {
      logger.error('Failed to evaluate correlation rule', error);
      return null;
    }
  }

  private evaluateSecurityConditions(
    conditions: SecurityCondition[],
    newEvent: SecurityPerformanceEvent,
    securityEvents: SecurityPerformanceEvent[]
  ): number {
    if (conditions.length === 0) return 0;

    let totalScore = 0;
    let maxWeight = 0;

    for (const condition of conditions) {
      const weight = condition.weight || 1;
      maxWeight += weight;

      let score = 0;
      if (newEvent.type === 'security' && newEvent.details.securityEvent) {
        score = this.evaluateSecurityCondition(condition, newEvent.details.securityEvent);
      }

      // Also check related security events
      for (const event of securityEvents) {
        if (event.details.securityEvent) {
          score = Math.max(score, this.evaluateSecurityCondition(condition, event.details.securityEvent));
        }
      }

      totalScore += (score / 100) * weight;
    }

    return maxWeight > 0 ? (totalScore / maxWeight) * 100 : 0;
  }

  private evaluateSecurityCondition(condition: SecurityCondition, securityEvent: SecurityEventDetails): number {
    let fieldValue: any;
    switch (condition.field) {
      case 'threatLevel':
        fieldValue = securityEvent.threatLevel;
        break;
      case 'eventType':
        fieldValue = securityEvent.eventType;
        break;
      case 'category':
        fieldValue = securityEvent.category;
        break;
      case 'blocked':
        fieldValue = securityEvent.blocked;
        break;
      default:
        return 0;
    }

    switch (condition.operator) {
      case 'eq':
        return fieldValue === condition.value ? 100 : 0;
      case 'ne':
        return fieldValue !== condition.value ? 100 : 0;
      case 'in':
        return Array.isArray(condition.value) && condition.value.includes(fieldValue) ? 100 : 0;
      case 'contains':
        return typeof fieldValue === 'string' && fieldValue.includes(condition.value) ? 100 : 0;
      default:
        return 0;
    }
  }

  private evaluatePerformanceConditions(
    conditions: PerformanceCondition[],
    newEvent: SecurityPerformanceEvent,
    performanceEvents: SecurityPerformanceEvent[]
  ): number {
    if (conditions.length === 0) return 0;

    let totalScore = 0;
    let maxWeight = 0;

    for (const condition of conditions) {
      const weight = condition.weight || 1;
      maxWeight += weight;

      let score = 0;
      if (newEvent.type === 'performance' && newEvent.details.performanceEvent) {
        score = this.evaluatePerformanceCondition(condition, newEvent.details.performanceEvent);
      }

      // Also check related performance events
      for (const event of performanceEvents) {
        if (event.details.performanceEvent) {
          score = Math.max(score, this.evaluatePerformanceCondition(condition, event.details.performanceEvent));
        }
      }

      totalScore += (score / 100) * weight;
    }

    return maxWeight > 0 ? (totalScore / maxWeight) * 100 : 0;
  }

  private evaluatePerformanceCondition(condition: PerformanceCondition, performanceEvent: PerformanceEventDetails): number {
    let score = 0;

    switch (condition.operator) {
      case 'gt':
        score = performanceEvent.value > condition.value ? 100 : 0;
        break;
      case 'gte':
        score = performanceEvent.value >= condition.value ? 100 : 0;
        break;
      case 'lt':
        score = performanceEvent.value < condition.value ? 100 : 0;
        break;
      case 'lte':
        score = performanceEvent.value <= condition.value ? 100 : 0;
        break;
      case 'anomaly':
        // Placeholder for anomaly detection
        score = Math.random() > 0.7 ? 100 : 0;
        break;
      case 'delta':
        // Placeholder for delta comparison
        score = Math.random() > 0.6 ? 100 : 0;
        break;
    }

    return score;
  }

  private determineCorrelationType(newEvent: SecurityPerformanceEvent, relatedEvents: SecurityPerformanceEvent[]): 'causal' | 'coincidental' | 'related' {
    // Simplified correlation type determination
    const hasSecurityEvent = relatedEvents.some(e => e.type === 'security');
    const hasPerformanceEvent = relatedEvents.some(e => e.type === 'performance');

    if (newEvent.type === 'security' && hasPerformanceEvent) return 'related';
    if (newEvent.type === 'performance' && hasSecurityEvent) return 'related';
    if (relatedEvents.length > 2) return 'causal';
    return 'coincidental';
  }

  private generateCorrelationHypotheses(newEvent: SecurityPerformanceEvent, relatedEvents: SecurityPerformanceEvent[]): string[] {
    const hypotheses: string[] = [];

    if (newEvent.type === 'security') {
      const performanceEvents = relatedEvents.filter(e => e.type === 'performance');
      if (performanceEvents.length > 0) {
        hypotheses.push('Security event may be causing performance degradation');
        hypotheses.push('Performance degradation may be a symptom of security attack');
      }
    }

    if (newEvent.type === 'performance') {
      const securityEvents = relatedEvents.filter(e => e.type === 'security');
      if (securityEvents.length > 0) {
        hypotheses.push('Performance issue may be masking security activities');
        hypotheses.push('Security event may be exploiting performance vulnerabilities');
      }
    }

    if (relatedEvents.length > 3) {
      hypotheses.push('Multiple correlated events suggest coordinated activity');
    }

    return hypotheses.length > 0 ? hypotheses : ['Events appear to be correlated, but relationship unclear'];
  }

  private async createCorrelatedEvent(
    primaryEvent: SecurityPerformanceEvent,
    relatedEvents: SecurityPerformanceEvent[],
    rule: SecurityPerformanceRule,
    correlation: CorrelationDetails
  ): Promise<void> {
    try {
      const correlatedEvent: SecurityPerformanceEvent = {
        id: crypto.randomUUID(),
        timestamp: Date.now(),
        type: 'hybrid',
        severity: rule.severity,
        title: `Correlated Security-Performance Event: ${rule.name}`,
        description: `Security and performance events correlated with ${correlation.correlationScore}% confidence`,
        source: 'correlation-engine',
        details: {
          correlation,
          impact: this.calculateCombinedImpact(primaryEvent, relatedEvents),
          securityEvent: primaryEvent.details.securityEvent,
          performanceEvent: primaryEvent.details.performanceEvent
        },
        sessionId: primaryEvent.sessionId,
        userId: primaryEvent.userId,
        resolved: false,
        acknowledged: false,
        tags: ['correlated', 'security-performance', ...primaryEvent.tags]
      };

      this.eventHistory.push(correlatedEvent);
      this.activeCorrelations.set(correlatedEvent.id, correlation);

      // Execute rule actions
      for (const action of rule.actions) {
        await this.executeCorrelationAction(correlatedEvent, action, rule);
      }

      logger.warn('Correlated security-performance event created', {
        eventId: correlatedEvent.id,
        ruleName: rule.name,
        correlationScore: correlation.correlationScore,
        severity: rule.severity
      });

    } catch (error) {
      logger.error('Failed to create correlated event', error);
    }
  }

  private calculateCombinedImpact(primaryEvent: SecurityPerformanceEvent, relatedEvents: SecurityPerformanceEvent[]): ImpactAnalysis {
    const allEvents = [primaryEvent, ...relatedEvents];
    const performanceImpacts = allEvents.map(e => e.details.impact.performanceImpact);
    const securityImpacts = allEvents.map(e => e.details.impact.securityImpact);
    const businessImpacts = allEvents.map(e => e.details.impact.businessImpact);

    return {
      performanceImpact: {
        responseTimeIncrease: Math.max(...performanceImpacts.map(i => i.responseTimeIncrease || 0)),
        throughputDecrease: Math.max(...performanceImpacts.map(i => i.throughputDecrease || 0)),
        errorRateIncrease: Math.max(...performanceImpacts.map(i => i.errorRateIncrease || 0)),
        availabilityDecrease: Math.max(...performanceImpacts.map(i => i.availabilityDecrease || 0))
      },
      securityImpact: {
        riskScoreIncrease: Math.max(...securityImpacts.map(i => i.riskScoreIncrease || 0)),
        vulnerabilitiesExposed: Math.max(...securityImpacts.map(i => i.vulnerabilitiesExposed || 0)),
        dataCompromised: securityImpacts.some(i => i.dataCompromised),
        unauthorizedAccess: securityImpacts.some(i => i.unauthorizedAccess)
      },
      businessImpact: {
        revenueImpact: Math.max(...businessImpacts.map(i => i.revenueImpact || 0)),
        userImpact: Math.max(...businessImpacts.map(i => i.userImpact || 0)),
        brandImpact: Math.max(...businessImpacts.map(i => i.brandImpact || 0)),
        complianceRisk: businessImpacts.some(i => i.complianceRisk === 'critical') ? 'critical' :
                     businessImpacts.some(i => i.complianceRisk === 'high') ? 'high' :
                     businessImpacts.some(i => i.complianceRisk === 'medium') ? 'medium' : 'low' as const
      },
      affectedUsers: Math.max(...allEvents.map(e => e.details.impact.affectedUsers || 0)),
      affectedSystems: Array.from(new Set(allEvents.flatMap(e => e.details.impact.affectedSystems || [])))
    };
  }

  private async executeCorrelationAction(
    event: SecurityPerformanceEvent,
    action: SecurityPerformanceAction,
    rule: SecurityPerformanceRule
  ): Promise<void> {
    try {
      switch (action.type) {
        case 'alert':
          await this.createCorrelationAlert(event, action.config);
          break;
        case 'block':
          await this.executeBlockAction(event, action.config);
          break;
        case 'isolate':
          await this.executeIsolateAction(event, action.config);
          break;
        case 'investigate':
          await this.triggerInvestigation(event, action.config);
          break;
        case 'mitigate':
          await this.executeMitigation(event, action.config);
          break;
        default:
          logger.warn(`Unknown correlation action type: ${action.type}`);
      }
    } catch (error) {
      logger.error(`Failed to execute correlation action ${action.type}`, error);
    }
  }

  private async createCorrelationAlert(event: SecurityPerformanceEvent, config: Record<string, any>): Promise<void> {
    // Create unified alert in both security and performance systems
    await performanceAlertingService.createAlert({
      type: 'security',
      severity: config.severity || event.severity,
      title: event.title,
      message: event.description,
      details: {
        ...event.details,
        correlationId: event.id,
        source: 'security-performance-correlation'
      },
      businessImpact: event.details.impact.businessImpact.complianceRisk,
      url: window.location.href
    });
  }

  private async executeBlockAction(event: SecurityPerformanceEvent, config: Record<string, any>): Promise<void> {
    if (config.temporaryBlock && event.userId) {
      // Implement temporary user blocking
      logger.info('Executing temporary block action', {
        userId: event.userId,
        duration: config.duration,
        reason: event.title
      });
    }
  }

  private async executeIsolateAction(event: SecurityPerformanceEvent, config: Record<string, any>): Promise<void> {
    if (config.isolateDatabase) {
      // Implement database isolation
      logger.warn('Executing database isolation', {
        eventId: event.id,
        reason: event.title,
        preserveData: config.preserveData
      });
    }
  }

  private async triggerInvestigation(event: SecurityPerformanceEvent, config: Record<string, any>): Promise<void> {
    // Create investigation ticket or notify security team
    logger.info('Triggering security-performance investigation', {
      eventId: event.id,
      priority: config.priority,
      autoAssign: config.autoAssign,
      hypotheses: event.details.correlation?.hypotheses
    });
  }

  private async executeMitigation(event: SecurityPerformanceEvent, config: Record<string, any>): Promise<void> {
    if (config.activateDDoSMitigation) {
      // Activate DDoS mitigation measures
      logger.warn('Activating DDoS mitigation', {
        eventId: event.id,
        rateLimiting: config.rateLimiting
      });
    }
  }

  private processCorrelations(): void {
    // Process pending correlations and update their status
    for (const [correlationId, correlation] of this.activeCorrelations.entries()) {
      const age = Date.now() - correlation.relatedEvents.reduce((sum, eventId) => {
        const event = this.eventHistory.find(e => e.id === eventId);
        return sum + (event ? Date.now() - event.timestamp : 0);
      }, 0) / correlation.relatedEvents.length;

      // Expire old correlations
      if (age > 3600000) { // 1 hour
        this.activeCorrelations.delete(correlationId);
      }
    }
  }

  private performTrendAnalysis(): void {
    // Analyze trends in security and performance events
    const recentEvents = this.eventHistory.filter(e =>
      Date.now() - e.timestamp < 86400000 // Last 24 hours
    );

    const securityEvents = recentEvents.filter(e => e.type === 'security');
    const performanceEvents = recentEvents.filter(e => e.type === 'performance');
    const correlatedEvents = recentEvents.filter(e => e.type === 'hybrid');

    logger.info('Security-Performance trend analysis', {
      totalEvents: recentEvents.length,
      securityEvents: securityEvents.length,
      performanceEvents: performanceEvents.length,
      correlatedEvents: correlatedEvents.length,
      riskLevel: this.calculateOverallRisk(recentEvents)
    });
  }

  private generateRecommendations(): void {
    const recommendations: string[] = [];

    const recentEvents = this.eventHistory.filter(e =>
      Date.now() - e.timestamp < 3600000 // Last hour
    );

    if (recentEvents.filter(e => e.type === 'security' && e.severity === 'critical').length > 2) {
      recommendations.push('Consider implementing additional security measures due to multiple critical security events');
    }

    if (recentEvents.filter(e => e.type === 'performance' && e.severity === 'critical').length > 3) {
      recommendations.push('Performance degradation detected frequently - consider scaling resources or optimizing code');
    }

    if (recentEvents.filter(e => e.type === 'hybrid').length > 1) {
      recommendations.push('Multiple security-performance correlations detected - conduct comprehensive security audit');
    }

    if (recommendations.length > 0) {
      logger.info('Security-Performance recommendations generated', recommendations);
    }
  }

  private analyzeUserSession(): void {
    // Analyze user session for security-performance patterns
    const sessionEvents = this.eventHistory.filter(e =>
      e.sessionId && e.timestamp > Date.now() - 1800000 // Last 30 minutes
    );

    if (sessionEvents.length > 5) {
      const hasSecurityEvents = sessionEvents.some(e => e.type === 'security');
      const hasPerformanceEvents = sessionEvents.some(e => e.type === 'performance');

      if (hasSecurityEvents && hasPerformanceEvents) {
        logger.warn('Suspicious user session detected - both security and performance issues', {
          sessionId: sessionEvents[0].sessionId,
          eventsCount: sessionEvents.length
        });
      }
    }
  }

  // Helper methods
  private mapPerformanceSeverity(severity: string): 'low' | 'medium' | 'high' | 'critical' {
    switch (severity) {
      case 'info': return 'low';
      case 'warning': return 'medium';
      case 'critical': return 'critical';
      default: return 'medium';
    }
  }

  private calculateRiskIncrease(securityEvent: SecurityEventDetails): number {
    const riskScores = {
      'low': 10,
      'medium': 25,
      'high': 50,
      'critical': 100
    };
    return riskScores[securityEvent.threatLevel] || 0;
  }

  private estimateVulnerabilities(securityEvent: SecurityEventDetails): number {
    // Simple estimation based on event type
    const vulnerabilityCounts = {
      'authentication': 1,
      'authorization': 2,
      'data_breach': 5,
      'injection': 3,
      'xss': 2,
      'csrf': 1,
      'ddos': 1,
      'malware': 4
    };
    return vulnerabilityCounts[securityEvent.category] || 0;
  }

  private calculateBusinessImpact(event: SecurityEventDetails | any): ImpactAnalysis['businessImpact'] {
    // Simplified business impact calculation
    if (event.category === 'data_breach') {
      return {
        revenueImpact: 10000,
        userImpact: 100,
        brandImpact: 80,
        complianceRisk: 'critical' as const
      };
    }

    if (event.businessImpact === 'critical') {
      return {
        revenueImpact: 5000,
        userImpact: 50,
        brandImpact: 60,
        complianceRisk: 'high' as const
      };
    }

    return {
      revenueImpact: 1000,
      userImpact: 10,
      brandImpact: 20,
      complianceRisk: 'low' as const
    };
  }

  private calculatePerformanceImpact(event: any): ImpactAnalysis['performanceImpact'] {
    return {
      responseTimeIncrease: event.value - (event.threshold || 0),
      throughputDecrease: Math.random() * 20, // Placeholder
      errorRateIncrease: Math.random() * 10, // Placeholder
      availabilityDecrease: Math.random() * 5 // Placeholder
    };
  }

  private calculateOverallRisk(events: SecurityPerformanceEvent[]): number {
    if (events.length === 0) return 0;

    const riskScores = events.map(event => {
      let score = 0;
      if (event.severity === 'critical') score = 100;
      else if (event.severity === 'high') score = 75;
      else if (event.severity === 'medium') score = 50;
      else if (event.severity === 'low') score = 25;

      if (event.type === 'hybrid') score *= 1.5; // Weight correlated events higher

      return score;
    });

    return Math.min(100, riskScores.reduce((sum, score) => sum + score, 0) / events.length);
  }

  // Public API methods

  public getUnifiedDashboard(): UnifiedDashboard {
    const recentEvents = this.eventHistory.filter(e =>
      Date.now() - e.timestamp < 86400000 // Last 24 hours
    );

    const securityEvents = recentEvents.filter(e => e.type === 'security');
    const performanceEvents = recentEvents.filter(e => e.type === 'performance');
    const correlatedEvents = recentEvents.filter(e => e.type === 'hybrid');

    const securityScore = Math.max(0, 100 - (securityEvents.filter(e => e.severity === 'critical').length * 20));
    const performanceScore = Math.max(0, 100 - (performanceEvents.filter(e => e.severity === 'critical').length * 15));
    const overallRisk = this.calculateOverallRisk(recentEvents);

    return {
      overview: {
        securityScore,
        performanceScore,
        overallRisk,
        activeThreats: securityEvents.filter(e => !e.resolved).length,
        activeAlerts: performanceEvents.filter(e => !e.resolved).length,
        recentIncidents: correlatedEvents.length
      },
      correlatedEvents: correlatedEvents.slice(-10),
      riskTrends: this.calculateRiskTrends(recentEvents),
      topVulnerabilities: this.identifyTopVulnerabilities(securityEvents),
      recommendations: this.generateActiveRecommendations(recentEvents)
    };
  }

  private calculateRiskTrends(events: SecurityPerformanceEvent[]): Array<{timestamp: number; securityRisk: number; performanceRisk: number; combinedRisk: number}> {
    // Simplified trend calculation
    const now = Date.now();
    const trends = [];

    for (let i = 0; i < 24; i++) { // Last 24 hours
      const hourStart = now - (i + 1) * 3600000;
      const hourEnd = now - i * 3600000;
      const hourEvents = events.filter(e => e.timestamp >= hourStart && e.timestamp < hourEnd);

      const securityEvents = hourEvents.filter(e => e.type === 'security');
      const performanceEvents = hourEvents.filter(e => e.type === 'performance');

      const securityRisk = Math.min(100, securityEvents.length * 10);
      const performanceRisk = Math.min(100, performanceEvents.length * 8);
      const combinedRisk = Math.min(100, (securityRisk + performanceRisk) / 2 + hourEvents.filter(e => e.type === 'hybrid').length * 15);

      trends.push({
        timestamp: hourEnd,
        securityRisk,
        performanceRisk,
        combinedRisk
      });
    }

    return trends.reverse();
  }

  private identifyTopVulnerabilities(securityEvents: SecurityPerformanceEvent[]): Array<{name: string; severity: string; count: number; performanceImpact: number}> {
    const vulnerabilityMap = new Map<string, {count: number; severity: string; performanceImpact: number}>();

    securityEvents.forEach(event => {
      if (event.details.securityEvent) {
        const key = event.details.securityEvent.eventType;
        const existing = vulnerabilityMap.get(key) || { count: 0, severity: 'low', performanceImpact: 0 };

        vulnerabilityMap.set(key, {
          count: existing.count + 1,
          severity: event.severity,
          performanceImpact: existing.performanceImpact + (event.details.impact.performanceImpact.responseTimeIncrease || 0)
        });
      }
    });

    return Array.from(vulnerabilityMap.entries())
      .map(([name, data]) => ({ name, severity: data.severity, count: data.count, performanceImpact: data.performanceImpact }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }

  private generateActiveRecommendations(events: SecurityPerformanceEvent[]): Array<{type: string; priority: string; title: string; description: string; estimatedImpact: string; implementation: string}> {
    const recommendations: Array<{type: string; priority: string; title: string; description: string; estimatedImpact: string; implementation: string}> = [];

    const criticalSecurityEvents = events.filter(e => e.type === 'security' && e.severity === 'critical');
    const criticalPerformanceEvents = events.filter(e => e.type === 'performance' && e.severity === 'critical');
    const correlatedEvents = events.filter(e => e.type === 'hybrid');

    if (criticalSecurityEvents.length > 0) {
      recommendations.push({
        type: 'security',
        priority: 'critical',
        title: 'Immediate Security Review Required',
        description: `${criticalSecurityEvents.length} critical security events detected`,
        estimatedImpact: 'High - Prevent potential security breach',
        implementation: 'Conduct immediate security audit and implement additional controls'
      });
    }

    if (criticalPerformanceEvents.length > 2) {
      recommendations.push({
        type: 'performance',
        priority: 'high',
        title: 'Performance Optimization Required',
        description: `${criticalPerformanceEvents.length} critical performance issues detected`,
        estimatedImpact: 'Medium - Improve user experience and conversion',
        implementation: 'Analyze performance bottlenecks and optimize critical paths'
      });
    }

    if (correlatedEvents.length > 1) {
      recommendations.push({
        type: 'hybrid',
        priority: 'critical',
        title: 'Security-Performance Investigation',
        description: `${correlatedEvents.length} correlated security-performance events detected`,
        estimatedImpact: 'Critical - Address potential coordinated attacks',
        implementation: 'Initiate comprehensive investigation and enhance monitoring'
      });
    }

    return recommendations;
  }

  public async addCorrelationRule(rule: Omit<SecurityPerformanceRule, 'id' | 'createdBy' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const fullRule: SecurityPerformanceRule = {
      ...rule,
      id: crypto.randomUUID(),
      createdBy: 'current-user',
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    this.correlationRules.set(fullRule.id, fullRule);

    logger.info('Correlation rule added', { ruleId: fullRule.id, name: fullRule.name });
    return fullRule.id;
  }

  public destroy(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
    }
    if (this.analysisInterval) {
      clearInterval(this.analysisInterval);
    }
    this.isInitialized = false;
  }
}

// Export singleton instance
export const securityPerformanceIntegration = SecurityPerformanceIntegration.getInstance();

// Export convenient functions
export const initializeSecurityPerformanceIntegration = () => securityPerformanceIntegration.initialize();
export const getUnifiedDashboard = () => securityPerformanceIntegration.getUnifiedDashboard();
export const addSecurityPerformanceRule = (rule: Omit<SecurityPerformanceRule, 'id' | 'createdBy' | 'createdAt' | 'updatedAt'>) =>
  securityPerformanceIntegration.addCorrelationRule(rule);

// Auto-initialize in production
if (import.meta.env.PROD) {
  initializeSecurityPerformanceIntegration().catch(console.error);
}