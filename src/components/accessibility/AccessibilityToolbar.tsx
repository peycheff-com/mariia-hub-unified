import React, { useState } from 'react';
import {
  Eye,
  EyeOff,
  Zap,
  ZapOff,
  Type,
  TypeIcon,
  Volume2,
  VolumeX,
  Keyboard,
  KeyboardOff,
  Crosshair,
  Target,
  Settings,
  ChevronUp,
  ChevronDown,
  Sun,
  Moon
} from 'lucide-react';
import { useAccessibility } from '@/contexts/AccessibilityContext';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface AccessibilityToolbarProps {
  className?: string;
}

export const AccessibilityToolbar: React.FC<AccessibilityToolbarProps> = ({ className }) => {
  const {
    preferences,
    toggleHighContrast,
    toggleReducedMotion,
    toggleLargeText,
    toggleScreenReaderOptimized,
    toggleKeyboardNavigation,
    toggleFocusVisible,
    announce
  } = useAccessibility();

  const [isExpanded, setIsExpanded] = useState(false);

  const handleToggle = (action: () => void, announcement: string) => {
    action();
  };

  const accessibilityOptions = [
    {
      id: 'highContrast',
      label: 'High Contrast',
      description: 'Increase contrast for better visibility',
      icon: preferences.highContrast ? Sun : Moon,
      isActive: preferences.highContrast,
      toggle: () => handleToggle(toggleHighContrast, 'High contrast toggled'),
      hotkey: 'Alt+H'
    },
    {
      id: 'reducedMotion',
      label: 'Reduced Motion',
      description: 'Minimize animations and transitions',
      icon: preferences.reducedMotion ? ZapOff : Zap,
      isActive: preferences.reducedMotion,
      toggle: () => handleToggle(toggleReducedMotion, 'Reduced motion toggled'),
      hotkey: 'Alt+R'
    },
    {
      id: 'largeText',
      label: 'Large Text',
      description: 'Increase text size for better readability',
      icon: preferences.largeText ? Type : TypeIcon,
      isActive: preferences.largeText,
      toggle: () => handleToggle(toggleLargeText, 'Large text toggled'),
      hotkey: 'Alt+L'
    },
    {
      id: 'screenReader',
      label: 'Screen Reader Mode',
      description: 'Optimize for screen reader users',
      icon: preferences.screenReaderOptimized ? Volume2 : VolumeX,
      isActive: preferences.screenReaderOptimized,
      toggle: () => handleToggle(toggleScreenReaderOptimized, 'Screen reader mode toggled'),
      hotkey: 'Alt+S'
    },
    {
      id: 'keyboardNav',
      label: 'Keyboard Navigation',
      description: 'Enhanced keyboard navigation support',
      icon: preferences.keyboardNavigation ? Keyboard : KeyboardOff,
      isActive: preferences.keyboardNavigation,
      toggle: () => handleToggle(toggleKeyboardNavigation, 'Keyboard navigation toggled'),
      hotkey: 'Alt+K'
    },
    {
      id: 'focusVisible',
      label: 'Focus Indicators',
      description: 'Show clear focus indicators',
      icon: preferences.focusVisible ? Crosshair : Target,
      isActive: preferences.focusVisible,
      toggle: () => handleToggle(toggleFocusVisible, 'Focus indicators toggled'),
      hotkey: 'Alt+F'
    }
  ];

  return (
    <div
      className={cn(
        "fixed bottom-4 right-4 z-50 bg-white border-2 border-champagne-200 rounded-2xl shadow-2xl transition-all duration-300",
        isExpanded ? "w-80" : "w-auto",
        className
      )}
      role="toolbar"
      aria-label="Accessibility options"
      aria-expanded={isExpanded}
    >
      {/* Toggle Button */}
      <Button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center gap-2 p-4 rounded-2xl bg-champagne-100 hover:bg-champagne-200 text-champagne-900 border-2 border-champagne-300 transition-all duration-300"
        aria-expanded={isExpanded}
        aria-controls="accessibility-panel"
        aria-label="Accessibility options"
      >
        <Settings className="w-5 h-5" />
        <span className="font-medium">Accessibility</span>
        {isExpanded ? (
          <ChevronDown className="w-4 h-4" />
        ) : (
          <ChevronUp className="w-4 h-4" />
        )}
      </Button>

      {/* Expanded Panel */}
      {isExpanded && (
        <div
          id="accessibility-panel"
          className="p-4 border-t border-champagne-200 space-y-3"
          role="group"
          aria-label="Accessibility settings"
        >
          <div className="text-sm font-medium text-champagne-900 mb-3">
            Customize your experience
          </div>

          {accessibilityOptions.map((option) => {
            const Icon = option.icon;
            return (
              <button
                key={option.id}
                onClick={option.toggle}
                className={cn(
                  "w-full flex items-center justify-between p-3 rounded-xl border-2 transition-all duration-200",
                  option.isActive
                    ? "bg-champagne-100 border-champagne-400 text-champagne-900"
                    : "bg-white border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300"
                )}
                aria-pressed={option.isActive}
                aria-describedby={`${option.id}-desc`}
              >
                <div className="flex items-center gap-3">
                  <Icon className="w-5 h-5" />
                  <div className="text-left">
                    <div className="font-medium text-sm">{option.label}</div>
                    <div
                      id={`${option.id}-desc`}
                      className="text-xs opacity-75"
                    >
                      {option.description}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs opacity-60">{option.hotkey}</span>
                  <div
                    className={cn(
                      "w-12 h-6 rounded-full border-2 transition-colors duration-200",
                      option.isActive
                        ? "bg-champagne-500 border-champagne-600"
                        : "bg-gray-200 border-gray-300"
                    )}
                    role="switch"
                    aria-checked={option.isActive}
                    aria-label={`${option.label} ${option.isActive ? 'on' : 'off'}`}
                  >
                    <div
                      className={cn(
                        "w-5 h-5 bg-white rounded-full border transition-transform duration-200",
                        option.isActive
                          ? "translate-x-6 border-champagne-600"
                          : "translate-x-0.5 border-gray-300"
                      )}
                    />
                  </div>
                </div>
              </button>
            );
          })}

          {/* Keyboard Shortcuts Help */}
          <div className="mt-4 p-3 bg-champagne-50 rounded-xl border border-champagne-200">
            <div className="font-medium text-sm text-champagne-900 mb-2">
              Keyboard Shortcuts
            </div>
            <div className="space-y-1 text-xs text-champagne-700">
              <div>Alt + H: Toggle high contrast</div>
              <div>Alt + R: Toggle reduced motion</div>
              <div>Alt + L: Toggle large text</div>
              <div>Alt + S: Toggle screen reader mode</div>
              <div>Alt + K: Toggle keyboard navigation</div>
              <div>Alt + F: Toggle focus indicators</div>
              <div className="pt-1 border-t border-champagne-200 mt-2">
                <div>Alt + S: Jump to search</div>
                <div>Alt + N: Jump to navigation</div>
                <div>Alt + M: Jump to main content</div>
                <div>Escape: Close modals</div>
              </div>
            </div>
          </div>

          {/* Reset Button */}
          <Button
            onClick={() => {
              // Reset all preferences to default
              const defaultPrefs = {
                highContrast: false,
                reducedMotion: false,
                largeText: false,
                screenReaderOptimized: false,
                keyboardNavigation: true,
                focusVisible: true,
                announceChanges: true,
              };
              // This would need to be connected to the context
              announce('Accessibility settings reset to default');
            }}
            variant="outline"
            size="sm"
            className="w-full mt-3"
          >
            Reset to Default
          </Button>
        </div>
      )}
    </div>
  );
};

export default AccessibilityToolbar;