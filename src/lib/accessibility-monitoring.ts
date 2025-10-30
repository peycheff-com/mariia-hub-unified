/**
 * Comprehensive Accessibility Monitoring System
 * WCAG AA compliance tracking for luxury beauty and fitness platform
 */

import { trackRUMEvent } from './rum';
import { reportMessage } from './sentry';

// WCAG AA compliance thresholds and requirements
const WCAG_AA_THRESHOLDS = {
  // Color contrast requirements
  CONTRAST_NORMAL_TEXT: 4.5,      // 4.5:1 for normal text
  CONTRAST_LARGE_TEXT: 3.0,       // 3.0:1 for large text (18pt+)
  CONTRAST_NON_TEXT: 3.0,         // 3.0:1 for non-text elements

  // Target size requirements
  MIN_TARGET_SIZE: 24,             // 24x24 CSS pixels minimum
  RECOMMENDED_TARGET_SIZE: 44,     // 44x44 CSS pixels recommended

  // Focus requirements
  FOCUS_VISIBLE_TIMEOUT: 1000,     // 1 second to show focus state

  // Reading level
  MAX_READING_TIME: 8,             // 8th grade reading level max

  // Error identification
  ERROR_IDENTIFICATION_TIME: 5000, // 5 seconds to identify errors

  // Timeout adjustments
  MIN_TIMEOUT_EXTENSION: 20,       // 20x default timeout minimum
};

// Accessibility issue categories
enum AccessibilityCategory {
  COLOR_CONTRAST = 'color_contrast',
  KEYBOARD_NAVIGATION = 'keyboard_navigation',
  SCREEN_READER = 'screen_reader',
  FOCUS_MANAGEMENT = 'focus_management',
  TARGET_SIZE = 'target_size',
  ALT_TEXT = 'alt_text',
  HEADING_STRUCTURE = 'heading_structure',
  FORM_LABELS = 'form_labels',
  ARIA_LANDMARKS = 'aria_landmarks',
  READING_LEVEL = 'reading_level',
  MOTION_ANIMATION = 'motion_animation',
  COLOR_ONLY = 'color_only',
  AUDIO_DESCRIPTION = 'audio_description',
  CAPTIONING = 'captioning'
}

enum AccessibilitySeverity {
  LOW = 'low',          // Minor issue, affects few users
  MEDIUM = 'medium',    // Moderate issue, affects some users
  HIGH = 'high',        // Major issue, affects many users
  CRITICAL = 'critical' // Blocks access for some users
}

// Accessibility issue data structure
interface AccessibilityIssue {
  id: string;
  category: AccessibilityCategory;
  severity: AccessibilitySeverity;
  element: Element;
  description: string;
  wcagCriterion: string;
  impact: string;
  recommendation: string;
  timestamp: number;
  url: string;
  userAgent: string;
  assistiveTechnologyDetected: boolean;
  context: Record<string, any>;
}

// Assistive technology detection
interface AssistiveTechnologyData {
  screenReaderActive: boolean;
  keyboardNavigationActive: boolean;
  voiceControlActive: boolean;
  switchNavigationActive: boolean;
  highContrastMode: boolean;
  reducedMotion: boolean;
  fontSizeIncreased: boolean;
  browserTools: string[];
}

// Accessibility Monitor Class
export class AccessibilityMonitor {
  private issues: AccessibilityIssue[] = [];
  private assistiveTech: AssistiveTechnologyData;
  private isInitialized = false;
  private monitoringInterval: NodeJS.Timeout | null = null;
  private keyboardNavigationTimer: NodeJS.Timeout | null = null;
  private focusTracker: FocusTracker;
  private colorContrastAnalyzer: ColorContrastAnalyzer;
  private formAccessibilityValidator: FormAccessibilityValidator;

  constructor() {
    this.assistiveTech = this.detectAssistiveTechnology();
    this.focusTracker = new FocusTracker();
    this.colorContrastAnalyzer = new ColorContrastAnalyzer();
    this.formAccessibilityValidator = new FormAccessibilityValidator();
  }

  // Initialize accessibility monitoring
  initialize(): void {
    if (this.isInitialized) return;

    try {
      this.detectAssistiveTechnology();
      this.initializeAutomatedTesting();
      this.initializeKeyboardNavigationTracking();
      this.initializeScreenReaderMonitoring();
      this.initializeColorContrastMonitoring();
      this.initializeFormAccessibilityMonitoring();
      this.initializeFocusManagementMonitoring();
      this.initializeTargetSizeMonitoring();
      this.initializeHeadingStructureMonitoring();
      this.initializeARIALandmarkMonitoring();
      this.initializeMotionAndAnimationMonitoring();
      this.initializeContinuousMonitoring();

      this.isInitialized = true;
      console.log('[Accessibility Monitor] Accessibility monitoring initialized');

      // Run initial accessibility audit
      this.runAccessibilityAudit();
    } catch (error) {
      console.warn('[Accessibility Monitor] Failed to initialize:', error);
    }
  }

