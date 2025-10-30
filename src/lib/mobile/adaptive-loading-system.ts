/**
 * Adaptive Loading System
 * Dynamically adjusts content loading based on device capabilities, network conditions, and user preferences
 */

interface AdaptiveConfig {
  deviceTier: 'high' | 'medium' | 'low';
  networkSpeed: 'fast' | 'medium' | 'slow';
  batteryLevel: 'high' | 'medium' | 'low';
  dataSaver: boolean;
  reducedMotion: boolean;
  customPreferences: {
    imageQuality: 'high' | 'medium' | 'low';
    enableAnimations: boolean;
    enableBackgroundData: boolean;
    preloadContent: boolean;
  };
}

interface LoadingStrategy {
  images: {
    quality: number;
    format: 'avif' | 'webp' | 'jpg';
    lazyLoading: boolean;
    placeholder: 'blur' | 'color' | 'skeleton';
    progressive: boolean;
  };
  videos: {
    autoplay: boolean;
    quality: '1080p' | '720p' | '480p' | '360p';
    preload: boolean;
    format: 'mp4' | 'webm';
  };
  content: {
    prefetchCritical: boolean;
    prefetchNonCritical: boolean;
    batchSize: number;
    loadingDelay: number;
    infiniteScroll: boolean;
  };
  animations: {
    enabled: boolean;
    duration: number;
    easing: string;
    reduced: boolean;
  };
  api: {
    cacheFirst: boolean;
    requestTimeout: number;
    retryAttempts: number;
    compressionEnabled: boolean;
    batchSize: number;
  };
}

interface ResourcePriority {
  level: 'critical' | 'high' | 'medium' | 'low';
  loadImmediately: boolean;
  preload: boolean;
  defer: boolean;
  fallback: string | null;
}

class AdaptiveLoadingSystem {
  private static instance: AdaptiveLoadingSystem;
  private config: AdaptiveConfig;
  private strategy: LoadingStrategy;
  private observer: IntersectionObserver | null = null;
  private loadingQueue: Map<string, Function> = new Map();
  private loadedResources: Set<string> = new Set();
  private isInitialized = false;

  private constructor() {
    this.detectEnvironment();
    this.setupStrategy();
    this.initializeObservers();
  }

  static getInstance(): AdaptiveLoadingSystem {
    if (!AdaptiveLoadingSystem.instance) {
      AdaptiveLoadingSystem.instance = new AdaptiveLoadingSystem();
    }
    return AdaptiveLoadingSystem.instance;
  }

  private detectEnvironment(): void {
    // Detect device tier
    const deviceTier = this.detectDeviceTier();

    // Detect network speed
    const networkSpeed = this.detectNetworkSpeed();

    // Detect battery level
    const batteryLevel = this.detectBatteryLevel();

    // Check for data saver preference
    const dataSaver = this.detectDataSaver();

    // Check for reduced motion preference
    const reducedMotion = this.detectReducedMotion();

    this.config = {
      deviceTier,
      networkSpeed,
      batteryLevel,
      dataSaver,
      reducedMotion,
      customPreferences: this.getUserPreferences()
    };

    console.log('🔍 Environment detected:', this.config);
  }

  private detectDeviceTier(): 'high' | 'medium' | 'low' {
    const memory = (navigator as any).deviceMemory || 4;
    const cores = navigator.hardwareConcurrency || 4;
    const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

    if (isMobile) {
      if (memory >= 6 && cores >= 6) return 'high';
      if (memory >= 4 && cores >= 4) return 'medium';
      return 'low';
    } else {
      if (memory >= 8 && cores >= 8) return 'high';
      if (memory >= 4 && cores >= 4) return 'medium';
      return 'low';
    }
  }

  private detectNetworkSpeed(): 'fast' | 'medium' | 'slow' {
    const connection = (navigator as any).connection ||
                      (navigator as any).mozConnection ||
                      (navigator as any).webkitConnection;

    if (!connection) {
      return 'fast'; // Assume fast if no info available
    }

    const effectiveType = connection.effectiveType;
    const downlink = connection.downlink;

    if (effectiveType === '4g' && downlink > 2) return 'fast';
    if (effectiveType === '3g' || downlink > 0.5) return 'medium';
    return 'slow';
  }

