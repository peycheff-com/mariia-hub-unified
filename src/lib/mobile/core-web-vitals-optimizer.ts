/**
 * Core Web Vitals Optimizer for Mobile
 * Optimizes LCP, FID, CLS, and other metrics specifically for mobile devices
 */

interface DeviceCapabilities {
  memory: number;
  hardwareConcurrency: number;
  connection: {
    effectiveType: string;
    downlink: number;
    rtt: number;
    saveData: boolean;
  };
  isLowEndDevice: boolean;
  isSlowConnection: boolean;
}

interface PerformanceProfile {
  level: 'high' | 'medium' | 'low';
  maxImageSize: number;
  imageQuality: number;
  enableAnimations: boolean;
  enableBackgroundSync: boolean;
  prefetchResources: boolean;
  maxConcurrentRequests: number;
}

interface OptimizedImageConfig {
  src: string;
  srcset: string;
  sizes: string;
  loading: 'lazy' | 'eager' | 'auto';
  format: 'webp' | 'avif' | 'jpg' | 'png';
  quality: number;
  width: number;
  height: number;
}

interface OptimizationStrategy {
  prioritizeAboveFold: boolean;
  deferNonCritical: boolean;
  optimizeImages: boolean;
  minimizeLayoutShift: boolean;
  reduceJavaScript: boolean;
  enableIntersectionObserver: boolean;
}

class CoreWebVitalsOptimizer {
  private static instance: CoreWebVitalsOptimizer;
  private deviceCapabilities: DeviceCapabilities;
  private performanceProfile: PerformanceProfile;
  private optimizationStrategy: OptimizationStrategy;
  private observer: IntersectionObserver | null = null;
  private metrics: Map<string, number> = new Map();
  private isOptimized = false;

  private constructor() {
    this.detectDeviceCapabilities();
    this.determinePerformanceProfile();
    this.setupOptimizationStrategy();
    this.initializeMetrics();
  }

  static getInstance(): CoreWebVitalsOptimizer {
    if (!CoreWebVitalsOptimizer.instance) {
      CoreWebVitalsOptimizer.instance = new CoreWebVitalsOptimizer();
    }
    return CoreWebVitalsOptimizer.instance;
  }

  private detectDeviceCapabilities(): void {
    const connection = (navigator as any).connection ||
                      (navigator as any).mozConnection ||
                      (navigator as any).webkitConnection;

    const memory = (navigator as any).deviceMemory || 4;
    const hardwareConcurrency = navigator.hardwareConcurrency || 4;

    this.deviceCapabilities = {
      memory,
      hardwareConcurrency,
      connection: {
        effectiveType: connection?.effectiveType || '4g',
        downlink: connection?.downlink || 10,
        rtt: connection?.rtt || 100,
        saveData: connection?.saveData || false
      },
      isLowEndDevice: memory <= 2 || hardwareConcurrency <= 2,
      isSlowConnection: connection ?
        ['slow-2g', '2g', '3g'].includes(connection.effectiveType) :
        false
    };
  }

  private determinePerformanceProfile(): void {
    const { isLowEndDevice, isSlowConnection, memory } = this.deviceCapabilities;

    if (isLowEndDevice || isSlowConnection || memory <= 2) {
      this.performanceProfile = {
        level: 'low',
        maxImageSize: 400,
        imageQuality: 60,
        enableAnimations: false,
        enableBackgroundSync: false,
        prefetchResources: false,
        maxConcurrentRequests: 2
      };
    } else if (memory <= 4 || this.deviceCapabilities.connection.effectiveType === '3g') {
      this.performanceProfile = {
        level: 'medium',
        maxImageSize: 800,
        imageQuality: 75,
        enableAnimations: true,
        enableBackgroundSync: true,
        prefetchResources: true,
        maxConcurrentRequests: 4
      };
    } else {
      this.performanceProfile = {
        level: 'high',
        maxImageSize: 1200,
        imageQuality: 85,
        enableAnimations: true,
        enableBackgroundSync: true,
        prefetchResources: true,
        maxConcurrentRequests: 6
      };
    }
  }

