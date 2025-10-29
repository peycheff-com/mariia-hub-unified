import { z } from 'zod';

import { getEnhancedAIService, AIService, ContentOptions, GeneratedContent } from '../core/AIService';

// Content Generation Schemas
export const BlogPostRequestSchema = z.object({
  topic: z.string().min(1),
  category: z.string().optional(),
  targetAudience: z.string().optional(),
  tone: z.enum(['professional', 'friendly', 'casual', 'luxury']).default('luxury'),
  wordCount: z.number().min(100).max(3000).default(1000),
  language: z.enum(['en', 'pl']).default('en'),
  seoKeywords: z.array(z.string()).optional(),
  includeCallToAction: z.boolean().default(true),
  brandVoice: z.string().optional(),
});

export const ServiceDescriptionRequestSchema = z.object({
  serviceName: z.string().min(1),
  category: z.string(),
  features: z.array(z.string()).optional(),
  benefits: z.array(z.string()).optional(),
  targetAudience: z.string().optional(),
  tone: z.enum(['professional', 'friendly', 'casual', 'luxury']).default('luxury'),
  wordCount: z.number().min(200).max(1500).default(500),
  language: z.enum(['en', 'pl']).default('en'),
  includePreparation: z.boolean().default(true),
  includeAftercare: z.boolean().default(true),
  includeFAQ: z.boolean().default(true),
  includePricing: z.boolean().default(false),
  priceRange: z.string().optional(),
});

export const EmailTemplateRequestSchema = z.object({
  templateType: z.enum(['welcome', 'booking-confirmation', 'reminder', 'follow-up', 'promotion', 'newsletter']),
  recipient: z.string(),
  subject: z.string().optional(),
  mainMessage: z.string().optional(),
  customData: z.record(z.any()).optional(),
  tone: z.enum(['professional', 'friendly', 'casual', 'luxury']).default('professional'),
  language: z.enum(['en', 'pl']).default('en'),
  includePersonalization: z.boolean().default(true),
});

export const SocialMediaPostSchema = z.object({
  platform: z.enum(['instagram', 'facebook', 'twitter', 'linkedin', 'tiktok']),
  topic: z.string().min(1),
  contentType: z.enum(['image-caption', 'story', 'carousel', 'video-script', 'announcement']).default('image-caption'),
  tone: z.enum(['professional', 'friendly', 'casual', 'luxury']).default('luxury'),
  language: z.enum(['en', 'pl']).default('en'),
  includeHashtags: z.boolean().default(true),
  includeEmojis: z.boolean().default(true),
  targetAudience: z.string().optional(),
  campaign: z.string().optional(),
});

export interface BlogPostRequest extends z.infer<typeof BlogPostRequestSchema> {}
export interface ServiceDescriptionRequest extends z.infer<typeof ServiceDescriptionRequestSchema> {}
export interface EmailTemplateRequest extends z.infer<typeof EmailTemplateRequestSchema> {}
export interface SocialMediaPostRequest extends z.infer<typeof SocialMediaPostSchema> {}

export interface GeneratedBlogPost {
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  seoTitle: string;
  metaDescription: string;
  tags: string[];
  readingTime: number;
  callToAction?: string;
  faq?: Array<{ question: string; answer: string }>;
}

export interface GeneratedServiceDescription {
  shortDescription: string;
  detailedDescription: string;
  keyBenefits: string[];
  preparation?: string;
  aftercare?: string;
  whatToExpect: string;
  faq?: Array<{ question: string; answer: string }>;
  pricingInfo?: string;
  contraindications?: string[];
  suitability?: string;
}

export interface GeneratedEmailTemplate {
  subject: string;
  htmlContent: string;
  textContent: string;
  personalizationTokens: string[];
  previewText: string;
  senderName?: string;
  replyTo?: string;
}

export interface GeneratedSocialMediaPost {
  content: string;
  hashtags: string[];
  emojis?: string[];
  mediaSuggestions?: string[];
  callToAction?: string;
  engagementPredictors?: string[];
  optimalPostingTime?: string;
}

export class ContentGenerator {
  private aiService: AIService;

  constructor(aiService?: AIService) {
    this.aiService = aiService || getEnhancedAIService();
  }

