// React hooks for communication functionality

import { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { communicationService } from '../communication-service';
import {
  SendMessageRequest,
  CreateCampaignRequest,
  MessageTemplate,
  ClientCommunicationPreferences,
  CommunicationDashboard,
  NotificationPreferences,
  CommunicationChannel,
  MessageStatus
} from '@/types/communication';
import { supabase } from '@/integrations/supabase/client';

// Hook for sending messages
export function useSendMessage() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const sendMessage = useCallback(async (request: SendMessageRequest) => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await communicationService.sendMessage(request);

      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['messages'] });
      queryClient.invalidateQueries({ queryKey: ['communication-dashboard'] });

      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to send message';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [queryClient]);

  return { sendMessage, isLoading, error };
}

// Hook for managing message templates
export function useMessageTemplates(filters?: {
  channel?: CommunicationChannel;
  category?: string;
  language?: string;
}) {
  const {
    data: templates = [],
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['message-templates', filters],
    queryFn: () => communicationService.getTemplates(
      filters?.channel,
      filters?.category,
      filters?.language
    ),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const createTemplateMutation = useMutation({
    mutationFn: (template: Omit<MessageTemplate, 'id' | 'usage_count' | 'created_at' | 'updated_at'>) =>
      communicationService.createTemplate(template),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['message-templates'] });
    }
  });

  return {
    templates,
    isLoading,
    error,
    refetch,
    createTemplate: createTemplateMutation.mutateAsync,
    isCreatingTemplate: createTemplateMutation.isPending
  };
}

// Hook for managing client communication preferences
export function useClientPreferences(userId: string) {
  const {
    data: preferences = [],
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['client-preferences', userId],
    queryFn: () => communicationService.getClientPreferences(userId),
    enabled: !!userId,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });

  const updatePreferencesMutation = useMutation({
    mutationFn: (prefs: Partial<ClientCommunicationPreferences>[]) =>
      communicationService.updateClientPreferences(userId, prefs),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['client-preferences', userId] });
    }
  });

  const getPreferenceForChannel = useCallback((channel: CommunicationChannel) => {
    return preferences.find(p => p.channel === channel);
  }, [preferences]);

  const isChannelEnabled = useCallback((channel: CommunicationChannel) => {
    const pref = getPreferenceForChannel(channel);
    return pref?.is_enabled ?? true; // Default to enabled if no preference set
  }, [getPreferenceForChannel]);

  return {
    preferences,
    isLoading,
    error,
    refetch,
    updatePreferences: updatePreferencesMutation.mutateAsync,
    isUpdatingPreferences: updatePreferencesMutation.isPending,
    getPreferenceForChannel,
    isChannelEnabled
  };
}

// Hook for communication dashboard
export function useCommunicationDashboard(userId?: string) {
  const {
    data: dashboard,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['communication-dashboard', userId],
    queryFn: () => communicationService.getDashboardData(userId),
    refetchInterval: 5 * 60 * 1000, // Refresh every 5 minutes
    staleTime: 2 * 60 * 1000, // 2 minutes
  });

  return {
    dashboard,
    isLoading,
    error,
    refetch
  };
}

// Hook for campaign management
export function useCampaigns() {
  const queryClient = useQueryClient();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createCampaign = useCallback(async (request: CreateCampaignRequest) => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await communicationService.createCampaign(request);

      // Invalidate campaigns query
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });

      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create campaign';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [queryClient]);

  return {
    createCampaign,
    isLoading,
    error
  };
}

