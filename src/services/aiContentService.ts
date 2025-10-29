import OpenAI from 'openai';

import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';

// Enhanced AI Content Service Configuration
export interface AIContentConfig {
  openai?: {
    apiKey: string;
    model?: string;
    baseURL?: string;
  };
  rateLimits?: {
    requestsPerMinute: number;
    tokensPerMinute: number;
  };
  brandVoice?: {
    tone: 'professional' | 'friendly' | 'luxury' | 'casual';
    style: string;
    guidelines: string[];
  };
}

// Content Generation Types
export interface BlogPostGenerationRequest {
  topic: string;
  category?: string;
  targetAudience?: string;
  tone: 'professional' | 'friendly' | 'casual' | 'luxury';
  wordCount: number;
  language: 'en' | 'pl' | 'ru' | 'ua';
  seoKeywords?: string[];
  includeCallToAction: boolean;
  brandVoice?: string;
  outline?: string[];
  includeImages: boolean;
}

export interface ServiceDescriptionRequest {
  serviceName: string;
  category: string;
  features?: string[];
  benefits?: string[];
  targetAudience?: string;
  tone: 'professional' | 'friendly' | 'casual' | 'luxury';
  wordCount: number;
  language: 'en' | 'pl' | 'ru' | 'ua';
  includePreparation: boolean;
  includeAftercare: boolean;
  includeFAQ: boolean;
  includePricing: boolean;
  priceRange?: string;
  variations: number; // Number of variations to generate
}

export interface ContentImprovementRequest {
  content: string;
  contentType: 'blog' | 'service' | 'email' | 'social';
  improvements: string[];
  targetKeywords?: string[];
  maintainTone: boolean;
  optimizeForSEO: boolean;
}

export interface GeneratedContent {
  id?: string;
  type: 'blog' | 'service' | 'email' | 'social';
  title?: string;
  slug?: string;
  content: string;
  excerpt?: string;
  seoTitle?: string;
  metaDescription?: string;
  tags?: string[];
  readingTime?: number;
  variations?: string[];
  qualityScore?: number;
  seoScore?: number;
  suggestions?: string[];
  metadata?: Record<string, any>;
}

export interface ContentGenerationResult {
  success: boolean;
  content?: GeneratedContent;
  error?: string;
  usage?: {
    tokensUsed: number;
    cost: number;
  };
}

// Rate Limiting Manager
class RateLimiter {
  private requests: number[] = [];
  private tokens: number[] = [];
  private readonly requestsPerMinute: number;
  private readonly tokensPerMinute: number;

  constructor(requestsPerMinute = 60, tokensPerMinute = 150000) {
    this.requestsPerMinute = requestsPerMinute;
    this.tokensPerMinute = tokensPerMinute;
  }

  async checkLimit(tokens: number): Promise<void> {
    const now = Date.now();
    const oneMinuteAgo = now - 60000;

    // Clean old entries
    this.requests = this.requests.filter(time => time > oneMinuteAgo);
    this.tokens = this.tokens.filter(time => time > oneMinuteAgo);

    // Check limits
    if (this.requests.length >= this.requestsPerMinute) {
      const waitTime = 60000 - (now - this.requests[0]);
      throw new Error(`Rate limit exceeded. Wait ${Math.ceil(waitTime / 1000)} seconds.`);
    }

    if (this.tokens.reduce((a, b) => a + b, 0) + tokens > this.tokensPerMinute) {
      throw new Error('Token limit exceeded for this minute.');
    }

    // Record usage
    this.requests.push(now);
    this.tokens.push(tokens);
  }
}

// Content Quality Filter
class ContentFilter {
  private blockedWords: Set<string>;
  private medicalTerms: Set<string>;

  constructor() {
    this.blockedWords = new Set([
      // Add inappropriate words as needed
    ]);

    this.medicalTerms = new Set([
      'treatment', 'therapy', 'medical', 'clinical', 'diagnosis',
      'prescription', 'cure', 'heal', 'medication'
    ]);
  }

