// Regional Formatting Configuration for Polish Market
// Optimized for luxury beauty & fitness platform in Warsaw

import { LocaleConfig, localeConfigs } from './date-localization';

export interface RegionalFormatConfig {
  locale: string;
  currency: {
    code: string;
    symbol: string;
    position: 'before' | 'after';
    decimalSeparator: string;
    thousandsSeparator: string;
  };
  date: {
    formats: {
      short: Intl.DateTimeFormatOptions;
      medium: Intl.DateTimeFormatOptions;
      long: Intl.DateTimeFormatOptions;
      full: Intl.DateTimeFormatOptions;
      time: Intl.DateTimeFormatOptions;
      dateTime: Intl.DateTimeFormatOptions;
    };
    timezone: string;
    firstDayOfWeek: number; // 0 = Sunday, 1 = Monday
    weekendDays: number[];
  };
  number: {
    decimal: Intl.NumberFormatOptions;
    percent: Intl.NumberFormatOptions;
    currency: Intl.NumberFormatOptions;
  };
  address: {
    format: string;
    postalCodeFormat: string;
    countryFirst: boolean;
  };
  phone: {
    countryCode: string;
    format: string;
    internationalFormat: string;
  };
  business: {
    workingHours: {
      week: number[]; // Monday = 1, Friday = 5
      startHour: number;
      endHour: number;
    };
    lunchBreak?: {
      startHour: number;
      endHour: number;
    };
    holidays: string[]; // ISO date strings
  };
  units: {
    temperature: 'C' | 'F';
    distance: 'km' | 'mi';
    weight: 'kg' | 'lb';
  };
}

// Polish regional configuration (primary market)
const polishConfig: RegionalFormatConfig = {
  locale: 'pl-PL',
  currency: {
    code: 'PLN',
    symbol: 'zł',
    position: 'after',
    decimalSeparator: ',',
    thousandsSeparator: ' ',
  },
  date: {
    formats: {
      short: { day: '2-digit', month: '2-digit', year: 'numeric' }, // DD.MM.YYYY
      medium: { day: 'numeric', month: 'long', year: 'numeric' }, // D MMMM YYYY
      long: { day: 'numeric', month: 'long', year: 'numeric', weekday: 'long' }, // D MMMM YYYY, dddd
      full: {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        weekday: 'long',
        hour: '2-digit',
        minute: '2-digit'
      },
      time: { hour: '2-digit', minute: '2-digit', hour12: false }, // HH:MM
      dateTime: {
        dateStyle: 'medium',
        timeStyle: 'short'
      },
    },
    timezone: 'Europe/Warsaw',
    firstDayOfWeek: 1, // Monday
    weekendDays: [6, 0], // Saturday, Sunday
  },
  number: {
    decimal: {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    },
    percent: {
      style: 'percent',
      minimumFractionDigits: 1,
      maximumFractionDigits: 1,
    },
    currency: {
      style: 'currency',
      currency: 'PLN',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    },
  },
  address: {
    format: '{{street}} {{number}}\n{{postalCode}} {{city}}\n{{country}}',
    postalCodeFormat: 'XX-XXX',
    countryFirst: false,
  },
  phone: {
    countryCode: '+48',
    format: 'XXX XXX XXX', // Mobile: 123 456 789
    internationalFormat: '+48 XXX XXX XXX',
  },
  business: {
    workingHours: {
      week: [1, 2, 3, 4, 5], // Monday to Friday
      startHour: 9,
      endHour: 20,
    },
    lunchBreak: {
      startHour: 13,
      endHour: 14,
    },
    holidays: [
      // Polish holidays (YYYY format for year independence)
      '01-01', // New Year's Day
      '01-06', // Epiphany
      // Easter dates vary - handled dynamically
      '05-01', // Labor Day
      '05-03', // Constitution Day
      '08-15', // Assumption of Mary
      '11-01', // All Saints' Day
      '11-11', // Independence Day
      '12-25', // Christmas Day
      '12-26', // Boxing Day
    ],
  },
  units: {
    temperature: 'C',
    distance: 'km',
    weight: 'kg',
  },
};

