import { useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

export interface HreflangUrl {
  hrefLang: string;
  href: string;
}

export interface HreflangConfig {
  baseUrl: string;
  supportedLanguages: string[];
  defaultLanguage: string;
  supportedRegions?: string[];
  alternatePaths?: Record<string, Record<string, string>>;
}

export interface LocalizedPage {
  path: string;
  translations: Record<string, string>;
  lastModified?: Date;
  changeFrequency?: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
  priority?: number;
}

/**
 * Advanced hreflang generator for multi-language SEO
 * Handles proper language/region targeting and canonical URLs
 */
export class HreflangGenerator {
  private config: HreflangConfig;
  private static instance: HreflangGenerator;

  constructor(config: HreflangConfig) {
    this.config = config;
  }

  static getInstance(config?: HreflangConfig): HreflangGenerator {
    if (!HreflangGenerator.instance) {
      if (!config) {
        throw new Error('Config required for first initialization');
      }
      HreflangGenerator.instance = new HreflangGenerator(config);
    }
    return HreflangGenerator.instance;
  }

  /**
   * Generate hreflang tags for the current page
   */
  generateHreflangTags(
    currentPath: string,
    currentLang: string,
    pageTranslations?: Record<string, string>
  ): HreflangUrl[] {
    const hreflangUrls: HreflangUrl[] = [];
    const { baseUrl, supportedLanguages, defaultLanguage } = this.config;

    // Clean the path by removing language prefix
    const cleanPath = this.removeLanguagePrefix(currentPath);

    // Generate URLs for each supported language
    supportedLanguages.forEach(lang => {
      const localizedPath = pageTranslations?.[lang] || cleanPath;
      const href = this.buildLocalizedUrl(baseUrl, lang, localizedPath);

      hreflangUrls.push({
        hrefLang: lang,
        href
      });
    });

    // Add x-default for international targeting
    const defaultPath = pageTranslations?.[defaultLanguage] || cleanPath;
    hreflangUrls.push({
      hrefLang: 'x-default',
      href: this.buildLocalizedUrl(baseUrl, defaultLanguage, defaultPath)
    });

    // Add region-specific variants if supported
    if (this.config.supportedRegions) {
      this.config.supportedRegions.forEach(region => {
        supportedLanguages.forEach(lang => {
          const hrefLang = `${lang}-${region}`;
          const localizedPath = pageTranslations?.[`${lang}-${region}`] || pageTranslations?.[lang] || cleanPath;
          const href = this.buildLocalizedUrl(baseUrl, lang, localizedPath);

          hreflangUrls.push({
            hrefLang,
            href
          });
        });
      });
    }

    return hreflangUrls;
  }

  /**
   * Generate canonical URL for the current page
   */
  generateCanonicalUrl(
    currentPath: string,
    currentLang: string,
    useLanguagePrefix = true
  ): string {
    const { baseUrl } = this.config;
    const cleanPath = this.removeLanguagePrefix(currentPath);

    if (useLanguagePrefix && currentLang !== this.config.defaultLanguage) {
      return `${baseUrl}/${currentLang}${cleanPath}`;
    }

    return `${baseUrl}${cleanPath}`;
  }

  /**
   * Generate alternate language URLs for sitemaps
   */
  generateAlternateUrls(
    page: LocalizedPage,
    baseUrl?: string
  ): Record<string, string> {
    const base = baseUrl || this.config.baseUrl;
    const alternateUrls: Record<string, string> = {};

    Object.entries(page.translations).forEach(([lang, path]) => {
      if (path && path.trim()) {
        const localizedUrl = this.buildLocalizedUrl(base, lang, path);
        alternateUrls[lang] = localizedUrl;
      }
    });

    // Add default language if not in translations
    if (!alternateUrls[this.config.defaultLanguage]) {
      alternateUrls[this.config.defaultLanguage] = this.buildLocalizedUrl(
        base,
        this.config.defaultLanguage,
        page.path
      );
    }

    return alternateUrls;
  }

  /**
   * Validate hreflang implementation
   */
  validateHreflangImplementation(
    hreflangTags: HreflangUrl[],
    canonicalUrl: string
  ): { valid: boolean; errors: string[]; warnings: string[] } {
    const errors: string[] = [];
    const warnings: string[] = [];
    const hrefLangValues = new Set<string>();

    // Check for required self-referencing hreflang
    const selfRefTag = hreflangTags.find(tag => tag.href === canonicalUrl);
    if (!selfRefTag) {
      errors.push('Missing self-referencing hreflang tag');
    }

    // Check for duplicate hreflang values
    hreflangTags.forEach(tag => {
      if (hrefLangValues.has(tag.hrefLang)) {
        errors.push(`Duplicate hreflang value: ${tag.hrefLang}`);
      }
      hrefLangValues.add(tag.hrefLang);
    });

    // Check for x-default tag
    const hasXDefault = hreflangTags.some(tag => tag.hrefLang === 'x-default');
    if (!hasXDefault) {
      warnings.push('Missing x-default hreflang tag for international targeting');
    }

    // Check for supported languages
    hreflangTags.forEach(tag => {
      if (tag.hrefLang !== 'x-default' && !this.config.supportedLanguages.includes(tag.hrefLang)) {
        if (!this.config.supportedRegions?.some(region => tag.hrefLang.includes(region))) {
          warnings.push(`Potentially unsupported hreflang value: ${tag.hrefLang}`);
        }
      }
    });

    // Check URL format consistency
    const firstUrl = hreflangTags[0]?.href;
    if (firstUrl) {
      const urlPattern = firstUrl.includes('?') ? firstUrl.split('?')[0] : firstUrl;
      hreflangTags.forEach(tag => {
        const tagUrlPattern = tag.href.includes('?') ? tag.href.split('?')[0] : tag.href;
        if (tagUrlPattern.replace(/\/[a-z]{2}\//, '/') !== urlPattern.replace(/\/[a-z]{2}\//, '/')) {
          errors.push(`URL pattern inconsistency: ${tag.hrefLang} - ${tag.href}`);
        }
      });
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Generate language-specific sitemaps
   */
  generateLanguageSitemaps(
    pages: LocalizedPage[],
    outputDir: string
  ): Array<{ language: string; sitemapPath: string; urls: string[] }> {
    const sitemaps: Array<{ language: string; sitemapPath: string; urls: string[] }> = [];

    this.config.supportedLanguages.forEach(lang => {
      const urls: string[] = [];

      pages.forEach(page => {
        const pagePath = page.translations[lang] || page.path;
        const url = this.buildLocalizedUrl(this.config.baseUrl, lang, pagePath);
        urls.push(url);
      });

      sitemaps.push({
        language: lang,
        sitemapPath: `${outputDir}/sitemap-${lang}.xml`,
        urls
      });
    });

    return sitemaps;
  }

  /**
   * Handle page variants (mobile, amp, etc.)
   */
  generatePageVariants(
    canonicalUrl: string,
    variants?: {
      mobile?: string;
      amp?: string;
      tablet?: string;
    }
  ): HreflangUrl[] {
    const variantUrls: HreflangUrl[] = [];

    if (variants?.mobile) {
      variantUrls.push({
        hrefLang: 'mobile',
        href: variants.mobile
      });
    }

    if (variants?.amp) {
      variantUrls.push({
        hrefLang: 'amp',
        href: variants.amp
      });
    }

    if (variants?.tablet) {
      variantUrls.push({
        hrefLang: 'tablet',
        href: variants.tablet
      });
    }

    return variantUrls;
  }

  /**
   * Build localized URL with proper language prefix
   */
  private buildLocalizedUrl(baseUrl: string, lang: string, path: string): string {
    const cleanPath = path.startsWith('/') ? path.slice(1) : path;

    if (lang === this.config.defaultLanguage) {
      return `${baseUrl}/${cleanPath}`;
    }

    return `${baseUrl}/${lang}/${cleanPath}`;
  }

  /**
   * Remove language prefix from path
   */
  private removeLanguagePrefix(path: string): string {
    const langRegex = new RegExp(`^\\/(${this.config.supportedLanguages.join('|')})\\b`);
    return path.replace(langRegex, '') || '/';
  }

  /**
   * Get current language from path
   */
  getCurrentLanguageFromPath(path: string): string {
    const match = path.match(/^\/([a-z]{2})\b/);
    return match ? match[1] : this.config.defaultLanguage;
  }

  /**
   * Generate hreflang meta tags for React Helmet
   */
  generateMetaTags(hreflangUrls: HreflangUrl[]): Array<{ rel: string; hrefLang: string; href: string }> {
    return hreflangUrls.map(url => ({
      rel: 'alternate',
      hrefLang: url.hrefLang,
      href: url.href
    }));
  }
}

/**
 * React hook for hreflang generation
 */
export const useHreflang = (
  pageTranslations?: Record<string, string>,
  config?: Partial<HreflangConfig>
) => {
  const location = useLocation();
  const { i18n } = useTranslation();

  const hreflangConfig: HreflangConfig = {
    baseUrl: window.location.origin,
    supportedLanguages: ['en', 'pl'],
    defaultLanguage: 'en',
    supportedRegions: ['PL'],
    ...config
  };

  const generator = HreflangGenerator.getInstance(hreflangConfig);

  const currentLang = i18n.language;
  const currentPath = location.pathname;

  const hreflangUrls = generator.generateHreflangTags(
    currentPath,
    currentLang,
    pageTranslations
  );

  const canonicalUrl = generator.generateCanonicalUrl(currentPath, currentLang);

  const validation = generator.validateHreflangImplementation(hreflangUrls, canonicalUrl);

  return {
    hreflangUrls,
    canonicalUrl,
    validation,
    metaTags: generator.generateMetaTags(hreflangUrls),
    currentLang,
    supportedLanguages: hreflangConfig.supportedLanguages
  };
};

/**
 * Utility function to create localized page configurations
 */
export const createLocalizedPage = (
  basePath: string,
  translations: Record<string, string>,
  options?: {
    lastModified?: Date;
    changeFrequency?: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
    priority?: number;
  }
): LocalizedPage => ({
  path: basePath,
  translations,
  lastModified: options?.lastModified || new Date(),
  changeFrequency: options?.changeFrequency || 'weekly',
  priority: options?.priority || 0.8
});

/**
 * Predefined hreflang configurations for common use cases
 */
export const HreflangPresets = {
  polishMarket: {
    baseUrl: 'https://mariia-hub.pl',
    supportedLanguages: ['pl', 'en'],
    defaultLanguage: 'pl',
    supportedRegions: ['PL']
  },

  international: {
    baseUrl: 'https://mariia-hub.com',
    supportedLanguages: ['en', 'pl', 'de'],
    defaultLanguage: 'en',
    supportedRegions: ['PL', 'DE', 'US']
  },

  localWarsaw: {
    baseUrl: 'https://warsaw.mariia-hub.pl',
    supportedLanguages: ['pl', 'en'],
    defaultLanguage: 'pl',
    supportedRegions: ['PL', 'PL-MZ']
  }
} as const;

export default HreflangGenerator;