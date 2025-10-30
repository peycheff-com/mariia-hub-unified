/**
 * GDPR Compliance System
 *
 * Comprehensive GDPR compliance implementation for Mariia Hub platform
 * including consent management, data retention, anonymization, and audit logging.
 */

import { Context, Next } from 'hono';
import { productionSecurityConfig } from '../config/production-security';

interface ConsentRecord {
  id: string;
  userId?: string;
  sessionId: string;
  ipAddress: string;
  userAgent: string;
  timestamp: number;
  consent: {
    necessary: boolean;
    analytics: boolean;
    marketing: boolean;
    functional: boolean;
  };
  version: string;
  withdrawnAt?: number;
  legalBasis: 'contract' | 'legitimate_interest' | 'consent' | 'legal_obligation' | 'vital_interests' | 'public_task';
  purpose: string;
  dataController: string;
  dataProtectionOfficer: string;
}

interface DataProcessingRecord {
  id: string;
  userId?: string;
  sessionId: string;
  operation: 'create' | 'read' | 'update' | 'delete' | 'export';
  dataType: string;
  dataCategory: 'personal' | 'special' | 'criminal' | 'health';
  purpose: string;
  legalBasis: string;
  timestamp: number;
  processedBy: string;
  ipAddress: string;
  retentionDays: number;
  deletionDate?: number;
  anonymized: boolean;
}

interface DataSubjectRequest {
  id: string;
  type: 'access' | 'portability' | 'rectification' | 'erasure' | 'restriction';
  userId?: string;
  email: string;
  identityVerified: boolean;
  status: 'pending' | 'processing' | 'completed' | 'rejected';
  request: string;
  response?: string;
  createdAt: number;
  processedAt?: number;
  processedBy?: string;
  dueDate: number;
}

interface PrivacyImpactAssessment {
  id: string;
  projectName: string;
  description: string;
  dataTypes: string[];
  purposes: string[];
  risks: Array<{
    level: 'low' | 'medium' | 'high';
    description: string;
    mitigation: string;
  }>;
  assessor: string;
  date: number;
  approved: boolean;
  approvedBy?: string;
  approvalDate?: number;
}

class GDPRCompliance {
  private consentRecords: Map<string, ConsentRecord> = new Map();
  private processingRecords: DataProcessingRecord[] = [];
  private subjectRequests: Map<string, DataSubjectRequest> = new Map();
  private impactAssessments: Map<string, PrivacyImpactAssessment> = new Map();
  private readonly config = productionSecurityConfig.gdpr;
  private readonly legalBases = {
    necessary: {
      basis: 'legal_obligation' as const,
      purpose: 'Essential for the operation of the website',
      retention: 2555 // 7 years
    },
    analytics: {
      basis: 'legitimate_interest' as const,
      purpose: 'Website analytics and performance optimization',
      retention: 365
    },
    marketing: {
      basis: 'consent' as const,
      purpose: 'Marketing communications and promotional content',
      retention: 365
    },
    functional: {
      basis: 'consent' as const,
      purpose: 'Enhanced functionality and personalization',
      retention: 365
    }
  };

  /**
   * GDPR compliance middleware
   */
  async middleware(c: Context, next: Next): Promise<void> {
    const ip = this.getClientIP(c);
    const userAgent = c.req.header('User-Agent') || '';
    const sessionId = this.getSessionId(c);

    // Add GDPR headers
    this.addGDPRHeaders(c);

    // Log data processing
    await this.logDataProcessing(c, {
      operation: 'read',
      dataType: 'http_request',
      dataCategory: 'personal',
      purpose: 'request_processing',
      legalBasis: 'legitimate_interest',
      sessionId,
      ipAddress: ip,
      processedBy: 'system'
    });

    // Handle GDPR-specific endpoints
    if (c.req.path.startsWith('/api/gdpr/')) {
      await this.handleGDPREndpoint(c);
      return;
    }

    // Check for cookie consent requirements
    if (this.needsCookieConsent(c)) {
      const consent = this.getConsentRecord(sessionId);
      if (!consent || this.isConsentExpired(consent)) {
        await this.handleMissingConsent(c);
        return;
      }
    }

    // Continue with request
    await next();

    // Log response processing
    await this.logDataProcessing(c, {
      operation: 'create',
      dataType: 'http_response',
      dataCategory: 'personal',
      purpose: 'response_processing',
      legalBasis: 'legitimate_interest',
      sessionId,
      ipAddress: ip,
      processedBy: 'system'
    });
  }

