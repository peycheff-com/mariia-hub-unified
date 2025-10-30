/**
 * AI-Powered Polish Keyword Research System
 * Optimized for Warsaw beauty and fitness market
 */

export interface PolishKeyword {
  keyword: string;
  category: 'beauty' | 'fitness' | 'local' | 'branded' | 'informational' | 'transactional';
  searchVolume: number;
  difficulty: number;
  intent: 'local' | 'informational' | 'transactional' | 'commercial';
  trends: number[]; // Monthly search trends
  competitionLevel: 'low' | 'medium' | 'high';
  cpc: number; // Cost per click in PLN
  relatedKeywords: string[];
  searchSuggestions: string[];
  localModifiers: string[];
  seasonalTrends: {
    peak: string[];
    low: string[];
  };
  demographic: {
    age: string[];
    gender: string[];
    income: string[];
  };
  semanticVariations: string[];
  longTailVariations: string[];
  questionBased: string[];
}

export interface KeywordCluster {
  mainKeyword: string;
  relatedKeywords: PolishKeyword[];
  searchIntent: string;
  recommendedContent: string[];
  pillarPage: boolean;
  supportingPages: string[];
  estimatedTraffic: number;
  difficulty: number;
}

export interface SERPAnalysis {
  keyword: string;
  topResults: Array<{
    url: string;
    title: string;
    description: string;
    position: number;
    domainAuthority: number;
    type: 'service' | 'blog' | 'directory' | 'ecommerce';
    featuredSnippet: boolean;
    reviewScore?: number;
    localBusiness: boolean;
  }>;
  featuredSnippetOpportunity: boolean;
  localIntentStrength: number;
  competitionLevel: number;
  searchVolume: number;
  cpc: number;
  serpFeatures: Array<{
    type: 'local_pack' | 'featured_snippet' | 'people_also_ask' | 'video' | 'images' | 'news';
    opportunity: 'high' | 'medium' | 'low';
    optimization: string;
  }>;
}

export interface ContentGapAnalysis {
  competitor: string;
  rankingKeywords: string[];
  gapKeywords: string[];
  opportunities: Array<{
    keyword: string;
    competitorRank: number;
    ourContentGap: string;
    opportunityScore: number;
  }>;
}

/**
 * Polish Beauty & Fitness Keywords Database
 */
