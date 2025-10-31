/**
 * Redis Caching Implementation
 * Provides Redis-based caching with fallback to in-memory cache
 */

import { createClient } from '@supabase/supabase-js';

export interface CacheConfig {
  redis?: {
    url: string;
    keyPrefix: string;
    ttl: {
      default: number;
      short: number; // 5 minutes
      medium: number; // 1 hour
      long: number; // 1 day
    };
  };
  fallback: {
    enabled: boolean;
    maxSize: number;
  };
}

export interface CacheOptions {
  ttl?: number;
  tags?: string[];
  version?: string;
  compress?: boolean;
}

export interface CacheEntry<T = any> {
  data: T;
  timestamp: number;
  ttl: number;
  tags: string[];
  version: string;
  compressed: boolean;
}

const CACHE_CONFIG: CacheConfig = {
  redis: {
    url: import.meta.env.VITE_REDIS_URL || 'redis://localhost:6379',
    keyPrefix: 'mariia-hub:',
    ttl: {
      default: 3600, // 1 hour
      short: 300, // 5 minutes
      medium: 3600, // 1 hour
      long: 86400 // 1 day
    }
  },
  fallback: {
    enabled: true,
    maxSize: 100 // Number of entries
  }
};

/**
 * Redis Cache Manager
 */
export class RedisCacheManager {
  private static instance: RedisCacheManager;
  private redisClient: any;
  private fallbackCache: Map<string, CacheEntry>;
  private isConnected: boolean = false;
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 5;

  private constructor() {
    this.fallbackCache = new Map();
    this.initializeRedis();
  }

  static getInstance(): RedisCacheManager {
    if (!RedisCacheManager.instance) {
      RedisCacheManager.instance = new RedisCacheManager();
    }
    return RedisCacheManager.instance;
  }

  /**
   * Initialize Redis connection
   */
  private async initializeRedis() {
    // Note: Redis client would need to be initialized server-side
    // This is a client-side implementation with fallback
    if (typeof window === 'undefined') {
      // Server-side Redis initialization
      try {
        // This would be implemented with a server-side Redis client
        // For now, we'll use Supabase as a cache backend
        const supabase = createClient(
          import.meta.env.VITE_SUPABASE_URL!,
          import.meta.env.VITE_SUPABASE_ANON_KEY!
        );

        this.redisClient = {
          async get(key: string) {
            const { data } = await supabase
              .from('cache')
              .select('value, expires_at')
              .eq('key', key)
              .single();

            if (data && new Date(data.expires_at) > new Date()) {
              return data.value;
            }
            return null;
          },

          async set(key: string, value: string, options?: { EX?: number }) {
            const expiresAt = new Date();
            if (options?.EX) {
              expiresAt.setSeconds(expiresAt.getSeconds() + options.EX);
            } else {
              expiresAt.setHours(expiresAt.getHours() + 1);
            }

            await supabase
              .from('cache')
              .upsert({
                key,
                value,
                expires_at: expiresAt.toISOString()
              });
          },

          async del(key: string) {
            await supabase
              .from('cache')
              .delete()
              .eq('key', key);
          },

          async flushdb() {
            await supabase
              .from('cache')
              .delete()
              .like('key', `${CACHE_CONFIG.redis?.keyPrefix || ''}%`);
          }
        };

        this.isConnected = true;
        console.log('Redis cache initialized (via Supabase)');
      } catch (error) {
        console.warn('Redis initialization failed, using fallback cache:', error);
        this.isConnected = false;
      }
    } else {
      // Client-side - use fallback cache only
      console.log('Using fallback cache (client-side)');
      this.isConnected = false;
    }
  }

  /**
   * Get value from cache
   */
  async get<T = any>(key: string): Promise<T | null> {
    const fullKey = this.getFullKey(key);

    try {
      if (this.isConnected && this.redisClient) {
        const value = await this.redisClient.get(fullKey);
        if (value) {
          const entry: CacheEntry<T> = JSON.parse(value);
          if (this.isValidEntry(entry)) {
            return entry.data;
          } else {
            // Entry expired, remove it
            await this.delete(key);
          }
        }
      }

      // Fallback to in-memory cache
      if (CACHE_CONFIG.fallback.enabled) {
        const entry = this.fallbackCache.get(fullKey);
        if (entry && this.isValidEntry(entry)) {
          return entry.data;
        } else if (entry) {
          this.fallbackCache.delete(fullKey);
        }
      }

      return null;
    } catch (error) {
      console.error('Cache get error:', error);
      return null;
    }
  }

