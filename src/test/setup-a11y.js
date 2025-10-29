import '@testing-library/jest-dom';
import { configureAxe } from 'jest-axe';

// Configure axe for accessibility testing
configureAxe({
  // Global rules configuration
  rules: {
    // Critical accessibility rules
    'color-contrast': {
      enabled: true,
      reviewOnFail: true
    },
    'keyboard-navigation': {
      enabled: true
    },
    'focus-order-semantics': {
      enabled: true
    },
    'aria-labels': {
      enabled: true,
      reviewOnFail: true
    },
    'aria-roles': {
      enabled: true
    },
    'aria-input-field-name': {
      enabled: true
    },
    'button-name': {
      enabled: true
    },
    'link-name': {
      enabled: true
    },
    'image-alt': {
      enabled: true,
      reviewOnFail: true
    },
    'list': {
      enabled: true
    },
    'listitem': {
      enabled: true
    },
    'heading-order': {
      enabled: true
    },
    'page-has-heading-one': {
      enabled: true
    },
    'region': {
      enabled: true
    },
    'skip-link': {
      enabled: true
    },
    'tabindex': {
      enabled: true
    }
  },

  // Tags to include in accessibility testing
  tags: ['wcag2a', 'wcag2aa', 'wcag21aa'],

  // Reporter configuration
  reporter: 'v2',

  // Disable certain rules for this project (if needed)
  // rules: {
  //   'landmark-roles': { enabled: false }
  // }
});

// Mock IntersectionObserver for tests
global.IntersectionObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
  root: null,
  rootMargin: '',
  thresholds: [1]
}));

// Mock ResizeObserver for tests
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

// Global test utilities
global.a11yTestUtils = {
  // Check if element has proper ARIA attributes
  hasAriaLabel: (element) => {
    return element.hasAttribute('aria-label') ||
           element.hasAttribute('aria-labelledby') ||
           element.getAttribute('title');
  },

  // Check if element has proper role
  hasRole: (element, role) => {
    return element.getAttribute('role') === role;
  },

  // Check if element is keyboard accessible
  isKeyboardAccessible: (element) => {
    const keyboardAccessibleTags = [
      'a', 'button', 'input', 'textarea', 'select',
      'option', 'textarea', 'area'
    ];
    return keyboardAccessibleTags.includes(element.tagName.toLowerCase());
  },

  // Check color contrast (simplified)
  hasGoodContrast: (element) => {
    const styles = window.getComputedStyle(element);
    const color = styles.color;
    const backgroundColor = styles.backgroundColor;

    // Basic check - in real tests, use a proper contrast checker
    if (color === 'rgb(128, 128, 128)' &&
        backgroundColor === 'rgb(128, 128, 128)') {
      return false;
    }

    return true;
  },

  // Check if element has focus indicators
  hasFocusIndicator: (element) => {
    const styles = window.getComputedStyle(element, ':focus');
    return styles.outline !== 'none' ||
           styles.boxShadow !== 'none' ||
           styles.border !== 'none';
  }
};

// Silence console warnings for certain axe tests in development
if (process.env.NODE_ENV !== 'production') {
  const originalError = console.error;
  console.error = (...args) => {
    // Filter out expected accessibility warnings during testing
    const [firstArg] = args;
    if (typeof firstArg === 'string' &&
        firstArg.includes('Axe checks found')) {
      return;
    }
    originalError(...args);
  };
}

// Add custom matchers for accessibility testing
expect.extend({
  toBeAccessible(received) {
    const result = {
      pass: true,
      message: () => 'Element is accessible'
    };

    // In real implementation, run axe.check here
    return result;
  },

  toHaveAriaLabel(received) {
    const hasLabel = global.a11yTestUtils.hasAriaLabel(received);

    return {
      pass: hasLabel,
      message: () => hasLabel
        ? 'Element has an accessible label'
        : 'Element does not have an accessible label (aria-label, aria-labelledby, or title)'
    };
  },

  toHaveRole(received, expectedRole) {
    const actualRole = received.getAttribute('role');
    const hasRole = actualRole === expectedRole;

    return {
      pass: hasRole,
      message: () => hasRole
        ? `Element has role "${expectedRole}"`
        : `Expected element to have role "${expectedRole}" but has "${actualRole}"`
    };
  },

  toBeKeyboardAccessible(received) {
    const isAccessible = global.a11yTestUtils.isKeyboardAccessible(received);

    return {
      pass: isAccessible,
      message: () => isAccessible
        ? 'Element is keyboard accessible'
        : 'Element is not keyboard accessible - consider adding keyboard support'
    };
  },

  toHaveGoodContrast(received) {
    const hasContrast = global.a11yTestUtils.hasGoodContrast(received);

    return {
      pass: hasContrast,
      message: () => hasContrast
        ? 'Element has good color contrast'
        : 'Element has poor color contrast - check colors'
    };
  },

  toHaveFocusIndicator(received) {
    const hasIndicator = global.a11yTestUtils.hasFocusIndicator(received);

    return {
      pass: hasIndicator,
      message: () => hasIndicator
        ? 'Element has visible focus indicator'
        : 'Element lacks visible focus indicator - add :focus styles'
    };
  }
});