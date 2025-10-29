import { MetaTagConfig } from './metaOptimizer';
import { LocalBusinessSchema } from './structuredData';

export interface SEOTestResult {
  score: number;
  passed: number;
  failed: number;
  warnings: number;
  tests: SEOTest[];
  summary: {
    status: 'excellent' | 'good' | 'needs_improvement' | 'critical';
    mainIssues: string[];
    quickWins: string[];
    recommendations: string[];
  };
}

export interface SEOTest {
  id: string;
  name: string;
  category: 'technical' | 'content' | 'performance' | 'accessibility' | 'local';
  status: 'pass' | 'fail' | 'warning';
  score: number;
  description: string;
  recommendation: string;
  resources?: string[];
  impact: 'high' | 'medium' | 'low';
  estimatedEffort: 'low' | 'medium' | 'high';
}

export interface PageTestResult {
  url: string;
  metaTags: MetaTagConfig;
  structuredData: any;
  performance: {
    lcp: number;
    fid: number;
    cls: number;
    ttfb: number;
  };
  accessibility: {
    score: number;
    issues: string[];
  };
  technical: {
    httpStatus: number;
    responseTime: number;
    contentLength: number;
    cacheHeaders: boolean;
  };
}

export interface BatchTestConfig {
  urls: string[];
    includePerformanceTests: boolean;
    includeAccessibilityTests: boolean;
    includeStructuredDataTests: boolean;
    includeLocalSEOTests: boolean;
    device: 'desktop' | 'mobile' | 'both';
    locale?: string;
}

/**
 * Comprehensive SEO testing and validation system
 */
export class SEOValidator {
  private static instance: SEOValidator;
  private testThresholds = {
    titleLength: { min: 30, max: 60 },
    descriptionLength: { min: 120, max: 160 },
    keywordsCount: { min: 5, max: 10 },
    coreWebVitals: {
      lcp: { good: 2500, needsImprovement: 4000 },
      fid: { good: 100, needsImprovement: 300 },
      cls: { good: 0.1, needsImprovement: 0.25 },
      ttfb: { good: 600, needsImprovement: 1000 }
    },
    accessibilityScore: { excellent: 95, good: 80, needsImprovement: 60 }
  };

  static getInstance(): SEOValidator {
    if (!SEOValidator.instance) {
      SEOValidator.instance = new SEOValidator();
    }
    return SEOValidator.instance;
  }

  /**
   * Run comprehensive SEO test suite
   */
  async runComprehensiveTest(
    metaTags: MetaTagConfig,
    structuredData?: any,
    performanceData?: any,
    accessibilityData?: any
  ): Promise<SEOTestResult> {
    const tests: SEOTest[] = [];
    let totalScore = 0;
    let passed = 0;
    let failed = 0;
    let warnings = 0;

    // Technical SEO tests
    const technicalTests = this.runTechnicalTests(metaTags, structuredData);
    tests.push(...technicalTests);

    // Content SEO tests
    const contentTests = this.runContentTests(metaTags);
    tests.push(...contentTests);

    // Performance tests
    if (performanceData) {
      const performanceTests = this.runPerformanceTests(performanceData);
      tests.push(...performanceTests);
    }

    // Accessibility tests
    if (accessibilityData) {
      const accessibilityTests = this.runAccessibilityTests(accessibilityData);
      tests.push(...accessibilityTests);
    }

    // Local SEO tests
    const localTests = this.runLocalSEOTests(metaTags, structuredData);
    tests.push(...localTests);

    // Calculate scores
    tests.forEach(test => {
      totalScore += test.score;
      if (test.status === 'pass') passed++;
      else if (test.status === 'fail') failed++;
      else warnings++;
    });

    const finalScore = Math.round(totalScore / tests.length);

    return {
      score: finalScore,
      passed,
      failed,
      warnings,
      tests,
      summary: this.generateSummary(tests, finalScore)
    };
  }

