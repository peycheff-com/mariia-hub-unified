import { useTranslation } from 'react-i18next';
import { useLocation } from 'react-router-dom';

export interface MetaTagConfig {
  title?: string;
  description?: string;
  keywords?: string[];
  author?: string;
  robots?: string;
  canonical?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  ogType?: string;
  ogUrl?: string;
  ogSiteName?: string;
  ogLocale?: string;
  twitterCard?: string;
  twitterTitle?: string;
  twitterDescription?: string;
  twitterImage?: string;
  twitterCreator?: string;
  twitterSite?: string;
  articleTags?: string[];
  articleSection?: string;
  articlePublishedTime?: string;
  articleModifiedTime?: string;
  authorUrl?: string;
  publisher?: string;
  priceAmount?: number;
  priceCurrency?: string;
  availability?: string;
  brand?: string;
  additionalTags?: Array<{
    name: string;
    content: string;
    property?: string;
  }>;
}

export interface PageMetaConfig {
  path: string;
  template: 'default' | 'service' | 'blog' | 'homepage' | 'landing' | 'local';
  titleTemplate?: string;
  descriptionTemplate?: string;
  keywords?: string[];
  priority?: number;
  changeFrequency?: string;
  lastModified?: Date;
  customTags?: MetaTagConfig;
}

export interface AITestResult {
  score: number;
  issues: Array<{
    type: 'error' | 'warning' | 'info';
    category: 'title' | 'description' | 'keywords' | 'og_tags' | 'twitter' | 'technical';
    message: string;
    suggestion: string;
    impact: 'high' | 'medium' | 'low';
  }>;
  recommendations: string[];
  optimizedVersion?: {
    title: string;
    description: string;
    keywords: string[];
  };
}

/**
 * Advanced meta tag optimization system
 */
export class MetaOptimizer {
  private static instance: MetaOptimizer;
  private pageConfigs: Map<string, PageMetaConfig> = new Map();
  private globalConfig: {
    siteName: string;
    defaultAuthor: string;
    defaultImage: string;
    twitterCreator: string;
    twitterSite: string;
    socialDomains: string[];
  };

  constructor() {
    this.globalConfig = {
      siteName: 'Mariia Hub',
      defaultAuthor: 'Mariia Hub',
      defaultImage: '/assets/hero/hero-beauty-luxury.webp',
      twitterCreator: '@mariia_hub',
      twitterSite: '@mariia_hub',
      socialDomains: ['instagram.com', 'facebook.com', 'linkedin.com']
    };
    this.initializeDefaultConfigs();
  }

  static getInstance(): MetaOptimizer {
    if (!MetaOptimizer.instance) {
      MetaOptimizer.instance = new MetaOptimizer();
    }
    return MetaOptimizer.instance;
  }

  /**
   * Initialize default page configurations
   */
  private initializeDefaultConfigs() {
    // Homepage
    this.pageConfigs.set('/', {
      path: '/',
      template: 'homepage',
      titleTemplate: '%s | Mariia Hub - Beauty & Fitness Warsaw',
      descriptionTemplate: '%s',
      keywords: ['beauty warszawa', 'fitness warszawa', 'permanentny makijaż', 'stylizacja brwi', 'trening personalny'],
      priority: 1.0,
      changeFrequency: 'weekly'
    });

    // Service pages
    this.pageConfigs.set('/beauty', {
      path: '/beauty',
      template: 'service',
      titleTemplate: '%s | Beauty Services Warsaw | Mariia Hub',
      descriptionTemplate: 'Professional beauty services in Warsaw. %s. Book your appointment today.',
      keywords: ['beauty salon warszawa', 'kosmetyka warszawa', 'uroda warszawa', 'pielęgnacja'],
      priority: 0.9,
      changeFrequency: 'monthly'
    });

    this.pageConfigs.set('/fitness', {
      path: '/fitness',
      template: 'service',
      titleTemplate: '%s | Personal Training Warsaw | Mariia Hub',
      descriptionTemplate: 'Certified personal training services in Warsaw. %s. Start your fitness journey today.',
      keywords: ['trening personalny warszawa', 'fitness klub warszawa', 'siłownia warszawa', 'trener osobisty'],
      priority: 0.9,
      changeFrequency: 'monthly'
    });

    // Blog pages
    this.pageConfigs.set('/blog', {
      path: '/blog',
      template: 'blog',
      titleTemplate: '%s | Beauty & Fitness Blog | Mariia Hub',
      descriptionTemplate: 'Latest tips and trends in beauty and fitness. %s. Expert advice from professionals.',
      keywords: ['blog uroda', 'porady kosmetyczne', 'fitness porady', 'zdrowy styl życia'],
      priority: 0.8,
      changeFrequency: 'daily'
    });

    // Local pages
    this.pageConfigs.set('/contact', {
      path: '/contact',
      template: 'local',
      titleTemplate: '%s | Contact Mariia Hub | Warsaw',
      descriptionTemplate: 'Contact Mariia Hub beauty and fitness center in Warsaw. %s. Book your appointment.',
      keywords: ['kontakt warszawa', 'rezerwacja wizyty', 'telefon salon urody', 'adres salonu'],
      priority: 0.7,
      changeFrequency: 'monthly'
    });
  }

