import { supabase } from '@/integrations/supabase/client';
import {
  ContentRepurposing,
  RepurposingStrategy,
  RepurposingStatus,
  RepurposingPriority,
  ContentType,
  SocialPlatform,
  SocialPost,
  ContentTemplate,
  CampaignPerformance
} from '@/integrations/supabase/types/marketing.types';

// Content adaptation rules for different platforms
interface PlatformAdaptationRules {
  contentLength: {
    min: number;
    max: number;
    optimal: number;
  };
  hashtagStrategy: {
    count: number;
    placement: 'beginning' | 'middle' | 'end' | 'mixed';
    mix: {
      broad: number;
      niche: number;
      branded: number;
      location: number;
    };
  };
  mediaSpecs: {
    aspectRatio: string[];
    resolution: { width: number; height: number };
    fileTypes: string[];
    maxFileSize: number; // in MB
  };
  tone: {
    formality: 'formal' | 'casual' | 'professional' | 'entertaining';
    emojiUsage: 'none' | 'minimal' | 'moderate' | 'generous';
    callToAction: string[];
  };
  optimalPostingTimes: string[];
  bestPerformingFormats: ContentType[];
}

const PLATFORM_ADAPTATION_RULES: Record<SocialPlatform, PlatformAdaptationRules> = {
  instagram: {
    contentLength: { min: 50, max: 2200, optimal: 300 },
    hashtagStrategy: {
      count: 20,
      placement: 'end',
      mix: { broad: 5, niche: 10, branded: 3, location: 2 }
    },
    mediaSpecs: {
      aspectRatio: ['1:1', '4:5', '16:9'],
      resolution: { width: 1080, height: 1080 },
      fileTypes: ['jpg', 'png', 'mp4', 'mov'],
      maxFileSize: 50
    },
    tone: {
      formality: 'casual',
      emojiUsage: 'moderate',
      callToAction: ['book_now', 'learn_more', 'shop_now']
    },
    optimalPostingTimes: ['09:00', '12:30', '19:00', '21:30'],
    bestPerformingFormats: ['carousel', 'reel', 'image', 'story']
  },
  facebook: {
    contentLength: { min: 20, max: 63206, optimal: 500 },
    hashtagStrategy: {
      count: 5,
      placement: 'mixed',
      mix: { broad: 2, niche: 2, branded: 1, location: 0 }
    },
    mediaSpecs: {
      aspectRatio: ['16:9', '1.91:1', '1:1'],
      resolution: { width: 1200, height: 630 },
      fileTypes: ['jpg', 'png', 'mp4', 'gif'],
      maxFileSize: 100
    },
    tone: {
      formality: 'casual',
      emojiUsage: 'moderate',
      callToAction: ['learn_more', 'sign_up', 'book_now']
    },
    optimalPostingTimes: ['08:30', '12:00', '15:00', '19:30'],
    bestPerformingFormats: ['video', 'carousel', 'image', 'event']
  },
  linkedin: {
    contentLength: { min: 50, max: 3000, optimal: 800 },
    hashtagStrategy: {
      count: 3,
      placement: 'beginning',
      mix: { broad: 1, niche: 1, branded: 1, location: 0 }
    },
    mediaSpecs: {
      aspectRatio: ['1.91:1', '1:1'],
      resolution: { width: 1200, height: 627 },
      fileTypes: ['jpg', 'png', 'mp4'],
      maxFileSize: 30
    },
    tone: {
      formality: 'professional',
      emojiUsage: 'minimal',
      callToAction: ['learn_more', 'contact_us', 'sign_up']
    },
    optimalPostingTimes: ['08:00', '12:00', '17:00'],
    bestPerformingFormats: ['text', 'image', 'video', 'article']
  },
  tiktok: {
    contentLength: { min: 10, max: 150, optimal: 50 },
    hashtagStrategy: {
      count: 5,
      placement: 'end',
      mix: { broad: 2, niche: 2, branded: 1, location: 0 }
    },
    mediaSpecs: {
      aspectRatio: ['9:16', '1:1'],
      resolution: { width: 1080, height: 1920 },
      fileTypes: ['mp4', 'mov'],
      maxFileSize: 100
    },
    tone: {
      formality: 'entertaining',
      emojiUsage: 'generous',
      callToAction: ['shop_now', 'learn_more', 'sign_up']
    },
    optimalPostingTimes: ['11:00', '19:00', '22:00'],
    bestPerformingFormats: ['video', 'reel']
  },
  youtube: {
    contentLength: { min: 100, max: 5000, optimal: 1500 },
    hashtagStrategy: {
      count: 15,
      placement: 'beginning',
      mix: { broad: 5, niche: 7, branded: 2, location: 1 }
    },
    mediaSpecs: {
      aspectRatio: ['16:9', '9:16'],
      resolution: { width: 1920, height: 1080 },
      fileTypes: ['mp4', 'mov', 'avi'],
      maxFileSize: 256
    },
    tone: {
      formality: 'casual',
      emojiUsage: 'moderate',
      callToAction: ['subscribe', 'visit_website', 'comment']
    },
    optimalPostingTimes: ['10:00', '14:00', '20:00'],
    bestPerformingFormats: ['video']
  },
  pinterest: {
    contentLength: { min: 20, max: 500, optimal: 100 },
    hashtagStrategy: {
      count: 10,
      placement: 'end',
      mix: { broad: 3, niche: 5, branded: 1, location: 1 }
    },
    mediaSpecs: {
      aspectRatio: ['2:3', '1:2.4', '1:1', '2:1'],
      resolution: { width: 1000, height: 1500 },
      fileTypes: ['jpg', 'png', 'mp4'],
      maxFileSize: 20
    },
    tone: {
      formality: 'casual',
      emojiUsage: 'moderate',
      callToAction: ['visit_website', 'save', 'shop_now']
    },
    optimalPostingTimes: ['08:00', '20:00'],
    bestPerformingFormats: ['image', 'video', 'carousel']
  },
  blog: {
    contentLength: { min: 1000, max: 10000, optimal: 2500 },
    hashtagStrategy: {
      count: 0,
      placement: 'mixed',
      mix: { broad: 0, niche: 0, branded: 0, location: 0 }
    },
    mediaSpecs: {
      aspectRatio: ['16:9', '4:3'],
      resolution: { width: 1200, height: 630 },
      fileTypes: ['jpg', 'png', 'webp'],
      maxFileSize: 2
    },
    tone: {
      formality: 'professional',
      emojiUsage: 'minimal',
      callToAction: ['learn_more', 'contact_us', 'sign_up']
    },
    optimalPostingTimes: ['09:00'],
    bestPerformingFormats: ['text', 'image']
  },
  email: {
    contentLength: { min: 100, max: 2000, optimal: 500 },
    hashtagStrategy: {
      count: 0,
      placement: 'mixed',
      mix: { broad: 0, niche: 0, branded: 0, location: 0 }
    },
    mediaSpecs: {
      aspectRatio: ['4:3', '16:9'],
      resolution: { width: 600, height: 400 },
      fileTypes: ['jpg', 'png', 'gif'],
      maxFileSize: 5
    },
    tone: {
      formality: 'professional',
      emojiUsage: 'minimal',
      callToAction: ['shop_now', 'learn_more', 'book_now']
    },
    optimalPostingTimes: ['10:00'],
    bestPerformingFormats: ['text', 'image']
  }
};

