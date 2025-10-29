/**
 * Security Monitoring System
 *
 * Comprehensive security monitoring for production environments including
 * real-time threat detection, performance monitoring, and security analytics.
 */

interface SecurityMetrics {
  // Authentication metrics
  authAttempts: number;
  authFailures: number;
  suspiciousIPs: string[];
  bruteForceAttempts: number;

  // Request metrics
  totalRequests: number;
  blockedRequests: number;
  rateLimitHits: number;
  suspiciousRequests: number;

  // Application metrics
  errors: number;
  securityViolations: number;
  dataAccessAttempts: number;
  configurationChanges: number;

  // Performance metrics
  responseTime: number;
  memoryUsage: number;
  cpuUsage: number;
  activeUsers: number;
}

interface SecurityAlert {
  id: string;
  timestamp: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  type: string;
  message: string;
  source: string;
  details?: Record<string, any>;
  resolved: boolean;
  resolvedAt?: string;
}

interface ThreatIntelligence {
  maliciousIPs: string[];
  suspiciousPatterns: string[];
  attackSignatures: string[];
  knownVulnerabilities: string[];
}

class SecurityMonitoring {
  private metrics: SecurityMetrics;
  private alerts: SecurityAlert[];
  private threatIntel: ThreatIntelligence;
  private monitoringInterval: NodeJS.Timeout | null = null;
  private readonly METRICS_RETENTION_HOURS = 24;
  private readonly ALERT_RETENTION_DAYS = 30;

  constructor() {
    this.metrics = this.initializeMetrics();
    this.alerts = [];
    this.threatIntel = this.initializeThreatIntelligence();
    this.loadStoredData();
    this.startMonitoring();
  }

  /**
   * Initialize security metrics
   */
  private initializeMetrics(): SecurityMetrics {
    return {
      authAttempts: 0,
      authFailures: 0,
      suspiciousIPs: [],
      bruteForceAttempts: 0,
      totalRequests: 0,
      blockedRequests: 0,
      rateLimitHits: 0,
      suspiciousRequests: 0,
      errors: 0,
      securityViolations: 0,
      dataAccessAttempts: 0,
      configurationChanges: 0,
      responseTime: 0,
      memoryUsage: 0,
      cpuUsage: 0,
      activeUsers: 0,
    };
  }

  /**
   * Initialize threat intelligence data
   */
  private initializeThreatIntelligence(): ThreatIntelligence {
    return {
      maliciousIPs: [],
      suspiciousPatterns: [
        /\.\./,           // Directory traversal
        /<script/i,       // XSS attempts
        /union.*select/i, // SQL injection
        /eval\(/i,        // Code injection
        /document\.cookie/i, // Cookie theft attempts
      ],
      attackSignatures: [
        'sqlmap',
        'nikto',
        'nmap',
        'dirb',
        'gobuster',
      ],
      knownVulnerabilities: [],
    };
  }

  /**
   * Start security monitoring
   */
  public startMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
    }

    this.monitoringInterval = setInterval(() => {
      this.performSecurityChecks();
      this.updateMetrics();
      this.checkThresholds();
      this.cleanupOldData();
    }, 60000); // Check every minute

