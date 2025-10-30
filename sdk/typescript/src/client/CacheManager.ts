import { CacheConfig } from '../types/api';
import { ApiResponse } from '../types/common';

/**
 * Cache entry
 */
interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
  ttl: number;
  hits: number;
}

/**
 * Cache statistics
 */
export interface CacheStats {
  hits: number;
  misses: number;
  entries: number;
  size: number;
  hitRate: number;
  oldestEntry?: Date;
  newestEntry?: Date;
}

/**
 * Cache manager implementation
 */
export class CacheManager {
  private config: CacheConfig;
  private cache: Map<string, CacheEntry<any>> = new Map();
  private cleanupInterval?: NodeJS.Timeout;
  private stats: CacheStats = {
    hits: 0,
    misses: 0,
    entries: 0,
    size: 0,
    hitRate: 0
  };

  constructor(config: CacheConfig) {
    this.config = { ...config };
    this.startCleanupInterval();
  }

  /**
   * Get cached value
   */
  async get<T>(key: string, config?: { ttl?: number }): Promise<T | null> {
    if (!this.config.enabled) {
      return null;
    }

    const entry = this.cache.get(key);

    if (!entry) {
      this.stats.misses++;
      this.updateHitRate();
      return null;
    }

    // Check if expired
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      this.stats.misses++;
      this.updateHitRate();
      return null;
    }

    // Update hit count
    entry.hits++;
    this.stats.hits++;
    this.updateHitRate();

