// i18n validation and testing utilities

import i18n from '@/i18n/config';
import en from '@/i18n/locales/en.json';
import pl from '@/i18n/locales/pl.json';
import ua from '@/i18n/locales/ua.json';
import ru from '@/i18n/locales/ru.json';

export interface TranslationKey {
  path: string[];
  value: any;
  type: 'string' | 'object' | 'array';
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  missingKeys: MissingKey[];
  stats: TranslationStats;
}

export interface ValidationError {
  type: 'missing' | 'type_mismatch' | 'empty_value' | 'invalid_interpolation';
  language: string;
  key: string;
  message: string;
  severity: 'error' | 'warning';
}

export interface ValidationWarning {
  type: 'long_string' | 'suspicious_translation' | 'html_tags' | 'inconsistent_placeholders';
  language: string;
  key: string;
  message: string;
}

export interface MissingKey {
  language: string;
  key: string;
  referenceValue?: any;
}

export interface TranslationStats {
  totalKeys: number;
  translatedKeys: { [language: string]: number };
  completionPercentage: { [language: string]: number };
  averageKeyLength: { [language: string]: number };
}

class I18nValidator {
  private languages = {
    en,
    pl,
    ua,
    ru,
  };

  private baseLanguage = 'en';

  /**
   * Validate all translations against the base language (English)
   */
  validateAll(): ValidationResult {
    const baseTranslations = this.languages[this.baseLanguage as keyof typeof this.languages];
    const baseKeys = this.getAllKeys(baseTranslations, []);

    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];
    const missingKeys: MissingKey[] = [];

    const stats: TranslationStats = {
      totalKeys: baseKeys.length,
      translatedKeys: {},
      completionPercentage: {},
      averageKeyLength: {},
    };

    // Validate each language
    Object.entries(this.languages).forEach(([lang, translations]) => {
      if (lang === this.baseLanguage) return;

      const langKeys = this.getAllKeys(translations, []);
      const langKeyPaths = new Set(langKeys.map(k => k.path.join('.')));

      let translatedCount = 0;
      let totalLength = 0;

      // Check for missing keys
      baseKeys.forEach(baseKey => {
        const keyPath = baseKey.path.join('.');
        const langValue = this.getNestedValue(translations, baseKey.path);

        if (langValue === undefined) {
          missingKeys.push({
            language: lang,
            key: keyPath,
            referenceValue: baseKey.value,
          });
          errors.push({
            type: 'missing',
            language: lang,
            key: keyPath,
            message: `Missing translation for key: ${keyPath}`,
            severity: 'error',
          });
        } else {
          translatedCount++;

          // Calculate length for strings
          if (typeof langValue === 'string') {
            totalLength += langValue.length;
          }

          // Validate type consistency
          if (typeof langValue !== typeof baseKey.value) {
            errors.push({
              type: 'type_mismatch',
              language: lang,
              key: keyPath,
              message: `Type mismatch: expected ${typeof baseKey.value}, got ${typeof langValue}`,
              severity: 'error',
            });
          }

          // Validate empty strings
          if (typeof langValue === 'string' && langValue.trim() === '') {
            warnings.push({
              type: 'empty_value',
              language: lang,
              key: keyPath,
              message: `Empty translation for key: ${keyPath}`,
            });
          }

          // Validate interpolation variables
          if (typeof langValue === 'string' && typeof baseKey.value === 'string') {
            const basePlaceholders = this.extractPlaceholders(baseKey.value);
            const langPlaceholders = this.extractPlaceholders(langValue);

            if (basePlaceholders.length !== langPlaceholders.length) {
              warnings.push({
                type: 'inconsistent_placeholders',
                language: lang,
                key: keyPath,
                message: `Placeholder count mismatch: base has ${basePlaceholders.length}, translation has ${langPlaceholders.length}`,
              });
            }
          }

          // Validate suspicious translations
          if (typeof langValue === 'string' && typeof baseKey.value === 'string') {
            if (langValue === baseKey.value && lang.length > 5) {
              warnings.push({
                type: 'suspicious_translation',
                language: lang,
                key: keyPath,
                message: 'Translation appears to be identical to base language',
              });
            }
          }

          // Check for long strings
          if (typeof langValue === 'string' && langValue.length > 200) {
            warnings.push({
              type: 'long_string',
              language: lang,
              key: keyPath,
              message: `Long translation (${langValue.length} characters)`,
            });
          }

          // Check for HTML tags in translations
          if (typeof langValue === 'string' && /<[^>]*>/.test(langValue)) {
            warnings.push({
              type: 'html_tags',
              language: lang,
              key: keyPath,
              message: 'HTML tags detected in translation',
            });
          }
        }
      });

      // Check for extra keys in translation
      langKeys.forEach(langKey => {
        const keyPath = langKey.path.join('.');
        if (!baseKeys.some(baseKey => baseKey.path.join('.') === keyPath)) {
          warnings.push({
            type: 'suspicious_translation',
            language: lang,
            key: keyPath,
            message: `Extra key not found in base language: ${keyPath}`,
          });
        }
      });

      // Update stats
      stats.translatedKeys[lang] = translatedCount;
      stats.completionPercentage[lang] = Math.round((translatedCount / baseKeys.length) * 100);
      stats.averageKeyLength[lang] = Math.round(totalLength / translatedCount);
    });

