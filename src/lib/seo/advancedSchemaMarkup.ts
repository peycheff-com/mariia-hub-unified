/**
 * Advanced Schema Markup System
 * VideoObject, HowTo, Event, and other advanced schemas for Warsaw beauty & fitness market
 */

export interface SchemaMarkup {
  '@context': 'https://schema.org';
  '@type': string;
  [key: string]: any;
}

export interface VideoObjectSchema extends SchemaMarkup {
  '@type': 'VideoObject';
  name: string;
  description: string;
  thumbnailUrl: string;
  uploadDate: string;
  duration: string;
  contentUrl: string;
  embedUrl: string;
  interactionStatistic?: {
    '@type': 'InteractionCounter';
    interactionType: string;
    userInteractionCount: number;
  };
  expires?: string;
  regionsAllowed?: string[];
  thumbnail?: {
    '@type': 'ImageObject';
    url: string;
    width: number;
    height: number;
  };
  transcript?: string;
}

export interface HowToSchema extends SchemaMarkup {
  '@type': 'HowTo';
  name: string;
  description: string;
  image: string;
  totalTime: string;
  estimatedCost?: {
    '@type': 'MonetaryAmount';
    currency: string;
    value: string;
  };
  supply?: Array<{
    '@type': 'HowToSupply';
    name: string;
    image?: string;
  }>;
  tool?: Array<{
    '@type': 'HowToTool';
    name: string;
    image?: string;
  }>;
  step: Array<{
    '@type': 'HowToStep';
    name: string;
    text: string;
    image?: string;
    url?: string;
  }>;
}

export interface EventSchema extends SchemaMarkup {
  '@type': 'Event';
  name: string;
  description: string;
  startDate: string;
  endDate?: string;
  eventStatus: string;
  eventAttendanceMode: string;
  location: {
    '@type': 'Place';
    name: string;
    address: {
      '@type': 'PostalAddress';
      streetAddress: string;
      addressLocality: string;
      addressRegion: string;
      postalCode: string;
      addressCountry: string;
    };
  };
  offers?: {
    '@type': 'Offer';
    url: string;
    price: string;
    priceCurrency: string;
    availability: string;
    validFrom: string;
  };
  organizer: {
    '@type': 'Organization';
    name: string;
    url: string;
  };
  performer?: {
    '@type': 'Person';
    name: string;
    sameAs: string;
  };
  inLanguage?: string[];
  isAccessibleForFree?: boolean;
}

export interface CourseSchema extends SchemaMarkup {
  '@type': 'Course';
  name: string;
  description: string;
  provider: {
    '@type': 'Organization';
    name: string;
    url: string;
  };
  hasCourseInstance?: {
    '@type': 'CourseInstance';
    courseMode: string;
    instructor: {
      '@type': 'Person';
      name: string;
      jobTitle: string;
    };
    location: {
      '@type': 'Place';
      name: string;
      address: any;
    };
  };
  educationalLevel: string;
  about: string;
  teaches: string[];
  inLanguage: string[];
  offers?: {
    '@type': 'Offer';
    price: string;
    priceCurrency: string;
    availability: string;
  };
  totalTime: string;
  coursePrerequisites?: string[];
}

