import { supabase } from '@/integrations/supabase/client';
import {
  ClientTestimonial,
  BeforeAfterGallery,
  PlatformReview,
  TestimonialStatus,
  SocialPlatform,
  ContentPerformance
} from '@/integrations/supabase/types/marketing.types';

// Consent management types
interface ConsentRecord {
  testimonial_id: string;
  consent_type: 'marketing' | 'social_media' | 'website' | 'photography';
  granted: boolean;
  granted_date?: string;
  granted_by?: string;
  expiry_date?: string;
  restricted_platforms?: SocialPlatform[];
  usage_restrictions?: string;
  withdrawal_date?: string;
  withdrawal_reason?: string;
}

// Review aggregation configuration
interface ReviewAggregationConfig {
  platforms: {
    google: {
      enabled: boolean;
      api_key?: string;
      place_id?: string;
      sync_frequency: 'hourly' | 'daily' | 'weekly';
    };
    facebook: {
      enabled: boolean;
      page_id?: string;
      access_token?: string;
      sync_frequency: 'hourly' | 'daily' | 'weekly';
    };
    booksy: {
      enabled: boolean;
      salon_id?: string;
      api_key?: string;
      sync_frequency: 'daily' | 'weekly';
    };
    local_favorites: {
      enabled: boolean;
      business_id?: string;
      sync_frequency: 'daily' | 'weekly';
    };
  };
  sentiment_analysis: boolean;
  auto_publish_threshold: number; // minimum rating to auto-publish
  review_response_templates: Record<string, string>;
}

// Content curation rules
interface CurationRule {
  id: string;
  name: string;
  description: string;
  criteria: {
    min_rating?: number;
    content_length?: { min: number; max: number };
    contains_images?: boolean;
    contains_video?: boolean;
    keywords_required?: string[];
    keywords_excluded?: string[];
    sentiment_score_min?: number;
  };
  actions: {
    auto_approve: boolean;
    featured_priority?: number;
    social_sharing: SocialPlatform[];
    email_inclusion: boolean;
    website_display: boolean;
  };
  is_active: boolean;
}

// Social proof widgets configuration
interface SocialProofWidget {
  id: string;
  type: 'testimonials' | 'reviews' | 'before_after' | 'live_counter' | 'recent_activity';
  title: string;
  display_options: {
    layout: 'grid' | 'carousel' | 'list' | 'masonry';
    items_per_page: number;
    auto_play: boolean;
    show_rating: boolean;
    show_date: boolean;
    show_client_name: boolean;
    show_service: boolean;
    animation_style: 'fade' | 'slide' | 'scale';
  };
  filtering: {
    services?: string[];
    min_rating?: number;
    date_range?: { start: string; end: string };
    verified_only?: boolean;
    with_photos_only?: boolean;
  };
  styling: {
    theme: 'light' | 'dark' | 'brand';
    accent_color?: string;
    border_radius?: string;
    shadow?: boolean;
  };
  platforms: SocialPlatform[];
  is_active: boolean;
}

interface UGCCollectionRequest {
  client_id: string;
  service_id: string;
  booking_id?: string;
  collection_type: 'testimonial' | 'before_after' | 'both';
  automated_reminders: boolean;
  reminder_schedule: number[]; // hours after booking
  consent_required: boolean;
  incentive_offered?: {
    type: 'discount' | 'free_service' | 'product';
    value: number;
    description: string;
  };
}

export class SocialProofManagementService {
  private aggregationConfig: ReviewAggregationConfig | null = null;
  private curationRules: CurationRule[] = [];

  constructor() {
    this.loadConfiguration();
  }

  /**
   * Load social proof configuration
   */
  private async loadConfiguration(): Promise<void> {
    try {
      // Load aggregation config
      const { data: config } = await supabase
        .from('marketing_settings')
        .select('setting_value')
        .eq('setting_key', 'review_aggregation_config')
        .single();

      if (config?.setting_value) {
        this.aggregationConfig = config.setting_value as ReviewAggregationConfig;
      } else {
        this.aggregationConfig = this.getDefaultAggregationConfig();
        await this.saveAggregationConfig(this.aggregationConfig);
      }

      // Load curation rules
      const { data: rules } = await supabase
        .from('content_curation_rules')
        .select('*')
        .eq('is_active', true);

      this.curationRules = rules || [];
    } catch (error) {
      console.error('Error loading social proof configuration:', error);
    }
  }

