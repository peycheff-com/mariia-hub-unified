import { supabase } from '@/integrations/supabase/client';
import type {
  KBCategory,
  KBArticle,
  FAQCategory,
  FAQItem,
  KBSearchFilters,
  KBSearchRequest,
  KBSearchResult,
  KBDashboardMetrics,
  KBCreateArticleRequest,
  KBUpdateArticleRequest,
  FAQCreateRequest,
  FAQUpdateRequest,
  KBSettings,
  KBUserBookmark,
  KBArticleFeedback,
  FAQFeedback,
} from '@/types/knowledge-base';

// Knowledge Base Service
export class KnowledgeBaseService {
  // Categories
  static async getKBCategories(serviceType?: string): Promise<KBCategory[]> {
    let query = supabase
      .from('kb_categories')
      .select('*')
      .eq('is_active', true)
      .order('order_index');

    if (serviceType) {
      query = query.eq('service_type', serviceType);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data || [];
  }

  static async getKBCategoryBySlug(slug: string): Promise<KBCategory | null> {
    const { data, error } = await supabase
      .from('kb_categories')
      .select('*')
      .eq('slug', slug)
      .eq('is_active', true)
      .single();

    if (error) throw error;
    return data;
  }

  // Articles
  static async getArticles(
    filters: {
      category_id?: string;
      service_id?: string;
      service_type?: string;
      status?: string;
      limit?: number;
      offset?: number;
      featured?: boolean;
    } = {}
  ): Promise<{ articles: KBArticle[]; total: number }> {
    let query = supabase
      .from('kb_articles')
      .select('*, category:kb_categories(*), services(*)', { count: 'exact' });

    if (filters.category_id) {
      query = query.eq('category_id', filters.category_id);
    }

    if (filters.service_id) {
      query = query.eq('service_id', filters.service_id);
    }

    if (filters.service_type) {
      query = query.eq('services.service_type', filters.service_type);
    }

    if (filters.status) {
      query = query.eq('status', filters.status);
    } else {
      query = query.eq('status', 'published');
    }

    if (filters.featured) {
      query = query.order('view_count', { ascending: false }).limit(5);
    } else {
      query = query.order('published_at', { ascending: false });
    }

    if (filters.limit) {
      query = query.range(filters.offset || 0, (filters.offset || 0) + filters.limit - 1);
    }

    const { data, error, count } = await query;

    if (error) throw error;
    return { articles: data || [], total: count || 0 };
  }

  static async getArticleBySlug(slug: string): Promise<KBArticle | null> {
    const { data, error } = await supabase
      .from('kb_articles')
      .select(`
        *,
        category:kb_categories(*),
        service:services(*),
        author:profiles(id, full_name, avatar_url),
        related_articles:kb_related_articles(
          related_article_id,
          score,
          related_article:kb_articles(id, title, slug, summary, featured_image_url)
        )
      `)
      .eq('slug', slug)
      .eq('status', 'published')
      .single();

    if (error) throw error;
    return data;
  }

  static async getArticleById(id: string): Promise<KBArticle | null> {
    const { data, error } = await supabase
      .from('kb_articles')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  }

  static async createArticle(article: KBCreateArticleRequest, authorId: string): Promise<KBArticle> {
    const slug = this.generateSlug(article.title);

    const { data, error } = await supabase
      .from('kb_articles')
      .insert({
        ...article,
        slug,
        author_id: authorId,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async updateArticle(id: string, updates: KBUpdateArticleRequest): Promise<KBArticle> {
    // Generate new slug if title changed
    if (updates.title) {
      updates.slug = this.generateSlug(updates.title);
    }

    const { data, error } = await supabase
      .from('kb_articles')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async deleteArticle(id: string): Promise<void> {
    const { error } = await supabase
      .from('kb_articles')
      .update({ status: 'archived' })
      .eq('id', id);

    if (error) throw error;
  }

  // FAQ Categories
  static async getFAQCategories(serviceType?: string): Promise<FAQCategory[]> {
    let query = supabase
      .from('faq_categories')
      .select('*')
      .eq('is_active', true)
      .order('order_index');

    if (serviceType) {
      query = query.eq('service_type', serviceType);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data || [];
  }

  // FAQ Items
  static async getFAQs(
    filters: {
      category_id?: string;
      service_id?: string;
      service_type?: string;
      featured?: boolean;
      limit?: number;
    } = {}
  ): Promise<FAQItem[]> {
    let query = supabase
      .from('faq_items')
      .select('*, category:faq_categories(*), services(*)')
      .eq('is_active', true)
      .order('order_index');

    if (filters.category_id) {
      query = query.eq('category_id', filters.category_id);
    }

    if (filters.service_id) {
      query = query.eq('service_id', filters.service_id);
    }

    if (filters.service_type) {
      query = query.eq('services.service_type', filters.service_type);
    }

    if (filters.featured) {
      query = query.eq('is_featured', true);
    }

    if (filters.limit) {
      query = query.limit(filters.limit);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data || [];
  }

  static async getFAQById(id: string): Promise<FAQItem | null> {
    const { data, error } = await supabase
      .from('faq_items')
      .select('*, category:faq_categories(*), services(*)')
      .eq('id', id)
      .eq('is_active', true)
      .single();

    if (error) throw error;
    return data;
  }

  static async createFAQ(faq: FAQCreateRequest, createdBy: string): Promise<FAQItem> {
    const { data, error } = await supabase
      .from('faq_items')
      .insert({
        ...faq,
        created_by: createdBy,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async updateFAQ(id: string, updates: FAQUpdateRequest): Promise<FAQItem> {
    const { data, error } = await supabase
      .from('faq_items')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async deleteFAQ(id: string): Promise<void> {
    const { error } = await supabase
      .from('faq_items')
      .update({ is_active: false })
      .eq('id', id);

    if (error) throw error;
  }

  // Smart Search
  static async searchKB(request: KBSearchRequest): Promise<KBSearchResult> {
    const startTime = Date.now();

    try {
      // Log the search for analytics
      await this.logSearch(request.query, request.filters);

      // Search articles
      let articlesQuery = supabase
        .from('kb_articles')
        .select('*, category:kb_categories(*), services(*)')
        .eq('status', 'published');

      // Apply full-text search
      if (request.query) {
        articlesQuery = articlesQuery.textSearch('search_vector', request.query);
      }

      // Apply filters
      if (request.filters?.category_id) {
        articlesQuery = articlesQuery.eq('category_id', request.filters.category_id);
      }

      if (request.filters?.service_type) {
        articlesQuery = articlesQuery.eq('services.service_type', request.filters.service_type);
      }

      if (request.filters?.content_type) {
        articlesQuery = articlesQuery.eq('content_type', request.filters.content_type);
      }

      if (request.filters?.language) {
        articlesQuery = articlesQuery.eq('language', request.filters.language);
      }

      // Apply sorting
      const sortBy = request.sort_by || 'relevance';
      const sortOrder = request.sort_order || 'desc';

      switch (sortBy) {
        case 'published_at':
          articlesQuery = articlesQuery.order('published_at', { ascending: sortOrder === 'asc' });
          break;
        case 'view_count':
          articlesQuery = articlesQuery.order('view_count', { ascending: sortOrder === 'asc' });
          break;
        case 'helpful_count':
          articlesQuery = articlesQuery.order('helpful_count', { ascending: sortOrder === 'asc' });
          break;
        default: // relevance
          articlesQuery = articlesQuery.order('view_count', { ascending: false });
      }

      // Apply pagination
      const limit = Math.min(request.limit || 20, 50);
      const offset = request.offset || 0;
      articlesQuery = articlesQuery.range(offset, offset + limit - 1);

      const { data: articles, error: articlesError } = await articlesQuery;

      if (articlesError) throw articlesError;

      // Search FAQs
      let faqsQuery = supabase
        .from('faq_items')
        .select('*, category:faq_categories(*), services(*)')
        .eq('is_active', true);

      // Simple text search for FAQs
      if (request.query) {
        faqsQuery = faqsQuery.or(`question.ilike.%${request.query}%,answer.ilike.%${request.query}%`);
      }

      // Apply filters
      if (request.filters?.category_id) {
        faqsQuery = faqsQuery.eq('category_id', request.filters.category_id);
      }

      if (request.filters?.service_type) {
        faqsQuery = faqsQuery.eq('services.service_type', request.filters.service_type);
      }

      faqsQuery = faqsQuery.order('view_count', { ascending: false }).limit(5);

      const { data: faqs, error: faqsError } = await faqsQuery;

      if (faqsError) throw faqsError;

      const searchTime = Date.now() - startTime;

      return {
        articles: articles || [],
        faqs: faqs || [],
        total_count: (articles?.length || 0) + (faqs?.length || 0),
        search_time: searchTime,
      };
    } catch (error) {
      const searchTime = Date.now() - startTime;
      console.error('Search error:', error);

      return {
        articles: [],
        faqs: [],
        total_count: 0,
        search_time: searchTime,
      };
    }
  }

  // Get search suggestions
  static async getSearchSuggestions(query: string): Promise<string[]> {
    if (!query || query.length < 2) return [];

    const { data, error } = await supabase
      .from('kb_articles')
      .select('title')
      .eq('status', 'published')
      .ilike('title', `%${query}%`)
      .limit(5);

    if (error) throw error;
    return data?.map(article => article.title) || [];
  }

  // Analytics
  static async getDashboardMetrics(): Promise<KBDashboardMetrics> {
    const [
      articlesResult,
      faqsResult,
      viewsResult,
      searchesResult,
      topArticlesResult,
      topFaqsResult,
      recentSearchesResult,
      performanceResult,
    ] = await Promise.all([
      // Total articles
      supabase.from('kb_articles').select('id').eq('status', 'published'),
      // Total FAQs
      supabase.from('faq_items').select('id').eq('is_active', true),
      // Total views
      supabase
        .from('kb_articles')
        .select('view_count')
        .eq('status', 'published'),
      // Total searches
      supabase.from('kb_search_analytics').select('id'),
      // Top articles
      supabase
        .from('kb_articles')
        .select('*')
        .eq('status', 'published')
        .order('view_count', { ascending: false })
        .limit(5),
      // Top FAQs
      supabase
        .from('faq_items')
        .select('*')
        .eq('is_active', true)
        .order('view_count', { ascending: false })
        .limit(5),
      // Recent searches
      supabase
        .from('kb_search_analytics')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10),
      // Performance trend (last 30 days)
      supabase
        .from('kb_content_performance')
        .select('*')
        .gte('date', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
        .order('date', { ascending: true }),
    ]);

    const totalViews = viewsResult.data?.reduce((sum, article) => sum + (article.view_count || 0), 0) || 0;
    const avgRating = 0; // TODO: Calculate average rating from feedback

    return {
      total_articles: articlesResult.data?.length || 0,
      total_faqs: faqsResult.data?.length || 0,
      total_views: totalViews,
      total_searches: searchesResult.data?.length || 0,
      avg_rating: avgRating,
      top_articles: topArticlesResult.data || [],
      top_faqs: topFaqsResult.data || [],
      recent_searches: recentSearchesResult.data || [],
      performance_trend: performanceResult.data || [],
    };
  }

  // User interactions
  static async trackArticleView(articleId: string, userId?: string, sessionId?: string): Promise<void> {
    // Update view count
    const { error: updateError } = await supabase.rpc('increment_article_view_count', {
      article_uuid: articleId,
    });

    if (updateError) {
      console.error('Error tracking view:', updateError);
    }
  }

  static async submitArticleFeedback(
    articleId: string,
    feedback: Omit<KBArticleFeedback, 'id' | 'article_id' | 'created_at'>
  ): Promise<void> {
    const { error } = await supabase
      .from('kb_article_feedback')
      .insert({
        article_id: articleId,
        ...feedback,
      });

    if (error) throw error;
  }

  static async submitFAQFeedback(
    faqId: string,
    feedback: Omit<FAQFeedback, 'id' | 'faq_id' | 'created_at'>
  ): Promise<void> {
    const { error } = await supabase
      .from('faq_feedback')
      .insert({
        faq_id: faqId,
        ...feedback,
      });

    if (error) throw error;
  }

  static async toggleBookmark(userId: string, articleId: string, notes?: string): Promise<void> {
    // Check if bookmark exists
    const { data: existing } = await supabase
      .from('kb_user_bookmarks')
      .select('id')
      .eq('user_id', userId)
      .eq('article_id', articleId)
      .single();

    if (existing) {
      // Remove bookmark
      await supabase
        .from('kb_user_bookmarks')
        .delete()
        .eq('user_id', userId)
        .eq('article_id', articleId);
    } else {
      // Add bookmark
      await supabase
        .from('kb_user_bookmarks')
        .insert({
          user_id: userId,
          article_id: articleId,
          notes,
          category: 'article',
        });
    }
  }

  static async getUserBookmarks(userId: string): Promise<KBUserBookmark[]> {
    const { data, error } = await supabase
      .from('kb_user_bookmarks')
      .select(`
        *,
        article:kb_articles(id, title, slug, summary, featured_image_url, view_count)
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  // Settings
  static async getKBSettings(): Promise<Record<string, any>> {
    const { data, error } = await supabase
      .from('kb_settings')
      .select('key, value')
      .eq('is_public', true);

    if (error) throw error;

    const settings: Record<string, any> = {};
    data?.forEach(setting => {
      settings[setting.key] = setting.value;
    });

    return settings;
  }

  static async updateKBSetting(key: string, value: any): Promise<void> {
    const { error } = await supabase
      .from('kb_settings')
      .upsert({
        key,
        value,
        updated_at: new Date().toISOString(),
      });

    if (error) throw error;
  }

  // Helper methods
  private static generateSlug(title: string): string {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9 -]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  }

  private static async logSearch(query: string, filters?: KBSearchFilters): Promise<void> {
    try {
      const { error } = await supabase
        .from('kb_search_analytics')
        .insert({
          search_query: query,
          filters_used: filters || {},
          session_id: this.getSessionId(),
          created_at: new Date().toISOString(),
        });

      if (error) console.error('Error logging search:', error);
    } catch (error) {
      console.error('Error logging search:', error);
    }
  }

  private static getSessionId(): string {
    // In a real implementation, this would get the session ID from context or cookies
    return 'anonymous';
  }

  // Related content
  static async getRelatedArticles(articleId: string): Promise<KBArticle[]> {
    const { data, error } = await supabase
      .from('kb_related_articles')
      .select(`
        related_article:kb_articles(
          id,
          title,
          slug,
          summary,
          featured_image_url,
          view_count,
          published_at
        )
      `)
      .eq('article_id', articleId)
      .order('score', { ascending: false })
      .limit(3);

    if (error) throw error;
    return data?.map(item => item.related_article).filter(Boolean) as KBArticle[];
  }

  static async getRelatedFAQs(faqId: string): Promise<FAQItem[]> {
    const { data, error } = await supabase
      .from('faq_related_items')
      .select(`
        related_faq:faq_items(
          id,
          question,
          answer,
          view_count,
          category:faq_categories(name, slug)
        )
      `)
      .eq('faq_id', faqId)
      .order('score', { ascending: false })
      .limit(3);

    if (error) throw error;
    return data?.map(item => item.related_faq).filter(Boolean) as FAQItem[];
  }
}

export default KnowledgeBaseService;