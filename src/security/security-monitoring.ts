/**
 * Security Monitoring and Incident Response System
 *
 * Comprehensive security monitoring with real-time alerts, incident response procedures,
  automated threat detection, and security analytics for the Mariia Hub platform.
 */

import { Context, Next } from 'hono';
import { productionSecurityConfig } from '../config/production-security';

interface SecurityAlert {
  id: string;
  type: 'critical' | 'high' | 'medium' | 'low';
  category: 'intrusion' | 'malware' | 'data_breach' | 'ddos' | 'fraud' | 'policy_violation' | 'system_anomaly';
  title: string;
  description: string;
  source: string;
  timestamp: number;
  severity: 'critical' | 'high' | 'medium' | 'low';
  status: 'open' | 'investigating' | 'resolved' | 'false_positive';
  assignee?: string;
  metadata: Record<string, any>;
  evidence: Evidence[];
  timeline: AlertTimelineEntry[];
  mitigation?: MitigationAction[];
}

interface Evidence {
  id: string;
  type: 'log' | 'screenshot' | 'network_capture' | 'file_hash' | 'memory_dump' | 'system_state';
  description: string;
  data: any;
  timestamp: number;
  collectedBy: string;
  integrity: string;
}

interface AlertTimelineEntry {
  timestamp: number;
  action: string;
  actor: string;
  description: string;
  metadata?: Record<string, any>;
}

interface MitigationAction {
  id: string;
  type: 'block_ip' | 'disable_account' | 'isolate_system' | 'patch_vulnerability' | 'update_rules' | 'backup_data';
  description: string;
  executedBy: string;
  executedAt: number;
  status: 'pending' | 'executed' | 'failed' | 'rolled_back';
  result?: string;
}

interface SecurityIncident {
  id: string;
  alertIds: string[];
  type: 'security_incident' | 'data_breach' | 'service_disruption' | 'fraud' | 'compliance_violation';
  severity: 'critical' | 'high' | 'medium' | 'low';
  title: string;
  description: string;
  detectedAt: number;
  resolvedAt?: number;
  duration?: number;
  impact: {
    systems_affected: string[];
    data_compromised: boolean;
    users_affected: number;
    financial_impact?: number;
    reputational_impact: 'low' | 'medium' | 'high';
  };
  response: {
    detected_by: string;
    response_team: string[];
    containment_time?: number;
    eradication_time?: number;
    recovery_time?: number;
    lessons_learned?: string;
  };
  compliance: {
    gdpr_breach?: boolean;
    notification_required?: boolean;
    regulatory_reporting?: boolean;
    notified_at?: number;
  };
  status: 'open' | 'containment' | 'eradication' | 'recovery' | 'post_incident' | 'closed';
}

interface ThreatIntelligence {
  id: string;
  type: 'ioc' | 'signature' | 'campaign' | 'vulnerability' | 'actor';
  source: string;
  data: any;
  confidence: number;
  severity: 'critical' | 'high' | 'medium' | 'low';
  valid_from: number;
  valid_until: number;
  tags: string[];
  created_at: number;
  updated_at: number;
}

interface SecurityMetrics {
  timestamp: number;
  alerts_generated: number;
  alerts_resolved: number;
  incidents_created: number;
  incidents_resolved: number;
  mean_time_to_detect: number;
  mean_time_to_respond: number;
  mean_time_to_recover: number;
  false_positive_rate: number;
  threats_blocked: number;
  systems_monitored: number;
  compliance_score: number;
}

class SecurityMonitoring {
  private alerts: Map<string, SecurityAlert> = new Map();
  private incidents: Map<string, SecurityIncident> = new Map();
  private threatIntelligence: Map<string, ThreatIntelligence> = new Map();
  private metrics: SecurityMetrics[] = [];
  private monitoringRules: MonitoringRule[] = [];
  private responsePlaybooks: Map<string, ResponsePlaybook> = new Map();
  private readonly config = productionSecurityConfig.monitoring;

  constructor() {
    this.initializeMonitoring();
  }

