import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import { smartSchedulingEngine, type ServicePattern, type BookingPattern } from '@/integrations/ai/scheduling';

import type { SchedulingInsightRequest, SchedulingInsightResponse } from '@/integrations/ai/service';

export function useSchedulingInsights() {
  const [isGenerating, setIsGenerating] = useState(false);
  const queryClient = useQueryClient();

  const generateMutation = useMutation({
    mutationFn: async (request: SchedulingInsightRequest): Promise<SchedulingInsightResponse> => {
      setIsGenerating(true);
      try {
        const response = await smartSchedulingEngine.generateSchedulingInsights(request);
        return response;
      } finally {
        setIsGenerating(false);
      }
    },
    onSuccess: (data, variables) => {
      // Cache the insights
      queryClient.setQueryData(
        ['scheduling-insights', variables.serviceType, variables.serviceDuration],
        data
      );
    },
  });

  const getInsights = useCallback((request: SchedulingInsightRequest) => {
    return generateMutation.mutateAsync(request);
  }, [generateMutation]);

  return {
    getInsights,
    isGenerating: isGenerating || generateMutation.isPending,
    error: generateMutation.error,
    data: generateMutation.data,
    reset: generateMutation.reset,
  };
}

export function useDemandPrediction() {
  const [isPredicting, setIsPredicting] = useState(false);
  const queryClient = useQueryClient();

  const predictMutation = useMutation({
    mutationFn: async ({
      serviceId,
      startDate,
      endDate,
    }: {
      serviceId: string;
      startDate: string;
      endDate: string;
    }) => {
      setIsPredicting(true);
      try {
        const predictions = await smartSchedulingEngine.predictDemand(serviceId, startDate, endDate);
        return predictions;
      } finally {
        setIsPredicting(false);
      }
    },
    onSuccess: (data, variables) => {
      // Cache predictions
      queryClient.setQueryData(
        ['demand-prediction', variables.serviceId, variables.startDate, variables.endDate],
        data
      );
    },
  });

  // Query cached predictions
  const getPredictions = useCallback((serviceId: string, startDate: string, endDate: string) => {
    return queryClient.fetchQuery({
      queryKey: ['demand-prediction', serviceId, startDate, endDate],
      queryFn: () => predictMutation.mutateAsync({ serviceId, startDate, endDate }),
    });
  }, [queryClient, predictMutation]);

  return {
    getPredictions,
    predictDemand: predictMutation.mutateAsync,
    isPredicting: isPredicting || predictMutation.isPending,
    error: predictMutation.error,
    data: predictMutation.data,
    reset: predictMutation.reset,
  };
}

export function useScheduleOptimization() {
  const [isOptimizing, setIsOptimizing] = useState(false);

  const optimizeMutation = useMutation({
    mutationFn: async ({
      serviceId,
      date,
      constraints,
    }: {
      serviceId: string;
      date: string;
      constraints: {
        workingHours: { start: string; end: string };
        breaks: { start: string; end: string }[];
        maxConcurrent: number;
        bufferTime: number;
      };
    }) => {
      setIsOptimizing(true);
      try {
        const optimized = await smartSchedulingEngine.optimizeSchedule(serviceId, date, constraints);
        return optimized;
      } finally {
        setIsOptimizing(false);
      }
    },
  });

  return {
    optimizeSchedule: optimizeMutation.mutateAsync,
    isOptimizing: isOptimizing || optimizeMutation.isPending,
    error: optimizeMutation.error,
    data: optimizeMutation.data,
    reset: optimizeMutation.reset,
  };
}

export function useSchedulingRecommendations() {
  const [isLoading, setIsLoading] = useState(false);
  const queryClient = useQueryClient();

  const recommendationsMutation = useMutation({
    mutationFn: async ({
      serviceIds,
      timeframe,
    }: {
      serviceIds: string[];
      timeframe?: 'week' | 'month' | 'quarter';
    }) => {
      setIsLoading(true);
      try {
        const recommendations = await smartSchedulingEngine.generateRecommendations(serviceIds, timeframe);
        return recommendations;
      } finally {
        setIsLoading(false);
      }
    },
    onSuccess: (data, variables) => {
      // Cache recommendations
      queryClient.setQueryData(
        ['scheduling-recommendations', variables.serviceIds.join(','), variables.timeframe],
        data
      );
    },
  });

  const getRecommendations = useCallback((
    serviceIds: string[],
    timeframe: 'week' | 'month' | 'quarter' = 'week'
  ) => {
    return recommendationsMutation.mutateAsync({ serviceIds, timeframe });
  }, [recommendationsMutation]);

  return {
    getRecommendations,
    isLoading: isLoading || recommendationsMutation.isPending,
    error: recommendationsMutation.error,
    data: recommendationsMutation.data,
    reset: recommendationsMutation.reset,
  };
}

export function useServicePattern(serviceId: string) {
  return useQuery({
    queryKey: ['service-pattern', serviceId],
    queryFn: () => smartSchedulingEngine.getServicePattern(serviceId),
    staleTime: 1000 * 60 * 30, // 30 minutes
  });
}

export function useBookingPattern(customerId: string) {
  return useQuery({
    queryKey: ['booking-pattern', customerId],
    queryFn: () => smartSchedulingEngine.getBookingPattern(customerId),
    staleTime: 1000 * 60 * 15, // 15 minutes
  });
}

// Hook for anomaly detection
export function useAnomalyDetection() {
  const [isDetecting, setIsDetecting] = useState(false);

  const detectMutation = useMutation({
    mutationFn: async ({
      serviceId,
      dateRange,
    }: {
      serviceId: string;
      dateRange: { start: string; end: string };
    }) => {
      setIsDetecting(true);
      try {
        const anomalies = await smartSchedulingEngine.detectAnomalies(serviceId, dateRange);
        return anomalies;
      } finally {
        setIsDetecting(false);
      }
    },
  });

  return {
    detectAnomalies: detectMutation.mutateAsync,
    isDetecting: isDetecting || detectMutation.isPending,
    error: detectMutation.error,
    data: detectMutation.data,
    reset: detectMutation.reset,
  };
}