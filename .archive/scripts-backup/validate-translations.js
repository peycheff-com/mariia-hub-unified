#!/usr/bin/env node

/**
 * Translation Validation Script
 * Validates translation files for completeness, consistency, and quality
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const localesDir = path.resolve(__dirname, '../src/i18n/locales');

// Configuration
const config = {
  baseLanguage: 'en',
  supportedLanguages: ['en', 'pl', 'ua', 'ru'],
  requiredKeys: [
    'nav',
    'hero',
    'about',
    'beautySection',
    'fitnessSection',
    'blogSection',
    'contactSection',
    'auth',
    'dashboard',
    'admin',
    'pwa',
    'offline',
    'calendar',
    'qr',
    'user',
    'search',
    'comparison',
    'footer',
    'common'
  ],
  ignoredKeys: [
    // Add keys that should be ignored during validation
  ],
  warnings: {
    maxLength: 200, // Max characters for translation strings
    minLength: 1,   // Min characters for translation strings
    checkEmpty: true,
    checkPlaceholders: true,
    checkHtml: true,
    checkSimilarity: true,
    similarityThreshold: 0.9 // For detecting untranslated copies
  }
};

// Color codes for console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// Load and parse translation files
function loadTranslationFile(language) {
  const filePath = path.join(localesDir, `${language}.json`);

  if (!fs.existsSync(filePath)) {
    log(`❌ Translation file not found: ${filePath}`, 'red');
    process.exit(1);
  }

  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(content);
  } catch (error) {
    log(`❌ Error parsing ${filePath}: ${error.message}`, 'red');
    process.exit(1);
  }
}

// Get all keys from a nested object
function getAllKeys(obj, prefix = '') {
  const keys = [];

  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      const fullKey = prefix ? `${prefix}.${key}` : key;

      if (typeof obj[key] === 'object' && obj[key] !== null) {
        keys.push(...getAllKeys(obj[key], fullKey));
      } else {
        keys.push(fullKey);
      }
    }
  }

  return keys.sort();
}

// Check if a string contains placeholders
function hasPlaceholders(str) {
  const placeholderPattern = /\{\{[^}]+\}\}/g;
  return placeholderPattern.test(str);
}

// Extract placeholders from a string
function extractPlaceholders(str) {
  const placeholderPattern = /\{\{([^}]+)\}\}/g;
  const placeholders = [];
  let match;

  while ((match = placeholderPattern.exec(str)) !== null) {
    placeholders.push(match[1]);
  }

  return placeholders;
}

// Calculate similarity between two strings
function calculateSimilarity(str1, str2) {
  const longer = str1.length > str2.length ? str1 : str2;
  const shorter = str1.length > str2.length ? str2 : str1;

  if (longer.length === 0) return 1.0;

  const editDistance = levenshteinDistance(longer, shorter);
  return (longer.length - editDistance) / longer.length;
}

// Levenshtein distance algorithm
function levenshteinDistance(str1, str2) {
  const matrix = [];

  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }

  return matrix[str2.length][str1.length];
}

// Validate a translation file
function validateTranslation(language, translations, baseTranslations) {
  const errors = [];
  const warnings = [];
  const stats = {
    totalKeys: 0,
    translatedKeys: 0,
    emptyKeys: 0,
    longKeys: 0,
    placeholderErrors: 0,
    similarKeys: 0
  };

  const baseKeys = getAllKeys(baseTranslations);
  const translationKeys = getAllKeys(translations);

  // Check for missing keys
  for (const key of baseKeys) {
    if (!translationKeys.includes(key)) {
      errors.push(`Missing translation key: ${key}`);
    }
  }

  // Check for extra keys
  for (const key of translationKeys) {
    if (!baseKeys.includes(key)) {
      warnings.push(`Extra translation key: ${key}`);
    }
  }

  // Validate each translation
  for (const key of baseKeys) {
    stats.totalKeys++;

    const baseValue = getNestedValue(baseTranslations, key);
    const translationValue = getNestedValue(translations, key);

    if (!translationValue) {
      errors.push(`Missing translation for: ${key}`);
      continue;
    }

    stats.translatedKeys++;

    // Check for empty translations
    if (config.warnings.checkEmpty && !translationValue.trim()) {
      warnings.push(`Empty translation for: ${key}`);
      stats.emptyKeys++;
    }

    // Check length
    if (translationValue.length > config.warnings.maxLength) {
      warnings.push(`Translation too long for ${key}: ${translationValue.length} chars (max: ${config.warnings.maxLength})`);
      stats.longKeys++;
    }

    // Check placeholders
    if (config.warnings.checkPlaceholders && hasPlaceholders(baseValue)) {
      const basePlaceholders = extractPlaceholders(baseValue);
      const translationPlaceholders = extractPlaceholders(translationValue);

      if (basePlaceholders.length !== translationPlaceholders.length) {
        errors.push(`Placeholder count mismatch for ${key}: expected ${basePlaceholders.length}, found ${translationPlaceholders.length}`);
        stats.placeholderErrors++;
      } else {
        for (const placeholder of basePlaceholders) {
          if (!translationPlaceholders.includes(placeholder)) {
            errors.push(`Missing placeholder '${placeholder}' in translation for: ${key}`);
            stats.placeholderErrors++;
          }
        }
      }
    }

    // Check for similarity (possible untranslated copy)
    if (config.warnings.checkSimilarity && language !== config.baseLanguage) {
      const similarity = calculateSimilarity(baseValue, translationValue);
      if (similarity > config.warnings.similarityThreshold) {
        warnings.push(`Translation for ${key} is very similar to base text (${Math.round(similarity * 100)}% match)`);
        stats.similarKeys++;
      }
    }

    // Check HTML tags (basic validation)
    if (config.warnings.checkHtml) {
      const baseTags = (baseValue.match(/<[^>]+>/g) || []).sort();
      const translationTags = (translationValue.match(/<[^>]+>/g) || []).sort();

      if (baseTags.length !== translationTags.length) {
        warnings.push(`HTML tag count mismatch for ${key}: expected ${baseTags.length}, found ${translationTags.length}`);
      }
    }
  }

  return { errors, warnings, stats };
}

// Get nested value from object using dot notation
function getNestedValue(obj, path) {
  return path.split('.').reduce((current, key) => current && current[key], obj);
}

// Main validation function
function runValidation() {
  log('\n🔍 Translation Validation Report', 'cyan');
  log('================================', 'cyan');

  const results = {};
  let hasErrors = false;

  // Load base language
  const baseTranslations = loadTranslationFile(config.baseLanguage);
  log(`\n✓ Loaded base language: ${config.baseLanguage}`, 'green');

  // Validate each supported language
  for (const language of config.supportedLanguages) {
    if (language === config.baseLanguage) continue;

    log(`\n🔍 Validating language: ${language}`, 'blue');
    log('----------------------------', 'blue');

    const translations = loadTranslationFile(language);
    const result = validateTranslation(language, translations, baseTranslations);
    results[language] = result;

    // Print results
    if (result.errors.length > 0) {
      hasErrors = true;
      log(`\n❌ Errors (${result.errors.length}):`, 'red');
      result.errors.forEach(error => log(`  - ${error}`, 'red'));
    }

    if (result.warnings.length > 0) {
      log(`\n⚠️  Warnings (${result.warnings.length}):`, 'yellow');
      result.warnings.forEach(warning => log(`  - ${warning}`, 'yellow'));
    }

    if (result.errors.length === 0 && result.warnings.length === 0) {
      log('✅ All translations look good!', 'green');
    }

    // Print stats
    log(`\n📊 Statistics:`, 'cyan');
    log(`  Total keys: ${result.stats.totalKeys}`, 'white');
    log(`  Translated: ${result.stats.translatedKeys}`, 'white');
    log(`  Empty: ${result.stats.emptyKeys}`, 'white');
    log(`  Too long: ${result.stats.longKeys}`, 'white');
    log(`  Placeholder errors: ${result.stats.placeholderErrors}`, 'white');
    log(`  Similar to base: ${result.stats.similarKeys}`, 'white');
  }

  // Generate summary
  log('\n📋 Summary', 'magenta');
  log('=============', 'magenta');

  for (const language of config.supportedLanguages) {
    if (language === config.baseLanguage) continue;

    const result = results[language];
    const score = result.stats.translatedKeys / result.stats.totalKeys;
    const scorePercent = Math.round(score * 100);

    let status = '✅';
    let color = 'green';
    if (result.errors.length > 0) {
      status = '❌';
      color = 'red';
    } else if (result.warnings.length > 0) {
      status = '⚠️';
      color = 'yellow';
    }

    log(`${status} ${language}: ${scorePercent}% complete`, color);
  }

  // Exit with error code if there are errors
  if (hasErrors) {
    log('\n❌ Validation failed with errors', 'red');
    process.exit(1);
  } else {
    log('\n✅ All translations validated successfully!', 'green');
  }
}

// Check for required sections
function validateRequiredSections() {
  log('\n🔍 Checking required sections...', 'blue');

  const baseTranslations = loadTranslationFile(config.baseLanguage);
  const baseSections = Object.keys(baseTranslations);

  for (const section of config.requiredKeys) {
    if (!baseSections.includes(section)) {
      log(`⚠️  Required section '${section}' not found in base language`, 'yellow');
    }
  }

  log('✅ Required sections check complete', 'green');
}

// Generate missing translations report
function generateMissingReport() {
  log('\n📝 Generating missing translations report...', 'blue');

  const baseTranslations = loadTranslationFile(config.baseLanguage);
  const report = {};

  for (const language of config.supportedLanguages) {
    if (language === config.baseLanguage) continue;

    const translations = loadTranslationFile(language);
    const baseKeys = getAllKeys(baseTranslations);
    const translationKeys = getAllKeys(translations);
    const missingKeys = baseKeys.filter(key => !translationKeys.includes(key));

    if (missingKeys.length > 0) {
      report[language] = missingKeys;
      log(`\n${language}: ${missingKeys.length} missing keys`, 'yellow');
    }
  }

  // Save report to file
  const reportPath = path.join(__dirname, '../missing-translations-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  log(`\n📄 Report saved to: ${reportPath}`, 'green');
}

// Command line arguments
const args = process.argv.slice(2);
const options = {
  checkRequired: args.includes('--check-required'),
  generateReport: args.includes('--generate-report'),
  help: args.includes('--help') || args.includes('-h')
};

if (options.help) {
  log('\nTranslation Validation Script', 'cyan');
  log('==============================\n', 'cyan');
  log('Usage: node validate-translations.js [options]\n', 'white');
  log('Options:', 'white');
  log('  --check-required    Check for required sections only', 'white');
  log('  --generate-report   Generate missing translations report', 'white');
  log('  --help, -h          Show this help message\n', 'white');
  process.exit(0);
}

// Run validation based on options
if (options.checkRequired) {
  validateRequiredSections();
} else if (options.generateReport) {
  generateMissingReport();
} else {
  validateRequiredSections();
  runValidation();
}