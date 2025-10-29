# Capacity Management Implementation Guide

## Overview

This document describes the implementation of capacity management for time slots, allowing multiple bookings per time slot based on configurable capacity limits.

## Features

### 1. Database Schema Updates

The `availability` table has been enhanced with capacity management columns:

- `capacity` (INTEGER): Maximum number of bookings allowed per slot (default: 1)
- `current_bookings` (INTEGER): Current number of active bookings
- `service_id` (UUID): Direct reference to service for precise capacity settings
- `provider_id` (UUID): Optional provider-specific capacity management

### 2. Database Functions

#### `check_availability_capacity(service_id, start_time, end_time, group_size)`
Checks if a time slot has sufficient capacity for a booking.

**Returns:**
- `available`: Boolean indicating if slot is available
- `availability_id`: ID of the availability slot
- `remaining_capacity`: Number of remaining spots
- `total_capacity`: Total capacity for the slot
- `conflict_reason`: Reason if booking is not possible

#### `get_available_slots_with_capacity(service_id, date, duration_minutes)`
Retrieves all available slots for a date with capacity information.

**Returns slots with:**
- `capacity`: Total capacity
- `current_bookings`: Current bookings
- `available_spots`: Remaining spots
- `is_fully_booked`: Boolean indicator

#### `set_slot_capacity(availability_id, capacity, admin_id)`
Updates capacity for a specific slot (admin only).

#### `bulk_update_capacity(service_id, day_of_week, start_time, end_time, new_capacity, admin_id, weeks_ahead)`
Updates capacity for recurring slots (admin only).

### 3. Frontend Components

#### Step2TimeWithCapacity
Enhanced time selection component showing:
- Visual capacity indicators (green/orange/red)
- Available spots display (e.g., "2/4")
- Group booking support
- Real-time capacity updates

#### CapacityManagement (Admin)
Admin interface for managing capacity:
- Daily/weekly view of slots
- Inline capacity editing
- Bulk capacity updates
- Capacity utilization analytics

#### BookingConfirmationWithCapacity
Booking confirmation showing:
- Current utilization rate
- Visual capacity bar
- Alert for limited availability
- Group booking information

### 4. Service Layer

#### BookingCapacityService
Service class with methods for:
- Checking availability with capacity
- Creating capacity-aware bookings
- Canceling bookings (updates capacity)
- Retrieving capacity analytics
- Managing slot capacity

## Usage Examples

### Checking Availability

```typescript
import { bookingCapacityService } from '@/services/bookingCapacity.service';

const { data, error } = await bookingCapacityService.checkAvailabilityCapacity(
  serviceId,
  '2025-01-15T10:00:00Z',
  '2025-01-15T11:00:00Z',
  2 // group size
);

if (data?.available) {
  console.log(`${data.remaining_capacity} spots available`);
}
```

### Creating Booking with Capacity

```typescript
const { data, error } = await bookingCapacityService.createBookingWithCapacity(
  serviceId,
  startTime,
  endTime,
  bookingData,
  groupSize
);
```

### Setting Slot Capacity (Admin)

```typescript
// Single slot
await bookingCapacityService.setSlotCapacity(slotId, 5, adminId);

// Bulk update
await bookingCapacityService.bulkUpdateCapacity(
  serviceId,
  1, // Monday
  '09:00',
  '17:00',
  4, // New capacity
  adminId,
  12 // Weeks ahead
);
```

## UI Indicators

### Capacity Status Colors
- **Green** (>50% available): Plenty of spots
- **Yellow** (25-50% available): Filling up
- **Orange** (<25% available): Limited spots
- **Red** (0% available): Fully booked

### Badge Labels
- "Available" - Slots with good availability
- "Filling Up" - Slots with moderate bookings
- "Limited Spots" - Few spots remaining
- "Fully Booked" - No availability

## Edge Cases Handled

1. **Concurrent Bookings**: Database triggers prevent overbooking
2. **Cancellations**: Automatically updates capacity on cancellation
3. **Group Bookings**: Validates group size against remaining capacity
4. **Time Overlaps**: Checks for overlapping time ranges
5. **Admin Overrides**: Admins can exceed normal capacity limits

## Performance Considerations

1. **Indexes**: Created on frequently queried columns
2. **Triggers**: Automatic capacity updates on booking changes
3. **Views**: Pre-computed utilization reports
4. **Caching**: Client-side caching of availability data

## Testing

Run the test suite:
```bash
npm run test capacity-management.test.ts
```

Test cases cover:
- Availability checking with capacity
- Booking creation with capacity validation
- Capacity updates (single and bulk)
- Cancellation capacity updates
- Analytics reporting

## Migration

Apply the database migration:
```sql
-- Migration file: 20250202000000_capacity_management.sql
-- Adds capacity columns and creates necessary functions
```

## Security

- Row Level Security (RLS) policies enforced
- Admin-only functions require admin role verification
- Input validation on all capacity values (1-50 range)

## Future Enhancements

1. **Dynamic Pricing**: Adjust prices based on capacity utilization
2. **Waitlist**: Automatic waitlist when slots are full
3. **Resource Allocation**: Track multiple resources per slot
4. **Historical Analytics**: Track capacity utilization over time
5. **AI Recommendations**: Suggest optimal capacity settings