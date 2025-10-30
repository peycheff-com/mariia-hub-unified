/**
 * Cognitive Accessibility Components
 * Provides support for users with cognitive disabilities, intellectual disabilities, and learning difficulties
 */

import React, { useState, useEffect, useRef } from 'react';
import { useInclusiveDesign } from '@/lib/inclusive-design-system';
import { announcer } from '@/utils/accessibility';

interface SimplifiedContentProps {
  children: React.ReactNode;
  level?: 'basic' | 'intermediate' | 'advanced';
  showProgress?: boolean;
  currentStep?: number;
  totalSteps?: number;
}

/**
 * SimplifiedContent - Provides simplified text with progress tracking and help options
 */
export const SimplifiedContent: React.FC<SimplifiedContentProps> = ({
  children,
  level = 'intermediate',
  showProgress = false,
  currentStep = 1,
  totalSteps = 1
}) => {
  const { preferences } = useInclusiveDesign();

  const simplifyText = (text: string): string => {
    if (!preferences.simplifiedLanguage && level === 'advanced') return text;

    // Basic text simplification
    let simplified = text;

    // Replace complex words
    const replacements: Record<string, string> = {
      'utilize': 'use',
      'facilitate': 'help',
      'implement': 'add',
      'subsequently': 'then',
      'consequently': 'so',
      'accordingly': 'so',
      'nevertheless': 'but',
      'furthermore': 'also',
      'regarding': 'about',
      'constitute': 'make up',
      'accommodate': 'fit',
      'commence': 'start',
      'terminate': 'end',
      'sufficient': 'enough',
      'adequate': 'enough',
      'numerous': 'many',
      'various': 'different',
      'prior': 'before',
      'subsequent': 'after',
      'alternative': 'choice',
      'assistance': 'help',
      'requirement': 'need',
      'specification': 'detail',
      'methodology': 'method',
    };

    Object.entries(replacements).forEach(([complex, simple]) => {
      const regex = new RegExp(`\\b${complex}\\b`, 'gi');
      simplified = simplified.replace(regex, simple);
    });

    // Break down long sentences
    simplified = simplified.replace(/([.!?])\s*([A-Z])/g, '$1\n\n$2');

    return simplified;
  };

  const processChildren = (node: React.ReactNode): React.ReactNode => {
    if (typeof node === 'string') {
      return simplifyText(node);
    }

    if (React.isValidElement(node)) {
      const { children, ...props } = node.props;

      return React.createElement(
        node.type,
        {
          ...props,
          className: `${props.className || ''} cognitive-accessible`
        },
        processChildren(children)
      );
    }

    if (Array.isArray(node)) {
      return node.map(processChildren);
    }

    return node;
  };

  return (
    <div className={`cognitive-content cognitive-level-${level}`}>
      {showProgress && preferences.showProgressIndicators && (
        <div className="progress-tracker" role="progressbar" aria-valuenow={currentStep} aria-valuemin={1} aria-valuemax={totalSteps}>
          <div className="progress-steps">
            {Array.from({ length: totalSteps }, (_, i) => (
              <div
                key={i}
                className={`progress-step ${
                  i + 1 < currentStep ? 'completed' :
                  i + 1 === currentStep ? 'current' : 'pending'
                }`}
                aria-label={`Step ${i + 1} of ${totalSteps}`}
              >
                <span className="step-number">{i + 1}</span>
              </div>
            ))}
          </div>
          <div className="progress-text">
            Step {currentStep} of {totalSteps}
          </div>
        </div>
      )}

      <div className="simplified-content" role="region" aria-label="Simplified content">
        {processChildren(children)}
      </div>
    </div>
  );
};

interface HelpTextProps {
  children: React.ReactNode;
  title?: string;
  icon?: React.ReactNode;
  persistent?: boolean;
}

/**
 * HelpText - Provides contextual help and instructions
 */
