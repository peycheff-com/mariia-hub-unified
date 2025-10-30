import { supabase } from '@/integrations/supabase/client';
import type { KBContentPerformance, KBSearchAnalytics } from '@/types/knowledge-base';

// Analytics Service for Knowledge Base Performance Tracking
export class AnalyticsService {
  // Track content performance metrics
  static async trackContentView(
    contentType: 'article' | 'faq',
    contentId: string,
    userId?: string,
    sessionId?: string,
    additionalData?: {
      timeOnPage?: number;
      source?: string;
      device?: string;
    }
  ): Promise<void> {
    try {
      const today = new Date().toISOString().split('T')[0];

      // Update daily performance metrics
      const { data: existing } = await supabase
        .from('kb_content_performance')
        .select('*')
        .eq('content_type', contentType)
        .eq('content_id', contentId)
        .eq('date', today)
        .single();

      if (existing) {
        await supabase
          .from('kb_content_performance')
          .update({
            views: existing.views + 1,
            avg_time_on_page_seconds: additionalData?.timeOnPage
              ? Math.round((existing.avg_time_on_page_seconds + additionalData.timeOnPage) / 2)
              : existing.avg_time_on_page_seconds,
            updated_at: new Date().toISOString(),
          })
          .eq('id', existing.id);
      } else {
        await supabase
          .from('kb_content_performance')
          .insert({
            content_type: contentType,
            content_id: contentId,
            date: today,
            views: 1,
            unique_views: 1,
            avg_time_on_page_seconds: additionalData?.timeOnPage || 0,
          });
      }

      // Track individual view event
      await supabase
        .from('kb_view_events')
        .insert({
          content_type: contentType,
          content_id: contentId,
          user_id,
          session_id,
          time_on_page_seconds: additionalData?.timeOnPage,
          source: additionalData?.source,
          device: additionalData?.device,
          created_at: new Date().toISOString(),
        });

    } catch (error) {
      console.error('Error tracking content view:', error);
    }
  }

  // Track user feedback on content
  static async trackContentFeedback(
    contentType: 'article' | 'faq',
    contentId: string,
    feedbackType: 'helpful' | 'not-helpful' | 'report_issue' | 'suggestion',
    rating?: number,
    userId?: string,
    sessionId?: string
  ): Promise<void> {
    try {
      const today = new Date().toISOString().split('T')[0];

      // Update daily performance metrics
      const { data: existing } = await supabase
        .from('kb_content_performance')
        .select('*')
        .eq('content_type', contentType)
        .eq('content_id', contentId)
        .eq('date', today)
        .single();

      if (existing) {
        const updates: any = {};
        if (feedbackType === 'helpful') {
          updates.helpful_votes = existing.helpful_votes + 1;
        } else if (feedbackType === 'not-helpful') {
          updates.not_helpful_votes = existing.not_helpful_votes + 1;
        }

        await supabase
          .from('kb_content_performance')
          .update(updates)
          .eq('id', existing.id);
      }

      // Track individual feedback event
      await supabase
        .from('kb_feedback_events')
        .insert({
          content_type: contentType,
          content_id: contentId,
          feedback_type,
          rating,
          user_id,
          session_id,
          created_at: new Date().toISOString(),
        });

    } catch (error) {
      console.error('Error tracking content feedback:', error);
    }
  }

  // Track search performance
  static async trackSearchPerformance(
    query: string,
    resultsCount: number,
    clickedContentId?: string,
    userId?: string,
    sessionId?: string,
    searchTime?: number
  ): Promise<void> {
    try {
      await supabase
        .from('kb_search_analytics')
        .insert({
          search_query: query,
          results_count: resultsCount,
          clicked_article_id: clickedContentId,
          user_id,
          session_id,
          search_time_ms: searchTime,
          created_at: new Date().toISOString(),
        });

      // Track search success rate
      if (resultsCount === 0) {
        await this.trackFailedSearch(query, userId, sessionId);
      }

    } catch (error) {
      console.error('Error tracking search performance:', error);
    }
  }