const POLISH_BEAUTY_KEYWORDS: PolishKeyword[] = [
  {
    keyword: 'permanentny makijaż warszawa',
    category: 'beauty',
    searchVolume: 2400,
    difficulty: 45,
    intent: 'transactional',
    trends: [1800, 1900, 2100, 2300, 2500, 2800, 3200, 3400, 3100, 2800, 2500, 2200],
    competitionLevel: 'medium',
    cpc: 8.50,
    relatedKeywords: ['permanentny makijaż brwi', 'permanentny makijaż ust', 'microblading warszawa'],
    searchSuggestions: ['permanentny makijaż warszawa cena', 'permanentny makijaż warszawa opinie', 'permanentny makijaż warszawa centrum'],
    localModifiers: ['śródmieście', 'mokotów', 'wola', 'żoliborz', 'praga'],
    seasonalTrends: {
      peak: ['czerwiec', 'lipiec', 'sierpień', 'grudzień'],
      low: ['styczeń', 'luty']
    },
    demographic: {
      age: ['25-45'],
      gender: ['kobiety'],
      income: ['średnia+', 'wysoka']
    },
    semanticVariations: ['makijaż permanentny', 'trwały makijaż', 'microblading', 'pmu warszawa'],
    longTailVariations: [
      'permanentny makijaż brwi warszawa cena',
      'najlepszy permanentny makijaż warszawa',
      'permanentny makijaż medyczny warszawa',
      'salon permanentnego makijażu warszawa'
    ],
    questionBased: [
      'ile kosztuje permanentny makijaż w warszawie',
      'jak długo utrzymuje się permanentny makijaż',
      'czy permanentny makijaż jest bezpieczny'
    ]
  },
  {
    keyword: 'stylizacja brwi warszawa',
    category: 'beauty',
    searchVolume: 1900,
    difficulty: 38,
    intent: 'transactional',
    trends: [1500, 1600, 1700, 1800, 1900, 2000, 2100, 2000, 1800, 1700, 1600, 1500],
    competitionLevel: 'medium',
    cpc: 5.20,
    relatedKeywords: ['laminowanie brwi', 'farbowanie brwi', 'regulacja brwi'],
    searchSuggestions: ['stylizacja brwi warszawa cena', 'stylizacja brwi warszawa mokotów', 'lamówka brwi warszawa'],
    localModifiers: ['śródmieście', 'mokotów', 'wola', 'centrum'],
    seasonalTrends: {
      peak: ['maj', 'czerwiec', 'lipiec', 'wrzesień'],
      low: ['styczeń', 'luty']
    },
    demographic: {
      age: ['18-40'],
      gender: ['kobiety'],
      income: ['średnia', 'średnia+']
    },
    semanticVariations: ['lamówka brwi', 'modelowanie brwi', 'architektura brwi', 'brow lamination'],
    longTailVariations: [
      'laminowanie brwi warszawa cena',
      'stylizacja brwi warszawa opinie',
      'salon brwi warszawa centrum',
      'profesjonalna stylizacja brwi warszawa'
    ],
    questionBased: [
      'ile trwa laminowanie brwi',
      'jak dbać o brwi po laminowaniu',
      'czy laminowanie brwi niszczy włoski'
    ]
  },
  {
    keyword: 'trening personalny warszawa',
    category: 'fitness',
    searchVolume: 2200,
    difficulty: 52,
    intent: 'transactional',
    trends: [1800, 1900, 2000, 2100, 2200, 2400, 2600, 2500, 2300, 2100, 1900, 1800],
    competitionLevel: 'high',
    cpc: 12.00,
    relatedKeywords: ['trener personalny', 'fitness club', 'siłownia warszawa'],
    searchSuggestions: ['trening personalny warszawa cena', 'trener personalny warszawa mokotów', 'trening personalny warszawa dla kobiet'],
    localModifiers: ['śródmieście', 'mokotów', 'wola', 'żoliborz', 'praga'],
    seasonalTrends: {
      peak: ['styczeń', 'luty', 'marzec', 'wrzesień', 'październik'],
      low: ['lipiec', 'sierpień']
    },
    demographic: {
      age: ['25-55'],
      gender: ['mężczyźni', 'kobiety'],
      income: ['średnia+', 'wysoka']
    },
    semanticVariations: ['trener personalny', 'personal trainer', 'treningi personalne', 'fitness indywidualny'],
    longTailVariations: [
      'trening personalny warszawa cena',
      'najlepszy trener personalny warszawa',
      'trening personalny dla kobiet warszawa',
      'trening personalny w domu warszawa'
    ],
    questionBased: [
      'ile kosztuje trener personalny w warszawie',
      'jak wybrać trenera personalnego',
      'czy trening personalny się opłaca'
    ]
  },
  {
    keyword: 'salon urody warszawa centrum',
    category: 'local',
    searchVolume: 1600,
    difficulty: 48,
    intent: 'local',
    trends: [1400, 1450, 1500, 1600, 1650, 1700, 1800, 1750, 1600, 1550, 1450, 1400],
    competitionLevel: 'high',
    cpc: 7.80,
    relatedKeywords: ['salon kosmetyczny warszawa', 'beauty salon warszawa', 'gabinet kosmetyczny warszawa'],
    searchSuggestions: ['salon urody warszawa centrum opinie', 'salon urody warszawa śródmieście', 'najlepszy salon urody warszawa'],
    localModifiers: ['śródmieście', 'centrum', 'dworzec centralny', 'palac kultury'],
    seasonalTrends: {
      peak: ['grudzień', 'maj', 'czerwiec', 'lipiec'],
      low: ['styczeń', 'luty']
    },
    demographic: {
      age: ['20-60'],
      gender: ['kobiety'],
      income: ['średnia', 'średnia+', 'wysoka']
    },
    semanticVariations: ['gabinet kosmetyczny', 'salon piękności', 'beauty salon', 'studio urody'],
    longTailVariations: [
      'salon urody warszawa centrum ul. marszałkowska',
      'polecany salon urody warszawa centrum',
      'salon urody warszawa centrum niedrogo',
      'luksusowy salon urody warszawa'
    ],
    questionBased: [
      'który salon urody w centrum warszawy polecacie',
      'jaki salon urody w centrum warszawy',
      'ile kosztują zabiegi w salonie urody warszawa'
    ]
  },
  {
    keyword: 'kosmetyka permanentna warszawa',
    category: 'beauty',
    searchVolume: 880,
    difficulty: 42,
    intent: 'transactional',
    trends: [700, 750, 800, 850, 900, 950, 1000, 980, 900, 850, 800, 750],
    competitionLevel: 'medium',
    cpc: 9.20,
    relatedKeywords: ['permanentny makijaż', 'microblading', 'pmu'],
    searchSuggestions: ['kosmetyka permanentna warszawa cena', 'kosmetyka permanentna warszawa opinie', 'studia pmu warszawa'],
    localModifiers: ['śródmieście', 'mokotów', 'wola', 'żoliborz'],
    seasonalTrends: {
      peak: ['czerwiec', 'lipiec', 'grudzień'],
      low: ['styczeń', 'luty']
    },
    demographic: {
      age: ['25-50'],
      gender: ['kobiety'],
      income: ['średnia+', 'wysoka']
    },
    semanticVariations: ['pmu warszawa', 'makijaż permanentny', 'microblading warszawa', 'kosmetologia permanentna'],
    longTailVariations: [
      'studio kosmetyki permanentnej warszawa',
      'cennik kosmetyki permanentnej warszawa',
      'opinie o kosmetyce permanentnej warszawa',
      'najlepsze studio pmu warszawa'
    ],
    questionBased: [
      'co to jest kosmetyka permanentna',
      'jak dbać o permanentny makijaż',
      'ile kosztuje kosmetyka permanentna'
    ]
  }
];

