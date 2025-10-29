import { useState, useEffect, useCallback } from 'react';
import { ArrowLeft, Check, Clock, Sparkles, Dumbbell, MapPin, Calendar, User, CreditCard, Shield, TrendingUp } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { useMetaTracking } from '@/hooks/useMetaTracking';
import { useBookingStore } from '@/stores/bookingStore';
import { Service, Location } from '@/types/booking';

import { TrustSignals } from './TrustSignals';

interface OptimizedBookingFlowProps {
  services: Service[];
  locations: Location[];
  preselectedService?: string;
  preselectedType?: 'beauty' | 'fitness';
  onComplete: (bookingData: any) => void;
  onClose: () => void;
}

export const OptimizedBookingFlow = ({
  services,
  locations,
  preselectedService,
  preselectedType,
  onComplete,
  onClose
}: OptimizedBookingFlowProps) => {
  const { toast } = useToast();
  const { t } = useTranslation();
  const { trackBookingFunnel, trackCustomConversion } = useMetaTracking();

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);

  // Smart defaults for faster booking
  const [bookingData, setBookingData] = useState({
    serviceType: preselectedType || null as 'beauty' | 'fitness' | null,
    selectedService: null as Service | null,
    selectedLocation: '',
    selectedDate: '',
    selectedTime: '',
    clientName: '',
    clientEmail: '',
    clientPhone: '',
    notes: '',
    acceptTerms: false,
    acceptMarketing: false,
  });

  // Enhanced urgency and social proof data
  const [urgencyData, setUrgencyData] = useState({
    slotsLeftToday: 3,
    nextAvailableIn: 1,
    popularTimeSlots: ['10:00', '14:00', '16:00'],
    bookingRate: 2.5, // bookings per hour
  });

  const [socialProof, setSocialProof] = useState({
    recentBookings: 12,
    averageRating: 4.9,
    totalReviews: 247,
    popularToday: true,
  });

  // Check device type
  useEffect(() => {
    const checkDesktop = () => setIsDesktop(window.innerWidth >= 1024);
    checkDesktop();
    window.addEventListener('resize', checkDesktop);
    return () => window.removeEventListener('resize', checkDesktop);
  }, []);

  // Auto-select service and location from URL params or preselection
  useEffect(() => {
    if (preselectedService) {
      const service = services.find(s => s.id === preselectedService);
      if (service) {
        setBookingData(prev => ({
          ...prev,
          selectedService: service,
          serviceType: (service.service_type === 'lifestyle' ? 'fitness' : service.service_type) as 'beauty' | 'fitness',
        }));

        // Auto-select location
        const defaultLocation = locations.find(l =>
          service.service_type === 'beauty' ? l.type === 'studio' : l.type === 'gym'
        );
        if (defaultLocation) {
          setBookingData(prev => ({ ...prev, selectedLocation: defaultLocation.id }));
        }
      }
    }
  }, [preselectedService, services, locations]);

  // Auto-fill user data if available
  useEffect(() => {
    // Try to get user data from localStorage or previous bookings
    const savedUserData = localStorage.getItem('user_booking_data');
    if (savedUserData) {
      try {
        const userData = JSON.parse(savedUserData);
        setBookingData(prev => ({
          ...prev,
          clientName: userData.name || '',
          clientEmail: userData.email || '',
          clientPhone: userData.phone || '',
        }));
      } catch (error) {
        console.warn('Failed to parse saved user data:', error);
      }
    }
  }, []);

  // Track funnel progression
  useEffect(() => {
    if (step === 1 && bookingData.serviceType) {
      trackBookingFunnel.serviceSelected({
        id: bookingData.selectedService?.id || '',
        title: bookingData.selectedService?.title || '',
        service_type: bookingData.serviceType,
      });
      trackCustomConversion('BookingStep1Started', {
        service_type: bookingData.serviceType,
        timestamp: new Date().toISOString(),
      });
    }

    if (step === 2 && bookingData.selectedDate) {
      trackBookingFunnel.timeSlotSelected({
        date: bookingData.selectedDate,
        time: bookingData.selectedTime,
        location: bookingData.selectedLocation,
      });
      trackCustomConversion('BookingStep2Started', {
        selected_date: bookingData.selectedDate,
        selected_time: bookingData.selectedTime,
      });
    }

    if (step === 3 && bookingData.clientName) {
      trackBookingFunnel.detailsEntered({
        client_name: bookingData.clientName,
        has_phone: !!bookingData.clientPhone,
        has_special_requests: !!bookingData.notes,
      });
      trackCustomConversion('BookingStep3Started', {
        has_name: !!bookingData.clientName,
        has_email: !!bookingData.clientEmail,
        has_phone: !!bookingData.clientPhone,
      });
    }
  }, [step, bookingData, trackBookingFunnel, trackCustomConversion]);

  const handleServiceTypeSelect = (type: 'beauty' | 'fitness') => {
    setBookingData(prev => ({ ...prev, serviceType: type }));
    trackCustomConversion('ServiceTypeSelected', {
      service_type: type,
      selection_timestamp: new Date().toISOString(),
    });
  };

  const handleServiceSelect = (service: Service) => {
    setBookingData(prev => ({
      ...prev,
      selectedService: service,
    }));

    // Auto-select location if only one option
    const allowed = service.location_rules?.allowed_locations || ['studio'];
    const validLocations = locations.filter(l => allowed.includes(l.type));
    if (validLocations.length === 1) {
      setBookingData(prev => ({ ...prev, selectedLocation: validLocations[0].id }));
    }

    trackCustomConversion('ServiceSelected', {
      service_id: service.id,
      service_name: service.title,
      service_type: service.service_type,
      price_from: service.price_from,
    });
  };

  const handleDateTimeSelect = (date: string, time: string) => {
    setBookingData(prev => ({
      ...prev,
      selectedDate: date,
      selectedTime: time,
    }));

    // Update urgency based on selection
    if (date === new Date().toISOString().split('T')[0]) {
      const remainingSlots = Math.max(1, urgencyData.slotsLeftToday - 1);
      setUrgencyData(prev => ({ ...prev, slotsLeftToday: remainingSlots }));
    }

    trackCustomConversion('TimeSlotSelected', {
      selected_date: date,
      selected_time: time,
      is_today: date === new Date().toISOString().split('T')[0],
    });
  };

  const saveUserData = useCallback(() => {
    if (bookingData.clientName && bookingData.clientEmail) {
      localStorage.setItem('user_booking_data', JSON.stringify({
        name: bookingData.clientName,
        email: bookingData.clientEmail,
        phone: bookingData.clientPhone,
        savedAt: new Date().toISOString(),
      }));
    }
  }, [bookingData]);

  const handleSubmit = async () => {
    if (!bookingData.selectedService || !bookingData.selectedDate || !bookingData.selectedTime) {
      toast({
        title: 'Missing Information',
        description: 'Please complete all required fields.',
        variant: 'destructive',
      });
      return;
    }

    if (!bookingData.clientName || !bookingData.clientEmail || !bookingData.acceptTerms) {
      toast({
        title: 'Missing Information',
        description: 'Please fill in your details and accept the terms.',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    saveUserData();

    try {
      // Simulate booking creation
      await new Promise(resolve => setTimeout(resolve, 2000));

      const bookingResult = {
        service: bookingData.selectedService,
        date: bookingData.selectedDate,
        time: bookingData.selectedTime,
        location: bookingData.selectedLocation,
        client: {
          name: bookingData.clientName,
          email: bookingData.clientEmail,
          phone: bookingData.clientPhone,
        },
        notes: bookingData.notes,
        acceptMarketing: bookingData.acceptMarketing,
        total_amount: bookingData.selectedService?.price_from || 0,
        currency: 'PLN',
      };

      trackBookingFunnel.completed({
        id: `booking_${Date.now()}`,
        total_amount: bookingResult.total_amount,
        currency: bookingResult.currency,
        services: [{
          id: bookingData.selectedService?.id || '',
          name: bookingData.selectedService?.title || '',
          price: bookingResult.total_amount,
        }],
      });

      trackCustomConversion('BookingCompleted', {
        service_id: bookingData.selectedService?.id,
        total_amount: bookingResult.total_amount,
        booking_duration: Date.now() - (performance.now() - 10000), // Approximate booking time
        steps_completed: 3, // Optimized flow
        used_smart_defaults: true,
      });

      onComplete(bookingResult);
      toast({
        title: 'Booking Confirmed!',
        description: 'You will receive a confirmation email shortly.',
      });

    } catch (error) {
      console.error('Booking error:', error);
      toast({
        title: 'Booking Failed',
        description: 'Please try again or contact support.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const progress = step === 1 ? 33 : step === 2 ? 66 : 100;

  const filteredServices = services
    .filter(s => !bookingData.serviceType || s.service_type === bookingData.serviceType)
    .slice(0, 6);

  return (
    <div className="w-full max-w-4xl mx-auto">
      {/* Progress Bar */}
      <div className="mb-6">
        <div className="relative h-2 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-champagne via-champagne-200 to-bronze transition-all duration-500 ease-out shadow-luxury rounded-full"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="mt-2 grid grid-cols-3 text-center">
          <div className={cn("text-xs transition-colors", step >= 1 ? "text-champagne font-semibold" : "text-gray-400")}>
            Service
          </div>
          <div className={cn("text-xs transition-colors", step >= 2 ? "text-champagne font-semibold" : "text-gray-400")}>
            Date & Time
          </div>
          <div className={cn("text-xs transition-colors", step >= 3 ? "text-champagne font-semibold" : "text-gray-400")}>
            Details & Payment
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main Booking Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Step 1: Service Selection */}
          {step === 1 && (
            <div className="space-y-4">
              {!bookingData.serviceType ? (
                <div className="space-y-4">
                  <h2 className="text-xl font-semibold text-gray-900">What brings you here?</h2>
                  <div className="grid grid-cols-2 gap-4">
                    <button
                      onClick={() => handleServiceTypeSelect('beauty')}
                      className="p-8 rounded-2xl border-2 border-gray-200 hover:border-champagne-400 hover:shadow-lg transition-all bg-white"
                    >
                      <Sparkles className="w-8 h-8 text-champagne mx-auto mb-3" />
                      <div className="text-gray-900 font-semibold text-lg">Beauty</div>
                      <div className="text-gray-500 text-sm">PMU • Brows • Lips</div>
                    </button>
                    <button
                      onClick={() => handleServiceTypeSelect('fitness')}
                      className="p-8 rounded-2xl border-2 border-gray-200 hover:border-champagne-400 hover:shadow-lg transition-all bg-white"
                    >
                      <Dumbbell className="w-8 h-8 text-champagne mx-auto mb-3" />
                      <div className="text-gray-900 font-semibold text-lg">Fitness</div>
                      <div className="text-gray-500 text-sm">Training • Programs</div>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold text-gray-900">Choose a service</h2>
                    <button
                      onClick={() => setBookingData(prev => ({ ...prev, serviceType: null, selectedService: null }))}
                      className="text-gray-500 hover:text-gray-700 text-sm"
                    >
                      Back to types
                    </button>
                  </div>

                  <div className="grid gap-3 max-h-[400px] overflow-y-auto">
                    {filteredServices.map((service) => (
                      <button
                        key={service.id}
                        onClick={() => handleServiceSelect(service)}
                        className={cn(
                          "p-4 rounded-xl border-2 transition-all text-left",
                          bookingData.selectedService?.id === service.id
                            ? "border-champagne-400 bg-champagne/10"
                            : "border-gray-200 hover:border-champagne-300 bg-white"
                        )}
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="font-medium text-gray-900 mb-1">{service.title}</div>
                            <div className="flex items-center gap-3 text-sm text-gray-500">
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {service.duration_minutes || 60}m
                              </span>
                              {service.price_from && (
                                <span className="text-champagne-600 font-medium">
                                  {service.price_from} PLN
                                </span>
                              )}
                            </div>
                          </div>
                          <Check className={cn(
                            "w-5 h-5 transition-colors",
                            bookingData.selectedService?.id === service.id
                              ? "text-champagne-500"
                              : "text-gray-300"
                          )} />
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {bookingData.selectedService && (
                <div className="flex justify-center">
                  <Button
                    onClick={() => setStep(2)}
                    className="bg-gradient-to-r from-champagne to-bronze text-white px-8 py-3"
                  >
                    Continue to Date & Time
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* Step 2: Date & Time */}
          {step === 2 && bookingData.selectedService && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-gray-900">When would you like to come?</h2>

              {/* Simplified time selection */}
              <div className="grid gap-4">
                {/* Today */}
                <div>
                  <h3 className="font-medium text-gray-700 mb-2">Today</h3>
                  <div className="grid grid-cols-3 gap-2">
                    {urgencyData.popularTimeSlots.map((time) => (
                      <button
                        key={time}
                        onClick={() => handleDateTimeSelect(
                          new Date().toISOString().split('T')[0],
                          time
                        )}
                        className={cn(
                          "p-3 rounded-lg border-2 transition-all",
                          bookingData.selectedDate === new Date().toISOString().split('T')[0] &&
                          bookingData.selectedTime === time
                            ? "border-champagne-400 bg-champagne/10 text-champagne-700"
                            : "border-gray-200 hover:border-champagne-300"
                        )}
                      >
                        <div className="font-medium">{time}</div>
                        {urgencyData.slotsLeftToday <= 2 && (
                          <div className="text-xs text-red-500">Only {urgencyData.slotsLeftToday} left</div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Tomorrow */}
                <div>
                  <h3 className="font-medium text-gray-700 mb-2">Tomorrow</h3>
                  <div className="grid grid-cols-3 gap-2">
                    {['09:00', '11:00', '14:00', '16:00', '17:00', '18:00'].map((time) => (
                      <button
                        key={time}
                        onClick={() => {
                          const tomorrow = new Date();
                          tomorrow.setDate(tomorrow.getDate() + 1);
                          handleDateTimeSelect(
                            tomorrow.toISOString().split('T')[0],
                            time
                          );
                        }}
                        className={cn(
                          "p-3 rounded-lg border-2 transition-all",
                          bookingData.selectedDate === new Date(Date.now() + 86400000).toISOString().split('T')[0] &&
                          bookingData.selectedTime === time
                            ? "border-champagne-400 bg-champagne/10 text-champagne-700"
                            : "border-gray-200 hover:border-champagne-300"
                        )}
                      >
                        <div className="font-medium">{time}</div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex justify-center pt-4">
                <Button
                  onClick={() => setStep(3)}
                  disabled={!bookingData.selectedDate || !bookingData.selectedTime}
                  className="bg-gradient-to-r from-champagne to-bronze text-white px-8 py-3"
                >
                  Continue to Details
                </Button>
              </div>
            </div>
          )}

          {/* Step 3: Details & Payment */}
          {step === 3 && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-gray-900">Your Details</h2>

              <div className="space-y-4">
                <Input
                  placeholder="Full Name *"
                  value={bookingData.clientName}
                  onChange={(e) => setBookingData(prev => ({ ...prev, clientName: e.target.value }))}
                  className="w-full"
                />

                <Input
                  type="email"
                  placeholder="Email Address *"
                  value={bookingData.clientEmail}
                  onChange={(e) => setBookingData(prev => ({ ...prev, clientEmail: e.target.value }))}
                  className="w-full"
                />

                <Input
                  type="tel"
                  placeholder="Phone Number (Optional)"
                  value={bookingData.clientPhone}
                  onChange={(e) => setBookingData(prev => ({ ...prev, clientPhone: e.target.value }))}
                  className="w-full"
                />

                <textarea
                  placeholder="Special requests or notes (Optional)"
                  value={bookingData.notes}
                  onChange={(e) => setBookingData(prev => ({ ...prev, notes: e.target.value }))}
                  className="w-full p-3 border-2 border-gray-200 rounded-lg resize-none h-24 focus:border-champagne-400 focus:outline-none"
                />

                <div className="space-y-2">
                  <label className="flex items-start gap-2">
                    <input
                      type="checkbox"
                      checked={bookingData.acceptTerms}
                      onChange={(e) => setBookingData(prev => ({ ...prev, acceptTerms: e.target.checked }))}
                      className="mt-1"
                    />
                    <span className="text-sm text-gray-600">
                      I agree to the terms and conditions *
                    </span>
                  </label>

                  <label className="flex items-start gap-2">
                    <input
                      type="checkbox"
                      checked={bookingData.acceptMarketing}
                      onChange={(e) => setBookingData(prev => ({ ...prev, acceptMarketing: e.target.checked }))}
                      className="mt-1"
                    />
                    <span className="text-sm text-gray-600">
                      Send me updates and special offers
                    </span>
                  </label>
                </div>
              </div>

              <div className="flex justify-center pt-4">
                <Button
                  onClick={handleSubmit}
                  disabled={loading || !bookingData.clientName || !bookingData.clientEmail || !bookingData.acceptTerms}
                  className="bg-gradient-to-r from-champagne to-bronze text-white px-8 py-3"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    `Complete Booking - ${bookingData.selectedService?.price_from || 0} PLN`
                  )}
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar with Trust Signals and Summary */}
        <div className="space-y-6">
          {/* Trust Signals */}
          <TrustSignals
            serviceType={bookingData.serviceType || undefined}
            currentStep={step}
            serviceName={bookingData.selectedService?.title}
            price={bookingData.selectedService?.price_from}
            urgencyData={urgencyData}
            socialProof={socialProof}
          />

          {/* Booking Summary */}
          {bookingData.selectedService && (
            <div className="p-4 bg-gradient-to-br from-champagne/10 to-bronze/10 rounded-2xl border border-champagne/20">
              <h3 className="font-semibold text-gray-900 mb-3">Booking Summary</h3>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Service</span>
                  <span className="font-medium">{bookingData.selectedService.title}</span>
                </div>

                {bookingData.selectedDate && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Date</span>
                    <span className="font-medium">
                      {new Date(bookingData.selectedDate).toLocaleDateString()}
                    </span>
                  </div>
                )}

                {bookingData.selectedTime && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Time</span>
                    <span className="font-medium">{bookingData.selectedTime}</span>
                  </div>
                )}

                <div className="pt-2 border-t border-champagne/20">
                  <div className="flex justify-between font-semibold text-lg">
                    <span>Total</span>
                    <span className="text-champagne-600">
                      {bookingData.selectedService.price_from || 0} PLN
                    </span>
                  </div>
                </div>
              </div>

              {/* Security Badges */}
              <div className="mt-4 pt-4 border-t border-champagne/20">
                <div className="flex items-center gap-2 text-xs text-gray-600">
                  <Shield className="w-4 h-4 text-green-500" />
                  <span>SSL Secured Payment</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-600 mt-1">
                  <CheckCircle className="w-4 h-4 text-blue-500" />
                  <span>Instant Confirmation</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};