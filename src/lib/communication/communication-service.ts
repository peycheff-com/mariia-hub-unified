// Main communication service orchestrating all communication channels

import { supabase } from '@/integrations/supabase/client';
import {
  SendMessageRequest,
  SendMessageResponse,
  CreateCampaignRequest,
  CreateCampaignResponse,
  Message,
  MessageTemplate,
  MessageThread,
  ScheduledMessage,
  Campaign,
  CampaignSend,
  ClientCommunicationPreferences,
  CommunicationChannel,
  MessageStatus,
  MessageType,
  PriorityLevel,
  TriggerEvent,
  TemplateVariables,
  NotificationPreferences,
  CommunicationDashboard,
  CommunicationError
} from '@/types/communication';

import { ResendEmailProvider } from './providers/email-provider';
import { TwilioSMSProvider } from './providers/sms-provider';

export class CommunicationService {
  private emailProvider: ResendEmailProvider;
  private smsProvider: TwilioSMSProvider;
  private initialized: boolean = false;

  constructor() {
    // Initialize providers with environment variables
    this.initializeProviders();
  }

  private initializeProviders() {
    try {
      // Initialize Email Provider
      this.emailProvider = new ResendEmailProvider({
        apiKey: import.meta.env.VITE_RESEND_API_KEY || '',
        fromEmail: import.meta.env.VITE_EMAIL_FROM || 'noreply@mariaborysevych.com',
        replyTo: import.meta.env.VITE_EMAIL_REPLY_TO || 'support@mariaborysevych.com'
      });

      // Initialize SMS Provider
      this.smsProvider = new TwilioSMSProvider({
        accountSid: import.meta.env.VITE_TWILIO_ACCOUNT_SID || '',
        authToken: import.meta.env.VITE_TWILIO_AUTH_TOKEN || '',
        fromNumber: import.meta.env.VITE_TWILIO_FROM_NUMBER || '+48123456789'
      });

      this.initialized = true;
    } catch (error) {
      console.error('Failed to initialize communication providers:', error);
      this.initialized = false;
    }
  }

  private ensureInitialized() {
    if (!this.initialized) {
      throw new CommunicationError(
        'Communication service not properly initialized',
        'SERVICE_NOT_INITIALIZED'
      );
    }
  }

  // Core messaging functionality
  async sendMessage(request: SendMessageRequest): Promise<SendMessageResponse> {
    this.ensureInitialized();

    try {
      // Check client communication preferences
      const canSend = await this.checkCommunicationPreferences(
        request.recipientId,
        request.channel
      );

      if (!canSend) {
        throw new CommunicationError(
          'Client has disabled this communication channel',
          'CHANNEL_DISABLED_BY_CLIENT'
        );
      }

      // Get or create message thread
      const threadId = await this.getOrCreateMessageThread(
        request.recipientId,
        request.channel,
        request.bookingId
      );

      // Process message content if using template
      let finalContent = request.content;
      if (request.templateId) {
        finalContent = await this.processTemplate(
          request.templateId,
          request.variables || {}
        );
      }

      // Create message record
      const message = await this.createMessageRecord({
        threadId,
        recipientId: request.recipientId,
        content: finalContent,
        channel: request.channel,
        messageType: request.messageType || MessageType.TEXT,
        subject: request.subject,
        scheduledFor: request.scheduledFor,
        priority: request.priority || PriorityLevel.NORMAL,
        bookingId: request.bookingId,
        attachments: request.attachments
      });

      // Send message or schedule for later
      if (request.scheduledFor) {
        // Schedule message
        await this.scheduleMessage(message.id, request.scheduledFor);
        return {
          success: true,
          messageId: message.id,
          threadId,
          scheduledAt: request.scheduledFor
        };
      } else {
        // Send immediately
        const result = await this.sendImmediateMessage(message);
        return {
          success: result.success,
          messageId: message.id,
          threadId,
          error: result.error
        };
      }

    } catch (error) {
      console.error('Failed to send message:', error);
      throw this.formatError(error);
    }
  }

  private async checkCommunicationPreferences(
    userId: string,
    channel: CommunicationChannel
  ): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .rpc('can_send_message', {
          p_user_id: userId,
          p_channel: channel
        });