  private detectBatteryLevel(): 'high' | 'medium' | 'low' {
    // This would require Battery API, which has limited support
    // For now, return a default value
    return 'high';
  }

  private detectDataSaver(): boolean {
    return ('navigator' in window && 'connection' in navigator &&
            (navigator as any).connection &&
            (navigator as any).connection.saveData) || false;
  }

  private detectReducedMotion(): boolean {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  private getUserPreferences(): AdaptiveConfig['customPreferences'] {
    // Get user preferences from localStorage or use defaults
    const stored = localStorage.getItem('adaptive-loading-preferences');

    if (stored) {
      try {
        return JSON.parse(stored);
      } catch {
        // Fall back to defaults
      }
    }

    return {
      imageQuality: this.getDefaultImageQuality(),
      enableAnimations: !this.detectReducedMotion(),
      enableBackgroundData: !this.detectDataSaver(),
      preloadContent: this.config.networkSpeed !== 'slow'
    };
  }

  private getDefaultImageQuality(): 'high' | 'medium' | 'low' {
    const { deviceTier, networkSpeed, dataSaver } = this.config;

    if (dataSaver || networkSpeed === 'slow') return 'low';
    if (deviceTier === 'high' && networkSpeed === 'fast') return 'high';
    return 'medium';
  }

  private setupStrategy(): void {
    const { deviceTier, networkSpeed, dataSaver, reducedMotion, customPreferences } = this.config;

    // Determine image strategy
    const imageQuality = customPreferences.imageQuality === 'high' ? 85 :
                       customPreferences.imageQuality === 'medium' ? 70 : 50;

    // Determine image format
    const imageFormat = this.supportsFormat('avif') ? 'avif' :
                      this.supportsFormat('webp') ? 'webp' : 'jpg';

    // Determine video quality
    const videoQuality = deviceTier === 'high' && networkSpeed === 'fast' ? '1080p' :
                        deviceTier === 'medium' || networkSpeed === 'medium' ? '720p' : '480p';

    this.strategy = {
      images: {
        quality: imageQuality,
        format: imageFormat,
        lazyLoading: true,
        placeholder: networkSpeed === 'slow' ? 'color' : 'blur',
        progressive: networkSpeed !== 'slow'
      },
      videos: {
        autoplay: !dataSaver && customPreferences.enableBackgroundData,
        quality: videoQuality,
        preload: !dataSaver && networkSpeed !== 'slow',
        format: this.supportsFormat('webm') ? 'webm' : 'mp4'
      },
      content: {
        prefetchCritical: customPreferences.preloadContent,
        prefetchNonCritical: networkSpeed === 'fast',
        batchSize: deviceTier === 'low' ? 3 : deviceTier === 'medium' ? 6 : 10,
        loadingDelay: networkSpeed === 'slow' ? 500 : 200,
        infiniteScroll: deviceTier !== 'low' && networkSpeed !== 'slow'
      },
      animations: {
        enabled: customPreferences.enableAnimations && !reducedMotion,
        duration: reducedMotion ? 0 : (deviceTier === 'low' ? 200 : 300),
        easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
        reduced: reducedMotion
      },
      api: {
        cacheFirst: true,
        requestTimeout: networkSpeed === 'slow' ? 15000 : 8000,
        retryAttempts: networkSpeed === 'slow' ? 3 : 2,
        compressionEnabled: true,
        batchSize: deviceTier === 'low' ? 5 : 10
      }
    };

    console.log('📋 Loading strategy configured:', this.strategy);
  }

  private supportsFormat(format: string): boolean {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return false;

    try {
      const dataUrl = canvas.toDataURL(`image/${format}`);
      return dataUrl.indexOf(`data:image/${format}`) === 0;
    } catch {
      return false;
    }
  }

  private initializeObservers(): void {
    if ('IntersectionObserver' in window) {
      this.observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            this.loadResource(entry.target);
            this.observer?.unobserve(entry.target);
          }
        });
      }, {
        rootMargin: this.strategy.content.prefetchCritical ? '100px' : '200px',
        threshold: 0.1
      });
    }
  }

  public async initialize(): Promise<void> {
    if (this.isInitialized) return;

    console.log('🚀 Initializing Adaptive Loading System');

    // Apply initial optimizations
    this.applyInitialOptimizations();

    // Setup lazy loading for images
    this.setupImageLazyLoading();

    // Setup content batching
    this.setupContentBatching();

    // Setup network-aware loading
    this.setupNetworkAwareLoading();

    // Setup battery-aware loading
    this.setupBatteryAwareLoading();

    this.isInitialized = true;
    console.log('✅ Adaptive Loading System initialized');
  }

  private applyInitialOptimizations(): void {
    // Add loading strategy to document
    document.documentElement.setAttribute('data-device-tier', this.config.deviceTier);
    document.documentElement.setAttribute('data-network-speed', this.config.networkSpeed);
    document.documentElement.setAttribute('data-adaptive-loading', 'true');

    // Apply animation preferences
    if (!this.strategy.animations.enabled) {
      document.documentElement.classList.add('no-animations');
    }

    if (this.strategy.animations.reduced) {
      document.documentElement.classList.add('reduced-motion');
    }

    // Apply image optimization hints
    this.addImageOptimizationHints();
  }

  private addImageOptimizationHints(): void {
    const meta = document.createElement('meta');
    meta.name = 'format-detection';
    meta.content = 'telephone=no';
    document.head.appendChild(meta);

    // Add responsive image hints
    const style = document.createElement('style');
    style.textContent = `
      img {
        content-visibility: auto;
        contain-intrinsic-size: auto 300px;
      }
      .lazy-image {
        opacity: 0;
        transition: opacity 0.3s ease-in-out;
      }
      .lazy-image.loaded {
        opacity: 1;
      }
    `;
    document.head.appendChild(style);
  }

  private setupImageLazyLoading(): void {
    const images = document.querySelectorAll('img[data-src]');

    images.forEach(img => {
      if (this.observer) {
        this.observer.observe(img);
      } else {
        // Fallback for browsers without IntersectionObserver
        this.loadResource(img);
      }
    });
  }

  private setupContentBatching(): void {
    const contentElements = document.querySelectorAll('[data-batch-content]');
    const batches = this.createBatches(Array.from(contentElements), this.strategy.content.batchSize);

    batches.forEach((batch, index) => {
      setTimeout(() => {
        this.loadBatch(batch);
      }, index * this.strategy.content.loadingDelay);
    });
  }

  private createBatches(elements: Element[], batchSize: number): Element[][] {
    const batches: Element[][] = [];
    for (let i = 0; i < elements.length; i += batchSize) {
      batches.push(elements.slice(i, i + batchSize));
    }
    return batches;
  }

  private async loadBatch(batch: Element[]): Promise<void> {
    for (const element of batch) {
      await this.loadResource(element);
    }
  }

  private setupNetworkAwareLoading(): void {
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;

      connection.addEventListener('change', () => {
        console.log('📶 Network changed, updating strategy');
        this.detectEnvironment();
        this.setupStrategy();
        this.applyNewStrategy();
      });
    }
  }

  private setupBatteryAwareLoading(): void {
    if ('getBattery' in navigator) {
      (navigator as any).getBattery().then((battery: any) => {
        battery.addEventListener('levelchange', () => {
          console.log('🔋 Battery level changed, adjusting strategy');
          this.adjustForBatteryLevel(battery.level);
        });

        battery.addEventListener('chargingchange', () => {
          console.log('🔌 Charging status changed, adjusting strategy');
          this.adjustForChargingStatus(battery.charging);
        });
      });
    }
  }

  private applyNewStrategy(): void {
    // Update CSS classes based on new strategy
    document.documentElement.setAttribute('data-network-speed', this.config.networkSpeed);
    document.documentElement.setAttribute('data-device-tier', this.config.deviceTier);

    // Reload images with new quality settings
    this.reloadImages();
  }

  private async reloadImages(): Promise<void> {
    const images = document.querySelectorAll('img');

    images.forEach(img => {
      const src = (img as HTMLImageElement).src;
      if (src && this.shouldReloadImage(src)) {
        this.updateImageSrc(img as HTMLImageElement);
      }
    });
  }

  private shouldReloadImage(src: string): boolean {
    // Check if image URL contains quality parameters that need updating
    return src.includes('q=') || src.includes('quality=');
  }

  private updateImageSrc(img: HTMLImageElement): void {
    const currentSrc = img.src;
    const newQuality = this.strategy.images.quality;

    // Update quality parameter in URL
    const newSrc = currentSrc.replace(/q=\d+/, `q=${newQuality}`)
                          .replace(/quality=\d+/, `quality=${newQuality}`);

    if (newSrc !== currentSrc) {
      const tempImg = new Image();
      tempImg.onload = () => {
        img.src = newSrc;
      };
      tempImg.src = newSrc;
    }
  }

  private adjustForBatteryLevel(level: number): void {
    const batteryLevel = level > 0.5 ? 'high' : level > 0.2 ? 'medium' : 'low';
    this.config.batteryLevel = batteryLevel;

    if (batteryLevel === 'low') {
      // Reduce background processes
      this.strategy.videos.autoplay = false;
      this.strategy.content.prefetchNonCritical = false;
      this.strategy.animations.enabled = false;
    }

    this.applyNewStrategy();
  }

  private adjustForChargingStatus(charging: boolean): void {
    if (charging) {
      // Enable more aggressive loading when charging
      this.strategy.content.prefetchNonCritical = true;
      this.strategy.videos.preload = true;
    } else {
      // Be conservative when on battery
      this.strategy.content.prefetchNonCritical = false;
      this.strategy.videos.preload = false;
    }

    this.applyNewStrategy();
  }

  private async loadResource(element: Element): Promise<void> {
    const resourceKey = this.getResourceKey(element);

    if (this.loadedResources.has(resourceKey)) {
      return;
    }

    try {
      await this.processResource(element);
      this.loadedResources.add(resourceKey);
      this.markResourceLoaded(element);
    } catch (error) {
      console.warn('Failed to load resource:', error);
      this.handleResourceError(element, error);
    }
  }

  private getResourceKey(element: Element): string {
    if (element.tagName === 'IMG') {
      return (element as HTMLImageElement).src || element.getAttribute('data-src') || '';
    }
    return element.id || element.className || Math.random().toString(36);
  }

  private async processResource(element: Element): Promise<void> {
    const tagName = element.tagName.toLowerCase();

    switch (tagName) {
      case 'img':
        await this.processImage(element as HTMLImageElement);
        break;
      case 'video':
        await this.processVideo(element as HTMLVideoElement);
        break;
      case 'iframe':
        await this.processIframe(element as HTMLIFrameElement);
        break;
      default:
        await this.processGenericContent(element);
    }
  }

  private async processImage(img: HTMLImageElement): Promise<void> {
    const src = img.getAttribute('data-src') || img.src;

    if (!src) return;

    // Generate optimized image URL
    const optimizedSrc = this.generateOptimizedImageUrl(src);

    // Apply placeholder
    if (this.strategy.images.placeholder === 'skeleton') {
      this.addSkeletonPlaceholder(img);
    } else if (this.strategy.images.placeholder === 'blur') {
      this.addBlurPlaceholder(img, optimizedSrc);
    }

    // Load image
    return new Promise((resolve, reject) => {
      const tempImg = new Image();

      tempImg.onload = () => {
        img.src = optimizedSrc;
        img.classList.add('loaded');
        resolve();
      };

      tempImg.onerror = reject;
      tempImg.src = optimizedSrc;
    });
  }

  private generateOptimizedImageUrl(originalSrc: string): string {
    const { images } = this.strategy;
    const url = new URL(originalSrc, window.location.origin);

    // Add quality parameter
    url.searchParams.set('q', images.quality.toString());
    url.searchParams.set('f', images.format);

    // Add device-aware sizing
    const devicePixelRatio = window.devicePixelRatio || 1;
    const maxDisplayWidth = Math.min(window.innerWidth, 1200);
    const optimalWidth = Math.floor(maxDisplayWidth * devicePixelRatio);

    url.searchParams.set('w', optimalWidth.toString());

    return url.toString();
  }

  private addSkeletonPlaceholder(img: HTMLImageElement): void {
    const skeleton = document.createElement('div');
    skeleton.className = 'skeleton-placeholder';
    skeleton.style.cssText = `
      background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
      background-size: 200% 100%;
      animation: loading 1.5s infinite;
      width: ${img.width || 300}px;
      height: ${img.height || 200}px;
      border-radius: 8px;
    `;

    img.parentNode?.insertBefore(skeleton, img);

    // Remove skeleton when image loads
    img.addEventListener('load', () => {
      skeleton.remove();
    });
  }

  private addBlurPlaceholder(img: HTMLImageElement, optimizedSrc: string): void {
    // Generate low-quality image placeholder
    const blurSrc = this.generateBlurImageUrl(optimizedSrc);

    img.style.cssText += `
      background-image: url(${blurSrc});
      background-size: cover;
      background-position: center;
      filter: blur(10px);
      transform: scale(1.1);
    `;

    img.addEventListener('load', () => {
      img.style.filter = '';
      img.style.transform = '';
      img.style.backgroundImage = '';
    });
  }

  private generateBlurImageUrl(originalSrc: string): string {
    const url = new URL(originalSrc, window.location.origin);
    url.searchParams.set('q', '20');
    url.searchParams.set('w', '50');
    url.searchParams.set('h', '50');
    url.searchParams.set('blur', '10');
    return url.toString();
  }

  private async processVideo(video: HTMLVideoElement): Promise<void> {
    const src = video.getAttribute('data-src');

    if (!src) return;

    // Set video source
    const source = document.createElement('source');
    source.src = src;
    source.type = `video/${this.strategy.videos.format}`;

    video.appendChild(source);

    // Configure autoplay and preload based on strategy
    video.autoplay = this.strategy.videos.autoplay;
    video.preload = this.strategy.videos.preload ? 'auto' : 'metadata';
    video.muted = this.strategy.videos.autoplay; // Required for autoplay
  }

  private async processIframe(iframe: HTMLIFrameElement): Promise<void> {
    const src = iframe.getAttribute('data-src');

    if (!src) return;

    // Load iframe only when in viewport (already handled by intersection observer)
    iframe.src = src;
  }

  private async processGenericContent(element: Element): Promise<void> {
    // Handle generic content elements
    const contentUrl = element.getAttribute('data-content-url');

    if (contentUrl) {
      try {
        const response = await fetch(contentUrl);
        const content = await response.text();
        element.innerHTML = content;
      } catch (error) {
        console.warn('Failed to load content:', error);
      }
    }
  }

  private markResourceLoaded(element: Element): void {
    element.setAttribute('data-loaded', 'true');

    // Dispatch custom event
    const event = new CustomEvent('resourceLoaded', {
      detail: { element, timestamp: Date.now() }
    });
    document.dispatchEvent(event);
  }

  private handleResourceError(element: Element, error: any): void {
    element.setAttribute('data-error', 'true');

    // Try fallback if available
    const fallback = element.getAttribute('data-fallback');
    if (fallback) {
      if (element.tagName === 'IMG') {
        (element as HTMLImageElement).src = fallback;
      } else {
        element.textContent = fallback;
      }
    }

    // Dispatch error event
    const event = new CustomEvent('resourceError', {
      detail: { element, error, timestamp: Date.now() }
    });
    document.dispatchEvent(event);
  }

  // Public API methods
  public updatePreferences(preferences: Partial<AdaptiveConfig['customPreferences']>): void {
    this.config.customPreferences = { ...this.config.customPreferences, ...preferences };

    // Save to localStorage
    localStorage.setItem('adaptive-loading-preferences', JSON.stringify(this.config.customPreferences));

    // Reconfigure strategy
    this.setupStrategy();
    this.applyNewStrategy();

    console.log('✨ Preferences updated:', this.config.customPreferences);
  }

  public forceReload(resources?: Element[]): void {
    const elementsToReload = resources || document.querySelectorAll('[data-loaded="true"]');

    elementsToReload.forEach(element => {
      this.loadedResources.delete(this.getResourceKey(element));
      element.removeAttribute('data-loaded');
      this.loadResource(element);
    });
  }

  public getStrategy(): LoadingStrategy {
    return { ...this.strategy };
  }

  public getConfig(): AdaptiveConfig {
    return { ...this.config };
  }

  public getResourcePriority(element: Element): ResourcePriority {
    const priorityAttr = element.getAttribute('data-priority') || 'medium';

    return {
      level: priorityAttr as ResourcePriority['level'],
      loadImmediately: priorityAttr === 'critical',
      preload: ['critical', 'high'].includes(priorityAttr),
      defer: priorityAttr === 'low',
      fallback: element.getAttribute('data-fallback')
    };
  }

  public preloadCriticalResources(): void {
    const criticalElements = document.querySelectorAll('[data-priority="critical"]');

    criticalElements.forEach(element => {
      this.loadResource(element);
    });
  }

  public pauseBackgroundLoading(): void {
    // Pause non-critical loading
    if (this.observer) {
      this.observer.disconnect();
    }
  }

  public resumeBackgroundLoading(): void {
    // Resume background loading
    if (this.observer) {
      const lazyElements = document.querySelectorAll('img[data-src], [data-content-url]');
      lazyElements.forEach(element => {
        this.observer?.observe(element);
      });
    }
  }

  public generatePerformanceReport(): object {
    return {
      config: this.config,
      strategy: this.strategy,
      loadedResources: this.loadedResources.size,
      queuedResources: this.loadingQueue.size,
      timestamp: new Date().toISOString(),
      recommendations: this.generateRecommendations()
    };
  }

  private generateRecommendations(): string[] {
    const recommendations: string[] = [];
    const { deviceTier, networkSpeed, dataSaver } = this.config;

    if (deviceTier === 'low') {
      recommendations.push('Consider enabling aggressive caching for low-end devices');
      recommendations.push('Reduce image quality and disable animations for better performance');
    }

    if (networkSpeed === 'slow') {
      recommendations.push('Implement more aggressive image compression');
      recommendations.push('Preload critical resources only');
      recommendations.push('Use skeleton screens to improve perceived performance');
    }

    if (dataSaver) {
      recommendations.push('Use text placeholders instead of image placeholders');
      recommendations.push('Disable autoplay for videos and animations');
    }

    return recommendations;
  }
}

