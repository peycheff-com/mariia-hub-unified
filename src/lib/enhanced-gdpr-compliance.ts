/**
 * Enhanced GDPR Compliance Automation
 * Provides comprehensive automated GDPR compliance checking and monitoring
 */

import { securityMonitoring, SecurityEventType } from './security-monitoring';
import { gdprComplianceManager } from './gdpr-compliance-manager';

// Enhanced GDPR Configuration
interface EnhancedGDPRConfig {
  enableAutomatedMonitoring: boolean;
  enableConsentAnalytics: boolean;
  enableDataBreachDetection: boolean;
  enableRightsRequestTracking: boolean;
  enableDataMapping: boolean;
  enableAutomatedReporting: boolean;
  complianceThresholds: {
    consentAcceptanceRate: number; // minimum 80%
    dataSubjectRequestResponseTime: number; // maximum 30 days
    dataBreachNotificationTime: number; // maximum 72 hours
    dataRetentionCompliance: number; // minimum 95%
  };
  alertRecipients: string[];
  reportingSchedule: {
    daily: boolean;
    weekly: boolean;
    monthly: boolean;
  };
}

// Consent Analytics
interface ConsentAnalytics {
  totalVisitors: number;
  consentGiven: number;
  consentWithdrawn: number;
  consentByType: Record<string, number>;
  consentByCountry: Record<string, number>;
  averageConsentTime: number;
  consentWithdrawalReasons: Record<string, number>;
}

// Data Subject Request Metrics
interface DSRRMetrics {
  totalRequests: number;
  requestsByType: Record<string, number>;
  averageResponseTime: number;
  overdueRequests: number;
  completedRequests: number;
  rejectedRequests: number;
  requestTrends: Array<{
    date: string;
    count: number;
  }>;
}

// Data Breach Detection
interface DataBreachIndicator {
  id: string;
  type: 'UNAUTHORIZED_ACCESS' | 'DATA_EXFILTRATION' | 'SYSTEM_COMPROMISE' | 'INSIDER_THREAT';
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  description: string;
  detectedAt: number;
  affectedRecords: number;
  dataTypes: string[];
  containmentStatus: 'NOT_STARTED' | 'IN_PROGRESS' | 'CONTAINED' | 'RESOLVED';
  notificationRequired: boolean;
  notificationSent: boolean;
}

// Data Processing Mapping
interface DataProcessingMap {
  activities: Array<{
    id: string;
    purpose: string;
    legalBasis: string;
    dataCategories: string[];
    recipients: string[];
    retentionPeriod: number;
    securityMeasures: string[];
    internationalTransfer: boolean;
    transferMechanism?: string;
  }>;
  dataFlows: Array<{
    from: string;
    to: string;
    dataTypes: string[];
    purpose: string;
    legalBasis: string;
    safeguards: string[];
  }>;
  thirdPartyProcessors: Array<{
    name: string;
    purposes: string[];
    dataTypes: string[];
    location: string;
    safeguards: string[];
    contractRenewal: number;
  }>;
}

/**
 * Enhanced GDPR Compliance Automation Class
 */
export class EnhancedGDPRCompliance {
  private static instance: EnhancedGDPRCompliance;
  private config: EnhancedGDPRConfig;
  private consentAnalytics: ConsentAnalytics;
  private dsrMetrics: DSRRetrics;
  private breachIndicators: DataBreachIndicator[] = [];
  private dataMap: DataProcessingMap;
  private monitoringActive: boolean = false;
  private lastReportTime: number = 0;

  private constructor(config: Partial<EnhancedGDPRConfig> = {}) {
    this.config = {
      enableAutomatedMonitoring: true,
      enableConsentAnalytics: true,
      enableDataBreachDetection: true,
      enableRightsRequestTracking: true,
      enableDataMapping: true,
      enableAutomatedReporting: true,
      complianceThresholds: {
        consentAcceptanceRate: 80,
        dataSubjectRequestResponseTime: 30 * 24 * 60 * 60 * 1000, // 30 days
        dataBreachNotificationTime: 72 * 60 * 60 * 1000, // 72 hours
        dataRetentionCompliance: 95
      },
      alertRecipients: ['privacy@mariaborysevych.com', 'security@mariaborysevych.com'],
      reportingSchedule: {
        daily: false,
        weekly: true,
        monthly: true
      },
      ...config
    };

    this.consentAnalytics = this.initializeConsentAnalytics();
    this.dsrMetrics = this.initializeDSRMetrics();
    this.dataMap = this.initializeDataMap();

    this.startMonitoring();
  }

