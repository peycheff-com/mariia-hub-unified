# Cross-Platform Integration Guide

This guide explains how to integrate the cross-platform synchronization system into your beauty/fitness booking platform.

## Overview

The cross-platform system provides:
- **Real-time data synchronization** across web, iOS, and Android
- **Conflict resolution** for concurrent bookings
- **Unified user experience** with consistent booking flows
- **Cross-platform notifications** with intelligent routing
- **Cloud backup and restoration** for device migration
- **Device-specific optimizations** and analytics

## Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Web App       │    │   iOS App       │    │  Android App    │
│                 │    │                 │    │                 │
│ • React 18      │    │ • React Native  │    │ • React Native  │
│ • TypeScript    │    │ • TypeScript    │    │ • TypeScript    │
│ • PWA Support   │    │ • Native APIs   │    │ • Native APIs   │
└─────────┬───────┘    └─────────┬───────┘    └─────────┬───────┘
          │                      │                      │
          └──────────────────────┼──────────────────────┘
                                 │
                    ┌─────────────┴─────────────┐
                    │    Supabase Backend       │
                    │                           │
                    │ • PostgreSQL Database     │
                    │ • Realtime Subscriptions  │
                    │ • Auth & Storage          │
                    │ • Edge Functions          │
                    └───────────────────────────┘
```

## Database Schema

The cross-platform system adds the following tables:

### Core Tables
- **`user_devices`** - Registry of user devices across platforms
- **`sync_logs`** - Logs all synchronization activities
- **`cross_platform_notifications`** - Cross-platform notification queue
- **`user_preferences_backup`** - User preferences backup for device migration
- **`offline_operations_queue`** - Queue for offline operations

### Supporting Tables
- **`device_notification_settings`** - Per-device notification preferences
- **`analytics_events`** - Cross-platform analytics events
- **`analytics_performance_metrics`** - Performance tracking by platform

## Integration Steps

### 1. Database Migration

Run the migration to add cross-platform tables:

```sql
-- The migration is in: supabase/migrations/20241030000000_cross_platform_sync.sql
```

### 2. Frontend Integration

#### Wrap your app with the cross-platform providers:

```tsx
// src/App.tsx
import React from 'react';
import { CrossPlatformProvider } from '@/contexts/CrossPlatformContext';
import { OptimisticUpdateProvider } from '@/components/cross-platform/OptimisticUpdateProvider';
import { SyncStatusIndicator } from '@/components/cross-platform/SyncStatusIndicator';

function App() {
  return (
    <CrossPlatformProvider>
      <OptimisticUpdateProvider>
        <YourExistingApp />
        <SyncStatusIndicator position="top-right" />
      </OptimisticUpdateProvider>
    </CrossPlatformProvider>
  );
}
```

#### Initialize device registration:

```tsx
// src/components/DeviceInitializer.tsx
import { useEffect } from 'react';
import { useCrossPlatform } from '@/contexts/CrossPlatformContext';

export const DeviceInitializer: React.FC = () => {
  const { getDeviceInfo } = useCrossPlatform();

  useEffect(() => {
    // Automatically register device on app load
    getDeviceInfo();
  }, [getDeviceInfo]);

  return null;
};
```

### 3. Booking Flow Integration

Replace your existing booking components with the unified cross-platform version:

```tsx
// src/pages/booking.tsx
import { UnifiedBookingFlow } from '@/components/cross-platform/UnifiedBookingFlow';

export default function BookingPage() {
  return (
    <UnifiedBookingFlow
      initialStep="choose"
      onBookingComplete={(bookingId) => {
        console.log('Booking completed:', bookingId);
      }}
      onStepChange={(step) => {
        console.log('Step changed to:', step);
      }}
    />
  );
}
```

### 4. Cross-Platform Services

#### Initialize services in your app entry point:

```tsx
// src/main.tsx
import { crossPlatformSyncService } from '@/services/cross-platform-sync.service';
import { deviceOptimizationService } from '@/services/device-optimization.service';
import { crossPlatformAnalyticsService } from '@/services/cross-platform-analytics.service';

