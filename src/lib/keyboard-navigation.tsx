import { useEffect, useRef, useCallback, KeyboardEvent, FocusEvent } from 'react';

// Keyboard navigation types
export type Direction = 'up' | 'down' | 'left' | 'right' | 'first' | 'last' | 'next' | 'previous';

export type FocusableElement = {
  element: HTMLElement;
  index: number;
  groupId?: string;
  disabled?: boolean;
};

// Keyboard navigation configuration
interface KeyboardNavigationConfig {
  // Arrow key navigation
  enableArrows?: boolean;
  enableHomeEnd?: boolean;
  enablePageUpDown?: boolean;

  // Tab navigation
  enableTab?: boolean;
  wrapAround?: boolean;
  enterToActivate?: boolean;
  spaceToActivate?: boolean;
  escapeToExit?: boolean;

  // Custom handlers
  onArrowKey?: (direction: Direction, element: HTMLElement) => boolean;
  onEnterKey?: (element: HTMLElement) => boolean;
  onSpaceKey?: (element: HTMLElement) => boolean;
  onEscapeKey?: () => boolean;

  // Visual indicators
  showFocusIndicator?: boolean;
  focusIndicatorStyles?: Partial<CSSStyleDeclaration>;
}

const defaultConfig: Required<KeyboardNavigationConfig> = {
  enableArrows: true,
  enableHomeEnd: true,
  enablePageUpDown: true,
  enableTab: true,
  wrapAround: true,
  enterToActivate: true,
  spaceToActivate: false,
  escapeToExit: true,
  onArrowKey: () => false,
  onEnterKey: () => false,
  onSpaceKey: () => false,
  onEscapeKey: () => false,
  showFocusIndicator: true,
  focusIndicatorStyles: {
    outline: '2px solid #8B4513',
    outlineOffset: '2px',
    borderRadius: '4px',
  },
};

