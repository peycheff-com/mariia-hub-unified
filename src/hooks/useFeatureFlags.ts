import { useState, useEffect, useCallback, useMemo } from "react";

import { supabase } from "@/integrations/supabase/client";
import { logger } from "@/lib/logger";

import type {
  FeatureFlag,
  FlagEvaluationContext,
  FlagEvaluationResult,
  ExperimentAssignment,
  FeatureFlagSDK,
  ExperimentSDK,
  FlagUpdateEvent,
  ExperimentUpdateEvent
} from "@/types/featureFlags";

// Global feature flag cache
interface FlagCache {
  flags: Map<string, FeatureFlag>;
  lastUpdated: number;
  ttl: number;
}

class FeatureFlagManager implements FeatureFlagSDK, ExperimentSDK {
  private static instance: FeatureFlagManager;
  private cache: FlagCache = {
    flags: new Map(),
    lastUpdated: 0,
    ttl: 5 * 60 * 1000, // 5 minutes
  };
  private userContext: FlagEvaluationContext = {};
  private listeners: Set<(event: FlagUpdateEvent | ExperimentUpdateEvent) => void> = new Set();
  private realtimeChannel: any = null;
  private readonly STORAGE_KEY = 'feature_flags_cache';
  private readonly SESSION_ID_KEY = 'ff_session_id';

  static getInstance(): FeatureFlagManager {
    if (!FeatureFlagManager.instance) {
      FeatureFlagManager.instance = new FeatureFlagManager();
    }
    return FeatureFlagManager.instance;
  }

  private constructor() {
    this.initializeSession();
    this.loadCachedFlags();
    this.setupRealtimeUpdates();
  }

  private initializeSession(): void {
    let sessionId = sessionStorage.getItem(this.SESSION_ID_KEY);
    if (!sessionId) {
      sessionId = this.generateSessionId();
      sessionStorage.setItem(this.SESSION_ID_KEY, sessionId);
    }
    this.userContext.sessionId = sessionId;
    this.userContext.environment = import.meta.env.MODE || 'development';
  }

  private generateSessionId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private async loadCachedFlags(): Promise<void> {
    try {
      const cached = localStorage.getItem(this.STORAGE_KEY);
      if (cached) {
        const { flags, timestamp } = JSON.parse(cached);
        const now = Date.now();

        // Use cached flags if they're still valid
        if (now - timestamp < this.cache.ttl) {
          this.cache.flags = new Map(Object.entries(flags));
          this.cache.lastUpdated = timestamp;
        }
      }
    } catch (error) {
      logger.warn('Failed to load cached feature flags:', error);
    }
  }

