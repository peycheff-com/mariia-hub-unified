# Multi-Language Implementation Guide

## Overview

This document provides comprehensive guidance for the multi-language implementation of Mariia Hub, targeting the Polish market with Ukrainian and Russian speakers.

## Table of Contents

1. [Architecture](#architecture)
2. [Supported Languages](#supported-languages)
3. [Language Detection](#language-detection)
4. [Language Switcher](#language-switcher)
5. [Translation Management](#translation-management)
6. [Email and SMS Templates](#email-and-sms-templates)
7. [Testing](#testing)
8. [Best Practices](#best-practices)
9. [Troubleshooting](#troubleshooting)

## Architecture

### Core Components

```
src/
├── i18n/
│   ├── config.ts              # i18next configuration
│   └── locales/
│       ├── en.json            # English translations (base)
│       ├── pl.json            # Polish translations
│       ├── ua.json            # Ukrainian translations
│       └── ru.json            # Russian translations
├── lib/
│   ├── i18n-utils.ts          # Utility functions and hooks
│   ├── advanced-language-detection.ts  # Smart language detection
│   ├── date-localization.ts   # Date/time formatting
│   ├── rtl-support.ts         # RTL language support
│   └── email-templates-new.ts # Multi-language templates
├── components/
│   ├── LanguageSwitcher.tsx   # Basic language switcher
│   └── EnhancedLanguageSwitcher.tsx  # Advanced switcher with detection
├── scripts/
│   └── validate-translations.js  # Translation validation tool
└── test/
    └── multi-language.test.ts  # Comprehensive tests
```

### Technology Stack

- **i18next**: Internationalization framework
- **react-i18next**: React bindings for i18next
- **i18next-browser-languagedetector**: Browser language detection
- **TypeScript**: Type safety for translation keys

## Supported Languages

| Language | Code | Locale | Currency | RTL | Market Focus |
|----------|-------|---------|----------|-----|-------------|
| English  | en    | en-GB   | PLN      | No  | International |
| Polish   | pl    | pl-PL   | PLN      | No  | Primary (Poland) |
| Ukrainian| ua    | uk-UA   | PLN      | No  | Polish market |
| Russian  | ru    | ru-RU   | PLN      | No  | Polish market |

## Language Detection

### Detection Methods (in order of priority)

1. **Saved Preference** (localStorage, cookies)
2. **Browser Language** (navigator.language)
3. **IP-based Location** (geolocation API)
4. **Timezone Detection** (Intl.DateTimeFormat)

### Advanced Detection Features

```typescript
// Import the detector
import { languageDetector } from '@/lib/advanced-language-detection';

// Detect language with all methods
const result = await languageDetector.detectLanguage({
  enableIPDetection: true,
  enableTimezoneDetection: true,
  enableBrowserDetection: true,
  fallbackLanguage: 'en',
  confidenceThreshold: 0.7
});

// Result structure
interface DetectionResult {
  detectedLanguage: string;
  confidence: number;
  method: 'browser' | 'localStorage' | 'ip' | 'timezone' | 'combined';
  metadata: {
    browserLanguages: string[];
    ipCountry?: string;
    timezone?: string;
    savedPreference?: string;
    reasons: string[];
  };
}
```

### Country to Language Mapping

| Country | Suggested Language | Confidence |
|---------|-------------------|-------------|
| PL      | pl                | 95%         |
| UA      | ua                | 95%         |
| RU      | ru                | 95%         |
| BY      | ru                | 90%         |
| MD      | ru                | 80%         |
| KZ      | ru                | 70%         |

## Language Switcher

### Basic Usage

```tsx
import LanguageSwitcher from '@/components/LanguageSwitcher';

function App() {
  return (
    <div>
      <LanguageSwitcher />
      {/* Your app content */}
    </div>
  );
}
```

### Enhanced Switcher with Detection

```tsx
import EnhancedLanguageSwitcher from '@/components/EnhancedLanguageSwitcher';

function App() {
  return (
    <div>
      <EnhancedLanguageSwitcher
        variant="default"
        showFlag={true}
        showNativeName={true}
        autoDetect={true}
      />
      {/* Your app content */}
    </div>
  );
}
```

### Switcher Variants

1. **default**: Dropdown menu with flags and names
2. **compact**: Minimal button with flag and code
3. **detailed**: Full language selection with suggestions

## Translation Management

### Adding New Translations

1. **Add to English Base** (`src/i18n/locales/en.json`):
   ```json
   {
     "newSection": {
       "newKey": "New translation text"
     }
   }
   ```

2. **Translate to All Languages**:
   - Polish: `src/i18n/locales/pl.json`
   - Ukrainian: `src/i18n/locales/ua.json`
   - Russian: `src/i18n/locales/ru.json`

3. **Validate Translations**:
   ```bash
   node scripts/validate-translations.js
   ```

### Translation Key Structure

Use dot notation for nested keys:
- `nav.beauty` (Navigation > Beauty)
- `user.dashboard.greetingMorning` (User > Dashboard > Morning Greeting)
- `booking.confirmation.success` (Booking > Confirmation > Success)

### Using Translations in Components

```tsx
import { useTranslation } from 'react-i18next';

function MyComponent() {
  const { t } = useTranslation();

  return (
    <div>
      <h1>{t('hero.title1')}</h1>
      <p>{t('user.dashboard.greetingMorning', { name: 'John' })}</p>
    </div>
  );
}
```

### Using the Enhanced i18n Hook

```tsx
import { useI18n } from '@/lib/i18n-utils';

function MyComponent() {
  const { t, formatDate, formatCurrency, currentLanguage } = useI18n();

  const date = new Date();
  const price = 100;

  return (
    <div>
      <p>{t('booking.date')}</p>
      <p>{formatDate(date)}</p>
      <p>{formatCurrency(price, 'PLN')}</p>
      <p>Current: {currentLanguage}</p>
    </div>
  );
}
```

## Email and SMS Templates

### Email Templates

Available templates:
- `bookingConfirmation`
- `bookingReminder`
- `welcomeEmail`

```tsx
import { getEmailTemplate } from '@/lib/email-templates-new';

// Get email template in current language
const template = getEmailTemplate('pl', 'bookingConfirmation', {
  clientName: 'Anna Kowalska',
  serviceName: 'Permanent Makeup - Lips',
  date: '15.01.2024',
  time: '14:00',
  location: 'Smolna 8, Warszawa',
  price: '800 PLN'
});

// Send email with template.subject, template.html, template.text
```

### SMS Templates

Available templates:
- `bookingConfirmation`
- `bookingReminder`
- `appointmentCancellation`

```tsx
import { getSMSTemplate } from '@/lib/email-templates-new';

// Get SMS template in current language
const sms = getSMSTemplate('ua', 'bookingReminder', {
  clientName: 'Олена Петренко',
  serviceName: 'Нарощення вій',
  date: '15.01.2024',
  time: '14:00'
});

// Send SMS with sms.text
```

## Locale-Specific Formatting

### Date Formatting

```typescript
import { createLocalizer } from '@/lib/date-localization';

const localizer = createLocalizer('pl');

// Format date
const date = localizer.formatDate(new Date(), {
  day: 'numeric',
  month: 'long',
  year: 'numeric'
});
// Output: "15 stycznia 2024"

// Format time
const time = localizer.formatTime(new Date());
// Output: "14:00"
```

### Currency Formatting

```typescript
import { useI18n } from '@/lib/i18n-utils';

function PriceDisplay({ amount }: { amount: number }) {
  const { formatCurrency } = useI18n();

  return (
    <span>{formatCurrency(amount, 'PLN')}</span>
  );
}

// Polish: "123,45 zł"
// Ukrainian: "123,45 грн" (if supported)
// Russian: "123,45 ₽" (if supported)
```

### Number Formatting

```typescript
const polishNumber = 1234.56.toLocaleString('pl-PL');
// Output: "1 234,56"

const ukrainianNumber = 1234.56.toLocaleString('uk-UA');
// Output: "1 234,56"
```

## Testing

### Running Tests

```bash
# Run all multi-language tests
npm run test multi-language.test.ts

# Run with coverage
npm run test -- --coverage multi-language.test.ts

# Validate translations
node scripts/validate-translations.js

# Generate missing translations report
node scripts/validate-translations.js --generate-report
```

### Test Coverage Areas

1. **Language Switcher Component**
   - Rendering with different variants
   - Language switching functionality
   - Preference persistence
   - Accessibility (ARIA labels)

2. **Language Detection**
   - Browser language detection
   - IP-based detection
   - Timezone detection
   - Combined detection with confidence scores

3. **Translation Coverage**
   - All required keys present
   - Consistent translations
   - Placeholder preservation
   - Pluralization rules

4. **Templates**
   - Email template generation
   - SMS template generation
   - Language-specific content

5. **Formatting**
   - Date/time formatting
   - Currency formatting
   - Number formatting

6. **Error Handling**
   - Missing translation keys
   - Network errors
   - Invalid locales

## Best Practices

### For Developers

1. **Always use translation keys**, never hardcode text
2. **Follow the dot notation** for nested keys
3. **Provide meaningful keys** that describe the content
4. **Test in all languages** when adding new features
5. **Validate translations** before committing

### For Translators

1. **Maintain consistent terminology** across all languages
2. **Keep similar tone and style** as the original
3. **Localize, don't just translate** (adapt to culture)
4. **Preserve placeholders** like `{{name}}` or `{{count}}`
5. **Test translations in context** of the UI

### Code Examples

✅ **Good:**
```tsx
// Use translation key
<h1>{t('hero.title')}</h1>

// Use interpolated translation
<p>{t('welcome.message', { name: userName })}</p>
```

❌ **Bad:**
```tsx
// Hardcoded text
<h1>Soft beauty.</h1>

// Direct interpolation without translation key
<p>Welcome, {userName}!</p>
```

### File Organization

```
src/i18n/locales/
├── en.json      # Base language (always keep up to date)
├── pl.json      # Polish translations
├── ua.json      # Ukrainian translations
└── ru.json      # Russian translations
```

### Key Naming Conventions

- **Use camelCase** for keys
- **Group related keys** with prefixes
- **Be descriptive** but concise
- **Use sections** for major features

Examples:
- `nav.beauty` ✅
- `nav_beauty` ❌
- `nb` ❌
- `navigation.beauty.menu.item` ❌ (too deep)

## Troubleshooting

### Common Issues

1. **Translation not showing**
   - Check if the key exists in all language files
   - Verify the key path is correct
   - Ensure i18n is properly initialized

2. **Language not persisting**
   - Check localStorage for 'preferred-language'
   - Ensure the language switcher saves the preference
   - Verify cookie is set if using server-side rendering

3. **IP detection not working**
   - Check network connection
   - Verify API endpoint is accessible
   - Check CORS settings if needed

4. **Placeholder issues**
   - Ensure placeholders match exactly between languages
   - Check for extra spaces or characters
   - Use the same placeholder names

### Debug Mode

Enable debug mode in i18next configuration:

```typescript
// src/i18n/config.ts
i18n.init({
  debug: process.env.NODE_ENV === 'development',
  // ... other config
});
```

### Validation Errors

Run the validation script to check for issues:

```bash
node scripts/validate-translations.js
```

Common validation errors:
- Missing keys in non-English languages
- Placeholder mismatches
- Translations too long
- HTML tag mismatches

### Performance Optimization

1. **Lazy load languages** if needed
2. **Cache detection results** (automatic)
3. **Use namespace splitting** for large translation files
4. **Minimize translation bundle size**

```typescript
// Example of namespace loading
import i18n from './i18n/config';

i18n.loadNamespaces('common', 'dashboard');
i18n.loadNamespaces('booking');
```

## Migration Guide

### Migrating from Hardcoded Text

1. **Identify all hardcoded strings**:
   ```bash
   grep -r "Hello World" src/ --include="*.tsx" --include="*.ts"
   ```

2. **Add to translation files**:
   ```json
   // en.json
   { "greeting": "Hello World" }

   // pl.json
   { "greeting": "Witaj Świecie" }
   ```

3. **Update component**:
   ```tsx
   // Before
   <h1>Hello World</h1>

   // After
   <h1>{t('greeting')}</h1>
   ```

### Adding a New Language

1. **Create new translation file**:
   ```bash
   cp src/i18n/locales/en.json src/i18n/locales/fr.json
   ```

2. **Update i18n config**:
   ```typescript
   // src/i18n/config.ts
   import fr from './locales/fr.json';

   i18n.init({
     resources: {
       en: { translation: en },
       pl: { translation: pl },
       ua: { translation: ua },
       ru: { translation: ru },
       fr: { translation: fr }, // Add new language
     },
     supportedLngs: ['en', 'pl', 'ua', 'ru', 'fr'], // Update supported languages
   });
   ```

3. **Update language switcher**:
   ```tsx
   // Add to languages array
   {
     code: 'fr',
     name: 'French',
     nativeName: 'Français',
     flag: '🇫🇷',
     rtl: false
   }
   ```

4. **Translate all content**:
   - Go through `fr.json`
   - Translate all keys
   - Run validation script

5. **Test thoroughly**:
   ```bash
   npm run test multi-language.test.ts
   node scripts/validate-translations.js
   ```

## Resources

### Documentation
- [i18next Documentation](https://www.i18next.com/)
- [React i18next Documentation](https://react.i18next.com/)
- [Browser Language Detection](https://github.com/i18next/i18next-browser-languageDetector)

### Tools
- [Translation Validation Script](/scripts/validate-translations.js)
- [i18n Scanner](https://github.com/i18next/i18next-scanner)
- [i18next Ally](https://github.com/i18next/i18next-ally) for testing

### Translation Services
- [Crowdin](https://crowdin.com/)
- [Lokalise](https://lokalise.com/)
- [POEditor](https://poeditor.com/)

## Support

For questions or issues with the multi-language implementation:

1. Check this documentation
2. Review the test files for examples
3. Run the validation script
4. Check browser console for debug information
5. Contact the development team

## Changelog

### v1.0.0 (2024-01-XX)
- Initial implementation
- Support for 4 languages (EN, PL, UA, RU)
- Advanced language detection
- Email and SMS templates
- Comprehensive testing suite
- Validation tools

---

*Last updated: January 2024*