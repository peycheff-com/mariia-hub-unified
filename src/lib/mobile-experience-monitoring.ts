/**
 * Mobile Experience Tracking and Optimization System
 * for luxury beauty and fitness booking platform
 */

import { trackRUMEvent, trackRUMInteraction } from './rum';
import { reportMessage } from './sentry';

// Mobile device capabilities
interface MobileCapabilities {
  touchSupport: boolean;
  multiTouch: boolean;
  geolocation: boolean;
  camera: boolean;
  vibration: boolean;
  orientation: boolean;
  fullscreen: boolean;
  webAppCapable: boolean;
  standaloneMode: boolean;
  deviceMemory?: number;
  maxTouchPoints: number;
  pixelRatio: number;
  screenSize: string;
  viewportSize: string;
}

// Touch interaction data
interface TouchInteraction {
  id: string;
  type: 'tap' | 'double-tap' | 'swipe' | 'pinch' | 'scroll' | 'long-press';
  target: {
    tagName: string;
    id?: string;
    className?: string;
    selector: string;
    text?: string;
  };
  position: { x: number; y: number };
  duration: number;
  pressure: number;
  timestamp: number;
  pageType: string;
  success: boolean;
  context: any;
}

// Mobile performance metrics
interface MobilePerformance {
  touchResponseTime: number;
  scrollPerformance: {
    framesPerSecond: number;
    jankCount: number;
    averageFrameTime: number;
  };
  renderingPerformance: {
    paintTime: number;
    layoutTime: number;
    compositeTime: number;
  };
  memoryUsage: {
    used: number;
    total: number;
    pressure: 'low' | 'medium' | 'high';
  };
  batteryLevel?: number;
  thermalState?: 'nominal' | 'fair' | 'serious' | 'critical';
}

// Mobile usability issue
interface MobileUsabilityIssue {
  id: string;
  type: 'touch-target-size' | 'viewport-scaling' | 'text-readability' | 'navigation-difficulty' | 'performance' | 'layout-shift';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  element: {
    tagName: string;
    selector: string;
    size: { width: number; height: number };
    position: { x: number; y: number };
  };
  pageType: string;
  timestamp: number;
  recommendations: string[];
  impact: {
    conversionRisk: number; // 0-1
    userFrustration: number; // 0-1
    luxuryPerception: number; // 0-1
  };
  resolved: boolean;
}

// Mobile experience score
interface MobileExperienceScore {
  overall: number; // 0-100
  categories: {
    touchPerformance: number;
    visualQuality: number;
    navigationEase: number;
    contentReadability: number;
    loadingSpeed: number;
    luxuryExperience: number;
  };
  issues: MobileUsabilityIssue[];
  recommendations: string[];
  deviceCapabilities: MobileCapabilities;
}

class MobileExperienceMonitor {
  private static instance: MobileExperienceMonitor;
  private isInitialized = false;
  private isMobileDevice = false;
  private capabilities: MobileCapabilities;
  private touchInteractions: TouchInteraction[] = [];
  private performanceMetrics: MobilePerformance[] = [];
  private usabilityIssues: MobileUsabilityIssue[] = [];
  private monitoringEnabled = true;
  private touchStartTimes: Map<number, number> = new Map();
  private scrollPerformance: any = {};
  private frameRateMonitor: any = null;
  private visibilityObserver: IntersectionObserver | null = null;

  private constructor() {
    this.detectMobileDevice();
    this.capabilities = this.assessMobileCapabilities();
  }

  static getInstance(): MobileExperienceMonitor {
    if (!MobileExperienceMonitor.instance) {
      MobileExperienceMonitor.instance = new MobileExperienceMonitor();
    }
    return MobileExperienceMonitor.instance;
  }

  // Initialize mobile experience monitoring
  initialize(): void {
    if (!this.isMobileDevice || this.isInitialized) return;

    try {
      this.initializeTouchTracking();
      this.initializeScrollMonitoring();
      this.initializeViewportMonitoring();
      this.initializePerformanceMonitoring();
      this.initializeUsabilityAnalysis();
      this.initializeLuxuryExperienceTracking();
      this.initializeContinuousMonitoring();

      this.isInitialized = true;
      console.log('[Mobile Experience] Advanced monitoring initialized for luxury mobile experience');

      // Run initial mobile assessment
      setTimeout(() => {
        this.runMobileUsabilityAudit();
      }, 2000);
    } catch (error) {
      console.warn('[Mobile Experience] Failed to initialize:', error);
    }
  }

  // Detect if this is a mobile device
  private detectMobileDevice(): void {
    const userAgent = navigator.userAgent.toLowerCase();
    const mobileKeywords = ['iphone', 'ipad', 'ipod', 'android', 'windows phone', 'blackberry', 'mobile'];

    this.isMobileDevice = mobileKeywords.some(keyword => userAgent.includes(keyword)) ||
                        window.innerWidth <= 768; // Tablet/mobile breakpoint
  }

  // Assess mobile capabilities
  private assessMobileCapabilities(): MobileCapabilities {
    return {
      touchSupport: 'ontouchstart' in window,
      multiTouch: 'ontouchstart' in window && (navigator as any).maxTouchPoints > 1,
      geolocation: 'geolocation' in navigator,
      camera: 'mediaDevices' in navigator && 'getUserMedia' in navigator.mediaDevices,
      vibration: 'vibrate' in navigator,
      orientation: 'orientation' in window,
      fullscreen: 'fullscreenEnabled' in document || 'webkitFullscreenEnabled' in document,
      webAppCapable: navigator.standalone || window.matchMedia('(display-mode: standalone)').matches,
      standaloneMode: navigator.standalone || window.matchMedia('(display-mode: standalone)').matches,
      deviceMemory: (navigator as any).deviceMemory,
      maxTouchPoints: (navigator as any).maxTouchPoints || 1,
      pixelRatio: window.devicePixelRatio || 1,
      screenSize: `${screen.width}x${screen.height}`,
      viewportSize: `${window.innerWidth}x${window.innerHeight}`
    };
  }

