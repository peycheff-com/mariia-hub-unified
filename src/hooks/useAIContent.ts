import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import { aiService, isAIFeatureEnabled } from '@/integrations/ai/config';

import type {
  BlogPostRequest,
  BlogPostResponse,
  ServiceDescriptionRequest,
  ServiceDescriptionResponse,
  TranslationRequest,
  TranslationResponse,
} from '@/integrations/ai/service';

// Blog post generation hook
export function useAIBlogPost() {
  const [isGenerating, setIsGenerating] = useState(false);
  const queryClient = useQueryClient();

  const generateMutation = useMutation({
    mutationFn: async (request: BlogPostRequest): Promise<BlogPostResponse> => {
      if (!aiService || !isAIFeatureEnabled('CONTENT_GENERATION')) {
        throw new Error('AI content generation is not available');
      }

      setIsGenerating(true);
      try {
        const response = await aiService.generateBlogPost(request);
        return response;
      } finally {
        setIsGenerating(false);
      }
    },
    onSuccess: (data) => {
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['ai-generated-content'] });
    },
  });

  return {
    generateBlogPost: generateMutation.mutateAsync,
    isGenerating: isGenerating || generateMutation.isPending,
    error: generateMutation.error,
    data: generateMutation.data,
    reset: generateMutation.reset,
  };
}

// Service description generation hook
export function useAIServiceDescription() {
  const [isGenerating, setIsGenerating] = useState(false);
  const queryClient = useQueryClient();

  const generateMutation = useMutation({
    mutationFn: async (request: ServiceDescriptionRequest): Promise<ServiceDescriptionResponse> => {
      if (!aiService || !isAIFeatureEnabled('CONTENT_GENERATION')) {
        throw new Error('AI content generation is not available');
      }

      setIsGenerating(true);
      try {
        const response = await aiService.generateServiceDescription(request);
        return response;
      } finally {
        setIsGenerating(false);
      }
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['ai-generated-content'] });
    },
  });

  return {
    generateServiceDescription: generateMutation.mutateAsync,
    isGenerating: isGenerating || generateMutation.isPending,
    error: generateMutation.error,
    data: generateMutation.data,
    reset: generateMutation.reset,
  };
}

// Translation hook
export function useAITranslation() {
  const [isTranslating, setIsTranslating] = useState(false);

  const translateMutation = useMutation({
    mutationFn: async (request: TranslationRequest): Promise<TranslationResponse> => {
      if (!aiService || !isAIFeatureEnabled('TRANSLATION')) {
        throw new Error('AI translation is not available');
      }

      setIsTranslating(true);
      try {
        const response = await aiService.translateText(request);
        return response;
      } finally {
        setIsTranslating(false);
      }
    },
  });

  // Quick translate function
  const translate = useCallback(async (
    text: string,
    targetLanguage: 'en' | 'pl',
    sourceLanguage?: 'en' | 'pl'
  ) => {
    return translateMutation.mutateAsync({
      text,
      targetLanguage,
      sourceLanguage,
      maintainTone: true,
    });
  }, [translateMutation]);

  return {
    translate,
    translateMutation,
    isTranslating: isTranslating || translateMutation.isPending,
    error: translateMutation.error,
    data: translateMutation.data,
    reset: translateMutation.reset,
  };
}

// Content improvement suggestions hook
export function useAIContentImprovement() {
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const analyzeMutation = useMutation({
    mutationFn: async ({ content, type }: { content: string; type: 'blog' | 'service' }) => {
      if (!aiService || !isAIFeatureEnabled('CONTENT_GENERATION')) {
        throw new Error('AI content analysis is not available');
      }

      setIsAnalyzing(true);
      try {
        const prompt = `Analyze this ${type} content and provide improvement suggestions:

        Content: "${content}"

        Please respond with JSON containing:
        - seoScore: 0-100 SEO score
        - readabilityScore: 0-100 readability score
        - suggestions: Array of specific improvement suggestions
        - keywords: Suggested keywords to add
        - tone: Detected tone
        - recommendedChanges: Specific text changes with explanations`;

        const response = await aiService['generateContent'](
          prompt,
          'You are an expert content analyst for beauty and fitness content. Provide actionable feedback.',
          0.3,
          1500
        );

        return JSON.parse(response);
      } finally {
        setIsAnalyzing(false);
      }
    },
  });

  return {
    analyzeContent: analyzeMutation.mutateAsync,
    isAnalyzing: isAnalyzing || analyzeMutation.isPending,
    error: analyzeMutation.error,
    data: analyzeMutation.data,
    reset: analyzeMutation.reset,
  };
}

// Batch content generation hook
export function useAIBatchGeneration() {
  const [progress, setProgress] = useState(0);
  const [currentTask, setCurrentTask] = useState<string>('');

  const batchMutation = useMutation({
    mutationFn: async (tasks: Array<{
      type: 'blog' | 'service' | 'translation';
      request: any;
      id: string;
    }>) => {
      if (!aiService || !isAIFeatureEnabled('CONTENT_GENERATION')) {
        throw new Error('AI content generation is not available');
      }

      const results = [];

      for (let i = 0; i < tasks.length; i++) {
        const task = tasks[i];
        setProgress((i / tasks.length) * 100);
        setCurrentTask(`Processing ${task.type} ${task.id}`);

        try {
          let result;
          switch (task.type) {
            case 'blog':
              result = await aiService.generateBlogPost(task.request);
              break;
            case 'service':
              result = await aiService.generateServiceDescription(task.request);
              break;
            case 'translation':
              result = await aiService.translateText(task.request);
              break;
            default:
              throw new Error(`Unknown task type: ${task.type}`);
          }

          results.push({ id: task.id, success: true, data: result });
        } catch (error) {
          results.push({ id: task.id, success: false, error: error.message });
        }

        // Small delay between requests to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      setProgress(100);
      setCurrentTask('Complete');

      return results;
    },
  });

  const reset = useCallback(() => {
    setProgress(0);
    setCurrentTask('');
    batchMutation.reset();
  }, [batchMutation]);

  return {
    generateBatch: batchMutation.mutateAsync,
    isGenerating: batchMutation.isPending,
    progress,
    currentTask,
    results: batchMutation.data,
    error: batchMutation.error,
    reset,
  };
}