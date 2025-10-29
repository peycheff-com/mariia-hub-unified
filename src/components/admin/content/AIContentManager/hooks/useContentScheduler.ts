import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { supabase } from '@/integrations/supabase/client';

import { ContentItem, PromotionSettings } from '../types';

export const useContentScheduler = () => {
  const queryClient = useQueryClient();

  const scheduleContentMutation = useMutation({
    mutationFn: async (params: {
      content: ContentItem;
      publishDate: Date;
      channels?: string[];
      promotionSettings?: Partial<PromotionSettings>;
    }) => {
      // Update content status
      await supabase
        .from('content_management')
        .update({
          status: 'scheduled',
          scheduledAt: params.publishDate.toISOString(),
          updatedAt: new Date().toISOString(),
        })
        .eq('id', params.content.id);

      // Add to calendar
      const promotionSettings: PromotionSettings = {
        email: params.promotionSettings?.email ?? true,
        social: params.promotionSettings?.social ?? true,
        push: params.promotionSettings?.push ?? false,
        sms: params.promotionSettings?.sms ?? false,
        schedule: params.promotionSettings?.schedule ?? [],
      };

      await supabase
        .from('content_calendar')
        .insert({
          contentId: params.content.id,
          publishDate: params.publishDate.toISOString(),
          status: 'scheduled',
          channels: params.channels || ['website', 'email'],
          promotionSettings,
        });

      return { contentId: params.content.id, publishDate: params.publishDate };
    },
    onSuccess: () => {
      toast.success('Content scheduled successfully');
      queryClient.invalidateQueries({ queryKey: ['content-management', 'content-calendar'] });
    },
    onError: (error) => {
      console.error('Schedule failed:', error);
      toast.error('Failed to schedule content');
    },
  });

  const rescheduleContentMutation = useMutation({
    mutationFn: async (params: {
      contentId: string;
      newPublishDate: Date;
    }) => {
      // Update content scheduled date
      await supabase
        .from('content_management')
        .update({
          scheduledAt: params.newPublishDate.toISOString(),
          updatedAt: new Date().toISOString(),
        })
        .eq('id', params.contentId);

      // Update calendar
      await supabase
        .from('content_calendar')
        .update({
          publishDate: params.newPublishDate.toISOString(),
        })
        .eq('contentId', params.contentId);

      return { contentId: params.contentId, newPublishDate: params.newPublishDate };
    },
    onSuccess: () => {
      toast.success('Content rescheduled successfully');
      queryClient.invalidateQueries({ queryKey: ['content-management', 'content-calendar'] });
    },
    onError: (error) => {
      console.error('Reschedule failed:', error);
      toast.error('Failed to reschedule content');
    },
  });

  const unscheduleContentMutation = useMutation({
    mutationFn: async (contentId: string) => {
      // Update content status back to draft
      await supabase
        .from('content_management')
        .update({
          status: 'draft',
          scheduledAt: null,
          updatedAt: new Date().toISOString(),
        })
        .eq('id', contentId);

      // Remove from calendar
      await supabase
        .from('content_calendar')
        .delete()
        .eq('contentId', contentId);

      return { contentId };
    },
    onSuccess: () => {
      toast.success('Content unscheduled successfully');
      queryClient.invalidateQueries({ queryKey: ['content-management', 'content-calendar'] });
    },
    onError: (error) => {
      console.error('Unschedule failed:', error);
      toast.error('Failed to unschedule content');
    },
  });

  return {
    scheduleContent: scheduleContentMutation.mutate,
    isScheduling: scheduleContentMutation.isPending,
    rescheduleContent: rescheduleContentMutation.mutate,
    isRescheduling: rescheduleContentMutation.isPending,
    unscheduleContent: unscheduleContentMutation.mutate,
    isUnscheduling: unscheduleContentMutation.isPending,
  };
};