  // Initialize touch tracking
  private initializeTouchTracking(): void {
    if (!this.capabilities.touchSupport) return;

    let touchStartTime = 0;
    let lastTapTime = 0;
    let touchStartPosition: { x: number; y: number } | null = null;

    document.addEventListener('touchstart', (event) => {
      const touch = event.touches[0];
      touchStartTime = performance.now();
      touchStartPosition = { x: touch.clientX, y: touch.clientY };

      // Record touch start time for each touch point
      for (let i = 0; i < event.touches.length; i++) {
        this.touchStartTimes.set(event.touches[i].identifier, performance.now());
      }

      // Detect potential touch target issues
      this.checkTouchTargetSize(touch.target as Element);
    }, { passive: true });

    document.addEventListener('touchend', (event) => {
      const touch = event.changedTouches[0];
      const touchEndTime = performance.now();
      const duration = touchEndTime - touchStartTime;

      // Classify touch interaction
      const interactionType = this.classifyTouchInteraction(duration, touchStartPosition, touch);

      if (interactionType) {
        this.recordTouchInteraction(interactionType, touch, duration, event.target as Element);
      }

      // Clean up touch start times
      this.touchStartTimes.delete(touch.identifier);

      // Check for double-tap
      const currentTime = performance.now();
      if (currentTime - lastTapTime < 300) {
        this.recordTouchInteraction('double-tap', touch, duration, event.target as Element);
      }
      lastTapTime = currentTime;

      touchStartTime = 0;
      touchStartPosition = null;
    }, { passive: true });

    // Track scroll gestures
    document.addEventListener('touchmove', (event) => {
      if (touchStartPosition) {
        const touch = event.touches[0];
        const deltaX = Math.abs(touch.clientX - touchStartPosition.x);
        const deltaY = Math.abs(touch.clientY - touchStartPosition.y);

        if (deltaX > 50 || deltaY > 50) {
          this.trackScrollGesture(touchStartPosition, touch, event.target as Element);
        }
      }
    }, { passive: true });

    // Track pinch gestures
    if (this.capabilities.multiTouch && event.touches.length === 2) {
      this.trackPinchGesture(event);
    }
  }

  // Classify touch interaction
  private classifyTouchInteraction(
    duration: number,
    startPosition: { x: number; y: number } | null,
    touch: Touch
  ): TouchInteraction['type'] | null {
    if (!startPosition) return null;

    const deltaX = Math.abs(touch.clientX - startPosition.x);
    const deltaY = Math.abs(touch.clientY - startPosition.y);

    if (duration < 200 && deltaX < 10 && deltaY < 10) {
      return 'tap';
    } else if (duration > 500 && deltaX < 10 && deltaY < 10) {
      return 'long-press';
    } else if (deltaX > 50 || deltaY > 50) {
      return 'swipe';
    }

    return null;
  }

  // Record touch interaction
  private recordTouchInteraction(
    type: TouchInteraction['type'],
    touch: Touch,
    duration: number,
    target: Element
  ): void {
    const interaction: TouchInteraction = {
      id: this.generateInteractionId(),
      type,
      target: {
        tagName: target.tagName,
        id: target.id || undefined,
        className: target.className || undefined,
        selector: this.generateSelector(target),
        text: target.textContent?.trim() || ''
      },
      position: { x: touch.clientX, y: touch.clientY },
      duration,
      pressure: (touch as any).force || 0,
      timestamp: Date.now(),
      pageType: this.getPageType(),
      success: true,
      context: {
        viewportSize: this.capabilities.viewportSize,
        devicePixelRatio: this.capabilities.pixelRatio,
        touchPoints: (navigator as any).maxTouchPoints || 1
      }
    };

    this.touchInteractions.push(interaction);

    // Track touch performance
    this.trackTouchPerformance(interaction);

    // Clean up old interactions
    if (this.touchInteractions.length > 100) {
      this.touchInteractions = this.touchInteractions.slice(-100);
    }
  }

  // Track scroll gesture
  private trackScrollGesture(startPosition: { x: number; y: number }, touch: Touch, target: Element): void {
    const deltaX = touch.clientX - startPosition.x;
    const deltaY = touch.clientY - startPosition.y;
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    const direction = Math.abs(deltaX) > Math.abs(deltaY) ? 'horizontal' : 'vertical';

    trackRUMEvent('mobile-scroll-gesture', {
      direction,
      distance: Math.round(distance),
      target: this.generateSelector(target),
      pageType: this.getPageType(),
      timestamp: Date.now()
    });
  }

  // Track pinch gesture
  private trackPinchGesture(event: TouchEvent): void {
    if (event.touches.length === 2) {
      const touch1 = event.touches[0];
      const touch2 = event.touches[1];
      const distance = Math.sqrt(
        Math.pow(touch2.clientX - touch1.clientX, 2) +
        Math.pow(touch2.clientY - touch1.clientY, 2)
      );

      trackRUMEvent('mobile-pinch-gesture', {
        distance: Math.round(distance),
        target: this.generateSelector(event.target as Element),
        pageType: this.getPageType(),
        timestamp: Date.now()
      });
    }
  }

  // Check touch target size
  private checkTouchTargetSize(element: Element): void {
    const rect = element.getBoundingClientRect();
    const minTouchSize = 44; // Apple HIG minimum 44x44 points
    const minSizeInPixels = minTouchSize * window.devicePixelRatio;

    const width = rect.width * window.devicePixelRatio;
    const height = rect.height * window.devicePixelRatio;

    if (width < minSizeInPixels || height < minSizeInPixels) {
      const issue: MobileUsabilityIssue = {
        id: this.generateIssueId(),
        type: 'touch-target-size',
        severity: width < 34 || height < 34 ? 'critical' : 'high',
        description: `Touch target too small: ${Math.round(width)}x${Math.round(height)}px (minimum: ${minSizeInPixels}px)`,
        element: {
          tagName: element.tagName,
          selector: this.generateSelector(element),
          size: { width: rect.width, height: rect.height },
          position: { x: rect.left, y: rect.top }
        },
        pageType: this.getPageType(),
        timestamp: Date.now(),
        recommendations: [
          'Increase touch target size to at least 44x44 points',
          'Add padding to interactive elements',
          'Consider using larger tap targets for mobile luxury experience'
        ],
        impact: {
          conversionRisk: 0.6,
          userFrustration: 0.7,
          luxuryPerception: 0.5
        },
        resolved: false
      };

      this.processUsabilityIssue(issue);
    }
  }