// Hook for real-time message updates
export function useRealtimeMessages(threadId?: string) {
  const [messages, setMessages] = useState<any[]>([]);

  useEffect(() => {
    if (!threadId) return;

    // Subscribe to real-time updates for the thread
    const channel = supabase
      .channel(`messages:${threadId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `thread_id=eq.${threadId}`
        },
        (payload) => {
          setMessages(prev => [...prev, payload.new]);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'messages',
          filter: `thread_id=eq.${threadId}`
        },
        (payload) => {
          setMessages(prev =>
            prev.map(msg => msg.id === payload.new.id ? payload.new : msg)
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [threadId]);

  // Fetch initial messages
  useEffect(() => {
    if (!threadId) return;

    const fetchMessages = async () => {
      try {
        const { data, error } = await supabase
          .from('messages')
          .select('*')
          .eq('thread_id', threadId)
          .order('created_at', { ascending: true });

        if (error) throw error;
        setMessages(data || []);
      } catch (error) {
        console.error('Failed to fetch messages:', error);
      }
    };

    fetchMessages();
  }, [threadId]);

  return { messages };
}

// Hook for notification settings
export function useNotificationSettings(userId: string) {
  const [settings, setSettings] = useState<NotificationPreferences>({
    email: {
      enabled: true,
      bookingConfirmations: true,
      bookingReminders: true,
      promotions: false,
      newsletters: false
    },
    sms: {
      enabled: true,
      bookingReminders: true,
      urgentUpdates: true,
      promotions: false
    },
    whatsapp: {
      enabled: false,
      bookingUpdates: false,
      customerSupport: false
    },
    push: {
      enabled: true,
      bookingUpdates: true,
      promotions: false
    },
    frequency: {
      maxMessagesPerDay: 10,
      quietHoursStart: '22:00',
      quietHoursEnd: '08:00'
    },
    language: 'en'
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load settings from preferences
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const preferences = await communicationService.getClientPreferences(userId);

        const newSettings = { ...settings };

        preferences.forEach(pref => {
          switch (pref.channel) {
            case 'email':
              newSettings.email.enabled = pref.is_enabled;
              break;
            case 'sms':
              newSettings.sms.enabled = pref.is_enabled;
              break;
            case 'whatsapp':
              newSettings.whatsapp.enabled = pref.is_enabled;
              break;
            case 'push':
              newSettings.push.enabled = pref.is_enabled;
              break;
          }
        });

        setSettings(newSettings);
      } catch (error) {
        console.error('Failed to load notification settings:', error);
      }
    };

    loadSettings();
  }, [userId]);

  const updateSettings = useCallback(async (newSettings: Partial<NotificationPreferences>) => {
    setIsLoading(true);
    setError(null);

    try {
      const updatedSettings = { ...settings, ...newSettings };
      setSettings(updatedSettings);

      // Convert to client preferences format
      const preferences: Partial<ClientCommunicationPreferences>[] = [
        {
          channel: 'email',
          is_enabled: updatedSettings.email.enabled,
          preferred_time: '09:00:00',
          timezone: 'Europe/Warsaw',
          frequency_limit_hours: 24,
          do_not_disturb_start: updatedSettings.frequency.quietHoursStart,
          do_not_disturb_end: updatedSettings.frequency.quietHoursEnd,
          language: updatedSettings.language
        },
        {
          channel: 'sms',
          is_enabled: updatedSettings.sms.enabled,
          preferred_time: '09:00:00',
          timezone: 'Europe/Warsaw',
          frequency_limit_hours: 24,
          do_not_disturb_start: updatedSettings.frequency.quietHoursStart,
          do_not_disturb_end: updatedSettings.frequency.quietHoursEnd,
          language: updatedSettings.language
        },
        {
          channel: 'whatsapp',
          is_enabled: updatedSettings.whatsapp.enabled,
          preferred_time: '09:00:00',
          timezone: 'Europe/Warsaw',
          frequency_limit_hours: 24,
          do_not_disturb_start: updatedSettings.frequency.quietHoursStart,
          do_not_disturb_end: updatedSettings.frequency.quietHoursEnd,
          language: updatedSettings.language
        },
        {
          channel: 'push',
          is_enabled: updatedSettings.push.enabled,
          preferred_time: '09:00:00',
          timezone: 'Europe/Warsaw',
          frequency_limit_hours: 24,
          do_not_disturb_start: updatedSettings.frequency.quietHoursStart,
          do_not_disturb_end: updatedSettings.frequency.quietHoursEnd,
          language: updatedSettings.language
        }
      ];

      await communicationService.updateClientPreferences(userId, preferences);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update settings';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [settings, userId]);

  return {
    settings,
    updateSettings,
    isLoading,
    error
  };
}

// Hook for sending booking communications
export function useBookingCommunications() {
  const sendMessage = useSendMessage();

  const sendBookingConfirmation = useCallback(async (
    recipientId: string,
    bookingData: {
      clientName: string;
      serviceTitle: string;
      bookingDate: string;
      bookingTime: string;
      location: string;
      duration: number;
      price: number;
      currency: string;
    },
    language: 'en' | 'pl' = 'en'
  ) => {
    const category = language === 'pl' ? 'booking_confirmation_pl' : 'booking_confirmation';

    return sendMessage.mutateAsync({
      recipientId,
      channel: 'email',
      messageType: 'template',
      templateId: category, // This would be looked up by category
      variables: {
        client_name: bookingData.clientName,
        service_title: bookingData.serviceTitle,
        booking_date: bookingData.bookingDate,
        booking_time: bookingData.bookingTime,
        location: bookingData.location,
        duration: bookingData.duration,
        price: bookingData.price,
        currency: bookingData.currency
      },
      priority: 'high'
    });
  }, [sendMessage]);

  const sendBookingReminder = useCallback(async (
    recipientId: string,
    bookingData: {
      clientName: string;
      serviceTitle: string;
      bookingTime: string;
      location: string;
    },
    hoursBefore: number = 24,
    language: 'en' | 'pl' = 'en'
  ) => {
    const category = language === 'pl' ? 'booking_reminder_pl' : 'booking_reminder';

    return sendMessage.mutateAsync({
      recipientId,
      channel: 'sms',
      messageType: 'template',
      templateId: category,
      variables: {
        client_name: bookingData.clientName,
        service_title: bookingData.serviceTitle,
        booking_time: bookingData.bookingTime,
        location: bookingData.location
      },
      priority: 'high',
      scheduledFor: new Date(Date.now() + hoursBefore * 60 * 60 * 1000).toISOString()
    });
  }, [sendMessage]);

  const sendCancellationNotice = useCallback(async (
    recipientId: string,
    bookingData: {
      clientName: string;
      serviceTitle: string;
    },
    language: 'en' | 'pl' = 'en'
  ) => {
    return sendMessage.mutateAsync({
      recipientId,
      channel: 'email',
      messageType: 'template',
      templateId: language === 'pl' ? 'booking_cancellation_pl' : 'booking_cancellation',
      variables: {
        client_name: bookingData.clientName,
        service_title: bookingData.serviceTitle
      },
      priority: 'high'
    });
  }, [sendMessage]);

  const sendFeedbackRequest = useCallback(async (
    recipientId: string,
    bookingData: {
      clientName: string;
      serviceTitle: string;
      bookingDate: string;
    },
    language: 'en' | 'pl' = 'en'
  ) => {
    const scheduledFor = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours after booking

    return sendMessage.mutateAsync({
      recipientId,
      channel: 'email',
      messageType: 'template',
      templateId: language === 'pl' ? 'feedback_request_pl' : 'feedback_request',
      variables: {
        client_name: bookingData.clientName,
        service_title: bookingData.serviceTitle,
        booking_date: bookingData.bookingDate
      },
      priority: 'normal',
      scheduledFor: scheduledFor.toISOString()
    });
  }, [sendMessage]);

  return {
    sendBookingConfirmation,
    sendBookingReminder,
    sendCancellationNotice,
    sendFeedbackRequest,
    isLoading: sendMessage.isLoading,
    error: sendMessage.error
  };
}

// Hook for communication analytics
export function useCommunicationAnalytics(timeframe: 'week' | 'month' | 'quarter' = 'month') {
  const [analytics, setAnalytics] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Calculate date range based on timeframe
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

        // Fetch analytics data
        const { data: messages } = await supabase
          .from('messages')
          .select('channel, status, created_at')
          .gte('created_at', startDate.toISOString())
          .order('created_at', { ascending: false });

        // Calculate metrics
        const channelMetrics: any = {};
        const statusCounts: any = {};

        messages?.forEach(message => {
          // Count by channel
          if (!channelMetrics[message.channel]) {
            channelMetrics[message.channel] = { sent: 0, delivered: 0, failed: 0 };
          }

          switch (message.status) {
            case 'sent':
              channelMetrics[message.channel].sent++;
              break;
            case 'delivered':
              channelMetrics[message.channel].delivered++;
              break;
            case 'failed':
              channelMetrics[message.channel].failed++;
              break;
          }

          // Count by status
          statusCounts[message.status] = (statusCounts[message.status] || 0) + 1;
        });

        setAnalytics({
          timeframe,
          totalMessages: messages?.length || 0,
          channelMetrics,
          statusCounts,
          dateRange: {
            start: startDate.toISOString(),
            end: now.toISOString()
          }
        });

      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to fetch analytics';
        setError(errorMessage);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAnalytics();
  }, [timeframe]);

  return { analytics, isLoading, error };
}