import crypto from 'crypto';

import { supabase } from '@/integrations/supabase/client';

// Types
interface PIIFields {
  email: boolean;
  phone: boolean;
  name: boolean;
  address: boolean;
  payment: boolean;
  health: boolean;
}

interface SecurityConfig {
  encryptPII: boolean;
  anonymizeData: boolean;
  logRequests: boolean;
  rateLimitEnabled: boolean;
  consentRequired: boolean;
  gdprCompliant: boolean;
}

interface DataMaskingPattern {
  pattern: RegExp;
  replacement: string;
  description: string;
}

// PII Detection and Masking
export class PIIDetector {
  private static patterns: DataMaskingPattern[] = [
    // Email addresses
    {
      pattern: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
      replacement: '[EMAIL_REDACTED]',
      description: 'Email address',
    },
    // Phone numbers (various formats)
    {
      pattern: /(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g,
      replacement: '[PHONE_REDACTED]',
      description: 'Phone number',
    },
    // Credit card numbers
    {
      pattern: /\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b/g,
      replacement: '[CARD_REDACTED]',
      description: 'Credit card number',
    },
    // Social Security Numbers
    {
      pattern: /\b\d{3}-\d{2}-\d{4}\b/g,
      replacement: '[SSN_REDACTED]',
      description: 'Social Security Number',
    },
    // IBAN (International Bank Account Number)
    {
      pattern: /\b[A-Z]{2}\d{2}[A-Z0-9]{4}\d{7}([A-Z0-9]?){0,16}\b/g,
      replacement: '[IBAN_REDACTED]',
      description: 'IBAN',
    },
    // Full names (simple pattern)
    {
      pattern: /\b[A-Z][a-z]+\s+[A-Z][a-z]+\b/g,
      replacement: '[NAME_REDACTED]',
      description: 'Full name',
    },
    // Addresses (basic pattern)
    {
      pattern: /\d+\s+([A-Z][a-z]*\s*)+(Street|St|Avenue|Ave|Road|Rd|Boulevard|Blvd|Lane|Ln|Drive|Dr)\b/gi,
      replacement: '[ADDRESS_REDACTED]',
      description: 'Street address',
    },
    // Medical information
    {
      pattern: /\b(medical|patient|diagnosis|prescription|treatment|therapy)\s*[:\-]?\s*[^.!?]+[.!?]/gi,
      replacement: '[MEDICAL_INFO_REDACTED]',
      description: 'Medical information',
    },
  ];

  static detectAndMask(text: string, fields: PIIFields): string {
    let maskedText = text;

    // Apply masking based on enabled fields
    if (fields.email) {
      maskedText = maskedText.replace(this.patterns[0].pattern, this.patterns[0].replacement);
    }
    if (fields.phone) {
      maskedText = maskedText.replace(this.patterns[1].pattern, this.patterns[1].replacement);
    }
    if (fields.name) {
      maskedText = maskedText.replace(this.patterns[5].pattern, this.patterns[5].replacement);
    }
    if (fields.address) {
      maskedText = maskedText.replace(this.patterns[6].pattern, this.patterns[6].replacement);
    }
    if (fields.payment) {
      maskedText = maskedText.replace(this.patterns[2].pattern, this.patterns[2].replacement);
      maskedText = maskedText.replace(this.patterns[4].pattern, this.patterns[4].replacement);
    }
    if (fields.health) {
      maskedText = maskedText.replace(this.patterns[7].pattern, this.patterns[7].replacement);
    }

    return maskedText;
  }

  static detectPII(text: string): { type: string; matches: string[] }[] {
    const detected = [];

    for (const pattern of this.patterns) {
      const matches = text.match(pattern.pattern);
      if (matches) {
        detected.push({
          type: pattern.description,
          matches: [...new Set(matches)], // Remove duplicates
        });
      }
    }

    return detected;
  }

  static hasPII(text: string): boolean {
    for (const pattern of this.patterns) {
      if (pattern.pattern.test(text)) {
        return true;
      }
    }
    return false;
  }
}

// Data Encryption
export class DataEncryption {
  private static algorithm = 'aes-256-gcm';
  private static keyLength = 32;

  static encrypt(text: string, key: string): { encrypted: string; iv: string; tag: string } {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(this.algorithm, key, iv);
    cipher.setAAD(Buffer.from('additional-data'));

    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    const tag = cipher.getAuthTag();

    return {
      encrypted,
      iv: iv.toString('hex'),
      tag: tag.toString('hex'),
    };
  }

