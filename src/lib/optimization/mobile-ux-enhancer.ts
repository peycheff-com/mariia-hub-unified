/**
 * Advanced Mobile UX Enhancement and Gesture Interaction System
 * for luxury beauty and fitness booking platform
 *
 * Provides touch-optimized interactions, gesture support,
 * accessibility improvements, and luxury mobile experience
 */

import { mobileExperienceMonitor } from '../mobile-experience-monitoring';
import { trackRUMEvent } from '../rum';

// UX enhancement configuration
interface UXEnhancementConfig {
  // Touch interactions
  touch: {
    hapticFeedback: boolean;
    touchRipple: boolean;
    touchScale: boolean;
    longPressDuration: number;    // ms
    doubleTapThreshold: number;   // ms
    swipeThreshold: number;       // pixels
    pinchThreshold: number;       // scale difference
  };

  // Gestures
  gestures: {
    swipe: {
      enabled: boolean;
      horizontal: boolean;
      vertical: boolean;
      diagonal: boolean;
      threshold: number;          // velocity
      maxDuration: number;        // ms
    };
    pinch: {
      enabled: boolean;
      minScale: number;
      maxScale: number;
      sensitivity: number;        // 0-1
    };
    rotate: {
      enabled: boolean;
      sensitivity: number;        // degrees per pixel
      minAngle: number;           // degrees
    };
    drag: {
      enabled: boolean;
      threshold: number;          // pixels
      momentum: boolean;
      bounce: boolean;
    };
  };

  // Visual feedback
  feedback: {
    animations: {
      enabled: boolean;
      duration: {
        fast: number;             // ms
        normal: number;           // ms
        slow: number;             // ms
      };
      easing: 'ease' | 'ease-in' | 'ease-out' | 'ease-in-out' | 'cubic-bezier';
      spring: {
        tension: number;          // 0-1000
        friction: number;         // 0-100
      };
    };
    transitions: {
      page: boolean;
      modal: boolean;
      tab: boolean;
      navigation: boolean;
    };
    loading: {
      skeleton: boolean;
      shimmer: boolean;
      spinners: boolean;
      progress: boolean;
    };
  };

  // Accessibility
  accessibility: {
    reducedMotion: boolean;
    highContrast: boolean;
    largeText: boolean;
    screenReader: boolean;
    keyboardNavigation: boolean;
    focusManagement: boolean;
    voiceControl: boolean;
  };

  // Luxury enhancements
  luxury: {
    premiumAnimations: boolean;
    microInteractions: boolean;
    particleEffects: boolean;
    soundEffects: boolean;
    visualEffects: {
      blur: boolean;
      glow: boolean;
      shadows: boolean;
      gradients: boolean;
    };
  };

  // Performance
  performance: {
    frameRate: number;            // 30, 60, 120
    gpuAcceleration: boolean;
    memoryOptimization: boolean;
    batteryOptimization: boolean;
    adaptiveQuality: boolean;
  };
}

// Touch gesture data
interface TouchGesture {
  id: string;
  type: 'tap' | 'doubleTap' | 'longPress' | 'swipe' | 'pinch' | 'rotate' | 'drag';
  target: Element;
  startTime: number;
  endTime?: number;
  duration?: number;
  touches: TouchPoint[];
  startPoint: Point;
  endPoint?: Point;
  velocity?: Point;
  distance?: number;
  scale?: number;
  rotation?: number;
  confidence: number;             // 0-1
}

// Touch point
interface TouchPoint {
  id: number;
  x: number;
  y: number;
  pressure: number;
  timestamp: number;
}

// Point
interface Point {
  x: number;
  y: number;
}

// UX metrics
interface UXMetrics {
  timestamp: number;
  gesture: TouchGesture;
  target: {
    type: string;
    id?: string;
    class?: string;
    text?: string;
  };
  performance: {
    responseTime: number;
    frameRate: number;
    hapticLatency?: number;
  };
  userExperience: {
    satisfaction: number;         // 0-100
    frustration: number;          // 0-100
    engagement: number;           // 0-100
  };
  context: {
    pageType: string;
    section: string;
    action: string;
  };
}

// Accessibility preference
interface AccessibilityPreferences {
  reducedMotion: boolean;
  highContrast: boolean;
  largeText: boolean;
  screenReader: boolean;
  keyboardNavigation: boolean;
  customSettings: Record<string, any>;
}

class MobileUXEnhancer {
  private static instance: MobileUXEnhancer;
  private isInitialized = false;
  private config: UXEnhancementConfig;
  private activeGestures: Map<number, TouchGesture> = new Map();
  private gestureHistory: TouchGesture[] = [];
  private uxMetrics: UXMetrics[] = [];
  private accessibilityPrefs: AccessibilityPreferences;
  private currentTouchId: number | null = null;
  private touchStartTime: number = 0;
  private lastTapTime: number = 0;
  private touchStartPoint: Point | null = null;
  private gestureHandlers: Map<string, Function[]> = new Map();
  private hapticEngine: any = null;

  private constructor() {
    this.config = this.getDefaultConfig();
    this.accessibilityPrefs = this.detectAccessibilityPreferences();
  }

  static getInstance(): MobileUXEnhancer {
    if (!MobileUXEnhancer.instance) {
      MobileUXEnhancer.instance = new MobileUXEnhancer();
    }
    return MobileUXEnhancer.instance;
  }

  // Initialize the UX enhancer
  initialize(config: Partial<UXEnhancementConfig> = {}): void {
    if (this.isInitialized) return;

    this.config = { ...this.config, ...config };

    try {
      this.initializeTouchInteractions();
      this.initializeGestureRecognition();
      this.initializeVisualFeedback();
      this.initializeAccessibilityEnhancements();
      this.initializeLuxuryEnhancements();
      this.initializePerformanceOptimizations();
      this.initializeHapticFeedback();
      this.initializeAdaptiveUX();

      this.isInitialized = true;
      console.log('[Mobile UX Enhancer] Advanced UX enhancements initialized');

      // Apply enhancements to existing elements
      this.enhanceExistingElements();

      trackRUMEvent('mobile-ux-enhancer-initialized', {
        config: this.config,
        accessibilityPrefs: this.accessibilityPrefs,
        timestamp: Date.now()
      });
    } catch (error) {
      console.warn('[Mobile UX Enhancer] Failed to initialize:', error);
    }
  }

  // Get default configuration
  private getDefaultConfig(): UXEnhancementConfig {
    return {
      touch: {
        hapticFeedback: true,
        touchRipple: true,
        touchScale: true,
        longPressDuration: 500,
        doubleTapThreshold: 300,
        swipeThreshold: 50
      },
      gestures: {
        swipe: {
          enabled: true,
          horizontal: true,
          vertical: true,
          diagonal: false,
          threshold: 0.5,
          maxDuration: 500
        },
        pinch: {
          enabled: true,
          minScale: 0.5,
          maxScale: 3.0,
          sensitivity: 0.7
        },
        rotate: {
          enabled: true,
          sensitivity: 1.0,
          minAngle: 15
        },
        drag: {
          enabled: true,
          threshold: 10,
          momentum: true,
          bounce: true
        }
      },
      feedback: {
        animations: {
          enabled: true,
          duration: {
            fast: 150,
            normal: 250,
            slow: 400
          },
          easing: 'ease-out',
          spring: {
            tension: 300,
            friction: 30
          }
        },
        transitions: {
          page: true,
          modal: true,
          tab: true,
          navigation: true
        },
        loading: {
          skeleton: true,
          shimmer: true,
          spinners: true,
          progress: true
        }
      },
      accessibility: {
        reducedMotion: false,
        highContrast: false,
        largeText: false,
        screenReader: false,
        keyboardNavigation: true,
        focusManagement: true,
        voiceControl: false
      },
      luxury: {
        premiumAnimations: true,
        microInteractions: true,
        particleEffects: false,
        soundEffects: false,
        visualEffects: {
          blur: true,
          glow: true,
          shadows: true,
          gradients: true
        }
      },
      performance: {
        frameRate: 60,
        gpuAcceleration: true,
        memoryOptimization: true,
        batteryOptimization: true,
        adaptiveQuality: true
      }
    };
  }