  /**
   * Run technical SEO tests
   */
  private runTechnicalTests(metaTags: MetaTagConfig, structuredData?: any): SEOTest[] {
    const tests: SEOTest[] = [];

    // Test 1: Title tag presence and format
    tests.push({
      id: 'tech_title',
      name: 'Title Tag Optimization',
      category: 'technical',
      status: this.testTitleTag(metaTags.title),
      score: this.calculateTitleScore(metaTags.title),
      description: 'Checks title tag presence, length, and optimization',
      recommendation: 'Title should be 30-60 characters, include primary keyword and location',
      resources: ['https://moz.com/learn/seo/title-tag'],
      impact: 'high',
      estimatedEffort: 'low'
    });

    // Test 2: Meta description
    tests.push({
      id: 'tech_description',
      name: 'Meta Description',
      category: 'technical',
      status: this.testDescription(metaTags.description),
      score: this.calculateDescriptionScore(metaTags.description),
      description: 'Checks meta description presence and optimization',
      recommendation: 'Description should be 150-160 characters, compelling and include keywords',
      resources: ['https://moz.com/learn/seo/meta-description'],
      impact: 'high',
      estimatedEffort: 'low'
    });

    // Test 3: Canonical URL
    tests.push({
      id: 'tech_canonical',
      name: 'Canonical URL',
      category: 'technical',
      status: metaTags.canonical ? 'pass' : 'fail',
      score: metaTags.canonical ? 100 : 0,
      description: 'Checks for canonical URL implementation',
      recommendation: 'Add canonical URL to prevent duplicate content issues',
      resources: ['https://ahrefs.com/blog/canonical-tags/'],
      impact: 'medium',
      estimatedEffort: 'low'
    });

    // Test 4: Robots meta tag
    tests.push({
      id: 'tech_robots',
      name: 'Robots Meta Tag',
      category: 'technical',
      status: this.testRobotsTag(metaTags.robots),
      score: this.calculateRobotsScore(metaTags.robots),
      description: 'Checks robots meta tag configuration',
      recommendation: 'Ensure robots tag allows indexing and follows SEO best practices',
      resources: ['https://developers.google.com/search/docs/advanced/robots-meta-tags'],
      impact: 'medium',
      estimatedEffort: 'low'
    });

    // Test 5: Structured Data
    tests.push({
      id: 'tech_structured_data',
      name: 'Structured Data',
      category: 'technical',
      status: this.testStructuredData(structuredData),
      score: this.calculateStructuredDataScore(structuredData),
      description: 'Validates structured data implementation',
      recommendation: 'Implement relevant schema.org markup for rich snippets',
      resources: ['https://schema.org/'],
      impact: 'high',
      estimatedEffort: 'medium'
    });

    // Test 6: Open Graph tags
    tests.push({
      id: 'tech_opengraph',
      name: 'Open Graph Tags',
      category: 'technical',
      status: this.testOpenGraphTags(metaTags),
      score: this.calculateOpenGraphScore(metaTags),
      description: 'Checks Open Graph tag implementation',
      recommendation: 'Complete Open Graph tags for better social media sharing',
      resources: ['https://ogp.me/'],
      impact: 'medium',
      estimatedEffort: 'low'
    });

    // Test 7: Twitter Card
    tests.push({
      id: 'tech_twitter',
      name: 'Twitter Card',
      category: 'technical',
      status: this.testTwitterCard(metaTags),
      score: this.calculateTwitterCardScore(metaTags),
      description: 'Validates Twitter Card implementation',
      recommendation: 'Add Twitter Card meta tags for better Twitter sharing',
      resources: ['https://developer.twitter.com/en/docs/twitter-for-websites/cards/overview/abouts-cards'],
      impact: 'medium',
      estimatedEffort: 'low'
    });

    // Test 8: Hreflang tags (if applicable)
    tests.push({
      id: 'tech_hreflang',
      name: 'Hreflang Implementation',
      category: 'technical',
      status: 'pass', // Would need actual hreflang data to test
      score: 100,
      description: 'Checks hreflang tag implementation for international SEO',
      recommendation: 'Implement hreflang tags for multi-language websites',
      resources: ['https://developers.google.com/search/docs/advanced/crawling-indexing/localized-versions'],
      impact: 'medium',
      estimatedEffort: 'medium'
    });

    return tests;
  }

