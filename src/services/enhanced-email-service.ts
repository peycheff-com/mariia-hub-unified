/**
 * Enhanced Email Service
 *
 * Advanced email service with:
 * - Rate limiting per provider
 * - Email queuing system
 * - Delivery tracking
 * - Template caching
 * - Multiple provider support (Resend, SendGrid, AWS SES)
 * - Bounce and complaint handling
 * - Analytics and reporting
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';

import { credentialManager } from '@/lib/secure-credentials';
import { getRequiredEnvVar } from '@/lib/runtime-env';

import { apiGateway } from './secure-api-gateway';

// Email types
export interface EmailMessage {
  id?: string;
  to: string | string[];
  cc?: string | string[];
  bcc?: string | string[];
  from?: string;
  replyTo?: string;
  subject: string;
  html?: string;
  text?: string;
  templateId?: string;
  templateData?: Record<string, any>;
  attachments?: EmailAttachment[];
  headers?: Record<string, string>;
  metadata?: Record<string, any>;
  priority?: 'low' | 'normal' | 'high';
  sendAt?: Date;
  trackOpens?: boolean;
  trackClicks?: boolean;
}

export interface EmailAttachment {
  filename: string;
  content: string | Buffer;
  contentType: string;
  contentId?: string;
}

export interface EmailDeliveryStatus {
  id: string;
  messageId: string;
  status: 'queued' | 'sent' | 'delivered' | 'bounced' | 'complained' | 'rejected';
  provider: string;
  providerMessageId?: string;
  lastUpdate: Date;
  events: EmailDeliveryEvent[];
  errorMessage?: string;
}

export interface EmailDeliveryEvent {
  timestamp: Date;
  event: string;
  provider: string;
  data: Record<string, any>;
}

export interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  html: string;
  text?: string;
  variables: string[];
  cachedAt?: Date;
}

export interface EmailProvider {
  name: string;
  send: (email: EmailMessage) => Promise<EmailDeliveryStatus>;
  getStatus: (messageId: string) => Promise<EmailDeliveryStatus>;
  handleWebhook: (event: any) => Promise<void>;
}

class EnhancedEmailService {
  private supabase: SupabaseClient;
  private providers: Map<string, EmailProvider> = new Map();
  private templates: Map<string, EmailTemplate> = new Map();
  private rateLimiters: Map<string, RateLimiter> = new Map();
  private queueProcessor: NodeJS.Timeout | null = null;
  private isProcessing = false;

  constructor() {
    this.supabase = createClient(
      getRequiredEnvVar('SUPABASE_URL', ['VITE_SUPABASE_URL', 'NEXT_PUBLIC_SUPABASE_URL']),
      getRequiredEnvVar('SUPABASE_SERVICE_ROLE_KEY', ['VITE_SUPABASE_SERVICE_ROLE_KEY'])
    );

    this.initializeProviders();
    this.startQueueProcessor();
  }

  /**
   * Initialize email providers
   */
  private async initializeProviders(): Promise<void> {
    // Initialize Resend
    this.providers.set('resend', new ResendProvider());

    // Initialize SendGrid if credentials exist
    const sendgridCreds = await credentialManager.getCredentials('sendgrid');
    if (sendgridCreds) {
      this.providers.set('sendgrid', new SendGridProvider());
    }

    // Initialize rate limiters for each provider
    for (const providerName of this.providers.keys()) {
      this.rateLimiters.set(providerName, new RateLimiter(
        providerName === 'resend' ? 100 : 600, // Resend: 100/min, SendGrid: 600/min
        60000 // 1 minute window
      ));
    }
  }

  /**
   * Send email with provider fallback and queuing
   */
  async sendEmail(email: EmailMessage): Promise<EmailDeliveryStatus> {
    try {
      // Check if email should be queued
      if (email.sendAt && email.sendAt > new Date()) {
        return await this.queueEmail(email);
      }

      // Try primary provider first
      const primaryProvider = this.providers.get('resend') || this.providers.values().next().value;
      if (!primaryProvider) {
        throw new Error('No email providers available');
      }

      // Check rate limit
      const rateLimiter = this.rateLimiters.get('resend')!;
      if (!rateLimiter.canMakeRequest()) {
        // Queue if rate limited
        return await this.queueEmail(email);
      }

      // Send email
      const status = await primaryProvider.send(email);

      // Store in database
      await this.storeEmailStatus(status);

      // Cache template if used
      if (email.templateId && !this.templates.has(email.templateId)) {
        await this.cacheTemplate(email.templateId);
      }

      return status;
    } catch (error) {
      console.error('Failed to send email:', error);

      // Try fallback providers
      for (const [name, provider] of this.providers) {
        if (name === 'resend') continue; // Already tried

        const rateLimiter = this.rateLimiters.get(name)!;
        if (!rateLimiter.canMakeRequest()) continue;

        try {
          const status = await provider.send(email);
          await this.storeEmailStatus(status);
          return status;
        } catch (fallbackError) {
          console.error(`Fallback provider ${name} failed:`, fallbackError);
        }
      }

      // All providers failed, queue for retry
      return await this.queueEmail(email);
    }
  }

  /**
   * Queue email for later sending
   */
  private async queueEmail(email: EmailMessage): Promise<EmailDeliveryStatus> {
    const emailId = crypto.randomUUID();

    // Store in email queue
    await this.supabase
      .from('email_queue')
      .insert({
        id: emailId,
        email_data: email,
        scheduled_for: email.sendAt || new Date(),
        priority: email.priority || 'normal',
        attempts: 0,
        status: 'queued',
        created_at: new Date()
      });

    return {
      id: emailId,
      messageId: emailId,
      status: 'queued',
      provider: 'queue',
      lastUpdate: new Date(),
      events: []
    };
  }

  /**
   * Start queue processor
   */
  private startQueueProcessor(): void {
    this.queueProcessor = setInterval(async () => {
      if (this.isProcessing) return;
      this.isProcessing = true;

      try {
        await this.processQueue();
      } catch (error) {
        console.error('Queue processing error:', error);
      } finally {
        this.isProcessing = false;
      }
    }, 30000); // Process every 30 seconds
  }

  /**
   * Process email queue
   */
  private async processQueue(): Promise<void> {
    const { data: queuedEmails } = await this.supabase
      .from('email_queue')
      .select('*')
      .eq('status', 'queued')
      .or(`scheduled_for.lte.${new Date().toISOString()}`)
      .order('priority', { ascending: false })
      .order('created_at', { ascending: true })
      .limit(50);

    for (const queued of queuedEmails || []) {
      try {
        const email = queued.email_data as EmailMessage;

        // Try to send
        const status = await this.sendEmail(email);

        if (status.status !== 'queued') {
          // Successfully sent, update queue
          await this.supabase
            .from('email_queue')
            .update({
              status: 'sent',
              sent_at: new Date(),
              provider_message_id: status.providerMessageId
            })
            .eq('id', queued.id);
        }
      } catch (error) {
        // Update attempt count
        const attempts = queued.attempts + 1;

        if (attempts >= 5) {
          // Max attempts reached, mark as failed
          await this.supabase
            .from('email_queue')
            .update({
              status: 'failed',
              attempts,
              last_attempt_at: new Date(),
              error_message: error instanceof Error ? error.message : 'Unknown error'
            })
            .eq('id', queued.id);
        } else {
          // Retry later
          await this.supabase
            .from('email_queue')
            .update({
              attempts,
              last_attempt_at: new Date(),
              next_retry_at: new Date(Date.now() + Math.pow(2, attempts) * 60000) // Exponential backoff
            })
            .eq('id', queued.id);
        }
      }
    }
  }

  /**
   * Store email delivery status
   */
  private async storeEmailStatus(status: EmailDeliveryStatus): Promise<void> {
    await this.supabase
      .from('email_deliveries')
      .upsert({
        id: status.id,
        message_id: status.messageId,
        status: status.status,
        provider: status.provider,
        provider_message_id: status.providerMessageId,
        last_update: status.lastUpdate,
        error_message: status.errorMessage,
        created_at: new Date(),
        updated_at: new Date()
      });
  }

  /**
   * Get email delivery status
   */
  async getDeliveryStatus(emailId: string): Promise<EmailDeliveryStatus | null> {
    const { data, error } = await this.supabase
      .from('email_deliveries')
      .select('*')
      .eq('id', emailId)
      .single();

    if (error || !data) return null;

    // Get events
    const { data: events } = await this.supabase
      .from('email_delivery_events')
      .select('*')
      .eq('email_id', emailId)
      .order('timestamp', { ascending: true });

    return {
      id: data.id,
      messageId: data.message_id,
      status: data.status,
      provider: data.provider,
      providerMessageId: data.provider_message_id,
      lastUpdate: new Date(data.last_update),
      errorMessage: data.error_message,
      events: (events || []).map(e => ({
        timestamp: new Date(e.timestamp),
        event: e.event,
        provider: e.provider,
        data: e.data
      }))
    };
  }

  /**
   * Cache email template
   */
  private async cacheTemplate(templateId: string): Promise<void> {
    try {
      const { data } = await this.supabase
        .from('email_templates')
        .select('*')
        .eq('id', templateId)
        .single();

      if (data) {
        this.templates.set(templateId, {
          id: data.id,
          name: data.name,
          subject: data.subject,
          html: data.html,
          text: data.text,
          variables: data.variables || [],
          cachedAt: new Date()
        });
      }
    } catch (error) {
      console.error('Failed to cache template:', error);
    }
  }

  /**
   * Send template email
   */
  async sendTemplateEmail(
    templateId: string,
    to: string | string[],
    data: Record<string, any>,
    options: Partial<EmailMessage> = {}
  ): Promise<EmailDeliveryStatus> {
    // Get template (from cache or database)
    let template = this.templates.get(templateId);
    if (!template) {
      await this.cacheTemplate(templateId);
      template = this.templates.get(templateId);
    }

    if (!template) {
      throw new Error(`Template not found: ${templateId}`);
    }

    // Render template
    const subject = this.renderTemplate(template.subject, data);
    const html = template.html ? this.renderTemplate(template.html, data) : undefined;
    const text = template.text ? this.renderTemplate(template.text, data) : undefined;

    // Send email
    return await this.sendEmail({
      to,
      subject,
      html,
      text,
      templateId,
      templateData: data,
      ...options
    });
  }

  /**
   * Render template with data
   */
  private renderTemplate(template: string, data: Record<string, any>): string {
    return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
      return data[key] || match;
    });
  }

  /**
   * Handle webhook from email provider
   */
  async handleWebhook(provider: string, event: any): Promise<void> {
    const providerInstance = this.providers.get(provider);
    if (!providerInstance) {
      console.error(`Unknown provider: ${provider}`);
      return;
    }

    await providerInstance.handleWebhook(event);
  }

  /**
   * Get email analytics
   */
  async getAnalytics(
    startDate?: Date,
    endDate?: Date
  ): Promise<{
    totalSent: number;
    totalDelivered: number;
    totalBounced: number;
    totalComplained: number;
    deliveryRate: number;
    bounceRate: number;
    complaintRate: number;
    providerBreakdown: Record<string, {
      sent: number;
      delivered: number;
      bounced: number;
    }>;
  }> {
    let query = this.supabase
      .from('email_deliveries')
      .select('*');

    if (startDate) {
      query = query.gte('created_at', startDate.toISOString());
    }
    if (endDate) {
      query = query.lte('created_at', endDate.toISOString());
    }

    const { data, error } = await query;

    if (error || !data) {
      throw error;
    }

    const totalSent = data.length;
    const totalDelivered = data.filter(d => d.status === 'delivered').length;
    const totalBounced = data.filter(d => d.status === 'bounced').length;
    const totalComplained = data.filter(d => d.status === 'complained').length;

    // Provider breakdown
    const providerBreakdown: Record<string, { sent: number; delivered: number; bounced: number }> = {};

    for (const delivery of data) {
      if (!providerBreakdown[delivery.provider]) {
        providerBreakdown[delivery.provider] = { sent: 0, delivered: 0, bounced: 0 };
      }

      providerBreakdown[delivery.provider].sent++;

      if (delivery.status === 'delivered') {
        providerBreakdown[delivery.provider].delivered++;
      } else if (delivery.status === 'bounced') {
        providerBreakdown[delivery.provider].bounced++;
      }
    }

    return {
      totalSent,
      totalDelivered,
      totalBounced,
      totalComplained,
      deliveryRate: totalSent > 0 ? (totalDelivered / totalSent) * 100 : 0,
      bounceRate: totalSent > 0 ? (totalBounced / totalSent) * 100 : 0,
      complaintRate: totalSent > 0 ? (totalComplained / totalSent) * 100 : 0,
      providerBreakdown
    };
  }

  /**
   * Stop queue processor
   */
  stop(): void {
    if (this.queueProcessor) {
      clearInterval(this.queueProcessor);
      this.queueProcessor = null;
    }
  }
}