export interface FAQSchema extends SchemaMarkup {
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

export interface BreadcrumbListSchema extends SchemaMarkup {
  '@type': 'BreadcrumbList';
  itemListElement: Array<{
    '@type': 'ListItem';
    position: number;
    name: string;
    item: string;
  }>;
}

export interface ProductSchema extends SchemaMarkup {
  '@type': 'Product';
  name: string;
  description: string;
  image: string[];
  brand: {
    '@type': 'Brand';
    name: string;
  };
  offers: {
    '@type': 'Offer';
    url: string;
    priceCurrency: string;
    price: string;
    availability: string;
    seller: {
      '@type': 'Organization';
      name: string;
    };
  };
  aggregateRating?: {
    '@type': 'AggregateRating';
    ratingValue: string;
    reviewCount: string;
    bestRating: string;
    worstRating: string;
  };
  review?: Array<{
    '@type': 'Review';
    author: {
      '@type': 'Person';
      name: string;
    };
    datePublished: string;
    reviewRating: {
      '@type': 'Rating';
      ratingValue: string;
    };
    reviewBody: string;
  }>;
}

export interface ServiceSchema extends SchemaMarkup {
  '@type': 'Service';
  name: string;
  description: string;
  provider: {
    '@type': 'Organization';
    name: string;
    url: string;
    address: any;
    telephone: string;
  };
  areaServed: {
    '@type': 'Place';
    name: string;
  };
  hasOfferCatalog: {
    '@type': 'OfferCatalog';
    name: string;
    itemListElement: Array<{
      '@type': 'Offer';
      itemOffered: {
        '@type': 'Service';
        name: string;
        description: string;
      };
      price: string;
      priceCurrency: string;
      availability: string;
    }>;
  };
  serviceType: string;
  hoursAvailable: {
    '@type': 'OpeningHoursSpecification';
    dayOfWeek: string[];
    opens: string;
    closes: string;
  };
}

export interface LocalBusinessSchema extends SchemaMarkup {
  '@type': 'LocalBusiness';
  name: string;
  description: string;
  image: string;
  url: string;
  telephone: string;
  address: {
    '@type': 'PostalAddress';
    streetAddress: string;
    addressLocality: string;
    addressRegion: string;
    postalCode: string;
    addressCountry: string;
  };
  geo: {
    '@type': 'GeoCoordinates';
    latitude: number;
    longitude: number;
  };
  openingHours: string[];
  priceRange: string;
  paymentAccepted: string[];
  servesCuisine?: string;
  menu?: string;
  aggregatesRating?: {
    '@type': 'AggregateRating';
    ratingValue: number;
    reviewCount: number;
    bestRating: number;
    worstRating: number;
  };
  review?: Array<{
    '@type': 'Review';
    author: {
      '@type': 'Person';
      name: string;
    };
    reviewRating: {
      '@type': 'Rating';
      ratingValue: number;
    };
    reviewBody: string;
    datePublished: string;
  }>;
  sameAs: string[];
}

export interface WebPageSchema extends SchemaMarkup {
  '@type': 'WebPage';
  name: string;
  description: string;
  url: string;
  mainEntity: any;
  breadcrumb?: any;
  datePublished?: string;
  dateModified?: string;
  inLanguage: string;
  isPartOf: {
    '@type': 'WebSite';
    name: string;
    url: string;
  };
  primaryImageOfPage?: {
    '@type': 'ImageObject';
    url: string;
  };
  lastReviewed?: string;
  reviewedBy?: {
    '@type': 'Organization';
    name: string;
  };
}

/**
 * Advanced Schema Markup Generator for Warsaw Beauty & Fitness
 */
export class AdvancedSchemaMarkupGenerator {
  private baseUrl: string;
  private businessInfo: {
    name: string;
    address: string;
    phone: string;
    coordinates: { lat: number; lng: number };
    website: string;
  };

  constructor() {
    this.baseUrl = 'https://mariaborysevych.com';
    this.businessInfo = {
      name: 'Mariia Hub',
      address: 'ul. Smolna 8, 00-001 Warszawa',
      phone: '+48 123 456 789',
      coordinates: { lat: 52.2297, lng: 21.0122 },
      website: this.baseUrl
    };
  }

  /**
   * Generate VideoObject schema for beauty treatment videos
   */
  generateVideoObjectSchema(videoData: {
    title: string;
    description: string;
    duration: string;
    thumbnailUrl: string;
    videoUrl: string;
    uploadDate: string;
    category: string;
    tags?: string[];
    transcript?: string;
  }): VideoObjectSchema {
    return {
      '@context': 'https://schema.org',
      '@type': 'VideoObject',
      name: videoData.title,
      description: videoData.description,
      thumbnailUrl: videoData.thumbnailUrl,
      uploadDate: videoData.uploadDate,
      duration: videoData.duration,
      contentUrl: videoData.videoUrl,
      embedUrl: `${this.baseUrl}/embed/${videoData.videoUrl.split('/').pop()}`,
      interactionStatistic: {
        '@type': 'InteractionCounter',
        interactionType: 'https://schema.org/WatchAction',
        userInteractionCount: 1000 // Would be dynamic
      },
      regionsAllowed: ['PL'],
      thumbnail: {
        '@type': 'ImageObject',
        url: videoData.thumbnailUrl,
        width: 1280,
        height: 720
      },
      ...(videoData.transcript && { transcript: videoData.transcript }),
      ...(videoData.tags && { keywords: videoData.tags.join(', ') })
    };
  }

