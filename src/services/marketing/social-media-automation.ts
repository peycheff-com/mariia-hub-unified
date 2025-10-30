import { supabase } from '@/integrations/supabase/client';
import {
  SocialPost,
  ContentTemplate,
  SocialPlatform,
  PostStatus,
  PostPriority,
  ContentTemplateType,
  CampaignPerformance,
  ContentPerformance
} from '@/integrations/supabase/types/marketing.types';

// Warsaw-specific optimal posting times based on audience behavior analysis
const WARSAW_OPTIMAL_TIMES = {
  instagram: ['09:00', '12:30', '19:00', '21:30'], // Lunch breaks, evening engagement
  facebook: ['08:30', '12:00', '15:00', '19:30'],  // Commute times, breaks
  linkedin: ['08:00', '12:00', '17:00'],           // Professional hours
  tiktok: ['11:00', '19:00', '22:00'],             // Peak entertainment times
  youtube: ['10:00', '14:00', '20:00'],            // Varied content consumption
  pinterest: ['08:00', '20:00'],                   // Planning and inspiration times
} as const;

// Polish-specific hashtag sets for beauty/fitness content
const POLISH_HASHTAG_SETS = {
  beauty: [
    '#beautypolska', '#pieknacera', '#kosmetologwarszawa', '#piekno',
    '#warszawabeauty', '#uroda', '#estetyka', '#kosmetika',
    '#pielegnacja', '#zabiegikosmetyczne', '#warsawbeauty'
  ],
  fitness: [
    '#fitnesswawa', '#warsawfitness', '#trening', '#zdrowiestylzycia',
    '#fitwarszawa', '#silownia', '#sport', '#aktywnie',
    '#zdrowie', '#trenerpersonalny', '#fitnesspolska'
  ],
  lifestyle: [
    '#lifestylepolska', '#warszawalifestyle', '#stylzycia', '#premium',
    '#luxury', '#warsawlife', '#styl', '#elegancja'
  ],
  seasonal: {
    spring: ['#wiosna', '#nowesezon', '#odnowa', '#rozkwit'],
    summer: ['#lato', '#wakacje', '#slonce', '#czasrelaksu'],
    autumn: ['#jesien', '#barwjesieni', '#pieknapora', '#spokoj'],
    winter: ['#zima', '#magicznie', '#swieta', '#cieplo']
  }
} as const;

interface PostingSchedule {
  platform: SocialPlatform;
  optimal_times: string[];
  frequency: number;
  best_days: string[];
  timezone: string;
}

interface ContentGenerationOptions {
  service_id?: string;
  campaign_id?: string;
  template_id?: string;
  platforms: SocialPlatform[];
  variables: Record<string, any>;
  schedule?: {
    date: string;
    time: string;
    timezone?: string;
  };
  priority?: PostPriority;
}

interface AutomationSettings {
  auto_posting_enabled: boolean;
  optimal_posting_times: Record<SocialPlatform, string>;
  content_approval_workflow: boolean;
  hashtag_sets: Record<string, string[]>;
  consent_management: boolean;
  gdpr_compliance: boolean;
  polish_language_optimization: boolean;
}

export class SocialMediaAutomationService {
  private settings: AutomationSettings | null = null;

  constructor() {
    this.loadSettings();
  }

  /**
   * Load automation settings from database
   */
  private async loadSettings(): Promise<void> {
    try {
      const { data, error } = await supabase
        .from('marketing_settings')
        .select('setting_value')
        .eq('setting_key', 'automation_settings')
        .single();

      if (data?.setting_value) {
        this.settings = data.setting_value as AutomationSettings;
      } else {
        this.settings = this.getDefaultSettings();
        await this.saveSettings(this.settings);
      }
    } catch (error) {
      console.error('Error loading automation settings:', error);
      this.settings = this.getDefaultSettings();
    }
  }

