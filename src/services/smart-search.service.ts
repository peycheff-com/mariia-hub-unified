import { supabase } from '@/integrations/supabase/client';
import type { KBSearchFilters, KBSearchResult, KBArticle, FAQItem } from '@/types/knowledge-base';

// Smart Search Service with AI-powered features
export class SmartSearchService {
  // Synonym mappings for better search results
  private static readonly synonyms: Record<string, string[]> = {
    'lip': ['lips', 'mouth', 'kiss'],
    'brow': ['eyebrow', 'brows', 'forehead'],
    'facial': ['face', 'skincare', 'treatment'],
    'makeup': ['cosmetics', 'beauty', 'cosmetic'],
    'fitness': ['exercise', 'workout', 'training', 'gym'],
    'glutes': ['butt', 'hips', 'bottom', 'rear'],
    'appointment': ['booking', 'reservation', 'schedule'],
    'price': ['cost', 'fee', 'payment', 'rates'],
    'cancel': ['refund', 'postpone', 'reschedule'],
    'aftercare': ['after-care', 'post-treatment', 'recovery'],
    'preparation': ['prep', 'before', 'pre-treatment'],
  };

  // Stop words to exclude from search
  private static readonly stopWords = new Set([
    'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by',
    'i', 'you', 'he', 'she', 'it', 'we', 'they', 'me', 'him', 'her', 'us', 'them',
    'what', 'where', 'when', 'why', 'how', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
    'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might',
  ]);

  // Enhanced search with AI-powered features
  static async smartSearch(
    query: string,
    filters: KBSearchFilters = {},
    options: {
      maxResults?: number;
      includeSuggestions?: boolean;
      enableFuzzyMatching?: boolean;
      boostRecent?: boolean;
    } = {}
  ): Promise<KBSearchResult & { suggestions?: string[]; correctedQuery?: string }> {
    const maxResults = options.maxResults || 20;
    const startTime = Date.now();

    try {
      // Preprocess the query
      const processedQuery = this.preprocessQuery(query);
      const expandedQuery = this.expandWithSynonyms(processedQuery);
      const correctedQuery = options.enableFuzzyMatching ? this.spellCheck(query) : query;

      // Log the search for analytics
      await this.logSearch(processedQuery, filters, correctedQuery !== query ? correctedQuery : undefined);

      // Search with multiple strategies
      const [exactResults, semanticResults, faqResults] = await Promise.all([
        this.exactMatchSearch(expandedQuery, filters, maxResults * 0.6),
        this.semanticSearch(processedQuery, filters, maxResults * 0.3),
        this.faqSearch(processedQuery, filters, Math.floor(maxResults * 0.2)),
      ]);

      // Combine and rank results
      const combinedResults = this.combineAndRankResults(
        exactResults,
        semanticResults,
        faqResults,
        processedQuery,
        options.boostRecent
      );

      // Get suggestions if enabled
      let suggestions: string[] = [];
      if (options.includeSuggestions && combinedResults.articles.length < maxResults) {
        suggestions = await this.getSmartSuggestions(processedQuery, filters);
      }

      const searchTime = Date.now() - startTime;

      return {
        articles: combinedResults.articles.slice(0, maxResults),
        faqs: combinedResults.faqs.slice(0, Math.floor(maxResults * 0.2)),
        total_count: combinedResults.articles.length + combinedResults.faqs.length,
        search_time: searchTime,
        suggestions: suggestions.length > 0 ? suggestions : undefined,
        correctedQuery: correctedQuery !== query ? correctedQuery : undefined,
      };
    } catch (error) {
      const searchTime = Date.now() - startTime;
      console.error('Smart search error:', error);

      return {
        articles: [],
        faqs: [],
        total_count: 0,
        search_time: searchTime,
      };
    }
  }

