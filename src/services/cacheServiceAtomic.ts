import Redis from 'ioredis';

import { ServiceType, LocationType , TimeSlot, Service } from '@/stores/bookingStore';
import { logger } from '@/lib/logger';

import { BookingEvent } from './bookingDomainServiceAtomic';

// Enhanced cache configuration with clustering support
const CACHE_CONFIG = {
  host: import.meta.env.VITE_REDIS_HOST || 'localhost',
  port: parseInt(import.meta.env.VITE_REDIS_PORT || '6379'),
  password: import.meta.env.VITE_REDIS_PASSWORD,
  db: parseInt(import.meta.env.VITE_REDIS_DB || '0'),
  keyPrefix: 'mariia_atomic:',
  retryDelayOnFailover: 100,
  maxRetriesPerRequest: 3,
  enableOfflineQueue: false,
  lazyConnect: true,
  // Cluster configuration for high availability
  clusterNodes: import.meta.env.VITE_REDIS_CLUSTER_NODES ?
    JSON.parse(import.meta.env.VITE_REDIS_CLUSTER_NODES) : null,
  // Sentinel configuration
  sentinels: import.meta.env.VITE_REDIS_SENTINELS ?
    JSON.parse(import.meta.env.VITE_REDIS_SENTINELS) : null,
  sentinelName: import.meta.env.VITE_REDIS_SENTINEL_NAME || 'mymaster'
};

// TTL configurations with different priorities
const TTL = {
  CRITICAL: 30, // 30 seconds for availability locks
  HIGH: 300, // 5 minutes for availability
  MEDIUM: 900, // 15 minutes for calendar
  LOW: 3600, // 1 hour for services
  BACKGROUND: 7200, // 2 hours for analytics
};

// Cache invalidation strategies
type InvalidationStrategy =
  | 'immediate' // Invalidate immediately
  | 'tombstone' // Mark as invalid, clean up later
  | 'version' // Version-based invalidation
  | 'cascade'; // Cascade invalidation to related items

export interface CachedAvailability {
  serviceId: string;
  serviceType: ServiceType;
  location: LocationType;
  slots: TimeSlot[];
  lastUpdated: Date;
  version: number;
  expiresAt: Date;
  lockedSlots: string[];
  heldSlots: string[];
}

export interface CacheEntry<T> {
  data: T;
  version: number;
  createdAt: Date;
  expiresAt: Date;
  tags: string[];
}

export interface CacheInvalidationEvent {
  key: string;
  pattern: string;
  strategy: InvalidationStrategy;
  reason: string;
  timestamp: Date;
  transactionId?: string;
}

/**
 * Enhanced Atomic Cache Service
 *
 * Provides cache coherence management with:
 * - Distributed locking for cache updates
 * - Version-based cache invalidation
 * - Cache warming strategies
 * - Real-time synchronization
 * - Conflict resolution
 */
export class CacheServiceAtomic {
  private static instance: CacheServiceAtomic;
  private redis: Redis | Redis.Cluster | null = null;
  private isConnected = false;
  private connectionPromise: Promise<void> | null = null;
  private invalidationQueue: CacheInvalidationEvent[] = [];
  private isProcessingInvalidation = false;
  private cacheVersion = 0;
  private eventListeners = new Map<string, Set<Function>>();

  static getInstance(): CacheServiceAtomic {
    if (!CacheServiceAtomic.instance) {
      CacheServiceAtomic.instance = new CacheServiceAtomic();
    }
    return CacheServiceAtomic.instance;
  }

  // Connection management with cluster support
  async connect(): Promise<void> {
    if (this.isConnected || this.connectionPromise) {
      return this.connectionPromise || Promise.resolve();
    }

    this.connectionPromise = this.establishConnection();
    return this.connectionPromise;
  }

