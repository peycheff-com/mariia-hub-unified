/**
 * Mobile Device Security Integration System
 *
 * Comprehensive device security implementation including device attestation,
 * jailbreak/root detection, app lifecycle management, and mobile threat defense
 * integration for iOS and Android platforms.
 */

import { createHash, createHmac, randomBytes } from 'crypto';
import { dataEncryption } from './data-encryption';
import { mobileDataProtection } from './mobile-data-protection';

// Platform types
type Platform = 'ios' | 'android';

// Device security status
type DeviceSecurityStatus = 'trusted' | 'untrusted' | 'compromised' | 'unknown';

// App integrity status
type AppIntegrityStatus = 'verified' | 'tampered' | 'repackaged' | 'debug' | 'unknown';

// Jailbreak/root detection results
interface JailbreakDetectionResult {
  platform: Platform;
  jailbroken: boolean;
  rooted: boolean;
  indicators: string[];
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  timestamp: number;
  details: {
    ios?: {
      cydiaInstalled: boolean;
      unusualFiles: string[];
      suspiciousProcesses: string[];
      systemIntegrity: boolean;
    };
    android?: {
      suBinary: boolean;
      superuserApps: string[];
      systemProps: string[];
      bootloaderUnlocked: boolean;
      developerOptions: boolean;
    };
  };
}

// Device attestation result
interface DeviceAttestationResult {
  deviceId: string;
  platform: Platform;
  attestationValid: boolean;
  nonce: string;
  timestamp: number;
  certificateChain: string[];
  payloadHash: string;
  securityLevel: 'basic' | 'standard' | 'high';
  integrityChecks: {
    bootloaderLocked: boolean;
    deviceIntegrity: boolean;
    verifiedBoot: boolean;
    patchLevel: string;
    securityPatchLevel: string;
  };
  appIntegrity: AppIntegrityStatus;
 CTSProfileMatch: boolean; // Android only
  basicIntegrity: boolean; // Android only
}

// App hardening configuration
interface AppHardeningConfig {
  obfuscationLevel: 'none' | 'basic' | 'advanced' | 'maximum';
  antiDebugging: boolean;
  antiTampering: boolean;
  antiEmulation: boolean;
  rootDetection: boolean;
  sslPinning: boolean;
  codeEncryption: boolean;
  integrityChecks: boolean;
  runtimeProtection: boolean;
}

// Mobile threat defense integration
interface MobileThreatDefenseConfig {
  provider: string;
  apiKey: string;
  endpoint: string;
  realTimeProtection: boolean;
  behavioralAnalysis: boolean;
  networkThreatDetection: boolean;
  appThreatDetection: boolean;
  deviceThreatDetection: boolean;
  automaticQuarantine: boolean;
}

// Device security profile
interface DeviceSecurityProfile {
  deviceId: string;
  platform: Platform;
  userId?: string;
  securityStatus: DeviceSecurityStatus;
  lastAssessment: number;
  assessmentInterval: number; // milliseconds
  jailbreakDetection: JailbreakDetectionResult;
  deviceAttestation: DeviceAttestationResult;
  appHardening: AppHardeningConfig;
  threatDefenseConfig?: MobileThreatDefenseConfig;
  securityScore: number; // 0-100
  trustLevel: 'low' | 'medium' | 'high' | 'maximum';
  securityEvents: DeviceSecurityEvent[];
  allowedFeatures: string[];
  restrictedFeatures: string[];
}

// Device security event
interface DeviceSecurityEvent {
  eventId: string;
  deviceId: string;
  userId?: string;
  type: 'jailbreak_detected' | 'root_detected' | 'app_tampering' | 'malware_detected' | 'unusual_behavior' | 'integrity_failure';
  severity: 'low' | 'medium' | 'high' | 'critical';
  timestamp: number;
  description: string;
  details: Record<string, any>;
  actions: string[];
  resolved: boolean;
  resolvedAt?: number;
}

// App lifecycle security event
interface AppLifecycleEvent {
  eventId: string;
  deviceId: string;
  userId?: string;
  eventType: 'app_installed' | 'app_updated' | 'app_uninstalled' | 'app_launched' | 'app_backgrounded' | 'app_terminated';
  timestamp: number;
  packageName: string;
  version: string;
  integrity: AppIntegrityStatus;
  securityImplications: string[];
}

// Device compliance check
interface ComplianceCheck {
  checkId: string;
  deviceId: string;
  checkType: 'os_version' | 'security_patch' | 'device_encryption' | 'screen_lock' | 'developer_options' | 'usb_debugging';
  result: 'pass' | 'fail' | 'warning';
  details: string;
  timestamp: number;
  required: boolean;
}

