import { createContext, useContext, ReactNode, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

import { useBookingStore, Service, ServiceType } from '@/stores/bookingStore';
import { logger } from '@/lib/logger';

// Legacy context interface for backward compatibility
interface BookingContextType {
  selectedServiceId: string | null;
  serviceType: 'beauty' | 'fitness' | null;
  setSelectedService: (serviceId: string, type: 'beauty' | 'fitness') => void;
  clearSelection: () => void;
  navigateToBooking: (serviceId: string, type: 'beauty' | 'fitness') => void;
}

const BookingContext = createContext<BookingContextType | undefined>(undefined);

export const BookingProvider = ({ children }: { children: ReactNode }) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Get state and actions from Zustand store
  const selectedService = useBookingStore((state) => state.selectedService);
  const selectService = useBookingStore((state) => state.selectService);
  const resetBooking = useBookingStore((state) => state.resetBooking);

  // Extract legacy values from store
  const selectedServiceId = selectedService?.id || null;
  const serviceType = selectedService?.service_type || null;

  // Check URL params on mount and sync with store
  useEffect(() => {
    const serviceParam = searchParams.get('service');
    const typeParam = searchParams.get('type') as ServiceType | null;

    if (serviceParam && typeParam && !selectedService) {
      // Fetch service details and set in store
      fetchServiceAndSetInStore(serviceParam, typeParam);
    }
  }, [searchParams]);

  const fetchServiceAndSetInStore = async (serviceId: string, type: ServiceType) => {
    try {
      // Import dynamically to avoid circular dependencies
      const { supabase } = await import('@/integrations/supabase/client');

      const { data: service, error } = await supabase
        .from('services')
        .select('*')
        .eq('id', serviceId)
        .eq('service_type', type)
        .single();

      if (service && !error) {
        selectService(service as Service);
      }
    } catch (error) {
      logger.error('Failed to fetch service:', error);
    }
  };

  const setSelectedService = (serviceId: string, type: 'beauty' | 'fitness') => {
    // For backward compatibility, fetch service and set in store
    fetchServiceAndSetInStore(serviceId, type);
  };

  const clearSelection = () => {
    resetBooking();
  };

  const navigateToBooking = (serviceId: string, type: 'beauty' | 'fitness') => {
    setSelectedService(serviceId, type);
    navigate(`/book?service=${serviceId}&type=${type}`);
  };

  const contextValue = {
    selectedServiceId,
    serviceType,
    setSelectedService,
    clearSelection,
    navigateToBooking,
  };

  return (
    <BookingContext.Provider value={contextValue}>
      {children}
    </BookingContext.Provider>
  );
};

// Legacy hook for backward compatibility
// New components should use useBookingStore directly
export const useBooking = () => {
  const context = useContext(BookingContext);
  if (context === undefined) {
    throw new Error('useBooking must be used within a BookingProvider');
  }
  return context;
};

// Export new recommended hooks
export { useBookingStore } from '@/stores/bookingStore';

// Convenience hooks for specific store selections
export const useBookingService = () => useBookingStore((state) => state.selectedService);
export const useBookingTimeSlot = () => useBookingStore((state) => state.timeSlot);
export const useBookingDetails = () => useBookingStore((state) => state.details);
export const useBookingStep = () => useBookingStore((state) => state.currentStep);
export const useBookingCanProceed = () => useBookingStore((state) => state.canProceed);
export const useBookingError = () => useBookingStore((state) => state.error);
export const useCurrentBooking = () => useBookingStore((state) => state.currentBooking);
