import { supabase } from '@/integrations/supabase/client';
import {
  ModelConsent,
  ConsentRequest,
  ConsentUsageLog,
  ConsentTemplate,
  ConsentRevocation,
  ConsentFormData,
  ConsentAnalytics,
  LogConsentUsageParams,
  RevokeConsentParams,
  ExpiringConsent
} from '@/types/consent';

export class ConsentService {
  // Consent CRUD operations
  static async getConsents(options?: {
    clientId?: string;
    status?: string[];
    consentType?: string[];
    limit?: number;
    offset?: number;
  }): Promise<{ data: ModelConsent[]; count: number }> {
    let query = supabase
      .from('model_consent')
      .select('*', { count: 'exact' });

    if (options?.clientId) {
      query = query.eq('client_id', options.clientId);
    }

    if (options?.status && options.status.length > 0) {
      query = query.in('status', options.status);
    }

    if (options?.consentType && options.consentType.length > 0) {
      query = query.in('consent_type', options.consentType);
    }

    if (options?.limit) {
      query = query.limit(options.limit);
    }

    if (options?.offset) {
      query = query.range(options.offset, options.offset + (options.limit || 10) - 1);
    }

    query = query.order('created_at', { ascending: false });

    const { data, error, count } = await query;

    if (error) {
      console.error('Error fetching consents:', error);
      throw error;
    }

    return { data: data || [], count: count || 0 };
  }

  static async getConsentById(id: string): Promise<ModelConsent | null> {
    const { data, error } = await supabase
      .from('model_consent')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching consent:', error);
      if (error.code === 'PGRST116') {
        return null; // Not found
      }
      throw error;
    }

