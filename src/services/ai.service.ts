import OpenAI from 'openai';

import { getEnhancedAIService, ContentOptions, RecommendationContext, SchedulingConstraints, ServiceRecommendation, TimeSlot } from '@/integrations/ai/core/AIService';
import { getContentGenerator, BlogPostRequest, ServiceDescriptionRequest, EmailTemplateRequest, SocialMediaPostRequest } from '@/integrations/ai/content/ContentGenerator';
import { supabase } from '@/integrations/supabase/client';

// Types
export interface AIServiceConfig {
  openai?: {
    apiKey: string;
    model?: string;
    baseURL?: string;
  };
  google?: {
    apiKey: string;
    model?: string;
  };
  anthropic?: {
    apiKey: string;
    model?: string;
  };
  rateLimits?: {
    requestsPerMinute?: number;
    tokensPerMinute?: number;
  };
}

export interface ContentGenerationRequest {
  type: 'blog' | 'service' | 'email' | 'social';
  data: BlogPostRequest | ServiceDescriptionRequest | EmailTemplateRequest | SocialMediaPostRequest;
  options?: ContentOptions;
}

export interface ServiceRecommendationRequest extends RecommendationContext {
  limit?: number;
  categories?: string[];
  priceRange?: { min: number; max: number };
}

export interface ScheduleOptimizationRequest extends SchedulingConstraints {
  existingBookings?: Array<{ date: string; time: string; serviceId: string }>;
}

// Main AI Service Class
export class AIServiceManager {
  private aiService;
  private contentGenerator;

  constructor(config?: AIServiceConfig) {
    this.aiService = getEnhancedAIService(config);
    this.contentGenerator = getContentGenerator();
  }

  // Content Generation Methods
  async generateContent(request: ContentGenerationRequest) {
    try {
      let result;

      switch (request.type) {
        case 'blog':
          result = await this.contentGenerator.generateBlogPost(request.data as BlogPostRequest);
          break;

        case 'service':
          result = await this.contentGenerator.generateServiceDescription(request.data as ServiceDescriptionRequest);
          break;

        case 'email':
          result = await this.contentGenerator.generateEmailTemplate(request.data as EmailTemplateRequest);
          break;

        case 'social':
          result = await this.contentGenerator.generateSocialMediaPost(request.data as SocialMediaPostRequest);
          break;

        default:
          throw new Error(`Unknown content type: ${request.type}`);
      }

      // Log usage for analytics
      await this.logAIUsage('content_generation', {
        type: request.type,
        success: true,
        tokensUsed: result.content ? result.content.length / 4 : 0,
      });

      return result;
    } catch (error) {
      await this.logAIUsage('content_generation', {
        type: request.type,
        success: false,
        error: error.message,
      });
      throw error;
    }
  }

  async generateBatchContent(requests: ContentGenerationRequest[]) {
    const results = [];

    for (const request of requests) {
      try {
        const result = await this.generateContent(request);
        results.push({ success: true, data: result, request });
      } catch (error) {
        results.push({ success: false, error: error.message, request });
      }
    }

    return results;
  }

  // Recommendation Methods
  async getRecommendations(context: ServiceRecommendationRequest): Promise<ServiceRecommendation[]> {
    try {
      const recommendations = await this.aiService.recommendServices(context.userId, context);

      // Apply filters
      let filtered = recommendations;

      if (context.categories && context.categories.length > 0) {
        filtered = filtered.filter(rec => context.categories!.includes(rec.category));
      }

      if (context.priceRange) {
        filtered = filtered.filter(rec =>
          rec.price && rec.price >= context.priceRange!.min && rec.price <= context.priceRange!.max
        );
      }

      if (context.limit) {
        filtered = filtered.slice(0, context.limit);
      }

      // Log recommendations
      await this.logAIUsage('recommendations', {
        userId: context.userId,
        count: filtered.length,
        categories: context.categories,
        success: true,
      });

      return filtered;
    } catch (error) {
      await this.logAIUsage('recommendations', {
        userId: context.userId,
        success: false,
        error: error.message,
      });
      throw error;
    }
  }

  // Scheduling Methods
  async optimizeSchedule(request: ScheduleOptimizationRequest): Promise<{
    optimizedSlots: TimeSlot[];
    rescheduleSuggestions: Array<{
      currentSlot: { date: string; time: string };
      suggestedSlot: { date: string; time: string };
      reason: string;
      potentialGain: number;
    }>;
  }> {
    try {
      const optimizedSlots = await this.aiService.optimizeSchedule(request.providerId, request);

      // Generate reschedule suggestions
      const suggestions = this.generateRescheduleSuggestions(optimizedSlots, request.existingBookings || []);

      await this.logAIUsage('schedule_optimization', {
        providerId: request.providerId,
        slotsGenerated: optimizedSlots.length,
        suggestionsGenerated: suggestions.length,
        success: true,
      });

      return {
        optimizedSlots,
        rescheduleSuggestions: suggestions,
      };
    } catch (error) {
      await this.logAIUsage('schedule_optimization', {
        providerId: request.providerId,
        success: false,
        error: error.message,
      });
      throw error;
    }
  }