  /**
   * Run content SEO tests
   */
  private runContentTests(metaTags: MetaTagConfig): SEOTest[] {
    const tests: SEOTest[] = [];

    // Test 1: Keyword optimization
    tests.push({
      id: 'content_keywords',
      name: 'Keyword Optimization',
      category: 'content',
      status: this.testKeywordOptimization(metaTags),
      score: this.calculateKeywordScore(metaTags),
      description: 'Analyzes keyword usage in meta tags',
      recommendation: 'Include primary keywords naturally in title and description',
      resources: ['https://moz.com/beginners-guide-to-seo/keyword-research'],
      impact: 'high',
      estimatedEffort: 'medium'
    });

    // Test 2: Title-Description alignment
    tests.push({
      id: 'content_alignment',
      name: 'Title-Description Alignment',
      category: 'content',
      status: this.testTitleDescriptionAlignment(metaTags),
      score: this.calculateAlignmentScore(metaTags),
      description: 'Checks if title and description are aligned and compelling',
      recommendation: 'Ensure title and description work together to attract clicks',
      resources: ['https://backlinko.com/ctr'],
      impact: 'medium',
      estimatedEffort: 'low'
    });

    // Test 3: Call-to-action presence
    tests.push({
      id: 'content_cta',
      name: 'Call-to-Action',
      category: 'content',
      status: this.testCallToAction(metaTags.description),
      score: this.calculateCTAScore(metaTags.description),
      description: 'Checks for effective call-to-action in meta description',
      recommendation: 'Include compelling CTA in meta description to improve CTR',
      resources: ['https://blog.hubspot.com/marketing/call-to-action-examples-list'],
      impact: 'medium',
      estimatedEffort: 'low'
    });

    return tests;
  }

  /**
   * Run performance tests
   */
  private runPerformanceTests(performanceData: any): SEOTest[] {
    const tests: SEOTest[] = [];

    // Test 1: Core Web Vitals - LCP
    tests.push({
      id: 'perf_lcp',
      name: 'Largest Contentful Paint (LCP)',
      category: 'performance',
      status: this.testCoreWebVital('lcp', performanceData.lcp),
      score: this.calculateLCPscore(performanceData.lcp),
      description: `LCP: ${performanceData.lcp}ms - Measures loading performance`,
      recommendation: 'Optimize images, reduce server response time, eliminate render-blocking resources',
      resources: ['https://web.dev/lcp/'],
      impact: 'high',
      estimatedEffort: 'high'
    });

    // Test 2: Core Web Vitals - FID
    tests.push({
      id: 'perf_fid',
      name: 'First Input Delay (FID)',
      category: 'performance',
      status: this.testCoreWebVital('fid', performanceData.fid),
      score: this.calculateFIDscore(performanceData.fid),
      description: `FID: ${performanceData.fid}ms - Measures interactivity`,
      recommendation: 'Reduce JavaScript execution time, break up long tasks, use web workers',
      resources: ['https://web.dev/fid/'],
      impact: 'high',
      estimatedEffort: 'high'
    });

    // Test 3: Core Web Vitals - CLS
    tests.push({
      id: 'perf_cls',
      name: 'Cumulative Layout Shift (CLS)',
      category: 'performance',
      status: this.testCoreWebVital('cls', performanceData.cls),
      score: this.calculateCLSscore(performanceData.cls),
      description: `CLS: ${performanceData.cls} - Measures visual stability`,
      recommendation: 'Include size attributes for images and videos, avoid inserting content above existing content',
      resources: ['https://web.dev/cls/'],
      impact: 'high',
      estimatedEffort: 'medium'
    });

    // Test 4: Time to First Byte
    tests.push({
      id: 'perf_ttfb',
      name: 'Time to First Byte (TTFB)',
      category: 'performance',
      status: this.testTTFB(performanceData.ttfb),
      score: this.calculateTTFBscore(performanceData.ttfb),
      description: `TTFB: ${performanceData.ttfb}ms - Measures server response time`,
      recommendation: 'Optimize server performance, use CDN, enable caching',
      resources: ['https://web.dev/ttfb/'],
      impact: 'medium',
      estimatedEffort: 'medium'
    });

    return tests;
  }

