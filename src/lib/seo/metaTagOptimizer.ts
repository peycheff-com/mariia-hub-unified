/**
 * Automated Meta Tag Optimization System
 * AI-powered optimization for Warsaw beauty and fitness market
 */

export interface MetaTagData {
  title: string;
  description: string;
  keywords: string[];
  canonical: string;
  robots: string;
  ogTitle: string;
  ogDescription: string;
  ogImage: string;
  twitterTitle: string;
  twitterDescription: string;
  twitterImage: string;
  additionalMeta: Record<string, string>;
}

export interface OptimizationRule {
  name: string;
  type: 'title' | 'description' | 'keywords' | 'og' | 'twitter' | 'technical';
  condition: (data: MetaTagData, context: OptimizationContext) => boolean;
  action: (data: MetaTagData, context: OptimizationContext) => MetaTagData;
  priority: number;
  category: 'seo' | 'social' | 'technical' | 'local';
}

export interface OptimizationContext {
  url: string;
  pageType: string;
  targetKeywords: string[];
  location?: string;
  language: string;
  device: 'desktop' | 'mobile';
  season?: string;
  competition: {
    topResults: Array<{
      title: string;
      description: string;
      position: number;
    }>;
    avgTitleLength: number;
    avgDescriptionLength: number;
  };
  performance: {
    currentCTR: number;
    currentPosition: number;
    traffic: number;
  };
  businessInfo: {
    name: string;
    phone: string;
    address: string;
    coordinates: { lat: number; lng: number };
  };
}

export interface OptimizationResult {
  originalData: MetaTagData;
  optimizedData: MetaTagData;
  appliedRules: Array<{
    rule: string;
    category: string;
    impact: 'high' | 'medium' | 'low';
    description: string;
  }>;
  score: {
    overall: number;
    title: number;
    description: number;
    technical: number;
    social: number;
    local: number;
  };
  recommendations: Array<{
    type: 'improvement' | 'warning' | 'opportunity';
    message: string;
    action: string;
    impact: 'high' | 'medium' | 'low';
  }>;
}

export interface SERPFeature {
  type: 'featured_snippet' | 'local_pack' | 'people_also_ask' | 'video' | 'images' | 'news' | 'reviews';
  opportunity: 'high' | 'medium' | 'low';
  optimization: string;
  currentStatus: 'optimized' | 'partial' | 'missing';
}

/**
 * Automated Meta Tag Optimizer for Warsaw Beauty & Fitness
 */
export class MetaTagOptimizer {
  private rules: OptimizationRule[];
  private warsawKeywords: string[];
  private polishStopWords: Set<string>;

  constructor() {
    this.rules = this.initializeOptimizationRules();
    this.warsawKeywords = [
      'warszawa', 'warszawie', 'warsaw', ' centrum warszawy', 'śródmieście',
      'mokotów', 'wola', 'żoliborz', 'praga', 'ursynów', 'białołęka',
      'targówek', 'rembertów', 'wawer', 'wilanów', 'ursus', 'bemowo',
      'biełany', 'wesoła', 'leszno', 'mokotowska', 'marszałkowska'
    ];
    this.polishStopWords = new Set([
      'i', 'w', 'na', 'z', 'do', 'od', 'dla', 'o', 'po', 'pod', 'przez',
      'się', 'jest', 'są', 'być', 'był', 'była', 'było', 'będą',
      'który', 'która', 'które', 'jaki', 'jaka', 'jakie', 'ten', 'ta', 'to',
      'ale', 'lub', 'czy', 'jeśli', 'gdy', 'kiedy', 'gdzie', 'jak', 'co'
    ]);
  }

  /**
   * Main optimization method
   */
  optimizeMetaTags(data: MetaTagData, context: OptimizationContext): OptimizationResult {
    let optimizedData = { ...data };
    const appliedRules: OptimizationResult['appliedRules'] = [];

    // Apply rules based on priority
    const sortedRules = [...this.rules].sort((a, b) => b.priority - a.priority);

    for (const rule of sortedRules) {
      if (rule.condition(optimizedData, context)) {
        const previousData = { ...optimizedData };
        optimizedData = rule.action(optimizedData, context);

        // Check if data actually changed
        if (JSON.stringify(previousData) !== JSON.stringify(optimizedData)) {
          appliedRules.push({
            rule: rule.name,
            category: rule.category,
            impact: this.calculateRuleImpact(rule, context),
            description: this.getRuleDescription(rule, context)
          });
        }
      }
    }

    const score = this.calculateOptimizationScore(optimizedData, context);
    const recommendations = this.generateRecommendations(optimizedData, context);

    return {
      originalData: data,
      optimizedData,
      appliedRules,
      score,
      recommendations
    };
  }

