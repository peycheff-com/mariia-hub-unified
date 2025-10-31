import { aiService } from './config';

export interface SEOAnalysisRequest {
  url?: string;
  content: string;
  title?: string;
  description?: string;
  keywords?: string[];
  targetLocation?: string;
  contentType: 'blog-post' | 'service-page' | 'landing-page' | 'product-page';
}

export interface SEOAnalysisResult {
  overallScore: number;
  scores: {
    technical: number;
    content: number;
    performance: number;
    authority: number;
  };
  issues: Array<{
    type: 'error' | 'warning' | 'info';
    category: 'technical' | 'content' | 'performance';
    title: string;
    description: string;
    impact: 'high' | 'medium' | 'low';
    recommendation: string;
  }>;
  opportunities: Array<{
    title: string;
    description: string;
    potentialImpact: string;
    difficulty: 'easy' | 'medium' | 'hard';
  }>;
  keywordAnalysis: {
    primary: string;
    secondary: string[];
    density: Record<string, number>;
    suggestions: string[];
    competitorKeywords: string[];
  };
  contentOptimization: {
    titleSuggestions: string[];
    metaDescription: string;
    headings: Array<{
      level: number;
      text: string;
      optimized: boolean;
    }>;
    internalLinks: string[];
    externalLinks: string[];
    imageAltTexts: Array<{
      src: string;
      alt: string;
      optimized: boolean;
    }>;
  };
  competitorAnalysis: {
    topCompetitors: Array<{
      url: string;
      title: string;
      score: number;
      strengths: string[];
      weaknesses: string[];
    }>;
    contentGap: string[];
    backlinkOpportunities: string[];
  };
  localSEO: {
    googleBusinessProfile: boolean;
    localCitations: number;
    reviews: {
      count: number;
      average: number;
      sentiment: string;
    };
    napConsistency: boolean; // Name, Address, Phone
  };
}

export class AISEOAnalyzer {
  private static instance: AISEOAnalyzer;

  static getInstance(): AISEOAnalyzer {
    if (!AISEOAnalyzer.instance) {
      AISEOAnalyzer.instance = new AISEOAnalyzer();
    }
    return AISEOAnalyzer.instance;
  }

  async analyzeSEO(request: SEOAnalysisRequest): Promise<SEOAnalysisResult> {
    if (!aiService) {
      throw new Error('AI SEO analysis is not available');
    }

    const prompt = `Perform comprehensive SEO analysis for this ${request.contentType}:

URL: ${request.url || 'Not provided'}
Title: ${request.title || 'Not provided'}
Meta Description: ${request.description || 'Not provided'}
Target Keywords: ${request.keywords?.join(', ') || 'Not provided'}
Target Location: ${request.targetLocation || 'Not provided'}

Content:
"${request.content.substring(0, 8000)}" ${request.content.length > 8000 ? '... (truncated)' : ''}

Analyze and provide:

1. Overall SEO score (0-100)
2. Category scores:
   - Technical SEO (0-100)
   - Content Quality (0-100)
   - Performance (0-100)
   - Authority (0-100)

3. Issues identified with:
   - Type: error/warning/info
   - Category: technical/content/performance
   - Impact level: high/medium/low
   - Specific recommendations

4. Optimization opportunities with potential impact

5. Keyword analysis:
   - Primary keyword suggestion
   - Secondary keywords
   - Current density analysis
   - Competitor keywords to target

6. Content optimization recommendations:
   - Title suggestions (5 options)
   - Meta description
   - Heading structure optimization
   - Internal linking opportunities
   - External linking suggestions
   - Image alt text optimizations

7. Competitor analysis:
   - Top 3 competitors
   - Their strengths/weaknesses
   - Content gaps to fill
   - Backlink opportunities

8. Local SEO factors (if applicable)

Return comprehensive analysis as JSON with actionable recommendations.`;

    try {
      const response = await aiService['generateContent'](
        prompt,
        'You are an expert SEO analyst with deep knowledge of search engine algorithms, particularly for beauty and fitness industries.',
        0.5,
        3000
      );

      const result = JSON.parse(response);

      // Calculate derived metrics
      result.contentOptimization.headings = this.analyzeHeadings(request.content);
      result.contentOptimization.internalLinks = this.extractInternalLinks(request.content);
      result.contentOptimization.externalLinks = this.extractExternalLinks(request.content);

      return result;
    } catch (error) {
      console.error('SEO analysis failed:', error);
      throw new Error('Failed to analyze SEO');
    }
  }