  private setupOptimizationStrategy(): void {
    const { isLowEndDevice, isSlowConnection } = this.deviceCapabilities;

    this.optimizationStrategy = {
      prioritizeAboveFold: true,
      deferNonCritical: isLowEndDevice || isSlowConnection,
      optimizeImages: true,
      minimizeLayoutShift: true,
      reduceJavaScript: isLowEndDevice,
      enableIntersectionObserver: 'IntersectionObserver' in window
    };
  }

  private initializeMetrics(): void {
    this.metrics.set('lcp', 0);
    this.metrics.set('fid', 0);
    this.metrics.set('cls', 0);
    this.metrics.set('fcp', 0);
    this.metrics.set('ttfb', 0);
    this.metrics.set('inp', 0); // Interaction to Next Paint
  }

  public async optimizeForMobile(): Promise<void> {
    if (this.isOptimized) return;

    console.log(`🚀 Optimizing Core Web Vitals for ${this.performanceProfile.level} performance device`);

    // Optimize Largest Contentful Paint (LCP)
    await this.optimizeLCP();

    // Optimize First Input Delay (FID) and Interaction to Next Paint (INP)
    this.optimizeFIDandINP();

    // Optimize Cumulative Layout Shift (CLS)
    this.optimizeCLS();

    // Optimize First Contentful Paint (FCP)
    await this.optimizeFCP();

    // Setup performance monitoring
    this.setupPerformanceMonitoring();

    // Apply mobile-specific optimizations
    this.applyMobileOptimizations();

    this.isOptimized = true;
    console.log('✅ Core Web Vitals optimization completed');
  }

  private async optimizeLCP(): Promise<void> {
    console.log('🎯 Optimizing Largest Contentful Paint (LCP)');

    // 1. Preload critical resources
    this.preloadCriticalResources();

    // 2. Optimize critical images
    await this.optimizeCriticalImages();

    // 3. Remove render-blocking resources
    this.removeRenderBlockingResources();

    // 4. Optimize server response time
    this.optimizeServerResponse();

    // 5. Use resource hints (preconnect, dns-prefetch)
    this.addResourceHints();
  }

  private preloadCriticalResources(): void {
    const criticalResources = [
      { href: '/fonts/inter-v12-latin-regular.woff2', as: 'font', type: 'font/woff2', crossorigin: '' },
      { href: '/fonts/space-grotesk-v5-latin-regular.woff2', as: 'font', type: 'font/woff2', crossorigin: '' },
      { href: '/api/services', as: 'fetch' },
      { href: '/api/availability', as: 'fetch' }
    ];

    criticalResources.forEach(resource => {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.href = resource.href;
      link.as = resource.as;
      if (resource.type) link.type = resource.type;
      if (resource.crossorigin) link.crossOrigin = resource.crossorigin;
      document.head.appendChild(link);
    });
  }

  private async optimizeCriticalImages(): Promise<void> {
    const heroImages = document.querySelectorAll('img[data-hero]');

    heroImages.forEach((img: Element) => {
      const imageEl = img as HTMLImageElement;

      // Generate optimized srcset based on device capabilities
      const optimizedConfig = this.generateOptimizedImageConfig(imageEl);

      // Apply optimized configuration
      this.applyImageOptimization(imageEl, optimizedConfig);

      // Add proper loading strategy
      if (imageEl.dataset.loading) {
        imageEl.loading = imageEl.dataset.loading as 'lazy' | 'eager' | 'auto';
      }
    });
  }

