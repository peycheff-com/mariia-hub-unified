/**
 * Security Monitoring and Alerting System
 *
 * Provides comprehensive security monitoring for application including
 * real-time threat detection, security event logging, and automated alerting.
 */

interface SecurityEvent {
  id: string;
  type: SecurityEventType;
  severity: SecuritySeverity;
  timestamp: number;
  description: string;
  userId?: string;
  sessionId?: string;
  ipAddress?: string;
  userAgent?: string;
  metadata: Record<string, any>;
  resolved: boolean;
  resolvedAt?: number;
  resolvedBy?: string;
}

export enum SecurityEventType {
  AUTHENTICATION_FAILURE = 'AUTHENTICATION_FAILURE',
  SUSPICIOUS_LOGIN = 'SUSPICIOUS_LOGIN',
  BRUTE_FORCE_ATTEMPT = 'BRUTE_FORCE_ATTEMPT',
  SESSION_HIJACKING = 'SESSION_HIJACKING',
  XSS_DETECTED = 'XSS_DETECTED',
  SQL_INJECTION_ATTEMPT = 'SQL_INJECTION_ATTEMPT',
  CSRF_ATTACK = 'CSRF_ATTACK',
  UNAUTHORIZED_ACCESS = 'UNAUTHORIZED_ACCESS',
  DATA_EXFILTRATION = 'DATA_EXFILTRATION',
  MALICIOUS_REQUEST = 'MALICIOUS_REQUEST',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  ACCOUNT_TAKEOVER = 'ACCOUNT_TAKEOVER',
  PRIVILEGE_ESCALATION = 'PRIVILEGE_ESCALATION',
  ANOMALOUS_BEHAVIOR = 'ANOMALOUS_BEHAVIOR',
  SECURITY_POLICY_VIOLATION = 'SECURITY_POLICY_VIOLATION'
}

export enum SecuritySeverity {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL'
}

interface SecurityThresholds {
  failedLoginAttempts: number;
  failedLoginTimeWindow: number;
  suspiciousRequestRate: number;
  suspiciousRequestTimeWindow: number;
  dataAccessThreshold: number;
  dataAccessTimeWindow: number;
}

export const SECURITY_THRESHOLDS: SecurityThresholds = {
  failedLoginAttempts: 5,
  failedLoginTimeWindow: 15 * 60 * 1000, // 15 minutes
  suspiciousRequestRate: 100,
  suspiciousRequestTimeWindow: 60 * 1000, // 1 minute
  dataAccessThreshold: 1000,
  dataAccessTimeWindow: 60 * 60 * 1000 // 1 hour
};

interface SecurityMetrics {
  totalEvents: number;
  criticalEvents: number;
  highSeverityEvents: number;
  mediumSeverityEvents: number;
  lowSeverityEvents: number;
  unresolvedEvents: number;
  averageResolutionTime: number;
  falsePositiveRate: number;
  lastUpdated: number;
}

/**
 * Security Monitoring System
 */
export class SecurityMonitoringSystem {
  private static instance: SecurityMonitoringSystem;
  private events: SecurityEvent[] = [];
  private activeThreats: Map<string, SecurityEvent> = new Map();
  private metrics: SecurityMetrics = {
    totalEvents: 0,
    criticalEvents: 0,
    highSeverityEvents: 0,
    mediumSeverityEvents: 0,
    lowSeverityEvents: 0,
    unresolvedEvents: 0,
    averageResolutionTime: 0,
    falsePositiveRate: 0,
    lastUpdated: Date.now()
  };
  private alertCallbacks: Map<SecuritySeverity, Array<(event: SecurityEvent) => void>> = new Map();
  private monitoringEnabled: boolean = true;

  private constructor() {
    this.initializeAlertCallbacks();
    this.startMonitoring();
  }

  static getInstance(): SecurityMonitoringSystem {
    if (!SecurityMonitoringSystem.instance) {
      SecurityMonitoringSystem.instance = new SecurityMonitoringSystem();
    }
    return SecurityMonitoringSystem.instance;
  }

