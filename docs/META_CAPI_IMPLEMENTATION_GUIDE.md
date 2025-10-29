# Meta Conversions API (CAPI) Implementation Guide

This guide covers the complete implementation of Meta's Conversions API for server-side conversion tracking, ensuring privacy compliance and improved tracking accuracy.

## Overview

The Meta CAPI system provides:

- **Server-side event tracking** for better privacy compliance
- **Event deduplication** to prevent duplicate conversions
- **Automatic retry logic** with exponential backoff
- **Enhanced React components** for easy integration
- **Comprehensive analytics dashboard**
- **Business-specific event tracking**

## Architecture

### Core Components

1. **MetaConversionsAPI Class** (`/src/lib/meta-conversions-api.ts`)
   - Handles all CAPI communications
   - Event deduplication and retry logic
   - User data hashing for privacy

2. **MetaCAPIProvider** (`/src/components/tracking/MetaCAPIProvider.tsx`)
   - React context provider for CAPI functionality
   - Automatic user profile fetching
   - Page view tracking

3. **useMetaTracking Hook** (`/src/hooks/useMetaTracking.ts`)
   - High-level tracking functions
   - Booking funnel tracking
   - Business event tracking

4. **Trackable Components** (`/src/components/tracking/`)
   - Ready-to-use tracking components
   - Service cards with impression tracking
   - Contact forms with lead tracking

## Setup

### 1. Environment Variables

Add these to your `.env` file:

```bash
# Meta CAPI Configuration
VITE_META_ACCESS_TOKEN=your_meta_access_token
VITE_META_PIXEL_ID=your_meta_pixel_id
VITE_META_TEST_CODE=your_test_event_code  # Optional, for testing
VITE_META_API_VERSION=v18.0

# Enable CAPI in production
NODE_ENV=production
```

### 2. Database Migration

Run the migration to create necessary tables:

```sql
-- Tables are created in:
-- /supabase/migrations/20250125000000_unified_messaging_referral_system.sql
-- /supabase/migrations/20250123000001_meta_capi_functions.sql
```

### 3. App Integration

Wrap your app with the Meta CAPI initializer:

```tsx
// src/main.tsx
import { MetaCAPIInitializer } from '@/components/tracking/MetaCAPIInitializer';
import { App } from './App';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <MetaCAPIInitializer>
      <App />
    </MetaCAPIInitializer>
  </React.StrictMode>
);
```

## Usage Examples

### Basic Event Tracking

```tsx
import { useMetaTracking } from '@/hooks/useMetaTracking';

function MyComponent() {
  const {
    trackServiceView,
    trackServiceSelection,
    trackBookingCompleted,
    trackCustomConversion
  } = useMetaTracking();

  const handleServiceClick = async (service) => {
    // Track service selection
    await trackServiceSelection(service);

    // Track custom event
    await trackCustomConversion('SpecialOfferClick', {
      service_id: service.id,
      offer_type: 'discount_20_percent'
    });
  };

  return (
    // Your component JSX
  );
}
```

### Booking Flow Integration

```tsx
import { useMetaTracking } from '@/hooks/useMetaTracking';

function BookingWizard() {
  const { trackBookingFunnel } = useMetaTracking();

  // Track different booking steps
  useEffect(() => {
    trackBookingFunnel.serviceSelected(service);
  }, [service]);

  const handleTimeSlotSelected = (timeSlot) => {
    trackBookingFunnel.timeSlotSelected(timeSlot);
  };

  const handleBookingCompleted = (bookingData) => {
    trackBookingFunnel.completed(bookingData);
  };

  return (
    // Booking wizard JSX
  );
}
```

### Service Card with Tracking

```tsx
import { TrackableServiceCard } from '@/components/tracking/TrackableServiceCard';

function ServiceGrid({ services }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {services.map((service, index) => (
        <TrackableServiceCard
          key={service.id}
          service={service}
          trackingData={{
            source: 'service_grid',
            position: index + 1,
            category: 'main_services',
            list: 'beauty_services'
          }}
          onSelect={(service) => {
            // Handle service selection
            console.log('Selected:', service);
          }}
        />
      ))}
    </div>
  );
}
```

### Contact Form with Tracking

```tsx
import { TrackableContactForm } from '@/components/tracking/TrackableContactForm';

function ContactPage() {
  const handleFormSubmit = async (formData) => {
    // Your form submission logic
    await submitContactForm(formData);
  };

  return (
    <TrackableContactForm
      title="Get in Touch"
      description="We'd love to hear from you"
      trackingData={{
        formCategory: 'contact',
        formPosition: 'main',
        source: 'contact_page',
        campaignId: 'summer_2024'
      }}
      onSubmit={handleFormSubmit}
    />
  );
}
```

