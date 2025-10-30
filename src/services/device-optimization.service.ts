import { useCrossPlatform } from '@/contexts/CrossPlatformContext';

export interface DeviceCapabilities {
  // Performance capabilities
  cpuCores: number;
  memory: number; // in GB
  gpuType: 'integrated' | 'discrete' | 'mobile' | 'unknown';
  performanceScore: number; // 0-100

  // Display capabilities
  screenWidth: number;
  screenHeight: number;
  pixelRatio: number;
  maxTouchPoints: number;
  colorGamut: 'srgb' | 'p3' | 'rec2020' | 'unknown';
  hdrSupport: boolean;

  // Input capabilities
  hasTouch: boolean;
  hasMouse: boolean;
  hasKeyboard: boolean;
  supportsHover: boolean;
  supportsGestures: boolean;

  // Network capabilities
  connectionType: 'slow-2g' | '2g' | '3g' | '4g' | '5g' | 'wifi' | 'ethernet' | 'unknown';
  effectiveType: string;
  downlink: number; // Mbps
  rtt: number; // Round trip time in ms
  saveData: boolean;

  // Browser capabilities
  supportsWebGL: boolean;
  supportsWebGPU: boolean;
  supportsWebAssembly: boolean;
  supportsServiceWorker: boolean;
  supportsIndexedDB: boolean;
  supportsWebRTC: boolean;
  supportsPWA: boolean;

  // Platform-specific features
  supportsNotifications: boolean;
  supportsGeolocation: boolean;
  supportsCamera: boolean;
  supportsMicrophone: boolean;
  supportsVibration: boolean;
  supportsBatteryAPI: boolean;
  supportsDeviceOrientation: boolean;
}

export interface PerformanceMetrics {
  // Core Web Vitals
  lcp: number; // Largest Contentful Paint
  fid: number; // First Input Delay
  cls: number; // Cumulative Layout Shift
  fcp: number; // First Contentful Paint
  ttfb: number; // Time to First Byte

  // Custom metrics
  bookingFlowCompletionTime: number;
  searchResponseTime: number;
  animationFrameRate: number;
  memoryUsage: number;
  errorRate: number;

  // Engagement metrics
  sessionDuration: number;
  pageViews: number;
  bounceRate: number;
  conversionRate: number;
}

export interface OptimizationSettings {
  // Performance settings
  animationsEnabled: boolean;
  highQualityImages: boolean;
  preloadingEnabled: boolean;
  lazyLoadingEnabled: boolean;
  cachingEnabled: boolean;

  // UI settings
  denseMode: boolean;
  reducedMotion: boolean;
  highContrast: boolean;
  largeText: boolean;

  // Network settings
  offlineModeEnabled: boolean;
  lowDataMode: boolean;
  backgroundSyncEnabled: boolean;
  prefetchResources: boolean;

  // Feature flags
  webpSupport: boolean;
  avifSupport: boolean;
  webglSupport: boolean;
  webassemblySupport: boolean;
}

class DeviceOptimizationService {
  private capabilities: DeviceCapabilities | null = null;
  private metrics: PerformanceMetrics;
  private settings: OptimizationSettings;
  private observers: Map<string, any> = new Map();
  private performanceEntryBuffer: PerformanceEntry[] = [];

  constructor() {
    this.metrics = this.initializeMetrics();
    this.settings = this.initializeSettings();
    this.detectCapabilities();
    this.initializeOptimizations();
    this.setupPerformanceMonitoring();
  }

  /**
   * Initialize default metrics
   */
  private initializeMetrics(): PerformanceMetrics {
    return {
      lcp: 0,
      fid: 0,
      cls: 0,
      fcp: 0,
      ttfb: 0,
      bookingFlowCompletionTime: 0,
      searchResponseTime: 0,
      animationFrameRate: 60,
      memoryUsage: 0,
      errorRate: 0,
      sessionDuration: 0,
      pageViews: 0,
      bounceRate: 0,
      conversionRate: 0
    };
  }

