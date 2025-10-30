/**
 * Assistive Technology Suite - Main Entry Point
 *
 * Comprehensive accessibility and assistive technology implementation
 * for the mariia-hub luxury beauty and fitness platform.
 *
 * This suite provides:
 * - Voice control and speech recognition
 * - Switch navigation and alternative input methods
 * - Braille display compatibility
 * - Screen magnifier optimization
 * - Voice assistant integration
 * - AI-powered alternative text generation
 * - Real-time captioning for video content
 * - Advanced screen reader optimizations
 */

// Export all assistive technology hooks
export { default as useVoiceControl } from './voice-control';
export { default as useSwitchNavigationControls } from './switch-navigation';
export { default as useBrailleSupport } from './braille-support';
export { default as useScreenMagnifier } from './screen-magnifier';
export { default as useVoiceAssistant } from './voice-assistant-integration';
export { default as useAIAltText } from './ai-alt-text';
export { default as useRealTimeCaptioning } from './real-time-captioning';
export { default as useScreenReaderControls } from './screen-reader-optimizations';

// Export types for TypeScript support
export type {
  VoiceCommand,
  VoiceRecognitionState,
  VoiceFeedbackOptions
} from './voice-control';

export type {
  SwitchConfiguration,
  SwitchGroup,
  ScanElement,
  AlternativeInputMethod,
  DwellState
} from './switch-navigation';

export type {
  BrailleConfiguration,
  BrailleElement,
  BrailleTable,
  BrailleAnnouncement
} from './braille-support';

export type {
  MagnifierConfiguration,
  MagnifierLens,
  MagnifierRegion,
  TextReflowSettings
} from './screen-magnifier';

export type {
  VoiceAssistantAction,
  VoiceAssistantConfig,
  VoiceCommand as AssistantCommand,
  BookingAction
} from './voice-assistant-integration';

export type {
  AltTextConfig,
  AltTextGeneration,
  AltTextValidation,
  ImageContext
} from './ai-alt-text';

export type {
  CaptionConfig,
  Caption,
  CaptionTrack,
  CaptionSession,
  ASRProvider
} from './real-time-captioning';

export type {
  ScreenReaderConfig,
  ScreenReaderAnnouncement,
  NavigationRegion,
  ReadingOrder,
  ProgressIndicator
} from './screen-reader-optimizations';

// Main assistive technology manager class
export class AssistiveTechnologyManager {
  private static instance: AssistiveTechnologyManager;
  private isInitialized = false;

  private constructor() {}

  static getInstance(): AssistiveTechnologyManager {
    if (!AssistiveTechnologyManager.instance) {
      AssistiveTechnologyManager.instance = new AssistiveTechnologyManager();
    }
    return AssistiveTechnologyManager.instance;
  }

  async initialize(): Promise<boolean> {
    if (this.isInitialized) {
      return true;
    }

    try {
      // Detect user preferences and system capabilities
      const capabilities = await this.detectCapabilities();

      // Initialize core systems based on capabilities
      await this.initializeCoreSystems(capabilities);

      // Set up automatic features
      this.setupAutomaticFeatures();

      // Set up event listeners
      this.setupEventListeners();

      this.isInitialized = true;
      console.log('🔧 Assistive Technology Suite initialized successfully');
      return true;

    } catch (error) {
      console.error('❌ Failed to initialize Assistive Technology Suite:', error);
      return false;
    }
  }

  private async detectCapabilities() {
    return {
      hasSpeechRecognition: 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window,
      hasSpeechSynthesis: 'speechSynthesis' in window,
      hasWebAudioAPI: 'AudioContext' in window || 'webkitAudioContext' in window,
      hasGamepadSupport: 'getGamepads' in navigator,
      hasTouchSupport: 'ontouchstart' in window,
      hasHighContrastMode: window.matchMedia('(prefers-contrast: high)').matches,
      prefersReducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
      screenReaderActive: this.detectScreenReader(),
      preferredLanguage: navigator.language || 'pl-PL'
    };
  }

