# Complete API Layer Implementation Guide

## Overview

This document describes the comprehensive API layer implementation for the Mariia Hub booking platform. The API layer has been completely refactored and enhanced with production-ready features.

## 🏗️ Architecture

### Core Components

1. **Enhanced Booking Service** (`enhanced-booking.service.ts`)
   - Unified booking creation (individual + group)
   - Real-time availability checking
   - Dynamic pricing integration
   - Waitlist management
   - Rescheduling and cancellation logic

2. **Comprehensive Middleware Layer** (`middleware/`)
   - **Validation Middleware**: Request validation with schemas
   - **Rate Limiting Middleware**: Configurable rate limits
   - **Error Handling Middleware**: Centralized error processing
   - **Authentication Middleware**: JWT + API key auth
   - **Reliability Middleware**: SLO tracking and monitoring

3. **API V1 Routes** (`api/v1/`)
   - **Booking Routes** (`booking-routes.ts`): Full CRUD operations
   - **Payment Routes** (`payment-routes.ts`): Stripe + loyalty integration
   - **Admin Routes** (`admin-routes.ts`): Analytics and management
   - **Services Routes** (`services-routes.ts`): Service catalog
   - **Users Routes** (`users-routes.ts`): User management

4. **API Gateway** (`api-gateway.ts`)
   - Centralized request routing
   - CORS handling
   - Version management
   - Request logging
   - Graceful shutdown

## 🚀 Key Features

### 1. Enhanced Booking System

```typescript
// Create booking with full integration
const result = await enhancedBookingService.createBooking({
  serviceId: 'service-id',
  timeSlot: {
    id: 'slot-id',
    date: new Date(),
    time: '14:00',
    available: true,
    location: 'studio'
  },
  details: {
    client_name: 'John Doe',
    client_email: 'john@example.com',
    client_phone: '+48123456789',
    consent_terms: true,
    consent_marketing: false
  },
  isGroupBooking: false,
  groupSize: 1
});

if (result.success) {
  console.log('Booking created:', result.booking);
  console.log('Loyalty points earned:', result.loyaltyPointsEarned);
}
```

### 2. Advanced Booking Features

#### Group Bookings
```typescript
const groupBooking = await enhancedBookingService.createBooking({
  // ... booking data
  isGroupBooking: true,
  groupSize: 5,
  groupParticipants: [
    { first_name: 'Jane', last_name: 'Doe', email: 'jane@example.com' },
    // ... more participants
  ]
});
```

#### Waitlist Management
```typescript
const waitlistEntry = await waitlistService.addToWaitlist({
  serviceId: 'service-id',
  preferredDate: new Date(),
  preferredTime: '14:00',
  flexibleWithTime: true,
  contactEmail: 'john@example.com',
  autoPromoteEligible: true
});
```

### 3. Payment Processing Integration

```typescript
// Calculate deposit
const deposit = await paymentSystemService.calculateDeposit({
  serviceId: 'service-id',
  totalAmount: 500,
  serviceType: 'beauty',
  currency: 'PLN'
});

// Create payment plan
const paymentPlan = await paymentSystemService.createPaymentPlan({
  bookingId: 'booking-id',
  totalAmount: 500,
  numberOfInstallments: 3,
  installmentSchedule: [
    { dueDate: new Date(), amount: 167 },
    { dueDate: new Date(Date.now() + 30 * 24 * 60 * 1000), amount: 167 },
    { dueDate: new Date(Date.now() + 60 * 24 * 60 * 1000), amount: 166 }
  ]
});

// Process gift card
const giftCard = await paymentSystemService.purchaseGiftCard({
  amount: 200,
  currency: 'PLN',
  recipientEmail: 'recipient@example.com',
  purchaserId: 'user-id'
});
```

### 4. Loyalty Program Integration

