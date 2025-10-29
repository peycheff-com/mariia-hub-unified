import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { getAIService, BlogPostRequest, ServiceDescriptionRequest, ContentType } from '@/integrations/ai/service';
import { supabase } from '@/integrations/supabase/client';

import { ContentGenerationOptions, ContentItem } from '../types';

export const useContentGeneration = () => {
  const queryClient = useQueryClient();

  const generateContentMutation = useMutation({
    mutationFn: async (params: {
      type: ContentType;
      prompt: string;
      language: string;
      title?: string;
      options: ContentGenerationOptions;
    }) => {
      const aiService = getAIService();

      if (params.type === 'blog-post') {
        const request: BlogPostRequest = {
          topic: params.prompt,
          tone: params.options.tone,
          wordCount: params.options.length,
          language: params.language as 'en' | 'pl',
          seoKeywords: params.options.keywords,
          category: params.options.category,
          targetAudience: params.options.audience,
        };
        return aiService.generateBlogPost(request);
      } else if (params.type === 'service-description') {
        const request: ServiceDescriptionRequest = {
          serviceName: params.prompt,
          tone: params.options.tone,
          wordCount: params.options.length,
          language: params.language as 'en' | 'pl',
        };
        return aiService.generateServiceDescription(request);
      }

      throw new Error('Unsupported content type');
    },
    onSuccess: async (data, variables) => {
      const newContent: Partial<ContentItem> = {
        type: variables.type,
        title: { [variables.language]: data.title || variables.title },
        content: { [variables.language]: data.content || data.detailedDescription },
        slug: data.slug || generateSlug(data.title || variables.title || ''),
        status: 'draft',
        author: 'Current User', // NOTE: Auth integration pending - currently hardcoded
        authorId: 'current-user-id', // NOTE: Auth integration pending - currently hardcoded
        language: variables.language,
        seoTitle: { [variables.language]: data.seoTitle },
        metaDescription: { [variables.language]: data.metaDescription },
        tags: data.tags || [],
        category: variables.options.category,
        aiGenerated: true,
        aiPrompt: variables.prompt,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        version: 1,
      };

      const { error } = await supabase
        .from('content_management')
        .insert(newContent);

      if (error) throw error;

      toast.success('Content generated successfully');
      queryClient.invalidateQueries({ queryKey: ['content-management'] });
    },
    onError: (error) => {
      console.error('Content generation failed:', error);
      toast.error('Failed to generate content');
    },
  });

  const generateSlug = (title: string): string => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9 -]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  };

  return {
    generateContent: generateContentMutation.mutate,
    isGenerating: generateContentMutation.isPending,
  };
};