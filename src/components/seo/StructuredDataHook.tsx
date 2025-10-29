import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation } from 'react-router-dom';

import { LocalBusinessSchema, ServiceSchema, BreadcrumbSchema, FAQSchema } from './StructuredData';

export const useStructuredData = () => {
  const { t } = useTranslation();
  const location = useLocation();

  const generateBreadcrumbSchema = useMemo(() => {
    const pathSegments = location.pathname.split('/').filter(Boolean);
    const breadcrumbs = [{ name: t('nav.home', 'Home'), url: window.location.origin }];

    let currentPath = '';
    pathSegments.forEach(segment => {
      currentPath += `/${segment}`;

      // Skip language codes
      if (segment === 'en' || segment === 'pl') {
        return;
      }

      let name = segment;
      // Translate common routes
      switch (segment) {
        case 'beauty':
          name = t('nav.beauty', 'Beauty Services');
          break;
        case 'fitness':
          name = t('nav.fitness', 'Fitness Programs');
          break;
        case 'about':
          name = t('nav.about', 'About');
          break;
        case 'contact':
          name = t('nav.contact', 'Contact');
          break;
        case 'blog':
          name = t('nav.blog', 'Blog');
          break;
        case 'booking':
          name = t('nav.booking', 'Book Now');
          break;
        default:
          // Convert kebab-case to title case
          name = segment.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
      }

      breadcrumbs.push({
        name,
        url: `${window.location.origin}${currentPath}`
      });
    });

    return BreadcrumbSchema({ items: breadcrumbs });
  }, [location.pathname, t]);

  const generateLocalBusinessSchema = useMemo(() => {
    return LocalBusinessSchema({
      aggregateRating: {
        ratingValue: 4.8,
        reviewCount: 127
      },
      reviews: [
        {
          author: 'Anna K.',
          rating: 5,
          comment: t('reviews.sample1', 'Excellent service! Very professional and friendly staff.'),
          date: '2024-01-15'
        },
        {
          author: 'Maria P.',
          rating: 5,
          comment: t('reviews.sample2', 'Amazing experience! The results exceeded my expectations.'),
          date: '2024-01-10'
        }
      ],
      t
    });
  }, [t]);

  const generateServiceSchema = (service: any) => {
    return ServiceSchema({
      service,
      provider: 'Mariia Hub'
    });
  };

  const generateFAQSchema = (service: any) => {
    const faqs = [
      {
        question: t('faq.preparation', 'How should I prepare for the appointment?'),
        answer: t('faq.preparationAnswer', 'Please arrive 10 minutes early and bring any relevant medical information.')
      },
      {
        question: t('faq.duration', 'How long does the treatment take?'),
        answer: t('faq.durationAnswer', `The treatment typically takes ${service?.duration || 60} minutes.`)
      },
      {
        question: t('faq.aftercare', 'What aftercare is required?'),
        answer: t('faq.aftercareAnswer', 'We will provide detailed aftercare instructions after your treatment.')
      }
    ];

    return FAQSchema({ faqs, t });
  };

  const generateEventSchema = (event: any) => {
    return {
      '@type': 'Event',
      name: event.name,
      description: event.description,
      startDate: event.startDate,
      endDate: event.endDate,
      location: {
        '@type': 'Place',
        name: 'Mariia Hub',
        address: {
          '@type': 'PostalAddress',
          streetAddress: 'ul. Marszałkowska 123',
          addressLocality: 'Warsaw',
          addressCountry: 'PL'
        }
      },
      offers: {
        '@type': 'Offer',
        price: event.price,
        priceCurrency: 'PLN',
        availability: 'https://schema.org/InStock'
      }
    };
  };

  const generateArticleSchema = (article: any) => {
    return {
      '@type': 'Article',
      headline: article.title,
      description: article.excerpt,
      image: article.image,
      datePublished: article.publishedAt,
      dateModified: article.updatedAt,
      author: {
        '@type': 'Person',
        name: article.author?.name || 'Mariia Hub Team'
      },
      publisher: {
        '@type': 'Organization',
        name: 'Mariia Hub',
        logo: {
          '@type': 'ImageObject',
          url: `${window.location.origin}/logo.png`
        }
      },
      mainEntityOfPage: {
        '@type': 'WebPage',
        '@id': `${window.location.origin}${location.pathname}`
      }
    };
  };

  const generateProductSchema = (product: any) => {
    return {
      '@type': 'Product',
      name: product.name,
      description: product.description,
      image: product.images || [],
      brand: {
        '@type': 'Brand',
        name: 'Mariia Hub'
      },
      offers: {
        '@type': 'Offer',
        price: product.price,
        priceCurrency: 'PLN',
        availability: product.inStock ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock'
      },
      aggregateRating: product.rating ? {
        '@type': 'AggregateRating',
        ratingValue: product.rating,
        reviewCount: product.reviewCount
      } : undefined
    };
  };

  return {
    generateBreadcrumbSchema,
    generateLocalBusinessSchema,
    generateServiceSchema,
    generateFAQSchema,
    generateEventSchema,
    generateArticleSchema,
    generateProductSchema
  };
};