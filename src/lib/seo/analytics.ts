import { Service } from '@/types/shared';

export interface KeywordData {
  keyword: string;
  position: number;
  searchVolume: number;
  clicks: number;
  impressions: number;
  ctr: number;
  url: string;
  device: 'desktop' | 'mobile' | 'tablet';
  date: string;
  competition: 'low' | 'medium' | 'high';
  difficulty: number;
}

export interface PagePerformanceData {
  url: string;
  page: string;
  sessions: number;
  users: number;
  pageviews: number;
  avgSessionDuration: number;
  bounceRate: number;
  conversions: number;
  conversionRate: number;
  avgPageLoadTime: number;
  coreWebVitals: {
    lcp: number;
    fid: number;
    cls: number;
  };
  date: string;
}

export interface CompetitorData {
  domain: string;
  organicKeywords: number;
  organicTraffic: number;
  backlinks: number;
  domainAuthority: number;
  topKeywords: Array<{
    keyword: string;
    position: number;
    url: string;
  }>;
  contentGaps: string[];
  technicalIssues: string[];
}

export interface ContentGapData {
  topic: string;
  searchVolume: number;
  difficulty: number;
  ourCoverage: 'missing' | 'partial' | 'complete';
  competitorCoverage: string[];
  opportunityScore: number;
  suggestedContentType: 'blog' | 'service' | 'faq' | 'landing';
  targetKeywords: string[];
}

export interface BacklinkData {
  sourceUrl: string;
  sourceDomain: string;
  targetUrl: string;
  anchorText: string;
  linkStrength: 'high' | 'medium' | 'low';
  domainAuthority: number;
  pageAuthority: number;
  isFollow: boolean;
  dateAcquired: string;
  trafficValue?: number;
}

export interface TechnicalSEOIssue {
  type: 'error' | 'warning' | 'info';
  category: 'performance' | 'accessibility' | 'seo' | 'best-practices';
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  recommendation: string;
  affectedUrls: string[];
  savings?: {
    bytes?: number;
    ms?: number;
    requests?: number;
  };
}

export interface SEOAlert {
  type: 'critical' | 'warning' | 'info';
  title: string;
  message: string;
  url?: string;
  timestamp: string;
  acknowledged: boolean;
  category: 'ranking' | 'technical' | 'content' | 'performance';
}

export interface SEOAnalyticsConfig {
  googleSearchConsole?: {
    apiKey: string;
    siteUrl: string;
  };
  googleAnalytics?: {
    trackingId: string;
    apiKey: string;
  };
  semrush?: {
    apiKey: string;
  };
  ahrefs?: {
    apiKey: string;
  };
  customMetrics?: Array<{
    name: string;
    description: string;
    calculation: string;
  }>;
}

/**
 * Comprehensive SEO analytics and tracking system
 */
export class SEOAnalytics {
  private static instance: SEOAnalytics;
  private config: SEOAnalyticsConfig;
  private dataCache: Map<string, any> = new Map();
  private alerts: SEOAlert[] = [];

  constructor(config: SEOAnalyticsConfig) {
    this.config = config;
    this.initializeTracking();
  }

  static getInstance(config?: SEOAnalyticsConfig): SEOAnalytics {
    if (!SEOAnalytics.instance) {
      if (!config) {
        throw new Error('Config required for first initialization');
      }
      SEOAnalytics.instance = new SEOAnalytics(config);
    }
    return SEOAnalytics.instance;
  }

  /**
   * Initialize SEO tracking
   */
  private initializeTracking() {
    // Google Search Console tracking
    if (typeof window !== 'undefined' && this.config.googleSearchConsole) {
      this.setupSearchConsoleTracking();
    }

    // Custom SEO event tracking
    this.setupCustomEventTracking();

    // Core Web Vitals monitoring
    this.setupCoreWebVitalsTracking();

    // Ranking change monitoring
    this.setupRankingMonitor();
  }