## Event Types

### Standard Meta Events

- **PageView**: Page visits
- **ViewContent**: Service/product views
- **AddToCart**: Service selection
- **InitiateCheckout**: Booking started
- **Purchase**: Booking completed
- **Lead**: Contact form submissions
- **CompleteRegistration**: User registration

### Custom Business Events

- **ServiceTypeSelected**: Service category selection
- **ServiceDetailedSelection**: Detailed service selection
- **LocationSelected**: Location choice
- **ServiceSearchQuery**: Search interactions
- **ServiceGridImpression**: Service card impressions
- **BookingStep**: Booking funnel progression
- **PackagePurchase**: Package bookings
- **MembershipUpgrade**: Membership changes
- **ConsultationRequest**: Consultation bookings
- **ReferralClick**: Referral link clicks

## Advanced Features

### Event Deduplication

The system automatically prevents duplicate events within a 24-hour window using event hashing.

### Retry Logic

Failed events are automatically retried with exponential backoff:

- 1st retry: 5 minutes
- 2nd retry: 10 minutes
- 3rd retry: 20 minutes
- After 3 failures: marked as permanently failed

### Custom Data Parameters

You can include custom data with any event:

```tsx
trackCustomConversion('CustomEvent', {
  standard_parameter: 'value',
  custom_business_param: 'business_value',
  user_segment: 'premium',
  campaign_source: 'instagram_ads'
});
```

### Business-Specific Tracking

```tsx
trackBusinessEvent('SpecialPromotion', {
  businessCategory: 'beauty',
  serviceLocation: 'warsaw_center',
  appointmentType: 'consultation',
  staffMember: 'anna_kowalska',
  packageType: 'bridal_package',
  membershipTier: 'vip'
}, {
  promotion_code: 'SUMMER20',
  discount_amount: 200,
  original_price: 1000
});
```

## Analytics Dashboard

Access the Meta CAPI dashboard at `/admin/meta-capi` to view:

- **Event Performance**: Success rates and volumes
- **Conversion Funnels**: Step-by-step conversion analysis
- **Daily Trends**: Time-based event patterns
- **Troubleshooting**: Failed events and retry queue status
- **Value Tracking**: Conversion value analytics

## Privacy Compliance

### Data Hashing

All personally identifiable information (PII) is automatically hashed:

- Email addresses
- Phone numbers
- Names
- Addresses

### Data Processing Options

The system uses `LDU` (Limited Data Use) processing options for enhanced privacy.

### Consent Management

Events are only tracked for users who have provided appropriate consent through the application's consent management system.

## Testing

### Test Events

Use test event codes for development:

```bash
VITE_META_TEST_CODE=TEST12345
```

### Debug Mode

Enable debug logging:

```tsx
// In development mode, all events are logged to console
if (process.env.NODE_ENV === 'development') {
  console.log('CAPI Event:', eventName, eventData);
}
```

## Monitoring

### Health Checks

Monitor the system health through:

- Retry queue status
- Event success rates
- API response times
- Error rates

### Alerts

Set up alerts for:

- Success rate below 95%
- Retry queue > 100 events
- API errors
- Failed event count spikes

## Best Practices

### 1. Event Naming

- Use PascalCase for event names
- Be descriptive but concise
- Group related events with prefixes

### 2. Data Structure

- Include all relevant context
- Use consistent data formats
- Avoid sensitive information

### 3. Error Handling

- Always wrap tracking calls in try-catch
- Provide fallback behavior
- Log errors appropriately

### 4. Performance

- Batch events when possible
- Use lazy loading for tracking components
- Minimize tracking impact on user experience

## Troubleshooting

### Common Issues

1. **Events not appearing in Meta**
   - Check access token and pixel ID
   - Verify test event codes
   - Check event formatting

2. **High failure rates**
   - Review retry queue status
   - Check API rate limits
   - Verify user data formatting

3. **Duplicate events**
   - Check deduplication window
   - Review event hash generation
   - Verify client-side tracking conflicts

### Debug Tools

- Use browser dev tools to inspect network requests
- Check Supabase logs for database errors
- Review dashboard analytics for patterns
- Monitor retry queue status

## Support

For issues and questions:

1. Check the analytics dashboard for system status
2. Review browser console for error messages
3. Consult the troubleshooting section above
4. Check Meta's CAPI documentation for API changes

## Updates

Keep the system updated by:

1. Monitoring Meta API version changes
2. Updating event schemas as needed
3. Reviewing privacy requirements regularly
4. Testing with new Meta features