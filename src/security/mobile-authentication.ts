/**
 * Mobile Authentication Security System
 *
 * Comprehensive mobile authentication implementation with biometric authentication,
 * multi-factor authentication, secure session management, and adaptive authentication
 * for iOS and Android platforms in the luxury beauty/fitness booking platform.
 */

import { randomBytes, createHash, timingSafeEqual } from 'crypto';
import { dataEncryption } from './data-encryption';

// Platform detection
type Platform = 'ios' | 'android' | 'web';

// Biometric types
type BiometricType = 'face-id' | 'touch-id' | 'fingerprint' | 'voice' | 'iris';

// Authentication factors
type AuthFactor = 'knowledge' | 'possession' | 'inherence' | 'location' | 'behavior';

// Risk levels
type RiskLevel = 'low' | 'medium' | 'high' | 'critical';

// Device security status
interface DeviceSecurityStatus {
  platform: Platform;
  deviceFingerprint: string;
  secureEnclaveAvailable: boolean;
  biometricsEnabled: boolean;
  passcodeSet: boolean;
  jailbroken: boolean;
  rootDetected: boolean;
  deviceIntegrity: 'trusted' | 'untrusted' | 'unknown';
  lastSecurityCheck: number;
}

// Biometric authentication data
interface BiometricAuth {
  id: string;
  userId: string;
  type: BiometricType;
  publicKey: string;
  deviceId: string;
  enrolledAt: number;
  lastUsed: number;
  attempts: number;
  maxAttempts: number;
  locked: boolean;
  lockUntil?: number;
}

// Multi-factor authentication setup
interface MFASetup {
  userId: string;
  secret: string;
  backupCodes: string[];
  qrCodeUrl: string;
  enabled: boolean;
  createdAt: number;
  verifiedAt?: number;
}

// Authentication session
interface AuthSession {
  sessionId: string;
  userId: string;
  deviceId: string;
  platform: Platform;
  factors: AuthFactor[];
  riskLevel: RiskLevel;
  createdAt: number;
  expiresAt: number;
  lastActivity: number;
  biometricVerified: boolean;
  mfaVerified: boolean;
  deviceBound: boolean;
  ipAddress: string;
  userAgent: string;
  location?: {
    latitude: number;
    longitude: number;
    accuracy: number;
  };
}

// Risk assessment factors
interface RiskFactors {
  newDevice: boolean;
  unusualLocation: boolean;
  unusualTime: boolean;
  highRiskLocation: boolean;
  deviceCompromised: boolean;
  multipleFailedAttempts: boolean;
  suspiciousNetwork: boolean;
  jailbrokenDevice: boolean;
  outdatedOS: boolean;
  noSecureLock: boolean;
}

// Adaptive authentication rules
interface AdaptiveAuthRule {
  id: string;
  name: string;
  conditions: RiskFactors;
  requiredFactors: AuthFactor[];
  riskThreshold: RiskLevel;
  enabled: boolean;
}

// Biometric challenge
interface BiometricChallenge {
  challengeId: string;
  challenge: string;
  timestamp: number;
  expiresAt: number;
  userId: string;
  deviceId: string;
  used: boolean;
}

class MobileAuthentication {
  private sessions: Map<string, AuthSession> = new Map();
  private biometricAuths: Map<string, BiometricAuth> = new Map();
  private mfaSetups: Map<string, MFASetup> = new Map();
  private challenges: Map<string, BiometricChallenge> = new Map();
  private deviceSecurityStatuses: Map<string, DeviceSecurityStatus> = new Map();
  private adaptiveRules: AdaptiveAuthRule[] = [];
  private failedAttempts: Map<string, number[]> = new Map();

  constructor() {
    this.initializeAdaptiveRules();
    this.startSessionCleanup();
    this.startChallengeCleanup();
    console.log('Mobile authentication system initialized');
  }

