# API Ecosystem Implementation Guide

## Overview

This document provides a comprehensive guide to the enterprise-grade API ecosystem developed for the beauty and fitness booking platform. The API system includes RESTful endpoints, GraphQL support, WebSocket real-time features, and comprehensive security measures.

## Architecture Overview

### Core Components

1. **RESTful API Server** - Express.js-based HTTP API with TypeScript
2. **GraphQL Server** - Apollo Server integration for flexible data queries
3. **WebSocket Server** - Socket.io for real-time communications
4. **Security Layer** - JWT authentication, rate limiting, input validation
5. **Documentation** - OpenAPI 3.0/Swagger with interactive UI
6. **Monitoring** - Structured logging and performance tracking
7. **Database Integration** - Supabase PostgreSQL backend

### Key Features

- **Multi-protocol Support**: REST, GraphQL, and WebSocket APIs
- **Enterprise Security**: JWT authentication, RBAC, rate limiting
- **Real-time Features**: Live booking updates, notifications, chat
- **Comprehensive Documentation**: Auto-generated OpenAPI/Swagger docs
- **Performance Monitoring**: Request logging, metrics, error tracking
- **Polish Market Optimization**: Localized validation, currency support
- **Scalability**: Redis caching, connection pooling, efficient queries

## API Endpoints

### Base URL
- Development: `http://localhost:3001`
- Production: `https://api.mariaborysevych.com`

### RESTful API Structure

#### Authentication (`/api/v1/auth`)
```
POST   /register           - User registration
POST   /login              - User login
POST   /refresh            - Refresh access token
POST   /logout             - User logout
GET    /me                 - Get current user
PUT    /me                 - Update user profile
POST   /change-password    - Change password
POST   /forgot-password    - Request password reset
POST   /reset-password     - Reset password
POST   /verify-email       - Verify email address
POST   /resend-verification - Resend verification email
```

#### Bookings (`/api/v1/bookings`)
```
GET    /                   - Get user bookings
GET    /:id                - Get booking details
POST   /                   - Create new booking
POST   /:id/cancel         - Cancel booking
POST   /:id/reschedule     - Reschedule booking
GET    /availability       - Check availability
POST   /hold               - Hold time slot
DELETE /hold/:holdId/release - Release hold
```

#### Services (`/api/v1/services`)
```
GET    /                   - Get services list
GET    /:id                - Get service details
GET    /featured           - Get featured services
```

#### Users (`/api/v1/users`)
```
GET    /profile            - Get user profile
GET    /bookings           - Get user bookings
```

#### Payments (`/api/v1/payments`)
```
POST   /intent             - Create payment intent
```

#### Analytics (`/api/v1/analytics`) - Admin/Staff only
```
GET    /dashboard          - Get dashboard analytics
```

#### Admin (`/api/v1/admin`) - Admin only
```
GET    /stats              - Get admin statistics
```

### GraphQL Endpoint
- **URL**: `/graphql`
- **Interactive Playground**: `/graphql` (in development)

### WebSocket Events
- **Connection**: `ws://localhost:3001/socket.io/`
- **Authentication**: JWT token via `auth` parameter or `Authorization` header

#### Client Events
```javascript
// Join rooms
socket.emit('join-booking', bookingId);
socket.emit('join-service', serviceId);

// Booking operations
socket.emit('check-availability', { serviceId, date });
socket.emit('hold-slot', { serviceId, date, timeSlot });
socket.emit('release-hold', { holdId });

// Support
socket.emit('support-message', { message, bookingId });

// Heartbeat
socket.emit('ping');
```

#### Server Events
```javascript
// Booking updates
socket.on('booking-updated', (data) => {});
socket.on('booking-created', (data) => {});
socket.on('booking-cancelled', (data) => {});

// Availability
socket.on('availability-updated', (data) => {});

// Hold operations
socket.on('slot-held', (data) => {});
socket.on('hold-released', (data) => {});

// Support
socket.on('support-message', (data) => {});
socket.on('message-sent', (data) => {});

// System
socket.on('system-announcement', (message) => {});
socket.on('maintenance-mode', (isActive) => {});
```

