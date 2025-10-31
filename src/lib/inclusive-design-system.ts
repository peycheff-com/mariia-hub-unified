/**
 * Comprehensive Inclusive Design System for mariiaborysevych
 * Implements WCAG 2.2 AAA standards with luxury aesthetic
 * Supports diverse users with cognitive, motor, visual, and hearing accessibility needs
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Types for inclusive design preferences
export interface InclusiveDesignPreferences {
  // Cognitive accessibility
  simplifiedLanguage: boolean;
  readingLevel: 'basic' | 'intermediate' | 'advanced';
  showHelpText: boolean;
  showIcons: boolean;
  showProgressIndicators: boolean;
  extendedTimeouts: boolean;
  clearErrorMessages: boolean;

  // Motor accessibility
  largeTouchTargets: boolean;
  increasedSpacing: boolean;
  voiceControl: boolean;
  swipeGestures: boolean;
  oneHandedMode: 'left' | 'right' | 'both';
  timeoutExtensions: number; // multiplier for timeouts

  // Visual accessibility
  highContrast: boolean;
  fontSize: 'small' | 'medium' | 'large' | 'extra-large';
  colorBlindMode: 'none' | 'protanopia' | 'deuteranopia' | 'tritanopia';
  reducedMotion: boolean;
  screenReaderOptimized: boolean;
  focusIndicators: 'subtle' | 'normal' | 'enhanced';
  textToSpeech: boolean;

  // Hearing accessibility
  visualNotifications: boolean;
  captionsEnabled: boolean;
  signLanguageSupport: boolean;
  hapticFeedback: boolean;
  visualAlerts: boolean;

  // Language accessibility
  translateTechnicalTerms: boolean;
  showContextualHelp: boolean;
  simpleVocabulary: boolean;
  consistentTerminology: boolean;

  // Age-friendly design
  elderlyMode: boolean;
  memoryAids: boolean;
  stepByStepGuidance: boolean;
  confirmationDialogs: boolean;

  // Cultural sensitivity
  culturalAdaptation: 'polish' | 'international' | 'adaptive';
  inclusiveImagery: boolean;
  culturalColorSchemes: boolean;
}

interface InclusiveDesignState {
  preferences: InclusiveDesignPreferences;
  detectedCapabilities: DetectedCapabilities;
  updatePreferences: (updates: Partial<InclusiveDesignPreferences>) => void;
  resetToDefaults: () => void;
  detectUserCapabilities: () => void;
  applyPreferences: () => void;
}

interface DetectedCapabilities {
  screenReaderActive: boolean;
  keyboardNavigationActive: boolean;
  touchDevice: boolean;
  voiceControlActive: boolean;
  highContrastMode: boolean;
  reducedMotion: boolean;
  fontSizeIncreased: boolean;
  motorImpairmentsDetected: boolean;
  cognitiveLoadDetected: boolean;
}

// Default preferences
const defaultPreferences: InclusiveDesignPreferences = {
  // Cognitive accessibility
  simplifiedLanguage: false,
  readingLevel: 'intermediate',
  showHelpText: true,
  showIcons: true,
  showProgressIndicators: true,
  extendedTimeouts: false,
  clearErrorMessages: true,

  // Motor accessibility
  largeTouchTargets: false,
  increasedSpacing: false,
  voiceControl: false,
  swipeGestures: true,
  oneHandedMode: 'both',
  timeoutExtensions: 1,

  // Visual accessibility
  highContrast: false,
  fontSize: 'medium',
  colorBlindMode: 'none',
  reducedMotion: false,
  screenReaderOptimized: false,
  focusIndicators: 'normal',
  textToSpeech: false,

  // Hearing accessibility
  visualNotifications: false,
  captionsEnabled: false,
  signLanguageSupport: false,
  hapticFeedback: false,
  visualAlerts: false,

  // Language accessibility
  translateTechnicalTerms: false,
  showContextualHelp: false,
  simpleVocabulary: false,
  consistentTerminology: true,

  // Age-friendly design
  elderlyMode: false,
  memoryAids: false,
  stepByStepGuidance: false,
  confirmationDialogs: false,

  // Cultural sensitivity
  culturalAdaptation: 'polish',
  inclusiveImagery: true,
  culturalColorSchemes: false,
};

// Create Zustand store for inclusive design preferences
export const useInclusiveDesign = create<InclusiveDesignState>()(
  persist(
    (set, get) => ({
      preferences: defaultPreferences,
      detectedCapabilities: {
        screenReaderActive: false,
        keyboardNavigationActive: false,
        touchDevice: false,
        voiceControlActive: false,
        highContrastMode: false,
        reducedMotion: false,
        fontSizeIncreased: false,
        motorImpairmentsDetected: false,
        cognitiveLoadDetected: false,
      },

      updatePreferences: (updates) => {
        set((state) => ({
          preferences: { ...state.preferences, ...updates }
        }));
        get().applyPreferences();
      },

      resetToDefaults: () => {
        set({ preferences: defaultPreferences });
        get().applyPreferences();
      },

      detectUserCapabilities: () => {
        if (typeof window === 'undefined') return;

        const capabilities: DetectedCapabilities = {
          // Screen reader detection
          screenReaderActive: (
            window.speechSynthesis !== undefined ||
            navigator.userAgent.includes('NVDA') ||
            navigator.userAgent.includes('JAWS') ||
            window.matchMedia('(prefers-reduced-motion: reduce)').matches
          ),

          // Keyboard navigation detection
          keyboardNavigationActive: false,

          // Touch device detection
          touchDevice: (
            'ontouchstart' in window ||
            navigator.maxTouchPoints > 0 ||
            (navigator as any).msMaxTouchPoints > 0
          ),

          // Voice control detection
          voiceControlActive: (
            'SpeechRecognition' in window ||
            'webkitSpeechRecognition' in window
          ),

          // High contrast detection
          highContrastMode: window.matchMedia('(prefers-contrast: high)').matches,

          // Reduced motion detection
          reducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches,

          // Font size detection
          fontSizeIncreased: parseFloat(window.getComputedStyle(document.body).fontSize) > 16,

          // Motor impairments detection (based on interaction patterns)
          motorImpairmentsDetected: false,

          // Cognitive load detection
          cognitiveLoadDetected: false,
        };

        // Detect keyboard navigation
        document.addEventListener('keydown', () => {
          capabilities.keyboardNavigationActive = true;
        }, { once: true });

        // Detect motor impairments through interaction patterns
        let mouseMovements = 0;
        let clickAccuracy = 0;
        let totalClicks = 0;

        document.addEventListener('mousemove', () => {
          mouseMovements++;
        });

        document.addEventListener('click', (e) => {
          totalClicks++;
          // Check if click is accurate (close to target center)
          const target = e.target as HTMLElement;
          if (target && target.getBoundingClientRect) {
            const rect = target.getBoundingClientRect();
            const centerX = rect.left + rect.width / 2;
            const centerY = rect.top + rect.height / 2;
            const distance = Math.sqrt(
              Math.pow(e.clientX - centerX, 2) + Math.pow(e.clientY - centerY, 2)
            );
            if (distance < Math.min(rect.width, rect.height) / 4) {
              clickAccuracy++;
            }
          }
        });

        // Analyze interaction patterns after some activity
        setTimeout(() => {
          if (totalClicks > 5 && clickAccuracy / totalClicks < 0.7) {
            capabilities.motorImpairmentsDetected = true;
          }
          if (mouseMovements > 100 && totalClicks < 5) {
            capabilities.motorImpairmentsDetected = true;
          }
        }, 10000);

        set({ detectedCapabilities: capabilities });

        // Auto-adjust preferences based on detected capabilities
        const autoPreferences: Partial<InclusiveDesignPreferences> = {};

        if (capabilities.screenReaderActive) {
          autoPreferences.screenReaderOptimized = true;
          autoPreferences.simplifiedLanguage = true;
        }

        if (capabilities.keyboardNavigationActive) {
          autoPreferences.focusIndicators = 'enhanced';
        }

        if (capabilities.highContrastMode) {
          autoPreferences.highContrast = true;
        }

        if (capabilities.reducedMotion) {
          autoPreferences.reducedMotion = true;
        }

        if (capabilities.fontSizeIncreased) {
          autoPreferences.fontSize = 'large';
        }

        if (capabilities.touchDevice) {
          autoPreferences.largeTouchTargets = true;
          autoPreferences.swipeGestures = true;
        }

        if (Object.keys(autoPreferences).length > 0) {
          get().updatePreferences(autoPreferences);
        }
      },

      applyPreferences: () => {
        if (typeof document === 'undefined') return;

        const { preferences } = get();
        const root = document.documentElement;

        // Apply cognitive accessibility preferences
        root.classList.toggle('simplified-language', preferences.simplifiedLanguage);
        root.classList.toggle('reading-level-basic', preferences.readingLevel === 'basic');
        root.classList.toggle('reading-level-intermediate', preferences.readingLevel === 'intermediate');
        root.classList.toggle('reading-level-advanced', preferences.readingLevel === 'advanced');
        root.classList.toggle('show-help-text', preferences.showHelpText);
        root.classList.toggle('show-icons', preferences.showIcons);
        root.classList.toggle('show-progress-indicators', preferences.showProgressIndicators);
        root.classList.toggle('extended-timeouts', preferences.extendedTimeouts);
        root.classList.toggle('clear-error-messages', preferences.clearErrorMessages);

        // Apply motor accessibility preferences
        root.classList.toggle('large-touch-targets', preferences.largeTouchTargets);
        root.classList.toggle('increased-spacing', preferences.increasedSpacing);
        root.classList.toggle('voice-control', preferences.voiceControl);
        root.classList.toggle('swipe-gestures', preferences.swipeGestures);
        root.classList.toggle('one-handed-left', preferences.oneHandedMode === 'left');
        root.classList.toggle('one-handed-right', preferences.oneHandedMode === 'right');

        // Apply visual accessibility preferences
        root.classList.toggle('high-contrast', preferences.highContrast);
        root.classList.toggle('font-size-small', preferences.fontSize === 'small');
        root.classList.toggle('font-size-medium', preferences.fontSize === 'medium');
        root.classList.toggle('font-size-large', preferences.fontSize === 'large');
        root.classList.toggle('font-size-extra-large', preferences.fontSize === 'extra-large');
        root.classList.toggle('colorblind-protanopia', preferences.colorBlindMode === 'protanopia');
        root.classList.toggle('colorblind-deuteranopia', preferences.colorBlindMode === 'deuteranopia');
        root.classList.toggle('colorblind-tritanopia', preferences.colorBlindMode === 'tritanopia');
        root.classList.toggle('reduced-motion', preferences.reducedMotion);
        root.classList.toggle('screen-reader-optimized', preferences.screenReaderOptimized);
        root.classList.toggle('focus-indicators-subtle', preferences.focusIndicators === 'subtle');
        root.classList.toggle('focus-indicators-normal', preferences.focusIndicators === 'normal');
        root.classList.toggle('focus-indicators-enhanced', preferences.focusIndicators === 'enhanced');
        root.classList.toggle('text-to-speech', preferences.textToSpeech);

        // Apply hearing accessibility preferences
        root.classList.toggle('visual-notifications', preferences.visualNotifications);
        root.classList.toggle('captions-enabled', preferences.captionsEnabled);
        root.classList.toggle('sign-language-support', preferences.signLanguageSupport);
        root.classList.toggle('haptic-feedback', preferences.hapticFeedback);
        root.classList.toggle('visual-alerts', preferences.visualAlerts);

        // Apply language accessibility preferences
        root.classList.toggle('translate-technical-terms', preferences.translateTechnicalTerms);
        root.classList.toggle('show-contextual-help', preferences.showContextualHelp);
        root.classList.toggle('simple-vocabulary', preferences.simpleVocabulary);
        root.classList.toggle('consistent-terminology', preferences.consistentTerminology);

        // Apply age-friendly design preferences
        root.classList.toggle('elderly-mode', preferences.elderlyMode);
        root.classList.toggle('memory-aids', preferences.memoryAids);
        root.classList.toggle('step-by-step-guidance', preferences.stepByStepGuidance);
        root.classList.toggle('confirmation-dialogs', preferences.confirmationDialogs);

        // Apply cultural sensitivity preferences
        root.classList.toggle('cultural-adaptation-polish', preferences.culturalAdaptation === 'polish');
        root.classList.toggle('cultural-adaptation-international', preferences.culturalAdaptation === 'international');
        root.classList.toggle('cultural-adaptation-adaptive', preferences.culturalAdaptation === 'adaptive');
        root.classList.toggle('inclusive-imagery', preferences.inclusiveImagery);
        root.classList.toggle('cultural-color-schemes', preferences.culturalColorSchemes);

        // Apply CSS custom properties for dynamic values
        root.style.setProperty('--timeout-multiplier', preferences.timeoutExtensions.toString());
        root.style.setProperty('--font-size-multiplier', getFontSizeMultiplier(preferences.fontSize));
        root.style.setProperty('--spacing-multiplier', preferences.increasedSpacing ? '1.5' : '1');
        root.style.setProperty('--target-size-multiplier', preferences.largeTouchTargets ? '1.2' : '1');
      },
    }),
    {
      name: 'inclusive-design-preferences',
      partialize: (state) => ({ preferences: state.preferences }),
    }
  )
);

// Helper function to get font size multiplier
function getFontSizeMultiplier(size: string): string {
  switch (size) {
    case 'small': return '0.875';
    case 'medium': return '1';
    case 'large': return '1.25';
    case 'extra-large': return '1.5';
    default: return '1';
  }
}

// Utility functions for inclusive design

/**
 * Simplify text content for cognitive accessibility
 */
