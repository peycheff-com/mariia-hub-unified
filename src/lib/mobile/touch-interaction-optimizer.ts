/**
 * Touch Interaction Optimizer
 * Advanced touch and gesture optimization for mobile devices in the luxury beauty/fitness platform
 */

interface TouchDeviceInfo {
  hasTouch: boolean;
  maxTouchPoints: number;
  touchEventSupport: boolean;
  pointerEventSupport: boolean;
  gestureEventSupport: boolean;
  forceTouchSupport: boolean;
  deviceType: 'mobile' | 'tablet' | 'desktop';
  isIOS: boolean;
  isAndroid: boolean;
}

interface TouchMetrics {
  firstTouchDelay: number;
  averageTouchResponseTime: number;
  touchAccuracy: number;
  gestureRecognitionTime: number;
  scrollPerformance: number;
  tapResponseTime: number;
  swipeVelocity: number;
  pinchZoomAccuracy: number;
  multiTouchAccuracy: number;
  touchJank: number;
}

interface GestureConfig {
  enableTapOptimization: boolean;
  enableSwipeOptimization: boolean;
  enablePinchZoom: boolean;
  enableRotation: boolean;
  enableLongPress: boolean;
  enableDoubleTap: boolean;
  tapThreshold: number;
  swipeThreshold: number;
  pinchThreshold: number;
  longPressDelay: number;
  doubleTapDelay: number;
  maxTapDistance: number;
  swipeVelocityThreshold: number;
}

interface TouchOptimizationSettings {
  reduceTouchDelay: boolean;
  enableHapticFeedback: boolean;
  enableVisualFeedback: boolean;
  enableTouchPrediction: boolean;
  optimizeForSlowNetwork: boolean;
  enableGestureSmoothing: boolean;
  enableTouchCoalescing: boolean;
  adaptiveTouchSize: boolean;
  accessibilityMode: boolean;
  leftHandedMode: boolean;
}

interface TouchFeedback {
  haptic: boolean;
  visual: boolean;
  audio: boolean;
  duration: number;
  intensity: 'light' | 'medium' | 'strong';
  pattern: 'tap' | 'success' | 'error' | 'warning';
}

class TouchInteractionOptimizer {
  private static instance: TouchInteractionOptimizer;
  private deviceInfo: TouchDeviceInfo;
  private metrics: TouchMetrics;
  private gestureConfig: GestureConfig;
  private settings: TouchOptimizationSettings;
  private touchStartTimes: Map<number, number> = new Map();
  private touchPositions: Map<number, { x: number; y: number }> = new Map();
  private gestureState: Map<string, any> = new Map();
  private touchEventQueue: any[] = [];
  private rafId: number | null = null;
  private observers: Set<any> = new Set();

  private constructor() {
    this.detectTouchDevice();
    this.initializeMetrics();
    this.initializeGestureConfig();
    this.initializeSettings();
    this.setupTouchOptimizations();
  }

  static getInstance(): TouchInteractionOptimizer {
    if (!TouchInteractionOptimizer.instance) {
      TouchInteractionOptimizer.instance = new TouchInteractionOptimizer();
    }
    return TouchInteractionOptimizer.instance;
  }

  private detectTouchDevice(): void {
    const hasTouch = 'ontouchstart' in window;
    const maxTouchPoints = navigator.maxTouchPoints || 1;
    const touchEventSupport = 'TouchEvent' in window;
    const pointerEventSupport = 'PointerEvent' in window;
    const gestureEventSupport = 'GestureEvent' in window;
    const forceTouchSupport = 'force' in (navigator as any).webkitPointerEvent || false;

    const userAgent = navigator.userAgent;
    const isIOS = /iPhone|iPad|iPod/.test(userAgent);
    const isAndroid = /Android/.test(userAgent);

    let deviceType: 'mobile' | 'tablet' | 'desktop' = 'desktop';
    if (isIOS || isAndroid) {
      deviceType = /iPad|Tablet/.test(userAgent) ? 'tablet' : 'mobile';
    }

    this.deviceInfo = {
      hasTouch,
      maxTouchPoints,
      touchEventSupport,
      pointerEventSupport,
      gestureEventSupport,
      forceTouchSupport,
      deviceType,
      isIOS,
      isAndroid
    };

    console.log('📱 Touch device detected:', this.deviceInfo);
  }

  private initializeMetrics(): void {
    this.metrics = {
      firstTouchDelay: 0,
      averageTouchResponseTime: 0,
      touchAccuracy: 0,
      gestureRecognitionTime: 0,
      scrollPerformance: 0,
      tapResponseTime: 0,
      swipeVelocity: 0,
      pinchZoomAccuracy: 0,
      multiTouchAccuracy: 0,
      touchJank: 0
    };
  }

  private initializeGestureConfig(): void {
    const isMobile = this.deviceInfo.deviceType === 'mobile';
    const isTablet = this.deviceInfo.deviceType === 'tablet';

    this.gestureConfig = {
      enableTapOptimization: true,
      enableSwipeOptimization: true,
      enablePinchZoom: !isMobile, // Disable pinch zoom on small mobile devices
      enableRotation: false, // Disable rotation for beauty/fitness app
      enableLongPress: true,
      enableDoubleTap: true,
      tapThreshold: isMobile ? 10 : 15,
      swipeThreshold: isMobile ? 30 : 50,
      pinchThreshold: 20,
      longPressDelay: 500,
      doubleTapDelay: 300,
      maxTapDistance: isMobile ? 20 : 30,
      swipeVelocityThreshold: isMobile ? 0.3 : 0.5
    };

    console.log('👆 Gesture config initialized:', this.gestureConfig);
  }

