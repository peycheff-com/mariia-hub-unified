// Core communication system types for the luxury beauty/fitness platform

import { Database } from '@/integrations/supabase/types';

// Type definitions extending the database types
export type CommunicationChannel =
  | 'email'
  | 'sms'
  | 'whatsapp'
  | 'in_app'
  | 'push'
  | 'webhook';

export type MessageDirection = 'inbound' | 'outbound';
export type MessageStatus = 'pending' | 'sent' | 'delivered' | 'read' | 'failed' | 'bounced' | 'spam';
export type MessageType = 'text' | 'image' | 'file' | 'system' | 'template';
export type PriorityLevel = 'low' | 'normal' | 'high' | 'urgent';
export type ThreadStatus = 'open' | 'closed' | 'archived' | 'spam';
export type CampaignStatus = 'draft' | 'scheduled' | 'sending' | 'sent' | 'paused' | 'cancelled';

export type TriggerEvent =
  | 'booking_created'
  | 'booking_confirmed'
  | 'booking_cancelled'
  | 'booking_completed'
  | 'payment_received'
  | 'payment_failed'
  | 'user_registered'
  | 'user_birthday'
  | 'service_reminder'
  | 'rebooking_suggested'
  | 'feedback_requested'
  | 'custom';

// Client Communication Preferences
export interface ClientCommunicationPreferences {
  id: string;
  user_id: string;
  channel: CommunicationChannel;
  is_enabled: boolean;
  preferred_time: string; // HH:MM:SS format
  timezone: string;
  frequency_limit_hours: number;
  do_not_disturb_start: string; // HH:MM:SS format
  do_not_disturb_end: string; // HH:MM:SS format
  language: string;
  created_at: string;
  updated_at: string;
}

// Message Template
export interface MessageTemplate {
  id: string;
  name: string;
  category: string;
  subject: string | null;
  content: string;
  channel: CommunicationChannel;
  language: string;
  variables: Record<string, any>;
  is_active: boolean;
  usage_count: number;
  created_at: string;
  updated_at: string;
}

// Communication Settings
export interface CommunicationSettings {
  id: string;
  channel: CommunicationChannel;
  is_enabled: boolean;
  settings: Record<string, any>;
  created_at: string;
  updated_at: string;
}

