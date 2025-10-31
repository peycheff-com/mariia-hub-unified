import { Service } from '@/types/shared';

export interface SitemapEntry {
  url: string;
  lastModified?: Date;
  changeFrequency?: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
  priority?: number;
  alternates?: Array<{
    hrefLang: string;
    href: string;
  }>;
  images?: Array<{
    loc: string;
    caption?: string;
    title?: string;
    geo_location?: string;
    license?: string;
  }>;
  news?: {
    publication: {
      name: string;
      language: string;
    };
    publication_date: string;
    title: string;
  };
  videos?: Array<{
    thumbnail_loc: string;
    title: string;
    description: string;
    content_loc?: string;
    duration?: string;
    expiration_date?: string;
    rating?: number;
    view_count?: number;
    publication_date?: string;
    family_friendly?: 'yes' | 'no';
    restriction?: string;
    platform?: string;
  }>;
}

export interface SitemapConfig {
  baseUrl: string;
  supportedLanguages: string[];
  defaultLanguage: string;
  excludePaths?: string[];
  includeImages?: boolean;
  includeNews?: boolean;
  includeVideos?: boolean;
  customPriority?: Record<string, number>;
  customChangeFrequency?: Record<string, string>;
}

export interface SitemapIndexEntry {
  loc: string;
  lastModified?: Date;
}

/**
 * Dynamic sitemap generator with multi-language support
 */
export class SitemapGenerator {
  private config: SitemapConfig;
  private static instance: SitemapGenerator;

  constructor(config: SitemapConfig) {
    this.config = config;
  }

  static getInstance(config?: SitemapConfig): SitemapGenerator {
    if (!SitemapGenerator.instance) {
      if (!config) {
        throw new Error('Config required for first initialization');
      }
      SitemapGenerator.instance = new SitemapGenerator(config);
    }
    return SitemapGenerator.instance;
  }