    console.log('Security monitoring started');
  }

  /**
   * Stop security monitoring
   */
  public stopMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
    console.log('Security monitoring stopped');
  }

  /**
   * Record authentication attempt
   */
  public recordAuthAttempt(success: boolean, ip?: string, userAgent?: string): void {
    this.metrics.authAttempts++;

    if (!success) {
      this.metrics.authFailures++;
      this.detectBruteForce(ip, userAgent);
    }

    if (ip && this.isSuspiciousIP(ip)) {
      this.createAlert('high', 'suspicious_auth',
        `Authentication attempt from suspicious IP: ${ip}`,
        'authentication', { ip, userAgent, success }
      );
    }
  }

  /**
   * Record API request
   */
  public recordRequest(url: string, method: string, ip?: string, userAgent?: string, statusCode?: number): void {
    this.metrics.totalRequests++;

    // Check for suspicious requests
    if (this.isSuspiciousRequest(url, method, userAgent)) {
      this.metrics.suspiciousRequests++;
      this.createAlert('medium', 'suspicious_request',
        `Suspicious request detected: ${method} ${url}`,
        'request', { url, method, ip, userAgent, statusCode }
      );
    }

    // Check for attack signatures in user agent
    if (userAgent && this.containsAttackSignature(userAgent)) {
      this.metrics.blockedRequests++;
      this.createAlert('high', 'attack_signature',
        `Attack signature detected in user agent`,
        'request', { url, method, ip, userAgent }
      );
    }

    // Update suspicious IPs list
    if (ip && this.shouldTrackIP(ip)) {
      if (!this.metrics.suspiciousIPs.includes(ip)) {
        this.metrics.suspiciousIPs.push(ip);
      }
    }
  }

  /**
   * Record security violation
   */
  public recordSecurityViolation(violationType: string, details?: Record<string, any>): void {
    this.metrics.securityViolations++;

    const severity = this.getViolationSeverity(violationType);
    this.createAlert(severity, 'security_violation',
      `Security violation: ${violationType}`,
      'application', details
    );
  }

  /**
   * Record configuration change
   */
  public recordConfigurationChange(changeType: string, oldValue?: string, newValue?: string): void {
    this.metrics.configurationChanges++;

    this.createAlert('low', 'config_change',
      `Configuration changed: ${changeType}`,
      'configuration', { oldValue: 'REDACTED', newValue: 'REDACTED' }
    );
  }

  /**
   * Record data access
   */
  public recordDataAccess(resource: string, userId?: string, ip?: string): void {
    this.metrics.dataAccessAttempts++;

    // Check for unusual data access patterns
    if (this.isUnusualDataAccess(resource, userId)) {
      this.createAlert('medium', 'unusual_data_access',
        `Unusual data access detected: ${resource}`,
        'data', { resource, userId, ip }
      );
    }
  }

  /**
   * Get current security metrics
   */
  public getSecurityMetrics(): SecurityMetrics {
    return { ...this.metrics };
  }

  /**
   * Get recent security alerts
   */
  public getSecurityAlerts(limit: number = 50): SecurityAlert[] {
    return this.alerts
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, limit);
  }

  /**
   * Get unresolved security alerts
   */
  public getUnresolvedAlerts(): SecurityAlert[] {
    return this.alerts.filter(alert => !alert.resolved);
  }

  /**
   * Resolve security alert
   */
  public resolveAlert(alertId: string): void {
    const alert = this.alerts.find(a => a.id === alertId);
    if (alert) {
      alert.resolved = true;
      alert.resolvedAt = new Date().toISOString();
      this.persistData();
    }
  }

  /**
   * Get security score (0-100)
   */
  public getSecurityScore(): number {
    let score = 100;

    // Deduct points for various issues
    score -= Math.min(this.metrics.authFailures * 0.1, 10);
    score -= Math.min(this.metrics.suspiciousRequests * 0.5, 15);
    score -= Math.min(this.metrics.securityViolations * 2, 20);
    score -= Math.min(this.getUnresolvedAlerts().length * 3, 15);

    return Math.max(0, Math.round(score));
  }

  /**
   * Get security recommendations
   */
  public getSecurityRecommendations(): string[] {
    const recommendations: string[] = [];

    if (this.metrics.authFailures > this.metrics.authAttempts * 0.1) {
      recommendations.push('High authentication failure rate detected - consider implementing rate limiting');
    }

    if (this.metrics.suspiciousRequests > 10) {
      recommendations.push('Multiple suspicious requests detected - review firewall rules');
    }

    if (this.metrics.securityViolations > 0) {
      recommendations.push('Security violations detected - review application security measures');
    }

    if (this.getUnresolvedAlerts().length > 5) {
      recommendations.push('Multiple unresolved security alerts - require immediate attention');
    }

    if (this.metrics.responseTime > 5000) {
      recommendations.push('High response time detected - may impact security monitoring effectiveness');
    }

    return recommendations;
  }

  /**
   * Export security data for compliance
   */
  public exportSecurityData(startDate?: Date, endDate?: Date): string {
    const data = {
      metrics: this.metrics,
      alerts: this.filterAlertsByDate(startDate, endDate),
      threatIntelligence: this.threatIntel,
      exportTime: new Date().toISOString(),
      score: this.getSecurityScore(),
    };

    return JSON.stringify(data, null, 2);
  }

  /**
   * Perform comprehensive security checks
   */
  private performSecurityChecks(): void {
    // Check for new threats
    this.updateThreatIntelligence();

    // Check application health
    this.checkApplicationHealth();

    // Validate security configurations
    this.validateSecurityConfigurations();
  }

  /**
   * Update security metrics
   */
  private updateMetrics(): void {
    // Update performance metrics
    if (performance && performance.memory) {
      this.metrics.memoryUsage = performance.memory.usedJSHeapSize;
    }

    // Calculate average response time (mock implementation)
    this.metrics.responseTime = Math.random() * 1000 + 200;

    // Update active users count (mock implementation)
    this.metrics.activeUsers = Math.floor(Math.random() * 100) + 10;
  }

  /**
   * Check security thresholds and create alerts
   */
  private checkThresholds(): void {
    // Check authentication failure rate
    if (this.metrics.authAttempts > 0) {
      const failureRate = this.metrics.authFailures / this.metrics.authAttempts;
      if (failureRate > 0.2) {
        this.createAlert('high', 'high_failure_rate',
          `High authentication failure rate: ${Math.round(failureRate * 100)}%`,
          'authentication', { failureRate, attempts: this.metrics.authAttempts }
        );
      }
    }

    // Check suspicious request volume
    if (this.metrics.suspiciousRequests > 50) {
      this.createAlert('critical', 'high_suspicious_activity',
        `High volume of suspicious requests: ${this.metrics.suspiciousRequests}`,
        'request', { suspiciousRequests: this.metrics.suspiciousRequests }
      );
    }

    // Check security violations
    if (this.metrics.securityViolations > 10) {
      this.createAlert('high', 'multiple_violations',
        `Multiple security violations detected: ${this.metrics.securityViolations}`,
        'application', { violations: this.metrics.securityViolations }
      );
    }
  }

  /**
   * Detect brute force attacks
   */
  private detectBruteForce(ip?: string, userAgent?: string): void {
    if (!ip) return;

    // Simple brute force detection (in production, use more sophisticated algorithms)
    const recentFailures = this.getRecentAuthFailures(ip);
    if (recentFailures >= 5) {
      this.metrics.bruteForceAttempts++;
      this.createAlert('critical', 'brute_force_attack',
        `Brute force attack detected from IP: ${ip}`,
        'authentication', { ip, userAgent, failures: recentFailures }
      );
    }
  }

  /**
   * Check if IP is suspicious
   */
  private isSuspiciousIP(ip: string): boolean {
    return this.threatIntel.maliciousIPs.includes(ip) ||
           this.metrics.suspiciousIPs.filter(suspiciousIP => suspiciousIP === ip).length > 10;
  }

  /**
   * Check if request is suspicious
   */
  private isSuspiciousRequest(url: string, method: string, userAgent?: string): boolean {
    const fullRequest = `${method} ${url} ${userAgent || ''}`.toLowerCase();

    return this.threatIntel.suspiciousPatterns.some(pattern =>
      pattern.test(fullRequest)
    );
  }

  /**
   * Check for attack signatures
   */
  private containsAttackSignature(userAgent: string): boolean {
    return this.threatIntel.attackSignatures.some(signature =>
      userAgent.toLowerCase().includes(signature.toLowerCase())
    );
  }

  /**
   * Check if IP should be tracked
   */
  private shouldTrackIP(ip: string): boolean {
    // Don't track private IPs
    const privateIPs = [/^10\./, /^172\.(1[6-9]|2[0-9]|3[0-1])\./, /^192\.168\./, /^127\./];
    return !privateIPs.some(pattern => pattern.test(ip));
  }

  /**
   * Check for unusual data access patterns
   */
  private isUnusualDataAccess(resource: string, userId?: string): boolean {
    // Simple implementation - in production, use machine learning
    const sensitiveResources = ['admin', 'config', 'secrets', 'keys'];
    return sensitiveResources.some(sensitive => resource.toLowerCase().includes(sensitive));
  }

  /**
   * Get violation severity
   */
  private getViolationSeverity(violationType: string): 'low' | 'medium' | 'high' | 'critical' {
    const criticalViolations = ['data_breach', 'privilege_escalation', 'system_compromise'];
    const highViolations = ['unauthorized_access', 'injection_attack', 'xss_attack'];
    const mediumViolations = ['config_tamper', 'rate_limit_exceeded'];

    if (criticalViolations.includes(violationType)) return 'critical';
    if (highViolations.includes(violationType)) return 'high';
    if (mediumViolations.includes(violationType)) return 'medium';
    return 'low';
  }

  /**
   * Create security alert
   */
  private createAlert(
    severity: 'low' | 'medium' | 'high' | 'critical',
    type: string,
    message: string,
    source: string,
    details?: Record<string, any>
  ): void {
    const alert: SecurityAlert = {
      id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      severity,
      type,
      message,
      source,
      details,
      resolved: false,
    };

    this.alerts.push(alert);

    // Immediate notification for critical alerts
    if (severity === 'critical') {
      this.triggerImmediateAlert(alert);
    }

    this.persistData();
  }

  /**
   * Trigger immediate alert notification
   */
  private triggerImmediateAlert(alert: SecurityAlert): void {
    console.error('CRITICAL SECURITY ALERT:', alert);

    // In production, integrate with alerting systems:
    // - Send email notifications
    // - Send Slack/Teams messages
    // - Create PagerDuty incidents
    // - Send SMS alerts
  }

  /**
   * Get recent authentication failures for IP
   */
  private getRecentAuthFailures(ip: string): number {
    // Simple implementation - in production, use proper time-windowed counting
    return Math.floor(Math.random() * 10);
  }

  /**
   * Update threat intelligence
   */
  private updateThreatIntelligence(): void {
    // In production, integrate with threat intelligence feeds
    // This is a placeholder implementation
  }

  /**
   * Check application health
   */
  private checkApplicationHealth(): void {
    // Monitor application health indicators
    if (this.metrics.errors > 100) {
      this.createAlert('medium', 'high_error_rate',
        'High application error rate detected',
        'application', { errors: this.metrics.errors }
      );
    }
  }

  /**
   * Validate security configurations
   */
  private validateSecurityConfigurations(): void {
    // Check if security headers are properly configured
    if (typeof window !== 'undefined') {
      const csp = document.querySelector('meta[http-equiv="Content-Security-Policy"]');
      if (!csp) {
        this.createAlert('low', 'missing_csp',
          'Content Security Policy header not found',
          'configuration'
        );
      }
    }
  }

  /**
   * Filter alerts by date range
   */
  private filterAlertsByDate(startDate?: Date, endDate?: Date): SecurityAlert[] {
    return this.alerts.filter(alert => {
      const alertDate = new Date(alert.timestamp);
      if (startDate && alertDate < startDate) return false;
      if (endDate && alertDate > endDate) return false;
      return true;
    });
  }

  /**
   * Clean up old data
   */
  private cleanupOldData(): void {
    const now = new Date();

    // Clean up old metrics (reset every hour)
    this.metrics = this.initializeMetrics();

    // Clean up old alerts
    const cutoffDate = new Date(now.getTime() - this.ALERT_RETENTION_DAYS * 24 * 60 * 60 * 1000);
    this.alerts = this.alerts.filter(alert => new Date(alert.timestamp) >= cutoffDate);

    this.persistData();
  }

  /**
   * Persist monitoring data
   */
  private persistData(): void {
    try {
      const data = {
        metrics: this.metrics,
        alerts: this.alerts.slice(-100), // Keep only recent alerts
        lastUpdated: new Date().toISOString(),
      };

      localStorage.setItem('security_monitoring_data', JSON.stringify(data));
    } catch (error) {
      console.warn('Failed to persist security monitoring data:', error);
    }
  }

  /**
   * Load stored monitoring data
   */
  private loadStoredData(): void {
    try {
      const stored = localStorage.getItem('security_monitoring_data');
      if (stored) {
        const data = JSON.parse(stored);
        this.metrics = { ...this.metrics, ...data.metrics };
        this.alerts = data.alerts || [];
      }
    } catch (error) {
      console.warn('Failed to load security monitoring data:', error);
    }
  }
}

