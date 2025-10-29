import React from 'react';
import { Helmet } from 'react-helmet-async';
import { useLocation, useMatch } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { env } from '@/lib/env';

interface SEOMetaProps {
  title?: string;
  description?: string;
  keywords?: string[];
  image?: string;
  url?: string;
  type?: 'website' | 'article' | 'product' | 'booking' | 'service';
  siteName?: string;
  locale?: string;
  alternateLanguages?: Record<string, string>;
  canonical?: string;
  noindex?: boolean;
  nofollow?: boolean;
  robots?: string;
  author?: string;
  publishedTime?: string;
  modifiedTime?: string;
  expirationTime?: string;
  category?: string;
  tags?: string[];
  price?: string;
  priceCurrency?: string;
  availability?: string;
  rating?: number;
  reviewCount?: number;
  jsonLd?: Record<string, any>;
  additionalMeta?: Record<string, string>;
  additionalLink?: Array<React.LinkHTMLAttributes<HTMLLinkElement>>;
}

export function SEOMeta({
  title,
  description,
  keywords = [],
  image,
  url,
  type = 'website',
  siteName = env.VITE_APP_NAME,
  locale,
  alternateLanguages,
  canonical,
  noindex = false,
  nofollow = false,
  robots,
  author,
  publishedTime,
  modifiedTime,
  expirationTime,
  category,
  tags = [],
  price,
  priceCurrency,
  availability,
  rating,
  reviewCount,
  jsonLd,
  additionalMeta = {},
  additionalLink = [],
}: SEOMetaProps) {
  const location = useLocation();
  const { i18n } = useTranslation();
  const match = useMatch('/:lang/*');

  // Default values
  const currentUrl = url || `${env.VITE_APP_URL}${location.pathname}${location.search}`;
  const currentLocale = locale || i18n.language || 'en';
  const defaultImage = image || `${env.VITE_APP_URL}/logo.png`;

  // Generate robots content
  const robotsContent = robots || (noindex ? 'noindex' : 'index') + (nofollow ? ',nofollow' : ',follow');

  // Generate alternate language links
  const alternateLinks = Object.entries(alternateLanguages || {}).map(([lang, langUrl]) => ({
    rel: 'alternate',
    hrefLang: lang,
    href: langUrl,
  }));

  // Generate title with site name
  const fullTitle = title ? `${title} | ${siteName}` : siteName;
  const titleWithLocale = title ? `${title} | ${siteName}` : siteName;

  // Generate JSON-LD structured data
  const generateJSONLD = () => {
    const baseData = {
      '@context': 'https://schema.org',
      '@type': type === 'product' ? 'Product' : type === 'service' ? 'Service' : 'WebPage',
      name: title,
      description: description,
      url: currentUrl,
      image: defaultImage,
      inLanguage: currentLocale,
      dateModified: modifiedTime,
      datePublished: publishedTime,
      author: {
        '@type': 'Organization',
        name: siteName,
        url: env.VITE_APP_URL,
      },
      publisher: {
        '@type': 'Organization',
        name: siteName,
        url: env.VITE_APP_URL,
        logo: {
          '@type': 'ImageObject',
          url: `${env.VITE_APP_URL}/logo.png`,
          width: 512,
          height: 512,
        },
      },
    };

    // Add specific data based on type
    if (type === 'product' || type === 'service') {
      return {
        ...baseData,
        '@type': 'Service',
        provider: {
          '@type': 'Organization',
          name: siteName,
        },
        ...(price && {
          offers: {
            '@type': 'Offer',
            price: price,
            priceCurrency: priceCurrency || 'PLN',
            availability: availability || 'https://schema.org/InStock',
          },
        }),
        ...(rating && {
          aggregateRating: {
            '@type': 'AggregateRating',
            ratingValue: rating,
            reviewCount: reviewCount || 0,
            bestRating: 5,
            worstRating: 1,
          },
        }),
      };
    }

    if (type === 'article') {
      return {
        ...baseData,
        '@type': 'Article',
        headline: title,
        articleSection: category,
        keywords: keywords.join(', '),
        ...(tags.length > 0 && {
          about: tags.map(tag => ({ '@type': 'Thing', name: tag })),
        }),
      };
    }

    if (type === 'booking') {
      return {
        ...baseData,
        '@type': 'Reservation',
        reservationStatus: availability || 'https://schema.org/Confirmed',
        ...(price && {
          totalPaymentDue: {
            '@type': 'PriceSpecification',
            price: price,
            priceCurrency: priceCurrency || 'PLN',
          },
        }),
      };
    }

    return baseData;
  };

  const structuredData = jsonLd || generateJSONLD();

  return (
    <Helmet>
      {/* Basic Meta Tags */}
      <title>{fullTitle}</title>
      <meta name="description" content={description || ''} />
      <meta name="keywords" content={keywords.join(', ')} />
      <meta name="author" content={author || siteName} />
      <meta name="robots" content={robotsContent} />

      {/* Open Graph / Facebook */}
      <meta property="og:type" content={type} />
      <meta property="og:site_name" content={siteName} />
      <meta property="og:title" content={titleWithLocale} />
      <meta property="og:description" content={description || ''} />
      <meta property="og:url" content={currentUrl} />
      <meta property="og:image" content={defaultImage} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:image:alt" content={`${siteName} logo`} />
      <meta property="og:locale" content={currentLocale} />

      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:site" content={`@${siteName.toLowerCase().replace(/\s+/g, '')}`} />
      <meta name="twitter:title" content={titleWithLocale} />
      <meta name="twitter:description" content={description || ''} />
      <meta name="twitter:image" content={defaultImage} />
      <meta name="twitter:image:alt" content={`${siteName} logo`} />

      {/* Canonical URL */}
      {canonical && <link rel="canonical" href={canonical} />}
      {!canonical && <link rel="canonical" href={currentUrl} />}

      {/* Language Alternates */}
      {alternateLinks.map((props, index) => (
        <link key={index} {...props} />
      ))}

      {/* Additional Links */}
      {additionalLink.map((props, index) => (
        <link key={index} {...props} />
      ))}

      {/* Additional Meta Tags */}
      {Object.entries(additionalMeta).map(([name, content], index) => (
        <meta key={index} name={name} content={content} />
      ))}

      {/* Product/Service Specific Meta */}
      {price && (
        <>
          <meta property="product:price:amount" content={price} />
          <meta property="product:price:currency" content={priceCurrency || 'PLN'} />
          <meta property="og:price:amount" content={price} />
          <meta property="og:price:currency" content={priceCurrency || 'PLN'} />
        </>
      )}

      {availability && (
        <>
          <meta property="product:availability" content={availability} />
          <meta property="og:availability" content={availability} />
        </>
      )}

      {category && (
        <>
          <meta property="article:section" content={category} />
          <meta name="category" content={category} />
        </>
      )}

      {tags.map((tag, index) => (
        <meta key={index} property="article:tag" content={tag} />
      ))}

      {/* Date Meta */}
      {publishedTime && (
        <meta property="article:published_time" content={publishedTime} />
      )}
      {modifiedTime && (
        <meta property="article:modified_time" content={modifiedTime} />
        <meta name="revised" content={modifiedTime} />
      )}
      {expirationTime && <meta name="expires" content={expirationTime} />}

      {/* Rating Meta */}
      {rating && (
        <>
          <meta property="og:rating" content={rating.toString()} />
          <meta name="rating" content={rating.toString()} />
          <meta name="rating:value" content={rating.toString()} />
          <meta name="rating:scale" content="5" />
          {reviewCount && <meta name="rating:count" content={reviewCount.toString()} />}
        </>
      )}

      {/* Location Meta */}
      <meta name="geo.region" content="PL" />
      <meta name="geo.placename" content="Warsaw" />
      <meta name="ICBM" content="Warsaw, Poland" />

      {/* Content Type Meta */}
      <meta httpEquiv="Content-Type" content="text/html; charset=UTF-8" />
      <meta name="format-detection" content="telephone=no" />
      <meta name="format-detection" content="date=no" />
      <meta name="format-detection" content="address=no" />
      <meta name="format-detection" content="email=no" />

      {/* Theme Color */}
      <meta name="theme-color" content="#8B4513" />
      <meta name="msapplication-TileColor" content="#8B4513" />
      <meta name="msapplication-navbutton-color" content="#8B4513" />

      {/* Apple Touch Icon */}
      <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
      <link rel="apple-touch-icon" sizes="152x152" href="/apple-touch-icon-152.png" />
      <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon-180.png" />
      <link rel="apple-touch-icon" sizes="167x167" href="/apple-touch-icon-167.png" />
      <link rel="apple-touch-icon" sizes="120x120" href="/apple-touch-icon-120.png" />

      {/* Favicons */}
      <link rel="icon" type="image/x-icon" href="/favicon.ico" />
      <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16.png" />
      <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32.png" />
      <link rel="icon" type="image/png" sizes="96x96" href="/favicon-96.png" />
      <link rel="icon" type="image/png" sizes="192x192" href="/favicon-192.png" />

      {/* Manifest */}
      <link rel="manifest" href="/manifest.json" />

      {/* Structured Data */}
      <script type="application/ld+json">
        {JSON.stringify(structuredData)}
      </script>

      {/* Preconnect to external domains */}
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" />
      <link rel="preconnect" href="https://www.googletagmanager.com" />
      <link rel="preconnect" href="https://www.google-analytics.com" />
      <link rel="preconnect" href="https://connect.facebook.net" />
    </Helmet>
  );
}

