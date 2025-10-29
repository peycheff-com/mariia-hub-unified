import React, { useEffect } from 'react';

import { logger } from '@/lib/logger';

import { MetaCAPIProvider } from './MetaCAPIProvider';

interface MetaCAPIInitializerProps {
  children: React.ReactNode;
}

export const MetaCAPIInitializer: React.FC<MetaCAPIInitializerProps> = ({ children }) => {
  useEffect(() => {
    // Initialize Meta Pixel if environment variables are available
    if (import.meta.env.VITE_META_PIXEL_ID && typeof window !== 'undefined') {
      initializeMetaPixel();
    }

    // Log CAPI initialization
    logger.info('Meta CAPI initialized', {
      enabled: import.meta.env.PROD,
      pixelId: import.meta.env.VITE_META_PIXEL_ID ? 'configured' : 'not configured',
    });
  }, []);

  const initializeMetaPixel = () => {
    try {
      // Initialize Meta Pixel (base pixel for client-side tracking)
      !(function (f, b, e, v, n, t, s) {
        if (f.fbq) return;
        n = f.fbq = function () {
          n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments);
        };
        if (!f._fbq) f._fbq = n;
        n.push = n;
        n.loaded = !0;
        n.version = '2.0';
        n.queue = [];
        t = b.createElement(e);
        t.async = !0;
        t.src = v;
        s = b.getElementsByTagName(e)[0];
        s.parentNode.insertBefore(t, s);
      })(
        window,
        document,
        'script',
        'https://connect.facebook.net/en_US/fbevents.js'
      );

      // Initialize pixel with ID
      window.fbq('init', import.meta.env.VITE_META_PIXEL_ID!);

      // Track initial page view
      window.fbq('track', 'PageView');

      logger.info('Meta Pixel initialized successfully', {
        pixelId: import.meta.env.VITE_META_PIXEL_ID,
      });
    } catch (error) {
      logger.error('Failed to initialize Meta Pixel', error);
    }
  };

  // Enable CAPI only in production
  const isCAPIEnabled = import.meta.env.PROD &&
                       !!import.meta.env.VITE_META_ACCESS_TOKEN &&
                       !!import.meta.env.VITE_META_PIXEL_ID;

  return (
    <MetaCAPIProvider enabled={isCAPIEnabled}>
      {children}
    </MetaCAPIProvider>
  );
};

// Type declarations for Facebook Pixel
declare global {
  interface Window {
    fbq: (command: string, action: string, options?: any) => void;
    _fbq: any;
  }
}