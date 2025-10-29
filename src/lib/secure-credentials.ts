/**
 * Secure Credential Management System
 *
 * Handles server-side credential storage, encryption, and rotation
 * for all third-party service integrations.
 */

import crypto from 'crypto';

import { createClient } from '@supabase/supabase-js';

// Encryption configuration
const ENCRYPTION_ALGORITHM = 'aes-256-gcm';
const ENCRYPTION_KEY = import.meta.env.VITE_CREDENTIALS_ENCRYPTION_KEY || crypto.randomBytes(32);
const IV_LENGTH = 16;
const TAG_LENGTH = 16;

// Service credential types
export interface ServiceCredential {
  id: string;
  service: string;
  environment: 'development' | 'staging' | 'production';
  encryptedKey: string;
  encryptedSecret: string;
  iv: string;
  tag: string;
  isActive: boolean;
  expiresAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  lastRotated?: Date;
}

export interface DecryptedCredentials {
  apiKey: string;
  apiSecret: string;
  metadata?: Record<string, any>;
}

/**
 * Encrypt sensitive credential data using secure AES-256-GCM
 */
export function encryptCredential(data: string): {
  encrypted: string;
  iv: string;
  tag: string;
} {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ENCRYPTION_ALGORITHM, ENCRYPTION_KEY, iv);
  cipher.setAAD(Buffer.from('mariia-hub-credentials'));

  let encrypted = cipher.update(data, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  const tag = cipher.getAuthTag();

  return {
    encrypted,
    iv: iv.toString('hex'),
    tag: tag.toString('hex')
  };
}

/**
 * Decrypt sensitive credential data using secure AES-256-GCM
 */
export function decryptCredential(
  encryptedData: string,
  iv: string,
  tag: string
): string {
  const decipher = crypto.createDecipheriv(ENCRYPTION_ALGORITHM, ENCRYPTION_KEY, Buffer.from(iv, 'hex'));
  decipher.setAAD(Buffer.from('mariia-hub-credentials'));
  decipher.setAuthTag(Buffer.from(tag, 'hex'));

  let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
  decrypted += decipher.final('utf8');

  return decrypted;
}

/**
 * Secure credential manager class
 */
export class SecureCredentialManager {
  private supabase = createClient(
    import.meta.env.VITE_SUPABASE_URL!,
    import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY!
  );

  /**
   * Store encrypted credentials for a service
   */
  async storeCredentials(
    service: string,
    credentials: DecryptedCredentials,
    environment: 'development' | 'staging' | 'production' = 'production'
  ): Promise<void> {
    const { encrypted: encryptedKey, iv: keyIv, tag: keyTag } = encryptCredential(credentials.apiKey);
    const { encrypted: encryptedSecret, iv: secretIv, tag: secretTag } = encryptCredential(credentials.apiSecret);

    const credential: Omit<ServiceCredential, 'id' | 'createdAt' | 'updatedAt'> = {
      service,
      environment,
      encryptedKey,
      encryptedSecret,
      iv: JSON.stringify({ key: keyIv, secret: secretIv }),
      tag: JSON.stringify({ key: keyTag, secret: secretTag }),
      isActive: true,
      expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days
      lastRotated: new Date()
    };

    // Deactivate existing credentials for this service
    await this.supabase
      .from('service_credentials')
      .update({ isActive: false })
      .eq('service', service)
      .eq('environment', environment);

    // Store new encrypted credentials
    const { error } = await this.supabase
      .from('service_credentials')
      .insert(credential);

    if (error) {
      throw new Error(`Failed to store credentials: ${error.message}`);
    }
  }

  /**
   * Retrieve and decrypt credentials for a service
   */
  async getCredentials(
    service: string,
    environment: 'development' | 'staging' | 'production' = 'production'
  ): Promise<DecryptedCredentials | null> {
    const { data, error } = await this.supabase
      .from('service_credentials')
      .select('*')
      .eq('service', service)
      .eq('environment', environment)
      .eq('isActive', true)
      .single();

    if (error || !data) {
      console.error(`Credentials not found for ${service} in ${environment}`);
      return null;
    }

    try {
      const ivs = JSON.parse(data.iv);
      const tags = JSON.parse(data.tag);

      const apiKey = decryptCredential(data.encryptedKey, ivs.key, tags.key);
      const apiSecret = decryptCredential(data.encryptedSecret, ivs.secret, tags.secret);

      return {
        apiKey,
        apiSecret,
        metadata: {
          id: data.id,
          expiresAt: data.expiresAt,
          lastRotated: data.lastRotated
        }
      };
    } catch (decryptError) {
      console.error(`Failed to decrypt credentials for ${service}:`, decryptError);
      return null;
    }
  }