  // AI Insights and Analytics
  async generateInsights(type: 'business' | 'performance' | 'customer' | 'trends', period?: string) {
    try {
      const prompts = {
        business: `Analyze business performance and provide actionable insights for a beauty and fitness business. Focus on revenue, customer acquisition, and operational efficiency.`,
        performance: `Analyze AI system performance metrics including success rates, response times, and user satisfaction. Provide optimization recommendations.`,
        customer: `Analyze customer behavior patterns, satisfaction scores, and feedback. Provide insights for improving customer experience.`,
        trends: `Analyze current market trends in beauty and fitness industry. Provide insights on emerging services and seasonal patterns.`,
      };

      const result = await this.aiService.generateContent(prompts[type], {
        tone: 'professional',
        includeSEO: false,
      });

      const insights = JSON.parse(result.content);

      await this.logAIUsage('insights_generation', {
        type,
        period,
        success: true,
      });

      return insights;
    } catch (error) {
      await this.logAIUsage('insights_generation', {
        type,
        period,
        success: false,
        error: error.message,
      });
      throw error;
    }
  }

  // Sentiment Analysis
  async analyzeSentiment(text: string, context?: string) {
    try {
      const result = await this.aiService.analyzeSentiment(text);

      await this.logAIUsage('sentiment_analysis', {
        textLength: text.length,
        context,
        success: true,
      });

      return result;
    } catch (error) {
      await this.logAIUsage('sentiment_analysis', {
        textLength: text.length,
        context,
        success: false,
        error: error.message,
      });
      throw error;
    }
  }

  // AI-Powered SEO
  async optimizeForSEO(content: string, contentType: string, targetKeywords?: string[]) {
    try {
      const prompt = `Optimize this ${contentType} for SEO:

Content: "${content}"
${targetKeywords ? `Target keywords: ${targetKeywords.join(', ')}` : ''}

Provide JSON with:
- optimizedContent: SEO-optimized version
- metaTitle: SEO title (under 60 chars)
- metaDescription: Meta description (under 160 chars)
- keywords: Recommended keywords (10-15)
- readabilityScore: Score 0-100
- seoScore: SEO score 0-100
- suggestions: Array of specific improvements`;

      const result = await this.aiService.generateContent(prompt, { temperature: 0.3 });
      const optimized = JSON.parse(result.content);

      await this.logAIUsage('seo_optimization', {
        contentType,
        contentLength: content.length,
        success: true,
      });

      return optimized;
    } catch (error) {
      await this.logAIUsage('seo_optimization', {
        contentType,
        contentLength: content.length,
        success: false,
        error: error.message,
      });
      throw error;
    }
  }

  // AI Quality Scoring
  async scoreContent(content: string, criteria: string[]) {
    try {
      const prompt = `Score this content based on the following criteria:

Content: "${content}"
Criteria: ${criteria.join(', ')}

Provide JSON with:
- overallScore: Average score 0-100
- criteriaScores: Object with score for each criterion
- strengths: Array of what works well
- weaknesses: Array of areas for improvement
- suggestions: Array of actionable recommendations`;

      const result = await this.aiService.generateContent(prompt, { temperature: 0.2 });
      const scores = JSON.parse(result.content);

      await this.logAIUsage('content_scoring', {
        contentLength: content.length,
        criteriaCount: criteria.length,
        success: true,
      });

      return scores;
    } catch (error) {
      await this.logAIUsage('content_scoring', {
        contentLength: content.length,
        criteriaCount: criteria.length,
        success: false,
        error: error.message,
      });
      throw error;
    }
  }

  // Get AI Usage Statistics
  getUsageStats() {
    return this.aiService.getUsageStats();
  }

  // Clear AI Cache
  clearCache() {
    this.aiService.clearCache();
  }

  // Private helper methods
  private generateRescheduleSuggestions(
    optimizedSlots: TimeSlot[],
    existingBookings: Array<{ date: string; time: string; serviceId: string }>
  ) {
    const suggestions = [];

    // Simple algorithm to find better slots
    for (const existing of existingBookings) {
      for (const optimized of optimizedSlots) {
        if (optimized.score > 0.8 && optimized.predictedDemand === 'high') {
          // Check if this is an improvement over current slot
          const isBetter = true; // Add logic to compare slots

          if (isBetter) {
            suggestions.push({
              currentSlot: { date: existing.date, time: existing.time },
              suggestedSlot: { date: optimized.date, time: optimized.time },
              reason: optimized.reasoning,
              potentialGain: optimized.revenuePotential ? optimized.revenuePotential * 0.2 : 50,
            });
            break;
          }
        }
      }
    }

    return suggestions.slice(0, 5); // Return top 5 suggestions
  }

  private async logAIUsage(functionName: string, metadata: any) {
    try {
      await supabase
        .from('ai_usage_events')
        .insert({
          function_name: functionName,
          metadata,
          timestamp: new Date().toISOString(),
        });
    } catch (error) {
      console.error('Failed to log AI usage:', error);
    }
  }
}

// Export singleton instance
let aiServiceManager: AIServiceManager | null = null;

export function getAIServiceManager(config?: AIServiceConfig): AIServiceManager {
  if (!aiServiceManager) {
    aiServiceManager = new AIServiceManager(config);
  }
  return aiServiceManager;
}

// Export convenience functions
export async function generateAIContent(request: ContentGenerationRequest) {
  const service = getAIServiceManager();
  return service.generateContent(request);
}

export async function getAIRecommendations(context: ServiceRecommendationRequest) {
  const service = getAIServiceManager();
  return service.getRecommendations(context);
}

export async function optimizeAISchedule(request: ScheduleOptimizationRequest) {
  const service = getAIServiceManager();
  return service.optimizeSchedule(request);
}

export async function analyzeAISentiment(text: string, context?: string) {
  const service = getAIServiceManager();
  return service.analyzeSentiment(text, context);
}

export async function optimizeForSEO(content: string, contentType: string, targetKeywords?: string[]) {
  const service = getAIServiceManager();
  return service.optimizeForSEO(content, contentType, targetKeywords);
}