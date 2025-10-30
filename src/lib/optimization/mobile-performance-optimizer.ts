/**
 * Advanced Mobile Performance Optimization System
 * for luxury beauty and fitness booking platform
 *
 * Provides intelligent optimization based on device capabilities,
 * network conditions, and user behavior patterns
 */

import { mobileExperienceMonitor } from '../mobile-experience-monitoring';
import { coreWebVitalsMonitor } from '../core-web-vitals-monitoring';
import { trackRUMEvent } from '../rum';

// Network quality levels for adaptive loading
export enum NetworkQuality {
  SLOW = 'slow',        // 2G, < 150kbps
  MODERATE = 'moderate', // 3G, 150-700kbps
  GOOD = 'good',        // 4G, 700kbps-2Mbps
  EXCELLENT = 'excellent' // 5G/WiFi, > 2Mbps
}

// Device performance tiers
export enum DevicePerformanceTier {
  LOW = 'low',          // Older devices, < 2GB RAM, slow CPU
  MEDIUM = 'medium',    // Mid-range devices, 2-4GB RAM
  HIGH = 'high',        // Modern devices, 4-8GB RAM
  PREMIUM = 'premium'   // Flagship devices, > 8GB RAM, fast CPU
}

// Optimization strategies
export interface OptimizationStrategy {
  // Image optimization
  images: {
    quality: number;           // 0-100
    format: 'auto' | 'webp' | 'avif' | 'jpeg';
    lazyLoading: boolean;
    progressiveLoading: boolean;
    maxDimension: number;
    compressionLevel: number;
  };

  // Asset optimization
  assets: {
    preloadCritical: boolean;
    deferNonCritical: boolean;
    minifyThirdParty: boolean;
    bundleSplitting: boolean;
    codeSplitting: boolean;
  };

  // Animation optimization
  animations: {
    enabled: boolean;
    reducedMotion: boolean;
    frameRate: number;         // 30, 60, 120
    complexity: 'minimal' | 'normal' | 'enhanced';
    gpuAcceleration: boolean;
  };

  // Feature optimization
  features: {
    enhancedInteractions: boolean;
    hapticFeedback: boolean;
    backgroundSync: boolean;
    pushNotifications: boolean;
    advancedAnimations: boolean;
  };

  // Network optimization
  network: {
    requestBatching: boolean;
    compressionEnabled: boolean;
    cachingAggressive: boolean;
    offlineFirst: boolean;
    predictivePreloading: boolean;
  };
}

// Performance context
interface PerformanceContext {
  networkQuality: NetworkQuality;
  deviceTier: DevicePerformanceTier;
  batteryLevel: number;
  thermalState: 'nominal' | 'fair' | 'serious' | 'critical';
  memoryPressure: 'low' | 'medium' | 'high';
  connectionType: string;
  deviceMemory: number;
  hardwareConcurrency: number;
  pixelRatio: number;
  viewportSize: { width: number; height: number };
}

// Optimization recommendation
interface OptimizationRecommendation {
  id: string;
  type: 'image' | 'asset' | 'animation' | 'feature' | 'network';
  priority: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  impact: {
    performanceGain: number;    // 0-100%
    dataReduction: number;      // 0-100%
    batterySaving: number;      // 0-100%
    userExperience: number;     // 0-100%
  };
  implementation: {
    difficulty: 'easy' | 'moderate' | 'complex';
    timeRequired: string;
    rollbackRisk: 'low' | 'medium' | 'high';
  };
  code: string;
  autoApply: boolean;
}

class MobilePerformanceOptimizer {
  private static instance: MobilePerformanceOptimizer;
  private isInitialized = false;
  private currentContext: PerformanceContext;
  private currentStrategy: OptimizationStrategy;
  private performanceHistory: PerformanceContext[] = [];
  private recommendations: OptimizationRecommendation[] = [];
  private optimizationEnabled = true;
  private networkObserver?: NetworkInformation;
  private batteryMonitor?: any;
  private memoryMonitor?: any;
  private lastOptimizationUpdate = 0;

  // Predefined optimization strategies
  private strategies: Record<DevicePerformanceTier, Record<NetworkQuality, OptimizationStrategy>> = {
    [DevicePerformanceTier.LOW]: {
      [NetworkQuality.SLOW]: this.createLowEndSlowStrategy(),
      [NetworkQuality.MODERATE]: this.createLowEndModerateStrategy(),
      [NetworkQuality.GOOD]: this.createLowEndGoodStrategy(),
      [NetworkQuality.EXCELLENT]: this.createLowEndExcellentStrategy(),
    },
    [DevicePerformanceTier.MEDIUM]: {
      [NetworkQuality.SLOW]: this.createMidEndSlowStrategy(),
      [NetworkQuality.MODERATE]: this.createMidEndModerateStrategy(),
      [NetworkQuality.GOOD]: this.createMidEndGoodStrategy(),
      [NetworkQuality.EXCELLENT]: this.createMidEndExcellentStrategy(),
    },
    [DevicePerformanceTier.HIGH]: {
      [NetworkQuality.SLOW]: this.createHighEndSlowStrategy(),
      [NetworkQuality.MODERATE]: this.createHighEndModerateStrategy(),
      [NetworkQuality.GOOD]: this.createHighEndGoodStrategy(),
      [NetworkQuality.EXCELLENT]: this.createHighEndExcellentStrategy(),
    },
    [DevicePerformanceTier.PREMIUM]: {
      [NetworkQuality.SLOW]: this.createPremiumSlowStrategy(),
      [NetworkQuality.MODERATE]: this.createPremiumModerateStrategy(),
      [NetworkQuality.GOOD]: this.createPremiumGoodStrategy(),
      [NetworkQuality.EXCELLENT]: this.createPremiumExcellentStrategy(),
    },
  };

