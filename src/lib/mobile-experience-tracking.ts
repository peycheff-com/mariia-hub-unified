/**
 * Mobile Experience Tracking and Optimization
 * Comprehensive mobile UX monitoring for luxury beauty and fitness platform
 */

import { trackRUMEvent } from './rum';
import { reportMessage } from './sentry';

// Mobile device detection and capabilities
interface MobileDeviceInfo {
  isMobile: boolean;
  isTablet: boolean;
  isTouchDevice: boolean;
  deviceType: 'phone' | 'tablet' | 'desktop';
  devicePixelRatio: number;
  screenWidth: number;
  screenHeight: number;
  viewportWidth: number;
  viewportHeight: number;
  orientation: 'portrait' | 'landscape';
  connectionType: string;
  effectiveConnectionType: string;
  deviceMemory?: number;
  hardwareConcurrency?: number;
  maxTouchPoints: number;
  supportsPassiveEvents: boolean;
  supportsTouchActions: boolean;
}

// Mobile UX metrics
interface MobileUXMetrics {
  touchResponsiveness: number;
  scrollPerformance: number;
  zoomInteractionSuccess: number;
  viewportUtilization: number;
  tapTargetAccessibility: number;
  gestureRecognitionSuccess: number;
  orientationChangeHandling: number;
  virtualKeyboardInteraction: number;
  mobileFormUsability: number;
  deviceCompatibilityScore: number;
}

// Mobile interaction types
enum MobileInteractionType {
  TAP = 'tap',
  SWIPE = 'swipe',
  PINCH = 'pinch',
  SCROLL = 'scroll',
  DOUBLE_TAP = 'double_tap',
  LONG_PRESS = 'long_press',
  GESTURE = 'gesture'
}

// Mobile experience issue categories
enum MobileIssueCategory {
  TOUCH_RESPONSIVENESS = 'touch_responsiveness',
  VIEWPORT_ADAPTATION = 'viewport_adaptation',
  TAP_TARGET_SIZE = 'tap_target_size',
  SCROLL_PERFORMANCE = 'scroll_performance',
  ORIENTATION_HANDLING = 'orientation_handling',
  VIRTUAL_KEYBOARD = 'virtual_keyboard',
  GESTURE_RECOGNITION = 'gesture_recognition',
  DEVICE_COMPATIBILITY = 'device_compatibility',
  MOBILE_PERFORMANCE = 'mobile_performance',
  MOBILE_ACCESSIBILITY = 'mobile_accessibility'
}

// Mobile Experience Tracker
export class MobileExperienceTracker {
  private deviceInfo: MobileDeviceInfo;
  private metrics: MobileUXMetrics;
  private touchEvents: TouchEvent[] = [];
  private scrollEvents: ScrollEvent[] = [];
  private orientationChanges: OrientationChangeEvent[] = [];
  private gestureAttempts: GestureAttempt[] = [];
  private formInteractions: MobileFormInteraction[] = [];
  private performanceMarks: PerformanceMark[] = [];
  private isInitialized = false;
  private touchStartTimes: Map<number, number> = new Map();
  private scrollPerformanceTimer: NodeJS.Timeout | null = null;
  private gestureDetectionEnabled = true;

  constructor() {
    this.deviceInfo = this.detectMobileDevice();
    this.metrics = this.initializeMetrics();
  }

  // Initialize mobile experience tracking
  initialize(): void {
    if (this.isInitialized || !this.deviceInfo.isMobile) return;

    try {
      this.initializeTouchTracking();
      this.initializeScrollTracking();
      this.initializeOrientationTracking();
      this.initializeViewportTracking();
      this.initializeFormTracking();
      this.initializePerformanceTracking();
      this.initializeGestureTracking();
      this.initializeNetworkTracking();
      this.initializeDeviceCompatibilityTracking();
      this.initializeMobileAccessibilityTracking();

      this.isInitialized = true;
      console.log('[Mobile Experience] Mobile experience tracking initialized');

      // Run initial mobile assessment
      this.runMobileAssessment();
    } catch (error) {
      console.warn('[Mobile Experience] Failed to initialize:', error);
    }
  }

  // Detect mobile device capabilities
  private detectMobileDevice(): MobileDeviceInfo {
    const userAgent = navigator.userAgent.toLowerCase();
    const isMobile = /iphone|ipod|android.*mobile|windows phone/i.test(userAgent);
    const isTablet = /ipad|android(?!.*mobile)|tablet/i.test(userAgent);
    const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

    const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;

    return {
      isMobile: isMobile || isTablet,
      isTablet: isTablet,
      isTouchDevice: isTouchDevice,
      deviceType: isTablet ? 'tablet' : (isMobile ? 'phone' : 'desktop'),
      devicePixelRatio: window.devicePixelRatio || 1,
      screenWidth: screen.width,
      screenHeight: screen.height,
      viewportWidth: window.innerWidth,
      viewportHeight: window.innerHeight,
      orientation: this.getOrientation(),
      connectionType: connection?.type || 'unknown',
      effectiveConnectionType: connection?.effectiveType || 'unknown',
      deviceMemory: (navigator as any).deviceMemory,
      hardwareConcurrency: navigator.hardwareConcurrency,
      maxTouchPoints: navigator.maxTouchPoints || 0,
      supportsPassiveEvents: this.supportsPassiveEvents(),
      supportsTouchActions: 'touchAction' in document.documentElement.style
    };
  }

  // Get current orientation
  private getOrientation(): 'portrait' | 'landscape' {
    return window.innerHeight > window.innerWidth ? 'portrait' : 'landscape';
  }