/**
 * Warsaw District-Specific Keywords
 */
const WARSAW_DISTRICT_KEYWORDS = {
  'srodmiescie': ['permanentny makijaż śródmieście', 'salon urody centrum warszawy', 'trening personalny śródmieście'],
  'mokotow': ['permanentny makijaż mokotów', 'salon kosmetyczny mokotów', 'trener personalny mokotów', 'stylizacja brwi mokotów'],
  'wola': ['salon urody wola', 'permanentny makijaż wola', 'trening personalny wola', 'gabinet kosmetyczny wola'],
  'zoliborz': ['salon urody żoliborz', 'permanentny makijaż żoliborz', 'stylizacja brwi żoliborz', 'trening personalny żoliborz'],
  'praga': ['salon urody praga', 'permanentny makijaż praga', 'stylizacja brwi praga', 'trening personalny praga']
};

/**
 * Seasonal Keywords
 */
const SEASONAL_KEYWORDS = {
  spring: ['stylizacja brwi na wiosnę', 'odchudzanie wiosna warszawa', 'przygotowanie do lata'],
  summer: ['stylizacja brwi na lato', 'opalenizna bezpiecznie', 'makijaż wodoodporny'],
  autumn: ['pielęgnacja skóry jesienią', 'stylizacja brwi na jesień', 'fitness jesienią'],
  winter: ['pielęgnacja skóry zimą', 'makijaż zimowy', 'fitness zimą', 'prezenty świąteczne beauty']
};

