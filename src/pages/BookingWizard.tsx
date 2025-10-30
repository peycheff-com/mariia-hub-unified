import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";

import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast aria-live="polite" aria-atomic="true"";
import { useBooking } from "@/contexts/BookingContext";
import BookingSheet from "@/components/booking/BookingSheet";
import ErrorBoundary from "@/components/ErrorBoundary";

const BookingWizard = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast aria-live="polite" aria-atomic="true" } = useToast();
  const { selectedServiceId, serviceType } = useBooking();
  
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [services, setServices] = useState<any[]>([]);
  const [isOpen, setIsOpen] = useState(true);

  useEffect(() => {
    loadServices();
  }, []);

  // Preselect service and mode from URL params if provided
  useEffect(() => {
    const svc = searchParams.get('service'); // expects slug or id
    const type = searchParams.get('type'); // beauty|fitness
    if (!svc && !type) return;
    // Just store in sessionStorage for BookingSheet to read if needed
    if (svc) sessionStorage.setItem('prefill_service', svc);
    if (type) sessionStorage.setItem('prefill_type', type);
  }, [searchParams]);

  const loadServices = async () => {
    try {
      setLoadError(null);
      const { data, error } = await supabase
        .from('services')
        .select('*')
        .eq('is_active', true)
        .order('display_order');

      if (error) throw error;

      setServices(data || []);
    } catch (error: any) {
      setLoadError('Could not load services.');
      toast aria-live="polite" aria-atomic="true"({
        title: "Error",
        description: "Could not load services. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    navigate('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-muted-foreground">Loading services...</p>
        </div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-6">
        <div className="max-w-md w-full text-center space-y-4">
          <h1 className="text-xl font-semibold">We couldn’t load services</h1>
          <p className="text-muted-foreground">Please check your connection and try again. If the problem persists, contact support.</p>
          <div className="flex items-center justify-center gap-3">
            <button
              className="px-4 py-2 rounded-md bg-primary text-primary-foreground"
              onClick={() => {
                setLoading(true);
                loadServices();
              }}
              aria-label="Retry loading services"
            >
              Retry
            </button>
            <button
              className="px-4 py-2 rounded-md border"
              onClick={() => navigate('/contact')}
            >
              Contact support
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <BookingSheet
        isOpen={isOpen}
        onClose={handleClose}
        preselectedService={selectedServiceId || undefined}
      />
    </ErrorBoundary>
  );
};

export default BookingWizard;