  private initializeSettings(): void {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const prefersHighContrast = window.matchMedia('(prefers-contrast: high)').matches;

    this.settings = {
      reduceTouchDelay: true,
      enableHapticFeedback: this.deviceInfo.isIOS || this.deviceInfo.isAndroid,
      enableVisualFeedback: true,
      enableTouchPrediction: true,
      optimizeForSlowNetwork: false,
      enableGestureSmoothing: !prefersReducedMotion,
      enableTouchCoalescing: true,
      adaptiveTouchSize: true,
      accessibilityMode: prefersHighContrast,
      leftHandedMode: false
    };

    console.log('⚙️ Touch optimization settings:', this.settings);
  }

  private setupTouchOptimizations(): void {
    // Enable touch-action CSS properties
    this.enableTouchActions();

    // Optimize touch event listeners
    this.optimizeTouchListeners();

    // Setup touch feedback systems
    this.setupTouchFeedback();

    // Implement touch prediction
    this.setupTouchPrediction();

    // Setup gesture recognition
    this.setupGestureRecognition();

    // Optimize scrolling performance
    this.optimizeScrolling();

    // Setup accessibility enhancements
    this.setupAccessibilityEnhancements();
  }

  private enableTouchActions(): void {
    // Add touch-action CSS for better touch performance
    const style = document.createElement('style');
    style.textContent = `
      /* Touch optimizations */
      .touch-optimized {
        touch-action: manipulation;
        -webkit-tap-highlight-color: transparent;
        user-select: none;
        -webkit-user-select: none;
        -moz-user-select: none;
        -ms-user-select: none;
      }

      /* Optimized scrolling */
      .scroll-optimized {
        -webkit-overflow-scrolling: touch;
        scroll-behavior: smooth;
        overscroll-behavior: contain;
      }

      /* Reduced motion support */
      @media (prefers-reduced-motion: reduce) {
        .touch-optimized {
          transition: none !important;
          animation: none !important;
        }
      }

      /* High contrast mode support */
      @media (prefers-contrast: high) {
        .touch-optimized {
          border: 2px solid currentColor;
        }
      }

      /* Touch feedback animations */
      .touch-feedback {
        position: relative;
        overflow: hidden;
      }

      .touch-feedback::after {
        content: '';
        position: absolute;
        top: 50%;
        left: 50%;
        width: 0;
        height: 0;
        border-radius: 50%;
        background: rgba(255, 255, 255, 0.5);
        transform: translate(-50%, -50%);
        transition: width 0.3s ease, height 0.3s ease;
        pointer-events: none;
      }

      .touch-feedback.active::after {
        width: 100px;
        height: 100px;
        opacity: 0;
      }

      /* Adaptive touch targets */
      .adaptive-touch-target {
        min-width: 44px;
        min-height: 44px;
        padding: 12px;
      }

      @media (pointer: coarse) {
        .adaptive-touch-target {
          min-width: 48px;
          min-height: 48px;
          padding: 16px;
        }
      }
    `;
    document.head.appendChild(style);

    // Apply touch-optimized class to interactive elements
    this.applyTouchOptimizations();
  }

  private applyTouchOptimizations(): void {
    const interactiveElements = document.querySelectorAll('button, a, input, select, textarea, [role="button"], [role="link"]');

    interactiveElements.forEach(element => {
      element.classList.add('touch-optimized', 'adaptive-touch-target');
    });

    // Apply scroll optimization to scrollable containers
    const scrollableElements = document.querySelectorAll('.scrollable, [data-scrollable]');
    scrollableElements.forEach(element => {
      element.classList.add('scroll-optimized');
    });
  }

  private optimizeTouchListeners(): void {
    if (this.settings.enableTouchCoalescing) {
      this.setupTouchCoalescing();
    }

    // Use passive listeners where possible
    this.addPassiveTouchListeners();

    // Implement touch start time tracking
    this.setupTouchTiming();
  }

  private setupTouchCoalescing(): void {
    let touchQueue: any[] = [];
    let rafScheduled = false;

    const processTouchQueue = () => {
      // Process queued touch events
      touchQueue.forEach(event => {
        this.processTouchEvent(event);
      });

      touchQueue = [];
      rafScheduled = false;
    };

    // Override default touch event handling
    document.addEventListener('touchstart', (event) => {
      touchQueue.push({ type: 'touchstart', event });
      if (!rafScheduled) {
        requestAnimationFrame(processTouchQueue);
        rafScheduled = true;
      }
    }, { passive: true });

    document.addEventListener('touchmove', (event) => {
      touchQueue.push({ type: 'touchmove', event });
      if (!rafScheduled) {
        requestAnimationFrame(processTouchQueue);
        rafScheduled = true;
      }
    }, { passive: true });

    document.addEventListener('touchend', (event) => {
      touchQueue.push({ type: 'touchend', event });
      if (!rafScheduled) {
        requestAnimationFrame(processTouchQueue);
        rafScheduled = true;
      }
    }, { passive: true });
  }

  private addPassiveTouchListeners(): void {
    // Add passive listeners for better performance
    const touchEvents = ['touchstart', 'touchmove', 'touchend', 'touchcancel'];

    touchEvents.forEach(eventType => {
      document.addEventListener(eventType, (event) => {
        this.handlePassiveTouchEvent(eventType, event);
      }, { passive: true });
    });
  }

