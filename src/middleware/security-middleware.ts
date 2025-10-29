/**
 * Security Headers Middleware
 *
 * Provides security headers for API responses to protect against common web vulnerabilities
 * including XSS, clickjacking, content type sniffing, and other attacks.
 */

import type { Context, Next } from 'hono';

export interface SecurityConfig {
  // Content Security Policy
  csp?: {
    defaultSrc?: string[];
    scriptSrc?: string[];
    styleSrc?: string[];
    imgSrc?: string[];
    connectSrc?: string[];
    fontSrc?: string[];
    objectSrc?: string[];
    mediaSrc?: string[];
    frameSrc?: string[];
    childSrc?: string[];
    workerSrc?: string[];
    manifestSrc?: string[];
    upgradeInsecureRequests?: boolean;
  };

  // Other security headers
  crossOriginEmbedderPolicy?: boolean;
  crossOriginOpenerPolicy?: boolean;
  crossOriginResourcePolicy?: boolean;
  dnsPrefetchControl?: boolean;
  frameOptions?: 'DENY' | 'SAMEORIGIN' | 'ALLOW-FROM';
  hsts?: {
    maxAge?: number;
    includeSubDomains?: boolean;
    preload?: boolean;
  };
  noSniff?: boolean;
  originAgentCluster?: boolean;
  permittedCrossDomainPolicies?: boolean;
  referrerPolicy?: string;
  xssProtection?: boolean;
}

const defaultConfig: SecurityConfig = {
  csp: {
    defaultSrc: ["'self'"],
    scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", 'https://js.stripe.com', 'https://cdn.jsdelivr.net'],
    styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
    imgSrc: ["'self'", 'data:', 'https:', 'https://*.supabase.co'],
    connectSrc: ["'self'", 'https://api.stripe.com', 'https://lckxvimdqnfjzkbrusgu.supabase.co'],
    fontSrc: ["'self'", 'https://fonts.gstatic.com'],
    objectSrc: ["'none'"],
    mediaSrc: ["'self'"],
    frameSrc: ["'none'"],
    childSrc: ["'none'"],
    workerSrc: ["'self'"],
    manifestSrc: ["'self'"],
    upgradeInsecureRequests: false
  },
  crossOriginEmbedderPolicy: false,
  crossOriginOpenerPolicy: false,
  crossOriginResourcePolicy: false,
  dnsPrefetchControl: true,
  frameOptions: 'DENY',
  hsts: {
    maxAge: 31536000, // 1 year
    includeSubDomains: true,
    preload: false
  },
  noSniff: true,
  originAgentCluster: true,
  permittedCrossDomainPolicies: false,
  referrerPolicy: 'strict-origin-when-cross-origin',
  xssProtection: true
};

/**
 * Build CSP header value from configuration
 */
function buildCspHeader(csp: SecurityConfig['csp']): string {
  if (!csp) return '';

  const directives: string[] = [];

  const addDirective = (name: string, values: string[] = []) => {
    if (values.length > 0) {
      directives.push(`${name} ${values.join(' ')}`);
    }
  };

  addDirective('default-src', csp.defaultSrc);
  addDirective('script-src', csp.scriptSrc);
  addDirective('style-src', csp.styleSrc);
  addDirective('img-src', csp.imgSrc);
  addDirective('connect-src', csp.connectSrc);
  addDirective('font-src', csp.fontSrc);
  addDirective('object-src', csp.objectSrc);
  addDirective('media-src', csp.mediaSrc);
  addDirective('frame-src', csp.frameSrc);
  addDirective('child-src', csp.childSrc);
  addDirective('worker-src', csp.workerSrc);
  addDirective('manifest-src', csp.manifestSrc);

  if (csp.upgradeInsecureRequests) {
    directives.push('upgrade-insecure-requests');
  }

  return directives.join('; ');
}

/**
 * Security middleware for Hono
 */
