import { supabase } from '@/integrations/supabase/client';
import {
  ContentStrategyType,
  ContentPillar,
  TargetAudienceSegment,
  ContentSeasonality,
  ExpertiseLevel,
  WarsawFocusType,
  ContentTag,
  ContentCategory,
  ContentTagging,
  ContentClassification,
  ContentSearchRequest,
  ContentSearchResult,
  ContentRecommendation,
  PersonalizedRecommendations
} from '@/types/content-strategy';

// Content Strategy Service
export class ContentStrategyService {
  private static instance: ContentStrategyService;

  static getInstance(): ContentStrategyService {
    if (!ContentStrategyService.instance) {
      ContentStrategyService.instance = new ContentStrategyService();
    }
    return ContentStrategyService.instance;
  }

  // Content Tagging and Categorization
  async createContentTag(tag: Partial<ContentTag>): Promise<ContentTag> {
    const { data, error } = await supabase
      .from('content_tags')
      .insert([{
        name: tag.name,
        category: tag.category,
        description: tag.description,
        color: tag.color || '#6366f1',
        usage_count: 0
      }])
      .select()
      .single();

    if (error) throw new Error(`Failed to create content tag: ${error.message}`);
    return data;
  }

  async getAllContentTags(): Promise<ContentTag[]> {
    const { data, error } = await supabase
      .from('content_tags')
      .select('*')
      .order('usage_count', { ascending: false });

    if (error) throw new Error(`Failed to fetch content tags: ${error.message}`);
    return data || [];
  }

  async getTagsByCategory(category: ContentTag['category']): Promise<ContentTag[]> {
    const { data, error } = await supabase
      .from('content_tags')
      .select('*')
      .eq('category', category)
      .order('usage_count', { ascending: false });

    if (error) throw new Error(`Failed to fetch tags by category: ${error.message}`);
    return data || [];
  }

  async tagContent(contentId: string, tagId: string, relevanceScore: number = 5, autoAssigned: boolean = false): Promise<ContentTagging> {
    // Check if tagging already exists
    const { data: existing } = await supabase
      .from('content_tagging')
      .select('*')
      .eq('content_id', contentId)
      .eq('tag_id', tagId)
      .single();

    if (existing) {
      // Update existing tagging
      const { data, error } = await supabase
        .from('content_tagging')
        .update({
          relevance_score: relevanceScore,
          auto_assigned: autoAssigned,
          updated_at: new Date().toISOString()
        })
        .eq('id', existing.id)
        .select()
        .single();

      if (error) throw new Error(`Failed to update content tagging: ${error.message}`);
      return data;
    } else {
      // Create new tagging
      const { data, error } = await supabase
        .from('content_tagging')
        .insert([{
          content_id: contentId,
          tag_id: tagId,
          relevance_score: relevanceScore,
          auto_assigned: autoAssigned
        }])
        .select()
        .single();

      if (error) throw new Error(`Failed to create content tagging: ${error.message}`);

      // Update tag usage count
      await this.incrementTagUsage(tagId);

      return data;
    }
  }

  private async incrementTagUsage(tagId: string): Promise<void> {
    await supabase.rpc('increment_tag_usage', { tag_id: tagId });
  }

  async getContentTags(contentId: string): Promise<(ContentTag & { tagging: ContentTagging })[]> {
    const { data, error } = await supabase
      .from('content_tagging')
      .select(`
        *,
        content_tags (*)
      `)
      .eq('content_id', contentId);

    if (error) throw new Error(`Failed to fetch content tags: ${error.message}`);

    return data?.map(item => ({
      ...item.content_tags,
      tagging: {
        content_id: item.content_id,
        tag_id: item.tag_id,
        relevance_score: item.relevance_score,
        auto_assigned: item.auto_assigned,
        assigned_by: item.assigned_by,
        created_at: item.created_at
      }
    })) || [];
  }