  // Exact match search with PostgreSQL full-text search
  private static async exactMatchSearch(
    query: string,
    filters: KBSearchFilters,
    limit: number
  ): Promise<{ articles: (KBArticle & { relevance_score: number })[] }> {
    try {
      let articlesQuery = supabase
        .from('kb_articles')
        .select('*, category:kb_categories(*), services(*)')
        .eq('status', 'published');

      // Apply full-text search with ranking
      if (query) {
        articlesQuery = articlesQuery.textSearch('search_vector', query, {
          type: 'websearch',
          config: 'english',
        });
      }

      // Apply filters
      this.applyFilters(articlesQuery, filters);

      // Sort by relevance and engagement
      articlesQuery = articlesQuery
        .order('view_count', { ascending: false })
        .order('helpful_count', { ascending: false })
        .limit(Math.ceil(limit));

      const { data, error } = await articlesQuery;

      if (error) throw error;

      // Calculate relevance scores
      const articlesWithScores = (data || []).map(article => ({
        ...article,
        relevance_score: this.calculateRelevanceScore(article, query),
      }));

      return { articles: articlesWithScores };
    } catch (error) {
      console.error('Exact match search error:', error);
      return { articles: [] };
    }
  }

  // Semantic search using content similarity
  private static async semanticSearch(
    query: string,
    filters: KBSearchFilters,
    limit: number
  ): Promise<{ articles: (KBArticle & { relevance_score: number })[] }> {
    try {
      // For semantic search, we'll use a simplified approach based on tags and content
      const keywords = this.extractKeywords(query);

      let articlesQuery = supabase
        .from('kb_articles')
        .select('*, category:kb_categories(*), services(*)')
        .eq('status', 'published');

      // Search in tags and keywords
      if (keywords.length > 0) {
        const tagConditions = keywords.map(keyword => `tags.cs.{${keyword}}`).join(' OR ');
        articlesQuery = articlesQuery.or(tagConditions);
      }

      // Apply filters
      this.applyFilters(articlesQuery, filters);

      articlesQuery = articlesQuery
        .order('view_count', { ascending: false })
        .limit(Math.ceil(limit));

      const { data, error } = await articlesQuery;

      if (error) throw error;

      const articlesWithScores = (data || []).map(article => ({
        ...article,
        relevance_score: this.calculateSemanticScore(article, keywords),
      }));

      return { articles: articlesWithScores };
    } catch (error) {
      console.error('Semantic search error:', error);
      return { articles: [] };
    }
  }

  // FAQ search with question matching
  private static async faqSearch(
    query: string,
    filters: KBSearchFilters,
    limit: number
  ): Promise<{ faqs: (FAQItem & { relevance_score: number })[] }> {
    try {
      let faqsQuery = supabase
        .from('faq_items')
        .select('*, category:faq_categories(*), services(*)')
        .eq('is_active', true);

      // Search in questions and answers
      if (query) {
        faqsQuery = faqsQuery.or(
          `question.ilike.%${query}%,answer.ilike.%${query}%,question_pl.ilike.%${query}%,answer_pl.ilike.%${query}%`
        );
      }

      // Apply filters
      if (filters.category_id) {
        faqsQuery = faqsQuery.eq('category_id', filters.category_id);
      }

      if (filters.service_type) {
        faqsQuery = faqsQuery.eq('services.service_type', filters.service_type);
      }

      faqsQuery = faqsQuery
        .order('view_count', { ascending: false })
        .order('helpful_count', { ascending: false })
        .limit(limit);

      const { data, error } = await faqsQuery;

      if (error) throw error;

      const faqsWithScores = (data || []).map(faq => ({
        ...faq,
        relevance_score: this.calculateFAQRelevanceScore(faq, query),
      }));

      return { faqs: faqsWithScores };
    } catch (error) {
      console.error('FAQ search error:', error);
      return { faqs: [] };
    }
  }

