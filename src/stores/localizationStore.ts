import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface LocalizationStore {
  // Region settings
  region: string;
  timezone: string;
  dateFormat: string;
  timeFormat: string;
  numberFormat: string;
  weekStartsOn: number;
  autoDetectRegion: boolean;

  // Language settings
  language: string;
  fallbackLanguage: string;
  rtl: boolean;

  // Cultural settings
  militaryTime: boolean;
  metricUnits: boolean;
  taxInclusive: boolean;

  // Payment settings
  preferredPaymentMethods: string[];

  // Actions
  setRegion: (region: string) => void;
  setTimezone: (timezone: string) => void;
  setDateFormat: (format: string) => void;
  setTimeFormat: (format: string) => void;
  setNumberFormat: (format: string) => void;
  setWeekStartsOn: (day: number) => void;
  setAutoDetectRegion: (enabled: boolean) => void;
  setLanguage: (language: string) => void;
  setFallbackLanguage: (language: string) => void;
  setRTL: (rtl: boolean) => void;
  setMilitaryTime: (enabled: boolean) => void;
  setMetricUnits: (enabled: boolean) => void;
  setTaxInclusive: (enabled: boolean) => void;
  setPreferredPaymentMethods: (methods: string[]) => void;

  // Derived helpers
  getLocale: () => string;
  getTimeZone: () => string;
  isRTL: () => boolean;
}

export const useLocalizationStore = create<LocalizationStore>()(
  persist(
    (set, get) => ({
      // Default region settings (Poland)
      region: 'PL',
      timezone: 'Europe/Warsaw',
      dateFormat: 'DD.MM.YYYY',
      timeFormat: '24h',
      numberFormat: 'pl-PL',
      weekStartsOn: 1, // Monday
      autoDetectRegion: true,

      // Default language settings
      language: 'pl',
      fallbackLanguage: 'en',
      rtl: false,

      // Default cultural settings
      militaryTime: true,
      metricUnits: true,
      taxInclusive: true,

      // Default payment methods
      preferredPaymentMethods: ['card', 'blik'],

      // Actions
      setRegion: (region: string) => set({ region }),
      setTimezone: (timezone: string) => set({ timezone }),
      setDateFormat: (format: string) => set({ dateFormat: format }),
      setTimeFormat: (format: string) => set({ timeFormat: format }),
      setNumberFormat: (format: string) => set({ numberFormat: format }),
      setWeekStartsOn: (day: number) => set({ weekStartsOn: day }),
      setAutoDetectRegion: (enabled: boolean) => set({ autoDetectRegion: enabled }),

      setLanguage: (language: string) => set({ language }),
      setFallbackLanguage: (language: string) => set({ fallbackLanguage: language }),
      setRTL: (rtl: boolean) => set({ rtl }),

      setMilitaryTime: (enabled: boolean) => set({ militaryTime: enabled }),
      setMetricUnits: (enabled: boolean) => set({ metricUnits: enabled }),
      setTaxInclusive: (enabled: boolean) => set({ taxInclusive: enabled }),

      setPreferredPaymentMethods: (methods: string[]) => set({ preferredPaymentMethods: methods }),

      // Derived helpers
      getLocale: () => {
        const { language, numberFormat } = get();
        return numberFormat || getLocaleCode(language);
      },

      getTimeZone: () => {
        const { timezone } = get();
        return timezone || Intl.DateTimeFormat().resolvedOptions().timeZone;
      },

      isRTL: () => {
        const { rtl, language } = get();
        return rtl || isRTLLanguage(language);
      },
    }),
    {
      name: 'localization-store',
    }
  )
);

// Helper function to get locale code from language
function getLocaleCode(language: string): string {
  const localeMap: Record<string, string> = {
    en: 'en-GB',
    pl: 'pl-PL',
    ua: 'uk-UA',
    ru: 'ru-RU',
  };

  return localeMap[language] || 'en-GB';
}

// Helper function to check if language is RTL
function isRTLLanguage(language: string): boolean {
  const rtlLanguages = ['ar', 'he', 'fa', 'ur'];
  return rtlLanguages.includes(language);
}

// Custom hook for easier usage
export const useLocalization = () => {
  const store = useLocalizationStore();

  return {
    ...store,

    // Convenience getters
    currentLocale: store.getLocale(),
    currentTimezone: store.getTimeZone(),
    isRightToLeft: store.isRTL(),

    // Formatters
    formatNumber: (value: number, options?: Intl.NumberFormatOptions) => {
      return new Intl.NumberFormat(store.getLocale(), options).format(value);
    },

    formatCurrency: (value: number, currency: string = 'PLN') => {
      return new Intl.NumberFormat(store.getLocale(), {
        style: 'currency',
        currency,
      }).format(value);
    },

    formatPercent: (value: number) => {
      return new Intl.NumberFormat(store.getLocale(), {
        style: 'percent',
        minimumFractionDigits: 1,
        maximumFractionDigits: 2,
      }).format(value / 100);
    },

    formatDate: (date: Date, options?: Intl.DateTimeFormatOptions) => {
      const defaults: Intl.DateTimeFormatOptions = {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      };

      if (store.militaryTime) {
        defaults.hour = '2-digit';
        defaults.minute = '2-digit';
        defaults.hour12 = false;
      } else {
        defaults.hour = 'numeric';
        defaults.minute = '2-digit';
        defaults.hour12 = true;
      }

      return new Intl.DateTimeFormat(store.getLocale(), {
        ...defaults,
        ...options,
        timeZone: store.getTimeZone(),
      }).format(date);
    },

    formatTime: (date: Date, options?: Intl.DateTimeFormatOptions) => {
      const defaults: Intl.DateTimeFormatOptions = {
        hour: store.militaryTime ? '2-digit' : 'numeric',
        minute: '2-digit',
        hour12: !store.militaryTime,
        timeZone: store.getTimeZone(),
      };

      return new Intl.DateTimeFormat(store.getLocale(), {
        ...defaults,
        ...options,
      }).format(date);
    },

    formatRelativeTime: (value: number, unit: Intl.RelativeTimeFormatUnit) => {
      const rtf = new Intl.RelativeTimeFormat(store.getLocale(), {
        numeric: 'auto',
        style: 'long',
      });

      return rtf.format(value, unit);
    },
  };
};

export default useLocalizationStore;