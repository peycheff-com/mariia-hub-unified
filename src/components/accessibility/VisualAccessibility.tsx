/**
 * Visual Accessibility Components
 * Provides support for users with visual impairments, low vision, color blindness, and screen reader users
 */

import React, { useState, useEffect, useRef } from 'react';
import { useInclusiveDesign } from '@/lib/inclusive-design-system';
import { announcer } from '@/utils/accessibility';

interface AccessibleImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  alt: string;
  decorative?: boolean;
  longDesc?: string;
  caption?: string;
  src?: string;
}

/**
 * AccessibleImage - Enhanced image with comprehensive accessibility features
 */
export const AccessibleImage: React.FC<AccessibleImageProps> = ({
  alt,
  decorative = false,
  longDesc,
  caption,
  className = '',
  ...props
}) => {
  const { preferences } = useInclusiveDesign();
  const [imageLoaded, setImageLoaded] = useState(false);
  const [error, setError] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  const handleLoad = () => {
    setImageLoaded(true);
    announcer.announce(decorative ? 'Decorative image loaded' : `Image loaded: ${alt}`);
  };

  const handleError = () => {
    setError(true);
    announcer.announce('Image failed to load');
  };

  const getAccessibleAlt = (): string => {
    if (decorative) return '';
    if (!alt) return 'Image description unavailable';
    return alt;
  };

  const getRole = (): string => {
    return decorative ? 'presentation' : 'img';
  };

  return (
    <figure className={`accessible-image ${className}`}>
      <img
        ref={imgRef}
        {...props}
        alt={getAccessibleAlt()}
        role={getRole()}
        onLoad={handleLoad}
        onError={handleError}
        aria-describedby={caption ? 'image-caption' : longDesc ? 'image-longdesc' : undefined}
      />

      {error && (
        <div className="image-error" role="alert">
          Image unavailable: {alt}
        </div>
      )}

      {!imageLoaded && !error && (
        <div className="image-loading" aria-hidden="true">
          Loading image...
        </div>
      )}

      {caption && (
        <figcaption id="image-caption" className="image-caption">
          {caption}
        </figcaption>
      )}

      {longDesc && (
        <div id="image-longdesc" className="sr-only">
          {longDesc}
        </div>
      )}
    </figure>
  );
};

interface FocusIndicatorProps {
  children: React.ReactNode;
  variant?: 'subtle' | 'normal' | 'enhanced';
  color?: string;
  inset?: boolean;
}

/**
 * FocusIndicator - Enhanced focus indicators for better visibility
 */
export const FocusIndicator: React.FC<FocusIndicatorProps> = ({
  children,
  variant = 'normal',
  color,
  inset = false
}) => {
  const { preferences } = useInclusiveDesign();
  const [isFocused, setIsFocused] = useState(false);

  const getIndicatorClass = () => {
    const baseClass = 'focus-indicator';
    const variantClass = preferences.focusIndicators || variant;
    const insetClass = inset ? 'inset' : 'outset';
    return `${baseClass} ${variantClass} ${insetClass}`;
  };

  const getIndicatorStyle = () => {
    const baseStyle: React.CSSProperties = {};
    if (color) {
      baseStyle['--focus-color'] = color;
    }
    return baseStyle;
  };

  return (
    <div
      className={getIndicatorClass()}
      style={getIndicatorStyle()}
      onFocus={() => setIsFocused(true)}
      onBlur={() => setIsFocused(false)}
    >
      {children}
      {isFocused && (
        <div className="focus-ring" aria-hidden="true" />
      )}
    </div>
  );
};

interface HighContrastToggleProps {
  className?: string;
}

/**
 * HighContrastToggle - Toggle for high contrast mode
 */
export const HighContrastToggle: React.FC<HighContrastToggleProps> = ({
  className = ''
}) => {
  const { preferences, updatePreferences } = useInclusiveDesign();

  const toggleHighContrast = () => {
    updatePreferences({ highContrast: !preferences.highContrast });
    announcer.announce(
      preferences.highContrast ? 'High contrast mode disabled' : 'High contrast mode enabled'
    );
  };

  return (
    <button
      className={`high-contrast-toggle ${className}`}
      onClick={toggleHighContrast}
      aria-pressed={preferences.highContrast}
      aria-label={`Toggle high contrast mode, currently ${preferences.highContrast ? 'enabled' : 'disabled'}`}
    >
      <span className="toggle-icon" aria-hidden="true">
        {preferences.highContrast ? '🌞' : '🌙'}
      </span>
      <span className="toggle-text">
        {preferences.highContrast ? 'Normal Contrast' : 'High Contrast'}
      </span>
    </button>
  );
};

interface FontSizeControlProps {
  className?: string;
}

/**
 * FontSizeControl - Controls for adjusting font size
 */