```typescript
// Get customer loyalty status
const loyaltyStatus = await loyaltyProgramService.getCustomerLoyaltyStatus('user-id');

// Award points
const pointsResult = await loyaltyProgramService.awardPoints({
  userId: 'user-id',
  points: 100,
  description: 'Booking completed',
  bookingId: 'booking-id'
});

// Redeem reward
const reward = await loyaltyProgramService.redeemReward('user-id', 'reward-id');

// Generate referral code
const referral = await loyaltyProgramService.generateReferralCode({
  referrerId: 'user-id',
  customCode: 'FRIEND2024'
});
```

## 🔧 API Endpoints

### Booking API (`/api/v1/bookings`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|----------------|
| GET | `/availability` | Check service availability | No |
| POST | `/` | Create new booking | Yes |
| GET | `/` | Get user bookings | Yes |
| GET | `/:id` | Get specific booking | Yes |
| PUT | `/:id/reschedule` | Reschedule booking | Yes |
| DELETE | `/:id` | Cancel booking | Yes |
| POST | `/group` | Create group booking | Yes |
| POST | `/waitlist` | Add to waitlist | Optional |
| GET | `/waitlist` | Get waitlist entries | Yes |

### Payment API (`/api/v1/payments`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|----------------|
| POST | `/deposit/calculate` | Calculate deposit amount | Yes |
| POST | `/cancel-fee/calculate` | Calculate cancellation fee | Yes |
| POST | `/plans` | Create payment plan | Yes |
| GET | `/plans/:id` | Get payment plan details | Yes |
| GET | `/bookings/:id/summary` | Get payment summary | Yes |
| POST | `/gift-cards/purchase` | Purchase gift card | Yes |
| POST | `/gift-cards/redeem` | Redeem gift card | Yes |
| POST | `/stripe/create-intent` | Create Stripe payment intent | Yes |
| POST | `/stripe/confirm-payment` | Confirm Stripe payment | Yes |
| POST | `/stripe/webhook` | Handle Stripe webhooks | No |

### Admin API (`/api/v1/admin`)

| Method | Endpoint | Description | Permissions |
|--------|----------|-------------|-------------|
| GET | `/dashboard/stats` | Dashboard statistics | `analytics:read` |
| GET | `/bookings` | Get all bookings | `booking:read_all` |
| GET | `/analytics/revenue` | Revenue analytics | `analytics:read` |
| GET | `/analytics/services` | Service performance | `analytics:read` |
| GET | `/waitlist/stats` | Waitlist statistics | `booking:read_all` |
| GET | `/loyalty/stats` | Loyalty program stats | `analytics:read` |
| GET | `/health/system` | System health metrics | `system:health` |

## 🛡️ Middleware Configuration

### Rate Limiting

```typescript
import { RateLimitMiddleware, RateLimitConfigs } from '@/services/middleware';

// Use predefined configurations
app.use('/api/bookings', RateLimitMiddleware.rateLimit(RateLimitConfigs.booking));
app.use('/api/payments', RateLimitMiddleware.rateLimit(RateLimitConfigs.payment));
app.use('/api/auth', RateLimitMiddleware.rateLimit(RateLimitConfigs.auth));
```

### Validation

```typescript
import { ValidationMiddleware, CommonSchemas } from '@/services/middleware';

// Use predefined schemas
app.post('/api/bookings', ValidationMiddleware.validate({
  body: CommonSchemas.createBooking.body
}), handler);

// Custom validation
app.post('/api/custom', ValidationMiddleware.validate({
  body: {
    custom_field: {
      type: 'string',
      required: true,
      minLength: 3,
      custom: (value) => value.startsWith('XYZ') || 'Value must start with XYZ'
    }
  }
}), handler);
```

### Authentication

