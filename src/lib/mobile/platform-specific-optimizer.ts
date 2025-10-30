/**
 * Platform-Specific Performance Optimizer
 * Performance tuning optimizations specific to iOS and Android platforms
 */

export interface PlatformConfig {
  platform: 'ios' | 'android' | 'unknown';
  version: string;
  deviceModel: string;
  browser: string;
  browserVersion: string;
  isWebView: boolean;
  capabilities: {
    webkitFeatures: string[];
    chromeFeatures: string[];
    hardwareAcceleration: boolean;
    touchOptimizations: boolean;
    nativeScrolling: boolean;
  };
}

export interface IOptimizations {
  scrollBehavior: {
    momentumScrolling: boolean;
    bounceScrolling: boolean;
    scrollSnap: boolean;
    overscrollBehavior: 'auto' | 'contain' | 'none';
  };
  touchHandling: {
    touchAction: string;
    passiveListeners: boolean;
    tapHighlighting: boolean;
    hapticFeedback: boolean;
  };
  rendering: {
    gpuAcceleration: boolean;
    willChange: boolean;
    transform3d: boolean;
    backfaceVisibility: boolean;
  };
  viewport: {
    viewportFit: 'auto' | 'contain' | 'cover';
    userScalable: boolean;
    maximumScale: number;
    safeAreaInsets: boolean;
  };
  animations: {
    webkitOverflowScrolling: boolean;
    hardwareAcceleration: boolean;
    transitionOptimization: boolean;
    animationOptimization: boolean;
  };
  media: {
    videoPlaysInline: boolean;
    videoAutoplay: boolean;
    webkitUserSelect: boolean;
    imageRendering: string;
  };
}

export interface AndroidOptimizations {
  scrollBehavior: {
    overscrollGlow: boolean;
    overscrollColor: string;
    scrollBehavior: 'smooth' | 'auto';
    scrollbarStyle: 'auto' | 'fade' | 'hidden';
  };
  touchHandling: {
    tapHighlighting: boolean;
    longPressDelay: number;
    doubleTapZoom: boolean;
    pinchZoom: boolean;
  };
  rendering: {
    paintHolding: boolean;
    compositorHitTesting: boolean;
    asyncDecoding: boolean;
    lazyLoading: boolean;
  };
  viewport: {
    layoutViewport: boolean;
    visualViewport: boolean;
    viewportMeta: boolean;
    devicePixelRatio: number;
  };
  animations: {
    propertyAnimation: boolean;
    transformAnimation: boolean;
    opacityAnimation: boolean;
    animationPerformance: boolean;
  };
  media: {
    pictureInPicture: boolean;
    fullscreenVideo: boolean;
    hardwareDecoding: boolean;
    adaptiveBitrate: boolean;
  };
}

export interface PlatformPerformanceMetrics {
  platform: string;
  metrics: {
    scrollPerformance: number;
    touchResponse: number;
    renderingFPS: number;
    memoryUsage: number;
    batteryImpact: number;
  };
  issues: string[];
  recommendations: string[];
}

export class PlatformSpecificOptimizer {
  private config: PlatformConfig;
  private iosOptimizations: IOptimizations;
  private androidOptimizations: AndroidOptimizations;
  private isInitialized: boolean = false;
  private performanceMetrics: PlatformPerformanceMetrics | null = null;
  private customCSS: HTMLStyleElement | null = null;
  private eventListeners: Map<string, EventListener> = new Map();

  constructor() {
    this.config = this.detectPlatform();
    this.iosOptimizations = this.initializeIOSOptimizations();
    this.androidOptimizations = this.initializeAndroidOptimizations();
    this.initialize();
  }

  private detectPlatform(): PlatformConfig {
    const ua = navigator.userAgent;
    const platform = this.getPlatform(ua);
    const version = this.getPlatformVersion(ua, platform);
    const deviceModel = this.getDeviceModel(ua, platform);
    const browser = this.getBrowser(ua);
    const browserVersion = this.getBrowserVersion(ua, browser);
    const isWebView = this.detectWebView(ua);

    const capabilities = this.detectCapabilities(platform, browser, ua);

    return {
      platform,
      version,
      deviceModel,
      browser,
      browserVersion,
      isWebView,
      capabilities
    };
  }