  private constructor() {
    this.currentContext = this.assessInitialContext();
    this.currentStrategy = this.selectOptimalStrategy(this.currentContext);
  }

  static getInstance(): MobilePerformanceOptimizer {
    if (!MobilePerformanceOptimizer.instance) {
      MobilePerformanceOptimizer.instance = new MobilePerformanceOptimizer();
    }
    return MobilePerformanceOptimizer.instance;
  }

  // Initialize the optimizer
  initialize(): void {
    if (this.isInitialized) return;

    try {
      this.initializeNetworkMonitoring();
      this.initializeBatteryMonitoring();
      this.initializeMemoryMonitoring();
      this.initializePerformanceMonitoring();
      this.initializeAdaptiveOptimizations();
      this.initializePredictiveOptimizations();
      this.startContinuousOptimization();

      this.isInitialized = true;
      console.log('[Mobile Performance Optimizer] Advanced optimization system initialized');

      // Apply initial optimizations
      this.applyCurrentStrategy();

      // Track initialization
      trackRUMEvent('mobile-optimizer-initialized', {
        deviceTier: this.currentContext.deviceTier,
        networkQuality: this.currentContext.networkQuality,
        strategy: this.getStrategyName(this.currentStrategy),
        timestamp: Date.now()
      });
    } catch (error) {
      console.warn('[Mobile Performance Optimizer] Failed to initialize:', error);
    }
  }

  // Assess initial performance context
  private assessInitialContext(): PerformanceContext {
    const connection = this.getNetworkConnection();
    const networkQuality = this.assessNetworkQuality(connection);
    const deviceTier = this.assessDevicePerformanceTier();

    return {
      networkQuality,
      deviceTier,
      batteryLevel: 1.0, // Will be updated by battery monitor
      thermalState: 'nominal',
      memoryPressure: 'low',
      connectionType: connection?.type || 'unknown',
      deviceMemory: (navigator as any).deviceMemory || 4,
      hardwareConcurrency: navigator.hardwareConcurrency || 4,
      pixelRatio: window.devicePixelRatio || 1,
      viewportSize: {
        width: window.innerWidth,
        height: window.innerHeight
      }
    };
  }

  // Get network connection information
  private getNetworkConnection(): NetworkInformation | null {
    if ('connection' in navigator) {
      return (navigator as any).connection;
    }
    return null;
  }

  // Assess network quality
  private assessNetworkQuality(connection: NetworkInformation | null): NetworkQuality {
    if (!connection) {
      return NetworkQuality.MODERATE; // Conservative default
    }

    const { downlink, effectiveType, rtt } = connection;

    // Use multiple factors for accurate assessment
    if (downlink >= 2 || effectiveType === '5g' || (effectiveType === '4g' && rtt < 100)) {
      return NetworkQuality.EXCELLENT;
    } else if (downlink >= 0.7 || effectiveType === '4g') {
      return NetworkQuality.GOOD;
    } else if (downlink >= 0.15 || effectiveType === '3g') {
      return NetworkQuality.MODERATE;
    } else {
      return NetworkQuality.SLOW;
    }
  }

  // Assess device performance tier
  private assessDevicePerformanceTier(): DevicePerformanceTier {
    const deviceMemory = (navigator as any).deviceMemory || 4;
    const hardwareConcurrency = navigator.hardwareConcurrency || 4;
    const userAgent = navigator.userAgent;

    // Check for high-end indicators
    const isHighEnd = this.checkHighEndIndicators(userAgent);

    // Calculate performance score
    const memoryScore = Math.min(deviceMemory / 16, 1); // Normalize to 16GB
    const cpuScore = Math.min(hardwareConcurrency / 12, 1); // Normalize to 12 cores
    const performanceScore = (memoryScore + cpuScore) / 2;

    if (isHighEnd && performanceScore >= 0.8) {
      return DevicePerformanceTier.PREMIUM;
    } else if (performanceScore >= 0.6) {
      return DevicePerformanceTier.HIGH;
    } else if (performanceScore >= 0.3) {
      return DevicePerformanceTier.MEDIUM;
    } else {
      return DevicePerformanceTier.LOW;
    }
  }

  // Check for high-end device indicators
  private checkHighEndIndicators(userAgent: string): boolean {
    const highEndIndicators = [
      'iPhone 1[4-9]',  // iPhone 14-19
      'Pixel [6-9]',
      'Galaxy S2[0-9]',
      'SM-G99',         // Galaxy S9x series
      'SM-S91',         // Galaxy S2x series
      'iPad Pro',
      'Macintosh',
      'Windows NT'
    ];

    return highEndIndicators.some(indicator => new RegExp(indicator).test(userAgent));
  }

  // Select optimal strategy based on context
  private selectOptimalStrategy(context: PerformanceContext): OptimizationStrategy {
    return this.strategies[context.deviceTier][context.networkQuality];
  }

  // Initialize network monitoring
  private initializeNetworkMonitoring(): void {
    const connection = this.getNetworkConnection();
    if (!connection) return;

    this.networkObserver = connection;

    // Monitor network changes
    const handleNetworkChange = () => {
      const newNetworkQuality = this.assessNetworkQuality(connection);

      if (newNetworkQuality !== this.currentContext.networkQuality) {
        this.currentContext.networkQuality = newNetworkQuality;
        this.currentContext.connectionType = connection.type || 'unknown';

        this.adaptToNetworkChange();

        trackRUMEvent('mobile-network-quality-change', {
          from: this.currentContext.networkQuality,
          to: newNetworkQuality,
          connectionType: connection.type,
          downlink: connection.downlink,
          rtt: connection.rtt,
          timestamp: Date.now()
        });
      }
    };

    connection.addEventListener('change', handleNetworkChange);
    connection.addEventListener('typechange', handleNetworkChange);
  }

