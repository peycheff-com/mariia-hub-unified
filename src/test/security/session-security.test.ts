/**
 * Session Security Tests
 *
 * This test suite validates session management security, including
 * session token generation, validation, and protection against
 * session-based attacks.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import React from 'react';

// Import security utilities
import apiSecurityValidator from '@/lib/api-security-validator';
import securityAuditor from '@/lib/security-audit';
import securityMonitoring from '@/lib/security-monitoring';

// Mock crypto for token generation
const mockCrypto = {
  randomBytes: vi.fn(() => Buffer.from('mock-random-bytes')),
  randomUUID: vi.fn(() => 'mock-uuid-12345'),
  createHash: vi.fn(() => ({
    update: vi.fn().mockReturnThis(),
    digest: vi.fn(() => 'mock-hash'),
  })),
  createHmac: vi.fn(() => ({
    update: vi.fn().mockReturnThis(),
    digest: vi.fn(() => 'mock-hmac'),
  })),
};

describe('Session Security Tests', () => {
  beforeEach(() => {
    vi.stubEnv('NODE_ENV', 'test');

    // Mock crypto module
    global.crypto = mockCrypto as any;

    // Mock localStorage and sessionStorage
    const localStorageMock = {
      getItem: vi.fn(),
      setItem: vi.fn(),
      removeItem: vi.fn(),
      clear: vi.fn(),
      length: 0,
      key: vi.fn(),
    };
    Object.defineProperty(window, 'localStorage', { value: localStorageMock });

    const sessionStorageMock = {
      getItem: vi.fn(),
      setItem: vi.fn(),
      removeItem: vi.fn(),
      clear: vi.fn(),
      length: 0,
      key: vi.fn(),
    };
    Object.defineProperty(window, 'sessionStorage', { value: sessionStorageMock });

    // Reset security monitoring
    securityMonitoring['metrics'] = securityMonitoring['initializeMetrics']();
    securityMonitoring['alerts'] = [];
    securityAuditor['events'] = [];

    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.clearAllMocks();
  });

  describe('Session Token Generation', () => {
    it('should generate cryptographically secure session tokens', () => {
      const sessionToken = securityAuditor.generateSecureToken();

      expect(sessionToken).toBeDefined();
      expect(typeof sessionToken).toBe('string');
      expect(sessionToken.length).toBeGreaterThan(32);
      expect(sessionToken).toMatch(/^[a-zA-Z0-9_-]+$/);
    });

    it('should generate unique session tokens', () => {
      const token1 = securityAuditor.generateSecureToken();
      const token2 = securityAuditor.generateSecureToken();

      expect(token1).not.toBe(token2);
    });

    it('should generate tokens with sufficient entropy', () => {
      const tokens = Array(100).fill(null).map(() => securityAuditor.generateSecureToken());
      const uniqueTokens = new Set(tokens);

      // All tokens should be unique
      expect(uniqueTokens.size).toBe(100);
    });

    it('should validate session token format', () => {
      const validTokens = [
        'abc123def456ghi789',
        'session-token-123456',
        'SESSION_TOKEN_123456',
        'v1.abc123def456',
      ];

      const invalidTokens = [
        '',
        'a',
        'short',
        '../../etc/passwd',
        '<script>alert(1)</script>',
        "'; DROP TABLE users; --",
      ];

      validTokens.forEach(token => {
        const result = apiSecurityValidator.validateSessionToken(token);
        expect(result.valid).toBe(true);
      });

      invalidTokens.forEach(token => {
        const result = apiSecurityValidator.validateSessionToken(token);
        expect(result.valid).toBe(false);
      });
    });

    it('should include session metadata in tokens', () => {
      const sessionData = {
        userId: 'user123',
        role: 'customer',
        ip: '192.168.1.1',
        userAgent: 'Mozilla/5.0',
      };

      const sessionToken = securityAuditor.createSessionToken(sessionData);
      const decoded = securityAuditor.decodeSessionToken(sessionToken);

      expect(decoded.userId).toBe(sessionData.userId);
      expect(decoded.role).toBe(sessionData.role);
      expect(decoded.ip).toBe(sessionData.ip);
    });
  });

  describe('Session Validation', () => {
    it('should validate active sessions', () => {
      const session = {
        id: 'session-123',
        userId: 'user123',
        createdAt: Date.now(),
        lastActivity: Date.now(),
        expiresAt: Date.now() + (30 * 60 * 1000), // 30 minutes
        ip: '192.168.1.1',
        userAgent: 'Mozilla/5.0',
      };

      const result = apiSecurityValidator.validateSession(session);
      expect(result.valid).toBe(true);
      expect(result.issues).toHaveLength(0);
    });

    it('should reject expired sessions', () => {
      const expiredSession = {
        id: 'session-123',
        userId: 'user123',
        createdAt: Date.now() - (60 * 60 * 1000), // 1 hour ago
        lastActivity: Date.now() - (35 * 60 * 1000), // 35 minutes ago
        expiresAt: Date.now() - (5 * 60 * 1000), // Expired 5 minutes ago
        ip: '192.168.1.1',
        userAgent: 'Mozilla/5.0',
      };

      const result = apiSecurityValidator.validateSession(expiredSession);
      expect(result.valid).toBe(false);
      expect(result.issues).toContain('expired');
    });

    it('should enforce session inactivity timeout', () => {
      const inactiveSession = {
        id: 'session-123',
        userId: 'user123',
        createdAt: Date.now() - (60 * 60 * 1000), // 1 hour ago
        lastActivity: Date.now() - (20 * 60 * 1000), // 20 minutes ago
        expiresAt: Date.now() + (10 * 60 * 1000), // Still valid but inactive
        ip: '192.168.1.1',
        userAgent: 'Mozilla/5.0',
        maxInactivity: 15 * 60 * 1000, // 15 minutes max inactivity
      };

      const result = apiSecurityValidator.validateSession(inactiveSession);
      expect(result.valid).toBe(false);
      expect(result.issues).toContain('inactive_too_long');
    });

    it('should validate session IP consistency', () => {
      const sessionWithIpChange = {
        id: 'session-123',
        userId: 'user123',
        createdAt: Date.now(),
        lastActivity: Date.now(),
        expiresAt: Date.now() + (30 * 60 * 1000),
        ip: '192.168.1.1',
        currentIp: '203.0.113.1', // Different IP
        userAgent: 'Mozilla/5.0',
      };

      const result = apiSecurityValidator.validateSession(sessionWithIpChange);
      expect(result.suspicious).toBe(true);
      expect(result.issues).toContain('ip_changed');
    });

    it('should validate session User-Agent consistency', () => {
      const sessionWithUAChange = {
        id: 'session-123',
        userId: 'user123',
        createdAt: Date.now(),
        lastActivity: Date.now(),
        expiresAt: Date.now() + (30 * 60 * 1000),
        ip: '192.168.1.1',
        userAgent: 'Mozilla/5.0',
        currentUserAgent: 'curl/7.68.0', // Different User-Agent
      };

      const result = apiSecurityValidator.validateSession(sessionWithUAChange);
      expect(result.suspicious).toBe(true);
      expect(result.issues).toContain('user_agent_changed');
    });
  });

  describe('Session Fixation Prevention', () => {
    it('should prevent session fixation attacks', () => {
      const fixationAttempts = [
        {
          sessionId: 'PHPSESSID=admin123',
          action: 'login',
          description: 'PHP session fixation',
        },
        {
          sessionId: 'JSESSIONID=administrator',
          action: 'login',
          description: 'Java session fixation',
        },
        {
          sessionId: 'ASP.NET_SessionId=admin',
          action: 'privilege_escalation',
          description: 'ASP.NET session fixation',
        },
        {
          sessionId: 'session_id=../../etc/passwd',
          action: 'login',
          description: 'Path traversal in session ID',
        },
      ];

      fixationAttempts.forEach(attempt => {
        const result = apiSecurityValidator.detectSessionFixation(attempt);
        expect(result.detected).toBe(true);
        expect(result.action).toContain('regenerate');
        expect(result.severity).toBe('high');
      });
    });

    it('should regenerate session IDs on privilege changes', () => {
      const privilegeChangeScenarios = [
        {
          action: 'login',
          currentRole: 'guest',
          newRole: 'customer',
          expectRegeneration: true,
        },
        {
          action: 'role_upgrade',
          currentRole: 'customer',
          newRole: 'admin',
          expectRegeneration: true,
        },
        {
          action: 'password_change',
          currentRole: 'customer',
          newRole: 'customer',
          expectRegeneration: true,
        },
        {
          action: 'profile_update',
          currentRole: 'customer',
          newRole: 'customer',
          expectRegeneration: false,
        },
      ];

      privilegeChangeScenarios.forEach(scenario => {
        const result = apiSecurityValidator.shouldRegenerateSession(scenario);
        expect(result.regenerate).toBe(scenario.expectRegeneration);
      });
    });

    it('should validate session ID format and security', () => {
      const insecureSessionIds = [
        'admin', // Predictable
        '123456', // Sequential
        'session123', // Simple pattern
        '../../../etc/passwd', // Path traversal
        '<script>alert(1)</script>', // XSS
        "'; DROP TABLE users; --", // SQL injection
        'a' * 1000, // Too long
        '', // Empty
      ];

      insecureSessionIds.forEach(sessionId => {
        const result = apiSecurityValidator.validateSessionIdFormat(sessionId);
        expect(result.secure).toBe(false);
        expect(result.issues.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Session Hijacking Prevention', () => {
    it('should detect session hijacking through IP changes', () => {
      const hijackingScenarios = [
        {
          currentIp: '192.168.1.100',
          sessionIp: '10.0.0.1',
          expected: 'suspicious',
        },
        {
          currentIp: '203.0.113.1',
          sessionIp: '198.51.100.1',
          expected: 'high_risk',
        },
        {
          currentIp: '192.168.1.100',
          sessionIp: '192.168.1.100',
          expected: 'normal',
        },
      ];

      hijackingScenarios.forEach(scenario => {
        const result = apiSecurityValidator.detectSessionHijacking({
          currentIp: scenario.currentIp,
          sessionIp: scenario.sessionIp,
          userAgent: 'Mozilla/5.0',
          sessionUserAgent: 'Mozilla/5.0',
        });

        if (scenario.expected === 'normal') {
          expect(result.suspicious).toBe(false);
        } else {
          expect(result.suspicious).toBe(true);
          expect(result.riskScore).toBeGreaterThan(50);
        }
      });
    });

    it('should detect session hijacking through User-Agent changes', () => {
      const uaChangeScenarios = [
        {
          currentUserAgent: 'Mozilla/5.0',
          sessionUserAgent: 'curl/7.68.0',
          expected: true,
        },
        {
          currentUserAgent: 'Mozilla/5.0',
          sessionUserAgent: 'PostmanRuntime/7.29.0',
          expected: true,
        },
        {
          currentUserAgent: 'Mozilla/5.0',
          sessionUserAgent: 'Mozilla/5.0',
          expected: false,
        },
      ];

      uaChangeScenarios.forEach(scenario => {
        const result = apiSecurityValidator.detectSessionHijacking({
          currentIp: '192.168.1.100',
          sessionIp: '192.168.1.100',
          userAgent: scenario.currentUserAgent,
          sessionUserAgent: scenario.sessionUserAgent,
        });

        expect(result.suspicious).toBe(scenario.expected);
      });
    });

    it('should detect concurrent session usage', () => {
      const concurrentSessionScenarios = [
        {
          activeSessions: 3,
          maxConcurrent: 2,
          expected: true,
        },
        {
          activeSessions: 1,
          maxConcurrent: 2,
          expected: false,
        },
        {
          activeSessions: 5,
          maxConcurrent: 2,
          expected: true,
        },
      ];

      concurrentSessionScenarios.forEach(scenario => {
        const result = apiSecurityValidator.detectConcurrentSessions({
          activeSessions: scenario.activeSessions,
          maxConcurrent: scenario.maxConcurrent,
          userId: 'user123',
        });

        expect(result.detected).toBe(scenario.expected);
        if (scenario.expected) {
          expect(result.action).toContain('terminate_extra');
        }
      });
    });

    it('should validate geographic consistency', () => {
      const geoScenarios = [
        {
          currentLocation: { country: 'US', city: 'New York' },
          sessionLocation: { country: 'US', city: 'New York' },
          expected: 'normal',
        },
        {
          currentLocation: { country: 'CN', city: 'Beijing' },
          sessionLocation: { country: 'US', city: 'New York' },
          expected: 'impossible_travel',
        },
        {
          currentLocation: { country: 'US', city: 'Los Angeles' },
          sessionLocation: { country: 'US', city: 'New York' },
          expected: 'suspicious',
        },
      ];

      geoScenarios.forEach(scenario => {
        const result = apiSecurityValidator.validateGeographicConsistency({
          currentLocation: scenario.currentLocation,
          sessionLocation: scenario.sessionLocation,
          timestamp: Date.now(),
          sessionTimestamp: Date.now() - (10 * 60 * 1000), // 10 minutes ago
        });

        if (scenario.expected === 'normal') {
          expect(result.consistent).toBe(true);
        } else {
          expect(result.inconsistent).toBe(true);
          expect(result.anomaly).toBe(scenario.expected);
        }
      });
    });
  });

  describe('Session Storage Security', () => {
    it('should use secure cookie storage for sessions', () => {
      const cookieTests = [
        {
          name: 'sessionId',
          value: 'secure-session-123',
          secure: true,
          httpOnly: true,
          sameSite: 'strict',
          expected: true,
        },
        {
          name: 'sessionId',
          value: 'insecure-session-123',
          secure: false,
          httpOnly: false,
          sameSite: 'none',
          expected: false,
        },
        {
          name: 'sessionId',
          value: 'session-123',
          secure: true,
          httpOnly: true,
          sameSite: 'lax',
          expected: true,
        },
      ];

      cookieTests.forEach(test => {
        const result = apiSecurityValidator.validateSessionCookie({
          name: test.name,
          value: test.value,
          secure: test.secure,
          httpOnly: test.httpOnly,
          sameSite: test.sameSite,
        });

        expect(result.secure).toBe(test.expected);
      });
    });

    it('should prevent sensitive session data in localStorage', () => {
      const storageTests = [
        {
          data: { userId: 'user123', sessionId: 'session-123' },
          storageType: 'localStorage',
          expected: false,
        },
        {
          data: { userId: 'user123', sessionId: 'session-123' },
          storageType: 'sessionStorage',
          expected: false,
        },
        {
          data: { userId: 'user123', sessionId: 'session-123' },
          storageType: 'cookie',
          secure: true,
          httpOnly: true,
          expected: true,
        },
      ];

      storageTests.forEach(test => {
        const result = apiSecurityValidator.validateSecureStorage(test);
        expect(result.secure).toBe(test.expected);
      });
    });

    it('should validate session data serialization', () => {
      const serializationTests = [
        {
          data: { userId: 'user123', role: 'customer' },
          method: 'json',
          expected: true,
        },
        {
          data: { userId: 'user123', role: 'customer', __proto__: { admin: true } },
          method: 'json',
          expected: false, // Prototype pollution
        },
        {
          data: { userId: '<script>alert(1)</script>', role: 'customer' },
          method: 'json',
          expected: false, // XSS in data
        },
      ];

      serializationTests.forEach(test => {
        const result = apiSecurityValidator.validateSessionDataSerialization(test);
        expect(result.safe).toBe(test.expected);
      });
    });
  });

  describe('Session Timeout and Expiration', () => {
    it('should implement proper session timeout policies', () => {
      const timeoutTests = [
        {
          sessionAge: 25 * 60 * 60 * 1000, // 25 hours
          maxAge: 24 * 60 * 60 * 1000, // 24 hours
          expected: false,
        },
        {
          sessionAge: 12 * 60 * 60 * 1000, // 12 hours
          maxAge: 24 * 60 * 60 * 1000, // 24 hours
          expected: true,
        },
        {
          sessionAge: 30 * 60 * 1000, // 30 minutes
          maxAge: 15 * 60 * 1000, // 15 minutes
          expected: false,
        },
      ];

      timeoutTests.forEach(test => {
        const now = Date.now();
        const session = {
          createdAt: now - test.sessionAge,
          lastActivity: now - (5 * 60 * 1000), // Active 5 minutes ago
        };

        const result = apiSecurityValidator.validateSessionTimeout({
          ...session,
          maxAge: test.maxAge,
        });

        expect(result.valid).toBe(test.expected);
      });
    });

    it('should implement sliding session expiration', () => {
      const slidingSessionTests = [
        {
          lastActivity: Date.now() - (10 * 60 * 1000), // 10 minutes ago
          inactivityTimeout: 15 * 60 * 1000, // 15 minutes
          expected: true,
        },
        {
          lastActivity: Date.now() - (20 * 60 * 1000), // 20 minutes ago
          inactivityTimeout: 15 * 60 * 1000, // 15 minutes
          expected: false,
        },
      ];

      slidingSessionTests.forEach(test => {
        const result = apiSecurityValidator.validateSlidingSessionTimeout({
          lastActivity: test.lastActivity,
          inactivityTimeout: test.inactivityTimeout,
        });

        expect(result.valid).toBe(test.expected);
      });
    });

    it('should handle session renewal correctly', () => {
      const renewalTests = [
        {
          action: 'user_activity',
          remainingTime: 5 * 60 * 1000, // 5 minutes remaining
          expected: true,
        },
        {
          action: 'security_event',
          remainingTime: 5 * 60 * 1000, // 5 minutes remaining
          expected: false, // Don't renew on security events
        },
        {
          action: 'privileged_operation',
          remainingTime: 30 * 60 * 1000, // 30 minutes remaining
          expected: true,
        },
      ];

      renewalTests.forEach(test => {
        const result = apiSecurityValidator.shouldRenewSession({
          action: test.action,
          remainingTime: test.remainingTime,
          minRenewalTime: 10 * 60 * 1000, // 10 minutes minimum
        });

        expect(result.renew).toBe(test.expected);
      });
    });
  });

  describe('Session Revocation and Cleanup', () => {
    it('should handle session revocation scenarios', () => {
      const revocationScenarios = [
        {
          reason: 'user_logout',
          immediate: true,
          expected: 'immediate',
        },
        {
          reason: 'password_change',
          immediate: true,
          expected: 'immediate',
        },
        {
          reason: 'security_violation',
          immediate: true,
          expected: 'immediate',
        },
        {
          reason: 'role_revocation',
          immediate: false,
          expected: 'graceful',
        },
        {
          reason: 'account_locked',
          immediate: true,
          expected: 'immediate',
        },
      ];

      revocationScenarios.forEach(scenario => {
        const result = apiSecurityValidator.handleSessionRevocation(scenario);
        expect(result.method).toBe(scenario.expected);
      });
    });

    it('should validate session cleanup policies', () => {
      const cleanupTests = [
        {
          sessionStatus: 'expired',
          cleanupDelay: 0,
          expected: 'immediate',
        },
        {
          sessionStatus: 'revoked',
          cleanupDelay: 0,
          expected: 'immediate',
        },
        {
          sessionStatus: 'inactive',
          cleanupDelay: 24 * 60 * 60 * 1000, // 24 hours
          expected: 'delayed',
        },
      ];

      cleanupTests.forEach(test => {
        const result = apiSecurityValidator.scheduleSessionCleanup({
          sessionStatus: test.sessionStatus,
          cleanupDelay: test.cleanupDelay,
        });

        expect(result.strategy).toBe(test.expected);
      });
    });

    it('should prevent session replay attacks', () => {
      const replayTests = [
        {
          sessionId: 'used-session-123',
          usageCount: 1,
          singleUse: true,
          expected: false,
        },
        {
          sessionId: 'multi-use-session-123',
          usageCount: 5,
          singleUse: false,
          expected: true,
        },
        {
          sessionId: 'expired-session-123',
          expiryTime: Date.now() - (5 * 60 * 1000), // Expired 5 minutes ago
          expected: false,
        },
      ];

      replayTests.forEach(test => {
        const result = apiSecurityValidator.validateSessionReplay({
          sessionId: test.sessionId,
          usageCount: test.usageCount,
          singleUse: test.singleUse,
          expiryTime: test.expiryTime || Date.now() + (60 * 60 * 1000),
        });

        expect(result.valid).toBe(test.expected);
      });
    });
  });

  describe('Cross-Site Request Forgery (CSRF) Protection', () => {
    it('should validate CSRF tokens', () => {
      const csrfTests = [
        {
          sessionToken: 'session-123',
          csrfToken: 'csrf-456',
          expectedCsrf: 'expected-csrf-456',
          expected: true,
        },
        {
          sessionToken: 'session-123',
          csrfToken: 'invalid-csrf',
          expectedCsrf: 'expected-csrf-456',
          expected: false,
        },
        {
          sessionToken: 'session-123',
          csrfToken: null,
          expectedCsrf: 'expected-csrf-456',
          expected: false,
        },
      ];

      csrfTests.forEach(test => {
        const result = apiSecurityValidator.validateCSRFToken({
          sessionToken: test.sessionToken,
          providedToken: test.csrfToken,
          expectedToken: test.expectedCsrf,
        });

        expect(result.valid).toBe(test.expected);
      });
    });

    it('should generate secure CSRF tokens', () => {
      const csrfToken = securityAuditor.generateCSRFToken('session-123');

      expect(csrfToken).toBeDefined();
      expect(typeof csrfToken).toBe('string');
      expect(csrfToken.length).toBeGreaterThan(20);
      expect(csrfToken).not.toBe('session-123'); // Should be different from session token
    });

    it('should prevent CSRF token manipulation', () => {
      const manipulationTests = [
        {
          token: 'csrf-123',
          manipulation: 'length_extension',
          expected: false,
        },
        {
          token: 'csrf-123',
          manipulation: 'character_replacement',
          expected: false,
        },
        {
          token: '../../etc/passwd',
          manipulation: 'path_injection',
          expected: false,
        },
      ];

      manipulationTests.forEach(test => {
        const result = apiSecurityValidator.validateCSRFTokenFormat(test.token);
        expect(result.valid).toBe(test.expected);
      });
    });
  });

  describe('Session Analytics and Monitoring', () => {
    it('should track session lifecycle events', () => {
      const sessionEvents = [
        { type: 'created', userId: 'user123', ip: '192.168.1.1' },
        { type: 'validated', userId: 'user123', ip: '192.168.1.1' },
        { type: 'expired', userId: 'user123', ip: '192.168.1.1' },
        { type: 'revoked', userId: 'user123', ip: '192.168.1.1' },
      ];

      sessionEvents.forEach(event => {
        securityAuditor.logSessionEvent(event);
      });

      const events = securityAuditor.getRecentEvents();
      expect(events.filter(e => e.eventType === 'session_event')).toHaveLength(4);
    });

    it('should detect session anomalies', () => {
      // Simulate suspicious session activity
      for (let i = 0; i < 10; i++) {
        securityAuditor.logSessionEvent({
          type: 'validated',
          userId: 'user123',
          ip: `192.168.1.${i}`,
        });
      }

      const anomalies = securityAuditor.detectSessionAnomalies();
      expect(anomalies.length).toBeGreaterThan(0);
      expect(anomalies[0].type).toContain('multiple_ips');
    });

    it('should provide session security metrics', () => {
      const sessionMetrics = securityMonitoring.getSessionMetrics();

      expect(sessionMetrics).toBeDefined();
      expect(typeof sessionMetrics.activeSessions).toBe('number');
      expect(typeof sessionMetrics.expiredSessions).toBe('number');
      expect(typeof sessionMetrics.revokedSessions).toBe('number');
      expect(typeof sessionMetrics.suspiciousSessions).toBe('number');
    });

    it('should generate session security alerts', () => {
      // Simulate session hijacking attempt
      securityAuditor.logSecurityIncident(
        'session_hijacking',
        'Suspicious session activity detected',
        'high',
        'user123',
        '192.168.1.100'
      );

      const alerts = securityAuditor.getRecentEvents();
      expect(alerts.some(alert => alert.severity === 'high')).toBe(true);
      expect(alerts.some(alert => alert.eventType === 'security_incident')).toBe(true);
    });
  });

  describe('Session Performance and Scalability', () => {
    it('should handle concurrent session operations efficiently', async () => {
      const concurrentOperations = Array(100).fill(null).map((_, i) =>
        apiSecurityValidator.validateSession({
          id: `session-${i}`,
          userId: `user-${i}`,
          createdAt: Date.now(),
          lastActivity: Date.now(),
          expiresAt: Date.now() + (30 * 60 * 1000),
          ip: '192.168.1.1',
          userAgent: 'Mozilla/5.0',
        })
      );

      const startTime = performance.now();
      const results = await Promise.all(concurrentOperations);
      const endTime = performance.now();

      expect(results.length).toBe(100);
      expect(results.every(r => r.valid)).toBe(true);
      expect(endTime - startTime).toBeLessThan(1000); // Should complete within 1 second
    });

    it('should validate session storage performance', () => {
      const storageOperations = Array(1000).fill(null).map((_, i) => ({
        key: `session-${i}`,
        value: `session-data-${i}`,
      }));

      const startTime = performance.now();
      storageOperations.forEach(op => {
        localStorage.setItem(op.key, op.value);
      });
      const endTime = performance.now();

      expect(endTime - startTime).toBeLessThan(1000); // Should complete within 1 second
    });

    it('should handle session cleanup efficiently', () => {
      const sessions = Array(1000).fill(null).map((_, i) => ({
        id: `session-${i}`,
        expired: i % 100 === 0, // 10% expired
        lastActivity: Date.now() - (i * 1000),
      }));

      const startTime = performance.now();
      const activeSessions = apiSecurityValidator.cleanupExpiredSessions(sessions);
      const endTime = performance.now();

      expect(activeSessions.length).toBe(900); // 100 expired sessions removed
      expect(endTime - startTime).toBeLessThan(500); // Should complete within 500ms
    });
  });

  describe('Integration with Authentication Systems', () => {
    it('should integrate with Supabase authentication', () => {
      const supabaseSession = {
        access_token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        refresh_token: 'refresh-token-123',
        expires_at: Date.now() + (60 * 60 * 1000),
        user: {
          id: 'user-123',
          email: 'user@example.com',
          role: 'customer',
        },
      };

      const result = apiSecurityValidator.validateSupabaseSession(supabaseSession);
      expect(result.valid).toBe(true);
    });

    it('should integrate with OAuth sessions', () => {
      const oauthSession = {
        provider: 'google',
        accessToken: 'google-access-token-123',
        refreshToken: 'google-refresh-token-123',
        expiresAt: Date.now() + (60 * 60 * 1000),
        profile: {
          id: 'google-user-123',
          email: 'user@gmail.com',
          verified: true,
        },
      };

      const result = apiSecurityValidator.validateOAuthSession(oauthSession);
      expect(result.valid).toBe(true);
    });

    it('should handle multi-factor authentication sessions', () => {
      const mfaSession = {
        userId: 'user-123',
        primaryAuth: true,
        mfaVerified: true,
        mfaMethod: 'totp',
        sessionId: 'mfa-session-123',
        createdAt: Date.now(),
        expiresAt: Date.now() + (30 * 60 * 1000),
      };

      const result = apiSecurityValidator.validateMFASession(mfaSession);
      expect(result.valid).toBe(true);
      expect(result.mfaComplete).toBe(true);
    });
  });

  describe('Session Compliance and Auditing', () => {
    it('should comply with GDPR session requirements', () => {
      const gdprTests = [
        {
          requirement: 'consent',
          sessionConsent: true,
          expected: true,
        },
        {
          requirement: 'data_minimization',
          sessionData: { userId: 'user123', role: 'customer' },
          expected: true,
        },
        {
          requirement: 'right_to_be_forgotten',
          deletionRequested: true,
          sessionDeleted: true,
          expected: true,
        },
      ];

      gdprTests.forEach(test => {
        const result = apiSecurityValidator.validateGDPRCompliance(test);
        expect(result.compliant).toBe(test.expected);
      });
    });

    it('should maintain session audit trail', () => {
      const auditEvents = [
        {
          timestamp: Date.now(),
          event: 'session_created',
          userId: 'user123',
          ip: '192.168.1.1',
          sessionId: 'session-123',
        },
        {
          timestamp: Date.now() + (5 * 60 * 1000),
          event: 'session_validated',
          userId: 'user123',
          ip: '192.168.1.1',
          sessionId: 'session-123',
        },
        {
          timestamp: Date.now() + (30 * 60 * 1000),
          event: 'session_expired',
          userId: 'user123',
          ip: '192.168.1.1',
          sessionId: 'session-123',
        },
      ];

      auditEvents.forEach(event => {
        securityAuditor.logSessionAuditEvent(event);
      });

      const auditTrail = securityAuditor.getSessionAuditTrail('session-123');
      expect(auditTrail).toHaveLength(3);
      expect(auditTrail[0].event).toBe('session_created');
      expect(auditTrail[2].event).toBe('session_expired');
    });

    it('should generate session compliance reports', () => {
      const complianceReport = securityAuditor.generateSessionComplianceReport({
        startDate: Date.now() - (24 * 60 * 60 * 1000), // 24 hours ago
        endDate: Date.now(),
      });

      expect(complianceReport).toBeDefined();
      expect(complianceReport.totalSessions).toBeGreaterThanOrEqual(0);
      expect(complianceReport.compliantSessions).toBeGreaterThanOrEqual(0);
      expect(complianceReport.violations).toBeDefined();
    });
  });
});