import React, { useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import { useTranslation } from "react-i18next";

interface SEOProps {
  title?: string;
  description?: string;
  keywords?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  canonical?: string;
  structuredData?: object;
  howToSchema?: object;
  videoSchema?: object;
  eventSchema?: object;
  faqSchema?: object;
  breadcrumbSchema?: object;
  articleSchema?: object;
}

export const SEO = ({
  title,
  description,
  keywords,
  ogTitle,
  ogDescription,
  ogImage = "https://lckxvimdqnfjzkbrusgu.supabase.co/storage/v1/object/public/service-images/og-default.jpg",
  canonical,
  structuredData,
  howToSchema,
  videoSchema,
  eventSchema,
  faqSchema,
  breadcrumbSchema,
  articleSchema
}: SEOProps) => {
  const { i18n, t } = useTranslation();
  const currentLang = i18n.language;
  const supported = i18n.options?.supportedLngs as string[] | undefined;
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
  const pathname = typeof window !== 'undefined' ? window.location.pathname : '';

  // Enhanced Polish SEO with regional keywords
  const getLocalizedDefaults = () => {
    switch (currentLang) {
      case 'pl':
        return {
          title: "Mariia Borysevych — Makijaż Permanentny i Trening Personalny Warszawa",
          description: "Profesjonalne usługi beauty w Warszawie. Makijaż permanentny ust, brwi, eyeliner. Trening personalny Zdrofit. Rezerwacja online. BM BEAUTY studio.",
          keywords: "makijaż permanentny Warszawa, PMU Warszawa, stylizacja brwi Warszawa, trening personalny Warszawa, Zdrofit Warszawa, makijaż permanentny ust, kosmetyka Warszawa, fitness Warszawa, studio urody Warszawa, makijaż permanentny brwi, eyeliner Warszawa, laminacja brwi Warszawa"
        };
      default:
        return {
          title: "Mariia Borysevych — Beauty & Fitness in Warsaw",
          description: "BM BEAUTY studio + evidence-aligned coaching. Book in 60s. EN/PL/UA.",
          keywords: "permanent makeup Warsaw, PMU Warsaw, beauty salon Warsaw, personal trainer Warsaw, fitness Warsaw, lip blush Warsaw, eyebrow microblading Warsaw, eyeliner tattoo Warsaw"
        };
    }
  };

  const defaults = getLocalizedDefaults();
  const finalTitle = title || defaults.title;
  const finalDescription = description || defaults.description;
  const finalKeywords = keywords || defaults.keywords;

  return (
    <Helmet>
      {/* Primary Meta Tags */}
      <title>{finalTitle}</title>
      <meta name="title" content={finalTitle} />
      <meta name="description" content={finalDescription} />
      <meta name="keywords" content={finalKeywords} />
      <meta name="language" content={currentLang} />
      <link rel="canonical" href={canonical || `${baseUrl}${pathname}`} />

      {/* Enhanced Polish SEO Meta Tags */}
      {currentLang === 'pl' && (
        <>
          <meta name="geo.position" content="52.2297;21.0122" />
          <meta name="geo.placename" content="Warszawa, Polska" />
          <meta name="geo.region" content="PL-MZ" />
          <meta name="ICBM" content="52.2297, 21.0122" />
          <meta name="author" content="Mariia Borysevych" />
          <meta name="robots" content="index, follow, max-image-preview:large" />
          {/* Advanced Polish SEO Meta Tags */}
          <meta name="page-type" content="business.local" />
          <meta name="target-country" content="Poland" />
          <meta name="target-city" content="Warszawa" />
          <meta name="target-district" content="Śródmieście" />
          <meta name="business-category" content="beauty,fitness,permanent-makeup,personal-training" />
          <meta name="service-area" content="Warszawa,Mazowieckie" />
          <meta name="content-language" content="pl-PL" />
          <meta name="audience" content="women,professionals,beauty-conscious" />
          <meta name="rating" content="general" />
          <meta name="distribution" content="global" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <meta name="theme-color" content="#8B4513" />
          <meta name="msapplication-TileColor" content="#8B4513" />
          <meta name="apple-mobile-web-app-capable" content="yes" />
          <meta name="apple-mobile-web-app-status-bar-style" content="default" />
          <meta name="apple-mobile-web-app-title" content="Mariia Beauty" />
          <meta name="application-name" content="Mariia Beauty & Fitness" />
          {/* Voice Search Optimization */}
          <meta name="voice-search-optimization" content="makijaż permanentny Warszawa,trening personalny Warszawa" />
          <meta name="natural-language" content="pl" />
          <meta name="question" content="Gdzie zrobić makijaż permanentny w Warszawie?" />
          <meta name="answer" content="Profesjonalny makijaż permanentny w studio BM Beauty w Śródmieściu" />
          {/* Local Business Enhancement */}
          <meta name="business-name" content="BM BEAUTY STUDIO" />
          <meta name="business-address" content="Smolna 8/254, Warszawa, 00-375" />
          <meta name="business-phone" content="+48536200573" />
          <meta name="business-hours" content="Pon-Pt 9:00-19:00, Sob 10:00-16:00" />
          <meta name="price-range" content="$$$" />
          <meta name="payment-methods" content="gotówka,karta,przelew" />
          {/* Performance & SEO Enhancement */}
          <meta name="loading" content="eager" />
          <meta name="critical-css" content="inline" />
          <meta name="preload" content="fonts,images" />
          <meta name="cache-control" content="max-age=31536000" />
          <meta name="expires" content="31536000" />
        </>
      )}

      {/* Core Web Vitals Enhancement */}
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link rel="dns-prefetch" href="//lckxvimdqnfjzkbrusgu.supabase.co" />
      <link rel="dns-prefetch" href="//booksy.com" />
      <link rel="dns-prefetch" href="//instagram.com" />
      <link rel="dns-prefetch" href="//facebook.com" />

      {/* Resource Hints for Performance */}
      <link rel="preload" href="/fonts/inter-var.woff2" as="font" type="font/woff2" crossOrigin="anonymous" />
      <link rel="preload" href="/fonts/space-grotesk-var.woff2" as="font" type="font/woff2" crossOrigin="anonymous" />
      <link rel="preload" href={ogImage} as="image" />

      {/* Progressive Web App Enhancement */}
      <link rel="manifest" href="/manifest.json" />
      <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
      <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
      <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
      <link rel="mask-icon" href="/safari-pinned-tab.svg" color="#8B4513" />

      {/* Security Headers */}
      <meta httpEquiv="X-Content-Type-Options" content="nosniff" />
      <meta httpEquiv="X-Frame-Options" content="DENY" />
      <meta httpEquiv="X-XSS-Protection" content="1; mode=block" />
      <meta httpEquiv="Referrer-Policy" content="strict-origin-when-cross-origin" />

      {/* Open Graph / Facebook */}
      <meta property="og:type" content="website" />
      <meta property="og:url" content={`${baseUrl}${pathname}`} />
      <meta property="og:title" content={ogTitle || finalTitle} />
      <meta property="og:description" content={ogDescription || finalDescription} />
      <meta property="og:image" content={ogImage} />
      <meta property="og:locale" content={currentLang === 'pl' ? 'pl_PL' : currentLang === 'ua' ? 'uk_UA' : 'en_US'} />

      {/* Twitter */}
      <meta property="twitter:card" content="summary_large_image" />
      <meta property="twitter:url" content={`${baseUrl}${pathname}`} />

      {/* Hreflang alternates for supported locales */}
      {supported && supported.filter(l => l && l !== 'cimode').map((lng) => (
        <link
          key={lng}
          rel="alternate"
          hrefLang={lng}
          href={`${baseUrl}${lng === 'en' ? '' : `/${lng}`}${pathname}`.replace(/\/+$/, '') || baseUrl}
        />
      ))}
      {/* x-default canonical */}
      <link rel="alternate" hrefLang="x-default" href={`${baseUrl}${pathname}`} />
      <meta property="twitter:title" content={ogTitle || finalTitle} />
      <meta property="twitter:description" content={ogDescription || finalDescription} />
      <meta property="twitter:image" content={ogImage} />

      {/* Enhanced Open Graph Tags */}
      <meta property="og:type" content="website" />
      <meta property="og:url" content={`${baseUrl}${pathname}`} />
      <meta property="og:title" content={ogTitle || finalTitle} />
      <meta property="og:description" content={ogDescription || finalDescription} />
      <meta property="og:image" content={ogImage} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:image:alt" content={currentLang === 'pl' ? 'BM BEAUTY STUDIO - Makijaż Permanentny Warszawa' : 'BM BEAUTY STUDIO - Permanent Makeup Warsaw'} />
      <meta property="og:locale" content={currentLang === 'pl' ? 'pl_PL' : currentLang === 'ua' ? 'uk_UA' : 'en_US'} />
      <meta property="og:site_name" content="Mariia Beauty & Fitness" />
      <meta property="og:availability" content="available" />
      <meta property="og:contact_info:street_address" content="Smolna 8/254" />
      <meta property="og:contact_info:locality" content="Warszawa" />
      <meta property="og:contact_info:region" content="Mazowieckie" />
      <meta property="og:contact_info:postal_code" content="00-375" />
      <meta property="og:contact_info:country_name" content="Poland" />
      <meta property="og:contact_info:phone_number" content="+48536200573" />
      <meta property="og:contact_info:website" content="https://mariaborysevych.com" />

      {/* Twitter Enhanced Tags */}
      <meta property="twitter:card" content="summary_large_image" />
      <meta property="twitter:url" content={`${baseUrl}${pathname}`} />
      <meta property="twitter:title" content={ogTitle || finalTitle} />
      <meta property="twitter:description" content={ogDescription || finalDescription} />
      <meta property="twitter:image" content={ogImage} />
      <meta property="twitter:image:alt" content={currentLang === 'pl' ? 'BM BEAUTY STUDIO - Makijaż Permanentny Warszawa' : 'BM BEAUTY STUDIO - Permanent Makeup Warsaw'} />
      <meta property="twitter:creator" content="@mariiaborysevych" />
      <meta property="twitter:site" content="@mariiaborysevych" />
      <meta property="twitter:domain" content="mariaborysevych.com" />

      {/* Pinterest Enhanced Tags */}
      <meta property="pinterest-rich-pin" content="true" />
      <meta property="pinterest-rich-pin-type" content="article" />
      <meta property="pinterest-rich-pin-price" content="PLN 1500-2500" />
      <meta property="pinterest-rich-pin-availability" content="available" />

      {/* Additional Meta Tags */}
      <meta name="google-site-verification" content="your-google-verification-code" />
      <meta name="facebook-domain-verification" content="your-facebook-verification-code" />
      <meta name="pinterest-site-verification" content="your-pinterest-verification-code" />
      <meta name="yandex-verification" content="your-yandex-verification-code" />

      {/* Advanced Structured Data */}
      {structuredData && (
        <script type="application/ld+json">
          {JSON.stringify(structuredData)}
        </script>
      )}
      {howToSchema && (
        <script type="application/ld+json">
          {JSON.stringify(howToSchema)}
        </script>
      )}
      {videoSchema && (
        <script type="application/ld+json">
          {JSON.stringify(videoSchema)}
        </script>
      )}
      {eventSchema && (
        <script type="application/ld+json">
          {JSON.stringify(eventSchema)}
        </script>
      )}
      {faqSchema && (
        <script type="application/ld+json">
          {JSON.stringify(faqSchema)}
        </script>
      )}
      {breadcrumbSchema && (
        <script type="application/ld+json">
          {JSON.stringify(breadcrumbSchema)}
        </script>
      )}
      {articleSchema && (
        <script type="application/ld+json">
          {JSON.stringify(articleSchema)}
        </script>
      )}
    </Helmet>
  );
};

// Helper function to generate enhanced LocalBusiness structured data for Polish SEO
export const generateLocalBusinessSchema = (currentLang: string = 'pl') => {
  const baseSchema = {
    "@context": "https://schema.org",
    "@type": ["LocalBusiness", "BeautySalon", "HealthAndBeautyBusiness"],
    "name": currentLang === 'pl' ? "BM BEAUTY STUDIO - Makijaż Permanentny Warszawa" : "BM BEAUTY STUDIO",
    "alternateName": currentLang === 'pl' ? "Mariia Borysevych - PMU Warszawa" : "Mariia Borysevych",
    "description": currentLang === 'pl'
      ? "Profesjonalne studio makijażu permanentnego w Warszawie. Makijaż permanentny ust, brwi, eyeliner. Stylizacja brwi i rzęs."
      : "Professional permanent makeup studio in Warsaw. Lip blush, eyebrows, eyeliner. Brow and lash styling.",
    "image": [
      "https://lckxvimdqnfjzkbrusgu.supabase.co/storage/v1/object/public/service-images/studio.jpg",
      "https://lckxvimdqnfjzkbrusgu.supabase.co/storage/v1/object/public/service-images/og-default.jpg"
    ],
    "address": {
      "@type": "PostalAddress",
      "streetAddress": "Smolna 8/254",
      "addressLocality": "Warszawa",
      "addressRegion": currentLang === 'pl' ? "Mazowieckie" : "Masovian Voivodeship",
      "postalCode": "00-375",
      "addressCountry": "PL"
    },
    "geo": {
      "@type": "GeoCoordinates",
      "latitude": 52.2297,
      "longitude": 21.0122
    },
    "telephone": "+48536200573",
    "priceRange": "$$$",
    "paymentAccepted": ["cash", "credit card", "debit card"],
    "currenciesAccepted": "PLN",
    "openingHoursSpecification": [
      {
        "@type": "OpeningHoursSpecification",
        "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
        "opens": "07:00",
        "closes": "22:00"
      },
      {
        "@type": "OpeningHoursSpecification",
        "dayOfWeek": ["Saturday", "Sunday"],
        "opens": "09:00",
        "closes": "20:00"
      }
    ],
    "areaServed": {
      "@type": "City",
      "name": currentLang === 'pl' ? "Warszawa" : "Warsaw",
      "addressCountry": "PL"
    },
    "hasOfferCatalog": {
      "@type": "OfferCatalog",
      "name": currentLang === 'pl' ? "Usługi Kosmetyczne" : "Beauty Services",
      "itemListElement": [
        {
          "@type": "Offer",
          "itemOffered": {
            "@type": "Service",
            "name": currentLang === 'pl' ? "Makijaż Permanentny Ust" : "Lip Blush Permanent Makeup",
            "category": currentLang === 'pl' ? "Makijaż Permanentny" : "Permanent Makeup"
          }
        },
        {
          "@type": "Offer",
          "itemOffered": {
            "@type": "Service",
            "name": currentLang === 'pl' ? "Makijaż Permanentny Brwi" : "Eyebrow Permanent Makeup",
            "category": currentLang === 'pl' ? "Makijaż Permanentny" : "Permanent Makeup"
          }
        }
      ]
    }
  };

  // Add Polish-specific schema data
  if (currentLang === 'pl') {
    return {
      ...baseSchema,
      "sameAs": [
        "https://booksy.com/pl/pl/102735832_b-m-beauty-studio_studio-kosmetyczne_105984_warszawa",
        "https://www.instagram.com/mariiaborysevych/",
        "https://www.facebook.com/BMBeautyStudioWarsaw"
      ],
      "knowsLanguage": ["pl", "en", "ua"],
      "makesOffer": [
        {
          "@type": "Offer",
          "itemOffered": {
            "@type": "Service",
            "name": "Makijaż permanentny Warszawa",
            "description": "Profesjonalny makijaż permanentny ust, brwi i eyeliner w Warszawie",
            "provider": { "@type": "LocalBusiness", "name": "BM BEAUTY STUDIO" }
          },
          "availableAtOrFrom": { "@type": "Place", "address": baseSchema.address }
        }
      ]
    };
  }

  return baseSchema;
};

// Helper function to generate HowTo schema for beauty procedures
export const generateHowToSchema = (procedure: {
  name: string;
  description: string;
  steps: Array<{ name: string; text: string; image?: string }>;
  estimatedTime: string;
  supplies?: Array<{ name: string; image?: string }>;
}, currentLang: string = 'pl') => ({
  "@context": "https://schema.org",
  "@type": "HowTo",
  "name": procedure.name,
  "description": procedure.description,
  "image": procedure.steps[0]?.image || "https://lckxvimdqnfjzkbrusgu.supabase.co/storage/v1/object/public/service-images/howto-default.jpg",
  "totalTime": procedure.estimatedTime,
  "supply": procedure.supplies?.map(supply => ({
    "@type": "HowToSupply",
    "name": supply.name,
    "image": supply.image
  })) || [],
  "tool": procedure.supplies?.map(supply => ({
    "@type": "HowToTool",
    "name": supply.name,
    "image": supply.image
  })) || [],
  "step": procedure.steps.map((step, index) => ({
    "@type": "HowToStep",
    "position": index + 1,
    "name": step.name,
    "text": step.text,
    "image": step.image,
    "url": typeof window !== 'undefined' ? `${window.location.href}#step-${index + 1}` : ""
  }))
});

// Helper function to generate Video schema for tutorials
export const generateVideoSchema = (video: {
  name: string;
  description: string;
  thumbnailUrl: string;
  contentUrl: string;
  duration: string;
  uploadDate: string;
}) => ({
  "@context": "https://schema.org",
  "@type": "VideoObject",
  "name": video.name,
  "description": video.description,
  "thumbnailUrl": video.thumbnailUrl,
  "contentUrl": video.contentUrl,
  "embedUrl": video.contentUrl,
  "uploadDate": video.uploadDate,
  "duration": video.duration,
  "width": 1920,
  "height": 1080,
  "isFamilyFriendly": true,
  "regionsAllowed": ["PL", "US", "GB", "DE", "FR"],
  "requiresSubscription": false,
  "accessibilityFeature": ["signed", "captions"],
  "accessibilityHazard": "none"
});

// Helper function to generate Event schema for workshops
export const generateEventSchema = (event: {
  name: string;
  description: string;
  startDate: string;
  endDate: string;
  location: {
    name: string;
    address: string;
  };
  offers?: {
    price: string;
    currency: string;
    availability: string;
  };
}) => ({
  "@context": "https://schema.org",
  "@type": "Event",
  "name": event.name,
  "description": event.description,
  "startDate": event.startDate,
  "endDate": event.endDate,
  "eventStatus": "https://schema.org/EventScheduled",
  "eventAttendanceMode": "https://schema.org/OfflineEventAttendanceMode",
  "location": {
    "@type": "Place",
    "name": event.location.name,
    "address": {
      "@type": "PostalAddress",
      "streetAddress": "Smolna 8/254",
      "addressLocality": "Warszawa",
      "addressRegion": "Mazowieckie",
      "postalCode": "00-375",
      "addressCountry": "PL"
    }
  },
  "organizer": {
    "@type": "Organization",
    "name": "BM BEAUTY STUDIO",
    "url": "https://mariaborysevych.com"
  },
  "offers": event.offers ? {
    "@type": "Offer",
    "price": event.offers.price,
    "priceCurrency": event.offers.currency,
    "availability": event.offers.availability,
    "validFrom": event.startDate,
    "url": "https://mariaborysevych.com/book"
  } : undefined
});

// Helper function to generate FAQ schema
export const generateFAQSchema = (faqs: Array<{ question: string; answer: string }>) => ({
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": faqs.map(faq => ({
    "@type": "Question",
    "name": faq.question,
    "acceptedAnswer": {
      "@type": "Answer",
      "text": faq.answer
    }
  }))
});