  private async initializeCoreSystems(capabilities: any) {
    // Initialize systems that are always available
    if (capabilities.hasSpeechSynthesis) {
      console.log('🎤 Speech synthesis available');
    }

    if (capabilities.hasWebAudioAPI) {
      console.log('🔊 Web Audio API available');
    }

    // Initialize based on detected capabilities
    if (capabilities.hasSpeechRecognition) {
      console.log('🎙️ Speech recognition available');
    }

    if (capabilities.hasGamepadSupport) {
      console.log('🎮 Gamepad support available');
    }

    if (capabilities.hasTouchSupport) {
      console.log('📱 Touch support available');
    }

    // Check for high contrast mode preference
    if (capabilities.hasHighContrastMode) {
      this.enableHighContrastMode();
    }

    // Respect reduced motion preference
    if (capabilities.prefersReducedMotion) {
      this.enableReducedMotion();
    }
  }

  private setupAutomaticFeatures() {
    // Auto-detect and enable features based on user behavior
    this.setupAutomaticDetection();
  }

  private setupEventListeners() {
    // Listen for preference changes
    this.setupPreferenceListeners();
  }

  private detectScreenReader(): boolean {
    // Common screen reader detection methods
    return (
      !!(window as any).jaws ||
      !!(window as any).nvda ||
      !!(window as any).voiceOver ||
      navigator.userAgent.includes('reader') ||
      document.querySelector('[aria-live]') !== null ||
      window.speechSynthesis?.getVoices().some(voice =>
        voice.name.toLowerCase().includes('screen reader')
      )
    );
  }

  private enableHighContrastMode() {
    document.documentElement.classList.add('high-contrast-mode');
    console.log('🎨 High contrast mode enabled');
  }

  private enableReducedMotion() {
    document.documentElement.classList.add('reduced-motion');
    console.log('🏃 Reduced motion enabled');
  }

  private setupAutomaticDetection() {
    // Observe user interactions to suggest appropriate assistive features
    let keyboardUsageCount = 0;
    let voiceCommandAttempts = 0;

    document.addEventListener('keydown', () => {
      keyboardUsageCount++;

      // If user is primarily using keyboard, suggest enhanced navigation
      if (keyboardUsageCount === 10) {
        this.suggestFeature('keyboard-navigation', 'We noticed you\'re using keyboard navigation. Would you like to enable enhanced keyboard shortcuts?');
      }
    });

    // Monitor for voice input attempts
    document.addEventListener('click', (e) => {
      const target = e.target as HTMLElement;
      if (target.matches('[data-voice-trigger]') || target.closest('[data-voice-region]')) {
        voiceCommandAttempts++;

        if (voiceCommandAttempts === 3) {
          this.suggestFeature('voice-control', 'Would you like to enable voice control for hands-free operation?');
        }
      }
    });
  }

  private setupPreferenceListeners() {
    // Listen for system preference changes
    const mediaQueries = [
      '(prefers-contrast: high)',
      '(prefers-reduced-motion: reduce)',
      '(prefers-color-scheme: dark)',
      '(prefers-color-scheme: light)'
    ];

    mediaQueries.forEach(query => {
      const mediaQuery = window.matchMedia(query);
      mediaQuery.addEventListener('change', (e) => {
        console.log(`🔄 Preference changed: ${query} - ${e.matches}`);
        this.handlePreferenceChange(query, e.matches);
      });
    });
  }

  private handlePreferenceChange(query: string, matches: boolean) {
    switch (query) {
      case '(prefers-contrast: high)':
        if (matches) {
          this.enableHighContrastMode();
        } else {
          document.documentElement.classList.remove('high-contrast-mode');
        }
        break;
      case '(prefers-reduced-motion: reduce)':
        if (matches) {
          this.enableReducedMotion();
        } else {
          document.documentElement.classList.remove('reduced-motion');
        }
        break;
    }
  }

  private suggestFeature(featureType: string, message: string) {
    // Create a subtle suggestion UI
    const suggestion = document.createElement('div');
    suggestion.className = 'assistive-technology-suggestion';
    suggestion.style.cssText = `
      position: fixed;
      bottom: 20px;
      right: 20px;
      background: #007bff;
      color: white;
      padding: 12px 16px;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      z-index: 10001;
      max-width: 300px;
      animation: slideInRight 0.3s ease-out;
    `;

    suggestion.innerHTML = `
      <div style="display: flex; align-items: center; justify-content: space-between; gap: 12px;">
        <span style="font-size: 14px;">${message}</span>
        <button onclick="this.parentElement.parentElement.remove()" style="background: none; border: none; color: white; cursor: pointer; font-size: 18px; line-height: 1;">×</button>
      </div>
    `;

    document.body.appendChild(suggestion);

    // Auto-remove after 10 seconds
    setTimeout(() => {
      if (suggestion.parentElement) {
        suggestion.remove();
      }
    }, 10000);
  }