  private generateOptimizedImageConfig(img: HTMLImageElement): OptimizedImageConfig {
    const { maxImageSize, imageQuality } = this.performanceProfile;
    const isAboveFold = img.dataset.hero === 'true';
    const originalWidth = parseInt(img.dataset.width || img.naturalWidth.toString()) || maxImageSize;
    const originalHeight = parseInt(img.dataset.height || img.naturalHeight.toString()) || maxImageSize;

    // Calculate optimal size based on device and viewport
    let targetWidth = Math.min(originalWidth, maxImageSize);
    let targetHeight = Math.min(originalHeight, maxImageSize);

    // For above-fold images, use higher quality
    const quality = isAboveFold ? Math.min(imageQuality + 10, 95) : imageQuality;

    // Generate responsive srcset
    const srcset = this.generateSrcset(img.src, targetWidth, targetHeight);

    return {
      src: img.src,
      srcset,
      sizes: img.sizes || '(max-width: 768px) 100vw, 50vw',
      loading: isAboveFold ? 'eager' : 'lazy',
      format: this.getOptimalImageFormat(),
      quality,
      width: targetWidth,
      height: targetHeight
    };
  }

  private generateSrcset(baseSrc: string, maxWidth: number, maxHeight: number): string {
    const breakpoints = [320, 480, 768, 1024, 1200];
    const { format, quality } = this.performanceProfile;

    return breakpoints
      .filter(width => width <= maxWidth)
      .map(width => {
        const height = Math.round((maxHeight / maxWidth) * width);
        return `${baseSrc}?w=${width}&h=${height}&f=${format}&q=${quality} ${width}w`;
      })
      .join(', ');
  }

  private getOptimalImageFormat(): 'webp' | 'avif' | 'jpg' | 'png' {
    // Check browser support for modern formats
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    // AVIF support check
    if (ctx && this.supportsFormat('avif')) {
      return 'avif';
    }

    // WebP support check
    if (ctx && this.supportsFormat('webp')) {
      return 'webp';
    }

    // Fallback to JPEG for photos, PNG for graphics
    return 'jpg';
  }

  private supportsFormat(format: string): boolean {
    // Simple format support detection
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return false;

    canvas.width = 1;
    canvas.height = 1;

    try {
      const dataUrl = canvas.toDataURL(`image/${format}`);
      return dataUrl.indexOf(`data:image/${format}`) === 0;
    } catch {
      return false;
    }
  }

  private applyImageOptimization(img: HTMLImageElement, config: OptimizedImageConfig): void {
    // Apply srcset and sizes
    if (config.srcset) {
      img.srcset = config.srcset;
    }
    if (config.sizes) {
      img.sizes = config.sizes;
    }

    // Set loading strategy
    img.loading = config.loading;

    // Add proper dimensions to prevent layout shift
    img.width = config.width;
    img.height = config.height;

    // Add style to prevent layout shift
    img.style.aspectRatio = `${config.width} / ${config.height}`;
    img.style.height = 'auto';
  }

  private removeRenderBlockingResources(): Promise<void> {
    return new Promise((resolve) => {
      // Find render-blocking scripts
      const blockingScripts = document.querySelectorAll('script[src]:not([async]):not([defer])');

      blockingScripts.forEach(script => {
        const newScript = document.createElement('script');
        newScript.src = (script as HTMLScriptElement).src;
        newScript.async = true;

        script.parentNode?.replaceChild(newScript, script);
      });

      // Inline critical CSS
      this.inlineCriticalCSS().then(resolve);
    });
  }

  private async inlineCriticalCSS(): Promise<void> {
    try {
      const criticalCSS = await this.getCriticalCSS();
      if (criticalCSS) {
        const style = document.createElement('style');
        style.textContent = criticalCSS;
        style.setAttribute('data-critical', 'true');
        document.head.insertBefore(style, document.head.firstChild);
      }
    } catch (error) {
      console.warn('Failed to inline critical CSS:', error);
    }
  }

