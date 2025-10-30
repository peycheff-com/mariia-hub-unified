/**
 * Adaptive Image Optimization System
 * Intelligent image quality and format optimization based on device capabilities and network conditions
 */

export interface ImageConfig {
  src: string;
  srcSet?: string;
  sizes?: string;
  alt: string;
  width?: number;
  height?: number;
  loading?: 'lazy' | 'eager' | 'auto';
  decoding?: 'async' | 'sync' | 'auto';
  priority?: boolean;
  format?: 'webp' | 'avif' | 'jpeg' | 'png' | 'auto';
  quality?: number;
  placeholder?: 'blur' | 'pixelate' | 'color' | 'none';
  blurDataURL?: string;
}

export interface AdaptiveImageSettings {
  formats: {
    webp: boolean;
    avif: boolean;
    jpeg2000: boolean;
    heic: boolean;
  };
  quality: {
    premium: number; // 1-100
    high: number;
    medium: number;
    low: number;
    adaptive: boolean;
  };
  sizing: {
    maxWidth: number;
    maxHeight: number;
    scaleFactors: number[];
    containerQueries: boolean;
  };
  loading: {
    lazy: boolean;
    eagerAboveFold: boolean;
    threshold: number; // Intersection observer threshold
    rootMargin: string;
  };
  placeholders: {
    enable: boolean;
    lowQualityPreview: boolean;
    blurRadius: number;
    pixelSize: number;
  };
  performance: {
    maxConcurrentLoads: number;
    compressionLevel: number;
    progressiveJPEG: boolean;
  };
}

export interface ImageOptimizationResult {
  originalUrl: string;
  optimizedUrl: string;
  format: string;
  quality: number;
  width: number;
  height: number;
  fileSize: number;
  compressionRatio: number;
  loadingStrategy: string;
}

export interface ImageMetrics {
  loadTime: number;
  renderTime: number;
  fileSize: number;
  dimensions: { width: number; height: number };
  format: string;
  quality: number;
  cacheHit: boolean;
}

export class AdaptiveImageOptimizer {
  private settings: AdaptiveImageSettings;
  private supportedFormats: Set<string> = new Set();
  private deviceProfile: any = null;
  private networkCondition: any = null;
  private imageCache: Map<string, ImageOptimizationResult> = new Map();
  private loadingQueue: Array<{ element: HTMLImageElement; config: ImageConfig }> = [];
  private activeLoads: number = 0;
  private intersectionObserver: IntersectionObserver | null = null;
  private performanceObserver: PerformanceObserver | null = null;
  private imageMetrics: Map<string, ImageMetrics> = new Map();
  private isInitialized: boolean = false;

  constructor(settings?: Partial<AdaptiveImageSettings>) {
    this.settings = {
      formats: {
        webp: true,
        avif: true,
        jpeg2000: false,
        heic: false
      },
      quality: {
        premium: 90,
        high: 80,
        medium: 70,
        low: 60,
        adaptive: true
      },
      sizing: {
        maxWidth: 2048,
        maxHeight: 2048,
        scaleFactors: [1, 1.5, 2, 3],
        containerQueries: true
      },
      loading: {
        lazy: true,
        eagerAboveFold: true,
        threshold: 0.1,
        rootMargin: '50px'
      },
      placeholders: {
        enable: true,
        lowQualityPreview: true,
        blurRadius: 10,
        pixelSize: 4
      },
      performance: {
        maxConcurrentLoads: 4,
        compressionLevel: 7,
        progressiveJPEG: true
      },
      ...settings
    };

    this.initialize();
  }

  private async initialize(): Promise<void> {
    console.log('🖼️ Initializing Adaptive Image Optimizer for luxury beauty/fitness platform');

    try {
      // Detect supported formats
      await this.detectSupportedFormats();

      // Get device profile
      this.deviceProfile = this.getDeviceProfile();

      // Get network condition
      this.networkCondition = this.getNetworkCondition();

      // Set up intersection observer for lazy loading
      this.setupIntersectionObserver();

      // Set up performance monitoring
      this.setupPerformanceMonitoring();

      // Set up image error handling
      this.setupErrorHandling();

      this.isInitialized = true;
      console.log('✅ Adaptive Image Optimizer initialized');

    } catch (error) {
      console.error('❌ Failed to initialize Adaptive Image Optimizer:', error);
      throw error;
    }
  }