class MobileDeviceSecurity {
  private deviceProfiles: Map<string, DeviceSecurityProfile> = new Map();
  private securityEvents: DeviceSecurityEvent[] = [];
  private lifecycleEvents: AppLifecycleEvent[] = [];
  private complianceChecks: Map<string, ComplianceCheck[]> = new Map();
  private trustedCertificates: Set<string> = new Set();
  private knownMalwareHashes: Set<string> = new Set();

  constructor() {
    this.initializeTrustedCertificates();
    this.initializeMalwareDatabase();
    this.startContinuousMonitoring();
    console.log('Mobile device security system initialized');
  }

  /**
   * Initialize trusted certificates for attestation
   */
  private initializeTrustedCertificates(): void {
    // Google SafetyNet attestation certificates (Android)
    const androidCertificates = [
      'MIIFQzCCAyugAwIBAgIJANLr9D8X6s3xMA0GCSqGSIb3DQEBCwUAMBgx',
      'MIIEIzCCAwugAwIBAgIJAKm5b9J71LsOMA0GCSqGSIb3DQEBCwUAMBQxEjAQ'
    ];

    // Apple DeviceCheck certificates (iOS)
    const iosCertificates = [
      'MIIFQzCCAyugAwIBAgIJANLr9D8X6s3xMA0GCSqGSIb3DQEBCwUAMBgx',
      'MIIEIzCCAwugAwIBAgIJAKm5b9J71LsOMA0GCSqGSIb3DQEBCwUAMBQxEjAQ'
    ];

    [...androidCertificates, ...iosCertificates].forEach(cert => {
      this.trustedCertificates.add(cert);
    });
  }

  /**
   * Initialize malware hash database
   */
  private initializeMalwareDatabase(): void {
    // Initialize with known malware hashes (simplified)
    const malwareHashes = [
      'a1b2c3d4e5f6789012345678901234567890abcdef', // Example malware hash
      'f1e2d3c4b5a6978012345678901234567890fedcba',
      'b2c3d4e5f6a789012345678901234567890abcdef12'
    ];

    malwareHashes.forEach(hash => {
      this.knownMalwareHashes.add(hash);
    });
  }

  /**
   * Register device for security monitoring
   */
  public async registerDevice(
    deviceId: string,
    platform: Platform,
    userId?: string,
    appHardening?: Partial<AppHardeningConfig>
  ): Promise<DeviceSecurityProfile> {
    const profile: DeviceSecurityProfile = {
      deviceId,
      platform,
      userId,
      securityStatus: 'unknown',
      lastAssessment: Date.now(),
      assessmentInterval: 5 * 60 * 1000, // 5 minutes
      jailbreakDetection: await this.performJailbreakDetection(deviceId, platform),
      deviceAttestation: await this.performDeviceAttestation(deviceId, platform),
      appHardening: {
        obfuscationLevel: 'advanced',
        antiDebugging: true,
        antiTampering: true,
        antiEmulation: true,
        rootDetection: true,
        sslPinning: true,
        codeEncryption: true,
        integrityChecks: true,
        runtimeProtection: true,
        ...appHardening
      },
      securityScore: 0,
      trustLevel: 'low',
      securityEvents: [],
      allowedFeatures: ['basic_features'],
      restrictedFeatures: []
    };

    // Calculate initial security score
    profile.securityScore = this.calculateSecurityScore(profile);
    profile.trustLevel = this.calculateTrustLevel(profile.securityScore);
    profile.securityStatus = this.determineSecurityStatus(profile);

    this.deviceProfiles.set(deviceId, profile);

    // Perform initial compliance checks
    await this.performComplianceChecks(deviceId, platform);

    console.log(`Device registered for security monitoring: ${deviceId} (${platform})`);

    return profile;
  }

