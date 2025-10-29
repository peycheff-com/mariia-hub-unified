import { expect, afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';
import { toHaveNoViolations } from 'jest-axe';
import { injectAxe, checkA11y } from 'axe-playwright';

// Extend jest-axe matchers to vitest
expect.extend(toHaveNoViolations);

// Clean up after each test
afterEach(() => {
  cleanup();
});

// Configuration for axe-core
export const a11yConfig = {
  rules: {
    // Enable all rules by default, but you can disable specific ones here
    'color-contrast': { enabled: true },
    'keyboard-navigation': { enabled: true },
    'aria-labels': { enabled: true },
    'focus-management': { enabled: true },
    'semantic-markup': { enabled: true },
    'image-alt': { enabled: true },
    'link-text': { enabled: true },
    'heading-order': { enabled: true },
    'landmark-roles': { enabled: true },
  },
  tags: ['wcag2a', 'wcag2aa', 'wcag21aa'],
  reporter: 'v2',
  runOnly: {
    type: 'tag',
    values: ['wcag2a', 'wcag2aa', 'best-practice'],
  },
};

// Helper function to check accessibility in tests
export const checkAccessibility = async (container: HTMLElement, options = {}) => {
  const results = await (await import('jest-axe')).axe(container, { ...a11yConfig, ...options });
  expect(results).toHaveNoViolations();
  return results;
};

// Mock IntersectionObserver for accessibility tests
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  observe() {}
  unobserve() {}
  disconnect() {}
};

// Mock ResizeObserver for accessibility tests
global.ResizeObserver = class ResizeObserver {
  constructor() {}
  observe() {}
  unobserve() {}
  disconnect() {}
};

// Mock requestAnimationFrame for accessibility tests
global.requestAnimationFrame = (callback: FrameRequestCallback) => {
  return setTimeout(callback, 16);
};

global.cancelAnimationFrame = (id: number) => {
  clearTimeout(id);
};

// Playwright accessibility helpers
export const setupPlaywrightA11y = async (page: any) => {
  await injectAxe(page);

  return {
    checkA11y: async (selector?: string, options?: any) => {
      await checkA11y(page, selector, {
        includedImpacts: ['serious', 'critical'],
        detailedReport: true,
        detailedReportOptions: { html: true },
        ...options,
      });
    },
  };
};

