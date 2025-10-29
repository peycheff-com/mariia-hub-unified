// RTL utilities for testing and handling right-to-left languages

import { useEffect, useState } from 'react';

export interface RTLConfig {
  language: string;
  isRTL: boolean;
  direction: 'ltr' | 'rtl';
  textAlign: 'left' | 'right';
  fontFamily: string;
  flipIcons: boolean;
  mirrorAnimations: boolean;
}

// RTL language configurations
const RTL_CONFIGS: Record<string, RTLConfig> = {
  ar: {
    language: 'ar',
    isRTL: true,
    direction: 'rtl',
    textAlign: 'right',
    fontFamily: 'Noto Sans Arabic, sans-serif',
    flipIcons: true,
    mirrorAnimations: false
  },
  he: {
    language: 'he',
    isRTL: true,
    direction: 'rtl',
    textAlign: 'right',
    fontFamily: 'Noto Sans Hebrew, sans-serif',
    flipIcons: true,
    mirrorAnimations: false
  },
  fa: {
    language: 'fa',
    isRTL: true,
    direction: 'rtl',
    textAlign: 'right',
    fontFamily: 'Noto Sans Arabic, sans-serif',
    flipIcons: true,
    mirrorAnimations: false
  },
  ur: {
    language: 'ur',
    isRTL: true,
    direction: 'rtl',
    textAlign: 'right',
    fontFamily: 'Noto Nastaliq Urdu, sans-serif',
    flipIcons: true,
    mirrorAnimations: false
  },
  // LTR languages for comparison
  en: {
    language: 'en',
    isRTL: false,
    direction: 'ltr',
    textAlign: 'left',
    fontFamily: 'Inter, sans-serif',
    flipIcons: false,
    mirrorAnimations: true
  },
  pl: {
    language: 'pl',
    isRTL: false,
    direction: 'ltr',
    textAlign: 'left',
    fontFamily: 'Inter, sans-serif',
    flipIcons: false,
    mirrorAnimations: true
  },
  ua: {
    language: 'ua',
    isRTL: false,
    direction: 'ltr',
    textAlign: 'left',
    fontFamily: 'Inter, sans-serif',
    flipIcons: false,
    mirrorAnimations: true
  },
  ru: {
    language: 'ru',
    isRTL: false,
    direction: 'ltr',
    textAlign: 'left',
    fontFamily: 'Inter, sans-serif',
    flipIcons: false,
    mirrorAnimations: true
  }
};