  private saveCachedFlags(): void {
    try {
      const flags = Object.fromEntries(this.cache.flags);
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify({
        flags,
        timestamp: Date.now(),
      }));
    } catch (error) {
      logger.warn('Failed to save cached feature flags:', error);
    }
  }

  private setupRealtimeUpdates(): void {
    // Set up Supabase realtime subscription for flag changes
    this.realtimeChannel = supabase
      .channel('feature_flags_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'feature_flags',
        },
        (payload: any) => {
          this.handleRealtimeUpdate(payload);
        }
      )
      .subscribe();
  }

  private handleRealtimeUpdate(payload: any): void {
    const { eventType, new: newRecord, old: oldRecord } = payload;

    if (eventType === 'INSERT' || eventType === 'UPDATE') {
      this.cache.flags.set(newRecord.flag_key, newRecord);
      this.saveCachedFlags();
    } else if (eventType === 'DELETE') {
      this.cache.flags.delete(oldRecord.flag_key);
      this.saveCachedFlags();
    }

    // Notify listeners
    const event: FlagUpdateEvent = {
      type: eventType === 'INSERT' ? 'flag_updated' :
            eventType === 'UPDATE' ? 'flag_updated' : 'flag_deleted',
      flag_key: newRecord?.flag_key || oldRecord?.flag_key,
      timestamp: new Date().toISOString(),
      changes: newRecord || oldRecord,
    };

    this.notifyListeners(event);
  }

  private notifyListeners(event: FlagUpdateEvent | ExperimentUpdateEvent): void {
    this.listeners.forEach(listener => {
      try {
        listener(event);
      } catch (error) {
        logger.error('Error notifying feature flag listener:', error);
      }
    });
  }

  private async fetchFlags(): Promise<void> {
    try {
      const { data, error } = await supabase
        .from('feature_flags')
        .select('*')
        .eq('is_active', true);

      if (error) throw error;

      const flagsMap = new Map<string, FeatureFlag>();
      data?.forEach(flag => {
        flagsMap.set(flag.flag_key, flag);
      });

      this.cache.flags = flagsMap;
      this.cache.lastUpdated = Date.now();
      this.saveCachedFlags();

    } catch (error) {
      logger.error('Failed to fetch feature flags:', error);
    }
  }

  private async ensureFreshFlags(): Promise<void> {
    const now = Date.now();
    if (now - this.cache.lastUpdated > this.cache.ttl) {
      await this.fetchFlags();
    }
  }

  // SDK Implementation
  async isEnabled(key: string, context?: FlagEvaluationContext): Promise<boolean> {
    await this.ensureFreshFlags();

    const flag = this.cache.flags.get(key);
    if (!flag) return false;

    const evalContext = { ...this.userContext, ...context };
    const result = await this.evaluateFlag(flag, evalContext);

    return result.enabled;
  }

  async getVariant(key: string, context?: FlagEvaluationContext): Promise<string | null> {
    await this.ensureFreshFlags();

    const flag = this.cache.flags.get(key);
    if (!flag || !flag.metadata?.isExperiment) return null;

    const evalContext = { ...this.userContext, ...context };

    // Call database function for consistent variant assignment
    const { data, error } = await supabase.rpc('get_experiment_variant', {
      experiment_key: key,
      user_id_param: evalContext.userId,
    });

    if (error) {
      logger.error('Error getting experiment variant:', error);
      return null;
    }

    return data;
  }

  async getAllFlags(context?: FlagEvaluationContext): Promise<Record<string, boolean>> {
    await this.ensureFreshFlags();

    const evalContext = { ...this.userContext, ...context };
    const results: Record<string, boolean> = {};

    for (const [key, flag] of this.cache.flags) {
      const result = await this.evaluateFlag(flag, evalContext);
      results[key] = result.enabled;
    }

    return results;
  }

  async evaluateFlag(flag: FeatureFlag, context: FlagEvaluationContext): Promise<FlagEvaluationResult> {
    const startTime = Date.now();

    try {
      // Call database function for server-side evaluation
      const { data, error } = await supabase.rpc('is_feature_enabled', {
        flag_key_param: flag.flag_key,
        user_id_param: context.userId,
        user_role_param: context.userRole,
        user_segments_param: context.userSegments ? { segments: context.userSegments } : null,
      });

      const evaluationTime = Date.now() - startTime;
      const enabled = data === true;

      return {
        flag_key: flag.flag_key,
        enabled,
        reason: enabled ? 'Server evaluation' : 'Server evaluation (disabled)',
        evaluation_time: evaluationTime,
        context,
      };

    } catch (error) {
      logger.error('Error evaluating flag:', error);

      // Fallback to client-side evaluation
      return this.evaluateFlagClientSide(flag, context, startTime);
    }
  }

  private evaluateFlagClientSide(
    flag: FeatureFlag,
    context: FlagEvaluationContext,
    startTime: number
  ): FlagEvaluationResult {
    let enabled = flag.is_active;
    let reason = 'Flag is active';

    // Check environment
    if (enabled && flag.environments && !flag.environments.includes(context.environment || 'development')) {
      enabled = false;
      reason = 'Environment not in target list';
    }

    // Check date constraints
    if (enabled) {
      const now = new Date();
      if (flag.start_date && new Date(flag.start_date) > now) {
        enabled = false;
        reason = 'Flag has not started yet';
      } else if (flag.end_date && new Date(flag.end_date) < now) {
        enabled = false;
        reason = 'Flag has expired';
      }
    }

    // Check percentage rollout
    if (enabled && flag.rollout_percentage > 0 && flag.rollout_percentage < 100) {
      if (!context.sessionId) {
        enabled = false;
        reason = 'No session ID for percentage rollout';
      } else {
        const hash = this.hashString(`${context.sessionId}:${flag.flag_key}`);
        const threshold = (flag.rollout_percentage / 100) * 4294967295;

        if (hash > threshold) {
          enabled = false;
          reason = 'User not in rollout percentage';
        } else {
          reason = `User in ${flag.rollout_percentage}% rollout`;
        }
      }
    }

    return {
      flag_key: flag.flag_key,
      enabled,
      reason,
      evaluation_time: Date.now() - startTime,
      context,
    };
  }

  private hashString(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }

  trackEvent(event: string, properties?: Record<string, any>): void {
    // Send to analytics service
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', event, {
        ...properties,
        session_id: this.userContext.sessionId,
      });
    }

    // Track experiment events if applicable
    if (properties?.experiment_key) {
      this.trackExperimentEvent(properties.experiment_key, event, properties);
    }
  }

  private async trackExperimentEvent(
    experimentKey: string,
    eventType: string,
    properties: Record<string, any>
  ): Promise<void> {
    try {
      await supabase.from('experiment_events').insert({
        experiment_key: experimentKey,
        user_id: this.userContext.userId,
        event_type: eventType,
        event_value: properties.value,
        metadata: properties,
      });
    } catch (error) {
      logger.error('Error tracking experiment event:', error);
    }
  }

  onFlagChange(callback: (event: FlagUpdateEvent) => void): () => void {
    this.listeners.add(callback);

    return () => {
      this.listeners.delete(callback);
    };
  }

  // Experiment SDK methods
  async getRunningExperiments(): Promise<string[]> {
    await this.ensureFreshFlags();

    const experiments: string[] = [];
    for (const [key, flag] of this.cache.flags) {
      if (flag.metadata?.isExperiment) {
        experiments.push(key);
      }
    }

    return experiments;
  }

  async getUserExperiments(context?: FlagEvaluationContext): Promise<Array<{
    experiment_key: string;
    variant: string;
    enrolled_at: string;
  }>> {
    if (!context?.userId) return [];

    try {
      const { data, error } = await supabase
        .from('experiment_assignments')
        .select('experiment_key, variant, assigned_at')
        .eq('user_id', context.userId);

      if (error) throw error;

      return data?.map(assignment => ({
        experiment_key: assignment.experiment_key,
        variant: assignment.variant,
        enrolled_at: assignment.assigned_at,
      })) || [];

    } catch (error) {
      logger.error('Error getting user experiments:', error);
      return [];
    }
  }

  async trackConversion(
    experimentKey: string,
    value?: number,
    context?: FlagEvaluationContext
  ): Promise<void> {
    const userId = context?.userId || this.userContext.userId;
    if (!userId) {
      logger.warn('Cannot track conversion without user ID');
      return;
    }

    try {
      const { error } = await supabase.rpc('track_experiment_conversion', {
        experiment_key: experimentKey,
        user_id_param: userId,
        conversion_value_param: value,
      });

      if (error) throw error;

      // Track conversion event
      this.trackExperimentEvent(experimentKey, 'conversion', {
        value,
        timestamp: new Date().toISOString(),
      });

    } catch (error) {
      logger.error('Error tracking conversion:', error);
    }
  }

  // Context management
  setUserId(userId: string): void {
    this.userContext.userId = userId;
  }

  setUserRole(role: string): void {
    this.userContext.userRole = role;
  }

  setUserSegments(segments: string[]): void {
    this.userContext.userSegments = segments;
  }

  setCustomProperties(properties: Record<string, any>): void {
    this.userContext.properties = { ...this.userContext.properties, ...properties };
  }

  getContext(): FlagEvaluationContext {
    return { ...this.userContext };
  }

  // Cache management
  async refreshCache(): Promise<void> {
    await this.fetchFlags();
  }

  clearCache(): void {
    this.cache.flags.clear();
    this.cache.lastUpdated = 0;
    localStorage.removeItem(this.STORAGE_KEY);
  }

  // Cleanup
  destroy(): void {
    if (this.realtimeChannel) {
      supabase.removeChannel(this.realtimeChannel);
    }
    this.listeners.clear();
  }
}

