/**
 * Luxury Component Library Exports
 *
 * Premium React components with glass morphism effects, 60fps animations,
 * and WCAG AAA accessibility compliance for the Mariia Hub platform.
 */

// Core luxury components
export { LuxuryButton } from "./LuxuryButton";
export type { LuxuryButtonProps } from "./LuxuryButton";

export { LuxuryCard, LuxuryCardHeader, LuxuryCardContent, LuxuryCardFooter, LuxuryCardPricing } from "./LuxuryCard";
export type { CardProps, CardHeaderProps, CardContentProps, CardFooterProps } from "./LuxuryCard";

export { LuxuryInput } from "./LuxuryInput";
export type { InputProps } from "./LuxuryInput";

export { LuxuryModal } from "./LuxuryModal";
export type { ModalProps } from "./LuxuryModal";

export {
  LuxuryLoadingSpinner,
  LuxurySkeleton,
  LuxuryLoadingProgress,
  LuxuryPulseLoading,
  LuxuryLoadingOverlay
} from "./LuxuryLoading";
export type {
  LoadingSpinnerProps,
  SkeletonProps,
  LoadingProgressProps,
  PulseLoadingProps,
  LoadingOverlayProps
} from "./LuxuryLoading";

// Animation utilities
export {
  LUXURY_ANIMATIONS,
  ANIMATION_DURATIONS,
  EASING_FUNCTIONS,
  AnimationPerformance,
  createLuxuryAnimation,
  createSpringAnimation,
  createScrollAnimation,
  prefersReducedMotion,
  createAccessibleAnimation,
  createStaggerAnimation,
  createParallaxEffect,
  useLuxuryAnimation
} from "./animations";

// Accessibility utilities
export {
  ACCESSIBILITY_COLORS,
  FocusManager,
  ScreenReaderAnnouncer,
  KEYBOARD_NAVIGATION,
  TOUCH_TARGETS,
  useHighContrastMode,
  useReducedMotion,
  createSkipNavigation,
  ARIA_UTILS,
  setupFocusVisible,
  useAccessibility
} from "./accessibility";

// Cross-browser compatibility
export {
  BROWSER_DETECTION,
  FEATURE_DETECTION,
  POLYFILLS,
  BROWSER_OPTIMIZATIONS,
  BROWSER_TESTING,
  initializeCrossBrowserSupport
} from "./cross-browser";

// Analysis and documentation
export { ANALYSIS_SUMMARY } from "./LUXURY_COMPONENT_ANALYSIS";