  /**
   * Generate optimized meta tags for a page
   */
  generateMetaTags(
    path: string,
    config: Partial<MetaTagConfig> = {},
    language: string = 'en'
  ): MetaTagConfig {
    const pageConfig = this.pageConfigs.get(path) || this.pageConfigs.get('/');
    const currentUrl = `${window.location.origin}${path}`;

    // Generate optimized title
    const title = this.optimizeTitle(config.title || '', pageConfig, language);

    // Generate optimized description
    const description = this.optimizeDescription(config.description || '', pageConfig, language);

    // Generate keywords
    const keywords = this.generateKeywords(config.keywords || [], pageConfig, path);

    const metaTags: MetaTagConfig = {
      title,
      description,
      keywords,
      author: config.author || this.globalConfig.defaultAuthor,
      robots: config.robots || 'index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1',
      canonical: config.canonical || currentUrl,

      // Open Graph tags
      ogTitle: config.ogTitle || title,
      ogDescription: config.ogDescription || description,
      ogImage: config.ogImage || this.globalConfig.defaultImage,
      ogType: config.ogType || this.getOgType(pageConfig?.template),
      ogUrl: config.ogUrl || currentUrl,
      ogSiteName: config.ogSiteName || this.globalConfig.siteName,
      ogLocale: config.ogLocale || this.getLocale(language),

      // Twitter Card tags
      twitterCard: config.twitterCard || 'summary_large_image',
      twitterTitle: config.twitterTitle || title,
      twitterDescription: config.twitterDescription || description,
      twitterImage: config.twitterImage || this.globalConfig.defaultImage,
      twitterCreator: config.twitterCreator || this.globalConfig.twitterCreator,
      twitterSite: config.twitterSite || this.globalConfig.twitterSite,

      // Article tags (for blog posts)
      articleTags: config.articleTags,
      articleSection: config.articleSection,
      articlePublishedTime: config.articlePublishedTime,
      articleModifiedTime: config.articleModifiedTime,

      // Author and publisher
      authorUrl: config.authorUrl,
      publisher: config.publisher || this.globalConfig.siteName,

      // Product/Service tags
      priceAmount: config.priceAmount,
      priceCurrency: config.priceCurrency || 'PLN',
      availability: config.availability || 'https://schema.org/InStock',
      brand: config.brand || 'Mariia Hub',

      // Additional custom tags
      additionalTags: config.additionalTags || []
    };

    // Add language-specific tags
    this.addLanguageSpecificTags(metaTags, language);

    // Add structured data reference
    this.addStructuredDataReference(metaTags, pageConfig);

    return metaTags;
  }