    return data;
  }

  static async createConsent(consentData: Omit<ModelConsent, 'id' | 'created_at' | 'updated_at'>): Promise<ModelConsent> {
    // Add technical tracking data
    const enrichedData = {
      ...consentData,
      ip_address: await this.getClientIP(),
      user_agent: navigator.userAgent,
      device_fingerprint: await this.generateDeviceFingerprint(),
    };

    const { data, error } = await supabase
      .from('model_consent')
      .insert(enrichedData)
      .select()
      .single();

    if (error) {
      console.error('Error creating consent:', error);
      throw error;
    }

    return data;
  }

  static async updateConsent(
    id: string,
    updates: Partial<ModelConsent>
  ): Promise<ModelConsent> {
    const { data, error } = await supabase
      .from('model_consent')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating consent:', error);
      throw error;
    }

    return data;
  }

  static async deleteConsent(id: string): Promise<void> {
    const { error } = await supabase
      .from('model_consent')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting consent:', error);
      throw error;
    }
  }

  // Consent Template operations
  static async getConsentTemplates(options?: {
    type?: string;
    language?: string;
    active?: boolean;
  }): Promise<ConsentTemplate[]> {
    let query = supabase
      .from('consent_templates')
      .select('*')
      .order('is_default', { ascending: false })
      .order('created_at', { ascending: false });

    if (options?.type) {
      query = query.eq('template_type', options.type);
    }

    if (options?.language) {
      query = query.eq('language', options.language);
    }

    if (options?.active !== undefined) {
      query = query.eq('is_active', options.active);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching consent templates:', error);
      throw error;
    }

    return data || [];
  }

  static async getConsentTemplateById(id: string): Promise<ConsentTemplate | null> {
    const { data, error } = await supabase
      .from('consent_templates')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching consent template:', error);
      if (error.code === 'PGRST116') {
        return null;
      }
      throw error;
    }

    return data;
  }

  static async createConsentTemplate(templateData: Omit<ConsentTemplate, 'id' | 'created_at' | 'updated_at'>): Promise<ConsentTemplate> {
    const { data, error } = await supabase
      .from('consent_templates')
      .insert(templateData)
      .select()
      .single();

    if (error) {
      console.error('Error creating consent template:', error);
      throw error;
    }

    return data;
  }

  static async updateConsentTemplate(
    id: string,
    updates: Partial<ConsentTemplate>
  ): Promise<ConsentTemplate> {
    const { data, error } = await supabase
      .from('consent_templates')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating consent template:', error);
      throw error;
    }

    return data;
  }

  // Consent Request operations
  static async getConsentRequests(options?: {
    clientId?: string;
    status?: string;
    limit?: number;
    offset?: number;
  }): Promise<ConsentRequest[]> {
    let query = supabase
      .from('consent_requests')
      .select('*')
      .order('created_at', { ascending: false });

    if (options?.clientId) {
      query = query.eq('client_id', options.clientId);
    }

    if (options?.status) {
      query = query.eq('response_status', options.status);
    }

    if (options?.limit) {
      query = query.limit(options.limit);
    }

    if (options?.offset) {
      query = query.range(options.offset, options.offset + (options.limit || 10) - 1);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching consent requests:', error);
      throw error;
    }

    return data || [];
  }

  static async createConsentRequest(requestData: Omit<ConsentRequest, 'id' | 'created_at' | 'updated_at' | 'consent_form_token'>): Promise<ConsentRequest> {
    const { data, error } = await supabase
      .from('consent_requests')
      .insert(requestData)
      .select()
      .single();

    if (error) {
      console.error('Error creating consent request:', error);
      throw error;
    }

    return data;
  }

  static async updateConsentRequest(
    id: string,
    updates: Partial<ConsentRequest>
  ): Promise<ConsentRequest> {
    const { data, error } = await supabase
      .from('consent_requests')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating consent request:', error);
      throw error;
    }

    return data;
  }

  static async getConsentRequestByToken(token: string): Promise<ConsentRequest | null> {
    const { data, error } = await supabase
      .from('consent_requests')
      .select('*')
      .eq('consent_form_token', token)
      .single();

    if (error) {
      console.error('Error fetching consent request by token:', error);
      if (error.code === 'PGRST116') {
        return null;
      }
      throw error;
    }

    return data;
  }

  // Usage Log operations
  static async getUsageLogs(options?: {
    consentId?: string;
    usageType?: string;
    limit?: number;
    offset?: number;
  }): Promise<ConsentUsageLog[]> {
    let query = supabase
      .from('consent_usage_log')
      .select('*')
      .order('used_at', { ascending: false });

    if (options?.consentId) {
      query = query.eq('consent_id', options.consentId);
    }

    if (options?.usageType) {
      query = query.eq('usage_type', options.usageType);
    }

    if (options?.limit) {
      query = query.limit(options.limit);
    }

    if (options?.offset) {
      query = query.range(options.offset, options.offset + (options.limit || 10) - 1);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching usage logs:', error);
      throw error;
    }

    return data || [];
  }

  static async createUsageLog(logData: Omit<ConsentUsageLog, 'id' | 'created_at' | 'used_at'>): Promise<ConsentUsageLog> {
    const { data, error } = await supabase
      .from('consent_usage_log')
      .insert({ ...logData, used_at: new Date().toISOString() })
      .select()
      .single();

    if (error) {
      console.error('Error creating usage log:', error);
      throw error;
    }

    return data;
  }

  // Database function calls
  static async isConsentActive(consentId: string): Promise<boolean> {
    const { data, error } = await supabase
      .rpc('is_consent_active', { consent_uuid: consentId });

    if (error) {
      console.error('Error checking consent status:', error);
      throw error;
    }

    return data || false;
  }

  static async logConsentUsage(params: LogConsentUsageParams): Promise<string> {
    const { data, error } = await supabase
      .rpc('log_consent_usage', params);

    if (error) {
      console.error('Error logging consent usage:', error);
      throw error;
    }

    return data;
  }

  static async revokeConsent(params: RevokeConsentParams): Promise<boolean> {
    const { data, error } = await supabase
      .rpc('revoke_consent', params);

    if (error) {
      console.error('Error revoking consent:', error);
      throw error;
    }

    return data;
  }

  static async getExpiringConsent(daysAhead: number = 30): Promise<ExpiringConsent[]> {
    const { data, error } = await supabase
      .rpc('get_expiring_consent', { days_ahead: daysAhead });

    if (error) {
      console.error('Error fetching expiring consents:', error);
      throw error;
    }

    return data || [];
  }

  // Analytics
  static async getConsentAnalytics(): Promise<ConsentAnalytics> {
    // Get basic counts
    const { count: totalConsents } = await supabase
      .from('model_consent')
      .select('*', { count: 'exact', head: true });

    const { count: activeConsents } = await supabase
      .from('model_consent')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'active');

    const { count: expiredConsents } = await supabase
      .from('model_consent')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'expired');

    const { count: revokedConsents } = await supabase
      .from('model_consent')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'revoked');

    // Get consents by type
    const { data: consentsByTypeData } = await supabase
      .from('model_consent')
      .select('consent_type')
      .eq('status', 'active');

    const consentsByType = consentsByTypeData?.reduce((acc, consent) => {
      acc[consent.consent_type] = (acc[consent.consent_type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>) || {};

    // Get usage by type
    const { data: usageByTypeData } = await supabase
      .from('consent_usage_log')
      .select('usage_type')
      .gte('used_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

    const usageByType = usageByTypeData?.reduce((acc, log) => {
      acc[log.usage_type] = (acc[log.usage_type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>) || {};

    // Get recent usage
    const { data: recentUsage } = await supabase
      .from('consent_usage_log')
      .select('*')
      .gte('used_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
      .order('used_at', { ascending: false })
      .limit(10);

    // Get top used content
    const { data: topUsedData } = await supabase
      .from('consent_usage_log')
      .select('consent_id, used_at')
      .order('used_at', { ascending: false });

    const topUsedContent = topUsedData?.reduce((acc, log) => {
      const existing = acc.find(item => item.consent_id === log.consent_id);
      if (existing) {
        existing.usage_count++;
        if (new Date(log.used_at) > new Date(existing.last_used)) {
          existing.last_used = log.used_at;
        }
      } else {
        acc.push({
          consent_id: log.consent_id,
          usage_count: 1,
          last_used: log.used_at
        });
      }
      return acc;
    }, [] as Array<{ consent_id: string; usage_count: number; last_used: string }>)
      .sort((a, b) => b.usage_count - a.usage_count)
      .slice(0, 10) || [];

    // Get pending requests
    const { count: pendingRequests } = await supabase
      .from('consent_requests')
      .select('*', { count: 'exact', head: true })
      .eq('response_status', 'pending');

    // Get expiring consents
    const expiringNext30 = await this.getExpiringConsent(30);
    const expiringNext7 = await this.getExpiringConsent(7);

    return {
      total_consent_records: totalConsents || 0,
      active_consents: activeConsents || 0,
      expired_consents: expiredConsents || 0,
      revoked_consents: revokedConsents || 0,
      pending_requests: pendingRequests || 0,
      consents_by_type: consentsByType,
      usage_by_type: usageByType,
      expiring_next_30_days: expiringNext30.length,
      expiring_next_7_days: expiringNext7.length,
      recent_usage: recentUsage || [],
      top_used_content: topUsedContent
    };
  }

  // Utility methods
  private static async getClientIP(): Promise<string> {
    try {
      const response = await fetch('https://api.ipify.org?format=json');
      const data = await response.json();
      return data.ip;
    } catch (error) {
      console.error('Error getting client IP:', error);
      return '';
    }
  }

  private static async generateDeviceFingerprint(): Promise<string> {
    // Simple device fingerprinting
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.textBaseline = 'top';
      ctx.font = '14px Arial';
      ctx.fillText('Device fingerprint', 2, 2);
    }

    const fingerprint = [
      navigator.userAgent,
      navigator.language,
      screen.width + 'x' + screen.height,
      new Date().getTimezoneOffset(),
      canvas?.toDataURL() || ''
    ].join('|');

    return btoa(fingerprint).substring(0, 32);
  }

  // Process consent form submission
  static async processConsentForm(
    requestId: string,
    formData: ConsentFormData
  ): Promise<ModelConsent> {
    // Update request status
    await this.updateConsentRequest(requestId, {
      response_status: 'approved',
      response_date: new Date().toISOString()
    });

    // Get request details
    const request = await this.getConsentRequestByToken(requestId);
    if (!request) {
      throw new Error('Consent request not found');
    }

    // Create consent record
    const consentData = {
      client_id: request.client_id,
      booking_id: request.booking_id,
      consent_type: formData.consent_type,
      scope: formData.scope,
      duration: formData.duration,
      expiry_date: formData.expiry_date,
      compensation_details: formData.compensation_details,
      compensation_type: formData.compensation_type,
      restrictions: formData.restrictions,
      signature_data: formData.signature_data!,
      signature_method: formData.signature_method,
      legal_representative: formData.legal_representative,
      consent_language: formData.consent_language,
      notes: `Consent form submitted via request ${requestId}`
    };

    return this.createConsent(consentData);
  }

  // Send consent request notifications
  static async sendConsentRequestNotification(requestId: string): Promise<void> {
    // This would integrate with your email/SMS service
    // For now, we'll just update the request to mark as sent
    const request = await this.getConsentRequestByToken(requestId);
    if (!request) {
      throw new Error('Consent request not found');
    }

    const updates: Partial<ConsentRequest> = {
      email_sent: true,
      email_sent_at: new Date().toISOString()
    };

    await this.updateConsentRequest(requestId, updates);
  }
}

export default ConsentService;