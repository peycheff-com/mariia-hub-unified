// Comprehensive i18n utilities - main entry point for all internationalization needs

import { useTranslation } from 'react-i18next';
import { useMemo } from 'react';

import { createLocalizer, type DateLocalizer } from './date-localization';
import { getEmailTemplate, getSMSTemplate } from './email-templates';
import { RTLSupport, useRTLSupport } from './rtl-support';
import { i18nValidator, useTranslationValidation } from './i18n-validation';

// Main i18n hook that combines all utilities
export function useI18n() {
  const { t, i18n } = useTranslation();

  // Memoize expensive operations
  const dateLocalizer = useMemo(() => createLocalizer(i18n.language), [i18n.language]);
  const rtlSupport = useRTLSupport(i18n.language);
  const translationValidation = useTranslationValidation();

  return {
    // Base i18n
    t,
    i18n,
    currentLanguage: i18n.language,
    changeLanguage: i18n.changeLanguage,

    // Date/time utilities
    dateLocalizer,
    formatDate: (date: Date, options?: Intl.DateTimeFormatOptions) =>
      dateLocalizer.formatDate(date, options),
    formatTime: (date: Date, options?: Intl.DateTimeFormatOptions) =>
      dateLocalizer.formatTime(date, options),
    formatDateTime: (date: Date, options?: Intl.DateTimeFormatOptions) =>
      dateLocalizer.formatDateTime(date, options),
    formatDuration: (minutes: number) => dateLocalizer.formatDuration(minutes),
    formatTimeAgo: (date: Date) => dateLocalizer.formatTimeAgo(date),
    formatCurrency: (amount: number, currency?: string) =>
      dateLocalizer.formatCurrency(amount, currency),

    // RTL support
    isRTL: rtlSupport.isRTL,
    textDirection: rtlSupport.isRTL ? 'rtl' : 'ltr',
    textAlign: rtlSupport.textAlign,
    fontFamily: rtlSupport.fontFamily,
    shouldMirrorIcons: rtlSupport.shouldMirrorIcons,

    // Translation validation
    validate: translationValidation.validate,
    getReport: translationValidation.getReport,
    getMissing: translationValidation.getMissing,
    testKey: translationValidation.testKey,

    // Template utilities
    getEmailTemplate: (type: string, data?: any) => getEmailTemplate(i18n.language, type, data),
    getSMSTemplate: (type: string, data?: any) => getSMSTemplate(i18n.language, type, data),

    // Language info
    getLanguageInfo: () => ({
      code: i18n.language,
      name: getLanguageName(i18n.language),
      nativeName: getNativeLanguageName(i18n.language),
      flag: getLanguageFlag(i18n.language),
      isRTL: rtlSupport.isRTL,
    }),
  };
}

