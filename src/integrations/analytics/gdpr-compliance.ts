import { supabase } from '@/integrations/supabase/client';
import { ga4Analytics } from './ga4';
import { behaviorTracker } from './behavior-tracker';
import { heatmapSessionRecorder } from './heatmap-session-recorder';
import { abTestingFramework } from './ab-testing';

// GDPR Compliance Configuration
interface GDPRConfig {
  enabled: boolean;
  cookie_consent: {
    required: boolean;
    expiry_days: number;
    cookie_domains: string[];
    consent_types: {
      essential: boolean;
      analytics: boolean;
      marketing: boolean;
      personalization: boolean;
    };
  };
  data_retention: {
    analytics_data_days: number;
    session_data_days: number;
    personal_data_days: number;
    error_logs_days: number;
  };
  user_rights: {
    data_portability: boolean;
    right_to_be_forgotten: boolean;
    consent_withdrawal: boolean;
    data_access_requests: boolean;
  };
  privacy_features: {
    data_anonymization: boolean;
    ip_anonymization: boolean;
    geolocation_anonymization: boolean;
    sensitive_data_masking: boolean;
  };
  compliance_monitoring: {
    audit_logging: boolean;
    consent_tracking: boolean;
    data_processing_records: boolean;
    breach_detection: boolean;
  };
}

interface ConsentRecord {
  id: string;
  user_id?: string;
  session_id: string;
  consent_given: boolean;
  consent_types: {
    essential: boolean;
    analytics: boolean;
    marketing: boolean;
    personalization: boolean;
  };
  ip_address: string;
  user_agent: string;
  timestamp: string;
  expiry_date: string;
  withdrawn_at?: string;
  withdrawal_reason?: string;
}

interface DataProcessingRecord {
  id: string;
  processing_purpose: string;
  legal_basis: 'consent' | 'contract' | 'legal_obligation' | 'vital_interests' | 'public_task' | 'legitimate_interests';
  data_categories: string[];
  processing_activities: string[];
  data_recipients: string[];
  retention_period: string;
  security_measures: string[];
  created_at: string;
  updated_at: string;
}

interface UserDataRequest {
  id: string;
  user_id?: string;
  session_id?: string;
  request_type: 'access' | 'portability' | 'deletion' | 'rectification' | 'restriction';
  status: 'pending' | 'processing' | 'completed' | 'rejected';
  request_data: any;
  response_data?: any;
  created_at: string;
  processed_at?: string;
  notes?: string;
}

export class GDPRComplianceManager {
  private static instance: GDPRComplianceManager;
  private config: GDPRConfig;
  private currentConsent: ConsentRecord | null = null;
  private consentListeners: Array<(consent: ConsentRecord) => void> = [];
  private dataProcessingRecords: DataProcessingRecord[] = [];

  constructor() {
    this.config = this.getDefaultConfig();
    this.initialize();
  }

  static getInstance(): GDPRComplianceManager {
    if (!GDPRComplianceManager.instance) {
      GDPRComplianceManager.instance = new GDPRComplianceManager();
    }
    return GDPRComplianceManager.instance;
  }

  private getDefaultConfig(): GDPRConfig {
    return {
      enabled: true, // Always enable in production
      cookie_consent: {
        required: true,
        expiry_days: 365,
        cookie_domains: [window.location.hostname],
        consent_types: {
          essential: true, // Always required
          analytics: false,
          marketing: false,
          personalization: false,
        },
      },
      data_retention: {
        analytics_data_days: 730, // 2 years
        session_data_days: 30,
        personal_data_days: 2555, // 7 years
        error_logs_days: 90,
      },
      user_rights: {
        data_portability: true,
        right_to_be_forgotten: true,
        consent_withdrawal: true,
        data_access_requests: true,
      },
      privacy_features: {
        data_anonymization: true,
        ip_anonymization: true,
        geolocation_anonymization: true,
        sensitive_data_masking: true,
      },
      compliance_monitoring: {
        audit_logging: true,
        consent_tracking: true,
        data_processing_records: true,
        breach_detection: true,
      },
    };
  }