// Initialize services
crossPlatformSyncService.initialize();
deviceOptimizationService.initialize();
crossPlatformAnalyticsService.initialize();
```

### 5. API Integration

Your API endpoints are already set up at:
- `/api/cross-platform/register-device` - Device registration
- `/api/cross-platform/sync-data` - Data synchronization
- `/api/cross-platform/notifications/send` - Notification delivery
- `/api/analytics/events` - Analytics tracking

## Usage Examples

### Syncing Data Across Devices

```tsx
import { useCrossPlatform } from '@/contexts/CrossPlatformContext';

function BookingComponent({ bookingId }) {
  const { syncStatus, triggerSync } = useCrossPlatform();

  const handleBookingUpdate = async (bookingData) => {
    // Optimistic update
    setLocalBookingData(bookingData);

    // Sync across devices
    await crossPlatformSyncService.syncData(
      'booking',
      bookingId,
      bookingData,
      'update'
    );
  };

  return (
    <div>
      <p>Sync Status: {syncStatus?.isOnline ? 'Online' : 'Offline'}</p>
      <button onClick={triggerSync}>Sync Now</button>
    </div>
  );
}
```

### Cross-Platform Notifications

```tsx
import { useCrossPlatform } from '@/contexts/CrossPlatformContext';

function NotificationComponent() {
  const { queueNotification } = useCrossPlatform();

  const sendNotification = async () => {
    await queueNotification(
      'Booking Reminder',
      'Your appointment is tomorrow at 2:00 PM',
      'booking_reminder',
      {
        priority: 8,
        data: { bookingId: '123' }
      }
    );
  };

  return <button onClick={sendNotification}>Send Reminder</button>;
}
```

### Backup and Restore

```tsx
import { BackupManager } from '@/components/cross-platform/BackupManager';

function SettingsPage() {
  return (
    <div>
      <h2>Settings</h2>
      <BackupManager showAdvanced={true} />
    </div>
  );
}
```

### Conflict Resolution

The system automatically handles conflicts, but you can provide manual resolution:

```tsx
import { ConflictResolutionDialog } from '@/components/cross-platform/ConflictResolutionDialog';

function App() {
  const [conflict, setConflict] = useState(null);

  useEffect(() => {
    const handleConflict = (event) => {
      setConflict(event.detail);
    };

    window.addEventListener('syncConflictResolution', handleConflict);
    return () => window.removeEventListener('syncConflictResolution', handleConflict);
  }, []);

  return (
    <ConflictResolutionDialog
      isOpen={!!conflict}
      conflict={conflict}
      onResolve={(resolution) => {
        console.log('Conflict resolved:', resolution);
        setConflict(null);
      }}
      onCancel={() => setConflict(null)}
    />
  );
}
```

## Platform-Specific Features

### Web (PWA)

- Service Worker for offline support
- Push notifications via Web Push API
- Local storage for caching
- Responsive design for all screen sizes

### iOS Native

- Push notifications via APNS
- Biometric authentication
- Background sync
- Native performance optimizations

### Android Native

- Push notifications via FCM
- Biometric authentication
- Background sync
- Material Design adaptations

## Performance Optimization

The system includes automatic performance optimization:

```tsx
import { deviceOptimizationService } from '@/services/device-optimization.service';

// Get device capabilities
const capabilities = deviceOptimizationService.getCapabilities();

// Get optimization recommendations
const recommendations = deviceOptimizationService.getOptimizationRecommendations();

// Update settings based on device capabilities
deviceOptimizationService.updateSettings({
  animationsEnabled: capabilities.performanceScore > 50,
  highQualityImages: capabilities.downlink > 2
});
```

## Analytics

Track cross-platform user behavior:

```tsx
import { crossPlatformAnalyticsService } from '@/services/cross-platform-analytics.service';