  /**
   * Perform jailbreak/root detection
   */
  public async performJailbreakDetection(deviceId: string, platform: Platform): Promise<JailbreakDetectionResult> {
    const indicators: string[] = [];
    const riskScores: number[] = [];
    const now = Date.now();

    const result: JailbreakDetectionResult = {
      platform,
      jailbroken: false,
      rooted: false,
      indicators: [],
      riskLevel: 'low',
      timestamp: now,
      details: {}
    };

    if (platform === 'ios') {
      const iosDetails = await this.checkIOSJailbreak(deviceId);
      result.details.ios = iosDetails;

      if (iosDetails.cydiaInstalled) {
        indicators.push('Cydia installed');
        riskScores.push(40);
      }

      if (iosDetails.unusualFiles.length > 0) {
        indicators.push(`Unusual files detected: ${iosDetails.unusualFiles.join(', ')}`);
        riskScores.push(30);
      }

      if (iosDetails.suspiciousProcesses.length > 0) {
        indicators.push(`Suspicious processes: ${iosDetails.suspiciousProcesses.join(', ')}`);
        riskScores.push(25);
      }

      if (!iosDetails.systemIntegrity) {
        indicators.push('System integrity compromised');
        riskScores.push(50);
      }

      result.jailbroken = riskScores.some(score => score >= 30);

    } else if (platform === 'android') {
      const androidDetails = await this.checkAndroidRoot(deviceId);
      result.details.android = androidDetails;

      if (androidDetails.suBinary) {
        indicators.push('SU binary found');
        riskScores.push(50);
      }

      if (androidDetails.superuserApps.length > 0) {
        indicators.push(`Superuser apps detected: ${androidDetails.superuserApps.join(', ')}`);
        riskScores.push(40);
      }

      if (androidDetails.systemProps.length > 0) {
        indicators.push(`Suspicious system properties: ${androidDetails.systemProps.join(', ')}`);
        riskScores.push(30);
      }

      if (androidDetails.bootloaderUnlocked) {
        indicators.push('Bootloader unlocked');
        riskScores.push(35);
      }

      if (androidDetails.developerOptions) {
        indicators.push('Developer options enabled');
        riskScores.push(15);
      }

      result.rooted = riskScores.some(score => score >= 30);
    }

    result.indicators = indicators;
    const totalRiskScore = riskScores.reduce((sum, score) => sum + score, 0);

    if (totalRiskScore >= 75) {
      result.riskLevel = 'critical';
    } else if (totalRiskScore >= 50) {
      result.riskLevel = 'high';
    } else if (totalRiskScore >= 25) {
      result.riskLevel = 'medium';
    } else {
      result.riskLevel = 'low';
    }

    // Create security event if jailbreak/root detected
    if (result.jailbroken || result.rooted) {
      this.createSecurityEvent({
        deviceId,
        type: result.jailbroken ? 'jailbreak_detected' : 'root_detected',
        severity: result.riskLevel as 'medium' | 'high' | 'critical',
        description: `${platform === 'ios' ? 'Jailbreak' : 'Root'} detected on device`,
        details: {
          indicators,
          riskLevel: result.riskLevel,
          platform
        },
        actions: ['restrict_access', 'notify_admin', 'log_details']
      });
    }

    return result;
  }

  /**
   * Perform device attestation
   */
  public async performDeviceAttestation(deviceId: string, platform: Platform): Promise<DeviceAttestationResult> {
    const nonce = randomBytes(32).toString('hex');
    const timestamp = Date.now();

    const result: DeviceAttestationResult = {
      deviceId,
      platform,
      attestationValid: false,
      nonce,
      timestamp,
      certificateChain: [],
      payloadHash: '',
      securityLevel: 'basic',
      integrityChecks: {
        bootloaderLocked: false,
        deviceIntegrity: false,
        verifiedBoot: false,
        patchLevel: '',
        securityPatchLevel: ''
      },
      appIntegrity: 'unknown',
      CTSProfileMatch: false,
      basicIntegrity: false
    };

    try {
      if (platform === 'android') {
        // SafetyNet attestation (simplified)
        const safetyNetResult = await this.performSafetyNetAttestation(nonce);
        Object.assign(result, safetyNetResult);
      } else if (platform === 'ios') {
        // DeviceCheck attestation (simplified)
        const deviceCheckResult = await this.performDeviceCheckAttestation(nonce);
        Object.assign(result, deviceCheckResult);
      }

      // Verify certificate chain
      result.attestationValid = this.verifyAttestationCertificates(result.certificateChain);

      // Calculate security level
      if (result.attestationValid && result.integrityChecks.deviceIntegrity) {
        if (result.CTSProfileMatch || result.verifiedBoot) {
          result.securityLevel = 'high';
        } else {
          result.securityLevel = 'standard';
        }
      } else {
        result.securityLevel = 'basic';
      }

      // Verify app integrity
      result.appIntegrity = await this.verifyAppIntegrity(deviceId, platform);

    } catch (error) {
      console.error(`Device attestation failed for ${deviceId}:`, error);
      result.attestationValid = false;
      result.securityLevel = 'basic';
    }

    // Create security event if attestation fails
    if (!result.attestationValid) {
      this.createSecurityEvent({
        deviceId,
        type: 'integrity_failure',
        severity: 'high',
        description: 'Device attestation failed',
        details: {
          platform,
          securityLevel: result.securityLevel,
          error: error.message
        },
        actions: ['restrict_features', 'require_reauthentication']
      });
    }

    return result;
  }

  /**
   * Verify app integrity
   */
  public async verifyAppIntegrity(deviceId: string, platform: Platform): Promise<AppIntegrityStatus> {
    try {
      // Get app signature/hash
      const appHash = await this.getAppHash(deviceId, platform);

      // Check against known malware
      if (this.knownMalwareHashes.has(appHash)) {
        return 'repackaged';
      }

      // Verify against expected signature (simplified)
      const expectedHash = platform === 'ios'
        ? 'expected_ios_app_hash'
        : 'expected_android_app_hash';

      if (appHash === expectedHash) {
        return 'verified';
      }

      // Check if debug build
      const isDebug = await this.isDebugBuild(deviceId, platform);
      if (isDebug) {
        return 'debug';
      }

      return 'tampered';

    } catch (error) {
      console.error(`App integrity verification failed for ${deviceId}:`, error);
      return 'unknown';
    }
  }

