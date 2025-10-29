/**
 * Example usage of the comprehensive SEO system for Mariia Hub
 *
 * This file demonstrates how to use various SEO components
 * in different scenarios throughout the application.
 */

import { Service, Review } from '@/types/shared';

import { useHreflang, useStructuredData, useServiceStructuredData, useArticleStructuredData, useHomepageStructuredData , MetaOptimizer, HreflangGenerator, SitemapGenerator, SEOValidator, LocalSEOGenerator } from './index';
import { getEnvVar } from '@/lib/runtime-env';

// ============================================================================
// 1. Hreflang Implementation Examples
// ============================================================================

/**
 * Example: Setting up hreflang for a service page
 */
export const setupHreflangForServicePage = () => {
  const { hreflangUrls, canonicalUrl, validation } = useHreflang(
    {
      en: '/beauty/services/lip-blushing',
      pl: '/pl/beauty/services/bladowanie-ust'
    },
    {
      baseUrl: 'https://mariia-hub.pl',
      supportedLanguages: ['en', 'pl'],
      defaultLanguage: 'pl'
    }
  );

  return {
    hreflangUrls,
    canonicalUrl,
    isValid: validation.valid,
    errors: validation.errors
  };
};

/**
 * Example: Creating localized page configurations
 */
export const createLocalizedServicePages = () => {
  const servicePages = [
    {
      path: '/beauty/services/lip-blushing',
      translations: {
        en: '/beauty/services/lip-blushing',
        pl: '/pl/beauty/services/bladowanie-ust'
      },
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.9
    }
  ];

  return servicePages;
};

// ============================================================================
// 2. Structured Data Implementation Examples
// ============================================================================

/**
 * Example: Service page structured data
 */
export const generateServiceStructuredData = (service: Service, reviews?: Review[]) => {
  return useServiceStructuredData(service, reviews);
};

/**
 * Example: Blog post structured data
 */
export const generateBlogStructuredData = (article: {
  title: string;
  description: string;
  content: string;
  author: string;
  publishDate: string;
  image?: string[];
}) => {
  return useArticleStructuredData(article);
};

/**
 * Example: Homepage structured data with local business schema
 */
export const generateHomepageStructuredData = (reviews?: Review[]) => {
  return useHomepageStructuredData(reviews);
};

// ============================================================================
// 3. Meta Tag Optimization Examples
// ============================================================================

/**
 * Example: Optimized meta tags for a service page
 */
export const generateServiceMetaTags = (service: Service, language: string = 'pl') => {
  const optimizer = MetaOptimizer.getInstance();

  return optimizer.generateMetaTags(
    `/beauty/services/${service.slug}`,
    {
      title: `${service.name} | Mariia Hub`,
      description: service.description,
      keywords: service.tags || [],
      ogImage: service.images?.[0]?.url,
      priceAmount: service.price,
      priceCurrency: 'PLN',
      availability: 'https://schema.org/InStock'
    },
    language
  );
};

/**
 * Example: Testing and optimizing meta tags
 */
export const testAndOptimizeMetaTags = (metaTags: any) => {
  const optimizer = MetaOptimizer.getInstance();
  const testResult = optimizer.testMetaTags(metaTags);

  if (testResult.score < 80) {
    console.log('Meta tags need optimization:', testResult.issues);
    return testResult.optimizedVersion;
  }

  return metaTags;
};

// ============================================================================
// 4. Local SEO Examples
// ============================================================================

/**
 * Example: Local SEO optimization for Warsaw
 */
export const setupLocalSEOWarsaw = () => {
  const localSEO = LocalSEOGenerator.getInstance('srodmiescie');

  // Generate Warsaw-specific keywords
  const localKeywords = localSEO.generateLocalKeywords(
    ['permanentny makijaż', 'stylizacja brwi', 'trening personalny'],
    'beauty'
  );

  // Generate Google Business Profile data
  const gbpData = localSEO.generateGoogleBusinessProfile([], []);

  // Generate local citations
  const citations = localSEO.generateLocalCitations();

  // Generate location-specific content
  const landingContent = localSEO.generateLocationLandingContent('srodmiescie');

  return {
    localKeywords,
    gbpData,
    citations,
    landingContent
  };
};

/**
 * Example: District-specific landing page content
 */
