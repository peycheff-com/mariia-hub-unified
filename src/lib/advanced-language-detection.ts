// Advanced Language Detection System
// Combines multiple detection methods for accurate language detection

import { languages } from './i18n-utils';

export interface DetectionResult {
  detectedLanguage: string;
  confidence: number;
  method: 'browser' | 'localStorage' | 'ip' | 'timezone' | 'navigator' | 'combined';
  metadata: {
    browserLanguages: string[];
    ipCountry?: string;
    timezone?: string;
    savedPreference?: string;
    reasons: string[];
  };
}

export interface LanguageDetectionOptions {
  enableIPDetection?: boolean;
  enableTimezoneDetection?: boolean;
  enableBrowserDetection?: boolean;
  fallbackLanguage?: string;
  confidenceThreshold?: number;
}

class AdvancedLanguageDetector {
  private cache: Map<string, DetectionResult> = new Map();
  private cacheExpiry = 5 * 60 * 1000; // 5 minutes

  async detectLanguage(options: LanguageDetectionOptions = {}): Promise<DetectionResult> {
    const {
      enableIPDetection = true,
      enableTimezoneDetection = true,
      enableBrowserDetection = true,
      fallbackLanguage = 'en',
      confidenceThreshold = 0.7,
    } = options;

    // Check cache first
    const cacheKey = JSON.stringify(options);
    const cached = this.cache.get(cacheKey);
    if (cached && Date.now() - cached.metadata.timestamp < this.cacheExpiry) {
      return cached;
    }

    const results: Array<{ language: string; confidence: number; method: string; reasons: string[] }> = [];

    // 1. Check saved preference (highest confidence)
    const savedLanguage = this.getSavedLanguage();
    if (savedLanguage) {
      results.push({
        language: savedLanguage,
        confidence: 1.0,
        method: 'localStorage',
        reasons: ['User preference saved in localStorage'],
      });
    }

    // 2. Browser language detection
    if (enableBrowserDetection) {
      const browserDetection = this.detectFromBrowser();
      if (browserDetection) {
        results.push(browserDetection);
      }
    }

    // 3. IP-based country detection
    if (enableIPDetection) {
      try {
        const ipDetection = await this.detectFromIP();
        if (ipDetection) {
          results.push(ipDetection);
        }
      } catch (error) {
        console.warn('IP detection failed:', error);
      }
    }

    // 4. Timezone detection
    if (enableTimezoneDetection) {
      const timezoneDetection = this.detectFromTimezone();
      if (timezoneDetection) {
        results.push(timezoneDetection);
      }
    }

    // Combine results
    const finalResult = this.combineResults(results, fallbackLanguage);

    // Cache the result
    finalResult.metadata.timestamp = Date.now();
    this.cache.set(cacheKey, finalResult);

    return finalResult;
  }

  private getSavedLanguage(): string | null {
    // Check multiple storage locations
    const sources = [
      localStorage.getItem('preferred-language'),
      localStorage.getItem('i18nextLng'),
      this.getCookie('i18next'),
      sessionStorage.getItem('preferred-language'),
    ];

    for (const source of sources) {
      if (source && languages.some(lang => lang.code === source)) {
        return source;
      }
    }

    return null;
  }

  private detectFromBrowser(): { language: string; confidence: number; method: string; reasons: string[] } | null {
    if (typeof navigator === 'undefined') return null;

    const browserLanguages = [
      navigator.language,
      ...(navigator.languages || []),
      // @ts-ignore - legacy support
      navigator.userLanguage,
      // @ts-ignore - legacy support
      navigator.browserLanguage,
      // @ts-ignore - legacy support
      navigator.systemLanguage,
    ].filter(Boolean);

    if (browserLanguages.length === 0) return null;

    // Find best match
    for (const browserLang of browserLanguages) {
      const normalizedLang = browserLang.toLowerCase().split('-')[0];

      // Direct match
      const directMatch = languages.find(lang => lang.code === normalizedLang);
      if (directMatch) {
        return {
          language: directMatch.code,
          confidence: 0.9,
          method: 'browser',
          reasons: [`Browser language matches: ${browserLang}`],
        };
      }

      // Regional match
      const regionalMatch = languages.find(lang =>
        browserLang.toLowerCase().startsWith(lang.code) ||
        lang.code === normalizedLang
      );
      if (regionalMatch) {
        return {
          language: regionalMatch.code,
          confidence: 0.8,
          method: 'browser',
          reasons: [`Browser language regional match: ${browserLang}`],
        };
      }
    }

    return null;
  }

