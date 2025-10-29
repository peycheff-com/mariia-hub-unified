/**
 * Security Configuration and Monitoring
 * Implements security headers, CSP, and monitoring for production
 */

export interface SecurityConfig {
  CSP: {
    'default-src': string[];
    'script-src': string[];
    'style-src': string[];
    'img-src': string[];
    'connect-src': string[];
    'font-src': string[];
    'media-src': string[];
    'object-src': string[];
    'child-src': string[];
    'frame-src': string[];
    'worker-src': string[];
    'manifest-src': string[];
    'upgrade-insecure-requests': boolean;
  };
  headers: {
    'X-Frame-Options': string;
    'X-Content-Type-Options': string;
    'X-XSS-Protection': string;
    'Referrer-Policy': string;
    'Permissions-Policy': string;
    'Strict-Transport-Security': string;
  };
}

export const securityConfig: SecurityConfig = {
  CSP: {
    'default-src': ["'self'"],
    'script-src': [
      "'self'",
      "'unsafe-eval'",
      'https://cdn.supabase.co',
      'https://js.stripe.com',
      'https://www.googletagmanager.com',
      'https://www.google-analytics.com',
      'https://unpkg.com',
      'https://cdn.jsdelivr.net'
    ],
    'style-src': [
      "'self'",
      "'unsafe-inline'",
      'https://fonts.googleapis.com',
      'https://cdn.jsdelivr.net'
    ],
    'img-src': [
      "'self'",
      'data:',
      'blob:',
      'https://*.supabase.co',
      'https://avatars.githubusercontent.com',
      'https://*.googleusercontent.com',
      'https://*.stripe.com'
    ],
    'connect-src': [
      "'self'",
      'https://*.supabase.co',
      'https://api.stripe.com',
      'https://www.google-analytics.com',
      'https://analytics.google.com'
    ],
    'font-src': [
      "'self'",
      'https://fonts.gstatic.com',
      'https://cdn.jsdelivr.net'
    ],
    'media-src': ["'self'", 'blob:'],
    'object-src': ["'none'"],
    'child-src': ["'self'"],
    'frame-src': ["'self'", 'https://js.stripe.com'],
    'worker-src': ["'self'", 'blob:'],
    'manifest-src': ["'self'"],
    'upgrade-insecure-requests': true
  },
  headers: {
    'X-Frame-Options': 'DENY',
    'X-Content-Type-Options': 'nosniff',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=()',
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload'
  }
};

/**
 * Generate CSP header string
 */
export function generateCSPHeader(config: SecurityConfig['CSP']): string {
  const directives = Object.entries(config)
    .filter(([key]) => key !== 'upgrade-insecure-requests')
    .map(([key, value]) => {
      const values = Array.isArray(value) ? value.join(' ') : value;
      return `${key.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase())} ${values}`;
    });

  if (config['upgrade-insecure-requests']) {
    directives.push('upgrade-insecure-requests');
  }

  return directives.join('; ');
}

/**
 * Security monitoring utilities
 */
export class SecurityMonitor {
  private static instance: SecurityMonitor;
  private reportEndpoint: string;

  constructor(reportEndpoint?: string) {
    this.reportEndpoint = reportEndpoint || '/api/security-reports';
  }

  static getInstance(): SecurityMonitor {
    if (!SecurityMonitor.instance) {
      SecurityMonitor.instance = new SecurityMonitor();
    }
    return SecurityMonitor.instance;
  }

  /**
   * Log security events
   */
  logSecurityEvent(event: {
    type: 'CSP_VIOLATION' | 'XSS_ATTEMPT' | 'SUSPICIOUS_ACTIVITY' | 'RATE_LIMIT';
    severity: 'low' | 'medium' | 'high' | 'critical';
    details: Record<string, any>;
    timestamp?: number;
  }) {
    const logEntry = {
      ...event,
      timestamp: event.timestamp || Date.now(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      sessionId: this.getSessionId()
    };

    // Log to console in development
    if (import.meta.env.DEV) {
      console.warn('Security Event:', logEntry);
    }

    // Send to monitoring endpoint in production
    if (import.meta.env.PROD && this.reportEndpoint) {
      fetch(this.reportEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(logEntry),
        keepalive: true
      }).catch(err => {
        console.error('Failed to report security event:', err);
      });
    }

    // Store in local storage for admin review
    this.storeSecurityEvent(logEntry);
  }

