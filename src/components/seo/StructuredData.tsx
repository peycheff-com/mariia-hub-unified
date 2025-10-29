import { useTranslation } from 'react-i18next';

interface Service {
  id: string;
  name: string;
  description: string;
  price: number;
  duration: number;
  category: 'beauty' | 'fitness';
  image?: string;
}

interface Review {
  author: string;
  rating: number;
  comment: string;
  date: string;
}

interface LocalBusinessSchemaProps {
  service?: Service;
  reviews?: Review[];
  aggregateRating?: {
    ratingValue: number;
    reviewCount: number;
  };
}

export const LocalBusinessSchema = ({
  service,
  reviews = [],
  aggregateRating,
  t = (key: string, defaultValue: string) => defaultValue
}) => {

  const baseSchema = {
    '@type': 'LocalBusiness',
    name: 'Mariia Hub',
    description: t('seo.businessDescription', 'Premium beauty and fitness services in Warsaw, Poland'),
    url: window.location.origin,
    telephone: '+48 123 456 789',
    address: {
      '@type': 'PostalAddress',
      streetAddress: 'ul. Marszałkowska 123',
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
    openingHours: [
      'Mo-Fr 09:00-21:00',
      'Sa 10:00-18:00',
      'Su 11:00-17:00'
    ],
    priceRange: '$$$',
    languages: ['English', 'Polish'],
    paymentAccepted: ['Cash', 'Credit Card', 'Bank Transfer'],
    currenciesAccepted: ['PLN', 'EUR', 'USD']
  };

  // Add service information if provided
  if (service) {
    const serviceSchema = {
      '@type': service.category === 'beauty' ? 'BeautySalon' : 'HealthAndBeautyBusiness',
      ...baseSchema,
      hasOfferCatalog: {
        '@type': 'OfferCatalog',
        name: 'Services',
        itemListElement: [
          {
            '@type': 'Offer',
            itemOffered: {
              '@type': service.category === 'beauty' ? 'BeautyService' : 'Service',
              name: service.name,
              description: service.description
            },
            price: service.price,
            priceCurrency: 'PLN',
            availability: 'https://schema.org/InStock'
          }
        ]
      }
    };

    // Add images if available
    if (service.image) {
      serviceSchema.image = [service.image];
    }

    return serviceSchema;
  }

  // Add aggregate rating if available
  if (aggregateRating) {
    baseSchema.aggregateRating = {
      '@type': 'AggregateRating',
      ratingValue: aggregateRating.ratingValue,
      reviewCount: aggregateRating.reviewCount,
      bestRating: 5,
      worstRating: 1
    };
  }

  // Add reviews if available
  if (reviews.length > 0) {
    baseSchema.review = reviews.map(review => ({
      '@type': 'Review',
      author: {
        '@type': 'Person',
        name: review.author
      },
      reviewRating: {
        '@type': 'Rating',
        ratingValue: review.rating,
        bestRating: 5,
        worstRating: 1
      },
      reviewBody: review.comment,
      datePublished: review.date
    }));
  }

  return baseSchema;
};

interface ServiceSchemaProps {
  service: Service;
  provider?: string;
}

export const ServiceSchema = ({ service, provider = 'Mariia Hub' }: ServiceSchemaProps) => {
  const schema = {
    '@type': 'Service',
    name: service.name,
    description: service.description,
    provider: {
      '@type': 'LocalBusiness',
      name: provider
    },
    serviceType: service.category === 'beauty' ? 'BeautyService' : 'FitnessService',
    offers: {
      '@type': 'Offer',
      price: service.price,
      priceCurrency: 'PLN',
      availability: 'https://schema.org/InStock',
      validFrom: new Date().toISOString()
    },
    duration: `PT${service.duration}M`,
    areaServed: {
      '@type': 'Place',
      name: 'Warsaw'
    }
  };

  if (service.image) {
    schema.image = [service.image];
  }

  return schema;
};

interface BreadcrumbSchemaProps {
  items: Array<{ name: string; url: string }>;
}

export const BreadcrumbSchema = ({ items }: BreadcrumbSchemaProps) => {
  return {
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url
    }))
  };
};

interface FAQSchemaProps {
  faqs: Array<{ question: string; answer: string }>;
  t?: (key: string, defaultValue: string) => string;
}

export const FAQSchema = ({ faqs, t = (key: string, defaultValue: string) => defaultValue }: FAQSchemaProps) => {
  return {
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
};