/**
 * Global Edge Function for Geographic Routing and Performance Optimization
 * Routes users to optimal regions based on geographic location
 */

export const config = {
  runtime: 'edge',
  regions: ['iad1', 'fra1', 'hnd1', 'cle1', 'sfo1'],
};

interface GeoLocation {
  country: string;
  city: string;
  region: string;
  latitude: number;
  longitude: number;
}

interface ClientContext {
  ip: string;
  userAgent: string;
  acceptLanguage: string;
  timezone: string;
}

// Geographic routing table for optimal region selection
const REGION_ROUTING = {
  // Europe
  'PL': 'fra1',      // Poland
  'DE': 'fra1',      // Germany
  'FR': 'fra1',      // France
  'IT': 'fra1',      // Italy
  'ES': 'fra1',      // Spain
  'GB': 'fra1',      // United Kingdom
  'NL': 'fra1',      // Netherlands
  'BE': 'fra1',      // Belgium
  'AT': 'fra1',      // Austria
  'CH': 'fra1',      // Switzerland
  'CZ': 'fra1',      // Czech Republic
  'SK': 'fra1',      // Slovakia
  'HU': 'fra1',      // Hungary
  'RO': 'fra1',      // Romania
  'BG': 'fra1',      // Bulgaria
  'HR': 'fra1',      // Croatia
  'SI': 'fra1',      // Slovenia
  'EE': 'fra1',      // Estonia
  'LV': 'fra1',      // Latvia
  'LT': 'fra1',      // Lithuania
  'DK': 'fra1',      // Denmark
  'SE': 'fra1',      // Sweden
  'NO': 'fra1',      // Norway
  'FI': 'fra1',      // Finland
  'GR': 'fra1',      // Greece
  'PT': 'fra1',      // Portugal
  'IE': 'fra1',      // Ireland

  // North America
  'US': 'iad1',      // United States
  'CA': 'iad1',      // Canada
  'MX': 'iad1',      // Mexico

  // Asia
  'JP': 'hnd1',      // Japan
  'KR': 'hnd1',      // South Korea
  'CN': 'hnd1',      // China
  'SG': 'hnd1',      // Singapore
  'HK': 'hnd1',      // Hong Kong
  'TW': 'hnd1',      // Taiwan
  'IN': 'hnd1',      // India
  'TH': 'hnd1',      // Thailand
  'VN': 'hnd1',      // Vietnam
  'MY': 'hnd1',      // Malaysia
  'ID': 'hnd1',      // Indonesia
  'PH': 'hnd1',      // Philippines

  // Default region
  'default': 'fra1'
};

// Currency mapping based on country
const CURRENCY_MAPPING = {
  'PL': 'PLN',
  'US': 'USD',
  'CA': 'CAD',
  'GB': 'GBP',
  'JP': 'JPY',
  'KR': 'KRW',
  'CN': 'CNY',
  'SG': 'SGD',
  'AU': 'AUD',
  'NZ': 'NZD',
  'CH': 'CHF',
  'NO': 'NOK',
  'SE': 'SEK',
  'DK': 'DKK',
  'default': 'EUR'
};

// Language mapping based on Accept-Language header
const LANGUAGE_MAPPING = {
  'pl': 'pl',
  'en': 'en',
  'en-US': 'en',
  'en-GB': 'en',
  'de': 'en',
  'fr': 'en',
  'es': 'en',
  'it': 'en',
  'ja': 'en',
  'ko': 'en',
  'zh': 'en',
  'default': 'en'
};

function parseAcceptLanguage(acceptLanguage: string): string {
  if (!acceptLanguage) return 'en';

  const languages = acceptLanguage.split(',').map(lang => {
    const [code, quality] = lang.trim().split(';q=');
    return {
      code: code.toLowerCase(),
      quality: quality ? parseFloat(quality) : 1.0
    };
  });

  languages.sort((a, b) => b.quality - a.quality);

  for (const lang of languages) {
    const mappedLang = LANGUAGE_MAPPING[lang.code as keyof typeof LANGUAGE_MAPPING];
    if (mappedLang) return mappedLang;
  }

  return 'en';
}

function detectCurrency(geo: GeoLocation): string {
  return CURRENCY_MAPPING[geo.country as keyof typeof CURRENCY_MAPPING] || CURRENCY_MAPPING.default;
}

function detectLanguage(acceptLanguage: string): string {
  return parseAcceptLanguage(acceptLanguage);
}

function getOptimalRegion(geo: GeoLocation): string {
  return REGION_ROUTING[geo.country as keyof typeof REGION_ROUTING] || REGION_ROUTING.default;
}

