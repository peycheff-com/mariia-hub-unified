// Comprehensive date/time localization utilities

export interface LocaleConfig {
  code: string;
  locale: string;
  rtl: boolean;
  dateFormat: Intl.DateTimeFormatOptions;
  timeFormat: Intl.DateTimeFormatOptions;
  dateTimeFormat: Intl.DateTimeFormatOptions;
  shortDate: Intl.DateTimeFormatOptions;
  longDate: Intl.DateTimeFormatOptions;
  relativeTime: Intl.RelativeTimeFormatOptions;
  currency: string;
  numberFormat: Intl.NumberFormatOptions;
}

export const localeConfigs: Record<string, LocaleConfig> = {
  en: {
    code: 'en',
    locale: 'en-GB',
    rtl: false,
    dateFormat: {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    },
    timeFormat: {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    },
    dateTimeFormat: {
      dateStyle: 'full',
      timeStyle: 'short',
    },
    shortDate: {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    },
    longDate: {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    },
    relativeTime: {
      numeric: 'auto',
      style: 'long',
    },
    currency: 'PLN',
    numberFormat: {
      style: 'decimal',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    },
  },
  pl: {
    code: 'pl',
    locale: 'pl-PL',
    rtl: false,
    dateFormat: {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    },
    timeFormat: {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    },
    dateTimeFormat: {
      dateStyle: 'full',
      timeStyle: 'short',
    },
    shortDate: {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    },
    longDate: {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    },
    relativeTime: {
      numeric: 'auto',
      style: 'long',
    },
    currency: 'PLN',
    numberFormat: {
      style: 'decimal',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    },
  },
  ua: {
    code: 'ua',
    locale: 'uk-UA',
    rtl: false,
    dateFormat: {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    },
    timeFormat: {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    },
    dateTimeFormat: {
      dateStyle: 'full',
      timeStyle: 'short',
    },
    shortDate: {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    },
    longDate: {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    },
    relativeTime: {
      numeric: 'auto',
      style: 'long',
    },
    currency: 'PLN',
    numberFormat: {
      style: 'decimal',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    },
  },
  ru: {
    code: 'ru',
    locale: 'ru-RU',
    rtl: false,
    dateFormat: {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    },
    timeFormat: {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    },
    dateTimeFormat: {
      dateStyle: 'full',
      timeStyle: 'short',
    },
    shortDate: {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    },
    longDate: {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    },
    relativeTime: {
      numeric: 'auto',
      style: 'long',
    },
    currency: 'PLN',
    numberFormat: {
      style: 'decimal',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    },
  },
};

// Main localization helper class
export class DateLocalizer {
  private config: LocaleConfig;

  constructor(language: string = 'en') {
    this.config = localeConfigs[language] || localeConfigs.en;
  }

  // Getters
  get locale(): string {
    return this.config.locale;
  }

  get isRTL(): boolean {
    return this.config.rtl;
  }

  get currency(): string {
    return this.config.currency;
  }

  // Date formatting methods
  formatDate(date: Date, options?: Intl.DateTimeFormatOptions): string {
    const formatOptions = { ...this.config.dateFormat, ...options };
    return new Intl.DateTimeFormat(this.config.locale, formatOptions).format(date);
  }

  formatTime(date: Date, options?: Intl.DateTimeFormatOptions): string {
    const formatOptions = { ...this.config.timeFormat, ...options };
    return new Intl.DateTimeFormat(this.config.locale, formatOptions).format(date);
  }

  formatDateTime(date: Date, options?: Intl.DateTimeFormatOptions): string {
    const formatOptions = { ...this.config.dateTimeFormat, ...options };
    return new Intl.DateTimeFormat(this.config.locale, formatOptions).format(date);
  }

  formatShortDate(date: Date): string {
    return new Intl.DateTimeFormat(this.config.locale, this.config.shortDate).format(date);
  }

  formatLongDate(date: Date): string {
    return new Intl.DateTimeFormat(this.config.locale, this.config.longDate).format(date);
  }

  // Relative time formatting
  formatRelativeTime(value: number, unit: Intl.RelativeTimeFormatUnit): string {
    const rtf = new Intl.RelativeTimeFormat(this.config.locale, this.config.relativeTime);
    return rtf.format(value, unit);
  }

