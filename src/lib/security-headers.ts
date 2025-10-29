/**
 * Security Headers Configuration
 *
 * Comprehensive security headers implementation for production deployment
 * with CSP, HSTS, and other critical security headers.
 */

interface SecurityHeadersConfig {
  csp: ContentSecurityPolicy;
  hsts: StrictTransportSecurity;
  frameOptions: string;
  contentTypeOptions: string;
  referrerPolicy: string;
  permissionsPolicy: Record<string, boolean | string[]>;
  customHeaders: Record<string, string>;
}

interface ContentSecurityPolicy {
  defaultSrc: string[];
  scriptSrc: string[];
  styleSrc: string[];
  imgSrc: string[];
  fontSrc: string[];
  connectSrc: string[];
  mediaSrc: string[];
  objectSrc: string[];
  childSrc: string[];
  workerSrc: string[];
  manifestSrc: string[];
  baseUri: string[];
  formAction: string[];
  frameAncestors: string[];
  upgradeInsecureRequests: boolean;
  blockAllMixedContent: boolean;
}

interface StrictTransportSecurity {
  maxAge: number;
  includeSubDomains: boolean;
  preload: boolean;
}

class SecurityHeadersManager {
  private isProduction: boolean;
  private nonce: string | null = null;

  constructor() {
    this.isProduction = import.meta.env.VITE_APP_ENV === 'production';
  }

  /**
   * Generate a cryptographic nonce for CSP
   */
  public generateNonce(): string {
    if (import.meta.env.VITE_CSP_NONCE_GENERATION === 'true') {
      // Generate cryptographically secure random nonce
      const array = new Uint8Array(16);
      crypto.getRandomValues(array);
      this.nonce = Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
    } else {
      this.nonce = null;
    }
    return this.nonce || '';
  }

  /**
   * Get the current nonce (for inline scripts/styles)
   */
  public getCurrentNonce(): string | null {
    return this.nonce;
  }

  /**
   * Build comprehensive CSP header
   */
  private buildCSP(csp: ContentSecurityPolicy): string {
    const directives: string[] = [];

    // Default source
    if (csp.defaultSrc.length > 0) {
      directives.push(`default-src ${csp.defaultSrc.join(' ')}`);
    }

    // Script sources
    const scriptSources = [...csp.scriptSrc];
    if (this.nonce) {
      scriptSources.push(`'nonce-${this.nonce}'`);
    }
    if (scriptSources.length > 0) {
      directives.push(`script-src ${scriptSources.join(' ')}`);
    }

    // Style sources
    const styleSources = [...csp.styleSrc];
    if (this.nonce) {
      styleSources.push(`'nonce-${this.nonce}'`);
    }
    if (styleSources.length > 0) {
      directives.push(`style-src ${styleSources.join(' ')}`);
    }

    // Image sources
    if (csp.imgSrc.length > 0) {
      directives.push(`img-src ${csp.imgSrc.join(' ')}`);
    }

    // Font sources
    if (csp.fontSrc.length > 0) {
      directives.push(`font-src ${csp.fontSrc.join(' ')}`);
    }

    // Connect sources
    if (csp.connectSrc.length > 0) {
      directives.push(`connect-src ${csp.connectSrc.join(' ')}`);
    }

    // Media sources
    if (csp.mediaSrc.length > 0) {
      directives.push(`media-src ${csp.mediaSrc.join(' ')}`);
    }

    // Object sources
    if (csp.objectSrc.length > 0) {
      directives.push(`object-src ${csp.objectSrc.join(' ')}`);
    }

    // Child sources
    if (csp.childSrc.length > 0) {
      directives.push(`child-src ${csp.childSrc.join(' ')}`);
    }

    // Worker sources
    if (csp.workerSrc.length > 0) {
      directives.push(`worker-src ${csp.workerSrc.join(' ')}`);
    }

    // Manifest sources
    if (csp.manifestSrc.length > 0) {
      directives.push(`manifest-src ${csp.manifestSrc.join(' ')}`);
    }

    // Base URI
    if (csp.baseUri.length > 0) {
      directives.push(`base-uri ${csp.baseUri.join(' ')}`);
    }

    // Form action
    if (csp.formAction.length > 0) {
      directives.push(`form-action ${csp.formAction.join(' ')}`);
    }

    // Frame ancestors
    if (csp.frameAncestors.length > 0) {
      directives.push(`frame-ancestors ${csp.frameAncestors.join(' ')}`);
    }

    // Security enhancements
    if (csp.upgradeInsecureRequests) {
      directives.push('upgrade-insecure-requests');
    }

    if (csp.blockAllMixedContent) {
      directives.push('block-all-mixed-content');
    }

    return directives.join('; ');
  }