  // Blog Post Generation
  async generateBlogPost(request: BlogPostRequest): Promise<GeneratedBlogPost> {
    const validatedRequest = BlogPostRequestSchema.parse(request);

    const systemPrompt = `You are an expert content writer for a premium beauty and fitness platform in Warsaw.
    Create sophisticated, engaging blog content that appeals to high-end clients.
    Write in ${validatedRequest.language === 'pl' ? 'Polish' : 'English'}.
    Use a ${validatedRequest.tone} tone that conveys luxury and expertise.
    ${validatedRequest.brandVoice ? `Maintain this brand voice: ${validatedRequest.brandVoice}` : ''}

    Your content should:
    - Be informative and valuable
    - Include SEO best practices
    - Have proper structure (headings, paragraphs, lists)
    - Sound authoritative yet approachable
    - Include actionable tips when appropriate`;

    const keywordsText = validatedRequest.seoKeywords
      ? `Naturally incorporate these SEO keywords: ${validatedRequest.seoKeywords.join(', ')}`
      : '';

    const ctaText = validatedRequest.includeCallToAction
      ? 'Include a compelling call-to-action at the end.'
      : '';

    const prompt = `Write a ${validatedRequest.wordCount}-word blog post about "${validatedRequest.topic}".

    Details:
    ${validatedRequest.category ? `Category: ${validatedRequest.category}` : ''}
    ${validatedRequest.targetAudience ? `Target Audience: ${validatedRequest.targetAudience}` : ''}
    ${keywordsText}
    ${ctaText}

    Format the response as JSON with:
    {
      "title": "SEO-optimized, compelling title",
      "slug": "url-friendly-slug",
      "content": "Full blog post in markdown format",
      "excerpt": "150-character compelling excerpt",
      "seoTitle": "SEO title under 60 characters",
      "metaDescription": "Meta description under 160 characters",
      "tags": ["tag1", "tag2", "tag3", "tag4", "tag5"],
      "readingTime": 5,
      "callToAction": "Compelling CTA text",
      "faq": [{"question": "Common question", "answer": "Detailed answer"}]
    }

    Make sure the content is well-structured with H2 and H3 headings, bullet points, and short paragraphs.
    Include practical tips, expert insights, and maintain luxury positioning throughout.`;

    const result = await this.aiService.generateContent(prompt, {
      tone: validatedRequest.tone,
      language: validatedRequest.language,
      temperature: 0.7,
      brandVoice: validatedRequest.brandVoice,
      targetAudience: validatedRequest.targetAudience,
    });

    try {
      const blogPost = JSON.parse(result.content);
      return blogPost;
    } catch (error) {
      console.error('Failed to parse blog post:', error);
      throw new Error('Invalid blog post format from AI');
    }
  }

  // Batch Blog Post Generation
  async generateBlogPostBatch(requests: BlogPostRequest[]): Promise<GeneratedBlogPost[]> {
    const results: GeneratedBlogPost[] = [];

    for (const request of requests) {
      try {
        const blogPost = await this.generateBlogPost(request);
        results.push(blogPost);
      } catch (error) {
        console.error('Failed to generate blog post for:', request.topic, error);
        // Continue with other posts even if one fails
      }
    }

    return results;
  }

  // Service Description Generation
  async generateServiceDescription(request: ServiceDescriptionRequest): Promise<GeneratedServiceDescription> {
    const validatedRequest = ServiceDescriptionRequestSchema.parse(request);

    const systemPrompt = `You are a luxury beauty and fitness service description writer.
    Create compelling, professional descriptions that highlight premium quality, results, and unique value propositions.
    Write in ${validatedRequest.language === 'pl' ? 'Polish' : 'English'}.
    Use a ${validatedRequest.tone} tone that conveys expertise, luxury, and trustworthiness.`;

    const featuresText = validatedRequest.features
      ? `Key features: ${validatedRequest.features.join(', ')}`
      : '';

    const benefitsText = validatedRequest.benefits
      ? `Main benefits: ${validatedRequest.benefits.join(', ')}`
      : '';

    const pricingText = validatedRequest.includePricing && validatedRequest.priceRange
      ? `Price range: ${validatedRequest.priceRange}`
      : '';

    const prompt = `Create a comprehensive service description for "${validatedRequest.serviceName}" in the ${validatedRequest.category} category.

    Details:
    ${validatedRequest.targetAudience ? `Target Audience: ${validatedRequest.targetAudience}` : ''}
    ${featuresText}
    ${benefitsText}
    ${pricingText}
    Word count: approximately ${validatedRequest.wordCount} words

    Format as JSON with:
    {
      "shortDescription": "2-3 compelling sentences",
      "detailedDescription": "Full description with benefits and features in markdown",
      "keyBenefits": ["Benefit 1", "Benefit 2", "Benefit 3", "Benefit 4"],
      "preparation": "How to prepare for the service",
      "aftercare": "Post-service care instructions",
      "whatToExpect": "Step-by-step of what happens during the service",
      "faq": [{"question": "Common question", "answer": "Detailed answer"}],
      "pricingInfo": "Pricing details",
      "contraindications": ["When to avoid this service"],
      "suitability": "Who this service is perfect for"
    }

    ${validatedRequest.includePreparation ? 'Include preparation instructions.' : ''}
    ${validatedRequest.includeAftercare ? 'Include aftercare instructions.' : ''}
    ${validatedRequest.includeFAQ ? 'Include 3-5 relevant FAQs.' : ''}

    Focus on results, experience, and luxury positioning. Use persuasive language that builds trust.`;

    const result = await this.aiService.generateContent(prompt, {
      tone: validatedRequest.tone,
      language: validatedRequest.language,
      temperature: 0.6,
    });

    try {
      const description = JSON.parse(result.content);
      return description;
    } catch (error) {
      console.error('Failed to parse service description:', error);
      throw new Error('Invalid service description format from AI');
    }
  }

