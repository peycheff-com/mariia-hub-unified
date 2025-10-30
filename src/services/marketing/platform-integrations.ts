import { supabase } from '@/integrations/supabase/client';
import { SocialPlatform, SocialPost, PostStatus } from '@/integrations/supabase/types/marketing.types';

// Platform-specific API configurations
interface PlatformCredentials {
  accessToken?: string;
  refreshToken?: string;
  apiVersion?: string;
  businessId?: string;
  appId?: string;
  appSecret?: string;
  webhookSecret?: string;
}

interface PostingResult {
  success: boolean;
  platformId?: string;
  platformUrl?: string;
  error?: string;
  metrics?: {
    reach?: number;
    impressions?: number;
    engagement?: number;
  };
}

interface MediaUpload {
  file: File | Blob;
  type: 'image' | 'video';
  caption?: string;
  altText?: string;
}

/**
 * Base class for social media platform integrations
 */
abstract class BasePlatformIntegration {
  protected credentials: PlatformCredentials;
  protected platform: SocialPlatform;

  constructor(platform: SocialPlatform, credentials: PlatformCredentials) {
    this.platform = platform;
    this.credentials = credentials;
  }

  abstract authenticate(): Promise<boolean>;
  abstract postContent(post: SocialPost, media?: MediaUpload[]): Promise<PostingResult>;
  abstract updatePost(postId: string, updates: Partial<SocialPost>): Promise<PostingResult>;
  abstract deletePost(postId: string): Promise<boolean>;
  abstract getAnalytics(postId: string): Promise<any>;
  abstract getOptimalDimensions(): { width: number; height: number };
}

/**
 * Instagram Graph API Integration
 */
class InstagramIntegration extends BasePlatformIntegration {
  private readonly API_VERSION = 'v18.0';
  private readonly BASE_URL = 'https://graph.facebook.com';

  async authenticate(): Promise<boolean> {
    try {
      const response = await fetch(
        `${this.BASE_URL}/${this.API_VERSION}/me?access_token=${this.credentials.accessToken}`
      );
      const data = await response.json();
      return !!data.id;
    } catch (error) {
      console.error('Instagram authentication failed:', error);
      return false;
    }
  }

