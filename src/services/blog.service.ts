import { supabase } from '@/integrations/supabase/client';
import {
  ContentManagement,
  ContentAnalytics,
  ContentSearchFilters,
  ContentPerformanceSummary,
  ContentManagementSchema
} from '@/types/content';

export class BlogService {
  private static instance: BlogService;

  static getInstance(): BlogService {
    if (!BlogService.instance) {
      BlogService.instance = new BlogService();
    }
    return BlogService.instance;
  }

  /**
   * Fetch blog posts with filters and pagination
   */
  async getBlogPosts(filters: ContentSearchFilters = {}): Promise<{
    posts: ContentManagement[];
    total: number;
    hasMore: boolean;
  }> {
    try {
      let query = supabase
        .from('content_management')
        .select('*', { count: 'exact' })
        .eq('type', 'blog-post');

      // Apply filters
      if (filters.status) {
        query = query.eq('status', filters.status);
      }

      if (filters.language) {
        query = query.eq('language', filters.language);
      }

      if (filters.category) {
        query = query.eq('category', filters.category);
      }

      if (filters.author_id) {
        query = query.eq('author_id', filters.author_id);
      }

      if (filters.featured !== undefined) {
        query = query.eq('featured', filters.featured);
      }

      if (filters.ai_generated !== undefined) {
        query = query.eq('ai_generated', filters.ai_generated);
      }

      if (filters.tags && filters.tags.length > 0) {
        query = query.contains('tags', filters.tags);
      }

      if (filters.date_from) {
        query = query.gte('created_at', filters.date_from);
      }

      if (filters.date_to) {
        query = query.lte('created_at', filters.date_to);
      }

      if (filters.search_query) {
        query = query.textSearch('search_vector', filters.search_query);
      }

      // Apply sorting
      const column = filters.sort_by || 'updated_at';
      const order = filters.sort_order || 'desc';
      query = query.order(column, { ascending: order === 'asc' });

      // Apply pagination
      const limit = Math.min(filters.limit || 20, 100);
      const offset = filters.offset || 0;
      query = query.range(offset, offset + limit - 1);

      const { data, error, count } = await query;

      if (error) throw error;

      const validatedData = (data || []).map(item =>
        ContentManagementSchema.parse(item)
      );

      return {
        posts: validatedData,
        total: count || 0,
        hasMore: (offset + validatedData.length) < (count || 0)
      };
    } catch (error) {
      console.error('Error fetching blog posts:', error);
      throw error;
    }
  }

  /**
   * Get a single blog post by ID or slug
   */
  async getBlogPost(idOrSlug: string, bySlug: boolean = false): Promise<ContentManagement | null> {
    try {
      let query = supabase
        .from('content_management')
        .select('*')
        .eq('type', 'blog-post');

      if (bySlug) {
        query = query.eq('slug', idOrSlug);
      } else {
        query = query.eq('id', idOrSlug);
      }

      const { data, error } = await query.single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null; // Not found
        }
        throw error;
      }

