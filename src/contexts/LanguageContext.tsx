import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { changeLanguageWithSideEffects, getCurrentLocaleConfig } from '@/i18n/config';
import { LocaleConfig } from '@/lib/date-localization';

// Language context types
export interface LanguageState {
  currentLanguage: string;
  localeConfig: LocaleConfig;
  isRTL: boolean;
  isLoading: boolean;
  availableLanguages: Language[];
  isChanging: boolean;
  lastChanged: Date | null;
}

export interface Language {
  code: string;
  name: string;
  nativeName: string;
  flag: string;
  rtl: boolean;
  locale: string;
  currency: string;
  isPrimary?: boolean;
}

export interface LanguageContextValue extends LanguageState {
  changeLanguage: (languageCode: string) => Promise<void>;
  detectLanguage: () => string;
  getLocalizedPath: (path: string, lang?: string) => string;
  formatLocalized: (value: any, options?: Intl.DateTimeFormatOptions | Intl.NumberFormatOptions) => string;
  resetToDefault: () => Promise<void>;
  preloadLanguage: (languageCode: string) => Promise<void>;
}

// Available languages with enhanced metadata
const AVAILABLE_LANGUAGES: Language[] = [
  {
    code: 'en',
    name: 'English',
    nativeName: 'English',
    flag: '🇬🇧',
    rtl: false,
    locale: 'en-GB',
    currency: 'PLN',
    isPrimary: false,
  },
  {
    code: 'pl',
    name: 'Polish',
    nativeName: 'Polski',
    flag: '🇵🇱',
    rtl: false,
    locale: 'pl-PL',
    currency: 'PLN',
    isPrimary: true, // Primary market
  },
  {
    code: 'ua',
    name: 'Ukrainian',
    nativeName: 'Українська',
    flag: '🇺🇦',
    rtl: false,
    locale: 'uk-UA',
    currency: 'PLN',
  },
  {
    code: 'ru',
    name: 'Russian',
    nativeName: 'Русский',
    flag: '🇷🇺',
    rtl: false,
    locale: 'ru-RU',
    currency: 'PLN',
  },
];

// Action types
type LanguageAction =
  | { type: 'SET_LANGUAGE'; payload: string }
  | { type: 'CHANGE_START' }
  | { type: 'CHANGE_SUCCESS'; payload: { language: string; config: LocaleConfig } }
  | { type: 'CHANGE_ERROR'; payload: string }
  | { type: 'DETECT_LANGUAGE'; payload: string }
  | { type: 'PRELOAD_START'; payload: string }
  | { type: 'PRELOAD_SUCCESS'; payload: string }
  | { type: 'PRELOAD_ERROR'; payload: { language: string; error: string } };

// Reducer
const languageReducer = (state: LanguageState, action: LanguageAction): LanguageState => {
  switch (action.type) {
    case 'SET_LANGUAGE':
      return {
        ...state,
        currentLanguage: action.payload,
        localeConfig: getCurrentLocaleConfig(),
        isRTL: getCurrentLocaleConfig().rtl,
      };

    case 'CHANGE_START':
      return {
        ...state,
        isChanging: true,
      };

    case 'CHANGE_SUCCESS':
      return {
        ...state,
        currentLanguage: action.payload.language,
        localeConfig: action.payload.config,
        isRTL: action.payload.config.rtl,
        isChanging: false,
        lastChanged: new Date(),
      };

    case 'CHANGE_ERROR':
      return {
        ...state,
        isChanging: false,
      };

    case 'DETECT_LANGUAGE':
      return {
        ...state,
        currentLanguage: action.payload,
        localeConfig: getCurrentLocaleConfig(),
        isRTL: getCurrentLocaleConfig().rtl,
      };

    case 'PRELOAD_START':
    case 'PRELOAD_SUCCESS':
    case 'PRELOAD_ERROR':
      return state; // Preloading doesn't affect state for now

    default:
      return state;
  }
};

// Initial state
const initialState: LanguageState = {
  currentLanguage: 'en',
  localeConfig: getCurrentLocaleConfig(),
  isRTL: false,
  isLoading: true,
  availableLanguages: AVAILABLE_LANGUAGES,
  isChanging: false,
  lastChanged: null,
};

// Context
const LanguageContext = createContext<LanguageContextValue | undefined>(undefined);

