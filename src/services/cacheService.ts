import Redis from 'ioredis';

import { ServiceType, LocationType , TimeSlot, Service } from '@/stores/bookingStore';
import { logger } from '@/lib/logger';

// Cache configuration
const CACHE_CONFIG = {
  host: import.meta.env.VITE_REDIS_HOST || 'localhost',
  port: parseInt(import.meta.env.VITE_REDIS_PORT || '6379'),
  password: import.meta.env.VITE_REDIS_PASSWORD,
  db: parseInt(import.meta.env.VITE_REDIS_DB || '0'),
  keyPrefix: 'mariia:',
  retryDelayOnFailover: 100,
  maxRetriesPerRequest: 3,
};

// TTL configurations (in seconds)
const TTL = {
  AVAILABILITY: 300, // 5 minutes
  SERVICES: 3600, // 1 hour
  HOLDS: 600, // 10 minutes
  BOOKINGS: 1800, // 30 minutes
  CALENDAR: 900, // 15 minutes
  ADMIN_STATS: 60, // 1 minute
};

export interface CachedAvailability {
  serviceId: string;
  serviceType: ServiceType;
  location: LocationType;
  slots: TimeSlot[];
  lastUpdated: Date;
  version: number;
}

export interface CachedHold {
  slotId: string;
  userId: string;
  expiresAt: Date;
  sessionId: string;
}

export class CacheService {
  private static instance: CacheService;
  private redis: Redis | null = null;
  private isConnected = false;
  private connectionPromise: Promise<void> | null = null;

  static getInstance(): CacheService {
    if (!CacheService.instance) {
      CacheService.instance = new CacheService();
    }
    return CacheService.instance;
  }

  // Connection management
  async connect(): Promise<void> {
    if (this.isConnected || this.connectionPromise) {
      return this.connectionPromise || Promise.resolve();
    }

    this.connectionPromise = this.establishConnection();
    return this.connectionPromise;
  }

