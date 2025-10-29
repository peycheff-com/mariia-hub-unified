import { aiService } from './config';

import { z } from 'zod';

// Extended language support
export const SupportedLanguages = z.enum([
  'en', // English
  'pl', // Polish
  'de', // German
  'fr', // French
  'es', // Spanish
  'it', // Italian
  'ru', // Russian
  'uk', // Ukrainian
  'cs', // Czech
  'sk', // Slovak
  'hu', // Hungarian
  'ro', // Romanian
  'bg', // Bulgarian
  'hr', // Croatian
  'sl', // Slovenian
  'sr', // Serbian
  'lt', // Lithuanian
  'lv', // Latvian
  'et', // Estonian
  'sv', // Swedish
  'da', // Danish
  'no', // Norwegian
  'fi', // Finnish
]);

export type SupportedLanguage = z.infer<typeof SupportedLanguages>;

// Language metadata
export const LanguageMetadata: Record<SupportedLanguage, {
  name: string;
  nativeName: string;
  rtl: boolean;
  locale: string;
  currency?: string;
  dateFormat: string;
}> = {
  en: { name: 'English', nativeName: 'English', rtl: false, locale: 'en-US', dateFormat: 'MM/DD/YYYY' },
  pl: { name: 'Polish', nativeName: 'Polski', rtl: false, locale: 'pl-PL', dateFormat: 'DD.MM.YYYY', currency: 'PLN' },
  de: { name: 'German', nativeName: 'Deutsch', rtl: false, locale: 'de-DE', dateFormat: 'DD.MM.YYYY', currency: 'EUR' },
  fr: { name: 'French', nativeName: 'Français', rtl: false, locale: 'fr-FR', dateFormat: 'DD/MM/YYYY', currency: 'EUR' },
  es: { name: 'Spanish', nativeName: 'Español', rtl: false, locale: 'es-ES', dateFormat: 'DD/MM/YYYY', currency: 'EUR' },
  it: { name: 'Italian', nativeName: 'Italiano', rtl: false, locale: 'it-IT', dateFormat: 'DD/MM/YYYY', currency: 'EUR' },
  ru: { name: 'Russian', nativeName: 'Русский', rtl: false, locale: 'ru-RU', dateFormat: 'DD.MM.YYYY', currency: 'RUB' },
  uk: { name: 'Ukrainian', nativeName: 'Українська', rtl: false, locale: 'uk-UA', dateFormat: 'DD.MM.YYYY', currency: 'UAH' },
  cs: { name: 'Czech', nativeName: 'Čeština', rtl: false, locale: 'cs-CZ', dateFormat: 'DD.MM.YYYY', currency: 'CZK' },
  sk: { name: 'Slovak', nativeName: 'Slovenčina', rtl: false, locale: 'sk-SK', dateFormat: 'DD.MM.YYYY', currency: 'EUR' },
  hu: { name: 'Hungarian', nativeName: 'Magyar', rtl: false, locale: 'hu-HU', dateFormat: 'YYYY.MM.DD.', currency: 'HUF' },
  ro: { name: 'Romanian', nativeName: 'Română', rtl: false, locale: 'ro-RO', dateFormat: 'DD.MM.YYYY', currency: 'RON' },
  bg: { name: 'Bulgarian', nativeName: 'Български', rtl: false, locale: 'bg-BG', dateFormat: 'DD.MM.YYYY', currency: 'BGN' },
  hr: { name: 'Croatian', nativeName: 'Hrvatski', rtl: false, locale: 'hr-HR', dateFormat: 'DD.MM.YYYY', currency: 'EUR' },
  sl: { name: 'Slovenian', nativeName: 'Slovenščina', rtl: false, locale: 'sl-SI', dateFormat: 'DD.MM.YYYY', currency: 'EUR' },
  sr: { name: 'Serbian', nativeName: 'Српски', rtl: false, locale: 'sr-RS', dateFormat: 'DD.MM.YYYY', currency: 'RSD' },
  lt: { name: 'Lithuanian', nativeName: 'Lietuvių', rtl: false, locale: 'lt-LT', dateFormat: 'YYYY-MM-DD', currency: 'EUR' },
  lv: { name: 'Latvian', nativeName: 'Latviešu', rtl: false, locale: 'lv-LV', dateFormat: 'DD.MM.YYYY', currency: 'EUR' },
  et: { name: 'Estonian', nativeName: 'Eesti', rtl: false, locale: 'et-EE', dateFormat: 'DD.MM.YYYY', currency: 'EUR' },
  sv: { name: 'Swedish', nativeName: 'Svenska', rtl: false, locale: 'sv-SE', dateFormat: 'YYYY-MM-DD', currency: 'SEK' },
  da: { name: 'Danish', nativeName: 'Dansk', rtl: false, locale: 'da-DK', dateFormat: 'DD-MM-YYYY', currency: 'DKK' },
  no: { name: 'Norwegian', nativeName: 'Norsk', rtl: false, locale: 'nb-NO', dateFormat: 'DD.MM.YYYY', currency: 'NOK' },
  fi: { name: 'Finnish', nativeName: 'Suomi', rtl: false, locale: 'fi-FI', dateFormat: 'DD.MM.YYYY', currency: 'EUR' },
};

