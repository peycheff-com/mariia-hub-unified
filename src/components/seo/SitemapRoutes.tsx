import { RouteObject } from 'react-router-dom';

export interface SitemapRoute {
  path: string;
  changefreq: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
  priority: number;
  lastmod?: string;
  alternates?: Record<string, string>;
}

export const sitemapRoutes: SitemapRoute[] = [
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
    path: '/beauty/services',
    changefreq: 'weekly',
    priority: 0.8,
    alternates: {
      en: '/beauty/services',
      pl: '/pl/beauty/services',
      x_default: '/beauty/services'
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
    path: '/fitness/programs',
    changefreq: 'weekly',
    priority: 0.8,
    alternates: {
      en: '/fitness/programs',
      pl: '/pl/fitness/programs',
      x_default: '/fitness/programs'
    }
  },
  {
    path: '/about',
    changefreq: 'monthly',
    priority: 0.7,
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
    path: '/reviews',
    changefreq: 'weekly',
    priority: 0.8,
    alternates: {
      en: '/reviews',
      pl: '/pl/reviews',
      x_default: '/reviews'
    }
  },
  {
    path: '/book',
    changefreq: 'daily',
    priority: 0.9,
    alternates: {
      en: '/book',
      pl: '/pl/book',
      x_default: '/book'
    }
  },
  {
    path: '/gallery',
    changefreq: 'monthly',
    priority: 0.6,
    alternates: {
      en: '/gallery',
      pl: '/pl/gallery',
      x_default: '/gallery'
    }
  },
  {
    path: '/faq',
    changefreq: 'monthly',
    priority: 0.7,
    alternates: {
      en: '/faq',
      pl: '/pl/faq',
      x_default: '/faq'
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
  },

  // Package and Commercial Routes
  {
    path: '/packages',
    changefreq: 'weekly',
    priority: 0.8,
    alternates: {
      en: '/packages',
      pl: '/pl/packages',
      x_default: '/packages'
    }
  },
  {
    path: '/gift-cards',
    changefreq: 'monthly',
    priority: 0.6,
    alternates: {
      en: '/gift-cards',
      pl: '/pl/gift-cards',
      x_default: '/gift-cards'
    }
  },

  // Legal Pages (Lower Priority)
  {
    path: '/legal',
    changefreq: 'yearly',
    priority: 0.3,
    alternates: {
      en: '/legal',
      pl: '/pl/legal',
      x_default: '/legal'
    }
  },
  {
    path: '/policies',
    changefreq: 'yearly',
    priority: 0.3,
    alternates: {
      en: '/policies',
      pl: '/pl/policies',
      x_default: '/policies'
    }
  },
  {
    path: '/terms',
    changefreq: 'yearly',
    priority: 0.3,
    alternates: {
      en: '/terms',
      pl: '/pl/terms',
      x_default: '/terms'
    }
  },
  {
    path: '/privacy',
    changefreq: 'yearly',
    priority: 0.3,
    alternates: {
      en: '/privacy',
      pl: '/pl/privacy',
      x_default: '/privacy'
    }
  },
  {
    path: '/cookies',
    changefreq: 'yearly',
    priority: 0.3,
    alternates: {
      en: '/cookies',
      pl: '/pl/cookies',
      x_default: '/cookies'
    }
  },
  {
    path: '/gdpr',
    changefreq: 'yearly',
    priority: 0.3,
    alternates: {
      en: '/gdpr',
      pl: '/pl/gdpr',
      x_default: '/gdpr'
    }
  },

  // Landing Pages (Medium Priority)
  {
    path: '/lp/beauty/lips',
    changefreq: 'monthly',
    priority: 0.7,
    alternates: {
      en: '/lp/beauty/lips',
      pl: '/pl/lp/beauty/lips',
      x_default: '/lp/beauty/lips'
    }
  },
  {
    path: '/lp/beauty/brows',
    changefreq: 'monthly',
    priority: 0.7,
    alternates: {
      en: '/lp/beauty/brows',
      pl: '/pl/lp/beauty/brows',
      x_default: '/lp/beauty/brows'
    }
  },
  {
    path: '/lp/fitness/starter',
    changefreq: 'monthly',
    priority: 0.7,
    alternates: {
      en: '/lp/fitness/starter',
      pl: '/pl/lp/fitness/starter',
      x_default: '/lp/fitness/starter'
    }
  },
  {
    path: '/lp/fitness/glutes-8w',
    changefreq: 'monthly',
    priority: 0.7,
    alternates: {
      en: '/lp/fitness/glutes-8w',
      pl: '/pl/lp/fitness/glutes-8w',
      x_default: '/lp/fitness/glutes-8w'
    }
  },

  // Category Pages
  {
    path: '/beauty/brows',
    changefreq: 'weekly',
    priority: 0.8,
    alternates: {
      en: '/beauty/brows',
      pl: '/pl/beauty/brows',
      x_default: '/beauty/brows'
    }
  },
  {
    path: '/beauty/makeup',
    changefreq: 'weekly',
    priority: 0.8,
    alternates: {
      en: '/beauty/makeup',
      pl: '/pl/beauty/makeup',
      x_default: '/beauty/makeup'
    }
  }
];

// Dynamic route patterns that will be generated from database
export const dynamicRoutePatterns = {
  '/beauty/services/:slug': {
    changefreq: 'weekly' as const,
    priority: 0.9,
    alternates: {
      en: '/beauty/services/{slug}',
      pl: '/pl/beauty/services/{slug}',
      x_default: '/beauty/services/{slug}'
    }
  },
  '/fitness/programs/:slug': {
    changefreq: 'weekly' as const,
    priority: 0.9,
    alternates: {
      en: '/fitness/programs/{slug}',
      pl: '/pl/fitness/programs/{slug}',
      x_default: '/fitness/programs/{slug}'
    }
  },
  '/blog/:slug': {
    changefreq: 'monthly' as const,
    priority: 0.7,
    alternates: {
      en: '/blog/{slug}',
      pl: '/pl/blog/{slug}',
      x_default: '/blog/{slug}'
    }
  }
};

export const generateSitemapXML = (baseUrl: string = 'https://mariiahub.pl'): string => {
  const staticUrls = sitemapRoutes.map(route => {
    const urlNode = `
  <url>
    <loc>${baseUrl}${route.path}</loc>
    <lastmod>${route.lastmod || new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>${route.changefreq}</changefreq>
    <priority>${route.priority.toFixed(1)}</priority>
    ${route.alternates ? Object.entries(route.alternates)
      .map(([lang, path]) => `    <xhtml:link rel="alternate" hreflang="${lang}" href="${baseUrl}${path}" />`)
      .join('\n') : ''}
  </url>`;
    return urlNode;
  }).join('');

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">
${staticUrls}
</urlset>`;
};

// Function to generate dynamic routes from database data
export const generateDynamicRoutes = async (supabase: any): Promise<SitemapRoute[]> => {
  const dynamicRoutes: SitemapRoute[] = [];

  try {
    // Get beauty services
    const { data: beautyServices } = await supabase
      .from('services')
      .select('slug, updated_at')
      .eq('service_type', 'beauty')
      .eq('is_active', true);

    if (beautyServices) {
      beautyServices.forEach(service => {
        dynamicRoutes.push({
          path: `/beauty/services/${service.slug}`,
          changefreq: 'weekly',
          priority: 0.9,
          lastmod: service.updated_at || new Date().toISOString(),
          alternates: {
            en: `/beauty/services/${service.slug}`,
            pl: `/pl/beauty/services/${service.slug}`,
            x_default: `/beauty/services/${service.slug}`
          }
        });
      });
    }

    // Get fitness programs
    const { data: fitnessPrograms } = await supabase
      .from('services')
      .select('slug, updated_at')
      .eq('service_type', 'fitness')
      .eq('is_active', true);

    if (fitnessPrograms) {
      fitnessPrograms.forEach(program => {
        dynamicRoutes.push({
          path: `/fitness/programs/${program.slug}`,
          changefreq: 'weekly',
          priority: 0.9,
          lastmod: program.updated_at || new Date().toISOString(),
          alternates: {
            en: `/fitness/programs/${program.slug}`,
            pl: `/pl/fitness/programs/${program.slug}`,
            x_default: `/fitness/programs/${program.slug}`
          }
        });
      });
    }

    // Get blog posts
    const { data: blogPosts } = await supabase
      .from('blog_posts')
      .select('slug, updated_at, published_at')
      .eq('is_published', true);

    if (blogPosts) {
      blogPosts.forEach(post => {
        dynamicRoutes.push({
          path: `/blog/${post.slug}`,
          changefreq: 'monthly',
          priority: 0.7,
          lastmod: post.updated_at || post.published_at || new Date().toISOString(),
          alternates: {
            en: `/blog/${post.slug}`,
            pl: `/pl/blog/${post.slug}`,
            x_default: `/blog/${post.slug}`
          }
        });
      });
    }

  } catch (error) {
    console.error('Error generating dynamic routes:', error);
  }

  return dynamicRoutes;
};

// Generate complete sitemap with dynamic routes
export const generateCompleteSitemap = async (baseUrl: string = 'https://mariiahub.pl', supabase: any): Promise<string> => {
  const dynamicRoutes = await generateDynamicRoutes(supabase);
  const allRoutes = [...sitemapRoutes, ...dynamicRoutes];

  const urls = allRoutes.map(route => {
    const urlNode = `
  <url>
    <loc>${baseUrl}${route.path}</loc>
    <lastmod>${route.lastmod || new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>${route.changefreq}</changefreq>
    <priority>${route.priority.toFixed(1)}</priority>
    ${route.alternates ? Object.entries(route.alternates)
      .map(([lang, path]) => `    <xhtml:link rel="alternate" hreflang="${lang}" href="${baseUrl}${path}" />`)
      .join('\n') : ''}
  </url>`;
    return urlNode;
  }).join('');

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">
${urls}
</urlset>`;
};