/**
 * Secure Authentication and Session Management
 *
 * Provides enhanced security for authentication flows and session management
 * including rate limiting, secure session handling, and authentication monitoring.
 */

import { createRateLimiter } from './input-sanitization';

// Rate limiters for authentication endpoints
export const authRateLimiters = {
  login: createRateLimiter(5, 15 * 60 * 1000), // 5 attempts per 15 minutes
  signup: createRateLimiter(3, 60 * 60 * 1000), // 3 attempts per hour
  passwordReset: createRateLimiter(3, 60 * 60 * 1000), // 3 attempts per hour
  verification: createRateLimiter(10, 60 * 60 * 1000), // 10 attempts per hour
};

/**
 * Session configuration for enhanced security
 */
export const SESSION_CONFIG = {
  // Session timeout settings
  INACTIVITY_TIMEOUT: 30 * 60 * 1000, // 30 minutes
  ABSOLUTE_TIMEOUT: 8 * 60 * 60 * 1000, // 8 hours
  WARNING_TIMEOUT: 5 * 60 * 1000, // 5 minutes before timeout

  // Session storage settings
  STORAGE_KEY: 'bm_secure_session',
  ACTIVITY_KEY: 'bm_last_activity',

  // Security settings
  MAX_CONCURRENT_SESSIONS: 3,
  REQUIRE_REAUTH: true,
  REAUTH_INTERVAL: 60 * 60 * 1000, // 1 hour
};

/**
 * Secure session interface
 */
export interface SecureSession {
  userId: string;
  sessionId: string;
  createdAt: number;
  lastActivity: number;
  expiresAt: number;
  deviceFingerprint: string;
  ipAddress: string;
  userAgent: string;
  requiresReauth: boolean;
  lastReauth?: number;
}

/**
 * Device fingerprinting for session security
 */
export const generateDeviceFingerprint = (): string => {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  if (ctx) {
    ctx.textBaseline = 'top';
    ctx.font = '14px Arial';
    ctx.fillText('Device fingerprint', 2, 2);
  }

  const fingerprint = [
    navigator.userAgent,
    navigator.language,
    screen.width + 'x' + screen.height,
    new Date().getTimezoneOffset(),
    !!window.sessionStorage,
    !!window.localStorage,
    canvas.toDataURL()
  ].join('|');

  // Simple hash function (in production, use a proper cryptographic hash)
  let hash = 0;
  for (let i = 0; i < fingerprint.length; i++) {
    const char = fingerprint.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }

  return Math.abs(hash).toString(16);
};

/**
 * Session manager class for secure session handling
 */
export class SecureSessionManager {
  private static instance: SecureSessionManager;
  private sessions: Map<string, SecureSession> = new Map();
  private activityTimers: Map<string, NodeJS.Timeout> = new Map();

  private constructor() {
    this.initializeEventListeners();
    this.restoreSessions();
  }

  static getInstance(): SecureSessionManager {
    if (!SecureSessionManager.instance) {
      SecureSessionManager.instance = new SecureSessionManager();
    }
    return SecureSessionManager.instance;
  }

  /**
   * Create a new secure session
   */
  createSession(userId: string, additionalData?: Partial<SecureSession>): string {
    const sessionId = this.generateSecureSessionId();
    const now = Date.now();

    const session: SecureSession = {
      userId,
      sessionId,
      createdAt: now,
      lastActivity: now,
      expiresAt: now + SESSION_CONFIG.ABSOLUTE_TIMEOUT,
      deviceFingerprint: generateDeviceFingerprint(),
      ipAddress: additionalData?.ipAddress || 'unknown',
      userAgent: navigator.userAgent,
      requiresReauth: false,
      ...additionalData,
    };

    this.sessions.set(sessionId, session);
    this.saveSession(session);
    this.startActivityMonitoring(sessionId);

    return sessionId;
  }