// Helper function to generate Breadcrumb schema
export const generateBreadcrumbSchema = (breadcrumbs: Array<{ name: string; url: string }>) => ({
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": breadcrumbs.map((breadcrumb, index) => ({
    "@type": "ListItem",
    "position": index + 1,
    "name": breadcrumb.name,
    "item": breadcrumb.url
  }))
});

// Helper function to generate Article schema
export const generateArticleSchema = (article: {
  headline: string;
  description: string;
  author: string;
  datePublished: string;
  dateModified?: string;
  image?: string;
}) => ({
  "@context": "https://schema.org",
  "@type": "Article",
  "headline": article.headline,
  "description": article.description,
  "author": {
    "@type": "Person",
    "name": article.author,
    "url": "https://mariaborysevych.com/o-mnie"
  },
  "publisher": {
    "@type": "Organization",
    "name": "BM BEAUTY STUDIO",
    "logo": {
      "@type": "ImageObject",
      "url": "https://lckxvimdqnfjzkbrusgu.supabase.co/storage/v1/object/public/service-images/logo.png",
      "width": 512,
      "height": 512
    }
  },
  "datePublished": article.datePublished,
  "dateModified": article.dateModified || article.datePublished,
  "mainEntityOfPage": {
    "@type": "WebPage",
    "@id": typeof window !== 'undefined' ? window.location.href : ""
  },
  "image": article.image || "https://lckxvimdqnfjzkbrusgu.supabase.co/storage/v1/object/public/service-images/article-default.jpg",
  "articleSection": "Beauty & Fitness",
  "wordCount": 800,
  "inLanguage": "pl-PL"
});