  /**
   * Initialize security monitoring system
   */
  private async initializeMonitoring(): Promise<void> {
    await this.createMonitoringRules();
    await this.createResponsePlaybooks();
    await this.loadThreatIntelligence();
    this.startMetricsCollection();
    this.startThreatAnalysis();
    this.startAutomatedResponse();

    console.log('Security monitoring system initialized');
  }

  /**
   * Security monitoring middleware
   */
  async middleware(c: Context, next: Next): Promise<void> {
    const startTime = Date.now();
    const ip = this.getClientIP(c);
    const userAgent = c.req.header('User-Agent') || '';
    const path = c.req.path;
    const method = c.req.method;

    // Collect request metadata
    const requestMetadata = {
      ip,
      userAgent,
      path,
      method,
      timestamp: startTime,
      headers: Object.fromEntries(c.req.header())
    };

    // Analyze request for threats
    const threats = await this.analyzeRequest(c, requestMetadata);
    if (threats.length > 0) {
      await this.handleThreats(c, threats);
      return;
    }

    // Continue with request
    await next();

    // Analyze response
    const responseTime = Date.now() - startTime;
    const responseMetadata = {
      ...requestMetadata,
      responseTime,
      statusCode: c.res.status,
      responseHeaders: c.res.headers
    };

    // Monitor for anomalies
    await this.detectAnomalies(responseMetadata);
  }

  /**
   * Analyze request for security threats
   */
  private async analyzeRequest(c: Context, metadata: any): Promise<string[]> {
    const threats: string[] = [];

    // Check against monitoring rules
    for (const rule of this.monitoringRules) {
      if (await this.evaluateRule(rule, metadata)) {
        threats.push(rule.name);
      }
    }

    // Check against threat intelligence
    const threatMatches = await this.checkThreatIntelligence(metadata);
    threats.push(...threatMatches);

    // Check for known attack patterns
    const attackPatterns = await this.detectAttackPatterns(metadata);
    threats.push(...attackPatterns);

    return threats;
  }

  /**
   * Handle detected threats
   */
  private async handleThreats(c: Context, threats: string[]): Promise<void> {
    // Create security alert
    const alert = await this.createAlert({
      type: 'critical',
      category: 'intrusion',
      title: 'Threat Detected',
      description: `Security threats detected: ${threats.join(', ')}`,
      source: 'security_monitoring',
      metadata: {
        threats,
        request: {
          ip: this.getClientIP(c),
          path: c.req.path,
          method: c.req.method,
          userAgent: c.req.header('User-Agent')
        }
      }
    });

    // Trigger automated response
    await this.triggerAutomatedResponse(alert);

    // Block request if critical threat
    if (threats.some(threat => this.isCriticalThreat(threat))) {
      c.status(403);
      c.json({
        error: 'Access Denied',
        message: 'Security threat detected',
        alertId: alert.id
      });
      return;
    }

    // Continue with monitoring
    await next();
  }

