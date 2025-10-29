/**
 * Environment Variable Security Validation
 *
 * This module provides comprehensive validation for environment variables
 * with security checks, type validation, and production safety measures.
 */

interface EnvVarConfig {
  name: string;
  required: boolean;
  type: 'string' | 'number' | 'boolean' | 'url' | 'email' | 'api-key';
  productionOnly?: boolean;
  sensitive: boolean;
  pattern?: RegExp;
  validator?: (value: string) => boolean;
  errorMessage?: string;
}

interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  securityIssues: string[];
}

class EnvironmentValidator {
  private configs: EnvVarConfig[] = [
    // Core Application Configuration
    {
      name: 'VITE_APP_NAME',
      required: true,
      type: 'string',
      sensitive: false,
    },
    {
      name: 'VITE_APP_URL',
      required: true,
      type: 'url',
      sensitive: false,
      pattern: /^https:\/\//,
      errorMessage: 'VITE_APP_URL must be a valid HTTPS URL in production',
    },
    {
      name: 'VITE_APP_ENV',
      required: true,
      type: 'string',
      sensitive: false,
      validator: (value) => ['development', 'staging', 'production'].includes(value),
      errorMessage: 'VITE_APP_ENV must be one of: development, staging, production',
    },

    // Supabase Configuration
    {
      name: 'VITE_SUPABASE_URL',
      required: true,
      type: 'url',
      sensitive: false,
      pattern: /^https:\/\/[a-zA-Z0-9-]+\.supabase\.co$/,
      errorMessage: 'VITE_SUPABASE_URL must be a valid Supabase URL',
    },
    {
      name: 'VITE_SUPABASE_PROJECT_ID',
      required: true,
      type: 'string',
      sensitive: false,
      pattern: /^[a-zA-Z0-9-]+$/,
      errorMessage: 'VITE_SUPABASE_PROJECT_ID format is invalid',
    },
    {
      name: 'VITE_SUPABASE_PUBLISHABLE_KEY',
      required: true,
      type: 'api-key',
      sensitive: true,
      pattern: /^eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9/,
      errorMessage: 'VITE_SUPABASE_PUBLISHABLE_KEY must be a valid JWT token',
    },

    // Payment Configuration
    {
      name: 'VITE_STRIPE_PUBLISHABLE_KEY',
      required: true,
      type: 'api-key',
      sensitive: true,
      validator: (value) => {
        const isTest = value.startsWith('pk_test_');
        const isLive = value.startsWith('pk_live_');
        const isProduction = import.meta.env.VITE_APP_ENV === 'production';
        return isProduction ? isLive : (isTest || isLive);
      },
      errorMessage: 'Production requires pk_live_ Stripe keys',
    },

    // Security Configuration
    {
      name: 'VITE_SECURITY_HEADERS_ENABLED',
      required: true,
      type: 'boolean',
      sensitive: false,
      validator: (value) => ['true', 'false'].includes(value.toLowerCase()),
      errorMessage: 'VITE_SECURITY_HEADERS_ENABLED must be true or false',
    },
    {
      name: 'VITE_CSP_NONCE_GENERATION',
      required: true,
      type: 'boolean',
      sensitive: false,
      validator: (value) => ['true', 'false'].includes(value.toLowerCase()),
      errorMessage: 'VITE_CSP_NONCE_GENERATION must be true or false',
    },

    // Feature Flags
    {
      name: 'VITE_AI_CONTENT_GENERATION',
      required: true,
      type: 'boolean',
      sensitive: false,
    },
    {
      name: 'VITE_ENABLE_ANALYTICS',
      required: true,
      type: 'boolean',
      sensitive: false,
    },
    {
      name: 'VITE_ENABLE_SOCIAL_LOGIN',
      required: true,
      type: 'boolean',
      sensitive: false,
    },

    // Development Security Checks
    {
      name: 'VITE_HMR',
      required: false,
      type: 'boolean',
      sensitive: false,
      productionOnly: true,
      validator: (value) => value.toLowerCase() === 'false',
      errorMessage: 'VITE_HMR must be disabled in production',
    },
    {
      name: 'VITE_SOURCE_MAP',
      required: false,
      type: 'boolean',
      sensitive: false,
      productionOnly: true,
      validator: (value) => value.toLowerCase() === 'false',
      errorMessage: 'VITE_SOURCE_MAP must be disabled in production',
    },

    // Rate Limiting
    {
      name: 'RATE_LIMIT_RPM',
      required: true,
      type: 'number',
      sensitive: false,
      validator: (value) => {
        const num = parseInt(value);
        return num > 0 && num <= 1000;
      },
      errorMessage: 'RATE_LIMIT_RPM must be between 1 and 1000',
    },

    // File Upload Security
    {
      name: 'MAX_IMAGE_SIZE',
      required: true,
      type: 'number',
      sensitive: false,
      validator: (value) => {
        const num = parseInt(value);
        return num > 0 && num <= 50;
      },
      errorMessage: 'MAX_IMAGE_SIZE must be between 1 and 50 MB',
    },
    {
      name: 'ALLOWED_IMAGE_TYPES',
      required: true,
      type: 'string',
      sensitive: false,
      pattern: /^[a-z,]+$/,
      errorMessage: 'ALLOWED_IMAGE_TYPES must contain only lowercase letters and commas',
    },

    // GDPR Compliance
    {
      name: 'VITE_GDPR_COMPLIANCE',
      required: true,
      type: 'boolean',
      sensitive: false,
      validator: (value) => value.toLowerCase() === 'true',
      errorMessage: 'VITE_GDPR_COMPLIANCE must be enabled in production',
    },
    {
      name: 'VITE_COOKIE_CONSENT',
      required: true,
      type: 'boolean',
      sensitive: false,
      validator: (value) => value.toLowerCase() === 'true',
      errorMessage: 'VITE_COOKIE_CONSENT must be enabled in production',
    },
  ];

