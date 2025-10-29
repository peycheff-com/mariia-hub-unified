// Real-time Feature Flag Service
// Handles WebSocket connections, caching strategies, and real-time updates

import { supabase } from "@/integrations/supabase/client";
import { logger } from "@/lib/logger";

import type {
  FeatureFlag,
  FlagUpdateEvent,
  ExperimentUpdateEvent,
  FlagEvaluationContext,
  FlagCache,
  FeatureFlagSDK
} from "@/types/featureFlags";

interface CacheConfig {
  ttl: number; // Time to live in milliseconds
  maxSize: number; // Maximum number of flags to cache
  compressionEnabled: boolean;
  persistentCache: boolean;
}

interface RealtimeConfig {
  enabled: boolean;
  reconnectAttempts: number;
  reconnectDelay: number;
  heartbeatInterval: number;
}

interface CacheEntry {
  flag: FeatureFlag;
  timestamp: number;
  accessCount: number;
  lastAccessed: number;
}

export class FeatureFlagRealtimeService implements FeatureFlagSDK {
  private static instance: FeatureFlagRealtimeService;
  private cache: Map<string, CacheEntry> = new Map();
  private realtimeChannel: any = null;
  private listeners: Set<(event: FlagUpdateEvent | ExperimentUpdateEvent) => void> = new Set();
  private isConnected = false;
  private reconnectCount = 0;
  private heartbeatTimer: NodeJS.Timeout | null = null;

  private readonly cacheConfig: CacheConfig = {
    ttl: 5 * 60 * 1000, // 5 minutes
    maxSize: 1000,
    compressionEnabled: true,
    persistentCache: true,
  };

  private readonly realtimeConfig: RealtimeConfig = {
    enabled: true,
    reconnectAttempts: 5,
    reconnectDelay: 2000,
    heartbeatInterval: 30000, // 30 seconds
  };

  private readonly STORAGE_KEY = 'feature_flags_realtime_cache';
  private readonly CACHE_VERSION_KEY = 'ff_cache_version';

  static getInstance(): FeatureFlagRealtimeService {
    if (!FeatureFlagRealtimeService.instance) {
      FeatureFlagRealtimeService.instance = new FeatureFlagRealtimeService();
    }
    return FeatureFlagRealtimeService.instance;
  }

  private constructor() {
    this.loadPersistentCache();
    this.setupRealtimeConnection();
    this.startCleanupTimer();
  }

  // Cache Management
  private loadPersistentCache(): void {
    if (!this.cacheConfig.persistentCache) return;

    try {
      const cached = localStorage.getItem(this.STORAGE_KEY);
      const version = localStorage.getItem(this.CACHE_VERSION_KEY);

      if (cached && version && this.isCacheVersionValid(version)) {
        const data = JSON.parse(cached);
        const now = Date.now();

        // Load valid entries
        Object.entries(data.flags || {}).forEach(([key, entry]: [string, any]) => {
          if (now - entry.timestamp < this.cacheConfig.ttl) {
            this.cache.set(key, {
              ...entry,
              flag: this.decompressFlag(entry.flag),
            });
          }
        });

        logger.info(`Loaded ${this.cache.size} feature flags from persistent cache`);
      }
    } catch (error) {
      logger.warn('Failed to load persistent cache:', error);
    }
  }

  private savePersistentCache(): void {
    if (!this.cacheConfig.persistentCache) return;

    try {
      const data = {
        flags: Object.fromEntries(
          Array.from(this.cache.entries()).map(([key, entry]) => [
            key,
            {
              ...entry,
              flag: this.compressFlag(entry.flag),
            }
          ])
        ),
        version: Date.now(),
      };

      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
      localStorage.setItem(this.CACHE_VERSION_KEY, data.version.toString());
    } catch (error) {
      logger.warn('Failed to save persistent cache:', error);
    }
  }

  private isCacheVersionValid(version: string): boolean {
    const versionAge = Date.now() - parseInt(version);
    return versionAge < this.cacheConfig.ttl;
  }

