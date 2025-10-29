import { Service, Review } from '@/types/shared';

// Base interfaces for structured data
export interface Address {
  streetAddress: string;
  addressLocality: string;
  addressRegion: string;
  postalCode: string;
  addressCountry: string;
}

export interface GeoCoordinates {
  latitude: number;
  longitude: number;
}

export interface OpeningHours {
  dayOfWeek: string;
  opens: string;
  closes: string;
}

export interface ContactPoint {
  telephone: string;
  contactType: string;
  availableLanguage: string[];
  areaServed?: string;
}

export interface AggregateRating {
  ratingValue: number;
  reviewCount: number;
  bestRating?: number;
  worstRating?: number;
}

export interface Offer {
  price: number;
  priceCurrency: string;
  availability: string;
  validFrom?: string;
  validThrough?: string;
  priceValidUntil?: string;
  seller?: string;
}

export interface ImageObject {
  url: string;
  caption?: string;
  width?: number;
  height?: number;
}

// Schema.org type definitions
export interface LocalBusinessSchema {
  '@context': 'https://schema.org';
  '@type': 'LocalBusiness' | 'BeautySalon' | 'HealthAndBeautyBusiness';
  name: string;
  description: string;
  url: string;
  telephone: string;
  address: Address & { '@type': 'PostalAddress' };
  geo: GeoCoordinates & { '@type': 'GeoCoordinates' };
  openingHoursSpecification?: Array<OpeningHours & { '@type': 'OpeningHoursSpecification' }>;
  contactPoint?: ContactPoint & { '@type': 'ContactPoint' };
  priceRange?: string;
  languages?: string[];
  paymentAccepted?: string[];
  currenciesAccepted?: string[];
  image?: string[];
  logo?: string;
  sameAs?: string[];
  aggregateRating?: AggregateRating & { '@type': 'AggregateRating' };
  review?: Array<ReviewSchema>;
  hasOfferCatalog?: {
    '@type': 'OfferCatalog';
    name: string;
    itemListElement: Array<{
      '@type': 'Offer';
      itemOffered: ServiceSchema;
      price: number;
      priceCurrency: string;
      availability: string;
    }>;
  };
  areaServed?: {
    '@type': 'Place';
    name: string;
  };
}

export interface ServiceSchema {
  '@type': 'Service' | 'BeautyService' | 'FitnessService';
  name: string;
  description: string;
  provider?: {
    '@type': 'LocalBusiness' | 'Person';
    name: string;
  };
  serviceType?: string;
  offers?: Offer & { '@type': 'Offer' };
  duration?: string;
  areaServed?: {
    '@type': 'Place';
    name: string;
  };
  image?: string[];
  category?: string;
  keywords?: string[];
  providerMobility?: string;
}

export interface ReviewSchema {
  '@type': 'Review';
  author: {
    '@type': 'Person';
    name: string;
  };
  reviewRating: {
    '@type': 'Rating';
    ratingValue: number;
    bestRating?: number;
    worstRating?: number;
  };
  reviewBody: string;
  datePublished: string;
  reviewAspect?: string[];
  publisher?: {
    '@type': 'Organization';
    name: string;
  };
}

export interface BreadcrumbSchema {
  '@context': 'https://schema.org';
  '@type': 'BreadcrumbList';
  itemListElement: Array<{
    '@type': 'ListItem';
    position: number;
    name: string;
    item: string;
  }>;
}

export interface FAQSchema {
  '@context': 'https://schema.org';
  '@type': 'FAQPage';
  mainEntity: Array<{
    '@type': 'Question';
    name: string;
    acceptedAnswer: {
      '@type': 'Answer';
      text: string;
    };
  }>;
}

export interface ArticleSchema {
  '@context': 'https://schema.org';
  '@type': 'Article' | 'BlogPosting' | 'NewsArticle';
  headline: string;
  description: string;
  image?: string[];
  author: {
    '@type': 'Person';
    name: string;
    url?: string;
  };
  publisher: {
    '@type': 'Organization';
    name: string;
    logo?: {
      '@type': 'ImageObject';
      url: string;
    };
  };
  datePublished: string;
  dateModified?: string;
  mainEntityOfPage?: {
    '@type': 'WebPage';
    '@id': string;
  };
  articleBody?: string;
  keywords?: string[];
  articleSection?: string;
  wordCount?: number;
}