    return entry.data;
  }

  /**
   * Set cached value
   */
  async set<T>(key: string, data: T, config?: { ttl?: number }): Promise<void> {
    if (!this.config.enabled) {
      return;
    }

    const ttl = config?.ttl || this.config.ttl || 300; // Default 5 minutes
    const now = Date.now();
    const expiresAt = now + (ttl * 1000);

    // Check size limit
    if (this.config.maxSize && this.cache.size >= this.config.maxSize) {
      this.evictOldest();
    }

    const entry: CacheEntry<T> = {
      data,
      timestamp: now,
      expiresAt,
      ttl,
      hits: 0
    };

    this.cache.set(key, entry);
    this.stats.entries = this.cache.size;
  }

  /**
   * Delete cached value
   */
  async delete(key: string): Promise<boolean> {
    const deleted = this.cache.delete(key);
    if (deleted) {
      this.stats.entries = this.cache.size;
    }
    return deleted;
  }

  /**
   * Check if key exists and is not expired
   */
  async has(key: string): Promise<boolean> {
    const entry = this.cache.get(key);
    if (!entry) {
      return false;
    }

    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      this.stats.entries = this.cache.size;
      return false;
    }

    return true;
  }

  /**
   * Clear all cached values
   */
  async clear(): Promise<void> {
    this.cache.clear();
    this.stats.entries = 0;
    this.stats.hits = 0;
    this.stats.misses = 0;
    this.stats.hitRate = 0;
  }

  /**
   * Get cache statistics
   */
  getStats(): CacheStats {
    const entries = Array.from(this.cache.values());

    if (entries.length > 0) {
      const timestamps = entries.map(e => e.timestamp);
      this.stats.oldestEntry = new Date(Math.min(...timestamps));
      this.stats.newestEntry = new Date(Math.max(...timestamps));
      this.stats.size = this.calculateCacheSize();
    } else {
      this.stats.oldestEntry = undefined;
      this.stats.newestEntry = undefined;
      this.stats.size = 0;
    }

    return { ...this.stats };
  }

  /**
   * Get all keys
   */
  async keys(): Promise<string[]> {
    // Clean expired keys first
    await this.cleanup();
    return Array.from(this.cache.keys());
  }

  /**
   * Get cached values with metadata
   */
  async entries(): Promise<Array<{ key: string; entry: CacheEntry<any> }>> {
    await this.cleanup();
    return Array.from(this.cache.entries()).map(([key, entry]) => ({ key, entry }));
  }

  /**
   * Touch entry to update expiration
   */
  async touch(key: string, ttl?: number): Promise<boolean> {
    const entry = this.cache.get(key);
    if (!entry) {
      return false;
    }

    const newTtl = ttl || entry.ttl;
    entry.expiresAt = Date.now() + (newTtl * 1000);
    entry.ttl = newTtl;

    return true;
  }

  /**
   * Increment numeric cached value
   */
  async increment(key: string, amount: number = 1): Promise<number | null> {
    const entry = this.cache.get(key);
    if (!entry || typeof entry.data !== 'number') {
      return null;
    }

    entry.data += amount;
    return entry.data;
  }

  /**
   * Decrement numeric cached value
   */
  async decrement(key: string, amount: number = 1): Promise<number | null> {
    return this.increment(key, -amount);
  }

  /**
   * Get or set value (with factory function)
   */
  async getOrSet<T>(
    key: string,
    factory: () => Promise<T>,
    config?: { ttl?: number }
  ): Promise<T> {
    const cached = await this.get<T>(key, config);
    if (cached !== null) {
      return cached;
    }

    const data = await factory();
    await this.set(key, data, config);
    return data;
  }

  /**
   * Set multiple values
   */
  async mset<T extends Record<string, any>>(entries: T, config?: { ttl?: number }): Promise<void> {
    const promises = Object.entries(entries).map(([key, value]) =>
      this.set(key, value, config)
    );
    await Promise.all(promises);
  }

  /**
   * Get multiple values
   */
  async mget<T>(keys: string[]): Promise<Array<T | null>> {
    const promises = keys.map(key => this.get<T>(key));
    return Promise.all(promises);
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<CacheConfig>): void {
    this.config = { ...this.config, ...config };

    // If cache was disabled, clear it
    if (!this.config.enabled) {
      this.cache.clear();
    }
  }

  /**
   * Get configuration
   */
  getConfig(): CacheConfig {
    return { ...this.config };
  }

  /**
   * Cleanup manager
   */
  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = undefined;
    }
    this.cache.clear();
  }

  /**
   * Clean expired entries
   */
  private async cleanup(): Promise<void> {
    const now = Date.now();
    const keysToDelete: string[] = [];

    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        keysToDelete.push(key);
      }
    }

    for (const key of keysToDelete) {
      this.cache.delete(key);
    }

    if (keysToDelete.length > 0) {
      this.stats.entries = this.cache.size;
    }
  }

  /**
   * Evict oldest entries based on strategy
   */
  private evictOldest(): void {
    const strategy = this.config.strategy || 'lru';

    switch (strategy) {
      case 'lru':
        this.evictLRU();
        break;
      case 'fifo':
        this.evictFIFO();
        break;
      default:
        this.evictLRU();
    }
  }

  /**
   * Evict least recently used entry
   */
  private evictLRU(): void {
    let oldestKey: string | null = null;
    let oldestTime = Date.now();
    let leastHits = Infinity;

    for (const [key, entry] of this.cache.entries()) {
      if (entry.hits < leastHits || (entry.hits === leastHits && entry.timestamp < oldestTime)) {
        oldestKey = key;
        oldestTime = entry.timestamp;
        leastHits = entry.hits;
      }
    }

    if (oldestKey) {
      this.cache.delete(oldestKey);
      this.stats.entries = this.cache.size;
    }
  }

  /**
   * Evict first in entry
   */
  private evictFIFO(): void {
    let oldestKey: string | null = null;
    let oldestTime = Date.now();

    for (const [key, entry] of this.cache.entries()) {
      if (entry.timestamp < oldestTime) {
        oldestKey = key;
        oldestTime = entry.timestamp;
      }
    }

    if (oldestKey) {
      this.cache.delete(oldestKey);
      this.stats.entries = this.cache.size;
    }
  }

  /**
   * Update hit rate
   */
  private updateHitRate(): void {
    const total = this.stats.hits + this.stats.misses;
    this.stats.hitRate = total > 0 ? this.stats.hits / total : 0;
  }

  /**
   * Calculate approximate cache size in bytes
   */
  private calculateCacheSize(): number {
    let size = 0;
    for (const [key, entry] of this.cache.entries()) {
      size += this.calculateObjectSize(key);
      size += this.calculateObjectSize(entry);
    }
    return size;
  }

  /**
   * Calculate approximate object size in bytes
   */
  private calculateObjectSize(obj: any): number {
    try {
      return new Blob([JSON.stringify(obj)]).size;
    } catch {
      return 0;
    }
  }

  /**
   * Start cleanup interval
   */
  private startCleanupInterval(): void {
    // Clean up every minute
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 60 * 1000);
  }
}

/**
 * Response cache manager for API responses
 */
export class ResponseCacheManager extends CacheManager {
  /**
   * Generate cache key for API request
   */
  generateKey(method: string, path: string, params?: any): string {
    const keyData = {
      method,
      path,
      params: params || {}
    };
    return btoa(JSON.stringify(keyData));
  }