// English (UK) configuration for international clients
const englishConfig: RegionalFormatConfig = {
  locale: 'en-GB',
  currency: {
    code: 'PLN',
    symbol: 'PLN',
    position: 'before',
    decimalSeparator: '.',
    thousandsSeparator: ',',
  },
  date: {
    formats: {
      short: { day: '2-digit', month: 'short', year: 'numeric' }, // DD MMM YYYY
      medium: { day: 'numeric', month: 'short', year: 'numeric' }, // D MMM YYYY
      long: { day: 'numeric', month: 'long', year: 'numeric', weekday: 'long' }, // D MMMM YYYY, dddd
      full: {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        weekday: 'long',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      },
      time: { hour: '2-digit', minute: '2-digit', hour12: false }, // HH:MM
      dateTime: {
        dateStyle: 'medium',
        timeStyle: 'short'
      },
    },
    timezone: 'Europe/Warsaw',
    firstDayOfWeek: 1, // Monday (European style)
    weekendDays: [6, 0], // Saturday, Sunday
  },
  number: {
    decimal: {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    },
    percent: {
      style: 'percent',
      minimumFractionDigits: 1,
      maximumFractionDigits: 1,
    },
    currency: {
      style: 'currency',
      currency: 'PLN',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    },
  },
  address: {
    format: '{{street}} {{number}}\n{{city}}\n{{postalCode}}\n{{country}}',
    postalCodeFormat: 'XX-XXX',
    countryFirst: false,
  },
  phone: {
    countryCode: '+48',
    format: 'XXX XXX XXX',
    internationalFormat: '+48 XXX XXX XXX',
  },
  business: {
    workingHours: {
      week: [1, 2, 3, 4, 5], // Monday to Friday
      startHour: 9,
      endHour: 20,
    },
    lunchBreak: {
      startHour: 13,
      endHour: 14,
    },
    holidays: polishConfig.business.holidays, // Same holidays as Poland
  },
  units: {
    temperature: 'C',
    distance: 'km',
    weight: 'kg',
  },
};

// Ukrainian configuration
const ukrainianConfig: RegionalFormatConfig = {
  locale: 'uk-UA',
  currency: {
    code: 'PLN',
    symbol: 'zł',
    position: 'after',
    decimalSeparator: ',',
    thousandsSeparator: ' ',
  },
  date: {
    formats: {
      short: { day: '2-digit', month: '2-digit', year: 'numeric' }, // DD.MM.YYYY
      medium: { day: 'numeric', month: 'long', year: 'numeric' }, // D MMMM YYYY
      long: { day: 'numeric', month: 'long', year: 'numeric', weekday: 'long' }, // D MMMM YYYY, dddd
      full: {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        weekday: 'long',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      },
      time: { hour: '2-digit', minute: '2-digit', hour12: false }, // HH:MM
      dateTime: {
        dateStyle: 'medium',
        timeStyle: 'short'
      },
    },
    timezone: 'Europe/Warsaw',
    firstDayOfWeek: 1, // Monday
    weekendDays: [6, 0], // Saturday, Sunday
  },
  number: {
    decimal: {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    },
    percent: {
      style: 'percent',
      minimumFractionDigits: 1,
      maximumFractionDigits: 1,
    },
    currency: {
      style: 'currency',
      currency: 'PLN',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    },
  },
  address: {
    format: '{{street}} {{number}}\n{{postalCode}} {{city}}\n{{country}}',
    postalCodeFormat: 'XX-XXX',
    countryFirst: false,
  },
  phone: {
    countryCode: '+48',
    format: 'XXX XXX XXX',
    internationalFormat: '+48 XXX XXX XXX',
  },
  business: {
    workingHours: {
      week: [1, 2, 3, 4, 5], // Monday to Friday
      startHour: 9,
      endHour: 20,
    },
    lunchBreak: {
      startHour: 13,
      endHour: 14,
    },
    holidays: polishConfig.business.holidays,
  },
  units: {
    temperature: 'C',
    distance: 'km',
    weight: 'kg',
  },
};

// Russian configuration
const russianConfig: RegionalFormatConfig = {
  locale: 'ru-RU',
  currency: {
    code: 'PLN',
    symbol: 'zł',
    position: 'after',
    decimalSeparator: ',',
    thousandsSeparator: ' ',
  },
  date: {
    formats: {
      short: { day: '2-digit', month: '2-digit', year: 'numeric' }, // DD.MM.YYYY
      medium: { day: 'numeric', month: 'long', year: 'numeric' }, // D MMMM YYYY
      long: { day: 'numeric', month: 'long', year: 'numeric', weekday: 'long' }, // D MMMM YYYY, dddd
      full: {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        weekday: 'long',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      },
      time: { hour: '2-digit', minute: '2-digit', hour12: false }, // HH:MM
      dateTime: {
        dateStyle: 'medium',
        timeStyle: 'short'
      },
    },
    timezone: 'Europe/Warsaw',
    firstDayOfWeek: 1, // Monday
    weekendDays: [6, 0], // Saturday, Sunday
  },
  number: {
    decimal: {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    },
    percent: {
      style: 'percent',
      minimumFractionDigits: 1,
      maximumFractionDigits: 1,
    },
    currency: {
      style: 'currency',
      currency: 'PLN',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    },
  },
  address: {
    format: '{{street}} {{number}}\n{{postalCode}} {{city}}\n{{country}}',
    postalCodeFormat: 'XX-XXX',
    countryFirst: false,
  },
  phone: {
    countryCode: '+48',
    format: 'XXX XXX XXX',
    internationalFormat: '+48 XXX XXX XXX',
  },
  business: {
    workingHours: {
      week: [1, 2, 3, 4, 5], // Monday to Friday
      startHour: 9,
      endHour: 20,
    },
    lunchBreak: {
      startHour: 13,
      endHour: 14,
    },
    holidays: polishConfig.business.holidays,
  },
  units: {
    temperature: 'C',
    distance: 'km',
    weight: 'kg',
  },
};