  // Initialize scroll monitoring
  private initializeScrollMonitoring(): void {
    let scrollStartTime = 0;
    let lastScrollY = 0;
    let scrollFrameCount = 0;
    let scrollAnimationId: number | null = null;

    const startScrollMonitoring = () => {
      scrollStartTime = performance.now();
      scrollFrameCount = 0;
      lastScrollY = window.scrollY;

      // Monitor scroll performance
      const monitorScrollFrame = () => {
        scrollFrameCount++;
        scrollAnimationId = requestAnimationFrame(monitorScrollFrame);
      };

      monitorScrollFrame();
    };

    const stopScrollMonitoring = () => {
      if (scrollAnimationId) {
        cancelAnimationFrame(scrollAnimationId);
        scrollAnimationId = null;
      }

      const scrollDuration = performance.now() - scrollStartTime;
      const scrollDistance = Math.abs(window.scrollY - lastScrollY);

      if (scrollDuration > 0) {
        const fps = scrollFrameCount / (scrollDuration / 1000);
        const isSmooth = fps >= 55;

        if (!isSmooth) {
          this.recordScrollPerformanceIssue({
            fps,
            duration: scrollDuration,
            distance: scrollDistance,
            pageType: this.getPageType()
          });
        }

        trackRUMEvent('mobile-scroll-performance', {
          fps: Math.round(fps),
          smooth: isSmooth,
          duration: Math.round(scrollDuration),
          distance: Math.round(scrollDistance),
          pageType: this.getPageType(),
          timestamp: Date.now()
        });
      }
    };

    document.addEventListener('touchstart', startScrollMonitoring, { passive: true });
    document.addEventListener('touchend', stopScrollMonitoring, { passive: true });
  }

  // Record scroll performance issue
  private recordScrollPerformanceIssue(performanceData: any): void {
    trackRUMEvent('mobile-scroll-performance-issue', {
      ...performanceData,
      timestamp: Date.now()
    });
  }

  // Initialize viewport monitoring
  private initializeViewportMonitoring(): void {
    // Monitor viewport scaling issues
    this.checkViewportConfiguration();

    // Monitor orientation changes
    window.addEventListener('orientationchange', () => {
      setTimeout(() => {
        this.checkOrientationHandling();
      }, 500);
    });

    // Monitor screen size changes
    const resizeObserver = new ResizeObserver(() => {
      this.checkViewportResponsive();
    });

    resizeObserver.observe(document.body);
  }

  // Check viewport configuration
  private checkViewportConfiguration(): void {
    const viewport = document.querySelector('meta[name="viewport"]');
    if (!viewport) {
      const issue: MobileUsabilityIssue = {
        id: this.generateIssueId(),
        type: 'viewport-scaling',
        severity: 'critical',
        description: 'Missing viewport meta tag',
        element: {
          tagName: 'META',
          selector: 'meta[name="viewport"]',
          size: { width: 0, height: 0 },
          position: { x: 0, y: 0 }
        },
        pageType: this.getPageType(),
        timestamp: Date.now(),
        recommendations: [
          'Add viewport meta tag: <meta name="viewport" content="width=device-width, initial-scale=1">',
          'Ensure proper scaling for mobile devices'
        ],
        impact: {
          conversionRisk: 0.8,
          userFrustration: 0.9,
          luxuryPerception: 0.7
        },
        resolved: false
      };

      this.processUsabilityIssue(issue);
    }
  }

  // Check orientation handling
  private checkOrientationHandling(): void {
    const currentOrientation = window.innerWidth > window.innerHeight ? 'landscape' : 'portrait';
    const viewportWidth = window.innerWidth;
    const screenWidth = screen.width;

    // Check if viewport adapts properly to orientation
    if (currentOrientation === 'landscape' && viewportWidth < screenWidth * 0.8) {
      trackRUMEvent('mobile-orientation-issue', {
        orientation: currentOrientation,
        viewportWidth,
        screenWidth,
        adaptationIssue: true,
        pageType: this.getPageType(),
        timestamp: Date.now()
      });
    }
  }

  // Check viewport responsive
  private checkViewportResponsive(): void {
    const width = window.innerWidth;
    const breakpointIssues = [];

    if (width < 320) {
      breakpointIssues.push('below-minimum-width');
    } else if (width < 768 && width > 480) {
      // Tablet range - check for proper tablet optimization
      this.checkTabletOptimization();
    }

    if (breakpointIssues.length > 0) {
      trackRUMEvent('mobile-viewport-issues', {
        width,
        issues: breakpointIssues,
        pageType: this.getPageType(),
        timestamp: Date.now()
      });
    }
  }

  // Check tablet optimization
  private checkTabletOptimization(): void {
    // Check if content is properly laid out for tablet screens
    const textElements = document.querySelectorAll('p, h1, h2, h3, h4, h5, h6');
    const lineLengthIssues = [];

    textElements.forEach(element => {
      const rect = element.getBoundingClientRect();
      if (rect.width > 600) { // Too wide for comfortable reading on tablet
        lineLengthIssues.push(this.generateSelector(element));
      }
    });

    if (lineLengthIssues.length > 0) {
      trackRUMEvent('tablet-optimization-issues', {
        lineLengthIssues,
        pageType: this.getPageType(),
        timestamp: Date.now()
      });
    }
  }

  // Initialize performance monitoring
  private initializePerformanceMonitoring(): void {
    // Monitor frame rate
    this.initializeFrameRateMonitoring();

    // Monitor memory usage
    this.initializeMemoryMonitoring();

    // Monitor battery level if available
    this.initializeBatteryMonitoring();

    // Monitor thermal state if available
    this.initializeThermalMonitoring();
  }