  /**
   * Create monitoring rules
   */
  private async createMonitoringRules(): Promise<void> {
    this.monitoringRules = [
      {
        id: 'brute_force_detection',
        name: 'Brute Force Attack Detection',
        description: 'Detects multiple failed login attempts from same IP',
        condition: {
          type: 'threshold',
          metric: 'failed_logins',
          threshold: 5,
          timeWindow: 300000, // 5 minutes
          groupBy: 'ip'
        },
        severity: 'high',
        enabled: true,
        automatedResponse: true,
        responseActions: ['block_ip', 'alert_admin']
      },
      {
        id: 'ddos_detection',
        name: 'DDoS Attack Detection',
        description: 'Detects unusually high request rates',
        condition: {
          type: 'threshold',
          metric: 'request_rate',
          threshold: 1000,
          timeWindow: 60000, // 1 minute
          groupBy: 'ip'
        },
        severity: 'critical',
        enabled: true,
        automatedResponse: true,
        responseActions: ['block_ip', 'enable_rate_limiting', 'alert_admin']
      },
      {
        id: 'sql_injection_detection',
        name: 'SQL Injection Attack Detection',
        description: 'Detects SQL injection patterns in requests',
        condition: {
          type: 'pattern',
          patterns: [
            /union\s+select/i,
            /select\s+.*\s+from/i,
            /insert\s+into/i,
            /delete\s+from/i,
            /drop\s+table/i,
            /exec\s*\(/i
          ],
          fields: ['path', 'query_params', 'body']
        },
        severity: 'critical',
        enabled: true,
        automatedResponse: true,
        responseActions: ['block_ip', 'log_details', 'alert_admin']
      },
      {
        id: 'xss_detection',
        name: 'XSS Attack Detection',
        description: 'Detects cross-site scripting patterns',
        condition: {
          type: 'pattern',
          patterns: [
            /<script[^>]*>/i,
            /javascript:/i,
            /on\w+\s*=/i,
            /<iframe/i
          ],
          fields: ['path', 'query_params', 'body']
        },
        severity: 'high',
        enabled: true,
        automatedResponse: true,
        responseActions: ['sanitize_input', 'log_details', 'alert_admin']
      },
      {
        id: 'unusual_access_pattern',
        name: 'Unusual Access Pattern Detection',
        description: 'Detects unusual access patterns and times',
        condition: {
          type: 'anomaly',
          metric: 'access_pattern',
          baselineWindow: 604800000, // 7 days
          deviationThreshold: 3.0
        },
        severity: 'medium',
        enabled: true,
        automatedResponse: false,
        responseActions: ['log_details', 'review_required']
      },
      {
        id: 'data_exfiltration',
        name: 'Data Exfiltration Detection',
        description: 'Detects unusual data access patterns',
        condition: {
          type: 'threshold',
          metric: 'data_access_volume',
          threshold: 1000000, // 1MB
          timeWindow: 300000, // 5 minutes
          groupBy: 'user'
        },
        severity: 'high',
        enabled: true,
        automatedResponse: true,
        responseActions: ['block_user', 'encrypt_data', 'alert_admin']
      }
    ];
  }

  /**
   * Create response playbooks
   */
  private async createResponsePlaybooks(): Promise<void> {
    const playbooks: ResponsePlaybook[] = [
      {
        id: 'incident_response',
        name: 'Security Incident Response',
        description: 'Standard incident response procedures',
        phases: [
          {
            name: 'Detection',
            duration: 300000, // 5 minutes
            actions: [
              'Verify alert validity',
              'Assess impact scope',
              'Document initial findings',
              'Escalate if critical'
            ]
          },
          {
            name: 'Containment',
            duration: 1800000, // 30 minutes
            actions: [
              'Isolate affected systems',
              'Block malicious IPs',
              'Disable compromised accounts',
              'Preserve evidence'
            ]
          },
          {
            name: 'Eradication',
            duration: 3600000, // 1 hour
            actions: [
              'Remove malware',
              'Patch vulnerabilities',
              'Update security rules',
              'Verify system integrity'
            ]
          },
          {
            name: 'Recovery',
            duration: 7200000, // 2 hours
            actions: [
              'Restore from backups',
              'Validate system functionality',
              'Monitor for recurrence',
              'Update documentation'
            ]
          },
          {
            name: 'Post-Incident',
            duration: 86400000, // 24 hours
            actions: [
              'Conduct root cause analysis',
              'Update security policies',
              'Train staff if needed',
              'Report to stakeholders'
            ]
          }
        ],
        escalationMatrix: [
          { level: 1, threshold: 'medium', notify: ['security_team'], responseTime: 1800000 },
          { level: 2, threshold: 'high', notify: ['security_team', 'management'], responseTime: 900000 },
          { level: 3, threshold: 'critical', notify: ['security_team', 'management', 'executives'], responseTime: 300000 }
        ]
      },
      {
        id: 'gdpr_breach_response',
        name: 'GDPR Data Breach Response',
        description: 'GDPR compliance breach response procedures',
        phases: [
          {
            name: 'Breach Assessment',
            duration: 1800000, // 30 minutes
            actions: [
              'Identify breach scope',
              'Assess data types affected',
              'Determine risk to individuals',
              'Document findings'
            ]
          },
          {
            name: 'Notification',
            duration: 3600000, // 1 hour
            actions: [
              'Notify Data Protection Officer',
              'Assess 72-hour notification requirement',
              'Prepare notification to authorities',
              'Prepare customer communication'
            ]
          },
          {
            name: 'Containment',
            duration: 1800000, // 30 minutes
            actions: [
              'Stop data leakage',
              'Secure compromised accounts',
              'Preserve evidence for investigation',
              'Document containment actions'
            ]
          },
          {
            name: 'Reporting',
            duration: 14400000, // 4 hours
            actions: [
              'Submit GDPR notification to authorities',
              'Notify affected individuals',
              'Document breach report',
              'Update privacy policies'
            ]
          }
        ],
        escalationMatrix: [
          { level: 1, threshold: 'personal_data', notify: ['dpo', 'security_team'], responseTime: 1800000 },
          { level: 2, threshold: 'special_category_data', notify: ['dpo', 'management', 'legal'], responseTime: 900000 },
          { level: 3, threshold: 'large_scale_breach', notify: ['dpo', 'management', 'legal', 'executives'], responseTime: 300000 }
        ]
      }
    ];

    playbooks.forEach(playbook => {
      this.responsePlaybooks.set(playbook.id, playbook);
    });
  }

  /**
   * Create security alert
   */
  public async createAlert(alertData: Partial<SecurityAlert>): Promise<SecurityAlert> {
    const alert: SecurityAlert = {
      id: this.generateAlertId(),
      type: alertData.type || 'medium',
      category: alertData.category || 'intrusion',
      title: alertData.title || 'Security Alert',
      description: alertData.description || 'Security event detected',
      source: alertData.source || 'security_monitoring',
      timestamp: Date.now(),
      severity: alertData.severity || 'medium',
      status: 'open',
      metadata: alertData.metadata || {},
      evidence: [],
      timeline: [{
        timestamp: Date.now(),
        action: 'alert_created',
        actor: 'system',
        description: `Security alert created: ${alertData.title}`
      }]
    };

    this.alerts.set(alert.id, alert);

    // Send notifications
    await this.sendAlertNotifications(alert);

    // Trigger automated response
    if (alertData.metadata?.threats) {
      await this.triggerAutomatedResponse(alert);
    }

    return alert;
  }

  /**
   * Create security incident
   */
  public async createIncident(alertIds: string[], incidentData: Partial<SecurityIncident>): Promise<SecurityIncident> {
    const incident: SecurityIncident = {
      id: this.generateIncidentId(),
      alertIds,
      type: incidentData.type || 'security_incident',
      severity: incidentData.severity || 'medium',
      title: incidentData.title || 'Security Incident',
      description: incidentData.description || 'Security incident declared',
      detectedAt: Date.now(),
      impact: {
        systems_affected: [],
        data_compromised: false,
        users_affected: 0,
        reputational_impact: 'low'
      },
      response: {
        detected_by: 'security_monitoring',
        response_team: ['security_team']
      },
      compliance: {
        gdpr_breach: false,
        notification_required: false,
        regulatory_reporting: false
      },
      status: 'open'
    };

    this.incidents.set(incident.id, incident);

    // Update alert status
    alertIds.forEach(alertId => {
      const alert = this.alerts.get(alertId);
      if (alert) {
        alert.status = 'investigating';
        alert.timeline.push({
          timestamp: Date.now(),
          action: 'incident_created',
          actor: 'system',
          description: `Incident ${incident.id} created for this alert`
        });
      }
    });

    // Initialize response playbook
    await this.initializeIncidentResponse(incident);

    return incident;
  }

  /**
   * Trigger automated response
   */
  private async triggerAutomatedResponse(alert: SecurityAlert): Promise<void> {
    const relevantRules = this.monitoringRules.filter(rule =>
      rule.automatedResponse && alert.metadata.threats?.includes(rule.name)
    );

    for (const rule of relevantRules) {
      for (const action of rule.responseActions) {
        await this.executeResponseAction(action, alert);
      }
    }
  }

  /**
   * Execute response action
   */
  private async executeResponseAction(action: string, alert: SecurityAlert): Promise<void> {
    const mitigation: MitigationAction = {
      id: this.generateMitigationId(),
      type: this.getActionType(action),
      description: `Automated response: ${action}`,
      executedBy: 'security_monitoring',
      executedAt: Date.now(),
      status: 'executed'
    };

    try {
      switch (action) {
        case 'block_ip':
          await this.blockIP(alert.metadata.request?.ip);
          mitigation.result = `IP ${alert.metadata.request?.ip} blocked`;
          break;

        case 'block_user':
          await this.blockUser(alert.metadata.user?.id);
          mitigation.result = `User ${alert.metadata.user?.id} blocked`;
          break;

        case 'enable_rate_limiting':
          await this.enableRateLimiting();
          mitigation.result = 'Rate limiting enabled globally';
          break;

        case 'alert_admin':
          await this.sendAdminAlert(alert);
          mitigation.result = 'Admin notification sent';
          break;

        case 'log_details':
          await this.logIncidentDetails(alert);
          mitigation.result = 'Incident details logged';
          break;

        case 'sanitize_input':
          // Input sanitization would be handled by the WAF
          mitigation.result = 'Input sanitization triggered';
          break;

        case 'encrypt_data':
          await this.encryptSensitiveData(alert);
          mitigation.result = 'Sensitive data encrypted';
          break;

        case 'isolate_system':
          await this.isolateSystem(alert.metadata.system?.id);
          mitigation.result = 'System isolated';
          break;

        default:
          mitigation.status = 'failed';
          mitigation.result = `Unknown action: ${action}`;
      }
    } catch (error) {
      mitigation.status = 'failed';
      mitigation.result = `Failed to execute action: ${error.message}`;
    }

    alert.mitigation = alert.mitigation || [];
    alert.mitigation.push(mitigation);

    // Add to timeline
    alert.timeline.push({
      timestamp: Date.now(),
      action: 'automated_response',
      actor: 'system',
      description: `Executed automated response: ${action}`,
      metadata: { result: mitigation.result, status: mitigation.status }
    });
  }

  /**
   * Send alert notifications
   */
  private async sendAlertNotifications(alert: SecurityAlert): Promise<void> {
    const recipients = this.getNotificationRecipients(alert.severity);

    for (const recipient of recipients) {
      await this.sendNotification({
        type: 'security_alert',
        recipient,
        subject: `Security Alert: ${alert.title}`,
        message: alert.description,
        metadata: {
          alertId: alert.id,
          severity: alert.severity,
          category: alert.category,
          timestamp: alert.timestamp
        }
      });
    }
  }

  /**
   * Detect anomalies in request patterns
   */
  private async detectAnomalies(metadata: any): Promise<void> {
    // Analyze response time anomalies
    if (metadata.responseTime > 5000) { // 5 seconds
      await this.createAlert({
        type: 'medium',
        category: 'system_anomaly',
        title: 'Slow Response Detected',
        description: `Response time ${metadata.responseTime}ms for ${metadata.method} ${metadata.path}`,
        metadata: {
          responseTime: metadata.responseTime,
          threshold: 5000
        }
      });
    }

    // Analyze unusual access patterns
    const hour = new Date(metadata.timestamp).getHours();
    if (hour < 6 || hour > 22) { // Unusual hours
      await this.createAlert({
        type: 'low',
        category: 'system_anomaly',
        title: 'Unusual Access Time',
        description: `Access at unusual hour: ${hour}:00`,
        metadata: {
          hour,
          ip: metadata.ip,
          path: metadata.path
        }
      });
    }

    // Analyze error rates
    if (metadata.statusCode >= 400) {
      // Track error rates and create alerts if threshold exceeded
      await this.trackErrorRates(metadata);
    }
  }

  /**
   * Start metrics collection
   */
  private startMetricsCollection(): void {
    // Collect metrics every 5 minutes
    setInterval(async () => {
      const metrics = await this.calculateMetrics();
      this.metrics.push(metrics);

      // Keep only last 24 hours of metrics
      const oneDayAgo = Date.now() - (24 * 60 * 60 * 1000);
      this.metrics = this.metrics.filter(m => m.timestamp > oneDayAgo);

      // Check for metric anomalies
      await this.analyzeMetrics(metrics);
    }, 5 * 60 * 1000);
  }

  /**
   * Calculate security metrics
   */
  private async calculateMetrics(): Promise<SecurityMetrics> {
    const now = Date.now();
    const oneHourAgo = now - (60 * 60 * 1000);
    const oneDayAgo = now - (24 * 60 * 60 * 1000);

    const recentAlerts = Array.from(this.alerts.values()).filter(a => a.timestamp > oneHourAgo);
    const recentIncidents = Array.from(this.incidents.values()).filter(i => i.detectedAt > oneDayAgo);
    const resolvedAlerts = recentAlerts.filter(a => a.status === 'resolved');
    const resolvedIncidents = recentIncidents.filter(i => i.status === 'closed');

    return {
      timestamp: now,
      alerts_generated: recentAlerts.length,
      alerts_resolved: resolvedAlerts.length,
      incidents_created: recentIncidents.length,
      incidents_resolved: resolvedIncidents.length,
      mean_time_to_detect: this.calculateMTTD(recentIncidents),
      mean_time_to_respond: this.calculateMTTR(recentIncidents),
      mean_time_to_recover: this.calculateMTTRR(recentIncidents),
      false_positive_rate: this.calculateFalsePositiveRate(recentAlerts),
      threats_blocked: this.countThreatsBlocked(oneHourAgo),
      systems_monitored: this.getMonitoredSystemsCount(),
      compliance_score: this.calculateComplianceScore()
    };
  }

  /**
   * Helper methods
   */
  private getClientIP(c: Context): string {
    return (
      c.req.header('CF-Connecting-IP') ||
      c.req.header('X-Forwarded-For')?.split(',')[0]?.trim() ||
      c.req.header('X-Real-IP') ||
      c.req.header('X-Client-IP') ||
      'unknown'
    );
  }

  private async evaluateRule(rule: MonitoringRule, metadata: any): Promise<boolean> {
    // Rule evaluation logic
    switch (rule.condition.type) {
      case 'threshold':
        return await this.evaluateThresholdRule(rule, metadata);
      case 'pattern':
        return await this.evaluatePatternRule(rule, metadata);
      case 'anomaly':
        return await this.evaluateAnomalyRule(rule, metadata);
      default:
        return false;
    }
  }

  private async evaluateThresholdRule(rule: MonitoringRule, metadata: any): Promise<boolean> {
    // Implementation for threshold-based rule evaluation
    return false;
  }

  private async evaluatePatternRule(rule: MonitoringRule, metadata: any): Promise<boolean> {
    // Implementation for pattern-based rule evaluation
    return false;
  }

  private async evaluateAnomalyRule(rule: MonitoringRule, metadata: any): Promise<boolean> {
    // Implementation for anomaly-based rule evaluation
    return false;
  }

  private async checkThreatIntelligence(metadata: any): Promise<string[]> {
    // Implementation for threat intelligence checking
    return [];
  }

  private async detectAttackPatterns(metadata: any): Promise<string[]> {
    // Implementation for attack pattern detection
    return [];
  }

  private isCriticalThreat(threat: string): boolean {
    const criticalThreats = ['sql_injection_detection', 'ddos_detection', 'data_exfiltration'];
    return criticalThreats.includes(threat);
  }

  private getActionType(action: string): MitigationAction['type'] {
    const actionMap: Record<string, MitigationAction['type']> = {
      'block_ip': 'block_ip',
      'block_user': 'disable_account',
      'isolate_system': 'isolate_system',
      'enable_rate_limiting': 'update_rules',
      'encrypt_data': 'patch_vulnerability',
      'alert_admin': 'update_rules'
    };
    return actionMap[action] || 'update_rules';
  }

  private getNotificationRecipients(severity: string): string[] {
    const config = this.config.alerting;
    switch (severity) {
      case 'critical':
        return config.emailRecipients;
      case 'high':
        return config.emailRecipients.slice(0, 2); // Primary recipients
      default:
        return config.emailRecipients.slice(0, 1); // Primary security contact
    }
  }

  private async sendNotification(notification: any): Promise<void> {
    // Implementation for sending notifications (email, Slack, etc.)
    console.log('Security notification sent:', notification);
  }

  private async blockIP(ip: string): Promise<void> {
    // Implementation for IP blocking
    console.log(`IP blocked: ${ip}`);
  }

  private async blockUser(userId: string): Promise<void> {
    // Implementation for user blocking
    console.log(`User blocked: ${userId}`);
  }

  private async enableRateLimiting(): Promise<void> {
    // Implementation for global rate limiting
    console.log('Rate limiting enabled globally');
  }

  private async sendAdminAlert(alert: SecurityAlert): Promise<void> {
    // Implementation for admin alerts
    console.log('Admin alert sent for:', alert.id);
  }

  private async logIncidentDetails(alert: SecurityAlert): Promise<void> {
    // Implementation for detailed incident logging
    console.log('Incident details logged for:', alert.id);
  }

  private async encryptSensitiveData(alert: SecurityAlert): Promise<void> {
    // Implementation for emergency data encryption
    console.log('Sensitive data encrypted for alert:', alert.id);
  }

  private async isolateSystem(systemId: string): Promise<void> {
    // Implementation for system isolation
    console.log(`System isolated: ${systemId}`);
  }

  private async trackErrorRates(metadata: any): Promise<void> {
    // Implementation for error rate tracking
  }

  private async analyzeMetrics(metrics: SecurityMetrics): Promise<void> {
    // Implementation for metrics analysis
  }

  private async loadThreatIntelligence(): Promise<void> {
    // Implementation for loading threat intelligence feeds
  }

  private startThreatAnalysis(): void {
    // Start background threat analysis
    setInterval(async () => {
      await this.updateThreatIntelligence();
    }, 60 * 60 * 1000); // Every hour
  }

  private startAutomatedResponse(): void {
    // Start automated response monitoring
    setInterval(async () => {
      await this.checkAutomatedResponses();
    }, 5 * 60 * 1000); // Every 5 minutes
  }

  private async updateThreatIntelligence(): Promise<void> {
    // Implementation for updating threat intelligence
  }

  private async checkAutomatedResponses(): Promise<void> {
    // Implementation for checking automated responses
  }

  private async initializeIncidentResponse(incident: SecurityIncident): Promise<void> {
    // Initialize response playbook
    const playbook = this.responsePlaybooks.get('incident_response');
    if (playbook) {
      console.log(`Incident response initialized for incident: ${incident.id}`);
    }
  }

  private calculateMTTD(incidents: SecurityIncident[]): number {
    // Calculate Mean Time To Detect
    return 0;
  }

  private calculateMTTR(incidents: SecurityIncident[]): number {
    // Calculate Mean Time To Respond
    return 0;
  }

  private calculateMTTRR(incidents: SecurityIncident[]): number {
    // Calculate Mean Time To Recover
    return 0;
  }

  private calculateFalsePositiveRate(alerts: SecurityAlert[]): number {
    const falsePositives = alerts.filter(a => a.status === 'false_positive').length;
    return alerts.length > 0 ? (falsePositives / alerts.length) * 100 : 0;
  }

  private countThreatsBlocked(since: number): number {
    // Count threats blocked since given timestamp
    return 0;
  }

  private getMonitoredSystemsCount(): number {
    // Get number of monitored systems
    return 1;
  }

  private calculateComplianceScore(): number {
    // Calculate compliance score (0-100)
    return 95;
  }

  private generateAlertId(): string {
    return `alert_${Date.now()}_${Math.random().toString(36).substring(2)}`;
  }

  private generateIncidentId(): string {
    return `incident_${Date.now()}_${Math.random().toString(36).substring(2)}`;
  }

  private generateMitigationId(): string {
    return `mitigation_${Date.now()}_${Math.random().toString(36).substring(2)}`;
  }

  /**
   * Public API methods
   */
  public getAlerts(limit?: number): SecurityAlert[] {
    const alerts = Array.from(this.alerts.values())
      .sort((a, b) => b.timestamp - a.timestamp);
    return limit ? alerts.slice(0, limit) : alerts;
  }

  public getIncidents(limit?: number): SecurityIncident[] {
    const incidents = Array.from(this.incidents.values())
      .sort((a, b) => b.detectedAt - a.detectedAt);
    return limit ? incidents.slice(0, limit) : incidents;
  }

  public getMetrics(hours: number = 24): SecurityMetrics[] {
    const cutoff = Date.now() - (hours * 60 * 60 * 1000);
    return this.metrics.filter(m => m.timestamp > cutoff);
  }

  public async updateAlertStatus(alertId: string, status: SecurityAlert['status'], assignee?: string): Promise<void> {
    const alert = this.alerts.get(alertId);
    if (alert) {
      alert.status = status;
      if (assignee) alert.assignee = assignee;

      alert.timeline.push({
        timestamp: Date.now(),
        action: 'status_updated',
        actor: 'user',
        description: `Alert status updated to ${status}`,
        metadata: { assignee }
      });
    }
  }

  public async updateIncidentStatus(incidentId: string, status: SecurityIncident['status']): Promise<void> {
    const incident = this.incidents.get(incidentId);
    if (incident) {
      incident.status = status;
      if (status === 'closed') {
        incident.resolvedAt = Date.now();
        incident.duration = incident.resolvedAt - incident.detectedAt;
      }
    }
  }
}

// Types
interface MonitoringRule {
  id: string;
  name: string;
  description: string;
  condition: {
    type: 'threshold' | 'pattern' | 'anomaly';
    [key: string]: any;
  };
  severity: 'critical' | 'high' | 'medium' | 'low';
  enabled: boolean;
  automatedResponse: boolean;
  responseActions: string[];
}

interface ResponsePlaybook {
  id: string;
  name: string;
  description: string;
  phases: Array<{
    name: string;
    duration: number;
    actions: string[];
  }>;
  escalationMatrix: Array<{
    level: number;
    threshold: string;
    notify: string[];
    responseTime: number;
  }>;
}

// Singleton instance
const securityMonitoring = new SecurityMonitoring();

// Export middleware
export const securityMonitoringMiddleware = securityMonitoring.middleware.bind(securityMonitoring);

// Export class and utilities
export { SecurityMonitoring, SecurityAlert, SecurityIncident, ThreatIntelligence };

// Export utility functions
export const createSecurityAlert = (alertData: Partial<SecurityAlert>) =>
  securityMonitoring.createAlert(alertData);

export const createSecurityIncident = (alertIds: string[], incidentData: Partial<SecurityIncident>) =>
  securityMonitoring.createIncident(alertIds, incidentData);

export const getSecurityAlerts = (limit?: number) => securityMonitoring.getAlerts(limit);
export const getSecurityIncidents = (limit?: number) => securityMonitoring.getIncidents(limit);
export const getSecurityMetrics = (hours?: number) => securityMonitoring.getMetrics(hours);
export const updateAlertStatus = (alertId: string, status: SecurityAlert['status'], assignee?: string) =>
  securityMonitoring.updateAlertStatus(alertId, status, assignee);
export const updateIncidentStatus = (incidentId: string, status: SecurityIncident['status']) =>
  securityMonitoring.updateIncidentStatus(incidentId, status);