  // Check passive event support
  private supportsPassiveEvents(): boolean {
    let passiveSupported = false;

    try {
      const options = Object.defineProperty({}, 'passive', {
        get: () => {
          passiveSupported = true;
          return false;
        }
      });

      window.addEventListener('test', null as any, options);
      window.removeEventListener('test', null as any, options);
    } catch (err) {
      // Ignore
    }

    return passiveSupported;
  }

  // Initialize metrics
  private initializeMetrics(): MobileUXMetrics {
    return {
      touchResponsiveness: 0,
      scrollPerformance: 0,
      zoomInteractionSuccess: 0,
      viewportUtilization: 0,
      tapTargetAccessibility: 0,
      gestureRecognitionSuccess: 0,
      orientationChangeHandling: 0,
      virtualKeyboardInteraction: 0,
      mobileFormUsability: 0,
      deviceCompatibilityScore: 0
    };
  }

  // Initialize touch tracking
  private initializeTouchTracking(): void {
    let touchStartTime = 0;
    let touchStartPosition = { x: 0, y: 0 };

    // Touch start
    document.addEventListener('touchstart', (event) => {
      const touch = event.touches[0];
      if (touch) {
        touchStartTime = performance.now();
        touchStartPosition = { x: touch.clientX, y: touch.clientY };

        // Track touch start time for each touch point
        for (let i = 0; i < event.changedTouches.length; i++) {
          this.touchStartTimes.set(event.changedTouches[i].identifier, performance.now());
        }

        this.touchEvents.push({
          type: MobileInteractionType.TAP,
          startTime: touchStartTime,
          position: touchStartPosition,
          target: event.target as Element,
          timestamp: Date.now()
        });
      }
    }, { passive: true });

    // Touch end
    document.addEventListener('touchend', (event) => {
      const touch = event.changedTouches[0];
      if (touch && this.touchStartTimes.has(touch.identifier)) {
        const touchEndTime = performance.now();
        const touchStartTime = this.touchStartTimes.get(touch.identifier)!;
        const touchDuration = touchEndTime - touchStartTime;

        // Analyze touch interaction
        this.analyzeTouchInteraction(touch, touchDuration, touchStartTime);

        // Clean up touch start time
        this.touchStartTimes.delete(touch.identifier);
      }
    }, { passive: true });

    // Touch move (for gesture detection)
    document.addEventListener('touchmove', (event) => {
      if (this.gestureDetectionEnabled && event.touches.length === 2) {
        this.detectMultiTouchGesture(event);
      }
    }, { passive: true });
  }

  // Analyze touch interaction
  private analyzeTouchInteraction(touch: Touch, duration: number, startTime: number): void {
    const touchData = {
      timestamp: Date.now(),
      duration: duration,
      position: { x: touch.clientX, y: touch.clientY },
      target: document.elementFromPoint(touch.clientX, touch.clientY),
      pageType: this.getPageType(),
      viewportSize: { width: this.deviceInfo.viewportWidth, height: this.deviceInfo.viewportHeight }
    };

    trackRUMEvent('mobile-touch-interaction', touchData);

    // Check touch responsiveness
    if (duration > 300) {
      this.reportMobileIssue({
        category: MobileIssueCategory.TOUCH_RESPONSIVENESS,
        severity: 'medium',
        description: `Slow touch response: ${duration}ms`,
        element: touch.target as Element,
        context: { duration, position: touchData.position }
      });
    }

    // Update touch responsiveness metric
    this.metrics.touchResponsiveness = this.calculateTouchResponsiveness();

    // Check if touch hit valid target
    this.validateTouchTarget(touch, touchData);
  }

  // Validate touch target
  private validateTouchTarget(touch: Touch, touchData: any): void {
    const target = touchData.target;
    if (!target) return;

    const rect = target.getBoundingClientRect();
    const minTargetSize = 44; // 44px minimum recommended size
    const targetSize = Math.min(rect.width, rect.height);

    const targetValidation = {
      timestamp: Date.now(),
      targetSize: targetSize,
      meetsMinimumSize: targetSize >= minTargetSize,
      targetPosition: { x: rect.left, y: rect.top },
      touchPosition: touchData.position,
      targetType: target.tagName,
      isInteractive: this.isInteractiveElement(target),
      pageType: this.getPageType()
    };

    trackRUMEvent('mobile-target-validation', targetValidation);

    // Report tap target size issues
    if (!targetValidation.meetsMinimumSize && targetValidation.isInteractive) {
      this.reportMobileIssue({
        category: MobileIssueCategory.TAP_TARGET_SIZE,
        severity: 'high',
        description: `Tap target too small: ${targetSize.toFixed(0)}px (minimum: ${minTargetSize}px)`,
        element: target,
        context: targetValidation
      });
    }

    // Update tap target accessibility metric
    this.metrics.tapTargetAccessibility = this.calculateTapTargetAccessibility();
  }

  // Check if element is interactive
  private isInteractiveElement(element: Element): boolean {
    const tagName = element.tagName.toLowerCase();
    const interactiveTags = ['a', 'button', 'input', 'select', 'textarea', 'details', 'summary'];

    return interactiveTags.includes(tagName) ||
           element.hasAttribute('onclick') ||
           element.hasAttribute('role') ||
           element.getAttribute('tabindex') === '0';
  }