export const generateDistrictLandingPage = (district: keyof typeof import('./localSEO').WARSAW_DISTRICTS) => {
  const localSEO = LocalSEOGenerator.getInstance(district);
  const content = localSEO.generateLocationLandingContent();
  const metaTags = localSEO.generateLocalMetaTags(
    `Salon Urody ${content.headings[0].replace(' - ', '')}`,
    content.content[0],
    district
  );

  return { content, metaTags };
};

// ============================================================================
// 5. Sitemap Generation Examples
// ============================================================================

/**
 * Example: Generate comprehensive sitemap
 */
export const generateCompleteSitemap = async (services: Service[]) => {
  const sitemapGenerator = SitemapGenerator.getInstance({
    baseUrl: 'https://mariia-hub.pl',
    supportedLanguages: ['pl', 'en'],
    defaultLanguage: 'pl',
    includeImages: true,
    includeNews: true,
    includeVideos: true
  });

  // Define all pages
  const pages = [
    {
      path: '/',
      translations: { en: '/', pl: '/pl' },
      lastModified: new Date(),
      priority: 1.0,
      changeFrequency: 'weekly'
    },
    {
      path: '/beauty',
      translations: { en: '/beauty', pl: '/pl/beauty' },
      lastModified: new Date(),
      priority: 0.9,
      changeFrequency: 'monthly'
    },
    {
      path: '/contact',
      translations: { en: '/contact', pl: '/pl/kontakt' },
      lastModified: new Date(),
      priority: 0.7,
      changeFrequency: 'monthly'
    }
  ];

  // Generate main sitemap
  const mainSitemap = await sitemapGenerator.generateMainSitemap(pages, services);

  // Generate language-specific sitemaps
  const languageSitemaps = await sitemapGenerator.generateLanguageSitemaps(pages, services);

  // Generate sitemap index
  const sitemapIndex = await sitemapGenerator.generateSitemapIndex([
    { path: 'sitemap.xml' },
    { path: 'sitemap-pl.xml' },
    { path: 'sitemap-en.xml' },
    { path: 'sitemap-images.xml' }
  ]);

  // Generate robots.txt
  const robotsTxt = sitemapGenerator.generateRobotsTxt([
    'https://mariia-hub.pl/sitemap.xml'
  ]);

  return {
    mainSitemap,
    languageSitemaps,
    sitemapIndex,
    robotsTxt
  };
};

// ============================================================================
// 6. SEO Testing and Validation Examples
// ============================================================================

/**
 * Example: Comprehensive SEO testing
 */
export const runComprehensiveSEOTest = async (metaTags: any, structuredData: any) => {
  const validator = SEOValidator.getInstance();

  // Mock performance data (would get from actual measurements)
  const performanceData = {
    lcp: 2100,
    fid: 85,
    cls: 0.08,
    ttfb: 450
  };

  // Mock accessibility data (would get from axe or similar)
  const accessibilityData = {
    score: 92,
    hasAltTexts: true,
    issues: []
  };

  const testResult = await validator.runComprehensiveTest(
    metaTags,
    structuredData,
    performanceData,
    accessibilityData
  );

  return testResult;
};

/**
 * Example: Batch SEO testing for multiple pages
 */
export const runBatchSEOTests = async () => {
  const validator = SEOValidator.getInstance();

  const config = {
    urls: [
      'https://mariia-hub.pl/',
      'https://mariia-hub.pl/beauty',
      'https://mariia-hub.pl/contact'
    ],
    includePerformanceTests: true,
    includeAccessibilityTests: true,
    includeStructuredDataTests: true,
    includeLocalSEOTests: true,
    device: 'mobile' as const,
    locale: 'pl'
  };

  const results = await validator.runBatchTests(config);

  // Generate reports
  const testResults = await Promise.all(
    results.map(async (result) => {
      return await validator.runComprehensiveTest(
        result.metaTags,
        result.structuredData,
        result.performance,
        result.accessibility
      );
    })
  );

  return {
    results,
    report: validator.generateTestReport(testResults),
    jsonExport: validator.exportToJSON(testResults),
    csvExport: validator.exportToCSV(testResults)
  };
};

// ============================================================================
// 7. Integration Examples for React Components
// ============================================================================

/**
 * Example: Custom hook for comprehensive page SEO
 */
