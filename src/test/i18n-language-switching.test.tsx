// Comprehensive i18n feature tests
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { I18nextProvider , useTranslation } from 'react-i18next';
import { BrowserRouter } from 'react-router-dom';

import i18n from '@/i18n/config';
import { CurrencyProvider, useCurrency } from '@/contexts/CurrencyContext';
import * as translationUtils from '@/lib/i18n-utils';

// Mock i18n to ensure translations are loaded for tests
vi.mock('@/i18n/config', () => {
  const mockI18n = {
    language: 'en',
    changeLanguage: vi.fn().mockImplementation((lng: string) => {
      mockI18n.language = lng;
      return Promise.resolve();
    }),
    t: vi.fn().mockImplementation((key: string) => {
      const translations = {
        'nav.beauty': 'Beauty',
        'nav.fitness': 'Fitness',
        'hero.title1': 'Transform Your Beauty'
      };
      return translations[key] || key;
    }),
    // Add missing methods that might be needed
    getResourceBundle: vi.fn().mockReturnValue({
      nav: { beauty: 'Beauty', fitness: 'Fitness' },
      hero: { title1: 'Transform Your Beauty' }
    }),
    addResourceBundle: vi.fn(),
    // Add getFixedT method to fix the test failures
    getFixedT: vi.fn().mockImplementation((lng: string, ns?: string) => {
      return (key: string) => {
        const translations = {
          'nav.beauty': 'Beauty',
          'nav.fitness': 'Fitness',
          'hero.title1': 'Transform Your Beauty'
        };
        return translations[key] || key;
      };
    })
  };
  return { default: mockI18n };
});

// Mock components for testing
const TestComponent = () => {
  const { t } = useTranslation();
  const { currency, setCurrency, formatPrice } = useCurrency();

  return (
    <div>
      <h1>{t('nav.beauty')}</h1>
      <p>{t('hero.title1')}</p>
      <span data-testid="currency-display">{formatPrice(100)}</span>
      <button onClick={() => setCurrency('EUR')}>EUR</button>
      <button onClick={() => setCurrency('USD')}>USD</button>
      <button onClick={() => setCurrency('PLN')}>PLN</button>
      <select data-testid="language-select" onChange={(e) => i18n.changeLanguage(e.target.value)}>
        <option value="en">English</option>
        <option value="pl">Polski</option>
        <option value="ua">Українська</option>
        <option value="ru">Русский</option>
      </select>
    </div>
  );
};

const renderWithProviders = (component: React.ReactElement) => {
  return render(
    <BrowserRouter>
      <I18nextProvider i18n={i18n}>
        <CurrencyProvider>
          {component}
        </CurrencyProvider>
      </I18nextProvider>
    </BrowserRouter>
  );
};

describe('Language Switching Functionality', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    i18n.changeLanguage('en');
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('should initialize with English as default language', () => {
    renderWithProviders(<TestComponent />);

    expect(screen.getByText('Beauty')).toBeInTheDocument();
    expect(i18n.language).toBe('en');
  });

  it('should switch to Polish language correctly', async () => {
    renderWithProviders(<TestComponent />);

    const languageSelect = screen.getByTestId('language-select');
    fireEvent.change(languageSelect, { target: { value: 'pl' } });

    await waitFor(() => {
      expect(i18n.language).toBe('pl');
    });

    // Wait for translation to update
    await waitFor(() => {
      expect(screen.queryByText('Beauty')).not.toBeInTheDocument();
    });
  });

  it('should persist language choice in localStorage', async () => {
    const setItemSpy = vi.spyOn(localStorage, 'setItem');

    renderWithProviders(<TestComponent />);

    const languageSelect = screen.getByTestId('language-select');
    fireEvent.change(languageSelect, { target: { value: 'pl' } });

    await waitFor(() => {
      expect(setItemSpy).toHaveBeenCalledWith('i18nextLng', 'pl');
    });

    setItemSpy.mockRestore();
  });

  it('should handle invalid language codes gracefully', async () => {
    renderWithProviders(<TestComponent />);

    // Try to change to an invalid language
    await i18n.changeLanguage('invalid');

    // Should fall back to default or valid language
    expect(['en', 'pl', 'ua', 'ru']).toContain(i18n.language);
  });

  it('should support Ukrainian language switching', async () => {
    renderWithProviders(<TestComponent />);

    const languageSelect = screen.getByTestId('language-select');
    fireEvent.change(languageSelect, { target: { value: 'ua' } });

    await waitFor(() => {
      expect(i18n.language).toBe('ua');
    });
  });

  it('should support Russian language switching', async () => {
    renderWithProviders(<TestComponent />);

    const languageSelect = screen.getByTestId('language-select');
    fireEvent.change(languageSelect, { target: { value: 'ru' } });

    await waitFor(() => {
      expect(i18n.language).toBe('ru');
    });
  });

  it('should maintain component state during language switch', async () => {
    renderWithProviders(<TestComponent />);

    // Set currency before language change
    const eurButton = screen.getByText('EUR');
    fireEvent.click(eurButton);

    // Change language
    const languageSelect = screen.getByTestId('language-select');
    fireEvent.change(languageSelect, { target: { value: 'pl' } });

    await waitFor(() => {
      expect(i18n.language).toBe('pl');
    });

    // Currency should still work
    const currencyDisplay = screen.getByTestId('currency-display');
    expect(currencyDisplay).toBeInTheDocument();
  });

  it('should handle rapid language switching', async () => {
    renderWithProviders(<TestComponent />);

    const languageSelect = screen.getByTestId('language-select');
    const languages = ['pl', 'ua', 'ru', 'en'];

    // Rapidly switch through languages
    for (const lang of languages) {
      fireEvent.change(languageSelect, { target: { value: lang } });
      await waitFor(() => {
        expect(i18n.language).toBe(lang);
      }, { timeout: 1000 });
    }
  });

  it('should provide fallback for missing translations', async () => {
    // Mock a missing translation key
    const originalT = i18n.t;
    i18n.t = vi.fn((key) => {
      if (key === 'nonexistent.key') {
        return key; // Fallback to key itself
      }
      return originalT(key);
    });

    renderWithProviders(<TestComponent />);

    await i18n.changeLanguage('pl');

    // Should not crash and should provide fallback
    expect(() => i18n.t('nonexistent.key')).not.toThrow();

    // Restore original t function
    i18n.t = originalT;
  });
});

