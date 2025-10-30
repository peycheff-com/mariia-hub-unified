/**
 * Facebook & Instagram Business Integration Service
 * Handles social media management, content posting, and engagement tracking
 * Supports Facebook Pages and Instagram Business accounts
 */

import { supabase } from '@/integrations/supabase/client';
import { BaseIntegrationService, type SyncResult, type HealthCheckResult, type WebhookPayload } from '../base/base-integration.service';
import type {
  IntegrationConfig,
  SocialMediaPost,
  SocialMediaMetrics,
  DataMapping,
  IntegrationTemplate,
  AuthConfig
} from '@/types/integrations';

export interface FacebookInstagramConfig extends IntegrationConfig {
  platform: 'facebook' | 'instagram' | 'both';
  page_id?: string; // Facebook Page ID
  page_access_token?: string; // Facebook Page Access Token
  instagram_business_id?: string; // Instagram Business Account ID
  auto_post_stories?: boolean;
  track_engagement?: boolean;
  scheduling_timezone?: string;
  content_approval_required?: boolean;
  hashtag_tracking?: string[];
  mention_tracking?: boolean;
}

export interface FacebookPage {
  id: string;
  name: string;
  category: string;
  access_token: string;
  tasks: string[];
  can_post: boolean;
  can_reply: boolean;
  can_comment: boolean;
}

export interface InstagramBusinessAccount {
  id: string;
  username: string;
  account_type: string;
  media_count: number;
  followers_count: number;
  follows_count: number;
  biography: string;
  website?: string;
  ig_id: string;
}

export interface FacebookPost {
  id: string;
  created_time: string;
  message?: string;
  permalink_url: string;
  full_picture?: string;
  status_type: string;
  type: string;
  target: {
    id: string;
    url: string;
  };
  object_id?: string;
  likes: {
    data: Array<{
      id: string;
      name: string;
    }>;
    summary: {
      total_count: number;
    };
  };
  comments: {
    data: Array<{
      id: string;
      message: string;
      created_time: string;
      from: {
        id: string;
        name: string;
      };
    }>;
    summary: {
      total_count: number;
    };
  };
  shares: {
    count: number;
  };
  reactions: {
    data: Array<{
      id: string;
      type: string;
      name: string;
    }>;
    summary: {
      total_count: number;
    };
  };
}

export interface InstagramMedia {
  id: string;
  username: string;
  account_type: string;
  media_type: 'IMAGE' | 'VIDEO' | 'CAROUSEL_ALBUM' | 'REELS';
  media_url: string;
  permalink: string;
  timestamp: string;
  caption?: string;
  thumbnail_url?: string;
  like_count: number;
  comments_count: number;
  is_comment_enabled: boolean;
  children?: InstagramMedia[]; // For carousel albums
  video_duration?: number;
  video_view_count?: number;
}

export interface FacebookInsights {
  page_impressions: {
    values: Array<{
      end_time: string;
      value: number;
    }>;
  };
  page_engaged_users: {
    values: Array<{
      end_time: string;
      value: number;
    }>;
  };
  page_post_engagements: {
    values: Array<{
        end_time: string;
        value: number;
    }>;
  };
  page_fan_adds: {
    values: Array<{
      end_time: string;
      value: number;
    }>;
  };
  page_views_total: {
    values: Array<{
      end_time: string;
      value: number;
    }>;
  };
}

export interface InstagramInsights {
  impressions: number;
  reach: number;
  engagement_rate: number;
  saved: number;
  shares: number;
  comments: number;
  likes: number;
  profile_visits: number;
  website_clicks: number;
  follower_count: number;
  hashtag_performance?: Array<{
    hashtag: string;
    impressions: number;
    reach: number;
    likes: number;
    comments: number;
  }>;
}

export class FacebookInstagramService extends BaseIntegrationService {
  private readonly FACEBOOK_API_BASE = 'https://graph.facebook.com/v18.0';
  private readonly SCOPES = [
    'pages_read_engagement',
    'pages_manage_posts',
    'pages_manage_engagement',
    'instagram_basic',
    'instagram_content_publish',
    'instagram_manage_comments',
    'instagram_manage_insights'
  ];