  /**
   * Generate AI-powered meta tags for new content
   */
  generateMetaTags(content: {
    title: string;
    description: string;
    keywords: string[];
    category: string;
    location?: string;
    targetAudience: string;
    uniqueValue: string[];
  }, context: OptimizationContext): MetaTagData {
    const optimizedTitle = this.generateOptimizedTitle(content, context);
    const optimizedDescription = this.generateOptimizedDescription(content, context);
    const optimizedKeywords = this.generateOptimizedKeywords(content, context);

    return {
      title: optimizedTitle,
      description: optimizedDescription,
      keywords: optimizedKeywords,
      canonical: context.url,
      robots: 'index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1',
      ogTitle: optimizedTitle,
      ogDescription: optimizedDescription,
      ogImage: this.generateOptimizedOGImage(content, context),
      twitterTitle: optimizedTitle,
      twitterDescription: optimizedDescription,
      twitterImage: this.generateOptimizedTwitterImage(content, context),
      additionalMeta: this.generateAdditionalMeta(content, context)
    };
  }

  /**
   * Analyze SERP features and optimize accordingly
   */
  analyzeSERPFeatures(keyword: string, context: OptimizationContext): SERPFeature[] {
    const features: SERPFeature[] = [];

    // Local pack opportunity
    if (this.hasLocalIntent(keyword)) {
      features.push({
        type: 'local_pack',
        opportunity: 'high',
        optimization: 'Optimize Google Business Profile and include location-specific schema',
        currentStatus: context.businessInfo ? 'optimized' : 'partial'
      });
    }

    // Featured snippet opportunity
    if (this.hasQuestionIntent(keyword)) {
      features.push({
        type: 'featured_snippet',
        opportunity: 'high',
        optimization: 'Create structured FAQ content and how-to guides',
        currentStatus: 'missing'
      });
    }

    // People also ask
    if (this.hasInformationalIntent(keyword)) {
      features.push({
        type: 'people_also_ask',
        opportunity: 'medium',
        optimization: 'Include FAQ section with related questions',
        currentStatus: 'partial'
      });
    }

    // Video opportunity
    if (this.hasVisualIntent(keyword)) {
      features.push({
        type: 'video',
        opportunity: 'medium',
        optimization: 'Create video content with proper video schema',
        currentStatus: 'missing'
      });
    }

    return features;
  }

  // Private methods

