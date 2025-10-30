/**
 * Mobile Data Protection and Encryption System
 *
 * Comprehensive mobile-specific data protection including end-to-end encryption,
 * secure storage, certificate pinning, secure backup, and data sanitization
 * for iOS and Android platforms.
 */

import { createCipheriv, createDecipheriv, randomBytes, createHash, scrypt } from 'crypto';
import { dataEncryption } from './data-encryption';

// Platform types
type Platform = 'ios' | 'android';

// Data classification levels
type DataClassification = 'public' | 'internal' | 'confidential' | 'restricted';

// Storage security levels
type StorageSecurity = 'standard' | 'encrypted' | 'secure_enclave' | 'hardware_backed';

// Backup types
type BackupType = 'icloud' | 'google_drive' | 'local_encrypted' | 'enterprise';

// Data retention policies
interface RetentionPolicy {
  classification: DataClassification;
  retentionDays: number;
  autoDelete: boolean;
  archivalRequired: boolean;
  complianceRequirements: string[];
}

// Mobile encryption key
interface MobileEncryptionKey {
  keyId: string;
  platform: Platform;
  deviceId: string;
  keyData: string;
  algorithm: string;
  keySize: number;
  ivSize: number;
  tagSize: number;
  storageSecurity: StorageSecurity;
  createdAt: number;
  expiresAt: number;
  lastUsed: number;
  usageCount: number;
  maxUsage: number;
  status: 'active' | 'deprecated' | 'revoked';
}

// Certificate pinning configuration
interface CertificatePinningConfig {
  domain: string;
  publicKeyHashes: string[];
  backupPublicKeyHashes: string[];
  enforced: boolean;
  expirationPolicy: 'strict' | 'lenient';
  reportOnly: boolean;
}

// Secure storage entry
interface SecureStorageEntry {
  id: string;
  key: string;
  value: string;
  classification: DataClassification;
  encrypted: boolean;
  keyId: string;
  platform: Platform;
  deviceId: string;
  accessAttempts: number;
  maxAccessAttempts: number;
  locked: boolean;
  lockUntil?: number;
  createdAt: number;
  lastAccessed: number;
  expiresAt?: number;
  accessLog: Array<{
    timestamp: number;
    success: boolean;
    source: string;
  }>;
}

// Data backup configuration
interface BackupConfiguration {
  backupId: string;
  userId: string;
  deviceId: string;
  platform: Platform;
  backupType: BackupType;
  encrypted: boolean;
  compressionEnabled: boolean;
  incrementalBackup: boolean;
  schedule: string; // cron-like expression
  retentionDays: number;
  includesPII: boolean;
  includesHealthData: boolean;
  includesPaymentData: boolean;
  lastBackup?: number;
  nextBackup?: number;
}

// Data sanitization rule
interface SanitizationRule {
  id: string;
  name: string;
  pattern: RegExp;
  replacement: string;
  classification: DataClassification[];
  contexts: string[]; // Where this rule applies
  enabled: boolean;
}

class MobileDataProtection {
  private encryptionKeys: Map<string, MobileEncryptionKey> = new Map();
  private secureStorage: Map<string, SecureStorageEntry> = new Map();
  private certificatePins: Map<string, CertificatePinningConfig> = new Map();
  private backupConfigurations: Map<string, BackupConfiguration> = new Map();
  private sanitizationRules: SanitizationRule[] = [];
  private retentionPolicies: RetentionPolicy[] = [];

  constructor() {
    this.initializeCertificatePinning();
    this.initializeSanitizationRules();
    this.initializeRetentionPolicies();
    this.startKeyRotation();
    this.startDataCleanup();
    console.log('Mobile data protection system initialized');
  }

  /**
   * Initialize certificate pinning configurations
   */
  private initializeCertificatePinning(): void {
    const pins: CertificatePinningConfig[] = [
      {
        domain: 'api.mariaborysevych.com',
        publicKeyHashes: [
          'sha256/AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=', // Primary certificate
          'sha256/BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB='  // Backup certificate
        ],
        backupPublicKeyHashes: [
          'sha256/CCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCC='
        ],
        enforced: true,
        expirationPolicy: 'strict',
        reportOnly: false
      },
      {
        domain: 'supabase.co',
        publicKeyHashes: [
          'sha256/DDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDD='
        ],
        backupPublicKeyHashes: [
          'sha256/EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE='
        ],
        enforced: true,
        expirationPolicy: 'strict',
        reportOnly: false
      },
      {
        domain: 'stripe.com',
        publicKeyHashes: [
          'sha256/FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF='
        ],
        backupPublicKeyHashes: [
          'sha256/GGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGG='
        ],
        enforced: true,
        expirationPolicy: 'strict',
        reportOnly: false
      }
    ];

    pins.forEach(pin => {
      this.certificatePins.set(pin.domain, pin);
    });
  }

