import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useLocation } from 'react-router-dom';

import { useMetaConversions } from '@/lib/meta-conversions-api';
import { useAuth } from '@/contexts/AuthContext.tsx';
import { logger } from '@/lib/logger';

interface User {
  id?: string;
  email?: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
  city?: string;
  country?: string;
  postal_code?: string;
  external_id?: string;
}

interface MetaCAPIContextType {
  trackPageView: (pageData?: { page?: string; title?: string; referrer?: string }) => Promise<void>;
  trackEvent: (eventName: string, eventData?: any, options?: {
    customData?: any;
    conversionValue?: number;
    currency?: string;
  }) => Promise<void>;
  trackBooking: (bookingData: any, isCompleted?: boolean) => Promise<void>;
  trackServiceView: (service: any) => Promise<void>;
  trackAddToCart: (service: any, quantity?: number, customData?: any) => Promise<void>;
  trackLead: (leadType: string, leadData?: any) => Promise<void>;
  trackContactForm: (formData?: any) => Promise<void>;
  trackNewsletter: () => Promise<void>;
  trackBusinessEvent: (eventName: string, businessData: {
    businessCategory?: string;
    serviceLocation?: string;
    appointmentType?: string;
    staffMember?: string;
    packageType?: string;
    membershipTier?: string;
  }, customData?: any) => Promise<void>;
  getRetryStatus: () => any;
  isEnabled: boolean;
  loading: boolean;
}

const MetaCAPIContext = createContext<MetaCAPIContextType | undefined>(undefined);

interface MetaCAPIProviderProps {
  children: ReactNode;
  enabled?: boolean;
}

export const MetaCAPIProvider: React.FC<MetaCAPIProviderProps> = ({
  children,
  enabled = import.meta.env.PROD
}) => {
  const location = useLocation();
  const { user: authUser } = useAuth();
  const metaConversions = useMetaConversions();
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<User | null>(null);

  // Get user data from auth context or fetch from profile
  useEffect(() => {
    const fetchUserProfile = async () => {
      if (authUser?.id) {
        try {
          const { supabase } = await import('@/integrations/supabase/client');
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', authUser.id)
            .single();

          if (profile) {
            setUserProfile({
              id: profile.id,
              email: profile.email,
              first_name: profile.first_name,
              last_name: profile.last_name,
              phone: profile.phone,
              city: profile.city,
              country: profile.country,
              postal_code: profile.postal_code,
              external_id: profile.external_id,
            });
          }
        } catch (error) {
          logger.error('Failed to fetch user profile for CAPI', error);
        }
      }
      setLoading(false);
    };

    fetchUserProfile();
  }, [authUser]);

  // Track page views on route changes
  useEffect(() => {
    if (enabled && !loading && userProfile) {
      trackPageView({
        page: location.pathname,
        title: document.title,
        referrer: document.referrer,
      });
    }
  }, [location.pathname, enabled, loading, userProfile]);

  const trackPageView = async (pageData?: { page?: string; title?: string; referrer?: string }) => {
    if (!enabled || !userProfile) return;

    try {
      await metaConversions.trackPageView(userProfile, pageData);
    } catch (error) {
      logger.error('Failed to track page view', error);
    }
  };

  const trackEvent = async (
    eventName: string,
    eventData?: any,
    options?: {
      customData?: any;
      conversionValue?: number;
      currency?: string;
    }
  ) => {
    if (!enabled || !userProfile) return;

    try {
      await metaConversions.trackEvent(eventName, userProfile, eventData, options);
    } catch (error) {
      logger.error('Failed to track event', { eventName, error });
    }
  };

  const trackBooking = async (bookingData: any, isCompleted = false) => {
    if (!enabled || !userProfile) return;

    try {
      await metaConversions.trackBooking(userProfile, bookingData, isCompleted);
    } catch (error) {
      logger.error('Failed to track booking', error);
    }
  };

  const trackServiceView = async (service: any) => {
    if (!enabled || !userProfile) return;

    try {
      await metaConversions.trackView(userProfile, service);
    } catch (error) {
      logger.error('Failed to track service view', error);
    }
  };

  const trackAddToCart = async (service: any, quantity?: number, customData?: any) => {
    if (!enabled || !userProfile) return;

    try {
      await metaConversions.trackAddToCart(userProfile, service, quantity, customData);
    } catch (error) {
      logger.error('Failed to track add to cart', error);
    }
  };

  const trackLead = async (leadType: string, leadData?: any) => {
    if (!enabled || !userProfile) return;

    try {
      await metaConversions.trackLead(userProfile, leadType, leadData);
    } catch (error) {
      logger.error('Failed to track lead', error);
    }
  };

  const trackContactForm = async (formData?: any) => {
    await trackLead('Contact Form Submission', {
      category: formData?.subject || 'General Inquiry',
      ...formData,
    });
  };

  const trackNewsletter = async () => {
    await trackLead('Newsletter Subscription');
  };

  const trackBusinessEvent = async (
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
    if (!enabled || !userProfile) return;

    try {
      await metaConversions.trackBusinessEvent(eventName, userProfile, businessData, customData);
    } catch (error) {
      logger.error('Failed to track business event', { eventName, error });
    }
  };

  const getRetryStatus = () => {
    return metaConversions.getRetryStatus();
  };

  const value: MetaCAPIContextType = {
    trackPageView,
    trackEvent,
    trackBooking,
    trackServiceView,
    trackAddToCart,
    trackLead,
    trackContactForm,
    trackNewsletter,
    trackBusinessEvent,
    getRetryStatus,
    isEnabled: enabled,
    loading,
  };

  return (
    <MetaCAPIContext.Provider value={value}>
      {children}
    </MetaCAPIContext.Provider>
  );
};

export const useMetaCAPI = (): MetaCAPIContextType => {
  const context = useContext(MetaCAPIContext);
  if (context === undefined) {
    throw new Error('useMetaCAPI must be used within a MetaCAPIProvider');
  }
  return context;
};

// Higher-order component for easy integration
export const withMetaTracking = <P extends object>(
  Component: React.ComponentType<P>,
  options?: {
    trackPageView?: boolean;
    customEventData?: any;
  }
) => {
  return React.memo((props: P) => {
    const metaCAPI = useMetaCAPI();

    useEffect(() => {
      if (options?.trackPageView !== false) {
        // Page view is already tracked by the provider on route changes
        // This is for additional custom tracking
        if (options?.customEventData) {
          metaCAPI.trackEvent('CustomPageView', options.customEventData);
        }
      }
    }, []);

    return <Component {...props} />;
  });
};