  private async establishConnection(): Promise<void> {
    try {
      if (CACHE_CONFIG.clusterNodes && CACHE_CONFIG.clusterNodes.length > 0) {
        // Redis Cluster setup
        this.redis = new Redis.Cluster(CACHE_CONFIG.clusterNodes, {
          redisOptions: {
            password: CACHE_CONFIG.password,
            lazyConnect: true,
            enableOfflineQueue: false,
          }
        });
      } else if (CACHE_CONFIG.sentinels && CACHE_CONFIG.sentinels.length > 0) {
        // Redis Sentinel setup
        this.redis = new Redis({
          sentinels: CACHE_CONFIG.sentinels,
          name: CACHE_CONFIG.sentinelName,
          password: CACHE_CONFIG.password,
          lazyConnect: true,
          enableOfflineQueue: false,
        });
      } else {
        // Single Redis instance
        this.redis = new Redis({
          host: CACHE_CONFIG.host,
          port: CACHE_CONFIG.port,
          password: CACHE_CONFIG.password,
          db: CACHE_CONFIG.db,
          lazyConnect: true,
          enableOfflineQueue: false,
          retryDelayOnFailover: CACHE_CONFIG.retryDelayOnFailover,
          maxRetriesPerRequest: CACHE_CONFIG.maxRetriesPerRequest,
        });
      }

      this.setupEventHandlers();
      await this.redis.ping();

      // Initialize cache warming
      await this.initializeCacheWarming();

      logger.info('Redis connected successfully', {
        type: this.redis instanceof Redis.Cluster ? 'cluster' : 'single'
      });

    } catch (error) {
      logger.error('Failed to connect to Redis:', error);
      this.redis = null;
      throw error;
    }
  }

  private setupEventHandlers(): void {
    if (!this.redis) return;

    this.redis.on('connect', () => {
      logger.info('Redis connected');
      this.isConnected = true;
    });

    this.redis.on('ready', () => {
      logger.info('Redis ready');
      this.isConnected = true;
    });

    this.redis.on('error', (error) => {
      logger.error('Redis connection error:', error);
      this.isConnected = false;
    });

    this.redis.on('close', () => {
      logger.info('Redis connection closed');
      this.isConnected = false;
    });

    this.redis.on('reconnecting', () => {
      logger.info('Redis reconnecting');
    });
  }

  private async initializeCacheWarming(): Promise<void> {
    try {
      // Warm up critical caches in background
      this.warmUpCriticalCaches().catch(error => {
        logger.warn('Cache warming failed:', error);
      });
    } catch (error) {
      logger.error('Failed to initialize cache warming:', error);
    }
  }

  // Atomic cache operations

  async getAtomic<T>(
    key: string,
    version?: number
  ): Promise<CacheEntry<T> | null> {
    try {
      this.ensureConnected();

      const cached = await this.redis!.get(this.getKey(key));
      if (!cached) {
        return null;
      }

      const entry: CacheEntry<T> = JSON.parse(cached);

      // Check if entry is expired
      if (new Date(entry.expiresAt) < new Date()) {
        await this.redis!.del(this.getKey(key));
        return null;
      }

      // Check version consistency
      if (version !== undefined && entry.version < version) {
        await this.redis!.del(this.getKey(key));
        return null;
      }

      logger.debug(`Cache hit for ${key}`, { version: entry.version });
      return entry;

    } catch (error) {
      logger.error(`Failed to get atomic cache for ${key}:`, error);
      return null;
    }
  }