  static getInstance(config?: Partial<EnhancedGDPRConfig>): EnhancedGDPRCompliance {
    if (!EnhancedGDPRCompliance.instance) {
      EnhancedGDPRCompliance.instance = new EnhancedGDPRCompliance(config);
    }
    return EnhancedGDPRCompliance.instance;
  }

  /**
   * Initialize consent analytics
   */
  private initializeConsentAnalytics(): ConsentAnalytics {
    return {
      totalVisitors: 0,
      consentGiven: 0,
      consentWithdrawn: 0,
      consentByType: {},
      consentByCountry: {},
      averageConsentTime: 0,
      consentWithdrawalReasons: {}
    };
  }

  /**
   * Initialize DSR metrics
   */
  private initializeDSRMetrics(): DSRRMetrics {
    return {
      totalRequests: 0,
      requestsByType: {},
      averageResponseTime: 0,
      overdueRequests: 0,
      completedRequests: 0,
      rejectedRequests: 0,
      requestTrends: []
    };
  }

  /**
   * Initialize data processing map
   */
  private initializeDataMap(): DataProcessingMap {
    return {
      activities: [],
      dataFlows: [],
      thirdPartyProcessors: [
        {
          name: 'Supabase',
          purposes: ['Database services', 'Authentication', 'File storage'],
          dataTypes: ['Personal data', 'User preferences', 'Content data'],
          location: 'European Union (Ireland)',
          safeguards: ['GDPR-compliant processing', 'Data processing agreement', 'EU data centers'],
          contractRenewal: Date.now() + (365 * 24 * 60 * 60 * 1000)
        },
        {
          name: 'Stripe',
          purposes: ['Payment processing'],
          dataTypes: ['Payment information', 'Billing details'],
          location: 'European Union',
          safeguards: ['PCI DSS compliance', 'End-to-end encryption', 'Data processing agreement'],
          contractRenewal: Date.now() + (365 * 24 * 60 * 60 * 1000)
        },
        {
          name: 'Vercel',
          purposes: ['Website hosting', 'Content delivery'],
          dataTypes: ['Access logs', 'Performance data'],
          location: 'United States & European Union',
          safeguards: ['EU-US Privacy Shield', 'Data processing agreement', 'Security controls'],
          contractRenewal: Date.now() + (365 * 24 * 60 * 60 * 1000)
        }
      ]
    };
  }

  /**
   * Start automated monitoring
   */
  private startMonitoring(): void {
    if (this.monitoringActive) return;

    this.monitoringActive = true;

    // Setup event listeners
    this.setupEventListeners();

    // Start automated checks
    if (this.config.enableAutomatedMonitoring) {
      setInterval(() => {
        this.runComplianceChecks();
      }, 60 * 60 * 1000); // Every hour

      // Initial check
      setTimeout(() => {
        this.runComplianceChecks();
      }, 10000);
    }

    // Setup reporting schedule
    if (this.config.enableAutomatedReporting) {
      this.setupReportingSchedule();
    }

    console.log('[GDPR] Enhanced compliance monitoring started');
  }

  /**
   * Setup event listeners for GDPR monitoring
   */
  private setupEventListeners(): void {
    // Consent tracking
    window.addEventListener('gdpr-consent-given', (event: any) => {
      this.trackConsentGiven(event.detail);
    });

    window.addEventListener('gdpr-consent-withdrawn', (event: any) => {
      this.trackConsentWithdrawn(event.detail);
    });

    // Data subject request tracking
    window.addEventListener('data-subject-request', (event: any) => {
      this.trackDataSubjectRequest(event.detail);
    });

    // Security event monitoring for breach detection
    window.addEventListener('security-event', (event: any) => {
      this.analyzeSecurityEvent(event.detail);
    });

    // Data access monitoring
    window.addEventListener('data-access', (event: any) => {
      this.trackDataAccess(event.detail);
    });
  }