  // Detect assistive technology usage
  private detectAssistiveTechnology(): AssistiveTechnologyData {
    const data: AssistiveTechnologyData = {
      screenReaderActive: false,
      keyboardNavigationActive: false,
      voiceControlActive: false,
      switchNavigationActive: false,
      highContrastMode: false,
      reducedMotion: false,
      fontSizeIncreased: false,
      browserTools: []
    };

    // Screen reader detection
    if (window.speechSynthesis || window.SpeechSynthesisUtterance) {
      data.screenReaderActive = true;
      data.browserTools.push('speech-synthesis');
    }

    // Check for common screen reader indicators
    if (navigator.userAgent.includes('NVDA') || navigator.userAgent.includes('JAWS')) {
      data.screenReaderActive = true;
    }

    // High contrast mode detection
    if (window.matchMedia && window.matchMedia('(prefers-contrast: high)').matches) {
      data.highContrastMode = true;
    }

    // Reduced motion detection
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      data.reducedMotion = true;
    }

    // Font size detection
    const fontSize = parseFloat(window.getComputedStyle(document.body).fontSize);
    if (fontSize > 16) { // Default is usually 16px
      data.fontSizeIncreased = true;
    }

    // Keyboard navigation detection
    document.addEventListener('keydown', () => {
      data.keyboardNavigationActive = true;
    }, { once: true });