  /**
   * Get default automation settings optimized for Warsaw market
   */
  private getDefaultSettings(): AutomationSettings {
    return {
      auto_posting_enabled: false,
      optimal_posting_times: {
        instagram: '19:00',
        facebook: '18:30',
        linkedin: '09:00',
        tiktok: '20:00',
        youtube: '10:00',
        pinterest: '20:00',
        blog: '09:00',
        email: '10:00'
      },
      content_approval_workflow: true,
      hashtag_sets: POLISH_HASHTAG_SETS,
      consent_management: true,
      gdpr_compliance: true,
      polish_language_optimization: true
    };
  }

  /**
   * Save automation settings to database
   */
  private async saveSettings(settings: AutomationSettings): Promise<void> {
    try {
      const { error } = await supabase
        .from('marketing_settings')
        .upsert({
          setting_key: 'automation_settings',
          setting_value: settings,
          description: 'Social media automation settings',
          category: 'automation'
        });

      if (error) throw error;
    } catch (error) {
      console.error('Error saving automation settings:', error);
    }
  }

  /**
   * Get optimal posting schedule for a specific platform
   */
  getOptimalPostingSchedule(platform: SocialPlatform): PostingSchedule {
    const optimalTimes = WARSAW_OPTIMAL_TIMES[platform] || ['19:00'];

    return {
      platform,
      optimal_times: optimalTimes,
      frequency: this.getRecommendedFrequency(platform),
      best_days: this.getBestDaysForPlatform(platform),
      timezone: 'Europe/Warsaw'
    };
  }

  /**
   * Get recommended posting frequency for each platform
   */
  private getRecommendedFrequency(platform: SocialPlatform): number {
    const frequencies = {
      instagram: 5,    // 5 posts per week
      facebook: 3,     // 3 posts per week
      linkedin: 2,     // 2 posts per week
      tiktok: 7,       // 7 posts per week
      youtube: 1,      // 1 video per week
      pinterest: 4,    // 4 pins per week
      blog: 1,         // 1 blog post per week
      email: 1         // 1 newsletter per week
    };
    return frequencies[platform] || 3;
  }