  // Detect accessibility preferences
  private detectAccessibilityPreferences(): AccessibilityPreferences {
    return {
      reducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
      highContrast: window.matchMedia('(prefers-contrast: high)').matches,
      largeText: window.matchMedia('(prefers-reduced-data: reduce)').matches,
      screenReader: false, // Would need more complex detection
      keyboardNavigation: true,
      customSettings: {}
    };
  }

  // Initialize touch interactions
  private initializeTouchInteractions(): void {
    document.addEventListener('touchstart', this.handleTouchStart.bind(this), { passive: false });
    document.addEventListener('touchmove', this.handleTouchMove.bind(this), { passive: false });
    document.addEventListener('touchend', this.handleTouchEnd.bind(this), { passive: false });
    document.addEventListener('touchcancel', this.handleTouchCancel.bind(this), { passive: false });

    // Prevent default touch behaviors on enhanced elements
    document.addEventListener('touchstart', (e) => {
      const target = e.target as Element;
      if (target.closest('.enhanced-touch')) {
        e.preventDefault();
      }
    }, { passive: false });

    // Create touch enhancement styles
    this.createTouchEnhancementStyles();
  }

  // Handle touch start
  private handleTouchStart(event: TouchEvent): void {
    const touch = event.touches[0];
    const startTime = performance.now();

    this.currentTouchId = touch.identifier;
    this.touchStartTime = startTime;
    this.touchStartPoint = { x: touch.clientX, y: touch.clientY };

    // Create new gesture
    const gesture: TouchGesture = {
      id: this.generateGestureId(),
      type: 'tap', // Default type, may change
      target: event.target as Element,
      startTime,
      touches: [this.createTouchPoint(touch)],
      startPoint: { x: touch.clientX, y: touch.clientY },
      confidence: 0
    };

    this.activeGestures.set(touch.identifier, gesture);

    // Provide immediate feedback
    this.provideTouchFeedback(event.target as Element, 'start');

    // Start long press timer
    setTimeout(() => {
      if (this.activeGestures.has(touch.identifier)) {
        this.handleLongPress(touch.identifier);
      }
    }, this.config.touch.longPressDuration);

    // Trigger haptic feedback if enabled
    if (this.config.touch.hapticFeedback) {
      this.triggerHaptic('light');
    }
  }

  // Handle touch move
  private handleTouchMove(event: TouchEvent): void {
    const touch = event.touches[0];
    const gesture = this.activeGestures.get(touch.identifier);

    if (!gesture) return;

    const currentTime = performance.now();
    const currentPoint = { x: touch.clientX, y: touch.clientY };
    const deltaX = currentPoint.x - gesture.startPoint.x;
    const deltaY = currentPoint.y - gesture.startPoint.y;
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

    // Update gesture data
    gesture.touches.push(this.createTouchPoint(touch));
    gesture.endPoint = currentPoint;
    gesture.distance = distance;

    // Calculate velocity
    if (gesture.touches.length > 1) {
      const prevTouch = gesture.touches[gesture.touches.length - 2];
      const timeDiff = currentTime - prevTouch.timestamp;
      const distDiff = Math.sqrt(
        Math.pow(currentPoint.x - prevTouch.x, 2) +
        Math.pow(currentPoint.y - prevTouch.y, 2)
      );
      gesture.velocity = {
        x: distDiff / timeDiff,
        y: distDiff / timeDiff
      };
    }

    // Determine gesture type based on movement
    if (distance > this.config.touch.swipeThreshold) {
      gesture.type = 'swipe';
    }

    // Handle multi-touch gestures
    if (event.touches.length === 2) {
      this.handleMultiTouchGesture(event);
    }

    // Provide ongoing feedback
    this.provideTouchFeedback(gesture.target, 'move', gesture);

    // Prevent default if we're handling the gesture
    if (this.shouldPreventDefault(gesture)) {
      event.preventDefault();
    }
  }

  // Handle touch end
  private handleTouchEnd(event: TouchEvent): void {
    const touch = event.changedTouches[0];
    const gesture = this.activeGestures.get(touch.identifier);

    if (!gesture) return;

    const endTime = performance.now();
    gesture.endTime = endTime;
    gesture.duration = endTime - gesture.startTime;

    // Finalize gesture type
    this.finalizeGestureType(gesture);

    // Calculate confidence
    gesture.confidence = this.calculateGestureConfidence(gesture);

    // Process the completed gesture
    this.processGesture(gesture);

    // Provide completion feedback
    this.provideTouchFeedback(gesture.target, 'end', gesture);

    // Store gesture history
    this.gestureHistory.push(gesture);
    if (this.gestureHistory.length > 100) {
      this.gestureHistory = this.gestureHistory.slice(-100);
    }

    // Clean up
    this.activeGestures.delete(touch.identifier);
    this.currentTouchId = null;
  }

  // Handle touch cancel
  private handleTouchCancel(event: TouchEvent): void {
    const touch = event.changedTouches[0];
    const gesture = this.activeGestures.get(touch.identifier);

    if (gesture) {
      // Cancel gesture
      gesture.type = 'tap';
      gesture.confidence = 0;

      this.activeGestures.delete(touch.identifier);
      this.currentTouchId = null;
    }
  }

  // Handle long press
  private handleLongPress(touchId: number): void {
    const gesture = this.activeGestures.get(touchId);
    if (!gesture) return;

    gesture.type = 'longPress';
    gesture.confidence = 0.8;

    // Trigger haptic feedback
    if (this.config.touch.hapticFeedback) {
      this.triggerHaptic('medium');
    }

    // Process long press
    this.processGesture(gesture);
  }

  // Handle multi-touch gesture
  private handleMultiTouchGesture(event: TouchEvent): void {
    if (event.touches.length !== 2) return;

    const touch1 = event.touches[0];
    const touch2 = event.touches[1];

    const currentDistance = Math.sqrt(
      Math.pow(touch2.clientX - touch1.clientX, 2) +
      Math.pow(touch2.clientY - touch1.clientY, 2)
    );

    const currentAngle = Math.atan2(
      touch2.clientY - touch1.clientY,
      touch2.clientX - touch1.clientX
    ) * 180 / Math.PI;

    // Update pinch/rotate gestures
    this.activeGestures.forEach(gesture => {
      if (gesture.touches.length >= 2) {
        const initialDistance = this.getInitialDistance(gesture);
        const initialAngle = this.getInitialAngle(gesture);

        if (initialDistance > 0) {
          gesture.scale = currentDistance / initialDistance;
          gesture.type = 'pinch';
        }

        if (initialAngle !== null) {
          gesture.rotation = currentAngle - initialAngle;
          if (Math.abs(gesture.rotation) > this.config.gestures.rotate.minAngle) {
            gesture.type = 'rotate';
          }
        }
      }
    });
  }

