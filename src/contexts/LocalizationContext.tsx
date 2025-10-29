import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

import LocalizationService from '@/services/LocalizationService';

import { useLocation } from './LocationContext';

interface LocalizationState {
  // Current language and currency
  currentLanguage: string;
  currentCurrency: string;
  userLanguage: string;

  // Configuration
  config: {
    defaultLanguage: string;
    supportedLanguages: Array<{
      code: string;
      name: string;
      flag: string;
      isDefault: boolean;
    }>;
    defaultCurrency: string;
    supportedCurrencies: Array<{
      code: string;
      symbol: string;
      name: string;
      exchangeRate: number;
      isDefault: boolean;
    }>;
    dateFormat: string;
    timeFormat: '12h' | '24h';
    numberFormat: {
      decimal: string;
      thousands: string;
    };
  };

  // Translations
  translations: Record<string, Record<string, string>>;

  // Loading state
  isLoading: boolean;
  error: string | null;
}

interface LocalizationContextType extends LocalizationState {
  // Actions
  setLanguage: (language: string) => void;
  setCurrency: (currency: string) => void;
  detectAndSetUserLanguage: () => void;
  loadCityTranslations: (cityId: string) => Promise<void>;

  // Utilities
  translate: (key: string, fallback?: string) => string;
  formatPrice: (amount: number, currency?: string) => string;
  formatDate: (date: Date) => string;
  formatTime: (time: Date) => string;
  formatNumber: (number: number) => string;
  convertCurrency: (amount: number, toCurrency: string) => Promise<number>;
}

const LocalizationContext = createContext<LocalizationContextType | undefined>(undefined);

interface LocalizationProviderProps {
  children: ReactNode;
  defaultLanguage?: string;
  defaultCurrency?: string;
}

export function LocalizationProvider({
  children,
  defaultLanguage = 'en',
  defaultCurrency = 'PLN'
}: LocalizationProviderProps) {
  const { currentCity } = useLocation();

  const [state, setState] = useState<LocalizationState>({
    currentLanguage: defaultLanguage,
    currentCurrency: defaultCurrency,
    userLanguage: defaultLanguage,
    config: LocalizationService.getDefaultConfig(),
    translations: {},
    isLoading: true,
    error: null
  });

  useEffect(() => {
    initializeLocalization();
  }, [currentCity]);

  const initializeLocalization = async () => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      // Detect user's preferred language
      const detectedLanguage = LocalizationService.detectUserLanguage();

      // Load city-specific configuration if available
      let config;
      if (currentCity) {
        config = await LocalizationService.getLocalizationConfig(currentCity.id);
      } else {
        // Use default configuration
        config = LocalizationService.createCityConfig('PL'); // Default to Poland
      }

      // Set initial language (use detected if supported, otherwise use default)
      const initialLanguage = config.supportedLanguages.find(l => l.code === detectedLanguage)
        ? detectedLanguage
        : config.defaultLanguage;

      // Set initial currency
      const initialCurrency = config.supportedCurrencies.find(c => c.code === defaultCurrency)
        ? defaultCurrency
        : config.defaultCurrency;

      // Load translations for the selected language
      const translations = currentCity
        ? await LocalizationService.getCityTranslations(currentCity.id, initialLanguage)
        : {};

      setState({
        currentLanguage: initialLanguage,
        currentCurrency: initialCurrency,
        userLanguage: detectedLanguage,
        config,
        translations: {
          [initialLanguage]: translations
        },
        isLoading: false,
        error: null
      });
    } catch (error) {
      console.error('Error initializing localization:', error);
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: 'Failed to load localization settings'
      }));
    }
  };

  const setLanguage = (language: string) => {
    setState(prev => ({
      ...prev,
      currentLanguage: language,
      isLoading: true
    }));

    // Load translations for new language if not already loaded
    if (!state.translations[language] && currentCity) {
      LocalizationService.getCityTranslations(currentCity.id, language)
        .then(translations => {
          setState(prev => ({
            ...prev,
            translations: {
              ...prev.translations,
              [language]: translations
            },
            isLoading: false
          }));
        })
        .catch(error => {
          console.error('Error loading translations:', error);
          setState(prev => ({ ...prev, isLoading: false }));
        });
    } else {
      setState(prev => ({ ...prev, isLoading: false }));
    }
  };

  const setCurrency = (currency: string) => {
    setState(prev => ({ ...prev, currentCurrency: currency }));
  };

  const detectAndSetUserLanguage = () => {
    const detectedLanguage = LocalizationService.detectUserLanguage();
    setLanguage(detectedLanguage);
  };

  const loadCityTranslations = async (cityId: string) => {
    setState(prev => ({ ...prev, isLoading: true }));

    try {
      // Load translations for all supported languages
      const translations: Record<string, Record<string, string>> = {};

      for (const lang of state.config.supportedLanguages) {
        translations[lang.code] = await LocalizationService.getCityTranslations(cityId, lang.code);
      }

      setState(prev => ({
        ...prev,
        translations,
        isLoading: false
      }));
    } catch (error) {
      console.error('Error loading city translations:', error);
      setState(prev => ({ ...prev, isLoading: false }));
    }
  };

  const translate = (key: string, fallback?: string): string => {
    if (state.translations[state.currentLanguage] && state.translations[state.currentLanguage][key]) {
      return state.translations[state.currentLanguage][key];
    }

    // Fallback to English if available
    if (state.translations['en'] && state.translations['en'][key]) {
      return state.translations['en'][key];
    }

    // Return fallback or key itself
    return fallback || key;
  };

  const formatPrice = (amount: number, currency?: string): string => {
    return LocalizationService.formatPrice(
      amount,
      currency || state.currentCurrency,
      state.config.defaultLanguage,
      state.config
    );
  };

  const formatDate = (date: Date): string => {
    return LocalizationService.formatDate(
      date,
      currentCity?.id,
      state.config
    );
  };

  const formatTime = (time: Date): string => {
    return LocalizationService.formatTime(
      time,
      currentCity?.id,
      state.config
    );
  };

  const formatNumber = (number: number): string => {
    try {
      return new Intl.NumberFormat(
        LocalizationService.getLocaleForLanguage(state.currentLanguage),
        {
          style: 'decimal',
          minimumFractionDigits: 0,
          maximumFractionDigits: 2,
          useGrouping: true
        }
      ).format(number);
    } catch {
      return number.toString();
    }
  };

  const convertCurrency = async (amount: number, toCurrency: string): Promise<number> => {
      if (toCurrency === state.currentCurrency) {
        return amount;
      }
      return LocalizationService.convertCurrency(amount, state.currentCurrency, toCurrency);
    };

  const value: LocalizationContextType = {
    ...state,
    setLanguage,
    setCurrency,
    detectAndSetUserLanguage,
    loadCityTranslations,
    translate,
    formatPrice,
    formatDate,
    formatTime,
    formatNumber,
    convertCurrency
  };

  return (
    <LocalizationContext.Provider value={value}>
      {children}
    </LocalizationContext.Provider>
  );
}

export function useLocalization(): LocalizationContextType {
  const context = useContext(LocalizationContext);
  if (context === undefined) {
    throw new Error('useLocalization must be used within a LocalizationProvider');
  }
  return context;
}

export default LocalizationContext;