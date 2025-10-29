# Booking Stores Architecture

This directory contains the specialized booking stores that have been split from the original monolithic booking store for better maintainability, separation of concerns, and scalability.

## Architecture Overview

The booking system is now organized into 8 specialized stores, each handling a specific domain of the booking functionality:

### Core Stores

1. **bookingBaseStore.ts** - Core booking state and actions
2. **bookingTypes.ts** - Shared interfaces and types
3. **index.ts** - Main exports and combined utilities

### Feature-Specific Stores

4. **bookingGroupStore.ts** - Group booking functionality
5. **bookingPricingStore.ts** - Dynamic pricing and discount logic
6. **bookingCapacityStore.ts** - Capacity management and waitlist
7. **bookingRealtimeStore.ts** - Real-time sync and optimistic updates
8. **bookingCalendarStore.ts** - Calendar and availability management
9. **bookingHistoryStore.ts** - Booking history and reschedule/cancellation

## Store Details

### 1. bookingBaseStore
**Purpose**: Core booking state and basic CRUD operations

**State**:
- `currentBooking`: Complete booking object
- `selectedService`: Currently selected service
- `selectedTimeSlot`: Selected time slot
- `bookingDetails`: Client information and preferences
- `isCreating`: Loading state for booking creation
- `error`: Error messages
- `step`, `canProceed`, `totalPrice`: Computed values

**Key Actions**:
- `selectService()` - Choose a service
- `selectTimeSlot()` - Choose a time slot
- `updateDetails()` - Update client information
- `createBooking()` - Create new booking
- `resetBooking()` - Reset all booking state

**Selectors**:
- `useBookingService()` - Get selected service
- `useBookingTimeSlot()` - Get selected time slot
- `useBookingDetails()` - Get booking details
- `useBookingStep()` - Get current step
- `useCurrentBooking()` - Get complete booking

### 2. bookingGroupStore
**Purpose**: Handle group booking functionality

**State**:
- `isGroupBooking`: Whether this is a group booking
- `groupSize`: Number of participants
- `groupParticipants`: Array of participant details

**Key Actions**:
- `setGroupBooking()` - Enable/disable group mode
- `setGroupSize()` - Set number of participants
- `addGroupParticipant()` - Add a participant
- `removeGroupParticipant()` - Remove a participant
- `updateGroupParticipant()` - Update participant details

**Selectors**:
- `useGroupBooking()` - Get group booking state
- `useGroupSize()` - Get group size
- `useGroupBookingParticipants()` - Get participants

### 3. bookingPricingStore
**Purpose**: Dynamic pricing and discount management

**State**:
- `appliedPricingRules`: Active pricing rules
- `originalPrice`: Base price before discounts
- `discountAmount`: Total discount amount

**Key Actions**:
- `applyPricingRules()` - Apply pricing rules
- `calculatePrice()` - Calculate dynamic pricing

**Selectors**:
- `useBookingPricing()` - Get pricing state
- `useFinalPrice()` - Get final calculated price
- `useDiscountAmount()` - Get discount amount

### 4. bookingCapacityStore
**Purpose**: Capacity management and waitlist functionality

**State**:
- `capacityInfo`: Available capacity information
- `waitlistMode`: Whether waitlist is active
- `waitlistEntry`: Waitlist entry details

**Key Actions**:
- `checkCapacity()` - Check availability
- `setWaitlistMode()` - Enable/disable waitlist
- `joinWaitlist()` - Join waitlist

**Selectors**:
- `useBookingCapacity()` - Get capacity info
- `useIsAvailable()` - Check if available
- `useRemainingCapacity()` - Get remaining capacity

### 5. bookingRealtimeStore
**Purpose**: Real-time synchronization and optimistic updates

**State**:
- `isConnected`: Connection status
- `syncStatus`: Current sync status
- `optimisticUpdates`: Pending updates
- `conflictDetected`: Whether conflicts exist

**Key Actions**:
- `connectRealtime()` - Connect to real-time updates
- `addOptimisticUpdate()` - Add optimistic update
- `syncWithServer()` - Sync with server
- `detectConflict()` - Check for conflicts

**Selectors**:
- `useBookingRealtime()` - Get real-time state
- `useIsConnected()` - Check connection status
- `useSyncStatus()` - Get sync status

### 6. bookingCalendarStore
**Purpose**: Calendar and availability management

**State**:
- `calendarView`: Current view (day/week/month)
- `calendarDate`: Currently focused date
- `availableTimeSlots`: Available slots
- `calendarLoading`: Loading state

**Key Actions**:
- `setCalendarView()` - Change calendar view
- `setCalendarDate()` - Change focused date
- `refreshAvailability()` - Refresh availability data

**Selectors**:
- `useBookingCalendar()` - Get calendar state
- `useAvailableTimeSlots()` - Get available slots
- `useCalendarLoading()` - Get loading state

### 7. bookingHistoryStore
**Purpose**: Booking history and post-booking operations

**State**:
- `bookingHistory`: Historical bookings
- `historyLoading`: Loading state
- `cancellationInProgress`: Cancellation status
- `resourceAllocations`: Resource allocations

**Key Actions**:
- `getBookingHistory()` - Fetch booking history
- `rescheduleBooking()` - Reschedule booking
- `cancelBooking()` - Cancel booking
- `rebookFromHistory()` - Book from history
- `exportBookingHistory()` - Export history

**Selectors**:
- `useBookingHistory()` - Get history state
- `useBookingCancellation()` - Get cancellation state
- `useResourceAllocation()` - Get allocations

