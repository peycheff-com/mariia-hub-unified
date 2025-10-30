# Mariia Hub SDK Documentation Hub

Welcome to the comprehensive documentation for the Mariia Hub SDK ecosystem. This documentation covers all available SDK languages and provides detailed guides, API references, and examples for integrating with the Mariia Hub beauty and fitness booking platform.

## 🚀 Quick Start

Choose your preferred programming language to get started:

- [**TypeScript/JavaScript**](./typescript/) - Browser and Node.js support
- [**Python**](./python/) - Async/await with Pydantic models
- [**PHP**](./php/) - PSR compliance and framework integrations
- [**Go**](./go/) - High-performance with context handling
- [**Ruby**](./ruby/) - Rails integration and async support
- [**Java**](./java/) - Spring Boot and Maven support
- [**C#**](./csharp/) - .NET 6+ and async/await

## 📋 Table of Contents

- [Overview](#overview)
- [Installation](#installation)
- [Authentication](#authentication)
- [Core Features](#core-features)
- [API Endpoints](#api-endpoints)
- [Polish Market Features](#polish-market-features)
- [Real-time Features](#real-time-features)
- [Error Handling](#error-handling)
- [Examples](#examples)
- [Migration Guides](#migration-guides)
- [Contributing](#contributing)

## 📖 Overview

The Mariia Hub SDK ecosystem provides comprehensive, language-specific client libraries for integrating with the Mariia Hub beauty and fitness booking platform API. Each SDK offers:

- ✅ **Full API Coverage** - Complete access to all REST, GraphQL, and WebSocket endpoints
- 🔐 **Authentication Management** - JWT, API key, and OAuth 2.0 with auto-refresh
- 🛡️ **Type Safety** - Strong typing and validation in all languages
- 🌐 **Real-time Capabilities** - WebSocket client for live updates
- 🇵🇱 **Polish Market Support** - Localized features, payment methods, and compliance
- 📊 **Rate Limiting** - Built-in rate limiting with automatic retry logic
- 💾 **Caching** - Response caching with configurable strategies
- 🔄 **Error Handling** - Comprehensive exception hierarchy

## 🛠 Installation

### TypeScript/JavaScript

```bash
npm install @mariia-hub/api-client
# or
yarn add @mariia-hub/api-client
```

### Python

```bash
pip install mariia-hub
```

### PHP

```bash
composer require mariia-hub/api
```

### Go

```bash
go get github.com/mariia-hub/client
```

### Ruby

```bash
gem install mariia-hub-api
```

### Java

```xml
<dependency>
    <groupId>com.mariia-hub</groupId>
    <artifactId>client</artifactId>
    <version>1.0.0</version>
</dependency>
```

### C#

```bash
dotnet add package MariiaHub.Client
```

## 🔑 Authentication

The SDKs support multiple authentication methods:

### API Key Authentication

```typescript
// TypeScript/JavaScript
import { createMariiaHubClient } from '@mariia-hub/api-client';

const client = createMariiaHubClient({
  api: {
    apiKey: 'your-api-key'
  }
});
```

```python
# Python
from mariia_hub import MariiaHubClient

client = MariiaHubClient(api_key="your-api-key")
```

### JWT Authentication

```typescript
// TypeScript/JavaScript
const client = createMariiaHubClient({
  api: {
    authentication: {
      type: 'jwt',
      credentials: {
        accessToken: 'your-jwt-token',
        refreshToken: 'your-refresh-token'
      }
    }
  }
});
```

```python
# Python
from mariia_hub import MariiaHubClient

client = MariiaHubClient(
    api_key="your-jwt-token",
    auth_type="jwt",
    refresh_token="your-refresh-token"
)
```

### OAuth 2.0

```typescript
// TypeScript/JavaScript
const authResponse = await client.auth.oauthLogin({
  provider: 'google',
  code: 'authorization-code'
});
```

## 🎯 Core Features

### 1. Booking Management

Create, manage, and track bookings with comprehensive lifecycle support:

```typescript
// Create booking
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
    consentTerms: true
  }
});

// Check availability
const availability = await client.bookings.checkAvailability({
  serviceId: 'service-123',
  date: '2024-01-15',
  groupSize: 2
});

// Reschedule booking
const rescheduled = await client.bookings.reschedule('booking-123', {
  newDate: '2024-01-16',
  newTime: '15:00'
});
```

### 2. Service Catalog

Browse and search through the complete service catalog:

```typescript
// List services with filters
const services = await client.services.list({
  category: 'beauty',
  locationType: 'studio',
  maxPrice: 500,
  featured: true
});

// Search services
const searchResults = await client.services.search('massage', {
  locationType: 'studio',
  duration: { min: 60, max: 120 }
});

// Get service details
const service = await client.services.get('service-123');
```

### 3. Payment Processing

Handle payments with support for multiple payment methods:

```typescript
// Create payment intent
const paymentIntent = await client.payments.createPaymentIntent({
  amount: 29900, // Amount in cents
  currency: 'PLN',
  bookingId: 'booking-123',
  paymentMethod: 'card'
});

// Process refund
const refund = await client.payments.createRefund({
  paymentId: 'payment-123',
  amount: 14900,
  reason: 'service_cancelled'
});
```

### 4. User Management

Manage user profiles and authentication:

```typescript
// Register new user
const user = await client.auth.register({
  email: 'user@example.com',
  password: 'securePassword',
  firstName: 'Jane',
  lastName: 'Doe',
  consents: {
    terms: true,
    privacy: true,
    marketing: false
  }
});

// Get current user profile
const profile = await client.auth.getCurrentUser();

// Update profile
const updated = await client.auth.updateProfile({
  firstName: 'Jane',
  lastName: 'Smith'
});
```

## 🌐 API Endpoints

The SDKs provide access to all major API endpoints:

### Bookings API
- `GET /bookings` - List bookings
- `POST /bookings` - Create booking
- `GET /bookings/{id}` - Get booking details
- `PUT /bookings/{id}/reschedule` - Reschedule booking
- `DELETE /bookings/{id}` - Cancel booking
- `POST /bookings/group` - Create group booking
- `POST /bookings/waitlist` - Add to waitlist

### Services API
- `GET /services` - List services
- `GET /services/{id}` - Get service details
- `GET /services/{id}/availability` - Check availability
- `GET /services/search` - Search services
- `POST /services/{id}/gallery` - Upload images

### Payments API
- `POST /payments/intent` - Create payment intent
- `GET /payments/{id}` - Get payment details
- `POST /payments/{id}/refund` - Create refund
- `GET /payments/{id}/invoices` - List invoices

### Authentication API
- `POST /auth/login` - User login
- `POST /auth/register` - User registration
- `POST /auth/refresh` - Refresh tokens
- `GET /auth/me` - Get current user
- `PUT /auth/profile` - Update profile

### Users API
- `GET /users/me` - Get user profile
- `PUT /users/me` - Update user profile
- `GET /users/me/bookings` - Get user bookings
- `DELETE /users/me` - Delete account

### Admin API
- `GET /admin/stats` - Get dashboard stats
- `GET /admin/users` - List users (admin)
- `GET /admin/bookings` - List all bookings (admin)
- `POST /admin/services` - Create service (admin)

## 🇵🇱 Polish Market Features

The SDKs include comprehensive support for Polish market requirements:

### Polish Payment Methods

```typescript
// BLIK payment
const payment = await client.payments.createPaymentIntent({
  amount: 29900,
  currency: 'PLN',
  polishPaymentDetails: {
    type: 'blik',
    blikCode: '123456'
  }
});

// Przelewy24
const payment = await client.payments.createPaymentIntent({
  amount: 29900,
  currency: 'PLN',
  polishPaymentDetails: {
    type: 'przelewy24',
    returnUrl: 'https://app.com/return'
  }
});
```

### Polish Validation

```typescript
// Validate Polish identifiers
import { PolishValidator } from '@mariia-hub/api-client';

const validator = new PolishValidator();

// NIP validation
const nipResult = validator.validateNIP('123-456-78-90');
console.log('NIP valid:', nipResult.valid);

// PESEL validation
const peselResult = validator.validatePESEL('80010100000');
console.log('PESEL valid:', peselResult.valid);
```

### Polish Invoicing

```typescript
// Create Polish invoice
const invoice = await client.payments.createInvoice(paymentId, {
  type: 'vat',
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

## 🔄 Real-time Features

### WebSocket Integration

```typescript
// Subscribe to booking updates
const unsubscribe = client.websockets.subscribeToBookings((message) => {
  const booking = message.data;
  console.log(`Booking ${booking.id} status: ${booking.status}`);

  if (booking.status === 'confirmed') {
    showNotification('Booking confirmed!');
  }
});

// Subscribe to availability updates
const unsubAvailability = client.websockets.subscribeToAvailability((message) => {
  updateCalendar(message.data);
});

// Subscribe to notifications
const unsubNotifications = client.websockets.subscribeToNotifications((message) => {
  showNotification(message.data);
});

// Clean up
unsubscribe();
unsubAvailability();
unsubNotifications();
```

## ⚠️ Error Handling

All SDKs provide comprehensive error handling with typed exceptions:

```typescript
try {
  const booking = await client.bookings.create(bookingData);
} catch (error) {
  if (error instanceof ValidationError) {
    console.log('Validation failed:', error.field, error.message);
  } else if (error instanceof RateLimitError) {
    console.log('Rate limited. Retry after:', error.retryAfter, 'seconds');
  } else if (error instanceof PolishMarketError) {
    console.log('Polish validation failed:', error.polishRule);
  } else if (error instanceof BookingError) {
    console.log('Booking error:', error.code, error.message);
  } else {
    console.log('Unexpected error:', error.message);
  }
}
```

## 📚 Examples

Each SDK includes comprehensive examples:

### Basic Booking Flow
- Service discovery and selection
- Availability checking
- Booking creation
- Payment processing
- Confirmation handling

### Real-time Dashboard
- WebSocket connection management
- Live booking updates
- Availability notifications
- System alerts

### Polish Market Integration
- Polish payment methods
- VAT invoicing
- Company verification
- Local validation

### Mobile Application
- Offline support
- Background sync
- Push notifications
- Local storage

### Server Integration
- Batch processing
- Background jobs
- Webhook handling
- Data synchronization

## 🔄 Migration Guides

### Version Migration

- [v0.x to v1.0](./migration/v0-to-v1.md)
- [Breaking Changes](./migration/breaking-changes.md)

### Language Migration

- [JavaScript to TypeScript](./migration/js-to-ts.md)
- [Python 2 to Python 3](./migration/python2-to-python3.md)
- [REST Client to SDK](./migration/rest-to-sdk.md)

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](./contributing.md) for details.

### Development Setup

1. Clone the repository
   ```bash
   git clone https://github.com/mariia-hub/sdk.git
   cd sdk
   ```

2. Choose your language directory
   ```bash
   cd typescript  # or python, php, go, ruby, java, csharp
   ```

3. Follow the language-specific setup instructions in each directory

### Running Tests

```bash
# TypeScript/JavaScript
npm test

# Python
pytest

# PHP
composer test

# Go
go test ./...

# Ruby
bundle exec rspec

# Java
mvn test

# C#
dotnet test
```

## 📄 License

All SDKs are licensed under the MIT License - see the [LICENSE](../LICENSE) file for details.

## 🆘 Support

- 📖 [Documentation](https://docs.mariia-hub.com/sdk)
- 🐛 [Bug Reports](https://github.com/mariia-hub/sdk/issues)
- 💬 [Discussions](https://github.com/mariia-hub/sdk/discussions)
- 📧 [Support Email](mailto:support@mariia-hub.com)

## 🗺 Roadmap

See our [Roadmap](./roadmap.md) for upcoming features and improvements.

---

**Thank you for using the Mariia Hub SDK!** 🎉

If you have any questions or need help, don't hesitate to reach out through our support channels.