  // Content Categories
  async createContentCategory(category: Partial<ContentCategory>): Promise<ContentCategory> {
    const { data, error } = await supabase
      .from('content_categories')
      .insert([{
        name: category.name,
        parent_id: category.parent_id,
        description: category.description,
        content_pillar: category.content_pillar,
        target_audience: category.target_audience,
        expertise_level: category.expertise_level,
        seasonal_relevance: category.seasonal_relevance || [],
        warsaw_focus: category.warsaw_focus,
        icon: category.icon || 'folder',
        color: category.color || '#8b5cf6',
        content_count: 0
      }])
      .select()
      .single();

    if (error) throw new Error(`Failed to create content category: ${error.message}`);
    return data;
  }

  async getContentCategories(parentId?: string): Promise<ContentCategory[]> {
    let query = supabase
      .from('content_categories')
      .select('*')
      .order('name');

    if (parentId) {
      query = query.eq('parent_id', parentId);
    } else {
      query = query.is('parent_id', null);
    }

    const { data, error } = await query;

    if (error) throw new Error(`Failed to fetch content categories: ${error.message}`);
    return data || [];
  }

  async getCategoryHierarchy(): Promise<(ContentCategory & { children: ContentCategory[] })[]> {
    const { data, error } = await supabase
      .from('content_categories')
      .select('*')
      .order('name');

    if (error) throw new Error(`Failed to fetch category hierarchy: ${error.message}`);

    if (!data) return [];

    const categories = data;
    const rootCategories = categories.filter(cat => !cat.parent_id);

    return rootCategories.map(root => ({
      ...root,
      children: categories.filter(cat => cat.parent_id === root.id)
    }));
  }

  // Content Classification
  async classifyContent(contentId: string, classification: Partial<ContentClassification>): Promise<ContentClassification> {
    // Auto-generate classification scores based on content analysis
    const autoClassification = await this.generateAutoClassification(contentId);

    const finalClassification = {
      ...autoClassification,
      ...classification,
      content_id: contentId
    };

    const { data, error } = await supabase
      .from('content_classifications')
      .upsert([finalClassification], {
        onConflict: 'content_id',
        ignoreDuplicates: false
      })
      .select()
      .single();

    if (error) throw new Error(`Failed to classify content: ${error.message}`);
    return data;
  }

  private async generateAutoClassification(contentId: string): Promise<Partial<ContentClassification>> {
    // This would integrate with AI to analyze content and generate classification scores
    // For now, return default values
    return {
      authority_level: 'established',
      trust_score: 75,
      expertise_verification: true,
      depth_level: 'intermediate',
      research_intensity: 'medium',
      practical_application: 'both',
      warsaw_relevance_score: 80,
      cultural_adaptation_level: 'local_warsaw',
      local_impact_potential: 'high',
      educational_score: 85,
      learning_objectives_met: [],
      practical_takeaways: 5,
      seo_optimization_level: 'optimized',
      keyword_ranking_potential: 85,
      backlink_attraction_score: 75,
      viral_potential: 'medium',
      shareability_score: 70,
      comment_engagement_potential: 65
    };
  }

  async getContentClassification(contentId: string): Promise<ContentClassification | null> {
    const { data, error } = await supabase
      .from('content_classifications')
      .select('*')
      .eq('content_id', contentId)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw new Error(`Failed to fetch content classification: ${error.message}`);
    }

