import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import { LocaleConfig, localeConfigs } from '@/lib/date-localization';

import en from './locales/en.json';
import pl from './locales/pl.json';
import ua from './locales/ua.json';
import ru from './locales/ru.json';

// Enhanced i18n configuration for luxury beauty & fitness platform
i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    // Resource configuration
    resources: {
      en: {
        translation: en,
        // Support for namespaces for better organization
        common: {
          loading: 'Loading...',
          error: 'Error',
          retry: 'Retry',
          close: 'Close',
          save: 'Save',
          cancel: 'Cancel',
          confirm: 'Confirm',
          edit: 'Edit',
          delete: 'Delete',
          add: 'Add',
          search: 'Search',
          filter: 'Filter',
          sort: 'Sort',
          view: 'View',
          book: 'Book',
          contact: 'Contact',
          more: 'More',
          less: 'Less',
          next: 'Next',
          previous: 'Previous',
          submit: 'Submit',
          back: 'Back',
          continue: 'Continue',
          finish: 'Finish',
          yes: 'Yes',
          no: 'No',
          or: 'Or',
          and: 'And',
          from: 'From',
          to: 'To',
          at: 'At',
          in: 'In',
          on: 'On',
          of: 'Of',
          with: 'With',
          for: 'For',
        }
      },
      pl: {
        translation: pl,
        common: {
          loading: 'Ładowanie...',
          error: 'Błąd',
          retry: 'Spróbuj ponownie',
          close: 'Zamknij',
          save: 'Zapisz',
          cancel: 'Anuluj',
          confirm: 'Potwierdź',
          edit: 'Edytuj',
          delete: 'Usuń',
          add: 'Dodaj',
          search: 'Szukaj',
          filter: 'Filtruj',
          sort: 'Sortuj',
          view: 'Zobacz',
          book: 'Zarezerwuj',
          contact: 'Kontakt',
          more: 'Więcej',
          less: 'Mniej',
          next: 'Następny',
          previous: 'Poprzedni',
          submit: 'Wyślij',
          back: 'Wstecz',
          continue: 'Kontynuuj',
          finish: 'Zakończ',
          yes: 'Tak',
          no: 'Nie',
          or: 'Lub',
          and: 'I',
          from: 'Od',
          to: 'Do',
          at: 'O',
          in: 'W',
          on: 'Na',
          of: '',
          with: 'Z',
          for: 'Dla',
        }
      },
      ua: {
        translation: ua,
        common: {
          loading: 'Завантаження...',
          error: 'Помилка',
          retry: 'Спробувати ще раз',
          close: 'Закрити',
          save: 'Зберегти',
          cancel: 'Скасувати',
          confirm: 'Підтвердити',
          edit: 'Редагувати',
          delete: 'Видалити',
          add: 'Додати',
          search: 'Пошук',
          filter: 'Фільтр',
          sort: 'Сортування',
          view: 'Переглянути',
          book: 'Забронювати',
          contact: 'Контакт',
          more: 'Більше',
          less: 'Менше',
          next: 'Наступний',
          previous: 'Попередній',
          submit: 'Надіслати',
          back: 'Назад',
          continue: 'Продовжити',
          finish: 'Завершити',
          yes: 'Так',
          no: 'Ні',
          or: 'Або',
          and: 'І',
          from: 'Від',
          to: 'До',
          at: 'О',
          in: 'В',
          on: 'На',
          of: '',
          with: 'З',
          for: 'Для',
        }
      },
      ru: {
        translation: ru,
        common: {
          loading: 'Загрузка...',
          error: 'Ошибка',
          retry: 'Повторить',
          close: 'Закрыть',
          save: 'Сохранить',
          cancel: 'Отмена',
          confirm: 'Подтвердить',
          edit: 'Редактировать',
          delete: 'Удалить',
          add: 'Добавить',
          search: 'Поиск',
          filter: 'Фильтр',
          sort: 'Сортировка',
          view: 'Просмотр',
          book: 'Забронировать',
          contact: 'Контакт',
          more: 'Больше',
          less: 'Меньше',
          next: 'Следующий',
          previous: 'Предыдущий',
          submit: 'Отправить',
          back: 'Назад',
          continue: 'Продолжить',
          finish: 'Завершить',
          yes: 'Да',
          no: 'Нет',
          or: 'Или',
          and: 'И',
          from: 'От',
          to: 'До',
          at: 'В',
          in: 'В',
          on: 'На',
          of: '',
          with: 'С',
          for: 'Для',
        }
      },
    },

    // Fallback configuration
    fallbackLng: {
      'default': ['en'],
      'pl': ['en'],
      'ua': ['en'],
      'ru': ['en'],
    },

    // Supported languages with regional variants
    supportedLngs: ['en', 'pl', 'ua', 'ru'],

    // Non-explicit languages to map to supported ones
    nonExplicitSupportedLngs: true,

    // Load configuration
    load: 'languageOnly', // Don't load regional variants like en-US

    // Preload languages for better UX
    preload: ['en', 'pl'], // Preload English and Polish (primary markets)

    // Lowercase language keys
    lowerCaseLng: true,

    // Clean code configuration
    cleanCode: true,

    // Interpolation configuration
    interpolation: {
      escapeValue: false, // React already escapes
      formatSeparator: ',',
      format: function(value, format, lng) {
        if (format === 'uppercase') return value.toUpperCase();
        if (format === 'lowercase') return value.toLowerCase();
        if (format === 'currency') {
          const config = localeConfigs[lng || 'en'];
          return new Intl.NumberFormat(config.locale, {
            style: 'currency',
            currency: config.currency,
          }).format(value);
        }
        if (format === 'date') {
          const config = localeConfigs[lng || 'en'];
          return new Intl.DateTimeFormat(config.locale, config.dateFormat).format(value);
        }
        if (format === 'time') {
          const config = localeConfigs[lng || 'en'];
          return new Intl.DateTimeFormat(config.locale, config.timeFormat).format(value);
        }
        return value;
      },
    },

    // Detection configuration with enhanced strategy
    detection: {
      // Order of detection strategies
      order: [
        'localStorage',        // User preference
        'navigator',           // Browser language
        'htmlTag',            // HTML lang attribute
        'path',               // URL path
        'subdomain',          // Subdomain
      ],

      // Cache user preference
      caches: ['localStorage', 'cookie'],

      // Lookup keys
      lookupLocalStorage: 'i18nextLng',
      lookupCookie: 'i18next',
      lookupFromPathIndex: 0,
      lookupFromSubdomainIndex: 0,

      // Check whitelist
      checkWhitelist: true,
    },

    // Debug mode (disable in production)
    debug: process.env.NODE_ENV === 'development',

    // Missing key handling
    saveMissing: process.env.NODE_ENV === 'development',
    missingKeyHandler: (lng, ns, key, fallbackValue) => {
      if (process.env.NODE_ENV === 'development') {
        console.warn(`Missing translation key: ${key} for language: ${lng} in namespace: ${ns}`);
      }
    },

    // Pluralization
    pluralSeparator: '_',
    contextSeparator: '_',

    // Resources handling
    partialBundledLanguages: true,

    // React integration
    react: {
      useSuspense: false, // Disable suspense for better control
      bindI18n: 'languageChanged',
      bindI18nStore: 'added removed',
      transEmptyNodeValue: '',
      transSupportBasicHtmlNodes: true,
      transKeepBasicHtmlNodesFor: ['br', 'strong', 'i', 'em', 'span'],
    },

    // Performance optimizations
    maxRetries: 5,
    retryTimeout: 350,

    // Language metadata
    lng: undefined, // Will be detected
    fallbackOnNull: true,
    fallbackOnEmpty: true,

    // Namespace configuration
    defaultNS: 'translation',
    ns: ['translation', 'common'],

    // Key separator and nesting
    keySeparator: '.',
    nsSeparator: ':',
    returnEmptyString: false,
    returnNull: false,
    returnObjects: false,

    // Backend configuration (for future API integration)
    backend: {
      // Future: load translations from API
      loadPath: '/locales/{{lng}}/{{ns}}.json',
      addPath: '/locales/add/{{lng}}/{{ns}}',
    },
  });