interface ContentRepurposingRequest {
  source_content_id: string;
  source_type: ContentType;
  source_platform?: SocialPlatform;
  target_platforms: SocialPlatform[];
  strategy: RepurposingStrategy;
  priority: RepurposingPriority;
  scheduled_for?: string;
  custom_instructions?: string;
}

interface GeneratedContent {
  platform: SocialPlatform;
  title: string;
  content: string;
  hashtags: string[];
  mentions: string[];
  media_specs: any;
  posting_recommendations: any;
  engagement_prediction: number;
}

export class ContentDistributionService {
  private readonly CONTENT_PATTERNS = {
    blog_to_social: {
      instagram: (blog: any) => ({
        title: `✨ ${blog.title}`,
        content: this.extractKeyPoints(blog.content, 300) + '\n\nCzytaj więcej na blogu! 🔗',
        hashtags: this.generateBlogHashtags(blog),
        format: 'carousel'
      }),
      facebook: (blog: any) => ({
        title: blog.title,
        content: this.extractSummary(blog.content, 500) + '\n\nCzytaj cały artykuł na naszym blogu.',
        hashtags: this.generateBlogHashtags(blog),
        format: 'regular'
      }),
      linkedin: (blog: any) => ({
        title: `${blog.title} | Wpółpraca`,
        content: this.generateLinkedInArticle(blog),
        hashtags: this.generateProfessionalHashtags(blog),
        format: 'article'
      }),
      pinterest: (blog: any) => ({
        title: blog.title,
        content: this.extractKeyPoints(blog.content, 100),
        hashtags: this.generateBlogHashtags(blog),
        format: 'image'
      })
    },
    service_to_social: {
      instagram: (service: any) => ({
        title: `💫 ${service.title}`,
        content: this.generateServiceInstagram(service),
        hashtags: this.generateServiceHashtags(service),
        format: 'carousel'
      }),
      facebook: (service: any) => ({
        title: service.title,
        content: this.generateServiceFacebook(service),
        hashtags: this.generateServiceHashtags(service),
        format: 'regular'
      }),
      linkedin: (service: any) => ({
        title: `${service.title} | Profesjonalne usługi`,
        content: this.generateServiceLinkedIn(service),
        hashtags: this.generateProfessionalHashtags(service),
        format: 'article'
      }),
      tiktok: (service: any) => ({
        title: `${service.title} 💅`,
        content: this.generateServiceTikTok(service),
        hashtags: this.generateTikTokHashtags(service),
        format: 'video'
      })
    },
    testimonial_to_social: {
      instagram: (testimonial: any) => ({
        title: `❤️ Opinie klientek`,
        content: this.generateTestimonialInstagram(testimonial),
        hashtags: this.generateTestimonialHashtags(),
        format: 'carousel'
      }),
      facebook: (testimonial: any) => ({
        title: 'Co mówią o nas klientki?',
        content: this.generateTestimonialFacebook(testimonial),
        hashtags: this.generateTestimonialHashtags(),
        format: 'regular'
      }),
      linkedin: (testimonial: any) => ({
        title: 'Zaufanie klientów - Nasza najlepsza rekomendacja',
        content: this.generateTestimonialLinkedIn(testimonial),
        hashtags: this.generateProfessionalHashtags(),
        format: 'article'
      })
    }
  };

