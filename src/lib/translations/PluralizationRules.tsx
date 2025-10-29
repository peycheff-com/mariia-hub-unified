// Pluralization rules for different languages
// Handles complex plural forms for Slavic languages and others

export interface PluralRule {
  (n: number): number;
}

export interface PluralizationConfig {
  rules: PluralRule[];
  categories: string[];
  examples: Record<string, number[]>;
}

// English: 2 forms (singular, plural)
const englishPluralization: PluralizationConfig = {
  rules: [
    (n: number) => (n === 1 ? 0 : 1)
  ],
  categories: ['one', 'other'],
  examples: {
    one: [1],
    other: [0, 2, 3, 4, 5]
  }
};

// Polish: 3 forms (singular, few, many)
const polishPluralization: PluralizationConfig = {
  rules: [
    (n: number) => {
      const tens = Math.floor((n % 100) / 10);
      const ones = n % 10;

      if (ones === 1 && tens !== 1) return 0; // one
      if (ones >= 2 && ones <= 4 && tens !== 1) return 1; // few
      return 2; // many
    }
  ],
  categories: ['one', 'few', 'many'],
  examples: {
    one: [1, 21, 31, 41, 51, 61, 71, 81, 91, 101, 121, 131],
    few: [2, 3, 4, 22, 23, 24, 32, 33, 34, 42, 43, 44, 52, 53, 54],
    many: [0, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20]
  }
};

// Ukrainian: 3 forms (singular, few, many)
const ukrainianPluralization: PluralizationConfig = {
  rules: [
    (n: number) => {
      const tens = Math.floor((n % 100) / 10);
      const ones = n % 10;

      if (ones === 1 && tens !== 1) return 0; // one
      if (ones >= 2 && ones <= 4 && tens !== 1) return 1; // few
      return 2; // many
    }
  ],
  categories: ['one', 'few', 'many'],
  examples: {
    one: [1, 21, 31, 41, 51, 61, 71, 81, 91, 101, 121],
    few: [2, 3, 4, 22, 23, 24, 32, 33, 34, 42, 43, 44],
    many: [0, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20]
  }
};

// Russian: 3 forms (singular, few, many)
const russianPluralization: PluralizationConfig = {
  rules: [
    (n: number) => {
      const tens = Math.floor((n % 100) / 10);
      const ones = n % 10;

      if (ones === 1 && tens !== 1) return 0; // one
      if (ones >= 2 && ones <= 4 && tens !== 1) return 1; // few
      return 2; // many
    }
  ],
  categories: ['one', 'few', 'many'],
  examples: {
    one: [1, 21, 31, 41, 51, 61, 71, 81, 91, 101, 121],
    few: [2, 3, 4, 22, 23, 24, 32, 33, 34, 42, 43, 44],
    many: [0, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20]
  }
};

// Arabic: 6 forms
const arabicPluralization: PluralizationConfig = {
  rules: [
    (n: number) => {
      if (n === 0) return 5; // zero
      if (n === 1) return 0; // one
      if (n === 2) return 1; // two
      if (n >= 3 && n <= 10) return 2; // few (3-10)
      if (n >= 11 && n <= 99) return 3; // many (11-99)
      return 4; // other (100+)
    }
  ],
  categories: ['one', 'two', 'few', 'many', 'other', 'zero'],
  examples: {
    zero: [0],
    one: [1],
    two: [2],
    few: [3, 4, 5, 6, 7, 8, 9, 10],
    many: [11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22],
    other: [100, 101, 102, 200, 300]
  }
};

// Czech: 3 forms
const czechPluralization: PluralizationConfig = {
  rules: [
    (n: number) => {
      if (n === 1) return 0; // one
      if (n >= 2 && n <= 4) return 1; // few
      return 2; // many
    }
  ],
  categories: ['one', 'few', 'many'],
  examples: {
    one: [1],
    few: [2, 3, 4],
    many: [0, 5, 6, 7, 8, 9, 10, 11, 12]
  }
};

// Export pluralization configs by language
export const pluralizationConfigs: Record<string, PluralizationConfig> = {
  en: englishPluralization,
  pl: polishPluralization,
  ua: ukrainianPluralization,
  ru: russianPluralization,
  ar: arabicPluralization,
  cs: czechPluralization,
};

// Get plural form index for a number and language
export function getPluralForm(number: number, language: string): number {
  const config = pluralizationConfigs[language];
  if (!config || !config.rules || config.rules.length === 0) {
    return 1; // Default to plural form
  }

  return config.rules[0](number);
}

// Get plural category name for a number and language
export function getPluralCategory(number: number, language: string): string {
  const config = pluralizationConfigs[language];
  if (!config) return 'other';

  const formIndex = getPluralForm(number, language);
  return config.categories[formIndex] || 'other';
}

// React hook for pluralization
export function usePluralization(language: string) {
  const config = pluralizationConfigs[language] || englishPluralization;

  return {
    pluralize: (count: number, forms: string[]) => {
      const formIndex = getPluralForm(count, language);
      return forms[formIndex] || forms[forms.length - 1] || '';
    },

    getCategory: (count: number) => getPluralCategory(count, language),

    getForms: () => config.categories,

    validate: (count: number, expectedCategory: string) => {
      return getPluralCategory(count, language) === expectedCategory;
    }
  };
}

// Helper function to create pluralized translation keys
export function createPluralizedKey(baseKey: string, count: number, language: string): string {
  const category = getPluralCategory(count, language);
  const suffix = category === 'one' ? '' : `_${category}`;
  return `${baseKey}${suffix}`;
}

// Examples for testing
export const pluralizationTests = {
  en: {
    test: [1, 2, 5],
    expected: ['one', 'other', 'other']
  },
  pl: {
    test: [1, 2, 5, 21, 22, 25],
    expected: ['one', 'few', 'many', 'one', 'few', 'many']
  },
  ua: {
    test: [1, 2, 5, 21, 22, 25],
    expected: ['one', 'few', 'many', 'one', 'few', 'many']
  },
  ru: {
    test: [1, 2, 5, 21, 22, 25],
    expected: ['one', 'few', 'many', 'one', 'few', 'many']
  },
  ar: {
    test: [0, 1, 2, 3, 11, 100],
    expected: ['zero', 'one', 'two', 'few', 'many', 'other']
  }
};

// Validation function
export function validatePluralization(language: string, count: number, category: string): boolean {
  const config = pluralizationConfigs[language];
  if (!config) return false;

  const expectedIndex = config.categories.indexOf(category);
  if (expectedIndex === -1) return false;

  const actualIndex = getPluralForm(count, language);
  return actualIndex === expectedIndex;
}

// Export default config
export default pluralizationConfigs;