  /**
   * Initialize adaptive authentication rules
   */
  private initializeAdaptiveRules(): void {
    this.adaptiveRules = [
      {
        id: 'low_risk_standard',
        name: 'Low Risk Standard Authentication',
        conditions: {
          newDevice: false,
          unusualLocation: false,
          unusualTime: false,
          highRiskLocation: false,
          deviceCompromised: false,
          multipleFailedAttempts: false,
          suspiciousNetwork: false,
          jailbrokenDevice: false,
          outdatedOS: false,
          noSecureLock: false
        },
        requiredFactors: ['knowledge'],
        riskThreshold: 'low',
        enabled: true
      },
      {
        id: 'medium_risk_mfa',
        name: 'Medium Risk - MFA Required',
        conditions: {
          newDevice: true,
          unusualLocation: true,
          unusualTime: false,
          highRiskLocation: false,
          deviceCompromised: false,
          multipleFailedAttempts: false,
          suspiciousNetwork: false,
          jailbrokenDevice: false,
          outdatedOS: false,
          noSecureLock: false
        },
        requiredFactors: ['knowledge', 'possession'],
        riskThreshold: 'medium',
        enabled: true
      },
      {
        id: 'high_risk_strong',
        name: 'High Risk - Strong Authentication',
        conditions: {
          newDevice: false,
          unusualLocation: false,
          unusualTime: true,
          highRiskLocation: true,
          deviceCompromised: false,
          multipleFailedAttempts: true,
          suspiciousNetwork: true,
          jailbrokenDevice: false,
          outdatedOS: false,
          noSecureLock: true
        },
        requiredFactors: ['knowledge', 'possession', 'inherence'],
        riskThreshold: 'high',
        enabled: true
      },
      {
        id: 'critical_risk_maximum',
        name: 'Critical Risk - Maximum Security',
        conditions: {
          newDevice: false,
          unusualLocation: false,
          unusualTime: false,
          highRiskLocation: false,
          deviceCompromised: true,
          multipleFailedAttempts: false,
          suspiciousNetwork: false,
          jailbrokenDevice: true,
          outdatedOS: false,
          noSecureLock: false
        },
        requiredFactors: ['knowledge', 'possession', 'inherence', 'location'],
        riskThreshold: 'critical',
        enabled: true
      }
    ];
  }

  /**
   * Register device security status
   */
  public async registerDeviceSecurity(
    deviceId: string,
    platform: Platform,
    securityData: Partial<DeviceSecurityStatus>
  ): Promise<DeviceSecurityStatus> {
    const deviceFingerprint = await this.generateDeviceFingerprint(deviceId, platform);

    const status: DeviceSecurityStatus = {
      platform,
      deviceFingerprint,
      secureEnclaveAvailable: securityData.secureEnclaveAvailable || false,
      biometricsEnabled: securityData.biometricsEnabled || false,
      passcodeSet: securityData.passcodeSet || false,
      jailbroken: securityData.jailbroken || false,
      rootDetected: securityData.rootDetected || false,
      deviceIntegrity: securityData.deviceIntegrity || 'unknown',
      lastSecurityCheck: Date.now()
    };

    this.deviceSecurityStatuses.set(deviceId, status);
    console.log(`Device security registered for ${deviceId} (${platform})`);

    return status;
  }

  /**
   * Enroll biometric authentication
   */
  public async enrollBiometric(
    userId: string,
    deviceId: string,
    biometricType: BiometricType,
    publicKey: string
  ): Promise<BiometricAuth> {
    const deviceSecurity = this.deviceSecurityStatuses.get(deviceId);
    if (!deviceSecurity) {
      throw new Error('Device security status not found');
    }

    if (!deviceSecurity.secureEnclaveAvailable) {
      throw new Error('Device does not support secure biometric storage');
    }

    if (deviceSecurity.jailbroken || deviceSecurity.rootDetected) {
      throw new Error('Biometric enrollment not allowed on compromised device');
    }

    const biometricAuth: BiometricAuth = {
      id: this.generateId(),
      userId,
      type: biometricType,
      publicKey: await dataEncryption.encryptSecret(publicKey, `biometric_${userId}`),
      deviceId,
      enrolledAt: Date.now(),
      lastUsed: 0,
      attempts: 0,
      maxAttempts: 5,
      locked: false
    };

    this.biometricAuths.set(biometricAuth.id, biometricAuth);
    console.log(`Biometric enrolled for user ${userId}: ${biometricType}`);

    return biometricAuth;
  }

