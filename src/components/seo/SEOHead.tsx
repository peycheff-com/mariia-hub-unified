import { Helmet } from 'react-helmet-async';
import { useTranslation } from 'react-i18next';
import { useLocation } from 'react-router-dom';

interface SEOHeadProps {
  title?: string;
  description?: string;
  keywords?: string;
  ogImage?: string;
  ogType?: string;
  noindex?: boolean;
  canonicalUrl?: string;
  additionalMeta?: Array<{ name: string; content: string }>;
  structuredData?: Record<string, any>;
}

export const SEOHead: React.FC<SEOHeadProps> = ({
  title,
  description,
  keywords,
  ogImage,
  ogType = 'website',
  noindex = false,
  canonicalUrl,
  additionalMeta = [],
  structuredData
}) => {
  const { i18n } = useTranslation();
  const location = useLocation();
  const currentLang = i18n.language;

  // Build base URL
  const baseUrl = window.location.origin;
  const currentPath = location.pathname;
  const currentUrl = canonicalUrl || `${baseUrl}${currentPath}`;

  // Generate alternate language URLs
  const alternateUrls: Array<{ hrefLang: string; href: string }> = [];

  // Add current language
  alternateUrls.push({
    hrefLang: currentLang,
    href: currentUrl
  });

  // Add alternate languages
  const supportedLanguages = ['en', 'pl'];
  supportedLanguages.forEach(lang => {
    if (lang !== currentLang) {
      const alternatePath = currentPath.replace(`/${currentLang}`, `/${lang}`);
      alternateUrls.push({
        hrefLang: lang,
        href: `${baseUrl}${alternatePath}`
      });
    }
  });

  // Add x-default for international targeting
  alternateUrls.push({
    hrefLang: 'x-default',
    href: `${baseUrl}${currentPath.replace(`/${currentLang}`, '')}`
  });

  // Generate structured data JSON-LD
  const generateStructuredData = () => {
    if (!structuredData) return null;

    return JSON.stringify({
      '@context': 'https://schema.org',
      ...structuredData
    });
  };

  return (
    <Helmet>
      {/* Basic meta tags */}
      <title>{title || 'Mariia Hub - Beauty & Fitness Services Warsaw'}</title>
      {description && <meta name="description" content={description} />}
      {keywords && <meta name="keywords" content={keywords} />}

      {/* Canonical URL */}
      <link rel="canonical" href={currentUrl} />

      {/* Hreflang tags */}
      {alternateUrls.map((url, index) => (
        <link
          key={index}
          rel="alternate"
          hrefLang={url.hrefLang}
          href={url.href}
        />
      ))}

      {/* Open Graph tags */}
      <meta property="og:title" content={title || 'Mariia Hub - Beauty & Fitness Services Warsaw'} />
      {description && <meta property="og:description" content={description} />}
      <meta property="og:type" content={ogType} />
      <meta property="og:url" content={currentUrl} />
      <meta property="og:site_name" content="Mariia Hub" />
      {ogImage && <meta property="og:image" content={ogImage} />}
      <meta property="og:locale" content={currentLang === 'pl' ? 'pl_PL' : 'en_US'} />

      {/* Twitter Card tags */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title || 'Mariia Hub - Beauty & Fitness Services Warsaw'} />
      {description && <meta name="twitter:description" content={description} />}
      {ogImage && <meta name="twitter:image" content={ogImage} />}
      <meta name="twitter:site" content="@mariiahub" />

      {/* Robots meta */}
      {noindex && <meta name="robots" content="noindex,nofollow" />}

      {/* Additional meta tags */}
      {additionalMeta.map((meta, index) => (
        <meta key={index} name={meta.name} content={meta.content} />
      ))}

      {/* Structured Data */}
      {structuredData && (
        <script type="application/ld+json">
          {generateStructuredData()}
        </script>
      )}
    </Helmet>
  );
};