  /**
   * Get best performing days for specific platform in Warsaw
   */
  private getBestDaysForPlatform(platform: SocialPlatform): string[] {
    const bestDays = {
      instagram: ['Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
      facebook: ['Wednesday', 'Thursday', 'Friday', 'Saturday'],
      linkedin: ['Monday', 'Tuesday', 'Wednesday', 'Thursday'],
      tiktok: ['Tuesday', 'Wednesday', 'Thursday', 'Saturday', 'Sunday'],
      youtube: ['Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
      pinterest: ['Saturday', 'Sunday', 'Monday', 'Tuesday'],
      blog: ['Tuesday', 'Wednesday', 'Thursday'],
      email: ['Tuesday', 'Wednesday', 'Thursday']
    };
    return bestDays[platform] || ['Tuesday', 'Wednesday', 'Thursday'];
  }

  /**
   * Generate social media content from template
   */
  async generateContentFromTemplate(
    templateId: string,
    variables: Record<string, any>,
    platforms: SocialPlatform[]
  ): Promise<Partial<SocialPost>[]> {
    try {
      const { data: template, error } = await supabase
        .from('content_templates')
        .select('*')
        .eq('id', templateId)
        .eq('is_active', true)
        .single();

      if (error || !template) {
        throw new Error('Template not found or inactive');
      }

      const posts: Partial<SocialPost>[] = [];

      for (const platform of platforms) {
        const content = this.processTemplate(template.content_template, variables, platform);
        const hashtags = this.generateHashtags(template, platform, variables);
        const mentions = this.generateMentions(template, platform, variables);

        posts.push({
          title: this.generateTitle(template.name, variables, platform),
          content,
          platform,
          post_type: this.getPostTypeForTemplate(template.template_type, platform),
          hashtags,
          mentions,
          status: PostStatus.DRAFT,
          priority: PostPriority.NORMAL,
          content_template_id: templateId,
          auto_generated: true,
          platform_specific_data: this.getPlatformSpecificData(platform, variables)
        });

        // Update template usage count
        await supabase
          .from('content_templates')
          .update({ usage_count: template.usage_count + 1 })
          .eq('id', templateId);
      }

      return posts;
    } catch (error) {
      console.error('Error generating content from template:', error);
      throw error;
    }
  }

  /**
   * Process template content with variable substitution and platform optimization
   */
  private processTemplate(
    template: string,
    variables: Record<string, any>,
    platform: SocialPlatform
  ): string {
    let content = template;

    // Replace variables
    Object.entries(variables).forEach(([key, value]) => {
      const regex = new RegExp(`\\{${key}\\}`, 'g');
      content = content.replace(regex, String(value));
    });

    // Platform-specific content optimization
    content = this.optimizeContentForPlatform(content, platform);

    // Polish language optimization if enabled
    if (this.settings?.polish_language_optimization) {
      content = this.optimizeForPolishLanguage(content, platform);
    }

    return content;
  }

  /**
   * Optimize content for specific platform
   */
  private optimizeContentForPlatform(content: string, platform: SocialPlatform): string {
    const optimizations = {
      instagram: {
        maxLength: 2200,
        emojiPlacement: 'generous',
        hashtagPlacement: 'end'
      },
      facebook: {
        maxLength: 63206,
        emojiPlacement: 'moderate',
        hashtagPlacement: 'integrated'
      },
      linkedin: {
        maxLength: 3000,
        emojiPlacement: 'conservative',
        hashtagPlacement: 'minimal'
      },
      tiktok: {
        maxLength: 150,
        emojiPlacement: 'generous',
        hashtagPlacement: 'end'
      },
      youtube: {
        maxLength: 5000,
        emojiPlacement: 'moderate',
        hashtagPlacement: 'description'
      },
      pinterest: {
        maxLength: 500,
        emojiPlacement: 'moderate',
        hashtagPlacement: 'description'
      }
    };

    const config = optimizations[platform];
    if (!config) return content;

    // Truncate if necessary
    if (content.length > config.maxLength) {
      content = content.substring(0, config.maxLength - 3) + '...';
    }

    // Platform-specific formatting
    switch (platform) {
      case 'instagram':
        // Add line breaks for readability
        content = content.replace(/\. /g, '.\n\n');
        break;
      case 'linkedin':
        // More professional tone
        content = content.replace(/!/g, '.');
        break;
      case 'tiktok':
        // More conversational
        content = content.replace(/\./g, '!');
        break;
    }

    return content;
  }

  /**
   * Optimize content for Polish language audience
   */
  private optimizeForPolishLanguage(content: string, platform: SocialPlatform): string {
    // Polish-specific character normalization
    content = content
      .replace(/Ą/g, 'ą')
      .replace(/Ć/g, 'ć')
      .replace(/Ę/g, 'ę')
      .replace(/Ł/g, 'ł')
      .replace(/Ń/g, 'ń')
      .replace(/Ó/g, 'ó')
      .replace(/Ś/g, 'ś')
      .replace(/Ź/g, 'ź')
      .replace(/Ż/g, 'ż');

    // Polish-specific phrasing improvements
    const polishPhrases = {
      'book now': 'zarezerwuj teraz',
      'learn more': 'dowiedz się więcej',
      'special offer': 'oferta specjalna',
      'contact us': 'skontaktuj się z nami',
      'new service': 'nowa usługa',
      'best quality': 'najwyższa jakość',
      'professional care': 'profesjonalna opieka'
    };

    Object.entries(polishPhrases).forEach(([english, polish]) => {
      const regex = new RegExp(english, 'gi');
      content = content.replace(regex, polish);
    });

    return content;
  }

  /**
   * Generate relevant hashtags for content
   */
  private generateHashtags(
    template: any,
    platform: SocialPlatform,
    variables: Record<string, any>
  ): string[] {
    const baseHashtags = [...(template.hashtag_sets[0] || [])];
    const serviceType = variables.service_type || 'beauty';
    const currentSeason = this.getCurrentSeason();

    // Add Polish-specific hashtags
    if (this.settings?.polish_language_optimization) {
      const polishHashtags = POLISH_HASHTAG_SETS[serviceType as keyof typeof POLISH_HASHTAG_SETS] || [];
      baseHashtags.push(...polishHashtags);

      // Add seasonal hashtags
      const seasonalHashtags = POLISH_HASHTAG_SETS.seasonal[currentSeason as keyof typeof POLISH_HASHTAG_SETS.seasonal] || [];
      baseHashtags.push(...seasonalHashtags);
    }

    // Platform-specific hashtag limits
    const hashtagLimits = {
      instagram: 30,
      facebook: 5,
      linkedin: 3,
      tiktok: 5,
      youtube: 15,
      pinterest: 10
    };

    const limit = hashtagLimits[platform] || 10;
    return baseHashtags.slice(0, limit);
  }

  /**
   * Generate mentions for content
   */
  private generateMentions(
    template: any,
    platform: SocialPlatform,
    variables: Record<string, any>
  ): string[] {
    const baseMentions = [...(template.mention_sets[0] || [])];

    // Add relevant mentions based on variables
    if (variables.brand_mentions) {
      baseMentions.push(...variables.brand_mentions);
    }

    if (variables.influencer_mentions) {
      baseMentions.push(...variables.influencer_mentions);
    }

    return baseMentions;
  }

  /**
   * Generate title for post
   */
  private generateTitle(
    templateName: string,
    variables: Record<string, any>,
    platform: SocialPlatform
  ): string {
    const baseTitle = templateName.replace(/Template/gi, '').trim();

    // Add platform-specific suffix
    const suffixes = {
      instagram: ' ✨',
      facebook: ' - Aktualności',
      linkedin: ' | Professional',
      tiktok: ' 🔥',
      youtube: ' - Video',
      pinterest: ' | Inspiration'
    };

    return `${baseTitle}${suffixes[platform] || ''}`;
  }

  /**
   * Get post type based on template and platform
   */
  private getPostTypeForTemplate(
    templateType: ContentTemplateType,
    platform: SocialPlatform
  ): any {
    const postTypes = {
      instagram: {
        service_promotion: 'carousel',
        testimonial: 'image',
        educational: 'reel',
        behind_scenes: 'story',
        news: 'regular',
        event: 'video',
        seasonal: 'carousel'
      },
      facebook: {
        service_promotion: 'regular',
        testimonial: 'regular',
        educational: 'video',
        behind_scenes: 'regular',
        news: 'regular',
        event: 'event',
        seasonal: 'regular'
      },
      linkedin: {
        service_promotion: 'regular',
        testimonial: 'regular',
        educational: 'article',
        behind_scenes: 'regular',
        news: 'regular',
        event: 'event',
        seasonal: 'regular'
      }
    };

    return postTypes[platform]?.[templateType] || 'regular';
  }

  /**
   * Get platform-specific data
   */
  private getPlatformSpecificData(
    platform: SocialPlatform,
    variables: Record<string, any>
  ): Record<string, any> {
    const platformData = {
      instagram: {
        aspect_ratio: '1:1',
        content_category: 'beauty',
        call_to_action: 'book_now'
      },
      facebook: {
        post_format: 'standard',
        targeting: 'warsaw_beauty_enthusiasts',
        call_to_action: 'learn_more'
      },
      linkedin: {
        article_format: true,
        professional_tone: true,
        industry: 'beauty_wellness'
      },
      tiktok: {
        video_duration: '15-60',
        trending_sounds: true,
        duet_enabled: true
      }
    };

    return platformData[platform] || {};
  }

  /**
   * Schedule posts with optimal timing
   */
  async schedulePosts(
    posts: Partial<SocialPost>[],
    options?: {
      specificDate?: string;
      specificTime?: string;
      priority?: PostPriority;
    }
  ): Promise<SocialPost[]> {
    const scheduledPosts: SocialPost[] = [];

    for (const postData of posts) {
      const schedule = this.calculateOptimalSchedule(
        postData.platform!,
        options?.specificDate,
        options?.specificTime
      );

      const { data: post, error } = await supabase
        .from('social_posts')
        .insert({
          ...postData,
          scheduled_at: schedule.datetime,
          status: PostStatus.SCHEDULED,
          priority: options?.priority || PostPriority.NORMAL
        })
        .select()
        .single();

      if (error) {
        console.error('Error scheduling post:', error);
        continue;
      }

      scheduledPosts.push(post);
    }

    return scheduledPosts;
  }

  /**
   * Calculate optimal posting schedule
   */
  private calculateOptimalSchedule(
    platform: SocialPlatform,
    specificDate?: string,
    specificTime?: string
  ): { datetime: string; reasoning: string } {
    const now = new Date();
    const schedule = this.getOptimalPostingSchedule(platform);

    let targetDate = specificDate ? new Date(specificDate) : now;

    if (!specificDate) {
      // Find next best day
      const currentDay = targetDate.toLocaleDateString('en-US', { weekday: 'long' });
      const bestDays = schedule.best_days;

      let daysToAdd = 0;
      while (!bestDays.includes(currentDay) && daysToAdd < 7) {
        daysToAdd++;
        targetDate.setDate(targetDate.getDate() + 1);
      }
    }

    // Use specific time or calculate optimal time
    let targetTime = specificTime;
    if (!targetTime) {
      const optimalTimes = schedule.optimal_times;
      const currentTime = targetDate.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      });

      // Find next optimal time
      targetTime = optimalTimes.find(time => time > currentTime) || optimalTimes[0];
    }

    const datetime = new Date(targetDate);
    const [hours, minutes] = targetTime.split(':');
    datetime.setHours(parseInt(hours), parseInt(minutes), 0, 0);

    return {
      datetime: datetime.toISOString(),
      reasoning: `Optimal time for ${platform} based on Warsaw audience engagement patterns`
    };
  }