  // Combine and rank results from different search strategies
  private static combineAndRankResults(
    exactResults: { articles: (KBArticle & { relevance_score: number })[] },
    semanticResults: { articles: (KBArticle & { relevance_score: number })[] },
    faqResults: { faqs: (FAQItem & { relevance_score: number })[] },
    query: string,
    boostRecent?: boolean
  ): {
    articles: (KBArticle & { relevance_score: number })[];
    faqs: (FAQItem & { relevance_score: number })[];
  } {
    // Combine article results and remove duplicates
    const articleMap = new Map<string, KBArticle & { relevance_score: number }>();

    // Add exact results with higher weight
    exactResults.articles.forEach(article => {
      articleMap.set(article.id, {
        ...article,
        relevance_score: article.relevance_score * 1.5,
      });
    });

    // Add semantic results
    semanticResults.articles.forEach(article => {
      const existing = articleMap.get(article.id);
      if (existing) {
        // Boost if found by multiple strategies
        existing.relevance_score += article.relevance_score * 0.8;
      } else {
        articleMap.set(article.id, article);
      }
    });

    // Apply recent content boost if enabled
    if (boostRecent) {
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      articleMap.forEach(article => {
        if (article.published_at && new Date(article.published_at) > thirtyDaysAgo) {
          article.relevance_score *= 1.2;
        }
      });
    }

    // Sort articles by relevance score
    const articles = Array.from(articleMap.values())
      .sort((a, b) => b.relevance_score - a.relevance_score);

    // Sort FAQs by relevance score
    const faqs = faqResults.faqs.sort((a, b) => b.relevance_score - a.relevance_score);

    return { articles, faqs };
  }

  // Query preprocessing
  private static preprocessQuery(query: string): string {
    return query
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ') // Remove special characters
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim();
  }

  // Expand query with synonyms
  private static expandWithSynonyms(query: string): string {
    const words = query.split(' ');
    const expandedWords: string[] = [];

    words.forEach(word => {
      expandedWords.push(word);
      const synonyms = this.synonyms[word];
      if (synonyms) {
        expandedWords.push(...synonyms);
      }
    });

    return expandedWords.join(' & ');
  }

  // Simple spell checking
  private static spellCheck(query: string): string {
    // This is a simplified implementation
    // In a real application, you'd use a proper spell checking service
    return query;
  }

  // Extract keywords from query
  private static extractKeywords(query: string): string[] {
    return query
      .split(' ')
      .filter(word => word.length > 2 && !this.stopWords.has(word))
      .slice(0, 5); // Limit to top 5 keywords
  }

  // Calculate relevance score for exact match
  private static calculateRelevanceScore(article: KBArticle, query: string): number {
    let score = 0;

    // Title matches are most important
    if (article.title.toLowerCase().includes(query.toLowerCase())) {
      score += 10;
    }

    // Summary matches
    if (article.summary?.toLowerCase().includes(query.toLowerCase())) {
      score += 5;
    }

    // Content matches
    if (article.content.toLowerCase().includes(query.toLowerCase())) {
      score += 3;
    }

    // Tag matches
    if (article.tags?.some(tag => tag.toLowerCase().includes(query.toLowerCase()))) {
      score += 7;
    }

    // Engagement boost
    score += Math.log(1 + article.view_count) * 0.1;
    score += article.helpful_count * 0.01;
    score -= article.not_helpful_count * 0.02;

    return score;
  }

  // Calculate semantic similarity score
  private static calculateSemanticScore(article: KBArticle, keywords: string[]): number {
    let score = 0;
    const articleText = `${article.title} ${article.summary || ''} ${article.content}`.toLowerCase();

    keywords.forEach(keyword => {
      const occurrences = (articleText.match(new RegExp(keyword, 'g')) || []).length;
      score += occurrences * 2;

      // Check in tags
      if (article.tags?.some(tag => tag.toLowerCase().includes(keyword))) {
        score += 5;
      }
    });

    return score;
  }

