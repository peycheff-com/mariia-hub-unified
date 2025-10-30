/**
 * InclusiveDesignProvider - Main provider component for inclusive design features
 * Automatically detects user capabilities and applies appropriate accessibility settings
 */

import React, { useEffect, createContext, useContext, ReactNode, useState } from 'react';
import { useInclusiveDesign } from '@/lib/inclusive-design-system';
import { initializeAccessibility } from '@/utils/accessibility';

interface InclusiveDesignContextType {
  isInitialized: boolean;
  detectedCapabilities: any;
  preferences: any;
  updatePreferences: (updates: any) => void;
  resetPreferences: () => void;
}

const InclusiveDesignContext = createContext<InclusiveDesignContextType | null>(null);

interface InclusiveDesignProviderProps {
  children: ReactNode;
  autoDetect?: boolean;
  enableMonitoring?: boolean;
}

/**
 * InclusiveDesignProvider - Main provider for accessibility features
 */
export const InclusiveDesignProvider: React.FC<InclusiveDesignProviderProps> = ({
  children,
  autoDetect = true,
  enableMonitoring = true
}) => {
  const {
    preferences,
    detectedCapabilities,
    updatePreferences,
    resetToDefaults,
    detectUserCapabilities,
    applyPreferences
  } = useInclusiveDesign();

  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Initialize basic accessibility features
      initializeAccessibility();

      if (autoDetect) {
        // Detect user capabilities and adjust preferences
        detectUserCapabilities();
      }

      // Apply current preferences
      applyPreferences();

      setIsInitialized(true);

      // Set up monitoring if enabled
      if (enableMonitoring) {
        setupAccessibilityMonitoring();
      }
    }
  }, [autoDetect, enableMonitoring, detectUserCapabilities, applyPreferences]);

  const setupAccessibilityMonitoring = () => {
    // Monitor for preference changes that might require UI updates
    const handlePreferenceChange = () => {
      applyPreferences();
    };

    // Listen for system preference changes
    const mediaQueries = [
      window.matchMedia('(prefers-reduced-motion: reduce)'),
      window.matchMedia('(prefers-contrast: high)'),
      window.matchMedia('(prefers-color-scheme: dark)'),
      window.matchMedia('(max-width: 768px)')
    ];

    mediaQueries.forEach(mq => {
      mq.addEventListener?.('change', handlePreferenceChange);
    });

    // Cleanup listeners
    return () => {
      mediaQueries.forEach(mq => {
        mq.removeEventListener?.('change', handlePreferenceChange);
      });
    };
  };

  const contextValue: InclusiveDesignContextType = {
    isInitialized,
    detectedCapabilities,
    preferences,
    updatePreferences,
    resetPreferences: resetToDefaults
  };

  return (
    <InclusiveDesignContext.Provider value={contextValue}>
      {isInitialized && (
        <div className="inclusive-design-system">
          {/* Skip links for keyboard navigation */}
          <SkipLinks />

          {/* Accessibility notification area */}
          <AccessibilityNotifications />

          {/* Main content */}
          {children}
        </div>
      )}
    </InclusiveDesignContext.Provider>
  );
};

/**
 * Hook to use inclusive design context
 */
export const useInclusiveDesignContext = (): InclusiveDesignContextType => {
  const context = useContext(InclusiveDesignContext);
  if (!context) {
    throw new Error('useInclusiveDesignContext must be used within an InclusiveDesignProvider');
  }
  return context;
};

/**
 * SkipLinks - Keyboard navigation skip links
 */
const SkipLinks: React.FC = () => {
  const { preferences } = useInclusiveDesign();

  if (!preferences.screenReaderOptimized && !preferences.keyboardNavigationActive) {
    return null;
  }

  return (
    <div className="skip-links" role="navigation" aria-label="Skip navigation links">
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>
      <a href="#navigation" className="skip-link">
        Skip to navigation
      </a>
      <a href="#search" className="skip-link">
        Skip to search
      </a>
      <a href="#accessibility-controls" className="skip-link">
        Accessibility controls
      </a>
    </div>
  );
};

/**
 * AccessibilityNotifications - Global notification area for accessibility announcements
 */
const AccessibilityNotifications: React.FC = () => {
  const [notifications, setNotifications] = useState<Array<{
    id: string;
    message: string;
    type: 'polite' | 'assertive';
    timestamp: number;
  }>>([]);

  useEffect(() => {
    // Listen for custom accessibility events
    const handleAccessibilityAnnouncement = (event: CustomEvent) => {
      const { message, type = 'polite' } = event.detail;

      const notification = {
        id: `a11y-${Date.now()}`,
        message,
        type,
        timestamp: Date.now()
      };

      setNotifications(prev => [...prev, notification]);

      // Auto-remove after announcement
      setTimeout(() => {
        setNotifications(prev => prev.filter(n => n.id !== notification.id));
      }, 100);
    };

    window.addEventListener('accessibility-announcement', handleAccessibilityAnnouncement as EventListener);

    return () => {
      window.removeEventListener('accessibility-announcement', handleAccessibilityAnnouncement as EventListener);
    };
  }, []);

  return (
    <div className="accessibility-notifications" aria-hidden="true">
      {notifications.map(notification => (
        <div
          key={notification.id}
          className="sr-only"
          aria-live={notification.type}
          aria-atomic="true"
        >
          {notification.message}
        </div>
      ))}
    </div>
  );
};

