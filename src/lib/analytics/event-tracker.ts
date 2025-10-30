/**
 * Advanced Analytics Event Tracking System
 * Real-time event collection with WebSocket integration for luxury beauty/fitness platform
 */

import { supabase } from '@/integrations/supabase/client'
import type { Database } from '@/integrations/supabase/types'

type AnalyticsEvent = Database['public']['Tables']['analytics_events']['Insert']
type CustomerJourneyEvent = Database['public']['Tables']['customer_journey_analytics']['Insert']

interface EventTrackingConfig {
  enableRealTimeTracking: boolean
  batchSize: number
  flushInterval: number
  enableSessionPersistence: boolean
  debugMode: boolean
}

interface TrackingContext {
  userId?: string
  sessionId: string
  userAgent: string
  referrer: string
  pageUrl: string
  timestamp: string
}

interface EventMetadata {
  serviceId?: string
  bookingId?: string
  revenueImpact?: number
  conversionValue?: number
  [key: string]: any
}

class AnalyticsEventTracker {
  private static instance: AnalyticsEventTracker
  private config: EventTrackingConfig
  private eventQueue: AnalyticsEvent[] = []
  private journeyQueue: CustomerJourneyEvent[] = []
  private flushTimer: NodeJS.Timeout | null = null
  private websocket: WebSocket | null = null
  private reconnectAttempts = 0
  private maxReconnectAttempts = 5
  private isOnline = navigator.onLine

  private constructor(config: Partial<EventTrackingConfig> = {}) {
    this.config = {
      enableRealTimeTracking: true,
      batchSize: 10,
      flushInterval: 5000, // 5 seconds
      enableSessionPersistence: true,
      debugMode: process.env.NODE_ENV === 'development',
      ...config
    }

    this.initializeTracking()
    this.setupEventListeners()
  }

  public static getInstance(config?: Partial<EventTrackingConfig>): AnalyticsEventTracker {
    if (!AnalyticsEventTracker.instance) {
      AnalyticsEventTracker.instance = new AnalyticsEventTracker(config)
    }
    return AnalyticsEventTracker.instance
  }

  private initializeTracking(): void {
    // Initialize WebSocket connection for real-time tracking
    if (this.config.enableRealTimeTracking) {
      this.initializeWebSocket()
    }

    // Start periodic flush
    this.startPeriodicFlush()

    // Track page load
    this.trackEvent('page_load', 'page_view', {
      loadTime: performance.now(),
      referrer: document.referrer,
      url: window.location.href
    })

    // Track session start
    this.trackSessionStart()
  }

  private initializeWebSocket(): void {
    try {
      const wsUrl = `${process.env.VITE_SUPABASE_URL?.replace('https://', 'wss://').replace('http://', 'ws://')}/realtime`

      this.websocket = new WebSocket(`${wsUrl}?apikey=${process.env.VITE_SUPABASE_ANON_KEY}`)

      this.websocket.onopen = () => {
        this.log('WebSocket connected')
        this.reconnectAttempts = 0

        // Subscribe to analytics events channel
        this.subscribeToAnalyticsChannel()
      }

      this.websocket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          this.handleWebSocketMessage(data)
        } catch (error) {
          this.log('WebSocket message parsing error:', error)
        }
      }

      this.websocket.onclose = () => {
        this.log('WebSocket disconnected')
        this.attemptReconnect()
      }

