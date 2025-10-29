/**
 * Payment Security Enhancements
 *
 * Comprehensive security layer for payment processing with:
 * - PCI DSS compliance measures
 * - Enhanced webhook security
 * - Payment flow audit logging
 * - Fraud detection patterns
 * - Secure data handling
 */

import crypto from 'crypto';

import { SecurityMonitor } from './security';
import { getEnvVar } from '@/lib/runtime-env';

export interface PaymentSecurityConfig {
  webhookSecret: string;
  allowedWebhookSources: string[];
  maxPaymentAmount: number;
  suspiciousCountryCodes: string[];
  rateLimitPayments: number;
  paymentWindowMinutes: number;
}

export const defaultPaymentSecurityConfig: PaymentSecurityConfig = {
  webhookSecret: getEnvVar('STRIPE_WEBHOOK_SECRET', ['VITE_STRIPE_WEBHOOK_SECRET']) || '',
  allowedWebhookSources: [
    '54.240.0.0/16', // Stripe IP ranges
    '54.241.0.0/16',
    '54.242.0.0/16',
    '54.243.0.0/16'
  ],
  maxPaymentAmount: 50000, // 500 PLN max
  suspiciousCountryCodes: ['XX', 'ZZ'], // Add suspicious country codes
  rateLimitPayments: 5, // Max 5 payments per hour
  paymentWindowMinutes: 15 // Payment must be completed within 15 minutes
};

/**
 * Enhanced Payment Security Manager
 */
export class PaymentSecurityManager {
  private config: PaymentSecurityConfig;
  private paymentAttempts: Map<string, number[]> = new Map();
  private paymentSessions: Map<string, { created: number; amount: number }> = new Map();

  constructor(config: PaymentSecurityConfig = defaultPaymentSecurityConfig) {
    this.config = config;
    this.initializeSecurityMonitoring();
  }

  /**
   * Initialize payment security monitoring
   */
  private initializeSecurityMonitoring() {
    // Clean up old payment attempts every hour
    setInterval(() => {
      this.cleanupOldPaymentAttempts();
    }, 60 * 60 * 1000);
  }