  constructor(config: FacebookInstagramConfig) {
    super(config);
  }

  getProvider(): string {
    return 'facebook';
  }

  getSupportedCategories(): string[] {
    return ['social_media'];
  }

  getTemplate(): IntegrationTemplate {
    return {
      id: 'facebook-instagram-template',
      name: 'Facebook & Instagram Business Integration',
      description: 'Manage Facebook Page and Instagram Business account content and engagement',
      provider: 'facebook',
      category: 'social_media',
      setup_instructions: [
        'Create Facebook Developer App',
        'Add Facebook Login and Graph API permissions',
        'Get Page Access Token for your business page',
        'Connect Instagram Business account',
        'Configure content posting and tracking'
      ],
      required_fields: ['page_id', 'page_access_token'],
      optional_fields: ['instagram_business_id', 'auto_post_stories', 'track_engagement', 'hashtag_tracking'],
      default_settings: {
        auto_post_stories: false,
        track_engagement: true,
        scheduling_timezone: 'Europe/Warsaw',
        content_approval_required: true,
        mention_tracking: true
      },
      webhook_events: [
        'post.created',
        'post.updated',
        'comment.added',
        'mention.added',
        'story.viewed',
        'follower.gained',
        'follower.lost'
      ],
      rate_limits: {
        requests_per_hour: 4800,
        requests_per_day: 48000,
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
      const fbConfig = config as FacebookInstagramConfig;

      if (!fbConfig.page_access_token) {
        return { success: false, error: 'Page access token not found' };
      }

      // Test Facebook Page connection
      const pageResponse = await this.makeRequest(
        `${this.FACEBOOK_API_BASE}/${fbConfig.page_id}?fields=name,category,can_post`,
        {
          headers: {
            'Authorization': `Bearer ${fbConfig.page_access_token}`
          }
        }
      );

      if (!pageResponse.success) {
        return { success: false, error: `Facebook connection failed: ${pageResponse.error}` };
      }

      // Test Instagram connection if configured
      if (fbConfig.instagram_business_id) {
        const igResponse = await this.makeRequest(
          `${this.FACEBOOK_API_BASE}/${fbConfig.instagram_business_id}?fields=username,followers_count,media_count`,
          {
            headers: {
              'Authorization': `Bearer ${fbConfig.page_access_token}`
            }
          }
        );

        if (!igResponse.success) {
          return { success: false, error: `Instagram connection failed: ${igResponse.error}` };
        }
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
    try {
      // Exchange authorization code for user access token
      const response = await this.makeRequest(
        `https://graph.facebook.com/v18.0/oauth/access_token`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          },
          body: new URLSearchParams({
            client_id: authConfig.client_id!,
            client_secret: authConfig.client_secret!,
            code: authConfig.code!,
            redirect_uri: authConfig.redirect_uri!
          })
        }
      );

      if (response.success && response.data) {
        const tokenData = response.data as any;
        return {
          success: true,
          access_token: tokenData.access_token
        };
      }

      return { success: false, error: response.error };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Authentication failed'
      };
    }
  }

  async refreshToken(refreshToken: string): Promise<{ success: boolean; access_token?: string; error?: string }> {
    // Facebook access tokens typically don't expire for 60 days, but we can implement refresh logic
    return { success: true };
  }

