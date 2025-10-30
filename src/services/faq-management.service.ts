import { supabase } from '@/integrations/supabase/client';
import type {
  FAQCategory,
  FAQItem,
  FAQCreateRequest,
  FAQUpdateRequest,
  FAQFeedback,
  KBDashboardMetrics,
  FAQRelatedItems,
} from '@/types/knowledge-base';

// Dynamic FAQ Management Service
export class FAQManagementService {
  // FAQ Categories Management
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

  static async createFAQCategory(
    category: Omit<FAQCategory, 'id' | 'created_at' | 'updated_at'>
  ): Promise<FAQCategory> {
    const { data, error } = await supabase
      .from('faq_categories')
      .insert(category)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async updateFAQCategory(
    id: string,
    updates: Partial<Omit<FAQCategory, 'id' | 'created_at' | 'updated_at'>>
  ): Promise<FAQCategory> {
    const { data, error } = await supabase
      .from('faq_categories')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async deleteFAQCategory(id: string): Promise<void> {
    const { error } = await supabase
      .from('faq_categories')
      .update({ is_active: false })
      .eq('id', id);

    if (error) throw error;
  }

  static async reorderFAQCategories(categoryOrders: Array<{ id: string; order_index: number }>): Promise<void> {
    const updates = categoryOrders.map(({ id, order_index }) =>
      supabase
        .from('faq_categories')
        .update({ order_index, updated_at: new Date().toISOString() })
        .eq('id', id)
    );

    await Promise.all(updates);
  }

  // FAQ Items Management
  static async getFAQs(
    filters: {
      category_id?: string;
      service_id?: string;
      service_type?: string;
      featured?: boolean;
      language?: string;
      limit?: number;
      offset?: number;
      search?: string;
      include_related?: boolean;
    } = {}
  ): Promise<{ faqs: FAQItem[]; total: number }> {
    let query = supabase
      .from('faq_items')
      .select(`
        *,
        category:faq_categories(*),
        services(*),
        created_by_profile:profiles(id, full_name, avatar_url)
        ${filters.include_related ? ', related_faqs:faq_related_items(related_faq_id, score, related_faq:faq_items(question, answer, category:faq_categories(name)))' : ''}
      `, { count: 'exact' })
      .eq('is_active', true)
      .order('order_index');

    // Apply filters
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

    if (filters.language) {
      query = query.eq('language', filters.language);
    }

    if (filters.search) {
      query = query.or(
        `question.ilike.%${filters.search}%,answer.ilike.%${filters.search}%,question_pl.ilike.%${filters.search}%,answer_pl.ilike.%${filters.search}%`
      );
    }

    // Apply pagination
    if (filters.limit) {
      query = query.range(filters.offset || 0, (filters.offset || 0) + filters.limit - 1);
    }

    const { data, error, count } = await query;

    if (error) throw error;
    return { faqs: data || [], total: count || 0 };
  }

  static async getFAQById(id: string, includeRelated = false): Promise<FAQItem | null> {
    const { data, error } = await supabase
      .from('faq_items')
      .select(`
        *,
        category:faq_categories(*),
        services(*),
        created_by_profile:profiles(id, full_name, avatar_url)
        ${includeRelated ? ', related_faqs:faq_related_items(related_faq_id, score, related_faq:faq_items(question, answer, category:faq_categories(name)))' : ''}
      `)
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
      .select(`
        *,
        category:faq_categories(*),
        services(*),
        created_by_profile:profiles(id, full_name, avatar_url)
      `)
      .single();

    if (error) throw error;

    // Update search analytics for new FAQ
    await this.logFAQCreation(data.id, createdBy);

    return data;
  }

  static async updateFAQ(id: string, updates: FAQUpdateRequest): Promise<FAQItem> {
    const { data, error } = await supabase
      .from('faq_items')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select(`
        *,
        category:faq_categories(*),
        services(*),
        created_by_profile:profiles(id, full_name, avatar_url)
      `)
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

  static async reorderFAQs(faqOrders: Array<{ id: string; order_index: number }>): Promise<void> {
    const updates = faqOrders.map(({ id, order_index }) =>
      supabase
        .from('faq_items')
        .update({ order_index, updated_at: new Date().toISOString() })
        .eq('id', id)
    );

    await Promise.all(updates);
  }

  // Smart FAQ Suggestions
  static async getSmartFAQSuggestions(
    question: string,
    limit: number = 5
  ): Promise<FAQItem[]> {
    try {
      // Extract keywords from the question
      const keywords = this.extractKeywords(question);

      // Search for similar FAQs
      let query = supabase
        .from('faq_items')
        .select('*, category:faq_categories(*)')
        .eq('is_active', true);

      // Create search conditions
      const searchConditions = [
        `question.ilike.%${question}%`,
        `answer.ilike.%${question}%`,
        `question_pl.ilike.%${question}%`,
        `answer_pl.ilike.%${question}%`,
      ];

      // Add keyword-based searches
      keywords.forEach(keyword => {
        searchConditions.push(`question.ilike.%${keyword}%`);
        searchConditions.push(`answer.ilike.%${keyword}%`);
      });

      query = query.or(searchConditions.join(', '));

      // Order by relevance and popularity
      query = query
        .order('view_count', { ascending: false })
        .order('helpful_count', { ascending: false })
        .limit(limit);

      const { data, error } = await query;

      if (error) throw error;

      // Calculate relevance scores and sort
      const faqsWithScores = (data || []).map(faq => ({
        ...faq,
        relevance_score: this.calculateFAQRelevanceScore(faq, question, keywords),
      }));

      return faqsWithScores
        .sort((a, b) => b.relevance_score - a.relevance_score)
        .slice(0, limit);
    } catch (error) {
      console.error('Error getting FAQ suggestions:', error);
      return [];
    }
  }

  // FAQ Analytics
  static async getFAQAnalytics(
    days: number = 30
  ): Promise<{
    total_faqs: number;
    total_views: number;
    avg_helpfulness: number;
    top_viewed: FAQItem[];
    top_helpful: FAQItem[];
    least_helpful: FAQItem[];
    category_performance: Array<{
      category: FAQCategory;
      faq_count: number;
      total_views: number;
      avg_helpfulness: number;
    }>;
    recent_feedback: FAQFeedback[];
    view_trends: Array<{ date: string; views: number }>;
  }> {
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    try {
      const [
        totalFAQsResult,
        allFAQsResult,
        feedbackResult,
        categoryResult,
        viewTrendsResult,
        recentFeedbackResult,
      ] = await Promise.all([
        // Total FAQs
        supabase
          .from('faq_items')
          .select('id')
          .eq('is_active', true),

        // All FAQs with view counts
        supabase
          .from('faq_items')
          .select('view_count, helpful_count, not_helpful_count, category_id')
          .eq('is_active', true),

        // Feedback data
        supabase
          .from('faq_feedback')
          .select('faq_id, feedback_type, created_at')
          .gte('created_at', startDate.toISOString()),

        // Categories with FAQ counts
        supabase
          .from('faq_categories')
          .select(`
            *,
            faqs:faq_items(id, view_count, helpful_count, not_helpful_count)
          `)
          .eq('is_active', true),

        // View trends (simplified - would need daily aggregation in production)
        supabase
          .from('faq_items')
          .select('last_viewed_at, view_count')
          .eq('is_active', true)
          .gte('last_viewed_at', startDate.toISOString()),

        // Recent feedback
        supabase
          .from('faq_feedback')
          .select('*, faq:faq_items(question)')
          .order('created_at', { ascending: false })
          .limit(10),
      ]);

      const totalFAQs = totalFAQsResult.data?.length || 0;
      const allFAQs = allFAQsResult.data || [];

      const totalViews = allFAQs.reduce((sum, faq) => sum + (faq.view_count || 0), 0);
      const totalHelpful = allFAQs.reduce((sum, faq) => sum + (faq.helpful_count || 0), 0);
      const totalNotHelpful = allFAQs.reduce((sum, faq) => sum + (faq.not_helpful_count || 0), 0);
      const avgHelpfulness = totalHelpful + totalNotHelpful > 0
        ? (totalHelpful / (totalHelpful + totalNotHelpful)) * 100
        : 0;

      // Get top and bottom performers
      const faqsWithPerformance = allFAQs.map(faq => ({
        ...faq,
        helpfulness_rate: faq.helpful_count + faq.not_helpful_count > 0
          ? (faq.helpful_count / (faq.helpful_count + faq.not_helpful_count)) * 100
          : 0,
      }));

      const topViewed = faqsWithPerformance
        .sort((a, b) => (b.view_count || 0) - (a.view_count || 0))
        .slice(0, 5);

      const topHelpful = faqsWithPerformance
        .filter(faq => faq.helpful_count + faq.not_helpful_count > 0)
        .sort((a, b) => b.helpfulness_rate - a.helpfulness_rate)
        .slice(0, 5);

      const leastHelpful = faqsWithPerformance
        .filter(faq => faq.helpful_count + faq.not_helpful_count > 5) // Minimum feedback threshold
        .sort((a, b) => a.helpfulness_rate - b.helpfulness_rate)
        .slice(0, 5);

      // Category performance
      const categoryPerformance = (categoryResult.data || []).map(category => {
        const categoryFAQs = category.faqs || [];
        const categoryViews = categoryFAQs.reduce((sum, faq) => sum + (faq.view_count || 0), 0);
        const categoryHelpful = categoryFAQs.reduce((sum, faq) => sum + (faq.helpful_count || 0), 0);
        const categoryNotHelpful = categoryFAQs.reduce((sum, faq) => sum + (faq.not_helpful_count || 0), 0);

        return {
          category,
          faq_count: categoryFAQs.length,
          total_views: categoryViews,
          avg_helpfulness: categoryHelpful + categoryNotHelpful > 0
            ? (categoryHelpful / (categoryHelpful + categoryNotHelpful)) * 100
            : 0,
        };
      });

      // View trends (simplified)
      const viewTrends = this.aggregateViewTrends(viewTrendsResult.data || [], days);

      return {
        total_faqs: totalFAQs,
        total_views: totalViews,
        avg_helpfulness: avgHelpfulness,
        top_viewed: topViewed,
        top_helpful: topHelpful,
        least_helpful: leastHelpful,
        category_performance: categoryPerformance,
        recent_feedback: recentFeedbackResult.data || [],
        view_trends: viewTrends,
      };
    } catch (error) {
      console.error('Error getting FAQ analytics:', error);
      return {
        total_faqs: 0,
        total_views: 0,
        avg_helpfulness: 0,
        top_viewed: [],
        top_helpful: [],
        least_helpful: [],
        category_performance: [],
        recent_feedback: [],
        view_trends: [],
      };
    }
  }

  // FAQ Feedback Management
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

    // Update FAQ counters
    await this.updateFAQCounters(faqId);
  }

  static async getFAQFeedback(faqId: string): Promise<{
    helpful_count: number;
    not_helpful_count: number;
    total_feedback: number;
    helpful_percentage: number;
    recent_feedback: FAQFeedback[];
  }> {
    const { data, error } = await supabase
      .from('faq_feedback')
      .select('*')
      .eq('faq_id', faqId)
      .order('created_at', { ascending: false })
      .limit(20);

    if (error) throw error;

    const feedback = data || [];
    const helpfulCount = feedback.filter(f => f.feedback_type === 'helpful').length;
    const notHelpfulCount = feedback.filter(f => f.feedback_type === 'not_helpful').length;
    const totalFeedback = feedback.length;

    return {
      helpful_count: helpfulCount,
      not_helpful_count: notHelpfulCount,
      total_feedback: totalFeedback,
      helpful_percentage: totalFeedback > 0 ? (helpfulCount / totalFeedback) * 100 : 0,
      recent_feedback: feedback,
    };
  }

  // Related FAQs Management
  static async addRelatedFAQ(
    faqId: string,
    relatedFaqId: string,
    score: number = 1.0
  ): Promise<void> {
    const { error } = await supabase
      .from('faq_related_items')
      .insert({
        faq_id: faqId,
        related_faq_id: relatedFaqId,
        score,
      });

    if (error) throw error;
  }

  static async removeRelatedFAQ(faqId: string, relatedFaqId: string): Promise<void> {
    const { error } = await supabase
      .from('faq_related_items')
      .delete()
      .eq('faq_id', faqId)
      .eq('related_faq_id', relatedFaqId);

    if (error) throw error;
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
      .limit(5);

    if (error) throw error;
    return data?.map(item => item.related_faq).filter(Boolean) as FAQItem[];
  }

  // FAQ Automation
  static async generateFAQSuggestions(): Promise<Array<{
    question: string;
    suggested_answer: string;
    confidence: number;
    source: string;
  }>> {
    try {
      // Analyze search queries with no results
      const { data: noResultSearches } = await supabase
        .from('kb_search_analytics')
        .select('search_query')
        .eq('results_count', 0)
        .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
        .group('search_query')
        .order('count', { ascending: false })
        .limit(20);

      // Analyze support tickets if integrated
      // This would integrate with your support system to find common questions

      const suggestions = [];

      // Process no-result searches
      for (const search of noResultSearches || []) {
        const question = search.search_query;

        // Simple pattern matching to suggest FAQ creation
        if (question.includes('?') || question.includes('how') || question.includes('what')) {
          suggestions.push({
            question,
            suggested_answer: 'Answer needs to be provided by staff',
            confidence: 0.7,
            source: 'search_queries',
          });
        }
      }

      return suggestions.slice(0, 10);
    } catch (error) {
      console.error('Error generating FAQ suggestions:', error);
      return [];
    }
  }

  // FAQ Import/Export
  static async exportFAQs(categoryId?: string): Promise<{
    faqs: Array<{
      question: string;
      answer: string;
      question_pl?: string;
      answer_pl?: string;
      category?: string;
      order_index: number;
      is_featured: boolean;
    }>;
    categories: Array<{
      name: string;
      slug: string;
      description?: string;
    }>;
  }> {
    try {
      let query = supabase
        .from('faq_items')
        .select(`
          question,
          answer,
          question_pl,
          answer_pl,
          order_index,
          is_featured,
          category:faq_categories(name, slug)
        `)
        .eq('is_active', true)
        .order('category_id')
        .order('order_index');

      if (categoryId) {
        query = query.eq('category_id', categoryId);
      }

      const { data: faqs, error: faqsError } = await query;

      if (faqsError) throw faqsError;

      const { data: categories, error: categoriesError } = await supabase
        .from('faq_categories')
        .select('name, slug, description')
        .eq('is_active', true)
        .order('order_index');

      if (categoriesError) throw categoriesError;

      return {
        faqs: faqs || [],
        categories: categories || [],
      };
    } catch (error) {
      console.error('Error exporting FAQs:', error);
      return { faqs: [], categories: [] };
    }
  }

  static async importFAQs(
    faqs: Array<{
      question: string;
      answer: string;
      question_pl?: string;
      answer_pl?: string;
      category_name?: string;
      is_featured?: boolean;
    }>,
    createdBy: string
  ): Promise<{ imported: number; errors: string[] }> {
    const errors: string[] = [];
    let imported = 0;

    try {
      for (const faqData of faqs) {
        try {
          // Find or create category
          let categoryId = null;
          if (faqData.category_name) {
            const { data: category } = await supabase
              .from('faq_categories')
              .select('id')
              .eq('name', faqData.category_name)
              .single();

            if (category) {
              categoryId = category.id;
            } else {
              // Create new category
              const { data: newCategory } = await supabase
                .from('faq_categories')
                .insert({
                  name: faqData.category_name,
                  slug: faqData.category_name.toLowerCase().replace(/\s+/g, '-'),
                  is_active: true,
                })
                .select('id')
                .single();

              categoryId = newCategory?.id;
            }
          }

          // Create FAQ
          await supabase
            .from('faq_items')
            .insert({
              question: faqData.question,
              answer: faqData.answer,
              question_pl: faqData.question_pl,
              answer_pl: faqData.answer_pl,
              category_id: categoryId,
              is_featured: faqData.is_featured || false,
              is_active: true,
              created_by: createdBy,
            });

          imported++;
        } catch (error) {
          errors.push(`Error importing FAQ "${faqData.question}": ${error}`);
        }
      }
    } catch (error) {
      errors.push(`General import error: ${error}`);
    }

    return { imported, errors };
  }

  // Helper methods
  private static extractKeywords(question: string): string[] {
    return question
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 2)
      .slice(0, 5);
  }

  private static calculateFAQRelevanceScore(
    faq: FAQItem,
    question: string,
    keywords: string[]
  ): number {
    let score = 0;
    const questionLower = question.toLowerCase();

    // Exact question match
    if (faq.question.toLowerCase().includes(questionLower)) {
      score += 20;
    }

    // Keyword matches in question
    keywords.forEach(keyword => {
      if (faq.question.toLowerCase().includes(keyword)) {
        score += 10;
      }
    });

    // Keyword matches in answer
    keywords.forEach(keyword => {
      if (faq.answer.toLowerCase().includes(keyword)) {
        score += 5;
      }
    });

    // Polish language matches
    if (faq.question_pl?.toLowerCase().includes(questionLower)) {
      score += 15;
    }

    // Featured boost
    if (faq.is_featured) {
      score += 5;
    }

    // Popularity boost
    score += Math.log(1 + (faq.view_count || 0)) * 0.1;
    score += (faq.helpful_count || 0) * 0.1;

    return score;
  }

  private static async updateFAQCounters(faqId: string): Promise<void> {
    try {
      const { data: feedback } = await supabase
        .from('faq_feedback')
        .select('feedback_type')
        .eq('faq_id', faqId);

      if (feedback) {
        const helpfulCount = feedback.filter(f => f.feedback_type === 'helpful').length;
        const notHelpfulCount = feedback.filter(f => f.feedback_type === 'not_helpful').length;

        await supabase
          .from('faq_items')
          .update({
            helpful_count: helpfulCount,
            not_helpful_count: notHelpfulCount,
            updated_at: new Date().toISOString(),
          })
          .eq('id', faqId);
      }
    } catch (error) {
      console.error('Error updating FAQ counters:', error);
    }
  }

  private static async logFAQCreation(faqId: string, createdBy: string): Promise<void> {
    try {
      await supabase
        .from('kb_search_analytics')
        .insert({
          search_query: `new_faq:${faqId}`,
          results_count: 1,
          session_id: `admin:${createdBy}`,
          created_at: new Date().toISOString(),
        });
    } catch (error) {
      console.error('Error logging FAQ creation:', error);
    }
  }

  private static aggregateViewTrends(viewData: Array<{ last_viewed_at: string | null }>, days: number): Array<{ date: string; views: number }> {
    const trends: Array<{ date: string; views: number }> = [];

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      const views = viewData.filter(item =>
        item.last_viewed_at && item.last_viewed_at.startsWith(date)
      ).length;

      trends.push({ date, views });
    }

    return trends;
  }
}

export default FAQManagementService;