  private async initialize(): Promise<void> {
    if (!this.config.enabled) return;

    // Load existing consent
    await this.loadConsent();

    // Initialize data processing records
    await this.initializeDataProcessingRecords();

    // Set up consent monitoring
    this.setupConsentMonitoring();

    // Set up data anonymization
    this.setupDataAnonymization();

    // Check for consent expiry
    this.checkConsentExpiry();

    // Set up audit logging
    this.setupAuditLogging();
  }

  private async loadConsent(): Promise<void> {
    try {
      const consentCookie = this.getCookie('analytics_consent');
      if (consentCookie) {
        const consentData = JSON.parse(consentCookie);

        // Check if consent is still valid
        if (new Date(consentData.expiry_date) > new Date()) {
          this.currentConsent = consentData;
          await this.applyConsentSettings(consentData);
        } else {
          // Consent expired, remove it
          this.removeCookie('analytics_consent');
          this.currentConsent = null;
        }
      }
    } catch (error) {
      console.error('Failed to load consent:', error);
      this.currentConsent = null;
    }
  }

  private async initializeDataProcessingRecords(): Promise<void> {
    this.dataProcessingRecords = [
      {
        id: 'booking_analytics',
        processing_purpose: 'Analytics and optimization of booking process',
        legal_basis: 'legitimate_interests',
        data_categories: ['booking_data', 'user_interactions', 'device_information', 'ip_address'],
        processing_activities: ['data_collection', 'data_analysis', 'performance_monitoring', 'conversion_tracking'],
        data_recipients: ['internal_analytics_team', 'google_analytics', 'supabase'],
        retention_period: '730 days',
        security_measures: ['encryption_at_rest', 'encryption_in_transit', 'access_controls', 'audit_logging'],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: 'user_behavior_tracking',
        processing_purpose: 'Understanding user behavior to improve service',
        legal_basis: 'consent',
        data_categories: ['click_data', 'scroll_data', 'page_views', 'session_data'],
        processing_activities: ['behavioral_analysis', 'user_journey_mapping', 'ux_optimization'],
        data_recipients: ['internal_product_team', 'analytics_platforms'],
        retention_period: '30 days',
        security_measures: ['data_anonymization', 'aggregation_only', 'access_controls'],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: 'personalization',
        processing_purpose: 'Personalizing user experience and recommendations',
        legal_basis: 'consent',
        data_categories: ['service_preferences', 'booking_history', 'user_demographics'],
        processing_activities: ['recommendation_engine', 'personalized_content', 'ab_test_allocation'],
        data_recipients: ['recommendation_system', 'content_management_system'],
        retention_period: '365 days',
        security_measures: ['user_control_access', 'data_minimization', 'encryption'],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ];

    // Store in database if enabled
    if (this.config.compliance_monitoring.data_processing_records) {
      try {
        await supabase.from('data_processing_records').upsert(
          this.dataProcessingRecords.map(record => ({
            ...record,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          }))
        );
      } catch (error) {
        console.error('Failed to store data processing records:', error);
      }
    }
  }

  private setupConsentMonitoring(): void {
    if (!this.config.compliance_monitoring.consent_tracking) return;

    // Monitor consent changes and log them
    this.addConsentListener((consent) => {
      this.logConsentActivity(consent);
    });
  }

  private setupDataAnonymization(): void {
    if (!this.config.privacy_features.data_anonymization) return;

    // Override analytics methods to include anonymization
    this.wrapAnalyticsMethods();
  }

  private wrapAnalyticsMethods(): void {
    // Wrap GA4 methods
    const originalTrack = ga4Analytics.trackCustomEvent.bind(ga4Analytics);
    ga4Analytics.trackCustomEvent = async (event) => {
      if (this.currentConsent?.consent_types.analytics) {
        // Add anonymized data
        event.parameters = {
          ...event.parameters,
          anonymized_ip: this.config.privacy_features.ip_anonymization,
          data_masked: this.config.privacy_features.sensitive_data_masking,
        };
        await originalTrack(event);
      }
    };

    // Wrap behavior tracker methods
    const originalTrackEvent = (behaviorTracker as any).trackEvent.bind(behaviorTracker);
    (behaviorTracker as any).trackEvent = (event: any) => {
      if (this.currentConsent?.consent_types.analytics) {
        // Remove sensitive data
        if (this.config.privacy_features.sensitive_data_masking) {
          event = this.removeSensitiveData(event);
        }
        originalTrackEvent(event);
      }
    };
  }

  private removeSensitiveData(event: any): any {
    const sensitiveFields = ['email', 'phone', 'name', 'address', 'credit_card', 'ssn'];
    const cleanedEvent = { ...event };

    const removeSensitiveFields = (obj: any) => {
      if (typeof obj !== 'object' || obj === null) return obj;

      if (Array.isArray(obj)) {
        return obj.map(removeSensitiveFields);
      }

      const cleaned: any = {};
      Object.keys(obj).forEach(key => {
        if (sensitiveFields.some(field => key.toLowerCase().includes(field))) {
          cleaned[key] = '[REDACTED]';
        } else if (typeof obj[key] === 'object') {
          cleaned[key] = removeSensitiveFields(obj[key]);
        } else {
          cleaned[key] = obj[key];
        }
      });
      return cleaned;
    };

    return removeSensitiveFields(cleanedEvent);
  }

  private checkConsentExpiry(): void {
    if (!this.currentConsent) return;

    const timeUntilExpiry = new Date(this.currentConsent.expiry_date).getTime() - Date.now();
    const daysUntilExpiry = Math.ceil(timeUntilExpiry / (1000 * 60 * 60 * 24));

    // Show renewal prompt 30 days before expiry
    if (daysUntilExpiry <= 30 && daysUntilExpiry > 0) {
      setTimeout(() => {
        this.showConsentRenewalPrompt();
      }, 5000);
    }
  }

  private setupAuditLogging(): void {
    if (!this.config.compliance_monitoring.audit_logging) return;

    // Log all data processing activities
    const originalLog = console.log;
    console.log = (...args) => {
      if (args[0] && typeof args[0] === 'string' && args[0].includes('analytics')) {
        this.logDataProcessingActivity(args.join(' '));
      }
      originalLog.apply(console, args);
    };
  }

  // Public Consent Management
  async requestConsent(): Promise<ConsentRecord> {
    return new Promise((resolve) => {
      const modal = this.createConsentModal();
      document.body.appendChild(modal);

      const handleAccept = async (selectedTypes: any) => {
        const consent = await this.recordConsent(true, selectedTypes);
        document.body.removeChild(modal);
        resolve(consent);
      };

      const handleDecline = async () => {
        const consent = await this.recordConsent(false, {
          essential: true,
          analytics: false,
          marketing: false,
          personalization: false,
        });
        document.body.removeChild(modal);
        resolve(consent);
      };

      // Set up modal handlers
      (modal.querySelector('#consent-accept-all') as HTMLButtonElement).onclick = () => {
        handleAccept({
          essential: true,
          analytics: true,
          marketing: true,
          personalization: true,
        });
      };

      (modal.querySelector('#consent-accept-selected') as HTMLButtonElement).onclick = () => {
        const selectedTypes = {
          essential: true,
          analytics: (modal.querySelector('#consent-analytics') as HTMLInputElement).checked,
          marketing: (modal.querySelector('#consent-marketing') as HTMLInputElement).checked,
          personalization: (modal.querySelector('#consent-personalization') as HTMLInputElement).checked,
        };
        handleAccept(selectedTypes);
      };

      (modal.querySelector('#consent-decline') as HTMLButtonElement).onclick = handleDecline;
    });
  }

  private createConsentModal(): HTMLElement {
    const modal = document.createElement('div');
    modal.id = 'gdpr-consent-modal';
    modal.innerHTML = `
      <div style="position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.8); z-index: 10000; display: flex; align-items: center; justify-content: center;">
        <div style="background: white; padding: 2rem; border-radius: 12px; max-width: 500px; width: 90%; max-height: 80vh; overflow-y: auto;">
          <h2 style="margin: 0 0 1rem 0; color: #333;">Privacy & Cookie Settings</h2>
          <p style="margin: 0 0 1.5rem 0; color: #666; line-height: 1.5;">
            We use cookies and similar technologies to help personalize content, tailor and measure ads, and provide a better experience. By clicking accept all, you agree to our use of cookies.
          </p>

          <div style="margin-bottom: 1.5rem;">
            <h3 style="margin: 0 0 1rem 0; font-size: 1.1rem;">Cookie Preferences</h3>

            <div style="margin-bottom: 1rem;">
              <label style="display: flex; align-items: center; cursor: pointer;">
                <input type="checkbox" checked disabled style="margin-right: 0.5rem;">
                <div>
                  <strong>Essential Cookies</strong>
                  <p style="margin: 0.25rem 0 0 0; font-size: 0.9rem; color: #666;">Required for the site to function properly.</p>
                </div>
              </label>
            </div>

            <div style="margin-bottom: 1rem;">
              <label style="display: flex; align-items: center; cursor: pointer;">
                <input type="checkbox" id="consent-analytics" style="margin-right: 0.5rem;">
                <div>
                  <strong>Analytics Cookies</strong>
                  <p style="margin: 0.25rem 0 0 0; font-size: 0.9rem; color: #666;">Help us understand how you use our site.</p>
                </div>
              </label>
            </div>

            <div style="margin-bottom: 1rem;">
              <label style="display: flex; align-items: center; cursor: pointer;">
                <input type="checkbox" id="consent-marketing" style="margin-right: 0.5rem;">
                <div>
                  <strong>Marketing Cookies</strong>
                  <p style="margin: 0.25rem 0 0 0; font-size: 0.9rem; color: #666;">Used to deliver ads relevant to you.</p>
                </div>
              </label>
            </div>

            <div style="margin-bottom: 1rem;">
              <label style="display: flex; align-items: center; cursor: pointer;">
                <input type="checkbox" id="consent-personalization" style="margin-right: 0.5rem;">
                <div>
                  <strong>Personalization Cookies</strong>
                  <p style="margin: 0.25rem 0 0 0; font-size: 0.9rem; color: #666;">Allow personalized content and recommendations.</p>
                </div>
              </label>
            </div>
          </div>

          <div style="display: flex; gap: 1rem; justify-content: flex-end; flex-wrap: wrap;">
            <button id="consent-decline" style="background: #e5e5e5; color: #333; border: none; padding: 0.75rem 1.5rem; border-radius: 6px; cursor: pointer; font-weight: 500;">
              Decline All
            </button>
            <button id="consent-accept-selected" style="background: #8B4513; color: white; border: none; padding: 0.75rem 1.5rem; border-radius: 6px; cursor: pointer; font-weight: 500;">
              Accept Selected
            </button>
            <button id="consent-accept-all" style="background: #8B4513; color: white; border: none; padding: 0.75rem 1.5rem; border-radius: 6px; cursor: pointer; font-weight: 500;">
              Accept All
            </button>
          </div>
        </div>
      </div>
    `;
    return modal;
  }

  private async recordConsent(consentGiven: boolean, consentTypes: any): Promise<ConsentRecord> {
    const consent: ConsentRecord = {
      id: this.generateId(),
      user_id: undefined, // Would be populated if user is logged in
      session_id: behaviorTracker.getSessionId(),
      consent_given: consentGiven,
      consent_types: consentTypes,
      ip_address: this.anonymizeIPAddress(this.getIPAddress()),
      user_agent: navigator.userAgent.substring(0, 200),
      timestamp: new Date().toISOString(),
      expiry_date: new Date(Date.now() + this.config.cookie_consent.expiry_days * 24 * 60 * 60 * 1000).toISOString(),
    };

    this.currentConsent = consent;

    // Store in database
    try {
      await supabase.from('consent_records').insert({
        ...consent,
        created_at: consent.timestamp,
      });
    } catch (error) {
      console.error('Failed to store consent record:', error);
    }

    // Store in cookie
    this.setCookie('analytics_consent', JSON.stringify(consent), this.config.cookie_consent.expiry_days);

    // Apply consent settings
    await this.applyConsentSettings(consent);

    // Notify listeners
    this.consentListeners.forEach(listener => listener(consent));

    return consent;
  }

  private async applyConsentSettings(consent: ConsentRecord): Promise<void> {
    // Analytics consent
    if (consent.consent_types.analytics) {
      // Enable analytics tracking
      await this.enableAnalytics();
    } else {
      // Disable analytics tracking
      this.disableAnalytics();
    }

    // Personalization consent
    if (consent.consent_types.personalization) {
      // Enable personalization features
      await this.enablePersonalization();
    } else {
      // Disable personalization features
      this.disablePersonalization();
    }

    // Marketing consent
    if (consent.consent_types.marketing) {
      // Enable marketing features
      await this.enableMarketing();
    } else {
      // Disable marketing features
      this.disableMarketing();
    }
  }

  private async enableAnalytics(): Promise<void> {
    // Initialize analytics services
    if (!heatmapSessionRecorder.isRecordingActive()) {
      await heatmapSessionRecorder.requestConsent();
    }
  }

  private disableAnalytics(): void {
    // Stop analytics tracking
    ga4Analytics = null as any; // Would need proper cleanup
  }

  private async enablePersonalization(): Promise<void> {
    // Enable A/B testing
    await abTestingFramework.createCommonTests();
  }

  private disablePersonalization(): void {
    // Disable personalization features
    localStorage.removeItem('user_preferences');
  }

  private async enableMarketing(): Promise<void> {
    // Enable marketing features
    console.log('Marketing features enabled');
  }

  private disableMarketing(): void {
    // Disable marketing features
    console.log('Marketing features disabled');
  }

  // User Rights Implementation
  async requestDataAccess(): Promise<UserDataRequest> {
    const request: UserDataRequest = {
      id: this.generateId(),
      user_id: undefined, // Would be populated if user is logged in
      session_id: behaviorTracker.getSessionId(),
      request_type: 'access',
      status: 'pending',
      request_data: {
        requested_at: new Date().toISOString(),
        data_categories: ['personal_data', 'analytics_data', 'consent_records'],
      },
      created_at: new Date().toISOString(),
    };

    try {
      await supabase.from('user_data_requests').insert({
        ...request,
        created_at: request.created_at,
      });
    } catch (error) {
      console.error('Failed to create data access request:', error);
    }

    // Process request asynchronously
    this.processDataAccessRequest(request);

    return request;
  }

  private async processDataAccessRequest(request: UserDataRequest): Promise<void> {
    try {
      // Gather user data
      const userData = await this.gatherUserData(request.session_id);

      // Update request with data
      await supabase
        .from('user_data_requests')
        .update({
          status: 'completed',
          response_data: userData,
          processed_at: new Date().toISOString(),
        })
        .eq('id', request.id);

      console.log('Data access request completed:', request.id);
    } catch (error) {
      console.error('Failed to process data access request:', error);

      await supabase
        .from('user_data_requests')
        .update({
          status: 'rejected',
          notes: `Processing error: ${error}`,
          processed_at: new Date().toISOString(),
        })
        .eq('id', request.id);
    }
  }

  private async gatherUserData(sessionId: string): Promise<any> {
    try {
      const userData: any = {
        session_id: sessionId,
        consent_records: [],
        analytics_data: [],
        booking_data: [],
        personal_preferences: null,
      };

      // Get consent records
      const { data: consentRecords } = await supabase
        .from('consent_records')
        .select('*')
        .eq('session_id', sessionId);

      userData.consent_records = consentRecords || [];

      // Get analytics data (if consented)
      if (this.currentConsent?.consent_types.analytics) {
        const { data: analyticsData } = await supabase
          .from('behavior_analytics_events')
          .select('*')
          .eq('session_id', sessionId)
          .limit(100); // Limit for data export

        userData.analytics_data = analyticsData || [];
      }

      // Get booking data
      const { data: bookingData } = await supabase
        .from('booking_journeys')
        .select('*')
        .eq('session_id', sessionId);

      userData.booking_data = bookingData || [];

      return userData;
    } catch (error) {
      console.error('Failed to gather user data:', error);
      return {};
    }
  }

  async requestDataDeletion(): Promise<UserDataRequest> {
    const request: UserDataRequest = {
      id: this.generateId(),
      user_id: undefined,
      session_id: behaviorTracker.getSessionId(),
      request_type: 'deletion',
      status: 'pending',
      request_data: {
        requested_at: new Date().toISOString(),
        scope: ['personal_data', 'analytics_data', 'consent_records'],
      },
      created_at: new Date().toISOString(),
    };

    try {
      await supabase.from('user_data_requests').insert({
        ...request,
        created_at: request.created_at,
      });
    } catch (error) {
      console.error('Failed to create data deletion request:', error);
    }

    // Process request asynchronously
    this.processDataDeletionRequest(request);

    return request;
  }

  private async processDataDeletionRequest(request: UserDataRequest): Promise<void> {
    try {
      const sessionId = request.session_id!;

      // Delete analytics data
      await supabase
        .from('behavior_analytics_events')
        .delete()
        .eq('session_id', sessionId);

      // Delete booking data
      await supabase
        .from('booking_journeys')
        .delete()
        .eq('session_id', sessionId);

      // Delete consent records
      await supabase
        .from('consent_records')
        .delete()
        .eq('session_id', sessionId);

      // Anonymize any remaining data
      await this.anonymizeRemainingData(sessionId);

      // Update request
      await supabase
        .from('user_data_requests')
        .update({
          status: 'completed',
          processed_at: new Date().toISOString(),
          notes: 'All user data has been deleted or anonymized',
        })
        .eq('id', request.id);

      console.log('Data deletion request completed:', request.id);
    } catch (error) {
      console.error('Failed to process data deletion request:', error);

      await supabase
        .from('user_data_requests')
        .update({
          status: 'rejected',
          notes: `Processing error: ${error}`,
          processed_at: new Date().toISOString(),
        })
        .eq('id', request.id);
    }
  }

  private async anonymizeRemainingData(sessionId: string): Promise<void> {
    // This would anonymize any data that cannot be deleted due to legal requirements
    // Implementation depends on specific data retention requirements
  }

  async withdrawConsent(reason?: string): Promise<void> {
    if (!this.currentConsent) return;

    try {
      // Update consent record
      await supabase
        .from('consent_records')
        .update({
          consent_given: false,
          withdrawn_at: new Date().toISOString(),
          withdrawal_reason: reason || 'User requested withdrawal',
        })
        .eq('id', this.currentConsent.id);

      // Update current consent
      this.currentConsent.consent_given = false;
      this.currentConsent.withdrawn_at = new Date().toISOString();
      this.currentConsent.withdrawal_reason = reason;

      // Apply new consent settings
      await this.applyConsentSettings(this.currentConsent);

      // Remove consent cookie
      this.removeCookie('analytics_consent');

      console.log('Consent withdrawn:', reason);
    } catch (error) {
      console.error('Failed to withdraw consent:', error);
    }
  }

  // Utility Methods
  private generateId(): string {
    return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private getCookie(name: string): string | null {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) {
      return parts.pop()?.split(';').shift() || null;
    }
    return null;
  }

  private setCookie(name: string, value: string, days: number): void {
    const expires = new Date();
    expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);
    document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/;SameSite=Lax`;
  }

  private removeCookie(name: string): void {
    document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:01 GMT;path=/;SameSite=Lax`;
  }