export interface EventSchema {
  '@context': 'https://schema.org';
  '@type': 'Event';
  name: string;
  description: string;
  startDate: string;
  endDate?: string;
  location: {
    '@type': 'Place';
    name: string;
    address: Address & { '@type': 'PostalAddress' };
  };
  organizer?: {
    '@type': 'Person' | 'Organization';
    name: string;
  };
  offers?: Offer & { '@type': 'Offer' };
  image?: string[];
  url?: string;
  eventStatus?: string;
  eventAttendanceMode?: string;
  performer?: {
    '@type': 'Person' | 'Organization';
    name: string;
  };
}

export interface PersonSchema {
  '@context': 'https://schema.org';
  '@type': 'Person';
  name: string;
  jobTitle?: string;
  description?: string;
  url?: string;
  image?: string[];
  sameAs?: string[];
  worksFor?: {
    '@type': 'Organization';
    name: string;
  };
  knowsAbout?: string[];
  award?: string[];
  alumniOf?: {
    '@type': 'Organization';
    name: string;
  };
}

export interface OrganizationSchema {
  '@context': 'https://schema.org';
  '@type': 'Organization';
  name: string;
  description?: string;
  url?: string;
  logo?: string;
  contactPoint?: ContactPoint & { '@type': 'ContactPoint' };
  address?: Address & { '@type': 'PostalAddress' };
  sameAs?: string[];
  foundingDate?: string;
  areaServed?: string[];
  knowsAbout?: string[];
  member?: {
    '@type': 'Person';
    name: string;
  }[];
}

export interface WebPageSchema {
  '@context': 'https://schema.org';
  '@type': 'WebPage';
  name: string;
  description: string;
  url: string;
  lastReviewed?: string;
  reviewedBy?: {
    '@type': 'Person';
    name: string;
  };
  mainContentOfPage?: {
    '@type': 'WebPageElement';
    cssSelector?: string;
  };
  relatedLink?: string[];
  significantLinks?: string[];
  primaryImageOfPage?: {
    '@type': 'ImageObject';
    url: string;
  };
  breadcrumb?: BreadcrumbSchema;
}

export interface VideoObjectSchema {
  '@context': 'https://schema.org';
  '@type': 'VideoObject';
  name: string;
  description: string;
  thumbnailUrl: string;
  uploadDate: string;
  duration?: string;
  contentUrl?: string;
  embedUrl?: string;
  publisher?: {
    '@type': 'Organization';
    name: string;
  };
  author?: {
    '@type': 'Person';
    name: string;
  };
}

/**
 * Advanced structured data generator for comprehensive SEO
 */
export class StructuredDataGenerator {
  private static instance: StructuredDataGenerator;
  private businessInfo: LocalBusinessSchema['baseBusiness'];

  constructor(businessInfo?: Partial<LocalBusinessSchema>) {
    this.businessInfo = {
      name: 'Mariia Hub',
      description: 'Premium beauty and fitness services in Warsaw, Poland',
      url: 'https://mariia-hub.pl',
      telephone: '+48 123 456 789',
      address: {
        '@type': 'PostalAddress',
        streetAddress: 'ul. Smolna 8',
        addressLocality: 'Warsaw',
        addressRegion: 'Mazowieckie',
        postalCode: '00-001',
        addressCountry: 'PL'
      },
      geo: {
        '@type': 'GeoCoordinates',
        latitude: 52.2297,
        longitude: 21.0122
      },
      openingHoursSpecification: [
        {
          '@type': 'OpeningHoursSpecification',
          dayOfWeek: 'Monday',
          opens: '09:00',
          closes: '21:00'
        },
        {
          '@type': 'OpeningHoursSpecification',
          dayOfWeek: 'Tuesday',
          opens: '09:00',
          closes: '21:00'
        },
        {
          '@type': 'OpeningHoursSpecification',
          dayOfWeek: 'Wednesday',
          opens: '09:00',
          closes: '21:00'
        },
        {
          '@type': 'OpeningHoursSpecification',
          dayOfWeek: 'Thursday',
          opens: '09:00',
          closes: '21:00'
        },
        {
          '@type': 'OpeningHoursSpecification',
          dayOfWeek: 'Friday',
          opens: '09:00',
          closes: '21:00'
        },
        {
          '@type': 'OpeningHoursSpecification',
          dayOfWeek: 'Saturday',
          opens: '10:00',
          closes: '18:00'
        },
        {
          '@type': 'OpeningHoursSpecification',
          dayOfWeek: 'Sunday',
          opens: '11:00',
          closes: '17:00'
        }
      ],
      priceRange: '$$$',
      languages: ['English', 'Polish'],
      paymentAccepted: ['Cash', 'Credit Card', 'Bank Transfer'],
      currenciesAccepted: ['PLN', 'EUR', 'USD'],
      ...businessInfo
    } as LocalBusinessSchema;
  }

