/**
 * Comprehensive Accessibility Monitoring and Compliance Tracking System
 * for luxury beauty and fitness booking platform
 */

import { trackRUMEvent, trackRUMInteraction } from './rum';
import { reportMessage } from './sentry';

// WCAG compliance levels
export enum WCAGLevel {
  A = 'A',
  AA = 'AA',
  AAA = 'AAA'
}

// Accessibility issue severity
export enum AccessibilitySeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

// Accessibility issue categories
export enum AccessibilityCategory {
  PERCEIVABLE = 'perceivable',    // Text alternatives, captions, color contrast
  OPERABLE = 'operable',        // Keyboard navigation, timing, seizures
  UNDERSTANDABLE = 'understandable', // Readable, predictable, input assistance
  ROBUST = 'robust'             // Compatible with assistive technologies
}

// Accessibility issue data structure
interface AccessibilityIssue {
  id: string;
  category: AccessibilityCategory;
  severity: AccessibilitySeverity;
  wcagLevel: WCAGLevel;
  rule: string;
  description: string;
  element: {
    tagName: string;
    id?: string;
    className?: string;
    text?: string;
    selector: string;
  };
  location: {
    url: string;
    pageType: string;
    timestamp: number;
  };
  context: {
    deviceType: string;
    userAgent: string;
    screenReaderActive: boolean;
    keyboardNavigationActive: boolean;
  };
  recommendations: string[];
  automated: boolean;
  resolved: boolean;
  reported: boolean;
}

// Screen reader usage tracking
interface ScreenReaderUsage {
  timestamp: number;
  pageType: string;
  action: 'navigation' | 'reading' | 'interaction' | 'form-input';
  element: string;
  duration: number;
  success: boolean;
  context: any;
}

// Keyboard navigation tracking
interface KeyboardNavigation {
  timestamp: number;
  pageType: string;
  key: string;
  element: string;
  action: 'focus' | 'navigation' | 'interaction';
  success: boolean;
  context: any;
}

// Accessibility compliance report
interface AccessibilityComplianceReport {
  timestamp: number;
  pageType: string;
  url: string;
  overallScore: number; // 0-100
  wcagCompliance: {
    level: WCAGLevel;
    score: number;
    passed: number;
    failed: number;
    total: number;
  };
  categoryScores: {
    perceivable: number;
    operable: number;
    understandable: number;
    robust: number;
  };
  issues: AccessibilityIssue[];
  screenReaderUsage: ScreenReaderUsage[];
  keyboardNavigation: KeyboardNavigation[];
  recommendations: string[];
  priority: 'low' | 'medium' | 'high' | 'critical';
}

class AccessibilityMonitoringSystem {
  private static instance: AccessibilityMonitoringSystem;
  private issues: AccessibilityIssue[] = [];
  private screenReaderUsage: ScreenReaderUsage[] = [];
  private keyboardNavigation: KeyboardNavigation[] = [];
  private isInitialized = false;
  private monitoringEnabled = true;
  private screenReaderDetected = false;
  private keyboardNavigationActive = false;
  private accessibilityAPIs: Map<string, boolean> = new Map();
  private complianceCache: Map<string, AccessibilityComplianceReport> = new Map();

  private constructor() {
    this.detectAccessibilityFeatures();
  }

  static getInstance(): AccessibilityMonitoringSystem {
    if (!AccessibilityMonitoringSystem.instance) {
      AccessibilityMonitoringSystem.instance = new AccessibilityMonitoringSystem();
    }
    return AccessibilityMonitoringSystem.instance;
  }

  // Initialize accessibility monitoring
  initialize(): void {
    if (this.isInitialized) return;

    try {
      this.initializeAutomatedTesting();
      this.initializeScreenReaderTracking();
      this.initializeKeyboardNavigationTracking();
      this.initializeFocusManagement();
      this.initializeColorContrastMonitoring();
      this.initializeFormAccessibility();
      this.initializeMediaAccessibility();
      this.initializeContinuousMonitoring();

      this.isInitialized = true;
      console.log('[Accessibility] Comprehensive monitoring system initialized');

      // Run initial accessibility audit
      setTimeout(() => {
        this.runAccessibilityAudit();
      }, 3000);
    } catch (error) {
      console.warn('[Accessibility] Failed to initialize:', error);
    }
  }

  // Detect accessibility features
  private detectAccessibilityFeatures(): void {
    // Detect screen readers
    if ('speechSynthesis' in window && window.speechSynthesis.getVoices().length > 0) {
      this.screenReaderDetected = true;
    }

    // Check for common assistive technology indicators
    const indicators = [
      window.navigator.userAgent.includes('NVDA'),
      window.navigator.userAgent.includes('JAWS'),
      window.navigator.userAgent.includes('VoiceOver'),
      window.navigator.userAgent.includes('TalkBack'),
      window.matchMedia('(prefers-reduced-motion: reduce)').matches,
      window.matchMedia('(prefers-contrast: high)').matches
    ];

    this.screenReaderDetected = this.screenReaderDetected || indicators.some(Boolean);

    // Check accessibility APIs
    this.accessibilityAPIs.set('aria-attributes', typeof document !== 'undefined');
    this.accessibilityAPIs.set('live-regions', typeof document !== 'undefined');
    this.accessibilityAPIs.set('focus-management', typeof document !== 'undefined');
    this.accessibilityAPIs.set('keyboard-navigation', typeof document !== 'undefined');
    this.accessibilityAPIs.set('screen-reader-api', 'speechSynthesis' in window);
  }

