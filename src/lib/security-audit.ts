/**
 * Security Audit and Credential Access Logging
 *
 * This module provides comprehensive security audit logging for
 * credential access, configuration changes, and security events.
 */

interface SecurityAuditEvent {
  id: string;
  timestamp: string;
  eventType: 'credential_access' | 'credential_rotation' | 'configuration_change' | 'authentication_event' | 'security_incident';
  userId?: string;
  resource: string;
  action: string;
  result: 'success' | 'failure' | 'warning';
  ip?: string;
  userAgent?: string;
  details?: Record<string, any>;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

interface SecurityMetrics {
  totalEvents: number;
  criticalEvents: number;
  highSeverityEvents: number;
  recentSuspiciousActivity: number;
  lastRotationDate?: string;
  upcomingRotations: Array<{
    credential: string;
    daysUntilRotation: number;
  }>;
}

class SecurityAuditor {
  private events: SecurityAuditEvent[] = [];
  private readonly MAX_EVENTS = 1000;
  private readonly RETENTION_DAYS = 730; // 2 years

  constructor() {
    this.loadStoredEvents();
    this.startPeriodicCleanup();
  }

  /**
   * Log a security audit event
   */
  public logEvent(event: Omit<SecurityAuditEvent, 'id' | 'timestamp'>): void {
    const auditEvent: SecurityAuditEvent = {
      id: this.generateEventId(),
      timestamp: new Date().toISOString(),
      ...event,
    };

    this.events.push(auditEvent);
    this.trimEvents();
    this.persistEvents();

    // Immediate alert for critical events
    if (event.severity === 'critical') {
      this.triggerSecurityAlert(auditEvent);
    }

    // Log to console in development
    if (import.meta.env.DEV) {
      console.log('Security Audit:', auditEvent);
    }
  }

  /**
   * Log credential access
   */
  public logCredentialAccess(
    credentialName: string,
    userId?: string,
    ip?: string,
    userAgent?: string
  ): void {
    this.logEvent({
      eventType: 'credential_access',
      resource: credentialName,
      action: 'access',
      result: 'success',
      userId,
      ip,
      userAgent,
      severity: 'medium',
      details: {
        accessMethod: 'application_read',
        environment: import.meta.env.VITE_APP_ENV,
      },
    });
  }

  /**
   * Log credential rotation
   */
  public logCredentialRotation(
    credentialName: string,
    rotationType: 'scheduled' | 'emergency',
    userId?: string,
    success: boolean = true
  ): void {
    this.logEvent({
      eventType: 'credential_rotation',
      resource: credentialName,
      action: 'rotate',
      result: success ? 'success' : 'failure',
      userId,
      severity: rotationType === 'emergency' ? 'high' : 'medium',
      details: {
        rotationType,
        timestamp: new Date().toISOString(),
      },
    });
  }

  /**
   * Log configuration changes
   */
  public logConfigurationChange(
    configurationType: string,
    changeDescription: string,
    userId?: string,
    oldValue?: string,
    newValue?: string
  ): void {
    this.logEvent({
      eventType: 'configuration_change',
      resource: configurationType,
      action: 'update',
      result: 'success',
      userId,
      severity: 'low',
      details: {
        changeDescription,
        oldValue: oldValue ? 'REDACTED' : undefined,
        newValue: newValue ? 'REDACTED' : undefined,
      },
    });
  }

  /**
   * Log authentication events
   */
  public logAuthenticationEvent(
    authType: string,
    success: boolean,
    userId?: string,
    ip?: string,
    userAgent?: string,
    failureReason?: string
  ): void {
    this.logEvent({
      eventType: 'authentication_event',
      resource: authType,
      action: 'authenticate',
      result: success ? 'success' : 'failure',
      userId,
      ip,
      userAgent,
      severity: success ? 'low' : 'medium',
      details: {
        failureReason,
        authMethod: authType,
      },
    });
  }

  /**
   * Log security incidents
   */
  public logSecurityIncident(
    incidentType: string,
    description: string,
    severity: 'medium' | 'high' | 'critical',
    userId?: string,
    ip?: string,
    details?: Record<string, any>
  ): void {
    this.logEvent({
      eventType: 'security_incident',
      resource: incidentType,
      action: 'incident_detected',
      result: 'warning',
      userId,
      ip,
      severity,
      details: {
        description,
        ...details,
      },
    });
  }