  /**
   * Track keyword performance
   */
  async trackKeywordPerformance(keywords: string[]): Promise<KeywordData[]> {
    // Mock implementation - in production, integrate with Google Search Console API
    const mockData: KeywordData[] = keywords.map((keyword, index) => ({
      keyword,
      position: Math.floor(Math.random() * 10) + 1,
      searchVolume: Math.floor(Math.random() * 1000) + 50,
      clicks: Math.floor(Math.random() * 100) + 10,
      impressions: Math.floor(Math.random() * 1000) + 100,
      ctr: Math.random() * 0.1 + 0.01,
      url: `https://mariia-hub.pl/${keyword.replace(/\s+/g, '-')}`,
      device: ['desktop', 'mobile', 'tablet'][Math.floor(Math.random() * 3)] as any,
      date: new Date().toISOString().split('T')[0],
      competition: ['low', 'medium', 'high'][Math.floor(Math.random() * 3)] as any,
      difficulty: Math.floor(Math.random() * 100) + 1
    }));

    this.dataCache.set('keywords', mockData);
    this.analyzeKeywordChanges(mockData);

    return mockData;
  }

  /**
   * Track page performance metrics
   */
  async trackPagePerformance(url: string): Promise<PagePerformanceData> {
    // Get real performance data from browser APIs
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    const paintEntries = performance.getEntriesByType('paint');

    const pageLoadTime = navigation.loadEventEnd - navigation.fetchStart;
    const fcp = paintEntries.find(entry => entry.name === 'first-contentful-paint')?.startTime || 0;

    // Mock additional metrics
    const mockData: PagePerformanceData = {
      url,
      page: new URL(url).pathname,
      sessions: Math.floor(Math.random() * 1000) + 100,
      users: Math.floor(Math.random() * 800) + 80,
      pageviews: Math.floor(Math.random() * 1500) + 150,
      avgSessionDuration: Math.floor(Math.random() * 180) + 30,
      bounceRate: Math.random() * 0.7 + 0.1,
      conversions: Math.floor(Math.random() * 50) + 5,
      conversionRate: Math.random() * 0.05 + 0.01,
      avgPageLoadTime: pageLoadTime,
      coreWebVitals: {
        lcp: fcp + Math.random() * 1000, // First Contentful Paint as proxy for LCP
        fid: Math.random() * 100 + 20, // Mock FID
        cls: Math.random() * 0.1 + 0.01 // Mock CLS
      },
      date: new Date().toISOString().split('T')[0]
    };

    this.dataCache.set(`page_${url}`, mockData);
    this.analyzePagePerformance(mockData);

    return mockData;
  }

  /**
   * Analyze competitor data
   */
  async analyzeCompetitors(domains: string[]): Promise<CompetitorData[]> {
    // Mock implementation - integrate with SEMrush/Ahrefs APIs
    const mockData: CompetitorData[] = domains.map(domain => ({
      domain,
      organicKeywords: Math.floor(Math.random() * 10000) + 1000,
      organicTraffic: Math.floor(Math.random() * 50000) + 5000,
      backlinks: Math.floor(Math.random() * 1000) + 100,
      domainAuthority: Math.floor(Math.random() * 40) + 30,
      topKeywords: [
        {
          keyword: 'permanentny makijaż warszawa',
          position: Math.floor(Math.random() * 5) + 1,
          url: `https://${domain}/service`
        },
        {
          keyword: 'stylizacja brwi',
          position: Math.floor(Math.random() * 10) + 1,
          url: `https://${domain}/brows`
        }
      ],
      contentGaps: [
        'aftercare guide',
        'pricing comparison',
        'client testimonials'
      ],
      technicalIssues: [
        'slow page load speed',
        'missing structured data',
        'poor mobile optimization'
      ]
    }));

    this.dataCache.set('competitors', mockData);
    this.identifyOpportunities(mockData);

    return mockData;
  }

