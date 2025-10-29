# Supabase Functions API Documentation

This document provides comprehensive API documentation for all Supabase functions in the mariia-hub-unified project.

## Directory Structure

- **Payment Functions**: `supabase/functions/create-payment/`, `supabase/functions/create-payment-intent/`, `supabase/functions/create-booking-payment/`, `supabase/functions/refund-payment/`, `supabase/functions/stripe-webhook/`
- **Communication Functions**: `supabase/functions/send-sms/`, `supabase/functions/send-email/`, `supabase/functions/send-whatsapp/`, `supabase/functions/whatsapp-webhook/`, `supabase/functions/send-booking-confirmation/`, `supabase/functions/send-gift-card-email/`
- **Analytics Functions**: `supabase/functions/generate-feedback-analytics/`, `supabase/functions/analytics-aggregation/`
- **Review Management Functions**: `supabase/functions/ai-verify-review/`, `supabase/functions/detect-review-fraud/`, `supabase/functions/generate-review-response/`, `supabase/functions/sync-google-reviews/`
- **Feedback Functions**: `supabase/functions/process-feedback/`, `supabase/functions/trigger-feedback-requests/`, `supabase/functions/send-feedback-request/`
- **Content Management Functions**: `supabase/functions/send-email/`, `supabase/functions/generate-gift-card-pdf/`, `supabase/functions/process-feedback/`
- **SEO Functions**: `supabase/functions/generate-sitemap/`, `supabase/functions/robots-txt/`
- **Media Processing Functions**: `supabase/functions/media-processing/`, `supabase/functions/c2pa-watermark/`
- **Security Functions**: `supabase/functions/verify-booking-payment/`, `supabase/functions/cancel-booking/`, `supabase/functions/send-sms/`
- **Booking Management Functions**: `supabase/functions/generate-reschedule-link/`, `supabase/functions/apply-reschedule/`, `supabase/functions/expire-packages/`, `supabase/functions/backfill-media/`

## General Response Format

All functions return JSON responses with the following format:

```json
{
  "success": true,
  "data": {},
  "error": null
}
```

Error response format:
```json
{
  "error": "Error message",
  "details": {}
}
```

## Common Patterns

### CORS Headers
```http
Access-Control-Allow-Origin: *
Access-Control-Allow-Headers: authorization, x-client-info, apikey, content-type
```

### Authentication Types
1. **Service Key**: Uses `SUPABASE_SERVICE_ROLE_KEY`
2. **JWT Token**: Uses `Authorization: Bearer <token>`
3. **Webhook Verification**: Uses signature validation

### Error Handling
- `400 Bad Request`: Invalid parameters
- `401 Unauthorized`: Authentication failed
- `403 Forbidden`: Insufficient permissions
- `404 Not Found`: Resource not found
- `500 Internal Server Error`: Server error

---

## Payment Functions

### 1. Create Payment Intent
**Path**: `supabase/functions/create-payment-intent/index.ts`

**Purpose**: Creates a Stripe payment intent for booking payments.

**HTTP Method**: POST

**Authentication**: Service key (SUPABASE_SERVICE_ROLE_KEY)

**Request Parameters**:
- **Query**: None
- **Body**:
  ```json
  {
    "amount": number,
    "currency": string,
    "metadata": {
      "booking_id": string,
      "user_id": string
    }
  }
  ```

**Response Format**:
```json
{
  "success": true,
  "client_secret": "pi_client_secret_here"
}
```

**Status Codes**:
- `200 OK`: Payment intent created successfully
- `400 Bad Request`: Invalid amount or currency
- `500 Internal Server Error`: Payment processing failed

**Example Usage**:
```bash
curl -X POST 'https://mariia-hub.pl/functions/v1/create-payment-intent' \
  -H 'Authorization: Bearer SERVICE_KEY' \
  -H 'Content-Type: application/json' \
  -d '{
    "amount": 15000,
    "currency": "pln",
    "metadata": {
      "booking_id": "123",
      "user_id": "user-456"
    }
  }'
```

### 2. Create Booking Payment
**Path**: `supabase/functions/create-booking-payment/index.ts`

**Purpose**: Creates a complete booking payment session with multiple payment methods.

**HTTP Method**: POST

**Authentication**: Service key (SUPABASE_SERVICE_ROLE_KEY)

**Request Parameters**:
- **Query**: `?client_reference_id=<booking_id>`
- **Body**:
  ```json
  {
    "user_id": string,
    "payment_methods": ["card", "blik", "p24"],
    "success_url": string,
    "cancel_url": string
  }
  ```

**Response Format**:
```json
{
  "success": true,
  "checkout_url": "https://stripe.com/checkout/...",
  "session_id": "cs_test_..."
}
```

**Status Codes**:
- `200 OK`: Payment session created successfully
- `404 Not Found`: Booking not found
- `500 Internal Server Error`: Payment session creation failed

**Example Usage**:
```bash
curl -X POST 'https://mariia-hub.pl/functions/v1/create-booking-payment?client_reference_id=123' \
  -H 'Authorization: Bearer SERVICE_KEY' \
  -H 'Content-Type: application/json' \
  -d '{
    "user_id": "user-456",
    "payment_methods": ["card", "blik", "p24"],
    "success_url": "https://mariia-hub.pl/success",
    "cancel_url": "https://mariia-hub.pl/cancel"
  }'
```

### 3. Refund Payment
**Path**: `supabase/functions/refund-payment/index.ts`

**Purpose**: Processes refunds for bookings with detailed logging and status tracking.

**HTTP Method**: POST

**Authentication**: Service key (SUPABASE_SERVICE_ROLE_KEY)

**Request Parameters**:
- **Query**: None
- **Body**:
  ```json
  {
    "booking_id": string,
    "refund_amount": number,
    "refund_reason": string,
    "refund_type": "full" | "partial"
  }
  ```

**Response Format**:
```json
{
  "success": true,
  "refund": {
    "id": "re_...",
    "amount": 15000,
    "status": "succeeded"
  }
}
```

**Status Codes**:
- `200 OK`: Refund processed successfully
- `400 Bad Request`: Invalid refund parameters
- `404 Not Found`: Booking not found
- `500 Internal Server Error`: Refund processing failed