export const HelpText: React.FC<HelpTextProps> = ({
  children,
  title = 'Help',
  icon = '❓',
  persistent = false
}) => {
  const { preferences } = useInclusiveDesign();
  const [isVisible, setIsVisible] = useState(persistent);

  useEffect(() => {
    if (preferences.showHelpText && !persistent) {
      setIsVisible(true);
      // Auto-hide after instruction display time
      const timer = setTimeout(() => {
        setIsVisible(false);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [preferences.showHelpText, persistent]);

  if (!preferences.showHelpText || !isVisible) return null;

  return (
    <div className="help-text" role="complementary" aria-label={title}>
      <div className="help-header">
        <span className="help-icon" aria-hidden="true">{icon}</span>
        <h4 className="help-title">{title}</h4>
        {!persistent && (
          <button
            className="help-close"
            onClick={() => setIsVisible(false)}
            aria-label="Close help"
          >
            ×
          </button>
        )}
      </div>
      <div className="help-content">
        {children}
      </div>
    </div>
  );
};

interface InstructionProps {
  children: React.ReactNode;
  step?: number;
  type?: 'info' | 'warning' | 'success' | 'error';
  timeout?: number;
}

/**
 * Instruction - Provides step-by-step instructions with visual cues
 */
export const Instruction: React.FC<InstructionProps> = ({
  children,
  step,
  type = 'info',
  timeout = 3000
}) => {
  const { preferences } = useInclusiveDesign();
  const [isVisible, setIsVisible] = useState(true);
  const timeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    if (preferences.extendedTimeouts) {
      timeout *= 2;
    }

    if (timeout > 0) {
      timeoutRef.current = setTimeout(() => {
        setIsVisible(false);
      }, timeout);
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [timeout, preferences.extendedTimeouts]);

  if (!isVisible) return null;

  const typeStyles = {
    info: 'instruction-info',
    warning: 'instruction-warning',
    success: 'instruction-success',
    error: 'instruction-error'
  };

  const icons = {
    info: 'ℹ️',
    warning: '⚠️',
    success: '✅',
    error: '❌'
  };

  return (
    <div className={`instruction ${typeStyles[type]}`} role="alert" aria-live="polite">
      <div className="instruction-content">
        {step && (
          <div className="instruction-step" aria-label={`Step ${step}`}>
            {step}
          </div>
        )}
        <span className="instruction-icon" aria-hidden="true">{icons[type]}</span>
        <div className="instruction-text">
          {children}
        </div>
      </div>
    </div>
  );
};

interface ClearErrorMessageProps {
  error: string;
  field?: string;
  suggestion?: string;
  onDismiss?: () => void;
}

/**
 * ClearErrorMessage - Provides accessible error messages with actionable guidance
 */
export const ClearErrorMessage: React.FC<ClearErrorMessageProps> = ({
  error,
  field,
  suggestion,
  onDismiss
}) => {
  const { preferences } = useInclusiveDesign();
  const [isVisible, setIsVisible] = useState(true);

  const handleDismiss = () => {
    setIsVisible(false);
    onDismiss?.();
    announcer.announce('Error message dismissed');
  };

  if (!preferences.clearErrorMessages || !isVisible) return null;

  const errorMessage = field ? `Error in ${field}: ${error}` : `Error: ${error}`;

  return (
    <div className="error-message" role="alert" aria-live="assertive">
      <div className="error-content">
        <span className="error-icon" aria-hidden="true">❌</span>
        <div className="error-text">
          <strong>Error:</strong> {error}
          {field && <span className="error-field"> (in {field})</span>}
          {suggestion && (
            <div className="error-suggestion">
              <span className="suggestion-icon" aria-hidden="true">💡</span>
              <span className="suggestion-text">Suggestion: {suggestion}</span>
            </div>
          )}
        </div>
        <button
          className="error-dismiss"
          onClick={handleDismiss}
          aria-label="Dismiss error message"
        >
          ×
        </button>
      </div>
    </div>
  );
};

interface MemoryAidProps {
  title: string;
  items: string[];
  type?: 'checkpoint' | 'summary' | 'reminder';
}

/**
 * MemoryAid - Provides memory assistance for users with memory difficulties
 */
export const MemoryAid: React.FC<MemoryAidProps> = ({
  title,
  items,
  type = 'summary'
}) => {
  const { preferences } = useInclusiveDesign();

  if (!preferences.memoryAids) return null;

  const typeStyles = {
    checkpoint: 'memory-aid-checkpoint',
    summary: 'memory-aid-summary',
    reminder: 'memory-aid-reminder'
  };

  const icons = {
    checkpoint: '📍',
    summary: '📋',
    reminder: '🔔'
  };

  return (
    <div className={`memory-aid ${typeStyles[type]}`} role="complementary" aria-label={title}>
      <div className="memory-aid-header">
        <span className="memory-aid-icon" aria-hidden="true">{icons[type]}</span>
        <h3 className="memory-aid-title">{title}</h3>
      </div>
      <ul className="memory-aid-list">
        {items.map((item, index) => (
          <li key={index} className="memory-aid-item">
            <span className="memory-aid-bullet">{index + 1}.</span>
            <span className="memory-aid-text">{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
};

interface ComplexTermProps {
  term: string;
  simpleDefinition: string;
  children?: React.ReactNode;
}

/**
 * ComplexTerm - Provides simplified definitions for complex terminology
 */
export const ComplexTerm: React.FC<ComplexTermProps> = ({
  term,
  simpleDefinition,
  children
}) => {
  const { preferences } = useInclusiveDesign();
  const [showDefinition, setShowDefinition] = useState(false);

  if (!preferences.translateTechnicalTerms) {
    return <>{children || term}</>;
  }

  return (
    <span
      className="complex-term"
      data-simple-term={simpleDefinition}
      onMouseEnter={() => setShowDefinition(true)}
      onMouseLeave={() => setShowDefinition(false)}
      onFocus={() => setShowDefinition(true)}
      onBlur={() => setShowDefinition(false)}
      role="button"
      tabIndex={0}
      aria-label={`${term}. Definition: ${simpleDefinition}`}
      aria-describedby={showDefinition ? undefined : 'term-definition-hidden'}
    >
      {children || term}
      {showDefinition && (
        <span className="term-definition" id="term-definition-visible">
          {simpleDefinition}
        </span>
      )}
      <span id="term-definition-hidden" className="sr-only">
        {simpleDefinition}
      </span>
    </span>
  );
};

interface ReadingPaceProps {
  children: React.ReactNode;
  wordsPerMinute?: number;
}

/**
 * ReadingPace - Controls text display pace for users who need more time to read
 */
export const ReadingPace: React.FC<ReadingPaceProps> = ({
  children,
  wordsPerMinute = 150
}) => {
  const { preferences } = useInclusiveDesign();
  const [displayText, setDisplayText] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);

  const text = typeof children === 'string' ? children : '';
  const words = text.split(' ');
  const adjustedWPM = preferences.extendedTimeouts ? wordsPerMinute * 0.7 : wordsPerMinute;
  const delay = (60 / adjustedWPM) * 1000; // Convert to milliseconds

  useEffect(() => {
    if (currentIndex < words.length) {
      const timer = setTimeout(() => {
        setDisplayText(prev => prev ? `${prev} ${words[currentIndex]}` : words[currentIndex]);
        setCurrentIndex(prev => prev + 1);
      }, delay);

      return () => clearTimeout(timer);
    }
  }, [currentIndex, words, delay]);

  if (!preferences.extendedTimeouts) {
    return <>{children}</>;
  }

  return (
    <div className="reading-pace" role="region" aria-label="Text displayed at adjusted reading pace">
      <span className="paced-text">{displayText}</span>
      {currentIndex < words.length && (
        <span className="reading-indicator" aria-hidden="true">▋</span>
      )}
    </div>
  );
};

interface FocusGuideProps {
  steps: Array<{
    target: string;
    title: string;
    description: string;
  }>;
  onComplete?: () => void;
}

/**
 * FocusGuide - Provides step-by-step focus guidance for complex forms
 */
export const FocusGuide: React.FC<FocusGuideProps> = ({
  steps,
  onComplete
}) => {
  const { preferences } = useInclusiveDesign();
  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(true);

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(prev => prev + 1);
      // Focus the next target
      const nextTarget = document.querySelector(steps[currentStep + 1].target);
      if (nextTarget) {
        (nextTarget as HTMLElement).focus();
      }
    } else {
      setIsVisible(false);
      onComplete?.();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
      const prevTarget = document.querySelector(steps[currentStep - 1].target);
      if (prevTarget) {
        (prevTarget as HTMLElement).focus();
      }
    }
  };

  const handleSkip = () => {
    setIsVisible(false);
    announcer.announce('Focus guide skipped');
  };

  if (!preferences.stepByStepGuidance || !isVisible) return null;

  const step = steps[currentStep];

  return (
    <div className="focus-guide" role="dialog" aria-labelledby="focus-guide-title">
      <div className="focus-guide-content">
        <div className="focus-guide-header">
          <h3 id="focus-guide-title">{step.title}</h3>
          <span className="focus-guide-progress">
            {currentStep + 1} of {steps.length}
          </span>
        </div>

        <div className="focus-guide-description">
          {step.description}
        </div>

        <div className="focus-guide-actions">
          <button
            className="focus-guide-button secondary"
            onClick={handleSkip}
            aria-label="Skip focus guide"
          >
            Skip
          </button>

          <div className="focus-guide-navigation">
            <button
              className="focus-guide-button"
              onClick={handlePrevious}
              disabled={currentStep === 0}
              aria-label="Previous step"
            >
              ← Previous
            </button>

            <button
              className="focus-guide-button primary"
              onClick={handleNext}
              aria-label={currentStep === steps.length - 1 ? 'Complete guide' : 'Next step'}
            >
              {currentStep === steps.length - 1 ? 'Complete' : 'Next →'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default {
  SimplifiedContent,
  HelpText,
  Instruction,
  ClearErrorMessage,
  MemoryAid,
  ComplexTerm,
  ReadingPace,
  FocusGuide
};