  /**
   * Identify content gaps
   */
  async identifyContentGaps(
    services: Service[],
    competitorKeywords: string[]
  ): Promise<ContentGapData[]> {
    const serviceKeywords = services.flatMap(s => s.tags || []);
    const gaps: ContentGapData[] = [];

    // Find missing topics
    competitorKeywords.forEach(keyword => {
      const hasCoverage = serviceKeywords.some(sk =>
        sk.toLowerCase().includes(keyword.toLowerCase()) ||
        keyword.toLowerCase().includes(sk.toLowerCase())
      );

      if (!hasCoverage) {
        gaps.push({
          topic: keyword,
          searchVolume: Math.floor(Math.random() * 1000) + 50,
          difficulty: Math.floor(Math.random() * 100) + 1,
          ourCoverage: 'missing',
          competitorCoverage: ['competitor1.com', 'competitor2.com'],
          opportunityScore: Math.random() * 100,
          suggestedContentType: 'blog',
          targetKeywords: [keyword, `${keyword} warszawa`, `najlepszy ${keyword}`]
        });
      }
    });

    this.dataCache.set('content_gaps', gaps);
    return gaps;
  }

  /**
   * Track backlinks
   */
  async trackBacklinks(): Promise<BacklinkData[]> {
    // Mock implementation - integrate with Ahrefs/Majestic APIs
    const mockData: BacklinkData[] = [
      {
        sourceUrl: 'https://warsawlocal.com/beauty-salons',
        sourceDomain: 'warsawlocal.com',
        targetUrl: 'https://mariia-hub.pl',
        anchorText: 'best permanent makeup Warsaw',
        linkStrength: 'high',
        domainAuthority: 42,
        pageAuthority: 35,
        isFollow: true,
        dateAcquired: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
        trafficValue: Math.floor(Math.random() * 100) + 10
      },
      {
        sourceUrl: 'https://polskakosmetyka.pl/mariia-hub',
        sourceDomain: 'polskakosmetyka.pl',
        targetUrl: 'https://mariia-hub.pl/beauty',
        anchorText: 'studio urody warszawa',
        linkStrength: 'medium',
        domainAuthority: 55,
        pageAuthority: 28,
        isFollow: true,
        dateAcquired: new Date(Date.now() - Math.random() * 60 * 24 * 60 * 60 * 1000).toISOString()
      }
    ];

    this.dataCache.set('backlinks', mockData);
    this.analyzeBacklinkProfile(mockData);

    return mockData;
  }

  /**
   * Perform technical SEO audit
   */
  async performTechnicalAudit(url: string): Promise<TechnicalSEOIssue[]> {
    const issues: TechnicalSEOIssue[] = [];

    // Core Web Vitals issues
    const vitals = await this.measureCoreWebVitals();
    if (vitals.lcp > 2500) {
      issues.push({
        type: 'warning',
        category: 'performance',
        title: 'Slow Largest Contentful Paint',
        description: `LCP is ${vitals.lcp}ms, which is above the 2500ms threshold`,
        impact: 'high',
        recommendation: 'Optimize images, reduce server response time, eliminate render-blocking resources',
        affectedUrls: [url],
        savings: { ms: vitals.lcp - 2500 }
      });
    }

    // Mobile-friendliness
    const isMobileFriendly = await this.checkMobileFriendliness(url);
    if (!isMobileFriendly) {
      issues.push({
        type: 'error',
        category: 'seo',
        title: 'Mobile usability issues',
        description: 'Page has mobile usability issues',
        impact: 'high',
        recommendation: 'Fix mobile viewport configuration, tap targets, and readable font sizes',
        affectedUrls: [url]
      });
    }

    // Structured data validation
    const structuredDataValidation = await this.validateStructuredData(url);
    if (!structuredDataValidation.valid) {
      issues.push({
        type: 'warning',
        category: 'seo',
        title: 'Structured data errors',
        description: `Found ${structuredDataValidation.errors.length} structured data errors`,
        impact: 'medium',
        recommendation: 'Fix structured data syntax and required properties',
        affectedUrls: [url]
      });
    }

    // SEO basics
    const seoBasics = await this.checkSEOBasics(url);
    if (!seoBasics.hasTitle) {
      issues.push({
        type: 'error',
        category: 'seo',
        title: 'Missing title tag',
        description: 'Page is missing a title tag',
        impact: 'high',
        recommendation: 'Add a descriptive title tag (50-60 characters)',
        affectedUrls: [url]
      });
    }

    if (!seoBasics.hasMetaDescription) {
      issues.push({
        type: 'error',
        category: 'seo',
        title: 'Missing meta description',
        description: 'Page is missing a meta description',
        impact: 'medium',
        recommendation: 'Add a compelling meta description (150-160 characters)',
        affectedUrls: [url]
      });
    }

    this.dataCache.set('technical_issues', issues);
    this.generateTechnicalAlerts(issues);

    return issues;
  }