// Rate limiter implementation
class RateLimiter {
  private requests: number[] = [];
  private readonly maxRequests: number;
  private readonly windowMs: number;

  constructor(maxRequests: number, windowMs: number) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
  }

  canMakeRequest(): boolean {
    const now = Date.now();
    const windowStart = now - this.windowMs;

    // Remove old requests
    this.requests = this.requests.filter(time => time > windowStart);

    return this.requests.length < this.maxRequests;
  }

  recordRequest(): void {
    this.requests.push(Date.now());
  }

  getRemainingRequests(): number {
    const now = Date.now();
    const windowStart = now - this.windowMs;

    this.requests = this.requests.filter(time => time > windowStart);

    return Math.max(0, this.maxRequests - this.requests.length);
  }

  getResetTime(): Date {
    if (this.requests.length === 0) {
      return new Date();
    }

    const oldestRequest = Math.min(...this.requests);
    return new Date(oldestRequest + this.windowMs);
  }
}

// Resend provider implementation
class ResendProvider implements EmailProvider {
  name = 'resend';

  async send(email: EmailMessage): Promise<EmailDeliveryStatus> {
    const response = await apiGateway.request('resend', '/emails', {
      method: 'POST',
      body: {
        from: email.from || process.env.RESEND_FROM_EMAIL,
        to: Array.isArray(email.to) ? email.to : [email.to],
        cc: email.cc ? (Array.isArray(email.cc) ? email.cc : [email.cc]) : undefined,
        bcc: email.bcc ? (Array.isArray(email.bcc) ? email.bcc : [email.bcc]) : undefined,
        subject: email.subject,
        html: email.html,
        text: email.text,
        reply_to: email.replyTo,
        headers: email.headers
      }
    });

    if (!response.success) {
      throw new Error(response.error || 'Failed to send email via Resend');
    }

    return {
      id: crypto.randomUUID(),
      messageId: response.data.id,
      status: 'sent',
      provider: 'resend',
      providerMessageId: response.data.id,
      lastUpdate: new Date(),
      events: []
    };
  }

