export interface ConsentScope {
  website?: boolean;
  social_media?: boolean;
  portfolio?: boolean;
  ads?: boolean;
  print?: boolean;
  internal_use?: boolean;
  case_study?: boolean;
  email_marketing?: boolean;
}

export interface SignatureData {
  type: 'drawn' | 'typed' | 'uploaded' | 'verbal';
  data: string; // Base64 encoded signature or typed text
  timestamp: string;
  device_fingerprint?: string;
}

export interface ModelConsent {
  id: string;
  client_id: string;
  booking_id?: string;
  consent_type: 'photo' | 'video' | 'testimonial' | 'review' | 'case_study';
  scope: ConsentScope;
  duration: 'permanent' | 'time_limited' | 'campaign_specific' | 'service_related';
  expiry_date?: string;
  campaign_name?: string;
  compensation_details?: string;
  compensation_type?: 'none' | 'discount' | 'service' | 'cash' | 'gift';
  compensation_value?: number;
  restrictions: string[];
  approved_contexts: string[];
  geographic_scope: string[];
  signature_data: SignatureData;
  signature_method: 'drawn' | 'typed' | 'uploaded' | 'verbal';
  legal_representative?: string;
  ip_address?: string;
  user_agent?: string;
  device_fingerprint?: string;
  consent_language: string;
  status: 'active' | 'expired' | 'revoked' | 'suspended' | 'pending';
  revocation_reason?: string;
  revocation_date?: string;
  consent_date: string;
  reviewed_at?: string;
  approved_by?: string;
  notes?: string;
  metadata: Record<string, any>;
  tags: string[];
  created_at: string;
  updated_at: string;
  created_by?: string;
}

export interface ConsentUsageLog {
  id: string;
  consent_id: string;
  usage_type: 'website' | 'social_media' | 'portfolio' | 'advertisement' | 'print' | 'email' | 'case_study' | 'testimonial' | 'other';
  usage_context: string;
  usage_description?: string;
  media_type?: 'photo' | 'video' | 'text' | 'audio' | 'mixed';
  media_urls: string[];
  campaign_id?: string;
  geographic_region?: string;
  display_start_date?: string;
  display_end_date?: string;
  impressions_count: number;
  clicks_count: number;
  used_by?: string;
  department?: string;
  project_name?: string;
  compliance_notes?: string;
  reviewed_by?: string;
  usage_approved: boolean;
  approval_date?: string;
  used_at: string;
  created_at: string;
  metadata: Record<string, any>;
}

export interface ConsentRequest {
  id: string;
  client_id: string;
  booking_id?: string;
  request_type: 'photo' | 'video' | 'testimonial' | 'review' | 'case_study';
  request_purpose: string;
  usage_context: ConsentScope;
  email_sent: boolean;
  email_sent_at?: string;
  email_template_used?: string;
  sms_sent: boolean;
  sms_sent_at?: string;
  response_status: 'pending' | 'approved' | 'declined' | 'expired' | 'withdrawn';
  response_date?: string;
  consent_form_url?: string;
  consent_form_token: string;
  expires_at: string;
  created_at: string;
  created_by?: string;
  updated_at: string;
}

export interface ConsentTemplate {
  id: string;
  name: string;
  template_type: 'photo' | 'video' | 'testimonial' | 'review' | 'case_study';
  language: string;
  title: string;
  description: string;
  consent_text: string;
  explanation_text?: string;
  default_scope: ConsentScope;
  default_duration: string;
  default_compensation_type: string;
  usage_examples: string[];
  visual_examples: string[];
  legal_version?: string;
  compliance_notes?: string;
  required_fields: string[];
  is_active: boolean;
  is_default: boolean;
  created_at: string;
  updated_at: string;
  created_by?: string;
}

