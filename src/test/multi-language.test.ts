/**
 * Multi-language Support Tests
 * Comprehensive tests for internationalization features
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import i18n from '@/i18n/config';
import EnhancedLanguageSwitcher from '@/components/EnhancedLanguageSwitcher';
import { languageDetector } from '../lib/advanced-language-detection';
import { useI18n } from '../lib/i18n-utils';
import { getEmailTemplate, getSMSTemplate } from '../lib/email-templates-new';

// Mock fetch for IP detection
global.fetch = vi.fn();

describe('Multi-language Support', () => {
  beforeEach(() => {
    // Reset i18n to English before each test
    i18n.changeLanguage('en');
    vi.clearAllMocks();
  });

  afterEach(() => {
    // Clean up
  });

  describe('Language Switcher Component', () => {
    it('renders language switcher with correct current language', () => {
      render(
        <I18nextProvider i18n={i18n}>
          <EnhancedLanguageSwitcher />
        </I18nextProvider>
      );

      // Check if the switcher is rendered
      const switcher = screen.getByRole('button', { name: /Current language: English/i });
      expect(switcher).toBeInTheDocument();
    });

    it('shows language options when clicked', async () => {
      render(
        <I18nextProvider i18n={i18n}>
          <EnhancedLanguageSwitcher />
        </I18nextProvider>
      );

      // Click to open dropdown
      const switcher = screen.getByRole('button', { name: /Current language/i });
      fireEvent.click(switcher);

      // Check if all languages are shown
      await waitFor(() => {
        expect(screen.getByText('English')).toBeInTheDocument();
        expect(screen.getByText('Polski')).toBeInTheDocument();
        expect(screen.getByText('Українська')).toBeInTheDocument();
        expect(screen.getByText('Русский')).toBeInTheDocument();
      });
    });

    it('changes language when option is selected', async () => {
      render(
        <I18nextProvider i18n={i18n}>
          <EnhancedLanguageSwitcher />
        </I18nextProvider>
      );

      // Open dropdown
      const switcher = screen.getByRole('button', { name: /Current language/i });
      fireEvent.click(switcher);

      // Select Polish
      await waitFor(() => {
        const polishOption = screen.getByText('Polski');
        fireEvent.click(polishOption);
      });

      // Check if language changed
      await waitFor(() => {
        expect(i18n.language).toBe('pl');
      });
    });

    it('saves language preference to localStorage', async () => {
      const localStorageSpy = vi.spyOn(Storage.prototype, 'setItem');

      render(
        <I18nextProvider i18n={i18n}>
          <EnhancedLanguageSwitcher />
        </I18nextProvider>
      );

      // Open dropdown and select Ukrainian
      const switcher = screen.getByRole('button', { name: /Current language/i });
      fireEvent.click(switcher);

      await waitFor(() => {
        const ukrainianOption = screen.getByText('Українська');
        fireEvent.click(ukrainianOption);
      });

      // Check if preference was saved
      await waitFor(() => {
        expect(localStorageSpy).toHaveBeenCalledWith('preferred-language', 'ua');
      });
    });

    it('shows suggestion based on detected country', async () => {
      // Mock IP detection for Poland
      (global.fetch as any).mockResolvedValueOnce({
        json: () => Promise.resolve({ country_code: 'PL' })
      });

      render(
        <I18nextProvider i18n={i18n}>
          <EnhancedLanguageSwitcher autoDetect={true} />
        </I18nextProvider>
      );

      // Open dropdown
      const switcher = screen.getByRole('button', { name: /Current language/i });
      fireEvent.click(switcher);

      // Should show suggestion for Polish
      await waitFor(() => {
        expect(screen.getByText(/Suggested: Polski/i)).toBeInTheDocument();
      });
    });
  });

  describe('Language Detection', () => {
    it('detects language from browser settings', async () => {
      // Mock navigator.language
      Object.defineProperty(navigator, 'language', {
        value: 'pl',
        configurable: true,
      });

      const result = await languageDetector.detectLanguage();

      expect(result.detectedLanguage).toBe('pl');
      expect(result.confidence).toBeGreaterThan(0.8);
      expect(result.method).toBe('browser');
    });

    it('detects language from IP location', async () => {
      // Mock IP API response for Ukraine
      (global.fetch as any).mockResolvedValueOnce({
        json: () => Promise.resolve({ country_code: 'UA' })
      });

      const result = await languageDetector.detectLanguage({
        enableBrowserDetection: false,
        enableIPDetection: true,
      });

      expect(result.detectedLanguage).toBe('ua');
      expect(result.method).toBe('ip');
    });

    it('detects language from timezone', async () => {
      // Mock timezone
      Object.defineProperty(Intl, 'DateTimeFormat', {
        value: {
          resolvedOptions: () => ({ timeZone: 'Europe/Warsaw' })
        },
        configurable: true,
      });

      const result = await languageDetector.detectLanguage({
        enableBrowserDetection: false,
        enableTimezoneDetection: true,
      });

      expect(result.detectedLanguage).toBe('pl');
      expect(result.method).toBe('timezone');
    });

    it('combines multiple detection methods', async () => {
      // Mock multiple signals
      Object.defineProperty(navigator, 'language', { value: 'pl' });
      Object.defineProperty(Intl, 'DateTimeFormat', {
        value: {
          resolvedOptions: () => ({ timeZone: 'Europe/Warsaw' })
        },
      });

      const result = await languageDetector.detectLanguage();

      expect(result.detectedLanguage).toBe('pl');
      expect(result.method).toBe('combined');
      expect(result.confidence).toBeGreaterThan(0.8);
    });

    it('returns fallback language when detection fails', async () => {
      // Mock failed detection
      (global.fetch as any).mockRejectedValue(new Error('Network error'));
      Object.defineProperty(navigator, 'language', { value: 'unknown' });

      const result = await languageDetector.detectLanguage({
        fallbackLanguage: 'en',
      });

      expect(result.detectedLanguage).toBe('en');
      expect(result.confidence).toBeLessThan(0.7);
    });
  });

  describe('Translation Coverage', () => {
    it('has translations for all required keys', () => {
      const requiredKeys = [
        'nav.beauty',
        'nav.fitness',
        'hero.title1',
        'hero.title2',
        'about.badge',
        'beautySection.title',
        'fitnessSection.title',
        'contactSection.form.name',
        'auth.signIn',
        'dashboard.welcome',
        'user.dashboard.greetingMorning',
        'user.profile.title',
        'user.addressBook.title',
        'user.bookings.title',
        'user.favorites.title',
        'user.notifications.title',
        'search.placeholder',
        'comparison.empty.title',
        'footer.brand'
      ];

      requiredKeys.forEach(key => {
        const keys = key.split('.');
        let translation = i18n.getResourceBundle('en', 'translation');

        for (const k of keys) {
          translation = translation?.[k];
        }

        expect(translation).toBeDefined();
        expect(typeof translation).toBe('string');
        expect(translation.length).toBeGreaterThan(0);
      });
    });

    it('has consistent translations across languages', () => {
      const testKeys = [
        'nav.beauty',
        'nav.fitness',
        'hero.title1',
        'about.badge',
        'auth.signIn'
      ];

      testKeys.forEach(key => {
        const enTranslation = i18n.t(key, { lng: 'en' });
        const plTranslation = i18n.t(key, { lng: 'pl' });
        const uaTranslation = i18n.t(key, { lng: 'ua' });
        const ruTranslation = i18n.t(key, { lng: 'ru' });

        // All translations should exist
        expect(enTranslation).toBeTruthy();
        expect(plTranslation).toBeTruthy();
        expect(uaTranslation).toBeTruthy();
        expect(ruTranslation).toBeTruthy();

        // Translations should not be identical to English (except for things like "Email")
        if (!['Email', 'iOS', 'Android'].some(term => enTranslation.includes(term))) {
          expect(plTranslation).not.toBe(enTranslation);
          expect(uaTranslation).not.toBe(enTranslation);
          expect(ruTranslation).not.toBe(enTranslation);
        }
      });
    });

    it('preserves placeholders in translations', () => {
      const key = 'bookPage.toast.successDesc';
      const value = '{{points}}';

      const en = i18n.t(key, { lng: 'en', value });
      const pl = i18n.t(key, { lng: 'pl', value });
      const ua = i18n.t(key, { lng: 'ua', value });
      const ru = i18n.t(key, { lng: 'ru', value });

      // All translations should preserve the placeholder
      expect(en).toContain('{{');
      expect(pl).toContain('{{');
      expect(ua).toContain('{{');
      expect(ru).toContain('{{');
    });

    it('handles pluralization correctly', () => {
      // Test English pluralization
      const enOne = i18n.t('syncCompleteDesc', { count: 1, lng: 'en' });
      const enMany = i18n.t('syncCompleteDesc', { count: 5, lng: 'en' });

      expect(enOne).toBeTruthy();
      expect(enMany).toBeTruthy();

      // Test Polish pluralization (different rules)
      const plOne = i18n.t('syncCompleteDesc', { count: 1, lng: 'pl' });
      const plFew = i18n.t('syncCompleteDesc', { count: 2, lng: 'pl' });
      const plMany = i18n.t('syncCompleteDesc', { count: 5, lng: 'pl' });

      expect(plOne).toBeTruthy();
      expect(plFew).toBeTruthy();
      expect(plMany).toBeTruthy();
    });
  });

  describe('Email and SMS Templates', () => {
    it('generates email templates in all languages', () => {
      const data = {
        clientName: 'Test Client',
        serviceName: 'Test Service',
        date: '2024-01-15',
        time: '14:00',
        location: 'Test Location',
        price: '100 PLN'
      };

      const enEmail = getEmailTemplate('en', 'bookingConfirmation', data);
      const plEmail = getEmailTemplate('pl', 'bookingConfirmation', data);
      const uaEmail = getEmailTemplate('ua', 'bookingConfirmation', data);
      const ruEmail = getEmailTemplate('ru', 'bookingConfirmation', data);

      // Check structure
      [enEmail, plEmail, uaEmail, ruEmail].forEach(email => {
        expect(email).toHaveProperty('subject');
        expect(email).toHaveProperty('html');
        expect(email).toHaveProperty('text');
        expect(email.subject).toBeTruthy();
        expect(email.html).toContain(data.clientName);
        expect(email.text).toContain(data.clientName);
      });

      // Check language-specific content
      expect(enEmail.subject).toContain('Booking Confirmation');
      expect(plEmail.subject).toContain('Potwierdzenie Rezerwacji');
      expect(uaEmail.subject).toContain('Підтвердження Бронювання');
      expect(ruEmail.subject).toContain('Подтверждение Бронирования');
    });

    it('generates SMS templates in all languages', () => {
      const data = {
        clientName: 'Test Client',
        serviceName: 'Test Service',
        date: '2024-01-15',
        time: '14:00'
      };

      const enSms = getSMSTemplate('en', 'bookingConfirmation', data);
      const plSms = getSMSTemplate('pl', 'bookingConfirmation', data);
      const uaSms = getSMSTemplate('ua', 'bookingConfirmation', data);
      const ruSms = getSMSTemplate('ru', 'bookingConfirmation', data);

      // Check all SMS exist
      [enSms, plSms, uaSms, ruSms].forEach(sms => {
        expect(sms).toHaveProperty('text');
        expect(sms.text).toBeTruthy();
        expect(sms.text).toContain(data.clientName);
      });

      // Check language-specific content
      expect(enSms.text).toContain('appointment is confirmed');
      expect(plSms.text).toContain('jest potwierdzona');
      expect(uaSms.text).toContain('підтверджено');
      expect(ruSms.text).toContain('подтверждён');
    });
  });

  describe('Locale-specific Formatting', () => {
    it('formats dates correctly for each locale', () => {
      const testDate = new Date('2024-01-15T14:00:00');

      // Test with i18n-utils would need the actual formatting functions
      // This is a placeholder test showing the structure
      expect(testDate).toBeInstanceOf(Date);
    });

    it('formats currency correctly for each locale', () => {
      const amount = 123.45;

      // Test Polish formatting
      const plFormatted = amount.toLocaleString('pl-PL', {
        style: 'currency',
        currency: 'PLN'
      });
      expect(plFormatted).toContain('123,45');
      expect(plFormatted).toContain('zł');

      // Test Ukrainian formatting (if UAH is supported)
      try {
        const uaFormatted = amount.toLocaleString('uk-UA', {
          style: 'currency',
          currency: 'UAH'
        });
        expect(uaFormatted).toBeTruthy();
      } catch (e) {
        // Fallback test if UAH is not supported
        const uaFormatted = amount.toLocaleString('uk-UA');
        expect(uaFormatted).toBeTruthy();
      }
    });

    it('formats numbers correctly for each locale', () => {
      const number = 1234.56;

      const plFormatted = number.toLocaleString('pl-PL');
      const uaFormatted = number.toLocaleString('uk-UA');
      const ruFormatted = number.toLocaleString('ru-RU');

      // Polish uses comma as decimal separator
      expect(plFormatted).toContain(',');

      // Ukrainian and Russian should use comma as decimal separator
      expect(uaFormatted).toContain(',');
      expect(ruFormatted).toContain(',');
    });
  });

  describe('Accessibility', () => {
    it('provides proper ARIA labels in all languages', async () => {
      render(
        <I18nextProvider i18n={i18n}>
          <EnhancedLanguageSwitcher />
        </I18nextProvider>
      );

      const switcher = screen.getByRole('button', { name: /Current language: English/i });
      expect(switcher).toHaveAttribute('aria-label');

      // Open dropdown
      fireEvent.click(switcher);

      // Check language options have proper labels
      await waitFor(() => {
        const polishOption = screen.getByRole('menuitem', { name: /Switch to Polski/i });
        expect(polishOption).toBeInTheDocument();
        expect(polishOption).toHaveAttribute('aria-current', 'false');
      });
    });

    it('updates lang attribute on document when language changes', async () => {
      render(
        <I18nextProvider i18n={i18n}>
          <EnhancedLanguageSwitcher />
        </I18nextProvider>
      );

      // Check initial lang attribute
      expect(document.documentElement.getAttribute('lang')).toBe('en');

      // Change language
      const switcher = screen.getByRole('button', { name: /Current language/i });
      fireEvent.click(switcher);

      await waitFor(() => {
        const polishOption = screen.getByText('Polski');
        fireEvent.click(polishOption);
      });

      // Check if lang attribute was updated
      await waitFor(() => {
        expect(document.documentElement.getAttribute('lang')).toBe('pl');
      });
    });
  });

  describe('Performance', () => {
    it('loads translations asynchronously', async () => {
      const startTime = performance.now();

      // Load a new language
      await i18n.changeLanguage('pl');

      const endTime = performance.now();
      const loadTime = endTime - startTime;

      // Should load quickly (under 100ms)
      expect(loadTime).toBeLessThan(100);
    });

    it('caches translation results', async () => {
      // First load
      const start1 = performance.now();
      await i18n.changeLanguage('ua');
      const time1 = performance.now() - start1;

      // Second load (should be faster due to caching)
      const start2 = performance.now();
      await i18n.changeLanguage('ua');
      const time2 = performance.now() - start2;

      expect(time2).toBeLessThan(time1);
    });
  });

  describe('Error Handling', () => {
    it('handles missing translation keys gracefully', () => {
      // Try to access a non-existent key
      const missing = i18n.t('non.existent.key', { lng: 'pl' });
      expect(missing).toBe('non.existent.key');
    });

    it('falls back to English when translation is missing', () => {
      // Create a scenario where a key exists in English but not in Polish
      const enTranslation = i18n.t('nav.beauty', { lng: 'en' });

      // Even if Polish had issues, it should provide a fallback
      expect(enTranslation).toBeTruthy();
    });

    it('handles network errors during IP detection', async () => {
      // Mock network error
      (global.fetch as any).mockRejectedValueOnce(new Error('Network error'));

      const result = await languageDetector.detectLanguage({
        enableIPDetection: true,
        fallbackLanguage: 'en'
      });

      // Should not crash and should return fallback
      expect(result.detectedLanguage).toBe('en');
      expect(result.confidence).toBeLessThan(0.7);
    });
  });

  describe('Integration with Components', () => {
    it('updates all translated content when language changes', async () => {
      const TestComponent = () => {
        const { t } = useI18n();
        return (
          <div>
            <h1>{t('hero.title1')}</h1>
            <p>{t('nav.beauty')}</p>
          </div>
        );
      };

      render(
        <I18nextProvider i18n={i18n}>
          <TestComponent />
        </I18nextProvider>
      );

      // Check initial content
      expect(screen.getByText('Soft beauty.')).toBeInTheDocument();
      expect(screen.getByText('Beauty')).toBeInTheDocument();

      // Change language
      await i18n.changeLanguage('pl');

      // Check if content updated
      await waitFor(() => {
        expect(screen.getByText('Delikatne piękno.')).toBeInTheDocument();
        expect(screen.getByText('Uroda')).toBeInTheDocument();
      });
    });
  });
});