  /**
   * Log a security event
   */
  logSecurityEvent(
    type: SecurityEventType,
    severity: SecuritySeverity,
    description: string,
    metadata: Record<string, any> = {}
  ): SecurityEvent {
    const event: SecurityEvent = {
      id: this.generateEventId(),
      type,
      severity,
      timestamp: Date.now(),
      description,
      metadata,
      resolved: false
    };

    this.events.push(event);
    this.updateMetrics(event);
    this.processEvent(event);

    if (this.monitoringEnabled) {
      console.warn(`[SECURITY] ${severity}: ${description}`, {
        type,
        timestamp: new Date(event.timestamp).toISOString(),
        metadata
      });
    }

    return event;
  }

  /**
   * Report authentication failure
   */
  reportAuthenticationFailure(
    email: string,
    ipAddress: string,
    userAgent: string,
    reason: string = 'Invalid credentials'
  ): void {
    this.logSecurityEvent(
      SecurityEventType.AUTHENTICATION_FAILURE,
      SecuritySeverity.MEDIUM,
      `Failed authentication attempt for ${email}: ${reason}`,
      { email, ipAddress, userAgent, reason }
    );

    this.checkForBruteForceAttack(email, ipAddress);
  }

  /**
   * Report suspicious activity
   */
  reportSuspiciousActivity(
    type: SecurityEventType,
    description: string,
    userId?: string,
    sessionId?: string,
    metadata: Record<string, any> = {}
  ): void {
    this.logSecurityEvent(
      type,
      SecuritySeverity.HIGH,
      description,
      { userId, sessionId, ...metadata }
    );
  }

  /**
   * Report XSS attack attempt
   */
  reportXSSAttempt(
    payload: string,
    source: string,
    userId?: string,
    ipAddress?: string
  ): void {
    this.logSecurityEvent(
      SecurityEventType.XSS_DETECTED,
      SecuritySeverity.CRITICAL,
      `XSS attack attempt detected from ${source}`,
      { payload, source, userId, ipAddress }
    );
  }

  /**
   * Report SQL injection attempt
   */
  reportSQLInjectionAttempt(
    query: string,
    source: string,
    userId?: string,
    ipAddress?: string
  ): void {
    this.logSecurityEvent(
      SecurityEventType.SQL_INJECTION_ATTEMPT,
      SecuritySeverity.CRITICAL,
      `SQL injection attempt detected from ${source}`,
      { query, source, userId, ipAddress }
    );
  }

  /**
   * Report unauthorized access attempt
   */
  reportUnauthorizedAccess(
    resource: string,
    userId?: string,
    ipAddress?: string,
    userAgent?: string
  ): void {
    this.logSecurityEvent(
      SecurityEventType.UNAUTHORIZED_ACCESS,
      SecuritySeverity.HIGH,
      `Unauthorized access attempt to ${resource}`,
      { resource, userId, ipAddress, userAgent }
    );
  }

  /**
   * Report rate limit exceeded
   */
  reportRateLimitExceeded(
    endpoint: string,
    clientId: string,
    requestCount: number,
    timeWindow: number
  ): void {
    this.logSecurityEvent(
      SecurityEventType.RATE_LIMIT_EXCEEDED,
      SecuritySeverity.MEDIUM,
      `Rate limit exceeded for ${endpoint}: ${requestCount} requests in ${timeWindow}ms`,
      { endpoint, clientId, requestCount, timeWindow }
    );
  }

  /**
   * Get security metrics
   */
  getSecurityMetrics(): SecurityMetrics {
    return { ...this.metrics };
  }

  /**
   * Get unresolved security events
   */
  getUnresolvedEvents(severity?: SecuritySeverity): SecurityEvent[] {
    let events = this.events.filter(event => !event.resolved);

    if (severity) {
      events = events.filter(event => event.severity === severity);
    }

    return events.sort((a, b) => b.timestamp - a.timestamp);
  }