  // Initialize scroll tracking
  private initializeScrollTracking(): void {
    let scrollStartTime = 0;
    let scrollStartY = 0;
    let scrollVelocity = 0;
    let lastScrollY = 0;
    let lastScrollTime = 0;

    const handleScrollStart = () => {
      scrollStartTime = performance.now();
      scrollStartY = window.pageYOffset;
      lastScrollY = scrollStartY;
      lastScrollTime = scrollStartTime;
    };

    const handleScroll = () => {
      const currentTime = performance.now();
      const currentY = window.pageYOffset;

      // Calculate scroll velocity
      if (lastScrollTime > 0) {
        const deltaY = currentY - lastScrollY;
        const deltaTime = currentTime - lastScrollTime;
        scrollVelocity = Math.abs(deltaY / deltaTime);
      }

      lastScrollY = currentY;
      lastScrollTime = currentTime;

      // Clear existing timer
      if (this.scrollPerformanceTimer) {
        clearTimeout(this.scrollPerformanceTimer);
      }

      // Set timer to detect scroll end
      this.scrollPerformanceTimer = setTimeout(() => {
        this.analyzeScrollPerformance(scrollStartTime, scrollStartY, currentY);
      }, 150);
    };

    document.addEventListener('scroll', handleScroll, { passive: true });
    document.addEventListener('touchstart', handleScrollStart, { passive: true });
  }

  // Analyze scroll performance
  private analyzeScrollPerformance(startTime: number, startY: number, endY: number): void {
    const duration = performance.now() - startTime;
    const distance = Math.abs(endY - startY);
    const velocity = distance / duration;

    const scrollData = {
      timestamp: Date.now(),
      duration: duration,
      distance: distance,
      velocity: velocity,
      startPosition: startY,
      endPosition: endY,
      pageHeight: document.body.scrollHeight,
      viewportHeight: this.deviceInfo.viewportHeight,
      pageType: this.getPageType()
    };

    trackRUMEvent('mobile-scroll-performance', scrollData);

    // Check for scroll performance issues
    if (duration > 1000 && distance > 100) {
      this.reportMobileIssue({
        category: MobileIssueCategory.SCROLL_PERFORMANCE,
        severity: 'medium',
        description: `Slow scroll detected: ${duration.toFixed(0)}ms for ${distance.toFixed(0)}px`,
        element: document.body,
        context: scrollData
      });
    }

    // Update scroll performance metric
    this.metrics.scrollPerformance = this.calculateScrollPerformance();

    // Store scroll event
    this.scrollEvents.push({
      type: MobileInteractionType.SCROLL,
      startTime: startTime,
      duration: duration,
      distance: distance,
      timestamp: Date.now()
    });
  }

  // Initialize orientation tracking
  private initializeOrientationTracking(): void {
    const handleOrientationChange = () => {
      const orientationChangeStart = performance.now();
      const oldOrientation = this.deviceInfo.orientation;
      const newOrientation = this.getOrientation();

      // Update device info
      this.deviceInfo.orientation = newOrientation;
      this.deviceInfo.viewportWidth = window.innerWidth;
      this.deviceInfo.viewportHeight = window.innerHeight;

      // Wait for orientation change to complete
      setTimeout(() => {
        const orientationChangeDuration = performance.now() - orientationChangeStart;

        const orientationData = {
          timestamp: Date.now(),
          oldOrientation: oldOrientation,
          newOrientation: newOrientation,
          duration: orientationChangeDuration,
          oldViewport: { width: oldOrientation === 'portrait' ? this.deviceInfo.screenHeight : this.deviceInfo.screenWidth,
                        height: oldOrientation === 'portrait' ? this.deviceInfo.screenWidth : this.deviceInfo.screenHeight },
          newViewport: { width: window.innerWidth, height: window.innerHeight },
          pageType: this.getPageType()
        };

        trackRUMEvent('mobile-orientation-change', orientationData);

        // Check orientation change handling
        if (orientationChangeDuration > 1000) {
          this.reportMobileIssue({
            category: MobileIssueCategory.ORIENTATION_HANDLING,
            severity: 'medium',
            description: `Slow orientation change: ${orientationChangeDuration.toFixed(0)}ms`,
            element: document.body,
            context: orientationData
          });
        }

        // Update orientation change handling metric
        this.metrics.orientationChangeHandling = this.calculateOrientationHandling();

        // Store orientation change
        this.orientationChanges.push({
          timestamp: Date.now(),
          oldOrientation: oldOrientation,
          newOrientation: newOrientation,
          duration: orientationChangeDuration
        });
      }, 500);
    };

    window.addEventListener('orientationchange', handleOrientationChange);
    window.addEventListener('resize', handleOrientationChange);
  }

  // Initialize viewport tracking
  private initializeViewportTracking(): void {
    // Track viewport utilization
    const analyzeViewportUtilization = () => {
      const viewportData = {
        timestamp: Date.now(),
        viewportWidth: this.deviceInfo.viewportWidth,
        viewportHeight: this.deviceInfo.viewportHeight,
        screenWidth: this.deviceInfo.screenWidth,
        screenHeight: this.deviceInfo.screenHeight,
        devicePixelRatio: this.deviceInfo.devicePixelRatio,
        pageWidth: document.body.scrollWidth,
        pageHeight: document.body.scrollHeight,
        utilizationRatio: this.calculateViewportUtilization(),
        isOptimizedForMobile: this.isMobileOptimized(),
        pageType: this.getPageType()
      };

      trackRUMEvent('mobile-viewport-analysis', viewportData);

      // Update viewport utilization metric
      this.metrics.viewportUtilization = viewportData.utilizationRatio;

      // Check for viewport issues
      if (!viewportData.isOptimizedForMobile) {
        this.reportMobileIssue({
          category: MobileIssueCategory.VIEWPORT_ADAPTATION,
          severity: 'high',
          description: 'Page not optimized for mobile viewport',
          element: document.head,
          context: viewportData
        });
      }
    };

    // Analyze viewport on load and resize
    if (document.readyState === 'complete') {
      analyzeViewportUtilization();
    } else {
      window.addEventListener('load', analyzeViewportUtilization);
    }

    window.addEventListener('resize', () => {
      clearTimeout((window as any).viewportTimer);
      (window as any).viewportTimer = setTimeout(analyzeViewportUtilization, 500);
    });
  }

