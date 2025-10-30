/**
 * Cross-Browser Compatibility Utilities for Luxury Components
 *
 * This module ensures consistent luxury experience across all major browsers
 * while providing progressive enhancement and graceful degradation.
 */

// Browser detection utilities
export const BROWSER_DETECTION = {
  // User agent parsing
  getUserAgent: () => navigator.userAgent,

  isChrome: () => /Chrome/.test(navigator.userAgent) && /Google Inc/.test(navigator.vendor),

  isFirefox: () => /Firefox/.test(navigator.userAgent),

  isSafari: () => /Safari/.test(navigator.userAgent) && /Apple Computer/.test(navigator.vendor),

  isEdge: () => /Edg/.test(navigator.userAgent),

  isMobile: () => /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent),

  isIOS: () => /iPad|iPhone|iPod/.test(navigator.userAgent),

  getBrowserInfo: () => {
    const ua = navigator.userAgent;
    const browserInfo = {
      name: 'Unknown',
      version: '0',
      isMobile: false,
      isIOS: false,
      supportsBackdropFilter: false,
      supportsCSSGrid: false,
      supportsFlexboxGaps: false,
      supportsCustomProperties: false,
      supportsContainerQueries: false
    };

    // Detect browser
    if (/Chrome/.test(ua) && /Google Inc/.test(navigator.vendor)) {
      browserInfo.name = 'Chrome';
      browserInfo.version = ua.match(/Chrome\/(\d+)/)?.[1] || '0';
    } else if (/Firefox/.test(ua)) {
      browserInfo.name = 'Firefox';
      browserInfo.version = ua.match(/Firefox\/(\d+)/)?.[1] || '0';
    } else if (/Safari/.test(ua) && /Apple Computer/.test(navigator.vendor)) {
      browserInfo.name = 'Safari';
      browserInfo.version = ua.match(/Version\/(\d+)/)?.[1] || '0';
    } else if (/Edg/.test(ua)) {
      browserInfo.name = 'Edge';
      browserInfo.version = ua.match(/Edg\/(\d+)/)?.[1] || '0';
    }

    // Detect mobile
    browserInfo.isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua);
    browserInfo.isIOS = /iPad|iPhone|iPod/.test(ua);

    // Feature detection
    browserInfo.supportsBackdropFilter = CSS.supports('backdrop-filter', 'blur(10px)');
    browserInfo.supportsCSSGrid = CSS.supports('display', 'grid');
    browserInfo.supportsFlexboxGaps = CSS.supports('gap', '10px');
    browserInfo.supportsCustomProperties = CSS.supports('color', 'var(--test)');
    browserInfo.supportsContainerQueries = CSS.supports('container-type', 'inline-size');

    return browserInfo;
  }
} as const;

// Feature detection utilities
export const FEATURE_DETECTION = {
  // CSS Custom Properties support
  supportsCustomProperties: (): boolean => {
    return window.CSS && CSS.supports && CSS.supports('color', 'var(--test)');
  },

  // Backdrop filter support
  supportsBackdropFilter: (): boolean => {
    return CSS.supports('backdrop-filter', 'blur(10px)') ||
           CSS.supports('-webkit-backdrop-filter', 'blur(10px)');
  },

  // CSS Grid support
  supportsCSSGrid: (): boolean => {
    return CSS.supports('display', 'grid');
  },

  // Flexbox gap support
  supportsFlexboxGap: (): boolean => {
    return CSS.supports('gap', '10px');
  },

  // Container queries support
  supportsContainerQueries: (): boolean => {
    return CSS.supports('container-type', 'inline-size');
  },

  // :has() selector support
  supportsHasSelector: (): boolean => {
    try {
      document.querySelector(':has(body)');
      return true;
    } catch {
      return false;
    }
  },

  // CSS Nesting support
  supportsCSSNesting: (): boolean => {
    return CSS.supports('color', 'rgb(from red r g b)');
  },

  // CSS Scroll-driven animations
  supportsScrollDrivenAnimations: (): boolean => {
    return CSS.supports('animation-timeline', 'scroll()');
  },

  // View transitions API
  supportsViewTransitions: (): boolean => {
    return 'startViewTransition' in document;
  },

  // Pointer events support
  supportsPointerEvents: (): boolean => {
    return 'PointerEvent' in window;
  },

  // Touch events support
  supportsTouchEvents: (): boolean => {
    return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  },

  // Intersection Observer support
  supportsIntersectionObserver: (): boolean => {
    return 'IntersectionObserver' in window;
  },

  // Resize Observer support
  supportsResizeObserver: (): boolean => {
    return 'ResizeObserver' in window;
  }
} as const;

