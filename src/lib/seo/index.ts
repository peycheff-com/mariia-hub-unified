// Core SEO Classes
export { default as HreflangGenerator } from './hreflangGenerator';
export { useHreflang, createLocalizedPage, HreflangPresets } from './hreflangGenerator';
export type { HreflangUrl, HreflangConfig, LocalizedPage } from './hreflangGenerator';

export { default as StructuredDataGenerator } from './structuredData';
export { useStructuredData, useServiceStructuredData, useArticleStructuredData, useHomepageStructuredData, useLocalStructuredData } from './useStructuredData';
export type {
  LocalBusinessSchema,
  ServiceSchema,
  BreadcrumbSchema,
  FAQSchema,
  ReviewSchema,
  ArticleSchema,
  EventSchema,
  PersonSchema,
  OrganizationSchema,
  WebPageSchema,
  VideoObjectSchema,
  Address,
  GeoCoordinates,
  OpeningHours,
  ContactPoint,
  AggregateRating,
  Offer,
  ImageObject,
  UseStructuredDataOptions,
  StructuredDataResult
} from './structuredData';

export { default as LocalSEOGenerator } from './localSEO';
export { WARSAW_DISTRICTS } from './localSEO';
export type {
  WarsawLocation,
  LocalCitation,
  LocalKeyword,
  GoogleBusinessProfile,
  BacklinkData,
  TechnicalSEOIssue,
  SEOAlert
} from './localSEO';

export { default as SEOAnalytics } from './analytics';
export type {
  KeywordData,
  PagePerformanceData,
  CompetitorData,
  ContentGapData,
  BacklinkData as AnalyticsBacklinkData,
  TechnicalSEOIssue as AnalyticsTechnicalIssue,
  SEOAlert as AnalyticsAlert,
  SEOAnalyticsConfig
} from './analytics';

export { default as SitemapGenerator } from './sitemapGenerator';
export type {
  SitemapEntry,
  SitemapConfig,
  SitemapIndexEntry
} from './sitemapGenerator';

export { default as MetaOptimizer } from './metaOptimizer';
export type {
  MetaTagConfig,
  PageMetaConfig,
  AITestResult
} from './metaOptimizer';

export { default as SEOValidator } from './testing';
export type {
  SEOTestResult,
  SEOTest,
  PageTestResult,
  BatchTestConfig
} from './testing';

// Legacy exports (for backwards compatibility)
export { generateSlug, generateLocalizedSlugs, createUniqueSlug, validateSlug } from './slugGenerator';
export type { SlugOptions } from './slugGenerator';

/**
 * Comprehensive SEO toolkit for mariiaborysevych
 *
 * This module provides advanced SEO features including:
 * - Hreflang generation for multi-language SEO
 * - Structured data implementation
 * - Local SEO optimization for Warsaw market
 * - SEO analytics and tracking
 * - Dynamic sitemap generation
 * - Meta tag optimization
 * - SEO testing and validation
 *
 * Usage examples:
 *
 * ```typescript
 * import { useHreflang, useStructuredData, MetaOptimizer } from '@/lib/seo';
 *
 * // Hook for hreflang generation
 * const { hreflangUrls, canonicalUrl } = useHreflang();
 *
 * // Hook for structured data
 * const { schemas, jsonLd } = useStructuredData({
 *   businessType: 'BeautySalon',
 *   service: beautyService
 * });
 *
 * // Meta tag optimization
 * const optimizer = MetaOptimizer.getInstance();
 * const metaTags = optimizer.generateMetaTags('/beauty/services/lips', {
 *   title: 'Permanent Lip Makeup',
 *   description: 'Professional permanent lip makeup in Warsaw'
 * });
 * ```
 */

// Re-export commonly used hooks for convenience
export { useHreflang as default } from './hreflangGenerator';