// Create singleton instance
const featureFlagManager = FeatureFlagManager.getInstance();

// React hooks
export function useFeatureFlag(key: string, context?: FlagEvaluationContext) {
  const [enabled, setEnabled] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  const checkFlag = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await featureFlagManager.isEnabled(key, context);
      setEnabled(result);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to check feature flag'));
    } finally {
      setLoading(false);
    }
  }, [key, context]);

  useEffect(() => {
    checkFlag();
  }, [checkFlag]);

  // Listen for flag changes
  useEffect(() => {
    const unsubscribe = featureFlagManager.onFlagChange((event) => {
      if (event.flag_key === key) {
        checkFlag();
      }
    });

    return unsubscribe;
  }, [key, checkFlag]);

  const trackUsage = useCallback((action: string, properties?: Record<string, any>) => {
    featureFlagManager.trackEvent(`feature_flag_${action}`, {
      flag_key: key,
      enabled,
      ...properties,
    });
  }, [key, enabled]);

  return {
    enabled,
    loading,
    error,
    trackUsage,
    refresh: checkFlag,
  };
}

export function useExperiment(key: string, context?: FlagEvaluationContext) {
  const [variant, setVariant] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  const getVariant = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await featureFlagManager.getVariant(key, context);
      setVariant(result);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to get experiment variant'));
    } finally {
      setLoading(false);
    }
  }, [key, context]);

  useEffect(() => {
    getVariant();
  }, [getVariant]);

  const trackConversion = useCallback((value?: number) => {
    featureFlagManager.trackConversion(key, value, context);
  }, [key, context]);

  const trackEvent = useCallback((eventType: string, properties?: Record<string, any>) => {
    featureFlagManager.trackEvent(eventType, {
      experiment_key: key,
      variant,
      ...properties,
    });
  }, [key, variant]);

  return {
    variant,
    loading,
    error,
    trackConversion,
    trackEvent,
    refresh: getVariant,
  };
}