  static getInstance(businessInfo?: Partial<LocalBusinessSchema>): StructuredDataGenerator {
    if (!StructuredDataGenerator.instance) {
      StructuredDataGenerator.instance = new StructuredDataGenerator(businessInfo);
    }
    return StructuredDataGenerator.instance;
  }

  /**
   * Generate LocalBusiness schema
   */
  generateLocalBusinessSchema(
    businessType: 'LocalBusiness' | 'BeautySalon' | 'HealthAndBeautyBusiness' = 'LocalBusiness',
    additionalInfo?: Partial<LocalBusinessSchema>
  ): LocalBusinessSchema {
    return {
      '@context': 'https://schema.org',
      '@type': businessType,
      ...this.businessInfo,
      ...additionalInfo
    };
  }

  /**
   * Generate Service schema
   */
  generateServiceSchema(
    service: Service,
    provider?: string,
    additionalInfo?: Partial<ServiceSchema>
  ): ServiceSchema {
    const schema: ServiceSchema = {
      '@context': 'https://schema.org',
      '@type': service.category === 'beauty' ? 'BeautyService' : 'FitnessService',
      name: service.name,
      description: service.description,
      provider: {
        '@type': 'LocalBusiness',
        name: provider || this.businessInfo.name
      },
      serviceType: service.category === 'beauty' ? 'BeautyService' : 'FitnessService',
      offers: {
        '@type': 'Offer',
        price: service.price,
        priceCurrency: 'PLN',
        availability: 'https://schema.org/InStock',
        validFrom: new Date().toISOString()
      },
      duration: `PT${service.duration || 60}M`,
      areaServed: {
        '@type': 'Place',
        name: 'Warsaw'
      },
      category: service.category,
      ...additionalInfo
    };

    if (service.images && service.images.length > 0) {
      schema.image = service.images.map(img => img.url);
    }

    return schema;
  }

  /**
   * Generate comprehensive service catalog schema
   */
  generateServiceCatalogSchema(
    services: Service[],
    provider?: string
  ): LocalBusinessSchema['hasOfferCatalog'] {
    const catalog = {
      '@type': 'OfferCatalog' as const,
      name: 'Services',
      itemListElement: services.map(service => ({
        '@type': 'Offer' as const,
        itemOffered: {
          '@type': service.category === 'beauty' ? 'BeautyService' : 'Service' as const,
          name: service.name,
          description: service.description,
          category: service.category,
          keywords: service.tags || []
        },
        price: service.price,
        priceCurrency: 'PLN',
        availability: 'https://schema.org/InStock',
        validFrom: new Date().toISOString()
      }))
    };

    return catalog;
  }

  /**
   * Generate Review schema with enhanced features
   */
  generateReviewSchema(
    reviews: Review[],
    aggregateRating?: AggregateRating
  ): { review: ReviewSchema[]; aggregateRating?: ReviewSchema['aggregateRating'] } {
    const reviewSchemas: ReviewSchema[] = reviews.map(review => ({
      '@type': 'Review' as const,
      author: {
        '@type': 'Person' as const,
        name: review.author
      },
      reviewRating: {
        '@type': 'Rating' as const,
        ratingValue: review.rating,
        bestRating: 5,
        worstRating: 1
      },
      reviewBody: review.comment,
      datePublished: review.createdAt,
      reviewAspect: ['service quality', 'professionalism', 'results']
    }));

    let aggRating: ReviewSchema['aggregateRating'] | undefined;
    if (aggregateRating) {
      aggRating = {
        '@type': 'AggregateRating' as const,
        ratingValue: aggregateRating.ratingValue,
        reviewCount: aggregateRating.reviewCount,
        bestRating: 5,
        worstRating: 1
      };
    }

    return {
      review: reviewSchemas,
      aggregateRating: aggRating
    };
  }

