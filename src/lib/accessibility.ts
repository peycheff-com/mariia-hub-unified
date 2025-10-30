/**
 * WCAG AAA Accessibility Utilities
 * Provides comprehensive accessibility functions for luxury beauty/fitness platform
 */

// Skip links functionality
export const skipLinks = {
  /**
   * Creates skip links for keyboard navigation
   */
  createSkipLinks: () => {
    const skipLinksHTML = `
      <div id="skip-links" class="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 z-[9999] bg-white border-2 border-champagne-500 rounded-lg p-4 shadow-xl">
        <a href="#main-content" class="block font-medium text-champagne-700 hover:text-champagne-900 focus:outline-none focus:underline">
          Skip to main content
        </a>
        <a href="#navigation" class="block font-medium text-champagne-700 hover:text-champagne-900 focus:outline-none focus:underline mt-2">
          Skip to navigation
        </a>
        <a href="#booking-form" class="block font-medium text-champagne-700 hover:text-champagne-900 focus:outline-none focus:underline mt-2">
          Skip to booking form
        </a>
        <a href="#footer" class="block font-medium text-champagne-700 hover:text-champagne-900 focus:outline-none focus:underline mt-2">
          Skip to footer
        </a>
      </div>
    `;

    // Insert skip links at the beginning of body
    if (!document.getElementById('skip-links')) {
      document.body.insertAdjacentHTML('afterbegin', skipLinksHTML);
    }
  },

  /**
   * Initializes skip links functionality
   */
  init: () => {
    // Wait for DOM to be ready
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', skipLinks.createSkipLinks);
    } else {
      skipLinks.createSkipLinks();
    }
  }
};

// Focus management utilities
export const focusManagement = {
  /**
   * Traps focus within a container element
   */
  trapFocus: (container: HTMLElement) => {
    const focusableElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    ) as NodeListOf<HTMLElement>;

    const firstFocusable = focusableElements[0];
    const lastFocusable = focusableElements[focusableElements.length - 1];

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Tab') {
        if (e.shiftKey) {
          // Shift + Tab
          if (document.activeElement === firstFocusable) {
            lastFocusable.focus();
            e.preventDefault();
          }
        } else {
          // Tab
          if (document.activeElement === lastFocusable) {
            firstFocusable.focus();
            e.preventDefault();
          }
        }
      }
    };

    container.addEventListener('keydown', handleKeyDown);

    // Store cleanup function
    container.dataset.focusTrapHandler = 'true';
    (container as any)._focusTrapCleanup = () => {
      container.removeEventListener('keydown', handleKeyDown);
      delete container.dataset.focusTrapHandler;
      delete (container as any)._focusTrapCleanup;
    };

    // Focus first element
    if (firstFocusable) {
      firstFocusable.focus();
    }
  },

  /**
   * Removes focus trap from container
   */
  removeFocusTrap: (container: HTMLElement) => {
    if ((container as any)._focusTrapCleanup) {
      (container as any)._focusTrapCleanup();
    }
  },

  /**
   * Restores focus to previous element
   */
  restoreFocus: (previousElement: HTMLElement | null) => {
    if (previousElement && previousElement.focus) {
      setTimeout(() => previousElement.focus(), 100);
    }
  }
};

// ARIA live regions management
export const liveRegions = {
  /**
   * Creates a live region for announcements
   */
  createLiveRegion: (polite: boolean = true): HTMLElement => {
    const region = document.createElement('div');
    region.setAttribute('aria-live', polite ? 'polite' : 'assertive');
    region.setAttribute('aria-atomic', 'true');
    region.className = 'sr-only';
    region.id = `live-region-${Date.now()}`;
    document.body.appendChild(region);
    return region;
  },

  /**
   * Makes an announcement to screen readers
   */
  announce: (message: string, polite: boolean = true) => {
    const region = liveRegions.createLiveRegion(polite);
    region.textContent = message;

    // Clean up after announcement
    setTimeout(() => {
      if (region.parentNode) {
        region.parentNode.removeChild(region);
      }
    }, 1000);
  },

  /**
   * Creates a status region for dynamic content updates
   */
  createStatusRegion: (id: string): HTMLElement => {
    let region = document.getElementById(id);
    if (!region) {
      region = document.createElement('div');
      region.id = id;
      region.setAttribute('aria-live', 'polite');
      region.setAttribute('aria-atomic', 'true');
      region.className = 'sr-only';
      document.body.appendChild(region);
    }
    return region;
  }
};