  /**
   * Initiate content repurposing process
   */
  async initiateContentRepurposing(request: ContentRepurposingRequest): Promise<string> {
    try {
      // Create repurposing record
      const { data: repurposing, error } = await supabase
        .from('content_repurposing')
        .insert({
          source_content_id: request.source_content_id,
          source_type: request.source_type,
          source_platform: request.source_platform,
          target_platforms: request.target_platforms,
          repurposing_strategy: request.strategy,
          status: RepurposingStatus.PENDING,
          priority: request.priority,
          scheduled_for: request.scheduled_for,
          processing_notes: request.custom_instructions
        })
        .select()
        .single();

      if (error) throw error;

      // Start processing
      this.processContentRepurposing(repurposing.id);

      return repurposing.id;
    } catch (error) {
      console.error('Error initiating content repurposing:', error);
      throw error;
    }
  }

  /**
   * Process content repurposing in background
   */
  private async processContentRepurposing(repurposingId: string): Promise<void> {
    try {
      // Update status to processing
      await supabase
        .from('content_repurposing')
        .update({ status: RepurposingStatus.PROCESSING })
        .eq('id', repurposingId);

      const { data: repurposing } = await supabase
        .from('content_repurposing')
        .select('*')
        .eq('id', repurposingId)
        .single();

      if (!repurposing) throw new Error('Repurposing record not found');

      // Fetch source content
      const sourceContent = await this.fetchSourceContent(
        repurposing.source_content_id,
        repurposing.source_type,
        repurposing.source_platform
      );

      if (!sourceContent) {
        throw new Error('Source content not found');
      }

      // Generate adapted content for each target platform
      const generatedContent: GeneratedContent[] = [];

      for (const platform of repurposing.target_platforms) {
        const adapted = await this.adaptContentForPlatform(
          sourceContent,
          platform,
          repurposing.repurposing_strategy,
          repurposing.processing_notes
        );

        generatedContent.push(adapted);
      }

      // Update repurposing record with generated content
      await supabase
        .from('content_repurposing')
        .update({
          status: RepurposingStatus.COMPLETED,
          generated_content: generatedContent
        })
        .eq('id', repurposingId);

      // Schedule posts if needed
      if (repurposing.scheduled_for) {
        await this.scheduleGeneratedContent(generatedContent, repurposing);
      }
    } catch (error) {
      console.error('Error processing content repurposing:', error);

      await supabase
        .from('content_repurposing')
        .update({
          status: RepurposingStatus.FAILED,
          processing_notes: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
        })
        .eq('id', repurposingId);
    }
  }

  /**
   * Fetch source content from database
   */
  private async fetchSourceContent(
    contentId: string,
    contentType: ContentType,
    platform?: SocialPlatform
  ): Promise<any> {
    try {
      switch (contentType) {
        case 'blog_post':
          const { data: blogPost } = await supabase
            .from('blog_posts')
            .select('*')
            .eq('id', contentId)
            .single();
          return blogPost;

        case 'image':
        case 'video':
        case 'carousel':
          const { data: socialPost } = await supabase
            .from('social_posts')
            .select('*')
            .eq('id', contentId)
            .single();
          return socialPost;

        case 'testimonial':
          const { data: testimonial } = await supabase
            .from('client_testimonials')
            .select('*, services(*)')
            .eq('id', contentId)
            .single();
          return testimonial;

        default:
          throw new Error(`Unsupported content type: ${contentType}`);
      }
    } catch (error) {
      console.error('Error fetching source content:', error);
      return null;
    }
  }