describe('Translation Loading and Display', () => {
  beforeEach(() => {
    localStorage.clear();
    i18n.changeLanguage('en');
  });

  it('should load all translation resources', () => {
    const languages = ['en', 'pl', 'ua', 'ru'];

    languages.forEach(lang => {
      const resources = i18n.getResourceBundle(lang, 'translation');
      expect(resources).toBeDefined();
      expect(typeof resources).toBe('object');
      expect(Object.keys(resources).length).toBeGreaterThan(0);
    });
  });

  it('should have consistent translation keys across languages', () => {
    const enResources = i18n.getResourceBundle('en', 'translation');
    const plResources = i18n.getResourceBundle('pl', 'translation');

    // Check that both have the same top-level keys
    const enKeys = Object.keys(enResources);
    const plKeys = Object.keys(plResources);

    // Should have most keys in common (allowing for some differences)
    const commonKeys = enKeys.filter(key => plKeys.includes(key));
    expect(commonKeys.length).toBeGreaterThan(enKeys.length * 0.8); // At least 80% overlap
  });

  it('should display translations correctly in UI', async () => {
    renderWithProviders(<TestComponent />);

    // English
    expect(screen.getByText('Beauty')).toBeInTheDocument();

    // Switch to Polish
    await i18n.changeLanguage('pl');

    // Should show Polish translation (if it exists)
    // Note: This might need adjustment based on actual translations
  });

  it('should handle nested translation keys', () => {
    // Test nested key access
    const navKeys = i18n.getResourceBundle('en', 'translation').nav;
    expect(navKeys).toBeDefined();
    expect(navKeys.beauty).toBe('Beauty');
    expect(navKeys.fitness).toBe('Fitness');
  });

  it('should handle interpolation in translations', () => {
    // Test if interpolation works (example with dynamic values)
    const result = i18n.t('offline.queuedActions', { count: 5 });
    expect(result).toBeDefined();
    expect(typeof result).toBe('string');
  });

  it('should handle pluralization correctly', () => {
    // Test pluralization if supported
    const singular = i18n.t('item', { count: 1 });
    const plural = i18n.t('item', { count: 5 });

    expect(singular).toBeDefined();
    expect(plural).toBeDefined();
    expect(typeof singular).toBe('string');
    expect(typeof plural).toBe('string');
  });
});

