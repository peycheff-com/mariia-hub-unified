// Content Security Policy configuration
export const CSP_DIRECTIVES = {
  // Script sources
  'script-src': [
    "'self'", // Same origin
    "'unsafe-inline'", // For inline scripts (use sparingly)
    "'unsafe-eval'", // For dynamic evaluation (use sparingly)
    'https://www.googletagmanager.com', // Google Analytics
    'https://www.google-analytics.com', // Google Analytics
    'https://connect.facebook.net', // Facebook Pixel
    'https://www.facebook.com', // Facebook
    'https://www.google.com', // Google reCAPTCHA
    'https://apis.google.com', // Google APIs
    'https://js.stripe.com', // Stripe
    'https://checkout.stripe.com', // Stripe Checkout
    'https://m.stripe.network', // Stripe
    'https://m.stripe.com', // Stripe
    'https://js.hotjar.com', // Hotjar (if used)
    'https://vitals.vercel-insights.com', // Vercel Analytics
  ].filter(Boolean),

  // Style sources
  'style-src': [
    "'self'",
    "'unsafe-inline'", // For inline styles (Tailwind JIT)
    'https://fonts.googleapis.com', // Google Fonts
    'https://fonts.gstatic.com', // Google Fonts CDN
  ].filter(Boolean),

  // Image sources
  'img-src': [
    "'self'",
    'data:', // Data URIs
    'blob:', // Blob URLs
    'https:',
    'https://maps.googleapis.com', // Google Maps
    'https://maps.gstatic.com', // Google Maps static
    'https://graph.facebook.com', // Facebook images
    'https://*.fbcdn.net', // Facebook CDN
    'https://www.gravatar.com', // Gravatar
    'https://avatars.githubusercontent.com', // GitHub avatars
  ].filter(Boolean),

  // Font sources
  'font-src': [
    "'self'",
    'data:', // Data URIs for fonts
    'https://fonts.googleapis.com', // Google Fonts
    'https://fonts.gstatic.com', // Google Fonts CDN
  ].filter(Boolean),

  // Connect sources (APIs, WebSockets)
  'connect-src': [
    "'self'",
    'wss:', // WebSocket secure
    'https://api.stripe.com', // Stripe API
    'https://connect.facebook.net', // Facebook
    'https://www.facebook.com', // Facebook
    'https://www.google-analytics.com', // Google Analytics
    'https://analytics.google.com', // Google Analytics
    'https://*.supabase.co', // Supabase
    'https://supabase.co', // Supabase
    'https://mariiahub.supabase.co', // Your Supabase instance
  ].filter(Boolean),

  // Frame sources
  'frame-src': [
    "'self'",
    'https://www.googletagmanager.com', // Google Tag Manager iframe
    'https://www.google.com', // Google reCAPTCHA
    'https://js.stripe.com', // Stripe Elements
    'https://checkout.stripe.com', // Stripe Checkout
    'https://www.facebook.com', // Facebook widgets
  ].filter(Boolean),

  // Media sources
  'media-src': [
    "'self'",
    'blob:', // For media uploads
    'https:', // External media
  ].filter(Boolean),

  // Object sources (prevents plugins)
  'object-src': ["'none'"],

  // Base URI (prevents base tag hijacking)
  'base-uri': ["'self'"],

  // Form action
  'form-action': [
    "'self'",
    'https://checkout.stripe.com', // Stripe form
    'https://m.stripe.com', // Stripe mobile
  ].filter(Boolean),

  // Frame ancestors (prevents clickjacking)
  'frame-ancestors': ["'none'"],

  // Report URI (for CSP violations)
  'report-uri': ['/api/csp-report'],

  // Upgrade insecure requests
  'upgrade-insecure-requests': ["1"],
};

// Generate CSP header string
export function generateCSPString(directives = CSP_DIRECTIVES): string {
  return Object.entries(directives)
    .filter(([, sources]) => sources.length > 0)
    .map(([directive, sources]) => `${directive} ${sources.join(' ')}`)
    .join('; ');
}

// Report-only CSP for testing
export const CSP_REPORT_ONLY = generateCSPString({
  ...CSP_DIRECTIVES,
  'script-src': [...CSP_DIRECTIVES['script-src'], "'unsafe-hashes'"],
  'style-src': [...CSP_DIRECTIVES['style-src'], "'unsafe-hashes'"],
});

// Strict CSP for production
export const CSP_STRICT = generateCSPString(CSP_DIRECTIVES);

// Lenient CSP for development
export const CSP_LENIENT = generateCSPString({
  'script-src': [...CSP_DIRECTIVES['script-src'], "'unsafe-eval'"],
  'style-src': [...CSP_DIRECTIVES['style-src'], "'unsafe-inline'"],
});