  /**
   * Adapt content for specific platform
   */
  private async adaptContentForPlatform(
    sourceContent: any,
    targetPlatform: SocialPlatform,
    strategy: RepurposingStrategy,
    customInstructions?: string
  ): Promise<GeneratedContent> {
    const rules = PLATFORM_ADAPTATION_RULES[targetPlatform];

    let generated: GeneratedContent = {
      platform: targetPlatform,
      title: '',
      content: '',
      hashtags: [],
      mentions: [],
      media_specs: rules.mediaSpecs,
      posting_recommendations: {
        optimal_times: rules.optimalPostingTimes,
        best_formats: rules.bestPerformingFormats,
        tone_guidelines: rules.tone
      },
      engagement_prediction: this.predictEngagement(sourceContent, targetPlatform)
    };

    // Apply repurposing strategy
    switch (strategy) {
      case 'cross_platform':
        generated = await this.applyCrossPlatformStrategy(sourceContent, targetPlatform, generated);
        break;
      case 'format_conversion':
        generated = await this.applyFormatConversionStrategy(sourceContent, targetPlatform, generated);
        break;
      case 'content_extension':
        generated = await this.applyContentExtensionStrategy(sourceContent, targetPlatform, generated);
        break;
      case 'snippet_extraction':
        generated = await this.applySnippetExtractionStrategy(sourceContent, targetPlatform, generated);
        break;
      case 'carousel_expansion':
        generated = await this.applyCarouselExpansionStrategy(sourceContent, targetPlatform, generated);
        break;
      case 'video_to_images':
        generated = await this.applyVideoToImagesStrategy(sourceContent, targetPlatform, generated);
        break;
      case 'blog_to_social':
        generated = await this.applyBlogToSocialStrategy(sourceContent, targetPlatform, generated);
        break;
      case 'testimonial_to_post':
        generated = await this.applyTestimonialToPostStrategy(sourceContent, targetPlatform, generated);
        break;
    }

    // Apply custom instructions if provided
    if (customInstructions) {
      generated = await this.applyCustomInstructions(generated, customInstructions);
    }

    // Optimize hashtags for platform
    generated.hashtags = this.optimizeHashtagsForPlatform(generated.hashtags, targetPlatform);

    // Add Polish market optimizations
    generated = this.addPolishMarketOptimizations(generated, sourceContent);

    return generated;
  }

  /**
   * Apply cross-platform strategy
   */
  private async applyCrossPlatformStrategy(
    sourceContent: any,
    targetPlatform: SocialPlatform,
    generated: GeneratedContent
  ): Promise<GeneratedContent> {
    const sourceType = this.detectContentType(sourceContent);
    const patterns = this.CONTENT_PATTERNS[sourceType as keyof typeof this.CONTENT_PATTERNS];

    if (patterns && patterns[targetPlatform as keyof typeof patterns]) {
      const adapted = patterns[targetPlatform as keyof typeof patterns](sourceContent);
      generated.title = adapted.title;
      generated.content = adapted.content;
      generated.hashtags = adapted.hashtags;
    } else {
      // Generic adaptation
      generated.title = sourceContent.title || 'Nowa treść';
      generated.content = this.adaptTextForPlatform(sourceContent.content || '', targetPlatform);
      generated.hashtags = this.generateRelevantHashtags(sourceContent, targetPlatform);
    }

    return generated;
  }