  private setupTouchTiming(): void {
    let firstTouchTime = 0;
    const touchResponseTimes: number[] = [];

    document.addEventListener('touchstart', (event) => {
      const now = performance.now();
      if (firstTouchTime === 0) {
        firstTouchTime = now;
        this.metrics.firstTouchDelay = firstTouchTime;
      }

      // Track individual touch start times
      Array.from(event.changedTouches).forEach(touch => {
        this.touchStartTimes.set(touch.identifier, now);
      });
    }, { passive: true });

    document.addEventListener('touchend', (event) => {
      const now = performance.now();

      Array.from(event.changedTouches).forEach(touch => {
        const startTime = this.touchStartTimes.get(touch.identifier);
        if (startTime) {
          const responseTime = now - startTime;
          touchResponseTimes.push(responseTime);
          this.touchStartTimes.delete(touch.identifier);

          // Calculate average response time
          this.metrics.averageTouchResponseTime =
            touchResponseTimes.reduce((sum, time) => sum + time, 0) / touchResponseTimes.length;
        }
      });
    }, { passive: true });
  }

  private handlePassiveTouchEvent(eventType: string, event: TouchEvent): void {
    // Handle passive touch events for performance monitoring
    if (eventType === 'touchmove') {
      this.trackTouchMovement(event);
    } else if (eventType === 'touchend') {
      this.trackTouchEnd(event);
    }
  }

  private processTouchEvent(queuedEvent: any): void {
    const { type, event } = queuedEvent;

    switch (type) {
      case 'touchstart':
        this.processTouchStart(event);
        break;
      case 'touchmove':
        this.processTouchMove(event);
        break;
      case 'touchend':
        this.processTouchEnd(event);
        break;
    }
  }

  private processTouchStart(event: TouchEvent): void {
    const now = performance.now();

    Array.from(event.changedTouches).forEach(touch => {
      this.touchPositions.set(touch.identifier, {
        x: touch.clientX,
        y: touch.clientY
      });
    });

    // Trigger touch feedback
    if (this.settings.enableVisualFeedback) {
      this.showTouchFeedback(event);
    }

    // Trigger haptic feedback
    if (this.settings.enableHapticFeedback) {
      this.triggerHapticFeedback('light');
    }
  }

  private processTouchMove(event: TouchEvent): void {
    this.detectGestures(event);
    this.optimizeScrollPerformance(event);
  }

  private processTouchEnd(event: TouchEvent): void {
    this.finalizeGestures(event);
    this.calculateTouchAccuracy(event);

    // Clean up touch data
    Array.from(event.changedTouches).forEach(touch => {
      this.touchPositions.delete(touch.identifier);
      this.touchStartTimes.delete(touch.identifier);
    });
  }

  private trackTouchMovement(event: TouchEvent): void {
    // Track touch movement for gesture recognition
    if (event.touches.length > 1) {
      this.trackMultiTouch(event);
    }
  }

  private trackMultiTouch(event: TouchEvent): void {
    const touches = Array.from(event.touches);

    if (touches.length === 2) {
      // Track pinch zoom
      this.trackPinchZoom(touches);
    }
  }

  private trackPinchZoom(touches: Touch[]): void {
    if (touches.length !== 2) return;

    const [touch1, touch2] = touches;
    const distance = Math.sqrt(
      Math.pow(touch2.clientX - touch1.clientX, 2) +
      Math.pow(touch2.clientY - touch1.clientY, 2)
    );

    const state = this.gestureState.get('pinch') || {
      initialDistance: 0,
      currentDistance: 0,
      scale: 1
    };

    if (state.initialDistance === 0) {
      state.initialDistance = distance;
    } else {
      state.currentDistance = distance;
      state.scale = distance / state.initialDistance;
    }

    this.gestureState.set('pinch', state);
  }

  private detectGestures(event: TouchEvent): void {
    if (!this.gestureConfig.enableSwipeOptimization && !this.gestureConfig.enablePinchZoom) {
      return;
    }

    const touches = Array.from(event.touches);

    // Detect swipe
    if (touches.length === 1) {
      this.detectSwipe(touches[0]);
    }

    // Detect pinch zoom
    if (touches.length === 2 && this.gestureConfig.enablePinchZoom) {
      this.detectPinchZoomGesture(touches);
    }
  }

  private detectSwipe(touch: Touch): void {
    const now = performance.now();
    const startTime = this.touchStartTimes.get(touch.identifier);

    if (!startTime) return;

    const startPos = this.touchPositions.get(touch.identifier);
    if (!startPos) return;

    const deltaX = touch.clientX - startPos.x;
    const deltaY = touch.clientY - startPos.y;
    const deltaTime = now - startTime;
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    const velocity = distance / deltaTime;

    // Check if it meets swipe criteria
    if (distance > this.gestureConfig.swipeThreshold &&
        velocity > this.gestureConfig.swipeVelocityThreshold) {

      const direction = this.getSwipeDirection(deltaX, deltaY);
      this.triggerSwipeGesture(direction, velocity, touch);
    }

    this.metrics.swipeVelocity = velocity;
  }

  private getSwipeDirection(deltaX: number, deltaY: number): string {
    const absX = Math.abs(deltaX);
    const absY = Math.abs(deltaY);

    if (absX > absY) {
      return deltaX > 0 ? 'right' : 'left';
    } else {
      return deltaY > 0 ? 'down' : 'up';
    }
  }

