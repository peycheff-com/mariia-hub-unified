import { supabase } from '@/integrations/supabase/client';

// GA4 Configuration
interface GA4Config {
  measurementId: string;
  apiSecret: string;
  streamId: string;
  enabled: boolean;
  debugMode: boolean;
}

// Enhanced Ecommerce Event Types
export interface GA4EcommerceEvent {
  event_name: string;
  parameters: {
    currency?: string;
    value?: number;
    items?: Array<{
      item_id?: string;
      item_name?: string;
      category?: string;
      sub_category?: string;
      price?: number;
      quantity?: number;
      variant?: string;
      brand?: string;
      list_name?: string;
      list_position?: number;
      promotion_id?: string;
      promotion_name?: string;
    }>;
    transaction_id?: string;
    coupon?: string;
    payment_type?: string;
    shipping?: number;
    tax?: number;
  };
}

// Custom Event Types for Beauty/Fitness Platform
export interface BookingAnalyticsEvent {
  event_name: string;
  parameters: {
    service_category: 'beauty' | 'fitness' | 'lifestyle';
    service_type?: string;
    service_name?: string;
    booking_step: number;
    total_steps: number;
    currency: string;
    value?: number;
    user_session_id: string;
    device_type: 'mobile' | 'tablet' | 'desktop';
    language: string;
    location?: string;
    time_to_complete?: number;
    drop_off_point?: number;
    error_code?: string;
  };
}

// Funnel Event Types
export interface FunnelEvent {
  event_name: string;
  parameters: {
    funnel_name: string;
    funnel_step: number;
    funnel_step_name: string;
    funnel_total_steps: number;
    funnel_previous_step?: number;
    funnel_completion_rate?: number;
    user_id?: string;
    session_id: string;
    timestamp: string;
    success: boolean;
    error_message?: string;
  };
}

export class GA4AnalyticsService {
  private static instance: GA4AnalyticsService;
  private config: GA4Config;
  private sessionId: string;
  private userId: string | null = null;
  private eventQueue: Array<GA4EcommerceEvent | BookingAnalyticsEvent | FunnelEvent> = [];
  private batchProcessing: boolean = false;

  constructor() {
    this.config = this.getGA4Config();
    this.sessionId = this.generateSessionId();
    this.initializeGA4();
    this.startBatchProcessing();
  }

  static getInstance(): GA4AnalyticsService {
    if (!GA4AnalyticsService.instance) {
      GA4AnalyticsService.instance = new GA4AnalyticsService();
    }
    return GA4AnalyticsService.instance;
  }

  private getGA4Config(): GA4Config {
    // Environment-specific configuration
    const measurementId = import.meta.env.VITE_GA4_MEASUREMENT_ID;
    const apiSecret = import.meta.env.VITE_GA4_API_SECRET;
    const streamId = import.meta.env.VITE_GA4_STREAM_ID;

    return {
      measurementId: measurementId || 'G-XXXXXXXXXX',
      apiSecret: apiSecret || 'your-api-secret',
      streamId: streamId || 'your-stream-id',
      enabled: !!measurementId && !this.isDevelopment(),
      debugMode: this.isDevelopment(),
    };
  }