  /**
   * Apply format conversion strategy
   */
  private async applyFormatConversionStrategy(
    sourceContent: any,
    targetPlatform: SocialPlatform,
    generated: GeneratedContent
  ): Promise<GeneratedContent> {
    const sourceFormat = this.detectContentFormat(sourceContent);
    const targetFormat = this.getOptimalFormatForPlatform(targetPlatform);

    switch (sourceFormat) {
      case 'video':
        if (targetFormat === 'image') {
          generated.content = `🎥 Wyciąg z naszego wideo:\n\n${this.extractKeyPoints(sourceContent.content || '', 200)}`;
          generated.title = `📸 Moment z wideo: ${sourceContent.title}`;
        } else if (targetFormat === 'text') {
          generated.content = `Transkrypcja z wideo "${sourceContent.title}":\n\n${sourceContent.content}`;
          generated.title = `💬 Wideo w formie tekstu`;
        }
        break;

      case 'text':
        if (targetFormat === 'video') {
          generated.content = `🎬 Wideo na podstawie artykułu: "${sourceContent.title}"\n\nSprawdź nasz kanał!`;
          generated.title = `🎥 Wideo: ${sourceContent.title}`;
        } else if (targetFormat === 'image') {
          generated.content = `📨 Podsumowanie artykułu "${sourceContent.title}":\n\n${this.extractSummary(sourceContent.content, 150)}`;
          generated.title = `📄 ${sourceContent.title}`;
        }
        break;

      case 'image':
        if (targetFormat === 'text') {
          generated.content = `Opis zdjęcia "${sourceContent.title}":\n\n${sourceContent.caption || 'Piękny widok z naszej pracowni'}`;
          generated.title = `📝 Historia zdjęcia`;
        } else if (targetFormat === 'video') {
          generated.content = `🎬 Wideo inspirowane zdjęciem: "${sourceContent.title}"\n\nObejrzyj na naszym kanale!`;
          generated.title = `🎥 Od zdjęcia do wideo`;
        }
        break;
    }

    return generated;
  }

  /**
   * Apply content extension strategy
   */
  private async applyContentExtensionStrategy(
    sourceContent: any,
    targetPlatform: SocialPlatform,
    generated: GeneratedContent
  ): Promise<GeneratedContent> {
    const extendedContent = this.extendContent(sourceContent, targetPlatform);

    generated.title = `🔍 Rozszerzenie: ${sourceContent.title}`;
    generated.content = extendedContent;
    generated.hashtags = [...this.generateRelevantHashtags(sourceContent, targetPlatform), '#wiecej informacji', '#szczegoly'];

    return generated;
  }

  /**
   * Apply snippet extraction strategy
   */
  private async applySnippetExtractionStrategy(
    sourceContent: any,
    targetPlatform: SocialPlatform,
    generated: GeneratedContent
  ): Promise<GeneratedContent> {
    const snippet = this.extractBestSnippet(sourceContent, targetPlatform);

    generated.title = `💎 Fragment: ${sourceContent.title}`;
    generated.content = snippet;
    generated.hashtags = this.generateRelevantHashtags(sourceContent, targetPlatform);

    return generated;
  }

  /**
   * Apply carousel expansion strategy
   */
  private async applyCarouselExpansionStrategy(
    sourceContent: any,
    targetPlatform: SocialPlatform,
    generated: GeneratedContent
  ): Promise<GeneratedContent> {
    if (targetPlatform !== 'instagram') {
      // Convert to other format
      return this.applyCrossPlatformStrategy(sourceContent, targetPlatform, generated);
    }

    const carouselSlides = this.createCarouselSlides(sourceContent);

    generated.title = `📊 ${sourceContent.title}`;
    generated.content = carouselSlides.map((slide, index) =>
      `Slajd ${index + 1}: ${slide.title}\n\n${slide.content}`
    ).join('\n\n---\n\n');

    generated.hashtags = this.generateRelevantHashtags(sourceContent, targetPlatform);

    return generated;
  }

  /**
   * Apply video to images strategy
   */
  private async applyVideoToImagesStrategy(
    sourceContent: any,
    targetPlatform: SocialPlatform,
    generated: GeneratedContent
  ): Promise<GeneratedContent> {
    const keyframes = this.extractVideoKeyframes(sourceContent);

    generated.title = `📸 Kluczowe momenty z wideo: ${sourceContent.title}`;
    generated.content = keyframes.map((frame, index) =>
      `📸 Moment ${index + 1}: ${frame.description}`
    ).join('\n\n');

    generated.hashtags = this.generateRelevantHashtags(sourceContent, targetPlatform);

    return generated;
  }

  /**
   * Apply blog to social strategy
   */
  private async applyBlogToSocialStrategy(
    sourceContent: any,
    targetPlatform: SocialPlatform,
    generated: GeneratedContent
  ): Promise<GeneratedContent> {
    return this.applyCrossPlatformStrategy(sourceContent, targetPlatform, generated);
  }

  /**
   * Apply testimonial to post strategy
   */
  private async applyTestimonialToPostStrategy(
    sourceContent: any,
    targetPlatform: SocialPlatform,
    generated: GeneratedContent
  ): Promise<GeneratedContent> {
    return this.applyCrossPlatformStrategy(sourceContent, targetPlatform, generated);
  }