  /**
   * Get security metrics
   */
  public getSecurityMetrics(): SecurityMetrics {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const recentEvents = this.events.filter(event =>
      new Date(event.timestamp) >= thirtyDaysAgo
    );

    const criticalEvents = recentEvents.filter(event => event.severity === 'critical');
    const highSeverityEvents = recentEvents.filter(event => event.severity === 'high');
    const suspiciousActivity = recentEvents.filter(event =>
      event.eventType === 'authentication_event' && event.result === 'failure' ||
      event.eventType === 'security_incident'
    );

    // Get last credential rotation
    const lastRotation = this.events
      .filter(event => event.eventType === 'credential_rotation' && event.result === 'success')
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0];

    // Calculate upcoming rotations (mock data - in real implementation, this would check actual schedules)
    const upcomingRotations = this.calculateUpcomingRotations();

    return {
      totalEvents: recentEvents.length,
      criticalEvents: criticalEvents.length,
      highSeverityEvents: highSeverityEvents.length,
      recentSuspiciousActivity: suspiciousActivity.length,
      lastRotationDate: lastRotation?.timestamp,
      upcomingRotations,
    };
  }

  /**
   * Get recent security events
   */
  public getRecentEvents(limit: number = 50): SecurityAuditEvent[] {
    return this.events
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, limit);
  }

  /**
   * Get events by type
   */
  public getEventsByType(eventType: SecurityAuditEvent['eventType'], limit: number = 100): SecurityAuditEvent[] {
    return this.events
      .filter(event => event.eventType === eventType)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, limit);
  }

  /**
   * Export audit logs (for compliance)
   */
  public exportAuditLogs(startDate?: Date, endDate?: Date): string {
    let filteredEvents = this.events;

    if (startDate) {
      filteredEvents = filteredEvents.filter(event => new Date(event.timestamp) >= startDate);
    }

    if (endDate) {
      filteredEvents = filteredEvents.filter(event => new Date(event.timestamp) <= endDate);
    }

    // Create CSV export
    const headers = ['ID', 'Timestamp', 'Event Type', 'User ID', 'Resource', 'Action', 'Result', 'Severity', 'IP', 'User Agent'];
    const rows = filteredEvents.map(event => [
      event.id,
      event.timestamp,
      event.eventType,
      event.userId || '',
      event.resource,
      event.action,
      event.result,
      event.severity,
      event.ip || '',
      event.userAgent || '',
    ]);

    return [headers, ...rows].map(row => row.join(',')).join('\n');
  }

  /**
   * Check for security anomalies
   */
  public detectSecurityAnomalies(): Array<{
    type: string;
    description: string;
    severity: 'medium' | 'high' | 'critical';
    events: SecurityAuditEvent[];
  }> {
    const anomalies = [];
    const now = new Date();
    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    const recentEvents = this.events.filter(event =>
      new Date(event.timestamp) >= twentyFourHoursAgo
    );

    // Check for multiple failed authentication attempts
    const failedAuthByIP = new Map<string, SecurityAuditEvent[]>();
    recentEvents
      .filter(event => event.eventType === 'authentication_event' && event.result === 'failure')
      .forEach(event => {
        const ip = event.ip || 'unknown';
        if (!failedAuthByIP.has(ip)) {
          failedAuthByIP.set(ip, []);
        }
        failedAuthByIP.get(ip)!.push(event);
      });

    failedAuthByIP.forEach((events, ip) => {
      if (events.length >= 5) {
        anomalies.push({
          type: 'brute_force_attempt',
          description: `Multiple failed authentication attempts from IP: ${ip}`,
          severity: 'high',
          events,
        });
      }
    });

    // Check for credential access from unusual locations
    const credentialAccessByIP = new Map<string, SecurityAuditEvent[]>();
    recentEvents
      .filter(event => event.eventType === 'credential_access')
      .forEach(event => {
        const ip = event.ip || 'unknown';
        if (!credentialAccessByIP.has(ip)) {
          credentialAccessByIP.set(ip, []);
        }
        credentialAccessByIP.get(ip)!.push(event);
      });

    credentialAccessByIP.forEach((events, ip) => {
      if (events.length >= 10) {
        anomalies.push({
          type: 'excessive_credential_access',
          description: `High volume of credential access from IP: ${ip}`,
          severity: 'medium',
          events,
        });
      }
    });

    // Check for configuration changes without proper rotation
    const configChanges = recentEvents.filter(event =>
      event.eventType === 'configuration_change'
    );

    if (configChanges.length >= 5) {
      anomalies.push({
        type: 'excessive_config_changes',
        description: 'High volume of configuration changes detected',
        severity: 'medium',
        events: configChanges,
      });
    }

    return anomalies;
  }

  private generateEventId(): string {
    return `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private loadStoredEvents(): void {
    try {
      const stored = localStorage.getItem('security_audit_events');
      if (stored) {
        this.events = JSON.parse(stored);
      }
    } catch (error) {
      console.warn('Failed to load security audit events:', error);
      this.events = [];
    }
  }

  private persistEvents(): void {
    try {
      localStorage.setItem('security_audit_events', JSON.stringify(this.events));
    } catch (error) {
      console.warn('Failed to persist security audit events:', error);
    }
  }

  private trimEvents(): void {
    if (this.events.length > this.MAX_EVENTS) {
      this.events = this.events.slice(-this.MAX_EVENTS);
    }

    // Remove old events beyond retention period
    const cutoffDate = new Date(Date.now() - this.RETENTION_DAYS * 24 * 60 * 60 * 1000);
    this.events = this.events.filter(event => new Date(event.timestamp) >= cutoffDate);
  }

  private startPeriodicCleanup(): void {
    setInterval(() => {
      this.trimEvents();
      this.persistEvents();
    }, 60 * 60 * 1000); // Run every hour
  }

  private triggerSecurityAlert(event: SecurityAuditEvent): void {
    // In a real implementation, this would send alerts to security team
    console.error('CRITICAL SECURITY ALERT:', event);

    // Could integrate with alerting systems like:
    // - Email notifications
    // - Slack/Teams messages
    // - PagerDuty alerts
    // - Security monitoring systems
  }

  private calculateUpcomingRotations(): Array<{
    credential: string;
    daysUntilRotation: number;
  }> {
    // Mock implementation - in real system, this would check actual rotation schedules
    const mockCredentials = [
      { name: 'Stripe Secret Key', lastRotation: new Date('2024-01-01'), frequency: 90 },
      { name: 'Supabase Keys', lastRotation: new Date('2024-01-15'), frequency: 365 },
      { name: 'Resend API Key', lastRotation: new Date('2024-02-01'), frequency: 180 },
    ];

    const now = new Date();
    return mockCredentials.map(cred => {
      const nextRotation = new Date(cred.lastRotation.getTime() + cred.frequency * 24 * 60 * 60 * 1000);
      const daysUntil = Math.ceil((nextRotation.getTime() - now.getTime()) / (24 * 60 * 60 * 1000));

      return {
        credential: cred.name,
        daysUntilRotation: Math.max(0, daysUntil),
      };
    });
  }
}

// Create singleton instance
const securityAuditor = new SecurityAuditor();

// Export functions for use in application
export const logCredentialAccess = (
  credentialName: string,
  userId?: string,
  ip?: string,
  userAgent?: string
) => securityAuditor.logCredentialAccess(credentialName, userId, ip, userAgent);

export const logCredentialRotation = (
  credentialName: string,
  rotationType: 'scheduled' | 'emergency',
  userId?: string,
  success?: boolean
) => securityAuditor.logCredentialRotation(credentialName, rotationType, userId, success);

export const logConfigurationChange = (
  configurationType: string,
  changeDescription: string,
  userId?: string,
  oldValue?: string,
  newValue?: string
) => securityAuditor.logConfigurationChange(configurationType, changeDescription, userId, oldValue, newValue);

export const logAuthenticationEvent = (
  authType: string,
  success: boolean,
  userId?: string,
  ip?: string,
  userAgent?: string,
  failureReason?: string
) => securityAuditor.logAuthenticationEvent(authType, success, userId, ip, userAgent, failureReason);

export const logSecurityIncident = (
  incidentType: string,
  description: string,
  severity: 'medium' | 'high' | 'critical',
  userId?: string,
  ip?: string,
  details?: Record<string, any>
) => securityAuditor.logSecurityIncident(incidentType, description, severity, userId, ip, details);

export const getSecurityMetrics = () => securityAuditor.getSecurityMetrics();
export const getRecentSecurityEvents = (limit?: number) => securityAuditor.getRecentEvents(limit);
export const exportSecurityAuditLogs = (startDate?: Date, endDate?: Date) =>
  securityAuditor.exportAuditLogs(startDate, endDate);
export const detectSecurityAnomalies = () => securityAuditor.detectSecurityAnomalies();

export default securityAuditor;