  /**
   * Perform continuous security assessment
   */
  public async performSecurityAssessment(deviceId: string): Promise<{
    securityScore: number;
    trustLevel: 'low' | 'medium' | 'high' | 'maximum';
    securityStatus: DeviceSecurityStatus;
    recommendations: string[];
  }> {
    const profile = this.deviceProfiles.get(deviceId);
    if (!profile) {
      throw new Error(`Device profile not found: ${deviceId}`);
    }

    // Perform jailbreak detection
    profile.jailbreakDetection = await this.performJailbreakDetection(deviceId, profile.platform);
    profile.lastAssessment = Date.now();

    // Perform device attestation (less frequently)
    if (Date.now() - profile.deviceAttestation.timestamp > 60 * 60 * 1000) { // 1 hour
      profile.deviceAttestation = await this.performDeviceAttestation(deviceId, profile.platform);
    }

    // Verify app integrity
    profile.deviceAttestation.appIntegrity = await this.verifyAppIntegrity(deviceId, profile.platform);

    // Calculate security score
    profile.securityScore = this.calculateSecurityScore(profile);
    profile.trustLevel = this.calculateTrustLevel(profile.securityScore);
    profile.securityStatus = this.determineSecurityStatus(profile);

    // Update allowed/restricted features based on trust level
    this.updateFeatureAccess(profile);

    // Generate recommendations
    const recommendations = this.generateSecurityRecommendations(profile);

    console.log(`Security assessment completed for device ${deviceId}: Score ${profile.securityScore}, Status ${profile.securityStatus}`);

    return {
      securityScore: profile.securityScore,
      trustLevel: profile.trustLevel,
      securityStatus: profile.securityStatus,
      recommendations
    };
  }

  /**
   * Configure mobile threat defense
   */
  public configureThreatDefense(deviceId: string, config: MobileThreatDefenseConfig): void {
    const profile = this.deviceProfiles.get(deviceId);
    if (profile) {
      profile.threatDefenseConfig = config;
      console.log(`Threat defense configured for device ${deviceId}: ${config.provider}`);
    }
  }

  /**
   * Handle app lifecycle events
   */
  public async handleAppLifecycleEvent(
    deviceId: string,
    eventType: AppLifecycleEvent['eventType'],
    packageName: string,
    version: string,
    userId?: string
  ): Promise<void> {
    const profile = this.deviceProfiles.get(deviceId);
    if (!profile) {
      console.warn(`Device profile not found for lifecycle event: ${deviceId}`);
      return;
    }

    const event: AppLifecycleEvent = {
      eventId: this.generateEventId(),
      deviceId,
      userId,
      eventType,
      timestamp: Date.now(),
      packageName,
      version,
      integrity: await this.verifyAppIntegrity(deviceId, profile.platform),
      securityImplications: []
    };

    // Analyze security implications
    if (event.eventType === 'app_installed' || event.eventType === 'app_updated') {
      if (event.integrity === 'repackaged' || event.integrity === 'tampered') {
        event.securityImplications.push('Potential malware detected');
        this.createSecurityEvent({
          deviceId,
          userId,
          type: 'malware_detected',
          severity: 'high',
          description: `Suspicious app installed: ${packageName}`,
          details: {
            packageName,
            version,
            integrity: event.integrity
          },
          actions: ['quarantine_app', 'notify_user', 'scan_device']
        });
      }
    }

    this.lifecycleEvents.push(event);
    console.log(`App lifecycle event recorded: ${eventType} - ${packageName} v${version}`);
  }

  /**
   * Perform compliance checks
   */
  public async performComplianceChecks(deviceId: string, platform: Platform): Promise<ComplianceCheck[]> {
    const checks: ComplianceCheck[] = [];

    // OS version check
    checks.push(await this.checkOSVersion(deviceId, platform));

    // Security patch level check
    checks.push(await this.checkSecurityPatchLevel(deviceId, platform));

    // Device encryption check
    checks.push(await this.checkDeviceEncryption(deviceId, platform));

    // Screen lock check
    checks.push(await this.checkScreenLock(deviceId, platform));

    // Developer options check (Android)
    if (platform === 'android') {
      checks.push(await this.checkDeveloperOptions(deviceId));
    }

    // USB debugging check (Android)
    if (platform === 'android') {
      checks.push(await this.checkUSBDebugging(deviceId));
    }

    this.complianceChecks.set(deviceId, checks);

    // Log failed checks
    const failedChecks = checks.filter(check => check.result === 'fail');
    if (failedChecks.length > 0) {
      this.createSecurityEvent({
        deviceId,
        type: 'integrity_failure',
        severity: 'medium',
        description: 'Compliance check failures detected',
        details: {
          failedChecks: failedChecks.map(c => ({ type: c.checkType, details: c.details }))
        },
        actions: ['restrict_features', 'notify_user']
      });
    }

    return checks;
  }

