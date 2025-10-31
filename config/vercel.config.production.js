/**
 * Vercel Edge Configuration for Production
 * Optimized for global distribution and performance
 */

export const config = {
  // Edge middleware for geo-routing and A/B testing
  middleware: [
    {
      path: '/api/(.*)',
      edge: {
        regions: ['iad1', 'fra1', 'hnd1'], // US East, EU Central, Asia Pacific
        memory: 512,
        maxDuration: 30,
      },
    },
    {
      path: '/admin/(.*)',
      edge: {
        regions: ['iad1', 'fra1'], // Admin limited to US/EU for security
        memory: 1024,
        maxDuration: 60,
      },
    },
  ],

  // Advanced caching strategy
  cache: {
    // Static assets - aggressive caching
    '/assets/(.*)': {
      maxAge: 365 * 24 * 60 * 60, // 1 year
      immutable: true,
      edge: true,
    },

    // API responses - moderate caching
    '/api/services': {
      maxAge: 300, // 5 minutes
      staleWhileRevalidate: 150,
      edge: true,
    },

    '/api/availability': {
      maxAge: 60, // 1 minute
      staleWhileRevalidate: 30,
      edge: true,
    },

    // Images - CDN caching
    '/images/(.*)': {
      maxAge: 30 * 24 * 60 * 60, // 30 days
      staleWhileRevalidate: 7 * 24 * 60 * 60, // 7 days
      edge: true,
    },
  },

  // Security headers
  security: {
    headers: {
      'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'X-XSS-Protection': '1; mode=block',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'Permissions-Policy': 'geolocation=(), microphone=(), camera=(), payment=(self)',
    },
  },

  // Compression settings
  compression: {
    enabled: true,
    algorithms: ['gzip', 'brotli'],
    threshold: 1024, // Only compress files > 1KB
  },

  // Performance optimization
  performance: {
    minify: true,
    treeshaking: true,
    codeSplitting: true,
    lazyLoading: true,
    bundleAnalysis: true,
  },
};

export default config;