  private triggerSwipeGesture(direction: string, velocity: number, touch: Touch): void {
    const gestureEvent = new CustomEvent('swipe', {
      detail: {
        direction,
        velocity,
        touch,
        target: document.elementFromPoint(touch.clientX, touch.clientY)
      }
    });

    document.dispatchEvent(gestureEvent);

    // Trigger haptic feedback
    if (this.settings.enableHapticFeedback) {
      this.triggerHapticFeedback('medium');
    }
  }

  private detectPinchZoomGesture(touches: Touch[]): void {
    const state = this.gestureState.get('pinch');
    if (!state || !state.initialDistance) return;

    const currentScale = state.scale;

    // Check if pinch meets threshold
    if (Math.abs(currentScale - 1) > (this.gestureConfig.pinchThreshold / 100)) {
      this.triggerPinchGesture(currentScale, touches);
    }
  }

  private triggerPinchGesture(scale: number, touches: Touch[]): void {
    const gestureEvent = new CustomEvent('pinchzoom', {
      detail: {
        scale,
        center: this.getTouchCenter(touches),
        touches
      }
    });

    document.dispatchEvent(gestureEvent);
  }

  private getTouchCenter(touches: Touch[]): { x: number; y: number } {
    const sumX = touches.reduce((sum, touch) => sum + touch.clientX, 0);
    const sumY = touches.reduce((sum, touch) => sum + touch.clientY, 0);

    return {
      x: sumX / touches.length,
      y: sumY / touches.length
    };
  }

  private finalizeGestures(event: TouchEvent): void {
    // Finalize any active gestures
    const pinchState = this.gestureState.get('pinch');
    if (pinchState) {
      this.finalizePinchGesture(pinchState);
      this.gestureState.delete('pinch');
    }
  }

  private finalizePinchGesture(state: any): void {
    if (Math.abs(state.scale - 1) > 0.1) {
      this.metrics.pinchZoomAccuracy = Math.abs(1 - state.scale);

      const gestureEvent = new CustomEvent('pinchzoomend', {
        detail: {
          finalScale: state.scale,
          accuracy: this.metrics.pinchZoomAccuracy
        }
      });

      document.dispatchEvent(gestureEvent);
    }
  }

  private calculateTouchAccuracy(event: TouchEvent): void {
    // Calculate touch accuracy based on touch stability
    const touches = Array.from(event.changedTouches);

    touches.forEach(touch => {
      const startTime = this.touchStartTimes.get(touch.identifier);
      const startPos = this.touchPositions.get(touch.identifier);

      if (startTime && startPos) {
        const endTime = performance.now();
        const endPos = { x: touch.clientX, y: touch.clientY };

        const distance = Math.sqrt(
          Math.pow(endPos.x - startPos.x, 2) +
          Math.pow(endPos.y - startPos.y, 2)
        );

        const duration = endTime - startTime;

        // Calculate accuracy (lower movement = higher accuracy)
        const accuracy = Math.max(0, 1 - (distance / 100)); // Normalize to 0-1

        this.metrics.touchAccuracy =
          (this.metrics.touchAccuracy + accuracy) / 2; // Running average
      }
    });
  }

  private optimizeScrollPerformance(event: TouchEvent): void {
    // Implement touch-based scroll optimization
    if (event.touches.length === 1) {
      this.optimizeSingleTouchScroll(event);
    } else if (event.touches.length > 1) {
      this.optimizeMultiTouchScroll(event);
    }
  }

  private optimizeSingleTouchScroll(event: TouchEvent): void {
    // Optimize scroll performance for single touch
    requestAnimationFrame(() => {
      const scrollElement = this.findScrollableElement(event.touches[0]);
      if (scrollElement) {
        this.applyScrollOptimizations(scrollElement);
      }
    });
  }

  private optimizeMultiTouchScroll(event: TouchEvent): void {
    // Handle multi-touch scroll scenarios
    // Usually disable scroll for multi-touch gestures
    event.preventDefault();
  }

  private findScrollableElement(touch: Touch): Element | null {
    const element = document.elementFromPoint(touch.clientX, touch.clientY);

    if (!element) return null;

    // Find closest scrollable parent
    let current = element;
    while (current && current !== document.body) {
      const style = window.getComputedStyle(current);
      const overflow = style.overflowY || style.overflow;

      if (overflow === 'auto' || overflow === 'scroll') {
        return current;
      }

      current = current.parentElement;
    }

    return null;
  }

  private applyScrollOptimizations(element: Element): void {
    // Apply scroll performance optimizations
    (element as HTMLElement).style.willChange = 'transform';
    (element as HTMLElement).style.transform = 'translateZ(0)'; // Hardware acceleration
  }

  private setupTouchFeedback(): void {
    // Setup visual feedback for touch interactions
    this.setupVisualFeedback();
    this.setupHapticFeedback();
  }

  private setupVisualFeedback(): void {
    if (!this.settings.enableVisualFeedback) return;

    // Add feedback styles
    const feedbackStyle = document.createElement('style');
    feedbackStyle.textContent = `
      .touch-ripple {
        position: absolute;
        border-radius: 50%;
        background: rgba(255, 255, 255, 0.6);
        transform: scale(0);
        animation: ripple 0.6s ease-out;
        pointer-events: none;
      }

      @keyframes ripple {
        to {
          transform: scale(4);
          opacity: 0;
        }
      }

      .touch-highlight {
        position: relative;
      }

      .touch-highlight::after {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(255, 255, 255, 0.1);
        opacity: 0;
        transition: opacity 0.2s ease;
        pointer-events: none;
        border-radius: inherit;
      }

      .touch-highlight.active::after {
        opacity: 1;
      }
    `;
    document.head.appendChild(feedbackStyle);
  }

