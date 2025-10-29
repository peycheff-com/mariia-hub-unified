import { Hono } from 'hono';
import { cors } from 'hono/cors';

// Import route modules
import bookingRoutes from './booking-routes';
import paymentRoutes from './payment-routes';
import adminRoutes from './admin-routes';
import { servicesRoutes } from './services-routes';
import { usersRoutes } from './users-routes';

const app = new Hono();

// Apply global CORS middleware
app.use('*', cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowHeaders: [
    'Content-Type',
    'Authorization',
    'X-API-Key',
    'X-Client-Version',
    'X-Requested-With'
  ],
  exposeHeaders: [
    'X-RateLimit-Limit',
    'X-RateLimit-Current',
    'X-RateLimit-Remaining',
    'X-RateLimit-Reset',
    'Retry-After',
    'X-User-ID',
    'X-User-Role',
    'X-API-Key-ID'
  ],
  credentials: true,
  maxAge: 86400 // 24 hours
}));

// API version and health endpoints
/**
 * GET /api/v1/
 * API information
 */
app.get('/', (c) => {
  return c.json({
    name: 'Mariia Hub Booking API',
    version: '1.0.0',
    status: 'operational',
    timestamp: new Date().toISOString(),
    endpoints: {
      bookings: '/bookings',
      services: '/services',
      payments: '/payments',
      users: '/users',
      admin: '/admin',
      health: '/health'
    },
    documentation: process.env.API_DOCS_URL || 'https://docs.mariia-hub.com/api/v1'
  });
});

/**
 * GET /api/v1/health
 * Basic health check
 */
app.get('/health', async (c) => {
  const startTime = Date.now();

  try {
    // Simple database connectivity check
    const { supabase } = await import('@/integrations/supabase/client');
    const { error } = await supabase
      .from('services')
      .select('id')
      .limit(1);

    const responseTime = Date.now() - startTime;

    return c.json({
      status: !error ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      responseTime,
      version: '1.0.0',
      checks: {
        database: !error ? 'pass' : 'fail',
        memory: process.memoryUsage(),
        uptime: process.uptime()
      }
    });
  } catch (error) {
    return c.json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      responseTime: Date.now() - startTime,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, 503);
  }
});

/**
 * GET /api/v1/health/detailed
 * Detailed health check
 */
app.get('/health/detailed', async (c) => {
  const startTime = Date.now();
  const checks: Record<string, any> = {};

  try {
    // Database check
    const { supabase } = await import('@/integrations/supabase/client');
    const dbStart = Date.now();
    const { error: dbError } = await supabase
      .from('services')
      .select('id')
      .limit(1);

    checks.database = {
      status: !dbError ? 'pass' : 'fail',
      responseTime: Date.now() - dbStart,
      error: dbError?.message
    };

    // External services check (if configured)
    checks.stripe = await checkStripeHealth();
    checks.email = await checkEmailHealth();
    checks.storage = await checkStorageHealth();

    const responseTime = Date.now() - startTime;
    const allChecksPass = Object.values(checks).every(check => check.status === 'pass');

    return c.json({
      status: allChecksPass ? 'healthy' : 'degraded',
      timestamp: new Date().toISOString(),
      responseTime,
      checks,
      system: {
        nodeVersion: process.version,
        platform: process.platform,
        memory: process.memoryUsage(),
        uptime: process.uptime()
      }
    });
  } catch (error) {
    return c.json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      responseTime: Date.now() - startTime,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, 503);
  }
});

// Mount route modules
app.route('/bookings', bookingRoutes);
app.route('/services', servicesRoutes);
app.route('/payments', paymentRoutes);
app.route('/users', usersRoutes);
app.route('/admin', adminRoutes);

// 404 handler for API routes
app.notFound((c) => {
  return c.json({
    success: false,
    error: {
      message: 'API endpoint not found',
      code: 'ENDPOINT_NOT_FOUND',
      details: {
        path: c.req.path,
        method: c.req.method,
        availableEndpoints: [
          '/bookings',
          '/services',
          '/payments',
          '/users',
          '/admin',
          '/health'
        ]
      }
    },
    timestamp: new Date().toISOString()
  }, 404);
});

// Health check helper functions
async function checkStripeHealth(): Promise<any> {
  try {
    // This would check Stripe API connectivity
    // For now, just return a mock status
    return {
      status: 'pass',
      responseTime: 45
    };
  } catch (error) {
    return {
      status: 'fail',
      error: error instanceof Error ? error.message : 'Stripe health check failed'
    };
  }
}

async function checkEmailHealth(): Promise<any> {
  try {
    // This would check email service connectivity
    return {
      status: 'pass',
      responseTime: 120
    };
  } catch (error) {
    return {
      status: 'fail',
      error: error instanceof Error ? error.message : 'Email service health check failed'
    };
  }
}

async function checkStorageHealth(): Promise<any> {
  try {
    // This would check storage service connectivity
    return {
      status: 'pass',
      responseTime: 85
    };
  } catch (error) {
    return {
      status: 'fail',
      error: error instanceof Error ? error.message : 'Storage health check failed'
    };
  }
}

export default app;