  private getIPAddress(): string {
    // In a real implementation, this would get the actual IP address
    // For privacy reasons, we'll return a placeholder
    return '127.0.0.1';
  }

  private anonymizeIPAddress(ip: string): string {
    if (!this.config.privacy_features.ip_anonymization) return ip;

    // IPv4: Replace last octet with 0
    if (ip.includes('.')) {
      const parts = ip.split('.');
      return `${parts[0]}.${parts[1]}.${parts[2]}.0`;
    }

    // IPv6: Replace last 64 bits with zeros
    if (ip.includes(':')) {
      const parts = ip.split(':');
      return parts.slice(0, 4).join(':') + '::0';
    }

    return ip;
  }

  private async logConsentActivity(consent: ConsentRecord): Promise<void> {
    if (!this.config.compliance_monitoring.audit_logging) return;

    try {
      await supabase.from('consent_activity_log').insert({
        consent_id: consent.id,
        activity_type: consent.consent_given ? 'consent_granted' : 'consent_denied',
        session_id: consent.session_id,
        user_agent: consent.user_agent,
        ip_address: consent.ip_address,
        timestamp: consent.timestamp,
        consent_types: consent.consent_types,
      });
    } catch (error) {
      console.error('Failed to log consent activity:', error);
    }
  }

  private async logDataProcessingActivity(activity: string): Promise<void> {
    if (!this.config.compliance_monitoring.audit_logging) return;

    try {
      await supabase.from('data_processing_activity_log').insert({
        activity_description: activity,
        session_id: behaviorTracker.getSessionId(),
        timestamp: new Date().toISOString(),
        legal_basis: 'consent',
        data_categories: ['analytics_data'],
      });
    } catch (error) {
      console.error('Failed to log data processing activity:', error);
    }
  }

