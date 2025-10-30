/**
 * Mobile UI Optimization System
 * Mobile-specific UI optimizations and responsive improvements for luxury beauty/fitness platform
 */

export interface MobileUIConfig {
  enableResponsiveOptimizations: boolean;
  enableTouchOptimizations: boolean;
  enableViewportOptimizations: boolean;
  enableScrollOptimizations: boolean;
  enableFormOptimizations: boolean;
  luxuryMode: boolean;
  targetDevice: 'mobile' | 'tablet' | 'desktop';
  performanceProfile: 'high' | 'medium' | 'low';
}

export interface ViewportOptimization {
  safeArea: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
  viewportHeight: number;
  viewportWidth: number;
  devicePixelRatio: number;
  orientation: 'portrait' | 'landscape';
  isSmallDevice: boolean;
  isTouchDevice: boolean;
}

export interface ResponsiveBreakpoint {
  name: string;
  minWidth: number;
  maxWidth: number;
  optimizations: {
    fontSize: number;
    spacing: number;
    borderRadius: number;
    imageSize: string;
    columns: number;
  };
}

export interface TouchOptimization {
  tapTargets: {
    minSize: number;
    minSpacing: number;
    visualFeedback: boolean;
    hapticFeedback: boolean;
  };
  gestures: {
    swipeEnabled: boolean;
    pinchEnabled: boolean;
    longPressEnabled: boolean;
    doubleTapEnabled: boolean;
  };
  scrolling: {
    momentumEnabled: boolean;
    bounceEnabled: boolean;
    scrollbarStyle: 'auto' | 'fade' | 'hidden';
  };
}

export interface ScrollOptimization {
  smoothScrolling: boolean;
  scrollSnap: boolean;
  parallaxEnabled: boolean;
  lazyLoadImages: boolean;
  stickyElements: string[];
  scrollCallbacks: Map<string, Function>;
}

export interface FormOptimization {
  inputTypes: {
    touchOptimized: boolean;
    autoComplete: boolean;
    autoCorrect: boolean;
    autoCapitalize: boolean;
  };
  validation: {
    realTime: boolean;
    visualFeedback: boolean;
    errorPlacement: 'inline' | 'toast' | 'modal';
  };
  layout: {
    stackedOnMobile: boolean;
    floatingLabels: boolean;
    adaptiveHeight: boolean;
  };
}

export interface UIPerformanceMetrics {
  renderTime: number;
  layoutShifts: number;
  inputDelay: number;
  scrollPerformance: number;
  touchResponseTime: number;
  batteryImpact: 'low' | 'medium' | 'high';
}

export class MobileUIOptimizer {
  private config: MobileUIConfig;
  private viewport: ViewportOptimization;
  private breakpoints: ResponsiveBreakpoint[];
  private touchOptimization: TouchOptimization;
  private scrollOptimization: ScrollOptimization;
  private formOptimization: FormOptimization;
  private isInitialized: boolean = false;
  private performanceObserver: PerformanceObserver | null = null;
  private resizeObserver: ResizeObserver | null = null;
  private intersectionObserver: IntersectionObserver | null = null;
  private styleElement: HTMLStyleElement | null = null;
  private customProperties: Map<string, string> = new Map();

  constructor(config: MobileUIConfig) {
    this.config = {
      enableResponsiveOptimizations: true,
      enableTouchOptimizations: true,
      enableViewportOptimizations: true,
      enableScrollOptimizations: true,
      enableFormOptimizations: true,
      luxuryMode: true,
      targetDevice: 'mobile',
      performanceProfile: 'high',
      ...config
    };

    this.viewport = this.getViewportInfo();
    this.breakpoints = this.initializeBreakpoints();
    this.touchOptimization = this.initializeTouchOptimizations();
    this.scrollOptimization = this.initializeScrollOptimizations();
    this.formOptimization = this.initializeFormOptimizations();
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    console.log('🎨 Initializing Mobile UI Optimizer for luxury beauty/fitness platform');

    try {
      // Initialize viewport optimizations
      if (this.config.enableViewportOptimizations) {
        await this.initializeViewportOptimizations();
      }

      // Initialize responsive optimizations
      if (this.config.enableResponsiveOptimizations) {
        await this.initializeResponsiveOptimizations();
      }

      // Initialize touch optimizations
      if (this.config.enableTouchOptimizations) {
        await this.initializeTouchInteractions();
      }

      // Initialize scroll optimizations
      if (this.config.enableScrollOptimizations) {
        await this.initializeScrollOptimizationsSystem();
      }

      // Initialize form optimizations
      if (this.config.enableFormOptimizations) {
        await this.initializeFormOptimizationsSystem();
      }

      // Start monitoring
      this.startPerformanceMonitoring();

      this.isInitialized = true;
      console.log('✅ Mobile UI Optimizer initialized successfully');

    } catch (error) {
      console.error('❌ Failed to initialize Mobile UI Optimizer:', error);
      throw error;
    }
  }