export const FontSizeControl: React.FC<FontSizeControlProps> = ({
  className = ''
}) => {
  const { preferences, updatePreferences } = useInclusiveDesign();

  const sizes: Array<'small' | 'medium' | 'large' | 'extra-large'> = [
    'small', 'medium', 'large', 'extra-large'
  ];

  const sizeLabels = {
    small: 'A-',
    medium: 'A',
    large: 'A+',
    'extra-large': 'A++'
  };

  const changeFontSize = (size: typeof sizes[number]) => {
    updatePreferences({ fontSize: size });
    announcer.announce(`Font size changed to ${size}`);
  };

  return (
    <div className={`font-size-control ${className}`} role="group" aria-label="Font size controls">
      {sizes.map(size => (
        <button
          key={size}
          className={`font-size-button ${preferences.fontSize === size ? 'active' : ''}`}
          onClick={() => changeFontSize(size)}
          aria-label={`Set font size to ${size}`}
          aria-pressed={preferences.fontSize === size}
        >
          <span className="font-size-label" aria-hidden="true">
            {sizeLabels[size]}
          </span>
        </button>
      ))}
    </div>
  );
};

interface ColorBlindModeProps {
  className?: string;
}

/**
 * ColorBlindMode - Controls for color blind accessibility modes
 */
export const ColorBlindMode: React.FC<ColorBlindModeProps> = ({
  className = ''
}) => {
  const { preferences, updatePreferences } = useInclusiveDesign();

  const modes: Array<'none' | 'protanopia' | 'deuteranopia' | 'tritanopia'> = [
    'none', 'protanopia', 'deuteranopia', 'tritanopia'
  ];

  const modeLabels = {
    none: 'Normal',
    protanopia: 'Protanopia',
    deuteranopia: 'Deuteranopia',
    tritanopia: 'Tritanopia'
  };

  const changeColorMode = (mode: typeof modes[number]) => {
    updatePreferences({ colorBlindMode: mode });
    announcer.announce(`Color blind mode changed to ${modeLabels[mode]}`);
  };

  return (
    <div className={`color-blind-mode ${className}`} role="group" aria-label="Color blind accessibility modes">
      <label className="mode-label" htmlFor="color-accessibility">Color Accessibility:</label>
      <select
        className="mode-select"
        value={preferences.colorBlindMode}
        onChange={(e) => changeColorMode(e.target.value as typeof modes[number])}
        aria-label="Select color blind accessibility mode"
      >
        {modes.map(mode => (
          <option key={mode} value={mode}>
            {modeLabels[mode]}
          </option>
        ))}
      </select>
    </div>
  );
};

interface TextToSpeechProps {
  text: string;
  className?: string;
  autoPlay?: boolean;
}

/**
 * TextToSpeech - Text-to-speech functionality for content
 */
export const TextToSpeech: React.FC<TextToSpeechProps> = ({
  text,
  className = '',
  autoPlay = false
}) => {
  const { preferences } = useInclusiveDesign();
  const [isPlaying, setIsPlaying] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  useEffect(() => {
    setIsSupported('speechSynthesis' in window);
  }, []);

  useEffect(() => {
    if (autoPlay && preferences.textToSpeech && isSupported && text) {
      speak();
    }
  }, [autoPlay, preferences.textToSpeech, isSupported, text]);

  const speak = () => {
    if (!isSupported || !text) return;

    // Cancel any ongoing speech
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'pl-PL'; // Polish language
    utterance.rate = 0.9; // Slightly slower for clarity
    utterance.pitch = 1;
    utterance.volume = 1;

    utterance.onstart = () => {
      setIsPlaying(true);
      announcer.announce('Text-to-speech started');
    };

    utterance.onend = () => {
      setIsPlaying(false);
      announcer.announce('Text-to-speech ended');
    };

    utterance.onerror = () => {
      setIsPlaying(false);
      announcer.announce('Text-to-speech error');
    };

    utteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  };

  const pause = () => {
    if (window.speechSynthesis.speaking && !window.speechSynthesis.paused) {
      window.speechSynthesis.pause();
      setIsPlaying(false);
    }
  };

  const resume = () => {
    if (window.speechSynthesis.paused) {
      window.speechSynthesis.resume();
      setIsPlaying(true);
    }
  };

  const stop = () => {
    window.speechSynthesis.cancel();
    setIsPlaying(false);
  };

  if (!preferences.textToSpeech || !isSupported) {
    return null;
  }

  return (
    <div className={`text-to-speech ${className}`}>
      <div className="tts-controls" role="group" aria-label="Text to speech controls">
        <button
          className={`tts-button tts-play ${isPlaying ? 'playing' : ''}`}
          onClick={isPlaying ? pause : speak}
          aria-label={isPlaying ? 'Pause speech' : 'Play text to speech'}
          aria-pressed={isPlaying}
        >
          <span className="tts-icon" aria-hidden="true">
            {isPlaying ? '⏸️' : '🔊'}
          </span>
        </button>

        {isPlaying && window.speechSynthesis.paused && (
          <button
            className="tts-button tts-resume"
            onClick={resume}
            aria-label="Resume speech"
          >
            <span className="tts-icon" aria-hidden="true">▶️</span>
          </button>
        )}

        {isPlaying && (
          <button
            className="tts-button tts-stop"
            onClick={stop}
            aria-label="Stop speech"
          >
            <span className="tts-icon" aria-hidden="true">⏹️</span>
          </button>
        )}
      </div>

      {isPlaying && (
        <div className="tts-indicator" aria-live="polite" aria-atomic="true">
          <span className="tts-status">Reading content aloud...</span>
          <div className="tts-progress" aria-hidden="true" />
        </div>
      )}
    </div>
  );
};