  async generateSEOFriendlyContent(
    topic: string,
    keywords: string[],
    targetAudience: string,
    wordCount: number = 1000,
    tone: string = 'professional'
  ): Promise<{
    content: string;
    seoElements: {
      title: string;
      metaDescription: string;
      urlSlug: string;
      headings: string[];
      keyPoints: string[];
      internalLinks: string[];
    };
    seoChecklist: Array<{
      item: string;
      completed: boolean;
      importance: 'critical' | 'important' | 'recommended';
    }>;
  }> {
    if (!aiService) {
      throw new Error('AI SEO content generation is not available');
    }

    const prompt = `Generate SEO-optimized content about "${topic}" with these requirements:

Target Keywords: ${keywords.join(', ')}
Target Audience: ${targetAudience}
Word Count: ${wordCount}
Tone: ${tone}

Generate:
1. SEO-optimized blog post/article
2. SEO elements (title, meta description, slug, headings)
3. SEO checklist for implementation

Content should:
- Include primary keyword in title, first paragraph, and headings
- Use secondary keywords naturally throughout
- Have proper heading structure (H1, H2, H3)
- Include internal linking opportunities
- Be readable and engaging
- Target featured snippets
- Include FAQ section

Return as JSON with all elements.`;

    try {
      const response = await aiService['generateContent'](
        prompt,
        'You are an SEO content specialist who creates content that ranks well in search engines.',
        0.7,
        3000
      );

      return JSON.parse(response);
    } catch (error) {
      console.error('SEO content generation failed:', error);
      throw new Error('Failed to generate SEO content');
    }
  }

  async analyzeCompetitors(
    targetKeyword: string,
    location?: string,
    topN: number = 5
  ): Promise<{
    competitors: Array<{
      url: string;
      title: string;
      description: string;
      rankingFactors: {
        contentScore: number;
        backlinks: number;
        domainAuthority: number;
        pageAuthority: number;
        socialShares: number;
      };
      strengths: string[];
      weaknesses: string[];
      contentOutline: string[];
    }>;
    contentGap: string[];
    keywordOpportunities: Array<{
      keyword: string;
      difficulty: number;
      volume: number;
      opportunity: string;
    }>;
  }> {
    if (!aiService) {
      throw new Error('AI competitor analysis is not available');
    }

    const prompt = `Analyze top ${topN} competitors for keyword: "${targetKeyword}"
    ${location ? `in ${location}` : 'globally'}

For each competitor, analyze:
1. URL and title
2. Ranking factors (content, backlinks, authority, social)
3. Content strengths and weaknesses
4. Content structure/outline

Also identify:
1. Content gaps we can fill
2. Keyword opportunities with difficulty/volume
3. Strategic advantages we can leverage

Focus on beauty/fitness industry competitors.
Return comprehensive analysis as JSON.`;

    try {
      const response = await aiService['generateContent'](
        prompt,
        'You are an SEO competitive intelligence expert specializing in competitor analysis.',
        0.4,
        2500
      );

      return JSON.parse(response);
    } catch (error) {
      console.error('Competitor analysis failed:', error);
      throw new Error('Failed to analyze competitors');
    }
  }

  async generateSchemaMarkup(
    contentType: 'service' | 'article' | 'product' | 'local-business',
    data: Record<string, any>
  ): Promise<{
    schemaLD: string;
    testing: {
      tool: string;
      instructions: string;
    };
    implementation: string[];
  }> {
    const schemas = {
      service: 'Service',
      article: 'Article',
      product: 'Product',
      'local-business': 'LocalBusiness',
    };

    const prompt = `Generate structured data (Schema.org) markup for ${contentType}:

Type: ${schemas[contentType]}
Data: ${JSON.stringify(data, null, 2)}

Generate:
1. Complete JSON-LD schema markup
2. Testing instructions
3. Implementation guidance

Ensure schema is:
- Valid and complete
- Includes all required properties
- Optimized for rich snippets
- Follows Google guidelines

Return as JSON with schema markup and instructions.`;

    try {
      const response = await aiService['generateContent'](
        prompt,
        'You are a structured data expert specializing in Schema.org markup.',
        0.3,
        1500
      );

      return JSON.parse(response);
    } catch (error) {
      console.error('Schema generation failed:', error);
      throw new Error('Failed to generate schema markup');
    }
  }

  async trackKeywordRankings(
    keywords: string[],
    location?: string,
    device: 'desktop' | 'mobile' | 'all' = 'all'
  ): Promise<{
    rankings: Array<{
      keyword: string;
      currentRank: number;
      previousRank: number;
      change: number;
      url: string;
      title: string;
    }>;
    averagePosition: number;
    visibilityScore: number;
    opportunities: string[];
  }> {
    // This would integrate with actual ranking APIs like Google Search Console
    // For now, return simulated data
    const rankings = keywords.map(keyword => ({
      keyword,
      currentRank: Math.floor(Math.random() * 100) + 1,
      previousRank: Math.floor(Math.random() * 100) + 1,
      change: Math.floor(Math.random() * 20) - 10,
      url: `https://example.com/${keyword.replace(/\s+/g, '-')}`,
      title: `${keyword} - mariiaborysevych`,
    }));

    return {
      rankings,
      averagePosition: rankings.reduce((sum, r) => sum + r.currentRank, 0) / rankings.length,
      visibilityScore: Math.random() * 100,
      opportunities: [
        'Improve meta descriptions',
        'Add more internal links',
        'Optimize page speed',
        'Create content clusters',
      ],
    };
  }