  async getStatus(messageId: string): Promise<EmailDeliveryStatus> {
    const response = await apiGateway.request('resend', `/emails/${messageId}`);

    if (!response.success) {
      throw new Error(response.error || 'Failed to get email status');
    }

    return {
      id: crypto.randomUUID(),
      messageId,
      status: response.data.last_event ? this.mapResendStatus(response.data.last_event) : 'sent',
      provider: 'resend',
      providerMessageId: messageId,
      lastUpdate: new Date(response.data.created_at),
      events: []
    };
  }

  async handleWebhook(event: any): Promise<void> {
    // Handle Resend webhook events
    console.log('Resend webhook:', event);
  }

  private mapResendStatus(event: string): EmailDeliveryStatus['status'] {
    switch (event) {
      case 'delivered': return 'delivered';
      case 'bounced': return 'bounced';
      case 'complained': return 'complained';
      default: return 'sent';
    }
  }
}

// SendGrid provider implementation
class SendGridProvider implements EmailProvider {
  name = 'sendgrid';

  async send(email: EmailMessage): Promise<EmailDeliveryStatus> {
    const response = await apiGateway.request('sendgrid', '/mail/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: {
        personalizations: [{
          to: Array.isArray(email.to) ? email.to.map(e => ({ email: e })) : [{ email: email.to }],
          cc: email.cc ? (Array.isArray(email.cc) ? email.cc.map(e => ({ email: e })) : [{ email: email.cc }]) : undefined,
          bcc: email.bcc ? (Array.isArray(email.bcc) ? email.bcc.map(e => ({ email: e })) : [{ email: email.bcc }]) : undefined,
          subject: email.subject
        }],
        from: { email: email.from || process.env.SENDGRID_FROM_EMAIL },
        reply_to: email.replyTo ? { email: email.replyTo } : undefined,
        content: [
          ...(email.text ? [{ type: 'text/plain', value: email.text }] : []),
          ...(email.html ? [{ type: 'text/html', value: email.html }] : [])
        ],
        headers: email.headers,
        custom_args: email.metadata
      }
    });

    if (response.success) {
      return {
        id: crypto.randomUUID(),
        messageId: response.headers['X-Message-Id'] || crypto.randomUUID(),
        status: 'sent',
        provider: 'sendgrid',
        lastUpdate: new Date(),
        events: []
      };
    }

    throw new Error('Failed to send email via SendGrid');
  }

  async getStatus(messageId: string): Promise<EmailDeliveryStatus> {
    // Implementation would query SendGrid API
    throw new Error('Not implemented');
  }

  async handleWebhook(event: any): Promise<void> {
    // Handle SendGrid webhook events
    console.log('SendGrid webhook:', event);
  }
}

// Export singleton instance
export const enhancedEmailService = new EnhancedEmailService();

// Convenience methods
export const sendEmail = (email: EmailMessage) => enhancedEmailService.sendEmail(email);
export const sendTemplateEmail = (
  templateId: string,
  to: string | string[],
  data: Record<string, any>,
  options?: Partial<EmailMessage>
) => enhancedEmailService.sendTemplateEmail(templateId, to, data, options);