/**
 * AccessibilityToolbar - Floating toolbar for accessibility controls
 */
export const AccessibilityToolbar: React.FC<{
  className?: string;
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
}> = ({ className = '', position = 'bottom-right' }) => {
  const { preferences, updatePreferences } = useInclusiveDesign();
  const [isOpen, setIsOpen] = useState(false);

  const positionClasses = {
    'top-left': 'toolbar-top-left',
    'top-right': 'toolbar-top-right',
    'bottom-left': 'toolbar-bottom-left',
    'bottom-right': 'toolbar-bottom-right'
  };

  const toggleToolbar = () => {
    setIsOpen(!isOpen);
  };

  const quickActions = [
    {
      key: 'highContrast',
      label: 'High Contrast',
      icon: preferences.highContrast ? '🌞' : '🌙',
      action: () => updatePreferences({ highContrast: !preferences.highContrast })
    },
    {
      key: 'largeText',
      label: 'Large Text',
      icon: preferences.fontSize === 'large' ? '🔤' : '📝',
      action: () => updatePreferences({ fontSize: preferences.fontSize === 'large' ? 'medium' : 'large' })
    },
    {
      key: 'reducedMotion',
      label: 'Reduced Motion',
      icon: preferences.reducedMotion ? '⏸️' : '▶️',
      action: () => updatePreferences({ reducedMotion: !preferences.reducedMotion })
    },
    {
      key: 'screenReader',
      label: 'Screen Reader',
      icon: preferences.screenReaderOptimized ? '🔊' : '🔇',
      action: () => updatePreferences({ screenReaderOptimized: !preferences.screenReaderOptimized })
    }
  ];

  return (
    <div className={`accessibility-toolbar ${positionClasses[position]} ${className}`}>
      <button
        className="toolbar-toggle"
        onClick={toggleToolbar}
        aria-label="Toggle accessibility controls"
        aria-expanded={isOpen}
        aria-controls="accessibility-controls"
      >
        <span className="toolbar-icon" aria-hidden="true">♿</span>
        <span className="toolbar-label">Accessibility</span>
      </button>

      {isOpen && (
        <div
          id="accessibility-controls"
          className="toolbar-controls"
          role="dialog"
          aria-labelledby="toolbar-title"
        >
          <h3 id="toolbar-title" className="toolbar-title">Accessibility Options</h3>

          <div className="quick-actions" role="group" aria-label="Quick accessibility actions">
            {quickActions.map(action => (
              <button
                key={action.key}
                className="quick-action-button"
                onClick={action.action}
                aria-label={action.label}
                aria-pressed={preferences[action.key as keyof typeof preferences]}
              >
                <span className="action-icon" aria-hidden="true">{action.icon}</span>
                <span className="action-label">{action.label}</span>
              </button>
            ))}
          </div>

          <div className="toolbar-actions">
            <button
              className="toolbar-button secondary"
              onClick={() => {
                updatePreferences({ simplifiedLanguage: !preferences.simplifiedLanguage });
              }}
              aria-label="Toggle simplified language"
            >
              Simplify Text
            </button>

            <button
              className="toolbar-button secondary"
              onClick={() => {
                updatePreferences({ largeTouchTargets: !preferences.largeTouchTargets });
              }}
              aria-label="Toggle large touch targets"
            >
              Large Buttons
            </button>

            <button
              className="toolbar-button primary"
              onClick={() => {
                // Open full accessibility panel
                const event = new CustomEvent('open-accessibility-panel');
                window.dispatchEvent(event);
              }}
              aria-label="Open full accessibility settings"
            >
              All Settings
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * AccessibilityInitializer - Component that initializes accessibility features
 */
export const AccessibilityInitializer: React.FC<{
  onReady?: () => void;
}> = ({ onReady }) => {
  const { isInitialized } = useInclusiveDesignContext();

  useEffect(() => {
    if (isInitialized) {
      // Announce that accessibility features are ready
      const announcement = new CustomEvent('accessibility-announcement', {
        detail: {
          message: 'Accessibility features initialized',
          type: 'polite'
        }
      });
      window.dispatchEvent(announcement);

      onReady?.();
    }
  }, [isInitialized, onReady]);

  if (!isInitialized) {
    return (
      <div className="accessibility-loading" role="status" aria-live="polite">
        <span className="loading-text">Initializing accessibility features...</span>
      </div>
    );
  }

  return null;
};

/**
 * withInclusiveDesign - HOC to wrap components with inclusive design provider
 */
export const withInclusiveDesign = <P extends object>(
  Component: React.ComponentType<P>,
  options?: { autoDetect?: boolean; enableMonitoring?: boolean }
) => {
  const WrappedComponent = (props: P) => (
    <InclusiveDesignProvider {...options}>
      <Component {...props} />
    </InclusiveDesignProvider>
  );

  WrappedComponent.displayName = `withInclusiveDesign(${Component.displayName || Component.name})`;
  return WrappedComponent;
};

export default {
  InclusiveDesignProvider,
  useInclusiveDesignContext,
  AccessibilityToolbar,
  AccessibilityInitializer,
  withInclusiveDesign
};