  private compressFlag(flag: FeatureFlag): any {
    if (!this.cacheConfig.compressionEnabled) return flag;

    // Simple compression - remove null/undefined values and compress arrays
    return {
      id: flag.id,
      flag_key: flag.flag_key,
      description: flag.description,
      is_active: flag.is_active,
      rollout_percentage: flag.rollout_percentage,
      target_segments: flag.target_segments,
      created_by: flag.created_by,
      created_at: flag.created_at,
      updated_at: flag.updated_at,
      environments: flag.environments,
      start_date: flag.start_date,
      end_date: flag.end_date,
      metadata: flag.metadata,
    };
  }

  private decompressFlag(compressed: any): FeatureFlag {
    return compressed as FeatureFlag;
  }

  private updateCacheEntry(key: string, flag: FeatureFlag): void {
    const now = Date.now();
    const existing = this.cache.get(key);

    if (existing) {
      existing.flag = flag;
      existing.timestamp = now;
      existing.accessCount++;
      existing.lastAccessed = now;
    } else {
      // Implement LRU eviction if cache is full
      if (this.cache.size >= this.cacheConfig.maxSize) {
        this.evictLeastRecentlyUsed();
      }

      this.cache.set(key, {
        flag,
        timestamp: now,
        accessCount: 1,
        lastAccessed: now,
      });
    }

    this.savePersistentCache();
  }