  /**
   * Generate main sitemap with all pages
   */
  async generateMainSitemap(
    pages: Array<{
      path: string;
      translations: Record<string, string>;
      lastModified?: Date;
      priority?: number;
      changeFrequency?: string;
      images?: string[];
    }>,
    services?: Service[]
  ): Promise<string> {
    const entries: SitemapEntry[] = [];

    // Add static pages
    pages.forEach(page => {
      const basePath = page.path.replace(/^\//, '');

      // Add entry for each language
      this.config.supportedLanguages.forEach(lang => {
        const localizedPath = page.translations[lang] || page.path;
        const url = lang === this.config.defaultLanguage
          ? `${this.config.baseUrl}/${localizedPath}`
          : `${this.config.baseUrl}/${lang}/${localizedPath}`;

        // Generate alternates for all languages
        const alternates = this.config.supportedLanguages.map(altLang => ({
          hrefLang: altLang === this.config.defaultLanguage ? 'x-default' : altLang,
          href: altLang === this.config.defaultLanguage
            ? `${this.config.baseUrl}/${page.translations[altLang] || page.path}`
            : `${this.config.baseUrl}/${altLang}/${page.translations[altLang] || page.path}`
        }));

        // Generate images
        const images = page.images?.map(img => ({
          loc: img.startsWith('http') ? img : `${this.config.baseUrl}${img}`,
          title: page.path,
          caption: `${page.path} - ${lang}`
        }));

        entries.push({
          url,
          lastModified: page.lastModified || new Date(),
          changeFrequency: (page.changeFrequency as any) || 'weekly',
          priority: page.priority || this.getPriorityForPath(page.path),
          alternates,
          images
        });
      });
    });

    // Add service pages
    if (services) {
      services.forEach(service => {
        this.config.supportedLanguages.forEach(lang => {
          const serviceUrl = lang === this.config.defaultLanguage
            ? `${this.config.baseUrl}/beauty/services/${service.slug}`
            : `${this.config.baseUrl}/${lang}/beauty/services/${service.slug}`;

          const alternates = this.config.supportedLanguages.map(altLang => ({
            hrefLang: altLang === this.config.defaultLanguage ? 'x-default' : altLang,
            href: altLang === this.config.defaultLanguage
              ? `${this.config.baseUrl}/beauty/services/${service.slug}`
              : `${this.config.baseUrl}/${altLang}/beauty/services/${service.slug}`
          }));

          const images = service.images?.map(img => ({
            loc: img.url.startsWith('http') ? img.url : `${this.config.baseUrl}${img.url}`,
            title: service.name,
            caption: `${service.name} - ${lang}`
          }));

          entries.push({
            url: serviceUrl,
            lastModified: new Date(),
            changeFrequency: 'monthly',
            priority: 0.8,
            alternates,
            images
          });
        });
      });
    }

    return this.generateSitemapXML(entries);
  }

  /**
   * Generate language-specific sitemaps
   */
  async generateLanguageSitemaps(
    pages: Array<{
      path: string;
      translations: Record<string, string>;
      lastModified?: Date;
      priority?: number;
      changeFrequency?: string;
    }>,
    services?: Service[]
  ): Promise<Array<{ language: string; content: string }>> {
    const sitemaps: Array<{ language: string; content: string }> = [];

    for (const lang of this.config.supportedLanguages) {
      const entries: SitemapEntry[] = [];

      pages.forEach(page => {
        const localizedPath = page.translations[lang] || page.path;
        const url = lang === this.config.defaultLanguage
          ? `${this.config.baseUrl}/${localizedPath}`
          : `${this.config.baseUrl}/${lang}/${localizedPath}`;

        entries.push({
          url,
          lastModified: page.lastModified || new Date(),
          changeFrequency: (page.changeFrequency as any) || 'weekly',
          priority: page.priority || this.getPriorityForPath(page.path)
        });
      });

      if (services) {
        services.forEach(service => {
          const serviceUrl = lang === this.config.defaultLanguage
            ? `${this.config.baseUrl}/beauty/services/${service.slug}`
            : `${this.config.baseUrl}/${lang}/beauty/services/${service.slug}`;

          entries.push({
            url: serviceUrl,
            lastModified: new Date(),
            changeFrequency: 'monthly',
            priority: 0.8
          });
        });
      }

      const sitemapContent = this.generateSitemapXML(entries);
      sitemaps.push({ language: lang, content: sitemapContent });
    }

    return sitemaps;
  }

  /**
   * Generate image sitemap
   */
  async generateImageSitemap(
    images: Array<{
      loc: string;
      caption?: string;
      title?: string;
      geo_location?: string;
      license?: string;
      pageUrl: string;
    }>
  ): Promise<string> {
    const entries: SitemapEntry[] = [];

    // Group images by page URL
    const imagesByPage = new Map<string, typeof images>();

    images.forEach(image => {
      if (!imagesByPage.has(image.pageUrl)) {
        imagesByPage.set(image.pageUrl, []);
      }
      imagesByPage.get(image.pageUrl)!.push(image);
    });

    imagesByPage.forEach((pageImages, pageUrl) => {
      entries.push({
        url: pageUrl.startsWith('http') ? pageUrl : `${this.config.baseUrl}${pageUrl}`,
        lastModified: new Date(),
        changeFrequency: 'monthly',
        priority: 0.6,
        images: pageImages.map(img => ({
          loc: img.loc.startsWith('http') ? img.loc : `${this.config.baseUrl}${img.loc}`,
          caption: img.caption,
          title: img.title,
          geo_location: img.geo_location,
          license: img.license
        }))
      });
    });

    return this.generateSitemapXML(entries);
  }

  /**
   * Generate news sitemap
   */
  async generateNewsSitemap(
    articles: Array<{
      title: string;
      url: string;
      publication_date: string;
      language: string;
      images?: string[];
    }>
  ): Promise<string> {
    const entries: SitemapEntry[] = [];

    articles.forEach(article => {
      const images = article.images?.map(img => ({
        loc: img.startsWith('http') ? img : `${this.config.baseUrl}${img}`,
        caption: article.title,
        title: article.title
      }));

      entries.push({
        url: article.url.startsWith('http') ? article.url : `${this.config.baseUrl}${article.url}`,
        lastModified: new Date(article.publication_date),
        changeFrequency: 'never',
        priority: 0.9,
        images,
        news: {
          publication: {
            name: 'mariiaborysevych Blog',
            language: article.language
          },
          publication_date: article.publication_date,
          title: article.title
        }
      });
    });

    return this.generateSitemapXML(entries);
  }

  /**
   * Generate video sitemap
   */
  async generateVideoSitemap(
    videos: Array<{
      title: string;
      description: string;
      thumbnail_loc: string;
      content_loc?: string;
      pageUrl: string;
      duration?: string;
      publication_date?: string;
    }>
  ): Promise<string> {
    const entries: SitemapEntry[] = [];

    videos.forEach(video => {
      entries.push({
        url: video.pageUrl.startsWith('http') ? video.pageUrl : `${this.config.baseUrl}${video.pageUrl}`,
        lastModified: new Date(video.publication_date || Date.now()),
        changeFrequency: 'monthly',
        priority: 0.7,
        videos: [{
          thumbnail_loc: video.thumbnail_loc.startsWith('http') ? video.thumbnail_loc : `${this.config.baseUrl}${video.thumbnail_loc}`,
          title: video.title,
          description: video.description,
          content_loc: video.content_loc,
          duration: video.duration,
          publication_date: video.publication_date,
          family_friendly: 'yes'
        }]
      });
    });

    return this.generateSitemapXML(entries);
  }

  /**
   * Generate sitemap index
   */
  async generateSitemapIndex(
    sitemaps: Array<{
      path: string;
      lastModified?: Date;
    }>
  ): Promise<string> {
    const entries: SitemapIndexEntry[] = sitemaps.map(sitemap => ({
      loc: `${this.config.baseUrl}/${sitemap.path}`,
      lastModified: sitemap.lastModified || new Date()
    }));

    return this.generateSitemapIndexXML(entries);
  }

  /**
   * Generate robots.txt
   */
  generateRobotsTxt(
    sitemaps: string[],
    additionalRules?: Array<{
      userAgent: string;
      allow?: string[];
      disallow?: string[];
      crawlDelay?: number;
    }>
  ): string {
    let robots = '# Robots.txt for mariiaborysevych\n';
    robots += '# Generated automatically\n\n';

    // Default rules
    robots += 'User-agent: *\n';
    robots += 'Allow: /\n';

    if (this.config.excludePaths) {
      this.config.excludePaths.forEach(path => {
        robots += `Disallow: ${path}\n`;
      });
    }

    // Disallow admin and private areas
    robots += 'Disallow: /admin/\n';
    robots += 'Disallow: /api/\n';
    robots += 'Disallow: /_next/\n';
    robots += 'Disallow: /private/\n';
    robots += 'Disallow: *.json$\n';

    robots += '\n';

    // Allow specific bots
    robots += 'User-agent: Googlebot\n';
    robots += 'Allow: /\n';
    robots += 'Crawl-delay: 1\n\n';

    robots += 'User-agent: Bingbot\n';
    robots += 'Allow: /\n';
    robots += 'Crawl-delay: 1\n\n';

    // Additional rules
    if (additionalRules) {
      additionalRules.forEach(rule => {
        robots += `User-agent: ${rule.userAgent}\n`;
        if (rule.allow) {
          rule.allow.forEach(path => robots += `Allow: ${path}\n`);
        }
        if (rule.disallow) {
          rule.disallow.forEach(path => robots += `Disallow: ${path}\n`);
        }
        if (rule.crawlDelay) {
          robots += `Crawl-delay: ${rule.crawlDelay}\n`;
        }
        robots += '\n';
      });
    }

    // Sitemaps
    robots += '# Sitemaps\n';
    sitemaps.forEach(sitemap => {
      robots += `Sitemap: ${sitemap.startsWith('http') ? sitemap : `${this.config.baseUrl}${sitemap}`}\n`;
    });

    return robots;
  }

  /**
   * Validate sitemap
   */
  validateSitemap(sitemapContent: string): {
    valid: boolean;
    errors: string[];
    warnings: string[];
  } {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Basic XML validation
    if (!sitemapContent.includes('<?xml')) {
      errors.push('Missing XML declaration');
    }

    if (!sitemapContent.includes('<urlset')) {
      errors.push('Missing urlset element');
    }

    if (!sitemapContent.includes('http://www.sitemaps.org/schemas/sitemap/0.9')) {
      errors.push('Missing or incorrect schema namespace');
    }

    // Check for required elements
    if (!sitemapContent.includes('<url>')) {
      errors.push('No URL entries found');
    }

    if (!sitemapContent.includes('<loc>')) {
      errors.push('Missing loc elements');
    }

    // Check URL format
    const urlMatches = sitemapContent.match(/<loc>([^<]+)<\/loc>/g);
    if (urlMatches) {
      urlMatches.forEach(match => {
        const url = match.replace(/<\/?loc>/g, '');
        if (!url.startsWith('http')) {
          errors.push(`Invalid URL format: ${url}`);
        }
      });
    }

    // Check priority values
    const priorityMatches = sitemapContent.match(/<priority>([^<]+)<\/priority>/g);
    if (priorityMatches) {
      priorityMatches.forEach(match => {
        const priority = parseFloat(match.replace(/<\/?priority>/g, ''));
        if (priority < 0 || priority > 1) {
          errors.push(`Invalid priority value: ${priority}`);
        }
      });
    }

    // Check changeFrequency values
    const changeFreqMatches = sitemapContent.match(/<changefreq>([^<]+)<\/changefreq>/g);
    const validFreqs = ['always', 'hourly', 'daily', 'weekly', 'monthly', 'yearly', 'never'];
    if (changeFreqMatches) {
      changeFreqMatches.forEach(match => {
        const freq = match.replace(/<\/?changefreq>/g, '');
        if (!validFreqs.includes(freq)) {
          errors.push(`Invalid changeFrequency value: ${freq}`);
        }
      });
    }

    // Size warning (Sitemaps should be under 50MB)
    const sizeInBytes = new Blob([sitemapContent]).size;
    if (sizeInBytes > 50 * 1024 * 1024) {
      warnings.push('Sitemap size exceeds 50MB limit');
    }

    // URL count warning (Sitemaps should have under 50,000 URLs)
    const urlCount = (sitemapContent.match(/<url>/g) || []).length;
    if (urlCount > 50000) {
      warnings.push('Sitemap URL count exceeds 50,000 limit');
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Generate sitemap XML from entries
   */
  private generateSitemapXML(entries: SitemapEntry[]): string {
    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"\n';

    // Add namespaces for extended content
    const hasImages = entries.some(e => e.images && e.images.length > 0);
    const hasNews = entries.some(e => e.news);
    const hasVideos = entries.some(e => e.videos && e.videos.length > 0);

    if (hasImages) {
      xml += '  xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"\n';
    }
    if (hasNews) {
      xml += '  xmlns:news="http://www.google.com/schemas/sitemap-news/0.9"\n';
    }
    if (hasVideos) {
      xml += '  xmlns:video="http://www.google.com/schemas/sitemap-video/1.1"\n';
    }
    xml += '  xmlns:xhtml="http://www.w3.org/1999/xhtml">\n';

    entries.forEach(entry => {
      xml += '  <url>\n';
      xml += `    <loc>${this.escapeXml(entry.url)}</loc>\n`;

      if (entry.lastModified) {
        xml += `    <lastmod>${entry.lastModified.toISOString().split('T')[0]}</lastmod>\n`;
      }

      if (entry.changeFrequency) {
        xml += `    <changefreq>${entry.changeFrequency}</changefreq>\n`;
      }

      if (entry.priority !== undefined) {
        xml += `    <priority>${entry.priority.toFixed(1)}</priority>\n`;
      }

      // Add hreflang alternates
      if (entry.alternates && entry.alternates.length > 0) {
        entry.alternates.forEach(alternate => {
          xml += `    <xhtml:link rel="alternate" hreflang="${alternate.hrefLang}" href="${this.escapeXml(alternate.href)}" />\n`;
        });
      }

      // Add images
      if (entry.images && entry.images.length > 0) {
        entry.images.forEach(image => {
          xml += '    <image:image>\n';
          xml += `      <image:loc>${this.escapeXml(image.loc)}</image:loc>\n`;
          if (image.caption) {
            xml += `      <image:caption>${this.escapeXml(image.caption)}</image:caption>\n`;
          }
          if (image.title) {
            xml += `      <image:title>${this.escapeXml(image.title)}</image:title>\n`;
          }
          if (image.geo_location) {
            xml += `      <image:geo_location>${this.escapeXml(image.geo_location)}</image:geo_location>\n`;
          }
          if (image.license) {
            xml += `      <image:license>${this.escapeXml(image.license)}</image:license>\n`;
          }
          xml += '    </image:image>\n';
        });
      }

      // Add news
      if (entry.news) {
        xml += '    <news:news>\n';
        xml += '      <news:publication>\n';
        xml += `        <news:name>${this.escapeXml(entry.news.publication.name)}</news:name>\n`;
        xml += `        <news:language>${entry.news.publication.language}</news:language>\n`;
        xml += '      </news:publication>\n';
        xml += `      <news:publication_date>${entry.news.publication_date}</news:publication_date>\n`;
        xml += `      <news:title>${this.escapeXml(entry.news.title)}</news:title>\n`;
        xml += '    </news:news>\n';
      }

      // Add videos
      if (entry.videos && entry.videos.length > 0) {
        entry.videos.forEach(video => {
          xml += '    <video:video>\n';
          xml += `      <video:thumbnail_loc>${this.escapeXml(video.thumbnail_loc)}</video:thumbnail_loc>\n`;
          xml += `      <video:title>${this.escapeXml(video.title)}</video:title>\n`;
          xml += `      <video:description>${this.escapeXml(video.description)}</video:description>\n`;
          if (video.content_loc) {
            xml += `      <video:content_loc>${this.escapeXml(video.content_loc)}</video:content_loc>\n`;
          }
          if (video.duration) {
            xml += `      <video:duration>${video.duration}</video:duration>\n`;
          }
          if (video.publication_date) {
            xml += `      <video:publication_date>${video.publication_date}</video:publication_date>\n`;
          }
          if (video.family_friendly) {
            xml += `      <video:family_friendly>${video.family_friendly}</video:family_friendly>\n`;
          }
          xml += '    </video:video>\n';
        });
      }

      xml += '  </url>\n';
    });

    xml += '</urlset>';
    return xml;
  }

  /**
   * Generate sitemap index XML
   */
  private generateSitemapIndexXML(entries: SitemapIndexEntry[]): string {
    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += '<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';

    entries.forEach(entry => {
      xml += '  <sitemap>\n';
      xml += `    <loc>${this.escapeXml(entry.loc)}</loc>\n`;
      if (entry.lastModified) {
        xml += `    <lastmod>${entry.lastModified.toISOString().split('T')[0]}</lastmod>\n`;
      }
      xml += '  </sitemap>\n';
    });

    xml += '</sitemapindex>';
    return xml;
  }

  /**
   * Get priority based on path
   */
  private getPriorityForPath(path: string): number {
    if (this.config.customPriority && this.config.customPriority[path]) {
      return this.config.customPriority[path];
    }

    // Default priorities
    if (path === '/' || path === '') return 1.0;
    if (path.includes('/beauty') || path.includes('/fitness')) return 0.9;
    if (path.includes('/about') || path.includes('/contact')) return 0.8;
    if (path.includes('/blog')) return 0.7;
    if (path.includes('/faq') || path.includes('/reviews')) return 0.6;
    return 0.5;
  }

  /**
   * Escape XML special characters
   */
  private escapeXml(unsafe: string): string {
    return unsafe
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }
}

export default SitemapGenerator;