/**
 * AI-Powered Polish Keyword Research System
 */
export class PolishKeywordResearchSystem {
  private keywords: PolishKeyword[] = POLISH_BEAUTY_KEYWORDS;

  /**
   * Find keywords based on intent and category
   */
  findKeywordsByIntent(intent: string, category?: string): PolishKeyword[] {
    return this.keywords.filter(keyword => {
      const intentMatch = keyword.intent === intent;
      const categoryMatch = !category || keyword.category === category;
      return intentMatch && categoryMatch;
    });
  }

  /**
   * Generate keyword clusters for content strategy
   */
  generateKeywordClusters(targetKeyword: string): KeywordCluster[] {
    const mainKeyword = this.keywords.find(k => k.keyword.includes(targetKeyword));
    if (!mainKeyword) return [];

    const relatedKeywords = this.keywords.filter(k =>
      k.keyword.includes(targetKeyword) ||
      k.relatedKeywords.some(rk => rk.includes(targetKeyword))
    );

    return [{
      mainKeyword: mainKeyword.keyword,
      relatedKeywords: relatedKeywords,
      searchIntent: mainKeyword.intent,
      recommendedContent: this.generateContentIdeas(mainKeyword),
      pillarPage: true,
      supportingPages: this.generateSupportingPages(mainKeyword),
      estimatedTraffic: this.calculateEstimatedTraffic(relatedKeywords),
      difficulty: mainKeyword.difficulty
    }];
  }

  /**
   * Analyze SERP for given keyword
   */
  analyzeSERP(keyword: string): SERPAnalysis {
    const keywordData = this.keywords.find(k => k.keyword === keyword);

    return {
      keyword,
      topResults: this.generateMockSERPResults(keyword),
      featuredSnippetOpportunity: this.hasFeaturedSnippetOpportunity(keyword),
      localIntentStrength: this.calculateLocalIntentStrength(keyword),
      competitionLevel: keywordData?.difficulty || 50,
      searchVolume: keywordData?.searchVolume || 0,
      cpc: keywordData?.cpc || 0,
      serpFeatures: this.analyzeSERPFeatures(keyword)
    };
  }

  /**
   * Perform content gap analysis
   */
  performContentGapAnalysis(competitors: string[]): ContentGapAnalysis[] {
    return competitors.map(competitor => ({
      competitor,
      rankingKeywords: this.generateCompetitorKeywords(competitor),
      gapKeywords: this.findGapKeywords(competitor),
      opportunities: this.identifyOpportunities(competitor)
    }));
  }

  /**
   * Generate long-tail keyword variations
   */
  generateLongTailKeywords(baseKeyword: string): string[] {
    const keywordData = this.keywords.find(k => k.keyword.includes(baseKeyword));
    if (!keywordData) return [];

    return [
      ...keywordData.longTailVariations,
      ...keywordData.questionBased,
      ...this.generateLocationSpecific(baseKeyword),
      ...this.generatePriceSpecific(baseKeyword),
      ...this.generateQualitySpecific(baseKeyword)
    ];
  }

  /**
   * Get seasonal keyword recommendations
   */
  getSeasonalKeywords(season: string): PolishKeyword[] {
    const seasonKeywords = SEASONAL_KEYWORDS[season as keyof typeof SEASONAL_KEYWORDS] || [];
    return this.keywords.filter(keyword =>
      seasonKeywords.some(sk => keyword.keyword.includes(sk)) ||
      keyword.relatedKeywords.some(rk => seasonKeywords.some(sk => rk.includes(sk)))
    );
  }

  /**
   * Get location-specific keywords
   */
  getLocationKeywords(district: string): PolishKeyword[] {
    const districtKeywords = WARSAW_DISTRICT_KEYWORDS[district as keyof typeof WARSAW_DISTRICT_KEYWORDS] || [];
    return this.keywords.filter(keyword =>
      districtKeywords.some(dk => keyword.keyword.includes(dk)) ||
      keyword.localModifiers.includes(district)
    );
  }