  // Calculate FAQ relevance score
  private static calculateFAQRelevanceScore(faq: FAQItem, query: string): number {
    let score = 0;
    const queryLower = query.toLowerCase();

    // Question matches are most important
    if (faq.question.toLowerCase().includes(queryLower)) {
      score += 10;
    }

    // Answer matches
    if (faq.answer.toLowerCase().includes(queryLower)) {
      score += 5;
    }

    // Polish language matches
    if (faq.question_pl?.toLowerCase().includes(queryLower)) {
      score += 8;
    }
    if (faq.answer_pl?.toLowerCase().includes(queryLower)) {
      score += 4;
    }

    // Featured FAQ boost
    if (faq.is_featured) {
      score += 3;
    }

    // Engagement boost
    score += Math.log(1 + faq.view_count) * 0.1;
    score += faq.helpful_count * 0.02;
    score -= faq.not_helpful_count * 0.03;

    return score;
  }

  // Get smart suggestions based on popular searches and related content
  private static async getSmartSuggestions(
    query: string,
    filters: KBSearchFilters
  ): Promise<string[]> {
    try {
      // Get popular search terms
      const { data: popularSearches } = await supabase
        .from('kb_search_analytics')
        .select('search_query')
        .ilike('search_query', `%${query}%`)
        .group('search_query')
        .order('count', { ascending: false })
        .limit(5);

      // Get related article titles
      const { data: relatedArticles } = await supabase
        .from('kb_articles')
        .select('title')
        .eq('status', 'published')
        .ilike('title', `%${query}%`)
        .order('view_count', { ascending: false })
        .limit(5);

      const suggestions = new Set<string>();

      // Add popular searches
      popularSearches?.forEach(search => {
        suggestions.add(search.search_query);
      });

      // Add related article titles
      relatedArticles?.forEach(article => {
        suggestions.add(article.title);
      });

      return Array.from(suggestions).slice(0, 5);
    } catch (error) {
      console.error('Error getting suggestions:', error);
      return [];
    }
  }

  // Apply filters to query
  private static applyFilters(
    query: any,
    filters: KBSearchFilters
  ): void {
    if (filters.category_id) {
      query = query.eq('category_id', filters.category_id);
    }

    if (filters.service_type) {
      query = query.eq('services.service_type', filters.service_type);
    }

    if (filters.content_type) {
      query = query.eq('content_type', filters.content_type);
    }

    if (filters.language) {
      query = query.eq('language', filters.language);
    }

    if (filters.tags && filters.tags.length > 0) {
      const tagConditions = filters.tags.map(tag => `tags.cs.{${tag}}`).join(' OR ');
      query = query.or(tagConditions);
    }

    if (filters.date_range) {
      query = query
        .gte('published_at', filters.date_range.from)
        .lte('published_at', filters.date_range.to);
    }
  }

  // Log search for analytics
  private static async logSearch(
    query: string,
    filters: KBSearchFilters,
    correctedQuery?: string
  ): Promise<void> {
    try {
      const { error } = await supabase
        .from('kb_search_analytics')
        .insert({
          search_query: query,
          filters_used: filters,
          corrected_query: correctedQuery,
          session_id: this.getSessionId(),
          created_at: new Date().toISOString(),
        });

      if (error) console.error('Error logging search:', error);
    } catch (error) {
      console.error('Error logging search:', error);
    }
  }

