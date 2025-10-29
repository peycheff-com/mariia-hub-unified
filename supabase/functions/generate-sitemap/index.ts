import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

import { generateCompleteSitemap } from './sitemap-generator.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const url = new URL(req.url)
    const type = url.searchParams.get('type') || 'main'
    const baseUrl = 'https://mariiahub.pl'

    let sitemap: string

    switch (type) {
      case 'main':
        // Generate main sitemap with all routes
        sitemap = await generateCompleteSitemap(baseUrl, supabase)
        break

      case 'beauty':
        // Generate beauty-specific sitemap
        const { data: beautyServices } = await supabase
          .from('services')
          .select('slug, updated_at')
          .eq('service_type', 'beauty')
          .eq('is_active', true)

        const beautyRoutes = beautyServices?.map(service => `
  <url>
    <loc>${baseUrl}/beauty/services/${service.slug}</loc>
    <lastmod>${service.updated_at || new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>
    <xhtml:link rel="alternate" hreflang="en" href="${baseUrl}/beauty/services/${service.slug}" />
    <xhtml:link rel="alternate" hreflang="pl" href="${baseUrl}/pl/beauty/services/${service.slug}" />
    <xhtml:link rel="alternate" hreflang="x-default" href="${baseUrl}/beauty/services/${service.slug}" />
  </url>`).join('') || ''

        sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">
  <url>
    <loc>${baseUrl}/beauty</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>
    <xhtml:link rel="alternate" hreflang="en" href="${baseUrl}/beauty" />
    <xhtml:link rel="alternate" hreflang="pl" href="${baseUrl}/pl/beauty" />
    <xhtml:link rel="alternate" hreflang="x-default" href="${baseUrl}/beauty" />
  </url>
  <url>
    <loc>${baseUrl}/beauty/services</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
    <xhtml:link rel="alternate" hreflang="en" href="${baseUrl}/beauty/services" />
    <xhtml:link rel="alternate" hreflang="pl" href="${baseUrl}/pl/beauty/services" />
    <xhtml:link rel="alternate" hreflang="x-default" href="${baseUrl}/beauty/services" />
  </url>
  <url>
    <loc>${baseUrl}/beauty/brows</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
    <xhtml:link rel="alternate" hreflang="en" href="${baseUrl}/beauty/brows" />
    <xhtml:link rel="alternate" hreflang="pl" href="${baseUrl}/pl/beauty/brows" />
    <xhtml:link rel="alternate" hreflang="x-default" href="${baseUrl}/beauty/brows" />
  </url>
  <url>
    <loc>${baseUrl}/beauty/makeup</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
    <xhtml:link rel="alternate" hreflang="en" href="${baseUrl}/beauty/makeup" />
    <xhtml:link rel="alternate" hreflang="pl" href="${baseUrl}/pl/beauty/makeup" />
    <xhtml:link rel="alternate" hreflang="x-default" href="${baseUrl}/beauty/makeup" />
  </url>
${beautyRoutes}
</urlset>`
        break

      case 'fitness':
        // Generate fitness-specific sitemap
        const { data: fitnessPrograms } = await supabase
          .from('services')
          .select('slug, updated_at')
          .eq('service_type', 'fitness')
          .eq('is_active', true)

        const fitnessRoutes = fitnessPrograms?.map(program => `
  <url>
    <loc>${baseUrl}/fitness/programs/${program.slug}</loc>
    <lastmod>${program.updated_at || new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>
    <xhtml:link rel="alternate" hreflang="en" href="${baseUrl}/fitness/programs/${program.slug}" />
    <xhtml:link rel="alternate" hreflang="pl" href="${baseUrl}/pl/fitness/programs/${program.slug}" />
    <xhtml:link rel="alternate" hreflang="x-default" href="${baseUrl}/fitness/programs/${program.slug}" />
  </url>`).join('') || ''

        sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">
  <url>
    <loc>${baseUrl}/fitness</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>
    <xhtml:link rel="alternate" hreflang="en" href="${baseUrl}/fitness" />
    <xhtml:link rel="alternate" hreflang="pl" href="${baseUrl}/pl/fitness" />
    <xhtml:link rel="alternate" hreflang="x-default" href="${baseUrl}/fitness" />
  </url>
  <url>
    <loc>${baseUrl}/fitness/programs</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
    <xhtml:link rel="alternate" hreflang="en" href="${baseUrl}/fitness/programs" />
    <xhtml:link rel="alternate" hreflang="pl" href="${baseUrl}/pl/fitness/programs" />
    <xhtml:link rel="alternate" hreflang="x-default" href="${baseUrl}/fitness/programs" />
  </url>
${fitnessRoutes}
</urlset>`
        break

      case 'blog':
        // Generate blog-specific sitemap
        const { data: blogPosts } = await supabase
          .from('blog_posts')
          .select('slug, updated_at, published_at')
          .eq('is_published', true)

        const blogRoutes = blogPosts?.map(post => `
  <url>
    <loc>${baseUrl}/blog/${post.slug}</loc>
    <lastmod>${post.updated_at || post.published_at || new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
    <xhtml:link rel="alternate" hreflang="en" href="${baseUrl}/blog/${post.slug}" />
    <xhtml:link rel="alternate" hreflang="pl" href="${baseUrl}/pl/blog/${post.slug}" />
    <xhtml:link rel="alternate" hreflang="x-default" href="${baseUrl}/blog/${post.slug}" />
  </url>`).join('') || ''

        sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">
  <url>
    <loc>${baseUrl}/blog</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
    <xhtml:link rel="alternate" hreflang="en" href="${baseUrl}/blog" />
    <xhtml:link rel="alternate" hreflang="pl" href="${baseUrl}/pl/blog" />
    <xhtml:link rel="alternate" hreflang="x-default" href="${baseUrl}/blog" />
  </url>
${blogRoutes}
</urlset>`
        break

      default:
        sitemap = await generateCompleteSitemap(baseUrl, supabase)
    }

    return new Response(sitemap, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/xml',
        'Cache-Control': 'public, max-age=3600, s-maxage=3600', // Cache for 1 hour
      },
    })

  } catch (error) {
    console.error('Error generating sitemap:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
      },
    })
  }
})