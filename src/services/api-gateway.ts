import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { serve } from '@hono/node-server';

import { logger } from '@/lib/logger';

import v1Routes from './api/v1';
import {
  ErrorMiddleware,
  RateLimitMiddleware,
  ValidationMiddleware
} from './middleware';

// Create main API app
const api = new Hono();

// Apply global middleware before versioned routes
api.use('*', cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowHeaders: [
    'Content-Type',
    'Authorization',
    'X-API-Key',
    'X-Client-Version',
    'X-Requested-With',
    'X-Session-ID'
  ],
  exposeHeaders: [
    'X-RateLimit-Limit',
    'X-RateLimit-Current',
    'X-RateLimit-Remaining',
    'X-RateLimit-Reset',
    'Retry-After',
    'X-User-ID',
    'X-User-Role',
    'X-API-Key-ID',
    'X-Response-Time',
    'X-API-Version'
  ],
  credentials: true,
  maxAge: 86400 // 24 hours
}));

// Request logging middleware
api.use('*', async (c, next) => {
  const start = Date.now();

  await next();

  const duration = Date.now() - start;

  // Add response time header
  c.res.headers.set('X-Response-Time', duration.toString());

  // Log request (in production, use structured logging)
  if (process.env.NODE_ENV === 'production') {
    logger.info('API Request', {
      method: c.req.method,
      path: c.req.path,
      statusCode: c.res.status,
      duration,
      userAgent: c.req.header('user-agent'),
      ip: c.req.header('x-forwarded-for') || c.req.header('x-real-ip') || 'unknown'
    });
  } else {
    console.log(`${c.req.method} ${c.req.path} - ${c.res.status} - ${duration}ms`);
  }
});

// API versioning
api.use('/api/*', async (c, next) => {
  const version = c.req.header('X-API-Version') || c.req.query('version') || 'v1';

  // Set version in context
  c.set('apiVersion', version);

  // Add version header
  c.res.headers.set('X-API-Version', version);

  // Route to appropriate version
  if (version === 'v1') {
    await next();
  } else {
    c.json({
      success: false,
      error: {
        message: 'Unsupported API version',
        code: 'UNSUPPORTED_VERSION',
        supported_versions: ['v1']
      }
    }, 400);
  }
});

// Mount versioned routes
api.route('/api/v1', v1Routes);

// Root API endpoint
api.get('/api', (c) => {
  return c.json({
    name: 'mariiaborysevych Booking API',
    version: '1.0.0',
    description: 'Complete booking and management platform for beauty and fitness services',
    status: 'operational',
    timestamp: new Date().toISOString(),
    endpoints: {
      v1: {
        base_url: '/api/v1',
        documentation: `${process.env.API_BASE_URL || 'http://localhost:3000'}/api/v1`,
        endpoints: {
          bookings: '/bookings',
          services: '/services',
          payments: '/payments',
          users: '/users',
          admin: '/admin',
          health: '/health'
        }
      }
    },
    developer: {
      documentation: process.env.API_DOCS_URL || 'https://docs.mariia-hub.com/api',
      support: process.env.SUPPORT_EMAIL || 'support@mariia-hub.com',
      status_page: process.env.STATUS_PAGE_URL || 'https://status.mariia-hub.com'
    }
  });
});

// Global error handler (catches all unhandled errors)
api.onError((err, c) => {
  logger.error('Unhandled API Error', err, {
    method: c.req.method,
    path: c.req.path,
    statusCode: c.res.status
  });

  // Don't expose internal errors in production
  const isDevelopment = process.env.NODE_ENV !== 'production';

  return c.json({
    success: false,
    error: {
      message: isDevelopment ? err.message : 'Internal server error',
      code: 'INTERNAL_ERROR',
      ...(isDevelopment && { stack: err.stack })
    },
    timestamp: new Date().toISOString()
  }, 500);
});

// 404 handler for API routes
api.notFound((c) => {
  return c.json({
    success: false,
    error: {
      message: 'API endpoint not found',
      code: 'ENDPOINT_NOT_FOUND',
      details: {
        path: c.req.path,
        method: c.req.method,
        available_versions: ['v1'],
        base_endpoints: [
          '/api',
          '/api/v1',
          '/api/v1/bookings',
          '/api/v1/services',
          '/api/v1/payments',
          '/api/v1/users',
          '/api/v1/admin',
          '/api/v1/health'
        ]
      }
    },
    timestamp: new Date().toISOString()
  }, 404);
});

// Graceful shutdown handling
let server: any;
const gracefulShutdown = (signal: string) => {
  logger.info(`Received ${signal}, starting graceful shutdown`);

  if (server) {
    server.close(() => {
      logger.info('Server closed successfully');
      process.exit(0);
    });

    // Force close after 30 seconds
    setTimeout(() => {
      logger.error('Forced shutdown after timeout');
      process.exit(1);
    }, 30000);
  }
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception', error);
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Promise Rejection', reason, { promise });
  process.exit(1);
});

export class ApiGateway {
  private port: number;
  private host: string;

  constructor(port: number = 8080, host: string = '0.0.0.0') {
    this.port = port;
    this.host = host;
  }

  /**
   * Start the API gateway
   */
  start(): void {
    try {
      server = serve({
        fetch: api.fetch,
        port: this.port,
        hostname: this.host,
      }, (info) => {
        logger.info('API Gateway started', {
          port: info.port,
          host: this.host,
          nodeVersion: process.version,
          platform: process.platform,
          environment: process.env.NODE_ENV || 'development'
        });

        // Log available routes
        console.log('\n🚀 mariiaborysevych API Gateway Started');
        console.log(`📍 Server: http://${this.host}:${this.port}`);
        console.log(`📖 API Docs: http://${this.host}:${this.port}/api/v1`);
        console.log(`🔍 Health Check: http://${this.host}:${this.port}/api/v1/health`);
        console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
        console.log('\nAvailable endpoints:');
        console.log('  GET  /api                    - API information');
        console.log('  GET  /api/v1                - v1 API base');
        console.log('  GET  /api/v1/health         - Health check');
        console.log('  GET  /api/v1/services        - Services');
        console.log('  GET  /api/v1/bookings        - Bookings');
        console.log('  POST /api/v1/bookings        - Create booking');
        console.log('  GET  /api/v1/users           - Users');
        console.log('  POST /api/v1/users/register  - User registration');
        console.log('  POST /api/v1/users/login     - User login');
        console.log('  GET  /api/v1/payments        - Payments');
        console.log('  GET  /api/v1/admin           - Admin endpoints');
      });

      // Set up graceful shutdown
      server.on('close', () => {
        logger.info('Server closed');
      });
    } catch (error) {
      logger.error('Failed to start API Gateway', error);
      process.exit(1);
    }
  }

  /**
   * Stop the API gateway
   */
  stop(): Promise<void> {
    return new Promise((resolve) => {
      if (server) {
        server.close(() => {
          logger.info('API Gateway stopped');
          resolve();
        });
      } else {
        resolve();
      }
    });
  }

  /**
   * Get the Express app instance
   */
  getApp(): Hono {
    return api;
  }

  /**
   * Health check for load balancers
   */
  healthCheck(): { status: string; timestamp: string } {
    return {
      status: 'healthy',
      timestamp: new Date().toISOString()
    };
  }
}

// Create and export singleton instance
export const apiGateway = new ApiGateway(
  parseInt(process.env.PORT || '8080'),
  process.env.HOST || '0.0.0.0'
);

// Auto-start if this file is run directly
if (require.main === module) {
  apiGateway.start();
}

export default apiGateway;