// Hook for using SEO meta
export function useSEOMeta(props: Omit<SEOMetaProps, 'jsonLd'> & { jsonLd?: Record<string, any> }) {
  const location = useLocation();
  const { i18n } = useTranslation();

  return {
    ...props,
    url: props.url || `${env.VITE_APP_URL}${location.pathname}${location.search}`,
    locale: props.locale || i18n.language,
  };
}

// Default SEO configurations for different page types
export const defaultSEO = {
  home: {
    title: 'Professional Beauty & Fitness Services in Warsaw',
    description: 'Discover premium beauty treatments and fitness programs at Mariia Hub. Book appointments online and transform your well-being.',
    keywords: ['beauty', 'fitness', 'warsaw', 'booking', 'wellness', 'spa', 'gym', 'personal training', 'cosmetics'],
    type: 'website' as const,
  },

  beauty: {
    title: 'Beauty Services - Premium Treatments in Warsaw',
    description: 'Experience luxury beauty services including lip enhancements, brow lamination, PMU, and more at Mariia Hub Warsaw.',
    keywords: ['beauty', 'cosmetics', 'lip blush', 'brow lamination', 'PMU', 'warsaw beauty salon', 'permanent makeup'],
    type: 'website' as const,
    category: 'Beauty',
  },

  fitness: {
    title: 'Fitness Programs - Personal Training in Warsaw',
    description: 'Achieve your fitness goals with personalized training programs at Mariia Hub. Expert trainers and modern equipment.',
    keywords: ['fitness', 'gym', 'personal training', 'warsaw gym', 'fitness classes', 'wellness', 'training'],
    type: 'website' as const,
    category: 'Fitness',
  },

  booking: {
    title: 'Book Your Appointment - Mariia Hub',
    description: 'Book your beauty or fitness appointment online at Mariia Hub Warsaw. Easy booking, instant confirmation.',
    keywords: ['booking', 'appointment', 'reservation', 'online booking', 'warsaw'],
    type: 'booking' as const,
  },

  blog: {
    title: 'Beauty & Fitness Blog - Mariia Hub',
    description: 'Read our latest articles about beauty tips, fitness advice, and wellness trends from Mariia Hub experts.',
    keywords: ['blog', 'beauty tips', 'fitness advice', 'wellness', 'tutorials'],
    type: 'article' as const,
  },

  service: {
    title: 'Beauty & Fitness Services',
    description: 'Explore our comprehensive range of beauty and fitness services tailored to your needs.',
    keywords: ['services', 'treatments', 'programs', 'warsaw'],
    type: 'service' as const,
  },
};

// Helper component for page-specific SEO
export function PageSEOMeta({ page, ...props }: { page: keyof typeof defaultSEO } & Partial<SEOMetaProps>) {
  const seoConfig = defaultSEO[page];

  return (
    <SEOMeta
      {...seoConfig}
      {...props}
      title={props.title || seoConfig.title}
      description={props.description || seoConfig.description}
      keywords={[...seoConfig.keywords, ...(props.keywords || [])]}
    />
  );
}