**Example Usage**:
```bash
curl -X POST 'https://mariia-hub.pl/functions/v1/refund-payment' \
  -H 'Authorization: Bearer SERVICE_KEY' \
  -H 'Content-Type: application/json' \
  -d '{
    "booking_id": "123",
    "refund_amount": 7500,
    "refund_reason": "Customer request",
    "refund_type": "partial"
  }'
```

### 4. Stripe Webhook
**Path**: `supabase/functions/stripe-webhook/index.ts`

**Purpose**: Handles Stripe webhook events for payment confirmations, failures, and refunds.

**HTTP Method**: POST

**Authentication**: Webhook signature verification using Stripe webhook secret

**Request Parameters**:
- **Query**: None
- **Headers**: `Stripe-Signature: <signature>`
- **Body**: Raw webhook payload

**Response Format**:
```json
{
  "status": "received",
  "event_processed": true
}
```

**Status Codes**:
- `200 OK`: Webhook processed successfully
- `400 Bad Request`: Invalid webhook payload
- `401 Unauthorized`: Invalid signature
- `500 Internal Server Error`: Event processing failed

**Example Usage**:
```bash
curl -X POST 'https://mariia-hub.pl/functions/v1/stripe-webhook' \
  -H 'Content-Type: application/json' \
  -H 'Stripe-Signature: sha256=...' \
  -d '{
    "type": "checkout.session.completed",
    "data": {
      "object": {
        "id": "cs_...",
        "amount_total": 15000,
        "metadata": {
          "booking_id": "123"
        }
      }
    }
  }'
```

### 5. Create Payment
**Path**: `supabase/functions/create-payment/index.ts`

**Purpose**: Creates a payment record in the database before payment processing.

**HTTP Method**: POST

**Authentication**: Service key (SUPABASE_SERVICE_ROLE_KEY)

**Request Parameters**:
- **Query**: None
- **Body**:
  ```json
  {
    "booking_id": string,
    "amount": number,
    "currency": string,
    "payment_method": string,
    "status": "pending"
  }
  ```

**Response Format**:
```json
{
  "success": true,
  "payment_id": "pm_123",
  "status": "pending"
}
```

**Status Codes**:
- `200 OK`: Payment record created successfully
- `400 Bad Request`: Invalid payment data
- `500 Internal Server Error`: Database operation failed

**Example Usage**:
```bash
curl -X POST 'https://mariia-hub.pl/functions/v1/create-payment' \
  -H 'Authorization: Bearer SERVICE_KEY' \
  -H 'Content-Type: application/json' \
  -d '{
    "booking_id": "123",
    "amount": 15000,
    "currency": "pln",
    "payment_method": "card",
    "status": "pending"
  }'
```

---

## Communication Functions

### 1. Send SMS
**Path**: `supabase/functions/send-sms/index.ts`

**Purpose**: Sends SMS notifications using Twilio with template-based messaging.

**HTTP Method**: POST

**Authentication**: Service key (SUPABASE_SERVICE_ROLE_KEY)

**Request Parameters**:
- **Query**: None
- **Body**:
  ```json
  {
    "to": string,
    "template": string,
    "data": {
      "name": string,
      "time": string,
      "service": string,
      "phone": string
    }
  }
  ```

**Response Format**:
```json
{
  "success": true,
  "message_id": "SM123456789012345678901234567890"
}
```

**Status Codes**:
- `200 OK`: SMS sent successfully
- `400 Bad Request`: Invalid phone number or template
- `401 Unauthorized`: Invalid API credentials
- `500 Internal Server Error`: SMS sending failed

**Example Usage**:
```bash
curl -X POST 'https://mariia-hub.pl/functions/v1/send-sms' \
  -H 'Authorization: Bearer SERVICE_KEY' \
  -H 'Content-Type: application/json' \
  -d '{
    "to": "+48123456789",
    "template": "booking_reminder",
    "data": {
      "name": "John",
      "time": "15:00",
      "service": "Manicure",
      "phone": "+48123456789"
    }
  }'
```

### 2. Send Email
**Path**: `supabase/functions/send-email/index.ts`

**Purpose**: Sends emails using Resend with dynamic templates and attachments.

**HTTP Method**: POST

**Authentication**: Service key (SUPABASE_SERVICE_ROLE_KEY)

**Request Parameters**:
- **Query**: None
- **Body**:
  ```json
  {
    "to": string,
    "subject": string,
    "template": string,
    "data": object,
    "attachments": [
      {
        "filename": string,
        "content": string,
        "type": string
      }
    ]
  }
  ```

**Response Format**:
```json
{
  "success": true,
  "message_id": "123456789012345678901234567890"
}
```

**Status Codes**:
- `200 OK`: Email sent successfully
- `400 Bad Request`: Invalid email address or template
- `500 Internal Server Error`: Email sending failed

**Example Usage**:
```bash
curl -X POST 'https://mariia-hub.pl/functions/v1/send-email' \
  -H 'Authorization: Bearer SERVICE_KEY' \
  -H 'Content-Type: application/json' \
  -d '{
    "to": "client@example.com",
    "subject": "Booking Confirmation",
    "template": "booking_confirmation",
    "data": {
      "name": "John",
      "service": "Manicure",
      "time": "2024-01-15 15:00"
    }
  }'
```

### 3. Send WhatsApp
**Path**: `supabase/functions/send-whatsapp/index.ts`

**Purpose**: Sends WhatsApp messages through Twilio with template support.

**HTTP Method**: POST

**Authentication**: Service key (SUPABASE_SERVICE_ROLE_KEY)

**Request Parameters**:
- **Query**: None
- **Body**:
  ```json
  {
    "to": string,
    "template": string,
    "data": object,
    "language": "pl" | "en" | "ua"
  }
  ```

**Response Format**:
```json
{
  "success": true,
  "message_id": "SM123456789012345678901234567890"
}
```

**Status Codes**:
- `200 OK`: WhatsApp message sent successfully
- `400 Bad Request`: Invalid phone number or template
- `500 Internal Server Error`: WhatsApp sending failed