  private async establishConnection(): Promise<void> {
    try {
      this.redis = new Redis(CACHE_CONFIG);

      this.redis.on('connect', () => {
        logger.info('Redis connected');
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

      // Test connection
      await this.redis.ping();
    } catch (error) {
      logger.error('Failed to connect to Redis:', error);
      this.redis = null;
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    if (this.redis) {
      await this.redis.quit();
      this.redis = null;
      this.isConnected = false;
    }
  }

  private ensureConnected(): void {
    if (!this.isConnected || !this.redis) {
      throw new Error('Redis not connected. Call connect() first.');
    }
  }

  // Availability caching
  async cacheAvailability(
    serviceId: string,
    location: LocationType,
    date: Date,
    slots: TimeSlot[]
  ): Promise<void> {
    try {
      this.ensureConnected();

      const key = this.getAvailabilityKey(serviceId, location, date);
      const data: CachedAvailability = {
        serviceId,
        serviceType: slots[0]?.location === 'fitness' ? 'fitness' : 'beauty',
        location,
        slots,
        lastUpdated: new Date(),
        version: Date.now(),
      };

      await this.redis.setex(
        key,
        TTL.AVAILABILITY,
        JSON.stringify(data)
      );

      // Also cache by date for admin views
      const dateKey = this.getAvailabilityByDateKey(date, data.serviceType, location);
      await this.redis.sadd(dateKey, serviceId);
      await this.redis.expire(dateKey, TTL.AVAILABILITY);

      logger.debug(`Cached availability for ${key}`);
    } catch (error) {
      logger.error('Failed to cache availability:', error);
    }
  }

  async getAvailabilityFromCache(
    serviceId: string,
    location: LocationType,
    date: Date
  ): Promise<CachedAvailability | null> {
    try {
      this.ensureConnected();

      const key = this.getAvailabilityKey(serviceId, location, date);
      const cached = await this.redis.get(key);

      if (cached) {
        const data: CachedAvailability = JSON.parse(cached);
        logger.debug(`Cache hit for ${key}`);
        return data;
      }

      logger.debug(`Cache miss for ${key}`);
      return null;
    } catch (error) {
      logger.error('Failed to get availability from cache:', error);
      return null;
    }
  }

  async invalidateAvailability(
    serviceId: string,
    location: LocationType,
    date: Date
  ): Promise<void> {
    try {
      this.ensureConnected();

      const key = this.getAvailabilityKey(serviceId, location, date);
      await this.redis.del(key);

      // Also invalidate date-based cache
      const serviceType = location === 'fitness' ? 'fitness' : 'beauty';
      const dateKey = this.getAvailabilityByDateKey(date, serviceType, location);
      await this.redis.srem(dateKey, serviceId);

      logger.debug(`Invalidated cache for ${key}`);
    } catch (error) {
      logger.error('Failed to invalidate availability:', error);
    }
  }

  // Hold caching
  async cacheHold(hold: CachedHold): Promise<void> {
    try {
      this.ensureConnected();

      const key = this.getHoldKey(hold.slotId);
      await this.redis.setex(
        key,
        Math.max(0, Math.floor((hold.expiresAt.getTime() - Date.now()) / 1000)),
        JSON.stringify(hold)
      );

      // Also cache by user and session
      const userKey = this.getUserHoldsKey(hold.userId);
      await this.redis.sadd(userKey, hold.slotId);
      await this.redis.expire(userKey, TTL.HOLDS);

      const sessionKey = this.getSessionHoldsKey(hold.sessionId);
      await this.redis.sadd(sessionKey, hold.slotId);
      await this.redis.expire(sessionKey, TTL.HOLDS);

      logger.debug(`Cached hold for slot ${hold.slotId}`);
    } catch (error) {
      logger.error('Failed to cache hold:', error);
    }
  }

  async getHoldFromCache(slotId: string): Promise<CachedHold | null> {
    try {
      this.ensureConnected();

      const key = this.getHoldKey(slotId);
      const cached = await this.redis.get(key);

      if (cached) {
        const hold: CachedHold = JSON.parse(cached);

        // Check if hold has expired
        if (new Date(hold.expiresAt) > new Date()) {
          return hold;
        } else {
          // Remove expired hold
          await this.removeHoldFromCache(slotId);
        }
      }

      return null;
    } catch (error) {
      logger.error('Failed to get hold from cache:', error);
      return null;
    }
  }

  async removeHoldFromCache(slotId: string): Promise<void> {
    try {
      this.ensureConnected();

      const key = this.getHoldKey(slotId);
      const cached = await this.redis.get(key);

      if (cached) {
        const hold: CachedHold = JSON.parse(cached);

        // Remove from all caches
        await this.redis.del(key);
        await this.redis.srem(this.getUserHoldsKey(hold.userId), slotId);
        await this.redis.srem(this.getSessionHoldsKey(hold.sessionId), slotId);
      }

      logger.debug(`Removed hold from cache for slot ${slotId}`);
    } catch (error) {
      logger.error('Failed to remove hold from cache:', error);
    }
  }

  // Service caching
  async cacheServices(services: Service[]): Promise<void> {
    try {
      this.ensureConnected();

      const key = 'services:all';
      await this.redis.setex(
        key,
        TTL.SERVICES,
        JSON.stringify({
          data: services,
          lastUpdated: new Date(),
        })
      );

      logger.debug(`Cached ${services.length} services`);
    } catch (error) {
      logger.error('Failed to cache services:', error);
    }
  }

  async getServicesFromCache(): Promise<Service[] | null> {
    try {
      this.ensureConnected();

      const key = 'services:all';
      const cached = await this.redis.get(key);

      if (cached) {
        const { data } = JSON.parse(cached);
        logger.debug('Cache hit for services');
        return data;
      }

      return null;
    } catch (error) {
      logger.error('Failed to get services from cache:', error);
      return null;
    }
  }

  // Calendar caching for admin
  async cacheCalendarView(
    serviceType: ServiceType,
    startDate: Date,
    endDate: Date,
    data: any
  ): Promise<void> {
    try {
      this.ensureConnected();

      const key = this.getCalendarKey(serviceType, startDate, endDate);
      await this.redis.setex(
        key,
        TTL.CALENDAR,
        JSON.stringify({
          data,
          lastUpdated: new Date(),
        })
      );

      logger.debug(`Cached calendar view for ${serviceType}`);
    } catch (error) {
      logger.error('Failed to cache calendar view:', error);
    }
  }

  async getCalendarViewFromCache(
    serviceType: ServiceType,
    startDate: Date,
    endDate: Date
  ): Promise<any | null> {
    try {
      this.ensureConnected();

      const key = this.getCalendarKey(serviceType, startDate, endDate);
      const cached = await this.redis.get(key);

      if (cached) {
        const { data } = JSON.parse(cached);
        logger.debug(`Cache hit for calendar view ${serviceType}`);
        return data;
      }

      return null;
    } catch (error) {
      logger.error('Failed to get calendar view from cache:', error);
      return null;
    }
  }

  // Admin stats caching
  async cacheAdminStats(stats: any): Promise<void> {
    try {
      this.ensureConnected();

      const key = 'admin:stats';
      await this.redis.setex(
        key,
        TTL.ADMIN_STATS,
        JSON.stringify({
          data: stats,
          lastUpdated: new Date(),
        })
      );

      logger.debug('Cached admin stats');
    } catch (error) {
      logger.error('Failed to cache admin stats:', error);
    }
  }

  async getAdminStatsFromCache(): Promise<any | null> {
    try {
      this.ensureConnected();

      const key = 'admin:stats';
      const cached = await this.redis.get(key);

      if (cached) {
        const { data } = JSON.parse(cached);
        logger.debug('Cache hit for admin stats');
        return data;
      }

      return null;
    } catch (error) {
      logger.error('Failed to get admin stats from cache:', error);
      return null;
    }
  }

  // Cache invalidation methods
  async invalidateService(serviceId: string): Promise<void> {
    try {
      this.ensureConnected();

      // Invalidate service cache
      await this.redis.del('services:all');

      // Find and invalidate all availability for this service
      const pattern = `availability:${serviceId}:*`;
      const keys = await this.redis.keys(pattern);
      if (keys.length > 0) {
        await this.redis.del(...keys);
      }

      logger.debug(`Invalidated cache for service ${serviceId}`);
    } catch (error) {
      logger.error('Failed to invalidate service cache:', error);
    }
  }

  async invalidateDate(date: Date, serviceType?: ServiceType): Promise<void> {
    try {
      this.ensureConnected();

      const dateStr = date.toISOString().split('T')[0];
      let pattern = `availability:*:*:${dateStr}`;

      if (serviceType) {
        pattern = `availability:*:${serviceType}:${dateStr}`;
      }

      const keys = await this.redis.keys(pattern);
      if (keys.length > 0) {
        await this.redis.del(...keys);
      }

      logger.debug(`Invalidated cache for date ${dateStr}`);
    } catch (error) {
      logger.error('Failed to invalidate date cache:', error);
    }
  }

  async clearAllCache(): Promise<void> {
    try {
      this.ensureConnected();

      const pattern = `${CACHE_CONFIG.keyPrefix}*`;
      const keys = await this.redis.keys(pattern);
      if (keys.length > 0) {
        await this.redis.del(...keys);
      }

      logger.debug('Cleared all cache');
    } catch (error) {
      logger.error('Failed to clear cache:', error);
    }
  }

  // Utility methods
  private getAvailabilityKey(serviceId: string, location: LocationType, date: Date): string {
    const dateStr = date.toISOString().split('T')[0];
    return `availability:${serviceId}:${location}:${dateStr}`;
  }

  private getAvailabilityByDateKey(date: Date, serviceType: ServiceType, location: LocationType): string {
    const dateStr = date.toISOString().split('T')[0];
    return `availability_by_date:${dateStr}:${serviceType}:${location}`;
  }

  private getHoldKey(slotId: string): string {
    return `hold:${slotId}`;
  }

  private getUserHoldsKey(userId: string): string {
    return `user_holds:${userId}`;
  }

  private getSessionHoldsKey(sessionId: string): string {
    return `session_holds:${sessionId}`;
  }

  private getCalendarKey(serviceType: ServiceType, startDate: Date, endDate: Date): string {
    const start = startDate.toISOString().split('T')[0];
    const end = endDate.toISOString().split('T')[0];
    return `calendar:${serviceType}:${start}:${end}`;
  }

  // Health check
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

  // Cache statistics
  async getCacheStats(): Promise<any> {
    try {
      this.ensureConnected();

      const info = await this.redis.info('memory');
      const keyspace = await this.redis.info('keyspace');

      return {
        connected: this.isConnected,
        memory: info,
        keyspace,
      };
    } catch (error) {
      return {
        connected: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}

// Export singleton instance
export const cacheService = CacheService.getInstance();

// Initialize connection
cacheService.connect().catch(logger.error);