  private getViewportInfo(): ViewportOptimization {
    const safeArea = this.getSafeAreaInsets();
    const width = window.innerWidth;
    const height = window.innerHeight;
    const devicePixelRatio = window.devicePixelRatio || 1;
    const isSmallDevice = width <= 375 || height <= 667; // iPhone SE and similar
    const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

    return {
      safeArea,
      viewportHeight: height,
      viewportWidth: width,
      devicePixelRatio,
      orientation: width > height ? 'landscape' : 'portrait',
      isSmallDevice,
      isTouchDevice
    };
  }

  private getSafeAreaInsets(): ViewportOptimization['safeArea'] {
    const computedStyle = getComputedStyle(document.documentElement);
    const top = parseInt(computedStyle.getPropertyValue('env(safe-area-inset-top)') || '0');
    const right = parseInt(computedStyle.getPropertyValue('env(safe-area-inset-right)') || '0');
    const bottom = parseInt(computedStyle.getPropertyValue('env(safe-area-inset-bottom)') || '0');
    const left = parseInt(computedStyle.getPropertyValue('env(safe-area-inset-left)') || '0');

    return { top, right, bottom, left };
  }

  private initializeBreakpoints(): ResponsiveBreakpoint[] {
    const baseConfig = this.config.luxuryMode ? {
      fontSize: 16,
      spacing: 8,
      borderRadius: 12,
      imageSize: 'medium',
      columns: 1
    } : {
      fontSize: 14,
      spacing: 6,
      borderRadius: 8,
      imageSize: 'small',
      columns: 1
    };

    return [
      {
        name: 'small-mobile',
        minWidth: 0,
        maxWidth: 374,
        optimizations: {
          ...baseConfig,
          fontSize: baseConfig.fontSize - 2,
          spacing: baseConfig.spacing - 2,
          borderRadius: baseConfig.radius - 2,
          imageSize: 'small',
          columns: 1
        }
      },
      {
        name: 'mobile',
        minWidth: 375,
        maxWidth: 413,
        optimizations: baseConfig
      },
      {
        name: 'large-mobile',
        minWidth: 414,
        maxWidth: 767,
        optimizations: {
          ...baseConfig,
          fontSize: baseConfig.fontSize + 1,
          spacing: baseConfig.spacing + 1,
          imageSize: 'large',
          columns: 1
        }
      },
      {
        name: 'tablet',
        minWidth: 768,
        maxWidth: 1023,
        optimizations: {
          ...baseConfig,
          fontSize: baseConfig.fontSize + 2,
          spacing: baseConfig.spacing + 2,
          borderRadius: baseConfig.radius + 2,
          imageSize: 'large',
          columns: 2
        }
      },
      {
        name: 'desktop',
        minWidth: 1024,
        maxWidth: 9999,
        optimizations: {
          ...baseConfig,
          fontSize: baseConfig.fontSize + 3,
          spacing: baseConfig.spacing + 3,
          borderRadius: baseConfig.radius + 3,
          imageSize: 'xlarge',
          columns: 3
        }
      }
    ];
  }

  private initializeTouchOptimizations(): TouchOptimization {
    return {
      tapTargets: {
        minSize: this.viewport.isSmallDevice ? 44 : 48, // Apple HIG minimum
        minSpacing: 8,
        visualFeedback: true,
        hapticFeedback: 'vibrate' in navigator
      },
      gestures: {
        swipeEnabled: true,
        pinchEnabled: true,
        longPressEnabled: true,
        doubleTapEnabled: true
      },
      scrolling: {
        momentumEnabled: true,
        bounceEnabled: this.isIOS(),
        scrollbarStyle: 'fade'
      }
    };
  }

  private initializeScrollOptimizations(): ScrollOptimization {
    return {
      smoothScrolling: true,
      scrollSnap: this.config.luxuryMode,
      parallaxEnabled: this.config.performanceProfile !== 'low',
      lazyLoadImages: true,
      stickyElements: ['.header', '.booking-summary', '.service-nav'],
      scrollCallbacks: new Map()
    };
  }

  private initializeFormOptimizations(): FormOptimization {
    return {
      inputTypes: {
        touchOptimized: true,
        autoComplete: true,
        autoCorrect: false,
        autoCapitalize: 'off'
      },
      validation: {
        realTime: true,
        visualFeedback: true,
        errorPlacement: 'inline'
      },
      layout: {
        stackedOnMobile: true,
        floatingLabels: this.config.luxuryMode,
        adaptiveHeight: true
      }
    };
  }

