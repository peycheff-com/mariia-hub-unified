import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

import { generateRobotsTxt, generateSitemapIndex } from '../../../src/components/seo/RobotsTxt.tsx'

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
    const url = new URL(req.url)
    const type = url.searchParams.get('type') || 'robots'
    const baseUrl = 'https://mariiahub.pl'

    let content: string
    let contentType: string

    switch (type) {
      case 'sitemap-index':
        content = generateSitemapIndex(baseUrl)
        contentType = 'application/xml'
        break
      case 'robots':
      default:
        content = generateRobotsTxt(baseUrl)
        contentType = 'text/plain'
        break
    }

    return new Response(content, {
      headers: {
        ...corsHeaders,
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=86400, s-maxage=86400', // Cache for 24 hours
      },
    })

  } catch (error) {
    console.error('Error generating robots.txt:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
      },
    })
  }
})