import OpenAI from 'openai';
import { z } from 'zod';

// Configuration schema
const AIConfigSchema = z.object({
  apiKey: z.string().min(1, 'OpenAI API key is required'),
  model: z.string().default('gpt-4-turbo-preview'),
  maxTokens: z.number().default(2000),
  temperature: z.number().min(0).max(2).default(0.7),
});

export type AIConfig = z.infer<typeof AIConfigSchema>;

// Language options for translations
export const SupportedLanguages = z.enum(['en', 'pl']);
export type SupportedLanguage = z.infer<typeof SupportedLanguages>;

// Content generation types
export const ContentType = z.enum(['blog-post', 'service-description', 'social-media', 'email', 'translation']);
export type ContentType = z.infer<typeof ContentType>;

// Generation request schemas
export const BlogPostRequestSchema = z.object({
  title: z.string().optional(),
  topic: z.string().min(1, 'Topic is required'),
  category: z.string().optional(),
  targetAudience: z.string().optional(),
  tone: z.enum(['professional', 'friendly', 'casual', 'luxury']).default('luxury'),
  wordCount: z.number().min(100).max(2000).default(800),
  language: SupportedLanguages.default('en'),
  seoKeywords: z.array(z.string()).optional(),
});

export const ServiceDescriptionRequestSchema = z.object({
  serviceName: z.string().min(1, 'Service name is required'),
  category: z.string().optional(),
  features: z.array(z.string()).optional(),
  benefits: z.array(z.string()).optional(),
  targetAudience: z.string().optional(),
  tone: z.enum(['professional', 'friendly', 'casual', 'luxury']).default('luxury'),
  wordCount: z.number().min(100).max(1000).default(400),
  language: SupportedLanguages.default('en'),
  includePreparation: z.boolean().default(true),
  includeAftercare: z.boolean().default(true),
});

export const TranslationRequestSchema = z.object({
  text: z.string().min(1, 'Text to translate is required'),
  targetLanguage: SupportedLanguages,
  sourceLanguage: SupportedLanguages.optional(),
  context: z.string().optional(),
  maintainTone: z.boolean().default(true),
});

export const SchedulingInsightRequestSchema = z.object({
  serviceType: z.string(),
  serviceDuration: z.number(),
  preferredDays: z.array(z.string()).optional(),
  preferredTimes: z.array(z.string()).optional(),
  location: z.string().optional(),
  constraints: z.array(z.string()).optional(),
});

export type BlogPostRequest = z.infer<typeof BlogPostRequestSchema>;
export type ServiceDescriptionRequest = z.infer<typeof ServiceDescriptionRequestSchema>;
export type TranslationRequest = z.infer<typeof TranslationRequestSchema>;
export type SchedulingInsightRequest = z.infer<typeof SchedulingInsightRequestSchema>;

// Generated content schemas
export const BlogPostResponseSchema = z.object({
  title: z.string(),
  slug: z.string(),
  content: z.string(),
  excerpt: z.string(),
  seoTitle: z.string(),
  metaDescription: z.string(),
  tags: z.array(z.string()),
  readingTime: z.number(),
});

export const ServiceDescriptionResponseSchema = z.object({
  shortDescription: z.string(),
  detailedDescription: z.string(),
  keyBenefits: z.array(z.string()),
  preparation: z.string().optional(),
  aftercare: z.string().optional(),
  whatToExpect: z.string(),
  faq: z.array(z.object({
    question: z.string(),
    answer: z.string(),
  })),
});

export const TranslationResponseSchema = z.object({
  translatedText: z.string(),
  confidence: z.number().min(0).max(1),
  alternatives: z.array(z.string()).optional(),
});

export const SchedulingInsightResponseSchema = z.object({
  optimalTimes: z.array(z.object({
    date: z.string(),
    time: z.string(),
    score: z.number().min(0).max(1),
    reasoning: z.string(),
  })),
  recommendations: z.array(z.string()),
  predictions: z.object({
    demandLevel: z.enum(['low', 'medium', 'high']),
    suggestedPriceAdjustment: z.number().optional(),
    optimalGapTime: z.number(),
  }),
});

export type BlogPostResponse = z.infer<typeof BlogPostResponseSchema>;
export type ServiceDescriptionResponse = z.infer<typeof ServiceDescriptionResponseSchema>;
export type TranslationResponse = z.infer<typeof TranslationResponseSchema>;
export type SchedulingInsightResponse = z.infer<typeof SchedulingInsightResponseSchema>;