  /**
   * iOS-specific jailbreak detection
   */
  private async checkIOSJailbreak(deviceId: string): Promise<JailbreakDetectionResult['details']['ios']> {
    // Simplified iOS jailbreak detection
    // In a real implementation, use proper iOS security APIs

    const unusualFiles = [
      '/Applications/Cydia.app',
      '/Library/MobileSubstrate/MobileSubstrate.dylib',
      '/bin/bash',
      '/usr/sbin/sshd',
      '/etc/apt',
      '/private/var/lib/apt/'
    ];

    const suspiciousProcesses = [
      'Cydia',
      'RockApp',
      'Icy',
      'BlackRa1n',
      'redsn0w'
    ];

    return {
      cydiaInstalled: false, // Would check via file system
      unusualFiles: [], // Would scan file system
      suspiciousProcesses: [], // Would check running processes
      systemIntegrity: true // Would verify system integrity
    };
  }

  /**
   * Android-specific root detection
   */
  private async checkAndroidRoot(deviceId: string): Promise<JailbreakDetectionResult['details']['android']> {
    // Simplified Android root detection
    // In a real implementation, use proper Android security APIs

    return {
      suBinary: false, // Would check for su binary
      superuserApps: [], // Would check for superuser apps
      systemProps: [], // Would check system properties
      bootloaderUnlocked: false, // Would check bootloader status
      developerOptions: false // Would check developer options
    };
  }

  /**
   * SafetyNet attestation (Android)
   */
  private async performSafetyNetAttestation(nonce: string): Promise<Partial<DeviceAttestationResult>> {
    // Simplified SafetyNet attestation
    // In a real implementation, use Google Play Integrity API

    return {
      certificateChain: ['placeholder_certificate_1', 'placeholder_certificate_2'],
      payloadHash: createHash('sha256').update(nonce).digest('hex'),
      integrityChecks: {
        bootloaderLocked: true,
        deviceIntegrity: true,
        verifiedBoot: true,
        patchLevel: '2023-12-01',
        securityPatchLevel: '2023-12-01'
      },
      CTSProfileMatch: true,
      basicIntegrity: true
    };
  }

  /**
   * DeviceCheck attestation (iOS)
   */
  private async performDeviceCheckAttestation(nonce: string): Promise<Partial<DeviceAttestationResult>> {
    // Simplified DeviceCheck attestation
    // In a real implementation, use Apple DeviceCheck API

    return {
      certificateChain: ['placeholder_certificate_1', 'placeholder_certificate_2'],
      payloadHash: createHash('sha256').update(nonce).digest('hex'),
      integrityChecks: {
        bootloaderLocked: true,
        deviceIntegrity: true,
        verifiedBoot: true,
        patchLevel: '2023-12-01',
        securityPatchLevel: '2023-12-01'
      }
    };
  }

  /**
   * Verify attestation certificates
   */
  private verifyAttestationCertificates(certificateChain: string[]): boolean {
    // Verify certificates against trusted certificates
    // In a real implementation, perform proper certificate chain validation
    return certificateChain.length > 0;
  }

  /**
   * Get app hash
   */
  private async getAppHash(deviceId: string, platform: Platform): Promise<string> {
    // Get app signature/hash
    // In a real implementation, extract from app bundle
    return 'placeholder_app_hash';
  }

  /**
   * Check if debug build
   */
  private async isDebugBuild(deviceId: string, platform: Platform): Promise<boolean> {
    // Check if app is running in debug mode
    // In a real implementation, check build flags and debugging status
    return false;
  }

  /**
   * Calculate security score
   */
  private calculateSecurityScore(profile: DeviceSecurityProfile): number {
    let score = 100;

    // Deduct for jailbreak/root
    if (profile.jailbreakDetection.jailbroken || profile.jailbreakDetection.rooted) {
      score -= 50;
    }

    // Deduct for failed attestation
    if (!profile.deviceAttestation.attestationValid) {
      score -= 30;
    }

    // Deduct for app integrity issues
    if (profile.deviceAttestation.appIntegrity !== 'verified') {
      switch (profile.deviceAttestation.appIntegrity) {
        case 'tampered':
          score -= 40;
          break;
        case 'repackaged':
          score -= 50;
          break;
        case 'debug':
          score -= 20;
          break;
      }
    }

    // Deduct for weak security level
    switch (profile.deviceAttestation.securityLevel) {
      case 'basic':
        score -= 20;
        break;
      case 'standard':
        score -= 10;
        break;
    }

    return Math.max(0, score);
  }