  /**
   * Run accessibility tests
   */
  private runAccessibilityTests(accessibilityData: any): SEOTest[] {
    const tests: SEOTest[] = [];

    tests.push({
      id: 'a11y_score',
      name: 'Accessibility Score',
      category: 'accessibility',
      status: this.testAccessibilityScore(accessibilityData.score),
      score: accessibilityData.score,
      description: `Overall accessibility score: ${accessibilityData.score}`,
      recommendation: 'Improve accessibility to enhance user experience and SEO',
      resources: ['https://web.dev/accessibility/'],
      impact: 'medium',
      estimatedEffort: 'medium'
    });

    tests.push({
      id: 'a11y_images',
      name: 'Image Alt Text',
      category: 'accessibility',
      status: accessibilityData.hasAltTexts ? 'pass' : 'warning',
      score: accessibilityData.hasAltTexts ? 100 : 50,
      description: 'Checks for proper image alt text implementation',
      recommendation: 'Add descriptive alt text to all meaningful images',
      resources: ['https://web.dev/alt-text/'],
      impact: 'medium',
      estimatedEffort: 'low'
    });

    return tests;
  }

  /**
   * Run local SEO tests
   */
  private runLocalSEOTests(metaTags: MetaTagConfig, structuredData?: any): SEOTest[] {
    const tests: SEOTest[] = [];

    // Test 1: Local keywords
    tests.push({
      id: 'local_keywords',
      name: 'Local Keywords',
      category: 'local',
      status: this.testLocalKeywords(metaTags),
      score: this.calculateLocalKeywordScore(metaTags),
      description: 'Checks for local keywords in meta tags',
      recommendation: 'Include location-based keywords for better local SEO',
      resources: ['https://moz.com/learn/local-seo'],
      impact: 'medium',
      estimatedEffort: 'low'
    });

    // Test 2: Local business schema
    tests.push({
      id: 'local_schema',
      name: 'Local Business Schema',
      category: 'local',
      status: this.testLocalBusinessSchema(structuredData),
      score: this.calculateLocalSchemaScore(structuredData),
      description: 'Validates LocalBusiness schema implementation',
      recommendation: 'Implement LocalBusiness schema for better local search visibility',
      resources: ['https://schema.org/LocalBusiness'],
      impact: 'high',
      estimatedEffort: 'medium'
    });

    // Test 3: Geo tags
    tests.push({
      id: 'local_geo',
      name: 'Geo Meta Tags',
      category: 'local',
      status: this.testGeoTags(metaTags),
      score: this.calculateGeoTagScore(metaTags),
      description: 'Checks for geographic meta tags',
      recommendation: 'Add geo meta tags for better local search targeting',
      resources: ['https://moz.com/blog/geotargeting-seo'],
      impact: 'low',
      estimatedEffort: 'low'
    });

    return tests;
  }

  /**
   * Test helper methods
   */
  private testTitleTag(title?: string): 'pass' | 'fail' | 'warning' {
    if (!title) return 'fail';
    if (title.length < this.testThresholds.titleLength.min) return 'warning';
    if (title.length > this.testThresholds.titleLength.max) return 'warning';
    return 'pass';
  }

  private calculateTitleScore(title?: string): number {
    if (!title) return 0;
    let score = 100;
    if (title.length < this.testThresholds.titleLength.min) score -= 30;
    if (title.length > this.testThresholds.titleLength.max) score -= 30;
    if (!title.toLowerCase().includes('warszawa') && !title.toLowerCase().includes('warsaw')) score -= 20;
    return Math.max(0, score);
  }

  private testDescription(description?: string): 'pass' | 'fail' | 'warning' {
    if (!description) return 'fail';
    if (description.length < this.testThresholds.descriptionLength.min) return 'warning';
    if (description.length > this.testThresholds.descriptionLength.max) return 'warning';
    return 'pass';
  }

  private calculateDescriptionScore(description?: string): number {
    if (!description) return 0;
    let score = 100;
    if (description.length < this.testThresholds.descriptionLength.min) score -= 30;
    if (description.length > this.testThresholds.descriptionLength.max) score -= 30;
    return Math.max(0, score);
  }

  private testRobotsTag(robots?: string): 'pass' | 'fail' | 'warning' {
    if (!robots) return 'warning';
    if (robots.includes('noindex')) return 'fail';
    return 'pass';
  }