**Example Usage**:
```bash
curl -X POST 'https://mariia-hub.pl/functions/v1/send-whatsapp' \
  -H 'Authorization: Bearer SERVICE_KEY' \
  -H 'Content-Type: application/json' \
  -d '{
    "to": "+48123456789",
    "template": "booking_reminder",
    "data": {
      "name": "John",
      "time": "15:00",
      "service": "Manicure"
    },
    "language": "pl"
  }'
```

### 4. WhatsApp Webhook
**Path**: `supabase/functions/whatsapp-webhook/index.ts`

**Purpose**: Handles incoming WhatsApp messages and events from WhatsApp Business API.

**HTTP Method**: POST

**Authentication**: 
- Webhook verification using `x-whatsapp-signature` header
- `WHATSAPP_APP_SECRET` environment variable

**Request Parameters**:
- **Query**: `?hub.mode=subscribe&hub.verify_token=<token>&hub.challenge=<challenge>`
- **Headers**: `x-whatsapp-signature: <signature>`
- **Body**: Raw webhook payload

**Response Format**:
```json
{
  "status": "success"
}
```

**Status Codes**:
- `200 OK`: Webhook processed successfully
- `403 Forbidden`: Invalid signature or verification token
- `400 Bad Request`: Invalid payload

**Example Usage**:
```bash
curl -X POST 'https://mariia-hub.pl/functions/v1/whatsapp-webhook' \
  -H 'Content-Type: application/json' \
  -H 'x-whatsapp-signature: sha256=...' \
  -d '{
    "object": "whatsapp_business_account",
    "entry": [
      {
        "id": "12345",
        "changes": [
          {
            "value": {
              "messages": [
                {
                  "id": "wamid...",
                  "from": "48123456789",
                  "text": {
                    "body": "Hello, I want to book"
                  }
                }
              ]
            }
          }
        ]
      }
    ]
  }'
```

### 5. Send Booking Confirmation
**Path**: `supabase/functions/send-booking-confirmation/index.ts`

**Purpose**: Sends multi-language booking confirmation emails with ICS calendar attachments.

**HTTP Method**: POST

**Authentication**: Service key (SUPABASE_SERVICE_ROLE_KEY)

**Request Parameters**:
- **Query**: None
- **Body**:
  ```json
  {
    "booking_id": string,
    "language": "en" | "pl" | "ua" | "ru"
  }
  ```

**Response Format**:
```json
{
  "success": true,
  "email_id": "123456789012345678901234567890",
  "ics_file": "data:text/calendar;base64,..."
}
```

**Status Codes**:
- `200 OK`: Confirmation sent successfully
- `404 Not Found`: Booking not found
- `500 Internal Server Error`: Email generation failed

**Example Usage**:
```bash
curl -X POST 'https://mariia-hub.pl/functions/v1/send-booking-confirmation' \
  -H 'Authorization: Bearer SERVICE_KEY' \
  -H 'Content-Type: application/json' \
  -d '{
    "booking_id": "123",
    "language": "pl"
  }'
```

### 6. Send Gift Card Email
**Path**: `supabase/functions/send-gift-card-email/index.ts`

**Purpose**: Sends personalized gift card emails with PDF attachments and design templates.

**HTTP Method**: POST

**Authentication**: JWT token (Authorization header)

**Request Parameters**:
- **Query**: None
- **Body**:
  ```json
  {
    "giftCardId": string,
    "scheduleDate": string (optional)
  }
  ```

**Response Format**:
```json
{
  "success": true,
  "messageId": "123456789012345678901234567890",
  "scheduled": false
}
```

**Status Codes**:
- `200 OK`: Gift card email sent successfully
- `404 Not Found`: Gift card not found
- `500 Internal Server Error**: Email generation failed

**Example Usage**:
```bash
curl -X POST 'https://mariia-hub.pl/functions/v1/send-gift-card-email' \
  -H 'Authorization: Bearer JWT_TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{
    "giftCardId": "gc_123",
    "scheduleDate": "2024-12-25T10:00:00Z"
  }'
```

---

## Analytics Functions

### 1. Generate Feedback Analytics
**Path**: `supabase/functions/generate-feedback-analytics/index.ts`

**Purpose**: Generates comprehensive analytics reports from feedback data with insights and trends.

**HTTP Method**: GET

**Authentication**: Service key (SUPABASE_SERVICE_ROLE_KEY)

**Request Parameters**:
- **Query**: `?period=<period>&service_id=<id>&location_id=<id>`

**Response Format**:
```json
{
  "success": true,
  "analytics": {
    "total_responses": 150,
    "average_rating": 4.8,
    "response_rate": 0.75,
    "trends": {
      "rating_trend": "increasing",
      "volume_trend": "stable"
    },
    "service_breakdown": [
      {
        "service_id": "123",
        "service_name": "Manicure",
        "rating": 4.9,
        "response_count": 45
      }
    ],
    "insights": [
      "Service satisfaction improved by 12%",
      "Most common feedback: Quality of service"
    ]
  }
}
```

**Status Codes**:
- `200 OK`: Analytics generated successfully
- `400 Bad Request`: Invalid period parameter
- `500 Internal Server Error`: Analytics generation failed

**Example Usage**:
```bash
curl -X GET 'https://mariia-hub.pl/functions/v1/generate-feedback-analytics?period=30d&service_id=123' \
  -H 'Authorization: Bearer SERVICE_KEY'
```

### 2. Analytics Aggregation
**Path**: `supabase/functions/analytics-aggregation/index.ts`

**Purpose**: Aggregates analytics data with caching and batch processing for performance.

**HTTP Method**: POST

**Authentication**: Service key (SUPABASE_SERVICE_ROLE_KEY)

**Request Parameters**:
- **Query**: `?cache=<bool>&batch=<bool>`
- **Body**:
  ```json
  {
    "aggregation_type": "daily" | "weekly" | "monthly",
    "metrics": ["bookings", "revenue", "services", "clients"],
    "date_range": {
      "start": "2024-01-01",
      "end": "2024-12-31"
    }
  }
  ```

**Response Format**:
```json
{
  "success": true,
  "aggregated_data": {
    "period": "2024-Q1",
    "metrics": {
      "bookings": 456,
      "revenue": 225000,
      "services": 1200,
      "clients": 234
    },
    "trends": {
      "bookings_growth": 15.2,
      "revenue_growth": 22.8
    }
  }
}
```

**Status Codes**:
- `200 OK`: Aggregation completed successfully
- `400 Bad Request`: Invalid aggregation parameters
- `500 Internal Server Error`: Aggregation failed

**Example Usage**:
```bash
curl -X POST 'https://mariia-hub.pl/functions/v1/analytics-aggregation?cache=true&batch=true' \
  -H 'Authorization: Bearer SERVICE_KEY' \
  -H 'Content-Type: application/json' \
  -d '{
    "aggregation_type": "monthly",
    "metrics": ["bookings", "revenue", "services"],
    "date_range": {
      "start": "2024-01-01",
      "end": "2024-12-31"
    }
  }'