// Screen reader utilities
export const screenReader = {
  /**
   * Adds screen reader only text
   */
  addScreenReaderOnly: (text: string, element?: HTMLElement) => {
    const srText = document.createElement('span');
    srText.className = 'sr-only';
    srText.textContent = text;

    if (element) {
      element.appendChild(srText);
    } else {
      document.body.appendChild(srText);
    }

    return srText;
  },

  /**
   * Removes screen reader only text
   */
  removeScreenReaderOnly: (element: HTMLElement) => {
    if (element.parentNode) {
      element.parentNode.removeChild(element);
    }
  },

  /**
   * Hides element from screen readers
   */
  hideFromScreenReader: (element: HTMLElement) => {
    element.setAttribute('aria-hidden', 'true');
  },

  /**
   * Shows element to screen readers
   */
  showToScreenReader: (element: HTMLElement) => {
    element.removeAttribute('aria-hidden');
  }
};

// Keyboard navigation utilities
export const keyboardNavigation = {
  /**
   * Adds keyboard support for custom interactions
   */
  addKeyboardSupport: (element: HTMLElement, callbacks: {
    onEnter?: () => void;
    onSpace?: () => void;
    onEscape?: () => void;
    onArrowUp?: () => void;
    onArrowDown?: () => void;
    onArrowLeft?: () => void;
    onArrowRight?: () => void;
    onHome?: () => void;
    onEnd?: () => void;
  }) => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'Enter':
          if (callbacks.onEnter) {
            e.preventDefault();
            callbacks.onEnter();
          }
          break;
        case ' ':
        case 'Spacebar':
          if (callbacks.onSpace) {
            e.preventDefault();
            callbacks.onSpace();
          }
          break;
        case 'Escape':
          if (callbacks.onEscape) {
            e.preventDefault();
            callbacks.onEscape();
          }
          break;
        case 'ArrowUp':
          if (callbacks.onArrowUp) {
            e.preventDefault();
            callbacks.onArrowUp();
          }
          break;
        case 'ArrowDown':
          if (callbacks.onArrowDown) {
            e.preventDefault();
            callbacks.onArrowDown();
          }
          break;
        case 'ArrowLeft':
          if (callbacks.onArrowLeft) {
            e.preventDefault();
            callbacks.onArrowLeft();
          }
          break;
        case 'ArrowRight':
          if (callbacks.onArrowRight) {
            e.preventDefault();
            callbacks.onArrowRight();
          }
          break;
        case 'Home':
          if (callbacks.onHome) {
            e.preventDefault();
            callbacks.onHome();
          }
          break;
        case 'End':
          if (callbacks.onEnd) {
            e.preventDefault();
            callbacks.onEnd();
          }
          break;
      }
    };

    element.addEventListener('keydown', handleKeyDown);

    // Store cleanup function
    (element as any)._keyboardHandlerCleanup = () => {
      element.removeEventListener('keydown', handleKeyDown);
      delete (element as any)._keyboardHandlerCleanup;
    };

    return () => {
      element.removeEventListener('keydown', handleKeyDown);
    };
  },

  /**
   * Removes keyboard support
   */
  removeKeyboardSupport: (element: HTMLElement) => {
    if ((element as any)._keyboardHandlerCleanup) {
      (element as any)._keyboardHandlerCleanup();
    }
  },

  /**
   * Creates keyboard shortcuts
   */
  createShortcuts: (shortcuts: Record<string, () => void>) => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Skip if user is typing in an input
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.contentEditable === 'true') {
        return;
      }

      let key = '';
      if (e.ctrlKey || e.metaKey) {
        key += 'ctrl+';
      }
      if (e.altKey) {
        key += 'alt+';
      }
      if (e.shiftKey) {
        key += 'shift+';
      }
      key += e.key.toLowerCase();

      if (shortcuts[key]) {
        e.preventDefault();
        shortcuts[key]();
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }
};

