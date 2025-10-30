import React, { useEffect, useState } from 'react';
import { X, Calendar, Clock, User, CreditCard, Check } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast aria-live="polite" aria-atomic="true"';
import { useBookingStore, useBookingStep, useBookingCanProceed, useBookingIsCreating, useCurrentBooking } from '@/stores/bookingStore';
import { apiGateway } from '@/services/apiGateway';
import { cqrsService, Commands } from '@/services/cqrsService';
import { useWebSocket } from '@/services/websocketService';
import { logger } from '@/lib/logger';

import { Step1ChooseNew } from './Step1ChooseNew';
import { Step2TimeNew } from './Step2TimeNew';
import { Step3DetailsNew } from './Step3DetailsNew';
import { Step4PaymentNew } from './Step4PaymentNew';
import { BookingConfirmation } from './BookingConfirmation';

interface BookingSheetProps {
  isOpen: boolean;
  onClose: () => void;
  initialServiceId?: string;
  initialServiceType?: 'beauty' | 'fitness';
}

export const BookingSheetNew: React.FC<BookingSheetProps> = ({
  isOpen,
  onClose,
  initialServiceId,
  initialServiceType,
}) => {
  const { toast aria-live="polite" aria-atomic="true" } = useToast();
  const step = useBookingStep();
  const canProceed = useBookingCanProceed();
  const isCreating = useBookingIsCreating();
  const currentBooking = useCurrentBooking();

  const { resetBooking, createBooking, error, clearError } = useBookingStore();
  const { subscribe } = useWebSocket();

  // State for component visibility
  const [showConfirmation, setShowConfirmation] = useState(false);

  // Initialize with pre-selected service
  useEffect(() => {
    if (initialServiceId && initialServiceType && isOpen) {
      // Load and select the service
      loadAndSelectService(initialServiceId, initialServiceType);
    }
  }, [initialServiceId, initialServiceType, isOpen]);

  // Listen for real-time booking updates
  useEffect(() => {
    const unsubscribe = subscribe('booking:updated', (data) => {
      if (currentBooking && data.bookingId === currentBooking.id) {
        // Update local booking state
        useBookingStore.getState().updateBookingStatus(data.status);

        // Show confirmation if booking is confirmed
        if (data.status === 'confirmed') {
          setShowConfirmation(true);
        }
      }
    });

    return unsubscribe;
  }, [subscribe, currentBooking]);

  // Reset state when closing
  const handleClose = () => {
    if (!isCreating) {
      resetBooking();
      setShowConfirmation(false);
      onClose();
    }
  };

  const loadAndSelectService = async (serviceId: string, serviceType: 'beauty' | 'fitness') => {
    try {
      const response = await apiGateway.services.get(serviceId);
      if (response.success) {
        useBookingStore.getState().selectService(response.data);
      }
    } catch (error) {
      logger.error('Failed to load service:', error);
      toast aria-live="polite" aria-atomic="true"({
        title: "Error",
        description: "Could not load the selected service",
        variant: "destructive",
      });
    }
  };

  const handleCompleteBooking = async () => {
    clearError();

    try {
      // Create booking using CQRS command
      const bookingState = useBookingStore.getState();
      const { selectedService, selectedTimeSlot, bookingDetails } = bookingState;

      if (!selectedService || !selectedTimeSlot || !bookingDetails) {
        toast aria-live="polite" aria-atomic="true"({
          title: "Error",
          description: "Please complete all required fields",
          variant: "destructive",
        });
        return;
      }

      const command = Commands.createBooking({
        serviceId: selectedService.id,
        timeSlot: selectedTimeSlot,
        clientDetails: {
          name: bookingDetails.client_name,
          email: bookingDetails.client_email,
          phone: bookingDetails.client_phone,
          notes: bookingDetails.notes,
          consent_terms: bookingDetails.consent_terms,
          consent_marketing: bookingDetails.consent_marketing,
        },
        location: selectedTimeSlot.location,
      }, 'current-user'); // Would get from auth

      const result = await cqrsService.executeCommand(command);

      if (result) {
        toast aria-live="polite" aria-atomic="true"({
          title: "Booking Confirmed!",
          description: "Your appointment has been successfully booked",
        });
        setShowConfirmation(true);
      }
    } catch (error) {
      logger.error('Failed to create booking:', error);
      toast aria-live="polite" aria-atomic="true"({
        title: "Booking Failed",
        description: error instanceof Error ? error.message : "Failed to create booking",
        variant: "destructive",
      });
    }
  };

  const getStepTitle = () => {
    switch (step) {
      case 1:
        return 'Select Service';
      case 2:
        return 'Choose Time';
      case 3:
        return 'Your Details';
      case 4:
        return 'Payment';
      default:
        return 'Book Appointment';
    }
  };

  const getStepIcon = () => {
    switch (step) {
      case 1:
        return <Calendar className="h-5 w-5" />;
      case 2:
        return <Clock className="h-5 w-5" />;
      case 3:
        return <User className="h-5 w-5" />;
      case 4:
        return <CreditCard className="h-5 w-5" />;
      default:
        return null;
    }
  };

  const getProgressPercentage = () => {
    return (step / 4) * 100;
  };

  if (!isOpen) return null;

  if (showConfirmation && currentBooking) {
    return (
      <BookingConfirmation
        booking={currentBooking}
        onClose={handleClose}
        onNewBooking={() => {
          resetBooking();
          setShowConfirmation(false);
        }}
      />
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex justify-end">
      <div className="bg-background w-full max-w-2xl h-full overflow-hidden flex flex-col">
        {/* Header */}
        <div className="border-b p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {getStepIcon()}
              <div>
                <h2 className="text-2xl font-semibold">{getStepTitle()}</h2>
                <p className="text-sm text-muted-foreground">
                  Step {step} of 4
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleClose}
              disabled={isCreating}
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Progress Bar */}
          <div className="space-y-2">
            <Progress value={getProgressPercentage()} className="h-2" />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span className={step >= 1 ? 'text-primary' : ''}>Service</span>
              <span className={step >= 2 ? 'text-primary' : ''}>Time</span>
              <span className={step >= 3 ? 'text-primary' : ''}>Details</span>
              <span className={step >= 4 ? 'text-primary' : ''}>Payment</span>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {error && (
            <div className="mb-4 p-3 bg-destructive/10 text-destructive rounded-lg">
              {error}
            </div>
          )}

          {step === 1 && <Step1ChooseNew />}
          {step === 2 && <Step2TimeNew />}
          {step === 3 && <Step3DetailsNew />}
          {step === 4 && (
            <Step4PaymentNew
              onComplete={handleCompleteBooking}
              isLoading={isCreating}
            />
          )}
        </div>

        {/* Footer with booking summary */}
        <div className="border-t p-6 bg-muted/30">
          {step < 4 && (
            <div className="flex items-center justify-between">
              <div className="text-sm">
                {useBookingStore.getState().selectedService && (
                  <span>
                    {useBookingStore.getState().selectedService.title} -{' '}
                    {useBookingStore.getState().totalPrice} PLN
                  </span>
                )}
              </div>
              <div className="flex gap-2">
                {step > 1 && (
                  <Button
                    variant="outline"
                    onClick={() => useBookingStore.getState().previousStep()}
                    disabled={isCreating}
                  >
                    Back
                  </Button>
                )}
                <Button
                  onClick={() => {
                    if (canProceed) {
                      if (step === 3) {
                        handleCompleteBooking();
                      } else {
                        useBookingStore.getState().nextStep();
                      }
                    }
                  }}
                  disabled={!canProceed || isCreating}
                >
                  {isCreating ? (
                    'Creating...'
                  ) : step === 3 ? (
                    'Complete Booking'
                  ) : (
                    'Continue'
                  )}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BookingSheetNew;