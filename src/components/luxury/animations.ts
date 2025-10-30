/**
 * Performance-Optimized Animation System for Luxury Components
 *
 * This module provides utilities for creating smooth 60fps animations
 * while maintaining accessibility and cross-browser compatibility.
 */

// Animation keyframes with hardware acceleration
export const LUXURY_ANIMATIONS = {
  // Smooth fade and scale animations
  fadeInScale: {
    initial: { opacity: 0, transform: 'translateZ(0) scale(0.95)' },
    animate: { opacity: 1, transform: 'translateZ(0) scale(1)' },
    exit: { opacity: 0, transform: 'translateZ(0) scale(0.95)' },
  },

  // Slide up animation
  slideUp: {
    initial: { opacity: 0, transform: 'translateZ(0) translateY(20px)' },
    animate: { opacity: 1, transform: 'translateZ(0) translateY(0)' },
    exit: { opacity: 0, transform: 'translateZ(0) translateY(-20px)' },
  },

  // Slide from right
  slideInRight: {
    initial: { opacity: 0, transform: 'translateZ(0) translateX(100%)' },
    animate: { opacity: 1, transform: 'translateZ(0) translateX(0)' },
    exit: { opacity: 0, transform: 'translateZ(0) translateX(100%)' },
  },

  // Luxury hover effect
  luxuryHover: {
    initial: { transform: 'translateZ(0) scale(1)' },
    hover: {
      transform: 'translateZ(0) scale(1.02)',
      transition: { duration: 0.2, ease: 'easeOut' }
    },
    tap: { transform: 'translateZ(0) scale(0.98)' }
  },

  // Glass morphism entrance
  glassEntrance: {
    initial: {
      opacity: 0,
      transform: 'translateZ(0) scale(0.9)',
      backdropFilter: 'blur(0px)'
    },
    animate: {
      opacity: 1,
      transform: 'translateZ(0) scale(1)',
      backdropFilter: 'blur(20px)',
      transition: { duration: 0.4, ease: 'easeOut' }
    }
  },

  // Pulse for loading states
  pulse: {
    animate: {
      opacity: [1, 0.6, 1],
      transition: {
        duration: 1.5,
        repeat: Infinity,
        ease: 'easeInOut'
      }
    }
  },

  // Shimmer effect
  shimmer: {
    initial: { transform: 'translateZ(0) translateX(-100%)' },
    animate: {
      transform: 'translateZ(0) translateX(100%)',
      transition: { duration: 1.5, repeat: Infinity, ease: 'linear' }
    }
  },

  // Float animation for hero elements
  float: {
    animate: {
      transform: [
        'translateZ(0) translateY(0px)',
        'translateZ(0) translateY(-10px)',
        'translateZ(0) translateY(0px)'
      ],
      transition: {
        duration: 4,
        repeat: Infinity,
        ease: 'easeInOut'
      }
    }
  },

  // Glow animation
  glow: {
    animate: {
      boxShadow: [
        '0 0 20px rgba(254, 243, 199, 0.2)',
        '0 0 40px rgba(254, 243, 199, 0.4)',
        '0 0 20px rgba(254, 243, 199, 0.2)'
      ],
      transition: {
        duration: 2,
        repeat: Infinity,
        ease: 'easeInOut'
      }
    }
  }
} as const;

// Animation duration constants optimized for 60fps
export const ANIMATION_DURATIONS = {
  fast: 150,    // Fast interactions (hover, focus)
  normal: 200,  // Standard transitions
  slow: 300,    // Complex animations
  slower: 500,  // Page transitions
  slowest: 700, // Special effects
} as const;

// Easing functions for luxury feel
export const EASING_FUNCTIONS = {
  // Smooth and elegant
  easeOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
  easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
  easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',

  // Luxury bounces
  easeOutBack: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
  easeOutBounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',

  // Smooth entrance
  easeOutExpo: 'cubic-bezier(0.19, 1, 0.22, 1)',
  easeOutCirc: 'cubic-bezier(0.08, 0.82, 0.17, 1)',
} as const;

// Performance monitoring utilities
export class AnimationPerformance {
  private static frameCallbacks = new Set<() => void>();
  private static isRunning = false;

  static startMonitoring() {
    if (this.isRunning) return;
    this.isRunning = true;

    const monitorFrame = () => {
      const startTime = performance.now();

      // Execute all callbacks
      this.frameCallbacks.forEach(callback => callback());

      const endTime = performance.now();
      const frameTime = endTime - startTime;

      // Log performance warnings
      if (frameTime > 16.67) { // 60fps threshold
        console.warn(`Frame time exceeded 60fps: ${frameTime.toFixed(2)}ms`);
      }

      if (this.isRunning) {
        requestAnimationFrame(monitorFrame);
      }
    };

    requestAnimationFrame(monitorFrame);
  }