      if (error) {
        console.error('Error checking communication preferences:', error);
        return true; // Default to allowed if check fails
      }

      return data || true;
    } catch (error) {
      console.error('Error checking communication preferences:', error);
      return true; // Default to allowed if check fails
    }
  }

  private async getOrCreateMessageThread(
    clientId: string,
    channel: CommunicationChannel,
    bookingId?: string
  ): Promise<string> {
    try {
      // Try to find existing thread
      const { data: existingThread } = await supabase
        .from('message_threads')
        .select('id')
        .eq('client_id', clientId)
        .eq('channel', channel)
        .eq('booking_id', bookingId || null)
        .eq('status', 'open')
        .single();

      if (existingThread) {
        return existingThread.id;
      }

      // Create new thread
      const { data: newThread, error } = await supabase
        .from('message_threads')
        .insert({
          client_id: clientId,
          booking_id: bookingId || null,
          channel,
          status: 'open',
          priority: PriorityLevel.NORMAL
        })
        .select('id')
        .single();

      if (error) throw error;
      return newThread.id;

    } catch (error) {
      throw new CommunicationError(
        `Failed to get or create message thread: ${error}`,
        'THREAD_ERROR'
      );
    }
  }

  private async processTemplate(
    templateId: string,
    variables: Record<string, any>
  ): Promise<string> {
    try {
      const { data: template, error } = await supabase
        .from('message_templates')
        .select('*')
        .eq('id', templateId)
        .single();

      if (error || !template) {
        throw new CommunicationError(
          'Template not found',
          'TEMPLATE_NOT_FOUND'
        );
      }

      let content = template.content;

      // Replace template variables
      Object.entries(variables).forEach(([key, value]) => {
        const placeholder = `{{${key}}}`;
        content = content.replace(new RegExp(placeholder, 'g'), String(value));
      });

      return content;

    } catch (error) {
      throw new CommunicationError(
        `Failed to process template: ${error}`,
        'TEMPLATE_PROCESSING_ERROR'
      );
    }
  }

  private async createMessageRecord(data: {
    threadId: string;
    recipientId: string;
    content: string;
    channel: CommunicationChannel;
    messageType: MessageType;
    subject?: string;
    scheduledFor?: string;
    priority: PriorityLevel;
    bookingId?: string;
    attachments?: Array<{
      filename: string;
      file_url: string;
      file_size: number;
      file_type: string;
    }>;
  }): Promise<Message> {
    try {
      const { data: message, error } = await supabase
        .from('messages')
        .insert({
          thread_id: data.threadId,
          recipient_id: data.recipientId,
          content: data.content,
          message_type: data.messageType,
          direction: 'outbound',
          status: data.scheduledFor ? 'scheduled' : 'pending',
          channel: data.channel,
          scheduled_for: data.scheduledFor,
          metadata: {
            priority: data.priority,
            booking_id: data.bookingId
          }
        })
        .select()
        .single();

      if (error) throw error;

      // Create attachments if provided
      if (data.attachments && data.attachments.length > 0) {
        for (const attachment of data.attachments) {
          await supabase.from('message_attachments').insert({
            message_id: message.id,
            filename: attachment.filename,
            file_url: attachment.file_url,
            file_size: attachment.file_size,
            file_type: attachment.file_type
          });
        }
      }

      return message;

    } catch (error) {
      throw new CommunicationError(
        `Failed to create message record: ${error}`,
        'MESSAGE_CREATION_ERROR'
      );
    }
  }

  private async scheduleMessage(messageId: string, scheduledFor: string): Promise<void> {
    try {
      await supabase
        .from('scheduled_messages')
        .insert({
          message_id: messageId,
          scheduled_for: scheduledFor,
          status: 'scheduled'
        });

    } catch (error) {
      throw new CommunicationError(
        `Failed to schedule message: ${error}`,
        'SCHEDULING_ERROR'
      );
    }
  }

  private async sendImmediateMessage(message: Message): Promise<{ success: boolean; error?: string }> {
    try {
      // Get recipient details
      const { data: recipient, error: recipientError } = await supabase
        .from('profiles')
        .select('email, phone')
        .eq('id', message.recipient_id)
        .single();

      if (recipientError || !recipient) {
        throw new CommunicationError(
          'Recipient not found',
          'RECIPIENT_NOT_FOUND'
        );
      }

      // Send via appropriate provider
      let result;
      switch (message.channel) {
        case 'email':
          if (!recipient.email) {
            throw new CommunicationError(
              'Recipient email not available',
              'NO_EMAIL_ADDRESS'
            );
          }
          result = await this.emailProvider.sendEmail(
            recipient.email,
            'Notification from mariiaborysevych',
            message.content
          );
          break;

        case 'sms':
          if (!recipient.phone) {
            throw new CommunicationError(
              'Recipient phone not available',
              'NO_PHONE_NUMBER'
            );
          }
          result = await this.smsProvider.sendSMS(
            recipient.phone,
            message.content
          );
          break;

        default:
          throw new CommunicationError(
            `Channel ${message.channel} not yet implemented`,
            'CHANNEL_NOT_IMPLEMENTED'
          );
      }

      // Update message status
      await this.updateMessageStatus(
        message.id,
        result.success ? MessageStatus.SENT : MessageStatus.FAILED,
        result.messageId
      );

      // Log communication event
      await this.logCommunicationEvent(
        message.recipient_id,
        message.channel,
        'message_sent',
        `Message sent via ${message.channel}`,
        { messageId: message.id }
      );

      return {
        success: result.success,
        error: result.error
      };

    } catch (error) {
      // Update message status to failed
      await this.updateMessageStatus(message.id, MessageStatus.FAILED);
      throw error;
    }
  }

  private async updateMessageStatus(
    messageId: string,
    status: MessageStatus,
    externalId?: string
  ): Promise<void> {
    try {
      const updateData: any = {
        status,
        updated_at: new Date().toISOString()
      };

      if (status === MessageStatus.SENT) {
        updateData.sent_at = new Date().toISOString();
      }

      if (externalId) {
        updateData.external_id = externalId;
      }

      await supabase
        .from('messages')
        .update(updateData)
        .eq('id', messageId);

    } catch (error) {
      console.error('Failed to update message status:', error);
    }
  }

  private async logCommunicationEvent(
    userId: string,
    channel: CommunicationChannel,
    eventType: string,
    summary: string,
    metadata: Record<string, any>
  ): Promise<void> {
    try {
      await supabase
        .from('communication_history')
        .insert({
          user_id: userId,
          channel,
          event_type: eventType,
          summary,
          metadata
        });

    } catch (error) {
      console.error('Failed to log communication event:', error);
    }
  }

  // Template management
  async getTemplates(
    channel?: CommunicationChannel,
    category?: string,
    language: string = 'en'
  ): Promise<MessageTemplate[]> {
    try {
      let query = supabase
        .from('message_templates')
        .select('*')
        .eq('is_active', true)
        .eq('language', language);

      if (channel) {
        query = query.eq('channel', channel);
      }

      if (category) {
        query = query.eq('category', category);
      }

      const { data, error } = await query.order('name');

      if (error) throw error;
      return data || [];

    } catch (error) {
      throw new CommunicationError(
        `Failed to fetch templates: ${error}`,
        'TEMPLATE_FETCH_ERROR'
      );
    }
  }

  async createTemplate(template: Omit<MessageTemplate, 'id' | 'usage_count' | 'created_at' | 'updated_at'>): Promise<MessageTemplate> {
    try {
      const { data, error } = await supabase
        .from('message_templates')
        .insert({
          ...template,
          usage_count: 0
        })
        .select()
        .single();

      if (error) throw error;
      return data;

    } catch (error) {
      throw new CommunicationError(
        `Failed to create template: ${error}`,
        'TEMPLATE_CREATE_ERROR'
      );
    }
  }

  // Client preferences management
  async getClientPreferences(userId: string): Promise<ClientCommunicationPreferences[]> {
    try {
      const { data, error } = await supabase
        .from('client_communication_preferences')
        .select('*')
        .eq('user_id', userId);

      if (error) throw error;
      return data || [];

    } catch (error) {
      throw new CommunicationError(
        `Failed to fetch client preferences: ${error}`,
        'PREFERENCES_FETCH_ERROR'
      );
    }
  }

  async updateClientPreferences(
    userId: string,
    preferences: Partial<ClientCommunicationPreferences>[]
  ): Promise<void> {
    try {
      for (const pref of preferences) {
        await supabase
          .from('client_communication_preferences')
          .upsert({
            user_id: userId,
            ...pref,
            updated_at: new Date().toISOString()
          });
      }

    } catch (error) {
      throw new CommunicationError(
        `Failed to update client preferences: ${error}`,
        'PREFERENCES_UPDATE_ERROR'
      );
    }
  }

  // Campaign management
  async createCampaign(request: CreateCampaignRequest): Promise<CreateCampaignResponse> {
    try {
      // Calculate estimated recipients
      const estimatedRecipients = await this.calculateCampaignRecipients(request.targetAudience);

      // Create campaign
      const { data: campaign, error } = await supabase
        .from('campaigns')
        .insert({
          name: request.name,
          description: request.description,
          type: request.type,
          subject: request.subject,
          content: request.content,
          target_audience: request.targetAudience,
          scheduled_for: request.scheduledFor,
          status: request.scheduledFor ? 'scheduled' : 'draft'
        })
        .select('id')
        .single();

      if (error) throw error;

      return {
        success: true,
        campaignId: campaign.id,
        estimatedRecipients
      };

    } catch (error) {
      throw new CommunicationError(
        `Failed to create campaign: ${error}`,
        'CAMPAIGN_CREATE_ERROR'
      );
    }
  }

  private async calculateCampaignRecipients(targetAudience: any): Promise<number> {
    try {
      // This would implement logic to calculate the number of recipients
      // based on the target audience filters
      // For now, return a placeholder
      return 100;

    } catch (error) {
      console.error('Failed to calculate campaign recipients:', error);
      return 0;
    }
  }

  // Dashboard and analytics
  async getDashboardData(userId?: string): Promise<CommunicationDashboard> {
    try {
      // Get overview statistics
      const { data: messages } = await supabase
        .from('messages')
        .select('status, created_at')
        .order('created_at', { ascending: false })
        .limit(100);

      const { data: threads } = await supabase
        .from('message_threads')
        .select('status, last_message_at')
        .eq('status', 'open');

      const { data: scheduled } = await supabase
        .from('scheduled_messages')
        .select('scheduled_for, content')
        .eq('status', 'scheduled')
        .order('scheduled_for', { ascending: true })
        .limit(10);

      // Calculate metrics
      const totalMessages = messages?.length || 0;
      const sentMessages = messages?.filter(m => m.status === 'sent').length || 0;
      const activeThreads = threads?.length || 0;
      const pendingMessages = messages?.filter(m => m.status === 'pending').length || 0;
      const deliveryRate = totalMessages > 0 ? (sentMessages / totalMessages) * 100 : 0;

      return {
        overview: {
          totalMessages,
          activeThreads,
          pendingMessages,
          deliveryRate,
          averageResponseTime: 0 // Calculate from threads
        },
        channelMetrics: [], // Implement channel-specific metrics
        recentMessages: messages || [],
        topCampaigns: [], // Fetch top performing campaigns
        upcomingScheduled: scheduled || []
      };

    } catch (error) {
      throw new CommunicationError(
        `Failed to fetch dashboard data: ${error}`,
        'DASHBOARD_FETCH_ERROR'
      );
    }
  }

  // Automation rules
  async createAutomationRule(
    rule: Omit<any, 'id' | 'execution_count' | 'last_executed' | 'created_at' | 'updated_at'>
  ): Promise<void> {
    try {
      await supabase
        .from('automation_rules')
        .insert({
          ...rule,
          execution_count: 0
        });

    } catch (error) {
      throw new CommunicationError(
        `Failed to create automation rule: ${error}`,
        'AUTOMATION_RULE_CREATE_ERROR'
      );
    }
  }

  // Helper method to format errors
  private formatError(error: unknown): CommunicationError {
    if (error instanceof CommunicationError) {
      return error;
    }

    if (error instanceof Error) {
      return new CommunicationError(
        error.message,
        'UNKNOWN_ERROR'
      );
    }

    return new CommunicationError(
      'Unknown error occurred',
      'UNKNOWN_ERROR'
    );
  }
}

// Singleton instance
export const communicationService = new CommunicationService();