  // Initialize frame rate monitoring
  private initializeFrameRateMonitoring(): void {
    let frameCount = 0;
    let lastTime = performance.now();

    const measureFrameRate = () => {
      frameCount++;
      const currentTime = performance.now();

      if (currentTime - lastTime >= 1000) {
        const fps = frameCount;
        frameCount = 0;
        lastTime = currentTime;

        // Track frame rate
        if (fps < 30) {
          trackRUMEvent('mobile-low-fps', {
            fps,
            pageType: this.getPageType(),
            timestamp: Date.now()
          });
        }

        this.recordMobilePerformance({
          touchResponseTime: 0, // Will be updated separately
          scrollPerformance: {
            framesPerSecond: fps,
            jankCount: 0,
            averageFrameTime: 1000 / fps
          },
          renderingPerformance: {
            paintTime: 0,
            layoutTime: 0,
            compositeTime: 0
          },
          memoryUsage: {
            used: 0,
            total: 0,
            pressure: 'low'
          }
        });
      }

      if (this.monitoringEnabled) {
        this.frameRateMonitor = requestAnimationFrame(measureFrameRate);
      }
    };

    measureFrameRate();
  }

  // Initialize memory monitoring
  private initializeMemoryMonitoring(): void {
    if ('memory' in performance) {
      setInterval(() => {
        const memory = (performance as any).memory;
        const usedJSHeapSize = memory.usedJSHeapSize;
        const totalJSHeapSize = memory.totalJSHeapSize;
        const jsHeapSizeLimit = memory.jsHeapSizeLimit;

        const memoryPressure = usedJSHeapSize / jsHeapSizeLimit;
        let pressureLevel: 'low' | 'medium' | 'high' = 'low';

        if (memoryPressure > 0.8) {
          pressureLevel = 'high';
        } else if (memoryPressure > 0.6) {
          pressureLevel = 'medium';
        }

        trackRUMEvent('mobile-memory-usage', {
          used: Math.round(usedJSHeapSize / 1024 / 1024), // MB
          total: Math.round(totalJSHeapSize / 1024 / 1024), // MB
          limit: Math.round(jsHeapSizeLimit / 1024 / 1024), // MB
          pressure: pressureLevel,
          pageType: this.getPageType(),
          timestamp: Date.now()
        });

        if (pressureLevel === 'high') {
          this.reportMobilePerformanceIssue('high-memory-usage', {
            memoryPressure,
            usedJSHeapSize,
            pageType: this.getPageType()
          });
        }
      }, 30000); // Every 30 seconds
    }
  }

  // Initialize battery monitoring
  private initializeBatteryMonitoring(): void {
    if ('getBattery' in navigator) {
      (navigator as any).getBattery().then((battery: any) => {
        const updateBatteryStatus = () => {
          trackRUMEvent('mobile-battery-status', {
            level: Math.round(battery.level * 100),
            charging: battery.charging,
            pageType: this.getPageType(),
            timestamp: Date.now()
          });

          if (battery.level < 0.2 && !battery.charging) {
            trackRUMEvent('mobile-low-battery', {
              level: Math.round(battery.level * 100),
              charging: battery.charging,
              pageType: this.getPageType(),
              timestamp: Date.now()
            });
          }
        };

        updateBatteryStatus();
        battery.addEventListener('levelchange', updateBatteryStatus);
        battery.addEventListener('chargingchange', updateBatteryStatus);
      });
    }
  }

  // Initialize thermal monitoring
  private initializeThermalMonitoring(): void {
    // Note: Thermal monitoring is not widely supported yet
    // This is a placeholder for future implementation
    if ('thermal' in navigator) {
      (navigator as any).thermal.addEventListener('temperaturechange', (event: any) => {
        trackRUMEvent('mobile-thermal-state', {
          temperature: event.temperature,
          state: event.state,
          pageType: this.getPageType(),
          timestamp: Date.now()
        });
      });
    }
  }

  // Initialize usability analysis
  private initializeUsabilityAnalysis(): void {
    // Monitor text readability
    this.checkTextReadability();

    // Monitor navigation difficulty
    this.checkNavigationEase();

    // Monitor layout shifts
    this.checkLayoutStability();

    // Monitor form usability
    this.checkFormUsability();
  }

  // Check text readability
  private checkTextReadability(): void {
    const textElements = document.querySelectorAll('p, li, span, div');

    textElements.forEach(element => {
      const styles = window.getComputedStyle(element);
      const fontSize = parseFloat(styles.fontSize);
      const lineHeight = parseFloat(styles.lineHeight);
      const color = styles.color;
      const backgroundColor = styles.backgroundColor || styles.background;

      // Check font size (minimum 16px for mobile)
      if (fontSize < 16) {
        const issue: MobileUsabilityIssue = {
          id: this.generateIssueId(),
          type: 'text-readability',
          severity: fontSize < 14 ? 'high' : 'medium',
          description: `Text too small for mobile: ${Math.round(fontSize)}px (minimum: 16px)`,
          element: {
            tagName: element.tagName,
            selector: this.generateSelector(element),
            size: { width: 0, height: fontSize },
            position: { x: 0, y: 0 }
          },
          pageType: this.getPageType(),
          timestamp: Date.now(),
          recommendations: [
            'Increase font size to at least 16px for mobile',
            'Consider using relative units (rem, em)',
            'Ensure text remains readable without zooming'
          ],
          impact: {
            conversionRisk: 0.4,
            userFrustration: 0.5,
            luxuryPerception: 0.3
          },
          resolved: false
        };

        this.processUsabilityIssue(issue);
      }

      // Check line height (minimum 1.4 for readability)
      if (lineHeight / fontSize < 1.4) {
        trackRUMEvent('mobile-line-height-issue', {
          fontSize,
          lineHeight,
          ratio: lineHeight / fontSize,
          element: this.generateSelector(element),
          pageType: this.getPageType(),
          timestamp: Date.now()
        });
      }
    });
  }

