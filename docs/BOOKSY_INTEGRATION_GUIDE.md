# Booksy Integration Implementation Guide

## Overview
This document explains the Booksy API integration implementation in the codebase and provides steps for configuring it with real Booksy credentials.

## Current Implementation

The Booksy integration has been implemented based on standard OAuth 2.0 patterns and common booking platform API structures. Here's what has been created:

### 1. Authentication (`src/integrations/booksy/auth-client.ts`)
- OAuth 2.0 implementation with authorization code flow
- Token management with automatic refresh
- PKCE (Proof Key for Code Exchange) for enhanced security

### 2. API Client (`src/integrations/booksy/api-client.ts`)
- Rate limiting (10 requests/second with burst of 50)
- Retry logic with exponential backoff
- Error handling with custom error classes
- Webhook signature verification

### 3. API Endpoints (Based on common patterns)
```typescript
// Authentication
- /oauth/authorize
- /oauth/token
- /oauth/revoke

// API Resources
- /api/v1/services          // Service catalog
- /api/v1/availability      // Time slots
- /api/v1/appointments      // Bookings
- /api/v1/clients          // Client information
- /api/v1/businesses       // Business details
```

### 4. Webhook Handler (`supabase/functions/booksy-webhook/`)
- HMAC-SHA256 signature verification
- Event handling for bookings, services, and availability
- Audit logging for all webhook events

## Configuration Required

### Step 1: Get Booksy API Credentials

1. **Apply for Booksy API Access**
   - Visit [booksy.com/business/api](https://booksy.com/business/api)
   - Apply as a business partner
   - Provide your business details and use case

2. **Create OAuth App**
   - Once approved, create an OAuth application in Booksy's developer portal
   - You'll receive:
     - `client_id`
     - `client_secret`
     - `redirect_uri` (must match your registered URL)

3. **Configure Webhooks**
   - Set up webhook endpoint: `https://your-project.supabase.co/functions/v1/booksy-webhook`
   - Subscribe to events: appointment.created, appointment.updated, appointment.cancelled

### Step 2: Update Environment Variables

Add these to your `.env.production` file:

```bash
# Booksy API Configuration
BOOKSY_CLIENT_ID="your-booksy-client-id"
BOOKSY_CLIENT_SECRET="your-booksy-client-secret"
BOOKSY_REDIRECT_URI="https://yourdomain.com/auth/booksy/callback"
BOOKSY_API_BASE_URL="https://api.booksy.com"  # or the provided Booksy API URL

# Booksy Business Configuration
BOOKSY_BUSINESS_ID="your-business-id"
BOOKSY_LOCATION_ID="your-location-id"  # if multiple locations

# Webhook Configuration
BOOKSY_WEBHOOK_SECRET="your-webhook-signature-secret"
```

### Step 3: Deploy the Webhook Function

```bash
# Deploy to Supabase
supabase functions deploy booksy-webhook

# Set webhook secret
supabase secrets set BOOKSY_WEBHOOK_SECRET=your-webhook-signature-secret
```

### Step 4: Test the Integration

1. **OAuth Flow Test**:
   ```typescript
   import { booksyAuthClient } from '@/integrations/booksy/auth-client';

   // Get authorization URL
   const authUrl = booksyAuthClient.getAuthorizationUrl();

   // Handle callback
   const tokens = await booksyAuthClient.exchangeCodeForTokens(code);
   ```

2. **API Test**:
   ```typescript
   import { booksyApiService } from '@/integrations/booksy/api-client';

   // Fetch services
   const services = await booksyApiService.getServices();

   // Sync availability
   await booksyApiService.syncAvailability();
   ```

## Implementation Notes

### Assumptions Made

Since I don't have access to Booksy's actual API documentation, the implementation is based on:

1. **OAuth 2.0 Standard**: Most SaaS platforms use this
2. **RESTful API Pattern**: Standard for booking platforms
3. **Common Endpoint Structure**: Based on similar services like Calendly, Mindbody, etc.

### What May Need Adjustment

1. **API Base URL**: Booksy might use a different URL structure
2. **Authentication Method**: They might use API keys instead of OAuth for certain endpoints
3. **Webhook Format**: The event payload structure might differ
4. **Rate Limits**: Booksy might have different rate limiting rules
5. **Endpoint Paths**: The actual API endpoints might have different paths

### Debugging Tips

1. **Enable Debug Mode**:
   ```typescript
   const apiClient = new BooksyApiClient({ debug: true });
   ```

2. **Check Webhook Logs**:
   ```sql
   SELECT * FROM booksy_webhook_logs ORDER BY created_at DESC LIMIT 10;
   ```

3. **Monitor Sync Status**:
   ```sql
   SELECT * FROM sync_logs ORDER BY created_at DESC LIMIT 10;
   ```

## Alternative Approach

If Booksy doesn't provide a public API, consider these alternatives:

1. **Booksy Biz API**: They might have a private API for enterprise clients
2. **Data Export**: Booksy allows CSV exports that can be imported
3. **Third-party Integrators**: Services like Zapier might connect to Booksy
4. **Manual Sync**: Build an import/export tool for periodic synchronization

## Support

For the most accurate Booksy API information:
- Contact Booksy's business support
- Check Booksy's developer documentation (if available)
- Review Booksy's integration partner documentation

## Security Considerations

1. **Never commit API keys to git** - use environment variables
2. **Use HTTPS** for all API calls
3. **Validate webhook signatures** to prevent unauthorized requests
4. **Implement rate limiting** to avoid hitting API limits
5. **Store tokens securely** in Supabase secrets
6. **Log all API interactions** for auditing