// Test component for RTL issues
export function useRTLTester(language: string) {
  const [testResults, setTestResults] = useState<any[]>([]);
  const [isTesting, setIsTesting] = useState(false);

  const config = RTL_CONFIGS[language] || RTL_CONFIGS.en;

  const runRTLTests = () => {
    setIsTesting(true);
    const results = [];

    // Test 1: Direction attribute
    const directionTest = testDirectionAttribute(config.direction);
    results.push({
      test: 'Direction Attribute',
      passed: directionTest.passed,
      details: directionTest.details
    });

    // Test 2: Text alignment
    const alignmentTest = testTextAlignment(config.textAlign);
    results.push({
      test: 'Text Alignment',
      passed: alignmentTest.passed,
      details: alignmentTest.details
    });

    // Test 3: Icon mirroring
    const iconTest = testIconMirroring(config.flipIcons);
    results.push({
      test: 'Icon Mirroring',
      passed: iconTest.passed,
      details: iconTest.details
    });

    // Test 4: Font loading
    const fontTest = testFontLoading(config.fontFamily);
    results.push({
      test: 'Font Loading',
      passed: fontTest.passed,
      details: fontTest.details
    });

    // Test 5: Layout overflow
    const layoutTest = testLayoutOverflow();
    results.push({
      test: 'Layout Overflow',
      passed: layoutTest.passed,
      details: layoutTest.details
    });

    // Test 6: Padding and margins
    const spacingTest = testSpacingDirection();
    results.push({
      test: 'Spacing Direction',
      passed: spacingTest.passed,
      details: spacingTest.details
    });

    setTestResults(results);
    setIsTesting(false);
  };

  const testDirectionAttribute = (expected: 'ltr' | 'rtl') => {
    const html = document.documentElement;
    const actual = html.getAttribute('dir');
    return {
      passed: actual === expected,
      details: `Expected: ${expected}, Actual: ${actual}`
    };
  };

  const testTextAlignment = (expected: 'left' | 'right') => {
    const body = document.body;
    const computed = getComputedStyle(body);
    const actual = computed.textAlign;
    return {
      passed: actual === expected || actual === 'start' || actual === 'auto',
      details: `Expected: ${expected}, Actual: ${actual}`
    };
  };

  const testIconMirroring = (shouldMirror: boolean) => {
    const icons = document.querySelectorAll('[data-rtl-flip]');
    let passed = true;
    const details = [];

    icons.forEach((icon, index) => {
      const computed = getComputedStyle(icon);
      const transform = computed.transform;

      if (shouldMirror && !transform.includes('scaleX(-1)')) {
        passed = false;
        details.push(`Icon ${index} should be mirrored but isn't`);
      } else if (!shouldMirror && transform.includes('scaleX(-1)')) {
        passed = false;
        details.push(`Icon ${index} is mirrored but shouldn't be`);
      }
    });

    return {
      passed,
      details: details.join('; ') || `${icons.length} icons checked`
    };
  };

  const testFontLoading = (fontFamily: string) => {
    return new Promise((resolve) => {
      const testFont = fontFamily.split(',')[0];
      const testString = 'abcdefghijklmnopqrstuvwxyz';

      // Create test elements
      const testElement = document.createElement('span');
      testElement.style.fontFamily = 'monospace';
      testElement.style.fontSize = '72px';
      testElement.style.visibility = 'hidden';
      testElement.textContent = testString;
      document.body.appendChild(testElement);

      const initialWidth = testElement.offsetWidth;

      testElement.style.fontFamily = `${testFont}, monospace`;

      setTimeout(() => {
        const finalWidth = testElement.offsetWidth;
        document.body.removeChild(testElement);

        resolve({
          passed: finalWidth !== initialWidth,
          details: `Font ${testFont} is ${finalWidth !== initialWidth ? 'loaded' : 'not loaded'}`
        });
      }, 100);
    });
  };

  const testLayoutOverflow = () => {
    const containers = document.querySelectorAll('.rtl-test-container');
    let passed = true;
    const details = [];

    containers.forEach((container, index) => {
      const hasOverflow = container.scrollWidth > container.clientWidth;
      if (hasOverflow) {
        passed = false;
        details.push(`Container ${index} has horizontal overflow`);
      }
    });

    return {
      passed,
      details: details.join('; ') || `${containers.length} containers checked`
    };
  };

  const testSpacingDirection = () => {
    const elements = document.querySelectorAll('[data-rtl-spacing]');
    let passed = true;
    const details = [];

    elements.forEach((element, index) => {
      const computed = getComputedStyle(element);
      const paddingLeft = parseInt(computed.paddingLeft);
      const paddingRight = parseInt(computed.paddingRight);

      const config = RTL_CONFIGS[language] || RTL_CONFIGS.en;
      const expectedLarger = config.isRTL ? paddingRight : paddingLeft;

      if (expectedLarger <= 0) {
        passed = false;
        details.push(`Element ${index} has insufficient padding`);
      }
    });

    return {
      passed,
      details: details.join('; ') || `${elements.length} elements checked`
    };
  };

  return {
    config,
    testResults,
    isTesting,
    runTests: runRTLTests
  };
}

// React hook for RTL support
export function useRTLSupport(language: string) {
  const config = RTL_CONFIGS[language] || RTL_CONFIGS.en;

  useEffect(() => {
    // Apply RTL styles to document
    const html = document.documentElement;
    const body = document.body;

    // Set direction
    html.setAttribute('dir', config.direction);
    html.setAttribute('lang', language);

    // Set text alignment
    body.style.textAlign = config.textAlign;

    // Set font family
    body.style.fontFamily = config.fontFamily;

    // Add CSS custom properties for dynamic values
    html.style.setProperty('--text-direction', config.direction);
    html.style.setProperty('--text-align', config.textAlign);
    html.style.setProperty('--font-family', config.fontFamily);

    // Add RTL class for CSS targeting
    if (config.isRTL) {
      html.classList.add('rtl');
      html.classList.remove('ltr');
    } else {
      html.classList.add('ltr');
      html.classList.remove('rtl');
    }

    // Track for analytics
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'rtl_language_detected', {
        language,
        isRTL: config.isRTL,
        direction: config.direction
      });
    }
  }, [language, config]);

  return {
    isRTL: config.isRTL,
    direction: config.direction,
    textAlign: config.textAlign,
    fontFamily: config.fontFamily,
    shouldMirrorIcons: config.flipIcons,
    shouldMirrorAnimations: config.mirrorAnimations,

    // Helper functions
    getDirectionalStyle: (ltr: any, rtl: any) => config.isRTL ? rtl : ltr,
    getDirectionalValue: (ltr: any, rtl: any) => config.isRTL ? rtl : ltr,
    getSpacing: (left: number, right: number) => ({
      paddingLeft: config.isRTL ? right : left,
      paddingRight: config.isRTL ? left : right,
      marginLeft: config.isRTL ? right : left,
      marginRight: config.isRTL ? left : right
    }),
    getBorder: (left: any, right: any) => ({
      borderLeft: config.isRTL ? right : left,
      borderRight: config.isRTL ? left : right
    })
  };
}