// Hook for keyboard navigation
export function useKeyboardNavigation(
  focusableElements: FocusableElement[],
  config: Partial<KeyboardNavigationConfig> = {}
) {
  const mergedConfig = { ...defaultConfig, ...config };
  const containerRef = useRef<HTMLElement>(null);
  const currentIndexRef = useRef<number>(-1);
  const activeGroupIdRef = useRef<string>();

  const focusElement = useCallback((element: HTMLElement) => {
    element?.focus({ preventScroll: true });

    // Add visual focus indicator if enabled
    if (mergedConfig.showFocusIndicator) {
      Object.assign(element.style, mergedConfig.focusIndicatorStyles);
    }
  }, [mergedConfig.showFocusIndicator, mergedConfig.focusIndicatorStyles]);

  const removeFocusIndicator = useCallback((element: HTMLElement) => {
    // Remove visual focus indicator
    if (mergedConfig.showFocusIndicator) {
      Object.keys(mergedConfig.focusIndicatorStyles).forEach(key => {
        element.style[key as any] = '';
      });
    }
  }, [mergedConfig.showFocusIndicator, mergedConfig.focusIndicatorStyles]);

  const getFocusableElements = useCallback((groupId?: string): FocusableElement[] => {
    const elements = focusableElements.filter(
      el => !el.disabled && (groupId ? el.groupId === groupId : true)
    );

    return elements.sort((a, b) => {
      const aRect = a.element.getBoundingClientRect();
      const bRect = b.element.getBoundingClientRect();

      // Sort by reading order
      return aRect.top - bRect.top || aRect.left - bRect.left;
    });
  }, [focusableElements]);

  const navigateToIndex = useCallback((index: number, groupId?: string) => {
    const elements = getFocusableElements(groupId);
    const safeIndex = mergedConfig.wrapAround
      ? (index + elements.length) % elements.length
      : Math.max(0, Math.min(index, elements.length - 1));

    if (elements[safeIndex]) {
      currentIndexRef.current = safeIndex;
      activeGroupIdRef.current = groupId || elements[safeIndex].groupId;
      focusElement(elements[safeIndex].element);
    }
  }, [getFocusableElements, mergedConfig.wrapAround, focusElement]);

  const getDirectionFromKey = useCallback((key: string): Direction | null => {
    switch (key) {
      case 'ArrowUp': return 'up';
      case 'ArrowDown': return 'down';
      case 'ArrowLeft': return 'left';
      case 'ArrowRight': return 'right';
      case 'Home': return 'first';
      case 'End': return 'last';
      case 'PageUp': return 'previous';
      case 'PageDown': return 'next';
      default: return null;
    }
  }, []);

  const getElementFromDirection = useCallback((
    direction: Direction,
    currentElement: HTMLElement
  ): HTMLElement | null => {
    const rect = currentElement.getBoundingClientRect();
    const containerRect = containerRef.current?.getBoundingClientRect();

    if (!containerRect) return null;

    const elements = getFocusableElements();
    const currentIndex = elements.findIndex(el => el.element === currentElement);

    switch (direction) {
      case 'up': {
        // Find element above
        return elements.reduce((closest, el, index) => {
          const elRect = el.element.getBoundingClientRect();
          const elCenterY = elRect.top + elRect.height / 2;
          const currentCenterY = rect.top + rect.height / 2;

          if (elCenterY < currentCenterY &&
              Math.abs(elRect.left - rect.left) < 100) {
            if (!closest || elRect.top > closest.element.getBoundingClientRect().top) {
              return el;
            }
          }
          return closest;
        }, null)?.element || null;
      }

      case 'down': {
        // Find element below
        return elements.reduce((closest, el, index) => {
          const elRect = el.element.getBoundingClientRect();
          const elCenterY = elRect.top + elRect.height / 2;
          const currentCenterY = rect.top + rect.height / 2;

          if (elCenterY > currentCenterY &&
              Math.abs(elRect.left - rect.left) < 100) {
            if (!closest || elRect.top < closest.element.getBoundingClientRect().top) {
              return el;
            }
          }
          return closest;
        }, null)?.element || null;
      }

      case 'left': {
        // Find element to the left
        const targetIndex = Math.max(0, currentIndex - 1);
        return elements[targetIndex]?.element || null;
      }

      case 'right': {
        // Find element to the right
        const targetIndex = Math.min(elements.length - 1, currentIndex + 1);
        return elements[targetIndex]?.element || null;
      }

      case 'first': {
        return elements[0]?.element || null;
      }

      case 'last': {
        return elements[elements.length - 1]?.element || null;
      }

      case 'next': {
        // Find next group
        const currentGroupId = elements[currentIndex]?.groupId;
        const nextGroupElements = elements.filter(el => el.groupId !== currentGroupId);
        return nextGroupElements[0]?.element || null;
      }

      case 'previous': {
        // Find previous group
        const currentGroupId = elements[currentIndex]?.groupId;
        const prevGroupElements = elements.filter(el => el.groupId !== currentGroupId);
        return prevGroupElements[prevGroupElements.length - 1]?.element || null;
      }

      default:
        return null;
    }
  }, [getFocusableElements]);

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    // Ignore if event target is input or textarea
    const target = event.target as HTMLElement;
    if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT') {
      return;
    }

    let handled = false;
    const direction = getDirectionFromKey(event.key);

    if (direction && mergedConfig.enableArrows) {
      const activeElement = document.activeElement as HTMLElement;

      if (mergedConfig.onArrowKey(event, activeElement)) {
        handled = true;
      } else {
        const targetElement = getElementFromDirection(direction, activeElement);
        if (targetElement) {
          focusElement(targetElement);
          handled = true;
        }
      }
    }

    // Handle special keys
    switch (event.key) {
      case 'Enter':
        if (mergedConfig.enterToActivate) {
          const activeElement = document.activeElement as HTMLElement;
          if (mergedConfig.onEnterKey(activeElement)) {
            handled = true;
          } else {
            activeElement?.click();
            handled = true;
          }
        }
        break;

      case ' ':
        if (mergedConfig.spaceToActivate) {
          const activeElement = document.activeElement as HTMLElement;
          if (mergedConfig.onSpaceKey(activeElement)) {
            handled = true;
          } else {
            // Prevent page scroll
            event.preventDefault();
            activeElement?.click();
            handled = true;
          }
        }
        break;

      case 'Escape':
        if (mergedConfig.escapeToExit) {
          if (mergedConfig.onEscapeKey()) {
            handled = true;
          } else {
            // Move focus to first element or container
            navigateToIndex(0);
            handled = true;
          }
        }
        break;

      case 'Tab':
        if (mergedConfig.enableTab) {
          // Allow default tab behavior
          handled = false;
        }
        break;
    }

    if (handled) {
      event.preventDefault();
      event.stopPropagation();
    }
  }, [
    mergedConfig,
    getDirectionFromKey,
    getElementFromDirection,
    focusElement,
    navigateToIndex
  ]);

  const handleFocus = useCallback((event: FocusEvent) => {
    // Update current index when focus changes
    const focusedElement = event.target as HTMLElement;
    const index = getFocusableElements().findIndex(el => el.element === focusedElement);

    if (index !== -1) {
      currentIndexRef.current = index;
      activeGroupIdRef.current = getFocusableElements()[index].groupId;
    }

    // Remove previous focus indicators
    if (event.relatedTarget) {
      const relatedTarget = event.relatedTarget as HTMLElement;
      removeFocusIndicator(relatedTarget);
    }
  }, [getFocusableElements, removeFocusIndicator]);

  // Set up keyboard navigation
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.addEventListener('keydown', handleKeyDown);
    container.addEventListener('focus', handleFocus, true);

    return () => {
      container.removeEventListener('keydown', handleKeyDown);
      container.removeEventListener('focus', handleFocus, true);
    };
  }, [handleKeyDown, handleFocus]);

  return {
    containerRef,
    currentIndex: currentIndexRef.current,
    focusElement: navigateToIndex,
    focusFirst: () => navigateToIndex(0),
    focusLast: () => navigateToIndex(getFocusableElements().length - 1),
    focusNext: () => navigateToIndex(
      (currentIndexRef.current + 1) % getFocusableElements().length
    ),
    focusPrevious: () => navigateToIndex(
      (currentIndexRef.current - 1 + getFocusableElements().length) % getFocusableElements().length
    ),
  };
}