  // Calculate viewport utilization
  private calculateViewportUtilization(): number {
    const contentArea = document.body.scrollWidth * document.body.scrollHeight;
    const viewportArea = this.deviceInfo.viewportWidth * this.deviceInfo.viewportHeight;

    return contentArea > 0 ? Math.min(1, viewportArea / contentArea) : 0;
  }

  // Check if mobile optimized
  private isMobileOptimized(): boolean {
    const viewport = document.querySelector('meta[name="viewport"]');
    if (!viewport) return false;

    const content = viewport.getAttribute('content');
    return content?.includes('width=device-width') || content?.includes('initial-scale=1');
  }

  // Initialize form tracking
  private initializeFormTracking(): void {
    // Track virtual keyboard interactions
    this.trackVirtualKeyboard();

    // Track mobile form usability
    this.trackMobileFormUsability();

    // Monitor form field interactions
    const inputs = document.querySelectorAll('input, select, textarea');

    inputs.forEach(input => {
      input.addEventListener('focus', () => {
        this.trackFormFieldFocus(input);
      });

      input.addEventListener('blur', () => {
        this.trackFormFieldBlur(input);
      });
    });
  }

  // Track virtual keyboard
  private trackVirtualKeyboard(): void {
    let initialViewportHeight = window.innerHeight;

    const handleKeyboardToggle = () => {
      const currentViewportHeight = window.innerHeight;
      const heightDifference = initialViewportHeight - currentViewportHeight;

      if (Math.abs(heightDifference) > 150) { // Keyboard typically takes 150px+
        const keyboardData = {
          timestamp: Date.now(),
          isKeyboardOpen: heightDifference > 0,
          heightDifference: Math.abs(heightDifference),
          viewportBefore: initialViewportHeight,
          viewportAfter: currentViewportHeight,
          pageType: this.getPageType()
        };

        trackRUMEvent('mobile-virtual-keyboard', keyboardData);

        // Update virtual keyboard interaction metric
        this.metrics.virtualKeyboardInteraction = this.calculateVirtualKeyboardInteraction();
      }

      initialViewportHeight = currentViewportHeight;
    };

    window.addEventListener('resize', handleKeyboardToggle);
  }

  // Track mobile form usability
  private trackMobileFormUsability(): void {
    const forms = document.querySelectorAll('form');

    forms.forEach(form => {
      // Check form optimization for mobile
      const isMobileOptimized = this.isFormMobileOptimized(form);

      const formData = {
        timestamp: Date.now(),
        formId: form.id,
        isMobileOptimized: isMobileOptimized,
        inputCount: form.querySelectorAll('input, select, textarea').length,
        hasLargeTouchTargets: this.hasLargeTouchTargets(form),
        hasProperInputTypes: this.hasProperInputTypes(form),
        hasAutoComplete: this.hasAutoComplete(form),
        pageType: this.getPageType()
      };

      trackRUMEvent('mobile-form-analysis', formData);

      if (!isMobileOptimized) {
        this.reportMobileIssue({
          category: MobileIssueCategory.MOBILE_ACCESSIBILITY,
          severity: 'medium',
          description: 'Form not optimized for mobile devices',
          element: form,
          context: formData
        });
      }
    });
  }

  // Check if form is mobile optimized
  private isFormMobileOptimized(form: HTMLFormElement): boolean {
    const hasLargeTargets = this.hasLargeTouchTargets(form);
    const hasProperTypes = this.hasProperInputTypes(form);
    const hasAutoComplete = this.hasAutoComplete(form);

    return hasLargeTargets && hasProperTypes && hasAutoComplete;
  }

  // Check for large touch targets
  private hasLargeTouchTargets(form: HTMLFormElement): boolean {
    const inputs = form.querySelectorAll('input, select, textarea, button');
    let allTargetsLarge = true;

    inputs.forEach(input => {
      const rect = input.getBoundingClientRect();
      const minSize = 44; // 44px minimum

      if (rect.width < minSize || rect.height < minSize) {
        allTargetsLarge = false;
      }
    });

    return allTargetsLarge;
  }

  // Check for proper input types
  private hasProperInputTypes(form: HTMLFormElement): boolean {
    const emailInputs = form.querySelectorAll('input[type="email"]');
    const telInputs = form.querySelectorAll('input[type="tel"]');
    const numberInputs = form.querySelectorAll('input[type="number"]');
    const dateInputs = form.querySelectorAll('input[type="date"]');

    return emailInputs.length > 0 || telInputs.length > 0 ||
           numberInputs.length > 0 || dateInputs.length > 0;
  }

  // Check for autocomplete
  private hasAutoComplete(form: HTMLFormElement): boolean {
    const inputs = form.querySelectorAll('input[autocomplete]');
    return inputs.length > 0;
  }

  // Track form field focus
  private trackFormFieldFocus(input: Element): void {
    const focusData = {
      timestamp: Date.now(),
      inputType: input.tagName,
      inputId: input.id,
      hasMobileOptimizedType: this.hasMobileOptimizedInputType(input),
      viewportHeight: window.innerHeight,
      pageType: this.getPageType()
    };

    trackRUMEvent('mobile-form-field-focus', focusData);

    // Store form interaction
    this.formInteractions.push({
      input: input,
      focusTime: Date.now(),
      blurTime: 0,
      duration: 0,
      timestamp: Date.now()
    });
  }

  // Track form field blur
  private trackFormFieldBlur(input: Element): void {
    const interaction = this.formInteractions.find(i => i.input === input && i.blurTime === 0);
    if (interaction) {
      interaction.blurTime = Date.now();
      interaction.duration = interaction.blurTime - interaction.focusTime;

      const blurData = {
        timestamp: Date.now(),
        inputType: input.tagName,
        inputId: input.id,
        focusDuration: interaction.duration,
        pageType: this.getPageType()
      };

      trackRUMEvent('mobile-form-field-blur', blurData);

      // Update mobile form usability metric
      this.metrics.mobileFormUsability = this.calculateMobileFormUsability();
    }
  }

