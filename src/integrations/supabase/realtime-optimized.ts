// OPTIMIZED REAL-TIME SUBSCRIPTION MANAGEMENT
// Efficient WebSocket connection handling for booking system

import { SupabaseClient } from '@supabase/supabase-js';
import { supabaseOptimized } from './client-optimized';

interface RealtimeSubscription {
  id: string;
  channel: any;
  topic: string;
  filter?: string;
  callbacks: Set<(payload: any) => void>;
  isActive: boolean;
  lastActivity: number;
  reconnectAttempts: number;
  maxReconnectAttempts: number;
}

interface RealtimeConfig {
  maxSubscriptions: number;
  heartbeatInterval: number;
  reconnectDelay: number;
  maxReconnectAttempts: number;
  subscriptionTimeout: number;
  batchEvents: boolean;
  batchInterval: number;
}

class OptimizedRealtimeManager {
  private static instance: OptimizedRealtimeManager;
  private subscriptions: Map<string, RealtimeSubscription> = new Map();
  private config: RealtimeConfig;
  private heartbeatTimer?: NodeJS.Timeout;
  private batchTimer?: NodeJS.Timeout;
  private eventBatch: Map<string, any[]> = new Map();
  private connectionStatus: 'connecting' | 'connected' | 'disconnected' | 'error' = 'disconnected';

  private constructor() {
    this.config = {
      maxSubscriptions: 10, // Limit concurrent subscriptions
      heartbeatInterval: 30000, // 30 seconds
      reconnectDelay: 2000, // 2 seconds
      maxReconnectAttempts: 5,
      subscriptionTimeout: 10000, // 10 seconds
      batchEvents: true, // Enable event batching for performance
      batchInterval: 100 // 100ms batch interval
    };

    this.startHeartbeat();
    this.startBatchProcessor();
  }

  static getInstance(): OptimizedRealtimeManager {
    if (!OptimizedRealtimeManager.instance) {
      OptimizedRealtimeManager.instance = new OptimizedRealtimeManager();
    }
    return OptimizedRealtimeManager.instance;
  }