  private initializeOptimizationRules(): OptimizationRule[] {
    return [
      // Title optimization rules
      {
        name: 'Title Length Optimization',
        type: 'title',
        category: 'seo',
        priority: 100,
        condition: (data, context) => {
          return data.title.length < 30 || data.title.length > 60;
        },
        action: (data, context) => {
          let title = data.title;
          if (title.length < 30) {
            title = `${title} | ${context.businessInfo.name}`;
          }
          if (title.length > 60) {
            title = title.substring(0, 57) + '...';
          }
          return { ...data, title };
        }
      },

      {
        name: 'Warsaw Location Keywords',
        type: 'title',
        category: 'local',
        priority: 95,
        condition: (data, context) => {
          return !this.warsawKeywords.some(keyword =>
            data.title.toLowerCase().includes(keyword.toLowerCase())
          );
        },
        action: (data, context) => {
          const locationKeyword = context.location || 'Warszawa';
          const title = `${data.title.split(' | ')[0]} ${locationKeyword} | ${context.businessInfo.name}`;
          return { ...data, title };
        }
      },

      {
        name: 'Keyword Placement in Title',
        type: 'title',
        category: 'seo',
        priority: 90,
        condition: (data, context) => {
          if (context.targetKeywords.length === 0) return false;
          const mainKeyword = context.targetKeywords[0].toLowerCase();
          return !data.title.toLowerCase().startsWith(mainKeyword.substring(0, 20));
        },
        action: (data, context) => {
          if (context.targetKeywords.length === 0) return data;
          const mainKeyword = context.targetKeywords[0];
          const title = `${mainKeyword} | ${data.title.split(' | ').slice(1).join(' | ')}`;
          return { ...data, title };
        }
      },

      // Description optimization rules
      {
        name: 'Description Length Optimization',
        type: 'description',
        category: 'seo',
        priority: 95,
        condition: (data, context) => {
          return data.description.length < 120 || data.description.length > 160;
        },
        action: (data, context) => {
          let description = data.description;
          if (description.length < 120) {
            description += ` Sprawdź naszą ofertę w ${context.location || 'Warszawie'}!`;
          }
          if (description.length > 160) {
            description = description.substring(0, 157) + '...';
          }
          return { ...data, description };
        }
      },

      {
        name: 'Include Call-to-Action in Description',
        type: 'description',
        category: 'seo',
        priority: 80,
        condition: (data, context) => {
          const ctaKeywords = ['umów', 'rezerwuj', 'zadzwoń', 'sprawdź', 'wypróbuj'];
          return !ctaKeywords.some(cta => data.description.toLowerCase().includes(cta));
        },
        action: (data, context) => {
          const cta = 'Umów wizytę online';
          const description = `${data.description} ✅ ${cta} i przekonaj się sam!`;
          return { ...data, description };
        }
      },

      {
        name: 'Include Phone Number in Description',
        type: 'description',
        category: 'local',
        priority: 75,
        condition: (data, context) => {
          return !data.description.includes(context.businessInfo.phone.replace(/\s/g, ''));
        },
        action: (data, context) => {
          const phone = context.businessInfo.phone;
          const description = `${data.description} 📞 ${phone}`;
          return { ...data, description };
        }
      },

      // Keyword optimization
      {
        name: 'Remove Stop Words from Keywords',
        type: 'keywords',
        category: 'seo',
        priority: 70,
        condition: (data, context) => {
          return data.keywords.some(keyword =>
            this.polishStopWords.has(keyword.toLowerCase())
          );
        },
        action: (data, context) => {
          const filteredKeywords = data.keywords.filter(keyword =>
            !this.polishStopWords.has(keyword.toLowerCase())
          );
          return { ...data, keywords: filteredKeywords };
        }
      },

      {
        name: 'Add Long-tail Keywords',
        type: 'keywords',
        category: 'seo',
        priority: 65,
        condition: (data, context) => {
          return data.keywords.length < 8;
        },
        action: (data, context) => {
          const longTailKeywords = this.generateLongTailKeywords(context);
          const keywords = [...data.keywords, ...longTailKeywords].slice(0, 10);
          return { ...data, keywords };
        }
      },

      // Technical SEO
      {
        name: 'Add Hreflang Tags',
        type: 'technical',
        category: 'technical',
        priority: 85,
        condition: (data, context) => {
          return !data.additionalMeta['content-language'];
        },
        action: (data, context) => {
          return {
            ...data,
            additionalMeta: {
              ...data.additionalMeta,
              'content-language': context.language,
              'geo.region': 'PL-MZ',
              'geo.placename': context.location || 'Warszawa',
              'ICBM': `${context.businessInfo.coordinates.lat},${context.businessInfo.coordinates.lng}`
            }
          };
        }
      },

      {
        name: 'Add Structured Data Reference',
        type: 'technical',
        category: 'technical',
        priority: 80,
        condition: (data, context) => {
          return !data.additionalMeta['schema-type'];
        },
        action: (data, context) => {
          const schemaType = this.determineSchemaType(context.pageType);
          return {
            ...data,
            additionalMeta: {
              ...data.additionalMeta,
              'schema-type': schemaType,
              'page-type': context.pageType,
              'target-location': context.location || 'Warszawa'
            }
          };
        }
      },

      // Social media optimization
      {
        name: 'Optimize OG Title',
        type: 'og',
        category: 'social',
        priority: 75,
        condition: (data, context) => {
          return data.ogTitle === data.title && data.title.length > 55;
        },
        action: (data, context) => {
          const ogTitle = data.title.length > 55 ?
            data.title.substring(0, 52) + '...' : data.title;
          return { ...data, ogTitle };
        }
      },

      {
        name: 'Add OG Locale',
        type: 'og',
        category: 'social',
        priority: 70,
        condition: (data, context) => {
          return !data.additionalMeta['og:locale'];
        },
        action: (data, context) => {
          const locale = context.language === 'pl' ? 'pl_PL' : 'en_US';
          return {
            ...data,
            additionalMeta: {
              ...data.additionalMeta,
              'og:locale': locale,
              'og:site_name': context.businessInfo.name
            }
          };
        }
      }
    ];
  }