  filter(content: string, requiresFactChecking = false): {
    passed: boolean;
    issues: string[];
    requiresReview: boolean;
  } {
    const issues: string[] = [];
    const lowerContent = content.toLowerCase();

    // Check for blocked words
    for (const word of this.blockedWords) {
      if (lowerContent.includes(word)) {
        issues.push(`Contains inappropriate content: ${word}`);
      }
    }

    // Check for medical claims that need fact-checking
    if (requiresFactChecking) {
      for (const term of this.medicalTerms) {
        if (lowerContent.includes(term)) {
          issues.push(`Contains medical term that requires fact-checking: ${term}`);
        }
      }
    }

    // Check for quality indicators
    if (content.length < 100) {
      issues.push('Content too short');
    }

    if (content.split(' ').length < 50) {
      issues.push('Insufficient word count');
    }

    return {
      passed: issues.length === 0,
      issues,
      requiresReview: issues.length > 0
    };
  }
}

// Main AI Content Service
export class AIContentService {
  private openai: OpenAI | null = null;
  private rateLimiter: RateLimiter;
  private contentFilter: ContentFilter;
  private config: AIContentConfig;

  constructor(config: AIContentConfig) {
    this.config = config;
    this.rateLimiter = new RateLimiter(
      config.rateLimits?.requestsPerMinute || 60,
      config.rateLimits?.tokensPerMinute || 150000
    );
    this.contentFilter = new ContentFilter();

    if (config.openai?.apiKey) {
      this.openai = new OpenAI({
        apiKey: config.openai.apiKey,
        baseURL: config.openai.baseURL
      });
    }
  }

  // Generate Blog Post with Advanced Features
  async generateBlogPost(request: BlogPostGenerationRequest): Promise<ContentGenerationResult> {
    try {
      if (!this.openai) {
        throw new Error('OpenAI not configured');
      }

      // Estimate tokens
      const estimatedTokens = request.wordCount * 1.3;
      await this.rateLimiter.checkLimit(estimatedTokens);

      // Build system prompt
      const systemPrompt = this.buildBlogPostPrompt(request);

      // Build user prompt
      const userPrompt = this.buildBlogUserPrompt(request);

      // Generate content
      const completion = await this.openai.chat.completions.create({
        model: this.config.openai?.model || 'gpt-4-turbo-preview',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.7,
        max_tokens: estimatedTokens + 500,
        response_format: { type: 'json_object' }
      });

      const content = completion.choices[0]?.message?.content;
      if (!content) {
        throw new Error('No content generated');
      }

      // Parse response
      const generatedContent = JSON.parse(content);

      // Apply content filter
      const filterResult = this.contentFilter.filter(generatedContent.content, true);

      // Add metadata
      generatedContent.qualityScore = this.calculateQualityScore(generatedContent);
      generatedContent.seoScore = this.calculateSEOScore(generatedContent, request.seoKeywords || []);
      generatedContent.metadata = {
        generatedAt: new Date().toISOString(),
        model: this.config.openai?.model,
        tokensUsed: completion.usage?.total_tokens || 0,
        wordCount: request.wordCount,
        language: request.language,
        requiresReview: filterResult.requiresReview,
        filterIssues: filterResult.issues
      };

      // Log usage
      await this.logUsage('blog_generation', {
        tokensUsed: completion.usage?.total_tokens || 0,
        wordCount: request.wordCount,
        language: request.language,
        qualityScore: generatedContent.qualityScore,
        seoScore: generatedContent.seoScore
      });

      return {
        success: true,
        content: generatedContent,
        usage: {
          tokensUsed: completion.usage?.total_tokens || 0,
          cost: this.calculateCost(completion.usage?.total_tokens || 0)
        }
      };

    } catch (error: any) {
      logger.error('Error generating blog post:', error);

      await this.logUsage('blog_generation_error', {
        error: error.message,
        request: JSON.stringify(request)
      });

      return {
        success: false,
        error: error.message
      };
    }
  }