      this.websocket.onerror = (error) => {
        this.log('WebSocket error:', error)
      }
    } catch (error) {
      this.log('WebSocket initialization error:', error)
    }
  }

  private subscribeToAnalyticsChannel(): void {
    if (!this.websocket) return

    const subscription = {
      event: 'subscribe',
      topic: 'analytics_events',
      payload: {
        event: '*',
        schema: 'public',
        table: 'analytics_events'
      }
    }

    this.websocket.send(JSON.stringify(subscription))
  }

  private handleWebSocketMessage(data: any): void {
    if (data.event === 'broadcast' && data.payload) {
      // Handle real-time analytics updates
      this.handleRealtimeUpdate(data.payload)
    }
  }

  private handleRealtimeUpdate(payload: any): void {
    // Dispatch custom event for real-time updates
    window.dispatchEvent(new CustomEvent('analytics-update', {
      detail: payload
    }))
  }

  private attemptReconnect(): void {
    if (this.reconnectAttempts < this.maxReconnectAttempts && this.isOnline) {
      this.reconnectAttempts++
      const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000)

      this.log(`Attempting WebSocket reconnection (${this.reconnectAttempts}/${this.maxReconnectAttempts}) in ${delay}ms`)

      setTimeout(() => {
        this.initializeWebSocket()
      }, delay)
    }
  }

  private setupEventListeners(): void {
    // Track page visibility changes
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.trackEvent('page_hidden', 'engagement')
      } else {
        this.trackEvent('page_visible', 'engagement')
      }
    })

    // Track page unload
    window.addEventListener('beforeunload', () => {
      this.flushEvents(true) // Force flush on page unload
    })

    // Track online/offline status
    window.addEventListener('online', () => {
      this.isOnline = true
      this.trackEvent('connection_restored', 'system')
      if (!this.websocket || this.websocket.readyState === WebSocket.CLOSED) {
        this.initializeWebSocket()
      }
    })

    window.addEventListener('offline', () => {
      this.isOnline = false
      this.trackEvent('connection_lost', 'system')
    })

    // Track scroll depth
    let maxScrollDepth = 0
    const trackScrollDepth = () => {
      const scrollDepth = Math.round(
        (window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100
      )

      if (scrollDepth > maxScrollDepth) {
        maxScrollDepth = scrollDepth
        if (maxScrollDepth >= 25 && maxScrollDepth % 25 === 0) {
          this.trackEvent('scroll_depth', 'engagement', {
            depth: maxScrollDepth
          })
        }
      }
    }

    window.addEventListener('scroll', throttle(trackScrollDepth, 1000))

    // Track mouse movement for engagement metrics
    let mouseMoveTimer: NodeJS.Timeout
    window.addEventListener('mousemove', () => {
      clearTimeout(mouseMoveTimer)
      mouseMoveTimer = setTimeout(() => {
        this.trackEvent('user_active', 'engagement')
      }, 30000) // Track activity every 30 seconds of mouse movement
    })
  }

  private getTrackingContext(): TrackingContext {
    return {
      userId: this.getCurrentUserId(),
      sessionId: this.getSessionId(),
      userAgent: navigator.userAgent,
      referrer: document.referrer,
      pageUrl: window.location.href,
      timestamp: new Date().toISOString()
    }
  }

  private getCurrentUserId(): string | undefined {
    // Get current user ID from authentication context
    return (window as any).__supabase_user?.id
  }

  private getSessionId(): string {
    let sessionId = sessionStorage.getItem('analytics_session_id')

    if (!sessionId) {
      sessionId = this.generateSessionId()
      sessionStorage.setItem('analytics_session_id', sessionId)
    }

    return sessionId
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  private trackSessionStart(): void {
    const sessionId = this.getSessionId()
    const existingSession = localStorage.getItem(`session_${sessionId}`)

    if (!existingSession) {
      this.trackEvent('session_start', 'session', {
        isNewUser: !localStorage.getItem('has_visited_before'),
        timestamp: Date.now()
      })

      localStorage.setItem('has_visited_before', 'true')
      localStorage.setItem(`session_${sessionId}`, JSON.stringify({
        startTime: Date.now(),
        userId: this.getCurrentUserId()
      }))
    }
  }

  public trackEvent(
    eventType: string,
    eventCategory: string,
    properties: Record<string, any> = {},
    metadata: EventMetadata = {}
  ): void {
    const context = this.getTrackingContext()

    const event: AnalyticsEvent = {
      event_type: eventType,
      event_category: eventCategory,
      user_id: context.userId,
      session_id: context.sessionId,
      timestamp: context.timestamp,
      properties: {
        ...properties,
        pageUrl: context.pageUrl,
        userAgent: context.userAgent
      },
      user_agent: context.userAgent,
      referrer: context.referrer,
      page_url: context.pageUrl,
      service_id: metadata.serviceId,
      booking_id: metadata.bookingId,
      revenue_impact: metadata.revenueImpact || 0,
      conversion_value: metadata.conversionValue || 0
    }

    this.eventQueue.push(event)
    this.log(`Event tracked: ${eventType}`, event)

    // Flush immediately for high-value events
    const highValueEvents = [
      'booking_completed',
      'payment_completed',
      'service_purchase_completed',
      'high_value_interaction'
    ]

    if (highValueEvents.includes(eventType) || this.eventQueue.length >= this.config.batchSize) {
      this.flushEvents()
    }
  }

  public trackCustomerJourney(
    journeyStage: string,
    touchpointType: string,
    touchpointDetails: Record<string, any> = {},
    isConverted: boolean = false,
    conversionValue: number = 0
  ): void {
    const context = this.getTrackingContext()

    const journeyEvent: CustomerJourneyEvent = {
      user_id: context.userId,
      session_id: context.sessionId,
      journey_stage: journeyStage,
      touchpoint_type: touchpointType,
      touchpoint_details: touchpointDetails,
      entry_timestamp: context.timestamp,
      is_converted: isConverted,
      conversion_value: conversionValue,
      attribution_model: 'last_click'
    }

    this.journeyQueue.push(journeyEvent)
    this.log(`Journey event tracked: ${journeyStage}`, journeyEvent)
  }

  public trackBookingFunnel(
    step: string,
    stepNumber: number,
    properties: Record<string, any> = {}
  ): void {
    this.trackEvent(`booking_funnel_${step}`, 'booking_funnel', {
      stepNumber,
      funnelStep: step,
      ...properties
    })

    this.trackCustomerJourney(
      'consideration',
      'booking_funnel',
      { step, stepNumber, ...properties }
    )
  }

  public trackServiceInteraction(
    serviceId: string,
    interactionType: string,
    properties: Record<string, any> = {}
  ): void {
    this.trackEvent(`service_${interactionType}`, 'service_interaction', {
      serviceId,
      interactionType,
      ...properties
    }, { serviceId })

    // Track as part of customer journey
    this.trackCustomerJourney(
      'consideration',
      'service_interaction',
      { serviceId, interactionType, ...properties }
    )
  }

  public trackPaymentEvent(
    eventType: string,
    amount: number,
    currency: string,
    properties: Record<string, any> = {}
  ): void {
    this.trackEvent(eventType, 'payment', {
      amount,
      currency,
      ...properties
    }, {
      revenueImpact: amount,
      conversionValue: amount
    })
  }

  public trackUserEngagement(
    engagementType: string,
    duration?: number,
    properties: Record<string, any> = {}
  ): void {
    this.trackEvent(engagementType, 'engagement', {
      duration,
      ...properties
    })
  }

  private async flushEvents(force: boolean = false): Promise<void> {
    if (this.eventQueue.length === 0 && this.journeyQueue.length === 0) return

    const eventsToFlush = [...this.eventQueue]
    const journeyToFlush = [...this.journeyQueue]

    this.eventQueue = []
    this.journeyQueue = []

    try {
      // Flush analytics events
      if (eventsToFlush.length > 0) {
        const { error } = await supabase
          .from('analytics_events')
          .insert(eventsToFlush)

        if (error) {
          this.log('Error flushing analytics events:', error)
          // Re-queue events on error
          this.eventQueue.unshift(...eventsToFlush)
        } else {
          this.log(`Flushed ${eventsToFlush.length} analytics events`)
        }
      }

      // Flush journey events
      if (journeyToFlush.length > 0) {
        const { error } = await supabase
          .from('customer_journey_analytics')
          .insert(journeyToFlush)

        if (error) {
          this.log('Error flushing journey events:', error)
          // Re-queue events on error
          this.journeyQueue.unshift(...journeyToFlush)
        } else {
          this.log(`Flushed ${journeyToFlush.length} journey events`)
        }
      }

      // Send real-time updates via WebSocket
      if (this.websocket && this.websocket.readyState === WebSocket.OPEN) {
        eventsToFlush.forEach(event => {
          this.websocket?.send(JSON.stringify({
            event: 'broadcast',
            topic: 'analytics_events',
            payload: event
          }))
        })
      }

    } catch (error) {
      this.log('Error during event flush:', error)
      // Re-queue all events on failure
      this.eventQueue.unshift(...eventsToFlush)
      this.journeyQueue.unshift(...journeyToFlush)
    }
  }

  private startPeriodicFlush(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer)
    }

    this.flushTimer = setInterval(() => {
      this.flushEvents()
    }, this.config.flushInterval)
  }

  public updateConfig(newConfig: Partial<EventTrackingConfig>): void {
    this.config = { ...this.config, ...newConfig }

    if (newConfig.flushInterval) {
      this.startPeriodicFlush()
    }

    if (newConfig.enableRealTimeTracking !== undefined) {
      if (newConfig.enableRealTimeTracking && !this.websocket) {
        this.initializeWebSocket()
      } else if (!newConfig.enableRealTimeTracking && this.websocket) {
        this.websocket.close()
        this.websocket = null
      }
    }
  }

  public getQueueStatus(): { eventQueue: number; journeyQueue: number; isOnline: boolean } {
    return {
      eventQueue: this.eventQueue.length,
      journeyQueue: this.journeyQueue.length,
      isOnline: this.isOnline
    }
  }

  public pauseTracking(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer)
      this.flushTimer = null
    }
  }

  public resumeTracking(): void {
    this.startPeriodicFlush()
  }

  public destroy(): void {
    this.pauseTracking()

    if (this.websocket) {
      this.websocket.close()
      this.websocket = null
    }

    // Flush remaining events
    this.flushEvents(true)
  }

  private log(...args: any[]): void {
    if (this.config.debugMode) {
      console.log('[Analytics Event Tracker]', ...args)
    }
  }
}