  private showTouchFeedback(event: TouchEvent): void {
    if (!this.settings.enableVisualFeedback) return;

    Array.from(event.changedTouches).forEach(touch => {
      const element = document.elementFromPoint(touch.clientX, touch.clientY);
      if (element && element.classList.contains('touch-optimized')) {

        // Add highlight class
        element.classList.add('touch-highlight', 'active');

        // Create ripple effect
        this.createRippleEffect(element, touch);

        // Remove highlight after delay
        setTimeout(() => {
          element.classList.remove('active');
        }, 200);
      }
    });
  }

  private createRippleEffect(element: Element, touch: Touch): void {
    const ripple = document.createElement('div');
    ripple.className = 'touch-ripple';

    const rect = element.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const x = touch.clientX - rect.left - size / 2;
    const y = touch.clientY - rect.top - size / 2;

    ripple.style.width = `${size}px`;
    ripple.style.height = `${size}px`;
    ripple.style.left = `${x}px`;
    ripple.style.top = `${y}px`;

    element.appendChild(ripple);

    // Remove ripple after animation
    setTimeout(() => {
      ripple.remove();
    }, 600);
  }

  private setupHapticFeedback(): void {
    if (!this.settings.enableHapticFeedback) return;

    // Setup haptic feedback based on device capabilities
    if (this.deviceInfo.isIOS) {
      this.setupIOSHaptics();
    } else if (this.deviceInfo.isAndroid) {
      this.setupAndroidHaptics();
    }
  }

  private setupIOSHaptics(): void {
    // iOS haptic feedback
    (window as any).triggerHapticFeedback = (type: string) => {
      if ('vibrate' in navigator) {
        switch (type) {
          case 'light':
            navigator.vibrate(10);
            break;
          case 'medium':
            navigator.vibrate(25);
            break;
          case 'strong':
            navigator.vibrate(50);
            break;
        }
      }
    };
  }

  private setupAndroidHaptics(): void {
    // Android haptic feedback
    (window as any).triggerHapticFeedback = (type: string) => {
      if ('vibrate' in navigator) {
        switch (type) {
          case 'light':
            navigator.vibrate([10]);
            break;
          case 'medium':
            navigator.vibrate([25]);
            break;
          case 'strong':
            navigator.vibrate([50]);
            break;
        }
      }
    };
  }

  private triggerHapticFeedback(intensity: 'light' | 'medium' | 'strong' = 'light'): void {
    if (this.settings.enableHapticFeedback && (window as any).triggerHapticFeedback) {
      (window as any).triggerHapticFeedback(intensity);
    }
  }

  private setupTouchPrediction(): void {
    if (!this.settings.enableTouchPrediction) return;

    // Implement touch prediction for better perceived performance
    let predictedPositions: Map<number, { x: number; y: number }> = new Map();

    document.addEventListener('touchmove', (event) => {
      if (event.touches.length === 1) {
        const touch = event.touches[0];
        const lastPos = predictedPositions.get(touch.identifier);

        if (lastPos) {
          // Simple linear prediction
          const vx = touch.clientX - lastPos.x;
          const vy = touch.clientY - lastPos.y;

          // Predict next position
          const predictedX = touch.clientX + vx;
          const predictedY = touch.clientY + vy;

          // Apply predicted position with smoothing
          this.applyPredictedPosition(touch.identifier, predictedX, predictedY);
        }

        predictedPositions.set(touch.identifier, {
          x: touch.clientX,
          y: touch.clientY
        });
      }
    }, { passive: true });

    document.addEventListener('touchend', (event) => {
      Array.from(event.changedTouches).forEach(touch => {
        predictedPositions.delete(touch.identifier);
      });
    }, { passive: true });
  }

  private applyPredictedPosition(touchId: number, x: number, y: number): void {
    // Apply predicted position for smoother interaction
    requestAnimationFrame(() => {
      const element = document.elementFromPoint(x, y);
      if (element && element.classList.contains('touch-optimized')) {
        // Apply visual prediction feedback
        this.showPredictionFeedback(element, x, y);
      }
    });
  }

  private showPredictionFeedback(element: Element, x: number, y: number): void {
    // Show subtle visual feedback for predicted position
    // This is a simplified implementation
    element.style.transform = 'scale(1.02)';
    setTimeout(() => {
      element.style.transform = '';
    }, 50);
  }

  private setupGestureRecognition(): void {
    // Setup custom gesture recognition
    this.setupSwipeGestures();
    this.setupTapGestures();
    this.setupLongPressGestures();
    this.setupDoubleTapGestures();
  }

