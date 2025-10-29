import { supabase } from '@/integrations/supabase/client';
import { MetaEventConfig, MetaConversion } from '@/types/messaging-referral';
import { logger } from '@/lib/logger';

export interface MetaCAPIConfig {
  accessToken: string;
  pixelId: string;
  testEventCode?: string;
  apiVersion: string;
}

export interface ConversionEvent {
  event_name: string;
  event_time: number;
  event_id?: string;
  user_data?: {
    em?: string[];
    ph?: string[];
    fn?: string[];
    ln?: string[];
    ct?: string[];
    st?: string[];
    zp?: string[];
    country?: string[];
    external_id?: string[];
  };
  custom_data?: {
    currency?: string;
    value?: number;
    content_ids?: string[];
    content_type?: string;
    order_id?: string;
    content_name?: string;
    contents?: Array<{
      id: string;
      quantity: number;
      item_price: number;
      title?: string;
    }>;
  };
  action_source: 'website' | 'app' | 'phone_call' | 'physical_store' | 'other' | 'system_generated';
  event_source_url?: string;
  data_processing_options?: string[];
}

export class MetaConversionsAPI {
  private config: MetaCAPIConfig;
  private baseUrl = 'https://graph.facebook.com';
  private eventCache = new Map<string, number>(); // For deduplication
  private retryQueue: Array<{ event: ConversionEvent; retries: number; nextRetry: Date }> = [];
  private isProcessingQueue = false;

  constructor(config: MetaCAPIConfig) {
    this.config = config;
    this.startRetryProcessor();
  }

