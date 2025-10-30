/**
 * Motor Accessibility Components
 * Provides support for users with motor impairments, limited mobility, and dexterity challenges
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useInclusiveDesign } from '@/lib/inclusive-design-system';
import { announcer } from '@/utils/accessibility';

interface AccessibleButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  enlarged?: boolean;
  voiceCommand?: string;
  swipeAction?: 'left' | 'right' | 'up' | 'down';
  onSwipe?: (direction: string) => void;
  children: React.ReactNode;
}

/**
 * AccessibleButton - Enhanced button with motor accessibility features
 */
export const AccessibleButton: React.FC<AccessibleButtonProps> = ({
  variant = 'primary',
  size = 'md',
  enlarged = false,
  voiceCommand,
  swipeAction,
  onSwipe,
  children,
  onClick,
  className = '',
  ...props
}) => {
  const { preferences } = useInclusiveDesign();
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [touchStart, setTouchStart] = useState<{ x: number; y: number } | null>(null);
  const [isListening, setIsListening] = useState(false);

  // Enhanced touch target sizing
  const shouldEnlarge = preferences.largeTouchTargets || enlarged;
  const sizeClasses = shouldEnlarge ? 'px-6 py-4 min-h-[48px] min-w-[48px]' :
    size === 'sm' ? 'px-3 py-2 min-h-[44px]' :
    size === 'md' ? 'px-4 py-3 min-h-[44px]' :
    size === 'lg' ? 'px-6 py-4 min-h-[48px]' :
    'px-8 py-6 min-h-[52px]';

  const variantClasses = {
    primary: 'bg-gradient-brand text-white shadow-lg hover:shadow-xl',
    secondary: 'bg-champagne-100 text-cocoa-800 border border-champagne-300',
    outline: 'border-2 border-champagne-400 text-champagne-600 hover:bg-champagne-50',
    ghost: 'text-champagne-600 hover:bg-champagne-100'
  };

  // Voice control functionality
  useEffect(() => {
    if (preferences.voiceControl && voiceCommand) {
      if ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window) {
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        const recognition = new SpeechRecognition();

        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = 'en-US';

        recognition.onresult = (event: any) => {
          const command = event.results[0][0].transcript.toLowerCase();
          if (command.includes(voiceCommand.toLowerCase())) {
            handleClick();
            announcer.announce(`Voice command activated: ${voiceCommand}`);
          }
        };

        recognition.onerror = () => {
          setIsListening(false);
        };

        recognition.onend = () => {
          setIsListening(false);
        };

        // Start listening when button is focused
        const handleFocus = () => {
          if (preferences.voiceControl) {
            setIsListening(true);
            recognition.start();
          }
        };

        const handleBlur = () => {
          setIsListening(false);
          recognition.stop();
        };

        const button = buttonRef.current;
        if (button) {
          button.addEventListener('focus', handleFocus);
          button.addEventListener('blur', handleBlur);
        }

        return () => {
          if (button) {
            button.removeEventListener('focus', handleFocus);
            button.removeEventListener('blur', handleBlur);
          }
          recognition.stop();
        };
      }
    }
  }, [preferences.voiceControl, voiceCommand]);

  // Touch gesture handling
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (preferences.swipeGestures) {
      const touch = e.touches[0];
      setTouchStart({ x: touch.clientX, y: touch.clientY });
    }
  }, [preferences.swipeGestures]);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (preferences.swipeGestures && touchStart && swipeAction) {
      const touch = e.changedTouches[0];
      const deltaX = touch.clientX - touchStart.x;
      const deltaY = touch.clientY - touchStart.y;
      const minSwipeDistance = 50;

      let detectedSwipe = '';
      if (Math.abs(deltaX) > Math.abs(deltaY)) {
        detectedSwipe = deltaX > minSwipeDistance ? 'right' : 'left';
      } else {
        detectedSwipe = deltaY > minSwipeDistance ? 'down' : 'up';
      }

      if (detectedSwipe === swipeAction) {
        onSwipe?.(detectedSwipe);
        handleClick();
      }
    }
    setTouchStart(null);
  }, [preferences.swipeGestures, touchStart, swipeAction, onSwipe]);

  const handleClick = () => {
    onClick?.(e as any);
    // Add haptic feedback if available
    if (preferences.hapticFeedback && 'vibrate' in navigator) {
      navigator.vibrate(50);
    }
  };

  return (
    <button
      ref={buttonRef}
      className={`
        accessible-button
        ${sizeClasses}
        ${variantClasses[variant]}
        ${shouldEnlarge ? 'large-target' : ''}
        ${isListening ? 'voice-listening' : ''}
        ${preferences.swipeGestures ? 'swipeable' : ''}
        ${className}
      `}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onClick={handleClick}
      aria-label={props['aria-label']}
      {...props}
    >
      <span className="button-content">{children}</span>
      {preferences.voiceControl && voiceCommand && (
        <span className="voice-indicator" aria-hidden="true">
          {isListening ? '🎤' : '🔇'}
        </span>
      )}
      {preferences.swipeGestures && swipeAction && (
        <span className="swipe-hint" aria-hidden="true">
          Swipe {swipeAction}
        </span>
      )}
    </button>
  );
};