  /**
   * Get default review aggregation configuration
   */
  private getDefaultAggregationConfig(): ReviewAggregationConfig {
    return {
      platforms: {
        google: {
          enabled: false,
          sync_frequency: 'daily'
        },
        facebook: {
          enabled: true,
          sync_frequency: 'daily'
        },
        booksy: {
          enabled: true,
          sync_frequency: 'daily'
        },
        local_favorites: {
          enabled: false,
          sync_frequency: 'weekly'
        }
      },
      sentiment_analysis: true,
      auto_publish_threshold: 4,
      review_response_templates: {
        positive: 'Dziękujemy za wspaniałą opinię! Cieszymy się, że jesteś zadowolona z naszych usług.',
        neutral: 'Dziękujemy za opinię. Twoje uwagi są dla nas bardzo cenne i pomogą nam się rozwijać.',
        negative: 'Przykro nam, że Twoje doświadczenie nie spełniło oczekiwań. Chcielibyśmy poznać szczegóły, aby poprawić nasze usługi.'
      }
    };
  }

  /**
   * Save aggregation configuration
   */
  private async saveAggregationConfig(config: ReviewAggregationConfig): Promise<void> {
    try {
      await supabase
        .from('marketing_settings')
        .upsert({
          setting_key: 'review_aggregation_config',
          setting_value: config,
          description: 'Review aggregation configuration',
          category: 'social_proof'
        });
    } catch (error) {
      console.error('Error saving aggregation config:', error);
    }
  }

  /**
   * Create testimonial collection request
   */
  async createTestimonialCollection(request: UGCCollectionRequest): Promise<string> {
    try {
      // Create testimonial record
      const { data: testimonial, error } = await supabase
        .from('client_testimonials')
        .insert({
          client_id: request.client_id,
          service_id: request.service_id,
          booking_id: request.booking_id,
          status: TestimonialStatus.PENDING,
          consent_marketing: request.consent_required,
          consent_social_media: request.consent_required,
          consent_website: request.consent_required
        })
        .select()
        .single();

      if (error) throw error;

      // Schedule automated reminders if enabled
      if (request.automated_reminders && request.reminder_schedule.length > 0) {
        await this.scheduleReminderEmails(testimonial.id, request.reminder_schedule);
      }

      // Send initial collection email
      await this.sendTestimonialRequestEmail(testimonial.id, request.incentive_offered);

      return testimonial.id;
    } catch (error) {
      console.error('Error creating testimonial collection:', error);
      throw error;
    }
  }

  /**
   * Submit testimonial from client
   */
  async submitTestimonial(
    testimonialId: string,
    data: {
      rating: number;
      testimonial?: string;
      video_url?: string;
      before_photo_url?: string;
      after_photo_url?: string;
      additional_photos?: string[];
      consent_marketing: boolean;
      consent_social_media: boolean;
      consent_website: boolean;
      display_name?: string;
      client_age?: number;
      client_location?: string;
    }
  ): Promise<ClientTestimonial> {
    try {
      // Analyze sentiment if enabled
      let sentimentScore: number | undefined;
      if (this.aggregationConfig?.sentiment_analysis && data.testimonial) {
        sentimentScore = await this.analyzeSentiment(data.testimonial);
      }

      // Determine if should be auto-approved based on curation rules
      const shouldAutoApprove = await this.evaluateCurationRules({
        ...data,
        sentiment_score: sentimentScore
      });

      // Update testimonial
      const { data: updated, error } = await supabase
        .from('client_testimonials')
        .update({
          ...data,
          sentiment_score: sentimentScore,
          status: shouldAutoApprove ? TestimonialStatus.APPROVED : TestimonialStatus.PENDING,
          updated_at: new Date().toISOString()
        })
        .eq('id', testimonialId)
        .select()
        .single();

      if (error) throw error;

      // If auto-approved, schedule social media posts
      if (shouldAutoApprove) {
        await this.scheduleTestimonialSocialPosts(updated);
      }

      // Send confirmation email
      await this.sendTestimonialConfirmationEmail(updated);

      return updated;
    } catch (error) {
      console.error('Error submitting testimonial:', error);
      throw error;
    }
  }