  /**
   * Validate and retrieve a session
   */
  validateSession(sessionId: string): SecureSession | null {
    const session = this.sessions.get(sessionId);

    if (!session) {
      return null;
    }

    const now = Date.now();

    // Check absolute timeout
    if (now > session.expiresAt) {
      this.destroySession(sessionId);
      return null;
    }

    // Check inactivity timeout
    if (now - session.lastActivity > SESSION_CONFIG.INACTIVITY_TIMEOUT) {
      this.destroySession(sessionId);
      return null;
    }

    // Check device fingerprint
    const currentFingerprint = generateDeviceFingerprint();
    if (session.deviceFingerprint !== currentFingerprint) {
      this.destroySession(sessionId);
      this.logSecurityEvent('SESSION_FINGERPRINT_MISMATCH', {
        sessionId,
        expectedFingerprint: session.deviceFingerprint,
        actualFingerprint: currentFingerprint
      });
      return null;
    }

    // Check if re-authentication is required
    if (session.requiresReauth) {
      const reauthRequired = !session.lastReauth ||
        (now - session.lastReauth > SESSION_CONFIG.REAUTH_INTERVAL);

      if (reauthRequired) {
        return { ...session, requiresReauth: true };
      }
    }

    // Update last activity
    session.lastActivity = now;
    this.saveSession(session);

    return session;
  }

  /**
   * Update session activity
   */
  updateActivity(sessionId: string): void {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.lastActivity = Date.now();
      this.saveSession(session);
      this.resetActivityTimer(sessionId);
    }
  }

  /**
   * Mark session for re-authentication
   */
  requireReauthentication(sessionId: string): void {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.requiresReauth = true;
      this.saveSession(session);
    }
  }

  /**
   * Complete re-authentication
   */
  completeReauthentication(sessionId: string): void {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.requiresReauth = false;
      session.lastReauth = Date.now();
      this.saveSession(session);
    }
  }

  /**
   * Destroy a session
   */
  destroySession(sessionId: string): void {
    this.sessions.delete(sessionId);
    this.stopActivityMonitoring(sessionId);
    this.removeStoredSession(sessionId);
  }

  /**
   * Destroy all sessions for a user
   */
  destroyAllUserSessions(userId: string): void {
    for (const [sessionId, session] of this.sessions.entries()) {
      if (session.userId === userId) {
        this.destroySession(sessionId);
      }
    }
  }

  /**
   * Get all active sessions for a user
   */
  getUserSessions(userId: string): SecureSession[] {
    return Array.from(this.sessions.values())
      .filter(session => session.userId === userId);
  }

  /**
   * Check if user has too many concurrent sessions
   */
  hasTooManySessions(userId: string): boolean {
    const userSessions = this.getUserSessions(userId);
    return userSessions.length >= SESSION_CONFIG.MAX_CONCURRENT_SESSIONS;
  }

  /**
   * Remove oldest session for a user
   */
  removeOldestSession(userId: string): void {
    const userSessions = this.getUserSessions(userId);
    if (userSessions.length > 0) {
      const oldestSession = userSessions.reduce((oldest, current) =>
        current.createdAt < oldest.createdAt ? current : oldest
      );
      this.destroySession(oldestSession.sessionId);
    }
  }

  /**
   * Generate secure session ID
   */
  private generateSecureSessionId(): string {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  }

  /**
   * Save session to secure storage
   */
  private saveSession(session: SecureSession): void {
    try {
      const sessionData = {
        ...session,
        // Encrypt sensitive data in production
        userId: btoa(session.userId), // Basic encoding - use proper encryption in production
      };
      localStorage.setItem(SESSION_CONFIG.STORAGE_KEY, JSON.stringify(sessionData));
      localStorage.setItem(SESSION_CONFIG.ACTIVITY_KEY, Date.now().toString());
    } catch (error) {
      console.error('Failed to save session:', error);
    }
  }

  /**
   * Restore sessions from storage
   */
  private restoreSessions(): void {
    try {
      const storedSession = localStorage.getItem(SESSION_CONFIG.STORAGE_KEY);
      if (storedSession) {
        const sessionData = JSON.parse(storedSession);
        // Decode user ID
        sessionData.userId = atob(sessionData.userId);
        this.sessions.set(sessionData.sessionId, sessionData);
        this.startActivityMonitoring(sessionData.sessionId);
      }
    } catch (error) {
      console.error('Failed to restore session:', error);
      this.clearStoredSessions();
    }
  }

  /**
   * Remove stored session
   */
  private removeStoredSession(sessionId: string): void {
    localStorage.removeItem(SESSION_CONFIG.STORAGE_KEY);
    localStorage.removeItem(SESSION_CONFIG.ACTIVITY_KEY);
  }

  /**
   * Clear all stored sessions
   */
  private clearStoredSessions(): void {
    localStorage.removeItem(SESSION_CONFIG.STORAGE_KEY);
    localStorage.removeItem(SESSION_CONFIG.ACTIVITY_KEY);
  }

  /**
   * Start activity monitoring for a session
   */
  private startActivityMonitoring(sessionId: string): void {
    this.resetActivityTimer(sessionId);
  }

  /**
   * Reset activity timer for a session
   */
  private resetActivityTimer(sessionId: string): void {
    this.stopActivityMonitoring(sessionId);

    const timer = setTimeout(() => {
      const session = this.sessions.get(sessionId);
      if (session) {
        const now = Date.now();
        if (now - session.lastActivity > SESSION_CONFIG.INACTIVITY_TIMEOUT) {
          this.destroySession(sessionId);
          this.emitSessionEvent('SESSION_TIMEOUT', { sessionId });
        }
      }
    }, SESSION_CONFIG.INACTIVITY_TIMEOUT);

    this.activityTimers.set(sessionId, timer);
  }

  /**
   * Stop activity monitoring for a session
   */
  private stopActivityMonitoring(sessionId: string): void {
    const timer = this.activityTimers.get(sessionId);
    if (timer) {
      clearTimeout(timer);
      this.activityTimers.delete(sessionId);
    }
  }

  /**
   * Initialize event listeners for activity tracking
   */
  private initializeEventListeners(): void {
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];

    const updateActivity = () => {
      const sessions = Array.from(this.sessions.values());
      if (sessions.length > 0) {
        // Update the most recent session
        const recentSession = sessions.reduce((mostRecent, current) =>
          current.lastActivity > mostRecent.lastActivity ? current : mostRecent
        );
        this.updateActivity(recentSession.sessionId);
      }
    };

    events.forEach(event => {
      document.addEventListener(event, updateActivity, { passive: true });
    });

    // Cleanup on page unload
    window.addEventListener('beforeunload', () => {
      this.activityTimers.forEach(timer => clearTimeout(timer));
    });
  }

  /**
   * Emit session-related events
   */
  private emitSessionEvent(eventType: string, data: any): void {
    const event = new CustomEvent(`session:${eventType.toLowerCase()}`, { detail: data });
    window.dispatchEvent(event);
  }

  /**
   * Log security events
   */
  private logSecurityEvent(eventType: string, data: any): void {
    console.warn('Security Event:', { type: eventType, data, timestamp: new Date().toISOString() });

    // In production, send to security monitoring service
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'security_event', {
        event_category: 'authentication',
        event_label: eventType,
        custom_parameter: JSON.stringify(data)
      });
    }
  }
}