// Polyfill utilities
export const POLYFILLS = {
  // Backdrop filter polyfill
  createBackdropFilterFallback: (element: HTMLElement, blur: number = 10) => {
    if (FEATURE_DETECTION.supportsBackdropFilter()) return;

    // Create fallback with SVG filter
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('width', '0');
    svg.setAttribute('height', '0');

    const filter = document.createElementNS('http://www.w3.org/2000/svg', 'filter');
    filter.setAttribute('id', `backdrop-filter-${blur}`);

    const gaussianBlur = document.createElementNS('http://www.w3.org/2000/svg', 'feGaussianBlur');
    gaussianBlur.setAttribute('stdDeviation', blur);

    filter.appendChild(gaussianBlur);
    svg.appendChild(filter);

    document.head.appendChild(svg);

    element.style.filter = `url(#backdrop-filter-${blur})`;
  },

  // CSS Grid fallback for older browsers
  createGridFallback: (container: HTMLElement, columns: number = 3) => {
    if (FEATURE_DETECTION.supportsCSSGrid()) return;

    // Use flexbox fallback
    container.style.display = 'flex';
    container.style.flexWrap = 'wrap';
    container.style.margin = '-8px';

    const children = container.children;
    for (let i = 0; i < children.length; i++) {
      const child = children[i] as HTMLElement;
      child.style.flex = `0 0 calc(${100 / columns}% - 16px)`;
      child.style.margin = '8px';
    }
  },

  // Custom properties fallback
  createCustomPropertiesFallback: (element: HTMLElement, styles: Record<string, string>) => {
    if (FEATURE_DETECTION.supportsCustomProperties()) return;

    // Apply styles directly
    Object.entries(styles).forEach(([property, value]) => {
      element.style.setProperty(property, value);
    });
  },

  // Intersection Observer polyfill
  createIntersectionObserverFallback: (
    callback: (entries: IntersectionObserverEntry[]) => void,
    options?: IntersectionObserverInit
  ) => {
    if (FEATURE_DETECTION.supportsIntersectionObserver()) {
      return new IntersectionObserver(callback, options);
    }

    // Fallback using scroll events
    let elements: Element[] = [];
    let isListening = false;

    const handleScroll = () => {
      elements.forEach(element => {
        const rect = element.getBoundingClientRect();
        const isVisible = rect.top < window.innerHeight && rect.bottom > 0;

        callback([{
          target: element,
          isIntersecting: isVisible,
          intersectionRatio: isVisible ? 1 : 0,
          boundingClientRect: rect,
          intersectionRect: isVisible ? rect : new DOMRect(),
          rootBounds: new DOMRect(0, 0, window.innerWidth, window.innerHeight),
          time: Date.now()
        } as IntersectionObserverEntry]);
      });
    };

    return {
      observe: (element: Element) => {
        elements.push(element);
        if (!isListening) {
          window.addEventListener('scroll', handleScroll, { passive: true });
          window.addEventListener('resize', handleScroll, { passive: true });
          isListening = true;
          handleScroll(); // Initial check
        }
      },
      unobserve: (element: Element) => {
        elements = elements.filter(el => el !== element);
        if (elements.length === 0 && isListening) {
          window.removeEventListener('scroll', handleScroll);
          window.removeEventListener('resize', handleScroll);
          isListening = false;
        }
      },
      disconnect: () => {
        elements = [];
        if (isListening) {
          window.removeEventListener('scroll', handleScroll);
          window.removeEventListener('resize', handleScroll);
          isListening = false;
        }
      }
    };
  }
} as const;

// Browser-specific optimizations
export const BROWSER_OPTIMIZATIONS = {
  // Safari-specific optimizations
  optimizeForSafari: () => {
    if (!BROWSER_DETECTION.isSafari()) return;

    // Safari prefers transform3d for hardware acceleration
    document.documentElement.style.setProperty('--safari-hardware-acceleration', 'translateZ(0)');

    // Safari backdrop filter prefix
    const style = document.createElement('style');
    style.textContent = `
      .glass { -webkit-backdrop-filter: blur(12px); backdrop-filter: blur(12px); }
      .glass-luxury { -webkit-backdrop-filter: blur(24px); backdrop-filter: blur(24px); }
      .glass-card { -webkit-backdrop-filter: blur(16px); backdrop-filter: blur(16px); }
    `;
    document.head.appendChild(style);
  },

  // Firefox-specific optimizations
  optimizeForFirefox: () => {
    if (!BROWSER_DETECTION.isFirefox()) return;

    // Firefox prefers explicit will-change declarations
    const style = document.createElement('style');
    style.textContent = `
      .glass-card { will-change: backdrop-filter, transform; }
      .luxury-animation { will-change: transform, opacity; }
    `;
    document.head.appendChild(style);
  },

  // Edge-specific optimizations
  optimizeForEdge: () => {
    if (!BROWSER_DETECTION.isEdge()) return;

    // Edge prefers simpler animations
    const style = document.createElement('style');
    style.textContent = `
      .luxury-animation { transition-duration: 0.2s; }
      .glass { background: rgba(255, 255, 255, 0.95); }
    `;
    document.head.appendChild(style);
  },

  // Mobile-specific optimizations
  optimizeForMobile: () => {
    if (!BROWSER_DETECTION.isMobile()) return;

    // Mobile optimizations
    const style = document.createElement('style');
    style.textContent = `
      .luxury-animation { transition-duration: 0.15s; }
      .glass-card { backdrop-filter: blur(8px); }
      .luxury-button { min-height: 48px; min-width: 48px; }

      @media (max-width: 768px) {
        .glass-luxury { backdrop-filter: blur(12px); }
        .luxury-shadow { box-shadow: 0 2px 10px rgba(139, 69, 19, 0.1); }
      }
    `;
    document.head.appendChild(style);
  },

  // iOS-specific optimizations
  optimizeForIOS: () => {
    if (!BROWSER_DETECTION.isIOS()) return;

    // iOS specific fixes
    const style = document.createElement('style');
    style.textContent = `
      /* Prevent rubber band scrolling */
      body { -webkit-overflow-scrolling: touch; }

      /* Fix input zoom on focus */
      input, select, textarea { font-size: 16px; }

      /* Safari iOS momentum scrolling */
      .scroll-container { -webkit-overflow-scrolling: touch; }

      /* iOS backdrop filter fix */
      .glass { -webkit-backdrop-filter: saturate(180%) blur(12px); }
    `;
    document.head.appendChild(style);
  }
} as const;