  /**
   * Get security headers configuration
   */
  public getSecurityHeadersConfig(): SecurityHeadersConfig {
    const appUrl = import.meta.env.VITE_APP_URL || 'https://localhost:8080';
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
    const stripeKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || '';
    const sentryDsn = import.meta.env.VITE_SENTRY_DSN || '';
    const gtmId = import.meta.env.VITE_GTM_CONTAINER_ID || '';

    // Extract domains from URLs
    const supabaseDomain = supabaseUrl ? new URL(supabaseUrl).hostname : '';
    const appDomain = new URL(appUrl).hostname;

    return {
      csp: {
        defaultSrc: ["'self'"],
        scriptSrc: [
          "'self'",
          "'unsafe-eval'", // Needed for Vite dev server, remove in production
          ...(this.isProduction ? [] : ["'unsafe-inline'"]), // Only in development
          ...(sentryDsn ? [new URL(sentryDsn).hostname] : []),
          ...(gtmId ? ['www.googletagmanager.com'] : []),
          ...(stripeKey.startsWith('pk_live_') ? ['js.stripe.com'] : ['js.stripe.com']),
          'https://*.supabase.co',
        ],
        styleSrc: [
          "'self'",
          "'unsafe-inline'", // Needed for styled-components and inline styles
          'fonts.googleapis.com',
        ],
        imgSrc: [
          "'self'",
          'data:',
          'blob:',
          'https://*.supabase.co',
          'https://*.stripe.com',
          ...(gtmId ? ['www.googletagmanager.com'] : []),
        ],
        fontSrc: [
          "'self'",
          'data:',
          'fonts.gstatic.com',
        ],
        connectSrc: [
          "'self'",
          supabaseDomain,
          ...(sentryDsn ? [new URL(sentryDsn).hostname] : []),
          ...(stripeKey ? ['api.stripe.com'] : []),
          ...(gtmId ? ['www.googletagmanager.com'] : []),
        ],
        mediaSrc: ["'self'"],
        objectSrc: ["'none'"], // Prevent plugins like Flash
        childSrc: ["'self'"],
        workerSrc: ["'self'", 'blob:'],
        manifestSrc: ["'self'"],
        baseUri: ["'self'"],
        formAction: ["'self'", ...(stripeKey ? ['js.stripe.com'] : [])],
        frameAncestors: ["'none'"], // Prevent clickjacking
        upgradeInsecureRequests: this.isProduction,
        blockAllMixedContent: this.isProduction,
      },
      hsts: {
        maxAge: this.isProduction ? 31536000 : 0, // 1 year in production, disabled in dev
        includeSubDomains: this.isProduction,
        preload: this.isProduction,
      },
      frameOptions: 'DENY',
      contentTypeOptions: 'nosniff',
      referrerPolicy: 'strict-origin-when-cross-origin',
      permissionsPolicy: {
        // Geolocation
        geolocation: ['self'],
        // Camera and microphone
        camera: ['none'],
        microphone: ['none'],
        // Payment
        payment: ['self'],
        // USB
        usb: ['none'],
        // Magnetometer
        magnetometer: ['none'],
        // Gyroscope
        gyroscope: ['none'],
        // Accelerometer
        accelerometer: ['none'],
        // Ambient light sensor
        'ambient-light-sensor': ['none'],
        // Notifications
        notifications: ['self'],
        // Push
        'push': ['self'],
        // Screen wake lock
        'screen-wake-lock': ['self'],
        // Web share
        'web-share': ['self'],
      },
      customHeaders: {
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'DENY',
        'X-XSS-Protection': '1; mode=block',
        'Referrer-Policy': 'strict-origin-when-cross-origin',
        'Permissions-Policy': this.buildPermissionsPolicy({
          geolocation: ['self'],
          camera: ['none'],
          microphone: ['none'],
          payment: ['self'],
          usb: ['none'],
          magnetometer: ['none'],
          gyroscope: ['none'],
          accelerometer: ['none'],
          'ambient-light-sensor': ['none'],
          notifications: ['self'],
          push: ['self'],
          'screen-wake-lock': ['self'],
          'web-share': ['self'],
        }),
        ...(this.isProduction && {
          'Strict-Transport-Security': this.buildHSTS({
            maxAge: 31536000,
            includeSubDomains: true,
            preload: true,
          }),
        }),
        // Cache control for security
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    };
  }

  /**
   * Build HSTS header value
   */
  private buildHSTS(hsts: StrictTransportSecurity): string {
    const directives = [`max-age=${hsts.maxAge}`];
    if (hsts.includeSubDomains) {
      directives.push('includeSubDomains');
    }
    if (hsts.preload) {
      directives.push('preload');
    }
    return directives.join('; ');
  }

  /**
   * Build Permissions-Policy header value
   */
  private buildPermissionsPolicy(permissions: Record<string, boolean | string[]>): string {
    const directives = Object.entries(permissions).map(([feature, value]) => {
      if (typeof value === 'boolean') {
        return value ? feature : `${feature}=()`;
      }
      return `${feature}=(${value.join(' ')})`;
    });
    return directives.join(', ');
  }

  /**
   * Get all security headers for server configuration
   */
  public getServerSecurityHeaders(): Record<string, string> {
    if (import.meta.env.VITE_SECURITY_HEADERS_ENABLED !== 'true') {
      return {};
    }

    const config = this.getSecurityHeadersConfig();
    const headers: Record<string, string> = {
      ...config.customHeaders,
      'Content-Security-Policy': this.buildCSP(config.csp),
    };

    return headers;
  }

  /**
   * Get nonce attribute for inline scripts/styles
   */
  public getNonceAttribute(): { nonce?: string } {
    return this.nonce ? { nonce: this.nonce } : {};
  }

  /**
   * Validate current CSP configuration
   */
  public validateCSP(): { valid: boolean; warnings: string[] } {
    const warnings: string[] = [];
    const config = this.getSecurityHeadersConfig();

    // Check for unsafe inline in production
    if (this.isProduction) {
      if (config.csp.scriptSrc.includes("'unsafe-inline'")) {
        warnings.push('CSP: script-src contains \'unsafe-inline\' in production');
      }
      if (config.csp.styleSrc.includes("'unsafe-inline'")) {
        warnings.push('CSP: style-src contains \'unsafe-inline\' in production (consider using CSS hashes)');
      }
    }

    // Check for unsafe-eval in production
    if (this.isProduction && config.csp.scriptSrc.includes("'unsafe-eval'")) {
      warnings.push('CSP: script-src contains \'unsafe-eval\' in production');
    }

    // Check for wildcard sources
    if (config.csp.scriptSrc.includes('*')) {
      warnings.push('CSP: script-src contains wildcard (*) which is insecure');
    }

    return {
      valid: warnings.length === 0,
      warnings,
    };
  }

  /**
   * Get security headers for middleware/API routes
   */
  public getApiSecurityHeaders(): Record<string, string> {
    return {
      'Content-Type': 'application/json',
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'X-XSS-Protection': '1; mode=block',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'Cache-Control': 'no-store, no-cache, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
      ...(this.isProduction && {
        'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
      }),
    };
  }
}

// Create singleton instance
const securityHeadersManager = new SecurityHeadersManager();

// Export functions for use in application
export const generateSecurityNonce = (): string => {
  return securityHeadersManager.generateNonce();
};

export const getCurrentSecurityNonce = (): string | null => {
  return securityHeadersManager.getCurrentNonce();
};

export const getNonceAttribute = (): { nonce?: string } => {
  return securityHeadersManager.getNonceAttribute();
};

export const getServerSecurityHeaders = (): Record<string, string> => {
  return securityHeadersManager.getServerSecurityHeaders();
};

export const getApiSecurityHeaders = (): Record<string, string> => {
  return securityHeadersManager.getApiSecurityHeaders();
};

export const validateSecurityConfiguration = (): { valid: boolean; warnings: string[] } => {
  return securityHeadersManager.validateCSP();
};

// Initialize nonce generation if enabled
if (import.meta.env.VITE_CSP_NONCE_GENERATION === 'true') {
  generateSecurityNonce();
}

export default securityHeadersManager;