  /**
   * Cache API response
   */
  async cacheResponse<T>(
    method: string,
    path: string,
    response: ApiResponse<T>,
    params?: any,
    ttl?: number
  ): Promise<void> {
    // Only cache successful GET requests
    if (method !== 'GET' || !response.success) {
      return;
    }

    const key = this.generateKey(method, path, params);
    await this.set(key, response, { ttl });
  }

  /**
   * Get cached API response
   */
  async getCachedResponse<T>(
    method: string,
    path: string,
    params?: any
  ): Promise<ApiResponse<T> | null> {
    if (method !== 'GET') {
      return null;
    }

    const key = this.generateKey(method, path, params);
    return this.get<ApiResponse<T>>(key);
  }

  /**
   * Invalidate cache for specific path or pattern
   */
  async invalidate(pattern: string | RegExp): Promise<number> {
    const keys = await this.keys();
    const keysToDelete: string[] = [];

    for (const key of keys) {
      try {
        const keyData = JSON.parse(atob(key));
        const matches = typeof pattern === 'string'
          ? keyData.path.includes(pattern)
          : pattern.test(keyData.path);

        if (matches) {
          keysToDelete.push(key);
        }
      } catch {
        // Invalid key format, skip
      }
    }

    for (const key of keysToDelete) {
      await this.delete(key);
    }

    return keysToDelete.length;
  }

  /**
   * Warm cache with predefined responses
   */
  async warmCache(responses: Array<{
    method: string;
    path: string;
    response: any;
    params?: any;
    ttl?: number;
  }>): Promise<void> {
    const promises = responses.map(({ method, path, response, params, ttl }) =>
      this.cacheResponse(method, path, response, params, ttl)
    );
    await Promise.all(promises);
  }
}

/**
 * Multi-level cache manager (L1: memory, L2: persistent)
 */
export class MultiLevelCacheManager {
  private l1Cache: CacheManager;
  private l2Cache?: CacheManager;

  constructor(l1Config: CacheConfig, l2Config?: CacheConfig) {
    this.l1Cache = new CacheManager(l1Config);
    if (l2Config) {
      this.l2Cache = new CacheManager(l2Config);
    }
  }

  /**
   * Get value from cache levels
   */
  async get<T>(key: string, config?: { ttl?: number }): Promise<T | null> {
    // Try L1 cache first
    let value = await this.l1Cache.get<T>(key, config);
    if (value !== null) {
      return value;
    }

    // Try L2 cache
    if (this.l2Cache) {
      value = await this.l2Cache.get<T>(key, config);
      if (value !== null) {
        // Promote to L1 cache
        await this.l1Cache.set(key, value, config);
        return value;
      }
    }

    return null;
  }

  /**
   * Set value in all cache levels
   */
  async set<T>(key: string, data: T, config?: { ttl?: number }): Promise<void> {
    // Set in L1 cache
    await this.l1Cache.set(key, data, config);

    // Set in L2 cache if available
    if (this.l2Cache) {
      await this.l2Cache.set(key, data, config);
    }
  }

  /**
   * Delete value from all cache levels
   */
  async delete(key: string): Promise<boolean> {
    const l1Deleted = await this.l1Cache.delete(key);
    let l2Deleted = true;

    if (this.l2Cache) {
      l2Deleted = await this.l2Cache.delete(key);
    }

    return l1Deleted || l2Deleted;
  }

  /**
   * Clear all cache levels
   */
  async clear(): Promise<void> {
    await this.l1Cache.clear();
    if (this.l2Cache) {
      await this.l2Cache.clear();
    }
  }

  /**
   * Get combined statistics
   */
  async getStats(): Promise<MultiLevelCacheStats> {
    const l1Stats = this.l1Cache.getStats();
    let l2Stats: CacheStats | undefined;

    if (this.l2Cache) {
      l2Stats = this.l2Cache.getStats();
    }

    return {
      l1: l1Stats,
      l2: l2Stats,
      combined: {
        hits: l1Stats.hits + (l2Stats?.hits || 0),
        misses: l1Stats.misses + (l2Stats?.misses || 0),
        entries: l1Stats.entries + (l2Stats?.entries || 0),
        size: l1Stats.size + (l2Stats?.size || 0),
        hitRate: 0 // Will be calculated
      }
    };
  }

  /**
   * Destroy all cache levels
   */
  destroy(): void {
    this.l1Cache.destroy();
    if (this.l2Cache) {
      this.l2Cache.destroy();
    }
  }
}

/**
 * Multi-level cache statistics
 */
export interface MultiLevelCacheStats {
  l1: CacheStats;
  l2?: CacheStats;
  combined: {
    hits: number;
    misses: number;
    entries: number;
    size: number;
    hitRate: number;
  };
}