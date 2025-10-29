# Deposit System Implementation Guide

## Overview

The automated deposit calculation system provides a flexible and transparent way to manage deposits for high-value services. The system includes configurable rules, automated calculations, refund processing, and comprehensive analytics.

## Architecture

### Core Components

1. **Database Layer** (`supabase/migrations/20250204000000_deposit_system.sql`)
   - `deposit_rules` table - Configurable deposit rules
   - `deposit_transactions` table - Transaction tracking
   - Database functions for calculations and refunds

2. **Service Layer**
   - `depositService.ts` - Core deposit calculations and management
   - `depositRefundService.ts` - Refund processing and policies

3. **UI Components**
   - Enhanced `Step4PaymentCompliant.tsx` - Deposit display in payment flow
   - `DepositManagement.tsx` - Admin dashboard for managing deposits

4. **Analytics Integration**
   - Enhanced analytics tracking for deposit events
   - Comprehensive reporting and insights

## Features

### 1. Deposit Rules Engine

The rules engine supports flexible configuration:

- **Service-based rules**: Apply to specific services or service types
- **Price-based rules**: Trigger based on service price ranges
- **Time-based rules**: Apply to last-minute bookings
- **Group booking rules**: Different deposits for groups
- **Loyalty integration**: Tier-based deposit exemptions

#### Rule Types

```sql
-- Fixed amount deposit
deposit_type = 'fixed'
deposit_amount = 200  -- Fixed 200 PLN

-- Percentage deposit
deposit_type = 'percentage'
deposit_amount = 20   -- 20% of service price
```

#### Refund Policies

1. **Refundable**: Full refund if cancelled within specified timeframe
2. **Non-refundable**: No refunds under any circumstances
3. **Partial**: Percentage refund based on timing

### 2. Automated Calculations

The system automatically calculates deposits when:

- A booking is created
- Service details are updated
- Price changes occur
- Special conditions are met

#### Calculation Flow

1. Check service-specific rules first
2. Apply service-type rules if no specific rule found
3. Consider price ranges and booking timing
4. Apply highest priority rule
5. Calculate final deposit amount

### 3. Payment Integration

Deposits are integrated into the existing payment flow:

- **Card payments**: Only deposit amount charged initially
- **Transfer payments**: Deposit required within 24 hours
- **Cash payments**: Deposit collected at confirmation

### 4. Refund System

Automated refund processing includes:

- **Policy-based calculations**: Automatic refund amount determination
- **Special circumstances**: Override policies for valid reasons
- **Stripe integration**: Seamless refund processing
- **Notification system**: Email alerts for refunds

#### Special Circumstances

The system recognizes special circumstances that override normal policies:

- Medical emergencies (with documentation)
- Family bereavement
- Severe weather events
- COVID-19 related issues
- Other emergencies

### 5. Analytics and Reporting

Comprehensive tracking includes:

- Deposit revenue metrics
- Refund rates and reasons
- Service-type breakdowns
- Customer behavior patterns

## Implementation Details

### Database Schema

#### Deposit Rules Table

```sql
CREATE TABLE deposit_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id UUID REFERENCES services(id),
  service_type TEXT NOT NULL,
  price_min DECIMAL(10,2),
  price_max DECIMAL(10,2),
  deposit_type TEXT NOT NULL,
  deposit_amount DECIMAL(10,2) NOT NULL,
  refund_policy TEXT NOT NULL,
  days_before_refund INTEGER DEFAULT 7,
  priority INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true
);
```

#### Deposit Transactions Table

```sql
CREATE TABLE deposit_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES bookings(id),
  deposit_amount DECIMAL(10,2) NOT NULL,
  deposit_status TEXT DEFAULT 'pending',
  refund_amount DECIMAL(10,2) DEFAULT 0,
  refund_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### Service Integration

#### Using the Deposit Service

```typescript
import { depositService } from '@/services/depositService';

// Calculate deposit for a booking
const calculation = await depositService.calculateDepositAmount(
  serviceId,
  'beauty',
  1000, // Price in PLN
  {
    bookingDate: new Date('2024-06-15'),
    groupSize: 1
  }
);

if (calculation.deposit_required) {
  console.log(`Deposit required: ${calculation.deposit_amount} PLN`);
  console.log(`Refund policy: ${calculation.refund_policy}`);
}
```

#### Processing Refunds

```typescript
import { depositRefundService } from '@/services/depositRefundService';

const refundResult = await depositRefundService.processRefundRequest({
  bookingId: 'booking-123',
  reason: 'Customer medical emergency',
  requestedBy: 'customer'
});

console.log(`Refund amount: ${refundResult.refundAmount} PLN`);
console.log(`Status: ${refundResult.refundStatus}`);
```

### Frontend Integration

The payment component automatically handles deposits:

```typescript
// The Step4PaymentCompliant component:
// 1. Calculates deposits on load
// 2. Displays deposit information clearly
// 3. Updates payment flow accordingly
// 4. Creates deposit transactions
// 5. Tracks analytics events
```

### Analytics Tracking

Deposit events are automatically tracked:

```typescript
import { AnalyticsService } from '@/lib/analytics';