  // Email Template Generation
  async generateEmailTemplate(request: EmailTemplateRequest): Promise<GeneratedEmailTemplate> {
    const validatedRequest = EmailTemplateRequestSchema.parse(request);

    const templateInstructions = {
      'welcome': 'Introduce the brand, highlight key services, and encourage first booking',
      'booking-confirmation': 'Confirm appointment details, include preparation info, and add value',
      'reminder': 'Gentle reminder with appointment details and preparation tips',
      'follow-up': 'Post-service care, feedback request, and next service suggestion',
      'promotion': 'Announce special offers with urgency and clear call-to-action',
      'newsletter': 'Share valuable content, updates, and personalized recommendations'
    };

    const systemPrompt = `You are an expert email copywriter for a luxury beauty and fitness brand.
    Create compelling, personalized emails that build relationships and drive action.
    Write in ${validatedRequest.language === 'pl' ? 'Polish' : 'English'}.
    Use a ${validatedRequest.tone} tone that reflects the premium nature of the brand.`;

    const prompt = `Generate a ${validatedRequest.templateType} email template.

    Recipient: ${validatedRequest.recipient}
    ${validatedRequest.subject ? `Subject hint: ${validatedRequest.subject}` : ''}
    ${validatedRequest.mainMessage ? `Key message: ${validatedRequest.mainMessage}` : ''}
    ${validatedRequest.customData ? `Custom data: ${JSON.stringify(validatedRequest.customData)}` : ''}

    Instructions: ${templateInstructions[validatedRequest.templateType]}

    Format as JSON with:
    {
      "subject": "Compelling subject line",
      "htmlContent": "Full HTML email with proper formatting",
      "textContent": "Plain text version",
      "personalizationTokens": ["[name]", "[service]", "[date]"],
      "previewText": "Preview text for email clients",
      "senderName": "Suggested sender name",
      "replyTo": "Suggested reply-to address"
    }

    ${validatedRequest.includePersonalization ? 'Include personalization tokens like [name], [service], [date].' : ''}

    Ensure the email is mobile-friendly, has clear CTAs, and follows email marketing best practices.`;

    const result = await this.aiService.generateContent(prompt, {
      tone: validatedRequest.tone,
      language: validatedRequest.language,
      temperature: 0.6,
    });

    try {
      const template = JSON.parse(result.content);
      return template;
    } catch (error) {
      console.error('Failed to parse email template:', error);
      throw new Error('Invalid email template format from AI');
    }
  }