// Provider component
export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { i18n } = useTranslation();
  const [state, dispatch] = useReducer(languageReducer, initialState);

  // Detect language on mount
  useEffect(() => {
    const detectedLanguage = detectLanguageFromBrowser();
    dispatch({ type: 'DETECT_LANGUAGE', payload: detectedLanguage });

    // Set i18n language if different
    if (i18n.language !== detectedLanguage) {
      i18n.changeLanguage(detectedLanguage);
    }

    dispatch({ type: 'SET_LANGUAGE', payload: detectedLanguage });
  }, [i18n]);

  // Listen for language changes from other components
  useEffect(() => {
    const handleLanguageChange = (event: CustomEvent) => {
      const { language } = event.detail;
      dispatch({ type: 'SET_LANGUAGE', payload: language });
    };

    window.addEventListener('languageChanged', handleLanguageChange as EventListener);
    return () => {
      window.removeEventListener('languageChanged', handleLanguageChange as EventListener);
    };
  }, []);

  // Change language function
  const changeLanguage = async (languageCode: string): Promise<void> => {
    if (languageCode === state.currentLanguage || state.isChanging) {
      return;
    }

    const language = AVAILABLE_LANGUAGES.find(lang => lang.code === languageCode);
    if (!language) {
      console.error(`Unsupported language: ${languageCode}`);
      return;
    }

    dispatch({ type: 'CHANGE_START' });

    try {
      const newLanguage = await changeLanguageWithSideEffects(languageCode);
      const newConfig = getCurrentLocaleConfig();

      dispatch({
        type: 'CHANGE_SUCCESS',
        payload: { language: newLanguage, config: newConfig }
      });

      // Update i18n instance
      await i18n.changeLanguage(newLanguage);

    } catch (error) {
      console.error('Failed to change language:', error);
      dispatch({ type: 'CHANGE_ERROR', payload: 'Failed to change language' });
      throw error;
    }
  };

  // Detect language from browser preferences
  const detectLanguage = (): string => {
    return detectLanguageFromBrowser();
  };

  // Get localized path
  const getLocalizedPath = (path: string, lang?: string): string => {
    const language = lang || state.currentLanguage;

    // Remove existing language prefix if present
    const cleanPath = path.replace(/^\/(en|pl|ua|ru)\//, '/');

    // Add language prefix if not default language (English)
    if (language !== 'en') {
      return `/${language}${cleanPath}`;
    }

    return cleanPath;
  };

  // Format localized values
  const formatLocalized = (value: any, options?: Intl.DateTimeFormatOptions | Intl.NumberFormatOptions): string => {
    const config = state.localeConfig;

    if (value instanceof Date) {
      return new Intl.DateTimeFormat(config.locale, options as Intl.DateTimeFormatOptions).format(value);
    }

    if (typeof value === 'number') {
      return new Intl.NumberFormat(config.locale, options as Intl.NumberFormatOptions).format(value);
    }

    return String(value);
  };

  // Reset to default language
  const resetToDefault = async (): Promise<void> => {
    await changeLanguage('en');
  };

  // Preload language resources
  const preloadLanguage = async (languageCode: string): Promise<void> => {
    const language = AVAILABLE_LANGUAGES.find(lang => lang.code === languageCode);
    if (!language) {
      console.error(`Cannot preload unsupported language: ${languageCode}`);
      return;
    }

    dispatch({ type: 'PRELOAD_START', payload: languageCode });

    try {
      // Preload i18n resources
      await i18n.loadResources(languageCode);

      dispatch({ type: 'PRELOAD_SUCCESS', payload: languageCode });
    } catch (error) {
      console.error(`Failed to preload language ${languageCode}:`, error);
      dispatch({
        type: 'PRELOAD_ERROR',
        payload: { language: languageCode, error: String(error) }
      });
    }
  };

  // Context value
  const value: LanguageContextValue = {
    ...state,
    changeLanguage,
    detectLanguage,
    getLocalizedPath,
    formatLocalized,
    resetToDefault,
    preloadLanguage,
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};

// Hook for using language context
export const useLanguage = (): LanguageContextValue => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

// Helper function to detect language from browser
function detectLanguageFromBrowser(): string {
  // Try localStorage first
  const stored = localStorage.getItem('preferred-language') ||
                localStorage.getItem('i18nextLng');
  if (stored && AVAILABLE_LANGUAGES.some(lang => lang.code === stored)) {
    return stored;
  }

  // Try navigator language
  const navigatorLang = navigator.language || (navigator as any).userLanguage;
  if (navigatorLang) {
    // Extract language code (e.g., 'en' from 'en-US')
    const langCode = navigatorLang.split('-')[0].toLowerCase();

    // Try exact match first
    if (AVAILABLE_LANGUAGES.some(lang => lang.code === langCode)) {
      return langCode;
    }

    // Try regional variants
    if (navigatorLang === 'pl-PL') return 'pl';
    if (navigatorLang === 'uk-UA') return 'ua';
    if (navigatorLang === 'ru-RU') return 'ru';
    if (navigatorLang.startsWith('en')) return 'en';
  }

  // Check if Polish user (based on timezone)
  try {
    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (timeZone === 'Europe/Warsaw') {
      return 'pl';
    }
  } catch (error) {
    // Ignore timezone errors
  }

  // Default to English
  return 'en';
}

// Export types for external use
export type { LanguageContextValue, Language, LanguageState, LanguageAction };

// Export available languages for external use
export { AVAILABLE_LANGUAGES };