// Accessibility preferences management
export const preferences = {
  /**
   * Checks if user prefers reduced motion
   */
  prefersReducedMotion: (): boolean => {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  },

  /**
   * Checks if user prefers high contrast
   */
  prefersHighContrast: (): boolean => {
    return window.matchMedia('(prefers-contrast: high)').matches;
  },

  /**
   * Gets user's preferred color scheme
   */
  prefersDarkMode: (): boolean => {
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  },

  /**
   * Sets up accessibility preferences listeners
   */
  setupPreferencesListeners: (callbacks: {
    onReducedMotionChange?: (prefersReduced: boolean) => void;
    onHighContrastChange?: (prefersHighContrast: boolean) => void;
    onDarkModeChange?: (prefersDark: boolean) => void;
  }) => {
    const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const highContrastQuery = window.matchMedia('(prefers-contrast: high)');
    const darkModeQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const handleReducedMotionChange = (e: MediaQueryListEvent) => {
      if (callbacks.onReducedMotionChange) {
        callbacks.onReducedMotionChange(e.matches);
      }
    };

    const handleHighContrastChange = (e: MediaQueryListEvent) => {
      if (callbacks.onHighContrastChange) {
        callbacks.onHighContrastChange(e.matches);
      }
    };

    const handleDarkModeChange = (e: MediaQueryListEvent) => {
      if (callbacks.onDarkModeChange) {
        callbacks.onDarkModeChange(e.matches);
      }
    };

    reducedMotionQuery.addEventListener('change', handleReducedMotionChange);
    highContrastQuery.addEventListener('change', handleHighContrastChange);
    darkModeQuery.addEventListener('change', handleDarkModeChange);

    // Initial calls
    if (callbacks.onReducedMotionChange) {
      callbacks.onReducedMotionChange(reducedMotionQuery.matches);
    }
    if (callbacks.onHighContrastChange) {
      callbacks.onHighContrastChange(highContrastQuery.matches);
    }
    if (callbacks.onDarkModeChange) {
      callbacks.onDarkModeChange(darkModeQuery.matches);
    }

    return () => {
      reducedMotionQuery.removeEventListener('change', handleReducedMotionChange);
      highContrastQuery.removeEventListener('change', handleHighContrastChange);
      darkModeQuery.removeEventListener('change', handleDarkModeChange);
    };
  }
};

// Accessibility validation utilities
export const validation = {
  /**
   * Checks if element has sufficient color contrast
   */
  checkColorContrast: (element: HTMLElement): { ratio: number; wcagLevel: 'AA' | 'AAA' | 'fail' } => {
    const styles = window.getComputedStyle(element);
    const color = styles.color;
    const backgroundColor = styles.backgroundColor;

    // Simple contrast calculation (would need more sophisticated implementation in production)
    const foreground = parseInt(color.match(/\d+/g)?.[0] || '0');
    const background = parseInt(backgroundColor.match(/\d+/g)?.[0] || '255');

    const ratio = Math.abs(foreground - background) / 255;

    let wcagLevel: 'AA' | 'AAA' | 'fail';
    if (ratio >= 7) {
      wcagLevel = 'AAA';
    } else if (ratio >= 4.5) {
      wcagLevel = 'AA';
    } else {
      wcagLevel = 'fail';
    }

    return { ratio, wcagLevel };
  },

  /**
   * Validates ARIA attributes
   */
  validateAria: (element: HTMLElement): { valid: boolean; errors: string[] } => {
    const errors: string[] = [];
    const tagName = element.tagName.toLowerCase();

    // Check for appropriate ARIA attributes
    if (element.hasAttribute('aria-label') && element.hasAttribute('aria-labelledby')) {
      errors.push('Element has both aria-label and aria-labelledby');
    }

    if (tagName === 'button' && !element.textContent?.trim() && !element.getAttribute('aria-label')) {
      errors.push('Button has no accessible name');
    }

    if (element.getAttribute('role') === 'img' && !element.getAttribute('aria-label')) {
      errors.push('Element with role="img" missing aria-label');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }
};

// Main accessibility initialization
export const accessibility = {
  init: () => {
    // Initialize skip links
    skipLinks.init();

    // Create global live region for announcements
    liveRegions.createStatusRegion('global-status');

    // Set up keyboard shortcuts
    keyboardNavigation.createShortcuts({
      'alt+s': () => {
        // Jump to search
        const searchInput = document.querySelector('input[type="search"], input[placeholder*="search" i]') as HTMLElement;
        if (searchInput) searchInput.focus();
      },
      'alt+n': () => {
        // Jump to navigation
        const nav = document.getElementById('navigation');
        if (nav) nav.focus();
      },
      'alt+m': () => {
        // Jump to main content
        const main = document.getElementById('main-content');
        if (main) main.focus();
      },
      'escape': () => {
        // Close modals or return focus
        const modal = document.querySelector('[role="dialog"]') as HTMLElement;
        if (modal) {
          const closeButton = modal.querySelector('button[aria-label*="close" i]') as HTMLElement;
          if (closeButton) closeButton.click();
        }
      }
    });

    // Set up preference listeners
    preferences.setupPreferencesListeners({
      onReducedMotionChange: (prefersReduced) => {
        document.documentElement.classList.toggle('reduce-motion', prefersReduced);
      },
      onHighContrastChange: (prefersHighContrast) => {
        document.documentElement.classList.toggle('high-contrast', prefersHighContrast);
      }
    });
  }
};

export default accessibility;