import { useQuery } from '@tanstack/react-query';

import { supabase } from '@/integrations/supabase/client';

import { ContentAnalytics } from '../types';

export const useContentAnalytics = (contentId?: string) => {
  return useQuery({
    queryKey: ['content-analytics', contentId],
    queryFn: async () => {
      if (!contentId) return null;

      const { data, error } = await supabase
        .from('content_analytics')
        .select('*')
        .eq('content_id', contentId)
        .single();

      if (error && error.code !== 'PGRST116') { // Not found error
        throw error;
      }

      return data as ContentAnalytics | null;
    },
    enabled: !!contentId,
  });
};

export const useOverallAnalytics = () => {
  return useQuery({
    queryKey: ['content-analytics-overall'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('content_analytics')
        .select('*');

      if (error) throw error;

      // Calculate overall metrics
      const analytics = data as ContentAnalytics[];
      const totalViews = analytics.reduce((sum, item) => sum + item.views, 0);
      const totalEngagement = analytics.reduce((sum, item) => sum + item.engagement, 0);
      const avgEngagement = analytics.length > 0 ? totalEngagement / analytics.length : 0;
      const totalConversions = analytics.reduce((sum, item) => sum + (item.conversionRate || 0), 0);

      return {
        totalViews,
        avgEngagement,
        totalConversions,
        totalContent: analytics.length,
        topPerforming: analytics
          .sort((a, b) => b.views - a.views)
          .slice(0, 10),
      };
    },
  });
};