  /**
   * Rotate credentials for a service
   */
  async rotateCredentials(
    service: string,
    newCredentials: DecryptedCredentials,
    environment: 'development' | 'staging' | 'production' = 'production'
  ): Promise<void> {
    console.log(`Rotating credentials for ${service} in ${environment}`);

    // Store new credentials
    await this.storeCredentials(service, newCredentials, environment);

    // Log rotation for audit
    await this.supabase
      .from('credential_audit_log')
      .insert({
        service,
        environment,
        action: 'ROTATE',
        timestamp: new Date(),
        initiatedBy: 'system'
      });
  }

  /**
   * Get all services with expiring credentials
   */
  async getExpiringCredentials(daysThreshold: number = 7): Promise<ServiceCredential[]> {
    const threshold = new Date(Date.now() + daysThreshold * 24 * 60 * 60 * 1000);

    const { data, error } = await this.supabase
      .from('service_credentials')
      .select('*')
      .eq('isActive', true)
      .lte('expiresAt', threshold);

    if (error) {
      throw new Error(`Failed to check expiring credentials: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Validate credentials against the service API
   */
  async validateCredentials(
    service: string,
    credentials: DecryptedCredentials
  ): Promise<boolean> {
    switch (service) {
      case 'stripe':
        return this.validateStripeCredentials(credentials);
      case 'booksy':
        return this.validateBooksyCredentials(credentials);
      case 'whatsapp':
        return this.validateWhatsAppCredentials(credentials);
      case 'resend':
        return this.validateResendCredentials(credentials);
      default:
        console.warn(`No validation method for service: ${service}`);
        return true;
    }
  }

  private async validateStripeCredentials(credentials: DecryptedCredentials): Promise<boolean> {
    try {
      const response = await fetch('https://api.stripe.com/v1/account', {
        headers: {
          'Authorization': `Bearer ${credentials.apiSecret}`,
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  private async validateBooksyCredentials(credentials: DecryptedCredentials): Promise<boolean> {
    // Booksy API validation implementation
    try {
      const response = await fetch('https://api.booksy.com/api/v1/me', {
        headers: {
          'Authorization': `Bearer ${credentials.apiSecret}`,
          'Content-Type': 'application/json'
        }
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  private async validateWhatsAppCredentials(credentials: DecryptedCredentials): Promise<boolean> {
    try {
      const response = await fetch(`https://graph.facebook.com/v18.0/me`, {
        headers: {
          'Authorization': `Bearer ${credentials.apiSecret}`
        }
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  private async validateResendCredentials(credentials: DecryptedCredentials): Promise<boolean> {
    try {
      const response = await fetch('https://api.resend.com/domains', {
        headers: {
          'Authorization': `Bearer ${credentials.apiSecret}`,
          'Content-Type': 'application/json'
        }
      });
      return response.ok;
    } catch {
      return false;
    }
  }
}

// Export singleton instance
export const credentialManager = new SecureCredentialManager();

// Service configuration mapping
export const SERVICE_CONFIGS = {
  stripe: {
    name: 'Stripe',
    requiresApiSecret: true,
    requiresApiKey: true,
    rotationDays: 90,
    rateLimit: {
      requests: 100,
      window: '1m'
    }
  },
  booksy: {
    name: 'Booksy',
    requiresApiSecret: true,
    requiresApiKey: false,
    rotationDays: 30,
    rateLimit: {
      requests: 1000,
      window: '1h'
    }
  },
  whatsapp: {
    name: 'WhatsApp Business',
    requiresApiSecret: true,
    requiresApiKey: true,
    rotationDays: 60,
    rateLimit: {
      requests: 50,
      window: '1s'
    }
  },
  resend: {
    name: 'Resend Email',
    requiresApiSecret: true,
    requiresApiKey: false,
    rotationDays: 180,
    rateLimit: {
      requests: 100,
      window: '1s'
    }
  },
  openai: {
    name: 'OpenAI',
    requiresApiSecret: true,
    requiresApiKey: false,
    rotationDays: 90,
    rateLimit: {
      requests: 60,
      window: '1m'
    }
  },
  anthropic: {
    name: 'Anthropic Claude',
    requiresApiSecret: true,
    requiresApiKey: false,
    rotationDays: 90,
    rateLimit: {
      requests: 1000,
      window: '1m'
    }
  }
} as const;

export type ServiceName = keyof typeof SERVICE_CONFIGS;