// Utility function for throttling
function throttle<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null
  let previous = 0

  return (...args: Parameters<T>) => {
    const now = Date.now()
    const remaining = wait - (now - previous)

    if (remaining <= 0 || remaining > wait) {
      if (timeout) {
        clearTimeout(timeout)
        timeout = null
      }
      previous = now
      func(...args)
    } else if (!timeout) {
      timeout = setTimeout(() => {
        previous = Date.now()
        timeout = null
        func(...args)
      }, remaining)
    }
  }
}

// Export singleton instance
export const eventTracker = AnalyticsEventTracker.getInstance()

// Export types for external use
export type {
  AnalyticsEvent,
  CustomerJourneyEvent,
  EventTrackingConfig,
  TrackingContext,
  EventMetadata
}

// Export convenience functions for common tracking scenarios
export const trackBookingFunnel = (
  step: string,
  stepNumber: number,
  properties?: Record<string, any>
) => eventTracker.trackBookingFunnel(step, stepNumber, properties)

export const trackServiceInteraction = (
  serviceId: string,
  interactionType: string,
  properties?: Record<string, any>
) => eventTracker.trackServiceInteraction(serviceId, interactionType, properties)

export const trackPaymentEvent = (
  eventType: string,
  amount: number,
  currency: string,
  properties?: Record<string, any>
) => eventTracker.trackPaymentEvent(eventType, amount, currency, properties)

export const trackUserEngagement = (
  engagementType: string,
  duration?: number,
  properties?: Record<string, any>
) => eventTracker.trackUserEngagement(engagementType, duration, properties)