  /**
   * Generate comprehensive SEO report
   */
  async generateSEOReport(timeframe: '7d' | '30d' | '90d' = '30d'): Promise<{
    overview: {
      totalKeywords: number;
      avgPosition: number;
      totalTraffic: number;
      conversionRate: number;
      technicalIssues: number;
      backlinks: number;
    };
    keywordPerformance: KeywordData[];
    pagePerformance: PagePerformanceData[];
    technicalIssues: TechnicalSEOIssue[];
    competitorAnalysis: CompetitorData[];
    contentGaps: ContentGapData[];
    recommendations: string[];
    alerts: SEOAlert[];
  }> {
    const [keywords, pages, competitors, gaps, backlinks, issues] = await Promise.all([
      this.trackKeywordPerformance(['permanentny makijaż warszawa', 'stylizacja brwi', 'trening personalny']),
      Promise.all(['/', '/beauty', '/fitness'].map(url => this.trackPagePerformance(`https://mariia-hub.pl${url}`))),
      this.analyzeCompetitors(['competitor1.com', 'competitor2.com']),
      this.identifyContentGaps([], []),
      this.trackBacklinks(),
      this.performTechnicalAudit('https://mariia-hub.pl')
    ]);

    const overview = {
      totalKeywords: keywords.length,
      avgPosition: Math.round(keywords.reduce((acc, k) => acc + k.position, 0) / keywords.length),
      totalTraffic: pages.reduce((acc, p) => acc + p.sessions, 0),
      conversionRate: pages.reduce((acc, p) => acc + p.conversionRate, 0) / pages.length,
      technicalIssues: issues.length,
      backlinks: backlinks.length
    };

    const recommendations = this.generateRecommendations({
      keywords,
      pages,
      issues,
      competitors,
      gaps,
      backlinks
    });

    return {
      overview,
      keywordPerformance: keywords,
      pagePerformance: pages,
      technicalIssues: issues,
      competitorAnalysis: competitors,
      contentGaps: gaps,
      recommendations,
      alerts: this.alerts
    };
  }

  /**
   * Get cached data
   */
  getCachedData(key: string): any {
    return this.dataCache.get(key);
  }

  /**
   * Get current alerts
   */
  getAlerts(): SEOAlert[] {
    return this.alerts.filter(alert => !alert.acknowledged);
  }

  /**
   * Acknowledge alert
   */
  acknowledgeAlert(alertId: string): void {
    const alert = this.alerts.find(a => a.title === alertId);
    if (alert) {
      alert.acknowledged = true;
    }
  }

  // Private helper methods
  private setupSearchConsoleTracking() {
    // Implementation for Google Search Console integration
    console.log('Search Console tracking initialized');
  }

  private setupCustomEventTracking() {
    // Track SEO-specific events
    if (typeof window !== 'undefined') {
      window.addEventListener('beforeunload', () => {
        // Track page engagement time
        const engagementTime = performance.now();
        // Send to analytics
      });
    }
  }

  private setupCoreWebVitalsTracking() {
    // Track Core Web Vitals
    if (typeof window !== 'undefined') {
      // Web Vitals library integration
      console.log('Core Web Vitals tracking initialized');
    }
  }