  private async initializeViewportOptimizations(): Promise<void> {
    // Set viewport meta tag optimizations
    this.updateViewportMeta();

    // Configure safe area support
    this.configureSafeArea();

    // Set up responsive design
    this.setupResponsiveDesign();

    // Configure font optimization
    this.configureFontOptimization();

    // Configure color scheme
    this.configureColorScheme();
  }

  private updateViewportMeta(): void {
    const viewportMeta = document.querySelector('meta[name="viewport"]') as HTMLMetaElement;
    if (viewportMeta) {
      const optimizedContent = [
        'width=device-width',
        'initial-scale=1',
        'maximum-scale=5',
        'user-scalable=yes',
        'viewport-fit=cover' // Enable safe area support
      ].join(', ');

      viewportMeta.content = optimizedContent;
    }
  }

  private configureSafeArea(): void {
    // Add safe area padding to root element
    const root = document.documentElement;
    root.style.setProperty('padding-top', `env(safe-area-inset-top)`);
    root.style.setProperty('padding-left', `env(safe-area-inset-left)`);
    root.style.setProperty('padding-right', `env(safe-area-inset-right)`);
    root.style.setProperty('padding-bottom', `env(safe-area-inset-bottom)`);
  }

  private setupResponsiveDesign(): void {
    const currentBreakpoint = this.getCurrentBreakpoint();
    this.applyBreakpointOptimizations(currentBreakpoint);

    // Set up resize observer for responsive adjustments
    this.resizeObserver = new ResizeObserver(entries => {
      for (const entry of entries) {
        const { width } = entry.contentRect;
        const newBreakpoint = this.getBreakpointForWidth(width);

        if (newBreakpoint.name !== currentBreakpoint.name) {
          this.applyBreakpointOptimizations(newBreakpoint);
        }
      }
    });

    this.resizeObserver.observe(document.body);
  }

  private getCurrentBreakpoint(): ResponsiveBreakpoint {
    const width = this.viewport.viewportWidth;
    return this.getBreakpointForWidth(width);
  }

  private getBreakpointForWidth(width: number): ResponsiveBreakpoint {
    return this.breakpoints.find(bp =>
      width >= bp.minWidth && width <= bp.maxWidth
    ) || this.breakpoints[0];
  }

  private applyBreakpointOptimizations(breakpoint: ResponsiveBreakpoint): void {
    const { optimizations } = breakpoint;

    // Set CSS custom properties
    this.setCustomProperty('--mobile-font-size-base', `${optimizations.fontSize}px`);
    this.setCustomProperty('--mobile-spacing-unit', `${optimizations.spacing}px`);
    this.setCustomProperty('--mobile-border-radius', `${optimizations.borderRadius}px`);
    this.setCustomProperty('--mobile-columns', optimizations.columns.toString());

    // Update image sizes
    this.updateImageSizes(optimizations.imageSize);

    // Adjust typography for luxury mode
    if (this.config.luxuryMode) {
      this.setCustomProperty('--mobile-font-family', '"Georgia", serif');
      this.setCustomProperty('--mobile-font-weight-light', '300');
      this.setCustomProperty('--mobile-font-weight-regular', '400');
      this.setCustomProperty('--mobile-font-weight-medium', '500');
      this.setCustomProperty('--mobile-font-weight-bold', '600');
    }
  }

  private setCustomProperty(property: string, value: string): void {
    document.documentElement.style.setProperty(property, value);
    this.customProperties.set(property, value);
  }

  private updateImageSizes(size: string): void {
    const sizeMap = {
      small: { width: 300, height: 200 },
      medium: { width: 400, height: 267 },
      large: { width: 600, height: 400 },
      xlarge: { width: 800, height: 533 }
    };

    const dimensions = sizeMap[size as keyof typeof sizeMap] || sizeMap.medium;

    this.setCustomProperty('--mobile-image-width', `${dimensions.width}px`);
    this.setCustomProperty('--mobile-image-height', `${dimensions.height}px`);
  }

  private configureFontOptimization(): void {
    // Enable font-display: swap for better perceived performance
    const fontDisplayRule = `
      @font-face {
        font-display: swap;
      }
    `;

    this.addCSSRule(fontDisplayRule);

    // Configure font loading strategies
    if (this.config.performanceProfile !== 'low') {
      this.preloadCriticalFonts();
    }
  }