  private async detectSupportedFormats(): Promise<void> {
    const formats = [
      { name: 'webp', mimeType: 'image/webp' },
      { name: 'avif', mimeType: 'image/avif' },
      { name: 'jpeg2000', mimeType: 'image/jp2' },
      { name: 'heic', mimeType: 'image/heic' }
    ];

    for (const format of formats) {
      try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) continue;

        canvas.width = 1;
        canvas.height = 1;

        const support = canvas.toDataURL(format.mimeType).indexOf(`data:${format.mimeType}`) === 0;
        if (support && this.settings.formats[format.name as keyof typeof this.settings.formats]) {
          this.supportedFormats.add(format.name);
        }
      } catch (error) {
        // Format not supported
      }
    }

    console.log('📸 Supported image formats:', Array.from(this.supportedFormats));
  }

  private getDeviceProfile(): any {
    // Try to get device profile from device profiler
    const profiler = (window as any).devicePerformanceProfiler;
    if (profiler && profiler.getDeviceProfile) {
      return profiler.getDeviceProfile();
    }

    // Fallback device detection
    const memory = (navigator as any).deviceMemory || 4;
    const cores = navigator.hardwareConcurrency || 4;
    const dpr = window.devicePixelRatio || 1;

    return {
      tier: memory >= 6 && cores >= 6 ? 'premium' :
            memory >= 4 && cores >= 4 ? 'high' :
            memory >= 2 ? 'medium' : 'low',
      capabilities: {
        memory,
        cpuCores: cores,
        devicePixelRatio: dpr,
        networkSpeed: 'medium' // Default assumption
      }
    };
  }

  private getNetworkCondition(): any {
    // Try to get network condition from network optimizer
    const networkOptimizer = (window as any).networkOptimizer;
    if (networkOptimizer && networkOptimizer.getNetworkCondition) {
      return networkOptimizer.getNetworkCondition();
    }

    // Fallback network detection
    const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
    if (connection) {
      return {
        effectiveType: connection.effectiveType || '4g',
        downlink: connection.downlink || 10,
        rtt: connection.rtt || 100,
        saveData: connection.saveData || false
      };
    }

    return {
      effectiveType: '4g',
      downlink: 10,
      rtt: 100,
      saveData: false
    };
  }

  private setupIntersectionObserver(): void {
    if (!this.settings.loading.lazy || !('IntersectionObserver' in window)) return;

    this.intersectionObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const img = entry.target as HTMLImageElement;
            this.loadImage(img);
            this.intersectionObserver?.unobserve(img);
          }
        });
      },
      {
        threshold: this.settings.loading.threshold,
        rootMargin: this.settings.loading.rootMargin
      }
    );
  }

  private setupPerformanceMonitoring(): void {
    if (!window.PerformanceObserver) return;

    this.performanceObserver = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.name.includes('image') || entry.initiatorType === 'img') {
          this.recordImageMetrics(entry as PerformanceResourceTiming);
        }
      }
    });

    this.performanceObserver.observe({
      entryTypes: ['resource', 'measure']
    });
  }

  private recordImageMetrics(entry: PerformanceResourceTiming): void {
    const metrics: ImageMetrics = {
      loadTime: entry.responseEnd - entry.requestStart,
      renderTime: entry.responseEnd - entry.responseStart,
      fileSize: entry.encodedBodySize || 0,
      dimensions: { width: 0, height: 0 }, // Will be populated after load
      format: this.getImageFormatFromUrl(entry.name),
      quality: 0, // Will be determined from URL
      cacheHit: entry.transferSize === 0
    };

    this.imageMetrics.set(entry.name, metrics);

    // Log performance issues
    if (metrics.loadTime > 3000) {
      console.warn('⚠️ Slow image load:', entry.name, `${metrics.loadTime}ms`);
    }
  }

  private getImageFormatFromUrl(url: string): string {
    const extension = url.split('.').pop()?.split('?')[0];
    return extension || 'unknown';
  }

  private setupErrorHandling(): void {
    document.addEventListener('error', (event) => {
      const target = event.target as HTMLImageElement;
      if (target && target.tagName === 'IMG') {
        this.handleImageError(target);
      }
    }, true);
  }

  private handleImageError(img: HTMLImageElement): void {
    console.warn('🖼️ Image failed to load:', img.src);

    // Try fallback formats
    const originalSrc = img.dataset.originalSrc || img.src;
    const fallbackSrc = this.generateFallbackUrl(originalSrc);

    if (fallbackSrc !== originalSrc) {
      img.src = fallbackSrc;
    } else {
      // Use placeholder as last resort
      img.src = this.generatePlaceholderUrl(img);
    }
  }

  private generateFallbackUrl(originalSrc: string): string {
    // Try different formats as fallbacks
    const formats = ['jpeg', 'png', 'webp'];

    for (const format of formats) {
      if (this.supportedFormats.has(format)) {
        return originalSrc.replace(/\.(jpg|jpeg|png|webp|avif)(\?.*)?$/i, `.${format}$2`);
      }
    }

    return originalSrc;
  }

  private generatePlaceholderUrl(img: HTMLImageElement): string {
    // Generate a low-quality placeholder or use a default
    const width = img.width || 400;
    const height = img.height || 300;

    if (this.settings.placeholders.enable) {
      return `data:image/svg+xml,%3Csvg width='${width}' height='${height}' xmlns='http://www.w3.org/2000/svg'%3E%3Crect fill='%23f3f4f6' width='100%25' height='100%25'/%3E%3Ctext fill='%239ca3af' font-family='system-ui' font-size='14' text-anchor='middle' x='50%25' y='50%25' dy='.3em'%3ELoading...%3C/text%3E%3C/svg%3E`;
    }

    return '/images/placeholder-luxury.jpg';
  }

  // Public API methods

  optimizeImage(element: HTMLImageElement, config: ImageConfig): void {
    if (!this.isInitialized) {
      console.warn('AdaptiveImageOptimizer not initialized yet');
      return;
    }

    // Store original config
    (element as any)._imageConfig = config;
    element.dataset.originalSrc = config.src;

    // Determine optimal settings
    const optimizedConfig = this.determineOptimalConfig(config, element);

    // Apply optimizations
    this.applyOptimizations(element, optimizedConfig);

    // Handle loading strategy
    if (this.shouldLoadImmediately(element, config)) {
      this.loadImage(element);
    } else if (this.settings.loading.lazy) {
      this.intersectionObserver?.observe(element);
    } else {
      this.loadingQueue.push({ element, config: optimizedConfig });
      this.processQueue();
    }
  }

  private determineOptimalConfig(config: ImageConfig, element: HTMLImageElement): ImageConfig {
    // Determine optimal format
    const format = this.selectOptimalFormat(config.format || 'auto');

    // Determine optimal quality
    const quality = this.selectOptimalQuality(config.quality);

    // Determine optimal dimensions
    const dimensions = this.calculateOptimalDimensions(element, config);

    // Determine loading strategy
    const loading = this.selectLoadingStrategy(config.loading, element);

    return {
      ...config,
      format,
      quality,
      ...dimensions,
      loading,
      decoding: 'async'
    };
  }

  private selectOptimalFormat(requestedFormat: string): string {
    if (requestedFormat !== 'auto') {
      return this.supportedFormats.has(requestedFormat) ? requestedFormat : 'jpeg';
    }

    // Auto-select best format based on support and compression
    if (this.supportedFormats.has('avif')) return 'avif';
    if (this.supportedFormats.has('webp')) return 'webp';
    if (this.supportedFormats.has('jpeg2000')) return 'jpeg2000';

    return 'jpeg'; // Fallback
  }

  private selectOptimalQuality(requestedQuality?: number): number {
    if (requestedQuality && !this.settings.quality.adaptive) {
      return requestedQuality;
    }

    // Adaptive quality based on device and network
    const deviceTier = this.deviceProfile?.tier || 'medium';
    const networkSpeed = this.networkCondition?.effectiveType || '4g';
    const saveData = this.networkCondition?.saveData || false;

    if (saveData) {
      return Math.min(50, this.settings.quality.low);
    }

    let baseQuality = this.settings.quality[deviceTier] || this.settings.quality.medium;

    // Adjust based on network speed
    switch (networkSpeed) {
      case '2g':
        baseQuality = Math.min(baseQuality, 50);
        break;
      case '3g':
        baseQuality = Math.min(baseQuality, 70);
        break;
      case '4g':
        // Use base quality
        break;
    }

    return Math.round(baseQuality);
  }

  private calculateOptimalDimensions(element: HTMLImageElement, config: ImageConfig): Partial<ImageConfig> {
    const containerWidth = this.getContainerWidth(element);
    const containerHeight = this.getContainerHeight(element);
    const dpr = Math.min(this.deviceProfile?.capabilities?.devicePixelRatio || 1, 2); // Cap at 2x for performance

    // Calculate display dimensions
    let displayWidth = config.width || containerWidth || 400;
    let displayHeight = config.height || containerHeight || 300;

    // Apply device pixel ratio
    const actualWidth = Math.round(displayWidth * dpr);
    const actualHeight = Math.round(displayHeight * dpr);

    // Respect max dimensions
    const finalWidth = Math.min(actualWidth, this.settings.sizing.maxWidth);
    const finalHeight = Math.min(actualHeight, this.settings.sizing.maxHeight);

    return {
      width: finalWidth,
      height: finalHeight
    };
  }

  private getContainerWidth(element: HTMLElement): number {
    const parent = element.parentElement;
    if (!parent) return 0;

    const computedStyle = window.getComputedStyle(parent);
    const width = parseInt(computedStyle.width, 10);

    return width || parent.clientWidth;
  }

  private getContainerHeight(element: HTMLElement): number {
    const parent = element.parentElement;
    if (!parent) return 0;

    const computedStyle = window.getComputedStyle(parent);
    const height = parseInt(computedStyle.height, 10);

    return height || parent.clientHeight;
  }

  private selectLoadingStrategy(requestedLoading?: string, element?: HTMLImageElement): ImageConfig['loading'] {
    if (requestedLoading && requestedLoading !== 'auto') {
      return requestedLoading;
    }

    // Priority images load eagerly
    const config = (element as any)._imageConfig as ImageConfig;
    if (config?.priority) {
      return 'eager';
    }

    // Above-the-fold images load eagerly
    if (this.isAboveFold(element)) {
      return 'eager';
    }

    return this.settings.loading.lazy ? 'lazy' : 'auto';
  }

  private isAboveFold(element?: HTMLElement): boolean {
    if (!element) return false;

    const rect = element.getBoundingClientRect();
    const windowHeight = window.innerHeight;

    // Element is considered above fold if its top is within viewport + root margin
    return rect.top < windowHeight + parseInt(this.settings.loading.rootMargin);
  }

  private shouldLoadImmediately(element: HTMLImageElement, config: ImageConfig): boolean {
    return config.priority === true ||
           config.loading === 'eager' ||
           this.isAboveFold(element);
  }

  private applyOptimizations(element: HTMLImageElement, config: ImageConfig): void {
    // Generate optimized URL
    const optimizedUrl = this.generateOptimizedUrl(config);

    // Apply attributes
    element.src = optimizedUrl;

    if (config.width) element.width = config.width;
    if (config.height) element.height = config.height;
    if (config.loading) element.loading = config.loading;
    if (config.decoding) element.decoding = config.decoding;
    if (config.alt) element.alt = config.alt;

    // Generate srcset for responsive images
    if (config.srcSet || this.settings.sizing.containerQueries) {
      this.generateSrcSet(element, config);
    }

    // Add placeholder if enabled
    if (this.settings.placeholders.enable && config.placeholder !== 'none') {
      this.addPlaceholder(element, config);
    }

    // Add loading optimization classes
    element.classList.add('adaptive-image', 'loading');
  }

  private generateOptimizedUrl(config: ImageConfig): string {
    const baseUrl = config.src;
    const params = new URLSearchParams();

    // Add format parameter
    if (config.format && config.format !== 'auto') {
      params.set('format', config.format);
    }

    // Add quality parameter
    if (config.quality && config.quality < 100) {
      params.set('quality', config.quality.toString());
    }

    // Add dimension parameters
    if (config.width) params.set('w', config.width.toString());
    if (config.height) params.set('h', config.height.toString());

    // Add compression parameter
    params.set('compression', this.settings.performance.compressionLevel.toString());

    // Add progressive JPEG parameter
    if (this.settings.performance.progressiveJPEG) {
      params.set('progressive', 'true');
    }

    // Generate optimized URL
    const paramString = params.toString();
    return paramString ? `${baseUrl}?${paramString}` : baseUrl;
  }

  private generateSrcSet(element: HTMLImageElement, config: ImageConfig): void {
    const srcSetUrls: string[] = [];
    const baseWidth = config.width || this.getContainerWidth(element) || 400;

    // Generate srcset for different scale factors
    for (const scaleFactor of this.settings.sizing.scaleFactors) {
      const width = Math.round(baseWidth * scaleFactor);
      const height = config.height ? Math.round(config.height * scaleFactor) : undefined;

      const srcSetConfig = {
        ...config,
        width,
        height
      };

      const url = this.generateOptimizedUrl(srcSetConfig);
      srcSetUrls.push(`${url} ${scaleFactor}x`);
    }

    if (srcSetUrls.length > 0) {
      element.srcset = srcSetUrls.join(', ');
    }
  }

  private addPlaceholder(element: HTMLImageElement, config: ImageConfig): void {
    switch (config.placeholder) {
      case 'blur':
        this.addBlurPlaceholder(element, config);
        break;
      case 'pixelate':
        this.addPixelatePlaceholder(element, config);
        break;
      case 'color':
        this.addColorPlaceholder(element, config);
        break;
    }
  }

  private addBlurPlaceholder(element: HTMLImageElement, config: ImageConfig): void {
    if (config.blurDataURL) {
      element.style.backgroundImage = `url(${config.blurDataURL})`;
      element.style.backgroundSize = 'cover';
      element.style.backgroundPosition = 'center';
      element.style.filter = `blur(${this.settings.placeholders.blurRadius}px)`;

      element.addEventListener('load', () => {
        element.style.filter = '';
        element.style.backgroundImage = '';
      });
    }
  }

  private addPixelatePlaceholder(element: HTMLImageElement, config: ImageConfig): void {
    const pixelSize = this.settings.placeholders.pixelSize;
    element.style.imageRendering = 'pixelated';
    element.style.transform = `scale(${1 / pixelSize})`;

    element.addEventListener('load', () => {
      element.style.imageRendering = '';
      element.style.transform = '';
    });
  }

  private addColorPlaceholder(element: HTMLImageElement, config: ImageConfig): void {
    // Generate a dominant color placeholder (would need API integration)
    element.style.backgroundColor = '#f3f4f6';
  }

  private loadImage(element: HTMLImageElement): void {
    if (this.activeLoads >= this.settings.performance.maxConcurrentLoads) {
      this.loadingQueue.push({ element, config: (element as any)._imageConfig });
      return;
    }

    this.activeLoads++;

    const startTime = performance.now();

    element.addEventListener('load', () => {
      const loadTime = performance.now() - startTime;
      element.classList.remove('loading');
      element.classList.add('loaded');

      this.activeLoads--;
      this.processQueue();

      // Record metrics
      this.recordLoadMetrics(element, loadTime);
    });

    element.addEventListener('error', () => {
      element.classList.remove('loading');
      element.classList.add('error');

      this.activeLoads--;
      this.processQueue();

      this.handleImageError(element);
    });
  }

  private recordLoadMetrics(element: HTMLImageElement, loadTime: number): void {
    const src = element.src;
    const metrics: ImageMetrics = {
      loadTime,
      renderTime: 0,
      fileSize: 0,
      dimensions: {
        width: element.naturalWidth,
        height: element.naturalHeight
      },
      format: this.getImageFormatFromUrl(src),
      quality: this.extractQualityFromUrl(src),
      cacheHit: false
    };

    this.imageMetrics.set(src, metrics);
  }

  private extractQualityFromUrl(url: string): number {
    const match = url.match(/(?:&|\?)quality=(\d+)/);
    return match ? parseInt(match[1], 10) : 100;
  }

  private processQueue(): void {
    while (this.loadingQueue.length > 0 && this.activeLoads < this.settings.performance.maxConcurrentLoads) {
      const { element, config } = this.loadingQueue.shift()!;
      this.loadImage(element);
    }
  }

  // Public utility methods

  optimizeExistingImages(): void {
    const images = document.querySelectorAll('img:not(.adaptive-image)');

    images.forEach(img => {
      const config: ImageConfig = {
        src: img.src,
        alt: img.alt || '',
        width: img.width || undefined,
        height: img.height || undefined,
        loading: img.loading as any,
        priority: img.hasAttribute('priority')
      };

      this.optimizeImage(img as HTMLImageElement, config);
    });
  }

  getImageMetrics(imageUrl: string): ImageMetrics | undefined {
    return this.imageMetrics.get(imageUrl);
  }

  getAllMetrics(): ImageMetrics[] {
    return Array.from(this.imageMetrics.values());
  }

  updateSettings(newSettings: Partial<AdaptiveImageSettings>): void {
    this.settings = { ...this.settings, ...newSettings };
    console.log('🖼️ Image optimization settings updated');
  }

  clearCache(): void {
    this.imageCache.clear();
    this.imageMetrics.clear();
    console.log('🧹 Image cache cleared');
  }

  getOptimizationReport(): any {
    const metrics = this.getAllMetrics();
    const totalImages = metrics.length;
    const avgLoadTime = metrics.reduce((sum, m) => sum + m.loadTime, 0) / totalImages || 0;
    const avgFileSize = metrics.reduce((sum, m) => sum + m.fileSize, 0) / totalImages || 0;
    const cacheHitRate = metrics.filter(m => m.cacheHit).length / totalImages || 0;

    return {
      supportedFormats: Array.from(this.supportedFormats),
      settings: this.settings,
      metrics: {
        totalImages,
        avgLoadTime: Math.round(avgLoadTime),
        avgFileSize: Math.round(avgFileSize),
        cacheHitRate: Math.round(cacheHitRate * 100)
      },
      deviceProfile: this.deviceProfile,
      networkCondition: this.networkCondition
    };
  }

  destroy(): void {
    this.intersectionObserver?.disconnect();
    this.performanceObserver?.disconnect();
    this.loadingQueue.length = 0;
    this.imageCache.clear();
    this.imageMetrics.clear();
    this.isInitialized = false;

    console.log('🧹 Adaptive Image Optimizer cleaned up');
  }
}

// Singleton instance
let adaptiveImageOptimizer: AdaptiveImageOptimizer | null = null;

export function initializeAdaptiveImageOptimizer(settings?: Partial<AdaptiveImageSettings>): AdaptiveImageOptimizer {
  if (!adaptiveImageOptimizer) {
    adaptiveImageOptimizer = new AdaptiveImageOptimizer(settings);
  }
  return adaptiveImageOptimizer;
}

export function getAdaptiveImageOptimizer(): AdaptiveImageOptimizer | null {
  return adaptiveImageOptimizer;
}

// Auto-initialize for existing images
if (typeof document !== 'undefined') {
  document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
      const optimizer = initializeAdaptiveImageOptimizer();
      optimizer.optimizeExistingImages();
    }, 100);
  });
}

// Global access for debugging
declare global {
  interface Window {
    adaptiveImageOptimizer: AdaptiveImageOptimizer;
  }
}

if (import.meta.env.DEV) {
  window.addEventListener('load', () => {
    const optimizer = initializeAdaptiveImageOptimizer();
    window.adaptiveImageOptimizer = optimizer;
    console.log('🔧 Adaptive Image Optimizer available via window.adaptiveImageOptimizer');
  });
}