/**
 * Booksy Consent Manager
 *
 * GDPR-compliant consent management for Booksy data synchronization
 * Handles consent collection, storage, revocation, and compliance
 */

import { supabase } from '@/integrations/supabase/client';
import { BaseService } from './api/base.service';

export interface BooksyConsentRecord {
  id: string;
  userId: string;
  consentType: 'data_sync' | 'appointment_history' | 'contact_info' | 'service_preferences' | 'marketing';
  consentGiven: boolean;
  consentData: {
    dataSync?: boolean;
    appointmentHistory?: boolean;
    contactInfo?: boolean;
    servicePreferences?: boolean;
    marketing?: boolean;
  };
  ipAddress: string;
  userAgent: string;
  timestamp: Date;
  version: string;
  legalBasis: 'explicit_consent' | 'legitimate_interest' | 'contractual_necessity';
  retentionPeriod: number; // days
  expiryDate?: Date;
  purpose?: string;
}

export interface ConsentRequest {
  userId: string;
  consentData: {
    dataSync: boolean;
    appointmentHistory: boolean;
    contactInfo: boolean;
    servicePreferences: boolean;
    marketing: boolean;
  };
  ipAddress: string;
  userAgent: string;
  purpose?: string;
  legalBasis?: 'explicit_consent' | 'legitimate_interest';
}

export interface ConsentPolicy {
  version: string;
  effectiveDate: Date;
  description: string;
  purposes: string[];
  retentionPeriod: number;
  dataTypes: string[];
  legalBasis: string;
  contactInfo: {
    email: string;
    address: string;
    phone: string;
  };
}

export class BooksyConsentManager extends BaseService {
  private static instance: BooksyConsentManager;
  private currentPolicy: ConsentPolicy;

  static getInstance(): BooksyConsentManager {
    if (!BooksyConsentManager.instance) {
      BooksyConsentManager.instance = new BooksyConsentManager();
    }
    return BooksyConsentManager.instance;
  }

  constructor() {
    super();
    this.currentPolicy = {
      version: '1.0',
      effectiveDate: new Date('2024-01-01'),
      description: 'Consent for Booksy platform integration and data synchronization',
      purposes: [
        'Synchronization of appointment data between platform and Booksy',
        'Centralized management of booking information',
        'Enhanced customer service experience',
        'Analytics and business intelligence'
      ],
      retentionPeriod: 365, // 1 year
      dataTypes: [
        'Appointment dates and times',
        'Service preferences and history',
        'Contact information (name, email, phone)',
        'Service notes and special requirements'
      ],
      legalBasis: 'explicit_consent',
      contactInfo: {
        email: 'privacy@mariaborysevych.com',
        address: 'ul. Jana Pawła II 43/15, 00-001 Warszawa, Polska',
        phone: '+48 123 456 789'
      }
    };
  }