  private getPlatform(ua: string): PlatformConfig['platform'] {
    if (/iPad|iPhone|iPod/.test(ua)) return 'ios';
    if (/Android/.test(ua)) return 'android';
    return 'unknown';
  }

  private getPlatformVersion(ua: string, platform: string): string {
    if (platform === 'ios') {
      const match = ua.match(/OS (\d+)_(\d+)/);
      return match ? `${match[1]}.${match[2]}` : 'Unknown';
    } else if (platform === 'android') {
      const match = ua.match(/Android (\d+(?:\.\d+)?)/);
      return match ? match[1] : 'Unknown';
    }
    return 'Unknown';
  }

  private getDeviceModel(ua: string, platform: string): string {
    if (platform === 'ios') {
      if (/iPhone/.test(ua)) {
        const match = ua.match(/iPhone; CPU iPhone OS (\d+)_(\d+)/);
        if (match) {
          const major = parseInt(match[1]);
          if (major >= 16) return 'iPhone 14 or newer';
          if (major >= 15) return 'iPhone 13 series';
          if (major >= 14) return 'iPhone 12 series';
          if (major >= 13) return 'iPhone 11 series';
          return 'iPhone X or older';
        }
      } else if (/iPad/.test(ua)) {
        return 'iPad';
      }
    } else if (platform === 'android') {
      const match = ua.match(/; ([^)]+)\)/);
      return match ? match[1] : 'Android Device';
    }
    return 'Unknown Device';
  }

  private getBrowser(ua: string): string {
    if (/CriOS/.test(ua)) return 'Chrome';
    if (/Chrome/.test(ua)) return 'Chrome';
    if (/Safari/.test(ua) && !/Chrome/.test(ua)) return 'Safari';
    if (/Firefox/.test(ua)) return 'Firefox';
    if (/Edg/.test(ua)) return 'Edge';
    if (/Opera/.test(ua)) return 'Opera';
    return 'Unknown';
  }

  private getBrowserVersion(ua: string, browser: string): string {
    const patterns: Record<string, RegExp> = {
      Chrome: /Chrome\/(\d+(?:\.\d+)?)/,
      Safari: /Version\/(\d+(?:\.\d+)?).*Safari/,
      Firefox: /Firefox\/(\d+(?:\.\d+)?)/,
      Edge: /Edg\/(\d+(?:\.\d+)?)/,
      Opera: /OPR\/(\d+(?:\.\d+)?)/
    };

    const pattern = patterns[browser];
    if (pattern) {
      const match = ua.match(pattern);
      return match ? match[1] : 'Unknown';
    }

    return 'Unknown';
  }

  private detectWebView(ua: string): boolean {
    const webViewPatterns = [
      /wv/, // Android WebView
      /Version\/.*Mobile\/.*Safari/, // iOS WebView
      /FBAN|FBAV/, // Facebook WebView
      /Twitter|Instagram/, // Social media WebViews
      /GSA\/\d+/, // Google Search App WebView
    ];

    return webViewPatterns.some(pattern => pattern.test(ua));
  }

  private detectCapabilities(platform: string, browser: string, ua: string): PlatformConfig['capabilities'] {
    const capabilities = {
      webkitFeatures: [] as string[],
      chromeFeatures: [] as string[],
      hardwareAcceleration: true, // Assume available on modern devices
      touchOptimizations: 'ontouchstart' in window,
      nativeScrolling: true
    };

    // Detect WebKit features
    if (platform === 'ios' || browser === 'Safari') {
      capabilities.webkitFeatures = [
        '-webkit-overflow-scrolling',
        '-webkit-backface-visibility',
        '-webkit-transform3d',
        '-webkit-perspective',
        '-webkit-filter'
      ].filter(feature => CSS.supports || this.hasCSSFeature(feature));
    }

    // Detect Chrome features
    if (browser === 'Chrome') {
      capabilities.chromeFeatures = [
        'scroll-behavior',
        'overscroll-behavior',
        'will-change',
        'contain',
        'content-visibility'
      ].filter(feature => CSS.supports && CSS.supports(feature, 'initial'));
    }

    return capabilities;
  }

  private hasCSSFeature(feature: string): boolean {
    try {
      const testElement = document.createElement('div');
      testElement.style[feature as any] = '';
      return testElement.style.length > 0;
    } catch {
      return false;
    }
  }

  private initializeIOSOptimizations(): IOptimizations {
    return {
      scrollBehavior: {
        momentumScrolling: true,
        bounceScrolling: true,
        scrollSnap: true,
        overscrollBehavior: 'auto'
      },
      touchHandling: {
        touchAction: 'manipulation',
        passiveListeners: true,
        tapHighlighting: false,
        hapticFeedback: 'vibrate' in navigator
      },
      rendering: {
        gpuAcceleration: true,
        willChange: true,
        transform3d: true,
        backfaceVisibility: true
      },
      viewport: {
        viewportFit: 'cover',
        userScalable: true,
        maximumScale: 5,
        safeAreaInsets: true
      },
      animations: {
        webkitOverflowScrolling: true,
        hardwareAcceleration: true,
        transitionOptimization: true,
        animationOptimization: true
      },
      media: {
        videoPlaysInline: true,
        videoAutoplay: false,
        webkitUserSelect: true,
        imageRendering: 'auto'
      }
    };
  }

  private initializeAndroidOptimizations(): AndroidOptimizations {
    return {
      scrollBehavior: {
        overscrollGlow: true,
        overscrollColor: 'rgba(0, 0, 0, 0.2)',
        scrollBehavior: 'smooth',
        scrollbarStyle: 'fade'
      },
      touchHandling: {
        tapHighlighting: false,
        longPressDelay: 500,
        doubleTapZoom: true,
        pinchZoom: true
      },
      rendering: {
        paintHolding: true,
        compositorHitTesting: true,
        asyncDecoding: true,
        lazyLoading: true
      },
      viewport: {
        layoutViewport: true,
        visualViewport: true,
        viewportMeta: true,
        devicePixelRatio: window.devicePixelRatio || 1
      },
      animations: {
        propertyAnimation: true,
        transformAnimation: true,
        opacityAnimation: true,
        animationPerformance: true
      },
      media: {
        pictureInPicture: true,
        fullscreenVideo: true,
        hardwareDecoding: true,
        adaptiveBitrate: true
      }
    };
  }

  private async initialize(): Promise<void> {
    console.log(`🔧 Initializing Platform-Specific Optimizer for ${this.config.platform}`);

    try {
      // Apply platform-specific optimizations
      if (this.config.platform === 'ios') {
        await this.applyIOSOptimizations();
      } else if (this.config.platform === 'android') {
        await this.applyAndroidOptimizations();
      }

      // Apply general mobile optimizations
      await this.applyGeneralMobileOptimizations();

      // Set up performance monitoring
      this.setupPerformanceMonitoring();

      // Set up event listeners
      this.setupEventListeners();

      this.isInitialized = true;
      console.log(`✅ Platform-Specific Optimizer initialized for ${this.config.platform} ${this.config.version}`);

    } catch (error) {
      console.error('❌ Failed to initialize Platform-Specific Optimizer:', error);
    }
  }

  private async applyIOSOptimizations(): Promise<void> {
    const css = this.generateIOSCSS();
    this.addCSS(css);

    // Update viewport meta tag
    this.updateViewportMetaForIOS();

    // Configure safe area support
    this.configureSafeAreaSupport();

    // Optimize touch interactions
    this.optimizeIOSTouchInteractions();

    // Configure video elements
    this.optimizeIOSVideoElements();
  }

  private generateIOSCSS(): string {
    const { iosOptimizations } = this;

    return `
      /* iOS-specific optimizations */
      html {
        -webkit-text-size-adjust: 100%;
        -webkit-tap-highlight-color: transparent;
        -webkit-touch-callout: none;
        -webkit-user-select: none;
        user-select: none;
      }

      body {
        -webkit-overflow-scrolling: ${iosOptimizations.scrollBehavior.webkitOverflowScrolling ? 'touch' : 'auto'};
        overscroll-behavior-y: ${iosOptimizations.scrollBehavior.overscrollBehavior};
      }

      .ios-scroll {
        -webkit-overflow-scrolling: touch;
        scroll-behavior: smooth;
        scroll-snap-type: ${iosOptimizations.scrollBehavior.scrollSnap ? 'y mandatory' : 'none'};
      }

      .ios-scroll-child {
        scroll-snap-align: start;
      }

      .ios-gpu-accelerated {
        ${iosOptimizations.rendering.transform3d ? '-webkit-transform: translateZ(0);' : ''}
        ${iosOptimizations.rendering.backfaceVisibility ? '-webkit-backface-visibility: hidden;' : ''}
        ${iosOptimizations.rendering.willChange ? 'will-change: transform, opacity;' : ''}
      }

      .ios-button {
        -webkit-appearance: none;
        -webkit-tap-highlight-color: rgba(0, 0, 0, 0);
        border-radius: 8px;
        background: #000;
        color: #fff;
        border: none;
        padding: 12px 24px;
        font-weight: 600;
        transition: opacity 0.2s ease;
      }

      .ios-button:active {
        opacity: 0.7;
      }

      .ios-input {
        -webkit-appearance: none;
        border-radius: 8px;
        border: 1px solid #ddd;
        padding: 12px;
        font-size: 16px; /* Prevent zoom on focus */
      }

      .ios-video {
        -webkit-appearance: none;
        width: 100%;
        border-radius: 8px;
        ${iosOptimizations.media.videoPlaysInline ? 'playsinline: true;' : ''}
        ${iosOptimizations.media.videoAutoplay ? 'autoplay: true;' : ''}
      }

      .ios-safe-area {
        padding-top: env(safe-area-inset-top);
        padding-left: env(safe-area-inset-left);
        padding-right: env(safe-area-inset-right);
        padding-bottom: env(safe-area-inset-bottom);
      }

      .ios-sticky-header {
        position: sticky;
        top: env(safe-area-inset-top);
        z-index: 100;
        backdrop-filter: blur(20px);
        -webkit-backdrop-filter: blur(20px);
      }

      /* Disable bounce scroll on specific elements */
      .ios-no-bounce {
        overscroll-behavior: none;
        -webkit-overflow-scrolling: auto;
      }

      /* Optimized transitions for iOS */
      .ios-transition {
        ${iosOptimizations.animations.transitionOptimization ? 'transition: transform 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);' : ''}
        -webkit-transform: translateZ(0);
      }

      /* Performance optimizations */
      .ios-performance {
        contain: layout style paint;
        content-visibility: auto;
        contain-intrinsic-size: 0 500px;
      }
    `;
  }

  private updateViewportMetaForIOS(): void {
    const viewportMeta = document.querySelector('meta[name="viewport"]') as HTMLMetaElement;
    if (viewportMeta) {
      const content = [
        'width=device-width',
        'initial-scale=1',
        'maximum-scale=5',
        'user-scalable=yes',
        'viewport-fit=cover',
        'shrink-to-fit=no'
      ].join(', ');

      viewportMeta.content = content;
    }
  }

  private configureSafeAreaSupport(): void {
    const root = document.documentElement;
    root.style.setProperty('--safe-area-inset-top', 'env(safe-area-inset-top)');
    root.style.setProperty('--safe-area-inset-right', 'env(safe-area-inset-right)');
    root.style.setProperty('--safe-area-inset-bottom', 'env(safe-area-inset-bottom)');
    root.style.setProperty('--safe-area-inset-left', 'env(safe-area-inset-left)');
  }

  private optimizeIOSTouchInteractions(): void {
    // Remove tap highlighting on interactive elements
    const interactiveElements = document.querySelectorAll('button, a, input, select, textarea');
    interactiveElements.forEach(element => {
      (element as HTMLElement).style.webkitTapHighlightColor = 'transparent';
    });

    // Add passive event listeners for better scroll performance
    document.addEventListener('touchstart', () => {}, { passive: true });
    document.addEventListener('touchmove', () => {}, { passive: true });
  }

  private optimizeIOSVideoElements(): void {
    const videos = document.querySelectorAll('video');
    videos.forEach(video => {
      video.setAttribute('playsinline', '');
      video.setAttribute('webkit-playsinline', '');
      if (this.iosOptimizations.media.videoPlaysInline) {
        video.setAttribute('playsinline', '');
      }
    });
  }

  private async applyAndroidOptimizations(): Promise<void> {
    const css = this.generateAndroidCSS();
    this.addCSS(css);

    // Update viewport meta tag
    this.updateViewportMetaForAndroid();

    // Optimize touch interactions
    this.optimizeAndroidTouchInteractions();

    // Configure scrolling behavior
    this.configureAndroidScrolling();

    // Optimize media elements
    this.optimizeAndroidMediaElements();
  }

  private generateAndroidCSS(): string {
    const { androidOptimizations } = this;

    return `
      /* Android-specific optimizations */
      html {
        -webkit-text-size-adjust: 100%;
        -webkit-tap-highlight-color: transparent;
      }

      body {
        overscroll-behavior: ${androidOptimizations.scrollBehavior.scrollBehavior};
        scroll-behavior: ${androidOptimizations.scrollBehavior.scrollBehavior};
      }

      .android-scroll {
        scroll-behavior: ${androidOptimizations.scrollBehavior.scrollBehavior};
        scrollbar-width: ${androidOptimizations.scrollBehavior.scrollbarStyle === 'hidden' ? 'none' : 'auto'};
      }

      .android-scroll::-webkit-scrollbar {
        width: 4px;
        height: 4px;
      }

      .android-scroll::-webkit-scrollbar-track {
        background: transparent;
      }

      .android-scroll::-webkit-scrollbar-thumb {
        background: ${androidOptimizations.scrollBehavior.overscrollColor};
        border-radius: 2px;
      }

      .android-gpu-accelerated {
        ${androidOptimizations.rendering.transformAnimation ? 'transform: translateZ(0);' : ''}
        will-change: transform, opacity;
      }

      .android-button {
        -webkit-appearance: none;
        -webkit-tap-highlight-color: rgba(0, 0, 0, 0);
        border-radius: 8px;
        background: #1976d2;
        color: #fff;
        border: none;
        padding: 12px 24px;
        font-weight: 500;
        transition: background-color 0.2s ease;
      }

      .android-button:active {
        background-color: #1565c0;
      }

      .android-input {
        -webkit-appearance: none;
        border-radius: 4px;
        border: 1px solid #ddd;
        padding: 12px;
        font-size: 16px;
        background-color: #fff;
      }

      .android-video {
        ${androidOptimizations.media.hardwareDecoding ? 'hardware-acceleration: true;' : ''}
        ${androidOptimizations.media.pictureInPicture ? 'picture-in-picture: true;' : ''}
      }

      /* Overscroll glow effect */
      .android-overscroll-glow {
        overscroll-behavior: auto;
      }

      .android-no-overscroll {
        overscroll-behavior: contain;
      }

      /* Optimized animations for Android */
      .android-animation {
        ${androidOptimizations.animations.propertyAnimation ? 'transition: transform 0.2s ease-out, opacity 0.2s ease-out;' : ''}
        ${androidOptimizations.animations.transformAnimation ? 'animation: androidSlideIn 0.3s ease-out;' : ''}
      }

      @keyframes androidSlideIn {
        from {
          transform: translateY(20px);
          opacity: 0;
        }
        to {
          transform: translateY(0);
          opacity: 1;
        }
      }

      /* Performance optimizations */
      .android-performance {
        contain: layout style paint;
        content-visibility: auto;
        contain-intrinsic-size: 0 500px;
      }

      /* Material Design ripple effect */
      .android-ripple {
        position: relative;
        overflow: hidden;
      }

      .android-ripple::after {
        content: '';
        position: absolute;
        top: 50%;
        left: 50%;
        width: 0;
        height: 0;
        border-radius: 50%;
        background: rgba(255, 255, 255, 0.5);
        transform: translate(-50%, -50%);
        transition: width 0.6s, height 0.6s;
      }

      .android-ripple:active::after {
        width: 300px;
        height: 300px;
      }
    `;
  }

  private updateViewportMetaForAndroid(): void {
    const viewportMeta = document.querySelector('meta[name="viewport"]') as HTMLMetaElement;
    if (viewportMeta) {
      const content = [
        'width=device-width',
        'initial-scale=1',
        'maximum-scale=5',
        'user-scalable=yes',
        'shrink-to-fit=no'
      ].join(', ');

      viewportMeta.content = content;
    }
  }

  private optimizeAndroidTouchInteractions(): void {
    // Configure touch delays
    document.addEventListener('touchstart', (e) => {
      // Add ripple effect for buttons
      if ((e.target as HTMLElement).classList.contains('android-ripple')) {
        this.addRippleEffect(e.target as HTMLElement);
      }
    }, { passive: true });

    // Prevent long press context menu on specific elements
    const noContextMenuElements = document.querySelectorAll('.no-context-menu');
    noContextMenuElements.forEach(element => {
      element.addEventListener('contextmenu', (e) => {
        e.preventDefault();
      });
    });
  }

  private addRippleEffect(element: HTMLElement): void {
    element.classList.add('ripple-active');
    setTimeout(() => {
      element.classList.remove('ripple-active');
    }, 600);
  }

  private configureAndroidScrolling(): void {
    // Configure scroll behavior
    const scrollableElements = document.querySelectorAll('.android-scroll');
    scrollableElements.forEach(element => {
      if (this.androidOptimizations.scrollBehavior.scrollBehavior === 'smooth') {
        element.setAttribute('scroll-behavior', 'smooth');
      }
    });
  }

  private optimizeAndroidMediaElements(): void {
    const videos = document.querySelectorAll('video');
    videos.forEach(video => {
      if (this.androidOptimizations.media.pictureInPicture) {
        video.setAttribute('controls', '');
      }
    });
  }

  private async applyGeneralMobileOptimizations(): Promise<void> {
    const css = `
      /* General mobile optimizations */
      * {
        box-sizing: border-box;
        -webkit-box-sizing: border-box;
      }

      html {
        font-size: 16px;
        -webkit-text-size-adjust: 100%;
        -ms-text-size-adjust: 100%;
      }

      body {
        margin: 0;
        padding: 0;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        line-height: 1.5;
        color: #333;
        background-color: #fff;
        -webkit-font-smoothing: antialiased;
        -moz-osx-font-smoothing: grayscale;
      }

      img {
        max-width: 100%;
        height: auto;
        border: 0;
        ${this.config.platform === 'ios' ? '-webkit-user-drag: none;' : ''}
      }

      a {
        color: #007aff;
        text-decoration: none;
        -webkit-tap-highlight-color: transparent;
      }

      a:hover {
        text-decoration: underline;
      }

      button, input, select, textarea {
        font-family: inherit;
        font-size: 16px; /* Prevent zoom on focus */
        margin: 0;
      }

      /* Touch-friendly targets */
      .touch-target {
        min-height: 44px;
        min-width: 44px;
        padding: 8px;
      }

      /* Performance optimizations */
      .gpu-layer {
        transform: translateZ(0);
        backface-visibility: hidden;
        perspective: 1000px;
      }

      .will-change {
        will-change: transform;
      }

      /* Loading states */
      .loading {
        opacity: 0.6;
        pointer-events: none;
      }

      .loaded {
        opacity: 1;
        pointer-events: auto;
        transition: opacity 0.3s ease;
      }

      /* Responsive utilities */
      .mobile-only {
        display: block;
      }

      .desktop-only {
        display: none;
      }

      @media (min-width: 768px) {
        .mobile-only {
          display: none;
        }

        .desktop-only {
          display: block;
        }
      }
    `;

    this.addCSS(css);
  }

  private addCSS(css: string): void {
    if (!this.customCSS) {
      this.customCSS = document.createElement('style');
      this.customCSS.setAttribute('data-platform-optimizer', 'true');
      document.head.appendChild(this.customCSS);
    }

    this.customCSS.textContent += css + '\n';
  }

  private setupPerformanceMonitoring(): void {
    // Monitor scroll performance
    let lastScrollTime = 0;
    const scrollThreshold = 16; // 60fps = 16.67ms per frame

    const scrollHandler = () => {
      const now = performance.now();
      const scrollTime = now - lastScrollTime;

      if (scrollTime > scrollThreshold) {
        console.warn(`⚠️ Slow scroll performance: ${scrollTime}ms`);
      }

      lastScrollTime = now;
    };

    window.addEventListener('scroll', scrollHandler, { passive: true });
    this.eventListeners.set('scroll', scrollHandler);

    // Monitor touch response time
    let touchStartTime = 0;

    const touchStartHandler = () => {
      touchStartTime = performance.now();
    };

    const touchEndHandler = () => {
      const responseTime = performance.now() - touchStartTime;
      if (responseTime > 100) {
        console.warn(`⚠️ Slow touch response: ${responseTime}ms`);
      }
    };

    document.addEventListener('touchstart', touchStartHandler, { passive: true });
    document.addEventListener('touchend', touchEndHandler, { passive: true });

    this.eventListeners.set('touchstart', touchStartHandler);
    this.eventListeners.set('touchend', touchEndHandler);
  }

  private setupEventListeners(): void {
    // Handle orientation changes
    const orientationHandler = () => {
      console.log('📱 Orientation changed:', window.orientation);
      this.handleOrientationChange();
    };

    window.addEventListener('orientationchange', orientationHandler);
    this.eventListeners.set('orientationchange', orientationHandler);

    // Handle visual viewport changes
    if ('visualViewport' in window) {
      const viewportHandler = () => {
        this.handleVisualViewportChange();
      };

      (window as any).visualViewport.addEventListener('resize', viewportHandler);
      this.eventListeners.set('viewportresize', viewportHandler);
    }
  }

  private handleOrientationChange(): void {
    // Apply orientation-specific optimizations
    const isLandscape = window.orientation === 90 || window.orientation === -90;

    if (isLandscape) {
      document.body.classList.add('landscape');
      document.body.classList.remove('portrait');
    } else {
      document.body.classList.add('portrait');
      document.body.classList.remove('landscape');
    }

    // Re-apply platform optimizations after orientation change
    setTimeout(() => {
      if (this.config.platform === 'ios') {
        this.optimizeIOSTouchInteractions();
      } else if (this.config.platform === 'android') {
        this.optimizeAndroidTouchInteractions();
      }
    }, 100);
  }

  private handleVisualViewportChange(): void {
    const visualViewport = (window as any).visualViewport;
    if (visualViewport) {
      const scale = visualViewport.scale;

      // Adjust font size based on zoom level
      if (scale > 1.5) {
        document.documentElement.style.fontSize = '14px';
      } else {
        document.documentElement.style.fontSize = '16px';
      }
    }
  }

  // Public API methods

  getPlatformConfig(): PlatformConfig {
    return this.config;
  }

  getPerformanceMetrics(): PlatformPerformanceMetrics | null {
    return this.performanceMetrics;
  }

  applyOptimizationsToElement(element: HTMLElement): void {
    // Add platform-specific classes
    element.classList.add(`${this.config.platform}-optimized`);
    element.classList.add('mobile-optimized');

    // Apply GPU acceleration
    element.classList.add('gpu-layer');

    // Add touch target class for interactive elements
    if (['BUTTON', 'A', 'INPUT', 'SELECT', 'TEXTAREA'].includes(element.tagName)) {
      element.classList.add('touch-target');
    }

    // Apply platform-specific optimizations
    if (this.config.platform === 'ios') {
      element.classList.add('ios-gpu-accelerated');
      if (this.iosOptimizations.animations.transitionOptimization) {
        element.classList.add('ios-transition');
      }
    } else if (this.config.platform === 'android') {
      element.classList.add('android-gpu-accelerated');
      if (this.androidOptimizations.animations.propertyAnimation) {
        element.classList.add('android-animation');
      }

      // Add ripple effect to buttons
      if (element.tagName === 'BUTTON') {
        element.classList.add('android-ripple');
      }
    }
  }

  optimizeForLowEndDevice(): void {
    const lowEndCSS = `
      .low-end-performance {
        transition: none !important;
        animation: none !important;
        transform: none !important;
        box-shadow: none !important;
        filter: none !important;
      }

      .low-end-performance * {
        transition: none !important;
        animation: none !important;
      }
    `;

    this.addCSS(lowEndCSS);
    document.body.classList.add('low-end-performance');
    console.log('🐌 Applied low-end device optimizations');
  }

  getOptimizationReport(): any {
    return {
      platform: this.config,
      iosOptimizations: this.config.platform === 'ios' ? this.iosOptimizations : null,
      androidOptimizations: this.config.platform === 'android' ? this.androidOptimizations : null,
      performanceMetrics: this.performanceMetrics,
      isInitialized: this.isInitialized,
      customCSSApplied: !!this.customCSS
    };
  }

  updateOptimizations(config: Partial<IOptimizations | AndroidOptimizations>): void {
    if (this.config.platform === 'ios' && config) {
      this.iosOptimizations = { ...this.iosOptimizations, ...config as Partial<IOptimizations> };
    } else if (this.config.platform === 'android' && config) {
      this.androidOptimizations = { ...this.androidOptimizations, ...config as Partial<AndroidOptimizations> };
    }

    console.log('🔄 Platform optimizations updated');
  }

  destroy(): void {
    // Remove event listeners
    this.eventListeners.forEach((listener, event) => {
      if (event === 'scroll') {
        window.removeEventListener(event, listener);
      } else if (event === 'orientationchange') {
        window.removeEventListener(event, listener);
      } else if (event === 'viewportresize') {
        (window as any).visualViewport?.removeEventListener('resize', listener);
      } else {
        document.removeEventListener(event, listener);
      }
    });

    // Remove custom CSS
    if (this.customCSS) {
      this.customCSS.remove();
      this.customCSS = null;
    }

    // Clear event listeners map
    this.eventListeners.clear();

    this.isInitialized = false;
    console.log('🧹 Platform-Specific Optimizer cleaned up');
  }
}

// Singleton instance
let platformSpecificOptimizer: PlatformSpecificOptimizer | null = null;

export function initializePlatformSpecificOptimizer(): PlatformSpecificOptimizer {
  if (!platformSpecificOptimizer) {
    platformSpecificOptimizer = new PlatformSpecificOptimizer();
  }
  return platformSpecificOptimizer;
}

export function getPlatformSpecificOptimizer(): PlatformSpecificOptimizer | null {
  return platformSpecificOptimizer;
}

// Auto-initialize
if (typeof document !== 'undefined') {
  document.addEventListener('DOMContentLoaded', () => {
    initializePlatformSpecificOptimizer();
  });
}

// Global access for debugging
declare global {
  interface Window {
    platformSpecificOptimizer: PlatformSpecificOptimizer;
  }
}

if (import.meta.env.DEV) {
  window.addEventListener('load', () => {
    const optimizer = initializePlatformSpecificOptimizer();
    window.platformSpecificOptimizer = optimizer;
    console.log('🔧 Platform-Specific Optimizer available via window.platformSpecificOptimizer');
  });
}