export class AIService {
  private openai: OpenAI;
  private config: AIConfig;

  constructor(config: AIConfig) {
    const validatedConfig = AIConfigSchema.parse(config);
    this.config = validatedConfig;
    this.openai = new OpenAI({
      apiKey: validatedConfig.apiKey,
      dangerouslyAllowBrowser: false, // Ensure server-side only
    });
  }

  private async generateContent(
    prompt: string,
    systemPrompt: string = 'You are a helpful AI assistant.',
    temperature?: number,
    maxTokens?: number
  ): Promise<string> {
    try {
      const completion = await this.openai.chat.completions.create({
        model: this.config.model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: prompt }
        ],
        temperature: temperature ?? this.config.temperature,
        max_tokens: maxTokens ?? this.config.maxTokens,
      });

      return completion.choices[0]?.message?.content || '';
    } catch (error) {
      console.error('OpenAI API error:', error);
      throw new Error('Failed to generate content');
    }
  }

  async generateBlogPost(request: BlogPostRequest): Promise<BlogPostResponse> {
    const validatedRequest = BlogPostRequestSchema.parse(request);

    const systemPrompt = `You are a luxury beauty and fitness content writer writing for a premium Warsaw-based platform.
    Your content should be sophisticated, informative, and engaging.
    Write in ${validatedRequest.language === 'pl' ? 'Polish' : 'English'}.
    Use a ${validatedRequest.tone} tone that appeals to high-end clients.`;

    const keywordsText = validatedRequest.seoKeywords
      ? `Include these SEO keywords naturally: ${validatedRequest.seoKeywords.join(', ')}`
      : '';

    const prompt = `Write a ${validatedRequest.wordCount}-word blog post about "${validatedRequest.topic}".
    ${validatedRequest.title ? `Title: ${validatedRequest.title}` : 'Generate an engaging title'}
    ${validatedRequest.category ? `Category: ${validatedRequest.category}` : ''}
    ${validatedRequest.targetAudience ? `Target Audience: ${validatedRequest.targetAudience}` : ''}
    ${keywordsText}

    Please structure the response as JSON with:
    - title: SEO-optimized title
    - slug: URL-friendly slug
    - content: Full blog post content in markdown
    - excerpt: 150-character excerpt
    - seoTitle: SEO title (under 60 characters)
    - metaDescription: Meta description (under 160 characters)
    - tags: 5-7 relevant tags
    - readingTime: Estimated reading time in minutes`;

    const response = await this.generateContent(
      prompt,
      systemPrompt,
      0.7,
      this.config.maxTokens
    );

    try {
      const parsed = JSON.parse(response);
      return BlogPostResponseSchema.parse(parsed);
    } catch (error) {
      console.error('Failed to parse AI response:', error);
      throw new Error('Invalid response format from AI');
    }
  }

  async generateServiceDescription(request: ServiceDescriptionRequest): Promise<ServiceDescriptionResponse> {
    const validatedRequest = ServiceDescriptionRequestSchema.parse(request);

    const systemPrompt = `You are a luxury beauty and fitness service description writer.
    Create compelling, professional descriptions that highlight premium quality and results.
    Write in ${validatedRequest.language === 'pl' ? 'Polish' : 'English'}.
    Use a ${validatedRequest.tone} tone that conveys expertise and luxury.`;

    const featuresText = validatedRequest.features
      ? `Key features: ${validatedRequest.features.join(', ')}`
      : '';

    const benefitsText = validatedRequest.benefits
      ? `Main benefits: ${validatedRequest.benefits.join(', ')}`
      : '';

    const prompt = `Create a comprehensive service description for "${validatedRequest.serviceName}".
    ${validatedRequest.category ? `Category: ${validatedRequest.category}` : ''}
    ${validatedRequest.targetAudience ? `Target Audience: ${validatedRequest.targetAudience}` : ''}
    ${featuresText}
    ${benefitsText}
    Word count: approximately ${validatedRequest.wordCount} words

    Include sections for:
    - shortDescription: 2-3 sentence summary
    - detailedDescription: Full description with benefits and features
    - keyBenefits: 4-6 bullet points
    ${validatedRequest.includePreparation ? '- preparation: How to prepare for the service' : ''}
    ${validatedRequest.includeAftercare ? '- aftercare: Post-service care instructions' : ''}
    - whatToExpect: What happens during the service
    - faq: 3-5 frequently asked questions with answers

    Format as JSON.`;

    const response = await this.generateContent(
      prompt,
      systemPrompt,
      0.6,
      this.config.maxTokens
    );

    try {
      const parsed = JSON.parse(response);
      return ServiceDescriptionResponseSchema.parse(parsed);
    } catch (error) {
      console.error('Failed to parse AI response:', error);
      throw new Error('Invalid response format from AI');
    }
  }

  async translateText(request: TranslationRequest): Promise<TranslationResponse> {
    const validatedRequest = TranslationRequestSchema.parse(request);

    const sourceLanguage = validatedRequest.sourceLanguage || 'en';
    const targetLanguage = validatedRequest.targetLanguage;

    const languageMap = {
      'en': 'English',
      'pl': 'Polish'
    };

    const systemPrompt = `You are a professional translator specializing in beauty and fitness content.
    Translate from ${languageMap[sourceLanguage]} to ${languageMap[targetLanguage]}.
    ${validatedRequest.maintainTone ? 'Maintain the original tone and style.' : ''}
    ${validatedRequest.context ? `Context: ${validatedRequest.context}` : ''}

    Preserve technical terms and brand names. Ensure natural, fluent language.`;

    const prompt = `Translate the following text:

    "${validatedRequest.text}"

    Please respond with JSON containing:
    - translatedText: The translated text
    - confidence: Confidence score (0-1)
    - alternatives: 2-3 alternative translations if applicable`;

    const response = await this.generateContent(
      prompt,
      systemPrompt,
      0.3,
      1000
    );

    try {
      const parsed = JSON.parse(response);
      return TranslationResponseSchema.parse(parsed);
    } catch (error) {
      console.error('Failed to parse AI response:', error);
      throw new Error('Invalid response format from AI');
    }
  }

  async generateSchedulingInsights(request: SchedulingInsightRequest): Promise<SchedulingInsightResponse> {
    const validatedRequest = SchedulingInsightRequestSchema.parse(request);

    const systemPrompt = `You are an AI scheduling assistant for beauty and fitness services.
    Analyze patterns and provide optimal scheduling recommendations.
    Consider factors like customer preferences, service preparation time, and business efficiency.`;

    const prompt = `Provide scheduling insights for:
    - Service type: ${validatedRequest.serviceType}
    - Duration: ${validatedRequest.serviceDuration} minutes
    ${validatedRequest.preferredDays ? `- Preferred days: ${validatedRequest.preferredDays.join(', ')}` : ''}
    ${validatedRequest.preferredTimes ? `- Preferred times: ${validatedRequest.preferredTimes.join(', ')}` : ''}
    ${validatedRequest.location ? `- Location: ${validatedRequest.location}` : ''}
    ${validatedRequest.constraints ? `- Constraints: ${validatedRequest.constraints.join(', ')}` : ''}

    Respond with JSON containing:
    - optimalTimes: Array of best time slots with scores and reasoning
    - recommendations: 3-5 scheduling recommendations
    - predictions: Demand level, price adjustment suggestions, optimal gap time`;

    const response = await this.generateContent(
      prompt,
      systemPrompt,
      0.4,
      1500
    );

    try {
      const parsed = JSON.parse(response);
      return SchedulingInsightResponseSchema.parse(parsed);
    } catch (error) {
      console.error('Failed to parse AI response:', error);
      throw new Error('Invalid response format from AI');
    }
  }
}

// Singleton instance
let aiServiceInstance: AIService | null = null;

export function getAIService(config?: AIConfig): AIService {
  if (!aiServiceInstance && config) {
    aiServiceInstance = new AIService(config);
  }

  if (!aiServiceInstance) {
    throw new Error('AIService not initialized. Call getAIService(config) first.');
  }

  return aiServiceInstance;
}

// Utility functions
export function isValidAPIKey(key: string): boolean {
  return key.startsWith('sk-') && key.length > 40;
}

export function calculateReadingTime(content: string): number {
  const wordsPerMinute = 250;
  const words = content.trim().split(/\s+/).length;
  return Math.ceil(words / wordsPerMinute);
}

export function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9 -]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}