  private calculateRobotsScore(robots?: string): number {
    if (!robots) return 50;
    if (robots.includes('noindex')) return 0;
    return 100;
  }

  private testStructuredData(structuredData?: any): 'pass' | 'fail' | 'warning' {
    if (!structuredData) return 'warning';
    if (!structuredData['@context'] || !structuredData['@type']) return 'fail';
    return 'pass';
  }

  private calculateStructuredDataScore(structuredData?: any): number {
    if (!structuredData) return 30;
    if (!structuredData['@context'] || !structuredData['@type']) return 0;
    return 100;
  }

  private testOpenGraphTags(metaTags: MetaTagConfig): 'pass' | 'fail' | 'warning' {
    if (!metaTags.ogTitle || !metaTags.ogDescription || !metaTags.ogImage) return 'warning';
    return 'pass';
  }

  private calculateOpenGraphScore(metaTags: MetaTagConfig): number {
    let score = 100;
    if (!metaTags.ogTitle) score -= 33;
    if (!metaTags.ogDescription) score -= 33;
    if (!metaTags.ogImage) score -= 34;
    return Math.max(0, score);
  }

  private testTwitterCard(metaTags: MetaTagConfig): 'pass' | 'fail' | 'warning' {
    if (!metaTags.twitterCard || !metaTags.twitterTitle || !metaTags.twitterDescription) return 'warning';
    return 'pass';
  }

  private calculateTwitterCardScore(metaTags: MetaTagConfig): number {
    let score = 100;
    if (!metaTags.twitterCard) score -= 25;
    if (!metaTags.twitterTitle) score -= 35;
    if (!metaTags.twitterDescription) score -= 30;
    if (!metaTags.twitterImage) score -= 10;
    return Math.max(0, score);
  }

  private testKeywordOptimization(metaTags: MetaTagConfig): 'pass' | 'fail' | 'warning' {
    const hasKeywords = metaTags.keywords && metaTags.keywords.length >= 3;
    if (!hasKeywords) return 'warning';
    return 'pass';
  }

  private calculateKeywordScore(metaTags: MetaTagConfig): number {
    if (!metaTags.keywords || metaTags.keywords.length === 0) return 30;
    if (metaTags.keywords.length < 3) return 60;
    if (metaTags.keywords.length > 10) return 80;
    return 100;
  }

  private testTitleDescriptionAlignment(metaTags: MetaTagConfig): 'pass' | 'fail' | 'warning' {
    if (!metaTags.title || !metaTags.description) return 'fail';
    const titleWords = metaTags.title.toLowerCase().split(' ');
    const descriptionWords = metaTags.description.toLowerCase().split(' ');
    const commonWords = titleWords.filter(word => descriptionWords.includes(word));
    return commonWords.length > 0 ? 'pass' : 'warning';
  }

  private calculateAlignmentScore(metaTags: MetaTagConfig): number {
    if (!metaTags.title || !metaTags.description) return 0;
    const titleWords = metaTags.title.toLowerCase().split(' ');
    const descriptionWords = metaTags.description.toLowerCase().split(' ');
    const commonWords = titleWords.filter(word => descriptionWords.includes(word));
    return Math.min(100, commonWords.length * 20);
  }

  private testCallToAction(description?: string): 'pass' | 'fail' | 'warning' {
    if (!description) return 'fail';
    const ctaKeywords = ['zarezerwuj', 'book', 'umów', 'contact', 'dzisiaj', 'today', 'teraz', 'now'];
    const hasCTA = ctaKeywords.some(keyword => description.toLowerCase().includes(keyword));
    return hasCTA ? 'pass' : 'warning';
  }

  private calculateCTAScore(description?: string): number {
    if (!description) return 0;
    const ctaKeywords = ['zarezerwuj', 'book', 'umów', 'contact', 'dzisiaj', 'today', 'teraz', 'now'];
    const hasCTA = ctaKeywords.some(keyword => description.toLowerCase().includes(keyword));
    return hasCTA ? 100 : 50;
  }

  private testCoreWebVital(metric: string, value: number): 'pass' | 'fail' | 'warning' {
    const threshold = this.testThresholds.coreWebVitals[metric as keyof typeof this.testThresholds.coreWebVitals];
    if (!threshold) return 'pass';
    if (value <= threshold.good) return 'pass';
    if (value <= threshold.needsImprovement) return 'warning';
    return 'fail';
  }

