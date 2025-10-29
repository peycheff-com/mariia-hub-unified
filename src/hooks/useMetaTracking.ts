import { useEffect, useCallback } from 'react';

import { useMetaCAPI } from '@/components/tracking/MetaCAPIProvider';
import { useBookingStore } from '@/stores/bookingStore';
import { logger } from '@/lib/logger';

interface Service {
  id: string;
  title?: string;
  name?: string;
  price_from?: number;
  price?: number;
  currency?: string;
  category?: string;
  service_type?: string;
  description?: string;
}

interface BookingData {
  id: string;
  total_amount?: number;
  currency?: string;
  services?: Service[];
  status?: string;
}

export const useMetaTracking = () => {
  const metaCAPI = useMetaCAPI();
  const selectedService = useBookingStore((state) => state.selectedService);
  const bookingDetails = useBookingStore((state) => state.bookingDetails);

  // Track service view when service is selected
  const trackServiceView = useCallback(async (service: Service) => {
    if (!metaCAPI.isEnabled) return;

    try {
      await metaCAPI.trackServiceView(service);
      logger.info('Service view tracked', { serviceId: service.id });
    } catch (error) {
      logger.error('Failed to track service view', error);
    }
  }, [metaCAPI]);

  // Track service selection (AddToCart equivalent)
  const trackServiceSelection = useCallback(async (service: Service, quantity = 1) => {
    if (!metaCAPI.isEnabled) return;

    try {
      await metaCAPI.trackAddToCart(service, quantity, {
        service_category: service.category || service.service_type,
        selection_timestamp: new Date().toISOString(),
      });
      logger.info('Service selection tracked', { serviceId: service.id, quantity });
    } catch (error) {
      logger.error('Failed to track service selection', error);
    }
  }, [metaCAPI]);

  // Track booking initiated
  const trackBookingInitiated = useCallback(async (bookingData: Partial<BookingData>) => {
    if (!metaCAPI.isEnabled) return;

    try {
      await metaCAPI.trackBooking(bookingData, false);
      logger.info('Booking initiated tracked', { bookingId: bookingData.id });
    } catch (error) {
      logger.error('Failed to track booking initiated', error);
    }
  }, [metaCAPI]);

  // Track booking completed
  const trackBookingCompleted = useCallback(async (bookingData: BookingData) => {
    if (!metaCAPI.isEnabled) return;

    try {
      await metaCAPI.trackBooking(bookingData, true);
      logger.info('Booking completed tracked', { bookingId: bookingData.id });
    } catch (error) {
      logger.error('Failed to track booking completed', error);
    }
  }, [metaCAPI]);

  // Track booking step progression
  const trackBookingStep = useCallback(async (stepNumber: number, stepName: string, additionalData?: any) => {
    if (!metaCAPI.isEnabled) return;

    try {
      await metaCAPI.trackEvent('BookingStep', {
        step_number: stepNumber,
        step_name: stepName,
        service_id: selectedService?.id,
        service_name: selectedService?.title || selectedService?.name,
        ...additionalData,
      });
      logger.info('Booking step tracked', { stepNumber, stepName });
    } catch (error) {
      logger.error('Failed to track booking step', error);
    }
  }, [metaCAPI, selectedService]);

  // Track custom conversion events
  const trackCustomConversion = useCallback(async (
    eventName: string,
    data: any,
    options?: {
      conversionValue?: number;
      currency?: string;
    }
  ) => {
    if (!metaCAPI.isEnabled) return;

    try {
      await metaCAPI.trackEvent(eventName, data, options);
      logger.info('Custom conversion tracked', { eventName });
    } catch (error) {
      logger.error('Failed to track custom conversion', error);
    }
  }, [metaCAPI]);

  // Track business-specific events
  const trackBusinessEvent = useCallback(async (
    eventName: string,
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
    if (!metaCAPI.isEnabled) return;

    try {
      await metaCAPI.trackBusinessEvent(eventName, businessData, customData);
      logger.info('Business event tracked', { eventName });
    } catch (error) {
      logger.error('Failed to track business event', error);
    }
  }, [metaCAPI]);

  // Auto-track service view when service changes
  useEffect(() => {
    if (selectedService) {
      trackServiceView(selectedService);
    }
  }, [selectedService, trackServiceView]);

  // Enhanced booking funnel tracking
  const trackBookingFunnel = {
    // Step 1: Service selection
    serviceSelected: (service: Service) => {
      trackServiceSelection(service);
      trackBookingStep(1, 'Service Selected', { service_type: service.service_type });
    },

    // Step 2: Time slot selection
    timeSlotSelected: (timeSlot: any) => {
      trackBookingStep(2, 'Time Slot Selected', {
        time_slot_id: timeSlot.id,
        selected_date: timeSlot.date,
        selected_time: timeSlot.time,
        location: timeSlot.location,
      });
    },

    // Step 3: Details entered
    detailsEntered: (details: any) => {
      trackBookingStep(3, 'Details Entered', {
        customer_name: details.client_name,
        has_phone: !!details.phone,
        has_special_requests: !!details.special_requests,
      });
    },

    // Step 4: Payment initiated
    paymentInitiated: (paymentData: any) => {
      trackBookingStep(4, 'Payment Initiated', {
        payment_method: paymentData.method,
        total_amount: paymentData.total_amount,
        currency: paymentData.currency,
      });
    },

    // Booking completed
    completed: (bookingData: BookingData) => {
      trackBookingCompleted(bookingData);
      trackBookingStep(5, 'Booking Completed', {
        booking_id: bookingData.id,
        total_amount: bookingData.total_amount,
        service_count: bookingData.services?.length || 0,
      });
    },

    // Booking cancelled
    cancelled: (bookingData: Partial<BookingData>, reason?: string) => {
      trackBookingStep(-1, 'Booking Cancelled', {
        booking_id: bookingData.id,
        cancellation_reason: reason,
        booking_stage: 'in_progress',
      });
    },
  };

  // Service category tracking
  const trackServiceCategory = {
    beautyServiceView: (service: Service) => {
      trackServiceView(service);
      trackCustomConversion('BeautyServiceView', {
        service_category: 'beauty',
        service_subcategory: service.category,
      });
    },

    fitnessProgramView: (service: Service) => {
      trackServiceView(service);
      trackCustomConversion('FitnessProgramView', {
        service_category: 'fitness',
        program_type: service.category,
      });
    },

    lifestyleServiceView: (service: Service) => {
      trackServiceView(service);
      trackCustomConversion('LifestyleServiceView', {
        service_category: 'lifestyle',
        service_type: service.category,
      });
    },
  };

  // Contact and lead tracking
  const trackLeadGeneration = {
    contactForm: (formData: any) => {
      metaCAPI.trackContactForm(formData);
    },

    newsletterSubscription: (email: string) => {
      metaCAPI.trackNewsletter();
      trackCustomConversion('NewsletterSubscription', { email });
    },

    consultationRequest: (requestData: any) => {
      trackBusinessEvent('ConsultationRequest', {
        businessCategory: 'consultation',
        appointmentType: requestData.type,
      }, requestData);
    },

    referralClick: (referralCode: string, referrerData?: any) => {
      trackBusinessEvent('ReferralClick', {
        businessCategory: 'referral',
      }, {
        referral_code: referralCode,
        referrer_data: referrerData,
      });
    },
  };

  // Package and membership tracking
  const trackPackages = {
    packagePurchase: (packageData: any) => {
      trackBusinessEvent('PackagePurchase', {
        businessCategory: 'packages',
        packageType: packageData.type,
      }, {
        package_name: packageData.name,
        package_price: packageData.price,
        package_duration: packageData.duration,
        services_included: packageData.services?.length || 0,
      });
    },

    membershipUpgrade: (membershipData: any) => {
      trackBusinessEvent('MembershipUpgrade', {
        businessCategory: 'membership',
        membershipTier: membershipData.tier,
      }, {
        previous_tier: membershipData.previousTier,
        new_tier: membershipData.tier,
        upgrade_price: membershipData.price,
      });
    },

    giftCardPurchase: (giftCardData: any) => {
      trackCustomConversion('GiftCardPurchase', {
        gift_card_value: giftCardData.value,
        gift_card_type: giftCardData.type,
        recipient_email: giftCardData.recipientEmail,
      }, {
        conversionValue: giftCardData.value,
        currency: giftCardData.currency || 'PLN',
      });
    },
  };

  return {
    // Core tracking methods
    trackServiceView,
    trackServiceSelection,
    trackBookingInitiated,
    trackBookingCompleted,
    trackCustomConversion,
    trackBusinessEvent,

    // Enhanced tracking suites
    trackBookingFunnel,
    trackServiceCategory,
    trackLeadGeneration,
    trackPackages,

    // Legacy compatibility
    trackBookingStep,

    // Status and utilities
    getRetryStatus: metaCAPI.getRetryStatus,
    isEnabled: metaCAPI.isEnabled,
  };
};