  /**
   * Handle GDPR-specific API endpoints
   */
  private async handleGDPREndpoint(c: Context): Promise<void> {
    const path = c.req.path;
    const method = c.req.method;

    switch (path) {
      case '/api/gdpr/consent':
        if (method === 'POST') {
          await this.handleConsentRequest(c);
        } else if (method === 'GET') {
          await this.handleConsentRetrieval(c);
        } else if (method === 'DELETE') {
          await this.handleConsentWithdrawal(c);
        }
        break;

      case '/api/gdpr/access':
        if (method === 'POST') {
          await this.handleDataAccessRequest(c);
        }
        break;

      case '/api/gdpr/portability':
        if (method === 'POST') {
          await this.handleDataPortabilityRequest(c);
        }
        break;

      case '/api/gdpr/erasure':
        if (method === 'POST') {
          await this.handleDataErasureRequest(c);
        }
        break;

      case '/api/gdpr/rectification':
        if (method === 'POST') {
          await this.handleDataRectificationRequest(c);
        }
        break;

      case '/api/gdpr/privacy-policy':
        if (method === 'GET') {
          await this.handlePrivacyPolicyRequest(c);
        }
        break;

      case '/api/gdpr/processing-records':
        if (method === 'GET') {
          await this.handleProcessingRecordsRequest(c);
        }
        break;

      default:
        c.status(404);
        c.json({ error: 'GDPR endpoint not found' });
    }
  }

  /**
   * Handle consent requests
   */
  private async handleConsentRequest(c: Context): Promise<void> {
    try {
      const body = await c.req.json();
      const sessionId = this.getSessionId(c);
      const ip = this.getClientIP(c);
      const userAgent = c.req.header('User-Agent') || '';

      // Validate consent data
      const requiredCategories = ['necessary', 'analytics', 'marketing', 'functional'];
      for (const category of requiredCategories) {
        if (typeof body[category] !== 'boolean') {
          c.status(400);
          c.json({ error: 'Invalid consent data' });
          return;
        }
      }

      // Create consent record
      const consentRecord: ConsentRecord = {
        id: this.generateId(),
        sessionId,
        ipAddress: ip,
        userAgent,
        timestamp: Date.now(),
        consent: {
          necessary: body.necessary,
          analytics: body.analytics,
          marketing: body.marketing,
          functional: body.functional
        },
        version: '1.0',
        legalBasis: 'consent',
        purpose: 'Cookie and tracking consent',
        dataController: 'Mariia Borysevych',
        dataProtectionOfficer: 'privacy@mariaborysevych.com'
      };

      this.consentRecords.set(sessionId, consentRecord);

      // Log consent processing
      await this.logDataProcessing(c, {
        operation: 'create',
        dataType: 'consent_record',
        dataCategory: 'personal',
        purpose: 'consent_management',
        legalBasis: 'consent',
        sessionId,
        ipAddress: ip,
        processedBy: 'user',
        retentionDays: 365
      });

      c.json({
        success: true,
        consentId: consentRecord.id,
        timestamp: consentRecord.timestamp
      });

    } catch (error) {
      c.status(400);
      c.json({ error: 'Invalid request body' });
    }
  }