  /**
   * Optimize title for SEO
   */
  private optimizeTitle(baseTitle: string, pageConfig: PageMetaConfig | undefined, language: string): string {
    let title = baseTitle;

    // Apply template if available
    if (pageConfig?.titleTemplate && title) {
      title = pageConfig.titleTemplate.replace('%s', title);
    } else if (pageConfig?.titleTemplate) {
      title = pageConfig.titleTemplate.replace('%s', this.globalConfig.siteName);
    }

    // Ensure title length is optimal (50-60 characters)
    if (title.length > 60) {
      title = title.substring(0, 57) + '...';
    } else if (title.length < 30) {
      // Add relevant keywords if title is too short
      const additionalKeywords = language === 'pl' ? 'Warszawa' : 'Warsaw';
      title += ` | ${additionalKeywords}`;
    }

    // Ensure brand name is present (except for homepage)
    if (!title.includes(this.globalConfig.siteName) && !title.includes('Warsaw')) {
      title += ` | ${this.globalConfig.siteName}`;
    }

    return title.trim();
  }

  /**
   * Optimize description for SEO
   */
  private optimizeDescription(baseDescription: string, pageConfig: PageMetaConfig | undefined, language: string): string {
    let description = baseDescription;

    // Apply template if available
    if (pageConfig?.descriptionTemplate && description) {
      description = pageConfig.descriptionTemplate.replace('%s', description);
    } else if (pageConfig?.descriptionTemplate) {
      description = pageConfig.descriptionTemplate.replace('%s', this.getDefaultDescription(language));
    }

    // Ensure description length is optimal (150-160 characters)
    if (description.length > 160) {
      description = description.substring(0, 157) + '...';
    } else if (description.length < 120) {
      // Add call-to-action if description is too short
      const cta = language === 'pl' ? 'Zarezerwuj wizytę już dziś!' : 'Book your appointment today!';
      description += ` ${cta}`;
    }

    // Include primary keywords naturally
    const primaryKeywords = language === 'pl'
      ? ['Warszawa', 'profesjonalny', 'salon urody']
      : ['Warsaw', 'professional', 'beauty salon'];

    const hasKeyword = primaryKeywords.some(keyword =>
      description.toLowerCase().includes(keyword.toLowerCase())
    );

    if (!hasKeyword && description.length < 150) {
      const keyword = primaryKeywords[0];
      description = `${description} ${keyword}`;
    }

    return description.trim();
  }

  /**
   * Generate keywords for page
   */
  private generateKeywords(
    providedKeywords: string[],
    pageConfig: PageMetaConfig | undefined,
    path: string
  ): string[] {
    const keywords = new Set<string>();

    // Add provided keywords
    providedKeywords.forEach(keyword => keywords.add(keyword));

    // Add page-specific keywords
    if (pageConfig?.keywords) {
      pageConfig.keywords.forEach(keyword => keywords.add(keyword));
    }

    // Add path-based keywords
    const pathKeywords = this.extractKeywordsFromPath(path);
    pathKeywords.forEach(keyword => keywords.add(keyword));

    // Add location-based keywords
    keywords.add('Warszawa');
    keywords.add('Warsaw');
    keywords.add('salon urody');
    keywords.add('beauty salon');

    // Convert to array and limit to 10 most important
    const keywordArray = Array.from(keywords);
    return keywordArray.slice(0, 10);
  }

  /**
   * Extract keywords from URL path
   */
  private extractKeywordsFromPath(path: string): string[] {
    const pathMap: Record<string, string[]> = {
      '/beauty': ['beauty', 'uroda', 'kosmetyka', 'pielęgnacja'],
      '/fitness': ['fitness', 'trening', 'zdrowie', 'sport'],
      '/blog': ['blog', 'porady', 'artykuły', 'wskazówki'],
      '/contact': ['kontakt', 'adres', 'rezerwacja', 'wizyta'],
      '/about': ['o nas', 'historia', 'misja', 'zespoł'],
      '/reviews': ['opinie', 'recenzje', 'oceny', 'komentarze']
    };

    for (const [key, keywords] of Object.entries(pathMap)) {
      if (path.includes(key)) {
        return keywords;
      }
    }

    return [];
  }