  // Check if input has mobile optimized type
  private hasMobileOptimizedInputType(input: Element): boolean {
    if (input.tagName.toLowerCase() !== 'input') return true;

    const inputType = (input as HTMLInputElement).type;
    const mobileOptimizedTypes = ['email', 'tel', 'url', 'number', 'date', 'time', 'month', 'week'];

    return mobileOptimizedTypes.includes(inputType);
  }

  // Initialize performance tracking
  private initializePerformanceTracking(): void {
    // Track mobile-specific performance metrics
    this.trackMobilePerformance();

    // Monitor frame rate
    this.trackFrameRate();

    // Track memory usage on mobile
    this.trackMobileMemory();
  }

  // Track mobile performance
  private trackMobilePerformance(): void {
    // Monitor long tasks on mobile
    if ('PerformanceObserver' in window) {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();

        entries.forEach(entry => {
          if (entry.entryType === 'longtask' && entry.duration > 100) {
            const performanceData = {
              timestamp: Date.now(),
              taskDuration: entry.duration,
              taskName: entry.name,
              deviceInfo: this.deviceInfo,
              pageType: this.getPageType()
            };

            trackRUMEvent('mobile-performance-issue', performanceData);

            // Report performance issues
            if (entry.duration > 300) {
              this.reportMobileIssue({
                category: MobileIssueCategory.MOBILE_PERFORMANCE,
                severity: 'high',
                description: `Extremely long task on mobile: ${entry.duration.toFixed(0)}ms`,
                element: document.body,
                context: performanceData
              });
            }
          }
        });
      });