/**
 * Authentication security utilities
 */
export const authSecurity = {
  /**
   * Check if password meets security requirements
   */
  validatePasswordStrength: (password: string): { valid: boolean; issues: string[] } => {
    const issues: string[] = [];

    if (password.length < 8) {
      issues.push('Password must be at least 8 characters long');
    }

    if (!/[a-z]/.test(password)) {
      issues.push('Password must contain at least one lowercase letter');
    }

    if (!/[A-Z]/.test(password)) {
      issues.push('Password must contain at least one uppercase letter');
    }

    if (!/\d/.test(password)) {
      issues.push('Password must contain at least one number');
    }

    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      issues.push('Password must contain at least one special character');
    }

    // Check for common patterns
    const commonPatterns = [
      /password/i,
      /123456/,
      /qwerty/i,
      /admin/i,
      /letmein/i
    ];

    if (commonPatterns.some(pattern => pattern.test(password))) {
      issues.push('Password contains common patterns that are easy to guess');
    }

    return {
      valid: issues.length === 0,
      issues
    };
  },

  /**
   * Generate secure random token
   */
  generateSecureToken: (length: number = 32): string => {
    const array = new Uint8Array(length);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  },

  /**
   * Check for suspicious login patterns
   */
  detectSuspiciousLogin: (loginData: {
    email: string;
    ipAddress: string;
    userAgent: string;
    timestamp: number;
  }): { suspicious: boolean; reasons: string[] } => {
    const reasons: string[] = [];

    // Check for multiple failed attempts (would need to track this)
    // Check for unusual location
    // Check for unusual device
    // Check for time-based patterns

    return {
      suspicious: reasons.length > 0,
      reasons
    };
  }
};

// Export singleton instance
export const sessionManager = SecureSessionManager.getInstance();

// Type declarations for global window object
declare global {
  interface Window {
    gtag?: (command: string, action: string, options?: any) => void;
  }
}