  // Social Media Post Generation
  async generateSocialMediaPost(request: SocialMediaPostRequest): Promise<GeneratedSocialMediaPost> {
    const validatedRequest = SocialMediaPostSchema.parse(request);

    const platformGuidelines = {
      instagram: {
        maxLength: 2200,
        hashtagLimit: 30,
        bestPractices: 'Visual-first, storytelling, use emojis, engage with questions'
      },
      facebook: {
        maxLength: 63206,
        hashtagLimit: 10,
        bestPractices: 'Informative, link sharing, community building'
      },
      twitter: {
        maxLength: 280,
        hashtagLimit: 3,
        bestPractices: 'Concise, timely, use hashtags sparingly'
      },
      linkedin: {
        maxLength: 3000,
        hashtagLimit: 10,
        bestPractices: 'Professional, value-driven, industry insights'
      },
      tiktok: {
        maxLength: 150,
        hashtagLimit: 5,
        bestPractices: 'Trendy, authentic, use trending sounds/challenges'
      }
    };

    const guidelines = platformGuidelines[validatedRequest.platform];

    const systemPrompt = `You are a social media expert for luxury beauty and fitness brands.
    Create engaging content that drives engagement and maintains brand prestige.
    Write in ${validatedRequest.language === 'pl' ? 'Polish' : 'English'}.
    Use a ${validatedRequest.tone} tone appropriate for ${validatedRequest.platform}.`;

    const prompt = `Generate a ${validatedRequest.contentType} post for ${validatedRequest.platform}.

    Topic: ${validatedRequest.topic}
    ${validatedRequest.targetAudience ? `Target Audience: ${validatedRequest.targetAudience}` : ''}
    ${validatedRequest.campaign ? `Campaign: ${validatedRequest.campaign}` : ''}

    Platform guidelines: ${guidelines.bestPractices}
    Max length: ${guidelines.maxLength} characters
    ${validatedRequest.includeHashtags ? `Include up to ${guidelines.hashtagLimit} relevant hashtags` : ''}

    Format as JSON with:
    {
      "content": "Main post content",
      "hashtags": ["hashtag1", "hashtag2", "hashtag3"],
      "emojis": ["✨", "💎", "🌟"],
      "mediaSuggestions": ["Image of...", "Video showing..."],
      "callToAction": "Clear CTA text",
      "engagementPredictors": ["Question to audience", "Poll suggestion"],
      "optimalPostingTime": "Best time to post"
    }

    ${validatedRequest.includeEmojis ? 'Include relevant emojis that match the luxury brand.' : ''}

    Ensure the content is platform-optimized, engaging, and maintains luxury positioning.`;

    const result = await this.aiService.generateContent(prompt, {
      tone: validatedRequest.tone,
      language: validatedRequest.language,
      temperature: 0.7,
    });

    try {
      const post = JSON.parse(result.content);
      return post;
    } catch (error) {
      console.error('Failed to parse social media post:', error);
      throw new Error('Invalid social media post format from AI');
    }
  }

  // Content Improvement Suggestions
  async improveContent(content: string, contentType: 'blog' | 'service' | 'email' | 'social'): Promise<{
    improvedContent: string;
    suggestions: string[];
    seoScore: number;
    readabilityScore: number;
  }> {
    const systemPrompt = `You are an expert content editor and optimizer.
    Analyze and improve content for better engagement, SEO, and readability.
    Provide constructive feedback and specific improvements.`;

    const prompt = `Analyze and improve this ${contentType} content:

    "${content}"

    Provide:
    1. Improved version of the content
    2. Specific suggestions for improvement
    3. SEO score (0-100)
    4. Readability score (0-100)

    Format as JSON with:
    {
      "improvedContent": "Enhanced version",
      "suggestions": ["Suggestion 1", "Suggestion 2", "Suggestion 3"],
      "seoScore": 85,
      "readabilityScore": 90
    }`;

    const result = await this.aiService.generateContent(prompt, { temperature: 0.3 });

    try {
      const analysis = JSON.parse(result.content);
      return analysis;
    } catch (error) {
      console.error('Failed to parse content improvement:', error);
      throw new Error('Invalid content improvement format from AI');
    }
  }

  // Content Calendar Generation
  async generateContentCalendar(
    timeFrame: 'week' | 'month' | 'quarter',
    themes: string[],
    platforms: string[] = ['instagram', 'facebook']
  ): Promise<Array<{
    date: string;
    platform: string;
    contentType: string;
    topic: string;
    status: 'idea' | 'draft' | 'scheduled' | 'published';
    priority: 'high' | 'medium' | 'low';
  }>> {
    const systemPrompt = `You are a content strategist for luxury beauty and fitness brands.
    Create a strategic content calendar that drives engagement and business goals.`;

    const prompt = `Generate a ${timeFrame} content calendar.

    Themes to cover: ${themes.join(', ')}
    Platforms: ${platforms.join(', ')}
    Target audience: High-end clients in Warsaw

    Format as JSON array with:
    [{
      "date": "2024-01-15",
      "platform": "instagram",
      "contentType": "carousel",
      "topic": "Winter skincare routine",
      "status": "idea",
      "priority": "high"
    }]

    Ensure variety in content types, platforms, and themes. Include seasonal relevance.`;

    const result = await this.aiService.generateContent(prompt, { temperature: 0.4 });

    try {
      const calendar = JSON.parse(result.content);
      return Array.isArray(calendar) ? calendar : [];
    } catch (error) {
      console.error('Failed to parse content calendar:', error);
      throw new Error('Invalid content calendar format from AI');
    }
  }
}

// Export singleton
let contentGeneratorInstance: ContentGenerator | null = null;

export function getContentGenerator(): ContentGenerator {
  if (!contentGeneratorInstance) {
    contentGeneratorInstance = new ContentGenerator();
  }
  return contentGeneratorInstance;
}