// Message Thread
export interface MessageThread {
  id: string;
  client_id: string | null;
  booking_id: string | null;
  channel: CommunicationChannel;
  subject: string | null;
  last_message_at: string | null;
  status: ThreadStatus;
  assigned_to: string | null;
  priority: PriorityLevel;
  tags: string[];
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

// Message
export interface Message {
  id: string;
  thread_id: string;
  sender_id: string | null;
  recipient_id: string | null;
  external_id: string | null;
  content: string;
  message_type: MessageType;
  direction: MessageDirection;
  status: MessageStatus;
  channel: CommunicationChannel;
  scheduled_for: string | null;
  sent_at: string | null;
  delivered_at: string | null;
  read_at: string | null;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

// Message Attachment
export interface MessageAttachment {
  id: string;
  message_id: string;
  filename: string;
  file_url: string;
  file_size: number;
  file_type: string;
  thumbnail_url: string | null;
  created_at: string;
}

// Automation Rule
export interface AutomationRule {
  id: string;
  name: string;
  description: string | null;
  trigger_event: TriggerEvent;
  trigger_conditions: Record<string, any>;
  actions: Record<string, any>;
  is_active: boolean;
  execution_count: number;
  last_executed: string | null;
  created_at: string;
  updated_at: string;
}

// Scheduled Message
export interface ScheduledMessage {
  id: string;
  template_id: string | null;
  recipient_id: string;
  booking_id: string | null;
  channel: CommunicationChannel;
  scheduled_for: string;
  sent_at: string | null;
  status: MessageStatus;
  content: string;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

// Campaign
export interface Campaign {
  id: string;
  name: string;
  description: string | null;
  type: CommunicationChannel;
  template_id: string | null;
  subject: string | null;
  content: string;
  target_audience: Record<string, any>;
  scheduled_for: string | null;
  sent_at: string | null;
  status: CampaignStatus;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

// Campaign Send
export interface CampaignSend {
  id: string;
  campaign_id: string;
  recipient_id: string;
  status: MessageStatus;
  sent_at: string | null;
  delivered_at: string | null;
  opened_at: string | null;
  clicked_at: string | null;
  bounced_at: string | null;
  error_message: string | null;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

// Message Analytics
export interface MessageAnalytics {
  id: string;
  message_id: string;
  event_type: string;
  timestamp: string;
  data: Record<string, any>;
  created_at: string;
}

// Delivery Queue
export interface DeliveryQueue {
  id: string;
  message_id: string | null;
  channel: CommunicationChannel;
  recipient: string;
  payload: Record<string, any>;
  attempts: number;
  max_attempts: number;
  next_retry_at: string;
  status: string;
  error_message: string | null;
  created_at: string;
  updated_at: string;
}

// Social Connection
export interface SocialConnection {
  id: string;
  user_id: string;
  platform: string;
  platform_user_id: string;
  access_token_encrypted: string;
  refresh_token_encrypted: string | null;
  expires_at: string | null;
  is_active: boolean;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

// Feedback Request
export interface FeedbackRequest {
  id: string;
  booking_id: string;
  client_id: string;
  type: string;
  sent_at: string | null;
  responded_at: string | null;
  score: number | null;
  feedback: string | null;
  status: string;
  created_at: string;
  updated_at: string;
}

// Internal Announcement
export interface InternalAnnouncement {
  id: string;
  title: string;
  content: string;
  author_id: string | null;
  target_roles: string[];
  is_active: boolean;
  priority: PriorityLevel;
  expires_at: string | null;
  created_at: string;
  updated_at: string;
}

// Communication History
export interface CommunicationHistory {
  id: string;
  user_id: string;
  booking_id: string | null;
  channel: CommunicationChannel;
  event_type: string;
  summary: string | null;
  metadata: Record<string, any>;
  created_at: string;
}

// Service interfaces for communication providers
export interface EmailProvider {
  sendEmail(to: string, subject: string, content: string, options?: EmailOptions): Promise<EmailResult>;
  sendTemplate(to: string, templateId: string, variables: Record<string, any>): Promise<EmailResult>;
}

export interface SMSProvider {
  sendSMS(to: string, message: string, options?: SMSOptions): Promise<SMSResult>;
}

export interface WhatsAppProvider {
  sendWhatsApp(to: string, message: string, options?: WhatsAppOptions): Promise<WhatsAppResult>;
  sendTemplate(to: string, templateName: string, variables: Record<string, any>): Promise<WhatsAppResult>;
}

export interface PushProvider {
  sendPush(to: string, title: string, message: string, options?: PushOptions): Promise<PushResult>;
}

// Provider options and results
export interface EmailOptions {
  from?: string;
  replyTo?: string;
  attachments?: Array<{
    filename: string;
    content: string | Buffer;
    contentType?: string;
  }>;
  headers?: Record<string, string>;
}

export interface SMSOptions {
  from?: string;
  mediaUrl?: string[];
  statusCallback?: string;
}

export interface WhatsAppOptions {
  from?: string;
  mediaUrl?: string[];
  templateNamespace?: string;
}

export interface PushOptions {
  icon?: string;
  badge?: string;
  tag?: string;
  data?: Record<string, any>;
  actions?: Array<{
    action: string;
    title: string;
    icon?: string;
  }>;
}

export interface EmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
  provider: string;
}

export interface SMSResult {
  success: boolean;
  messageId?: string;
  error?: string;
  provider: string;
}

export interface WhatsAppResult {
  success: boolean;
  messageId?: string;
  error?: string;
  provider: string;
}

export interface PushResult {
  success: boolean;
  messageId?: string;
  error?: string;
  provider: string;
}

// Communication Service Request/Response interfaces
export interface SendMessageRequest {
  recipientId: string;
  channel: CommunicationChannel;
  content: string;
  subject?: string;
  messageType?: MessageType;
  templateId?: string;
  variables?: Record<string, any>;
  scheduledFor?: string;
  priority?: PriorityLevel;
  bookingId?: string;
  attachments?: Array<{
    filename: string;
    file_url: string;
    file_size: number;
    file_type: string;
  }>;
}

export interface SendMessageResponse {
  success: boolean;
  messageId?: string;
  threadId?: string;
  error?: string;
  scheduledAt?: string;
}

export interface CreateCampaignRequest {
  name: string;
  description?: string;
  type: CommunicationChannel;
  templateId?: string;
  subject?: string;
  content?: string;
  targetAudience: {
    segment?: string;
    filters?: Record<string, any>;
    userIds?: string[];
  };
  scheduledFor?: string;
}

export interface CreateCampaignResponse {
  success: boolean;
  campaignId?: string;
  estimatedRecipients?: number;
  error?: string;
}

// Analytics and reporting interfaces
export interface MessageMetrics {
  totalSent: number;
  totalDelivered: number;
  totalRead: number;
  totalFailed: number;
  deliveryRate: number;
  readRate: number;
  averageDeliveryTime: number;
}

export interface ChannelMetrics {
  channel: CommunicationChannel;
  metrics: MessageMetrics;
  costs: {
    totalCost: number;
    costPerMessage: number;
  };
}

export interface CampaignMetrics {
  campaignId: string;
  campaignName: string;
  status: CampaignStatus;
  totalRecipients: number;
  sentCount: number;
  deliveredCount: number;
  openedCount: number;
  clickedCount: number;
  bouncedCount: number;
  failedCount: number;
  deliveryRate: number;
  openRate: number;
  clickRate: number;
}

export interface CommunicationDashboard {
  overview: {
    totalMessages: number;
    activeThreads: number;
    pendingMessages: number;
    deliveryRate: number;
    averageResponseTime: number;
  };
  channelMetrics: ChannelMetrics[];
  recentMessages: Message[];
  topCampaigns: CampaignMetrics[];
  upcomingScheduled: ScheduledMessage[];
}

// Template variables interface
export interface TemplateVariables {
  // Client information
  client_name: string;
  client_email: string;
  client_phone?: string;