  private setupRankingMonitor() {
    // Monitor ranking changes
    console.log('Ranking monitor initialized');
  }

  private async measureCoreWebVitals() {
    return {
      lcp: Math.random() * 3000,
      fid: Math.random() * 200,
      cls: Math.random() * 0.3
    };
  }

  private async checkMobileFriendliness(url: string): Promise<boolean> {
    return true; // Mock implementation
  }

  private async validateStructuredData(url: string) {
    return { valid: true, errors: [] }; // Mock implementation
  }

  private async checkSEOBasics(url: string) {
    return { hasTitle: true, hasMetaDescription: true }; // Mock implementation
  }

  private analyzeKeywordChanges(data: KeywordData[]) {
    // Analyze ranking changes and create alerts
    data.forEach(keyword => {
      if (keyword.position > 10) {
        this.createAlert('warning', 'ranking',
          `Keyword "${keyword.keyword}" dropped to position ${keyword.position}`,
          keyword.url
        );
      }
    });
  }

  private analyzePagePerformance(data: PagePerformanceData) {
    // Analyze performance and create alerts
    if (data.bounceRate > 0.7) {
      this.createAlert('warning', 'performance',
        `High bounce rate (${(data.bounceRate * 100).toFixed(1)}%) on ${data.url}`,
        data.url
      );
    }
  }

  private analyzeBacklinkProfile(data: BacklinkData[]) {
    // Analyze backlink profile
    const toxicLinks = data.filter(link => link.domainAuthority < 20 && !link.isFollow);
    if (toxicLinks.length > 0) {
      this.createAlert('info', 'technical',
        `Found ${toxicLinks.length} potentially toxic backlinks`
      );
    }
  }

  private identifyOpportunities(competitors: CompetitorData[]) {
    // Identify competitor weaknesses and opportunities
    competitors.forEach(competitor => {
      if (competitor.domainAuthority < 40) {
        this.createAlert('info', 'ranking',
          `Competitor ${competitor.domain} has low domain authority (${competitor.domainAuthority})`
        );
      }
    });
  }

  private generateTechnicalAlerts(issues: TechnicalSEOIssue[]) {
    issues.forEach(issue => {
      if (issue.impact === 'high') {
        this.createAlert('critical', 'technical', issue.title, issue.affectedUrls[0]);
      }
    });
  }

  private createAlert(type: SEOAlert['type'], category: SEOAlert['category'], message: string, url?: string) {
    this.alerts.push({
      type,
      title: message,
      message,
      url,
      timestamp: new Date().toISOString(),
      acknowledged: false,
      category
    });
  }

  private generateRecommendations(data: {
    keywords: KeywordData[];
    pages: PagePerformanceData[];
    issues: TechnicalSEOIssue[];
    competitors: CompetitorData[];
    gaps: ContentGapData[];
    backlinks: BacklinkData[];
  }): string[] {
    const recommendations: string[] = [];

    // Keyword recommendations
    const lowPerformingKeywords = data.keywords.filter(k => k.position > 10);
    if (lowPerformingKeywords.length > 0) {
      recommendations.push(`Optimize ${lowPerformingKeywords.length} keywords with positions > 10`);
    }

    // Performance recommendations
    const slowPages = data.pages.filter(p => p.avgPageLoadTime > 3000);
    if (slowPages.length > 0) {
      recommendations.push(`Improve page load speed for ${slowPages.length} pages`);
    }

    // Technical recommendations
    const highImpactIssues = data.issues.filter(i => i.impact === 'high');
    if (highImpactIssues.length > 0) {
      recommendations.push(`Fix ${highImpactIssues.length} high-impact technical issues`);
    }

    // Content recommendations
    if (data.gaps.length > 0) {
      recommendations.push(`Create content for ${data.gaps.length} identified content gaps`);
    }

    // Backlink recommendations
    if (data.backlinks.length < 20) {
      recommendations.push('Increase backlink acquisition efforts');
    }

    return recommendations;
  }
}

export default SEOAnalytics;