  // Finalize gesture type
  private finalizeGestureType(gesture: TouchGesture): void {
    const duration = gesture.duration || 0;
    const distance = gesture.distance || 0;

    // Check for double tap
    if (duration < 200 && distance < 10) {
      const now = Date.now();
      if (now - this.lastTapTime < this.config.touch.doubleTapThreshold) {
        gesture.type = 'doubleTap';
      }
      this.lastTapTime = now;
    }

    // Check for swipe
    if (distance > this.config.touch.swipeThreshold && duration < this.config.gestures.swipe.maxDuration) {
      gesture.type = 'swipe';
    }

    // Check for drag
    if (distance > this.config.gestures.drag.threshold) {
      gesture.type = 'drag';
    }
  }

  // Calculate gesture confidence
  private calculateGestureConfidence(gesture: TouchGesture): number {
    let confidence = 0.5; // Base confidence

    const duration = gesture.duration || 0;
    const distance = gesture.distance || 0;
    const velocity = gesture.velocity || { x: 0, y: 0 };

    switch (gesture.type) {
      case 'tap':
        if (duration < 200 && distance < 10) confidence = 0.9;
        else if (duration < 300 && distance < 20) confidence = 0.7;
        break;

      case 'doubleTap':
        if (duration < 200 && distance < 10) confidence = 0.95;
        break;

      case 'longPress':
        if (duration >= this.config.touch.longPressDuration && distance < 20) confidence = 0.9;
        break;

      case 'swipe':
        const speed = Math.sqrt(velocity.x * velocity.x + velocity.y * velocity.y);
        if (speed > this.config.gestures.swipe.threshold && duration < 500) confidence = 0.85;
        break;

      case 'pinch':
        if (gesture.scale && Math.abs(gesture.scale - 1) > 0.1) confidence = 0.8;
        break;

      case 'rotate':
        if (gesture.rotation && Math.abs(gesture.rotation) > this.config.gestures.rotate.minAngle) confidence = 0.75;
        break;

      case 'drag':
        if (distance > this.config.gestures.drag.threshold) confidence = 0.8;
        break;
    }

    return Math.max(0, Math.min(1, confidence));
  }

  // Process gesture
  private processGesture(gesture: TouchGesture): void {
    // Record UX metrics
    this.recordUXMetrics(gesture);

    // Trigger gesture handlers
    this.triggerGestureHandlers(gesture);

    // Apply gesture-specific actions
    this.applyGestureActions(gesture);

    // Track RUM event
    trackRUMEvent('mobile-gesture-processed', {
      gestureType: gesture.type,
      target: this.getElementSelector(gesture.target),
      confidence: gesture.confidence,
      duration: gesture.duration,
      timestamp: Date.now()
    });
  }

  // Record UX metrics
  private recordUXMetrics(gesture: TouchGesture): void {
    const metrics: UXMetrics = {
      timestamp: Date.now(),
      gesture,
      target: {
        type: gesture.target.tagName.toLowerCase(),
        id: gesture.target.id || undefined,
        class: gesture.target.className || undefined,
        text: gesture.target.textContent?.slice(0, 50) || undefined
      },
      performance: {
        responseTime: gesture.duration || 0,
        frameRate: this.getCurrentFrameRate(),
        hapticLatency: this.config.touch.hapticFeedback ? 50 : undefined
      },
      userExperience: {
        satisfaction: this.calculateUserSatisfaction(gesture),
        frustration: this.calculateUserFrustration(gesture),
        engagement: this.calculateUserEngagement(gesture)
      },
      context: {
        pageType: this.getPageType(),
        section: this.getPageSection(gesture.target),
        action: this.getGestureAction(gesture)
      }
    };

    this.uxMetrics.push(metrics);

    // Keep only recent metrics
    if (this.uxMetrics.length > 500) {
      this.uxMetrics = this.uxMetrics.slice(-500);
    }
  }

  // Calculate user satisfaction
  private calculateUserSatisfaction(gesture: TouchGesture): number {
    let satisfaction = 50; // Base satisfaction

    // Fast, accurate gestures increase satisfaction
    if (gesture.confidence > 0.8) satisfaction += 30;
    if ((gesture.duration || 0) < 200) satisfaction += 20;

    // Responsive feedback increases satisfaction
    if (this.config.touch.hapticFeedback) satisfaction += 10;
    if (this.config.touch.touchRipple) satisfaction += 5;

    return Math.max(0, Math.min(100, satisfaction));
  }

  // Calculate user frustration
  private calculateUserFrustration(gesture: TouchGesture): number {
    let frustration = 0;

    // Low confidence gestures indicate frustration
    if (gesture.confidence < 0.3) frustration += 40;
    else if (gesture.confidence < 0.6) frustration += 20;

    // Long gestures without clear intent indicate frustration
    if ((gesture.duration || 0) > 2000 && gesture.type === 'tap') frustration += 30;

    // Large distance without gesture type indicates frustration
    if ((gesture.distance || 0) > 100 && gesture.type === 'tap') frustration += 25;

    return Math.max(0, Math.min(100, frustration));
  }

  // Calculate user engagement
  private calculateUserEngagement(gesture: TouchGesture): number {
    let engagement = 20; // Base engagement

    // Complex gestures indicate higher engagement
    if (['pinch', 'rotate'].includes(gesture.type)) engagement += 40;
    else if (['swipe', 'drag'].includes(gesture.type)) engagement += 30;
    else if (['doubleTap', 'longPress'].includes(gesture.type)) engagement += 25;

    // Multiple touches indicate engagement
    if (gesture.touches.length > 1) engagement += 20;

    return Math.max(0, Math.min(100, engagement));
  }

  // Trigger gesture handlers
  private triggerGestureHandlers(gesture: TouchGesture): void {
    const handlers = this.gestureHandlers.get(gesture.type) || [];
    handlers.forEach(handler => {
      try {
        handler(gesture);
      } catch (error) {
        console.warn(`Gesture handler error for ${gesture.type}:`, error);
      }
    });
  }

  // Apply gesture actions
  private applyGestureActions(gesture: TouchGesture): void {
    const target = gesture.target;

    switch (gesture.type) {
      case 'tap':
        this.handleTapAction(target);
        break;
      case 'doubleTap':
        this.handleDoubleTapAction(target);
        break;
      case 'longPress':
        this.handleLongPressAction(target);
        break;
      case 'swipe':
        this.handleSwipeAction(target, gesture);
        break;
      case 'pinch':
        this.handlePinchAction(target, gesture);
        break;
      case 'rotate':
        this.handleRotateAction(target, gesture);
        break;
      case 'drag':
        this.handleDragAction(target, gesture);
        break;
    }
  }

  // Handle tap action
  private handleTapAction(target: Element): void {
    // Add ripple effect
    if (this.config.touch.touchRipple) {
      this.addRippleEffect(target);
    }

    // Add scale effect
    if (this.config.touch.touchScale) {
      this.addScaleEffect(target);
    }

    // Trigger click event
    target.dispatchEvent(new Event('click', { bubbles: true }));
  }

  // Handle double tap action
  private handleDoubleTapAction(target: Element): void {
    // Zoom in/out on images
    if (target.tagName === 'IMG') {
      this.toggleImageZoom(target as HTMLImageElement);
    }

    // Toggle fullscreen on videos
    if (target.tagName === 'VIDEO') {
      this.toggleFullscreen(target as HTMLVideoElement);
    }
  }

  // Handle long press action
  private handleLongPressAction(target: Element): void {
    // Show context menu
    this.showContextMenu(target);

    // Trigger custom event
    target.dispatchEvent(new CustomEvent('longpress', {
      detail: { target },
      bubbles: true
    }));
  }

