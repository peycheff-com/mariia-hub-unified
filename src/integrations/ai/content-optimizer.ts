import { aiService } from './config';

export interface ContentOptimizationRequest {
  content: string;
  contentType: 'blog-post' | 'service-description' | 'landing-page' | 'email' | 'social-media';
  targetAudience: string;
  goals: Array<'engagement' | 'conversion' | 'seo' | 'readability' | 'clarity'>;
  currentScore?: number;
  maxLength?: number;
  tone?: 'professional' | 'friendly' | 'luxury' | 'casual';
  keywords?: string[];
}

export interface ContentOptimizationResult {
  optimizedContent: string;
  improvements: Array<{
    type: string;
    original: string;
    improved: string;
    reason: string;
  }>;
  scores: {
    readability: number;
    seo: number;
    engagement: number;
    clarity: number;
    overall: number;
  };
  suggestions: string[];
  wordCount: number;
  readingTime: number;
  keywordDensity: Record<string, number>;
  sentiment: 'positive' | 'neutral' | 'negative';
  emotionalTone: string[];
}

export class AIContentOptimizer {
  private static instance: AIContentOptimizer;

  static getInstance(): AIContentOptimizer {
    if (!AIContentOptimizer.instance) {
      AIContentOptimizer.instance = new AIContentOptimizer();
    }
    return AIContentOptimizer.instance;
  }

  async optimizeContent(request: ContentOptimizationRequest): Promise<ContentOptimizationResult> {
    if (!aiService) {
      throw new Error('AI content optimization is not available');
    }

    const prompt = `Optimize this ${request.contentType} for better performance:

Original Content:
"${request.content}"

Optimization Goals: ${request.goals.join(', ')}
Target Audience: ${request.targetAudience}
${request.tone ? `Tone: ${request.tone}` : ''}
${request.keywords ? `Keywords to include: ${request.keywords.join(', ')}` : ''}
${request.maxLength ? `Max length: ${request.maxLength} words` : ''}

Please optimize for:
1. Readability and clarity
2. SEO optimization
3. User engagement
4. Conversion potential
5. Proper keyword density (2-3%)

Return JSON with:
{
  "optimizedContent": "Full optimized text",
  "improvements": [
    {
      "type": "readability|seo|engagement|clarity",
      "original": "Original text",
      "improved": "Improved text",
      "reason": "Why this improves the content"
    }
  ],
  "scores": {
    "readability": 0-100,
    "seo": 0-100,
    "engagement": 0-100,
    "clarity": 0-100,
    "overall": 0-100
  },
  "suggestions": ["Additional improvement suggestions"],
  "sentiment": "positive|neutral|negative",
  "emotionalTone": ["emotional", "inspiring", "professional", etc.]
}`;

    try {
      const response = await aiService['generateContent'](
        prompt,
        'You are an expert content optimizer specializing in beauty and fitness content. Focus on creating compelling, high-converting content.',
        0.7,
        2000
      );

      const result = JSON.parse(response);
      const wordCount = this.countWords(result.optimizedContent);
      const readingTime = Math.ceil(wordCount / 250);
      const keywordDensity = this.calculateKeywordDensity(result.optimizedContent, request.keywords || []);

      return {
        ...result,
        wordCount,
        readingTime,
        keywordDensity,
      };
    } catch (error) {
      console.error('Content optimization failed:', error);
      throw new Error('Failed to optimize content');
    }
  }

