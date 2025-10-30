/**
 * Advanced Mobile Asset Optimization System
 * for luxury beauty and fitness booking platform
 *
 * Provides intelligent image and asset optimization based on
 * device capabilities, network conditions, and user context
 */

import { mobilePerformanceOptimizer, NetworkQuality, DevicePerformanceTier } from './mobile-performance-optimizer';
import { trackRUMEvent } from '../rum';

// Asset optimization configuration
interface AssetOptimizationConfig {
  // Image optimization
  images: {
    formats: ('auto' | 'webp' | 'avif' | 'jpeg' | 'png')[];
    quality: {
      excellent: number;    // Network: Excellent
      good: number;         // Network: Good
      moderate: number;     // Network: Moderate
      slow: number;         // Network: Slow
    };
    sizes: {
      mobile: { max: number; breakpoints: number[] };
      tablet: { max: number; breakpoints: number[] };
      desktop: { max: number; breakpoints: number[] };
    };
    compression: {
      aggressive: boolean;   // For slow networks
      progressive: boolean;  // Progressive JPEG
      adaptive: boolean;     // Adaptive quality based on content
    };
    lazy: {
      enabled: boolean;
      threshold: number;     // Viewport margin in pixels
      placeholder: 'blur' | 'color' | 'low-quality' | 'none';
      fadeIn: boolean;
    };
  };

  // Font optimization
  fonts: {
    display: 'swap' | 'fallback' | 'optional' | 'block';
    preload: boolean;
    subset: boolean;        // Only load needed characters
    variable: boolean;      // Use variable fonts when possible
    compression: boolean;   // WOFF2 compression
  };

  // Video optimization
  videos: {
    formats: ('mp4' | 'webm' | 'hls')[];
    quality: {
      high: { resolution: string; bitrate: number };
      medium: { resolution: string; bitrate: number };
      low: { resolution: string; bitrate: number };
    };
    adaptive: boolean;      // Adaptive bitrate streaming
    autoplay: boolean;
    muted: boolean;
    loop: boolean;
  };

  // JavaScript/CSS optimization
  scripts: {
    minify: boolean;
    bundle: boolean;
    split: boolean;
    treeShake: boolean;
    deferNonCritical: boolean;
    asyncThirdParty: boolean;
  };

  styles: {
    minify: boolean;
    criticalCSS: boolean;
    split: boolean;
    purgeUnused: boolean;
    preloadCritical: boolean;
  };

  // Caching strategy
  caching: {
    staticAssets: number;   // Cache duration in seconds
    apiResponses: number;   // Cache duration in seconds
    images: number;         // Cache duration in seconds
    fonts: number;          // Cache duration in seconds
    serviceWorker: boolean;
  };
}

// Optimized asset configuration
interface OptimizedAssetConfig {
  type: 'image' | 'font' | 'video' | 'script' | 'style';
  url: string;
  optimizedUrl: string;
  format: string;
  quality: number;
  size: number;
  compressionRatio: number;
  loadingStrategy: 'eager' | 'lazy' | 'preload';
  cacheStrategy: string;
  deviceOptimizations: string[];
  networkOptimizations: string[];
}

// Image optimization request
interface ImageOptimizationRequest {
  src: string;
  width?: number;
  height?: number;
  quality?: number;
  format?: string;
  devicePixelRatio?: number;
  crop?: string;
  gravity?: string;
  blur?: number;
  sharpen?: boolean;
}

// Asset performance metrics
interface AssetPerformanceMetrics {
  url: string;
  type: string;
  originalSize: number;
  optimizedSize: number;
  compressionRatio: number;
  loadTime: number;
  cacheHit: boolean;
  networkSavings: number;
  userSatisfaction: number;
}

class MobileAssetOptimizer {
  private static instance: MobileAssetOptimizer;
  private isInitialized = false;
  private config: AssetOptimizationConfig;
  private optimizedAssets: Map<string, OptimizedAssetConfig> = new Map();
  private performanceMetrics: AssetPerformanceMetrics[] = [];
  private imageObserver?: IntersectionObserver;
  private assetCache: Map<string, any> = new Map();
  private networkQuality: NetworkQuality = NetworkQuality.MODERATE;
  private deviceTier: DevicePerformanceTier = DevicePerformanceTier.MEDIUM;

  private constructor() {
    this.config = this.getDefaultConfig();
  }

  static getInstance(): MobileAssetOptimizer {
    if (!MobileAssetOptimizer.instance) {
      MobileAssetOptimizer.instance = new MobileAssetOptimizer();
    }
    return MobileAssetOptimizer.instance;
  }