```

---

## Review Management Functions

### 1. AI Verify Review
**Path**: `supabase/functions/ai-verify-review/index.ts`

**Purpose**: Uses AI to verify review authenticity and detect fake reviews.

**HTTP Method**: POST

**Authentication**: JWT token (Authorization header)

**Request Parameters**:
- **Query**: None
- **Body**:
  ```json
  {
    "review_id": string,
    "verification_mode": "fast" | "thorough"
  }
  ```

**Response Format**:
```json
{
  "success": true,
  "verification": {
    "status": "verified",
    "confidence": 0.95,
    "risk_score": 0.1,
    "checks": {
      "account_age": "verified",
      "review_patterns": "normal",
      "language": "authentic"
    },
    "recommendation": "approve"
  }
}
```

**Status Codes**:
- `200 OK`: Verification completed successfully
- `404 Not Found`: Review not found
- `500 Internal Server Error`: AI verification failed

**Example Usage**:
```bash
curl -X POST 'https://mariia-hub.pl/functions/v1/ai-verify-review' \
  -H 'Authorization: Bearer JWT_TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{
    "review_id": "123",
    "verification_mode": "thorough"
  }'
```

### 2. Detect Review Fraud
**Path**: `supabase/functions/detect-review-fraud/index.ts`

**Purpose**: Detects fake reviews using AI analysis and pattern recognition.

**HTTP Method**: POST

**Authentication**: Service key (SUPABASE_SERVICE_ROLE_KEY)

**Request Parameters**:
- **Query**: `?threshold=<float>`
- **Body**:
  ```json
  {
    "reviews": [
      {
        "id": string,
        "content": string,
        "rating": number,
        "author_id": string,
        "created_at": string
      }
    ]
  }
  ```

**Response Format**:
```json
{
  "success": true,
  "analysis": {
    "total_reviews": 150,
    "suspicious_reviews": 5,
    "fraud_indicators": {
      "fake_accounts": 3,
      "spam_content": 2,
      "rating_inflation": 1
    },
    "detailed_results": [
      {
        "review_id": "123",
        "fraud_score": 0.85,
        "reasons": ["New account", "Generic content"],
        "recommendation": "flag"
      }
    ]
  }
}
```

**Status Codes**:
- `200 OK`: Fraud detection completed successfully
- `400 Bad Request`: Invalid threshold
- `500 Internal Server Error`: AI analysis failed

**Example Usage**:
```bash
curl -X POST 'https://mariia-hub.pl/functions/v1/detect-review-fraud?threshold=0.7' \
  -H 'Authorization: Bearer SERVICE_KEY' \
  -H 'Content-Type: application/json' \
  -d '{
    "reviews": [
      {
        "id": "123",
        "content": "Great service!",
        "rating": 5,
        "author_id": "user_456",
        "created_at": "2024-01-15T10:00:00Z"
      }
    ]
  }'
```

### 3. Generate Review Response
**Path**: `supabase/functions/generate-review-response/index.ts`

**Purpose**: AI-generated responses to reviews with multiple tone options.

**HTTP Method**: POST

**Authentication**: JWT token (Authorization header)

**Request Parameters**:
- **Query**: None
- **Body**:
  ```json
  {
    "review_id": string,
    "tone": "professional" | "friendly" | "apologetic" | "enthusiastic"
  }
  ```

**Response Format**:
```json
{
  "success": true,
  "response": {
    "generated_text": "Thank you for your wonderful review! We're delighted to hear...",
    "tone": "professional",
    "confidence": 0.92,
    "suggestions": ["Include specific service details", "Add personal touch"]
  }
}
```

**Status Codes**:
- `200 OK`: Response generated successfully
- `404 Not Found`: Review not found
- `500 Internal Server Error`: AI generation failed

**Example Usage**:
```bash
curl -X POST 'https://mariia-hub.pl/functions/v1/generate-review-response' \
  -H 'Authorization: Bearer JWT_TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{
    "review_id": "123",
    "tone": "friendly"
  }'
```

### 4. Sync Google Reviews
**Path**: `supabase/functions/sync-google-reviews/index.ts`

**Purpose**: Synchronizes Google reviews with the database and processes them.

**HTTP Method**: GET

**Authentication**: Service key (SUPABASE_SERVICE_ROLE_KEY)

**Request Parameters**:
- **Query**: `?location_id=<id>&force=<bool>`

**Response Format**:
```json
{
  "success": true,
  "sync_result": {
    "new_reviews": 5,
    "updated_reviews": 2,
    "deleted_reviews": 0,
    "last_sync": "2024-01-15T10:00:00Z",
    "total_reviews": 150
  }
}
```

**Status Codes**:
- `200 OK`: Sync completed successfully
- `404 Not Found**: Location not found
- `500 Internal Server Error`: Sync failed

**Example Usage**:
```bash
curl -X GET 'https://mariia-hub.pl/functions/v1/sync-google-reviews?location_id=google_123&force=true' \
  -H 'Authorization: Bearer SERVICE_KEY'
```

---

## Feedback Functions

### 1. Process Feedback
**Path**: `supabase/functions/process-feedback/index.ts`

**Purpose**: Processes and categorizes user feedback with sentiment analysis.

**HTTP Method**: POST

**Authentication**: Service key (SUPABASE_SERVICE_ROLE_KEY)