  /**
   * Initialize default optimization settings
   */
  private initializeSettings(): OptimizationSettings {
    const savedSettings = localStorage.getItem('optimization_settings');
    if (savedSettings) {
      return { ...this.getDefaultSettings(), ...JSON.parse(savedSettings) };
    }
    return this.getDefaultSettings();
  }

  private getDefaultSettings(): OptimizationSettings {
    return {
      animationsEnabled: true,
      highQualityImages: true,
      preloadingEnabled: true,
      lazyLoadingEnabled: true,
      cachingEnabled: true,
      denseMode: false,
      reducedMotion: false,
      highContrast: false,
      largeText: false,
      offlineModeEnabled: true,
      lowDataMode: false,
      backgroundSyncEnabled: true,
      prefetchResources: true,
      webpSupport: false,
      avifSupport: false,
      webglSupport: false,
      webassemblySupport: false
    };
  }

  /**
   * Detect device capabilities
   */
  private async detectCapabilities(): Promise<void> {
    const capabilities: DeviceCapabilities = {
      // Performance capabilities
      cpuCores: navigator.hardwareConcurrency || 4,
      memory: this.estimateMemory(),
      gpuType: this.detectGPUType(),
      performanceScore: 0,

      // Display capabilities
      screenWidth: window.screen.width,
      screenHeight: window.screen.height,
      pixelRatio: window.devicePixelRatio || 1,
      maxTouchPoints: navigator.maxTouchPoints || 0,
      colorGamut: this.detectColorGamut(),
      hdrSupport: this.detectHDRSupport(),

      // Input capabilities
      hasTouch: 'ontouchstart' in window,
      hasMouse: this.detectMouseSupport(),
      hasKeyboard: 'onkeydown' in window,
      supportsHover: window.matchMedia('(hover: hover)').matches,
      supportsGestures: 'ongesturestart' in window,

      // Network capabilities
      connectionType: this.detectConnectionType(),
      effectiveType: this.getEffectiveConnectionType(),
      downlink: this.getDownlink(),
      rtt: this.getRTT(),
      saveData: this.getSaveDataStatus(),

      // Browser capabilities
      supportsWebGL: this.detectWebGLSupport(),
      supportsWebGPU: this.detectWebGPUSupport(),
      supportsWebAssembly: this.detectWebAssemblySupport(),
      supportsServiceWorker: 'serviceWorker' in navigator,
      supportsIndexedDB: 'indexedDB' in window,
      supportsWebRTC: this.detectWebRTCSupport(),
      supportsPWA: this.detectPWASupport(),

      // Platform-specific features
      supportsNotifications: 'Notification' in window,
      supportsGeolocation: 'geolocation' in navigator,
      supportsCamera: 'mediaDevices' in navigator && 'getUserMedia' in navigator.mediaDevices,
      supportsMicrophone: 'mediaDevices' in navigator && 'getUserMedia' in navigator.mediaDevices,
      supportsVibration: 'vibrate' in navigator,
      supportsBatteryAPI: 'getBattery' in navigator,
      supportsDeviceOrientation: 'DeviceOrientationEvent' in window
    };

    // Calculate performance score
    capabilities.performanceScore = this.calculatePerformanceScore(capabilities);

    // Update settings based on capabilities
    this.updateSettingsBasedOnCapabilities(capabilities);

    this.capabilities = capabilities;
  }

  /**
   * Estimate device memory (rough approximation)
   */
  private estimateMemory(): number {
    // @ts-ignore - deviceMemory is not in TypeScript types yet
    if (navigator.deviceMemory) {
      // @ts-ignore
      return navigator.deviceMemory;
    }

    // Fallback estimation based on other factors
    const cpuCores = navigator.hardwareConcurrency || 4;
    const pixelRatio = window.devicePixelRatio || 1;
    const isHighEnd = cpuCores >= 8 && pixelRatio >= 2;

    if (isHighEnd) return 8; // Assume 8GB for high-end devices
    if (cpuCores >= 4) return 4; // Assume 4GB for mid-range devices
    return 2; // Assume 2GB for low-end devices
  }

