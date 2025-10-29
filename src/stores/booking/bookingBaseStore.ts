import { create } from 'zustand';
import { subscribeWithSelector , persist, createJSONStorage } from 'zustand/middleware';

import { logger } from '@/lib/logger';
import { enhancedBookingService } from '@/services/enhanced-booking.service';

import {
  BaseBookingState,
  BaseBookingActions,
  Booking,
  BookingDetails,
  PaymentDetails,
  BookingStatus,
  Service,
  TimeSlot,
  bookingEvents,
} from './bookingTypes';

// Base Booking Store - Core booking state and actions
export const useBookingBaseStore = create<BaseBookingState & BaseBookingActions>()(
  subscribeWithSelector(
    persist(
      (set, get) => ({
        // Initial state
        currentBooking: null,
        selectedService: null,
        selectedTimeSlot: null,
        bookingDetails: null,
        isCreating: false,
        error: null,

        // Computed getters
        get step() {
          const state = get();
          if (!state.selectedService) return 1;
          if (!state.selectedTimeSlot) return 2;
          if (!state.bookingDetails?.client_name || !state.bookingDetails?.client_email) return 3;
          return 4;
        },

        get canProceed() {
          const state = get();
          switch (state.step) {
            case 1:
              return !!state.selectedService;
            case 2:
              return !!state.selectedTimeSlot;
            case 3:
              return !!(state.bookingDetails?.client_name &&
                       state.bookingDetails?.client_email &&
                       state.bookingDetails?.consent_terms);
            case 4:
              return !!state.bookingDetails?.consent_terms;
            default:
              return false;
          }
        },

        get totalPrice() {
          const state = get();
          if (!state.selectedService) return 0;

          // Base price
          const price = state.selectedService.price_from;

          // Emit event for analytics
          if (typeof window !== 'undefined' && window.gtag) {
            logger.info('Total price calculated', { price, serviceId: state.selectedService.id });
          }

          return Math.max(price, 0);
        },

        // Actions
        selectService: (service: Service) => {
          set((state) => ({
            selectedService: service,
            selectedTimeSlot: null, // Reset time slot when service changes
            error: null,
          }));

          logger.info('Service selected', { serviceId: service.id, serviceType: service.service_type });

          // Emit event for analytics
          if (typeof window !== 'undefined' && window.gtag) {
            window.gtag('event', 'service_selected', {
              service_id: service.id,
              service_type: service.service_type,
              service_title: service.title,
            });
          }
        },

        selectTimeSlot: (slot: TimeSlot) => {
          set((state) => ({
            selectedTimeSlot: slot,
            error: null,
          }));

          logger.info('Time slot selected', { slotId: slot.id, slotTime: slot.time });

          // Emit event
          if (typeof window !== 'undefined' && window.gtag) {
            window.gtag('event', 'time_slot_selected', {
              service_id: get().selectedService?.id,
              slot_date: slot.date.toISOString(),
              slot_time: slot.time,
            });
          }
        },

        updateDetails: (details: Partial<BookingDetails>) => {
          set((state) => ({
            bookingDetails: { ...state.bookingDetails, ...details },
            error: null,
          }));

          logger.info('Booking details updated', { hasClientName: !!details.client_name });
        },

        setPaymentDetails: (payment: PaymentDetails) => {
          set((state) => {
            const currentBooking = state.currentBooking || {
              service_id: state.selectedService?.id || '',
              status: 'draft' as BookingStatus,
              service: state.selectedService!,
              timeSlot: state.selectedTimeSlot!,
              details: state.bookingDetails as BookingDetails,
            };

            return {
              currentBooking: {
                ...currentBooking,
                payment,
              },
              error: null,
            };
          });

          logger.info('Payment details set', { amount: payment.amount, method: payment.method });
        },

        nextStep: () => {
          const state = get();
          if (state.canProceed && state.step < 4) {
            set({ step: state.step + 1 });
            logger.info('Booking step advanced', { from: state.step, to: state.step + 1 });
          }
        },

        previousStep: () => {
          const state = get();
          if (state.step > 1) {
            set({ step: state.step - 1 });
            logger.info('Booking step retreated', { from: state.step, to: state.step - 1 });
          }
        },

        resetBooking: () => {
          const previousStep = get().step;
          set({
            currentBooking: null,
            selectedService: null,
            selectedTimeSlot: null,
            bookingDetails: null,
            isCreating: false,
            error: null,
            step: 1,
          });

          logger.info('Booking reset', { previousStep });
        },

        createBooking: async () => {
          const state = get();
          if (!state.selectedService || !state.selectedTimeSlot || !state.bookingDetails) {
            const error = 'Missing required booking information';
            set({ error });
            logger.error('Booking creation failed - missing information', {
              hasService: !!state.selectedService,
              hasTimeSlot: !!state.selectedTimeSlot,
              hasDetails: !!state.bookingDetails,
            });
            return;
          }

          set({ isCreating: true, error: null });

          try {
            logger.info('Starting booking creation', {
              serviceId: state.selectedService.id,
              timeSlot: state.selectedTimeSlot.time,
            });

            // Import ResendService dynamically to avoid SSR issues
            const { ResendService } = await import('@/lib/resend');

            // This would call the API service
            const bookingData: Omit<Booking, 'id'> = {
              service_id: state.selectedService.id,
              status: 'pending',
              service: state.selectedService,
              timeSlot: state.selectedTimeSlot,
              details: state.bookingDetails as BookingDetails,
            };

            // Create booking via enhanced booking service
            const response = await enhancedBookingService.createBooking({
              serviceId: state.selectedService?.id || '',
              timeSlot: state.selectedTimeSlot!,
              details: state.bookingDetails as BookingDetails,
              userId: state.userId,
            });

            if (!response.success || !response.booking) {
              throw new Error('Failed to create booking');
            }

            const newBooking: Booking = response.booking;

            set({
              currentBooking: newBooking,
              isCreating: false,
            });

            logger.info('Booking created successfully', { bookingId: newBooking.id });

            // Send booking confirmation email
            try {
              if (state.bookingDetails?.email) {
                await ResendService.sendBookingConfirmation({
                  bookingId: newBooking.id,
                  userId: state.bookingDetails.email,
                  type: 'confirmation'
                });
                logger.info('Booking confirmation email sent', { email: state.bookingDetails.email });
              }
            } catch (emailError) {
              logger.error('Error sending booking confirmation email:', emailError);
              // Don't fail the booking if email fails
            }

            // Send WhatsApp/SMS confirmations
            try {
              const { CommunicationService } = await import('@/lib/communication');

              if (state.bookingDetails?.phone) {
                // Send WhatsApp confirmation
                await CommunicationService.sendBookingConfirmationWhatsApp(
                  state.bookingDetails.phone,
                  state.bookingDetails.firstName || 'Customer',
                  state.selectedService?.title || 'Service',
                  new Date().toLocaleDateString(),
                  new Date().toLocaleTimeString()
                );

                // Also send SMS confirmation
                await CommunicationService.sendBookingConfirmationSMS(
                  state.bookingDetails.phone,
                  state.bookingDetails.firstName || 'Customer',
                  state.selectedService?.title || 'Service',
                  new Date().toLocaleDateString(),
                  new Date().toLocaleTimeString()
                );

                logger.info('WhatsApp and SMS confirmations sent', { phone: state.bookingDetails.phone });
              }
            } catch (commError) {
              logger.error('Error sending booking confirmation messages:', commError);
              // Don't fail the booking if communication fails
            }

            // Emit success event
            if (typeof window !== 'undefined' && window.gtag) {
              window.gtag('event', 'booking_created', {
                booking_id: newBooking.id,
                service_id: newBooking.service_id,
                value: state.totalPrice,
                currency: 'PLN',
              });
            }

            bookingEvents.emit('booking_created', {
              bookingId: newBooking.id,
              serviceId: newBooking.service_id,
              amount: state.totalPrice,
            });
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Failed to create booking';
            set({
              error: errorMessage,
              isCreating: false,
            });

            logger.error('Booking creation failed', error);
          }
        },

        updateBookingStatus: (status: BookingStatus) => {
          set((state) => {
            if (!state.currentBooking) return state;

            const updatedBooking = {
              ...state.currentBooking,
              status,
              updated_at: new Date(),
            };

            logger.info('Booking status updated', {
              bookingId: state.currentBooking.id,
              from: state.currentBooking.status,
              to: status,
            });

            return {
              currentBooking: updatedBooking,
            };
          });
        },

        setError: (error: string | null) => {
          set({ error });
          if (error) {
            logger.error('Booking error set', { error });
          }
        },

        clearError: () => {
          set({ error: null });
          logger.debug('Booking error cleared');
        },
      }),
      {
        name: 'booking-base-store',
        storage: createJSONStorage(() => sessionStorage),
        partialize: (state) => ({
          selectedService: state.selectedService,
          selectedTimeSlot: state.selectedTimeSlot,
          bookingDetails: state.bookingDetails,
          step: state.step,
        }),
        version: 1,
        onRehydrateStorage: () => (state) => {
          logger.info('Booking base store hydrated:', state);
        },
      }
    )
  )
);

// Selectors for optimized re-renders
export const useBookingService = () => useBookingBaseStore((state) => state.selectedService);
export const useBookingTimeSlot = () => useBookingBaseStore((state) => state.selectedTimeSlot);
export const useBookingDetails = () => useBookingBaseStore((state) => state.bookingDetails);
export const useBookingStep = () => useBookingBaseStore((state) => state.step);
export const useBookingCanProceed = () => useBookingBaseStore((state) => state.canProceed);
export const useBookingError = () => useBookingBaseStore((state) => state.error);
export const useBookingIsCreating = () => useBookingBaseStore((state) => state.isCreating);
export const useCurrentBooking = () => useBookingBaseStore((state) => state.currentBooking);
export const useBookingTotalPrice = () => useBookingBaseStore((state) => state.totalPrice);