  /**
   * Enhanced webhook signature verification
   */
  verifyWebhookSignature(payload: string, signature: string, secret?: string): {
    isValid: boolean;
    error?: string;
  } {
    try {
      const webhookSecret = secret || this.config.webhookSecret;
      if (!webhookSecret) {
        return {
          isValid: false,
          error: 'Webhook secret not configured'
        };
      }

      // Extract timestamp and signatures
      const elements = signature.split(',');
      let timestamp: string | null = null;
      const signatures: string[] = [];

      for (const element of elements) {
        const [key, value] = element.split('=');
        if (key === 't') {
          timestamp = value;
        } else if (key.startsWith('v1')) {
          signatures.push(value);
        }
      }

      if (!timestamp || signatures.length === 0) {
        return {
          isValid: false,
          error: 'Invalid signature format'
        };
      }

      // Check timestamp freshness (prevent replay attacks)
      const now = Math.floor(Date.now() / 1000);
      const timestampAge = now - parseInt(timestamp);

      if (timestampAge > 300) { // 5 minutes
        return {
          isValid: false,
          error: 'Timestamp too old'
        };
      }

      // Verify signatures
      const signedPayload = `${timestamp}.${payload}`;
      const expectedSignature = crypto
        .createHmac('sha256', webhookSecret)
        .update(signedPayload, 'utf8')
        .digest('hex');

      const isValid = signatures.some(sig =>
        crypto.timingSafeEqual(
          Buffer.from(sig, 'hex'),
          Buffer.from(expectedSignature, 'hex')
        )
      );

      if (!isValid) {
        SecurityMonitor.getInstance().logSecurityEvent({
          type: 'SUSPICIOUS_ACTIVITY',
          severity: 'high',
          details: {
            activity: 'invalid_webhook_signature',
            timestamp,
            signatures: signatures.length
          }
        });
      }

      return { isValid };

    } catch (error) {
      SecurityMonitor.getInstance().logSecurityEvent({
        type: 'SUSPICIOUS_ACTIVITY',
        severity: 'high',
        details: {
          activity: 'webhook_verification_error',
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      });

      return {
        isValid: false,
        error: 'Verification failed'
      };
    }
  }

  /**
   * Validate payment amount and detect suspicious patterns
   */
  validatePaymentAmount(amount: number, currency: string, customerId?: string): {
    isValid: boolean;
    riskLevel: 'low' | 'medium' | 'high';
    warnings: string[];
  } {
    const warnings: string[] = [];
    let riskLevel: 'low' | 'medium' | 'high' = 'low';

    // Check maximum amount
    if (amount > this.config.maxPaymentAmount) {
      warnings.push(`Amount ${amount} exceeds maximum allowed ${this.config.maxPaymentAmount}`);
      riskLevel = 'high';
    }

    // Check for suspicious amounts (round numbers often indicate testing)
    if (amount % 100 === 0 && amount > 1000) {
      warnings.push('Suspicious round number amount detected');
      riskLevel = riskLevel === 'high' ? 'high' : 'medium';
    }

    // Check for rapid payments from same customer
    if (customerId) {
      const customerAttempts = this.paymentAttempts.get(customerId) || [];
      const recentAttempts = customerAttempts.filter(
        timestamp => Date.now() - timestamp < 60 * 60 * 1000 // Last hour
      );

      if (recentAttempts.length >= this.config.rateLimitPayments) {
        warnings.push(`Customer exceeded rate limit: ${recentAttempts.length} payments in last hour`);
        riskLevel = 'high';
      }

      // Check for payment amounts that are rapidly increasing
      const sessionData = this.paymentSessions.get(customerId);
      if (sessionData && amount > sessionData.amount * 2) {
        warnings.push('Payment amount significantly increased from previous session');
        riskLevel = 'medium';
      }
    }

    // Validate currency
    const allowedCurrencies = ['PLN', 'EUR', 'USD'];
    if (!allowedCurrencies.includes(currency)) {
      warnings.push(`Unsupported currency: ${currency}`);
      riskLevel = 'high';
    }

    // Log suspicious payments
    if (riskLevel !== 'low') {
      SecurityMonitor.getInstance().logSecurityEvent({
        type: 'SUSPICIOUS_ACTIVITY',
        severity: riskLevel === 'high' ? 'high' : 'medium',
        details: {
          activity: 'suspicious_payment_validation',
          amount,
          currency,
          customerId,
          warnings,
          riskLevel
        }
      });
    }

    return {
      isValid: riskLevel !== 'high' && warnings.length === 0,
      riskLevel,
      warnings
    };
  }

  /**
   * Create secure payment intent with enhanced validation
   */
  createSecurePaymentIntent(params: {
    amount: number;
    currency: string;
    customerId?: string;
    metadata?: Record<string, any>;
    sessionId?: string;
  }): {
    isAllowed: boolean;
    reason?: string;
    enhancedMetadata: Record<string, any>;
  } {
    const { amount, currency, customerId, metadata, sessionId } = params;

    // Rate limiting check
    if (customerId && !this.checkPaymentRateLimit(customerId)) {
      return {
        isAllowed: false,
        reason: 'Rate limit exceeded',
        enhancedMetadata: {}
      };
    }

    // Amount validation
    const amountValidation = this.validatePaymentAmount(amount, currency, customerId);
    if (!amountValidation.isValid) {
      return {
        isAllowed: false,
        reason: amountValidation.warnings.join(', '),
        enhancedMetadata: {}
      };
    }

    // Create payment session
    if (customerId && sessionId) {
      this.paymentSessions.set(sessionId, {
        created: Date.now(),
        amount
      });
    }

    // Enhanced metadata for security tracking
    const enhancedMetadata = {
      ...metadata,
      security_session_id: sessionId,
      security_created_at: new Date().toISOString(),
      security_risk_level: amountValidation.riskLevel,
      security_client_ip: metadata?.client_ip || 'unknown',
      security_user_agent: this.sanitizeUserAgent(metadata?.user_agent || 'unknown'),
      security_validations: {
        amount_check: true,
        rate_limit_check: true,
        currency_check: true
      }
    };

    // Track payment attempt
    if (customerId) {
      this.trackPaymentAttempt(customerId);
    }

    return {
      isAllowed: true,
      enhancedMetadata
    };
  }

  /**
   * Verify payment completion and detect anomalies
   */
  verifyPaymentCompletion(paymentIntent: any, sessionId?: string): {
    isValid: boolean;
    anomalies: string[];
    securityScore: number;
  } {
    const anomalies: string[] = [];
    let securityScore = 100;

    // Check payment session validity
    if (sessionId) {
      const sessionData = this.paymentSessions.get(sessionId);
      if (!sessionData) {
        anomalies.push('No valid payment session found');
        securityScore -= 30;
      } else {
        const sessionAge = Date.now() - sessionData.created;
        const maxAge = this.config.paymentWindowMinutes * 60 * 1000;

        if (sessionAge > maxAge) {
          anomalies.push(`Payment session expired (${Math.round(sessionAge / 1000 / 60)} minutes ago)`);
          securityScore -= 20;
        }

        // Check for amount changes
        if (paymentIntent.amount !== sessionData.amount * 100) { // Stripe uses cents
          anomalies.push(`Payment amount changed from ${sessionData.amount} to ${paymentIntent.amount / 100}`);
          securityScore -= 40;
        }

        // Clean up session
        this.paymentSessions.delete(sessionId);
      }
    }

    // Check for suspicious payment patterns
    if (paymentIntent.amount % 10000 === 0 && paymentIntent.amount > 50000) {
      anomalies.push('Suspicious round number payment amount');
      securityScore -= 15;
    }

    // Check payment source
    if (paymentIntent.payment_method?.card) {
      const card = paymentIntent.payment_method.card;

      // Check for test cards
      if (card.last4 === '4242' || card.last4 === '0000') {
        anomalies.push('Test card detected in production');
        securityScore -= 50;
      }

      // Check for suspicious card patterns
      if (card.funding === 'prepaid' && paymentIntent.amount > 10000) {
        anomalies.push('High-value payment with prepaid card');
        securityScore -= 20;
      }
    }

    // Log security events for low scores
    if (securityScore < 70) {
      SecurityMonitor.getInstance().logSecurityEvent({
        type: 'SUSPICIOUS_ACTIVITY',
        severity: securityScore < 50 ? 'high' : 'medium',
        details: {
          activity: 'payment_completion_anomaly',
          paymentIntentId: paymentIntent.id,
          anomalies,
          securityScore
        }
      });
    }

    return {
      isValid: securityScore >= 50,
      anomalies,
      securityScore
    };
  }

  /**
   * Check payment rate limit for customer
   */
  private checkPaymentRateLimit(customerId: string): boolean {
    const attempts = this.paymentAttempts.get(customerId) || [];
    const now = Date.now();
    const recentAttempts = attempts.filter(
      timestamp => now - timestamp < 60 * 60 * 1000 // Last hour
    );

    return recentAttempts.length < this.config.rateLimitPayments;
  }

  /**
   * Track payment attempt for rate limiting
   */
  private trackPaymentAttempt(customerId: string): void {
    const attempts = this.paymentAttempts.get(customerId) || [];
    attempts.push(Date.now());
    this.paymentAttempts.set(customerId, attempts);
  }

  /**
   * Clean up old payment attempts
   */
  private cleanupOldPaymentAttempts(): void {
    const now = Date.now();
    const cutoff = now - 24 * 60 * 60 * 1000; // 24 hours ago

    for (const [customerId, attempts] of this.paymentAttempts.entries()) {
      const validAttempts = attempts.filter(timestamp => timestamp > cutoff);
      if (validAttempts.length === 0) {
        this.paymentAttempts.delete(customerId);
      } else {
        this.paymentAttempts.set(customerId, validAttempts);
      }
    }

    // Clean up old payment sessions
    for (const [sessionId, sessionData] of this.paymentSessions.entries()) {
      if (now - sessionData.created > 2 * 60 * 60 * 1000) { // 2 hours
        this.paymentSessions.delete(sessionId);
      }
    }
  }

  /**
   * Sanitize user agent for logging
   */
  private sanitizeUserAgent(userAgent: string): string {
    // Remove potential sensitive information from user agent
    return userAgent
      .replace(/[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}/g, 'X.X.X.X')
      .replace(/\/[\d\w\.-]+/gi, '/X.X.X')
      .substring(0, 200); // Limit length
  }

  /**
   * Generate secure payment session ID
   */
  generateSecureSessionId(): string {
    const timestamp = Date.now().toString(36);
    const randomBytes = crypto.randomBytes(16).toString('hex');
    return `ps_${timestamp}_${randomBytes}`;
  }

  /**
   * Get security metrics for monitoring
   */
  getSecurityMetrics(): {
    activePaymentSessions: number;
    trackedCustomers: number;
    recentPaymentAttempts: number;
    averageAttemptsPerCustomer: number;
  } {
    const now = Date.now();
    const recentAttempts = Array.from(this.paymentAttempts.values())
      .flat()
      .filter(timestamp => now - timestamp < 60 * 60 * 1000).length;

    return {
      activePaymentSessions: this.paymentSessions.size,
      trackedCustomers: this.paymentAttempts.size,
      recentPaymentAttempts: recentAttempts,
      averageAttemptsPerCustomer: this.paymentAttempts.size > 0
        ? recentAttempts / this.paymentAttempts.size
        : 0
    };
  }
}

// Export singleton instance
export const paymentSecurityManager = new PaymentSecurityManager();

// Export utilities
export const verifyWebhookSignature = (payload: string, signature: string, secret?: string) =>
  paymentSecurityManager.verifyWebhookSignature(payload, signature, secret);

export const validatePaymentAmount = (amount: number, currency: string, customerId?: string) =>
  paymentSecurityManager.validatePaymentAmount(amount, currency, customerId);

export const createSecurePaymentIntent = (params: {
  amount: number;
  currency: string;
  customerId?: string;
  metadata?: Record<string, any>;
  sessionId?: string;
}) => paymentSecurityManager.createSecurePaymentIntent(params);

export const verifyPaymentCompletion = (paymentIntent: any, sessionId?: string) =>
  paymentSecurityManager.verifyPaymentCompletion(paymentIntent, sessionId);

export const generateSecureSessionId = () => paymentSecurityManager.generateSecureSessionId();