  public validateEnvironment(): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    const securityIssues: string[] = [];

    // Check environment
    const isProduction = import.meta.env.VITE_APP_ENV === 'production';
    const isDevelopment = import.meta.env.VITE_APP_ENV === 'development';

    this.configs.forEach(config => {
      const value = import.meta.env[config.name];

      // Skip production-only checks in development
      if (config.productionOnly && isDevelopment) {
        return;
      }

      // Required field validation
      if (config.required && !value) {
        errors.push(`Required environment variable ${config.name} is missing`);
        return;
      }

      // Skip further validation if field is not required and missing
      if (!value) {
        return;
      }

      // Type validation
      const typeError = this.validateType(value, config);
      if (typeError) {
        errors.push(`${config.name}: ${typeError}`);
        return;
      }

      // Pattern validation
      if (config.pattern && !config.pattern.test(value)) {
        errors.push(`${config.name}: ${config.errorMessage || 'Format validation failed'}`);
        return;
      }

      // Custom validator
      if (config.validator && !config.validator(value)) {
        errors.push(`${config.name}: ${config.errorMessage || 'Custom validation failed'}`);
        return;
      }

      // Security checks
      this.checkSecurityIssues(value, config, securityIssues);

      // Production-specific warnings
      if (isProduction) {
        this.checkProductionWarnings(value, config, warnings);
      }
    });

    // Global security checks
    this.performGlobalSecurityChecks(securityIssues, warnings);

