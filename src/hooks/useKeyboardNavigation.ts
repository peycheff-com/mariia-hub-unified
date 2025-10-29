import { useEffect, useRef, useCallback } from 'react';

import { FocusManager, KeyboardNavigation } from '@/utils/accessibility';

interface UseKeyboardNavigationOptions {
  orientation?: 'horizontal' | 'vertical' | 'both';
  loop?: boolean;
  enabled?: boolean;
  onSelect?: (element: HTMLElement) => void;
  onActivate?: (element: HTMLElement) => void;
}

export const useKeyboardNavigation = (
  options: UseKeyboardNavigationOptions = {}
) => {
  const { orientation = 'vertical', loop = true, enabled = true, onSelect, onActivate } = options;
  const containerRef = useRef<HTMLElement>(null);
  const cleanupRef = useRef<(() => void) | null>(null);

  const setContainer = useCallback((element: HTMLElement | null) => {
    containerRef.current = element;

    // Clean up previous navigation
    if (cleanupRef.current) {
      cleanupRef.current();
      cleanupRef.current = null;
    }

    // Set up new navigation if enabled and container exists
    if (enabled && element) {
      cleanupRef.current = KeyboardNavigation.createNavigation(element, {
        orientation,
        loop,
        onSelect,
        onActivate,
      });
    }
  }, [enabled, orientation, loop, onSelect, onActivate]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (cleanupRef.current) {
        cleanupRef.current();
      }
    };
  }, []);

  return {
    containerRef: setContainer,
  };
};

// Hook for managing focus traps (modals, dropdowns, etc.)
export const useFocusTrap = (enabled: boolean = true) => {
  const containerRef = useRef<HTMLElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const cleanupRef = useRef<(() => void) | null>(null);

  const activate = useCallback(() => {
    if (!containerRef.current) return;

    // Store current focused element
    previousFocusRef.current = document.activeElement as HTMLElement;

    // Set up focus trap
    cleanupRef.current = FocusManager.trapFocus(containerRef.current);
  }, []);

  const deactivate = useCallback(() => {
    // Clean up focus trap
    if (cleanupRef.current) {
      cleanupRef.current();
      cleanupRef.current = null;
    }

    // Restore previous focus
    if (previousFocusRef.current) {
      FocusManager.restoreFocus(previousFocusRef.current);
    }
  }, []);

  useEffect(() => {
    if (enabled) {
      activate();
    } else {
      deactivate();
    }

    return deactivate;
  }, [enabled, activate, deactivate]);

  return {
    containerRef,
    activate,
    deactivate,
  };
};

// Hook for managing roving tabindex pattern
export const useRovingTabIndex = (
  items: HTMLElement[],
  { enabled = true, orientation = 'vertical' } = {}
) => {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const itemsRef = useRef(items);

  // Update items when they change
  useEffect(() => {
    itemsRef.current = items;
  }, [items]);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!enabled || itemsRef.current.length === 0) return;

    const items = itemsRef.current;
    let newIndex = selectedIndex;

    switch (e.key) {
      case 'ArrowDown':
      case 'ArrowRight':
        if (orientation === 'vertical' || orientation === 'both') {
          e.preventDefault();
          newIndex = (selectedIndex + 1) % items.length;
        }
        break;
      case 'ArrowUp':
      case 'ArrowLeft':
        if (orientation === 'vertical' || orientation === 'both') {
          e.preventDefault();
          newIndex = selectedIndex === 0 ? items.length - 1 : selectedIndex - 1;
        }
        break;
      case 'Home':
        e.preventDefault();
        newIndex = 0;
        break;
      case 'End':
        e.preventDefault();
        newIndex = items.length - 1;
        break;
    }

    if (newIndex !== selectedIndex) {
      setSelectedIndex(newIndex);
      items[newIndex]?.focus();
    }
  }, [enabled, orientation, selectedIndex, items]);

  useEffect(() => {
    if (!enabled || items.length === 0) return;

    // Set up event listeners
    const container = items[0]?.parentElement;
    if (container) {
      container.addEventListener('keydown', handleKeyDown);

      // Set initial tabindexes
      items.forEach((item, index) => {
        item.tabIndex = index === selectedIndex ? 0 : -1;
      });

      return () => {
        container.removeEventListener('keydown', handleKeyDown);
        // Reset tabindexes
        items.forEach((item) => {
          item.tabIndex = 0;
        });
      };
    }
  }, [enabled, items, handleKeyDown]);

  return {
    selectedIndex,
    setSelectedIndex: (index: number) => {
      setSelectedIndex(index);
      items[index]?.focus();
    },
  };
};

// Hook for escape key handling
export const useEscapeKey = (callback: () => void, enabled: boolean = true) => {
  useEffect(() => {
    if (!enabled) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        callback();
      }
    };

    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [callback, enabled]);
};

// Hook for keyboard shortcuts
export const useKeyboardShortcuts = (
  shortcuts: Record<string, () => void>,
  enabled: boolean = true
) => {
  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Build the key combination string
      const parts: string[] = [];

      if (e.ctrlKey || e.metaKey) parts.push('ctrl');
      if (e.altKey) parts.push('alt');
      if (e.shiftKey) parts.push('shift');

      parts.push(e.key.toLowerCase());
      const keyCombo = parts.join('+');

      // Find matching shortcut
      const handler = shortcuts[keyCombo];
      if (handler) {
        e.preventDefault();
        handler();
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [shortcuts, enabled]);
};

// Hook for managing live regions
export const useLiveRegion = (polite: boolean = true) => {
  const elementRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (typeof document === 'undefined') return;

    // Create live region element
    const element = document.createElement('div');
    element.setAttribute('aria-live', polite ? 'polite' : 'assertive');
    element.setAttribute('aria-atomic', 'true');
    element.style.position = 'absolute';
    element.style.left = '-10000px';
    element.style.width = '1px';
    element.style.height = '1px';
    element.style.overflow = 'hidden';

    document.body.appendChild(element);
    elementRef.current = element;

    return () => {
      if (element.parentNode) {
        element.parentNode.removeChild(element);
      }
    };
  }, [polite]);

  const announce = useCallback((message: string) => {
    if (elementRef.current) {
      elementRef.current.textContent = '';
      setTimeout(() => {
        if (elementRef.current) {
          elementRef.current.textContent = message;
        }
      }, 100);
    }
  }, []);

  return { announce };
};

// Hook for detecting user's input method
export const useInputMethod = () => {
  const [inputMethod, setInputMethod] = useState<'keyboard' | 'mouse' | 'touch' | 'pen'>('keyboard');

  useEffect(() => {
    const handleKeyDown = () => setInputMethod('keyboard');
    const handleMouseDown = () => setInputMethod('mouse');
    const handleTouchStart = () => setInputMethod('touch');
    const handlePointerDown = (e: PointerEvent) => {
      if (e.pointerType === 'pen') setInputMethod('pen');
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('touchstart', handleTouchStart);
    document.addEventListener('pointerdown', handlePointerDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleMouseDown);
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('pointerdown', handlePointerDown);
    };
  }, []);

  return inputMethod;
};