  /**
   * Upload before/after photos with consent management
   */
  async uploadBeforeAfterPhotos(
    data: {
      client_id?: string;
      client_name?: string;
      service_id: string;
      treatment_date: string;
      before_photos: string[];
      after_photos: string[];
      description?: string;
      treatment_details?: string;
      recovery_time?: string;
      client_testimonial?: string;
      consent_photography: boolean;
      consent_marketing: boolean;
      consent_social_media: boolean;
      consent_website: boolean;
      consent_expiry_date?: string;
      usage_restrictions?: string;
      gallery_category?: string;
      tags?: string[];
    }
  ): Promise<BeforeAfterGallery> {
    try {
      // Validate consent
      if (!data.consent_photography) {
        throw new Error('Photography consent is required');
      }

      // Analyze photos for appropriateness
      const photoAnalysis = await this.analyzePhotos(data.before_photos, data.after_photos);
      if (!photoAnalysis.appropriate) {
        throw new Error('Photos do not meet quality standards');
      }

      // Generate auto-description if not provided
      if (!data.description) {
        data.description = await this.generateBeforeAfterDescription(data.service_id, data.before_photos, data.after_photos);
      }

      // Insert before/after record
      const { data: gallery, error } = await supabase
        .from('before_after_gallery')
        .insert({
          ...data,
          is_published: false, // Requires admin approval
          tags: data.tags || this.generateTags(data.service_id, data.description)
        })
        .select()
        .single();

      if (error) throw error;

      // Schedule admin review notification
      await this.notifyAdminForReview(gallery.id, 'before_after');

      return gallery;
    } catch (error) {
      console.error('Error uploading before/after photos:', error);
      throw error;
    }
  }

  /**
   * Aggregate reviews from external platforms
   */
  async aggregatePlatformReviews(): Promise<void> {
    if (!this.aggregationConfig) return;

    const platforms = Object.entries(this.aggregationConfig.platforms)
      .filter(([_, config]) => config.enabled);

    for (const [platform, config] of platforms) {
      try {
        await this.aggregateReviewsFromPlatform(platform as SocialPlatform, config);
      } catch (error) {
        console.error(`Error aggregating reviews from ${platform}:`, error);
      }
    }
  }

  /**
   * Aggregate reviews from specific platform
   */
  private async aggregateReviewsFromPlatform(
    platform: SocialPlatform,
    config: any
  ): Promise<void> {
    switch (platform) {
      case 'google':
        await this.aggregateGoogleReviews(config);
        break;
      case 'facebook':
        await this.aggregateFacebookReviews(config);
        break;
      case 'booksy':
        await this.aggregateBooksyReviews(config);
        break;
      case 'local_favorites':
        await this.aggregateLocalFavoritesReviews(config);
        break;
    }
  }

  /**
   * Aggregate Google reviews
   */
  private async aggregateGoogleReviews(config: any): Promise<void> {
    if (!config.api_key || !config.place_id) return;

    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/place/details/json?place_id=${config.place_id}&fields=reviews&key=${config.api_key}`
      );

      const data = await response.json();

      if (data.result?.reviews) {
        for (const review of data.result.reviews) {
          await this.savePlatformReview({
            external_id: review.time.toString(),
            platform: 'google',
            author_name: review.author_name,
            author_username: review.author_url?.split('/').pop(),
            rating: review.rating,
            review_text: review.text,
            date_published: new Date(review.time * 1000).toISOString().split('T')[0],
            sentiment_score: await this.analyzeSentiment(review.text)
          });
        }
      }
    } catch (error) {
      console.error('Error aggregating Google reviews:', error);
    }
  }

  /**
   * Aggregate Facebook reviews
   */
  private async aggregateFacebookReviews(config: any): Promise<void> {
    if (!config.page_id || !config.access_token) return;

    try {
      const response = await fetch(
        `https://graph.facebook.com/v18.0/${config.page_id}/ratings?access_token=${config.access_token}`
      );

      const data = await response.json();