  /**
   * Generate BreadcrumbList schema
   */
  generateBreadcrumbSchema(
    items: Array<{ name: string; url: string; position?: number }>
  ): BreadcrumbSchema {
    return {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: items.map((item, index) => ({
        '@type': 'ListItem' as const,
        position: item.position || index + 1,
        name: item.name,
        item: item.url
      }))
    };
  }

  /**
   * Generate FAQPage schema
   */
  generateFAQSchema(
    faqs: Array<{ question: string; answer: string; category?: string }>
  ): FAQSchema {
    return {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: faqs.map(faq => ({
        '@type': 'Question' as const,
        name: faq.question,
        acceptedAnswer: {
          '@type': 'Answer' as const,
          text: faq.answer
        }
      }))
    };
  }

  /**
   * Generate Article/BlogPosting schema
   */
  generateArticleSchema(
    article: {
      title: string;
      description: string;
      content?: string;
      author: string;
      authorUrl?: string;
      publishDate: string;
      modifyDate?: string;
      url: string;
      image?: string[];
      keywords?: string[];
      category?: string;
      wordCount?: number;
    },
    articleType: 'Article' | 'BlogPosting' | 'NewsArticle' = 'BlogPosting'
  ): ArticleSchema {
    return {
      '@context': 'https://schema.org',
      '@type': articleType,
      headline: article.title,
      description: article.description,
      image: article.image,
      author: {
        '@type': 'Person' as const,
        name: article.author,
        url: article.authorUrl
      },
      publisher: {
        '@type': 'Organization' as const,
        name: this.businessInfo.name,
        logo: {
          '@type': 'ImageObject' as const,
          url: `${this.businessInfo.url}/logo.png`
        }
      },
      datePublished: article.publishDate,
      dateModified: article.modifyDate || article.publishDate,
      mainEntityOfPage: {
        '@type': 'WebPage' as const,
        '@id': article.url
      },
      articleBody: article.content,
      keywords: article.keywords,
      articleSection: article.category,
      wordCount: article.wordCount
    };
  }

  /**
   * Generate Event schema for workshops, training sessions, etc.
   */
  generateEventSchema(
    event: {
      name: string;
      description: string;
      startDate: string;
      endDate?: string;
      location?: Address;
      organizer?: string;
      price?: number;
      currency?: string;
      image?: string[];
      url?: string;
      performer?: string;
    }
  ): EventSchema {
    return {
      '@context': 'https://schema.org',
      '@type': 'Event',
      name: event.name,
      description: event.description,
      startDate: event.startDate,
      endDate: event.endDate,
      location: {
        '@type': 'Place' as const,
        name: 'Mariia Hub',
        address: {
          '@type': 'PostalAddress' as const,
          ...event.location || this.businessInfo.address
        }
      },
      organizer: event.organizer ? {
        '@type': 'Organization' as const,
        name: event.organizer
      } : {
        '@type': 'Organization' as const,
        name: this.businessInfo.name
      },
      offers: event.price ? {
        '@type': 'Offer' as const,
        price: event.price,
        priceCurrency: event.currency || 'PLN',
        availability: 'https://schema.org/InStock',
        validFrom: new Date().toISOString()
      } : undefined,
      image: event.image,
      url: event.url,
      eventStatus: 'https://schema.org/EventScheduled',
      eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
      performer: event.performer ? {
        '@type': 'Person' as const,
        name: event.performer
      } : undefined
    };
  }

  /**
   * Generate Person schema for staff profiles
   */
  generatePersonSchema(
    person: {
      name: string;
      jobTitle?: string;
      description?: string;
      url?: string;
      image?: string[];
      socialLinks?: string[];
      expertise?: string[];
      awards?: string[];
      education?: string[];
    }
  ): PersonSchema {
    return {
      '@context': 'https://schema.org',
      '@type': 'Person',
      name: person.name,
      jobTitle: person.jobTitle,
      description: person.description,
      url: person.url,
      image: person.image,
      sameAs: person.socialLinks,
      worksFor: {
        '@type': 'Organization' as const,
        name: this.businessInfo.name
      },
      knowsAbout: person.expertise,
      award: person.awards,
      alumniOf: person.education ? person.education.map(edu => ({
        '@type': 'Organization' as const,
        name: edu
      })) : undefined
    };
  }