  /**
   * Get OG type based on page template
   */
  private getOgType(template?: string): string {
    const typeMap: Record<string, string> = {
      'homepage': 'website',
      'service': 'product',
      'blog': 'article',
      'landing': 'website',
      'local': 'place'
    };

    return typeMap[template || 'default'] || 'website';
  }

  /**
   * Get locale string
   */
  private getLocale(language: string): string {
    const localeMap: Record<string, string> = {
      'pl': 'pl_PL',
      'en': 'en_US'
    };

    return localeMap[language] || 'en_US';
  }

  /**
   * Add language-specific tags
   */
  private addLanguageSpecificTags(metaTags: MetaTagConfig, language: string) {
    if (metaTags.additionalTags) {
      // Add hreflang tags reference
      metaTags.additionalTags.push({
        name: 'language',
        content: language
      });

      // Add geo targeting for Warsaw
      metaTags.additionalTags.push({
        name: 'geo.region',
        content: 'PL-MZ'
      });

      metaTags.additionalTags.push({
        name: 'geo.placename',
        content: 'Warszawa'
      });

      metaTags.additionalTags.push({
        name: 'geo.position',
        content: '52.2297;21.0122'
      });

      metaTags.additionalTags.push({
        name: 'ICBM',
        content: '52.2297,21.0122'
      });
    }
  }

  /**
   * Add structured data reference
   */
  private addStructuredDataReference(metaTags: MetaTagConfig, pageConfig?: PageMetaConfig) {
    if (metaTags.additionalTags) {
      metaTags.additionalTags.push({
        name: 'structured-data-type',
        content: pageConfig?.template || 'website'
      });
    }
  }

  /**
   * Test meta tags with AI-like analysis
   */
  testMetaTags(metaTags: MetaTagConfig): AITestResult {
    const issues: AITestResult['issues'] = [];
    let score = 100;

    // Title analysis
    if (!metaTags.title) {
      issues.push({
        type: 'error',
        category: 'title',
        message: 'Missing title tag',
        suggestion: 'Add a descriptive title tag (50-60 characters)',
        impact: 'high'
      });
      score -= 30;
    } else {
      if (metaTags.title.length < 30) {
        issues.push({
          type: 'warning',
          category: 'title',
          message: `Title too short: ${metaTags.title.length} characters`,
          suggestion: 'Increase title length to 30-60 characters for better SEO',
          impact: 'medium'
        });
        score -= 10;
      }

      if (metaTags.title.length > 60) {
        issues.push({
          type: 'warning',
          category: 'title',
          message: `Title too long: ${metaTags.title.length} characters`,
          suggestion: 'Shorten title to 50-60 characters to avoid truncation',
          impact: 'medium'
        });
        score -= 10;
      }

      if (!metaTags.title.includes('Warszawa') && !metaTags.title.includes('Warsaw')) {
        issues.push({
          type: 'info',
          category: 'title',
          message: 'Title missing location keyword',
          suggestion: 'Include "Warszawa" or "Warsaw" for better local SEO',
          impact: 'low'
        });
        score -= 5;
      }
    }

    // Description analysis
    if (!metaTags.description) {
      issues.push({
        type: 'error',
        category: 'description',
        message: 'Missing meta description',
        suggestion: 'Add a compelling description (150-160 characters)',
        impact: 'high'
      });
      score -= 25;
    } else {
      if (metaTags.description.length < 120) {
        issues.push({
          type: 'warning',
          category: 'description',
          message: `Description too short: ${metaTags.description.length} characters`,
          suggestion: 'Increase description to 150-160 characters for better click-through rate',
          impact: 'medium'
        });
        score -= 8;
      }

      if (metaTags.description.length > 160) {
        issues.push({
          type: 'warning',
          category: 'description',
          message: `Description too long: ${metaTags.description.length} characters`,
          suggestion: 'Shorten description to avoid truncation in search results',
          impact: 'medium'
        });
        score -= 8;
      }
    }

    // Keywords analysis
    if (!metaTags.keywords || metaTags.keywords.length === 0) {
      issues.push({
        type: 'warning',
        category: 'keywords',
        message: 'No keywords provided',
        suggestion: 'Add relevant keywords for better search engine understanding',
        impact: 'low'
      });
      score -= 5;
    }

    // Open Graph analysis
    if (!metaTags.ogImage) {
      issues.push({
        type: 'warning',
        category: 'og_tags',
        message: 'Missing OG image',
        suggestion: 'Add an OG image for better social media sharing',
        impact: 'medium'
      });
      score -= 10;
    }

    // Twitter Card analysis
    if (!metaTags.twitterImage) {
      issues.push({
        type: 'info',
        category: 'twitter',
        message: 'Missing Twitter image',
        suggestion: 'Add a Twitter-specific image for better Twitter Card display',
        impact: 'low'
      });
      score -= 5;
    }

    // Technical analysis
    if (!metaTags.canonical) {
      issues.push({
        type: 'warning',
        category: 'technical',
        message: 'Missing canonical URL',
        suggestion: 'Add canonical URL to prevent duplicate content issues',
        impact: 'medium'
      });
      score -= 8;
    }

    const recommendations = this.generateRecommendations(issues);

    return {
      score: Math.max(0, score),
      issues,
      recommendations,
      optimizedVersion: this.generateOptimizedVersion(metaTags, issues)
    };
  }