export function simplifyText(text: string, level: 'basic' | 'intermediate' | 'advanced' = 'intermediate'): string {
  if (level === 'advanced') return text;

  // Basic text simplification rules
  let simplified = text;

  // Replace complex words with simpler alternatives
  const wordReplacements: Record<string, string> = {
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
    'procurement': 'buying',
    'expenditure': 'cost',
    'remuneration': 'payment',
    'comprehensive': 'complete',
    'expedite': 'speed up',
    'elucidate': 'explain',
  };

  Object.entries(wordReplacements).forEach(([complex, simple]) => {
    const regex = new RegExp(`\\b${complex}\\b`, 'gi');
    simplified = simplified.replace(regex, simple);
  });

  // Break down long sentences
  simplified = simplified.replace(/([.!?])\s*([A-Z])/g, '$1\n\n$2');

  // Simplify sentence structure
  simplified = simplified.replace(/,\s*which/g, ', and');
  simplified = simplified.replace(/\s+/g, ' ');

  if (level === 'basic') {
    // Additional simplification for basic level
    simplified = simplified.replace(/\b(\w{10,})\b/g, (match) => {
      // Break down very long words conceptually
      return match; // Keep original but could add tooltips
    });
  }

  return simplified.trim();
}

/**
 * Generate accessible alt text for images
 */
