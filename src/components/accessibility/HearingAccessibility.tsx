/**
 * Hearing Accessibility Components
 * Provides support for deaf and hard-of-hearing users with visual notifications, captions, and sign language
 */

import React, { useState, useEffect, useRef } from 'react';
import { useInclusiveDesign } from '@/lib/inclusive-design-system';
import { announcer } from '@/utils/accessibility';

interface VisualNotificationProps {
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  duration?: number;
  persistent?: boolean;
  onDismiss?: () => void;
}

/**
 * VisualNotification - Visual notification system for audio alerts
 */
export const VisualNotification: React.FC<VisualNotificationProps> = ({
  type,
  title,
  message,
  duration = 5000,
  persistent = false,
  onDismiss
}) => {
  const { preferences } = useInclusiveDesign();
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    if (!persistent && duration > 0) {
      const timer = setTimeout(() => {
        setIsVisible(false);
        onDismiss?.();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [duration, persistent, onDismiss]);

  const handleDismiss = () => {
    setIsVisible(false);
    onDismiss?.();
    announcer.announce('Notification dismissed');
  };

  if (!preferences.visualNotifications || !isVisible) {
    return null;
  }

  const typeStyles = {
    info: 'notification-info',
    success: 'notification-success',
    warning: 'notification-warning',
    error: 'notification-error'
  };

  const icons = {
    info: 'ℹ️',
    success: '✅',
    warning: '⚠️',
    error: '❌'
  };

  return (
    <div
      className={`visual-notification ${typeStyles[type]}`}
      role="alert"
      aria-live={type === 'error' ? 'assertive' : 'polite'}
      aria-atomic="true"
    >
      <div className="notification-content">
        <div className="notification-header">
          <span className="notification-icon" aria-hidden="true">
            {icons[type]}
          </span>
          <h3 className="notification-title">{title}</h3>
          <button
            className="notification-close"
            onClick={handleDismiss}
            aria-label="Dismiss notification"
          >
            ×
          </button>
        </div>
        <div className="notification-message">
          {message}
        </div>
      </div>
      {duration > 0 && !persistent && (
        <div className="notification-progress" aria-hidden="true">
          <div
            className="notification-progress-bar"
            style={{ animationDuration: `${duration}ms` }}
          />
        </div>
      )}
    </div>
  );
};

interface CaptionsProps {
  text: string;
  speaker?: string;
  active?: boolean;
  position?: 'bottom' | 'top' | 'center';
  size?: 'small' | 'medium' | 'large';
}

/**
 * Captions - Display captions for audio/video content
 */
export const Captions: React.FC<CaptionsProps> = ({
  text,
  speaker,
  active = true,
  position = 'bottom',
  size = 'medium'
}) => {
  const { preferences } = useInclusiveDesign();

  if (!preferences.captionsEnabled || !active || !text) {
    return null;
  }

  const positionClasses = {
    bottom: 'captions-bottom',
    top: 'captions-top',
    center: 'captions-center'
  };

  const sizeClasses = {
    small: 'captions-small',
    medium: 'captions-medium',
    large: 'captions-large'
  };

  return (
    <div
      className={`captions ${positionClasses[position]} ${sizeClasses[size]}`}
      role="region"
      aria-label="Captions"
      aria-live="assertive"
      aria-atomic="true"
    >
      <div className="captions-content">
        {speaker && (
          <span className="captions-speaker">
            {speaker}:
          </span>
        )}
        <span className="captions-text">
          {text}
        </span>
      </div>
    </div>
  );
};

interface SignLanguageVideoProps {
  src?: string;
  fallbackText?: string;
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  size?: 'small' | 'medium' | 'large';
  autoPlay?: boolean;
  muted?: boolean;
}

/**
 * SignLanguageVideo - Sign language video support for deaf users
 */
export const SignLanguageVideo: React.FC<SignLanguageVideoProps> = ({
  src,
  fallbackText,
  position = 'bottom-right',
  size = 'medium',
  autoPlay = true,
  muted = true
}) => {
  const { preferences } = useInclusiveDesign();
  const [isVisible, setIsVisible] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current && autoPlay) {
      videoRef.current.play().catch(() => {
        // Auto-play might be blocked
      });
    }
  }, [autoPlay]);

  const handlePlay = () => {
    setIsPlaying(true);
    announcer.announce('Sign language video playing');
  };

  const handlePause = () => {
    setIsPlaying(false);
  };

  const toggleVisibility = () => {
    setIsVisible(!isVisible);
    announcer.announce(
      isVisible ? 'Sign language video hidden' : 'Sign language video shown'
    );
  };

  if (!preferences.signLanguageSupport) {
    return null;
  }

  const positionClasses = {
    'bottom-right': 'sign-bottom-right',
    'bottom-left': 'sign-bottom-left',
    'top-right': 'sign-top-right',
    'top-left': 'sign-top-left'
  };

  const sizeClasses = {
    small: 'sign-small',
    medium: 'sign-medium',
    large: 'sign-large'
  };

  if (!src && fallbackText) {
    return (
      <div className={`sign-language-placeholder ${positionClasses[position]} ${sizeClasses[size]}`}>
        <div className="placeholder-content">
          <span className="placeholder-icon">🤟</span>
          <span className="placeholder-text">{fallbackText}</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`sign-language-video ${positionClasses[position]} ${sizeClasses[size]} ${isVisible ? 'visible' : 'hidden'}`}>
      <div className="video-container">
        <video
          ref={videoRef}
          src={src}
          autoPlay={autoPlay}
          muted={muted}
          loop
          playsInline
          onPlay={handlePlay}
          onPause={handlePause}
          aria-label="Sign language interpretation"
        />

        <div className="video-controls">
          <button
            className="video-toggle"
            onClick={toggleVisibility}
            aria-label={isVisible ? 'Hide sign language' : 'Show sign language'}
            aria-pressed={isVisible}
          >
            <span aria-hidden="true">{isVisible ? '👁️' : '👁️‍🗨️'}</span>
          </button>

          {videoRef.current && (
            <button
              className="video-play-pause"
              onClick={() => {
                if (isPlaying) {
                  videoRef.current?.pause();
                } else {
                  videoRef.current?.play();
                }
              }}
              aria-label={isPlaying ? 'Pause sign language' : 'Play sign language'}
              aria-pressed={isPlaying}
            >
              <span aria-hidden="true">{isPlaying ? '⏸️' : '▶️'}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

interface VisualAlertProps {
  type: 'gentle' | 'moderate' | 'intense';
  trigger: boolean;
  duration?: number;
  onAlert?: () => void;
  children?: React.ReactNode;
}

/**
 * VisualAlert - Visual alerts for audio notifications
 */
export const VisualAlert: React.FC<VisualAlertProps> = ({
  type,
  trigger,
  duration = 1000,
  onAlert,
  children
}) => {
  const { preferences } = useInclusiveDesign();
  const [isAlerting, setIsAlerting] = useState(false);

  useEffect(() => {
    if (trigger && preferences.visualAlerts) {
      setIsAlerting(true);
      onAlert?.();

      // Add haptic feedback if available
      if (preferences.hapticFeedback && 'vibrate' in navigator) {
        const vibrationPattern = type === 'intense' ? [200, 100, 200] :
                               type === 'moderate' ? [150] : [100];
        navigator.vibrate(vibrationPattern);
      }

      const timer = setTimeout(() => {
        setIsAlerting(false);
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [trigger, type, duration, onAlert, preferences.visualAlerts, preferences.hapticFeedback]);

  if (!preferences.visualAlerts || !isAlerting) {
    return <>{children}</>;
  }

  const typeClasses = {
    gentle: 'visual-alert-gentle',
    moderate: 'visual-alert-moderate',
    intense: 'visual-alert-intense'
  };

  return (
    <div className={`visual-alert ${typeClasses[type]}`} role="alert" aria-live="assertive">
      {children}
      <div className="alert-indicator" aria-hidden="true" />
    </div>
  );
};

interface HapticFeedbackProps {
  pattern: number | number[];
  trigger: boolean;
  children: React.ReactNode;
}

/**
 * HapticFeedback - Haptic feedback for audio cues
 */
export const HapticFeedback: React.FC<HapticFeedbackProps> = ({
  pattern,
  trigger,
  children
}) => {
  const { preferences } = useInclusiveDesign();

  useEffect(() => {
    if (trigger && preferences.hapticFeedback && 'vibrate' in navigator) {
      navigator.vibrate(pattern);
    }
  }, [trigger, pattern, preferences.hapticFeedback]);

  return <>{children}</>;
};

interface AudioDescriptionProps {
  descriptions: Array<{
    time: number;
    text: string;
  }>;
  currentTime: number;
  className?: string;
}

/**
 * AudioDescription - Audio descriptions for visual content
 */
export const AudioDescription: React.FC<AudioDescriptionProps> = ({
  descriptions,
  currentTime,
  className = ''
}) => {
  const { preferences } = useInclusiveDesign();
  const [currentDescription, setCurrentDescription] = useState<string>('');
  const [isSpeaking, setIsSpeaking] = useState(false);

  useEffect(() => {
    const relevantDescription = descriptions.find(desc =>
      currentTime >= desc.time && currentTime < desc.time + 3 // Show for 3 seconds
    );

    if (relevantDescription && relevantDescription.text !== currentDescription) {
      setCurrentDescription(relevantDescription.text);

      if (preferences.textToSpeech && 'speechSynthesis' in window) {
        // Cancel previous speech
        window.speechSynthesis.cancel();

        const utterance = new SpeechSynthesisUtterance(relevantDescription.text);
        utterance.lang = 'pl-PL';
        utterance.rate = 0.9;

        utterance.onstart = () => setIsSpeaking(true);
        utterance.onend = () => setIsSpeaking(false);

        window.speechSynthesis.speak(utterance);
      }
    }
  }, [currentTime, descriptions, currentDescription, preferences.textToSpeech]);

  if (!currentDescription) {
    return null;
  }

  return (
    <div className={`audio-description ${className}`} role="region" aria-live="polite" aria-atomic="true">
      <div className="description-content">
        <span className="description-icon" aria-hidden="true">🔊</span>
        <span className="description-text">{currentDescription}</span>
        {isSpeaking && (
          <span className="speaking-indicator" aria-hidden="true">▶️</span>
        )}
      </div>
    </div>
  );
};

interface HearingAccessibilityPanelProps {
  className?: string;
}

/**
 * HearingAccessibilityPanel - Complete panel for hearing accessibility controls
 */
export const HearingAccessibilityPanel: React.FC<HearingAccessibilityPanelProps> = ({
  className = ''
}) => {
  const { preferences, updatePreferences } = useInclusiveDesign();

  const handleToggle = (setting: keyof typeof preferences, value: boolean) => {
    updatePreferences({ [setting]: value });
    announcer.announce(
      `${setting} ${value ? 'enabled' : 'disabled'}`
    );
  };

  return (
    <div className={`hearing-accessibility-panel ${className}`} role="region" aria-label="Hearing accessibility controls">
      <h2 className="panel-title">Hearing Accessibility</h2>

      <div className="accessibility-controls">
        <div className="control-group">
          <h3>Visual Notifications</h3>
          <label className="toggle-control">
            <input
              type="checkbox"
              checked={preferences.visualNotifications}
              onChange={(e) => handleToggle('visualNotifications', e.target.checked)}
            />
            <span className="toggle-slider"></span>
            <span className="toggle-label">Show visual notifications for sounds</span>
          </label>

          <label className="toggle-control">
            <input
              type="checkbox"
              checked={preferences.visualAlerts}
              onChange={(e) => handleToggle('visualAlerts', e.target.checked)}
            />
            <span className="toggle-slider"></span>
            <span className="toggle-label">Visual alerts for important events</span>
          </label>

          <label className="toggle-control">
            <input
              type="checkbox"
              checked={preferences.hapticFeedback}
              onChange={(e) => handleToggle('hapticFeedback', e.target.checked)}
            />
            <span className="toggle-slider"></span>
            <span className="toggle-label">Haptic feedback (vibration)</span>
          </label>
        </div>

        <div className="control-group">
          <h3>Content Accessibility</h3>
          <label className="toggle-control">
            <input
              type="checkbox"
              checked={preferences.captionsEnabled}
              onChange={(e) => handleToggle('captionsEnabled', e.target.checked)}
            />
            <span className="toggle-slider"></span>
            <span className="toggle-label">Enable captions for videos</span>
          </label>

          <label className="toggle-control">
            <input
              type="checkbox"
              checked={preferences.signLanguageSupport}
              onChange={(e) => handleToggle('signLanguageSupport', e.target.checked)}
            />
            <span className="toggle-slider"></span>
            <span className="toggle-label">Show sign language videos</span>
          </label>
        </div>

        <div className="control-demo">
          <h3>Test Your Settings</h3>
          <button
            className="test-button"
            onClick={() => {
              announcer.announce('Test notification triggered');
              // Trigger a test notification
            }}
          >
            Test Visual Notification
          </button>
        </div>
      </div>
    </div>
  );
};

interface VolumeVisualizerProps {
  volume: number;
  isActive: boolean;
  className?: string;
}

/**
 * VolumeVisualizer - Visual representation of audio volume
 */
export const VolumeVisualizer: React.FC<VolumeVisualizerProps> = ({
  volume,
  isActive,
  className = ''
}) => {
  const { preferences } = useInclusiveDesign();

  if (!preferences.visualNotifications) {
    return null;
  }

  const getVolumeLevel = () => {
    if (volume === 0) return 'muted';
    if (volume < 0.33) return 'low';
    if (volume < 0.67) return 'medium';
    return 'high';
  };

  const volumeLevel = getVolumeLevel();
  const barCount = 5;
  const activeBars = Math.ceil(volume * barCount);

  return (
    <div className={`volume-visualizer ${isActive ? 'active' : ''} ${className}`} role="meter" aria-label={`Volume ${Math.round(volume * 100)}%`}>
      <div className="volume-bars">
        {Array.from({ length: barCount }, (_, i) => (
          <div
            key={i}
            className={`volume-bar ${i < activeBars ? 'active' : ''} ${volumeLevel}`}
            aria-hidden="true"
          />
        ))}
      </div>
      <div className="volume-label" aria-hidden="true">
        {volumeLevel === 'muted' ? '🔇' :
         volumeLevel === 'low' ? '🔈' :
         volumeLevel === 'medium' ? '🔉' : '🔊'}
      </div>
    </div>
  );
};

export default {
  VisualNotification,
  Captions,
  SignLanguageVideo,
  VisualAlert,
  HapticFeedback,
  AudioDescription,
  HearingAccessibilityPanel,
  VolumeVisualizer
};