    return {
      valid: errors.length === 0 && securityIssues.length === 0,
      errors,
      warnings,
      securityIssues,
    };
  }

  private validateType(value: string, config: EnvVarConfig): string | null {
    switch (config.type) {
      case 'url':
        try {
          new URL(value);
          return null;
        } catch {
          return 'Invalid URL format';
        }
      case 'email':
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(value) ? null : 'Invalid email format';
      case 'number':
        return isNaN(parseInt(value)) ? 'Must be a valid number' : null;
      case 'boolean':
        const lowerValue = value.toLowerCase();
        return ['true', 'false'].includes(lowerValue) ? null : 'Must be true or false';
      case 'api-key':
        return value.length < 10 ? 'API key appears to be too short' : null;
      case 'string':
      default:
        return value.length === 0 ? 'String cannot be empty' : null;
    }
  }

  private checkSecurityIssues(value: string, config: EnvVarConfig, issues: string[]): void {
    if (!config.sensitive) {
      return;
    }

    // Check for placeholder/template values
    if (this.isPlaceholderValue(value)) {
      issues.push(`SECURITY: ${config.name} contains placeholder/template value instead of actual secret`);
    }

    // Check for common insecure patterns
    if (config.name.includes('KEY') && (value === 'secret' || value === 'password' || value === 'test')) {
      issues.push(`SECURITY: ${config.name} appears to contain insecure value`);
    }

    // Check for development values in production
    const isProduction = import.meta.env.VITE_APP_ENV === 'production';
    if (isProduction && this.isDevelopmentValue(value)) {
      issues.push(`SECURITY: ${config.name} appears to contain development value in production`);
    }
  }

  private checkProductionWarnings(value: string, config: EnvVarConfig, warnings: string[]): void {
    // Check for HTTP URLs in production
    if (config.type === 'url' && value.startsWith('http://')) {
      warnings.push(`SECURITY: ${config.name} should use HTTPS in production`);
    }

    // Check for test mode in production
    if (value.includes('test') || value.includes('staging')) {
      warnings.push(`CONFIG: ${config.name} appears to be using test/staging configuration in production`);
    }
  }

  private performGlobalSecurityChecks(issues: string[], warnings: string[]): void {
    const isProduction = import.meta.env.VITE_APP_ENV === 'production';

    // Check for development features in production
    if (isProduction) {
      const devFeatures = ['VITE_HMR', 'VITE_SOURCE_MAP'];
      devFeatures.forEach(feature => {
        if (import.meta.env[feature] === 'true') {
          issues.push(`CRITICAL: Development feature ${feature} is enabled in production`);
        }
      });
    }

    // Check for missing security headers
    if (import.meta.env.VITE_SECURITY_HEADERS_ENABLED !== 'true') {
      warnings.push('SECURITY: Security headers are disabled');
    }

    // Check for CSP nonce generation
    if (import.meta.env.VITE_CSP_NONCE_GENERATION !== 'true') {
      warnings.push('SECURITY: CSP nonce generation is disabled');
    }

    // Check for analytics in production
    if (isProduction && import.meta.env.VITE_ENABLE_ANALYTICS !== 'true') {
      warnings.push('MONITORING: Analytics tracking is disabled in production');
    }

    // Check for error tracking
    if (isProduction && !import.meta.env.VITE_SENTRY_DSN) {
      warnings.push('MONITORING: Error tracking (Sentry) is not configured in production');
    }
  }

  private isPlaceholderValue(value: string): boolean {
    const placeholders = [
      'template',
      'example',
      'your-',
      'placeholder',
      'xxxxx',
      '...',
      'change-me',
      'replace-this',
    ];
    const lowerValue = value.toLowerCase();
    return placeholders.some(placeholder => lowerValue.includes(placeholder));
  }

  private isDevelopmentValue(value: string): boolean {
    const devIndicators = [
      'test',
      'dev',
      'development',
      'staging',
      'localhost',
      '127.0.0.1',
      'example.com',
    ];
    const lowerValue = value.toLowerCase();
    return devIndicators.some(indicator => lowerValue.includes(indicator));
  }

  public getSecureConfig(): Record<string, string | boolean | number> {
    const config: Record<string, string | boolean | number> = {};

    this.configs.forEach(({ name, type }) => {
      const value = import.meta.env[name];
      if (value) {
        switch (type) {
          case 'number':
            config[name] = parseInt(value);
            break;
          case 'boolean':
            config[name] = value.toLowerCase() === 'true';
            break;
          default:
            config[name] = value;
        }
      }
    });

    return config;
  }
}

// Create singleton instance
const envValidator = new EnvironmentValidator();

// Export validation function for use in application
export const validateEnvironment = (): ValidationResult => {
  return envValidator.validateEnvironment();
};

export const getSecureEnvironmentConfig = (): Record<string, string | boolean | number> => {
  return envValidator.getSecureConfig();
};

// Auto-validate in production
if (import.meta.env.VITE_APP_ENV === 'production') {
  const validation = validateEnvironment();
  if (!validation.valid) {
    console.error('Production environment validation failed:', validation);
    // In production, we might want to throw an error
    if (validation.securityIssues.length > 0) {
      throw new Error(`Critical security issues detected: ${validation.securityIssues.join(', ')}`);
    }
  }
}

export default envValidator;