  // Handle swipe action
  private handleSwipeAction(target: Element, gesture: TouchGesture): void {
    if (!gesture.endPoint || !gesture.velocity) return;

    const deltaX = gesture.endPoint.x - gesture.startPoint.x;
    const deltaY = gesture.endPoint.y - gesture.startPoint.y;
    const absX = Math.abs(deltaX);
    const absY = Math.abs(deltaY);

    // Determine swipe direction
    let direction: 'left' | 'right' | 'up' | 'down';
    if (absX > absY) {
      direction = deltaX > 0 ? 'right' : 'left';
    } else {
      direction = deltaY > 0 ? 'down' : 'up';
    }

    // Handle carousel swipe
    if (target.closest('.carousel, .slider')) {
      this.handleCarouselSwipe(target.closest('.carousel, .slider')!, direction);
    }

    // Handle navigation swipe
    if (target.closest('nav') || direction === 'left') {
      this.handleNavigationSwipe(direction);
    }

    // Trigger custom event
    target.dispatchEvent(new CustomEvent('swipe', {
      detail: { direction, velocity: gesture.velocity, gesture },
      bubbles: true
    }));
  }

  // Handle pinch action
  private handlePinchAction(target: Element, gesture: TouchGesture): void {
    if (!gesture.scale) return;

    // Zoom images
    if (target.tagName === 'IMG') {
      this.zoomImage(target as HTMLImageElement, gesture.scale);
    }

    // Scale elements
    if (target.classList.contains('scalable')) {
      this.scaleElement(target, gesture.scale);
    }

    // Trigger custom event
    target.dispatchEvent(new CustomEvent('pinch', {
      detail: { scale: gesture.scale, gesture },
      bubbles: true
    }));
  }

  // Handle rotate action
  private handleRotateAction(target: Element, gesture: TouchGesture): void {
    if (!gesture.rotation) return;

    // Rotate rotatable elements
    if (target.classList.contains('rotatable')) {
      this.rotateElement(target, gesture.rotation);
    }

    // Trigger custom event
    target.dispatchEvent(new CustomEvent('rotate', {
      detail: { rotation: gesture.rotation, gesture },
      bubbles: true
    }));
  }

  // Handle drag action
  private handleDragAction(target: Element, gesture: TouchGesture): void {
    // Handle draggable elements
    if (target.classList.contains('draggable')) {
      this.dragElement(target, gesture);
    }

    // Handle sortable items
    if (target.closest('.sortable')) {
      this.handleSortable(target, gesture);
    }

    // Trigger custom event
    target.dispatchEvent(new CustomEvent('drag', {
      detail: { gesture },
      bubbles: true
    }));
  }

  // Initialize gesture recognition
  private initializeGestureRecognition(): void {
    // Register custom gesture handlers
    this.registerGestureHandler('swipe', this.handleSwipeGesture.bind(this));
    this.registerGestureHandler('pinch', this.handlePinchGesture.bind(this));
    this.registerGestureHandler('rotate', this.handleRotateGesture.bind(this));
  }

  // Register gesture handler
  private registerGestureHandler(type: string, handler: Function): void {
    if (!this.gestureHandlers.has(type)) {
      this.gestureHandlers.set(type, []);
    }
    this.gestureHandlers.get(type)!.push(handler);
  }

  // Handle swipe gesture
  private handleSwipeGesture(gesture: TouchGesture): void {
    if (gesture.type !== 'swipe' || !gesture.endPoint || !gesture.velocity) return;

    const deltaX = gesture.endPoint.x - gesture.startPoint.x;
    const deltaY = gesture.endPoint.y - gesture.startPoint.y;
    const speed = Math.sqrt(gesture.velocity.x ** 2 + gesture.velocity.y ** 2);

    // Check if it's a fast swipe
    if (speed > this.config.gestures.swipe.threshold) {
      this.handleFastSwipe(gesture, deltaX, deltaY);
    }
  }

  // Handle fast swipe
  private handleFastSwipe(gesture: TouchGesture, deltaX: number, deltaY: number): void {
    const absX = Math.abs(deltaX);
    const absY = Math.abs(deltaY);

    if (absX > absY) {
      // Horizontal swipe
      if (deltaX > 0) {
        this.navigateForward();
      } else {
        this.navigateBack();
      }
    } else {
      // Vertical swipe
      if (deltaY > 0) {
        this.navigateDown();
      } else {
        this.navigateUp();
      }
    }
  }

  // Handle pinch gesture
  private handlePinchGesture(gesture: TouchGesture): void {
    if (gesture.type !== 'pinch' || !gesture.scale) return;

    const scale = gesture.scale;

    // Clamp scale to bounds
    const clampedScale = Math.max(
      this.config.gestures.pinch.minScale,
      Math.min(this.config.gestures.pinch.maxScale, scale)
    );

    if (clampedScale !== scale) {
      // Scale was clamped, provide haptic feedback
      if (this.config.touch.hapticFeedback) {
        this.triggerHaptic('light');
      }
    }
  }

  // Handle rotate gesture
  private handleRotateGesture(gesture: TouchGesture): void {
    if (gesture.type !== 'rotate' || !gesture.rotation) return;

    const rotation = gesture.rotation;

    // Normalize rotation to 0-360 degrees
    const normalizedRotation = ((rotation % 360) + 360) % 360;

    // Provide haptic feedback at key angles
    if (Math.abs(normalizedRotation % 90) < 10) {
      if (this.config.touch.hapticFeedback) {
        this.triggerHaptic('medium');
      }
    }
  }

  // Initialize visual feedback
  private initializeVisualFeedback(): void {
    this.createFeedbackStyles();
    this.initializeAnimations();
    this.initializeTransitions();
    this.initializeLoadingStates();
  }