  // Check navigation ease
  private checkNavigationEase(): void {
    // Check spacing between clickable elements
    const clickableElements = document.querySelectorAll('a, button, input, select, [onclick]');

    for (let i = 0; i < clickableElements.length; i++) {
      const element1 = clickableElements[i];
      const rect1 = element1.getBoundingClientRect();

      for (let j = i + 1; j < clickableElements.length; j++) {
        const element2 = clickableElements[j];
        const rect2 = element2.getBoundingClientRect();

        // Check if elements are too close
        const horizontalDistance = Math.abs(rect1.right - rect2.left) || Math.abs(rect2.right - rect1.left);
        const verticalDistance = Math.abs(rect1.bottom - rect2.top) || Math.abs(rect2.bottom - rect1.top);

        if ((horizontalDistance < 8 && verticalDistance < 50) || (verticalDistance < 8 && horizontalDistance < 50)) {
          trackRUMEvent('mobile-navigation-spacing-issue', {
            element1: this.generateSelector(element1),
            element2: this.generateSelector(element2),
            distance: { horizontal: horizontalDistance, vertical: verticalDistance },
            pageType: this.getPageType(),
            timestamp: Date.now()
          });
        }
      }
    }

    // Check reachability (can users easily reach all navigation elements?)
    this.checkNavigationReachability();
  }

  // Check navigation reachability
  private checkNavigationReachability(): void {
    const navigationElements = document.querySelectorAll('nav a, .menu a, header a, [role="navigation"] a');
    const viewportHeight = window.innerHeight;

    navigationElements.forEach(element => {
      const rect = element.getBoundingClientRect();

      // Check if navigation elements are within easy thumb reach (bottom half of screen for one-handed use)
      if (rect.top > viewportHeight * 0.7) {
        trackRUMEvent('mobile-navigation-reachability', {
          element: this.generateSelector(element),
          position: { top: rect.top, bottom: rect.bottom },
          pageType: this.getPageType(),
          timestamp: Date.now()
        });
      }
    });
  }

  // Check layout stability
  private checkLayoutStability(): void {
    let layoutShifts = 0;
    let cumulativeLayoutShift = 0;

    if ('PerformanceObserver' in window) {
      const observer = new PerformanceObserver((list) => {
        list.getEntries().forEach(entry => {
          if (entry.entryType === 'layout-shift' && !(entry as any).hadRecentInput) {
            layoutShifts++;
            cumulativeLayoutShift += (entry as any).value;
          }
        });
      });

      observer.observe({ entryTypes: ['layout-shift'] });

      // Check for layout shift issues after page load
      setTimeout(() => {
        if (layoutShifts > 5 || cumulativeLayoutShift > 0.1) {
          const issue: MobileUsabilityIssue = {
            id: this.generateIssueId(),
            type: 'layout-shift',
            severity: cumulativeLayoutShift > 0.25 ? 'critical' : 'high',
            description: `Excessive layout shifts: ${layoutShifts} shifts, CLS: ${cumulativeLayoutShift.toFixed(3)}`,
            element: {
              tagName: 'BODY',
              selector: 'body',
              size: { width: window.innerWidth, height: window.innerHeight },
              position: { x: 0, y: 0 }
            },
            pageType: this.getPageType(),
            timestamp: Date.now(),
            recommendations: [
              'Reserve space for dynamic content',
              'Set explicit dimensions for images and videos',
              'Avoid inserting content above existing content',
              'Use transform animations instead of layout changes'
            ],
            impact: {
              conversionRisk: 0.7,
              userFrustration: 0.8,
              luxuryPerception: 0.6
            },
            resolved: false
          };

          this.processUsabilityIssue(issue);
        }
      }, 5000);
    }
  }

  // Check form usability
  private checkFormUsability(): void {
    const forms = document.querySelectorAll('form');

    forms.forEach(form => {
      const inputs = form.querySelectorAll('input, select, textarea');

      inputs.forEach(input => {
        const rect = input.getBoundingClientRect();
        const width = rect.width;
        const height = rect.height;

        // Check input size (minimum 48px height for touch)
        if (height < 48) {
          trackRUMEvent('mobile-form-input-size', {
            elementType: input.tagName,
            inputType: (input as HTMLInputElement).type,
            size: { width, height },
            selector: this.generateSelector(input),
            pageType: this.getPageType(),
            timestamp: Date.now()
          });
        }

        // Check input spacing
        const nextElement = input.nextElementSibling;
        if (nextElement) {
          const nextRect = nextElement.getBoundingClientRect();
          const verticalSpacing = nextRect.top - rect.bottom;

          if (verticalSpacing < 16) {
            trackRUMEvent('mobile-form-input-spacing', {
              inputType: input.tagName,
              spacing: verticalSpacing,
              inputSelector: this.generateSelector(input),
              nextSelector: this.generateSelector(nextElement),
              pageType: this.getPageType(),
              timestamp: Date.now()
            });
          }
        }
      });
    });
  }

  // Initialize luxury experience tracking
  private initializeLuxuryExperienceTracking(): void {
    // Track visual polish indicators
    this.checkVisualPolish();

    // Track premium interaction patterns
    this.checkPremiumInteractions();

    // Track luxury-specific optimizations
    this.checkLuxuryOptimizations();
  }

  // Check visual polish
  private checkVisualPolish(): void {
    // Check for proper animations
    const animatedElements = document.querySelectorAll('[style*="transition"], [style*="animation"], .animate');

    animatedElements.forEach(element => {
      const styles = window.getComputedStyle(element);
      const transitionDuration = styles.transitionDuration;
      const animationDuration = styles.animationDuration;

      // Check if animations are smooth (300ms or less for luxury feel)
      const transitionMs = parseFloat(transitionDuration) * 1000;
      const animationMs = parseFloat(animationDuration) * 1000;

      if (transitionMs > 500 || animationMs > 1000) {
        trackRUMEvent('mobile-animation-performance', {
          element: this.generateSelector(element),
          transitionDuration: transitionMs,
          animationDuration: animationMs,
          pageType: this.getPageType(),
          timestamp: Date.now()
        });
      }
    });

    // Check for high-quality images
    const images = document.querySelectorAll('img');
    images.forEach(img => {
      const rect = img.getBoundingClientRect();
      const displayWidth = rect.width * window.devicePixelRatio;

      // Check if image resolution is adequate for high-DPI displays
      if (displayWidth > 100 && (img as HTMLImageElement).naturalWidth < displayWidth * 1.5) {
        trackRUMEvent('mobile-image-quality', {
          element: this.generateSelector(img),
          displayWidth: Math.round(displayWidth),
          naturalWidth: (img as HTMLImageElement).naturalWidth,
          adequate: false,
          pageType: this.getPageType(),
          timestamp: Date.now()
        });
      }
    });
  }

