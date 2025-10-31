import React, { ReactNode, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import { SEOHead } from './SEOHead';
import { useStructuredData } from './StructuredDataHook';

interface SEOWrapperProps {
  children: ReactNode;
  fallbackTitle?: string;
  fallbackDescription?: string;
  fallbackImage?: string;
  customStructuredData?: Record<string, any>;
  noindex?: boolean;
}

interface RouteSEOConfig {
  title: string;
  description: string;
  keywords?: string;
  ogImage?: string;
  ogType?: string;
  structuredDataType?: 'localBusiness' | 'service' | 'article' | 'breadcrumb' | 'faq' | 'product' | 'event';
}

const getRouteSEOConfig = (pathname: string, t: any): RouteSEOConfig | null => {
  const routes: Record<string, (t: any) => RouteSEOConfig> = {
    '/': () => ({
      title: t('seo.home.title', 'mariiaborysevych - Premium Beauty & Fitness Services in Warsaw'),
      description: t('seo.home.description', 'Discover luxury beauty treatments and personalized fitness programs at mariiaborysevych. Book your appointment today for expert services in Warsaw.'),
      keywords: 'beauty salon Warsaw, fitness programs, lip enhancements, brow lamination, personal training, Warsaw beauty services',
      ogType: 'website',
      structuredDataType: 'localBusiness'
    }),
    '/beauty': () => ({
      title: t('seo.beauty.title', 'Beauty Services Warsaw - Premium Treatments | mariiaborysevych'),
      description: t('seo.beauty.description', 'Explore our comprehensive beauty services including lip enhancements, brow lamination, PMU treatments, and more. Luxury beauty salon in Warsaw.'),
      keywords: 'beauty services Warsaw, lip enhancements, brow lamination, PMU treatments, beauty salon, cosmetic procedures',
      ogType: 'website',
      structuredDataType: 'localBusiness'
    }),
    '/beauty/services': () => ({
      title: t('seo.beautyServices.title', 'All Beauty Services | mariiaborysevych Warsaw'),
      description: t('seo.beautyServices.description', 'Complete range of beauty services including lip blush, brow lamination, PMU, and makeup artistry. Professional beauty treatments in Warsaw.'),
      keywords: 'beauty services, lip blush, brow lamination, PMU, makeup, cosmetic treatments Warsaw',
      ogType: 'website'
    }),
    '/fitness': () => ({
      title: t('seo.fitness.title', 'Fitness Programs Warsaw - Personal Training | mariiaborysevych'),
      description: t('seo.fitness.description', 'Transform your fitness journey with personalized training programs, group classes, and expert coaching. Premium fitness center in Warsaw.'),
      keywords: 'fitness programs Warsaw, personal training, group fitness, glutes training, starter programs, gym Warsaw',
      ogType: 'website',
      structuredDataType: 'localBusiness'
    }),
    '/fitness/programs': () => ({
      title: t('seo.fitnessPrograms.title', 'Fitness Programs & Classes | mariiaborysevych'),
      description: t('seo.fitnessPrograms.description', 'Choose from our range of fitness programs including personal training, group classes, glutes specialization, and starter programs.'),
      keywords: 'fitness programs, personal training, group classes, glutes workout, fitness classes Warsaw',
      ogType: 'website'
    }),
    '/about': () => ({
      title: t('seo.about.title', 'About mariiaborysevych - Our Story & Philosophy'),
      description: t('seo.about.description', 'Learn about mariiaborysevych\'s philosophy, our expert team, and our commitment to providing premium beauty and fitness services in Warsaw.'),
      keywords: 'about mariiaborysevych, beauty salon Warsaw, fitness center, our team, our philosophy',
      ogType: 'website'
    }),
    '/contact': () => ({
      title: t('seo.contact.title', 'Contact mariiaborysevych - Book Your Appointment'),
      description: t('seo.contact.description', 'Get in touch with mariiaborysevych for premium beauty and fitness services in Warsaw. Book your appointment or inquire about our treatments.'),
      keywords: 'contact mariiaborysevych, book appointment, beauty salon contact, fitness center Warsaw, phone, email',
      ogType: 'website'
    }),
    '/blog': () => ({
      title: t('seo.blog.title', 'Beauty & Fitness Blog - Tips & Trends | mariiaborysevych'),
      description: t('seo.blog.description', 'Discover the latest beauty tips, fitness trends, treatment guides, and wellness advice from mariiaborysevych experts in Warsaw.'),
      keywords: 'beauty blog, fitness tips, wellness advice, treatment guides, beauty trends Warsaw',
      ogType: 'website'
    }),
    '/reviews': () => ({
      title: t('seo.reviews.title', 'Customer Reviews & Testimonials | mariiaborysevych'),
      description: t('seo.reviews.description', 'Read authentic reviews and testimonials from our satisfied clients. Discover why mariiaborysevych is the top choice for beauty and fitness services in Warsaw.'),
      keywords: 'customer reviews, testimonials, beauty salon reviews, fitness center reviews, mariiaborysevych feedback',
      ogType: 'website',
      structuredDataType: 'localBusiness'
    }),
    '/book': () => ({
      title: t('seo.booking.title', 'Book Your Appointment - mariiaborysevych Warsaw'),
      description: t('seo.booking.description', 'Book your beauty or fitness appointment online at mariiaborysevych. Easy scheduling for premium services in Warsaw.'),
      keywords: 'book appointment, online booking, beauty services booking, fitness programs booking, Warsaw appointments',
      ogType: 'website'
    }),
    '/packages': () => ({
      title: t('seo.packages.title', 'Service Packages & Deals | mariiaborysevych Warsaw'),
      description: t('seo.packages.description', 'Discover our special service packages and exclusive deals for beauty treatments and fitness programs. Save on premium services in Warsaw.'),
      keywords: 'service packages, beauty deals, fitness packages, special offers, Warsaw beauty treatments',
      ogType: 'website'
    }),
    '/gallery': () => ({
      title: t('seo.gallery.title', 'Photo Gallery - Our Work | mariiaborysevych'),
      description: t('seo.gallery.description', 'Browse our gallery showcasing beautiful transformations, fitness results, and studio environment. See the quality of our work at mariiaborysevych Warsaw.'),
      keywords: 'photo gallery, beauty transformations, fitness results, before after, our work Warsaw',
      ogType: 'website'
    }),
    '/faq': () => ({
      title: t('seo.faq.title', 'Frequently Asked Questions | mariiaborysevych'),
      description: t('seo.faq.description', 'Find answers to common questions about our beauty treatments, fitness programs, booking process, and services at mariiaborysevych Warsaw.'),
      keywords: 'FAQ, frequently asked questions, beauty treatment FAQ, fitness program FAQ, booking questions Warsaw',
      ogType: 'website',
      structuredDataType: 'faq'
    })
  };

  // Check for exact matches first
  if (routes[pathname]) {
    return routes[pathname](t);
  }

  // Check for dynamic routes
  if (pathname.startsWith('/beauty/services/')) {
    return {
      title: t('seo.beautyServiceDetail.title', 'Beauty Service Details | mariiaborysevych Warsaw'),
      description: t('seo.beautyServiceDetail.description', 'Learn more about our premium beauty service including treatment details, pricing, and booking information.'),
      keywords: 'beauty service details, treatment information, pricing, booking Warsaw',
      ogType: 'article',
      structuredDataType: 'service'
    };
  }

  if (pathname.startsWith('/fitness/programs/')) {
    return {
      title: t('seo.fitnessProgramDetail.title', 'Fitness Program Details | mariiaborysevych Warsaw'),
      description: t('seo.fitnessProgramDetail.description', 'Discover our fitness program details including schedule, pricing, and training methods for your fitness journey.'),
      keywords: 'fitness program details, training information, program schedule, pricing Warsaw',
      ogType: 'article',
      structuredDataType: 'service'
    };
  }

  if (pathname.startsWith('/blog/')) {
    return {
      title: t('seo.blogPost.title', 'Blog Post | mariiaborysevych'),
      description: t('seo.blogPost.description', 'Read our latest blog post about beauty tips, fitness advice, and wellness trends.'),
      keywords: 'blog post, beauty tips, fitness advice, wellness trends Warsaw',
      ogType: 'article',
      structuredDataType: 'article'
    };
  }

  if (pathname.startsWith('/lp/')) {
    return {
      title: t('seo.landingPage.title', 'Special Offer | mariiaborysevych Warsaw'),
      description: t('seo.landingPage.description', 'Discover our special promotion and exclusive offers for premium beauty and fitness services in Warsaw.'),
      keywords: 'special offer, promotion, exclusive deals, beauty services Warsaw',
      ogType: 'website'
    };
  }

  return null;
};

export const SEOWrapper: React.FC<SEOWrapperProps> = ({
  children,
  fallbackTitle,
  fallbackDescription,
  fallbackImage = '/og-image-default.webp',
  customStructuredData,
  noindex = false
}) => {
  const location = useLocation();
  const { t } = useTranslation();
  const structuredDataGenerator = useStructuredData();

  const seoConfig = useMemo(() => {
    return getRouteSEOConfig(location.pathname, t);
  }, [location.pathname, t]);

  const structuredData = useMemo(() => {
    // Use custom structured data if provided
    if (customStructuredData) {
      return customStructuredData;
    }

    // Generate structured data based on route type
    if (seoConfig?.structuredDataType) {
      switch (seoConfig.structuredDataType) {
        case 'localBusiness':
          return structuredDataGenerator.generateLocalBusinessSchema;
        case 'breadcrumb':
          return structuredDataGenerator.generateBreadcrumbSchema;
        case 'faq':
          return structuredDataGenerator.generateFAQSchema({ duration: 60 });
        case 'article':
          return structuredDataGenerator.generateArticleSchema({
            title: seoConfig.title,
            excerpt: seoConfig.description,
            publishedAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          });
        case 'service':
          return structuredDataGenerator.generateServiceSchema({
            name: seoConfig.title,
            description: seoConfig.description,
            category: 'Beauty & Fitness'
          });
        case 'product':
          return structuredDataGenerator.generateProductSchema({
            name: seoConfig.title,
            description: seoConfig.description,
            price: 0,
            inStock: true
          });
        case 'event':
          return structuredDataGenerator.generateEventSchema({
            name: seoConfig.title,
            description: seoConfig.description,
            startDate: new Date().toISOString(),
            endDate: new Date().toISOString(),
            price: 0
          });
        default:
          return structuredDataGenerator.generateBreadcrumbSchema;
      }
    }

    // Default to breadcrumb schema
    return structuredDataGenerator.generateBreadcrumbSchema;
  }, [seoConfig, customStructuredData, structuredDataGenerator]) || undefined;

  const additionalMeta = useMemo(() => {
    const meta: Array<{ name: string; content: string }> = [];

    // Add language meta
    meta.push({ name: 'language', content: t('seo.language', 'en') });

    // Add geolocation meta for local SEO
    if (seoConfig?.structuredDataType === 'localBusiness') {
      meta.push({ name: 'geo.region', content: 'PL-MZ' });
      meta.push({ name: 'geo.placename', content: 'Warsaw' });
      meta.push({ name: 'geo.position', content: '52.2297;21.0122' });
      meta.push({ name: 'ICBM', content: '52.2297,21.0122' });
    }

    // Add author meta
    meta.push({ name: 'author', content: 'mariiaborysevych' });

    // Add theme-color for mobile browsers
    meta.push({ name: 'theme-color', content: '#8B4513' });

    return meta;
  }, [seoConfig, t]);

  return (
    <>
      <SEOHead
        title={seoConfig?.title || fallbackTitle}
        description={seoConfig?.description || fallbackDescription}
        keywords={seoConfig?.keywords}
        ogImage={seoConfig?.ogImage || fallbackImage}
        ogType={seoConfig?.ogType}
        noindex={noindex}
        additionalMeta={additionalMeta}
        structuredData={structuredData}
      />
      {children}
    </>
  );
};