  formatTimeAgo(date: Date): string {
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) {
      return this.formatRelativeTime(-diffInSeconds, 'second');
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return this.formatRelativeTime(-minutes, 'minute');
    } else if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      return this.formatRelativeTime(-hours, 'hour');
    } else if (diffInSeconds < 2592000) {
      const days = Math.floor(diffInSeconds / 86400);
      return this.formatRelativeTime(-days, 'day');
    } else if (diffInSeconds < 31536000) {
      const months = Math.floor(diffInSeconds / 2592000);
      return this.formatRelativeTime(-months, 'month');
    } else {
      const years = Math.floor(diffInSeconds / 31536000);
      return this.formatRelativeTime(-years, 'year');
    }
  }

  // Duration formatting
  formatDuration(minutes: number): string {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;

    if (hours === 0) {
      return `${mins} ${this.getMinutesLabel(mins)}`;
    } else if (mins === 0) {
      return `${hours} ${this.getHoursLabel(hours)}`;
    } else {
      return `${hours} ${this.getHoursLabel(hours)} ${mins} ${this.getMinutesLabel(mins)}`;
    }
  }

  private getHoursLabel(hours: number): string {
    const labels = {
      en: hours === 1 ? 'hour' : 'hours',
      pl: this.getPolishLabel(hours, ['godzina', 'godziny', 'godzin']),
      ua: this.getUkrainianLabel(hours, ['година', 'години', 'годин']),
      ru: this.getRussianLabel(hours, ['час', 'часа', 'часов']),
    };
    return labels[this.config.code as keyof typeof labels] || 'hours';
  }

  private getMinutesLabel(minutes: number): string {
    const labels = {
      en: minutes === 1 ? 'minute' : 'minutes',
      pl: this.getPolishLabel(minutes, ['minuta', 'minuty', 'minut']),
      ua: this.getUkrainianLabel(minutes, ['хвилина', 'хвилини', 'хвилин']),
      ru: this.getRussianLabel(minutes, ['минута', 'минуты', 'минут']),
    };
    return labels[this.config.code as keyof typeof labels] || 'minutes';
  }

  private getPolishLabel(num: number, forms: [string, string, string]): string {
    const tens = Math.floor((num % 100) / 10);
    const ones = num % 10;

    if (ones === 1 && tens !== 1) return forms[0];
    if (ones >= 2 && ones <= 4 && tens !== 1) return forms[1];
    return forms[2];
  }

  private getUkrainianLabel(num: number, forms: [string, string, string]): string {
    const tens = Math.floor((num % 100) / 10);
    const ones = num % 10;

    if (ones === 1 && tens !== 1) return forms[0];
    if (ones >= 2 && ones <= 4 && tens !== 1) return forms[1];
    return forms[2];
  }

  private getRussianLabel(num: number, forms: [string, string, string]): string {
    const tens = Math.floor((num % 100) / 10);
    const ones = num % 10;

    if (ones === 1 && tens !== 1) return forms[0];
    if (ones >= 2 && ones <= 4 && tens !== 1) return forms[1];
    return forms[2];
  }

  // Number and currency formatting
  formatNumber(number: number, options?: Intl.NumberFormatOptions): string {
    const formatOptions = { ...this.config.numberFormat, ...options };
    return new Intl.NumberFormat(this.config.locale, formatOptions).format(number);
  }

  formatCurrency(amount: number, currency?: string): string {
    return new Intl.NumberFormat(this.config.locale, {
      style: 'currency',
      currency: currency || this.config.currency,
    }).format(amount);
  }

  // Week day names
  getWeekdayName(date: Date, style: 'long' | 'short' | 'narrow' = 'long'): string {
    return new Intl.DateTimeFormat(this.config.locale, { weekday: style }).format(date);
  }

  // Month names
  getMonthName(date: Date, style: 'long' | 'short' | 'narrow' = 'long'): string {
    return new Intl.DateTimeFormat(this.config.locale, { month: style }).format(date);
  }

  // Business hours formatting
  formatBusinessHours(hours: { [key: string]: string }): string {
    const dayNames = {
      mon: this.getWeekdayName(new Date(2024, 0, 1), 'short'),
      tue: this.getWeekdayName(new Date(2024, 0, 2), 'short'),
      wed: this.getWeekdayName(new Date(2024, 0, 3), 'short'),
      thu: this.getWeekdayName(new Date(2024, 0, 4), 'short'),
      fri: this.getWeekdayName(new Date(2024, 0, 5), 'short'),
      sat: this.getWeekdayName(new Date(2024, 0, 6), 'short'),
      sun: this.getWeekdayName(new Date(2024, 0, 7), 'short'),
    };

    return Object.entries(hours)
      .map(([day, time]) => `${dayNames[day as keyof typeof dayNames]}: ${time}`)
      .join('\n');
  }
}

// Convenience functions
export function createLocalizer(language: string): DateLocalizer {
  return new DateLocalizer(language);
}

export function formatDateLocalized(
  date: Date,
  language: string,
  options?: Intl.DateTimeFormatOptions
): string {
  return createLocalizer(language).formatDate(date, options);
}

export function formatTimeLocalized(
  date: Date,
  language: string,
  options?: Intl.DateTimeFormatOptions
): string {
  return createLocalizer(language).formatTime(date, options);
}

export function formatDateTimeLocalized(
  date: Date,
  language: string,
  options?: Intl.DateTimeFormatOptions
): string {
  return createLocalizer(language).formatDateTime(date, options);
}

export function formatCurrencyLocalized(
  amount: number,
  language: string,
  currency?: string
): string {
  return createLocalizer(language).formatCurrency(amount, currency);
}

export function formatDurationLocalized(minutes: number, language: string): string {
  return createLocalizer(language).formatDuration(minutes);
}

export function isRTLLanguage(language: string): boolean {
  return localeConfigs[language]?.rtl || false;
}

// React hook for easy usage
export function useDateLocalization(language: string) {
  return createLocalizer(language);
}