    return data;
  }

  // Advanced Content Search
  async searchContent(searchRequest: ContentSearchRequest): Promise<{
    results: ContentSearchResult[];
    total: number;
    hasMore: boolean;
  }> {
    let query = supabase
      .from('content_strategy_items')
      .select(`
        *,
        content_strategy!inner (*),
        content_classifications (*)
      `, { count: 'exact' });

    // Apply filters
    if (searchRequest.query) {
      query = query.or(`title.ilike.%${searchRequest.query}%,main_topic.ilike.%${searchRequest.query}%,key_messages.cs.{${searchRequest.query}}`);
    }

    if (searchRequest.filters.strategy_type?.length) {
      query = query.in('content_strategy.strategy_type', searchRequest.filters.strategy_type);
    }

    if (searchRequest.filters.content_pillar?.length) {
      query = query.in('content_strategy.content_pillar', searchRequest.filters.content_pillar);
    }

    if (searchRequest.filters.target_audience?.length) {
      query = query.in('content_strategy.target_audience', searchRequest.filters.target_audience);
    }

    if (searchRequest.filters.expertise_level?.length) {
      query = query.in('content_strategy.expertise_level', searchRequest.filters.expertise_level);
    }

    if (searchRequest.filters.seasonality?.length) {
      query = query.in('content_strategy.seasonality', searchRequest.filters.seasonality);
    }

    if (searchRequest.filters.warsaw_focus?.length) {
      query = query.in('content_strategy.warsaw_focus', searchRequest.filters.warsaw_focus);
    }

    if (searchRequest.filters.status?.length) {
      query = query.in('status', searchRequest.filters.status);
    }

    if (searchRequest.filters.date_range) {
      query = query
        .gte('publish_date', searchRequest.filters.date_range.start)
        .lte('publish_date', searchRequest.filters.date_range.end);
    }

    // Apply sorting
    const sortField = this.mapSortField(searchRequest.sort_by);
    query = query.order(sortField, {
      ascending: searchRequest.sort_order === 'asc'
    });

    // Apply pagination
    query = query
      .range(searchRequest.offset, searchRequest.offset + searchRequest.limit - 1);

    const { data, error, count } = await query;

    if (error) throw new Error(`Failed to search content: ${error.message}`);

    // Transform results to include search relevance and other metadata
    const results: ContentSearchResult[] = (data || []).map(item => ({
      content_id: item.id,
      title: item.title,
      content_type: item.content_type,
      relevance_score: this.calculateRelevanceScore(item, searchRequest),
      quality_score: item.content_classifications?.[0]?.educational_score || 50,
      authority_score: item.content_classifications?.[0]?.trust_score || 50,
      local_relevance_score: item.content_classifications?.[0]?.warsaw_relevance_score || 50,
      matching_tags: [], // Would need to join with tags
      matching_categories: [], // Would need to join with categories
      preview: {
        title: item.title,
        excerpt: item.key_messages?.[0] || item.specific_angle || '',
        key_points: item.key_messages?.slice(0, 3) || []
      },
      classification: item.content_classifications?.[0] || this.getDefaultClassification()
    }));

    return {
      results,
      total: count || 0,
      hasMore: (searchRequest.offset + searchRequest.limit) < (count || 0)
    };
  }

  private mapSortField(sortBy: string): string {
    const mapping: Record<string, string> = {
      'relevance': 'content_strategy.priority',
      'created_at': 'created_at',
      'updated_at': 'updated_at',
      'quality_score': 'content_classifications.educational_score',
      'authority_score': 'content_classifications.trust_score',
      'engagement_rate': 'content_strategy.priority'
    };
    return mapping[sortBy] || 'updated_at';
  }

  private calculateRelevanceScore(item: any, searchRequest: ContentSearchRequest): number {
    // Simple relevance scoring based on query matching and filters
    let score = 50; // Base score

    if (searchRequest.query) {
      const query = searchRequest.query.toLowerCase();
      const title = item.title.toLowerCase();
      const topic = item.main_topic.toLowerCase();

      if (title.includes(query)) score += 30;
      if (topic.includes(query)) score += 20;

      // Check in key messages
      item.key_messages?.forEach((message: string) => {
        if (message.toLowerCase().includes(query)) score += 10;
      });
    }

    // Boost based on priority and status
    if (item.status === 'published') score += 10;
    score += (item.content_strategy?.priority || 5) * 2;

    return Math.min(score, 100);
  }

  private getDefaultClassification(): ContentClassification {
    return {
      id: '',
      content_id: '',
      authority_level: 'established',
      trust_score: 50,
      expertise_verification: false,
      depth_level: 'intermediate',
      research_intensity: 'medium',
      practical_application: 'both',
      warsaw_relevance_score: 50,
      cultural_adaptation_level: 'regional',
      local_impact_potential: 'medium',
      educational_score: 50,
      learning_objectives_met: [],
      practical_takeaways: 0,
      seo_optimization_level: 'basic',
      keyword_ranking_potential: 50,
      backlink_attraction_score: 50,
      viral_potential: 'medium',
      shareability_score: 50,
      comment_engagement_potential: 50,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
  }

  // Content Recommendations
  async generatePersonalizedRecommendations(userId: string): Promise<PersonalizedRecommendations> {
    // Get user profile and behavior
    const userProfile = await this.getUserProfile(userId);

    // Get current season and local events
    const currentSeason = this.getCurrentSeason();
    const localEvents = await this.getLocalWarsawEvents();

    // Get trending topics
    const trendingTopics = await this.getTrendingTopics(userProfile.expertise_level);

    // Generate recommendations based on user profile and context
    const recommendations = await this.generateRecommendations(userProfile, {
      currentSeason,
      localEvents,
      trendingTopics
    });

    return {
      user_id: userId,
      user_profile: userProfile,
      recommendations,
      recommendation_context: {
        current_season: currentSeason,
        local_events: localEvents,
        trending_topics: trendingTopics,
        user_progress: {
          completed_content: await this.getUserCompletedContent(userId),
          in_progress_content: await this.getUserInProgressContent(userId),
          bookmarked_content: await this.getUserBookmarkedContent(userId)
        }
      },
      generated_at: new Date().toISOString(),
      valid_until: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours
    };
  }

  private async getUserProfile(userId: string) {
    // This would integrate with user service to get detailed profile
    return {
      expertise_level: 'intermediate' as ExpertiseLevel,
      interests: ['beauty_innovation', 'warsaw_lifestyle'],
      learning_goals: ['advanced_techniques', 'business_growth'],
      location_preference: 'warsaw',
      content_preferences: {
        formats: ['blog_post', 'video_tutorial'],
        lengths: ['medium', 'long'],
        topics: ['lip_enhancements', 'brow_artistry']
      }
    };
  }

  private getCurrentSeason(): ContentSeasonality {
    const month = new Date().getMonth();
    if (month >= 2 && month <= 4) return 'spring_prep';
    if (month >= 5 && month <= 7) return 'summer_ready';
    if (month >= 8 && month <= 10) return 'autumn_wellness';
    return 'winter_recovery';
  }

  private async getLocalWarsawEvents(): Promise<string[]> {
    // This would integrate with a local events API
    return ['Warsaw Beauty Week', 'Vistula Fitness Festival', 'Chopin Concert Series'];
  }

  private async getTrendingTopics(expertiseLevel: ExpertiseLevel): Promise<string[]> {
    // This would analyze trending content and search data
    return [
      'advanced_lip_techniques',
      'sustainable_beauty_practices',
      'holistic_wellness_integration',
      'warsaw_beauty_trends_2025'
    ];
  }

  private async generateRecommendations(userProfile: any, context: any): Promise<ContentRecommendation[]> {
    // Complex recommendation algorithm considering user profile, context, and content relationships
    const recommendations: ContentRecommendation[] = [];

    // Find similar content based on user interests
    const similarContent = await this.findSimilarContent(userProfile.interests, userProfile.expertise_level);

    similarContent.forEach(content => {
      recommendations.push({
        content_id: content.id,
        recommendation_type: 'similar_content',
        relevance_score: this.calculateRecommendationScore(content, userProfile, context),
        reason: `Matches your interest in ${userProfile.interests.join(' and ')}`,
        based_on: ['user_interests', 'expertise_level', 'seasonal_relevance'],
        confidence: 85,
        created_at: new Date().toISOString()
      });
    });

    // Find next learning steps
    const nextLearning = await this.findNextLearningContent(userProfile);

    nextLearning.forEach(content => {
      recommendations.push({
        content_id: content.id,
        recommendation_type: 'next_learning',
        relevance_score: this.calculateRecommendationScore(content, userProfile, context),
        reason: `Next step in your learning journey`,
        based_on: ['learning_path', 'completed_content'],
        confidence: 90,
        created_at: new Date().toISOString()
      });
    });

    return recommendations.sort((a, b) => b.relevance_score - a.relevance_score).slice(0, 10);
  }

  private async findSimilarContent(interests: string[], expertiseLevel: ExpertiseLevel) {
    // Query content that matches user interests and expertise level
    const { data, error } = await supabase
      .from('content_strategy_items')
      .select(`
        *,
        content_strategy!inner (*),
        content_classifications (*)
      `)
      .eq('content_strategy.expertise_level', expertiseLevel)
      .in('content_strategy.content_pillar', interests)
      .eq('status', 'published')
      .limit(20);

    if (error) throw new Error(`Failed to find similar content: ${error.message}`);
    return data || [];
  }

  private async findNextLearningContent(userProfile: any) {
    // Find content that builds on what user has already completed
    const completedContent = await this.getUserCompletedContent(userProfile.user_id || '');

    // This would use content relationships to find next steps
    const { data, error } = await supabase
      .from('content_strategy_items')
      .select(`
        *,
        content_strategy!inner (*)
      `)
      .eq('status', 'published')
      .limit(10);

    if (error) throw new Error(`Failed to find next learning content: ${error.message}`);
    return data || [];
  }

  private calculateRecommendationScore(content: any, userProfile: any, context: any): number {
    let score = 0;

    // Interest alignment
    if (userProfile.interests.includes(content.content_strategy?.content_pillar)) {
      score += 30;
    }

    // Expertise level match
    if (content.content_strategy?.expertise_level === userProfile.expertise_level) {
      score += 20;
    }

    // Seasonal relevance
    if (content.content_strategy?.seasonality === context.currentSeason ||
        content.content_strategy?.seasonality === 'year_round') {
      score += 15;
    }

    // Local relevance
    if (content.content_classifications?.[0]?.warsaw_relevance_score > 70) {
      score += 15;
    }

    // Quality score
    score += (content.content_classifications?.[0]?.educational_score || 50) * 0.2;

    return Math.min(score, 100);
  }

  private async getUserCompletedContent(userId: string): Promise<string[]> {
    // This would track user's completed content
    return [];
  }

  private async getUserInProgressContent(userId: string): Promise<string[]> {
    // This would track user's in-progress content
    return [];
  }

  private async getUserBookmarkedContent(userId: string): Promise<string[]> {
    // This would track user's bookmarked content
    return [];
  }

  // Content Quality Assessment
  async assessContentQuality(contentId: string): Promise<{
    overall_score: number;
    quality_tier: 'basic' | 'good' | 'excellent' | 'outstanding' | 'industry_leading';
    assessment_breakdown: {
      authority: number;
      educational_value: number;
      local_relevance: number;
      seo_optimization: number;
      engagement_potential: number;
    };
    recommendations: string[];
  }> {
    const classification = await this.getContentClassification(contentId);

    if (!classification) {
      throw new Error('Content classification not found');
    }

    const assessment = {
      authority: classification.trust_score,
      educational_value: classification.educational_score,
      local_relevance: classification.warsaw_relevance_score,
      seo_optimization: (classification.keyword_ranking_potential + classification.backlink_attraction_score) / 2,
      engagement_potential: (classification.shareability_score + classification.comment_engagement_potential) / 2
    };

    const overallScore = Object.values(assessment).reduce((a, b) => a + b, 0) / Object.keys(assessment).length;

    let quality_tier: string;
    if (overallScore >= 95) quality_tier = 'industry_leading';
    else if (overallScore >= 85) quality_tier = 'outstanding';
    else if (overallScore >= 75) quality_tier = 'excellent';
    else if (overallScore >= 65) quality_tier = 'good';
    else quality_tier = 'basic';

    const recommendations = this.generateQualityRecommendations(assessment, classification);

    return {
      overall_score: overallScore,
      quality_tier: quality_tier as any,
      assessment_breakdown: assessment,
      recommendations
    };
  }

  private generateQualityRecommendations(assessment: any, classification: ContentClassification): string[] {
    const recommendations: string[] = [];

    if (assessment.authority < 70) {
      recommendations.push('Add expert citations and references to increase authority');
    }

    if (assessment.educational_value < 70) {
      recommendations.push('Include more practical takeaways and learning objectives');
    }

    if (assessment.local_relevance < 70) {
      recommendations.push('Add more Warsaw-specific examples and local context');
    }

    if (assessment.seo_optimization < 70) {
      recommendations.push('Improve keyword optimization and meta tags');
    }

    if (assessment.engagement_potential < 70) {
      recommendations.push('Add more engaging elements and social sharing prompts');
    }

    if (recommendations.length === 0) {
      recommendations.push('Content quality is excellent - consider promoting more aggressively');
    }

    return recommendations;
  }
}

// Export singleton instance
export const contentStrategyService = ContentStrategyService.getInstance();