  /**
   * Handle data access requests
   */
  private async handleDataAccessRequest(c: Context): Promise<void> {
    try {
      const body = await c.req.json();
      const email = body.email;

      if (!email) {
        c.status(400);
        c.json({ error: 'Email is required' });
        return;
      }

      // Create data subject request
      const request: DataSubjectRequest = {
        id: this.generateId(),
        type: 'access',
        email,
        identityVerified: false,
        status: 'pending',
        request: JSON.stringify(body),
        createdAt: Date.now(),
        dueDate: Date.now() + (30 * 24 * 60 * 60 * 1000) // 30 days
      };

      this.subjectRequests.set(request.id, request);

      // Log the request
      await this.logDataProcessing(c, {
        operation: 'create',
        dataType: 'data_subject_request',
        dataCategory: 'personal',
        purpose: 'data_access_request',
        legalBasis: 'legal_obligation',
        sessionId: this.getSessionId(c),
        ipAddress: this.getClientIP(c),
        processedBy: 'user',
        retentionDays: 2555
      });

      c.json({
        success: true,
        requestId: request.id,
        message: 'Your data access request has been received. We will contact you within 30 days.',
        dueDate: new Date(request.dueDate).toISOString()
      });

    } catch (error) {
      c.status(400);
      c.json({ error: 'Invalid request body' });
    }
  }

  /**
   * Handle data portability requests
   */
  private async handleDataPortabilityRequest(c: Context): Promise<void> {
    try {
      const body = await c.req.json();
      const email = body.email;

      if (!email) {
        c.status(400);
        c.json({ error: 'Email is required' });
        return;
      }

      const request: DataSubjectRequest = {
        id: this.generateId(),
        type: 'portability',
        email,
        identityVerified: false,
        status: 'pending',
        request: JSON.stringify(body),
        createdAt: Date.now(),
        dueDate: Date.now() + (30 * 24 * 60 * 60 * 1000)
      };

      this.subjectRequests.set(request.id, request);

      await this.logDataProcessing(c, {
        operation: 'create',
        dataType: 'data_subject_request',
        dataCategory: 'personal',
        purpose: 'data_portability_request',
        legalBasis: 'legal_obligation',
        sessionId: this.getSessionId(c),
        ipAddress: this.getClientIP(c),
        processedBy: 'user',
        retentionDays: 2555
      });

      c.json({
        success: true,
        requestId: request.id,
        message: 'Your data portability request has been received. We will contact you within 30 days.',
        dueDate: new Date(request.dueDate).toISOString()
      });

    } catch (error) {
      c.status(400);
      c.json({ error: 'Invalid request body' });
    }
  }

  /**
   * Handle data erasure requests (Right to be Forgotten)
   */
  private async handleDataErasureRequest(c: Context): Promise<void> {
    try {
      const body = await c.req.json();
      const email = body.email;

      if (!email) {
        c.status(400);
        c.json({ error: 'Email is required' });
        return;
      }

      const request: DataSubjectRequest = {
        id: this.generateId(),
        type: 'erasure',
        email,
        identityVerified: false,
        status: 'pending',
        request: JSON.stringify(body),
        createdAt: Date.now(),
        dueDate: Date.now() + (30 * 24 * 60 * 60 * 1000)
      };

      this.subjectRequests.set(request.id, request);

      await this.logDataProcessing(c, {
        operation: 'create',
        dataType: 'data_subject_request',
        dataCategory: 'personal',
        purpose: 'data_erasure_request',
        legalBasis: 'legal_obligation',
        sessionId: this.getSessionId(c),
        ipAddress: this.getClientIP(c),
        processedBy: 'user',
        retentionDays: 2555
      });

      c.json({
        success: true,
        requestId: request.id,
        message: 'Your data erasure request has been received. We will contact you within 30 days.',
        dueDate: new Date(request.dueDate).toISOString()
      });

    } catch (error) {
      c.status(400);
      c.json({ error: 'Invalid request body' });
    }
  }

