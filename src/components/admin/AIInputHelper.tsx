import { useState } from 'react';
import { Sparkles, Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import { logger } from '@/lib/logger';

interface AIInputHelperProps {
  value: string;
  fieldType: 'slug' | 'title' | 'description' | 'features' | 'notes' | 'address' | 'category' | 'faq_question' | 'faq_answer' | 'blog_content';
  onFormatted: (formatted: string) => void;
  className?: string;
  size?: 'sm' | 'default' | 'icon';
}

export const AIInputHelper = ({ value, fieldType, onFormatted, className, size = 'icon' }: AIInputHelperProps) => {
  const [formatting, setFormatting] = useState(false);
  const { toast } = useToast();

  const handleFormat = async () => {
    if (!value || value.trim().length === 0) {
      toast({
        title: 'No content',
        description: 'Please enter some text first',
        variant: 'destructive',
      });
      return;
    }

    setFormatting(true);
    try {
      const { data, error } = await supabase.functions.invoke('ai-format-input', {
        body: { text: value, fieldType }
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
            description: 'AI usage limit reached. Please add credits.',
            variant: 'destructive',
          });
        } else {
          throw error;
        }
        return;
      }

      if (data?.formatted) {
        onFormatted(data.formatted);
        toast({
          title: 'Formatted',
          description: 'Content has been auto-formatted with AI',
        });
      }
    } catch (error: any) {
      logger.error('Format error:', error);
      toast({
        title: 'Format failed',
        description: error.message || 'Failed to format content',
        variant: 'destructive',
      });
    } finally {
      setFormatting(false);
    }
  };

  if (size === 'icon') {
    return (
      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={handleFormat}
        disabled={formatting || !value}
        className={cn(
          'h-8 w-8 text-champagne/70 hover:text-champagne hover:bg-champagne/10',
          formatting && 'animate-pulse',
          className
        )}
        title="Auto-format with AI"
      >
        {formatting ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Sparkles className="h-4 w-4" />
        )}
      </Button>
    );
  }

  return (
    <Button
      type="button"
      variant="outline"
      size={size}
      onClick={handleFormat}
      disabled={formatting || !value}
      className={cn(
        'gap-2 border-champagne/30 text-champagne hover:bg-champagne/10',
        className
      )}
    >
      {formatting ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          Formatting...
        </>
      ) : (
        <>
          <Sparkles className="h-4 w-4" />
          AI Format
        </>
      )}
    </Button>
  );
};