  async syncData(config: IntegrationConfig, entityTypes?: string[]): Promise<SyncResult> {
    const fbConfig = config as FacebookInstagramConfig;
    const results = {
      success: true,
      recordsProcessed: 0,
      recordsCreated: 0,
      recordsUpdated: 0,
      recordsDeleted: 0,
      details: {}
    };

    try {
      if (!fbConfig.is_enabled || fbConfig.status !== 'connected') {
        return { success: false, error: 'Integration is not enabled or connected' };
      }

      // Sync Facebook posts
      if (fbConfig.platform === 'facebook' || fbConfig.platform === 'both') {
        if (!entityTypes || entityTypes.includes('posts')) {
          const fbPostsResult = await this.syncFacebookPosts(fbConfig);
          this.mergeResults(results, fbPostsResult);
        }

        if (!entityTypes || entityTypes.includes('metrics')) {
          const fbMetricsResult = await this.syncFacebookMetrics(fbConfig);
          this.mergeResults(results, fbMetricsResult);
        }
      }

      // Sync Instagram content
      if (fbConfig.instagram_business_id && (fbConfig.platform === 'instagram' || fbConfig.platform === 'both')) {
        if (!entityTypes || entityTypes.includes('media')) {
          const igMediaResult = await this.syncInstagramMedia(fbConfig);
          this.mergeResults(results, igMediaResult);
        }

        if (!entityTypes || entityTypes.includes('metrics')) {
          const igMetricsResult = await this.syncInstagramMetrics(fbConfig);
          this.mergeResults(results, igMetricsResult);
        }
      }

      // Sync mentions and hashtags if tracking is enabled
      if (fbConfig.mention_tracking && (!entityTypes || entityTypes.includes('mentions'))) {
        const mentionsResult = await this.syncMentions(fbConfig);
        this.mergeResults(results, mentionsResult);
      }

      if (fbConfig.hashtag_tracking && fbConfig.hashtag_tracking.length > 0 && (!entityTypes || entityTypes.includes('hashtags'))) {
        const hashtagsResult = await this.syncHashtags(fbConfig);
        this.mergeResults(results, hashtagsResult);
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
      const fbConfig = config as FacebookInstagramConfig;

      // Check if integration is enabled
      if (!fbConfig.is_enabled) {
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
            suggested_action: 'Check authentication credentials'
          }]
        };
      }

      // Check sync status
      const timeSinceLastSync = fbConfig.last_sync_at
        ? Date.now() - new Date(fbConfig.last_sync_at).getTime()
        : Infinity;

      const maxSyncAge = this.getSyncIntervalMs(fbConfig.sync_frequency) * 2;

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
      if (fbConfig.error_count > 5) {
        return {
          status: 'degraded',
          response_time_ms: responseTime,
          issues: [{
            type: 'warning',
            message: 'High error count detected',
            details: `${fbConfig.error_count} errors recorded`,
            suggested_action: 'Review recent errors and adjust settings'
          }]
        };
      }