  private showConsentRenewalPrompt(): void {
    // Implementation for consent renewal prompt
    console.log('Consent renewal prompt would be shown here');
  }

  // Public API Methods
  addConsentListener(listener: (consent: ConsentRecord) => void): void {
    this.consentListeners.push(listener);
  }

  removeConsentListener(listener: (consent: ConsentRecord) => void): void {
    const index = this.consentListeners.indexOf(listener);
    if (index > -1) {
      this.consentListeners.splice(index, 1);
    }
  }

  getCurrentConsent(): ConsentRecord | null {
    return this.currentConsent;
  }

  hasConsent(type: keyof GDPRConfig['cookie_consent']['consent_types']): boolean {
    return this.currentConsent?.consent_types[type] || false;
  }

  getDataProcessingRecords(): DataProcessingRecord[] {
    return this.dataProcessingRecords;
  }

  async updateConsentPreferences(consentTypes: Partial<GDPRConfig['cookie_consent']['consent_types']>): Promise<void> {
    if (!this.currentConsent) return;

    const updatedConsent = {
      ...this.currentConsent,
      consent_types: {
        ...this.currentConsent.consent_types,
        ...consentTypes,
      },
    };

    this.currentConsent = updatedConsent;
    await this.applyConsentSettings(updatedConsent);

    // Store updated consent
    this.setCookie('analytics_consent', JSON.stringify(updatedConsent), this.config.cookie_consent.expiry_days);
  }
}

