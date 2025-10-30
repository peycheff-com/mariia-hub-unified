/**
 * Web Application Firewall (WAF) System
 *
 * Comprehensive WAF implementation for protection against common web attacks
 * including SQL injection, XSS, CSRF, file upload security, and input validation.
 */

import { Context, Next } from 'hono';
import { productionSecurityConfig } from '../config/production-security';

interface WAFRule {
  name: string;
  description: string;
  pattern: RegExp;
  action: 'allow' | 'block' | 'log' | 'challenge';
  priority: number;
  category: 'sql-injection' | 'xss' | 'csrf' | 'file-upload' | 'input-validation' |
           'path-traversal' | 'command-injection' | 'ldap-injection' | 'xml-injection' |
           'http-response-splitting' | 'custom';
  severity: 'low' | 'medium' | 'high' | 'critical';
  enabled: boolean;
}

interface WAFViolation {
  timestamp: number;
  ip: string;
  userAgent: string;
  method: string;
  path: string;
  headers: Record<string, string>;
  body?: string;
  rule: WAFRule;
  matchedPattern: string;
  action: string;
  blocked: boolean;
}

interface InputValidationRule {
  field: string;
  type: 'string' | 'number' | 'email' | 'url' | 'phone' | 'date' | 'boolean';
  required: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  sanitize: boolean;
  allowedValues?: string[];
  customValidator?: (value: any) => boolean;
}

class WebApplicationFirewall {
  private rules: WAFRule[] = [];
  private violations: WAFViolation[] = [];
  private inputValidationRules: Map<string, InputValidationRule[]> = new Map();
  private csrfTokens: Map<string, { token: string; expires: number }> = new Map();
  private readonly config = productionSecurityConfig.waf;

  constructor() {
    this.initializeDefaultRules();
    this.initializeInputValidation();
  }

  /**
   * Main WAF middleware
   */
  async middleware(c: Context, next: Next): Promise<void> {
    const ip = this.getClientIP(c);
    const userAgent = c.req.header('User-Agent') || '';
    const method = c.req.method;
    const path = c.req.path;
    const headers = Object.fromEntries(c.req.header());

    // Get request body for applicable methods
    let body: string | undefined;
    if (['POST', 'PUT', 'PATCH'].includes(method)) {
      try {
        body = await c.req.text();
        // Restore the body for downstream handlers
        c.req.bodyCache = { body };
      } catch (error) {
        // If we can't read the body, continue anyway
      }
    }

    // Check all WAF rules
    const violations: WAFViolation[] = [];

    for (const rule of this.rules) {
      if (!rule.enabled) continue;

      const violation = await this.checkRule(rule, c, ip, userAgent, method, path, headers, body);
      if (violation) {
        violations.push(violation);

        // Take action based on rule priority and severity
        if (rule.action === 'block' || (rule.action === 'challenge' && rule.severity === 'critical')) {
          await this.handleViolation(c, violation);
          return;
        }
      }
    }

    // Input validation
    if (body && method !== 'GET') {
      const inputViolations = await this.validateInput(c, body, path);
      violations.push(...inputViolations);
    }

    // CSRF protection for state-changing requests
    if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(method)) {
      const csrfViolation = await this.checkCSRF(c);
      if (csrfViolation) {
        violations.push(csrfViolation);
        await this.handleViolation(c, csrfViolation);
        return;
      }
    }

    // File upload security
    if (path.includes('/upload') || headers['content-type']?.includes('multipart/form-data')) {
      const fileViolations = await this.checkFileUpload(c);
      violations.push(...fileViolations);

      if (fileViolations.some(v => v.rule.severity === 'critical' || v.rule.severity === 'high')) {
        await this.handleViolation(c, fileViolations[0]);
        return;
      }
    }

    // Log all violations
    violations.forEach(violation => this.logViolation(violation));

    // Add security headers
    this.addSecurityHeaders(c);