  /**
   * Calculate trust level
   */
  private calculateTrustLevel(score: number): 'low' | 'medium' | 'high' | 'maximum' {
    if (score >= 90) return 'maximum';
    if (score >= 70) return 'high';
    if (score >= 50) return 'medium';
    return 'low';
  }

  /**
   * Determine security status
   */
  private determineSecurityStatus(profile: DeviceSecurityProfile): DeviceSecurityStatus {
    if (profile.jailbreakDetection.jailbroken || profile.jailbreakDetection.rooted) {
      return 'compromised';
    }

    if (profile.deviceAttestation.appIntegrity === 'repackaged' ||
        profile.deviceAttestation.appIntegrity === 'tampered') {
      return 'untrusted';
    }

    if (profile.securityScore >= 80) {
      return 'trusted';
    }

    return 'unknown';
  }

  /**
   * Update feature access based on trust level
   */
  private updateFeatureAccess(profile: DeviceSecurityProfile): void {
    switch (profile.trustLevel) {
      case 'maximum':
        profile.allowedFeatures = ['all_features'];
        profile.restrictedFeatures = [];
        break;
      case 'high':
        profile.allowedFeatures = ['premium_features', 'booking', 'payments'];
        profile.restrictedFeatures = ['admin_features'];
        break;
      case 'medium':
        profile.allowedFeatures = ['basic_features', 'booking'];
        profile.restrictedFeatures = ['premium_features', 'payments', 'admin_features'];
        break;
      case 'low':
        profile.allowedFeatures = ['basic_features'];
        profile.restrictedFeatures = ['premium_features', 'payments', 'admin_features'];
        break;
    }

    // Additional restrictions for compromised devices
    if (profile.securityStatus === 'compromised') {
      profile.allowedFeatures = ['emergency_only'];
      profile.restrictedFeatures = ['all_sensitive_features'];
    }
  }

  /**
   * Generate security recommendations
   */
  private generateSecurityRecommendations(profile: DeviceSecurityProfile): string[] {
    const recommendations: string[] = [];

    if (profile.jailbreakDetection.jailbroken || profile.jailbreakDetection.rooted) {
      recommendations.push('Device is jailbroken/rooted - restore to factory settings');
    }

    if (profile.deviceAttestation.appIntegrity !== 'verified') {
      recommendations.push('App integrity compromised - reinstall from official store');
    }

    if (!profile.deviceAttestation.attestationValid) {
      recommendations.push('Device attestation failed - update OS and security patches');
    }

    if (profile.deviceAttestation.securityLevel === 'basic') {
      recommendations.push('Device security level is basic - enable enhanced security features');
    }

    if (profile.securityScore < 70) {
      recommendations.push('Security score is below recommended level - review security settings');
    }

    const complianceChecks = this.complianceChecks.get(profile.deviceId) || [];
    const failedChecks = complianceChecks.filter(check => check.result === 'fail');
    if (failedChecks.length > 0) {
      recommendations.push('Address compliance check failures');
    }

    return recommendations;
  }

  /**
   * Create security event
   */
  private createSecurityEvent(eventData: {
    deviceId: string;
    userId?: string;
    type: DeviceSecurityEvent['type'];
    severity: DeviceSecurityEvent['severity'];
    description: string;
    details: Record<string, any>;
    actions: string[];
  }): void {
    const event: DeviceSecurityEvent = {
      eventId: this.generateEventId(),
      timestamp: Date.now(),
      resolved: false,
      ...eventData
    };

    this.securityEvents.push(event);

    // Update device profile
    const profile = this.deviceProfiles.get(eventData.deviceId);
    if (profile) {
      profile.securityEvents.push(event);
    }

    console.log(`Device security event created: ${event.type} - ${event.description}`);
  }

  /**
   * Compliance check methods
   */
  private async checkOSVersion(deviceId: string, platform: Platform): Promise<ComplianceCheck> {
    // Check if OS version meets minimum requirements
    const minVersions = {
      ios: '15.0',
      android: '10.0'
    };

    const currentVersion = await this.getCurrentOSVersion(deviceId, platform);
    const isCompliant = this.compareVersions(currentVersion, minVersions[platform]) >= 0;

    return {
      checkId: this.generateEventId(),
      deviceId,
      checkType: 'os_version',
      result: isCompliant ? 'pass' : 'fail',
      details: `Current version: ${currentVersion}, Minimum required: ${minVersions[platform]}`,
      timestamp: Date.now(),
      required: true
    };
  }

