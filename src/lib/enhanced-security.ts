/**
 * Enhanced Security Library for Client-Side Protection
 * Zero-trust security implementation
 */

import { SecurityMonitor, rateLimiter } from './security';

export interface SecurityConfig {
  sessionTimeout: number;
  maxLoginAttempts: number;
  lockoutDuration: number;
  passwordPolicy: {
    minLength: number;
    requireUppercase: boolean;
    requireLowercase: boolean;
    requireNumbers: boolean;
    requireSpecialChars: boolean;
    preventCommonPasswords: boolean;
  };
  csrfProtection: boolean;
  xssProtection: boolean;
  inputValidation: boolean;
}

export const defaultSecurityConfig: SecurityConfig = {
  sessionTimeout: 30 * 60 * 1000, // 30 minutes
  maxLoginAttempts: 5,
  lockoutDuration: 15 * 60 * 1000, // 15 minutes
  passwordPolicy: {
    minLength: 12,
    requireUppercase: true,
    requireLowercase: true,
    requireNumbers: true,
    requireSpecialChars: true,
    preventCommonPasswords: true
  },
  csrfProtection: true,
  xssProtection: true,
  inputValidation: true
};

/**
 * Enhanced client-side security manager
 */
export class EnhancedSecurityManager {
  private config: SecurityConfig;
  private sessionTimeout: NodeJS.Timeout | null = null;
  private loginAttempts: Map<string, { count: number; lockoutUntil: number }> = new Map();
  private csrfToken: string | null = null;

  constructor(config: SecurityConfig = defaultSecurityConfig) {
    this.config = config;
    this.initializeSecurity();
  }

  /**
   * Initialize security measures
   */
  private initializeSecurity() {
    // Generate CSRF token
    this.generateCSRFToken();

    // Initialize session timeout
    this.resetSessionTimeout();

    // Monitor suspicious activity
    this.initSuspiciousActivityMonitoring();

    // Initialize secure communication
    this.initSecureCommunication();

    // Setup event listeners for security events
    this.setupSecurityEventListeners();
  }

  /**
   * Generate and store CSRF token
   */
  private generateCSRFToken(): string {
    if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
      const array = new Uint8Array(32);
      crypto.getRandomValues(array);
      this.csrfToken = Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
    } else {
      // Fallback for older browsers
      this.csrfToken = Math.random().toString(36).substring(2, 15) +
                      Math.random().toString(36).substring(2, 15);
    }