  // Initialize battery monitoring
  private initializeBatteryMonitoring(): void {
    if ('getBattery' in navigator) {
      (navigator as any).getBattery().then((battery: any) => {
        this.batteryMonitor = battery;

        const updateBatteryStatus = () => {
          const newLevel = battery.level;
          const oldLevel = this.currentContext.batteryLevel;

          this.currentContext.batteryLevel = newLevel;

          // Optimize for low battery
          if (newLevel < 0.2 && oldLevel >= 0.2) {
            this.optimizeForLowBattery();
          } else if (newLevel >= 0.5 && oldLevel < 0.5) {
            this.optimizeForNormalBattery();
          }

          trackRUMEvent('mobile-battery-level', {
            level: Math.round(newLevel * 100),
            charging: battery.charging,
            timestamp: Date.now()
          });
        };

        updateBatteryStatus();
        battery.addEventListener('levelchange', updateBatteryStatus);
        battery.addEventListener('chargingchange', updateBatteryStatus);
      });
    }
  }

  // Initialize memory monitoring
  private initializeMemoryMonitoring(): void {
    if ('memory' in performance) {
      setInterval(() => {
        const memory = (performance as any).memory;
        const usedJSHeapSize = memory.usedJSHeapSize;
        const jsHeapSizeLimit = memory.jsHeapSizeLimit;
        const memoryPressure = usedJSHeapSize / jsHeapSizeLimit;

        let newMemoryPressure: 'low' | 'medium' | 'high' = 'low';
        if (memoryPressure > 0.8) {
          newMemoryPressure = 'high';
        } else if (memoryPressure > 0.6) {
          newMemoryPressure = 'medium';
        }

        if (newMemoryPressure !== this.currentContext.memoryPressure) {
          this.currentContext.memoryPressure = newMemoryPressure;
          this.adaptToMemoryPressure();
        }

        trackRUMEvent('mobile-memory-pressure', {
          pressure: newMemoryPressure,
          used: Math.round(usedJSHeapSize / 1024 / 1024),
          limit: Math.round(jsHeapSizeLimit / 1024 / 1024),
          timestamp: Date.now()
        });
      }, 30000); // Every 30 seconds
    }
  }

  // Initialize performance monitoring
  private initializePerformanceMonitoring(): void {
    // Monitor Core Web Vitals and adjust strategy
    setInterval(() => {
      const performanceScore = coreWebVitalsMonitor.getCurrentPerformanceScore();
      const mobileScore = mobileExperienceMonitor.getMobileExperienceScore();

      if (performanceScore < 70 || mobileScore.overall < 70) {
        this.optimizeForPoorPerformance();
      }
    }, 60000); // Every minute
  }

  // Initialize adaptive optimizations
  private initializeAdaptiveOptimizations(): void {
    // Monitor page performance and adapt
    this.monitorPagePerformance();

    // Monitor user interactions and adapt
    this.monitorUserInteractions();

    // Monitor resource loading and adapt
    this.monitorResourceLoading();
  }

  // Initialize predictive optimizations
  private initializePredictiveOptimizations(): void {
    // Predict user behavior and preload resources
    this.predictivePreloading();

    // Predict network issues and adjust
    this.predictiveNetworkOptimization();

    // Predict performance bottlenecks
    this.predictivePerformanceOptimization();
  }

  // Start continuous optimization
  private startContinuousOptimization(): void {
    // Reassess and update strategy periodically
    setInterval(() => {
      this.reassessAndOptimize();
    }, 300000); // Every 5 minutes

    // Monitor for context changes
    setInterval(() => {
      this.monitorContextChanges();
    }, 10000); // Every 10 seconds
  }

  // Apply current optimization strategy
  private applyCurrentStrategy(): void {
    this.applyImageOptimizations();
    this.applyAssetOptimizations();
    this.applyAnimationOptimizations();
    this.applyFeatureOptimizations();
    this.applyNetworkOptimizations();

    this.lastOptimizationUpdate = Date.now();

    trackRUMEvent('mobile-optimization-applied', {
      strategy: this.getStrategyName(this.currentStrategy),
      deviceTier: this.currentContext.deviceTier,
      networkQuality: this.currentContext.networkQuality,
      timestamp: Date.now()
    });
  }

  // Apply image optimizations
  private applyImageOptimizations(): void {
    const { images } = this.currentStrategy;

    // Create image optimization rules
    const style = document.createElement('style');
    style.textContent = `
      /* Mobile Performance Optimizer - Image Optimizations */
      img {
        ${images.compressionLevel < 80 ? 'image-rendering: optimizeSpeed;' : ''}
        ${images.progressiveLoading ? 'transition: opacity 0.3s ease-in-out;' : ''}
      }

      ${images.lazyLoading ? `
        img[data-src] {
          opacity: 0;
          transition: opacity 0.3s ease-in-out;
        }
        img[data-src].loaded {
          opacity: 1;
        }
      ` : ''}
    `;
    document.head.appendChild(style);

    // Apply lazy loading
    if (images.lazyLoading) {
      this.setupImageLazyLoading();
    }

    // Optimize existing images
    this.optimizeExistingImages();
  }