  // Generate Service Description with Variations
  async generateServiceDescription(request: ServiceDescriptionRequest): Promise<ContentGenerationResult> {
    try {
      if (!this.openai) {
        throw new Error('OpenAI not configured');
      }

      const estimatedTokens = request.wordCount * 1.3 * request.variations;
      await this.rateLimiter.checkLimit(estimatedTokens);

      const systemPrompt = this.buildServicePrompt(request);
      const userPrompt = this.buildServiceUserPrompt(request);

      const completion = await this.openai.chat.completions.create({
        model: this.config.openai?.model || 'gpt-4-turbo-preview',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.6,
        max_tokens: estimatedTokens + 500,
        response_format: { type: 'json_object' }
      });

      const content = completion.choices[0]?.message?.content;
      if (!content) {
        throw new Error('No content generated');
      }

      const generatedContent = JSON.parse(content);

      // Generate variations if requested
      if (request.variations > 1) {
        generatedContent.variations = await this.generateVariations(
          generatedContent.detailedDescription,
          request.variations - 1,
          request.tone
        );
      }

      // Apply filters and scoring
      const filterResult = this.contentFilter.filter(generatedContent.detailedDescription, true);

      generatedContent.qualityScore = this.calculateQualityScore(generatedContent);
      generatedContent.metadata = {
        generatedAt: new Date().toISOString(),
        model: this.config.openai?.model,
        tokensUsed: completion.usage?.total_tokens || 0,
        variations: request.variations,
        language: request.language,
        requiresReview: filterResult.requiresReview,
        filterIssues: filterResult.issues
      };

      await this.logUsage('service_generation', {
        tokensUsed: completion.usage?.total_tokens || 0,
        variations: request.variations,
        language: request.language,
        qualityScore: generatedContent.qualityScore
      });

      return {
        success: true,
        content: generatedContent,
        usage: {
          tokensUsed: completion.usage?.total_tokens || 0,
          cost: this.calculateCost(completion.usage?.total_tokens || 0)
        }
      };

    } catch (error: any) {
      logger.error('Error generating service description:', error);

      return {
        success: false,
        error: error.message
      };
    }
  }

  // Improve Existing Content
  async improveContent(request: ContentImprovementRequest): Promise<ContentGenerationResult> {
    try {
      if (!this.openai) {
        throw new Error('OpenAI not configured');
      }

      const estimatedTokens = request.content.length * 1.5;
      await this.rateLimiter.checkLimit(estimatedTokens);

      const systemPrompt = `You are an expert content editor and optimizer. Improve the given content while maintaining its core message and tone.`;

      const userPrompt = `Improve the following ${request.contentType} content:

Content: "${request.content}"

Improvements requested: ${request.improvements.join(', ')}
${request.targetKeywords ? `Target keywords: ${request.targetKeywords.join(', ')}` : ''}
${request.optimizeForSEO ? 'Optimize for SEO' : ''}
${request.maintainTone ? 'Maintain the original tone' : ''}

Provide the response as JSON with:
{
  "improvedContent": "Enhanced version of the content",
  "suggestions": ["List of specific improvements made"],
  "seoScore": 0-100,
  "readabilityScore": 0-100,
  "keywordDensity": "Percentage of target keywords"
}`;

      const completion = await this.openai.chat.completions.create({
        model: this.config.openai?.model || 'gpt-4-turbo-preview',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.3,
        max_tokens: estimatedTokens + 500,
        response_format: { type: 'json_object' }
      });

      const result = JSON.parse(completion.choices[0]?.message?.content || '{}');

      await this.logUsage('content_improvement', {
        tokensUsed: completion.usage?.total_tokens || 0,
        contentType: request.contentType,
        improvementsCount: request.improvements.length
      });

      return {
        success: true,
        content: {
          type: request.contentType,
          content: result.improvedContent,
          suggestions: result.suggestions,
          qualityScore: result.readabilityScore,
          seoScore: result.seoScore,
          metadata: {
            originalLength: request.content.length,
            improvedLength: result.improvedContent.length,
            keywordDensity: result.keywordDensity
          }
        },
        usage: {
          tokensUsed: completion.usage?.total_tokens || 0,
          cost: this.calculateCost(completion.usage?.total_tokens || 0)
        }
      };

    } catch (error: any) {
      logger.error('Error improving content:', error);

      return {
        success: false,
        error: error.message
      };
    }
  }