  // Track failed searches for content gap analysis
  private static async trackFailedSearch(
    query: string,
    userId?: string,
    sessionId?: string
  ): Promise<void> {
    try {
      await supabase
        .from('kb_failed_searches')
        .insert({
          search_query: query,
          user_id,
          session_id,
          created_at: new Date().toISOString(),
        });

      // Check if this query appears frequently and might need new content
      const { data: similarSearches } = await supabase
        .from('kb_failed_searches')
        .select('search_query')
        .ilike('search_query', `%${query}%`)
        .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

      if (similarSearches && similarSearches.length >= 5) {
        // Flag for content team review
        await supabase
          .from('kb_content_suggestions')
          .upsert({
            suggested_query: query,
            frequency: similarSearches.length,
            status: 'pending_review',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          });
      }

    } catch (error) {
      console.error('Error tracking failed search:', error);
    }
  }

  // Generate comprehensive analytics report
  static async generateAnalyticsReport(
    startDate: Date,
    endDate: Date
  ): Promise<{
    overview: {
      totalViews: number;
      totalSearches: number;
      avgHelpfulness: number;
      searchSuccessRate: number;
      topPerformingContent: Array<{
        id: string;
        title: string;
        type: 'article' | 'faq';
        views: number;
        helpfulnessRate: number;
      }>;
    };
    searchAnalytics: {
      popularQueries: Array<{ query: string; count: number; avgResults: number }>;
      noResultQueries: Array<{ query: string; count: number }>;
      searchTrends: Array<{ date: string; searches: number; successRate: number }>;
    };
    contentPerformance: Array<KBContentPerformance>;
    userEngagement: {
      avgTimeOnPage: number;
      bounceRate: number;
      returnVisitorRate: number;
    };
    contentGaps: Array<{
      query: string;
      frequency: number;
      suggestedContent: string;
    }>;
  }> {
    const startDateStr = startDate.toISOString();
    const endDateStr = endDate.toISOString();

    try {
      // Get content performance data
      const { data: performanceData } = await supabase
        .from('kb_content_performance')
        .select('*')
        .gte('date', startDateStr.split('T')[0])
        .lte('date', endDateStr.split('T')[0]);

      // Get search analytics
      const { data: searchData } = await supabase
        .from('kb_search_analytics')
        .select('*')
        .gte('created_at', startDateStr)
        .lte('created_at', endDateStr);

      // Get content suggestions
      const { data: contentSuggestions } = await supabase
        .from('kb_content_suggestions')
        .select('*')
        .gte('created_at', startDateStr);

      // Process data
      const totalViews = performanceData?.reduce((sum, item) => sum + item.views, 0) || 0;
      const totalSearches = searchData?.length || 0;
      const successfulSearches = searchData?.filter(item => (item.results_count || 0) > 0).length || 0;

      const totalHelpful = performanceData?.reduce((sum, item) => sum + item.helpful_votes, 0) || 0;
      const totalFeedback = performanceData?.reduce((sum, item) => sum + item.helpful_votes + item.not_helpful_votes, 0) || 0;
      const avgHelpfulness = totalFeedback > 0 ? (totalHelpful / totalFeedback) * 100 : 0;

      const searchSuccessRate = totalSearches > 0 ? (successfulSearches / totalSearches) * 100 : 0;

      // Process search queries
      const queryMap = new Map<string, { count: number; totalResults: number }>();
      searchData?.forEach(item => {
        const existing = queryMap.get(item.search_query) || { count: 0, totalResults: 0 };
        queryMap.set(item.search_query, {
          count: existing.count + 1,
          totalResults: existing.totalResults + (item.results_count || 0),
        });
      });

      const popularQueries = Array.from(queryMap.entries())
        .map(([query, stats]) => ({
          query,
          count: stats.count,
          avgResults: Math.round(stats.totalResults / stats.count),
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

      const noResultQueries = Array.from(queryMap.entries())
        .filter(([_, stats]) => stats.totalResults === 0)
        .map(([query, stats]) => ({ query, count: stats.count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

      // Generate search trends
      const searchTrendMap = new Map<string, { searches: number; successful: number }>();
      searchData?.forEach(item => {
        const date = item.created_at.split('T')[0];
        const existing = searchTrendMap.get(date) || { searches: 0, successful: 0 };
        searchTrendMap.set(date, {
          searches: existing.searches + 1,
          successful: existing.successful + ((item.results_count || 0) > 0 ? 1 : 0),
        });
      });

      const searchTrends = Array.from(searchTrendMap.entries())
        .map(([date, stats]) => ({
          date,
          searches: stats.searches,
          successRate: stats.searches > 0 ? (stats.successful / stats.searches) * 100 : 0,
        }))
        .sort((a, b) => a.date.localeCompare(b.date));

      // Calculate top performing content
      const contentPerformanceMap = new Map<string, {
        id: string;
        title: string;
        type: 'article' | 'faq';
        views: number;
        helpfulVotes: number;
        totalVotes: number;
      }>();

      performanceData?.forEach(item => {
        const existing = contentPerformanceMap.get(item.content_id) || {
          id: item.content_id,
          title: `Content ${item.content_id}`, // Would need to join with actual content tables
          type: item.content_type,
          views: 0,
          helpfulVotes: 0,
          totalVotes: 0,
        };

        contentPerformanceMap.set(item.content_id, {
          ...existing,
          views: existing.views + item.views,
          helpfulVotes: existing.helpfulVotes + item.helpful_votes,
          totalVotes: existing.totalVotes + item.helpful_votes + item.not_helpful_votes,
        });
      });

      const topPerformingContent = Array.from(contentPerformanceMap.values())
        .map(content => ({
          ...content,
          helpfulnessRate: content.totalVotes > 0 ? (content.helpfulVotes / content.totalVotes) * 100 : 0,
        }))
        .sort((a, b) => b.views - a.views)
        .slice(0, 10);

      // Calculate user engagement metrics
      const avgTimeOnPage = performanceData?.reduce((sum, item) => sum + item.avg_time_on_page_seconds, 0) / (performanceData?.length || 1) || 0;
      const avgBounceRate = performanceData?.reduce((sum, item) => sum + item.bounce_rate, 0) / (performanceData?.length || 1) || 0;

      // Process content gaps
      const contentGaps = (contentSuggestions || [])
        .filter(suggestion => suggestion.status === 'pending_review')
        .map(suggestion => ({
          query: suggestion.suggested_query,
          frequency: suggestion.frequency,
          suggestedContent: `Create article about: ${suggestion.suggested_query}`,
        }))
        .sort((a, b) => b.frequency - a.frequency)
        .slice(0, 10);

      return {
        overview: {
          totalViews,
          totalSearches,
          avgHelpfulness,
          searchSuccessRate,
          topPerformingContent,
        },
        searchAnalytics: {
          popularQueries,
          noResultQueries,
          searchTrends,
        },
        contentPerformance: performanceData || [],
        userEngagement: {
          avgTimeOnPage: Math.round(avgTimeOnPage),
          bounceRate: Math.round(avgBounceRate * 100) / 100,
          returnVisitorRate: 0, // Would need additional tracking
        },
        contentGaps,
      };

    } catch (error) {
      console.error('Error generating analytics report:', error);
      throw error;
    }
  }

  // Get real-time analytics
  static async getRealTimeMetrics(): Promise<{
    activeUsers: number;
    currentSearches: number;
    recentViews: Array<{
      contentType: 'article' | 'faq';
      contentTitle: string;
      timestamp: string;
      userId?: string;
    }>;
    popularSearches: Array<{ query: string; count: number }>;
  }> {
    try {
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();

      // Get recent views (simplified - would need session tracking)
      const { data: recentViewsData } = await supabase
        .from('kb_view_events')
        .select('content_type, created_at, user_id')
        .gte('created_at', fiveMinutesAgo)
        .order('created_at', { ascending: false })
        .limit(10);

      // Get current searches
      const { data: currentSearchesData } = await supabase
        .from('kb_search_analytics')
        .select('search_query')
        .gte('created_at', fiveMinutesAgo);

      // Get popular searches in the last hour
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
      const { data: popularSearchesData } = await supabase
        .from('kb_search_analytics')
        .select('search_query')
        .gte('created_at', oneHourAgo);

      const searchCountMap = new Map<string, number>();
      popularSearchesData?.forEach(item => {
        searchCountMap.set(item.search_query, (searchCountMap.get(item.search_query) || 0) + 1);
      });

      const popularSearches = Array.from(searchCountMap.entries())
        .map(([query, count]) => ({ query, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      return {
        activeUsers: recentViewsData?.length || 0, // Simplified - would need proper session tracking
        currentSearches: currentSearchesData?.length || 0,
        recentViews: (recentViewsData || []).map(view => ({
          contentType: view.content_type,
          contentTitle: `Content ${view.content_type}`, // Would need to join with content tables
          timestamp: view.created_at,
          userId: view.user_id,
        })),
        popularSearches,
      };

    } catch (error) {
      console.error('Error getting real-time metrics:', error);
      return {
        activeUsers: 0,
        currentSearches: 0,
        recentViews: [],
        popularSearches: [],
      };
    }
  }

  // Export analytics data
  static async exportAnalyticsData(
    startDate: Date,
    endDate: Date,
    format: 'json' | 'csv' = 'json'
  ): Promise<Blob> {
    const report = await this.generateAnalyticsReport(startDate, endDate);

    if (format === 'csv') {
      // Convert to CSV format
      const csvRows = [
        'Date,Content Type,Content ID,Views,Helpful Votes,Not Helpful Votes,Avg Time on Page,Bounce Rate',
        ...report.contentPerformance.map(item =>
          `${item.date},${item.content_type},${item.content_id},${item.views},${item.helpful_votes},${item.not_helpful_votes},${item.avg_time_on_page_seconds},${item.bounce_rate}`
        ),
      ];

      return new Blob([csvRows.join('\n')], { type: 'text/csv' });
    } else {
      return new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    }
  }

  // Set up automated analytics collection
  static async setupAutomatedTracking(): Promise<void> {
    // This would set up database triggers or scheduled jobs for automated analytics collection
    // For now, we'll create a function to aggregate daily performance metrics

    try {
      const { error } = await supabase.rpc('aggregate_daily_kb_metrics', {
        target_date: new Date().toISOString().split('T')[0],
      });

      if (error) {
        console.error('Error setting up automated tracking:', error);
      }
    } catch (error) {
      console.error('Error in automated tracking setup:', error);
    }
  }

  // Track user journey through knowledge base
  static async trackUserJourney(
    userId: string,
    journey: Array<{
      action: 'search' | 'view_article' | 'view_faq' | 'feedback';
      contentId?: string;
      query?: string;
      timestamp: string;
      duration?: number;
    }>
  ): Promise<void> {
    try {
      await supabase
        .from('kb_user_journeys')
        .insert({
          user_id: userId,
          journey_data: journey,
          created_at: new Date().toISOString(),
        });

      // Analyze journey for patterns
      await this.analyzeUserJourneyPatterns(userId, journey);

    } catch (error) {
      console.error('Error tracking user journey:', error);
    }
  }

  private static async analyzeUserJourneyPatterns(
    userId: string,
    journey: Array<any>
  ): Promise<void> {
    // Analyze patterns like:
    // - Users who search but don't find results
    // - Users who view multiple articles on the same topic
    // - Users who provide feedback frequently
    // - Common paths through the knowledge base

    try {
      const noResultSearches = journey.filter(item => item.action === 'search' && !item.contentId);
      if (noResultSearches.length > 2) {
        // User might be struggling to find information
        await supabase
          .from('kb_user_struggles')
          .insert({
            user_id: userId,
            struggle_type: 'repeated_no_results',
            details: { failed_searches: noResultSearches },
            created_at: new Date().toISOString(),
          });
      }

      const feedbackActions = journey.filter(item => item.action === 'feedback');
      if (feedbackActions.length > 3) {
        // Highly engaged user - potential power user or tester
        await supabase
          .from('kb_power_users')
          .upsert({
            user_id: userId,
            engagement_score: feedbackActions.length,
            last_activity: new Date().toISOString(),
          });
      }

    } catch (error) {
      console.error('Error analyzing user journey patterns:', error);
    }
  }
}

export default AnalyticsService;