// Nonce-based CSP for dynamic content
export function generateNonceBasedCSP(nonce: string): string {
  return generateCSPString({
    'script-src': [
      "'self'",
      `'nonce-${nonce}'`,
      'https://www.googletagmanager.com',
      'https://www.google-analytics.com',
      'https://js.stripe.com',
    ],
    'style-src': [
      "'self'",
      `'nonce-${nonce}'`,
      'https://fonts.googleapis.com',
      'https://fonts.gstatic.com',
    ],
  });
}

// CSP for specific routes
export const CSP_ROUTES: Record<string, string> = {
  // Admin pages need more permissions
  admin: generateCSPString({
    ...CSP_DIRECTIVES,
    'script-src': [
      ...CSP_DIRECTIVES['script-src'],
      "'unsafe-eval'", // For admin dashboard features
    ],
    'connect-src': [
      ...CSP_DIRECTIVES['connect-src'],
      'https://api.ipify.org', // IP detection
    ],
  }),

  // Payment pages need Stripe
  payment: generateCSPString({
    ...CSP_DIRECTIVES,
    'frame-src': [
      ...CSP_DIRECTIVES['frame-src'],
      'https://js.stripe.com/v3/',
      'https://checkout.stripe.com/v3/',
      'https://hooks.stripe.com/v3/',
    ],
  }),

  // Booking pages need external APIs
  booking: generateCSPString({
    ...CSP_DIRECTIVES,
    'connect-src': [
      ...CSP_DIRECTIVES['connect-src'],
      'https://api.booksy.com', // Booksy API
      'wss://api.booksy.com', // Booksy WebSocket
    ],
  }),

  // Default CSP for most pages
  default: CSP_STRICT,
};

// Middleware for adding CSP headers (for backend frameworks)
export function addCSPHeaders(request: Request, response: Response, route?: string): void {
  const csp = route ? CSP_ROUTES[route] || CSP_ROUTES.default : CSP_ROUTES.default;

  response.headers.set('Content-Security-Policy', csp);
  response.headers.set('X-Content-Security-Policy', csp); // Fallback

  // Report only in development
  if (import.meta.env.DEV) {
    response.headers.set('Content-Security-Policy-Report-Only', CSP_REPORT_ONLY);
  }
}

// Client-side CSP validation
export function validateCSP(): void {
  const metaCSP = document.querySelector('meta[http-equiv="Content-Security-Policy"]');
  const headerCSP = document.querySelector('meta[http-equiv="X-Content-Security-Policy"]');

  if (!metaCSP && !headerCSP) {
    console.warn('CSP: No Content Security Policy found');
  }

  // Check for common CSP violations
  const scripts = document.querySelectorAll('script');
  scripts.forEach(script => {
    if (script.innerHTML && !script.nonce) {
      console.warn('CSP: Inline script without nonce detected', script);
    }
  });

  const styles = document.querySelectorAll('style');
  styles.forEach(style => {
    if (style.innerHTML && !style.nonce) {
      console.warn('CSP: Inline style without nonce detected', style);
    }
  });
}

// Hook for nonce management
export function useNonce(): string {
  const [nonce, setNonce] = React.useState('');

  React.useEffect(() => {
    // Get nonce from meta tag or generate one
    const metaNonce = document.querySelector('meta[name="csp-nonce"]');
    if (metaNonce) {
      setNonce(metaNonce.getAttribute('content') || '');
    } else {
      // Generate nonce for dynamic content
      const generatedNonce = btoa(Math.random().toString(36).substring(2));
      setNonce(generatedNonce);
    }
  }, []);

  return nonce;
}

// CSP violation reporting
export function setupCSPReporting(): void {
  // Report CSP violations to analytics
  document.addEventListener('securitypolicyviolation', (event) => {
    const violation = {
      blockedURI: event.blockedURI,
      disposition: event.disposition,
      documentURI: event.documentURI,
      effectiveDirective: event.effectiveDirective,
      originalPolicy: event.originalPolicy,
      referrer: event.referrer,
      sample: event.sample,
      sourceFile: event.sourceFile,
      lineNumber: event.lineNumber,
      columnNumber: event.columnNumber,
      statusCode: event.statusCode,
      violatedDirective: event.violatedDirective,
    };

    // Log in development
    if (import.meta.env.DEV) {
      console.error('CSP Violation:', violation);
    }

    // Send to monitoring service
    if (window.gtag) {
      window.gtag('event', 'csp_violation', {
        event_category: 'Security',
        violation_type: violation.violatedDirective,
        blocked_uri: violation.blockedURI,
        nonInteractive: true,
      });
    }

    // Send to custom endpoint
    fetch('/api/csp-report', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(violation),
    }).catch(() => {
      // Ignore reporting errors
    });
  });
}