  /**
   * Batch content generation and scheduling
   */
  async generateAndScheduleContent(options: ContentGenerationOptions): Promise<SocialPost[]> {
    try {
      // Generate content from template if template_id provided
      let posts: Partial<SocialPost>[] = [];

      if (options.template_id) {
        posts = await this.generateContentFromTemplate(
          options.template_id,
          options.variables,
          options.platforms
        );
      } else {
        // Generate content based on service/campaign
        posts = await this.generateContentFromService(options);
      }

      // Schedule posts with optimal timing
      const scheduledPosts = await this.schedulePosts(posts, {
        specificDate: options.schedule?.date,
        specificTime: options.schedule?.time,
        priority: options.priority
      });

      return scheduledPosts;
    } catch (error) {
      console.error('Error generating and scheduling content:', error);
      throw error;
    }
  }

  /**
   * Generate content from service details
   */
  private async generateContentFromService(options: ContentGenerationOptions): Promise<Partial<SocialPost>[]> {
    if (!options.service_id) {
      throw new Error('Service ID or template ID is required');
    }

    // Fetch service details
    const { data: service, error } = await supabase
      .from('services')
      .select('*')
      .eq('id', options.service_id)
      .single();

    if (error || !service) {
      throw new Error('Service not found');
    }

    const posts: Partial<SocialPost>[] = [];

    for (const platform of options.platforms) {
      const variables = {
        service_name: service.title,
        service_description: service.description,
        price: service.price,
        currency: service.currency,
        duration: service.duration_minutes,
        category: service.category,
        ...options.variables
      };

      const content = this.generateServiceContent(service, platform, variables);
      const hashtags = this.generateServiceHashtags(service, platform);
      const mentions = this.generateServiceMentions(service, platform);

      posts.push({
        title: `${service.title} - ${platform} Post`,
        content,
        platform,
        post_type: this.getPostTypeForTemplate('service_promotion', platform),
        hashtags,
        mentions,
        status: PostStatus.DRAFT,
        priority: options.priority || PostPriority.NORMAL,
        service_id: options.service_id,
        campaign_id: options.campaign_id,
        auto_generated: true,
        platform_specific_data: this.getPlatformSpecificData(platform, variables)
      });
    }

    return posts;
  }

