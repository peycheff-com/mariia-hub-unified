/**
 * CDN Configuration and Asset Optimization
 * Implements CDN setup, caching strategies, and asset optimization
 */

export interface CDNConfig {
  provider: 'cloudflare' | 'cloudfront' | 'fastly' | 'netlify';
  domain: string;
  cacheRules: CacheRule[];
  compression: CompressionConfig;
  optimization: OptimizationConfig;
}

export interface CacheRule {
  pattern: string;
  ttl: number; // Time to live in seconds
  browserTTL?: number;
  mustRevalidate?: boolean;
  immutable?: boolean;
}

export interface CompressionConfig {
  enabled: boolean;
  level: number; // 1-9
  brotli: boolean;
  gzip: boolean;
  mimeTypes: string[];
}

export interface OptimizationConfig {
  imageOptimization: {
    enabled: boolean;
    formats: ['webp', 'avif', 'auto'];
    quality: number;
    placeholder: 'blur' | 'low-quality' | 'none';
    lazyLoading: boolean;
  };
  minification: {
    html: boolean;
    css: boolean;
    js: boolean;
  };
  bundling: {
    chunking: boolean;
    treeShaking: boolean;
    codeSplitting: boolean;
  };
}

export const CDN_CONFIG: CDNConfig = {
  provider: 'cloudflare',
  domain: 'cdn.mariia-hub.com',
  cacheRules: [
    // Static assets - long cache
    {
      pattern: '/assets/*',
      ttl: 31536000, // 1 year
      browserTTL: 86400, // 1 day
      immutable: true
    },
    // Images - medium cache
    {
      pattern: '/images/*',
      ttl: 2592000, // 30 days
      browserTTL: 86400, // 1 day
      mustRevalidate: true
    },
    // API responses - short cache
    {
      pattern: '/api/*',
      ttl: 300, // 5 minutes
      browserTTL: 60, // 1 minute
      mustRevalidate: true
    },
    // HTML pages - very short cache
    {
      pattern: '*.html',
      ttl: 3600, // 1 hour
      browserTTL: 300, // 5 minutes
      mustRevalidate: true
    },
    // Service Worker - special handling
    {
      pattern: '/sw.js',
      ttl: 0, // No cache
      browserTTL: 0,
      mustRevalidate: true
    },
    // Manifest file
    {
      pattern: '/manifest.json',
      ttl: 86400, // 1 day
      browserTTL: 3600, // 1 hour
      mustRevalidate: true
    }
  ],
  compression: {
    enabled: true,
    level: 6,
    brotli: true,
    gzip: true,
    mimeTypes: [
      'text/html',
      'text/css',
      'text/javascript',
      'application/javascript',
      'application/json',
      'application/xml',
      'text/xml',
      'image/svg+xml',
      'font/woff',
      'font/woff2'
    ]
  },
  optimization: {
    imageOptimization: {
      enabled: true,
      formats: ['webp', 'avif', 'auto'],
      quality: 85,
      placeholder: 'blur',
      lazyLoading: true
    },
    minification: {
      html: true,
      css: true,
      js: true
    },
    bundling: {
      chunking: true,
      treeShaking: true,
      codeSplitting: true
    }
  }
};

/**
 * CDN Manager Class
 */
export class CDNManager {
  private static instance: CDNManager;
  private config: CDNConfig;
  private cache: Map<string, CacheEntry> = new Map();

  private constructor(config: CDNConfig) {
    this.config = config;
  }

  static getInstance(config?: CDNConfig): CDNManager {
    if (!CDNManager.instance) {
      CDNManager.instance = new CDNManager(config || CDN_CONFIG);
    }
    return CDNManager.instance;
  }

  /**
   * Get CDN URL for an asset
   */
  getAssetUrl(path: string, options?: {
    width?: number;
    height?: number;
    quality?: number;
    format?: 'webp' | 'avif' | 'auto';
  }): string {
    const basePath = path.startsWith('/') ? path.slice(1) : path;
    let url = `https://${this.config.domain}/${basePath}`;

    // Add image transformation parameters
    if (options && this.isImagePath(path)) {
      const params = new URLSearchParams();

      if (options.width) params.set('w', options.width.toString());
      if (options.height) params.set('h', options.height.toString());
      if (options.quality) params.set('q', options.quality.toString());
      if (options.format) params.set('f', options.format);

      if (params.toString()) {
        url += '?' + params.toString();
      }
    }

    return url;
  }