  async generateContentCalendar(
    keywords: string[],
    timeframe: 'month' | 'quarter' | 'year' = 'month',
    contentTypes: string[] = ['blog', 'service', 'testimonial']
  ): Promise<{
    calendar: Array<{
      date: string;
      title: string;
      type: string;
      keywords: string[];
      priority: 'high' | 'medium' | 'low';
      status: 'planned' | 'in-progress' | 'completed';
    }>;
    strategy: {
      contentPillars: string[];
      clusterTopics: string[];
      publishingFrequency: string;
      seasonalOpportunities: string[];
    };
  }> {
    const prompt = `Generate SEO content calendar for ${timeframe}:

Keywords to target: ${keywords.join(', ')}
Content types: ${contentTypes.join(', ')}

Create:
1. Daily/weekly content schedule
2. Content pillars and clusters
3. Publishing strategy
4. Seasonal/trending opportunities

For each content piece:
- Date/timeframe
- Title idea
- Target keywords
- Priority level
- Content type

Focus on beauty/fitness industry seasonal trends.
Return as JSON with comprehensive calendar.`;

    try {
      const response = await aiService['generateContent'](
        prompt,
        'You are an SEO content strategist specializing in content planning and calendar creation.',
        0.6,
        2500
      );

      return JSON.parse(response);
    } catch (error) {
      console.error('Content calendar generation failed:', error);
      throw new Error('Failed to generate content calendar');
    }
  }

  // Helper methods
  private analyzeHeadings(content: string): Array<{ level: number; text: string; optimized: boolean }> {
    const headingRegex = /<h([1-6])[^>]*>(.*?)<\/h[1-6]>/gi;
    const headings = [];
    let match;

    while ((match = headingRegex.exec(content)) !== null) {
      headings.push({
        level: parseInt(match[1]),
        text: match[2].replace(/<[^>]*>/g, '').trim(),
        optimized: false, // Would analyze length, keywords, etc.
      });
    }

    return headings;
  }

  private extractInternalLinks(content: string): string[] {
    const linkRegex = /<a[^>]+href="([^"]+)"[^>]*>(.*?)<\/a>/gi;
    const links = [];
    let match;

    while ((match = linkRegex.exec(content)) !== null) {
      const url = match[1];
      if (url.startsWith('/') || url.includes(window.location.hostname)) {
        links.push(url);
      }
    }

    return [...new Set(links)]; // Remove duplicates
  }

  private extractExternalLinks(content: string): string[] {
    const linkRegex = /<a[^>]+href="([^"]+)"[^>]*>(.*?)<\/a>/gi;
    const links = [];
    let match;

    while ((match = linkRegex.exec(content)) !== null) {
      const url = match[1];
      if (!url.startsWith('/') && !url.includes(window.location.hostname)) {
        links.push(url);
      }
    }

    return [...new Set(links)]; // Remove duplicates
  }
}

// Export singleton instance
export const aiSEOAnalyzer = AISEOAnalyzer.getInstance();

// React hook for SEO analysis
import { useMutation, useQueryClient } from '@tanstack/react-query';

export function useSEOAnalyzer() {
  const queryClient = useQueryClient();

  const analyzeMutation = useMutation({
    mutationFn: (request: SEOAnalysisRequest) => aiSEOAnalyzer.analyzeSEO(request),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['seo-analysis'] });
    },
  });

  const generateContentMutation = useMutation({
    mutationFn: (params: {
      topic: string;
      keywords: string[];
      targetAudience: string;
      wordCount?: number;
      tone?: string;
    }) => aiSEOAnalyzer.generateSEOFriendlyContent(
      params.topic,
      params.keywords,
      params.targetAudience,
      params.wordCount,
      params.tone
    ),
  });

  const competitorAnalysisMutation = useMutation({
    mutationFn: (params: {
      targetKeyword: string;
      location?: string;
      topN?: number;
    }) => aiSEOAnalyzer.analyzeCompetitors(params.targetKeyword, params.location, params.topN),
  });

  return {
    analyzeSEO: analyzeMutation.mutateAsync,
    generateSEOContent: generateContentMutation.mutateAsync,
    analyzeCompetitors: competitorAnalysisMutation.mutateAsync,
    generateSchema: (type: string, data: any) => aiSEOAnalyzer.generateSchemaMarkup(type as any, data),
    trackRankings: (keywords: string[], location?: string) =>
      aiSEOAnalyzer.trackKeywordRankings(keywords, location),
    generateCalendar: (keywords: string[], timeframe?: string, types?: string[]) =>
      aiSEOAnalyzer.generateContentCalendar(keywords, timeframe as any, types),
    isAnalyzing: analyzeMutation.isPending,
    error: analyzeMutation.error,
  };
}