export interface CookieConsent {
  id: string;
  session_id?: string;
  user_id?: string;
  consent_data: {
    essential: boolean;
    analytics: boolean;
    marketing: boolean;
    personalization: boolean;
    version: number;
    timestamp?: string;
  };
  ip_address?: string;
  user_agent?: string;
  consent_timestamp: string;
  last_updated: string;
  version: number;
  created_at: string;
  updated_at: string;
}

export type CookieConsentCategory =
  | 'essential'
  | 'analytics'
  | 'marketing'
  | 'personalization';

export interface ProcessingActivity {
  id: string;
  name: string;
  description: string;
  lawful_basis: ProcessingLawfulBasis;
  data_categories: string[];
  purposes: string[];
  recipients: string[];
  retention_period: RetentionPeriod;
  automated_decision_making: boolean;
  international_transfer: boolean;
  security_measures: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export type ProcessingLawfulBasis =
  | 'consent'
  | 'contract'
  | 'legal_obligation'
  | 'vital_interests'
  | 'public_task'
  | 'legitimate_interests';

export interface ProcessingLog {
  id: string;
  activity_id?: string;
  user_id?: string;
  session_id?: string;
  action: string;
  data_affected: Record<string, any>;
  ip_address?: string;
  user_agent?: string;
  timestamp: string;
  lawful_basis_at_time?: ProcessingLawfulBasis;
  purpose_at_time?: string;
}

export interface DataSubjectRequest {
  id: string;
  request_type: DataSubjectRequestType;
  user_id?: string;
  email: string;
  description?: string;
  status: 'pending' | 'processing' | 'completed' | 'rejected';
  requested_data: Record<string, any>;
  response_data: Record<string, any>;
  processed_at?: string;
  processed_by?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export type DataSubjectRequestType =
  | 'access'
  | 'rectification'
  | 'erasure'
  | 'portability'
  | 'restriction'
  | 'objection';

export interface RetentionPolicy {
  id: string;
  name: string;
  description: string;
  data_category: string;
  retention_period: RetentionPeriod;
  automatic_cleanup: boolean;
  last_run?: string;
  created_at: string;
  updated_at: string;
}

export type RetentionPeriod =
  | 'immediate'
  | '24_hours'
  | '7_days'
  | '30_days'
  | '90_days'
  | '6_months'
  | '1_year'
  | '2_years'
  | '5_years'
  | '7_years'
  | 'indefinite';

export interface PrivacyPolicyVersion {
  id: string;
  version: string;
  title: string;
  content: string;
  summary?: string;
  effective_date: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface PolicyAcceptance {
  id: string;
  policy_id: string;
  user_id?: string;
  session_id?: string;
  ip_address?: string;
  user_agent?: string;
  accepted_at: string;
}

export interface AnonymizedAnalytics {
  id: string;
  event_type: string;
  event_data: Record<string, any>;
  anonymized_at: string;
  original_date_range?: string;
  created_at: string;
}

// Types for GDPR compliance features
export interface CookieBannerConfig {
  showBanner: boolean;
  forceUpdate: boolean;
  position: 'bottom' | 'top' | 'center';
  theme: 'light' | 'dark' | 'auto';
  acceptAllButton: boolean;
  customizeButton: boolean;
  necessaryOnlyButton: boolean;
  privacyPolicyLink: string;
  cookiePolicyLink: string;
}

export interface ConsentPreferences {
  essential: boolean;
  analytics: boolean;
  marketing: boolean;
  personalization: boolean;
  timestamp: string;
  version: number;
}

export interface UserDataExport {
  personalData: {
    profile: any;
    bookings: any[];
    communications: any[];
    preferences: any;
  };
  processingLogs: ProcessingLog[];
  consentRecords: CookieConsent[];
  policyAcceptances: PolicyAcceptance[];
  exportDate: string;
  format: 'json' | 'csv' | 'pdf';
}

export interface GDPRComplianceStatus {
  hasConsent: boolean;
  consentCategories: Record<CookieConsentCategory, boolean>;
  lastConsentUpdate?: string;
  consentVersion: number;
  pendingRequests: DataSubjectRequest[];
  dataRetentionPolicies: RetentionPolicy[];
  canDeleteAccount: boolean;
  hasOutstandingRequests: boolean;
}

// Types for GDPR admin interface
export interface AdminGDPRStats {
  totalConsents: number;
  activeConsents: number;
  pendingDataRequests: number;
  completedDataRequests: number;
  dataDeletionRequests: number;
  processingActivities: number;
  retentionPoliciesActive: number;
  privacyPolicyVersion: string;
  lastPolicyUpdate: string;
}

export interface ConsentAnalytics {
  totalUsers: number;
  consentByCategory: Record<CookieConsentCategory, number>;
  consentTrends: {
    date: string;
    category: CookieConsentCategory;
    accepts: number;
    rejects: number;
  }[];
  withdrawalRate: number;
  averageConsentTime: number;
}

// Form types for data subject requests
export interface DataSubjectRequestForm {
  requestType: DataSubjectRequestType;
  email: string;
  description: string;
  identityVerification?: {
    method: 'email' | 'phone' | 'document';
    value: string;
  };
  specificData?: string[];
}

// Types for cookie management
export interface CookieDetails {
  name: string;
  domain: string;
  path: string;
  category: CookieConsentCategory;
  purpose: string;
  retention: string;
  provider: string;
  cookies: Array<{
    name: string;
    purpose: string;
    retention: string;
  }>;
}

// Types for privacy policy management
export interface PolicyChange {
  version: string;
  title: string;
  summary: string;
  changes: string[];
  effectiveDate: string;
  requiresReconsent: boolean;
  notificationMethods: ('email' | 'in_app' | 'sms')[];
}

// Database function types
export interface DatabaseFunctions {
  has_consent: {
    Args: {
      user_uuid: string;
      consent_category: CookieConsentCategory;
    };
    Returns: boolean;
  };
  log_processing_activity: {
    Args: {
      activity_name: string;
      user_action: string;
      user_uuid?: string;
      session_uuid?: string;
      data_affected?: Record<string, any>;
    };
    Returns: void;
  };
  cleanup_expired_data: {
    Args: Record<string, never>;
    Returns: void;
  };
}

// Type guards
export function isValidCookieConsentCategory(value: string): value is CookieConsentCategory {
  return ['essential', 'analytics', 'marketing', 'personalization'].includes(value);
}

export function isValidDataSubjectRequestType(value: string): value is DataSubjectRequestType {
  return ['access', 'rectification', 'erasure', 'portability', 'restriction', 'objection'].includes(value);
}

export function isValidProcessingLawfulBasis(value: string): value is ProcessingLawfulBasis {
  return ['consent', 'contract', 'legal_obligation', 'vital_interests', 'public_task', 'legitimate_interests'].includes(value);
}

export function isValidRetentionPeriod(value: string): value is RetentionPeriod {
  return ['immediate', '24_hours', '7_days', '30_days', '90_days', '6_months', '1_year', '2_years', '5_years', '7_years', 'indefinite'].includes(value);
}