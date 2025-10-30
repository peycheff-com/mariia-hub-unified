/**
 * Real-Time Threat Detection System
 * Advanced threat detection with machine learning, behavioral analysis, and automated response
 */

import { securityMonitoring, SecurityEventType, SecuritySeverity } from './security-monitoring';

// Threat Detection Configuration
interface ThreatDetectionConfig {
  enableMLDetection: boolean;
  enableBehavioralAnalysis: boolean;
  enableAnomalyDetection: boolean;
  enableThreatIntelligence: boolean;
  enableAutomatedResponse: boolean;
  alertThresholds: {
    suspiciousActivityScore: number;
    anomalyScore: number;
    threatIntelligenceMatch: number;
    behavioralDeviation: number;
  };
  responseActions: {
    blockIP: boolean;
    requireReauth: boolean;
    escalateToHuman: boolean;
    notifySecurityTeam: boolean;
    lockAccount: boolean;
  };
  monitoringWindows: {
    shortTerm: number; // 5 minutes
    mediumTerm: number; // 1 hour
    longTerm: number; // 24 hours
  };
}

// Threat Intelligence Data
interface ThreatIntelligence {
  maliciousIPs: Set<string>;
  suspiciousUserAgents: Set<string>;
  knownAttackPatterns: Set<string>;
  compromisedCredentials: Set<string>;
  geolocationRisks: Set<string>;
  lastUpdated: number;
}

// Behavioral Profile
interface BehavioralProfile {
  userId: string;
  baseline: {
    typicalIPs: string[];
    typicalUserAgents: string[];
    typicalRequestPatterns: string[];
    typicalTimeRanges: number[];
    typicalSessionDuration: number;
    typicalPageViews: number;
  };
  currentSession: {
    startTime: number;
    ipAddress: string;
    userAgent: string;
    requestCount: number;
    pageViews: number;
    anomalousActions: number[];
    riskScore: number;
  };
  historicalData: Array<{
    timestamp: number;
    ipAddress: string;
    userAgent: string;
    sessionDuration: number;
    pageViews: number;
    actions: string[];
  }>;
}

// Threat Event
interface ThreatEvent {
  id: string;
  type: ThreatType;
  severity: SecuritySeverity;
  confidence: number; // 0-100
  description: string;
  source: {
    ipAddress: string;
    userAgent: string;
    userId?: string;
    sessionId?: string;
  };
  indicators: string[];
  timestamp: number;
  mitigations: string[];
  status: 'DETECTED' | 'ANALYZING' | 'MITIGATING' | 'RESOLVED' | 'FALSE_POSITIVE';
}

// Threat Types
export enum ThreatType {
  BRUTE_FORCE_ATTACK = 'BRUTE_FORCE_ATTACK',
  CREDENTIAL_STUFFING = 'CREDENTIAL_STUFFING',
  SQL_INJECTION = 'SQL_INJECTION',
  XSS_ATTACK = 'XSS_ATTACK',
  CSRF_ATTACK = 'CSRF_ATTACK',
  ACCOUNT_TAKEOVER = 'ACCOUNT_TAKEOVER',
  ANOMALOUS_BEHAVIOR = 'ANOMALOUS_BEHAVIOR',
  MALICIOUS_PAYLOAD = 'MALICIOUS_PAYLOAD',
  SUSPICIOUS_IP = 'SUSPICIOUS_IP',
  UNAUTHORIZED_ACCESS = 'UNAUTHORIZED_ACCESS',
  DATA_EXFILTRATION = 'DATA_EXFILTRATION',
  DOS_ATTACK = 'DOS_ATTACK',
  SESSION_HIJACKING = 'SESSION_HIJACKING',
  PRIVILEGE_ESCALATION = 'PRIVILEGE_ESCALATION',
  THREAT_INTEL_MATCH = 'THREAT_INTEL_MATCH'
}

// Machine Learning Model Interface
interface MLModel {
  predict(features: number[]): {
    threat: boolean;
    confidence: number;
    threatType?: ThreatType;
  };
  train(data: Array<{ features: number[], label: boolean }>): void;
  isTrained(): boolean;
}

/**
 * Real-Time Threat Detection Class
 */
export class RealTimeThreatDetection {
  private static instance: RealTimeThreatDetection;
  private config: ThreatDetectionConfig;
  private threatIntel: ThreatIntelligence;
  private behavioralProfiles: Map<string, BehavioralProfile> = new Map();
  private activeThreats: Map<string, ThreatEvent> = new Map();
  private mlModel: MLModel | null = null;
  private isActive: boolean = false;
  private eventBuffer: Array<any> = [];
  private alertCallbacks: Map<SecuritySeverity, Array<(threat: ThreatEvent) => void>> = new Map();

