# Service Layer API Documentation

This document describes the frontend service layer architecture and APIs in the Mariia Hub platform.

## Table of Contents

- [Overview](#overview)
- [Core Services](#core-services)
- [API Client Configuration](#api-client-configuration)
- [Error Handling](#error-handling)
- [Response Format](#response-format)
- [Service Categories](#service-categories)

## Overview

The service layer is organized into several categories, each handling specific business logic:

- **Booking Services** - Manage appointments and scheduling
- **Payment Services** - Handle transactions and payment processing
- **User Services** - Manage user profiles and authentication
- **Analytics Services** - Track usage and generate insights
- **Notification Services** - Send emails, SMS, and push notifications
- **Admin Services** - Administrative operations and content management
- **Integration Services** - Third-party service integrations

## API Client Configuration

All services use a standardized API client with consistent configuration:

```typescript
// src/lib/api-client.ts
import { createClient } from '@supabase/supabase-js';
import { supabaseUrl, supabaseAnonKey } from '@/lib/env';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
  db: {
    schema: 'public',
  },
  global: {
    headers: {
      'x-application-name': 'mariia-hub',
    },
  },
});
```

## Error Handling

All services implement a consistent error handling pattern:

```typescript
// src/lib/api-error.ts
export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
    public details?: any
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

// Standard error response format
interface ErrorResponse {
  error: {
    code: string;
    message: string;
    details?: any;
  };
  timestamp: string;
  requestId: string;
}
```

## Response Format

All API responses follow a consistent format:

```typescript
// Success response
interface SuccessResponse<T> {
  data: T;
  success: true;
  timestamp: string;
  requestId: string;
}

// Paginated response
interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  success: true;
  timestamp: string;
}
```

## Service Categories

### 1. Booking Services

Location: `src/services/booking*.ts`

#### BookingService
Main service for managing booking operations.

```typescript
class BookingService {
  /**
   * Create a new booking
   */
  async createBooking(data: CreateBookingDto): Promise<Booking> {
    // Implementation
  }

  /**
   * Get booking by ID
   */
  async getBookingById(id: string): Promise<Booking> {
    // Implementation
  }

  /**
   * Update booking status
   */
  async updateBookingStatus(
    id: string,
    status: BookingStatus
  ): Promise<Booking> {
    // Implementation
  }

  /**
   * Get user bookings
   */
  async getUserBookings(
    userId: string,
    options?: BookingQueryOptions
  ): Promise<PaginatedResponse<Booking>> {
    // Implementation
  }
}
```

**API Endpoints:**
- `POST /bookings` - Create booking
- `GET /bookings/:id` - Get booking details
- `PUT /bookings/:id/status` - Update booking status
- `GET /users/:userId/bookings` - Get user bookings
- `DELETE /bookings/:id` - Cancel booking

### 2. Payment Services

Location: `src/services/payment*.ts`

#### PaymentService
Handles payment processing with Stripe integration.

```typescript
class PaymentService {
  /**
   * Create payment intent
   */
  async createPaymentIntent(
    amount: number,
    currency: string,
    metadata?: PaymentMetadata
  ): Promise<Stripe.PaymentIntent> {
    // Implementation
  }

  /**
   * Process payment
   */
  async processPayment(
    paymentIntentId: string
  ): Promise<PaymentResult> {
    // Implementation
  }

  /**
   * Refund payment
   */
  async refundPayment(
    paymentId: string,
    amount?: number
  ): Promise<RefundResult> {
    // Implementation
  }
}
```

**API Endpoints:**
- `POST /payments/intent` - Create payment intent
- `POST /payments/process` - Process payment
- `POST /payments/refund` - Refund payment
- `GET /payments/:id` - Get payment details

### 3. User Services

Location: `src/services/user*.ts`

#### UserService
Manages user profiles and preferences.

```typescript
class UserService {
  /**
   * Get user profile
   */
  async getUserProfile(userId: string): Promise<UserProfile> {
    // Implementation
  }

  /**
   * Update user profile
   */
  async updateUserProfile(
    userId: string,
    data: UpdateProfileDto
  ): Promise<UserProfile> {
    // Implementation
  }

  /**
   * Get user preferences
   */
  async getUserPreferences(userId: string): Promise<UserPreferences> {
    // Implementation
  }
}
```

**API Endpoints:**
- `GET /users/:id/profile` - Get user profile
- `PUT /users/:id/profile` - Update user profile
- `GET /users/:id/preferences` - Get user preferences
- `POST /users/auth/refresh` - Refresh authentication token

### 4. Notification Services

Location: `src/services/notification*.ts`

#### NotificationService
Sends various types of notifications.

```typescript
class NotificationService {
  /**
   * Send email notification
   */
  async sendEmail(data: EmailDto): Promise<SendResult> {
    // Implementation
  }

  /**
   * Send SMS notification
   */
  async sendSMS(data: SMSDto): Promise<SendResult> {
    // Implementation
  }

  /**
   * Send push notification
   */
  async sendPushNotification(
    tokens: string[],
    message: PushMessageDto
  ): Promise<SendResult> {
    // Implementation
  }
}
```

**API Endpoints:**
- `POST /notifications/email` - Send email
- `POST /notifications/sms` - Send SMS
- `POST /notifications/push` - Send push notification
- `GET /notifications/history` - Get notification history

### 5. Analytics Services

Location: `src/services/analytics*.ts`

#### AnalyticsService
Tracks and analyzes user behavior.

```typescript
class AnalyticsService {
  /**
   * Track event
   */
  async trackEvent(
    event: string,
    properties?: Record<string, any>
  ): Promise<void> {
    // Implementation
  }

  /**
   * Get booking analytics
   */
  async getBookingAnalytics(
    startDate: Date,
    endDate: Date
  ): Promise<BookingAnalytics> {
    // Implementation
  }
}
```

**API Endpoints:**
- `POST /analytics/events` - Track event
- `GET /analytics/bookings` - Get booking analytics
- `GET /analytics/revenue` - Get revenue analytics
- `GET /analytics/users` - Get user analytics

### 6. Admin Services

Location: `src/services/admin/*.ts`

#### AdminService
Administrative operations for platform management.

```typescript
class AdminService {
  /**
   * Get dashboard statistics
   */
  async getDashboardStats(): Promise<DashboardStats> {
    // Implementation
  }

  /**
   * Manage services
   */
  async manageServices(
    action: 'create' | 'update' | 'delete',
    data: ServiceDto
  ): Promise<Service> {
    // Implementation
  }
}
```

**API Endpoints:**
- `GET /admin/dashboard/stats` - Dashboard statistics
- `GET /admin/users` - User management
- `GET /admin/bookings` - Booking management
- `POST /admin/services` - Service management

### 7. Integration Services

Location: `src/services/*integration*.ts`

#### BooksyIntegrationService
Integrates with Booksy platform.

```typescript
class BooksyIntegrationService {
  /**
   * Sync bookings with Booksy
   */
  async syncBookings(): Promise<SyncResult> {
    // Implementation
  }

  /**
   * Import services from Booksy
   */
  async importServices(): Promise<Service[]> {
    // Implementation
  }
}
```

## API Authentication

All API requests require authentication:

```typescript
// JWT token in Authorization header
const headers = {
  'Authorization': `Bearer ${token}`,
  'Content-Type': 'application/json',
};

// Service role key for admin operations
const serviceHeaders = {
  'Authorization': `Bearer ${serviceRoleKey}`,
  'apikey': serviceRoleKey,
};
```

## Rate Limiting

API endpoints have the following rate limits:

- **Public endpoints**: 100 requests/minute
- **Authenticated users**: 1000 requests/minute
- **Admin endpoints**: 5000 requests/minute
- **Webhooks**: No limit (with authentication)

## Caching Strategy

Services implement multi-level caching:

1. **Memory Cache**: 5 minutes for frequently accessed data
2. **Redis Cache**: 1 hour for computed results
3. **Browser Cache**: Static assets (24 hours)

```typescript
// Example cache implementation
const getCachedData = async (key: string, fetcher: () => Promise<any>) => {
  // Check memory cache first
  let data = memoryCache.get(key);

  if (!data) {
    // Check Redis
    data = await redis.get(key);

    if (!data) {
      // Fetch from database
      data = await fetcher();
      // Cache in Redis
      await redis.setex(key, 3600, data);
    }

    // Cache in memory
    memoryCache.set(key, data, { ttl: 300000 });
  }

  return data;
};
```

## Real-time Updates

Services subscribe to real-time updates via Supabase Realtime:

```typescript
// Subscribe to booking changes
const subscription = supabase
  .channel('bookings')
  .on('postgres_changes',
    { event: '*', schema: 'public', table: 'bookings' },
    (payload) => handleBookingChange(payload)
  )
  .subscribe();

// Subscribe to availability updates
const availabilitySubscription = supabase
  .channel('availability')
  .on('postgres_changes',
    { event: 'UPDATE', schema: 'public', table: 'availability_slots' },
    (payload) => handleAvailabilityChange(payload)
  )
  .subscribe();
```

## Best Practices

1. **Error Handling**: Always wrap API calls in try-catch blocks
2. **Type Safety**: Use TypeScript interfaces for all API contracts
3. **Pagination**: Implement cursor-based pagination for large datasets
4. **Validation**: Validate all inputs before processing
5. **Logging**: Log all API calls with correlation IDs
6. **Testing**: Mock API responses for unit tests

## Testing

Services include comprehensive test coverage:

```typescript
// Example test setup
import { renderHook, waitFor } from '@testing-library/react';
import { useBookingService } from '@/hooks/useBookingService';

describe('BookingService', () => {
  it('should create booking successfully', async () => {
    const { result } = renderHook(() => useBookingService());

    const booking = await result.current.createBooking({
      serviceId: 'service-123',
      startTime: '2024-01-01T10:00:00Z',
      userId: 'user-123',
    });

    expect(booking).toBeDefined();
    expect(booking.status).toBe('pending');
  });
});
```

## Monitoring

All services are monitored with:

- **Health checks**: `/health` endpoint for each service
- **Metrics**: Prometheus metrics for API performance
- **Tracing**: OpenTelemetry for request tracing
- **Alerts**: Slack/email alerts for failures

## Conclusion

The service layer provides a robust, scalable foundation for the Mariia Hub platform. Services are designed to be:

- **Modular**: Each service handles a specific domain
- **Testable**: Comprehensive test coverage
- **Performant**: Caching and optimization strategies
- **Reliable**: Error handling and retry logic
- **Secure**: Authentication and authorization controls

For more information about specific services, refer to their individual documentation files in the `src/services/` directory.