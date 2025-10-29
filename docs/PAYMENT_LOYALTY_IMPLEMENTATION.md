# Payment System & Loyalty Program Implementation Guide

## Overview

This guide covers the implementation of the enhanced payment system and loyalty program for Mariia Hub. The system includes:

1. **Automated Deposit Calculations** - Service-specific deposit rules
2. **Cancellation Fee Management** - Grace periods and automated fee calculations
3. **Gift Cards & Vouchers** - Purchase and redemption system
4. **Split Payment Support** - Installment plans with interest
5. **Comprehensive Loyalty Program** - Points, tiers, and rewards
6. **Referral System** - Automated tracking and rewards

## Database Schema

### Core Tables Added

#### Payment System Tables
- `gift_cards` - Gift card management
- `gift_card_transactions` - Transaction history
- `payment_plans` - Installment payment plans
- `payment_installments` - Individual installments
- `cancellation_policies` - Configurable policies
- `cancellation_fees` - Fee tracking

#### Loyalty Program Tables
- `loyalty_program` - Program configuration
- `loyalty_tiers` - Tier management
- `customer_points` - Points tracking
- `points_transactions` - Points history
- `rewards` - Rewards catalog
- `reward_redemptions` - Redemption tracking

#### Referral System Tables
- `referral_program` - Program settings
- `referrals` - Referral relationships
- `referral_rewards` - Reward distribution

## Service Layer Architecture

### PaymentSystemService
Located at: `src/services/paymentSystemService.ts`

**Key Methods:**
- `calculateDeposit(params)` - Calculate service deposits
- `calculateCancellationFee(params)` - Compute cancellation fees
- `createPaymentPlan(params)` - Create installment plans
- `purchaseGiftCard(params)` - Generate gift cards
- `redeemGiftCard(code, amount)` - Process redemptions
- `getPaymentSummary(bookingId)` - Complete payment overview

### LoyaltyProgramService
Located at: `src/services/loyaltyProgramService.ts`

**Key Methods:**
- `awardPoints(params)` - Add points to customer account
- `redeemPoints(userId, points)` - Process point redemptions
- `getCustomerLoyaltyStatus(userId)` - Full loyalty profile
- `getAvailableRewards(userId)` - Eligible rewards
- `redeemReward(userId, rewardId)` - Claim rewards
- `generateReferralCode(params)` - Create referral codes
- `completeReferral(code, refereeId)` - Process successful referrals

## React Hooks

### Payment System Hooks
Located at: `src/hooks/usePaymentSystem.ts`

**Available Hooks:**
- `useDepositCalculation()` - Calculate service deposits
- `useCancellationFeeCalculation()` - Compute fees
- `useCreatePaymentPlan()` - Create installment plans
- `usePaymentPlan(id)` - Fetch plan details
- `usePurchaseGiftCard()` - Buy gift cards
- `useRedeemGiftCard()` - Apply gift cards
- `usePaymentSummary(bookingId)` - Payment overview

**Loyalty Hooks:**
- `useAwardPoints()` - Add points
- `useRedeemPoints()` - Use points
- `useCustomerLoyaltyStatus(userId)` - User loyalty data
- `useAvailableRewards(userId, serviceType)` - Get rewards
- `useRedeemReward()` - Claim rewards
- `useGenerateReferralCode()` - Create codes
- `useCompleteReferral()` - Process referrals

## UI Components

### Payment Components
- `PaymentPlanForm` - Installment plan creation
- `GiftCardPurchase` - Gift card buying flow
- `CancellationFeeDisplay` - Fee breakdown
- `DepositCalculator` - Real-time deposit calculation

### Loyalty Components
- `LoyaltyDashboard` - Complete loyalty overview
- `RewardCard` - Individual reward display
- `TierProgress` - Tier advancement visual
- `ReferralWidget` - Referral code sharing

### Admin Components
- `PaymentSystemAdmin` - System management dashboard
- `LoyaltyProgramConfig` - Program settings
- `RewardManagement` - Catalog management
- `AnalyticsDashboard` - Performance metrics

## Integration Points

### Booking Flow Integration

1. **Step 2: Time Selection**
   - Calculate required deposit
   - Display payment options
   - Offer gift card application

2. **Step 3: Details**
   - Show payment summary
   - Offer payment plan option
   - Apply loyalty discounts

3. **Step 4: Payment**
   - Process deposit or full payment
   - Create payment plans if selected
   - Award booking points

### Admin Dashboard Integration

1. **Analytics Tab**
   - Payment system metrics
   - Loyalty program performance
   - Revenue from payment plans

2. **Bookings Management**
   - View payment status
   - Process refunds
   - Manage payment plans

3. **Customer Management**
   - View loyalty status
   - Manual point adjustments
   - Referral tracking

## Configuration

### Environment Variables

