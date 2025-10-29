import { supabase } from '@/integrations/supabase/client';

import { aiService } from './config';

// Database integration for AI services
export interface AIServiceRecord {
  id: string;
  name: string;
  description: string;
  category: 'beauty' | 'fitness' | 'lifestyle';
  service_type: string;
  duration_minutes: number;
  price_pln: number;
  price_eur?: number;
  price_usd?: number;
  ai_generated: boolean;
  ai_version: string;
  content: {
    short_description: string;
    detailed_description: string;
    key_benefits: string[];
    preparation?: string;
    aftercare?: string;
    what_to_expect: string;
    faq: Array<{ question: string; answer: string }>;
  };
  metadata: {
    confidence_score: number;
    generation_date: string;
    last_updated: string;
    update_count: number;
    quality_score?: number;
    user_feedback?: number;
  };
  created_at: string;
  updated_at: string;
}

export interface AIBlogPost {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  seo_title: string;
  meta_description: string;
  tags: string[];
  category: string;
  language: string;
  reading_time: number;
  status: 'draft' | 'published' | 'archived';
  ai_generated: boolean;
  ai_version: string;
  metadata: {
    confidence_score: number;
    generation_date: string;
    word_count: number;
    seo_score?: number;
    quality_score?: number;
    user_feedback?: number;
  };
  created_at: string;
  updated_at: string;
  published_at?: string;
}

export class AIDatabaseIntegration {
  private static instance: AIDatabaseIntegration;

  static getInstance(): AIDatabaseIntegration {
    if (!AIDatabaseIntegration.instance) {
      AIDatabaseIntegration.instance = new AIDatabaseIntegration();
    }
    return AIDatabaseIntegration.instance;
  }

  // Service management
  async saveAIGeneratedService(service: Omit<AIServiceRecord, 'id' | 'created_at' | 'updated_at'>): Promise<string> {
    try {
      const { data, error } = await supabase
        .from('ai_generated_services')
        .insert({
          ...service,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select('id')
        .single();

      if (error) throw error;
      return data.id;
    } catch (error) {
      console.error('Failed to save AI generated service:', error);
      throw error;
    }
  }

  async updateServiceFromAI(
    serviceId: string,
    updates: Partial<AIServiceRecord>
  ): Promise<void> {
    try {
      const { error } = await supabase
        .from('ai_generated_services')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
          metadata: {
            ...updates.metadata,
            last_updated: new Date().toISOString(),
            update_count: (updates.metadata?.update_count || 0) + 1,
          },
        })
        .eq('id', serviceId);

      if (error) throw error;
    } catch (error) {
      console.error('Failed to update service:', error);
      throw error;
    }
  }