  /**
   * Apply custom instructions
   */
  private async applyCustomInstructions(
    generated: GeneratedContent,
    instructions: string
  ): Promise<GeneratedContent> {
    // Parse custom instructions and modify content accordingly
    const instructions_lower = instructions.toLowerCase();

    if (instructions_lower.includes('dodaj emoji')) {
      generated.content = this.addEmojisToContent(generated.content);
    }

    if (instructions_lower.includes 'dodaj wezwanie do dzialania') {
      generated.content += '\n\n📅 Zarezerwuj wizytę: link w bio!';
    }

    if (instructions_lower.includes('skroc tekst')) {
      generated.content = this.extractKeyPoints(generated.content, 200);
    }

    if (instructions_lower.includes('rozwin temat')) {
      generated.content = this.expandContent(generated.content);
    }

    return generated;
  }

  /**
   * Helper methods for content generation
   */

  private extractKeyPoints(content: string, maxLength: number): string {
    const sentences = content.match(/[^.!?]+[.!?]+/g) || [];
    let result = '';

    for (const sentence of sentences) {
      if (result.length + sentence.length > maxLength) break;
      result += sentence;
    }

    return result.trim();
  }

  private extractSummary(content: string, maxLength: number): string {
    if (content.length <= maxLength) return content;
    return content.substring(0, maxLength - 3) + '...';
  }

  private adaptTextForPlatform(content: string, platform: SocialPlatform): string {
    const rules = PLATFORM_ADAPTATION_RULES[platform];

    if (content.length > rules.contentLength.max) {
      content = content.substring(0, rules.contentLength.max - 3) + '...';
    }

    // Platform-specific formatting
    switch (platform) {
      case 'instagram':
        content = content.replace(/\. /g, '.\n\n');
        break;
      case 'linkedin':
        content = content.replace(/!/g, '.');
        break;
      case 'tiktok':
        content = content.replace(/\./g, '!');
        break;
    }

    return content;
  }

  private generateRelevantHashtags(content: any, platform: SocialPlatform): string[] {
    const rules = PLATFORM_ADAPTATION_RULES[platform];
    const baseHashtags = ['#mariiahub', '#warszawa'];

    // Extract hashtags based on content type
    if (content.service_type) {
      const serviceHashtags = {
        beauty: ['#beauty', '#kosmetika', '#piekno'],
        fitness: ['#fitness', '#sport', '#zdrowie'],
        lifestyle: ['#lifestyle', '#styl', '#elegancja']
      };
      baseHashtags.push(...(serviceHashtags[content.service_type as keyof typeof serviceHashtags] || []));
    }

    // Add category-specific hashtags
    if (content.category) {
      baseHashtags.push(`#${content.category.toLowerCase().replace(/\s+/g, '')}`);
    }

    return baseHashtags.slice(0, rules.hashtagStrategy.count);
  }

  private optimizeHashtagsForPlatform(hashtags: string[], platform: SocialPlatform): string[] {
    const rules = PLATFORM_ADAPTATION_RULES[platform];
    return hashtags.slice(0, rules.hashtagStrategy.count);
  }

  private addPolishMarketOptimizations(generated: GeneratedContent, sourceContent: any): GeneratedContent {
    // Add Warsaw-specific elements
    if (!generated.content.includes('Warszawa') && !generated.content.includes('warszawa')) {
      generated.content += '\n\n📍 Warszawa';
    }

    // Add Polish-specific call to action
    if (!generated.content.includes('link w bio') && !generated.content.includes('zarezerwuj')) {
      generated.content += '\n\n📅 Zarezerwuj wizytę: link w bio!';
    }

    // Add Polish holidays and seasonal content
    const currentSeason = this.getCurrentSeason();
    const seasonalEmojis = {
      spring: '🌸',
      summer: '☀️',
      autumn: '🍂',
      winter: '❄️'
    };

    if (seasonalEmojis[currentSeason as keyof typeof seasonalEmojis]) {
      generated.title = `${seasonalEmojis[currentSeason as keyof typeof seasonalEmojis]} ${generated.title}`;
    }

    return generated;
  }

  private predictEngagement(content: any, platform: SocialPlatform): number {
    // Simple engagement prediction based on content characteristics
    let score = 50; // Base score

    // Boost for visual content
    if (content.image_urls && content.image_urls.length > 0) {
      score += 20;
    }

    // Boost for video content
    if (content.video_url) {
      score += 25;
    }

    // Boost for testimonials
    if (content.rating || content.testimonial) {
      score += 15;
    }

    // Platform-specific adjustments
    const platformMultipliers = {
      instagram: 1.2,
      tiktok: 1.3,
      facebook: 1.0,
      linkedin: 0.8,
      pinterest: 1.1,
      youtube: 1.15,
      blog: 0.7,
      email: 0.6
    };

    score *= platformMultipliers[platform] || 1.0;

    return Math.min(100, Math.round(score));
  }