// Common accessibility test utilities
export const a11yTestHelpers = {
  // Test that all interactive elements are focusable
  testFocusableElements: async (container: HTMLElement) => {
    const interactiveElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );

    expect(interactiveElements.length).toBeGreaterThan(0);

    for (const element of interactiveElements) {
      expect(element).toHaveAttribute('tabindex');

      // Check for aria-label or aria-labelledby when appropriate
      if (element.tagName === 'BUTTON' && !element.textContent?.trim()) {
        expect(element).toHaveAttribute('aria-label');
      }
    }
  },

  // Test heading hierarchy
  testHeadingHierarchy: async (container: HTMLElement) => {
    const headings = container.querySelectorAll('h1, h2, h3, h4, h5, h6');
    let previousLevel = 0;

    headings.forEach((heading) => {
      const currentLevel = parseInt(heading.tagName.substring(1));

      if (previousLevel > 0 && currentLevel > previousLevel + 1) {
        throw new Error(`Heading level skipped: h${previousLevel} to h${currentLevel}`);
      }

      previousLevel = currentLevel;
    });
  },

  // Test landmark regions
  testLandmarks: async (container: HTMLElement) => {
    const landmarks = container.querySelectorAll(
      'main, nav, header, footer, aside, section[aria-label], section[aria-labelledby]'
    );

    // Check for at least one main landmark
    const mainLandmark = container.querySelector('main, [role="main"]');
    expect(mainLandmark).toBeInTheDocument();
  },

  // Test form labels
  testFormLabels: async (container: HTMLElement) => {
    const inputs = container.querySelectorAll('input, select, textarea');

    inputs.forEach((input) => {
      const hasLabel =
        input.hasAttribute('aria-label') ||
        input.hasAttribute('aria-labelledby') ||
        container.querySelector(`label[for="${input.id}"]`);

      if (input.type !== 'hidden') {
        expect(hasLabel).toBe(true);
      }
    });
  },

  // Test alt text for images
  testImageAltText: async (container: HTMLElement) => {
    const images = container.querySelectorAll('img');

    images.forEach((img) => {
      if (!img.hasAttribute('alt')) {
        throw new Error('Image missing alt attribute');
      }
    });
  },

  // Test link text
  testLinkText: async (container: HTMLElement) => {
    const links = container.querySelectorAll('a[href]');

    links.forEach((link) => {
      const hasText =
        link.textContent?.trim() ||
        link.getAttribute('aria-label') ||
        link.querySelector('img[alt]');

      expect(hasText).toBeTruthy();
    });
  },

  // Test color contrast (basic check)
  testColorContrast: async (container: HTMLElement) => {
    const textElements = container.querySelectorAll('*');

    // This is a simplified check - real contrast checking requires actual rendering
    textElements.forEach((element) => {
      const styles = window.getComputedStyle(element);
      const color = styles.color;
      const backgroundColor = styles.backgroundColor;

      // Skip transparent backgrounds
      if (backgroundColor === 'rgba(0, 0, 0, 0)' || backgroundColor === 'transparent') {
        return;
      }

      // Basic check that colors are defined
      expect(color).not.toBe('');
      expect(backgroundColor).not.toBe('');
    });
  },

  // Test keyboard navigation
  testKeyboardNavigation: async (container: HTMLElement) => {
    const focusableElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );

    // Check that focusable elements have tabindex
    focusableElements.forEach((element) => {
      const tabIndex = element.getAttribute('tabindex');
      if (tabIndex === null || parseInt(tabIndex) >= 0) {
        expect(element).toBeVisible();
      }
    });

    // Check for skip links if there are many focusable elements
    if (focusableElements.length > 10) {
      const skipLink = container.querySelector('a[href^="#"]');
      if (skipLink) {
        expect(skipLink).toBeVisible();
      }
    }
  },

  // Test ARIA attributes
  testAriaAttributes: async (container: HTMLElement) => {
    // Check for valid ARIA roles
    const elementsWithRoles = container.querySelectorAll('[role]');

    elementsWithRoles.forEach((element) => {
      const role = element.getAttribute('role');
      const validRoles = [
        'alert', 'alertdialog', 'application', 'article', 'banner', 'button',
        'cell', 'checkbox', 'columnheader', 'combobox', 'complementary', 'contentinfo',
        'definition', 'dialog', 'directory', 'document', 'feed', 'figure', 'form',
        'grid', 'gridcell', 'group', 'heading', 'img', 'link', 'list', 'listbox',
        'listitem', 'log', 'main', 'marquee', 'math', 'menu', 'menubar', 'menuitem',
        'menuitemcheckbox', 'menuitemradio', 'navigation', 'none', 'note', 'option',
        'presentation', 'progressbar', 'radio', 'radiogroup', 'region', 'row',
        'rowgroup', 'rowheader', 'scrollbar', 'search', 'searchbox', 'separator',
        'slider', 'spinbutton', 'status', 'switch', 'tab', 'table', 'tablist',
        'tabpanel', 'term', 'textbox', 'timer', 'toolbar', 'tooltip', 'tree',
        'treegrid', 'treeitem', 'main', 'navigation', 'complementary', 'contentinfo'
      ];

      expect(validRoles).toContain(role);
    });

    // Check for invalid ARIA attributes
    const elementsWithAria = container.querySelectorAll('[aria-*]');

    elementsWithAria.forEach((element) => {
      const attributes = element.attributes;

      for (let i = 0; i < attributes.length; i++) {
        const attr = attributes[i];

        if (attr.name.startsWith('aria-')) {
          // Ensure ARIA attributes have values
          expect(attr.value).toBeDefined();

          // Check for common ARIA mistakes
          if (attr.name === 'aria-hidden' && attr.value === 'false') {
            console.warn('aria-hidden="false" is usually unnecessary');
          }

          if (attr.name === 'aria-label' && !attr.value.trim()) {
            throw new Error('aria-label cannot be empty');
          }
        }
      }
    });
  },

  // Test focus management in modals
  testModalFocus: async (container: HTMLElement) => {
    const modal = container.querySelector('[role="dialog"]');

    if (modal) {
      // Check for focus trap
      const focusableElements = modal.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );

      if (focusableElements.length > 0) {
        // Check that first element can be focused
        expect(focusableElements[0]).toBeVisible();

        // Check for close button
        const closeButton = modal.querySelector('button[aria-label*="close"], button[aria-label*="Close"]');
        if (closeButton) {
          expect(closeButton).toBeVisible();
        }
      }
    }
  },
};

// Export default a11y setup
export default {
  a11yConfig,
  checkAccessibility,
  setupPlaywrightA11y,
  ...a11yTestHelpers,
};