export function generateAltText(
  src: string,
  context?: string,
  decorative?: boolean
): string {
  if (decorative) return '';

  // Extract descriptive information from filename
  const filename = src.split('/').pop()?.split('.')[0] || '';
  const description = filename.replace(/[-_]/g, ' ');

  if (context) {
    return `${description} - ${context}`;
  }

  return description;
}

/**
 * Create accessible error messages
 */
export function createAccessibleErrorMessage(
  error: string,
  field?: string,
  suggestion?: string
): string {
  let message = 'Error';

  if (field) {
    message += ` in ${field}`;
  }

  message += `: ${error}`;

  if (suggestion) {
    message += ` Please ${suggestion}.`;
  }

  return message;
}

/**
 * Check if content meets reading level requirements
 */
export function checkReadingLevel(text: string): {
  fleschKincaid: number;
  suggestedLevel: 'basic' | 'intermediate' | 'advanced';
  complexWords: string[];
} {
  // Simplified Flesch-Kincaid calculation
  const words = text.split(/\s+/);
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
  const syllables = words.reduce((total, word) => total + countSyllables(word), 0);

  const avgWordsPerSentence = words.length / sentences.length;
  const avgSyllablesPerWord = syllables / words.length;

  // Flesch-Kincaid grade level
  const fleschKincaid = 206.835 - (1.015 * avgWordsPerSentence) - (84.6 * avgSyllablesPerWord);

  let suggestedLevel: 'basic' | 'intermediate' | 'advanced';
  if (fleschKincaid >= 80) {
    suggestedLevel = 'basic';
  } else if (fleschKincaid >= 60) {
    suggestedLevel = 'intermediate';
  } else {
    suggestedLevel = 'advanced';
  }

  // Find complex words (3+ syllables)
  const complexWords = words.filter(word => countSyllables(word) >= 3);

  return {
    fleschKincaid,
    suggestedLevel,
    complexWords,
  };
}