  /**
   * Handle data rectification requests
   */
  private async handleDataRectificationRequest(c: Context): Promise<void> {
    try {
      const body = await c.req.json();
      const email = body.email;

      if (!email) {
        c.status(400);
        c.json({ error: 'Email is required' });
        return;
      }

      const request: DataSubjectRequest = {
        id: this.generateId(),
        type: 'rectification',
        email,
        identityVerified: false,
        status: 'pending',
        request: JSON.stringify(body),
        createdAt: Date.now(),
        dueDate: Date.now() + (30 * 24 * 60 * 60 * 1000)
      };

      this.subjectRequests.set(request.id, request);

      await this.logDataProcessing(c, {
        operation: 'create',
        dataType: 'data_subject_request',
        dataCategory: 'personal',
        purpose: 'data_rectification_request',
        legalBasis: 'legal_obligation',
        sessionId: this.getSessionId(c),
        ipAddress: this.getClientIP(c),
        processedBy: 'user',
        retentionDays: 2555
      });

      c.json({
        success: true,
        requestId: request.id,
        message: 'Your data rectification request has been received. We will contact you within 30 days.',
        dueDate: new Date(request.dueDate).toISOString()
      });

    } catch (error) {
      c.status(400);
      c.json({ error: 'Invalid request body' });
    }
  }

  /**
   * Handle privacy policy requests
   */
  private async handlePrivacyPolicyRequest(c: Context): Promise<void> {
    c.json({
      version: '1.0',
      lastUpdated: '2025-01-01',
      dataController: {
        name: 'Mariia Borysevych',
        address: 'Warsaw, Poland',
        email: 'contact@mariaborysevych.com',
        phone: '+48 123 456 789'
      },
      dataProtectionOfficer: {
        email: 'privacy@mariaborysevych.com',
        phone: '+48 123 456 789'
      },
      purposes: [
        {
          category: 'necessary',
          description: 'Essential for the operation of the website',
          legalBasis: 'legal_obligation',
          retentionDays: 2555
        },
        {
          category: 'analytics',
          description: 'Website analytics and performance optimization',
          legalBasis: 'legitimate_interest',
          retentionDays: 365
        },
        {
          category: 'marketing',
          description: 'Marketing communications and promotional content',
          legalBasis: 'consent',
          retentionDays: 365
        },
        {
          category: 'functional',
          description: 'Enhanced functionality and personalization',
          legalBasis: 'consent',
          retentionDays: 365
        }
      ],
      rights: [
        'Right to be informed',
        'Right of access',
        'Right to rectification',
        'Right to erasure',
        'Right to restrict processing',
        'Right to data portability',
        'Right to object',
        'Rights in relation to automated decision making and profiling'
      ],
      contact: {
        privacy: 'privacy@mariaborysevych.com',
        general: 'contact@mariaborysevych.com',
        phone: '+48 123 456 789'
      }
    });
  }

  /**
   * Handle processing records requests
   */
  private async handleProcessingRecordsRequest(c: Context): Promise<void> {
    const sessionId = this.getSessionId(c);
    const records = this.processingRecords
      .filter(record => record.sessionId === sessionId)
      .map(record => ({
        id: record.id,
        operation: record.operation,
        dataType: record.dataType,
        dataCategory: record.dataCategory,
        purpose: record.purpose,
        legalBasis: record.legalBasis,
        timestamp: record.timestamp,
        retentionDays: record.retentionDays
      }));

    c.json({
      records,
      total: records.length
    });
  }

  /**
   * Check if consent is required for this request
   */
  private needsCookieConsent(c: Context): boolean {
    const path = c.req.path;
    const userAgent = c.req.header('User-Agent') || '';

    // Skip consent for API endpoints and bots
    if (path.startsWith('/api/') || this.isBot(userAgent)) {
      return false;
    }

    return true;
  }

  /**
   * Handle missing consent
   */
  private async handleMissingConsent(c: Context): Promise<void> {
    c.status(403);
    c.json({
      error: 'Consent Required',
      message: 'Please accept cookies to continue using this website',
      consentRequired: true,
      consentCategories: ['necessary', 'analytics', 'marketing', 'functional']
    });
  }

  /**
   * Get consent record for session
   */
  private getConsentRecord(sessionId: string): ConsentRecord | undefined {
    return this.consentRecords.get(sessionId);
  }

