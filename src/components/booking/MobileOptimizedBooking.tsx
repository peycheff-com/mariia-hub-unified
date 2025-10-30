import { useState, useEffect, useCallback, useRef } from 'react';
import { ChevronRight, Clock, Star, Shield, Zap, User, CreditCard, ArrowLeft, Check } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useToast } from '@/components/ui/use-toast aria-live="polite" aria-atomic="true"';
import { useConversionOptimization } from '@/lib/conversion-optimization';
import { Service } from '@/types/booking';

interface MobileOptimizedBookingProps {
  services: Service[];
  preselectedService?: string;
  preselectedType?: 'beauty' | 'fitness';
  onComplete: (bookingData: any) => void;
  onClose: () => void;
}

export const MobileOptimizedBooking = ({
  services,
  preselectedService,
  preselectedType,
  onComplete,
  onClose
}: MobileOptimizedBookingProps) => {
  const { toast aria-live="polite" aria-atomic="true" } = useToast();
  const { t } = useTranslation();
  const { trackFunnelStep, trackEvent, getVariation } = useConversionOptimization();

  const [currentView, setCurrentView] = useState<'quick-book' | 'services' | 'details'>('quick-book');
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<{ date: string; time: string } | null>(null);
  const [bookingDetails, setBookingDetails] = useState({
    name: '',
    email: '',
    phone: '',
    notes: '',
  });
  const [loading, setLoading] = useState(false);

  // Get A/B test variation for mobile optimization
  const mobileVariation = getVariation('mobile_booking_flow') || 'control';

  // Smart defaults from previous sessions
  const [smartDefaults, setSmartDefaults] = useState({
    preferredService: '',
    preferredTime: 'morning',
    knownUser: false,
  });

  // Touch-optimized swipe handling
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);

  // Load user data and smart defaults
  useEffect(() => {
    const userData = localStorage.getItem('mobile_booking_user_data');
    const preferences = localStorage.getItem('mobile_booking_preferences');

    if (userData) {
      try {
        const parsed = JSON.parse(userData);
        setBookingDetails(prev => ({
          ...prev,
          name: parsed.name || '',
          email: parsed.email || '',
          phone: parsed.phone || '',
        }));
        setSmartDefaults(prev => ({ ...prev, knownUser: !!parsed.name }));
      } catch (error) {
        console.warn('Failed to parse user data:', error);
      }
    }

    if (preferences) {
      try {
        const parsed = JSON.parse(preferences);
        setSmartDefaults(prev => ({
          ...prev,
          preferredService: parsed.serviceId || '',
          preferredTime: parsed.preferredTime || 'morning',
        }));
      } catch (error) {
        console.warn('Failed to parse preferences:', error);
      }
    }

    // Auto-select preselected service
    if (preselectedService) {
      const service = services.find(s => s.id === preselectedService);
      if (service) {
        setSelectedService(service);
        setCurrentView('details');
      }
    }

    // Track mobile booking start
    trackEvent('mobile_booking_started', {
      variation: mobileVariation,
      known_user: smartDefaults.knownUser,
      preselected_service: !!preselectedService,
    });
  }, [preselectedService, services, smartDefaults.knownUser]);

  // Touch swipe handling
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.changedTouches[0].screenX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    touchEndX.current = e.changedTouches[0].screenX;
    handleSwipe();
  };

  const handleSwipe = () => {
    const swipeThreshold = 50;
    const diff = touchStartX.current - touchEndX.current;

    if (Math.abs(diff) > swipeThreshold) {
      if (diff > 0 && currentView !== 'details') {
        // Swipe left - next view
        if (currentView === 'quick-book') setCurrentView('services');
        else if (currentView === 'services') setCurrentView('details');
      } else if (diff < 0 && currentView !== 'quick-book') {
        // Swipe right - previous view
        if (currentView === 'details') setCurrentView('services');
        else if (currentView === 'services') setCurrentView('quick-book');
      }
    }
  };

  // Popular time slots for quick booking
  const popularTimeSlots = [
    { time: '09:00', label: 'Morning', available: true, popular: true },
    { time: '12:00', label: 'Lunch', available: true, popular: false },
    { time: '15:00', label: 'Afternoon', available: true, popular: true },
    { time: '18:00', label: 'Evening', available: false, popular: false },
  ];

  const quickBookServices = services
    .filter(s => smartDefaults.preferredService ? s.id === smartDefaults.preferredService : true)
    .slice(0, 3);

  const handleQuickBook = (service: Service, timeSlot: any) => {
    setSelectedService(service);
    setSelectedSlot({
      date: new Date().toISOString().split('T')[0],
      time: timeSlot.time,
    });

    // Save preferences
    const preferences = {
      serviceId: service.id,
      preferredTime: timeSlot.time < '12:00' ? 'morning' : timeSlot.time < '17:00' ? 'afternoon' : 'evening',
    };
    localStorage.setItem('mobile_booking_preferences', JSON.stringify(preferences));

    setCurrentView('details');

    trackEvent('quick_book_selected', {
      service_id: service.id,
      service_name: service.title,
      time_slot: timeSlot.time,
      time_label: timeSlot.label,
    });
  };

  const handleSubmit = async () => {
    if (!selectedService || !selectedSlot || !bookingDetails.name || !bookingDetails.email) {
      toast aria-live="polite" aria-atomic="true"({
        title: 'Missing Information',
        description: 'Please complete all required fields.',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);

    try {
      // Save user data for next time
      localStorage.setItem('mobile_booking_user_data', JSON.stringify({
        name: bookingDetails.name,
        email: bookingDetails.email,
        phone: bookingDetails.phone,
        lastBooked: new Date().toISOString(),
      }));

      // Simulate booking creation
      await new Promise(resolve => setTimeout(resolve, 2000));

      const bookingResult = {
        service: selectedService,
        date: selectedSlot.date,
        time: selectedSlot.time,
        client: bookingDetails,
        notes: bookingDetails.notes,
        total_amount: selectedService.price_from || 0,
        currency: 'PLN',
        booking_source: 'mobile_optimized',
        variation: mobileVariation,
        steps_completed: 2, // Quick book flow
      };

      trackFunnelStep('booking_completed', 3, {
        service_id: selectedService.id,
        total_amount: bookingResult.total_amount,
        quick_book_used: true,
        steps_completed: bookingResult.steps_completed,
        time_to_complete: Date.now() - (performance.now() - 10000),
      });

      trackEvent('mobile_booking_completed', {
        service_id: selectedService.id,
        total_amount: bookingResult.total_amount,
        quick_book_used: true,
        known_user: smartDefaults.knownUser,
        variation: mobileVariation,
      });

      onComplete(bookingResult);

      toast aria-live="polite" aria-atomic="true"({
        title: 'Booking Confirmed!',
        description: 'Check your email for confirmation.',
      });

    } catch (error) {
      console.error('Booking error:', error);
      toast aria-live="polite" aria-atomic="true"({
        title: 'Booking Failed',
        description: 'Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // Render different views based on mobile optimization variation
  const renderQuickBook = () => {
    if (mobileVariation === 'grid_view') {
      return (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">Quick Book</h2>
          <div className="grid grid-cols-1 gap-3">
            {quickBookServices.map((service) => (
              <div key={service.id} className="p-4 bg-white rounded-xl border-2 border-gray-200">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="font-medium text-gray-900">{service.title}</h3>
                    <p className="text-sm text-gray-600">{service.duration_minutes || 60} min</p>
                  </div>
                  <div className="text-lg font-semibold text-champagne-600">
                    {service.price_from} PLN
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  {popularTimeSlots.map((slot) => (
                    <button
                      key={slot.time}
                      onClick={() => handleQuickBook(service, slot)}
                      disabled={!slot.available}
                      className={cn(
                        "p-3 rounded-lg text-sm font-medium transition-all",
                        slot.available
                          ? slot.popular
                            ? "bg-champagne text-white"
                            : "bg-gray-100 hover:bg-gray-200 text-gray-900"
                          : "bg-gray-50 text-gray-400 cursor-not-allowed"
                      )}
                    >
                      <div className="flex justify-between items-center">
                        <span>{slot.label}</span>
                        <Clock className="w-3 h-3" />
                      </div>
                      <div className="text-xs opacity-80">{slot.time}</div>
                      {slot.popular && (
                        <Badge variant="secondary" className="mt-1 text-xs">
                          Popular
                        </Badge>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={() => setCurrentView('services')}
            className="w-full p-3 text-center text-champagne-600 font-medium border border-champagne-300 rounded-lg"
          >
            View All Services →
          </button>
        </div>
      );
    }

    // Default list view
    return (
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-gray-900">Book Now</h2>
        {quickBookServices.map((service) => (
          <div key={service.id} className="p-4 bg-white rounded-xl border-2 border-gray-200">
            <div className="flex justify-between items-center mb-3">
              <div>
                <h3 className="font-medium text-gray-900">{service.title}</h3>
                <p className="text-sm text-gray-600">{service.duration_minutes || 60} min</p>
              </div>
              <div className="text-lg font-semibold text-champagne-600">
                {service.price_from} PLN
              </div>
            </div>

            <div className="space-y-2">
              {popularTimeSlots
                .filter(slot => slot.available)
                .slice(0, 3)
                .map((slot) => (
                  <button
                    key={slot.time}
                    onClick={() => handleQuickBook(service, slot)}
                    className="w-full p-3 bg-gray-100 hover:bg-gray-200 rounded-lg text-left transition-all"
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <span className="font-medium text-gray-900">{slot.label}</span>
                        <span className="text-sm text-gray-600 ml-2">{slot.time}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {slot.popular && (
                          <Badge variant="secondary" className="text-xs">
                            Popular
                          </Badge>
                        )}
                        <ChevronRight className="w-4 h-4 text-gray-400" />
                      </div>
                    </div>
                  </button>
                ))}
            </div>
          </div>
        ))}

        <button
          onClick={() => setCurrentView('services')}
          className="w-full p-3 text-center text-champagne-600 font-medium border border-champagne-300 rounded-lg"
        >
          See All Services
        </button>
      </div>
    );
  };

  const renderServices = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">All Services</h2>
        <button
          onClick={() => setCurrentView('quick-book')}
          className="text-champagne-600 font-medium text-sm"
        >
          ← Quick Book
        </button>
      </div>

      <div className="grid gap-3">
        {services.map((service) => (
          <button
            key={service.id}
            onClick={() => {
              setSelectedService(service);
              setCurrentView('details');
            }}
            className="p-4 bg-white rounded-xl border-2 border-gray-200 text-left transition-all hover:border-champagne-300"
          >
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <h3 className="font-medium text-gray-900 mb-1">{service.title}</h3>
                <p className="text-sm text-gray-600">{service.duration_minutes || 60} min</p>
              </div>
              <div className="text-right">
                <div className="text-lg font-semibold text-champagne-600">
                  {service.price_from} PLN
                </div>
                <ChevronRight className="w-4 h-4 text-gray-400 ml-2" />
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );

  const renderDetails = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">Your Details</h2>
        <button
          onClick={() => setCurrentView('services')}
          className="text-champagne-600 font-medium text-sm"
        >
          ← Back
        </button>
      </div>

      {/* Service Summary */}
      {selectedService && (
        <div className="p-4 bg-gradient-to-br from-champagne/10 to-bronze/10 rounded-xl border border-champagne/20">
          <div className="flex justify-between items-center mb-2">
            <h3 className="font-medium text-gray-900">{selectedService.title}</h3>
            <div className="text-lg font-semibold text-champagne-600">
              {selectedService.price_from} PLN
            </div>
          </div>

          {selectedSlot && (
            <div className="text-sm text-gray-600">
              <Clock className="w-3 h-3 inline mr-1" />
              {new Date(selectedSlot.date).toLocaleDateString()} at {selectedSlot.time}
            </div>
          )}
        </div>
      )}

      {/* Trust Badges */}
      <div className="grid grid-cols-3 gap-2">
        <div className="p-2 text-center">
          <Shield className="w-5 h-5 text-green-500 mx-auto mb-1" />
          <div className="text-xs text-gray-600">Secure</div>
        </div>
        <div className="p-2 text-center">
          <Zap className="w-5 h-5 text-blue-500 mx-auto mb-1" />
          <div className="text-xs text-gray-600">Instant</div>
        </div>
        <div className="p-2 text-center">
          <Star className="w-5 h-5 text-yellow-500 mx-auto mb-1" />
          <div className="text-xs text-gray-600">Top Rated</div>
        </div>
      </div>

      {/* Quick Form */}
      <div className="space-y-3">
        {smartDefaults.knownUser && (
          <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700">
            <User className="w-4 h-4 inline mr-2" />
            Welcome back! Your details are prefilled.
          </div>
        )}

        <input
          type="text"
          placeholder="Full Name *"
          value={bookingDetails.name}
          onChange={(e) => setBookingDetails(prev => ({ ...prev, name: e.target.value }))}
          className="w-full p-4 border-2 border-gray-200 rounded-xl focus:border-champagne-400 focus:outline-none text-base"
        />

        <input
          type="email"
          placeholder="Email Address *"
          value={bookingDetails.email}
          onChange={(e) => setBookingDetails(prev => ({ ...prev, email: e.target.value }))}
          className="w-full p-4 border-2 border-gray-200 rounded-xl focus:border-champagne-400 focus:outline-none text-base"
        />

        <input
          type="tel"
          placeholder="Phone Number (Optional)"
          value={bookingDetails.phone}
          onChange={(e) => setBookingDetails(prev => ({ ...prev, phone: e.target.value }))}
          className="w-full p-4 border-2 border-gray-200 rounded-xl focus:border-champagne-400 focus:outline-none text-base"
        />

        <textarea
          placeholder="Special requests (Optional)"
          value={bookingDetails.notes}
          onChange={(e) => setBookingDetails(prev => ({ ...prev, notes: e.target.value }))}
          className="w-full p-4 border-2 border-gray-200 rounded-xl resize-none h-24 focus:border-champagne-400 focus:outline-none text-base"
        />
      </div>

      {/* Submit Button */}
      <Button
        onClick={handleSubmit}
        disabled={loading || !bookingDetails.name || !bookingDetails.email}
        className="w-full bg-gradient-to-r from-champagne to-bronze text-white py-4 text-lg font-semibold"
      >
        {loading ? (
          <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
        ) : (
          <>
            <CreditCard className="w-5 h-5 mr-2" />
            Complete Booking - {selectedService?.price_from || 0} PLN
          </>
        )}
      </Button>

      {/* Security Info */}
      <div className="text-center text-xs text-gray-500 space-y-1">
        <div className="flex items-center justify-center gap-1">
          <Shield className="w-3 h-3 text-green-500" />
          <span>SSL Encrypted • Instant Confirmation</span>
        </div>
        <div>Free cancellation up to 24 hours before</div>
      </div>
    </div>
  );

  return (
    <div
      className="min-h-screen bg-gradient-to-b from-gray-50 to-white"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-200 px-4 py-3">
        <div className="flex items-center justify-between">
          <button
            onClick={onClose}
            className="p-2 -ml-2 text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          <h1 className="font-semibold text-gray-900">Book Now</h1>

          <div className="flex items-center gap-1">
            <div className={cn(
              "w-2 h-2 rounded-full",
              currentView === 'quick-book' ? "bg-champagne-600" : "bg-gray-300"
            )} />
            <div className={cn(
              "w-2 h-2 rounded-full",
              currentView === 'services' ? "bg-champagne-600" : "bg-gray-300"
            )} />
            <div className={cn(
              "w-2 h-2 rounded-full",
              currentView === 'details' ? "bg-champagne-600" : "bg-gray-300"
            )} />
          </div>
        </div>

        {/* Progress indicator */}
        <div className="mt-3">
          <div className="h-1 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-champagne to-bronze transition-all duration-300"
              style={{
                width: currentView === 'quick-book' ? '33%' : currentView === 'services' ? '66%' : '100%'
              }}
            />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {currentView === 'quick-book' && renderQuickBook()}
        {currentView === 'services' && renderServices()}
        {currentView === 'details' && renderDetails()}
      </div>

      {/* Swipe hint for mobile */}
      <div className="fixed bottom-4 left-0 right-0 text-center text-xs text-gray-500">
        Swipe to navigate
      </div>
    </div>
  );
};