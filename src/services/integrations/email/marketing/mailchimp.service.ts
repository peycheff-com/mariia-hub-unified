/**
 * Mailchimp Integration Service
 * Handles email marketing campaigns, audience management, and automation
 * Supports campaign creation, subscriber management, and performance tracking
 */

import { supabase } from '@/integrations/supabase/client';
import { BaseIntegrationService, type SyncResult, type HealthCheckResult, type WebhookPayload } from '../../base/base-integration.service';
import type {
  IntegrationConfig,
  EmailCampaign,
  EmailCampaignMetrics,
  DataMapping,
  IntegrationTemplate,
  AuthConfig
} from '@/types/integrations';

export interface MailchimpConfig extends IntegrationConfig {
  api_key: string;
  server_prefix: string; // e.g., 'us1', 'us2', etc.
  default_list_id?: string;
  default_from_name?: string;
  default_from_email?: string;
  track_opens?: boolean;
  track_clicks?: boolean;
  double_opt_in?: boolean;
  sync_tags?: boolean;
  campaign_approval_required?: boolean;
}

export interface MailchimpList {
  id: string;
  name: string;
  contact: {
    company: string;
    address1: string;
    address2?: string;
    city: string;
    state: string;
    zip: string;
    country: string;
    phone?: string;
  };
  permission_reminder: string;
    campaign_defaults: {
      from_name: string;
      from_email: string;
      subject: string;
      language: string;
    };
    email_type_option: boolean;
    stats: {
      member_count: number;
      unsubscribe_count: number;
      cleaned_count: number;
      member_count_since_send: number;
      unsubscribe_count_since_send: number;
      cleaned_count_since_send: number;
      campaign_count: number;
      campaign_last_sent: string;
    };
  }

export interface MailchimpMember {
  id: string;
  email_address: string;
  unique_email_id: string;
  email_type: 'html' | 'text';
  status: 'subscribed' | 'unsubscribed' | 'cleaned' | 'pending' | 'transactional';
  merge_fields: Record<string, any>;
  interests: Record<string, boolean>;
  stats: {
    avg_open_rate: number;
    avg_click_rate: number;
  };
  ip_opt?: string;
  timestamp_opt?: string;
  ip_signup?: string;
  timestamp_signup?: string;
  member_rating: number;
  last_changed: string;
  language: string;
  vip: boolean;
  email_client?: string;
  location?: {
    latitude: number;
    longitude: number;
    gmtoff: number;
    dstoff: number;
    country_code: string;
    region: string;
    city: string;
  };
  source?: string;
  tags_count?: number;
  tags?: Array<{
    id: number;
    name: string;
  }>;
  list_id: string;
}

export interface MailchimpCampaign {
  id: string;
  type: 'regular' | 'plaintext' | 'absplit' | 'rss' | 'variate';
  recipients: {
    list_id: string;
    list_name?: string;
    segment_text?: string;
    recipient_count: number;
  };
  settings: {
    subject_line: string;
    preview_text?: string;
    title?: string;
    from_name: string;
    reply_to: string;
    use_conversation: boolean;
    to_name?: string;
    folder_id?: string;
    authenticate?: boolean;
    auto_footer?: boolean;
    inline_css?: boolean;
    auto_tweet?: boolean;
    fb_comments?: boolean;
    timewarp?: boolean;
    template_id?: number;
    drag_and_drop?: boolean;
  };
  tracking: {
    opens: boolean;
    html_clicks: boolean;
    text_clicks: boolean;
    goal_tracking: boolean;
    ecomm360: boolean;
    google_analytics?: string;
    clicktale?: string;
    salesforce: {
      campaign?: boolean;
      note?: string;
    };
    hubspot?: {
      campaign?: boolean;
      note?: string;
    };
  };
  rss_opts?: {
    feed_url: string;
    frequency: string;
    schedule: {
      hour: number;
      day: string;
      month_day: string;
    };
    constrain_rss_img?: boolean;
  };
  ab_split_opts?: {
    split_test: string;
    pick_winner: string;
    winner_criteria: string;
    test_size: number;
    from_name_a: string;
    from_name_b: string;
    reply_email_a: string;
    reply_email_b: string;
    subject_a: string;
    subject_b: string;
    content_a?: string;
    content_b?: string;
  };
  social_card?: {
    image_url?: string;
    description?: string;
    title?: string;
  };
  delivery_status: {
    enabled: boolean;
    can_cancel: boolean;
    status: string;
  };
  content: {
    html?: string;
    plain?: string;
    archive_html?: string;
    url?: string;
    template?: {
      id: number;
      name: string;
    };
    variables?: Record<string, any>;
  };
  create_time: string;
  long_archive_url?: string;
  campaign_id?: string;
  parent_id?: string;
  workflow_id?: string;
  archive_url?: string;
  status: 'save' | 'paused' | 'schedule' | 'sending' | 'sent' | 'canceled';
  emails_sent?: number;
  send_time?: string;
  content_type: string;
  needs_block_refresh?: boolean;
  has_auto_split?: boolean;
  resumable?: boolean;
  ab_split_options?: any;
}