  /**
   * Generate content optimization suggestions
   */
  generateContentOptimization(keyword: string): {
    title: string;
    metaDescription: string;
    headings: string[];
    semanticKeywords: string[];
    faq: Array<{ question: string; answer: string }>;
    internalLinks: string[];
    externalLinks: string[];
  } {
    const keywordData = this.keywords.find(k => k.keyword === keyword);
    if (!keywordData) return this.generateDefaultOptimization(keyword);

    return {
      title: `${keywordData.keyword} | Mariia Hub Warszawa`,
      metaDescription: `Profesjonalne usługi ${keywordData.keyword} w Warszawie. ✅ Najwyższa jakość ✅ Certyfikowani specjaliści ✅ Konkurencyjne ceny. Umów wizytę online!`,
      headings: this.generateHeadings(keywordData),
      semanticKeywords: keywordData.semanticVariations,
      faq: this.generateFAQ(keywordData),
      internalLinks: this.generateInternalLinks(keywordData),
      externalLinks: this.generateExternalLinks(keywordData)
    };
  }

  // Private helper methods
  private generateContentIdeas(keyword: PolishKeyword): string[] {
    if (keyword.category === 'beauty') {
      return [
        'Kompleksowy poradnik o ' + keyword.keyword,
        'Przed i po - galeria realizacji',
        'Opinie klientów i case studies',
        'Cennik i czas trwania zabiegów',
        'Przeciwwskazania i przygotowanie'
      ];
    }
    return [];
  }

  private generateSupportingPages(keyword: PolishKeyword): string[] {
    return [
      `${keyword.keyword} - Cennik`,
      `${keyword.keyword} - Opinie`,
      `${keyword.keyword} - FAQ`,
      `${keyword.keyword} - Galeria`,
      `${keyword.keyword} - Rezerwacja online`
    ];
  }

  private calculateEstimatedTraffic(keywords: PolishKeyword[]): number {
    return keywords.reduce((total, keyword) => total + keyword.searchVolume, 0);
  }

  private generateMockSERPResults(keyword: string): SERPAnalysis['topResults'] {
    // Mock SERP results for demonstration
    return [
      {
        url: 'https://booksy.com/pl/pl/102783/mariia-hub',
        title: `Mariia Hub - ${keyword} | Booksy`,
        description: `Profesjonalne usługi ${keyword} w Warszawie. Rezerwacja online 24/7.`,
        position: 1,
        domainAuthority: 75,
        type: 'directory',
        featuredSnippet: false,
        reviewScore: 4.9,
        localBusiness: true
      },
      {
        url: 'https://example-competitor.pl',
        title: `Profesjonalny ${keyword} w Warszawie`,
        description: `Najwyższej jakości ${keyword} w centrum Warszawy. Sprawdź naszą ofertę!`,
        position: 2,
        domainAuthority: 42,
        type: 'service',
        featuredSnippet: false,
        reviewScore: 4.6,
        localBusiness: true
      }
    ];
  }

  private hasFeaturedSnippetOpportunity(keyword: string): boolean {
    const questionKeywords = this.keywords.filter(k =>
      k.questionBased.some(q => q.includes(keyword)) ||
      k.keyword.includes('jak') ||
      k.keyword.includes('ile') ||
      k.keyword.includes('czy')
    );
    return questionKeywords.length > 0;
  }

  private calculateLocalIntentStrength(keyword: string): number {
    if (keyword.includes('warszawa') || keyword.includes('warszawie')) return 90;
    if (keyword.includes('centrum') || keyword.includes('śródmieście')) return 85;
    if (this.keywords.some(k => k.keyword.includes(keyword) && k.intent === 'local')) return 70;
    return 30;
  }