  // Check premium interactions
  private checkPremiumInteractions(): void {
    // Check for haptic feedback opportunities
    if (this.capabilities.vibration) {
      const interactiveElements = document.querySelectorAll('button, .card, [role="button"]');

      // Note: We can't trigger vibration without user interaction, but we can track opportunities
      interactiveElements.forEach(element => {
        trackRUMEvent('mobile-haptic-opportunity', {
          element: this.generateSelector(element),
          interactionType: element.tagName.toLowerCase(),
          pageType: this.getPageType(),
          timestamp: Date.now()
        });
      });
    }

    // Check for gesture support
    const swipeableElements = document.querySelectorAll('.carousel, .slider, .swipeable');

    swipeableElements.forEach(element => {
      trackRUMEvent('mobile-gesture-support', {
        element: this.generateSelector(element),
        gestureType: 'swipe',
        pageType: this.getPageType(),
        timestamp: Date.now()
      });
    });
  }

  // Check luxury optimizations
  private checkLuxuryOptimizations(): void {
    // Check for progressive enhancement
    const criticalElements = document.querySelectorAll('.hero, .header, .booking-cta');

    criticalElements.forEach(element => {
      const hasLoadingIndicator = element.querySelector('.loading, .skeleton, [data-loading]');
      const hasLazyLoading = element.hasAttribute('loading') || element.classList.contains('lazy');

      if (!hasLoadingIndicator && !hasLazyLoading) {
        trackRUMEvent('mobile-luxury-optimization', {
          type: 'loading-enhancement',
          element: this.generateSelector(element),
          recommendation: 'Add loading indicators or lazy loading for better perceived performance',
          pageType: this.getPageType(),
          timestamp: Date.now()
        });
      }
    });
  }

  // Initialize continuous monitoring
  private initializeContinuousMonitoring(): void {
    // Monitor touch performance trends
    setInterval(() => {
      this.analyzeTouchPerformanceTrends();
    }, 60000); // Every minute

    // Monitor mobile-specific issues
    setInterval(() => {
      this.checkMobileSpecificIssues();
    }, 120000); // Every 2 minutes

    // Generate mobile experience report
    setInterval(() => {
      this.generateMobileExperienceReport();
    }, 300000); // Every 5 minutes
  }

  // Analyze touch performance trends
  private analyzeTouchPerformanceTrends(): void {
    const recentInteractions = this.touchInteractions.filter(
      interaction => Date.now() - interaction.timestamp < 60000
    );

    if (recentInteractions.length > 0) {
      const averageResponseTime = recentInteractions.reduce((sum, interaction) => sum + interaction.duration, 0) / recentInteractions.length;
      const slowInteractions = recentInteractions.filter(interaction => interaction.duration > 300);

      if (slowInteractions.length > recentInteractions.length * 0.2) { // More than 20% slow interactions
        trackRUMEvent('mobile-touch-performance-trend', {
          averageResponseTime: Math.round(averageResponseTime),
          slowInteractionRate: slowInteractions.length / recentInteractions.length,
          totalInteractions: recentInteractions.length,
          pageType: this.getPageType(),
          timestamp: Date.now()
        });
      }
    }
  }

  // Check mobile-specific issues
  private checkMobileSpecificIssues(): void {
    // Check for horizontal scrollbars
    if (document.body.scrollWidth > document.body.clientWidth) {
      trackRUMEvent('mobile-horizontal-scroll', {
        bodyWidth: document.body.scrollWidth,
        clientWidth: document.body.clientWidth,
        pageType: this.getPageType(),
        timestamp: Date.now()
      });
    }

    // Check for zoom issues
    const viewport = document.querySelector('meta[name="viewport"]');
    if (viewport) {
      const content = viewport.getAttribute('content');
      if (content && content.includes('user-scalable=no')) {
        trackRUMEvent('mobile-zoom-restricted', {
          pageType: this.getPageType(),
          timestamp: Date.now()
        });
      }
    }

    // Check for fixed positioning issues
    const fixedElements = document.querySelectorAll('[style*="position: fixed"], .fixed');

    fixedElements.forEach(element => {
      const rect = element.getBoundingClientRect();
      if (rect.right > window.innerWidth || rect.bottom > window.innerHeight) {
        trackRUMEvent('mobile-fixed-position-overflow', {
          element: this.generateSelector(element),
          position: { right: rect.right, bottom: rect.bottom },
          viewport: { width: window.innerWidth, height: window.innerHeight },
          pageType: this.getPageType(),
          timestamp: Date.now()
        });
      }
    });
  }

  // Generate mobile experience report
  private generateMobileExperienceReport(): void {
    const pageType = this.getPageType();
    const recentIssues = this.usabilityIssues.filter(issue => issue.pageType === pageType && !issue.resolved);
    const recentInteractions = this.touchInteractions.filter(interaction => interaction.pageType === pageType);

    const score = this.calculateMobileExperienceScore(recentIssues, recentInteractions);

    trackRUMEvent('mobile-experience-report', {
      pageType,
      overallScore: score.overall,
      categoryScores: score.categories,
      totalIssues: recentIssues.length,
      criticalIssues: recentIssues.filter(i => i.severity === 'critical').length,
      touchInteractions: recentInteractions.length,
      averageTouchResponse: recentInteractions.length > 0 ?
        Math.round(recentInteractions.reduce((sum, i) => sum + i.duration, 0) / recentInteractions.length) : 0,
      deviceCapabilities: this.capabilities,
      timestamp: Date.now()
    });

    // Report critical issues
    const criticalIssues = recentIssues.filter(issue => issue.severity === 'critical');
    if (criticalIssues.length > 0) {
      this.reportCriticalMobileIssues(criticalIssues);
    }
  }

