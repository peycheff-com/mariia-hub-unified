import { ga4Analytics } from './ga4';
import { supabase } from '@/integrations/supabase/client';

// Booking Funnel Configuration
const BOOKING_FUNNEL_STEPS = {
  1: 'Choose Service',
  2: 'Select Time',
  3: 'Enter Details',
  4: 'Complete Payment',
} as const;

// Service Categories
export type ServiceCategory = 'beauty' | 'fitness' | 'lifestyle';

// Booking Step Event Interface
export interface BookingStepEvent {
  step: number;
  service_category: ServiceCategory;
  service_type?: string;
  service_name?: string;
  service_price?: number;
  currency: string;
  session_id: string;
  timestamp: number;
  time_spent_seconds?: number;
  user_agent: string;
  device_type: 'mobile' | 'tablet' | 'desktop';
  success: boolean;
  error_code?: string;
  additional_data?: Record<string, any>;
}

// Booking Flow State
export interface BookingFlowState {
  session_id: string;
  current_step: number;
  service_category?: ServiceCategory;
  service_selected?: {
    id: string;
    name: string;
    type: string;
    price: number;
    category: ServiceCategory;
  };
  time_selected?: string;
  customer_info?: {
    name: string;
    email: string;
    phone: string;
  };
  step_timestamps: Record<number, number>;
  total_time_spent: number;
  currency: string;
  device_type: 'mobile' | 'tablet' | 'desktop';
  language: string;
  is_completed: boolean;
  abandonment_reason?: string;
}

export class BookingAnalyticsTracker {
  private static instance: BookingAnalyticsTracker;
  private bookingState: BookingFlowState | null = null;
  private sessionStartTime: number = 0;
  private stepStartTime: number = 0;

  constructor() {
    this.sessionStartTime = Date.now();
    this.initializeSession();
  }

  static getInstance(): BookingAnalyticsTracker {
    if (!BookingAnalyticsTracker.instance) {
      BookingAnalyticsTracker.instance = new BookingAnalyticsTracker();
    }
    return BookingAnalyticsTracker.instance;
  }

  private initializeSession(): void {
    this.bookingState = {
      session_id: this.generateSessionId(),
      current_step: 0,
      step_timestamps: {},
      total_time_spent: 0,
      currency: 'PLN',
      device_type: this.getDeviceType(),
      language: navigator.language,
      is_completed: false,
    };
  }