  // Service information
  service_title: string;
  service_type: string;
  service_category?: string;

  // Booking information
  booking_date: string;
  booking_time: string;
  booking_id?: string;
  location?: string;
  duration?: number;
  price?: number;
  currency?: string;

  // Company information
  company_name: string;
  company_phone?: string;
  company_email?: string;
  company_address?: string;

  // Dynamic variables
  custom_data?: Record<string, any>;
}

// Notification preferences interface
export interface NotificationPreferences {
  email: {
    enabled: boolean;
    bookingConfirmations: boolean;
    bookingReminders: boolean;
    promotions: boolean;
    newsletters: boolean;
  };
  sms: {
    enabled: boolean;
    bookingReminders: boolean;
    urgentUpdates: boolean;
    promotions: boolean;
  };
  whatsapp: {
    enabled: boolean;
    bookingUpdates: boolean;
    customerSupport: boolean;
  };
  push: {
    enabled: boolean;
    bookingUpdates: boolean;
    promotions: boolean;
  };
  frequency: {
    maxMessagesPerDay: number;
    quietHoursStart: string;
    quietHoursEnd: string;
  };
  language: 'en' | 'pl';
}

// Webhook interfaces for external integrations
export interface WebhookEvent {
  id: string;
  type: string;
  data: Record<string, any>;
  timestamp: string;
  signature?: string;
}

export interface WebhookHandler {
  handle(event: WebhookEvent): Promise<void>;
}

// Error handling
export class CommunicationError extends Error {
  constructor(
    message: string,
    public code: string,
    public channel?: CommunicationChannel,
    public provider?: string
  ) {
    super(message);
    this.name = 'CommunicationError';
  }
}

// Configuration interfaces
export interface CommunicationConfig {
  providers: {
    email: {
      provider: 'resend' | 'sendgrid' | 'aws-ses';
      config: Record<string, any>;
    };
    sms: {
      provider: 'twilio' | 'aws-sns' | 'messagebird';
      config: Record<string, any>;
    };
    whatsapp: {
      provider: 'twilio' | 'infobip';
      config: Record<string, any>;
    };
    push: {
      provider: 'firebase' | 'aws-sns';
      config: Record<string, any>;
    };
  };
  defaults: {
    fromEmail: string;
    fromPhone: string;
    replyTo: string;
    timezone: string;
    language: string;
  };
  limits: {
    maxRetries: number;
    retryDelay: number;
    maxBatchSize: number;
    rateLimit: {
      email: number; // per minute
      sms: number; // per minute
      whatsapp: number; // per minute
    };
  };
}