  private async getCriticalCSS(): Promise<string> {
    // This would typically be generated during build time
    // For now, return a minimal critical CSS set
    return `
      body { font-family: 'Inter', system-ui, sans-serif; }
      .hero-section { min-height: 100vh; display: flex; align-items: center; }
      .loading-skeleton {
        background: linear-gradient(90deg, #f3f3f3 25%, #e8e8e8 50%, #f3f3f3 75%);
        background-size: 200% 100%;
        animation: loading 1.5s infinite;
      }
      @keyframes loading { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }
    `;
  }

  private optimizeServerResponse(): void {
    // Add connection prehints for critical domains
    const criticalDomains = [
      'mariaborysevych.com',
      'api.supabase.co',
      'fonts.googleapis.com',
      'fonts.gstatic.com'
    ];

    criticalDomains.forEach(domain => {
      const link = document.createElement('link');
      link.rel = 'preconnect';
      link.href = `https://${domain}`;
      link.crossOrigin = 'anonymous';
      document.head.appendChild(link);
    });
  }

  private addResourceHints(): void {
    // DNS prefetch for external resources
    const externalDomains = [
      'stripe.com',
      'google-analytics.com',
      'googletagmanager.com'
    ];

    externalDomains.forEach(domain => {
      const link = document.createElement('link');
      link.rel = 'dns-prefetch';
      link.href = `https://${domain}`;
      document.head.appendChild(link);
    });
  }

  private optimizeFIDandINP(): void {
    console.log('⚡ Optimizing First Input Delay (FID) and Interaction to Next Paint (INP)');

    // 1. Code splitting and lazy loading
    this.implementCodeSplitting();

    // 2. Reduce JavaScript execution time
    this.reduceJavaScriptExecution();

    // 3. Optimize event listeners
    this.optimizeEventListeners();

    // 4. Use web workers for heavy computations
    this.setupWebWorkers();
  }

  private implementCodeSplitting(): void {
    // Dynamically import non-critical modules
    const nonCriticalModules = [
      () => import('@/components/admin/AnalyticsDashboard'),
      () => import('@/components/marketing/Newsletter'),
      () => import('@/components/support/ChatWidget')
    ];

    // Load non-critical modules after page load
    window.addEventListener('load', () => {
      setTimeout(() => {
        nonCriticalModules.forEach(async (loadModule) => {
          try {
            await loadModule();
          } catch (error) {
            console.warn('Failed to load non-critical module:', error);
          }
        });
      }, 2000);
    });
  }

  private reduceJavaScriptExecution(): void {
    if (!this.optimizationStrategy.reduceJavaScript) return;

    // Defer non-critical JavaScript
    const scripts = document.querySelectorAll('script[data-defer="true"]');
    scripts.forEach(script => {
      const newScript = document.createElement('script');
      newScript.src = (script as HTMLScriptElement).src;
      newScript.defer = true;
      script.parentNode?.replaceChild(newScript, script);
    });

    // Use requestIdleCallback for non-critical tasks
    if ('requestIdleCallback' in window) {
      (window as any).requestIdleCallback(() => {
        this.runNonCriticalTasks();
      });
    } else {
      setTimeout(() => this.runNonCriticalTasks(), 100);
    }
  }

  private runNonCriticalTasks(): void {
    // Initialize non-critical features
    this.initializeAnalytics();
    this.initializeChatWidget();
    this.initializeTooltips();
  }

  private initializeAnalytics(): void {
    // Initialize analytics if needed
    if (typeof gtag !== 'undefined') {
      // Analytics already loaded
    }
  }

  private initializeChatWidget(): void {
    // Initialize chat widget
    const chatButton = document.querySelector('[data-chat-widget]');
    if (chatButton) {
      // Load chat widget
    }
  }

  private initializeTooltips(): void {
    // Initialize tooltips
    const tooltipElements = document.querySelectorAll('[data-tooltip]');
    tooltipElements.forEach(element => {
      // Add tooltip functionality
    });
  }

