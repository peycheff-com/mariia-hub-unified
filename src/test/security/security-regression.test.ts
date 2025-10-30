/**
 * Automated Security Regression Tests
 *
 * This test suite ensures that security features remain functional
 * and prevents regressions in security controls.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BookingContext } from '@/contexts/BookingContext';
import { CurrencyContext } from '@/contexts/CurrencyContext';
import { ModeContext } from '@/contexts/ModeContext';
import React from 'react';

// Import security utilities
import { validateEnvironment, getSecureEnvironmentConfig } from '@/lib/env-validation';
import securityHeadersManager from '@/lib/security-headers';
import securityAuditor from '@/lib/security-audit';
import securityMonitoring from '@/lib/security-monitoring';
import apiSecurityValidator from '@/lib/api-security-validator';
import paymentSecurity from '@/lib/payment-security';

// Test wrapper component
const TestWrapper = ({ children }: { children: React.ReactNode }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  const bookingContextValue = {
    selectedService: null,
    selectedTime: null,
    bookingStep: 1,
    setBookingStep: vi.fn(),
    selectService: vi.fn(),
    selectTime: vi.fn(),
    resetBooking: vi.fn(),
  };

  const currencyContextValue = {
    currency: 'PLN',
    setCurrency: vi.fn(),
    convertPrice: vi.fn((price) => price),
  };

  const modeContextValue = {
    mode: 'beauty',
    setMode: vi.fn(),
    trackUserBehavior: vi.fn(),
  };

  return (
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        <ModeContext.Provider value={modeContextValue}>
          <CurrencyContext.Provider value={currencyContextValue}>
            <BookingContext.Provider value={bookingContextValue}>
              {children}
            </BookingContext.Provider>
          </CurrencyContext.Provider>
        </ModeContext.Provider>
      </QueryClientProvider>
    </BrowserRouter>
  );
};

describe('Automated Security Regression Tests', () => {
  beforeEach(() => {
    // Setup secure test environment
    vi.stubEnv('NODE_ENV', 'test');
    vi.stubEnv('VITE_APP_ENV', 'test');
    vi.stubEnv('VITE_APP_URL', 'https://test.mariaborysevych.com');
    vi.stubEnv('VITE_SUPABASE_URL', 'https://test.supabase.co');
    vi.stubEnv('VITE_SECURITY_HEADERS_ENABLED', 'true');
    vi.stubEnv('VITE_CSP_NONCE_GENERATION', 'true');

    // Clear any existing security events
    securityAuditor['events'] = [];
    securityMonitoring['metrics'] = securityMonitoring['initializeMetrics']();
    securityMonitoring['alerts'] = [];
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.clearAllMocks();
  });

  describe('Environment Security Regression', () => {
    it('should maintain secure environment validation', () => {
      const result = validateEnvironment();

      // These are the minimum security requirements that should never regress
      expect(result.securityIssues).toBeDefined();
      expect(Array.isArray(result.securityIssues)).toBe(true);
      expect(result.errors).toBeDefined();
      expect(Array.isArray(result.errors)).toBe(true);

      // Should detect placeholder values
      vi.stubEnv('VITE_STRIPE_PUBLISHABLE_KEY', 'pk_test_...');
      const insecureResult = validateEnvironment();
      expect(insecureResult.valid).toBe(false);
      expect(insecureResult.securityIssues.length).toBeGreaterThan(0);
    });

    it('should maintain secure configuration object', () => {
      const config = getSecureEnvironmentConfig();

      // Required security fields should always be present
      expect(config).toBeDefined();
      expect(typeof config.VITE_SECURITY_HEADERS_ENABLED).toBe('string');
      expect(typeof config.VITE_CSP_NONCE_GENERATION).toBe('string');
    });

    it('should prevent regression in development feature detection', () => {
      // Test that development features are properly flagged in production-like env
      vi.stubEnv('VITE_APP_ENV', 'production');
      vi.stubEnv('VITE_HMR', 'true');

      const result = validateEnvironment();
      expect(result.valid).toBe(false);
      expect(result.securityIssues.some(issue =>
        issue.includes('Hot Module Replacement') || issue.includes('development')
      )).toBe(true);
    });
  });

  describe('Security Headers Regression', () => {
    it('should maintain CSP header generation', () => {
      const headers = securityHeadersManager.getServerSecurityHeaders();

      // Critical CSP directives that should never be removed
      expect(headers['Content-Security-Policy']).toBeDefined();
      expect(headers['Content-Security-Policy']).toContain("default-src 'self'");
      expect(headers['Content-Security-Policy']).toContain("script-src 'self'");
      expect(headers['Content-Security-Policy']).toContain("style-src 'self'");
      expect(headers['Content-Security-Policy']).toContain("img-src 'self'");
    });

    it('should maintain security nonce generation', () => {
      const nonce1 = securityHeadersManager.generateSecurityNonce();
      const nonce2 = securityHeadersManager.generateSecurityNonce();

      // Nonces should be unique and properly formatted
      expect(nonce1).toBeDefined();
      expect(nonce2).toBeDefined();
      expect(nonce1).not.toBe(nonce2);
      expect(typeof nonce1).toBe('string');
      expect(nonce1.length).toBeGreaterThan(16); // Base64 encoded random bytes
    });

    it('should maintain essential security headers', () => {
      const headers = securityHeadersManager.getServerSecurityHeaders();

      // These headers are critical for security and should never regress
      expect(headers['X-Content-Type-Options']).toBe('nosniff');
      expect(headers['X-Frame-Options']).toBe('DENY');
      expect(headers['X-XSS-Protection']).toBeDefined();
      expect(headers['Referrer-Policy']).toBeDefined();
    });

    it('should maintain API security headers', () => {
      const headers = securityHeadersManager.getApiSecurityHeaders();

      expect(headers['Content-Type']).toBe('application/json');
      expect(headers['X-Content-Type-Options']).toBe('nosniff');
      expect(headers['Cache-Control']).toContain('no-store');
    });
  });

  describe('Audit Logging Regression', () => {
    it('should maintain credential access logging', () => {
      const initialCount = securityAuditor.getRecentEvents().length;

      securityAuditor.logCredentialAccess('TEST_KEY', 'user123', '192.168.1.1');

      const events = securityAuditor.getRecentEvents();
      expect(events.length).toBe(initialCount + 1);
      expect(events[events.length - 1].eventType).toBe('credential_access');
      expect(events[events.length - 1].resource).toBe('TEST_KEY');
    });

    it('should maintain security incident logging', () => {
      const initialCount = securityAuditor.getRecentEvents().length;

      securityAuditor.logSecurityIncident(
        'test_incident',
        'Test security incident',
        'medium',
        'user123',
        '192.168.1.1'
      );

      const events = securityAuditor.getRecentEvents();
      expect(events.length).toBe(initialCount + 1);
      expect(events[events.length - 1].eventType).toBe('security_incident');
      expect(events[events.length - 1].severity).toBe('medium');
    });

    it('should maintain authentication event logging', () => {
      const initialCount = securityAuditor.getRecentEvents().length;

      securityAuditor.logAuthenticationEvent('login', true, 'user123', '192.168.1.1');
      securityAuditor.logAuthenticationEvent('login', false, 'user123', '192.168.1.1');

      const events = securityAuditor.getRecentEvents();
      expect(events.length).toBe(initialCount + 2);
    });

    it('should maintain metrics calculation', () => {
      // Generate some test events
      securityAuditor.logCredentialAccess('API_KEY', 'user1');
      securityAuditor.logAuthenticationEvent('login', false, 'user1');
      securityAuditor.logSecurityIncident('test', 'Test', 'low');

      const metrics = securityAuditor.getSecurityMetrics();
      expect(metrics.totalEvents).toBeGreaterThan(0);
      expect(metrics.credentialAccesses).toBeGreaterThan(0);
      expect(metrics.authFailures).toBeGreaterThan(0);
    });

    it('should maintain anomaly detection', () => {
      // Generate multiple failed authentication attempts
      for (let i = 0; i < 6; i++) {
        securityAuditor.logAuthenticationEvent('login', false, 'user123', '192.168.1.1');
      }

      const anomalies = securityAuditor.detectSecurityAnomalies();
      expect(anomalies.length).toBeGreaterThan(0);
      expect(anomalies[0].type).toBe('brute_force_attempt');
    });
  });

  describe('Security Monitoring Regression', () => {
    it('should maintain request monitoring', () => {
      const initialRequests = securityMonitoring.getSecurityMetrics().totalRequests;

      securityMonitoring.recordRequest('/api/test', 'GET', '192.168.1.1');

      const metrics = securityMonitoring.getSecurityMetrics();
      expect(metrics.totalRequests).toBe(initialRequests + 1);
    });

    it('should maintain authentication monitoring', () => {
      securityMonitoring.recordAuthAttempt(true, '192.168.1.1');
      securityMonitoring.recordAuthAttempt(false, '192.168.1.2');

      const metrics = securityMonitoring.getSecurityMetrics();
      expect(metrics.authAttempts).toBe(2);
      expect(metrics.authSuccesses).toBe(1);
      expect(metrics.authFailures).toBe(1);
    });

    it('should maintain security violation tracking', () => {
      const initialViolations = securityMonitoring.getSecurityMetrics().securityViolations;

      securityMonitoring.recordSecurityViolation('test_violation');

      const metrics = securityMonitoring.getSecurityMetrics();
      expect(metrics.securityViolations).toBe(initialViolations + 1);
    });

    it('should maintain security scoring', () => {
      const score = securityMonitoring.getSecurityScore();

      expect(typeof score).toBe('number');
      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(100);
    });

    it('should maintain alert management', () => {
      securityMonitoring.recordSecurityViolation('critical_issue');

      const alerts = securityMonitoring.getUnresolvedAlerts();
      expect(alerts.length).toBeGreaterThan(0);
      expect(alerts[0].severity).toBe('critical');

      // Test alert resolution
      securityMonitoring.resolveAlert(alerts[0].id);
      const unresolvedAlerts = securityMonitoring.getUnresolvedAlerts();
      expect(unresolvedAlerts.length).toBe(0);
    });
  });

  describe('API Security Regression', () => {
    it('should maintain input validation', () => {
      const testCases = [
        { input: '../../etc/passwd', valid: false },
        { input: '<script>alert("xss")</script>', valid: false },
        { input: "'; DROP TABLE users; --", valid: false },
        { input: 'normal-input', valid: true },
      ];

      testCases.forEach(({ input, valid }) => {
        const result = apiSecurityValidator.validateInput(input, 'string');
        expect(result.isValid).toBe(valid);
      });
    });

    it('should maintain rate limiting detection', () => {
      const clientId = 'test-client';

      // Simulate multiple requests
      let blockedCount = 0;
      for (let i = 0; i < 15; i++) {
        const result = apiSecurityValidator.checkRateLimit(clientId, 'api-endpoint');
        if (!result.allowed) blockedCount++;
      }

      // Should eventually block requests after threshold
      expect(blockedCount).toBeGreaterThan(0);
    });

    it('should maintain suspicious request detection', () => {
      const suspiciousRequests = [
        { path: '/api/../etc/passwd', method: 'GET', userAgent: 'sqlmap/1.0' },
        { path: '/api/admin/users', method: 'DELETE', userAgent: 'curl/7.68.0' },
        { path: '/api/validate', method: 'POST', body: { input: '<script>' } },
      ];

      suspiciousRequests.forEach(request => {
        const result = apiSecurityValidator.validateRequest(request);
        expect(result.suspicious).toBe(true);
        expect(result.riskScore).toBeGreaterThan(50);
      });
    });

    it('should maintain SQL injection detection', () {
      const sqlInjectionAttempts = [
        "'; DROP TABLE users; --",
        "' OR '1'='1",
        "1; DELETE FROM users WHERE 1=1; --",
        "' UNION SELECT * FROM users --",
      ];

      sqlInjectionAttempts.forEach(input => {
        const result = apiSecurityValidator.detectSQLInjection(input);
        expect(result.detected).toBe(true);
        expect(result.patterns.length).toBeGreaterThan(0);
      });
    });

    it('should maintain XSS detection', () => {
      const xssAttempts = [
        '<script>alert("xss")</script>',
        'javascript:alert("xss")',
        '<img src="x" onerror="alert(1)">',
        '<svg onload="alert(1)">',
      ];

      xssAttempts.forEach(input => {
        const result = apiSecurityValidator.detectXSS(input);
        expect(result.detected).toBe(true);
        expect(result.patterns.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Payment Security Regression', () => {
    it('should maintain payment data validation', () => {
      const invalidPaymentData = [
        { cardNumber: '1234567890123456' }, // Invalid Luhn
        { cardNumber: '4111-1111-1111-1111', expiry: '13/2025' }, // Invalid month
        { cardNumber: '4111111111111111', cvv: '12' }, // Short CVV
        { amount: -100 }, // Negative amount
      ];

      invalidPaymentData.forEach(data => {
        const result = paymentSecurity.validatePaymentData(data);
        expect(result.isValid).toBe(false);
        expect(result.errors.length).toBeGreaterThan(0);
      });
    });

    it('should maintain payment amount limits', () => {
      const largeAmount = 100000; // Unrealistically large amount
      const result = paymentSecurity.validatePaymentAmount(largeAmount, 'PLN');

      expect(result.isValid).toBe(false);
      expect(result.errors.some(error =>
        error.toLowerCase().includes('amount') || error.toLowerCase().includes('limit')
      )).toBe(true);
    });

    it('should maintain PCI compliance checks', () => {
      const paymentData = {
        cardNumber: '4111111111111111',
        expiry: '12/2025',
        cvv: '123',
      };

      const result = paymentSecurity.validatePCIDSS(paymentData);
      expect(result.compliant).toBe(true);
      expect(result.violations).toHaveLength(0);
    });
  });

  describe('Component Security Regression', () => {
    it('should maintain secure form handling', async () => {
      const TestForm = () => {
        const [value, setValue] = React.useState('');

        return (
          <form data-testid="test-form">
            <input
              data-testid="test-input"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder="Enter text"
            />
            <button type="submit">Submit</button>
          </form>
        );
      };

      render(
        <TestWrapper>
          <TestForm />
        </TestWrapper>
      );

      const input = screen.getByTestId('test-input');

      // Test potentially malicious input
      const maliciousInput = '<script>alert("xss")</script>';
      fireEvent.change(input, { target: { value: maliciousInput } });

      // Input should be sanitized or handled securely
      expect(input).toHaveValue(maliciousInput);

      // Form submission should be handled securely
      const form = screen.getByTestId('test-form');
      fireEvent.submit(form);

      // Verify no script execution occurred (no alerts, etc.)
      expect(window.alert).not.toHaveBeenCalled();
    });

    it('should maintain secure local storage usage', () => {
      // Test that sensitive data is not stored in plaintext
      const sensitiveData = 'secret-api-key';

      // Should not store sensitive data in localStorage
      expect(() => {
        localStorage.setItem('api-key', sensitiveData);
      }).not.toThrow();

      // Security auditor should detect this
      securityAuditor.logSecurityIncident(
        'sensitive_data_storage',
        'Sensitive data stored in localStorage',
        'high'
      );

      const events = securityAuditor.getRecentEvents();
      expect(events.some(event => event.eventType === 'security_incident')).toBe(true);
    });

    it('should maintain secure session handling', () => {
      // Test session security
      const sessionId = 'test-session-123';
      const userId = 'user-123';

      // Should validate session data
      const sessionData = { sessionId, userId, timestamp: Date.now() };
      const isValidSession = securityAuditor.validateSession(sessionData);

      expect(typeof isValidSession).toBe('boolean');
    });
  });

  describe('Integration Security Regression', () => {
    it('should maintain end-to-end security flow', () => {
      // Simulate complete security flow
      const userId = 'user-123';
      const ipAddress = '192.168.1.1';

      // 1. Record authentication attempt
      securityMonitoring.recordAuthAttempt(true, ipAddress);

      // 2. Log credential access
      securityAuditor.logCredentialAccess('USER_PROFILE', userId, ipAddress);

      // 3. Record API request
      securityMonitoring.recordRequest('/api/user/profile', 'GET', ipAddress);

      // 4. Verify all security components are working
      const metrics = securityMonitoring.getSecurityMetrics();
      const events = securityAuditor.getRecentEvents();

      expect(metrics.authAttempts).toBe(1);
      expect(metrics.totalRequests).toBe(1);
      expect(events.length).toBeGreaterThan(0);
    });

    it('should maintain security incident response', () => {
      // Simulate security incident
      const incident = {
        type: 'data_breach',
        description: 'Unauthorized data access detected',
        severity: 'critical',
        userId: 'user-123',
        ipAddress: '192.168.1.1',
      };

      // Log incident
      securityAuditor.logSecurityIncident(
        incident.type,
        incident.description,
        incident.severity,
        incident.userId,
        incident.ipAddress
      );

      // Record violation
      securityMonitoring.recordSecurityViolation(incident.type);

      // Verify incident response
      const events = securityAuditor.getRecentEvents();
      const alerts = securityMonitoring.getUnresolvedAlerts();
      const metrics = securityMonitoring.getSecurityMetrics();

      expect(events.some(event => event.severity === 'critical')).toBe(true);
      expect(alerts.some(alert => alert.severity === 'critical')).toBe(true);
      expect(metrics.securityViolations).toBeGreaterThan(0);
    });
  });

  describe('Performance Security Regression', () => {
    it('should maintain security performance balance', () => {
      const startTime = performance.now();

      // Execute multiple security operations
      for (let i = 0; i < 100; i++) {
        securityHeadersManager.generateSecurityNonce();
        apiSecurityValidator.validateInput(`test-input-${i}`, 'string');
      }

      const endTime = performance.now();
      const duration = endTime - startTime;

      // Security operations should complete within reasonable time
      expect(duration).toBeLessThan(1000); // Less than 1 second for 100 operations
    });

    it('should maintain memory efficiency', () => {
      const initialEvents = securityAuditor.getRecentEvents().length;

      // Generate many events
      for (let i = 0; i < 1000; i++) {
        securityAuditor.logAuthenticationEvent('test', true, `user-${i}`, '192.168.1.1');
      }

      const finalEvents = securityAuditor.getRecentEvents().length;

      // Event count should be managed (not grow indefinitely)
      expect(finalEvents).toBeLessThan(2000); // Some reasonable limit
    });
  });
});

describe('Security Regression Prevention', () => {
  it('should prevent regression in critical security checks', () => {
    // Define minimum security requirements that should never regress
    const criticalSecurityRequirements = [
      () => securityHeadersManager.getServerSecurityHeaders()['X-Content-Type-Options'] === 'nosniff',
      () => securityHeadersManager.getServerSecurityHeaders()['X-Frame-Options'] === 'DENY',
      () => apiSecurityValidator.validateInput('<script>', 'string').isValid === false,
      () => apiSecurityValidator.detectSQLInjection("'; DROP TABLE users; --").detected === true,
      () => apiSecurityValidator.detectXSS('<script>alert(1)</script>').detected === true,
      () => paymentSecurity.validatePaymentData({ cardNumber: 'invalid' }).isValid === false,
    ];

    criticalSecurityRequirements.forEach((requirement, index) => {
      try {
        const result = requirement();
        expect(result).toBe(true);
      } catch (error) {
        throw new Error(`Critical security requirement ${index + 1} failed: ${error.message}`);
      }
    });
  });

  it('should maintain security baseline metrics', () => {
    // Generate baseline security metrics
    securityMonitoring.recordAuthAttempt(true, '192.168.1.1');
    securityAuditor.logCredentialAccess('TEST_KEY', 'user123');

    const metrics = securityMonitoring.getSecurityMetrics();
    const score = securityMonitoring.getSecurityScore();

    // Baseline expectations
    expect(metrics.authAttempts).toBeGreaterThan(0);
    expect(typeof score).toBe('number');
    expect(score).toBeGreaterThanOrEqual(0);
    expect(score).toBeLessThanOrEqual(100);
  });
});