// Accessibility utilities and helpers
import { logger } from '@/lib/logger';

export interface AriaAttributes {
  'aria-label'?: string;
  'aria-labelledby'?: string;
  'aria-describedby'?: string;
  'aria-expanded'?: boolean;
  'aria-pressed'?: boolean;
  'aria-selected'?: boolean;
  'aria-checked'?: boolean;
  'aria-hidden'?: boolean;
  'aria-live'?: 'polite' | 'assertive' | 'off';
  'aria-atomic'?: boolean;
  'aria-busy'?: boolean;
  'aria-current'?: string | boolean;
  'aria-disabled'?: boolean;
  'aria-invalid'?: boolean;
  'aria-required'?: boolean;
  'aria-haspopup'?: boolean | 'menu' | 'listbox' | 'tree' | 'grid' | 'dialog';
  'role'?: string;
}

// Announce messages to screen readers
export class ScreenReaderAnnouncer {
  private static instance: ScreenReaderAnnouncer;
  private element: HTMLElement | null = null;

  private constructor() {
    this.createElement();
  }

  static getInstance(): ScreenReaderAnnouncer {
    if (!ScreenReaderAnnouncer.instance) {
      ScreenReaderAnnouncer.instance = new ScreenReaderAnnouncer();
    }
    return ScreenReaderAnnouncer.instance;
  }

  private createElement(): void {
    if (typeof document === 'undefined') return;

    this.element = document.createElement('div');
    this.element.setAttribute('aria-live', 'polite');
    this.element.setAttribute('aria-atomic', 'true');
    this.element.style.position = 'absolute';
    this.element.style.left = '-10000px';
    this.element.style.width = '1px';
    this.element.style.height = '1px';
    this.element.style.overflow = 'hidden';
    document.body.appendChild(this.element);
  }

  announce(message: string, priority: 'polite' | 'assertive' = 'polite'): void {
    if (!this.element) return;

    // Update aria-live region based on priority
    this.element.setAttribute('aria-live', priority);

    // Clear and announce
    this.element.textContent = '';
    setTimeout(() => {
      if (this.element) {
        this.element.textContent = message;
      }
    }, 100);
  }

  clear(): void {
    if (this.element) {
      this.element.textContent = '';
    }
  }
}

// Focus management utilities
export class FocusManager {
  // Trap focus within a container
  static trapFocus(container: HTMLElement): () => void {
    const focusableElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    ) as NodeListOf<HTMLElement>;

    if (focusableElements.length === 0) {
      return () => {};
    }

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          lastElement.focus();
          e.preventDefault();
        }
      } else {
        if (document.activeElement === lastElement) {
          firstElement.focus();
          e.preventDefault();
        }
      }
    };

    container.addEventListener('keydown', handleTabKey);

    // Set initial focus
    firstElement.focus();

    // Return cleanup function
    return () => {
      container.removeEventListener('keydown', handleTabKey);
    };
  }

  // Restore focus to previous element
  static restoreFocus(previousElement: HTMLElement | null): void {
    if (previousElement) {
      previousElement.focus();
    }
  }

  // Get all focusable elements in container
  static getFocusableElements(container: HTMLElement): HTMLElement[] {
    const selector = [
      'button:not([disabled])',
      '[href]',
      'input:not([disabled])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      '[tabindex]:not([tabindex="-1"])',
      'details summary',
      'iframe',
      'embed',
      'object'
    ].join(', ');

    return Array.from(container.querySelectorAll(selector)) as HTMLElement[];
  }

  // Check if element is focusable
  static isFocusable(element: HTMLElement): boolean {
    if (element.hasAttribute('disabled') || element.getAttribute('aria-disabled') === 'true') {
      return false;
    }

    const tabindex = element.getAttribute('tabindex');
    if (tabindex && parseInt(tabindex, 10) < 0) {
      return false;
    }

    const tagName = element.tagName.toLowerCase();
    const focusableTags = [
      'button', 'input', 'select', 'textarea',
      'a', 'iframe', 'embed', 'object',
      'details', 'summary'
    ];

    return focusableTags.includes(tagName) || element.isContentEditable || element.getAttribute('tabindex') !== null;
  }
}