export const usePageSEO = (
  pageType: 'homepage' | 'service' | 'blog' | 'landing',
  data?: {
    service?: Service;
    article?: any;
    reviews?: Review[];
    location?: string;
  }
) => {
  const { hreflangUrls, canonicalUrl } = useHreflang();

  let structuredDataResult;
  let metaTags;

  switch (pageType) {
    case 'homepage':
      structuredDataResult = useHomepageStructuredData(data?.reviews);
      break;
    case 'service':
      if (data?.service) {
        structuredDataResult = useServiceStructuredData(data.service, data?.reviews);
        metaTags = generateServiceMetaTags(data.service);
      }
      break;
    case 'blog':
      if (data?.article) {
        structuredDataResult = useArticleStructuredData(data.article);
      }
      break;
    case 'landing':
      if (data?.location) {
        const localSEO = LocalSEOGenerator.getInstance('srodmiescie');
        metaTags = localSEO.generateLocalMetaTags(
          `Salon Urody ${data.location}`,
          `Profesjonalne usługi kosmetyczne w ${data.location}`
        );
      }
      break;
  }

  return {
    hreflangUrls,
    canonicalUrl,
    structuredData: structuredDataResult?.schemas || [],
    jsonLd: structuredDataResult?.jsonLd || '',
    metaTags,
    validation: structuredDataResult?.validation
  };
};

/**
 * Example: SEO monitoring and alerting
 */
export const setupSEOMonitoring = () => {
  const analytics = SEOAnalytics.getInstance({
    googleSearchConsole: {
      apiKey: getEnvVar('GSC_API_KEY', ['VITE_GSC_API_KEY']) || '',
      siteUrl: 'https://mariia-hub.pl'
    },
    googleAnalytics: {
      trackingId: 'GA-XXXXXXXX',
      apiKey: getEnvVar('GA_API_KEY', ['VITE_GA_API_KEY']) || ''
    }
  });

  // Set up monitoring interval (would run in background)
  const monitorSEO = async () => {
    const report = await analytics.generateSEOReport('30d');

    // Check for critical issues
    const criticalAlerts = report.alerts.filter(alert => alert.type === 'critical');

    if (criticalAlerts.length > 0) {
      console.warn('Critical SEO alerts:', criticalAlerts);
      // Would send email/notification here
    }

    // Check for ranking drops
    const lowPerformingKeywords = report.keywordPerformance.filter(
      k => k.position > 10 && k.searchVolume > 100
    );

    if (lowPerformingKeywords.length > 3) {
      console.warn('Multiple keywords with low rankings:', lowPerformingKeywords);
    }

    return report;
  };

  return { monitorSEO, analytics };
};

// ============================================================================
// 8. Complete Integration Example
// ============================================================================

/**
 * Example: Complete SEO setup for a new service page
 */
export const setupCompleteSEOForService = async (
  service: Service,
  reviews: Review[]
) => {
  // 1. Generate meta tags
  const metaTags = generateServiceMetaTags(service);

  // 2. Test and optimize meta tags
  const optimizedMetaTags = testAndOptimizeMetaTags(metaTags);

  // 3. Generate structured data
  const { schemas, jsonLd, validation } = generateServiceStructuredData(service, reviews);

  // 4. Generate hreflang tags
  const { hreflangUrls, canonicalUrl } = setupHreflangForServicePage();

  // 5. Run SEO tests
  const testResult = await runComprehensiveSEOTest(optimizedMetaTags, schemas[0]);

  // 6. Generate local SEO content if applicable
  const localSEO = setupLocalSEOWarsaw();
  const localKeywords = localSEO.generateLocalKeywords([service.name], service.category);

  // 7. Set up monitoring
  const { analytics } = setupSEOMonitoring();

  return {
    metaTags: optimizedMetaTags,
    structuredData: { schemas, jsonLd, validation },
    hreflang: { hreflangUrls, canonicalUrl },
    testResult,
    localSEO: { keywords: localKeywords, data: localSEO },
    analytics
  };
};

export default {
  setupHreflangForServicePage,
  createLocalizedServicePages,
  generateServiceStructuredData,
  generateBlogStructuredData,
  generateHomepageStructuredData,
  generateServiceMetaTags,
  testAndOptimizeMetaTags,
  setupLocalSEOWarsaw,
  generateDistrictLandingPage,
  generateCompleteSitemap,
  runComprehensiveSEOTest,
  runBatchSEOTests,
  usePageSEO,
  setupSEOMonitoring,
  setupCompleteSEOForService
};