**Request Parameters**:
- **Query**: None
- **Body**:
  ```json
  {
    "booking_id": string,
    "feedback_type": "service" | "staff" | "facility" | "general",
    "rating": number,
    "comment": string,
    "categories": string[]
  }
  ```

**Response Format**:
```json
{
  "success": true,
  "feedback_id": "fb_123",
  "sentiment": {
    "score": 0.85,
    "label": "positive",
    "categories": ["service_quality", "staff_friendliness"]
  },
  "follow_up_needed": true
}
```

**Status Codes**:
- `200 OK`: Feedback processed successfully
- `400 Bad Request`: Invalid feedback data
- `500 Internal Server Error`: Processing failed

**Example Usage**:
```bash
curl -X POST 'https://mariia-hub.pl/functions/v1/process-feedback' \
  -H 'Authorization: Bearer SERVICE_KEY' \
  -H 'Content-Type: application/json' \
  -d '{
    "booking_id": "123",
    "feedback_type": "service",
    "rating": 5,
    "comment": "Excellent service!",
    "categories": ["quality", "speed"]
  }'
```

### 2. Trigger Feedback Requests
**Path**: `supabase/functions/trigger-feedback-requests/index.ts`

**Purpose**: Triggers automated feedback requests based on booking events.

**HTTP Method**: POST

**Authentication**: Service key (SUPABASE_SERVICE_ROLE_KEY)

**Request Parameters**:
- **Query**: None
- **Body**:
  ```json
  {
    "event": {
      "type": "booking_completed" | "booking_cancelled" | "no_show",
      "booking_id": string,
      "user_id": string,
      "service_id": string,
      "occurred_at": string
    },
    "trigger_conditions": {
      "service_type": "beauty" | "fitness",
      "min_rating": number,
      "max_days_after_service": number
    }
  }
  ```

**Response Format**:
```json
{
  "success": true,
  "triggered_requests": [
    {
      "request_id": "fr_123",
      "channel": "email",
      "scheduled_at": "2024-01-16T10:00:00Z",
      "template": "service_feedback"
    }
  ]
}
```

**Status Codes**:
- `200 OK`: Requests triggered successfully
- `400 Bad Request`: Invalid event data
- `500 Internal Server Error`: Trigger failed

**Example Usage**:
```bash
curl -X POST 'https://mariia-hub.pl/functions/v1/trigger-feedback-requests' \
  -H 'Authorization: Bearer SERVICE_KEY' \
  -H 'Content-Type: application/json' \
  -d '{
    "event": {
      "type": "booking_completed",
      "booking_id": "123",
      "user_id": "user_456",
      "service_id": "srv_789",
      "occurred_at": "2024-01-15T09:00:00Z"
    },
    "trigger_conditions": {
      "service_type": "beauty",
      "min_rating": 3,
      "max_days_after_service": 3
    }
  }'
```

### 3. Send Feedback Request
**Path**: `supabase/functions/send-feedback-request/index.ts`

**Purpose**: Sends feedback requests to customers via email or SMS.

**HTTP Method**: POST

**Authentication**: Service key (SUPABASE_SERVICE_ROLE_KEY)

**Request Parameters**:
- **Query**: None
- **Body**:
  ```json
  {
    "user_id": string,
    "booking_id": string,
    "channel": "email" | "sms" | "whatsapp",
    "template": string,
    "language": "en" | "pl" | "ua" | "ru"
  }
  ```

**Response Format**:
```json
{
  "success": true,
  "request_id": "fr_123",
  "sent_at": "2024-01-15T10:00:00Z",
  "delivery_status": "sent"
}
```

**Status Codes**:
- `200 OK**: Request sent successfully
- `404 Not Found**: User or booking not found
- `500 Internal Server Error`: Sending failed

**Example Usage**:
```bash
curl -X POST 'https://mariia-hub.pl/functions/v1/send-feedback-request' \
  -H 'Authorization: Bearer SERVICE_KEY' \
  -H 'Content-Type: application/json' \
  -d '{
    "user_id": "user_456",
    "booking_id": "123",
    "channel": "email",
    "template": "service_feedback",
    "language": "pl"
  }'
```

---

## Content Management Functions

### 1. Send Email (Content Management)
**Path**: `supabase/functions/send-email/index.ts`

**Purpose**: Manages email content templates and sends bulk communications.

**HTTP Method**: POST

**Authentication**: Service key (SUPABASE_SERVICE_ROLE_KEY)

**Request Parameters**:
- **Query**: `?template=<name>&list=<name>`
- **Body**:
  ```json
  {
    "recipients": [
      {
        "email": string,
        "name": string,
        "data": object
      }
    ],
    "template_data": {
      "subject": string,
      "content": string,
      "variables": object
    }
  }
  ```

**Response Format**:
```json
{
  "success": true,
  "sent_count": 45,
  "failed_count": 2,
  "results": [
    {
      "recipient": "user@example.com",
      "status": "sent",
      "message_id": "123456789012345678901234567890"
    }
  ]
}
```

**Status Codes**:
- `200 OK`: Emails sent successfully
- `400 Bad Request`: Invalid email template
- `500 Internal Server Error`: Bulk sending failed

**Example Usage**:
```bash
curl -X POST 'https://mariia-hub.pl/functions/v1/send-email?template=newsletter&list=subscribers' \
  -H 'Authorization: Bearer SERVICE_KEY' \
  -H 'Content-Type: application/json' \
  -d '{
    "recipients": [
      {
        "email": "user@example.com",
        "name": "John Doe",
        "data": {
          "name": "John",
          "offer": "20% discount"
        }
      }
    ],
    "template_data": {
      "subject": "Special Offer Inside!",
      "content": "Dear {{name}}, check out our special offer...",
      "variables": {
        "name": "John",
        "offer": "20% discount"
      }
    }
  }'
```

### 2. Generate Gift Card PDF
**Path**: `supabase/functions/generate-gift-card-pdf/index.ts`

**Purpose**: Generates personalized gift card PDFs with design templates.

**HTTP Method**: POST

**Authentication**: Service key (SUPABASE_SERVICE_ROLE_KEY)

**Request Parameters**:
- **Query**: None
- **Body**:
  ```json
  {
    "giftCardId": string,
    "design": "birthday" | "holiday" | "general" | "custom"
  }
  ```