// Export singleton instance
export const adaptiveLoadingSystem = AdaptiveLoadingSystem.getInstance();

// Convenience exports
export const initializeAdaptiveLoading = () => adaptiveLoadingSystem.initialize();
export const updateLoadingPreferences = (prefs: Partial<AdaptiveConfig['customPreferences']>) =>
  adaptiveLoadingSystem.updatePreferences(prefs);
export const getAdaptiveStrategy = () => adaptiveLoadingSystem.getStrategy();
export const getAdaptiveConfig = () => adaptiveLoadingSystem.getConfig();

// Development debugging
if (import.meta.env.DEV) {
  (window as any).adaptiveLoading = {
    init: initializeAdaptiveLoading,
    updatePrefs: updateLoadingPreferences,
    getStrategy: getAdaptiveStrategy,
    getConfig: getAdaptiveConfig,
    forceReload: (resources?: Element[]) => adaptiveLoadingSystem.forceReload(resources),
    preloadCritical: () => adaptiveLoadingSystem.preloadCriticalResources(),
    pause: () => adaptiveLoadingSystem.pauseBackgroundLoading(),
    resume: () => adaptiveLoadingSystem.resumeBackgroundLoading(),
    getReport: () => adaptiveLoadingSystem.generatePerformanceReport()
  };
}