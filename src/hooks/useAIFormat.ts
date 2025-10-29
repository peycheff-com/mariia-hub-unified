import { useState } from 'react';

import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { logger } from '@/lib/logger';

type FieldType = 'slug' | 'title' | 'description' | 'features' | 'notes' | 'address' | 'category' | 'faq_question' | 'faq_answer' | 'blog_content';

export const useAIFormat = () => {
  const [formatting, setFormatting] = useState(false);
  const { toast } = useToast();

  const formatText = async (text: string, fieldType: FieldType): Promise<string | null> => {
    if (!text || text.trim().length === 0) {
      return null;
    }

    setFormatting(true);
    try {
      const { data, error } = await supabase.functions.invoke('ai-format-input', {
        body: { text, fieldType }
      });

      if (error) {
        if (error.message?.includes('429')) {
          toast({
            title: 'Rate limit',
            description: 'Too many requests. Please wait a moment.',
            variant: 'destructive',
          });
        } else if (error.message?.includes('402')) {
          toast({
            title: 'Usage limit',
            description: 'AI usage limit reached.',
            variant: 'destructive',
          });
        } else {
          throw error;
        }
        return null;
      }

      return data?.formatted || text;
    } catch (error: any) {
      logger.error('Format error:', error);
      toast({
        title: 'Format failed',
        description: error.message || 'Failed to format content',
        variant: 'destructive',
      });
      return null;
    } finally {
      setFormatting(false);
    }
  };

  return { formatText, formatting };
};