interface ScreenReaderSkipLinkProps {
  href: string;
  children: React.ReactNode;
  className?: string;
}

/**
 * ScreenReaderSkipLink - Skip links for screen reader navigation
 */
export const ScreenReaderSkipLink: React.FC<ScreenReaderSkipLinkProps> = ({
  href,
  children,
  className = ''
}) => {
  return (
    <a
      href={href}
      className={`skip-link ${className}`}
      aria-label={`Skip to ${children}`}
    >
      {children}
    </a>
  );
};

interface AccessibleTableProps {
  caption: string;
  headers: string[];
  rows: string[][];
  className?: string;
}

/**
 * AccessibleTable - Enhanced table with comprehensive accessibility features
 */
export const AccessibleTable: React.FC<AccessibleTableProps> = ({
  caption,
  headers,
  rows,
  className = ''
}) => {
  const { preferences } = useInclusiveDesign();

  return (
    <div className={`accessible-table-container ${className}`}>
      <table
        className="accessible-table"
        role="table"
        aria-label={caption}
        aria-rowcount={rows.length + 1}
        aria-colcount={headers.length}
      >
        <caption className="table-caption">{caption}</caption>
        <thead>
          <tr role="row">
            {headers.map((header, index) => (
              <th
                key={index}
                scope="col"
                role="columnheader"
                aria-sort="none"
                tabIndex={preferences.screenReaderOptimized ? 0 : -1}
              >
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, rowIndex) => (
            <tr key={rowIndex} role="row" aria-rowindex={rowIndex + 1}>
              {row.map((cell, cellIndex) => (
                <td
                  key={cellIndex}
                  role="gridcell"
                  aria-colindex={cellIndex + 1}
                  headers={`col-${cellIndex}`}
                >
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

interface ReducedMotionToggleProps {
  className?: string;
}

/**
 * ReducedMotionToggle - Toggle for reduced motion preferences
 */
export const ReducedMotionToggle: React.FC<ReducedMotionToggleProps> = ({
  className = ''
}) => {
  const { preferences, updatePreferences } = useInclusiveDesign();

  const toggleReducedMotion = () => {
    updatePreferences({ reducedMotion: !preferences.reducedMotion });
    announcer.announce(
      preferences.reducedMotion ? 'Animations enabled' : 'Reduced motion enabled'
    );
  };

  return (
    <button
      className={`reduced-motion-toggle ${className}`}
      onClick={toggleReducedMotion}
      aria-pressed={preferences.reducedMotion}
      aria-label={`Toggle reduced motion, currently ${preferences.reducedMotion ? 'enabled' : 'disabled'}`}
    >
      <span className="toggle-icon" aria-hidden="true">
        {preferences.reducedMotion ? '⏸️' : '▶️'}
      </span>
      <span className="toggle-text">
        {preferences.reducedMotion ? 'Motion Reduced' : 'Normal Motion'}
      </span>
    </button>
  );
};

interface VisualAccessibilityPanelProps {
  className?: string;
}

/**
 * VisualAccessibilityPanel - Complete panel for visual accessibility controls
 */
export const VisualAccessibilityPanel: React.FC<VisualAccessibilityPanelProps> = ({
  className = ''
}) => {
  const { preferences } = useInclusiveDesign();

  return (
    <div className={`visual-accessibility-panel ${className}`} role="region" aria-label="Visual accessibility controls">
      <h2 className="panel-title">Visual Accessibility</h2>

      <div className="accessibility-controls">
        <div className="control-group">
          <h3>Display Settings</h3>
          <HighContrastToggle />
          <ReducedMotionToggle />
          <FontSizeControl />
        </div>

        <div className="control-group">
          <h3>Color Accessibility</h3>
          <ColorBlindMode />
        </div>

        <div className="control-group">
          <h3>Reading Assistance</h3>
          <div className="preference-toggle">
            <label>
              <input
                type="checkbox"
                checked={preferences.screenReaderOptimized}
                onChange={(e) => {
                  preferences.updatePreferences({ screenReaderOptimized: e.target.checked });
                  announcer.announce(
                    e.target.checked ? 'Screen reader optimization enabled' : 'Screen reader optimization disabled'
                  );
                }}
              />
              Screen Reader Optimization
            </label>
          </div>
        </div>
      </div>
    </div>
  );
};

export default {
  AccessibleImage,
  FocusIndicator,
  HighContrastToggle,
  FontSizeControl,
  ColorBlindMode,
  TextToSpeech,
  ScreenReaderSkipLink,
  AccessibleTable,
  ReducedMotionToggle,
  VisualAccessibilityPanel
};