  // Setup image lazy loading
  private setupImageLazyLoading(): void {
    const imageObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target as HTMLImageElement;
          const src = img.getAttribute('data-src');
          if (src) {
            img.src = src;
            img.classList.add('loaded');
            imageObserver.unobserve(img);
          }
        }
      });
    }, {
      rootMargin: '50px 0px'
    });

    document.querySelectorAll('img[data-src]').forEach(img => {
      imageObserver.observe(img);
    });
  }

  // Optimize existing images
  private optimizeExistingImages(): void {
    const images = document.querySelectorAll('img:not([data-optimized])');
    const { images: imageStrategy } = this.currentStrategy;

    images.forEach(img => {
      const htmlImg = img as HTMLImageElement;

      // Mark as optimized
      htmlImg.setAttribute('data-optimized', 'true');

      // Apply format optimization (would require server-side support)
      if (imageStrategy.format !== 'auto') {
        const currentSrc = htmlImg.src;
        if (currentSrc && !currentSrc.includes('format=')) {
          // This would typically use a CDN service like Cloudinary, ImageKit, etc.
          // For now, we'll just mark it for optimization
          htmlImg.setAttribute('data-needs-format-optimization', imageStrategy.format);
        }
      }

      // Apply dimension constraints
      if (imageStrategy.maxDimension > 0) {
        const rect = htmlImg.getBoundingClientRect();
        if (rect.width > imageStrategy.maxDimension || rect.height > imageStrategy.maxDimension) {
          htmlImg.style.maxWidth = `${imageStrategy.maxDimension}px`;
          htmlImg.style.maxHeight = `${imageStrategy.maxDimension}px`;
        }
      }
    });
  }

  // Apply asset optimizations
  private applyAssetOptimizations(): void {
    const { assets } = this.currentStrategy;

    // Preload critical resources
    if (assets.preloadCritical) {
      this.preloadCriticalResources();
    }

    // Defer non-critical resources
    if (assets.deferNonCritical) {
      this.deferNonCriticalResources();
    }

    // Minify third-party scripts
    if (assets.minifyThirdParty) {
      this.optimizeThirdPartyScripts();
    }
  }

  // Preload critical resources
  private preloadCriticalResources(): void {
    const criticalResources = [
      { href: '/fonts/inter-var.woff2', as: 'font', type: 'font/woff2', crossOrigin: 'anonymous' },
      { href: '/css/critical.css', as: 'style' },
      { href: '/images/hero-bg.webp', as: 'image' }
    ];

    criticalResources.forEach(resource => {
      const link = document.createElement('link');
      link.rel = 'preload';
      Object.entries(resource).forEach(([key, value]) => {
        link.setAttribute(key, value as string);
      });
      document.head.appendChild(link);
    });
  }

  // Defer non-critical resources
  private deferNonCriticalResources(): void {
    // Defer non-critical CSS
    const nonCriticalLinks = document.querySelectorAll('link[rel="stylesheet"]:not([data-critical])');
    nonCriticalLinks.forEach(link => {
      link.setAttribute('media', 'print');
      link.setAttribute('onload', 'this.media="all"');
    });

    // Defer non-critical scripts
    const nonCriticalScripts = document.querySelectorAll('script:not([data-critical]):not([src*="analytics"]):not([src*="gtag"])');
    nonCriticalScripts.forEach(script => {
      script.setAttribute('defer', '');
    });
  }

  // Optimize third-party scripts
  private optimizeThirdPartyScripts(): void {
    const thirdPartyScripts = document.querySelectorAll('script[src*="analytics"], script[src*="facebook"], script[src*="google"]');

    thirdPartyScripts.forEach(script => {
      // Add async loading if not already present
      if (!script.hasAttribute('async') && !script.hasAttribute('defer')) {
        script.setAttribute('async', '');
      }

      // Add loading optimization attributes
      script.setAttribute('data-optimized', 'true');
    });
  }

  // Apply animation optimizations
  private applyAnimationOptimizations(): void {
    const { animations } = this.currentStrategy;

    // Create animation optimization styles
    const style = document.createElement('style');
    style.textContent = `
      /* Mobile Performance Optimizer - Animation Optimizations */
      ${animations.reducedMotion ? `
        *, *::before, *::after {
          animation-duration: 0.01ms !important;
          animation-iteration-count: 1 !important;
          transition-duration: 0.01ms !important;
        }

        @media (prefers-reduced-motion: reduce) {
          *, *::before, *::after {
            animation-duration: 0.01ms !important;
            animation-iteration-count: 1 !important;
            transition-duration: 0.01ms !important;
          }
        }
      ` : ''}

      ${!animations.enabled ? `
        *, *::before, *::after {
          animation: none !important;
          transition: none !important;
        }
      ` : ''}

      ${animations.gpuAcceleration ? `
        .animate-gpu {
          transform: translateZ(0);
          backface-visibility: hidden;
          perspective: 1000px;
        }
      ` : ''}

      ${animations.frameRate < 60 ? `
        .performance-mode * {
          animation-timing-function: steps(10) !important;
        }
      ` : ''}
    `;

    document.head.appendChild(style);

    // Apply frame rate limiting
    if (animations.frameRate < 60) {
      this.limitFrameRate(animations.frameRate);
    }
  }

  // Limit frame rate for performance
  private limitFrameRate(targetFPS: number): void {
    let fpsInterval: number;
    let then = performance.now();
    let animationId: number;

    const animate = (now: number) => {
      animationId = requestAnimationFrame(animate);

      fpsInterval = 1000 / targetFPS;
      const elapsed = now - then;

      if (elapsed > fpsInterval) {
        then = now - (elapsed % fpsInterval);
        // Trigger custom event for frame-limited animations
        window.dispatchEvent(new CustomEvent('performance-frame'));
      }
    };

    animate(performance.now());
  }

  // Apply feature optimizations
  private applyFeatureOptimizations(): void {
    const { features } = this.currentStrategy;

    // Store feature flags in localStorage for consistency
    localStorage.setItem('mobile-features-optimized', JSON.stringify(features));

    // Disable expensive features if needed
    if (!features.enhancedInteractions) {
      this.disableEnhancedInteractions();
    }

    if (!features.hapticFeedback) {
      this.disableHapticFeedback();
    }

    if (!features.backgroundSync) {
      this.disableBackgroundSync();
    }

    if (!features.advancedAnimations) {
      this.disableAdvancedAnimations();
    }
  }

  // Disable enhanced interactions
  private disableEnhancedInteractions(): void {
    // Remove complex hover effects and transitions
    const interactiveElements = document.querySelectorAll('.hover-effect, .interactive');
    interactiveElements.forEach(element => {
      element.classList.add('simple-interaction');
    });
  }

  // Disable haptic feedback
  private disableHapticFeedback(): void {
    // Override haptic feedback functions
    (window as any).vibrate = () => false;
  }

  // Disable background sync
  private disableBackgroundSync(): void {
    // Unregister background sync
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then(registration => {
        if (registration.sync) {
          registration.sync.getTags().then(tags => {
            tags.forEach(tag => registration.sync.unregister(tag));
          });
        }
      });
    }
  }

  // Disable advanced animations
  private disableAdvancedAnimations(): void {
    const advancedAnimations = document.querySelectorAll('.advanced-animation, .complex-animation');
    advancedAnimations.forEach(element => {
      element.classList.add('animation-disabled');
    });
  }

  // Apply network optimizations
  private applyNetworkOptimizations(): void {
    const { network } = this.currentStrategy;

    // Request batching
    if (network.requestBatching) {
      this.enableRequestBatching();
    }

    // Aggressive caching
    if (network.cachingAggressive) {
      this.enableAggressiveCaching();
    }

    // Offline-first approach
    if (network.offlineFirst) {
      this.enableOfflineFirst();
    }

    // Predictive preloading
    if (network.predictivePreloading) {
      this.enablePredictivePreloading();
    }
  }

  // Enable request batching
  private enableRequestBatching(): void {
    // Batch API requests to reduce overhead
    const originalFetch = window.fetch;

    (window as any).batchedFetch = (requests: any[]) => {
      return Promise.all(requests.map(req => originalFetch(req.url, req.options)));
    };
  }

  // Enable aggressive caching
  private enableAggressiveCaching(): void {
    // Cache resources aggressively
    if ('caches' in window) {
      caches.open('mobile-performance-cache').then(cache => {
        // Cache critical resources
        const criticalUrls = [
          '/',
          '/api/services',
          '/api/availability'
        ];

        criticalUrls.forEach(url => {
          cache.add(url).catch(() => {
            // Ignore caching errors
          });
        });
      });
    }
  }

  // Enable offline-first approach
  private enableOfflineFirst(): void {
    // Store essential data for offline use
    const essentialData = {
      services: JSON.parse(localStorage.getItem('cached-services') || '[]'),
      lastSync: Date.now()
    };

    localStorage.setItem('offline-essential-data', JSON.stringify(essentialData));
  }

  // Enable predictive preloading
  private enablePredictivePreloading(): void {
    // Monitor user behavior and preload likely resources
    document.addEventListener('click', (event) => {
      const target = event.target as HTMLElement;
      const link = target.closest('a');

      if (link && link.href) {
        // Preload the linked page
        const prefetchLink = document.createElement('link');
        prefetchLink.rel = 'prefetch';
        prefetchLink.href = link.href;
        document.head.appendChild(prefetchLink);
      }
    });
  }

  // Monitor page performance
  private monitorPagePerformance(): void {
    if ('PerformanceObserver' in window) {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();

        entries.forEach(entry => {
          if (entry.entryType === 'measure') {
            const measure = entry as PerformanceMeasure;

            if (measure.duration > 3000) { // Slow operation
              this.handleSlowPerformance(measure.name, measure.duration);
            }
          }
        });
      });

      observer.observe({ entryTypes: ['measure'] });
    }
  }

  // Monitor user interactions
  private monitorUserInteractions(): void {
    let interactionCount = 0;
    let slowInteractions = 0;

    document.addEventListener('click', (event) => {
      const startTime = performance.now();
      interactionCount++;

      // Check if interaction response is slow
      setTimeout(() => {
        const responseTime = performance.now() - startTime;
        if (responseTime > 300) {
          slowInteractions++;

          if (slowInteractions / interactionCount > 0.3) {
            this.handleSlowInteractions();
          }
        }
      }, 100);
    });
  }

  // Monitor resource loading
  private monitorResourceLoading(): void {
    if ('PerformanceObserver' in window) {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();

        entries.forEach(entry => {
          if (entry.entryType === 'resource') {
            const resource = entry as PerformanceResourceTiming;

            if (resource.duration > 5000) { // Slow resource
              this.handleSlowResource(resource);
            }
          }
        });
      });

      observer.observe({ entryTypes: ['resource'] });
    }
  }

  // Predictive preloading based on user behavior
  private predictivePreloading(): void {
    const userPatterns = this.analyzeUserPatterns();

    userPatterns.patterns.forEach(pattern => {
      if (pattern.confidence > 0.7) {
        this.preloadResourcePattern(pattern);
      }
    });
  }

  // Analyze user patterns
  private analyzeUserPatterns(): any {
    // Analyze localStorage data, session history, etc.
    const visitHistory = JSON.parse(localStorage.getItem('visit-history') || '[]');
    const bookingHistory = JSON.parse(localStorage.getItem('booking-history') || '[]');

    return {
      patterns: [
        {
          type: 'service-browsing',
          confidence: 0.8,
          resources: ['/api/beauty-services', '/api/fitness-services']
        },
        {
          type: 'booking-flow',
          confidence: 0.9,
          resources: ['/api/availability', '/api/booking-slots']
        }
      ]
    };
  }

  // Preload resource pattern
  private preloadResourcePattern(pattern: any): void {
    pattern.resources.forEach((resource: string) => {
      const link = document.createElement('link');
      link.rel = 'prefetch';
      link.href = resource;
      document.head.appendChild(link);
    });
  }

  // Predictive network optimization
  private predictiveNetworkOptimization(): void {
    // Monitor network patterns and predict issues
    const connection = this.getNetworkConnection();

    if (connection) {
      connection.addEventListener('change', () => {
        if (connection.downlink < 0.5) {
          this.prepareForSlowNetwork();
        }
      });
    }
  }

  // Prepare for slow network
  private prepareForSlowNetwork(): void {
    // Reduce image quality, defer non-critical resources
    this.currentStrategy.images.quality = 50;
    this.currentStrategy.assets.deferNonCritical = true;
    this.applyCurrentStrategy();
  }

  // Predictive performance optimization
  private predictivePerformanceOptimization(): void {
    // Monitor performance trends and predict bottlenecks
    const performanceHistory = this.performanceHistory.slice(-10);

    if (performanceHistory.length >= 5) {
      const trend = this.calculatePerformanceTrend(performanceHistory);

      if (trend < -0.1) { // Declining performance
        this.optimizeForPerformanceTrend();
      }
    }
  }

  // Calculate performance trend
  private calculatePerformanceTrend(history: PerformanceContext[]): number {
    // Simple linear regression to detect trends
    const n = history.length;
    let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;

    history.forEach((context, index) => {
      const x = index;
      const y = this.calculateContextScore(context);
      sumX += x;
      sumY += y;
      sumXY += x * y;
      sumX2 += x * x;
    });

    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    return slope;
  }

  // Calculate context score
  private calculateContextScore(context: PerformanceContext): number {
    let score = 50; // Base score

    // Network quality contribution
    const networkScores = {
      [NetworkQuality.EXCELLENT]: 25,
      [NetworkQuality.GOOD]: 15,
      [NetworkQuality.MODERATE]: 5,
      [NetworkQuality.SLOW]: -10
    };
    score += networkScores[context.networkQuality];

    // Device tier contribution
    const deviceScores = {
      [DevicePerformanceTier.PREMIUM]: 25,
      [DevicePerformanceTier.HIGH]: 15,
      [DevicePerformanceTier.MEDIUM]: 5,
      [DevicePerformanceTier.LOW]: -5
    };
    score += deviceScores[context.deviceTier];

    // Battery level contribution
    score += (context.batteryLevel - 0.5) * 10;

    // Memory pressure contribution
    const memoryScores = {
      'low': 5,
      'medium': 0,
      'high': -10
    };
    score += memoryScores[context.memoryPressure];

    return Math.max(0, Math.min(100, score));
  }

  // Handle slow performance
  private handleSlowPerformance(operation: string, duration: number): void {
    trackRUMEvent('mobile-slow-operation', {
      operation,
      duration,
      timestamp: Date.now()
    });

    this.createOptimizationRecommendation({
      type: 'performance',
      priority: 'high',
      description: `Slow ${operation} detected (${Math.round(duration)}ms)`,
      impact: {
        performanceGain: 30,
        dataReduction: 0,
        batterySaving: 20,
        userExperience: 40
      }
    });
  }

  // Handle slow interactions
  private handleSlowInteractions(): void {
    // Reduce interaction complexity
    this.currentStrategy.animations.complexity = 'minimal';
    this.currentStrategy.features.enhancedInteractions = false;
    this.applyCurrentStrategy();
  }

  // Handle slow resource
  private handleSlowResource(resource: PerformanceResourceTiming): void {
    trackRUMEvent('mobile-slow-resource', {
      name: resource.name,
      duration: resource.duration,
      size: resource.transferSize,
      timestamp: Date.now()
    });

    // Optimize resource loading
    if (resource.name.includes('.jpg') || resource.name.includes('.png')) {
      this.currentStrategy.images.quality = Math.max(this.currentStrategy.images.quality - 20, 30);
    }
  }

  // Adapt to network change
  private adaptToNetworkChange(): void {
    this.currentStrategy = this.selectOptimalStrategy(this.currentContext);
    this.applyCurrentStrategy();
  }

  // Optimize for low battery
  private optimizeForLowBattery(): void {
    // Reduce performance to save battery
    this.currentStrategy.animations.enabled = false;
    this.currentStrategy.features.backgroundSync = false;
    this.currentStrategy.network.cachingAggressive = true;
    this.applyCurrentStrategy();
  }

  // Optimize for normal battery
  private optimizeForNormalBattery(): void {
    // Restore normal performance
    this.currentStrategy = this.selectOptimalStrategy(this.currentContext);
    this.applyCurrentStrategy();
  }

  // Adapt to memory pressure
  private adaptToMemoryPressure(): void {
    if (this.currentContext.memoryPressure === 'high') {
      // Reduce memory usage
      this.currentStrategy.assets.bundleSplitting = true;
      this.currentStrategy.images.compressionLevel = 60;
      this.applyCurrentStrategy();
    }
  }

  // Optimize for poor performance
  private optimizeForPoorPerformance(): void {
    // Apply aggressive optimizations
    this.currentStrategy.images.quality = 50;
    this.currentStrategy.animations.complexity = 'minimal';
    this.currentStrategy.features.advancedAnimations = false;
    this.applyCurrentStrategy();
  }

  // Optimize for performance trend
  private optimizeForPerformanceTrend(): void {
    // Proactive optimization
    this.currentStrategy.assets.preloadCritical = true;
    this.currentStrategy.network.predictivePreloading = true;
    this.applyCurrentStrategy();
  }

  // Reassess and optimize
  private reassessAndOptimize(): void {
    const newContext = this.assessInitialContext();
    const hasChanged = !this.contextsEqual(this.currentContext, newContext);

    if (hasChanged) {
      this.performanceHistory.push(this.currentContext);
      this.currentContext = newContext;
      this.currentStrategy = this.selectOptimalStrategy(this.currentContext);
      this.applyCurrentStrategy();

      trackRUMEvent('mobile-context-changed', {
        oldContext: this.currentContext,
        newContext,
        timestamp: Date.now()
      });
    }
  }

  // Monitor context changes
  private monitorContextChanges(): void {
    // Check for viewport changes
    const currentViewport = `${window.innerWidth}x${window.innerHeight}`;
    if (currentViewport !== `${this.currentContext.viewportSize.width}x${this.currentContext.viewportSize.height}`) {
      this.currentContext.viewportSize = {
        width: window.innerWidth,
        height: window.innerHeight
      };
    }
  }

  // Compare contexts for equality
  private contextsEqual(ctx1: PerformanceContext, ctx2: PerformanceContext): boolean {
    return ctx1.networkQuality === ctx2.networkQuality &&
           ctx1.deviceTier === ctx2.deviceTier &&
           ctx1.memoryPressure === ctx2.memoryPressure &&
           ctx1.viewportSize.width === ctx2.viewportSize.width &&
           ctx1.viewportSize.height === ctx2.viewportSize.height;
  }

  // Create optimization recommendation
  private createOptimizationRecommendation(data: Partial<OptimizationRecommendation>): void {
    const recommendation: OptimizationRecommendation = {
      id: `rec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: data.type || 'performance',
      priority: data.priority || 'medium',
      description: data.description || 'Performance optimization recommended',
      impact: data.impact || {
        performanceGain: 20,
        dataReduction: 10,
        batterySaving: 15,
        userExperience: 25
      },
      implementation: {
        difficulty: 'moderate',
        timeRequired: '1-2 hours',
        rollbackRisk: 'low'
      },
      code: this.generateOptimizationCode(data),
      autoApply: false
    };

    this.recommendations.push(recommendation);

    // Keep only recent recommendations
    if (this.recommendations.length > 50) {
      this.recommendations = this.recommendations.slice(-50);
    }
  }

  // Generate optimization code
  private generateOptimizationCode(data: Partial<OptimizationRecommendation>): string {
    switch (data.type) {
      case 'image':
        return `
// Image optimization
img {
  max-width: 100%;
  height: auto;
  object-fit: cover;
  loading: lazy;
}
        `;
      case 'animation':
        return `
// Animation optimization
.animate {
  animation-duration: 0.2s;
  transition-timing-function: ease-out;
}
        `;
      case 'network':
        return `
// Network optimization
fetch('/api/data', {
  headers: {
    'Cache-Control': 'max-age=300'
  }
});
        `;
      default:
        return '// Performance optimization code';
    }
  }

  // Get strategy name for logging
  private getStrategyName(strategy: OptimizationStrategy): string {
    const deviceTier = Object.values(DevicePerformanceTier).find(tier =>
      this.strategies[tier as DevicePerformanceTier][this.currentContext.networkQuality] === strategy
    );

    return `${deviceTier}_${this.currentContext.networkQuality}`;
  }

  // Strategy creation methods (simplified for brevity)
  private createLowEndSlowStrategy(): OptimizationStrategy {
    return {
      images: { quality: 30, format: 'jpeg', lazyLoading: true, progressiveLoading: false, maxDimension: 800, compressionLevel: 70 },
      assets: { preloadCritical: false, deferNonCritical: true, minifyThirdParty: true, bundleSplitting: true, codeSplitting: true },
      animations: { enabled: false, reducedMotion: true, frameRate: 30, complexity: 'minimal', gpuAcceleration: false },
      features: { enhancedInteractions: false, hapticFeedback: false, backgroundSync: false, pushNotifications: false, advancedAnimations: false },
      network: { requestBatching: true, compressionEnabled: true, cachingAggressive: true, offlineFirst: true, predictivePreloading: false }
    };
  }

  private createLowEndModerateStrategy(): OptimizationStrategy {
    return {
      ...this.createLowEndSlowStrategy(),
      images: { ...this.createLowEndSlowStrategy().images, quality: 40, progressiveLoading: true },
      animations: { ...this.createLowEndSlowStrategy().animations, enabled: true, frameRate: 30 }
    };
  }

  private createLowEndGoodStrategy(): OptimizationStrategy {
    return {
      ...this.createLowEndModerateStrategy(),
      images: { ...this.createLowEndModerateStrategy().images, quality: 50, format: 'webp' },
      animations: { ...this.createLowEndModerateStrategy().animations, frameRate: 60 },
      network: { ...this.createLowEndModerateStrategy().network, predictivePreloading: true }
    };
  }

  private createLowEndExcellentStrategy(): OptimizationStrategy {
    return {
      ...this.createLowEndGoodStrategy(),
      images: { ...this.createLowEndGoodStrategy().images, quality: 60 },
      features: { ...this.createLowEndGoodStrategy().features, enhancedInteractions: true }
    };
  }

  private createMidEndSlowStrategy(): OptimizationStrategy {
    return {
      ...this.createLowEndGoodStrategy(),
      assets: { ...this.createLowEndGoodStrategy().assets, preloadCritical: true },
      animations: { ...this.createLowEndGoodStrategy().animations, complexity: 'normal', gpuAcceleration: true }
    };
  }

  private createMidEndModerateStrategy(): OptimizationStrategy {
    return {
      ...this.createMidEndSlowStrategy(),
      images: { ...this.createMidEndSlowStrategy().images, quality: 60, maxDimension: 1200 },
      features: { ...this.createMidEndSlowStrategy().features, hapticFeedback: true }
    };
  }

  private createMidEndGoodStrategy(): OptimizationStrategy {
    return {
      ...this.createMidEndModerateStrategy(),
      images: { ...this.createMidEndModerateStrategy().images, quality: 70, format: 'auto' },
      animations: { ...this.createMidEndModerateStrategy().animations, complexity: 'enhanced' }
    };
  }

  private createMidEndExcellentStrategy(): OptimizationStrategy {
    return {
      ...this.createMidEndGoodStrategy(),
      features: { ...this.createMidEndGoodStrategy().features, advancedAnimations: true, pushNotifications: true }
    };
  }

  private createHighEndSlowStrategy(): OptimizationStrategy {
    return {
      ...this.createMidEndGoodStrategy(),
      images: { ...this.createMidEndGoodStrategy().images, quality: 70, maxDimension: 1600 },
      network: { ...this.createMidEndGoodStrategy().network, requestBatching: false }
    };
  }

  private createHighEndModerateStrategy(): OptimizationStrategy {
    return {
      ...this.createHighEndSlowStrategy(),
      images: { ...this.createHighEndSlowStrategy().images, quality: 80, progressiveLoading: true },
      animations: { ...this.createHighEndSlowStrategy().animations, frameRate: 60, complexity: 'enhanced' }
    };
  }

  private createHighEndGoodStrategy(): OptimizationStrategy {
    return {
      ...this.createHighEndModerateStrategy(),
      images: { ...this.createHighEndModerateStrategy().images, quality: 85, format: 'avif' },
      features: { ...this.createHighEndModerateStrategy().features, backgroundSync: true }
    };
  }

  private createHighEndExcellentStrategy(): OptimizationStrategy {
    return {
      ...this.createHighEndGoodStrategy(),
      images: { ...this.createHighEndGoodStrategy().images, quality: 90 },
      animations: { ...this.createHighEndGoodStrategy().animations, frameRate: 120 },
      network: { ...this.createHighEndGoodStrategy().network, predictivePreloading: true }
    };
  }

  private createPremiumSlowStrategy(): OptimizationStrategy {
    return {
      ...this.createHighEndGoodStrategy(),
      images: { ...this.createHighEndGoodStrategy().images, quality: 85, maxDimension: 2000 },
      features: { ...this.createHighEndGoodStrategy().features, enhancedInteractions: true, advancedAnimations: true }
    };
  }

  private createPremiumModerateStrategy(): OptimizationStrategy {
    return {
      ...this.createPremiumSlowStrategy(),
      images: { ...this.createPremiumSlowStrategy().images, quality: 90 },
      animations: { ...this.createPremiumSlowStrategy().animations, frameRate: 120, complexity: 'enhanced' }
    };
  }

  private createPremiumGoodStrategy(): OptimizationStrategy {
    return {
      ...this.createPremiumModerateStrategy(),
      images: { ...this.createPremiumModerateStrategy().images, quality: 95 },
      features: { ...this.createPremiumModerateStrategy().features, pushNotifications: true, backgroundSync: true }
    };
  }

  private createPremiumExcellentStrategy(): OptimizationStrategy {
    return {
      ...this.createPremiumGoodStrategy(),
      images: { ...this.createPremiumGoodStrategy().images, quality: 100 },
      network: { ...this.createPremiumGoodStrategy().network, requestBatching: false, predictivePreloading: true }
    };
  }

  // Public API methods

  // Get current performance context
  getCurrentContext(): PerformanceContext {
    return { ...this.currentContext };
  }

  // Get current optimization strategy
  getCurrentStrategy(): OptimizationStrategy {
    return { ...this.currentStrategy };
  }

  // Get optimization recommendations
  getRecommendations(): OptimizationRecommendation[] {
    return [...this.recommendations];
  }

  // Apply specific optimization strategy
  applyStrategy(strategy: Partial<OptimizationStrategy>): void {
    this.currentStrategy = { ...this.currentStrategy, ...strategy };
    this.applyCurrentStrategy();
  }

  // Force re-optimization
  reoptimize(): void {
    this.currentContext = this.assessInitialContext();
    this.currentStrategy = this.selectOptimalStrategy(this.currentContext);
    this.applyCurrentStrategy();
  }

  // Get performance score
  getPerformanceScore(): number {
    return this.calculateContextScore(this.currentContext);
  }

  // Enable/disable optimization
  setOptimizationEnabled(enabled: boolean): void {
    this.optimizationEnabled = enabled;
    if (enabled) {
      this.applyCurrentStrategy();
    }
  }

  // Export optimizer data
  exportData(): any {
    return {
      currentContext: this.currentContext,
      currentStrategy: this.currentStrategy,
      performanceHistory: this.performanceHistory,
      recommendations: this.recommendations,
      performanceScore: this.getPerformanceScore(),
      lastOptimizationUpdate: this.lastOptimizationUpdate,
      optimizationEnabled: this.optimizationEnabled
    };
  }
}

// Create and export singleton instance
export const mobilePerformanceOptimizer = MobilePerformanceOptimizer.getInstance();

// Initialize automatically
if (typeof window !== 'undefined') {
  if (document.readyState === 'complete') {
    mobilePerformanceOptimizer.initialize();
  } else {
    window.addEventListener('load', () => {
      mobilePerformanceOptimizer.initialize();
    });
  }
}

// Export helper functions
export const initializeMobilePerformanceOptimizer = () => mobilePerformanceOptimizer.initialize();
export const getCurrentPerformanceContext = () => mobilePerformanceOptimizer.getCurrentContext();
export const getCurrentOptimizationStrategy = () => mobilePerformanceOptimizer.getCurrentStrategy();
export const getOptimizationRecommendations = () => mobilePerformanceOptimizer.getRecommendations();
export const applyCustomOptimizationStrategy = (strategy: Partial<OptimizationStrategy>) =>
  mobilePerformanceOptimizer.applyStrategy(strategy);
export const reoptimizeMobilePerformance = () => mobilePerformanceOptimizer.reoptimize();
export const getMobilePerformanceScore = () => mobilePerformanceOptimizer.getPerformanceScore();
export const exportMobileOptimizerData = () => mobilePerformanceOptimizer.exportData();

// Export types
export {
  PerformanceContext,
  OptimizationStrategy,
  OptimizationRecommendation,
  NetworkQuality,
  DevicePerformanceTier
};