  /**
   * Generate WebPage schema for enhanced SEO
   */
  generateWebPageSchema(
    pageInfo: {
      name: string;
      description: string;
      url: string;
      lastReviewed?: string;
      reviewedBy?: string;
      primaryImage?: string;
      relatedLinks?: string[];
      significantLinks?: string[];
      breadcrumb?: BreadcrumbSchema;
    }
  ): WebPageSchema {
    return {
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      name: pageInfo.name,
      description: pageInfo.description,
      url: pageInfo.url,
      lastReviewed: pageInfo.lastReviewed,
      reviewedBy: pageInfo.reviewedBy ? {
        '@type': 'Person' as const,
        name: pageInfo.reviewedBy
      } : undefined,
      primaryImageOfPage: pageInfo.primaryImage ? {
        '@type': 'ImageObject' as const,
        url: pageInfo.primaryImage
      } : undefined,
      relatedLink: pageInfo.relatedLinks,
      significantLinks: pageInfo.significantLinks,
      breadcrumb: pageInfo.breadcrumb
    };
  }

  /**
   * Generate VideoObject schema for video content
   */
  generateVideoSchema(
    video: {
      name: string;
      description: string;
      thumbnailUrl: string;
      uploadDate: string;
      duration?: string;
      contentUrl?: string;
      embedUrl?: string;
      author?: string;
      publisher?: string;
    }
  ): VideoObjectSchema {
    return {
      '@context': 'https://schema.org',
      '@type': 'VideoObject',
      name: video.name,
      description: video.description,
      thumbnailUrl: video.thumbnailUrl,
      uploadDate: video.uploadDate,
      duration: video.duration,
      contentUrl: video.contentUrl,
      embedUrl: video.embedUrl,
      author: video.author ? {
        '@type': 'Person' as const,
        name: video.author
      } : undefined,
      publisher: video.publisher ? {
        '@type': 'Organization' as const,
        name: video.publisher
      } : {
        '@type': 'Organization' as const,
        name: this.businessInfo.name
      }
    };
  }

  /**
   * Generate multiple schemas and combine them
   */
  generateCompositeSchema(
    schemas: Array<Record<string, any>>
  ): string {
    return JSON.stringify(schemas, null, 2);
  }

  /**
   * Validate structured data against schema.org requirements
   */
  validateStructuredData(schema: Record<string, any>): {
    valid: boolean;
    errors: string[];
    warnings: string[];
  } {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check for required @context and @type
    if (!schema['@context']) {
      errors.push('Missing @context property');
    }
    if (!schema['@type']) {
      errors.push('Missing @type property');
    }

    // Check context value
    if (schema['@context'] && schema['@context'] !== 'https://schema.org') {
      errors.push('Invalid @context value, should be https://schema.org');
    }

    // Type-specific validation
    const type = schema['@type'];
    switch (type) {
      case 'LocalBusiness':
      case 'BeautySalon':
      case 'HealthAndBeautyBusiness':
        if (!schema.name) errors.push('LocalBusiness requires name property');
        if (!schema.address) errors.push('LocalBusiness requires address property');
        if (!schema.telephone) warnings.push('LocalBusiness should include telephone');
        break;

      case 'Service':
        if (!schema.name) errors.push('Service requires name property');
        if (!schema.provider) warnings.push('Service should include provider');
        break;

      case 'Review':
        if (!schema.author) errors.push('Review requires author property');
        if (!schema.reviewRating) errors.push('Review requires reviewRating property');
        break;

      case 'FAQPage':
        if (!schema.mainEntity || !Array.isArray(schema.mainEntity)) {
          errors.push('FAQPage requires mainEntity array');
        }
        break;
    }

    // Check for URL fields
    const urlFields = ['url', 'image', 'logo', 'sameAs'];
    urlFields.forEach(field => {
      if (schema[field]) {
        const values = Array.isArray(schema[field]) ? schema[field] : [schema[field]];
        values.forEach((value: any) => {
          if (typeof value === 'string' && !value.startsWith('http')) {
            warnings.push(`${field} should start with http/https: ${value}`);
          }
        });
      }
    });

    // Check date fields
    const dateFields = ['datePublished', 'dateModified', 'uploadDate', 'validFrom', 'startDate'];
    dateFields.forEach(field => {
      if (schema[field] && !Date.parse(schema[field])) {
        errors.push(`Invalid date format for ${field}: ${schema[field]}`);
      }
    });

    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }
}

export default StructuredDataGenerator;