**Response Format**:
```json
{
  "success": true,
  "pdf_data": "base64_encoded_pdf",
  "file_size": 24576,
  "download_url": "https://cdn.mariiahub.pl/gift-cards/gc_123.pdf"
}
```

**Status Codes**:
- `200 OK`: PDF generated successfully
- `404 Not Found**: Gift card not found
- `500 Internal Server Error**: PDF generation failed

**Example Usage**:
```bash
curl -X POST 'https://mariia-hub.pl/functions/v1/generate-gift-card-pdf' \
  -H 'Authorization: Bearer SERVICE_KEY' \
  -H 'Content-Type: application/json' \
  -d '{
    "giftCardId": "gc_123",
    "design": "birthday"
  }'
```

### 3. Process Feedback (Content Management)
**Path**: `supabase/functions/process-feedback/index.ts`

**Purpose**: Processes user feedback for content improvement and analytics.

**HTTP Method**: POST

**Authentication**: Service key (SUPABASE_SERVICE_ROLE_KEY)

**Request Parameters**:
- **Query**: `?category=<category>&sentiment=<sentiment>`
- **Body**:
  ```json
  {
    "content_id": string,
    "feedback_text": string,
    "rating": number,
    "tags": string[],
    "user_id": string
  }
  ```

**Response Format**:
```json
{
  "success": true,
  "feedback_id": "fb_123",
  "content_analysis": {
    "sentiment": "positive",
    "topics": ["service_quality", "staff"],
    "urgency": "low"
  }
}
```

**Status Codes**:
- `200 OK`: Feedback processed successfully
- `400 Bad Request**: Invalid feedback data
- `500 Internal Server Error`: Processing failed

**Example Usage**:
```bash
curl -X POST 'https://mariia-hub.pl/functions/v1/process-feedback?category=website&sentiment=neutral' \
  -H 'Authorization: Bearer SERVICE_KEY' \
  -H 'Content-Type: application/json' \
  -d '{
    "content_id": "content_123",
    "feedback_text": "The website is easy to navigate",
    "rating": 4,
    "tags": ["usability", "design"],
    "user_id": "user_456"
  }'
```

---

## SEO Functions

### 1. Generate Sitemap
**Path**: `supabase/functions/generate-sitemap/index.ts`

**Purpose**: Generates XML sitemaps for different content types (main, beauty, fitness, blog).

**HTTP Method**: GET

**Authentication**: Service key (SUPABASE_SERVICE_ROLE_KEY)

**Request Parameters**:
- **Query**: `?type=main|beauty|fitness|blog`

**Response Format**:
```xml
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://mariiahub.pl/beauty/services/manicure</loc>
    <lastmod>2024-01-15</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>
    <xhtml:link rel="alternate" hreflang="en" href="https://mariiahub.pl/beauty/services/manicure" />
    <xhtml:link rel="alternate" hreflang="pl" href="https://mariiahub.pl/pl/beauty/services/manicure" />
  </url>
</urlset>
```

**Status Codes**:
- `200 OK`: Sitemap generated successfully
- `500 Internal Server Error**: Sitemap generation failed

**Example Usage**:
```bash
curl -X GET 'https://mariia-hub.pl/functions/v1/generate-sitemap?type=beauty' \
  -H 'Authorization: Bearer SERVICE_KEY'
```

### 2. Robots.txt
**Path**: `supabase/functions/robots-txt/index.ts`

**Purpose**: Generates robots.txt and sitemap index files.

**HTTP Method**: GET

**Request Parameters**:
- **Query**: `?type=robots|sitemap-index`

**Response Format**:
```text
User-agent: *
Allow: /
Sitemap: https://mariiahub.pl/sitemap.xml
```

**Status Codes**:
- `200 OK`: File generated successfully
- `500 Internal Server Error`: Generation failed

**Example Usage**:
```bash
curl -X GET 'https://mariia-hub.pl/functions/v1/robots-txt?type=robots'
```

---

## Media Processing Functions

### 1. Media Processing
**Path**: `supabase/functions/media-processing/index.ts`

**Purpose**: Processes media files with thumbnails, watermarks, compression, and AI analysis.

**HTTP Method**: POST

**Authentication**: Service key (SUPABASE_SERVICE_ROLE_KEY)

**Request Parameters**:
- **Query**: `?job_type=<type>&priority=<int>`
- **Body**:
  ```json
  {
    "asset_id": string,
    "job_data": {
      "dimensions": {
        "width": number,
        "height": number
      },
      "quality": number,
      "watermark": {
        "text": string,
        "position": "top-left" | "top-right" | "bottom-left" | "bottom-right"
      }
    }
  }
  ```

**Response Format**:
```json
{
  "success": true,
  "job_id": "mp_123",
  "processing_time": 2.5,
  "results": {
    "thumbnail": {
      "url": "https://cdn.mariiahub.pl/thumbs/123.jpg",
      "dimensions": { "width": 150, "height": 150 }
    },
    "compressed": {
      "url": "https://cdn.mariiahub.pl/compressed/123.jpg",
      "file_size": 24576
    }
  }
}
```

**Status Codes**:
- `200 OK`: Processing completed successfully
- `404 Not Found**: Asset not found
- `500 Internal Server Error`: Processing failed

**Example Usage**:
```bash
curl -X POST 'https://mariia-hub.pl/functions/v1/media-processing?job_type=thumbnail&priority=1' \
  -H 'Authorization: Bearer SERVICE_KEY' \
  -H 'Content-Type: application/json' \
  -d '{
    "asset_id": "media_123",
    "job_data": {
      "dimensions": { "width": 150, "height": 150 },
      "quality": 80
    }
  }'