  // Initialize the asset optimizer
  initialize(config: Partial<AssetOptimizationConfig> = {}): void {
    if (this.isInitialized) return;

    this.config = { ...this.config, ...config };

    try {
      this.initializeImageOptimization();
      this.initializeFontOptimization();
      this.initializeVideoOptimization();
      this.initializeScriptOptimization();
      this.initializeStyleOptimization();
      this.initializeCachingStrategy();
      this.initializePerformanceMonitoring();
      this.initializeAdaptiveOptimization();

      this.isInitialized = true;
      console.log('[Mobile Asset Optimizer] Advanced asset optimization initialized');

      // Apply optimizations to existing assets
      this.optimizeExistingAssets();

      trackRUMEvent('mobile-asset-optimizer-initialized', {
        config: this.config,
        timestamp: Date.now()
      });
    } catch (error) {
      console.warn('[Mobile Asset Optimizer] Failed to initialize:', error);
    }
  }

  // Get default configuration
  private getDefaultConfig(): AssetOptimizationConfig {
    return {
      images: {
        formats: ['auto', 'webp', 'avif', 'jpeg'],
        quality: {
          excellent: 90,
          good: 80,
          moderate: 65,
          slow: 45
        },
        sizes: {
          mobile: { max: 800, breakpoints: [320, 480, 768] },
          tablet: { max: 1200, breakpoints: [768, 1024, 1200] },
          desktop: { max: 2000, breakpoints: [1200, 1600, 2000] }
        },
        compression: {
          aggressive: true,
          progressive: true,
          adaptive: true
        },
        lazy: {
          enabled: true,
          threshold: 50,
          placeholder: 'blur',
          fadeIn: true
        }
      },
      fonts: {
        display: 'swap',
        preload: true,
        subset: true,
        variable: true,
        compression: true
      },
      videos: {
        formats: ['mp4', 'webm', 'hls'],
        quality: {
          high: { resolution: '1080p', bitrate: 5000 },
          medium: { resolution: '720p', bitrate: 2500 },
          low: { resolution: '480p', bitrate: 1000 }
        },
        adaptive: true,
        autoplay: false,
        muted: true,
        loop: false
      },
      scripts: {
        minify: true,
        bundle: true,
        split: true,
        treeShake: true,
        deferNonCritical: true,
        asyncThirdParty: true
      },
      styles: {
        minify: true,
        criticalCSS: true,
        split: true,
        purgeUnused: true,
        preloadCritical: true
      },
      caching: {
        staticAssets: 2592000,    // 30 days
        apiResponses: 300,        // 5 minutes
        images: 604800,           // 7 days
        fonts: 2592000,           // 30 days
        serviceWorker: true
      }
    };
  }

  // Initialize image optimization
  private initializeImageOptimization(): void {
    if (this.config.images.lazy.enabled) {
      this.setupLazyLoading();
    }

    // Create image optimization styles
    this.createImageOptimizationStyles();

    // Setup responsive image handling
    this.setupResponsiveImages();

    // Initialize progressive image loading
    this.initializeProgressiveLoading();
  }