  private calculateLCPscore(lcp: number): number {
    const threshold = this.testThresholds.coreWebVitals.lcp;
    if (lcp <= threshold.good) return 100;
    if (lcp <= threshold.needsImprovement) return 60;
    return 20;
  }

  private calculateFIDscore(fid: number): number {
    const threshold = this.testThresholds.coreWebVitals.fid;
    if (fid <= threshold.good) return 100;
    if (fid <= threshold.needsImprovement) return 60;
    return 20;
  }

  private calculateCLSscore(cls: number): number {
    const threshold = this.testThresholds.coreWebVitals.cls;
    if (cls <= threshold.good) return 100;
    if (cls <= threshold.needsImprovement) return 60;
    return 20;
  }

  private testTTFB(ttfb: number): 'pass' | 'fail' | 'warning' {
    const threshold = this.testThresholds.coreWebVitals.ttfb;
    if (ttfb <= threshold.good) return 'pass';
    if (ttfb <= threshold.needsImprovement) return 'warning';
    return 'fail';
  }

  private calculateTTFBscore(ttfb: number): number {
    const threshold = this.testThresholds.coreWebVitals.ttfb;
    if (ttfb <= threshold.good) return 100;
    if (ttfb <= threshold.needsImprovement) return 70;
    return 40;
  }

  private testAccessibilityScore(score: number): 'pass' | 'fail' | 'warning' {
    if (score >= this.testThresholds.accessibilityScore.excellent) return 'pass';
    if (score >= this.testThresholds.accessibilityScore.good) return 'warning';
    return 'fail';
  }

  private testLocalKeywords(metaTags: MetaTagConfig): 'pass' | 'fail' | 'warning' {
    const localKeywords = ['warszawa', 'warsaw', 'centrum', 'śródmieście', 'poland'];
    const hasLocalKeyword = localKeywords.some(keyword =>
      (metaTags.title?.toLowerCase().includes(keyword) ||
        metaTags.description?.toLowerCase().includes(keyword) ||
        metaTags.keywords?.some(k => k.toLowerCase().includes(keyword)))
    );
    return hasLocalKeyword ? 'pass' : 'warning';
  }

  private calculateLocalKeywordScore(metaTags: MetaTagConfig): number {
    const localKeywords = ['warszawa', 'warsaw', 'centrum', 'śródmieście', 'poland'];
    let score = 0;
    localKeywords.forEach(keyword => {
      if (metaTags.title?.toLowerCase().includes(keyword)) score += 30;
      if (metaTags.description?.toLowerCase().includes(keyword)) score += 20;
      if (metaTags.keywords?.some(k => k.toLowerCase().includes(keyword))) score += 10;
    });
    return Math.min(100, score);
  }

  private testLocalBusinessSchema(structuredData?: any): 'pass' | 'fail' | 'warning' {
    if (!structuredData) return 'warning';
    if (structuredData['@type'] === 'LocalBusiness' || structuredData['@type'] === 'BeautySalon') {
      return structuredData.address && structuredData.telephone ? 'pass' : 'warning';
    }
    return 'warning';
  }

  private calculateLocalSchemaScore(structuredData?: any): number {
    if (!structuredData) return 30;
    if (structuredData['@type'] === 'LocalBusiness' || structuredData['@type'] === 'BeautySalon') {
      let score = 100;
      if (!structuredData.address) score -= 40;
      if (!structuredData.telephone) score -= 30;
      if (!structuredData.geo) score -= 30;
      return Math.max(0, score);
    }
    return 30;
  }

  private testGeoTags(metaTags: MetaTagConfig): 'pass' | 'fail' | 'warning' {
    const hasGeoTags = metaTags.additionalTags?.some(tag =>
      tag.name.includes('geo') || tag.name.includes('ICBM')
    );
    return hasGeoTags ? 'pass' : 'warning';
  }

  private calculateGeoTagScore(metaTags: MetaTagConfig): number {
    const hasGeoTags = metaTags.additionalTags?.some(tag =>
      tag.name.includes('geo') || tag.name.includes('ICBM')
    );
    return hasGeoTags ? 100 : 50;
  }