  private preloadCriticalFonts(): void {
    const criticalFonts = [
      // Add your luxury platform fonts here
      '/fonts/Inter-Regular.woff2',
      '/fonts/Inter-Medium.woff2',
      '/fonts/Georgia-Regular.woff2'
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

  private configureColorScheme(): void {
    // Support for dark mode with luxury champagne/cocoa tones
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

    if (prefersDark) {
      document.documentElement.setAttribute('data-theme', 'dark');
    }

    // Listen for theme changes
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
      document.documentElement.setAttribute('data-theme', e.matches ? 'dark' : 'light');
    });
  }

  private async initializeResponsiveOptimizations(): Promise<void> {
    // Optimize images for mobile
    this.optimizeImagesForMobile();

    // Configure responsive typography
    this.configureResponsiveTypography();

    // Set up responsive grid system
    this.setupResponsiveGrid();

    // Optimize videos for mobile
    this.optimizeVideosForMobile();
  }

  private optimizeImagesForMobile(): void {
    const images = document.querySelectorAll('img');

    images.forEach(img => {
      // Add responsive image attributes
      if (!img.getAttribute('sizes')) {
        img.setAttribute('sizes', '(max-width: 768px) 100vw, 50vw');
      }

      // Add loading optimization
      if (!img.getAttribute('loading')) {
        img.setAttribute('loading', 'lazy');
      }

      // Add error handling
      img.addEventListener('error', () => {
        img.classList.add('image-error');
        img.src = '/images/placeholder-luxury.jpg';
      });
    });
  }

  private configureResponsiveTypography(): void {
    const fluidTypography = `
      :root {
        --mobile-fluid-min-width: 320;
        --mobile-fluid-max-width: 1140;
        --mobile-fluid-screen: 100vw;
        --mobile-fluid-bp: calc(
          (var(--mobile-fluid-screen) - var(--mobile-fluid-min-width) / 16 * 1rem) /
          (var(--mobile-fluid-max-width) - var(--mobile-fluid-min-width))
        );
      }

      h1 { font-size: calc(1.5rem + 2.5 * var(--mobile-fluid-bp)); }
      h2 { font-size: calc(1.25rem + 1.5 * var(--mobile-fluid-bp)); }
      h3 { font-size: calc(1.125rem + 0.75 * var(--mobile-fluid-bp)); }
      body { font-size: calc(0.875rem + 0.25 * var(--mobile-fluid-bp)); }
    `;

    this.addCSSRule(fluidTypography);
  }

  private setupResponsiveGrid(): void {
    const responsiveGrid = `
      .mobile-grid {
        display: grid;
        gap: var(--mobile-spacing-unit);
        grid-template-columns: repeat(var(--mobile-columns), 1fr);
        padding: var(--mobile-spacing-unit);
      }

      .mobile-grid-2 { grid-template-columns: repeat(2, 1fr); }
      .mobile-grid-3 { grid-template-columns: repeat(3, 1fr); }
      .mobile-grid-auto { grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); }

      @media (max-width: 768px) {
        .mobile-grid-2,
        .mobile-grid-3,
        .mobile-grid-auto {
          grid-template-columns: 1fr;
        }
      }
    `;

    this.addCSSRule(responsiveGrid);
  }

  private optimizeVideosForMobile(): void {
    const videos = document.querySelectorAll('video');

    videos.forEach(video => {
      // Add mobile-friendly attributes
      video.setAttribute('playsinline', '');
      video.setAttribute('webkit-playsinline', '');

      // Add poster image for loading state
      if (!video.poster && video.src) {
        video.poster = '/images/video-poster-luxury.jpg';
      }

      // Optimize video quality based on network
      if (this.config.performanceProfile === 'low') {
        video.setAttribute('data-quality', 'low');
      }
    });
  }

  private async initializeTouchInteractions(): Promise<void> {
    // Optimize tap targets
    this.optimizeTapTargets();

    // Add touch feedback
    this.addTouchFeedback();

    // Configure gestures
    this.configureGestures();

    // Optimize scrolling
    this.optimizeScrollingForTouch();
  }

  private optimizeTapTargets(): void {
    const interactiveElements = document.querySelectorAll('button, a, input, select, textarea, [role="button"]');

    interactiveElements.forEach(element => {
      const computedStyle = window.getComputedStyle(element);
      const width = parseInt(computedStyle.width);
      const height = parseInt(computedStyle.height);
      const minSize = this.touchOptimization.tapTargets.minSize;

      // Apply minimum touch target size
      if (width < minSize || height < minSize) {
        (element as HTMLElement).style.minWidth = `${minSize}px`;
        (element as HTMLElement).style.minHeight = `${minSize}px`;
        (element as HTMLElement).style.display = 'flex';
        (element as HTMLElement).style.alignItems = 'center';
        (element as HTMLElement).style.justifyContent = 'center';
      }
    });
  }