  /**
   * Preload critical assets
   */
  preloadAssets(assets: string[]): void {
    assets.forEach(asset => {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.href = this.getAssetUrl(asset);

      if (asset.endsWith('.css')) {
        link.as = 'style';
      } else if (asset.endsWith('.js')) {
        link.as = 'script';
      } else if (this.isImagePath(asset)) {
        link.as = 'image';
      }

      document.head.appendChild(link);
    });
  }

  /**
   * Prefetch assets for next navigation
   */
  prefetchAssets(assets: string[]): void {
    assets.forEach(asset => {
      const link = document.createElement('link');
      link.rel = 'prefetch';
      link.href = this.getAssetUrl(asset);
      document.head.appendChild(link);
    });
  }

  /**
   * Generate service worker with caching strategies
   */
  generateServiceWorker(): string {
    const cacheRules = this.config.cacheRules.map(rule => {
      return {
        pattern: rule.pattern,
        strategy: rule.immutable ? 'CacheFirst' :
                 rule.ttl > 3600 ? 'CacheFirst' : 'StaleWhileRevalidate',
        cacheName: this.getCacheName(rule.pattern),
        expiration: rule.ttl
      };
    });

    return `
// Generated Service Worker for Mariia Hub
const CACHE_NAME = 'mariia-hub-v1';
const RUNTIME_CACHE = 'mariia-hub-runtime';

const cacheRules = ${JSON.stringify(cacheRules, null, 2)};

// Install event - cache static assets
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll([
        ${this.getStaticAssets().map(asset => `'${this.getAssetUrl(asset)}'`).join(',\n        ')}
      ]))
  );
});

// Activate event - clean old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(cacheNames => {
        return Promise.all(
          cacheNames
            .filter(name => name.startsWith('mariia-hub-') && name !== CACHE_NAME)
            .map(name => caches.delete(name))
        );
      })
  );
});

// Fetch event - implement caching strategies
self.addEventListener('fetch', event => {
  const request = event.request;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') return;

  // Skip external requests
  if (!url.origin.includes('mariia-hub.com')) return;

  // Find matching cache rule
  const rule = cacheRules.find(r => {
    const regex = new RegExp(r.pattern.replace('*', '.*'));
    return regex.test(url.pathname);
  });

  if (rule) {
    event.respondWith(handleRequest(request, rule));
  }
});

async function handleRequest(request, rule) {
  const cache = await caches.open(RUNTIME_CACHE);

  switch (rule.strategy) {
    case 'CacheFirst':
      return cacheFirst(request, cache, rule.expiration);
    case 'StaleWhileRevalidate':
      return staleWhileRevalidate(request, cache);
    case 'NetworkFirst':
      return networkFirst(request, cache);
    default:
      return fetch(request);
  }
}

async function cacheFirst(request, cache, maxAge) {
  const cached = await cache.match(request);

  if (cached && !isExpired(cached, maxAge)) {
    return cached;
  }

  try {
    const response = await fetch(request);
    if (response.ok) {
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    return cached || new Response('Offline', { status: 503 });
  }
}

async function staleWhileRevalidate(request, cache) {
  const cached = await cache.match(request);
  const fetchPromise = fetch(request).then(response => {
    if (response.ok) {
      cache.put(request, response.clone());
    }
    return response;
  });

  return cached || fetchPromise;
}

async function networkFirst(request, cache) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    const cached = await cache.match(request);
    return cached || new Response('Offline', { status: 503 });
  }
}

function isExpired(response, maxAge) {
  const date = response.headers.get('date');
  if (!date) return true;

  const responseTime = new Date(date).getTime();
  const now = Date.now();
  return (now - responseTime) > (maxAge * 1000);
}
`;
  }

  /**
   * Optimize images with srcset generation
   */
  generateImageSrcset(basePath: string, sizes: number[]): string {
    return sizes
      .map(size => `${this.getAssetUrl(basePath, { width: size })} ${size}w`)
      .join(', ');
  }

  /**
   * Generate critical CSS inliner
   */
  inlineCriticalCSS(html: string, criticalCSS: string): string {
    return html.replace(
      '</head>',
      `<style id="critical-css">${criticalCSS}</style></head>`
    );
  }

  /**
   * Setup resource hints
   */
  setupResourceHints(): void {
    // DNS prefetch for external domains
    const domains = [
      'fonts.googleapis.com',
      'fonts.gstatic.com',
      'cdn.supabase.co',
      'js.stripe.com',
      'www.google-analytics.com'
    ];

    domains.forEach(domain => {
      const link = document.createElement('link');
      link.rel = 'dns-prefetch';
      link.href = `//${domain}`;
      document.head.appendChild(link);
    });

    // Preconnect for critical domains
    const criticalDomains = ['fonts.googleapis.com', 'cdn.supabase.co'];

    criticalDomains.forEach(domain => {
      const link = document.createElement('link');
      link.rel = 'preconnect';
      link.href = `https://${domain}`;
      link.crossOrigin = 'anonymous';
      document.head.appendChild(link);
    });
  }

