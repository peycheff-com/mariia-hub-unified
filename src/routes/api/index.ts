import { OpenAPIHono } from '@hono/zod-openapi';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { prettyJSON } from 'hono/pretty-json';
import { timing } from 'hono/timing';

// Import route modules
import healthRoutes from './health';
import reliabilityRoutes from './reliability';
import authRoutes from './auth';
import bookingRoutes from './booking';
import paymentRoutes from './payment';
import adminRoutes from './admin';
import contentRoutes from './content';
import analyticsRoutes from './analytics';
import userRoutes from './user';
import serviceRoutes from './service';

// Create main API router
const api = new OpenAPIHono();

// Global middleware
api.use('*', cors({
  origin: ['http://localhost:8080', 'https://yourdomain.com'],
  credentials: true,
}));

api.use('*', logger());
api.use('*', prettyJSON());
api.use('*', timing());

// Rate limiting middleware (simplified)
api.use('*', async (c, next) => {
  const key = `rate-limit:${c.req.header('x-forwarded-for') || 'unknown'}`;
  // Implement actual rate limiting logic here
  await next();
});

// Health check routes (no auth required)
api.route('/health', healthRoutes);

// Reliability monitoring routes (admin only in production)
api.route('/reliability', reliabilityRoutes);

// Authentication routes
api.route('/auth', authRoutes);

// Public routes
api.route('/services', serviceRoutes);

// Protected routes (require authentication)
api.use('/booking/*', async (c, next) => {
  // Add authentication middleware
  // const auth = getAuth(c);
  // if (!auth?.userId) {
  //   return c.json({ error: 'Unauthorized' }, 401);
  // }
  await next();
});

api.route('/booking', bookingRoutes);

api.use('/payments/*', async (c, next) => {
  // Add payment authentication middleware
  // const auth = getAuth(c);
  // if (!auth?.userId) {
  //   return c.json({ error: 'Unauthorized' }, 401);
  // }
  await next();
});

api.route('/payments', paymentRoutes);

// Admin routes (require admin role)
api.use('/admin/*', async (c, next) => {
  // Add admin authorization middleware
  // const auth = getAuth(c);
  // if (!auth?.userId) {
  //   return c.json({ error: 'Unauthorized' }, 401);
  // }
  //
  // const user = await getUserRole(auth.userId);
  // if (user.role !== 'admin') {
  //   return c.json({ error: 'Forbidden' }, 403);
  // }
  await next();
});

api.route('/admin', adminRoutes);

// Protected user routes
api.use('/user/*', async (c, next) => {
  // Add authentication middleware
  await next();
});

api.route('/user', userRoutes);

// Content routes
api.route('/content', contentRoutes);

// Analytics routes (admin only)
api.use('/analytics/*', async (c, next) => {
  // Add admin authorization middleware
  await next();
});

api.route('/analytics', analyticsRoutes);

// API documentation
api.get('/docs', (c) => {
  return c.json({
    title: 'mariiaborysevych API',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      reliability: '/reliability',
      auth: '/auth',
      booking: '/booking',
      payments: '/payments',
      admin: '/admin',
      user: '/user',
      services: '/services',
      content: '/content',
      analytics: '/analytics'
    },
    documentation: '/openapi.json'
  });
});

// OpenAPI specification
api.doc('/openapi.json', {
  openapi: '3.0.0',
  info: {
    version: '1.0.0',
    title: 'mariiaborysevych API',
    description: 'Unified booking and management platform for beauty and fitness services'
  },
  servers: [
    {
      url: 'http://localhost:8080/api',
      description: 'Development server'
    },
    {
      url: 'https://api.mariia-hub.com',
      description: 'Production server'
    }
  ],
  tags: [
    {
      name: 'Health',
      description: 'Health check and monitoring endpoints'
    },
    {
      name: 'Reliability',
      description: 'Reliability engineering features'
    },
    {
      name: 'Authentication',
      description: 'User authentication and authorization'
    },
    {
      name: 'Booking',
      description: 'Booking management'
    },
    {
      name: 'Payment',
      description: 'Payment processing'
    },
    {
      name: 'Admin',
      description: 'Administrative functions'
    },
    {
      name: 'User',
      description: 'User management'
    },
    {
      name: 'Services',
      description: 'Service catalog'
    },
    {
      name: 'Content',
      description: 'Content management'
    },
    {
      name: 'Analytics',
      description: 'Analytics and reporting'
    }
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT'
      }
    }
  }
});

// Error handling middleware
api.onError((err, c) => {
  console.error('API Error:', err);

  return c.json({
    error: 'Internal Server Error',
    message: err.message,
    timestamp: new Date().toISOString(),
    requestId: c.get('requestId')
  }, 500);
});

// 404 handler
api.notFound((c) => {
  return c.json({
    error: 'Not Found',
    message: 'The requested endpoint was not found',
    timestamp: new Date().toISOString()
  }, 404);
});

export default api;