      if (data.data) {
        for (const review of data.data) {
          await this.savePlatformReview({
            external_id: review.id,
            platform: 'facebook',
            author_name: review.reviewer?.name,
            rating: review.rating,
            review_text: review.review_text,
            date_published: review.created_time?.split('T')[0],
            sentiment_score: review.review_text ? await this.analyzeSentiment(review.review_text) : undefined
          });
        }
      }
    } catch (error) {
      console.error('Error aggregating Facebook reviews:', error);
    }
  }

  /**
   * Save platform review to database
   */
  private async savePlatformReview(reviewData: any): Promise<void> {
    try {
      // Check if review already exists
      const { data: existing } = await supabase
        .from('platform_reviews')
        .select('id')
        .eq('external_id', reviewData.external_id)
        .eq('platform', reviewData.platform)
        .single();

      if (existing) return; // Skip if already exists

      // Insert new review
      await supabase
        .from('platform_reviews')
        .insert({
          ...reviewData,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });

      // Check if should be featured based on rating and sentiment
      if (
        reviewData.rating >= (this.aggregationConfig?.auto_publish_threshold || 4) &&
        (!reviewData.sentiment_score || reviewData.sentiment_score > 0.6)
      ) {
        await this.featurePlatformReview(reviewData.external_id, reviewData.platform);
      }
    } catch (error) {
      console.error('Error saving platform review:', error);
    }
  }

  /**
   * Analyze sentiment of text content
   */
  private async analyzeSentiment(text: string): Promise<number> {
    // Simple sentiment analysis implementation
    // In production, this would use a proper NLP service or API

    const positiveWords = ['świetny', 'świetna', 'świetne', 'fantastyczny', 'fantastyczna', 'fantastyczne', 'doskonały', 'doskonała', 'doskonałe', 'polecam', 'polecamy', 'zadowolony', 'zadowolona', 'zadowolone', 'profesjonalny', 'profesjonalna', 'profesjonalne', 'świetnie', 'super', 'świetna obsługa', 'wspaniale', 'doskonałe'];
    const negativeWords = ['słaby', 'słaba', 'słabe', 'zły', 'zła', 'reli', 'niedobry', 'niedobra', 'niedobre', 'nawet nie', 'nie polecam', 'słabo', 'źle', 'problemy', 'problem', 'brak', 'brakuje', 'rozczarowany', 'rozczarowana'];

    let positiveScore = 0;
    let negativeScore = 0;

    const words = text.toLowerCase().split(/\s+/);

    words.forEach(word => {
      if (positiveWords.some(pw => word.includes(pw))) {
        positiveScore++;
      }
      if (negativeWords.some(nw => word.includes(nw))) {
        negativeScore++;
      }
    });

    // Normalize to 0-1 scale
    const totalWords = words.length;
    const normalizedPositive = positiveScore / totalWords;
    const normalizedNegative = negativeScore / totalWords;

    // Calculate sentiment score (0 = very negative, 1 = very positive, 0.5 = neutral)
    let sentimentScore = 0.5 + (normalizedPositive - normalizedNegative);
    sentimentScore = Math.max(0, Math.min(1, sentimentScore));

    return Math.round(sentimentScore * 100) / 100;
  }

  /**
   * Evaluate content against curation rules
   */
  private async evaluateCurationRules(content: any): Promise<boolean> {
    for (const rule of this.curationRules) {
      if (await this.matchesCurationRule(content, rule)) {
        return rule.actions.auto_approve;
      }
    }

    // Default behavior - require manual approval
    return false;
  }

  /**
   * Check if content matches curation rule
   */
  private async matchesCurationRule(content: any, rule: CurationRule): Promise<boolean> {
    const { criteria } = rule;

    // Check rating requirement
    if (criteria.min_rating && content.rating < criteria.min_rating) {
      return false;
    }

    // Check content length
    if (criteria.content_length) {
      const textLength = content.testimonial?.length || 0;
      if (textLength < criteria.content_length.min || textLength > criteria.content_length.max) {
        return false;
      }
    }

    // Check photo requirement
    if (criteria.contains_images && !content.before_photo_url && !content.additional_photos?.length) {
      return false;
    }

    // Check video requirement
    if (criteria.contains_video && !content.video_url) {
      return false;
    }

    // Check required keywords
    if (criteria.keywords_required?.length) {
      const text = (content.testimonial || '').toLowerCase();
      const hasRequiredKeywords = criteria.keywords_required.every(keyword =>
        text.includes(keyword.toLowerCase())
      );
      if (!hasRequiredKeywords) return false;
    }

    // Check excluded keywords
    if (criteria.keywords_excluded?.length) {
      const text = (content.testimonial || '').toLowerCase();
      const hasExcludedKeywords = criteria.keywords_excluded.some(keyword =>
        text.includes(keyword.toLowerCase())
      );
      if (hasExcludedKeywords) return false;
    }

    // Check sentiment score
    if (criteria.sentiment_score_min && content.sentiment_score < criteria.sentiment_score_min) {
      return false;
    }

    return true;
  }

  /**
   * Schedule testimonial social media posts
   */
  private async scheduleTestimonialSocialPosts(testimonial: ClientTestimonial): Promise<void> {
    try {
      // Generate social media content from testimonial
      const socialContent = this.generateSocialContentFromTestimonial(testimonial);

      for (const [platform, content] of Object.entries(socialContent)) {
        await supabase
          .from('social_posts')
          .insert({
            title: content.title,
            content: content.text,
            platform: platform as SocialPlatform,
            post_type: content.type,
            hashtags: content.hashtags,
            mentions: content.mentions,
            status: 'scheduled',
            scheduled_at: this.calculateOptimalPostingTime(platform as SocialPlatform),
            priority: 'normal',
            auto_generated: true,
            platform_specific_data: {
              source_type: 'testimonial',
              source_id: testimonial.id,
              client_rating: testimonial.rating
            }
          });
      }
    } catch (error) {
      console.error('Error scheduling testimonial social posts:', error);
    }
  }

  /**
   * Generate social media content from testimonial
   */
  private generateSocialContentFromTestimonial(testimonial: ClientTestimonial): Record<SocialPlatform, any> {
    const baseContent = {
      clientName: testimonial.display_name || testimonial.client_name,
      rating: testimonial.rating,
      testimonial: testimonial.testimonial || '',
      service_mentioned: testimonial.service_id
    };

    return {
      instagram: {
        title: `❤️ Opinie klientek`,
        text: `"${baseContent.testimonial.substring(0, 200)}${baseContent.testimonial.length > 200 ? '...' : ''}"\n\n- ${baseContent.clientName}\n⭐ ${'⭐'.repeat(baseContent.rating)}\n\nDziękujemy za zaufanie! 💕`,
        type: 'carousel',
        hashtags: ['#opinie', '#testimonials', '#klienci', '#warszawa', '#beautypolska', '#pieknacera'],
        mentions: ['@mariia.hub']
      },
      facebook: {
        title: 'Co mówią o nas klientki?',
        text: `Zobaczcie co sądzi o nas ${baseContent.clientName}:\n\n"${baseContent.testimonial}"\n\nOcena: ${baseContent.rating}/5 ⭐\n\nWasze opinie napędzają nas do działania! ❤️`,
        type: 'regular',
        hashtags: ['#opinie', '#testimonials', '#klienci', '#warszawa'],
        mentions: []
      },
      linkedin: {
        title: 'Zaufanie klientów - najlepsza rekomendacja',
        text: `"${baseContent.testimonial.substring(0, 300)}${baseContent.testimonial.length > 300 ? '...' : ''}"\n\n- ${baseContent.clientName}, Ocena: ${baseContent.rating}/5\n\nW biznesie beauty i fitness zaufanie jest fundamentem sukcesu. Każda pozytywna opinia potwierdza, że nasza praca ma sens.`,
        type: 'article',
        hashtags: ['#klienci', '#opinie', '#business', '#warsaw'],
        mentions: []
      }
    };
  }

  /**
   * Calculate optimal posting time for platform
   */
  private calculateOptimalPostingTime(platform: SocialPlatform): string {
    const optimalTimes = {
      instagram: '19:00',
      facebook: '18:30',
      linkedin: '09:00',
      tiktok: '20:00'
    };

    const now = new Date();
    const [hours, minutes] = (optimalTimes[platform] || '18:00').split(':');

    const scheduledTime = new Date(now);
    scheduledTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);

    // If time has passed today, schedule for tomorrow
    if (scheduledTime <= now) {
      scheduledTime.setDate(scheduledTime.getDate() + 1);
    }

    return scheduledTime.toISOString();
  }

  /**
   * Analyze photos for appropriateness and quality
   */
  private async analyzePhotos(beforePhotos: string[], afterPhotos: string[]): Promise<{ appropriate: boolean; quality_score: number }> {
    // Simple photo analysis implementation
    // In production, this would use computer vision APIs

    const totalPhotos = beforePhotos.length + afterPhotos.length;

    // Simulate quality analysis (random score between 70-100)
    const qualityScore = Math.floor(Math.random() * 30) + 70;

    // Consider photos appropriate if quality score is above 75
    const appropriate = qualityScore >= 75;

    return { appropriate, quality_score: qualityScore };
  }

  /**
   * Generate auto-description for before/after photos
   */
  private async generateBeforeAfterDescription(
    serviceId: string,
    beforePhotos: string[],
    afterPhotos: string[]
  ): Promise<string> {
    try {
      // Fetch service details
      const { data: service } = await supabase
        .from('services')
        .select('title, service_type, category')
        .eq('id', serviceId)
        .single();

      if (!service) return 'Transformacja zabiegowa';

      const descriptions = {
        beauty: [
          'Spektakularna metamorfoza zabiegowa',
          'Widoczne efekty po profesjonalnym zabiegu',
          'Piękna transformacja z użyciem najwyższej jakości produktów',
          'Zadowolenie gwarantowane - zobacz efekty!'
        ],
        fitness: [
          'Imponujące rezultaty treningowe',
          'Transformacja dzięki regularnym treningom',
          'Widoczna poprawa kondycji i sylwetki',
          'Efekty systematycznej pracy nad sobą'
        ]
      };

      const categoryDescriptions = descriptions[service.service_type as keyof typeof descriptions] || descriptions.beauty;
      return categoryDescriptions[Math.floor(Math.random() * categoryDescriptions.length)];
    } catch (error) {
      console.error('Error generating description:', error);
      return 'Transformacja zabiegowa';
    }
  }

  /**
   * Generate tags for content
   */
  private generateTags(serviceId: string, description: string): string[] {
    const baseTags = ['transformacja', 'przedipo', 'efekty', 'warszawa'];

    // Extract keywords from description
    const keywords = description.toLowerCase()
      .split(/\s+/)
      .filter(word => word.length > 4)
      .slice(0, 3);

    return [...baseTags, ...keywords];
  }

  /**
   * Send testimonial request email
   */
  private async sendTestimonialRequestEmail(testimonialId: string, incentive?: any): Promise<void> {
    // Implementation would integrate with email service
    console.log(`Sending testimonial request email for ${testimonialId}`);
  }

  /**
   * Send testimonial confirmation email
   */
  private async sendTestimonialConfirmationEmail(testimonial: ClientTestimonial): Promise<void> {
    // Implementation would integrate with email service
    console.log(`Sending confirmation email for testimonial ${testimonial.id}`);
  }

  /**
   * Schedule reminder emails
   */
  private async scheduleReminderEmails(testimonialId: string, schedule: number[]): Promise<void> {
    // Implementation would schedule emails for testimonial collection
    console.log(`Scheduling reminders for ${testimonialId}:`, schedule);
  }

  /**
   * Notify admin for content review
   */
  private async notifyAdminForReview(contentId: string, contentType: string): Promise<void> {
    // Implementation would send notification to admin
    console.log(`Notifying admin for review of ${contentType} ${contentId}`);
  }

  /**
   * Feature platform review
   */
  private async featurePlatformReview(externalId: string, platform: SocialPlatform): Promise<void> {
    try {
      await supabase
        .from('platform_reviews')
        .update({ is_featured: true })
        .eq('external_id', externalId)
        .eq('platform', platform);
    } catch (error) {
      console.error('Error featuring platform review:', error);
    }
  }

  /**
   * Get social proof statistics
   */
  async getSocialProofStatistics(): Promise<{
    total_testimonials: number;
    verified_testimonials: number;
    average_rating: number;
    total_before_after: number;
    published_before_after: number;
    platform_reviews: Record<SocialPlatform, number>;
    recent_activity: Array<{
      type: string;
      date: string;
      description: string;
    }>;
  }> {
    try {
      // Get testimonials stats
      const { data: testimonials } = await supabase
        .from('client_testimonials')
        .select('rating, is_verified, created_at');

      // Get before/after stats
      const { data: beforeAfter } = await supabase
        .from('before_after_gallery')
        .select('is_published, created_at');

      // Get platform reviews stats
      const { data: platformReviews } = await supabase
        .from('platform_reviews')
        .select('platform, rating, created_at');

      const totalTestimonials = testimonials?.length || 0;
      const verifiedTestimonials = testimonials?.filter(t => t.is_verified).length || 0;
      const averageRating = testimonials?.reduce((sum, t) => sum + t.rating, 0) / totalTestimonials || 0;

      const totalBeforeAfter = beforeAfter?.length || 0;
      const publishedBeforeAfter = beforeAfter?.filter(ba => ba.is_published).length || 0;

      // Platform reviews breakdown
      const platformStats: Record<SocialPlatform, number> = {} as any;
      platformReviews?.forEach(review => {
        platformStats[review.platform] = (platformStats[review.platform] || 0) + 1;
      });

      // Recent activity
      const recentActivity = [];

      if (testimonials) {
        testimonials.slice(-5).forEach(testimonial => {
          recentActivity.push({
            type: 'testimonial',
            date: testimonial.created_at,
            description: `Nowa opinia klienta (${testimonial.rating}/5)`
          });
        });
      }

      if (beforeAfter) {
        beforeAfter.slice(-3).forEach(ba => {
          recentActivity.push({
            type: 'before_after',
            date: ba.created_at,
            description: 'Nowe zdjęcia przed/po'
          });
        });
      }

      recentActivity.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

      return {
        total_testimonials: totalTestimonials,
        verified_testimonials: verifiedTestimonials,
        average_rating: Math.round(averageRating * 100) / 100,
        total_before_after: totalBeforeAfter,
        published_before_after: publishedBeforeAfter,
        platform_reviews: platformStats,
        recent_activity: recentActivity.slice(0, 10)
      };
    } catch (error) {
      console.error('Error getting social proof statistics:', error);
      return {
        total_testimonials: 0,
        verified_testimonials: 0,
        average_rating: 0,
        total_before_after: 0,
        published_before_after: 0,
        platform_reviews: {} as any,
        recent_activity: []
      };
    }
  }

  /**
   * Get featured testimonials for display
   */
  async getFeaturedTestimonials(limit: number = 10): Promise<ClientTestimonial[]> {
    try {
      const { data, error } = await supabase
        .from('client_testimonials')
        .select(`
          *,
          services(title, category),
          profiles(full_name, avatar_url)
        `)
        .eq('is_featured', true)
        .eq('is_verified', true)
        .eq('status', 'published')
        .eq('consent_marketing', true)
        .order('featured_priority', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error getting featured testimonials:', error);
      return [];
    }
  }

  /**
   * Get before/after gallery for display
   */
  async getBeforeAfterGallery(
    filters?: {
      service_id?: string;
      category?: string;
      limit?: number;
    }
  ): Promise<BeforeAfterGallery[]> {
    try {
      let query = supabase
        .from('before_after_gallery')
        .select(`
          *,
          services(title, category, service_type)
        `)
        .eq('is_published', true)
        .eq('consent_website', true)
        .order('featured_priority', { ascending: false })
        .order('created_at', { ascending: false });

      if (filters?.service_id) {
        query = query.eq('service_id', filters.service_id);
      }

      if (filters?.limit) {
        query = query.limit(filters.limit);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error getting before/after gallery:', error);
      return [];
    }
  }

  /**
   * Create social proof widget
   */
  async createSocialProofWidget(widget: Omit<SocialProofWidget, 'id'>): Promise<string> {
    try {
      const { data, error } = await supabase
        .from('social_proof_widgets')
        .insert(widget)
        .select('id')
        .single();

      if (error) throw error;
      return data.id;
    } catch (error) {
      console.error('Error creating social proof widget:', error);
      throw error;
    }
  }

  /**
   * Update aggregation configuration
   */
  async updateAggregationConfig(config: Partial<ReviewAggregationConfig>): Promise<void> {
    if (this.aggregationConfig) {
      this.aggregationConfig = { ...this.aggregationConfig, ...config };
      await this.saveAggregationConfig(this.aggregationConfig);
    }
  }

  /**
   * Get aggregation configuration
   */
  getAggregationConfig(): ReviewAggregationConfig | null {
    return this.aggregationConfig;
  }
}

// Export singleton instance
export const socialProofManagement = new SocialProofManagementService();