export interface MailchimpReport {
  id: string;
  campaign_title: string;
  type: string;
  emails_sent: number;
  abuse_reports: number;
  unsubscribed: number;
  send_time: string;
  bounces: {
    hard_bounces: number;
    soft_bounces: number;
    syntax_errors: number;
  };
  forwards: {
    forwards_count: number;
    forwards_opens: number;
  };
  opens: {
    opens_total: number;
    unique_opens: number;
    open_rate: number;
    last_open: string;
  };
  clicks: {
    clicks_total: number;
    unique_clicks: number;
    uniqueSubscriberClicks: number;
    click_rate: number;
    last_click: string;
  };
  facebook_likes?: {
    recipient_likes: number;
    unique_likes: number;
    facebook_likes: number;
  };
  list_stats: {
    sub_rate: number;
    unsub_rate: number;
    open_rate: number;
    click_rate: number;
  };
  timeseries?: Array<{
    timestamp: string;
    emails_sent: number;
    unique_opens: number;
    unique_clicks: number;
  }>;
  industry_stats?: {
    type: string;
    open_rate: number;
    click_rate: number;
    bounce_rate: number;
    unopen_rate: number;
    unsub_rate: number;
    abuse_rate: number;
  };
}

export interface MailchimpTemplate {
  id: number;
  name: string;
  category: string;
  layout: string;
  preview_image?: string;
  date_created: string;
  date_edited: string;
  created_by: string;
  edited_by: string;
  active: boolean;
  folder_id?: string;
  drag_and_drop: boolean;
  responsive: boolean;
  thumbnail?: string;
}

export class MailchimpService extends BaseIntegrationService {
  private readonly API_BASE = 'https://<server>.api.mailchimp.com/3.0';

  constructor(config: MailchimpConfig) {
    super(config);
    this.API_BASE = this.API_BASE.replace('<server>', config.server_prefix);
  }

  getProvider(): string {
    return 'mailchimp';
  }

  getSupportedCategories(): string[] {
    return ['email_marketing'];
  }

  getTemplate(): IntegrationTemplate {
    return {
      id: 'mailchimp-template',
      name: 'Mailchimp Email Marketing',
      description: 'Create and manage email campaigns, subscriber lists, and automation',
      provider: 'mailchimp',
      category: 'email_marketing',
      setup_instructions: [
        'Create Mailchimp account',
        'Generate API key from Account settings',
        'Find your server prefix (e.g., us1, us2)',
        'Create audience list and note its ID',
        'Configure campaign settings and templates'
      ],
      required_fields: ['api_key', 'server_prefix'],
      optional_fields: ['default_list_id', 'default_from_name', 'default_from_email', 'track_opens', 'track_clicks'],
      default_settings: {
        track_opens: true,
        track_clicks: true,
        double_opt_in: true,
        sync_tags: true,
        campaign_approval_required: false
      },
      webhook_events: [
        'campaign.sent',
        'campaign.delivered',
        'campaign.opened',
        'campaign.clicked',
        'subscriber.added',
        'subscriber.unsubscribed',
        'list.updated'
      ],
      rate_limits: {
        requests_per_hour: 3600,
        requests_per_day: 86400,
        current_usage: {
          hour: 0,
          day: 0,
          last_reset: {
            hour: new Date().toISOString(),
            day: new Date().toISOString()
          }
        }
      },
      is_recommended: true
    };
  }

