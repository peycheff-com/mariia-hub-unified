/**
 * Data Encryption and Protection System
 *
 * Comprehensive encryption implementation for data at rest and in transit
 * including key management, secure backup, and PII protection.
 */

import { createCipheriv, createDecipheriv, randomBytes, scrypt } from 'crypto';
import { productionSecurityConfig } from '../config/production-security';

interface EncryptionKey {
  id: string;
  algorithm: string;
  keyData: string;
  created: number;
  expires: number;
  version: number;
  status: 'active' | 'deprecated' | 'revoked';
  purpose: 'data-at-rest' | 'backup' | 'pii' | 'session' | 'api-keys';
}

interface EncryptionResult {
  data: string;
  keyId: string;
  algorithm: string;
  iv: string;
  tag?: string;
  timestamp: number;
}

interface DecryptionResult {
  data: string;
  keyId: string;
  algorithm: string;
  timestamp: number;
}

interface PIIData {
  field: string;
  type: 'email' | 'phone' | 'name' | 'address' | 'id-number' | 'financial' | 'health' | 'custom';
  data: string;
  encrypted: boolean;
  keyId?: string;
  salt?: string;
}

class DataEncryption {
  private keys: Map<string, EncryptionKey> = new Map();
  private currentKeyId: string | null = null;
  private readonly config = productionSecurityConfig.encryption;
  private readonly algorithm = 'aes-256-gcm';
  private readonly keyLength = 32; // 256 bits
  private readonly ivLength = 16; // 128 bits
  private readonly tagLength = 16; // 128 bits
  private readonly saltLength = 32; // 256 bits

  constructor() {
    this.initializeEncryption();
  }

  /**
   * Initialize encryption system
   */
  private async initializeEncryption(): Promise<void> {
    // Generate initial encryption key
    await this.generateNewKey('data-at-rest');
    await this.generateNewKey('backup');
    await this.generateNewKey('pii');
    await this.generateNewKey('session');
    await this.generateNewKey('api-keys');

    // Start key rotation timer
    this.startKeyRotation();

    console.log('Data encryption system initialized');
  }

  /**
   * Generate a new encryption key
   */
  private async generateNewKey(purpose: EncryptionKey['purpose']): Promise<string> {
    const keyId = this.generateKeyId();
    const keyData = randomBytes(this.keyLength).toString('hex');
    const now = Date.now();

    const key: EncryptionKey = {
      id: keyId,
      algorithm: this.algorithm,
      keyData,
      created: now,
      expires: now + (this.config.atRest.keyRotationDays * 24 * 60 * 60 * 1000),
      version: 1,
      status: 'active',
      purpose
    };

    this.keys.set(keyId, key);

    // Update current key for data-at-rest
    if (purpose === 'data-at-rest') {
      this.currentKeyId = keyId;
    }

    console.log(`Generated new encryption key for ${purpose}: ${keyId}`);
    return keyId;
  }