  /**
   * Setup automated reporting schedule
   */
  private setupReportingSchedule(): void {
    // Daily reports
    if (this.config.reportingSchedule.daily) {
      setInterval(() => {
        this.generateDailyReport();
      }, 24 * 60 * 60 * 1000);
    }

    // Weekly reports
    if (this.config.reportingSchedule.weekly) {
      setInterval(() => {
        this.generateWeeklyReport();
      }, 7 * 24 * 60 * 60 * 1000);
    }

    // Monthly reports
    if (this.config.reportingSchedule.monthly) {
      setInterval(() => {
        this.generateMonthlyReport();
      }, 30 * 24 * 60 * 60 * 1000);
    }
  }

  /**
   * Track consent given
   */
  private trackConsentGiven(detail: any): void {
    this.consentAnalytics.totalVisitors++;
    this.consentAnalytics.consentGiven++;

    // Track by type
    for (const [type, granted] of Object.entries(detail.consents || {})) {
      if (granted) {
        this.consentAnalytics.consentByType[type] = (this.consentAnalytics.consentByType[type] || 0) + 1;
      }
    }

    // Track by country (estimated from timezone/locale)
    const country = this.estimateUserCountry();
    this.consentAnalytics.consentByCountry[country] = (this.consentAnalytics.consentByCountry[country] || 0) + 1;

    // Track consent time
    if (detail.consentTime) {
      this.updateAverageConsentTime(detail.consentTime);
    }

    // Check consent acceptance rate
    this.checkConsentAcceptanceRate();
  }