  async getAIGeneratedServices(
    category?: string,
    limit: number = 50
  ): Promise<AIServiceRecord[]> {
    try {
      let query = supabase
        .from('ai_generated_services')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (category) {
        query = query.eq('category', category);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Failed to fetch AI services:', error);
      return [];
    }
  }

  async enhanceExistingService(
    serviceId: string,
    enhancementType: 'description' | 'benefits' | 'faq' | 'all'
  ): Promise<void> {
    try {
      // Fetch existing service
      const { data: service, error: fetchError } = await supabase
        .from('services')
        .select('*')
        .eq('id', serviceId)
        .single();

      if (fetchError || !service) {
        throw new Error('Service not found');
      }

      // Generate enhancements
      const enhancements = await this.generateServiceEnhancements(service, enhancementType);

      // Update service with AI enhancements
      const updates: any = {
        ai_enhanced: true,
        ai_enhanced_at: new Date().toISOString(),
      };

      if (enhancementType === 'description' || enhancementType === 'all') {
        updates.description = enhancements.description;
        updates.ai_description = enhancements.description;
      }

      if (enhancementType === 'benefits' || enhancementType === 'all') {
        updates.benefits = enhancements.benefits;
        updates.ai_benefits = enhancements.benefits;
      }

      if (enhancementType === 'faq' || enhancementType === 'all') {
        updates.faq = enhancements.faq;
        updates.ai_faq = enhancements.faq;
      }

      const { error: updateError } = await supabase
        .from('services')
        .update(updates)
        .eq('id', serviceId);

      if (updateError) throw updateError;
    } catch (error) {
      console.error('Failed to enhance service:', error);
      throw error;
    }
  }

  private async generateServiceEnhancements(
    service: any,
    type: string
  ): Promise<any> {
    if (!aiService) {
      throw new Error('AI service not available');
    }

    const prompt = `Enhance this ${service.category} service:

Service Name: ${service.name}
Current Description: ${service.description || 'Not provided'}
Duration: ${service.duration_minutes} minutes
Price: ${service.price_pln} PLN

Enhancement Type: ${type}

Generate improvements for:
${type === 'description' || type === 'all' ? '- Enhanced description (luxury, appealing, professional)' : ''}
${type === 'benefits' || type === 'all' ? '- Key benefits (4-6 points)' : ''}
${type === 'faq' || type === 'all' ? '- FAQ section (3-5 questions)' : ''}

Keep the tone luxury and professional for Warsaw market.
Respond with JSON format.`;

    const response = await aiService['generateContent'](
      prompt,
      'You are an expert copywriter for luxury beauty and fitness services.',
      0.7,
      1500
    );

    return JSON.parse(response);
  }

  // Blog post management
  async saveAIBlogPost(post: Omit<AIBlogPost, 'id' | 'created_at' | 'updated_at'>): Promise<string> {
    try {
      const { data, error } = await supabase
        .from('ai_blog_posts')
        .insert({
          ...post,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select('id')
        .single();

      if (error) throw error;
      return data.id;
    } catch (error) {
      console.error('Failed to save AI blog post:', error);
      throw error;
    }
  }

  async getAIBlogPosts(
    status?: 'draft' | 'published' | 'archived',
    limit: number = 20
  ): Promise<AIBlogPost[]> {
    try {
      let query = supabase
        .from('ai_blog_posts')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (status) {
        query = query.eq('status', status);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Failed to fetch AI blog posts:', error);
      return [];
    }
  }

  async publishAIBlogPost(postId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('ai_blog_posts')
        .update({
          status: 'published',
          published_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', postId);

      if (error) throw error;
    } catch (error) {
      console.error('Failed to publish blog post:', error);
      throw error;
    }
  }

  // Content synchronization
  async syncAIContentToMainTables(): Promise<{
    servicesSynced: number;
    blogPostsSynced: number;
    errors: string[];
  }> {
    const result = {
      servicesSynced: 0,
      blogPostsSynced: 0,
      errors: [] as string[],
    };

    try {
      // Sync AI services to main services table
      const aiServices = await this.getAIGeneratedServices();
      for (const aiService of aiServices) {
        try {
          const serviceData = {
            name: aiService.name,
            description: aiService.content.detailed_description,
            category: aiService.category,
            service_type: aiService.service_type,
            duration_minutes: aiService.duration_minutes,
            price_pln: aiService.price_pln,
            price_eur: aiService.price_eur,
            price_usd: aiService.price_usd,
            ai_generated: true,
            ai_version: aiService.ai_version,
            ai_enhanced: true,
            updated_at: new Date().toISOString(),
          };

          const { error: syncError } = await supabase
            .from('services')
            .upsert(serviceData, { onConflict: 'id' });

          if (syncError) {
            result.errors.push(`Service sync error: ${syncError.message}`);
          } else {
            result.servicesSynced++;
          }
        } catch (error) {
          result.errors.push(`Service ${aiService.id}: ${error.message}`);
        }
      }

      // Sync AI blog posts to main blog_posts table
      const aiPosts = await this.getAIBlogPosts();
      for (const aiPost of aiPosts) {
        try {
          const postData = {
            title: aiPost.title,
            slug: aiPost.slug,
            content: aiPost.content,
            excerpt: aiPost.excerpt,
            seo_title: aiPost.seo_title,
            meta_description: aiPost.meta_description,
            tags: aiPost.tags,
            category: aiPost.category,
            language: aiPost.language,
            reading_time: aiPost.reading_time,
            status: aiPost.status,
            ai_generated: true,
            ai_version: aiPost.ai_version,
            published_at: aiPost.published_at,
            updated_at: new Date().toISOString(),
          };

          const { error: syncError } = await supabase
            .from('blog_posts')
            .upsert(postData, { onConflict: 'id' });

          if (syncError) {
            result.errors.push(`Blog post sync error: ${syncError.message}`);
          } else {
            result.blogPostsSynced++;
          }
        } catch (error) {
          result.errors.push(`Blog post ${aiPost.id}: ${error.message}`);
        }
      }
    } catch (error) {
      result.errors.push(`Sync process error: ${error.message}`);
    }

    return result;
  }

  // Quality monitoring
  async monitorAIContentQuality(): Promise<{
    averageQualityScore: number;
    lowQualityItems: Array<{ id: string; type: string; score: number }>;
    recommendations: string[];
  }> {
    try {
      // Get quality scores from AI services
      const [services, posts] = await Promise.all([
        this.getAIGeneratedServices(undefined, 100),
        this.getAIBlogPosts(undefined, 100),
      ]);

      const allScores = [
        ...services.map(s => s.metadata.quality_score || 0),
        ...posts.map(p => p.metadata.quality_score || 0),
      ].filter(score => score > 0);

      const averageQualityScore = allScores.length > 0
        ? allScores.reduce((a, b) => a + b, 0) / allScores.length
        : 0;

      const lowQualityItems = [
        ...services
          .filter(s => (s.metadata.quality_score || 0) < 70)
          .map(s => ({ id: s.id, type: 'service', score: s.metadata.quality_score || 0 })),
        ...posts
          .filter(p => (p.metadata.quality_score || 0) < 70)
          .map(p => ({ id: p.id, type: 'blog', score: p.metadata.quality_score || 0 })),
      ];

      const recommendations = [
        averageQualityScore < 70 ? 'Overall quality score is below optimal. Review generation parameters.' : '',
        lowQualityItems.length > 5 ? 'High number of low-quality items detected. Consider regeneration.' : '',
        'Implement user feedback collection to improve quality assessment.',
        'Regular review and update of AI-generated content recommended.',
      ].filter(Boolean);

      return {
        averageQualityScore,
        lowQualityItems,
        recommendations,
      };
    } catch (error) {
      console.error('Failed to monitor AI content quality:', error);
      return {
        averageQualityScore: 0,
        lowQualityItems: [],
        recommendations: ['Unable to assess quality at this time.'],
      };
    }
  }

  // Cleanup and maintenance
  async cleanupOldAIContent(daysOld: number = 90): Promise<{
    deletedServices: number;
    deletedPosts: number;
    errors: string[];
  }> {
    const result = {
      deletedServices: 0,
      deletedPosts: 0,
      errors: [] as string[],
    };

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    try {
      // Delete old AI services (draft status only)
      const { error: serviceError } = await supabase
        .from('ai_generated_services')
        .delete()
        .lt('created_at', cutoffDate.toISOString())
        .eq('metadata->>status', 'draft');

      if (serviceError) {
        result.errors.push(`Service cleanup error: ${serviceError.message}`);
      }

      // Delete old AI blog posts (draft status only)
      const { error: postError } = await supabase
        .from('ai_blog_posts')
        .delete()
        .lt('created_at', cutoffDate.toISOString())
        .eq('status', 'draft');

      if (postError) {
        result.errors.push(`Blog post cleanup error: ${postError.message}`);
      }
    } catch (error) {
      result.errors.push(`Cleanup process error: ${error.message}`);
    }

    return result;
  }
}

// Export singleton instance
export const aiDatabaseService = AIDatabaseIntegration.getInstance();

// React hook for AI database operations
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';

export function useAIDatabase() {
  const queryClient = useQueryClient();
  const [isProcessing, setIsProcessing] = useState(false);

  const saveServiceMutation = useMutation({
    mutationFn: (service: Omit<AIServiceRecord, 'id' | 'created_at' | 'updated_at'>) =>
      aiDatabaseService.saveAIGeneratedService(service),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ai-services'] });
    },
  });

  const saveBlogPostMutation = useMutation({
    mutationFn: (post: Omit<AIBlogPost, 'id' | 'created_at' | 'updated_at'>) =>
      aiDatabaseService.saveAIBlogPost(post),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ai-blog-posts'] });
    },
  });

  const enhanceServiceMutation = useMutation({
    mutationFn: ({ serviceId, type }: { serviceId: string; type: string }) =>
      aiDatabaseService.enhanceExistingService(serviceId, type as any),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['services'] });
    },
  });

  const syncContentMutation = useMutation({
    mutationFn: () => aiDatabaseService.syncAIContentToMainTables(),
  });

  return {
    saveService: saveServiceMutation.mutateAsync,
    saveBlogPost: saveBlogPostMutation.mutateAsync,
    enhanceService: enhanceServiceMutation.mutateAsync,
    syncContent: syncContentMutation.mutateAsync,
    isProcessing,
    isLoading: saveServiceMutation.isPending || saveBlogPostMutation.isPending || enhanceServiceMutation.isPending,
  };
}