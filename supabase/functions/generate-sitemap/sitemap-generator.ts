// Simplified sitemap generator for Edge Function

export interface SitemapRoute {
  path: string;
  changefreq: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
  priority: number;
  lastmod?: string;
  alternates?: Record<string, string>;
}

const sitemapRoutes: SitemapRoute[] = [
  // Static Routes
  {
    path: '/',
    changefreq: 'weekly',
    priority: 1.0,
    lastmod: new Date().toISOString(),
    alternates: {
      en: '/',
      pl: '/pl',
      x_default: '/'
    }
  },
  {
    path: '/beauty',
    changefreq: 'weekly',
    priority: 0.9,
    alternates: {
      en: '/beauty',
      pl: '/pl/beauty',
      x_default: '/beauty'
    }
  },
  {
    path: '/fitness',
    changefreq: 'weekly',
    priority: 0.9,
    alternates: {
      en: '/fitness',
      pl: '/pl/fitness',
      x_default: '/fitness'
    }
  },
  {
    path: '/about',
    changefreq: 'monthly',
    priority: 0.8,
    alternates: {
      en: '/about',
      pl: '/pl/about',
      x_default: '/about'
    }
  },
  {
    path: '/contact',
    changefreq: 'monthly',
    priority: 0.8,
    alternates: {
      en: '/contact',
      pl: '/pl/contact',
      x_default: '/contact'
    }
  },
  {
    path: '/booking',
    changefreq: 'daily',
    priority: 0.9,
    alternates: {
      en: '/booking',
      pl: '/pl/booking',
      x_default: '/booking'
    }
  },
  {
    path: '/blog',
    changefreq: 'weekly',
    priority: 0.7,
    alternates: {
      en: '/blog',
      pl: '/pl/blog',
      x_default: '/blog'
    }
  }
];

export function generateCompleteSitemap(blogPosts?: any[]): string {
  const baseUrl = 'https://mariia-hub-unified.vercel.app';

  let sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">`;

  // Add static routes
  for (const route of sitemapRoutes) {
    sitemap += `
  <url>
    <loc>${baseUrl}${route.path}</loc>
    <lastmod>${route.lastmod || new Date().toISOString()}</lastmod>
    <changefreq>${route.changefreq}</changefreq>
    <priority>${route.priority}</priority>`;

    if (route.alternates) {
      for (const [lang, href] of Object.entries(route.alternates)) {
        sitemap += `
    <xhtml:link rel="alternate" hreflang="${lang}" href="${baseUrl}${href}" />`;
      }
    }

    sitemap += `
  </url>`;
  }

  // Add blog posts if provided
  if (blogPosts) {
    for (const post of blogPosts) {
      const postPath = `/blog/${post.slug}`;
      sitemap += `
  <url>
    <loc>${baseUrl}${postPath}</loc>
    <lastmod>${post.updated_at || new Date().toISOString()}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
    <xhtml:link rel="alternate" hreflang="en" href="${baseUrl}${postPath}" />
    <xhtml:link rel="alternate" hreflang="pl" href="${baseUrl}/pl${postPath}" />
    <xhtml:link rel="alternate" hreflang="x-default" href="${baseUrl}${postPath}" />
  </url>`;
    }
  }

  sitemap += `
</urlset>`;

  return sitemap;
}