  /**
   * Generate HowTo schema for beauty treatment guides
   */
  generateHowToSchema(howToData: {
    title: string;
    description: string;
    totalTime: string;
    estimatedCost?: number;
    supplies?: Array<{ name: string; image?: string }>;
    tools?: Array<{ name: string; image?: string }>;
    steps: Array<{
      name: string;
      instruction: string;
      image?: string;
      tip?: string;
    }>;
  }): HowToSchema {
    return {
      '@context': 'https://schema.org',
      '@type': 'HowTo',
      name: howToData.title,
      description: howToData.description,
      image: `${this.baseUrl}/assets/how-to/${howToData.title.toLowerCase().replace(/\s+/g, '-')}.webp`,
      totalTime: howToData.totalTime,
      ...(howToData.estimatedCost && {
        estimatedCost: {
          '@type': 'MonetaryAmount',
          currency: 'PLN',
          value: howToData.estimatedCost.toString()
        }
      }),
      ...(howToData.supplies && {
        supply: howToData.supplies.map(supply => ({
          '@type': 'HowToSupply',
          name: supply.name,
          ...(supply.image && { image: supply.image })
        }))
      }),
      ...(howToData.tools && {
        tool: howToData.tools.map(tool => ({
          '@type': 'HowToTool',
          name: tool.name,
          ...(tool.image && { image: tool.image })
        }))
      }),
      step: howToData.steps.map((step, index) => ({
        '@type': 'HowToStep',
        name: step.name,
        text: step.instruction + (step.tip ? `\n\nWskazówka: ${step.tip}` : ''),
        ...(step.image && { image: step.image }),
        url: `${this.baseUrl}/how-to/${howToData.title.toLowerCase().replace(/\s+/g, '-')}#step-${index + 1}`
      }))
    };
  }

  /**
   * Generate Event schema for workshops and training sessions
   */
  generateEventSchema(eventData: {
    title: string;
    description: string;
    startDate: string;
    endDate?: string;
    location: string;
    price?: number;
    currency?: string;
    organizerName: string;
    performerName?: string;
    isOnline: boolean;
    language?: string[];
  }): EventSchema {
    return {
      '@context': 'https://schema.org',
      '@type': 'Event',
      name: eventData.title,
      description: eventData.description,
      startDate: eventData.startDate,
      ...(eventData.endDate && { endDate: eventData.endDate }),
      eventStatus: 'https://schema.org/EventScheduled',
      eventAttendanceMode: eventData.isOnline
        ? 'https://schema.org/OnlineEventAttendanceMode'
        : 'https://schema.org/OfflineEventAttendanceMode',
      location: eventData.isOnline ? {
        '@type': 'VirtualLocation',
        url: 'https://zoom.us/j/mariia-hub'
      } : {
        '@type': 'Place',
        name: eventData.location,
        address: {
          '@type': 'PostalAddress',
          streetAddress: 'ul. Smolna 8',
          addressLocality: 'Warszawa',
          addressRegion: 'Mazowieckie',
          postalCode: '00-001',
          addressCountry: 'PL'
        }
      },
      ...(eventData.price && {
        offers: {
          '@type': 'Offer',
          url: `${this.baseUrl}/events/${eventData.title.toLowerCase().replace(/\s+/g, '-')}`,
          price: eventData.price.toString(),
          priceCurrency: eventData.currency || 'PLN',
          availability: 'https://schema.org/InStock',
          validFrom: new Date().toISOString()
        }
      }),
      organizer: {
        '@type': 'Organization',
        name: eventData.organizerName,
        url: this.baseUrl
      },
      ...(eventData.performerName && {
        performer: {
          '@type': 'Person',
          name: eventData.performerName,
          sameAs: `${this.baseUrl}/team/${eventData.performerName.toLowerCase().replace(/\s+/g, '-')}`
        }
      }),
      ...(eventData.language && { inLanguage: eventData.language }),
      isAccessibleForFree: eventData.price === 0
    };
  }

