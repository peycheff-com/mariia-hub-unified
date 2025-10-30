import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { accessibility, preferences, liveRegions, focusManagement } from '@/lib/accessibility';

type AccessibilityPreferences = {
  highContrast: boolean;
  reducedMotion: boolean;
  largeText: boolean;
  screenReaderOptimized: boolean;
  keyboardNavigation: boolean;
  focusVisible: boolean;
  announceChanges: boolean;
};

type AccessibilityContextType = {
  preferences: AccessibilityPreferences;
  toggleHighContrast: () => void;
  toggleReducedMotion: () => void;
  toggleLargeText: () => void;
  toggleScreenReaderOptimized: () => void;
  toggleKeyboardNavigation: () => void;
  toggleFocusVisible: () => void;
  toggleAnnounceChanges: () => void;
  announce: (message: string, polite?: boolean) => void;
  trapFocus: (element: HTMLElement) => () => void;
  restoreFocus: (element: HTMLElement) => void;
  setFocusElement: (element: HTMLElement | null) => void;
  skipToMain: () => void;
  skipToNavigation: () => void;
  skipToSearch: () => void;
};

const AccessibilityContext = createContext<AccessibilityContextType | undefined>(undefined);

interface AccessibilityProviderProps {
  children: ReactNode;
}

