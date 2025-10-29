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
}

export const SEO = ({
  title,
  description,
  keywords,
  ogTitle,
  ogDescription,
  ogImage = "https://lckxvimdqnfjzkbrusgu.supabase.co/storage/v1/object/public/service-images/og-default.jpg",
  canonical,
  structuredData
}: SEOProps) => {
  const { i18n } = useTranslation();
  const currentLang = i18n.language;
  const supported = i18n.options?.supportedLngs as string[] | undefined;
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
  const pathname = typeof window !== 'undefined' ? window.location.pathname : '';

  const defaultTitle = "Mariia Borysevych — Beauty & Fitness in Warsaw";
  const defaultDescription = "BM BEAUTY studio + evidence-aligned coaching. Book in 60s. EN/PL/UA.";
  
  const finalTitle = title || defaultTitle;
  const finalDescription = description || defaultDescription;

  return (
    <Helmet>
      {/* Primary Meta Tags */}
      <title>{finalTitle}</title>
      <meta name="title" content={finalTitle} />
      <meta name="description" content={finalDescription} />
      {keywords && <meta name="keywords" content={keywords} />}
      <meta name="language" content={currentLang} />
      <link rel="canonical" href={canonical || `${baseUrl}${pathname}`} />

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

      {/* Structured Data */}
      {structuredData && (
        <script type="application/ld+json">
          {JSON.stringify(structuredData)}
        </script>
      )}
    </Helmet>
  );
};

// Helper function to generate LocalBusiness structured data
export const generateLocalBusinessSchema = () => ({
  "@context": "https://schema.org",
  "@type": "LocalBusiness",
  "name": "BM BEAUTY STUDIO",
  "image": "https://lckxvimdqnfjzkbrusgu.supabase.co/storage/v1/object/public/service-images/studio.jpg",
  "address": {
    "@type": "PostalAddress",
    "streetAddress": "Smolna 8/254",
    "addressLocality": "Warszawa",
    "postalCode": "00-375",
    "addressCountry": "PL"
  },
  "geo": {
    "@type": "GeoCoordinates",
    "latitude": 52.2297,
    "longitude": 21.0122
  },
  "telephone": "+48536200573",
  "priceRange": "$$",
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
  ]
});

// Helper function to generate Person structured data
export const generatePersonSchema = () => ({
  "@context": "https://schema.org",
  "@type": "Person",
  "name": "Mariia Borysevych",
  "jobTitle": "Personal Trainer & PMU Artist",
  "description": "Personal trainer at Zdrofit and permanent makeup artist at BM BEAUTY in Warsaw",
  "url": window.location.origin,
  "sameAs": [
    "https://zdrofit.pl/kadra/mariia-borysevych"
  ],
  "worksFor": [
    {
      "@type": "Organization",
      "name": "BM BEAUTY STUDIO"
    },
    {
      "@type": "Organization",
      "name": "Zdrofit"
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