  private setupSwipeGestures(): void {
    if (!this.gestureConfig.enableSwipeOptimization) return;

    let swipeStartPos: { x: number; y: number; time: number } | null = null;

    document.addEventListener('touchstart', (event) => {
      if (event.touches.length === 1) {
        const touch = event.touches[0];
        swipeStartPos = {
          x: touch.clientX,
          y: touch.clientY,
          time: performance.now()
        };
      }
    }, { passive: true });

    document.addEventListener('touchend', (event) => {
      if (swipeStartPos && event.changedTouches.length === 1) {
        const touch = event.changedTouches[0];
        const deltaX = touch.clientX - swipeStartPos.x;
        const deltaY = touch.clientY - swipeStartPos.y;
        const deltaTime = performance.now() - swipeStartPos.time;
        const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

        if (distance > this.gestureConfig.swipeThreshold) {
          const direction = this.getSwipeDirection(deltaX, deltaY);
          const velocity = distance / deltaTime;

          this.emitSwipeEvent(direction, velocity, swipeStartPos, {
            x: touch.clientX,
            y: touch.clientY
          });
        }
      }
      swipeStartPos = null;
    }, { passive: true });
  }

  private emitSwipeEvent(direction: string, velocity: number, startPos: any, endPos: any): void {
    const swipeEvent = new CustomEvent('swipe', {
      detail: {
        direction,
        velocity,
        startPos,
        endPos,
        timestamp: Date.now()
      }
    });

    document.dispatchEvent(swipeEvent);
  }

  private setupTapGestures(): void {
    if (!this.gestureConfig.enableTapOptimization) return;

    let tapStartTime = 0;
    let tapStartPos: { x: number; y: number } | null = null;

    document.addEventListener('touchstart', (event) => {
      if (event.touches.length === 1) {
        const touch = event.touches[0];
        tapStartTime = performance.now();
        tapStartPos = { x: touch.clientX, y: touch.clientY };
      }
    }, { passive: true });

    document.addEventListener('touchend', (event) => {
      if (tapStartTime && tapStartPos && event.changedTouches.length === 1) {
        const touch = event.changedTouches[0];
        const deltaTime = performance.now() - tapStartTime;
        const distance = Math.sqrt(
          Math.pow(touch.clientX - tapStartPos.x, 2) +
          Math.pow(touch.clientY - tapStartPos.y, 2)
        );

        if (deltaTime < 300 && distance < this.gestureConfig.maxTapDistance) {
          this.metrics.tapResponseTime = deltaTime;
          this.emitTapEvent(touch, deltaTime);
        }
      }
    }, { passive: true });
  }

  private emitTapEvent(touch: Touch, duration: number): void {
    const tapEvent = new CustomEvent('tap', {
      detail: {
        position: { x: touch.clientX, y: touch.clientY },
        duration,
        timestamp: Date.now()
      }
    });

    document.dispatchEvent(tapEvent);
  }

  private setupLongPressGestures(): void {
    if (!this.gestureConfig.enableLongPress) return;

    let longPressTimer: number | null = null;
    let longPressStartPos: { x: number; y: number } | null = null;

    document.addEventListener('touchstart', (event) => {
      if (event.touches.length === 1) {
        const touch = event.touches[0];
        longPressStartPos = { x: touch.clientX, y: touch.clientY };

        longPressTimer = window.setTimeout(() => {
          this.emitLongPressEvent(touch, longPressStartPos!);
          this.triggerHapticFeedback('strong');
        }, this.gestureConfig.longPressDelay);
      }
    }, { passive: true });

    document.addEventListener('touchmove', (event) => {
      if (longPressTimer && longPressStartPos) {
        const touch = event.touches[0];
        const distance = Math.sqrt(
          Math.pow(touch.clientX - longPressStartPos.x, 2) +
          Math.pow(touch.clientY - longPressStartPos.y, 2)
        );

        if (distance > this.gestureConfig.maxTapDistance) {
          clearTimeout(longPressTimer);
          longPressTimer = null;
        }
      }
    }, { passive: true });

    document.addEventListener('touchend', () => {
      if (longPressTimer) {
        clearTimeout(longPressTimer);
        longPressTimer = null;
      }
      longPressStartPos = null;
    }, { passive: true });

    document.addEventListener('touchcancel', () => {
      if (longPressTimer) {
        clearTimeout(longPressTimer);
        longPressTimer = null;
      }
      longPressStartPos = null;
    }, { passive: true });
  }

  private emitLongPressEvent(touch: Touch, position: { x: number; y: number }): void {
    const longPressEvent = new CustomEvent('longpress', {
      detail: {
        position,
        timestamp: Date.now()
      }
    });

    document.dispatchEvent(longPressEvent);
  }

  private setupDoubleTapGestures(): void {
    if (!this.gestureConfig.enableDoubleTap) return;

    let lastTapTime = 0;
    let lastTapPos: { x: number; y: number } | null = null;

    document.addEventListener('touchend', (event) => {
      if (event.changedTouches.length === 1) {
        const touch = event.changedTouches[0];
        const currentTime = performance.now();
        const currentPos = { x: touch.clientX, y: touch.clientY };

        if (lastTapTime > 0 && lastTapPos) {
          const deltaTime = currentTime - lastTapTime;
          const distance = Math.sqrt(
            Math.pow(currentPos.x - lastTapPos.x, 2) +
            Math.pow(currentPos.y - lastTapPos.y, 2)
          );

          if (deltaTime < this.gestureConfig.doubleTapDelay &&
              distance < this.gestureConfig.maxTapDistance) {
            this.emitDoubleTapEvent(currentPos);
            this.triggerHapticFeedback('medium');
          }
        }

        lastTapTime = currentTime;
        lastTapPos = currentPos;
      }
    }, { passive: true });
  }

  private emitDoubleTapEvent(position: { x: number; y: number }): void {
    const doubleTapEvent = new CustomEvent('doubletap', {
      detail: {
        position,
        timestamp: Date.now()
      }
    });

    document.dispatchEvent(doubleTapEvent);
  }