  /**
   * Generate Course schema for training programs
   */
  generateCourseSchema(courseData: {
    title: string;
    description: string;
    providerName: string;
    instructorName: string;
    instructorTitle: string;
    duration: string;
    educationalLevel: string;
    topics: string[];
    price?: number;
    currency?: string;
    language?: string[];
    prerequisites?: string[];
  }): CourseSchema {
    return {
      '@context': 'https://schema.org',
      '@type': 'Course',
      name: courseData.title,
      description: courseData.description,
      provider: {
        '@type': 'Organization',
        name: courseData.providerName,
        url: this.baseUrl
      },
      hasCourseInstance: {
        '@type': 'CourseInstance',
        courseMode: 'offline',
        instructor: {
          '@type': 'Person',
          name: courseData.instructorName,
          jobTitle: courseData.instructorTitle
        },
        location: {
          '@type': 'Place',
          name: 'Mariia Hub',
          address: {
            '@type': 'PostalAddress',
            streetAddress: 'ul. Smolna 8',
            addressLocality: 'Warszawa',
            addressRegion: 'Mazowieckie',
            postalCode: '00-001',
            addressCountry: 'PL'
          }
        }
      },
      educationalLevel: courseData.educationalLevel,
      about: 'Beauty and Fitness Training',
      teaches: courseData.topics,
      inLanguage: courseData.language || ['Polish', 'English'],
      ...(courseData.price && {
        offers: {
          '@type': 'Offer',
          price: courseData.price.toString(),
          priceCurrency: courseData.currency || 'PLN',
          availability: 'https://schema.org/InStock'
        }
      }),
      totalTime: courseData.duration,
      ...(courseData.prerequisites && { coursePrerequisites: courseData.prerequisites })
    };
  }

  /**
   * Generate comprehensive FAQ schema
   */
  generateFAQSchema(faqs: Array<{
    question: string;
    answer: string;
    category?: string;
  }>): FAQSchema {
    return {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: faqs.map(faq => ({
        '@type': 'Question',
        name: faq.question,
        acceptedAnswer: {
          '@type': 'Answer',
          text: faq.answer
        }
      }))
    };
  }

  /**
   * Generate BreadcrumbList schema
   */
  generateBreadcrumbSchema(breadcrumbs: Array<{
    name: string;
    url: string;
  }>): BreadcrumbListSchema {
    return {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: breadcrumbs.map((breadcrumb, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        name: breadcrumb.name,
        item: `${this.baseUrl}${breadcrumb.url}`
      }))
    };
  }

  /**
   * Generate LocalBusiness schema with multiple locations
   */
  generateMultiLocationBusinessSchema(locations: Array<{
    name: string;
    address: string;
    phone: string;
    coordinates: { lat: number; lng: number };
    openingHours: string[];
    services: string[];
    district: string;
  }>): LocalBusinessSchema[] {
    return locations.map(location => ({
      '@context': 'https://schema.org',
      '@type': 'LocalBusiness',
      name: `${this.businessInfo.name} - ${location.district}`,
      description: `Premium beauty and fitness services in ${location.district}, Warsaw. Professional permanent makeup, brow styling, and personal training.`,
      image: `${this.baseUrl}/assets/locations/${location.district.toLowerCase()}.webp`,
      url: `${this.baseUrl}/warszawa/${location.district.toLowerCase()}`,
      telephone: location.phone,
      address: {
        '@type': 'PostalAddress',
        streetAddress: location.address,
        addressLocality: 'Warszawa',
        addressRegion: 'Mazowieckie',
        postalCode: '00-001',
        addressCountry: 'PL'
      },
      geo: {
        '@type': 'GeoCoordinates',
        latitude: location.coordinates.lat,
        longitude: location.coordinates.lng
      },
      openingHours: location.openingHours,
      priceRange: '$$$',
      paymentAccepted: ['Cash', 'Credit Card', 'Bank Transfer'],
      aggregatesRating: {
        '@type': 'AggregateRating',
        ratingValue: 4.9,
        reviewCount: 528,
        bestRating: 5,
        worstRating: 1
      },
      sameAs: [
        'https://instagram.com/mariia.hub',
        'https://facebook.com/mariia.hub',
        'https://booksy.com/pl/pl/102783/mariia-hub'
      ],
      areaServed: {
        '@type': 'Place',
        name: `${location.district}, Warszawa`
      }
    }));
  }

