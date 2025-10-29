import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { getAIService } from '@/integrations/ai/service';
import { supabase } from '@/integrations/supabase/client';

import { ContentItem, ContentTranslation } from '../types';

export const useContentTranslation = () => {
  const queryClient = useQueryClient();

  const translateContentMutation = useMutation({
    mutationFn: async (params: {
      content: ContentItem;
      targetLang: string;
      sourceLang?: string;
    }) => {
      const aiService = getAIService();
      const sourceLang = params.sourceLang || params.content.language;
      const sourceContent = params.content.content[sourceLang] || params.content.content.en;

      const translation = await aiService.translateText({
        text: sourceContent,
        targetLanguage: params.targetLang as 'en' | 'pl',
        sourceLanguage: sourceLang as 'en' | 'pl',
        maintainTone: true,
      });

      return {
        translatedText: translation.translatedText,
        sourceTitle: params.content.title[sourceLang] || params.content.title.en,
      };
    },
    onSuccess: async (data, variables) => {
      const updatedTranslations: Record<string, ContentTranslation> = {
        ...variables.content.translations,
        [variables.targetLang]: {
          title: data.sourceTitle,
          content: data.translatedText,
          status: 'draft' as const,
        },
      };

      await supabase
        .from('content_management')
        .update({
          translations: updatedTranslations,
          updatedAt: new Date().toISOString(),
        })
        .eq('id', variables.content.id);

      toast.success('Content translated successfully');
      queryClient.invalidateQueries({ queryKey: ['content-management'] });
    },
    onError: (error) => {
      console.error('Translation failed:', error);
      toast.error('Failed to translate content');
    },
  });

  const autoTranslateMutation = useMutation({
    mutationFn: async (params: {
      content: ContentItem;
      targetLanguages: string[];
      sourceLang?: string;
    }) => {
      const results = [];
      const aiService = getAIService();
      const sourceLang = params.sourceLang || params.content.language;

      for (const targetLang of params.targetLanguages) {
        if (targetLang !== sourceLang) {
          try {
            const sourceContent = params.content.content[sourceLang] || params.content.content.en;
            const translation = await aiService.translateText({
              text: sourceContent,
              targetLanguage: targetLang as 'en' | 'pl',
              sourceLanguage: sourceLang as 'en' | 'pl',
              maintainTone: true,
            });

            results.push({
              language: targetLang,
              title: params.content.title[sourceLang] || params.content.title.en,
              content: translation.translatedText,
              status: 'draft' as const,
            });
          } catch (error) {
            console.error(`Translation to ${targetLang} failed:`, error);
          }
        }
      }

      return results;
    },
    onSuccess: async (results, variables) => {
      const updatedTranslations = { ...variables.content.translations };

      results.forEach((translation) => {
        updatedTranslations[translation.language] = {
          title: translation.title,
          content: translation.content,
          status: translation.status,
        };
      });

      await supabase
        .from('content_management')
        .update({
          translations: updatedTranslations,
          updatedAt: new Date().toISOString(),
        })
        .eq('id', variables.content.id);

      toast.success(`Content translated to ${results.length} languages`);
      queryClient.invalidateQueries({ queryKey: ['content-management'] });
    },
    onError: (error) => {
      console.error('Auto-translation failed:', error);
      toast.error('Failed to auto-translate content');
    },
  });

  return {
    translateContent: translateContentMutation.mutate,
    isTranslating: translateContentMutation.isPending,
    autoTranslate: autoTranslateMutation.mutate,
    isAutoTranslating: autoTranslateMutation.isPending,
  };
};