  private addTouchFeedback(): void {
    const touchFeedbackCSS = `
      .touch-target {
        position: relative;
        overflow: hidden;
        transition: transform 0.2s ease, box-shadow 0.2s ease;
      }

      .touch-target:active {
        transform: scale(0.98);
      }

      .touch-target::after {
        content: '';
        position: absolute;
        top: 50%;
        left: 50%;
        width: 0;
        height: 0;
        border-radius: 50%;
        background: rgba(255, 255, 255, 0.5);
        transform: translate(-50%, -50%);
        transition: width 0.6s ease, height 0.6s ease;
        pointer-events: none;
      }

      .touch-target.ripple::after {
        width: 200px;
        height: 200px;
      }
    `;

    this.addCSSRule(touchFeedbackCSS);

    // Add touch event listeners
    document.addEventListener('touchstart', this.handleTouchStart.bind(this));
    document.addEventListener('touchend', this.handleTouchEnd.bind(this));
  }

  private handleTouchStart(event: TouchEvent): void {
    const target = event.target as HTMLElement;
    if (target.classList.contains('touch-target')) {
      target.classList.add('ripple');

      // Haptic feedback if available
      if (this.touchOptimization.tapTargets.hapticFeedback && 'vibrate' in navigator) {
        navigator.vibrate(10);
      }
    }
  }

  private handleTouchEnd(event: TouchEvent): void {
    const target = event.target as HTMLElement;
    setTimeout(() => {
      target.classList.remove('ripple');
    }, 600);
  }

  private configureGestures(): void {
    if (!this.touchOptimization.gestures.swipeEnabled) return;

    let startX = 0;
    let startY = 0;

    document.addEventListener('touchstart', (e) => {
      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
    });

    document.addEventListener('touchend', (e) => {
      const endX = e.changedTouches[0].clientX;
      const endY = e.changedTouches[0].clientY;
      const deltaX = endX - startX;
      const deltaY = endY - startY;

      // Detect swipe gestures
      if (Math.abs(deltaX) > 50 && Math.abs(deltaX) > Math.abs(deltaY)) {
        // Horizontal swipe
        const direction = deltaX > 0 ? 'right' : 'left';
        this.dispatchGestureEvent('swipe', { direction, deltaX, deltaY });
      } else if (Math.abs(deltaY) > 50) {
        // Vertical swipe
        const direction = deltaY > 0 ? 'down' : 'up';
        this.dispatchGestureEvent('swipe', { direction, deltaX, deltaY });
      }
    });
  }

  private dispatchGestureEvent(type: string, data: any): void {
    const event = new CustomEvent(`mobileGesture`, {
      detail: { type, data, timestamp: Date.now() }
    });
    window.dispatchEvent(event);
  }

  private optimizeScrollingForTouch(): void {
    const scrollOptimizationCSS = `
      html {
        scroll-behavior: smooth;
        -webkit-overflow-scrolling: touch;
      }

      body {
        overscroll-behavior-y: ${this.touchOptimization.scrolling.bounceEnabled ? 'auto' : 'none'};
      }

      ::-webkit-scrollbar {
        width: 6px;
        height: 6px;
      }

      ::-webkit-scrollbar-track {
        background: transparent;
      }

      ::-webkit-scrollbar-thumb {
        background: rgba(0, 0, 0, 0.3);
        border-radius: 3px;
      }

      .scroll-snap-container {
        scroll-snap-type: y mandatory;
      }

      .scroll-snap-child {
        scroll-snap-align: start;
      }
    `;

    this.addCSSRule(scrollOptimizationCSS);
  }

  private async initializeScrollOptimizationsSystem(): Promise<void> {
    // Configure smooth scrolling
    this.configureSmoothScrolling();

    // Set up lazy loading for images
    this.setupLazyLoading();

    // Configure sticky elements
    this.configureStickyElements();

    // Add scroll performance optimizations
    this.optimizeScrollPerformance();
  }

  private configureSmoothScrolling(): void {
    if (!this.scrollOptimization.smoothScrolling) return;

    // Override scroll behavior for better performance
    let scrollTimeout: number;

    window.addEventListener('scroll', () => {
      if (scrollTimeout) {
        window.cancelAnimationFrame(scrollTimeout);
      }

      scrollTimeout = window.requestAnimationFrame(() => {
        this.updateScrollPositions();
      });
    }, { passive: true });
  }