  private generateOptimizedTitle(content: any, context: OptimizationContext): string {
    const { title, keywords, location } = content;
    let optimizedTitle = title;

    // Add main keyword at the beginning
    if (keywords.length > 0) {
      const mainKeyword = keywords[0];
      if (!optimizedTitle.toLowerCase().startsWith(mainKeyword.toLowerCase())) {
        optimizedTitle = `${mainKeyword} | ${optimizedTitle}`;
      }
    }

    // Add location modifier
    const locationModifier = location || context.location || 'Warszawa';
    if (!optimizedTitle.toLowerCase().includes(locationModifier.toLowerCase())) {
      optimizedTitle = `${optimizedTitle.split(' | ')[0]} ${locationModifier} | ${context.businessInfo.name}`;
    }

    // Ensure optimal length
    if (optimizedTitle.length > 60) {
      optimizedTitle = optimizedTitle.substring(0, 57) + '...';
    }

    if (optimizedTitle.length < 30) {
      optimizedTitle = `${optimizedTitle} | ${context.businessInfo.name}`;
    }

    return optimizedTitle;
  }

  private generateOptimizedDescription(content: any, context: OptimizationContext): string {
    const { description, uniqueValue } = content;
    let optimizedDescription = description;

    // Add unique value propositions
    if (uniqueValue.length > 0) {
      const valueProps = uniqueValue.slice(0, 2).join(' • ');
      if (!optimizedDescription.includes(valueProps)) {
        optimizedDescription = `${optimizedDescription} ✅ ${valueProps}`;
      }
    }

    // Add call-to-action
    const ctaPhrases = ['umów wizytę online', 'rezerwuj teraz', 'sprawdź ofertę', 'zadzwoń do nas'];
    const hasCTA = ctaPhrases.some(cta => optimizedDescription.toLowerCase().includes(cta));
    if (!hasCTA) {
      optimizedDescription += ` 📞 ${context.businessInfo.phone} | Umów online!`;
    }

    // Add location
    const locationModifier = context.location || 'Warszawa';
    if (!optimizedDescription.toLowerCase().includes(locationModifier.toLowerCase())) {
      optimizedDescription = `${locationModifier} - ${optimizedDescription}`;
    }

    // Ensure optimal length
    if (optimizedDescription.length > 160) {
      optimizedDescription = optimizedDescription.substring(0, 157) + '...';
    }

    if (optimizedDescription.length < 120) {
      optimizedDescription += ` Najlepsze usługi w ${locationModifier}!`;
    }

    return optimizedDescription;
  }

  private generateOptimizedKeywords(content: any, context: OptimizationContext): string[] {
    const { keywords } = content;
    let optimizedKeywords = [...keywords];

    // Add Warsaw-specific keywords
    if (context.location) {
      optimizedKeywords.push(`${context.location} ${content.category}`);
    }
    optimizedKeywords.push(`warszawa ${content.category}`);

    // Add long-tail variations
    const longTails = this.generateLongTailKeywords(context);
    optimizedKeywords.push(...longTails);

    // Add Polish variations
    const polishVariations = this.generatePolishVariations(content.category);
    optimizedKeywords.push(...polishVariations);

    // Remove duplicates and stop words
    optimizedKeywords = [...new Set(optimizedKeywords)]
      .filter(keyword => !this.polishStopWords.has(keyword.toLowerCase()))
      .slice(0, 10);

    return optimizedKeywords;
  }

  private generateLongTailKeywords(context: OptimizationContext): string[] {
    const keywords: string[] = [];
    const baseKeywords = context.targetKeywords.slice(0, 3);

    baseKeywords.forEach(keyword => {
      keywords.push(`${keyword} ${context.location || 'Warszawa'}`);
      keywords.push(`${keyword} cena`);
      keywords.push(`${keyword} opinie`);
      keywords.push(`najlepszy ${keyword}`);
      keywords.push(`polecany ${keyword}`);
    });

    return keywords;
  }

  private generatePolishVariations(category: string): string[] {
    const variations: Record<string, string[]> = {
      'beauty': ['salon urody', 'gabinet kosmetyczny', 'studio piękności', 'kosmetyka'],
      'fitness': ['siłownia', 'klub fitness', 'trening', 'ćwiczenia', 'studio treningowe'],
      'permanent-makeup': ['makijaż permanentny', 'pmu', 'microblading', 'kosmetyka permanentna'],
      'brow-styling': ['stylizacja brwi', 'lamówka brwi', 'regulacja brwi', 'architektura brwi']
    };

    return variations[category] || [];
  }