// Regional configuration registry
export const regionalConfigs: Record<string, RegionalFormatConfig> = {
  'pl': polishConfig,
  'en': englishConfig,
  'ua': ukrainianConfig,
  'ru': russianConfig,
};

// Regional formatter class
export class RegionalFormatter {
  private config: RegionalFormatConfig;

  constructor(language: string = 'pl') {
    this.config = regionalConfigs[language] || polishConfig;
  }

  // Currency formatting
  formatCurrency(amount: number, options?: Intl.NumberFormatOptions): string {
    const formatter = new Intl.NumberFormat(this.config.locale, {
      ...this.config.number.currency,
      ...options,
    });
    return formatter.format(amount);
  }

  // Price display with proper symbol positioning
  formatPrice(amount: number, showSymbol: boolean = true): string {
    const formattedAmount = new Intl.NumberFormat(this.config.locale, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);

    if (!showSymbol) return formattedAmount;

    const { symbol, position } = this.config.currency;
    const separator = position === 'before' ? '' : ' ';

    return position === 'before'
      ? `${symbol}${separator}${formattedAmount}`
      : `${formattedAmount}${separator}${symbol}`;
  }

  // Date formatting
  formatDate(date: Date, format: keyof RegionalFormatConfig['date']['formats'] = 'medium'): string {
    const options = this.config.date.formats[format];
    return new Intl.DateTimeFormat(this.config.locale, options).format(date);
  }

  formatTime(date: Date): string {
    return new Intl.DateTimeFormat(this.config.locale, this.config.date.formats.time).format(date);
  }

  formatDateTime(date: Date): string {
    return new Intl.DateTimeFormat(this.config.locale, this.config.date.formats.dateTime).format(date);
  }

  // Relative time formatting
  formatRelativeTime(value: number, unit: Intl.RelativeTimeFormatUnit): string {
    const rtf = new Intl.RelativeTimeFormat(this.config.locale, {
      numeric: 'auto',
      style: 'long',
    });
    return rtf.format(value, unit);
  }

