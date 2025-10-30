import { useState, useEffect, useRef } from 'react';
import { X, ArrowLeft, Check } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast aria-live="polite" aria-atomic="true"';
import { useCurrency } from '@/contexts/CurrencyContext';
import { Service, Location, Step1Data, Step2Data, Step3Data } from '@/types/booking';
import { logger } from '@/lib/logger';
import { useBookingStore } from '@/stores/bookingStore';
import { waitlistService } from '@/services/waitlist.service';
import { pushToDataLayer } from '@/lib/gtm';

import { Step1Choose } from './Step1Choose';
import { Step2Time } from './Step2Time';
import { Step3Details } from './Step3Details';
import { Step3Review } from './Step3Review';
import { Step4Payment } from './Step4Payment';
import { GroupBookingToggle } from './GroupBookingToggle';
import { CapacityIndicator } from './CapacityIndicator';
import { PricingDisplay } from './PricingDisplay';
import { WaitlistOption } from './WaitlistOption';
import { QuickRescheduleButton } from './QuickRescheduleButton';
import { useLoyaltyContext } from '@/contexts/LoyaltyContext';


interface BookingSheetProps {
  isOpen: boolean;
  onClose: () => void;
  preselectedService?: string;
  preselectedType?: 'beauty' | 'fitness';
}

