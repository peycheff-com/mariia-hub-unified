/**
 * Enhanced Production Security Configuration
 *
 * This file provides comprehensive security configuration for production deployment
 * meeting enterprise-grade security standards for the European luxury market.
 */

export interface ProductionSecurityConfig {
  // Content Security Policy Level 3
  csp: {
    // Directives with strict CSP3 compliance
    defaultSrc: string[];
    scriptSrc: string[];
    styleSrc: string[];
    imgSrc: string[];
    connectSrc: string[];
    fontSrc: string[];
    objectSrc: string[];
    mediaSrc: string[];
    frameSrc: string[];
    childSrc: string[];
    workerSrc: string[];
    manifestSrc: string[];
    prefetchSrc: string[];
    // Enhanced CSP3 directives
    requireTrustedTypesFor?: string[];
    trustedTypes?: string[];
    reportTo?: string;
    reportSample?: string;
    // Security features
    upgradeInsecureRequests: boolean;
    blockAllMixedContent: boolean;
  };

  // HTTP Security Headers
  hsts: {
    maxAge: number;
    includeSubDomains: boolean;
    preload: boolean;
    preloaded?: boolean;
  };

  // Cross-Origin Policies
  crossOriginEmbedderPolicy: 'require-corp' | 'unsafe-none';
  crossOriginOpenerPolicy: 'same-origin' | 'same-origin-allow-popups' | 'unsafe-none';
  crossOriginResourcePolicy: 'same-origin' | 'same-site' | 'cross-origin';

  // Feature Policy (Permissions Policy)
  permissionsPolicy: {
    [key: string]: ('*' | 'self' | 'src' | 'none' | string)[];
  };

  // Additional Security Headers
  referrerPolicy: string;
  frameOptions: 'DENY' | 'SAMEORIGIN' | 'ALLOW-FROM';
  contentTypeOptions: boolean;
  downloadOptions: boolean;
  permittedCrossDomainPolicies: 'none' | 'master-only' | 'by-content-type' | 'all';

  // Rate Limiting Configuration
  rateLimiting: {
    enabled: boolean;
    windowMs: number;
    maxRequests: number;
    maxRequestsPerSecond: number;
    skipSuccessfulRequests: boolean;
    skipFailedRequests: boolean;
    burstLimit: number;
    emergencyThrottling: {
      enabled: boolean;
      threshold: number;
      action: 'throttle' | 'block' | 'challenge';
    };
  };

  // DDoS Protection
  ddosProtection: {
    enabled: boolean;
    level: 'low' | 'medium' | 'high' | 'maximum';
    botDetection: boolean;
    ipWhitelist: string[];
    ipBlacklist: string[];
    geoBlocking: {
      enabled: boolean;
      allowedCountries: string[];
      blockedCountries: string[];
    };
  };

  // Web Application Firewall Rules
  waf: {
    enabled: boolean;
    rules: {
      sqlInjection: boolean;
      xssProtection: boolean;
      csrfProtection: boolean;
      fileUploadSecurity: boolean;
      inputValidation: boolean;
      pathTraversal: boolean;
      commandInjection: boolean;
      ldapInjection: boolean;
      xmlInjection: boolean;
      httpResponseSplitting: boolean;
    };
    customRules: Array<{
      name: string;
      pattern: RegExp;
      action: 'allow' | 'block' | 'log' | 'challenge';
      priority: number;
    }>;
  };

  // Security Monitoring
  monitoring: {
    enabled: boolean;
    logLevel: 'info' | 'warn' | 'error' | 'critical';
    logFormat: 'json' | 'cef' | 'leef';
    alerting: {
      enabled: boolean;
      webhookUrl?: string;
      emailRecipients: string[];
      slackChannel?: string;
      threshold: {
        failedLogins: number;
        suspiciousRequests: number;
        blockedRequests: number;
      };
    };
    retention: {
      days: number;
      encrypted: boolean;
      backup: boolean;
    };
  };

  // GDPR Compliance
  gdpr: {
    enabled: boolean;
    consentManagement: boolean;
    dataRetentionDays: number;
    anonymizationEnabled: boolean;
    rightToDeletion: boolean;
    dataPortability: boolean;
    auditLogging: boolean;
    cookieConsent: {
      required: boolean;
      categories: string[];
      autoBlock: boolean;
      consentExpiry: number;
    };
  };

  // Encryption Configuration
  encryption: {
    inTransit: {
      tlsVersion: '1.2' | '1.3';
      cipherSuites: string[];
      hstsEnabled: boolean;
      certificatePinning: boolean;
    };
    atRest: {
      enabled: boolean;
      algorithm: string;
      keyRotationDays: number;
      keyManagement: 'aws-kms' | 'azure-keyvault' | 'gcp-kms' | 'hashicorp-vault';
    };
    backup: {
      enabled: boolean;
      encrypted: boolean;
      offsite: boolean;
      retentionDays: number;
    };
  };