  private async makeRequest(endpoint: string, data: any) {
    const url = `${this.baseUrl}/${this.config.apiVersion}/${endpoint}`;
    const headers = {
      'Authorization': `Bearer ${this.config.accessToken}`,
      'Content-Type': 'application/json',
    };

    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Meta CAPI Error: ${error.error?.message || 'Unknown error'}`);
    }

    return response.json();
  }

  // Send a single conversion event
  async sendEvent(event: ConversionEvent) {
    // Check for duplicate events
    if (this.isDuplicateEvent(event)) {
      logger.info('Duplicate event detected, skipping', { eventId: event.event_id });
      return { duplicate: true, message: 'Duplicate event detected' };
    }

    const payload = {
      data: [event],
      test_event_code: this.config.testEventCode,
    };

    try {
      const response = await this.makeRequest(`${this.config.pixelId}/events`, payload);
      logger.info('Event sent successfully', { eventId: event.event_id, eventName: event.event_name });
      return response;
    } catch (error) {
      logger.error('Failed to send event, adding to retry queue', { eventId: event.event_id, error });
      await this.addToRetryQueue(event);
      throw error;
    }
  }

  // Send multiple conversion events in batch
  async sendBatchEvents(events: ConversionEvent[]) {
    const payload = {
      data: events,
      test_event_code: this.config.testEventCode,
    };

    return this.makeRequest(`${this.config.pixelId}/events`, payload);
  }

  // Event deduplication
  private generateEventHash(event: ConversionEvent): string {
    const hashData = {
      event_name: event.event_name,
      event_time: event.event_time,
      user_data: event.user_data,
      custom_data: event.custom_data,
    };
    return btoa(JSON.stringify(hashData)).slice(0, 32);
  }

  private isDuplicateEvent(event: ConversionEvent): boolean {
    const hash = this.generateEventHash(event);
    const now = Date.now();
    const existingTime = this.eventCache.get(hash);

    if (existingTime && (now - existingTime) < 24 * 60 * 60 * 1000) { // 24 hour window
      return true;
    }

    this.eventCache.set(hash, now);

    // Clean old entries from cache
    if (this.eventCache.size > 10000) {
      const cutoff = now - 24 * 60 * 60 * 1000;
      for (const [key, time] of this.eventCache.entries()) {
        if (time < cutoff) {
          this.eventCache.delete(key);
        }
      }
    }

    return false;
  }

  // Retry logic
  private async addToRetryQueue(event: ConversionEvent) {
    const retryItem = {
      event,
      retries: 0,
      nextRetry: new Date(Date.now() + 5 * 60 * 1000), // 5 minutes
    };

    this.retryQueue.push(retryItem);
    logger.info('Event added to retry queue', { eventId: event.event_id });
  }

  private startRetryProcessor() {
    setInterval(() => {
      if (!this.isProcessingQueue && this.retryQueue.length > 0) {
        this.processRetryQueue();
      }
    }, 60000); // Check every minute
  }

  private async processRetryQueue() {
    this.isProcessingQueue = true;
    const now = new Date();
    const itemsToRetry = this.retryQueue.filter(item => item.nextRetry <= now);

    for (const item of itemsToRetry) {
      try {
        await this.makeRequest(`${this.config.pixelId}/events`, { data: [item.event] });

        // Remove from queue and update database
        this.retryQueue = this.retryQueue.filter(i => i !== item);
        await this.updateEventStatus(item.event.event_id, 'sent');

        logger.info('Event successfully retried', { eventId: item.event.event_id });
      } catch (error) {
        item.retries++;

        if (item.retries >= 3) {
          // Max retries reached, mark as failed
          this.retryQueue = this.retryQueue.filter(i => i !== item);
          await this.updateEventStatus(item.event.event_id, 'failed');
          logger.error('Event failed after max retries', { eventId: item.event.event_id, error });
        } else {
          // Exponential backoff
          const backoffMinutes = Math.pow(2, item.retries) * 5;
          item.nextRetry = new Date(Date.now() + backoffMinutes * 60 * 1000);
          logger.info('Event retry scheduled', {
            eventId: item.event.event_id,
            retry: item.retries,
            nextRetry: item.nextRetry
          });
        }
      }
    }

    this.isProcessingQueue = false;
  }

  private async updateEventStatus(eventId: string, status: 'sent' | 'failed') {
    try {
      await supabase
        .from('meta_conversions')
        .update({
          status,
          retry_count: supabase.rpc('increment_retry_count', { event_id: eventId }),
          last_retry_at: new Date().toISOString()
        })
        .eq('event_id', eventId);
    } catch (error) {
      logger.error('Failed to update event status', { eventId, status, error });
    }
  }

  // Hash user data for privacy compliance
  hashUserData(userData: { [key: string]: string }): { [key: string]: string } {
    const hashed: { [key: string]: string } = {};

    const hashValue = async (value: string) => {
      const encoder = new TextEncoder();
      const data = encoder.encode(value.toLowerCase().trim());
      const hashBuffer = await crypto.subtle.digest('SHA-256', data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    };

    // Hash PII fields
    ['em', 'ph', 'fn', 'ln', 'ct', 'st', 'zp'].forEach(field => {
      if (userData[field]) {
        hashed[field] = hashValue(userData[field]);
      }
    });

    return hashed;
  }

  // Prepare user data from user profile
  async prepareUserData(user: any) {
    const userData: any = {};

    if (user.email) userData.em = user.email;
    if (user.phone) userData.ph = user.phone;
    if (user.first_name) userData.fn = user.first_name;
    if (user.last_name) userData.ln = user.last_name;
    if (user.city) userData.ct = user.city;
    if (user.state) userData.st = user.state;
    if (user.postal_code) userData.zp = user.postal_code;
    if (user.country) userData.country = user.country;
    if (user.external_id) userData.external_id = user.external_id;

    // Return hashed user data
    return this.hashUserData(userData);
  }

  // Track booking completed
  async trackBookingCompleted(
    user: any,
    bookingData: {
      id: string;
      total_amount: number;
      currency: string;
      services: Array<{
        id: string;
        name: string;
        price: number;
      }>;
    }
  ) {
    const userData = await this.prepareUserData(user);
    const eventData: ConversionEvent = {
      event_name: 'Purchase',
      event_time: Math.floor(Date.now() / 1000),
      user_data: userData,
      custom_data: {
        currency: bookingData.currency,
        value: bookingData.total_amount,
        order_id: bookingData.id,
        content_ids: bookingData.services.map(s => s.id),
        content_type: 'service',
        contents: bookingData.services.map(s => ({
          id: s.id,
          quantity: 1,
          item_price: s.price,
          title: s.name,
        })),
      },
      action_source: 'website',
      event_source_url: window.location.href,
      data_processing_options: ['LDU'],
    };

    return this.sendEvent(eventData);
  }

  // Track booking initiated
  async trackBookingInitiated(user: any, bookingData?: any) {
    const userData = await this.prepareUserData(user);
    const eventData: ConversionEvent = {
      event_name: 'InitiateCheckout',
      event_time: Math.floor(Date.now() / 1000),
      user_data: userData,
      action_source: 'website',
      event_source_url: window.location.href,
      data_processing_options: ['LDU'],
    };

    if (bookingData?.services?.length) {
      eventData.custom_data = {
        content_ids: bookingData.services.map((s: any) => s.id),
        content_type: 'service',
        contents: bookingData.services.map((s: any) => ({
          id: s.id,
          quantity: 1,
          item_price: s.price || 0,
          title: s.name || s.title,
        })),
      };
    }

    return this.sendEvent(eventData);
  }

  // Track service view
  async trackServiceView(user: any, service: any) {
    const userData = await this.prepareUserData(user);
    const eventData: ConversionEvent = {
      event_name: 'ViewContent',
      event_time: Math.floor(Date.now() / 1000),
      user_data: userData,
      custom_data: {
        content_ids: [service.id],
        content_type: 'service',
        content_name: service.name || service.title,
        value: service.price || service.price_from,
        currency: service.currency || 'PLN',
      },
      action_source: 'website',
      event_source_url: window.location.href,
      data_processing_options: ['LDU'],
    };

    return this.sendEvent(eventData);
  }

  // Track newsletter subscription
  async trackNewsletterSubscription(user: any) {
    const userData = await this.prepareUserData(user);
    const eventData: ConversionEvent = {
      event_name: 'Lead',
      event_time: Math.floor(Date.now() / 1000),
      user_data: userData,
      custom_data: {
        content_name: 'Newsletter Subscription',
      },
      action_source: 'website',
      event_source_url: window.location.href,
      data_processing_options: ['LDU'],
    };

    return this.sendEvent(eventData);
  }

  // Track contact form submission
  async trackContactForm(user: any, formData?: any) {
    const userData = await this.prepareUserData(user);
    const eventData: ConversionEvent = {
      event_name: 'Lead',
      event_time: Math.floor(Date.now() / 1000),
      user_data: userData,
      custom_data: {
        content_name: 'Contact Form Submission',
        content_category: formData?.subject || 'General Inquiry',
      },
      action_source: 'website',
      event_source_url: window.location.href,
      data_processing_options: ['LDU'],
    };

    return this.sendEvent(eventData);
  }

  // Track referral click
  async trackReferralClick(user: any, referralCode: string) {
    const userData = await this.prepareUserData(user);
    const eventData: ConversionEvent = {
      event_name: 'Lead',
      event_time: Math.floor(Date.now() / 1000),
      user_data: userData,
      custom_data: {
        content_name: 'Referral Click',
        content_category: 'Referral Program',
        referral_code: referralCode,
      },
      action_source: 'website',
      event_source_url: window.location.href,
      data_processing_options: ['LDU'],
    };

    return this.sendEvent(eventData);
  }

  // Track registration
  async trackRegistration(user: any) {
    const userData = await this.prepareUserData(user);
    const eventData: ConversionEvent = {
      event_name: 'CompleteRegistration',
      event_time: Math.floor(Date.now() / 1000),
      user_data: userData,
      action_source: 'website',
      event_source_url: window.location.href,
      data_processing_options: ['LDU'],
    };

    return this.sendEvent(eventData);
  }

  // Track custom event
  async trackCustomEvent(
    eventName: string,
    user: any,
    customData?: any,
    eventSourceUrl?: string
  ) {
    const userData = await this.prepareUserData(user);
    const eventData: ConversionEvent = {
      event_name: eventName,
      event_time: Math.floor(Date.now() / 1000),
      user_data: userData,
      custom_data: customData,
      action_source: 'website',
      event_source_url: eventSourceUrl || window.location.href,
      data_processing_options: ['LDU'],
    };

    return this.sendEvent(eventData);
  }

  // Track PageView event
  async trackPageView(user: any, pageData?: { page?: string; title?: string; referrer?: string }) {
    const userData = await this.prepareUserData(user);
    const eventData: ConversionEvent = {
      event_name: 'PageView',
      event_time: Math.floor(Date.now() / 1000),
      user_data: userData,
      custom_data: {
        page: pageData?.page || window.location.pathname,
        page_title: pageData?.title || document.title,
        referrer: pageData?.referrer || document.referrer,
      },
      action_source: 'website',
      event_source_url: window.location.href,
      data_processing_options: ['LDU'],
    };

    return this.sendEvent(eventData);
  }

  // Track AddToCart event (service selection)
  async trackAddToCart(
    user: any,
    service: any,
    quantity: number = 1,
    customData?: any
  ) {
    const userData = await this.prepareUserData(user);
    const eventData: ConversionEvent = {
      event_name: 'AddToCart',
      event_time: Math.floor(Date.now() / 1000),
      user_data: userData,
      custom_data: {
        content_ids: [service.id],
        content_type: 'service',
        content_name: service.name || service.title,
        content_category: service.category || service.service_type,
        value: service.price || service.price_from,
        currency: service.currency || 'PLN',
        quantity,
        ...customData,
      },
      action_source: 'website',
      event_source_url: window.location.href,
      data_processing_options: ['LDU'],
    };

    return this.sendEvent(eventData);
  }

  // Track business-specific custom events
  async trackBusinessEvent(
    eventName: string,
    user: any,
    businessData: {
      businessCategory?: string;
      serviceLocation?: string;
      appointmentType?: string;
      staffMember?: string;
      packageType?: string;
      membershipTier?: string;
    },
    customData?: any
  ) {
    const userData = await this.prepareUserData(user);
    const eventData: ConversionEvent = {
      event_name: eventName,
      event_time: Math.floor(Date.now() / 1000),
      user_data: userData,
      custom_data: {
        ...businessData,
        ...customData,
      },
      action_source: 'website',
      event_source_url: window.location.href,
      data_processing_options: ['LDU'],
    };

    return this.sendEvent(eventData);
  }

  // Get retry queue status
  getRetryQueueStatus() {
    return {
      queueLength: this.retryQueue.length,
      isProcessing: this.isProcessingQueue,
      nextRetryCount: this.retryQueue.filter(item => item.nextRetry <= new Date()).length,
    };
  }

  // Clear retry queue (useful for testing)
  clearRetryQueue() {
    this.retryQueue = [];
    this.eventCache.clear();
  }

  // Track conversion with UTM parameters
  async trackConversionWithUTM(
    eventName: string,
    user: any,
    utmData: {
      utm_source?: string;
      utm_medium?: string;
      utm_campaign?: string;
      utm_term?: string;
      utm_content?: string;
    },
    customData?: any
  ) {
    const userData = await this.prepareUserData(user);
    const eventData: ConversionEvent = {
      event_name: eventName,
      event_time: Math.floor(Date.now() / 1000),
      user_data: userData,
      custom_data: {
        ...customData,
        ...utmData,
      },
      action_source: 'website',
      event_source_url: window.location.href,
      data_processing_options: ['LDU'],
    };

    return this.sendEvent(eventData);
  }
}

// Singleton instance
let metaConversionsAPI: MetaConversionsAPI | null = null;

export function getMetaConversionsAPI(): MetaConversionsAPI {
  if (!metaConversionsAPI) {
    const config: MetaCAPIConfig = {
      accessToken: import.meta.env.VITE_META_ACCESS_TOKEN || '',
      pixelId: import.meta.env.VITE_META_PIXEL_ID || '',
      testEventCode: import.meta.env.VITE_META_TEST_CODE,
      apiVersion: import.meta.env.VITE_META_API_VERSION || 'v18.0',
    };

    metaConversionsAPI = new MetaConversionsAPI(config);
  }

  return metaConversionsAPI;
}

// Helper function to send conversion event and log to database
export async function sendConversionEvent(
  eventName: string,
  user: any,
  eventData?: any,
  options?: {
    customData?: any;
    conversionValue?: number;
    currency?: string;
  }
) {
  try {
    // Get Meta CAPI instance
    const api = getMetaConversionsAPI();

    // Prepare conversion event
    const conversionEvent: ConversionEvent = {
      event_name: eventName,
      event_time: Math.floor(Date.now() / 1000),
      event_id: `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      user_data: await api.prepareUserData(user),
      custom_data: {
        ...eventData,
        ...(options?.customData || {}),
        ...(options?.conversionValue && { value: options.conversionValue }),
        ...(options?.currency && { currency: options.currency || 'PLN' }),
      },
      action_source: 'website',
      event_source_url: window.location.href,
      data_processing_options: ['LDU'],
    };