  // Generate Content Ideas
  async generateContentIdeas(
    category: string,
    count: number = 10,
    targetAudience?: string
  ): Promise<ContentGenerationResult> {
    try {
      if (!this.openai) {
        throw new Error('OpenAI not configured');
      }

      const estimatedTokens = 1000;
      await this.rateLimiter.checkLimit(estimatedTokens);

      const prompt = `Generate ${count} engaging content ideas for a beauty and fitness business.

Category: ${category}
${targetAudience ? `Target Audience: ${targetAudience}` : ''}

For each idea, provide:
- Title (catchy and SEO-friendly)
- Brief description (1-2 sentences)
- Target keywords (3-5)
- Content type (blog, social media, video, infographic)
- Engagement potential (high/medium/low)

Format as JSON array.`;

      const completion = await this.openai.chat.completions.create({
        model: this.config.openai?.model || 'gpt-4-turbo-preview',
        messages: [
          { role: 'system', content: 'You are a creative content strategist for luxury beauty and fitness brands.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.8,
        max_tokens: estimatedTokens * 2,
        response_format: { type: 'json_object' }
      });

      const ideas = JSON.parse(completion.choices[0]?.message?.content || '[]');

      await this.logUsage('content_ideas', {
        tokensUsed: completion.usage?.total_tokens || 0,
        category,
        ideasCount: count
      });

      return {
        success: true,
        content: {
          type: 'blog',
          content: JSON.stringify(ideas, null, 2),
          metadata: {
            category,
            ideasCount: ideas.length,
            generatedAt: new Date().toISOString()
          }
        },
        usage: {
          tokensUsed: completion.usage?.total_tokens || 0,
          cost: this.calculateCost(completion.usage?.total_tokens || 0)
        }
      };

    } catch (error: any) {
      logger.error('Error generating content ideas:', error);

      return {
        success: false,
        error: error.message
      };
    }
  }

  // Private Helper Methods
  private buildBlogPostPrompt(request: BlogPostGenerationRequest): string {
    const languageMap = {
      en: 'English',
      pl: 'Polish',
      ru: 'Russian',
      ua: 'Ukrainian'
    };

    return `You are an expert content writer for a premium beauty and fitness platform in Warsaw.
Create sophisticated, engaging blog content that appeals to high-end clients.
Write in ${languageMap[request.language]}.
Use a ${request.tone} tone that conveys luxury and expertise.
${request.brandVoice ? `Maintain this brand voice: ${request.brandVoice}` : ''}

Your content should:
- Be informative and valuable
- Include SEO best practices
- Have proper structure (headings, paragraphs, lists)
- Sound authoritative yet approachable
- Include actionable tips when appropriate
- Be factually accurate and avoid making medical claims without proper disclaimers`;
  }

  private buildBlogUserPrompt(request: BlogPostGenerationRequest): string {
    const outlineText = request.outline
      ? `\nFollow this outline:\n${request.outline.map((point, i) => `${i + 1}. ${point}`).join('\n')}`
      : '';

    const keywordsText = request.seoKeywords
      ? `\nNaturally incorporate these SEO keywords: ${request.seoKeywords.join(', ')}`
      : '';

    const ctaText = request.includeCallToAction
      ? '\nInclude a compelling call-to-action at the end that encourages booking or inquiry.'
      : '';

    return `Write a ${request.wordCount}-word blog post about "${request.topic}".

${request.category ? `Category: ${request.category}` : ''}
${request.targetAudience ? `Target Audience: ${request.targetAudience}` : ''}
${outlineText}
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
Include practical tips, expert insights, and maintain luxury positioning throughout.
If mentioning any medical or treatment claims, include appropriate disclaimers.`;
  }

  private buildServicePrompt(request: ServiceDescriptionRequest): string {
    const languageMap = {
      en: 'English',
      pl: 'Polish',
      ru: 'Russian',
      ua: 'Ukrainian'
    };

    return `You are a luxury beauty and fitness service description writer.
Create compelling, professional descriptions that highlight premium quality, results, and unique value propositions.
Write in ${languageMap[request.language]}.
Use a ${request.tone} tone that conveys expertise, luxury, and trustworthiness.

Focus on benefits, results, and experience rather than just features.
Avoid making medical claims or guarantees. Use "may help," "can improve," "designed to" instead.
Include realistic expectations and any contraindications.`;
  }

  private buildServiceUserPrompt(request: ServiceDescriptionRequest): string {
    return `Create ${request.variations} comprehensive service descriptions for "${request.serviceName}" in the ${request.category} category.

${request.targetAudience ? `Target Audience: ${request.targetAudience}` : ''}
${request.features ? `Key features: ${request.features.join(', ')}` : ''}
${request.benefits ? `Main benefits: ${request.benefits.join(', ')}` : ''}
${request.includePricing && request.priceRange ? `Price range: ${request.priceRange}` : ''}
Word count: approximately ${request.wordCount} words each

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

${request.includePreparation ? 'Include preparation instructions.' : ''}
${request.includeAftercare ? 'Include aftercare instructions.' : ''}
${request.includeFAQ ? 'Include 3-5 relevant FAQs.' : ''}

Focus on results, experience, and luxury positioning. Use persuasive language that builds trust.
Include realistic expectations and avoid medical guarantees.`;
  }

  private async generateVariations(baseContent: string, count: number, tone: string): Promise<string[]> {
    if (!this.openai || count === 0) return [];

    try {
      const completion = await this.openai.chat.completions.create({
        model: this.config.openai?.model || 'gpt-4-turbo-preview',
        messages: [
          {
            role: 'system',
            content: `Generate ${count} unique variations of the given content while maintaining the ${tone} tone and core message.`
          },
          {
            role: 'user',
            content: `Create variations for:\n\n${baseContent}`
          }
        ],
        temperature: 0.7,
        max_tokens: baseContent.length * count * 1.5
      });

      const response = completion.choices[0]?.message?.content;
      if (!response) return [];

      // Split variations by common separators
      return response.split(/\n\n|\n---\n|\n\nVariation \d+:/).filter(v => v.trim().length > 50);

    } catch (error) {
      logger.error('Error generating variations:', error);
      return [];
    }
  }

  private calculateQualityScore(content: any): number {
    let score = 50; // Base score

    // Length check
    const contentLength = content.content || content.detailedDescription || '';
    if (contentLength.length > 500) score += 10;
    if (contentLength.length > 1000) score += 10;

    // Structure check
    if (content.content && content.content.includes('##')) score += 10; // Has headings
    if (content.keyBenefits && content.keyBenefits.length > 2) score += 10;
    if (content.faq && content.faq.length > 0) score += 10;

    // Completeness check
    if (content.title && content.excerpt) score += 5;
    if (content.preparation || content.aftercare) score += 5;

    return Math.min(100, score);
  }

  private calculateSEOScore(content: any, keywords: string[]): number {
    let score = 50;

    const contentText = content.content || content.detailedDescription || '';
    const title = content.title || '';
    const metaDescription = content.metaDescription || content.excerpt || '';

    // Title SEO
    if (title.length > 30 && title.length < 60) score += 10;
    if (keywords.some(k => title.toLowerCase().includes(k.toLowerCase()))) score += 10;

    // Meta description SEO
    if (metaDescription.length > 120 && metaDescription.length < 160) score += 10;

    // Content SEO
    const keywordDensity = keywords.reduce((acc, kw) => {
      const matches = (contentText.toLowerCase().match(new RegExp(kw.toLowerCase(), 'g')) || []).length;
      return acc + matches;
    }, 0);

    if (keywordDensity > 0 && keywordDensity < contentText.length / 100) score += 10;

    // Structure SEO
    if (contentText.includes('##') || contentText.includes('###')) score += 5;
    if (contentText.includes('**') || contentText.includes('__')) score += 5;

    return Math.min(100, score);
  }

  private calculateCost(tokens: number): number {
    // Approximate cost calculation (adjust based on actual pricing)
    const costPerToken = 0.00002; // $0.02 per 1K tokens for GPT-4
    return tokens * costPerToken;
  }

  private async logUsage(functionName: string, metadata: any): Promise<void> {
    try {
      await supabase
        .from('ai_usage_events')
        .insert({
          function_name: functionName,
          metadata,
          timestamp: new Date().toISOString(),
        });
    } catch (error) {
      logger.error('Failed to log AI usage:', error);
    }
  }
}

// Export singleton instance
let aiContentServiceInstance: AIContentService | null = null;

export function getAIContentService(config?: AIContentConfig): AIContentService {
  if (!aiContentServiceInstance && config) {
    aiContentServiceInstance = new AIContentService(config);
  }
  return aiContentServiceInstance!;
}

// Export convenience functions
export async function generateBlogPost(request: BlogPostGenerationRequest): Promise<ContentGenerationResult> {
  const service = getAIContentService();
  return service.generateBlogPost(request);
}

export async function generateServiceDescription(request: ServiceDescriptionRequest): Promise<ContentGenerationResult> {
  const service = getAIContentService();
  return service.generateServiceDescription(request);
}

export async function improveContent(request: ContentImprovementRequest): Promise<ContentGenerationResult> {
  const service = getAIContentService();
  return service.improveContent(request);
}

export async function generateContentIdeas(category: string, count?: number, targetAudience?: string): Promise<ContentGenerationResult> {
  const service = getAIContentService();
  return service.generateContentIdeas(category, count, targetAudience);
}