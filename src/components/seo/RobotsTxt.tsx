export const generateRobotsTxt = (baseUrl: string = 'https://mariiahub.pl'): string => {
  return `# Robot.txt for mariiaborysevych
# Generated on ${new Date().toISOString()}

User-agent: *
Allow: /
Allow: /beauty/
Allow: /fitness/
Allow: /about/
Allow: /contact/
Allow: /blog/
Allow: /reviews/
Allow: /faq/
Allow: /packages/
Allow: /gallery/

# Disallow admin and private areas
Disallow: /admin/
Disallow: /api/
Disallow: /dashboard/
Disallow: /user/
Disallow: /auth/
Disallow: /.well-known/
Disallow: /private/
Disallow: /_next/
Disallow: /static/

# Disallow search and filter pages to prevent duplicate content
Disallow: /search
Disallow: /*?*
Disallow: /*&*

# Disallow temporary and development pages
Disallow: /demo/
Disallow: /test/
Disallow: /404
Disallow: /maintenance

# Disallow checkout and booking confirmation pages
Disallow: /success
Disallow: /cancel
Disallow: /reschedule

# Special rules for common crawlers
User-agent: Googlebot
Allow: /
Crawl-delay: 1

User-agent: Bingbot
Allow: /
Crawl-delay: 1

User-agent: Slurp
Allow: /
Crawl-delay: 1

User-agent: DuckDuckBot
Allow: /
Crawl-delay: 1

# Block unwanted bots
User-agent: AhrefsBot
Disallow: /

User-agent: MJ12bot
Disallow: /

User-agent: DotBot
Disallow: /

User-agent: BLEXBot
Disallow: /

User-agent: BacklinkCrawler
Disallow: /

# Sitemap location
Sitemap: ${baseUrl}/sitemap.xml
Sitemap: ${baseUrl}/sitemap-beauty.xml
Sitemap: ${baseUrl}/sitemap-fitness.xml
Sitemap: ${baseUrl}/sitemap-blog.xml

# Host directive for Yandex
Host: ${baseUrl}

# Cache control for search engines
# Allow caching of static assets
User-agent: *
Allow: *.css
Allow: *.js
Allow: *.png
Allow: *.jpg
Allow: *.jpeg
Allow: *.gif
Allow: *.webp
Allow: *.svg
Allow: *.ico
Allow: *.woff
Allow: *.woff2

# End of robots.txt`;
};

export const generateSitemapIndex = (baseUrl: string = 'https://mariiahub.pl'): string => {
  return `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <sitemap>
    <loc>${baseUrl}/sitemap.xml</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
  </sitemap>
  <sitemap>
    <loc>${baseUrl}/sitemap-beauty.xml</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
  </sitemap>
  <sitemap>
    <loc>${baseUrl}/sitemap-fitness.xml</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
  </sitemap>
  <sitemap>
    <loc>${baseUrl}/sitemap-blog.xml</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
  </sitemap>
</sitemapindex>`;
};