  /**
   * Initialize data sanitization rules
   */
  private initializeSanitizationRules(): void {
    this.sanitizationRules = [
      {
        id: 'email_sanitization',
        name: 'Email Address Sanitization',
        pattern: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
        replacement: '[REDACTED_EMAIL]',
        classification: ['confidential', 'restricted'],
        contexts: ['logs', 'analytics', 'error_reports'],
        enabled: true
      },
      {
        id: 'phone_sanitization',
        name: 'Phone Number Sanitization',
        pattern: /\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g,
        replacement: '[REDACTED_PHONE]',
        classification: ['confidential', 'restricted'],
        contexts: ['logs', 'analytics', 'error_reports'],
        enabled: true
      },
      {
        id: 'credit_card_sanitization',
        name: 'Credit Card Number Sanitization',
        pattern: /\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b/g,
        replacement: '[REDACTED_CARD]',
        classification: ['restricted'],
        contexts: ['logs', 'analytics', 'error_reports', 'debug'],
        enabled: true
      },
      {
        id: 'ssn_sanitization',
        name: 'Social Security Number Sanitization',
        pattern: /\b\d{3}-\d{2}-\d{4}\b/g,
        replacement: '[REDACTED_SSN]',
        classification: ['restricted'],
        contexts: ['logs', 'analytics', 'error_reports', 'debug'],
        enabled: true
      },
      {
        id: 'ip_address_sanitization',
        name: 'IP Address Sanitization',
        pattern: /\b(?:\d{1,3}\.){3}\d{1,3}\b/g,
        replacement: '[REDACTED_IP]',
        classification: ['internal'],
        contexts: ['logs', 'analytics'],
        enabled: true
      },
      {
        id: 'health_data_sanitization',
        name: 'Health Data Sanitization',
        pattern: /\b(medical|health|diagnosis|treatment|medication|condition)\b[^.]*\./gi,
        replacement: '[REDACTED_HEALTH_DATA]',
        classification: ['restricted'],
        contexts: ['logs', 'analytics', 'error_reports'],
        enabled: true
      }
    ];
  }

  /**
   * Initialize data retention policies
   */
  private initializeRetentionPolicies(): void {
    this.retentionPolicies = [
      {
        classification: 'public',
        retentionDays: 365, // 1 year
        autoDelete: true,
        archivalRequired: false,
        complianceRequirements: []
      },
      {
        classification: 'internal',
        retentionDays: 730, // 2 years
        autoDelete: true,
        archivalRequired: true,
        complianceRequirements: ['ISO27001']
      },
      {
        classification: 'confidential',
        retentionDays: 2555, // 7 years
        autoDelete: false,
        archivalRequired: true,
        complianceRequirements: ['GDPR', 'ISO27001', 'HIPAA']
      },
      {
        classification: 'restricted',
        retentionDays: 3650, // 10 years
        autoDelete: false,
        archivalRequired: true,
        complianceRequirements: ['GDPR', 'PCI-DSS', 'HIPAA', 'SOX']
      }
    ];
  }

  /**
   * Generate mobile-specific encryption key
   */
  public async generateMobileKey(
    platform: Platform,
    deviceId: string,
    storageSecurity: StorageSecurity = 'encrypted'
  ): Promise<MobileEncryptionKey> {
    const keyId = this.generateKeyId();
    const keyData = randomBytes(32).toString('hex');
    const now = Date.now();

    const encryptionKey: MobileEncryptionKey = {
      keyId,
      platform,
      deviceId,
      keyData: await dataEncryption.encryptSecret(keyData, `mobile_${deviceId}_${keyId}`),
      algorithm: 'AES-256-GCM',
      keySize: 256,
      ivSize: 12,
      tagSize: 16,
      storageSecurity,
      createdAt: now,
      expiresAt: now + (90 * 24 * 60 * 60 * 1000), // 90 days
      lastUsed: now,
      usageCount: 0,
      maxUsage: 10000,
      status: 'active'
    };

    this.encryptionKeys.set(keyId, encryptionKey);
    console.log(`Mobile encryption key generated for ${platform} device ${deviceId}`);

    return encryptionKey;
  }

