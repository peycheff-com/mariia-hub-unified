/**
 * Real-time Analytics Manager
 * Manages WebSocket connections and real-time data updates for analytics dashboard
 */

import { supabase } from '@/integrations/supabase/client'
import type { RealtimeChannel } from '@supabase/supabase-js'
import type { Database } from '@/integrations/supabase/types'

interface RealtimeConfig {
  enableAutoReconnect: boolean
  reconnectInterval: number
  maxReconnectAttempts: number
  heartbeatInterval: number
}

interface RealtimeEvent {
  type: string
  payload: any
  timestamp: string
  channel: string
}

interface RealtimeSubscription {
  id: string
  channel: RealtimeChannel
  eventTypes: string[]
  callback: (event: RealtimeEvent) => void
  isActive: boolean
}

class RealtimeAnalyticsManager {
  private static instance: RealtimeAnalyticsManager
  private config: RealtimeConfig
  private subscriptions: Map<string, RealtimeSubscription> = new Map()
  private heartbeatTimer: NodeJS.Timeout | null = null
  private isOnline = true
  private reconnectAttempts = 0

  private constructor(config: Partial<RealtimeConfig> = {}) {
    this.config = {
      enableAutoReconnect: true,
      reconnectInterval: 5000,
      maxReconnectAttempts: 10,
      heartbeatInterval: 30000, // 30 seconds
      ...config
    }

    this.initializeRealtime()
    this.setupEventListeners()
  }

  public static getInstance(config?: Partial<RealtimeConfig>): RealtimeAnalyticsManager {
    if (!RealtimeAnalyticsManager.instance) {
      RealtimeAnalyticsManager.instance = new RealtimeAnalyticsManager(config)
    }
    return RealtimeAnalyticsManager.instance
  }

  private initializeRealtime(): void {
    // Initialize heartbeat
    this.startHeartbeat()

    // Listen for connection changes
    this.setupConnectionListeners()
  }

  private setupConnectionListeners(): void {
    // Listen to Supabase realtime connection events
    supabase.realtime.onConnect(() => {
      console.log('[Realtime Analytics] Connected to Supabase Realtime')
      this.isOnline = true
      this.reconnectAttempts = 0
      this.resubscribeAll()
    })

    supabase.realtime.onDisconnect(() => {
      console.log('[Realtime Analytics] Disconnected from Supabase Realtime')
      this.isOnline = false
      this.handleDisconnection()
    })

    supabase.realtime.onError((error) => {
      console.error('[Realtime Analytics] Connection error:', error)
      this.handleConnectionError(error)
    })
  }