  private optimizeScrolling(): void {
    // Apply scroll optimizations
    this.setupScrollOptimizations();
    this.setupInfiniteScrollOptimizations();
  }

  private setupScrollOptimizations(): void {
    // Enable smooth scrolling with hardware acceleration
    const scrollableElements = document.querySelectorAll('.scrollable');

    scrollableElements.forEach(element => {
      (element as HTMLElement).style.willChange = 'scroll-position';
      (element as HTMLElement).style.transform = 'translateZ(0)';
    });

    // Optimize scroll event listeners
    let ticking = false;

    const optimizedScrollHandler = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          // Handle scroll
          this.handleScrollOptimization();
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', optimizedScrollHandler, { passive: true });
  }

  private handleScrollOptimization(): void {
    // Calculate scroll performance metrics
    const now = performance.now();
    const scrollElement = document.scrollingElement || document.documentElement;

    if (scrollElement) {
      const scrollTop = scrollElement.scrollTop;
      const scrollHeight = scrollElement.scrollHeight;
      const clientHeight = scrollElement.clientHeight;

      // Calculate scroll position percentage
      const scrollProgress = scrollTop / (scrollHeight - clientHeight);

      // Emit scroll performance event
      const scrollEvent = new CustomEvent('scrolloptimization', {
        detail: {
          scrollTop,
          scrollProgress,
          timestamp: now,
          performance: this.metrics.scrollPerformance
        }
      });

      document.dispatchEvent(scrollEvent);
    }
  }

  private setupInfiniteScrollOptimizations(): void {
    // Optimize infinite scroll if present
    const infiniteScrollElements = document.querySelectorAll('[data-infinite-scroll]');

    infiniteScrollElements.forEach(element => {
      // Set up intersection observer for lazy loading
      if ('IntersectionObserver' in window) {
        const observer = new IntersectionObserver((entries) => {
          entries.forEach(entry => {
            if (entry.isIntersecting) {
              this.loadMoreContent(entry.target as Element);
            }
          });
        }, {
          rootMargin: '100px',
          threshold: 0.1
        });

        observer.observe(element);
      }
    });
  }

  private loadMoreContent(element: Element): void {
    // Load more content for infinite scroll
    const loadEvent = new CustomEvent('loadmore', {
      detail: { element, timestamp: Date.now() }
    });

    element.dispatchEvent(loadEvent);
  }

  private setupAccessibilityEnhancements(): void {
    // Setup accessibility enhancements for touch interactions
    if (this.settings.accessibilityMode) {
      this.enableHighContrastMode();
      this.enlargeTouchTargets();
    }

    // Setup screen reader optimizations
    this.setupScreenReaderOptimizations();
  }

  private enableHighContrastMode(): void {
    document.documentElement.classList.add('high-contrast-touch');

    const style = document.createElement('style');
    style.textContent = `
      .high-contrast-touch .touch-optimized {
        border: 2px solid;
        background: ButtonFace;
      }

      .high-contrast-touch .touch-optimized:hover,
      .high-contrast-touch .touch-optimized:focus {
        outline: 3px solid;
        outline-offset: 2px;
      }
    `;
    document.head.appendChild(style);
  }

  private enlargeTouchTargets(): void {
    const style = document.createElement('style');
    style.textContent = `
      @media (prefers-contrast: high) {
        .adaptive-touch-target {
          min-width: 56px !important;
          min-height: 56px !important;
          padding: 20px !important;
        }
      }
    `;
    document.head.appendChild(style);
  }

  private setupScreenReaderOptimizations(): void {
    // Add ARIA labels for touch gestures
    const touchElements = document.querySelectorAll('.touch-optimized');

    touchElements.forEach(element => {
      if (!element.getAttribute('aria-label')) {
        element.setAttribute('aria-label', this.getAccessibilityLabel(element));
      }

      // Add role if missing
      if (!element.getAttribute('role')) {
        element.setAttribute('role', this.getAccessibilityRole(element));
      }
    });
  }

  private getAccessibilityLabel(element: Element): string {
    const tagName = element.tagName.toLowerCase();

    switch (tagName) {
      case 'button':
        return element.textContent || 'Button';
      case 'a':
        return element.textContent || 'Link';
      case 'input':
        return (element as HTMLInputElement).placeholder || 'Input field';
      default:
        return element.textContent || 'Interactive element';
    }
  }

  private getAccessibilityRole(element: Element): string {
    const tagName = element.tagName.toLowerCase();

    switch (tagName) {
      case 'button':
        return 'button';
      case 'a':
        return 'link';
      case 'input':
        return (element as HTMLInputElement).type || 'textbox';
      default:
        return 'button';
    }
  }

  // Public API methods
  public getDeviceInfo(): TouchDeviceInfo {
    return { ...this.deviceInfo };
  }

  public getMetrics(): TouchMetrics {
    return { ...this.metrics };
  }

  public getGestureConfig(): GestureConfig {
    return { ...this.gestureConfig };
  }

  public getSettings(): TouchOptimizationSettings {
    return { ...this.settings };
  }

  public updateSettings(newSettings: Partial<TouchOptimizationSettings>): void {
    this.settings = { ...this.settings, ...newSettings };
    console.log('📱 Touch settings updated:', this.settings);
  }

  public updateGestureConfig(newConfig: Partial<GestureConfig>): void {
    this.gestureConfig = { ...this.gestureConfig, ...newConfig };
    console.log('👆 Gesture config updated:', this.gestureConfig);
  }

