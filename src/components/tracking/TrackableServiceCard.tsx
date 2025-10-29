import React, { useRef, useEffect } from 'react';

import { useMetaTracking } from '@/hooks/useMetaTracking';
import { ServiceCard } from '@/components/ServiceCard';

import { Service } from '@/types/service';

interface TrackableServiceCardProps {
  service: Service;
  onView?: (service: Service) => void;
  onSelect?: (service: Service) => void;
  trackingData?: {
    source?: string;
    position?: number;
    category?: string;
    list?: string;
  };
  children?: React.ReactNode;
}

export const TrackableServiceCard: React.FC<TrackableServiceCardProps> = ({
  service,
  onView,
  onSelect,
  trackingData,
  children,
}) => {
  const { trackServiceView, trackServiceSelection, trackCustomConversion } = useMetaTracking();
  const hasBeenViewed = useRef(false);
  const impressionTimeoutRef = useRef<NodeJS.Timeout>();

  // Track service view when component is visible for at least 2 seconds
  useEffect(() => {
    if (!hasBeenViewed.current) {
      impressionTimeoutRef.current = setTimeout(() => {
        hasBeenViewed.current = true;
        trackServiceView(service);

        // Track additional impression data
        trackCustomConversion('ServiceImpression', {
          service_id: service.id,
          service_name: service.title || service.name,
          service_category: service.category || service.service_type,
          price: service.price_from || service.price,
          currency: service.currency || 'PLN',
          impression_source: trackingData?.source || 'service_grid',
          impression_position: trackingData?.position,
          impression_list: trackingData?.list || 'main_services',
        });

        onView?.(service);
      }, 2000); // 2 second delay for view tracking
    }

    return () => {
      if (impressionTimeoutRef.current) {
        clearTimeout(impressionTimeoutRef.current);
      }
    };
  }, [service, trackServiceView, trackCustomConversion, trackingData, onView]);

  const handleServiceSelect = () => {
    // Track service selection with additional context
    trackServiceSelection(service, 1);

    trackCustomConversion('ServiceClick', {
      service_id: service.id,
      service_name: service.title || service.name,
      service_category: service.category || service.service_type,
      click_source: trackingData?.source || 'service_card',
      click_position: trackingData?.position,
      click_list: trackingData?.list || 'main_services',
      price: service.price_from || service.price,
      currency: service.currency || 'PLN',
    });

    onSelect?.(service);
  };

  return (
    <div onClick={handleServiceSelect} style={{ cursor: 'pointer' }}>
      {children || <ServiceCard service={service} />}
    </div>
  );
};

// Higher-order component to make existing service cards trackable
export const withTracking = <P extends object>(
  Component: React.ComponentType<P>,
  getTrackingData?: (props: P) => {
    service?: Service;
    source?: string;
    position?: number;
    category?: string;
    list?: string;
  }
) => {
  return React.memo((props: P) => {
    const { trackServiceView, trackServiceSelection, trackCustomConversion } = useMetaTracking();
    const trackingData = getTrackingData?.(props);
    const hasBeenViewed = useRef(false);
    const impressionTimeoutRef = useRef<NodeJS.Timeout>();

    useEffect(() => {
      if (trackingData?.service && !hasBeenViewed.current) {
        impressionTimeoutRef.current = setTimeout(() => {
          hasBeenViewed.current = true;
          trackServiceView(trackingData.service);

          trackCustomConversion('ComponentImpression', {
            service_id: trackingData.service.id,
            component_type: Component.displayName || 'Component',
            impression_source: trackingData.source || 'component',
            impression_position: trackingData.position,
            impression_list: trackingData.list || 'main',
          });
        }, 2000);

        return () => {
          if (impressionTimeoutRef.current) {
            clearTimeout(impressionTimeoutRef.current);
          }
        };
      }
    }, [trackingData, trackServiceView, trackCustomConversion]);

    const handleClick = () => {
      if (trackingData?.service) {
        trackServiceSelection(trackingData.service, 1);

        trackCustomConversion('ComponentClick', {
          service_id: trackingData.service.id,
          component_type: Component.displayName || 'Component',
          click_source: trackingData.source || 'component',
          click_position: trackingData.position,
        });
      }
    };

    return (
      <div onClick={handleClick} style={{ cursor: 'pointer' }}>
        <Component {...props} />
      </div>
    );
  });
};

// Tracking wrapper for navigation links
export const TrackableLink: React.FC<{
  href: string;
  children: React.ReactNode;
  trackingData?: {
    link_name?: string;
    link_category?: string;
    destination?: string;
    position?: number;
  };
  onClick?: () => void;
}> = ({ href, children, trackingData, onClick }) => {
  const { trackCustomConversion } = useMetaTracking();

  const handleClick = () => {
    trackCustomConversion('LinkClick', {
      link_url: href,
      link_name: trackingData?.link_name || href,
      link_category: trackingData?.link_category || 'navigation',
      link_destination: trackingData?.destination || href,
      link_position: trackingData?.position,
      click_timestamp: new Date().toISOString(),
    });

    onClick?.();

    // Navigate after tracking
    if (href.startsWith('http')) {
      window.open(href, '_blank');
    } else {
      window.location.href = href;
    }
  };

  return (
    <a href={href} onClick={handleClick} style={{ cursor: 'pointer' }}>
      {children}
    </a>
  );
};

// Tracking wrapper for forms
export const TrackableForm: React.FC<{
  formName: string;
  onSubmit: (data: any) => void;
  trackingData?: {
    form_category?: string;
    form_position?: string;
  };
  children: React.ReactNode;
}> = ({ formName, onSubmit, trackingData, children }) => {
  const { trackCustomConversion } = useMetaTracking();

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);
    const data = Object.fromEntries(formData.entries());

    // Track form submission
    trackCustomConversion('FormSubmit', {
      form_name: formName,
      form_category: trackingData?.form_category || 'contact',
      form_position: trackingData?.form_position || 'main',
      has_email: !!data.email,
      has_phone: !!data.phone,
      has_message: !!data.message,
      submission_timestamp: new Date().toISOString(),
    });

    onSubmit(data);
  };

  return (
    <form onSubmit={handleSubmit}>
      {children}
    </form>
  );
};