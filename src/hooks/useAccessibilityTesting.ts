import { useEffect, useCallback, useState } from 'react';
import { validation, screenReader } from '@/lib/accessibility';

interface AccessibilityIssue {
  type: 'error' | 'warning';
  message: string;
  element: HTMLElement;
  category: 'aria' | 'contrast' | 'keyboard' | 'semantic' | 'focus';
  severity: 'low' | 'medium' | 'high' | 'critical';
}

interface AccessibilityTestResult {
  issues: AccessibilityIssue[];
  score: number;
  passedTests: string[];
  failedTests: string[];
  recommendations: string[];
}

export const useAccessibilityTesting = () => {
  const [isTesting, setIsTesting] = useState(false);
  const [results, setResults] = useState<AccessibilityTestResult | null>(null);
  const [realTimeMonitoring, setRealTimeMonitoring] = useState(false);

  // Test for proper heading structure
  const testHeadingStructure = useCallback(() => {
    const issues: AccessibilityIssue[] = [];
    const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
    const headingLevels: number[] = [];

    headings.forEach((heading, index) => {
      const level = parseInt(heading.tagName.substring(1));
      headingLevels.push(level);

      // Check for skipped heading levels
      if (index > 0) {
        const previousLevel = headingLevels[index - 1];
        if (level > previousLevel + 1) {
          issues.push({
            type: 'error',
            message: `Heading level skipped: h${previousLevel} to h${level}`,
            element: heading as HTMLElement,
            category: 'semantic',
            severity: 'medium'
          });
        }
      }

      // Check for empty headings
      if (!heading.textContent?.trim()) {
        issues.push({
          type: 'error',
          message: 'Empty heading found',
          element: heading as HTMLElement,
          category: 'semantic',
          severity: 'high'
        });
      }
    });

    // Check for missing h1
    const h1s = document.querySelectorAll('h1');
    if (h1s.length === 0) {
      issues.push({
        type: 'error',
        message: 'No h1 found on page',
        element: document.body,
        category: 'semantic',
        severity: 'critical'
      });
    } else if (h1s.length > 1) {
      issues.push({
        type: 'warning',
        message: 'Multiple h1s found',
        element: h1s[1] as HTMLElement,
        category: 'semantic',
        severity: 'medium'
      });
    }

    return issues;
  }, []);

  // Test for ARIA attributes
  const testAriaAttributes = useCallback(() => {
    const issues: AccessibilityIssue[] = [];

    // Test all interactive elements
    const interactiveElements = document.querySelectorAll(
      'button, a, input, select, textarea, [role="button"], [onclick]'
    );

    interactiveElements.forEach((element) => {
      const htmlElement = element as HTMLElement;
      const validation = validation.validateAria(htmlElement);

      validation.errors.forEach((error) => {
        issues.push({
          type: 'error',
          message: error,
          element: htmlElement,
          category: 'aria',
          severity: 'medium'
        });
      });

      // Check for missing alt text on images
      if (element.tagName === 'IMG' && !element.getAttribute('alt')) {
        issues.push({
          type: 'error',
          message: 'Image missing alt text',
          element: htmlElement,
          category: 'aria',
          severity: 'high'
        });
      }
    });

    return issues;
  }, []);

  // Test for color contrast
  const testColorContrast = useCallback(() => {
    const issues: AccessibilityIssue[] = [];
    const textElements = document.querySelectorAll('p, span, div, h1, h2, h3, h4, h5, h6, button, a, label');

    textElements.forEach((element) => {
      const htmlElement = element as HTMLElement;
      const computedStyle = window.getComputedStyle(htmlElement);

      // Skip hidden elements
      if (computedStyle.display === 'none' || computedStyle.visibility === 'hidden') {
        return;
      }

      const contrast = validation.checkColorContrast(htmlElement);

      if (contrast.wcagLevel === 'fail') {
        issues.push({
          type: 'error',
          message: `Insufficient color contrast: ${contrast.ratio.toFixed(2)}:1`,
          element: htmlElement,
          category: 'contrast',
          severity: 'high'
        });
      } else if (contrast.ratio < 7) {
        issues.push({
          type: 'warning',
          message: `Color contrast could be improved for WCAG AAA: ${contrast.ratio.toFixed(2)}:1`,
          element: htmlElement,
          category: 'contrast',
          severity: 'low'
        });
      }
    });

    return issues;
  }, []);

  // Test for keyboard accessibility
  const testKeyboardAccessibility = useCallback(() => {
    const issues: AccessibilityIssue[] = [];

    // Test tab order
    const focusableElements = document.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );

    if (focusableElements.length === 0) {
      issues.push({
        type: 'error',
        message: 'No focusable elements found',
        element: document.body,
        category: 'keyboard',
        severity: 'critical'
      });
    }

    // Test for positive tabindex values (should be avoided)
    const positiveTabindexes = document.querySelectorAll('[tabindex]:not([tabindex="-1"]):not([tabindex="0"])');
    positiveTabindexes.forEach((element) => {
      issues.push({
        type: 'warning',
        message: 'Positive tabindex found - consider restructuring content instead',
        element: element as HTMLElement,
        category: 'keyboard',
        severity: 'medium'
      });
    });

    return issues;
  }, []);

  // Test for focus management
  const testFocusManagement = useCallback(() => {
    const issues: AccessibilityIssue[] = [];

    // Test modal focus trapping
    const modals = document.querySelectorAll('[role="dialog"]');
    modals.forEach((modal) => {
      const modalElement = modal as HTMLElement;
      const focusableElements = modalElement.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );

      if (focusableElements.length === 0) {
        issues.push({
          type: 'error',
          message: 'Modal has no focusable elements',
          element: modalElement,
          category: 'focus',
          severity: 'high'
        });
      }
    });

    // Test for visible focus indicators
    const style = document.createElement('style');
    style.textContent = `
      .test-focus-outline:focus {
        outline: 3px solid red !important;
        outline-offset: 2px !important;
      }
    `;
    document.head.appendChild(style);

    return issues;
  }, []);

  // Run comprehensive accessibility test
  const runAccessibilityTest = useCallback(async () => {
    setIsTesting(true);

    try {
      const allIssues: AccessibilityIssue[] = [];

      // Run all tests
      allIssues.push(...testHeadingStructure());
      allIssues.push(...testAriaAttributes());
      allIssues.push(...testColorContrast());
      allIssues.push(...testKeyboardAccessibility());
      allIssues.push(...testFocusManagement());

      // Calculate score
      const criticalIssues = allIssues.filter(i => i.severity === 'critical').length;
      const highIssues = allIssues.filter(i => i.severity === 'high').length;
      const mediumIssues = allIssues.filter(i => i.severity === 'medium').length;
      const lowIssues = allIssues.filter(i => i.severity === 'low').length;

      // Weighted score calculation
      const weightedIssues = criticalIssues * 10 + highIssues * 5 + mediumIssues * 2 + lowIssues * 1;
      const maxPossibleScore = 100;
      const score = Math.max(0, maxPossibleScore - weightedIssues);

      // Generate recommendations
      const recommendations: string[] = [];

      if (criticalIssues > 0) {
        recommendations.push('Fix critical accessibility issues immediately');
      }
      if (highIssues > 0) {
        recommendations.push('Address high-priority accessibility issues');
      }
      if (allIssues.filter(i => i.category === 'contrast').length > 0) {
        recommendations.push('Improve color contrast ratios');
      }
      if (allIssues.filter(i => i.category === 'aria').length > 0) {
        recommendations.push('Add proper ARIA labels and attributes');
      }
      if (allIssues.filter(i => i.category === 'keyboard').length > 0) {
        recommendations.push('Improve keyboard navigation');
      }

      const testResult: AccessibilityTestResult = {
        issues: allIssues,
        score,
        passedTests: ['Heading structure', 'ARIA attributes', 'Color contrast', 'Keyboard accessibility', 'Focus management'].filter(test => {
          const testIssues = allIssues.filter(i => i.category === test.toLowerCase().split(' ')[0] as any);
          return testIssues.length === 0;
        }),
        failedTests: ['Heading structure', 'ARIA attributes', 'Color contrast', 'Keyboard accessibility', 'Focus management'].filter(test => {
          const testIssues = allIssues.filter(i => i.category === test.toLowerCase().split(' ')[0] as any);
          return testIssues.length > 0;
        }),
        recommendations
      };

      setResults(testResult);

      // Log results to console in development
      if (process.env.NODE_ENV === 'development') {
        console.group('🔍 Accessibility Test Results');
        console.log(`Score: ${score}/100`);
        console.log(`Issues found: ${allIssues.length}`);
        console.table(allIssues);
        console.log('Recommendations:', recommendations);
        console.groupEnd();
      }

      return testResult;
    } finally {
      setIsTesting(false);
    }
  }, [testHeadingStructure, testAriaAttributes, testColorContrast, testKeyboardAccessibility, testFocusManagement]);

  // Set up real-time monitoring
  const startRealTimeMonitoring = useCallback(() => {
    setRealTimeMonitoring(true);

    const observer = new MutationObserver((mutations) => {
      let shouldRerunTest = false;

      mutations.forEach((mutation) => {
        if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
          // Check if any significant content was added
          mutation.addedNodes.forEach((node) => {
            if (node.nodeType === Node.ELEMENT_NODE) {
              const element = node as Element;
              if (element.tagName === 'BUTTON' || element.tagName === 'A' ||
                  element.tagName === 'IMG' || element.querySelector('button, a, img')) {
                shouldRerunTest = true;
              }
            }
          });
        }
      });

      if (shouldRerunTest) {
        // Debounce re-running the test
        setTimeout(() => {
          runAccessibilityTest();
        }, 1000);
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['aria-label', 'role', 'alt', 'tabindex']
    });

    return () => {
      observer.disconnect();
      setRealTimeMonitoring(false);
    };
  }, [runAccessibilityTest]);

  // Stop real-time monitoring
  const stopRealTimeMonitoring = useCallback(() => {
    setRealTimeMonitoring(false);
  }, []);

  // Generate accessibility report
  const generateReport = useCallback(() => {
    if (!results) return null;

    const report = {
      timestamp: new Date().toISOString(),
      url: window.location.href,
      userAgent: navigator.userAgent,
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight
      },
      results: {
        score: results.score,
        totalIssues: results.issues.length,
        criticalIssues: results.issues.filter(i => i.severity === 'critical').length,
        highIssues: results.issues.filter(i => i.severity === 'high').length,
        mediumIssues: results.issues.filter(i => i.severity === 'medium').length,
        lowIssues: results.issues.filter(i => i.severity === 'low').length,
        issuesByCategory: {
          aria: results.issues.filter(i => i.category === 'aria').length,
          contrast: results.issues.filter(i => i.category === 'contrast').length,
          keyboard: results.issues.filter(i => i.category === 'keyboard').length,
          semantic: results.issues.filter(i => i.category === 'semantic').length,
          focus: results.issues.filter(i => i.category === 'focus').length
        },
        passedTests: results.passedTests,
        failedTests: results.failedTests,
        recommendations: results.recommendations
      }
    };

    return report;
  }, [results]);

  // Export results to JSON
  const exportResults = useCallback(() => {
    const report = generateReport();
    if (!report) return;

    const blob = new Blob([JSON.stringify(report, null, 2)], {
      type: 'application/json'
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `accessibility-report-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, [generateReport]);

  return {
    isTesting,
    results,
    realTimeMonitoring,
    runAccessibilityTest,
    startRealTimeMonitoring,
    stopRealTimeMonitoring,
    generateReport,
    exportResults
  };
};

export default useAccessibilityTesting;