  /**
   * Generate WebPage schema with comprehensive metadata
   */
  generateWebPageSchema(pageData: {
    title: string;
    description: string;
    url: string;
    mainEntity?: any;
    breadcrumbs?: Array<{ name: string; url: string }>;
    primaryImage?: string;
    lastReviewed?: string;
    datePublished?: string;
    dateModified?: string;
  }): WebPageSchema {
    return {
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      name: pageData.title,
      description: pageData.description,
      url: `${this.baseUrl}${pageData.url}`,
      ...(pageData.mainEntity && { mainEntity: pageData.mainEntity }),
      ...(pageData.breadcrumbs && {
        breadcrumb: this.generateBreadcrumbSchema(pageData.breadcrumbs)
      }),
      ...(pageData.primaryImage && {
        primaryImageOfPage: {
          '@type': 'ImageObject',
          url: pageData.primaryImage
        }
      }),
      ...(pageData.datePublished && { datePublished: pageData.datePublished }),
      ...(pageData.dateModified && { dateModified: pageData.dateModified }),
      ...(pageData.lastReviewed && { lastReviewed: pageData.lastReviewed }),
      inLanguage: 'pl-PL',
      isPartOf: {
        '@type': 'WebSite',
        name: 'Mariia Hub',
        url: this.baseUrl
      },
      reviewedBy: {
        '@type': 'Organization',
        name: 'Mariia Hub SEO Team'
      }
    };
  }

  /**
   * Generate comprehensive schema bundle for service pages
   */
  generateServiceSchemaBundle(serviceData: {
    serviceName: string;
    description: string;
    category: 'beauty' | 'fitness';
    price: number;
    currency: string;
    duration: string;
    location: string;
    keywords: string[];
    faqs: Array<{ question: string; answer: string }>;
    images: string[];
    videos?: Array<{
      title: string;
      description: string;
      duration: string;
      thumbnailUrl: string;
      videoUrl: string;
      uploadDate: string;
    }>;
    howTo?: {
      title: string;
      description: string;
      steps: Array<{ name: string; instruction: string }>;
    };
  }): SchemaMarkup[] {
    const schemas: SchemaMarkup[] = [];

    // Main WebPage schema
    schemas.push(this.generateWebPageSchema({
      title: `${serviceData.serviceName} Warszawa - Mariia Hub`,
      description: serviceData.description,
      url: `/services/${serviceData.serviceName.toLowerCase().replace(/\s+/g, '-')}`,
      primaryImage: serviceData.images[0],
      datePublished: new Date().toISOString(),
      dateModified: new Date().toISOString()
    }));

    // LocalBusiness schema
    schemas.push(...this.generateMultiLocationBusinessSchema([{
      name: this.businessInfo.name,
      address: this.businessInfo.address,
      phone: this.businessInfo.phone,
      coordinates: this.businessInfo.coordinates,
      openingHours: [
        'Mo 09:00-21:00',
        'Tu 09:00-21:00',
        'We 09:00-21:00',
        'Th 09:00-21:00',
        'Fr 09:00-21:00',
        'Sa 10:00-18:00',
        'Su 11:00-17:00'
      ],
      services: [serviceData.serviceName],
      district: 'Śródmieście'
    }]));

    // Service schema
    schemas.push({
      '@context': 'https://schema.org',
      '@type': 'Service',
      name: serviceData.serviceName,
      description: serviceData.description,
      provider: {
        '@type': 'Organization',
        name: this.businessInfo.name,
        url: this.baseUrl,
        address: {
          '@type': 'PostalAddress',
          streetAddress: this.businessInfo.address,
          addressLocality: 'Warszawa',
          addressRegion: 'Mazowieckie',
          postalCode: '00-001',
          addressCountry: 'PL'
        },
        telephone: this.businessInfo.phone
      },
      areaServed: {
        '@type': 'Place',
        name: 'Warszawa'
      },
      hasOfferCatalog: {
        '@type': 'OfferCatalog',
        name: `${serviceData.serviceName} Services`,
        itemListElement: [{
          '@type': 'Offer',
          itemOffered: {
            '@type': 'Service',
            name: serviceData.serviceName,
            description: serviceData.description
          },
          price: serviceData.price.toString(),
          priceCurrency: serviceData.currency,
          availability: 'https://schema.org/InStock'
        }]
      },
      serviceType: serviceData.category,
      hoursAvailable: {
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
        opens: '09:00',
        closes: '21:00'
      }
    });

    // FAQ schema
    if (serviceData.faqs.length > 0) {
      schemas.push(this.generateFAQSchema(serviceData.faqs));
    }

    // VideoObject schemas
    if (serviceData.videos) {
      serviceData.videos.forEach(video => {
        schemas.push(this.generateVideoObjectSchema(video));
      });
    }

    // HowTo schema
    if (serviceData.howTo) {
      schemas.push(this.generateHowToSchema({
        title: serviceData.howTo.title,
        description: serviceData.howTo.description,
        totalTime: serviceData.duration,
        steps: serviceData.howTo.steps
      }));
    }

    return schemas;
  }