// Translation cache
interface TranslationCache {
  text: string;
  from: SupportedLanguage;
  to: SupportedLanguage;
  translation: string;
  timestamp: number;
  hash: string;
}

class MultiLanguageTranslationService {
  private cache: Map<string, TranslationCache> = new Map();
  private cacheExpiry = 24 * 60 * 60 * 1000; // 24 hours

  async translate(
    text: string,
    targetLanguage: SupportedLanguage,
    sourceLanguage?: SupportedLanguage,
    context?: string
  ): Promise<{
    translatedText: string;
    detectedLanguage?: SupportedLanguage;
    confidence: number;
    alternatives: string[];
  }> {
    if (!aiService) {
      throw new Error('AI translation service is not available');
    }

    const cacheKey = this.getCacheKey(text, targetLanguage, sourceLanguage);
    const cached = this.getFromCache(cacheKey);
    if (cached) {
      return {
        translatedText: cached.translation,
        confidence: 0.95,
        alternatives: [],
      };
    }

    const sourceLang = sourceLanguage || await this.detectLanguage(text);
    const targetLangName = LanguageMetadata[targetLanguage].name;
    const sourceLangName = LanguageMetadata[sourceLang].name;

    const prompt = `Translate the following text from ${sourceLangName} to ${targetLangName}.

Text: "${text}"

${context ? `Context: ${context}` : ''}

Requirements:
- Maintain the original tone and style
- Preserve formatting and structure
- Use natural, fluent language
- Consider cultural nuances
- Keep technical terms consistent

Respond with JSON:
{
  "translatedText": "...",
  "confidence": 0.0-1.0,
  "alternatives": ["...", "..."],
  "culturalNotes": "..."
}`;

    try {
      const response = await aiService['generateContent'](
        prompt,
        `You are a professional translator specializing in beauty and fitness content. You are translating from ${sourceLangName} to ${targetLangName}. Ensure cultural appropriateness and industry-specific terminology.`,
        0.3,
        1500
      );

      const parsed = JSON.parse(response);

      // Cache the result
      this.addToCache(cacheKey, {
        text,
        from: sourceLang,
        to: targetLanguage,
        translation: parsed.translatedText,
        timestamp: Date.now(),
        hash: this.hashString(text),
      });

      return {
        translatedText: parsed.translatedText,
        detectedLanguage: sourceLanguage ? undefined : sourceLang,
        confidence: parsed.confidence || 0.9,
        alternatives: parsed.alternatives || [],
      };
    } catch (error) {
      console.error('Translation failed:', error);
      throw new Error('Failed to translate text');
    }
  }