  // Initialize automated testing
  private initializeAutomatedTesting(): void {
    // Run automated tests when DOM is ready
    if (document.readyState === 'complete') {
      this.runAutomatedTests();
    } else {
      window.addEventListener('load', () => {
        this.runAutomatedTests();
      });
    }

    // Monitor for dynamic content changes
    if ('MutationObserver' in window) {
      const observer = new MutationObserver((mutations) => {
        let hasSignificantChanges = false;
        mutations.forEach(mutation => {
          if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
            mutation.addedNodes.forEach(node => {
              if (node.nodeType === Node.ELEMENT_NODE) {
                const element = node as Element;
                if (element.tagName === 'IMG' || element.tagName === 'BUTTON' ||
                    element.tagName === 'INPUT' || element.tagName === 'SELECT' ||
                    element.querySelector('img, button, input, select')) {
                  hasSignificantChanges = true;
                }
              }
            });
          }
        });

        if (hasSignificantChanges) {
          setTimeout(() => this.runAutomatedTests(), 1000);
        }
      });

      observer.observe(document.body, {
        childList: true,
        subtree: true
      });
    }
  }

  // Run automated accessibility tests
  private runAutomatedTests(): void {
    const issues: AccessibilityIssue[] = [];

    // Test 1: Images without alt text
    this.testImageAltText(issues);

    // Test 2: Form inputs without labels
    this.testFormLabels(issues);

    // Test 3: Link text accessibility
    this.testLinkAccessibility(issues);

    // Test 4: Heading structure
    this.testHeadingStructure(issues);

    // Test 5: Button accessibility
    this.testButtonAccessibility(issues);

    // Test 6: Focus management
    this.testFocusManagement(issues);

    // Test 7: ARIA attributes
    this.testARIAAttributes(issues);

    // Test 8: Color contrast (simplified)
    this.testColorContrast(issues);

    // Test 9: Keyboard accessibility
    this.testKeyboardAccessibility(issues);

    // Test 10: Language attributes
    this.testLanguageAttributes(issues);

    // Process found issues
    issues.forEach(issue => this.processAccessibilityIssue(issue));
  }

  // Test image alt text
  private testImageAltText(issues: AccessibilityIssue[]): void {
    const images = document.querySelectorAll('img:not([alt])');

    images.forEach(img => {
      const issue: AccessibilityIssue = {
        id: this.generateIssueId(),
        category: AccessibilityCategory.PERCEIVABLE,
        severity: AccessibilitySeverity.HIGH,
        wcagLevel: WCAGLevel.A,
        rule: '1.1.1 - Non-text Content',
        description: 'Image missing alt text',
        element: {
          tagName: 'IMG',
          src: (img as HTMLImageElement).src,
          selector: this.generateSelector(img),
          text: img.alt || ''
        },
        location: this.getCurrentLocation(),
        context: this.getCurrentContext(),
        recommendations: [
          'Add descriptive alt text to the image',
          'If the image is decorative, use alt=""',
          'Ensure alt text conveys the same information as the image'
        ],
        automated: true,
        resolved: false,
        reported: false
      };

      issues.push(issue);
    });
  }

  // Test form labels
  private testFormLabels(issues: AccessibilityIssue[]): void {
    const inputs = document.querySelectorAll('input, select, textarea');

    inputs.forEach(input => {
      const hasLabel = this.hasAssociatedLabel(input as HTMLElement);

      if (!hasLabel) {
        const issue: AccessibilityIssue = {
          id: this.generateIssueId(),
          category: AccessibilityCategory.PERCEIVABLE,
          severity: AccessibilitySeverity.HIGH,
          wcagLevel: WCAGLevel.A,
          rule: '3.3.2 - Labels or Instructions',
          description: 'Form input missing associated label',
          element: {
            tagName: input.tagName,
            id: (input as HTMLElement).id || undefined,
            className: (input as HTMLElement).className || undefined,
            selector: this.generateSelector(input),
            text: (input as HTMLInputElement).placeholder || ''
          },
          location: this.getCurrentLocation(),
          context: this.getCurrentContext(),
          recommendations: [
            'Add a <label> element with a "for" attribute matching the input\'s id',
            'Or use aria-label or aria-labelledby attributes',
            'Ensure the label describes the purpose of the input'
          ],
          automated: true,
          resolved: false,
          reported: false
        };

        issues.push(issue);
      }
    });
  }

  // Test link accessibility
  private testLinkAccessibility(issues: AccessibilityIssue[]): void {
    const links = document.querySelectorAll('a');

    links.forEach(link => {
      const text = link.textContent?.trim();

      // Check for empty or non-descriptive links
      if (!text || text === 'click here' || text === 'read more' || text === 'learn more') {
        const issue: AccessibilityIssue = {
          id: this.generateIssueId(),
          category: AccessibilityCategory.PERCEIVABLE,
          severity: AccessibilitySeverity.MEDIUM,
          wcagLevel: WCAGLevel.AA,
          rule: '2.4.4 - Link Purpose',
          description: `Link text is not descriptive: "${text}"`,
          element: {
            tagName: 'A',
            href: (link as HTMLAnchorElement).href,
            selector: this.generateSelector(link),
            text: text || ''
          },
          location: this.getCurrentLocation(),
          context: this.getCurrentContext(),
          recommendations: [
            'Make link text more descriptive of the destination',
            'Use aria-label if additional context is needed',
            'Ensure link text makes sense out of context'
          ],
          automated: true,
          resolved: false,
          reported: false
        };

        issues.push(issue);
      }
    });
  }

  // Test heading structure
  private testHeadingStructure(issues: AccessibilityIssue[]): void {
    const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
    let lastLevel = 0;

    headings.forEach((heading, index) => {
      const level = parseInt(heading.tagName.substring(1));

      // Check for skipped heading levels
      if (lastLevel > 0 && level > lastLevel + 1) {
        const issue: AccessibilityIssue = {
          id: this.generateIssueId(),
          category: AccessibilityCategory.PERCEIVABLE,
          severity: AccessibilitySeverity.MEDIUM,
          wcagLevel: WCAGLevel.AA,
          rule: '1.3.1 - Info and Relationships',
          description: `Skipped heading level: h${lastLevel} to h${level}`,
          element: {
            tagName: heading.tagName,
            selector: this.generateSelector(heading),
            text: heading.textContent?.trim() || ''
          },
          location: this.getCurrentLocation(),
          context: this.getCurrentContext(),
          recommendations: [
            'Use heading levels in sequential order',
            'Do not skip heading levels (e.g., h1 to h3)',
            'Consider using CSS for styling instead of inappropriate heading levels'
          ],
          automated: true,
          resolved: false,
          reported: false
        };

        issues.push(issue);
      }

      lastLevel = level;
    });

    // Check for multiple h1 tags
    const h1Count = document.querySelectorAll('h1').length;
    if (h1Count > 1) {
      const issue: AccessibilityIssue = {
        id: this.generateIssueId(),
        category: AccessibilityCategory.PERCEIVABLE,
        severity: AccessibilitySeverity.MEDIUM,
        wcagLevel: WCAGLevel.A,
        rule: '1.3.1 - Info and Relationships',
        description: `Multiple h1 tags found (${h1Count})`,
        element: {
          tagName: 'H1',
          selector: 'h1',
          text: 'Multiple H1 elements'
        },
        location: this.getCurrentLocation(),
        context: this.getCurrentContext(),
        recommendations: [
          'Use only one h1 tag per page',
          'Use h2-h6 for subheadings',
          'Ensure proper heading hierarchy'
        ],
        automated: true,
        resolved: false,
        reported: false
      };

      issues.push(issue);
    }
  }

  // Test button accessibility
  private testButtonAccessibility(issues: AccessibilityIssue[]): void {
    const buttons = document.querySelectorAll('button, [role="button"]');

    buttons.forEach(button => {
      const text = button.textContent?.trim();

      if (!text) {
        const issue: AccessibilityIssue = {
          id: this.generateIssueId(),
          category: AccessibilityCategory.OPERABLE,
          severity: AccessibilitySeverity.HIGH,
          wcagLevel: WCAGLevel.A,
          rule: '4.1.2 - Name, Role, Value',
          description: 'Button missing accessible name',
          element: {
            tagName: button.tagName,
            selector: this.generateSelector(button),
            text: text || ''
          },
          location: this.getCurrentLocation(),
          context: this.getCurrentContext(),
          recommendations: [
            'Add text content to the button',
            'Or use aria-label attribute',
            'Or use aria-labelledby attribute'
          ],
          automated: true,
          resolved: false,
          reported: false
        };

        issues.push(issue);
      }
    });
  }

  // Test focus management
  private testFocusManagement(issues: AccessibilityIssue[]): void {
    // Check for elements that can receive focus but have poor focus indicators
    const focusableElements = document.querySelectorAll(
      'a, button, input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );

    focusableElements.forEach(element => {
      const styles = window.getComputedStyle(element);
      const hasFocusStyle = styles.outline !== 'none' ||
                           styles.boxShadow !== 'none' ||
                           element.getAttribute('data-focus-visible') !== null;

      if (!hasFocusStyle) {
        const issue: AccessibilityIssue = {
          id: this.generateIssueId(),
          category: AccessibilityCategory.OPERABLE,
          severity: AccessibilitySeverity.MEDIUM,
          wcagLevel: WCAGLevel.AA,
          rule: '2.4.7 - Focus Visible',
          description: 'Focusable element lacks visible focus indicator',
          element: {
            tagName: element.tagName,
            selector: this.generateSelector(element),
            text: element.textContent?.trim() || ''
          },
          location: this.getCurrentLocation(),
          context: this.getCurrentContext(),
          recommendations: [
            'Add visible focus indicator using :focus pseudo-class',
            'Ensure focus indicator has sufficient contrast',
            'Consider using :focus-visible for better UX'
          ],
          automated: true,
          resolved: false,
          reported: false
        };

        issues.push(issue);
      }
    });
  }

  // Test ARIA attributes
  private testARIAAttributes(issues: AccessibilityIssue[]): void {
    // Check for invalid ARIA attributes
    const elementsWithAria = document.querySelectorAll('[aria-*]');

    elementsWithAria.forEach(element => {
      const attributes = Array.from(element.attributes)
        .filter(attr => attr.name.startsWith('aria-'));

      attributes.forEach(attr => {
        // Check for empty required ARIA attributes
        const requiredAria = ['aria-label', 'aria-labelledby', 'aria-describedby'];
        if (requiredAria.includes(attr.name) && !attr.value) {
          const issue: AccessibilityIssue = {
            id: this.generateIssueId(),
            category: AccessibilityCategory.ROBUST,
            severity: AccessibilitySeverity.MEDIUM,
            wcagLevel: WCAGLevel.A,
            rule: '4.1.1 - Parsing',
            description: `Empty required ARIA attribute: ${attr.name}`,
            element: {
              tagName: element.tagName,
              selector: this.generateSelector(element),
              text: element.textContent?.trim() || ''
            },
            location: this.getCurrentLocation(),
            context: this.getCurrentContext(),
            recommendations: [
              `Provide a value for ${attr.name}`,
              'Or remove the attribute if not needed',
              'Ensure ARIA attributes have meaningful values'
            ],
            automated: true,
            resolved: false,
            reported: false
          };

          issues.push(issue);
        }
      });
    });
  }

  // Test color contrast (simplified version)
  private testColorContrast(issues: AccessibilityIssue[]): void {
    const textElements = document.querySelectorAll('p, h1, h2, h3, h4, h5, h6, span, a, button, label');

    textElements.forEach(element => {
      const styles = window.getComputedStyle(element);
      const fontSize = parseFloat(styles.fontSize);
      const fontWeight = styles.fontWeight;
      const color = styles.color;
      const backgroundColor = styles.backgroundColor;

      // Simple check for common low contrast issues
      if (color === 'rgb(128, 128, 128)' && backgroundColor === 'rgb(255, 255, 255)') {
        const issue: AccessibilityIssue = {
          id: this.generateIssueId(),
          category: AccessibilityCategory.PERCEIVABLE,
          severity: AccessibilitySeverity.MEDIUM,
          wcagLevel: WCAGLevel.AA,
          rule: '1.4.3 - Contrast',
          description: 'Potential low color contrast detected',
          element: {
            tagName: element.tagName,
            selector: this.generateSelector(element),
            text: element.textContent?.trim() || ''
          },
          location: this.getCurrentLocation(),
          context: this.getCurrentContext(),
          recommendations: [
            'Ensure text has sufficient contrast against background',
            'Use a contrast checker tool to verify WCAG compliance',
            'Consider using darker text or lighter background'
          ],
          automated: true,
          resolved: false,
          reported: false
        };

        issues.push(issue);
      }
    });
  }

  // Test keyboard accessibility
  private testKeyboardAccessibility(issues: AccessibilityIssue[]): void {
    // Check for elements with onclick but no keyboard support
    const clickableElements = document.querySelectorAll('[onclick]');

    clickableElements.forEach(element => {
      const tagName = element.tagName.toLowerCase();
      const hasKeyboardSupport = ['a', 'button', 'input', 'select', 'textarea'].includes(tagName) ||
                               element.getAttribute('tabindex') !== null ||
                               element.getAttribute('role') === 'button';

      if (!hasKeyboardSupport) {
        const issue: AccessibilityIssue = {
          id: this.generateIssueId(),
          category: AccessibilityCategory.OPERABLE,
          severity: AccessibilitySeverity.HIGH,
          wcagLevel: WCAGLevel.A,
          rule: '2.1.1 - Keyboard',
          description: 'Click handler without keyboard accessibility',
          element: {
            tagName: element.tagName,
            selector: this.generateSelector(element),
            text: element.textContent?.trim() || ''
          },
          location: this.getCurrentLocation(),
          context: this.getCurrentContext(),
          recommendations: [
            'Add keyboard event handlers (keydown, keyup)',
            'Or use button/link elements instead',
            'Or add tabindex and appropriate ARIA roles'
          ],
          automated: true,
          resolved: false,
          reported: false
        };

        issues.push(issue);
      }
    });
  }

  // Test language attributes
  private testLanguageAttributes(issues: AccessibilityIssue[]): void {
    const htmlElement = document.documentElement;
    const lang = htmlElement.getAttribute('lang');

    if (!lang) {
      const issue: AccessibilityIssue = {
        id: this.generateIssueId(),
        category: AccessibilityCategory.UNDERSTANDABLE,
        severity: AccessibilitySeverity.MEDIUM,
        wcagLevel: WCAGLevel.A,
        rule: '3.1.1 - Language of Page',
        description: 'HTML element missing lang attribute',
        element: {
          tagName: 'HTML',
          selector: 'html',
          text: ''
        },
        location: this.getCurrentLocation(),
        context: this.getCurrentContext(),
        recommendations: [
          'Add lang attribute to HTML element',
          'Use appropriate language codes (e.g., "en", "pl")',
          'Ensure lang matches the page language'
        ],
        automated: true,
        resolved: false,
        reported: false
      };

      issues.push(issue);
    }
  }

  // Initialize screen reader tracking
  private initializeScreenReaderTracking(): void {
    if (!this.screenReaderDetected) return;

    // Track screen reader navigation patterns
    this.trackScreenReaderNavigation();

    // Track live region announcements
    this.trackLiveRegionUsage();

    // Track ARIA landmark usage
    this.trackLandmarkUsage();
  }

  // Track screen reader navigation
  private trackScreenReaderNavigation(): void {
    let navigationStartTime = 0;
    let currentElement: Element | null = null;

    document.addEventListener('focusin', (event) => {
      if (this.screenReaderDetected) {
        navigationStartTime = Date.now();
        currentElement = event.target as Element;

        const usage: ScreenReaderUsage = {
          timestamp: Date.now(),
          pageType: this.getPageType(),
          action: 'navigation',
          element: currentElement.tagName,
          duration: 0,
          success: true,
          context: {
            selector: this.generateSelector(currentElement),
            text: currentElement.textContent?.trim() || ''
          }
        };

        this.screenReaderUsage.push(usage);
      }
    });

    document.addEventListener('focusout', (event) => {
      if (this.screenReaderDetected && currentElement && navigationStartTime > 0) {
        const duration = Date.now() - navigationStartTime;

        const lastUsage = this.screenReaderUsage[this.screenReaderUsage.length - 1];
        if (lastUsage) {
          lastUsage.duration = duration;
          lastUsage.action = duration > 1000 ? 'reading' : 'navigation';
        }

        navigationStartTime = 0;
        currentElement = null;
      }
    });
  }

  // Track live region usage
  private trackLiveRegionUsage(): void {
    const liveRegions = document.querySelectorAll('[aria-live], [aria-atomic], [aria-relevant]');

    liveRegions.forEach(region => {
      const observer = new MutationObserver((mutations) => {
        mutations.forEach(mutation => {
          if (mutation.type === 'childList' || mutation.type === 'characterData') {
            trackRUMEvent('screen-reader-live-region', {
              pageType: this.getPageType(),
              regionType: region.getAttribute('aria-live') || 'polite',
              content: region.textContent?.trim() || '',
              timestamp: Date.now()
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

  // Track landmark usage
  private trackLandmarkUsage(): void {
    const landmarks = document.querySelectorAll('[role="banner"], [role="navigation"], [role="main"], [role="complementary"], [role="contentinfo"], [role="search"], header, nav, main, aside, footer');

    if (landmarks.length === 0) {
      trackRUMEvent('accessibility-landmarks-missing', {
        pageType: this.getPageType(),
        timestamp: Date.now()
      });
    }
  }

  // Initialize keyboard navigation tracking
  private initializeKeyboardNavigationTracking(): void {
    let keyboardSessionStart = 0;
    let keyboardActive = false;

    // Track keyboard usage
    document.addEventListener('keydown', (event) => {
      if (!keyboardActive) {
        keyboardActive = true;
        keyboardSessionStart = Date.now();
        this.keyboardNavigationActive = true;
      }

      const navigation: KeyboardNavigation = {
        timestamp: Date.now(),
        pageType: this.getPageType(),
        key: event.key,
        element: (event.target as Element).tagName,
        action: 'navigation',
        success: true,
        context: {
          selector: this.generateSelector(event.target as Element),
          shiftKey: event.shiftKey,
          ctrlKey: event.ctrlKey,
          altKey: event.altKey
        }
      };

      this.keyboardNavigation.push(navigation);

      // Track specific keyboard patterns
      this.trackKeyboardPatterns(event);
    });

    // Detect when user switches back to mouse
    document.addEventListener('mousedown', () => {
      if (keyboardActive && keyboardSessionStart > 0) {
        const sessionDuration = Date.now() - keyboardSessionStart;

        trackRUMEvent('keyboard-session', {
          pageType: this.getPageType(),
          duration: sessionDuration,
          interactions: this.keyboardNavigation.length,
          timestamp: Date.now()
        });

        keyboardActive = false;
        keyboardSessionStart = 0;
        this.keyboardNavigationActive = false;
      }
    });
  }

  // Track keyboard navigation patterns
  private trackKeyboardPatterns(event: KeyboardEvent): void {
    // Track Tab navigation
    if (event.key === 'Tab') {
      const direction = event.shiftKey ? 'backward' : 'forward';
      const target = event.target as Element;

      trackRUMEvent('keyboard-tab-navigation', {
        direction: direction,
        element: target.tagName,
        selector: this.generateSelector(target),
        pageType: this.getPageType(),
        timestamp: Date.now()
      });
    }

    // Track Enter/Space activation
    if (event.key === 'Enter' || event.key === ' ') {
      const target = event.target as Element;
      const interactive = ['A', 'BUTTON', 'INPUT', 'SELECT', 'TEXTAREA'].includes(target.tagName);

      if (interactive) {
        trackRUMEvent('keyboard-activation', {
          key: event.key,
          element: target.tagName,
          selector: this.generateSelector(target),
          pageType: this.getPageType(),
          timestamp: Date.now()
        });
      }
    }

    // Track Escape key usage
    if (event.key === 'Escape') {
      trackRUMEvent('keyboard-escape', {
        pageType: this.getPageType(),
        element: (event.target as Element).tagName,
        timestamp: Date.now()
      });
    }
  }

  // Initialize focus management
  private initializeFocusManagement(): void {
    // Track focus traps
    this.trackFocusTraps();

    // Track focus management in modals
    this.trackModalFocusManagement();

    // Track skip links
    this.trackSkipLinks();
  }

  // Track focus traps
  private trackFocusTraps(): void {
    const modals = document.querySelectorAll('[role="dialog"], .modal, [aria-modal="true"]');

    modals.forEach(modal => {
      const focusableElements = modal.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );

      if (focusableElements.length === 0) {
        trackRUMEvent('focus-trap-issue', {
          type: 'no-focusable-elements',
          element: this.generateSelector(modal),
          pageType: this.getPageType(),
          timestamp: Date.now()
        });
      }
    });
  }

  // Track modal focus management
  private trackModalFocusManagement(): void {
    const observer = new MutationObserver((mutations) => {
      mutations.forEach(mutation => {
        mutation.addedNodes.forEach(node => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            const element = node as Element;
            const isModal = element.getAttribute('role') === 'dialog' ||
                           element.getAttribute('aria-modal') === 'true' ||
                           element.classList.contains('modal');

            if (isModal) {
              setTimeout(() => {
                const focusElement = element.querySelector('[autofocus]') ||
                                 element.querySelector('button, input, select, textarea') ||
                                 element;

                if (focusElement && document.activeElement !== focusElement) {
                  trackRUMEvent('modal-focus-issue', {
                    type: 'focus-not-set',
                    element: this.generateSelector(element),
                    pageType: this.getPageType(),
                    timestamp: Date.now()
                  });
                }
              }, 100);
            }
          }
        });
      });
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  // Track skip links
  private trackSkipLinks(): void {
    const skipLinks = document.querySelectorAll('a[href^="#"], [data-skip-link]');

    if (skipLinks.length === 0) {
      trackRUMEvent('skip-links-missing', {
        pageType: this.getPageType(),
        timestamp: Date.now()
      });
    } else {
      skipLinks.forEach(link => {
        link.addEventListener('click', (event) => {
          const href = (link as HTMLAnchorElement).getAttribute('href');
          if (href && href.startsWith('#')) {
            const target = document.getElementById(href.substring(1));

            if (!target) {
              trackRUMEvent('skip-link-target-missing', {
                href: href,
                pageType: this.getPageType(),
                timestamp: Date.now()
              });
            }
          }
        });
      });
    }
  }

  // Initialize color contrast monitoring
  private initializeColorContrastMonitoring(): void {
    // Monitor for color scheme changes
    const mediaQuery = window.matchMedia('(prefers-contrast: high)');

    const handleColorSchemeChange = (e: MediaQueryListEvent) => {
      trackRUMEvent('color-scheme-change', {
        highContrast: e.matches,
        pageType: this.getPageType(),
        timestamp: Date.now()
      });

      if (e.matches) {
        // Re-run contrast tests for high contrast mode
        setTimeout(() => this.runAutomatedTests(), 1000);
      }
    };

    mediaQuery.addEventListener('change', handleColorSchemeChange);

    // Monitor for reduced motion preference
    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

    const handleMotionChange = (e: MediaQueryListEvent) => {
      trackRUMEvent('motion-preference-change', {
        reducedMotion: e.matches,
        pageType: this.getPageType(),
        timestamp: Date.now()
      });
    };

    motionQuery.addEventListener('change', handleMotionChange);
  }

  // Initialize form accessibility
  private initializeFormAccessibility(): void {
    // Track form submission errors
    document.addEventListener('submit', (event) => {
      const form = event.target as HTMLFormElement;
      const invalidElements = form.querySelectorAll(':invalid');

      if (invalidElements.length > 0) {
        trackRUMEvent('form-validation-errors', {
          errorCount: invalidElements.length,
          pageType: this.getPageType(),
          formId: form.id || 'unknown',
          timestamp: Date.now()
        });
      }
    });

    // Track form field descriptions
    const formFields = document.querySelectorAll('input[aria-describedby], textarea[aria-describedby], select[aria-describedby]');

    formFields.forEach(field => {
      const describedBy = field.getAttribute('aria-describedby');
      if (describedBy) {
        const descriptions = describedBy.split(' ').map(id => document.getElementById(id)).filter(Boolean);

        if (descriptions.length === 0) {
          trackRUMEvent('form-description-missing', {
            fieldId: field.id,
            describedBy: describedBy,
            pageType: this.getPageType(),
            timestamp: Date.now()
          });
        }
      }
    });
  }

  // Initialize media accessibility
  private initializeMediaAccessibility(): void {
    // Track video elements
    const videos = document.querySelectorAll('video');

    videos.forEach(video => {
      // Check for captions
      const hasCaptions = video.querySelector('track[kind="captions"]');

      if (!hasCaptions) {
        trackRUMEvent('video-captions-missing', {
          videoSrc: (video as HTMLVideoElement).src,
          pageType: this.getPageType(),
          timestamp: Date.now()
        });
      }

      // Check for controls
      if (!video.hasAttribute('controls')) {
        trackRUMEvent('video-controls-missing', {
          videoSrc: (video as HTMLVideoElement).src,
          pageType: this.getPageType(),
          timestamp: Date.now()
        });
      }
    });

    // Track audio elements
    const audioElements = document.querySelectorAll('audio');

    audioElements.forEach(audio => {
      // Check for controls
      if (!audio.hasAttribute('controls')) {
        trackRUMEvent('audio-controls-missing', {
          audioSrc: (audio as HTMLAudioElement).src,
          pageType: this.getPageType(),
          timestamp: Date.now()
        });
      }
    });
  }

  // Initialize continuous monitoring
  private initializeContinuousMonitoring(): void {
    // Monitor focus management continuously
    setInterval(() => {
      this.checkFocusManagement();
    }, 30000); // Every 30 seconds

    // Monitor for new accessibility issues
    setInterval(() => {
      this.runAutomatedTests();
    }, 60000); // Every minute

    // Generate compliance reports
    setInterval(() => {
      this.generateComplianceReport();
    }, 300000); // Every 5 minutes
  }

  // Check focus management
  private checkFocusManagement(): void {
    const activeElement = document.activeElement;

    if (activeElement) {
      // Check if focus is in a reasonable location
      const isInModal = activeElement.closest('[role="dialog"], .modal, [aria-modal="true"]');
      const isFocusable = activeElement.matches('a, button, input, select, textarea, [tabindex]:not([tabindex="-1"])');

      if (!isFocusable && activeElement !== document.body) {
        trackRUMEvent('focus-management-issue', {
          type: 'focus-on-non-focusable',
          element: this.generateSelector(activeElement),
          pageType: this.getPageType(),
          timestamp: Date.now()
        });
      }
    }
  }

  // Run accessibility audit
  private runAccessibilityAudit(): void {
    console.log('[Accessibility] Running comprehensive accessibility audit...');

    this.runAutomatedTests();
    this.generateComplianceReport();

    console.log('[Accessibility] Audit completed');
  }

  // Generate compliance report
  private generateComplianceReport(): void {
    const pageType = this.getPageType();
    const url = window.location.href;

    // Check cache first
    const cacheKey = `${pageType}_${url}`;
    const lastReport = this.complianceCache.get(cacheKey);

    if (lastReport && Date.now() - lastReport.timestamp < 300000) { // 5 minutes
      return;
    }

    const recentIssues = this.issues.filter(issue =>
      issue.location.pageType === pageType && !issue.resolved
    );

    const wcagScores = this.calculateWCAGScores(recentIssues);
    const categoryScores = this.calculateCategoryScores(recentIssues);
    const overallScore = this.calculateOverallScore(categoryScores);

    const report: AccessibilityComplianceReport = {
      timestamp: Date.now(),
      pageType,
      url,
      overallScore,
      wcagCompliance: wcagScores,
      categoryScores,
      issues: recentIssues,
      screenReaderUsage: this.screenReaderUsage.filter(u => u.pageType === pageType),
      keyboardNavigation: this.keyboardNavigation.filter(k => k.pageType === pageType),
      recommendations: this.generateRecommendations(recentIssues, categoryScores),
      priority: this.determineReportPriority(overallScore, recentIssues)
    };

    this.complianceCache.set(cacheKey, report);

    // Track compliance report
    trackRUMEvent('accessibility-compliance-report', {
      pageType,
      overallScore,
      wcagLevel: wcagScores.level,
      totalIssues: recentIssues.length,
      priority: report.priority,
      timestamp: Date.now()
    });

    // Report critical issues
    const criticalIssues = recentIssues.filter(issue => issue.severity === AccessibilitySeverity.CRITICAL);
    if (criticalIssues.length > 0) {
      this.reportCriticalAccessibilityIssues(criticalIssues);
    }
  }

  // Calculate WCAG scores
  private calculateWCAGScores(issues: AccessibilityIssue[]): any {
    const totalTests = 50; // Approximate number of WCAG tests
    const failuresByLevel = {
      [WCAGLevel.A]: 0,
      [WCAGLevel.AA]: 0,
      [WCAGLevel.AAA]: 0
    };

    issues.forEach(issue => {
      failuresByLevel[issue.wcagLevel]++;
    });

    // Determine highest level of compliance
    let complianceLevel = WCAGLevel.AAA;
    if (failuresByLevel[WCAGLevel.A] > 0) {
      complianceLevel = WCAGLevel.A;
    } else if (failuresByLevel[WCAGLevel.AA] > 0) {
      complianceLevel = WCAGLevel.AA;
    }

    const totalFailures = failuresByLevel.A + failuresByLevel.AA + failuresByLevel.AAA;
    const score = Math.max(0, Math.round(((totalTests - totalFailures) / totalTests) * 100));

    return {
      level: complianceLevel,
      score,
      passed: totalTests - totalFailures,
      failed: totalFailures,
      total: totalTests
    };
  }

  // Calculate category scores
  private calculateCategoryScores(issues: AccessibilityIssue[]): any {
    const categoryIssues = {
      [AccessibilityCategory.PERCEIVABLE]: [],
      [AccessibilityCategory.OPERABLE]: [],
      [AccessibilityCategory.UNDERSTANDABLE]: [],
      [AccessibilityCategory.ROBUST]: []
    };

    issues.forEach(issue => {
      categoryIssues[issue.category].push(issue);
    });

    const scores: any = {};
    Object.entries(categoryIssues).forEach(([category, categoryIssues]) => {
      const weight = this.getCategoryWeight(category as AccessibilityCategory);
      const penalty = categoryIssues.reduce((sum, issue) => {
        const severityWeight = this.getSeverityWeight(issue.severity);
        return sum + (weight * severityWeight);
      }, 0);

      scores[category.toLowerCase()] = Math.max(0, Math.round(100 - penalty));
    });

    return scores;
  }

  // Calculate overall score
  private calculateOverallScore(categoryScores: any): number {
    const weights = {
      perceivable: 0.3,
      operable: 0.3,
      understandable: 0.2,
      robust: 0.2
    };

    let totalScore = 0;
    let totalWeight = 0;

    Object.entries(categoryScores).forEach(([category, score]) => {
      const weight = weights[category as keyof typeof weights];
      totalScore += (score as number) * weight;
      totalWeight += weight;
    });

    return Math.round(totalWeight > 0 ? totalScore / totalWeight : 0);
  }

  // Get category weight
  private getCategoryWeight(category: AccessibilityCategory): number {
    const weights = {
      [AccessibilityCategory.PERCEIVABLE]: 20,
      [AccessibilityCategory.OPERABLE]: 25,
      [AccessibilityCategory.UNDERSTANDABLE]: 20,
      [AccessibilityCategory.ROBUST]: 15
    };
    return weights[category] || 10;
  }

  // Get severity weight
  private getSeverityWeight(severity: AccessibilitySeverity): number {
    const weights = {
      [AccessibilitySeverity.LOW]: 0.5,
      [AccessibilitySeverity.MEDIUM]: 1,
      [AccessibilitySeverity.HIGH]: 2,
      [AccessibilitySeverity.CRITICAL]: 3
    };
    return weights[severity] || 1;
  }

  // Generate recommendations
  private generateRecommendations(issues: AccessibilityIssue[], categoryScores: any): string[] {
    const recommendations: string[] = [];

    // Category-specific recommendations
    if (categoryScores.perceivable < 80) {
      recommendations.push('Improve alt text for images and ensure proper color contrast');
    }

    if (categoryScores.operable < 80) {
      recommendations.push('Enhance keyboard navigation and focus management');
    }

    if (categoryScores.understandable < 80) {
      recommendations.push('Improve form labels and page language declarations');
    }

    if (categoryScores.robust < 80) {
      recommendations.push('Fix ARIA attributes and ensure proper HTML semantics');
    }

    // Issue-specific recommendations
    const criticalIssues = issues.filter(i => i.severity === AccessibilitySeverity.CRITICAL);
    if (criticalIssues.length > 0) {
      recommendations.push('Address critical accessibility issues immediately');
    }

    // Screen reader recommendations
    if (this.screenReaderUsage.length > 0) {
      recommendations.push('Optimize screen reader experience with proper landmarks and live regions');
    }

    // Keyboard navigation recommendations
    if (this.keyboardNavigation.length > 10) {
      recommendations.push('Ensure all interactive elements are keyboard accessible');
    }

    return recommendations;
  }

  // Determine report priority
  private determineReportPriority(overallScore: number, issues: AccessibilityIssue[]): 'low' | 'medium' | 'high' | 'critical' {
    const criticalIssues = issues.filter(i => i.severity === AccessibilitySeverity.CRITICAL);
    const highIssues = issues.filter(i => i.severity === AccessibilitySeverity.HIGH);

    if (criticalIssues.length > 0) return 'critical';
    if (highIssues.length > 3) return 'high';
    if (overallScore < 70) return 'high';
    if (overallScore < 85) return 'medium';
    return 'low';
  }

  // Report critical accessibility issues
  private reportCriticalAccessibilityIssues(issues: AccessibilityIssue[]): void {
    issues.forEach(issue => {
      reportMessage(`Critical accessibility issue: ${issue.description}`, 'error', {
        issueId: issue.id,
        category: issue.category,
        severity: issue.severity,
        wcagLevel: issue.wcagLevel,
        rule: issue.rule,
        element: issue.element,
        location: issue.location,
        recommendations: issue.recommendations
      });
    });
  }

  // Process accessibility issue
  private processAccessibilityIssue(issue: AccessibilityIssue): void {
    // Check for duplicates
    const existingIssue = this.issues.find(existing =>
      existing.rule === issue.rule &&
      existing.element.selector === issue.element.selector &&
      !existing.resolved
    );

    if (!existingIssue) {
      this.issues.push(issue);

      // Track issue event
      trackRUMEvent('accessibility-issue-detected', {
        issueId: issue.id,
        category: issue.category,
        severity: issue.severity,
        wcagLevel: issue.wcagLevel,
        rule: issue.rule,
        pageType: issue.location.pageType,
        automated: issue.automated,
        timestamp: Date.now()
      });

      // Report if critical
      if (issue.severity === AccessibilitySeverity.CRITICAL) {
        this.reportCriticalAccessibilityIssues([issue]);
      }
    }
  }

  // Helper methods

  // Check if element has associated label
  private hasAssociatedLabel(element: HTMLElement): boolean {
    // Check for explicit label association
    const id = element.id;
    if (id) {
      const label = document.querySelector(`label[for="${id}"]`);
      if (label) return true;
    }

    // Check for implicit label association
    const parent = element.closest('label');
    if (parent) return true;

    // Check for ARIA labels
    if (element.getAttribute('aria-label') || element.getAttribute('aria-labelledby')) {
      return true;
    }

    // Check for title attribute (less ideal but still valid)
    if (element.getAttribute('title')) {
      return true;
    }

    return false;
  }

  // Generate CSS selector for element
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

  // Get current location
  private getCurrentLocation(): any {
    return {
      url: window.location.href,
      pageType: this.getPageType(),
      timestamp: Date.now()
    };
  }

  // Get current context
  private getCurrentContext(): any {
    return {
      deviceType: this.deviceType(),
      userAgent: navigator.userAgent,
      screenReaderActive: this.screenReaderDetected,
      keyboardNavigationActive: this.keyboardNavigationActive,
      viewportSize: `${window.innerWidth}x${window.innerHeight}`
    };
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

  // Get device type
  private deviceType(): string {
    if (/iPhone|iPad|iPod|Android/i.test(navigator.userAgent)) {
      return 'mobile';
    }
    return 'desktop';
  }

  // Generate issue ID
  private generateIssueId(): string {
    return `a11y_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Public API methods

  // Get accessibility compliance report
  getComplianceReport(): AccessibilityComplianceReport | null {
    const pageType = this.getPageType();
    const url = window.location.href;
    const cacheKey = `${pageType}_${url}`;

    return this.complianceCache.get(cacheKey) || null;
  }

  // Get all issues
  getIssues(): AccessibilityIssue[] {
    return [...this.issues];
  }

  // Get issues by severity
  getIssuesBySeverity(severity: AccessibilitySeverity): AccessibilityIssue[] {
    return this.issues.filter(issue => issue.severity === severity && !issue.resolved);
  }

  // Get issues by category
  getIssuesByCategory(category: AccessibilityCategory): AccessibilityIssue[] {
    return this.issues.filter(issue => issue.category === category && !issue.resolved);
  }

  // Get screen reader usage statistics
  getScreenReaderUsage(): ScreenReaderUsage[] {
    return [...this.screenReaderUsage];
  }

  // Get keyboard navigation statistics
  getKeyboardNavigation(): KeyboardNavigation[] {
    return [...this.keyboardNavigation];
  }

  // Mark issue as resolved
  resolveIssue(issueId: string): void {
    const issue = this.issues.find(i => i.id === issueId);
    if (issue) {
      issue.resolved = true;

      trackRUMEvent('accessibility-issue-resolved', {
        issueId: issue.id,
        category: issue.category,
        severity: issue.severity,
        timestamp: Date.now()
      });
    }
  }

  // Report manual issue
  reportManualIssue(issueData: Partial<AccessibilityIssue>): void {
    const issue: AccessibilityIssue = {
      id: this.generateIssueId(),
      category: issueData.category || AccessibilityCategory.PERCEIVABLE,
      severity: issueData.severity || AccessibilitySeverity.MEDIUM,
      wcagLevel: issueData.wcagLevel || WCAGLevel.AA,
      rule: issueData.rule || 'Manual Report',
      description: issueData.description || 'Manually reported issue',
      element: issueData.element || {
        tagName: 'UNKNOWN',
        selector: 'manual',
        text: ''
      },
      location: this.getCurrentLocation(),
      context: this.getCurrentContext(),
      recommendations: issueData.recommendations || ['Review and fix reported issue'],
      automated: false,
      resolved: false,
      reported: true
    };

    this.processAccessibilityIssue(issue);
  }

  // Enable/disable monitoring
  setMonitoringEnabled(enabled: boolean): void {
    this.monitoringEnabled = enabled;
  }

  // Export accessibility data
  exportData(): any {
    return {
      issues: this.issues,
      screenReaderUsage: this.screenReaderUsage,
      keyboardNavigation: this.keyboardNavigation,
      complianceReports: Object.fromEntries(this.complianceCache),
      currentReport: this.getComplianceReport(),
      summary: {
        totalIssues: this.issues.length,
        unresolvedIssues: this.issues.filter(i => !i.resolved).length,
        criticalIssues: this.getIssuesBySeverity(AccessibilitySeverity.CRITICAL).length,
        highIssues: this.getIssuesBySeverity(AccessibilitySeverity.HIGH).length,
        overallScore: this.getComplianceReport()?.overallScore || 0
      }
    };
  }
}

// Create and export singleton instance
export const accessibilityMonitoringSystem = AccessibilityMonitoringSystem.getInstance();

// Initialize automatically
if (typeof window !== 'undefined') {
  if (document.readyState === 'complete') {
    accessibilityMonitoringSystem.initialize();
  } else {
    window.addEventListener('load', () => {
      accessibilityMonitoringSystem.initialize();
    });
  }
}

// Export helper functions
export const initializeAccessibilityMonitoring = () => accessibilityMonitoringSystem.initialize();
export const getAccessibilityReport = () => accessibilityMonitoringSystem.getComplianceReport();
export const getAccessibilityIssues = () => accessibilityMonitoringSystem.getIssues();
export const reportAccessibilityIssue = (issueData: Partial<AccessibilityIssue>) =>
  accessibilityMonitoringSystem.reportManualIssue(issueData);
export const resolveAccessibilityIssue = (issueId: string) =>
  accessibilityMonitoringSystem.resolveIssue(issueId);
export const exportAccessibilityData = () => accessibilityMonitoringSystem.exportData();

// Export types
export { AccessibilityIssue, ScreenReaderUsage, KeyboardNavigation, AccessibilityComplianceReport };