      observer.observe({ entryTypes: ['longtask'] });
    }
  }

  // Track frame rate
  private trackFrameRate(): void {
    let frameCount = 0;
    let lastTime = performance.now();

    const countFrame = () => {
      frameCount++;
      const currentTime = performance.now();

      if (currentTime >= lastTime + 1000) {
        const fps = Math.round((frameCount * 1000) / (currentTime - lastTime));

        const frameRateData = {
          timestamp: Date.now(),
          fps: fps,
          deviceInfo: this.deviceInfo,
          pageType: this.getPageType()
        };

        trackRUMEvent('mobile-frame-rate', frameRateData);

        // Report low frame rates
        if (fps < 30) {
          this.reportMobileIssue({
            category: MobileIssueCategory.MOBILE_PERFORMANCE,
            severity: 'medium',
            description: `Low frame rate on mobile: ${fps}fps`,
            element: document.body,
            context: frameRateData
          });
        }

        frameCount = 0;
        lastTime = currentTime;
      }

      requestAnimationFrame(countFrame);
    };

    requestAnimationFrame(countFrame);
  }

  // Track mobile memory
  private trackMobileMemory(): void {
    if ('memory' in performance) {
      const memory = (performance as any).memory;

      const memoryData = {
        timestamp: Date.now(),
        usedJSHeapSize: memory.usedJSHeapSize,
        totalJSHeapSize: memory.totalJSHeapSize,
        jsHeapSizeLimit: memory.jsHeapSizeLimit,
        deviceInfo: this.deviceInfo,
        pageType: this.getPageType()
      };

      trackRUMEvent('mobile-memory-usage', memoryData);

      // Check for memory issues on mobile
      const memoryUsageRatio = memory.usedJSHeapSize / memory.jsHeapSizeLimit;
      if (memoryUsageRatio > 0.8) {
        this.reportMobileIssue({
          category: MobileIssueCategory.MOBILE_PERFORMANCE,
          severity: 'high',
          description: `High memory usage on mobile: ${(memoryUsageRatio * 100).toFixed(1)}%`,
          element: document.body,
          context: memoryData
        });
      }
    }
  }

  // Initialize gesture tracking
  private initializeGestureTracking(): void {
    // This is already partially implemented in touch tracking
    // Additional gesture-specific tracking can be added here
  }

  // Detect multi-touch gestures
  private detectMultiTouchGesture(event: TouchEvent): void {
    if (event.touches.length !== 2) return;

    const touch1 = event.touches[0];
    const touch2 = event.touches[1];

    const distance = Math.sqrt(
      Math.pow(touch2.clientX - touch1.clientX, 2) +
      Math.pow(touch2.clientY - touch1.clientY, 2)
    );

    const gestureData = {
      timestamp: Date.now(),
      gestureType: 'pinch',
      distance: distance,
      centerPoint: {
        x: (touch1.clientX + touch2.clientX) / 2,
        y: (touch1.clientY + touch2.clientY) / 2
      },
      pageType: this.getPageType()
    };

    trackRUMEvent('mobile-gesture-detected', gestureData);

    // Store gesture attempt
    this.gestureAttempts.push({
      type: MobileInteractionType.PINCH,
      timestamp: Date.now(),
      successful: true,
      context: gestureData
    });

    // Update gesture recognition success metric
    this.metrics.gestureRecognitionSuccess = this.calculateGestureSuccess();
  }

  // Initialize network tracking
  private initializeNetworkTracking(): void {
    // Monitor network changes affecting mobile experience
    const connection = (navigator as any).connection;

    if (connection) {
      const handleNetworkChange = () => {
        const networkData = {
          timestamp: Date.now(),
          effectiveType: connection.effectiveType,
          downlink: connection.downlink,
          rtt: connection.rtt,
          saveData: connection.saveData,
          deviceInfo: this.deviceInfo
        };

        trackRUMEvent('mobile-network-change', networkData);
      };

      connection.addEventListener('change', handleNetworkChange);
    }
  }

  // Initialize device compatibility tracking
  private initializeDeviceCompatibilityTracking(): void {
    // Check for device-specific compatibility issues
    const compatibilityData = {
      timestamp: Date.now(),
      userAgent: navigator.userAgent,
      deviceInfo: this.deviceInfo,
      featuresSupported: {
        touchEvents: 'ontouchstart' in window,
        passiveEvents: this.deviceInfo.supportsPassiveEvents,
        touchActions: this.deviceInfo.supportsTouchActions,
        webgl: this.checkWebGLSupport(),
        webWorkers: typeof Worker !== 'undefined',
        localStorage: typeof Storage !== 'undefined',
        sessionStorage: typeof sessionStorage !== 'undefined'
      },
      issues: this.detectDeviceCompatibilityIssues()
    };

    trackRUMEvent('mobile-device-compatibility', compatibilityData);

    // Update device compatibility score
    this.metrics.deviceCompatibilityScore = this.calculateDeviceCompatibility(compatibilityData);

    // Report compatibility issues
    compatibilityData.issues.forEach(issue => {
      this.reportMobileIssue({
        category: MobileIssueCategory.DEVICE_COMPATIBILITY,
        severity: issue.severity,
        description: issue.description,
        element: document.body,
        context: { deviceInfo: this.deviceInfo, issue: issue }
      });
    });
  }

  // Check WebGL support
  private checkWebGLSupport(): boolean {
    try {
      const canvas = document.createElement('canvas');
      return !!(window.WebGLRenderingContext &&
        (canvas.getContext('webgl') || canvas.getContext('experimental-webgl')));
    } catch (e) {
      return false;
    }
  }

  // Detect device compatibility issues
  private detectDeviceCompatibilityIssues(): Array<{ description: string; severity: string }> {
    const issues: Array<{ description: string; severity: string }> = [];

    // Check for old iOS versions
    const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    if (iOS) {
      const iOSVersion = parseFloat(
        (/CPU.*OS ([0-9_]{1,5})|(CPU like).*AppleWebKit.*Mobile/i.exec(navigator.userAgent) || [0, ''])[1]
        .replace('undefined', '3_2')
        .replace('_', '.')
        .replace('_', '')
      ) || 0;

      if (iOSVersion < 12) {
        issues.push({
          description: `Old iOS version detected: ${iOSVersion}`,
          severity: 'medium'
        });
      }
    }

    // Check for old Android versions
    const androidVersion = parseFloat((/Android (\d+\.?\d*)/.exec(navigator.userAgent) || [])[1]);
    if (androidVersion && androidVersion < 7) {
      issues.push({
        description: `Old Android version detected: ${androidVersion}`,
        severity: 'medium'
      });
    }

    // Check for low memory devices
    if (this.deviceInfo.deviceMemory && this.deviceInfo.deviceMemory < 2) {
      issues.push({
        description: `Low memory device detected: ${this.deviceInfo.deviceMemory}GB`,
        severity: 'low'
      });
    }

    return issues;
  }

  // Initialize mobile accessibility tracking
  private initializeMobileAccessibilityTracking(): void {
    // Check mobile-specific accessibility features
    this.checkMobileAccessibilityFeatures();
  }

  // Check mobile accessibility features
  private checkMobileAccessibilityFeatures(): void {
    const accessibilityData = {
      timestamp: Date.now(),
      viewportMeta: !!document.querySelector('meta[name="viewport"]'),
      properTextScaling: this.checkTextScaling(),
      sufficientTouchTargets: this.checkTouchTargetAccessibility(),
      properFormLabels: this.checkMobileFormLabels(),
      readableFontSizes: this.checkFontSizes(),
      highContrastSupport: this.checkHighContrastSupport(),
      pageType: this.getPageType()
    };

    trackRUMEvent('mobile-accessibility-check', accessibilityData);

    // Report accessibility issues
    if (!accessibilityData.properTextScaling) {
      this.reportMobileIssue({
        category: MobileIssueCategory.MOBILE_ACCESSIBILITY,
        severity: 'high',
        description: 'Text not properly scalable on mobile',
        element: document.head,
        context: accessibilityData
      });
    }

    if (!accessibilityData.sufficientTouchTargets) {
      this.reportMobileIssue({
        category: MobileIssueCategory.MOBILE_ACCESSIBILITY,
        severity: 'high',
        description: 'Insufficient touch targets for accessibility',
        element: document.body,
        context: accessibilityData
      });
    }
  }

  // Check text scaling
  private checkTextScaling(): boolean {
    const viewport = document.querySelector('meta[name="viewport"]');
    if (!viewport) return false;

    const content = viewport.getAttribute('content');
    return !content?.includes('maximum-scale') && !content?.includes('user-scalable=no');
  }

  // Check touch target accessibility
  private checkTouchTargetAccessibility(): boolean {
    const interactiveElements = document.querySelectorAll('a, button, input, select, textarea');
    let accessibleTargets = 0;

    interactiveElements.forEach(element => {
      const rect = element.getBoundingClientRect();
      if (rect.width >= 44 && rect.height >= 44) {
        accessibleTargets++;
      }
    });

    return interactiveElements.length > 0 && (accessibleTargets / interactiveElements.length) > 0.8;
  }

  // Check mobile form labels
  private checkMobileFormLabels(): boolean {
    const inputs = document.querySelectorAll('input, select, textarea');
    let labeledInputs = 0;

    inputs.forEach(input => {
      const hasLabel = !!document.querySelector(`label[for="${input.id}"]`) ||
                      input.hasAttribute('aria-label') ||
                      input.hasAttribute('aria-labelledby') ||
                      !!input.closest('label');

      if (hasLabel) labeledInputs++;
    });

    return inputs.length > 0 && (labeledInputs / inputs.length) > 0.9;
  }

  // Check font sizes
  private checkFontSizes(): boolean {
    const textElements = document.querySelectorAll('p, span, div, td, th');
    let readableElements = 0;

    textElements.forEach(element => {
      const styles = window.getComputedStyle(element);
      const fontSize = parseFloat(styles.fontSize);

      if (fontSize >= 14) { // 14px minimum readable size
        readableElements++;
      }
    });

    return textElements.length > 0 && (readableElements / textElements.length) > 0.8;
  }

  // Check high contrast support
  private checkHighContrastSupport(): boolean {
    // Check for media query support
    if (window.matchMedia) {
      const highContrastQuery = window.matchMedia('(prefers-contrast: high)');
      return highContrastQuery.media !== 'not all';
    }

    return false;
  }

  // Run mobile assessment
  private runMobileAssessment(): void {
    console.log('[Mobile Experience] Running mobile experience assessment');

    const assessmentData = {
      timestamp: Date.now(),
      deviceInfo: this.deviceInfo,
      metrics: this.metrics,
      touchEventsCount: this.touchEvents.length,
      scrollEventsCount: this.scrollEvents.length,
      orientationChangesCount: this.orientationChanges.length,
      gestureAttemptsCount: this.gestureAttempts.length,
      formInteractionsCount: this.formInteractions.length,
      overallScore: this.calculateOverallMobileScore(),
      pageType: this.getPageType()
    };

    trackRUMEvent('mobile-experience-assessment', assessmentData);

    // Report overall mobile experience
    if (assessmentData.overallScore < 70) {
      reportMessage(`Poor mobile experience detected: score ${assessmentData.overallScore}`, 'warning', assessmentData);
    }
  }

  // Calculate metrics

  private calculateTouchResponsiveness(): number {
    if (this.touchEvents.length === 0) return 100;

    const avgResponseTime = this.touchEvents.reduce((sum, event) => {
      return sum + (event.duration || 0);
    }, 0) / this.touchEvents.length;

    // Score based on response time (lower is better)
    if (avgResponseTime < 100) return 100;
    if (avgResponseTime < 200) return 80;
    if (avgResponseTime < 300) return 60;
    return 40;
  }

  private calculateScrollPerformance(): number {
    if (this.scrollEvents.length === 0) return 100;

    const avgVelocity = this.scrollEvents.reduce((sum, event) => {
      return sum + (event.distance / event.duration);
    }, 0) / this.scrollEvents.length;

    // Score based on scroll velocity
    if (avgVelocity > 1) return 100;
    if (avgVelocity > 0.5) return 80;
    if (avgVelocity > 0.25) return 60;
    return 40;
  }

  private calculateTapTargetAccessibility(): number {
    const interactiveElements = document.querySelectorAll('a, button, input, select, textarea');
    if (interactiveElements.length === 0) return 100;

    let accessibleTargets = 0;
    interactiveElements.forEach(element => {
      const rect = element.getBoundingClientRect();
      if (rect.width >= 44 && rect.height >= 44) {
        accessibleTargets++;
      }
    });

    return (accessibleTargets / interactiveElements.length) * 100;
  }

  private calculateOrientationHandling(): number {
    if (this.orientationChanges.length === 0) return 100;

    const avgChangeTime = this.orientationChanges.reduce((sum, change) => {
      return sum + change.duration;
    }, 0) / this.orientationChanges.length;

    // Score based on orientation change time
    if (avgChangeTime < 500) return 100;
    if (avgChangeTime < 1000) return 80;
    if (avgChangeTime < 1500) return 60;
    return 40;
  }

  private calculateVirtualKeyboardInteraction(): number {
    // Score based on form optimization for mobile
    const forms = document.querySelectorAll('form');
    if (forms.length === 0) return 100;

    let optimizedForms = 0;
    forms.forEach(form => {
      if (this.isFormMobileOptimized(form)) {
        optimizedForms++;
      }
    });

    return (optimizedForms / forms.length) * 100;
  }

  private calculateMobileFormUsability(): number {
    if (this.formInteractions.length === 0) return 100;

    // Score based on form interaction patterns
    const avgInteractionTime = this.formInteractions.reduce((sum, interaction) => {
      return sum + interaction.duration;
    }, 0) / this.formInteractions.length;

    // Consider both time and completion
    let score = 100;
    if (avgInteractionTime > 10000) score -= 20; // Very slow interactions
    if (avgInteractionTime > 5000) score -= 10; // Slow interactions

    return Math.max(0, score);
  }

  private calculateGestureSuccess(): number {
    if (this.gestureAttempts.length === 0) return 100;

    const successfulGestures = this.gestureAttempts.filter(gesture => gesture.successful).length;
    return (successfulGestures / this.gestureAttempts.length) * 100;
  }

  private calculateDeviceCompatibility(compatibilityData: any): number {
    const supportedFeatures = Object.values(compatibilityData.featuresSupported).filter(Boolean).length;
    const totalFeatures = Object.keys(compatibilityData.featuresSupported).length;
    const issuesCount = compatibilityData.issues.length;

    let score = (supportedFeatures / totalFeatures) * 100;
    score -= issuesCount * 10; // Deduct points for compatibility issues

    return Math.max(0, Math.min(100, score));
  }

  private calculateOverallMobileScore(): number {
    const weights = {
      touchResponsiveness: 0.2,
      scrollPerformance: 0.15,
      tapTargetAccessibility: 0.2,
      orientationHandling: 0.1,
      virtualKeyboardInteraction: 0.15,
      mobileFormUsability: 0.1,
      gestureRecognitionSuccess: 0.05,
      deviceCompatibilityScore: 0.05
    };

    return Object.entries(weights).reduce((score, [metric, weight]) => {
      const value = this.metrics[metric as keyof MobileUXMetrics] || 0;
      return score + (value * weight);
    }, 0);
  }

  // Report mobile issue
  private reportMobileIssue(issueData: {
    category: MobileIssueCategory;
    severity: string;
    description: string;
    element: Element;
    context: any;
  }): void {
    const issue = {
      id: this.generateIssueId(),
      category: issueData.category,
      severity: issueData.severity,
      description: issueData.description,
      element: issueData.element,
      context: issueData.context,
      timestamp: Date.now(),
      pageType: this.getPageType(),
      deviceInfo: this.deviceInfo
    };

    trackRUMEvent('mobile-accessibility-issue', issue);

    if (issue.severity === 'high' || issue.severity === 'critical') {
      reportMessage(`Mobile UX issue: ${issue.description}`, 'warning', issue);
    }
  }

  // Helper methods

  private getPageType(): string {
    const path = window.location.pathname;
    if (path.includes('/booking')) return 'booking';
    if (path.includes('/beauty')) return 'beauty-services';
    if (path.includes('/fitness')) return 'fitness-services';
    if (path.includes('/admin')) return 'admin';
    if (path.includes('/blog')) return 'blog';
    if (path === '/') return 'landing';
    return 'other';
  }

  private generateIssueId(): string {
    return `mobile_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Public API methods

  // Get mobile experience analytics
  getMobileExperienceAnalytics(): any {
    return {
      deviceInfo: this.deviceInfo,
      metrics: this.metrics,
      overallScore: this.calculateOverallMobileScore(),
      touchEventsCount: this.touchEvents.length,
      scrollEventsCount: this.scrollEvents.length,
      orientationChangesCount: this.orientationChanges.length,
      gestureAttemptsCount: this.gestureAttempts.length,
      formInteractionsCount: this.formInteractions.length,
      pageType: this.getPageType()
    };
  }

  // Get detailed mobile report
  getMobileExperienceReport(): any {
    return {
      summary: this.getMobileExperienceAnalytics(),
      deviceAnalysis: {
        capabilities: this.deviceInfo,
        compatibilityScore: this.metrics.deviceCompatibilityScore,
        performanceScore: this.calculateOverallMobileScore(),
        accessibilityScore: this.calculateTapTargetAccessibility()
      },
      interactionAnalysis: {
        touchInteractions: this.touchEvents.slice(-20), // Last 20 interactions
        scrollPerformance: this.scrollEvents.slice(-10), // Last 10 scrolls
        orientationChanges: this.orientationChanges,
        gestureSuccess: this.gestureAttempts,
        formUsability: this.formInteractions
      },
      recommendations: this.generateMobileRecommendations()
    };
  }

  // Generate mobile recommendations
  private generateMobileRecommendations(): string[] {
    const recommendations: string[] = [];

    if (this.metrics.touchResponsiveness < 80) {
      recommendations.push('Optimize touch responsiveness for better mobile UX');
    }

    if (this.metrics.tapTargetAccessibility < 90) {
      recommendations.push('Increase tap target sizes to meet mobile accessibility standards');
    }

    if (this.metrics.scrollPerformance < 80) {
      recommendations.push('Optimize scroll performance for smoother mobile experience');
    }

    if (this.metrics.mobileFormUsability < 80) {
      recommendations.push('Improve mobile form usability with proper input types and autocomplete');
    }

    if (this.metrics.orientationChangeHandling < 80) {
      recommendations.push('Optimize orientation change handling for better mobile experience');
    }

    if (this.deviceInfo.effectiveConnectionType === 'slow-2g' || this.deviceInfo.effectiveConnectionType === '2g') {
      recommendations.push('Optimize for slow network connections on mobile devices');
    }

    return recommendations;
  }

  // Run manual mobile assessment
  runManualAssessment(): void {
    this.runMobileAssessment();
  }

  // Disconnect tracking
  disconnect(): void {
    if (this.scrollPerformanceTimer) {
      clearTimeout(this.scrollPerformanceTimer);
      this.scrollPerformanceTimer = null;
    }

    this.gestureDetectionEnabled = false;
  }
}

// Type definitions
interface TouchEvent {
  type: MobileInteractionType;
  startTime: number;
  position: { x: number; y: number };
  target: Element;
  timestamp: number;
  duration?: number;
}

interface ScrollEvent {
  type: MobileInteractionType;
  startTime: number;
  duration: number;
  distance: number;
  timestamp: number;
}

interface OrientationChangeEvent {
  timestamp: number;
  oldOrientation: 'portrait' | 'landscape';
  newOrientation: 'portrait' | 'landscape';
  duration: number;
}

interface GestureAttempt {
  type: MobileInteractionType;
  timestamp: number;
  successful: boolean;
  context: any;
}

interface MobileFormInteraction {
  input: Element;
  focusTime: number;
  blurTime: number;
  duration: number;
  timestamp: number;
}

interface PerformanceMark {
  name: string;
  timestamp: number;
  value?: number;
}

// Create and export singleton instance
export const mobileExperienceTracker = new MobileExperienceTracker();

// Initialize automatically on mobile devices
if (typeof window !== 'undefined') {
  if (document.readyState === 'complete') {
    mobileExperienceTracker.initialize();
  } else {
    window.addEventListener('load', () => {
      mobileExperienceTracker.initialize();
    });
  }
}

// Export helper functions
export const initializeMobileExperienceTracking = () => mobileExperienceTracker.initialize();
export const getMobileExperienceAnalytics = () => mobileExperienceTracker.getMobileExperienceAnalytics();
export const getMobileExperienceReport = () => mobileExperienceTracker.getMobileExperienceReport();
export const runMobileExperienceAssessment = () => mobileExperienceTracker.runManualAssessment();

// Export types
export { MobileDeviceInfo, MobileUXMetrics, MobileInteractionType, MobileIssueCategory };