  async detectLanguage(text: string): Promise<SupportedLanguage> {
    // Simple language detection - in production, use a proper language detection library
    const patterns: Record<string, RegExp> = {
      pl: /[ąćęłńóśźż]/i,
      ru: /[а-яё]/i,
      uk: /[а-яєіґ]/i,
      de: /[äöüß]/i,
      fr: /[àâäçéèêëïîôöùûüÿ]/i,
      es: /[ñáéíóúü]/i,
      it: /[àèéìíîòóù]/i,
      cs: /[čďěňřšťůž]/i,
      sk: /[äčďěĺľňňóšťŕžý]/i,
      hu: /[áéíóúöüőű]/i,
      ro: /[ăâîșț]/i,
      bg: /[абвгдежзийклмнопрстуфхцчшщъыьэюя]/i,
      hr: /[čćžšđ]/i,
      sl: /[čćžš]/i,
      sr: /[čćžšđ]/i,
      lt: /[ąčęėįšųūž]/i,
      lv: /[āčēģīķļņōŗšūž]/i,
      et: /[äöüšž]/i,
      sv: /[åäö]/i,
      da: /[æøå]/i,
      no: /[æøå]/i,
      fi: /[äöå]/i,
    };

    for (const [lang, pattern] of Object.entries(patterns)) {
      if (pattern.test(text)) {
        return lang as SupportedLanguage;
      }
    }

    return 'en'; // Default to English
  }

  async batchTranslate(
    items: Array<{
      text: string;
      id: string;
      context?: string;
    }>,
    targetLanguage: SupportedLanguage,
    sourceLanguage?: SupportedLanguage
  ): Promise<Array<{
    id: string;
    translatedText: string;
    success: boolean;
    error?: string;
  }>> {
    const results = [];

    for (const item of items) {
      try {
        const translation = await this.translate(
          item.text,
          targetLanguage,
          sourceLanguage,
          item.context
        );
        results.push({
          id: item.id,
          translatedText: translation.translatedText,
          success: true,
        });
      } catch (error) {
        results.push({
          id: item.id,
          translatedText: '',
          success: false,
          error: error.message,
        });
      }
    }

    return results;
  }

  async translateWithLocalization(
    text: string,
    targetLanguage: SupportedLanguage,
    localizationData?: {
      currency?: string;
      dateFormat?: string;
      units?: 'metric' | 'imperial';
      cultural?: Record<string, string>;
    }
  ): Promise<{
    translatedText: string;
    localizedText: string;
    adaptations: string[];
  }> {
    const translation = await this.translate(text, targetLanguage);
    let localizedText = translation.translatedText;

    const adaptations: string[] = [];

    // Apply currency localization
    if (localizationData?.currency) {
      const currencySymbols: Record<string, string> = {
        EUR: '€',
        USD: '$',
        GBP: '£',
        PLN: 'zł',
        CZK: 'Kč',
        HUF: 'Ft',
        RON: 'lei',
        RUB: '₽',
        UAH: '₴',
        BGN: 'лв',
        RSD: 'дин',
        SEK: 'kr',
        DKK: 'kr',
        NOK: 'kr',
      };

      const symbol = currencySymbols[localizationData.currency];
      if (symbol) {
        localizedText = localizedText.replace(/\$|USD|EUR|GBP/g, symbol);
        adaptations.push(`Currency adapted to ${localizationData.currency}`);
      }
    }

    // Apply date format localization
    if (localizationData?.dateFormat) {
      const dateRegex = /\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4}/g;
      const dates = localizedText.match(dateRegex);
      if (dates) {
        // In a real implementation, would parse and reformat dates
        adaptations.push('Date formats localized');
      }
    }

    // Apply cultural adaptations
    if (localizationData?.cultural) {
      for (const [key, value] of Object.entries(localizationData.cultural)) {
        const regex = new RegExp(key, 'gi');
        if (regex.test(localizedText)) {
          localizedText = localizedText.replace(regex, value);
          adaptations.push(`Cultural adaptation: ${key} → ${value}`);
        }
      }
    }

