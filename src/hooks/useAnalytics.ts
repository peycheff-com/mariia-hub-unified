import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

import { pushToDataLayer } from '@/lib/gtm';

interface AnalyticsEvent {
  event: string;
  page?: string;
  properties?: Record<string, any>;
}

export const useAnalytics = () => {
  const location = useLocation();

  useEffect(() => {
    // Track page views
    trackPageView(location.pathname);
  }, [location]);

  const trackPageView = (page: string) => {
    if (typeof window !== 'undefined') {
      // Store in localStorage for basic analytics
      const pageViews = JSON.parse(localStorage.getItem('pageViews') || '{}');
      pageViews[page] = (pageViews[page] || 0) + 1;
      localStorage.setItem('pageViews', JSON.stringify(pageViews));
      // Push to GTM if available
      pushToDataLayer({ event: 'page_view', page_location: page });
    }
  };

  const trackEvent = ({ event, page, properties }: AnalyticsEvent) => {
    if (typeof window !== 'undefined') {
      const events = JSON.parse(localStorage.getItem('analyticsEvents') || '[]');
      events.push({
        event,
        page: page || location.pathname,
        properties,
        timestamp: new Date().toISOString(),
      });
      // Keep only last 100 events
      if (events.length > 100) events.shift();
      localStorage.setItem('analyticsEvents', JSON.stringify(events));
      // Push to GTM if available
      pushToDataLayer({ event, page_location: page || location.pathname, ...properties });
    }
  };

  const trackServiceView = (serviceId: string, serviceType: string) => {
    trackEvent({
      event: 'service_view',
      properties: { serviceId, serviceType }
    });
  };

  return { trackEvent, trackPageView, trackServiceView };
};
