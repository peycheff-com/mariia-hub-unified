/**
 * API Routes Configuration
 * Central route registration for the RESTful API
 */

import { Application } from 'express';
import { authRoutes } from './auth';
import { bookingRoutes } from './bookings';
import { serviceRoutes } from './services';
import { userRoutes } from './users';
import { paymentRoutes } from './payments';
import { analyticsRoutes } from './analytics';
import { adminRoutes } from './admin';

export function setupRoutes(app: Application): void {
  // API v1 routes
  app.use('/api/v1/auth', authRoutes);
  app.use('/api/v1/bookings', bookingRoutes);
  app.use('/api/v1/services', serviceRoutes);
  app.use('/api/v1/users', userRoutes);
  app.use('/api/v1/payments', paymentRoutes);
  app.use('/api/v1/analytics', analyticsRoutes);
  app.use('/api/v1/admin', adminRoutes);

  // API information
  app.get('/api/v1', (req, res) => {
    res.json({
      name: 'mariiaborysevych API v1',
      version: '1.0.0',
      description: 'Enterprise-grade API for beauty and fitness booking platform',
      endpoints: {
        auth: '/api/v1/auth',
        bookings: '/api/v1/bookings',
        services: '/api/v1/services',
        users: '/api/v1/users',
        payments: '/api/v1/payments',
        analytics: '/api/v1/analytics',
        admin: '/api/v1/admin',
      },
      documentation: '/api-docs',
      graphql: '/graphql',
      websocket: '/socket.io/',
    });
  });
}

export {
  authRoutes,
  bookingRoutes,
  serviceRoutes,
  userRoutes,
  paymentRoutes,
  analyticsRoutes,
  adminRoutes,
};