// Hook for managing focus traps
export function useFocusTrap(isActive: boolean = true) {
  const containerRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || !isActive) return;

    const focusableElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );

    const firstElement = focusableElements[0] as HTMLElement;
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

    const handleTabKey = (event: KeyboardEvent) => {
      if (event.key !== 'Tab') return;

      if (event.shiftKey) {
        // Shift+Tab
        if (document.activeElement === firstElement) {
          event.preventDefault();
          lastElement.focus();
        }
      } else {
        // Tab
        if (document.activeElement === lastElement) {
          event.preventDefault();
          firstElement.focus();
        }
      }
    };

    container.addEventListener('keydown', handleTabKey);

    // Focus first element when trap activates
    firstElement?.focus();

    return () => {
      container.removeEventListener('keydown', handleTabKey);
    };
  }, [isActive]);
}

// Utility functions for keyboard navigation
export const keyboardUtils = {
  // Check if element is keyboard accessible
  isKeyboardAccessible: (element: HTMLElement): boolean => {
    const computedStyle = window.getComputedStyle(element);
    return (
      element.offsetParent !== null && // Not display: none
      computedStyle.visibility !== 'hidden' &&
      computedStyle.visibility !== 'collapse' &&
      computedStyle.display !== 'none' &&
      !element.hasAttribute('disabled') &&
      !element.hasAttribute('aria-hidden')
    );
  },

  // Get all focusable elements in container
  getFocusableElements: (container: HTMLElement): HTMLElement[] => {
    const selectors = [
      'button:not([disabled])',
      '[href]:not([disabled])',
      'input:not([disabled])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      '[tabindex]:not([tabindex="-1"]):not([disabled])',
      'details summary',
      'audio video controls',
      '[role="button"]:not([disabled])',
      '[role="link"]:not([disabled])',
    ].join(', ');

    const elements = Array.from(
      container.querySelectorAll(selectors)
    ) as HTMLElement[];

    // Filter out hidden or disabled elements
    return elements.filter(el => keyboardUtils.isKeyboardAccessible(el));
  },

  // Create focus indicator
  createFocusIndicator: (element: HTMLElement): HTMLElement => {
    const indicator = document.createElement('div');
    indicator.style.cssText = `
      position: absolute;
      top: -4px;
      left: -4px;
      right: -4px;
      bottom: -4px;
      border: 2px solid #8B4513;
      border-radius: 4px;
      pointer-events: none;
      z-index: 10000;
    `;
    indicator.setAttribute('data-focus-indicator', 'true');

    // Add to element's parent
    const parent = element.parentElement;
    if (parent && parent.style.position !== 'relative') {
      parent.style.position = 'relative';
    }
    parent?.appendChild(indicator);

    return indicator;
  },

  // Remove focus indicator
  removeFocusIndicator: (element: HTMLElement) => {
    const indicator = element.parentElement?.querySelector('[data-focus-indicator="true"]');
    indicator?.remove();
  },
};

// HOC for keyboard navigation
export function withKeyboardNavigation<P extends object>(
  Component: React.ComponentType<P>,
  focusableElements: FocusableElement[],
  config?: Partial<KeyboardNavigationConfig>
) {
  return function WrappedComponent(props: P) {
    const { containerRef } = useKeyboardNavigation(focusableElements, config);

    return (
      <div ref={containerRef} data-keyboard-navigation="true">
        <Component {...props} />
      </div>
    );
  };
}