// Keyboard navigation utilities
export class KeyboardNavigation {
  // Add keyboard navigation to a list/grid
  static createNavigation(
    container: HTMLElement,
    options: {
      orientation?: 'horizontal' | 'vertical' | 'both';
      loop?: boolean;
      onSelect?: (element: HTMLElement) => void;
      onActivate?: (element: HTMLElement) => void;
    } = {}
  ): () => void {
    const { orientation = 'vertical', loop = true, onSelect, onActivate } = options;
    const items = FocusManager.getFocusableElements(container);

    if (items.length === 0) {
      return () => {};
    }

    let currentIndex = -1;

    const moveFocus = (direction: 'next' | 'previous' | 'first' | 'last') => {
      let newIndex = currentIndex;

      switch (direction) {
        case 'next':
          newIndex = currentIndex + 1;
          if (loop && newIndex >= items.length) {
            newIndex = 0;
          } else if (newIndex >= items.length) {
            newIndex = items.length - 1;
          }
          break;
        case 'previous':
          newIndex = currentIndex - 1;
          if (loop && newIndex < 0) {
            newIndex = items.length - 1;
          } else if (newIndex < 0) {
            newIndex = 0;
          }
          break;
        case 'first':
          newIndex = 0;
          break;
        case 'last':
          newIndex = items.length - 1;
          break;
      }

      if (newIndex !== currentIndex && items[newIndex]) {
        currentIndex = newIndex;
        items[newIndex].focus();
        onActivate?.(items[newIndex]);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowDown':
          if (orientation === 'vertical' || orientation === 'both') {
            e.preventDefault();
            moveFocus('next');
          }
          break;
        case 'ArrowUp':
          if (orientation === 'vertical' || orientation === 'both') {
            e.preventDefault();
            moveFocus('previous');
          }
          break;
        case 'ArrowRight':
          if (orientation === 'horizontal' || orientation === 'both') {
            e.preventDefault();
            moveFocus('next');
          }
          break;
        case 'ArrowLeft':
          if (orientation === 'horizontal' || orientation === 'both') {
            e.preventDefault();
            moveFocus('previous');
          }
          break;
        case 'Home':
          e.preventDefault();
          moveFocus('first');
          break;
        case 'End':
          e.preventDefault();
          moveFocus('last');
          break;
        case 'Enter':
        case ' ':
          if (items[currentIndex]) {
            e.preventDefault();
            onSelect?.(items[currentIndex]);
          }
          break;
      }
    };

    container.addEventListener('keydown', handleKeyDown);

    // Return cleanup function
    return () => {
      container.removeEventListener('keydown', handleKeyDown);
    };
  }
}

// Color contrast utilities
export class ColorContrast {
  // Calculate relative luminance
  static getLuminance(hex: string): number {
    const rgb = this.hexToRgb(hex);
    if (!rgb) return 0;

    const [r, g, b] = [rgb.r, rgb.g, rgb.b].map(val => {
      val = val / 255;
      return val <= 0.03928 ? val / 12.92 : Math.pow((val + 0.055) / 1.055, 2.4);
    });

    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  }

  // Convert hex to RGB
  static hexToRgb(hex: string): { r: number; g: number; b: number } | null {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null;
  }

  // Calculate contrast ratio
  static getContrastRatio(color1: string, color2: string): number {
    const lum1 = this.getLuminance(color1);
    const lum2 = this.getLuminance(color2);

    const brightest = Math.max(lum1, lum2);
    const darkest = Math.min(lum1, lum2);

    return (brightest + 0.05) / (darkest + 0.05);
  }

  // Check WCAG compliance
  static checkWCAGCompliance(
    foreground: string,
    background: string
  ): {
    ratio: number;
    aaLarge: boolean;
    aa: boolean;
    aaaLarge: boolean;
    aaa: boolean;
  } {
    const ratio = this.getContrastRatio(foreground, background);

    return {
      ratio: Math.round(ratio * 100) / 100,
      aaLarge: ratio >= 3.0,
      aa: ratio >= 4.5,
      aaaLarge: ratio >= 4.5,
      aaa: ratio >= 7.0,
    };
  }
}