// Helper function to generate enhanced Person structured data for Polish SEO
export const generatePersonSchema = (currentLang: string = 'pl') => ({
  "@context": "https://schema.org",
  "@type": ["Person", "ProfessionalService"],
  "name": "Mariia Borysevych",
  "alternateName": currentLang === 'pl' ? "Mariia Borysevych - PMU Warszawa" : "Mariia Borysevych",
  "jobTitle": currentLang === 'pl'
    ? "Artystka Makijażu Permanentnego i Trenerka Personalna Warszawa"
    : "Permanent Makeup Artist and Personal Trainer Warsaw",
  "description": currentLang === 'pl'
    ? "Profesjonalna artystka makijażu permanentnego i certyfikowana trenerka personalna w Warszawie. Specjalizacja w makijażu permanentnym ust, brwi i eyelineru. Treningi personalne w Zdrofit."
    : "Professional permanent makeup artist and certified personal trainer in Warsaw. Specializing in lip blush, eyebrows, and eyeliner permanent makeup. Personal training at Zdrofit.",
  "url": typeof window !== 'undefined' ? window.location.origin : '',
  "sameAs": [
    "https://zdrofit.pl/kadra/mariia-borysevych",
    "https://booksy.com/pl/pl/102735832_b-m-beauty-studio_studio-kosmetyczne_105984_warszawa",
    "https://www.instagram.com/mariiaborysevych/",
    "https://www.facebook.com/BMBeautyStudioWarsaw"
  ],
  "worksFor": [
    {
      "@type": "Organization",
      "name": "BM BEAUTY STUDIO",
      "address": {
        "@type": "PostalAddress",
        "streetAddress": "Smolna 8/254",
        "addressLocality": "Warszawa",
        "postalCode": "00-375",
        "addressCountry": "PL"
      }
    },
    {
      "@type": "Organization",
      "name": "Zdrofit",
      "address": {
        "@type": "PostalAddress",
        "addressLocality": "Warszawa",
        "addressCountry": "PL"
      }
    }
  ],
  "knowsLanguage": ["pl", "en", "ua"],
  "offers": [
    {
      "@type": "Offer",
      "itemOffered": {
        "@type": "Service",
        "name": currentLang === 'pl' ? "Makijaż Permanentny Warszawa" : "Permanent Makeup Warsaw",
        "description": currentLang === 'pl'
          ? "Profesjonalny makijaż permanentny w Warszawie"
          : "Professional permanent makeup in Warsaw"
      }
    },
    {
      "@type": "Offer",
      "itemOffered": {
        "@type": "Service",
        "name": currentLang === 'pl' ? "Trening Personalny Warszawa" : "Personal Training Warsaw",
        "description": currentLang === 'pl'
          ? "Certyfikowane treningi personalne w Warszawie"
          : "Certified personal training in Warsaw"
      }
    }
  ]
});

// Helper function to generate Service structured data
export const generateServiceSchema = (service: {
  name: string;
  description: string;
  price: string;
  duration: string;
}) => ({
  "@context": "https://schema.org",
  "@type": "Service",
  "serviceType": service.name,
  "description": service.description,
  "provider": {
    "@type": "LocalBusiness",
    "name": "BM BEAUTY STUDIO"
  },
  "offers": {
    "@type": "Offer",
    "price": service.price,
    "priceCurrency": "PLN"
  },
  "duration": service.duration
});