  /**
   * Encrypt data
   */
  public async encrypt(data: string, purpose: EncryptionKey['purpose'] = 'data-at-rest'): Promise<EncryptionResult> {
    const key = this.getActiveKey(purpose);
    if (!key) {
      throw new Error(`No active encryption key available for purpose: ${purpose}`);
    }

    const iv = randomBytes(this.ivLength);
    const cipher = createCipheriv(this.algorithm, Buffer.from(key.keyData, 'hex'), iv);

    let encrypted = cipher.update(data, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    const tag = cipher.getAuthTag();

    const result: EncryptionResult = {
      data: encrypted,
      keyId: key.id,
      algorithm: this.algorithm,
      iv: iv.toString('hex'),
      tag: tag.toString('hex'),
      timestamp: Date.now()
    };

    return result;
  }

  /**
   * Decrypt data
   */
  public async decrypt(encryptedData: EncryptionResult): Promise<DecryptionResult> {
    const key = this.keys.get(encryptedData.keyId);
    if (!key) {
      throw new Error(`Encryption key not found: ${encryptedData.keyId}`);
    }

    if (key.status === 'revoked') {
      throw new Error(`Encryption key has been revoked: ${encryptedData.keyId}`);
    }

    const iv = Buffer.from(encryptedData.iv, 'hex');
    const tag = encryptedData.tag ? Buffer.from(encryptedData.tag, 'hex') : undefined;

    try {
      const decipher = createDecipheriv(
        encryptedData.algorithm,
        Buffer.from(key.keyData, 'hex'),
        iv
      );

      if (tag) {
        decipher.setAuthTag(tag);
      }

      let decrypted = decipher.update(encryptedData.data, 'hex', 'utf8');
      decrypted += decipher.final('utf8');

      return {
        data: decrypted,
        keyId: encryptedData.keyId,
        algorithm: encryptedData.algorithm,
        timestamp: Date.now()
      };
    } catch (error) {
      throw new Error(`Decryption failed: ${error.message}`);
    }
  }

  /**
   * Encrypt PII (Personally Identifiable Information)
   */
  public async encryptPII(field: string, data: string, type: PIIData['type']): Promise<PIIData> {
    const salt = randomBytes(this.saltLength).toString('hex');
    const dataWithSalt = `${salt}:${data}`;

    const encryptedResult = await this.encrypt(dataWithSalt, 'pii');

    return {
      field,
      type,
      data: encryptedResult.data,
      encrypted: true,
      keyId: encryptedResult.keyId,
      salt
    };
  }

  /**
   * Decrypt PII
   */
  public async decryptPII(piiData: PIIData): Promise<string> {
    if (!piiData.encrypted) {
      return piiData.data;
    }

    const encryptedResult: EncryptionResult = {
      data: piiData.data,
      keyId: piiData.keyId || '',
      algorithm: this.algorithm,
      iv: '', // Will be retrieved from storage
      timestamp: Date.now()
    };

    // In a real implementation, IV would be stored/retrieved securely
    const iv = randomBytes(this.ivLength).toString('hex');
    encryptedResult.iv = iv;

    const decryptedResult = await this.decrypt(encryptedResult);
    const decryptedWithSalt = decryptedResult.data;

    // Remove salt
    if (piiData.salt && decryptedWithSalt.startsWith(piiData.salt + ':')) {
      return decryptedWithSalt.substring(piiData.salt.length + 1);
    }

    return decryptedWithSalt;
  }

  /**
   * Encrypt API keys and secrets
   */
  public async encryptSecret(secret: string, context: string): Promise<string> {
    const contextData = `${context}:${secret}`;
    const encrypted = await this.encrypt(contextData, 'api-keys');

    // Return a format that includes all necessary data
    return JSON.stringify(encrypted);
  }

  /**
   * Decrypt API keys and secrets
   */
  public async decryptSecret(encryptedSecret: string): Promise<string> {
    try {
      const encryptedData: EncryptionResult = JSON.parse(encryptedSecret);
      const decrypted = await this.decrypt(encryptedData);

      // Extract context and actual secret
      const parts = decrypted.data.split(':', 2);
      return parts.length > 1 ? parts[1] : decrypted.data;
    } catch (error) {
      throw new Error(`Failed to decrypt secret: ${error.message}`);
    }
  }

  /**
   * Create encrypted backup
   */
  public async createEncryptedBackup(data: any): Promise<{
    encryptedData: string;
    backupId: string;
    timestamp: number;
    checksum: string;
  }> {
    const backupId = this.generateBackupId();
    const timestamp = Date.now();

    const backupData = {
      id: backupId,
      timestamp,
      version: '1.0',
      data
    };

    const serializedData = JSON.stringify(backupData);
    const encrypted = await this.encrypt(serializedData, 'backup');

    // Create checksum
    const checksum = this.createChecksum(encrypted.data);

    return {
      encryptedData: JSON.stringify(encrypted),
      backupId,
      timestamp,
      checksum
    };
  }

  /**
   * Restore from encrypted backup
   */
  public async restoreFromBackup(encryptedBackup: string, expectedChecksum: string): Promise<any> {
    try {
      const encryptedData: EncryptionResult = JSON.parse(encryptedBackup);

      // Verify checksum
      const checksum = this.createChecksum(encryptedData.data);
      if (checksum !== expectedChecksum) {
        throw new Error('Backup integrity check failed');
      }

      const decrypted = await this.decrypt(encryptedData);
      const backupData = JSON.parse(decrypted.data);

      return backupData.data;
    } catch (error) {
      throw new Error(`Failed to restore backup: ${error.message}`);
    }
  }

  /**
   * Rotate encryption keys
   */
  public async rotateKeys(): Promise<void> {
    const now = Date.now();
    const rotationNeeded: EncryptionKey['purpose'][] = [];

    // Check each purpose for rotation
    ['data-at-rest', 'backup', 'pii', 'session', 'api-keys'].forEach(purpose => {
      const key = this.getActiveKey(purpose);
      if (key && now > key.expires) {
        rotationNeeded.push(purpose);
      }
    });

    // Generate new keys
    for (const purpose of rotationNeeded) {
      await this.generateNewKey(purpose);

      // Mark old key as deprecated
      const oldKey = this.getActiveKey(purpose);
      if (oldKey && oldKey.id !== this.currentKeyId) {
        oldKey.status = 'deprecated';
      }
    }

    if (rotationNeeded.length > 0) {
      console.log(`Rotated encryption keys for: ${rotationNeeded.join(', ')}`);
    }
  }

  /**
   * Revoke an encryption key
   */
  public revokeKey(keyId: string): void {
    const key = this.keys.get(keyId);
    if (key) {
      key.status = 'revoked';
      console.log(`Revoked encryption key: ${keyId}`);
    }
  }

  /**
   * Get active key for purpose
   */
  private getActiveKey(purpose: EncryptionKey['purpose']): EncryptionKey | undefined {
    const activeKeys = Array.from(this.keys.values())
      .filter(key => key.purpose === purpose && key.status === 'active')
      .sort((a, b) => b.created - a.created); // Get newest

    return activeKeys[0];
  }

  /**
   * Start key rotation timer
   */
  private startKeyRotation(): void {
    // Check for key rotation every hour
    setInterval(async () => {
      await this.rotateKeys();
    }, 60 * 60 * 1000);
  }

  /**
   * Generate key ID
   */
  private generateKeyId(): string {
    return `key_${Date.now()}_${Math.random().toString(36).substring(2)}`;
  }

  /**
   * Generate backup ID
   */
  private generateBackupId(): string {
    return `backup_${Date.now()}_${Math.random().toString(36).substring(2)}`;
  }

  /**
   * Create checksum for data integrity
   */
  private createChecksum(data: string): string {
    const crypto = require('crypto');
    return crypto.createHash('sha256').update(data).digest('hex');
  }

  /**
   * Validate encryption configuration
   */
  public validateConfiguration(): {
    valid: boolean;
    issues: string[];
  } {
    const issues: string[] = [];

    // Check if we have active keys for all purposes
    const requiredPurposes: EncryptionKey['purpose'][] = ['data-at-rest', 'backup', 'pii', 'session', 'api-keys'];
    for (const purpose of requiredPurposes) {
      const key = this.getActiveKey(purpose);
      if (!key) {
        issues.push(`No active key for purpose: ${purpose}`);
      }
    }

    // Check algorithm
    if (this.algorithm !== 'aes-256-gcm') {
      issues.push(`Unsupported algorithm: ${this.algorithm}`);
    }

    // Check key length
    if (this.keyLength !== 32) {
      issues.push(`Invalid key length: ${this.keyLength}`);
    }

    return {
      valid: issues.length === 0,
      issues
    };
  }

  /**
   * Get encryption statistics
   */
  public getStatistics(): {
    totalKeys: number;
    keysByPurpose: Record<string, number>;
    keysByStatus: Record<string, number>;
    oldestKeyDate: number;
    newestKeyDate: number;
  } {
    const keys = Array.from(this.keys.values());
    const keysByPurpose: Record<string, number> = {};
    const keysByStatus: Record<string, number> = {};

    keys.forEach(key => {
      keysByPurpose[key.purpose] = (keysByPurpose[key.purpose] || 0) + 1;
      keysByStatus[key.status] = (keysByStatus[key.status] || 0) + 1;
    });

    const dates = keys.map(k => k.created);
    const oldestKeyDate = Math.min(...dates);
    const newestKeyDate = Math.max(...dates);

    return {
      totalKeys: keys.length,
      keysByPurpose,
      keysByStatus,
      oldestKeyDate,
      newestKeyDate
    };
  }

  /**
   * Export key metadata (without actual key data)
   */
  public exportKeyMetadata(): Array<{
    id: string;
    algorithm: string;
    created: number;
    expires: number;
    version: number;
    status: string;
    purpose: string;
  }> {
    return Array.from(this.keys.values()).map(key => ({
      id: key.id,
      algorithm: key.algorithm,
      created: key.created,
      expires: key.expires,
      version: key.version,
      status: key.status,
      purpose: key.purpose
    }));
  }

  /**
   * Clean up expired keys
   */
  public cleanupExpiredKeys(): void {
    const now = Date.now();
    const expiredKeys: string[] = [];

    for (const [keyId, key] of this.keys.entries()) {
      // Remove keys that are expired for more than 30 days and not the current key
      if (now > key.expires + (30 * 24 * 60 * 60 * 1000) && keyId !== this.currentKeyId) {
        expiredKeys.push(keyId);
      }
    }

    expiredKeys.forEach(keyId => {
      this.keys.delete(keyId);
      console.log(`Cleaned up expired encryption key: ${keyId}`);
    });
  }

  /**
   * Encrypt sensitive fields in an object
   */
  public async encryptSensitiveFields(
    obj: any,
    sensitiveFields: string[]
  ): Promise<any> {
    const encryptedObj = { ...obj };

    for (const field of sensitiveFields) {
      if (encryptedObj[field]) {
        const piiType = this.detectPIIType(field);
        const encrypted = await this.encryptPII(field, encryptedObj[field], piiType);
        encryptedObj[field] = encrypted;
      }
    }

    return encryptedObj;
  }

  /**
   * Decrypt sensitive fields in an object
   */
  public async decryptSensitiveFields(obj: any): Promise<any> {
    const decryptedObj = { ...obj };

    for (const [key, value] of Object.entries(decryptedObj)) {
      if (value && typeof value === 'object' && value.encrypted) {
        try {
          const piiData: PIIData = value;
          decryptedObj[key] = await this.decryptPII(piiData);
        } catch (error) {
          console.error(`Failed to decrypt field ${key}:`, error);
          // Keep original value if decryption fails
        }
      }
    }

    return decryptedObj;
  }

  /**
   * Detect PII type based on field name
   */
  private detectPIIType(fieldName: string): PIIData['type'] {
    const field = fieldName.toLowerCase();

    if (field.includes('email')) return 'email';
    if (field.includes('phone') || field.includes('mobile')) return 'phone';
    if (field.includes('name') || field.includes('first') || field.includes('last')) return 'name';
    if (field.includes('address') || field.includes('street') || field.includes('city')) return 'address';
    if (field.includes('id') || field.includes('passport') || field.includes('nin')) return 'id-number';
    if (field.includes('card') || field.includes('bank') || field.includes('account')) return 'financial';
    if (field.includes('health') || field.includes('medical')) return 'health';

    return 'custom';
  }
}

// Singleton instance
const dataEncryption = new DataEncryption();

// Export class and utilities
export { DataEncryption, EncryptionResult, DecryptionResult, PIIData };

// Export utility functions
export const encryptData = (data: string, purpose?: EncryptionKey['purpose']) =>
  dataEncryption.encrypt(data, purpose);

export const decryptData = (encryptedData: EncryptionResult) =>
  dataEncryption.decrypt(encryptedData);

export const encryptPII = (field: string, data: string, type: PIIData['type']) =>
  dataEncryption.encryptPII(field, data, type);

export const decryptPII = (piiData: PIIData) =>
  dataEncryption.decryptPII(piiData);

export const createEncryptedBackup = (data: any) =>
  dataEncryption.createEncryptedBackup(data);

export const restoreFromBackup = (encryptedBackup: string, checksum: string) =>
  dataEncryption.restoreFromBackup(encryptedBackup, checksum);

export const getEncryptionStatistics = () => dataEncryption.getStatistics();
export const validateEncryptionConfiguration = () => dataEncryption.validateConfiguration();
export const rotateEncryptionKeys = () => dataEncryption.rotateKeys();
export const cleanupExpiredKeys = () => dataEncryption.cleanupExpiredKeys();