  /**
   * Generate schema markup for blog posts
   */
  generateBlogPostSchema(postData: {
    title: string;
    description: string;
    author: string;
    publishDate: string;
    modifyDate?: string;
    image: string;
    category: string;
    tags: string[];
    content: string;
  }): SchemaMarkup {
    return {
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: postData.title,
      description: postData.description,
      image: {
        '@type': 'ImageObject',
        url: postData.image,
        height: 1200,
        width: 630
      },
      author: {
        '@type': 'Person',
        name: postData.author
      },
      publisher: {
        '@type': 'Organization',
        name: this.businessInfo.name,
        logo: {
          '@type': 'ImageObject',
          url: `${this.baseUrl}/logo.png`,
          width: 512,
          height: 512
        }
      },
      datePublished: postData.publishDate,
      ...(postData.modifyDate && { dateModified: postData.modifyDate }),
      mainEntityOfPage: {
        '@type': 'WebPage',
        '@id': `${this.baseUrl}/blog/${postData.title.toLowerCase().replace(/\s+/g, '-')}`
      },
      articleSection: postData.category,
      keywords: postData.tags.join(', '),
      wordCount: postData.content.split(' ').length,
      inLanguage: 'pl-PL'
    };
  }

  /**
   * Generate schema for special events and workshops
   */
  generateEventSchemaBundle(eventData: {
    title: string;
    description: string;
    startDate: string;
    endDate?: string;
    location: string;
    price?: number;
    organizerName: string;
    performerName?: string;
    eventType: 'workshop' | 'training' | 'consultation' | 'masterclass';
    isOnline: boolean;
    maxAttendees?: number;
    currentAttendees?: number;
  }): SchemaMarkup[] {
    const schemas: SchemaMarkup[] = [];

    // Main Event schema
    schemas.push(this.generateEventSchema(eventData));

    // WebPage schema for event page
    schemas.push(this.generateWebPageSchema({
      title: `${eventData.title} - Wydarzenie Mariia Hub`,
      description: eventData.description,
      url: `/events/${eventData.title.toLowerCase().replace(/\s+/g, '-')}`,
      datePublished: new Date().toISOString(),
      dateModified: new Date().toISOString()
    }));

    return schemas;
  }