const BookingSheet = ({
  isOpen,
  onClose,
  preselectedService,
  preselectedType
}: BookingSheetProps) => {
  const { toast aria-live="polite" aria-atomic="true" } = useToast();
  const { t } = useTranslation();
  const { formatPrice } = useCurrency();
  const { state: loyaltyState, actions: loyaltyActions } = useLoyaltyContext();
  const [step, setStep] = useState(1);
  const [services, setServices] = useState<Service[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDesktop, setIsDesktop] = useState(false);
  const headingRef = useRef<HTMLHeadingElement>(null);

  // Use enhanced booking store
  const {
    selectedService,
    selectedTimeSlot,
    bookingDetails,
    isGroupBooking,
    groupSize,
    groupParticipants,
    originalPrice,
    discountAmount,
    appliedPricingRules,
    capacityInfo,
    waitlistMode,
    waitlistEntry,
    step: currentStep,
    canProceed,
    totalPrice,
    selectService: storeSelectService,
    selectTimeSlot: storeSelectTimeSlot,
    updateDetails: storeUpdateDetails,
    setGroupBooking,
    setGroupSize,
    setGroupParticipants,
    applyPricingRules,
    calculatePrice,
    checkCapacity,
    setWaitlistMode,
    setWaitlistEntry,
    joinWaitlist,
    resetBooking,
  } = useBookingStore();

  // Legacy step data for backward compatibility
  const [step1Data, setStep1Data] = useState<Step1Data | null>(null);
  const [step2Data, setStep2Data] = useState<Step2Data | null>(null);
  const [step3Data, setStep3Data] = useState<Step3Data | null>(null);
  const [reviewData, setReviewData] = useState<{
    fullName: string;
    email: string;
    phone: string;
    notes?: string;
    consents: {
      terms: boolean;
      marketing?: boolean;
    };
  } | null>(null);

  // Sync store state with legacy state
  useEffect(() => {
    if (selectedService) {
      setStep1Data({
        serviceId: selectedService.id,
        serviceType: selectedService.service_type as 'beauty' | 'fitness',
        durationMinutes: selectedService.duration_minutes,
        locationId: '',
        selectedAddOns: [],
        isGroupBooking,
        groupSize,
        participants: groupParticipants,
      });
    }
  }, [selectedService, isGroupBooking, groupSize, groupParticipants]);

  useEffect(() => {
    if (selectedTimeSlot) {
      setStep2Data({
        selectedDate: selectedTimeSlot.date,
        selectedTime: selectedTimeSlot.time,
        slotId: selectedTimeSlot.id,
        bookingId: undefined,
      });
    }
  }, [selectedTimeSlot]);

  useEffect(() => {
    if (bookingDetails) {
      setStep3Data({
        firstName: bookingDetails.client_name.split(' ')[0] || '',
        lastName: bookingDetails.client_name.split(' ').slice(1).join(' ') || '',
        email: bookingDetails.client_email,
        phone: bookingDetails.client_phone,
        whatsappConsent: bookingDetails.consent_marketing,
        marketingConsent: bookingDetails.consent_marketing,
        notes: bookingDetails.notes,
      });
    }
  }, [bookingDetails]);

  // Check for desktop
  useEffect(() => {
    const checkDesktop = () => setIsDesktop(window.innerWidth >= 1024);
    checkDesktop();
    window.addEventListener('resize', checkDesktop);
    return () => window.removeEventListener('resize', checkDesktop);
  }, []);

  // Focus heading on step change for accessibility
  useEffect(() => {
    const id = window.setTimeout(() => headingRef.current?.focus(), 0);
    return () => window.clearTimeout(id);
  }, [step]);

  // Load data
  useEffect(() => {
    if (isOpen) {
      loadData();
      pushToDataLayer({ event: 'booking_opened' });
      
      // Check for prefilled data
      const prefillServiceId = sessionStorage.getItem('prefill_service');
      const prefillServiceType = sessionStorage.getItem('prefill_type') as 'beauty' | 'fitness';
      
      if (prefillServiceId && prefillServiceType && services.length > 0) {
        const service = services.find(s => s.id === prefillServiceId);
        if (service) {
          handleStep1Complete({
            serviceId: service.id,
            serviceType: prefillServiceType,
            durationMinutes: service.duration_minutes || 60,
            locationId: locations.find(l => l.type === (prefillServiceType === 'beauty' ? 'studio' : 'gym'))?.id || '',
            selectedAddOns: [],
          });
          setStep(2);
          
          // Clear prefill data
          sessionStorage.removeItem('prefill_service');
          sessionStorage.removeItem('prefill_type');
        }
      }
    }
  }, [isOpen, services.length]);

  const loadData = async () => {
    try {
      const [servicesRes, locationsRes] = await Promise.all([
        supabase.from('services').select('*').eq('is_active', true),
        supabase.from('locations').select('*').eq('is_active', true),
      ]);

      
      if (servicesRes.error) {
          toast aria-live="polite" aria-atomic="true"({
          title: 'Error loading services',
          description: 'Please try again later.',
          variant: 'destructive',
        });
      }

      if (servicesRes.data) setServices(servicesRes.data);
      if (locationsRes.data) setLocations(locationsRes.data);

      // Check if services exist
      if (!servicesRes.data || servicesRes.data.length === 0) {
        toast aria-live="polite" aria-atomic="true"({
          title: 'No services available',
          description: 'Please check back later as we are updating our service catalog.',
          variant: 'destructive',
        });
      }

      // Check if locations exist
      if (!locationsRes.data || locationsRes.data.length === 0) {
        toast aria-live="polite" aria-atomic="true"({
          title: 'No locations available',
          description: 'Please check back later as we are updating our studio locations.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      logger.error('Error loading booking data:', error);
      toast aria-live="polite" aria-atomic="true"({
        title: 'Error loading booking data',
        description: 'Unable to load services and locations. Please refresh the page.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleStep1Complete = (data: any) => {
    // Update store with service selection
    if (data.serviceId && services.length > 0) {
      const service = services.find(s => s.id === data.serviceId);
      if (service) {
        storeSelectService(service);
      }
    }

    // Handle group booking toggle
    if (data.isGroupBooking !== undefined) {
      setGroupBooking(data.isGroupBooking);
    }

    // Handle group size
    if (data.groupSize) {
      setGroupSize(data.groupSize);
    }

    // Handle group participants
    if (data.participants) {
      setGroupParticipants(data.participants);
    }

    setStep1Data(data);
    if (data?.locationId) {
      pushToDataLayer({
        event: 'booking_service_selected',
        service_id: data.serviceId,
        service_type: data.serviceType,
        location_id: data.locationId,
      });
      setStep(2);
    }
  };

  const handleStep2Complete = async (data: any) => {
    // Check capacity first
    if (data.selectedDate && data.selectedTime && selectedService) {
      await checkCapacity(
        selectedService.id,
        data.selectedDate,
        data.selectedTime,
        isGroupBooking ? groupSize : 1
      );

      // Calculate dynamic pricing
      await calculatePrice();
    }

    // Update store
    if (data.selectedDate && data.selectedTime) {
      storeSelectTimeSlot({
        id: data.slotId || `${selectedService?.id}-${data.selectedDate}-${data.selectedTime}`,
        date: data.selectedDate,
        time: data.selectedTime,
        available: true,
        location: 'studio',
        price: selectedService?.price_from,
        capacity: capacityInfo?.capacity,
        currentBookings: capacityInfo?.capacity ? capacityInfo.capacity - (capacityInfo?.remainingCapacity || 0) : undefined,
        remainingCapacity: capacityInfo?.remainingCapacity,
        allowsGroups: capacityInfo?.allowsGroups,
        maxGroupSize: capacityInfo?.maxGroupSize,
      });
    }

    // Show waitlist option if no capacity
    if (capacityInfo && !capacityInfo.available) {
      setWaitlistMode(true);
      setWaitlistEntry({
        serviceId: selectedService?.id || '',
        preferredDate: data.selectedDate,
        preferredTime: data.selectedTime,
        flexibleWithTime: true,
        contactEmail: '',
      });
    } else {
      setWaitlistMode(false);
    }

    setStep2Data(data);
    pushToDataLayer({
      event: 'booking_time_selected',
      service_id: selectedService?.id,
      date: data.selectedDate,
      time: data.selectedTime,
      group_size: isGroupBooking ? groupSize : 1,
    });
    setStep(waitlistMode ? 2.5 : 3); // Show waitlist modal or proceed to details
  };

  const handleStep3Complete = (data: any) => {
    // Update store with booking details
    storeUpdateDetails({
      client_name: data.fullName,
      client_email: data.email,
      client_phone: data.phone,
      consent_terms: data.consents?.terms || false,
      consent_marketing: data.consents?.marketing || false,
      notes: data.notes,
      is_group_booking: isGroupBooking,
      group_size: groupSize,
    });

    // Set review data and go to review step
    setReviewData({
      fullName: data.fullName,
      email: data.email,
      phone: data.phone,
      notes: data.notes,
      consents: data.consents,
    });

    setStep3Data(data);
    pushToDataLayer({
      event: 'booking_details_completed',
      service_id: selectedService?.id,
    });
    setStep(3.5); // Review step
  };

  const handleReviewComplete = () => {
    pushToDataLayer({
      event: 'booking_review_confirmed',
      service_id: selectedService?.id,
    });
    setStep(4); // Go to payment step
  };

  const handleStep4Complete = async (data: any) => {
    try {
      // Create booking
      const { data: bookingData, error } = await supabase.from('bookings').insert({
        service_id: step1Data.serviceId,
        user_id: (await supabase.auth.getUser()).data.user?.id,
        date: step2Data.date,
        time: step2Data.time,
        status: 'pending',
        payment_status: data.paymentMethod === 'card' ? 'pending' : 'unpaid',
        payment_method: data.paymentMethod,
        client_name: reviewData?.fullName || step3Data?.fullName,
        client_email: reviewData?.email || step3Data?.email,
        client_phone: reviewData?.phone || step3Data?.phone,
        notes: reviewData?.notes || step3Data?.notes,
      }).select().single();

      if (error) throw error;

      // Award loyalty points for the booking
      try {
        const currentService = services.find(s => s.id === step1Data.serviceId);
        if (currentService && loyaltyState.member) {
          const basePoints = Math.floor(totalPrice * 10); // 10 points per PLN
          const tierMultiplier = loyaltyState.member.tier?.points_multiplier || 1;
          const serviceBonus = currentService.service_type === 'beauty' ? 20 : 15;
          const totalPoints = Math.floor((basePoints + serviceBonus) * tierMultiplier);

          await loyaltyActions.earnPoints(totalPoints, {
            reference_type: 'booking',
            reference_id: bookingData.id,
            description: `Points earned from ${currentService.title} booking`
          });

          toast aria-live="polite" aria-atomic="true"({
            title: 'Loyalty points earned!',
            description: `You earned ${totalPoints.toLocaleString()} points from this booking.`,
            variant: 'default',
          });
        }
      } catch (loyaltyError) {
        console.error('Failed to award loyalty points:', loyaltyError);
        // Don't fail the booking if loyalty points fail
      }

      toast aria-live="polite" aria-atomic="true"({
        title: 'Booking confirmed!',
        description: 'You will receive a confirmation email shortly.',
      });

      pushToDataLayer({
        event: 'booking_confirmed',
        service_id: step1Data.serviceId,
        date: step2Data.date,
        time: step2Data.time,
        payment_method: data.paymentMethod,
        total_amount: totalPrice,
        loyalty_member_id: loyaltyState.member?.id,
        loyalty_tier: loyaltyState.member?.tier?.name,
      });

      onClose();
    } catch (error) {
      pushToDataLayer({
        event: 'booking_failed',
        service_id: step1Data?.serviceId,
      });
      toast aria-live="polite" aria-atomic="true"({
        title: 'Booking failed',
        description: 'Please try again or contact support.',
        variant: 'destructive',
      });
    }
  };

  const goBack = () => {
    if (step === 3.5) {
      setStep(3); // Go back from review to details
    } else if (step > 1) {
      setStep(step - 1);
    }
  };

  const progress = (() => {
    if (step <= 1) return 25;
    if (step <= 2) return 50;
    if (step <= 3) return 75;
    if (step <= 3.5) return 87.5;
    return 100;
  })();

  // Prefetch Stripe resources before payment step for faster load
  useEffect(() => {
    if (step >= 3) {
      try {
        const head = document.head;
        const ensureLink = (rel: string, href: string, asAttr?: string) => {
          if (!head.querySelector(`link[rel='${rel}'][href='${href}']`)) {
            const link = document.createElement('link');
            link.rel = rel;
            link.href = href;
            if (asAttr) link.as = asAttr as any;
            head.appendChild(link);
          }
        };
        ensureLink('preconnect', 'https://js.stripe.com');
        ensureLink('preconnect', 'https://api.stripe.com');
        ensureLink('dns-prefetch', 'https://js.stripe.com');
        ensureLink('dns-prefetch', 'https://api.stripe.com');
        ensureLink('preload', 'https://js.stripe.com/v3/', 'script');
      } catch {
        // no-op
      }
    }
  }, [step]);

  const currentService = services.find(s => s.id === step1Data?.serviceId);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end lg:items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in-0"
        onClick={onClose}
      />
      
      {/* Sheet */}
      <div className={cn(
        "relative z-50 w-full max-h-[90vh] lg:max-h-[85vh] overflow-hidden",
        "bg-cocoa/20 text-pearl shadow-luxury-strong border border-champagne/20",
        "animate-in duration-300",
        isDesktop 
          ? "max-w-2xl rounded-3xl slide-in-from-bottom-0" 
          : "rounded-t-3xl slide-in-from-bottom"
      )}>
        {/* Header */}
        <div className="sticky top-0 z-10 bg-cocoa/20 border-b border-champagne/10">
          <div className="flex items-center justify-between p-4 lg:p-6">
            <div className="flex items-center gap-3">
              {step > 1 && (
                <button
                  onClick={goBack}
                  className="p-2 -ml-2 hover:bg-champagne/10 rounded-xl transition-colors"
                  aria-label="Go back"
                >
                  <ArrowLeft className="w-5 h-5 text-pearl" />
                </button>
              )}
              <div>
                <h2
                  ref={headingRef}
                  tabIndex={-1}
                  className="text-lg lg:text-xl font-semibold text-pearl focus:outline-none focus:ring-2 focus:ring-champagne/60 rounded"
                >
                  {step === 1 && 'Choose Service & Location'}
                  {step === 2 && 'Select Date & Time'}
                  {step === 3 && 'Your Details'}
                  {step === 3.5 && 'Review Your Booking'}
                  {step === 4 && 'Payment'}
                </h2>
                <p className="text-xs lg:text-sm text-pearl/60 mt-0.5">
                  {step === 3.5 ? 'Review & Confirm' : `Step ${Math.floor(step)} of 4`}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 -mr-2 hover:bg-champagne/10 rounded-xl transition-colors"
              aria-label="Close booking"
            >
              <X className="w-5 h-5 text-pearl/60" />
            </button>
          </div>
          
          {/* Progress bar */}
          <div className="px-4 lg:px-6 pb-3">
            <div
              className="relative h-1.5 bg-graphite/50 rounded-full overflow-hidden"
              role="progressbar"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={progress}
              aria-label="Booking progress"
            >
              <div 
                className="h-full bg-gradient-to-r from-champagne via-champagne-200 to-bronze transition-all duration-500 ease-smooth shadow-luxury rounded-full" 
                style={{ width: `${progress}%` }} 
              />
            </div>
            <div className="mt-2 grid grid-cols-4 text-center">
              <div className={cn("text-xs transition-colors", step >= 1 ? "text-champagne font-semibold" : "text-pearl/50")}>
                <span className="hidden sm:inline">Service</span>
                <span className="sm:hidden">1</span>
              </div>
              <div className={cn("text-xs transition-colors", step >= 2 ? "text-champagne font-semibold" : "text-pearl/50")}>
                <span className="hidden sm:inline">Time</span>
                <span className="sm:hidden">2</span>
              </div>
              <div className={cn("text-xs transition-colors", step >= 3 && step <= 3.5 ? "text-champagne font-semibold" : "text-pearl/50")}>
                <span className="hidden sm:inline">Details</span>
                <span className="sm:hidden">3</span>
              </div>
              <div className={cn("text-xs transition-colors", step >= 4 ? "text-champagne font-semibold" : "text-pearl/50")}>
                <span className="hidden sm:inline">Payment</span>
                <span className="sm:hidden">4</span>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-[calc(90vh-180px)] lg:max-h-[calc(85vh-200px)] p-4 lg:p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-8 h-8 border-3 border-champagne/30 border-t-champagne rounded-full animate-spin" />
            </div>
          ) : (
            <>
              {step === 1 && (
                <Step1Choose
                  services={services}
                  locations={locations}
                  preselectedService={preselectedService}
                  preselectedType={preselectedType}
                  onComplete={handleStep1Complete}
                />
              )}
              
              {step === 2 && step1Data && (
                <>
                  {/* Group Booking Toggle */}
                  <div className="mb-6">
                    <GroupBookingToggle
                      onGroupSizeChange={(size) => {
                        if (size > 1 && step1Data) {
                          handleStep2Complete({
                            ...step2Data,
                            groupSize: size,
                          });
                        }
                      }}
                      maxGroupSize={selectedService?.max_group_size || 10}
                    />
                  </div>

                  {/* Time Selection with Capacity */}
                  <Step2Time
                    serviceId={step1Data.serviceId}
                    serviceType={step1Data.serviceType}
                    durationMinutes={step1Data.durationMinutes}
                    locationId={step1Data.locationId}
                    groupSize={isGroupBooking ? groupSize : 1}
                    onComplete={handleStep2Complete}
                    onBack={goBack}
                  />
                </>
              )}
              
              {step === 3 && step1Data && step2Data && (
                <Step3Details
                  serviceType={step1Data.serviceType}
                  onComplete={handleStep3Complete}
                  onBack={goBack}
                />
              )}

              {step === 3.5 && step1Data && step2Data && reviewData && selectedService && (
                <Step3Review
                  service={selectedService}
                  date={step2Data.date}
                  time={step2Data.time}
                  fullName={reviewData.fullName}
                  email={reviewData.email}
                  phone={reviewData.phone}
                  notes={reviewData.notes}
                  totalPrice={totalPrice}
                  isGroupBooking={isGroupBooking}
                  groupSize={groupSize}
                  onComplete={handleReviewComplete}
                  onBack={goBack}
                  onEditStep={(editStep) => {
                    if (editStep === 1) setStep(1);
                    else if (editStep === 2) setStep(2);
                    else if (editStep === 3) setStep(3);
                  }}
                />
              )}

              {step === 4 && step1Data && step2Data && reviewData && selectedService && (
                <Step4Payment
                  service={selectedService}
                  date={step2Data.date}
                  time={step2Data.time}
                  fullName={reviewData.fullName}
                  email={reviewData.email}
                  phone={reviewData.phone}
                  onComplete={handleStep4Complete}
                  onBack={goBack}
                />
              )}
            </>
          )}
        </div>

        {/* Footer (mobile only for manual navigation) */}
        {!loading && step < 4 && step !== 3.5 && (
          <div className="sticky bottom-0 p-4 lg:p-6 bg-cocoa/20 border-t border-champagne/10 lg:hidden">
            <Button
              size="lg"
              className="w-full bg-gradient-to-r from-champagne to-bronze text-white"
              disabled={
                (step === 1 && !step1Data) ||
                (step === 2 && !step2Data) ||
                (step === 3 && !step3Data)
              }
              onClick={() => {
                if (step === 1 && step1Data) {
                  setStep(2);
                } else if (step === 2 && step2Data) {
                  setStep(waitlistMode ? 2.5 : 3);
                } else if (step === 3 && step3Data) {
                  setStep(3.5);
                }
              }}
              aria-label={
                step === 1 ? 'Continue to time selection' : step === 2 ? 'Continue to details' : 'Continue to review'
              }
            >
              Continue to {step === 1 ? 'Time Selection' : step === 2 ? 'Details' : 'Review'}
            </Button>
          </div>
        )}

        {/* Desktop sidebar summary */}
        {isDesktop && selectedService && step > 1 && (
          <div className="absolute top-24 right-6 w-64 p-4 rounded-2xl bg-cocoa/20 border border-champagne/15 space-y-3">
            <h3 className="text-sm font-semibold text-pearl/80">Booking Summary</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-pearl/60">Service</span>
                <span className="text-pearl">{selectedService.title}</span>
              </div>
              {isGroupBooking && (
                <div className="flex justify-between">
                  <span className="text-pearl/60">Group Size</span>
                  <span className="text-pearl">{groupSize} participants</span>
                </div>
              )}
              {step2Data && (
                <>
                  <div className="flex justify-between">
                    <span className="text-pearl/60">Date</span>
                    <span className="text-pearl">{step2Data.date && new Date(step2Data.date).toLocaleDateString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-pearl/60">Time</span>
                    <span className="text-pearl">{step2Data.time}</span>
                  </div>
                </>
              )}
              <div className="pt-2 border-t border-pearl/10">
                <div className="flex justify-between font-semibold">
                  <span className="text-pearl">Total</span>
                  <span className="text-champagne">{formatPrice(totalPrice)}</span>
                </div>
                {discountAmount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span className="text-pearl/60">You saved</span>
                    <span>{formatPrice(discountAmount)}</span>
                  </div>
                )}
              </div>

              {/* Quick Actions for Existing Bookings */}
              {step === 4 && selectedTimeSlot && (
                <div className="pt-3 border-t border-pearl/10 space-y-2">
                  <h4 className="text-xs font-medium text-pearl/60 mb-2">Quick Actions</h4>
                  <QuickRescheduleButton
                    bookingId={selectedTimeSlot.slotId}
                    onRescheduled={(success) => {
                      if (success) {
                        toast aria-live="polite" aria-atomic="true"({
                          title: 'Rescheduled successfully',
                          description: 'Your booking has been rescheduled.',
                        });
                      }
                    }}
                  />
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BookingSheet;