/**
 * Count syllables in a word (simplified)
 */
function countSyllables(word: string): number {
  word = word.toLowerCase();
  if (word.length <= 3) return 1;

  // Remove silent 'e' at the end
  if (word.endsWith('e')) {
    word = word.slice(0, -1);
  }

  // Count vowel groups
  const vowelGroups = word.match(/[aeiouy]+/g);
  return vowelGroups ? vowelGroups.length : 1;
}

/**
 * Generate accessible labels for form fields
 */
export function generateAccessibleLabel(
  label: string,
  type?: string,
  required?: boolean,
  options?: string[]
): {
  label: string;
  description?: string;
  validationMessage?: string;
} {
  let accessibleLabel = label;
  let description;
  let validationMessage;

  // Add context based on field type
  if (type) {
    switch (type) {
      case 'email':
        description = 'Enter your email address in format: name@example.com';
        break;
      case 'tel':
        description = 'Enter your phone number with area code';
        break;
      case 'date':
        description = 'Select date from calendar';
        break;
      case 'password':
        description = 'Password should be at least 8 characters long';
        break;
      case 'select':
        description = options ? `Choose from: ${options.join(', ')}` : 'Select an option';
        break;
    }
  }

  if (required) {
    accessibleLabel += ' (required)';
    validationMessage = `${label} is required`;
  }

  return {
    label: accessibleLabel,
    description,
    validationMessage,
  };
}