  /**
   * Monitor cache performance
   */
  monitorCachePerformance(): void {
    if ('PerformanceObserver' in window) {
      const observer = new PerformanceObserver((list) => {
        list.getEntries().forEach((entry) => {
          if (entry.entryType === 'resource') {
            const resource = entry as PerformanceResourceTiming;

            // Check if resource was served from cache
            const cacheHit = resource.transferSize === 0;

            // Log cache performance
            console.log('Cache Performance:', {
              url: resource.name,
              cacheHit,
              duration: resource.duration,
              size: resource.transferSize
            });
          }
        });
      });

      observer.observe({ entryTypes: ['resource'] });
    }
  }

  /**
   * Warm up cache with critical resources
   */
  async warmupCache(): Promise<void> {
    const criticalUrls = [
      '/',
      '/api/services',
      '/api/availability',
      ...this.getStaticAssets().map(asset => this.getAssetUrl(asset))
    ];

    try {
      await Promise.all(
        criticalUrls.map(url => fetch(url, { cache: 'force-cache' }))
      );
      console.log('Cache warmed up successfully');
    } catch (error) {
      console.error('Cache warmup failed:', error);
    }
  }

  /**
   * Clear cache for specific pattern
   */
  async clearCache(pattern: string): Promise<void> {
    if ('caches' in window && window.serviceWorker) {
      const cacheNames = await caches.keys();
      const relevantCaches = cacheNames.filter(name =>
        name.includes('mariia-hub')
      );

      await Promise.all(
        relevantCaches.map(async cacheName => {
          const cache = await caches.open(cacheName);
          const requests = await cache.keys();
          const matchingRequests = requests.filter(request =>
            request.url.includes(pattern)
          );

          await Promise.all(
            matchingRequests.map(request => cache.delete(request))
          );
        })
      );
    }
  }

  /**
   * Get cache statistics
   */
  async getCacheStats(): Promise<any> {
    if ('caches' in window) {
      const cacheNames = await caches.keys();
      const stats = {};

      for (const name of cacheNames) {
        const cache = await caches.open(name);
        const requests = await cache.keys();
        stats[name] = {
          entries: requests.length,
          size: await this.calculateCacheSize(cache)
        };
      }

      return stats;
    }
    return null;
  }

  // Private helper methods
  private isImagePath(path: string): boolean {
    return /\.(jpg|jpeg|png|gif|webp|avif|svg)$/i.test(path);
  }

  private getCacheName(pattern: string): string {
    return pattern.replace(/[^a-z0-9]/gi, '-').toLowerCase();
  }

  private getStaticAssets(): string[] {
    return [
      '/assets/main.css',
      '/assets/main.js',
      '/assets/fonts/inter.woff2',
      '/assets/logo.svg',
      '/manifest.json'
    ];
  }

  private async calculateCacheSize(cache: Cache): Promise<number> {
    const requests = await cache.keys();
    let totalSize = 0;

    for (const request of requests) {
      const response = await cache.match(request);
      if (response) {
        const text = await response.text();
        totalSize += new Blob([text]).size;
      }
    }

    return totalSize;
  }
}

interface CacheEntry {
  url: string;
  timestamp: number;
  ttl: number;
}

export const cdnManager = CDNManager.getInstance();

/**
 * Initialize CDN features
 */
export function initializeCDN() {
  // Setup resource hints
  cdnManager.setupResourceHints();

  // Monitor cache performance
  cdnManager.monitorCachePerformance();

  // Warm up cache
  if (import.meta.env.PROD) {
    cdnManager.warmupCache();
  }

  console.log('CDN initialized');
}

/**
 * Export utility for use in components
 */
export function useCDN() {
  return {
    getAssetUrl: cdnManager.getAssetUrl.bind(cdnManager),
    preloadAssets: cdnManager.preloadAssets.bind(cdnManager),
    prefetchAssets: cdnManager.prefetchAssets.bind(cdnManager),
    generateImageSrcset: cdnManager.generateImageSrcset.bind(cdnManager),
    clearCache: cdnManager.clearCache.bind(cdnManager),
    getCacheStats: cdnManager.getCacheStats.bind(cdnManager)
  };
}