  private getCurrentSeason(): string {
    const month = new Date().getMonth();
    if (month >= 2 && month <= 4) return 'spring';
    if (month >= 5 && month <= 7) return 'summer';
    if (month >= 8 && month <= 10) return 'autumn';
    return 'winter';
  }

  private detectContentType(content: any): string {
    if (content.testimonial || content.rating) return 'testimonial';
    if (content.content && content.title && content.excerpt) return 'blog_post';
    if (content.post_type || content.platform) return 'social_post';
    return 'unknown';
  }

  private detectContentFormat(content: any): string {
    if (content.video_url) return 'video';
    if (content.image_urls && content.image_urls.length > 1) return 'carousel';
    if (content.image_urls && content.image_urls.length === 1) return 'image';
    return 'text';
  }

  private getOptimalFormatForPlatform(platform: SocialPlatform): string {
    const optimalFormats = {
      instagram: 'carousel',
      tiktok: 'video',
      youtube: 'video',
      pinterest: 'image',
      facebook: 'image',
      linkedin: 'text',
      blog: 'text',
      email: 'image'
    };

    return optimalFormats[platform] || 'text';
  }

  private extendContent(content: any, platform: SocialPlatform): string {
    let extended = content.content || '';

    // Add related information
    if (content.service_id) {
      extended += '\n\n💡 Dodatkowe informacje:';
      extended += '\n• Profesjonalne podejście';
      extended += '\n• Najwyższej jakości produkty';
      extended += '\n• Indywidualny dobór zabiegów';
    }

    // Add benefits
    extended += '\n\n✨ Korzyści:';
    extended += '\n• Poprawa wyglądu';
    extended += '\n• Zwiększenie pewności siebie';
    extended += '\n• Relaks i odprężenie';

    return extended;
  }

  private extractBestSnippet(content: any, platform: SocialPlatform): string {
    const text = content.content || content.testimonial || '';
    const sentences = text.match(/[^.!?]+[.!?]+/g) || [];

    // Return the most impactful sentence
    return sentences[0] || text.substring(0, 100);
  }

  private createCarouselSlides(content: any): Array<{ title: string; content: string }> {
    const slides = [
      { title: 'Wprowadzenie', content: 'Poznaj naszą ofertę...' },
      { title: 'Korzyści', content: 'Dlaczego warto wybrać nas...' },
      { title: 'Szczegóły', content: 'Wszystko co musisz wiedzieć...' },
      { title: 'Rezerwacja', content: 'Jak umówić wizytę...' }
    ];

    return slides;
  }

  private extractVideoKeyframes(content: any): Array<{ description: string }> {
    return [
      { description: 'Początek zabiegu - konsultacja' },
      { description: 'Przygotowanie skóry' },
      { description: 'Główna część zabiegu' },
      { description: 'Efekty po zabiegu' }
    ];
  }

  private addEmojisToContent(content: string): string {
    const emojiMap = {
      'pielęgnacja': '💆‍♀️',
      'uroda': '✨',
      'zabieg': '💅',
      'efekty': '🌟',
      'profesjonalny': '👩‍⚕️',
      'warszawa': '🏰',
      'rezerwacja': '📅'
    };

    let result = content;
    Object.entries(emojiMap).forEach(([word, emoji]) => {
      const regex = new RegExp(word, 'gi');
      result = result.replace(regex, `${emoji} ${word}`);
    });

    return result;
  }

  private expandContent(content: string): string {
    return `${content}\n\n💡 Więcej informacji:\n\nZapraszamy do naszej pracowni w centrum Warszawy, gdzie oferujemy profesjonalne usługi z najwyższą starannością o każdy detal.\n\nNasi specjaliści to doświadczeni profesjonaliści z pasją do tego, co robią.`;
  }

  /**
   * Schedule generated content posts
   */
  private async scheduleGeneratedContent(
    generatedContent: GeneratedContent[],
    repurposing: any
  ): Promise<void> {
    for (const content of generatedContent) {
      try {
        await supabase
          .from('social_posts')
          .insert({
            title: content.title,
            content: content.content,
            platform: content.platform,
            post_type: this.mapContentType(content.platform),
            hashtags: content.hashtags,
            mentions: content.mentions,
            status: 'scheduled',
            scheduled_at: repurposing.scheduled_for,
            priority: this.mapPriority(repurposing.priority),
            campaign_id: repurposing.campaign_id,
            auto_generated: true,
            platform_specific_data: content.posting_recommendations
          });
      } catch (error) {
        console.error(`Error scheduling post for ${content.platform}:`, error);
      }
    }
  }