## Security Features

### Authentication
- **JWT Tokens**: Access tokens (7 days) and refresh tokens (30 days)
- **Secure Storage**: bcrypt password hashing with configurable rounds
- **Session Management**: Automatic token refresh and revocation

### Authorization
- **Role-Based Access Control (RBAC)**: Admin, Staff, Customer, User roles
- **Permission System**: Granular permissions for different operations
- **Resource Ownership**: Users can only access their own resources

### Rate Limiting
- **Default**: 100 requests per 15 minutes per IP
- **Authenticated Users**: Higher limits based on role
- **Custom Limits**: Per-endpoint rate limiting configuration

### Input Validation
- **Express-validator**: Comprehensive request validation
- **Polish Market Validation**: Phone numbers, NIP, postal codes
- **Business Logic Validation**: Booking rules, time slots, cancellations

### Security Headers
- **Helmet.js**: Security headers configuration
- **CORS**: Configurable origins and methods
- **CSP**: Content Security Policy for XSS prevention

## Database Integration

### Supabase Configuration
The API uses Supabase as the database backend with the following features:

- **Typed Client**: Auto-generated TypeScript definitions
- **Row Level Security**: Database-level access control
- **Real-time Subscriptions**: Database change notifications
- **File Storage**: Image and document management

### Key Tables
- `profiles` - User profiles and preferences
- `services` - Service catalog with metadata
- `bookings` - Booking records and status
- `availability_slots` - Time slot management
- `holds` - Temporary slot reservations
- `payment_intents` - Payment tracking
- `service_content` - Rich content management
- `service_gallery` - Image galleries

## Monitoring and Logging

### Structured Logging
- **Winston-style Logger**: JSON-formatted logs
- **Request Tracking**: Unique request IDs for tracing
- **Performance Metrics**: Response times and operation tracking
- **Security Events**: Authentication attempts and failures

### Log Categories
- **Request/Response**: HTTP request logging
- **Security**: Authentication and authorization events
- **Performance**: Operation timing and bottlenecks
- **Business**: Important business events (bookings, payments)
- **Errors**: Structured error reporting with context

### Health Checks
- **Endpoint**: `/health`
- **Metrics**: `/metrics` (Prometheus format)
- **System Info**: Uptime, memory usage, connection counts

## API Documentation

### Swagger/OpenAPI
- **Interactive UI**: `/api-docs`
- **JSON Specification**: `/api-docs.json`
- **Code Examples**: Multiple language examples
- **Authentication**: Bearer token and API key examples

### GraphQL Documentation
- **Schema Explorer**: Built-in GraphQL Playground
- **Type Definitions**: Complete schema with documentation
- **Query Examples**: Sample queries and mutations

## Development Setup

### Prerequisites
- Node.js 18+
- PostgreSQL (via Supabase)
- Redis (optional, for caching)
- Environment variables configuration

### Installation
```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your configuration

# Start development server
npm run api:dev
```

### Environment Variables
```bash
# Server
API_PORT=3001
NODE_ENV=development

# Database
VITE_SUPABASE_URL=your-supabase-url
VITE_SUPABASE_SERVICE_ROLE_KEY=your-service-key

# Authentication
JWT_SECRET=your-jwt-secret
REFRESH_TOKEN_SECRET=your-refresh-secret

# Stripe
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Redis (optional)
REDIS_URL=redis://localhost:6379

# CORS
CORS_ORIGINS=http://localhost:8080,http://localhost:3000
```

## Deployment

### Production Deployment
```bash
# Build for production
npm run build

# Start production server
npm run api:start

# Or using PM2
pm2 start ecosystem.config.js
```

### Docker Deployment
```bash
# Build image
docker build -t mariia-hub-api .

# Run container
docker run -p 3001:3001 --env-file .env.production mariia-hub-api
```

### Environment Configuration
- **Development**: Local Supabase, relaxed CORS
- **Staging**: Staging Supabase, testing configurations
- **Production**: Production Supabase, security hardened

## Performance Optimization