  private constructor(config: Partial<ThreatDetectionConfig> = {}) {
    this.config = {
      enableMLDetection: true,
      enableBehavioralAnalysis: true,
      enableAnomalyDetection: true,
      enableThreatIntelligence: true,
      enableAutomatedResponse: true,
      alertThresholds: {
        suspiciousActivityScore: 70,
        anomalyScore: 80,
        threatIntelligenceMatch: 90,
        behavioralDeviation: 75
      },
      responseActions: {
        blockIP: true,
        requireReauth: true,
        escalateToHuman: true,
        notifySecurityTeam: true,
        lockAccount: false
      },
      monitoringWindows: {
        shortTerm: 5 * 60 * 1000,    // 5 minutes
        mediumTerm: 60 * 60 * 1000,  // 1 hour
        longTerm: 24 * 60 * 60 * 1000 // 24 hours
      },
      ...config
    };

    this.threatIntel = this.initializeThreatIntelligence();
    this.initializeMLModel();
    this.startThreatDetection();
  }

  static getInstance(config?: Partial<ThreatDetectionConfig>): RealTimeThreatDetection {
    if (!RealTimeThreatDetection.instance) {
      RealTimeThreatDetection.instance = new RealTimeThreatDetection(config);
    }
    return RealTimeThreatDetection.instance;
  }

  /**
   * Initialize threat intelligence data
   */
  private initializeThreatIntelligence(): ThreatIntelligence {
    return {
      maliciousIPs: new Set([
        // Known malicious IP ranges would be populated here
        // This would be updated from threat intelligence feeds
      ]),
      suspiciousUserAgents: new Set([
        'sqlmap', 'nikto', 'nmap', 'masscan', 'zap', 'burp',
        'python-requests', 'curl', 'wget', 'powershell'
      ]),
      knownAttackPatterns: new Set([
        '../../../etc/passwd', 'union select', '<script>alert',
        'javascript:void', 'eval(', 'document.cookie',
        '../proc/self/environ', 'cmd.exe', '/bin/bash'
      ]),
      compromisedCredentials: new Set(),
      geolocationRisks: new Set([
        // High-risk countries/regions would be listed here
      ]),
      lastUpdated: Date.now()
    };
  }

  /**
   * Initialize ML model for threat detection
   */
  private initializeMLModel(): void {
    if (!this.config.enableMLDetection) return;

    // Simple ML model implementation
    this.mlModel = {
      predictions: [],
      isModelTrained: false,

      predict(features: number[]): { threat: boolean; confidence: number; threatType?: ThreatType } {
        if (!this.isModelTrained) {
          return { threat: false, confidence: 0 };
        }

        // Simple prediction logic (in production, use a proper ML library)
        const score = features.reduce((sum, feature) => sum + feature, 0) / features.length;
        const isThreat = score > 0.7;
        const confidence = Math.min(Math.abs(score) * 100, 100);

        let threatType: ThreatType | undefined;
        if (isThreat) {
          if (features[0] > 0.9) threatType = ThreatType.BRUTE_FORCE_ATTACK;
          else if (features[1] > 0.8) threatType = ThreatType.CREDENTIAL_STUFFING;
          else if (features[2] > 0.8) threatType = ThreatType.ANOMALOUS_BEHAVIOR;
        }

        return { threat: isThreat, confidence, threatType };
      },

      train(data: Array<{ features: number[], label: boolean }>): void {
        // Simple training logic (in production, use proper ML training)
        this.predictions = data;
        this.isModelTrained = true;
        console.log('[THREAT] ML model trained with', data.length, 'samples');
      },

      isTrained(): boolean {
        return this.isModelTrained;
      }
    };
  }

  /**
   * Start threat detection system
   */
  private startThreatDetection(): void {
    if (this.isActive) return;

    this.isActive = true;

    // Setup event listeners
    this.setupEventListeners();

    // Start periodic analysis
    this.startPeriodicAnalysis();

    // Update threat intelligence
    this.startThreatIntelUpdates();

    // Initialize behavioral analysis
    this.initializeBehavioralAnalysis();

    console.log('[THREAT] Real-time threat detection system started');
  }

  /**
   * Setup event listeners for real-time monitoring
   */
  private setupEventListeners(): void {
    // Monitor all security events
    window.addEventListener('security-event', (event: any) => {
      this.analyzeSecurityEvent(event.detail);
    });

    // Monitor network requests
    this.monitorNetworkRequests();

    // Monitor user interactions
    this.monitorUserInteractions();

    // Monitor authentication events
    this.monitorAuthenticationEvents();
  }