    this.assistiveTech = data;
    return data;
  }

  // Initialize automated testing
  private initializeAutomatedTesting(): void {
    // Test color contrast on page load
    window.addEventListener('load', () => {
      setTimeout(() => this.testColorContrast(), 1000);
    });

    // Test form accessibility
    this.testFormAccessibility();

    // Test heading structure
    this.testHeadingStructure();

    // Test ARIA landmarks
    this.testARIALandmarks();
  }

  // Initialize keyboard navigation tracking
  private initializeKeyboardNavigationTracking(): void {
    let keyboardSequence: KeyboardEvent[] = [];
    let lastKeyboardActivity = Date.now();

    document.addEventListener('keydown', (event) => {
      keyboardSequence.push(event);
      lastKeyboardActivity = Date.now();

      // Track keyboard navigation patterns
      if (event.key === 'Tab') {
        this.trackTabNavigation(event);
      }

      if (event.key === 'Enter' || event.key === ' ') {
        this.trackKeyboardActivation(event);
      }

      // Keep only last 50 keyboard events
      if (keyboardSequence.length > 50) {
        keyboardSequence = keyboardSequence.slice(-50);
      }
    });

    // Monitor for keyboard-only navigation
    this.monitorKeyboardOnlyNavigation();
  }

  // Track tab navigation
  private trackTabNavigation(event: KeyboardEvent): void {
    const focusedElement = document.activeElement;
    if (!focusedElement) return;

    const tabNavigationData = {
      timestamp: Date.now(),
      shiftKey: event.shiftKey,
      focusedElement: {
        tagName: focusedElement.tagName,
        id: focusedElement.id,
        className: focusedElement.className,
        tabIndex: focusedElement.tabIndex
      },
      isFocusable: this.isFocusable(focusedElement),
      hasVisibleFocus: this.hasVisibleFocus(focusedElement),
      pageType: this.getPageType()
    };

    trackRUMEvent('keyboard-tab-navigation', tabNavigationData);

    // Check for focus issues
    if (!tabNavigationData.isFocusable || !tabNavigationData.hasVisibleFocus) {
      this.reportAccessibilityIssue({
        category: AccessibilityCategory.FOCUS_MANAGEMENT,
        severity: AccessibilitySeverity.HIGH,
        element: focusedElement,
        description: 'Keyboard navigation reached non-focusable or non-visible element',
        wcagCriterion: '2.1.1 Keyboard',
        impact: 'Keyboard users cannot navigate to this element',
        recommendation: 'Ensure the element is focusable and has visible focus styles'
      });
    }
  }

  // Track keyboard activation
  private trackKeyboardActivation(event: KeyboardEvent): void {
    const activatedElement = document.activeElement;
    if (!activatedElement) return;

    trackRUMEvent('keyboard-activation', {
      timestamp: Date.now(),
      key: event.key,
      elementType: activatedElement.tagName,
      hasOnClick: !!(activatedElement as any).onclick,
      hasAriaPressed: activatedElement.hasAttribute('aria-pressed'),
      role: activatedElement.getAttribute('role')
    });
  }

  // Monitor keyboard-only navigation
  private monitorKeyboardOnlyNavigation(): void {
    let mouseUsed = false;

    document.addEventListener('mousedown', () => {
      mouseUsed = true;
    });

    document.addEventListener('keydown', () => {
      if (!mouseUsed) {
        // User is navigating with keyboard only
        trackRUMEvent('keyboard-only-navigation', {
          timestamp: Date.now(),
          currentElement: document.activeElement?.tagName,
          hasVisibleFocusIndicator: this.hasVisibleFocus(document.activeElement)
        });
      }
    });

    // Reset mouse usage flag periodically
    setInterval(() => {
      mouseUsed = false;
    }, 30000);
  }

  // Initialize screen reader monitoring
  private initializeScreenReaderMonitoring(): void {
    // Monitor for ARIA live regions
    this.monitorAriaLiveRegions();

    // Monitor for screen reader announcements
    this.monitorScreenReaderAnnouncements();

    // Track alt text usage
    this.trackAltTextUsage();

    // Monitor for semantic HTML usage
    this.monitorSemanticHTML();
  }

  // Monitor ARIA live regions
  private monitorAriaLiveRegions(): void {
    const liveRegions = document.querySelectorAll('[aria-live], [aria-atomic], [aria-relevant]');

    liveRegions.forEach(region => {
      const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          if (mutation.type === 'childList' || mutation.type === 'characterData') {
            trackRUMEvent('aria-live-region-update', {
              timestamp: Date.now(),
              element: region.tagName,
              liveAttribute: region.getAttribute('aria-live'),
              atomicAttribute: region.getAttribute('aria-atomic'),
              content: region.textContent?.substring(0, 100)
            });
          }
        });
      });

      observer.observe(region, {
        childList: true,
        characterData: true,
        subtree: true
      });
    });
  }

  // Monitor screen reader announcements
  private monitorScreenReaderAnnouncements(): void {
    // Monitor for elements that should be announced to screen readers
    const announcableElements = document.querySelectorAll('[role="alert"], [role="status"], [aria-live]');

    announcableElements.forEach(element => {
      if (element.textContent?.trim()) {
        trackRUMEvent('screen-reader-announcement', {
          timestamp: Date.now(),
          role: element.getAttribute('role'),
          content: element.textContent,
          livePoliteness: element.getAttribute('aria-live')
        });
      }
    });
  }

  // Track alt text usage
  private trackAltTextUsage(): void {
    const images = document.querySelectorAll('img');

    images.forEach(img => {
      const hasAlt = img.hasAttribute('alt');
      const altText = img.getAttribute('alt');
      const isDecorative = altText === '';
      const isInformative = hasAlt && altText && altText.length > 0;

      const altTextData = {
        timestamp: Date.now(),
        src: img.src,
        hasAlt: hasAlt,
        altText: altText,
        isDecorative: isDecorative,
        isInformative: isInformative,
        pageType: this.getPageType()
      };

      trackRUMEvent('alt-text-analysis', altTextData);

      // Report missing alt text for informative images
      if (!hasAlt && !img.closest('[role="img"]')) {
        this.reportAccessibilityIssue({
          category: AccessibilityCategory.ALT_TEXT,
          severity: AccessibilitySeverity.HIGH,
          element: img,
          description: 'Informative image missing alt text',
          wcagCriterion: '1.1.1 Non-text Content',
          impact: 'Screen reader users cannot understand image content',
          recommendation: 'Add descriptive alt text to the image'
        });
      }
    });
  }

  // Monitor semantic HTML usage
  private monitorSemanticHTML(): void {
    // Check for proper heading hierarchy
    const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
    let previousLevel = 0;

    headings.forEach((heading, index) => {
      const currentLevel = parseInt(heading.tagName.substring(1));

      if (index > 0 && currentLevel > previousLevel + 1) {
        this.reportAccessibilityIssue({
          category: AccessibilityCategory.HEADING_STRUCTURE,
          severity: AccessibilitySeverity.MEDIUM,
          element: heading,
          description: `Heading level skipped: from H${previousLevel} to H${currentLevel}`,
          wcagCriterion: '1.3.1 Info and Relationships',
          impact: 'Screen reader users may lose context in document structure',
          recommendation: 'Do not skip heading levels; use sequential headings'
        });
      }

      previousLevel = currentLevel;
    });

    // Check for proper landmark usage
    const landmarks = document.querySelectorAll('main, nav, header, footer, aside, section');
    if (landmarks.length === 0) {
      this.reportAccessibilityIssue({
        category: AccessibilityCategory.ARIA_LANDMARKS,
        severity: AccessibilitySeverity.MEDIUM,
        element: document.body,
        description: 'No ARIA landmarks found',
        wcagCriterion: '1.3.6 Identify Purpose',
        impact: 'Screen reader users cannot easily navigate page sections',
        recommendation: 'Add semantic HTML landmarks (main, nav, header, footer, etc.)'
      });
    }
  }

  // Initialize color contrast monitoring
  private initializeColorContrastMonitoring(): void {
    // Monitor dynamic content for contrast issues
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'childList') {
          mutation.addedNodes.forEach((node) => {
            if (node.nodeType === Node.ELEMENT_NODE) {
              this.testColorContrastForElement(node as Element);
            }
          });
        }
      });
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  // Test color contrast
  private testColorContrast(): void {
    const elements = document.querySelectorAll('*');
    const textElements = Array.from(elements).filter(el =>
      el.textContent?.trim() &&
      !this.isElementHidden(el) &&
      window.getComputedStyle(el).fontSize !== '0px'
    );

    textElements.forEach(element => {
      this.testColorContrastForElement(element);
    });
  }

  // Test color contrast for element
  private testColorContrastForElement(element: Element): void {
    if (!element.textContent?.trim()) return;

    try {
      const styles = window.getComputedStyle(element);
      const color = styles.color;
      const backgroundColor = styles.backgroundColor;

      if (color && backgroundColor && backgroundColor !== 'rgba(0, 0, 0, 0)') {
        const contrast = this.colorContrastAnalyzer.calculateContrast(color, backgroundColor);
        const fontSize = parseFloat(styles.fontSize);
        const isLargeText = fontSize >= 18 || (fontSize >= 14 && parseInt(styles.fontWeight) >= 700);
        const requiredContrast = isLargeText ? WCAG_AA_THRESHOLDS.CONTRAST_LARGE_TEXT : WCAG_AA_THRESHOLDS.CONTRAST_NORMAL_TEXT;

        const contrastData = {
          timestamp: Date.now(),
          element: element.tagName,
          contrast: contrast,
          requiredContrast: requiredContrast,
          isLargeText: isLargeText,
          passes: contrast >= requiredContrast,
          color: color,
          backgroundColor: backgroundColor
        };

        trackRUMEvent('color-contrast-test', contrastData);

        if (contrast < requiredContrast) {
          this.reportAccessibilityIssue({
            category: AccessibilityCategory.COLOR_CONTRAST,
            severity: AccessibilitySeverity.HIGH,
            element: element,
            description: `Insufficient color contrast: ${contrast.toFixed(2)}:1 (required: ${requiredContrast}:1)`,
            wcagCriterion: '1.4.3 Contrast (Minimum)',
            impact: 'Users with low vision cannot read text content',
            recommendation: 'Increase color contrast to meet WCAG AA requirements'
          });
        }
      }
    } catch (error) {
      // Ignore color calculation errors
    }
  }

  // Initialize form accessibility monitoring
  private initializeFormAccessibilityMonitoring(): void {
    const forms = document.querySelectorAll('form');

    forms.forEach(form => {
      // Monitor form submissions for validation errors
      form.addEventListener('submit', (event) => {
        this.trackFormSubmission(form, event);
      });

      // Monitor form field interactions
      const inputs = form.querySelectorAll('input, select, textarea');
      inputs.forEach(input => {
        input.addEventListener('blur', () => {
          this.trackFormFieldInteraction(input);
        });
      });
    });
  }

  // Test form accessibility
  private testFormAccessibility(): void {
    const inputs = document.querySelectorAll('input, select, textarea');

    inputs.forEach(input => {
      // Check for labels
      const hasLabel = this.hasProperLabel(input);
      if (!hasLabel) {
        this.reportAccessibilityIssue({
          category: AccessibilityCategory.FORM_LABELS,
          severity: AccessibilitySeverity.HIGH,
          element: input,
          description: 'Form input missing proper label',
          wcagCriterion: '3.3.2 Labels or Instructions',
          impact: 'Screen reader users cannot understand input purpose',
          recommendation: 'Add proper label or aria-label to the input'
        });
      }

      // Check for required field indicators
      if (input.hasAttribute('required')) {
        const hasAriaRequired = input.hasAttribute('aria-required');
        if (!hasAriaRequired) {
          this.reportAccessibilityIssue({
            category: AccessibilityCategory.FORM_LABELS,
            severity: AccessibilitySeverity.MEDIUM,
            element: input,
            description: 'Required field missing aria-required attribute',
            wcagCriterion: '3.3.2 Labels or Instructions',
            impact: 'Screen reader users may not know field is required',
            recommendation: 'Add aria-required="true" to required fields'
          });
        }
      }
    });
  }

  // Track form submission
  private trackFormSubmission(form: HTMLFormElement, event: Event): void {
    const submissionData = {
      timestamp: Date.now(),
      formId: form.id,
      hasValidation: !form.noValidate,
      fieldCount: form.querySelectorAll('input, select, textarea').length,
      hasRequiredFields: form.querySelectorAll('[required]').length > 0,
      validationErrors: this.detectValidationErrors(form)
    };

    trackRUMEvent('form-submission', submissionData);

    // Monitor for validation errors
    if (submissionData.validationErrors.length > 0) {
      this.trackValidationErrors(submissionData.validationErrors);
    }
  }

  // Track form field interaction
  private trackFormFieldInteraction(input: Element): void {
    const interactionData = {
      timestamp: Date.now(),
      inputType: input.tagName,
      inputId: input.id,
      hasLabel: this.hasProperLabel(input),
      hasPlaceholder: input.hasAttribute('placeholder'),
      hasAriaLabel: input.hasAttribute('aria-label'),
      hasAriaLabelledBy: input.hasAttribute('aria-labelledby'),
      isRequired: input.hasAttribute('required'),
      hasAriaRequired: input.hasAttribute('aria-required')
    };

    trackRUMEvent('form-field-interaction', interactionData);
  }

  // Initialize focus management monitoring
  private initializeFocusManagementMonitoring(): void {
    // Track focus changes
    document.addEventListener('focusin', (event) => {
      this.focusTracker.trackFocusIn(event.target as Element);
    });

    document.addEventListener('focusout', (event) => {
      this.focusTracker.trackFocusOut(event.target as Element);
    });

    // Monitor focus traps in modals
    this.monitorFocusTraps();
  }

  // Monitor focus traps
  private monitorFocusTraps(): void {
    const modals = document.querySelectorAll('[role="dialog"], .modal, [aria-modal="true"]');

    modals.forEach(modal => {
      // Check if modal has proper focus management
      const focusableElements = modal.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );

      if (focusableElements.length === 0 && modal.textContent?.trim()) {
        this.reportAccessibilityIssue({
          category: AccessibilityCategory.FOCUS_MANAGEMENT,
          severity: AccessibilitySeverity.HIGH,
          element: modal,
          description: 'Modal has no focusable elements',
          wcagCriterion: '2.1.2 No Keyboard Trap',
          impact: 'Keyboard users cannot interact with modal content',
          recommendation: 'Ensure modal has at least one focusable element'
        });
      }
    });
  }

  // Initialize target size monitoring
  private initializeTargetSizeMonitoring(): void {
    const interactiveElements = document.querySelectorAll(
      'button, a, input[type="button"], input[type="submit"], [role="button"], [onclick]'
    );

    interactiveElements.forEach(element => {
      const rect = element.getBoundingClientRect();
      const width = rect.width;
      const height = rect.height;
      const minSize = WCAG_AA_THRESHOLDS.MIN_TARGET_SIZE;
      const recommendedSize = WCAG_AA_THRESHOLDS.RECOMMENDED_TARGET_SIZE;

      const targetSizeData = {
        timestamp: Date.now(),
        element: element.tagName,
        width: width,
        height: height,
        meetsMinimum: width >= minSize && height >= minSize,
        meetsRecommended: width >= recommendedSize && height >= recommendedSize,
        pageType: this.getPageType()
      };

      trackRUMEvent('target-size-analysis', targetSizeData);

      if (!targetSizeData.meetsMinimum) {
        this.reportAccessibilityIssue({
          category: AccessibilityCategory.TARGET_SIZE,
          severity: AccessibilitySeverity.MEDIUM,
          element: element,
          description: `Target size too small: ${width.toFixed(0)}x${height.toFixed(0)}px (minimum: ${minSize}x${minSize}px)`,
          wcagCriterion: '2.5.5 Target Size',
          impact: 'Users with motor impairments may have difficulty activating the control',
          recommendation: 'Increase target size to at least 24x24 CSS pixels'
        });
      }
    });
  }

  // Initialize heading structure monitoring
  private testHeadingStructure(): void {
    // This is called from initializeAutomatedTesting
    // Additional heading structure tests can be added here
  }

  // Initialize ARIA landmark monitoring
  private testARIALandmarks(): void {
    // This is called from initializeAutomatedTesting
    // Additional landmark tests can be added here
  }

  // Initialize motion and animation monitoring
  private initializeMotionAndAnimationMonitoring(): void {
    // Check for reduced motion preference
    if (this.assistiveTech.reducedMotion) {
      this.testReducedMotionCompliance();
    }

    // Monitor for autoplay animations
    this.monitorAutoplayAnimations();
  }

  // Test reduced motion compliance
  private testReducedMotionCompliance(): void {
    const animatedElements = document.querySelectorAll('[class*="animate"], [class*="transition"], [style*="animation"]');

    animatedElements.forEach(element => {
      const styles = window.getComputedStyle(element);
      const hasAnimation = styles.animation !== 'none' || styles.transition !== 'none';

      if (hasAnimation) {
        const motionData = {
          timestamp: Date.now(),
          element: element.tagName,
          hasAnimation: hasAnimation,
          animationName: styles.animationName,
          hasPrefersReducedMotion: this.assistiveTech.reducedMotion,
          respectsReducedMotion: styles.animationDuration === '0s' || styles.transitionDuration === '0s'
        };

        trackRUMEvent('motion-animation-analysis', motionData);

        if (!motionData.respectsReducedMotion) {
          this.reportAccessibilityIssue({
            category: AccessibilityCategory.MOTION_ANIMATION,
            severity: AccessibilitySeverity.MEDIUM,
            element: element,
            description: 'Animation does not respect prefers-reduced-motion',
            wcagCriterion: '2.3.3 Animation from Interactions',
            impact: 'Users with vestibular disorders may experience discomfort',
            recommendation: 'Respect prefers-reduced-motion media query'
          });
        }
      }
    });
  }

  // Monitor autoplay animations
  private monitorAutoplayAnimations(): void {
    const videos = document.querySelectorAll('video');
    const animatedGifs = document.querySelectorAll('img[src*=".gif"]');

    // Check for autoplay videos
    videos.forEach(video => {
      if (video.autoplay && !video.muted) {
        this.reportAccessibilityIssue({
          category: AccessibilityCategory.MOTION_ANIMATION,
          severity: AccessibilitySeverity.HIGH,
          element: video,
          description: 'Autoplay video with audio detected',
          wcagCriterion: '1.4.2 Audio Control',
          impact: 'Unexpected audio can disorient users',
          recommendation: 'Do not autoplay video with audio, or provide controls'
        });
      }
    });
  }

  // Initialize continuous monitoring
  private initializeContinuousMonitoring(): void {
    // Run accessibility checks periodically
    this.monitoringInterval = setInterval(() => {
      this.runQuickAccessibilityCheck();
    }, 30000); // Every 30 seconds

    // Monitor page changes
    this.monitorPageChanges();
  }

  // Run quick accessibility check
  private runQuickAccessibilityCheck(): void {
    // Quick checks that don't impact performance
    this.checkForNewImagesWithoutAlt();
    this.checkForNewFocusIssues();
    this.checkForNewColorContrastIssues();
  }

  // Monitor page changes
  private monitorPageChanges(): void {
    const observer = new MutationObserver((mutations) => {
      let shouldRecheck = false;

      mutations.forEach((mutation) => {
        if (mutation.type === 'childList') {
          mutation.addedNodes.forEach((node) => {
            if (node.nodeType === Node.ELEMENT_NODE) {
              const element = node as Element;
              if (element.tagName === 'IMG' || element.tagName === 'BUTTON' || element.tagName === 'A') {
                shouldRecheck = true;
              }
            }
          });
        }
      });

      if (shouldRecheck) {
        setTimeout(() => this.runQuickAccessibilityCheck(), 1000);
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  // Run comprehensive accessibility audit
  private runAccessibilityAudit(): void {
    console.log('[Accessibility Monitor] Running comprehensive accessibility audit');

    this.testColorContrast();
    this.testFormAccessibility();
    this.testHeadingStructure();
    this.testARIALandmarks();
    this.initializeTargetSizeMonitoring();
    this.testReducedMotionCompliance();

    const auditData = {
      timestamp: Date.now(),
      totalIssues: this.issues.length,
      issuesByCategory: this.getIssuesByCategory(),
      issuesBySeverity: this.getIssuesBySeverity(),
      assistiveTechnology: this.assistiveTech,
      wcagComplianceScore: this.calculateWCAGComplianceScore()
    };

    trackRUMEvent('accessibility-audit-completed', auditData);

    // Report critical issues
    const criticalIssues = this.issues.filter(issue => issue.severity === AccessibilitySeverity.CRITICAL);
    if (criticalIssues.length > 0) {
      reportMessage(`Critical accessibility issues detected: ${criticalIssues.length}`, 'error', {
        issues: criticalIssues.map(issue => ({
          category: issue.category,
          description: issue.description,
          element: issue.element.tagName
        }))
      });
    }
  }

  // Check for new images without alt
  private checkForNewImagesWithoutAlt(): void {
    const images = document.querySelectorAll('img:not([data-alt-checked])');
    images.forEach(img => {
      img.setAttribute('data-alt-checked', 'true');
      if (!img.hasAttribute('alt') && !img.closest('[role="img"]')) {
        this.reportAccessibilityIssue({
          category: AccessibilityCategory.ALT_TEXT,
          severity: AccessibilitySeverity.HIGH,
          element: img,
          description: 'New image missing alt text',
          wcagCriterion: '1.1.1 Non-text Content',
          impact: 'Screen reader users cannot understand image content',
          recommendation: 'Add descriptive alt text to the image'
        });
      }
    });
  }

  // Check for new focus issues
  private checkForNewFocusIssues(): void {
    const focusableElements = document.querySelectorAll('button, a, input, select, textarea, [tabindex]:not([tabindex="-1"]):not([data-focus-checked])');
    focusableElements.forEach(element => {
      element.setAttribute('data-focus-checked', 'true');

      const styles = window.getComputedStyle(element);
      const hasFocusStyles = styles.outline !== 'none' || styles.boxShadow !== 'none';

      if (!hasFocusStyles && !element.hasAttribute('data-focus-styles-checked')) {
        element.setAttribute('data-focus-styles-checked', 'true');

        // Check if element has custom focus styles in CSS
        const hasCustomFocus = this.hasCustomFocusStyles(element);

        if (!hasCustomFocus) {
          this.reportAccessibilityIssue({
            category: AccessibilityCategory.FOCUS_MANAGEMENT,
            severity: AccessibilitySeverity.MEDIUM,
            element: element,
            description: 'Focusable element may lack visible focus indicator',
            wcagCriterion: '2.4.7 Focus Visible',
            impact: 'Keyboard users cannot see which element is focused',
            recommendation: 'Add visible focus styles for keyboard navigation'
          });
        }
      }
    });
  }

  // Check for new color contrast issues
  private checkForNewColorContrastIssues(): void {
    const textElements = document.querySelectorAll('p, h1, h2, h3, h4, h5, h6, span, div:not([data-contrast-checked])');
    textElements.forEach(element => {
      if (element.textContent?.trim() && !this.isElementHidden(element)) {
        element.setAttribute('data-contrast-checked', 'true');
        this.testColorContrastForElement(element);
      }
    });
  }

  // Report accessibility issue
  private reportAccessibilityIssue(issueData: Partial<AccessibilityIssue>): void {
    const issue: AccessibilityIssue = {
      id: this.generateIssueId(),
      category: issueData.category!,
      severity: issueData.severity!,
      element: issueData.element!,
      description: issueData.description!,
      wcagCriterion: issueData.wcagCriterion!,
      impact: issueData.impact!,
      recommendation: issueData.recommendation!,
      timestamp: Date.now(),
      url: window.location.href,
      userAgent: navigator.userAgent,
      assistiveTechnologyDetected: this.assistiveTech.screenReaderActive || this.assistiveTech.keyboardNavigationActive,
      context: issueData.context || {}
    };

    // Check for duplicates
    const isDuplicate = this.issues.some(existingIssue =>
      existingIssue.category === issue.category &&
      existingIssue.element === issue.element &&
      existingIssue.description === issue.description
    );

    if (!isDuplicate) {
      this.issues.push(issue);

      trackRUMEvent('accessibility-issue-detected', {
        issueId: issue.id,
        category: issue.category,
        severity: issue.severity,
        wcagCriterion: issue.wcagCriterion,
        element: issue.element.tagName,
        pageType: this.getPageType()
      });
    }
  }

  // Helper methods

  private hasProperLabel(input: Element): boolean {
    // Check for explicit label
    const label = document.querySelector(`label[for="${input.id}"]`);
    if (label) return true;

    // Check for aria-label
    if (input.hasAttribute('aria-label') && input.getAttribute('aria-label')?.trim()) {
      return true;
    }

    // Check for aria-labelledby
    if (input.hasAttribute('aria-labelledby')) {
      const labelledBy = input.getAttribute('aria-labelledby');
      if (labelledBy && document.getElementById(labelledBy)) {
        return true;
      }
    }

    // Check for implicit label (input is inside label)
    const parentLabel = input.closest('label');
    if (parentLabel) return true;

    return false;
  }

  private detectValidationErrors(form: HTMLFormElement): Element[] {
    const errors: Element[] = [];
    const inputs = form.querySelectorAll('input, select, textarea');

    inputs.forEach(input => {
      if (input.classList.contains('error') || input.getAttribute('aria-invalid') === 'true') {
        errors.push(input);
      }
    });

    return errors;
  }

  private trackValidationErrors(errorElements: Element[]): void {
    errorElements.forEach(element => {
      trackRUMEvent('form-validation-error', {
        timestamp: Date.now(),
        elementType: element.tagName,
        inputId: element.id,
        hasErrorMessage: !!document.querySelector(`[aria-describedby*="${element.id}"]`),
        hasAriaInvalid: element.hasAttribute('aria-invalid'),
        pageType: this.getPageType()
      });
    });
  }

  private isElementHidden(element: Element): boolean {
    const styles = window.getComputedStyle(element);
    return styles.display === 'none' ||
           styles.visibility === 'hidden' ||
           styles.opacity === '0' ||
           element.getAttribute('aria-hidden') === 'true';
  }

  private isFocusable(element: Element): boolean {
    if (element.hasAttribute('disabled')) return false;
    if (element.getAttribute('tabindex') === '-1') return false;

    const tagName = element.tagName.toLowerCase();
    const focusableTags = ['a', 'button', 'input', 'select', 'textarea'];

    return focusableTags.includes(tagName) ||
           element.hasAttribute('tabindex') ||
           element.hasAttribute('contenteditable');
  }

  private hasVisibleFocus(element: Element | null): boolean {
    if (!element) return false;

    const styles = window.getComputedStyle(element);
    return styles.outline !== 'none' ||
           styles.boxShadow !== 'none' ||
           element.getAttribute('data-focus-visible') === 'true';
  }

  private hasCustomFocusStyles(element: Element): boolean {
    // This is a simplified check - in practice, you'd need to parse CSS
    const styleSheets = Array.from(document.styleSheets);

    for (const sheet of styleSheets) {
      try {
        const rules = Array.from(sheet.cssRules || sheet.rules || []);

        for (const rule of rules) {
          if (rule instanceof CSSStyleRule) {
            if (rule.selectorText.includes(':focus') &&
                rule.style.cssText.length > 0) {
              return true;
            }
          }
        }
      } catch (e) {
        // CORS issues may prevent reading some stylesheets
      }
    }

    return false;
  }

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
    return `a11y_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private getIssuesByCategory(): Record<AccessibilityCategory, number> {
    const categoryCounts = {} as Record<AccessibilityCategory, number>;

    Object.values(AccessibilityCategory).forEach(category => {
      categoryCounts[category] = this.issues.filter(issue => issue.category === category).length;
    });

    return categoryCounts;
  }

  private getIssuesBySeverity(): Record<AccessibilitySeverity, number> {
    const severityCounts = {} as Record<AccessibilitySeverity, number>;

    Object.values(AccessibilitySeverity).forEach(severity => {
      severityCounts[severity] = this.issues.filter(issue => issue.severity === severity).length;
    });

    return severityCounts;
  }

  private calculateWCAGComplianceScore(): number {
    const totalElements = document.querySelectorAll('*').length;
    const criticalIssues = this.issues.filter(issue => issue.severity === AccessibilitySeverity.CRITICAL).length;
    const highIssues = this.issues.filter(issue => issue.severity === AccessibilitySeverity.HIGH).length;

    // Simple scoring: penalize critical and high issues
    const deductions = (criticalIssues * 20) + (highIssues * 10);
    const score = Math.max(0, 100 - deductions);

    return Math.round(score);
  }

  // Public API methods

  // Get accessibility analytics
  getAccessibilityAnalytics(): any {
    return {
      totalIssues: this.issues.length,
      issuesByCategory: this.getIssuesByCategory(),
      issuesBySeverity: this.getIssuesBySeverity(),
      wcagComplianceScore: this.calculateWCAGComplianceScore(),
      assistiveTechnologyDetected: this.assistiveTech,
      lastAuditTime: this.issues.length > 0 ? Math.max(...this.issues.map(i => i.timestamp)) : null,
      pageType: this.getPageType()
    };
  }

  // Get detailed accessibility report
  getAccessibilityReport(): any {
    return {
      summary: this.getAccessibilityAnalytics(),
      issues: this.issues.map(issue => ({
        id: issue.id,
        category: issue.category,
        severity: issue.severity,
        description: issue.description,
        wcagCriterion: issue.wcagCriterion,
        impact: issue.impact,
        recommendation: issue.recommendation,
        element: {
          tagName: issue.element.tagName,
          id: issue.element.id,
          className: issue.element.className,
          textContent: issue.element.textContent?.substring(0, 100)
        },
        timestamp: issue.timestamp
      })),
      assistiveTechnology: this.assistiveTech,
      recommendations: this.generateRecommendations()
    };
  }

  // Generate recommendations
  private generateRecommendations(): string[] {
    const recommendations: string[] = [];
    const categoryCounts = this.getIssuesByCategory();

    if (categoryCounts[AccessibilityCategory.COLOR_CONTRAST] > 0) {
      recommendations.push('Review and improve color contrast ratios throughout the application');
    }

    if (categoryCounts[AccessibilityCategory.FOCUS_MANAGEMENT] > 0) {
      recommendations.push('Enhance keyboard navigation and focus indicators');
    }

    if (categoryCounts[AccessibilityCategory.ALT_TEXT] > 0) {
      recommendations.push('Add descriptive alt text to all informative images');
    }

    if (categoryCounts[AccessibilityCategory.FORM_LABELS] > 0) {
      recommendations.push('Ensure all form inputs have proper labels');
    }

    if (categoryCounts[AccessibilityCategory.TARGET_SIZE] > 0) {
      recommendations.push('Increase target sizes for better touch accessibility');
    }

    if (this.assistiveTech.screenReaderActive) {
      recommendations.push('Optimize for screen reader users detected in this session');
    }

    if (this.assistiveTech.keyboardNavigationActive) {
      recommendations.push('Ensure excellent keyboard navigation support');
    }

    return recommendations;
  }

  // Run manual accessibility check
  runManualCheck(): void {
    this.runAccessibilityAudit();
  }

  // Clear all issues
  clearIssues(): void {
    this.issues = [];
  }

  // Disconnect monitoring
  disconnect(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
  }
}

// Supporting classes

class FocusTracker {
  private focusHistory: Array<{ element: Element; timestamp: number }> = [];

  trackFocusIn(element: Element): void {
    this.focusHistory.push({
      element: element,
      timestamp: Date.now()
    });

    // Keep only last 50 focus events
    if (this.focusHistory.length > 50) {
      this.focusHistory = this.focusHistory.slice(-50);
    }
  }

  trackFocusOut(element: Element): void {
    // Focus out tracking if needed
  }

  getFocusHistory(): Array<{ element: Element; timestamp: number }> {
    return [...this.focusHistory];
  }
}

class ColorContrastAnalyzer {
  // Convert hex to RGB
  hexToRgb(hex: string): { r: number; g: number; b: number } | null {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null;
  }

  // Convert RGB to relative luminance
  rgbToLuminance(r: number, g: number, b: number): number {
    const rsRGB = r / 255;
    const gsRGB = g / 255;
    const bsRGB = b / 255;

    const rLinear = rsRGB <= 0.03928 ? rsRGB / 12.92 : Math.pow((rsRGB + 0.055) / 1.055, 2.4);
    const gLinear = gsRGB <= 0.03928 ? gsRGB / 12.92 : Math.pow((gsRGB + 0.055) / 1.055, 2.4);
    const bLinear = bsRGB <= 0.03928 ? bsRGB / 12.92 : Math.pow((bsRGB + 0.055) / 1.055, 2.4);

    return 0.2126 * rLinear + 0.7152 * gLinear + 0.0722 * bLinear;
  }

  // Calculate contrast ratio
  calculateContrast(color1: string, color2: string): number {
    try {
      const rgb1 = this.parseColor(color1);
      const rgb2 = this.parseColor(color2);

      if (!rgb1 || !rgb2) return 0;

      const luminance1 = this.rgbToLuminance(rgb1.r, rgb1.g, rgb1.b);
      const luminance2 = this.rgbToLuminance(rgb2.r, rgb2.g, rgb2.b);

      const lighter = Math.max(luminance1, luminance2);
      const darker = Math.min(luminance1, luminance2);

      return (lighter + 0.05) / (darker + 0.05);
    } catch (error) {
      return 0;
    }
  }

  // Parse color string to RGB
  private parseColor(color: string): { r: number; g: number; b: number } | null {
    // Handle hex colors
    if (color.startsWith('#')) {
      return this.hexToRgb(color);
    }

    // Handle rgb/rgba colors
    const rgbMatch = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
    if (rgbMatch) {
      return {
        r: parseInt(rgbMatch[1]),
        g: parseInt(rgbMatch[2]),
        b: parseInt(rgbMatch[3])
      };
    }

    return null;
  }
}

class FormAccessibilityValidator {
  // Additional form validation methods can be added here
  validateForm(form: HTMLFormElement): string[] {
    const errors: string[] = [];

    // Check for form labels
    const inputs = form.querySelectorAll('input, select, textarea');
    inputs.forEach(input => {
      const hasLabel = !!document.querySelector(`label[for="${input.id}"]`) ||
                      input.hasAttribute('aria-label') ||
                      input.hasAttribute('aria-labelledby') ||
                      !!input.closest('label');

      if (!hasLabel) {
        errors.push(`Input missing label: ${input.tagName}${input.id ? '#' + input.id : ''}`);
      }
    });

    return errors;
  }
}

// Create and export singleton instance
export const accessibilityMonitor = new AccessibilityMonitor();

// Initialize automatically
if (typeof window !== 'undefined') {
  if (document.readyState === 'complete') {
    accessibilityMonitor.initialize();
  } else {
    window.addEventListener('load', () => {
      accessibilityMonitor.initialize();
    });
  }
}

// Export helper functions
export const initializeAccessibilityMonitoring = () => accessibilityMonitor.initialize();
export const runAccessibilityAudit = () => accessibilityMonitor.runManualCheck();
export const getAccessibilityAnalytics = () => accessibilityMonitor.getAccessibilityAnalytics();
export const getAccessibilityReport = () => accessibilityMonitor.getAccessibilityReport();
export const clearAccessibilityIssues = () => accessibilityMonitor.clearIssues();

// Export types
export { AccessibilityCategory, AccessibilitySeverity, AssistiveTechnologyData };