  async postContent(post: SocialPost, media?: MediaUpload[]): Promise<PostingResult> {
    try {
      // Instagram requires a Business Account for API posting
      if (!this.credentials.businessId) {
        throw new Error('Instagram Business Account ID required for API posting');
      }

      let mediaId: string | null = null;

      // Handle media upload first
      if (media && media.length > 0) {
        mediaId = await this.uploadMedia(media[0]);
      }

      // Create container
      const containerData = {
        media_type: mediaId ? (media[0].type === 'video' ? 'REELS' : 'CAROUSEL') : 'IMAGE',
        caption: this.formatCaption(post),
        ...(mediaId && { media_id: mediaId })
      };

      const containerResponse = await fetch(
        `${this.BASE_URL}/${this.API_VERSION}/${this.credentials.businessId}/media`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            access_token: this.credentials.accessToken,
            ...containerData
          })
        }
      );

      const containerResult = await containerResponse.json();

      if (containerResult.error) {
        throw new Error(containerResult.error.message);
      }

      // Publish the container
      const publishResponse = await fetch(
        `${this.BASE_URL}/${this.API_VERSION}/${this.credentials.businessId}/media_publish`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            access_token: this.credentials.accessToken,
            creation_id: containerResult.id
          })
        }
      );

      const publishResult = await publishResponse.json();

      if (publishResult.error) {
        throw new Error(publishResult.error.message);
      }

      return {
        success: true,
        platformId: publishResult.id,
        platformUrl: `https://instagram.com/p/${publishResult.id}`,
        metrics: {
          reach: 0,
          impressions: 0,
          engagement: 0
        }
      };
    } catch (error) {
      console.error('Instagram posting failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  private async uploadMedia(media: MediaUpload): Promise<string> {
    const formData = new FormData();
    formData.append('access_token', this.credentials.accessToken!);
    formData.append('media_type', media.type.toUpperCase());

    if (media.type === 'video') {
      formData.append('video_url', URL.createObjectURL(media.file));
      formData.append('media_type', 'REELS');
    } else {
      formData.append('image_url', URL.createObjectURL(media.file));
    }

    const response = await fetch(
      `${this.BASE_URL}/${this.API_VERSION}/${this.credentials.businessId}/media`,
      { method: 'POST', body: formData }
    );

    const result = await response.json();

    if (result.error) {
      throw new Error(result.error.message);
    }

    // Wait for media processing
    await this.waitForMediaProcessing(result.id);
    return result.id;
  }

  private async waitForMediaProcessing(mediaId: string): Promise<void> {
    let attempts = 0;
    const maxAttempts = 30;

    while (attempts < maxAttempts) {
      const response = await fetch(
        `${this.BASE_URL}/${this.API_VERSION}/${mediaId}?fields=status&access_token=${this.credentials.accessToken}`
      );
      const result = await response.json();

      if (result.status === 'FINISHED') {
        return;
      }

      if (result.status === 'ERROR') {
        throw new Error('Media processing failed');
      }

      await new Promise(resolve => setTimeout(resolve, 2000));
      attempts++;
    }

    throw new Error('Media processing timeout');
  }

  async updatePost(postId: string, updates: Partial<SocialPost>): Promise<PostingResult> {
    // Instagram doesn't allow editing posts after publication
    return {
      success: false,
      error: 'Instagram posts cannot be edited after publication'
    };
  }

  async deletePost(postId: string): Promise<boolean> {
    try {
      const response = await fetch(
        `${this.BASE_URL}/${this.API_VERSION}/${postId}?access_token=${this.credentials.accessToken}`,
        { method: 'DELETE' }
      );

      const result = await response.json();
      return result.success;
    } catch (error) {
      console.error('Instagram delete failed:', error);
      return false;
    }
  }

  async getAnalytics(postId: string): Promise<any> {
    try {
      const response = await fetch(
        `${this.BASE_URL}/${this.API_VERSION}/${postId}/insights?metric=impressions,reach,engagement&access_token=${this.credentials.accessToken}`
      );

      const result = await response.json();
      return result.data || {};
    } catch (error) {
      console.error('Instagram analytics fetch failed:', error);
      return {};
    }
  }

  getOptimalDimensions(): { width: number; height: number } {
    return { width: 1080, height: 1080 }; // Square format for Instagram
  }

  private formatCaption(post: SocialPost): string {
    let caption = post.content;

    // Add hashtags
    if (post.hashtags && post.hashtags.length > 0) {
      caption += '\n\n' + post.hashtags.join(' ');
    }

    // Add mentions
    if (post.mentions && post.mentions.length > 0) {
      caption += '\n\n' + post.mentions.join(' ');
    }

    // Add call to action
    if (post.platform_specific_data?.call_to_action) {
      caption += '\n\n' + this.getCallToAction(post.platform_specific_data.call_to_action);
    }

    return caption;
  }

  private getCallToAction(cta: string): string {
    const actions = {
      book_now: '📅 Zarezerwuj wizytę: link w bio',
      learn_more: '📖 Dowiedz się więcej: link w bio',
      contact_us: '💬 Skontaktuj się z nami: link w bio',
      shop_now: '🛍️ Kup teraz: link w bio',
      sign_up: '✍️ Zapisz się: link w bio'
    };
    return actions[cta as keyof typeof actions] || '🔗 Link w bio';
  }
}

/**
 * Facebook Graph API Integration
 */
class FacebookIntegration extends BasePlatformIntegration {
  private readonly API_VERSION = 'v18.0';
  private readonly BASE_URL = 'https://graph.facebook.com';

  async authenticate(): Promise<boolean> {
    try {
      const response = await fetch(
        `${this.BASE_URL}/${this.API_VERSION}/me?access_token=${this.credentials.accessToken}`
      );
      const data = await response.json();
      return !!data.id;
    } catch (error) {
      console.error('Facebook authentication failed:', error);
      return false;
    }
  }