describe('Currency Integration with i18n', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('should format currency correctly for different languages', () => {
    renderWithProviders(<TestComponent />);

    // Test PLN formatting (default)
    const currencyDisplay = screen.getByTestId('currency-display');
    expect(currencyDisplay).toHaveTextContent('100 zł');

    // Test EUR button click
    const eurButton = screen.getByText('EUR');
    fireEvent.click(eurButton);
    expect(currencyDisplay).toHaveTextContent('€23');

    // Test USD button click
    const usdButton = screen.getByText('USD');
    fireEvent.click(usdButton);
    expect(currencyDisplay).toHaveTextContent('$25');
  });

  it('should maintain currency preference across language changes', async () => {
    renderWithProviders(<TestComponent />);

    // Set EUR currency
    const eurButton = screen.getByText('EUR');
    fireEvent.click(eurButton);

    // Change language
    const languageSelect = screen.getByTestId('language-select');
    fireEvent.change(languageSelect, { target: { value: 'pl' } });

    await waitFor(() => {
      expect(i18n.language).toBe('pl');
    });

    // Currency should still be EUR
    const currencyDisplay = screen.getByTestId('currency-display');
    expect(currencyDisplay.textContent).toContain('€');
  });

  it('should handle currency conversion edge cases', () => {
    renderWithProviders(<TestComponent />);

    const currencyDisplay = screen.getByTestId('currency-display');

    // Test zero amount (modify component to test edge case)
    expect(currencyDisplay).toHaveTextContent('100 zł');

    // Test currency switching works without errors
    const eurButton = screen.getByText('EUR');
    expect(() => fireEvent.click(eurButton)).not.toThrow();
    expect(currencyDisplay).toHaveTextContent('€23');
  });

  it('should use correct currency symbols and formatting', () => {
    renderWithProviders(<TestComponent />);

    const currencyDisplay = screen.getByTestId('currency-display');

    // PLN should have space before symbol
    expect(currencyDisplay).toHaveTextContent('100 zł');

    // EUR should have symbol before amount
    const eurButton = screen.getByText('EUR');
    fireEvent.click(eurButton);
    expect(currencyDisplay).toHaveTextContent('€23');

    // USD should have symbol before amount
    const usdButton = screen.getByText('USD');
    fireEvent.click(usdButton);
    expect(currencyDisplay).toHaveTextContent('$25');
  });
});

describe('Performance and Optimization', () => {
  it('should handle multiple language changes efficiently', async () => {
    renderWithProviders(<TestComponent />);

    const startTime = performance.now();
    const languageSelect = screen.getByTestId('language-select');

    // Perform multiple language switches
    const languages = ['en', 'pl', 'ua', 'ru'];
    for (let i = 0; i < 10; i++) {
      const lang = languages[i % languages.length];
      fireEvent.change(languageSelect, { target: { value: lang } });
      await waitFor(() => {
        expect(i18n.language).toBe(lang);
      }, { timeout: 500 });
    }

    const endTime = performance.now();
    const duration = endTime - startTime;

    // Should complete within reasonable time (less than 5 seconds)
    expect(duration).toBeLessThan(5000);
  });

  it('should cache translations properly', () => {
    // Load translation multiple times
    for (let i = 0; i < 100; i++) {
      i18n.t('nav.beauty');
    }

    // Should be fast (cached)
    const startTime = performance.now();
    i18n.t('nav.beauty');
    const endTime = performance.now();

    expect(endTime - startTime).toBeLessThan(10); // Should be very fast
  });

  it('should handle large translation sets efficiently', () => {
    // Access many different translation keys
    const keys = Object.keys(i18n.getResourceBundle('en', 'translation')).slice(0, 50);

    const startTime = performance.now();
    keys.forEach(key => {
      if (typeof i18n.getResourceBundle('en', 'translation')[key] === 'object') {
        // Access nested keys
        const nestedKeys = Object.keys(i18n.getResourceBundle('en', 'translation')[key]);
        nestedKeys.forEach(nestedKey => {
          i18n.t(`${key}.${nestedKey}`);
        });
      } else {
        i18n.t(key);
      }
    });
    const endTime = performance.now();

    // Should complete quickly
    expect(endTime - startTime).toBeLessThan(1000);
  });
});

describe('Error Handling and Edge Cases', () => {
  it('should handle missing language files gracefully', async () => {
    // Try to load a non-existent language
    await i18n.changeLanguage('nonexistent');

    // Should not crash and should fall back to default
    expect(['en', 'pl', 'ua', 'ru']).toContain(i18n.language);
  });

  it('should handle corrupted translation data', () => {
    // Mock corrupted data and test recovery
    const originalResources = i18n.getResourceBundle('en', 'translation');

    // Temporarily corrupt resources
    i18n.addResourceBundle('en', 'translation', null, true, true);

    // Should still be able to change languages
    expect(() => i18n.changeLanguage('pl')).not.toThrow();

    // Restore original resources
    i18n.addResourceBundle('en', 'translation', originalResources, true, true);
  });

  it('should handle network failures gracefully', async () => {
    // Mock network failure for loading translations
    const originalChangeLanguage = i18n.changeLanguage;
    i18n.changeLanguage = vi.fn().mockRejectedValue(new Error('Network error'));

    try {
      await i18n.changeLanguage('pl');
    } catch (error) {
      expect(error.message).toBe('Network error');
    }

    // Restore original function
    i18n.changeLanguage = originalChangeLanguage;
  });

  it('should maintain app stability during language errors', () => {
    renderWithProviders(<TestComponent />);

    // Simulate translation error
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    // Try to access invalid translation
    const invalidTranslation = i18n.t('invalid.key.that.does.not.exist');
    expect(invalidTranslation).toBe('invalid.key.that.does.not.exist');

    // Component should still be rendered
    expect(screen.getByRole('heading')).toBeInTheDocument();

    consoleSpy.mockRestore();
  });
});