// Track deposit requirement
AnalyticsService.trackDepositRequired({
  booking_id: 'booking-123',
  service_id: 'service-456',
  service_type: 'beauty',
  deposit_amount: 200,
  deposit_type: 'fixed',
  refund_policy: 'refundable',
  total_amount: 1000,
  currency: 'PLN'
});
```

## Default Rules

The system includes sensible default rules:

1. **Beauty Services**
   - 500+ PLN: 20% deposit, refundable 3 days before
   - 1000+ PLN: 30% deposit, partial refund 7 days before
   - PMU services: 200 PLN fixed deposit

2. **Fitness Services**
   - 300+ PLN: 25% deposit, refundable 5 days before

3. **Lifestyle Services**
   - 400+ PLN: 15% deposit, non-refundable

4. **Last-minute Bookings**
   - Within 48 hours: 100% deposit, non-refundable

## Admin Management

The admin dashboard provides:

- **Rule Management**: Create, edit, and delete deposit rules
- **Transaction Monitoring**: View all deposit transactions
- **Analytics Dashboard**: Comprehensive deposit metrics
- **Refund Processing**: Manual refund capabilities

### Managing Rules

1. Navigate to Admin → Deposit Management
2. Click "Add Rule" to create a new rule
3. Configure:
   - Service type and price range
   - Deposit amount and type
   - Refund policy
   - Special conditions
4. Set priority for rule precedence
5. Save and activate

### Viewing Analytics

The analytics dashboard shows:

- Total deposits collected
- Refund rates by service type
- Forfeited deposits
- Average deposit amounts
- Customer behavior patterns

## Testing

### Test Scenarios

1. **Basic Deposit Calculation**
   - Service: 600 PLN beauty treatment
   - Expected: 20% = 120 PLN deposit

2. **Last-minute Booking**
   - Booking: 24 hours before service
   - Expected: 100% non-refundable deposit

3. **Group Booking**
   - 5 people, 200 PLN per person
   - Expected: 25% of total = 250 PLN

4. **Refund Processing**
   - Cancel 5 days before, 7-day policy
   - Expected: Full refund

5. **Special Circumstance**
   - Medical emergency with documentation
   - Expected: Full refund regardless of policy

### Testing Checklist

- [ ] Deposits calculate correctly for all service types
- [ ] Price ranges trigger appropriate rules
- [ ] Priority system works correctly
- [ ] Refunds process according to policies
- [ ] Special circumstances override works
- [ ] Analytics events fire correctly
- [ ] Admin dashboard functions properly
- [ ] Email notifications send correctly

## Migration Guide

### Existing Bookings

Existing bookings are unaffected:
- No deposits applied retroactively
- New rules only apply to future bookings
- Migration script ensures clean transition

### Data Updates

```sql
-- Update existing bookings with deposit fields
UPDATE bookings
SET
  deposit_required = false,
  deposit_amount = 0,
  balance_due = original_price
WHERE deposit_required IS NULL;
```

## Best Practices

### Rule Configuration

1. **Keep rules simple** - Avoid overly complex conditions
2. **Use clear priorities** - Higher numbers override lower
3. **Test thoroughly** - Verify calculations before activation
4. **Document changes** - Track rule modifications
5. **Monitor performance** - Regular analytics reviews

### Customer Communication

1. **Clear disclosure** - Always show deposit terms
2. **Transparent policies** - Explain refund conditions
3. **Prompt notifications** - Immediate refund confirmations
4. **Support availability** - Help with deposit questions

### Financial Management

1. **Separate tracking** - Monitor deposit revenue separately
2. **Regular reconciliation** - Match deposits with transactions
3. **Refund timing** - Process refunds promptly
4. **Audit trail** - Maintain complete records

## Troubleshooting

### Common Issues

1. **Deposit Not Calculating**
   - Check if rules are active
   - Verify service type matches
   - Confirm price range conditions

2. **Incorrect Amount**
   - Review rule priority
   - Check for overlapping rules
   - Verify calculation logic

3. **Refund Issues**
   - Confirm payment method supports refunds
   - Check Stripe configuration
   - Verify transaction status

4. **Analytics Not Tracking**
   - Ensure analytics initialized
   - Check event parameters
   - Verify data layer setup

### Debug Mode

Enable debug logging:

```typescript
// In development
localStorage.setItem('debug-deposits', 'true');

// Check console for deposit calculation logs
```

## Future Enhancements

### Planned Features

1. **Dynamic Pricing Integration**
   - Demand-based deposit adjustments
   - Seasonal deposit variations

2. **Advanced Refund Options**
   - Store credit for forfeited deposits
   - Flexible rescheduling policies

3. **Customer Tiers**
   - VIP deposit exemptions
   - Loyalty-based deposit reductions

4. **Multi-currency Support**
   - Currency-specific deposit rules
   - Automatic currency conversion

5. **API Integration**
   - External deposit management
   - Third-party analytics platforms

## Support

For support with the deposit system:

1. Check this documentation first
2. Review analytics for patterns
3. Contact technical support
4. Consult the development team

## Security Considerations

- All deposit amounts are server-validated
- Refund requests require proper authentication
- Audit trail maintained for all transactions
- PCI compliance for payment processing
- Regular security reviews recommended