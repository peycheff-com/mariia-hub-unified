/// <reference types="vite/client" />
import * as Sentry from '@sentry/react';
import { reactRouterV6BrowserTracingIntegration, replayIntegration } from '@sentry/react';
import React from 'react';
import { useLocation, useNavigationType , createRoutesFromChildren, matchRoutes } from 'react-router-dom';

// Monitoring configuration
const SENTRY_CONFIG = {
  // Performance monitoring
  tracesSampleRate: import.meta.env.PROD ? 0.1 : 1.0, // 10% in production, 100% in development

  // Session replay
  replaysSessionSampleRate: import.meta.env.PROD ? 0.1 : 1.0, // 10% in production
  replaysOnErrorSampleRate: 1.0, // 100% for errors

  // Error filtering
  maxErrors: 50, // Limit number of errors sent per session
  maxBreadcrumbs: 100, // Limit breadcrumbs for performance
};

// Business-critical errors that should always be reported
const CRITICAL_ERRORS = [
  'payment_failed',
  'booking_failed',
  'stripe_error',
  'supabase_auth_error',
  'booking_slot_unavailable',
];

// Non-critical errors that can be filtered
const NON_CRITICAL_ERRORS = [
  'Network request failed',
  'Failed to fetch',
  'ResizeObserver loop limit exceeded',
  'Non-Error promise rejection captured',
  'Script error',
  'ChunkLoadError',
];

export const initSentry = (dsnOverride?: string) => {
  const dsn = dsnOverride || import.meta.env.VITE_SENTRY_DSN;
  // Only initialize if DSN is provided
  if (!dsn) {
    console.warn('Sentry DSN not provided, skipping initialization');
    return;
  }

  Sentry.init({
    dsn,

    // Enable performance monitoring
    integrations: [
      reactRouterV6BrowserTracingIntegration({
        useEffect: React.useEffect,
        useLocation,
        useNavigationType,
        createRoutesFromChildren,
        matchRoutes,
      }),
      replayIntegration({
        maskAllText: true,
        blockAllMedia: true,
      }),
    ],

    // Performance sampling
    tracesSampleRate: SENTRY_CONFIG.tracesSampleRate,

    // Session replay sampling
    replaysSessionSampleRate: SENTRY_CONFIG.replaysSessionSampleRate,
    replaysOnErrorSampleRate: SENTRY_CONFIG.replaysOnErrorSampleRate,

    // Environment configuration
    environment: import.meta.env.MODE,
    release: import.meta.env.VITE_APP_VERSION || '1.0.0',

    // Error filtering and processing
    beforeSend(event, hint) {
      return processErrorEvent(event, hint);
    },

    // Ignore non-critical errors
    ignoreErrors: NON_CRITICAL_ERRORS,

    // Custom tags and context
    initialScope: {
      tags: {
        component: 'frontend',
        framework: 'react',
        application: 'mariia-hub',
        buildTime: import.meta.env.VITE_BUILD_TIME,
        version: import.meta.env.VITE_APP_VERSION || '1.0.0',
        environment: import.meta.env.MODE,
      },
      user: {
        id: localStorage.getItem('user_id') || 'anonymous',
        role: localStorage.getItem('user_role') || 'customer',
      },
    },
  });

  console.log('Sentry initialized successfully');
};

// Process error events with business logic
function processErrorEvent(event: any, hint: any): any {
  const error = hint.originalException as Error;

  // Skip if no error object
  if (!error) return event;

  // Check if it's a critical business error
  const isCritical = CRITICAL_ERRORS.some(criticalError =>
    error.message?.toLowerCase().includes(criticalError.toLowerCase())
  );

  // Add business context
  if (event.exception) {
    event.contexts = {
      ...event.contexts,
      business: {
        critical: isCritical,
        errorCategory: categorizeError(error),
        userImpact: assessUserImpact(error),
        bookingFlowAffected: isBookingFlowAffected(error),
      },
    };
  }

  // Add custom tags for better filtering
  event.tags = {
    ...event.tags,
    error_severity: isCritical ? 'critical' : 'warning',
    error_source: getErrorSource(error),
    user_authenticated: isAuthenticated().toString(),
  };

  // Skip third-party errors unless critical
  if (event.exception?.values?.[0]?.stacktrace?.frames?.some(
    frame => isThirdPartyFrame(frame)
  ) && !isCritical) {
    return null;
  }

  // Rate limit non-critical errors
  if (!isCritical && shouldRateLimit(error)) {
    return null;
  }

  return event;
}

// Error categorization
function categorizeError(error: Error): string {
  if (error.message?.includes('payment') || error.message?.includes('stripe')) return 'payment';
  if (error.message?.includes('booking') || error.message?.includes('availability')) return 'booking';
  if (error.message?.includes('auth') || error.message?.includes('login')) return 'authentication';
  if (error.message?.includes('network') || error.message?.includes('fetch')) return 'network';
  if (error.message?.includes('validation') || error.message?.includes('invalid')) return 'validation';
  return 'unknown';
}