  /**
   * Get events by time range
   */
  getEventsByTimeRange(
    startTime: number,
    endTime: number,
    severity?: SecuritySeverity
  ): SecurityEvent[] {
    let events = this.events.filter(event =>
      event.timestamp >= startTime && event.timestamp <= endTime
    );

    if (severity) {
      events = events.filter(event => event.severity === severity);
    }

    return events.sort((a, b) => b.timestamp - a.timestamp);
  }

  /**
   * Resolve a security event
   */
  resolveEvent(eventId: string, resolvedBy: string, resolution: string): void {
    const event = this.events.find(e => e.id === eventId);
    if (event) {
      event.resolved = true;
      event.resolvedAt = Date.now();
      event.resolvedBy = resolvedBy;
      event.metadata.resolution = resolution;

      this.updateMetrics();
    }
  }

  /**
   * Add alert callback for specific severity
   */
  addAlertCallback(
    severity: SecuritySeverity,
    callback: (event: SecurityEvent) => void
  ): void {
    if (!this.alertCallbacks.has(severity)) {
      this.alertCallbacks.set(severity, []);
    }
    this.alertCallbacks.get(severity)!.push(callback);
  }

  /**
   * Remove alert callback
   */
  removeAlertCallback(
    severity: SecuritySeverity,
    callback: (event: SecurityEvent) => void
  ): void {
    const callbacks = this.alertCallbacks.get(severity);
    if (callbacks) {
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  /**
   * Enable/disable monitoring
   */
  setMonitoringEnabled(enabled: boolean): void {
    this.monitoringEnabled = enabled;
  }

  /**
   * Generate security event ID
   */
  private generateEventId(): string {
    return `sec_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }

  /**
   * Process security event and trigger alerts
   */
  private processEvent(event: SecurityEvent): void {
    // Check for immediate threats
    if (this.isImmediateThreat(event)) {
      this.activeThreats.set(event.id, event);
    }

    // Trigger alerts
    this.triggerAlerts(event);

    // Automated response
    this.handleAutomatedResponse(event);
  }

  /**
   * Check if event represents an immediate threat
   */
  private isImmediateThreat(event: SecurityEvent): boolean {
    const immediateThreatTypes = [
      SecurityEventType.XSS_DETECTED,
      SecurityEventType.SQL_INJECTION_ATTEMPT,
      SecurityEventType.ACCOUNT_TAKEOVER,
      SecurityEventType.PRIVILEGE_ESCALATION
    ];

    return immediateThreatTypes.includes(event.type) ||
           event.severity === SecuritySeverity.CRITICAL;
  }

  /**
   * Trigger alert callbacks
   */
  private triggerAlerts(event: SecurityEvent): void {
    const callbacks = this.alertCallbacks.get(event.severity);
    if (callbacks) {
      callbacks.forEach(callback => {
        try {
          callback(event);
        } catch (error) {
          console.error('Error in alert callback:', error);
        }
      });
    }
  }

  /**
   * Handle automated security responses
   */
  private handleAutomatedResponse(event: SecurityEvent): void {
    switch (event.type) {
      case SecurityEventType.BRUTE_FORCE_ATTEMPT:
        this.handleBruteForceResponse(event);
        break;
      case SecurityEventType.SESSION_HIJACKING:
        this.handleSessionHijackingResponse(event);
        break;
      case SecurityEventType.XSS_DETECTED:
      case SecurityEventType.SQL_INJECTION_ATTEMPT:
        this.handleCriticalThreatResponse(event);
        break;
    }
  }

  /**
   * Handle brute force attack response
   */
  private handleBruteForceResponse(event: SecurityEvent): void {
    const { ipAddress, email } = event.metadata;

    // Block IP temporarily (would integrate with firewall/rate limiting)
    console.warn(`[AUTOMATED_RESPONSE] Blocking IP ${ipAddress} due to brute force attack`);

    // Send alert to security team
    this.sendSecurityAlert({
      type: 'BRUTE_FORCE_BLOCK',
      message: `IP ${ipAddress} automatically blocked due to brute force attack on ${email}`,
      severity: SecuritySeverity.HIGH,
      event
    });
  }

  /**
   * Handle session hijacking response
   */
  private handleSessionHijackingResponse(event: SecurityEvent): void {
    const { sessionId, userId } = event.metadata;

    // Invalidate all sessions for user
    console.warn(`[AUTOMATED_RESPONSE] Invalidating all sessions for user ${userId} due to hijacking attempt`);

    // Send alert to user and security team
    this.sendSecurityAlert({
      type: 'SESSION_INVALIDATION',
      message: `All sessions invalidated for user ${userId} due to suspicious activity`,
      severity: SecuritySeverity.CRITICAL,
      event
    });
  }

  /**
   * Handle critical threat response
   */
  private handleCriticalThreatResponse(event: SecurityEvent): void {
    // Send immediate alert to security team
    this.sendSecurityAlert({
      type: 'CRITICAL_THREAT',
      message: `Critical security threat detected: ${event.description}`,
      severity: SecuritySeverity.CRITICAL,
      event
    });
  }

  /**
   * Send security alert
   */
  private sendSecurityAlert(alert: {
    type: string;
    message: string;
    severity: SecuritySeverity;
    event: SecurityEvent;
  }): void {
    console.error(`[SECURITY ALERT] ${alert.type}: ${alert.message}`, {
      eventId: alert.event.id,
      timestamp: new Date(alert.event.timestamp).toISOString(),
      metadata: alert.event.metadata
    });

    // In production, integrate with alerting systems:
    // - Send email/SMS to security team
    // - Create incident in ticketing system
    // - Send to SIEM system
    // - Trigger automated incident response
  }

  /**
   * Check for brute force attack patterns
   */
  private checkForBruteForceAttack(email: string, ipAddress: string): void {
    const now = Date.now();
    const timeWindow = SECURITY_THRESHOLDS.failedLoginTimeWindow;
    const maxAttempts = SECURITY_THRESHOLDS.failedLoginAttempts;

    const recentFailures = this.events.filter(event =>
      event.type === SecurityEventType.AUTHENTICATION_FAILURE &&
      event.metadata.email === email &&
      (now - event.timestamp) <= timeWindow
    );

    if (recentFailures.length >= maxAttempts) {
      this.logSecurityEvent(
        SecurityEventType.BRUTE_FORCE_ATTEMPT,
        SecuritySeverity.HIGH,
        `Brute force attack detected against ${email}`,
        { email, ipAddress, attemptCount: recentFailures.length, timeWindow }
      );
    }
  }

  /**
   * Update security metrics
   */
  private updateMetrics(newEvent?: SecurityEvent): void {
    if (newEvent) {
      this.metrics.totalEvents++;

      switch (newEvent.severity) {
        case SecuritySeverity.CRITICAL:
          this.metrics.criticalEvents++;
          break;
        case SecuritySeverity.HIGH:
          this.metrics.highSeverityEvents++;
          break;
        case SecuritySeverity.MEDIUM:
          this.metrics.mediumSeverityEvents++;
          break;
        case SecuritySeverity.LOW:
          this.metrics.lowSeverityEvents++;
          break;
      }

      if (!newEvent.resolved) {
        this.metrics.unresolvedEvents++;
      }
    }

    this.metrics.lastUpdated = Date.now();

    // Calculate average resolution time
    const resolvedEvents = this.events.filter(e => e.resolved && e.resolvedAt);
    if (resolvedEvents.length > 0) {
      const totalResolutionTime = resolvedEvents.reduce((sum, event) => {
        return sum + (event.resolvedAt! - event.timestamp);
      }, 0);
      this.metrics.averageResolutionTime = totalResolutionTime / resolvedEvents.length;
    }
  }

  /**
   * Initialize alert callbacks
   */
  private initializeAlertCallbacks(): void {
    // Initialize empty callback arrays for each severity
    Object.values(SecuritySeverity).forEach(severity => {
      this.alertCallbacks.set(severity, []);
    });
  }

  /**
   * Start background monitoring
   */
  private startMonitoring(): void {
    // Periodic cleanup of old events
    setInterval(() => {
      this.cleanupOldEvents();
    }, 60 * 60 * 1000); // Every hour

    // Periodic metrics update
    setInterval(() => {
      this.updateMetrics();
    }, 5 * 60 * 1000); // Every 5 minutes
  }

  /**
   * Clean up old events to prevent memory leaks
   */
  private cleanupOldEvents(): void {
    const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
    const initialCount = this.events.length;

    this.events = this.events.filter(event => event.timestamp > thirtyDaysAgo);

    const cleanedUp = initialCount - this.events.length;
    if (cleanedUp > 0) {
      console.log(`[SECURITY] Cleaned up ${cleanedUp} old security events`);
    }
  }
}

/**
 * Security monitoring helper functions
 */
export const securityMonitoring = {
  /**
   * Log authentication failure
   */
  authFailure: (email: string, ipAddress: string, userAgent: string, reason?: string) => {
    const monitor = SecurityMonitoringSystem.getInstance();
    monitor.reportAuthenticationFailure(email, ipAddress, userAgent, reason);
  },

  /**
   * Log XSS attempt
   */
  xssAttempt: (payload: string, source: string, userId?: string, ipAddress?: string) => {
    const monitor = SecurityMonitoringSystem.getInstance();
    monitor.reportXSSAttempt(payload, source, userId, ipAddress);
  },

  /**
   * Log SQL injection attempt
   */
  sqlInjectionAttempt: (query: string, source: string, userId?: string, ipAddress?: string) => {
    const monitor = SecurityMonitoringSystem.getInstance();
    monitor.reportSQLInjectionAttempt(query, source, userId, ipAddress);
  },

  /**
   * Log unauthorized access
   */
  unauthorizedAccess: (resource: string, userId?: string, ipAddress?: string, userAgent?: string) => {
    const monitor = SecurityMonitoringSystem.getInstance();
    monitor.reportUnauthorizedAccess(resource, userId, ipAddress, userAgent);
  },

  /**
   * Log suspicious activity
   */
  suspiciousActivity: (type: SecurityEventType, description: string, userId?: string, metadata?: any) => {
    const monitor = SecurityMonitoringSystem.getInstance();
    monitor.reportSuspiciousActivity(type, description, userId, undefined, metadata);
  },

  /**
   * Get security dashboard data
   */
  getDashboardData: () => {
    const monitor = SecurityMonitoringSystem.getInstance();
    const metrics = monitor.getSecurityMetrics();
    const unresolvedEvents = monitor.getUnresolvedEvents();
    const criticalEvents = monitor.getUnresolvedEvents(SecuritySeverity.CRITICAL);

    return {
      metrics,
      unresolvedEvents,
      criticalEvents,
      activeThreats: criticalEvents.length,
      recentActivity: monitor.getEventsByTimeRange(
        Date.now() - 24 * 60 * 60 * 1000, // Last 24 hours
        Date.now()
      )
    };
  },

  /**
   * Setup security alerts
   */
  setupAlerts: (callbacks: {
    critical?: (event: SecurityEvent) => void;
    high?: (event: SecurityEvent) => void;
    medium?: (event: SecurityEvent) => void;
    low?: (event: SecurityEvent) => void;
  }) => {
    const monitor = SecurityMonitoringSystem.getInstance();

    if (callbacks.critical) {
      monitor.addAlertCallback(SecuritySeverity.CRITICAL, callbacks.critical);
    }
    if (callbacks.high) {
      monitor.addAlertCallback(SecuritySeverity.HIGH, callbacks.high);
    }
    if (callbacks.medium) {
      monitor.addAlertCallback(SecuritySeverity.MEDIUM, callbacks.medium);
    }
    if (callbacks.low) {
      monitor.addAlertCallback(SecuritySeverity.LOW, callbacks.low);
    }
  }
};

// Export singleton instance
export const securityMonitor = SecurityMonitoringSystem.getInstance();