  /**
   * Detect GPU type
   */
  private detectGPUType(): 'integrated' | 'discrete' | 'mobile' | 'unknown' {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');

    if (!gl) return 'unknown';

    const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
    if (!debugInfo) return 'unknown';

    const renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);

    if (renderer.includes('Intel')) return 'integrated';
    if (renderer.includes('NVIDIA') || renderer.includes('AMD') || renderer.includes('Radeon')) return 'discrete';
    if (renderer.includes('Mali') || renderer.includes('Adreno') || renderer.includes('PowerVR')) return 'mobile';

    return 'unknown';
  }

  /**
   * Detect color gamut support
   */
  private detectColorGamut(): 'srgb' | 'p3' | 'rec2020' | 'unknown' {
    if (window.matchMedia('(color-gamut: rec2020)').matches) return 'rec2020';
    if (window.matchMedia('(color-gamut: p3)').matches) return 'p3';
    if (window.matchMedia('(color-gamut: srgb)').matches) return 'srgb';
    return 'unknown';
  }

  /**
   * Detect HDR support
   */
  private detectHDRSupport(): boolean {
    return window.matchMedia('(dynamic-range: high)').matches;
  }

  /**
   * Detect mouse support
   */
  private detectMouseSupport(): boolean {
    return window.matchMedia('(pointer: fine)').matches;
  }

  /**
   * Detect network connection type
   */
  private detectConnectionType(): DeviceCapabilities['connectionType'] {
    // @ts-ignore - connection is not in TypeScript types yet
    if (navigator.connection) {
      // @ts-ignore
      const connection = navigator.connection;
      // @ts-ignore
      return connection.type || 'unknown';
    }
    return 'unknown';
  }

  /**
   * Get effective connection type
   */
  private getEffectiveConnectionType(): string {
    // @ts-ignore
    if (navigator.connection) {
      // @ts-ignore
      return navigator.connection.effectiveType || 'unknown';
    }
    return 'unknown';
  }

  /**
   * Get downlink speed
   */
  private getDownlink(): number {
    // @ts-ignore
    if (navigator.connection) {
      // @ts-ignore
      return navigator.connection.downlink || 0;
    }
    return 0;
  }

  /**
   * Get round trip time
   */
  private getRTT(): number {
    // @ts-ignore
    if (navigator.connection) {
      // @ts-ignore
      return navigator.connection.rtt || 0;
    }
    return 0;
  }

  /**
   * Get save data status
   */
  private getSaveDataStatus(): boolean {
    // @ts-ignore
    if (navigator.connection) {
      // @ts-ignore
      return navigator.connection.saveData || false;
    }
    return false;
  }

  /**
   * Detect WebGL support
   */
  private detectWebGLSupport(): boolean {
    try {
      const canvas = document.createElement('canvas');
      return !!(canvas.getContext('webgl') || canvas.getContext('experimental-webgl'));
    } catch (e) {
      return false;
    }
  }

  /**
   * Detect WebGPU support
   */
  private detectWebGPUSupport(): boolean {
    return 'gpu' in navigator;
  }

  /**
   * Detect WebAssembly support
   */
  private detectWebAssemblySupport(): boolean {
    try {
      return typeof WebAssembly === 'object' && typeof WebAssembly.instantiate === 'function';
    } catch (e) {
      return false;
    }
  }

  /**
   * Detect WebRTC support
   */
  private detectWebRTCSupport(): boolean {
    return !!(window.RTCPeerConnection || window.webkitRTCPeerConnection || window.mozRTCPeerConnection);
  }

  /**
   * Detect PWA support
   */
  private detectPWASupport(): boolean {
    return 'serviceWorker' in navigator && 'manifest' in document;
  }

  /**
   * Calculate performance score
   */
  private calculatePerformanceScore(capabilities: DeviceCapabilities): number {
    let score = 0;

    // CPU cores (max 20 points)
    score += Math.min(capabilities.cpuCores * 2.5, 20);

    // Memory (max 20 points)
    score += Math.min(capabilities.memory * 2.5, 20);

    // GPU (max 15 points)
    if (capabilities.gpuType === 'discrete') score += 15;
    else if (capabilities.gpuType === 'integrated') score += 10;
    else if (capabilities.gpuType === 'mobile') score += 5;

    // Network (max 20 points)
    if (capabilities.connectionType === 'wifi' || capabilities.connectionType === 'ethernet') score += 20;
    else if (capabilities.connectionType === '5g') score += 18;
    else if (capabilities.connectionType === '4g') score += 15;
    else if (capabilities.connectionType === '3g') score += 10;
    else if (capabilities.connectionType === '2g') score += 5;

    // Browser capabilities (max 25 points)
    if (capabilities.supportsWebGL) score += 5;
    if (capabilities.supportsWebAssembly) score += 5;
    if (capabilities.supportsServiceWorker) score += 5;
    if (capabilities.supportsIndexedDB) score += 5;
    if (capabilities.supportsWebRTC) score += 5;

    return Math.min(score, 100);
  }

  /**
   * Update settings based on device capabilities
   */
  private updateSettingsBasedOnCapabilities(capabilities: DeviceCapabilities): void {
    const settings = { ...this.settings };

    // Performance-based adjustments
    if (capabilities.performanceScore < 30) {
      settings.animationsEnabled = false;
      settings.highQualityImages = false;
      settings.preloadingEnabled = false;
    } else if (capabilities.performanceScore < 60) {
      settings.animationsEnabled = true;
      settings.highQualityImages = false;
      settings.preloadingEnabled = true;
    }

    // Network-based adjustments
    if (capabilities.saveData || capabilities.downlink < 1) {
      settings.lowDataMode = true;
      settings.highQualityImages = false;
      settings.prefetchResources = false;
    }

    // Touch-based adjustments
    if (capabilities.hasTouch) {
      settings.denseMode = false; // More spacing for touch
    }

    // Image format support
    this.detectImageFormatSupport(settings);

    this.settings = settings;
    this.saveSettings();
  }

  /**
   * Detect image format support
   */
  private detectImageFormatSupport(settings: OptimizationSettings): void {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    // Test WebP support
    canvas.width = 1;
    canvas.height = 1;
    const webpData = canvas.toDataURL('image/webp');
    settings.webpSupport = webpData.indexOf('data:image/webp') === 0;

    // Test AVIF support (more complex, basic detection)
    settings.avifSupport = this.detectAVIFSupport();

    // Update WebGL/WebAssembly support
    settings.webglSupport = this.detectWebGLSupport();
    settings.webassemblySupport = this.detectWebAssemblySupport();
  }

  /**
   * Detect AVIF support
   */
  private detectAVIFSupport(): boolean {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return false;

    canvas.width = 1;
    canvas.height = 1;
    const avifData = canvas.toDataURL('image/avif');
    return avifData.indexOf('data:image/avif') === 0;
  }

  /**
   * Initialize optimizations based on settings
   */
  private initializeOptimizations(): void {
    // Apply CSS custom properties for performance
    this.applyPerformanceCSS();

    // Set up lazy loading
    if (this.settings.lazyLoadingEnabled) {
      this.setupLazyLoading();
    }

    // Set up service worker caching
    if (this.settings.cachingEnabled && this.capabilities?.supportsServiceWorker) {
      this.setupServiceWorkerCaching();
    }

    // Set up reduced motion if needed
    if (this.settings.reducedMotion) {
      this.setupReducedMotion();
    }

    // Set up high contrast mode if needed
    if (this.settings.highContrast) {
      this.setupHighContrast();
    }
  }

  /**
   * Apply performance CSS
   */
  private applyPerformanceCSS(): void {
    const root = document.documentElement;

    // Animation settings
    root.style.setProperty('--animation-duration', this.settings.animationsEnabled ? '0.2s' : '0s');
    root.style.setProperty('--transition-duration', this.settings.animationsEnabled ? '0.15s' : '0s');

    // Image quality settings
    root.style.setProperty('--image-quality', this.settings.highQualityImages ? 'high' : 'medium');

    // Density settings
    root.style.setProperty('--spacing-factor', this.settings.denseMode ? '0.75' : '1');

    // Performance score for conditional rendering
    root.style.setProperty('--performance-score', String(this.capabilities?.performanceScore || 50));
  }

  /**
   * Setup lazy loading
   */
  private setupLazyLoading(): void {
    const images = document.querySelectorAll('img[data-src]');

    if ('IntersectionObserver' in window) {
      const imageObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const img = entry.target as HTMLImageElement;
            img.src = img.dataset.src || '';
            img.classList.remove('lazy');
            imageObserver.unobserve(img);
          }
        });
      });

      images.forEach(img => imageObserver.observe(img));
    } else {
      // Fallback for older browsers
      images.forEach(img => {
        const imageElement = img as HTMLImageElement;
        imageElement.src = imageElement.dataset.src || '';
        imageElement.classList.remove('lazy');
      });
    }
  }

  /**
   * Setup service worker caching
   */
  private setupServiceWorkerCaching(): void {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then(registration => {
        // Configure caching strategies based on settings
        registration.addEventListener('message', event => {
          if (event.data.type === 'CACHE_UPDATED') {
            console.log('Cache updated:', event.data.url);
          }
        });
      });
    }
  }

  /**
   * Setup reduced motion
   */
  private setupReducedMotion(): void {
    const root = document.documentElement;
    root.style.setProperty('--animation-duration', '0s');
    root.style.setProperty('--transition-duration', '0s');

    // Add reduced motion class to body
    document.body.classList.add('reduced-motion');
  }

  /**
   * Setup high contrast mode
   */
  private setupHighContrast(): void {
    const root = document.documentElement;
    root.style.setProperty('--contrast-ratio', 'high');
    document.body.classList.add('high-contrast');
  }

  /**
   * Setup performance monitoring
   */
  private setupPerformanceMonitoring(): void {
    // Monitor Core Web Vitals
    this.observeCoreWebVitals();

    // Monitor custom metrics
    this.observeCustomMetrics();

    // Monitor memory usage
    this.observeMemoryUsage();

    // Monitor animation performance
    this.observeAnimationPerformance();
  }

  /**
   * Observe Core Web Vitals
   */
  private observeCoreWebVitals(): void {
    // Largest Contentful Paint (LCP)
    if ('PerformanceObserver' in window) {
      const lcpObserver = new PerformanceObserver((entryList) => {
        const entries = entryList.getEntries();
        const lastEntry = entries[entries.length - 1];
        this.metrics.lcp = lastEntry.startTime;
      });
      lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
      this.observers.set('lcp', lcpObserver);

      // First Input Delay (FID)
      const fidObserver = new PerformanceObserver((entryList) => {
        const entries = entryList.getEntries();
        entries.forEach(entry => {
          this.metrics.fid = entry.processingStart - entry.startTime;
        });
      });
      fidObserver.observe({ entryTypes: ['first-input'] });
      this.observers.set('fid', fidObserver);

      // Cumulative Layout Shift (CLS)
      const clsObserver = new PerformanceObserver((entryList) => {
        let clsValue = 0;
        entries.forEach(entry => {
          if (!(entry as any).hadRecentInput) {
            clsValue += (entry as any).value;
          }
        });
        this.metrics.cls = clsValue;
      });
      clsObserver.observe({ entryTypes: ['layout-shift'] });
      this.observers.set('cls', clsObserver);

      // First Contentful Paint (FCP)
      const fcpObserver = new PerformanceObserver((entryList) => {
        const entries = entryList.getEntries();
        const fcpEntry = entries.find(entry => entry.name === 'first-contentful-paint');
        if (fcpEntry) {
          this.metrics.fcp = fcpEntry.startTime;
        }
      });
      fcpObserver.observe({ entryTypes: ['paint'] });
      this.observers.set('fcp', fcpObserver);
    }
  }

  /**
   * Observe custom metrics
   */
  private observeCustomMetrics(): void {
    // Monitor booking flow completion time
    this.observeBookingFlow();

    // Monitor search response time
    this.observeSearchPerformance();
  }

  /**
   * Observe booking flow metrics
   */
  private observeBookingFlow(): void {
    let bookingStartTime: number | null = null;

    window.addEventListener('bookingFlowStart', () => {
      bookingStartTime = performance.now();
    });

    window.addEventListener('bookingFlowComplete', () => {
      if (bookingStartTime) {
        this.metrics.bookingFlowCompletionTime = performance.now() - bookingStartTime;
        bookingStartTime = null;
      }
    });
  }

  /**
   * Observe search performance
   */
  private observeSearchPerformance(): void {
    window.addEventListener('searchStart', () => {
      // Record search start time
    });

    window.addEventListener('searchComplete', (event) => {
      const duration = event.detail.duration || 0;
      this.metrics.searchResponseTime = duration;
    });
  }

  /**
   * Observe memory usage
   */
  private observeMemoryUsage(): void {
    if ('memory' in performance) {
      const updateMemoryUsage = () => {
        // @ts-ignore
        this.metrics.memoryUsage = performance.memory.usedJSHeapSize / 1024 / 1024; // MB
      };

      setInterval(updateMemoryUsage, 5000); // Update every 5 seconds
    }
  }

  /**
   * Observe animation performance
   */
  private observeAnimationPerformance(): void {
    let frameCount = 0;
    let lastTime = performance.now();

    const measureFrameRate = () => {
      frameCount++;
      const currentTime = performance.now();

      if (currentTime >= lastTime + 1000) {
        this.metrics.animationFrameRate = frameCount;
        frameCount = 0;
        lastTime = currentTime;
      }

      requestAnimationFrame(measureFrameRate);
    };

    requestAnimationFrame(measureFrameRate);
  }

  /**
   * Get device capabilities
   */
  public getCapabilities(): DeviceCapabilities | null {
    return this.capabilities;
  }

  /**
   * Get current metrics
   */
  public getMetrics(): PerformanceMetrics {
    return { ...this.metrics };
  }

  /**
   * Get current settings
   */
  public getSettings(): OptimizationSettings {
    return { ...this.settings };
  }

  /**
   * Update settings
   */
  public updateSettings(newSettings: Partial<OptimizationSettings>): void {
    this.settings = { ...this.settings, ...newSettings };
    this.saveSettings();
    this.initializeOptimizations();
  }

  /**
   * Save settings to localStorage
   */
  private saveSettings(): void {
    localStorage.setItem('optimization_settings', JSON.stringify(this.settings));
  }

  /**
   * Get optimization recommendations
   */
  public getOptimizationRecommendations(): string[] {
    const recommendations: string[] = [];

    if (!this.capabilities) return recommendations;

    // Performance recommendations
    if (this.capabilities.performanceScore < 30) {
      recommendations.push('Consider disabling animations for better performance');
      recommendations.push('Use lower quality images on this device');
    }

    // Network recommendations
    if (this.capabilities.saveData || this.capabilities.downlink < 1) {
      recommendations.push('Enable data saver mode for better experience');
      recommendations.push('Disable automatic image preloading');
    }

    // Memory recommendations
    if (this.capabilities.memory < 4) {
      recommendations.push('Limit concurrent operations');
      recommendations.push('Use more aggressive cleanup of unused resources');
    }

    // Browser recommendations
    if (!this.capabilities.supportsWebGL) {
      recommendations.push('Some 3D features are not available on this browser');
    }

    if (!this.capabilities.supportsServiceWorker) {
      recommendations.push('Update your browser for better offline support');
    }

    return recommendations;
  }

  /**
   * Cleanup observers
   */
  public cleanup(): void {
    this.observers.forEach(observer => {
      observer.disconnect();
    });
    this.observers.clear();
  }
}

// Export singleton instance
export const deviceOptimizationService = new DeviceOptimizationService();

export default DeviceOptimizationService;