  private async checkSecurityPatchLevel(deviceId: string, platform: Platform): Promise<ComplianceCheck> {
    // Check if security patches are up to date
    const currentPatchLevel = await this.getSecurityPatchLevel(deviceId, platform);
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

    const isCompliant = new Date(currentPatchLevel) >= threeMonthsAgo;

    return {
      checkId: this.generateEventId(),
      deviceId,
      checkType: 'security_patch',
      result: isCompliant ? 'pass' : 'warning',
      details: `Security patch level: ${currentPatchLevel}`,
      timestamp: Date.now(),
      required: true
    };
  }

  private async checkDeviceEncryption(deviceId: string, platform: Platform): Promise<ComplianceCheck> {
    // Check if device storage is encrypted
    const isEncrypted = await this.isDeviceEncrypted(deviceId, platform);

    return {
      checkId: this.generateEventId(),
      deviceId,
      checkType: 'device_encryption',
      result: isEncrypted ? 'pass' : 'fail',
      details: `Device encryption: ${isEncrypted ? 'enabled' : 'disabled'}`,
      timestamp: Date.now(),
      required: true
    };
  }

  private async checkScreenLock(deviceId: string, platform: Platform): Promise<ComplianceCheck> {
    // Check if screen lock is enabled
    const hasScreenLock = await this.hasScreenLock(deviceId, platform);

    return {
      checkId: this.generateEventId(),
      deviceId,
      checkType: 'screen_lock',
      result: hasScreenLock ? 'pass' : 'fail',
      details: `Screen lock: ${hasScreenLock ? 'enabled' : 'disabled'}`,
      timestamp: Date.now(),
      required: true
    };
  }

  private async checkDeveloperOptions(deviceId: string): Promise<ComplianceCheck> {
    // Check if developer options are enabled (Android only)
    const devOptionsEnabled = await this.isDeveloperOptionsEnabled(deviceId);

    return {
      checkId: this.generateEventId(),
      deviceId,
      checkType: 'developer_options',
      result: devOptionsEnabled ? 'warning' : 'pass',
      details: `Developer options: ${devOptionsEnabled ? 'enabled' : 'disabled'}`,
      timestamp: Date.now(),
      required: false
    };
  }

  private async checkUSBDebugging(deviceId: string): Promise<ComplianceCheck> {
    // Check if USB debugging is enabled (Android only)
    const usbDebuggingEnabled = await this.isUSBDebuggingEnabled(deviceId);

    return {
      checkId: this.generateEventId(),
      deviceId,
      checkType: 'usb_debugging',
      result: usbDebuggingEnabled ? 'warning' : 'pass',
      details: `USB debugging: ${usbDebuggingEnabled ? 'enabled' : 'disabled'}`,
      timestamp: Date.now(),
      required: false
    };
  }

  // Helper methods for compliance checks (placeholders)
  private async getCurrentOSVersion(deviceId: string, platform: Platform): Promise<string> {
    return platform === 'ios' ? '17.0' : '13.0';
  }

  private async getSecurityPatchLevel(deviceId: string, platform: Platform): Promise<string> {
    return '2023-12-01';
  }

  private async isDeviceEncrypted(deviceId: string, platform: Platform): Promise<boolean> {
    return true;
  }

  private async hasScreenLock(deviceId: string, platform: Platform): Promise<boolean> {
    return true;
  }

  private async isDeveloperOptionsEnabled(deviceId: string): Promise<boolean> {
    return false;
  }

  private async isUSBDebuggingEnabled(deviceId: string): Promise<boolean> {
    return false;
  }

  private compareVersions(version1: string, version2: string): number {
    const v1parts = version1.split('.').map(Number);
    const v2parts = version2.split('.').map(Number);

    for (let i = 0; i < Math.max(v1parts.length, v2parts.length); i++) {
      const v1part = v1parts[i] || 0;
      const v2part = v2parts[i] || 0;

      if (v1part > v2part) return 1;
      if (v1part < v2part) return -1;
    }

    return 0;
  }

  /**
   * Start continuous monitoring
   */
  private startContinuousMonitoring(): void {
    // Perform security assessments periodically
    setInterval(async () => {
      for (const [deviceId, profile] of this.deviceProfiles.entries()) {
        if (Date.now() - profile.lastAssessment > profile.assessmentInterval) {
          try {
            await this.performSecurityAssessment(deviceId);
          } catch (error) {
            console.error(`Security assessment failed for device ${deviceId}:`, error);
          }
        }
      }
    }, 60 * 1000); // Every minute

    // Clean up old events
    setInterval(() => {
      const oneWeekAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
      this.securityEvents = this.securityEvents.filter(event => event.timestamp > oneWeekAgo);
      this.lifecycleEvents = this.lifecycleEvents.filter(event => event.timestamp > oneWeekAgo);
    }, 60 * 60 * 1000); // Every hour
  }

  /**
   * Generate unique ID
   */
  private generateEventId(): string {
    return `event_${Date.now()}_${randomBytes(8).toString('hex')}`;
  }