// Language metadata
export const languages = [
  {
    code: 'en',
    name: 'English',
    nativeName: 'English',
    flag: '🇬🇧',
    rtl: false,
    locale: 'en-GB',
    currency: 'PLN',
  },
  {
    code: 'pl',
    name: 'Polish',
    nativeName: 'Polski',
    flag: '🇵🇱',
    rtl: false,
    locale: 'pl-PL',
    currency: 'PLN',
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

// Helper functions
export function getLanguageName(code: string): string {
  return languages.find(lang => lang.code === code)?.name || code;
}

export function getNativeLanguageName(code: string): string {
  return languages.find(lang => lang.code === code)?.nativeName || code;
}

export function getLanguageFlag(code: string): string {
  return languages.find(lang => lang.code === code)?.flag || '🌐';
}

export function getLanguageLocale(code: string): string {
  return languages.find(lang => lang.code === code)?.locale || 'en-GB';
}

export function getLanguageCurrency(code: string): string {
  return languages.find(lang => lang.code === code)?.currency || 'PLN';
}

// Validation utilities
export function validateTranslations() {
  return i18nValidator.validateAll();
}

export function getTranslationReport() {
  return i18nValidator.getCompletionReport();
}

export function getMissingTranslations(language: string) {
  return i18nValidator.generateMissingKeys(language);
}

// Advanced formatting utilities
export class AdvancedFormatter {
  private localizer: DateLocalizer;
  private language: string;

  constructor(language: string) {
    this.language = language;
    this.localizer = createLocalizer(language);
  }

  // Format booking information
  formatBookingInfo(booking: {
    serviceName: string;
    date: Date;
    duration: number;
    amount?: number;
    currency?: string;
    location?: string;
  }) {
    return {
      service: booking.serviceName,
      date: this.localizer.formatDateTime(booking.date),
      duration: this.localizer.formatDuration(booking.duration),
      amount: booking.amount ?
        this.localizer.formatCurrency(booking.amount, booking.currency) :
        undefined,
      location: booking.location || 'ul. Smolna 8, Warszawa',
    };
  }

  // Format business hours
  formatBusinessHours(hours: { [key: string]: string }) {
    return this.localizer.formatBusinessHours(hours);
  }

  // Format price range
  formatPriceRange(min: number, max: number, currency?: string) {
    const formattedMin = this.localizer.formatCurrency(min, currency);
    const formattedMax = this.localizer.formatCurrency(max, currency);
    return min === max ? formattedMin : `${formattedMin} - ${formattedMax}`;
  }

  // Format appointment reminder
  formatAppointmentReminder(appointment: {
    serviceName: string;
    date: Date;
    userName: string;
  }) {
    const timeAgo = this.localizer.formatTimeAgo(new Date());
    const appointmentDate = this.localizer.formatDateTime(appointment.date);

    return {
      title: this.getTranslation('booking.reminder.title'),
      greeting: this.getTranslation('booking.reminder.greeting', { name: appointment.userName }),
      message: this.getTranslation('booking.reminder.message', {
        service: appointment.serviceName,
        date: appointmentDate,
      }),
      timeAgo,
    };
  }

  // Format contact information
  formatContactInfo(contact: {
    phone?: string;
    email?: string;
    address?: string;
    hours?: { [key: string]: string };
  }) {
    return {
      phone: contact.phone || '+48 536 200 573',
      email: contact.email || 'info@bmbeautystudio.pl',
      address: contact.address || 'ul. Smolna 8, Warszawa, Poland',
      hours: contact.hours ? this.formatBusinessHours(contact.hours) : undefined,
    };
  }

  private getTranslation(key: string, params?: Record<string, any>): string {
    // This would use the actual i18n instance
    // For now, return a placeholder
    return key;
  }
}

// React hook for advanced formatting
export function useAdvancedFormatter() {
  const { currentLanguage } = useI18n();

  return useMemo(() => new AdvancedFormatter(currentLanguage), [currentLanguage]);
}

// SEO utilities for i18n
export function getLocalizedSEOTags(language: string, basePath: string = '') {
  const languageInfo = languages.find(lang => lang.code === language);

  return {
    language: language,
    locale: languageInfo?.locale || 'en-GB',
    direction: RTLSupport.isRTLLanguage(language) ? 'rtl' : 'ltr',
    alternateLinks: languages.map(lang => ({
      language: lang.code,
      url: `${basePath}${lang.code === 'en' ? '' : '/' + lang.code}`,
    })),
    ogLocale: languageInfo?.locale || 'en-GB',
  };
}

// URL utilities for i18n
export function getLocalizedUrl(path: string, language: string): string {
  const isDefaultLanguage = language === 'en';
  const prefix = isDefaultLanguage ? '' : `/${language}`;
  return `${prefix}${path}`;
}

export function getLanguageFromPath(path: string): string {
  const segments = path.split('/').filter(Boolean);
  const possibleLanguage = segments[0];

  if (languages.some(lang => lang.code === possibleLanguage)) {
    return possibleLanguage;
  }

  return 'en'; // Default language
}

// Analytics utilities
export function trackLanguageChange(oldLanguage: string, newLanguage: string) {
  // Track language change events
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', 'language_change', {
      old_language: oldLanguage,
      new_language: newLanguage,
    });
  }
}

export function trackTranslationUsage(key: string, language: string) {
  // Track which translation keys are used
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', 'translation_usage', {
      translation_key: key,
      language: language,
    });
  }
}

// Development utilities
export function enableI18nDevTools() {
  if (import.meta.env.DEV) {
    // Add i18n debugging to window
    (window as any).__I18N_DEV__ = {
      validate: validateTranslations,
      getReport: getTranslationReport,
      getMissing: getMissingTranslations,
      languages,
      RTLSupport,
    };
  }
}

// Export everything conveniently
export {
  // Core utilities
  createLocalizer,
  formatDateLocalized,
  formatTimeLocalized,
  formatDateTimeLocalized,
  formatCurrencyLocalized,
  formatDurationLocalized,

  // Template utilities
  getEmailTemplate,
  getSMSTemplate,

  // RTL support
  RTLSupport,
  isRTLLanguage,

  // Validation
  i18nValidator,

  // React hooks
  useI18n,
  useTranslationValidation,
  useRTLSupport,
  useAdvancedFormatter,
};

// Default export
export default {
  useI18n,
  validateTranslations,
  getTranslationReport,
  getMissingTranslations,
  languages,
  AdvancedFormatter,
  RTLSupport,
  enableI18nDevTools,
};