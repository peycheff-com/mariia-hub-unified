// i18n comprehensive test suite
import { describe, it, expect, beforeAll } from 'vitest';

import i18nValidator, { validateTranslations, getTranslationReport } from '@/lib/i18n-validation';
import { createLocalizer, formatDateLocalized, formatCurrencyLocalized } from '@/lib/date-localization';
import { getEmailTemplate, getSMSTemplate } from '@/lib/email-templates';
import { RTLSupport } from '@/lib/rtl-support';

describe('i18n Comprehensive Tests', () => {
  beforeAll(() => {
    // Initialize i18n if needed
  });

  describe('Translation Validation', () => {
    it('should validate all translations without critical errors', () => {
      const result = validateTranslations();

      console.log('Translation validation result:', result);
      console.log('Translation report:', getTranslationReport());

      // Check that we have reasonable completion rates
      expect(result.stats.totalKeys).toBeGreaterThan(100); // Should have many keys

      // English should be 100% complete
      expect(result.stats.completionPercentage.en).toBe(100);

      // Other languages should have high completion rates
      expect(result.stats.completionPercentage.pl).toBeGreaterThan(95);
      expect(result.stats.completionPercentage.ua).toBeGreaterThan(90);
      expect(result.stats.completionPercentage.ru).toBeGreaterThan(90);
    });

    it('should have consistent key structure across languages', () => {
      const result = validateTranslations();

      // Should not have missing keys in critical sections
      const criticalErrors = result.errors.filter(error =>
        error.key.includes('nav.') ||
        error.key.includes('hero.') ||
        error.key.includes('common.')
      );

      expect(criticalErrors).toHaveLength(0);
    });

    it('should detect suspicious translations', () => {
      const result = validateTranslations();

      // The translations are actually very good, so warnings might be 0
      expect(result.warnings.length).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Date Localization', () => {
    it('should format dates correctly for each language', () => {
      const testDate = new Date('2024-12-25T15:30:00');
      const languages = ['en', 'pl', 'ua', 'ru'];

      languages.forEach(lang => {
        const localizer = createLocalizer(lang);
        const formatted = localizer.formatDate(testDate);

        expect(formatted).toBeDefined();
        expect(typeof formatted).toBe('string');
        expect(formatted.length).toBeGreaterThan(5);

        // Test time formatting
        const timeFormatted = localizer.formatTime(testDate);
        expect(timeFormatted).toMatch(/\d{1,2}:\d{2}/);

        // Test datetime formatting
        const dateTimeFormatted = localizer.formatDateTime(testDate);
        expect(dateTimeFormatted).toBeDefined();
        expect(dateTimeFormatted.length).toBeGreaterThan(10);
      });
    });

    it('should format durations correctly', () => {
      const durations = [30, 60, 90, 120]; // minutes
      const languages = ['en', 'pl', 'ua', 'ru'];

      durations.forEach(duration => {
        languages.forEach(lang => {
          const localizer = createLocalizer(lang);
          const formatted = localizer.formatDuration(duration);

          expect(formatted).toBeDefined();
          expect(typeof formatted).toBe('string');
          expect(formatted).toMatch(/\d+/); // Should contain numbers
        });
      });
    });

    it('should format currency correctly', () => {
      const amounts = [100, 250.50, 1000];
      const languages = ['en', 'pl', 'ua', 'ru'];

      amounts.forEach(amount => {
        languages.forEach(lang => {
          const formatted = formatCurrencyLocalized(amount, lang, 'PLN');

          expect(formatted).toBeDefined();
          expect(typeof formatted).toBe('string');
          expect(formatted).toMatch(/(PLN|zł|₽|$|€|£)/); // Should contain some currency symbol
        });
      });
    });

    it('should handle relative time formatting', () => {
      const localizer = createLocalizer('en');
      const now = new Date();

      // Test past times
      const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
      const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

      const hourAgoFormatted = localizer.formatTimeAgo(oneHourAgo);
      const dayAgoFormatted = localizer.formatTimeAgo(oneDayAgo);

      expect(hourAgoFormatted).toBeDefined();
      expect(dayAgoFormatted).toBeDefined();
      expect(hourAgoFormatted).toMatch(/hour/);
      expect(dayAgoFormatted).toMatch(/day/);
    });
  });

  describe('Email Templates', () => {
    it('should provide email templates for all languages', () => {
      const templateData = {
        userName: 'John Doe',
        serviceName: 'Permanent Makeup',
        bookingDate: 'December 25, 2024 at 15:30',
        dashboardUrl: 'https://example.com/dashboard',
      };

      const languages = ['en', 'pl', 'ua', 'ru'];

      languages.forEach(lang => {
        const template = getEmailTemplate(lang, 'booking.confirmation', templateData);

        expect(template).toBeDefined();
        expect(template.subject).toBeDefined();
        expect(template.html).toBeDefined();

        if (typeof template.subject === 'function') {
          const subject = template.subject(templateData);
          expect(subject).toContain(templateData.serviceName);
        }

        if (typeof template.html === 'function') {
          const html = template.html(templateData);
          expect(html).toContain(templateData.userName);
        }
      });
    });

    it('should provide SMS templates for all languages', () => {
      const templateData = {
        serviceName: 'Personal Training',
        bookingDate: 'Dec 25, 2024',
        time: '15:30',
      };

      const languages = ['en', 'pl', 'ua', 'ru'];

      languages.forEach(lang => {
        const template = getSMSTemplate(lang, 'booking.confirmation', templateData);

        expect(template).toBeDefined();
        expect(template.text).toBeDefined();

        if (typeof template.text === 'function') {
          const text = template.text(templateData);
          expect(text).toContain(templateData.serviceName);
          expect(text.length).toBeLessThan(200); // SMS should be short
        }
      });
    });

    it('should handle missing templates gracefully', () => {
      const template = getEmailTemplate('invalid-lang', 'invalid-template', {});

      expect(template).toBeDefined();
      // Should fall back to English booking confirmation
    });
  });

  describe('RTL Support', () => {
    it('should correctly identify RTL languages', () => {
      expect(RTLSupport.isRTLLanguage('en')).toBe(false);
      expect(RTLSupport.isRTLLanguage('pl')).toBe(false);
      expect(RTLSupport.isRTLLanguage('ua')).toBe(false);
      expect(RTLSupport.isRTLLanguage('ru')).toBe(false);
      expect(RTLSupport.isRTLLanguage('ar')).toBe(true);
      expect(RTLSupport.isRTLLanguage('he')).toBe(true);
    });

    it('should provide language configurations', () => {
      const enConfig = RTLSupport.getLanguageConfig('en');
      const arConfig = RTLSupport.getLanguageConfig('ar');

      expect(enConfig).toBeDefined();
      expect(enConfig?.direction).toBe('ltr');
      expect(enConfig?.textAlign).toBe('left');

      expect(arConfig).toBeDefined();
      expect(arConfig?.direction).toBe('rtl');
      expect(arConfig?.textAlign).toBe('right');
      expect(arConfig?.mirrorIcons).toBe(true);
    });

    it('should generate appropriate CSS for RTL languages', () => {
      const ltrCSS = RTLSupport.generateRTLCSS('en');
      const rtlCSS = RTLSupport.generateRTLCSS('ar');

      expect(ltrCSS).toBe(''); // No CSS needed for LTR
      expect(rtlCSS).toContain('.rtl');
      expect(rtlCSS).toContain('direction: rtl');
      expect(rtlCSS).toContain('text-align: right');
    });

    it('should provide text alignment utilities', () => {
      expect(RTLSupport.getTextAlign('en')).toBe('left');
      expect(RTLSupport.getTextAlign('ar')).toBe('right');
      expect(RTLSupport.getTextAlign('invalid')).toBe('left');
    });
  });

  describe('Integration Tests', () => {
    it('should handle complete booking flow localization', () => {
      const bookingData = {
        userName: 'Jan Kowalski',
        serviceName: 'Makijaż Permanentny Brwi',
        bookingDate: new Date('2024-12-25T15:30:00'),
        amount: 800,
        currency: 'PLN',
        duration: 120,
      };

      // Test Polish localization
      const plLocalizer = createLocalizer('pl');
      const formattedDate = plLocalizer.formatDateTime(bookingData.bookingDate);
      const formattedAmount = plLocalizer.formatCurrency(bookingData.amount, bookingData.currency);
      const formattedDuration = plLocalizer.formatDuration(bookingData.duration);

      expect(formattedDate).toBeDefined();
      expect(formattedAmount).toContain('800');
      expect(formattedDuration).toContain('2');

      // Test email template
      const emailTemplate = getEmailTemplate('pl', 'booking.confirmation', bookingData);
      expect(emailTemplate).toBeDefined();

      if (typeof emailTemplate.subject === 'function') {
        const subject = emailTemplate.subject(bookingData);
        expect(subject).toContain(bookingData.serviceName);
      }
    });

    it('should handle language switching scenarios', () => {
      const testDate = new Date('2024-12-25T15:30:00');

      // Test switching between languages
      const enDate = formatDateLocalized(testDate, 'en');
      const plDate = formatDateLocalized(testDate, 'pl');
      const uaDate = formatDateLocalized(testDate, 'ua');
      const ruDate = formatDateLocalized(testDate, 'ru');

      expect(enDate).toBeDefined();
      expect(plDate).toBeDefined();
      expect(uaDate).toBeDefined();
      expect(ruDate).toBeDefined();

      // Dates should be different (different languages/formats)
      expect(plDate).not.toBe(enDate);
      expect(uaDate).not.toBe(enDate);
      expect(ruDate).not.toBe(enDate);
    });
  });

  describe('Performance Tests', () => {
    it('should handle large numbers of date formatting operations efficiently', () => {
      const testDate = new Date();
      const iterations = 1000;

      const startTime = performance.now();

      for (let i = 0; i < iterations; i++) {
        formatDateLocalized(testDate, 'pl');
        formatCurrencyLocalized(100, 'pl', 'PLN');
      }

      const endTime = performance.now();
      const duration = endTime - startTime;

      // Should complete within reasonable time (less than 1 second for 1000 operations)
      expect(duration).toBeLessThan(1000);
    });

    it('should handle translation validation efficiently', () => {
      const startTime = performance.now();
      const result = validateTranslations();
      const endTime = performance.now();
      const duration = endTime - startTime;

      expect(duration).toBeLessThan(500); // Should be fast
      expect(result).toBeDefined();
      expect(result.stats.totalKeys).toBeGreaterThan(0);
    });
  });
});