    // Send to Meta
    const response = await api.sendEvent(conversionEvent);

    // Log to database
    await supabase.from('meta_conversions').insert({
      event_name: eventName,
      event_id: conversionEvent.event_id,
      event_time: conversionEvent.event_time,
      user_data: conversionEvent.user_data,
      custom_data: conversionEvent.custom_data,
      action_source: conversionEvent.action_source,
      event_source_url: conversionEvent.event_source_url,
      data_processing_options: conversionEvent.data_processing_options,
      original_event_data: conversionEvent,
      conversion_value: options?.conversionValue,
      currency: options?.currency || 'PLN',
      status: 'sent',
      meta_response: response,
    });

    return { success: true, response };
  } catch (error) {
    console.error('Error sending conversion event:', error);

    // Log failed attempt
    await supabase.from('meta_conversions').insert({
      event_name: eventName,
      event_time: Math.floor(Date.now() / 1000),
      user_data: {},
      custom_data: eventData,
      action_source: 'website',
      event_source_url: window.location.href,
      original_event_data: eventData,
      conversion_value: options?.conversionValue,
      currency: options?.currency || 'PLN',
      status: 'failed',
      meta_response: { error: error instanceof Error ? error.message : 'Unknown error' },
    });

    return { success: false, error };
  }
}