  /**
   * Generate recommendations based on issues
   */
  private generateRecommendations(issues: AITestResult['issues']): string[] {
    const recommendations = new Set<string>();

    issues.forEach(issue => {
      if (issue.type === 'error') {
        recommendations.add(`URGENT: ${issue.suggestion}`);
      } else if (issue.type === 'warning') {
        recommendations.add(`IMPORTANT: ${issue.suggestion}`);
      } else {
        recommendations.add(`Consider: ${issue.suggestion}`);
      }
    });

    // Add general recommendations
    recommendations.add('Regularly monitor keyword rankings');
    recommendations.add('A/B test meta descriptions for better CTR');
    recommendations.add('Update meta tags seasonally for relevance');

    return Array.from(recommendations);
  }

  /**
   * Generate optimized version
   */
  private generateOptimizedVersion(metaTags: MetaTagConfig, issues: AITestResult['issues']) {
    if (!metaTags.title || !metaTags.description) {
      return undefined;
    }

    let optimizedTitle = metaTags.title;
    let optimizedDescription = metaTags.description;

    // Fix title issues
    if (metaTags.title.length > 60) {
      optimizedTitle = metaTags.title.substring(0, 57) + '...';
    }

    if (metaTags.title.length < 30) {
      optimizedTitle += ' | Warszawa';
    }

    if (!metaTags.title.includes('Warszawa') && !metaTags.title.includes('Warsaw')) {
      optimizedTitle += ' | Warszawa';
    }

    // Fix description issues
    if (metaTags.description.length > 160) {
      optimizedDescription = metaTags.description.substring(0, 157) + '...';
    }

    if (metaTags.description.length < 120) {
      optimizedDescription += ' Zarezerwuj wizytę już dziś!';
    }

    return {
      title: optimizedTitle,
      description: optimizedDescription,
      keywords: metaTags.keywords || []
    };
  }

  /**
   * Get default description
   */
  private getDefaultDescription(language: string): string {
    return language === 'pl'
      ? 'Profesjonalne usługi kosmetyczne i fitness w Warszawie.'
      : 'Professional beauty and fitness services in Warsaw.';
  }

  /**
   * Register custom page configuration
   */
  registerPageConfig(config: PageMetaConfig) {
    this.pageConfigs.set(config.path, config);
  }

  /**
   * Get page configuration
   */
  getPageConfig(path: string): PageMetaConfig | undefined {
    return this.pageConfigs.get(path);
  }

  /**
   * Update global configuration
   */
  updateGlobalConfig(config: Partial<typeof this.globalConfig>) {
    this.globalConfig = { ...this.globalConfig, ...config };
  }
}

export default MetaOptimizer;