  static decrypt(encryptedData: { encrypted: string; iv: string; tag: string }, key: string): string {
    const decipher = crypto.createDecipher(this.algorithm, key);
    decipher.setAAD(Buffer.from('additional-data'));
    decipher.setAuthTag(Buffer.from(encryptedData.tag, 'hex'));

    let decrypted = decipher.update(encryptedData.encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  }
}

// Consent Management
export class ConsentManager {
  private static consentKey = 'ai_consent';

  static async getConsent(userId: string): Promise<{
    analytics: boolean;
    personalization: boolean;
    marketing: boolean;
    timestamp: string;
  }> {
    try {
      const { data, error } = await supabase
        .from('user_consents')
        .select('*')
        .eq('user_id', userId)
        .eq('type', 'ai_processing')
        .single();

      if (error || !data) {
        return this.getDefaultConsent();
      }

      return {
        analytics: data.consent_data?.analytics || false,
        personalization: data.consent_data?.personalization || false,
        marketing: data.consent_data?.marketing || false,
        timestamp: data.created_at,
      };
    } catch (error) {
      return this.getDefaultConsent();
    }
  }

  static async updateConsent(
    userId: string,
    consents: {
      analytics?: boolean;
      personalization?: boolean;
      marketing?: boolean;
    }
  ): Promise<void> {
    const currentConsent = await this.getConsent(userId);
    const updatedConsent = { ...currentConsent, ...consents };

    await supabase
      .from('user_consents')
      .upsert({
        user_id: userId,
        type: 'ai_processing',
        consent_data: updatedConsent,
        ip_address: 'unknown', // Would be populated from request
        user_agent: 'unknown', // Would be populated from request
      });
  }

  static async hasConsent(userId: string, type: 'analytics' | 'personalization' | 'marketing'): Promise<boolean> {
    const consent = await this.getConsent(userId);
    return consent[type];
  }

  private static getDefaultConsent() {
    return {
      analytics: false,
      personalization: false,
      marketing: false,
      timestamp: new Date().toISOString(),
    };
  }
}

// Rate Limiting
export class RateLimiter {
  private static requests = new Map<string, { count: number; resetTime: number }>();
  private static limits = {
    default: { requests: 100, window: 60000 }, // 100 requests per minute
    premium: { requests: 1000, window: 60000 }, // 1000 requests per minute
    enterprise: { requests: 10000, window: 60000 }, // 10000 requests per minute
  };

  static async checkLimit(
    identifier: string,
    tier: 'default' | 'premium' | 'enterprise' = 'default'
  ): Promise<{ allowed: boolean; remaining: number; resetTime: number }> {
    const limit = this.limits[tier];
    const now = Date.now();
    const key = identifier;

    const current = this.requests.get(key);

    if (!current || now > current.resetTime) {
      // New window or expired window
      this.requests.set(key, {
        count: 1,
        resetTime: now + limit.window,
      });

      return {
        allowed: true,
        remaining: limit.requests - 1,
        resetTime: now + limit.window,
      };
    }

    if (current.count >= limit.requests) {
      // Rate limit exceeded
      return {
        allowed: false,
        remaining: 0,
        resetTime: current.resetTime,
      };
    }

    // Increment counter
    current.count++;

    return {
      allowed: true,
      remaining: limit.requests - current.count,
      resetTime: current.resetTime,
    };
  }

  static cleanup(): void {
    const now = Date.now();
    for (const [key, value] of this.requests.entries()) {
      if (now > value.resetTime) {
        this.requests.delete(key);
      }
    }
  }
}

// Security Audit Logger
export class SecurityAuditLogger {
  static async log(event: {
    type: 'pii_detected' | 'data_access' | 'consent_change' | 'rate_limit_exceeded' | 'security_violation';
    userId?: string;
    details: any;
    severity: 'low' | 'medium' | 'high' | 'critical';
  }): Promise<void> {
    try {
      await supabase
        .from('security_audit_log')
        .insert({
          event_type: event.type,
          user_id: event.userId,
          details: event.details,
          severity: event.severity,
          timestamp: new Date().toISOString(),
          ip_address: 'unknown', // Would be populated from request
        });
    } catch (error) {
      console.error('Failed to log security event:', error);
    }
  }
}

// Main Security Manager
export class AISecurityManager {
  private config: SecurityConfig;

  constructor(config: Partial<SecurityConfig> = {}) {
    this.config = {
      encryptPII: true,
      anonymizeData: true,
      logRequests: true,
      rateLimitEnabled: true,
      consentRequired: true,
      gdprCompliant: true,
      ...config,
    };

    // Cleanup rate limits periodically
    setInterval(() => RateLimiter.cleanup(), 60000); // Every minute
  }