export function useFeatureFlags(keys?: string[], context?: FlagEvaluationContext) {
  const [flags, setFlags] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  const checkFlags = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await featureFlagManager.getAllFlags(context);

      if (keys) {
        // Filter to only requested keys
        const filtered: Record<string, boolean> = {};
        keys.forEach(key => {
          filtered[key] = result[key] || false;
        });
        setFlags(filtered);
      } else {
        setFlags(result);
      }
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to check feature flags'));
    } finally {
      setLoading(false);
    }
  }, [keys, context]);

  useEffect(() => {
    checkFlags();
  }, [checkFlags]);

  // Listen for any flag changes
  useEffect(() => {
    const unsubscribe = featureFlagManager.onFlagChange(() => {
      checkFlags();
    });

    return unsubscribe;
  }, [checkFlags]);

  return {
    flags,
    loading,
    error,
    refresh: checkFlags,
  };
}

export function useFeatureFlagManager() {
  return {
    setUserId: featureFlagManager.setUserId.bind(featureFlagManager),
    setUserRole: featureFlagManager.setUserRole.bind(featureFlagManager),
    setUserSegments: featureFlagManager.setUserSegments.bind(featureFlagManager),
    setCustomProperties: featureFlagManager.setCustomProperties.bind(featureFlagManager),
    getContext: featureFlagManager.getContext.bind(featureFlagManager),
    refreshCache: featureFlagManager.refreshCache.bind(featureFlagManager),
    clearCache: featureFlagManager.clearCache.bind(featureFlagManager),
    trackEvent: featureFlagManager.trackEvent.bind(featureFlagManager),
    getRunningExperiments: featureFlagManager.getRunningExperiments.bind(featureFlagManager),
    getUserExperiments: featureFlagManager.getUserExperiments.bind(featureFlagManager),
  };
}

// Export the manager instance for advanced usage
export { featureFlagManager };

// Development utilities
if (import.meta.env.DEV) {
  (window as any).__featureFlagManager = featureFlagManager;

  // Add debug methods to window
  (window as any).__ffDebug = {
    getCache: () => featureFlagManager['cache'],
    refresh: () => featureFlagManager.refreshCache(),
    clear: () => featureFlagManager.clearCache(),
    getAllFlags: () => featureFlagManager.getAllFlags(),
    evaluateFlag: (key: string, context?: FlagEvaluationContext) =>
      featureFlagManager.isEnabled(key, context),
  };
}