  private evictLeastRecentlyUsed(): void {
    let oldestKey = '';
    let oldestTime = Date.now();

    for (const [key, entry] of this.cache) {
      if (entry.lastAccessed < oldestTime) {
        oldestTime = entry.lastAccessed;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.cache.delete(oldestKey);
    }
  }

  private startCleanupTimer(): void {
    // Clean up expired cache entries every minute
    setInterval(() => {
      this.cleanupExpiredEntries();
    }, 60000);
  }

  private cleanupExpiredEntries(): void {
    const now = Date.now();
    const expiredKeys: string[] = [];

    for (const [key, entry] of this.cache) {
      if (now - entry.timestamp > this.cacheConfig.ttl) {
        expiredKeys.push(key);
      }
    }

    expiredKeys.forEach(key => this.cache.delete(key));

    if (expiredKeys.length > 0) {
      logger.debug(`Cleaned up ${expiredKeys.length} expired cache entries`);
      this.savePersistentCache();
    }
  }

  // Real-time Connection Management
  private setupRealtimeConnection(): void {
    if (!this.realtimeConfig.enabled) return;

    this.connectRealtime();
  }

  private connectRealtime(): void {
    try {
      this.realtimeChannel = supabase
        .channel('feature_flags_realtime')
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'feature_flags',
        }, (payload: any) => {
          this.handleRealtimeUpdate(payload);
        })
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'experiment_assignments',
        }, (payload: any) => {
          this.handleExperimentUpdate(payload);
        })
        .on('broadcast', { event: 'feature_flag_heartbeat' }, () => {
          this.handleHeartbeat();
        })
        .subscribe((status) => {
          this.handleConnectionStatusChange(status);
        });

    } catch (error) {
      logger.error('Failed to setup realtime connection:', error);
      this.scheduleReconnect();
    }
  }

  private handleRealtimeUpdate(payload: any): void {
    const { eventType, new: newRecord, old: oldRecord } = payload;

    if (eventType === 'INSERT' || eventType === 'UPDATE') {
      this.updateCacheEntry(newRecord.flag_key, newRecord);
    } else if (eventType === 'DELETE') {
      this.cache.delete(oldRecord.flag_key);
    }

    const event: FlagUpdateEvent = {
      type: eventType === 'INSERT' ? 'flag_updated' :
            eventType === 'UPDATE' ? 'flag_updated' : 'flag_deleted',
      flag_key: newRecord?.flag_key || oldRecord?.flag_key,
      timestamp: new Date().toISOString(),
      changes: newRecord || oldRecord,
      affected_users: this.getAffectedUsers(newRecord || oldRecord),
    };

    this.notifyListeners(event);
  }

  private handleExperimentUpdate(payload: any): void {
    const { eventType, new: newRecord } = payload;

    if (eventType === 'INSERT') {
      const event: ExperimentUpdateEvent = {
        type: 'conversion_tracked',
        experiment_key: newRecord.experiment_key,
        user_id: newRecord.user_id,
        variant: newRecord.variant,
        timestamp: new Date().toISOString(),
        data: {
          converted: newRecord.converted,
          conversion_value: newRecord.conversion_value,
        }
      };

      this.notifyListeners(event);
    }
  }

  private handleHeartbeat(): void {
    this.isConnected = true;
    this.reconnectCount = 0;
  }

  private handleConnectionStatusChange(status: string): void {
    logger.debug('Realtime connection status:', status);

    switch (status) {
      case 'SUBSCRIBED':
        this.isConnected = true;
        this.reconnectCount = 0;
        this.startHeartbeat();
        break;
      case 'CLOSED':
      case 'CHANNEL_ERROR':
        this.isConnected = false;
        this.stopHeartbeat();
        this.scheduleReconnect();
        break;
    }
  }

  private startHeartbeat(): void {
    this.heartbeatTimer = setInterval(() => {
      if (this.realtimeChannel && this.isConnected) {
        this.realtimeChannel.send({
          type: 'broadcast',
          event: 'feature_flag_heartbeat',
          payload: { timestamp: Date.now() }
        });
      }
    }, this.realtimeConfig.heartbeatInterval);
  }

  private stopHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  private scheduleReconnect(): void {
    if (this.reconnectCount >= this.realtimeConfig.reconnectAttempts) {
      logger.error('Max reconnection attempts reached for feature flags realtime');
      return;
    }

    const delay = this.realtimeConfig.reconnectDelay * Math.pow(2, this.reconnectCount);
    this.reconnectCount++;

    logger.info(`Scheduling reconnection attempt ${this.reconnectCount} in ${delay}ms`);

    setTimeout(() => {
      this.connectRealtime();
    }, delay);
  }

  private getAffectedUsers(flag: FeatureFlag): string[] {
    // This would typically query the database to find affected users
    // For now, return empty array
    return [];
  }

  private notifyListeners(event: FlagUpdateEvent | ExperimentUpdateEvent): void {
    this.listeners.forEach(listener => {
      try {
        listener(event);
      } catch (error) {
        logger.error('Error notifying realtime listener:', error);
      }
    });
  }

  // SDK Implementation
  async isEnabled(key: string, context?: FlagEvaluationContext): Promise<boolean> {
    const cachedEntry = this.cache.get(key);
    let flag: FeatureFlag | undefined = cachedEntry?.flag;

    // If not in cache or expired, fetch from database
    if (!flag || this.isExpired(cachedEntry!)) {
      try {
        const { data, error } = await supabase
          .from('feature_flags')
          .select('*')
          .eq('flag_key', key)
          .single();

        if (error && error.code !== 'PGRST116') { // Not found error
          throw error;
        }

        flag = data;
        if (flag) {
          this.updateCacheEntry(key, flag);
        }
      } catch (error) {
        logger.error('Error fetching feature flag:', error);
        return false;
      }
    }

    if (!flag) return false;

    // Evaluate flag with context
    return this.evaluateFlag(flag, context);
  }

  async getVariant(key: string, context?: FlagEvaluationContext): Promise<string | null> {
    const flag = this.cache.get(key)?.flag;
    if (!flag || !flag.metadata?.isExperiment) return null;

    try {
      const { data, error } = await supabase.rpc('get_experiment_variant', {
        experiment_key: key,
        user_id_param: context?.userId,
      });

      if (error) throw error;
      return data;
    } catch (error) {
      logger.error('Error getting experiment variant:', error);
      return null;
    }
  }

  async getAllFlags(context?: FlagEvaluationContext): Promise<Record<string, boolean>> {
    const results: Record<string, boolean> = {};

    for (const [key, entry] of this.cache) {
      results[key] = this.evaluateFlag(entry.flag, context);
    }

    return results;
  }

  private evaluateFlag(flag: FeatureFlag, context?: FlagEvaluationContext): boolean {
    if (!flag.is_active) return false;

    // Check environment
    if (context?.environment && flag.environments && !flag.environments.includes(context.environment)) {
      return false;
    }

    // Check date constraints
    const now = new Date();
    if (flag.start_date && new Date(flag.start_date) > now) return false;
    if (flag.end_date && new Date(flag.end_date) < now) return false;

    // Check percentage rollout
    if (flag.rollout_percentage > 0 && flag.rollout_percentage < 100) {
      if (!context?.userId) return false;

      const hash = this.hashString(`${context.userId}:${flag.flag_key}`);
      const threshold = (flag.rollout_percentage / 100) * 4294967295;
      return hash <= threshold;
    }

    return true;
  }

  private isExpired(entry: CacheEntry): boolean {
    return Date.now() - entry.timestamp > this.cacheConfig.ttl;
  }

  private hashString(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash);
  }

  trackEvent(event: string, properties?: Record<string, any>): void {
    // Send to analytics service
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', event, properties);
    }
  }

  onFlagChange(callback: (event: FlagUpdateEvent) => void): () => void {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  // Advanced Cache Management
  getCacheStats(): {
    size: number;
    hitRate: number;
    memoryUsage: number;
    oldestEntry: number;
    newestEntry: number;
  } {
    const entries = Array.from(this.cache.values());
    const accessCounts = entries.map(e => e.accessCount);
    const totalAccess = accessCounts.reduce((sum, count) => sum + count, 0);
    const hitRate = totalAccess > 0 ? (totalAccess - entries.length) / totalAccess : 0;

    const timestamps = entries.map(e => e.timestamp);
    const oldestEntry = timestamps.length > 0 ? Math.min(...timestamps) : 0;
    const newestEntry = timestamps.length > 0 ? Math.max(...timestamps) : 0;

    // Rough memory usage estimation
    const memoryUsage = JSON.stringify([...this.cache]).length * 2; // bytes

    return {
      size: this.cache.size,
      hitRate,
      memoryUsage,
      oldestEntry,
      newestEntry,
    };
  }

  async warmCache(flagKeys?: string[]): Promise<void> {
    try {
      let query = supabase.from('feature_flags').select('*').eq('is_active', true);

      if (flagKeys) {
        query = query.in('flag_key', flagKeys);
      }

      const { data, error } = await query;
      if (error) throw error;

      data?.forEach(flag => {
        this.updateCacheEntry(flag.flag_key, flag);
      });

      logger.info(`Warmed cache with ${data?.length || 0} feature flags`);
    } catch (error) {
      logger.error('Error warming cache:', error);
    }
  }

  clearCache(): void {
    this.cache.clear();
    localStorage.removeItem(this.STORAGE_KEY);
    localStorage.removeItem(this.CACHE_VERSION_KEY);
    logger.info('Feature flag cache cleared');
  }

  forceRefresh(): Promise<void> {
    this.clearCache();
    return this.warmCache();
  }

  isRealtimeConnected(): boolean {
    return this.isConnected;
  }

  getConnectionStats(): {
    connected: boolean;
    reconnectCount: number;
    lastConnected: number;
    listeners: number;
  } {
    return {
      connected: this.isConnected,
      reconnectCount: this.reconnectCount,
      lastConnected: this.isConnected ? Date.now() : 0,
      listeners: this.listeners.size,
    };
  }

  // Cleanup
  destroy(): void {
    this.stopHeartbeat();

    if (this.realtimeChannel) {
      supabase.removeChannel(this.realtimeChannel);
    }

    this.listeners.clear();
    this.cache.clear();

    logger.info('Feature flag realtime service destroyed');
  }
}

// Export singleton instance
export const featureFlagRealtimeService = FeatureFlagRealtimeService.getInstance();

// Development utilities
if (import.meta.env.DEV) {
  (window as any).__ffRealtimeService = featureFlagRealtimeService;

  (window as any).__ffRealtimeDebug = {
    getCache: () => featureFlagRealtimeService.getCacheStats(),
    getConnection: () => featureFlagRealtimeService.getConnectionStats(),
    warmCache: (keys?: string[]) => featureFlagRealtimeService.warmCache(keys),
    clearCache: () => featureFlagRealtimeService.clearCache(),
    isConnected: () => featureFlagRealtimeService.isRealtimeConnected(),
  };
}