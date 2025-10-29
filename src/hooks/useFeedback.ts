import { useState, useEffect, useCallback } from 'react';

import { supabase } from '@/integrations/supabase/client';
import {
  Database,
  TablesInsert,
  TablesUpdate,
  Enums
} from '@/integrations/supabase/types';

import { useAuth } from './useAuth';

type FeedbackEntry = Database['public']['Tables']['feedback_entries']['Row'];
type FeedbackInsert = TablesInsert<'feedback_entries'>;
type FeedbackUpdate = TablesUpdate<'feedback_entries'>;
type FeedbackResponse = Database['public']['Tables']['feedback_responses']['Row'];
type NPSSurvey = Database['public']['Tables']['nps_surveys']['Row'];
type FeedbackAnalytics = Database['public']['Tables']['feedback_analytics']['Row'];

interface UseFeedbackOptions {
  bookingId?: string;
  serviceId?: string;
  feedbackType?: Enums['feedback_type'];
  autoLoad?: boolean;
}

interface UseFeedbackReturn {
  feedback: FeedbackEntry[];
  loading: boolean;
  error: string | null;
  submitting: boolean;
  submitFeedback: (data: FeedbackInsert) => Promise<FeedbackEntry | null>;
  updateFeedback: (id: string, data: FeedbackUpdate) => Promise<boolean>;
  deleteFeedback: (id: string) => Promise<boolean>;
  respondToFeedback: (feedbackId: string, content: string, isInternal?: boolean) => Promise<boolean>;
  loadFeedback: () => Promise<void>;
  refresh: () => Promise<void>;
}