  static stopMonitoring() {
    this.isRunning = false;
  }

  static addCallback(callback: () => void) {
    this.frameCallbacks.add(callback);
  }

  static removeCallback(callback: () => void) {
    this.frameCallbacks.delete(callback);
  }
}

// Animation utility functions
export const createLuxuryAnimation = (
  element: HTMLElement,
  keyframes: Keyframe[],
  options: KeyframeAnimationOptions = {}
): Animation => {
  const defaultOptions: KeyframeAnimationOptions = {
    duration: ANIMATION_DURATIONS.normal,
    easing: EASING_FUNCTIONS.easeOut,
    fill: 'both',
  };

  return element.animate(keyframes, { ...defaultOptions, ...options });
};

// Spring animation helper
export const createSpringAnimation = (
  element: HTMLElement,
  to: Record<string, number>,
  options: {
    tension?: number;
    friction?: number;
    mass?: number;
  } = {}
) => {
  const { tension = 300, friction = 30, mass = 1 } = options;

  // Simplified spring physics
  const damping = friction / (2 * Math.sqrt(tension * mass));
  const angularFreq = Math.sqrt(tension / mass);

  return {
    duration: (1000 / angularFreq) * 4, // Duration for ~4 cycles
    easing: `cubic-bezier(0.25, ${0.46 - damping * 0.1}, 0.45, ${0.94 - damping * 0.05})`,
  };
};

// Intersection Observer for scroll animations
export const createScrollAnimation = (
  elements: HTMLElement[],
  animationName: keyof typeof LUXURY_ANIMATIONS,
  options: IntersectionObserverInit = {}
) => {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const element = entry.target as HTMLElement;
          const animation = LUXURY_ANIMATIONS[animationName];

          if (animation.animate) {
            createLuxuryAnimation(
              element,
              [animation.initial, animation.animate] as Keyframe[],
              { duration: ANIMATION_DURATIONS.slow }
            );
          }

          observer.unobserve(element);
        }
      });
    },
    {
      threshold: 0.1,
      rootMargin: '50px',
      ...options
    }
  );

  elements.forEach(element => observer.observe(element));

  return observer;
};

// Reduced motion support
export const prefersReducedMotion = (): boolean => {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
};

// Accessible animation wrapper
export const createAccessibleAnimation = (
  element: HTMLElement,
  keyframes: Keyframe[],
  options: KeyframeAnimationOptions = {}
): Animation | null => {
  if (prefersReducedMotion()) {
    // Skip animations or provide instant transition
    Object.assign(element.style, keyframes[keyframes.length - 1]);
    return null;
  }

  return createLuxuryAnimation(element, keyframes, options);
};

// Stagger animation helper for lists
export const createStaggerAnimation = (
  elements: HTMLElement[],
  baseAnimation: keyof typeof LUXURY_ANIMATIONS,
  staggerDelay: number = 100
) => {
  const animation = LUXURY_ANIMATIONS[baseAnimation];

  return elements.map((element, index) =>
    createLuxuryAnimation(
      element,
      [animation.initial, animation.animate] as Keyframe[],
      {
        delay: index * staggerDelay,
        duration: ANIMATION_DURATIONS.slow,
        easing: EASING_FUNCTIONS.easeOut
      }
    )
  );
};

// Parallax scrolling effect
export const createParallaxEffect = (
  element: HTMLElement,
  intensity: number = 0.5
) => {
  let ticking = false;

  const updateTransform = () => {
    const scrolled = window.pageYOffset;
    const rate = scrolled * -intensity;
    const yPos = `translate3d(0, ${rate}px, 0)`;

    element.style.transform = yPos;
    ticking = false;
  };

  const requestTick = () => {
    if (!ticking) {
      window.requestAnimationFrame(updateTransform);
      ticking = true;
    }
  };

  window.addEventListener('scroll', requestTick, { passive: true });

  return () => {
    window.removeEventListener('scroll', requestTick);
  };
};

// Export animation utilities for React components
export const useLuxuryAnimation = (
  ref: React.RefObject<HTMLElement>,
  animationName: keyof typeof LUXURY_ANIMATIONS,
  trigger: boolean = true
) => {
  React.useEffect(() => {
    if (!ref.current || !trigger) return;

    const element = ref.current;
    const animation = LUXURY_ANIMATIONS[animationName];

    const animationInstance = createAccessibleAnimation(
      element,
      [animation.initial, animation.animate] as Keyframe[],
      { duration: ANIMATION_DURATIONS.slow }
    );

    return () => {
      animationInstance?.cancel();
    };
  }, [ref, animationName, trigger]);
};