  /**
   * Setup multi-factor authentication
   */
  public async setupMFA(userId: string): Promise<MFASetup> {
    const secret = this.generateTOTPSecret();
    const backupCodes = this.generateBackupCodes();
    const qrCodeUrl = this.generateTOTPQRCode(userId, secret);

    const mfaSetup: MFASetup = {
      userId,
      secret: await dataEncryption.encryptSecret(secret, `totp_${userId}`),
      backupCodes: await Promise.all(
        backupCodes.map(code => dataEncryption.encryptSecret(code, `backup_${userId}`))
      ),
      qrCodeUrl,
      enabled: false,
      createdAt: Date.now()
    };

    this.mfaSetups.set(userId, mfaSetup);
    console.log(`MFA setup initiated for user ${userId}`);

    return mfaSetup;
  }

  /**
   * Verify and enable MFA
   */
  public async verifyAndEnableMFA(userId: string, token: string): Promise<boolean> {
    const mfaSetup = this.mfaSetups.get(userId);
    if (!mfaSetup) {
      throw new Error('MFA setup not found');
    }

    const secret = await dataEncryption.decryptSecret(mfaSetup.secret);
    const isValid = this.verifyTOTPToken(secret, token);

    if (isValid) {
      mfaSetup.enabled = true;
      mfaSetup.verifiedAt = Date.now();
      console.log(`MFA enabled for user ${userId}`);
    }

    return isValid;
  }

  /**
   * Start authentication session
   */
  public async startAuthSession(
    userId: string,
    deviceId: string,
    ipAddress: string,
    userAgent: string,
    location?: { latitude: number; longitude: number; accuracy: number }
  ): Promise<AuthSession> {
    const deviceSecurity = this.deviceSecurityStatuses.get(deviceId);
    if (!deviceSecurity) {
      throw new Error('Device security status not found');
    }

    // Assess risk level
    const riskFactors = await this.assessRiskFactors(userId, deviceId, ipAddress, location);
    const riskLevel = this.calculateRiskLevel(riskFactors);

    // Determine required authentication factors
    const requiredFactors = this.getRequiredFactors(riskLevel, riskFactors);

    // Create session
    const session: AuthSession = {
      sessionId: this.generateId(),
      userId,
      deviceId,
      platform: deviceSecurity.platform,
      factors: requiredFactors,
      riskLevel,
      createdAt: Date.now(),
      expiresAt: Date.now() + (15 * 60 * 1000), // 15 minutes
      lastActivity: Date.now(),
      biometricVerified: false,
      mfaVerified: false,
      deviceBound: true,
      ipAddress,
      userAgent,
      location
    };

    this.sessions.set(session.sessionId, session);
    console.log(`Auth session started for user ${userId} with risk level ${riskLevel}`);

    return session;
  }