    // Continue with request
    await next();
  }

  /**
   * Initialize default WAF rules
   */
  private initializeDefaultRules(): void {
    // SQL Injection Protection
    this.addRule({
      name: 'SQL Injection - SELECT',
      description: 'Detects SQL SELECT injection attempts',
      pattern: /(\bSELECT\b.*\bFROM\b)|(\bUNION\b.*\bSELECT\b)/i,
      action: 'block',
      priority: 1,
      category: 'sql-injection',
      severity: 'critical',
      enabled: true
    });

    this.addRule({
      name: 'SQL Injection - INSERT',
      description: 'Detects SQL INSERT injection attempts',
      pattern: /(\bINSERT\b.*\bINTO\b)/i,
      action: 'block',
      priority: 1,
      category: 'sql-injection',
      severity: 'critical',
      enabled: true
    });

    this.addRule({
      name: 'SQL Injection - UPDATE',
      description: 'Detects SQL UPDATE injection attempts',
      pattern: /(\bUPDATE\b.*\bSET\b)/i,
      action: 'block',
      priority: 1,
      category: 'sql-injection',
      severity: 'critical',
      enabled: true
    });

    this.addRule({
      name: 'SQL Injection - DELETE',
      description: 'Detects SQL DELETE injection attempts',
      pattern: /(\bDELETE\b.*\bFROM\b)/i,
      action: 'block',
      priority: 1,
      category: 'sql-injection',
      severity: 'critical',
      enabled: true
    });

    this.addRule({
      name: 'SQL Injection - DROP',
      description: 'Detects SQL DROP injection attempts',
      pattern: /(\bDROP\b.*\bTABLE\b)|(\bDROP\b.*\bDATABASE\b)/i,
      action: 'block',
      priority: 1,
      category: 'sql-injection',
      severity: 'critical',
      enabled: true
    });

    this.addRule({
      name: 'SQL Injection - EXEC',
      description: 'Detects SQL EXEC injection attempts',
      pattern: /(\bEXEC\b\s*\()|(\bEXECUTE\b\s*\()/i,
      action: 'block',
      priority: 1,
      category: 'sql-injection',
      severity: 'critical',
      enabled: true
    });

    // XSS Protection
    this.addRule({
      name: 'XSS - Script Tag',
      description: 'Detects script tag injection',
      pattern: /<script[^>]*>.*?<\/script>/gi,
      action: 'block',
      priority: 2,
      category: 'xss',
      severity: 'high',
      enabled: true
    });

    this.addRule({
      name: 'XSS - JavaScript Protocol',
      description: 'Detects javascript: protocol',
      pattern: /javascript:/gi,
      action: 'block',
      priority: 2,
      category: 'xss',
      severity: 'high',
      enabled: true
    });

    this.addRule({
      name: 'XSS - OnEvent Handler',
      description: 'Detects on* event handlers',
      pattern: /on\w+\s*=\s*["']?[^"'\s>]+/gi,
      action: 'block',
      priority: 2,
      category: 'xss',
      severity: 'medium',
      enabled: true
    });

    this.addRule({
      name: 'XSS - Iframe',
      description: 'Detects iframe injection',
      pattern: /<iframe[^>]*>/gi,
      action: 'block',
      priority: 2,
      category: 'xss',
      severity: 'medium',
      enabled: true
    });

    // Path Traversal
    this.addRule({
      name: 'Path Traversal',
      description: 'Detects path traversal attempts',
      pattern: /(\.\.[\/\\])|(%2e%2e[\/\\])/i,
      action: 'block',
      priority: 1,
      category: 'path-traversal',
      severity: 'high',
      enabled: true
    });

    // Command Injection
    this.addRule({
      name: 'Command Injection',
      description: 'Detects command injection attempts',
      pattern: /(;|\||&|\$\(|\`|\$\{)[^a-zA-Z\s]/i,
      action: 'block',
      priority: 1,
      category: 'command-injection',
      severity: 'critical',
      enabled: true
    });

    // HTTP Response Splitting
    this.addRule({
      name: 'HTTP Response Splitting',
      description: 'Detects HTTP response splitting attempts',
      pattern: /(\r\n|\n|%0d%0a|%0a%0d)/i,
      action: 'block',
      priority: 1,
      category: 'http-response-splitting',
      severity: 'high',
      enabled: true
    });

    // XML Injection
    this.addRule({
      name: 'XML Injection',
      description: 'Detects XML injection attempts',
      pattern: /<!ENTITY[^>]*>|<!DOCTYPE[^>]*>/i,
      action: 'block',
      priority: 2,
      category: 'xml-injection',
      severity: 'medium',
      enabled: true
    });

    // LDAP Injection
    this.addRule({
      name: 'LDAP Injection',
      description: 'Detects LDAP injection attempts',
      pattern: /(\*)|(\()|(\))|(&)|(\\)/i,
      action: 'challenge',
      priority: 3,
      category: 'ldap-injection',
      severity: 'medium',
      enabled: true
    });

    // Suspicious User Agents
    this.addRule({
      name: 'Suspicious User Agent',
      description: 'Detects known malicious user agents',
      pattern: /(sqlmap|nikto|nmap|dirb|gobuster|wpscan|nessus|openvas|burp|zap|acunetix|masscan|zmap|shodan|censys|scrapy)/i,
      action: 'block',
      priority: 1,
      category: 'custom',
      severity: 'high',
      enabled: true
    });

    // Common Attack Patterns
    this.addRule({
      name: 'Common Attack Patterns',
      description: 'Detects common web attack patterns',
      pattern: /(\/admin|\/wp-admin|\/wp-login|\/\.env|\/config|\/backup|\/database|\/phpmyadmin|\/test)/i,
      action: 'challenge',
      priority: 2,
      category: 'custom',
      severity: 'medium',
      enabled: true
    });

    // Add custom rules from configuration
    this.config.customRules.forEach(customRule => {
      this.addRule({
        name: customRule.name,
        description: `Custom rule: ${customRule.name}`,
        pattern: customRule.pattern,
        action: customRule.action,
        priority: customRule.priority,
        category: 'custom',
        severity: 'medium',
        enabled: true
      });
    });
  }

  /**
   * Initialize input validation rules
   */
  private initializeInputValidation(): void {
    // Booking form validation
    this.addInputValidationRules('/api/booking', [
      {
        field: 'serviceId',
        type: 'string',
        required: true,
        minLength: 1,
        maxLength: 100,
        sanitize: true,
        pattern: /^[a-zA-Z0-9\-_]+$/
      },
      {
        field: 'dateTime',
        type: 'string',
        required: true,
        pattern: /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z$/,
        sanitize: true
      },
      {
        field: 'customerName',
        type: 'string',
        required: true,
        minLength: 2,
        maxLength: 100,
        sanitize: true,
        pattern: /^[a-zA-Z\s\-']+$/
      },
      {
        field: 'customerEmail',
        type: 'email',
        required: true,
        maxLength: 255,
        sanitize: true
      },
      {
        field: 'customerPhone',
        type: 'phone',
        required: true,
        pattern: /^\+?[0-9\s\-\(\)]+$/,
        maxLength: 20,
        sanitize: true
      }
    ]);

    // Contact form validation
    this.addInputValidationRules('/api/contact', [
      {
        field: 'name',
        type: 'string',
        required: true,
        minLength: 2,
        maxLength: 100,
        sanitize: true,
        pattern: /^[a-zA-Z\s\-']+$/
      },
      {
        field: 'email',
        type: 'email',
        required: true,
        maxLength: 255,
        sanitize: true
      },
      {
        field: 'message',
        type: 'string',
        required: true,
        minLength: 10,
        maxLength: 2000,
        sanitize: true
      }
    ]);

    // Review form validation
    this.addInputValidationRules('/api/reviews', [
      {
        field: 'rating',
        type: 'number',
        required: true,
        customValidator: (value) => Number(value) >= 1 && Number(value) <= 5
      },
      {
        field: 'comment',
        type: 'string',
        required: false,
        maxLength: 1000,
        sanitize: true
      },
      {
        field: 'serviceId',
        type: 'string',
        required: true,
        maxLength: 100,
        sanitize: true,
        pattern: /^[a-zA-Z0-9\-_]+$/
      }
    ]);
  }

  /**
   * Check a specific WAF rule against the request
   */
  private async checkRule(
    rule: WAFRule,
    c: Context,
    ip: string,
    userAgent: string,
    method: string,
    path: string,
    headers: Record<string, string>,
    body?: string
  ): Promise<WAFViolation | null> {
    const testTargets = [
      path,
      userAgent,
      ...Object.values(headers),
      body || ''
    ];

    for (const target of testTargets) {
      if (rule.pattern.test(target)) {
        return {
          timestamp: Date.now(),
          ip,
          userAgent,
          method,
          path,
          headers,
          body,
          rule,
          matchedPattern: target.match(rule.pattern)?.[0] || '',
          action: rule.action,
          blocked: rule.action === 'block'
        };
      }
    }

    return null;
  }

  /**
   * Validate input data
   */
  private async validateInput(c: Context, body: string, path: string): Promise<WAFViolation[]> {
    const violations: WAFViolation[] = [];
    const rules = this.inputValidationRules.get(path) || this.inputValidationRules.get('*') || [];

    try {
      const data = JSON.parse(body);
      const ip = this.getClientIP(c);
      const userAgent = c.req.header('User-Agent') || '';
      const method = c.req.method;
      const headers = Object.fromEntries(c.req.header());

      for (const validationRule of rules) {
        const value = data[validationRule.field];

        if (validationRule.required && (value === undefined || value === null || value === '')) {
          violations.push({
            timestamp: Date.now(),
            ip,
            userAgent,
            method,
            path,
            headers,
            body,
            rule: {
              name: `Input Validation - Required field missing: ${validationRule.field}`,
              description: `Required field ${validationRule.field} is missing`,
              pattern: /^/,
              action: 'block',
              priority: 1,
              category: 'input-validation',
              severity: 'medium',
              enabled: true
            },
            matchedPattern: '',
            action: 'block',
            blocked: true
          });
          continue;
        }

        if (value !== undefined && value !== null) {
          // Type validation
          if (!this.validateType(value, validationRule.type)) {
            violations.push({
              timestamp: Date.now(),
              ip,
              userAgent,
              method,
              path,
              headers,
              body,
              rule: {
                name: `Input Validation - Invalid type: ${validationRule.field}`,
                description: `Field ${validationRule.field} has invalid type`,
                pattern: /^/,
                action: 'block',
                priority: 1,
                category: 'input-validation',
                severity: 'medium',
                enabled: true
              },
              matchedPattern: String(value),
              action: 'block',
              blocked: true
            });
          }

          // Length validation
          if (validationRule.minLength && String(value).length < validationRule.minLength) {
            violations.push({
              timestamp: Date.now(),
              ip,
              userAgent,
              method,
              path,
              headers,
              body,
              rule: {
                name: `Input Validation - Too short: ${validationRule.field}`,
                description: `Field ${validationRule.field} is too short`,
                pattern: /^/,
                action: 'block',
                priority: 1,
                category: 'input-validation',
                severity: 'low',
                enabled: true
              },
              matchedPattern: String(value),
              action: 'block',
              blocked: true
            });
          }

          if (validationRule.maxLength && String(value).length > validationRule.maxLength) {
            violations.push({
              timestamp: Date.now(),
              ip,
              userAgent,
              method,
              path,
              headers,
              body,
              rule: {
                name: `Input Validation - Too long: ${validationRule.field}`,
                description: `Field ${validationRule.field} is too long`,
                pattern: /^/,
                action: 'block',
                priority: 1,
                category: 'input-validation',
                severity: 'low',
                enabled: true
              },
              matchedPattern: String(value),
              action: 'block',
              blocked: true
            });
          }

          // Pattern validation
          if (validationRule.pattern && !validationRule.pattern.test(String(value))) {
            violations.push({
              timestamp: Date.now(),
              ip,
              userAgent,
              method,
              path,
              headers,
              body,
              rule: {
                name: `Input Validation - Invalid format: ${validationRule.field}`,
                description: `Field ${validationRule.field} has invalid format`,
                pattern: validationRule.pattern,
                action: 'block',
                priority: 1,
                category: 'input-validation',
                severity: 'medium',
                enabled: true
              },
              matchedPattern: String(value),
              action: 'block',
              blocked: true
            });
          }

          // Custom validation
          if (validationRule.customValidator && !validationRule.customValidator(value)) {
            violations.push({
              timestamp: Date.now(),
              ip,
              userAgent,
              method,
              path,
              headers,
              body,
              rule: {
                name: `Input Validation - Custom validation failed: ${validationRule.field}`,
                description: `Field ${validationRule.field} failed custom validation`,
                pattern: /^/,
                action: 'block',
                priority: 1,
                category: 'input-validation',
                severity: 'medium',
                enabled: true
              },
              matchedPattern: String(value),
              action: 'block',
              blocked: true
            });
          }
        }
      }
    } catch (error) {
      // Invalid JSON
      violations.push({
        timestamp: Date.now(),
        ip: this.getClientIP(c),
        userAgent: c.req.header('User-Agent') || '',
        method: c.req.method,
        path,
        headers: Object.fromEntries(c.req.header()),
        body,
        rule: {
          name: 'Input Validation - Invalid JSON',
          description: 'Request body contains invalid JSON',
          pattern: /^/,
          action: 'block',
          priority: 1,
          category: 'input-validation',
          severity: 'medium',
          enabled: true
        },
        matchedPattern: body || '',
        action: 'block',
        blocked: true
      });
    }

    return violations;
  }

  /**
   * CSRF protection
   */
  private async checkCSRF(c: Context): Promise<WAFViolation | null> {
    const origin = c.req.header('Origin');
    const referer = c.req.header('Referer');
    const allowedOrigins = ['https://mariaborysevych.com'];

    // Check if request has proper origin
    if (origin && !allowedOrigins.includes(origin)) {
      return {
        timestamp: Date.now(),
        ip: this.getClientIP(c),
        userAgent: c.req.header('User-Agent') || '',
        method: c.req.method,
        path: c.req.path,
        headers: Object.fromEntries(c.req.header()),
        rule: {
          name: 'CSRF - Invalid Origin',
          description: 'Request has invalid or missing origin header',
          pattern: /^/,
          action: 'block',
          priority: 1,
          category: 'csrf',
          severity: 'high',
          enabled: true
        },
        matchedPattern: origin || '',
        action: 'block',
        blocked: true
      };
    }

    return null;
  }

  /**
   * File upload security
   */
  private async checkFileUpload(c: Context): Promise<WAFViolation[]> {
    const violations: WAFViolation[] = [];
    const contentType = c.req.header('Content-Type') || '';

    if (!contentType.includes('multipart/form-data')) {
      return violations;
    }

    // Check file size limit (10MB)
    const contentLength = parseInt(c.req.header('Content-Length') || '0');
    if (contentLength > 10 * 1024 * 1024) {
      violations.push({
        timestamp: Date.now(),
        ip: this.getClientIP(c),
        userAgent: c.req.header('User-Agent') || '',
        method: c.req.method,
        path: c.req.path,
        headers: Object.fromEntries(c.req.header()),
        rule: {
          name: 'File Upload - Too Large',
          description: 'Uploaded file exceeds size limit',
          pattern: /^/,
          action: 'block',
          priority: 1,
          category: 'file-upload',
          severity: 'high',
          enabled: true
        },
        matchedPattern: String(contentLength),
        action: 'block',
        blocked: true
      });
    }

    return violations;
  }

  /**
   * Handle WAF violations
   */
  private async handleViolation(c: Context, violation: WAFViolation): Promise<void> {
    const statusCode = violation.rule.severity === 'critical' ? 403 :
                      violation.rule.severity === 'high' ? 403 : 400;

    c.status(statusCode);
    c.json({
      error: 'Request Blocked',
      message: 'Your request has been blocked by our security system',
      code: 'WAF_VIOLATION',
      rule: violation.rule.name,
      timestamp: new Date(violation.timestamp).toISOString()
    });
  }

  /**
   * Log WAF violations
   */
  private logViolation(violation: WAFViolation): void {
    this.violations.push(violation);

    // Keep only last 10000 violations in memory
    if (this.violations.length > 10000) {
      this.violations = this.violations.slice(-10000);
    }

    // Log to console (in production, this would go to a security logging system)
    console.warn('WAF Violation:', {
      ip: violation.ip,
      rule: violation.rule.name,
      category: violation.rule.category,
      severity: violation.rule.severity,
      path: violation.path,
      method: violation.method,
      userAgent: violation.userAgent,
      matchedPattern: violation.matchedPattern,
      action: violation.action,
      timestamp: new Date(violation.timestamp).toISOString()
    });
  }

  /**
   * Add security headers
   */
  private addSecurityHeaders(c: Context): void {
    c.header('X-Web-Application-Firewall', 'active');
    c.header('X-Content-Type-Options', 'nosniff');
    c.header('X-Frame-Options', 'DENY');
    c.header('X-XSS-Protection', '1; mode=block');
    c.header('Referrer-Policy', 'strict-origin-when-cross-origin');
  }

  /**
   * Helper methods
   */
  private getClientIP(c: Context): string {
    return (
      c.req.header('CF-Connecting-IP') ||
      c.req.header('X-Forwarded-For')?.split(',')[0]?.trim() ||
      c.req.header('X-Real-IP') ||
      c.req.header('X-Client-IP') ||
      'unknown'
    );
  }

  private validateType(value: any, type: string): boolean {
    switch (type) {
      case 'string':
        return typeof value === 'string';
      case 'number':
        return !isNaN(Number(value));
      case 'email':
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value));
      case 'url':
        try {
          new URL(String(value));
          return true;
        } catch {
          return false;
        }
      case 'phone':
        return /^\+?[0-9\s\-\(\)]+$/.test(String(value));
      case 'date':
        return !isNaN(Date.parse(String(value)));
      case 'boolean':
        return typeof value === 'boolean' || ['true', 'false', '1', '0'].includes(String(value).toLowerCase());
      default:
        return true;
    }
  }

  /**
   * Public API methods
   */
  public addRule(rule: WAFRule): void {
    this.rules.push(rule);
    // Sort by priority
    this.rules.sort((a, b) => a.priority - b.priority);
  }

  public removeRule(name: string): void {
    this.rules = this.rules.filter(rule => rule.name !== name);
  }

  public addInputValidationRules(path: string, rules: InputValidationRule[]): void {
    this.inputValidationRules.set(path, rules);
  }

  public getViolations(limit: number = 100): WAFViolation[] {
    return this.violations.slice(-limit);
  }

  public getViolationsByIP(ip: string, limit: number = 50): WAFViolation[] {
    return this.violations
      .filter(v => v.ip === ip)
      .slice(-limit);
  }

  public clearViolations(): void {
    this.violations = [];
  }

  public getStatistics(): {
    totalViolations: number;
    violationsByCategory: Record<string, number>;
    violationsBySeverity: Record<string, number>;
    topOffenders: Array<{ ip: string; count: number }>;
  } {
    const violationsByCategory: Record<string, number> = {};
    const violationsBySeverity: Record<string, number> = {};
    const offensesByIP: Record<string, number> = {};

    this.violations.forEach(violation => {
      violationsByCategory[violation.rule.category] = (violationsByCategory[violation.rule.category] || 0) + 1;
      violationsBySeverity[violation.rule.severity] = (violationsBySeverity[violation.rule.severity] || 0) + 1;
      offensesByIP[violation.ip] = (offensesByIP[violation.ip] || 0) + 1;
    });

    const topOffenders = Object.entries(offensesByIP)
      .map(([ip, count]) => ({ ip, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    return {
      totalViolations: this.violations.length,
      violationsByCategory,
      violationsBySeverity,
      topOffenders
    };
  }
}

// Singleton instance
const waf = new WebApplicationFirewall();

// Export middleware
export const wafMiddleware = waf.middleware.bind(waf);

// Export class for advanced usage
export { WebApplicationFirewall, WAFRule, WAFViolation, InputValidationRule };

// Export utility functions
export const addWAFRule = (rule: WAFRule) => waf.addRule(rule);
export const removeWAFRule = (name: string) => waf.removeRule(name);
export const getWAFStatistics = () => waf.getStatistics();
export const getWAFViolations = (limit?: number) => waf.getViolations(limit);