  /**
   * Check if consent has expired
   */
  private isConsentExpired(consent: ConsentRecord): boolean {
    const expiryDate = consent.timestamp + (this.config.cookieConsent.consentExpiry * 24 * 60 * 60 * 1000);
    return Date.now() > expiryDate;
  }

  /**
   * Log data processing activities
   */
  private async logDataProcessing(c: Context, record: Partial<DataProcessingRecord>): Promise<void> {
    const processingRecord: DataProcessingRecord = {
      id: this.generateId(),
      userId: record.userId,
      sessionId: record.sessionId || this.getSessionId(c),
      operation: record.operation || 'read',
      dataType: record.dataType || 'unknown',
      dataCategory: record.dataCategory || 'personal',
      purpose: record.purpose || 'unknown',
      legalBasis: record.legalBasis || 'consent',
      timestamp: Date.now(),
      processedBy: record.processedBy || 'system',
      ipAddress: record.ipAddress || this.getClientIP(c),
      retentionDays: record.retentionDays || 365,
      anonymized: false
    };

    this.processingRecords.push(processingRecord);

    // Keep only records within retention period
    const cutoffDate = Date.now() - (365 * 24 * 60 * 60 * 1000);
    this.processingRecords = this.processingRecords.filter(record => record.timestamp > cutoffDate);
  }

  /**
   * Anonymize expired data
   */
  public anonymizeExpiredData(): void {
    const now = Date.now();

    // Anonymize consent records older than retention period
    for (const [sessionId, consent] of this.consentRecords.entries()) {
      const retentionDate = consent.timestamp + (this.config.dataRetentionDays * 24 * 60 * 60 * 1000);
      if (now > retentionDate) {
        consent.ipAddress = this.hashString(consent.ipAddress);
        consent.userAgent = this.hashString(consent.userAgent);
        consent.anonymized = true;
      }
    }

    // Anonymize processing records older than retention period
    this.processingRecords.forEach(record => {
      const retentionDate = record.timestamp + (record.retentionDays * 24 * 60 * 60 * 1000);
      if (now > retentionDate) {
        record.ipAddress = this.hashString(record.ipAddress);
        record.sessionId = this.hashString(record.sessionId);
        record.anonymized = true;
      }
    });
  }

  /**
   * Add GDPR-specific headers
   */
  private addGDPRHeaders(c: Context): void {
    c.header('X-GDPR-Compliant', 'true');
    c.header('X-Privacy-Policy', '/privacy-policy');
    c.header('X-Data-Controller', 'Mariia Borysevych');
    c.header('X-Data-Protection-Officer', 'privacy@mariaborysevych.com');
  }

  /**
   * Helper methods
   */
  private getClientIP(c: Context): string {
    return (
      c.req.header('CF-Connecting-IP') ||
      c.req.header('X-Forwarded-For')?.split(',')[0]?.trim() ||
      c.req.header('X-Real-IP') ||
      c.req.header('X-Client-IP') ||
      'unknown'
    );
  }

  private getSessionId(c: Context): string {
    return c.req.header('X-Session-ID') || 'anonymous';
  }

  private isBot(userAgent: string): boolean {
    const botPatterns = [
      /googlebot/i,
      /bingbot/i,
      /slurp/i,
      /duckduckbot/i,
      /baiduspider/i,
      /yandexbot/i,
      /facebookexternalhit/i,
      /twitterbot/i,
      /whatsapp/i,
      /telegrambot/i
    ];
    return botPatterns.some(pattern => pattern.test(userAgent));
  }

  private generateId(): string {
    return Math.random().toString(36).substring(2) + Date.now().toString(36);
  }

  private hashString(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash.toString(36);
  }