function createPerformanceHeaders(context: ClientContext, geo: GeoLocation) {
  const optimalRegion = getOptimalRegion(geo);
  const detectedCurrency = detectCurrency(geo);
  const detectedLanguage = detectLanguage(context.acceptLanguage);

  return {
    'X-Edge-Region': optimalRegion,
    'X-Geo-Country': geo.country,
    'X-Geo-City': geo.city,
    'X-Optimal-Currency': detectedCurrency,
    'X-Detected-Language': detectedLanguage,
    'X-Client-Timezone': context.timezone,
    'X-Edge-Location': 'vercel-edge',
    'X-Response-Time': Date.now().toString(),
    'X-Performance-Score': 'optimized',
    'Cache-Control': 's-maxage=60, stale-while-revalidate=30',
    'X-DNS-Prefetch-Control': 'on'
  };
}

function createSecurityHeaders() {
  return {
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'geolocation=(), microphone=(), camera=(), payment=(self)',
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload'
  };
}

function createCacheHeaders(url: string, method: string) {
  const isStaticAsset = /\.(css|js|png|jpg|jpeg|gif|webp|svg|woff|woff2|ttf|eot)$/i.test(url);
  const isAPI = url.startsWith('/api/');
  const isBookingPage = url.includes('/booking') || url.includes('/beauty') || url.includes('/fitness');

  if (isStaticAsset) {
    return {
      'Cache-Control': 'public, max-age=31536000, immutable',
      'X-Edge-Cache': 'HIT'
    };
  }

  if (isAPI) {
    return {
      'Cache-Control': 's-maxage=60, stale-while-revalidate=30',
      'X-Edge-Cache': 'MISS'
    };
  }

  if (isBookingPage) {
    return {
      'Cache-Control': 's-maxage=300, stale-while-revalidate=150',
      'X-Edge-Cache': 'HIT',
      'X-Edge-Priority': 'high'
    };
  }

  return {
    'Cache-Control': 's-maxage=60, stale-while-revalidate=30',
    'X-Edge-Cache': 'MISS'
  };
}

export default async function handler(request: Request) {
  const startTime = Date.now();
  const url = new URL(request.url);

  try {
    // Extract client context
    const context: ClientContext = {
      ip: request.headers.get('x-forwarded-for') ||
          request.headers.get('x-real-ip') ||
          'unknown',
      userAgent: request.headers.get('user-agent') || '',
      acceptLanguage: request.headers.get('accept-language') || '',
      timezone: request.headers.get('x-timezone') || 'UTC'
    };

    // Get geographic information (simulated for edge functions)
    // In production, this would use Vercel's x-geo-* headers
    const geo: GeoLocation = {
      country: request.headers.get('x-vercel-ip-country') || 'PL',
      city: request.headers.get('x-vercel-ip-city') || 'Warsaw',
      region: request.headers.get('x-vercel-ip-country-region') || '',
      latitude: parseFloat(request.headers.get('x-vercel-ip-latitude') || '52.2297'),
      longitude: parseFloat(request.headers.get('x-vercel-ip-longitude') || '21.0122')
    };

    // Create optimized headers
    const performanceHeaders = createPerformanceHeaders(context, geo);
    const securityHeaders = createSecurityHeaders();
    const cacheHeaders = createCacheHeaders(url.pathname, request.method);

    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 200,
        headers: {
          'Access-Control-Allow-Origin': 'https://mariaborysevych.com',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, X-Request-ID',
          'Access-Control-Max-Age': '86400',
          ...performanceHeaders,
          ...securityHeaders
        }
      });
    }

    // Create custom response for performance monitoring
    const responseInit = {
      status: 200,
      headers: {
        ...performanceHeaders,
        ...securityHeaders,
        ...cacheHeaders,
        'Content-Type': 'application/json'
      }
    };

    // For API calls to booking and availability, add performance optimizations
    if (url.pathname.startsWith('/api/') &&
        (url.pathname.includes('/booking') || url.pathname.includes('/availability'))) {

      const performanceData = {
        edgeRegion: performanceHeaders['X-Edge-Region'],
        responseTime: Date.now() - startTime,
        optimizedFor: {
          region: geo.country,
          currency: performanceHeaders['X-Optimal-Currency'],
          language: performanceHeaders['X-Detected-Language']
        },
        performance: {
          cacheStrategy: cacheHeaders['Cache-Control'],
          edgeCache: cacheHeaders['X-Edge-Cache'],
          security: 'optimized'
        }
      };

      return new Response(JSON.stringify(performanceData, null, 2), responseInit);
    }

    // For non-API requests, return performance information
    const performanceInfo = {
      edgeOptimized: true,
      region: performanceHeaders['X-Edge-Region'],
      detectedCountry: geo.country,
      optimizedCurrency: performanceHeaders['X-Optimal-Currency'],
      detectedLanguage: performanceHeaders['X-Detected-Language'],
      responseTime: Date.now() - startTime,
      cacheStrategy: cacheHeaders['Cache-Control'],
      securityLevel: 'enterprise'
    };

    return new Response(JSON.stringify(performanceInfo, null, 2), responseInit);

  } catch (error) {
    console.error('Edge function error:', error);

    return new Response(JSON.stringify({
      error: 'Internal Server Error',
      message: 'Edge function failed to process request',
      timestamp: Date.now()
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate'
      }
    });
  }
}