// Cultural adaptation utilities
export const culturalAdaptations = {
  // Reading patterns
  getReadingDirection: (language: string) => {
    const config = RTL_CONFIGS[language];
    return config?.direction || 'ltr';
  },

  // Number formatting for RTL languages
  formatNumberRTL: (number: number, language: string): string => {
    const config = RTL_CONFIGS[language];
    if (!config?.isRTL) return number.toString();

    // Arabic uses different digits
    if (language === 'ar') {
      const arabicDigits = '٠١٢٣٤٥٦٧٨٩';
      const westernDigits = '0123456789';
      return number.toString().replace(/[0-9]/g, (digit) => {
        return arabicDigits[westernDigits.indexOf(digit)] || digit;
      });
    }

    return number.toString();
  },

  // Date formatting for cultural calendars
  formatDateCultural: (date: Date, language: string): string => {
    switch (language) {
      case 'ar':
        return new Intl.DateTimeFormat('ar-SA', {
          calendar: 'islamic',
          dateStyle: 'full'
        }).format(date);

      case 'he':
        return new Intl.DateTimeFormat('he-IL', {
          calendar: 'hebrew',
          dateStyle: 'full'
        }).format(date);

      default:
        return new Intl.DateTimeFormat(language, {
          dateStyle: 'full'
        }).format(date);
    }
  },

  // Cultural color preferences
  getCulturalColors: (language: string) => {
    const colorSchemes: Record<string, any> = {
      ar: {
        primary: '#2D5F7F', // Deep blue
        secondary: '#B8860B', // Dark goldenrod
        accent: '#1E4E2B', // Forest green
        background: '#FFF5EE', // Seashell
        text: '#2C1810' // Dark brown
      },
      he: {
        primary: '#0038A8', // Israeli blue
        secondary: '#FFFFFF', // White
        accent: '#079540', // Israeli green
        background: '#F0F0F0', // Light gray
        text: '#333333' // Dark gray
      },
      // Default LTR colors
      default: {
        primary: '#8B4513', // Cocoa
        secondary: '#F5DEB3', // Champagne
        accent: '#D2691E', // Chocolate
        background: '#FFFAFA', // Floral white
        text: '#2C1810' // Dark brown
      }
    };

    return colorSchemes[language] || colorSchemes.default;
  },

  // Check for cultural sensitivities
  checkCulturalSensitivities: (content: string, targetLanguage: string) => {
    const sensitivities: Record<string, RegExp[]> = {
      ar: [
        /alcohol|wine|beer/i,
        /pork|bacon|ham/i,
        /dating|romance/i
      ],
      he: [
        /saturday|shabbat/i,
        /pork|bacon|ham/i,
        /unleavened|bread/i
      ],
      // Add more as needed
    };

    const patterns = sensitivities[targetLanguage];
    if (!patterns) return { hasSensitive: false, matches: [] };

    const matches = patterns.map(pattern => {
      const match = content.match(pattern);
      return match ? match[0] : null;
    }).filter(Boolean);

    return {
      hasSensitive: matches.length > 0,
      matches
    };
  }
};

// RTL testing component
export const RTLTestSuite = ({ language }: { language: string }) => {
  const { config, testResults, isTesting, runTests } = useRTLTester(language);

  return (
    <div className="p-4 space-y-4" dir={config.direction}>
      <h2 className="text-xl font-bold mb-4">RTL Test Suite - {language}</h2>

      <button
        onClick={runTests}
        disabled={isTesting}
        className="px-4 py-2 bg-blue-500 text-white rounded"
      >
        {isTesting ? 'Testing...' : 'Run Tests'}
      </button>

      {testResults.length > 0 && (
        <div className="space-y-2">
          {testResults.map((result, index) => (
            <div
              key={index}
              className={`p-3 border rounded ${
                result.passed ? 'bg-green-50 border-green-500' : 'bg-red-50 border-red-500'
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="font-medium">{result.test}:</span>
                <span className={result.passed ? 'text-green-600' : 'text-red-600'}>
                  {result.passed ? '✓ PASSED' : '✗ FAILED'}
                </span>
              </div>
              <p className="text-sm text-gray-600">{result.details}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default {
  RTL_CONFIGS,
  useRTLSupport,
  useRTLTester,
  culturalAdaptations,
  RTLTestSuite
};