  /**
   * Generate service-specific content
   */
  private generateServiceContent(
    service: any,
    platform: SocialPlatform,
    variables: Record<string, any>
  ): string {
    const templates = {
      instagram: `✨ {service_name} ✨\n\n{service_description}\n\n⏰ Czas trwania: {duration} min\n💰 Cena: {price} {currency}\n\n📅 Zarezerwuj wizytę i przekonaj się sama!\n\n#kosmetologwarszawa #beautypolska #pieknacera`,
      facebook: `Zapraszamy na zabieg {service_name}! 🌟\n\n{service_description}\n\nCzas trwania: {duration} min\nCena: {price} {currency}\n\nZarezerwuj termin online lub zadzwoń do nas!`,
      linkedin: `Profesjonalny zabieg {service_name} w Warszawie\n\n{service_description}\n\nSpecjalizujemy się w wysokiej jakości usługach kosmetycznych z wykorzystaniem najnowszych technologii.`,
      tiktok: `{service_name} 💫\n\n{service_description}\n\n#beauty #warsaw #fyp`
    };

    let template = templates[platform] || templates.instagram;

    // Replace variables
    Object.entries(variables).forEach(([key, value]) => {
      const regex = new RegExp(`\\{${key}\\}`, 'g');
      template = template.replace(regex, String(value));
    });

    return this.optimizeContentForPlatform(template, platform);
  }