  private setupEventListeners(): void {
    // Listen for online/offline events
    window.addEventListener('online', () => {
      this.isOnline = true
      this.handleReconnection()
    })

    window.addEventListener('offline', () => {
      this.isOnline = false
    })

    // Listen for page visibility changes
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.pauseHeartbeat()
      } else {
        this.resumeHeartbeat()
        if (!this.isOnline) {
          this.handleReconnection()
        }
      }
    })
  }

  private startHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer)
    }

    this.heartbeatTimer = setInterval(() => {
      this.sendHeartbeat()
    }, this.config.heartbeatInterval)
  }

  private pauseHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer)
      this.heartbeatTimer = null
    }
  }

  private resumeHeartbeat(): void {
    if (!this.heartbeatTimer) {
      this.startHeartbeat()
    }
  }

  private sendHeartbeat(): void {
    // Send a heartbeat event to maintain connection
    this.broadcastEvent('heartbeat', {
      timestamp: new Date().toISOString(),
      clientId: this.getClientId()
    })
  }

  private getClientId(): string {
    let clientId = localStorage.getItem('analytics_client_id')
    if (!clientId) {
      clientId = `client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      localStorage.setItem('analytics_client_id', clientId)
    }
    return clientId
  }

  public subscribeToEvents(
    subscriptionId: string,
    eventTypes: string[],
    callback: (event: RealtimeEvent) => void,
    filters?: Record<string, any>
  ): string {
    const channelName = `analytics_events_${subscriptionId}`

    // Create Supabase realtime channel
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'analytics_events',
          filter: this.buildFilterString(filters)
        },
        (payload) => {
          this.handleDatabaseEvent('analytics_events', payload, callback)
        }
      )
      .on(
        'broadcast',
        { event: 'analytics_update' },
        (payload) => {
          this.handleBroadcastEvent('analytics_update', payload, callback)
        }
      )
      .subscribe((status) => {
        console.log(`[Realtime Analytics] Subscription ${subscriptionId} status:`, status)
      })

    const subscription: RealtimeSubscription = {
      id: subscriptionId,
      channel,
      eventTypes,
      callback,
      isActive: true
    }

    this.subscriptions.set(subscriptionId, subscription)

    return subscriptionId
  }

  public subscribeToKPIs(
    subscriptionId: string,
    callback: (event: RealtimeEvent) => void,
    filters?: Record<string, any>
  ): string {
    const channelName = `kpi_updates_${subscriptionId}`

    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'performance_kpis',
          filter: this.buildFilterString(filters)
        },
        (payload) => {
          this.handleDatabaseEvent('performance_kpis', payload, callback)
        }
      )
      .on(
        'broadcast',
        { event: 'kpi_alert' },
        (payload) => {
          this.handleBroadcastEvent('kpi_alert', payload, callback)
        }
      )
      .subscribe()

    const subscription: RealtimeSubscription = {
      id: subscriptionId,
      channel,
      eventTypes: ['kpi_update', 'kpi_alert'],
      callback,
      isActive: true
    }

    this.subscriptions.set(subscriptionId, subscription)

    return subscriptionId
  }

  public subscribeToRevenue(
    subscriptionId: string,
    callback: (event: RealtimeEvent) => void,
    filters?: Record<string, any>
  ): string {
    const channelName = `revenue_updates_${subscriptionId}`

    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'revenue_analytics',
          filter: this.buildFilterString(filters)
        },
        (payload) => {
          this.handleDatabaseEvent('revenue_analytics', payload, callback)
        }
      )
      .subscribe()

    const subscription: RealtimeSubscription = {
      id: subscriptionId,
      channel,
      eventTypes: ['revenue_update'],
      callback,
      isActive: true
    }

    this.subscriptions.set(subscriptionId, subscription)

    return subscriptionId
  }

  public subscribeToAlerts(
    subscriptionId: string,
    callback: (event: RealtimeEvent) => void
  ): string {
    const channelName = `analytics_alerts_${subscriptionId}`

    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'analytics_alert_history'
        },
        (payload) => {
          this.handleDatabaseEvent('analytics_alert_history', payload, callback)
        }
      )
      .on(
        'broadcast',
        { event: 'alert_triggered' },
        (payload) => {
          this.handleBroadcastEvent('alert_triggered', payload, callback)
        }
      )
      .subscribe()

    const subscription: RealtimeSubscription = {
      id: subscriptionId,
      channel,
      eventTypes: ['alert_triggered'],
      callback,
      isActive: true
    }

    this.subscriptions.set(subscriptionId, subscription)

    return subscriptionId
  }

  private buildFilterString(filters?: Record<string, any>): string {
    if (!filters) return ''

    const filterConditions = Object.entries(filters).map(([key, value]) => {
      if (Array.isArray(value)) {
        return `${key}=in.(${value.join(',')})`
      }
      return `${key}=eq.${value}`
    })

    return filterConditions.join('&')
  }

  private handleDatabaseEvent(
    source: string,
    payload: any,
    callback: (event: RealtimeEvent) => void
  ): void {
    const event: RealtimeEvent = {
      type: payload.eventType || 'database_change',
      payload: {
        source,
        ...payload
      },
      timestamp: new Date().toISOString(),
      channel: source
    }

    callback(event)

    // Also dispatch for global listeners
    this.dispatchGlobalEvent(event)
  }

  private handleBroadcastEvent(
    eventType: string,
    payload: any,
    callback: (event: RealtimeEvent) => void
  ): void {
    const event: RealtimeEvent = {
      type: eventType,
      payload: payload.payload || payload,
      timestamp: new Date().toISOString(),
      channel: 'broadcast'
    }

    callback(event)
    this.dispatchGlobalEvent(event)
  }

  private dispatchGlobalEvent(event: RealtimeEvent): void {
    // Dispatch custom event for global listeners
    window.dispatchEvent(new CustomEvent('analytics-realtime', {
      detail: event
    }))
  }

  public broadcastEvent(eventType: string, payload: any, channel?: string): void {
    const broadcastChannel = channel || 'analytics_updates'

    supabase.realtime.channel(broadcastChannel).send({
      type: 'broadcast',
      event: eventType,
      payload: {
        ...payload,
        timestamp: new Date().toISOString(),
        clientId: this.getClientId()
      }
    })
  }

  public unsubscribe(subscriptionId: string): void {
    const subscription = this.subscriptions.get(subscriptionId)
    if (subscription) {
      subscription.channel.unsubscribe()
      this.subscriptions.delete(subscriptionId)
      console.log(`[Realtime Analytics] Unsubscribed from ${subscriptionId}`)
    }
  }

  public unsubscribeAll(): void {
    this.subscriptions.forEach((subscription, id) => {
      subscription.channel.unsubscribe()
    })
    this.subscriptions.clear()
    console.log('[Realtime Analytics] Unsubscribed from all subscriptions')
  }

  private resubscribeAll(): void {
    const subscriptions = Array.from(this.subscriptions.values())
    this.subscriptions.clear()

    subscriptions.forEach(subscription => {
      // Re-create subscription (implementation would depend on original subscription parameters)
      console.log(`[Realtime Analytics] Resubscribing to ${subscription.id}`)
    })
  }

  private handleDisconnection(): void {
    this.pauseHeartbeat()

    // Mark all subscriptions as inactive
    this.subscriptions.forEach(subscription => {
      subscription.isActive = false
    })

    if (this.config.enableAutoReconnect) {
      this.attemptReconnect()
    }
  }

  private handleConnectionError(error: any): void {
    console.error('[Realtime Analytics] Connection error:', error)
    this.broadcastEvent('connection_error', { error })
  }

  private handleReconnection(): void {
    if (this.config.enableAutoReconnect && this.reconnectAttempts < this.config.maxReconnectAttempts) {
      this.attemptReconnect()
    }
  }

  private attemptReconnect(): void {
    this.reconnectAttempts++
    console.log(`[Realtime Analytics] Reconnection attempt ${this.reconnectAttempts}/${this.config.maxReconnectAttempts}`)

    setTimeout(() => {
      if (this.isOnline) {
        // Attempt to reconnect by re-initializing Supabase realtime
        this.resubscribeAll()
        this.resumeHeartbeat()
      } else {
        if (this.reconnectAttempts < this.config.maxReconnectAttempts) {
          this.attemptReconnect()
        } else {
          console.error('[Realtime Analytics] Max reconnection attempts reached')
          this.broadcastEvent('connection_failed', {
            attempts: this.reconnectAttempts,
            maxAttempts: this.config.maxReconnectAttempts
          })
        }
      }
    }, this.config.reconnectInterval)
  }

  public getSubscriptionStatus(): { [subscriptionId: string]: boolean } {
    const status: { [subscriptionId: string]: boolean } = {}
    this.subscriptions.forEach((subscription, id) => {
      status[id] = subscription.isActive
    })
    return status
  }

  public getConnectionStatus(): {
    isOnline: boolean
    reconnectAttempts: number
    subscriptionCount: number
  } {
    return {
      isOnline: this.isOnline,
      reconnectAttempts: this.reconnectAttempts,
      subscriptionCount: this.subscriptions.size
    }
  }

  public updateConfig(newConfig: Partial<RealtimeConfig>): void {
    this.config = { ...this.config, ...newConfig }

    if (newConfig.heartbeatInterval) {
      this.startHeartbeat()
    }
  }

  public destroy(): void {
    this.unsubscribeAll()
    this.pauseHeartbeat()
  }
}

// Export singleton instance
export const realtimeManager = RealtimeAnalyticsManager.getInstance()

// Export convenience functions for common subscriptions
export const subscribeToDashboardUpdates = (
  callback: (event: RealtimeEvent) => void
): string => {
  return realtimeManager.subscribeToEvents(
    'dashboard_updates',
    ['analytics_update', 'kpi_update', 'revenue_update'],
    callback
  )
}

export const subscribeToAlerts = (
  callback: (event: RealtimeEvent) => void
): string => {
  return realtimeManager.subscribeToAlerts('alerts', callback)
}

export const subscribeToKPIUpdates = (
  callback: (event: RealtimeEvent) => void
): string => {
  return realtimeManager.subscribeToKPIs('kpi_updates', callback)
}

// Export types
export type { RealtimeEvent, RealtimeConfig, RealtimeSubscription }