  // Calculate mobile experience score
  private calculateMobileExperienceScore(issues: MobileUsabilityIssue[], interactions: TouchInteraction[]): MobileExperienceScore {
    const categoryScores = {
      touchPerformance: 100,
      visualQuality: 100,
      navigationEase: 100,
      contentReadability: 100,
      loadingSpeed: 100,
      luxuryExperience: 100
    };

    // Calculate deductions based on issues
    issues.forEach(issue => {
      const deduction = this.getIssueDeduction(issue);

      switch (issue.type) {
        case 'touch-target-size':
        case 'performance':
          categoryScores.touchPerformance -= deduction;
          break;
        case 'layout-shift':
        case 'viewport-scaling':
          categoryScores.visualQuality -= deduction;
          break;
        case 'navigation-difficulty':
          categoryScores.navigationEase -= deduction;
          break;
        case 'text-readability':
          categoryScores.contentReadability -= deduction;
          break;
      }

      // All issues affect luxury experience
      categoryScores.luxuryExperience -= deduction * 0.5;
    });

    // Calculate touch performance based on interactions
    if (interactions.length > 0) {
      const averageResponseTime = interactions.reduce((sum, i) => sum + i.duration, 0) / interactions.length;
      if (averageResponseTime > 200) {
        categoryScores.touchPerformance -= Math.min(30, (averageResponseTime - 200) / 10);
      }
    }

    // Ensure scores don't go below 0
    Object.keys(categoryScores).forEach(key => {
      categoryScores[key as keyof typeof categoryScores] = Math.max(0, categoryScores[key as keyof typeof categoryScores]);
    });

    // Calculate overall score
    const overall = Math.round(
      Object.values(categoryScores).reduce((sum, score) => sum + score, 0) / Object.keys(categoryScores).length
    );

    const recommendations = this.generateMobileRecommendations(issues, categoryScores);

    return {
      overall,
      categories: categoryScores,
      issues,
      recommendations,
      deviceCapabilities: this.capabilities
    };
  }

  // Get issue deduction
  private getIssueDeduction(issue: MobileUsabilityIssue): number {
    const severityMultipliers = {
      low: 5,
      medium: 15,
      high: 25,
      critical: 40
    };

    return severityMultipliers[issue.severity];
  }

  // Generate mobile recommendations
  private generateMobileRecommendations(issues: MobileUsabilityIssue[], scores: any): string[] {
    const recommendations: string[] = [];

    // Issue-based recommendations
    const issueTypes = [...new Set(issues.map(i => i.type))];

    if (issueTypes.includes('touch-target-size')) {
      recommendations.push('Increase touch target sizes to meet mobile accessibility guidelines');
    }

    if (issueTypes.includes('viewport-scaling')) {
      recommendations.push('Add proper viewport configuration for mobile devices');
    }

    if (issueTypes.includes('text-readability')) {
      recommendations.push('Improve text readability with larger fonts and better contrast');
    }

    if (issueTypes.includes('navigation-difficulty')) {
      recommendations.push('Optimize navigation for mobile one-handed use');
    }

    if (issueTypes.includes('performance')) {
      recommendations.push('Optimize performance for smoother mobile experience');
    }

    // Score-based recommendations
    if (scores.touchPerformance < 80) {
      recommendations.push('Improve touch responsiveness and interaction feedback');
    }

    if (scores.visualQuality < 80) {
      recommendations.push('Enhance visual polish and reduce layout shifts');
    }

    if (scores.luxuryExperience < 85) {
      recommendations.push('Elevate mobile experience to match luxury brand standards');
    }

    return recommendations;
  }

  // Run mobile usability audit
  private runMobileUsabilityAudit(): void {
    console.log('[Mobile Experience] Running comprehensive mobile usability audit...');

    // Run all checks
    this.checkTextReadability();
    this.checkNavigationEase();
    this.checkFormUsability();
    this.checkTouchTargetSizes();
    this.checkViewportConfiguration();

    console.log('[Mobile Experience] Mobile usability audit completed');
  }

  // Check touch target sizes for all interactive elements
  private checkTouchTargetSizes(): void {
    const interactiveElements = document.querySelectorAll('a, button, input, select, textarea, [onclick], [role="button"]');

    interactiveElements.forEach(element => {
      this.checkTouchTargetSize(element);
    });
  }

  // Track touch performance
  private trackTouchPerformance(interaction: TouchInteraction): void {
    if (interaction.duration > 300) {
      trackRUMEvent('mobile-slow-touch-response', {
        interactionType: interaction.type,
        duration: Math.round(interaction.duration),
        target: interaction.target.selector,
        pageType: interaction.pageType,
        timestamp: Date.now()
      });
    }
  }

  // Record mobile performance
  private recordMobilePerformance(performance: MobilePerformance): void {
    this.performanceMetrics.push(performance);

    // Keep only recent metrics
    if (this.performanceMetrics.length > 50) {
      this.performanceMetrics = this.performanceMetrics.slice(-50);
    }
  }

  // Report mobile performance issue
  private reportMobilePerformanceIssue(type: string, data: any): void {
    reportMessage(`Mobile performance issue: ${type}`, 'warning', {
      type,
      pageType: this.getPageType(),
      deviceCapabilities: this.capabilities,
      ...data
    });
  }

  // Report critical mobile issues
  private reportCriticalMobileIssues(issues: MobileUsabilityIssue[]): void {
    issues.forEach(issue => {
      reportMessage(`Critical mobile usability issue: ${issue.description}`, 'error', {
        issueId: issue.id,
        type: issue.type,
        severity: issue.severity,
        element: issue.element,
        pageType: issue.pageType,
        impact: issue.impact,
        recommendations: issue.recommendations
      });
    });
  }