  async generateContentVariations(
    baseContent: string,
    variations: number = 3,
    options?: {
      tones?: string[];
      lengths?: ['shorter' | 'same' | 'longer'];
      focus?: string[];
    }
  ): Promise<Array<{
    variation: string;
    differences: string[];
    score: number;
    bestFor: string;
  }>> {
    if (!aiService) {
      throw new Error('AI content optimization is not available');
    }

    const prompt = `Create ${variations} variations of this content:

Base Content:
"${baseContent}"

${options?.tones ? `Try different tones: ${options.tones.join(', ')}` : ''}
${options?.lengths ? `Vary the lengths: ${options.lengths.join(', ')}` : ''}
${options?.focus ? `Focus on different aspects: ${options.focus.join(', ')}` : ''}

For each variation, provide:
1. The varied content
2. Key differences from original
3. Predicted performance score (0-100)
4. Best use case (e.g., "social media", "email newsletter", "landing page")

Return as JSON array of variations.`;

    try {
      const response = await aiService['generateContent'](
        prompt,
        'You are a creative content writer specializing in creating multiple effective variations.',
        0.8,
        2500
      );

      return JSON.parse(response);
    } catch (error) {
      console.error('Failed to generate variations:', error);
      throw new Error('Failed to generate content variations');
    }
  }

  async analyzeContentPerformance(
    content: string,
    metrics?: {
      views?: number;
      clicks?: number;
      conversions?: number;
      shares?: number;
      timeOnPage?: number;
    }
  ): Promise<{
    strengths: string[];
    weaknesses: string[];
    actionableInsights: string[];
    predictedPerformance: {
      engagementScore: number;
      conversionProbability: number;
      shareability: number;
    };
  }> {
    if (!aiService) {
      throw new Error('AI content analysis is not available');
    }

    const metricsText = metrics
      ? `
Current Performance Metrics:
- Views: ${metrics.views || 0}
- Clicks: ${metrics.clicks || 0}
- Conversions: ${metrics.conversions || 0}
- Shares: ${metrics.shares || 0}
- Time on page: ${metrics.timeOnPage || 0}s`
      : '';

    const prompt = `Analyze this content for performance optimization:

Content:
"${content}"
${metricsText}

Provide analysis on:
1. Content strengths (what works well)
2. Content weaknesses (what could be improved)
3. Actionable insights for optimization
4. Predicted performance metrics (0-100 scale):
   - Engagement score
   - Conversion probability
   - Shareability

Return as JSON with clear, actionable recommendations.`;

    try {
      const response = await aiService['generateContent'](
        prompt,
        'You are a content performance analyst specializing in digital marketing analytics.',
        0.5,
        1500
      );

      return JSON.parse(response);
    } catch (error) {
      console.error('Content analysis failed:', error);
      throw new Error('Failed to analyze content');
    }
  }

  async abTestContent(
    contentA: string,
    contentB: string,
    testType: 'headline' | 'cta' | 'description' | 'full-page'
  ): Promise<{
    winner: 'A' | 'B' | 'tie';
    confidence: number;
    reasoning: string;
    predictions: {
      versionA: {
        ctr: number;
        conversion: number;
        engagement: number;
      };
      versionB: {
        ctr: number;
        conversion: number;
        engagement: number;
      };
    };
  }> {
    if (!aiService) {
      throw new Error('AI content analysis is not available');
    }

    const prompt = `Perform A/B test analysis for these two content variations:

Test Type: ${testType}

Version A:
"${contentA}"

Version B:
"${contentB}"

Analyze and predict:
1. Which version will perform better
2. Confidence level (0-100%)
3. Reasoning for the prediction
4. Predicted performance metrics for both versions:
   - Click-through rate (CTR)
   - Conversion rate
   - Engagement rate

Return as JSON with detailed analysis.`;

    try {
      const response = await aiService['generateContent'](
        prompt,
        'You are an expert in conversion rate optimization and A/B testing analysis.',
        0.3,
        1500
      );

      return JSON.parse(response);
    } catch (error) {
      console.error('A/B test analysis failed:', error);
      throw new Error('Failed to analyze A/B test');
    }
  }