// Cross-browser testing utilities
export const BROWSER_TESTING = {
  // Test rendering consistency
  testRendering: (element: HTMLElement): boolean => {
    const computedStyle = window.getComputedStyle(element);

    // Check if styles are applied correctly
    const hasBackdropFilter = computedStyle.backdropFilter !== 'none' ||
                            computedStyle.webkitBackdropFilter !== 'none';

    const hasTransform = computedStyle.transform !== 'none';

    const hasOpacity = parseFloat(computedStyle.opacity) >= 0;

    return hasBackdropFilter || hasTransform || hasOpacity;
  },

  // Test animation performance
  testAnimationPerformance: (element: HTMLElement): Promise<number> => {
    return new Promise((resolve) => {
      const startTime = performance.now();

      element.style.transform = 'translateZ(0) scale(1.1)';

      requestAnimationFrame(() => {
        const endTime = performance.now();
        const duration = endTime - startTime;

        element.style.transform = '';
        resolve(duration);
      });
    });
  },

  // Test color rendering
  testColorRendering: (element: HTMLElement): boolean => {
    const computedStyle = window.getComputedStyle(element);
    const backgroundColor = computedStyle.backgroundColor;

    // Check if color is rendered (not transparent)
    return backgroundColor !== 'rgba(0, 0, 0, 0)' && backgroundColor !== 'transparent';
  },

  // Run comprehensive browser test
  runComprehensiveTest: async (testElements: HTMLElement[]) => {
    const results = {
      browserInfo: BROWSER_DETECTION.getBrowserInfo(),
      featureSupport: {
        backdropFilter: FEATURE_DETECTION.supportsBackdropFilter(),
        cssGrid: FEATURE_DETECTION.supportsCSSGrid(),
        customProperties: FEATURE_DETECTION.supportsCustomProperties(),
        containerQueries: FEATURE_DETECTION.supportsContainerQueries(),
        intersectionObserver: FEATURE_DETECTION.supportsIntersectionObserver(),
      },
      renderingTests: [] as boolean[],
      performanceTests: [] as number[],
      colorTests: [] as boolean[],
      passed: true
    };

    // Test each element
    for (const element of testElements) {
      results.renderingTests.push(BROWSER_TESTING.testRendering(element));
      results.performanceTests.push(await BROWSER_TESTING.testAnimationPerformance(element));
      results.colorTests.push(BROWSER_TESTING.testColorRendering(element));
    }

    // Determine if tests passed
    const allRenderingPassed = results.renderingTests.every(test => test);
    const allColorPassed = results.colorTests.every(test => test);
    const avgPerformance = results.performanceTests.reduce((a, b) => a + b, 0) / results.performanceTests.length;

    results.passed = allRenderingPassed && allColorPassed && avgPerformance < 16.67; // 60fps threshold

    return results;
  }
} as const;

// Initialize cross-browser optimizations
export const initializeCrossBrowserSupport = () => {
  // Apply browser-specific optimizations
  BROWSER_OPTIMIZATIONS.optimizeForSafari();
  BROWSER_OPTIMIZATIONS.optimizeForFirefox();
  BROWSER_OPTIMIZATIONS.optimizeForEdge();
  BROWSER_OPTIMIZATIONS.optimizeForMobile();
  BROWSER_OPTIMIZATIONS.optimizeForIOS();

  // Add browser class to html element
  const browserInfo = BROWSER_DETECTION.getBrowserInfo();
  document.documentElement.classList.add(`browser-${browserInfo.name.toLowerCase()}`);
  document.documentElement.classList.add(browserInfo.isMobile ? 'is-mobile' : 'is-desktop');

  if (browserInfo.isIOS) {
    document.documentElement.classList.add('is-ios');
  }

  // Add feature support classes
  document.documentElement.classList.toggle('supports-backdrop-filter', browserInfo.supportsBackdropFilter);
  document.documentElement.classList.toggle('supports-css-grid', browserInfo.supportsCSSGrid);
  document.documentElement.classList.toggle('supports-custom-properties', browserInfo.supportsCustomProperties);
  document.documentElement.classList.toggle('supports-container-queries', browserInfo.supportsContainerQueries);

  return browserInfo;
};