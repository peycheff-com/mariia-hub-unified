// Advanced caching system for performance optimization
import { queryClient } from '@/integrations/supabase/client';

// Cache configuration
export const CACHE_CONFIG = {
  // Service data (changes rarely)
  services: {
    ttl: 10 * 60 * 1000, // 10 minutes
    maxSize: 100,
    strategy: 'lru' as const,
  },
  // Availability data (changes frequently)
  availability: {
    ttl: 30 * 1000, // 30 seconds
    maxSize: 50,
    strategy: 'fifo' as const,
  },
  // User data (medium frequency)
  userData: {
    ttl: 5 * 60 * 1000, // 5 minutes
    maxSize: 200,
    strategy: 'lru' as const,
  },
  // Static content (very stable)
  content: {
    ttl: 30 * 60 * 1000, // 30 minutes
    maxSize: 300,
    strategy: 'lru' as const,
  },
  // API responses (short-term)
  api: {
    ttl: 60 * 1000, // 1 minute
    maxSize: 150,
    strategy: 'fifo' as const,
  },
};

// Cache entry interface
interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
  hits: number;
}

// Advanced cache implementation
class AdvancedCache {
  private caches = new Map<string, Map<string, CacheEntry<any>>>();
  private hitRates = new Map<string, { hits: number; misses: number }>();

  constructor() {
    // Initialize cache categories
    Object.keys(CACHE_CONFIG).forEach(category => {
      this.caches.set(category, new Map());
      this.hitRates.set(category, { hits: 0, misses: 0 });
    });

    // Cleanup expired entries every minute
    setInterval(() => this.cleanupExpiredEntries(), 60 * 1000);
  }

  // Get cached data
  get<T>(category: string, key: string): T | null {
    const cache = this.caches.get(category);
    const hitRate = this.hitRates.get(category);

    if (!cache || !hitRate) {
      return null;
    }

    const entry = cache.get(key);

    if (!entry) {
      hitRate.misses++;
      return null;
    }

    // Check if entry is expired
    if (Date.now() - entry.timestamp > entry.ttl) {
      cache.delete(key);
      hitRate.misses++;
      return null;
    }

    // Update hit statistics
    entry.hits++;
    hitRate.hits++;

    return entry.data;
  }

  // Set cached data
  set<T>(category: string, key: string, data: T, customTtl?: number): void {
    const cache = this.caches.get(category);
    const config = CACHE_CONFIG[category as keyof typeof CACHE_CONFIG];

    if (!cache || !config) {
      return;
    }

    const ttl = customTtl || config.ttl;

    // Check cache size limit
    if (cache.size >= config.maxSize) {
      this.evictOldest(category, config.strategy);
    }

    cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
      hits: 0,
    });
  }

  // Delete specific entry
  delete(category: string, key: string): boolean {
    const cache = this.caches.get(category);
    return cache ? cache.delete(key) : false;
  }

  // Clear entire cache category
  clear(category: string): void {
    const cache = this.caches.get(category);
    if (cache) {
      cache.clear();
    }
  }

  // Clear all caches
  clearAll(): void {
    this.caches.forEach(cache => cache.clear());
    this.hitRates.forEach(rate => {
      rate.hits = 0;
      rate.misses = 0;
    });
  }

  // Evict oldest entries based on strategy
  private evictOldest(category: string, strategy: 'lru' | 'fifo'): void {
    const cache = this.caches.get(category);
    if (!cache || cache.size === 0) return;

    let keyToDelete: string;

    if (strategy === 'lru') {
      // Find least recently used
      let oldestEntry: [string, CacheEntry<any>];
      cache.forEach((entry, key) => {
        if (!oldestEntry || entry.hits < oldestEntry[1].hits ||
            (entry.hits === oldestEntry[1].hits && entry.timestamp < oldestEntry[1].timestamp)) {
          oldestEntry = [key, entry];
        }
      });
      keyToDelete = oldestEntry[0];
    } else {
      // FIFO - find oldest by timestamp
      let oldestTimestamp = Infinity;
      cache.forEach((entry, key) => {
        if (entry.timestamp < oldestTimestamp) {
          oldestTimestamp = entry.timestamp;
          keyToDelete = key;
        }
      });
    }

    if (keyToDelete) {
      cache.delete(keyToDelete);
    }
  }

  // Cleanup expired entries
  private cleanupExpiredEntries(): void {
    const now = Date.now();

    this.caches.forEach((cache, category) => {
      const keysToDelete: string[] = [];

      cache.forEach((entry, key) => {
        if (now - entry.timestamp > entry.ttl) {
          keysToDelete.push(key);
        }
      });

      keysToDelete.forEach(key => cache.delete(key));
    });
  }

  // Get cache statistics
  getStats() {
    const stats: Record<string, any> = {};

    this.caches.forEach((cache, category) => {
      const hitRate = this.hitRates.get(category)!;
      const total = hitRate.hits + hitRate.misses;
      const hitRatePercentage = total > 0 ? (hitRate.hits / total) * 100 : 0;

      stats[category] = {
        size: cache.size,
        hits: hitRate.hits,
        misses: hitRate.misses,
        hitRate: Math.round(hitRatePercentage * 100) / 100,
      };
    });

    return stats;
  }

  // Warm up caches with essential data
  async warmupEssentialData() {
    try {
      // Preload service data
      await this.preloadServices();

      // Preload content data
      await this.preloadContent();

      console.log('🔥 Cache warmup completed');
    } catch (error) {
      console.error('❌ Cache warmup failed:', error);
    }
  }

  private async preloadServices() {
    // This would be implemented based on your service API
    console.log('Preloading services...');
  }

  private async preloadContent() {
    // This would be implemented based on your content API
    console.log('Preloading content...');
  }
}