  private mapContentType(platform: SocialPlatform): string {
    const contentTypeMap = {
      instagram: 'carousel',
      tiktok: 'video',
      youtube: 'video',
      facebook: 'regular',
      linkedin: 'article',
      pinterest: 'image',
      blog: 'blog_post',
      email: 'email'
    };

    return contentTypeMap[platform] || 'regular';
  }

  private mapPriority(priority: RepurposingPriority): string {
    const priorityMap = {
      low: 'low',
      medium: 'normal',
      high: 'high',
      urgent: 'urgent'
    };

    return priorityMap[priority] || 'normal';
  }

  // Content generation methods for specific types
  private extractKeyPoints(content: string, maxLength: number): string {
    const sentences = content.match(/[^.!?]+[.!?]+/g) || [];
    let result = '';

    for (const sentence of sentences) {
      if (result.length + sentence.length > maxLength) break;
      result += sentence;
    }

    return result.trim();
  }

  private generateBlogHashtags(blog: any): string[] {
    return ['#blog', '#artykul', '#wiedza', '#porady', '#beautypolska', '#warszawa'];
  }

  private generateProfessionalHashtags(content?: any): string[] {
    return ['#professional', '#business', '#warsaw', '#expert', '#industry'];
  }

  private generateServiceHashtags(service: any): string[] {
    const base = ['#usluga', '#zabieg', '#piekno', '#warszawa'];
    if (service.category) base.push(`#${service.category.toLowerCase()}`);
    return base;
  }

  private generateTikTokHashtags(service: any): string[] {
    return ['#fyp', '#warsaw', '#beauty', '#zabieg', '#tiktok', '#viral'];
  }

  private generateTestimonialHashtags(): string[] {
    return ['#opinie', '#testimonials', '#klienci', '#zaufanie', '#recommendations'];
  }

  private generateServiceInstagram(service: any): string {
    return `✨ ${service.title} ✨\n\n${service.description || 'Profesjonalny zabieg w Warszawie'}\n\n⏰ Czas: ${service.duration_minutes} min\n💰 Cena: ${service.price} ${service.currency}\n\n📅 Zarezerwuj wizytę i poczuj się wyjątkowo!`;
  }

  private generateServiceFacebook(service: any): string {
    return `Zapraszamy na zabieg ${service.title}! 🌟\n\n${service.description || 'Profesjonalne usługi kosmetyczne'}\n\nCzas trwania: ${service.duration_minutes} min\nCena: ${service.price} ${service.currency}\n\nZapewniamy najwyższą jakość i indywidualne podejście.`;
  }

  private generateServiceLinkedIn(service: any): string {
    return `Profesjonalny zabieg ${service.title} w Warszawie\n\nSpecjalizujemy się w ${service.service_type === 'beauty' ? 'usługach kosmetycznych' : 'treningach fitness'} z wykorzystaniem najnowszych technologii i sprawdzonych metod.\n\n${service.description || 'Nasza oferta skierowana jest do wymagających klientów.'}`;
  }

  private generateServiceTikTok(service: any): string {
    return `${service.title} 💅\n\nZobacz efekty! 🤩\n\n#warsaw #beauty #zabieg #fyp`;
  }

  private generateTestimonialInstagram(testimonial: any): string {
    return `"${testimonial.testimonial}" - ${testimonial.display_name || testimonial.client_name}\n\n⭐ Ocena: ${'⭐'.repeat(testimonial.rating)}\n\nDziękujemy za zaufanie! ❤️`;
  }

  private generateTestimonialFacebook(testimonial: any): string {
    return `Co mówią o nas klientki?\n\n"${testimonial.testimonial}"\n\n- ${testimonial.display_name || testimonial.client_name}\nOcena: ${testimonial.rating}/5 ⭐\n\nWasze opinie są dla nas najważniejsze!`;
  }

  private generateTestimonialLinkedIn(testimonial: any): string {
    return `Zaufanie klientów - najlepsza rekomendacja\n\n"${testimonial.testimonial}"\n\n- ${testimonial.display_name || testimonial.client_name}\nOcena: ${testimonial.rating}/5\n\nDziękujemy za zaufanie i zapewniamy, że każdego dnia staramy się zasłużyć na najlepsze opinie.`;
  }

  private generateLinkedInArticle(blog: any): string {
    return `${blog.title}\n\n${this.extractKeyPoints(blog.content, 800)}\n\nW naszym artykule omawiamy kluczowe aspekty dotyczące ${blog.category || 'branży beauty'}. Zachęcamy do lektury i dyskusji.`;
  }

  private extractSummary(content: string, maxLength: number): string {
    if (content.length <= maxLength) return content;
    return content.substring(0, maxLength - 3) + '...';
  }
}

// Export singleton instance
export const contentDistribution = new ContentDistributionService();