```

### 2. C2PA Watermark
**Path**: `supabase/functions/c2pa-watermark/index.ts`

**Purpose**: Creates C2PA-compliant digital signatures and watermarks for media authenticity.

**HTTP Methods**: POST (sign, verify), GET (manifest)

**Authentication**: JWT token (Authorization header)

**Request Parameters**:
- **Query**: `/sign` or `/verify` or `/manifest/<id>`
- **Body (sign)**:
  ```json
  {
    "media_asset_id": string,
    "manifest_data": {
      "title": string,
      "description": string,
      "assertions": [
        {
          "label": string,
          "assertion_data": object
        }
      ]
    },
    "signature_data": object
  }
  ```

**Response Format (sign)**:
```json
{
  "success": true,
  "manifest_id": "c2pa_123",
  "status": "signed"
}
```

**Response Format (verify)**:
```json
{
  "verified": true,
  "manifest": {
    "validation_details": {
      "verified": true,
      "manifest_integrity": true,
      "asset_integrity": true,
      "signature_valid": true
    }
  }
}
```

**Status Codes**:
- `200 OK`: Operation completed successfully
- `400 Bad Request`: Invalid parameters
- `404 Not Found**: Asset not found
- `500 Internal Server Error`: Operation failed

**Example Usage (sign)**:
```bash
curl -X POST 'https://mariia-hub.pl/functions/v1/c2pa-watermark/sign' \
  -H 'Authorization: Bearer JWT_TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{
    "media_asset_id": "media_123",
    "manifest_data": {
      "title": "Service Photo",
      "description": "Verified service photo",
      "assertions": [
        {
          "label": "authenticity",
          "assertion_data": { "verified": true }
        }
      ]
    }
  }'
```

**Example Usage (verify)**:
```bash
curl -X POST 'https://mariia-hub.pl/functions/v1/c2pa-watermark/verify' \
  -H 'Authorization: Bearer JWT_TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{
    "media_asset_id": "media_123"
  }'
```

---

## Security Functions

### 1. Verify Booking Payment
**Path**: `supabase/functions/verify-booking-payment/index.ts`

**Purpose**: Verifies payment completion and validates booking status.

**HTTP Method**: POST

**Authentication**: Service key (SUPABASE_SERVICE_ROLE_KEY)

**Request Parameters**:
- **Query**: None
- **Body**:
  ```json
  {
    "booking_id": string,
    "payment_intent_id": string
  }
  ```

**Response Format**:
```json
{
  "success": true,
  "verified": true,
  "payment_status": "succeeded",
  "booking_status": "confirmed",
  "validations": {
    "amount_matches": true,
    "currency_correct": true,
    "payment_confirmed": true
  }
}
```

**Status Codes**:
- `200 OK`: Verification completed successfully
- `400 Bad Request**: Verification data missing
- `404 Not Found**: Booking not found
- `500 Internal Server Error`: Verification failed

**Example Usage**:
```bash
curl -X POST 'https://mariia-hub.pl/functions/v1/verify-booking-payment' \
  -H 'Authorization: Bearer SERVICE_KEY' \
  -H 'Content-Type: application/json' \
  -d '{
    "booking_id": "123",
    "payment_intent_id": "pi_123456789"
  }'
```

### 2. Cancel Booking
**Path**: `supabase/functions/cancel-booking/index.ts`

**Purpose**: Handles booking cancellation with payment processing and notifications.

**HTTP Method**: POST

**Authentication**: JWT token (Authorization header)

**Request Parameters**:
- **Query**: `?cancellation_type=client|admin|system`
- **Body**:
  ```json
  {
    "booking_id": string,
    "cancellation_reason": string,
    "notify_client": boolean,
    "refund_amount": number (optional)
  }
  ```

**Response Format**:
```json
{
  "success": true,
  "booking": {
    "id": "123",
    "status": "cancelled",
    "cancelled_at": "2024-01-15T10:00:00Z",
    "refund": {
      "processed": true,
      "amount": 7500,
      "refunded_at": "2024-01-15T10:05:00Z"
    }
  },
  "notifications": {
    "client_notified": true,
    "admin_notified": true
  }
}
```

**Status Codes**:
- `200 OK`: Booking cancelled successfully
- `404 Not Found**: Booking not found
- `403 Forbidden**: Insufficient permissions
- `500 Internal Server Error`: Cancellation failed

**Example Usage**:
```bash
curl -X POST 'https://mariia-hub.pl/functions/v1/cancel-booking?cancellation_type=client' \
  -H 'Authorization: Bearer JWT_TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{
    "booking_id": "123",
    "cancellation_reason": "Client request",
    "notify_client": true,
    "refund_amount": 7500
  }'
```

---

## Booking Management Functions

### 1. Generate Reschedule Link
**Path**: `supabase/functions/generate-reschedule-link/index.ts`

**Purpose**: Generates secure rescheduling links for bookings.

**HTTP Method**: POST

**Authentication**: JWT token (Authorization header)

**Request Parameters**:
- **Query**: None
- **Body**:
  ```json
  {
    "booking_id": string,
    "valid_hours": number,
    "max_attempts": number
  }
  ```

**Response Format**:
```json
{
  "success": true,
  "reschedule_link": "https://mariiahub.pl/reschedule?token=abc123...",
  "valid_until": "2024-01-15T18:00:00Z",
  "attempts": 0
}
```

**Status Codes**:
- `200 OK`: Link generated successfully
- `404 Not Found`: Booking not found
- `500 Internal Server Error`: Generation failed

**Example Usage**:
```bash
curl -X POST 'https://mariia-hub.pl/functions/v1/generate-reschedule-link' \
  -H 'Authorization: Bearer JWT_TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{
    "booking_id": "123",
    "valid_hours": 24,
    "max_attempts": 3
  }'
```

### 2. Apply Reschedule
**Path**: `supabase/functions/apply-reschedule/index.ts`

**Purpose**: Processes reschedule requests with validation and availability checking.

**HTTP Method**: POST

**Authentication**: Service key (SUPABASE_SERVICE_ROLE_KEY)

**Request Parameters**:
- **Query**: `?booking_id=<id>&new_time=<timestamp>`
- **Body**:
  ```json
  {
    "reschedule_token": string,
    "new_datetime": string,
    "service_duration": number
  }
  ```

**Response Format**:
```json
{
  "success": true,
  "booking": {
    "id": "123",
    "new_datetime": "2024-01-16T15:00:00Z",
    "status": "rescheduled",
    "old_datetime": "2024-01-15T15:00:00Z"
  },
  "availability": {
    "confirmed": true,
    "conflicts": []
  }
}
```