interface AccessibleInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helpText?: string;
  enlarged?: boolean;
  voiceInput?: boolean;
  onVoiceInput?: (text: string) => void;
}

/**
 * AccessibleInput - Enhanced input field with motor accessibility features
 */
export const AccessibleInput: React.FC<AccessibleInputProps> = ({
  label,
  error,
  helpText,
  enlarged = false,
  voiceInput = false,
  onVoiceInput,
  className = '',
  ...props
}) => {
  const { preferences } = useInclusiveDesign();
  const [isVoiceActive, setIsVoiceActive] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const shouldEnlarge = preferences.largeTouchTargets || enlarged;
  const inputSize = shouldEnlarge ? 'py-4 px-6 text-lg' : 'py-3 px-4 text-base';

  const handleVoiceInput = useCallback(() => {
    if (!voiceInput || !('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)) {
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();

    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = 'pl-PL'; // Polish language support

    recognition.onstart = () => {
      setIsVoiceActive(true);
      announcer.announce('Voice input started');
    };

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      if (inputRef.current) {
        inputRef.current.value = transcript;
        onVoiceInput?.(transcript);
      }
    };

    recognition.onerror = () => {
      setIsVoiceActive(false);
      announcer.announce('Voice input error');
    };

    recognition.onend = () => {
      setIsVoiceActive(false);
      announcer.announce('Voice input ended');
    };

    recognition.start();
  }, [voiceInput, onVoiceInput]);

  return (
    <div className={`accessible-input-group ${shouldEnlarge ? 'large-targets' : ''}`}>
      {label && (
        <label className="input-label" htmlFor={props.id}>
          {label}
          {props.required && <span className="required-indicator">*</span>}
        </label>
      )}

      <div className="input-wrapper">
        <input
          ref={inputRef}
          className={`
            accessible-input
            ${inputSize}
            ${error ? 'input-error' : ''}
            ${shouldEnlarge ? 'input-large' : ''}
            ${className}
          `}
          {...props}
        />

        {voiceInput && preferences.voiceControl && (
          <button
            type="button"
            className={`voice-input-button ${isVoiceActive ? 'voice-active' : ''}`}
            onClick={handleVoiceInput}
            aria-label="Voice input"
            title="Click to enable voice input"
          >
            {isVoiceActive ? '🔴' : '🎤'}
          </button>
        )}
      </div>

      {helpText && preferences.showHelpText && (
        <div className="input-help-text">{helpText}</div>
      )}

      {error && (
        <div className="input-error-message" role="alert">
          {error}
        </div>
      )}
    </div>
  );
};

interface TimeoutControlProps {
  timeout: number;
  onTimeout: () => void;
  onExtend: () => void;
  warningTime?: number;
}

/**
 * TimeoutControl - Provides timeout extensions for users who need more time
 */
export const TimeoutControl: React.FC<TimeoutControlProps> = ({
  timeout,
  onTimeout,
  onExtend,
  warningTime = 10000
}) => {
  const { preferences } = useInclusiveDesign();
  const [timeRemaining, setTimeRemaining] = useState(timeout);
  const [isWarning, setIsWarning] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    const adjustedTimeout = timeout * preferences.timeoutExtensions;
    const adjustedWarning = warningTime * preferences.timeoutExtensions;

    intervalRef.current = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1000) {
          onTimeout();
          return 0;
        }

        if (prev === adjustedWarning && !isWarning) {
          setIsWarning(true);
          announcer.announce('Session will expire soon. Request more time if needed.');
        }

        return prev - 1000;
      });
    }, 1000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [timeout, warningTime, preferences.timeoutExtensions, onTimeout, isWarning]);

  const formatTime = (milliseconds: number): string => {
    const seconds = Math.ceil(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  if (!preferences.extendedTimeouts && timeRemaining > warningTime) {
    return null;
  }

  return (
    <div className={`timeout-control ${isWarning ? 'timeout-warning' : ''}`} role="timer" aria-live="polite">
      <div className="timeout-display">
        <span className="timeout-label">Time remaining:</span>
        <span className="timeout-value" aria-label={`${formatTime(timeRemaining)} remaining`}>
          {formatTime(timeRemaining)}
        </span>
      </div>

      {isWarning && (
        <div className="timeout-actions">
          <p className="timeout-warning-message">
            Your session is about to expire. Would you like more time?
          </p>
          <div className="timeout-buttons">
            <button
              className="timeout-extend-button"
              onClick={onExtend}
              aria-label="Extend session time"
            >
              Extend Time
            </button>
            <button
              className="timeout-continue-button"
              onClick={() => setIsWarning(false)}
              aria-label="Continue without extending"
            >
              Continue
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

interface OneHandedNavigationProps {
  alignment: 'left' | 'right';
  children: React.ReactNode;
}

/**
 * OneHandedNavigation - Navigation optimized for one-handed use
 */
export const OneHandedNavigation: React.FC<OneHandedNavigationProps> = ({
  alignment,
  children
}) => {
  const { preferences } = useInclusiveDesign();

  if (preferences.oneHandedMode === 'both' ||
      (preferences.oneHandedMode === 'left' && alignment !== 'left') ||
      (preferences.oneHandedMode === 'right' && alignment !== 'right')) {
    return <>{children}</>;
  }

  return (
    <nav
      className={`one-handed-navigation one-handed-${alignment}`}
      role="navigation"
      aria-label={`${alignment}-handed navigation`}
    >
      <div className="one-handed-content">
        {children}
      </div>
    </nav>
  );
};

interface SwipeContainerProps {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
  children: React.ReactNode;
  threshold?: number;
}

/**
 * SwipeContainer - Container that handles swipe gestures for motor accessibility
 */
export const SwipeContainer: React.FC<SwipeContainerProps> = ({
  onSwipeLeft,
  onSwipeRight,
  onSwipeUp,
  onSwipeDown,
  children,
  threshold = 50
}) => {
  const { preferences } = useInclusiveDesign();
  const [touchStart, setTouchStart] = useState<{ x: number; y: number } | null>(null);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (preferences.swipeGestures) {
      const touch = e.touches[0];
      setTouchStart({ x: touch.clientX, y: touch.clientY });
    }
  }, [preferences.swipeGestures]);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (!preferences.swipeGestures || !touchStart) return;

    const touch = e.changedTouches[0];
    const deltaX = touch.clientX - touchStart.x;
    const deltaY = touch.clientY - touchStart.y;

    if (Math.abs(deltaX) > Math.abs(deltaY)) {
      if (Math.abs(deltaX) > threshold) {
        if (deltaX > 0) {
          onSwipeRight?.();
        } else {
          onSwipeLeft?.();
        }
      }
    } else {
      if (Math.abs(deltaY) > threshold) {
        if (deltaY > 0) {
          onSwipeDown?.();
        } else {
          onSwipeUp?.();
        }
      }
    }

    setTouchStart(null);
  }, [preferences.swipeGestures, touchStart, threshold, onSwipeLeft, onSwipeRight, onSwipeUp, onSwipeDown]);

  return (
    <div
      className={`swipe-container ${preferences.swipeGestures ? 'swipe-enabled' : ''}`}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {children}
      {preferences.swipeGestures && (
        <div className="swipe-instructions" aria-hidden="true">
          Swipe to navigate
        </div>
      )}
    </div>
  );
};

interface HapticFeedbackProps {
  pattern?: number | number[];
  trigger?: 'click' | 'focus' | 'hover';
  children: React.ReactNode;
}

/**
 * HapticFeedback - Provides haptic feedback for touch interactions
 */
export const HapticFeedback: React.FC<HapticFeedbackProps> = ({
  pattern = 50,
  trigger = 'click',
  children
}) => {
  const { preferences } = useInclusiveDesign();
  const elementRef = useRef<HTMLElement>(null);

  const triggerHaptic = useCallback(() => {
    if (preferences.hapticFeedback && 'vibrate' in navigator) {
      navigator.vibrate(pattern);
    }
  }, [preferences.hapticFeedback, pattern]);

  const eventHandlers = {
    click: trigger === 'click' ? { onClick: triggerHaptic } : {},
    focus: trigger === 'focus' ? { onFocus: triggerHaptic } : {},
    hover: trigger === 'hover' ? { onMouseEnter: triggerHaptic } : {},
  };

  return (
    <div ref={elementRef} {...eventHandlers} className="haptic-feedback">
      {children}
    </div>
  );
};

interface AdaptiveSpacingProps {
  spacing?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  children: React.ReactNode;
}

/**
 * AdaptiveSpacing - Provides adaptive spacing for motor accessibility
 */
export const AdaptiveSpacing: React.FC<AdaptiveSpacingProps> = ({
  spacing = 'md',
  children
}) => {
  const { preferences } = useInclusiveDesign();

  const getSpacingClass = () => {
    const baseSpacing = {
      none: 'gap-0',
      sm: 'gap-2',
      md: 'gap-4',
      lg: 'gap-6',
      xl: 'gap-8'
    };

    const multiplier = preferences.increasedSpacing ? 1.5 : 1;
    const effectiveSpacing = spacing === 'none' ? 'none' :
      spacing === 'sm' ? (multiplier > 1.25 ? 'md' : 'sm') :
      spacing === 'md' ? (multiplier > 1.25 ? 'lg' : 'md') :
      spacing === 'lg' ? (multiplier > 1.25 ? 'xl' : 'lg') : 'xl';

    return baseSpacing[effectiveSpacing as keyof typeof baseSpacing];
  };

  return (
    <div className={`adaptive-spacing ${getSpacingClass()}`}>
      {children}
    </div>
  );
};

export default {
  AccessibleButton,
  AccessibleInput,
  TimeoutControl,
  OneHandedNavigation,
  SwipeContainer,
  HapticFeedback,
  AdaptiveSpacing
};