/**
 * Production Security Build Configuration
 *
 * This file extends the main Vite configuration with production-specific
 * security enhancements, optimizations, and validations.
 */

import crypto from 'node:crypto';

import autoprefixer from 'autoprefixer';
import cssnano from 'cssnano';
import { defineConfig } from 'vite';

// Import security validation
import './scripts/security-build-validation.cjs';

// Security configurations
const securityConfig = {
  // CSP nonce generation for inline scripts/styles
  cspNonce: process.env.VITE_CSP_NONCE_GENERATION === 'true',

  // Security headers configuration
  securityHeaders: process.env.VITE_SECURITY_HEADERS_ENABLED === 'true',

  // Source maps should be disabled in production
  sourceMaps: process.env.VITE_SOURCE_MAP === 'true',

  // Development features must be disabled in production
  hmr: process.env.VITE_HMR === 'true',
};

// Production-specific security plugin
const securityPlugin = () => ({
  name: 'security-plugin',
  configResolved(config: any) {
    // Ensure production environment
    if (process.env.NODE_ENV === 'production') {

      // Disable source maps in production for security
      if (!securityConfig.sourceMaps) {
        config.build.sourcemap = false;
      }

      // Ensure proper optimization
      config.build.minify = 'terser';
      config.build.terserOptions = {
        compress: {
          drop_console: true, // Remove console.log statements
          drop_debugger: true, // Remove debugger statements
        },
        mangle: {
          // Additional obfuscation for sensitive variable names
          properties: {
            regex: /^_/,
          },
        },
      };

      // Enhanced asset optimization
      config.build.rollupOptions.output = {
        ...config.build.rollupOptions.output,
        // Additional security for asset naming
        assetFileNames: (assetInfo: any) => {
          const hash = crypto.randomBytes(8).toString('hex');
          if (/\.(mp4|webm|ogg|mp3|wav|flac|aac)(\?.*)?$/i.test(assetInfo.name || '')) {
            return `assets/media/${hash}[extname]`;
          }
          if (/\.(png|jpe?g|gif|svg|webp|avif)(\?.*)?$/i.test(assetInfo.name || '')) {
            return `assets/images/${hash}[extname]`;
          }
          if (/\.(woff2?|eot|ttf|otf)(\?.*)?$/i.test(assetInfo.name || '')) {
            return `assets/fonts/${hash}[extname]`;
          }
          return `assets/${hash}[extname]`;
        },
      };

      // Add security headers to preview server
      if (config.server) {
        config.server.headers = {
          'X-Content-Type-Options': 'nosniff',
          'X-Frame-Options': 'DENY',
          'X-XSS-Protection': '1; mode=block',
          'Referrer-Policy': 'strict-origin-when-cross-origin',
          'Content-Security-Policy': getDefaultCSP(),
        };
      }
    }
  },
  generateBundle(options: any, bundle: any) {
    // Validate bundle for security issues
    if (process.env.NODE_ENV === 'production') {
      Object.keys(bundle).forEach(fileName => {
        const chunk = bundle[fileName];

        if (chunk.type === 'chunk') {
          const code = chunk.code;

          // Check for potential secrets in bundle
          const secretPatterns = [
            /sk_[a-zA-Z0-9]{24,}/, // Stripe secret keys
            /[a-zA-Z0-9_-]{40,}=/, // Base64 encoded secrets
            /["']?[a-zA-Z0-9_-]{50,}["']?/, // Long strings that might be API keys
          ];

          secretPatterns.forEach(pattern => {
            if (pattern.test(code)) {
              console.warn(`⚠️  Potential secret found in ${fileName}`);
            }
          });

          // Check for development-only code
          if (code.includes('console.log') || code.includes('debugger')) {
            console.warn(`⚠️  Development code found in ${fileName}`);
          }
        }
      });
    }
  },
});

// Get default CSP policy
function getDefaultCSP(): string {
  const directives = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-eval'", // Remove 'unsafe-inline' in production
    "style-src 'self' 'unsafe-inline' fonts.googleapis.com",
    "img-src 'self' data: blob: https://*.supabase.co https://*.stripe.com",
    "font-src 'self' fonts.gstatic.com",
    "connect-src 'self' https://*.supabase.co https://api.stripe.com",
    "media-src 'self'",
    "object-src 'none'",
    "frame-src 'none'",
    "child-src 'self'",
    "worker-src 'self' blob:",
    "manifest-src 'self'",
    "base-uri 'self'",
    "form-action 'self' https://js.stripe.com",
    "frame-ancestors 'none'",
    "upgrade-insecure-requests",
    "block-all-mixed-content",
  ];

  return directives.join('; ');
}