  private optimizeEventListeners(): void {
    // Use passive event listeners for better performance
    const passiveEvents = ['touchstart', 'touchmove', 'wheel', 'scroll'];

    passiveEvents.forEach(eventType => {
      document.addEventListener(eventType, () => {}, { passive: true });
    });

    // Debounce scroll and resize events
    this.debounceEvents();
  }

  private debounceEvents(): void {
    let scrollTimeout: number;
    let resizeTimeout: number;

    window.addEventListener('scroll', () => {
      clearTimeout(scrollTimeout);
      scrollTimeout = window.setTimeout(() => {
        this.handleScroll();
      }, 16); // ~60fps
    }, { passive: true });

    window.addEventListener('resize', () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = window.setTimeout(() => {
        this.handleResize();
      }, 100);
    });
  }

  private handleScroll(): void {
    // Handle scroll events efficiently
    requestAnimationFrame(() => {
      // Update UI based on scroll position
    });
  }

  private handleResize(): void {
    // Handle resize events efficiently
    // Re-evaluate viewport-dependent optimizations
  }

  private setupWebWorkers(): void {
    // Setup web worker for heavy computations
    if ('Worker' in window) {
      try {
        const worker = new Worker('/workers/performance-worker.js');
        worker.postMessage({ type: 'init', deviceCapabilities: this.deviceCapabilities });
      } catch (error) {
        console.warn('Failed to setup web worker:', error);
      }
    }
  }

  private optimizeCLS(): void {
    console.log('📐 Optimizing Cumulative Layout Shift (CLS)');

    // 1. Reserve space for dynamic content
    this.reserveSpaceForDynamicContent();

    // 2. Optimize font loading
    this.optimizeFontLoading();

    // 3. Prevent content jump
    this.preventContentJump();

    // 4. Use aspect ratios for media
    this.enforceAspectRatios();
  }

  private reserveSpaceForDynamicContent(): void {
    // Find elements that might load content dynamically
    const dynamicElements = document.querySelectorAll('[data-dynamic-content]');

    dynamicElements.forEach(element => {
      const height = element.getAttribute('data-reserved-height');
      const aspectRatio = element.getAttribute('data-aspect-ratio');

      if (height) {
        (element as HTMLElement).style.minHeight = height;
      }

      if (aspectRatio) {
        (element as HTMLElement).style.aspectRatio = aspectRatio;
      }
    });
  }

  private optimizeFontLoading(): void {
    // Use font-display: swap for better loading
    const style = document.createElement('style');
    style.textContent = `
      @font-face {
        font-family: 'Inter';
        font-display: swap;
        src: url('/fonts/inter-v12-latin-regular.woff2') format('woff2');
      }
      @font-face {
        font-family: 'Space Grotesk';
        font-display: swap;
        src: url('/fonts/space-grotesk-v5-latin-regular.woff2') format('woff2');
      }
    `;
    document.head.appendChild(style);
  }

  private preventContentJump(): void {
    // Set explicit dimensions for images and iframes
    const images = document.querySelectorAll('img:not([width]):not([height])');
    images.forEach(img => {
      // This would ideally be done during build
      const aspectRatio = 16 / 9; // Default aspect ratio
      img.style.aspectRatio = aspectRatio.toString();
    });
  }

  private enforceAspectRatios(): void {
    // Enforce aspect ratios for media elements
    const mediaElements = document.querySelectorAll('img, video, iframe');
    mediaElements.forEach(element => {
      const width = element.getAttribute('width');
      const height = element.getAttribute('height');

      if (width && height) {
        (element as HTMLElement).style.aspectRatio = `${width} / ${height}`;
      }
    });
  }

  private async optimizeFCP(): Promise<void> {
    console.log('🎨 Optimizing First Contentful Paint (FCP)');

    // 1. Minimize critical rendering path
    await this.minimizeCriticalRenderingPath();

    // 2. Optimize CSS delivery
    this.optimizeCSSDelivery();

    // 3. Reduce server response time
    this.optimizeFCPServerResponse();
  }

  private async minimizeCriticalRenderingPath(): Promise<void> {
    // Ensure critical CSS is loaded first
    const criticalStyle = document.querySelector('style[data-critical="true"]');
    if (!criticalStyle) {
      await this.inlineCriticalCSS();
    }

    // Load non-critical CSS asynchronously
    const nonCriticalLinks = document.querySelectorAll('link[rel="stylesheet"][data-non-critical="true"]');
    nonCriticalLinks.forEach(link => {
      link.rel = 'preload';
      link.as = 'style';
      link.onload = function() {
        (this as HTMLLinkElement).rel = 'stylesheet';
      };
    });
  }

  private optimizeCSSDelivery(): void {
    // Use media queries to load non-critical CSS
    const printStyles = document.querySelectorAll('link[media="print"]');
    printStyles.forEach(link => {
      // Load print styles after page load
      window.addEventListener('load', () => {
        setTimeout(() => {
          (link as HTMLLinkElement).media = 'all';
        }, 1000);
      });
    });
  }

  private optimizeFCPServerResponse(): void {
    // Add early hints for critical resources (if supported)
    if ('Link' in document.createElement('link')) {
      const earlyHints = [
        '</api/services>; rel=preload; as=fetch',
        '</fonts/inter-v12-latin-regular.woff2>; rel=preload; as=font; crossorigin'
      ];

      earlyHints.forEach(hint => {
        const link = document.createElement('link');
        link.setAttribute('href', hint.split(';')[0].replace('<', '').replace('>', ''));
        link.setAttribute('rel', 'preload');

        const attributes = hint.split(';').slice(1);
        attributes.forEach(attr => {
          const [key, value] = attr.trim().split('=');
          link.setAttribute(key.trim(), value.replace(/"/g, ''));
        });

        document.head.appendChild(link);
      });
    }
  }

  private setupPerformanceMonitoring(): void {
    if (!('PerformanceObserver' in window)) return;

    // Monitor LCP
    this.monitorLCP();

    // Monitor FID
    this.monitorFID();

    // Monitor CLS
    this.monitorCLS();

    // Monitor INP (if supported)
    this.monitorINP();
  }

  private monitorLCP(): void {
    const lcpObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const lastEntry = entries[entries.length - 1];
      const lcp = lastEntry.startTime;

      this.metrics.set('lcp', lcp);

      console.log(`📊 LCP: ${Math.round(lcp)}ms`);

      // Check if LCP meets mobile recommendations
      if (lcp > 2500) {
        console.warn(`⚠️ LCP above mobile threshold (2500ms): ${Math.round(lcp)}ms`);
        this.suggestLCPOptimizations(lcp);
      }
    });

    lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
  }

  private monitorFID(): void {
    const fidObserver = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        const fid = (entry as any).processingStart - entry.startTime;
        this.metrics.set('fid', fid);

        console.log(`📊 FID: ${Math.round(fid)}ms`);

        if (fid > 100) {
          console.warn(`⚠️ FID above mobile threshold (100ms): ${Math.round(fid)}ms`);
          this.suggestFIDOptimizations(fid);
        }
      }
    });

    fidObserver.observe({ entryTypes: ['first-input'] });
  }

  private monitorCLS(): void {
    let clsValue = 0;
    const clsObserver = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (!(entry as any).hadRecentInput) {
          clsValue += (entry as any).value;
        }
      }

      this.metrics.set('cls', clsValue);

      if (clsValue > 0.1) {
        console.warn(`⚠️ CLS above mobile threshold (0.1): ${clsValue.toFixed(3)}`);
        this.suggestCLSOptimizations(clsValue);
      }
    });

    clsObserver.observe({ entryTypes: ['layout-shift'] });
  }

  private monitorINP(): void {
    // Check if INP is supported
    if ('InteractionEvent' in window) {
      const inpObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          const inp = entry.duration;
          this.metrics.set('inp', inp);

          if (inp > 200) {
            console.warn(`⚠️ INP above mobile threshold (200ms): ${Math.round(inp)}ms`);
          }
        }
      });

      inpObserver.observe({ entryTypes: ['interaction'] });
    }
  }

  private suggestLCPOptimizations(lcp: number): void {
    console.log('💡 LCP Optimization Suggestions:');

    if (lcp > 4000) {
      console.log('- Reduce server response time');
      console.log('- Optimize images and use WebP/AVIF');
      console.log('- Remove render-blocking resources');
      console.log('- Use CDN for static assets');
    } else if (lcp > 2500) {
      console.log('- Compress images more aggressively');
      console.log('- Preload critical resources');
      console.log('- Minimize critical CSS');
    }
  }

  private suggestFIDOptimizations(fid: number): void {
    console.log('💡 FID Optimization Suggestions:');

    if (fid > 300) {
      console.log('- Reduce JavaScript execution time');
      console.log('- Code split large JavaScript bundles');
      console.log('- Use web workers for heavy computations');
      console.log('- Minimize main thread work');
    } else if (fid > 100) {
      console.log('- Defer non-critical JavaScript');
      console.log('- Optimize third-party scripts');
      console.log('- Use tree shaking to reduce bundle size');
    }
  }

  private suggestCLSOptimizations(cls: number): void {
    console.log('💡 CLS Optimization Suggestions:');

    if (cls > 0.25) {
      console.log('- Always include size attributes for images and videos');
      console.log('- Never insert content above existing content');
      console.log('- Reserve space for dynamic content');
      console.log('- Use font-display: swap for custom fonts');
    } else if (cls > 0.1) {
      console.log('- Ensure images have dimensions');
      console.log('- Use transform animations instead of changing layout');
      console.log('- Avoid animations that change element size');
    }
  }

  private applyMobileOptimizations(): void {
    // Apply mobile-specific optimizations
    this.optimizeTouchInteractions();
    this.optimizeScrolling();
    this.configureViewport();
    this.enableAdaptivePerformance();
  }

  private optimizeTouchInteractions(): void {
    // Optimize touch events for mobile
    const touchElements = document.querySelectorAll('button, a, [role="button"]');

    touchElements.forEach(element => {
      // Add touch feedback
      (element as HTMLElement).addEventListener('touchstart', function() {
        this.style.transform = 'scale(0.98)';
      }, { passive: true });

      (element as HTMLElement).addEventListener('touchend', function() {
        this.style.transform = 'scale(1)';
      }, { passive: true });
    });

    // Use passive listeners for better scroll performance
    document.addEventListener('touchmove', () => {}, { passive: true });
  }

  private optimizeScrolling(): void {
    // Enable momentum scrolling on iOS
    const scrollableElements = document.querySelectorAll('.scrollable');

    scrollableElements.forEach(element => {
      (element as HTMLElement).style.webkitOverflowScrolling = 'touch';
      (element as HTMLElement).style.overflowY = 'auto';
    });

    // Smooth scroll for navigation
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
      anchor.addEventListener('click', (e) => {
        e.preventDefault();
        const target = document.querySelector(anchor.getAttribute('href') || '');
        if (target) {
          target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      });
    });
  }

  private configureViewport(): void {
    // Ensure proper viewport configuration
    const viewport = document.querySelector('meta[name="viewport"]');
    if (viewport) {
      viewport.setAttribute('content',
        'width=device-width, initial-scale=1.0, viewport-fit=cover, interactive-widget=overlays-content'
      );
    }
  }

  private enableAdaptivePerformance(): void {
    // Adjust performance based on device capabilities
    const { isLowEndDevice, isSlowConnection } = this.deviceCapabilities;

    if (isLowEndDevice || isSlowConnection) {
      // Reduce animations and effects
      document.body.classList.add('reduce-motion');

      // Disable non-essential features
      this.disableNonEssentialFeatures();

      // Increase timeouts for better UX
      this.adjustTimeouts();
    }
  }

  private disableNonEssentialFeatures(): void {
    // Disable animations on low-end devices
    const style = document.createElement('style');
    style.textContent = `
      .reduce-motion * {
        animation-duration: 0.01ms !important;
        animation-iteration-count: 1 !important;
        transition-duration: 0.01ms !important;
      }
    `;
    document.head.appendChild(style);

    // Disable parallax effects
    document.querySelectorAll('[data-parallax]').forEach(element => {
      element.removeAttribute('data-parallax');
    });
  }

  private adjustTimeouts(): void {
    // Increase timeouts for better UX on slow devices
    (window as any).setTimeout = ((originalSetTimeout) => {
      return function(callback: Function, delay: number) {
        return originalSetTimeout(callback, delay * 1.5);
      };
    })(window.setTimeout);
  }

  // Public API methods
  public getMetrics(): Map<string, number> {
    return new Map(this.metrics);
  }

  public getPerformanceProfile(): PerformanceProfile {
    return { ...this.performanceProfile };
  }

  public getDeviceCapabilities(): DeviceCapabilities {
    return { ...this.deviceCapabilities };
  }

  public getOptimizationStrategy(): OptimizationStrategy {
    return { ...this.optimizationStrategy };
  }

  public forceReoptimization(): void {
    this.isOptimized = false;
    this.optimizeForMobile();
  }

  public generatePerformanceReport(): object {
    return {
      deviceCapabilities: this.deviceCapabilities,
      performanceProfile: this.performanceProfile,
      optimizationStrategy: this.optimizationStrategy,
      metrics: Object.fromEntries(this.metrics),
      isOptimized: this.isOptimized,
      timestamp: new Date().toISOString(),
      recommendations: this.generateRecommendations()
    };
  }

  private generateRecommendations(): string[] {
    const recommendations: string[] = [];
    const metrics = Object.fromEntries(this.metrics);

    if (metrics.lcp > 2500) {
      recommendations.push('Largest Contentful Paint is slow. Consider image optimization and server response improvements.');
    }

    if (metrics.fid > 100) {
      recommendations.push('First Input Delay is high. Reduce JavaScript execution time and code split bundles.');
    }

    if (metrics.cls > 0.1) {
      recommendations.push('Cumulative Layout Shift is high. Ensure all images have dimensions and reserve space for dynamic content.');
    }

    if (this.deviceCapabilities.isLowEndDevice) {
      recommendations.push('Low-end device detected. Consider reducing animations and deferring non-critical features.');
    }

    if (this.deviceCapabilities.isSlowConnection) {
      recommendations.push('Slow connection detected. Implement aggressive caching and data compression.');
    }

    if (recommendations.length === 0) {
      recommendations.push('Great job! All Core Web Vitals are within recommended thresholds.');
    }

    return recommendations;
  }
}

// Export singleton instance
export const coreWebVitalsOptimizer = CoreWebVitalsOptimizer.getInstance();

// Convenience exports
export const initializeMobileOptimization = () => coreWebVitalsOptimizer.optimizeForMobile();
export const getMobileMetrics = () => coreWebVitalsOptimizer.getMetrics();
export const getMobilePerformanceReport = () => coreWebVitalsOptimizer.generatePerformanceReport();

// Development debugging
if (import.meta.env.DEV) {
  (window as any).mobileOptimizer = {
    optimize: initializeMobileOptimization,
    getMetrics: getMobileMetrics,
    getReport: getMobilePerformanceReport,
    forceReoptimization: () => coreWebVitalsOptimizer.forceReoptimization(),
    getProfile: () => coreWebVitalsOptimizer.getPerformanceProfile(),
    getCapabilities: () => coreWebVitalsOptimizer.getDeviceCapabilities()
  };
}