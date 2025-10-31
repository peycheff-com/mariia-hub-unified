import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation } from 'react-router-dom';

import { Service, Review } from '@/types/shared';

import StructuredDataGenerator, {
  LocalBusinessSchema,
  ServiceSchema,
  BreadcrumbSchema,
  FAQSchema,
  ReviewSchema
} from './structuredData';
import { useHreflang } from './hreflangGenerator';

export interface UseStructuredDataOptions {
  service?: Service;
  reviews?: Review[];
  faqs?: Array<{ question: string; answer: string }>;
  breadcrumbs?: Array<{ name: string; url: string }>;
  businessType?: 'LocalBusiness' | 'BeautySalon' | 'HealthAndBeautyBusiness';
  articleInfo?: {
    title: string;
    description: string;
    content?: string;
    author: string;
    publishDate: string;
    image?: string[];
    keywords?: string[];
    category?: string;
  };
  pageInfo?: {
    name: string;
    description: string;
    url: string;
    primaryImage?: string;
    relatedLinks?: string[];
  };
  eventInfo?: {
    name: string;
    description: string;
    startDate: string;
    endDate?: string;
    price?: number;
    image?: string[];
    url?: string;
  };
  personInfo?: {
    name: string;
    jobTitle?: string;
    description?: string;
    image?: string[];
    expertise?: string[];
  };
}

export interface StructuredDataResult {
  schemas: Record<string, any>[];
  jsonLd: string;
  generator: StructuredDataGenerator;
  validation: {
    valid: boolean;
    errors: string[];
    warnings: string[];
  };
}

/**
 * React hook for generating structured data
 * Provides comprehensive schema.org markup for SEO
 */
export const useStructuredData = (options: UseStructuredDataOptions = {}): StructuredDataResult => {
  const { t, i18n } = useTranslation();
  const location = useLocation();
  const { hreflangUrls } = useHreflang();

  const generator = useMemo(() => {
    const businessInfo = {
      name: 'mariiaborysevych',
      description: t('seo.businessDescription', 'Premium beauty and fitness services in Warsaw, Poland'),
      url: window.location.origin,
      address: {
        '@type': 'PostalAddress' as const,
        streetAddress: 'ul. Smolna 8',
        addressLocality: 'Warsaw',
        addressRegion: 'Mazowieckie',
        postalCode: '00-001',
        addressCountry: 'PL'
      },
      sameAs: [
        'https://instagram.com/mariia.hub',
        'https://facebook.com/mariia.hub',
        'https://www.linkedin.com/company/mariia-hub'
      ]
    };

    return StructuredDataGenerator.getInstance(businessInfo);
  }, [t]);

  const schemas = useMemo(() => {
    const allSchemas: Record<string, any>[] = [];
    const currentUrl = window.location.href;

    // 1. WebPage schema (always included)
    if (options.pageInfo) {
      const breadcrumbSchema = options.breadcrumbs
        ? generator.generateBreadcrumbSchema(options.breadcrumbs)
        : undefined;

      allSchemas.push(generator.generateWebPageSchema({
        ...options.pageInfo,
        url: currentUrl,
        breadcrumb: breadcrumbSchema
      }));
    }

    // 2. LocalBusiness schema
    if (options.businessType) {
      let businessSchema = generator.generateLocalBusinessSchema(options.businessType);

      // Add service catalog if service is provided
      if (options.service) {
        const serviceCatalog = generator.generateServiceCatalogSchema([options.service]);
        businessSchema = {
          ...businessSchema,
          hasOfferCatalog: serviceCatalog
        };
      }

      // Add reviews and aggregate rating
      if (options.reviews && options.reviews.length > 0) {
        const reviewData = generator.generateReviewSchema(
          options.reviews,
          {
            ratingValue: 4.8,
            reviewCount: options.reviews.length
          }
        );
        businessSchema = {
          ...businessSchema,
          review: reviewData.review,
          aggregateRating: reviewData.aggregateRating
        };
      }

      allSchemas.push(businessSchema);
    }

    // 3. Service schema
    if (options.service) {
      const serviceSchema = generator.generateServiceSchema(
        options.service,
        'mariiaborysevych'
      );
      allSchemas.push(serviceSchema);
    }

    // 4. Breadcrumb schema (standalone if not included in WebPage)
    if (options.breadcrumbs && !options.pageInfo) {
      allSchemas.push(generator.generateBreadcrumbSchema(options.breadcrumbs));
    }

    // 5. FAQ schema
    if (options.faqs && options.faqs.length > 0) {
      allSchemas.push(generator.generateFAQSchema(options.faqs));
    }

    // 6. Article schema
    if (options.articleInfo) {
      allSchemas.push(generator.generateArticleSchema(
        {
          ...options.articleInfo,
          url: currentUrl
        },
        'BlogPosting'
      ));
    }

    // 7. Event schema
    if (options.eventInfo) {
      allSchemas.push(generator.generateEventSchema(options.eventInfo));
    }

    // 8. Person schema
    if (options.personInfo) {
      allSchemas.push(generator.generatePersonSchema(options.personInfo));
    }

    // 9. Organization schema (for business pages)
    if (location.pathname.includes('/about') || location.pathname.includes('/admin')) {
      allSchemas.push({
        '@context': 'https://schema.org',
        '@type': 'Organization',
        name: 'mariiaborysevych',
        description: t('seo.businessDescription', 'Premium beauty and fitness services in Warsaw, Poland'),
        url: window.location.origin,
        logo: `${window.location.origin}/logo.png`,
        contactPoint: {
          '@type': 'ContactPoint',
          telephone: '+48 123 456 789',
          contactType: 'customer service',
          availableLanguage: ['English', 'Polish']
        },
        address: {
          '@type': 'PostalAddress',
          streetAddress: 'ul. Smolna 8',
          addressLocality: 'Warsaw',
          addressRegion: 'Mazowieckie',
          postalCode: '00-001',
          addressCountry: 'PL'
        },
        sameAs: [
          'https://instagram.com/mariia.hub',
          'https://facebook.com/mariia.hub'
        ]
      });
    }

    return allSchemas;
  }, [generator, options, location.pathname, t]);

  const jsonLd = useMemo(() => {
    if (schemas.length === 0) return '';

    return schemas.map(schema => JSON.stringify(schema)).join('\n');
  }, [schemas]);

  const validation = useMemo(() => {
    const allErrors: string[] = [];
    const allWarnings: string[] = [];
    let isValid = true;

    schemas.forEach((schema, index) => {
      const result = generator.validateStructuredData(schema);
      if (!result.valid) {
        isValid = false;
      }
      allErrors.push(...result.errors.map(error => `Schema ${index + 1}: ${error}`));
      allWarnings.push(...result.warnings.map(warning => `Schema ${index + 1}: ${warning}`));
    });

    return {
      valid: isValid,
      errors: allErrors,
      warnings: allWarnings
    };
  }, [schemas, generator]);

  return {
    schemas,
    jsonLd,
    generator,
    validation
  };
};

