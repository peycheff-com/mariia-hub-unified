# Offline PWA Features Documentation

## Overview

This document describes the offline Progressive Web App (PWA) features implemented for the Mariia Beauty & Fitness booking platform. The offline functionality ensures users can continue using the application even without an internet connection, with automatic synchronization when connectivity is restored.

## Features Implemented

### ✅ Cache Critical Data
- **Bookings**: User's booking history and upcoming appointments
- **Services**: Available beauty and fitness services with details
- **Availability**: Time slots for the next 7 days
- **Static Assets**: CSS, JavaScript, and images for core functionality

### ✅ Offline Booking Viewing
- View existing bookings when offline
- Access service information and descriptions
- Browse availability (cached data only)
- Responsive offline indicator showing connection status

### ✅ Sync Mechanism
- Queue booking actions (create, update, cancel) when offline
- Automatic sync when connectivity is restored
- Retry mechanism with exponential backoff (max 3 retries)
- Visual feedback for sync status

### ✅ Offline Status Indicators
- Connection status badge (online/offline)
- Pending actions counter
- Manual sync button
- Toast notifications for sync events

## Architecture

### Core Components

#### 1. OfflineManager (`src/lib/offline-manager.ts`)
- Singleton service managing offline data storage
- Uses IndexedDB for persistent storage
- Handles data caching and synchronization
- Manages action queue for offline operations

#### 2. Service Worker Enhancements (`public/sw.js`)
- Enhanced caching strategies for different content types
- Offline POST request handling
- Background sync support
- Performance monitoring

#### 3. OfflineIndicator Component (`src/components/offline/OfflineIndicator.tsx`)
- Visual indicator for connection status
- Shows pending actions count
- Manual sync trigger
- Toast notifications

#### 4. Offline Booking Service (`src/services/offline-booking.service.ts`)
- Booking operations with offline support
- Automatic fallback to cached data
- Queue management for booking actions
- Data preloading for offline use

#### 5. useOfflineSync Hook (`src/hooks/useOfflineSync.tsx`)
- React hook for offline functionality
- State management for connection status
- Automatic sync triggers
- Cache operations

### Data Storage

#### IndexedDB Structure
```javascript
mariia-offline-db/
├── bookings (key: id)
│   ├── user_id (index)
│   ├── status (index)
│   └── created_at (index)
├── services (key: id)
│   ├── category (index)
│   └── type (index)
├── availability (key: id)
│   ├── service_id (index)
│   └── date (index)
└── queue (key: id)
    └── timestamp (index)
```

#### Service Worker Caches
- **Static Cache**: HTML, CSS, JS files (7 days TTL)
- **Image Cache**: Images and media (30 days TTL)
- **API Cache**: API responses (5 minutes TTL)
- **Dynamic Cache**: Pages and dynamic content (24 hours TTL)

## Usage Examples

### Preloading Data for Offline Use
```typescript
import { offlineBookingService } from '@/services/offline-booking.service';

// Preload essential data when user logs in
await offlineBookingService.preloadOfflineData(userId);
```

### Creating Bookings Offline
```typescript
const result = await offlineBookingService.createBooking({
  service_id: 'service123',
  date: '2024-01-15',
  time: '10:00',
  user_id: 'user123'
});

if (result.queued) {
  console.log('Booking queued for sync when online');
}
```

### Checking Connection Status
```typescript
import { useOfflineSync } from '@/hooks/useOfflineSync';

const { isOnline, queueLength, syncWhenOnline } = useOfflineSync();

if (!isOnline) {
  console.log('App is offline');
  console.log(`${queueLength} actions pending sync`);
}
```

### Custom Offline Component
```tsx
import { OfflineIndicator } from '@/components/offline/OfflineIndicator';

function App() {
  return (
    <div>
      {/* Your app content */}
      <OfflineIndicator />
    </div>
  );
}
```

## Cache Strategies

### Network First (API Requests)
- Try network first
- Fall back to cache if offline
- Update cache on successful network requests
- TTL: 5 minutes

### Cache First (Images & Booking Pages)
- Serve from cache immediately
- Update in background
- TTL: 30 days for images, 24 hours for pages

### Stale While Revalidate (Static Assets)
- Serve cached version immediately
- Fetch update in background
- TTL: 7 days

## Sync Process

### When Offline
1. Actions are queued in IndexedDB
2. UI shows offline indicator
3. User can continue viewing cached data
4. New bookings/actions show as "pending"

### When Online Again
1. Automatic sync triggers
2. Queued actions sent to server
3. Successful actions removed from queue
4. Failed actions retried (max 3 times)
5. UI updated with sync results

### Background Sync
- Service Worker registers for sync events
- Sync runs even if tab is closed
- Handles large queues efficiently
- Reports sync status to UI

## Testing Offline Functionality

### Using Chrome DevTools
1. Open DevTools (F12)
2. Go to Application tab
3. Under Service Workers, check "Offline"
4. Or go to Network tab and select "Offline"

### Testing Scenarios
1. **Offline Booking Creation**: Create booking while offline, verify it's queued
2. **Offline Viewing**: Navigate to booking pages while offline
3. **Sync Recovery**: Go online and verify queued actions sync
4. **Cache Persistence**: Reload page while offline, verify data persists

## Performance Considerations

### Cache Sizes
- Bookings: Up to 100 entries
- Services: Up to 50 entries
- Availability: Up to 100 slots
- Queue: Unlimited (pruned on sync)

### Best Practices
1. Preload essential data after login
2. Clean up old cache entries regularly
3. Monitor cache hit ratios
4. Optimize IndexedDB operations
5. Use compression for large datasets

## Troubleshooting

### Common Issues

#### Cache Not Updating
- Check service worker is updated
- Verify cache TTL settings
- Clear cache in DevTools

#### Sync Not Working
- Check network connectivity
- Verify IndexedDB permissions
- Check service worker registration
- Review browser console for errors

#### Large Queue Backlog
- Manual sync trigger
- Check for failed requests
- Verify API endpoints are accessible
- Consider queue cleanup

### Debug Tools
```typescript
// Clear all offline data
await offlineManager.clearCache();

// Check queue length
const queueLength = await offlineManager.getQueueLength();

// Force sync
await offlineManager.syncWhenOnline();

// Check cached data
const cachedBookings = await offlineManager.getCachedBookings();
```

## Future Enhancements

### Planned Features
1. **Push Notifications**: Booking reminders and updates
2. **Add to Calendar**: Offline calendar integration
3. **QR Code Check-in**: Offline verification system
4. **Advanced Preloading**: Smart data prediction
5. **Conflict Resolution**: Handle sync conflicts better

### Performance Optimizations
1. **Delta Sync**: Only sync changed data
2. **Compression**: Reduce IndexedDB storage
3. **Batching**: Group multiple requests
4. **Prioritization**: Sync important actions first

## Browser Support

- ✅ Chrome/Edge 80+
- ✅ Firefox 85+
- ✅ Safari 14+
- ✅ Mobile Chrome 80+
- ✅ Mobile Safari 14+

### Required Features
- IndexedDB
- Service Workers
- Fetch API
- Cache API

## Security Considerations

- All cached data is encrypted at rest (browser-level)
- No sensitive payment data stored offline
- API tokens not persisted in cache
- Automatic cache cleanup on logout