// Create singleton instance
const securityMonitoring = new SecurityMonitoring();

// Export functions for use in application
export const recordAuthAttempt = (success: boolean, ip?: string, userAgent?: string) =>
  securityMonitoring.recordAuthAttempt(success, ip, userAgent);

export const recordRequest = (url: string, method: string, ip?: string, userAgent?: string, statusCode?: number) =>
  securityMonitoring.recordRequest(url, method, ip, userAgent, statusCode);

export const recordSecurityViolation = (violationType: string, details?: Record<string, any>) =>
  securityMonitoring.recordSecurityViolation(violationType, details);

export const recordConfigurationChange = (changeType: string, oldValue?: string, newValue?: string) =>
  securityMonitoring.recordConfigurationChange(changeType, oldValue, newValue);

export const recordDataAccess = (resource: string, userId?: string, ip?: string) =>
  securityMonitoring.recordDataAccess(resource, userId, ip);

export const getSecurityMetrics = () => securityMonitoring.getSecurityMetrics();
export const getSecurityAlerts = (limit?: number) => securityMonitoring.getSecurityAlerts(limit);
export const getUnresolvedSecurityAlerts = () => securityMonitoring.getUnresolvedAlerts();
export const resolveSecurityAlert = (alertId: string) => securityMonitoring.resolveAlert(alertId);
export const getSecurityScore = () => securityMonitoring.getSecurityScore();
export const getSecurityRecommendations = () => securityMonitoring.getSecurityRecommendations();
export const exportSecurityData = (startDate?: Date, endDate?: Date) =>
  securityMonitoring.exportSecurityData(startDate, endDate);

export default securityMonitoring;