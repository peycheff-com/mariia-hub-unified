import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { visualizer } from "rollup-plugin-visualizer";
import viteCompression from "vite-plugin-compression";
import { checker } from "vite-plugin-checker";
import crypto from 'node:crypto';
import autoprefixer from 'autoprefixer';
import cssnano from 'cssnano';

// Security configurations
const securityConfig = {
  cspNonce: process.env.VITE_CSP_NONCE_GENERATION === 'true',
  securityHeaders: process.env.VITE_SECURITY_HEADERS_ENABLED === 'true',
  sourceMaps: process.env.VITE_SOURCE_MAP === 'true',
  hmr: process.env.VITE_HMR === 'true',
};

// Security plugin
const securityPlugin = () => ({
  name: 'security-plugin',
  configResolved(config: any) {
    if (process.env.NODE_ENV === 'production') {
      if (!securityConfig.sourceMaps) {
        config.build.sourcemap = false;
      }
      config.build.minify = 'terser';
      config.build.terserOptions = {
        compress: {
          drop_console: true,
          drop_debugger: true,
          pure_funcs: ['console.log', 'console.info', 'console.debug'],
          passes: 2,
        },
        mangle: {
          properties: {
            regex: /^_/,
          },
        },
        format: {
          comments: false,
        },
      };

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
    if (process.env.NODE_ENV === 'production') {
      Object.keys(bundle).forEach(fileName => {
        const chunk = bundle[fileName];
        if (chunk.type === 'chunk') {
          const code = chunk.code;
          const secretPatterns = [
            /sk_[a-zA-Z0-9]{24,}/,
            /[a-zA-Z0-9_-]{40,}=/,
            /["']?[a-zA-Z0-9_-]{50,}["']?/,
          ];
          secretPatterns.forEach(pattern => {
            if (pattern.test(code)) {
              console.warn(`⚠️  Potential secret found in ${fileName}`);
            }
          });
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
    "script-src 'self' 'unsafe-eval'",
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

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  preview: {
    port: 8080,
  },
  // Add history fallback for SPA routing
  publicDir: 'public',
  plugins: [
    react(),
    checker({
      typescript: true,
      eslint: mode === "development"
        ? {
            lintCommand: 'eslint "./src/**/*.{ts,tsx}"',
            useFlatConfig: true,
          }
        : undefined,
    }),
    mode === "development" && componentTagger(),
    mode === "production" && viteCompression({
      algorithm: 'gzip',
      ext: '.gz',
    }),
    mode === "production" && viteCompression({
      algorithm: 'brotliCompress',
      ext: '.br',
    }),
    mode === "production" && visualizer({
      filename: "dist/stats.html",
      open: false,
      gzipSize: true,
      brotliSize: true,
    }),
    securityPlugin(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@/components": path.resolve(__dirname, "./src/components"),
      "@/pages": path.resolve(__dirname, "./src/pages"),
      "@/hooks": path.resolve(__dirname, "./src/hooks"),
      "@/utils": path.resolve(__dirname, "./src/utils"),
      "@/types": path.resolve(__dirname, "./src/types"),
      "@/services": path.resolve(__dirname, "./src/services"),
      "@/stores": path.resolve(__dirname, "./src/stores"),
      "@/contexts": path.resolve(__dirname, "./src/contexts"),
      "@/lib": path.resolve(__dirname, "./src/lib"),
      "@/assets": path.resolve(__dirname, "./src/assets"),
      react: path.resolve(__dirname, "./node_modules/react"),
      "react/jsx-runtime": path.resolve(
        __dirname,
        "./node_modules/react/jsx-runtime"
      ),
      "react/jsx-dev-runtime": path.resolve(
        __dirname,
        "./node_modules/react/jsx-dev-runtime"
      ),
      "react-dom": path.resolve(__dirname, "./node_modules/react-dom"),
    },
    dedupe: ["react", "react-dom"],
  },
  optimizeDeps: {
    include: ["react", "react-dom"],
    force: true,
  },
  build: {
    target: 'esnext',
    rollupOptions: {
      output: {
        // Advanced chunking strategy for performance optimization
        manualChunks: (id) => {
          // Core vendor chunks
          if (id.includes('react') || id.includes('react-dom') || id.includes('react/jsx-runtime')) {
            return 'react-vendor';
          }
          if (id.includes('react-router') || id.includes('@remix-run/router')) {
            return 'router-vendor';
          }
          if (id.includes('@tanstack/react-query')) {
            return 'query-vendor';
          }
          if (id.includes('@radix-ui')) {
            return 'ui-vendor';
          }
          if (id.includes('react-hook-form') || id.includes('@hookform/resolvers') || id.includes('zod')) {
            return 'forms-vendor';
          }
          if (id.includes('clsx') || id.includes('class-variance-authority') || id.includes('tailwind-merge') || id.includes('lucide-react')) {
            return 'utils-vendor';
          }
          if (id.includes('framer-motion') || id.includes('tailwindcss-animate')) {
            return 'animations-vendor';
          }

          // Feature-specific chunks
          if (id.includes('@supabase')) {
            return 'supabase-vendor';
          }
          if (id.includes('react-i18next') || id.includes('i18next')) {
            return 'i18n-vendor';
          }
          if (id.includes('recharts')) {
            return 'charts-vendor';
          }
          if (id.includes('@hello-pangea/dnd')) {
            return 'dnd-vendor';
          }

          // Third-party integrations
          if (id.includes('@stripe')) {
            return 'stripe-vendor';
          }
          if (id.includes('@sentry')) {
            return 'sentry-vendor';
          }
          if (id.includes('web-vitals')) {
            return 'web-vitals-vendor';
          }

          // Admin components - split into smaller chunks for better performance
          if (id.includes('admin/components/analytics') || id.includes('AnalyticsDashboard')) {
            return 'admin-analytics';
          }
          if (id.includes('admin/components/advanced') || id.includes('Advanced')) {
            return 'admin-advanced';
          }
          if (id.includes('admin/components/content') || id.includes('Content') || id.includes('Blog') || id.includes('Media')) {
            return 'admin-content';
          }
          if (id.includes('admin/Booking') || id.includes('booking') || id.includes('Availability') || id.includes('Schedule')) {
            return 'admin-booking';
          }
          if (id.includes('admin/Payment') || id.includes('payment') || id.includes('Pricing')) {
            return 'admin-payment';
          }
          if (id.includes('admin/Communication') || id.includes('Email') || id.includes('Newsletter') || id.includes('WhatsApp')) {
            return 'admin-communication';
          }
          if (id.includes('admin/Analytics') || id.includes('Monitoring') || id.includes('Performance')) {
            return 'admin-monitoring';
          }
          if (id.includes('admin/components') || id.includes('Admin')) {
            return 'admin-core';
          }

          // Booking components - feature chunk
          if (id.includes('booking') || id.includes('Booking')) {
            return 'booking-components';
          }

          // Payment components - feature chunk
          if (id.includes('payment') || id.includes('Payment') || id.includes('stripe')) {
            return 'payment-components';
          }

          // Date utilities
          if (id.includes('date-fns') || id.includes('dayjs')) {
            return 'date-vendor';
          }

          // Large libraries
          if (id.includes('lodash')) {
            return 'lodash-vendor';
          }

  
          // Toast/notification libraries
          if (id.includes('sonner') || id.includes('toast')) {
            return 'toast-vendor';
          }

          // State management
          if (id.includes('zustand') || id.includes('redux') || id.includes('state')) {
            return 'state-vendor';
          }

          // Security/crypto libraries
          if (id.includes('crypto') || id.includes('bcrypt') || id.includes('jwt')) {
            return 'security-vendor';
          }

          // Return undefined for other modules to let Rollup handle them
          return undefined;
        },
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js',
        assetFileNames: (assetInfo) => {
          const info = assetInfo.name?.split('.') || [];
          const extType = info[info.length - 1] || '';

          // Media assets - separate folder for better caching
          if (/\.(mp4|webm|ogg|mp3|wav|flac|aac)(\?.*)?$/i.test(assetInfo.name || '')) {
            return `assets/media/[name]-[hash][extname]`;
          }

          // Image assets - separate folder with optimization
          if (/\.(png|jpe?g|gif|svg|webp|avif)(\?.*)?$/i.test(assetInfo.name || '')) {
            return `assets/images/[name]-[hash][extname]`;
          }

          // Font assets - separate folder for better caching
          if (/\.(woff2?|eot|ttf|otf)(\?.*)?$/i.test(assetInfo.name || '')) {
            return `assets/fonts/[name]-[hash][extname]`;
          }

          // Service worker and manifest - root level
          if (assetInfo.name?.includes('sw.js') || assetInfo.name?.includes('manifest')) {
            return `[name]-[hash][extname]`;
          }

          return `assets/[name]-[hash][extname]`;
        },
      },
      external: (id) => {
        // Exclude Node.js built-in modules from client bundle
        return [
          'fs', 'path', 'url', 'util', 'events', 'stream', 'crypto',
          'net', 'tls', 'dns', 'http', 'https', 'zlib', 'os'
        ].includes(id);
      },
    },
    chunkSizeWarningLimit: 500, // Reduced to 500KB for better performance
    minify: 'terser', // Use Terser for better optimization
    sourcemap: mode === 'development',
    cssCodeSplit: true,
    reportCompressedSize: true, // Enable for bundle analysis
    terserOptions: {
      compress: {
        drop_console: mode === 'production',
        drop_debugger: mode === 'production',
        pure_funcs: mode === 'production' ? ['console.log', 'console.info'] : [],
      },
      mangle: {
        safari10: true,
      },
    },
  },
  esbuild: {
    target: 'esnext',
  },
  define: {
    __SECURITY_HEADERS_ENABLED__: JSON.stringify(securityConfig.securityHeaders),
    __CSP_NONCE_GENERATION__: JSON.stringify(securityConfig.cspNonce),
    __PRODUCTION__: JSON.stringify(mode === "production"),
  },
  css: {
    postcss: {
      plugins: [
        autoprefixer,
        ...(mode === "production" ? [cssnano({ preset: 'default' })] : []),
      ],
    },
  },
  envPrefix: ['VITE_', 'STRIPE_', 'RESEND_', 'GOOGLE_'],
  preview: {
    port: 8080,
    ...(mode === "production" ? {
      port: 4173,
      host: false,
      headers: {
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'DENY',
        'X-XSS-Protection': '1; mode=block',
        'Referrer-Policy': 'strict-origin-when-cross-origin',
        'Content-Security-Policy': getDefaultCSP(),
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    } : {}),
  },
}));