  /**
   * Monitor network requests for threats
   */
  private monitorNetworkRequests(): void {
    // Override fetch to monitor requests
    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
      const startTime = Date.now();
      const url = args[0] as string;
      const options = args[1] || {};

      try {
        const response = await originalFetch(...args);
        const duration = Date.now() - startTime;

        // Analyze request for threats
        this.analyzeNetworkRequest({
          url,
          method: options.method || 'GET',
          duration,
          headers: options.headers,
          timestamp: startTime
        });

        return response;
      } catch (error) {
        // Analyze failed requests
        this.analyzeFailedRequest({
          url,
          method: options.method || 'GET',
          error: error.message,
          timestamp: startTime
        });
        throw error;
      }
    };
  }

  /**
   * Monitor user interactions for anomalies
   */
  private monitorUserInteractions(): void {
    let clickCount = 0;
    let keyPressCount = 0;
    let mouseMovements = 0;

    // Track click patterns
    document.addEventListener('click', (event) => {
      clickCount++;

      // Check for rapid clicking (potential bot)
      if (clickCount > 10) {
        this.detectAnomalousBehavior({
          type: 'RAPID_CLICKING',
          count: clickCount,
          timestamp: Date.now()
        });
      }

      // Reset counter after delay
      setTimeout(() => { clickCount = 0; }, 5000);
    });

    // Track keyboard patterns
    document.addEventListener('keydown', (event) => {
      keyPressCount++;

      // Check for rapid typing (potential script)
      if (keyPressCount > 50) {
        this.detectAnomalousBehavior({
          type: 'RAPID_TYPING',
          count: keyPressCount,
          timestamp: Date.now()
        });
      }

      setTimeout(() => { keyPressCount = 0; }, 5000);
    });

    // Track mouse movements
    document.addEventListener('mousemove', () => {
      mouseMovements++;
    });

    // Check for non-human mouse patterns
    setInterval(() => {
      if (mouseMovements === 0 && clickCount > 0) {
        this.detectAnomalousBehavior({
          type: 'NO_MOUSE_MOVEMENT',
          clicks: clickCount,
          timestamp: Date.now()
        });
      }
      mouseMovements = 0;
    }, 30000);
  }

  /**
   * Monitor authentication events
   */
  private monitorAuthenticationEvents(): void {
    // Listen for login attempts
    window.addEventListener('login-attempt', (event: any) => {
      this.analyzeAuthenticationEvent({
        type: 'LOGIN_ATTEMPT',
        email: event.detail.email,
        success: event.detail.success,
        ipAddress: event.detail.ipAddress,
        userAgent: event.detail.userAgent,
        timestamp: Date.now()
      });
    });

    // Listen for failed logins
    window.addEventListener('login-failed', (event: any) => {
      this.detectBruteForceAttack({
        email: event.detail.email,
        ipAddress: event.detail.ipAddress,
        userAgent: event.detail.userAgent,
        timestamp: Date.now()
      });
    });
  }

  /**
   * Analyze security event for threats
   */
  private analyzeSecurityEvent(event: any): void {
    // Check against threat intelligence
    const intelThreats = this.checkThreatIntelligence(event);
    if (intelThreats.length > 0) {
      intelThreats.forEach(threat => {
        this.createThreatEvent({
          type: ThreatType.THREAT_INTEL_MATCH,
          severity: SecuritySeverity.HIGH,
          confidence: 90,
          description: `Threat intelligence match: ${threat}`,
          source: {
            ipAddress: event.ipAddress || 'unknown',
            userAgent: event.userAgent || 'unknown',
            userId: event.userId,
            sessionId: event.sessionId
          },
          indicators: [threat]
        });
      });
    }

    // Check for known attack patterns
    const patternThreats = this.checkAttackPatterns(event);
    patternThreats.forEach(threat => {
      this.createThreatEvent(threat);
    });

    // Behavioral analysis
    if (this.config.enableBehavioralAnalysis && event.userId) {
      this.analyzeBehavioralPattern(event);
    }

    // ML-based detection
    if (this.config.enableMLDetection && this.mlModel) {
      this.analyzeWithML(event);
    }
  }

  /**
   * Check against threat intelligence
   */
  private checkThreatIntelligence(event: any): string[] {
    const threats: string[] = [];
    const ipAddress = event.ipAddress || '';

    // Check malicious IPs
    if (this.threatIntel.maliciousIPs.has(ipAddress)) {
      threats.push('Malicious IP address detected');
    }

    // Check suspicious user agents
    const userAgent = event.userAgent || '';
    const normalizedUA = userAgent.toLowerCase();
    for (const suspiciousUA of this.threatIntel.suspiciousUserAgents) {
      if (normalizedUA.includes(suspiciousUA.toLowerCase())) {
        threats.push(`Suspicious user agent: ${suspiciousUA}`);
        break;
      }
    }

    // Check geolocation risks
    const country = this.getCountryFromIP(ipAddress);
    if (this.threatIntel.geolocationRisks.has(country)) {
      threats.push(`High-risk geolocation: ${country}`);
    }

    return threats;
  }

  /**
   * Check for known attack patterns
   */
  private checkAttackPatterns(event: any): ThreatEvent[] {
    const threats: ThreatEvent[] = [];
    const payload = event.payload || '';

    // Check for SQL injection patterns
    const sqlPatterns = [
      /union\s+select/i, /or\s+1\s*=\s*1/i, /drop\s+table/i,
      /insert\s+into/i, /delete\s+from/i, /update\s+.*\s+set/i
    ];

    for (const pattern of sqlPatterns) {
      if (pattern.test(payload)) {
        threats.push({
          id: this.generateThreatId(),
          type: ThreatType.SQL_INJECTION,
          severity: SecuritySeverity.CRITICAL,
          confidence: 95,
          description: 'SQL injection attack pattern detected',
          source: {
            ipAddress: event.ipAddress || 'unknown',
            userAgent: event.userAgent || 'unknown'
          },
          indicators: [payload.substring(0, 100)],
          timestamp: Date.now(),
          mitigations: ['Block IP', 'Sanitize input', 'Log for forensics'],
          status: 'DETECTED'
        });
        break;
      }
    }

    // Check for XSS patterns
    const xssPatterns = [
      /<script[^>]*>/i, /javascript:/i, /on\w+\s*=/i,
      /document\.cookie/i, /alert\s*\(/i, /eval\s*\(/i
    ];

    for (const pattern of xssPatterns) {
      if (pattern.test(payload)) {
        threats.push({
          id: this.generateThreatId(),
          type: ThreatType.XSS_ATTACK,
          severity: SecuritySeverity.HIGH,
          confidence: 90,
          description: 'Cross-site scripting attack pattern detected',
          source: {
            ipAddress: event.ipAddress || 'unknown',
            userAgent: event.userAgent || 'unknown'
          },
          indicators: [payload.substring(0, 100)],
          timestamp: Date.now(),
          mitigations: ['Sanitize input', 'Implement CSP', 'Block request'],
          status: 'DETECTED'
        });
        break;
      }
    }

    return threats;
  }

  /**
   * Detect brute force attacks
   */
  private detectBruteForceAttack(data: {
    email: string;
    ipAddress: string;
    userAgent: string;
    timestamp: number;
  }): void {
    const now = Date.now();
    const timeWindow = this.config.monitoringWindows.shortTerm;
    const maxAttempts = 5;

    // Count recent failed attempts for this IP
    const recentAttempts = this.eventBuffer.filter(event =>
      event.type === 'LOGIN_FAILED' &&
      event.ipAddress === data.ipAddress &&
      (now - event.timestamp) <= timeWindow
    );

    if (recentAttempts.length >= maxAttempts) {
      this.createThreatEvent({
        type: ThreatType.BRUTE_FORCE_ATTACK,
        severity: SecuritySeverity.HIGH,
        confidence: 95,
        description: `Brute force attack detected: ${recentAttempts.length} failed attempts`,
        source: {
          ipAddress: data.ipAddress,
          userAgent: data.userAgent
        },
        indicators: [`Email: ${data.email}`, `Attempts: ${recentAttempts.length}`],
        timestamp: now,
        mitigations: ['Block IP temporarily', 'Require CAPTCHA', 'Notify user'],
        status: 'DETECTED'
      });
    }

    // Add to event buffer
    this.eventBuffer.push({
      type: 'LOGIN_FAILED',
      email: data.email,
      ipAddress: data.ipAddress,
      userAgent: data.userAgent,
      timestamp: now
    });

    // Clean old events
    this.eventBuffer = this.eventBuffer.filter(event =>
      (now - event.timestamp) <= this.config.monitoringWindows.longTerm
    );
  }

  /**
   * Detect anomalous behavior
   */
  private detectAnomalousBehavior(data: {
    type: string;
    count?: number;
    timestamp: number;
  }): void {
    this.createThreatEvent({
      id: this.generateThreatId(),
      type: ThreatType.ANOMALOUS_BEHAVIOR,
      severity: SecuritySeverity.MEDIUM,
      confidence: 70,
      description: `Anomalous behavior detected: ${data.type}`,
      source: {
        ipAddress: 'unknown',
        userAgent: navigator.userAgent
      },
      indicators: [data.type, `Count: ${data.count || 0}`],
      timestamp: data.timestamp,
      mitigations: ['Monitor session', 'Require re-authentication'],
      status: 'DETECTED'
    });
  }

  /**
   * Analyze behavioral patterns
   */
  private analyzeBehavioralPattern(event: any): void {
    if (!event.userId) return;

    let profile = this.behavioralProfiles.get(event.userId);

    if (!profile) {
      profile = this.createBehavioralProfile(event.userId);
      this.behavioralProfiles.set(event.userId, profile);
    }

    // Update current session data
    profile.currentSession.requestCount++;

    // Check for deviations from baseline
    const deviations = this.calculateBehavioralDeviations(profile, event);

    if (deviations.length > 0) {
      this.createThreatEvent({
        id: this.generateThreatId(),
        type: ThreatType.ANOMALOUS_BEHAVIOR,
        severity: SecuritySeverity.MEDIUM,
        confidence: 75,
        description: `Behavioral deviations detected: ${deviations.join(', ')}`,
        source: {
          ipAddress: event.ipAddress || 'unknown',
          userAgent: event.userAgent || 'unknown',
          userId: event.userId
        },
        indicators: deviations,
        timestamp: Date.now(),
        mitigations: ['Monitor closely', 'Consider re-authentication'],
        status: 'DETECTED'
      });
    }
  }

  /**
   * Analyze with ML model
   */
  private analyzeWithML(event: any): void {
    if (!this.mlModel || !this.mlModel.isTrained()) return;

    // Extract features for ML model
    const features = this.extractFeatures(event);

    const prediction = this.mlModel.predict(features);

    if (prediction.threat && prediction.confidence > 70) {
      this.createThreatEvent({
        id: this.generateThreatId(),
        type: prediction.threatType || ThreatType.ANOMALOUS_BEHAVIOR,
        severity: SecuritySeverity.HIGH,
        confidence: prediction.confidence,
        description: `ML model detected threat with ${prediction.confidence}% confidence`,
        source: {
          ipAddress: event.ipAddress || 'unknown',
          userAgent: event.userAgent || 'unknown',
          userId: event.userId
        },
        indicators: [`ML Score: ${prediction.confidence}%`],
        timestamp: Date.now(),
        mitigations: ['Automated response based on ML prediction'],
        status: 'DETECTED'
      });
    }
  }

  /**
   * Create threat event
   */
  private createThreatEvent(threatData: Omit<ThreatEvent, 'id' | 'timestamp' | 'mitigations' | 'status'>): void {
    const threat: ThreatEvent = {
      ...threatData,
      id: this.generateThreatId(),
      timestamp: Date.now(),
      mitigations: this.generateMitigations(threatData.type),
      status: 'DETECTED'
    };

    this.activeThreats.set(threat.id, threat);

    // Log threat
    console.warn('[THREAT] Threat detected:', {
      id: threat.id,
      type: threat.type,
      severity: threat.severity,
      confidence: threat.confidence,
      description: threat.description
    });

    // Trigger automated response
    if (this.config.enableAutomatedResponse) {
      this.handleAutomatedResponse(threat);
    }

    // Trigger alerts
    this.triggerThreatAlert(threat);
  }

  /**
   * Handle automated response to threats
   */
  private handleAutomatedResponse(threat: ThreatEvent): void {
    console.log(`[THREAT] Automated response initiated for ${threat.id}`);

    const response = this.config.responseActions;

    // Block IP if critical threat
    if (response.blockIP && threat.severity === SecuritySeverity.CRITICAL) {
      this.blockIPAddress(threat.source.ipAddress);
    }

    // Require re-authentication
    if (response.requireReauth && threat.source.userId) {
      this.requireReauthentication(threat.source.userId);
    }

    // Lock account for severe threats
    if (response.lockAccount &&
        (threat.type === ThreatType.ACCOUNT_TAKEOVER ||
         threat.type === ThreatType.CREDENTIAL_STUFFING)) {
      this.lockAccount(threat.source.userId);
    }

    // Notify security team
    if (response.notifySecurityTeam) {
      this.notifySecurityTeam(threat);
    }

    // Escalate to human if needed
    if (response.escalateToHuman && threat.confidence > 90) {
      this.escalateToHuman(threat);
    }

    threat.status = 'MITIGATING';
  }

  /**
   * Block IP address
   */
  private blockIPAddress(ipAddress: string): void {
    console.warn(`[THREAT] Blocking IP address: ${ipAddress}`);

    // In production, integrate with firewall/rate limiting
    localStorage.setItem(`blocked_ip_${ipAddress}`, Date.now().toString());

    // Report to security monitoring
    securityMonitoring.suspiciousActivity(
      SecurityEventType.RATE_LIMIT_EXCEEDED,
      `IP address blocked: ${ipAddress}`,
      undefined,
      { blockedIP: ipAddress }
    );
  }

  /**
   * Require re-authentication
   */
  private requireReauthentication(userId: string): void {
    console.warn(`[THREAT] Requiring re-authentication for user: ${userId}`);

    // Trigger re-authentication flow
    window.dispatchEvent(new CustomEvent('require-reauthentication', {
      detail: { userId, reason: 'Security threat detected' }
    }));
  }

  /**
   * Lock account
   */
  private lockAccount(userId?: string): void {
    if (!userId) return;

    console.warn(`[THREAT] Locking account: ${userId}`);

    // In production, integrate with authentication system
    localStorage.setItem(`locked_account_${userId}`, Date.now().toString());

    // Notify user
    window.dispatchEvent(new CustomEvent('account-locked', {
      detail: { userId, reason: 'Security threat detected' }
    }));
  }

  /**
   * Notify security team
   */
  private notifySecurityTeam(threat: ThreatEvent): void {
    const alert = {
      threatId: threat.id,
      type: threat.type,
      severity: threat.severity,
      confidence: threat.confidence,
      description: threat.description,
      source: threat.source,
      timestamp: threat.timestamp,
      requiresAction: threat.severity === SecuritySeverity.CRITICAL
    };

    console.error('[THREAT] Security team notification:', alert);

    // In production, integrate with alerting systems
    // Email, Slack, PagerDuty, etc.
  }

  /**
   * Escalate to human analyst
   */
  private escalateToHuman(threat: ThreatEvent): void {
    console.error(`[THREAT] Escalating to human analyst: ${threat.id}`);

    // Create escalation ticket
    const escalation = {
      threatId: threat.id,
      priority: threat.severity === SecuritySeverity.CRITICAL ? 'IMMEDIATE' : 'HIGH',
      assignedTo: 'security-team',
      dueTime: threat.severity === SecuritySeverity.CRITICAL ?
        Date.now() + (15 * 60 * 1000) : // 15 minutes
        Date.now() + (60 * 60 * 1000), // 1 hour
      details: threat
    };

    // In production, integrate with ticketing system
    localStorage.setItem(`escalation_${threat.id}`, JSON.stringify(escalation));
  }

  /**
   * Trigger threat alert
   */
  private triggerThreatAlert(threat: ThreatEvent): void {
    // Get callbacks for this severity
    const callbacks = this.alertCallbacks.get(threat.severity) || [];

    // Execute callbacks
    callbacks.forEach(callback => {
      try {
        callback(threat);
      } catch (error) {
        console.error('[THREAT] Error in alert callback:', error);
      }
    });

    // Report to main security monitoring
    securityMonitoring.suspiciousActivity(
      SecurityEventType.SECURITY_POLICY_VIOLATION,
      `Threat detected: ${threat.description}`,
      threat.source.userId,
      threat
    );
  }

  // Helper methods
  private generateThreatId(): string {
    return `threat_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }

  private generateMitigations(threatType: ThreatType): string[] {
    const mitigations: Record<ThreatType, string[]> = {
      [ThreatType.BRUTE_FORCE_ATTACK]: ['Block IP', 'Rate limiting', 'CAPTCHA'],
      [ThreatType.CREDENTIAL_STUFFING]: ['Block IP', 'Password reset', 'MFA'],
      [ThreatType.SQL_INJECTION]: ['Block request', 'Input validation', 'WAF rules'],
      [ThreatType.XSS_ATTACK]: ['Sanitize output', 'CSP headers', 'Input validation'],
      [ThreatType.CSRF_ATTACK]: ['CSRF tokens', 'SameSite cookies'],
      [ThreatType.ACCOUNT_TAKEOVER]: ['Lock account', 'Password reset', 'MFA'],
      [ThreatType.ANOMALOUS_BEHAVIOR]: ['Monitor session', 'Re-authenticate'],
      [ThreatType.MALICIOUS_PAYLOAD]: ['Block request', 'Scan payload'],
      [ThreatType.SUSPICIOUS_IP]: ['Block IP', 'Enhanced monitoring'],
      [ThreatType.UNAUTHORIZED_ACCESS]: ['Block IP', 'Review permissions'],
      [ThreatType.DATA_EXFILTRATION]: ['Block transfers', 'Review logs'],
      [ThreatType.DOS_ATTACK]: ['Rate limiting', 'Block IP'],
      [ThreatType.SESSION_HIJACKING]: ['Invalidate session', 'Require re-auth'],
      [ThreatType.PRIVILEGE_ESCALATION]: ['Review permissions', 'Log actions'],
      [ThreatType.THREAT_INTEL_MATCH]: ['Block IP', 'Enhanced monitoring']
    };

    return mitigations[threatType] || ['Log and monitor'];
  }

  private createBehavioralProfile(userId: string): BehavioralProfile {
    return {
      userId,
      baseline: {
        typicalIPs: [],
        typicalUserAgents: [],
        typicalRequestPatterns: [],
        typicalTimeRanges: [],
        typicalSessionDuration: 0,
        typicalPageViews: 0
      },
      currentSession: {
        startTime: Date.now(),
        ipAddress: '',
        userAgent: '',
        requestCount: 0,
        pageViews: 0,
        anomalousActions: [],
        riskScore: 0
      },
      historicalData: []
    };
  }

  private calculateBehavioralDeviations(profile: BehavioralProfile, event: any): string[] {
    const deviations: string[] = [];

    // Check IP deviation
    if (profile.baseline.typicalIPs.length > 0 &&
        !profile.baseline.typicalIPs.includes(event.ipAddress)) {
      deviations.push('Unusual IP address');
    }

    // Check user agent deviation
    if (profile.baseline.typicalUserAgents.length > 0 &&
        !profile.baseline.typicalUserAgents.includes(event.userAgent)) {
      deviations.push('Unusual user agent');
    }

    // Check time deviation
    const currentHour = new Date().getHours();
    if (profile.baseline.typicalTimeRanges.length > 0 &&
        !profile.baseline.typicalTimeRanges.includes(currentHour)) {
      deviations.push('Unusual access time');
    }

    return deviations;
  }

  private extractFeatures(event: any): number[] {
    // Extract numerical features for ML model
    return [
      this.getRequestFrequency(event.ipAddress),
      this.getFailedLoginRate(event.ipAddress),
      this.getTimeOfDayAnomaly(),
      this.getUserAgentAnomaly(event.userAgent),
      this.getPayloadAnomalyScore(event.payload || '')
    ];
  }

  private getRequestFrequency(ipAddress: string): number {
    const now = Date.now();
    const timeWindow = this.config.monitoringWindows.shortTerm;
    const requests = this.eventBuffer.filter(event =>
      event.ipAddress === ipAddress && (now - event.timestamp) <= timeWindow
    ).length;

    return Math.min(requests / 10, 1); // Normalize to 0-1
  }

  private getFailedLoginRate(ipAddress: string): number {
    const now = Date.now();
    const timeWindow = this.config.monitoringWindows.mediumTerm;
    const events = this.eventBuffer.filter(event =>
      event.ipAddress === ipAddress && (now - event.timestamp) <= timeWindow
    );

    if (events.length === 0) return 0;

    const failedAttempts = events.filter(event => event.type === 'LOGIN_FAILED').length;
    return failedAttempts / events.length;
  }

  private getTimeOfDayAnomaly(): number {
    const currentHour = new Date().getHours();
    // Business hours are 9-17
    return (currentHour < 9 || currentHour > 17) ? 0.8 : 0.2;
  }

  private getUserAgentAnomaly(userAgent: string): number {
    const normalizedUA = userAgent.toLowerCase();

    // Check for known automation tools
    const automationTools = ['bot', 'crawler', 'spider', 'scraper', 'automated'];
    for (const tool of automationTools) {
      if (normalizedUA.includes(tool)) return 0.9;
    }

    return 0.1;
  }

  private getPayloadAnomalyScore(payload: string): number {
    if (!payload) return 0;

    let score = 0;
    const suspiciousPatterns = [
      /<script/i, /javascript:/i, /union\s+select/i,
      /or\s+1\s*=\s*1/i, /drop\s+table/i
    ];

    for (const pattern of suspiciousPatterns) {
      if (pattern.test(payload)) {
        score += 0.3;
      }
    }

    return Math.min(score, 1);
  }

  private getCountryFromIP(ipAddress: string): string {
    // In production, use a proper IP geolocation service
    return 'Unknown';
  }

  private analyzeNetworkRequest(request: any): void {
    // Analyze request patterns for threats
    if (request.url.includes('..') || request.url.includes('%2e%2e')) {
      this.createThreatEvent({
        type: ThreatType.UNAUTHORIZED_ACCESS,
        severity: SecuritySeverity.HIGH,
        confidence: 80,
        description: 'Path traversal attempt detected',
        source: {
          ipAddress: 'unknown',
          userAgent: navigator.userAgent
        },
        indicators: [request.url],
        timestamp: request.timestamp
      });
    }
  }

  private analyzeFailedRequest(request: any): void {
    // Analyze failed requests for attack patterns
    if (request.error.includes('401') || request.error.includes('403')) {
      this.detectAnomalousBehavior({
        type: 'REPEATED_AUTH_FAILURES',
        timestamp: request.timestamp
      });
    }
  }

  private analyzeAuthenticationEvent(event: any): void {
    // Store authentication data for behavioral analysis
    this.eventBuffer.push({
      type: 'AUTH_EVENT',
      ...event,
      timestamp: event.timestamp
    });
  }

  private startPeriodicAnalysis(): void {
    // Analyze buffered events periodically
    setInterval(() => {
      this.analyzeEventBuffer();
    }, 60000); // Every minute
  }

  private analyzeEventBuffer(): void {
    // Look for patterns in buffered events
    const now = Date.now();
    const recentEvents = this.eventBuffer.filter(event =>
      (now - event.timestamp) <= this.config.monitoringWindows.shortTerm
    );

    // Check for distributed attacks
    this.checkDistributedAttacks(recentEvents);

    // Update ML model with new data
    if (this.mlModel && recentEvents.length > 0) {
      this.updateMLModel(recentEvents);
    }
  }

  private checkDistributedAttacks(events: any[]): void {
    // Group by IP and check for coordinated attacks
    const ipGroups = events.reduce((groups, event) => {
      const ip = event.ipAddress || 'unknown';
      if (!groups[ip]) groups[ip] = [];
      groups[ip].push(event);
      return groups;
    }, {} as Record<string, any[]>);

    // Check for multiple IPs with similar patterns
    const suspiciousPatterns = Object.values(ipGroups).filter(group =>
      group.length > 5
    );

    if (suspiciousPatterns.length > 1) {
      this.createThreatEvent({
        type: ThreatType.DOS_ATTACK,
        severity: SecuritySeverity.HIGH,
        confidence: 85,
        description: `Distributed attack detected: ${suspiciousPatterns.length} sources`,
        source: {
          ipAddress: 'multiple',
          userAgent: 'various'
        },
        indicators: [`Sources: ${suspiciousPatterns.length}`],
        timestamp: Date.now()
      });
    }
  }

  private updateMLModel(events: any[]): void {
    if (!this.mlModel) return;

    // Convert events to training data
    const trainingData = events.map(event => ({
      features: this.extractFeatures(event),
      label: event.type === 'LOGIN_FAILED' || event.type === 'SUSPICIOUS_ACTIVITY'
    }));

    // Update model (in production, use proper ML training)
    this.mlModel.train(trainingData);
  }

  private startThreatIntelUpdates(): void {
    // Update threat intelligence periodically
    setInterval(() => {
      this.updateThreatIntelligence();
    }, 24 * 60 * 60 * 1000); // Daily
  }

  private updateThreatIntelligence(): void {
    // In production, fetch from threat intelligence feeds
    console.log('[THREAT] Updating threat intelligence...');
    this.threatIntel.lastUpdated = Date.now();
  }

  private initializeBehavioralAnalysis(): void {
    // Initialize behavioral analysis for existing users
    if (typeof window !== 'undefined' && (window as any).currentUser) {
      const userId = (window as any).currentUser.id;
      if (!this.behavioralProfiles.has(userId)) {
        this.behavioralProfiles.set(userId, this.createBehavioralProfile(userId));
      }
    }
  }

  /**
   * Public API methods
   */

  // Add alert callback
  addAlertCallback(severity: SecuritySeverity, callback: (threat: ThreatEvent) => void): void {
    if (!this.alertCallbacks.has(severity)) {
      this.alertCallbacks.set(severity, []);
    }
    this.alertCallbacks.get(severity)!.push(callback);
  }

  // Get active threats
  getActiveThreats(): ThreatEvent[] {
    return Array.from(this.activeThreats.values());
  }

  // Get threats by severity
  getThreatsBySeverity(severity: SecuritySeverity): ThreatEvent[] {
    return this.getActiveThreats().filter(threat => threat.severity === severity);
  }

  // Resolve threat
  resolveThreat(threatId: string, resolution: string): void {
    const threat = this.activeThreats.get(threatId);
    if (threat) {
      threat.status = 'RESOLVED';
      console.log(`[THREAT] Threat ${threatId} resolved: ${resolution}`);
    }
  }

  // Update configuration
  updateConfig(config: Partial<ThreatDetectionConfig>): void {
    this.config = { ...this.config, ...config };
  }

  // Get threat statistics
  getThreatStatistics(): {
    total: number;
    byType: Record<string, number>;
    bySeverity: Record<string, number>;
    active: number;
    resolved: number;
  } {
    const threats = this.getActiveThreats();

    return {
      total: threats.length,
      byType: threats.reduce((acc, threat) => {
        acc[threat.type] = (acc[threat.type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      bySeverity: threats.reduce((acc, threat) => {
        acc[threat.severity] = (acc[threat.severity] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      active: threats.filter(t => t.status === 'DETECTED' || t.status === 'MITIGATING').length,
      resolved: threats.filter(t => t.status === 'RESOLVED').length
    };
  }
}

// Create and export singleton instance
export const realTimeThreatDetection = RealTimeThreatDetection.getInstance();

// Initialize automatically
if (typeof window !== 'undefined') {
  if (document.readyState === 'complete') {
    // System ready to start
  } else {
    window.addEventListener('load', () => {
      // Start after page load
    });
  }
}

// Export helper functions
export const detectThreat = (event: any) => realTimeThreatDetection.analyzeSecurityEvent(event);
export const getActiveThreats = () => realTimeThreatDetection.getActiveThreats();
export const getThreatStatistics = () => realTimeThreatDetection.getThreatStatistics();
export const addThreatAlertCallback = (severity: SecuritySeverity, callback: (threat: ThreatEvent) => void) =>
  realTimeThreatDetection.addAlertCallback(severity, callback);

// Export types
export { ThreatDetectionConfig, ThreatEvent, BehavioralProfile, ThreatIntelligence };