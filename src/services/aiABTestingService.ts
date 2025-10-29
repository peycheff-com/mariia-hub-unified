import OpenAI from 'openai';

import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';

// A/B Testing Types
export interface ABTestSuggestion {
  id: string;
  contentType: 'blog' | 'service' | 'email' | 'social';
  element: string; // What to test (headline, cta, description, etc.)
  originalVariant: string;
  suggestedVariants: Array<{
    id: string;
    content: string;
    hypothesis: string; // Why this might perform better
    expectedLift: number; // Expected improvement percentage
  }>;
  priority: 'high' | 'medium' | 'low';
  confidence: number; // 0-100
  reasoning: string;
  implementationNotes: string[];
}

export interface ABTestCampaign {
  id: string;
  name: string;
  contentId: string;
  variants: Array<{
    id: string;
    name: string;
    content: any;
    traffic: number; // Percentage of traffic
  }>;
  status: 'draft' | 'running' | 'completed' | 'paused';
  metrics: {
    impressions: number;
    conversions: number;
    conversionRate: number;
    avgTimeOnPage: number;
    bounceRate: number;
  };
  winner?: {
    variantId: string;
    confidence: number;
    improvement: number;
  };
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
}

export interface ContentPerformanceMetrics {
  contentId: string;
  contentType: string;
  publishedAt: string;
  metrics: {
    views: number;
    engagements: number;
    shares: number;
    conversions: number;
    avgTimeOnPage: number;
    bounceRate: number;
    ctr: number; // Click-through rate
  };
  benchmarks: {
    avgViews: number;
    avgEngagements: number;
    avgConversions: number;
  };
}

// A/B Testing Service Class
export class AIABTestingService {
  private openai: OpenAI | null = null;

  constructor(apiKey?: string) {
    if (apiKey) {
      this.openai = new OpenAI({ apiKey });
    }
  }