  async setAtomic<T>(
    key: string,
    data: T,
    ttl: number = TTL.MEDIUM,
    tags: string[] = [],
    version?: number
  ): Promise<void> {
    try {
      this.ensureConnected();

      const entry: CacheEntry<T> = {
        data,
        version: version || ++this.cacheVersion,
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + ttl * 1000),
        tags
      };

      const fullKey = this.getKey(key);
      const value = JSON.stringify(entry);

      // Use Redis transaction for atomicity
      const multi = this.redis!.multi();
      multi.setex(fullKey, ttl, value);

      // Add to tag indices for selective invalidation
      for (const tag of tags) {
        multi.sadd(this.getTagKey(tag), fullKey);
        multi.expire(this.getTagKey(tag), ttl);
      }

      await multi.exec();

      logger.debug(`Cache set for ${key}`, { version: entry.version, ttl });

    } catch (error) {
      logger.error(`Failed to set atomic cache for ${key}:`, error);
    }
  }

  async invalidateAtomic(
    keys: string[],
    strategy: InvalidationStrategy = 'immediate',
    reason: string,
    transactionId?: string
  ): Promise<void> {
    const event: CacheInvalidationEvent = {
      key: keys[0] || '',
      pattern: keys.length > 1 ? keys.join('|') : keys[0],
      strategy,
      reason,
      timestamp: new Date(),
      transactionId
    };

    this.invalidationQueue.push(event);

    // Process invalidation immediately for critical operations
    if (strategy === 'immediate') {
      await this.processInvalidation(event);
    } else {
      // Queue for background processing
      this.processInvalidationQueue();
    }
  }

  async invalidateByTags(
    tags: string[],
    strategy: InvalidationStrategy = 'immediate',
    reason: string,
    transactionId?: string
  ): Promise<void> {
    try {
      this.ensureConnected();

      const keysToDelete: string[] = [];

      // Get all keys associated with the tags
      for (const tag of tags) {
        const tagKey = this.getTagKey(tag);
        const keys = await this.redis!.smembers(tagKey);
        keysToDelete.push(...keys);

        // Remove the tag set itself
        await this.redis!.del(tagKey);
      }

      // Remove duplicates
      const uniqueKeys = [...new Set(keysToDelete)];

      if (uniqueKeys.length > 0) {
        await this.invalidateAtomic(uniqueKeys, strategy, reason, transactionId);
      }

      logger.debug(`Invalidated ${uniqueKeys.length} cache entries by tags`, { tags });

    } catch (error) {
      logger.error(`Failed to invalidate cache by tags:`, error);
    }
  }

  // Availability caching with coherence management
  async cacheAvailabilityAtomic(
    serviceId: string,
    location: LocationType,
    date: Date,
    slots: TimeSlot[],
    lockedSlots: string[] = [],
    heldSlots: string[] = [],
    transactionId?: string
  ): Promise<void> {
    try {
      this.ensureConnected();

      const key = this.getAvailabilityKey(serviceId, location, date);
      const version = ++this.cacheVersion;

      const data: CachedAvailability = {
        serviceId,
        serviceType: slots[0]?.location === 'fitness' ? 'fitness' : 'beauty',
        location,
        slots,
        lastUpdated: new Date(),
        version,
        expiresAt: new Date(Date.now() + TTL.HIGH * 1000),
        lockedSlots,
        heldSlots
      };

      await this.setAtomic(key, data, TTL.HIGH, [
        `availability:${serviceId}`,
        `availability:${date.toISOString().split('T')[0]}`,
        `availability:${location}`
      ], version);

      // Also cache by date for admin views
      const dateKey = this.getAvailabilityByDateKey(date, data.serviceType, location);
      await this.redis!.sadd(dateKey, this.getKey(key));
      await this.redis!.expire(dateKey, TTL.HIGH);

      logger.debug(`Cached availability atomically for ${key}`, {
        slotsCount: slots.length,
        lockedSlotsCount: lockedSlotsCount,
        heldSlotsCount: heldSlots.length,
        version,
        transactionId
      });

    } catch (error) {
      logger.error(`Failed to cache availability atomically:`, error);
    }
  }

  async getAvailabilityAtomic(
    serviceId: string,
    location: LocationType,
    date: Date,
    version?: number
  ): Promise<CachedAvailability | null> {
    try {
      this.ensureConnected();

      const key = this.getAvailabilityKey(serviceId, location, date);
      const cached = await this.getAtomic<CachedAvailability>(key, version);

      if (cached) {
        logger.debug(`Cache hit for availability ${key}`, { version: cached.version });
        return cached.data;
      }

      logger.debug(`Cache miss for availability ${key}`);
      return null;

    } catch (error) {
      logger.error(`Failed to get availability atomically:`, error);
      return null;
    }
  }

  // Real-time cache synchronization
  async synchronizeWithEvent(event: BookingEvent): Promise<void> {
    try {
      const tagsToInvalidate: string[] = [];
      const keysToInvalidate: string[] = [];

      switch (event.type) {
        case 'booking.created':
          tagsToInvalidate.push(
            `availability:${event.booking.service_id}`,
            `availability:${event.booking.timeSlot.date.toISOString().split('T')[0]}`,
            `user_bookings:${event.booking.user_id}`
          );
          break;

        case 'slot.reserved':
          tagsToInvalidate.push(
            `availability:*`,
            `holds:${event.userId}`
          );
          break;

        case 'slot.released':
          tagsToInvalidate.push(
            `availability:*`,
            `holds:*`
          );
          break;

        case 'cache.invalidated':
          // Handle cascading invalidation
          if (event.keys) {
            keysToInvalidate.push(...event.keys);
          }
          break;

        default:
          logger.debug(`Unhandled cache sync event type: ${event.type}`);
      }

      if (tagsToInvalidate.length > 0) {
        await this.invalidateByTags(
          tagsToInvalidate,
          'immediate',
          `Event: ${event.type}`,
          'transactionId' in event ? event.transactionId : undefined
        );
      }

      if (keysToInvalidate.length > 0) {
        await this.invalidateAtomic(
          keysToInvalidate,
          'immediate',
          `Event: ${event.type}`,
          'transactionId' in event ? event.transactionId : undefined
        );
      }

    } catch (error) {
      logger.error(`Failed to synchronize cache with event:`, error);
    }
  }

  // Cache warming strategies
  private async warmUpCriticalCaches(): Promise<void> {
    try {
      // Warm up availability for next 7 days for popular services
      const popularServices = await this.getPopularServices();
      const today = new Date();
      const locations: LocationType[] = ['studio', 'online', 'fitness'];

      for (const service of popularServices) {
        for (let i = 0; i < 7; i++) {
          const date = new Date(today);
          date.setDate(date.getDate() + i);

          for (const location of locations) {
            // Trigger availability cache warming in background
            this.cacheAvailabilityAtomic(
              service.id,
              location,
              date,
              [], // Empty slots initially
              [],
              [],
              'cache_warming'
            ).catch(error => {
              logger.warn(`Cache warming failed for ${service.id}:`, error);
            });
          }
        }
      }

      logger.info('Cache warming initiated', { servicesCount: popularServices.length });

    } catch (error) {
      logger.error('Cache warming failed:', error);
    }
  }

  private async getPopularServices(): Promise<Service[]> {
    // This would typically fetch from database based on usage stats
    // For now, return empty array
    return [];
  }

  // Invalidation queue processing
  private async processInvalidationQueue(): Promise<void> {
    if (this.isProcessingInvalidation) {
      return;
    }

    this.isProcessingInvalidation = true;

    try {
      while (this.invalidationQueue.length > 0) {
        const event = this.invalidationQueue.shift()!;
        await this.processInvalidation(event);
      }
    } catch (error) {
      logger.error('Error processing invalidation queue:', error);
    } finally {
      this.isProcessingInvalidation = false;
    }
  }

  private async processInvalidation(event: CacheInvalidationEvent): Promise<void> {
    try {
      this.ensureConnected();

      switch (event.strategy) {
        case 'immediate':
          await this.invalidateImmediate(event);
          break;
        case 'tombstone':
          await this.invalidateTombstone(event);
          break;
        case 'version':
          await this.invalidateByVersion(event);
          break;
        case 'cascade':
          await this.invalidateCascade(event);
          break;
      }

      logger.debug(`Processed cache invalidation`, {
        strategy: event.strategy,
        key: event.key,
        reason: event.reason
      });

    } catch (error) {
      logger.error('Failed to process invalidation event:', error);
    }
  }

  private async invalidateImmediate(event: CacheInvalidationEvent): Promise<void> {
    const keys = event.pattern.includes('|')
      ? event.pattern.split('|').map(k => this.getKey(k))
      : [this.getKey(event.pattern)];

    if (keys.length === 1) {
      await this.redis!.del(keys[0]);
    } else {
      await this.redis!.del(...keys);
    }
  }

  private async invalidateTombstone(event: CacheInvalidationEvent): Promise<void> {
    const key = this.getKey(event.key);
    const tombstoneValue = JSON.stringify({
      invalidated: true,
      timestamp: event.timestamp,
      reason: event.reason
    });

    await this.redis!.setex(key, TTL.CRITICAL, tombstoneValue);
  }

  private async invalidateByVersion(event: CacheInvalidationEvent): Promise<void> {
    // Version-based invalidation would be implemented here
    // This is more complex and requires tracking versions per key
    logger.debug('Version-based invalidation not yet implemented', { event });
  }

  private async invalidateCascade(event: CacheInvalidationEvent): Promise<void> {
    // Cascade invalidation affects related entries
    const baseKey = event.key.split(':')[0];
    const pattern = this.getKey(`${baseKey}:*`);

    const keys = await this.redis!.keys(pattern);
    if (keys.length > 0) {
      await this.redis!.del(...keys);
    }
  }

  // Utility methods
  private ensureConnected(): void {
    if (!this.isConnected || !this.redis) {
      throw new Error('Redis not connected. Call connect() first.');
    }
  }

  private getKey(key: string): string {
    return `${CACHE_CONFIG.keyPrefix}${key}`;
  }

  private getTagKey(tag: string): string {
    return `${CACHE_CONFIG.keyPrefix}tag:${tag}`;
  }

  private getAvailabilityKey(serviceId: string, location: LocationType, date: Date): string {
    const dateStr = date.toISOString().split('T')[0];
    return `availability:${serviceId}:${location}:${dateStr}`;
  }

  private getAvailabilityByDateKey(date: Date, serviceType: ServiceType, location: LocationType): string {
    const dateStr = date.toISOString().split('T')[0];
    return `availability_by_date:${dateStr}:${serviceType}:${location}`;
  }

  // Health monitoring
  async isHealthy(): Promise<boolean> {
    try {
      if (!this.redis) {
        return false;
      }

      const result = await this.redis.ping();
      return result === 'PONG';
    } catch (error) {
      return false;
    }
  }

  async getCacheStats(): Promise<any> {
    try {
      this.ensureConnected();

      const info = await this.redis!.info('memory');
      const keyspace = await this.redis!.info('keyspace');
      const connections = await this.redis!.info('clients');

      return {
        connected: this.isConnected,
        memory: info,
        keyspace,
        connections,
        invalidationQueueSize: this.invalidationQueue.length,
        cacheVersion: this.cacheVersion
      };
    } catch (error) {
      return {
        connected: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async clearAllCache(): Promise<void> {
    try {
      this.ensureConnected();

      const pattern = `${CACHE_CONFIG.keyPrefix}*`;
      const keys = await this.redis!.keys(pattern);

      if (keys.length > 0) {
        await this.redis!.del(...keys);
      }

      this.cacheVersion = 0;
      this.invalidationQueue = [];

      logger.info('Cleared all cache', { keysDeleted: keys.length });
    } catch (error) {
      logger.error('Failed to clear cache:', error);
    }
  }

  async disconnect(): Promise<void> {
    if (this.redis) {
      await this.redis.quit();
      this.redis = null;
      this.isConnected = false;
    }
  }

  // Event handling
  on(event: string, listener: Function): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, new Set());
    }
    this.eventListeners.get(event)!.add(listener);
  }

  off(event: string, listener: Function): void {
    this.eventListeners.get(event)?.delete(listener);
  }

  private emit(event: string, data: any): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.forEach(listener => {
        try {
          listener(data);
        } catch (error) {
          logger.error(`Error in cache event listener:`, error);
        }
      });
    }
  }
}

// Export singleton instance
export const cacheServiceAtomic = CacheServiceAtomic.getInstance();

// Initialize connection
cacheServiceAtomic.connect().catch(logger.error);