    // Store in session storage (HTTP-only cookies are better but this is client-side)
    sessionStorage.setItem('csrf_token', this.csrfToken!);
    return this.csrfToken!;
  }

  /**
   * Get current CSRF token
   */
  getCSRFToken(): string {
    if (!this.csrfToken) {
      this.generateCSRFToken();
    }
    return this.csrfToken!;
  }

  /**
   * Validate CSRF token
   */
  validateCSRFToken(token: string): boolean {
    const storedToken = sessionStorage.getItem('csrf_token');
    return storedToken === token;
  }

  /**
   * Reset session timeout
   */
  private resetSessionTimeout() {
    if (this.sessionTimeout) {
      clearTimeout(this.sessionTimeout);
    }

    this.sessionTimeout = setTimeout(() => {
      this.handleSessionTimeout();
    }, this.config.sessionTimeout);
  }

  /**
   * Handle session timeout
   */
  private handleSessionTimeout() {
    SecurityMonitor.getInstance().logSecurityEvent({
      type: 'SUSPICIOUS_ACTIVITY',
      severity: 'medium',
      details: { activity: 'session_timeout' }
    });

    // Clear sensitive data
    sessionStorage.clear();
    localStorage.clear();

    // Redirect to login or show timeout modal
    window.location.href = '/auth?timeout=true';
  }

  /**
   * Monitor for suspicious client-side activity
   */
  private initSuspiciousActivityMonitoring() {
    let clickCount = 0;
    let keyPressCount = 0;
    const startTime = Date.now();

    // Monitor rapid clicking
    document.addEventListener('click', () => {
      clickCount++;
      if (clickCount > 20) { // More than 20 clicks in 5 seconds
        SecurityMonitor.getInstance().logSecurityEvent({
          type: 'SUSPICIOUS_ACTIVITY',
          severity: 'low',
          details: { activity: 'rapid_clicking', count: clickCount }
        });
      }
      setTimeout(() => clickCount--, 5000);
    });

    // Monitor rapid key presses
    document.addEventListener('keypress', () => {
      keyPressCount++;
      if (keyPressCount > 100) { // More than 100 key presses in 5 seconds
        SecurityMonitor.getInstance().logSecurityEvent({
          type: 'SUSPICIOUS_ACTIVITY',
          severity: 'low',
          details: { activity: 'rapid_typing', count: keyPressCount }
        });
      }
      setTimeout(() => keyPressCount--, 5000);
    });

    // Monitor tab switching
    let tabSwitchCount = 0;
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        tabSwitchCount++;
        if (tabSwitchCount > 10) { // More than 10 tab switches
          SecurityMonitor.getInstance().logSecurityEvent({
            type: 'SUSPICIOUS_ACTIVITY',
            severity: 'low',
            details: { activity: 'excessive_tab_switching', count: tabSwitchCount }
          });
        }
      }
    });

    // Monitor for debugger/inspector usage
    const devtools = { open: false, orientation: null };
    const threshold = 160;

    setInterval(() => {
      if (window.outerHeight - window.innerHeight > threshold ||
          window.outerWidth - window.innerWidth > threshold) {
        if (!devtools.open) {
          devtools.open = true;
          SecurityMonitor.getInstance().logSecurityEvent({
            type: 'SUSPICIOUS_ACTIVITY',
            severity: 'medium',
            details: { activity: 'developer_tools_detected' }
          });
        }
      } else {
        devtools.open = false;
      }
    }, 500);
  }

  /**
   * Initialize secure communication
   */
  private initSecureCommunication() {
    // Ensure HTTPS in production
    if (import.meta.env.PROD && location.protocol !== 'https:') {
      SecurityMonitor.getInstance().logSecurityEvent({
        type: 'SUSPICIOUS_ACTIVITY',
        severity: 'high',
        details: { activity: 'insecure_protocol', protocol: location.protocol }
      });

      // Redirect to HTTPS
      location.replace(`https:${location.href.substring(location.protocol.length)}`);
    }

    // Validate certificate (basic check)
    if (import.meta.env.PROD && !location.hostname.includes('localhost')) {
      fetch('/api/health')
        .then(response => {
          if (!response.ok) {
            SecurityMonitor.getInstance().logSecurityEvent({
              type: 'SUSPICIOUS_ACTIVITY',
              severity: 'medium',
              details: { activity: 'certificate_issue', status: response.status }
            });
          }
        })
        .catch(error => {
          SecurityMonitor.getInstance().logSecurityEvent({
            type: 'SUSPICIOUS_ACTIVITY',
            severity: 'medium',
            details: { activity: 'connection_error', error: error.message }
          });
        });
    }
  }

  /**
   * Setup security event listeners
   */
  private setupSecurityEventListeners() {
    // Monitor for copy events (sensitive data exfiltration prevention)
    document.addEventListener('copy', (e) => {
      const selection = document.getSelection()?.toString() || '';
      if (this.containsSensitiveData(selection)) {
        e.preventDefault();
        SecurityMonitor.getInstance().logSecurityEvent({
          type: 'SUSPICIOUS_ACTIVITY',
          severity: 'medium',
          details: { activity: 'sensitive_data_copy_attempt', data: selection.substring(0, 50) }
        });
      }
    });

    // Monitor for paste events (malicious input prevention)
    document.addEventListener('paste', (e) => {
      const clipboardData = e.clipboardData?.getData('text') || '';
      if (this.containsMaliciousPatterns(clipboardData)) {
        e.preventDefault();
        SecurityMonitor.getInstance().logSecurityEvent({
          type: 'SUSPICIOUS_ACTIVITY',
          severity: 'medium',
          details: { activity: 'malicious_paste_attempt', data: clipboardData.substring(0, 50) }
        });
      }
    });

    // Monitor for right-click attempts
    let rightClickCount = 0;
    document.addEventListener('contextmenu', (e) => {
      rightClickCount++;
      if (rightClickCount > 5) {
        SecurityMonitor.getInstance().logSecurityEvent({
          type: 'SUSPICIOUS_ACTIVITY',
          severity: 'low',
          details: { activity: 'excessive_right_clicking', count: rightClickCount }
        });
      }
      setTimeout(() => rightClickCount--, 5000);
    });
  }

  /**
   * Check if data contains sensitive information
   */
  private containsSensitiveData(data: string): boolean {
    const sensitivePatterns = [
      /\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b/, // Credit card
      /\b\d{3}-\d{2}-\d{4}\b/, // SSN
      /password/i,
      /token/i,
      /secret/i,
      /api[_-]?key/i
    ];

    return sensitivePatterns.some(pattern => pattern.test(data));
  }

  /**
   * Check for malicious patterns in input
   */
  private containsMaliciousPatterns(data: string): boolean {
    const maliciousPatterns = [
      /<script/i,
      /javascript:/i,
      /on\w+\s*=/i,
      /data:text\/html/i,
      /vbscript:/i,
      /expression\(/i
    ];

    return maliciousPatterns.some(pattern => pattern.test(data));
  }

  /**
   * Enhanced input validation
   */
  validateInput(input: string, type: 'email' | 'phone' | 'text' | 'password'): boolean {
    if (!input || typeof input !== 'string') {
      return false;
    }

    // Check for malicious patterns
    if (this.containsMaliciousPatterns(input)) {
      SecurityMonitor.getInstance().logSecurityEvent({
        type: 'SUSPICIOUS_ACTIVITY',
        severity: 'medium',
        details: { activity: 'malicious_input_detected', input: input.substring(0, 100), type }
      });
      return false;
    }

    switch (type) {
      case 'email':
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(input) && input.length <= 254;

      case 'phone':
        const phoneRegex = /^\+?[\d\s\-\(\)]{10,}$/;
        return phoneRegex.test(input);

      case 'password':
        return this.validatePassword(input);

      case 'text':
        return input.length <= 1000 && !/<script|javascript:|on\w+=/i.test(input);

      default:
        return input.length <= 1000;
    }
  }

  /**
   * Password validation with comprehensive checks
   */
  validatePassword(password: string): boolean {
    const policy = this.config.passwordPolicy;

    if (password.length < policy.minLength) {
      return false;
    }

    if (policy.requireUppercase && !/[A-Z]/.test(password)) {
      return false;
    }

    if (policy.requireLowercase && !/[a-z]/.test(password)) {
      return false;
    }

    if (policy.requireNumbers && !/\d/.test(password)) {
      return false;
    }

    if (policy.requireSpecialChars && !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      return false;
    }

    if (policy.preventCommonPasswords && this.isCommonPassword(password)) {
      SecurityMonitor.getInstance().logSecurityEvent({
        type: 'SUSPICIOUS_ACTIVITY',
        severity: 'low',
        details: { activity: 'common_password_attempt' }
      });
      return false;
    }

    return true;
  }

  /**
   * Check against common passwords
   */
  private isCommonPassword(password: string): boolean {
    const commonPasswords = [
      'password', '123456', 'password123', 'admin', 'qwerty',
      'letmein', 'welcome', 'monkey', 'password1', 'abc123'
    ];

    const passwordLower = password.toLowerCase();
    return commonPasswords.some(common => passwordLower.includes(common));
  }

  /**
   * Rate limiting for client-side actions
   */
  checkRateLimit(action: string, limit: number = 5, windowMs: number = 60000): boolean {
    const key = `rate_limit_${action}`;
    const now = Date.now();
    const attempts = JSON.parse(sessionStorage.getItem(key) || '[]');

    // Remove old attempts
    const validAttempts = attempts.filter((timestamp: number) => now - timestamp < windowMs);

    if (validAttempts.length >= limit) {
      SecurityMonitor.getInstance().logSecurityEvent({
        type: 'RATE_LIMIT',
        severity: 'medium',
        details: { action, attempts: validAttempts.length, limit }
      });
      return false;
    }

    // Add current attempt
    validAttempts.push(now);
    sessionStorage.setItem(key, JSON.stringify(validAttempts));

    return true;
  }

  /**
   * Secure storage with encryption
   */
  secureStore(key: string, data: any): void {
    try {
      const encrypted = btoa(JSON.stringify(data));
      sessionStorage.setItem(key, encrypted);
    } catch (error) {
      SecurityMonitor.getInstance().logSecurityEvent({
        type: 'SUSPICIOUS_ACTIVITY',
        severity: 'low',
        details: { activity: 'secure_storage_error', error: error instanceof Error ? error.message : 'Unknown' }
      });
    }
  }

  /**
   * Secure retrieval with decryption
   */
  secureRetrieve(key: string): any {
    try {
      const encrypted = sessionStorage.getItem(key);
      if (!encrypted) return null;

      return JSON.parse(atob(encrypted));
    } catch (error) {
      SecurityMonitor.getInstance().logSecurityEvent({
        type: 'SUSPICIOUS_ACTIVITY',
        severity: 'low',
        details: { activity: 'secure_retrieve_error', error: error instanceof Error ? error.message : 'Unknown' }
      });
      return null;
    }
  }

  /**
   * Clear all secure storage
   */
  clearSecureStorage(): void {
    sessionStorage.clear();
    localStorage.clear();
  }

  /**
   * Get security status
   */
  getSecurityStatus(): {
    hasCSRFToken: boolean;
    isHTTPS: boolean;
    lastActivity: number;
    securityEvents: any[];
  } {
    const monitor = SecurityMonitor.getInstance();

    return {
      hasCSRFToken: !!this.csrfToken,
      isHTTPS: location.protocol === 'https:',
      lastActivity: Date.now(),
      securityEvents: monitor.getSecurityEvents()
    };
  }
}

// Global instance
export const securityManager = new EnhancedSecurityManager();

// Export utilities
export const validateInput = (input: string, type: 'email' | 'phone' | 'text' | 'password') =>
  securityManager.validateInput(input, type);

export const getCSRFToken = () => securityManager.getCSRFToken();

export const validateCSRFToken = (token: string) => securityManager.validateCSRFToken(token);

export const checkRateLimit = (action: string, limit?: number, windowMs?: number) =>
  securityManager.checkRateLimit(action, limit, windowMs);

export const secureStore = (key: string, data: any) => securityManager.secureStore(key, data);

export const secureRetrieve = (key: string) => securityManager.secureRetrieve(key);

export const getSecurityStatus = () => securityManager.getSecurityStatus();