  // Public API methods
  public getAccessibilityReport() {
    return {
      initialized: this.isInitialized,
      capabilities: this.detectCapabilities(),
      features: {
        voiceControl: !!document.querySelector('[data-voice-control]'),
        screenMagnifier: !!document.querySelector('.magnifier-controls'),
        captions: !!document.querySelector('#real-time-captions'),
        brailleSupport: !!document.querySelector('.braille-region'),
        switchNavigation: !!document.querySelector('.switch-control-panel')
      },
      score: this.calculateAccessibilityScore()
    };
  }

  private calculateAccessibilityScore(): number {
    let score = 0;
    let total = 0;

    // Base accessibility features (30 points)
    total += 30;
    if (document.querySelectorAll('img[alt]').length > 0) score += 10;
    if (document.querySelectorAll('button[aria-label], button[title]').length > 0) score += 10;
    if (document.querySelector('main') || document.querySelector('[role="main"]')) score += 10;

    // Keyboard navigation (20 points)
    total += 20;
    if (document.querySelectorAll('a[href], button, [tabindex]:not([tabindex="-1"])').length > 0) score += 10;
    if (document.querySelector('.skip-link')) score += 10;

    // Screen reader support (20 points)
    total += 20;
    if (document.querySelectorAll('[aria-live], [aria-atomic]').length > 0) score += 10;
    if (document.querySelectorAll('h1, h2, h3, h4, h5, h6').length > 0) score += 10;

    // Visual accessibility (15 points)
    total += 15;
    if (window.matchMedia('(prefers-contrast: high)').matches) score += 8;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) score += 7;

    // Advanced features (15 points)
    total += 15;
    if (document.querySelector('.assistive-technology-hub')) score += 15;

    return Math.round((score / total) * 100);
  }

  public async exportConfiguration() {
    const config = {
      timestamp: new Date().toISOString(),
      userPreferences: {
        highContrast: document.documentElement.classList.contains('high-contrast-mode'),
        reducedMotion: document.documentElement.classList.contains('reduced-motion'),
        preferredLanguage: navigator.language
      },
      features: {
        voiceControl: !!document.querySelector('[data-voice-control]'),
        screenMagnifier: !!document.querySelector('.magnifier-controls'),
        captions: !!document.querySelector('#real-time-captions'),
        brailleSupport: !!document.querySelector('.braille-region'),
        switchNavigation: !!document.querySelector('.switch-control-panel')
      },
      accessibilityScore: this.calculateAccessibilityScore()
    };

    const blob = new Blob([JSON.stringify(config, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'assistive-technology-config.json';
    a.click();
    URL.revokeObjectURL(url);
  }

  public cleanup() {
    // Clean up any created elements and event listeners
    document.querySelectorAll('.assistive-technology-suggestion').forEach(el => el.remove());
    console.log('🧹 Assistive Technology Suite cleaned up');
  }
}

// Export the singleton instance
export const assistiveTechnologyManager = AssistiveTechnologyManager.getInstance();

// Export convenience function for initialization
export const initializeAssistiveTechnology = async () => {
  return await assistiveTechnologyManager.initialize();
};

// Export the main component
export { default as AssistiveTechnologyHub } from '../../components/assistive-technology/AssistiveTechnologyHub';

// Version information
export const ASSISTIVE_TECHNOLOGY_VERSION = '1.0.0';
export const ASSISTIVE_TECHNOLOGY_FEATURES = [
  'voice-control',
  'switch-navigation',
  'braille-support',
  'screen-magnifier',
  'voice-assistant',
  'ai-alt-text',
  'real-time-captioning',
  'screen-reader-optimizations'
] as const;

// Default export
export default {
  // Manager
  assistiveTechnologyManager,
  initializeAssistiveTechnology,

  // Component
  AssistiveTechnologyHub,

  // Hooks
  useVoiceControl,
  useSwitchNavigationControls,
  useBrailleSupport,
  useScreenMagnifier,
  useVoiceAssistant,
  useAIAltText,
  useRealTimeCaptioning,
  useScreenReaderControls,

  // Metadata
  version: ASSISTIVE_TECHNOLOGY_VERSION,
  features: ASSISTIVE_TECHNOLOGY_FEATURES
};