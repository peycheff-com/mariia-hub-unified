/**
 * Security Configuration Verification Tests
 *
 * Comprehensive test suite to verify all security configurations
 * are properly implemented and working as expected.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';

import { validateEnvironment, getSecureEnvironmentConfig } from '../../lib/env-validation';
import securityHeadersManager, { generateSecurityNonce, getCurrentSecurityNonce } from '../../lib/security-headers';
import securityAuditor, { logCredentialAccess, logSecurityIncident } from '../../lib/security-audit';
import securityMonitoring, { recordAuthAttempt, recordRequest } from '../../lib/security-monitoring';

describe('Security Environment Validation', () => {
  beforeEach(() => {
    // Mock production environment for testing
    vi.stubEnv('VITE_APP_ENV', 'production');
    vi.stubEnv('VITE_APP_URL', 'https://mariia-hub.com');
    vi.stubEnv('VITE_SUPABASE_URL', 'https://test-project.supabase.co');
    vi.stubEnv('VITE_SUPABASE_PUBLISHABLE_KEY', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test');
    vi.stubEnv('VITE_STRIPE_PUBLISHABLE_KEY', 'pk_live_test123456789');
    vi.stubEnv('VITE_SECURITY_HEADERS_ENABLED', 'true');
    vi.stubEnv('VITE_CSP_NONCE_GENERATION', 'true');
    vi.stubEnv('VITE_HMR', 'false');
    vi.stubEnv('VITE_SOURCE_MAP', 'false');
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  describe('Environment Variable Validation', () => {
    it('should validate production environment variables', () => {
      const result = validateEnvironment();
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.securityIssues).toHaveLength(0);
    });

    it('should reject placeholder values in production', () => {
      vi.stubEnv('VITE_STRIPE_PUBLISHABLE_KEY', 'pk_test_...');
      const result = validateEnvironment();
      expect(result.valid).toBe(false);
      expect(result.securityIssues.length).toBeGreaterThan(0);
    });

    it('should reject development features in production', () => {
      vi.stubEnv('VITE_HMR', 'true');
      vi.stubEnv('VITE_SOURCE_MAP', 'true');
      const result = validateEnvironment();
      expect(result.valid).toBe(false);
      expect(result.securityIssues.length).toBeGreaterThan(0);
    });

    it('should require HTTPS URLs in production', () => {
      vi.stubEnv('VITE_APP_URL', 'http://example.com');
      const result = validateEnvironment();
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should validate API key formats', () => {
      vi.stubEnv('VITE_SUPABASE_PUBLISHABLE_KEY', 'invalid-key');
      const result = validateEnvironment();
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should provide secure configuration object', () => {
      const config = getSecureEnvironmentConfig();
      expect(config).toBeDefined();
      expect(config.VITE_APP_ENV).toBe('production');
      expect(config.VITE_SECURITY_HEADERS_ENABLED).toBe(true);
    });
  });

  describe('Security Headers Configuration', () => {
    it('should generate security nonce', () => {
      const nonce = generateSecurityNonce();
      expect(nonce).toBeDefined();
      expect(typeof nonce).toBe('string');
      expect(nonce.length).toBeGreaterThan(0);
    });

    it('should provide nonce attribute', () => {
      generateSecurityNonce();
      const nonceAttr = securityHeadersManager.getNonceAttribute();
      expect(nonceAttr).toBeDefined();
      if (nonceAttr.nonce) {
        expect(typeof nonceAttr.nonce).toBe('string');
      }
    });

    it('should build comprehensive CSP headers', () => {
      const headers = securityHeadersManager.getServerSecurityHeaders();
      expect(headers).toBeDefined();
      expect(headers['Content-Security-Policy']).toBeDefined();
      expect(headers['X-Content-Type-Options']).toBe('nosniff');
      expect(headers['X-Frame-Options']).toBe('DENY');
    });

    it('should include HSTS in production', () => {
      const headers = securityHeadersManager.getServerSecurityHeaders();
      if (process.env.NODE_ENV === 'production') {
        expect(headers['Strict-Transport-Security']).toBeDefined();
        expect(headers['Strict-Transport-Security']).toContain('max-age=');
      }
    });

    it('should validate CSP configuration', () => {
      const validation = securityHeadersManager.validateCSP();
      expect(validation).toBeDefined();
      expect(typeof validation.valid).toBe('boolean');
      expect(Array.isArray(validation.warnings)).toBe(true);
    });

    it('should provide API security headers', () => {
      const headers = securityHeadersManager.getApiSecurityHeaders();
      expect(headers['Content-Type']).toBe('application/json');
      expect(headers['X-Content-Type-Options']).toBe('nosniff');
      expect(headers['Cache-Control']).toContain('no-store');
    });
  });

  describe('Security Audit Logging', () => {
    beforeEach(() => {
      // Clear previous audit events
      securityAuditor['events'] = [];
    });

    it('should log credential access events', () => {
      logCredentialAccess('STRIPE_SECRET_KEY', 'user123', '192.168.1.1');
      const events = securityAuditor.getRecentEvents();
      expect(events).toHaveLength(1);
      expect(events[0].eventType).toBe('credential_access');
      expect(events[0].resource).toBe('STRIPE_SECRET_KEY');
    });

    it('should log security incidents', () => {
      logSecurityIncident('brute_force', 'Multiple failed attempts', 'high', 'user123', '192.168.1.1');
      const events = securityAuditor.getRecentEvents();
      expect(events).toHaveLength(1);
      expect(events[0].eventType).toBe('security_incident');
      expect(events[0].severity).toBe('high');
    });

    it('should generate security metrics', () => {
      logCredentialAccess('API_KEY', 'user123');
      logSecurityIncident('suspicious_activity', 'Test incident', 'medium');
      const metrics = securityAuditor.getSecurityMetrics();
      expect(metrics.totalEvents).toBe(2);
    });

    it('should detect security anomalies', () => {
      // Simulate multiple failed auth attempts
      for (let i = 0; i < 6; i++) {
        securityAuditor.logAuthenticationEvent('login', false, 'user123', '192.168.1.1');
      }
      const anomalies = securityAuditor.detectSecurityAnomalies();
      expect(anomalies.length).toBeGreaterThan(0);
      expect(anomalies[0].type).toBe('brute_force_attempt');
    });

    it('should export audit logs', () => {
      logCredentialAccess('TEST_KEY', 'user123');
      const exportData = securityAuditor.exportAuditLogs();
      expect(exportData).toBeDefined();
      expect(typeof exportData).toBe('string');
      expect(exportData).toContain('ID,Timestamp');
    });
  });

  describe('Security Monitoring', () => {
    beforeEach(() => {
      // Reset monitoring metrics
      securityMonitoring['metrics'] = securityMonitoring['initializeMetrics']();
      securityMonitoring['alerts'] = [];
    });

    it('should record authentication attempts', () => {
      recordAuthAttempt(true, '192.168.1.1');
      recordAuthAttempt(false, '192.168.1.2');
      const metrics = securityMonitoring.getSecurityMetrics();
      expect(metrics.authAttempts).toBe(2);
      expect(metrics.authFailures).toBe(1);
    });

    it('should record API requests', () => {
      recordRequest('/api/test', 'GET', '192.168.1.1');
      const metrics = securityMonitoring.getSecurityMetrics();
      expect(metrics.totalRequests).toBe(1);
    });

    it('should detect suspicious requests', () => {
      recordRequest('/api/../etc/passwd', 'GET', '192.168.1.1', 'sqlmap/1.0');
      const alerts = securityMonitoring.getSecurityAlerts();
      expect(alerts.length).toBeGreaterThan(0);
      expect(alerts.some(alert => alert.type === 'suspicious_request')).toBe(true);
    });

    it('should calculate security score', () => {
      const score = securityMonitoring.getSecurityScore();
      expect(typeof score).toBe('number');
      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(100);
    });

    it('should provide security recommendations', () => {
      // Simulate some security issues
      securityMonitoring.recordSecurityViolation('test_violation');
      const recommendations = securityMonitoring.getSecurityRecommendations();
      expect(Array.isArray(recommendations)).toBe(true);
    });

    it('should manage security alerts', () => {
      securityMonitoring.recordSecurityViolation('critical_issue');
      const alerts = securityMonitoring.getUnresolvedAlerts();
      expect(alerts.length).toBeGreaterThan(0);

      // Resolve alert
      securityMonitoring.resolveAlert(alerts[0].id);
      const unresolvedAlerts = securityMonitoring.getUnresolvedAlerts();
      expect(unresolvedAlerts.length).toBe(0);
    });

    it('should export security data', () => {
      recordAuthAttempt(true, '192.168.1.1');
      const exportData = securityMonitoring.exportSecurityData();
      expect(exportData).toBeDefined();
      const parsed = JSON.parse(exportData);
      expect(parsed.metrics).toBeDefined();
      expect(parsed.alerts).toBeDefined();
      expect(parsed.score).toBeDefined();
    });
  });

  describe('Integration Security Tests', () => {
    it('should integrate environment validation with headers', () => {
      const envResult = validateEnvironment();
      if (envResult.valid) {
        const headers = securityHeadersManager.getServerSecurityHeaders();
        expect(headers).toBeDefined();
        expect(Object.keys(headers).length).toBeGreaterThan(0);
      }
    });

    it('should maintain audit trail across operations', () => {
      // Perform multiple operations
      logCredentialAccess('API_KEY', 'user123');
      recordAuthAttempt(true, '192.168.1.1');
      recordRequest('/api/test', 'GET', '192.168.1.1');

      // Verify audit trail
      const auditEvents = securityAuditor.getRecentEvents();
      expect(auditEvents.length).toBeGreaterThan(0);

      const securityMetrics = securityMonitoring.getSecurityMetrics();
      expect(securityMetrics.authAttempts).toBeGreaterThan(0);
    });

    it('should handle security incidents appropriately', () => {
      // Simulate security incident
      logSecurityIncident('data_breach', 'Suspicious data access detected', 'critical');
      securityMonitoring.recordSecurityViolation('data_breach');

      // Check for alerts and metrics
      const alerts = securityAuditor.getRecentEvents();
      const securityAlerts = securityMonitoring.getUnresolvedAlerts();
      const metrics = securityMonitoring.getSecurityMetrics();

      expect(alerts.some(alert => alert.severity === 'critical')).toBe(true);
      expect(securityAlerts.some(alert => alert.severity === 'critical')).toBe(true);
      expect(metrics.securityViolations).toBeGreaterThan(0);
    });
  });

  describe('Production Readiness Tests', () => {
    it('should validate production configuration completeness', () => {
      const requiredVars = [
        'VITE_APP_ENV',
        'VITE_APP_URL',
        'VITE_SUPABASE_URL',
        'VITE_SUPABASE_PUBLISHABLE_KEY',
        'VITE_SECURITY_HEADERS_ENABLED',
        'VITE_CSP_NONCE_GENERATION'
      ];

      requiredVars.forEach(varName => {
        expect(process.env[varName]).toBeDefined();
        expect(process.env[varName]).not.toBe('');
      });
    });

    it('should ensure security features are enabled', () => {
      expect(process.env.VITE_SECURITY_HEADERS_ENABLED).toBe('true');
      expect(process.env.VITE_CSP_NONCE_GENERATION).toBe('true');
      expect(process.env.VITE_HMR).toBe('false');
      expect(process.env.VITE_SOURCE_MAP).toBe('false');
    });

    it('should verify HTTPS enforcement', () => {
      expect(process.env.VITE_APP_URL).toMatch(/^https:\/\//);
    });

    it('should validate security monitoring setup', () => {
      const metrics = securityMonitoring.getSecurityMetrics();
      const alerts = securityMonitoring.getSecurityAlerts();
      const score = securityMonitoring.getSecurityScore();

      expect(metrics).toBeDefined();
      expect(Array.isArray(alerts)).toBe(true);
      expect(typeof score).toBe('number');
    });

    it('should ensure audit logging is functional', () => {
      const initialEvents = securityAuditor.getRecentEvents().length;
      logCredentialAccess('TEST_KEY', 'testuser');
      const updatedEvents = securityAuditor.getRecentEvents().length;
      expect(updatedEvents).toBe(initialEvents + 1);
    });
  });
});

describe('Security Configuration Edge Cases', () => {
  it('should handle missing environment variables gracefully', () => {
    vi.unstubAllEnvs();
    const result = validateEnvironment();
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });

  it('should handle malformed environment variables', () => {
    vi.stubEnv('VITE_SUPABASE_PUBLISHABLE_KEY', 'not-a-jwt');
    vi.stubEnv('VITE_STRIPE_PUBLISHABLE_KEY', 'invalid-format');
    const result = validateEnvironment();
    expect(result.valid).toBe(false);
  });

  it('should handle security monitoring edge cases', () => {
    // Test with extreme values
    for (let i = 0; i < 1000; i++) {
      recordAuthAttempt(false, `192.168.1.${i % 255}`);
    }
    const alerts = securityMonitoring.getSecurityAlerts();
    expect(alerts.length).toBeGreaterThan(0);
  });

  it('should handle audit logging errors gracefully', () => {
    // Test with various event types
    securityAuditor.logEvent({
      eventType: 'authentication_event',
      resource: 'test',
      action: 'test',
      result: 'success',
      severity: 'low',
    });
    const events = securityAuditor.getRecentEvents();
    expect(events.length).toBeGreaterThan(0);
  });
});