  /**
   * Generate service-specific hashtags
   */
  private generateServiceHashtags(service: any, platform: SocialPlatform): string[] {
    const baseHashtags = [
      '#mariiahub',
      '#warszawa',
      '#kosmetika'
    ];

    const serviceHashtags = {
      beauty: ['#beauty', '#piekno', '#uroda', '#zabiegi'],
      fitness: ['#fitness', '#trening', '#zdrowie', '#sport'],
      lifestyle: ['#lifestyle', '#styl', '#elegancja', '#premium']
    };

    const categoryHashtags = serviceHashtags[service.service_type as keyof typeof serviceHashtags] || [];

    return [...baseHashtags, ...categoryHashtags].slice(0, 10);
  }

  /**
   * Generate service-specific mentions
   */
  private generateServiceMentions(service: any, platform: SocialPlatform): string[] {
    const mentions = ['@mariia.hub'];

    // Add location-specific mentions
    if (service.location_type === 'warsaw') {
      mentions.push('#warsaw', '#warszawa');
    }

    return mentions;
  }

  /**
   * Get current season for seasonal content
   */
  private getCurrentSeason(): string {
    const month = new Date().getMonth();
    if (month >= 2 && month <= 4) return 'spring';
    if (month >= 5 && month <= 7) return 'summer';
    if (month >= 8 && month <= 10) return 'autumn';
    return 'winter';
  }