  private isDevelopment(): boolean {
    return import.meta.env.DEV || window.location.hostname === 'localhost';
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private initializeGA4(): void {
    if (!this.config.enabled) return;

    // Load GA4 script
    this.loadGA4Script();

    // Initialize gtag
    window.dataLayer = window.dataLayer || [];
    window.gtag = this.createGtagFunction();

    // Configure GA4
    window.gtag('js', new Date());
    window.gtag('config', this.config.measurementId, {
      debug_mode: this.config.debugMode,
      send_page_view: false, // We'll handle page views manually
      custom_map: {
        'custom_parameter_1': 'service_category',
        'custom_parameter_2': 'booking_step',
        'custom_parameter_3': 'currency',
        'custom_parameter_4': 'device_type',
        'custom_parameter_5': 'user_language',
      },
    });

    // Set initial session and user info
    this.setInitialParameters();
  }

  private loadGA4Script(): void {
    if (document.getElementById('ga4-script')) return;

    const script = document.createElement('script');
    script.id = 'ga4-script';
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${this.config.measurementId}`;
    document.head.appendChild(script);
  }

  private createGtagFunction(): any {
    return function(...args: any[]) {
      window.dataLayer.push(arguments);
    };
  }

  private setInitialParameters(): void {
    // Set custom parameters for all events
    window.gtag('config', this.config.measurementId, {
      custom_map: {
        device_type: this.getDeviceType(),
        user_language: navigator.language,
        platform: navigator.platform,
        user_agent: navigator.userAgent.substring(0, 100), // Truncate for privacy
      },
    });

    // Set session parameters
    window.gtag('set', {
      session_id: this.sessionId,
    });
  }

  private getDeviceType(): 'mobile' | 'tablet' | 'desktop' {
    const width = window.innerWidth;
    if (width < 768) return 'mobile';
    if (width < 1024) return 'tablet';
    return 'desktop';
  }

  // User Management
  setUserId(userId: string): void {
    this.userId = userId;
    if (this.config.enabled) {
      window.gtag('config', this.config.measurementId, {
        user_id: userId,
      });
    }
  }

  // Page Views
  trackPageView(page: string, title?: string): void {
    if (!this.config.enabled) return;

    window.gtag('event', 'page_view', {
      page_location: window.location.href,
      page_path: page,
      page_title: title || document.title,
      session_id: this.sessionId,
      send_to: this.config.measurementId,
    });

    // Store in database for custom analytics
    this.storePageViewEvent(page, title);
  }

  private async storePageViewEvent(page: string, title?: string): Promise<void> {
    try {
      await supabase.from('analytics_page_views').insert({
        session_id: this.sessionId,
        user_id: this.userId,
        page_path: page,
        page_title: title,
        referrer: document.referrer,
        user_agent: navigator.userAgent,
        device_type: this.getDeviceType(),
        created_at: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Failed to store page view:', error);
    }
  }

  // E-commerce Events
  async trackViewItem(item: {
    item_id: string;
    item_name: string;
    category: string;
    sub_category?: string;
    price: number;
    service_category: 'beauty' | 'fitness' | 'lifestyle';
  }): Promise<void> {
    const event: GA4EcommerceEvent = {
      event_name: 'view_item',
      parameters: {
        currency: 'PLN', // Default, can be overridden
        value: item.price,
        items: [{
          item_id: item.item_id,
          item_name: item.item_name,
          category: item.category,
          sub_category: item.sub_category,
          price: item.price,
          quantity: 1,
        }],
      },
    };

    await this.trackEvent(event);
  }

  async trackAddToCart(item: {
    item_id: string;
    item_name: string;
    category: string;
    price: number;
    quantity: number;
    service_category: 'beauty' | 'fitness' | 'lifestyle';
  }): Promise<void> {
    const event: GA4EcommerceEvent = {
      event_name: 'add_to_cart',
      parameters: {
        currency: 'PLN',
        value: item.price * item.quantity,
        items: [{
          item_id: item.item_id,
          item_name: item.item_name,
          category: item.category,
          price: item.price,
          quantity: item.quantity,
        }],
      },
    };

    await this.trackEvent(event);
  }

  async trackPurchase(transaction: {
    transaction_id: string;
    value: number;
    currency: string;
    items: Array<{
      item_id: string;
      item_name: string;
      category: string;
      price: number;
      quantity: number;
    }>;
    payment_type?: string;
  }): Promise<void> {
    const event: GA4EcommerceEvent = {
      event_name: 'purchase',
      parameters: {
        transaction_id: transaction.transaction_id,
        currency: transaction.currency,
        value: transaction.value,
        payment_type: transaction.payment_type,
        items: transaction.items,
      },
    };

    await this.trackEvent(event);
  }

  // Booking Funnel Events
  async trackBookingStep(step: BookingAnalyticsEvent): Promise<void> {
    await this.trackEvent(step);

    // Store in database for custom funnel analysis
    this.storeBookingStepEvent(step);
  }

  private async storeBookingStepEvent(step: BookingAnalyticsEvent): Promise<void> {
    try {
      await supabase.from('analytics_booking_funnel').insert({
        session_id: step.parameters.user_session_id,
        user_id: this.userId,
        service_category: step.parameters.service_category,
        service_type: step.parameters.service_type,
        service_name: step.parameters.service_name,
        booking_step: step.parameters.booking_step,
        total_steps: step.parameters.total_steps,
        currency: step.parameters.currency,
        value: step.parameters.value,
        device_type: step.parameters.device_type,
        language: step.parameters.language,
        location: step.parameters.location,
        time_to_complete: step.parameters.time_to_complete,
        drop_off_point: step.parameters.drop_off_point,
        error_code: step.parameters.error_code,
        created_at: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Failed to store booking step event:', error);
    }
  }

  // Conversion Events
  async trackBookingComplete(booking: {
    booking_id: string;
    service_category: 'beauty' | 'fitness' | 'lifestyle';
    service_name: string;
    price: number;
    currency: string;
    total_booking_steps: number;
    time_to_complete: number;
  }): Promise<void> {
    const event: BookingAnalyticsEvent = {
      event_name: 'booking_complete',
      parameters: {
        service_category: booking.service_category,
        service_name: booking.service_name,
        booking_step: booking.total_booking_steps,
        total_steps: booking.total_booking_steps,
        currency: booking.currency,
        value: booking.price,
        user_session_id: this.sessionId,
        device_type: this.getDeviceType(),
        language: navigator.language,
        time_to_complete: booking.time_to_complete,
      },
    };

    await this.trackEvent(event);

    // Also track as purchase for GA4 e-commerce
    await this.trackPurchase({
      transaction_id: booking.booking_id,
      value: booking.price,
      currency: booking.currency,
      items: [{
        item_id: booking.booking_id,
        item_name: booking.service_name,
        category: booking.service_category,
        price: booking.price,
        quantity: 1,
      }],
    });
  }

  async trackBookingAbandonment(step: {
    booking_step: number;
    total_steps: number;
    service_category: 'beauty' | 'fitness' | 'lifestyle';
    reason?: string;
    time_spent_seconds: number;
  }): Promise<void> {
    const event: BookingAnalyticsEvent = {
      event_name: 'booking_abandon',
      parameters: {
        service_category: step.service_category,
        booking_step: step.booking_step,
        total_steps: step.total_steps,
        currency: 'PLN',
        user_session_id: this.sessionId,
        device_type: this.getDeviceType(),
        language: navigator.language,
        time_to_complete: step.time_spent_seconds,
        drop_off_point: step.booking_step,
      },
    };

    await this.trackEvent(event);
  }

  // User Behavior Events
  async trackServiceInteraction(interaction: {
    service_id: string;
    service_category: 'beauty' | 'fitness' | 'lifestyle';
    interaction_type: 'view_details' | 'add_favorites' | 'share' | 'compare';
    duration_seconds?: number;
  }): Promise<void> {
    const event: BookingAnalyticsEvent = {
      event_name: 'service_interaction',
      parameters: {
        service_category: interaction.service_category,
        service_name: interaction.service_id,
        booking_step: 0, // Not in booking flow
        total_steps: 0,
        currency: 'PLN',
        user_session_id: this.sessionId,
        device_type: this.getDeviceType(),
        language: navigator.language,
        time_to_complete: interaction.duration_seconds,
      },
    };

    await this.trackEvent(event);
  }

  async trackCurrencySwitch(fromCurrency: string, toCurrency: string): Promise<void> {
    const event: BookingAnalyticsEvent = {
      event_name: 'currency_switch',
      parameters: {
        service_category: 'lifestyle', // General category
        booking_step: 0,
        total_steps: 0,
        currency: toCurrency,
        user_session_id: this.sessionId,
        device_type: this.getDeviceType(),
        language: navigator.language,
      },
    };

    await this.trackEvent(event);
  }

  // Custom Events
  async trackCustomEvent(event: GA4EcommerceEvent | BookingAnalyticsEvent | FunnelEvent): Promise<void> {
    await this.trackEvent(event);
  }

  private async trackEvent(event: GA4EcommerceEvent | BookingAnalyticsEvent | FunnelEvent): Promise<void> {
    // Send to GA4 if enabled
    if (this.config.enabled) {
      window.gtag('event', event.event_name, {
        ...event.parameters,
        send_to: this.config.measurementId,
        timestamp: new Date().toISOString(),
      });
    }

    // Queue for batch processing
    this.eventQueue.push(event);

    // Process immediately for critical events
    const criticalEvents = ['purchase', 'booking_complete', 'booking_abandon'];
    if (criticalEvents.includes(event.event_name)) {
      await this.processBatch();
    }
  }

  private async processBatch(): Promise<void> {
    if (this.batchProcessing || this.eventQueue.length === 0) return;

    this.batchProcessing = true;
    const batch = [...this.eventQueue];
    this.eventQueue = [];

    try {
      // Store events in Supabase for custom analytics
      const formattedEvents = batch.map(event => ({
        session_id: this.sessionId,
        user_id: this.userId,
        event_name: event.event_name,
        parameters: event.parameters,
        created_at: new Date().toISOString(),
      }));

      await supabase.from('analytics_events').insert(formattedEvents);
    } catch (error) {
      console.error('Failed to store analytics batch:', error);
      // Re-add failed events to queue
      this.eventQueue.unshift(...batch);
    } finally {
      this.batchProcessing = false;
    }
  }

  private startBatchProcessing(): void {
    // Process batch every 30 seconds
    setInterval(() => {
      if (this.eventQueue.length > 0) {
        this.processBatch();
      }
    }, 30000);

    // Process before page unload
    if (typeof window !== 'undefined') {
      window.addEventListener('beforeunload', () => {
        this.processBatch();
      });
    }
  }

  // Analytics Methods
  async getFunnelAnalytics(startDate: string, endDate: string): Promise<any> {
    try {
      const { data, error } = await supabase
        .from('analytics_booking_funnel')
        .select('*')
        .gte('created_at', startDate)
        .lte('created_at', endDate);

      if (error) throw error;

      return this.calculateFunnelMetrics(data || []);
    } catch (error) {
      console.error('Failed to fetch funnel analytics:', error);
      throw error;
    }
  }

  private calculateFunnelMetrics(events: any[]): any {
    // Calculate funnel conversion rates
    const funnelSteps = [1, 2, 3, 4];
    const conversionRates: Record<number, number> = {};

    funnelSteps.forEach(step => {
      const stepEvents = events.filter(e => e.booking_step === step);
      const totalEvents = events.filter(e => e.booking_step >= step);
      conversionRates[step] = totalEvents.length > 0 ? stepEvents.length / totalEvents.length : 0;
    });

    // Calculate drop-off points
    const dropOffPoints = events
      .filter(e => e.drop_off_point)
      .reduce((acc, event) => {
        acc[event.drop_off_point] = (acc[event.drop_off_point] || 0) + 1;
        return acc;
      }, {} as Record<number, number>);

    return {
      conversion_rates: conversionRates,
      drop_off_points: dropOffPoints,
      total_sessions: new Set(events.map(e => e.session_id)).size,
      service_category_breakdown: this.calculateServiceCategoryBreakdown(events),
    };
  }

  private calculateServiceCategoryBreakdown(events: any[]): any {
    return events.reduce((acc, event) => {
      const category = event.service_category;
      if (!acc[category]) {
        acc[category] = {
          total_events: 0,
          completions: 0,
          abandonments: 0,
          average_time_to_complete: 0,
        };
      }
      acc[category].total_events++;
      if (event.booking_step === event.total_steps) {
        acc[category].completions++;
      }
      if (event.drop_off_point) {
        acc[category].abandonments++;
      }
      return acc;
    }, {} as Record<string, any>);
  }
}

// Export singleton instance
export const ga4Analytics = GA4AnalyticsService.getInstance();

// TypeScript declarations for gtag
declare global {
  interface Window {
    dataLayer: any[];
    gtag: (...args: any[]) => void;
  }
}