// Export enhanced i18n instance with additional utilities
export { i18n };

// Helper function to get current locale configuration
export const getCurrentLocaleConfig = (): LocaleConfig => {
  const currentLanguage = i18n.language;
  return localeConfigs[currentLanguage] || localeConfigs.en;
};

// Helper function to format values using current locale
export const formatWithLocale = (value: any, format: string, options?: any) => {
  const lng = i18n.language;
  return i18n.t(format, {
    ...options,
    lng,
    interpolation: {
      format: (val: any, fmt: string) => {
        if (fmt === format) return val;
        return val;
      }
    }
  });
};

// Enhanced language switching with additional side effects
export const changeLanguageWithSideEffects = async (lng: string) => {
  // Store in multiple places for reliability
  localStorage.setItem('i18nextLng', lng);
  localStorage.setItem('preferred-language', lng);
  document.cookie = `i18next=${lng}; path=/; max-age=31536000`; // 1 year

  // Update HTML attributes
  document.documentElement.lang = lng;
  const config = localeConfigs[lng] || localeConfigs.en;
  document.documentElement.dir = config.rtl ? 'rtl' : 'ltr';

  // Update document title if available
  const titleKey = 'meta.title';
  if (i18n.exists(titleKey, { lng })) {
    document.title = i18n.t(titleKey, { lng });
  }

  // Change language
  await i18n.changeLanguage(lng);

  // Dispatch custom event for components
  window.dispatchEvent(new CustomEvent('languageChanged', {
    detail: {
      language: lng,
      locale: config.locale,
      isRTL: config.rtl,
      currency: config.currency
    }
  }));

  return lng;
};

// Export i18n instance as default
export default i18n;