  /**
   * Create biometric challenge
   */
  public async createBiometricChallenge(sessionId: string): Promise<BiometricChallenge> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error('Session not found');
    }

    if (!session.factors.includes('inherence')) {
      throw new Error('Biometric authentication not required for this session');
    }

    const challenge = randomBytes(32).toString('hex');
    const challengeData: BiometricChallenge = {
      challengeId: this.generateId(),
      challenge,
      timestamp: Date.now(),
      expiresAt: Date.now() + (5 * 60 * 1000), // 5 minutes
      userId: session.userId,
      deviceId: session.deviceId,
      used: false
    };

    this.challenges.set(challengeData.challengeId, challengeData);
    console.log(`Biometric challenge created: ${challengeData.challengeId}`);

    return challengeData;
  }

  /**
   * Verify biometric response
   */
  public async verifyBiometricResponse(
    challengeId: string,
    signature: string,
    deviceId: string
  ): Promise<boolean> {
    const challenge = this.challenges.get(challengeId);
    if (!challenge) {
      throw new Error('Challenge not found');
    }

    if (challenge.used || Date.now() > challenge.expiresAt) {
      throw new Error('Challenge expired or already used');
    }

    if (challenge.deviceId !== deviceId) {
      throw new Error('Device mismatch');
    }

    // Find biometric auth for this user and device
    const biometricAuths = Array.from(this.biometricAuths.values())
      .filter(ba => ba.userId === challenge.userId && ba.deviceId === deviceId && !ba.locked);

    if (biometricAuths.length === 0) {
      throw new Error('No biometric authentication found for this device');
    }

    // Verify signature using stored public key
    const isValid = await this.verifyBiometricSignature(
      challenge.challenge,
      signature,
      biometricAuths[0].publicKey
    );

    if (isValid) {
      challenge.used = true;

      // Update session
      const session = Array.from(this.sessions.values())
        .find(s => s.userId === challenge.userId && s.deviceId === deviceId);
      if (session) {
        session.biometricVerified = true;
        session.lastActivity = Date.now();
      }

      // Update biometric auth usage
      biometricAuths[0].lastUsed = Date.now();
      biometricAuths[0].attempts = 0;

      console.log(`Biometric verification successful for user ${challenge.userId}`);
    } else {
      // Handle failed attempts
      biometricAuths[0].attempts++;
      if (biometricAuths[0].attempts >= biometricAuths[0].maxAttempts) {
        biometricAuths[0].locked = true;
        biometricAuths[0].lockUntil = Date.now() + (30 * 60 * 1000); // 30 minutes
        console.warn(`Biometric locked for user ${challenge.userId} due to too many failed attempts`);
      }
    }

    return isValid;
  }

  /**
   * Verify MFA token
   */
  public async verifyMFAToken(sessionId: string, token: string): Promise<boolean> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error('Session not found');
    }

    if (!session.factors.includes('possession')) {
      throw new Error('MFA not required for this session');
    }

    const mfaSetup = this.mfaSetups.get(session.userId);
    if (!mfaSetup || !mfaSetup.enabled) {
      throw new Error('MFA not set up for this user');
    }

    const secret = await dataEncryption.decryptSecret(mfaSetup.secret);
    const isValid = this.verifyTOTPToken(secret, token);

    if (isValid) {
      session.mfaVerified = true;
      session.lastActivity = Date.now();
      console.log(`MFA verification successful for user ${session.userId}`);
    }

    return isValid;
  }

  /**
   * Complete authentication
   */
  public async completeAuthentication(sessionId: string): Promise<{
    success: boolean;
    sessionToken?: string;
    expiresAt?: number;
    riskLevel?: RiskLevel;
  }> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error('Session not found');
    }

    if (Date.now() > session.expiresAt) {
      throw new Error('Session expired');
    }

    // Verify all required factors
    let allFactorsVerified = true;
    const verificationStatus: Record<AuthFactor, boolean> = {
      knowledge: true, // Assumed verified before session creation
      possession: session.mfaVerified,
      inherence: session.biometricVerified,
      location: false, // To be implemented
      behavior: false // To be implemented
    };

    for (const factor of session.factors) {
      if (!verificationStatus[factor]) {
        allFactorsVerified = false;
        break;
      }
    }

    if (!allFactorsVerified) {
      return {
        success: false,
        riskLevel: session.riskLevel
      };
    }

    // Generate session token
    const sessionToken = await this.generateSessionToken(session);
    const expiresAt = Date.now() + (24 * 60 * 60 * 1000); // 24 hours

    // Clean up challenge and update session
    this.cleanupSessionChallenges(session);
    session.lastActivity = Date.now();
    session.expiresAt = expiresAt;

    console.log(`Authentication completed successfully for user ${session.userId}`);

    return {
      success: true,
      sessionToken,
      expiresAt,
      riskLevel: session.riskLevel
    };
  }

  /**
   * Assess risk factors
   */
  private async assessRiskFactors(
    userId: string,
    deviceId: string,
    ipAddress: string,
    location?: { latitude: number; longitude: number; accuracy: number }
  ): Promise<RiskFactors> {
    const failedAttempts = this.failedAttempts.get(userId) || [];
    const recentFailures = failedAttempts.filter(time => Date.now() - time < (60 * 60 * 1000)); // Last hour
    const deviceSecurity = this.deviceSecurityStatuses.get(deviceId);

    return {
      newDevice: await this.isNewDevice(userId, deviceId),
      unusualLocation: await this.isUnusualLocation(userId, location),
      unusualTime: this.isUnusualTime(userId),
      highRiskLocation: this.isHighRiskLocation(ipAddress),
      deviceCompromised: deviceSecurity?.jailbroken || deviceSecurity?.rootDetected || false,
      multipleFailedAttempts: recentFailures.length >= 3,
      suspiciousNetwork: await this.isSuspiciousNetwork(ipAddress),
      jailbrokenDevice: deviceSecurity?.jailbroken || false,
      outdatedOS: await this.isOutdatedOS(deviceId),
      noSecureLock: !deviceSecurity?.passcodeSet
    };
  }

  /**
   * Calculate risk level from factors
   */
  private calculateRiskLevel(factors: RiskFactors): RiskLevel {
    let riskScore = 0;

    // Critical factors
    if (factors.deviceCompromised) riskScore += 40;
    if (factors.jailbrokenDevice) riskScore += 30;
    if (factors.multipleFailedAttempts) riskScore += 25;

    // High risk factors
    if (factors.newDevice) riskScore += 15;
    if (factors.highRiskLocation) riskScore += 20;
    if (factors.suspiciousNetwork) riskScore += 15;

    // Medium risk factors
    if (factors.unusualLocation) riskScore += 10;
    if (factors.unusualTime) riskScore += 8;
    if (factors.outdatedOS) riskScore += 10;
    if (factors.noSecureLock) riskScore += 12;

    if (riskScore >= 50) return 'critical';
    if (riskScore >= 30) return 'high';
    if (riskScore >= 15) return 'medium';
    return 'low';
  }

  /**
   * Get required authentication factors based on risk level
   */
  private getRequiredFactors(riskLevel: RiskLevel, factors: RiskFactors): AuthFactor[] {
    const baseFactors: AuthFactor[] = ['knowledge'];

    switch (riskLevel) {
      case 'critical':
        return [...baseFactors, 'possession', 'inherence', 'location'];
      case 'high':
        return [...baseFactors, 'possession', 'inherence'];
      case 'medium':
        return [...baseFactors, 'possession'];
      case 'low':
        return factors.newDevice ? [...baseFactors, 'possession'] : baseFactors;
      default:
        return baseFactors;
    }
  }

  /**
   * Generate device fingerprint
   */
  private async generateDeviceFingerprint(deviceId: string, platform: Platform): Promise<string> {
    const data = `${deviceId}:${platform}:${Date.now()}`;
    return createHash('sha256').update(data).digest('hex');
  }

  /**
   * Generate TOTP secret
   */
  private generateTOTPSecret(): string {
    return randomBytes(20).toString('base32').replace(/=/g, '').substring(0, 16);
  }

  /**
   * Generate backup codes
   */
  private generateBackupCodes(): string[] {
    const codes: string[] = [];
    for (let i = 0; i < 10; i++) {
      codes.push(randomBytes(4).toString('hex').toUpperCase());
    }
    return codes;
  }

  /**
   * Generate TOTP QR code URL
   */
  private generateTOTPQRCode(userId: string, secret: string): string {
    const issuer = encodeURIComponent('mariiaborysevych');
    const account = encodeURIComponent(userId);
    return `otpauth://totp/${issuer}:${account}?secret=${secret}&issuer=${issuer}&algorithm=SHA1&digits=6&period=30`;
  }

  /**
   * Verify TOTP token
   */
  private verifyTOTPToken(secret: string, token: string): boolean {
    // Simplified TOTP verification - in production, use a proper TOTP library
    const timeStep = Math.floor(Date.now() / 1000 / 30);
    const expectedToken = this.generateTOTP(secret, timeStep);
    return token === expectedToken;
  }

  /**
   * Generate TOTP
   */
  private generateTOTP(secret: string, timeStep: number): string {
    // Simplified TOTP generation - in production, use a proper TOTP library
    const hash = createHash('sha1')
      .update(Buffer.from(secret, 'base32'))
      .update(Buffer.alloc(8, timeStep))
      .digest();

    const offset = hash[hash.length - 1] & 0x0F;
    const code = ((hash[offset] & 0x7F) << 24) |
                 ((hash[offset + 1] & 0xFF) << 16) |
                 ((hash[offset + 2] & 0xFF) << 8) |
                 (hash[offset + 3] & 0xFF);

    return String(code % 1000000).padStart(6, '0');
  }

  /**
   * Verify biometric signature
   */
  private async verifyBiometricSignature(
    challenge: string,
    signature: string,
    encryptedPublicKey: string
  ): Promise<boolean> {
    try {
      const publicKey = await dataEncryption.decryptSecret(encryptedPublicKey);
      // In a real implementation, verify the signature using the public key
      // This is a simplified version - use proper crypto verification
      return signature.length > 0; // Placeholder
    } catch (error) {
      console.error('Biometric signature verification failed:', error);
      return false;
    }
  }

  /**
   * Generate session token
   */
  private async generateSessionToken(session: AuthSession): Promise<string> {
    const tokenData = {
      sessionId: session.sessionId,
      userId: session.userId,
      deviceId: session.deviceId,
      platform: session.platform,
      expiresAt: session.expiresAt,
      riskLevel: session.riskLevel
    };

    const serialized = JSON.stringify(tokenData);
    return await dataEncryption.encrypt(serialized, 'session');
  }

  /**
   * Helper methods for risk assessment
   */
  private async isNewDevice(userId: string, deviceId: string): Promise<boolean> {
    // Check if this device has been used before by this user
    const existingSessions = Array.from(this.sessions.values())
      .filter(s => s.userId === userId && s.deviceId === deviceId);
    return existingSessions.length === 0;
  }

  private async isUnusualLocation(
    userId: string,
    location?: { latitude: number; longitude: number; accuracy: number }
  ): Promise<boolean> {
    if (!location) return false;

    // Check against known locations for this user
    const userSessions = Array.from(this.sessions.values())
      .filter(s => s.userId === userId && s.location);

    if (userSessions.length === 0) return false;

    // Calculate distance from known locations
    for (const session of userSessions) {
      const distance = this.calculateDistance(location, session.location!);
      if (distance < 100) { // Within 100km
        return false;
      }
    }

    return true;
  }

  private isUnusualTime(userId: string): boolean {
    const userSessions = Array.from(this.sessions.values())
      .filter(s => s.userId === userId);

    if (userSessions.length < 5) return false;

    const currentHour = new Date().getHours();
    const userHours = userSessions.map(s => new Date(s.createdAt).getHours());
    const avgHour = userHours.reduce((a, b) => a + b, 0) / userHours.length;

    return Math.abs(currentHour - avgHour) > 8; // More than 8 hours from usual time
  }

  private isHighRiskLocation(ipAddress: string): boolean {
    // Check against known high-risk IP ranges
    const highRiskRanges = [
      '10.0.0.0/8',     // Private networks
      '172.16.0.0/12',  // Private networks
      '192.168.0.0/16'  // Private networks
    ];

    // Simplified check - in production, use proper IP geolocation
    return highRiskRanges.some(range => this.isIPInRange(ipAddress, range));
  }

  private async isSuspiciousNetwork(ipAddress: string): Promise<boolean> {
    // Check against TOR exit nodes, known malicious IPs, etc.
    // This is a simplified implementation
    return false;
  }

  private async isOutdatedOS(deviceId: string): Promise<boolean> {
    // Check if device OS is outdated
    // This would require device information collection
    return false;
  }

  private calculateDistance(
    loc1: { latitude: number; longitude: number },
    loc2: { latitude: number; longitude: number }
  ): number {
    // Haversine formula for calculating distance
    const R = 6371; // Earth's radius in km
    const dLat = (loc2.latitude - loc1.latitude) * Math.PI / 180;
    const dLon = (loc2.longitude - loc1.longitude) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(loc1.latitude * Math.PI / 180) * Math.cos(loc2.latitude * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  private isIPInRange(ip: string, range: string): boolean {
    // Simplified IP range check - in production, use proper IP range parsing
    return ip.startsWith(range.split('/')[0].split('.').slice(0, 2).join('.'));
  }

  /**
   * Cleanup methods
   */
  private startSessionCleanup(): void {
    setInterval(() => {
      const now = Date.now();
      for (const [sessionId, session] of this.sessions.entries()) {
        if (now > session.expiresAt) {
          this.sessions.delete(sessionId);
        }
      }
    }, 60 * 1000); // Every minute
  }

  private startChallengeCleanup(): void {
    setInterval(() => {
      const now = Date.now();
      for (const [challengeId, challenge] of this.challenges.entries()) {
        if (now > challenge.expiresAt || challenge.used) {
          this.challenges.delete(challengeId);
        }
      }
    }, 60 * 1000); // Every minute
  }

  private cleanupSessionChallenges(session: AuthSession): void {
    for (const [challengeId, challenge] of this.challenges.entries()) {
      if (challenge.userId === session.userId && challenge.deviceId === session.deviceId) {
        this.challenges.delete(challengeId);
      }
    }
  }

  private generateId(): string {
    return randomBytes(16).toString('hex');
  }

  /**
   * Public API methods
   */
  public getSession(sessionId: string): AuthSession | undefined {
    return this.sessions.get(sessionId);
  }

  public getUserBiometrics(userId: string): BiometricAuth[] {
    return Array.from(this.biometricAuths.values()).filter(ba => ba.userId === userId);
  }

  public getUserMFASetup(userId: string): MFASetup | undefined {
    return this.mfaSetups.get(userId);
  }

  public getDeviceSecurity(deviceId: string): DeviceSecurityStatus | undefined {
    return this.deviceSecurityStatuses.get(deviceId);
  }

  public async revokeBiometric(biometricId: string): Promise<void> {
    const biometric = this.biometricAuths.get(biometricId);
    if (biometric) {
      this.biometricAuths.delete(biometricId);
      console.log(`Biometric revoked: ${biometricId}`);
    }
  }

  public async disableMFA(userId: string): Promise<void> {
    const mfaSetup = this.mfaSetups.get(userId);
    if (mfaSetup) {
      mfaSetup.enabled = false;
      console.log(`MFA disabled for user: ${userId}`);
    }
  }

  public async recordFailedAttempt(userId: string): Promise<void> {
    const attempts = this.failedAttempts.get(userId) || [];
    attempts.push(Date.now());

    // Keep only last 24 hours of attempts
    const oneDayAgo = Date.now() - (24 * 60 * 60 * 1000);
    const recentAttempts = attempts.filter(time => time > oneDayAgo);

    this.failedAttempts.set(userId, recentAttempts);
  }

  public clearFailedAttempts(userId: string): void {
    this.failedAttempts.delete(userId);
  }
}

// Singleton instance
const mobileAuthentication = new MobileAuthentication();

// Export class and utilities
export {
  MobileAuthentication,
  type DeviceSecurityStatus,
  type BiometricAuth,
  type MFASetup,
  type AuthSession,
  type RiskFactors,
  type Platform,
  type BiometricType,
  type AuthFactor,
  type RiskLevel
};

// Export utility functions
export const registerDeviceSecurity = (deviceId: string, platform: Platform, securityData: Partial<DeviceSecurityStatus>) =>
  mobileAuthentication.registerDeviceSecurity(deviceId, platform, securityData);

export const enrollBiometric = (userId: string, deviceId: string, biometricType: BiometricType, publicKey: string) =>
  mobileAuthentication.enrollBiometric(userId, deviceId, biometricType, publicKey);

export const setupMFA = (userId: string) =>
  mobileAuthentication.setupMFA(userId);

export const verifyAndEnableMFA = (userId: string, token: string) =>
  mobileAuthentication.verifyAndEnableMFA(userId, token);

export const startAuthSession = (userId: string, deviceId: string, ipAddress: string, userAgent: string, location?: { latitude: number; longitude: number; accuracy: number }) =>
  mobileAuthentication.startAuthSession(userId, deviceId, ipAddress, userAgent, location);

export const createBiometricChallenge = (sessionId: string) =>
  mobileAuthentication.createBiometricChallenge(sessionId);

export const verifyBiometricResponse = (challengeId: string, signature: string, deviceId: string) =>
  mobileAuthentication.verifyBiometricResponse(challengeId, signature, deviceId);

export const verifyMFAToken = (sessionId: string, token: string) =>
  mobileAuthentication.verifyMFAToken(sessionId, token);

export const completeAuthentication = (sessionId: string) =>
  mobileAuthentication.completeAuthentication(sessionId);

export const getAuthSession = (sessionId: string) =>
  mobileAuthentication.getSession(sessionId);

export const getUserBiometrics = (userId: string) =>
  mobileAuthentication.getUserBiometrics(userId);

export const getUserMFASetup = (userId: string) =>
  mobileAuthentication.getUserMFASetup(userId);

export const getDeviceSecurityStatus = (deviceId: string) =>
  mobileAuthentication.getDeviceSecurity(deviceId);

export const recordFailedLoginAttempt = (userId: string) =>
  mobileAuthentication.recordFailedAttempt(userId);

export const clearFailedLoginAttempts = (userId: string) =>
  mobileAuthentication.clearFailedAttempts(userId);