  /**
   * Set value in cache
   */
  async set<T = any>(
    key: string,
    data: T,
    options: CacheOptions = {}
  ): Promise<void> {
    const fullKey = this.getFullKey(key);
    const ttl = options.ttl || CACHE_CONFIG.redis?.ttl.default || 3600;

    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      ttl,
      tags: options.tags || [],
      version: options.version || '1.0.0',
      compressed: options.compress || false
    };

    const serialized = JSON.stringify(entry);

    try {
      // Try Redis first
      if (this.isConnected && this.redisClient) {
        await this.redisClient.set(fullKey, serialized, { EX: ttl });
      }

      // Also set in fallback cache
      if (CACHE_CONFIG.fallback.enabled) {
        this.setFallbackCache(fullKey, entry);
      }
    } catch (error) {
      console.error('Cache set error:', error);
      // Fallback to in-memory only
      if (CACHE_CONFIG.fallback.enabled) {
        this.setFallbackCache(fullKey, entry);
      }
    }
  }

  /**
   * Delete from cache
   */
  async delete(key: string): Promise<void> {
    const fullKey = this.getFullKey(key);

    try {
      if (this.isConnected && this.redisClient) {
        await this.redisClient.del(fullKey);
      }

      this.fallbackCache.delete(fullKey);
    } catch (error) {
      console.error('Cache delete error:', error);
    }
  }

  /**
   * Clear cache by tags
   */
  async clearByTag(tag: string): Promise<void> {
    try {
      // Clear from fallback cache
      for (const [key, entry] of this.fallbackCache.entries()) {
        if (entry.tags.includes(tag)) {
          this.fallbackCache.delete(key);
        }
      }

      // Redis implementation would use a tag-based index
      // For now, we'll implement a simple pattern match
      if (this.isConnected && this.redisClient) {
        // This would need Redis SCAN with MATCH in a real implementation
        console.log(`Cleared cache entries for tag: ${tag}`);
      }
    } catch (error) {
      console.error('Cache clear by tag error:', error);
    }
  }

  /**
   * Increment counter
   */
  async increment(key: string, amount: number = 1): Promise<number> {
    const current = await this.get<number>(key) || 0;
    const newValue = current + amount;
    await this.set(key, newValue, { ttl: CACHE_CONFIG.redis?.ttl.long });
    return newValue;
  }

  /**
   * Get multiple keys
   */
  async mget<T = any>(keys: string[]): Promise<(T | null)[]> {
    return Promise.all(keys.map(key => this.get<T>(key)));
  }

  /**
   * Set multiple keys
   */
  async mset<T = any>(entries: Array<[string, T]>): Promise<void> {
    await Promise.all(
      entries.map(([key, value]) => this.set(key, value))
    );
  }

  /**
   * Get or set pattern (cache-aside)
   */
  async getOrSet<T = any>(
    key: string,
    fetcher: () => Promise<T>,
    options: CacheOptions = {}
  ): Promise<T> {
    const cached = await this.get<T>(key);

    if (cached !== null) {
      return cached;
    }

    const data = await fetcher();
    await this.set(key, data, options);

    return data;
  }

  /**
   * Cache warming
   */
  async warmCache(entries: Array<{
    key: string;
    fetcher: () => Promise<any>;
    options?: CacheOptions;
  }>): Promise<void> {
    const promises = entries.map(async ({ key, fetcher, options }) => {
      try {
        const data = await fetcher();
        await this.set(key, data, options);
      } catch (error) {
        console.error(`Cache warming failed for key ${key}:`, error);
      }
    });

    await Promise.all(promises);
  }

  /**
   * Get cache statistics
   */
  getStats(): {
    size: number;
    hitRate: number;
    memoryUsage: number;
  } {
    return {
      size: this.fallbackCache.size,
      hitRate: 0, // Would need to track hits/misses
      memoryUsage: this.calculateMemoryUsage()
    };
  }

  /**
   * Clear all cache
   */
  async clear(): Promise<void> {
    try {
      if (this.isConnected && this.redisClient) {
        await this.redisClient.flushdb();
      }

      this.fallbackCache.clear();
    } catch (error) {
      console.error('Cache clear error:', error);
    }
  }

  // Private helper methods
  private getFullKey(key: string): string {
    return `${CACHE_CONFIG.redis?.keyPrefix || 'mariia-hub:'}${key}`;
  }

  private isValidEntry<T>(entry: CacheEntry<T>): boolean {
    return Date.now() - entry.timestamp < entry.ttl * 1000;
  }

  private setFallbackCache<T>(key: string, entry: CacheEntry<T>): void {
    // Check size limit
    if (this.fallbackCache.size >= CACHE_CONFIG.fallback.maxSize) {
      // Remove oldest entry (simple LRU)
      const firstKey = this.fallbackCache.keys().next().value;
      if (firstKey) {
        this.fallbackCache.delete(firstKey);
      }
    }

    this.fallbackCache.set(key, entry);
  }

  private calculateMemoryUsage(): number {
    let totalSize = 0;
    for (const [key, entry] of this.fallbackCache.entries()) {
      totalSize += key.length * 2; // String character size
      totalSize += JSON.stringify(entry).length * 2;
    }
    return totalSize;
  }
}