  private updateScrollPositions(): void {
    const scrollY = window.scrollY;

    // Update sticky elements
    this.scrollOptimization.stickyElements.forEach(selector => {
      const elements = document.querySelectorAll(selector);
      elements.forEach(element => {
        if (scrollY > 100) {
          element.classList.add('scrolled');
        } else {
          element.classList.remove('scrolled');
        }
      });
    });

    // Update parallax elements
    if (this.scrollOptimization.parallaxEnabled) {
      this.updateParallaxElements(scrollY);
    }
  }

  private updateParallaxElements(scrollY: number): void {
    const parallaxElements = document.querySelectorAll('[data-parallax]');

    parallaxElements.forEach(element => {
      const speed = parseFloat(element.getAttribute('data-parallax') || '0.5');
      const yPos = -(scrollY * speed);
      (element as HTMLElement).style.transform = `translateY(${yPos}px)`;
    });
  }

  private setupLazyLoading(): void {
    if (!this.scrollOptimization.lazyLoadImages) return;

    this.intersectionObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const element = entry.target;

          if (element.tagName === 'IMG') {
            const img = element as HTMLImageElement;
            if (img.dataset.src) {
              img.src = img.dataset.src;
              img.classList.remove('lazy');
              this.intersectionObserver?.unobserve(img);
            }
          } else if (element.dataset.src) {
            element.setAttribute('src', element.dataset.src);
            element.classList.remove('lazy');
            this.intersectionObserver?.unobserve(element);
          }
        }
      });
    }, {
      rootMargin: '50px 0px',
      threshold: 0.1
    });

    // Observe all lazy elements
    document.querySelectorAll('[data-src]').forEach(element => {
      element.classList.add('lazy');
      this.intersectionObserver?.observe(element);
    });
  }

  private configureStickyElements(): void {
    const stickyCSS = `
      .sticky-header {
        position: sticky;
        top: env(safe-area-inset-top);
        z-index: 100;
        backdrop-filter: blur(10px);
        background: rgba(255, 255, 255, 0.9);
        transition: all 0.3s ease;
      }

      .sticky-header.scrolled {
        background: rgba(255, 255, 255, 0.95);
        box-shadow: 0 2px 20px rgba(0, 0, 0, 0.1);
      }

      .sticky-booking-summary {
        position: fixed;
        bottom: env(safe-area-inset-bottom);
        left: 0;
        right: 0;
        background: rgba(255, 255, 255, 0.95);
        backdrop-filter: blur(10px);
        z-index: 99;
        transform: translateY(100%);
        transition: transform 0.3s ease;
      }

      .sticky-booking-summary.visible {
        transform: translateY(0);
      }
    `;

    this.addCSSRule(stickyCSS);
  }

  private optimizeScrollPerformance(): void {
    // Disable expensive animations during scroll
    let isScrolling = false;

    window.addEventListener('scroll', () => {
      if (!isScrolling) {
        document.body.classList.add('is-scrolling');
        isScrolling = true;
      }

      clearTimeout(window.scrollTimeout);
      window.scrollTimeout = window.setTimeout(() => {
        document.body.classList.remove('is-scrolling');
        isScrolling = false;
      }, 150);
    }, { passive: true });

    // Add scroll performance CSS
    const scrollPerformanceCSS = `
      .is-scrolling * {
        animation-play-state: paused !important;
        transition: none !important;
      }

      .will-change-transform {
        will-change: transform;
      }

      .gpu-accelerated {
        transform: translateZ(0);
        backface-visibility: hidden;
        perspective: 1000px;
      }
    `;

    this.addCSSRule(scrollPerformanceCSS);
  }

  private async initializeFormOptimizationsSystem(): Promise<void> {
    // Optimize input fields
    this.optimizeInputFields();

    // Configure form validation
    this.configureFormValidation();

    // Optimize form layout
    this.optimizeFormLayout();

    // Add autocomplete support
    this.addAutocompleteSupport();
  }

  private optimizeInputFields(): void {
    const inputs = document.querySelectorAll('input, select, textarea');

    inputs.forEach(input => {
      // Set mobile-friendly attributes
      if (this.formOptimization.inputTypes.touchOptimized) {
        input.setAttribute('autocomplete', 'on');
        input.setAttribute('autocorrect', this.formOptimization.inputTypes.autoCorrect ? 'on' : 'off');
        input.setAttribute('autocapitalize', this.formOptimization.inputTypes.autoCapitalize);
      }

      // Add input type optimizations
      if (input.getAttribute('type') === 'email') {
        input.setAttribute('inputmode', 'email');
      } else if (input.getAttribute('type') === 'tel') {
        input.setAttribute('inputmode', 'tel');
      } else if (input.getAttribute('type') === 'number') {
        input.setAttribute('inputmode', 'numeric');
        input.setAttribute('pattern', '[0-9]*');
      }
    });
  }

  private configureFormValidation(): void {
    const validationCSS = `
      .form-input {
        transition: border-color 0.2s ease, box-shadow 0.2s ease;
      }

      .form-input:focus {
        outline: none;
        border-color: var(--primary-color);
        box-shadow: 0 0 0 3px rgba(139, 69, 19, 0.1);
      }

      .form-input.error {
        border-color: var(--error-color);
        box-shadow: 0 0 0 3px rgba(220, 38, 38, 0.1);
      }

      .form-input.success {
        border-color: var(--success-color);
        box-shadow: 0 0 0 3px rgba(34, 197, 94, 0.1);
      }

      .error-message {
        color: var(--error-color);
        font-size: 0.875rem;
        margin-top: 0.25rem;
        display: flex;
        align-items: center;
        gap: 0.25rem;
      }

      .floating-label {
        position: relative;
      }

      .floating-label input:focus + label,
      .floating-label input:not(:placeholder-shown) + label,
      .floating-label textarea:focus + label,
      .floating-label textarea:not(:placeholder-shown) + label {
        transform: translateY(-1.5rem) scale(0.85);
        background: white;
        padding: 0 0.25rem;
        color: var(--primary-color);
      }
    `;

    this.addCSSRule(validationCSS);

    // Add real-time validation listeners
    if (this.formOptimization.validation.realTime) {
      this.addRealTimeValidation();
    }
  }

  private addRealTimeValidation(): void {
    const inputs = document.querySelectorAll('input[required], textarea[required], select[required]');

    inputs.forEach(input => {
      input.addEventListener('blur', () => {
        this.validateInput(input as HTMLInputElement);
      });

      input.addEventListener('input', () => {
        if ((input as HTMLInputElement).classList.contains('error')) {
          this.validateInput(input as HTMLInputElement);
        }
      });
    });
  }

  private validateInput(input: HTMLInputElement): void {
    const isValid = input.checkValidity();
    const errorElement = input.parentElement?.querySelector('.error-message');

    if (isValid) {
      input.classList.remove('error');
      input.classList.add('success');
      if (errorElement) {
        errorElement.remove();
      }
    } else {
      input.classList.add('error');
      input.classList.remove('success');

      if (!errorElement && this.formOptimization.validation.visualFeedback) {
        const errorMessage = document.createElement('div');
        errorMessage.className = 'error-message';
        errorMessage.textContent = input.validationMessage;
        input.parentElement?.appendChild(errorMessage);
      }
    }
  }

  private optimizeFormLayout(): void {
    const formLayoutCSS = `
      .mobile-form {
        display: flex;
        flex-direction: column;
        gap: var(--mobile-spacing-unit);
        padding: var(--mobile-spacing-unit);
      }

      .form-row {
        display: flex;
        gap: var(--mobile-spacing-unit);
        flex-wrap: wrap;
      }

      .form-group {
        flex: 1;
        min-width: 0;
      }

      @media (max-width: 768px) {
        .form-row {
          flex-direction: column;
        }

        .form-group {
          width: 100%;
        }
      }

      .form-actions {
        display: flex;
        gap: var(--mobile-spacing-unit);
        justify-content: flex-end;
        margin-top: calc(var(--mobile-spacing-unit) * 2);
      }

      .form-actions button {
        flex: 1;
        min-height: ${this.touchOptimization.tapTargets.minSize}px;
      }
    `;

    this.addCSSRule(formLayoutCSS);
  }

  private addAutocompleteSupport(): void {
    // Add support for common autocomplete patterns
    const autocompleteMappings = {
      name: 'name',
      email: 'email',
      phone: 'tel',
      address: 'street-address',
      city: 'address-level2',
      postal: 'postal-code',
      country: 'country-name'
    };

    Object.entries(autocompleteMappings).forEach(([className, autocomplete]) => {
      const elements = document.querySelectorAll(`.${className}, input[name="${className}"]`);
      elements.forEach(element => {
        element.setAttribute('autocomplete', autocomplete);
      });
    });
  }

  private startPerformanceMonitoring(): void {
    if (!window.PerformanceObserver) return;

    this.performanceObserver = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        this.processPerformanceEntry(entry);
      }
    });

    this.performanceObserver.observe({
      entryTypes: ['measure', 'navigation', 'paint', 'layout-shift', 'event']
    });
  }

  private processPerformanceEntry(entry: PerformanceEntry): void {
    switch (entry.entryType) {
      case 'measure':
        this.handleMeasureEntry(entry as PerformanceMeasure);
        break;
      case 'paint':
        this.handlePaintEntry(entry as PerformancePaintTiming);
        break;
      case 'layout-shift':
        this.handleLayoutShiftEntry(entry as PerformanceEntry);
        break;
      case 'event':
        this.handleEventEntry(entry as PerformanceEventTiming);
        break;
    }
  }

  private handleMeasureEntry(entry: PerformanceMeasure): void {
    if (entry.name.includes('mobile-ui')) {
      console.log(`⏱️ Mobile UI Performance: ${entry.name} - ${entry.duration.toFixed(2)}ms`);
    }
  }

  private handlePaintEntry(entry: PerformancePaintTiming): void {
    console.log(`🎨 Paint Performance: ${entry.name} - ${entry.startTime.toFixed(2)}ms`);
  }

  private handleLayoutShiftEntry(entry: PerformanceEntry): void {
    console.log(`📐 Layout Shift detected: ${entry.startTime.toFixed(2)}ms`);
  }

  private handleEventEntry(entry: PerformanceEventTiming): void {
    if (entry.duration > 50) { // Events taking longer than 50ms
      console.warn(`⚠️ Slow input detected: ${entry.name} - ${entry.duration.toFixed(2)}ms`);
    }
  }

  private addCSSRule(css: string): void {
    if (!this.styleElement) {
      this.styleElement = document.createElement('style');
      this.styleElement.setAttribute('data-mobile-ui-optimizer', 'true');
      document.head.appendChild(this.styleElement);
    }

    this.styleElement.textContent += css + '\n';
  }

  private isIOS(): boolean {
    return /iPad|iPhone|iPod/.test(navigator.userAgent);
  }

  // Public API methods

  getUIOptimizationReport(): any {
    return {
      viewport: this.viewport,
      currentBreakpoint: this.getCurrentBreakpoint(),
      customProperties: Object.fromEntries(this.customProperties),
      isInitialized: this.isInitialized,
      config: this.config
    };
  }

  updateConfig(newConfig: Partial<MobileUIConfig>): void {
    this.config = { ...this.config, ...newConfig };
    console.log('📱 Mobile UI configuration updated');
  }

  optimizeElement(element: HTMLElement): void {
    // Add mobile optimizations to specific elements
    element.classList.add('mobile-optimized');

    // Apply touch optimizations if enabled
    if (this.config.enableTouchOptimizations) {
      element.classList.add('touch-target');
    }

    // Apply GPU acceleration for better performance
    element.classList.add('gpu-accelerated');
  }

  addScrollCallback(id: string, callback: Function): void {
    this.scrollOptimization.scrollCallbacks.set(id, callback);
  }

  removeScrollCallback(id: string): void {
    this.scrollOptimization.scrollCallbacks.delete(id);
  }

  destroy(): void {
    // Clean up observers
    this.performanceObserver?.disconnect();
    this.resizeObserver?.disconnect();
    this.intersectionObserver?.disconnect();

    // Remove CSS
    this.styleElement?.remove();

    // Clear event listeners
    window.removeEventListener('scroll', this.updateScrollPositions.bind(this));

    // Clear callbacks
    this.scrollOptimization.scrollCallbacks.clear();
    this.customProperties.clear();

    this.isInitialized = false;
    console.log('🧹 Mobile UI Optimizer cleaned up');
  }
}