/**
 * Create accessible color combinations
 */
export function getAccessibleColor(
  baseColor: string,
  mode: 'normal' | 'high-contrast' | 'colorblind' = 'normal',
  colorBlindType?: 'protanopia' | 'deuteranopia' | 'tritanopia'
): string {
  // This is a simplified version - in practice you'd use a proper color library
  if (mode === 'high-contrast') {
    // Return high contrast version
    return baseColor === '#ffffff' ? '#000000' : '#ffffff';
  }

  if (mode === 'colorblind' && colorBlindType) {
    // Transform color for colorblind accessibility
    return transformForColorBlindness(baseColor, colorBlindType);
  }

  return baseColor;
}

/**
 * Transform color for colorblind accessibility
 */
function transformForColorBlindness(
  color: string,
  type: 'protanopia' | 'deuteranopia' | 'tritanopia'
): string {
  // Simplified color transformation - in practice use proper color matrices
  switch (type) {
    case 'protanopia':
      // Red-blind: reduce red channel
      return color.replace(/rgb\((\d+),/, (match, r) => {
        const redValue = parseInt(r);
        return `rgb(${Math.max(0, redValue - 50)},`;
      });
    case 'deuteranopia':
      // Green-blind: adjust green channel
      return color.replace(/rgb\(\d+,(\d+),/, (match, g) => {
        const greenValue = parseInt(g);
        return `rgb(${Math.max(0, greenValue - 30)},`;
      });
    case 'tritanopia':
      // Blue-blind: adjust blue channel
      return color.replace(/rgb\(\d+,\d+,(\d+)\)/, (match, b) => {
        const blueValue = parseInt(b);
        return `rgb(${Math.max(0, blueValue - 20)})`;
      });
    default:
      return color;
  }
}

export default useInclusiveDesign;