  // Create feedback styles
  private createFeedbackStyles(): void {
    const style = document.createElement('style');
    style.textContent = `
      /* Mobile UX Enhancer - Visual Feedback */
      .enhanced-touch {
        position: relative;
        overflow: hidden;
        -webkit-tap-highlight-color: transparent;
        user-select: none;
      }

      .touch-ripple {
        position: absolute;
        border-radius: 50%;
        background: rgba(255, 255, 255, 0.6);
        transform: scale(0);
        animation: ripple-animation ${this.config.feedback.animations.duration.normal}ms ease-out;
        pointer-events: none;
      }

      @keyframes ripple-animation {
        to {
          transform: scale(4);
          opacity: 0;
        }
      }

      .touch-scale {
        transition: transform ${this.config.feedback.animations.duration.fast}ms ${this.config.feedback.animations.easing};
      }

      .touch-scale:active {
        transform: scale(0.95);
      }

      .gesture-feedback {
        position: absolute;
        pointer-events: none;
        z-index: 9999;
      }

      .swipe-indicator {
        width: 40px;
        height: 40px;
        border: 2px solid rgba(255, 255, 255, 0.8);
        border-radius: 50%;
        background: rgba(0, 0, 0, 0.1);
        backdrop-filter: blur(10px);
      }

      ${this.config.feedback.animations.enabled ? `
        .animate-in {
          animation: slideInUp ${this.config.feedback.animations.duration.normal}ms ${this.config.feedback.animations.easing};
        }

        .animate-out {
          animation: slideOutDown ${this.config.feedback.animations.duration.normal}ms ${this.config.feedback.animations.easing};
        }

        @keyframes slideInUp {
          from {
            transform: translateY(100%);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }

        @keyframes slideOutDown {
          from {
            transform: translateY(0);
            opacity: 1;
          }
          to {
            transform: translateY(100%);
            opacity: 0;
          }
        }
      ` : ''}

      ${this.config.accessibility.reducedMotion ? `
        *, *::before, *::after {
          animation-duration: 0.01ms !important;
          animation-iteration-count: 1 !important;
          transition-duration: 0.01ms !important;
        }
      ` : ''}
    `;
    document.head.appendChild(style);
  }

  // Initialize animations
  private initializeAnimations(): void {
    if (!this.config.feedback.animations.enabled) return;

    // Observe elements for animation
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('animate-in');
          observer.unobserve(entry.target);
        }
      });
    }, {
      threshold: 0.1
    });

    // Observe elements with animation classes
    document.querySelectorAll('.animate-on-scroll').forEach(el => {
      observer.observe(el);
    });
  }

  // Initialize transitions
  private initializeTransitions(): void {
    if (!this.config.feedback.transitions.enabled) return;

    // Add smooth transitions to interactive elements
    const style = document.createElement('style');
    style.textContent = `
      /* Mobile UX Enhancer - Transitions */
      .page-transition {
        transition: transform ${this.config.feedback.animations.duration.normal}ms ${this.config.feedback.animations.easing},
                   opacity ${this.config.feedback.animations.duration.normal}ms ${this.config.feedback.animations.easing};
      }

      .modal-transition {
        transition: transform ${this.config.feedback.animations.duration.normal}ms ${this.config.feedback.animations.easing},
                   opacity ${this.config.feedback.animations.duration.normal}ms ${this.config.feedback.animations.easing};
      }

      .tab-transition {
        transition: transform ${this.config.feedback.animations.duration.fast}ms ${this.config.feedback.animations.easing},
                   opacity ${this.config.feedback.animations.duration.fast}ms ${this.config.feedback.animations.easing};
      }

      .navigation-transition {
        transition: transform ${this.config.feedback.animations.duration.fast}ms ${this.config.feedback.animations.easing};
      }
    `;
    document.head.appendChild(style);
  }

  // Initialize loading states
  private initializeLoadingStates(): void {
    if (!this.config.feedback.loading.enabled) return;

    // Create loading styles
    const style = document.createElement('style');
    style.textContent = `
      /* Mobile UX Enhancer - Loading States */
      .skeleton {
        background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
        background-size: 200% 100%;
        animation: loading-shimmer 1.5s infinite;
      }

      @keyframes loading-shimmer {
        0% { background-position: 200% 0; }
        100% { background-position: -200% 0; }
      }

      .loading-spinner {
        border: 2px solid #f3f3f3;
        border-top: 2px solid #3498db;
        border-radius: 50%;
        width: 20px;
        height: 20px;
        animation: spin 1s linear infinite;
      }

      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }

      .progress-bar {
        height: 4px;
        background: linear-gradient(90deg, #3498db, #2ecc71);
        background-size: 200% 100%;
        animation: progress-animation 2s ease-in-out infinite;
      }

      @keyframes progress-animation {
        0% { background-position: 200% 0; }
        100% { background-position: -200% 0; }
      }
    `;
    document.head.appendChild(style);
  }

  // Initialize accessibility enhancements
  private initializeAccessibilityEnhancements(): void {
    // Check for accessibility preferences
    this.updateAccessibilitySettings();

    // Add keyboard navigation
    this.setupKeyboardNavigation();

    // Add focus management
    this.setupFocusManagement();

    // Add screen reader support
    this.setupScreenReaderSupport();
  }

  // Update accessibility settings
  private updateAccessibilitySettings(): void {
    // Watch for preference changes
    window.matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change', (e) => {
      this.config.accessibility.reducedMotion = e.matches;
      this.updateAccessibilityStyles();
    });

    window.matchMedia('(prefers-contrast: high)').addEventListener('change', (e) => {
      this.config.accessibility.highContrast = e.matches;
      this.updateAccessibilityStyles();
    });
  }

  // Update accessibility styles
  private updateAccessibilityStyles(): void {
    let styles = '';

    if (this.config.accessibility.reducedMotion) {
      styles += `
        *, *::before, *::after {
          animation-duration: 0.01ms !important;
          animation-iteration-count: 1 !important;
          transition-duration: 0.01ms !important;
        }
      `;
    }

    if (this.config.accessibility.highContrast) {
      styles += `
        .high-contrast {
          filter: contrast(2);
        }
      `;
    }

    if (styles) {
      const styleElement = document.createElement('style');
      styleElement.id = 'accessibility-styles';
      styleElement.textContent = styles;

      // Remove existing styles
      const existing = document.getElementById('accessibility-styles');
      if (existing) {
        existing.remove();
      }

      document.head.appendChild(styleElement);
    }
  }

  // Setup keyboard navigation
  private setupKeyboardNavigation(): void {
    if (!this.config.accessibility.keyboardNavigation) return;

    // Add keyboard navigation to touch elements
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        const target = e.target as Element;
        if (target.classList.contains('enhanced-touch')) {
          e.preventDefault();
          target.dispatchEvent(new Event('click', { bubbles: true }));
        }
      }
    });

    // Make enhanced elements focusable
    document.querySelectorAll('.enhanced-touch').forEach(el => {
      if (!el.hasAttribute('tabindex')) {
        el.setAttribute('tabindex', '0');
      }
    });
  }

  // Setup focus management
  private setupFocusManagement(): void {
    if (!this.config.accessibility.focusManagement) return;

    // Add focus styles
    const style = document.createElement('style');
    style.textContent = `
      .enhanced-touch:focus {
        outline: 2px solid #3498db;
        outline-offset: 2px;
      }

      .enhanced-touch:focus-visible {
        outline: 2px solid #3498db;
        outline-offset: 2px;
      }
    `;
    document.head.appendChild(style);

    // Manage focus for modals and dialogs
    this.setupFocusTraps();
  }

  // Setup focus traps
  private setupFocusTraps(): void {
    const modals = document.querySelectorAll('.modal, .dialog');

    modals.forEach(modal => {
      modal.addEventListener('keydown', (e) => {
        if (e.key === 'Tab') {
          const focusableElements = modal.querySelectorAll(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
          );

          if (focusableElements.length > 0) {
            const firstElement = focusableElements[0] as Element;
            const lastElement = focusableElements[focusableElements.length - 1] as Element;

            if (e.shiftKey) {
              if (document.activeElement === firstElement) {
                e.preventDefault();
                (lastElement as HTMLElement).focus();
              }
            } else {
              if (document.activeElement === lastElement) {
                e.preventDefault();
                (firstElement as HTMLElement).focus();
              }
            }
          }
        }
      });
    });
  }

  // Setup screen reader support
  private setupScreenReaderSupport(): void {
    // Add ARIA labels to enhanced elements
    document.querySelectorAll('.enhanced-touch').forEach(el => {
      if (!el.hasAttribute('aria-label') && !el.hasAttribute('aria-labelledby')) {
        const text = el.textContent?.trim();
        if (text) {
          el.setAttribute('aria-label', text);
        }
      }
    });

    // Add live regions for dynamic content
    this.addLiveRegions();
  }

  // Add live regions
  private addLiveRegions(): void {
    const liveRegion = document.createElement('div');
    liveRegion.setAttribute('aria-live', 'polite');
    liveRegion.setAttribute('aria-atomic', 'true');
    liveRegion.className = 'sr-only';
    liveRegion.style.cssText = `
      position: absolute;
      left: -10000px;
      width: 1px;
      height: 1px;
      overflow: hidden;
    `;
    document.body.appendChild(liveRegion);
  }

  // Initialize luxury enhancements
  private initializeLuxuryEnhancements(): void {
    if (!this.config.luxury.premiumAnimations) return;

    this.createLuxuryStyles();
    this.initializeMicroInteractions();
    this.initializeVisualEffects();
  }

  // Create luxury styles
  private createLuxuryStyles(): void {
    const style = document.createElement('style');
    style.textContent = `
      /* Mobile UX Enhancer - Luxury Styles */
      .luxury-touch {
        position: relative;
        overflow: hidden;
      }

      .luxury-touch::before {
        content: '';
        position: absolute;
        top: 50%;
        left: 50%;
        width: 0;
        height: 0;
        border-radius: 50%;
        background: radial-gradient(circle, rgba(255, 215, 0, 0.3) 0%, transparent 70%);
        transform: translate(-50%, -50%);
        transition: width ${this.config.feedback.animations.duration.normal}ms ${this.config.feedback.animations.easing},
                    height ${this.config.feedback.animations.duration.normal}ms ${this.config.feedback.animations.easing};
        pointer-events: none;
        z-index: 1;
      }

      .luxury-touch:active::before {
        width: 200%;
        height: 200%;
      }

      ${this.config.luxury.visualEffects.blur ? `
        .luxury-blur {
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
        }
      ` : ''}

      ${this.config.luxury.visualEffects.glow ? `
        .luxury-glow {
          box-shadow: 0 0 20px rgba(255, 215, 0, 0.3);
        }
      ` : ''}

      ${this.config.luxury.visualEffects.shadows ? `
        .luxury-shadow {
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
        }
      ` : ''}

      ${this.config.luxury.visualEffects.gradients ? `
        .luxury-gradient {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        }
      ` : ''}
    `;
    document.head.appendChild(style);
  }

  // Initialize micro-interactions
  private initializeMicroInteractions(): void {
    if (!this.config.luxury.microInteractions) return;

    // Add hover effects
    document.querySelectorAll('.luxury-interactive').forEach(el => {
      el.addEventListener('mouseenter', () => {
        el.classList.add('luxury-hover');
      });

      el.addEventListener('mouseleave', () => {
        el.classList.remove('luxury-hover');
      });
    });
  }

  // Initialize visual effects
  private initializeVisualEffects(): void {
    // Add parallax effects
    this.initializeParallaxEffects();

    // Add particle effects (if enabled)
    if (this.config.luxury.particleEffects) {
      this.initializeParticleEffects();
    }
  }

  // Initialize parallax effects
  private initializeParallaxEffects(): void {
    const parallaxElements = document.querySelectorAll('.parallax');

    const handleScroll = () => {
      const scrollTop = window.pageYOffset;

      parallaxElements.forEach(el => {
        const rect = el.getBoundingClientRect();
        const speed = parseFloat(el.getAttribute('data-speed') || '0.5');
        const yPos = -(scrollTop * speed);

        (el as HTMLElement).style.transform = `translateY(${yPos}px)`;
      });
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
  }

  // Initialize particle effects
  private initializeParticleEffects(): void {
    // Simple particle system (would be more sophisticated in production)
    const particleContainer = document.createElement('div');
    particleContainer.className = 'particle-container';
    particleContainer.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
      z-index: -1;
    `;

    document.body.appendChild(particleContainer);

    // Create particles
    for (let i = 0; i < 20; i++) {
      this.createParticle(particleContainer);
    }
  }

  // Create particle
  private createParticle(container: Element): void {
    const particle = document.createElement('div');
    particle.style.cssText = `
      position: absolute;
      width: 2px;
      height: 2px;
      background: rgba(255, 255, 255, 0.5);
      border-radius: 50%;
      pointer-events: none;
      animation: float ${10 + Math.random() * 20}s linear infinite;
    `;

    const startX = Math.random() * window.innerWidth;
    const startY = Math.random() * window.innerHeight;

    particle.style.left = `${startX}px`;
    particle.style.top = `${startY}px`;

    container.appendChild(particle);
  }

  // Initialize performance optimizations
  private initializePerformanceOptimizations(): void {
    // Optimize animations
    this.optimizeAnimations();

    // Optimize scrolling
    this.optimizeScrolling();

    // Optimize rendering
    this.optimizeRendering();
  }

  // Optimize animations
  private optimizeAnimations(): void {
    if (!this.config.performance.gpuAcceleration) return;

    // Add GPU acceleration to animated elements
    const style = document.createElement('style');
    style.textContent = `
      .gpu-accelerated {
        transform: translateZ(0);
        backface-visibility: hidden;
        perspective: 1000px;
      }
    `;
    document.head.appendChild(style);

    // Apply to animated elements
    document.querySelectorAll('.animate-on-scroll, .enhanced-touch').forEach(el => {
      el.classList.add('gpu-accelerated');
    });
  }

  // Optimize scrolling
  private optimizeScrolling(): void {
    // Add smooth scrolling
    if ('scrollBehavior' in document.documentElement.style) {
      document.documentElement.style.scrollBehavior = 'smooth';
    }

    // Optimize scroll performance
    let ticking = false;

    const updateScrollPosition = () => {
      // Update scroll-based animations
      ticking = false;
    };

    window.addEventListener('scroll', () => {
      if (!ticking) {
        requestAnimationFrame(updateScrollPosition);
        ticking = true;
      }
    }, { passive: true });
  }

  // Optimize rendering
  private optimizeRendering(): void {
    // Use requestAnimationFrame for smooth animations
    let lastTime = 0;
    const targetFPS = this.config.performance.frameRate;
    const frameInterval = 1000 / targetFPS;

    const animate = (currentTime: number) => {
      if (currentTime - lastTime >= frameInterval) {
        // Update animations
        lastTime = currentTime;
      }
      requestAnimationFrame(animate);
    };

    requestAnimationFrame(animate);
  }

  // Initialize haptic feedback
  private initializeHapticFeedback(): void {
    if (!this.config.touch.hapticFeedback) return;

    // Check for haptic support
    if ('vibrate' in navigator) {
      this.hapticEngine = navigator.vibrate.bind(navigator);
    } else {
      // Fallback for iOS (would need a library)
      this.hapticEngine = () => false;
    }
  }

  // Initialize adaptive UX
  private initializeAdaptiveUX(): void {
    // Monitor performance and adapt
    setInterval(() => {
      this.adaptToPerformance();
    }, 5000);

    // Monitor battery and adapt
    if ('getBattery' in navigator) {
      (navigator as any).getBattery().then((battery: any) => {
        const updateBatteryStatus = () => {
          this.adaptToBatteryLevel(battery.level, battery.charging);
        };

        updateBatteryStatus();
        battery.addEventListener('levelchange', updateBatteryStatus);
        battery.addEventListener('chargingchange', updateBatteryStatus);
      });
    }
  }

  // Adapt to performance
  private adaptToPerformance(): void {
    const avgResponseTime = this.calculateAverageResponseTime();

    if (avgResponseTime > 200) {
      // Reduce animation complexity
      this.config.feedback.animations.enabled = false;
      this.config.luxury.premiumAnimations = false;
    } else if (avgResponseTime < 50) {
      // Enable full animations
      this.config.feedback.animations.enabled = true;
      this.config.luxury.premiumAnimations = true;
    }
  }

  // Adapt to battery level
  private adaptToBatteryLevel(level: number, charging: boolean): void {
    if (!charging && level < 0.2) {
      // Low battery - reduce effects
      this.config.touch.hapticFeedback = false;
      this.config.luxury.particleEffects = false;
      this.config.performance.frameRate = 30;
    } else if (charging || level > 0.5) {
      // Good battery - enable all effects
      this.config.touch.hapticFeedback = true;
      this.config.luxury.particleEffects = true;
      this.config.performance.frameRate = 60;
    }
  }

  // Helper methods

  // Create touch point
  private createTouchPoint(touch: Touch): TouchPoint {
    return {
      id: touch.identifier,
      x: touch.clientX,
      y: touch.clientY,
      pressure: (touch as any).force || 1,
      timestamp: performance.now()
    };
  }

  // Generate gesture ID
  private generateGestureId(): string {
    return `gesture_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Get initial distance for pinch
  private getInitialDistance(gesture: TouchGesture): number {
    if (gesture.touches.length < 2) return 0;

    const touch1 = gesture.touches[0];
    const touch2 = gesture.touches[1];

    return Math.sqrt(
      Math.pow(touch2.x - touch1.x, 2) +
      Math.pow(touch2.y - touch1.y, 2)
    );
  }

  // Get initial angle for rotation
  private getInitialAngle(gesture: TouchGesture): number | null {
    if (gesture.touches.length < 2) return null;

    const touch1 = gesture.touches[0];
    const touch2 = gesture.touches[1];

    return Math.atan2(
      touch2.y - touch1.y,
      touch2.x - touch1.x
    ) * 180 / Math.PI;
  }

  // Should prevent default
  private shouldPreventDefault(gesture: TouchGesture): boolean {
    const target = gesture.target;

    // Don't prevent default on form inputs
    if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT') {
      return false;
    }

    // Prevent default on enhanced touch elements
    if (target.classList.contains('enhanced-touch')) {
      return true;
    }

    // Prevent default for complex gestures
    if (['pinch', 'rotate', 'drag'].includes(gesture.type)) {
      return true;
    }

    return false;
  }

  // Provide touch feedback
  private provideTouchFeedback(target: Element, phase: 'start' | 'move' | 'end', gesture?: TouchGesture): void {
    if (phase === 'start') {
      // Add touch state
      target.classList.add('touched');
    } else if (phase === 'end') {
      // Remove touch state
      target.classList.remove('touched');
    }

    // Add gesture-specific feedback
    if (gesture && gesture.type === 'swipe' && phase === 'end') {
      this.showSwipeIndicator(target, gesture);
    }
  }

  // Add ripple effect
  private addRippleEffect(target: Element): void {
    const ripple = document.createElement('span');
    ripple.className = 'touch-ripple';

    const rect = target.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);

    ripple.style.width = ripple.style.height = size + 'px';
    ripple.style.left = '50%';
    ripple.style.top = '50%';
    ripple.style.transform = 'translate(-50%, -50%)';

    target.appendChild(ripple);

    setTimeout(() => {
      ripple.remove();
    }, this.config.feedback.animations.duration.normal);
  }

  // Add scale effect
  private addScaleEffect(target: Element): void {
    target.classList.add('touch-scale');

    setTimeout(() => {
      target.classList.remove('touch-scale');
    }, this.config.feedback.animations.duration.fast);
  }

  // Show swipe indicator
  private showSwipeIndicator(target: Element, gesture: TouchGesture): void {
    const indicator = document.createElement('div');
    indicator.className = 'gesture-feedback swipe-indicator';

    const rect = target.getBoundingClientRect();
    indicator.style.left = rect.left + rect.width / 2 - 20 + 'px';
    indicator.style.top = rect.top + rect.height / 2 - 20 + 'px';

    document.body.appendChild(indicator);

    setTimeout(() => {
      indicator.remove();
    }, 500);
  }

  // Show context menu
  private showContextMenu(target: Element): void {
    // Create custom context menu
    const menu = document.createElement('div');
    menu.className = 'context-menu';
    menu.innerHTML = `
      <div class="context-menu-item" data-action="copy">Copy</div>
      <div class="context-menu-item" data-action="share">Share</div>
      <div class="context-menu-item" data-action="info">Info</div>
    `;

    const rect = target.getBoundingClientRect();
    menu.style.left = rect.left + 'px';
    menu.style.top = rect.bottom + 5 + 'px';

    document.body.appendChild(menu);

    // Handle menu item clicks
    menu.addEventListener('click', (e) => {
      const action = (e.target as Element).getAttribute('data-action');
      this.handleContextMenuAction(target, action);
      menu.remove();
    });

    // Close menu when clicking outside
    setTimeout(() => {
      document.addEventListener('click', () => menu.remove(), { once: true });
    }, 100);
  }

  // Handle context menu action
  private handleContextMenuAction(target: Element, action: string): void {
    switch (action) {
      case 'copy':
        this.copyToClipboard(target.textContent || '');
        break;
      case 'share':
        this.shareContent(target);
        break;
      case 'info':
        this.showElementInfo(target);
        break;
    }
  }

  // Copy to clipboard
  private copyToClipboard(text: string): void {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
    } else {
      // Fallback
      const textarea = document.createElement('textarea');
      textarea.value = text;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
    }
  }

  // Share content
  private shareContent(target: Element): void {
    if (navigator.share) {
      navigator.share({
        title: 'Share',
        text: target.textContent || '',
        url: window.location.href
      });
    }
  }

  // Show element info
  private showElementInfo(target: Element): void {
    const info = {
      tag: target.tagName,
      id: target.id,
      class: target.className,
      text: target.textContent?.slice(0, 50)
    };

    console.log('Element Info:', info);
  }

  // Toggle image zoom
  private toggleImageZoom(img: HTMLImageElement): void {
    if (img.style.transform === 'scale(2)') {
      img.style.transform = 'scale(1)';
    } else {
      img.style.transform = 'scale(2)';
      img.style.transformOrigin = 'center';
    }
  }

  // Toggle fullscreen
  private toggleFullscreen(video: HTMLVideoElement): void {
    if (!document.fullscreenElement) {
      video.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  }

  // Handle carousel swipe
  private handleCarouselSwipe(carousel: Element, direction: string): void {
    const slides = carousel.querySelectorAll('.carousel-slide');
    const activeSlide = carousel.querySelector('.carousel-slide.active');
    const activeIndex = Array.from(slides).indexOf(activeSlide!);

    let newIndex = activeIndex;
    if (direction === 'left') {
      newIndex = Math.min(activeIndex + 1, slides.length - 1);
    } else if (direction === 'right') {
      newIndex = Math.max(activeIndex - 1, 0);
    }

    // Update active slide
    slides.forEach((slide, index) => {
      slide.classList.toggle('active', index === newIndex);
    });
  }

  // Handle navigation swipe
  private handleNavigationSwipe(direction: string): void {
    if (direction === 'left') {
      this.navigateForward();
    } else if (direction === 'right') {
      this.navigateBack();
    }
  }

  // Navigation methods
  private navigateForward(): void {
    window.history.forward();
  }

  private navigateBack(): void {
    window.history.back();
  }

  private navigateUp(): void {
    window.scrollBy({ top: -window.innerHeight, behavior: 'smooth' });
  }

  private navigateDown(): void {
    window.scrollBy({ top: window.innerHeight, behavior: 'smooth' });
  }

  // Zoom image
  private zoomImage(img: HTMLImageElement, scale: number): void {
    const currentScale = parseFloat(img.style.transform.replace('scale(', '').replace(')', '') || '1');
    const newScale = Math.max(0.5, Math.min(3, currentScale * scale));
    img.style.transform = `scale(${newScale})`;
    img.style.transformOrigin = 'center';
  }

  // Scale element
  private scaleElement(element: Element, scale: number): void {
    element.style.transform = `scale(${Math.max(0.5, Math.min(3, scale))})`;
  }

  // Rotate element
  private rotateElement(element: Element, rotation: number): void {
    const currentRotation = parseFloat(element.style.transform.replace('rotate(', '').replace('deg)', '').replace('scale(', '').replace(')', '') || '0');
    const newRotation = currentRotation + rotation;
    element.style.transform = `rotate(${newRotation}deg)`;
  }

  // Drag element
  private dragElement(element: Element, gesture: TouchGesture): void {
    if (!gesture.endPoint) return;

    const deltaX = gesture.endPoint.x - gesture.startPoint.x;
    const deltaY = gesture.endPoint.y - gesture.startPoint.y;

    element.style.transform = `translate(${deltaX}px, ${deltaY}px)`;
  }

  // Handle sortable
  private handleSortable(target: Element, gesture: TouchGesture): void {
    // Basic sortable implementation
    const container = target.closest('.sortable');
    if (!container) return;

    const items = Array.from(container.children);
    const draggedIndex = items.indexOf(target);

    // Find drop target
    const dropTarget = document.elementFromPoint(
      gesture.endPoint?.x || 0,
      gesture.endPoint?.y || 0
    )?.closest('.sortable-item');

    if (dropTarget && dropTarget !== target) {
      const dropIndex = items.indexOf(dropTarget);

      // Reorder items
      if (draggedIndex < dropIndex) {
        dropTarget.parentNode?.insertBefore(target, dropTarget.nextSibling);
      } else {
        dropTarget.parentNode?.insertBefore(target, dropTarget);
      }

      // Trigger reorder event
      container.dispatchEvent(new CustomEvent('reorder', {
        detail: { fromIndex: draggedIndex, toIndex: dropIndex },
        bubbles: true
      }));
    }
  }

  // Trigger haptic feedback
  private triggerHaptic(type: 'light' | 'medium' | 'heavy'): void {
    if (!this.hapticEngine) return;

    const patterns = {
      light: [10],
      medium: [50],
      heavy: [100]
    };

    this.hapticEngine(patterns[type]);
  }

  // Get current frame rate
  private getCurrentFrameRate(): number {
    // Simplified frame rate calculation
    return this.config.performance.frameRate;
  }

  // Get element selector
  private getElementSelector(element: Element): string {
    if (element.id) return `#${element.id}`;
    if (element.className) return `.${element.className.split(' ')[0]}`;
    return element.tagName.toLowerCase();
  }

  // Get page type
  private getPageType(): string {
    const path = window.location.pathname;
    if (path === '/') return 'landing';
    if (path.includes('/beauty')) return 'beauty-services';
    if (path.includes('/fitness')) return 'fitness-services';
    if (path.includes('/booking')) return 'booking';
    return 'other';
  }

  // Get page section
  private getPageSection(element: Element): string {
    const section = element.closest('section');
    return section?.id || section?.className || 'unknown';
  }

  // Get gesture action
  private getGestureAction(gesture: TouchGesture): string {
    const target = gesture.target;

    if (target.closest('button, a')) return 'navigation';
    if (target.closest('input, textarea, select')) return 'input';
    if (target.closest('.carousel, .slider')) return 'carousel';
    if (target.closest('.menu, .navigation')) return 'menu';
    return 'interaction';
  }

  // Calculate average response time
  private calculateAverageResponseTime(): number {
    if (this.uxMetrics.length === 0) return 100;

    const recentMetrics = this.uxMetrics.slice(-20);
    const totalTime = recentMetrics.reduce((sum, metric) => sum + metric.performance.responseTime, 0);
    return totalTime / recentMetrics.length;
  }

  // Create touch enhancement styles
  private createTouchEnhancementStyles(): void {
    const style = document.createElement('style');
    style.textContent = `
      /* Mobile UX Enhancer - Touch Enhancements */
      .enhanced-touch {
        position: relative;
        -webkit-tap-highlight-color: transparent;
        user-select: none;
        transition: transform 0.1s ease;
      }

      .enhanced-touch:active {
        transform: scale(0.95);
      }

      .touched {
        opacity: 0.7;
      }

      .gesture-feedback {
        position: fixed;
        pointer-events: none;
        z-index: 10000;
      }

      .context-menu {
        position: absolute;
        background: white;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        padding: 4px 0;
        min-width: 120px;
        z-index: 1000;
      }

      .context-menu-item {
        padding: 8px 16px;
        cursor: pointer;
        transition: background-color 0.2s ease;
      }

      .context-menu-item:hover {
        background-color: #f0f0f0;
      }

      .sr-only {
        position: absolute;
        width: 1px;
        height: 1px;
        padding: 0;
        margin: -1px;
        overflow: hidden;
        clip: rect(0, 0, 0, 0);
        white-space: nowrap;
        border: 0;
      }

      @keyframes float {
        0%, 100% { transform: translateY(0px); }
        50% { transform: translateY(-20px); }
      }
    `;
    document.head.appendChild(style);
  }

  // Enhance existing elements
  private enhanceExistingElements(): void {
    // Add enhanced-touch class to interactive elements
    const interactiveElements = document.querySelectorAll('button, a, input[type="button"], input[type="submit"], [role="button"]');
    interactiveElements.forEach(el => {
      el.classList.add('enhanced-touch');
    });

    // Add luxury classes where appropriate
    const luxuryElements = document.querySelectorAll('.premium, .luxury, .hero-cta, .book-button');
    luxuryElements.forEach(el => {
      el.classList.add('luxury-touch', 'luxury-interactive');
    });

    // Add animation classes
    const animateElements = document.querySelectorAll('.animate-on-scroll, .fade-in, .slide-up');
    animateElements.forEach(el => {
      el.classList.add('animate-on-scroll');
    });
  }

  // Public API methods

  // Get UX metrics
  getUXMetrics(): UXMetrics[] {
    return [...this.uxMetrics];
  }

  // Get gesture history
  getGestureHistory(): TouchGesture[] {
    return [...this.gestureHistory];
  }

  // Get configuration
  getConfiguration(): UXEnhancementConfig {
    return { ...this.config };
  }

  // Update configuration
  updateConfiguration(config: Partial<UXEnhancementConfig>): void {
    this.config = { ...this.config, ...config };
    this.updateAccessibilityStyles();
  }

  // Register custom gesture handler
  registerGestureHandler(type: string, handler: Function): void {
    if (!this.gestureHandlers.has(type)) {
      this.gestureHandlers.set(type, []);
    }
    this.gestureHandlers.get(type)!.push(handler);
  }

  // Trigger haptic feedback manually
  triggerHapticFeedback(type: 'light' | 'medium' | 'heavy'): void {
    this.triggerHaptic(type);
  }

  // Export enhancer data
  exportData(): any {
    return {
      config: this.config,
      accessibilityPrefs: this.accessibilityPrefs,
      uxMetrics: this.uxMetrics,
      gestureHistory: this.gestureHistory,
      exportTimestamp: Date.now()
    };
  }
}

// Create and export singleton instance
export const mobileUXEnhancer = MobileUXEnhancer.getInstance();

// Initialize automatically
if (typeof window !== 'undefined') {
  if (document.readyState === 'complete') {
    mobileUXEnhancer.initialize();
  } else {
    window.addEventListener('load', () => {
      mobileUXEnhancer.initialize();
    });
  }
}

// Export helper functions
export const initializeMobileUXEnhancer = (config?: Partial<UXEnhancementConfig>) =>
  mobileUXEnhancer.initialize(config);
export const getMobileUXMetrics = () => mobileUXEnhancer.getUXMetrics();
export const getMobileGestureHistory = () => mobileUXEnhancer.getGestureHistory();
export const registerMobileGestureHandler = (type: string, handler: Function) =>
  mobileUXEnhancer.registerGestureHandler(type, handler);
export const triggerMobileHapticFeedback = (type: 'light' | 'medium' | 'heavy') =>
  mobileUXEnhancer.triggerHapticFeedback(type);
export const exportMobileUXEnhancerData = () => mobileUXEnhancer.exportData();

// Export types
export {
  UXEnhancementConfig,
  TouchGesture,
  TouchPoint,
  Point,
  UXMetrics,
  AccessibilityPreferences
};