  // Duration formatting (service duration, etc.)
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
      'pl': this.getPolishPlural(hours, ['godzina', 'godziny', 'godzin']),
      'en': hours === 1 ? 'hour' : 'hours',
      'ua': this.getSlavicPlural(hours, ['година', 'години', 'годин']),
      'ru': this.getSlavicPlural(hours, ['час', 'часа', 'часов']),
    };
    return labels[this.config.locale.split('-')[0] as keyof typeof labels] || 'hours';
  }

  private getMinutesLabel(minutes: number): string {
    const labels = {
      'pl': this.getPolishPlural(minutes, ['minuta', 'minuty', 'minut']),
      'en': minutes === 1 ? 'minute' : 'minutes',
      'ua': this.getSlavicPlural(minutes, ['хвилина', 'хвилини', 'хвилин']),
      'ru': this.getSlavicPlural(minutes, ['минута', 'минуты', 'минут']),
    };
    return labels[this.config.locale.split('-')[0] as keyof typeof labels] || 'minutes';
  }

  private getPolishPlural(num: number, forms: [string, string, string]): string {
    const tens = Math.floor((num % 100) / 10);
    const ones = num % 10;
    if (ones === 1 && tens !== 1) return forms[0];
    if (ones >= 2 && ones <= 4 && tens !== 1) return forms[1];
    return forms[2];
  }

  private getSlavicPlural(num: number, forms: [string, string, string]): string {
    const tens = Math.floor((num % 100) / 10);
    const ones = num % 10;
    if (ones === 1 && tens !== 1) return forms[0];
    if (ones >= 2 && ones <= 4 && tens !== 1) return forms[1];
    return forms[2];
  }

  // Number formatting
  formatNumber(number: number, options?: Intl.NumberFormatOptions): string {
    return new Intl.NumberFormat(this.config.locale, {
      ...this.config.number.decimal,
      ...options,
    }).format(number);
  }

  formatPercent(number: number): string {
    return new Intl.NumberFormat(this.config.locale, this.config.number.percent).format(number);
  }

  // Address formatting
  formatAddress(address: {
    street: string;
    number: string;
    postalCode: string;
    city: string;
    country: string;
  }): string {
    const { format } = this.config.address;
    return format
      .replace('{{street}}', address.street)
      .replace('{{number}}', address.number)
      .replace('{{postalCode}}', address.postalCode)
      .replace('{{city}}', address.city)
      .replace('{{country}}', address.country);
  }

  // Phone number formatting
  formatPhoneNumber(phone: string, international: boolean = false): string {
    // Remove all non-numeric characters
    const clean = phone.replace(/\D/g, '');

    // Add country code if missing
    const withCountry = clean.startsWith('48') ? clean : `48${clean}`;

    const format = international
      ? this.config.phone.internationalFormat
      : this.config.phone.format;

    let formatted = format;
    formatted = formatted.replace('XXX', withCountry.substring(0, 3));
    formatted = formatted.replace('XXX', withCountry.substring(3, 6));
    formatted = formatted.replace('XXX', withCountry.substring(6, 9));

    return formatted;
  }

  // Business hours formatting
  formatBusinessHours(): string {
    const { workingHours, lunchBreak } = this.config.business;
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

    return days.map(day => {
      let hours = `${workingHours.startHour}:00 - ${workingHours.endHour}:00`;

      if (lunchBreak) {
        hours = `${workingHours.startHour}:00 - ${lunchBreak.startHour}:00, ${lunchBreak.endHour}:00 - ${workingHours.endHour}:00`;
      }

      return `${day}: ${hours}`;
    }).join('\n');
  }

  // Holiday checking
  isHoliday(date: Date): boolean {
    const dateStr = `${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

    // Check fixed holidays
    if (this.config.business.holidays.includes(dateStr)) {
      return true;
    }

    // Check Easter (simplified - would need proper calculation for production)
    // This is a placeholder - proper Easter calculation required
    const year = date.getFullYear();
    const easter = this.calculateEaster(year);
    if (easter && date.toDateString() === easter.toDateString()) {
      return true;
    }

    // Check Easter Monday
    const easterMonday = easter ? new Date(easter.getTime() + 24 * 60 * 60 * 1000) : null;
    if (easterMonday && date.toDateString() === easterMonday.toDateString()) {
      return true;
    }

    return false;
  }

  // Corpus Christi (60 days after Easter)
  isCorpusChristi(date: Date): boolean {
    const year = date.getFullYear();
    const easter = this.calculateEaster(year);
    if (!easter) return false;

    const corpusChristi = new Date(easter.getTime() + 60 * 24 * 60 * 60 * 1000);
    return date.toDateString() === corpusChristi.toDateString();
  }

  private calculateEaster(year: number): Date | null {
    // Simplified Easter calculation - proper algorithm needed for production
    // This is a placeholder implementation
    const a = year % 19;
    const b = Math.floor(year / 100);
    const c = year % 100;
    const d = Math.floor(b / 4);
    const e = b % 4;
    const f = Math.floor((b + 8) / 25);
    const g = Math.floor((b - f + 1) / 3);
    const h = (19 * a + b - d - g + 15) % 30;
    const i = Math.floor(c / 4);
    const k = c % 4;
    const l = (32 + 2 * e + 2 * i - h - k) % 7;
    const m = Math.floor((a + 11 * h + 22 * l) / 451);
    const month = Math.floor((h + l - 7 * m + 114) / 31);
    const day = ((h + l - 7 * m + 114) % 31) + 1;

    return new Date(year, month - 1, day);
  }

  // Get configuration
  get config(): RegionalFormatConfig {
    return this.config;
  }
}

// Convenience functions
export function createRegionalFormatter(language: string): RegionalFormatter {
  return new RegionalFormatter(language);
}

export function formatPriceLocalized(
  amount: number,
  language: string,
  showSymbol: boolean = true
): string {
  return createRegionalFormatter(language).formatPrice(amount, showSymbol);
}

export function formatDateLocalized(
  date: Date,
  language: string,
  format?: keyof RegionalFormatConfig['date']['formats']
): string {
  return createRegionalFormatter(language).formatDate(date, format);
}

export function formatDurationLocalized(
  minutes: number,
  language: string
): string {
  return createRegionalFormatter(language).formatDuration(minutes);
}

// Export configurations
export { polishConfig, englishConfig, ukrainianConfig, russianConfig };