  private async detectFromIP(): Promise<{ language: string; confidence: number; method: string; reasons: string[] } | null> {
    try {
      // Try multiple geolocation services in parallel
      const services = [
        {
          url: 'https://ipapi.co/json/',
          parser: (data: any) => ({ country: data.country_code, city: data.city }),
        },
        {
          url: 'https://api.ipify.org?format=json',
          parser: async (data: any) => {
            // Second request to get country
            const response = await fetch(`https://ipapi.co/${data.ip}/json/`);
            const countryData = await response.json();
            return { country: countryData.country_code, city: countryData.city };
          },
        },
        {
          url: 'https://geo.ipify.org/api/v2/country',
          parser: (data: any) => ({ country: data.location.country, city: data.location.city }),
        },
      ];

      const results = await Promise.allSettled(
        services.map(async (service) => {
          const response = await fetch(service.url, {
            signal: AbortSignal.timeout(3000),
          });
          const data = await response.json();
          return service.parser(data);
        })
      );

      // Get first successful result
      for (const result of results) {
        if (result.status === 'fulfilled' && result.value?.country) {
          const { country, city } = result.value;

          // Map country to language
          const languageMap: Record<string, { code: string; confidence: number }> = {
            PL: { code: 'pl', confidence: 0.95 },
            UA: { code: 'ua', confidence: 0.95 },
            RU: { code: 'ru', confidence: 0.95 },
            BY: { code: 'ru', confidence: 0.9 },
            MD: { code: 'ru', confidence: 0.8 },
            KZ: { code: 'ru', confidence: 0.7 },
            LT: { code: 'pl', confidence: 0.6 },
            LV: { code: 'pl', confidence: 0.6 },
            EE: { code: 'pl', confidence: 0.6 },
          };

          const mapped = languageMap[country];
          if (mapped) {
            return {
              language: mapped.code,
              confidence: mapped.confidence,
              method: 'ip',
              reasons: [`IP-based detection: ${country}${city ? `, ${city}` : ''}`],
            };
          }
        }
      }
    } catch (error) {
      console.warn('IP detection failed:', error);
    }

    return null;
  }

  private detectFromTimezone(): { language: string; confidence: number; method: string; reasons: string[] } | null {
    if (typeof Intl === 'undefined') return null;

    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (!timezone) return null;

    // Map timezone to language
    const timezoneMap: Record<string, { code: string; confidence: number }> = {
      'Europe/Warsaw': { code: 'pl', confidence: 0.85 },
      'Europe/Kyiv': { code: 'ua', confidence: 0.85 },
      'Europe/Moscow': { code: 'ru', confidence: 0.85 },
      'Europe/Minsk': { code: 'ru', confidence: 0.8 },
      'Europe/Kaliningrad': { code: 'ru', confidence: 0.7 },
      'Asia/Yekaterinburg': { code: 'ru', confidence: 0.6 },
      'Asia/Omsk': { code: 'ru', confidence: 0.6 },
    };

    // Check for partial matches
    for (const [tz, mapping] of Object.entries(timezoneMap)) {
      if (timezone.includes(tz) || tz.includes(timezone)) {
        return {
          language: mapping.code,
          confidence: mapping.confidence,
          method: 'timezone',
          reasons: [`Timezone-based detection: ${timezone}`],
        };
      }
    }

    return null;
  }