// Assess user impact
function assessUserImpact(error: Error): 'high' | 'medium' | 'low' {
  if (error.message?.includes('payment') || error.message?.includes('booking')) return 'high';
  if (error.message?.includes('auth') || error.message?.includes('login')) return 'medium';
  return 'low';
}

// Check if error affects booking flow
function isBookingFlowAffected(error: Error): boolean {
  const bookingKeywords = ['booking', 'appointment', 'slot', 'calendar', 'payment'];
  return bookingKeywords.some(keyword =>
    error.message?.toLowerCase().includes(keyword)
  );
}

// Get error source
function getErrorSource(error: Error): string {
  const stack = error.stack;
  if (stack?.includes('supabase')) return 'supabase';
  if (stack?.includes('stripe')) return 'stripe';
  if (stack?.includes('react-router')) return 'routing';
  if (stack?.includes('react-query')) return 'state-management';
  return 'application';
}

// Check if frame is from third-party
function isThirdPartyFrame(frame: any): boolean {
  if (!frame.filename) return false;
  const thirdPartyDomains = ['cdn.jsdelivr.net', 'googletagmanager.com', 'stripe.com', 'supabase.co'];
  return thirdPartyDomains.some(domain => frame.filename.includes(domain));
}

// Rate limiting for non-critical errors (rolling 5-minute window)
const errorCount = new Map<string, number>();
let lastResetMs = Date.now();

function shouldRateLimit(error: Error): boolean {
  const errorKey = `${error.name}:${error.message}`;
  const now = Date.now();

  // Reset counts every 5 minutes (rolling window)
  if (now - lastResetMs > 5 * 60 * 1000) {
    errorCount.clear();
    lastResetMs = now;
  }

  const count = errorCount.get(errorKey) || 0;

  // Allow max 5 occurrences of the same error per 5 minutes
  const shouldBlock = count >= 5;

  // Update count after decision
  errorCount.set(errorKey, count + 1);

  return shouldBlock;
}

// Helper functions
function getPageType(): string {
  const path = window.location.pathname;
  if (path.includes('/booking')) return 'booking';
  if (path.includes('/admin')) return 'admin';
  if (path.includes('/beauty') || path.includes('/fitness')) return 'services';
  if (path.includes('/blog')) return 'blog';
  return 'other';
}

function isAuthenticated(): boolean {
  return !!localStorage.getItem('user_id');
}

// Legacy export for backward compatibility
export function initLegacySentry(dsn: string) {
  if (typeof window === 'undefined' || !dsn) return;
  if ((window as any).__sentryInit) return;
  (window as any).__sentryInit = true;
  const script = document.createElement('script');
  script.src = 'https://browser.sentry-cdn.com/7.120.0/bundle.tracing.replay.min.js';
  script.integrity = 'sha384-9HZ5gkQF1JpH7+gXj+7TzJmCUX1m0+E0n5kXGXxG6J+U+cH8mKQ8QZzjHnC0g8mN';
  script.crossOrigin = 'anonymous';
  script.onload = () => {
    // @ts-ignore
    Sentry.init({ dsn, tracesSampleRate: 0.1, replaysSessionSampleRate: 0.1, replaysOnErrorSampleRate: 1.0 });
  };
  document.head.appendChild(script);
}

// Export Sentry for manual error reporting
export { Sentry };

// Helper to report errors manually
export const reportError = (error: Error, context?: Record<string, any>) => {
  if (import.meta.env.PROD) {
    Sentry.withScope((scope) => {
      if (context) {
        scope.setContext('additional_info', context);
        Object.keys(context).forEach(key => {
          scope.setTag(key, context[key]);
        });
      }
      Sentry.captureException(error);
    });
  } else {
    // In development, just log to console
    console.error('Error:', error, context);
  }
};

// Helper to report messages
export const reportMessage = (message: string, level: Sentry.SeverityLevel = 'info', context?: Record<string, any>) => {
  if (import.meta.env.PROD) {
    Sentry.withScope((scope) => {
      if (context) {
        scope.setContext('additional_info', context);
      }
      Sentry.captureMessage(message, level);
    });
  } else {
    // In development, just log to console
    console.log(`[${level.toUpperCase()}] ${message}`, context);
  }
};

// Helper to set user context
export const setUserContext = (user: { id: string; email?: string; username?: string }) => {
  if (import.meta.env.PROD) {
    Sentry.setUser(user);
  }
};

// Helper to clear user context
export const clearUserContext = () => {
  if (import.meta.env.PROD) {
    Sentry.setUser(null);
  }
};