```typescript
import { AuthMiddleware, Roles, Permissions } from '@/services/middleware';

// Require authentication
app.use('/api/bookings', AuthMiddleware.authenticate());

// Require specific role
app.use('/api/admin', AuthMiddleware.requireRole(Roles.ADMIN));

// Require specific permission
app.use('/api/payments', AuthMiddleware.requirePermission(Permissions.PAYMENT_WRITE));

// Allow API key authentication
app.use('/api/webhooks', AuthMiddleware.apiKeyOnly());
```

### Error Handling

```typescript
import { ErrorMiddleware, registerCustomErrorHandler } from '@/services/middleware';

// Global error handling
app.use('*', ErrorMiddleware.handleErrors({
  logErrors: true,
  sendErrorReports: true,
  includeStackTrace: process.env.NODE_ENV === 'development'
}));

// Custom error handlers
registerCustomErrorHandler('CustomError', (error, c) => {
  return c.json({
    success: false,
    error: 'Custom error occurred'
  }, 400);
});
```

## 🚀 Usage Examples

### Starting the API Gateway

```typescript
import { apiGateway } from '@/services';

// Start the API server
apiGateway.start();

// Or use in your main server file
import { Hono } from 'hono';
import { apiGateway } from '@/services';

const app = new Hono();
app.use('/api/*', apiGateway.getApp());
```

### Using Services in Components

```typescript
import { enhancedBookingService, loyaltyProgramService } from '@/services';

// In React component
const createBooking = async (bookingData) => {
  try {
    const result = await enhancedBookingService.createBooking(bookingData);

    if (result.success) {
      // Handle successful booking
      toast.success('Booking created successfully!');

      // Handle loyalty points
      if (result.loyaltyPointsEarned) {
        toast.success(`Earned ${result.loyaltyPointsEarned} points!`);
      }
    } else {
      // Handle booking error
      toast.error(result.error || 'Failed to create booking');
    }
  } catch (error) {
    toast.error('An unexpected error occurred');
  }
};
```

## 🔒 Security Features

1. **Rate Limiting**: Configurable rate limits per endpoint
2. **Input Validation**: Comprehensive request validation
3. **Authentication**: JWT + API key support
4. **Authorization**: Role and permission-based access control
5. **CORS**: Proper CORS configuration
6. **Error Sanitization**: Prevents information leakage
7. **SQL Injection Protection**: Using Supabase ORM
8. **Logging**: Comprehensive request/response logging

## 📊 Monitoring & Reliability

### Health Checks

```bash
# Basic health check
GET /api/v1/health

# Detailed health check
GET /api/v1/health/detailed
```

### Metrics

- **API Response Times**: Automatic tracking
- **Error Rates**: Automatic monitoring
- **Database Health**: Connection and query monitoring
- **Rate Limit Metrics**: Per-endpoint tracking
- **Authentication Metrics**: Success/failure tracking

## 🔧 Configuration

### Environment Variables

```bash
# API Configuration
PORT=8080
HOST=0.0.0.0
NODE_ENV=production
CORS_ORIGIN=https://yourapp.com

# Database
SUPABASE_URL=your-supabase-url
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-key

# External Services
STRIPE_SECRET_KEY=your-stripe-secret
STRIPE_WEBHOOK_SECRET=your-webhook-secret
EMAIL_SERVICE_API_KEY=your-email-api-key

# Monitoring
SENTRY_DSN=your-sentry-dsn
LOG_LEVEL=info
```

## 📝 Development

### Running the API

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Start production server
npm start
```

### Testing

```bash
# Run API tests
npm run test

# Run with coverage
npm run test:coverage
```

## 🚀 Production Deployment

### Docker Setup

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

EXPOSE 8080

CMD ["node", "dist/api-gateway.js"]
```

### Monitoring Setup

1. **Set up error tracking** (Sentry, LogRocket, etc.)
2. **Configure rate limiting** appropriate for your traffic
3. **Set up database monitoring**
4. **Configure alerts** for critical failures
5. **Monitor API response times** and error rates

## 📚 API Documentation

### Auto-generated Documentation

