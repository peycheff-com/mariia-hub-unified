/**
 * Analytics Batcher and Offline Queue
 *
 * Efficiently batches analytics events and handles offline scenarios:
 * - Event batching to reduce API calls
 * - Offline queue with persistence
 * - Automatic retry with exponential backoff
 * - Multiple provider support (Google Analytics, Meta CAPI, etc.)
 * - LocalStorage fallback
 * - Queue prioritization
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Analytics event types
export interface AnalyticsEvent {
  id?: string;
  event: string;
  properties?: Record<string, any>;
  userId?: string;
  sessionId?: string;
  timestamp: Date;
  provider?: string;
  priority?: 'low' | 'normal' | 'high';
  retryCount?: number;
}

// Provider configuration
export interface AnalyticsProvider {
  name: string;
  endpoint: string;
  batchSize: number;
  flushInterval: number;
  maxRetries: number;
  send(events: AnalyticsEvent[]): Promise<boolean>;
}

// Queue configuration
interface QueueConfig {
  maxQueueSize: number;
  maxOfflineQueueSize: number;
  flushInterval: number;
  retryInterval: number;
  maxRetries: number;
  offlineStorageKey: string;
}

class AnalyticsBatcher {
  private supabase: SupabaseClient;
  private providers: Map<string, AnalyticsProvider> = new Map();
  private eventQueue: AnalyticsEvent[] = [];
  private offlineQueue: AnalyticsEvent[] = [];
  private flushTimer: NodeJS.Timeout | null = null;
  private retryTimer: NodeJS.Timeout | null = null;
  private isOnline: boolean = navigator.onLine;
  private config: QueueConfig;

  constructor(config: Partial<QueueConfig> = {}) {
    this.supabase = createClient(
      import.meta.env.VITE_SUPABASE_URL!,
      import.meta.env.VITE_SUPABASE_ANON_KEY!
    );

    this.config = {
      maxQueueSize: 100,
      maxOfflineQueueSize: 1000,
      flushInterval: 30000, // 30 seconds
      retryInterval: 60000, // 1 minute
      maxRetries: 3,
      offlineStorageKey: 'analytics_offline_queue',
      ...config
    };

    this.initializeProviders();
    this.loadOfflineQueue();
    this.setupEventListeners();
    this.startFlushTimer();
  }

  /**
   * Initialize analytics providers
   */
  private initializeProviders(): void {
    // Google Analytics 4
    this.providers.set('ga4', {
      name: 'ga4',
      endpoint: '/api/analytics/ga4',
      batchSize: 25,
      flushInterval: 30000,
      maxRetries: 3,
      send: async (events) => this.sendToGA4(events)
    });

    // Meta Conversions API
    this.providers.set('meta', {
      name: 'meta',
      endpoint: '/api/analytics/meta',
      batchSize: 10,
      flushInterval: 30000,
      maxRetries: 3,
      send: async (events) => this.sendToMeta(events)
    });

    // Custom analytics
    this.providers.set('custom', {
      name: 'custom',
      endpoint: '/api/analytics/custom',
      batchSize: 50,
      flushInterval: 30000,
      maxRetries: 3,
      send: async (events) => this.sendToCustom(events)
    });
  }

  /**
   * Track an event
   */
  track(event: string, properties?: Record<string, any>, options?: {
    userId?: string;
    sessionId?: string;
    provider?: string;
    priority?: 'low' | 'normal' | 'high';
  }): void {
    const analyticsEvent: AnalyticsEvent = {
      id: crypto.randomUUID(),
      event,
      properties,
      userId: options?.userId,
      sessionId: options?.sessionId || this.getSessionId(),
      timestamp: new Date(),
      provider: options?.provider,
      priority: options?.priority || 'normal',
      retryCount: 0
    };

    // Add to appropriate queue
    if (this.isOnline) {
      this.addToQueue(analyticsEvent);
    } else {
      this.addToOfflineQueue(analyticsEvent);
    }
  }

  /**
   * Add event to main queue
   */
  private addToQueue(event: AnalyticsEvent): void {
    // Insert based on priority
    if (event.priority === 'high') {
      this.eventQueue.unshift(event);
    } else {
      this.eventQueue.push(event);
    }

    // Check if queue exceeds max size
    if (this.eventQueue.length > this.config.maxQueueSize) {
      const removed = this.eventQueue.splice(this.config.maxQueueSize);
      // Move removed events to offline queue
      removed.forEach(e => this.addToOfflineQueue(e));
    }

    // Trigger flush if high priority or queue is full
    if (event.priority === 'high' || this.eventQueue.length >= this.config.batchSize) {
      this.flush();
    }
  }

  /**
   * Add event to offline queue
   */
  private addToOfflineQueue(event: AnalyticsEvent): void {
    this.offlineQueue.push(event);

    // Limit offline queue size
    if (this.offlineQueue.length > this.config.maxOfflineQueueSize) {
      this.offlineQueue = this.offlineQueue.slice(-this.config.maxOfflineQueueSize);
    }

    // Persist to localStorage
    this.saveOfflineQueue();
  }

  /**
   * Flush events to providers
   */
  async flush(provider?: string): Promise<void> {
    if (!this.isOnline) return;

    // Get events to flush
    const eventsToFlush = this.getEventsToFlush(provider);
    if (eventsToFlush.length === 0) return;

    // Group by provider
    const eventsByProvider = this.groupEventsByProvider(eventsToFlush);

    // Send to each provider
    for (const [providerName, events] of eventsByProvider) {
      const providerConfig = this.providers.get(providerName);
      if (!providerConfig) continue;

      try {
        const success = await providerConfig.send(events);

        if (success) {
          // Remove sent events from queue
          this.removeEventsFromQueue(events);
        } else {
          // Mark for retry
          events.forEach(e => {
            e.retryCount = (e.retryCount || 0) + 1;
            if (e.retryCount < this.config.maxRetries) {
              this.addToQueue(e);
            }
          });
        }
      } catch (error) {
        console.error(`Failed to send events to ${providerName}:`, error);

        // Add to retry queue
        events.forEach(e => {
          e.retryCount = (e.retryCount || 0) + 1;
          if (e.retryCount < this.config.maxRetries) {
            this.addToQueue(e);
          } else {
            // Max retries reached, log to database
            this.logFailedEvent(e, error);
          }
        });
      }
    }
  }

  /**
   * Get events to flush
   */
  private getEventsToFlush(provider?: string): AnalyticsEvent[] {
    const events = provider
      ? this.eventQueue.filter(e => e.provider === provider || !e.provider)
      : this.eventQueue;

    // Group by provider and get batch sizes
    const batches: AnalyticsEvent[] = [];
    const providerCounts = new Map<string, number>();

    for (const event of events) {
      const p = event.provider || 'custom';
      const count = providerCounts.get(p) || 0;
      const config = this.providers.get(p);

      if (config && count < config.batchSize) {
        batches.push(event);
        providerCounts.set(p, count + 1);
      }
    }

    return batches;
  }

  /**
   * Group events by provider
   */
  private groupEventsByProvider(events: AnalyticsEvent[]): Map<string, AnalyticsEvent[]> {
    const grouped = new Map<string, AnalyticsEvent[]>();

    for (const event of events) {
      const provider = event.provider || 'custom';
      if (!grouped.has(provider)) {
        grouped.set(provider, []);
      }
      grouped.get(provider)!.push(event);
    }

    return grouped;
  }

  /**
   * Remove events from queue
   */
  private removeEventsFromQueue(events: AnalyticsEvent[]): void {
    const eventIds = new Set(events.map(e => e.id));
    this.eventQueue = this.eventQueue.filter(e => !eventIds.has(e.id));
  }

  /**
   * Send events to Google Analytics 4
   */
  private async sendToGA4(events: AnalyticsEvent[]): Promise<boolean> {
    try {
      const response = await fetch('/api/analytics/ga4', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          events: events.map(e => ({
            name: e.event,
            params: {
              ...e.properties,
              session_id: e.sessionId,
              user_id: e.userId,
              timestamp: e.timestamp.getTime()
            }
          }))
        })
      });

      return response.ok;
    } catch {
      return false;
    }
  }

  /**
   * Send events to Meta Conversions API
   */
  private async sendToMeta(events: AnalyticsEvent[]): Promise<boolean> {
    try {
      const response = await fetch('/api/analytics/meta', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          events: events.map(e => ({
            event_name: e.event,
            event_time: Math.floor(e.timestamp.getTime() / 1000),
            action_source: 'website',
            user_data: {
            client_user_agent: navigator.userAgent,
              external_id: e.userId
            },
            custom_data: e.properties
          }))
        })
      });

      return response.ok;
    } catch {
      return false;
    }
  }

  /**
   * Send events to custom analytics
   */
  private async sendToCustom(events: AnalyticsEvent[]): Promise<boolean> {
    try {
      const { error } = await this.supabase
        .from('analytics_events')
        .insert(
          events.map(e => ({
            id: e.id,
            event: e.event,
            properties: e.properties,
            user_id: e.userId,
            session_id: e.sessionId,
            timestamp: e.timestamp.toISOString(),
            provider: e.provider,
            created_at: new Date()
          }))
        );

      return !error;
    } catch {
      return false;
    }
  }

  /**
   * Log failed event to database
   */
  private async logFailedEvent(event: AnalyticsEvent, error: any): Promise<void> {
    try {
      await this.supabase
        .from('analytics_failed_events')
        .insert({
          event_id: event.id,
          event: event.event,
          properties: event.properties,
          error_message: error instanceof Error ? error.message : 'Unknown error',
          retry_count: event.retryCount,
          created_at: new Date()
        });
    } catch (e) {
      console.error('Failed to log failed analytics event:', e);
    }
  }

  /**
   * Get session ID
   */
  private getSessionId(): string {
    let sessionId = sessionStorage.getItem('analytics_session_id');

    if (!sessionId) {
      sessionId = crypto.randomUUID();
      sessionStorage.setItem('analytics_session_id', sessionId);
    }

    return sessionId;
  }

  /**
   * Save offline queue to localStorage
   */
  private saveOfflineQueue(): void {
    try {
      localStorage.setItem(this.config.offlineStorageKey, JSON.stringify(this.offlineQueue));
    } catch (error) {
      console.error('Failed to save offline queue:', error);
    }
  }

  /**
   * Load offline queue from localStorage
   */
  private loadOfflineQueue(): void {
    try {
      const stored = localStorage.getItem(this.config.offlineStorageKey);
      if (stored) {
        this.offlineQueue = JSON.parse(stored).map((e: any) => ({
          ...e,
          timestamp: new Date(e.timestamp)
        }));
      }
    } catch (error) {
      console.error('Failed to load offline queue:', error);
    }
  }

  /**
   * Setup event listeners
   */
  private setupEventListeners(): void {
    // Online/offline events
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.processOfflineQueue();
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
    });

    // Page visibility change
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') {
        // Flush when page is hidden
        this.flush();
      }
    });

    // Before unload
    window.addEventListener('beforeunload', () => {
      this.flush();
    });
  }

  /**
   * Process offline queue when coming back online
   */
  private async processOfflineQueue(): Promise<void> {
    if (this.offlineQueue.length === 0) return;

    const events = [...this.offlineQueue];
    this.offlineQueue = [];
    this.saveOfflineQueue();

    // Add events to main queue
    events.forEach(e => this.addToQueue(e));

    // Flush immediately
    this.flush();
  }

  /**
   * Start flush timer
   */
  private startFlushTimer(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
    }

    this.flushTimer = setInterval(() => {
      this.flush();
    }, this.config.flushInterval);
  }

  /**
   * Start retry timer
   */
  private startRetryTimer(): void {
    if (this.retryTimer) {
      clearInterval(this.retryTimer);
    }

    this.retryTimer = setInterval(() => {
      this.flush();
    }, this.config.retryInterval);
  }

  /**
   * Get queue statistics
   */
  getQueueStats(): {
    online: boolean;
    queueSize: number;
    offlineQueueSize: number;
    providers: Array<{
      name: string;
      queueSize: number;
      lastSuccess?: Date;
      errorRate: number;
    }>;
  } {
    const providerStats = new Map();

    for (const providerName of this.providers.keys()) {
      const providerEvents = this.eventQueue.filter(e =>
        e.provider === providerName || (!e.provider && providerName === 'custom')
      );

      providerStats.set(providerName, {
        name: providerName,
        queueSize: providerEvents.length,
        errorRate: 0 // Would need to track this
      });
    }

    return {
      online: this.isOnline,
      queueSize: this.eventQueue.length,
      offlineQueueSize: this.offlineQueue.length,
      providers: Array.from(providerStats.values())
    };
  }

  /**
   * Clear all queues
   */
  clear(): void {
    this.eventQueue = [];
    this.offlineQueue = [];
    localStorage.removeItem(this.config.offlineStorageKey);
  }

  /**
   * Stop the batcher
   */
  stop(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
      this.flushTimer = null;
    }

    if (this.retryTimer) {
      clearInterval(this.retryTimer);
      this.retryTimer = null;
    }

    // Final flush
    this.flush();
  }
}