  private generateOptimizedOGImage(content: any, context: OptimizationContext): string {
    return `${context.url}/og-image-${content.category}.webp`;
  }

  private generateOptimizedTwitterImage(content: any, context: OptimizationContext): string {
    return `${context.url}/twitter-image-${content.category}.webp`;
  }

  private generateAdditionalMeta(content: any, context: OptimizationContext): Record<string, string> {
    return {
      'author': context.businessInfo.name,
      'publisher': context.businessInfo.name,
      'robots': 'index, follow',
      'googlebot': 'index, follow',
      'language': context.language,
      'geo.region': 'PL-MZ',
      'geo.placename': context.location || 'Warszawa',
      'geo.position': `${context.businessInfo.coordinates.lat};${context.businessInfo.coordinates.lng}`,
      'ICBM': `${context.businessInfo.coordinates.lat},${context.businessInfo.coordinates.lng}`,
      'content-type': 'text/html; charset=UTF-8',
      'viewport': 'width=device-width, initial-scale=1',
      'theme-color': '#8B4513',
      'category': content.category,
      'target-audience': content.targetAudience
    };
  }

  private calculateRuleImpact(rule: OptimizationRule, context: OptimizationContext): 'high' | 'medium' | 'low' {
    if (rule.priority >= 90) return 'high';
    if (rule.priority >= 70) return 'medium';
    return 'low';
  }

  private getRuleDescription(rule: OptimizationRule, context: OptimizationContext): string {
    const descriptions: Record<string, string> = {
      'Title Length Optimization': 'Optimized title length for better search visibility',
      'Warsaw Location Keywords': 'Added Warsaw location keyword for local SEO',
      'Keyword Placement in Title': 'Moved primary keyword to the beginning of title',
      'Description Length Optimization': 'Optimized description length for better CTR',
      'Include Call-to-Action in Description': 'Added compelling call-to-action to description',
      'Include Phone Number in Description': 'Added phone number for better conversion',
      'Remove Stop Words from Keywords': 'Removed irrelevant stop words from keywords',
      'Add Long-tail Keywords': 'Added relevant long-tail keywords',
      'Add Hreflang Tags': 'Added hreflang tags for international SEO',
      'Add Structured Data Reference': 'Added structured data reference for rich snippets',
      'Optimize OG Title': 'Optimized Open Graph title for social sharing',
      'Add OG Locale': 'Added Open Graph locale for better targeting'
    };

    return descriptions[rule.name] || rule.name;
  }

  private calculateOptimizationScore(data: MetaTagData, context: OptimizationContext): OptimizationResult['score'] {
    const scores = {
      title: this.calculateTitleScore(data.title),
      description: this.calculateDescriptionScore(data.description),
      technical: this.calculateTechnicalScore(data, context),
      social: this.calculateSocialScore(data),
      local: this.calculateLocalScore(data, context)
    };

    return {
      overall: Math.round((scores.title + scores.description + scores.technical + scores.social + scores.local) / 5),
      ...scores
    };
  }

  private calculateTitleScore(title: string): number {
    let score = 0;

    // Length score
    if (title.length >= 30 && title.length <= 60) score += 30;
    else if (title.length >= 20 && title.length <= 70) score += 20;
    else score += 10;

    // Keyword presence
    if (title.length > 0) score += 25;

    // Location keyword
    if (this.warsawKeywords.some(keyword => title.toLowerCase().includes(keyword.toLowerCase()))) {
      score += 25;
    }

    // Brand name
    if (title.includes('|')) score += 20;

    return Math.min(100, score);
  }

  private calculateDescriptionScore(description: string): number {
    let score = 0;

    // Length score
    if (description.length >= 120 && description.length <= 160) score += 35;
    else if (description.length >= 100 && description.length <= 180) score += 25;
    else score += 15;

    // Call-to-action
    const ctaKeywords = ['umów', 'rezerwuj', 'zadzwoń', 'sprawdź', 'wypróbuj'];
    if (ctaKeywords.some(cta => description.toLowerCase().includes(cta))) {
      score += 25;
    }

    // Phone number
    if (/\d{3}[\s-]?\d{3}[\s-]?\d{3}/.test(description)) {
      score += 20;
    }

    // Value proposition
    if (description.includes('✅') || description.includes('⭐')) {
      score += 20;
    }

    return Math.min(100, score);
  }