  /**
   * Generate product schema for beauty products
   */
  generateProductSchema(productData: {
    name: string;
    description: string;
    brand: string;
    price: number;
    currency: string;
    availability: string;
    images: string[];
    category: string;
    sku: string;
    reviews?: Array<{
      author: string;
      rating: number;
      comment: string;
      date: string;
    }>;
  }): ProductSchema {
    return {
      '@context': 'https://schema.org',
      '@type': 'Product',
      name: productData.name,
      description: productData.description,
      image: productData.images,
      brand: {
        '@type': 'Brand',
        name: productData.brand
      },
      offers: {
        '@type': 'Offer',
        url: `${this.baseUrl}/products/${productData.sku}`,
        priceCurrency: productData.currency,
        price: productData.price.toString(),
        availability: productData.availability,
        seller: {
          '@type': 'Organization',
          name: this.businessInfo.name
        }
      },
      category: productData.category,
      sku: productData.sku,
      ...(productData.reviews && {
        aggregateRating: {
          '@type': 'AggregateRating',
          ratingValue: (productData.reviews.reduce((sum, r) => sum + r.rating, 0) / productData.reviews.length).toFixed(1),
          reviewCount: productData.reviews.length.toString(),
          bestRating: '5',
          worstRating: '1'
        },
        review: productData.reviews.map(review => ({
          '@type': 'Review',
          author: {
            '@type': 'Person',
            name: review.author
          },
          datePublished: review.date,
          reviewRating: {
            '@type': 'Rating',
            ratingValue: review.rating.toString()
          },
          reviewBody: review.comment
        }))
      })
    };
  }

  /**
   * Combine multiple schemas into a single structured data array
   */
  combineSchemas(schemas: SchemaMarkup[]): string {
    return JSON.stringify(schemas, null, 2);
  }

  /**
   * Generate schema markup for Warsaw specific pages
   */
  generateWarsawLocationSchema(districtData: {
    district: string;
    coordinates: { lat: number; lng: number };
    landmarks: string[];
    transport: string[];
    services: string[];
  }): SchemaMarkup[] {
    const schemas: SchemaMarkup[] = [];

    // LocalBusiness schema for district
    schemas.push({
      '@context': 'https://schema.org',
      '@type': 'LocalBusiness',
      name: `Mariia Hub ${districtData.district}`,
      description: `Premium beauty and fitness services in ${districtData.district}, Warsaw. Professional permanent makeup, brow styling, and personal training.`,
      image: `${this.baseUrl}/assets/locations/${districtData.district.toLowerCase()}.webp`,
      url: `${this.baseUrl}/warszawa/${districtData.district.toLowerCase()}`,
      telephone: this.businessInfo.phone,
      address: {
        '@type': 'PostalAddress',
        streetAddress: 'ul. Smolna 8',
        addressLocality: 'Warszawa',
        addressRegion: 'Mazowieckie',
        postalCode: '00-001',
        addressCountry: 'PL'
      },
      geo: {
        '@type': 'GeoCoordinates',
        latitude: districtData.coordinates.lat,
        longitude: districtData.coordinates.lng
      },
      openingHours: [
        'Mo 09:00-21:00',
        'Tu 09:00-21:00',
        'We 09:00-21:00',
        'Th 09:00-21:00',
        'Fr 09:00-21:00',
        'Sa 10:00-18:00',
        'Su 11:00-17:00'
      ],
      priceRange: '$$$',
      areaServed: {
        '@type': 'Place',
        name: `${districtData.district}, Warszawa`
      },
      knowsAbout: districtData.landmarks,
      hasOfferCatalog: {
        '@type': 'OfferCatalog',
        name: `Services in ${districtData.district}`,
        itemListElement: districtData.services.map(service => ({
          '@type': 'Offer',
          itemOffered: {
            '@type': 'Service',
            name: service
          },
          availability: 'https://schema.org/InStock'
        }))
      }
    });

    // Place schema for district
    schemas.push({
      '@context': 'https://schema.org',
      '@type': 'Place',
      name: districtData.district,
      description: `Warsaw district - ${districtData.district}`,
      geo: {
        '@type': 'GeoCoordinates',
        latitude: districtData.coordinates.lat,
        longitude: districtData.coordinates.lng
      },
      containedInPlace: {
        '@type': 'Place',
        name: 'Warszawa'
      }
    });

    return schemas;
  }
}

export default AdvancedSchemaMarkupGenerator;