  // Optimized subscription management
  subscribe(
    topic: string,
    callback: (payload: any) => void,
    options: {
      filter?: string;
      priority?: 'high' | 'normal' | 'low';
    } = {}
  ): string {
    const subscriptionId = `${topic}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Check if we already have a subscription for this topic
    const existingSubscription = Array.from(this.subscriptions.values())
      .find(sub => sub.topic === topic && sub.filter === options.filter);

    if (existingSubscription) {
      // Add callback to existing subscription
      existingSubscription.callbacks.add(callback);
      existingSubscription.lastActivity = Date.now();
      return subscriptionId;
    }

    // Check subscription limit
    if (this.subscriptions.size >= this.config.maxSubscriptions) {
      console.warn('[REALTIME] Maximum subscriptions reached, removing oldest inactive subscription');
      this.removeOldestInactiveSubscription();
    }

    // Create new subscription
    const subscription: RealtimeSubscription = {
      id: subscriptionId,
      channel: null,
      topic,
      filter: options.filter,
      callbacks: new Set([callback]),
      isActive: false,
      lastActivity: Date.now(),
      reconnectAttempts: 0,
      maxReconnectAttempts: this.config.maxReconnectAttempts
    };

    this.subscriptions.set(subscriptionId, subscription);
    this.createSubscription(subscription);

    return subscriptionId;
  }

  private createSubscription(subscription: RealtimeSubscription) {
    try {
      const channelName = subscription.filter
        ? `${subscription.topic}:${subscription.filter}`
        : subscription.topic;

      let channel = supabaseOptimized.baseClient.channel(channelName);

      // Add event listeners based on topic
      if (subscription.topic.includes('bookings')) {
        channel = channel.on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'bookings',
          filter: subscription.filter
        }, (payload) => this.handleRealtimeEvent(subscription, payload));
      } else if (subscription.topic.includes('availability_slots')) {
        channel = channel.on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'availability_slots',
          filter: subscription.filter
        }, (payload) => this.handleRealtimeEvent(subscription, payload));
      } else if (subscription.topic.includes('services')) {
        channel = channel.on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'services',
          filter: subscription.filter
        }, (payload) => this.handleRealtimeEvent(subscription, payload));
      }

      // Subscribe with timeout
      const timeoutId = setTimeout(() => {
        if (!subscription.isActive) {
          console.error(`[REALTIME] Subscription timeout for ${subscription.topic}`);
          this.handleSubscriptionError(subscription, 'Subscription timeout');
        }
      }, this.config.subscriptionTimeout);

      channel.subscribe((status) => {
        clearTimeout(timeoutId);

        if (status === 'SUBSCRIBED') {
          subscription.isActive = true;
          subscription.lastActivity = Date.now();
          subscription.reconnectAttempts = 0;
          this.connectionStatus = 'connected';
          console.log(`[REALTIME] Successfully subscribed to ${subscription.topic}`);
        } else if (status === 'TIMED_OUT') {
          console.error(`[REALTIME] Subscription timeout for ${subscription.topic}`);
          this.handleSubscriptionError(subscription, 'Connection timeout');
        } else if (status === 'CLOSED') {
          console.warn(`[REALTIME] Connection closed for ${subscription.topic}`);
          this.handleSubscriptionError(subscription, 'Connection closed');
        }
      });

      subscription.channel = channel;
    } catch (error) {
      console.error(`[REALTIME] Failed to create subscription for ${subscription.topic}:`, error);
      this.handleSubscriptionError(subscription, error);
    }
  }

  private handleRealtimeEvent(subscription: RealtimeSubscription, payload: any) {
    subscription.lastActivity = Date.now();

    // Batch events if enabled
    if (this.config.batchEvents) {
      const events = this.eventBatch.get(subscription.id) || [];
      events.push(payload);
      this.eventBatch.set(subscription.id, events);
    } else {
      // Process immediately
      this.processEvent(subscription, payload);
    }
  }

  private processEvent(subscription: RealtimeSubscription, payload: any) {
    subscription.callbacks.forEach(callback => {
      try {
        callback(payload);
      } catch (error) {
        console.error('[REALTIME] Error in subscription callback:', error);
      }
    });
  }

  private startBatchProcessor() {
    if (!this.config.batchEvents) return;

    this.batchTimer = setInterval(() => {
      if (this.eventBatch.size === 0) return;

      for (const [subscriptionId, events] of this.eventBatch) {
        const subscription = this.subscriptions.get(subscriptionId);
        if (!subscription || !subscription.isActive) continue;

        // Process batched events
        if (events.length === 1) {
          this.processEvent(subscription, events[0]);
        } else {
          // Merge related events to reduce processing
          const mergedPayload = this.mergeSimilarEvents(events);
          this.processEvent(subscription, mergedPayload);
        }
      }

      this.eventBatch.clear();
    }, this.config.batchInterval);
  }

  private mergeSimilarEvents(events: any[]): any {
    if (events.length === 1) return events[0];

    // Simple merging logic - can be enhanced based on specific needs
    const latestEvent = events[events.length - 1];
    const allEvents = events.map(e => ({
      eventType: e.eventType,
      new: e.new,
      old: e.old,
      timestamp: e.timestamp
    }));

    return {
      ...latestEvent,
      batched: true,
      eventCount: events.length,
      allEvents
    };
  }

  private handleSubscriptionError(subscription: RealtimeSubscription, error: any) {
    subscription.isActive = false;
    subscription.reconnectAttempts++;

    if (subscription.reconnectAttempts < subscription.maxReconnectAttempts) {
      console.log(`[REALTIME] Attempting to reconnect ${subscription.topic} (attempt ${subscription.reconnectAttempts})`);

      setTimeout(() => {
        this.createSubscription(subscription);
      }, this.config.reconnectDelay * Math.pow(2, subscription.reconnectAttempts - 1));
    } else {
      console.error(`[REALTIME] Max reconnection attempts reached for ${subscription.topic}`);
      this.connectionStatus = 'error';
    }
  }

  private removeOldestInactiveSubscription() {
    let oldestSubscription: RealtimeSubscription | null = null;
    let oldestTime = Date.now();

    for (const subscription of this.subscriptions.values()) {
      if (!subscription.isActive && subscription.lastActivity < oldestTime) {
        oldestTime = subscription.lastActivity;
        oldestSubscription = subscription;
      }
    }

    if (oldestSubscription) {
      this.unsubscribe(oldestSubscription.id);
    }
  }

  unsubscribe(subscriptionId: string) {
    const subscription = this.subscriptions.get(subscriptionId);
    if (!subscription) return;

    // Clean up channel
    if (subscription.channel) {
      subscription.channel.unsubscribe();
    }

    // Clear callbacks
    subscription.callbacks.clear();

    // Remove from tracking
    this.subscriptions.delete(subscriptionId);

    // Clean up any batched events
    this.eventBatch.delete(subscriptionId);

    console.log(`[REALTIME] Unsubscribed from ${subscription.topic}`);
  }

  // Optimized booking-specific subscriptions
  subscribeToUserBookings(
    userId: string,
    callback: (payload: any) => void
  ): string {
    return this.subscribe('bookings', callback, {
      filter: `user_id=eq.${userId}`
    });
  }

  subscribeToServiceAvailability(
    serviceId: string,
    callback: (payload: any) => void
  ): string {
    return this.subscribe('availability_slots', callback, {
      filter: `service_id=eq.${serviceId}`,
      priority: 'high'
    });
  }

  subscribeToServiceUpdates(
    serviceId: string,
    callback: (payload: any) => void
  ): string {
    return this.subscribe('services', callback, {
      filter: `id=eq.${serviceId}`
    });
  }

  subscribeToBookingsForDate(
    date: string,
    callback: (payload: any) => void
  ): string {
    return this.subscribe('bookings', callback, {
      filter: `booking_date=eq.${date}`,
      priority: 'normal'
    });
  }

  // Connection health monitoring
  private startHeartbeat() {
    this.heartbeatTimer = setInterval(() => {
      this.checkConnectionHealth();
      this.cleanupInactiveSubscriptions();
    }, this.config.heartbeatInterval);
  }

  private async checkConnectionHealth() {
    try {
      const health = await supabaseOptimized.healthCheck();

      if (health.status === 'healthy' && health.responseTime < 1000) {
        if (this.connectionStatus !== 'connected') {
          this.connectionStatus = 'connected';
          console.log('[REALTIME] Connection restored');
          // Reconnect all inactive subscriptions
          this.reconnectAllSubscriptions();
        }
      } else {
        this.connectionStatus = 'error';
        console.warn('[REALTIME] Connection health issue:', health);
      }
    } catch (error) {
      this.connectionStatus = 'error';
      console.error('[REALTIME] Health check failed:', error);
    }
  }

  private cleanupInactiveSubscriptions() {
    const now = Date.now();
    const inactiveThreshold = 5 * 60 * 1000; // 5 minutes

    for (const [id, subscription] of this.subscriptions) {
      if (now - subscription.lastActivity > inactiveThreshold && !subscription.isActive) {
        console.log(`[REALTIME] Cleaning up inactive subscription: ${subscription.topic}`);
        this.unsubscribe(id);
      }
    }
  }

  private reconnectAllSubscriptions() {
    for (const subscription of this.subscriptions.values()) {
      if (!subscription.isActive) {
        subscription.reconnectAttempts = 0;
        this.createSubscription(subscription);
      }
    }
  }

  // Performance monitoring
  getConnectionStats() {
    const activeSubscriptions = Array.from(this.subscriptions.values()).filter(s => s.isActive);
    const inactiveSubscriptions = Array.from(this.subscriptions.values()).filter(s => !s.isActive);

    return {
      connectionStatus: this.connectionStatus,
      totalSubscriptions: this.subscriptions.size,
      activeSubscriptions: activeSubscriptions.length,
      inactiveSubscriptions: inactiveSubscriptions.length,
      config: this.config,
      batchedEvents: this.eventBatch.size
    };
  }

  // Cleanup
  destroy() {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
    }

    if (this.batchTimer) {
      clearInterval(this.batchTimer);
    }

    // Unsubscribe from all subscriptions
    for (const subscriptionId of this.subscriptions.keys()) {
      this.unsubscribe(subscriptionId);
    }

    this.subscriptions.clear();
    this.eventBatch.clear();
  }
}

// Export singleton instance
export const realtimeManager = OptimizedRealtimeManager.getInstance();

// Convenience exports for common use cases
export const subscribeToUserBookings = (userId: string, callback: (payload: any) => void) =>
  realtimeManager.subscribeToUserBookings(userId, callback);

export const subscribeToServiceAvailability = (serviceId: string, callback: (payload: any) => void) =>
  realtimeManager.subscribeToServiceAvailability(serviceId, callback);

export const subscribeToServiceUpdates = (serviceId: string, callback: (payload: any) => void) =>
  realtimeManager.subscribeToServiceUpdates(serviceId, callback);

export const subscribeToBookingsForDate = (date: string, callback: (payload: any) => void) =>
  realtimeManager.subscribeToBookingsForDate(date, callback);

export const unsubscribeFromRealtime = (subscriptionId: string) =>
  realtimeManager.unsubscribe(subscriptionId);

export const getRealtimeStats = () => realtimeManager.getConnectionStats();

// Development debugging
if (import.meta.env.DEV) {
  (window as any).realtimeDebug = {
    getStats: getRealtimeStats,
    destroy: () => realtimeManager.destroy()
  };
}