  /**
   * Public API methods
   */
  public getConsentStatistics(): {
    totalConsents: number;
    consentByCategory: Record<string, number>;
    withdrawnConsents: number;
  } {
    const consents = Array.from(this.consentRecords.values());
    const consentByCategory = {
      necessary: 0,
      analytics: 0,
      marketing: 0,
      functional: 0
    };

    consents.forEach(consent => {
      if (consent.withdrawnAt) return;

      Object.keys(consent.consent).forEach(category => {
        if (consent.consent[category as keyof typeof consent.consent]) {
          consentByCategory[category as keyof typeof consentByCategory]++;
        }
      });
    });

    return {
      totalConsents: consents.filter(c => !c.withdrawnAt).length,
      consentByCategory,
      withdrawnConsents: consents.filter(c => c.withdrawnAt).length
    };
  }

  public getProcessingStatistics(): {
    totalRecords: number;
    operationsByType: Record<string, number>;
    dataCategories: Record<string, number>;
    legalBases: Record<string, number>;
  } {
    const operationsByType: Record<string, number> = {};
    const dataCategories: Record<string, number> = {};
    const legalBases: Record<string, number> = {};

    this.processingRecords.forEach(record => {
      operationsByType[record.operation] = (operationsByType[record.operation] || 0) + 1;
      dataCategories[record.dataCategory] = (dataCategories[record.dataCategory] || 0) + 1;
      legalBases[record.legalBasis] = (legalBases[record.legalBasis] || 0) + 1;
    });

    return {
      totalRecords: this.processingRecords.length,
      operationsByType,
      dataCategories,
      legalBases
    };
  }

  public getSubjectRequestStatistics(): {
    totalRequests: number;
    requestsByType: Record<string, number>;
    requestsByStatus: Record<string, number>;
    averageResponseTime: number;
  } {
    const requests = Array.from(this.subjectRequests.values());
    const requestsByType: Record<string, number> = {};
    const requestsByStatus: Record<string, number> = {};
    let totalResponseTime = 0;
    let completedRequests = 0;

    requests.forEach(request => {
      requestsByType[request.type] = (requestsByType[request.type] || 0) + 1;
      requestsByStatus[request.status] = (requestsByStatus[request.status] || 0) + 1;

      if (request.processedAt) {
        totalResponseTime += request.processedAt - request.createdAt;
        completedRequests++;
      }
    });

    return {
      totalRequests: requests.length,
      requestsByType,
      requestsByStatus,
      averageResponseTime: completedRequests > 0 ? totalResponseTime / completedRequests : 0
    };
  }

  public exportUserData(userId: string): any {
    // This would gather all user data from various sources
    // For now, return a placeholder
    return {
      consentRecords: Array.from(this.consentRecords.values()).filter(c => c.userId === userId),
      processingRecords: this.processingRecords.filter(r => r.userId === userId),
      subjectRequests: Array.from(this.subjectRequests.values()).filter(r => r.userId === userId)
    };
  }

  public deleteUserData(userId: string): void {
    // Delete consent records
    for (const [sessionId, consent] of this.consentRecords.entries()) {
      if (consent.userId === userId) {
        this.consentRecords.delete(sessionId);
      }
    }

    // Anonymize processing records
    this.processingRecords.forEach(record => {
      if (record.userId === userId) {
        record.userId = 'deleted';
        record.anonymized = true;
      }
    });

    // Delete subject requests
    for (const [requestId, request] of this.subjectRequests.entries()) {
      if (request.userId === userId) {
        this.subjectRequests.delete(requestId);
      }
    }
  }
}

// Singleton instance
const gdprCompliance = new GDPRCompliance();

// Export middleware
export const gdprMiddleware = gdprCompliance.middleware.bind(gdprCompliance);

// Export class for advanced usage
export { GDPRCompliance, ConsentRecord, DataProcessingRecord, DataSubjectRequest };

// Export utility functions
export const getGDPRStatistics = () => ({
  consent: gdprCompliance.getConsentStatistics(),
  processing: gdprCompliance.getProcessingStatistics(),
  subjectRequests: gdprCompliance.getSubjectRequestStatistics()
});

export const anonymizeExpiredData = () => gdprCompliance.anonymizeExpiredData();
export const exportUserData = (userId: string) => gdprCompliance.exportUserData(userId);
export const deleteUserData = (userId: string) => gdprCompliance.deleteUserData(userId);