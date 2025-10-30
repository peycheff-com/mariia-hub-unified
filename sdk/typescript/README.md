# @mariia-hub/api-client

[![npm version](https://badge.fury.io/js/%40mariia-hub%2Fapi-client.svg)](https://badge.fury.io/js/%40mariia-hub%2Fapi-client)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/%3C%2F%3E-TypeScript-%230074c1.svg)](http://www.typescriptlang.org/)
[![Build Status](https://github.com/mariia-hub/sdk/workflows/CI/badge.svg)](https://github.com/mariia-hub/sdk/actions)

A comprehensive TypeScript/JavaScript SDK for the Mariia Hub beauty and fitness booking platform API.

## Features

- 🎯 **Full API Coverage** - Complete TypeScript definitions for all API endpoints
- 🔐 **Authentication Management** - JWT, API key, and OAuth 2.0 support with auto-refresh
- 🌐 **Real-time Capabilities** - WebSocket client for live updates and notifications
- 🛡️ **Error Handling** - Comprehensive error types with Polish market support
- 📊 **Rate Limiting** - Built-in rate limiting with automatic retry logic
- 💾 **Caching** - Multi-level caching with configurable strategies
- 🇵🇱 **Polish Market Support** - Localized features, payment methods, and compliance
- 🔄 **Browser & Node.js** - Works in both environments
- 📦 **Tree Shakable** - Only bundle what you use
- 🎨 **Modern TypeScript** - Strict typing with comprehensive IntelliSense

## Installation

```bash
npm install @mariia-hub/api-client
```

or

```bash
yarn add @mariia-hub/api-client
```

or

```bash
pnpm add @mariia-hub/api-client
```

## Quick Start

### Basic Usage

```typescript
import { createMariiaHubClient } from '@mariia-hub/api-client';

const client = createMariiaHubClient({
  api: {
    apiKey: 'your-api-key'
  }
});

await client.initialize();

// Get available services
const services = await client.services.list();
console.log('Available services:', services.data);

// Create a booking
const booking = await client.bookings.create({
  serviceId: 'service-123',
  timeSlot: {
    id: 'slot-123',
    date: '2024-01-15',
    time: '14:00',
    available: true,
    location: 'studio'
  },
  details: {
    clientName: 'John Doe',
    clientEmail: 'john@example.com',
    clientPhone: '+48 123 456 789',
    consentTerms: true,
    consentMarketing: false
  }
});

console.log('Booking created:', booking.data);
```

### Polish Market Configuration

```typescript
import { createPolishMarketClient } from '@mariia-hub/api-client';

const client = createPolishMarketClient({
  businessAccount: true,
  enablePolishPaymentMethods: true,
  enablePolishInvoicing: true
});

await client.initialize();

// Book with Polish payment methods
const booking = await client.bookings.create({
  // ... booking details
  paymentDetails: {
    method: 'card',
    currency: 'PLN',
    polishPaymentMethod: {
      type: 'blik',
      blikCode: '123456'
    }
  }
});
```

### Real-time Updates

```typescript
// Subscribe to booking updates
const unsubscribe = client.websockets.subscribeToBookings((message) => {
  console.log('Booking update:', message.data);
});

// Subscribe to availability changes
const unsubscribeAvailability = client.websockets.subscribeToAvailability((message) => {
  console.log('New availability:', message.data);
});

// Clean up when done
unsubscribe();
unsubscribeAvailability();
```

## Configuration

### SDK Configuration

```typescript
const client = createMariiaHubClient({
  api: {
    baseURL: 'https://api.mariia-hub.com/v1',
    timeout: 30000,
    retries: 3,
    headers: {
      'X-Custom-Header': 'value'
    }
  },
  websockets: {
    autoReconnect: true,
    maxReconnectAttempts: 5,
    heartbeatInterval: 30000
  },
  regional: {
    language: 'pl',
    currency: 'PLN',
    timeZone: 'Europe/Warsaw'
  },
  features: {
    polishMarket: {
      enabled: true,
      polishPaymentMethods: true
    },
    realTime: {
      websockets: true,
      liveAvailability: true
    }
  },
  environment: {
    name: 'production',
    debug: false
  }
});
```

### Environment-specific Configuration

```typescript
// Development
const devClient = createMariiaHubClient({
  environment: {
    name: 'development',
    debug: true,
    mockData: true
  }
});

// Production
const prodClient = createMariiaHubClient({
  environment: {
    name: 'production',
    debug: false,
    errorReporting: {
      enabled: true
    }
  }
});
```

## API Endpoints

### Bookings

```typescript
// Check availability
const availability = await client.bookings.checkAvailability({
  serviceId: 'service-123',
  date: '2024-01-15',
  groupSize: 2
});

// Create booking
const booking = await client.bookings.create(bookingRequest);

// Get user bookings
const bookings = await client.bookings.list({
  status: 'confirmed',
  page: 1,
  limit: 20
});

// Reschedule booking
const rescheduled = await client.bookings.reschedule('booking-123', {
  newDate: '2024-01-16',
  newTime: '15:00'
});

// Cancel booking
const cancelled = await client.bookings.cancel('booking-123', {
  reason: 'Customer request'
});
```

### Services

```typescript
// List services
const services = await client.services.list({
  category: 'beauty',
  featured: true,
  limit: 10
});

// Get service details
const service = await client.services.get('service-123');

// Search services
const searchResults = await client.services.search('massage', {
  maxPrice: 500,
  locationType: 'studio'
});
```

### Payments

```typescript
// Create payment intent
const paymentIntent = await client.payments.createPaymentIntent({
  amount: 29900, // 299.00 PLN in cents
  currency: 'PLN',
  bookingId: 'booking-123',
  paymentMethod: 'card'
});

// Get payment
const payment = await client.payments.getPayment('payment-123');

// Create refund
const refund = await client.payments.createRefund({
  paymentId: 'payment-123',
  amount: 14900,
  reason: 'service_cancelled'
});
```

### Authentication

```typescript
// Login
const auth = await client.auth.login({
  email: 'user@example.com',
  password: 'password123'
});

// Register
const registration = await client.auth.register({
  email: 'newuser@example.com',
  password: 'password123',
  firstName: 'Jane',
  lastName: 'Doe',
  consents: {
    terms: true,
    privacy: true,
    marketing: false
  }
});

// Get current user
const user = await client.auth.getCurrentUser();

// Update profile
const updatedUser = await client.auth.updateProfile({
  firstName: 'Jane',
  lastName: 'Smith'
});
```

## Error Handling

The SDK provides comprehensive error handling with typed error classes:

```typescript
try {
  const booking = await client.bookings.create(bookingRequest);
} catch (error) {
  if (error instanceof ValidationError) {
    console.log('Validation failed:', error.field, error.message);
  } else if (error instanceof RateLimitError) {
    console.log('Rate limited. Retry after:', error.retryAfter, 'seconds');
  } else if (error instanceof PolishMarketError) {
    console.log('Polish market validation failed:', error.polishRule);
  } else if (error instanceof BookingError) {
    console.log('Booking error:', error.code, error.message);
  } else {
    console.log('Unexpected error:', error.message);
  }
}
```

## Polish Market Features

### Polish Payment Methods

```typescript
const booking = await client.bookings.create({
  // ... other details
  paymentDetails: {
    method: 'card',
    currency: 'PLN',
    polishPaymentMethod: {
      type: 'blik', // or 'przelewy24', 'pbl'
      blikCode: '123456'
    }
  }
});
```

### Polish Invoicing

```typescript
const payment = await client.payments.createPaymentIntent({
  amount: 29900,
  currency: 'PLN',
  invoiceRequested: true,
  polishCompanyDetails: {
    companyName: 'Firma Sp. z o.o.',
    nip: '123-456-78-90',
    address: {
      street: 'ul. Jana Pawła II',
      buildingNumber: '43',
      postalCode: '00-001',
      city: 'Warszawa'
    }
  }
});
```

### Polish Validation

```typescript
import { PolishValidationUtils } from '@mariia-hub/api-client';

const validator = new PolishValidationUtils();

// Validate NIP
const nipValidation = validator.validateNIP('123-456-78-90');
console.log('NIP valid:', nipValidation.valid);

// Validate postal code
const postalValidation = validator.validatePostalCode('00-001');
console.log('Postal code valid:', postalValidation.valid);

// Validate phone number
const phoneValidation = validator.validatePhoneNumber('+48 123 456 789');
console.log('Phone valid:', phoneValidation.valid);
```

## WebSocket Integration

### Real-time Events

```typescript
// Initialize with WebSocket support
const client = createMariiaHubClient({
  websockets: {
    autoReconnect: true,
    heartbeatInterval: 30000
  }
});

await client.initialize();

// Subscribe to events
const ws = client.getWebSocketClient();

// Listen for booking updates
ws.subscribe('booking_update', (message) => {
  const booking = message.data;
  console.log(`Booking ${booking.id} status changed to ${booking.status}`);

  if (booking.status === 'confirmed') {
    showBookingConfirmedNotification(booking);
  }
});

// Listen for new availability
ws.subscribe('availability_update', (message) => {
  const availability = message.data;
  updateAvailabilityCalendar(availability);
});

// Listen for payment updates
ws.subscribe('payment_update', (message) => {
  const payment = message.data;
  if (payment.status === 'succeeded') {
    redirectToConfirmationPage(payment.bookingId);
  }
});

// Listen for notifications
ws.subscribe('notification', (message) => {
  const notification = message.data;
  showNotification(notification);
});
```

### Connection Management

```typescript
// Monitor connection state
ws.onStateChange((state) => {
  console.log('WebSocket state:', state);

  switch (state) {
    case 'connected':
      showConnectedStatus();
      break;
    case 'disconnected':
      showDisconnectedStatus();
      break;
    case 'reconnecting':
      showReconnectingStatus();
      break;
    case 'error':
      showConnectionError();
      break;
  }
});

// Get connection statistics
const stats = ws.getStats();
console.log('Connection stats:', {
  connectedAt: stats.connectedAt,
  messagesReceived: stats.messagesReceived,
  averageLatency: stats.averageLatency
});

// Manual disconnect
await ws.disconnect();
```

## Advanced Usage

### Custom Error Handlers

```typescript
const client = createMariiaHubClient({
  // ... config
});

// Register custom error handler
client.registerErrorHandler({
  canHandle: (error) => error.code === 'RATE_LIMIT_EXCEEDED',
  handle: (error) => {
    if (error instanceof RateLimitError) {
      showRateLimitDialog(error.retryAfter);
    }
  }
});
```

### Request Interceptors

```typescript
// Add logging interceptor
client.addRequestInterceptor({
  fn: async (config) => {
    console.log('Making request:', config.method, config.url);
    return config;
  }
});

// Add auth token refresh interceptor
client.addResponseInterceptor({
  error: async (error) => {
    if (error.statusCode === 401) {
      await client.getAuthManager().refreshTokens();
      return client.request(error.config.method, error.config.url, error.config.data);
    }
    throw error;
  }
});
```

### Metrics Collection

```typescript
const metrics = client.getMetricsCollector();

// Get metrics
const metricsData = metrics.getMetrics();
console.log('API metrics:', metricsData);

// Custom metrics
metrics.recordCounter('custom.event', 1, { type: 'user_action' });
metrics.recordHistogram('process.duration', 150, { step: 'validation' });
```

## Environment Variables

```bash
# API Configuration
MARIIA_HUB_API_URL=https://api.mariia-hub.com/v1
MARIIA_HUB_API_KEY=your-api-key

# WebSocket Configuration
MARIIA_HUB_WS_URL=wss://api.mariia-hub.com/ws

# Regional Settings
MARIIA_HUB_DEFAULT_LANGUAGE=pl
MARIIA_HUB_DEFAULT_CURRENCY=PLN
MARIIA_HUB_DEFAULT_TIMEZONE=Europe/Warsaw

# Feature Flags
MARIIA_HUB_POLISH_MARKET_ENABLED=true
MARIIA_HUB_WEBSOCKETS_ENABLED=true

# Debug Settings
MARIIA_HUB_DEBUG=false
MARIIA_HUB_METRICS_ENABLED=true
```

## Examples

See the [examples](./examples) directory for complete working examples:

- [Basic Booking Flow](./examples/basic-booking.ts)
- [Polish Market Integration](./examples/polish-market.ts)
- [Real-time Dashboard](./examples/realtime-dashboard.ts)
- [Mobile App Integration](./examples/mobile-app.ts)
- [Server-side Integration](./examples/server-side.ts)

## API Reference

Complete API documentation is available at [docs.mariia-hub.com/sdk/typescript](https://docs.mariia-hub.com/sdk/typescript)

### Main Classes

- **`MariiaHubClient`** - Main SDK client
- **`HttpClient`** - HTTP client with retry logic
- **`WebSocketClient`** - WebSocket client for real-time features
- **`AuthenticationManager`** - Authentication and token management
- **`RateLimitManager`** - Rate limiting and retry logic
- **`CacheManager`** - Response caching

### API Endpoints

- **`BookingsApi`** - Booking management
- **`ServicesApi`** - Service catalog
- **`PaymentsApi`** - Payment processing
- **`AuthApi`** - Authentication
- **`UsersApi`** - User management
- **`AdminApi`** - Admin functionality
- **`WebSocketApi`** - Real-time events

## Contributing

We welcome contributions! Please see our [Contributing Guide](./CONTRIBUTING.md) for details.

### Development Setup

```bash
# Clone the repository
git clone https://github.com/mariia-hub/sdk.git
cd sdk/typescript

# Install dependencies
npm install

# Run tests
npm test

# Build the SDK
npm run build

# Run in watch mode
npm run build:dev

# Lint code
npm run lint

# Type check
npm run type-check
```

## License

This project is licensed under the MIT License - see the [LICENSE](./LICENSE) file for details.

## Support

- 📖 [Documentation](https://docs.mariia-hub.com/sdk/typescript)
- 🐛 [Bug Reports](https://github.com/mariia-hub/sdk/issues)
- 💬 [Discussions](https://github.com/mariia-hub/sdk/discussions)
- 📧 [Support Email](mailto:support@mariia-hub.com)

## Changelog

See [CHANGELOG.md](./CHANGELOG.md) for a list of changes and version history.