  // Setup lazy loading
  private setupLazyLoading(): void {
    this.imageObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target as HTMLImageElement;
          this.loadLazyImage(img);
          this.imageObserver!.unobserve(img);
        }
      });
    }, {
      rootMargin: `${this.config.images.lazy.threshold}px`,
      threshold: 0.1
    });

    // Observe existing images with data-src
    document.querySelectorAll('img[data-src]').forEach(img => {
      this.imageObserver!.observe(img);
    });
  }

  // Load lazy image
  private loadLazyImage(img: HTMLImageElement): void {
    const src = img.getAttribute('data-src');
    if (!src) return;

    const startTime = performance.now();

    // Create optimized image URL
    const optimizedUrl = this.optimizeImageUrl(src, {
      width: img.naturalWidth || img.width,
      height: img.naturalHeight || img.height,
      quality: this.getOptimalImageQuality()
    });

    // Load image with fade-in effect
    if (this.config.images.lazy.fadeIn) {
      img.style.opacity = '0';
      img.style.transition = 'opacity 0.3s ease-in-out';
    }

    img.onload = () => {
      const loadTime = performance.now() - startTime;

      if (this.config.images.lazy.fadeIn) {
        img.style.opacity = '1';
      }

      img.classList.add('loaded');

      this.recordAssetPerformance({
        url: src,
        type: 'image',
        originalSize: 0, // Would be measured from server response
        optimizedSize: 0, // Would be measured from server response
        compressionRatio: 0,
        loadTime,
        cacheHit: false,
        networkSavings: 0,
        userSatisfaction: this.calculateUserSatisfaction(loadTime, 'image')
      });

      trackRUMEvent('mobile-image-loaded', {
        src,
        optimizedUrl,
        loadTime,
        timestamp: Date.now()
      });
    };

    img.onerror = () => {
      console.warn(`Failed to load optimized image: ${optimizedUrl}`);
      // Fallback to original image
      img.src = src;
    };

    img.src = optimizedUrl;
    img.removeAttribute('data-src');
  }

  // Create image optimization styles
  private createImageOptimizationStyles(): void {
    const style = document.createElement('style');
    style.textContent = `
      /* Mobile Asset Optimizer - Image Optimizations */
      img {
        max-width: 100%;
        height: auto;
        object-fit: cover;
      }

      img[data-src] {
        background-color: #f0f0f0;
        transition: opacity 0.3s ease-in-out;
      }

      img.loaded {
        opacity: 1;
      }

      .image-placeholder {
        filter: blur(5px);
        transform: scale(1.05);
        transition: filter 0.3s ease, transform 0.3s ease;
      }

      .image-placeholder.loaded {
        filter: blur(0);
        transform: scale(1);
      }

      ${this.config.images.compression.progressive ? `
        .progressive-image {
          background-image: url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMSIgaGVpZ2h0PSIxIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxyZWN0IHdpZHRoPSIxIiBoZWlnaHQ9MSIgZmlsbD0iI2YwZjBmMCIvPjwvc3ZnPg==');
          background-size: cover;
        }
      ` : ''}

      ${this.config.images.lazy.placeholder === 'blur' ? `
        .blur-placeholder {
          filter: blur(10px);
        }
      ` : ''}

      @media (prefers-reduced-motion: reduce) {
        img {
          transition: none !important;
        }
      }
    `;
    document.head.appendChild(style);
  }

  // Setup responsive images
  private setupResponsiveImages(): void {
    // Create responsive image elements
    document.querySelectorAll('img[data-responsive]').forEach(img => {
      this.makeImageResponsive(img as HTMLImageElement);
    });
  }

  // Make image responsive
  private makeImageResponsive(img: HTMLImageElement): void {
    const deviceType = this.getDeviceType();
    const breakpoints = this.config.images.sizes[deviceType].breakpoints;
    const maxSize = this.config.images.sizes[deviceType].max;

    // Create srcset with optimized images
    const srcset = breakpoints.map(width => {
      const optimizedUrl = this.optimizeImageUrl(img.src, {
        width,
        quality: this.getOptimalImageQuality()
      });
      return `${optimizedUrl} ${width}w`;
    }).join(', ');

    // Create sizes attribute
    const sizes = breakpoints.map(width => `(max-width: ${width}px) ${width}px`).join(', ');

    img.setAttribute('srcset', srcset);
    img.setAttribute('sizes', sizes);
    img.setAttribute('loading', this.config.images.lazy.enabled ? 'lazy' : 'eager');
  }

  // Initialize progressive image loading
  private initializeProgressiveLoading(): void {
    if (!this.config.images.compression.progressive) return;

    document.querySelectorAll('img[data-progressive]').forEach(img => {
      this.setupProgressiveImage(img as HTMLImageElement);
    });
  }

  // Setup progressive image
  private setupProgressiveImage(img: HTMLImageElement): void {
    const src = img.getAttribute('data-progressive');
    if (!src) return;

    // Load low-quality placeholder first
    const placeholderUrl = this.optimizeImageUrl(src, {
      quality: 20,
      width: 50,
      blur: 10
    });

    img.classList.add('progressive-image');
    img.src = placeholderUrl;

    // Load full image
    const fullImageUrl = this.optimizeImageUrl(src, {
      quality: this.getOptimalImageQuality()
    });

    const fullImg = new Image();
    fullImg.onload = () => {
      img.src = fullImageUrl;
      img.classList.remove('progressive-image');
      img.classList.add('loaded');
    };
    fullImg.src = fullImageUrl;
  }

  // Initialize font optimization
  private initializeFontOptimization(): void {
    // Preload critical fonts
    if (this.config.fonts.preload) {
      this.preloadCriticalFonts();
    }

    // Setup font display strategy
    this.setupFontDisplay();

    // Optimize font loading
    this.optimizeFontLoading();
  }

  // Preload critical fonts
  private preloadCriticalFonts(): void {
    const criticalFonts = [
      '/fonts/inter-var.woff2',
      '/fonts/inter-regular.woff2'
    ];

    criticalFonts.forEach(fontUrl => {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.as = 'font';
      link.type = 'font/woff2';
      link.crossOrigin = 'anonymous';
      link.href = fontUrl;
      document.head.appendChild(link);
    });
  }

  // Setup font display
  private setupFontDisplay(): void {
    const style = document.createElement('style');
    style.textContent = `
      @font-face {
        font-family: 'Inter';
        font-display: ${this.config.fonts.display};
        src: url('/fonts/inter-var.woff2') format('woff2-variations'),
             url('/fonts/inter-regular.woff2') format('woff2');
        font-weight: 100 900;
      }
    `;
    document.head.appendChild(style);
  }

  // Optimize font loading
  private optimizeFontLoading(): void {
    if ('fonts' in document) {
      // Load fonts asynchronously
      const font = new FontFace('Inter', 'url(/fonts/inter-var.woff2)', {
        display: this.config.fonts.display
      });

      font.load().then(loadedFont => {
        document.fonts.add(loadedFont);
      }).catch(error => {
        console.warn('Failed to load font:', error);
      });
    }
  }

  // Initialize video optimization
  private initializeVideoOptimization(): void {
    // Setup adaptive video loading
    this.setupAdaptiveVideo();

    // Optimize video attributes
    this.optimizeVideoAttributes();

    // Setup video lazy loading
    this.setupVideoLazyLoading();
  }

  // Setup adaptive video
  private setupAdaptiveVideo(): void {
    document.querySelectorAll('video[data-adaptive]').forEach(video => {
      this.makeVideoAdaptive(video as HTMLVideoElement);
    });
  }

  // Make video adaptive
  private makeVideoAdaptive(video: HTMLVideoElement): void {
    const networkQuality = this.getNetworkQuality();
    let videoQuality;

    switch (networkQuality) {
      case NetworkQuality.EXCELLENT:
        videoQuality = this.config.videos.quality.high;
        break;
      case NetworkQuality.GOOD:
        videoQuality = this.config.videos.quality.medium;
        break;
      default:
        videoQuality = this.config.videos.quality.low;
    }

    // Update video source based on quality
    const source = video.querySelector('source');
    if (source) {
      // This would typically use a video service like Cloudinary or Mux
      const optimizedUrl = this.optimizeVideoUrl(source.getAttribute('src')!, videoQuality);
      source.setAttribute('src', optimizedUrl);
    }

    video.load();
  }

  // Optimize video attributes
  private optimizeVideoAttributes(): void {
    document.querySelectorAll('video').forEach(video => {
      const htmlVideo = video as HTMLVideoElement;

      if (this.config.videos.autoplay) {
        htmlVideo.autoplay = true;
      }

      if (this.config.videos.muted) {
        htmlVideo.muted = true;
      }

      if (this.config.videos.loop) {
        htmlVideo.loop = true;
      }

      // Add poster image for better UX
      if (!htmlVideo.poster && htmlVideo.getAttribute('data-poster')) {
        htmlVideo.poster = htmlVideo.getAttribute('data-poster')!;
      }
    });
  }

  // Setup video lazy loading
  private setupVideoLazyLoading(): void {
    const videoObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const video = entry.target as HTMLVideoElement;
          if (video.getAttribute('data-src')) {
            this.loadLazyVideo(video);
            videoObserver.unobserve(video);
          }
        }
      });
    }, {
      rootMargin: '200px',
      threshold: 0.1
    });

    document.querySelectorAll('video[data-src]').forEach(video => {
      videoObserver.observe(video);
    });
  }

  // Load lazy video
  private loadLazyVideo(video: HTMLVideoElement): void {
    const src = video.getAttribute('data-src');
    if (!src) return;

    const startTime = performance.now();

    const source = video.querySelector('source') || document.createElement('source');
    source.setAttribute('src', src);
    if (!video.querySelector('source')) {
      video.appendChild(source);
    }

    video.load();

    video.onloadeddata = () => {
      const loadTime = performance.now() - startTime;

      this.recordAssetPerformance({
        url: src,
        type: 'video',
        originalSize: 0,
        optimizedSize: 0,
        compressionRatio: 0,
        loadTime,
        cacheHit: false,
        networkSavings: 0,
        userSatisfaction: this.calculateUserSatisfaction(loadTime, 'video')
      });
    };
  }

  // Initialize script optimization
  private initializeScriptOptimization(): void {
    // Defer non-critical scripts
    if (this.config.scripts.deferNonCritical) {
      this.deferNonCriticalScripts();
    }

    // Async third-party scripts
    if (this.config.scripts.asyncThirdParty) {
      this.asyncThirdPartyScripts();
    }

    // Optimize script loading
    this.optimizeScriptLoading();
  }

  // Defer non-critical scripts
  private deferNonCriticalScripts(): void {
    document.querySelectorAll('script:not([data-critical]):not([src*="analytics"])').forEach(script => {
      if (!script.hasAttribute('defer') && !script.hasAttribute('async')) {
        script.setAttribute('defer', '');
      }
    });
  }

  // Async third-party scripts
  private asyncThirdPartyScripts(): void {
    const thirdPartyDomains = ['google-analytics.com', 'facebook.net', 'doubleclick.net'];

    document.querySelectorAll('script[src]').forEach(script => {
      const src = script.getAttribute('src');
      if (src && thirdPartyDomains.some(domain => src.includes(domain))) {
        script.setAttribute('async', '');
        script.setAttribute('data-optimized', 'true');
      }
    });
  }

  // Optimize script loading
  private optimizeScriptLoading(): void {
    // Add script optimization styles
    const style = document.createElement('style');
    style.textContent = `
      /* Mobile Asset Optimizer - Script Optimizations */
      script[data-defer] {
        display: none;
      }

      .loading-script {
        opacity: 0.5;
      }
    `;
    document.head.appendChild(style);
  }

  // Initialize style optimization
  private initializeStyleOptimization(): void {
    // Critical CSS optimization
    if (this.config.styles.criticalCSS) {
      this.optimizeCriticalCSS();
    }

    // Preload critical styles
    if (this.config.styles.preloadCritical) {
      this.preloadCriticalStyles();
    }

    // Optimize CSS loading
    this.optimizeStyleLoading();
  }

  // Optimize critical CSS
  private optimizeCriticalCSS(): void {
    // Mark critical stylesheets
    document.querySelectorAll('link[rel="stylesheet"]').forEach(link => {
      if (link.getAttribute('data-critical')) {
        link.setAttribute('media', 'all');
      } else {
        // Defer non-critical CSS
        link.setAttribute('media', 'print');
        link.setAttribute('onload', 'this.media="all"');
      }
    });
  }

  // Preload critical styles
  private preloadCriticalStyles(): void {
    const criticalStyles = [
      '/css/critical.css',
      '/css/typography.css'
    ];

    criticalStyles.forEach(styleUrl => {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.as = 'style';
      link.href = styleUrl;
      link.onload = () => {
        // Convert preload to regular stylesheet
        link.rel = 'stylesheet';
      };
      document.head.appendChild(link);
    });
  }

  // Optimize style loading
  private optimizeStyleLoading(): void {
    // Add style optimization styles
    const style = document.createElement('style');
    style.textContent = `
      /* Mobile Asset Optimizer - Style Optimizations */
      link[rel="stylesheet"][media="print"] {
        display: none;
      }

      .css-loading {
        opacity: 0.7;
      }
    `;
    document.head.appendChild(style);
  }

  // Initialize caching strategy
  private initializeCachingStrategy(): void {
    // Setup service worker caching
    if (this.config.caching.serviceWorker && 'serviceWorker' in navigator) {
      this.setupServiceWorkerCaching();
    }

    // Setup HTTP caching headers
    this.setupHTTPCaching();
  }

  // Setup service worker caching
  private setupServiceWorkerCaching(): void {
    if ('caches' in window) {
      const cacheName = 'mobile-asset-cache-v1';

      // Cache critical assets
      const criticalAssets = [
        '/',
        '/css/critical.css',
        '/fonts/inter-var.woff2',
        '/images/logo.webp'
      ];

      caches.open(cacheName).then(cache => {
        criticalAssets.forEach(url => {
          cache.add(url).catch(() => {
            // Ignore caching errors
          });
        });
      });
    }
  }

  // Setup HTTP caching
  private setupHTTPCaching(): void {
    // This would typically be done on the server side
    // For now, we'll just track cache hits
    this.trackCachePerformance();
  }

  // Track cache performance
  private trackCachePerformance(): void {
    if ('caches' in window) {
      setInterval(async () => {
        const cache = await caches.open('mobile-asset-cache-v1');
        const keys = await cache.keys();

        trackRUMEvent('mobile-cache-performance', {
          cacheSize: keys.length,
          timestamp: Date.now()
        });
      }, 300000); // Every 5 minutes
    }
  }

  // Initialize performance monitoring
  private initializePerformanceMonitoring(): void {
    // Monitor asset loading performance
    if ('PerformanceObserver' in window) {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();

        entries.forEach(entry => {
          if (entry.entryType === 'resource') {
            this.analyzeResourcePerformance(entry as PerformanceResourceTiming);
          }
        });
      });

      observer.observe({ entryTypes: ['resource'] });
    }

    // Monitor long tasks
    this.monitorLongTasks();
  }

  // Analyze resource performance
  private analyzeResourcePerformance(entry: PerformanceResourceTiming): void {
    const { name, duration, transferSize, decodedBodySize } = entry;

    // Analyze performance issues
    if (duration > 3000) { // Slow loading resource
      trackRUMEvent('mobile-slow-asset', {
        name,
        duration,
        size: transferSize,
        type: this.getAssetType(name),
        timestamp: Date.now()
      });
    }

    // Large assets
    if (transferSize > 1024 * 1024) { // > 1MB
      trackRUMEvent('mobile-large-asset', {
        name,
        size: transferSize,
        type: this.getAssetType(name),
        timestamp: Date.now()
      });
    }
  }

  // Monitor long tasks
  private monitorLongTasks(): void {
    if ('PerformanceObserver' in window) {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();

        entries.forEach(entry => {
          if (entry.entryType === 'longtask') {
            trackRUMEvent('mobile-long-task', {
              duration: entry.duration,
              startTime: entry.startTime,
              timestamp: Date.now()
            });
          }
        });
      });

      observer.observe({ entryTypes: ['longtask'] });
    }
  }

  // Initialize adaptive optimization
  private initializeAdaptiveOptimization(): void {
    // Monitor network changes
    this.monitorNetworkChanges();

    // Monitor device capabilities
    this.monitorDeviceCapabilities();

    // Adjust optimization based on context
    this.adaptOptimizationStrategy();
  }

  // Monitor network changes
  private monitorNetworkChanges(): void {
    const connection = (navigator as any).connection;

    if (connection) {
      const handleNetworkChange = () => {
        this.networkQuality = this.assessNetworkQuality(connection);
        this.adaptToNetworkChange();
      };

      connection.addEventListener('change', handleNetworkChange);
      connection.addEventListener('typechange', handleNetworkChange);
    }
  }

  // Assess network quality
  private assessNetworkQuality(connection: any): NetworkQuality {
    if (!connection) return NetworkQuality.MODERATE;

    const { downlink, effectiveType } = connection;

    if (downlink >= 2 || effectiveType === '5g') {
      return NetworkQuality.EXCELLENT;
    } else if (downlink >= 0.7 || effectiveType === '4g') {
      return NetworkQuality.GOOD;
    } else if (downlink >= 0.15 || effectiveType === '3g') {
      return NetworkQuality.MODERATE;
    } else {
      return NetworkQuality.SLOW;
    }
  }

  // Adapt to network change
  private adaptToNetworkChange(): void {
    // Adjust image quality based on network
    document.querySelectorAll('img').forEach(img => {
      this.updateImageQuality(img as HTMLImageElement);
    });

    // Adjust video quality based on network
    document.querySelectorAll('video').forEach(video => {
      this.updateVideoQuality(video as HTMLVideoElement);
    });

    trackRUMEvent('mobile-network-adaptation', {
      networkQuality: this.networkQuality,
      timestamp: Date.now()
    });
  }

  // Update image quality
  private updateImageQuality(img: HTMLImageElement): void {
    if (img.src && !img.hasAttribute('data-quality-updated')) {
      const optimizedUrl = this.optimizeImageUrl(img.src, {
        quality: this.getOptimalImageQuality()
      });

      if (optimizedUrl !== img.src) {
        img.src = optimizedUrl;
        img.setAttribute('data-quality-updated', 'true');
      }
    }
  }

  // Update video quality
  private updateVideoQuality(video: HTMLVideoElement): void {
    const source = video.querySelector('source');
    if (source && source.getAttribute('src')) {
      const networkQuality = this.getNetworkQuality();
      let videoQuality;

      switch (networkQuality) {
        case NetworkQuality.EXCELLENT:
          videoQuality = this.config.videos.quality.high;
          break;
        case NetworkQuality.GOOD:
          videoQuality = this.config.videos.quality.medium;
          break;
        default:
          videoQuality = this.config.videos.quality.low;
      }

      const optimizedUrl = this.optimizeVideoUrl(source.getAttribute('src')!, videoQuality);
      source.setAttribute('src', optimizedUrl);
      video.load();
    }
  }

  // Monitor device capabilities
  private monitorDeviceCapabilities(): void {
    // Monitor memory usage
    if ('memory' in performance) {
      setInterval(() => {
        const memory = (performance as any).memory;
        const memoryPressure = memory.usedJSHeapSize / memory.jsHeapSizeLimit;

        if (memoryPressure > 0.8) {
          this.optimizeForHighMemoryUsage();
        }
      }, 30000);
    }

    // Monitor battery level
    if ('getBattery' in navigator) {
      (navigator as any).getBattery().then((battery: any) => {
        const updateBatteryStatus = () => {
          if (battery.level < 0.2 && !battery.charging) {
            this.optimizeForLowBattery();
          }
        };

        updateBatteryStatus();
        battery.addEventListener('levelchange', updateBatteryStatus);
        battery.addEventListener('chargingchange', updateBatteryStatus);
      });
    }
  }

  // Optimize for high memory usage
  private optimizeForHighMemoryUsage(): void {
    // Reduce image quality
    this.config.images.quality.excellent = 70;
    this.config.images.quality.good = 60;
    this.config.images.quality.moderate = 50;
    this.config.images.quality.slow = 40;

    // Disable animations
    document.body.classList.add('reduce-animations');

    trackRUMEvent('mobile-memory-optimization', {
      action: 'high-memory-usage',
      timestamp: Date.now()
    });
  }

  // Optimize for low battery
  private optimizeForLowBattery(): void {
    // Reduce video quality
    this.config.videos.quality.high.bitrate = 3000;
    this.config.videos.quality.medium.bitrate = 1500;
    this.config.videos.quality.low.bitrate = 800;

    // Disable autoplay
    document.querySelectorAll('video').forEach(video => {
      (video as HTMLVideoElement).autoplay = false;
    });

    trackRUMEvent('mobile-battery-optimization', {
      action: 'low-battery',
      timestamp: Date.now()
    });
  }

  // Adapt optimization strategy
  private adaptOptimizationStrategy(): void {
    setInterval(() => {
      this.assessOptimizationEffectiveness();
      this.adjustOptimizationParameters();
    }, 60000); // Every minute
  }

  // Assess optimization effectiveness
  private assessOptimizationEffectiveness(): void {
    // Analyze recent performance metrics
    const recentMetrics = this.performanceMetrics.slice(-20);

    if (recentMetrics.length > 0) {
      const averageLoadTime = recentMetrics.reduce((sum, m) => sum + m.loadTime, 0) / recentMetrics.length;
      const averageSatisfaction = recentMetrics.reduce((sum, m) => sum + m.userSatisfaction, 0) / recentMetrics.length;

      // If performance is poor, adjust parameters
      if (averageLoadTime > 2000 || averageSatisfaction < 70) {
        this.increaseOptimizationLevel();
      } else if (averageLoadTime < 500 && averageSatisfaction > 90) {
        this.decreaseOptimizationLevel();
      }
    }
  }

  // Increase optimization level
  private increaseOptimizationLevel(): void {
    // Reduce image quality
    Object.keys(this.config.images.quality).forEach(key => {
      this.config.images.quality[key as keyof typeof this.config.images.quality] = Math.max(
        this.config.images.quality[key as keyof typeof this.config.images.quality] - 10,
        30
      );
    });

    trackRUMEvent('mobile-optimization-increased', {
      reason: 'poor-performance',
      timestamp: Date.now()
    });
  }

  // Decrease optimization level
  private decreaseOptimizationLevel(): void {
    // Increase image quality
    Object.keys(this.config.images.quality).forEach(key => {
      this.config.images.quality[key as keyof typeof this.config.images.quality] = Math.min(
        this.config.images.quality[key as keyof typeof this.config.images.quality] + 5,
        95
      );
    });

    trackRUMEvent('mobile-optimization-decreased', {
      reason: 'good-performance',
      timestamp: Date.now()
    });
  }

  // Adjust optimization parameters
  private adjustOptimizationParameters(): void {
    // Dynamic parameter adjustment based on user behavior
    const userEngagement = this.calculateUserEngagement();

    if (userEngagement < 0.5) {
      // Low engagement - more aggressive optimization
      this.config.images.lazy.threshold = Math.max(this.config.images.lazy.threshold - 10, 0);
    } else if (userEngagement > 0.8) {
      // High engagement - less aggressive optimization
      this.config.images.lazy.threshold = Math.min(this.config.images.lazy.threshold + 10, 200);
    }
  }

  // Calculate user engagement
  private calculateUserEngagement(): number {
    // Simple engagement calculation based on session data
    const sessionDuration = Date.now() - performance.timing.navigationStart;
    const pageViews = parseInt(sessionStorage.getItem('page-views') || '1');
    const interactions = parseInt(sessionStorage.getItem('interactions') || '0');

    const engagementScore = Math.min(
      (sessionDuration / 300000) + // 5 minutes = 1 point
      (pageViews * 0.2) +
      (interactions * 0.1),
      1
    );

    return engagementScore;
  }

  // Optimize existing assets
  private optimizeExistingAssets(): void {
    // Optimize images
    document.querySelectorAll('img:not([data-optimized])').forEach(img => {
      this.optimizeImage(img as HTMLImageElement);
    });

    // Optimize videos
    document.querySelectorAll('video:not([data-optimized])').forEach(video => {
      this.optimizeVideo(video as HTMLVideoElement);
    });

    // Optimize scripts
    document.querySelectorAll('script:not([data-optimized])').forEach(script => {
      this.optimizeScript(script as HTMLScriptElement);
    });

    // Optimize styles
    document.querySelectorAll('link[rel="stylesheet"]:not([data-optimized])').forEach(link => {
      this.optimizeStyle(link as HTMLLinkElement);
    });
  }

  // Optimize image
  private optimizeImage(img: HTMLImageElement): void {
    if (this.config.images.lazy.enabled && !img.complete) {
      img.setAttribute('data-src', img.src);
      img.src = '';
      img.setAttribute('data-optimized', 'true');
      this.imageObserver?.observe(img);
    } else {
      // Optimize existing image
      const optimizedUrl = this.optimizeImageUrl(img.src, {
        quality: this.getOptimalImageQuality()
      });

      if (optimizedUrl !== img.src) {
        img.src = optimizedUrl;
        img.setAttribute('data-optimized', 'true');
      }
    }
  }

  // Optimize video
  private optimizeVideo(video: HTMLVideoElement): void {
    this.makeVideoAdaptive(video);
    video.setAttribute('data-optimized', 'true');
  }

  // Optimize script
  private optimizeScript(script: HTMLScriptElement): void {
    const src = script.getAttribute('src');
    if (src && src.includes('analytics')) {
      script.setAttribute('async', '');
      script.setAttribute('data-optimized', 'true');
    }
  }

  // Optimize style
  private optimizeStyle(link: HTMLLinkElement): void {
    const href = link.getAttribute('href');
    if (href && !link.getAttribute('data-critical')) {
      link.setAttribute('media', 'print');
      link.setAttribute('onload', 'this.media="all"');
      link.setAttribute('data-optimized', 'true');
    }
  }

  // Helper methods

  // Get device type
  private getDeviceType(): 'mobile' | 'tablet' | 'desktop' {
    const width = window.innerWidth;
    if (width < 768) return 'mobile';
    if (width < 1024) return 'tablet';
    return 'desktop';
  }

  // Get optimal image quality
  private getOptimalImageQuality(): number {
    return this.config.images.quality[this.networkQuality as keyof typeof this.config.images.quality];
  }

  // Get network quality
  private getNetworkQuality(): NetworkQuality {
    return this.networkQuality;
  }

  // Optimize image URL
  private optimizeImageUrl(src: string, options: Partial<ImageOptimizationRequest> = {}): string {
    // This would typically use a CDN service like Cloudinary, ImageKit, etc.
    // For now, we'll return the original URL with optimization parameters

    const params = new URLSearchParams();

    if (options.width) params.set('w', options.width.toString());
    if (options.height) params.set('h', options.height.toString());
    if (options.quality) params.set('q', options.quality.toString());
    if (options.format) params.set('f', options.format);
    if (options.crop) params.set('c', options.crop);
    if (options.gravity) params.set('g', options.gravity);
    if (options.blur) params.set('blur', options.blur.toString());

    const paramString = params.toString();
    return paramString ? `${src}?${paramString}` : src;
  }

  // Optimize video URL
  private optimizeVideoUrl(src: string, quality: any): string {
    // This would typically use a video service like Mux, Cloudinary, etc.
    // For now, we'll return the original URL with quality parameters

    const params = new URLSearchParams();
    params.set('resolution', quality.resolution);
    params.set('bitrate', quality.bitrate.toString());

    const paramString = params.toString();
    return paramString ? `${src}?${paramString}` : src;
  }

  // Get asset type
  private getAssetType(url: string): string {
    if (url.match(/\.(jpg|jpeg|png|webp|gif|svg)$/i)) return 'image';
    if (url.match(/\.(mp4|webm|avi|mov)$/i)) return 'video';
    if (url.match(/\.(js|mjs)$/i)) return 'script';
    if (url.match(/\.css$/i)) return 'style';
    if (url.match(/\.(woff|woff2|ttf|eot)$/i)) return 'font';
    return 'other';
  }

  // Record asset performance
  private recordAssetPerformance(metrics: AssetPerformanceMetrics): void {
    this.performanceMetrics.push(metrics);

    // Keep only recent metrics
    if (this.performanceMetrics.length > 100) {
      this.performanceMetrics = this.performanceMetrics.slice(-100);
    }
  }

  // Calculate user satisfaction
  private calculateUserSatisfaction(loadTime: number, type: string): number {
    const thresholds = {
      image: { excellent: 500, good: 1000, poor: 2000 },
      video: { excellent: 1000, good: 2000, poor: 4000 },
      script: { excellent: 300, good: 600, poor: 1200 },
      style: { excellent: 200, good: 400, poor: 800 }
    };

    const threshold = thresholds[type as keyof typeof thresholds] || thresholds.script;

    if (loadTime <= threshold.excellent) return 100;
    if (loadTime <= threshold.good) return 80;
    if (loadTime <= threshold.poor) return 60;
    return 30;
  }

  // Public API methods

  // Optimize asset URL
  optimizeAssetUrl(url: string, options: any = {}): string {
    const assetType = this.getAssetType(url);

    switch (assetType) {
      case 'image':
        return this.optimizeImageUrl(url, options);
      case 'video':
        return this.optimizeVideoUrl(url, options);
      default:
        return url;
    }
  }

  // Get optimization configuration
  getConfiguration(): AssetOptimizationConfig {
    return { ...this.config };
  }

  // Update configuration
  updateConfiguration(config: Partial<AssetOptimizationConfig>): void {
    this.config = { ...this.config, ...config };
    this.optimizeExistingAssets();
  }

  // Get performance metrics
  getPerformanceMetrics(): AssetPerformanceMetrics[] {
    return [...this.performanceMetrics];
  }

  // Get optimized assets
  getOptimizedAssets(): OptimizedAssetConfig[] {
    return Array.from(this.optimizedAssets.values());
  }

  // Clear cache
  clearCache(): void {
    this.assetCache.clear();
    this.optimizedAssets.clear();

    if ('caches' in window) {
      caches.delete('mobile-asset-cache-v1');
    }
  }

  // Export optimizer data
  exportData(): any {
    return {
      config: this.config,
      optimizedAssets: Array.from(this.optimizedAssets.values()),
      performanceMetrics: this.performanceMetrics,
      networkQuality: this.networkQuality,
      deviceTier: this.deviceTier,
      exportTimestamp: Date.now()
    };
  }
}