  private calculateTechnicalScore(data: MetaTagData, context: OptimizationContext): number {
    let score = 0;

    // Robots tag
    if (data.robots.includes('index')) score += 20;

    // Canonical URL
    if (data.canonical === context.url) score += 20;

    // Additional meta tags
    if (data.additionalMeta['geo.region']) score += 15;
    if (data.additionalMeta['content-language']) score += 15;
    if (data.additionalMeta['schema-type']) score += 15;
    if (data.additionalMeta['author']) score += 15;

    return Math.min(100, score);
  }

  private calculateSocialScore(data: MetaTagData): number {
    let score = 0;

    // OG tags
    if (data.ogTitle && data.ogTitle !== '') score += 20;
    if (data.ogDescription && data.ogDescription !== '') score += 20;
    if (data.ogImage && data.ogImage !== '') score += 20;

    // Twitter tags
    if (data.twitterTitle && data.twitterTitle !== '') score += 20;
    if (data.twitterDescription && data.twitterDescription !== '') score += 20;

    return Math.min(100, score);
  }

  private calculateLocalScore(data: MetaTagData, context: OptimizationContext): number {
    let score = 0;

    // Location in title
    if (this.warsawKeywords.some(keyword => data.title.toLowerCase().includes(keyword.toLowerCase()))) {
      score += 30;
    }

    // Location in description
    if (this.warsawKeywords.some(keyword => data.description.toLowerCase().includes(keyword.toLowerCase()))) {
      score += 25;
    }

    // Location keywords
    if (data.keywords.some(keyword =>
      this.warsawKeywords.some(warsawKeyword =>
        keyword.toLowerCase().includes(warsawKeyword.toLowerCase())
      )
    )) {
      score += 25;
    }

    // Geo meta tags
    if (data.additionalMeta['geo.placename']) score += 20;

    return Math.min(100, score);
  }

  private generateRecommendations(data: MetaTagData, context: OptimizationContext): OptimizationResult['recommendations'] {
    const recommendations: OptimizationResult['recommendations'] = [];

    // Title recommendations
    if (data.title.length < 30) {
      recommendations.push({
        type: 'improvement',
        message: 'Title is too short',
        action: 'Add more descriptive keywords or location information',
        impact: 'medium'
      });
    }

    if (data.title.length > 60) {
      recommendations.push({
        type: 'improvement',
        message: 'Title is too long',
        action: 'Shorten title to avoid truncation in search results',
        impact: 'high'
      });
    }

    // Description recommendations
    if (data.description.length < 120) {
      recommendations.push({
        type: 'improvement',
        message: 'Description is too short',
        action: 'Add more compelling copy with value propositions',
        impact: 'medium'
      });
    }

    if (!data.description.includes('✅')) {
      recommendations.push({
        type: 'opportunity',
        message: 'Add value propositions with emojis',
        action: 'Include benefits and unique selling points',
        impact: 'low'
      });
    }

    // Technical recommendations
    if (!data.additionalMeta['schema-type']) {
      recommendations.push({
        type: 'improvement',
        message: 'Missing structured data reference',
        action: 'Add schema markup for better rich snippet opportunities',
        impact: 'high'
      });
    }

    return recommendations;
  }

  private hasLocalIntent(keyword: string): boolean {
    return this.warsawKeywords.some(warsawKeyword =>
      keyword.toLowerCase().includes(warsawKeyword.toLowerCase())
    );
  }

  private hasQuestionIntent(keyword: string): boolean {
    return /^(jak|ile|czy|co|kiedy|gdzie|dlaczego|który|jaki)/i.test(keyword);
  }

  private hasInformationalIntent(keyword: string): boolean {
    const informationalWords = ['poradnik', 'jak', 'guide', 'informacje', 'opis', 'co to jest'];
    return informationalWords.some(word => keyword.toLowerCase().includes(word));
  }

  private hasVisualIntent(keyword: string): boolean {
    const visualWords = ['zdjęcia', 'przed i po', 'galeria', 'wideo', 'tutorial', 'pokaz'];
    return visualWords.some(word => keyword.toLowerCase().includes(word));
  }

  private determineSchemaType(pageType: string): string {
    const schemaTypes: Record<string, string> = {
      'service': 'Service',
      'blog': 'Article',
      'location': 'LocalBusiness',
      'contact': 'ContactPage',
      'booking': 'Reservation',
      'home': 'WebSite'
    };

    return schemaTypes[pageType] || 'WebPage';
  }
}

export default MetaTagOptimizer;