  // Process usability issue
  private processUsabilityIssue(issue: MobileUsabilityIssue): void {
    // Check for duplicates
    const existingIssue = this.usabilityIssues.find(existing =>
      existing.type === issue.type &&
      existing.element.selector === issue.element.selector &&
      !existing.resolved
    );

    if (!existingIssue) {
      this.usabilityIssues.push(issue);

      // Track issue event
      trackRUMEvent('mobile-usability-issue', {
        issueId: issue.id,
        type: issue.type,
        severity: issue.severity,
        description: issue.description,
        pageType: issue.pageType,
        impact: issue.impact,
        timestamp: Date.now()
      });

      // Report if critical
      if (issue.severity === 'critical') {
        this.reportCriticalMobileIssues([issue]);
      }
    }
  }

  // Helper methods

  // Generate interaction ID
  private generateInteractionId(): string {
    return `touch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Generate issue ID
  private generateIssueId(): string {
    return `mobile_issue_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Generate CSS selector
  private generateSelector(element: Element): string {
    if (element.id) {
      return `#${element.id}`;
    }

    if (element.className) {
      const classes = element.className.split(' ').filter(c => c.trim());
      if (classes.length > 0) {
        return `${element.tagName.toLowerCase()}.${classes.join('.')}`;
      }
    }

    return element.tagName.toLowerCase();
  }

  // Get page type
  private getPageType(): string {
    const path = window.location.pathname;
    if (path === '/') return 'landing';
    if (path.includes('/beauty')) return 'beauty-services';
    if (path.includes('/fitness')) return 'fitness-services';
    if (path.includes('/booking')) return 'booking';
    if (path.includes('/admin')) return 'admin';
    return 'other';
  }

  // Public API methods

  // Get mobile experience score
  getMobileExperienceScore(): MobileExperienceScore {
    const pageType = this.getPageType();
    const issues = this.usabilityIssues.filter(issue => issue.pageType === pageType && !issue.resolved);
    const interactions = this.touchInteractions.filter(interaction => interaction.pageType === pageType);

    return this.calculateMobileExperienceScore(issues, interactions);
  }

  // Get all usability issues
  getUsabilityIssues(): MobileUsabilityIssue[] {
    return [...this.usabilityIssues];
  }

  // Get issues by severity
  getIssuesBySeverity(severity: MobileUsabilityIssue['severity']): MobileUsabilityIssue[] {
    return this.usabilityIssues.filter(issue => issue.severity === severity && !issue.resolved);
  }

  // Get touch interactions
  getTouchInteractions(): TouchInteraction[] {
    return [...this.touchInteractions];
  }

  // Get device capabilities
  getDeviceCapabilities(): MobileCapabilities {
    return { ...this.capabilities };
  }

  // Mark issue as resolved
  resolveIssue(issueId: string): void {
    const issue = this.usabilityIssues.find(i => i.id === issueId);
    if (issue) {
      issue.resolved = true;

      trackRUMEvent('mobile-usability-issue-resolved', {
        issueId: issue.id,
        type: issue.type,
        pageType: issue.pageType,
        timestamp: Date.now()
      });
    }
  }

  // Report manual issue
  reportManualIssue(issueData: Partial<MobileUsabilityIssue>): void {
    const issue: MobileUsabilityIssue = {
      id: this.generateIssueId(),
      type: issueData.type || 'performance',
      severity: issueData.severity || 'medium',
      description: issueData.description || 'Manually reported mobile issue',
      element: issueData.element || {
        tagName: 'UNKNOWN',
        selector: 'manual',
        size: { width: 0, height: 0 },
        position: { x: 0, y: 0 }
      },
      pageType: this.getPageType(),
      timestamp: Date.now(),
      recommendations: issueData.recommendations || ['Review and fix reported mobile issue'],
      impact: issueData.impact || {
        conversionRisk: 0.5,
        userFrustration: 0.5,
        luxuryPerception: 0.5
      },
      resolved: false
    };

    this.processUsabilityIssue(issue);
  }

  // Enable/disable monitoring
  setMonitoringEnabled(enabled: boolean): void {
    this.monitoringEnabled = enabled;

    if (enabled && this.frameRateMonitor === null) {
      this.initializeFrameRateMonitoring();
    } else if (!enabled && this.frameRateMonitor) {
      cancelAnimationFrame(this.frameRateMonitor);
      this.frameRateMonitor = null;
    }
  }

  // Export mobile experience data
  exportData(): any {
    return {
      isMobileDevice: this.isMobileDevice,
      deviceCapabilities: this.capabilities,
      touchInteractions: this.touchInteractions,
      performanceMetrics: this.performanceMetrics,
      usabilityIssues: this.usabilityIssues,
      currentScore: this.getMobileExperienceScore(),
      summary: {
        totalIssues: this.usabilityIssues.length,
        unresolvedIssues: this.usabilityIssues.filter(i => !i.resolved).length,
        criticalIssues: this.getIssuesBySeverity('critical').length,
        highIssues: this.getIssuesBySeverity('high').length,
        touchInteractions: this.touchInteractions.length,
        overallScore: this.getMobileExperienceScore().overall
      }
    };
  }
}

// Create and export singleton instance
export const mobileExperienceMonitor = MobileExperienceMonitor.getInstance();

// Initialize automatically on mobile devices
if (typeof window !== 'undefined') {
  if (document.readyState === 'complete') {
    mobileExperienceMonitor.initialize();
  } else {
    window.addEventListener('load', () => {
      mobileExperienceMonitor.initialize();
    });
  }
}

// Export helper functions
export const initializeMobileExperienceMonitoring = () => mobileExperienceMonitor.initialize();
export const getMobileExperienceScore = () => mobileExperienceMonitor.getMobileExperienceScore();
export const getMobileUsabilityIssues = () => mobileExperienceMonitor.getUsabilityIssues();
export const reportMobileUsabilityIssue = (issueData: Partial<MobileUsabilityIssue>) =>
  mobileExperienceMonitor.reportManualIssue(issueData);
export const resolveMobileUsabilityIssue = (issueId: string) =>
  mobileExperienceMonitor.resolveIssue(issueId);
export const getMobileDeviceCapabilities = () => mobileExperienceMonitor.getDeviceCapabilities();
export const exportMobileExperienceData = () => mobileExperienceMonitor.exportData();

// Export types
export { MobileCapabilities, TouchInteraction, MobilePerformance, MobileUsabilityIssue, MobileExperienceScore };