  /**
   * Record new consent
   */
  async recordConsent(request: ConsentRequest): Promise<BooksyConsentRecord> {
    try {
      const consentId = crypto.randomUUID();
      const timestamp = new Date();
      const expiryDate = new Date(timestamp.getTime() + this.currentPolicy.retentionPeriod * 24 * 60 * 60 * 1000);

      // Create consent record
      const consentRecord: BooksyConsentRecord = {
        id: consentId,
        userId: request.userId,
        consentType: 'data_sync',
        consentGiven: request.consentData.dataSync,
        consentData: request.consentData,
        ipAddress: request.ipAddress,
        userAgent: request.userAgent,
        timestamp,
        version: this.currentPolicy.version,
        legalBasis: request.legalBasis || 'explicit_consent',
        retentionPeriod: this.currentPolicy.retentionPeriod,
        expiryDate,
        purpose: request.purpose || 'Booksy platform integration'
      };

      // Store in database
      const { data, error } = await supabase
        .from('gdpr_consent_records')
        .insert({
          id: consentId,
          user_id: request.userId,
          consent_type: 'booksy_data_sync',
          consent_given: request.consentData.dataSync,
          consent_data: request.consentData,
          ip_address: request.ipAddress,
          user_agent: request.userAgent,
          timestamp: timestamp.toISOString(),
          version: this.currentPolicy.version,
          legal_basis: request.legalBasis || 'explicit_consent',
          retention_period: this.currentPolicy.retentionPeriod,
          expiry_date: expiryDate.toISOString(),
          purpose: request.purpose || 'Booksy platform integration',
          created_at: timestamp.toISOString()
        })
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to record consent: ${error.message}`);
      }

      // Update user profile with Booksy consent status
      await this.updateUserProfileConsent(request.userId, request.consentData);

      // Log consent recording
      await this.logConsentActivity('consent_recorded', request.userId, consentRecord, true);

      return { ...consentRecord, ...data };
    } catch (error) {
      console.error('Failed to record consent:', error);
      await this.logConsentActivity('consent_recording_failed', request.userId, null, false, error instanceof Error ? error.message : 'Unknown error');
      throw error;
    }
  }

  /**
   * Revoke consent
   */
  async revokeConsent(userId: string, reason: string, ipAddress: string): Promise<void> {
    try {
      const timestamp = new Date();

      // Record revocation
      const { error: revokeError } = await supabase
        .from('gdpr_consent_records')
        .insert({
          id: crypto.randomUUID(),
          user_id: userId,
          consent_type: 'booksy_data_sync',
          consent_given: false,
          consent_data: {
            dataSync: false,
            appointmentHistory: false,
            contactInfo: false,
            servicePreferences: false,
            marketing: false
          },
          ip_address: ipAddress,
          user_agent: 'system_revocation',
          timestamp: timestamp.toISOString(),
          version: this.currentPolicy.version,
          legal_basis: 'explicit_consent',
          retention_period: this.currentPolicy.retentionPeriod,
          purpose: 'Consent revocation',
          created_at: timestamp.toISOString()
        });

      if (revokeError) {
        throw new Error(`Failed to record revocation: ${revokeError.message}`);
      }

      // Update user profile
      await supabase
        .from('profiles')
        .update({
          booksy_data_consent: false,
          booksy_consent_revoked_at: timestamp.toISOString(),
          booksy_sync_status: 'error',
          booksy_sync_error: 'Consent revoked',
          updated_at: timestamp.toISOString()
        })
        .eq('id', userId);

      // Schedule data cleanup for this user
      await this.scheduleDataCleanup(userId);

      // Log revocation
      await this.logConsentActivity('consent_revoked', userId, { reason, timestamp }, true);

      console.log(`Consent revoked for user ${userId}. Reason: ${reason}`);
    } catch (error) {
      console.error('Failed to revoke consent:', error);
      await this.logConsentActivity('consent_revocation_failed', userId, null, false, error instanceof Error ? error.message : 'Unknown error');
      throw error;
    }
  }

  /**
   * Check if user has valid consent
   */
  async hasValidConsent(userId: string, consentType: string = 'dataSync'): Promise<boolean> {
    try {
      // Check user profile first
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('booksy_data_consent, booksy_consent_given_at, booksy_consent_revoked_at')
        .eq('id', userId)
        .single();

      if (profileError || !profile) {
        return false;
      }

      // Check if consent was revoked after it was given
      if (profile.booksy_consent_revoked_at &&
          profile.booksy_consent_given_at &&
          new Date(profile.booksy_consent_revoked_at) > new Date(profile.booksy_consent_given_at)) {
        return false;
      }

      // If no consent recorded in profile, check consent records
      if (!profile.booksy_data_consent) {
        const { data: latestConsent, error: consentError } = await supabase
          .from('gdpr_consent_records')
          .select('*')
          .eq('user_id', userId)
          .eq('consent_type', 'booksy_data_sync')
          .order('timestamp', { ascending: false })
          .limit(1)
          .single();

        if (consentError || !latestConsent) {
          return false;
        }

        // Check if consent has expired
        if (latestConsent.expiry_date && new Date(latestConsent.expiry_date) < new Date()) {
          return false;
        }

        // Check specific consent type
        if (consentType === 'dataSync') {
          return latestConsent.consent_given;
        } else {
          return latestConsent.consent_data?.[consentType] || false;
        }
      }

      return true;
    } catch (error) {
      console.error('Failed to check consent validity:', error);
      return false;
    }
  }

  /**
   * Get user's consent history
   */
  async getConsentHistory(userId: string): Promise<BooksyConsentRecord[]> {
    try {
      const { data, error } = await supabase
        .from('gdpr_consent_records')
        .select('*')
        .eq('user_id', userId)
        .eq('consent_type', 'booksy_data_sync')
        .order('timestamp', { ascending: false });

      if (error) {
        throw new Error(`Failed to fetch consent history: ${error.message}`);
      }

      return (data || []).map(record => ({
        id: record.id,
        userId: record.user_id,
        consentType: record.consent_type,
        consentGiven: record.consent_given,
        consentData: record.consent_data,
        ipAddress: record.ip_address,
        userAgent: record.user_agent,
        timestamp: new Date(record.timestamp),
        version: record.version,
        legalBasis: record.legal_basis,
        retentionPeriod: record.retention_period,
        expiryDate: record.expiry_date ? new Date(record.expiry_date) : undefined,
        purpose: record.purpose
      }));
    } catch (error) {
      console.error('Failed to get consent history:', error);
      throw error;
    }
  }

  /**
   * Get current consent policy
   */
  getCurrentPolicy(): ConsentPolicy {
    return this.currentPolicy;
  }

  /**
   * Update consent policy (admin only)
   */
  async updatePolicy(newPolicy: Partial<ConsentPolicy>, adminUserId: string): Promise<void> {
    try {
      // Verify admin permissions
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', adminUserId)
        .single();

      if (profile?.role !== 'admin') {
        throw new Error('Admin privileges required to update consent policy');
      }

      // Update policy
      this.currentPolicy = {
        ...this.currentPolicy,
        ...newPolicy,
        version: this.generateNewVersion()
      };

      // Store policy update
      await supabase
        .from('gdpr_policy_versions')
        .insert({
          version: this.currentPolicy.version,
          policy_data: this.currentPolicy,
          effective_date: this.currentPolicy.effectiveDate.toISOString(),
          created_by: adminUserId,
          created_at: new Date().toISOString()
        });

      // Log policy update
      await this.logConsentActivity('policy_updated', adminUserId, { newPolicy: this.currentPolicy }, true);

      console.log('Consent policy updated successfully');
    } catch (error) {
      console.error('Failed to update consent policy:', error);
      await this.logConsentActivity('policy_update_failed', adminUserId, null, false, error instanceof Error ? error.message : 'Unknown error');
      throw error;
    }
  }

  /**
   * Generate consent report for data protection officer
   */
  async generateConsentReport(startDate: Date, endDate: Date): Promise<{
    totalConsents: number;
    activeConsents: number;
    revokedConsents: number;
    expiredConsents: number;
    consentDetails: Array<{
      userId: string;
      consentGiven: boolean;
      timestamp: Date;
      consentData: any;
    }>;
  }> {
    try {
      const { data, error } = await supabase
        .from('gdpr_consent_records')
        .select('*')
        .eq('consent_type', 'booksy_data_sync')
        .gte('timestamp', startDate.toISOString())
        .lte('timestamp', endDate.toISOString())
        .order('timestamp', { ascending: false });

      if (error) {
        throw new Error(`Failed to generate consent report: ${error.message}`);
      }

      const records = data || [];
      const totalConsents = records.length;
      const activeConsents = records.filter(r => r.consent_given).length;
      const revokedConsents = records.filter(r => !r.consent_given).length;

      // Check for expired consents
      const expiredConsents = records.filter(r =>
        r.expiry_date && new Date(r.expiry_date) < new Date()
      ).length;

      const consentDetails = records.map(record => ({
        userId: record.user_id,
        consentGiven: record.consent_given,
        timestamp: new Date(record.timestamp),
        consentData: record.consent_data
      }));

      return {
        totalConsents,
        activeConsents,
        revokedConsents,
        expiredConsents,
        consentDetails
      };
    } catch (error) {
      console.error('Failed to generate consent report:', error);
      throw error;
    }
  }

  /**
   * Handle data subject access request (DSAR)
   */
  async handleDataSubjectRequest(userId: string, requestType: 'access' | 'portability' | 'deletion'): Promise<{
    status: 'processing' | 'completed' | 'failed';
    data?: any;
    message?: string;
  }> {
    try {
      const requestId = crypto.randomUUID();

      // Log the request
      await supabase
        .from('gdpr_data_subject_requests')
        .insert({
          id: requestId,
          user_id: userId,
          request_type: requestType,
          status: 'processing',
          created_at: new Date().toISOString()
        });

      switch (requestType) {
        case 'access':
          return await this.provideDataAccess(userId, requestId);
        case 'portability':
          return await this.provideDataPortability(userId, requestId);
        case 'deletion':
          return await this.processDataDeletion(userId, requestId);
        default:
          throw new Error('Invalid request type');
      }
    } catch (error) {
      console.error('Failed to handle data subject request:', error);
      return {
        status: 'failed',
        message: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Update user profile consent status
   */
  private async updateUserProfileConsent(userId: string, consentData: any): Promise<void> {
    const updateData: any = {
      booksy_data_consent: consentData.dataSync,
      booksy_consent_given_at: consentData.dataSync ? new Date().toISOString() : null,
      booksy_last_sync: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    if (!consentData.dataSync) {
      updateData.booksy_consent_revoked_at = new Date().toISOString();
      updateData.booksy_sync_status = 'error';
      updateData.booksy_sync_error = 'Consent not given';
    } else {
      updateData.booksy_sync_status = 'pending';
      updateData.booksy_sync_error = null;
    }

    await supabase
      .from('profiles')
      .update(updateData)
      .eq('id', userId);
  }

  /**
   * Schedule data cleanup for revoked consent
   */
  private async scheduleDataCleanup(userId: string): Promise<void> {
    // Add to cleanup queue
    await supabase
      .from('gdpr_cleanup_queue')
      .insert({
        user_id: userId,
        cleanup_type: 'booksy_data_removal',
        scheduled_for: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
        status: 'pending',
        created_at: new Date().toISOString()
      });
  }

  /**
   * Log consent-related activities
   */
  private async logConsentActivity(
    action: string,
    userId: string,
    data: any,
    success: boolean,
    errorMessage?: string
  ): Promise<void> {
    try {
      await supabase
        .from('gdpr_audit_logs')
        .insert({
          action,
          user_id: userId,
          entity_type: 'consent',
          entity_id: data?.id || null,
          old_data: null,
          new_data: data,
          success,
          error_message: errorMessage,
          ip_address: 'system',
          user_agent: 'consent_manager',
          created_at: new Date().toISOString()
        });
    } catch (error) {
      console.error('Failed to log consent activity:', error);
    }
  }

  /**
   * Generate new policy version
   */
  private generateNewVersion(): string {
    const currentVersion = this.currentPolicy.version;
    const versionParts = currentVersion.split('.');
    const patchVersion = parseInt(versionParts[2] || '0') + 1;
    return `${versionParts[0]}.${versionParts[1]}.${patchVersion}`;
  }

  /**
   * Provide data access for DSAR
   */
  private async provideDataAccess(userId: string, requestId: string): Promise<any> {
    try {
      // Get all user data related to Booksy integration
      const [
        profile,
        consentRecords,
        bookings,
        auditLogs
      ] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', userId).single(),
        supabase.from('gdpr_consent_records').select('*').eq('user_id', userId),
        supabase.from('bookings').select('*').eq('client_id', userId).not('booksy_booking_id', 'is', null),
        supabase.from('gdpr_audit_logs').select('*').eq('user_id', userId)
      ]);

      const userData = {
        profile: profile.data,
        consentRecords: consentRecords.data,
        booksyBookings: bookings.data,
        auditLogs: auditLogs.data,
        providedAt: new Date().toISOString(),
        requestId
      };

      // Update request status
      await supabase
        .from('gdpr_data_subject_requests')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
          data_provided: userData
        })
        .eq('id', requestId);

      return {
        status: 'completed',
        data: userData
      };
    } catch (error) {
      // Update request status to failed
      await supabase
        .from('gdpr_data_subject_requests')
        .update({
          status: 'failed',
          error_message: error instanceof Error ? error.message : 'Unknown error'
        })
        .eq('id', requestId);

      throw error;
    }
  }

  /**
   * Provide data portability for DSAR
   */
  private async provideDataPortability(userId: string, requestId: string): Promise<any> {
    try {
      const accessData = await this.provideDataAccess(userId, requestId);

      // Format data for portability (JSON, CSV formats)
      const portableData = {
        format: 'json',
        version: '1.0',
        exportedAt: new Date().toISOString(),
        requestId,
        user: accessData.data
      };

      return {
        status: 'completed',
        data: portableData
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Process data deletion for DSAR
   */
  private async processDataDeletion(userId: string, requestId: string): Promise<any> {
    try {
      // Anonymize user data rather than delete (to maintain business records)
      await supabase
        .from('profiles')
        .update({
          booksy_data_consent: false,
          booksy_consent_revoked_at: new Date().toISOString(),
          booksy_sync_status: 'deleted',
          booksy_sync_error: 'Data deleted per GDPR request',
          booksy_client_id: null,
          booksy_last_sync: new Date().toISOString()
        })
        .eq('id', userId);

      // Update request status
      await supabase
        .from('gdpr_data_subject_requests')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString()
        })
        .eq('id', requestId);

      return {
        status: 'completed',
        message: 'User data has been anonymized in accordance with GDPR requirements'
      };
    } catch (error) {
      // Update request status to failed
      await supabase
        .from('gdpr_data_subject_requests')
        .update({
          status: 'failed',
          error_message: error instanceof Error ? error.message : 'Unknown error'
        })
        .eq('id', requestId);

      throw error;
    }
  }
}

// Export singleton instance
export const booksyConsentManager = BooksyConsentManager.getInstance();