**Status Codes**:
- `200 OK`: Reschedule applied successfully
- `400 Bad Request**: Invalid reschedule data
- `409 Conflict**: Time slot not available
- `500 Internal Server Error`: Processing failed

**Example Usage**:
```bash
curl -X POST 'https://mariia-hub.pl/functions/v1/apply-reschedule?booking_id=123&new_time=2024-01-16T15:00:00Z' \
  -H 'Authorization: Bearer SERVICE_KEY' \
  -H 'Content-Type: application/json' \
  -d '{
    "reschedule_token": "abc123",
    "new_datetime": "2024-01-16T15:00:00Z",
    "service_duration": 60
  }'
```

### 3. Expire Packages
**Path**: `supabase/functions/expire-packages/index.ts`

**Purpose**: Automatically expires unused service packages and sends notifications.

**HTTP Method**: POST

**Authentication**: Service key (SUPABASE_SERVICE_ROLE_KEY)

**Request Parameters**:
- **Query**: `?dry_run=<bool>&notifications=<bool>`
- **Body**:
  ```json
  {
    "expiry_date": string,
    "grace_period_days": number,
    "notification_template": string
  }
  ```

**Response Format**:
```json
{
  "success": true,
  "expiry_results": {
    "total_packages": 15,
    "expired_packages": 5,
    "notified_users": 4,
    "failed_notifications": 0
  },
  "expired_packages": [
    {
      "package_id": "pkg_123",
      "user_id": "user_456",
      "expired_at": "2024-01-15T00:00:00Z",
      "value": 200
    }
  ]
}
```

**Status Codes**:
- `200 OK**: Expiry process completed successfully
- `400 Bad Request**: Invalid expiry parameters
- `500 Internal Server Error`: Expiry process failed

**Example Usage**:
```bash
curl -X POST 'https://mariia-hub.pl/functions/v1/expire-packages?dry_run=false&notifications=true' \
  -H 'Authorization: Bearer SERVICE_KEY' \
  -H 'Content-Type: application/json' \
  -d '{
    "expiry_date": "2024-01-15T00:00:00Z",
    "grace_period_days": 7,
    "notification_template": "package_expiry_warning"
  }'
```

### 4. Backfill Media
**Path**: `supabase/functions/backfill-media/index.ts`

**Purpose**: Backfills media assets for existing services with processing and optimization.

**HTTP Method**: POST

**Authentication**: Service key (SUPABASE_SERVICE_ROLE_KEY)

**Request Parameters**:
- **Query**: `?service_id=<id>&batch_size=<int>`
- **Body**:
  ```json
  {
    "media_assets": [
      {
        "service_id": string,
        "file_path": string,
        "media_type": "image" | "video",
        "metadata": object
      }
    ]
  }
  ```

**Response Format**:
```json
{
  "success": true,
  "backfill_results": {
    "processed_assets": 45,
    "failed_assets": 2,
    "success_rate": 0.96,
    "processing_time": 120.5
  },
  "failed_assets": [
    {
      "asset_id": "media_123",
      "error": "File format not supported"
    }
  ]
}
```

**Status Codes**:
- `200 OK`: Backfill completed successfully
- `400 Bad Request**: Invalid backfill data
- `500 Internal Server Error**: Backfill failed

**Example Usage**:
```bash
curl -X POST 'https://mariia-hub.pl/functions/v1/backfill-media?service_id=123&batch_size=10' \
  -H 'Authorization: Bearer SERVICE_KEY' \
  -H 'Content-Type: application/json' \
  -d '{
    "media_assets": [
      {
        "service_id": "srv_123",
        "file_path": "/path/to/image.jpg",
        "media_type": "image",
        "metadata": {
          "alt_text": "Service description",
          "caption": "Beautiful service result"
        }
      }
    ]
  }'
```

---

## Rate Limiting

Most functions implement rate limiting to prevent abuse:

- **Payment Functions**: 10 requests per minute per user
- **Communication Functions**: 50 requests per minute per user
- **Analytics Functions**: 5 requests per minute
- **Review Functions**: 20 requests per minute per user
- **Feedback Functions**: 30 requests per minute per user
- **Content Functions**: 25 requests per minute per user
- **SEO Functions**: 100 requests per minute (publicly accessible)
- **Media Functions**: 20 requests per minute per user
- **Security Functions**: 5 requests per minute per user
- **Booking Functions**: 15 requests per minute per user

## Error Handling

All functions implement consistent error handling with the following status codes:

- `200 OK`: Request successful
- `400 Bad Request`: Invalid parameters or malformed request
- `401 Unauthorized`: Authentication failed or invalid token
- `403 Forbidden`: Insufficient permissions
- `404 Not Found`: Resource not found
- `409 Conflict`: Resource conflict (e.g., time slot unavailable)
- `429 Too Many Requests`: Rate limit exceeded
- `500 Internal Server Error`: Server error
- `503 Service Unavailable`: Service temporarily unavailable

## Webhook Signature Verification

Functions that handle webhooks (Stripe, WhatsApp) implement signature verification:

1. Extract signature from request headers
2. Compute HMAC-SHA256 hash of request body
3. Compare with provided signature
4. Reject if signatures don't match

This ensures webhook requests come from trusted sources and haven't been tampered with.

## Database Integration

All functions use the Supabase client with:

- **Service Role Key**: For administrative operations
- **JWT Tokens**: For user-specific operations
- **Row Level Security (RLS)**: For data access control
- **Database Transactions**: For complex operations requiring atomicity

## Performance Considerations

- Functions use caching for frequently accessed data
- Batch processing for operations that can be parallelized
- Optimized database queries with proper indexing
- Connection pooling for efficient database access
- Async processing for long-running operations

## Monitoring and Logging

All functions include comprehensive logging for:

- Request/response tracking
- Error handling and debugging
- Performance metrics
- Security events
- Audit trails for compliance

## Security Best Practices

- Input validation and sanitization
- Parameterized queries to prevent SQL injection
- Secure storage of sensitive data
- Encryption of sensitive information
- Rate limiting to prevent abuse
- CORS protection for cross-origin requests
- JWT token validation for authentication

---

This documentation provides a comprehensive overview of all Supabase functions in the mariia-hub-unified project, covering their purposes, API specifications, authentication requirements, and usage examples.