export function securityMiddleware(config: Partial<SecurityConfig> = {}) {
  const finalConfig = { ...defaultConfig, ...config };

  return async (c: Context, next: Next) => {
    // Content Security Policy
    if (finalConfig.csp) {
      const cspValue = buildCspHeader(finalConfig.csp);
      if (cspValue) {
        c.header('Content-Security-Policy', cspValue);
      }
    }

    // Cross-Origin Embedder Policy
    if (finalConfig.crossOriginEmbedderPolicy) {
      c.header('Cross-Origin-Embedder-Policy', 'require-corp');
    }

    // Cross-Origin Opener Policy
    if (finalConfig.crossOriginOpenerPolicy) {
      c.header('Cross-Origin-Opener-Policy', 'same-origin');
    }

    // Cross-Origin Resource Policy
    if (finalConfig.crossOriginResourcePolicy) {
      c.header('Cross-Origin-Resource-Policy', 'same-origin');
    }

    // DNS Prefetch Control
    if (finalConfig.dnsPrefetchControl) {
      c.header('X-DNS-Prefetch-Control', 'off');
    }

    // Frame Options (X-Frame-Options)
    if (finalConfig.frameOptions) {
      c.header('X-Frame-Options', finalConfig.frameOptions);
    }

    // HTTP Strict Transport Security (HSTS)
    if (finalConfig.hsts) {
      const hstsValue = [
        `max-age=${finalConfig.hsts.maxAge || 31536000}`
      ];

      if (finalConfig.hsts.includeSubDomains) {
        hstsValue.push('includeSubDomains');
      }

      if (finalConfig.hsts.preload) {
        hstsValue.push('preload');
      }

      c.header('Strict-Transport-Security', hstsValue.join('; '));
    }

    // MIME Type Sniffing Protection
    if (finalConfig.noSniff) {
      c.header('X-Content-Type-Options', 'nosniff');
    }

    // Origin Agent Cluster
    if (finalConfig.originAgentCluster) {
      c.header('Origin-Agent-Cluster', '?1');
    }

    // X-Permitted-Cross-Domain-Policies
    if (!finalConfig.permittedCrossDomainPolicies) {
      c.header('X-Permitted-Cross-Domain-Policies', 'none');
    }

    // Referrer Policy
    if (finalConfig.referrerPolicy) {
      c.header('Referrer-Policy', finalConfig.referrerPolicy);
    }

    // XSS Protection (legacy)
    if (finalConfig.xssProtection) {
      c.header('X-XSS-Protection', '1; mode=block');
    }

    // Additional security headers
    c.header('Permissions-Policy', 'geolocation=(), microphone=(), camera=(), payment=(), usb=()');
    c.header('X-Download-Options', 'noopen');
    c.header('X-Permitted-Cross-Domain-Policies', 'none');
    c.header('X-Robots-Tag', 'noindex, nofollow, nosnippet, noarchive');

    // Remove server information
    c.header('Server', '');
    c.header('X-Powered-By', '');

    await next();
  };
}

/**
 * CORS middleware for proper cross-origin resource sharing
 */
export function corsMiddleware(config: {
  origins?: string[];
  methods?: string[];
  headers?: string[];
  credentials?: boolean;
  maxAge?: number;
} = {}) {
  const {
    origins = ['http://localhost:8080', 'https://mariia-hub.com'],
    methods = ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    headers = ['Content-Type', 'Authorization', 'X-Requested-With'],
    credentials = true,
    maxAge = 86400 // 24 hours
  } = config;

  return async (c: Context, next: Next) => {
    const origin = c.req.header('Origin');

    // Check if origin is allowed
    if (origin && (origins.includes('*') || origins.includes(origin))) {
      c.header('Access-Control-Allow-Origin', origin);
    } else if (!origin) {
      c.header('Access-Control-Allow-Origin', origins[0] || '*');
    }

    c.header('Access-Control-Allow-Methods', methods.join(', '));
    c.header('Access-Control-Allow-Headers', headers.join(', '));
    c.header('Access-Control-Max-Age', maxAge.toString());

    if (credentials) {
      c.header('Access-Control-Allow-Credentials', 'true');
    }

    // Handle preflight requests
    if (c.req.method === 'OPTIONS') {
      c.status(200);
      return c.body('');
    }

    await next();
  };
}

/**
 * Rate limiting middleware for security
 */
export function securityRateLimit(config: {
  windowMs?: number;
  max?: number;
  message?: string;
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
} = {}) {
  const {
    windowMs = 15 * 60 * 1000, // 15 minutes
    max = 100, // limit each IP to 100 requests per windowMs
    message = 'Too many requests from this IP, please try again later.',
    skipSuccessfulRequests = false,
    skipFailedRequests = false
  } = config;

  const requests = new Map<string, { count: number; resetTime: number }>();

  return async (c: Context, next: Next) => {
    const ip = c.req.header('x-forwarded-for') ||
               c.req.header('x-real-ip') ||
               'unknown';

    const now = Date.now();
    const requestData = requests.get(ip);

    if (!requestData || now > requestData.resetTime) {
      // Reset or create new request counter
      requests.set(ip, {
        count: 1,
        resetTime: now + windowMs
      });
    } else {
      requestData.count++;
    }

    // Check if rate limit exceeded
    if (requestData.count > max) {
      c.status(429);
      return c.json({
        error: 'Rate Limit Exceeded',
        message,
        retryAfter: Math.ceil((requestData.resetTime - now) / 1000)
      });
    }

    // Clean up old entries
    for (const [key, data] of requests.entries()) {
      if (now > data.resetTime) {
        requests.delete(key);
      }
    }

    // Add rate limit headers
    c.header('X-RateLimit-Limit', max.toString());
    c.header('X-RateLimit-Remaining', Math.max(0, max - requestData.count).toString());
    c.header('X-RateLimit-Reset', new Date(requestData.resetTime).toISOString());

    await next();
  };
}