  private combineResults(
    results: Array<{ language: string; confidence: number; method: string; reasons: string[] }>,
    fallbackLanguage: string
  ): DetectionResult {
    if (results.length === 0) {
      return {
        detectedLanguage: fallbackLanguage,
        confidence: 0.5,
        method: 'combined',
        metadata: {
          browserLanguages: [],
          reasons: ['No detection signals available, using fallback'],
        },
      };
    }

    // Group by language and sum confidence
    const languageScores = new Map<string, { confidence: number; methods: string[]; reasons: string[] }>();

    for (const result of results) {
      const existing = languageScores.get(result.language) || {
        confidence: 0,
        methods: [],
        reasons: [],
      };

      existing.confidence = Math.min(existing.confidence + result.confidence * 0.3, 1);
      existing.methods.push(result.method);
      existing.reasons.push(...result.reasons);

      languageScores.set(result.language, existing);
    }

    // Find language with highest confidence
    let bestLanguage = fallbackLanguage;
    let bestScore = 0.5;

    for (const [language, score] of languageScores) {
      if (score.confidence > bestScore) {
        bestLanguage = language;
        bestScore = score.confidence;
      }
    }

    const winner = languageScores.get(bestLanguage);

    return {
      detectedLanguage: bestLanguage,
      confidence: bestScore,
      method: 'combined',
      metadata: {
        browserLanguages: typeof navigator !== 'undefined' ? navigator.languages || [] : [],
        reasons: winner?.reasons || ['Combined detection results'],
        savedPreference: this.getSavedLanguage() || undefined,
        methods: winner?.methods || [],
      },
    };
  }

  private getCookie(name: string): string | null {
    if (typeof document === 'undefined') return null;

    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);

    if (parts.length === 2) {
      return parts.pop()?.split(';').shift() || null;
    }

    return null;
  }

  // Public utility methods
  async suggestLanguage(options?: LanguageDetectionOptions): Promise<{
    suggested: string;
    current: string;
    shouldShowSuggestion: boolean;
    confidence: number;
    reason: string;
  }> {
    const detection = await this.detectLanguage(options);
    const current = this.getSavedLanguage() || 'en';

    return {
      suggested: detection.detectedLanguage,
      current,
      shouldShowSuggestion: detection.detectedLanguage !== current && detection.confidence > 0.7,
      confidence: detection.confidence,
      reason: detection.metadata.reasons.join(', '),
    };
  }

  clearCache(): void {
    this.cache.clear();
  }

  // Analytics helper
  trackDetection(result: DetectionResult): void {
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'language_detection', {
        detected_language: result.detectedLanguage,
        confidence: Math.round(result.confidence * 100),
        method: result.method,
        number_of_signals: result.metadata.reasons.length,
      });
    }
  }
}

// Export singleton instance
export const languageDetector = new AdvancedLanguageDetector();

// Export React hook
export function useLanguageDetection(options?: LanguageDetectionOptions) {
  const [detection, setDetection] = React.useState<DetectionResult | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    setLoading(true);
    setError(null);

    languageDetector
      .detectLanguage(options)
      .then((result) => {
        setDetection(result);
        languageDetector.trackDetection(result);
      })
      .catch((err) => {
        setError(err.message || 'Detection failed');
      })
      .finally(() => {
        setLoading(false);
      });
  }, [JSON.stringify(options)]);

  return { detection, loading, error };
}

// Export convenience functions
export async function detectAndApplyLanguage(options?: LanguageDetectionOptions): Promise<string> {
  const result = await languageDetector.detectLanguage(options);

  // Only apply if confidence is high enough
  if (result.confidence > 0.7) {
    return result.detectedLanguage;
  }

  return options?.fallbackLanguage || 'en';
}

export default AdvancedLanguageDetector;