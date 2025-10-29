// Enhanced Google Analytics 4 tracking

declare global {
  interface Window {
    gtag: (...args: any[]) => void;
    dataLayer: any[];
  }
}

interface GA4Event {
  action: string;
  category?: string;
  label?: string;
  value?: number;
  parameters?: Record<string, any>;
}

interface EcommerceItem {
  item_id: string;
  item_name: string;
  category: string;
  quantity: number;
  price: number;
  currency?: string;
  variant?: string;
}

interface EcommercePurchase {
  transaction_id: string;
  value: number;
  currency: string;
  items: EcommerceItem[];
  coupon?: string;
  payment_method?: string;
  deposit_amount?: number;
  deposit_required?: boolean;
}

interface DepositEvent {
  booking_id: string;
  service_id: string;
  service_type: string;
  deposit_amount: number;
  deposit_type: 'fixed' | 'percentage';
  refund_policy: string;
  total_amount: number;
  currency: string;
}

export class AnalyticsService {
  private static initialized = false;

  static initialize(measurementId: string) {
    if (this.initialized || typeof window === 'undefined') return;

    // Load gtag script
    const script = document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
    document.head.appendChild(script);

    // Initialize gtag
    window.dataLayer = window.dataLayer || [];
    window.gtag = function () {
      window.dataLayer.push(arguments);
    };

    window.gtag('js', new Date());
    window.gtag('config', measurementId, {
      debug_mode: import.meta.env.DEV,
      custom_map: {
        custom_parameter_1: 'user_mode',
        custom_parameter_2: 'service_category'
      }
    });

    this.initialized = true;
  }

  // Track page views
  static pageview(path: string, title?: string) {
    if (!this.initialized) return;

    window.gtag('config', import.meta.env.VITE_GA4_MEASUREMENT_ID, {
      page_path: path,
      page_title: title || document.title
    });
  }

  // Track custom events
  static track(event: GA4Event) {
    if (!this.initialized) return;

    const parameters = {
      event_category: event.category,
      event_label: event.label,
      value: event.value,
      custom_parameter_1: event.parameters?.mode,
      custom_parameter_2: event.parameters?.category,
      ...event.parameters
    };

    window.gtag('event', event.action, parameters);
  }

  // User engagement events
  static trackLogin(method: string = 'email') {
    this.track({
      action: 'login',
      category: 'engagement',
      parameters: { method }
    });
  }

  static trackSignup(method: string = 'email') {
    this.track({
      action: 'sign_up',
      category: 'engagement',
      parameters: { method }
    });
  }

  static trackSearch(searchTerm: string, category?: string) {
    this.track({
      action: 'search',
      category: 'engagement',
      parameters: {
        search_term: searchTerm,
        category
      }
    });
  }

  // Booking funnel events
  static trackBookingStart(serviceId: string, serviceName: string, category: string) {
    this.track({
      action: 'begin_booking',
      category: 'booking',
      parameters: {
        service_id: serviceId,
        service_name: serviceName,
        service_category: category
      }
    });
  }

  static trackBookingStep(step: number, serviceName: string) {
    this.track({
      action: 'booking_step',
      category: 'booking',
      parameters: {
        step_number: step,
        service_name: serviceName
      }
    });
  }

  static trackBookingComplete(bookingId: string, value: number, currency: string, items: EcommerceItem[]) {
    this.track({
      action: 'purchase',
      category: 'ecommerce',
      value,
      parameters: {
        transaction_id: bookingId,
        currency,
        items: items.map(item => ({
          item_id: item.item_id,
          item_name: item.item_name,
          category: item.category,
          quantity: item.quantity,
          price: item.price
        }))
      }
    });

    // Also send as ecommerce event
    this.ecommercePurchase({
      transaction_id: bookingId,
      value,
      currency,
      items
    });
  }

  static trackBookingCancelled(bookingId: string, reason?: string) {
    this.track({
      action: 'booking_cancelled',
      category: 'booking',
      parameters: {
        booking_id: bookingId,
        cancellation_reason: reason
      }
    });
  }

  static trackReschedule(bookingId: string) {
    this.track({
      action: 'booking_rescheduled',
      category: 'booking',
      parameters: {
        booking_id: bookingId
      }
    });
  }

  // Service interaction events
  static trackServiceView(serviceId: string, serviceName: string, category: string) {
    this.track({
      action: 'view_item',
      category: 'engagement',
      parameters: {
        item_id: serviceId,
        item_name: serviceName,
        item_category: category
      }
    });
  }

  static trackServiceAddToFavorites(serviceId: string, serviceName: string) {
    this.track({
      action: 'add_to_wishlist',
      category: 'engagement',
      parameters: {
        item_id: serviceId,
        item_name: serviceName
      }
    });
  }

  // Newsletter events
  static trackNewsletterSubscribe(method: string = 'footer') {
    this.track({
      action: 'generate_lead',
      category: 'engagement',
      parameters: {
        lead_type: 'newsletter',
        method
      }
    });
  }

  // Contact events
  static trackContact(method: string = 'form') {
    this.track({
      action: 'contact',
      category: 'engagement',
      parameters: {
        contact_method: method
      }
    });
  }

  // Social media events
  static trackSocialShare(network: string, content: string) {
    this.track({
      action: 'share',
      category: 'social',
      parameters: {
        method: network,
        content_type: content
      }
    });
  }

