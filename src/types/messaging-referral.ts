// TypeScript types for unified messaging and referral system

export interface Conversation {
  id: string;
  customer_id?: string | null;
  customer_email?: string | null;
  customer_phone?: string | null;
  customer_name?: string | null;
  last_message_at: string;
  last_message_content?: string | null;
  status: 'active' | 'archived' | 'spam' | 'blocked';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  assigned_to?: string | null;
  tags: string[];
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface Message {
  id: string;
  conversation_id: string;
  content: string;
  direction: 'inbound' | 'outbound';
  channel: 'whatsapp' | 'sms' | 'email' | 'instagram' | 'facebook' | 'web';
  channel_message_id?: string | null;
  sender_id?: string | null;
  sender_name?: string | null;
  sender_contact?: string | null;
  status: 'draft' | 'queued' | 'sent' | 'delivered' | 'read' | 'failed';
  attachments: MessageAttachment[];
  metadata: Record<string, any>;
  created_at: string;
}

export interface MessageAttachment {
  type: 'image' | 'document' | 'video' | 'audio';
  url: string;
  filename?: string;
  size?: number;
}

export interface MessageTemplate {
  id: string;
  name: string;
  category: 'booking' | 'reminder' | 'aftercare' | 'promotion' | 'review' | 'referral' | 'general';
  channel: 'whatsapp' | 'sms' | 'email';
  language: 'en' | 'pl';
  subject?: string | null;
  content: string;
  variables: TemplateVariable[];
  is_active: boolean;
  template_type: 'custom' | 'template';
  template_name?: string | null;
  created_at: string;
  updated_at: string;
}

export interface TemplateVariable {
  name: string;
  label: string;
  type: 'string' | 'number' | 'date' | 'boolean';
  required: boolean;
  default_value?: string | null;
}

export interface AutomationRule {
  id: string;
  name: string;
  description?: string | null;
  trigger_type: 'booking_created' | 'booking_confirmed' | 'booking_completed' | 'booking_cancelled' | 'payment_completed' | 'aftercare_period' | 'birthday' | 'no_activity' | 'abandoned_cart';
  trigger_config: Record<string, any>;
  actions: AutomationAction[];
  conditions: AutomationCondition[];
  is_active: boolean;
  priority: number;
  run_at: 'immediate' | 'scheduled' | 'recurring';
  schedule_config: Record<string, any>;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface AutomationAction {
  type: 'send_message' | 'send_email' | 'update_field' | 'create_task' | 'delay';
  channel?: string;
  template_name?: string;
  delay_minutes?: number;
  config?: Record<string, any>;
}

export interface AutomationCondition {
  field: string;
  operator: 'equals' | 'not_equals' | 'contains' | 'not_contains' | 'greater_than' | 'less_than';
  value: any;
}

export interface ScheduledMessage {
  id: string;
  conversation_id?: string | null;
  template_id?: string | null;
  content: string;
  channel: 'whatsapp' | 'sms' | 'email';
  recipient: string;
  scheduled_for: string;
  status: 'scheduled' | 'sent' | 'delivered' | 'failed' | 'cancelled';
  automation_rule_id?: string | null;
  retry_count: number;
  last_retry_at?: string | null;
  metadata: Record<string, any>;
  created_at: string;
}

export interface ReferralProgram {
  id: string;
  name: string;
  description?: string | null;
  reward_type: 'discount_percentage' | 'discount_fixed' | 'free_service' | 'points' | 'cash';
  reward_value: number;
  referrer_reward_type: 'discount_percentage' | 'discount_fixed' | 'free_service' | 'points' | 'cash';
  referrer_reward_value: number;
  max_uses_per_referrer?: number;
  max_uses_total?: number;
  expiry_days?: number;
  is_active: boolean;
  conditions: ReferralCondition[];
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface ReferralCondition {
  type: string;
  description: string;
}

export interface ReferralCode {
  id: string;
  program_id: string;
  referrer_id: string;
  code: string;
  share_url: string;
  usage_count: number;
  status: 'active' | 'expired' | 'suspended';
  expires_at?: string | null;
  metadata: Record<string, any>;
  created_at: string;
}

export interface Referral {
  id: string;
  referral_code_id: string;
  referrer_id: string;
  referred_id?: string | null;
  referred_email?: string | null;
  referred_name?: string | null;
  status: 'pending' | 'registered' | 'first_booking' | 'completed' | 'rewarded' | 'expired' | 'cancelled';
  conversion_booking_id?: string | null;
  referral_source?: string | null;
  utm_source?: string | null;
  utm_medium?: string | null;
  utm_campaign?: string | null;
  ip_address?: string | null;
  referral_date: string;
  conversion_date?: string | null;
  reward_date?: string | null;
  metadata: Record<string, any>;
  created_at: string;
}

export interface MetaConversion {
  id: string;
  event_name: string;
  event_id?: string | null;
  event_time: number;
  user_data: Record<string, any>;
  custom_data: Record<string, any>;
  action_source: string;
  event_source_url?: string | null;
  data_processing_options: string[];
  test_event_code?: string | null;
  original_event_data: Record<string, any>;
  conversion_value?: number | null;
  currency: string;
  status: 'pending' | 'sent' | 'failed' | 'retry';
  retry_count: number;
  last_retry_at?: string | null;
  meta_response?: Record<string, any> | null;
  created_at: string;
}

export interface MetaPixelEvent {
  id: string;
  event_name: string;
  event_id?: string | null;
  pixel_id: string;
  user_data: Record<string, any>;
  custom_data: Record<string, any>;
  event_time: number;
  event_source_url?: string | null;
  action_source: string;
  data_processing_options: string[];
  tracking_parameters: Record<string, any>;
  created_at: string;
}

export interface SocialConnection {
  id: string;
  platform: 'instagram' | 'facebook' | 'tiktok' | 'linkedin';
  account_id: string;
  account_name: string;
  access_token?: string | null;
  refresh_token?: string | null;
  token_expires_at?: string | null;
  is_active: boolean;
  webhook_secret?: string | null;
  last_sync_at?: string | null;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface MessageAnalytics {
  id: string;
  date: string;
  channel: string;
  direction: string;
  total_messages: number;
  delivered: number;
  read: number;
  failed: number;
  average_response_time_minutes?: number | null;
  conversation_count: number;
  created_at: string;
}

export interface ReferralAnalytics {
  id: string;
  date: string;
  program_id?: string | null;
  total_referrals: number;
  successful_referrals: number;
  conversion_rate?: number | null;
  total_rewards_given: number;
  created_at: string;
}

export interface ConversationSummary {
  id: string;
  customer_name?: string | null;
  customer_email?: string | null;
  customer_phone?: string | null;
  status: string;
  priority: string;
  assigned_to?: string | null;
  last_message_at: string;
  message_count: number;
  inbound_count: number;
  outbound_count: number;
  last_inbound_at?: string | null;
  last_outbound_at?: string | null;
}

export interface ReferralPerformance {
  id: string;
  name: string;
  reward_type: string;
  reward_value: number;
  total_codes: number;
  total_referrals: number;
  successful_referrals: number;
  total_rewards: number;
  conversion_rate?: number | null;
}

// UI Types
export interface MessageCompose {
  content: string;
  channel: 'whatsapp' | 'sms' | 'email';
  recipient: string;
  template_id?: string;
  variables?: Record<string, string>;
  attachments?: File[];
}

export interface ConversationFilter {
  status?: string[];
  priority?: string[];
  assigned_to?: string[];
  tags?: string[];
  date_range?: {
    start: string;
    end: string;
  };
}

export interface ReferralShareOptions {
  platform: 'whatsapp' | 'facebook' | 'twitter' | 'email' | 'copy_link';
  message: string;
  custom_message?: string;
}

// WhatsApp Business API Types
export interface WhatsAppBusinessProfile {
  name: string;
  description: string;
  address: string;
  email: string;
  phone: string;
  website: string;
  hours?: {
    monday?: string;
    tuesday?: string;
    wednesday?: string;
    thursday?: string;
    friday?: string;
    saturday?: string;
    sunday?: string;
  };
}

export interface WhatsAppTemplate {
  name: string;
  category: string;
  language: string;
  status: string;
  components: WhatsAppTemplateComponent[];
}

export interface WhatsAppTemplateComponent {
  type: 'HEADER' | 'BODY' | 'FOOTER';
  format?: string;
  text: string;
  example?: Record<string, any>;
}

// Meta Conversions API Types
export interface MetaEventConfig {
  event_name: string;
  event_time: number;
  action_source: string;
  event_source_url?: string;
  user_data?: {
    em?: string[];
    ph?: string[];
    fn?: string[];
    ln?: string[];
    ct?: string[];
    st?: string[];
    zp?: string[];
    country?: string[];
    external_id?: string[];
  };
  custom_data?: {
    currency?: string;
    value?: number;
    content_ids?: string[];
    content_type?: string;
    order_id?: string;
    content_name?: string;
    contents?: Array<{
      id: string;
      quantity: number;
      item_price: number;
      title?: string;
    }>;
  };
  data_processing_options?: string[];
}

export interface MetaWebhookEvent {
  id: string;
  event_time: number;
  sender_id: string;
  recipient_id: string;
  message?: any;
  postback?: any;
  referral?: any;
}