### 8. bookingTypes
**Purpose**: Shared TypeScript interfaces and types

Contains all interfaces, types, and enums used across the booking stores:
- `Booking`, `BookingDetails`, `Service`, `TimeSlot`
- State and action interfaces
- Event emitter definitions

## Usage Examples

### Basic Usage (New Components)
```typescript
import { useBookingBaseStore, useBookingGroupStore } from '@/stores/booking';

function BookingComponent() {
  const selectedService = useBookingService();
  const { selectService } = useBookingBaseStore();
  const { setGroupBooking, groupSize } = useBookingGroupStore();

  const handleServiceSelect = (service) => {
    selectService(service);
    if (service.allows_groups) {
      setGroupBooking(true);
    }
  };

  return (
    <div>
      <p>Selected: {selectedService?.title}</p>
      <p>Group size: {groupSize}</p>
    </div>
  );
}
```

### Advanced Usage with Combined State
```typescript
import { useBookingState, useBookingActions } from '@/stores/booking';

function BookingWizard() {
  const bookingState = useBookingState();
  const bookingActions = useBookingActions();

  const handleNextStep = () => {
    if (bookingState.canProceed) {
      bookingActions.nextStep();
    }
  };

  return (
    <div>
      <p>Step: {bookingState.step}</p>
      <p>Service: {bookingState.selectedService?.title}</p>
      <p>Total Price: ${bookingState.totalPrice}</p>
      <button onClick={handleNextStep} disabled={!bookingState.canProceed}>
        Next
      </button>
    </div>
  );
}
```

### Backward Compatibility (Existing Code)
```typescript
import { useBookingStore } from '@/stores/bookingStore'; // Legacy import

function LegacyComponent() {
  const booking = useBookingStore();

  return (
    <div>
      <p>Service: {booking.selectedService?.title}</p>
      <button onClick={() => booking.selectService(service)}>
        Select Service
      </button>
    </div>
  );
}
```

## Inter-Store Communication

Stores communicate through several mechanisms:

### 1. Direct Store Access
```typescript
// In pricing store, access other stores
const baseStore = useBookingBaseStore.getState();
const groupStore = useBookingGroupStore.getState();
```

### 2. Event Emitter
```typescript
import { bookingEvents } from '@/stores/booking';

// Emit events
bookingEvents.emit('booking_created', bookingData);

// Listen to events
bookingEvents.on('booking_cancelled', (data) => {
  // Handle cancellation
});
```

### 3. Computed Selectors
```typescript
// Computed selector that combines multiple stores
export const useFinalPrice = () => {
  const baseStore = useBookingBaseStore();
  const pricingStore = useBookingPricingStore();
  const groupStore = useBookingGroupStore();

  // Complex calculation using multiple stores
  return calculateFinalPrice(baseStore, pricingStore, groupStore);
};
```

## Persistence and Hydration

Each store uses Zustand's persistence middleware with sessionStorage:

```typescript
persist(
  (set, get) => ({ /* store implementation */ }),
  {
    name: 'booking-base-store',
    storage: createJSONStorage(() => sessionStorage),
    partialize: (state) => ({ /* only persist certain fields */ }),
    version: 1,
    onRehydrateStorage: () => (state) => {
      logger.info('Store hydrated:', state);
    }
  }
)
```

## Testing

The stores are tested with Vitest. See `__tests__/stores.test.ts` for examples.

```bash
npm test src/stores/booking/__tests__/stores.test.ts
```

## Migration Guide

### From Legacy to New Stores

**Before (Legacy)**:
```typescript
const booking = useBookingStore();
booking.selectService(service);
booking.setGroupBooking(true);
```

**After (New - Recommended)**:
```typescript
const { selectService } = useBookingBaseStore();
const { setGroupBooking } = useBookingGroupStore();

selectService(service);
setGroupBooking(true);
```

**Or using combined hooks**:
```typescript
const { selectService, setGroupBooking } = useBookingActions();
selectService(service);
setGroupBooking(true);
```

## Best Practices

1. **Use Specific Stores**: Import only the stores you need for better tree-shaking
2. **Combine When Needed**: Use combined hooks for complex components
3. **Handle Cross-Store Logic**: Use event emitter for cross-store communication
4. **Test Store Integration**: Test how stores work together
5. **Maintain Backward Compatibility**: Legacy imports still work

## File Structure

```
src/stores/booking/
├── bookingBaseStore.ts      # Core booking functionality
├── bookingGroupStore.ts     # Group booking features
├── bookingPricingStore.ts   # Pricing and discounts
├── bookingCapacityStore.ts  # Capacity and waitlist
├── bookingRealtimeStore.ts  # Real-time synchronization
├── bookingCalendarStore.ts  # Calendar and availability
├── bookingHistoryStore.ts   # History and post-booking
├── bookingTypes.ts          # Shared types and interfaces
├── index.ts                 # Main exports and utilities
├── README.md                # This documentation
└── __tests__/
    └── stores.test.ts       # Test suite
```

## Benefits of This Architecture

1. **Separation of Concerns**: Each store handles a specific domain
2. **Better Performance**: Only subscribe to needed state changes
3. **Improved Testability**: Each store can be tested independently
4. **Scalability**: Easy to add new features without affecting existing code
5. **Maintainability**: Clear organization and reduced complexity
6. **Type Safety**: Strong TypeScript interfaces across all stores
7. **Backward Compatibility**: Existing code continues to work