export const useFeedback = (options: UseFeedbackOptions = {}): UseFeedbackReturn => {
  const { user } = useAuth();
  const [feedback, setFeedback] = useState<FeedbackEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const { bookingId, serviceId, feedbackType, autoLoad = true } = options;

  const loadFeedback = useCallback(async () => {
    if (!user && !bookingId && !serviceId) return;

    setLoading(true);
    setError(null);

    try {
      let query = supabase
        .from('feedback_entries')
        .select(`
          *,
          profiles:assigned_to(full_name, email, avatar_url),
          services:service_id(title, service_type),
          bookings:booking_id(id, booking_date, client_name)
        `)
        .order('created_at', { ascending: false });

      // Apply filters
      if (user) {
        query = query.eq('user_id', user.id);
      }
      if (bookingId) {
        query = query.eq('booking_id', bookingId);
      }
      if (serviceId) {
        query = query.eq('service_id', serviceId);
      }
      if (feedbackType) {
        query = query.eq('feedback_type', feedbackType);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) {
        throw fetchError;
      }

      setFeedback(data || []);
    } catch (err: any) {
      console.error('Error loading feedback:', err);
      setError(err.message || 'Failed to load feedback');
      setFeedback([]);
    } finally {
      setLoading(false);
    }
  }, [user, bookingId, serviceId, feedbackType]);

  const submitFeedback = useCallback(async (data: FeedbackInsert): Promise<FeedbackEntry | null> => {
    setSubmitting(true);
    setError(null);

    try {
      // Add metadata
      const feedbackData: FeedbackInsert = {
        ...data,
        user_id: user?.id || null,
        channel: 'web',
        metadata: {
          ...data.metadata,
          user_agent: navigator.userAgent,
          timestamp: new Date().toISOString(),
        },
      };

      const { data: result, error: submitError } = await supabase
        .from('feedback_entries')
        .insert(feedbackData)
        .select()
        .single();

      if (submitError) {
        throw submitError;
      }

      // Refresh the feedback list
      await loadFeedback();

      return result;
    } catch (err: any) {
      console.error('Error submitting feedback:', err);
      setError(err.message || 'Failed to submit feedback');
      return null;
    } finally {
      setSubmitting(false);
    }
  }, [user, loadFeedback]);

  const updateFeedback = useCallback(async (id: string, data: FeedbackUpdate): Promise<boolean> => {
    setSubmitting(true);
    setError(null);

    try {
      const { error: updateError } = await supabase
        .from('feedback_entries')
        .update(data)
        .eq('id', id);

      if (updateError) {
        throw updateError;
      }

      await loadFeedback();
      return true;
    } catch (err: any) {
      console.error('Error updating feedback:', err);
      setError(err.message || 'Failed to update feedback');
      return false;
    } finally {
      setSubmitting(false);
    }
  }, [loadFeedback]);

  const deleteFeedback = useCallback(async (id: string): Promise<boolean> => {
    setSubmitting(true);
    setError(null);

    try {
      const { error: deleteError } = await supabase
        .from('feedback_entries')
        .delete()
        .eq('id', id);

      if (deleteError) {
        throw deleteError;
      }

      await loadFeedback();
      return true;
    } catch (err: any) {
      console.error('Error deleting feedback:', err);
      setError(err.message || 'Failed to delete feedback');
      return false;
    } finally {
      setSubmitting(false);
    }
  }, [loadFeedback]);

  const respondToFeedback = useCallback(async (
    feedbackId: string,
    content: string,
    isInternal: boolean = false
  ): Promise<boolean> => {
    setSubmitting(true);
    setError(null);

    try {
      const response = {
        feedback_id: feedbackId,
        responder_id: user?.id || null,
        content,
        response_type: 'comment',
        is_internal: isInternal,
        is_published: !isInternal,
      };

      const { error: responseError } = await supabase
        .from('feedback_responses')
        .insert(response);

      if (responseError) {
        throw responseError;
      }

      // Update the feedback entry to mark as responded
      await updateFeedback(feedbackId, { responded_at: new Date().toISOString() });

      return true;
    } catch (err: any) {
      console.error('Error responding to feedback:', err);
      setError(err.message || 'Failed to respond to feedback');
      return false;
    } finally {
      setSubmitting(false);
    }
  }, [user, updateFeedback]);

  const refresh = useCallback(async () => {
    await loadFeedback();
  }, [loadFeedback]);

  useEffect(() => {
    if (autoLoad) {
      loadFeedback();
    }
  }, [autoLoad, loadFeedback]);

  // Set up real-time subscription
  useEffect(() => {
    const channel = supabase
      .channel('feedback_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'feedback_entries',
          filter: user ? `user_id=eq.${user.id}` : undefined,
        },
        () => {
          loadFeedback();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, loadFeedback]);

  return {
    feedback,
    loading,
    error,
    submitting,
    submitFeedback,
    updateFeedback,
    deleteFeedback,
    respondToFeedback,
    loadFeedback,
    refresh,
  };
};

// NPS Survey hook
export const useNPSSurvey = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submitNPSSurvey = useCallback(async (
    score: number,
    reason?: string,
    surveyType: string = 'post_booking',
    triggerEvent?: string
  ): Promise<NPSSurvey | null> => {
    if (!user) {
      setError('User not authenticated');
      return null;
    }

    setLoading(true);
    setError(null);

    try {
      const surveyData = {
        user_id: user.id,
        score,
        reason,
        survey_type: surveyType,
        trigger_event: triggerEvent,
        responded_at: new Date().toISOString(),
      };

      const { data: result, error: submitError } = await supabase
        .from('nps_surveys')
        .insert(surveyData)
        .select()
        .single();

      if (submitError) {
        throw submitError;
      }

      return result;
    } catch (err: any) {
      console.error('Error submitting NPS survey:', err);
      setError(err.message || 'Failed to submit NPS survey');
      return null;
    } finally {
      setLoading(false);
    }
  }, [user]);

  const getNPSScore = useCallback(async (timeframe: 'week' | 'month' | 'quarter' = 'month') => {
    setLoading(true);
    setError(null);

    try {
      const now = new Date();
      let startDate: Date;

      switch (timeframe) {
        case 'week':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case 'month':
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        case 'quarter':
          startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
          break;
      }

      const { data, error: fetchError } = await supabase
        .from('nps_surveys')
        .select('score')
        .gte('responded_at', startDate.toISOString());

      if (fetchError) {
        throw fetchError;
      }

      if (!data || data.length === 0) {
        return null;
      }

      const promoters = data.filter(s => s.score >= 9).length;
      const passives = data.filter(s => s.score >= 7 && s.score <= 8).length;
      const detractors = data.filter(s => s.score <= 6).length;
      const total = data.length;

      const npsScore = ((promoters - detractors) / total) * 100;

      return {
        score: Math.round(npsScore),
        promoters: promoters / total * 100,
        passives: passives / total * 100,
        detractors: detractors / total * 100,
        totalResponses: total,
      };
    } catch (err: any) {
      console.error('Error calculating NPS score:', err);
      setError(err.message || 'Failed to calculate NPS score');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    submitNPSSurvey,
    getNPSScore,
    loading,
    error,
  };
};

// Feedback Analytics hook
export const useFeedbackAnalytics = (timeframe: 'week' | 'month' | 'quarter' = 'month') => {
  const [analytics, setAnalytics] = useState<FeedbackAnalytics[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadAnalytics = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const now = new Date();
      let startDate: Date;

      switch (timeframe) {
        case 'week':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case 'month':
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        case 'quarter':
          startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
          break;
      }

      const { data, error: fetchError } = await supabase
        .from('feedback_analytics')
        .select('*')
        .gte('date', startDate.toISOString().split('T')[0])
        .order('date', { ascending: false });

      if (fetchError) {
        throw fetchError;
      }

      setAnalytics(data || []);
    } catch (err: any) {
      console.error('Error loading feedback analytics:', err);
      setError(err.message || 'Failed to load feedback analytics');
      setAnalytics([]);
    } finally {
      setLoading(false);
    }
  }, [timeframe]);

  const getSummaryStats = useCallback(() => {
    if (analytics.length === 0) return null;

    const totalEntries = analytics.reduce((sum, a) => sum + (a.total_entries || 0), 0);
    const avgRating = analytics.reduce((sum, a) => sum + (a.average_rating || 0), 0) / analytics.length;
    const avgResponseTime = analytics.reduce((sum, a) => sum + (a.response_time_hours || 0), 0) / analytics.length;
    const avgResolutionRate = analytics.reduce((sum, a) => sum + (a.resolution_rate || 0), 0) / analytics.length;

    return {
      totalEntries,
      averageRating: avgRating,
      averageResponseTime: avgResponseTime,
      averageResolutionRate: avgResolutionRate,
    };
  }, [analytics]);

  useEffect(() => {
    loadAnalytics();
  }, [loadAnalytics]);

  return {
    analytics,
    loading,
    error,
    refresh: loadAnalytics,
    getSummaryStats,
  };
};

// Feedback Templates hook
export const useFeedbackTemplates = () => {
  const [templates, setTemplates] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadTemplates = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase
        .from('feedback_templates')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (fetchError) {
        throw fetchError;
      }

      setTemplates(data || []);
    } catch (err: any) {
      console.error('Error loading feedback templates:', err);
      setError(err.message || 'Failed to load feedback templates');
      setTemplates([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const getTemplate = useCallback(async (feedbackType: Enums['feedback_type']) => {
    try {
      const { data, error } = await supabase
        .from('feedback_templates')
        .select('*')
        .eq('feedback_type', feedbackType)
        .eq('is_active', true)
        .single();

      if (error) {
        return null;
      }

      return data;
    } catch (err) {
      return null;
    }
  }, []);

  useEffect(() => {
    loadTemplates();
  }, [loadTemplates]);

  return {
    templates,
    loading,
    error,
    refresh: loadTemplates,
    getTemplate,
  };
};