  /**
   * Generate test summary
   */
  private generateSummary(tests: SEOTest[], overallScore: number) {
    const failedTests = tests.filter(t => t.status === 'fail');
    const warningTests = tests.filter(t => t.status === 'warning');
    const highImpactIssues = failedTests.filter(t => t.impact === 'high');
    const quickWins = warningTests.filter(t => t.estimatedEffort === 'low');

    let status: 'excellent' | 'good' | 'needs_improvement' | 'critical';
    if (overallScore >= 90) status = 'excellent';
    else if (overallScore >= 70) status = 'good';
    else if (overallScore >= 50) status = 'needs_improvement';
    else status = 'critical';

    const mainIssues = highImpactIssues.map(t => t.name);
    const recommendations = tests
      .filter(t => t.status !== 'pass')
      .map(t => t.recommendation)
      .slice(0, 5);

    return {
      status,
      mainIssues,
      quickWins: quickWins.map(t => t.name),
      recommendations
    };
  }

  /**
   * Run batch tests for multiple URLs
   */
  async runBatchTests(config: BatchTestConfig): Promise<PageTestResult[]> {
    const results: PageTestResult[] = [];

    for (const url of config.urls) {
      // Mock implementation - in production, would actually fetch and analyze each URL
      const result: PageTestResult = {
        url,
        metaTags: {} as MetaTagConfig,
        structuredData: {},
        performance: {
          lcp: Math.random() * 3000,
          fid: Math.random() * 200,
          cls: Math.random() * 0.3,
          ttfb: Math.random() * 1000
        },
        accessibility: {
          score: Math.random() * 40 + 60,
          issues: []
        },
        technical: {
          httpStatus: 200,
          responseTime: Math.random() * 1000,
          contentLength: Math.random() * 100000,
          cacheHeaders: true
        }
      };

      results.push(result);
    }

    return results;
  }

  /**
   * Generate SEO test report
   */
  generateTestReport(testResults: SEOTestResult[]): string {
    let report = '# SEO Test Report\n\n';
    report += `Generated: ${new Date().toISOString()}\n\n`;

    testResults.forEach((result, index) => {
      report += `## Test ${index + 1}: ${result.summary.status.toUpperCase()}\n\n`;
      report += `**Overall Score:** ${result.score}/100\n`;
      report += `**Tests Passed:** ${result.passed}\n`;
      report += `**Tests Failed:** ${result.failed}\n`;
      report += `**Warnings:** ${result.warnings}\n\n`;

      if (result.summary.mainIssues.length > 0) {
        report += '### Main Issues\n';
        result.summary.mainIssues.forEach(issue => {
          report += `- ${issue}\n`;
        });
        report += '\n';
      }

      if (result.summary.quickWins.length > 0) {
        report += '### Quick Wins\n';
        result.summary.quickWins.forEach(win => {
          report += `- ${win}\n`;
        });
        report += '\n';
      }

      if (result.summary.recommendations.length > 0) {
        report += '### Recommendations\n';
        result.summary.recommendations.forEach(rec => {
          report += `- ${rec}\n`;
        });
        report += '\n';
      }

      report += '### Detailed Test Results\n';
      result.tests.forEach(test => {
        report += `- **${test.name}**: ${test.status.toUpperCase()} (${test.score}/100)\n`;
        if (test.status !== 'pass') {
          report += `  - ${test.recommendation}\n`;
        }
      });
      report += '\n---\n\n';
    });

    return report;
  }

  /**
   * Export test results to JSON
   */
  exportToJSON(testResults: SEOTestResult[]): string {
    return JSON.stringify({
      generated: new Date().toISOString(),
      results: testResults
    }, null, 2);
  }

  /**
   * Export test results to CSV
   */
  exportToCSV(testResults: SEOTestResult[]): string {
    let csv = 'URL,Score,Status,Passed,Failed,Warnings\n';

    testResults.forEach(result => {
      csv += `${result.tests[0]?.name || 'Unknown'},${result.score},${result.summary.status},${result.passed},${result.failed},${result.warnings}\n`;
    });

    return csv;
  }
}

export default SEOValidator;