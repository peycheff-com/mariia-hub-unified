/**
 * Real-time Event Tracking System
 *
 * Comprehensive event tracking for all user interactions across the platform.
 * Supports multiple providers, real-time streaming, and offline queue management.
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { analyticsBatcher, trackEvent } from '@/lib/analytics-batcher';

export interface TrackingEvent {
  event: string;
  properties?: Record<string, any>;
  userId?: string;
  sessionId?: string;
  timestamp?: Date;
  provider?: string;
  priority?: 'low' | 'normal' | 'high';
  deviceInfo?: DeviceInfo;
  locationInfo?: LocationInfo;
  campaignInfo?: CampaignInfo;
}

export interface DeviceInfo {
  deviceType: 'mobile' | 'desktop' | 'tablet';
  browser: string;
  os: string;
  screenResolution: string;
  userAgent: string;
  viewport: { width: number; height: number };
}

export interface LocationInfo {
  country?: string;
  city?: string;
  timezone: string;
  language: string;
}

export interface CampaignInfo {
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmTerm?: string;
  utmContent?: string;
  referrer?: string;
}

export interface BookingJourneyStep {
  step: number;
  stepName: string;
  completedAt: Date;
  duration: number;
  properties?: Record<string, any>;
}

class EventTracker {
  private supabase: SupabaseClient;
  private sessionId: string;
  private userId: string | null = null;
  private journeyId: string | null = null;
  private deviceInfo: DeviceInfo | null = null;
  private locationInfo: LocationInfo | null = null;
  private campaignInfo: CampaignInfo | null = null;
  private startTime: Date = new Date();
  private pageViews: number = 0;
  private eventsCount: number = 0;

  constructor() {
    this.supabase = createClient(
      import.meta.env.VITE_SUPABASE_URL!,
      import.meta.env.VITE_SUPABASE_ANON_KEY!
    );

    this.sessionId = this.generateSessionId();
    this.initializeTracking();
  }

  private generateSessionId(): string {
    // Check if session ID exists in sessionStorage
    let sessionId = sessionStorage.getItem('analytics_session_id');
    if (!sessionId) {
      sessionId = crypto.randomUUID();
      sessionStorage.setItem('analytics_session_id', sessionId);
    }
    return sessionId;
  }

  private async initializeTracking(): Promise<void> {
    try {
      // Initialize user ID if available
      await this.initializeUserId();

      // Collect device information
      this.deviceInfo = this.collectDeviceInfo();

      // Collect location information
      this.locationInfo = await this.collectLocationInfo();

      // Collect campaign information
      this.campaignInfo = this.collectCampaignInfo();

      // Create or update user session
      await this.createOrUpdateSession();

      // Track initial page view
      this.trackPageView();

      // Setup event listeners
      this.setupEventListeners();

    } catch (error) {
      console.error('Failed to initialize event tracking:', error);
    }
  }

  private async initializeUserId(): Promise<void> {
    try {
      const { data: { user } } = await this.supabase.auth.getUser();
      if (user) {
        this.userId = user.id;
      }
    } catch (error) {
      // User not authenticated
      console.log('User not authenticated, tracking as anonymous');
    }
  }

  private collectDeviceInfo(): DeviceInfo {
    const userAgent = navigator.userAgent;
    const viewport = {
      width: window.innerWidth,
      height: window.innerHeight
    };

    // Simple device detection
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
    const isTablet = /iPad|Android.*Mobile/i.test(userAgent) && viewport.width > 768;

    const deviceType = isTablet ? 'tablet' : isMobile ? 'mobile' : 'desktop';

    // Browser detection
    let browser = 'Unknown';
    if (userAgent.includes('Chrome')) browser = 'Chrome';
    else if (userAgent.includes('Firefox')) browser = 'Firefox';
    else if (userAgent.includes('Safari')) browser = 'Safari';
    else if (userAgent.includes('Edge')) browser = 'Edge';

    // OS detection
    let os = 'Unknown';
    if (userAgent.includes('Windows')) os = 'Windows';
    else if (userAgent.includes('Mac')) os = 'macOS';
    else if (userAgent.includes('Linux')) os = 'Linux';
    else if (userAgent.includes('Android')) os = 'Android';
    else if (userAgent.includes('iOS')) os = 'iOS';

    return {
      deviceType,
      browser,
      os,
      screenResolution: `${screen.width}x${screen.height}`,
      userAgent,
      viewport
    };
  }

  private async collectLocationInfo(): Promise<LocationInfo> {
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const language = navigator.language;

    // In a real implementation, you might use a geolocation service
    // For now, we'll use timezone to infer country
    let country = 'Unknown';
    if (timezone.includes('Warsaw') || timezone.includes('Europe/Warsaw')) {
      country = 'Poland';
    }

    return {
      country,
      city: 'Unknown', // Would be filled by geolocation service
      timezone,
      language
    };
  }

  private collectCampaignInfo(): CampaignInfo {
    const urlParams = new URLSearchParams(window.location.search);

    return {
      utmSource: urlParams.get('utm_source') || undefined,
      utmMedium: urlParams.get('utm_medium') || undefined,
      utmCampaign: urlParams.get('utm_campaign') || undefined,
      utmTerm: urlParams.get('utm_term') || undefined,
      utmContent: urlParams.get('utm_content') || undefined,
      referrer: document.referrer || undefined
    };
  }

  private async createOrUpdateSession(): Promise<void> {
    try {
      const sessionData = {
        session_id: this.sessionId,
        user_id: this.userId,
        device_type: this.deviceInfo?.deviceType,
        browser: this.deviceInfo?.browser,
        os: this.deviceInfo?.os,
        country: this.locationInfo?.country,
        city: this.locationInfo?.city,
        referrer: this.campaignInfo?.referrer,
        utm_source: this.campaignInfo?.utmSource,
        utm_medium: this.campaignInfo?.utmMedium,
        utm_campaign: this.campaignInfo?.utmCampaign,
        page_views: this.pageViews,
        events_count: this.eventsCount,
        bounce: this.pageViews === 1,
        duration_seconds: 0 // Will be updated on session end
      };

      // Check if session exists
      const { data: existingSession } = await this.supabase
        .from('user_sessions')
        .select('id')
        .eq('session_id', this.sessionId)
        .single();

      if (existingSession) {
        // Update existing session
        await this.supabase
          .from('user_sessions')
          .update({
            ...sessionData,
            last_activity: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('session_id', this.sessionId);
      } else {
        // Create new session
        await this.supabase
          .from('user_sessions')
          .insert({
            ...sessionData,
            started_at: new Date().toISOString(),
            last_activity: new Date().toISOString()
          });
      }
    } catch (error) {
      console.error('Failed to create/update session:', error);
    }
  }

  private setupEventListeners(): void {
    // Page visibility change
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        this.track('session_resumed', {
          timeSpent: Date.now() - this.startTime.getTime()
        });
      } else {
        this.track('session_paused');
      }
    });

    // Before unload
    window.addEventListener('beforeunload', () => {
      this.endSession();
    });

    // Route changes (for SPAs)
    let lastPath = window.location.pathname;
    const observer = new MutationObserver(() => {
      if (window.location.pathname !== lastPath) {
        lastPath = window.location.pathname;
        this.trackPageView();
      }
    });

    observer.observe(document, { subtree: true, childList: true });

    // Click events for interaction tracking
    document.addEventListener('click', (event) => {
      const target = event.target as HTMLElement;
      const trackData = target.getAttribute('data-track');

      if (trackData) {
        try {
          const eventData = JSON.parse(trackData);
          this.track('element_click', eventData);
        } catch (error) {
          this.track('element_click', { element: target.tagName, id: target.id, class: target.className });
        }
      }
    });

    // Form submissions
    document.addEventListener('submit', (event) => {
      const form = event.target as HTMLFormElement;
      const formName = form.getAttribute('data-form-name') || form.id || 'unknown_form';

      this.track('form_submit', {
        formName,
        fields: form.elements.length
      }, { priority: 'high' });
    });

    // Scroll depth tracking
    let maxScrollDepth = 0;
    const trackScrollDepth = () => {
      const scrollDepth = Math.round(
        (window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100
      );

      if (scrollDepth > maxScrollDepth && scrollDepth % 25 === 0) {
        maxScrollDepth = scrollDepth;
        this.track('scroll_depth', {
          depth: scrollDepth,
          url: window.location.pathname
        });
      }
    };

    window.addEventListener('scroll', trackScrollDepth, { passive: true });

    // Error tracking
    window.addEventListener('error', (event) => {
      this.track('javascript_error', {
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        stack: event.error?.stack
      }, { priority: 'high' });
    });
  }

  public track(event: string, properties?: Record<string, any>, options?: {
    userId?: string;
    sessionId?: string;
    provider?: string;
    priority?: 'low' | 'normal' | 'high';
  }): void {
    const trackingEvent: TrackingEvent = {
      event,
      properties: {
        ...properties,
        url: window.location.href,
        path: window.location.pathname,
        title: document.title,
        timestamp: new Date().toISOString()
      },
      userId: options?.userId || this.userId || undefined,
      sessionId: options?.sessionId || this.sessionId,
      timestamp: new Date(),
      provider: options?.provider,
      priority: options?.priority,
      deviceInfo: this.deviceInfo || undefined,
      locationInfo: this.locationInfo || undefined,
      campaignInfo: this.campaignInfo || undefined
    };

    // Send to batcher for efficient processing
    trackEvent(event, trackingEvent.properties, {
      userId: trackingEvent.userId,
      sessionId: trackingEvent.sessionId,
      provider: trackingEvent.provider,
      priority: trackingEvent.priority
    });

    // Also store in Supabase for advanced analytics
    this.storeEventInDatabase(trackingEvent);

    this.eventsCount++;
  }

  private async storeEventInDatabase(event: TrackingEvent): Promise<void> {
    try {
      await this.supabase
        .from('analytics_events')
        .insert({
          event: event.event,
          properties: {
            ...event.properties,
            deviceInfo: event.deviceInfo,
            locationInfo: event.locationInfo,
            campaignInfo: event.campaignInfo
          },
          user_id: event.userId,
          session_id: event.sessionId,
          timestamp: event.timestamp?.toISOString() || new Date().toISOString(),
          provider: event.provider,
          device_type: event.deviceInfo?.deviceType,
          browser: event.deviceInfo?.browser,
          os: event.deviceInfo?.os,
          screen_resolution: event.deviceInfo?.screenResolution,
          referrer: event.campaignInfo?.referrer,
          utm_source: event.campaignInfo?.utmSource,
          utm_medium: event.campaignInfo?.utmMedium,
          utm_campaign: event.campaignInfo?.utmCampaign,
          utm_term: event.campaignInfo?.utmTerm,
          utm_content: event.campaignInfo?.utmContent
        });
    } catch (error) {
      console.error('Failed to store event in database:', error);
    }
  }

  public trackPageView(path?: string, title?: string): void {
    this.pageViews++;

    const pageData = {
      page_path: path || window.location.pathname,
      page_title: title || document.title,
      page_location: window.location.href,
      referrer: document.referrer,
      viewport_width: this.deviceInfo?.viewport.width,
      viewport_height: this.deviceInfo?.viewport.height
    };

    this.track('page_view', pageData, { priority: 'high' });

    // Update session page view count
    this.updateSessionActivity();
  }

  public startBookingJourney(serviceId: string, serviceData: any): void {
    this.journeyId = crypto.randomUUID();

    this.track('booking_journey_started', {
      journeyId: this.journeyId,
      serviceId,
      serviceData,
      timestamp: new Date().toISOString()
    }, { priority: 'high' });

    // Create booking journey record
    this.createBookingJourney({
      service_selected: serviceData,
      steps_completed: [{ step: 1, stepName: 'service_selection', completedAt: new Date(), duration: 0 }],
      current_step: 1
    });
  }

  public trackBookingStep(step: number, stepName: string, properties?: Record<string, any>): void {
    if (!this.journeyId) {
      console.warn('No active booking journey found');
      return;
    }

    this.track('booking_step_completed', {
      journeyId: this.journeyId,
      step,
      stepName,
      ...properties
    }, { priority: 'high' });

    // Update booking journey
    this.updateBookingJourney({
      current_step: step,
      steps_completed: [{ step, stepName, completedAt: new Date(), duration: 0, properties }]
    });
  }

  public completeBookingJourney(bookingData: any): void {
    if (!this.journeyId) return;

    this.track('booking_journey_completed', {
      journeyId: this.journeyId,
      bookingData,
      totalDuration: Date.now() - this.startTime.getTime()
    }, { priority: 'high' });

    // Mark journey as completed
    this.updateBookingJourney({
      is_completed: true,
      completed_at: new Date(),
      total_time_seconds: Math.floor((Date.now() - this.startTime.getTime()) / 1000)
    });

    this.journeyId = null;
  }

  public abandonBookingJourney(reason?: string): void {
    if (!this.journeyId) return;

    this.track('booking_journey_abandoned', {
      journeyId: this.journeyId,
      reason,
      totalDuration: Date.now() - this.startTime.getTime()
    }, { priority: 'high' });

    // Mark journey as abandoned
    this.updateBookingJourney({
      abandoned_at: new Date(),
      abandonment_reason: reason,
      total_time_seconds: Math.floor((Date.now() - this.startTime.getTime()) / 1000)
    });

    this.journeyId = null;
  }

  private async createBookingJourney(data: any): Promise<void> {
    try {
      await this.supabase
        .from('booking_journeys')
        .insert({
          session_id: this.sessionId,
          user_id: this.userId,
          service_selected: data.service_selected,
          steps_completed: data.steps_completed,
          current_step: data.current_step,
          is_completed: false
        });
    } catch (error) {
      console.error('Failed to create booking journey:', error);
    }
  }

  private async updateBookingJourney(data: any): Promise<void> {
    if (!this.journeyId) return;

    try {
      await this.supabase
        .from('booking_journeys')
        .update({
          ...data,
          updated_at: new Date().toISOString()
        })
        .eq('session_id', this.sessionId)
        .is('is_completed', false);
    } catch (error) {
      console.error('Failed to update booking journey:', error);
    }
  }

  private async updateSessionActivity(): Promise<void> {
    try {
      await this.supabase
        .from('user_sessions')
        .update({
          last_activity: new Date().toISOString(),
          page_views: this.pageViews,
          events_count: this.eventsCount,
          bounce: this.pageViews === 1,
          duration_seconds: Math.floor((Date.now() - this.startTime.getTime()) / 1000),
          updated_at: new Date().toISOString()
        })
        .eq('session_id', this.sessionId);
    } catch (error) {
      console.error('Failed to update session activity:', error);
    }
  }

  private async endSession(): Promise<void> {
    try {
      const duration = Math.floor((Date.now() - this.startTime.getTime()) / 1000);

      await this.supabase
        .from('user_sessions')
        .update({
          last_activity: new Date().toISOString(),
          page_views: this.pageViews,
          events_count: this.eventsCount,
          bounce: this.pageViews === 1,
          duration_seconds: duration,
          updated_at: new Date().toISOString()
        })
        .eq('session_id', this.sessionId);

      // Track session end
      this.track('session_ended', {
        duration,
        pageViews: this.pageViews,
        eventsCount: this.eventsCount
      });

    } catch (error) {
      console.error('Failed to end session:', error);
    }
  }

  // Public methods for specific tracking scenarios
  public trackServiceView(serviceId: string, serviceData: any): void {
    this.track('service_view', {
      serviceId,
      serviceType: serviceData.service_type,
      serviceCategory: serviceData.category,
      price: serviceData.price,
      duration: serviceData.duration_minutes
    });
  }

  public trackBookingAttempt(serviceId: string, serviceData: any): void {
    this.track('booking_attempt', {
      serviceId,
      serviceType: serviceData.service_type,
      price: serviceData.price
    }, { priority: 'high' });
  }

  public trackPaymentAttempt(bookingId: string, amount: number, paymentMethod: string): void {
    this.track('payment_attempt', {
      bookingId,
      amount,
      paymentMethod,
      currency: 'PLN'
    }, { priority: 'high' });
  }

  public trackPaymentSuccess(bookingId: string, amount: number, paymentMethod: string): void {
    this.track('payment_success', {
      bookingId,
      amount,
      paymentMethod,
      currency: 'PLN'
    }, { priority: 'high' });

    // Also track as purchase event
    this.track('purchase', {
      transaction_id: bookingId,
      value: amount,
      currency: 'PLN',
      payment_method: paymentMethod
    }, { priority: 'high' });
  }

  public trackPaymentFailure(bookingId: string, amount: number, paymentMethod: string, error: string): void {
    this.track('payment_failure', {
      bookingId,
      amount,
      paymentMethod,
      currency: 'PLN',
      error
    }, { priority: 'high' });
  }

  public trackFormInteraction(formName: string, field: string, action: 'focus' | 'blur' | 'change'): void {
    this.track('form_interaction', {
      formName,
      field,
      action
    });
  }

  public trackSearch(searchTerm: string, category?: string, resultsCount?: number): void {
    this.track('search', {
      searchTerm,
      category,
      resultsCount
    });
  }

  public trackError(error: Error, context?: Record<string, any>): void {
    this.track('error', {
      message: error.message,
      stack: error.stack,
      context
    }, { priority: 'high' });
  }

  public trackFeatureUsage(featureName: string, properties?: Record<string, any>): void {
    this.track('feature_used', {
      featureName,
      ...properties
    });
  }

  public setUserId(userId: string): void {
    this.userId = userId;
    this.track('user_identified', { userId });
  }

  public getSessionInfo() {
    return {
      sessionId: this.sessionId,
      userId: this.userId,
      startTime: this.startTime,
      pageViews: this.pageViews,
      eventsCount: this.eventsCount,
      deviceInfo: this.deviceInfo,
      locationInfo: this.locationInfo,
      campaignInfo: this.campaignInfo
    };
  }
}

// Create singleton instance
export const eventTracker = new EventTracker();

// Export convenience methods
export const trackEvent = (event: string, properties?: Record<string, any>) => {
  eventTracker.track(event, properties);
};

export const trackPageView = (path?: string, title?: string) => {
  eventTracker.trackPageView(path, title);
};

export const trackBookingJourney = {
  start: (serviceId: string, serviceData: any) => eventTracker.startBookingJourney(serviceId, serviceData),
  step: (step: number, stepName: string, properties?: Record<string, any>) => eventTracker.trackBookingStep(step, stepName, properties),
  complete: (bookingData: any) => eventTracker.completeBookingJourney(bookingData),
  abandon: (reason?: string) => eventTracker.abandonBookingJourney(reason)
};

export const trackPayment = {
  attempt: (bookingId: string, amount: number, paymentMethod: string) => eventTracker.trackPaymentAttempt(bookingId, amount, paymentMethod),
  success: (bookingId: string, amount: number, paymentMethod: string) => eventTracker.trackPaymentSuccess(bookingId, amount, paymentMethod),
  failure: (bookingId: string, amount: number, paymentMethod: string, error: string) => eventTracker.trackPaymentFailure(bookingId, amount, paymentMethod, error)
};

export const trackService = {
  view: (serviceId: string, serviceData: any) => eventTracker.trackServiceView(serviceId, serviceData),
  bookingAttempt: (serviceId: string, serviceData: any) => eventTracker.trackBookingAttempt(serviceId, serviceData)
};

export default eventTracker;