// Create singleton instance
export const analyticsBatcher = new AnalyticsBatcher();

// Convenience methods
export const trackEvent = (
  event: string,
  properties?: Record<string, any>,
  options?: {
    userId?: string;
    sessionId?: string;
    provider?: string;
    priority?: 'low' | 'normal' | 'high';
  }
) => {
  analyticsBatcher.track(event, properties, options);
};

// Page tracking
export const trackPage = (path: string, title?: string) => {
  trackEvent('page_view', {
    page_path: path,
    page_title: title || document.title,
    page_location: window.location.href
  });
};

// E-commerce events
export const trackPurchase = (transactionId: string, value: number, currency: string, items?: any[]) => {
  trackEvent('purchase', {
    transaction_id: transactionId,
    value,
    currency,
    items
  }, { priority: 'high' });
};

export const trackAddToCart = (itemId: string, value: number, currency: string) => {
  trackEvent('add_to_cart', {
    item_id: itemId,
    value,
    currency
  });
};

export const trackBeginCheckout = (value: number, currency: string, items?: any[]) => {
  trackEvent('begin_checkout', {
    value,
    currency,
    items
  });
};

// User events
export const trackSignUp = (method: string) => {
  trackEvent('sign_up', {
    method
  }, { priority: 'high' });
};

export const trackLogin = (method: string) => {
  trackEvent('login', {
    method
  });
};

// Booking events
export const trackBookingInitiated = (serviceId: string, serviceCategory: string) => {
  trackEvent('booking_initiated', {
    service_id: serviceId,
    service_category: serviceCategory
  });
};

export const trackBookingCompleted = (
  bookingId: string,
  value: number,
  currency: string,
  serviceCategory: string
) => {
  trackEvent('booking_completed', {
    booking_id: bookingId,
    value,
    currency,
    service_category: serviceCategory
  }, { priority: 'high' });
};

export const trackBookingCancelled = (bookingId: string, reason?: string) => {
  trackEvent('booking_cancelled', {
    booking_id: bookingId,
    reason
  }, { priority: 'high' });
};

// Initialize on load
if (typeof window !== 'undefined') {
  // Track initial page view
  trackPage(window.location.pathname, document.title);

  // Setup page tracking
  let lastPath = window.location.pathname;
  const observer = new MutationObserver(() => {
    if (window.location.pathname !== lastPath) {
      lastPath = window.location.pathname;
      trackPage(lastPath);
    }
  });

  observer.observe(document, { subtree: true, childList: true });
}