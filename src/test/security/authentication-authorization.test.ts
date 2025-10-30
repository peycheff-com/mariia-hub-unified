/**
 * Authentication and Authorization Security Tests
 *
 * This test suite validates authentication mechanisms, session management,
 * and authorization controls to prevent unauthorized access.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import React from 'react';

// Import security and auth utilities
import securityAuditor from '@/lib/security-audit';
import securityMonitoring from '@/lib/security-monitoring';
import apiSecurityValidator from '@/lib/api-security-validator';

// Mock Supabase auth
const mockSupabaseAuth = {
  signIn: vi.fn(),
  signUp: vi.fn(),
  signOut: vi.fn(),
  getSession: vi.fn(),
  updateUser: vi.fn(),
  resetPassword: vi.fn(),
  verifyOTP: vi.fn(),
};

// Mock authentication context
const mockAuthContext = {
  user: null,
  session: null,
  loading: false,
  signIn: mockSupabaseAuth.signIn,
  signUp: mockSupabaseAuth.signUp,
  signOut: mockSupabaseAuth.signOut,
  resetPassword: mockSupabaseAuth.resetPassword,
};

describe('Authentication Security Tests', () => {
  beforeEach(() => {
    vi.stubEnv('NODE_ENV', 'test');
    vi.stubEnv('VITE_APP_ENV', 'test');

    // Reset security monitoring
    securityMonitoring['metrics'] = securityMonitoring['initializeMetrics']();
    securityMonitoring['alerts'] = [];
    securityAuditor['events'] = [];

    // Reset mocks
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.clearAllMocks();
  });

  describe('Login Security', () => {
    it('should prevent SQL injection in login credentials', () => {
      const sqlInjectionAttempts = [
        { email: "admin'; DROP TABLE users; --", password: 'password' },
        { email: "' OR '1'='1", password: "' OR '1'='1" },
        { email: 'admin@test.com', password: "'; DELETE FROM auth.users; --" },
        { email: 'admin@test.com', password: "' UNION SELECT email FROM users --" },
      ];

      sqlInjectionAttempts.forEach(attempt => {
        const result = apiSecurityValidator.validateInput(attempt.email, 'email');
        expect(result.safe).toBe(false);
        expect(result.reason).toContain('injection');

        const passwordResult = apiSecurityValidator.validateInput(attempt.password, 'password');
        expect(passwordResult.safe).toBe(false);
      });
    });

    it('should implement rate limiting on login attempts', async () => {
      const loginAttempts = Array(15).fill(null).map((_, i) => ({
        email: 'admin@test.com',
        password: 'wrongpassword',
        ip: '192.168.1.100',
        timestamp: Date.now() + i * 1000,
      }));

      let blockedCount = 0;
      loginAttempts.forEach(attempt => {
        const result = apiSecurityValidator.checkRateLimit(attempt.ip, 'login');
        if (!result.allowed) blockedCount++;
      });

      expect(blockedCount).toBeGreaterThan(5); // Should block after threshold
    });

    it('should detect and prevent brute force attacks', () => {
      const bruteForceData = {
        username: 'admin@test.com',
        attempts: Array(20).fill(null).map((_, i) => ({
          timestamp: Date.now() + i * 500,
          ip: '192.168.1.100',
          success: false,
        })),
      };

      const result = apiSecurityValidator.detectBruteForce(bruteForceData);
      expect(result.detected).toBe(true);
      expect(result.riskLevel).toBe('high');
      expect(result.recommendation).toContain('lockout');
    });

    it('should prevent credential stuffing attacks', () => {
      const credentialStuffingData = {
        attempts: [
          { username: 'admin@test.com', ip: '192.168.1.1' },
          { username: 'user@test.com', ip: '192.168.1.2' },
          { username: 'john@test.com', ip: '192.168.1.3' },
          { username: 'jane@test.com', ip: '192.168.1.4' },
          { username: 'admin@test.com', ip: '192.168.1.5' }, // Repeated username
        ],
        timeframe: 60000, // 1 minute
      };

      const result = apiSecurityValidator.detectCredentialStuffing(credentialStuffingData);
      expect(result.detected).toBe(true);
      expect(result.confidence).toBeGreaterThan(70);
    });

    it('should enforce strong password policies', () => {
      const weakPasswords = [
        '123456',
        'password',
        'qwerty',
        'admin',
        'letmein',
        'welcome',
        'monkey',
        'dragon',
      ];

      weakPasswords.forEach(password => {
        const result = apiSecurityValidator.validatePasswordStrength(password);
        expect(result.strong).toBe(false);
        expect(result.score).toBeLessThan(30);
        expect(result.issues.length).toBeGreaterThan(0);
      });
    });

    it('should detect suspicious login patterns', () => {
      const suspiciousPatterns = [
        {
          type: 'impossible_travel',
          logins: [
            { location: 'US', timestamp: Date.now() },
            { location: 'CN', timestamp: Date.now() + 1000 }, // Impossible travel time
          ],
        },
        {
          type: 'unusual_time',
          login: { time: '03:00', userTimezone: 'EST', normalHours: '09:00-17:00' },
        },
        {
          type: 'new_device',
          login: { userAgent: 'new-device', knownDevices: ['chrome', 'firefox'] },
        },
      ];

      suspiciousPatterns.forEach(pattern => {
        const result = apiSecurityValidator.detectSuspiciousLogin(pattern);
        expect(result.suspicious).toBe(true);
        expect(result.riskScore).toBeGreaterThan(60);
      });
    });
  });

  describe('Session Management Security', () => {
    it('should generate secure session tokens', () => {
      const sessionToken = securityAuditor.generateSecureToken();

      expect(sessionToken).toBeDefined();
      expect(typeof sessionToken).toBe('string');
      expect(sessionToken.length).toBeGreaterThan(32);
      expect(sessionToken).toMatch(/^[a-zA-Z0-9_-]+$/);
    });

    it('should prevent session fixation attacks', () => {
      const sessionFixationAttempts = [
        { sessionId: 'PHPSESSID=admin123', action: 'login' },
        { sessionId: 'JSESSIONID=administrator', action: 'login' },
        { sessionId: 'ASP.NET_SessionId=admin', action: 'privilege_escalation' },
        { sessionId: 'session_id=../../etc/passwd', action: 'login' },
      ];

      sessionFixationAttempts.forEach(attempt => {
        const result = apiSecurityValidator.detectSessionFixation(attempt);
        expect(result.detected).toBe(true);
        expect(result.action).toContain('regenerate');
      });
    });

    it('should implement proper session timeout', () => {
      const sessionTests = [
        {
          createdAt: Date.now() - (25 * 60 * 60 * 1000), // 25 hours ago
          lastActivity: Date.now() - (2 * 60 * 60 * 1000), // 2 hours ago
          maxAge: 30 * 60 * 1000, // 30 minutes
          expected: false,
        },
        {
          createdAt: Date.now() - (10 * 60 * 1000), // 10 minutes ago
          lastActivity: Date.now() - (5 * 60 * 1000), // 5 minutes ago
          maxAge: 30 * 60 * 1000, // 30 minutes
          expected: true,
        },
      ];

      sessionTests.forEach(test => {
        const result = apiSecurityValidator.validateSessionTimeout({
          createdAt: test.createdAt,
          lastActivity: test.lastActivity,
          maxAge: test.maxAge,
        });

        expect(result.valid).toBe(test.expected);
      });
    });

    it('should detect session hijacking attempts', () => {
      const hijackingIndicators = [
        {
          currentIp: '192.168.1.100',
          sessionIp: '10.0.0.1',
          userAgent: 'Mozilla/5.0',
          sessionUserAgent: 'curl/7.68.0',
        },
        {
          currentIp: '203.0.113.1',
          sessionIp: '198.51.100.1',
          geolocation: 'US',
          sessionGeolocation: 'CN',
        },
        {
          currentIp: '192.168.1.100',
          sessionIp: '192.168.1.100',
          concurrentSessions: 5,
          maxConcurrent: 2,
        },
      ];

      hijackingIndicators.forEach(indicator => {
        const result = apiSecurityValidator.detectSessionHijacking(indicator);
        expect(result.suspicious).toBe(true);
        expect(result.riskScore).toBeGreaterThan(70);
      });
    });

    it('should implement secure session storage', () => {
      const sessionData = {
        userId: 'user123',
        email: 'user@test.com',
        role: 'user',
        sessionId: 'secure-session-123',
      };

      // Should not store sensitive data in plaintext
      const localStorageCheck = apiSecurityValidator.validateSecureStorage({
        data: sessionData,
        storageType: 'localStorage',
        sensitiveFields: ['email', 'sessionId'],
      });

      expect(localStorageCheck.secure).toBe(false);
      expect(localStorageCheck.issues).toContain('sensitive_data_in_storage');

      // Should use secure cookies for session data
      const cookieCheck = apiSecurityValidator.validateSecureStorage({
        data: sessionData,
        storageType: 'cookie',
        secure: true,
        httpOnly: true,
        sameSite: 'strict',
      });

      expect(cookieCheck.secure).toBe(true);
    });
  });

  describe('Password Security', () => {
    it('should enforce comprehensive password requirements', () => {
      const passwordTests = [
        {
          password: 'Password123!',
          expected: { minLength: true, uppercase: true, lowercase: true, numbers: true, symbols: true },
        },
        {
          password: 'weak',
          expected: { minLength: false, uppercase: false, lowercase: true, numbers: false, symbols: false },
        },
        {
          password: 'NOLOWERCASE123!',
          expected: { minLength: true, uppercase: true, lowercase: false, numbers: true, symbols: true },
        },
        {
          password: 'nouppercase123!',
          expected: { minLength: true, uppercase: false, lowercase: true, numbers: true, symbols: true },
        },
        {
          password: 'NoNumbers!',
          expected: { minLength: true, uppercase: true, lowercase: true, numbers: false, symbols: true },
        },
        {
          password: 'NoSymbols123',
          expected: { minLength: true, uppercase: true, lowercase: true, numbers: true, symbols: false },
        },
      ];

      passwordTests.forEach(test => {
        const result = apiSecurityValidator.validatePasswordRequirements(test.password);

        Object.entries(test.expected).forEach(([requirement, expected]) => {
          expect(result.requirements[requirement]).toBe(expected);
        });
      });
    });

    it('should prevent common password patterns', () => {
      const commonPasswords = [
        'Password123!',
        'Qwerty123!',
        'Admin123!',
        'Welcome123!',
        'Password1!',
        '12345678!',
        'Abcdef123!',
      ];

      commonPasswords.forEach(password => {
        const result = apiSecurityValidator.validatePasswordCommonality(password);
        expect(result.common).toBe(true);
        expect(result.score).toBeLessThan(30);
      });
    });

    it('should check password against breached databases', () => {
      const breachedPasswords = [
        'Password123!',
        'Qwerty123!',
        '12345678',
        'password',
      ];

      breachedPasswords.forEach(password => {
        const result = apiSecurityValidator.checkPasswordBreaches(password);
        expect(result.breached).toBe(true);
        expect(result.count).toBeGreaterThan(0);
      });
    });

    it('should implement secure password reset flow', () => {
      const resetFlowTests = [
        {
          step: 'request',
          email: 'user@test.com',
          expectedSecure: true,
        },
        {
          step: 'validate',
          token: 'secure-token-123',
          expectedSecure: true,
        },
        {
          step: 'reset',
          token: 'secure-token-123',
          newPassword: 'NewPassword123!',
          expectedSecure: true,
        },
        {
          step: 'reset',
          token: 'expired-token',
          newPassword: 'NewPassword123!',
          expectedSecure: false,
        },
      ];

      resetFlowTests.forEach(test => {
        const result = apiSecurityValidator.validatePasswordResetFlow(test);
        expect(result.secure).toBe(test.expectedSecure);
      });
    });
  });

  describe('Multi-Factor Authentication Security', () => {
    it('should validate TOTP implementation', () => {
      const totpTests = [
        {
          secret: 'JBSWY3DPEHPK3PXP', // Base32 encoded secret
          token: '123456',
          window: 1,
          expected: true,
        },
        {
          secret: 'invalid-secret',
          token: '123456',
          window: 1,
          expected: false,
        },
      ];

      totpTests.forEach(test => {
        const result = apiSecurityValidator.validateTOTP(test);
        expect(result.valid).toBe(test.expected);
      });
    });

    it('should implement secure backup codes', () => {
      const backupCodeTests = [
        {
          codes: ['12345678', '87654321', '11112222'],
          usedCodes: [],
          inputCode: '12345678',
          expected: { valid: true, remaining: 2 },
        },
        {
          codes: ['12345678', '87654321', '11112222'],
          usedCodes: ['12345678'],
          inputCode: '12345678',
          expected: { valid: false, reason: 'already_used' },
        },
        {
          codes: ['12345678', '87654321', '11112222'],
          usedCodes: [],
          inputCode: '99999999',
          expected: { valid: false, reason: 'invalid_code' },
        },
      ];

      backupCodeTests.forEach(test => {
        const result = apiSecurityValidator.validateBackupCode(test);
        expect(result.valid).toBe(test.expected.valid);
      });
    });

    it('should prevent MFA bypass attempts', () => {
      const bypassAttempts = [
        {
          method: 'skip_mfa',
          payload: { mfa_bypass: 'true' },
          expected: false,
        },
        {
          method: 'header_manipulation',
          headers: { 'X-MFA-Verified': 'true' },
          expected: false,
        },
        {
          method: 'parameter_pollution',
          params: { mfa: 'disabled', mfa: 'enabled' },
          expected: false,
        },
      ];

      bypassAttempts.forEach(attempt => {
        const result = apiSecurityValidator.detectMFABypass(attempt);
        expect(result.blocked).toBe(true);
        expect(result.reason).toContain('bypass');
      });
    });
  });

  describe('Authorization Security', () => {
    it('should enforce proper role-based access control', () => {
      const rbacTests = [
        {
          userRole: 'customer',
          requestedResource: 'admin_dashboard',
          requiredRole: 'admin',
          expected: false,
        },
        {
          userRole: 'admin',
          requestedResource: 'admin_dashboard',
          requiredRole: 'admin',
          expected: true,
        },
        {
          userRole: 'manager',
          requestedResource: 'user_profile',
          requiredRole: 'customer',
          expected: true, // Higher role can access lower role resources
        },
        {
          userRole: 'customer',
          requestedResource: 'admin_users',
          requiredRole: 'admin',
          expected: false,
        },
      ];

      rbacTests.forEach(test => {
        const result = apiSecurityValidator.validateRBAC({
          userRole: test.userRole,
          requestedResource: test.requestedResource,
          requiredRole: test.requiredRole,
        });

        expect(result.authorized).toBe(test.expected);
      });
    });

    it('should prevent privilege escalation attacks', () => {
      const escalationAttempts = [
        {
          currentRole: 'customer',
          targetRole: 'admin',
          method: 'direct_assignment',
        },
        {
          currentRole: 'user',
          targetRole: 'manager',
          method: 'role_parameter',
        },
        {
          currentRole: 'guest',
          targetRole: 'admin',
          method: 'header_injection',
        },
      ];

      escalationAttempts.forEach(attempt => {
        const result = apiSecurityValidator.detectPrivilegeEscalation(attempt);
        expect(result.blocked).toBe(true);
        expect(result.severity).toBe('high');
      });
    });

    it('should implement proper resource ownership validation', () => {
      const ownershipTests = [
        {
          userId: 'user123',
          resourceOwnerId: 'user123',
          action: 'read',
          expected: true,
        },
        {
          userId: 'user123',
          resourceOwnerId: 'user456',
          action: 'read',
          expected: false,
        },
        {
          userId: 'user123',
          resourceOwnerId: 'user123',
          action: 'delete',
          expected: true,
        },
        {
          userId: 'admin',
          resourceOwnerId: 'user456',
          action: 'read',
          expected: true, // Admin can access all resources
        },
      ];

      ownershipTests.forEach(test => {
        const result = apiSecurityValidator.validateResourceOwnership({
          userId: test.userId,
          resourceOwnerId: test.resourceOwnerId,
          action: test.action,
          userRole: test.userId === 'admin' ? 'admin' : 'customer',
        });

        expect(result.authorized).toBe(test.expected);
      });
    });

    it('should prevent Insecure Direct Object Reference (IDOR)', () => {
      const idorTests = [
        {
          userId: 'user123',
          requestedResource: '/api/users/user456/profile',
          expected: false,
        },
        {
          userId: 'user123',
          requestedResource: '/api/bookings/booking789',
          resourceOwnerId: 'user456',
          expected: false,
        },
        {
          userId: 'user123',
          requestedResource: '/api/files/user456/document.pdf',
          expected: false,
        },
        {
          userId: 'user123',
          requestedResource: '/api/users/user123/profile',
          expected: true,
        },
      ];

      idorTests.forEach(test => {
        const result = apiSecurityValidator.detectIDOR({
          userId: test.userId,
          requestedResource: test.requestedResource,
          resourceOwnerId: test.resourceOwnerId,
        });

        expect(result.authorized).toBe(test.expected);
      });
    });

    it('should validate authorization token integrity', () => {
      const tokenTests = [
        {
          token: 'valid.jwt.token',
          signature: 'valid',
          expected: true,
        },
        {
          token: 'manipulated.jwt.token',
          signature: 'invalid',
          expected: false,
        },
        {
          token: 'expired.jwt.token',
          signature: 'valid',
          expired: true,
          expected: false,
        },
      ];

      tokenTests.forEach(test => {
        const result = apiSecurityValidator.validateAuthToken(test);
        expect(result.valid).toBe(test.expected);
      });
    });
  });

  describe('API Authentication Security', () => {
    it('should implement secure API key management', () => {
      const apiKeyTests = [
        {
          apiKey: 'pk_live_valid_key_123456',
          keyType: 'publishable',
          usage: 'client_side',
          expected: true,
        },
        {
          apiKey: 'sk_live_secret_key_789012',
          keyType: 'secret',
          usage: 'server_side',
          expected: true,
        },
        {
          apiKey: 'invalid_key_format',
          keyType: 'unknown',
          usage: 'unknown',
          expected: false,
        },
      ];

      apiKeyTests.forEach(test => {
        const result = apiSecurityValidator.validateAPIKey({
          apiKey: test.apiKey,
          keyType: test.keyType,
          usage: test.usage,
        });

        expect(result.valid).toBe(test.expected);
      });
    });

    it('should prevent API key abuse', () => {
      const abuseTests = [
        {
          apiKey: 'pk_live_test_key',
          endpoint: '/api/admin/users',
          expectedUsage: 'public',
          actualUsage: 'admin',
          expected: false,
        },
        {
          apiKey: 'read_only_key',
          method: 'DELETE',
          endpoint: '/api/data/123',
          expected: false,
        },
      ];

      abuseTests.forEach(test => {
        const result = apiSecurityValidator.detectAPIKeyAbuse(test);
        expect(result.blocked).toBe(true);
        expect(result.violation).toBeDefined();
      });
    });

    it('should implement OAuth security best practices', () => {
      const oauthTests = [
        {
          provider: 'google',
          state: 'secure_state_123',
          codeVerifier: 'secure_verifier_456',
          expected: true,
        },
        {
          provider: 'google',
          state: null, // Missing state parameter
          codeVerifier: 'secure_verifier_456',
          expected: false,
        },
        {
          provider: 'facebook',
          redirectUri: 'https://app.com/callback',
          registeredUri: 'https://app.com/callback',
          expected: true,
        },
        {
          provider: 'facebook',
          redirectUri: 'https://evil.com/callback',
          registeredUri: 'https://app.com/callback',
          expected: false,
        },
      ];

      oauthTests.forEach(test => {
        const result = apiSecurityValidator.validateOAuthFlow(test);
        expect(result.secure).toBe(test.expected);
      });
    });
  });

  describe('Social Authentication Security', () => {
    it('should validate social authentication tokens', () => {
      const socialAuthTests = [
        {
          provider: 'google',
          token: 'valid_google_token',
          audience: 'your-app-client-id',
          expected: true,
        },
        {
          provider: 'google',
          token: 'expired_token',
          audience: 'your-app-client-id',
          expired: true,
          expected: false,
        },
        {
          provider: 'facebook',
          token: 'valid_facebook_token',
          appId: 'your-app-id',
          expected: true,
        },
      ];

      socialAuthTests.forEach(test => {
        const result = apiSecurityValidator.validateSocialToken(test);
        expect(result.valid).toBe(test.expected);
      });
    });

    it('should prevent social authentication enumeration', () => {
      const enumerationTests = [
        {
          email: 'existing@test.com',
          provider: 'google',
          response: 'account_exists',
          expected: 'ambiguous', // Should not reveal if account exists
        },
        {
          email: 'nonexistent@test.com',
          provider: 'google',
          response: 'no_account',
          expected: 'ambiguous', // Should not reveal if account exists
        },
      ];

      enumerationTests.forEach(test => {
        const result = apiSecurityValidator.preventAccountEnumeration(test);
        expect(result.secure).toBe(true);
        expect(result.response).toBe(test.expected);
      });
    });

    it('should handle social authentication securely', () => {
      const securityTests = [
        {
          scenario: 'profile_injection',
          profileData: { admin: true, role: 'administrator' },
          expected: false,
        },
        {
          scenario: 'email_verification',
          email: 'user@test.com',
          verified: false,
          requireVerification: true,
          expected: false,
        },
      ];

      securityTests.forEach(test => {
        const result = apiSecurityValidator.validateSocialAuthSecurity(test);
        if (test.expected !== undefined) {
          expect(result.secure).toBe(test.expected);
        }
      });
    });
  });

  describe('Authentication Logging and Monitoring', () => {
    it('should log all authentication events', () => {
      const authEvents = [
        {
          type: 'login',
          userId: 'user123',
          success: true,
          ip: '192.168.1.1',
          userAgent: 'Mozilla/5.0',
        },
        {
          type: 'login',
          userId: 'user123',
          success: false,
          ip: '192.168.1.1',
          reason: 'invalid_password',
        },
        {
          type: 'logout',
          userId: 'user123',
          success: true,
          ip: '192.168.1.1',
        },
      ];

      authEvents.forEach(event => {
        securityAuditor.logAuthenticationEvent(
          event.type,
          event.success,
          event.userId,
          event.ip,
          event.userAgent,
          event.reason
        );
      });

      const events = securityAuditor.getRecentEvents();
      expect(events.length).toBeGreaterThanOrEqual(3);
      expect(events.some(e => e.eventType === 'authentication_event')).toBe(true);
    });

    it('should detect authentication anomalies', () => {
      // Generate suspicious authentication patterns
      for (let i = 0; i < 6; i++) {
        securityAuditor.logAuthenticationEvent(
          'login',
          false,
          'admin@test.com',
          '192.168.1.100'
        );
      }

      const anomalies = securityAuditor.detectSecurityAnomalies();
      expect(anomalies.length).toBeGreaterThan(0);
      expect(anomalies[0].type).toBe('brute_force_attempt');
    });

    it('should generate security alerts for suspicious authentication', () => {
      const suspiciousAuth = {
        userId: 'admin@test.com',
        ip: '192.168.1.100',
        location: 'Unknown',
        device: 'New Device',
        time: '03:00 AM',
      };

      securityAuditor.logSecurityIncident(
        'suspicious_auth',
        'Unusual login pattern detected',
        'medium',
        suspiciousAuth.userId,
        suspiciousAuth.ip
      );

      const alerts = securityAuditor.getRecentEvents();
      expect(alerts.some(alert => alert.severity === 'medium')).toBe(true);
    });
  });
});