// Create global cache instance
export const advancedCache = new AdvancedCache();

// Cache hooks for React Query integration
export const useAdvancedCache = () => {
  return {
    get: advancedCache.get.bind(advancedCache),
    set: advancedCache.set.bind(advancedCache),
    delete: advancedCache.delete.bind(advancedCache),
    clear: advancedCache.clear.bind(advancedCache),
    getStats: advancedCache.getStats.bind(advancedCache),
    warmup: advancedCache.warmupEssentialData.bind(advancedCache),
  };
};

// Higher-order function for cached API calls
export function withCache<T extends any[], R>(
  category: string,
  fn: (...args: T) => Promise<R>,
  keyGenerator?: (...args: T) => string,
  ttl?: number
) {
  return async (...args: T): Promise<R> => {
    const key = keyGenerator ? keyGenerator(...args) : JSON.stringify(args);

    // Try to get from cache first
    const cached = advancedCache.get<R>(category, key);
    if (cached !== null) {
      return cached;
    }

    // Execute function and cache result
    try {
      const result = await fn(...args);
      advancedCache.set(category, key, result, ttl);
      return result;
    } catch (error) {
      // Don't cache errors
      throw error;
    }
  };
}

// Cache invalidation utilities
export const cacheInvalidation = {
  // Invalidate all cache entries matching a pattern
  invalidatePattern: (category: string, pattern: string | RegExp) => {
    const cache = advancedCache['caches'].get(category);
    if (!cache) return;

    const keysToDelete: string[] = [];
    const regex = typeof pattern === 'string' ? new RegExp(pattern) : pattern;

    cache.forEach((_, key) => {
      if (regex.test(key)) {
        keysToDelete.push(key);
      }
    });

    keysToDelete.forEach(key => advancedCache.delete(category, key));
  },

  // Invalidate service-related caches
  invalidateServices: () => {
    advancedCache.clear('services');
    advancedCache.clear('availability');
  },

  // Invalidate user-specific caches
  invalidateUser: (userId: string) => {
    cacheInvalidation.invalidatePattern('userData', `user-${userId}`);
    cacheInvalidation.invalidatePattern('api', `user-${userId}`);
  },

  // Invalidate content caches
  invalidateContent: () => {
    advancedCache.clear('content');
  },
};

// Development helper to monitor cache performance
if (process.env.NODE_ENV === 'development') {
  setInterval(() => {
    const stats = advancedCache.getStats();
    console.table(stats);
  }, 30 * 1000); // Log every 30 seconds in development
}