  async processRequest(
    text: string,
    userId: string,
    options: {
      piiFields?: PIIFields;
      consentTypes?: Array<'analytics' | 'personalization' | 'marketing'>;
      skipRateLimit?: boolean;
    } = {}
  ): Promise<{
    processedText: string;
    hasPII: boolean;
    piiDetected: Array<{ type: string; matches: string[] }>;
    allowed: boolean;
    reason?: string;
  }> {
    // 1. Check consent if required
    if (this.config.consentRequired && options.consentTypes) {
      for (const consentType of options.consentTypes) {
        const hasConsent = await ConsentManager.hasConsent(userId, consentType);
        if (!hasConsent) {
          await SecurityAuditLogger.log({
            type: 'consent_change',
            userId,
            details: { consentType, action: 'denied' },
            severity: 'medium',
          });

          return {
            processedText: text,
            hasPII: false,
            piiDetected: [],
            allowed: false,
            reason: `Consent not granted for ${consentType}`,
          };
        }
      }
    }

    // 2. Check rate limits
    if (this.config.rateLimitEnabled && !options.skipRateLimit) {
      const rateLimit = await RateLimiter.checkLimit(userId);
      if (!rateLimit.allowed) {
        await SecurityAuditLogger.log({
          type: 'rate_limit_exceeded',
          userId,
          details: { resetTime: rateLimit.resetTime },
          severity: 'medium',
        });

        return {
          processedText: text,
          hasPII: false,
          piiDetected: [],
          allowed: false,
          reason: 'Rate limit exceeded',
        };
      }
    }

    // 3. Detect and mask PII
    const piiFields = options.piiFields || {
      email: true,
      phone: true,
      name: true,
      address: true,
      payment: true,
      health: true,
    };

    const hasPII = PIIDetector.hasPII(text);
    const piiDetected = PIIDetector.detectPII(text);
    let processedText = text;

    if (this.config.anonymizeData && hasPII) {
      processedText = PIIDetector.detectAndMask(text, piiFields);

      await SecurityAuditLogger.log({
        type: 'pii_detected',
        userId,
        details: {
          piiTypes: piiDetected.map(p => p.type),
          masked: this.config.anonymizeData,
        },
        severity: 'high',
      });
    }

    // 4. Encrypt if enabled (for sensitive data)
    if (this.config.encryptPII && hasPII) {
      // In a real implementation, this would use a proper key management system
      // const encryptionKey = await this.getEncryptionKey(userId);
      // processedText = DataEncryption.encrypt(processedText, encryptionKey);
    }

    // 5. Log the request if enabled
    if (this.config.logRequests) {
      await SecurityAuditLogger.log({
        type: 'data_access',
        userId,
        details: {
          textLength: text.length,
          hasPII,
          piiCount: piiDetected.length,
          anonymized: this.config.anonymizeData,
        },
        severity: 'low',
      });
    }

    return {
      processedText,
      hasPII,
      piiDetected,
      allowed: true,
    };
  }

  async updateConsent(
    userId: string,
    consents: {
      analytics?: boolean;
      personalization?: boolean;
      marketing?: boolean;
    }
  ): Promise<void> {
    await ConsentManager.updateConsent(userId, consents);

    await SecurityAuditLogger.log({
      type: 'consent_change',
      userId,
      details: consents,
      severity: 'low',
    });
  }

  getSecurityConfig(): SecurityConfig {
    return { ...this.config };
  }

  updateSecurityConfig(newConfig: Partial<SecurityConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }
}

// Export singleton instance
let securityManager: AISecurityManager | null = null;

export function getAISecurityManager(config?: Partial<SecurityConfig>): AISecurityManager {
  if (!securityManager) {
    securityManager = new AISecurityManager(config);
  }
  return securityManager;
}

// Export convenience functions
export async function secureAIRequest(
  text: string,
  userId: string,
  options?: {
    piiFields?: PIIFields;
    consentTypes?: Array<'analytics' | 'personalization' | 'marketing'>;
  }
) {
  const security = getAISecurityManager();
  return security.processRequest(text, userId, options);
}

export async function updateAIConsent(
  userId: string,
  consents: {
    analytics?: boolean;
    personalization?: boolean;
    marketing?: boolean;
  }
) {
  const security = getAISecurityManager();
  return security.updateConsent(userId, consents);
}