  public enableAccessibilityMode(enabled: boolean): void {
    this.settings.accessibilityMode = enabled;

    if (enabled) {
      this.enableHighContrastMode();
      this.enlargeTouchTargets();
    }

    console.log(`♿ Accessibility mode ${enabled ? 'enabled' : 'disabled'}`);
  }

  public setLeftHandedMode(enabled: boolean): void {
    this.settings.leftHandedMode = enabled;
    document.documentElement.classList.toggle('left-handed', enabled);
    console.log(`🤚 Left-handed mode ${enabled ? 'enabled' : 'disabled'}`);
  }

  public calibrateTouchSensitivity(): void {
    // Run touch sensitivity calibration
    console.log('🎯 Starting touch sensitivity calibration...');

    const calibrationElement = document.createElement('div');
    calibrationElement.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: rgba(0, 0, 0, 0.8);
      color: white;
      padding: 20px;
      border-radius: 10px;
      z-index: 10000;
      font-family: system-ui;
    `;
    calibrationElement.innerHTML = `
      <h3>Touch Calibration</h3>
      <p>Tap the screen 5 times to calibrate touch sensitivity.</p>
      <div id="calibration-counter">0 / 5</div>
    `;

    document.body.appendChild(calibrationElement);

    let tapCount = 0;
    const tapTimes: number[] = [];

    const handleCalibrationTap = (event: Event) => {
      if (event instanceof CustomEvent && event.type === 'tap') {
        tapCount++;
        tapTimes.push(performance.now());

        const counter = document.getElementById('calibration-counter');
        if (counter) {
          counter.textContent = `${tapCount} / 5`;
        }

        if (tapCount >= 5) {
          // Calculate average tap time
          const avgTapTime = tapTimes.reduce((sum, time) => sum + time, 0) / tapTimes.length;

          // Adjust settings based on calibration
          if (avgTapTime > 200) {
            this.gestureConfig.tapThreshold = 15;
            this.gestureConfig.maxTapDistance = 25;
          } else if (avgTapTime < 100) {
            this.gestureConfig.tapThreshold = 8;
            this.gestureConfig.maxTapDistance = 15;
          }

          // Remove calibration element
          calibrationElement.remove();
          document.removeEventListener('tap', handleCalibrationTap);

          console.log('✅ Touch calibration completed');
          console.log(`Average tap time: ${avgTapTime.toFixed(2)}ms`);
        }
      }
    };

    document.addEventListener('tap', handleCalibrationTap);
  }

  public generateOptimizationReport(): object {
    return {
      deviceInfo: this.deviceInfo,
      metrics: this.metrics,
      gestureConfig: this.gestureConfig,
      settings: this.settings,
      optimizations: {
        touchCoalescing: this.settings.enableTouchCoalescing,
        touchPrediction: this.settings.enableTouchPrediction,
        hapticFeedback: this.settings.enableHapticFeedback,
        visualFeedback: this.settings.enableVisualFeedback,
        gestureRecognition: true
      },
      recommendations: this.generateTouchRecommendations(),
      timestamp: new Date().toISOString()
    };
  }

  private generateTouchRecommendations(): string[] {
    const recommendations: string[] = [];

    if (this.metrics.averageTouchResponseTime > 150) {
      recommendations.push('Consider enabling touch prediction to improve perceived responsiveness');
    }

    if (this.metrics.touchAccuracy < 0.8) {
      recommendations.push('Increase touch target sizes for better accuracy');
    }

    if (this.metrics.touchJank > 10) {
      recommendations.push('Enable touch coalescing to reduce touch jank');
    }

    if (!this.settings.enableHapticFeedback && this.deviceInfo.hasTouch) {
      recommendations.push('Enable haptic feedback for better user experience');
    }

    if (!this.settings.accessibilityMode && this.deviceInfo.isMobile) {
      recommendations.push('Consider enabling accessibility mode for better usability');
    }

    if (recommendations.length === 0) {
      recommendations.push('Touch interactions are optimally configured');
    }

    return recommendations;
  }
}

// Export singleton instance
export const touchInteractionOptimizer = TouchInteractionOptimizer.getInstance();

// Convenience exports
export const initializeTouchOptimization = () => touchInteractionOptimizer;
export const getTouchMetrics = () => touchInteractionOptimizer.getMetrics();
export const getTouchDeviceInfo = () => touchInteractionOptimizer.getDeviceInfo();
export const calibrateTouch = () => touchInteractionOptimizer.calibrateTouchSensitivity();
export const getTouchReport = () => touchInteractionOptimizer.generateOptimizationReport();

// Development debugging
if (import.meta.env.DEV) {
  (window as any).touchOptimizer = {
    init: initializeTouchOptimization,
    getMetrics: getTouchMetrics,
    getDeviceInfo: getTouchDeviceInfo,
    calibrate: calibrateTouch,
    getReport: getTouchReport,
    updateSettings: (settings: Partial<TouchOptimizationSettings>) => touchInteractionOptimizer.updateSettings(settings),
    updateGestures: (config: Partial<GestureConfig>) => touchInteractionOptimizer.updateGestureConfig(config),
    enableAccessibility: (enabled: boolean) => touchInteractionOptimizer.enableAccessibilityMode(enabled),
    setLeftHanded: (enabled: boolean) => touchInteractionOptimizer.setLeftHandedMode(enabled)
  };
}