- **Swagger/OpenAPI**: Available at `/api/v1/docs`
- **Postman Collection**: Exportable from API responses
- **Examples**: Included in endpoint responses

### Interactive API Explorer

```bash
# Start API with documentation
npm run dev

# Visit http://localhost:8080/api/v1/docs
```

## 🔄 Migration Guide

### From Legacy API

1. **Update Authentication**: Use new JWT middleware
2. **Update Request Format**: Follow new validation schemas
3. **Update Error Handling**: Use new error response format
4. **Update Rate Limiting**: Implement new rate limits
5. **Update Monitoring**: Use new health check endpoints

### Breaking Changes

- **Authentication**: New JWT format required
- **Request Format**: Validation now enforced
- **Response Format**: New standardized API response format
- **Rate Limiting**: Stricter limits implemented

## 🤝 Integration Examples

### Frontend Integration

```typescript
// API client setup
import { apiGateway } from '@/services';

const apiClient = apiGateway.getApp();

// Booking creation
const createBooking = (data) => {
  return apiClient.post('/api/v1/bookings', {
    body: JSON.stringify(data)
  });
};

// Service listing
const getServices = (filters) => {
  return apiClient.get('/api/v1/services', {
    query: filters
  });
};
```

### Webhook Integration

```typescript
// Stripe webhook handler
app.post('/api/v1/payments/stripe/webhook', async (c) => {
  const signature = c.req.header('stripe-signature');
  const body = await c.req.text();

  // Verify webhook signature
  const event = stripe.webhooks.constructEvent(body, signature, webhookSecret);

  // Process event
  switch (event.type) {
    case 'payment_intent.succeeded':
      await handleSuccessfulPayment(event.data.object);
      break;
    case 'payment_intent.payment_failed':
      await handleFailedPayment(event.data.object);
      break;
  }

  return c.json({ received: true });
});
```

## 🎯 Best Practices

### API Design

1. **RESTful Principles**: Proper HTTP methods and status codes
2. **Versioning**: Use `/api/v1/` for versioned endpoints
3. **Pagination**: Consistent pagination across all list endpoints
4. **Filtering**: Standardized query parameters
5. **Error Responses**: Consistent error response format

### Performance

1. **Caching**: Implement appropriate caching strategies
2. **Database Optimization**: Efficient queries with proper indexing
3. **Rate Limiting**: Prevent abuse while allowing legitimate use
4. **Response Optimization**: Minimize response sizes
5. **Async Processing**: Handle long-running operations asynchronously

### Security

1. **Input Validation**: Validate all inputs on server-side
2. **Authentication**: Strong authentication mechanisms
3. **Authorization**: Proper permission checking
4. **Rate Limiting**: Prevent abuse and DoS attacks
5. **Logging**: Comprehensive security logging

## 🔧 Troubleshooting

### Common Issues

1. **CORS Errors**: Check origin configuration
2. **Rate Limiting**: Check rate limit headers in responses
3. **Validation Errors**: Check request body format
4. **Authentication**: Check JWT token format and expiration
5. **Database**: Check connection and query performance

### Debug Mode

```typescript
// Enable debug logging
process.env.NODE_ENV = 'development';

// Enable detailed error responses
process.env.DEBUG_ERRORS = 'true';
```

## 📈 Performance Metrics

### Target Performance

- **API Response Time**: < 200ms (95th percentile)
- **Database Queries**: < 50ms average
- **Error Rate**: < 1% of total requests
- **Uptime**: > 99.9%
- **Memory Usage**: < 512MB

### Monitoring

- **Response Times**: Automatic tracking via middleware
- **Error Rates**: Real-time monitoring
- **Database Performance**: Query optimization monitoring
- **Rate Limit Metrics**: Per-endpoint tracking
- **System Resources**: Memory, CPU, and disk usage

This comprehensive API layer provides a solid foundation for the Mariia Hub booking platform with enterprise-grade features, security, and reliability.