      return ContentManagementSchema.parse(data);
    } catch (error) {
      console.error('Error fetching blog post:', error);
      throw error;
    }
  }

  /**
   * Create or update a blog post
   */
  async saveBlogPost(post: Partial<ContentManagement>, id?: string): Promise<ContentManagement> {
    try {
      const postData = {
        ...post,
        type: 'blog-post' as const,
        updated_at: new Date().toISOString()
      };

      let result;

      if (id) {
        // Update existing post
        const { data, error } = await supabase
          .from('content_management')
          .update(postData)
          .eq('id', id)
          .select()
          .single();

        if (error) throw error;
        result = data;
      } else {
        // Create new post
        const { data, error } = await supabase
          .from('content_management')
          .insert({
            ...postData,
            created_at: new Date().toISOString()
          })
          .select()
          .single();

        if (error) throw error;
        result = data;
      }

      // Create version record
      if (result) {
        await this.createVersion(result.id, result.version || 1, result);
      }

      return ContentManagementSchema.parse(result);
    } catch (error) {
      console.error('Error saving blog post:', error);
      throw error;
    }
  }

  /**
   * Delete a blog post
   */
  async deleteBlogPost(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('content_management')
        .delete()
        .eq('id', id);

      if (error) throw error;
    } catch (error) {
      console.error('Error deleting blog post:', error);
      throw error;
    }
  }

  /**
   * Publish a blog post
   */
  async publishBlogPost(id: string, publishAt?: string): Promise<ContentManagement> {
    try {
      const { data, error } = await supabase
        .from('content_management')
        .update({
          status: 'published',
          published_at: publishAt || new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      // Create version record for publication
      await this.createVersion(id, data.version || 1, data, 'Published post');

      return ContentManagementSchema.parse(data);
    } catch (error) {
      console.error('Error publishing blog post:', error);
      throw error;
    }
  }

  /**
   * Schedule a blog post for future publishing
   */
  async scheduleBlogPost(id: string, scheduledFor: string): Promise<ContentManagement> {
    try {
      const { data, error } = await supabase
        .from('content_management')
        .update({
          status: 'scheduled',
          scheduled_for: scheduledFor,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      return ContentManagementSchema.parse(data);
    } catch (error) {
      console.error('Error scheduling blog post:', error);
      throw error;
    }
  }

  /**
   * Get blog categories
   */
  async getCategories(): Promise<{ category: string; count: number }[]> {
    try {
      const { data, error } = await supabase
        .from('content_management')
        .select('category')
        .eq('type', 'blog-post')
        .eq('status', 'published')
        .not('category', 'is', null);

      if (error) throw error;

      const categories: Record<string, number> = {};

      (data || []).forEach(item => {
        if (item.category) {
          categories[item.category] = (categories[item.category] || 0) + 1;
        }
      });

      return Object.entries(categories)
        .map(([category, count]) => ({ category, count }))
        .sort((a, b) => b.count - a.count);
    } catch (error) {
      console.error('Error fetching categories:', error);
      return [];
    }
  }

  /**
   * Get popular tags
   */
  async getPopularTags(limit: number = 20): Promise<{ tag: string; count: number }[]> {
    try {
      const { data, error } = await supabase
        .from('content_management')
        .select('tags')
        .eq('type', 'blog-post')
        .eq('status', 'published');

      if (error) throw error;

      const tags: Record<string, number> = {};

      (data || []).forEach(item => {
        if (item.tags && Array.isArray(item.tags)) {
          item.tags.forEach(tag => {
            tags[tag] = (tags[tag] || 0) + 1;
          });
        }
      });

      return Object.entries(tags)
        .map(([tag, count]) => ({ tag, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, limit);
    } catch (error) {
      console.error('Error fetching tags:', error);
      return [];
    }
  }

  /**
   * Get blog analytics
   */
  async getBlogAnalytics(
    contentId: string,
    dateFrom?: string,
    dateTo?: string
  ): Promise<ContentAnalytics[]> {
    try {
      let query = supabase
        .from('content_analytics')
        .select('*')
        .eq('content_id', contentId);

      if (dateFrom) {
        query = query.gte('date', dateFrom);
      }

      if (dateTo) {
        query = query.lte('date', dateTo);
      }

      query = query.order('date', { ascending: true });

      const { data, error } = await query;

      if (error) throw error;

      return data || [];
    } catch (error) {
      console.error('Error fetching blog analytics:', error);
      return [];
    }
  }

  /**
   * Get blog performance summary
   */
  async getBlogPerformanceSummary(
    contentId: string
  ): Promise<ContentPerformanceSummary | null> {
    try {
      const { data, error } = await supabase
        .from('content_with_analytics')
        .select('*')
        .eq('id', contentId)
        .single();

      if (error) throw error;

      // Calculate trend based on last 30 days
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { data: recentData, error: recentError } = await supabase
        .from('content_analytics')
        .select('views')
        .eq('content_id', contentId)
        .gte('date', thirtyDaysAgo.toISOString().split('T')[0]);

      if (!recentError && recentData) {
        const recentViews = recentData.reduce((sum, day) => sum + day.views, 0);
        const totalViews = data.total_views || 0;

        const olderViews = totalViews - recentViews;
        const trend = recentViews > olderViews ? 'up' : recentViews < olderViews ? 'down' : 'stable';
        const trendPercentage = olderViews > 0 ?
          ((recentViews - olderViews) / olderViews) * 100 : 0;

        return {
          content_id: contentId,
          total_views: data.total_views || 0,
          avg_time_on_page: data.avg_time_on_page || 0,
          total_conversions: data.total_conversions || 0,
          total_revenue: data.total_revenue || 0,
          conversion_rate: data.total_views > 0 ?
            ((data.total_conversions || 0) / data.total_views) * 100 : 0,
          engagement_rate: this.calculateEngagementRate(data),
          social_shares: data.total_shares || 0,
          comments_count: data.comments_count || 0,
          trend,
          trend_percentage: Math.abs(trendPercentage)
        };
      }

      return null;
    } catch (error) {
      console.error('Error fetching blog performance summary:', error);
      return null;
    }
  }

  /**
   * Track blog view
   */
  async trackView(contentId: string): Promise<void> {
    try {
      const today = new Date().toISOString().split('T')[0];

      await supabase.rpc('update_content_analytics', {
        p_content_id: contentId,
        p_date: today,
        p_views: 1
      });

      // Update total views count
      await supabase
        .from('content_management')
        .update({ views: supabase.raw('views + 1') })
        .eq('id', contentId);
    } catch (error) {
      console.error('Error tracking view:', error);
    }
  }

  /**
   * Get related blog posts
   */
  async getRelatedPosts(
    contentId: string,
    limit: number = 3
  ): Promise<ContentManagement[]> {
    try {
      // First get the current post to extract tags and category
      const currentPost = await this.getBlogPost(contentId);
      if (!currentPost) return [];

      let query = supabase
        .from('content_management')
        .select('*')
        .eq('type', 'blog-post')
        .eq('status', 'published')
        .neq('id', contentId)
        .limit(limit * 2); // Get more to have better selection

      // Filter by category if available
      if (currentPost.category) {
        query = query.eq('category', currentPost.category);
      }

      const { data, error } = await query;

      if (error) throw error;

      let posts = (data || []).map(item => ContentManagementSchema.parse(item));

      // If we have tags, score posts by tag similarity
      if (currentPost.tags && currentPost.tags.length > 0) {
        posts = posts
          .map(post => ({
            post,
            score: this.calculateSimilarityScore(currentPost, post)
          }))
          .sort((a, b) => b.score - a.score)
          .map(item => item.post)
          .slice(0, limit);
      } else {
        // Fallback to most recent
        posts = posts
          .sort((a, b) =>
            new Date(b.published_at || '').getTime() -
            new Date(a.published_at || '').getTime()
          )
          .slice(0, limit);
      }

      return posts;
    } catch (error) {
      console.error('Error fetching related posts:', error);
      return [];
    }
  }

  /**
   * Create a version record
   */
  private async createVersion(
    contentId: string,
    version: number,
    content: Partial<ContentManagement>,
    changesSummary?: string
  ): Promise<void> {
    try {
      await supabase
        .from('content_versions')
        .insert({
          content_id: contentId,
          version,
          content: {
            title: content.title,
            content: content.content,
            excerpt: content.excerpt
          },
          title: content.title,
          excerpt: content.excerpt,
          changes_summary: changesSummary
        });
    } catch (error) {
      console.error('Error creating version:', error);
    }
  }

  /**
   * Calculate similarity score between two posts
   */
  private calculateSimilarityScore(post1: ContentManagement, post2: ContentManagement): number {
    let score = 0;

    // Category match
    if (post1.category === post2.category) {
      score += 30;
    }

    // Tag similarity
    if (post1.tags && post2.tags) {
      const commonTags = post1.tags.filter(tag => post2.tags?.includes(tag));
      score += commonTags.length * 10;
    }

    // Language match
    if (post1.language === post2.language) {
      score += 10;
    }

    return score;
  }

  /**
   * Calculate engagement rate
   */
  private calculateEngagementRate(data: any): number {
    const views = data.total_views || 0;
    const shares = data.total_shares || 0;
    const comments = data.comments_count || 0;
    const likes = data.likes || 0;

    if (views === 0) return 0;

    return ((shares + comments + likes) / views) * 100;
  }
}

// Export singleton instance
export const blogService = BlogService.getInstance();