### Caching Strategy
- **Redis**: Session storage, rate limiting, API responses
- **Database Query Optimization**: Indexed queries, connection pooling
- **Response Compression**: Gzip compression for all responses

### Scalability Features
- **Connection Pooling**: Database connection management
- **Load Balancing**: Horizontal scaling support
- **WebSocket Scaling**: Redis adapter for multi-instance deployment

## Testing

### Unit Tests
```bash
# Run unit tests
npm run test:unit

# Run with coverage
npm run test:coverage
```

### Integration Tests
```bash
# Run integration tests
npm run test:integration

# Test API endpoints
npm run test:api
```

### Load Testing
```bash
# Run load tests
npm run test:load

# Test WebSocket connections
npm run test:websocket
```

## Polish Market Specific Features

### Localization
- **Language Support**: Polish and English
- **Currency**: PLN with EUR/USD conversion
- **Timezone**: Europe/Warsaw default
- **Date Format**: DD.MM.YYYY

### Validation Rules
- **Phone Numbers**: Polish mobile/landline validation
- **NIP**: Polish VAT number validation with checksum
- **Postal Codes**: Polish postal code format (XX-XXX)
- **Business Hours**: Polish standard business hours

### Compliance
- **GDPR**: Data protection and consent management
- **Polish Regulations**: Consumer rights and data handling
- **Payment Processing**: Polish payment methods (BLIK)

## Error Handling

### Error Types
- **ValidationError**: Input validation failures (400)
- **AuthenticationError**: Auth failures (401)
- **AuthorizationError**: Permission denied (403)
- **NotFoundError**: Resource not found (404)
- **ConflictError**: Resource conflicts (409)
- **RateLimitError**: Too many requests (429)
- **DatabaseError**: Database operation failures (500)

### Error Response Format
```json
{
  "error": true,
  "code": "VALIDATION_ERROR",
  "message": "Validation failed",
  "details": {
    "field": "email",
    "message": "Invalid email format"
  },
  "timestamp": "2024-01-01T12:00:00.000Z",
  "requestId": "req_1234567890"
}
```

## WebSocket Real-time Features

### Use Cases
- **Live Availability**: Real-time slot availability updates
- **Booking Notifications**: Instant booking status changes
- **Customer Support**: Live chat with support staff
- **Admin Alerts**: Real-time admin notifications

### Connection Management
- **Authentication**: JWT-based WebSocket authentication
- **Room Management**: Automatic room joining/leaving
- **Connection Recovery**: Automatic reconnection with state recovery
- **Graceful Degradation**: Fallback to HTTP polling

## Monitoring and Analytics

### Business Metrics
- **Booking Conversion**: Funnel tracking and analytics
- **Revenue Tracking**: Real-time revenue calculations
- **Customer Behavior**: Usage patterns and preferences
- **Service Performance**: Popular services and time slots

### Technical Metrics
- **Response Times**: Endpoint performance tracking
- **Error Rates**: Error frequency and types
- **Connection Metrics**: WebSocket connection statistics
- **Resource Usage**: Memory and CPU monitoring

## Future Enhancements

### Planned Features
- **API Versioning**: v2 endpoint planning
- **Webhook System**: External service integrations
- **Advanced Analytics**: Machine learning insights
- **Mobile API**: Optimized endpoints for mobile apps
- **Multi-tenant Support**: White-label API capabilities

### Scalability Improvements
- **Microservices**: Service decomposition
- **Event Sourcing**: Audit trail and event replay
- **CQRS**: Command query separation
- **Graph Traversal**: Complex relationship queries

## Support and Maintenance

### Monitoring Dashboards
- **Grafana**: Visual monitoring and alerting
- **Prometheus**: Metrics collection and storage
- **Log Aggregation**: Centralized log management
- **Error Tracking**: Sentry integration for error monitoring

### Backup and Recovery
- **Database Backups**: Automated Supabase backups
- **Configuration Backup**: Version-controlled configurations
- **Disaster Recovery**: Recovery procedures and testing
- **Data Export**: Customer data export capabilities

This comprehensive API ecosystem provides a solid foundation for the beauty and fitness booking platform with enterprise-grade features, security, and scalability.