  /**
   * Public API methods
   */
  public getDeviceProfile(deviceId: string): DeviceSecurityProfile | undefined {
    return this.deviceProfiles.get(deviceId);
  }

  public getSecurityEvents(deviceId?: string, limit?: number): DeviceSecurityEvent[] {
    let events = deviceId
      ? this.securityEvents.filter(e => e.deviceId === deviceId)
      : this.securityEvents;

    events = events.sort((a, b) => b.timestamp - a.timestamp);
    return limit ? events.slice(0, limit) : events;
  }

  public getComplianceChecks(deviceId: string): ComplianceCheck[] {
    return this.complianceChecks.get(deviceId) || [];
  }

  public getLifecycleEvents(deviceId?: string, limit?: number): AppLifecycleEvent[] {
    let events = deviceId
      ? this.lifecycleEvents.filter(e => e.deviceId === deviceId)
      : this.lifecycleEvents;

    events = events.sort((a, b) => b.timestamp - a.timestamp);
    return limit ? events.slice(0, limit) : events;
  }

  public async resolveSecurityEvent(eventId: string): Promise<boolean> {
    const event = this.securityEvents.find(e => e.eventId === eventId);
    if (event) {
      event.resolved = true;
      event.resolvedAt = Date.now();
      console.log(`Security event resolved: ${eventId}`);
      return true;
    }
    return false;
  }

  public getDeviceSecurityStatistics(): {
    totalDevices: number;
    trustedDevices: number;
    compromisedDevices: number;
    totalSecurityEvents: number;
    unresolvedEvents: number;
    averageSecurityScore: number;
  } {
    const profiles = Array.from(this.deviceProfiles.values());
    const trustedDevices = profiles.filter(p => p.securityStatus === 'trusted').length;
    const compromisedDevices = profiles.filter(p => p.securityStatus === 'compromised').length;
    const unresolvedEvents = this.securityEvents.filter(e => !e.resolved).length;
    const averageSecurityScore = profiles.length > 0
      ? profiles.reduce((sum, p) => sum + p.securityScore, 0) / profiles.length
      : 0;

    return {
      totalDevices: profiles.length,
      trustedDevices,
      compromisedDevices,
      totalSecurityEvents: this.securityEvents.length,
      unresolvedEvents,
      averageSecurityScore: Math.round(averageSecurityScore)
    };
  }
}

// Singleton instance
const mobileDeviceSecurity = new MobileDeviceSecurity();

// Export class and utilities
export {
  MobileDeviceSecurity,
  type DeviceSecurityProfile,
  type JailbreakDetectionResult,
  type DeviceAttestationResult,
  type AppHardeningConfig,
  type MobileThreatDefenseConfig,
  type DeviceSecurityEvent,
  type AppLifecycleEvent,
  type ComplianceCheck,
  type DeviceSecurityStatus,
  type AppIntegrityStatus,
  type Platform
};

// Export utility functions
export const registerDevice = (deviceId: string, platform: Platform, userId?: string, appHardening?: Partial<AppHardeningConfig>) =>
  mobileDeviceSecurity.registerDevice(deviceId, platform, userId, appHardening);

export const performJailbreakDetection = (deviceId: string, platform: Platform) =>
  mobileDeviceSecurity.performJailbreakDetection(deviceId, platform);

export const performDeviceAttestation = (deviceId: string, platform: Platform) =>
  mobileDeviceSecurity.performDeviceAttestation(deviceId, platform);

export const performSecurityAssessment = (deviceId: string) =>
  mobileDeviceSecurity.performSecurityAssessment(deviceId);

export const configureThreatDefense = (deviceId: string, config: MobileThreatDefenseConfig) =>
  mobileDeviceSecurity.configureThreatDefense(deviceId, config);

export const handleAppLifecycleEvent = (deviceId: string, eventType: AppLifecycleEvent['eventType'], packageName: string, version: string, userId?: string) =>
  mobileDeviceSecurity.handleAppLifecycleEvent(deviceId, eventType, packageName, version, userId);

export const performComplianceChecks = (deviceId: string, platform: Platform) =>
  mobileDeviceSecurity.performComplianceChecks(deviceId, platform);

export const getDeviceProfile = (deviceId: string) =>
  mobileDeviceSecurity.getDeviceProfile(deviceId);

export const getDeviceSecurityEvents = (deviceId?: string, limit?: number) =>
  mobileDeviceSecurity.getSecurityEvents(deviceId, limit);

export const getComplianceChecks = (deviceId: string) =>
  mobileDeviceSecurity.getComplianceChecks(deviceId);

export const resolveSecurityEvent = (eventId: string) =>
  mobileDeviceSecurity.resolveSecurityEvent(eventId);

export const getDeviceSecurityStatistics = () =>
  mobileDeviceSecurity.getDeviceSecurityStatistics();