// Analytics functions
export async function getConversionAnalytics(startDate: Date, endDate: Date) {
  const { data, error } = await supabase
    .from('meta_conversions')
    .select('*')
    .gte('created_at', startDate.toISOString())
    .lte('created_at', endDate.toISOString())
    .eq('status', 'sent');

  if (error) throw error;

  // Group by event type
  const analytics: { [key: string]: number } = {};
  let totalValue = 0;
  const totalEvents = data.length;

  data.forEach((event) => {
    analytics[event.event_name] = (analytics[event.event_name] || 0) + 1;
    totalValue += event.conversion_value || 0;
  });

  return {
    totalEvents,
    totalValue,
    eventsByType: analytics,
    events: data,
  };
}

// Enhanced React hook for Meta CAPI
export function useMetaConversions() {
  const api = getMetaConversionsAPI();

  const trackEvent = async (
    eventName: string,
    user: any,
    eventData?: any,
    options?: {
      customData?: any;
      conversionValue?: number;
      currency?: string;
    }
  ) => {
    return sendConversionEvent(eventName, user, eventData, options);
  };

  const trackPageView = async (user: any, pageData?: { page?: string; title?: string; referrer?: string }) => {
    try {
      return await api.trackPageView(user, pageData);
    } catch (error) {
      logger.error('Failed to track PageView', error);
    }
  };

  const trackBooking = async (
    user: any,
    bookingData: any,
    isCompleted = false
  ) => {
    return trackEvent(
      isCompleted ? 'Purchase' : 'InitiateCheckout',
      user,
      {
        order_id: bookingData.id,
        content_ids: bookingData.services?.map((s: any) => s.id) || [],
        content_type: 'service',
      },
      {
        conversionValue: bookingData.total_amount,
        currency: bookingData.currency || 'PLN',
      }
    );
  };

  const trackView = async (user: any, service: any) => {
    return trackEvent(
      'ViewContent',
      user,
      {
        content_ids: [service.id],
        content_type: 'service',
        content_name: service.name || service.title,
        value: service.price || service.price_from,
      },
      {
        conversionValue: service.price || service.price_from,
        currency: service.currency || 'PLN',
      }
    );
  };

  const trackAddToCart = async (user: any, service: any, quantity?: number, customData?: any) => {
    try {
      return await api.trackAddToCart(user, service, quantity, customData);
    } catch (error) {
      logger.error('Failed to track AddToCart', error);
    }
  };

  const trackLead = async (user: any, leadType: string, leadData?: any) => {
    return trackEvent(
      'Lead',
      user,
      {
        content_name: leadType,
        content_category: leadData?.category || 'General',
      }
    );
  };

  const trackBusinessEvent = async (
    eventName: string,
    user: any,
    businessData: {
      businessCategory?: string;
      serviceLocation?: string;
      appointmentType?: string;
      staffMember?: string;
      packageType?: string;
      membershipTier?: string;
    },
    customData?: any
  ) => {
    try {
      return await api.trackBusinessEvent(eventName, user, businessData, customData);
    } catch (error) {
      logger.error('Failed to track business event', { eventName, error });
    }
  };

  const getRetryStatus = () => {
    return api.getRetryQueueStatus();
  };

  return {
    trackEvent,
    trackPageView,
    trackBooking,
    trackView,
    trackAddToCart,
    trackLead,
    trackBusinessEvent,
    getRetryStatus,
    // Convenience methods
    trackRegistration: (user: any) => trackEvent('CompleteRegistration', user),
    trackNewsletter: (user: any) => trackLead(user, 'Newsletter Subscription'),
    trackContact: (user: any, formData?: any) => trackLead(user, 'Contact Form', formData),
    trackReferral: (user: any, referralCode: string) => trackLead(user, 'Referral', { referralCode }),
    trackPackagePurchase: (user: any, packageData: any) => trackBusinessEvent('PackagePurchase', user, {
      packageType: packageData.type,
      businessCategory: 'packages'
    }, packageData),
    trackMembershipUpgrade: (user: any, membershipData: any) => trackBusinessEvent('MembershipUpgrade', user, {
      membershipTier: membershipData.tier,
      businessCategory: 'membership'
    }, membershipData),
  };
}