  // Ecommerce events
  static trackAddToCart(item: EcommerceItem) {
    this.track({
      action: 'add_to_cart',
      category: 'ecommerce',
      parameters: {
        currency: item.currency || 'PLN',
        value: item.price,
        items: [item]
      }
    });
  }

  static trackBeginCheckout(items: EcommerceItem[], value: number, currency: string) {
    this.track({
      action: 'begin_checkout',
      category: 'ecommerce',
      parameters: {
        currency,
        value,
        items
      }
    });
  }

  static ecommercePurchase(purchase: EcommercePurchase) {
    if (!this.initialized) return;

    window.gtag('event', 'purchase', {
      transaction_id: purchase.transaction_id,
      value: purchase.value,
      currency: purchase.currency,
      items: purchase.items,
      coupon: purchase.coupon,
      payment_method: purchase.payment_method,
      deposit_required: purchase.deposit_required,
      deposit_amount: purchase.deposit_amount
    });
  }

  // Deposit tracking events
  static trackDepositRequired(event: DepositEvent) {
    this.track({
      action: 'deposit_required',
      category: 'booking',
      value: event.deposit_amount,
      parameters: {
        booking_id: event.booking_id,
        service_id: event.service_id,
        service_type: event.service_type,
        deposit_amount: event.deposit_amount,
        deposit_type: event.deposit_type,
        refund_policy: event.refund_policy,
        total_amount: event.total_amount,
        currency: event.currency,
        deposit_percentage: event.deposit_type === 'percentage'
          ? (event.deposit_amount / event.total_amount) * 100
          : undefined
      }
    });
  }

  static trackDepositPaid(bookingId: string, depositAmount: number, paymentMethod: string) {
    this.track({
      action: 'deposit_paid',
      category: 'booking',
      value: depositAmount,
      parameters: {
        booking_id: bookingId,
        deposit_amount: depositAmount,
        payment_method: paymentMethod
      }
    });
  }

  static trackDepositRefunded(bookingId: string, refundAmount: number, refundReason: string, originalAmount: number) {
    this.track({
      action: 'deposit_refunded',
      category: 'booking',
      value: refundAmount,
      parameters: {
        booking_id: bookingId,
        refund_amount: refundAmount,
        refund_reason: refundReason,
        original_deposit_amount: originalAmount,
        refund_percentage: (refundAmount / originalAmount) * 100
      }
    });
  }

  static trackDepositForfeited(bookingId: string, forfeitedAmount: number, reason: string) {
    this.track({
      action: 'deposit_forfeited',
      category: 'booking',
      value: forfeitedAmount,
      parameters: {
        booking_id: bookingId,
        forfeited_amount: forfeitedAmount,
        reason
      }
    });
  }

  static trackDepositRuleApplied(ruleId: string, serviceType: string, depositAmount: number) {
    this.track({
      action: 'deposit_rule_applied',
      category: 'booking',
      value: depositAmount,
      parameters: {
        rule_id: ruleId,
        service_type: serviceType,
        deposit_amount: depositAmount
      }
    });
  }

  // Form tracking
  static trackFormSubmit(formName: string, success: boolean = true) {
    this.track({
      action: 'form_submit',
      category: 'forms',
      parameters: {
        form_name: formName,
        success
      }
    });
  }

  // File download tracking
  static trackDownload(url: string, filename: string) {
    this.track({
      action: 'file_download',
      category: 'engagement',
      parameters: {
        file_url: url,
        file_name: filename
      }
    });
  }

  // Video tracking
  static trackVideoPlay(videoTitle: string, videoUrl: string) {
    this.track({
      action: 'video_start',
      category: 'engagement',
      parameters: {
        video_title: videoTitle,
        video_url: videoUrl
      }
    });
  }

  static trackVideoProgress(videoTitle: string, percent: number) {
    this.track({
      action: 'video_progress',
      category: 'engagement',
      parameters: {
        video_title: videoTitle,
        video_percent: percent
      }
    });
  }

  // Performance tracking
  static trackWebVitals(metrics: {
    lcp?: number;
    fid?: number;
    cls?: number;
    ttfb?: number;
  }) {
    if (!this.initialized) return;

    Object.entries(metrics).forEach(([metric, value]) => {
      if (value !== undefined) {
        window.gtag('event', metric, {
          event_category: 'web_vitals',
          value: Math.round(metric === 'cls' ? value * 1000 : value),
          non_interaction: true
        });
      }
    });
  }

  // Custom dimension tracking
  static setUserProperties(properties: Record<string, any>) {
    if (!this.initialized) return;

    window.gtag('config', import.meta.env.VITE_GA4_MEASUREMENT_ID, {
      custom_map: properties
    });
  }

  static setUserId(userId: string) {
    if (!this.initialized) return;

    window.gtag('config', import.meta.env.VITE_GA4_MEASUREMENT_ID, {
      user_id: userId
    });
  }
}

// React hook for analytics
export const useAnalytics = () => {
  const trackEvent = (event: GA4Event) => {
    AnalyticsService.track(event);
  };

  const trackPageview = (path?: string) => {
    AnalyticsService.pageview(path || window.location.pathname);
  };

  return {
    trackEvent,
    trackPageview,
    trackLogin: AnalyticsService.trackLogin,
    trackSignup: AnalyticsService.trackSignup,
    trackBookingStart: AnalyticsService.trackBookingStart,
    trackBookingComplete: AnalyticsService.trackBookingComplete,
    trackServiceView: AnalyticsService.trackServiceView,
    trackNewsletterSubscribe: AnalyticsService.trackNewsletterSubscribe
  };
};