  // Generate A/B Test Suggestions
  async generateTestSuggestions(
    content: any,
    contentType: string,
    performanceMetrics?: ContentPerformanceMetrics
  ): Promise<ABTestSuggestion[]> {
    if (!this.openai) {
      throw new Error('OpenAI not configured');
    }

    try {
      const prompt = this.buildABTestPrompt(content, contentType, performanceMetrics);

      const completion = await this.openai.chat.completions.create({
        model: 'gpt-4-turbo-preview',
        messages: [
          {
            role: 'system',
            content: `You are an expert conversion rate optimizer specializing in content for beauty and wellness businesses.
            Generate data-driven A/B test suggestions based on content performance and best practices.`
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        response_format: { type: 'json_object' }
      });

      const response = completion.choices[0]?.message?.content;
      if (!response) {
        throw new Error('No suggestions generated');
      }

      const suggestions = JSON.parse(response);
      return suggestions.suggestions || [];

    } catch (error) {
      logger.error('Error generating A/B test suggestions:', error);
      throw error;
    }
  }

  // Analyze Content Performance
  async analyzeContentPerformance(contentId: string): Promise<ContentPerformanceMetrics> {
    try {
      // Fetch content metrics from analytics
      const { data: content, error } = await supabase
        .from('content_analytics')
        .select('*')
        .eq('content_id', contentId)
        .single();

      if (error) throw error;

      // Fetch benchmarks
      const { data: benchmarks } = await supabase
        .from('content_benchmarks')
        .select('*')
        .eq('content_type', content.content_type)
        .single();

      return {
        contentId,
        contentType: content.content_type,
        publishedAt: content.published_at,
        metrics: {
          views: content.views || 0,
          engagements: content.engagements || 0,
          shares: content.shares || 0,
          conversions: content.conversions || 0,
          avgTimeOnPage: content.avg_time_on_page || 0,
          bounceRate: content.bounce_rate || 0,
          ctr: content.ctr || 0
        },
        benchmarks: {
          avgViews: benchmarks?.avg_views || 0,
          avgEngagements: benchmarks?.avg_engagements || 0,
          avgConversions: benchmarks?.avg_conversions || 0
        }
      };

    } catch (error) {
      logger.error('Error analyzing content performance:', error);
      throw error;
    }
  }

  // Create A/B Test Campaign
  async createTestCampaign(
    name: string,
    contentId: string,
    variants: any[],
    hypothesis: string
  ): Promise<ABTestCampaign> {
    try {
      const campaign: ABTestCampaign = {
        id: crypto.randomUUID(),
        name,
        contentId,
        variants: variants.map((v, idx) => ({
          id: crypto.randomUUID(),
          name: `Variant ${idx + 1}`,
          content: v,
          traffic: 100 / variants.length
        })),
        status: 'draft',
        metrics: {
          impressions: 0,
          conversions: 0,
          conversionRate: 0,
          avgTimeOnPage: 0,
          bounceRate: 0
        },
        createdAt: new Date().toISOString()
      };

      // Save to database
      const { error } = await supabase
        .from('ab_test_campaigns')
        .insert({
          id: campaign.id,
          name: campaign.name,
          content_id: campaign.contentId,
          variants: campaign.variants,
          status: campaign.status,
          hypothesis,
          created_at: campaign.createdAt
        });

      if (error) throw error;

      return campaign;

    } catch (error) {
      logger.error('Error creating A/B test campaign:', error);
      throw error;
    }
  }

  // Generate Title Variations for Testing
  async generateTitleVariations(
    originalTitle: string,
    contentType: string,
    targetAudience?: string
  ): Promise<string[]> {
    if (!this.openai) {
      throw new Error('OpenAI not configured');
    }

    try {
      const prompt = `Generate 5 compelling title variations for A/B testing.

Original Title: "${originalTitle}"
Content Type: ${contentType}
${targetAudience ? `Target Audience: ${targetAudience}` : ''}

Requirements:
- Each title should be under 60 characters
- Include different psychological triggers (curiosity, urgency, benefit-driven)
- Optimize for SEO where possible
- Maintain brand voice consistency

Format as JSON array:
["Title 1", "Title 2", "Title 3", "Title 4", "Title 5"]`;

      const completion = await this.openai.chat.completions.create({
        model: 'gpt-4-turbo-preview',
        messages: [
          {
            role: 'system',
            content: 'You are a copywriting expert specializing in creating high-converting titles.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.8,
        max_tokens: 500,
        response_format: { type: 'json_object' }
      });

      const response = completion.choices[0]?.message?.content;
      return JSON.parse(response || '[]');

    } catch (error) {
      logger.error('Error generating title variations:', error);
      throw error;
    }
  }

  // Generate CTA Variations
  async generateCTAVariations(
    originalCTA: string,
    context: string,
    goal: 'booking' | 'purchase' | 'newsletter' | 'consultation'
  ): Promise<string[]> {
    if (!this.openai) {
      throw new Error('OpenAI not configured');
    }

    try {
      const prompt = `Generate 5 call-to-action variations for A/B testing.

Original CTA: "${originalCTA}"
Context: ${context}
Goal: ${goal}

Requirements:
- Action-oriented language
- Clear value proposition
- Create urgency or curiosity
- 3-6 words maximum
- Different approaches (direct, benefit-driven, question, etc.)

Format as JSON array:
["CTA 1", "CTA 2", "CTA 3", "CTA 4", "CTA 5"]`;

      const completion = await this.openai.chat.completions.create({
        model: 'gpt-4-turbo-preview',
        messages: [
          {
            role: 'system',
            content: 'You are a conversion optimization expert specializing in CTAs.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.8,
        max_tokens: 300,
        response_format: { type: 'json_object' }
      });

      const response = completion.choices[0]?.message?.content;
      return JSON.parse(response || '[]');

    } catch (error) {
      logger.error('Error generating CTA variations:', error);
      throw error;
    }
  }

  // Predict Test Performance
  async predictTestPerformance(
    variants: string[],
    historicalData?: any[]
  ): Promise<Array<{
    variant: string;
    predictedCR: number;
    confidence: number;
    reasoning: string;
  }>> {
    if (!this.openai) {
      throw new Error('OpenAI not configured');
    }

    try {
      const historicalContext = historicalData
        ? `\nHistorical Data:\n${JSON.stringify(historicalData, null, 2)}`
        : '';

      const prompt = `Predict the performance of these content variants for A/B testing.

Variants:
${variants.map((v, i) => `${i + 1}. "${v}"`).join('\n')}
${historicalContext}

For each variant, provide:
- Predicted conversion rate (0-100%)
- Confidence in prediction (0-100%)
- Reasoning for prediction

Format as JSON array:
[{
  "variant": "Variant text",
  "predictedCR": 5.2,
  "confidence": 85,
  "reasoning": "Explanation"
}]`;

      const completion = await this.openai.chat.completions.create({
        model: 'gpt-4-turbo-preview',
        messages: [
          {
            role: 'system',
            content: 'You are a machine learning expert predicting A/B test outcomes based on content characteristics.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3,
        max_tokens: 1000,
        response_format: { type: 'json_object' }
      });

      const response = completion.choices[0]?.message?.content;
      return JSON.parse(response || '[]');

    } catch (error) {
      logger.error('Error predicting test performance:', error);
      throw error;
    }
  }

  // Private helper methods
  private buildABTestPrompt(
    content: any,
    contentType: string,
    performanceMetrics?: ContentPerformanceMetrics
  ): string {
    const performanceContext = performanceMetrics
      ? `
Performance Metrics:
- Views: ${performanceMetrics.metrics.views}
- Engagement Rate: ${((performanceMetrics.metrics.engagements / performanceMetrics.metrics.views) * 100).toFixed(1)}%
- Conversion Rate: ${performanceMetrics.metrics.conversionRate}%
- Bounce Rate: ${performanceMetrics.metrics.bounceRate}%

Benchmarks:
- Average Views: ${performanceMetrics.benchmarks.avgViews}
- Average Conversions: ${performanceMetrics.benchmarks.avgConversions}
`
      : '';

    return `Analyze this ${contentType} content and suggest A/B tests to improve performance.

Content:
Title: ${content.title || 'N/A'}
${content.excerpt ? `Excerpt: ${content.excerpt}` : ''}
${content.content ? `Content Preview: ${content.content.substring(0, 500)}...` : ''}
${content.callToAction ? `CTA: ${content.callToAction}` : ''}

${performanceContext}

Generate 3-5 A/B test suggestions focusing on elements most likely to impact performance.
For each suggestion, include:
- Element to test (headline, cta, description, tone, length, etc.)
- Current version
- 2-3 suggested variants with hypotheses
- Priority level based on potential impact
- Confidence score
- Reasoning for why this test matters

Format as JSON:
{
  "suggestions": [
    {
      "id": "test_1",
      "contentType": "${contentType}",
      "element": "headline",
      "originalVariant": "Current headline",
      "suggestedVariants": [
        {
          "id": "var_1",
          "content": "New headline 1",
          "hypothesis": "Why this might work better",
          "expectedLift": 15
        }
      ],
      "priority": "high",
      "confidence": 85,
      "reasoning": "Detailed reasoning",
      "implementationNotes": ["Note 1", "Note 2"]
    }
  ]
}`;
  }
}

// Export singleton instance
let abTestingServiceInstance: AIABTestingService | null = null;

export function getABTestingService(apiKey?: string): AIABTestingService {
  if (!abTestingServiceInstance) {
    abTestingServiceInstance = new AIABTestingService(apiKey);
  }
  return abTestingServiceInstance;
}

// Export convenience functions
export async function generateABTestSuggestions(
  content: any,
  contentType: string,
  performanceMetrics?: ContentPerformanceMetrics
): Promise<ABTestSuggestion[]> {
  const service = getABTestingService();
  return service.generateTestSuggestions(content, contentType, performanceMetrics);
}

export async function generateTitleVariations(
  title: string,
  contentType: string,
  targetAudience?: string
): Promise<string[]> {
  const service = getABTestingService();
  return service.generateTitleVariations(title, contentType, targetAudience);
}

export async function generateCTAVariations(
  cta: string,
  context: string,
  goal: 'booking' | 'purchase' | 'newsletter' | 'consultation'
): Promise<string[]> {
  const service = getABTestingService();
  return service.generateCTAVariations(cta, context, goal);
}