/**
 * Hook specifically for service pages
 */
export const useServiceStructuredData = (service: Service, reviews?: Review[]) => {
  const { t } = useTranslation();
  const location = useLocation();

  const breadcrumbs = [
    { name: t('nav.home', 'Home'), url: '/' },
    { name: t(`nav.${service.category}`, service.category), url: `/${service.category}` },
    { name: service.name, url: location.pathname }
  ];

  const faqs = [
    {
      question: t(`faq.${service.category}.duration.question`, 'How long does the treatment take?'),
      answer: t(`faq.${service.category}.duration.answer`, `The treatment typically takes ${service.duration || 60} minutes.`)
    },
    {
      question: t(`faq.${service.category}.preparation.question`, 'How should I prepare for the treatment?'),
      answer: t(`faq.${service.category}.preparation.answer`, 'Please arrive 10 minutes early and avoid caffeine for 24 hours before the treatment.')
    },
    {
      question: t(`faq.${service.category}.aftercare.question`, 'What aftercare is required?'),
      answer: t(`faq.${service.category}.aftercare.answer`, 'Follow the provided aftercare instructions and avoid touching the treated area for 24 hours.')
    }
  ];

  return useStructuredData({
    service,
    reviews,
    faqs,
    breadcrumbs,
    businessType: service.category === 'beauty' ? 'BeautySalon' : 'HealthAndBeautyBusiness',
    pageInfo: {
      name: `${service.name} | mariiaborysevych`,
      description: service.description,
      url: window.location.href,
      primaryImage: service.images?.[0]?.url
    }
  });
};

/**
 * Hook specifically for blog/article pages
 */
export const useArticleStructuredData = (article: {
  title: string;
  description: string;
  content?: string;
  author: string;
  publishDate: string;
  image?: string[];
  keywords?: string[];
  category?: string;
}) => {
  const location = useLocation();
  const { t } = useTranslation();

  const breadcrumbs = [
    { name: t('nav.home', 'Home'), url: '/' },
    { name: t('nav.blog', 'Blog'), url: '/blog' },
    { name: article.title, url: location.pathname }
  ];

  return useStructuredData({
    articleInfo: article,
    breadcrumbs,
    pageInfo: {
      name: article.title,
      description: article.description,
      url: window.location.href,
      primaryImage: article.image?.[0]
    }
  });
};

/**
 * Hook for homepage structured data
 */
export const useHomepageStructuredData = (reviews?: Review[]) => {
  const { t } = useTranslation();

  const faqs = [
    {
      question: t('faq.business.hours.question', 'What are your opening hours?'),
      answer: t('faq.business.hours.answer', 'We are open Monday-Friday 9:00-21:00, Saturday 10:00-18:00, and Sunday 11:00-17:00.')
    },
    {
      question: t('faq.business.location.question', 'Where are you located?'),
      answer: t('faq.business.location.answer', 'We are located at ul. Smolna 8, Warsaw city center.')
    },
    {
      question: t('faq.business.booking.question', 'How can I book an appointment?'),
      answer: t('faq.business.booking.answer', 'You can book through our website, by phone, or via the Booksy app.')
    }
  ];

  return useStructuredData({
    businessType: 'LocalBusiness',
    reviews,
    faqs,
    pageInfo: {
      name: t('seo.homepage.title', 'mariiaborysevych - Beauty & Fitness Services Warsaw'),
      description: t('seo.homepage.description', 'Premium beauty and fitness services in Warsaw. Professional permanent makeup and certified personal training.'),
      url: window.location.href
    }
  });
};

/**
 * Hook for local SEO optimization
 */
export const useLocalStructuredData = (location: {
  city: string;
  district?: string;
  address: string;
  coordinates: { lat: number; lng: number };
}) => {
  return useStructuredData({
    businessType: 'LocalBusiness',
    pageInfo: {
      name: `mariiaborysevych - ${location.city}`,
      description: `Premium beauty and fitness services in ${location.city}${location.district ? `, ${location.district}` : ''}`,
      url: window.location.href
    }
  });
};

export default useStructuredData;