  async testConnection(config: IntegrationConfig): Promise<{ success: boolean; error?: string }> {
    try {
      const mcConfig = config as MailchimpConfig;

      if (!mcConfig.api_key || !mcConfig.server_prefix) {
        return { success: false, error: 'API key and server prefix are required' };
      }

      // Test connection by fetching account info
      const response = await this.makeRequest(
        `${this.API_BASE.replace('<server>', mcConfig.server_prefix)}/`,
        {
          headers: {
            'Authorization': `apikey ${mcConfig.api_key}`
          }
        }
      );

      if (!response.success) {
        return { success: false, error: response.error };
      }

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Connection test failed'
      };
    }
  }

  async authenticate(authConfig: AuthConfig): Promise<{ success: boolean; access_token?: string; error?: string }> {
    // Mailchimp uses API key authentication, not OAuth
    try {
      const apiKey = authConfig.api_key;
      if (!apiKey) {
        return { success: false, error: 'API key is required' };
      }

      // Extract server prefix from API key (format: key-server_prefix)
      const match = apiKey.match(/^(.+)-([a-z0-9]+)$/);
      if (!match) {
        return { success: false, error: 'Invalid API key format' };
      }

      const serverPrefix = match[2];

      // Test the API key
      const testResult = await this.testConnection({
        ...authConfig,
        api_key: apiKey,
        server_prefix: serverPrefix
      } as any);

      if (!testResult.success) {
        return { success: false, error: testResult.error };
      }

      return { success: true, access_token: apiKey };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Authentication failed'
      };
    }
  }

  async refreshToken(refreshToken: string): Promise<{ success: boolean; access_token?: string; error?: string }> {
    // Mailchimp doesn't use token refresh - API keys are static
    return { success: true };
  }

  async syncData(config: IntegrationConfig, entityTypes?: string[]): Promise<SyncResult> {
    const mcConfig = config as MailchimpConfig;
    const results = {
      success: true,
      recordsProcessed: 0,
      recordsCreated: 0,
      recordsUpdated: 0,
      recordsDeleted: 0,
      details: {}
    };

    try {
      if (!mcConfig.is_enabled || mcConfig.status !== 'connected') {
        return { success: false, error: 'Integration is not enabled or connected' };
      }

      const apiBase = this.API_BASE.replace('<server>', mcConfig.server_prefix);

      // Sync campaigns
      if (!entityTypes || entityTypes.includes('campaigns')) {
        const campaignsResult = await this.syncCampaigns(apiBase, mcConfig.api_key);
        this.mergeResults(results, campaignsResult);
      }

      // Sync subscribers/audience members
      if (!entityTypes || entityTypes.includes('subscribers')) {
        const subscribersResult = await this.syncSubscribers(apiBase, mcConfig.api_key, mcConfig.default_list_id);
        this.mergeResults(results, subscribersResult);
      }

      // Sync campaign reports/metrics
      if (!entityTypes || entityTypes.includes('reports')) {
        const reportsResult = await this.syncReports(apiBase, mcConfig.api_key);
        this.mergeResults(results, reportsResult);
      }

      // Sync lists if multiple lists are configured
      if (!entityTypes || entityTypes.includes('lists')) {
        const listsResult = await this.syncLists(apiBase, mcConfig.api_key);
        this.mergeResults(results, listsResult);
      }

      await this.logEvent('sync_completed', {
        records_processed: results.recordsProcessed,
        records_created: results.recordsCreated,
        records_updated: results.recordsUpdated,
        records_deleted: results.recordsDeleted
      });

      return results;
    } catch (error) {
      await this.logEvent('sync_failed', {
        error: error instanceof Error ? error.message : 'Unknown error'
      }, 'error');

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Sync failed',
        ...results
      };
    }
  }

  async healthCheck(config: IntegrationConfig): Promise<HealthCheckResult> {
    try {
      const mcConfig = config as MailchimpConfig;

      // Check if integration is enabled
      if (!mcConfig.is_enabled) {
        return {
          status: 'degraded',
          issues: [{
            type: 'warning',
            message: 'Integration is disabled',
            suggested_action: 'Enable the integration in settings'
          }]
        };
      }

      // Test API connectivity
      const startTime = Date.now();
      const connectionTest = await this.testConnection(config);
      const responseTime = Date.now() - startTime;

      if (!connectionTest.success) {
        return {
          status: 'unhealthy',
          response_time_ms: responseTime,
          issues: [{
            type: 'error',
            message: 'API connection failed',
            details: connectionTest.error,
            suggested_action: 'Check API key and server prefix'
          }]
        };
      }

      // Check sync status
      const timeSinceLastSync = mcConfig.last_sync_at
        ? Date.now() - new Date(mcConfig.last_sync_at).getTime()
        : Infinity;

      const maxSyncAge = this.getSyncIntervalMs(mcConfig.sync_frequency) * 2;

      if (timeSinceLastSync > maxSyncAge) {
        return {
          status: 'degraded',
          response_time_ms: responseTime,
          issues: [{
            type: 'warning',
            message: 'Last sync was too long ago',
            suggested_action: 'Trigger manual sync'
          }]
        };
      }

      // Check error count
      if (mcConfig.error_count > 5) {
        return {
          status: 'degraded',
          response_time_ms: responseTime,
          issues: [{
            type: 'warning',
            message: 'High error count detected',
            details: `${mcConfig.error_count} errors recorded`,
            suggested_action: 'Review recent errors and check API limits'
          }]
        };
      }

      return {
        status: 'healthy',
        response_time_ms: responseTime,
        last_successful_sync: mcConfig.last_sync_at
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        issues: [{
          type: 'error',
          message: 'Health check failed',
          details: error instanceof Error ? error.message : 'Unknown error'
        }]
      };
    }
  }

  async handleWebhook(payload: WebhookPayload): Promise<{ success: boolean; processed: boolean; error?: string }> {
    try {
      // Verify webhook signature
      if (!this.verifyWebhookSignature(payload)) {
        return { success: false, processed: false, error: 'Invalid webhook signature' };
      }

      const webhookData = payload.data;

      switch (webhookData.type) {
        case 'campaign':
          await this.processCampaignWebhook(webhookData);
          break;

        case 'subscribe':
        case 'unsubscribe':
        case 'profile':
          await this.processSubscriberWebhook(webhookData);
          break;

        default:
          return { success: true, processed: false };
      }

      return { success: true, processed: true };
    } catch (error) {
      return {
        success: false,
        processed: false,
        error: error instanceof Error ? error.message : 'Webhook processing failed'
      };
    }
  }

  /**
   * Create email campaign
   */
  async createCampaign(campaign: {
    type: 'regular' | 'plaintext' | 'absplit' | 'rss' | 'variate';
    list_id: string;
    subject_line: string;
    from_name?: string;
    reply_to?: string;
    preview_text?: string;
    title?: string;
    content?: {
      html?: string;
      plain?: string;
      template_id?: number;
    };
    settings?: Partial<MailchimpCampaign['settings']>;
    tracking?: Partial<MailchimpCampaign['tracking']>;
  }): Promise<{ success: boolean; data?: MailchimpCampaign; error?: string }> {
    const mcConfig = this.config as MailchimpConfig;
    const apiBase = this.API_BASE.replace('<server>', mcConfig.server_prefix);

    try {
      const campaignData: any = {
        type: campaign.type,
        recipients: {
          list_id: campaign.list_id
        },
        settings: {
          subject_line: campaign.subject_line,
          from_name: campaign.from_name || mcConfig.default_from_name,
          reply_to: campaign.reply_to || mcConfig.default_from_email,
          preview_text: campaign.preview_text,
          title: campaign.title,
          ...campaign.settings
        },
        tracking: {
          opens: mcConfig.track_opens,
          html_clicks: mcConfig.track_clicks,
          text_clicks: mcConfig.track_clicks,
          ...campaign.tracking
        }
      };

      const response = await this.makeRequest(
        `${apiBase}/campaigns`,
        {
          method: 'POST',
          headers: {
            'Authorization': `apikey ${mcConfig.api_key}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(campaignData)
        }
      );

      if (response.success && response.data && campaign.content) {
        // Add content to the campaign
        const contentResponse = await this.makeRequest(
          `${apiBase}/campaigns/${response.data.id}/content`,
          {
            method: 'PUT',
            headers: {
              'Authorization': `apikey ${mcConfig.api_key}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(campaign.content)
          }
        );

        if (contentResponse.success) {
          response.data.content = contentResponse.data;
        }
      }

      return response;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create campaign'
      };
    }
  }

  /**
   * Send campaign
   */
  async sendCampaign(campaignId: string): Promise<{ success: boolean; error?: string }> {
    const mcConfig = this.config as MailchimpConfig;
    const apiBase = this.API_BASE.replace('<server>', mcConfig.server_prefix);

    try {
      const response = await this.makeRequest(
        `${apiBase}/campaigns/${campaignId}/actions/send`,
        {
          method: 'POST',
          headers: {
            'Authorization': `apikey ${mcConfig.api_key}`
          }
        }
      );

      return response;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to send campaign'
      };
    }
  }

  /**
   * Add subscriber to list
   */
  async addSubscriber(listId: string, subscriber: {
    email_address: string;
    status?: 'subscribed' | 'pending' | 'transactional';
    merge_fields?: Record<string, any>;
    tags?: string[];
    interests?: Record<string, boolean>;
    double_opt_in?: boolean;
  }): Promise<{ success: boolean; data?: MailchimpMember; error?: string }> {
    const mcConfig = this.config as MailchimpConfig;
    const apiBase = this.API_BASE.replace('<server>', mcConfig.server_prefix);

    try {
      const memberData: any = {
        email_address: subscriber.email_address,
        status: subscriber.status || (mcConfig.double_opt_in ? 'pending' : 'subscribed'),
        merge_fields: subscriber.merge_fields || {}
      };

      if (subscriber.interests) {
        memberData.interests = subscriber.interests;
      }

      if (subscriber.tags && subscriber.tags.length > 0) {
        memberData.tags = subscriber.tags;
      }

      const response = await this.makeRequest(
        `${apiBase}/lists/${listId}/members`,
        {
          method: 'POST',
          headers: {
            'Authorization': `apikey ${mcConfig.api_key}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(memberData)
        }
      );

      return response;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to add subscriber'
      };
    }
  }

  /**
   * Update subscriber
   */
  async updateSubscriber(listId: string, email: string, updates: {
    status?: 'subscribed' | 'unsubscribed' | 'cleaned' | 'pending';
    merge_fields?: Record<string, any>;
    tags?: string[];
    interests?: Record<string, boolean>;
  }): Promise<{ success: boolean; data?: MailchimpMember; error?: string }> {
    const mcConfig = this.config as MailchimpConfig;
    const apiBase = this.API_BASE.replace('<server>', mcConfig.server_prefix);

    try {
      const subscriberHash = this.md5(email.toLowerCase());

      const response = await this.makeRequest(
        `${apiBase}/lists/${listId}/members/${subscriberHash}`,
        {
          method: 'PATCH',
          headers: {
            'Authorization': `apikey ${mcConfig.api_key}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(updates)
        }
      );

      return response;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update subscriber'
      };
    }
  }

  /**
   * Get campaign report
   */
  async getCampaignReport(campaignId: string): Promise<{ success: boolean; data?: MailchimpReport; error?: string }> {
    const mcConfig = this.config as MailchimpConfig;
    const apiBase = this.API_BASE.replace('<server>', mcConfig.server_prefix);

    try {
      const response = await this.makeRequest(
        `${apiBase}/reports/${campaignId}`,
        {
          headers: {
            'Authorization': `apikey ${mcConfig.api_key}`
          }
        }
      );

      return response;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get campaign report'
      };
    }
  }

  /**
   * Sync campaigns from Mailchimp
   */
  private async syncCampaigns(apiBase: string, apiKey: string): Promise<SyncResult> {
    const result = {
      success: true,
      recordsProcessed: 0,
      recordsCreated: 0,
      recordsUpdated: 0,
      recordsDeleted: 0
    };

    try {
      const response = await this.makeRequest(
        `${apiBase}/campaigns?status=sent&count=100`,
        {
          headers: {
            'Authorization': `apikey ${apiKey}`
          }
        }
      );

      if (!response.success) {
        throw new Error(response.error);
      }

      const campaigns = response.data.campaigns || [];

      for (const mcCampaign of campaigns) {
        try {
          const localCampaign = await this.convertMailchimpCampaignToLocal(mcCampaign);
          const existingCampaign = await this.findLocalCampaign(mcCampaign.id);

          if (existingCampaign) {
            await this.updateLocalCampaign(existingCampaign.id, localCampaign);
            result.recordsUpdated++;
          } else {
            await this.createLocalCampaign(localCampaign);
            result.recordsCreated++;
          }

          result.recordsProcessed++;
        } catch (campaignError) {
          console.error('Failed to process campaign:', campaignError);
        }
      }

      return result;
    } catch (error) {
      return {
        ...result,
        success: false,
        error: error instanceof Error ? error.message : 'Failed to sync campaigns'
      };
    }
  }

  /**
   * Sync subscribers from Mailchimp
   */
  private async syncSubscribers(apiBase: string, apiKey: string, listId?: string): Promise<SyncResult> {
    const result = {
      success: true,
      recordsProcessed: 0,
      recordsCreated: 0,
      recordsUpdated: 0,
      recordsDeleted: 0
    };

    try {
      if (!listId) {
        return result;
      }

      // Get all members from the list
      let offset = 0;
      const count = 100;
      let hasMore = true;

      while (hasMore) {
        const response = await this.makeRequest(
          `${apiBase}/lists/${listId}/members?offset=${offset}&count=${count}`,
          {
            headers: {
              'Authorization': `apikey ${apiKey}`
            }
          }
        );

        if (!response.success) {
          throw new Error(response.error);
        }

        const members = response.data.members || [];

        for (const mcMember of members) {
          try {
            const localMember = await this.convertMailchimpMemberToLocal(mcMember);
            const existingMember = await this.findLocalSubscriber(mcMember.email_address);

            if (existingMember) {
              await this.updateLocalSubscriber(existingMember.id, localMember);
              result.recordsUpdated++;
            } else {
              await this.createLocalSubscriber(localMember);
              result.recordsCreated++;
            }

            result.recordsProcessed++;
          } catch (memberError) {
            console.error('Failed to process member:', memberError);
          }
        }

        hasMore = members.length === count;
        offset += count;
      }

      return result;
    } catch (error) {
      return {
        ...result,
        success: false,
        error: error instanceof Error ? error.message : 'Failed to sync subscribers'
      };
    }
  }

  /**
   * Sync campaign reports
   */
  private async syncReports(apiBase: string, apiKey: string): Promise<SyncResult> {
    const result = {
      success: true,
      recordsProcessed: 0,
      recordsCreated: 0,
      recordsUpdated: 0,
      recordsDeleted: 0
    };

    try {
      // Get sent campaigns to fetch reports for
      const campaignsResponse = await this.makeRequest(
        `${apiBase}/campaigns?status=sent&count=50`,
        {
          headers: {
            'Authorization': `apikey ${apiKey}`
          }
        }
      );

      if (campaignsResponse.success && campaignsResponse.data.campaigns) {
        for (const campaign of campaignsResponse.data.campaigns) {
          try {
            const reportResponse = await this.makeRequest(
              `${apiBase}/reports/${campaign.id}`,
              {
                headers: {
                  'Authorization': `apikey ${apiKey}`
                }
              }
            );

            if (reportResponse.success && reportResponse.data) {
              await this.saveCampaignMetrics(campaign.id, reportResponse.data);
              result.recordsUpdated++;
              result.recordsProcessed++;
            }
          } catch (reportError) {
            console.error('Failed to get report for campaign:', campaign.id, reportError);
          }
        }
      }

      return result;
    } catch (error) {
      return {
        ...result,
        success: false,
        error: error instanceof Error ? error.message : 'Failed to sync reports'
      };
    }
  }

  /**
   * Sync lists
   */
  private async syncLists(apiBase: string, apiKey: string): Promise<SyncResult> {
    const result = {
      success: true,
      recordsProcessed: 0,
      recordsCreated: 0,
      recordsUpdated: 0,
      recordsDeleted: 0
    };

    try {
      const response = await this.makeRequest(
        `${apiBase}/lists?count=100`,
        {
          headers: {
            'Authorization': `apikey ${apiKey}`
          }
        }
      );

      if (response.success && response.data.lists) {
        for (const list of response.data.lists) {
          await this.saveMailchimpList(list);
          result.recordsUpdated++;
          result.recordsProcessed++;
        }
      }

      return result;
    } catch (error) {
      return {
        ...result,
        success: false,
        error: error instanceof Error ? error.message : 'Failed to sync lists'
      };
    }
  }

  /**
   * Convert Mailchimp campaign to local format
   */
  private async convertMailchimpCampaignToLocal(mcCampaign: MailchimpCampaign): Promise<Partial<EmailCampaign>> {
    return {
      external_id: mcCampaign.id,
      name: mcCampaign.settings.title || mcCampaign.settings.subject_line,
      subject: mcCampaign.settings.subject_line,
      content: mcCampaign.content?.html || mcCampaign.content?.plain || '',
      list_ids: [mcCampaign.recipients.list_id],
      status: this.mapMailchimpStatus(mcCampaign.status),
      sent_at: mcCampaign.send_time,
      metrics: {
        recipients: mcCampaign.recipients.recipient_count,
        delivered: mcCampaign.emails_sent || 0,
        opened: 0, // Will be updated from reports
        clicked: 0, // Will be updated from reports
        bounced: 0,
        unsubscribed: 0,
        complained: 0,
        open_rate: 0,
        click_rate: 0,
        bounce_rate: 0
      },
      settings: {
        from_name: mcCampaign.settings.from_name,
        from_email: mcCampaign.settings.reply_to,
        track_opens: mcCampaign.tracking.opens,
        track_clicks: mcCampaign.tracking.html_clicks || mcCampaign.tracking.text_clicks
      },
      metadata: {
        campaign_type: mcCampaign.type,
        preview_text: mcCampaign.settings.preview_text,
        archive_url: mcCampaign.archive_url,
        create_time: mcCampaign.create_time,
        content_type: mcCampaign.content_type
      }
    };
  }

  /**
   * Convert Mailchimp member to local format
   */
  private async convertMailchimpMemberToLocal(mcMember: MailchimpMember): Promise<any> {
    return {
      email: mcMember.email_address,
      first_name: mcMember.merge_fields.FNAME,
      last_name: mcMember.merge_fields.LNAME,
      phone: mcMember.merge_fields.PHONE,
      status: mcMember.status,
      merge_fields: mcMember.merge_fields,
      interests: mcMember.interests,
      tags: mcMember.tags?.map(tag => tag.name) || [],
      stats: {
        avg_open_rate: mcMember.stats.avg_open_rate,
        avg_click_rate: mcMember.stats.avg_click_rate
      },
      location: mcMember.location,
      language: mcMember.language,
      source: mcMember.source,
      vip: mcMember.vip,
      metadata: {
        mailchimp_id: mcMember.id,
        unique_email_id: mcMember.unique_email_id,
        email_type: mcMember.email_type,
        member_rating: mcMember.member_rating,
        last_changed: mcMember.last_changed,
        list_id: mcMember.list_id
      }
    };
  }

  /**
   * Map Mailchimp campaign status to local format
   */
  private mapMailchimpStatus(mcStatus: string): EmailCampaign['status'] {
    switch (mcStatus) {
      case 'save':
        return 'draft';
      case 'paused':
        return 'cancelled';
      case 'schedule':
        return 'scheduled';
      case 'sending':
        return 'sending';
      case 'sent':
        return 'sent';
      case 'canceled':
        return 'cancelled';
      default:
        return 'draft';
    }
  }

  /**
   * Find local campaign by external ID
   */
  private async findLocalCampaign(externalId: string): Promise<any> {
    const { data, error } = await supabase
      .from('email_campaigns')
      .select('*')
      .eq('external_id', externalId)
      .single();

    return data;
  }

  /**
   * Create local campaign
   */
  private async createLocalCampaign(campaign: Partial<EmailCampaign>): Promise<void> {
    await supabase
      .from('email_campaigns')
      .insert({
        ...campaign,
        integration_id: this.config.id,
        platform: 'mailchimp',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
  }

  /**
   * Update local campaign
   */
  private async updateLocalCampaign(campaignId: string, campaign: Partial<EmailCampaign>): Promise<void> {
    await supabase
      .from('email_campaigns')
      .update({
        ...campaign,
        updated_at: new Date().toISOString()
      })
      .eq('id', campaignId);
  }

  /**
   * Find local subscriber by email
   */
  private async findLocalSubscriber(email: string): Promise<any> {
    const { data, error } = await supabase
      .from('email_subscribers')
      .select('*')
      .eq('email', email)
      .single();

    return data;
  }

  /**
   * Create local subscriber
   */
  private async createLocalSubscriber(subscriber: any): Promise<void> {
    await supabase
      .from('email_subscribers')
      .insert({
        ...subscriber,
        integration_id: this.config.id,
        platform: 'mailchimp',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
  }

  /**
   * Update local subscriber
   */
  private async updateLocalSubscriber(subscriberId: string, subscriber: any): Promise<void> {
    await supabase
      .from('email_subscribers')
      .update({
        ...subscriber,
        updated_at: new Date().toISOString()
      })
      .eq('id', subscriberId);
  }

  /**
   * Save campaign metrics
   */
  private async saveCampaignMetrics(campaignId: string, report: MailchimpReport): Promise<void> {
    const metrics: EmailCampaignMetrics = {
      recipients: report.emails_sent,
      delivered: report.emails_sent - (report.bounces.hard_bounces + report.bounces.soft_bounces),
      opened: report.opens.opens_total,
      clicked: report.clicks.clicks_total,
      bounced: report.bounces.hard_bounces + report.bounces.soft_bounces,
      unsubscribed: report.unsubscribed,
      complained: report.abuse_reports,
      open_rate: report.opens.open_rate,
      click_rate: report.clicks.click_rate,
      bounce_rate: (report.bounces.hard_bounces + report.bounces.soft_bounces) / report.emails_sent,
      collected_at: new Date().toISOString()
    };

    await supabase
      .from('email_campaigns')
      .update({
        metrics,
        last_sync_at: new Date().toISOString()
      })
      .eq('external_id', campaignId);
  }

  /**
   * Save Mailchimp list information
   */
  private async saveMailchimpList(list: MailchimpList): Promise<void> {
    await supabase
      .from('mailchimp_lists')
      .upsert({
        integration_id: this.config.id,
        list_id: list.id,
        name: list.name,
        member_count: list.stats.member_count,
        unsubscribe_count: list.stats.unsubscribe_count,
        cleaned_count: list.stats.cleaned_count,
        campaign_count: list.stats.campaign_count,
        contact_info: list.contact,
        campaign_defaults: list.campaign_defaults,
        last_sync_at: new Date().toISOString()
      });
  }

  /**
   * Process campaign webhook
   */
  private async processCampaignWebhook(webhookData: any): Promise<void> {
    await this.logEvent('campaign_webhook', {
      event: webhookData.type,
      data: webhookData
    });
  }

  /**
   * Process subscriber webhook
   */
  private async processSubscriberWebhook(webhookData: any): Promise<void> {
    await this.logEvent('subscriber_webhook', {
      event: webhookData.type,
      data: webhookData
    });
  }

  /**
   * Verify webhook signature
   */
  private verifyWebhookSignature(payload: WebhookPayload): boolean {
    // Implement signature verification for Mailchimp webhooks
    return true; // Placeholder
  }

  /**
   * MD5 hash for subscriber hash
   */
  private md5(str: string): string {
    // Simple MD5 implementation - in production use a proper crypto library
    // This is just a placeholder
    return btoa(str).replace(/[^a-zA-Z0-9]/g, '').toLowerCase().substring(0, 32);
  }

  /**
   * Merge sync results
   */
  private mergeResults(target: SyncResult, source: SyncResult): void {
    target.recordsProcessed = (target.recordsProcessed || 0) + (source.recordsProcessed || 0);
    target.recordsCreated = (target.recordsCreated || 0) + (source.recordsCreated || 0);
    target.recordsUpdated = (target.recordsUpdated || 0) + (source.recordsUpdated || 0);
    target.recordsDeleted = (target.recordsDeleted || 0) + (source.recordsDeleted || 0);

    if (source.details) {
      target.details = { ...target.details, ...source.details };
    }
  }
}

export default MailchimpService;