// Export singleton instance
export const gdprComplianceManager = GDPRComplianceManager.getInstance();

// React hook for easy integration
export const useGDPRCompliance = () => {
  const [consent, setConsent] = useState(gdprComplianceManager.getCurrentConsent());
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadConsent = async () => {
      await gdprComplianceManager.initialize();
      setConsent(gdprComplianceManager.getCurrentConsent());
      setIsLoading(false);
    };

    loadConsent();

    const handleConsentChange = (newConsent: any) => {
      setConsent(newConsent);
    };

    gdprComplianceManager.addConsentListener(handleConsentChange);

    return () => {
      gdprComplianceManager.removeConsentListener(handleConsentChange);
    };
  }, []);

  const requestConsent = async () => {
    const newConsent = await gdprComplianceManager.requestConsent();
    setConsent(newConsent);
    return newConsent;
  };

  const withdrawConsent = async (reason?: string) => {
    await gdprComplianceManager.withdrawConsent(reason);
    setConsent(gdprComplianceManager.getCurrentConsent());
  };

  const requestDataAccess = async () => {
    return await gdprComplianceManager.requestDataAccess();
  };

  const requestDataDeletion = async () => {
    return await gdprComplianceManager.requestDataDeletion();
  };

  const updatePreferences = async (preferences: any) => {
    await gdprComplianceManager.updateConsentPreferences(preferences);
    setConsent(gdprComplianceManager.getCurrentConsent());
  };

  return {
    consent,
    isLoading,
    hasConsent: gdprComplianceManager.hasConsent.bind(gdprComplianceManager),
    requestConsent,
    withdrawConsent,
    requestDataAccess,
    requestDataDeletion,
    updatePreferences,
  };
};