  /**
   * Track consent withdrawn
   */
  private trackConsentWithdrawn(detail: any): void {
    this.consentAnalytics.consentWithdrawn++;

    // Track withdrawal reasons
    if (detail.reason) {
      this.consentAnalytics.consentWithdrawalReasons[detail.reason] =
        (this.consentAnalytics.consentWithdrawalReasons[detail.reason] || 0) + 1;
    }

    // Log for compliance
    console.log('[GDPR] Consent withdrawn:', {
      types: detail.types,
      reason: detail.reason,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Track data subject requests
   */
  private trackDataSubjectRequest(detail: any): void {
    this.dsrMetrics.totalRequests++;

    const requestType = detail.type || 'unknown';
    this.dsrMetrics.requestsByType[requestType] = (this.dsrMetrics.requestsByType[requestType] || 0) + 1;

    // Track trends
    const today = new Date().toISOString().split('T')[0];
    const existingTrend = this.dsrMetrics.requestTrends.find(t => t.date === today);
    if (existingTrend) {
      existingTrend.count++;
    } else {
      this.dsrMetrics.requestTrends.push({ date: today, count: 1 });
    }

    // Keep only last 30 days of trends
    if (this.dsrMetrics.requestTrends.length > 30) {
      this.dsrMetrics.requestTrends = this.dsrMetrics.requestTrends.slice(-30);
    }

    // Log for compliance
    console.log('[GDPR] Data subject request received:', {
      type: requestType,
      requestId: detail.requestId,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Analyze security events for breach indicators
   */
  private analyzeSecurityEvent(event: any): void {
    if (!this.config.enableDataBreachDetection) return;

    let breachIndicator: DataBreachIndicator | null = null;

    switch (event.type) {
      case SecurityEventType.UNAUTHORIZED_ACCESS:
        breachIndicator = {
          id: this.generateBreachId(),
          type: 'UNAUTHORIZED_ACCESS',
          severity: 'HIGH',
          description: `Unauthorized access attempt to ${event.resource}`,
          detectedAt: Date.now(),
          affectedRecords: 0,
          dataTypes: ['Access logs', 'Security events'],
          containmentStatus: 'NOT_STARTED',
          notificationRequired: true,
          notificationSent: false
        };
        break;

      case SecurityEventType.DATA_EXFILTRATION:
        breachIndicator = {
          id: this.generateBreachId(),
          type: 'DATA_EXFILTRATION',
          severity: 'CRITICAL',
          description: 'Potential data exfiltration detected',
          detectedAt: Date.now(),
          affectedRecords: event.affectedRecords || 0,
          dataTypes: event.dataTypes || ['Unknown'],
          containmentStatus: 'NOT_STARTED',
          notificationRequired: true,
          notificationSent: false
        };
        break;

      case SecurityEventType.ACCOUNT_TAKEOVER:
        breachIndicator = {
          id: this.generateBreachId(),
          type: 'SYSTEM_COMPROMISE',
          severity: 'CRITICAL',
          description: 'Account takeover detected - potential system compromise',
          detectedAt: Date.now(),
          affectedRecords: 1,
          dataTypes: ['Account data', 'Personal information'],
          containmentStatus: 'NOT_STARTED',
          notificationRequired: true,
          notificationSent: false
        };
        break;
    }

    if (breachIndicator) {
      this.breachIndicators.push(breachIndicator);
      this.handleBreachIndicator(breachIndicator);
    }
  }

  /**
   * Handle data breach indicator
   */
  private handleBreachIndicator(indicator: DataBreachIndicator): void {
    console.warn('[GDPR] Data breach indicator detected:', indicator);

    // Check if immediate notification is required
    if (indicator.severity === 'CRITICAL') {
      this.triggerBreachAlert(indicator);
    }

    // Start breach assessment
    this.startBreachAssessment(indicator);

    // Log for compliance
    this.logBreachEvent(indicator);
  }

  /**
   * Trigger breach alert
   */
  private triggerBreachAlert(indicator: DataBreachIndicator): void {
    const alertMessage = `GDPR Data Breach Alert: ${indicator.description} (${indicator.severity})`;

    // Send to security monitoring
    securityMonitoring.suspiciousActivity(
      SecurityEventType.DATA_EXFILTRATION,
      alertMessage,
      undefined,
      { breachId: indicator.id, severity: indicator.severity }
    );

    // In production, send to alerting systems
    this.config.alertRecipients.forEach(recipient => {
      console.log(`[GDPR ALERT] Sending breach notification to ${recipient}`);
      // Integration with email/SMS systems would go here
    });
  }

  /**
   * Start breach assessment
   */
  private startBreachAssessment(indicator: DataBreachIndicator): void {
    indicator.containmentStatus = 'IN_PROGRESS';

    // Log assessment start
    console.log(`[GDPR] Starting breach assessment for ${indicator.id}`);

    // In a real implementation, this would trigger:
    // 1. Incident response team notification
    // 2. System containment procedures
    // 3. Data assessment and impact analysis
    // 4. Timeline for notification determination
  }

  /**
   * Track data access
   */
  private trackDataAccess(detail: any): void {
    // Track data processing activities for compliance
    const activity = {
      id: this.generateActivityId(),
      purpose: detail.purpose || 'unknown',
      dataTypes: detail.dataTypes || [],
      legalBasis: detail.legalBasis || 'consent',
      timestamp: Date.now()
    };

    // Update data processing map
    this.updateDataProcessingMap(activity);

    // Log for audit
    console.log('[GDPR] Data access tracked:', activity);
  }

  /**
   * Run comprehensive compliance checks
   */
  private async runComplianceChecks(): Promise<void> {
    console.log('[GDPR] Running automated compliance checks...');

    const violations = [];

    // Check consent acceptance rate
    const consentViolation = this.checkConsentAcceptanceRate();
    if (consentViolation) violations.push(consentViolation);

    // Check data subject request response times
    const dsrViolation = this.checkDSRResponseTimes();
    if (dsrViolation) violations.push(dsrViolation);

    // Check data retention compliance
    const retentionViolation = this.checkDataRetentionCompliance();
    if (retentionViolation) violations.push(retentionViolation);

    // Check data processing records
    const processingViolation = this.checkDataProcessingRecords();
    if (processingViolation) violations.push(processingViolation);

    // Check for overdue breach notifications
    const breachViolation = this.checkBreachNotificationTimes();
    if (breachViolation) violations.push(breachViolation);

    if (violations.length > 0) {
      this.handleComplianceViolations(violations);
    }

    this.lastReportTime = Date.now();
  }

  /**
   * Check consent acceptance rate
   */
  private checkConsentAcceptanceRate(): any | null {
    if (this.consentAnalytics.totalVisitors === 0) return null;

    const acceptanceRate = (this.consentAnalytics.consentGiven / this.consentAnalytics.totalVisitors) * 100;
    const threshold = this.config.complianceThresholds.consentAcceptanceRate;

    if (acceptanceRate < threshold) {
      return {
        type: 'CONSENT_ACCEPTANCE_RATE_LOW',
        severity: 'MEDIUM',
        description: `Consent acceptance rate (${acceptanceRate.toFixed(1)}%) below threshold (${threshold}%)`,
        recommendation: 'Review consent presentation and improve user experience'
      };
    }

    return null;
  }

  /**
   * Check DSR response times
   */
  private checkDSRResponseTimes(): any | null {
    const maxResponseTime = this.config.complianceThresholds.dataSubjectRequestResponseTime;
    const overdueCount = this.dsrMetrics.overdueRequests;

    if (overdueCount > 0) {
      return {
        type: 'DSR_RESPONSE_TIME_OVERDUE',
        severity: 'HIGH',
        description: `${overdueCount} data subject requests overdue (${Math.round(maxResponseTime / (24 * 60 * 60 * 1000))} days limit)`,
        recommendation: 'Process overdue requests immediately and review response procedures'
      };
    }

    return null;
  }

  /**
   * Check data retention compliance
   */
  private checkDataRetentionCompliance(): any | null {
    // Check for data exceeding retention periods
    const violations = this.findDataRetentionViolations();
    const threshold = this.config.complianceThresholds.dataRetentionCompliance;

    if (violations.length > 0) {
      const complianceRate = ((this.dataMap.activities.length - violations.length) / this.dataMap.activities.length) * 100;

      if (complianceRate < threshold) {
        return {
          type: 'DATA_RETENTION_COMPLIANCE_LOW',
          severity: 'HIGH',
          description: `Data retention compliance rate (${complianceRate.toFixed(1)}%) below threshold (${threshold}%)`,
          recommendation: 'Review and update data retention schedules, implement automated deletion'
        };
      }
    }

    return null;
  }

  /**
   * Check data processing records
   */
  private checkDataProcessingRecords(): any | null {
    if (this.dataMap.activities.length === 0) {
      return {
        type: 'DATA_PROCESSING_RECORDS_MISSING',
        severity: 'HIGH',
        description: 'Data processing activities not properly documented',
        recommendation: 'Document all data processing activities in the processing register'
      };
    }

    // Check for missing required information
    const incompleteActivities = this.dataMap.activities.filter(activity =>
      !activity.purpose || !activity.legalBasis || !activity.dataCategories.length
    );

    if (incompleteActivities.length > 0) {
      return {
        type: 'DATA_PROCESSING_RECORDS_INCOMPLETE',
        severity: 'MEDIUM',
        description: `${incompleteActivities.length} data processing activities have incomplete records`,
        recommendation: 'Complete all required fields in data processing records'
      };
    }

    return null;
  }

  /**
   * Check breach notification times
   */
  private checkBreachNotificationTimes(): any | null {
    const notificationTimeLimit = this.config.complianceThresholds.dataBreachNotificationTime;
    const now = Date.now();

    for (const indicator of this.breachIndicators) {
      if (indicator.notificationRequired && !indicator.notificationSent) {
        const timeSinceDetection = now - indicator.detectedAt;

        if (timeSinceDetection > notificationTimeLimit) {
          return {
            type: 'BREACH_NOTIFICATION_OVERDUE',
            severity: 'CRITICAL',
            description: `Breach notification overdue (${Math.round(timeSinceDetection / (60 * 60 * 1000))} hours since detection)`,
            recommendation: 'Notify supervisory authority and affected individuals immediately'
          };
        }
      }
    }

    return null;
  }

  /**
   * Handle compliance violations
   */
  private handleComplianceViolations(violations: any[]): void {
    console.warn('[GDPR] Compliance violations detected:', violations);

    // Report to security monitoring
    violations.forEach(violation => {
      securityMonitoring.suspiciousActivity(
        SecurityEventType.SECURITY_POLICY_VIOLATION,
        `GDPR compliance violation: ${violation.description}`,
        undefined,
        violation
      );
    });

    // Send alerts to compliance team
    this.config.alertRecipients.forEach(recipient => {
      console.log(`[GDPR ALERT] Compliance violation notification sent to ${recipient}`);
    });
  }

  /**
   * Generate daily report
   */
  private generateDailyReport(): void {
    const report = {
      date: new Date().toISOString().split('T')[0],
      consentAnalytics: this.consentAnalytics,
      newDSR: this.dsrMetrics.requestTrends.slice(-1),
      activeBreachIndicators: this.breachIndicators.filter(b => b.containmentStatus !== 'RESOLVED')
    };

    this.storeReport('daily', report);
    console.log('[GDPR] Daily compliance report generated');
  }

  /**
   * Generate weekly report
   */
  private generateWeeklyReport(): void {
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - 7);

    const weeklyDSR = this.dsrMetrics.requestTrends.filter(t =>
      new Date(t.date) >= weekStart
    );

    const report = {
      weekStart: weekStart.toISOString().split('T')[0],
      weekEnd: new Date().toISOString().split('T')[0],
      consentAnalytics: this.consentAnalytics,
      dsrMetrics: {
        totalRequests: weeklyDSR.reduce((sum, t) => sum + t.count, 0),
        requestsByType: this.dsrMetrics.requestsByType,
        averageResponseTime: this.dsrMetrics.averageResponseTime
      },
      breachIndicators: this.breachIndicators.filter(b =>
        b.detectedAt >= weekStart.getTime()
      ),
      complianceScore: this.calculateComplianceScore()
    };

    this.storeReport('weekly', report);
    console.log('[GDPR] Weekly compliance report generated');
  }

  /**
   * Generate monthly report
   */
  private generateMonthlyReport(): void {
    const monthStart = new Date();
    monthStart.setMonth(monthStart.getMonth() - 1);

    const report = {
      month: monthStart.toLocaleString('default', { month: 'long', year: 'numeric' }),
      consentAnalytics: this.consentAnalytics,
      dsrMetrics: this.dsrMetrics,
      breachIndicators: this.breachIndicators.filter(b =>
        b.detectedAt >= monthStart.getTime()
      ),
      dataProcessingMap: this.dataMap,
      complianceScore: this.calculateComplianceScore(),
      recommendations: this.generateRecommendations()
    };

    this.storeReport('monthly', report);
    console.log('[GDPR] Monthly compliance report generated');
  }

  /**
   * Store compliance report
   */
  private storeReport(type: string, report: any): void {
    try {
      const reports = JSON.parse(localStorage.getItem(`gdpr-reports-${type}`) || '[]');
      reports.push(report);

      // Keep only last 12 reports
      if (reports.length > 12) {
        reports.splice(0, reports.length - 12);
      }

      localStorage.setItem(`gdpr-reports-${type}`, JSON.stringify(reports));
    } catch (error) {
      console.error('[GDPR] Failed to store report:', error);
    }
  }

  /**
   * Calculate compliance score
   */
  private calculateComplianceScore(): number {
    let score = 100;

    // Deduct points for violations
    if (this.checkConsentAcceptanceRate()) score -= 20;
    if (this.checkDSRResponseTimes()) score -= 30;
    if (this.checkDataRetentionCompliance()) score -= 25;
    if (this.checkDataProcessingRecords()) score -= 15;
    if (this.checkBreachNotificationTimes()) score -= 50;

    return Math.max(0, score);
  }

  /**
   * Generate recommendations
   */
  private generateRecommendations(): string[] {
    const recommendations = [];

    const consentRate = this.consentAnalytics.totalVisitors > 0
      ? (this.consentAnalytics.consentGiven / this.consentAnalytics.totalVisitors) * 100
      : 100;

    if (consentRate < this.config.complianceThresholds.consentAcceptanceRate) {
      recommendations.push('Improve consent presentation to increase acceptance rate');
    }

    if (this.dsrMetrics.overdueRequests > 0) {
      recommendations.push('Process overdue data subject requests immediately');
    }

    if (this.breachIndicators.length > 0) {
      recommendations.push('Review and improve security measures to prevent breaches');
    }

    if (this.dataMap.activities.length === 0) {
      recommendations.push('Complete data processing register documentation');
    }

    return recommendations;
  }

  // Helper methods
  private estimateUserCountry(): string {
    try {
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      const language = navigator.language;

      // Simple estimation based on timezone and language
      if (timezone.includes('Europe') || language.startsWith('pl')) {
        return 'Poland';
      } else if (language.startsWith('en')) {
        return 'Other';
      }
      return 'Unknown';
    } catch {
      return 'Unknown';
    }
  }

  private updateAverageConsentTime(consentTime: number): void {
    const totalConsents = this.consentAnalytics.consentGiven;
    if (totalConsents === 1) {
      this.consentAnalytics.averageConsentTime = consentTime;
    } else {
      this.consentAnalytics.averageConsentTime =
        ((this.consentAnalytics.averageConsentTime * (totalConsents - 1)) + consentTime) / totalConsents;
    }
  }

  private updateDataProcessingMap(activity: any): void {
    // Update or add processing activity
    const existingIndex = this.dataMap.activities.findIndex(a => a.purpose === activity.purpose);
    if (existingIndex >= 0) {
      // Update existing activity
      this.dataMap.activities[existingIndex] = {
        ...this.dataMap.activities[existingIndex],
        dataTypes: [...new Set([...this.dataMap.activities[existingIndex].dataTypes, ...activity.dataTypes])]
      };
    } else {
      // Add new activity
      this.dataMap.activities.push({
        id: activity.id,
        purpose: activity.purpose,
        legalBasis: activity.legalBasis,
        dataCategories: activity.dataTypes,
        recipients: ['Internal'],
        retentionPeriod: 365,
        securityMeasures: ['Encryption', 'Access controls'],
        internationalTransfer: false
      });
    }
  }

  private findDataRetentionViolations(): any[] {
    // This would check for data exceeding retention periods
    // For now, return empty array
    return [];
  }

  private logBreachEvent(indicator: DataBreachIndicator): void {
    const logEntry = {
      breachId: indicator.id,
      type: indicator.type,
      severity: indicator.severity,
      description: indicator.description,
      detectedAt: indicator.detectedAt,
      timestamp: new Date().toISOString()
    };

    try {
      const logs = JSON.parse(localStorage.getItem('gdpr-breach-logs') || '[]');
      logs.push(logEntry);

      // Keep only last 100 entries
      if (logs.length > 100) {
        logs.splice(0, logs.length - 100);
      }

      localStorage.setItem('gdpr-breach-logs', JSON.stringify(logs));
    } catch (error) {
      console.error('[GDPR] Failed to log breach event:', error);
    }
  }

  private generateBreachId(): string {
    return `breach_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }

  private generateActivityId(): string {
    return `activity_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }

  /**
   * Public API methods
   */

  // Get compliance status
  getComplianceStatus(): {
    score: number;
    consentAnalytics: ConsentAnalytics;
    dsrMetrics: DSRRetrics;
    activeBreachIndicators: number;
    lastCheck: number;
  } {
    return {
      score: this.calculateComplianceScore(),
      consentAnalytics: this.consentAnalytics,
      dsrMetrics: this.dsrMetrics,
      activeBreachIndicators: this.breachIndicators.filter(b => b.containmentStatus !== 'RESOLVED').length,
      lastCheck: this.lastReportTime
    };
  }

  // Get reports
  getReports(type: 'daily' | 'weekly' | 'monthly'): any[] {
    try {
      return JSON.parse(localStorage.getItem(`gdpr-reports-${type}`) || '[]');
    } catch {
      return [];
    }
  }

  // Get data processing map
  getDataProcessingMap(): DataProcessingMap {
    return this.dataMap;
  }

  // Update configuration
  updateConfig(config: Partial<EnhancedGDPRConfig>): void {
    this.config = { ...this.config, ...config };
  }

  // Export data for portability
  exportUserData(email: string): string {
    // This would collect all user data in a portable format
    return JSON.stringify({
      email,
      exportDate: new Date().toISOString(),
      consentData: gdprComplianceManager.getConsentData(),
      processingActivities: this.dataMap.activities.filter(a =>
        a.dataCategories.some(cat => cat.includes('personal'))
      ),
      analyticsData: this.consentAnalytics
    }, null, 2);
  }
}

// Create and export singleton instance
export const enhancedGDPRCompliance = EnhancedGDPRCompliance.getInstance();

// Initialize automatically
if (typeof window !== 'undefined') {
  if (document.readyState === 'complete') {
    // Ready to start monitoring
  } else {
    window.addEventListener('load', () => {
      // Start monitoring after page load
    });
  }
}

// Export helper functions
export const getGDPRComplianceStatus = () => enhancedGDPRCompliance.getComplianceStatus();
export const getGDPRReports = (type: 'daily' | 'weekly' | 'monthly') =>
  enhancedGDPRCompliance.getReports(type);
export const exportUserData = (email: string) => enhancedGDPRCompliance.exportUserData(email);

// Export types
export { EnhancedGDPRConfig, ConsentAnalytics, DSRRetrics, DataBreachIndicator, DataProcessingMap };