export interface ConsentRevocation {
  id: string;
  consent_id: string;
  revocation_type: 'client_request' | 'time_expiry' | 'policy_change' | 'compliance_issue' | 'other';
  revocation_reason: string;
  processed_by?: string;
  removal_request_date?: string;
  removal_completed_date?: string;
  content_removed_from: string[];
  removal_confirmed: boolean;
  follow_up_required: boolean;
  follow_up_date?: string;
  legal_reference?: string;
  compliance_notes?: string;
  created_at: string;
  updated_at: string;
  metadata: Record<string, any>;
}

export interface ExpiringConsent {
  consent_id: string;
  client_id: string;
  client_email: string;
  client_name: string;
  consent_type: string;
  expiry_date: string;
  days_remaining: number;
}

export interface ConsentFormData {
  consent_type: string;
  scope: ConsentScope;
  duration: string;
  expiry_date?: string;
  compensation_type: string;
  restrictions: string[];
  signature_method: string;
  signature_data?: SignatureData;
  agreed: boolean;
  client_understands: boolean;
  legal_representative?: string;
}

export interface ConsentAnalytics {
  total_consent_records: number;
  active_consents: number;
  expired_consents: number;
  revoked_consents: number;
  pending_requests: number;
  consents_by_type: Record<string, number>;
  usage_by_type: Record<string, number>;
  expiring_next_30_days: number;
  expiring_next_7_days: number;
  recent_usage: ConsentUsageLog[];
  top_used_content: Array<{
    consent_id: string;
    usage_count: number;
    last_used: string;
  }>;
}

export interface ConsentFilterOptions {
  status?: string[];
  consent_type?: string[];
  client_id?: string;
  date_from?: string;
  date_to?: string;
  expiry_from?: string;
  expiry_to?: string;
  has_signature?: boolean;
  has_compensation?: boolean;
  search?: string;
}

export interface ConsentUsageFilterOptions {
  consent_id?: string;
  usage_type?: string[];
  used_by?: string;
  date_from?: string;
  date_to?: string;
  department?: string;
  search?: string;
}

// Database function parameters
export interface LogConsentUsageParams {
  consent_uuid: string;
  usage_type_param: string;
  usage_context_param: string;
  used_by_uuid: string;
  additional_metadata?: Record<string, any>;
}

export interface RevokeConsentParams {
  consent_uuid: string;
  revocation_reason_param: string;
  revocation_type_param?: string;
  processed_by_uuid?: string;
}

// Consent form validation schema
export const consentFormValidation = {
  required_fields: [
    'consent_type',
    'scope',
    'duration',
    'signature_method',
    'signature_data',
    'agreed',
    'client_understands'
  ],
  scope_requirements: {
    website: { required: false, description: 'Display on company website' },
    social_media: { required: false, description: 'Share on social media platforms' },
    portfolio: { required: false, description: 'Include in professional portfolio' },
    ads: { required: false, description: 'Use in advertising materials' },
    print: { required: false, description: 'Print media usage' },
    internal_use: { required: false, description: 'Internal training and documentation' }
  },
  compensation_types: {
    none: { description: 'No compensation provided' },
    discount: { description: 'Service discount' },
    service: { description: 'Free or additional service' },
    cash: { description: 'Monetary compensation' },
    gift: { description: 'Product or gift voucher' }
  }
};

// Consent status colors for UI
export const consentStatusColors = {
  active: 'text-green-600 bg-green-50',
  expired: 'text-red-600 bg-red-50',
  revoked: 'text-orange-600 bg-orange-50',
  suspended: 'text-yellow-600 bg-yellow-50',
  pending: 'text-blue-600 bg-blue-50'
} as const;

// Usage type colors for UI
export const usageTypeColors = {
  website: 'text-blue-600 bg-blue-50',
  social_media: 'text-purple-600 bg-purple-50',
  portfolio: 'text-green-600 bg-green-50',
  advertisement: 'text-red-600 bg-red-50',
  print: 'text-gray-600 bg-gray-50',
  email: 'text-indigo-600 bg-indigo-50',
  case_study: 'text-yellow-600 bg-yellow-50',
  testimonial: 'text-pink-600 bg-pink-50',
  other: 'text-gray-600 bg-gray-50'
} as const;