// Track events
crossPlatformAnalyticsService.trackEvent('user_action', 'booking_completed', {
  bookingId: '123',
  value: 150,
  platform: 'web'
});

// Track user journeys
crossPlatformAnalyticsService.startJourney('booking_flow');
crossPlatformAnalyticsService.addJourneyStep('service_selected', { serviceId: '456' });
crossPlatformAnalyticsService.completeJourney('booking_flow', { bookingId: '123' });
```

## Testing

### Unit Tests

```tsx
// src/test/cross-platform.test.tsx
import { renderHook } from '@testing-library/react';
import { useCrossPlatform } from '@/contexts/CrossPlatformContext';

describe('CrossPlatform', () => {
  it('should sync data across devices', async () => {
    const { result } = renderHook(() => useCrossPlatform());

    // Test sync functionality
    expect(result.current.syncStatus).toBeDefined();
  });
});
```

### E2E Tests

```tsx
// tests/e2e/cross-platform-sync.spec.ts
import { test, expect } from '@playwright/test';

test('cross-platform booking synchronization', async ({ page }) => {
  // Test booking flow with sync
  await page.goto('/booking');
  await page.click('[data-testid="service-1"]');
  await page.click('[data-testid="time-slot-10:00"]');
  await page.click('[data-testid="continue-to-details"]');

  // Verify sync indicator appears
  await expect(page.locator('[data-testid="sync-status"]')).toBeVisible();
});
```

## Deployment

### Environment Variables

Add these to your `.env.production`:

```bash
# Cross-platform settings
VITE_ENABLE_CROSS_PLATFORM=true
VITE_DEFAULT_SYNC_TIMEOUT=30000
VITE_MAX_RETRY_ATTEMPTS=3

# Notification settings
VITE_ENABLE_PUSH_NOTIFICATIONS=true
VITE_FCM_VAPID_KEY=your_vapid_key

# Performance settings
VITE_ENABLE_PERFORMANCE_MONITORING=true
VITE_ANALYTICS_ENDPOINT=/api/analytics/events
```

### Database Setup

1. Run the migration in your Supabase project
2. Enable Row Level Security (RLS) policies
3. Set up real-time subscriptions
4. Configure edge functions if needed

### Service Worker

Register the service worker for PWA functionality:

```tsx
// src/service-worker-registration.ts
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js')
    .then(registration => {
      console.log('SW registered:', registration);
    })
    .catch(error => {
      console.log('SW registration failed:', error);
    });
}
```

## Troubleshooting

### Common Issues

1. **Sync Conflicts**: Check the conflict resolution dialog and network connectivity
2. **Notification Issues**: Verify push token registration and permissions
3. **Performance Problems**: Review device optimization settings
4. **Offline Issues**: Check service worker registration and cache strategies

### Debug Mode

Enable debug logging:

```tsx
// Enable debug mode
localStorage.setItem('cross_platform_debug', 'true');
```

### Monitoring

Monitor cross-platform health:

```tsx
import { crossPlatformAnalyticsService } from '@/services/cross-platform-analytics.service';

// Get platform metrics
const metrics = await crossPlatformAnalyticsService.getCrossPlatformMetrics();
console.log('Platform health:', metrics);
```

## Best Practices

1. **Always wrap optimistic updates** with error handling
2. **Test offline scenarios** thoroughly
3. **Monitor sync performance** and conflict rates
4. **Use device-specific optimizations** for better UX
5. **Implement proper error boundaries** for sync failures
6. **Respect user preferences** for notifications and quiet hours
7. **Regularly test backup/restore** functionality

## Support

For issues and questions:
1. Check the console for error messages
2. Review the network tab for API failures
3. Verify database permissions and RLS policies
4. Test with different device capabilities and network conditions

This cross-platform system ensures a seamless experience for users across all their devices while maintaining data consistency and providing intelligent conflict resolution.