  // Get search analytics and insights
  static async getSearchInsights(days: number = 30): Promise<{
    popularQueries: Array<{ query: string; count: number; avg_results: number }>;
    noResultQueries: Array<{ query: string; count: number }>;
    searchTrends: Array<{ date: string; searches: number }>;
    topCategories: Array<{ category: string; searches: number }>;
  }> {
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    try {
      const [
        popularResult,
        noResultResult,
        trendsResult,
        categoriesResult,
      ] = await Promise.all([
        // Popular queries
        supabase
          .from('kb_search_analytics')
          .select('search_query, results_count')
          .gte('created_at', startDate.toISOString())
          .then(({ data, error }) => {
            if (error) throw error;
            const queryMap = new Map<string, { count: number; totalResults: number }>();
            data?.forEach(item => {
              const existing = queryMap.get(item.search_query) || { count: 0, totalResults: 0 };
              queryMap.set(item.search_query, {
                count: existing.count + 1,
                totalResults: existing.totalResults + (item.results_count || 0),
              });
            });
            return Array.from(queryMap.entries())
              .map(([query, stats]) => ({
                query,
                count: stats.count,
                avg_results: Math.round(stats.totalResults / stats.count),
              }))
              .sort((a, b) => b.count - a.count)
              .slice(0, 10);
          }),

        // No result queries
        supabase
          .from('kb_search_analytics')
          .select('search_query')
          .eq('results_count', 0)
          .gte('created_at', startDate.toISOString())
          .then(({ data, error }) => {
            if (error) throw error;
            const queryCount = new Map<string, number>();
            data?.forEach(item => {
              queryCount.set(item.search_query, (queryCount.get(item.search_query) || 0) + 1);
            });
            return Array.from(queryCount.entries())
              .map(([query, count]) => ({ query, count }))
              .sort((a, b) => b.count - a.count)
              .slice(0, 10);
          }),

        // Search trends
        supabase
          .from('kb_search_analytics')
          .select('created_at')
          .gte('created_at', startDate.toISOString())
          .then(({ data, error }) => {
            if (error) throw error;
            const dailyCount = new Map<string, number>();
            data?.forEach(item => {
              const date = new Date(item.created_at).toISOString().split('T')[0];
              dailyCount.set(date, (dailyCount.get(date) || 0) + 1);
            });
            return Array.from(dailyCount.entries())
              .map(([date, searches]) => ({ date, searches }))
              .sort((a, b) => a.date.localeCompare(b.date));
          }),

        // Top categories
        supabase
          .from('kb_search_analytics')
          .select('filters_used')
          .gte('created_at', startDate.toISOString())
          .then(({ data, error }) => {
            if (error) throw error;
            const categoryCount = new Map<string, number>();
            data?.forEach(item => {
              const filters = item.filters_used as any;
              if (filters?.category_id) {
                categoryCount.set(
                  filters.category_id,
                  (categoryCount.get(filters.category_id) || 0) + 1
                );
              }
            });
            return Array.from(categoryCount.entries())
              .map(([category, searches]) => ({ category, searches }))
              .sort((a, b) => b.searches - a.searches)
              .slice(0, 10);
          }),
      ]);

      return {
        popularQueries: popularResult,
        noResultQueries: noResultResult,
        searchTrends: trendsResult,
        topCategories: categoriesResult,
      };
    } catch (error) {
      console.error('Error getting search insights:', error);
      return {
        popularQueries: [],
        noResultQueries: [],
        searchTrends: [],
        topCategories: [],
      };
    }
  }

  // Auto-complete suggestions
  static async getAutoCompleteSuggestions(partialQuery: string, limit: number = 5): Promise<string[]> {
    if (!partialQuery || partialQuery.length < 2) return [];

    try {
      // Get article title suggestions
      const { data: articles } = await supabase
        .from('kb_articles')
        .select('title')
        .eq('status', 'published')
        .ilike('title', `%${partialQuery}%`)
        .limit(limit);

      // Get FAQ question suggestions
      const { data: faqs } = await supabase
        .from('faq_items')
        .select('question')
        .eq('is_active', true)
        .ilike('question', `%${partialQuery}%`)
        .limit(limit);

      // Get popular search suggestions
      const { data: searches } = await supabase
        .from('kb_search_analytics')
        .select('search_query')
        .ilike('search_query', `%${partialQuery}%`)
        .group('search_query')
        .order('count', { ascending: false })
        .limit(limit);

      const suggestions = new Set<string>();

      articles?.forEach(article => suggestions.add(article.title));
      faqs?.forEach(faq => suggestions.add(faq.question));
      searches?.forEach(search => suggestions.add(search.search_query));

      return Array.from(suggestions).slice(0, limit);
    } catch (error) {
      console.error('Error getting auto-complete suggestions:', error);
      return [];
    }
  }

  private static getSessionId(): string {
    // In a real implementation, this would get the session ID from context or cookies
    return 'anonymous';
  }
}

export default SmartSearchService;