```env
# Payment System
VITE_STRIPE_PUBLIC_KEY=pk_test_...
VITE_ENABLE_PAYMENT_PLANS=true
VITE_DEFAULT_INTEREST_RATE=5

# Loyalty Program
VITE_LOYALTY_ENABLED=true
VITE_POINTS_PER_CURRENCY=10
VITE_REFERRAL_REWARD_POINTS=200

# Gift Cards
VITE_GIFT_CARD_ENABLED=true
VITE_MIN_GIFT_CARD_AMOUNT=50
VITE_MAX_GIFT_CARD_AMOUNT=10000
```

### Default Policies

#### Deposit Rules
- Beauty services: 25% or 100 PLN minimum
- Fitness programs: 20% or 150 PLN minimum
- Lifestyle services: 30% or 200 PLN minimum

#### Cancellation Policy
- Standard: Free cancellation >24 hours
- Late: Deposit forfeiture within 24 hours
- No-show: Full charge

#### Loyalty Tiers
- Bronze: 0-499 points (1x multiplier)
- Silver: 500-1499 points (1.2x multiplier)
- Gold: 1500+ points (1.5x multiplier)

## API Integration

### Stripe Integration

```typescript
// Payment Intent Creation
const paymentIntent = await stripe.paymentIntents.create({
  amount: totalAmount * 100,
  currency: 'pln',
  metadata: {
    booking_id: bookingId,
    payment_plan: isPaymentPlan ? 'true' : 'false'
  }
});

// Payment Plan Setup
const { data: paymentPlan } = await createPaymentPlan({
  bookingId,
  totalAmount,
  numberOfInstallments: 3,
  depositAmount: calculatedDeposit
});
```

### Supabase Functions

```sql
-- Award points on booking completion
CREATE FUNCTION award_booking_points()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO points_transactions (
    customer_points_id,
    booking_id,
    transaction_type,
    points,
    balance_before,
    balance_after,
    description
  )
  VALUES (
    (SELECT id FROM customer_points WHERE user_id = NEW.user_id),
    NEW.id,
    'earned',
    FLOOR(NEW.amount_paid * 10),
    (SELECT current_balance FROM customer_points WHERE user_id = NEW.user_id),
    (SELECT current_balance FROM customer_points WHERE user_id = NEW.user_id) + FLOOR(NEW.amount_paid * 10),
    'Points earned from booking'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

## Testing Strategy

### Unit Tests
- Deposit calculation logic
- Cancellation fee computations
- Points transactions
- Referral code generation

### Integration Tests
- Complete payment flow
- Loyalty point lifecycle
- Gift card redemption
- Payment plan processing

### E2E Tests
- Full booking with payment options
- Loyalty program journey
- Admin management workflows

## Deployment Checklist

### Database Migration
1. Run migration: `20240101_payment_loyalty_system.sql`
2. Verify all tables created
3. Check RLS policies
4. Validate indexes

### Code Deployment
1. Deploy service files
2. Update React components
3. Configure environment variables
4. Run database functions

### Configuration
1. Set up Stripe webhooks
2. Configure email templates
3. Set default policies
4. Initialize loyalty program

### Testing
1. Test payment flows
2. Verify point calculations
3. Test gift card lifecycle
4. Validate admin functions

## Monitoring

### Key Metrics
- Payment plan adoption rate
- Gift card sales volume
- Loyalty program engagement
- Referral conversion rate
- Points redemption rate

### Alerts
- Failed payment plan charges
- Gift card expiry notifications
- Points即将过期 reminders
- Unusual refund patterns

## Security Considerations

### Payment Security
- PCI compliance for card handling
- Secure storage of payment methods
- Fraud detection for payment plans
- Gift card code uniqueness

### Data Protection
- PII encryption for customer data
- Secure referral code storage
- Points transaction integrity
- Audit trail for all changes

## Future Enhancements

### Phase 2 Features
- Subscription plans
- Dynamic pricing
- Advanced analytics
- Mobile wallet integration

### Phase 3 Features
- AI-powered recommendations
- Predictive analytics
- Advanced segmentation
- Partner integrations

## Support Documentation

### User Guides
- Payment plan FAQ
- Loyalty program guide
- Gift card instructions
- Referral tutorial

### Admin Documentation
- System configuration
- Troubleshooting guide
- Best practices
- API documentation

---

## Implementation Timeline

### Week 1: Database & Services
- Database schema deployment
- Service layer implementation
- Basic API endpoints
- Unit tests

### Week 2: UI Components
- Payment plan forms
- Gift card interface
- Loyalty dashboard
- Admin panels

### Week 3: Integration
- Booking flow integration
- Stripe payment setup
- Email notifications
- Testing

### Week 4: Launch Preparation
- Documentation
- Admin training
- Performance testing
- Production deployment

This implementation provides a comprehensive payment and loyalty system that enhances customer experience while providing valuable business insights and revenue opportunities.