  private generateSessionId(): string {
    return `booking_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private getDeviceType(): 'mobile' | 'tablet' | 'desktop' {
    const width = window.innerWidth;
    if (width < 768) return 'mobile';
    if (width < 1024) return 'tablet';
    return 'desktop';
  }

  // Start booking flow
  async startBookingFlow(serviceCategory: ServiceCategory): Promise<void> {
    this.bookingState = {
      ...this.bookingState!,
      current_step: 1,
      service_category: serviceCategory,
      step_timestamps: { 1: Date.now() },
      total_time_spent: 0,
    };
    this.stepStartTime = Date.now();

    await this.trackBookingStep({
      step: 1,
      service_category: serviceCategory,
      currency: this.bookingState!.currency,
      session_id: this.bookingState!.session_id,
      timestamp: Date.now(),
      user_agent: navigator.userAgent,
      device_type: this.bookingState!.device_type,
      success: true,
    });

    // Track to GA4
    await ga4Analytics.trackBookingStep({
      event_name: 'booking_flow_start',
      parameters: {
        service_category: serviceCategory,
        booking_step: 1,
        total_steps: 4,
        currency: this.bookingState!.currency,
        user_session_id: this.bookingState!.session_id,
        device_type: this.bookingState!.device_type,
        language: this.bookingState!.language,
      },
    });
  }

  // Track service selection
  async trackServiceSelection(service: {
    id: string;
    name: string;
    type: string;
    price: number;
    category: ServiceCategory;
  }): Promise<void> {
    if (!this.bookingState) return;

    this.bookingState.service_selected = service;
    this.bookingState.current_step = 2;
    this.bookingState.step_timestamps[2] = Date.now();

    const timeSpent = Date.now() - this.stepStartTime;
    this.bookingState.total_time_spent += timeSpent;

    await this.trackBookingStep({
      step: 2,
      service_category: service.category,
      service_type: service.type,
      service_name: service.name,
      service_price: service.price,
      currency: this.bookingState!.currency,
      session_id: this.bookingState!.session_id,
      timestamp: Date.now(),
      time_spent_seconds: Math.round(timeSpent / 1000),
      user_agent: navigator.userAgent,
      device_type: this.bookingState!.device_type,
      success: true,
    });

    // Track service view in GA4
    await ga4Analytics.trackViewItem({
      item_id: service.id,
      item_name: service.name,
      category: service.type,
      price: service.price,
      service_category: service.category,
    });

    await ga4Analytics.trackBookingStep({
      event_name: 'service_selected',
      parameters: {
        service_category: service.category,
        service_type: service.type,
        service_name: service.name,
        booking_step: 2,
        total_steps: 4,
        currency: this.bookingState!.currency,
        value: service.price,
        user_session_id: this.bookingState!.session_id,
        device_type: this.bookingState!.device_type,
        language: this.bookingState!.language,
        time_to_complete: Math.round(timeSpent / 1000),
      },
    });

    this.stepStartTime = Date.now();
  }

  // Track time slot selection
  async trackTimeSelection(timeSlot: string, availability: 'available' | 'limited' | 'full'): Promise<void> {
    if (!this.bookingState) return;

    this.bookingState.time_selected = timeSlot;
    this.bookingState.current_step = 3;
    this.bookingState.step_timestamps[3] = Date.now();

    const timeSpent = Date.now() - this.stepStartTime;
    this.bookingState.total_time_spent += timeSpent;

    await this.trackBookingStep({
      step: 3,
      service_category: this.bookingState.service_category!,
      service_type: this.bookingState.service_selected?.type,
      service_name: this.bookingState.service_selected?.name,
      currency: this.bookingState!.currency,
      session_id: this.bookingState!.session_id,
      timestamp: Date.now(),
      time_spent_seconds: Math.round(timeSpent / 1000),
      user_agent: navigator.userAgent,
      device_type: this.bookingState!.device_type,
      success: availability !== 'full',
      error_code: availability === 'full' ? 'slot_unavailable' : undefined,
      additional_data: {
        selected_time: timeSlot,
        availability_status: availability,
      },
    });

    await ga4Analytics.trackBookingStep({
      event_name: 'time_selected',
      parameters: {
        service_category: this.bookingState.service_category!,
        service_type: this.bookingState.service_selected?.type,
        service_name: this.bookingState.service_selected?.name,
        booking_step: 3,
        total_steps: 4,
        currency: this.bookingState!.currency,
        value: this.bookingState.service_selected?.price,
        user_session_id: this.bookingState!.session_id,
        device_type: this.bookingState!.device_type,
        language: this.bookingState!.language,
        time_to_complete: Math.round(timeSpent / 1000),
        error_code: availability === 'full' ? 'slot_unavailable' : undefined,
      },
    });

    this.stepStartTime = Date.now();
  }

  // Track customer information entry
  async trackCustomerInfo(customerInfo: {
    name: string;
    email: string;
    phone: string;
  }): Promise<void> {
    if (!this.bookingState) return;

    this.bookingState.customer_info = customerInfo;
    this.bookingState.current_step = 4;
    this.bookingState.step_timestamps[4] = Date.now();

    const timeSpent = Date.now() - this.stepStartTime;
    this.bookingState.total_time_spent += timeSpent;

    await this.trackBookingStep({
      step: 4,
      service_category: this.bookingState.service_category!,
      service_type: this.bookingState.service_selected?.type,
      service_name: this.bookingState.service_selected?.name,
      currency: this.bookingState!.currency,
      session_id: this.bookingState!.session_id,
      timestamp: Date.now(),
      time_spent_seconds: Math.round(timeSpent / 1000),
      user_agent: navigator.userAgent,
      device_type: this.bookingState!.device_type,
      success: true,
      additional_data: {
        customer_provided: true,
        customer_type: this.getCustomerType(customerInfo),
      },
    });

    await ga4Analytics.trackBookingStep({
      event_name: 'customer_info_entered',
      parameters: {
        service_category: this.bookingState.service_category!,
        service_type: this.bookingState.service_selected?.type,
        service_name: this.bookingState.service_selected?.name,
        booking_step: 4,
        total_steps: 4,
        currency: this.bookingState!.currency,
        value: this.bookingState.service_selected?.price,
        user_session_id: this.bookingState!.session_id,
        device_type: this.bookingState!.device_type,
        language: this.bookingState!.language,
        time_to_complete: Math.round(timeSpent / 1000),
      },
    });

    this.stepStartTime = Date.now();
  }

  // Track booking completion
  async trackBookingCompletion(bookingId: string, paymentStatus: 'success' | 'failed'): Promise<void> {
    if (!this.bookingState) return;

    const timeSpent = Date.now() - this.stepStartTime;
    this.bookingState.total_time_spent += timeSpent;
    this.bookingState.is_completed = paymentStatus === 'success';

    await this.trackBookingStep({
      step: 4,
      service_category: this.bookingState.service_category!,
      service_type: this.bookingState.service_selected?.type,
      service_name: this.bookingState.service_selected?.name,
      service_price: this.bookingState.service_selected?.price,
      currency: this.bookingState!.currency,
      session_id: this.bookingState!.session_id,
      timestamp: Date.now(),
      time_spent_seconds: Math.round(timeSpent / 1000),
      user_agent: navigator.userAgent,
      device_type: this.bookingState!.device_type,
      success: paymentStatus === 'success',
      error_code: paymentStatus === 'failed' ? 'payment_failed' : undefined,
      additional_data: {
        booking_id: bookingId,
        payment_status: paymentStatus,
        total_booking_time: this.bookingState.total_time_spent,
        completion_rate: this.calculateCompletionRate(),
      },
    });

    if (paymentStatus === 'success') {
      await ga4Analytics.trackBookingComplete({
        booking_id: bookingId,
        service_category: this.bookingState.service_category!,
        service_name: this.bookingState.service_selected?.name || '',
        price: this.bookingState.service_selected?.price || 0,
        currency: this.bookingState!.currency,
        total_booking_steps: 4,
        time_to_complete: Math.round(this.bookingState.total_time_spent / 1000),
      });
    }

    // Store complete booking journey
    await this.storeCompleteBookingJourney(bookingId, paymentStatus);
  }

  // Track booking abandonment
  async trackBookingAbandonment(reason: string, currentStep?: number): Promise<void> {
    if (!this.bookingState) return;

    const abandonmentStep = currentStep || this.bookingState.current_step;
    const timeSpent = Date.now() - this.stepStartTime;
    this.bookingState.total_time_spent += timeSpent;
    this.bookingState.abandonment_reason = reason;

    await this.trackBookingStep({
      step: abandonmentStep,
      service_category: this.bookingState.service_category!,
      service_type: this.bookingState.service_selected?.type,
      service_name: this.bookingState.service_selected?.name,
      currency: this.bookingState!.currency,
      session_id: this.bookingState!.session_id,
      timestamp: Date.now(),
      time_spent_seconds: Math.round(timeSpent / 1000),
      user_agent: navigator.userAgent,
      device_type: this.bookingState!.device_type,
      success: false,
      error_code: 'abandoned',
      additional_data: {
        abandonment_reason: reason,
        total_booking_time: this.bookingState.total_time_spent,
        steps_completed: abandonmentStep - 1,
      },
    });

    await ga4Analytics.trackBookingAbandonment({
      booking_step: abandonmentStep,
      total_steps: 4,
      service_category: this.bookingState.service_category!,
      reason: reason,
      time_spent_seconds: Math.round(this.bookingState.total_time_spent / 1000),
    });

    // Store abandonment data
    await this.storeBookingAbandonment(reason, abandonmentStep);
  }

  // Track errors
  async trackBookingError(error: string, currentStep: number, errorCode?: string): Promise<void> {
    if (!this.bookingState) return;

    const timeSpent = Date.now() - this.stepStartTime;

    await this.trackBookingStep({
      step: currentStep,
      service_category: this.bookingState.service_category!,
      service_type: this.bookingState.service_selected?.type,
      service_name: this.bookingState.service_selected?.name,
      currency: this.bookingState!.currency,
      session_id: this.bookingState!.session_id,
      timestamp: Date.now(),
      time_spent_seconds: Math.round(timeSpent / 1000),
      user_agent: navigator.userAgent,
      device_type: this.bookingState!.device_type,
      success: false,
      error_code: errorCode || 'booking_error',
      additional_data: {
        error_message: error,
        error_severity: this.getErrorSeverity(error),
      },
    });

    await ga4Analytics.trackBookingStep({
      event_name: 'booking_error',
      parameters: {
        service_category: this.bookingState.service_category!,
        service_type: this.bookingState.service_selected?.type,
        service_name: this.bookingState.service_selected?.name,
        booking_step: currentStep,
        total_steps: 4,
        currency: this.bookingState!.currency,
        user_session_id: this.bookingState!.session_id,
        device_type: this.bookingState!.device_type,
        language: this.bookingState!.language,
        error_code: errorCode || 'booking_error',
      },
    });
  }

  // Helper methods
  private async trackBookingStep(event: BookingStepEvent): Promise<void> {
    try {
      await supabase.from('booking_analytics_events').insert({
        session_id: event.session_id,
        step: event.step,
        service_category: event.service_category,
        service_type: event.service_type,
        service_name: event.service_name,
        service_price: event.service_price,
        currency: event.currency,
        timestamp: new Date(event.timestamp).toISOString(),
        time_spent_seconds: event.time_spent_seconds,
        user_agent: event.user_agent,
        device_type: event.device_type,
        success: event.success,
        error_code: event.error_code,
        additional_data: event.additional_data,
      });
    } catch (error) {
      console.error('Failed to track booking step:', error);
    }
  }

  private async storeCompleteBookingJourney(bookingId: string, paymentStatus: string): Promise<void> {
    if (!this.bookingState) return;

    try {
      await supabase.from('booking_journeys').insert({
        session_id: this.bookingState.session_id,
        booking_id: bookingId,
        service_category: this.bookingState.service_category,
        service_selected: this.bookingState.service_selected,
        time_selected: this.bookingState.time_selected,
        customer_info: this.bookingState.customer_info,
        step_timestamps: this.bookingState.step_timestamps,
        total_time_spent_ms: this.bookingState.total_time_spent,
        currency: this.bookingState.currency,
        device_type: this.bookingState.device_type,
        language: this.bookingState.language,
        is_completed: paymentStatus === 'success',
        payment_status: paymentStatus,
        abandonment_reason: this.bookingState.abandonment_reason,
        created_at: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Failed to store booking journey:', error);
    }
  }

  private async storeBookingAbandonment(reason: string, step: number): Promise<void> {
    if (!this.bookingState) return;

    try {
      await supabase.from('booking_abandonments').insert({
        session_id: this.bookingState.session_id,
        service_category: this.bookingState.service_category,
        service_selected: this.bookingState.service_selected,
        abandonment_step: step,
        abandonment_reason: reason,
        total_time_spent_ms: this.bookingState.total_time_spent,
        device_type: this.bookingState.device_type,
        language: this.bookingState.language,
        step_data: {
          step_timestamps: this.bookingState.step_timestamps,
          current_step: this.bookingState.current_step,
        },
        created_at: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Failed to store booking abandonment:', error);
    }
  }

  private getCustomerType(customerInfo: { name: string; email: string; phone: string }): 'new' | 'returning' {
    // Simple heuristic - in real implementation, check against customer database
    const emailDomain = customerInfo.email.split('@')[1];
    const commonDomains = ['gmail.com', 'outlook.com', 'yahoo.com'];
    return commonDomains.includes(emailDomain) ? 'new' : 'returning';
  }

  private calculateCompletionRate(): number {
    if (!this.bookingState) return 0;
    const completedSteps = Object.keys(this.bookingState.step_timestamps).length;
    return (completedSteps / 4) * 100;
  }

  private getErrorSeverity(error: string): 'low' | 'medium' | 'high' {
    const highSeverityKeywords = ['payment', 'credit card', 'stripe', 'critical', 'system'];
    const mediumSeverityKeywords = ['validation', 'required', 'format', 'availability'];

    const lowerError = error.toLowerCase();

    if (highSeverityKeywords.some(keyword => lowerError.includes(keyword))) {
      return 'high';
    }
    if (mediumSeverityKeywords.some(keyword => lowerError.includes(keyword))) {
      return 'medium';
    }
    return 'low';
  }

  // Public methods for external usage
  getCurrentBookingState(): BookingFlowState | null {
    return this.bookingState;
  }

  getBookingSessionId(): string {
    return this.bookingState?.session_id || '';
  }

  resetBookingFlow(): void {
    this.initializeSession();
    this.stepStartTime = Date.now();
  }
}

// Export singleton instance
export const bookingTracker = BookingAnalyticsTracker.getInstance();