      return {
        status: 'healthy',
        response_time_ms: responseTime,
        last_successful_sync: fbConfig.last_sync_at
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

      const eventData = payload.data;

      switch (payload.event) {
        case 'post.created':
        case 'post.updated':
          await this.processPostChange(eventData);
          break;

        case 'comment.added':
          await this.processCommentAdded(eventData);
          break;

        case 'mention.added':
          await this.processMentionAdded(eventData);
          break;

        case 'story.viewed':
          await this.processStoryViewed(eventData);
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
   * Create Facebook post
   */
  async createFacebookPost(post: {
    message?: string;
    link?: string;
    photo_url?: string;
    video_url?: string;
    published?: boolean;
    scheduled_publish_time?: string;
  }): Promise<{ success: boolean; data?: any; error?: string }> {
    const fbConfig = this.config as FacebookInstagramConfig;

    try {
      const postData: any = {};

      if (post.message) postData.message = post.message;
      if (post.link) postData.link = post.link;
      if (post.published !== undefined) postData.published = post.published;
      if (post.scheduled_publish_time) postData.scheduled_publish_time = post.scheduled_publish_time;

      let endpoint = `${this.FACEBOOK_API_BASE}/${fbConfig.page_id}/feed`;

      // Handle photo posts
      if (post.photo_url) {
        endpoint = `${this.FACEBOOK_API_BASE}/${fbConfig.page_id}/photos`;
        postData.url = post.photo_url;
      }

      // Handle video posts
      if (post.video_url) {
        endpoint = `${this.FACEBOOK_API_BASE}/${fbConfig.page_id}/videos`;
        postData.file_url = post.video_url;
      }

      const response = await this.makeRequest(
        endpoint,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${fbConfig.page_access_token}`
          },
          body: JSON.stringify(postData)
        }
      );

      return response;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create Facebook post'
      };
    }
  }

  /**
   * Create Instagram media post
   */
  async createInstagramPost(media: {
    image_url?: string;
    video_url?: string;
    caption?: string;
    media_type: 'IMAGE' | 'VIDEO' | 'REELS' | 'CAROUSEL';
    children?: string[]; // For carousel
    location_tag?: string;
    user_tags?: Array<{ x: number; y: number; username: string }>;
  }): Promise<{ success: boolean; data?: any; error?: string }> {
    const fbConfig = this.config as FacebookInstagramConfig;

    try {
      if (!fbConfig.instagram_business_id) {
        return { success: false, error: 'Instagram Business account not configured' };
      }

      // Create media container first
      const containerData: any = {
        media_type: media.media_type,
        caption: media.caption
      };

      if (media.image_url) {
        containerData.image_url = media.image_url;
      } else if (media.video_url) {
        containerData.video_url = media.video_url;
      }

      if (media.children && media.children.length > 0) {
        containerData.children = media.children;
      }

      if (media.location_tag) {
        containerData.location_tag = media.location_tag;
      }

      if (media.user_tags) {
        containerData.user_tags = media.user_tags;
      }

      const containerResponse = await this.makeRequest(
        `${this.FACEBOOK_API_BASE}/${fbConfig.instagram_business_id}/media`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${fbConfig.page_access_token}`
          },
          body: JSON.stringify(containerData)
        }
      );

      if (!containerResponse.success) {
        return containerResponse;
      }

      const containerId = containerResponse.data.id;

      // Publish the media
      const publishResponse = await this.makeRequest(
        `${this.FACEBOOK_API_BASE}/${fbConfig.instagram_business_id}/media_publish`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${fbConfig.page_access_token}`
          },
          body: JSON.stringify({
            creation_id: containerId
          })
        }
      );

      return publishResponse;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create Instagram post'
      };
    }
  }

  /**
   * Sync Facebook posts
   */
  private async syncFacebookPosts(config: FacebookInstagramConfig): Promise<SyncResult> {
    const result = {
      success: true,
      recordsProcessed: 0,
      recordsCreated: 0,
      recordsUpdated: 0,
      recordsDeleted: 0
    };

    try {
      const response = await this.makeRequest(
        `${this.FACEBOOK_API_BASE}/${config.page_id}/posts?fields=message,permalink_url,created_time,type,status_type,likes.summary(true),comments.summary(true),shares&limit=100`,
        {
          headers: {
            'Authorization': `Bearer ${config.page_access_token}`
          }
        }
      );

      if (!response.success) {
        throw new Error(response.error);
      }

      const facebookPosts = response.data.data || [];

      for (const fbPost of facebookPosts) {
        try {
          const localPost = await this.convertFacebookPostToLocal(fbPost);
          const existingPost = await this.findLocalPost(fbPost.id, 'facebook');

          if (existingPost) {
            await this.updateLocalPost(existingPost.id, localPost);
            result.recordsUpdated++;
          } else {
            await this.createLocalPost(localPost);
            result.recordsCreated++;
          }

          result.recordsProcessed++;
        } catch (postError) {
          console.error('Failed to process Facebook post:', postError);
        }
      }

      return result;
    } catch (error) {
      return {
        ...result,
        success: false,
        error: error instanceof Error ? error.message : 'Failed to sync Facebook posts'
      };
    }
  }

  /**
   * Sync Instagram media
   */
  private async syncInstagramMedia(config: FacebookInstagramConfig): Promise<SyncResult> {
    const result = {
      success: true,
      recordsProcessed: 0,
      recordsCreated: 0,
      recordsUpdated: 0,
      recordsDeleted: 0
    };

    try {
      if (!config.instagram_business_id) {
        return result;
      }

      const response = await this.makeRequest(
        `${this.FACEBOOK_API_BASE}/${config.instagram_business_id}/media?fields=media_type,media_url,permalink,caption,like_count,comments_count,timestamp&limit=100`,
        {
          headers: {
            'Authorization': `Bearer ${config.page_access_token}`
          }
        }
      );

      if (!response.success) {
        throw new Error(response.error);
      }

      const instagramMedia = response.data.data || [];

      for (const igMedia of instagramMedia) {
        try {
          const localPost = await this.convertInstagramMediaToLocal(igMedia);
          const existingPost = await this.findLocalPost(igMedia.id, 'instagram');

          if (existingPost) {
            await this.updateLocalPost(existingPost.id, localPost);
            result.recordsUpdated++;
          } else {
            await this.createLocalPost(localPost);
            result.recordsCreated++;
          }

          result.recordsProcessed++;
        } catch (mediaError) {
          console.error('Failed to process Instagram media:', mediaError);
        }
      }

      return result;
    } catch (error) {
      return {
        ...result,
        success: false,
        error: error instanceof Error ? error.message : 'Failed to sync Instagram media'
      };
    }
  }

  /**
   * Sync Facebook metrics
   */
  private async syncFacebookMetrics(config: FacebookInstagramConfig): Promise<SyncResult> {
    const result = {
      success: true,
      recordsProcessed: 0,
      recordsCreated: 0,
      recordsUpdated: 0,
      recordsDeleted: 0
    };

    try {
      const insightsResponse = await this.makeRequest(
        `${this.FACEBOOK_API_BASE}/${config.page_id}/insights?metric=page_impressions,page_engaged_users,page_post_engagements,page_fan_adds,page_views_total&period=day`,
        {
          headers: {
            'Authorization': `Bearer ${config.page_access_token}`
          }
        }
      );

      if (insightsResponse.success && insightsResponse.data) {
        await this.saveMetrics(config.id, 'facebook', insightsResponse.data);
        result.recordsUpdated++;
      }

      return result;
    } catch (error) {
      return {
        ...result,
        success: false,
        error: error instanceof Error ? error.message : 'Failed to sync Facebook metrics'
      };
    }
  }

  /**
   * Sync Instagram metrics
   */
  private async syncInstagramMetrics(config: FacebookInstagramConfig): Promise<SyncResult> {
    const result = {
      success: true,
      recordsProcessed: 0,
      recordsCreated: 0,
      recordsUpdated: 0,
      recordsDeleted: 0
    };

    try {
      if (!config.instagram_business_id) {
        return result;
      }

      const insightsResponse = await this.makeRequest(
        `${this.FACEBOOK_API_BASE}/${config.instagram_business_id}/insights?metric=impressions,reach,likes,comments,shares,saved&period=day`,
        {
          headers: {
            'Authorization': `Bearer ${config.page_access_token}`
          }
        }
      );

      if (insightsResponse.success && insightsResponse.data) {
        await this.saveMetrics(config.id, 'instagram', insightsResponse.data);
        result.recordsUpdated++;
      }

      return result;
    } catch (error) {
      return {
        ...result,
        success: false,
        error: error instanceof Error ? error.message : 'Failed to sync Instagram metrics'
      };
    }
  }

  /**
   * Sync mentions
   */
  private async syncMentions(config: FacebookInstagramConfig): Promise<SyncResult> {
    const result = {
      success: true,
      recordsProcessed: 0,
      recordsCreated: 0,
      recordsUpdated: 0,
      recordsDeleted: 0
    };

    // Implementation for tracking mentions
    // This would require additional Graph API endpoints

    return result;
  }

  /**
   * Sync hashtags
   */
  private async syncHashtags(config: FacebookInstagramConfig): Promise<SyncResult> {
    const result = {
      success: true,
      recordsProcessed: 0,
      recordsCreated: 0,
      recordsUpdated: 0,
      recordsDeleted: 0
    };

    // Implementation for tracking hashtag performance
    // This would require Instagram Basic Display API or Graph API

    return result;
  }

  /**
   * Convert Facebook post to local format
   */
  private async convertFacebookPostToLocal(fbPost: FacebookPost): Promise<Partial<SocialMediaPost>> {
    return {
      external_id: fbPost.id,
      content: fbPost.message || '',
      media_urls: fbPost.full_picture ? [fbPost.full_picture] : [],
      post_type: this.mapFacebookPostType(fbPost.type),
      status: 'published',
      published_at: fbPost.created_time,
      metrics: {
        likes: fbPost.likes?.summary?.total_count || 0,
        comments: fbPost.comments?.summary?.total_count || 0,
        shares: fbPost.shares?.count || 0,
        reactions: fbPost.reactions?.summary?.total_count || 0
      },
      metadata: {
        platform: 'facebook',
        permalink_url: fbPost.permalink_url,
        status_type: fbPost.status_type,
        object_id: fbPost.object_id
      }
    };
  }

  /**
   * Convert Instagram media to local format
   */
  private async convertInstagramMediaToLocal(igMedia: InstagramMedia): Promise<Partial<SocialMediaPost>> {
    return {
      external_id: igMedia.id,
      content: igMedia.caption || '',
      media_urls: [igMedia.media_url],
      post_type: this.mapInstagramMediaType(igMedia.media_type),
      status: 'published',
      published_at: igMedia.timestamp,
      metrics: {
        likes: igMedia.like_count,
        comments: igMedia.comments_count,
        views: igMedia.video_view_count
      },
      metadata: {
        platform: 'instagram',
        permalink: igMedia.permalink,
        thumbnail_url: igMedia.thumbnail_url,
        video_duration: igMedia.video_duration,
        children_count: igMedia.children?.length || 0
      }
    };
  }

  /**
   * Map Facebook post type to local format
   */
  private mapFacebookPostType(fbType: string): 'text' | 'image' | 'video' | 'story' | 'reel' {
    switch (fbType.toLowerCase()) {
      case 'photo':
        return 'image';
      case 'video':
        return 'video';
      default:
        return 'text';
    }
  }

  /**
   * Map Instagram media type to local format
   */
  private mapInstagramMediaType(igType: string): 'text' | 'image' | 'video' | 'story' | 'reel' {
    switch (igType) {
      case 'IMAGE':
        return 'image';
      case 'VIDEO':
        return 'video';
      case 'REELS':
        return 'reel';
      default:
        return 'image';
    }
  }

  /**
   * Find local post by external ID
   */
  private async findLocalPost(externalId: string, platform: string): Promise<any> {
    const { data, error } = await supabase
      .from('social_media_posts')
      .select('*')
      .eq('external_id', externalId)
      .eq('platform', platform)
      .single();

    return data;
  }

  /**
   * Create local post
   */
  private async createLocalPost(post: Partial<SocialMediaPost>): Promise<void> {
    await supabase
      .from('social_media_posts')
      .insert({
        ...post,
        integration_id: this.config.id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
  }

  /**
   * Update local post
   */
  private async updateLocalPost(postId: string, post: Partial<SocialMediaPost>): Promise<void> {
    await supabase
      .from('social_media_posts')
      .update({
        ...post,
        updated_at: new Date().toISOString()
      })
      .eq('id', postId);
  }

  /**
   * Save metrics
   */
  private async saveMetrics(integrationId: string, platform: string, metricsData: any): Promise<void> {
    const metrics = {
      date: new Date().toISOString().split('T')[0],
      platform,
      metrics: metricsData,
      collected_at: new Date().toISOString()
    };

    await supabase
      .from('social_media_metrics')
      .upsert({
        integration_id,
        ...metrics
      });
  }

  /**
   * Verify webhook signature
   */
  private verifyWebhookSignature(payload: WebhookPayload): boolean {
    // Implement signature verification for Facebook webhooks
    return true; // Placeholder
  }

  /**
   * Process post change webhook
   */
  private async processPostChange(eventData: any): Promise<void> {
    await this.logEvent('post_webhook', {
      event: 'post_change',
      data: eventData
    });
  }

  /**
   * Process comment added webhook
   */
  private async processCommentAdded(eventData: any): Promise<void> {
    await this.logEvent('comment_webhook', {
      event: 'comment_added',
      data: eventData
    });
  }

  /**
   * Process mention added webhook
   */
  private async processMentionAdded(eventData: any): Promise<void> {
    await this.logEvent('mention_webhook', {
      event: 'mention_added',
      data: eventData
    });
  }

  /**
   * Process story viewed webhook
   */
  private async processStoryViewed(eventData: any): Promise<void> {
    await this.logEvent('story_webhook', {
      event: 'story_viewed',
      data: eventData
    });
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

export default FacebookInstagramService;