export const AccessibilityProvider: React.FC<AccessibilityProviderProps> = ({ children }) => {
  const [prefs, setPrefs] = useState<AccessibilityPreferences>({
    highContrast: false,
    reducedMotion: preferences.prefersReducedMotion(),
    largeText: false,
    screenReaderOptimized: false,
    keyboardNavigation: true,
    focusVisible: true,
    announceChanges: true,
  });

  const [previousFocusElement, setPreviousFocusElement] = useState<HTMLElement | null>(null);

  // Initialize accessibility features
  useEffect(() => {
    accessibility.init();

    // Set up preference listeners
    const cleanup = preferences.setupPreferencesListeners({
      onReducedMotionChange: (prefersReduced) => {
        setPrefs(prev => ({ ...prev, reducedMotion: prefersReduced }));
      },
      onHighContrastChange: (prefersHighContrast) => {
        setPrefs(prev => ({ ...prev, highContrast: prefersHighContrast }));
      },
    });

    return cleanup;
  }, []);

  // Apply preference changes to document
  useEffect(() => {
    const root = document.documentElement;

    if (prefs.highContrast) {
      root.classList.add('high-contrast');
    } else {
      root.classList.remove('high-contrast');
    }

    if (prefs.reducedMotion) {
      root.classList.add('reduce-motion');
    } else {
      root.classList.remove('reduce-motion');
    }

    if (prefs.largeText) {
      root.classList.add('large-text');
      root.style.fontSize = '125%';
    } else {
      root.classList.remove('large-text');
      root.style.fontSize = '';
    }

    if (prefs.screenReaderOptimized) {
      root.setAttribute('aria-live', 'polite');
    } else {
      root.removeAttribute('aria-live');
    }

    if (prefs.keyboardNavigation) {
      root.setAttribute('tabindex', '0');
    } else {
      root.removeAttribute('tabindex');
    }

    if (prefs.focusVisible) {
      root.classList.add('focus-visible-enabled');
    } else {
      root.classList.remove('focus-visible-enabled');
    }
  }, [prefs]);

  // Save preferences to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('accessibility-preferences', JSON.stringify(prefs));
    } catch (error) {
      console.warn('Failed to save accessibility preferences:', error);
    }
  }, [prefs]);

  // Load preferences from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('accessibility-preferences');
      if (saved) {
        const savedPrefs = JSON.parse(saved);
        setPrefs(prev => ({ ...prev, ...savedPrefs }));
      }
    } catch (error) {
      console.warn('Failed to load accessibility preferences:', error);
    }
  }, []);

  const toggleHighContrast = () => {
    setPrefs(prev => ({ ...prev, highContrast: !prev.highContrast }));
    announce(`High contrast mode ${!prefs.highContrast ? 'enabled' : 'disabled'}`);
  };

  const toggleReducedMotion = () => {
    setPrefs(prev => ({ ...prev, reducedMotion: !prev.reducedMotion }));
    announce(`Reduced motion ${!prefs.reducedMotion ? 'enabled' : 'disabled'}`);
  };

  const toggleLargeText = () => {
    setPrefs(prev => ({ ...prev, largeText: !prefs.largeText }));
    announce(`Large text ${!prefs.largeText ? 'enabled' : 'disabled'}`);
  };

  const toggleScreenReaderOptimized = () => {
    setPrefs(prev => ({ ...prev, screenReaderOptimized: !prev.screenReaderOptimized }));
    announce(`Screen reader optimization ${!prefs.screenReaderOptimized ? 'enabled' : 'disabled'}`);
  };

  const toggleKeyboardNavigation = () => {
    setPrefs(prev => ({ ...prev, keyboardNavigation: !prev.keyboardNavigation }));
    announce(`Keyboard navigation ${!prefs.keyboardNavigation ? 'enabled' : 'disabled'}`);
  };

  const toggleFocusVisible = () => {
    setPrefs(prev => ({ ...prev, focusVisible: !prev.focusVisible }));
    announce(`Focus indicators ${!prefs.focusVisible ? 'enabled' : 'disabled'}`);
  };

  const toggleAnnounceChanges = () => {
    setPrefs(prev => ({ ...prev, announceChanges: !prev.announceChanges }));
    announce(`Change announcements ${!prefs.announceChanges ? 'enabled' : 'disabled'}`);
  };

  const announce = (message: string, polite: boolean = true) => {
    if (prefs.announceChanges) {
      liveRegions.announce(message, polite);
    }
  };

  const trapFocus = (element: HTMLElement) => {
    // Store current focus element
    const currentFocus = document.activeElement as HTMLElement;
    if (currentFocus && currentFocus !== element) {
      setPreviousFocusElement(currentFocus);
    }

    // Trap focus in the element
    focusManagement.trapFocus(element);

    // Return cleanup function
    return () => {
      focusManagement.removeFocusTrap(element);
      if (previousFocusElement) {
        focusManagement.restoreFocus(previousFocusElement);
      }
    };
  };

  const restoreFocus = (element: HTMLElement) => {
    focusManagement.restoreFocus(element);
    setPreviousFocusElement(element);
  };

  const setFocusElement = (element: HTMLElement | null) => {
    if (element && element.focus) {
      setTimeout(() => element.focus(), 100);
    }
  };

  const skipToMain = () => {
    const main = document.getElementById('main-content');
    if (main) {
      main.focus();
      announce('Skipped to main content');
    }
  };

  const skipToNavigation = () => {
    const nav = document.getElementById('navigation');
    if (nav) {
      nav.focus();
      announce('Skipped to navigation');
    }
  };

  const skipToSearch = () => {
    const search = document.getElementById('search') || document.querySelector('input[type="search"]') as HTMLElement;
    if (search) {
      search.focus();
      announce('Skipped to search');
    }
  };

  const value: AccessibilityContextType = {
    preferences: prefs,
    toggleHighContrast,
    toggleReducedMotion,
    toggleLargeText,
    toggleScreenReaderOptimized,
    toggleKeyboardNavigation,
    toggleFocusVisible,
    toggleAnnounceChanges,
    announce,
    trapFocus,
    restoreFocus,
    setFocusElement,
    skipToMain,
    skipToNavigation,
    skipToSearch,
  };

  return (
    <AccessibilityContext.Provider value={value}>
      {children}
    </AccessibilityContext.Provider>
  );
};

export const useAccessibility = (): AccessibilityContextType => {
  const context = useContext(AccessibilityContext);
  if (context === undefined) {
    throw new Error('useAccessibility must be used within an AccessibilityProvider');
  }
  return context;
};

export default AccessibilityProvider;