  /**
   * Initialize CSP violation reporting
   */
  initCSPReporting() {
    if ('SecurityPolicyViolationEvent' in window) {
      document.addEventListener('securitypolicyviolation', (event) => {
        this.logSecurityEvent({
          type: 'CSP_VIOLATION',
          severity: 'medium',
          details: {
            violatedDirective: event.violatedDirective,
            blockedURI: event.blockedURI,
            sourceFile: event.sourceFile,
            lineNumber: event.lineNumber,
            columnNumber: event.columnNumber
          }
        });
      });
    }
  }

  /**
   * Monitor for suspicious activity
   */
  initSuspiciousActivityMonitoring() {
    // Monitor rapid form submissions
    let submissionCount = 0;
    const resetCounter = () => {
      submissionCount = 0;
    };

    document.addEventListener('submit', () => {
      submissionCount++;
      if (submissionCount > 5) {
        this.logSecurityEvent({
          type: 'SUSPICIOUS_ACTIVITY',
          severity: 'medium',
          details: { activity: 'rapid_form_submissions', count: submissionCount }
        });
      }
      setTimeout(resetCounter, 5000);
    });

    // Monitor console access attempts
    const originalLog = console.log;
    console.log = function(...args) {
      if (args.some(arg => typeof arg === 'string' && arg.includes('debug'))) {
        SecurityMonitor.getInstance().logSecurityEvent({
          type: 'SUSPICIOUS_ACTIVITY',
          severity: 'low',
          details: { activity: 'console_debug_attempt', args: args.slice(0, 3) }
        });
      }
      return originalLog.apply(console, args);
    };
  }

  private getSessionId(): string {
    const key = 'security_session_id';
    let sessionId = sessionStorage.getItem(key);
    if (!sessionId) {
      sessionId = crypto.randomUUID();
      sessionStorage.setItem(key, sessionId);
    }
    return sessionId;
  }

  private storeSecurityEvent(event: any) {
    const key = 'security_events';
    const events = JSON.parse(localStorage.getItem(key) || '[]');
    events.push(event);

    // Keep only last 100 events
    if (events.length > 100) {
      events.splice(0, events.length - 100);
    }

    localStorage.setItem(key, JSON.stringify(events));
  }

  /**
   * Get security events for admin dashboard
   */
  getSecurityEvents(): any[] {
    return JSON.parse(localStorage.getItem('security_events') || '[]');
  }

  /**
   * Clear security events
   */
  clearSecurityEvents() {
    localStorage.removeItem('security_events');
  }
}

/**
 * Initialize security measures
 */
export function initializeSecurity() {
  const monitor = SecurityMonitor.getInstance();

  // Initialize CSP reporting
  monitor.initCSPReporting();

  // Initialize suspicious activity monitoring
  monitor.initSuspiciousActivityMonitoring();

  // Log initialization
  monitor.logSecurityEvent({
    type: 'SUSPICIOUS_ACTIVITY',
    severity: 'low',
    details: { activity: 'security_initialized', timestamp: Date.now() }
  });
}

/**
 * Rate limiting utility
 */
export class RateLimiter {
  private requests: Map<string, number[]> = new Map();
  private readonly maxRequests: number;
  private readonly windowMs: number;

  constructor(maxRequests: number = 100, windowMs: number = 60000) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
  }

  isAllowed(identifier: string): boolean {
    const now = Date.now();
    const requests = this.requests.get(identifier) || [];

    // Remove old requests outside the window
    const validRequests = requests.filter(time => now - time < this.windowMs);

    if (validRequests.length >= this.maxRequests) {
      SecurityMonitor.getInstance().logSecurityEvent({
        type: 'RATE_LIMIT',
        severity: 'medium',
        details: {
          identifier,
          requestsCount: validRequests.length,
          maxRequests: this.maxRequests
        }
      });
      return false;
    }

    validRequests.push(now);
    this.requests.set(identifier, validRequests);
    return true;
  }
}

export const rateLimiter = new RateLimiter();