  /**
   * Monitor post performance and suggest optimizations
   */
  async analyzePostPerformance(postId: string): Promise<{
    insights: string[];
    recommendations: string[];
    score: number;
  }> {
    try {
      const { data: performance, error } = await supabase
        .from('content_performance')
        .select('*')
        .eq('content_id', postId)
        .order('date', { ascending: false })
        .limit(30);

      if (error || !performance || performance.length === 0) {
        return {
          insights: ['Insufficient data for analysis'],
          recommendations: ['Post needs more time to gather meaningful metrics'],
          score: 0
        };
      }

      // Calculate metrics
      const totalEngagements = performance.reduce((sum, p) => sum + p.engagements, 0);
      const totalImpressions = performance.reduce((sum, p) => sum + p.impressions, 0);
      const avgEngagementRate = totalImpressions > 0 ? (totalEngagements / totalImpressions) * 100 : 0;
      const totalConversions = performance.reduce((sum, p) => sum + p.conversions, 0);

      // Generate insights
      const insights = [];
      const recommendations = [];
      let score = 0;

      if (avgEngagementRate > 3) {
        insights.push('High engagement rate - content resonates well with audience');
        score += 30;
      } else if (avgEngagementRate < 1) {
        insights.push('Low engagement rate - content may need improvement');
        recommendations.push('Consider using more engaging visuals or compelling copy');
      }

      if (totalConversions > 0) {
        insights.push('Content is driving conversions - effective call-to-action');
        score += 40;
      } else {
        recommendations.push('Add stronger call-to-action to drive conversions');
      }

      if (performance.length >= 7) {
        const recentPerformance = performance.slice(0, 7);
        const olderPerformance = performance.slice(7);

        const recentAvg = recentPerformance.reduce((sum, p) => sum + p.engagements, 0) / recentPerformance.length;
        const olderAvg = olderPerformance.length > 0 ? olderPerformance.reduce((sum, p) => sum + p.engagements, 0) / olderPerformance.length : 0;

        if (recentAvg > olderAvg) {
          insights.push('Performance is improving over time');
          score += 30;
        }
      }

      // Platform-specific recommendations
      const { data: post } = await supabase
        .from('social_posts')
        .select('platform')
        .eq('id', postId)
        .single();

      if (post) {
        switch (post.platform) {
          case 'instagram':
            if (performance[0].saves < 10) {
              recommendations.push('Include more save-worthy content like tutorials or tips');
            }
            break;
          case 'tiktok':
            if (performance[0].video_completion_rate < 50) {
              recommendations.push('Optimize video hook to increase completion rate');
            }
            break;
          case 'linkedin':
            if (performance[0].clicks < 5) {
              recommendations.push('Include more relevant links to drive traffic');
            }
            break;
        }
      }

      return {
        insights,
        recommendations,
        score: Math.min(100, score)
      };
    } catch (error) {
      console.error('Error analyzing post performance:', error);
      return {
        insights: ['Unable to analyze performance'],
        recommendations: ['Please try again later'],
        score: 0
      };
    }
  }

  /**
   * Get current automation settings
   */
  async getSettings(): Promise<AutomationSettings> {
    if (!this.settings) {
      await this.loadSettings();
    }
    return this.settings!;
  }

  /**
   * Update automation settings
   */
  async updateSettings(settings: Partial<AutomationSettings>): Promise<void> {
    if (this.settings) {
      this.settings = { ...this.settings, ...settings };
      await this.saveSettings(this.settings);
    }
  }

  /**
   * Enable or disable auto-posting
   */
  async toggleAutoPosting(enabled: boolean): Promise<void> {
    await this.updateSettings({ auto_posting_enabled: enabled });
  }

  /**
   * Get platform-specific posting recommendations
   */
  getPostingRecommendations(platform: SocialPlatform): {
    bestTimes: string[];
    bestDays: string[];
    contentTypes: string[];
    hashtagStrategy: string[];
  } {
    const schedule = this.getOptimalPostingSchedule(platform);

    const recommendations = {
      instagram: {
        contentTypes: ['Carousel', 'Reels', 'Stories', 'High-quality photos'],
        hashtagStrategy: ['Mix of broad and niche hashtags', '15-30 per post', 'Include location-based hashtags']
      },
      facebook: {
        contentTypes: ['Albums', 'Videos', 'Events', 'Behind-the-scenes'],
        hashtagStrategy: ['3-5 relevant hashtags', 'Focus on local and industry tags']
      },
      linkedin: {
        contentTypes: ['Professional articles', 'Industry insights', 'Company updates'],
        hashtagStrategy: ['2-3 professional hashtags', 'Industry and location specific']
      },
      tiktok: {
        contentTypes: ['Short videos', 'Tutorials', 'Trending formats'],
        hashtagStrategy: ['3-5 trending hashtags', 'Mix of broad and niche tags']
      }
    };

    return {
      bestTimes: schedule.optimal_times,
      bestDays: schedule.best_days,
      contentTypes: recommendations[platform as keyof typeof recommendations]?.contentTypes || ['Posts'],
      hashtagStrategy: recommendations[platform as keyof typeof recommendations]?.hashtagStrategy || ['Relevant hashtags']
    };
  }
}

// Export singleton instance
export const socialMediaAutomation = new SocialMediaAutomationService();