// Create and export singleton instance
export const mobileAssetOptimizer = MobileAssetOptimizer.getInstance();

// Initialize automatically
if (typeof window !== 'undefined') {
  if (document.readyState === 'complete') {
    mobileAssetOptimizer.initialize();
  } else {
    window.addEventListener('load', () => {
      mobileAssetOptimizer.initialize();
    });
  }
}

// Export helper functions
export const initializeMobileAssetOptimizer = (config?: Partial<AssetOptimizationConfig>) =>
  mobileAssetOptimizer.initialize(config);
export const optimizeMobileAssetUrl = (url: string, options?: any) =>
  mobileAssetOptimizer.optimizeAssetUrl(url, options);
export const getMobileAssetConfiguration = () => mobileAssetOptimizer.getConfiguration();
export const updateMobileAssetConfiguration = (config: Partial<AssetOptimizationConfig>) =>
  mobileAssetOptimizer.updateConfiguration(config);
export const getMobileAssetPerformanceMetrics = () => mobileAssetOptimizer.getPerformanceMetrics();
export const clearMobileAssetCache = () => mobileAssetOptimizer.clearCache();
export const exportMobileAssetOptimizerData = () => mobileAssetOptimizer.exportData();

// Export types
export {
  AssetOptimizationConfig,
  OptimizedAssetConfig,
  ImageOptimizationRequest,
  AssetPerformanceMetrics
};