  // Authentication & Authorization
  authentication: {
    sessionTimeout: number;
    maxConcurrentSessions: number;
    passwordPolicy: {
      minLength: number;
      requireUppercase: boolean;
      requireLowercase: boolean;
      requireNumbers: boolean;
      requireSpecialChars: boolean;
      maxAge: number;
      historyCount: number;
      lockoutThreshold: number;
      lockoutDuration: number;
    };
    mfa: {
      enabled: boolean;
      required: boolean;
      methods: ('totp' | 'sms' | 'email' | 'hardware-key')[];
      backupCodes: boolean;
    };
    sso: {
      enabled: boolean;
      providers: ('saml' | 'oidc' | 'ldap')[];
      enforced: boolean;
    };
  };

  // API Security
  api: {
    versioning: boolean;
    documentation: boolean;
    keyBasedAuth: boolean;
    jwtValidation: boolean;
    requestValidation: boolean;
    responseSanitization: boolean;
    rateLimitPerEndpoint: boolean;
    corsStrictMode: boolean;
  };
}

// Production Security Configuration
export const productionSecurityConfig: ProductionSecurityConfig = {
  // Content Security Policy Level 3 with strict configuration
  csp: {
    defaultSrc: ["'self'"],
    scriptSrc: [
      "'self'",
      "'unsafe-inline'",
      // Specific script hashes for production
      "'sha256-Fz5Kmm3O62MYX5rZJBjiwvEn8/xdrvXGwj9g7W4N3mY='",
      "'sha256-31fQF/g9KGmEnutu6M7cTHdK4cN5J5z5NRerO5mFMfQ='",
      "'sha256-v/A0YLD5IwKQNhMmvqqZhFG/VgGpkYk5HwQGk8lYFqQ='",
      // Trusted third-party domains
      'https://js.stripe.com',
      'https://www.googletagmanager.com',
      'https://www.google-analytics.com',
      'https://fonts.googleapis.com',
      'https://cdn.jsdelivr.net',
      // Supabase domains
      'https://fxpwracjakqpqpoivypm.supabase.co',
      'https://fxpwracjakqpqpoivypm.supabase.in'
    ],
    styleSrc: [
      "'self'",
      "'unsafe-inline'",
      'https://fonts.googleapis.com',
      'https://cdn.jsdelivr.net'
    ],
    imgSrc: [
      "'self'",
      'data:',
      'blob:',
      'https:',
      // CDN and image domains
      'https://cdn.mariaborysevych.com',
      'https://*.supabase.co',
      'https://*.stripe.com',
      'https://www.google-analytics.com',
      'https://www.googletagmanager.com'
    ],
    connectSrc: [
      "'self'",
      // API endpoints
      'https://api.mariaborysevych.com',
      'https://fxpwracjakqpqpoivypm.supabase.co',
      'https://fxpwracjakqpqpoivypm.supabase.in',
      'https://api.stripe.com',
      'https://www.google-analytics.com',
      'https://region1.google-analytics.com',
      'https://www.googletagmanager.com'
    ],
    fontSrc: [
      "'self'",
      'https://fonts.gstatic.com',
      'https://cdn.jsdelivr.net'
    ],
    objectSrc: ["'none'"],
    mediaSrc: ["'self'"],
    frameSrc: [
      "'self'",
      'https://js.stripe.com' // For Stripe Elements
    ],
    childSrc: ["'self'"],
    workerSrc: ["'self'", 'blob:'],
    manifestSrc: ["'self'"],
    prefetchSrc: ["'self'"],
    requireTrustedTypesFor: ["'script'"],
    trustedTypes: ['*'],
    reportTo: 'csp-endpoint',
    upgradeInsecureRequests: true,
    blockAllMixedContent: true
  },

  // HTTP Strict Transport Security
  hsts: {
    maxAge: 31536000, // 1 year
    includeSubDomains: true,
    preload: true,
    preloaded: true
  },

  // Cross-Origin Policies
  crossOriginEmbedderPolicy: 'require-corp',
  crossOriginOpenerPolicy: 'same-origin',
  crossOriginResourcePolicy: 'same-origin',

  // Feature Policy (Permissions Policy) - GDPR compliant
  permissionsPolicy: {
    'geolocation': ['none'],
    'microphone': ['none'],
    'camera': ['none'],
    'payment': ['self'],
    'usb': ['none'],
    'magnetometer': ['none'],
    'gyroscope': ['none'],
    'accelerometer': ['none'],
    'ambient-light-sensor': ['none'],
    'autoplay': ['self'],
    'encrypted-media': ['self'],
    'fullscreen': ['self'],
    'picture-in-picture': ['self'],
    'speaker': ['self'],
    'sync-xhr': ['self'],
    'unload': ['self']
  },

  // Additional Security Headers
  referrerPolicy: 'strict-origin-when-cross-origin',
  frameOptions: 'DENY',
  contentTypeOptions: true,
  downloadOptions: true,
  permittedCrossDomainPolicies: 'none',

  // Advanced Rate Limiting
  rateLimiting: {
    enabled: true,
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 1000, // Base limit
    maxRequestsPerSecond: 10,
    skipSuccessfulRequests: false,
    skipFailedRequests: false,
    burstLimit: 50,
    emergencyThrottling: {
      enabled: true,
      threshold: 100, // Trigger emergency at 100 requests/minute
      action: 'throttle'
    }
  },

  // DDoS Protection Configuration
  ddosProtection: {
    enabled: true,
    level: 'high',
    botDetection: true,
    ipWhitelist: [
      // Add trusted IPs here
    ],
    ipBlacklist: [
      // Add known malicious IPs here
    ],
    geoBlocking: {
      enabled: false, // Generally disabled for European business
      allowedCountries: ['PL', 'DE', 'FR', 'GB', 'IT', 'ES', 'NL', 'BE', 'AT', 'CH'],
      blockedCountries: []
    }
  },

  // Web Application Firewall Rules
  waf: {
    enabled: true,
    rules: {
      sqlInjection: true,
      xssProtection: true,
      csrfProtection: true,
      fileUploadSecurity: true,
      inputValidation: true,
      pathTraversal: true,
      commandInjection: true,
      ldapInjection: true,
      xmlInjection: true,
      httpResponseSplitting: true
    },
    customRules: [
      {
        name: 'Block suspicious user agents',
        pattern: /(sqlmap|nikto|nmap|curl|wget|python|perl|java|go-http|ruby)/i,
        action: 'block',
        priority: 1
      },
      {
        name: 'Protect admin endpoints',
        pattern: /\/admin\//i,
        action: 'challenge',
        priority: 2
      },
      {
        name: 'Block common attack patterns',
        pattern: /(\.\.|\/etc\/passwd|\/proc\/|union\s+select|select\s+.*\s+from|insert\s+into|delete\s+from|drop\s+table)/i,
        action: 'block',
        priority: 1
      }
    ]
  },

  // Security Monitoring and Alerting
  monitoring: {
    enabled: true,
    logLevel: 'warn',
    logFormat: 'json',
    alerting: {
      enabled: true,
      emailRecipients: ['security@mariaborysevych.com'],
      slackChannel: '#security-alerts',
      threshold: {
        failedLogins: 5,
        suspiciousRequests: 10,
        blockedRequests: 50
      }
    },
    retention: {
      days: 365,
      encrypted: true,
      backup: true
    }
  },

  // GDPR Compliance Configuration
  gdpr: {
    enabled: true,
    consentManagement: true,
    dataRetentionDays: 365,
    anonymizationEnabled: true,
    rightToDeletion: true,
    dataPortability: true,
    auditLogging: true,
    cookieConsent: {
      required: true,
      categories: ['necessary', 'analytics', 'marketing', 'functional'],
      autoBlock: true,
      consentExpiry: 365
    }
  },

  // Encryption Configuration
  encryption: {
    inTransit: {
      tlsVersion: '1.3',
      cipherSuites: [
        'TLS_AES_256_GCM_SHA384',
        'TLS_CHACHA20_POLY1305_SHA256',
        'TLS_AES_128_GCM_SHA256'
      ],
      hstsEnabled: true,
      certificatePinning: true
    },
    atRest: {
      enabled: true,
      algorithm: 'AES-256-GCM',
      keyRotationDays: 90,
      keyManagement: 'aws-kms'
    },
    backup: {
      enabled: true,
      encrypted: true,
      offsite: true,
      retentionDays: 2555 // 7 years
    }
  },

  // Authentication and Authorization
  authentication: {
    sessionTimeout: 30 * 60, // 30 minutes
    maxConcurrentSessions: 3,
    passwordPolicy: {
      minLength: 12,
      requireUppercase: true,
      requireLowercase: true,
      requireNumbers: true,
      requireSpecialChars: true,
      maxAge: 90,
      historyCount: 12,
      lockoutThreshold: 5,
      lockoutDuration: 15 * 60 // 15 minutes
    },
    mfa: {
      enabled: true,
      required: true,
      methods: ['totp', 'sms', 'hardware-key'],
      backupCodes: true
    },
    sso: {
      enabled: false,
      providers: [],
      enforced: false
    }
  },

  // API Security Configuration
  api: {
    versioning: true,
    documentation: false, // Disable in production
    keyBasedAuth: true,
    jwtValidation: true,
    requestValidation: true,
    responseSanitization: true,
    rateLimitPerEndpoint: true,
    corsStrictMode: true
  }
};

// Export configuration by security level
export const securityLevels = {
  development: {
    ...productionSecurityConfig,
    monitoring: { ...productionSecurityConfig.monitoring, logLevel: 'info' as const },
    rateLimiting: { ...productionSecurityConfig.rateLimiting, maxRequests: 5000 },
    ddosProtection: { ...productionSecurityConfig.ddosProtection, level: 'low' as const }
  },

  staging: {
    ...productionSecurityConfig,
    monitoring: { ...productionSecurityConfig.monitoring, logLevel: 'warn' as const },
    rateLimiting: { ...productionSecurityConfig.rateLimiting, maxRequests: 2000 },
    ddosProtection: { ...productionSecurityConfig.ddosProtection, level: 'medium' as const }
  },

  production: productionSecurityConfig
};

export default productionSecurityConfig;