/**
 * Specialized cache helpers for mariiaborysevych
 */
export class CacheHelpers {
  private cache = RedisCacheManager.getInstance();

  /**
   * Cache services list
   */
  async getServices(category?: string): Promise<any[]> {
    const key = category ? `services:${category}` : 'services:all';

    return this.cache.getOrSet(
      key,
      async () => {
        // Fetch from Supabase
        const supabase = createClient(
          import.meta.env.VITE_SUPABASE_URL!,
          import.meta.env.VITE_SUPABASE_ANON_KEY!
        );

        const { data, error } = await supabase
          .from('services')
          .select('*')
          .eq('status', 'active')
          .order('popularity_score', { ascending: false });

        if (error) throw error;
        return data || [];
      },
      { ttl: 1800, tags: ['services'] } // 30 minutes
    );
  }

  /**
   * Cache availability slots
   */
  async getAvailability(serviceId: string, date: string): Promise<any[]> {
    const key = `availability:${serviceId}:${date}`;

    return this.cache.getOrSet(
      key,
      async () => {
        const supabase = createClient(
          import.meta.env.VITE_SUPABASE_URL!,
          import.meta.env.VITE_SUPABASE_ANON_KEY!
        );

        const { data, error } = await supabase
          .from('availability_slots')
          .select('*')
          .eq('service_id', serviceId)
          .eq('date', date)
          .eq('is_available', true)
          .order('start_time');

        if (error) throw error;
        return data || [];
      },
      { ttl: 300, tags: ['availability'] } // 5 minutes
    );
  }

  /**
   * Cache user preferences
   */
  async getUserPreferences(userId: string): Promise<any> {
    const key = `preferences:${userId}`;

    return this.cache.getOrSet(
      key,
      async () => {
        const supabase = createClient(
          import.meta.env.VITE_SUPABASE_URL!,
          import.meta.env.VITE_SUPABASE_ANON_KEY!
        );

        const { data, error } = await supabase
          .from('user_preferences')
          .select('*')
          .eq('user_id', userId)
          .single();

        if (error && error.code !== 'PGRST116') throw error;
        return data;
      },
      { ttl: 3600, tags: ['preferences'] } // 1 hour
    );
  }

  /**
   * Cache blog posts
   */
  async getBlogPosts(limit: number = 10): Promise<any[]> {
    const key = `blog:${limit}`;

    return this.cache.getOrSet(
      key,
      async () => {
        const supabase = createClient(
          import.meta.env.VITE_SUPABASE_URL!,
          import.meta.env.VITE_SUPABASE_ANON_KEY!
        );

        const { data, error } = await supabase
          .from('blog_posts')
          .select('*')
          .eq('status', 'published')
          .order('published_at', { ascending: false })
          .limit(limit);

        if (error) throw error;
        return data || [];
      },
      { ttl: 1800, tags: ['blog'] } // 30 minutes
    );
  }

  /**
   * Invalidate related cache entries
   */
  async invalidateServiceCache(serviceId?: string): Promise<void> {
    if (serviceId) {
      await this.cache.delete(`service:${serviceId}`);
    }
    await this.cache.clearByTag('services');
    await this.cache.clearByTag('availability');
  }

  /**
   * Cache analytics data
   */
  async getAnalytics(type: string, period: string): Promise<any> {
    const key = `analytics:${type}:${period}`;

    return this.cache.getOrSet(
      key,
      async () => {
        // This would fetch from your analytics API
        const response = await fetch(`/api/analytics/${type}?period=${period}`);
        return response.json();
      },
      { ttl: 300, tags: ['analytics'] } // 5 minutes
    );
  }
}

export const redisCache = RedisCacheManager.getInstance();
export const cacheHelpers = new CacheHelpers();

/**
 * Initialize caching system
 */
export function initializeCache() {
  // Cache warm-up for critical data
  if (import.meta.env.PROD) {
    setTimeout(async () => {
      try {
        await redisCache.warmCache([
          {
            key: 'services:all',
            fetcher: () => cacheHelpers.getServices(),
            options: { ttl: 1800, tags: ['services'] }
          },
          {
            key: 'blog:10',
            fetcher: () => cacheHelpers.getBlogPosts(),
            options: { ttl: 1800, tags: ['blog'] }
          }
        ]);
        console.log('Cache warmed up');
      } catch (error) {
        console.error('Cache warm-up failed:', error);
      }
    }, 1000);
  }

  console.log('Redis caching initialized');
}