// Singleton instance
let mobileUIOptimizer: MobileUIOptimizer | null = null;

export function initializeMobileUIOptimizer(config?: Partial<MobileUIConfig>): MobileUIOptimizer {
  if (!mobileUIOptimizer) {
    const defaultConfig: MobileUIConfig = {
      enableResponsiveOptimizations: true,
      enableTouchOptimizations: true,
      enableViewportOptimizations: true,
      enableScrollOptimizations: true,
      enableFormOptimizations: true,
      luxuryMode: true,
      targetDevice: 'mobile',
      performanceProfile: 'high'
    };

    mobileUIOptimizer = new MobileUIOptimizer({ ...defaultConfig, ...config });
  }

  return mobileUIOptimizer;
}

export function getMobileUIOptimizer(): MobileUIOptimizer | null {
  return mobileUIOptimizer;
}

// Auto-initialize for development
if (import.meta.env.DEV) {
  document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
      initializeMobileUIOptimizer().initialize().catch(console.error);
    }, 100);
  });
}

// Global access for debugging
declare global {
  interface Window {
    mobileUIOptimizer: MobileUIOptimizer;
  }
}

if (import.meta.env.DEV) {
  window.addEventListener('load', () => {
    initializeMobileUIOptimizer().initialize().then(optimizer => {
      window.mobileUIOptimizer = optimizer;
      console.log('🔧 Mobile UI Optimizer available via window.mobileUIOptimizer');
    });
  });
}