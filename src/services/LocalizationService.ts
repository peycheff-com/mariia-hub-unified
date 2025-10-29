import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';

export interface LocalizationConfig {
  cityId: string;
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
  translations: Record<string, Record<string, string>>;
}

interface CityLocalization {
  cityId: string;
  language: string;
  translations: {
    [key: string]: string;
  };
  customFields: Record<string, any>;
}

interface CountryConfig {
  countryCode: string;
  defaultLanguage: string;
  currency: string;
  dateFormat: string;
  numberFormat: {
    decimal: string;
    thousands: string;
  };
}

class LocalizationService {
  private static cache = new Map<string, LocalizationConfig>();
  private static CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  /**
   * Get localization configuration for a city
   */
  static async getLocalizationConfig(cityId: string): Promise<LocalizationConfig | null> {
    const cacheKey = `loc_config_${cityId}`;

    // Check cache first
    if (this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey)!;
      if (Date.now() - cached.timestamp < this.CACHE_TTL) {
        return cached.data;
      }
    }

    try {
      // Get city data
      const { data: city } = await supabase
        .from('cities')
        .select('localization_config')
        .eq('id', cityId)
        .single();

      if (!city || !city.localization_config) {
        // Return default configuration
        const defaultConfig = this.getDefaultConfig();
        this.cache.set(cacheKey, {
          data: defaultConfig,
          timestamp: Date.now()
        });
        return defaultConfig;
      }

      const config: LocalizationConfig = {
        cityId,
        ...city.localization_config,
        defaultLanguage: city.localization_config.defaultLanguage || 'en',
        supportedLanguages: city.localization_config.supportedLanguages || [
          { code: 'en', name: 'English', flag: '🇬🇧', isDefault: true }
        ],
        defaultCurrency: city.localization_config.defaultCurrency || 'PLN',
        supportedCurrencies: city.localization_config.supportedCurrencies || [
          { code: 'PLN', symbol: 'zł', name: 'Polish Złoty', exchangeRate: 1, isDefault: true }
        ],
        dateFormat: city.localization_config.dateFormat || 'DD.MM.YYYY',
        timeFormat: city.localization_config.timeFormat || '24h',
        numberFormat: city.localization_config.numberFormat || {
          decimal: ',',
          thousands: ' '
        },
        translations: city.localization_config.translations || {}
      };

      // Cache the result
      this.cache.set(cacheKey, {
        data: config,
        timestamp: Date.now()
      });

      return config;
    } catch (error) {
      logger.error('Error getting localization config:', error);
      return this.getDefaultConfig();
    }
  }

  /**
   * Get city-specific translations
   */
  static async getCityTranslations(
    cityId: string,
    language: string
  ): Promise<Record<string, string>> {
    try {
      const { data } = await supabase
        .from('city_localization')
        .select('translations')
        .eq('city_id', cityId)
        .eq('language', language)
        .single();

      if (data) {
        return data.translations;
      }

      // Fallback to base translations
      const config = await this.getLocalizationConfig(cityId);
      return config.translations[language] || {};
    } catch (error) {
      logger.error('Error getting city translations:', error);
      return {};
    }
  }

  /**
   * Update localization configuration for a city
   */
  static async updateLocalizationConfig(
    cityId: string,
    config: Partial<LocalizationConfig>
  ): Promise<void> {
    try {
      const { error } = await supabase
        .from('cities')
        .update({
          localization_config: config
        })
        .eq('id', cityId);

      if (error) throw error;

      // Clear cache
      this.cache.delete(`loc_config_${cityId}`);
    } catch (error) {
      logger.error('Error updating localization config:', error);
      throw error;
    }
  }

  /**
   * Add/update city translation
   */
  static async updateCityTranslation(
    cityId: string,
    language: string,
    translations: Record<string, string>
  ): Promise<void> {
    try {
      const { error } = await supabase
        .from('city_localization')
        .upsert({
          city_id: cityId,
          language,
          translations,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'city_id,language'
        });

      if (error) throw error;
    } catch (error) {
      logger.error('Error updating city translation:', error);
      throw error;
    }
  }

  /**
   * Get exchange rate for currency
   */
  static async getExchangeRate(fromCurrency: string, toCurrency: string): Promise<number> {
    // In production, this would fetch from a real exchange rate API
    // For now, using static rates
    const rates: Record<string, number> = {
      'PLN-EUR': 0.22,
      'PLN-USD': 0.25,
      'PLN-GBP': 0.20,
      'EUR-PLN': 4.5,
      'USD-PLN': 4.0,
      'GBP-PLN': 5.0
    };

    const key = `${fromCurrency}-${toCurrency}`;
    const reverseKey = `${toCurrency}-${fromCurrency}`;

    return rates[key] || rates[reverseKey] || 1;
  }

  /**
   * Format price with currency and locale
   */
  static formatPrice(
    amount: number,
    currency: string,
    locale: string = 'pl-PL',
    config?: LocalizationConfig
  ): string {
    try {
      return new Intl.NumberFormat(locale, {
        style: 'currency',
        currency: currency,
        minimumFractionDigits: 0,
        maximumFractionDigits: 2
      }).format(amount);
    } catch (error) {
      // Fallback formatting
      const currencySymbol = this.getCurrencySymbol(currency);
      return `${currencySymbol}${amount.toFixed(2)}`;
    }
  }

  /**
   * Format date according to locale
   */
  static formatDate(
    date: Date,
    cityId?: string,
    config?: LocalizationConfig
  ): string {
    try {
      if (config) {
        const locale = this.getLocaleForLanguage(config.defaultLanguage);
        return new Intl.DateTimeFormat(locale, {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit'
        }).format(date);
      }

      // Default formatting
      return date.toLocaleDateString('pl-PL');
    } catch (error) {
      return date.toLocaleDateString();
    }
  }

  /**
   * Format time according to locale and 12/24h preference
   */
  static formatTime(
    time: Date,
    cityId?: string,
    config?: LocalizationConfig
  ): string {
    try {
      if (config) {
        const locale = this.getLocaleForLanguage(config.defaultLanguage);
        const hour12 = config.timeFormat === '12h';

        return new Intl.DateTimeFormat(locale, {
          hour: '2-digit',
          minute: '2-digit',
          hour12: hour12,
          hourCycle: hour12 ? 'h12' : 'h23'
        }).format(time);
      }

      // Default formatting
      return time.toLocaleTimeString();
    } catch (error) {
      return time.toLocaleTimeString();
    }
  }

  /**
   * Get currency symbol
   */
  static getCurrencySymbol(currency: string): string {
    const symbols: Record<string, string> = {
      'PLN': 'zł',
      'EUR': '€',
      'USD': '$',
      'GBP': '£',
      'CHF': 'CHF',
      'SEK': 'kr',
      'NOK': 'kr',
      'DKK': 'kr',
      'CZK': 'Kč',
      'HUF': 'Ft'
    };

    return symbols[currency] || currency;
  }

  /**
   * Get locale code for language
   */
  static getLocaleForLanguage(language: string): string {
    const locales: Record<string, string> = {
      'en': 'en-US',
      'pl': 'pl-PL',
      'de': 'de-DE',
      'fr': 'fr-FR',
      'es': 'es-ES',
      'it': 'it-IT',
      'uk': 'uk-UA',
      'ru': 'ru-RU'
    };

    return locales[language] || 'en-US';
  }

  /**
   * Detect user's preferred language from browser
   */
  static detectUserLanguage(): string {
    // Get browser language
    const browserLanguage = navigator.language.split('-')[0];

    // Check if it's a supported language
    const supportedLanguages = ['en', 'pl', 'de', 'fr', 'es', 'it', 'uk', 'ru'];

    if (supportedLanguages.includes(browserLanguage)) {
      return browserLanguage;
    }

    // Try to get language from accept-languages header
    const acceptLanguages = navigator.languages || [];
    for (const lang of acceptLanguages) {
      const langCode = lang.split('-')[0];
      if (supportedLanguages.includes(langCode)) {
        return langCode;
      }
    }

    // Fallback to English
    return 'en';
  }

  /**
   * Get country-specific configuration
   */
  static getCountryConfig(countryCode: string): CountryConfig {
    const configs: Record<string, CountryConfig> = {
      'PL': {
        countryCode: 'PL',
        defaultLanguage: 'pl',
        currency: 'PLN',
        dateFormat: 'DD.MM.YYYY',
        numberFormat: {
          decimal: ',',
          thousands: ' '
        }
      },
      'US': {
        countryCode: 'US',
        defaultLanguage: 'en',
        currency: 'USD',
        dateFormat: 'MM/DD/YYYY',
        numberFormat: {
          decimal: '.',
          thousands: ','
        }
      },
      'GB': {
        countryCode: 'GB',
        defaultLanguage: 'en',
        currency: 'GBP',
        dateFormat: 'DD/MM/YYYY',
        numberFormat: {
          decimal: '.',
          thousands: ','
        }
      },
      'DE': {
        countryCode: 'DE',
        defaultLanguage: 'de',
        currency: 'EUR',
        dateFormat: 'DD.MM.YYYY',
        numberFormat: {
          decimal: ',',
          thousands: '.'
        }
      },
      'FR': {
        countryCode: 'FR',
        defaultLanguage: 'fr',
        currency: 'EUR',
        dateFormat: 'DD/MM/YYYY',
        numberFormat: {
          decimal: ',',
          thousands: ' '
        }
      }
    };

    return configs[countryCode] || configs['PL'];
  }

  /**
   * Convert amount between currencies
   */
  static async convertCurrency(
    amount: number,
    fromCurrency: string,
    toCurrency: string
  ): Promise<number> {
      if (fromCurrency === toCurrency) {
        return amount;
      }

      const rate = await this.getExchangeRate(fromCurrency, toCurrency);
      return amount * rate;
  }

  /**
   * Get default localization configuration
   */
  private static getDefaultConfig(): LocalizationConfig {
    return {
      cityId: 'default',
      defaultLanguage: 'en',
      supportedLanguages: [
        { code: 'en', name: 'English', flag: '🇬🇧', isDefault: true },
        { code: 'pl', name: 'Polski', flag: '🇵🇱', isDefault: false }
      ],
      defaultCurrency: 'PLN',
      supportedCurrencies: [
        { code: 'PLN', symbol: 'zł', name: 'Polish Złoty', exchangeRate: 1, isDefault: true },
        { code: 'EUR', symbol: '€', name: 'Euro', exchangeRate: 4.5, isDefault: false },
        { code: 'USD', symbol: '$', name: 'US Dollar', exchangeRate: 4.0, isDefault: false }
      ],
      dateFormat: 'DD.MM.YYYY',
      timeFormat: '24h',
      numberFormat: {
        decimal: ',',
        thousands: ' '
      },
      translations: {}
    };
  }

  /**
   * Clear localization cache
   */
  static clearCache(): void {
    this.cache.clear();
  }

  /**
   * Create comprehensive localization config for a city
   */
  static createCityConfig(countryCode: string): LocalizationConfig {
    const countryConfig = this.getCountryConfig(countryCode);

    const languages: Array<{
      code: string;
      name: string;
      flag: string;
      isDefault: boolean;
    }> = [
      { code: countryConfig.defaultLanguage, name: this.getLanguageName(countryConfig.defaultLanguage), flag: this.getLanguageFlag(countryConfig.defaultLanguage), isDefault: true }
    ];

    // Add additional languages based on country
    if (countryCode === 'PL') {
      languages.push({ code: 'en', name: 'English', flag: '🇬🇧', isDefault: false });
    } else if (countryCode === 'US') {
      languages.push({ code: 'es', name: 'Spanish', flag: '🇪🇸', isDefault: false });
    } else if (countryCode === 'DE') {
      languages.push({ code: 'en', name: 'English', flag: '🇬🇧', isDefault: false });
    }

    const currencies: Array<{
      code: string;
      symbol: string;
      name: string;
      exchangeRate: number;
      isDefault: boolean;
    }> = [
      { code: countryConfig.currency, symbol: this.getCurrencySymbol(countryConfig.currency), name: this.getCurrencyName(countryConfig.currency), exchangeRate: 1, isDefault: true }
    ];

    // Add common additional currencies
    if (countryConfig.currency !== 'EUR') {
      currencies.push({ code: 'EUR', symbol: '€', name: 'Euro', exchangeRate: 4.5, isDefault: false });
    }
    if (countryConfig.currency !== 'USD') {
      currencies.push({ code: 'USD', symbol: '$', name: 'US Dollar', exchangeRate: 4.0, isDefault: false });
    }

    return {
      cityId: 'default',
      defaultLanguage: countryConfig.defaultLanguage,
      supportedLanguages: languages,
      defaultCurrency: countryConfig.currency,
      supportedCurrencies: currencies,
      dateFormat: countryConfig.dateFormat,
      timeFormat: countryConfig.dateFormat.includes('12') ? '12h' : '24h',
      numberFormat: countryConfig.numberFormat,
      translations: {}
    };
  }

  /**
   * Get language name in English
   */
  private static getLanguageName(languageCode: string): string {
    const names: Record<string, string> = {
      'en': 'English',
      'pl': 'Polish',
      'de': 'German',
      'fr': 'French',
      'es': 'Spanish',
      'it': 'Italian',
      'uk': 'Ukrainian',
      'ru': 'Russian'
    };

    return names[languageCode] || languageCode;
  }

  /**
   * Get language flag emoji
   */
  private static getLanguageFlag(languageCode: string): string {
    const flags: Record<string, string> = {
      'en': '🇬🇧',
      'pl': '🇵🇱',
      'de': '🇩🇪',
      'fr': '🇫🇷',
      'es': '🇪🇸',
      'it': '🇮🇹',
      'uk': '🇺🇦',
      'ru': '🇷🇺'
    };

    return flags[languageCode] || '🌍';
  }

  /**
   * Get currency name
   */
  private static getCurrencyName(currencyCode: string): string {
    const names: Record<string, string> = {
      'PLN': 'Polish Złoty',
      'EUR': 'Euro',
      'USD': 'US Dollar',
      'GBP': 'British Pound',
      'CHF': 'Swiss Franc',
      'SEK': 'Swedish Krona',
      'NOK': 'Norwegian Krone',
      'DKK': 'Danish Krone',
      'CZK': 'Czech Koruna',
      'HUF': 'Hungarian Forint'
    };

    return names[currencyCode] || currencyCode;
  }
}

export default LocalizationService;