  async postContent(post: SocialPost, media?: MediaUpload[]): Promise<PostingResult> {
    try {
      const pageId = this.credentials.businessId;
      if (!pageId) {
        throw new Error('Facebook Page ID required');
      }

      let postData: any = {
        access_token: this.credentials.accessToken,
        message: this.formatCaption(post),
        published: true
      };

      // Handle media
      if (media && media.length > 0) {
        if (media.length === 1) {
          // Single media
          if (media[0].type === 'video') {
            postData.source = media[0].file;
          } else {
            postData.url = URL.createObjectURL(media[0].file);
            postData.caption = media[0].caption || '';
          }
        } else {
          // Multiple media - create album
          const attachedMedia = await Promise.all(
            media.map(m => this.uploadMedia(m))
          );
          postData.attached_media = attachedMedia.map(id => ({ media_fbid: id }));
        }
      }

      const endpoint = media && media.length > 1 && media[0].type === 'image'
        ? 'feed'
        : media?.[0]?.type === 'video'
        ? 'videos'
        : 'photos';

      const response = await fetch(
        `${this.BASE_URL}/${this.API_VERSION}/${pageId}/${endpoint}`,
        {
          method: 'POST',
          body: this.createFormData(postData)
        }
      );

      const result = await response.json();

      if (result.error) {
        throw new Error(result.error.message);
      }

      return {
        success: true,
        platformId: result.id,
        platformUrl: `https://facebook.com/${result.id}`,
        metrics: {
          reach: 0,
          impressions: 0,
          engagement: 0
        }
      };
    } catch (error) {
      console.error('Facebook posting failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  private async uploadMedia(media: MediaUpload): Promise<string> {
    const formData = new FormData();
    formData.append('access_token', this.credentials.accessToken!);
    formData.append('published', 'false');

    if (media.type === 'video') {
      formData.append('source', media.file);
    } else {
      formData.append('source', media.file);
      if (media.caption) {
        formData.append('caption', media.caption);
      }
    }

    const endpoint = media.type === 'video' ? 'videos' : 'photos';
    const response = await fetch(
      `${this.BASE_URL}/${this.API_VERSION}/${this.credentials.businessId}/${endpoint}`,
      { method: 'POST', body: formData }
    );

    const result = await response.json();

    if (result.error) {
      throw new Error(result.error.message);
    }

    return result.id;
  }

  private createFormData(data: any): FormData {
    const formData = new FormData();
    Object.entries(data).forEach(([key, value]) => {
      if (value instanceof File) {
        formData.append(key, value);
      } else {
        formData.append(key, String(value));
      }
    });
    return formData;
  }

  async updatePost(postId: string, updates: Partial<SocialPost>): Promise<PostingResult> {
    try {
      const updateData: any = {
        access_token: this.credentials.accessToken
      };

      if (updates.content) {
        updateData.message = updates.content;
      }

      const response = await fetch(
        `${this.BASE_URL}/${this.API_VERSION}/${postId}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updateData)
        }
      );

      const result = await response.json();

      if (result.error) {
        throw new Error(result.error.message);
      }

      return { success: true, platformId: postId };
    } catch (error) {
      console.error('Facebook update failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  async deletePost(postId: string): Promise<boolean> {
    try {
      const response = await fetch(
        `${this.BASE_URL}/${this.API_VERSION}/${postId}?access_token=${this.credentials.accessToken}`,
        { method: 'DELETE' }
      );

      const result = await response.json();
      return result.success;
    } catch (error) {
      console.error('Facebook delete failed:', error);
      return false;
    }
  }

  async getAnalytics(postId: string): Promise<any> {
    try {
      const response = await fetch(
        `${this.BASE_URL}/${this.API_VERSION}/${postId}/insights?metric=post_impressions,post_clicks,post_engaged_users&access_token=${this.credentials.accessToken}`
      );

      const result = await response.json();
      return result.data || {};
    } catch (error) {
      console.error('Facebook analytics fetch failed:', error);
      return {};
    }
  }

  getOptimalDimensions(): { width: number; height: number } {
    return { width: 1200, height: 630 }; // Facebook recommended dimensions
  }

  private formatCaption(post: SocialPost): string {
    let caption = post.content;

    // Add hashtags (integrated into content for Facebook)
    if (post.hashtags && post.hashtags.length > 0) {
      caption += '\n\n' + post.hashtags.slice(0, 5).join(' '); // Facebook recommends fewer hashtags
    }

    return caption;
  }
}

/**
 * LinkedIn API Integration
 */
class LinkedInIntegration extends BasePlatformIntegration {
  private readonly API_VERSION = 'v2';
  private readonly BASE_URL = 'https://api.linkedin.com';

  async authenticate(): Promise<boolean> {
    try {
      const response = await fetch(
        `${this.BASE_URL}/v2/people/~:(id)?access_token=${this.credentials.accessToken}`
      );
      const data = await response.json();
      return !!data.id;
    } catch (error) {
      console.error('LinkedIn authentication failed:', error);
      return false;
    }
  }

  async postContent(post: SocialPost, media?: MediaUpload[]): Promise<PostingResult> {
    try {
      // First, register media upload if media exists
      let mediaUrn: string | null = null;

      if (media && media.length > 0) {
        mediaUrn = await this.registerMediaUpload(media[0]);
      }

      // Create the post
      const postData = {
        author: `urn:li:person:${this.credentials.businessId}`,
        lifecycleState: 'PUBLISHED',
        specificContent: {
          'com.linkedin.ugc.ShareContent': {
            shareCommentary: {
              text: this.formatCaption(post)
            },
            shareMediaCategory: mediaUrn ? 'IMAGE' : 'NONE',
            ...(mediaUrn && { media: mediaUrn })
          }
        },
        visibility: {
          'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC'
        }
      };

      const response = await fetch(
        `${this.BASE_URL}/${this.API_VERSION}/ugcPosts`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.credentials.accessToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(postData)
        }
      );

      const result = await response.json();

      if (result.error) {
        throw new Error(result.error.message);
      }

      return {
        success: true,
        platformId: result.id,
        platformUrl: `https://linkedin.com/feed/update/${result.id}`,
        metrics: {
          reach: 0,
          impressions: 0,
          engagement: 0
        }
      };
    } catch (error) {
      console.error('LinkedIn posting failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  private async registerMediaUpload(media: MediaUpload): Promise<string> {
    try {
      // Register upload
      const registerResponse = await fetch(
        `${this.BASE_URL}/${this.API_VERSION}/assets?action=registerUpload`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.credentials.accessToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            registerUploadRequest: {
              owner: `urn:li:person:${this.credentials.businessId}`,
              recipes: ['urn:li:digitalmediaRecipe:feedshare-image'],
              serviceRelationships: [
                {
                  relationshipType: 'OWNER',
                  identifier: 'urn:li:userGeneratedContent'
                }
              ],
              supportedUploadMechanism: ['SYNCHRONOUS_UPLOAD']
            }
          })
        }
      );

      const registerResult = await registerResponse.json();

      if (registerResult.error) {
        throw new Error(registerResult.error.message);
      }

      // Upload the media
      const uploadResponse = await fetch(registerResult.value.uploadMechanism['com.linkedin.digitalmedia.uploading.MediaUploadHttpRequest'].uploadUrl, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${this.credentials.accessToken}`,
          'Content-Type': media.type === 'video' ? 'video/mp4' : 'image/jpeg'
        },
        body: media.file
      });

      if (!uploadResponse.ok) {
        throw new Error('Media upload failed');
      }

      return registerResult.value.asset;
    } catch (error) {
      console.error('LinkedIn media upload failed:', error);
      throw error;
    }
  }

  async updatePost(postId: string, updates: Partial<SocialPost>): Promise<PostingResult> {
    // LinkedIn doesn't support editing posts after publication
    return {
      success: false,
      error: 'LinkedIn posts cannot be edited after publication'
    };
  }

  async deletePost(postId: string): Promise<boolean> {
    try {
      const response = await fetch(
        `${this.BASE_URL}/${this.API_VERSION}/ugcPosts/${postId}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${this.credentials.accessToken}`
          }
        }
      );

      return response.status === 204;
    } catch (error) {
      console.error('LinkedIn delete failed:', error);
      return false;
    }
  }

  async getAnalytics(postId: string): Promise<any> {
    try {
      const response = await fetch(
        `${this.BASE_URL}/${this.API_VERSION}/socialActions/${postId}?projection=(*,likes(*),comments(*),shares(*))`,
        {
          headers: {
            'Authorization': `Bearer ${this.credentials.accessToken}`
          }
        }
      );

      const result = await response.json();
      return result || {};
    } catch (error) {
      console.error('LinkedIn analytics fetch failed:', error);
      return {};
    }
  }

  getOptimalDimensions(): { width: number; height: number } {
    return { width: 1200, height: 627 }; // LinkedIn recommended dimensions
  }

  private formatCaption(post: SocialPost): string {
    let caption = post.content;

    // LinkedIn posts should be professional and concise
    if (caption.length > 1300) {
      caption = caption.substring(0, 1297) + '...';
    }

    // Add minimal hashtags (LinkedIn prefers 2-3 relevant tags)
    if (post.hashtags && post.hashtags.length > 0) {
      caption += '\n\n' + post.hashtags.slice(0, 3).join(' ');
    }

    return caption;
  }
}

/**
 * TikTok API Integration (Note: TikTok's API is limited and requires special approval)
 */
class TikTokIntegration extends BasePlatformIntegration {
  private readonly BASE_URL = 'https://open-api.tiktok.com';

  async authenticate(): Promise<boolean> {
    try {
      const response = await fetch(
        `${this.BASE_URL}/oauth/access_token/`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            client_key: this.credentials.appId,
            client_secret: this.credentials.appSecret,
            grant_type: 'client_credentials'
          })
        }
      );

      const result = await response.json();
      return result.data?.access_token ? true : false;
    } catch (error) {
      console.error('TikTok authentication failed:', error);
      return false;
    }
  }

  async postContent(post: SocialPost, media?: MediaUpload[]): Promise<PostingResult> {
    // Note: TikTok's posting API is very restricted and requires special approval
    // This is a placeholder implementation
    return {
      success: false,
      error: 'TikTok API access is restricted. Manual posting required.'
    };
  }

  async updatePost(postId: string, updates: Partial<SocialPost>): Promise<PostingResult> {
    return {
      success: false,
      error: 'TikTok posts cannot be edited via API'
    };
  }

  async deletePost(postId: string): Promise<boolean> {
    return false;
  }

  async getAnalytics(postId: string): Promise<any> {
    return {};
  }

  getOptimalDimensions(): { width: number; height: number } {
    return { width: 1080, height: 1920 }; // Vertical video format
  }
}

/**
 * Factory for creating platform integrations
 */
export class PlatformIntegrationFactory {
  static createIntegration(
    platform: SocialPlatform,
    credentials: PlatformCredentials
  ): BasePlatformIntegration {
    switch (platform) {
      case 'instagram':
        return new InstagramIntegration(platform, credentials);
      case 'facebook':
        return new FacebookIntegration(platform, credentials);
      case 'linkedin':
        return new LinkedInIntegration(platform, credentials);
      case 'tiktok':
        return new TikTokIntegration(platform, credentials);
      default:
        throw new Error(`Platform ${platform} not supported`);
    }
  }
}

/**
 * Main service for managing platform integrations
 */
export class SocialMediaIntegrationsService {
  private integrations: Map<SocialPlatform, BasePlatformIntegration> = new Map();

  /**
   * Load all configured platform integrations
   */
  async loadIntegrations(): Promise<void> {
    try {
      const { data: integrations, error } = await supabase
        .from('social_integrations')
        .select('*')
        .eq('is_connected', true)
        .eq('is_active', true);

      if (error) throw error;

      for (const integration of integrations || []) {
        const credentials = {
          accessToken: integration.access_token,
          refreshToken: integration.refresh_token,
          businessId: integration.account_id,
          appId: integration.api_credentials?.app_id,
          appSecret: integration.api_credentials?.app_secret,
          webhookSecret: integration.webhook_secret
        };

        try {
          const platformIntegration = PlatformIntegrationFactory.createIntegration(
            integration.platform,
            credentials
          );

          // Test authentication
          const isAuthenticated = await platformIntegration.authenticate();
          if (isAuthenticated) {
            this.integrations.set(integration.platform, platformIntegration);
          }
        } catch (error) {
          console.error(`Failed to load ${integration.platform} integration:`, error);
        }
      }
    } catch (error) {
      console.error('Error loading integrations:', error);
    }
  }

  /**
   * Post content to specified platforms
   */
  async postToPlatforms(
    platforms: SocialPlatform[],
    post: SocialPost,
    media?: MediaUpload[]
  ): Promise<Record<SocialPlatform, PostingResult>> {
    const results: Record<SocialPlatform, PostingResult> = {} as any;

    for (const platform of platforms) {
      const integration = this.integrations.get(platform);

      if (integration) {
        try {
          const result = await integration.postContent(post, media);
          results[platform] = result;

          // Update post with platform-specific data
          if (result.success && result.platformId) {
            await supabase
              .from('social_posts')
              .update({
                status: PostStatus.PUBLISHED,
                posted_at: new Date().toISOString(),
                post_url: result.platformUrl,
                platform_specific_data: {
                  ...post.platform_specific_data,
                  platform_id: result.platformId,
                  posting_result: result
                }
              })
              .eq('id', post.id);
          }
        } catch (error) {
          results[platform] = {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
          };
        }
      } else {
        results[platform] = {
          success: false,
          error: `${platform} integration not configured`
        };
      }
    }

    return results;
  }

  /**
   * Get analytics for posts across platforms
   */
  async getPostAnalytics(postId: string, platforms: SocialPlatform[]): Promise<Record<SocialPlatform, any>> {
    const results: Record<SocialPlatform, any> = {} as any;

    // Get post details first
    const { data: post } = await supabase
      .from('social_posts')
      .select('*')
      .eq('id', postId)
      .single();

    if (!post) return results;

    for (const platform of platforms) {
      const integration = this.integrations.get(platform);

      if (integration && post.platform_specific_data?.platform_id) {
        try {
          const analytics = await integration.getAnalytics(post.platform_specific_data.platform_id);
          results[platform] = analytics;

          // Store analytics in database
          await supabase
            .from('content_performance')
            .upsert({
              content_id: postId,
              content_type: post.post_type,
              platform,
              date: new Date().toISOString().split('T')[0],
              metrics: analytics,
              impressions: analytics.impressions || 0,
              reach: analytics.reach || 0,
              engagements: analytics.engagement || 0,
              engagement_rate: analytics.engagement_rate || 0,
              clicks: analytics.clicks || 0,
              likes: analytics.likes || 0,
              comments: analytics.comments || 0,
              shares: analytics.shares || 0
            });
        } catch (error) {
          console.error(`Failed to get ${platform} analytics:`, error);
        }
      }
    }

    return results;
  }

  /**
   * Get optimal content dimensions for each platform
   */
  getOptimalDimensions(platform: SocialPlatform): { width: number; height: number } {
    const integration = this.integrations.get(platform);
    return integration ? integration.getOptimalDimensions() : { width: 1080, height: 1080 };
  }

  /**
   * Check if platform is connected and authenticated
   */
  isPlatformConnected(platform: SocialPlatform): boolean {
    return this.integrations.has(platform);
  }

  /**
   * Get list of connected platforms
   */
  getConnectedPlatforms(): SocialPlatform[] {
    return Array.from(this.integrations.keys());
  }

  /**
   * Refresh platform authentication tokens
   */
  async refreshPlatformTokens(platform: SocialPlatform): Promise<boolean> {
    const integration = this.integrations.get(platform);
    if (integration && 'refreshToken' in this.credentials) {
      try {
        return await integration.authenticate();
      } catch (error) {
        console.error(`Failed to refresh ${platform} token:`, error);
        return false;
      }
    }
    return false;
  }
}

// Export singleton instance
export const socialMediaIntegrations = new SocialMediaIntegrationsService();