    // Add stats for base language
    const baseLength = baseKeys.reduce((acc, key) =>
      acc + (typeof key.value === 'string' ? key.value.length : 0), 0
    );
    stats.translatedKeys[this.baseLanguage] = baseKeys.length;
    stats.completionPercentage[this.baseLanguage] = 100;
    stats.averageKeyLength[this.baseLanguage] = Math.round(baseLength / baseKeys.length);

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      missingKeys,
      stats,
    };
  }

  /**
   * Get all translation keys recursively
   */
  private getAllKeys(obj: any, path: string[]): TranslationKey[] {
    const keys: TranslationKey[] = [];

    if (obj === null || obj === undefined) return keys;

    if (typeof obj === 'object' && !Array.isArray(obj)) {
      Object.entries(obj).forEach(([key, value]) => {
        const currentPath = [...path, key];

        if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
          keys.push(...this.getAllKeys(value, currentPath));
        } else {
          keys.push({
            path: currentPath,
            value,
            type: Array.isArray(value) ? 'array' : typeof value,
          });
        }
      });
    } else if (Array.isArray(obj)) {
      obj.forEach((item, index) => {
        const currentPath = [...path, index.toString()];
        if (typeof item === 'object' && item !== null) {
          keys.push(...this.getAllKeys(item, currentPath));
        } else {
          keys.push({
            path: currentPath,
            value: item,
            type: 'string',
          });
        }
      });
    } else {
      keys.push({
        path,
        value: obj,
        type: typeof obj,
      });
    }

    return keys;
  }

  /**
   * Get nested value by path
   */
  private getNestedValue(obj: any, path: string[]): any {
    return path.reduce((current, key) => current?.[key], obj);
  }

  /**
   * Extract interpolation placeholders from a string
   */
  private extractPlaceholders(str: string): string[] {
    const matches = str.match(/\{\{([^}]+)\}\}/g);
    return matches ? matches.map(match => match.slice(2, -2)) : [];
  }

  /**
   * Check if translation keys are properly structured
   */
  validateStructure(): ValidationError[] {
    const errors: ValidationError[] = [];

    Object.entries(this.languages).forEach(([lang, translations]) => {
      const requiredSections = ['nav', 'hero', 'common'];

      requiredSections.forEach(section => {
        if (!translations[section]) {
          errors.push({
            type: 'missing',
            language: lang,
            key: section,
            message: `Missing required section: ${section}`,
            severity: 'error',
          });
        }
      });
    });

    return errors;
  }

  /**
   * Get translation completion report
   */
  getCompletionReport(): string {
    const validation = this.validateAll();

    let report = `📊 Translation Completion Report\n`;
    report += `=====================================\n\n`;

    report += `📈 Overall Statistics:\n`;
    report += `Total translation keys: ${validation.stats.totalKeys}\n\n`;

    report += `🌍 Language Coverage:\n`;
    Object.entries(validation.stats.completionPercentage).forEach(([lang, percentage]) => {
      const translated = validation.stats.translatedKeys[lang];
      const avgLength = validation.stats.averageKeyLength[lang];
      const flag = this.getLanguageFlag(lang);
      report += `${flag} ${lang.toUpperCase()}: ${percentage}% (${translated}/${validation.stats.totalKeys} keys, avg: ${avgLength} chars)\n`;
    });

    if (validation.errors.length > 0) {
      report += `\n❌ Errors (${validation.errors.length}):\n`;
      validation.errors.slice(0, 10).forEach(error => {
        report += `  • ${error.language.toUpperCase()}: ${error.key} - ${error.message}\n`;
      });
      if (validation.errors.length > 10) {
        report += `  ... and ${validation.errors.length - 10} more errors\n`;
      }
    }

    if (validation.warnings.length > 0) {
      report += `\n⚠️ Warnings (${validation.warnings.length}):\n`;
      validation.warnings.slice(0, 10).forEach(warning => {
        report += `  • ${warning.language.toUpperCase()}: ${warning.key} - ${warning.message}\n`;
      });
      if (validation.warnings.length > 10) {
        report += `  ... and ${validation.warnings.length - 10} more warnings\n`;
      }
    }

    report += `\n✅ Status: ${validation.isValid ? 'VALID' : 'NEEDS ATTENTION'}\n`;

    return report;
  }

  /**
   * Get language flag emoji
   */
  private getLanguageFlag(language: string): string {
    const flags = {
      en: '🇬🇧',
      pl: '🇵🇱',
      ua: '🇺🇦',
      ru: '🇷🇺',
    };
    return flags[language as keyof typeof flags] || '🌐';
  }

  /**
   * Test translation interpolation
   */
  testInterpolation(key: string, values: Record<string, any>): { [language: string]: string } {
    const results: { [language: string]: string } = {};

    Object.entries(this.languages).forEach(([lang, translations]) => {
      try {
        const template = this.getNestedValue(translations, key.split('.'));
        if (typeof template === 'string') {
          results[lang] = this.interpolate(template, values);
        } else {
          results[lang] = `[ERROR: Not a string template]`;
        }
      } catch (error) {
        results[lang] = `[ERROR: ${error instanceof Error ? error.message : 'Unknown error'}]`;
      }
    });

    return results;
  }

  /**
   * Simple string interpolation
   */
  private interpolate(template: string, values: Record<string, any>): string {
    return template.replace(/\{\{([^}]+)\}\}/g, (match, key) => {
      return values[key.trim()] !== undefined ? String(values[key.trim()]) : match;
    });
  }

  /**
   * Generate missing translation keys for a language
   */
  generateMissingKeys(language: string): { [key: string]: any } {
    if (language === this.baseLanguage) return {};

    const baseTranslations = this.languages[this.baseLanguage as keyof typeof this.languages];
    const targetTranslations = this.languages[language as keyof typeof this.languages];
    const missing: { [key: string]: any } = {};

    const processObject = (base: any, target: any, prefix: string = '') => {
      Object.entries(base).forEach(([key, value]) => {
        const fullKey = prefix ? `${prefix}.${key}` : key;

        if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
          if (!target[key]) {
            missing[fullKey] = {};
          }
          processObject(value, target[key] || {}, fullKey);
        } else {
          if (target[key] === undefined) {
            missing[fullKey] = value; // Copy base value as placeholder
          }
        }
      });
    };

    processObject(baseTranslations, targetTranslations);
    return missing;
  }
}

// Create singleton instance
export const i18nValidator = new I18nValidator();

// Export convenience functions
export function validateTranslations(): ValidationResult {
  return i18nValidator.validateAll();
}

export function getTranslationReport(): string {
  return i18nValidator.getCompletionReport();
}

export function getMissingTranslations(language: string): { [key: string]: any } {
  return i18nValidator.generateMissingKeys(language);
}

export function testTranslationKey(key: string, values: Record<string, any>): { [language: string]: string } {
  return i18nValidator.testInterpolation(key, values);
}

// React hook for translation validation
export function useTranslationValidation() {
  return {
    validate: validateTranslations,
    getReport: getTranslationReport,
    getMissing: getMissingTranslations,
    testKey: testTranslationKey,
  };
}

export default i18nValidator;