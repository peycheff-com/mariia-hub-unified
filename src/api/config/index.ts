/**
 * API Configuration
 * Central configuration for the API ecosystem
 */

import { config as dotenvConfig } from 'dotenv';

// Load environment variables
dotenvConfig();

export const apiConfig = {
  // Server configuration
  port: process.env.API_PORT ? parseInt(process.env.API_PORT) : 3001,
  env: process.env.NODE_ENV || 'development',

  // CORS configuration
  corsOrigins: process.env.CORS_ORIGINS
    ? process.env.CORS_ORIGINS.split(',')
    : [
        'http://localhost:8080',
        'http://localhost:3000',
        'https://mariaborysevych.com',
        'https://www.mariaborysevych.com',
        'https://staging.mariaborysevych.com',
      ],

  // Rate limiting
  rateLimitMax: process.env.RATE_LIMIT_MAX
    ? parseInt(process.env.RATE_LIMIT_MAX)
    : 100, // requests per 15 minutes

  // Authentication
  jwtSecret: process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  refreshSecret: process.env.REFRESH_TOKEN_SECRET || 'your-refresh-secret-key',
  refreshExpiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN || '30d',
  bcryptRounds: process.env.BCRYPT_ROUNDS ? parseInt(process.env.BCRYPT_ROUNDS) : 12,

  // Database configuration (Supabase)
  supabaseUrl: process.env.VITE_SUPABASE_URL || '',
  supabaseServiceKey: process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || '',

  // Redis configuration (for rate limiting and caching)
  redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',
  redisTTL: process.env.REDIS_TTL ? parseInt(process.env.REDIS_TTL) : 3600, // 1 hour

  // Stripe configuration
  stripeSecretKey: process.env.STRIPE_SECRET_KEY || '',
  stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET || '',

  // Email configuration
  emailFrom: process.env.EMAIL_FROM || 'noreply@mariaborysevych.com',
  emailProvider: process.env.EMAIL_PROVIDER || 'sendgrid', // sendgrid, ses, etc.

  // File upload configuration
  maxFileSize: process.env.MAX_FILE_SIZE
    ? parseInt(process.env.MAX_FILE_SIZE)
    : 10 * 1024 * 1024, // 10MB
  allowedFileTypes: process.env.ALLOWED_FILE_TYPES
    ? process.env.ALLOWED_FILE_TYPES.split(',')
    : ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'],

  // API Keys
  apiKeySecret: process.env.API_KEY_SECRET || 'your-api-key-secret',

  // Logging
  logLevel: process.env.LOG_LEVEL || 'info',
  logFormat: process.env.LOG_FORMAT || 'json',

  // Features
  features: {
    enableGraphQL: process.env.ENABLE_GRAPHQL !== 'false',
    enableWebSocket: process.env.ENABLE_WEBSOCKET !== 'false',
    enableSwagger: process.env.ENABLE_SWAGGER !== 'false',
    enableMetrics: process.env.ENABLE_METRICS !== 'false',
    enableAnalytics: process.env.ENABLE_ANALYTICS !== 'false',
  },

  // Business logic
  booking: {
    holdDurationMinutes: 5, // How long to hold a slot
    maxBookingDaysInAdvance: 90,
    minBookingHoursInAdvance: 2,
    cancellationHoursInAdvance: 24,
    allowedTimeZones: ['Europe/Warsaw'],
    businessHours: {
      start: '09:00',
      end: '21:00',
      weekdays: [1, 2, 3, 4, 5], // Monday to Friday
      weekend: [6], // Saturday
    },
  },

  // Polish market specific
  localization: {
    defaultCurrency: 'PLN',
    defaultLanguage: 'pl',
    supportedLanguages: ['pl', 'en'],
    timezone: 'Europe/Warsaw',
    dateFormat: 'DD.MM.YYYY',
    timeFormat: 'HH:mm',
  },

  // Security
  security: {
    maxLoginAttempts: 5,
    lockoutDurationMinutes: 15,
    passwordMinLength: 8,
    sessionTimeoutMinutes: 30,
    apiVersion: '1.0.0',
  },

  // Monitoring
  monitoring: {
    enableHealthCheck: true,
    enableMetrics: true,
    enableTracing: false,
    sampleRate: 0.1, // 10% sampling for tracing
  },
};

export const swaggerConfig = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'mariiaborysevych API',
      version: '1.0.0',
      description: 'Enterprise-grade API for beauty and fitness booking platform',
      contact: {
        name: 'API Support',
        email: 'api@mariaborysevych.com',
        url: 'https://mariaborysevych.com',
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT',
      },
    },
    servers: [
      {
        url: apiConfig.env === 'production'
          ? 'https://api.mariaborysevych.com'
          : `http://localhost:${apiConfig.port}`,
        description: apiConfig.env === 'production' ? 'Production server' : 'Development server',
      },
      {
        url: 'https://staging-api.mariaborysevych.com',
        description: 'Staging server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
        apiKey: {
          type: 'apiKey',
          in: 'header',
          name: 'X-API-Key',
        },
      },
      schemas: {
        Error: {
          type: 'object',
          properties: {
            error: { type: 'string' },
            message: { type: 'string' },
            timestamp: { type: 'string', format: 'date-time' },
            path: { type: 'string' },
            requestId: { type: 'string' },
          },
        },
        Success: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: {},
            message: { type: 'string' },
            timestamp: { type: 'string', format: 'date-time' },
          },
        },
        Pagination: {
          type: 'object',
          properties: {
            page: { type: 'integer', minimum: 1 },
            limit: { type: 'integer', minimum: 1, maximum: 100 },
            total: { type: 'integer', minimum: 0 },
            totalPages: { type: 'integer', minimum: 0 },
            hasNext: { type: 'boolean' },
            hasPrev: { type: 'boolean' },
          },
        },
      },
    },
    security: [
      { bearerAuth: [] },
      { apiKey: [] },
    ],
    tags: [
      { name: 'Authentication', description: 'User authentication and authorization' },
      { name: 'Bookings', description: 'Booking management' },
      { name: 'Services', description: 'Service catalog and management' },
      { name: 'Users', description: 'User management and profiles' },
      { name: 'Payments', description: 'Payment processing and management' },
      { name: 'Analytics', description: 'Business analytics and reporting' },
      { name: 'Admin', description: 'Administrative operations' },
      { name: 'WebSocket', description: 'Real-time WebSocket operations' },
    ],
  },
  apis: [
    './src/api/routes/**/*.ts',
    './src/api/controllers/**/*.ts',
    './src/api/models/**/*.ts',
  ],
};

// Environment validation
export function validateConfig(): void {
  const requiredVars = [
    'VITE_SUPABASE_URL',
    'VITE_SUPABASE_ANON_KEY',
    'JWT_SECRET',
  ];

  const missingVars = requiredVars.filter(varName => !process.env[varName]);

  if (missingVars.length > 0) {
    throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
  }

  if (apiConfig.env === 'production') {
    const productionVars = [
      'STRIPE_SECRET_KEY',
      'STRIPE_WEBHOOK_SECRET',
    ];

    const missingProductionVars = productionVars.filter(varName => !process.env[varName]);

    if (missingProductionVars.length > 0) {
      console.warn(`Warning: Missing production environment variables: ${missingProductionVars.join(', ')}`);
    }
  }
}

// Validate configuration on import
validateConfig();