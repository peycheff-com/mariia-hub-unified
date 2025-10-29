import { useTranslation } from 'react-i18next';

interface SitemapEntry {
  url: string;
  lastmod?: string;
  changefreq?: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
  priority?: number;
  alternates?: Array<{ lang: string; url: string }>;
}

interface SitemapGeneratorProps {
  entries: SitemapEntry[];
}

export const SitemapGenerator: React.FC<SitemapGeneratorProps> = ({ entries }) => {
  const { i18n } = useTranslation();
  const baseUrl = window.location.origin;

  const generateSitemapXML = () => {
    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" ';
    xml += 'xmlns:xhtml="http://www.w3.org/1999/xhtml">\n';

    entries.forEach(entry => {
      xml += '  <url>\n';
      xml += `    <loc>${entry.url}</loc>\n`;

      if (entry.lastmod) {
        xml += `    <lastmod>${entry.lastmod}</lastmod>\n`;
      }

      if (entry.changefreq) {
        xml += `    <changefreq>${entry.changefreq}</changefreq>\n`;
      }

      if (entry.priority) {
        xml += `    <priority>${entry.priority}</priority>\n`;
      }

      // Add alternate language links
      if (entry.alternates && entry.alternates.length > 0) {
        entry.alternates.forEach(alt => {
          xml += `    <xhtml:link rel="alternate" hreflang="${alt.lang}" href="${alt.url}" />\n`;
        });
      }

      xml += '  </url>\n';
    });

    xml += '</urlset>';
    return xml;
  };

  const generateSitemapIndexXML = (sitemaps: string[]) => {
    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += '<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';

    sitemaps.forEach(sitemap => {
      xml += '  <sitemap>\n';
      xml += `    <loc>${sitemap}</loc>\n`;
      xml += `    <lastmod>${new Date().toISOString()}</lastmod>\n`;
      xml += '  </sitemap>\n';
    });

    xml += '</sitemapindex>';
    return xml;
  };

  const generateRobotsTxt = () => {
    let robots = `User-agent: *\n`;
    robots += `Allow: /\n`;
    robots += `Disallow: /admin/\n`;
    robots += `Disallow: /api/\n`;
    robots += `Disallow: /api-docs/\n`;
    robots += `Disallow: /_next/\n`;
    robots += `Disallow: /static/\n`;
    robots += `\n`;
    robots += `Sitemap: ${baseUrl}/sitemap.xml\n`;
    robots += `Sitemap: ${baseUrl}/sitemap-pl.xml\n`;
    robots += `Sitemap: ${baseUrl}/sitemap-en.xml\n`;

    // Add crawl delay for better performance
    robots += `\nCrawl-delay: 1\n`;

    // Allow specific bots
    robots += `\nUser-agent: Googlebot\n`;
    robots += `Allow: /\n`;
    robots += `Crawl-delay: 0.5\n`;

    robots += `\nUser-agent: Bingbot\n`;
    robots += `Allow: /\n`;
    robots += `Crawl-delay: 1\n`;

    return robots;
  };

  // These functions would typically be called on the server side
  // For now, they return the XML/text content
  return {
    sitemapXML: generateSitemapXML(),
    robotsTxt: generateRobotsTxt(),
    generateSitemapIndexXML
  };
};

// Helper function to generate sitemap entries for the application
export const generateSitemapEntries = (): SitemapEntry[] => {
  const baseUrl = window.location.origin;
  const currentDate = new Date().toISOString();

  const routes = [
    { path: '/', priority: 1.0, changefreq: 'daily' as const },
    { path: '/beauty', priority: 0.9, changefreq: 'weekly' as const },
    { path: '/fitness', priority: 0.9, changefreq: 'weekly' as const },
    { path: '/about', priority: 0.8, changefreq: 'monthly' as const },
    { path: '/contact', priority: 0.8, changefreq: 'monthly' as const },
    { path: '/blog', priority: 0.7, changefreq: 'daily' as const },
    { path: '/booking', priority: 0.9, changefreq: 'daily' as const },
    { path: '/privacy', priority: 0.5, changefreq: 'yearly' as const },
    { path: '/terms', priority: 0.5, changefreq: 'yearly' as const }
  ];

  const entries: SitemapEntry[] = [];

  routes.forEach(route => {
    // Generate entries for each language
    ['en', 'pl'].forEach(lang => {
      const url = lang === 'en'
        ? `${baseUrl}${route.path === '/' ? '' : route.path}`
        : `${baseUrl}/${lang}${route.path === '/' ? '' : route.path}`;

      const alternates = [
        { lang: 'en', url: lang === 'en' ? url : `${baseUrl}${route.path === '/' ? '' : route.path}` },
        { lang: 'pl', url: lang === 'pl' ? url : `${baseUrl}/pl${route.path === '/' ? '' : route.path}` }
      ];

      entries.push({
        url,
        lastmod: currentDate,
        changefreq: route.changefreq,
        priority: route.priority,
        alternates
      });
    });
  });

  return entries;
};