// Extend main configuration with security enhancements
export default defineConfig(async ({ mode }) => {
  const baseConfigFactory = (await import('./vite.config')).default;
  const baseConfig = baseConfigFactory({ mode });
  const isProduction = mode === 'production';

  const baseBuild = baseConfig.build ?? {};
  const baseRollupOptions = baseBuild.rollupOptions ?? {};
  const baseRollupOutput = Array.isArray(baseRollupOptions.output) ? baseRollupOptions.output : (baseRollupOptions.output ?? {});
  const baseManualChunks = !Array.isArray(baseRollupOutput) && typeof baseRollupOutput === 'object'
    ? (baseRollupOutput as Record<string, any>).manualChunks ?? {}
    : {};

  const enhancedRollupOutput = Array.isArray(baseRollupOutput)
    ? baseRollupOutput
    : {
        ...baseRollupOutput,
        manualChunks: {
          ...baseManualChunks,
          'third-party': [
            '@supabase/supabase-js',
            '@stripe/react-stripe-js',
            '@stripe/stripe-js',
            '@sentry/react',
            'react-i18next',
          ],
          analytics: ['web-vitals'],
        },
      };

  return {
    // Include all main configuration
    ...baseConfig,

    // Add security-specific configurations
    plugins: [
      ...(baseConfig.plugins || []),
      securityPlugin(),
    ],

    // Production-specific security enhancements
    ...(isProduction ? {
      // Enhanced security for production builds
      define: {
        ...(baseConfig.define || {}),
        // Add security flags
        __SECURITY_MODE__: JSON.stringify(true),
        __PRODUCTION__: JSON.stringify(true),
      },

      // Enhanced build optimizations
      build: {
        ...baseBuild,

        // Security-focused build settings
        target: 'es2020', // Modern browsers only for better security
        minify: 'terser',
        sourcemap: false, // Always disabled in production

        // Terser security options
        terserOptions: {
          compress: {
            drop_console: true,
            drop_debugger: true,
            pure_funcs: ['console.log', 'console.info', 'console.debug'],
            passes: 2, // Multiple passes for better compression
          },
          mangle: {
            properties: {
              regex: /^_/, // Mangle private properties
            },
          },
          format: {
            comments: false, // Remove all comments
          },
        },

        // Enhanced chunk splitting for security
        rollupOptions: {
          ...baseRollupOptions,
          output: enhancedRollupOutput,
        },

        // Asset security
        assetsInlineLimit: 4096, // Smaller inline limit for security
        chunkSizeWarningLimit: 500, // Smaller chunks for better caching

        // Report compression for monitoring
        reportCompressedSize: true,

        // CSS security
        cssCodeSplit: true,
        cssMinify: true,
      },

      // Preview server security
      preview: {
        ...(baseConfig.preview || {}),
        port: 4173,
        host: false, // Don't expose preview server externally

        // Security headers for preview
        headers: {
          ...(baseConfig.preview?.headers || {}),
          'X-Content-Type-Options': 'nosniff',
          'X-Frame-Options': 'DENY',
          'X-XSS-Protection': '1; mode=block',
          'Referrer-Policy': 'strict-origin-when-cross-origin',
          'Content-Security-Policy': getDefaultCSP(),
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
        },
      },

      // Environment security
      envPrefix: Array.from(new Set([...(Array.isArray(baseConfig.envPrefix) ? baseConfig.envPrefix : []), 'VITE_', 'STRIPE_', 'RESEND_', 'GOOGLE_'])),

      // CSS security
      css: {
        ...(baseConfig.css || {}),
        postcss: {
          ...(baseConfig.css?.postcss || {}),
          plugins: [
            // Add PostCSS security plugins
            ...(baseConfig.css?.postcss?.plugins || []),
            autoprefixer,
            cssnano({
              preset: 'default',
            }),
          ],
        },
      },

      // Optimized dependencies for security
      optimizeDeps: {
        ...(baseConfig.optimizeDeps || {}),
        include: [
          ...(baseConfig.optimizeDeps?.include || []),
          'react',
          'react-dom',
          'react-router-dom',
        ],
        exclude: [
          // Exclude potentially insecure dependencies
          ...(baseConfig.optimizeDeps?.exclude || []),
          'eval',
          'function',
        ],
      },

    } : {}),

    // Global constants for security
    define: {
      ...(baseConfig.define || {}),
      // Security flags
      __SECURITY_HEADERS_ENABLED__: JSON.stringify(securityConfig.securityHeaders),
      __CSP_NONCE_GENERATION__: JSON.stringify(securityConfig.cspNonce),
      __PRODUCTION__: JSON.stringify(isProduction),
    },
  };
});

// Export security configuration for use in other parts of the application
export { securityConfig, getDefaultCSP };