  /**
   * Encrypt data with mobile-specific key
   */
  public async encryptMobileData(
    data: string,
    keyId: string,
    classification: DataClassification = 'confidential'
  ): Promise<{
    encryptedData: string;
    iv: string;
    tag: string;
    keyId: string;
    algorithm: string;
    classification: DataClassification;
    timestamp: number;
  }> {
    const key = this.encryptionKeys.get(keyId);
    if (!key) {
      throw new Error(`Encryption key not found: ${keyId}`);
    }

    if (key.status !== 'active') {
      throw new Error(`Encryption key is not active: ${keyId}`);
    }

    if (Date.now() > key.expiresAt) {
      throw new Error(`Encryption key has expired: ${keyId}`);
    }

    if (key.usageCount >= key.maxUsage) {
      throw new Error(`Encryption key usage limit exceeded: ${keyId}`);
    }

    const actualKeyData = await dataEncryption.decryptSecret(key.keyData);
    const iv = randomBytes(key.ivSize);
    const cipher = createCipheriv(key.algorithm, Buffer.from(actualKeyData, 'hex'), iv);

    let encrypted = cipher.update(data, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    const tag = cipher.getAuthTag();

    // Update key usage
    key.lastUsed = Date.now();
    key.usageCount++;

    return {
      encryptedData: encrypted,
      iv: iv.toString('hex'),
      tag: tag.toString('hex'),
      keyId: key.keyId,
      algorithm: key.algorithm,
      classification,
      timestamp: Date.now()
    };
  }

  /**
   * Decrypt mobile data
   */
  public async decryptMobileData(
    encryptedData: {
      encryptedData: string;
      iv: string;
      tag: string;
      keyId: string;
      algorithm: string;
      classification: DataClassification;
      timestamp: number;
    }
  ): Promise<string> {
    const key = this.encryptionKeys.get(encryptedData.keyId);
    if (!key) {
      throw new Error(`Encryption key not found: ${encryptedData.keyId}`);
    }

    if (key.status === 'revoked') {
      throw new Error(`Encryption key has been revoked: ${encryptedData.keyId}`);
    }

    const actualKeyData = await dataEncryption.decryptSecret(key.keyData);
    const iv = Buffer.from(encryptedData.iv, 'hex');
    const tag = Buffer.from(encryptedData.tag, 'hex');

    try {
      const decipher = createDecipheriv(
        encryptedData.algorithm,
        Buffer.from(actualKeyData, 'hex'),
        iv
      );

      decipher.setAuthTag(tag);

      let decrypted = decipher.update(encryptedData.encryptedData, 'hex', 'utf8');
      decrypted += decipher.final('utf8');

      // Update key usage
      key.lastUsed = Date.now();
      key.usageCount++;

      return decrypted;
    } catch (error) {
      throw new Error(`Decryption failed: ${error.message}`);
    }
  }

  /**
   * Store data securely
   */
  public async storeSecurely(
    key: string,
    value: string,
    classification: DataClassification,
    deviceId: string,
    platform: Platform,
    expiresAt?: number
  ): Promise<string> {
    const entryId = this.generateEntryId();
    const keyId = await this.getOrCreateDeviceKey(deviceId, platform);

    const encryptedValue = await this.encryptMobileData(value, keyId, classification);

    const entry: SecureStorageEntry = {
      id: entryId,
      key,
      value: JSON.stringify(encryptedValue),
      classification,
      encrypted: true,
      keyId,
      platform,
      deviceId,
      accessAttempts: 0,
      maxAccessAttempts: 5,
      locked: false,
      createdAt: Date.now(),
      lastAccessed: Date.now(),
      expiresAt,
      accessLog: []
    };

    this.secureStorage.set(entryId, entry);
    console.log(`Secure storage entry created: ${key} (${classification})`);

    return entryId;
  }

  /**
   * Retrieve securely stored data
   */
  public async retrieveSecurely(entryId: string, source: string = 'unknown'): Promise<string | null> {
    const entry = this.secureStorage.get(entryId);
    if (!entry) {
      return null;
    }

    // Check if entry is locked
    if (entry.locked) {
      if (entry.lockUntil && Date.now() < entry.lockUntil) {
        throw new Error('Secure storage entry is temporarily locked');
      } else {
        // Unlock if lock period has expired
        entry.locked = false;
        entry.accessAttempts = 0;
      }
    }

    // Check expiration
    if (entry.expiresAt && Date.now() > entry.expiresAt) {
      this.secureStorage.delete(entryId);
      return null;
    }

    try {
      const encryptedData = JSON.parse(entry.value);
      const decryptedValue = await this.decryptMobileData(encryptedData);

      // Log successful access
      entry.accessLog.push({
        timestamp: Date.now(),
        success: true,
        source
      });
      entry.lastAccessed = Date.now();
      entry.accessAttempts = 0;

      return decryptedValue;
    } catch (error) {
      // Log failed access
      entry.accessLog.push({
        timestamp: Date.now(),
        success: false,
        source
      });
      entry.accessAttempts++;

      // Lock entry if too many failed attempts
      if (entry.accessAttempts >= entry.maxAccessAttempts) {
        entry.locked = true;
        entry.lockUntil = Date.now() + (30 * 60 * 1000); // 30 minutes
        console.warn(`Secure storage entry locked due to too many failed attempts: ${entryId}`);
      }

      throw new Error(`Failed to retrieve secure data: ${error.message}`);
    }
  }

  /**
   * Verify certificate pinning
   */
  public async verifyCertificatePinning(
    domain: string,
    certificateChain: string[]
  ): Promise<{
    valid: boolean;
    publicKeyHash?: string;
    matchedBackup?: boolean;
    error?: string;
  }> {
    const config = this.certificatePins.get(domain);
    if (!config) {
      return {
        valid: false,
        error: 'No certificate pinning configuration found for domain'
      };
    }

    // Extract public key hash from certificate (simplified)
    const publicKeyHash = this.extractPublicKeyHash(certificateChain[0]);
    if (!publicKeyHash) {
      return {
        valid: false,
        error: 'Unable to extract public key hash from certificate'
      };
    }

    // Check against primary hashes
    const primaryMatch = config.publicKeyHashes.includes(publicKeyHash);
    if (primaryMatch) {
      return {
        valid: true,
        publicKeyHash
      };
    }

    // Check against backup hashes
    const backupMatch = config.backupPublicKeyHashes.includes(publicKeyHash);
    if (backupMatch) {
      console.warn(`Certificate pinning matched backup hash for ${domain}`);
      return {
        valid: true,
        publicKeyHash,
        matchedBackup: true
      };
    }

    if (config.enforced) {
      return {
        valid: false,
        error: `Certificate pinning verification failed for ${domain}`
      };
    } else {
      // Report only mode - log but don't fail
      console.warn(`Certificate pinning violation detected for ${domain} - hash: ${publicKeyHash}`);
      return {
        valid: true,
        publicKeyHash,
        error: 'Certificate pinning violation (report-only mode)'
      };
    }
  }

  /**
   * Create encrypted backup
   */
  public async createSecureBackup(
    userId: string,
    deviceId: string,
    platform: Platform,
    backupType: BackupType,
    data: any,
    schedule?: string
  ): Promise<BackupConfiguration> {
    const backupId = this.generateBackupId();
    const keyId = await this.getOrCreateDeviceKey(deviceId, platform);

    // Classify and encrypt different data types
    const classifiedData = await this.classifyAndEncryptData(data, keyId);

    const backupData = {
      id: backupId,
      userId,
      deviceId,
      platform,
      timestamp: Date.now(),
      version: '1.0',
      data: classifiedData
    };

    const serializedBackup = JSON.stringify(backupData);
    const encryptedBackup = await this.encryptMobileData(serializedBackup, keyId, 'confidential');

    const backupConfig: BackupConfiguration = {
      backupId,
      userId,
      deviceId,
      platform,
      backupType,
      encrypted: true,
      compressionEnabled: true,
      incrementalBackup: true,
      schedule: schedule || '0 2 * * *', // Daily at 2 AM
      retentionDays: this.getRetentionDaysForData(data),
      includesPII: this.includesPII(data),
      includesHealthData: this.includesHealthData(data),
      includesPaymentData: this.includesPaymentData(data),
      lastBackup: Date.now(),
      nextBackup: this.calculateNextBackup(schedule || '0 2 * * *')
    };

    // Store backup configuration
    this.backupConfigurations.set(backupId, backupConfig);

    // In a real implementation, upload to the appropriate backup service
    await this.uploadBackup(backupId, encryptedBackup, backupType);

    console.log(`Secure backup created: ${backupId} (${backupType})`);

    return backupConfig;
  }

  /**
   * Restore from secure backup
   */
  public async restoreFromSecureBackup(
    backupId: string,
    deviceId: string,
    platform: Platform
  ): Promise<any> {
    const backupConfig = this.backupConfigurations.get(backupId);
    if (!backupConfig) {
      throw new Error(`Backup configuration not found: ${backupId}`);
    }

    if (backupConfig.deviceId !== deviceId) {
      throw new Error('Backup device mismatch');
    }

    // Download encrypted backup (in a real implementation)
    const encryptedBackup = await this.downloadBackup(backupId, backupConfig.backupType);

    // Get decryption key
    const keyId = await this.getOrCreateDeviceKey(deviceId, platform);
    const decryptedBackup = await this.decryptMobileData(encryptedBackup);

    const backupData = JSON.parse(decryptedBackup);

    // Verify backup integrity
    if (!this.verifyBackupIntegrity(backupData)) {
      throw new Error('Backup integrity verification failed');
    }

    console.log(`Secure backup restored: ${backupId}`);

    return backupData.data;
  }

  /**
   * Sanitize data for logging/analytics
   */
  public sanitizeData(data: string, context: string, classification: DataClassification = 'internal'): string {
    let sanitizedData = data;

    for (const rule of this.sanitizationRules) {
      if (rule.enabled &&
          rule.classification.includes(classification) &&
          rule.contexts.includes(context)) {
        sanitizedData = sanitizedData.replace(rule.pattern, rule.replacement);
      }
    }

    return sanitizedData;
  }

  /**
   * Securely delete data
   */
  public async secureDelete(entryId: string, userId: string): Promise<boolean> {
    const entry = this.secureStorage.get(entryId);
    if (!entry) {
      return false;
    }

    // Verify ownership (simplified - in production, implement proper authorization)
    // This would require storing userId with the entry

    // Perform secure deletion
    this.secureStorage.delete(entryId);

    // Log deletion for audit trail
    console.log(`Secure data deleted: ${entryId} by ${userId}`);

    return true;
  }

  /**
   * Get or create device encryption key
   */
  private async getOrCreateDeviceKey(deviceId: string, platform: Platform): Promise<string> {
    // Look for existing active key
    const existingKeys = Array.from(this.encryptionKeys.values())
      .filter(key =>
        key.deviceId === deviceId &&
        key.platform === platform &&
        key.status === 'active' &&
        Date.now() < key.expiresAt
      )
      .sort((a, b) => b.lastUsed - a.lastUsed);

    if (existingKeys.length > 0) {
      return existingKeys[0].keyId;
    }

    // Create new key
    const newKey = await this.generateMobileKey(platform, deviceId);
    return newKey.keyId;
  }

  /**
   * Classify and encrypt data by type
   */
  private async classifyAndEncryptData(data: any, keyId: string): Promise<any> {
    const classifiedData: any = {};

    for (const [key, value] of Object.entries(data)) {
      const classification = this.classifyData(key, value);

      if (classification === 'restricted' || classification === 'confidential') {
        classifiedData[key] = {
          type: 'encrypted',
          classification,
          data: await this.encryptMobileData(JSON.stringify(value), keyId, classification)
        };
      } else {
        classifiedData[key] = {
          type: 'plain',
          classification,
          data: value
        };
      }
    }

    return classifiedData;
  }

  /**
   * Classify data by key name and content
   */
  private classifyData(key: string, value: any): DataClassification {
    const keyLower = key.toLowerCase();

    // Restricted data
    if (keyLower.includes('ssn') ||
        keyLower.includes('credit') ||
        keyLower.includes('card') ||
        keyLower.includes('payment') ||
        keyLower.includes('health') ||
        keyLower.includes('medical')) {
      return 'restricted';
    }

    // Confidential data
    if (keyLower.includes('email') ||
        keyLower.includes('phone') ||
        keyLower.includes('address') ||
        keyLower.includes('name') ||
        keyLower.includes('booking')) {
      return 'confidential';
    }

    // Internal data
    if (keyLower.includes('analytics') ||
        keyLower.includes('usage') ||
        keyLower.includes('preferences')) {
      return 'internal';
    }

    return 'public';
  }

  /**
   * Check if data includes PII
   */
  private includesPII(data: any): boolean {
    for (const key of Object.keys(data)) {
      if (this.classifyData(key, data[key]) === 'confidential' ||
          this.classifyData(key, data[key]) === 'restricted') {
        return true;
      }
    }
    return false;
  }

  /**
   * Check if data includes health information
   */
  private includesHealthData(data: any): boolean {
    return Object.keys(data).some(key =>
      key.toLowerCase().includes('health') ||
      key.toLowerCase().includes('medical')
    );
  }

  /**
   * Check if data includes payment information
   */
  private includesPaymentData(data: any): boolean {
    return Object.keys(data).some(key =>
      key.toLowerCase().includes('payment') ||
      key.toLowerCase().includes('card') ||
      key.toLowerCase().includes('billing')
    );
  }

  /**
   * Get retention days for data based on content
   */
  private getRetentionDaysForData(data: any): number {
    if (this.includesPaymentData(data)) {
      return 3650; // 10 years for payment data
    }
    if (this.includesHealthData(data)) {
      return 2555; // 7 years for health data
    }
    if (this.includesPII(data)) {
      return 2555; // 7 years for PII
    }
    return 730; // 2 years default
  }

  /**
   * Extract public key hash from certificate (simplified)
   */
  private extractPublicKeyHash(certificate: string): string | null {
    // In a real implementation, parse the certificate and extract the public key hash
    // This is a placeholder implementation
    return 'sha256/PLACEHOLDER_PUBLIC_KEY_HASH=';
  }

  /**
   * Upload backup to storage service (placeholder)
   */
  private async uploadBackup(backupId: string, encryptedData: any, backupType: BackupType): Promise<void> {
    // In a real implementation, upload to the appropriate service
    console.log(`Backup ${backupId} uploaded to ${backupType}`);
  }

  /**
   * Download backup from storage service (placeholder)
   */
  private async downloadBackup(backupId: string, backupType: BackupType): Promise<any> {
    // In a real implementation, download from the appropriate service
    console.log(`Backup ${backupId} downloaded from ${backupType}`);
    return {
      encryptedData: 'placeholder_encrypted_data',
      iv: 'placeholder_iv',
      tag: 'placeholder_tag',
      keyId: 'placeholder_key_id',
      algorithm: 'AES-256-GCM',
      classification: 'confidential',
      timestamp: Date.now()
    };
  }

  /**
   * Verify backup integrity
   */
  private verifyBackupIntegrity(backupData: any): boolean {
    // Implement backup integrity verification
    return backupData && backupData.id && backupData.version;
  }

  /**
   * Calculate next backup time from cron expression
   */
  private calculateNextBackup(cronExpression: string): number {
    // Simplified cron parsing - in production, use a proper cron library
    const now = new Date();
    const nextBackup = new Date(now.getTime() + (24 * 60 * 60 * 1000)); // Next day
    return nextBackup.getTime();
  }

  /**
   * Start key rotation process
   */
  private startKeyRotation(): void {
    // Check for key rotation daily
    setInterval(async () => {
      const now = Date.now();
      const keysToRotate: string[] = [];

      for (const [keyId, key] of this.encryptionKeys.entries()) {
        if (now > key.expiresAt || key.usageCount >= key.maxUsage) {
          keysToRotate.push(keyId);
        }
      }

      for (const keyId of keysToRotate) {
        const key = this.encryptionKeys.get(keyId);
        if (key) {
          key.status = 'deprecated';
          console.log(`Encryption key deprecated: ${keyId}`);
        }
      }
    }, 24 * 60 * 60 * 1000); // Daily
  }

  /**
   * Start data cleanup process
   */
  private startDataCleanup(): void {
    // Clean up expired data hourly
    setInterval(async () => {
      const now = Date.now();

      // Clean up expired secure storage entries
      for (const [entryId, entry] of this.secureStorage.entries()) {
        if (entry.expiresAt && now > entry.expiresAt) {
          this.secureStorage.delete(entryId);
          console.log(`Expired secure storage entry cleaned up: ${entryId}`);
        }
      }

      // Clean up expired encryption keys
      const thirtyDaysAgo = now - (30 * 24 * 60 * 60 * 1000);
      for (const [keyId, key] of this.encryptionKeys.entries()) {
        if (key.status === 'deprecated' && now > key.expiresAt + thirtyDaysAgo) {
          this.encryptionKeys.delete(keyId);
          console.log(`Deprecated encryption key cleaned up: ${keyId}`);
        }
      }
    }, 60 * 60 * 1000); // Hourly
  }

  /**
   * Generate unique IDs
   */
  private generateKeyId(): string {
    return `mobile_key_${Date.now()}_${randomBytes(8).toString('hex')}`;
  }

  private generateEntryId(): string {
    return `storage_${Date.now()}_${randomBytes(8).toString('hex')}`;
  }

  private generateBackupId(): string {
    return `backup_${Date.now()}_${randomBytes(8).toString('hex')}`;
  }

  /**
   * Public API methods
   */
  public getEncryptionKey(keyId: string): MobileEncryptionKey | undefined {
    return this.encryptionKeys.get(keyId);
  }

  public getSecureStorageEntry(entryId: string): SecureStorageEntry | undefined {
    return this.secureStorage.get(entryId);
  }

  public getBackupConfiguration(backupId: string): BackupConfiguration | undefined {
    return this.backupConfigurations.get(backupId);
  }

  public getCertificatePinningConfig(domain: string): CertificatePinningConfig | undefined {
    return this.certificatePins.get(domain);
  }

  public async revokeKey(keyId: string): Promise<void> {
    const key = this.encryptionKeys.get(keyId);
    if (key) {
      key.status = 'revoked';
      console.log(`Encryption key revoked: ${keyId}`);
    }
  }

  public getEncryptionStatistics(): {
    totalKeys: number;
    activeKeys: number;
    totalStorageEntries: number;
    encryptedEntries: number;
    totalBackups: number;
    expiredEntries: number;
  } {
    const now = Date.now();
    const keys = Array.from(this.encryptionKeys.values());
    const entries = Array.from(this.secureStorage.values());
    const backups = Array.from(this.backupConfigurations.values());

    return {
      totalKeys: keys.length,
      activeKeys: keys.filter(k => k.status === 'active').length,
      totalStorageEntries: entries.length,
      encryptedEntries: entries.filter(e => e.encrypted).length,
      totalBackups: backups.length,
      expiredEntries: entries.filter(e => e.expiresAt && now > e.expiresAt).length
    };
  }
}

// Singleton instance
const mobileDataProtection = new MobileDataProtection();

// Export class and utilities
export {
  MobileDataProtection,
  type MobileEncryptionKey,
  type SecureStorageEntry,
  type CertificatePinningConfig,
  type BackupConfiguration,
  type DataClassification,
  type StorageSecurity,
  type BackupType
};

// Export utility functions
export const generateMobileKey = (platform: Platform, deviceId: string, storageSecurity?: StorageSecurity) =>
  mobileDataProtection.generateMobileKey(platform, deviceId, storageSecurity);

export const encryptMobileData = (data: string, keyId: string, classification?: DataClassification) =>
  mobileDataProtection.encryptMobileData(data, keyId, classification);

export const decryptMobileData = (encryptedData: any) =>
  mobileDataProtection.decryptMobileData(encryptedData);

export const storeSecurely = (key: string, value: string, classification: DataClassification, deviceId: string, platform: Platform, expiresAt?: number) =>
  mobileDataProtection.storeSecurely(key, value, classification, deviceId, platform, expiresAt);

export const retrieveSecurely = (entryId: string, source?: string) =>
  mobileDataProtection.retrieveSecurely(entryId, source);

export const verifyCertificatePinning = (domain: string, certificateChain: string[]) =>
  mobileDataProtection.verifyCertificatePinning(domain, certificateChain);

export const createSecureBackup = (userId: string, deviceId: string, platform: Platform, backupType: BackupType, data: any, schedule?: string) =>
  mobileDataProtection.createSecureBackup(userId, deviceId, platform, backupType, data, schedule);

export const restoreFromSecureBackup = (backupId: string, deviceId: string, platform: Platform) =>
  mobileDataProtection.restoreFromSecureBackup(backupId, deviceId, platform);

export const sanitizeData = (data: string, context: string, classification?: DataClassification) =>
  mobileDataProtection.sanitizeData(data, context, classification);

export const secureDelete = (entryId: string, userId: string) =>
  mobileDataProtection.secureDelete(entryId, userId);

export const getMobileDataProtectionStatistics = () =>
  mobileDataProtection.getEncryptionStatistics();