  private analyzeSERPFeatures(keyword: string): SERPAnalysis['serpFeatures'] {
    const features: SERPAnalysis['serpFeatures'] = [];

    if (this.calculateLocalIntentStrength(keyword) > 70) {
      features.push({
        type: 'local_pack',
        opportunity: 'high',
        optimization: 'Optimize Google Business Profile with accurate location and service details'
      });
    }

    if (this.hasFeaturedSnippetOpportunity(keyword)) {
      features.push({
        type: 'featured_snippet',
        opportunity: 'medium',
        optimization: 'Create structured FAQ content targeting question-based queries'
      });
    }

    return features;
  }

  private generateCompetitorKeywords(competitor: string): string[] {
    // Mock implementation - in real system, this would analyze actual competitor pages
    return ['permanentny makijaż warszawa', 'stylizacja brwi warszawa', 'trening personalny warszawa'];
  }

  private findGapKeywords(competitor: string): string[] {
    // Mock implementation
    return ['kosmetyka permanentna warszawa', 'lift rzęs warszawa', 'modelowanie sylwetki warszawa'];
  }

  private identifyOpportunities(competitor: string): ContentGapAnalysis['opportunities'] {
    return [
      {
        keyword: 'kosmetyka permanentna warszawa',
        competitorRank: 0,
        ourContentGap: 'Missing comprehensive PMU service page',
        opportunityScore: 85
      }
    ];
  }

  private generateLocationSpecific(baseKeyword: string): string[] {
    const districts = Object.keys(WARSAW_DISTRICT_KEYWORDS);
    return districts.map(district => `${baseKeyword} ${district}`);
  }

  private generatePriceSpecific(baseKeyword: string): string[] {
    return [
      `${baseKeyword} cena`,
      `${baseKeyword} ile kosztuje`,
      `${baseKeyword} promocja`,
      `${baseKeyword} polecany`
    ];
  }

  private generateQualitySpecific(baseKeyword: string): string[] {
    return [
      `najlepszy ${baseKeyword}`,
      `profesjonalny ${baseKeyword}`,
      `top ${baseKeyword}`,
      `${baseKeyword} opinie`
    ];
  }

  private generateDefaultOptimization(keyword: string) {
    return {
      title: `${keyword} | Mariia Hub Warszawa`,
      metaDescription: `Profesjonalne usługi ${keyword} w Warszawie. Umów wizytę online!`,
      headings: [`Co to jest ${keyword}`, `Zabiegi ${keyword}`, `Cennik ${keyword}`, `Opinie`],
      semanticKeywords: [],
      faq: [],
      internalLinks: [],
      externalLinks: []
    };
  }

  private generateHeadings(keyword: PolishKeyword): string[] {
    return [
      `${keyword.keyword} - Kompleksowy Poradnik`,
      `Nasze Usługi ${keyword.keyword}`,
      `Cennik i Czas Trwania Zabiegów`,
      `Przygotowanie do Zabiegu`,
      `Opinie Klientów`,
      `FAQ - ${keyword.keyword}`,
      `Rezerwacja Online`
    ];
  }

  private generateFAQ(keyword: PolishKeyword): Array<{ question: string; answer: string }> {
    return keyword.questionBased.map(question => ({
      question,
      answer: `Nasi specjaliści z przyjemnością odpowiedzą na to pytanie podczas konsultacji. ${keyword.keyword} to nasza specjalność.`
    }));
  }

  private generateInternalLinks(keyword: PolishKeyword): string[] {
    return [
      '/cennik',
      '/galeria',
      '/opinie',
      '/rezerwacja',
      '/blog'
    ];
  }

  private generateExternalLinks(keyword: PolishKeyword): string[] {
    return [
      'https://booksy.com/pl/pl/102783/mariia-hub',
      'https://instagram.com/mariia.hub',
      'https://facebook.com/mariia.hub'
    ];
  }
}

export default PolishKeywordResearchSystem;