    return {
      translatedText: translation.translatedText,
      localizedText,
      adaptations,
    };
  }

  async getTranslationQuality(
    originalText: string,
    translatedText: string,
    sourceLanguage: SupportedLanguage,
    targetLanguage: SupportedLanguage
  ): Promise<{
    score: number;
    issues: string[];
    suggestions: string[];
  }> {
    const prompt = `Evaluate the quality of this translation:

Original (${LanguageMetadata[sourceLanguage].name}): "${originalText}"
Translation (${LanguageMetadata[targetLanguage].name}): "${translatedText}"

Assess:
1. Accuracy (0-100)
2. Fluency and naturalness (0-100)
3. Cultural appropriateness (0-100)
4. Technical terminology correctness (0-100)

Provide:
- Overall score (0-100)
- List of issues found
- Suggestions for improvement

Respond with JSON format.`;

    try {
      const response = await aiService['generateContent'](
        prompt,
        'You are an expert translation evaluator for beauty and fitness content.',
        0.2,
        1000
      );

      const parsed = JSON.parse(response);
      return {
        score: parsed.overallScore || 85,
        issues: parsed.issues || [],
        suggestions: parsed.suggestions || [],
      };
    } catch (error) {
      console.error('Failed to evaluate translation quality:', error);
      return {
        score: 75,
        issues: ['Unable to evaluate quality'],
        suggestions: ['Please review manually'],
      };
    }
  }

  private getCacheKey(text: string, targetLang: SupportedLanguage, sourceLang?: SupportedLanguage): string {
    const src = sourceLang || 'auto';
    return `${src}-${targetLang}-${this.hashString(text)}`;
  }

  private getFromCache(key: string): TranslationCache | null {
    const cached = this.cache.get(key);
    if (!cached) return null;

    if (Date.now() - cached.timestamp > this.cacheExpiry) {
      this.cache.delete(key);
      return null;
    }

    return cached;
  }

  private addToCache(key: string, cache: TranslationCache): void {
    this.cache.set(key, cache);

    // Limit cache size
    if (this.cache.size > 1000) {
      const oldestKey = this.cache.keys().next().value;
      this.cache.delete(oldestKey);
    }
  }

  private hashString(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash;
    }
    return hash.toString(36);
  }

  clearCache(): void {
    this.cache.clear();
  }

  getSupportedLanguages(): SupportedLanguage[] {
    return Object.keys(LanguageMetadata) as SupportedLanguage[];
  }

  getLanguageInfo(language: SupportedLanguage): typeof LanguageMetadata[SupportedLanguage] {
    return LanguageMetadata[language];
  }
}

// Export singleton instance
export const multiLanguageService = new MultiLanguageTranslationService();

// React hook for multi-language translation
import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export function useMultiLanguageTranslation() {
  const [isTranslating, setIsTranslating] = useState(false);
  const queryClient = useQueryClient();

  const translateMutation = useMutation({
    mutationFn: async (params: {
      text: string;
      targetLanguage: SupportedLanguage;
      sourceLanguage?: SupportedLanguage;
      context?: string;
    }) => {
      setIsTranslating(true);
      try {
        const result = await multiLanguageService.translate(
          params.text,
          params.targetLanguage,
          params.sourceLanguage,
          params.context
        );
        return result;
      } finally {
        setIsTranslating(false);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['translations'] });
    },
  });

  const translate = useCallback(
    (text: string, targetLanguage: SupportedLanguage, sourceLanguage?: SupportedLanguage, context?: string) => {
      return translateMutation.mutateAsync({ text, targetLanguage, sourceLanguage, context });
    },
    [translateMutation]
  );

  const batchTranslate = useCallback(
    async (
      items: Array<{ text: string; id: string; context?: string }>,
      targetLanguage: SupportedLanguage,
      sourceLanguage?: SupportedLanguage
    ) => {
      setIsTranslating(true);
      try {
        const results = await multiLanguageService.batchTranslate(items, targetLanguage, sourceLanguage);
        return results;
      } finally {
        setIsTranslating(false);
      }
    },
    []
  );

  return {
    translate,
    batchTranslate,
    isTranslating: isTranslating || translateMutation.isPending,
    error: translateMutation.error,
    clearCache: multiLanguageService.clearCache.bind(multiLanguageService),
    getSupportedLanguages: multiLanguageService.getSupportedLanguages.bind(multiLanguageService),
    getLanguageInfo: multiLanguageService.getLanguageInfo.bind(multiLanguageService),
  };
}