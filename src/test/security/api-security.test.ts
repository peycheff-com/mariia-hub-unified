/**
 * API Security Tests
 *
 * This test suite validates API security including authentication,
 * authorization, rate limiting, input validation, and protection
 * against common API attacks.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import React from 'react';

// Import security utilities
import apiSecurityValidator from '@/lib/api-security-validator';
import securityAuditor from '@/lib/security-audit';
import securityMonitoring from '@/lib/security-monitoring';

// Mock fetch for API testing
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('API Security Tests', () => {
  beforeEach(() => {
    vi.stubEnv('NODE_ENV', 'test');

    // Reset security monitoring
    securityMonitoring['metrics'] = securityMonitoring['initializeMetrics']();
    securityMonitoring['alerts'] = [];
    securityAuditor['events'] = [];

    // Mock fetch responses
    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ success: true }),
      headers: new Headers({
        'Content-Type': 'application/json',
      }),
    });

    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.clearAllMocks();
  });

  describe('API Authentication Security', () => {
    it('should validate API key authentication', () => {
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
        {
          apiKey: null,
          keyType: 'secret',
          usage: 'server_side',
          expected: false,
        },
        {
          apiKey: '',
          keyType: 'secret',
          usage: 'server_side',
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

    it('should prevent API key exposure', () => {
      const exposureTests = [
        {
          location: 'url_parameter',
          keyPresent: true,
          expected: false,
        },
        {
          location: 'client_side_javascript',
          keyType: 'secret',
          expected: false,
        },
        {
          location: 'git_repository',
          keyPresent: true,
          expected: false,
        },
        {
          location: 'server_side',
          keyType: 'secret',
          expected: true,
        },
      ];

      exposureTests.forEach(test => {
        const result = apiSecurityValidator.validateAPIKeyExposure(test);
        expect(result.secure).toBe(test.expected);
      });
    });

    it('should validate JWT tokens properly', () => {
      const jwtTests = [
        {
          token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c',
          valid: true,
        },
        {
          token: 'invalid.jwt.token',
          valid: false,
        },
        {
          token: 'expired.jwt.token',
          valid: false,
          expired: true,
        },
        {
          token: '',
          valid: false,
        },
      ];

      jwtTests.forEach(test => {
        const result = apiSecurityValidator.validateJWTToken(test.token);
        expect(result.valid).toBe(test.valid);
      });
    });

    it('should implement proper token rotation', () => {
      const rotationTests = [
        {
          currentToken: 'token-123',
          tokenAge: 50 * 60 * 1000, // 50 minutes old
          maxAge: 60 * 60 * 1000, // 1 hour max
          expected: false, // Don't rotate yet
        },
        {
          currentToken: 'token-123',
          tokenAge: 70 * 60 * 1000, // 70 minutes old
          maxAge: 60 * 60 * 1000, // 1 hour max
          expected: true, // Should rotate
        },
        {
          currentToken: 'token-123',
          tokenAge: 30 * 60 * 1000, // 30 minutes old
          usageCount: 100,
          maxUsage: 150,
          expected: false, // Don't rotate yet
        },
      ];

      rotationTests.forEach(test => {
        const result = apiSecurityValidator.shouldRotateToken({
          currentToken: test.currentToken,
          tokenAge: test.tokenAge,
          maxAge: test.maxAge,
          usageCount: test.usageCount || 0,
          maxUsage: test.maxUsage || 1000,
        });

        expect(result.rotate).toBe(test.expected);
      });
    });
  });

  describe('API Rate Limiting', () => {
    it('should implement proper rate limiting', () => {
      const rateLimitTests = [
        {
          clientId: 'client-123',
          endpoint: '/api/data',
          requestsInWindow: 5,
          windowSize: 60000, // 1 minute
          limit: 10,
          expected: true,
        },
        {
          clientId: 'client-123',
          endpoint: '/api/data',
          requestsInWindow: 15,
          windowSize: 60000, // 1 minute
          limit: 10,
          expected: false,
        },
        {
          clientId: 'client-456',
          endpoint: '/api/search',
          requestsInWindow: 100,
          windowSize: 60000, // 1 minute
          limit: 50,
          expected: false,
        },
      ];

      rateLimitTests.forEach(test => {
        // Simulate requests
        let allowedCount = 0;
        for (let i = 0; i < test.requestsInWindow; i++) {
          const result = apiSecurityValidator.checkRateLimit(test.clientId, test.endpoint, {
            windowSize: test.windowSize,
            limit: test.limit,
          });
          if (result.allowed) allowedCount++;
        }

        if (test.expected) {
          expect(allowedCount).toBe(test.requestsInWindow);
        } else {
          expect(allowedCount).toBeLessThan(test.requestsInWindow);
        }
      });
    });

    it('should implement progressive rate limiting', () => {
      const progressiveTests = [
        {
          violationCount: 1,
          expectedMultiplier: 1,
        },
        {
          violationCount: 5,
          expectedMultiplier: 2,
        },
        {
          violationCount: 10,
          expectedMultiplier: 4,
        },
        {
          violationCount: 20,
          expectedMultiplier: 8,
        },
      ];

      progressiveTests.forEach(test => {
        const result = apiSecurityValidator.calculateProgressiveLimit(test.violationCount, {
          baseLimit: 100,
          maxMultiplier: 10,
        });

        expect(result.multiplier).toBeGreaterThanOrEqual(test.expectedMultiplier);
      });
    });

    it('should handle distributed rate limiting', () => {
      const distributedTests = [
        {
          clientId: 'user-123',
          nodeCount: 1,
          totalRequests: 10,
          limit: 15,
          expected: true,
        },
        {
          clientId: 'user-123',
          nodeCount: 3,
          totalRequests: 30,
          limit: 15,
          expected: false, // 30 requests across 3 nodes exceeds limit
        },
      ];

      distributedTests.forEach(test => {
        const result = apiSecurityValidator.checkDistributedRateLimit({
          clientId: test.clientId,
          nodeCount: test.nodeCount,
          totalRequests: test.totalRequests,
          limit: test.limit,
        });

        expect(result.allowed).toBe(test.expected);
      });
    });
  });

  describe('API Authorization and RBAC', () => {
    it('should validate role-based access control', () => {
      const rbacTests = [
        {
          userRole: 'customer',
          endpoint: '/api/user/profile',
          method: 'GET',
          requiredRole: 'customer',
          expected: true,
        },
        {
          userRole: 'customer',
          endpoint: '/api/admin/users',
          method: 'GET',
          requiredRole: 'admin',
          expected: false,
        },
        {
          userRole: 'admin',
          endpoint: '/api/user/profile',
          method: 'GET',
          requiredRole: 'customer',
          expected: true, // Admin can access lower role resources
        },
        {
          userRole: 'manager',
          endpoint: '/api/reports/sales',
          method: 'GET',
          requiredRole: 'admin',
          expected: false,
        },
      ];

      rbacTests.forEach(test => {
        const result = apiSecurityValidator.validateAPIAccess({
          userRole: test.userRole,
          endpoint: test.endpoint,
          method: test.method,
          requiredRole: test.requiredRole,
        });

        expect(result.authorized).toBe(test.expected);
      });
    });

    it('should validate resource ownership', () => {
      const ownershipTests = [
        {
          userId: 'user-123',
          resourceOwnerId: 'user-123',
          endpoint: '/api/bookings/booking-456',
          method: 'GET',
          expected: true,
        },
        {
          userId: 'user-123',
          resourceOwnerId: 'user-456',
          endpoint: '/api/bookings/booking-789',
          method: 'GET',
          expected: false,
        },
        {
          userId: 'admin',
          resourceOwnerId: 'user-456',
          endpoint: '/api/bookings/booking-789',
          method: 'GET',
          expected: true, // Admin can access all resources
        },
      ];

      ownershipTests.forEach(test => {
        const result = apiSecurityValidator.validateResourceOwnership({
          userId: test.userId,
          resourceOwnerId: test.resourceOwnerId,
          endpoint: test.endpoint,
          method: test.method,
          userRole: test.userId === 'admin' ? 'admin' : 'customer',
        });

        expect(result.authorized).toBe(test.expected);
      });
    });

    it('should implement attribute-based access control (ABAC)', () => {
      const abacTests = [
        {
          user: {
            id: 'user-123',
            role: 'customer',
            department: 'sales',
            location: 'US',
          },
          resource: {
            type: 'booking',
            owner: 'user-123',
            sensitivity: 'public',
            location: 'US',
          },
          action: 'read',
          expected: true,
        },
        {
          user: {
            id: 'user-123',
            role: 'customer',
            department: 'sales',
            location: 'US',
          },
          resource: {
            type: 'financial_report',
            owner: 'user-456',
            sensitivity: 'confidential',
            location: 'EU',
          },
          action: 'read',
          expected: false,
        },
      ];

      abacTests.forEach(test => {
        const result = apiSecurityValidator.validateABAC({
          user: test.user,
          resource: test.resource,
          action: test.action,
        });

        expect(result.authorized).toBe(test.expected);
      });
    });
  });

  describe('API Input Validation', () => {
    it('should validate API request parameters', () => {
      const paramTests = [
        {
          params: { id: '123', name: 'John', active: 'true' },
          schema: {
            id: { type: 'integer', required: true },
            name: { type: 'string', maxLength: 50 },
            active: { type: 'boolean' },
          },
          expected: true,
        },
        {
          params: { id: "'; DROP TABLE users; --", name: 'John' },
          schema: {
            id: { type: 'integer', required: true },
            name: { type: 'string', maxLength: 50 },
          },
          expected: false,
        },
        {
          params: { name: '<script>alert(1)</script>' },
          schema: {
            name: { type: 'string', maxLength: 50 },
          },
          expected: false,
        },
      ];

      paramTests.forEach(test => {
        const result = apiSecurityValidator.validateAPIParams(test.params, test.schema);
        expect(result.valid).toBe(test.expected);
      });
    });

    it('should validate request body content', () => {
      const bodyTests = [
        {
          body: { email: 'user@example.com', password: 'SecurePass123!' },
          contentType: 'application/json',
          maxSize: 1024 * 1024, // 1MB
          expected: true,
        },
        {
          body: { email: 'user@example.com', password: 'password' },
          contentType: 'application/json',
          maxSize: 1024 * 1024,
          expected: false, // Weak password
        },
        {
          body: 'A'.repeat(2 * 1024 * 1024), // 2MB
          contentType: 'application/json',
          maxSize: 1024 * 1024, // 1MB limit
          expected: false, // Too large
        },
      ];

      bodyTests.forEach(test => {
        const result = apiSecurityValidator.validateRequestBody(test.body, {
          contentType: test.contentType,
          maxSize: test.maxSize,
        });

        expect(result.valid).toBe(test.expected);
      });
    });

    it('should validate file uploads in APIs', () => {
      const fileUploadTests = [
        {
          file: {
            name: 'document.pdf',
            type: 'application/pdf',
            size: 1024 * 1024, // 1MB
          },
          allowedTypes: ['application/pdf', 'image/jpeg'],
          maxSize: 5 * 1024 * 1024, // 5MB
          expected: true,
        },
        {
          file: {
            name: 'script.js',
            type: 'application/javascript',
            size: 1024,
          },
          allowedTypes: ['application/pdf', 'image/jpeg'],
          maxSize: 5 * 1024 * 1024,
          expected: false, // Invalid file type
        },
        {
          file: {
            name: 'large.pdf',
            type: 'application/pdf',
            size: 10 * 1024 * 1024, // 10MB
          },
          allowedTypes: ['application/pdf', 'image/jpeg'],
          maxSize: 5 * 1024 * 1024, // 5MB
          expected: false, // Too large
        },
      ];

      fileUploadTests.forEach(test => {
        const result = apiSecurityValidator.validateAPIFileUpload(test.file, {
          allowedTypes: test.allowedTypes,
          maxSize: test.maxSize,
        });

        expect(result.allowed).toBe(test.expected);
      });
    });
  });

  describe('API Response Security', () => {
    it('should prevent information leakage in responses', () => {
      const responseTests = [
        {
          data: {
            user: {
              id: 'user-123',
              email: 'user@example.com',
              password: 'hashed_password', // Should not be included
              internalId: 'internal-456', // Should not be included
            },
          },
          userRole: 'customer',
          requestingUserId: 'user-123',
          expectedSafe: ['id', 'email'],
          expectedUnsafe: ['password', 'internalId'],
        },
        {
          data: {
            error: {
              message: 'Invalid credentials',
              sql: 'SELECT * FROM users WHERE email = ?', // Should not include SQL
              stack: 'Error: ...', // Should not include stack trace
            },
          },
          userRole: 'customer',
          expectedSafe: ['message'],
          expectedUnsafe: ['sql', 'stack'],
        },
      ];

      responseTests.forEach(test => {
        const result = apiSecurityValidator.sanitizeAPIResponse(test.data, {
          userRole: test.userRole,
          requestingUserId: test.requestingUserId,
        });

        test.expectedSafe.forEach(field => {
          expect(result.data).toHaveProperty(field);
        });

        test.expectedUnsafe.forEach(field => {
          expect(result.data).not.toHaveProperty(field);
        });
      });
    });

    it('should implement proper HTTP status codes', () => {
      const statusTests = [
        {
          scenario: 'unauthorized_access',
          expectedStatus: 401,
        },
        {
          scenario: 'forbidden_access',
          expectedStatus: 403,
        },
        {
          scenario: 'not_found',
          expectedStatus: 404,
        },
        {
          scenario: 'rate_limit_exceeded',
          expectedStatus: 429,
        },
        {
          scenario: 'server_error',
          expectedStatus: 500,
        },
      ];

      statusTests.forEach(test => {
        const result = apiSecurityValidator.getHTTPStatusForScenario(test.scenario);
        expect(result.status).toBe(test.expectedStatus);
      });
    });

    it('should prevent API response injection', () => {
      const injectionTests = [
        {
          data: { message: 'Success<script>alert(1)</script>' },
          contentType: 'application/json',
          expected: 'sanitized',
        },
        {
          data: { redirect: 'javascript:alert(1)' },
          contentType: 'application/json',
          expected: 'sanitized',
        },
        {
          data: { url: 'data:text/html,<script>alert(1)</script>' },
          contentType: 'application/json',
          expected: 'sanitized',
        },
      ];

      injectionTests.forEach(test => {
        const result = apiSecurityValidator.sanitizeAPIResponse(test.data, {
          contentType: test.contentType,
        });

        // Check that dangerous content is removed or encoded
        const responseString = JSON.stringify(result.data);
        expect(responseString).not.toContain('<script>');
        expect(responseString).not.toContain('javascript:');
      });
    });
  });

  describe('API Attack Prevention', () => {
    it('should prevent HTTP parameter pollution', () => {
      const pollutionTests = [
        {
          params: { id: ['123', '456', '789'] },
          endpoint: '/api/users',
          expected: false,
        },
        {
          params: { action: ['view', 'delete'] },
          endpoint: '/api/data',
          expected: false,
        },
        {
          params: { user: ['admin', 'guest'] },
          endpoint: '/api/permissions',
          expected: false,
        },
      ];

      pollutionTests.forEach(test => {
        const result = apiSecurityValidator.detectParameterPollution(test.params);
        expect(result.detected).toBe(true);
        expect(result.action).toContain('reject');
      });
    });

    it('should prevent mass assignment attacks', () => {
      const massAssignmentTests = [
        {
          data: {
            name: 'John',
            email: 'john@example.com',
            role: 'admin', // Should not be assignable
            isAdmin: true, // Should not be assignable
            verified: true, // Should not be assignable
          },
          model: 'user',
          expected: false,
        },
        {
          data: {
            title: 'Service Booking',
            status: 'confirmed', // Should not be assignable
            paymentStatus: 'paid', // Should not be assignable
          },
          model: 'booking',
          expected: false,
        },
      ];

      massAssignmentTests.forEach(test => {
        const result = apiSecurityValidator.detectMassAssignment({
          data: test.data,
          model: test.model,
        });

        expect(result.detected).toBe(true);
        expect(result.blockedFields.length).toBeGreaterThan(0);
      });
    });

    it('should prevent API enumeration attacks', () => {
      const enumerationTests = [
        {
          patterns: ['/api/users/1', '/api/users/2', '/api/users/3'],
          expected: 'sequential_enumeration',
        },
        {
          patterns: ['/api/orders/100', '/api/orders/101', '/api/orders/102'],
          expected: 'sequential_enumeration',
        },
        {
          patterns: ['/api/files/doc1.pdf', '/api/files/doc2.pdf', '/api/files/doc3.pdf'],
          expected: 'pattern_enumeration',
        },
      ];

      enumerationTests.forEach(test => {
        const result = apiSecurityValidator.detectEnumerationAttack({
          pattern: test.pattern,
          threshold: 3,
        });

        expect(result.detected).toBe(true);
        expect(result.type).toBe(test.expected);
      });
    });

    it('should prevent API abuse and scraping', () => {
      const abuseTests = [
        {
          requests: Array(100).fill(null).map((_, i) => ({
            endpoint: '/api/products',
            method: 'GET',
            timestamp: Date.now() + i * 100,
            ip: '192.168.1.100',
          })),
          expected: 'scraping_detected',
        },
        {
          requests: Array(50).fill(null).map((_, i) => ({
            endpoint: '/api/search',
            method: 'POST',
            timestamp: Date.now() + i * 50,
            ip: '192.168.1.100',
            userAgent: 'scraper-bot/1.0',
          })),
          expected: 'bot_activity_detected',
        },
      ];

      abuseTests.forEach(test => {
        test.requests.forEach(request => {
          securityMonitoring.recordRequest(request.endpoint, request.method, request.ip, request.userAgent);
        });

        const result = apiSecurityValidator.detectAPIAbuse({
          requests: test.requests,
          timeWindow: 60000, // 1 minute
        });

        expect(result.detected).toBe(true);
        expect(result.type).toBe(test.expected);
      });
    });
  });

  describe('API Versioning Security', () => {
    it('should validate API version access', () => {
      const versionTests = [
        {
          requestedVersion: 'v1',
          clientSupportedVersions: ['v1', 'v2'],
          serverSupportedVersions: ['v1', 'v2', 'v3'],
          expected: true,
        },
        {
          requestedVersion: 'v3',
          clientSupportedVersions: ['v1', 'v2'],
          serverSupportedVersions: ['v1', 'v2', 'v3'],
          expected: false, // Client doesn't support v3
        },
        {
          requestedVersion: 'v4',
          clientSupportedVersions: ['v1', 'v2'],
          serverSupportedVersions: ['v1', 'v2', 'v3'],
          expected: false, // Server doesn't support v4
        },
      ];

      versionTests.forEach(test => {
        const result = apiSecurityValidator.validateAPIVersion({
          requestedVersion: test.requestedVersion,
          clientSupportedVersions: test.clientSupportedVersions,
          serverSupportedVersions: test.serverSupportedVersions,
        });

        expect(result.supported).toBe(test.expected);
      });
    });

    it('should handle deprecated API versions', () => {
      const deprecationTests = [
        {
          version: 'v1',
          deprecated: true,
          sunsetDate: Date.now() - (30 * 24 * 60 * 60 * 1000), // 30 days ago
          expected: 'blocked',
        },
        {
          version: 'v2',
          deprecated: true,
          sunsetDate: Date.now() + (30 * 24 * 60 * 60 * 1000), // 30 days from now
          expected: 'warning',
        },
        {
          version: 'v3',
          deprecated: false,
          expected: 'allowed',
        },
      ];

      deprecationTests.forEach(test => {
        const result = apiSecurityValidator.handleDeprecatedAPIVersion({
          version: test.version,
          deprecated: test.deprecated,
          sunsetDate: test.sunsetDate,
        });

        expect(result.action).toBe(test.expected);
      });
    });
  });

  describe('API Documentation Security', () => {
    it('should prevent sensitive information in API docs', () => {
      const docTests = [
        {
          documentation: {
            endpoint: '/api/users',
            description: 'Returns user information',
            parameters: [
              {
                name: 'api_key',
                description: 'Your secret API key (sk_live_123456)',
                required: true,
              },
            ],
          },
          expectedIssues: ['exposed_api_key'],
        },
        {
          documentation: {
            endpoint: '/api/admin/users',
            description: 'Admin endpoint for user management',
            examples: {
              curl: 'curl -H "Authorization: Bearer admin_token_123" /api/admin/users',
            },
          },
          expectedIssues: ['exposed_admin_token'],
        },
      ];

      docTests.forEach(test => {
        const result = apiSecurityValidator.validateAPIDocumentation(test.documentation);
        expect(result.issues).toEqual(expect.arrayContaining(test.expectedIssues));
      });
    });

    it('should validate public API documentation', () => {
      const publicDocTests = [
        {
          endpoint: '/api/public/products',
          includeInPublicDocs: true,
          authenticationRequired: false,
          expected: true,
        },
        {
          endpoint: '/api/admin/users',
          includeInPublicDocs: true,
          authenticationRequired: true,
          expected: false, // Should not be in public docs
        },
        {
          endpoint: '/api/internal/process',
          includeInPublicDocs: false,
          authenticationRequired: true,
          expected: true, // Correctly excluded from public docs
        },
      ];

      publicDocTests.forEach(test => {
        const result = apiSecurityValidator.validatePublicAPIDocumentation({
          endpoint: test.endpoint,
          includeInPublicDocs: test.includeInPublicDocs,
          authenticationRequired: test.authenticationRequired,
        });

        expect(result.appropriate).toBe(test.expected);
      });
    });
  });

  describe('API Monitoring and Logging', () => {
    it('should log all API security events', () => {
      const securityEvents = [
        {
          type: 'authentication_failure',
          endpoint: '/api/login',
          ip: '192.168.1.100',
          details: { reason: 'invalid_token' },
        },
        {
          type: 'authorization_failure',
          endpoint: '/api/admin/users',
          ip: '192.168.1.100',
          details: { reason: 'insufficient_privileges' },
        },
        {
          type: 'rate_limit_exceeded',
          endpoint: '/api/data',
          ip: '192.168.1.100',
          details: { requests: 100, limit: 50 },
        },
      ];

      securityEvents.forEach(event => {
        securityAuditor.logAPISecurityEvent(event);
      });

      const events = securityAuditor.getRecentEvents();
      expect(events.filter(e => e.eventType === 'api_security_event')).toHaveLength(3);
    });

    it('should detect API attack patterns', () => {
      // Simulate attack pattern
      for (let i = 0; i < 20; i++) {
        securityMonitoring.recordRequest('/api/../etc/passwd', 'GET', '192.168.1.100');
      }

      const alerts = securityMonitoring.getSecurityAlerts();
      expect(alerts.some(alert => alert.type === 'path_traversal_attempt')).toBe(true);
    });

    it('should provide API security metrics', () => {
      const metrics = securityMonitoring.getAPISecurityMetrics();

      expect(metrics).toBeDefined();
      expect(typeof metrics.totalRequests).toBe('number');
      expect(typeof metrics.authenticatedRequests).toBe('number');
      expect(typeof metrics.blockedRequests).toBe('number');
      expect(typeof metrics.rateLimitedRequests).toBe('number');
    });

    it('should generate API security reports', () => {
      const report = securityAuditor.generateAPISecurityReport({
        startDate: Date.now() - (24 * 60 * 60 * 1000), // 24 hours ago
        endDate: Date.now(),
      });

      expect(report).toBeDefined();
      expect(report.period).toBeDefined();
      expect(report.metrics).toBeDefined();
      expect(report.incidents).toBeDefined();
      expect(report.recommendations).toBeDefined();
    });
  });

  describe('API Performance vs Security', () => {
    it('should validate security overhead is acceptable', () => {
      const performanceTests = [
        {
          operation: 'token_validation',
          iterations: 1000,
          maxTime: 100, // 100ms
        },
        {
          operation: 'input_validation',
          iterations: 1000,
          maxTime: 200, // 200ms
        },
        {
          operation: 'rate_limit_check',
          iterations: 1000,
          maxTime: 50, // 50ms
        },
      ];

      performanceTests.forEach(test => {
        const startTime = performance.now();

        for (let i = 0; i < test.iterations; i++) {
          switch (test.operation) {
            case 'token_validation':
              apiSecurityValidator.validateJWTToken('test.token');
              break;
            case 'input_validation':
              apiSecurityValidator.validateInput('test input', 'string');
              break;
            case 'rate_limit_check':
              apiSecurityValidator.checkRateLimit('client-123', '/api/test');
              break;
          }
        }

        const endTime = performance.now();
        const duration = endTime - startTime;

        expect(duration).toBeLessThan(test.maxTime);
      });
    });

    it('should implement caching for security validations', () => {
      const cacheTests = [
        {
          operation: 'jwt_validation',
          cacheable: true,
          expectedCacheHit: true,
        },
        {
          operation: 'rate_limit_check',
          cacheable: false,
          expectedCacheHit: false,
        },
      ];

      cacheTests.forEach(test => {
        const result = apiSecurityValidator.shouldCacheSecurityValidation(test.operation);
        expect(result.cacheable).toBe(test.expectedCacheHit);
      });
    });
  });

  describe('API Integration Security', () => {
    it('should validate third-party API integrations', () => {
      const integrationTests = [
        {
          provider: 'stripe',
          endpoint: 'https://api.stripe.com/v1/charges',
          credentials: {
            apiKey: 'sk_test_123',
            secret: 'test_secret',
          },
          expected: true,
        },
        {
          provider: 'supabase',
          endpoint: 'https://test-project.supabase.co/rest/v1/users',
          credentials: {
            apiKey: 'public_key',
            serviceKey: 'service_key',
          },
          expected: true,
        },
        {
          provider: 'unknown',
          endpoint: 'https://untrusted-api.com/data',
          credentials: {
            apiKey: 'key',
          },
          expected: false,
        },
      ];

      integrationTests.forEach(test => {
        const result = apiSecurityValidator.validateThirdPartyIntegration(test);
        expect(result.secure).toBe(test.expected);
      });
    });

    it('should implement secure API gateway patterns', () => {
      const gatewayTests = [
        {
          pattern: 'authentication_gateway',
          implementation: 'jwt_validation',
          expected: true,
        },
        {
          pattern: 'rate_limiting_gateway',
          implementation: 'token_bucket',
          expected: true,
        },
        {
          pattern: 'authorization_gateway',
          implementation: 'rbac_check',
          expected: true,
        },
        {
          pattern: 'logging_gateway',
          implementation: 'structured_logs',
          expected: true,
        },
      ];

      gatewayTests.forEach(test => {
        const result = apiSecurityValidator.validateAPIGatewayPattern(test);
        expect(result.implemented).toBe(true);
      });
    });
  });

  describe('API Compliance and Standards', () => {
    it('should comply with OWASP API Security Top 10', () => {
      const owaspTests = [
        {
          risk: 'BOLA (Broken Object Level Authorization)',
          mitigation: 'proper_ownership_validation',
          implemented: true,
        },
        {
          risk: 'Broken Authentication',
          mitigation: 'strong_token_validation',
          implemented: true,
        },
        {
          risk: 'Excessive Data Exposure',
          mitigation: 'response_sanitization',
          implemented: true,
        },
        {
          risk: 'Lack of Resources & Rate Limiting',
          mitigation: 'rate_limiting',
          implemented: true,
        },
        {
          risk: 'Security Misconfiguration',
          mitigation: 'secure_headers',
          implemented: true,
        },
      ];

      owaspTests.forEach(test => {
        const result = apiSecurityValidator.validateOWASPAPISecurity(test.risk, test.mitigation);
        expect(result.implemented).toBe(test.implemented);
      });
    });

    it('should validate API standards compliance', () => {
      const standardsTests = [
        {
          standard: 'REST',
          requirements: ['proper_http_methods', 'status_codes', 'content_types'],
          implemented: true,
        },
        {
          standard: 'JSON:API',
          requirements: ['proper_content_type', 'error_format', 'pagination'],
          implemented: true,
        },
        {
          standard: 'OpenAPI',
          requirements: ['documentation', 'schema_validation', 'versioning'],
          implemented: true,
        },
      ];

      standardsTests.forEach(test => {
        const result = apiSecurityValidator.validateAPIStandard(test.standard, test.requirements);
        expect(result.compliant).toBe(test.implemented);
      });
    });
  });
});