// ARIA label generators
export const generateAriaLabels = {
  // Generate label for buttons with icons
  button: (action: string, target?: string): AriaAttributes => ({
    'aria-label': target ? `${action} ${target}` : action,
    'role': 'button',
  }),

  // Generate label for navigation links
  navigation: (destination: string, currentPage?: boolean): AriaAttributes => ({
    'aria-label': destination,
    'aria-current': currentPage ? 'page' : undefined,
  }),

  // Generate label for form inputs
  input: (label: string, required?: boolean, invalid?: boolean): AriaAttributes => ({
    'aria-label': label,
    'aria-required': required,
    'aria-invalid': invalid,
  }),

  // Generate label for expandable content
  expandable: (label: string, isExpanded: boolean): AriaAttributes => ({
    'aria-label': label,
    'aria-expanded': isExpanded,
    'aria-controls': `${label.toLowerCase().replace(/\s+/g, '-')}-content`,
  }),

  // Generate label for status messages
  status: (message: string, type: 'polite' | 'assertive' = 'polite'): AriaAttributes => ({
    'role': 'status',
    'aria-live': type,
    'aria-atomic': true,
    children: message,
  }),

  // Generate label for loading states
  loading: (message: string = 'Loading'): AriaAttributes => ({
    'aria-label': message,
    'aria-busy': true,
    'role': 'progressbar',
  }),

  // Generate label for tooltips
  tooltip: (content: string): AriaAttributes => ({
    'aria-label': content,
    'aria-describedby': undefined,
  }),

  // Generate label for images
  image: (alt: string, decorative?: boolean): AriaAttributes => ({
    'alt': decorative ? '' : alt,
    'role': decorative ? 'presentation' : 'img',
  }),

  // Generate label for lists
  list: (label: string, size?: number): AriaAttributes => ({
    'aria-label': label,
    'role': 'list',
    'aria-setsize': size,
  }),

  // Generate label for list items
  listItem: (position: number, setSize?: number): AriaAttributes => ({
    'role': 'listitem',
    'aria-posinset': position,
    'aria-setsize': setSize,
  }),
};

// Skip link component generator
export const createSkipLink = (targetId: string, label: string = 'Skip to main content'): string => {
  return `
    <a href="#${targetId}"
       class="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 bg-champagne text-charcoal px-4 py-2 rounded-md z-50 focus:outline-none focus:ring-2 focus:ring-champagne/50"
       aria-label="${label}">
      ${label}
    </a>
  `;
};

// Heading hierarchy checker
export const validateHeadingHierarchy = (): { errors: string[]; warnings: string[] } => {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (typeof document === 'undefined') {
    return { errors, warnings };
  }

  const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
  const h1Headings = document.querySelectorAll('h1');

  // Check for missing H1
  if (h1Headings.length === 0) {
    errors.push('No h1 tag found on the page');
  }

  let lastLevel = 0;

  headings.forEach((heading, index) => {
    const level = parseInt(heading.tagName.charAt(1));

    // Check for skipped levels
    if (index > 0 && level > lastLevel + 1) {
      warnings.push(`Heading level skipped: h${lastLevel} to h${level} at "${heading.textContent?.trim()}"`);
    }

    // Check for empty headings
    if (!heading.textContent?.trim()) {
      errors.push(`Empty heading found: ${heading.tagName}`);
    }

    // Check for multiple h1s
    if (level === 1) {
      const h1Count = document.querySelectorAll('h1').length;
      if (h1Count > 1) {
        errors.push(`Multiple h1 tags found (${h1Count})`);
      }
    }

    lastLevel = level;
  });

  return { errors, warnings };
};

// Initialize accessibility features
export const initializeAccessibility = (): void => {
  if (typeof document === 'undefined') return;

  // Add skip links
  const skipLinkHtml = createSkipLink('main-content');
  const skipLinkContainer = document.createElement('div');
  skipLinkContainer.innerHTML = skipLinkHtml;
  document.body.insertBefore(skipLinkContainer, document.body.firstChild);

  // Announce page changes
  const announcer = ScreenReaderAnnouncer.getInstance();

  // Monitor route changes for SPA
  let currentPath = window.location.pathname;
  const observer = new MutationObserver(() => {
    if (window.location.pathname !== currentPath) {
      currentPath = window.location.pathname;
      const title = document.title;
      announcer.announce(`Navigated to: ${title}`);
    }
  });

  observer.observe(document.querySelector('title')!, { childList: true });

  // Validate heading hierarchy in development
  if (import.meta.env.DEV) {
    const { errors, warnings } = validateHeadingHierarchy();
    if (errors.length > 0 || warnings.length > 0) {
      logger.error('Accessibility Errors:', errors);
      logger.warn('Accessibility Warnings:', warnings);
    }
  }
};

// Export commonly used utilities
export const announcer = ScreenReaderAnnouncer.getInstance();
export const { trapFocus, restoreFocus, getFocusableElements, isFocusable } = FocusManager;
export const { createNavigation } = KeyboardNavigation;
export const { getLuminance, hexToRgb, getContrastRatio, checkWCAGCompliance } = ColorContrast;