  async generateHeadlineOptions(
    content: string,
    count: number = 5,
    style: 'clickbait' | 'professional' | 'question' | 'how-to' | 'listicle' = 'professional'
  ): Promise<Array<{
    headline: string;
    score: number;
    predictedCTR: number;
    emotionalAppeal: string[];
  }>> {
    if (!aiService) {
      throw new Error('AI headline generation is not available');
    }

    const prompt = `Generate ${count} compelling headlines for this content:

Content:
"${content}"

Headline Style: ${style}

For each headline, provide:
1. The headline text
2. Quality score (0-100)
3. Predicted click-through rate
4. Emotional appeals used (e.g., curiosity, urgency, benefit)

Focus on creating headlines that:
- Grab attention immediately
- Communicate value clearly
- Encourage clicks
- Are SEO-friendly

Return as JSON array of headlines.`;

    try {
      const response = await aiService['generateContent'](
        prompt,
        'You are an expert copywriter specializing in creating high-converting headlines.',
        0.8,
        1500
      );

      return JSON.parse(response);
    } catch (error) {
      console.error('Headline generation failed:', error);
      throw new Error('Failed to generate headlines');
    }
  }

  async improveCTA(cta: string, context: string, goal: 'click' | 'sign-up' | 'purchase' | 'learn-more'): Promise<{
    improvedCTAs: Array<{
      text: string;
      score: number;
      reasoning: string;
      urgency: 'low' | 'medium' | 'high';
    }>;
    bestPractices: string[];
  }> {
    if (!aiService) {
      throw new Error('AI CTA optimization is not available');
    }

    const prompt = `Optimize this call-to-action for better conversion:

Current CTA: "${cta}"
Context: ${context}
Goal: ${goal}

Generate 5 improved CTAs with:
1. The CTA text
2. Conversion score (0-100)
3. Reasoning for improvement
4. Urgency level

Also provide best practices for CTAs in this context.

Focus on:
- Action-oriented language
- Clear value proposition
- Appropriate urgency
- Mobile-friendly length

Return as JSON.`;

    try {
      const response = await aiService['generateContent'](
        prompt,
        'You are a conversion optimization expert specializing in call-to-action optimization.',
        0.7,
        1000
      );

      return JSON.parse(response);
    } catch (error) {
      console.error('CTA optimization failed:', error);
      throw new Error('Failed to optimize CTA');
    }
  }

  // Helper methods
  private countWords(text: string): number {
    return text.trim().split(/\s+/).filter(word => word.length > 0).length;
  }

  private calculateKeywordDensity(content: string, keywords: string[]): Record<string, number> {
    const words = content.toLowerCase().split(/\s+/);
    const totalWords = words.length;
    const density: Record<string, number> = {};

    keywords.forEach(keyword => {
      const keywordLower = keyword.toLowerCase();
      const count = words.filter(word => word.includes(keywordLower)).length;
      density[keyword] = (count / totalWords) * 100;
    });

    return density;
  }
}

// Export singleton instance
export const aiContentOptimizer = AIContentOptimizer.getInstance();

// React hook for content optimization
import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';

export function useContentOptimizer() {
  const [isOptimizing, setIsOptimizing] = useState(false);
  const queryClient = useQueryClient();

  const optimizeMutation = useMutation({
    mutationFn: (request: ContentOptimizationRequest) => {
      setIsOptimizing(true);
      return aiContentOptimizer.optimizeContent(request);
    },
    onSuccess: () => {
      setIsOptimizing(false);
      queryClient.invalidateQueries({ queryKey: ['content-optimization'] });
    },
    onError: () => {
      setIsOptimizing(false);
    },
  });

  const generateVariationsMutation = useMutation({
    mutationFn: ({
      content,
      variations,
      options,
    }: {
      content: string;
      variations?: number;
      options?: any;
    }) => aiContentOptimizer.generateContentVariations(content, variations, options),
  });

  const analyzeMutation = useMutation({
    mutationFn: ({
      content,
      metrics,
    }: {
      content: string;
      metrics?: any;
    }) => aiContentOptimizer.analyzeContentPerformance(content, metrics),
  });

  return {
    optimizeContent: optimizeMutation.mutateAsync,
    generateVariations: generateVariationsMutation.mutateAsync,
    analyzeContent: analyzeMutation.mutateAsync,
    isOptimizing,
    error: optimizeMutation.error,
  };
}