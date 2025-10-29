import { create } from 'zustand';
import { subscribeWithSelector , persist, createJSONStorage } from 'zustand/middleware';

import { logger } from '@/lib/logger';

import {
  PricingState,
  PricingActions,
  BookingBaseStore,
  GroupBookingStore,
} from './bookingTypes';

// Pricing Store - Dynamic pricing and discount logic
export const useBookingPricingStore = create<PricingState & PricingActions>()(
  subscribeWithSelector(
    persist(
      (set, get) => ({
        // Initial state
        appliedPricingRules: [],
        originalPrice: 0,
        discountAmount: 0,

        // Actions
        applyPricingRules: (rules) => {
          const totalDiscount = rules.reduce((sum, rule) => sum + rule.applied_amount, 0);

          set((state) => ({
            appliedPricingRules: rules,
            discountAmount: totalDiscount,
          }));

          logger.info('Pricing rules applied', {
            ruleCount: rules.length,
            totalDiscount,
            originalPrice: get().originalPrice,
          });
        },

        calculatePrice: async () => {
          try {
            // Import dynamic pricing service
            const { dynamicPricingService } = await import('@/services/dynamicPricing.service');

            // Get base service and booking info from other stores
            const baseStore = useBookingBaseStore.getState();
            const groupStore = useBookingGroupStore.getState();

            if (!baseStore.selectedService || !baseStore.selectedTimeSlot) {
              logger.warn('Cannot calculate price - missing service or time slot');
              return;
            }

            logger.info('Calculating dynamic price', {
              serviceId: baseStore.selectedService.id,
              basePrice: baseStore.selectedService.price_from,
              groupSize: groupStore.groupSize,
            });

            const result = await dynamicPricingService.calculatePrice(
              baseStore.selectedService.id,
              baseStore.selectedService.price_from,
              baseStore.selectedTimeSlot.date,
              baseStore.selectedTimeSlot.time,
              groupStore.groupSize
            );

            set({
              originalPrice: result.originalPrice,
              discountAmount: result.totalDiscount,
              appliedPricingRules: result.appliedRules,
            });

            logger.info('Price calculation completed', {
              originalPrice: result.originalPrice,
              totalDiscount: result.totalDiscount,
              appliedRulesCount: result.appliedRules.length,
              finalPrice: result.originalPrice - result.totalDiscount,
            });
          } catch (error) {
            logger.error('Price calculation failed', error);
          }
        },
      }),
      {
        name: 'booking-pricing-store',
        storage: createJSONStorage(() => sessionStorage),
        partialize: (state) => ({
          appliedPricingRules: state.appliedPricingRules,
          originalPrice: state.originalPrice,
          discountAmount: state.discountAmount,
        }),
        version: 1,
        onRehydrateStorage: () => (state) => {
          logger.info('Booking pricing store hydrated:', state);
        },
      }
    )
  )
);

// Selectors for optimized re-renders
export const useBookingPricing = () => useBookingPricingStore((state) => ({
  originalPrice: state.originalPrice,
  discountAmount: state.discountAmount,
  appliedPricingRules: state.appliedPricingRules,
}));

export const useOriginalPrice = () => useBookingPricingStore((state) => state.originalPrice);
export const useDiscountAmount = () => useBookingPricingStore((state) => state.discountAmount);
export const useAppliedPricingRules = () => useBookingPricingStore((state) => state.appliedPricingRules);

// Computed selector that calculates final price with group booking consideration
export const useFinalPrice = () => {
  const baseStore = useBookingBaseStore();
  const pricingStore = useBookingPricingStore();
  const groupStore = useBookingGroupStore();

  if (!baseStore.selectedService) return 0;

  // Base price
  let price = baseStore.selectedService.price_from;

  // Apply group pricing
  if (groupStore.isGroupBooking && groupStore.groupSize > 1) {
    price = price * groupStore.groupSize;
  }

  // Apply dynamic pricing discount
  price = price - pricingStore.discountAmount;

  return Math.max(price, 0);
};